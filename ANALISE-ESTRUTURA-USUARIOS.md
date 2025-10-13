# Análise: Estrutura de Usuários - Problemas Identificados

## 🔴 PROBLEMA: 3 Tabelas de Usuários Descasadas

### 📊 Estrutura Atual

```
┌─────────────────────────────────────────────────────────┐
│                    TABELAS ATUAIS                       │
└─────────────────────────────────────────────────────────┘

1️⃣  "user" (Better Auth)
    • 2 registros
    • IDs:
      - 62ac4d7c-c203-4b87-bbc1-a1e7d7b66a99
      - 0c3992a7-4d03-45f7-a179-0ac57a0e5406
    • Campos: id, email, name, emailVerified, role
    • Propósito: Autenticação OAuth (Google)

2️⃣  user_onboarding
    • 2 registros  
    • user_ids:
      - 2f16ae84-c5df-47dd-a81f-e83b8de315da
      - or3ZL1Ea1Pm7wFhufyFaRs7y2ZLKLQNb
    • Campos: user_id, first_name, last_name, whatsapp_phone, company_name
    • Propósito: Dados de cadastro/onboarding

3️⃣  user_subscriptions
    • 0 registros ⚠️ VAZIA!
    • Campos: user_id, company_id, plan_id, status
    • Propósito: Relacionar usuário com empresa

4️⃣  admin_users
    • 0 registros ⚠️ VAZIA!
    • Campos: id, email, name, role, company_id
    • Propósito: Usuários admin da empresa
```

---

## 🚨 PROBLEMAS IDENTIFICADOS

### 1. **IDs Não Batem**

```sql
-- user table (Better Auth):
id = '62ac4d7c-c203-4b87-bbc1-a1e7d7b66a99'
email = 'fabricio@fabricioleonard.com'

-- user_onboarding:
user_id = '2f16ae84-c5df-47dd-a81f-e83b8de315da'
whatsapp = '11994066248'

❌ NENHUM ID COINCIDE!
```

### 2. **user_subscriptions Vazia**

```
Sem subscriptions = Sem relação usuário ↔ empresa

Resultado:
  • Usuários existem nas tabelas
  • MAS não têm empresa associada
  • Sistema envia mensagem padrão
```

### 3. **Tabela "whatsapp_users" NÃO EXISTE**

```
❌ ERRO ANTERIOR:
   Mencionei tabela "users" ou "whatsapp_users"
   
✅ CORREÇÃO:
   Não existe tabela específica para WhatsApp
   Dados de WhatsApp estão em:
   - user_onboarding.whatsapp_phone
```

### 4. **admin_users Vazia**

```
0 registros = Nenhum admin cadastrado
```

---

## 📋 DADOS REAIS DO BANCO

### Tabela `user` (Better Auth)

| id | email | name | emailVerified | role |
|----|-------|------|---------------|------|
| `62ac4d7c-...` | fabricio@fabricioleonard.com | FABRICIO L S LEITE | true | user |
| `0c3992a7-...` | fleite5000@gmail.com | Fabricio Leonard | true | user |

### Tabela `user_onboarding`

| id | user_id | first_name | last_name | whatsapp_phone | company_name | is_completed |
|----|---------|------------|-----------|----------------|--------------|--------------|
| `f17d0c5e-...` | `2f16ae84-...` | Tiago | Yokoyama | 11994066248 | Agencia Vibe Code | true |
| `70c98538-...` | `or3ZL1Ea1...` | Tiago | Yokoyama | 11992345329 | agencia vibe code | true |

### Tabela `user_subscriptions`

```
❌ VAZIA (0 registros)
```

### Tabela `companies`

| id | name | domain | subscription_plan | is_active |
|----|------|--------|-------------------|-----------|
| `bd7c774b-...` | Falachefe - Default | falachefe.app.br | starter | true |
| `811349ca-...` | Empresa 5151 | null | starter | true |

---

## 🤔 POR QUE ISSO ACONTECEU?

### Hipóteses:

1. **Múltiplas Migrações**
   - Diferentes sistemas de auth foram testados
   - Better Auth foi adicionado depois
   - user_onboarding foi criado para fluxo de cadastro
   - Dados não foram migrados/sincronizados

2. **Fluxos Separados**
   ```
   Fluxo 1: Login OAuth → tabela "user"
   Fluxo 2: Onboarding → tabela "user_onboarding"
   Fluxo 3: Subscription → tabela "user_subscriptions" (NUNCA COMPLETADO)
   ```

3. **Sem Foreign Keys Entre user ↔ user_onboarding**
   - user_id em user_onboarding não referencia user.id
   - Podem ser IDs de sistemas diferentes

---

## 💡 SOLUÇÃO PROPOSTA

### Opção 1: Unificar Usando Better Auth como Base

