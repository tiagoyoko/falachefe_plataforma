# 🧪 Testes do Webhook Processor

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Testes Disponíveis](#testes-disponíveis)
4. [Como Executar](#como-executar)
5. [Verificar Resultados](#verificar-resultados)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

Este diretório contém testes para o **Webhook Processor**, que é o bridge entre o webhook Next.js e o CrewAI Python.

### Arquitetura

```
Webhook Next.js → webhook_processor.py → CrewAI → Resposta
```

### Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `webhook_processor.py` | Script principal (processa stdin → CrewAI → stdout) |
| `test_webhook_processor.sh` | Suite completa de testes (6 testes) |
| `test_webhook_quick.sh` | Teste rápido (1 teste) |
| `README-WEBHOOK-TESTS.md` | Este arquivo |

---

## ✅ Pré-requisitos

### 1. Ambiente Virtual Ativado

```bash
cd /Users/tiagoyokoyama/Falachefe/crewai-projects/falachefe_crew
source .venv/bin/activate
```

### 2. Dependências Instaladas

```bash
pip install -r requirements.txt
```

### 3. Variáveis de Ambiente

```bash
# Verificar .env
cat .env

# Deve conter:
OPENAI_API_KEY=sk-proj-...
MODEL=gpt-4o-mini
FALACHEFE_API_URL=http://localhost:3000
```

### 4. Servidor Next.js Rodando (Opcional)

```bash
# Em outro terminal
cd /Users/tiagoyokoyama/Falachefe
npm run dev
```

*Nota: Apenas necessário se os agentes fizerem chamadas à API*

---

## 🧪 Testes Disponíveis

### Teste Rápido (Recomendado para Primeiro Teste)

```bash
./test_webhook_quick.sh
```

**O que testa:**
- ✅ Script Python executa
- ✅ JSON input/output funciona
- ✅ CrewAI processa mensagem básica

**Tempo:** ~30 segundos

### Suite Completa de Testes

```bash
./test_webhook_processor.sh
```

**O que testa:**
1. ✅ Mensagem simples
2. ✅ Consulta de saldo
3. ✅ Registro de despesa
4. ✅ Contexto adicional
5. ✅ Validação: mensagem vazia (deve falhar)
6. ✅ Validação: sem user_id (deve falhar)

**Tempo:** ~3-5 minutos

### Teste Manual (Avançado)

```bash
# Testar com mensagem customizada
echo '{
  "user_message": "Sua mensagem aqui",
  "user_id": "seu_user_id",
  "phone_number": "+5511999999999"
}' | python webhook_processor.py
```

---

## 🚀 Como Executar

### Passo 1: Navegar para o Diretório

```bash
cd /Users/tiagoyokoyama/Falachefe/crewai-projects/falachefe_crew
```

### Passo 2: Ativar Ambiente

```bash
source .venv/bin/activate
```

### Passo 3: Executar Teste

#### Opção A: Teste Rápido

```bash
./test_webhook_quick.sh
```

**Saída esperada:**

```
🚀 TESTE RÁPIDO DO WEBHOOK PROCESSOR

📥 Enviando mensagem para o CrewAI...
{
  "user_message": "Olá, qual é o meu saldo?",
  "user_id": "test_user",
  "phone_number": "+5511999999999"
}

⏳ Processando...

📤 Resposta:

{
  "success": true,
  "response": "Olá! Para consultar seu saldo...",
  "metadata": {
    "processed_at": "2025-10-08T20:00:00",
    "crew_type": "hierarchical",
    "processing_time_ms": 5234
  }
}

✅ Sucesso!
```

#### Opção B: Suite Completa

```bash
./test_webhook_processor.sh
```

**Saída esperada:**

```
==========================================
🧪 TESTE DO WEBHOOK PROCESSOR
==========================================

✅ Script encontrado

==========================================
TESTE 1: Mensagem Simples
==========================================

📥 Input:
{...}

🚀 Executando...

📤 Output:
{...}

✅ Teste passou (exit code: 0)

[... mais 5 testes ...]

==========================================
📊 RESUMO DOS TESTES
==========================================

✅ Testes funcionais: 4
✅ Testes de validação: 2

🎉 Todos os testes executados!
```

---

## 📊 Verificar Resultados

### Estrutura da Resposta

```json
{
  "success": true,         // ou false em caso de erro
  "response": "...",       // Resposta do CrewAI para o usuário
  "metadata": {
    "processed_at": "2025-10-08T20:00:00",
    "crew_type": "hierarchical",
    "agents_used": [
      "orchestrator",
      "financial_expert",
      ...
    ],
    "processing_time_ms": 5234,
    "user_id": "test_user",
    "phone_number": "+5511999999999"
  }
}
```

### Logs

Os logs são escritos no **stderr** (não poluem stdout):

```bash
# Ver logs durante execução
./test_webhook_quick.sh 2>&1 | grep -E "📥|🚀|✅|❌"
```

**Logs esperados:**

```
📥 Processing message: Olá, qual é o meu saldo?...
👤 User ID: test_user
🚀 Initializing FalachefeCrew (orchestrated)...
🎯 Executing crew with inputs...
✅ Crew executed successfully in 5234ms
```

---

## 🐛 Troubleshooting

### Erro: "webhook_processor.py: command not found"

**Problema:** Script não tem permissão de execução

**Solução:**
```bash
chmod +x webhook_processor.py
chmod +x test_webhook_processor.sh
chmod +x test_webhook_quick.sh
```

### Erro: "Module not found: falachefe_crew"

**Problema:** Ambiente virtual não ativado ou dependências não instaladas

**Solução:**
```bash
# Ativar ambiente
source .venv/bin/activate

# Verificar
which python
# Deve mostrar: /Users/tiagoyokoyama/Falachefe/crewai-projects/falachefe_crew/.venv/bin/python

# Instalar dependências
pip install -r requirements.txt
```

### Erro: "OpenAI API Key not configured"

**Problema:** Variável OPENAI_API_KEY não configurada

**Solução:**
```bash
# Verificar .env
cat .env | grep OPENAI

# Se não tiver, adicionar:
echo "OPENAI_API_KEY=sk-proj-sua-chave" >> .env
```

### Erro: "Invalid JSON"

**Problema:** JSON mal formatado

**Solução:**
```bash
# Validar JSON antes de enviar
echo '{"user_message":"teste","user_id":"123","phone_number":"+5511999999999"}' | jq .

# Se OK, então testar:
echo '{"user_message":"teste","user_id":"123","phone_number":"+5511999999999"}' | python webhook_processor.py
```

### Timeout ou Processo Lento

**Problema:** CrewAI pode demorar em mensagens complexas

**Solução:**
- ✅ Normal: 5-10 segundos para mensagens simples
- ⚠️ Lento: 30-60 segundos para consultorias complexas
- ❌ Travado: >60 segundos, cancelar e investigar

```bash
# Adicionar timeout
timeout 60 ./test_webhook_quick.sh
```

### Resposta "Erro interno"

**Problema:** Exceção no código Python

**Solução:**
```bash
# Ver traceback completo
./test_webhook_quick.sh 2>&1 | less

# Ou executar Python diretamente
echo '{"user_message":"teste","user_id":"123","phone_number":"+5511999999999"}' | \
  python webhook_processor.py 2>&1
```

---

## 📈 Próximos Passos

### Após Testes Locais Passarem

1. **Integrar com Webhook Next.js**
   - Implementar `/api/crewai/process`
   - Atualizar `/api/webhook/uaz`

2. **Testar Integração Completa**
   - Simular webhook do WhatsApp
   - Verificar fluxo end-to-end

3. **Monitorar em Produção**
   - Adicionar logging
   - Configurar métricas
   - Implementar alertas

---

## 📚 Referências

- [WEBHOOK-CREWAI-INTEGRATION.md](../../docs/crewai/WEBHOOK-CREWAI-INTEGRATION.md) - Documentação completa da integração
- [GUIA-INTEGRACAO.md](../../docs/crewai/GUIA-INTEGRACAO.md) - Guia geral de integração
- [crew.py](src/falachefe_crew/crew.py) - Código dos agentes

---

## 🆘 Suporte

Em caso de problemas:

1. **Verificar pré-requisitos** acima
2. **Consultar Troubleshooting** acima
3. **Ver logs** com `2>&1`
4. **Executar teste manual** com mensagem simples

---

**Última atualização:** 08/10/2025  
**Versão:** 1.0.0  
**Status:** ✅ Pronto para testes

