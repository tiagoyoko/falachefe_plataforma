PRD: Plataforma SaaS de Chat Multagente de IA via WhatsApp

Visão geral

📌 Pequenas e médias empresas precisam de suporte constante, mas muitas vezes não têm equipes dedicadas para lidar com vendas, marketing, suporte e operações. As plataformas de agentes de IA surgiram como solução para oferecer disponibilidade 24/7, consistência de serviço e operações escaláveis ￼. Essas plataformas combinam modelos de linguagem avançados, motores de automação de workflow e integrações empresariais para construir, implantar e administrar agentes autônomos ￼. Elas executam tarefas que vão desde reinicializações de senha até processos complexos de onboarding ￼ e aprendem continuamente com cada interação ￼.

📌 Nosso produto é uma plataforma SaaS de chat multagente, onde o usuário final conversa exclusivamente via WhatsApp através da **UAZ API**. Os agentes especializados (ex.: vendas, marketing, operações, financeiro, suporte) trabalham em conjunto, orquestrados por um agente principal que direciona cada solicitação para o agente adequado. Cada agente possui **memória individual persistente** para manter contexto e aprendizado, além de **memória compartilhada** entre agentes para conhecimento comum da empresa. A comunicação ocorre dentro das regras da WhatsApp Business Platform via UAZ API, que utiliza templates de mensagem para notificações e mensagens fora da janela de 24 h ￼ ￼. Quando um usuário inicia uma conversa ou responde, é iniciado um período de atendimento de 24 horas em que qualquer tipo de mensagem pode ser enviada ￼; fora desse período somente templates aprovados são permitidos ￼. A política da plataforma exige que as empresas mantenham perfis claros, obtenham opt-in e respeitem pedidos de opt-out dos clientes ￼.

Objetivos e Metas
	•	🎯 Melhorar a produtividade do empreendedor SMB ao centralizar atendimento, vendas e marketing em um único canal (WhatsApp via UAZ API) e reduzir o tempo gasto em tarefas repetitivas.
	•	🎯 Oferecer serviço 24/7 com qualidade consistente, utilizando agentes de IA que entendem contexto através de memória persistente e executam workflows complexos ￼.
	•	🎯 Automatizar processos de negócio (seguimento de leads, cobrança, envio de propostas, geração de relatórios) integrando-se ao CRM/ERP do cliente através de agentes com memória persistente.
	•	🎯 Manter conformidade com políticas do WhatsApp e leis de privacidade, garantindo opt-in e uso de mensagens template conforme a política ￼.
	•	🎯 Disponibilizar painel administrativo intuitivo para configuração de agentes, gestão de memórias (individual e compartilhada), gestão de assinantes e monitoramento de interações.

Personas
	•	👤 Usuário final / Empreendedor SMB: utiliza WhatsApp para conversar com a plataforma, solicita relatórios de vendas, programa campanhas e obtém suporte. Não interage com o painel administrativo.
	•	🧑‍💼 Administrador da empresa (cliente): acessa o painel para configurar os agentes, aprovar templates de mensagem, gerenciar assinantes e acompanhar métricas.
	•	👨‍💻 Equipe de Suporte/Operações da plataforma: cria e treina novos agentes, monitora qualidade e responde a escalonamentos humanos quando necessário.

Cenários de Uso
	•	💬 Criação de proposta: O empreendedor envia no WhatsApp "gerar proposta para cliente X". O orquestrador direciona para o agente de vendas, que coleta dados do CRM, gera o PDF e envia por WhatsApp utilizando um template de mídia via UAZ API.
	•	📈 Relatório de desempenho: O usuário solicita "resumo das vendas da semana". O agente financeiro consulta o ERP, formata os dados e responde com texto ou gráfico simplificado. Caso a requisição esteja fora da janela de 24 h, utiliza um template de notificação via UAZ API ￼.
	•	📣 Campanha de marketing: Pelo painel, o administrador cria um template de marketing e agenda disparos para assinantes segmentados via UAZ API. Os assinantes que interagirem iniciam uma janela de atendimento e podem receber mensagens de acompanhamento dentro desse período ￼.
	•	🧾 Cobrança automática: O agente financeiro envia lembretes de pagamento usando templates de utilidade via UAZ API; se o cliente responder, o agente pode negociar valores dentro da janela ativa.
	•	❓ Escalonamento humano: Se o agente não resolver uma solicitação, o usuário pode selecionar a opção "Falar com humano" em uma mensagem interativa. O pedido é redirecionado para um operador.
	•	🧠 Aprendizado contínuo: Os agentes aprendem com cada interação, armazenando padrões de comportamento na memória individual e compartilhando conhecimento relevante na memória compartilhada.

