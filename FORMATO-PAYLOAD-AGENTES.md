# 📋 Formato de Payload Esperado por Cada Agente

**Data**: 17/10/2025  
**Status**: ✅ DOCUMENTAÇÃO COMPLETA  
**Fonte**: `crewai-projects/falachefe_crew/api_server.py`

---

## 🌐 Endpoint Principal: POST /process

### URL
```
http://37.27.248.13:8000/process
```

### Payload Base (Todos os Agentes)

```json
{
  "message": "Mensagem do usuário",
  "userId": "or3ZL1Ea1Pm7wFhufyFaRs7y2ZLKLQNb",
  "phoneNumber": "5511992345329",
  "context": {
    "conversationId": "uuid-da-conversacao",
    "chatName": "Nome do Chat",
    "source": "whatsapp",
    "isNewUser": false,
    "messageType": "text_only",
    "timestamp": "2025-10-17T11:30:00Z"
  }
}
```

### Campos Obrigatórios ⚠️

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| **message** | string | Mensagem do usuário | "Qual é o meu saldo?" |
| **userId** | string | ID do usuário (user_onboarding.user_id) | "or3ZL1Ea1Pm7wFhufyFaRs7y2ZLKLQNb" |
| **phoneNumber** | string | Número WhatsApp (apenas dígitos) | "5511992345329" |

### Campos Opcionais

| Campo | Tipo | Descrição | Default |
|-------|------|-----------|---------|
| context.conversationId | string | ID da conversação | Auto-gerado |
| context.source | string | Origem (whatsapp/web-chat) | "whatsapp" |
| context.chatName | string | Nome do chat | "-" |
| context.isNewUser | boolean | Usuário novo? | false |

---

## 🤖 Agentes e Seus Inputs Específicos

### 1. 👩 Ana - Reception Agent (Recepcionista)

**Quando é Acionada**:
- Mensagens tipo: `greeting`, `acknowledgment`, `general`, `continuation`
- Exemplos: "Oi", "Olá", "Obrigado", "E aí?", "Também preciso de..."

**Inputs Usados** (linhas 616-623):
```python
reception_inputs = {
    "user_id": user_id,                    # ID do usuário
    "user_message": user_message,           # Mensagem original
    "user_context": user_name,              # Nome do usuário
    "message": user_message,                # Mensagem (redundante)
    "phone_number": phone_number,           # Telefone
    "whatsapp_number": phone_number         # Telefone (redundante)
}
```

**O Que Ana Faz**:
- ✅ Consulta perfil do usuário (GetUserProfileTool)
- ✅ Consulta dados da empresa (GetCompanyDataTool)
- ✅ Responde de forma personalizada usando nome/empresa
- ✅ Direciona para especialistas quando necessário

**Ferramentas de Ana** (acesso direto ao Supabase):
- GetUserProfileTool
- GetCompanyDataTool
- UpdateUserPreferencesTool
- UpdateUserProfileTool
- UpdateCompanyDataTool

---

### 2. 👨‍💼 Leo - Financial Expert (Mentor Financeiro)

**Quando é Acionado**:
- Mensagens classificadas como: `financial_task`
- Keywords: "fluxo de caixa", "receita", "despesa", "financeiro", "saldo"
- Exemplos: "Adicionar receita de R$ 1500", "Qual é o meu saldo?"

**Inputs Usados** (linhas 644-684):
```python
base_inputs = {
    # Básicos
    "user_id": user_id,
    "user_message": user_message,
    "user_context": user_name,
    "phone_number": phone_number,
    "message": user_message,
    
    # Específicos para Leo
    "question": user_message,              # Pergunta financeira
    "company_context": company_context,    # Contexto da empresa
    "financial_status": financial_status,  # Status financeiro atual
    
    # Para transações
    "period": "atual",
    "cashflow_data": {},
    "transaction_type": "consulta",
    "transaction_data": {}
}
```

**Dados Reais Fornecidos a Leo**:
```python
company_context = """
Empresa: Agencia Vibe Code
Setor: Tecnologia
Porte: Pequena
Contato: Tiago Yokoyama (CEO)
"""

financial_status = """
Resumo Financeiro:
- Total Receitas: R$ 1500.00
- Total Despesas: R$ 0.00
- Saldo Atual: R$ 1500.00
- Total de Transações: 1

Últimas Transações:
💰 R$ 1500.00 - Venda de serviço (receita)
"""
```

**Ferramentas de Leo** (chamam endpoints):
- **AddCashflowTransactionTool**: POST `/api/financial/crewai`
- **GetCashflowBalanceTool**: GET `/api/financial/crewai?userId=X&startDate=Y&endDate=Z`
- GetCashflowCategoriesTool (simulado)
- GetCashflowSummaryTool (simulado)

---

### 3. 🎯 Max - Marketing/Sales Expert

**Quando é Acionado**:
- Mensagens classificadas como: `marketing_query`, `sales_query`
- Keywords: marketing, vendas, estratégia, campanha, anúncio
- Exemplos: "Como melhorar minhas vendas?", "Preciso de estratégia de marketing"

