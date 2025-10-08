# Definition of Ready (DoR) - Histórias de Usuário

## Visão Geral

A Definition of Ready (DoR) define os critérios que uma história de usuário deve atender antes de ser considerada pronta para desenvolvimento. Esta seção detalha os critérios específicos para cada história da Fase 1.

## Critérios Gerais de DoR

### ✅ **Critérios Obrigatórios para Todas as Histórias**
- [ ] **História bem escrita**: Segue formato "Como [persona] Quero [funcionalidade] Para que [benefício]"
- [ ] **Critérios de aceitação definidos**: Lista clara e verificável
- [ ] **Estimativa validada**: Story points acordados pelo time
- [ ] **Dependências mapeadas**: Histórias e sistemas necessários identificados
- [ ] **Notas técnicas incluídas**: Detalhes de implementação especificados
- [ ] **Definição de pronto definida**: Checklist completo para validação
- [ ] **Aceitação do Product Owner**: Aprovada pelo PO
- [ ] **Aceitação do time de desenvolvimento**: Entendida e estimada pelo time

### ✅ **Critérios Técnicos Específicos**
- [ ] **Ambiente configurado**: Desenvolvimento, testes, staging
- [ ] **APIs externas disponíveis**: Credenciais e documentação
- [ ] **Dados de teste preparados**: Mocks, fixtures, datasets
- [ ] **Designs aprovados**: UI/UX quando aplicável
- [ ] **Arquitetura definida**: Padrões e convenções estabelecidas

---

## Epic 1: Integração WhatsApp UAZ API

### 1.1 Configuração Inicial da UAZ API

#### ✅ **DoR Específica**
- [ ] **Credenciais UAZ API**: API Key e Secret obtidos
- [ ] **Documentação UAZ API**: Endpoints e autenticação documentados
- [ ] **Ambiente de desenvolvimento**: Configurado com variáveis de ambiente
- [ ] **Webhook configurado**: URL de webhook registrada no WhatsApp Business
- [ ] **Testes de conectividade**: Scripts de validação preparados
- [ ] **Políticas de segurança**: Criptografia e armazenamento seguro definidos
- [ ] **Logging configurado**: Sistema de logs para debug implementado

#### 🔧 **Pré-requisitos Técnicos**
- [ ] Conta UAZ API ativa e configurada
- [ ] WhatsApp Business Account aprovado
- [ ] Ambiente de desenvolvimento com Node.js/TypeScript
- [ ] Sistema de variáveis de ambiente configurado
- [ ] Banco de dados para armazenar credenciais criptografadas

---

### 1.2 Recebimento de Mensagens via Webhook

#### ✅ **DoR Específica**
- [ ] **Endpoint de webhook**: Rota definida e documentada
- [ ] **Validação de assinatura**: Algoritmo de validação implementado
- [ ] **Parser de mensagens**: Estrutura de dados definida
- [ ] **Tipos de mensagem**: Suporte a texto, mídia, interativas mapeado
- [ ] **Integração com orquestrador**: Interface de dados definida
- [ ] **Sistema de retry**: Lógica de retry para falhas implementada
- [ ] **Auditoria**: Logs de todas as mensagens recebidas

#### 🔧 **Pré-requisitos Técnicos**
- [ ] História 1.1 concluída (Configuração UAZ API)
- [ ] Estrutura de dados para mensagens definida
- [ ] Sistema de filas para processamento assíncrono
- [ ] Middleware de validação de webhook
- [ ] Sistema de logging configurado

---

### 1.3 Envio de Mensagens de Texto

#### ✅ **DoR Específica**
- [ ] **SDK UAZ API**: Biblioteca oficial ou wrapper implementado
- [ ] **Formatação de mensagens**: Suporte a negrito, itálico, código definido
- [ ] **Rate limiting**: Limites da UAZ API mapeados e implementados
- [ ] **Tratamento de erros**: Códigos de erro da UAZ API mapeados
- [ ] **Sistema de retry**: Lógica de retry para falhas temporárias
- [ ] **Status de entrega**: Tracking de status de mensagens
- [ ] **Interface para agentes**: API para envio de mensagens definida

