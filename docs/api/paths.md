# UAZ API - Endpoints (Paths)

Esta seção contém todos os endpoints disponíveis na UAZ API para WhatsApp.

> **Nota**: O arquivo completo de paths é muito extenso (mais de 10.000 linhas). Para uma versão completa e atualizada, consulte o arquivo original `uazapi-openapi-spec.yaml` ou use as ferramentas de API para explorar os endpoints.

## Categorias de Endpoints

### Administração
- Endpoints administrativos que requerem `admintoken`
- Gerenciamento geral do sistema

### Instância
- Operações de ciclo de vida da instância
- Conectar, desconectar, verificar status

### Perfil
- Gerenciamento do perfil do WhatsApp
- Alterar nome e imagem de perfil

### Chamadas
- Operações de chamadas pelo WhatsApp
- Realizar e rejeitar chamadas

### Webhooks e SSE
- Configuração de webhooks
- Server-Sent Events

### Envio de Mensagem
- Endpoints para diferentes tipos de mensagens
- Texto, mídia, documentos, etc.

## Estrutura dos Endpoints

Cada endpoint inclui:
- **Método HTTP** (GET, POST, PUT, DELETE)
- **Caminho** da URL
- **Parâmetros** de entrada
- **Respostas** possíveis
- **Exemplos** de uso
- **Códigos de erro** específicos

## Autenticação

- **Endpoints regulares**: Requerem header `token`
- **Endpoints administrativos**: Requerem header `admintoken`

## Documentação Completa

Para a documentação completa e atualizada de todos os endpoints, consulte:
- Arquivo original: `uazapi-openapi-spec.yaml`
- Seção paths completa: `paths_complete.yaml` (arquivo temporário extraído)

---

*Esta é uma visão geral da seção paths. O arquivo completo contém detalhes específicos de cada endpoint, incluindo parâmetros, respostas e exemplos de uso.*
