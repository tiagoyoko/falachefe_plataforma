# 🗄️ Configuração do Banco de Dados - Supabase

## 📋 Pré-requisitos

1. **Conta no Supabase**: [https://supabase.com](https://supabase.com)
2. **Projeto criado** no Supabase
3. **Credenciais do Google OAuth** (se quiser usar autenticação)

## 🔧 Passo a Passo

### 1. Configurar Projeto no Supabase

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Crie um novo projeto ou use um existente
3. Anote as credenciais do projeto:
   - **Project URL**: `https://[PROJECT-REF].supabase.co`
   - **Database Password**: A senha que você definiu
   - **Project Reference**: O ID do projeto

### 2. Configurar Variáveis de Ambiente

Edite o arquivo `.env.local` e substitua os valores:

```bash
# Database - Supabase PostgreSQL
POSTGRES_URL=postgresql://postgres:[SUA-SENHA]@db.[SEU-PROJECT-REF].supabase.co:5432/postgres
DATABASE_URL=postgresql://postgres:[SUA-SENHA]@db.[SEU-PROJECT-REF].supabase.co:5432/postgres

# Supabase Configuration
SUPABASE_URL=https://[SEU-PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=[SUA-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[SUA-SERVICE-ROLE-KEY]
```

### 3. Ativar Extensões PostgreSQL

No Supabase SQL Editor, execute:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### 4. Testar Conexão

```bash
npm run db:test
```

### 5. Gerar e Executar Migrações

```bash
# Gerar migrações baseadas no schema
npm run db:generate

# Executar migrações no banco
npm run db:migrate
```

### 6. Verificar Configuração

```bash
npm run db:setup
```

## 🔍 Verificações

### ✅ Conexão Funcionando
- [ ] `npm run db:test` executa sem erros
- [ ] Tabelas são criadas corretamente
- [ ] Inserção de dados funciona

### ✅ Autenticação
- [ ] Google OAuth configurado
- [ ] Login funciona na aplicação
- [ ] Usuários são salvos no banco

## 🚨 Troubleshooting

### Erro de Conexão
```
❌ Erro: DATABASE_URL ou POSTGRES_URL não está definida
```
**Solução**: Verifique se o arquivo `.env.local` existe e tem as variáveis corretas.

### Erro de Permissão
```
❌ permission denied for table
```
**Solução**: Use a `SUPABASE_SERVICE_ROLE_KEY` ao invés da `SUPABASE_ANON_KEY`.

### Erro de Extensão
```
❌ extension "uuid-ossp" does not exist
```
**Solução**: Execute as queries SQL para criar as extensões no Supabase.

## 📊 Próximos Passos

Após a configuração bem-sucedida:

1. ✅ Banco de dados funcionando
2. 🚀 Iniciar desenvolvimento da Fase 2 - UAZ API
3. 🔐 Configurar autenticação avançada
4. 📱 Implementar integração WhatsApp

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs do Supabase
2. Teste a conexão com `npm run db:test`
3. Verifique as permissões do banco
4. Confirme se as extensões estão ativas
