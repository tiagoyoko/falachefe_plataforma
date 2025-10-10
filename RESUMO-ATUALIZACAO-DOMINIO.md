# ✅ Resumo: Atualização de Domínio para api.falachefe.app.br

**Data**: 10 de Outubro de 2025  
**Status**: 🟡 PARCIALMENTE CONCLUÍDO

---

## 📝 O QUE FOI FEITO

### ✅ Arquivos Locais Atualizados

Todos os arquivos do projeto Next.js foram atualizados para usar o novo domínio `api.falachefe.app.br`:

1. **`vercel.json`**
   - Headers CORS atualizado
   - Variáveis de ambiente `NEXT_PUBLIC_APP_URL`

2. **`src/lib/message-routing/message-router.ts`**
   - URL base padrão do CrewAI

3. **`src/lib/cors.ts`**
   - Lista de origens permitidas
   - Origem padrão

4. **`src/lib/auth/auth-client.ts`**
   - Base URL do cliente de autenticação

5. **`src/lib/auth/auth.ts`**
   - Base URL do Better Auth

6. **`config/env.example`**
   - Exemplo de URL do webhook

---

## 🔧 O QUE PRECISA SER FEITO NO SERVIDOR

### 📋 Checklist para o Servidor Hetzner (37.27.248.13)

#### 1. DNS (Prioridade: ALTA)
```bash
# Configurar no provedor DNS
Tipo: A
Nome: api
Valor: 37.27.248.13
```

#### 2. Docker Stack (Prioridade: ALTA)
```bash
# Conectar no servidor
ssh root@37.27.248.13
cd /opt/falachefe-crewai

# Atualizar docker-stack.yml
# Trocar todas as labels Traefik:
# DE:  Host(`falachefe.app.br`)
# PARA: Host(`api.falachefe.app.br`)

# Redeploy
docker stack deploy -c docker-stack.yml falachefe --with-registry-auth
```

#### 3. Webhook UAZAPI (Prioridade: ALTA)
```
Atualizar URL no painel UAZAPI:
DE:  https://falachefe.app.br/api/webhook/uaz
PARA: https://api.falachefe.app.br/api/webhook/uaz
```

#### 4. Variáveis Vercel (Prioridade: MÉDIA)
```bash
# Atualizar CREWAI_API_URL
vercel env rm CREWAI_API_URL production
vercel env add CREWAI_API_URL production
# Valor: https://api.falachefe.app.br

# Redeploy
vercel --prod
```

---

## 📚 DOCUMENTAÇÃO CRIADA

### Guia Completo
➡️ **`ATUALIZACAO-DOMINIO-API.md`**

Este guia contém:
- ✅ Passo a passo completo de atualização
- ✅ Comandos prontos para copiar e colar
- ✅ Testes de validação
- ✅ Troubleshooting
- ✅ Checklist de verificação

---

## 🚀 PRÓXIMOS PASSOS

### Ordem Recomendada:

1. **Configurar DNS** (5-10 min)
   - Acessar painel do provedor DNS
   - Adicionar registro A: `api` → `37.27.248.13`
   - Aguardar propagação (5min-24h)

2. **Atualizar Docker Stack** (10-15 min)
   - SSH no servidor
   - Editar `docker-stack.yml`
   - Fazer redeploy
   - Aguardar certificado SSL

3. **Testar Novo Domínio** (5 min)
   ```bash
   curl https://api.falachefe.app.br/health
   ```

4. **Atualizar Integrações** (10 min)
   - Webhook UAZAPI
   - Variáveis Vercel
   - Redeploy aplicações

5. **Validação Final** (5 min)
   - Testar fluxo completo WhatsApp
   - Verificar logs
   - Confirmar funcionamento

---

## 📊 ARQUIVOS MODIFICADOS

```
/Users/tiagoyokoyama/Falachefe/
├── vercel.json                              ✅ ATUALIZADO
├── config/env.example                       ✅ ATUALIZADO
├── src/
│   └── lib/
│       ├── cors.ts                          ✅ ATUALIZADO
│       ├── auth/
│       │   ├── auth.ts                      ✅ ATUALIZADO
│       │   └── auth-client.ts               ✅ ATUALIZADO
│       └── message-routing/
│           └── message-router.ts            ✅ ATUALIZADO
├── ATUALIZACAO-DOMINIO-API.md               ✅ CRIADO
└── RESUMO-ATUALIZACAO-DOMINIO.md            ✅ CRIADO (este arquivo)
```