**Inputs Usados**:
```python
base_inputs = {
    # Básicos
    "user_id": user_id,
    "user_message": user_message,
    "message": user_message,
    "phone_number": phone_number,
    
    # Específicos para Marketing
    "topic": user_message,
    "area": "geral",
    "marketing_question": user_message,
    "company_info": company_context,
    "marketing_goal": "conforme solicitação do cliente",
    "budget": "a definir com o cliente",
    
    # Específicos para Sales
    "sales_question": user_message,
    "sales_type": "a definir conforme contexto",
    "product_info": "produtos/serviços da empresa",
    "current_challenge": user_message
}
```

**Ferramentas de Max**:
- ❌ **Nenhuma** (usa apenas conhecimento LLM)
- Gera estratégias, planos e campanhas de forma textual

---

### 4. 👩‍💼 Lia - HR Expert (Consultora de RH)

**Quando é Acionada**:
- Mensagens classificadas como: `hr_query`
- Keywords: RH, contratação, demissão, trabalhista, funcionário
- Exemplos: "Como contratar?", "Preciso de modelo de contrato"

**Inputs Usados**:
```python
base_inputs = {
    # Básicos
    "user_id": user_id,
    "user_message": user_message,
    "message": user_message,
    "phone_number": phone_number,
    
    # Específicos para HR
    "hr_question": user_message,
    "employee_count": "não especificado",
    "company_info": company_context
}
```

**Ferramentas de Lia**:
- ❌ **Nenhuma** (usa apenas conhecimento LLM)
- Gera templates, checklists e processos de forma textual

---

## 📊 Comparativo de Inputs

| Campo | Ana | Leo | Max | Lia |
|-------|-----|-----|-----|-----|
| **user_id** | ✅ | ✅ | ✅ | ✅ |
| **user_message** | ✅ | ✅ | ✅ | ✅ |
| **phone_number** | ✅ | ✅ | ✅ | ✅ |
| **user_context** | ✅ (nome) | ✅ (nome) | - | - |
| **question** | - | ✅ | - | - |
| **company_context** | - | ✅ | ✅ | ✅ |
| **financial_status** | - | ✅ | - | - |
| **marketing_question** | - | - | ✅ | - |
| **sales_question** | - | - | ✅ | - |
| **hr_question** | - | - | - | ✅ |

---

## 🔄 Fluxo Completo de Classificação

### 1. Mensagem Chega no Servidor

```python
POST /process
{
  "message": "Qual é o meu saldo?",
  "userId": "or3ZL1Ea1Pm7wFhufyFaRs7y2ZLKLQNb",
  "phoneNumber": "5511992345329",
  "context": {...}
}
```

### 2. Classificação com LLM (GPT-4o-mini)

```python
classify_message_with_llm(message)
# Retorna:
{
  "type": "financial_task",
  "specialist": "financial_expert",
  "confidence": 0.95,
  "needs_specialist": True
}
```

### 3. Busca Dados do Usuário

```python
user_company_data = get_user_company_data(user_id)
# Busca em: user_onboarding (Supabase)

financial_status = get_financial_status(user_id)
# Busca em: financial_data (Supabase)
```

### 4. Roteamento para Agente

```python
if classification['type'] in ['greeting', 'acknowledgment', 'general']:
    agent = crew_class.reception_agent()  # Ana
elif classification['specialist'] == 'financial_expert':
    agent = crew_class.financial_expert()  # Leo
elif classification['specialist'] in ['marketing_expert', 'sales_expert']:
    agent = crew_class.marketing_sales_expert()  # Max
elif classification['specialist'] == 'hr_expert':
    agent = crew_class.hr_expert()  # Lia
```

### 5. Processamento e Resposta

```python
result = crew.kickoff(inputs=base_inputs)
response_text = str(result)

# Enviar resposta via UAZAPI
send_to_uazapi(phone_number, response_text)
```

---

## ✅ Validações no Servidor

### Campos Obrigatórios Validados

```python
# Linha 564
if not user_message:
    return {"error": "message is required"}, 400

# Linha 570
if not user_id:
    return {"error": "userId is required"}, 400

# Linha 576
if not phone_number:
    return {"error": "phoneNumber is required"}, 400
```

---

## 🧪 Exemplos de Payloads Válidos

### Exemplo 1: Saudação (Ana)

```json
{
  "message": "Oi, bom dia!",
  "userId": "or3ZL1Ea1Pm7wFhufyFaRs7y2ZLKLQNb",
  "phoneNumber": "5511992345329",
  "context": {
    "conversationId": "conv-123",
    "source": "whatsapp"
  }
}
```

**Resposta Esperada**:
```
Olá, Tiago! 👋 Bom dia!

Como CEO da Agencia Vibe Code, como posso te ajudar hoje?

Posso auxiliar com:
💰 Finanças - Seu saldo atual é R$ 1.500,00
📱 Marketing e Vendas
👥 Gestão de Pessoas
```

### Exemplo 2: Consulta Financeira (Leo)