#### 🔧 **Pré-requisitos Técnicos**
- [ ] História 1.1 concluída (Configuração UAZ API)
- [ ] SDK UAZ API instalado e configurado
- [ ] Sistema de cache para rate limiting
- [ ] Estrutura de dados para mensagens de saída
- [ ] Sistema de monitoramento de entrega

---

### 1.4 Envio de Mídia (Imagens, PDFs, Documentos)

#### ✅ **DoR Específica**
- [ ] **Storage configurado**: S3, Cloudinary ou similar configurado
- [ ] **Tipos de mídia suportados**: JPG, PNG, PDF, DOC, MP3, MP4 mapeados
- [ ] **Validação de arquivos**: Tamanho, formato, vírus definidos
- [ ] **Upload temporário**: Sistema de upload para storage temporário
- [ ] **URLs temporárias**: Geração de URLs com TTL
- [ ] **Limpeza automática**: Sistema de limpeza de arquivos antigos
- [ ] **Compressão**: Otimização de imagens implementada

#### 🔧 **Pré-requisitos Técnicos**
- [ ] História 1.3 concluída (Envio de Texto)
- [ ] Storage de arquivos configurado
- [ ] Sistema de validação de arquivos
- [ ] Biblioteca de compressão de imagens
- [ ] Sistema de limpeza automática

---

### 1.5 Envio de Mensagens Interativas

#### ✅ **DoR Específica**
- [ ] **Templates UAZ API**: Estrutura de listas, botões, flows definida
- [ ] **Validação de formato**: JSON schema para mensagens interativas
- [ ] **Processamento de respostas**: Sistema de captura de interações
- [ ] **Estado de interações**: Manutenção de estado do usuário
- [ ] **Fallback**: Mensagens de fallback para não suportadas
- [ ] **Cache de templates**: Cache de templates aprovados
- [ ] **Testes de interação**: Scripts de teste para validação

#### 🔧 **Pré-requisitos Técnicos**
- [ ] História 1.3 concluída (Envio de Texto)
- [ ] Templates aprovados no WhatsApp Business
- [ ] Sistema de estado de conversas
- [ ] Validador JSON para mensagens interativas
- [ ] Sistema de cache Redis

---

### 1.6 Gerenciamento de Templates

#### ✅ **DoR Específica**
- [ ] **CRUD de templates**: Interface para criar, editar, deletar
- [ ] **Integração UAZ API**: Endpoints de aprovação mapeados
- [ ] **Categorização**: Sistema de categorias definido
- [ ] **Validação**: Validação de templates antes do envio
- [ ] **Histórico**: Sistema de versionamento de templates
- [ ] **Interface administrativa**: UI para gerenciar templates
- [ ] **Webhooks de status**: Notificações de mudanças de status

#### 🔧 **Pré-requisitos Técnicos**
- [ ] História 1.1 concluída (Configuração UAZ API)
- [ ] Interface administrativa básica
- [ ] Sistema de versionamento
- [ ] Webhooks configurados
- [ ] Cache para templates aprovados

---

### 1.7 Controle de Janela de 24h

#### ✅ **DoR Específica**
- [ ] **Sistema de janelas**: Controle de janela por usuário
- [ ] **Validação de tipo**: Verificação de tipo de mensagem
- [ ] **Renovação automática**: Renovação quando usuário responde
- [ ] **Notificações**: Alertas de expiração de janela
- [ ] **Histórico**: Log de janelas por usuário
- [ ] **Exceções**: Configuração de exceções por tipo
- [ ] **Monitoramento**: Métricas de janelas ativas

#### 🔧 **Pré-requisitos Técnicos**
- [ ] História 1.6 concluída (Gerenciamento de Templates)
- [ ] Redis para controle de janelas
- [ ] Sistema de notificações
- [ ] Sistema de monitoramento
- [ ] Configuração de exceções

---

### 1.8 Gerenciamento de Opt-in/Opt-out

#### ✅ **DoR Específica**
- [ ] **Sistema de consentimento**: Armazenamento de opt-in/opt-out
- [ ] **Validação antes do envio**: Verificação de consentimento
- [ ] **Histórico de consentimento**: Log de mudanças
- [ ] **Re-opt-in**: Sistema para usuários que optaram out
- [ ] **Relatórios de conformidade**: Relatórios LGPD
- [ ] **Integração com templates**: Validação de envio
- [ ] **Auditoria**: Logs de mudanças de consentimento

