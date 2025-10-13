# 🔧 Troubleshooting: Servidor Hetzner Offline

**Data**: 12/10/2025  
**Status**: ❌ Servidor Inacessível  
**IP**: 37.27.248.13:8000

---

## 🚨 Problema Detectado

### Sintomas:
```bash
# Ping
❌ 100% packet loss (3 pacotes)

# Health Check
❌ Timeout após 75s
❌ HTTP Status: 000

# Conclusão
❌ Servidor completamente inacessível
```

### Timeline:
- ✅ **10/01/2025 13:46**: Servidor funcionando (DEPLOY-HETZNER-SUCCESS.md)
- ⏸️  **??/??/2025**: Servidor parou
- ❌ **12/10/2025 07:21**: Servidor offline (detectado agora)

---

## 🔍 Diagnóstico Completo

### Teste 1: Endpoint Chat Web (Vercel)
```bash
curl https://falachefe.app.br/api/chat

✅ Status: 200 OK
✅ Tempo: 1.21s
✅ Resposta: {"status":"ok","service":"Web Chat API"}
```

**Conclusão**: Vercel está OK ✅

### Teste 2: Servidor Hetzner
```bash
curl http://37.27.248.13:8000/health

❌ Timeout após 75s
❌ Ping: 100% packet loss
```

**Conclusão**: Servidor está DOWN ❌

---

## 🔧 Soluções Possíveis

### Opção A: Reiniciar Servidor Hetzner (Recomendado)

Se você tem acesso SSH:

```bash
# Conectar ao servidor
ssh root@37.27.248.13
# ou
ssh seu-usuario@37.27.248.13

# Verificar containers Docker
docker ps -a

# Verificar se container existe
docker ps -a | grep falachefe-crewai-api

# Reiniciar container
docker-compose -f /opt/falachefe-crewai/docker-compose.yml restart

# Ou subir novamente
cd /opt/falachefe-crewai
docker-compose up -d

# Verificar logs
docker-compose logs -f crewai-api
```

### Opção B: Docker Local (Para Testes)

Rodar localmente para testes imediatos:

```bash
cd /Users/tiagoyokoyama/Falachefe/crewai-projects/falachefe_crew

# Iniciar Docker Desktop
open -a Docker

# Aguardar Docker iniciar (10-30s)
sleep 15

# Subir stack
docker-compose up -d --build

# Verificar
docker-compose ps
docker-compose logs -f crewai-api

# Atualizar .env.local
echo "CREWAI_API_URL=http://localhost:8000/process" >> .env.local

# Testar localmente
npm run dev
# Abra: http://localhost:3000/chat
```

---

## 📋 Checklist de Recuperação

### Para Hetzner:
- [ ] SSH no servidor (ssh root@37.27.248.13)
- [ ] Verificar Docker rodando (docker ps)
- [ ] Verificar container (docker ps | grep crewai)
- [ ] Ver logs (docker logs falachefe-crewai-api)
- [ ] Reiniciar se necessário (docker-compose restart)
- [ ] Testar health (curl localhost:8000/health)
- [ ] Testar externamente (curl http://37.27.248.13:8000/health)

### Para Docker Local:
- [ ] Rodar docker-compose up -d
- [ ] Verificar logs (docker-compose logs -f)
- [ ] Testar endpoint local (curl localhost:8000/health)
- [ ] Ajustar CREWAI_API_URL se necessário
- [ ] Testar

### Para Local (testes):
- [ ] Abrir Docker Desktop
- [ ] docker-compose up -d
- [ ] npm run dev
- [ ] Testar em http://localhost:3000/chat

---

## 🎯 Recomendação Imediata

### Opção 1: Se Tem Acesso SSH ao Hetzner
Reinicie o servidor e verifique os containers.

### Opção 2: Se Não Tem Acesso
Use **Docker Local** para testes (5-10 minutos):
1. `cd crewai-projects/falachefe_crew`
2. `docker-compose up -d`
3. Verificar logs: `docker-compose logs -f`
4. Testar localmente
5. Ajustar configuração conforme necessário

### Opção 3: Teste Local Imediato
Rode Docker local para validar que tudo funciona.

---

## 📚 Documentação Relacionada

- `DEPLOY-HETZNER-SUCCESS.md` - Setup original do Hetzner
- `GUIA-CHAT-WEB-DOCKER.md` - Docker local
- `README-CHAT-WEB-CREWAI.md` - Visão geral
- `ARQUITETURA-DOMINIOS.md` - Arquitetura completa

---

**O que você prefere fazer?**
1. 🔧 Reiniciar Hetzner (se tem acesso SSH)
2. 🐳 Docker local (para testes)
3. 📊 Verificar status e logs do servidor

