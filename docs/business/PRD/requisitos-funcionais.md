# Requisitos Funcionais

•	📱 O sistema deve integrar-se à UAZ API para WhatsApp Business Platform e gerenciar a autenticação, números de telefone e Webhooks.

•	🤖 Deve existir um orquestrador de mensagens capaz de interpretar a intenção do usuário, selecionar o agente adequado e consolidar respostas, utilizando memória persistente para contexto.

•	🛠 Administradores devem ser capazes de criar, configurar e testar agentes especializados via painel sem necessidade de codificação, incluindo configuração de memória individual e compartilhada.

•	📩 O sistema deve suportar mensagens de texto, mídia (imagens, PDF), listas e flows interativos via UAZ API ￼.

•	🕒 Deve implementar controle de janela de atendimento de 24 h e bloquear envios fora dessa janela, exceto para templates aprovados ￼ ￼.

•	🧾 Deve gerenciar templates via UAZ API (criação, edição, submissão e status) e associá-los a categorias (marketing, utilidade, autenticação) ￼.

•	📊 Deve disponibilizar dashboards em tempo real com indicadores de desempenho e logs detalhados ￼.

•	🔒 Deve oferecer controle de acesso baseado em papéis e registrar todas as ações de administradores ￼.

•	📁 Deve permitir importação/exportação de contatos e gerenciamento de opt-in/opt-out.

•	💬 Deve possuir canal de escalonamento humano, registrando solicitações e encaminhando a operadores disponíveis.

•	🧠 Deve implementar sistema de memória persistente com memória individual por agente e memória compartilhada entre agentes.

•	💾 Deve permitir configuração e gestão de memórias através do painel administrativo, incluindo limpeza automática e busca semântica.

•	🔄 Deve sincronizar memórias entre agentes em tempo real e manter consistência de dados.

•	📈 Deve fornecer analytics de uso de memórias e performance de aprendizado dos agentes.