#### 🔧 **Pré-requisitos Técnicos**
- [ ] História 1.6 concluída (Gerenciamento de Templates)
- [ ] Sistema de auditoria
- [ ] Criptografia para dados sensíveis
- [ ] Sistema de relatórios
- [ ] Conformidade LGPD

---

## Epic 2: Sistema de Orquestração

### 2.1 Análise de Intenção de Mensagens

#### ✅ **DoR Específica**
- [ ] **Modelo de NLP**: BERT, RoBERTa ou similar configurado
- [ ] **Dataset de treinamento**: Dados específicos do domínio preparados
- [ ] **Fine-tuning**: Modelo ajustado para o contexto
- [ ] **Palavras-chave**: Dicionário de palavras-chave mapeado
- [ ] **Padrões de linguagem**: Regex e patterns definidos
- [ ] **Sistema de scoring**: Algoritmo de confiança implementado
- [ ] **Histórico de intenções**: Armazenamento por usuário

#### 🔧 **Pré-requisitos Técnicos**
- [ ] História 1.2 concluída (Recebimento de Mensagens)
- [ ] Modelo de linguagem pré-treinado
- [ ] Dataset de treinamento específico
- [ ] Sistema de embeddings
- [ ] Cache para mensagens similares

---

### 2.2 Roteamento Inteligente para Agentes

#### ✅ **DoR Específica**
- [ ] **Mapeamento intenção-agente**: Regras de roteamento definidas
- [ ] **Sistema de filas**: Redis ou similar configurado
- [ ] **Balanceamento de carga**: Algoritmo de distribuição implementado
- [ ] **Timeout e retry**: Configuração de timeouts e retry
- [ ] **Health checks**: Monitoramento de disponibilidade
- [ ] **Circuit breaker**: Proteção contra falhas
- [ ] **Métricas de roteamento**: Monitoramento de performance

#### 🔧 **Pré-requisitos Técnicos**
- [ ] História 2.1 concluída (Análise de Intenção)
- [ ] Agentes especializados definidos
- [ ] Redis para filas
- [ ] Sistema de health checks
- [ ] Message queues configuradas

---

### 2.3 Gerenciamento de Contexto de Conversas

#### ✅ **DoR Específica**
- [ ] **Estrutura de contexto**: Schema de dados definido
- [ ] **Armazenamento**: Redis para contexto em tempo real
- [ ] **Serialização**: JSON para contexto complexo
- [ ] **TTL de sessão**: Timeout de 24h configurado
- [ ] **Compressão**: Otimização de dados de contexto
- [ ] **Sincronização**: WebSockets para tempo real
- [ ] **Limpeza automática**: Sistema de limpeza de contexto expirado

#### 🔧 **Pré-requisitos Técnicos**
- [ ] História 2.2 concluída (Roteamento Inteligente)
- [ ] Redis configurado
- [ ] Sistema de memória persistente
- [ ] WebSockets implementados
- [ ] Sistema de limpeza automática

---

### 2.4 Estratégia de Fallback

#### ✅ **DoR Específica**
- [ ] **Threshold de classificação**: Score mínimo definido (0.7)
- [ ] **Agente de fallback**: Suporte geral configurado
- [ ] **Solicitação de esclarecimentos**: Templates de perguntas
- [ ] **Sistema de aprendizado**: Feedback loop implementado
- [ ] **Escalonamento automático**: Após 3 tentativas
- [ ] **Registro de casos**: Log de casos não identificados
- [ ] **Dashboard de análise**: Interface para análise de casos

#### 🔧 **Pré-requisitos Técnicos**
- [ ] História 2.1 concluída (Análise de Intenção)
- [ ] Agente de suporte geral
- [ ] Sistema de machine learning
- [ ] Dashboard de análise
- [ ] Sistema de alertas

---

### 2.5 Escalonamento para Atendimento Humano

