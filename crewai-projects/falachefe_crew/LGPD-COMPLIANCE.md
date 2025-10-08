# 🔒 LGPD Compliance - Integração CrewAI com Falachefe

## Resumo

Este documento descreve as medidas de compliance com a **Lei Geral de Proteção de Dados (LGPD)** implementadas na integração entre os agentes CrewAI e a API do Falachefe.

## ✅ Medidas Implementadas

### 1. **Identificação Obrigatória do Titular (userId)**

**Art. 6º, VI - Transparência**

- ✅ Todos os endpoints da API exigem `userId` obrigatório
- ✅ Não é possível acessar ou criar dados sem identificação do titular
- ✅ Validações em GET e POST impedem operações anônimas

```typescript
// LGPD: userId é OBRIGATÓRIO
if (!userId) {
  return NextResponse.json(
    { 
      error: 'userId é obrigatório',
      message: 'Para compliance com LGPD, é obrigatório informar o userId'
    },
    { status: 400 }
  )
}
```

### 2. **Autenticação e Autorização**

**Art. 46, I - Segurança**

- ✅ Autenticação obrigatória via session (Better Auth)
- ✅ Validação de que o usuário só acessa seus próprios dados
- ✅ Exceção para admins com registro em audit log

```typescript
// LGPD: Validar autenticação
const session = await auth.api.getSession({
  headers: request.headers
})

if (!session?.user) {
  return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
}

// LGPD: Validar que o usuário só acessa seus próprios dados
if (!isAdmin && session.user.id !== userId) {
  console.warn(`⚠️ LGPD: Tentativa de acesso não autorizado`)
  return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
}
```

### 3. **Audit Trail e Rastreabilidade**

**Art. 37 - Registro das Operações**

- ✅ Registro de todas as operações de leitura e escrita
- ✅ Logs incluem: quem, quando, o quê, de onde
- ✅ Metadata armazenada com cada transação

```typescript
// LGPD: Log de acesso para audit trail
console.log(`📊 LGPD Audit: User ${session.user.id} acessou transações de ${userId} em ${new Date().toISOString()}`)

// LGPD: Metadata de audit trail na transação
const auditMetadata = {
  createdBy: session.user.id,
  createdByEmail: session.user.email,
  createdAt: new Date().toISOString(),
  ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
  userAgent: request.headers.get('user-agent') || 'unknown'
}
```

### 4. **Segregação de Dados por Titular**

**Art. 46, II - Isolamento de Dados**

- ✅ Queries no banco filtram SEMPRE por userId
- ✅ Impossibilidade técnica de um usuário ver dados de outro
- ✅ Validação em nível de aplicação e banco de dados

```typescript
// Sempre filtra por userId
const conditions = [eq(financialData.userId, userId)]
const transactions = await db
  .select()
  .from(financialData)
  .where(and(...conditions))
```

## 📋 Direitos dos Titulares

### Direito de Acesso (Art. 18, II)
✅ Usuário pode consultar todas suas transações via GET `/api/financial/transactions?userId={id}`

### Direito de Correção (Art. 18, III)
⚠️ A implementar: PATCH para editar transações

### Direito de Exclusão (Art. 18, VI)
⚠️ A implementar: DELETE para remover transações

### Direito de Portabilidade (Art. 18, V)
⚠️ A implementar: Exportação em formato estruturado (JSON/CSV)

## 🔐 Segurança dos Dados

### Armazenamento
- ✅ PostgreSQL com criptografia em repouso
- ✅ Conexões via SSL/TLS
- ✅ Valores monetários armazenados em centavos (integer)

### Transmissão
- ✅ HTTPS obrigatório em produção
- ✅ Headers de segurança configurados
- ✅ CORS restrito

### Acesso
- ✅ Autenticação obrigatória
- ✅ Sessões com timeout
- ✅ Rate limiting implementado

## 📊 Audit Log Format

Todos os logs seguem o padrão:

```
[Operação] LGPD Audit: User [userId] [ação] transações de [targetUserId] em [timestamp]
```

Exemplos:
```
📊 LGPD Audit: User user-123 acessou transações de user-123 em 2025-10-07T20:00:00Z
📝 LGPD Audit: User user-123 criou transação para user-123 em 2025-10-07T20:00:00Z
⚠️ LGPD Audit: User user-456 tentou acessar dados de user-123 (NEGADO)
```

## 🔍 Metadata Armazenada

Cada transação financeira contém metadata JSONB com:

```json
{
  "source": "crewai",
  "agent": "financial_expert",
  "createdBy": "user-id",
  "createdByEmail": "user@email.com",
  "createdAt": "2025-10-07T20:00:00Z",
  "ipAddress": "192.168.1.1",
  "userAgent": "CrewAI Financial Agent/1.0"
}
```

## 🚨 Alertas de Segurança

O sistema registra tentativas suspeitas:

1. **Acesso cruzado**: Usuário A tenta acessar dados de usuário B
2. **Criação não autorizada**: Usuário tenta criar transação para outro
3. **Múltiplas tentativas falhas**: Possível ataque
4. **Acesso sem autenticação**: Tentativa de bypass

## 📝 Configuração no CrewAI

Para usar com autenticação:

```python
# .env
FALACHEFE_API_URL=http://localhost:3000
FALACHEFE_API_KEY=seu-token-aqui  # Token de autenticação
```

## ⚠️ Responsabilidades

### Do Controlador (Falachefe)
- ✅ Implementar controles de acesso
- ✅ Manter logs de auditoria
- ✅ Garantir segurança dos dados
- ⚠️ Responder a solicitações dos titulares (a implementar)

### Do Operador (CrewAI)
- ✅ Sempre enviar userId nas requisições
- ✅ Não cachear dados pessoais
- ✅ Respeitar limitações de acesso
- ✅ Usar conexões seguras (HTTPS)

## 📞 Contato DPO

Em caso de incidentes de segurança ou questões de LGPD:
- Email: dpo@falachefe.com (configurar)
- Processo de resposta: < 24 horas

## 🔄 Próximos Passos

1. ⏳ Implementar direito de exclusão (DELETE)
2. ⏳ Implementar direito de correção (PATCH)
3. ⏳ Implementar exportação de dados (portabilidade)
4. ⏳ Adicionar consentimento explícito para coleta
5. ⏳ Implementar anonimização para dados antigos
6. ⏳ Criar política de retenção de dados
7. ⏳ Documentar processo de resposta a incidentes

## 📚 Referências

- [Lei Geral de Proteção de Dados (Lei nº 13.709/2018)](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [Guia de Boas Práticas LGPD - ANPD](https://www.gov.br/anpd)

---

**Última atualização**: 07/10/2025  
**Responsável**: Equipe de Desenvolvimento Falachefe  
**Status**: ✅ Parcialmente Implementado

