# Classificador LLM + Roteamento Inteligente

**Data:** 12/10/2025  
**Status:** ✅ Implementado

---

## 🎯 Problema Resolvido

### Antes:
```
"Oi" → Crew Hierárquico → 5 agentes → 10+ tasks → 2+ minutos → Timeout ❌
```

### Agora:
```
"Oi" → Classificador LLM → Resposta direta → < 200ms ✅
"Quero adicionar 200 reais de receita" → Classificador → financial_expert → < 30s ✅
```

---

## 🧠 Arquitetura do Classificador

### 1. **Classificador com LLM (GPT-4o-mini)**

```python
classify_message_with_llm(message) → {
  "type": "financial_task",
  "specialist": "financial_expert",
  "confidence": 0.95,
  "reasoning": "Usuário quer registrar transação financeira",
  "needs_specialist": True
}
```

### Categorias:
1. **greeting** - Saudações (oi, olá, bom dia)
2. **acknowledgment** - Agradecimentos (obrigado, valeu)
3. **financial_task** - Tarefas financeiras específicas
4. **marketing_query** - Dúvidas sobre marketing
5. **sales_query** - Questões sobre vendas
6. **hr_query** - Questões sobre RH
7. **continuation** - Continuação de conversa
8. **general** - Questão geral (orquestrador)

---

## 🔀 Roteamento Inteligente

### Fluxo:

```
1. Mensagem → Classificador LLM
   ↓
2. Tipo detectado?
   ├─ greeting/acknowledgment → Resposta direta (sem CrewAI)
   ├─ financial_task → Crew(financial_expert + task)
   ├─ marketing_query → Crew(marketing_expert + task)
   ├─ sales_query → Crew(sales_expert + task)
   ├─ hr_query → Crew(hr_expert + task)
   └─ general → Crew hierárquico (orquestrador)
```

### Crews Criados Dinamicamente:

#### Para tarefas específicas (RÁPIDO):
```python
# Apenas 1 agente + 1 task
simple_crew = Crew(
    agents=[financial_expert],  # Só o especialista necessário
    tasks=[financial_task],      # Só a task específica
    process=Process.sequential,   # Não precisa hierarquia
    verbose=True
)
```

#### Para questões complexas (COMPLETO):
```python
# Hierárquico com todos agentes
orchestrated_crew = Crew(
    agents=[financial, marketing, sales, hr, support],
    tasks=[orchestrate_request, format_response],
    process=Process.hierarchical,
    manager_agent=orchestrator,
    verbose=True
)
```

---

## 📊 Performance

| Tipo de Mensagem | Agentes Usados | Tempo | Tokens |
|------------------|----------------|-------|--------|
| Saudação "Oi" | 0 (resposta direta) | < 200ms | ~50 |
| "Adicionar R$200" | 1 (financial_expert) | ~10-30s | ~500-1000 |
| "Quero ajuda com marketing e vendas" | 5+ (orquestrador) | 60-120s | ~2000-4000 |

---

## 🎨 Exemplos de Classificação

### Exemplo 1: Saudação
```
Input: "Oi"
Output: {
  "type": "greeting",
  "specialist": "none",
  "confidence": 0.98,
  "response": "Olá! 👋 Seja bem-vindo ao FalaChefe!...",
  "needs_specialist": False
}
```

### Exemplo 2: Tarefa Financeira
```
Input: "Quero adicionar 200 reais de receita no fluxo de caixa na data de ontem"
Output: {
  "type": "financial_task",
  "specialist": "financial_expert",
  "confidence": 0.95,
  "reasoning": "Usuário quer registrar transação específica",
  "needs_specialist": True
}
```

### Exemplo 3: Continuação de Conversa
```
Input: "Além dos 200 reais, também quero registrar 300 reais de despesas"
Output: {
  "type": "continuation",
  "specialist": "financial_expert",  # Mantém contexto
  "confidence": 0.92,
  "reasoning": "Continuação de conversa financeira",
  "needs_specialist": True
}
```

### Exemplo 4: Questão Geral
```
Input: "Preciso de ajuda para estruturar minha empresa"
Output: {
  "type": "general",
  "specialist": "orchestrator",
  "confidence": 0.85,
  "reasoning": "Questão ampla que requer múltiplos especialistas",
  "needs_specialist": True
}
```

---

## 🛡️ Fallback

Se o LLM falhar:
```python
# Fallback: Classificação por keywords
financial_kw = ['fluxo de caixa', 'receita', 'despesa', 'reais', 'dinheiro']
if any(kw in message.lower() for kw in financial_kw):
    return {"type": "financial_task", "specialist": "financial_expert"}
```

---

## 💰 Custo

- **Classificador LLM**: GPT-4o-mini
  - ~150 tokens por classificação
  - Custo: ~$0.0001 por classificação
  - 10,000 mensagens/mês = ~$1.00

- **Economia vs. Antes**:
  - Antes: Todas mensagens → Crew completo → ~2000 tokens
  - Agora: 80% → Resposta direta ou agente único → ~200 tokens
  - **Economia: ~90% de tokens**

---

## 📝 Próximas Melhorias

1. **Memória de Contexto**:
   - Guardar classificações anteriores
   - Detectar melhor continuações de conversa
   - Manter especialista ativo para follow-ups

2. **Fine-tuning do Classificador**:
   - Treinar modelo específico para o domínio
   - Melhorar confiança em casos ambíguos

3. **Roteamento Multi-Especialista**:
   - Detectar quando precisa 2+ especialistas
   - Criar crew com apenas os necessários

---

## ✅ Benefícios

1. ✅ **Performance**: 10x mais rápido para mensagens simples
2. ✅ **Custo**: 90% menos tokens
3. ✅ **UX**: Respostas instantâneas para saudações
4. ✅ **Precisão**: Especialista certo para cada tarefa
5. ✅ **Escalabilidade**: Suporta muito mais usuários simultâneos

---

**Deploy:** Hetzner Docker Stack  
**Status:** ✅ Em Produção



