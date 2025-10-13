# 🔧 Instruções: Correção Timeout CrewAI no Servidor Hetzner

## 📋 Resumo do Problema

**Identificado:** CrewAI não estava inicializado, causando timeout em todas as requisições.

**Sintomas:**
- ✅ Payload sendo enviado corretamente do webhook
- ❌ Servidor CrewAI não respondendo (timeout 30s+)
- ⚠️ Health check mostrando `crew_initialized: false`

**Causa Raiz:** 
- CrewAI tentava inicializar no primeiro request
- Inicialização demorava > 120s (timeout do Gunicorn)
- Requests ficavam travados esperando

## ✅ Solução Implementada

1. **Pré-inicializar CrewAI** ao startar servidor (não no primeiro request)
2. **Aumentar timeout** do Gunicorn de 120s → 300s
3. **Script automático** de deploy

## 🚀 Como Aplicar a Correção

### Opção 1: Script Automático (RECOMENDADO)

```bash
# 1. Copiar script para o servidor
scp crewai-projects/falachefe_crew/update-servidor.sh root@37.27.248.13:/tmp/

# 2. Conectar ao servidor
ssh root@37.27.248.13

# 3. Executar script de atualização
bash /tmp/update-servidor.sh
```

O script irá:
- ✅ Fazer backup do `.env`
- ✅ Atualizar `GUNICORN_TIMEOUT=300`
- ✅ Baixar código atualizado do GitHub
- ✅ Rebuild da imagem Docker
- ✅ Restart dos containers
- ✅ Verificar inicialização
- ✅ Mostrar logs em tempo real

### Opção 2: Manual (Passo a Passo)

```bash
# 1. Conectar ao servidor
ssh root@37.27.248.13

# 2. Ir para diretório do projeto
cd /opt/falachefe-crewai

# 3. Backup do .env
cp .env .env.backup

# 4. Editar .env
nano .env
# Alterar: GUNICORN_TIMEOUT=300

# 5. Parar containers
docker compose down

# 6. Atualizar código
git fetch origin master
git reset --hard origin/master

# 7. Rebuild imagem
docker compose build --no-cache crewai-api

# 8. Iniciar containers
docker compose up -d

# 9. Ver logs de inicialização
docker compose logs -f crewai-api
```

## 📊 Validação

### 1. Verificar Logs de Inicialização

Você deve ver:

```
🚀 Starting Falachefe CrewAI API on port 8000
📡 UAZAPI: https://falachefe.uazapi.com
🔑 Token: ✅ Configured
⚙️  Pre-initializing CrewAI (this may take a minute)...
✅ CrewAI initialized successfully! Ready to process requests.
```

**⏱️ Tempo esperado:** 1-2 minutos de inicialização

### 2. Testar Health Check

```bash
curl http://localhost:8000/health | python3 -m json.tool
```

**Resposta esperada:**
```json
{
  "status": "healthy",
  "crew_initialized": true,  // ✅ Deve ser TRUE agora!
  "uazapi_configured": true,
  "service": "falachefe-crewai-api",
  "version": "1.0.0"
}
```

### 3. Testar Endpoint /process

```bash
curl -X POST http://localhost:8000/process \
  -H "Content-Type: application/json" \
  -d '{
    "message": "teste de inicialização",
    "userId": "test-123",
    "phoneNumber": "5511999999999",
    "context": {"source": "test"}
  }' | python3 -m json.tool
```

**Resposta esperada:** JSON com `success: true` e resposta do agente

### 4. Testar via WhatsApp

Envie uma mensagem pelo WhatsApp e verifique:

1. **Logs Vercel:** Deve mostrar payload sendo enviado
2. **Logs Hetzner:** Deve mostrar processamento CrewAI
3. **WhatsApp:** Deve receber resposta em ~10-30 segundos

## 🔍 Monitoramento

### Verificar Status Contínuo

```bash
# Logs em tempo real
docker compose logs -f crewai-api

# Status dos containers
docker compose ps

# Uso de recursos
docker stats falachefe-crewai-api

# Health check periódico
watch -n 5 'curl -s http://localhost:8000/health | python3 -m json.tool'
```

### Métricas Importantes

```bash
# Ver métricas Prometheus
curl http://localhost:8000/metrics

# Verificar:
# - falachefe_crew_initialized = 1 (✅ inicializado)
# - falachefe_uptime_seconds > 300 (✅ rodando estável)
# - falachefe_memory_percent < 80 (✅ memória OK)
```

## 🐛 Troubleshooting

### Problema: CrewAI ainda não inicializa

```bash
# Ver logs completos
docker compose logs crewai-api | grep -A 20 "Pre-initializing"

# Verificar variáveis de ambiente
docker compose exec crewai-api env | grep -E "(OPENAI|TIMEOUT)"

# Restart forçado
docker compose down
docker system prune -f
docker compose up -d --force-recreate
```

### Problema: Timeout persiste

```bash
# Aumentar ainda mais o timeout
nano .env
# GUNICORN_TIMEOUT=600  (10 minutos)

docker compose restart crewai-api
```

### Problema: Erro de memória

```bash
# Verificar uso
docker stats

# Se necessário, aumentar limite no docker-compose.yml:
# memory: 4G  (ao invés de 2G)

docker compose down
docker compose up -d
```

## 📝 Checklist de Validação

- [ ] Script executado com sucesso
- [ ] Logs mostram "✅ CrewAI initialized successfully"
- [ ] Health check retorna `crew_initialized: true`
- [ ] Endpoint /process responde sem timeout
- [ ] Mensagem WhatsApp recebe resposta
- [ ] Logs Vercel mostram resposta do CrewAI
- [ ] Sistema estável por 10+ minutos

## 🎯 Resultado Esperado

Após aplicar a correção:

1. ✅ **Startup:** 1-2 minutos (inicialização do CrewAI)
2. ✅ **First Request:** ~10-30s (processamento normal)
3. ✅ **Subsequent Requests:** ~10-30s (crew já inicializado)
4. ✅ **No Timeouts:** Todas requisições respondem
5. ✅ **Stable:** Sistema roda 24/7 sem reiniciar

## 📞 Suporte

Se encontrar problemas:

1. Verificar logs: `docker compose logs -f crewai-api`
2. Verificar variáveis: `docker compose config`
3. Status containers: `docker compose ps`
4. Me enviar output dos comandos acima

---

**Data:** 2025-10-13  
**Versão:** 1.0  
**Status:** ✅ Pronto para aplicar

