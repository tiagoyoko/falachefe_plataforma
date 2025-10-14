# 🚀 Implementação: Endpoint /api/financial/crewai

**Data**: 14 de Outubro de 2025  
**Status**: 🔧 EM DESENVOLVIMENTO  
**Prioridade**: 🔴 ALTA

---

## 📋 Contexto

O agente financeiro Leo usa ferramentas para interagir com o fluxo de caixa. A ferramenta `AddCashflowTransactionTool` tenta chamar:

```
POST https://falachefe.app.br/api/financial/crewai
```

Esse endpoint **não existe**, causando erro:

> "Infelizmente, estou enfrentando dificuldades para registrar a transação inicial devido a um problema de acesso."

---

## 🎯 Objetivo

Criar endpoint que:
1. ✅ Recebe transações do CrewAI
2. ✅ Valida autenticação
3. ✅ Salva no PostgreSQL
4. ✅ Retorna confirmação
5. ✅ Registra logs

---

## 📐 Especificação da API

### Request

**URL**: `POST /api/financial/crewai`

**Headers**:
```typescript
{
  "Content-Type": "application/json",
  "x-crewai-token": "e096742e-7b6d-4b6a-b987-41d533adbd50" // CREWAI_SERVICE_TOKEN
}
```

**Body**:
```typescript
{
  "userId": "or3ZL1Ea1Pm7wFhufyFaRs7y2ZLKLQNb",  // ID do usuário
  "type": "entrada" | "saida",                   // Tipo de transação
  "amount": 1500.00,                             // Valor
  "description": "Venda de produtos",             // Descrição
  "category": "vendas",                          // Categoria
  "date": "2025-10-14",                          // Data (YYYY-MM-DD)
  "metadata": {
    "source": "crewai",
    "agent": "financial_expert",
    "timestamp": "2025-10-14T11:30:00Z"
  }
}
```

### Response (Sucesso)

**Status**: `201 Created`

```typescript
{
  "success": true,
  "data": {
    "id": "uuid-da-transacao",
    "userId": "or3ZL1Ea1Pm7wFhufyFaRs7y2ZLKLQNb",
    "type": "entrada",
    "amount": 1500.00,
    "description": "Venda de produtos",
    "category": "vendas",
    "date": "2025-10-14",
    "createdAt": "2025-10-14T11:30:00Z"
  },
  "message": "Transação registrada com sucesso"
}
```

### Response (Erro)

**Status**: `400 Bad Request` / `401 Unauthorized` / `500 Internal Server Error`

```typescript
{
  "success": false,
  "error": "Descrição do erro",
  "details": {
    // Detalhes adicionais
  }
}
```

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: `cashflow_transactions`

```sql
CREATE TABLE IF NOT EXISTS cashflow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  company_id UUID,  -- Opcional, pegar de user_subscriptions
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
  amount NUMERIC(12, 2) NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  date DATE NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices
  INDEX idx_cashflow_user_id (user_id),
  INDEX idx_cashflow_company_id (company_id),
  INDEX idx_cashflow_date (date),
  INDEX idx_cashflow_type (type),
  INDEX idx_cashflow_category (category)
);
```

### Migração

Criar migration: `src/migrations/YYYYMMDD_create_cashflow_transactions.sql`

```sql
-- Migration: Criar tabela de transações do fluxo de caixa
-- Data: 2025-10-14

BEGIN;

CREATE TABLE IF NOT EXISTS cashflow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  company_id UUID,
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
  amount NUMERIC(12, 2) NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  date DATE NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_cashflow_user_id ON cashflow_transactions(user_id);
CREATE INDEX idx_cashflow_company_id ON cashflow_transactions(company_id);
CREATE INDEX idx_cashflow_date ON cashflow_transactions(date);
CREATE INDEX idx_cashflow_type ON cashflow_transactions(type);
CREATE INDEX idx_cashflow_category ON cashflow_transactions(category);

-- Comentários
COMMENT ON TABLE cashflow_transactions IS 'Transações do fluxo de caixa registradas pelo CrewAI';
COMMENT ON COLUMN cashflow_transactions.type IS 'Tipo: entrada ou saida';
COMMENT ON COLUMN cashflow_transactions.amount IS 'Valor da transação em reais';
COMMENT ON COLUMN cashflow_transactions.metadata IS 'Metadados da origem (CrewAI, agente, timestamp)';

COMMIT;
```

---

## 💻 Implementação

### Arquivo: `src/app/api/financial/crewai/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

/**
 * POST /api/financial/crewai
 * Endpoint para CrewAI registrar transações do fluxo de caixa
 */
