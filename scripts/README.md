# Scripts do Projeto

Esta pasta contém todos os scripts utilitários do projeto organizados por categoria.

## Estrutura de Pastas

### `/admin/`
Scripts relacionados à administração do sistema:
- `admin-management.md`: Documentação de gerenciamento administrativo
- `list-admin-users.ts`: Lista usuários administrativos
- `set-admin-user.ts`: Define usuário como administrador

### `/agents/`
Scripts relacionados aos agentes:
- Removidos scripts do agent-squad framework
- Scripts de teste e validação de agentes básicos

### `/auth/`
Scripts relacionados à autenticação:
- `check-better-auth-tables.ts`: Verifica tabelas do Better Auth
- `fix-auth-permissions.ts`: Corrige permissões de autenticação
- `fix-password-hash.ts`: Corrige hash de senhas

### `/database/`
Scripts relacionados ao banco de dados:
- `check-users-table.ts`: Verifica estrutura da tabela de usuários
- `clean-database.ts`: Limpa o banco de dados
- `create-*.ts`: Scripts de criação de tabelas
- `migrate-*.ts`: Scripts de migração
- `setup-database.ts`: Configuração inicial do banco
- `*.sql`: Scripts SQL

### `/testing/`
Scripts de teste e validação:
- `test-*.ts`: Scripts de teste diversos
- `test-agents.js`: Teste dos agentes
- Todos os scripts de teste organizados em uma pasta

### `/webhooks/`
Scripts relacionados a webhooks:
- `configure-uaz-webhook.ts`: Configuração de webhook UAZ

## Como Usar

1. **Scripts de Banco**: Execute scripts em `/database/` para operações de DB
2. **Scripts de Teste**: Use scripts em `/testing/` para validar funcionalidades
3. **Scripts de Auth**: Execute scripts em `/auth/` para configurar autenticação
4. **Scripts de Admin**: Use scripts em `/admin/` para operações administrativas

## Pré-requisitos

- Node.js instalado
- Banco de dados configurado
- Variáveis de ambiente configuradas
- Dependências instaladas (`npm install`)

## Execução

```bash
# Exemplo de execução
npx tsx scripts/database/setup-database.ts
npx tsx scripts/testing/test-agent-basic.ts
```
