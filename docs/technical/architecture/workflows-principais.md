# Workflows Principais

## 1. Processamento de Mensagem
1. Usuário envia mensagem via WhatsApp
2. UAZ API recebe e envia webhook
3. Orchestrator analisa intenção
4. Roteia para agente especializado
5. Agente processa com memória contextual
6. Resposta enviada via UAZ API

## 2. Gestão de Memória
1. Agente acessa memórias relevantes
2. Processa com contexto atual
3. Armazena nova memória
4. Atualiza memórias compartilhadas
5. Aprende padrões de interação

## 3. Gestão de Templates
1. Admin cria template no painel
2. Sistema valida formato
3. Submete para UAZ API
4. Aguarda aprovação
5. Cache template aprovado
6. Disponibiliza para uso
