# External APIs

## UAZ API
- **Purpose:** Integração com WhatsApp para comunicação bidirecional com usuários
- **Documentation:** [UAZ API Documentation](https://docs.uazapi.com)
- **Base URL(s):** `https://api.uazapi.com/v1`
- **Authentication:** Bearer Token (API Key)
- **Rate Limits:** 1000 requests/minute per company

**Key Endpoints Used:**
- `POST /messages/send` - Enviar mensagem via WhatsApp
- `GET /messages/{messageId}/status` - Verificar status de entrega
- `POST /webhooks/configure` - Configurar webhook para receber mensagens
- `GET /contacts/{contactId}` - Obter informações do contato

**Integration Notes:** 
- Webhook handler deve validar assinatura para segurança
- Rate limiting implementado por empresa para evitar exceder limites
- Retry automático para falhas temporárias com backoff exponencial
- Circuit breaker para proteger contra falhas em cascata

## OpenAI API
- **Purpose:** Provedor principal de LLM para agentes CrewAI (GPT-4, GPT-3.5-turbo)
- **Documentation:** [OpenAI API Documentation](https://platform.openai.com/docs)
- **Base URL(s):** `https://api.openai.com/v1`
- **Authentication:** Bearer Token (API Key)
- **Rate Limits:** Varia por modelo (GPT-4: 500 requests/minute, GPT-3.5: 3500 requests/minute)

**Key Endpoints Used:**
- `POST /chat/completions` - Completar conversas com agentes
- `POST /embeddings` - Gerar embeddings para sistema de memória
- `GET /models` - Listar modelos disponíveis
- `POST /moderations` - Moderar conteúdo se necessário

**Integration Notes:**
- Controle rigoroso de tokens para controle de custos
- Fallback para modelos alternativos em caso de indisponibilidade
- Cache de respostas similares para otimizar custos
- Logging detalhado de uso de tokens por empresa

## Supabase API
- **Purpose:** Banco de dados principal e autenticação para o sistema
- **Documentation:** [Supabase Documentation](https://supabase.com/docs)
- **Base URL(s):** `https://{project-ref}.supabase.co`
- **Authentication:** JWT Token (Better Auth integration)
- **Rate Limits:** 1000 requests/minute (plano atual)

**Key Endpoints Used:**
- `POST /rest/v1/{table}` - Inserir dados (crews, agents, tasks, etc.)
- `GET /rest/v1/{table}` - Consultar dados com filtros
- `PATCH /rest/v1/{table}` - Atualizar dados
- `DELETE /rest/v1/{table}` - Deletar dados
- `POST /auth/v1/token` - Autenticação de usuários

**Integration Notes:**
- Row Level Security (RLS) implementado para isolamento por empresa
- Connection pooling configurado para otimizar performance
- Backup automático e replicação para alta disponibilidade
- Migrations versionadas para evolução do schema

## Redis API (Redis Cloud)
- **Purpose:** Cache distribuído e coordenação entre agentes CrewAI
- **Documentation:** [Redis Cloud Documentation](https://docs.redis.com)
- **Base URL(s):** `redis://{endpoint}:{port}` (connection string)
- **Authentication:** AUTH token
- **Rate Limits:** Baseado no plano (atualmente 1000 operations/second)

**Key Operations Used:**
- `SET {key} {value} EX {seconds}` - Armazenar dados temporários
- `GET {key}` - Recuperar dados do cache
- `HSET {key} {field} {value}` - Armazenar dados estruturados
- `LPUSH/RPOP {queue}` - Implementar filas para handoff
- `PUBLISH {channel} {message}` - Comunicação entre agentes

**Integration Notes:**
- Clustering configurado para alta disponibilidade
- TTL apropriado para diferentes tipos de dados
- Monitoramento de memória e performance
- Backup automático para dados críticos

## Sentry API
- **Purpose:** Rastreamento de erros e monitoramento de performance
- **Documentation:** [Sentry API Documentation](https://docs.sentry.io/api/)
- **Base URL(s):** `https://sentry.io/api/0`
- **Authentication:** Bearer Token (DSN)
- **Rate Limits:** 1000 events/minute (plano atual)

**Key Endpoints Used:**
- `POST /api/0/projects/{org}/{project}/events/` - Enviar eventos de erro
- `GET /api/0/projects/{org}/{project}/issues/` - Listar issues
- `POST /api/0/projects/{org}/{project}/releases/` - Criar releases

**Integration Notes:**
- Configuração de alertas para erros críticos
- Filtros para evitar spam de logs
- Integração com Slack para notificações
- Performance monitoring para APIs externas

## Vercel Analytics API
- **Purpose:** Métricas de performance e uso da aplicação
- **Documentation:** [Vercel Analytics Documentation](https://vercel.com/docs/analytics)
- **Base URL(s):** `https://vercel.com/api/analytics`
- **Authentication:** Vercel Token
- **Rate Limits:** 1000 requests/minute

**Key Endpoints Used:**
- `GET /analytics/events` - Obter eventos de uso
- `GET /analytics/performance` - Métricas de performance
- `GET /analytics/usage` - Estatísticas de uso

**Integration Notes:**
- Métricas automáticas para todas as páginas
- Custom events para tracking de agentes
- Dashboard integrado para monitoramento
- Export de dados para análise externa
