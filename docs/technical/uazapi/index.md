# UAZ API - WhatsApp API (v2.0)

Documentação da API para gerenciamento de instâncias do WhatsApp e comunicações.

## ⚠️ Recomendação Importante: WhatsApp Business

**É ALTAMENTE RECOMENDADO usar contas do WhatsApp Business** em vez do WhatsApp normal para integração, o WhatsApp normal pode apresentar inconsistências, desconexões, limitações e instabilidades durante o uso com a nossa API.

## Seções da Documentação

- [Informações Gerais](./info.md) - Detalhes da API e versão
- [Servidores](./servers.md) - URLs e configurações de servidor
- [Componentes](./components.md) - Schemas, parâmetros e respostas
- [Segurança](./security.md) - Esquemas de autenticação
- [Tags](./tags.md) - Grupos de tags e categorização
- [Endpoints](./paths.md) - Visão geral dos endpoints
- [Especificação Completa de Endpoints](./paths_complete.yaml) - Arquivo YAML completo com todos os endpoints detalhados

## Autenticação

- Endpoints regulares requerem um header 'token' com o token da instância
- Endpoints administrativos requerem um header 'admintoken'

## Estados da Instância

As instâncias podem estar nos seguintes estados:

- `disconnected`: Desconectado do WhatsApp
- `connecting`: Em processo de conexão
- `connected`: Conectado e autenticado com sucesso

## Limites de Uso

- O servidor possui um limite máximo de instâncias conectadas
- Quando o limite é atingido, novas tentativas receberão erro 429
- Servidores gratuitos/demo podem ter restrições adicionais de tempo de vida