export async function POST(request: NextRequest) {
  try {
    // 1. VALIDAR AUTENTICAÇÃO
    const token = request.headers.get('x-crewai-token');
    const expectedToken = process.env.CREWAI_SERVICE_TOKEN;
    
    if (!token || token !== expectedToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token de autenticação inválido ou ausente'
        },
        { status: 401 }
      );
    }

    // 2. PARSEAR E VALIDAR BODY
    const body = await request.json();
    
    const {
      userId,
      type,
      amount,
      description,
      category,
      date,
      metadata
    } = body;
    
    // Validações
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId é obrigatório' },
        { status: 400 }
      );
    }
    
    if (!type || !['entrada', 'saida'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'type deve ser "entrada" ou "saida"' },
        { status: 400 }
      );
    }
    
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'amount deve ser número positivo' },
        { status: 400 }
      );
    }
    
    if (!category) {
      return NextResponse.json(
        { success: false, error: 'category é obrigatória' },
        { status: 400 }
      );
    }
    
    // Validar data
    const transactionDate = date || new Date().toISOString().split('T')[0];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(transactionDate)) {
      return NextResponse.json(
        { success: false, error: 'date deve estar no formato YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // 3. BUSCAR COMPANY_ID (opcional)
    let companyId = null;
    
    try {
      const subscriptions = await db.execute<{ company_id: string }>(
        sql`SELECT company_id 
            FROM user_subscriptions 
            WHERE user_id = ${userId} 
              AND status = 'active' 
            LIMIT 1`
      );
      
      if (subscriptions && subscriptions.length > 0) {
        companyId = subscriptions[0].company_id;
      }
    } catch (error) {
      console.warn('Não foi possível buscar company_id:', error);
    }

    // 4. INSERIR TRANSAÇÃO NO BANCO
    const result = await db.execute<{
      id: string;
      created_at: string;
    }>(
      sql`INSERT INTO cashflow_transactions (
            user_id,
            company_id,
            type,
            amount,
            description,
            category,
            date,
            metadata
          ) VALUES (
            ${userId},
            ${companyId},
            ${type},
            ${amount},
            ${description || `Transação de ${type}`},
            ${category},
            ${transactionDate},
            ${JSON.stringify(metadata || {})}::jsonb
          )
          RETURNING id, created_at`
    );

    const transaction = result[0];

    // 5. LOGAR OPERAÇÃO
    console.log('💰 Transação financeira registrada:', {
      transactionId: transaction.id,
      userId,
      companyId,
      type,
      amount,
      category,
      date: transactionDate,
      source: metadata?.source || 'crewai'
    });

    // 6. RETORNAR SUCESSO
    return NextResponse.json(
      {
        success: true,
        data: {
          id: transaction.id,
          userId,
          companyId,
          type,
          amount,
          description: description || `Transação de ${type}`,
          category,
          date: transactionDate,
          createdAt: transaction.created_at
        },
        message: 'Transação registrada com sucesso'
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('❌ Erro ao registrar transação:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno ao registrar transação',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/financial/crewai
 * Health check do endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Financial CrewAI API',
    endpoints: {
      POST: 'Registrar transação do fluxo de caixa'
    },
    timestamp: new Date().toISOString()
  });
}
```

---

## 🧪 Testes

### 1. Teste Manual (via curl)

```bash
# Registrar entrada
curl -X POST https://falachefe.app.br/api/financial/crewai \
  -H "Content-Type: application/json" \
  -H "x-crewai-token: e096742e-7b6d-4b6a-b987-41d533adbd50" \
  -d '{
    "userId": "or3ZL1Ea1Pm7wFhufyFaRs7y2ZLKLQNb",
    "type": "entrada",
    "amount": 5000.00,
    "description": "Venda de produtos",
    "category": "vendas",
    "date": "2025-10-14"
  }'

# Registrar saída
curl -X POST https://falachefe.app.br/api/financial/crewai \
  -H "Content-Type: application/json" \
  -H "x-crewai-token: e096742e-7b6d-4b6a-b987-41d533adbd50" \
  -d '{
    "userId": "or3ZL1Ea1Pm7wFhufyFaRs7y2ZLKLQNb",
    "type": "saida",
    "amount": 3000.00,
    "description": "Pagamento de aluguel",
    "category": "aluguel",
    "date": "2025-10-14"
  }'
```

### 2. Teste via WhatsApp

```
Usuário: "Registre uma entrada de R$ 5.000 de vendas hoje"
Esperado: Leo usa a ferramenta e confirma registro
```

### 3. Validar no Banco

```sql
SELECT * FROM cashflow_transactions 
WHERE user_id = 'or3ZL1Ea1Pm7wFhufyFaRs7y2ZLKLQNb'
ORDER BY created_at DESC
LIMIT 10;
```

---

## ✅ Checklist de Implementação

### Banco de Dados
- [ ] Executar migration para criar tabela
- [ ] Verificar índices criados
- [ ] Testar insert manual

### Código
- [ ] Criar `src/app/api/financial/crewai/route.ts`
- [ ] Validar autenticação
- [ ] Validar payload
- [ ] Implementar insert
- [ ] Adicionar logs
- [ ] Tratamento de erros

### Testes
- [ ] Teste com token válido
- [ ] Teste com token inválido
- [ ] Teste sem token
- [ ] Teste com dados inválidos
- [ ] Teste de entrada
- [ ] Teste de saída
- [ ] Verificar no banco

### Deploy
- [ ] Lint OK
- [ ] Build OK
- [ ] Commit
- [ ] Deploy Vercel
- [ ] Validar em produção

---

## 📊 Monitoramento

### Logs a Observar

```bash
# Vercel logs
vercel logs --follow | grep "Transação financeira"

# Procurar por:
# - ✅ Transações bem-sucedidas
# - ❌ Erros de autenticação
# - ❌ Erros de validação
# - ❌ Erros de banco
```

### Métricas

- **Taxa de Sucesso**: > 99%
- **Latência**: < 500ms
- **Erros de Autenticação**: < 1%

---

## 🚀 Próximos Passos

1. Criar tabela no banco
2. Implementar endpoint
3. Testar localmente
4. Deploy para produção
5. Testar via WhatsApp
6. Monitorar logs

---

**Responsável**: Time de Desenvolvimento  
**Revisão**: Após implementação

