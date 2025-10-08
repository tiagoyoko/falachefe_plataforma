# ✅ Checklist de Deploy Vercel - Falachefe

## 🚨 Erro Atual

```
Error: DATABASE_URL or POSTGRES_URL environment variable is not set
Failed to collect page data for /api/admin/agents
```

## 🔧 Solução: Configurar Variáveis de Ambiente

### Variáveis Obrigatórias

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/falachefe
POSTGRES_URL=postgresql://user:password@host:5432/falachefe

# Better Auth
BETTER_AUTH_SECRET=seu-secret-aqui
BETTER_AUTH_URL=https://sua-app.vercel.app

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=seu-token-aqui

# Google OAuth (opcional)
GOOGLE_CLIENT_ID=seu-client-id
GOOGLE_CLIENT_SECRET=seu-client-secret

# UazAPI (WhatsApp)
UAZAPI_INSTANCE_ID=seu-instance-id
UAZAPI_TOKEN=seu-token-aqui

# App Config
NEXT_PUBLIC_APP_URL=https://sua-app.vercel.app
NODE_ENV=production
```

### Como Configurar no Vercel

#### Opção 1: Via Dashboard (Recomendado)

1. Acesse: https://vercel.com/tiago-6739s-projects/falachefe/settings/environment-variables

2. Adicione cada variável:
   - **Name**: DATABASE_URL
   - **Value**: sua-connection-string
   - **Environment**: Production, Preview, Development

3. Após adicionar todas, faça Redeploy

#### Opção 2: Via CLI

```bash
# Configurar uma variável
vercel env add DATABASE_URL production

# Listar variáveis configuradas
vercel env ls

# Fazer redeploy
vercel --prod
```

#### Opção 3: Via Arquivo .env.production

1. Criar `.env.production` (não commitar!)
2. Adicionar variáveis
3. Fazer deploy via CLI

---

## 📋 Checklist Completo

### 1. Variáveis de Ambiente

- [ ] DATABASE_URL (PostgreSQL)
- [ ] POSTGRES_URL (PostgreSQL alternativa)
- [ ] BETTER_AUTH_SECRET
- [ ] BETTER_AUTH_URL
- [ ] UPSTASH_REDIS_REST_URL
- [ ] UPSTASH_REDIS_REST_TOKEN
- [ ] NEXT_PUBLIC_APP_URL
- [ ] GOOGLE_CLIENT_ID (se usar Google OAuth)
- [ ] GOOGLE_CLIENT_SECRET (se usar Google OAuth)
- [ ] UAZAPI_INSTANCE_ID (se usar WhatsApp)
- [ ] UAZAPI_TOKEN (se usar WhatsApp)

### 2. Configuração do Projeto

- [x] package.json limpo (sem pacotes Python)
- [x] pnpm-lock.yaml atualizado
- [x] vercel.json configurado
- [x] next.config.ts correto
- [ ] Build scripts funcionando localmente

### 3. Database

- [ ] Banco PostgreSQL acessível via internet
- [ ] Connection string correta
- [ ] Tabelas criadas (migrations aplicadas)
- [ ] Permissões configuradas

### 4. Build

- [ ] `npm run build` funciona localmente
- [ ] Sem erros de TypeScript
- [ ] Sem erros de linting (ou desabilitado)
- [ ] Pages estáticas sendo geradas

---

## 🚀 Próximos Passos

### 1. Obter Database URL

Se seu banco é local, você precisa:

#### Opção A: Usar Vercel Postgres

```bash
# Criar banco Vercel Postgres
vercel postgres create falachefe-db

# Variáveis serão adicionadas automaticamente
```

#### Opção B: Usar Supabase (Recomendado)

Você já tem projeto Supabase!

```
ID: zpdartuyaergbxmbmtur
Region: sa-east-1
Status: ACTIVE_HEALTHY
Host: db.zpdartuyaergbxmbmtur.supabase.co
```

**Connection String:**
```
postgresql://postgres:[PASSWORD]@db.zpdartuyaergbxmbmtur.supabase.co:5432/postgres
```

#### Opção C: Outro Provedor

- Railway
- Neon
- PlanetScale
- AWS RDS

### 2. Configurar no Vercel

```bash
# Via CLI
vercel env add DATABASE_URL production

# Ou via dashboard:
# https://vercel.com/tiago-6739s-projects/falachefe/settings/environment-variables
```

### 3. Redeploy

```bash
# Trigger redeploy
vercel --prod

# Ou via dashboard:
# https://vercel.com/tiago-6739s-projects/falachefe
# Clicar em "Redeploy"
```

---

## 🔍 Verificação

Após configurar e redeploy:

```bash
# Verificar status
vercel ls

# Ver logs
vercel logs --follow

# Testar deployment
curl https://falachefe-tiago-6739s-projects.vercel.app/api/health
```

---

## 💡 Dicas

### Evitar Build-Time Database Access

O erro ocorre porque o Next.js tenta acessar o banco durante o build. Opções:

1. **Desabilitar Static Generation** para rotas que usam DB:
   ```typescript
   // Em route.ts ou page.tsx
   export const dynamic = 'force-dynamic'
   ```

2. **Usar variável de ambiente no build**:
   ```typescript
   // Só conectar se não estiver em build
   if (process.env.NODE_ENV !== 'production' || process.env.DATABASE_URL) {
     // conectar ao banco
   }
   ```

3. **Lazy Loading** do DB client:
   ```typescript
   // Só importar quando necessário
   const getDB = async () => {
     const { db } = await import('@/lib/db')
     return db
   }
   ```

---

**Status**: 🔴 Deploy com erro (DATABASE_URL faltando)  
**Prioridade**: 🔴 Alta  
**Tempo para corrigir**: ⏱️ 15 minutos  
**Próximo passo**: Configurar variáveis de ambiente no Vercel

