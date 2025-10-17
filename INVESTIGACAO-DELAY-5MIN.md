# 🔍 Investigação: Delay de 5 Minutos no Roteamento

**Data**: 17/10/2025 13:10  
**Status**: 🔵 EM ANDAMENTO

---

## 📊 Evidências do Delay

### Teste com Max (Marketing)

**Mensagem enviada**: 12:33:11  
**POST chegou ao CrewAI**: 12:38:26  
**Delay**: **~5 minutos e 15 segundos** ⏰

**CrewAI processou**: 32 segundos (normal)  
**Total usuário esperou**: ~6 minutos

---

## ✅ Hipóteses Descartadas

### 1. DNS Lento ❌
```bash
dig api.falachefe.app.br
Query time: 51 msec  ← RÁPIDO!
```

### 2. HTTPS/SSL Lento ❌
```bash
curl -I https://api.falachefe.app.br/health
Time: 1.823s total  ← RÁPIDO!
```

### 3. Traefik com Erros ❌
```
Logs do Traefik: vazios (sem erros ou warnings)
```

### 4. Servidor CrewAI Lento ❌
```
✅ CrewAI completed in 32083ms  ← 32 segundos (normal)
```

---

## 🎯 Hipóteses Ativas

### Hipótese 1: Fetch() da Vercel Trava

**Teoria**: O `fetch()` no webhook da Vercel não envia imediatamente.

**Evidência Necessária**:
- Logs da Vercel mostrando timestamp do DEBUG 12
- Comparar com timestamp do POST no servidor

**Como testar**:
- Adicionar `Date.now()` nos logs
- Verificar diferença entre DEBUG 12 e POST arrival

---

### Hipótese 2: Vercel Edge Network Delay

**Teoria**: Vercel tem delay para conectar com Hetzner (Europa).

**Evidência Necessária**:
- Região da função Vercel (iad1 = US East)
- Localização do Hetzner (provavelmente Europa)
- Latência de rede entre regiões

**Como testar**:
- curl -w com timing detalhado
- Verificar se há retry automático

---

### Hipótese 3: Fire-and-Forget Não É Imediato

**Teoria**: Promise não aguardada pode ser processada depois.

**Evidência**:
```typescript
fetch(targetEndpoint, ...)
  .then(...)  // Não aguardado
  .catch(...);

// Webhook retorna 200 aqui
return NextResponse.json(...);
```

**Problema potencial**: 
- Event loop do Node.js pode adiar execução
- Vercel pode fazer "cold start" no fetch

**Como testar**:
- Adicionar timestamp antes e depois do fetch
- Verificar se há diferença

---

### Hipótese 4: Traefik Rate Limiting

**Teoria**: Traefik pode ter rate limit por IP/domínio.

**Evidência Necessária**:
- Configuração do Traefik (middlewares)
- Logs de rate limiting

**Como testar**:
- Verificar traefik.yml ou docker labels
- Ver se há middleware de rate limit

---

## 🧪 Testes Planejados

### Teste 1: Timestamps Detalhados

Adicionar ao webhook:
```typescript
const t1 = Date.now();
console.log('🔍 [T1] Antes do fetch:', t1);

fetch(...)
  .then(response => {
    const t2 = Date.now();
    console.log('✅ Request completou:', { 
      elapsed: t2 - t1,
      timestamp: t2
    });
  });
```

Comparar com logs do servidor:
```
10.0.1.66 - - [17/Oct/2025:12:38:26 +0000] "POST /process"
```

---

### Teste 2: Curl com Timing Detalhado

```bash
curl -X POST https://api.falachefe.app.br/process \
  -H "Content-Type: application/json" \
  -d '{...}' \
  -w "\nDNS: %{time_namelookup}s\nConnect: %{time_connect}s\nSSL: %{time_appconnect}s\nStart Transfer: %{time_starttransfer}s\nTotal: %{time_total}s\n" \
  --max-time 60
```

---

### Teste 3: tcpdump no Servidor

Capturar pacotes para ver QUANDO chegam:
```bash
ssh root@37.27.248.13 "tcpdump -i any port 8000 -n -tttt"
```

Comparar com timestamp do webhook.

---

### Teste 4: Traefik Access Logs

Habilitar access logs no Traefik:
```yaml
accessLog:
  filePath: "/var/log/traefik/access.log"
  format: json
```

Ver timestamp exato de cada request.

---

## 🔄 Próximos Passos

1. ✅ Adicionar timestamps detalhados no webhook
2. ✅ Enviar nova mensagem de teste
3. ✅ Comparar timestamps (Vercel vs Servidor)
4. ✅ Identificar onde está o delay
5. ✅ Implementar solução específica

---

## 💡 Soluções Possíveis (Após Identificar Causa)

### Se for Vercel Edge → Hetzner Latency:
- Usar Upstash QStash (infraestrutura otimizada)
- Ou Railway (mais próximo geograficamente)

### Se for Traefik:
- Ajustar timeouts
- Remover middlewares desnecessários
- Ou expor porta direta (8001?)

### Se for Código do Webhook:
- Garantir fetch() imediato
- Usar queueing real (Redis/QStash)

---

**Status**: 🔵 EM INVESTIGAÇÃO  
**Próximo**: Adicionar timestamps detalhados

