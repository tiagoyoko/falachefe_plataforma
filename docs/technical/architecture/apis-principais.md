# APIs Principais

## UAZ API Integration
- `POST /uaz/webhook` - Webhook da UAZ
- `POST /uaz/send-message` - Enviar mensagens
- `GET /uaz/templates` - Listar templates
- `POST /uaz/templates` - Criar templates

## Memory Management
- `GET /agents/{id}/memory` - Memórias do agente
- `POST /agents/{id}/memory` - Criar memória
- `GET /shared-memory` - Memórias compartilhadas
- `POST /shared-memory` - Criar memória compartilhada

## Conversation Management
- `POST /conversations` - Criar conversa
- `GET /conversations/{id}/messages` - Mensagens
- `POST /conversations/{id}/messages` - Enviar mensagem
