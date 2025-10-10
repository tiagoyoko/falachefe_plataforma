# 🔄 Atualização de Domínio: api.falachefe.app.br

**Data**: 10 de Outubro de 2025  
**Servidor**: 37.27.248.13 (Hetzner)  
**Mudança**: `falachefe.app.br` → `api.falachefe.app.br`

---

## 📋 CHECKLIST DE ATUALIZAÇÃO

### ✅ 1. Arquivos Locais (Já Atualizados)

- [x] `vercel.json` - Headers CORS e variáveis de ambiente
- [x] `src/lib/message-routing/message-router.ts` - URL base CrewAI
- [x] `src/lib/cors.ts` - Origens permitidas
- [x] `src/lib/auth/auth-client.ts` - Base URL autenticação
- [x] `src/lib/auth/auth.ts` - Base URL Better Auth

### 🔧 2. Servidor Hetzner (Precisa Atualizar)

- [ ] Configuração DNS
- [ ] Docker Stack (Traefik labels)
- [ ] Variáveis de ambiente
- [ ] Certificado SSL
- [ ] Testes de validação

---

## 🌐 PASSO 1: Configurar DNS

### 1.1 Adicionar Registro DNS

No seu provedor DNS (Cloudflare, GoDaddy, etc.), adicione um novo registro:

```
Tipo: A
Nome: api
Valor: 37.27.248.13
TTL: Auto ou 3600
Proxy: Desativado (se usar Cloudflare)
```

**Resultado**: `api.falachefe.app.br` → `37.27.248.13`

### 1.2 Verificar Propagação

```bash
# Verificar DNS
nslookup api.falachefe.app.br

# Deve retornar:
# Server: ...
# Address: ...
# Name:    api.falachefe.app.br
# Address: 37.27.248.13

# Ou usar dig
dig +short api.falachefe.app.br
# Deve retornar: 37.27.248.13
```

⏰ **Aguarde**: DNS pode levar de 5 minutos a 24 horas para propagar.

---

## 🐳 PASSO 2: Atualizar Docker Stack no Servidor Hetzner

### 2.1 Conectar no Servidor

```bash
ssh root@37.27.248.13
cd /opt/falachefe-crewai
```

### 2.2 Criar/Atualizar docker-stack.yml

Crie ou edite o arquivo `docker-stack.yml`:

```bash
nano docker-stack.yml
```

**Conteúdo completo:**

```yaml
version: "3.8"

services:
  crewai-api:
    image: falachefe-crewai:latest
    networks:
      - netrede
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - UAZAPI_BASE_URL=${UAZAPI_BASE_URL}
      - UAZAPI_TOKEN=${UAZAPI_TOKEN}
      - UAZAPI_ADMIN_TOKEN=${UAZAPI_ADMIN_TOKEN}
      - GUNICORN_WORKERS=${GUNICORN_WORKERS:-2}
      - GUNICORN_THREADS=${GUNICORN_THREADS:-4}
      - GUNICORN_TIMEOUT=${GUNICORN_TIMEOUT:-120}
      - LOG_LEVEL=${LOG_LEVEL:-info}
      - PYTHONUNBUFFERED=1
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.hostname == manager
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      labels:
        # Habilitar Traefik
        - "traefik.enable=true"
        - "traefik.docker.network=netrede"
        
        # HTTP Router (Redirect para HTTPS)
        - "traefik.http.routers.crewai-http.rule=Host(`api.falachefe.app.br`)"
        - "traefik.http.routers.crewai-http.entrypoints=web"
        - "traefik.http.routers.crewai-http.middlewares=redirect-to-https"
        
        # HTTPS Router
        - "traefik.http.routers.crewai-https.rule=Host(`api.falachefe.app.br`)"
        - "traefik.http.routers.crewai-https.entrypoints=websecure"
        - "traefik.http.routers.crewai-https.tls=true"
        - "traefik.http.routers.crewai-https.tls.certresolver=letsencrypt"
        
        # Load Balancer
        - "traefik.http.services.crewai.loadbalancer.server.port=8000"
        
        # Middleware de Redirect
        - "traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https"
        - "traefik.http.middlewares.redirect-to-https.redirectscheme.permanent=true"

networks:
  netrede:
    external: true
```

### 2.3 Verificar Arquivo .env

Certifique-se que o `.env` existe e está correto:

```bash
cat .env

# Deve conter:
# OPENAI_API_KEY=sk-proj-...
# UAZAPI_BASE_URL=https://falachefe.uazapi.com
# UAZAPI_TOKEN=4fbeda58-0b8a-4905-9218-8ec89967a4a4
# UAZAPI_ADMIN_TOKEN=aCOqY35qDa9NCd25XmwgOKnBbKyxymZZfStBRaHzb8NiIqqfPn
# GUNICORN_WORKERS=2
# GUNICORN_THREADS=4
# GUNICORN_TIMEOUT=120
# LOG_LEVEL=info
```

### 2.4 Deploy da Stack Atualizada

