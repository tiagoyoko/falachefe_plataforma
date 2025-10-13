# Planejamento: Arquitetura Unificada de Usuários

## 🎯 OBJETIVO

Redesenhar arquitetura de usuários para eliminar redundância, descasamento e confusão.

---

## 🔴 PROBLEMA ATUAL

### Tabelas Existentes (4):

```
1. user (Better Auth)
   • Propósito: Autenticação OAuth (Google)
   • Campos: id, email, name, emailVerified, role
   • Registros: 2
   • IDs: 62ac4d7c..., 0c3992a7...

2. user_onboarding
   • Propósito: Dados de cadastro/onboarding
   • Campos: user_id, first_name, last_name, whatsapp_phone, company_name
   • Registros: 2
   • IDs: 2f16ae84..., or3ZL1Ea1... ← NÃO BATEM com user.id!

3. user_subscriptions
   • Propósito: Relacionar usuário com empresa
   • Campos: user_id, company_id, plan_id, status
   • Registros: 2 (criadas manualmente hoje)
   
4. admin_users
   • Propósito: Admins da empresa
   • Campos: id, email, name, role, company_id
   • Registros: 0 (vazia)
```

### Problemas:

❌ IDs não batem entre `user` e `user_onboarding`  
❌ Schema quer tabela `users` (WhatsApp) que não existe  
❌ Código procura `whatsapp_users` que não existe  
❌ Mensagens não são salvas (tabela faltante)  
❌ Conversações não são criadas (tabela faltante)  

---

## 💡 PROPOSTA: 3 Cenários

### Cenário 1: Usar Apenas Better Auth `user` (RECOMENDADO)

**Estrutura Final**:
```
user (Better Auth) - ÚNICA tabela de usuários
├─ id (text)
├─ email
├─ name
├─ emailVerified
├─ role
├─ whatsapp_phone (NOVO) ← migrar de user_onboarding
├─ first_name (NOVO) ← migrar de user_onboarding
├─ last_name (NOVO) ← migrar de user_onboarding
└─ company_id (NOVO) ← da primeira subscription ativa

user_subscriptions
├─ user_id → FK para user.id
├─ company_id
├─ plan_id
└─ status

companies
├─ id
├─ name
└─ domain

admin_users
├─ user_id → FK para user.id (NOVO)
└─ company_id
```

**Ações**:
1. Adicionar colunas em `user`:
   - `whatsapp_phone VARCHAR(20)`
   - `first_name VARCHAR(100)`
   - `last_name VARCHAR(100)`
   - `company_id UUID` (opcional)

2. Migrar dados de `user_onboarding` para `user`
   - Problema: IDs não batem! Precisamos criar mapping manual

3. Deprecar `user_onboarding` (manter por histórico)

4. Schema TypeScript:
   - `users` aponta para tabela `user`
   - Remove referência a `whatsapp_users`

**Vantagens**:
✅ Única fonte de verdade  
✅ Better Auth já gerencia auth  
✅ Simples e claro  

**Desvantagens**:
❌ Mistura usuários plataforma + WhatsApp  
❌ Migration complexa (IDs não batem)  

---

### Cenário 2: 2 Tabelas Separadas (LIMPO)

**Estrutura Final**:
```
user (Better Auth) - Usuários da PLATAFORMA
├─ id
├─ email
├─ name
└─ role

whatsapp_contacts - Usuários do WHATSAPP
├─ id
├─ phone_number
├─ name
├─ company_id
└─ platform_user_id (OPCIONAL - FK para user.id)

user_subscriptions - Liga plataforma com empresa
├─ user_id → FK para user.id
├─ company_id
└─ status

companies
├─ id
└─ name
```

**Ações**:
1. Criar tabela `whatsapp_contacts`:
   ```sql
   CREATE TABLE whatsapp_contacts (
     id UUID PRIMARY KEY,
     phone_number VARCHAR(20) UNIQUE,
     name VARCHAR(255),
     company_id UUID REFERENCES companies(id),
     platform_user_id TEXT REFERENCES user(id), -- OPCIONAL
     ...
   );
   ```

2. Migrar `user_onboarding.whatsapp_phone` para `whatsapp_contacts`

3. Schema TypeScript:
   - `users` → tabela `whatsapp_contacts`
   - Mantém `user` do Better Auth separado

**Vantagens**:
✅ Separação clara (plataforma vs WhatsApp)  
✅ Pode vincular via `platform_user_id`  
✅ Flexível  

**Desvantagens**:
❌ 2 tabelas de usuários (mas com propósitos claros)  

---

### Cenário 3: Unificar Tudo em `user` + Remover Onboarding

**Estrutura Final**:
```
user (Better Auth) - TUDO
├─ id
├─ email
├─ name
├─ whatsapp_phone
├─ first_name
├─ last_name
└─ onboarding_completed (boolean)

user_subscriptions
├─ user_id → FK user.id
├─ company_id
└─ status

companies
├─ id
└─ name
```

