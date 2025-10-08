# 👑 Gerenciamento de Usuários Admin

Este documento explica como gerenciar usuários administradores no sistema.

## 📋 Scripts Disponíveis

### 1. Configurar Usuário como Admin
```bash
npm run admin:set-user
```
- Configura o usuário `tiago@agenciavibecode.com` como `super_admin`
- Se o usuário não existir, será criado automaticamente
- Se já existir, apenas atualiza o role

### 2. Listar Usuários Admin
```bash
npm run admin:list
```
- Lista todos os usuários com role de admin
- Mostra estatísticas e informações detalhadas

### 3. Testar Permissões de Admin
```bash
npm run admin:test
```
- Testa se o usuário admin está funcionando corretamente
- Verifica acesso ilimitado e bypass de assinatura

## 🎭 Roles Disponíveis

### `super_admin` 👑
- **Acesso**: Total e ilimitado
- **Assinatura**: Não precisa
- **Uso**: Não é registrado
- **Recursos**: Todos os recursos sem limites

### `admin` 🔧
- **Acesso**: Total e ilimitado
- **Assinatura**: Não precisa
- **Uso**: Não é registrado
- **Recursos**: Todos os recursos sem limites

### `manager` 👨‍💼
- **Acesso**: Total e ilimitado
- **Assinatura**: Não precisa
- **Uso**: Não é registrado
- **Recursos**: Todos os recursos sem limites

## 🔧 Como Adicionar Novos Admins

### Opção 1: Via Script (Recomendado)
1. Edite o arquivo `scripts/set-admin-user.ts`
2. Altere o email na linha: `const email = 'novo@email.com';`
3. Execute: `npm run admin:set-user`

### Opção 2: Via SQL Direto
```sql
-- Atualizar usuário existente
UPDATE "user" 
SET role = 'super_admin', "updatedAt" = NOW()
WHERE email = 'novo@email.com';

-- Ou criar novo usuário admin
INSERT INTO "user" (id, email, name, role, "isActive", "createdAt", "updatedAt")
VALUES (
  'admin_' || EXTRACT(EPOCH FROM NOW())::text,
  'novo@email.com',
  'Nome do Admin',
  'super_admin',
  true,
  NOW(),
  NOW()
);
```

## 🧪 Testando Permissões

### No Backend (TypeScript)
```typescript
import { permissionService } from '@/services/permission-service';

// Verificar se é admin
const isAdmin = await permissionService.isUserAdmin(userId);

// Obter permissões completas
const permissions = await permissionService.getUserPermissions(userId);

// Verificar acesso a recurso
const canUse = await permissionService.canUseResource(userId, 'messages');
```

### No Frontend (React)
```tsx
import { usePermissions } from '@/hooks/use-permissions';

function MyComponent({ userId }) {
  const { isAdmin, hasActiveSubscription, canUseResource } = usePermissions(userId);
  
  if (isAdmin) {
    return <div>Admin - Acesso Ilimitado</div>;
  }
  
  // Lógica para usuários normais...
}
```

## 📊 Status Atual

### Usuários Admin Configurados
- **tiago@agenciavibecode.com** - `super_admin` ✅

### Funcionalidades Testadas
- ✅ Verificação de role admin
- ✅ Bypass de verificação de assinatura
- ✅ Acesso ilimitado a recursos
- ✅ Não registro de uso no billing
- ✅ Interface diferenciada para admins

## 🚨 Importante

1. **Segurança**: Apenas usuários confiáveis devem ter role de admin
2. **Backup**: Sempre faça backup antes de alterar roles
3. **Teste**: Use `npm run admin:test` para verificar se está funcionando
4. **Logs**: Monitore logs para detectar uso indevido de privilégios admin

## 🔍 Troubleshooting

### Usuário não aparece como admin
1. Verifique se o email está correto
2. Execute `npm run admin:list` para confirmar
3. Verifique se o role está correto no banco

### Permissões não funcionam
1. Execute `npm run admin:test` para diagnosticar
2. Verifique se o serviço de permissões está funcionando
3. Confirme se o usuário está ativo (`isActive = true`)

### Erro de conexão com banco
1. Verifique se as variáveis de ambiente estão corretas
2. Confirme se o banco está acessível
3. Execute com `DATABASE_URL` explícito se necessário