#### ✅ **DoR Específica**
- [ ] **Critérios de escalonamento**: Regras configuráveis
- [ ] **Transferência de contexto**: Dados completos transferidos
- [ ] **Sistema de notificações**: Alertas para operadores
- [ ] **Priorização**: Filas prioritárias implementadas
- [ ] **Retorno para agentes**: Após resolução humana
- [ ] **SLA configurado**: 5 minutos para resposta
- [ ] **Métricas de SLA**: Monitoramento de tempo

#### 🔧 **Pré-requisitos Técnicos**
- [ ] História 2.3 concluída (Gerenciamento de Contexto)
- [ ] Sistema de notificações
- [ ] Dashboard para operadores
- [ ] Sistema de filas prioritárias
- [ ] Métricas de SLA

---

### 2.6 Logging e Auditoria de Decisões

#### ✅ **DoR Específica**
- [ ] **Sistema de logs**: ELK Stack ou similar configurado
- [ ] **Estrutura de logs**: Schema padronizado
- [ ] **Índices otimizados**: Para busca eficiente
- [ ] **Retenção de logs**: Política de retenção definida
- [ ] **Busca e filtros**: Interface de busca implementada
- [ ] **Relatórios**: Geração de relatórios de performance
- [ ] **Alertas**: Notificações para decisões suspeitas

#### 🔧 **Pré-requisitos Técnicos**
- [ ] História 2.2 concluída (Roteamento Inteligente)
- [ ] ELK Stack configurado
- [ ] Sistema de auditoria
- [ ] Interface de busca
- [ ] Sistema de alertas

---

## Epic 3: Agentes Básicos

### 3.1-3.3 Agente de Vendas (Consultas, Propostas, Leads)

#### ✅ **DoR Específica**
- [ ] **Base de conhecimento**: Dados de produtos/serviços
- [ ] **Sistema de qualificação**: Questionário BANT implementado
- [ ] **Geração de propostas**: Templates e lógica de preços
- [ ] **Integração CRM**: APIs de sistemas externos
- [ ] **Sistema de agendamento**: Calendário e disponibilidade
- [ ] **Materiais promocionais**: Catálogos e documentos
- [ ] **Sistema de follow-up**: Sequências automatizadas

#### 🔧 **Pré-requisitos Técnicos**
- [ ] História 2.3 concluída (Gerenciamento de Contexto)
- [ ] Base de dados de produtos
- [ ] Sistema de geração de PDF
- [ ] Integração com CRM
- [ ] Sistema de agendamento

---

### 3.4-3.6 Agente de Suporte (FAQ, Tickets, Escalonamento)

#### ✅ **DoR Específica**
- [ ] **Base de conhecimento FAQ**: Perguntas e respostas
- [ ] **Sistema de tickets**: Criação e acompanhamento
- [ ] **Guias passo a passo**: Documentação de soluções
- [ ] **Sistema de diagnóstico**: Fluxos de perguntas
- [ ] **Escalonamento inteligente**: Regras de transferência
- [ ] **Sistema de satisfação**: Feedback do usuário
- [ ] **Métricas de SLA**: Tempo de resolução

#### 🔧 **Pré-requisitos Técnicos**
- [ ] História 2.3 concluída (Gerenciamento de Contexto)
- [ ] Base de conhecimento de suporte
- [ ] Sistema de tickets
- [ ] Sistema de escalonamento
- [ ] Dashboard para operadores

---

### 3.7-3.10 Memória Persistente (Individual, Compartilhada, Aprendizado, Integração)

#### ✅ **DoR Específica**
- [ ] **Sistema de memória**: PostgreSQL + Redis configurado
- [ ] **Embeddings**: Sistema de busca semântica
- [ ] **Sincronização**: Message queues para tempo real
- [ ] **Aprendizado contínuo**: Pipeline de ML
- [ ] **Integrações externas**: APIs de CRM/ERP
- [ ] **Políticas de retenção**: Conformidade LGPD
- [ ] **Otimização de performance**: Cache e índices

#### 🔧 **Pré-requisitos Técnicos**
- [ ] História 2.3 concluída (Gerenciamento de Contexto)
- [ ] PostgreSQL configurado
- [ ] Sistema de embeddings
- [ ] APIs externas disponíveis
- [ ] Sistema de machine learning

