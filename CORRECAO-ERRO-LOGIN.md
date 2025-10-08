# 🔧 Correção do Erro de Login (Erro 500)

## 🔴 **Problema Identificado**

O erro de login tanto pelo Google quanto por Email está retornando **500 Internal Server Error** porque:

1. ❌ **Senha do banco de dados está incorreta ou expirou**
2. ❌ **Better Auth não consegue conectar ao Supabase**
3. ❌ **Variável `BETTER_AUTH_URL` conflitante (já removida)**

**Erro específico:**
```
password authentication failed for user "postgres.zpdartuyaergbxmbmtur"
Code: 28P01
```

## ✅ **Solução Passo a Passo**

### **Passo 1: Obter Nova Senha do Supabase**

1. Acesse: https://supabase.com/dashboard/project/zpdartuyaergbxmbmtur/settings/database

2. Role até a seção **"Connection String"**

3. **OPÇÃO A** - Se você lembra da senha:
   - Use a senha atual

4. **OPÇÃO B** - Se não lembra:
   - Clique em **"Reset database password"**
   - Copie a nova senha gerada
   - ⚠️ **ATENÇÃO:** A senha só aparece uma vez! Salve em local seguro

5. Copie as 3 strings de conexão com a nova senha:
   - **Direct connection** (URI mode)
   - **Connection pooling** (Transaction mode)

### **Passo 2: Atualizar `.env.local`**

Abra o arquivo `.env.local` e substitua as linhas:

```env
# Substitua NOVA_SENHA pela senha que você copiou do Supabase

DATABASE_URL="postgres://postgres.zpdartuyaergbxmbmtur:NOVA_SENHA@db.zpdartuyaergbxmbmtur.supabase.co:5432/postgres?sslmode=require"

POSTGRES_URL="postgres://postgres.zpdartuyaergbxmbmtur:NOVA_SENHA@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require"

POSTGRES_URL_NON_POOLING="postgres://postgres.zpdartuyaergbxmbmtur:NOVA_SENHA@db.zpdartuyaergbxmbmtur.supabase.co:5432/postgres?sslmode=require"
```

### **Passo 3: Testar Localmente**

```bash
# Testar conexão
npx tsx scripts/testing/test-db-connection-simple.ts

# Se der ✅, prossiga para o Passo 4
# Se der ❌, verifique se copiou a senha corretamente
```

### **Passo 4: Atualizar Variáveis no Vercel**

```bash
# Executar o script automático
./scripts/update-vercel-db-env.sh

# Ou manualmente:
vercel env rm DATABASE_URL production
vercel env rm POSTGRES_URL production  
vercel env rm POSTGRES_URL_NON_POOLING production

vercel env add DATABASE_URL production
# Cole a string completa quando solicitado

vercel env add POSTGRES_URL production
# Cole a string completa quando solicitado

vercel env add POSTGRES_URL_NON_POOLING production
# Cole a string completa quando solicitado
```

### **Passo 5: Fazer Redeploy**

```bash
# Opção 1: Redeploy manual
vercel --prod

# Opção 2: Trigger automático via Git
git add .
git commit -m "fix: atualizar credenciais do banco de dados"
git push origin master
```

### **Passo 6: Verificar**

1. Aguarde o deploy completar (~2 minutos)
2. Acesse: https://falachefe-v4.vercel.app
3. Teste o login com Google
4. Teste o login com Email

## 🎯 **Checklist de Verificação**

- [ ] Nova senha obtida do Supabase
- [ ] `.env.local` atualizado com nova senha
- [ ] Teste local funcionando (`test-db-connection-simple.ts`)
- [ ] Variáveis atualizadas no Vercel
- [ ] Redeploy executado
- [ ] Login funcionando em produção

## 📊 **Estado Atual**

✅ Variável `BETTER_AUTH_URL` removida (estava causando conflito)
✅ Configurações do Google OAuth verificadas e corretas
✅ URLs de callback configuradas:
   - `https://falachefe-v4.vercel.app/api/auth/callback/google`
   - `https://falachefe-v4.vercel.app/api/auth/callback`

❌ **PENDENTE:** Atualizar credenciais do banco de dados

## 🆘 **Se Ainda Não Funcionar**

Se após todos os passos o erro persistir, execute:

```bash
# Ver logs em tempo real do deployment
vercel logs https://falachefe-v4.vercel.app --json

# Verificar status das variáveis
vercel env ls

# Testar conexão local novamente
npx tsx scripts/testing/test-db-connection-simple.ts
```

E compartilhe os logs para análise adicional.

## 📝 **Notas Importantes**

1. **NUNCA** commite o `.env.local` no Git
2. A senha do Supabase deve ser idêntica em `.env.local` e no Vercel
3. Após resetar a senha no Supabase, **todas** as aplicações conectadas precisam ser atualizadas
4. O Vercel só usa as novas variáveis após um redeploy