Funcionalidades Principais (Usuário via WhatsApp)
	•	✅ Integração com UAZ API: envio e recebimento de mensagens via WhatsApp Business Platform, suportando texto, mídia, listas interativas e flows ￼. O sistema gerencia templates e cuida de tokens e autenticações necessários através da UAZ API.
	•	🧠 Roteamento multagente: orquestrador analisa a mensagem e direciona ao agente especializado correto (vendas, marketing, operações, financeiro, suporte). Os agentes combinam modelos de linguagem, memória persistente individual e compartilhada, automação e integrações empresariais para executar tarefas ￼.
	•	🔁 Automação de workflows: agentes conectam-se a sistemas externos (CRM, ERP, plataformas de marketing) via APIs. Podem executar processos complexos de vários passos, como onboarding de clientes ou geração de notas fiscais, mantendo contexto através de memória persistente ￼.
	•	📝 Mensagens template e notificações: criação de templates de texto, mídia e interativos para marketing, utilidade e autenticação via UAZ API ￼. O sistema garante envio somente para usuários com opt-in e controla limites de mensagens.
	•	📋 Mensagens interativas: suportam listas com opções, botões de resposta e flows para captar dados e permitir navegação guiada ￼. Isso melhora a experiência e coleta inputs estruturados.
	•	⏱ Janela de atendimento de 24 h: quando o usuário envia ou responde a uma mensagem, abre-se uma janela onde qualquer tipo de mensagem é permitido ￼. Fora dessa janela, apenas templates aprovados podem ser enviados ￼.
	•	🔒 Privacidade e conformidade: coleta apenas dados essenciais, criptografa mensagens (herdado do WhatsApp via UAZ API), mantém logs e atende às leis LGPD/GDPR. Respeita opt-outs e mantém informações de contato atualizadas ￼.
	•	🆘 Escalonamento humano: opções para falar com um atendente humano em casos complexos ou de insatisfação, conforme exigido pelas políticas de automação ￼.
	•	🧠 Memória persistente: cada agente mantém memória individual para contexto específico e aprendizado, além de acessar memória compartilhada para conhecimento comum da empresa.

Funcionalidades Principais (Painel Administrativo)
	•	🔐 Controle de papéis e permissões (RBAC): definição de diferentes níveis de acesso (super admin, gerente, analista). Cada função possui permissões granulares para visualizar, editar ou executar operações ￼ ￼.
	•	📊 Monitoramento em tempo real: dashboards com métricas de performance dos agentes (número de conversas, tempo médio de resposta, satisfação do usuário) e estado dos sistemas externos ￼. Integra dashboards customizáveis com tabelas, cards e gráficos ￼.
	•	🔧 Construtor de fluxos e prompts: interface visual para configurar e treinar agentes, criar prompts, definir passos de automação e integrar APIs. Permite testar fluxos com números sandbox antes de publicar.
	•	🔍 Pesquisa e filtros: busca de conversas, assinantes e templates, com filtros por data, agente, status, tags e palavras-chave ￼.
	•	📦 Ações em massa e edição inline: possibilita atualizar vários assinantes, alterar configurações de agentes ou substituir templates simultaneamente ￼.
	•	📣 Notificações e alertas: alertas configuráveis para mensagens falhadas, picos de volume ou indicadores de qualidade dos agentes. Notificações podem ser enviadas por e‑mail, WhatsApp ou no próprio painel ￼.
	•	🧪 Ambientes separados (sandbox e produção): permite testar agentes e templates em ambiente de homologação antes de ativar para usuários finais ￼.
	•	🧾 Logs e auditoria: registro detalhado de ações de administradores e interações de agentes para fins de auditoria e resolução de problemas ￼.
	•	🔗 Integração com ferramentas externas: permite embutir dashboards de BI, conectar-se a sistemas de CRM, ERP, gateways de pagamento e outros serviços via APIs e webhooks ￼.
	•	👥 Gestão de assinantes: exibe lista de contatos com status de opt-in/opt-out, segmentos e histórico de interações. Permite importação/exportação e atualização de consentimentos.
	•	🤖 Gestão de agentes: criação, edição e desativação de agentes especializados; definição de prompts, instruções e permissões de acesso a dados; configuração de memória individual e compartilhada; acompanhamento de performance e uso.
	•	🧾 Gestão de mensagens template: criação, edição, submissão para aprovação e acompanhamento do status de templates (aprovado/rejeitado/em revisão) via UAZ API ￼.
	•	💳 Gestão de assinaturas e faturamento: painel para acompanhar planos ativos, limites de uso (número de mensagens, agentes e assinantes), emitir faturas e integrar com provedores de pagamento.
	•	🧠 Gestão de memórias: interface para visualizar, editar e gerenciar memórias individuais dos agentes e memórias compartilhadas, incluindo busca semântica e limpeza automática.

