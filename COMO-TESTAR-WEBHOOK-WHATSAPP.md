# 📱 Como Testar Webhook com WhatsApp Real

## 🎯 Número para Enviar Mensagem

**Número WhatsApp conectado à instância UAZAPI:**

```
+55 47 9194-5151
```

**Nome do Perfil:** FL Terapeutas  
**Tipo:** WhatsApp  
**Status:** Conectado ✅  
**Owner:** 554791945151

**Formatado para API:**
```
554791945151
```

---

## 🧪 Como Testar

### Teste 1: Enviar Mensagem Manualmente

1. **Abra o WhatsApp** no seu celular

2. **Adicione o número** nos contatos:
   ```
   +55 47 9194-5151
   ```
   
   **Nome sugerido:** Falachefe Bot

3. **Envie uma mensagem de teste**:
   ```
   Olá! Teste do webhook.
   ```
   
   **OU**
   ```
   Qual é o meu saldo?
   ```
   
   **OU**
   ```
   Preciso ajuda com meu fluxo de caixa
   ```

4. **Aguarde** ~3-30 segundos (depende se Python está rodando)

5. **Observe**:
   - ✅ **Mensagem recebida** (azul duplo check)
   - ⏳ **Processando...** (pode demorar)
   - 📨 **Resposta do bot** (ou mensagem de erro técnico)

---

### Teste 2: Enviar via Script Python

Se você tem acesso ao ambiente Python:

```bash
cd /Users/tiagoyokoyama/Falachefe/crewai-projects/falachefe_crew

# Ativar ambiente
source .venv/bin/activate

# Editar número no script (se necessário)
# TARGET_NUMBER = "5547992535151"  # Já está configurado

# Enviar mensagem
python send_to_number.py
```

---

## 🔍 O que Vai Acontecer

### Cenário A: Python Funcionando ✅

```
1. Você envia: "Qual meu saldo?"
   ↓
2. UAZAPI → Webhook Falachefe
   ↓
3. Webhook valida usuário
   ↓
4. Salva mensagem no banco
   ↓
5. Chama CrewAI Python
   ↓
6. CrewAI processa (10-30s)
   ↓
7. Resposta: "Para consultar seu saldo, preciso..."
   ↓
8. Você recebe no WhatsApp
```

**Tempo total**: 10-30 segundos

### Cenário B: Python NÃO Funcionando ⚠️

```
1. Você envia: "Qual meu saldo?"
   ↓
2. UAZAPI → Webhook Falachefe
   ↓
3. Webhook valida usuário
   ↓
4. Salva mensagem no banco
   ↓
5. Tenta chamar CrewAI Python
   ↓
6. ERRO: Python não disponível
   ↓
7. Resposta: "Desculpe, estou com dificuldades técnicas..."
   ↓
8. Você recebe mensagem de erro no WhatsApp
```

**Tempo total**: 3-5 segundos

---

## 📊 Como Saber se Funcionou

### ✅ Indicadores de Sucesso:
- **Recebe resposta** no WhatsApp (qualquer resposta)
- **Mensagem salva** no banco (verificar logs)
- **Logs da Vercel** mostram processamento

### ❌ Indicadores de Erro:
- **Sem resposta** após 60 segundos
- **Mensagem de erro técnico**
- **Logs mostram** "Failed to start Python process"

---

## 🔍 Verificar Resultados

### 1. **Logs da Vercel**
```
https://vercel.com/tiago-6739s-projects/falachefe/logs
```

**Procure por**:
- ✅ `UAZ Webhook received`
- ✅ `MessageService: Processing incoming message`
- ✅ `User: { phoneNumber: "5547992535151" }`
- ✅ `Message saved successfully`
- ✅ `🤖 Calling CrewAI to process message...`
- ⚠️ `Failed to start Python process` (se Python não funcionar)

### 2. **Banco de Dados**
Sua mensagem estará salva em:
- **Tabela**: `users` (seu cadastro como WhatsApp user)
- **Tabela**: `conversations` (conversação criada)
- **Tabela**: `messages` (mensagem salva)

Pode consultar via:
```sql
-- Ver usuários criados (seu número de celular)
SELECT * FROM users WHERE role = 'whatsapp_user' ORDER BY created_at DESC LIMIT 5;

-- Ver mensagens recebidas
SELECT m.*, u.name as sender_name, u.phone_number 
FROM messages m 
LEFT JOIN users u ON m.sender_id = u.id 
ORDER BY m.sent_at DESC LIMIT 10;

-- Ver conversações ativas
SELECT * FROM conversations WHERE status = 'active' ORDER BY updated_at DESC LIMIT 5;
```

---

## 💡 Mensagens de Teste Sugeridas

### Simples (Teste Básico):
```
Olá!
```

### Financeiro:
```
Qual é o meu saldo?
```
```
Preciso adicionar uma despesa de R$ 500
```

### Marketing:
```
Como posso melhorar minhas vendas?
```

### Vendas:
```
Preciso de ajuda com um cliente
```

### RH:
```
Como contratar um funcionário?
```

---

## 🐛 Troubleshooting

### Não recebi resposta
**Possíveis causas**:
1. ❌ Python não está rodando na Vercel (ESPERADO)
2. ❌ Webhook não está configurado no UAZAPI
3. ❌ Número está incorreto
4. ❌ Instância desconectada

**Solução**:
- Verificar logs da Vercel
- Verificar se instância está conectada
- Conferir número do celular

### Recebi mensagem de erro técnico
**Causa**: Python não disponível (ESPERADO)

**Mensagem recebida**:
```
Desculpe, estou com dificuldades técnicas no momento. 
Por favor, tente novamente em alguns instantes.
```

**Isso significa**:
- ✅ Webhook funcionando
- ✅ Validação OK
- ✅ Banco salvando
- ❌ Python não executou

**Solução**: Deploy CrewAI em Railway/Render

### Webhook não está sendo chamado
**Verificar**:
1. Configuração do webhook no UAZAPI
2. URL: `https://falachefe.app.br/api/webhook/uaz`
3. Events: `messages`, `messages_update`

---

## 📞 Informações da Instância

```
URL Base: https://falachefe.uazapi.com
Token: 4fbeda58-0b8a-4905-9218-8ec89967a4a4
Admin Token: aCOqY35qDa9NCd25XmwgOKnBbKyxymZZfStBRaHzb8NiIqqfPn
Número Conectado: +55 47 9194-5151
Nome do Perfil: FL Terapeutas
Tipo: WhatsApp
Status: ✅ Conectado
Owner: 554791945151
```

---

## 🚀 Próximos Passos

Após testar com mensagem real:

1. **Se funcionar** → Documentar e celebrar! 🎉
2. **Se falhar** → Verificar logs e ajustar
3. **Deploy Python** → Railway/Render para 100% funcional

---

**ENVIE UMA MENSAGEM AGORA** para:

## 📱 **+55 47 9194-5151**
### (FL Terapeutas)

E observe o que acontece! 🚀

**Depois me conte:**
- Você recebeu resposta?
- Quanto tempo demorou?
- Qual mensagem recebeu?

Assim sabemos se precisa fazer deploy do Python ou se já está funcionando! 💬

