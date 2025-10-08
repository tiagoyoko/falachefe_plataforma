tags:
  - name: Admininstração
    description: |
      Endpoints para **administração geral** do sistema.
      Requerem um `admintoken` para autenticação.
  - name: Instancia
    description: |
      Operações relacionadas ao ciclo de vida de uma instância, como conectar,
      desconectar e verificar o status.
  - name: Perfil
    description: |
      Operações relacionadas ao perfil da instância do WhatsApp, como alterar
      nome e imagem de perfil.
  - name: Chamadas
    description: |
      Operações relacionadas a chamadas peloWhatsApp.
      Permite realizar e rejeitar chamadas programaticamente.
  - name: Webhooks e SSE
  - name: Enviar Mensagem
    description: >
      Endpoints para envio de mensagens do WhatsApp com diferentes tipos de conteúdo.


      ## Campos Opcionais Comuns


      Todos os endpoints de envio de mensagem suportam os seguintes campos opcionais:


      - **`delay`** *(integer)*: Atraso em milissegundos antes do envio
        - Durante o atraso aparecerá "Digitando..." ou "Gravando áudio..." dependendo do tipo
        - Exemplo: `5000` (5 segundos)

      - **`readchat`** *(boolean)*: Marcar chat como lido após envio
        - Remove o contador de mensagens não lidas do chat
        - Exemplo: `true`

      - **`readmessages`** *(boolean)*: Marcar últimas mensagens recebidas como lidas
        - Marca as últimas 10 mensagens **recebidas** (não enviadas por você) como lidas
        - Útil para confirmar leitura de mensagens pendentes antes de responder
        - Diferente do `readchat` que apenas remove contador de não lidas
        - Exemplo: `true`

      - **`replyid`** *(string)*: ID da mensagem para responder
        - Cria uma resposta vinculada à mensagem original
        - Suporte varia por tipo de mensagem
        - Exemplo: `"3A12345678901234567890123456789012"`

      - **`mentions`** *(string)*: Números para mencionar (apenas para envio em grupos)
        - Números específicos: `"5511999999999,5511888888888"`
        - Mencionar todos: `"all"`

      - **`forward`** *(boolean)*: Marca a mensagem como encaminhada no WhatsApp
        - Adiciona o indicador "Encaminhada" na mensagem
        - Exemplo: `true`

      - **`track_source`** *(string)*: Origem do rastreamento da mensagem
        - Identifica o sistema ou fonte que está enviando a mensagem
        - Útil para integrações (ex: "chatwoot", "crm", "chatbot")
        - Exemplo: `"chatwoot"`

      - **`track_id`** *(string)*: ID para rastreamento da mensagem
        - Identificador livre para acompanhar a mensagem em sistemas externos
        - Permite correlacionar mensagens entre diferentes plataformas
        - **Nota**: O sistema aceita valores duplicados - não há validação de unicidade
        - Use o mesmo ID em várias mensagens se fizer sentido para sua integração
        - Exemplo: `"msg_123456789"`

      ### Envio para Grupos

      - **`number`** *(string)*: Para enviar mensagem para grupo, use o ID do grupo que termina com `@g.us`
        - Exemplo: `"120363012345678901@g.us"`
        - **Como obter o ID do grupo:**
          - Use o `chatid` do webhook recebido quando alguém envia mensagem no grupo
          - Use o endpoint `GET /group/list` para listar todos os grupos e seus IDs

      ## Placeholders Disponíveis


      Todos os endpoints de envio de mensagem suportam placeholders dinâmicos para personalização automática:


      ### Campos de Nome

      - **`{{name}}`**: Nome consolidado do chat, usando a primeira opção disponível:
        1. Nome do lead (`lead_name`)
        2. Nome completo do lead (`lead_fullName`)
        3. Nome do contato no WhatsApp (`wa_contactName`)
        4. Nome do perfil do WhatsApp (`wa_name`)

      - **`{{first_name}}`**: Primeira palavra válida do nome consolidado (mínimo 2 caracteres)


      ### Campos do WhatsApp

      - **`{{wa_name}}`**: Nome do perfil do WhatsApp

      - **`{{wa_contactName}}`**: Nome do contato como salvo no WhatsApp
