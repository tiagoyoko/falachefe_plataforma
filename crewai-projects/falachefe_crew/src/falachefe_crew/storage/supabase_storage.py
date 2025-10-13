#!/usr/bin/env python3
"""
Supabase Vector Storage para CrewAI
====================================

Storage customizado que integra CrewAI com Supabase pgvector,
substituindo SQLite local por armazenamento centralizado e escalável.

Tabelas usadas:
- agent_memories: Armazena conteúdo das memórias
- memory_embeddings: Armazena vetores para busca semântica
"""

import os
import json
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime
from supabase import create_client, Client
from crewai.memory.storage.interface import Storage
import openai

logger = logging.getLogger(__name__)


class SupabaseVectorStorage(Storage):
    """
    Storage customizado para CrewAI usando Supabase com pgvector.
    
    Benefícios:
    - Centralizado no Supabase (não depende de arquivo local)
    - Busca vetorial otimizada com pgvector
    - Backup automático do Supabase
    - Compartilhado entre instâncias
    - Integrado com resto do sistema
    """
    
    def __init__(
        self,
        supabase_url: Optional[str] = None,
        supabase_key: Optional[str] = None,
        openai_api_key: Optional[str] = None
    ):
        """
        Inicializa storage com Supabase.
        
        Args:
            supabase_url: URL do Supabase (usa env SUPABASE_URL se não fornecido)
            supabase_key: Service role key (usa env SUPABASE_SERVICE_ROLE_KEY se não fornecido)
            openai_api_key: OpenAI API key para embeddings (usa env OPENAI_API_KEY se não fornecido)
        """
        # Configurar Supabase
        self.supabase_url = supabase_url or os.getenv("SUPABASE_URL")
        self.supabase_key = supabase_key or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError(
                "Supabase credentials not found. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars."
            )
        
        self.client: Client = create_client(self.supabase_url, self.supabase_key)
        
        # Configurar OpenAI para embeddings
        self.openai_api_key = openai_api_key or os.getenv("OPENAI_API_KEY")
        if not self.openai_api_key:
            raise ValueError("OpenAI API key not found. Set OPENAI_API_KEY env var.")
        
        openai.api_key = self.openai_api_key
        
        logger.info("✅ SupabaseVectorStorage initialized")
    
    def _generate_embedding(self, text: str) -> List[float]:
        """
        Gera embedding usando OpenAI text-embedding-3-small.
        
        Args:
            text: Texto para gerar embedding
            
        Returns:
            Lista de floats representando o vetor (1536 dimensões)
        """
        try:
            response = openai.embeddings.create(
                model="text-embedding-3-small",
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"❌ Error generating embedding: {str(e)}")
            raise
    
    def save(
        self,
        value: Any,
        metadata: Optional[Dict[str, Any]] = None,
        agent: Optional[str] = None
    ) -> None:
        """
        Salva memória no Supabase com embedding vetorial.
        
        Args:
            value: Conteúdo da memória (string ou dict)
            metadata: Metadados adicionais
            agent: Nome/role do agente
        """
        try:
            # Converter value para string se necessário
            if isinstance(value, dict):
                content_text = json.dumps(value, ensure_ascii=False)
            else:
                content_text = str(value)
            
            # Preparar metadados
            meta = metadata or {}
            if agent:
                meta['agent'] = agent
            
            # 1. Inserir na tabela agent_memories
            # Schema: memory-schema.ts
            # - agentId: uuid (references agents.id)
            # - conversationId: uuid (optional)
            # - memoryType: enum ('fact', 'preference', 'context', 'learning', 'pattern')
            # - content: jsonb
            # - importance: decimal (0.00 to 1.00)
            
            memory_data = {
                'agent_id': meta.get('agent_uuid'),  # UUID do agente (se tiver)
                'conversation_id': meta.get('conversation_id'),  # UUID da conversa
                'memory_type': meta.get('memory_type', 'learning'),  # Tipo do enum
                'content': {
                    'text': content_text,
                    'user_id': meta.get('user_id'),  # Dentro do content
                    'company_id': meta.get('company_id'),
                    'metadata': meta
                },
                'importance': meta.get('importance', 0.5)
            }
            
            result = self.client.table('agent_memories').insert(memory_data).execute()
            
            if not result.data or len(result.data) == 0:
                raise Exception("Failed to insert memory")
            
            memory_id = result.data[0]['id']
            
            # 2. Gerar embedding
            embedding = self._generate_embedding(content_text)
            
            # 3. Inserir embedding na tabela memory_embeddings
            embedding_data = {
                'memory_id': memory_id,
                'embedding': embedding,
                'content_text': content_text
            }
            
            self.client.table('memory_embeddings').insert(embedding_data).execute()
            
            logger.info(f"✅ Memory saved: {memory_id} (agent: {agent})")
            
        except Exception as e:
            logger.error(f"❌ Error saving memory: {str(e)}")
            raise
    
    def search(
        self,
        query: str,
        limit: int = 10,
        score_threshold: float = 0.5,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Busca memórias usando similaridade vetorial (pgvector).
        
        Args:
            query: Texto de busca
            limit: Número máximo de resultados
            score_threshold: Threshold de similaridade (0-1)
            filter_metadata: Filtros adicionais (user_id, agent, etc)
            
        Returns:
            Lista de memórias com score de similaridade
        """
        try:
            # 1. Gerar embedding da query
            query_embedding = self._generate_embedding(query)
            
            # 2. Buscar com pgvector similarity
            # Nota: Usando RPC function no Supabase para busca vetorial
            rpc_params = {
                'query_embedding': query_embedding,
                'match_threshold': score_threshold,
                'match_count': limit
            }
            
            # Adicionar filtros se fornecidos
            if filter_metadata:
                if 'user_id' in filter_metadata:
                    rpc_params['filter_user_id'] = filter_metadata['user_id']
                if 'agent_uuid' in filter_metadata:
                    rpc_params['filter_agent_id'] = filter_metadata['agent_uuid']
                if 'conversation_id' in filter_metadata:
                    rpc_params['filter_conversation_id'] = filter_metadata['conversation_id']
            
            # Chamar função RPC (precisa ser criada no Supabase)
            results = self.client.rpc('match_memories', rpc_params).execute()
            
            if not results.data:
                logger.info(f"📭 No memories found for query: {query[:50]}...")
                return []
            
            # 3. Formatar resultados
            memories = []
            for row in results.data:
                memories.append({
                    'id': row['id'],
                    'value': row['content'],
                    'metadata': row['metadata'],
                    'similarity': row['similarity'],
                    'agent': row.get('agent_id'),
                    'created_at': row.get('created_at')
                })
            
            logger.info(f"🔍 Found {len(memories)} memories for: {query[:50]}...")
            return memories
            
        except Exception as e:
            logger.error(f"❌ Error searching memories: {str(e)}")
            # Fallback para busca simples por texto
            return self._fallback_text_search(query, limit, filter_metadata)
    
    def _fallback_text_search(
        self,
        query: str,
        limit: int = 10,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Busca fallback usando ILIKE (text search) quando busca vetorial falha.
        """
        try:
            query_builder = self.client.table('agent_memories')\
                .select('*')\
                .ilike('content->>text', f'%{query}%')\
                .limit(limit)
            
            # Aplicar filtros
            if filter_metadata:
                if 'user_id' in filter_metadata:
                    # user_id está dentro do content JSONB
                    query_builder = query_builder.eq('content->>user_id', filter_metadata['user_id'])
                if 'agent_uuid' in filter_metadata:
                    query_builder = query_builder.eq('agent_id', filter_metadata['agent_uuid'])
                if 'conversation_id' in filter_metadata:
                    query_builder = query_builder.eq('conversation_id', filter_metadata['conversation_id'])
            
            results = query_builder.execute()
            
            if not results.data:
                return []
            
            # Formatar resultados
            memories = []
            for row in results.data:
                memories.append({
                    'id': row['id'],
                    'value': row['content'],
                    'metadata': row.get('metadata', {}),
                    'similarity': 0.7,  # Score fixo para fallback
                    'agent': row.get('agent_id'),
                    'created_at': row.get('created_at')
                })
            
            logger.info(f"🔍 Fallback search found {len(memories)} memories")
            return memories
            
        except Exception as e:
            logger.error(f"❌ Fallback search error: {str(e)}")
            return []
    
    def reset(self) -> None:
        """
        Reseta todas as memórias (use com cuidado!).
        
        ⚠️ ATENÇÃO: Isso deleta TODAS as memórias do banco.
        Use apenas para debugging/desenvolvimento.
        """
        try:
            # Deletar embeddings primeiro (cascade deve funcionar mas garantindo)
            self.client.table('memory_embeddings').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
            
            # Deletar memórias
            self.client.table('agent_memories').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
            
            logger.warning("🗑️ All memories have been reset!")
            
        except Exception as e:
            logger.error(f"❌ Error resetting memories: {str(e)}")
            raise
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Retorna estatísticas sobre as memórias armazenadas.
        """
        try:
            # Contar memórias
            count_result = self.client.table('agent_memories')\
                .select('id', count='exact')\
                .execute()
            
            total_memories = count_result.count if hasattr(count_result, 'count') else 0
            
            # Contar por agente
            agent_stats = self.client.table('agent_memories')\
                .select('agent_id')\
                .execute()
            
            agents = {}
            if agent_stats.data:
                for row in agent_stats.data:
                    agent = row['agent_id']
                    agents[agent] = agents.get(agent, 0) + 1
            
            return {
                'total_memories': total_memories,
                'by_agent': agents,
                'storage_type': 'supabase_vector',
                'embedding_model': 'text-embedding-3-small',
                'embedding_dimensions': 1536
            }
            
        except Exception as e:
            logger.error(f"❌ Error getting stats: {str(e)}")
            return {'error': str(e)}