```bash
# Deploy com o novo domínio
docker stack deploy -c docker-stack.yml falachefe --with-registry-auth

# Verificar status
docker service ls | grep falachefe
# Deve mostrar: falachefe_crewai-api   replicated   1/1

# Ver logs
docker service logs falachefe_crewai-api -f
```

### 2.5 Aguardar Certificado SSL

O Traefik irá automaticamente:
1. Detectar o novo domínio `api.falachefe.app.br`
2. Solicitar certificado Let's Encrypt
3. Configurar HTTPS

⏰ **Tempo**: ~1-2 minutos

Verificar logs do Traefik:

```bash
# Encontrar o container do Traefik
docker ps | grep traefik

# Ver logs (substituir XXX pelo ID)
docker logs traefik_traefik.1.XXX --tail=50 | grep -i "letsencrypt\|api.falachefe"
```

---

## 🧪 PASSO 3: Testar Novo Domínio

### 3.1 Teste DNS

```bash
# Do seu Mac ou do servidor
curl -I https://api.falachefe.app.br/health

# Deve retornar:
# HTTP/2 200
# content-type: application/json
```

### 3.2 Teste Health Check

```bash
curl -s https://api.falachefe.app.br/health | jq

# Resposta esperada:
{
  "status": "healthy",
  "service": "falachefe-crewai-api",
  "version": "1.0.0",
  "timestamp": "2025-10-10T...",
  "crew_initialized": false,
  "uazapi_configured": true,
  "system": {
    "cpu_percent": 2.3,
    "memory_percent": 47.1,
    "disk_percent": 85.8
  }
}
```

### 3.3 Teste HTTPS Redirect

```bash
curl -sI http://api.falachefe.app.br/health

# Deve retornar:
# HTTP/1.1 301 Moved Permanently
# Location: https://api.falachefe.app.br/health
```

### 3.4 Teste Certificado SSL

```bash
echo | openssl s_client -connect api.falachefe.app.br:443 2>/dev/null | openssl x509 -noout -issuer -dates

# Deve retornar:
# issuer=C = US, O = Let's Encrypt, CN = ...
# notBefore=Oct 10 ...
# notAfter=Jan 08 ...
```

### 3.5 Teste de Processamento

```bash
curl -X POST https://api.falachefe.app.br/process \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Teste de integração",
    "userId": "user-test-123",
    "phoneNumber": "5511999999999",
    "context": {}
  }'

# Deve processar e retornar (pode levar ~3min)
```

---

## 🔄 PASSO 4: Atualizar Integrações

### 4.1 Atualizar Webhook UAZAPI