**Ações**:
1. Adicionar colunas em `user`
2. Migrar dados manualmente (criar novos users com emails dummy)
3. Deletar `user_onboarding`

**Vantagens**:
✅ Mais simples possível  
✅ 1 única tabela  

**Desvantagens**:
❌ Usuários WhatsApp sem email precisam de email dummy  
❌ Perde histórico de onboarding  

---

## 📊 COMPARAÇÃO

| Aspecto | Cenário 1 | Cenário 2 | Cenário 3 |
|---------|-----------|-----------|-----------|
| Tabelas | 1 (user) | 2 (user + whatsapp_contacts) | 1 (user) |
| Complexidade | Média | Baixa | Baixa |
| Migração | Difícil | Média | Média |
| Manutenção | Fácil | Fácil | Muito Fácil |
| Flexibilidade | Média | Alta | Baixa |
| Recomendado | ⭐⭐ | ⭐⭐⭐ | ⭐ |

---

## 🎯 RECOMENDAÇÃO

**Cenário 2: 2 Tabelas Separadas**

### Por quê?

1. **Separação de Concerns**:
   - `user` → Usuários da plataforma (login, OAuth)
   - `whatsapp_contacts` → Contatos WhatsApp (não precisam de email)

2. **Vínculo Opcional**:
   - WhatsApp pode existir SEM login na plataforma
   - Plataforma pode existir SEM WhatsApp
   - Podem ser vinculados via `platform_user_id`

3. **Migration Simples**:
   ```sql
   INSERT INTO whatsapp_contacts (phone_number, name, company_id)
   SELECT whatsapp_phone, first_name || ' ' || last_name, 
          (SELECT id FROM companies WHERE name = company_name LIMIT 1)
   FROM user_onboarding;
   ```

4. **Código Claro**:
   ```typescript
   // Usuários da plataforma
   const platformUser = await db.select().from(user).where(...);
   
   // Contatos WhatsApp
   const whatsappContact = await db.select().from(whatsappContacts).where(...);
   
   // Vincular se necessário
   if (whatsappContact.platformUserId) {
     const linkedUser = await db.select().from(user)
       .where(eq(user.id, whatsappContact.platformUserId));
   }
   ```

---

## 🚀 PLANO DE IMPLEMENTAÇÃO (Cenário 2)

### Fase 1: Criar Estrutura Nova (1 dia)

1. **Migration**: Criar `whatsapp_contacts`
   ```sql
   CREATE TABLE whatsapp_contacts (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     phone_number VARCHAR(20) UNIQUE NOT NULL,
     name VARCHAR(255) NOT NULL,
     company_id UUID REFERENCES companies(id),
     platform_user_id TEXT REFERENCES user(id), -- Liga com plataforma
     opt_in_status BOOLEAN DEFAULT true,
     last_interaction TIMESTAMP,
     window_expires_at TIMESTAMP,
     preferences JSONB DEFAULT '{}',
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );
   ```

2. **Migrar dados** de `user_onboarding`:
   ```sql
   INSERT INTO whatsapp_contacts (phone_number, name, company_id)
   SELECT 
     whatsapp_phone,
     first_name || ' ' || last_name,
     (SELECT us.company_id 
      FROM user_subscriptions us 
      WHERE us.user_id = uo.user_id LIMIT 1)
   FROM user_onboarding uo;
   ```

3. **Atualizar Schema** TypeScript:
   ```typescript
   export const whatsappContacts = pgTable("whatsapp_contacts", {
     ...
   });
   
   // Alias para compatibilidade
   export const users = whatsappContacts;
   ```

### Fase 2: Atualizar Código (2 horas)

1. **MessageService**:
   - Usar `whatsappContacts` ao invés de `users`
   - FK `conversations.userId` → `whatsappContacts.id`

2. **Conversation/Messages**:
   - Ajustar foreign keys

### Fase 3: Limpar (1 hora)

1. Marcar `user_onboarding` como deprecated
2. Documentar nova arquitetura
3. Criar migration para eventually dropar `user_onboarding`

---

## 📋 DECISÃO NECESSÁRIA

**Qual cenário seguir?**

1. ⭐⭐ Cenário 1: user (Better Auth) única
2. ⭐⭐⭐ Cenário 2: user + whatsapp_contacts (RECOMENDADO)
3. ⭐ Cenário 3: user unificado total

---

## ⚠️ IMPORTANTE

**NÃO fazer mais mudanças** até decidir arquitetura!

Próximos passos:
1. ✅ Escolher cenário
2. ✅ Criar migration completa
3. ✅ Testar em ambiente de dev
4. ✅ Aplicar em produção
5. ✅ Atualizar código
6. ✅ Documentar