---

## Epic 4: Painel Administrativo Básico

### 4.1-4.2 Dashboard e Visão Geral

#### ✅ **DoR Específica**
- [ ] **Design system**: Componentes UI padronizados
- [ ] **Bibliotecas de gráficos**: Chart.js ou D3.js
- [ ] **WebSockets**: Para dados em tempo real
- [ ] **Sistema de métricas**: Coleta e armazenamento
- [ ] **Filtros e busca**: Interface de filtros
- [ ] **Exportação**: CSV/PDF para relatórios
- [ ] **Responsividade**: Mobile e desktop

#### 🔧 **Pré-requisitos Técnicos**
- [ ] História 2.6 concluída (Logging e Auditoria)
- [ ] Framework frontend (React/Next.js)
- [ ] Design system implementado
- [ ] Sistema de métricas
- [ ] WebSockets configurados

---

### 4.3-4.4 Gestão de Agentes

#### ✅ **DoR Específica**
- [ ] **Interface de configuração**: UI para parâmetros
- [ ] **Sistema de monitoramento**: Health checks
- [ ] **Editor de prompts**: Interface de edição
- [ ] **Sistema de versionamento**: Controle de versões
- [ ] **Teste em sandbox**: Ambiente de testes
- [ ] **Aplicação em tempo real**: Deploy sem downtime
- [ ] **Métricas de performance**: Monitoramento

#### 🔧 **Pré-requisitos Técnicos**
- [ ] História 4.1 concluída (Dashboard Principal)
- [ ] Sistema de monitoramento
- [ ] Ambiente sandbox
- [ ] Sistema de versionamento
- [ ] Editor de código

---

### 4.5-4.6 Gestão de Templates

#### ✅ **DoR Específica**
- [ ] **Editor WYSIWYG**: Interface de criação
- [ ] **Validação de templates**: JSON schema
- [ ] **Preview em tempo real**: Visualização
- [ ] **Integração UAZ API**: Aprovação automática
- [ ] **Sistema de categorização**: Organização
- [ ] **Histórico de mudanças**: Versionamento
- [ ] **Teste de templates**: Validação antes do envio

#### 🔧 **Pré-requisitos Técnicos**
- [ ] História 1.6 concluída (Gerenciamento de Templates)
- [ ] Editor WYSIWYG
- [ ] Validador JSON
- [ ] Sistema de categorização
- [ ] Webhooks de status

---

### 4.7-4.8 Gestão de Assinantes

#### ✅ **DoR Específica**
- [ ] **Interface de listagem**: Paginação e filtros
- [ ] **Busca full-text**: Pesquisa eficiente
- [ ] **Gerenciamento de permissões**: RBAC básico
- [ ] **Importação CSV**: Upload de listas
- [ ] **Exportação de dados**: Portabilidade LGPD
- [ ] **Sistema de grupos**: Organização de usuários
- [ ] **Auditoria de mudanças**: Log de alterações

#### 🔧 **Pré-requisitos Técnicos**
- [ ] História 4.1 concluída (Dashboard Principal)
- [ ] Sistema de usuários
- [ ] Base de dados de assinantes
- [ ] Sistema de auditoria
- [ ] Validador CSV

---

### 4.9-4.10 Configurações e Logs

#### ✅ **DoR Específica**
- [ ] **Interface de configuração**: UI para parâmetros
- [ ] **Sistema de variáveis**: Environment variables
- [ ] **Validação de configurações**: Schema validation
- [ ] **Sistema de backup**: Backup automático
- [ ] **ELK Stack**: Logs centralizados
- [ ] **Interface de busca**: Busca em logs
- [ ] **Retenção de logs**: Política de retenção

#### 🔧 **Pré-requisitos Técnicos**
- [ ] História 4.7 concluída (Gestão de Assinantes)
- [ ] Sistema de configuração
- [ ] ELK Stack configurado
- [ ] Sistema de backup
- [ ] Interface de busca

---

## Epic 5: Sistema de Memória Persistente

### 5.1-5.3 Memória Individual

