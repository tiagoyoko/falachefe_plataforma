# 🐛 Erros do Deploy - Resumo e Soluções

## ✅ Deploy Funcionou!

**Status:** ✅ READY  
**URL:** https://falachefe.app.br  
**Deployment:** https://falachefe-6o2vnkjq4-tiago-6739s-projects.vercel.app

---

## 🚨 Erros Identificados no Console

### 1. ❌ Erro 500: `/api/auth/sign-in/social`

**Erro:**
```
POST https://falachefe.app.br/api/auth/sign-in/social 500 (Internal Server Error)
```

**Possíveis Causas:**

#### A. Google OAuth Callback URL não configurada

**Solução:**
1. Acesse: https://console.cloud.google.com/apis/credentials
2. Selecione seu OAuth 2.0 Client ID
3. Em "Authorized redirect URIs", adicione:
   ```
   https://falachefe.app.br/api/auth/callback/google
   https://falachefe-tiago-6739s-projects.vercel.app/api/auth/callback/google
   ```

#### B. Better Auth não tem secret válido (menos provável agora)

**Verificar:**
```bash
vercel env ls | grep BETTER_AUTH_SECRET
# Deve mostrar: Production, Preview, Development
```

**Status:** ✅ Já configurado (5m atrás)

#### C. Database connection issue

O Better Auth precisa acessar o banco para salvar a session do Google OAuth.

**Verificar logs:**
```bash
# Ver logs em tempo real do Vercel
vercel logs --follow

# Ou acessar:
https://vercel.com/tiago-6739s-projects/falachefe/logs
```

---

### 2. ⚠️ CSP Violation: jquery inline script

**Erro:**
```
Refused to execute inline script because it violates the following Content Security Policy directive
```

**Causa:** jQuery tentando executar script inline

**Solução:**

#### Opção A: Ajustar CSP (Recomendado)

```typescript
// next.config.ts ou middleware.ts
const cspHeader = `
  script-src 'self' 'unsafe-eval' 'unsafe-inline' chrome-extension://40e54d60-5c59-401c-bd42-0b619c290e52/;
`
```

#### Opção B: Remover jQuery se não for usado

```bash
# Buscar onde jQuery está sendo usado
grep -r "jquery" src/
```

---

### 3. ❌ Erro: screengrabber.js

**Erro:**
```
Uncaught TypeError: Cannot set properties of null (setting 'src')
at screengrabber.js:14:40
```

**Causa:** Script tentando acessar elemento que não existe

**Solução:**

#### Verificar se screengrabber.js é necessário

```bash
# Buscar referências
grep -r "screengrabber" src/ public/
```

#### Se não for necessário, remover

```bash
# Remover arquivo
rm public/screengrabber.js  # ou src/...
```

---

### 4. ⚠️ Rotas 404

**Erros:**
```
demo?_rsc=3lb4g:1  Failed to load resource: 404
agentes?_rsc=asqg6:1  Failed to load resource: 404
```

**Causa:** Links para rotas que não existem (mais)

**Solução:**

#### Verificar navegação/menu

```bash
# Buscar links quebrados
grep -r "href.*demo\|href.*agentes" src/components/
```

#### Remover ou corrigir links

- `/demo` → Remover ou criar página
- `/agentes` → Corrigir para `/admin/agents` ou `/dashboard/agents`

---

## 🔧 Plano de Ação Priorizado

### 🔴 Prioridade Alta (Bloqueia funcionalidade)

1. **Corrigir erro 500 no Google OAuth**
   - [ ] Adicionar redirect URIs no Google Console
   - [ ] Verificar logs do Vercel para erro específico
   - [ ] Testar login com Google

### 🟡 Prioridade Média (Erros visíveis)

2. **Corrigir rotas 404**
   - [ ] Encontrar links para `/demo` e `/agentes`
   - [ ] Remover ou corrigir

3. **Resolver CSP violation**
   - [ ] Ajustar Content Security Policy
   - [ ] Ou remover jQuery se não usado

### 🟢 Prioridade Baixa (Não crítico)

4. **Screengrabber.js**
   - [ ] Verificar se é necessário
   - [ ] Remover ou corrigir

---

## 🧪 Como Debugar

### Ver Logs em Tempo Real

```bash
# Terminal
vercel logs --follow

# Ou filtrar por erro
vercel logs | grep -i "error\|500"
```

### Testar Endpoints Específicos

```bash
# Testar auth social
curl -X POST https://falachefe.app.br/api/auth/sign-in/social \
  -H "Content-Type: application/json" \
  -d '{"provider":"google"}' \
  -v

# Ver resposta completa
```

### Verificar Variáveis de Ambiente

```bash
# Listar todas
vercel env ls

# Pull para local (verificar)
vercel env pull .env.production
cat .env.production
```

---

## 📊 Checklist de Validação

### Variáveis de Ambiente ✅

- [x] DATABASE_URL
- [x] BETTER_AUTH_SECRET  
- [x] BETTER_AUTH_URL
- [x] GOOGLE_CLIENT_ID
- [x] GOOGLE_CLIENT_SECRET
- [x] NEXT_PUBLIC_APP_URL

### Google Console OAuth ❓

- [ ] Redirect URIs configuradas
  - `https://falachefe.app.br/api/auth/callback/google`
  - `https://falachefe-tiago-6739s-projects.vercel.app/api/auth/callback/google`
- [ ] Aplicação em produção (não em teste)
- [ ] Domínio autorizado

### Código ❓

- [ ] Endpoint `/api/auth/[...all]/route.ts` funcionando
- [ ] Schema do banco correto
- [ ] Better Auth inicializado corretamente

---

## 🆘 Próximos Passos Imediatos

1. **Verificar logs do erro 500:**
   ```bash
   vercel logs | grep -A 10 "sign-in/social"
   ```

2. **Configurar Google OAuth Redirect URIs:**
   - Acessar: https://console.cloud.google.com/apis/credentials
   - Adicionar URLs de callback

3. **Testar novamente após configuração**

---

## 💡 Dica

O erro 500 é **runtime**, não build. Isso significa:
- ✅ Deploy funcionou
- ✅ Aplicação está rodando
- ❌ Endpoint de auth social tem erro de execução

**Causa mais provável:** Google OAuth redirect URI não configurada no Google Console.

---

**Status:** 🟡 Deploy OK, mas auth social com erro  
**Prioridade:** 🔴 Alta (bloqueia login social)  
**Próximo passo:** Configurar redirect URIs no Google Console