```sql
-- 1. Atualizar user_onboarding para referenciar user.id
ALTER TABLE user_onboarding
  DROP CONSTRAINT IF EXISTS user_onboarding_user_id_fkey;

ALTER TABLE user_onboarding
  ADD CONSTRAINT user_onboarding_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES "user"(id);

-- 2. Criar subscriptions para conectar users e companies
INSERT INTO user_subscriptions (
  user_id,
  company_id,
  plan_id,
  status,
  billing_cycle
)
SELECT 
  '62ac4d7c-c203-4b87-bbc1-a1e7d7b66a99', -- Fabricio
  'bd7c774b-e790-46ea-9a91-91d8f4527087', -- Falachefe
  (SELECT id FROM subscription_plans WHERE slug = 'starter' LIMIT 1),
  'active',
  'monthly';
```

### Opção 2: Simplificar Arquitetura

```
ANTES (3+ tabelas):
user → user_onboarding → user_subscriptions → companies

DEPOIS (2 tabelas):
user → user_subscriptions → companies
     ↳ campos adicionais: whatsapp_phone, first_name, last_name

Migrar dados de user_onboarding para colunas extras em user.
```

### Opção 3: Redesenhar Schema

```sql
-- Estrutura mais limpa:

1. user (Better Auth) - fonte única de verdade
   + whatsapp_phone (adicionar)
   + company_id (adicionar - relação direta)
   
2. companies - empresas

3. admin_users - admins da empresa
   + FK para user.id

4. user_onboarding - apenas para workflow inicial
   + FK estrito para user.id
   + Apagar após onboarding completo
```

---

## 🚀 IMPACTO ATUAL NO SISTEMA

### Como o Código Está Funcionando Agora:

```typescript
// src/services/message-service.ts

// 1. Busca por telefone em user_onboarding
const platformUsers = await db.execute(
  sql`SELECT user_id FROM user_onboarding 
      WHERE whatsapp_phone LIKE ${'%' + phoneDigits + '%'}`
);

// user_id = '2f16ae84-c5df-47dd-a81f-e83b8de315da'

// 2. Busca subscriptions
const subscriptions = await db.select()
  .from(userSubscriptions)
  .where(eq(userSubscriptions.userId, platformUser.user_id));

// Resultado: [] (vazio)
// Por quê? user_subscriptions está vazio!

// 3. Envia mensagem padrão
return {
  requiresCompanySetup: true,
  standardMessage: "Acesse falachefe.app.br e cadastre sua empresa"
};
```

### Por Que Mensagem Padrão É Enviada:

1. ✅ Usuário existe em `user_onboarding`
2. ❌ Mas `user_subscriptions` está vazia
3. 🔄 Sistema assume: "tem cadastro mas não tem empresa"
4. 📧 Envia mensagem pedindo para cadastrar

---

## 🔧 AÇÃO IMEDIATA RECOMENDADA

### 1. Criar Subscriptions para Testes

```sql
-- Conectar usuário de user_onboarding com company
INSERT INTO user_subscriptions (
  id,
  user_id,
  company_id,
  plan_id,
  status,
  billing_cycle,
  start_date
)
VALUES (
  gen_random_uuid(),
  '2f16ae84-c5df-47dd-a81f-e83b8de315da', -- user_id de user_onboarding
  'bd7c774b-e790-46ea-9a91-91d8f4527087', -- Falachefe company_id
  (SELECT id FROM subscription_plans WHERE slug = 'starter' LIMIT 1),
  'active',
  'monthly',
  NOW()
);
```

### 2. Adicionar Foreign Key Correta

```sql
-- Garantir integridade referencial
ALTER TABLE user_subscriptions
  ADD CONSTRAINT user_subscriptions_user_id_check
  CHECK (
    user_id IN (SELECT id FROM "user") OR
    user_id IN (SELECT user_id FROM user_onboarding)
  );
```

### 3. Criar View Unificada

```sql
CREATE VIEW unified_users AS
SELECT 
  u.id,
  u.email,
  u.name,
  uo.whatsapp_phone,
  uo.first_name,
  uo.last_name,
  us.company_id,
  c.name as company_name,
  us.status as subscription_status
FROM "user" u
LEFT JOIN user_onboarding uo ON u.id = uo.user_id
LEFT JOIN user_subscriptions us ON u.id = us.user_id
LEFT JOIN companies c ON c.id = us.company_id;
```

---

## 📊 RECOMENDAÇÃO FINAL

### Curto Prazo (Imediato):
1. ✅ Criar subscriptions manualmente para conectar dados existentes
2. ✅ Testar WhatsApp com usuário linkado
3. ✅ Documentar estrutura atual

### Médio Prazo (Próxima Sprint):
1. 🔄 Unificar tabelas user e user_onboarding
2. 🔄 Adicionar foreign keys estritas
3. 🔄 Criar migration para normalizar dados

### Longo Prazo (Refatoração):
1. 🎯 Redesenhar schema completo
2. 🎯 Simplificar fluxo de usuários
3. 🎯 Documentar arquitetura de dados

---

## 📝 Observações

**Sobre "whatsapp_users"**: Peço desculpas pelo erro anterior. Não existe tabela `whatsapp_users` ou `users` (singular). Os dados de WhatsApp estão em `user_onboarding.whatsapp_phone`.

**Sobre descasamento**: Os IDs não batem porque provavelmente foram criados em momentos/fluxos diferentes, sem integração entre as tabelas.

**Sobre admin_users**: Está vazia, mas existe no schema. Provavelmente foi criada para futura funcionalidade de gestão de empresa.