#### ✅ **DoR Específica**
- [ ] **Schema de banco**: Estrutura de dados definida
- [ ] **Sistema de indexação**: Índices otimizados
- [ ] **Compressão de dados**: Otimização de storage
- [ ] **Sistema de backup**: Backup automático
- [ ] **Particionamento**: Por data para performance
- [ ] **Sincronização**: Entre instâncias
- [ ] **Integridade**: Validação de dados

#### 🔧 **Pré-requisitos Técnicos**
- [ ] História 2.3 concluída (Gerenciamento de Contexto)
- [ ] PostgreSQL configurado
- [ ] Sistema de indexação
- [ ] Sistema de backup
- [ ] Sistema de sincronização

---

### 5.4-5.5 Memória Compartilhada

#### ✅ **DoR Específica**
- [ ] **Sistema de sincronização**: Message queues
- [ ] **Resolução de conflitos**: Algoritmos de consenso
- [ ] **Controle de acesso**: Por tipo de agente
- [ ] **Auditoria**: Log de mudanças
- [ ] **Validação**: Consistência de dados
- [ ] **Cache distribuído**: Redis Cluster
- [ ] **WebSockets**: Tempo real

#### 🔧 **Pré-requisitos Técnicos**
- [ ] História 5.2 concluída (Lembrança de Preferências)
- [ ] Message queues configuradas
- [ ] Redis Cluster
- [ ] Sistema de auditoria
- [ ] WebSockets implementados

---

### 5.6-5.7 Busca e Recuperação

#### ✅ **DoR Específica**
- [ ] **Sistema de embeddings**: OpenAI/Sentence-BERT
- [ ] **Índice de similaridade**: Vector database
- [ ] **Cache Redis**: Para buscas frequentes
- [ ] **Busca híbrida**: Semântica + texto
- [ ] **Análise de sentimento**: Para contexto
- [ ] **Clustering**: Agrupamento de conversas
- [ ] **Machine learning**: Para sugestões

#### 🔧 **Pré-requisitos Técnicos**
- [ ] História 5.1 concluída (Armazenamento de Histórico)
- [ ] Sistema de embeddings
- [ ] Vector database
- [ ] Cache Redis
- [ ] Sistema de ML

---

### 5.8-5.10 Aprendizado e Otimização

#### ✅ **DoR Específica**
- [ ] **Pipeline de ML**: Treinamento e inferência
- [ ] **Reinforcement learning**: Aprendizado contínuo
- [ ] **A/B testing**: Testes de diferentes abordagens
- [ ] **Métricas de performance**: Monitoramento
- [ ] **Auto-scaling**: Baseado na carga
- [ ] **Políticas de retenção**: Conformidade LGPD
- [ ] **Sistema de alertas**: Para degradação

#### 🔧 **Pré-requisitos Técnicos**
- [ ] História 5.7 concluída (Recuperação de Contexto)
- [ ] Sistema de ML
- [ ] Pipeline de treinamento
- [ ] Sistema de monitoramento
- [ ] Conformidade LGPD

---

## Checklist de Validação Final

### ✅ **Para Cada História**
- [ ] Todos os critérios de DoR específicos atendidos
- [ ] Pré-requisitos técnicos disponíveis
- [ ] Dependências resolvidas
- [ ] Estimativa validada pelo time
- [ ] Aprovação do Product Owner
- [ ] Aceitação do time de desenvolvimento
- [ ] Ambiente de desenvolvimento configurado
- [ ] Dados de teste preparados
- [ ] Documentação técnica atualizada

### ✅ **Para Cada Épico**
- [ ] Todas as histórias do épico com DoR completa
- [ ] Dependências entre histórias mapeadas
- [ ] Sequência de desenvolvimento definida
- [ ] Recursos necessários alocados
- [ ] Riscos identificados e mitigados
- [ ] Critérios de aceitação do épico definidos

### ✅ **Para a Fase 1 (MVP)**
- [ ] Todos os 5 épicos com DoR completa
- [ ] Dependências entre épicos mapeadas
- [ ] Cronograma de desenvolvimento definido
- [ ] Recursos e equipe alocados
- [ ] Ambiente de desenvolvimento configurado
- [ ] Integrações externas configuradas
- [ ] Critérios de aceitação do MVP definidos
