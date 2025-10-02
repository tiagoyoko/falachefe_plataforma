# Diagrama de Arquitetura

## Visão Geral

O usuário interage via WhatsApp através da UAZ API; as mensagens são enviadas ao orquestrador, que coordena agentes especializados com memória persistente. Os agentes retornam respostas e interagem com sistemas externos. O painel admin observa e configura toda a operação, incluindo gestão de memórias.

## Componentes Principais

- **WhatsApp Business Platform** (via UAZ API)
- **Orquestrador de Mensagens**
- **Agentes Especializados** (Vendas, Marketing, Suporte, Financeiro, Operações)
- **Sistema de Memória Persistente** (Individual e Compartilhada)
- **Painel Administrativo**
- **Integrações Externas** (CRM, ERP, Pagamentos)

## Fluxo de Dados

1. Usuário envia mensagem via WhatsApp
2. UAZ API recebe e processa a mensagem
3. Orquestrador analisa e direciona para agente apropriado
4. Agente consulta memória e executa ação
5. Resposta é enviada de volta via UAZ API
6. Dados são armazenados na memória persistente