**No painel UAZAPI** (https://falachefe.uazapi.com):

1. Vá em **Settings** → **Webhooks**
2. Atualizar URL do webhook:
   ```
   Antiga: https://falachefe.app.br/api/webhook/uaz
   Nova:   https://api.falachefe.app.br/api/webhook/uaz
   ```
3. Salvar alterações

**Via API (alternativa):**

```bash
curl -X PUT "https://falachefe.uazapi.com/api/v1/webhooks" \
  -H "Authorization: Bearer aCOqY35qDa9NCd25XmwgOKnBbKyxymZZfStBRaHzb8NiIqqfPn" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://api.falachefe.app.br/api/webhook/uaz",
    "events": ["messages", "messages_update"]
  }'
```

### 4.2 Atualizar Variáveis no Vercel

**Do seu Mac:**

```bash
cd /Users/tiagoyokoyama/Falachefe

# Atualizar variável de ambiente
vercel env add CREWAI_API_URL production

# Quando solicitado, inserir:
# api.falachefe.app.br

# Ou via CLI direto:
vercel env rm CREWAI_API_URL production
vercel env add CREWAI_API_URL production <<< "https://api.falachefe.app.br"

# Deploy para aplicar
vercel --prod
```

**Ou via Dashboard Vercel:**

1. Acesse https://vercel.com/tiago-6739s-projects/falachefe
2. Vá em **Settings** → **Environment Variables**
3. Encontre `CREWAI_API_URL`
4. Editar valor para: `https://api.falachefe.app.br`
5. Salvar
6. Fazer novo deploy (Dashboard → Deployments → Redeploy)

### 4.3 Atualizar Scripts de Teste

```bash
cd /Users/tiagoyokoyama/Falachefe

# Atualizar scripts
sed -i '' 's|https://falachefe.app.br|https://api.falachefe.app.br|g' scripts/testing/*.sh

# Commit das alterações
git add .
git commit -m "chore: atualizar domínio para api.falachefe.app.br"
git push origin master
```

---

## 📊 PASSO 5: Monitoramento Pós-Deploy

### 5.1 Verificar Logs do Traefik

```bash
ssh root@37.27.248.13

# Logs do Traefik
docker service logs traefik_traefik -f --tail=100 | grep "api.falachefe"
```

### 5.2 Verificar Logs da API

```bash
# Logs do serviço CrewAI
docker service logs falachefe_crewai-api -f --tail=100
```

### 5.3 Monitorar Métricas

```bash
# Métricas Prometheus
curl -s https://api.falachefe.app.br/metrics | grep falachefe_uptime

# Ou acessar dashboard (se configurado)
# Prometheus: http://37.27.248.13:9090
# Grafana: http://37.27.248.13:3000
```

---

## 🔍 TROUBLESHOOTING

### Problema 1: DNS não resolve

```bash
# Verificar DNS
dig api.falachefe.app.br

# Se não resolver:
# - Verificar configuração no provedor DNS
# - Aguardar propagação (até 24h)
# - Limpar cache DNS local: sudo dscacheutil -flushcache (Mac)
```

### Problema 2: Certificado SSL não gera

```bash
# Verificar logs do Traefik
docker logs traefik_traefik.1.XXX | grep -i "acme\|letsencrypt\|api.falachefe"

# Problemas comuns:
# - Porta 80/443 não acessível externamente
# - DNS não propagado
# - Rate limit Let's Encrypt (5 certs/week por domínio)

# Solução: Forçar renovação
docker service update --force falachefe_crewai-api
```

### Problema 3: Erro 502 Bad Gateway

```bash
# Verificar se serviço está rodando
docker service ps falachefe_crewai-api

# Verificar logs
docker service logs falachefe_crewai-api --tail=50

# Restart do serviço
docker service update --force falachefe_crewai-api
```

### Problema 4: Domínio antigo ainda responde

```bash
# Normal! Ambos podem coexistir
# Para remover o antigo, edite docker-stack.yml e remova as labels do domínio antigo

# Depois:
docker stack deploy -c docker-stack.yml falachefe --with-registry-auth
```

---

## 🎯 CHECKLIST FINAL

### Servidor Hetzner
- [ ] DNS `api.falachefe.app.br` → `37.27.248.13` configurado
- [ ] `docker-stack.yml` atualizado com novo domínio
- [ ] Stack redeployada: `docker stack deploy -c docker-stack.yml falachefe`
- [ ] Certificado SSL gerado pelo Traefik
- [ ] HTTPS funcionando: `curl https://api.falachefe.app.br/health`
- [ ] Redirect HTTP→HTTPS ativo

### Integrações
- [ ] Webhook UAZAPI atualizado
- [ ] Variável `CREWAI_API_URL` no Vercel atualizada
- [ ] Deploy do Vercel realizado
- [ ] Scripts de teste atualizados

### Testes
- [ ] Health check: `curl https://api.falachefe.app.br/health`
- [ ] Processamento: `curl -X POST https://api.falachefe.app.br/process ...`
- [ ] Webhook WhatsApp funcionando
- [ ] Logs sem erros

---

## 📝 COMANDOS DE REFERÊNCIA RÁPIDA

### No Servidor Hetzner

```bash
# Conectar
ssh root@37.27.248.13

# Ir para diretório
cd /opt/falachefe-crewai

# Ver status
docker service ls | grep falachefe

# Ver logs
docker service logs falachefe_crewai-api -f

# Restart
docker service update --force falachefe_crewai-api

# Redeploy
docker stack deploy -c docker-stack.yml falachefe --with-registry-auth
```

### Do Seu Mac

```bash
# Testar health
curl -s https://api.falachefe.app.br/health | jq

# Testar processamento
curl -X POST https://api.falachefe.app.br/process \
  -H "Content-Type: application/json" \
  -d '{"message":"teste","userId":"123","phoneNumber":"5511999999999","context":{}}'

# Deploy Vercel
cd /Users/tiagoyokoyama/Falachefe
vercel --prod
```

---

## 🎉 RESULTADO ESPERADO

Após concluir todos os passos:

✅ **Novo domínio**: https://api.falachefe.app.br  
✅ **HTTPS ativo**: Certificado Let's Encrypt  
✅ **Redirect HTTP→HTTPS**: Automático  
✅ **Webhook UAZAPI**: Atualizado  
✅ **Integração Vercel**: Funcionando  

**Endpoints disponíveis:**
- `https://api.falachefe.app.br/health` - Health check
- `https://api.falachefe.app.br/metrics` - Métricas Prometheus
- `https://api.falachefe.app.br/process` - Processamento CrewAI

---

## 📞 SUPORTE

**Logs em tempo real:**
```bash
ssh root@37.27.248.13 'docker service logs falachefe_crewai-api -f'
```

**Verificar Traefik:**
```bash
ssh root@37.27.248.13 'docker service logs traefik_traefik -f | grep api.falachefe'
```

**Em caso de problemas:**
1. Verificar DNS propagou
2. Ver logs do Traefik (certificado SSL)
3. Ver logs da API (aplicação rodando)
4. Testar com curl (conectividade)

---

**📚 Documentação Relacionada:**
- `DOMINIO-TRAEFIK-SUCCESS.md` - Setup inicial Traefik
- `DEPLOY-HETZNER-SUCCESS.md` - Deploy inicial
- `DOCKER-COMPOSE-SETUP-COMPLETO.md` - Setup Docker

---

**✅ ATUALIZAÇÃO CONCLUÍDA!**

Documentação atualizada em: 10 de Outubro de 2025

