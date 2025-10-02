# Componentes

## Esquemas de Segurança

### Token
- **Tipo**: API Key
- **Localização**: Header
- **Nome**: `token`
- **Descrição**: Token de autenticação para endpoints regulares

### Admin Token
- **Tipo**: API Key
- **Localização**: Header
- **Nome**: `admintoken`
- **Descrição**: Token de administrador para endpoints administrativos

## Principais Schemas

### Instance
Representa uma instância do WhatsApp com todas as suas propriedades e configurações.

**Propriedades Principais**:
- `id`: ID único (UUID)
- `token`: Token de autenticação
- `status`: Status da conexão
- `name`: Nome da instância
- `profileName`: Nome do perfil WhatsApp
- `isBusiness`: Indica se é conta business
- `plataform`: Plataforma (iOS/Android/Web)
- `owner`: Proprietário da instância

**Configurações de Chatbot**:
- `chatbot_enabled`: Habilitar chatbot
- `chatbot_ignoreGroups`: Ignorar grupos
- `chatbot_stopConversation`: Palavra para parar
- `openai_apikey`: Chave da API OpenAI

**Controle de Delay**:
- `msg_delay_min`: Delay mínimo entre mensagens (padrão: 2s)
- `msg_delay_max`: Delay máximo entre mensagens (padrão: 4s)

### Webhook
Configuração completa de webhook com filtros e opções avançadas.

**Propriedades Principais**:
- `id`: ID único (UUID)
- `instance_id`: ID da instância associada
- `enabled`: Webhook ativo/inativo
- `url`: URL de destino dos eventos
- `events`: Array de tipos de eventos monitorados

**Filtros de Mensagens**:
- `excludeMessages`: Filtros para excluir tipos de mensagens
- `AddUrlTypesMessages`: Incluir tipo de mensagem na URL
- `addUrlEvents`: Incluir nome do evento na URL

**Eventos Disponíveis**:
- `connection`: Eventos de conexão
- `messages`: Mensagens
- `messages_update`: Atualizações de mensagens
- `call`: Chamadas
- `contacts`: Contatos
- `presence`: Presença
- `groups`: Grupos
- `labels`: Etiquetas
- `chats`: Chats
- `blocks`: Bloqueios
- `leads`: Leads

## Outros Schemas

A especificação completa contém muitos outros schemas detalhados para:
- Mensagens e tipos de mensagem
- Contatos e grupos
- Chamadas e presença
- Etiquetas e chats
- Bloqueios e leads
- Respostas de API e erros

Para ver a especificação completa de todos os schemas, consulte o arquivo original `uazapi-openapi-spec.yaml`.
