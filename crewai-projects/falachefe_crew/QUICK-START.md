# 🚀 Quick Start - Sistema de Orquestração Falachefe

## ⚡ Início Rápido (5 minutos)

### 1️⃣ Configure o Token uazapi

O arquivo `.env` já está configurado com seu token:

```env
UAZAPI_BASE_URL=https://falachefe.uazapi.com
UAZAPI_TOKEN=6818e86e-ddf2-436c-952c-0d190b627624
```

✅ **Token configurado e testado com sucesso!**

### 2️⃣ Teste de Envio (CONCLUÍDO ✅)

**Resultado do teste:**
- Número testado: `5511992345329`
- Message ID: `3EB0CB17EF15A13BE2FBDC`
- Status: ✅ **MENSAGEM ENVIADA COM SUCESSO!**

### 3️⃣ Como Usar Agora

#### Opção A: Enviar mensagem de teste novamente

```bash
cd crewai-projects/falachefe_crew
python3 send_test_message.py
```

#### Opção B: Testar fluxo completo de orquestração

```bash
python3 example_orchestrated_flow.py
```

Escolha um dos exemplos:
1. 💰 Consultoria Financeira
2. 📱 Consultoria de Marketing
3. 💼 Consultoria Integrada (complexa)
4. ❓ Demanda Vaga (com esclarecimento)

#### Opção C: Usar programaticamente

```python
from falachefe_crew.crew import FalachefeCrew

crew = FalachefeCrew()

result = crew.crew().kickoff(inputs={
    "user_request": "Preciso ajuda com meu fluxo de caixa",
    "user_context": "Padaria, 3 funcionários, R$ 20k/mês",
    "whatsapp_number": "5511992345329",
    "user_id": "user_123"
})

print(result)
```

---

## 🎯 O Sistema Faz:

1. **Recebe** a demanda do usuário
2. **Analisa** via orquestrador qual especialista deve atender
3. **Processa** com o especialista apropriado (Financeiro/Marketing/Vendas/RH)
4. **Formata** a resposta para WhatsApp (emojis, estrutura, saudação)
5. **Envia** via uazapi automaticamente
6. **Confirma** o envio com ID da mensagem

---

## 📊 Arquitetura

```
┌─────────────────┐
│ Usuário WhatsApp│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  ORQUESTRADOR   │ ← Analisa e roteia
│  (Manager IA)   │
└────────┬────────┘
         │
    ┌────┴────┬─────────┬────────┐
    ▼         ▼         ▼        ▼
┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐
│💰FIN│  │📱MKT│  │📊VND│  │👥RH │
└──┬──┘  └──┬──┘  └──┬──┘  └──┬──┘
   └────────┴────────┴─────────┘
              │
              ▼
       ┌─────────────┐
       │   SUPORTE   │ ← Formata e envia
       │  (WhatsApp) │
       └──────┬──────┘
              │
              ▼
       ┌─────────────┐
       │   UAZAPI    │
       │  (WhatsApp) │
       └─────────────┘
```

---

## ✨ Recursos Principais

### 🤖 Agente Orquestrador
- Identifica automaticamente qual especialista deve atender
- Coordena consultorias multi-disciplinares
- Pede esclarecimentos quando necessário

### 📱 Agente de Suporte
- Formata respostas técnicas para WhatsApp
- Adiciona saudações contextuais (bom dia/tarde/noite)
- Escolhe melhor formato (texto/menu/mídia)
- Envia automaticamente via uazapi

### 💼 Especialistas (4)
- **Financeiro:** Fluxo de caixa, custos, DRE
- **Marketing:** Estratégias digitais, redes sociais
- **Vendas:** Processos comerciais, funil
- **RH:** Contratação, legislação trabalhista

### 🛠️ Ferramentas WhatsApp (6)
- Enviar texto
- Enviar menu interativo
- Enviar mídia
- Formatar resposta
- Obter detalhes do chat
- Atualizar lead

---

## 📞 Próximo Teste Sugerido

Teste o orquestrador com uma pergunta real:

```bash
python3 -c "
from src.falachefe_crew.crew import FalachefeCrew

crew = FalachefeCrew()
result = crew.crew().kickoff(inputs={
    'user_request': 'Preciso criar um fluxo de caixa',
    'user_context': 'Pequena empresa',
    'whatsapp_number': '5511992345329',
    'user_id': 'test_001'
})
print(result)
"
```

**Isso irá:**
1. Orquestrador analisa → identifica como financeiro
2. Financial expert responde
3. Support agent formata
4. Envia mensagem formatada para seu WhatsApp

---

## 🎓 Documentação Completa

Para guia detalhado, veja: `ORCHESTRATOR-GUIDE.md`

Para detalhes de implementação, veja: `SISTEMA-ORQUESTRACAO-README.md`

---

**🎉 Sistema pronto para uso!** Todos os testes passaram com sucesso.