Requisitos Funcionais
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

Requisitos Não Funcionais
	•	⚡ Desempenho: respostas em até 3 s para 95 % das requisições; sistema capaz de sustentar milhares de conversas simultâneas.
	•	☁️ Escalabilidade: arquitetura modular, permitindo adicionar novos agentes e aumentar capacidade conforme a base de usuários cresce.
	•	🔐 Segurança: criptografia ponta a ponta (nativa do WhatsApp via UAZ API), armazenamento seguro, conformidade LGPD/GDPR e SOC2; monitoramento de acessos e incidentes.
	•	🧪 Confiabilidade: uptime de 99,9 %; mecanismos de retry e filas para garantir entrega de mensagens.
	•	🌐 Internacionalização: suporte inicial ao português (Brasil) e possibilidade de adicionar outros idiomas nos agentes.
	•	🧭 Usabilidade: painel responsivo, simples de navegar, com feedbacks claros; uso de ícones e cores padronizadas.
	•	💾 Persistência de memória: sistema de memória deve manter dados por pelo menos 90 dias, com limpeza automática baseada em importância e uso.
	•	🔍 Busca semântica: capacidade de buscar em memórias usando linguagem natural com resposta em menos de 500ms.
	•	🔄 Sincronização: memórias compartilhadas devem ser sincronizadas entre agentes em tempo real com latência máxima de 100ms.

Métricas de Sucesso
	•	📈 Número de conversas tratadas por agente e taxa de resolução sem escalonamento humano.
	•	⏱ Tempo médio de resposta (end-to-end e por agente).
	•	😊 Satisfação do usuário (NPS/CSAT) coletada periodicamente via mensagens interativas.
	•	📊 Taxa de opt-in/opt-out e percentual de entrega de mensagens template.
	•	💼 Receita recorrente mensal (MRR) e retenção de clientes (churn).
	•	🧠 Eficiência dos agentes: número de tarefas automatizadas, redução de tempo de processo.
	•	💾 Uso de memória: taxa de hit de memória, tempo de busca, eficiência de aprendizado.
	•	🔄 Sincronização: latência de sincronização de memórias, consistência de dados.
	•	📈 Aprendizado: taxa de melhoria de performance dos agentes ao longo do tempo.

Cronograma e Roadmap (sugestão)
	•	📅 Fase 1 – MVP (0-3 meses): Implementar integração com UAZ API, orquestrador e dois agentes principais (vendas e suporte); criar painel básico com gestão de templates e assinantes; implementar sistema básico de memória persistente.
	•	📅 Fase 2 – Funcionalidades avançadas (4-6 meses): Adicionar agentes de marketing e financeiro; implementar dashboards em tempo real, RBAC e logs; disponibilizar ambiente sandbox; expandir sistema de memória com busca semântica.
	•	📅 Fase 3 – Otimização (7-9 meses): Incluir automação de workflows complexos, integrações nativas com CRMs, ERPs e plataformas de pagamento; lançar app analytics avançado; otimizar sistema de memória e aprendizado.
	•	📅 Fase 4 – Escala e expansão (10-12 meses): Suporte a múltiplos idiomas, criação de marketplace de agentes personalizados, melhorias de IA (aprendizado contínuo e RAG), abertura de APIs públicas para parceiros; sistema avançado de memória distribuída.

Diagrama de Arquitetura
Legenda: O usuário interage via WhatsApp através da UAZ API; as mensagens são enviadas ao orquestrador, que coordena agentes especializados com memória persistente. Os agentes retornam respostas e interagem com sistemas externos. O painel admin observa e configura toda a operação, incluindo gestão de memórias.

Conclusão

✅ Esta PRD apresenta uma visão completa para o desenvolvimento de uma plataforma SaaS de chat multagente via WhatsApp através da UAZ API. O objetivo é habilitar empreendedores de pequenas e médias empresas a realizar vendas, marketing e operações de forma eficiente, com suporte contínuo e automações inteligentes através de agentes com memória persistente, enquanto oferece aos administradores um painel robusto para configurar agentes, gerir assinantes, monitorar resultados e gerenciar memórias. O cumprimento das políticas do WhatsApp Business via UAZ API e das melhores práticas de administração garantirá uma solução confiável, escalável e centrada no usuário ￼.
