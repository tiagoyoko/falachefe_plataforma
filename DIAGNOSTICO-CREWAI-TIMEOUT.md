# Diagnóstico: CrewAI Timeout no Servidor Hetzner

## 🔍 Problema Identificado

O servidor CrewAI Flask está recebendo requisições mas **não respondendo** devido a timeout na inicialização do CrewAI.

## 📊 Evidências

### 1. Health Check
```json
{
  "status": "healthy",
  "crew_initialized": false,  // ❌ CrewAI NÃO inicializado
  "uazapi_configured": true,
  "qstash_configured": false
}
```

### 2. Teste de Requisição
```bash
curl -X POST https://api.falachefe.app.br/process \
  -H "Content-Type: application/json" \
  -d '{"message": "teste", "userId": "...", "phoneNumber": "..."}'
  
# Resultado: TIMEOUT após 30 segundos
```

### 3. Logs do Webhook (Vercel)
```
✅ Payload enviado corretamente:
{
  "message": "Oi, quero criar um plano de carreira...",
  "userId": "2f16ae84-c5df-47dd-a81f-e83b8de315da",
  "phoneNumber": "5511994066248",
  "context": {...}
}

❌ SEM RESPOSTA do CrewAI
```

## 🐛 Causa Raiz

O servidor Flask usa **lazy loading** do CrewAI:

```python
# api_server.py linha 36-46
crew_instance = None

def get_crew():
    global crew_instance
    if crew_instance is None:
        print("🚀 Initializing FalachefeCrew...", file=sys.stderr)
        crew_instance = FalachefeCrew()  # ← TRAVA AQUI
        print("✅ FalachefeCrew initialized", file=sys.stderr)
    return crew_instance
```

**Problema:**
1. Primeira requisição chega em `/process`
2. Tenta inicializar `FalachefeCrew()`
3. Inicialização demora **> 120 segundos** (timeout do Gunicorn)
4. Gunicorn mata o worker por timeout
5. Próxima requisição reinicia o ciclo

## ⚙️ Configuração Atual

```yaml
# docker-compose.yml
GUNICORN_TIMEOUT: 120  # 2 minutos
GUNICORN_WORKERS: 2
GUNICORN_THREADS: 4
```

## 🔧 Soluções Possíveis

### Solução 1: Pré-inicializar CrewAI (RECOMENDADO)
Inicializar crew ao startar servidor, não no primeiro request.

```python
# api_server.py
if __name__ == '__main__':
    print("🚀 Pre-initializing CrewAI...", file=sys.stderr)
    crew_instance = FalachefeCrew()  # Inicializar ANTES de startar Flask
    print("✅ CrewAI ready", file=sys.stderr)
    
    app.start_time = time()
    app.run(host='0.0.0.0', port=port, debug=False)
```

### Solução 2: Aumentar Timeout Gunicorn
```yaml
GUNICORN_TIMEOUT: 300  # 5 minutos
```

### Solução 3: Resposta Assíncrona
1. Receber requisição
2. Retornar `202 Accepted` imediatamente
3. Processar em background
4. Enviar resposta via webhook callback

### Solução 4: Health Check com Inicialização
```python
@app.route('/health', methods=['GET'])
def health():
    # Forçar inicialização no health check
    crew = get_crew()
    return jsonify({
        "status": "healthy",
        "crew_initialized": crew is not None
    })
```

## 📝 Próximos Passos

### Imediato (Solução Rápida)
1. SSH no servidor Hetzner
2. Aumentar `GUNICORN_TIMEOUT` para 300
3. Reiniciar container CrewAI
4. Testar inicialização

```bash
ssh root@37.27.248.13
cd /opt/falachefe-crewai
nano .env  # GUNICORN_TIMEOUT=300
docker compose restart crewai-api
docker compose logs -f crewai-api  # Ver inicialização
```

### Definitivo (Solução Correta)
1. Modificar `api_server.py` para pré-inicializar
2. Testar localmente
3. Deploy com GitHub MCP
4. Validar no Hetzner

## 🎯 Solução Implementada

**Escolha:** Solução 1 (Pré-inicializar) + Solução 2 (Timeout maior)

### Vantagens
- ✅ Crew pronto ao receber primeira requisição
- ✅ Sem timeout no processamento
- ✅ Performance consistente
- ✅ Fácil debug

### Desvantagens
- ⚠️ Startup mais lento (ok para produção)
- ⚠️ Requer mais memória no boot

---

**Data:** 2025-10-13  
**Severidade:** ALTA (serviço não funcional)  
**Status:** DIAGNOSTICADO - Aguardando implementação

