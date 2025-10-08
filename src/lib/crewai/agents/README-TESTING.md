# 🧪 Como Testar o Financial Agent

Este documento explica como testar o Financial Agent de diferentes formas.

## 🚀 Métodos de Teste

### 1. **Teste via API (Recomendado)**

#### Pré-requisitos:
```bash
# Iniciar o servidor de desenvolvimento
npm run dev
```

#### Teste via GET:
```bash
# Análise de fluxo de caixa
curl "http://localhost:3000/api/test/financial-agent?message=Como%20está%20meu%20fluxo%20de%20caixa?"

# Adicionar despesa
curl "http://localhost:3000/api/test/financial-agent?message=Adicione%20uma%20despesa%20de%20R$%2050,00%20para%20alimentação"

# Listar categorias
curl "http://localhost:3000/api/test/financial-agent?message=Quais%20categorias%20existem?"
```

#### Teste via POST:
```bash
curl -X POST "http://localhost:3000/api/test/financial-agent" \
  -H "Content-Type: application/json" \
  -d '{"message": "Como está meu fluxo de caixa?", "userId": "user123"}'
```

#### Script automatizado:
```bash
# Executar todos os testes
./test-financial-agent.sh
```

### 2. **Teste via Script TypeScript**

#### Teste simples (sem dependências externas):
```bash
npx tsx src/agents/financial/test-simple.ts
```

#### Teste completo (com Redis):
```bash
npx tsx src/agents/financial/test-financial-agent.ts
```

### 3. **Teste via Interface Web**

Acesse: `http://localhost:3000/api/test/financial-agent` no navegador

## 📋 Casos de Teste

### ✅ **Intenções Suportadas:**

1. **Adicionar Despesa** (`add_expense`)
   - "Adicione uma despesa de R$ 50,00 para alimentação"
   - "Gastei R$ 100,00 em transporte hoje"
   - "Registre um pagamento de R$ 200,00 para saúde"

2. **Adicionar Receita** (`add_revenue`)
   - "Registre uma receita de R$ 1000,00 de salário"
   - "Recebi R$ 500,00 de freelancer"
   - "Adicione uma venda de R$ 300,00"

3. **Análise de Fluxo de Caixa** (`cashflow_analysis`)
   - "Como está meu fluxo de caixa?"
   - "Me mostre um resumo financeiro"
   - "Qual minha situação financeira atual?"

4. **Listar Categorias** (`category_list`)
   - "Quais categorias existem?"
   - "Mostre as categorias de despesas"
   - "Liste as categorias disponíveis"

5. **Consulta Financeira** (`financial_query`)
   - "Qual foi meu gasto total em dezembro?"
   - "Quanto gastei com alimentação este mês?"
   - "Me mostre minhas receitas do último mês"

## 🔧 **Configuração de Teste**

### Variáveis de Ambiente:
```bash
# .env.local
OPENAI_API_KEY=sua_chave_openai
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://user:password@localhost:5432/database
```

### Dependências:
- ✅ OpenAI API Key (obrigatória)
- ⚠️ Redis (opcional para teste simples)
- ⚠️ PostgreSQL (opcional para teste simples)

## 📊 **Interpretando os Resultados**

### Resposta de Sucesso:
```json
{
  "success": true,
  "data": {
    "message": "Como está meu fluxo de caixa?",
    "response": "Análise do seu fluxo de caixa...",
    "intent": "cashflow_analysis",
    "confidence": 0.95,
    "processingTime": "1250ms",
    "agentHealth": {
      "isHealthy": true,
      "capabilities": ["add_expense", "add_revenue", ...],
      "currentLoad": 0.5,
      "memoryUsage": "45.2 MB"
    }
  }
}
```

### Resposta de Erro:
```json
{
  "success": false,
  "error": {
    "message": "Descrição do erro",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

## 🐛 **Troubleshooting**

### Erro: "OpenAI API Key not found"
```bash
# Adicionar chave no .env.local
echo "OPENAI_API_KEY=sk-..." >> .env.local
```

### Erro: "Redis connection failed"
```bash
# Instalar e iniciar Redis
brew install redis
brew services start redis

# Ou usar Docker
docker run -d -p 6379:6379 redis:alpine
```

### Erro: "Database connection failed"
```bash
# Configurar PostgreSQL
# Ou usar o teste simples que não requer banco
npx tsx src/agents/financial/test-simple.ts
```

## 🎯 **Próximos Passos**

1. **Teste Básico**: Execute `./test-financial-agent.sh`
2. **Teste Avançado**: Configure Redis e PostgreSQL
3. **Integração**: Teste via webhook do WhatsApp
4. **Produção**: Configure variáveis de ambiente

## 📞 **Suporte**

Se encontrar problemas:
1. Verifique os logs do console
2. Confirme as variáveis de ambiente
3. Teste com o script simples primeiro
4. Verifique a conectividade com OpenAI