---

## 🔍 ARQUIVOS QUE PODEM PRECISAR ATUALIZAÇÃO MANUAL

Os seguintes arquivos contêm referências ao domínio antigo na **documentação** ou **scripts de teste**.  
Eles não afetam o funcionamento, mas devem ser atualizados para consistência:

### Scripts de Teste (Baixa Prioridade)
- `scripts/testing/test-webhook-production.sh`
- `scripts/testing/test-production-webhook-real.sh`
- `scripts/testing/test-webhook-detailed.sh`
- `scripts/testing/update-vercel-uazapi-token.sh`

**Como atualizar:**
```bash
cd /Users/tiagoyokoyama/Falachefe
find scripts/testing -name "*.sh" -type f -exec sed -i '' 's|https://falachefe.app.br|https://api.falachefe.app.br|g' {} \;
```

### Documentação (Baixa Prioridade)
- `DOMINIO-TRAEFIK-SUCCESS.md`
- `DEPLOY-HETZNER-SUCCESS.md`
- `DIAGNOSTICO-INTEGRACAO-AGENTES.md`
- `COMO-TESTAR-WEBHOOK-WHATSAPP.md`
- `RELATORIO-FINAL-WEBHOOK-CREWAI.md`
- `INTEGRACAO-COMPLETA-WEBHOOK-CREWAI.md`
- `GUIA-TESTE-WEBHOOK-CREWAI.md`
- `docs/DEPLOY-ERRORS-SUMMARY.md`

**Nota**: Esses arquivos são históricos/referência. Podem permanecer como estão ou serem atualizados posteriormente.

---

## ⚠️ IMPORTANTE

### Domínios em Paralelo
- O domínio antigo `falachefe.app.br` pode continuar funcionando
- Ambos podem coexistir sem problemas
- Para remover o antigo, edite `docker-stack.yml` e remova as labels antigas

### Certificados SSL
- Traefik gerará automaticamente certificado para `api.falachefe.app.br`
- Processo leva 1-2 minutos após deploy
- Let's Encrypt tem limite de 5 certificados/semana por domínio

### DNS
- Aguarde propagação DNS antes de testar
- Use `nslookup api.falachefe.app.br` para verificar
- Pode levar até 24h (geralmente 5-30 min)

---

## 🧪 TESTE RÁPIDO

Após completar os passos no servidor, teste:

```bash
# 1. DNS resolvendo
dig +short api.falachefe.app.br
# Esperado: 37.27.248.13

# 2. HTTPS funcionando
curl -I https://api.falachefe.app.br/health
# Esperado: HTTP/2 200

# 3. Health check OK
curl -s https://api.falachefe.app.br/health | jq .status
# Esperado: "healthy"

# 4. Redirect HTTP→HTTPS
curl -I http://api.falachefe.app.br/health
# Esperado: HTTP/1.1 301 + Location: https://...
```

---

## 📞 SUPORTE

### Guia Completo
📖 Ver `ATUALIZACAO-DOMINIO-API.md` para instruções detalhadas

### Verificar Status no Servidor
```bash
ssh root@37.27.248.13 'docker service ls && docker service logs falachefe_crewai-api --tail=20'
```

### Verificar Traefik
```bash
ssh root@37.27.248.13 'docker service logs traefik_traefik --tail=50 | grep api.falachefe'
```

---

## ✅ QUANDO CONSIDERAR CONCLUÍDO

A atualização estará 100% concluída quando:

- [x] Arquivos locais atualizados
- [x] Documentação criada
- [ ] DNS configurado e propagado
- [ ] Docker Stack atualizado no servidor
- [ ] Certificado SSL gerado
- [ ] Webhook UAZAPI atualizado
- [ ] Variáveis Vercel atualizadas
- [ ] Testes de health check OK
- [ ] Teste de processamento OK
- [ ] Fluxo WhatsApp end-to-end funcionando

---

**Última Atualização**: 10 de Outubro de 2025  
**Próxima Ação**: Seguir `ATUALIZACAO-DOMINIO-API.md` passo a passo

