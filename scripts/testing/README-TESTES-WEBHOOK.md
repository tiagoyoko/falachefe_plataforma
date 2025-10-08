# 🧪 Scripts de Teste - Webhook e CrewAI

## 📋 Visão Geral

Scripts para testar a integração Webhook → CrewAI na plataforma Falachefe.

## 🎯 Status Atual

### ✅ O que funciona

- **Webhook recebe mensagens** do UAZAPI (WhatsApp)
- **Mensagens são salvas** no banco de dados
- **CrewAI processa mensagens** standalone (isoladamente)

### ❌ O que NÃO funciona

- **Webhook NÃO chama CrewAI** (código desabilitado)
- **Endpoint `/api/crewai/process`** não existe
- **Resposta automática** não está implementada

## 🚀 Como Testar

### 1️⃣ Testar Webhook em Produção

Testa se o webhook está recebendo e salvando mensagens.

```bash
cd /Users/tiagoyokoyama/Falachefe
./scripts/testing/test-webhook-production.sh
```

**O que testa:**
- ✅ Health check do endpoint
- ✅ Envio de mensagem simulada
- ✅ Processamento e salvamento no banco

**Tempo**: ~30 segundos

**Resultado esperado:**
```
✅ Teste 1: Health check OK
✅ Teste 2: Webhook processa mensagens OK
⚠️  Teste 3: Verificar logs manualmente
```

### 2️⃣ Testar CrewAI Standalone (Local)

Testa se o processador CrewAI funciona isoladamente.

```bash
cd /Users/tiagoyokoyama/Falachefe
./scripts/testing/test-crewai-local.sh
```

**O que testa:**
- ✅ Pré-requisitos (ambiente, dependências)
- ✅ Mensagem simples
- ✅ Consulta de saldo
- ✅ Validação de erro

**Tempo**: ~2-3 minutos

**Resultado esperado:**
```
✅ Teste 1: Mensagem simples OK
✅ Teste 2: Consulta de saldo OK
✅ Teste 3: Validação OK

🎉 Todos os testes passaram!
```

---

## 📊 Arquivos

| Arquivo | Descrição | Uso |
|---------|-----------|-----|
| `test-webhook-production.sh` | Testa webhook em produção | Verifica se webhook recebe mensagens |
| `test-crewai-local.sh` | Testa CrewAI standalone | Valida processador Python |
| `README-TESTES-WEBHOOK.md` | Este arquivo | Documentação dos testes |

---

## 🔍 Verificar Logs da Vercel

Após executar `test-webhook-production.sh`:

1. Acesse: https://vercel.com/[seu-usuario]/falachefe/logs
2. Filtre por: `Runtime Logs` → `/api/webhook/uaz`
3. Procure por:
   - ✅ `UAZ Webhook received`
   - ✅ `Message saved successfully`
   - ⚠️ `AgentOrchestrator disabled` (esperado)

---

## ⚙️ Pré-requisitos

### Para teste de produção:
- `curl` instalado
- `jq` instalado (opcional, para formatar JSON)
- Acesso à internet

### Para teste local do CrewAI:
- Python 3.10+ instalado
- Ambiente virtual configurado
- Dependências instaladas
- `OPENAI_API_KEY` configurada

```bash
# Setup inicial (uma vez apenas)
cd /Users/tiagoyokoyama/Falachefe/crewai-projects/falachefe_crew

# Criar ambiente virtual (se não existir)
python -m venv .venv

# Ativar ambiente
source .venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Configurar .env
cp .env.example .env
# Editar .env e adicionar sua OPENAI_API_KEY
```

---

## 🐛 Troubleshooting

### Problema: "Permission denied"

```bash
chmod +x scripts/testing/*.sh
```

### Problema: "jq: command not found"

```bash
# macOS
brew install jq

# Linux
sudo apt-get install jq
```

### Problema: "Python ModuleNotFoundError"

```bash
cd crewai-projects/falachefe_crew
source .venv/bin/activate
pip install -r requirements.txt
```

### Problema: "OpenAI API Key not configured"

```bash
cd crewai-projects/falachefe_crew
echo 'OPENAI_API_KEY=sk-proj-sua-chave' >> .env
```

---

## 📈 Próximos Passos

Após confirmar que os testes funcionam:

1. **Implementar endpoint `/api/crewai/process`**
   - Criar bridge Next.js → Python
   - Chamar `webhook_processor.py` via `child_process`

2. **Atualizar webhook**
   - Modificar `/api/webhook/uaz/route.ts`
   - Chamar endpoint bridge em vez de código comentado

3. **Testar integração completa**
   - Webhook → Bridge → CrewAI → Resposta

4. **Deploy em produção**
   - Commit, push, deploy Vercel
   - Testar com mensagem real do WhatsApp

---

## 📚 Documentação Completa

Ver: `/Users/tiagoyokoyama/Falachefe/GUIA-TESTE-WEBHOOK-CREWAI.md`

---

**Última atualização**: 08/10/2025  
**Status**: ⚠️ Testes parciais (webhook OK, CrewAI OK, integração pendente)