```json
{
  "message": "Qual é o meu saldo atual?",
  "userId": "or3ZL1Ea1Pm7wFhufyFaRs7y2ZLKLQNb",
  "phoneNumber": "5511992345329",
  "context": {
    "conversationId": "conv-123",
    "source": "whatsapp"
  }
}
```

**Resposta Esperada**:
```
Olá, Tiago!

Analisando seu fluxo de caixa:

📊 Situação Atual:
- Total Receitas: R$ 1.500,00
- Total Despesas: R$ 0,00
- Saldo: R$ 1.500,00

Sua Agencia Vibe Code está com saldo positivo! Continue registrando suas transações para ter um controle completo.

Deseja adicionar alguma despesa ou receita?
```

### Exemplo 3: Marketing (Max)

```json
{
  "message": "Como melhorar minhas vendas no Instagram?",
  "userId": "or3ZL1Ea1Pm7wFhufyFaRs7y2ZLKLQNb",
  "phoneNumber": "5511992345329",
  "context": {
    "conversationId": "conv-123",
    "source": "whatsapp"
  }
}
```

**Resposta Esperada**:
```
Ótima pergunta, Tiago!

Para a Agencia Vibe Code (setor Tecnologia), sugiro:

🎯 Estratégia Instagram:
1. Conteúdo de valor: Posts sobre desenvolvimento web
2. Stories interativos: Bastidores de projetos
3. Reels: Dicas rápidas de programação
4. Hashtags: #DesenvolvimentoWeb #AgenciaDigital

📈 Métricas para acompanhar:
- Alcance e engajamento
- Taxa de conversão de DM para reunião
- Crescimento de seguidores qualificados

Quer que eu detalhe algum ponto específico?
```

### Exemplo 4: RH (Lia)

```json
{
  "message": "Preciso contratar um desenvolvedor. Como fazer?",
  "userId": "or3ZL1Ea1Pm7wFhufyFaRs7y2ZLKLQNb",
  "phoneNumber": "5511992345329",
  "context": {
    "conversationId": "conv-123",
    "source": "whatsapp"
  }
}
```

**Resposta Esperada**:
```
Olá, Tiago!

Para contratar um desenvolvedor na Agencia Vibe Code:

📋 Checklist de Contratação:

1️⃣ Definir perfil
- Senioridade (Jr/Pleno/Sr)
- Stack técnica necessária
- Regime de trabalho (CLT/PJ)

2️⃣ Documentos necessários
- Contrato de trabalho
- Ficha de registro
- Declaração de vale-transporte

3️⃣ Processo seletivo
- Descrição da vaga
- Teste técnico
- Entrevista

Posso gerar um modelo de contrato ou descrição de vaga para você?
```

---

## 🔍 Como o MessageRouter Prepara o Payload

**Arquivo**: `src/lib/message-routing/message-router.ts`

### Método preparePayload() (linha 392)

```typescript
static preparePayload(
  message: UAZMessage,
  chat: UAZChat,
  classification: MessageAnalysis,
  userId: string,
  conversationId: string
): Record<string, unknown> {
  // Extrair phoneNumber limpo
  const phoneNumber = chat.phone?.replace(/[^0-9]/g, '') 
    || chat.wa_chatid?.split('@')[0] 
    || '';
  
  return {
    userId,
    userName: chat.name || chat.wa_contactName || 'Usuário',
    phoneNumber,  // ✅ No nível raiz (obrigatório!)
    message: message.text || message.content || '',
    conversationId,
    context: {
      source: 'whatsapp',
      messageType: classification.contentType || message.messageType,
      chatName: chat.name || chat.wa_contactName,
      timestamp: new Date().toISOString()
    }
  };
}
```

---

## 🚨 Erros Comuns e Como Evitar

### 1. ❌ userId Vazio

**Erro**:
```json
{
  "success": false,
  "error": "userId is required"
}
```

**Solução**: Sempre garantir que `userId` é obtido do `MessageService.processIncomingMessage()`

### 2. ❌ phoneNumber Vazio

**Erro**:
```json
{
  "success": false,
  "error": "phoneNumber is required"
}
```

**Solução**: Extrair de `chat.phone` ou `chat.wa_chatid` e remover caracteres especiais

### 3. ❌ message Vazio

**Erro**:
```json
{
  "success": false,
  "error": "message is required"
}
```

**Solução**: Usar `message.text || message.content`

---

## 📝 Resumo

### O Que TODOS os Agentes Precisam:
```json
{
  "message": "...",      // OBRIGATÓRIO
  "userId": "...",       // OBRIGATÓRIO
  "phoneNumber": "...",  // OBRIGATÓRIO
  "context": {...}       // OPCIONAL
}
```

### O Que Cada Agente USA Adicionalmente:

- **Ana**: `user_context` (nome do usuário)
- **Leo**: `question`, `company_context`, `financial_status`
- **Max**: `marketing_question`, `sales_question`, `company_info`
- **Lia**: `hr_question`, `company_info`

---

**Status**: ✅ DOCUMENTAÇÃO COMPLETA  
**Última Atualização**: 17/10/2025 11:35  
**Fonte**: api_server.py (linhas 521-826)

