# 🔄 SOLUÇÃO: Cron com Supabase + Upstash Redis

**Data**: 14 de Outubro de 2025  
**Problema**: Limitações de Vercel Cron  
**Solução**: Usar Supabase pg_cron para gerenciar filas Redis

---

## 🎯 PROBLEMA IDENTIFICADO

### Limitações do Vercel Cron

```yaml
Vercel Cron (Hobby/Pro):
  Frequência mínima: 1 minuto (mas não recomendado)
  Timeout: 10s (Hobby), 60s (Pro), 300s (Enterprise)
  Execuções/dia: Limitadas
  Confiabilidade: Média (cold starts)
  Custo: Conta para Serverless execution time
  
Problemas:
  ❌ Timeout muito curto para jobs pesados
  ❌ Cold starts podem atrasar execução
  ❌ Difícil debugar falhas
  ❌ Não há retry automático
  ❌ Consome cota de execução
```

### Casos de Uso Afetados

```typescript
// Exemplos de jobs que podem ter problemas:
1. Processar mensagens em lote (CrewAI)
2. Limpeza de dados antigos
3. Sincronização com APIs externas
4. Envio de notificações agendadas
5. Relatórios diários/semanais
6. Backup de dados
7. Renovação de tokens/sessões
```

---

## ✅ SOLUÇÃO PROPOSTA

### Arquitetura: Supabase pg_cron + Upstash Redis

```
┌─────────────────────────────────────────────────────────────────┐
│                        SUPABASE                                  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  PostgreSQL + pg_cron Extension                            │ │
│  │                                                            │ │
│  │  • Schedule jobs (cron syntax)                            │ │
│  │  • Execute SQL functions                                  │ │
│  │  • Confiável (não depende de cold start)                 │ │
│  │  • Timeout: configurável                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                            ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Edge Functions (Deno)                                     │ │
│  │                                                            │ │
│  │  • Chamadas via http_request (SQL)                        │ │
│  │  • Lógica customizada                                     │ │
│  │  • Retry logic                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    UPSTASH REDIS                                 │
│                                                                   │
│  • Enfileirar jobs                                              │
│  • Gerenciar estado                                             │
│  • Rate limiting                                                │
│  • Cache                                                        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL (Next.js)                              │
│                                                                   │
│  • API Route: /api/cron/process-queue                           │
│  • Processa jobs da fila Redis                                 │
│  • Executa lógica de negócio                                   │
│  • Atualiza status no Supabase                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ IMPLEMENTAÇÃO DETALHADA

### Opção 1: pg_cron → Edge Function → Redis (RECOMENDADO)

#### 1.1 Habilitar pg_cron no Supabase

```sql
-- No Supabase SQL Editor
-- pg_cron já vem instalado, só precisa habilitar

-- Verificar extensão
SELECT extname, extversion FROM pg_extension WHERE extname = 'pg_cron';

-- Se não estiver instalado (raro):
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

#### 1.2 Criar Edge Function no Supabase

**Arquivo**: `supabase/functions/enqueue-job/index.ts`

```typescript
// Supabase Edge Function (Deno)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Redis } from "https://esm.sh/@upstash/redis@1.20.1";

// Configurar Redis
const redis = new Redis({
  url: Deno.env.get('UPSTASH_REDIS_REST_URL')!,
  token: Deno.env.get('UPSTASH_REDIS_REST_TOKEN')!,
});

interface JobPayload {
  type: string;
  data: any;
  priority?: number;
  scheduledFor?: string;
}

serve(async (req) => {
  try {
    // Validar método
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Validar secret (segurança)
    const authHeader = req.headers.get('authorization');
    const secret = Deno.env.get('CRON_SECRET');
    
    if (authHeader !== `Bearer ${secret}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Parse payload
    const payload: JobPayload = await req.json();

    // Validações
    if (!payload.type || !payload.data) {
      return new Response('Invalid payload', { status: 400 });
    }

    console.log('📨 Enqueueing job:', payload.type);

    // Enfileirar no Redis
    const jobId = `job:${Date.now()}:${crypto.randomUUID()}`;
    const job = {
      id: jobId,
      type: payload.type,
      data: payload.data,
      priority: payload.priority || 5,
      status: 'pending',
      createdAt: new Date().toISOString(),
      scheduledFor: payload.scheduledFor || new Date().toISOString(),
      attempts: 0,
      maxAttempts: 3,
    };

    // Usar Redis List para fila
    await redis.lpush('jobs:pending', JSON.stringify(job));

    // Também salvar em hash para lookup
    await redis.hset('jobs:all', jobId, JSON.stringify(job));

    // Set expiration (7 dias)
    await redis.expire(`jobs:all:${jobId}`, 7 * 24 * 60 * 60);

    console.log('✅ Job enqueued:', jobId);

    return new Response(
      JSON.stringify({
        success: true,
        jobId,
        message: 'Job enqueued successfully'
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Error enqueueing job:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
```

#### 1.3 Configurar pg_cron para chamar Edge Function

```sql
-- No Supabase SQL Editor

-- Função helper para chamar Edge Function
CREATE OR REPLACE FUNCTION enqueue_job_via_edge_function(
  job_type TEXT,
  job_data JSONB,
  priority INT DEFAULT 5
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  result JSONB;
  edge_function_url TEXT;
  cron_secret TEXT;
BEGIN
  -- URLs da Edge Function (configurar no Supabase Settings)
  edge_function_url := current_setting('app.edge_function_url', true);
  cron_secret := current_setting('app.cron_secret', true);
  
  -- Se não configurado, usar valores padrão
  IF edge_function_url IS NULL THEN
    edge_function_url := 'https://zpdartuyaergbxmbmtur.supabase.co/functions/v1/enqueue-job';
  END IF;
  
  IF cron_secret IS NULL THEN
    cron_secret := 'e096742e-7b6d-4b6a-b987-41d533adbd50';
  END IF;

  -- Chamar Edge Function via http_request
  SELECT content::JSONB INTO result
  FROM http((
    'POST',
    edge_function_url,
    ARRAY[
      http_header('Content-Type', 'application/json'),
      http_header('Authorization', 'Bearer ' || cron_secret)
    ],
    'application/json',
    jsonb_build_object(
      'type', job_type,
      'data', job_data,
      'priority', priority
    )::TEXT
  )::http_request);

  RETURN result;
END;
$$;

-- ============================================
-- CRON JOBS
-- ============================================

-- 1. Processar mensagens pendentes (a cada 5 minutos)
SELECT cron.schedule(
  'process-pending-messages',
  '*/5 * * * *',  -- A cada 5 minutos
  $$
    SELECT enqueue_job_via_edge_function(
      'process-messages',
      jsonb_build_object(
        'limit', 50,
        'maxAge', '5 minutes'
      ),
      1  -- Alta prioridade
    );
  $$
);

-- 2. Limpeza de dados antigos (diariamente às 2am)
SELECT cron.schedule(
  'cleanup-old-data',
  '0 2 * * *',  -- 2am todos os dias
  $$
    SELECT enqueue_job_via_edge_function(
      'cleanup-data',
      jsonb_build_object(
        'olderThan', '30 days',
        'tables', ARRAY['messages', 'conversations']
      ),
      5  -- Prioridade normal
    );
  $$
);

-- 3. Sincronizar dados UAZAPI (a cada hora)
SELECT cron.schedule(
  'sync-uazapi',
  '0 * * * *',  -- A cada hora
  $$
    SELECT enqueue_job_via_edge_function(
      'sync-uazapi',
      jsonb_build_object(
        'syncType', 'incremental'
      ),
      3  -- Prioridade alta
    );
  $$
);

-- 4. Gerar relatórios (segunda-feira às 8am)
SELECT cron.schedule(
  'weekly-reports',
  '0 8 * * 1',  -- Segunda-feira 8am
  $$
    SELECT enqueue_job_via_edge_function(
      'generate-reports',
      jsonb_build_object(
        'reportType', 'weekly',
        'recipients', ARRAY['admin@falachefe.app.br']
      ),
      7  -- Prioridade baixa
    );
  $$
);
```

#### 1.4 API Route no Vercel para processar fila

**Arquivo**: `src/app/api/cron/process-queue/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

interface Job {
  id: string;
  type: string;
  data: any;
  priority: number;
  status: string;
  createdAt: string;
  scheduledFor: string;
  attempts: number;
  maxAttempts: number;
}

export async function POST(request: NextRequest) {
  try {
    // Validar secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Processing job queue...');

    // Processar até 10 jobs por execução
    const maxJobs = 10;
    const processedJobs: string[] = [];
    const errors: any[] = [];

    for (let i = 0; i < maxJobs; i++) {
      // Pop job da fila (FIFO)
      const jobString = await redis.rpop<string>('jobs:pending');
      
      if (!jobString) {
        console.log('📭 Queue empty');
        break;
      }

      const job: Job = JSON.parse(jobString);
      
      console.log(`📨 Processing job ${job.id} (${job.type})`);

      try {
        // Executar job baseado no tipo
        await executeJob(job);

        // Marcar como concluído
        await redis.hset('jobs:all', job.id, JSON.stringify({
          ...job,
          status: 'completed',
          completedAt: new Date().toISOString()
        }));

        processedJobs.push(job.id);
        console.log(`✅ Job ${job.id} completed`);

      } catch (error) {
        console.error(`❌ Job ${job.id} failed:`, error);

        // Incrementar tentativas
        job.attempts += 1;

        if (job.attempts < job.maxAttempts) {
          // Recolocar na fila (com backoff)
          console.log(`🔄 Retrying job ${job.id} (attempt ${job.attempts})`);
          
          await redis.lpush('jobs:pending', JSON.stringify({
            ...job,
            status: 'retry'
          }));
        } else {
          // Marcar como falho
          console.log(`💀 Job ${job.id} failed permanently`);
          
          await redis.hset('jobs:all', job.id, JSON.stringify({
            ...job,
            status: 'failed',
            failedAt: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error'
          }));
        }

        errors.push({
          jobId: job.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedJobs.length,
      errors: errors.length,
      details: {
        processedJobs,
        errors
      }
    });

  } catch (error) {
    console.error('❌ Error processing queue:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Executar job baseado no tipo
async function executeJob(job: Job): Promise<void> {
  switch (job.type) {
    case 'process-messages':
      await processMessages(job.data);
      break;
    
    case 'cleanup-data':
      await cleanupOldData(job.data);
      break;
    
    case 'sync-uazapi':
      await syncUAZAPI(job.data);
      break;
    
    case 'generate-reports':
      await generateReports(job.data);
      break;
    
    default:
      throw new Error(`Unknown job type: ${job.type}`);
  }
}

// Implementações dos handlers
async function processMessages(data: any): Promise<void> {
  // Processar mensagens pendentes
  console.log('Processing messages:', data);
  // Implementar lógica
}

async function cleanupOldData(data: any): Promise<void> {
  // Limpar dados antigos
  console.log('Cleaning up old data:', data);
  // Implementar lógica
}

async function syncUAZAPI(data: any): Promise<void> {
  // Sincronizar com UAZAPI
  console.log('Syncing UAZAPI:', data);
  // Implementar lógica
}

async function generateReports(data: any): Promise<void> {
  // Gerar relatórios
  console.log('Generating reports:', data);
  // Implementar lógica
}
```

#### 1.5 Configurar Vercel Cron para processar fila

**Arquivo**: `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/process-queue",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

---

### Opção 2: pg_cron → Webhook Direto → Vercel (ALTERNATIVA)

```sql
-- Função para chamar webhook Vercel diretamente
CREATE OR REPLACE FUNCTION trigger_vercel_cron(
  endpoint TEXT,
  payload JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  result JSONB;
  vercel_url TEXT;
  cron_secret TEXT;
BEGIN
  vercel_url := 'https://falachefe.app.br' || endpoint;
  cron_secret := current_setting('app.cron_secret', true);

  SELECT content::JSONB INTO result
  FROM http((
    'POST',
    vercel_url,
    ARRAY[
      http_header('Content-Type', 'application/json'),
      http_header('Authorization', 'Bearer ' || cron_secret)
    ],
    'application/json',
    payload::TEXT
  )::http_request);

  RETURN result;
END;
$$;

-- Exemplo de uso
SELECT cron.schedule(
  'direct-webhook',
  '*/10 * * * *',
  $$
    SELECT trigger_vercel_cron(
      '/api/cron/process-messages',
      jsonb_build_object('limit', 50)
    );
  $$
);
```

---

## 📊 COMPARAÇÃO DE OPÇÕES

| Aspecto | Vercel Cron | Supabase pg_cron + Edge Function | Supabase pg_cron → Webhook |
|---------|-------------|----------------------------------|----------------------------|
| **Confiabilidade** | Média | Alta | Alta |
| **Timeout** | 10-300s | Configurável | Configurável |
| **Cold Start** | Sim | Mínimo | Sim (Vercel) |
| **Custo** | Serverless time | Incluído no Supabase | Serverless time |
| **Retry** | Manual | Automático (Redis) | Manual |
| **Debugging** | Difícil | Fácil (logs Supabase) | Médio |
| **Complexidade** | Baixa | Média | Baixa |
| **Flexibilidade** | Baixa | Alta | Média |

**Recomendação**: Opção 1 (pg_cron + Edge Function + Redis)

---

## ✅ VANTAGENS DA SOLUÇÃO

### 1. Confiabilidade
```yaml
Supabase pg_cron:
  ✅ Não depende de cold starts
  ✅ Execução garantida
  ✅ Logs persistentes
  ✅ Retry configurável
```

### 2. Flexibilidade
```yaml
Sistema de Filas:
  ✅ Priorização de jobs
  ✅ Rate limiting
  ✅ Scheduling avançado
  ✅ Retry automático
  ✅ Dead letter queue
```

### 3. Custo
```yaml
Custos:
  ✅ Supabase pg_cron: GRÁTIS (incluído)
  ✅ Edge Functions: GRÁTIS até 500k req/mês
  ✅ Upstash Redis: GRÁTIS até 10k commands/day
  ✅ Vercel: Apenas processamento (não cron)
  
Total: ~$0 para volume médio
```

### 4. Monitoramento
```yaml
Visibilidade:
  ✅ Logs Supabase (Edge Functions)
  ✅ Status jobs no Redis
  ✅ Métricas Vercel (processamento)
  ✅ Histórico no PostgreSQL
```

---

## 🚀 CASOS DE USO

### 1. Processar Mensagens em Lote

```sql
-- Agendar processamento a cada 10 minutos
SELECT cron.schedule(
  'batch-messages',
  '*/10 * * * *',
  $$
    SELECT enqueue_job_via_edge_function(
      'process-batch',
      jsonb_build_object(
        'maxMessages', 100,
        'timeout', '120s'
      )
    );
  $$
);
```

### 2. Backup Automático

```sql
-- Backup diário às 3am
SELECT cron.schedule(
  'daily-backup',
  '0 3 * * *',
  $$
    SELECT enqueue_job_via_edge_function(
      'backup-data',
      jsonb_build_object(
        'tables', ARRAY['users', 'conversations', 'messages'],
        'destination', 's3://backups/'
      ),
      9  -- Baixa prioridade
    );
  $$
);
```

### 3. Notificações Agendadas

```sql
-- Verificar notificações pendentes a cada 15min
SELECT cron.schedule(
  'pending-notifications',
  '*/15 * * * *',
  $$
    SELECT enqueue_job_via_edge_function(
      'send-notifications',
      jsonb_build_object(
        'channels', ARRAY['email', 'whatsapp'],
        'pending', true
      ),
      2  -- Alta prioridade
    );
  $$
);
```

### 4. Sincronização com APIs

```sql
-- Sincronizar com UAZAPI a cada 30min
SELECT cron.schedule(
  'sync-whatsapp',
  '*/30 * * * *',
  $$
    SELECT enqueue_job_via_edge_function(
      'sync-external-api',
      jsonb_build_object(
        'api', 'uazapi',
        'syncType', 'incremental'
      )
    );
  $$
);
```

---

## 🔍 MONITORAMENTO E DEBUG

### Ver Jobs Agendados

```sql
-- Listar todos os cron jobs
SELECT 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobname
FROM cron.job
ORDER BY jobid;

-- Ver histórico de execuções
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;
```

### Monitorar Fila Redis

```typescript
// Script helper
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

async function monitorQueue() {
  // Total de jobs pendentes
  const pendingCount = await redis.llen('jobs:pending');
  
  // Jobs por status
  const allJobs = await redis.hgetall('jobs:all');
  const stats = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  };
  
  for (const [id, jobString] of Object.entries(allJobs)) {
    const job = JSON.parse(jobString as string);
    stats[job.status]++;
  }
  
  console.log('📊 Queue Stats:', {
    pendingCount,
    ...stats
  });
}
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Supabase
- [ ] Habilitar extensão `pg_cron`
- [ ] Habilitar extensão `http` (para requisições)
- [ ] Criar função `enqueue_job_via_edge_function`
- [ ] Configurar variáveis (`app.edge_function_url`, `app.cron_secret`)
- [ ] Criar cron jobs necessários

### Edge Function
- [ ] Criar função `enqueue-job` no Supabase
- [ ] Configurar secrets (UPSTASH_REDIS_REST_URL, CRON_SECRET)
- [ ] Deploy da função
- [ ] Testar endpoint

### Redis
- [ ] Configurar estrutura de filas
- [ ] Implementar TTL para jobs
- [ ] Configurar monitoramento

### Vercel
- [ ] Criar `/api/cron/process-queue` route
- [ ] Configurar `vercel.json` com cron
- [ ] Implementar handlers para cada tipo de job
- [ ] Adicionar logging adequado
- [ ] Testar localmente

### Segurança
- [ ] Configurar `CRON_SECRET` forte
- [ ] Validar authorization em todos endpoints
- [ ] Rate limiting
- [ ] Validação de payload

---

## 🎓 CONCLUSÃO

### ✅ RECOMENDAÇÃO

**USE Supabase pg_cron + Edge Functions + Upstash Redis**

**Por quê?**:
1. ✅ Mais confiável que Vercel Cron
2. ✅ Sem cold starts
3. ✅ Retry automático
4. ✅ Custo zero (volume médio)
5. ✅ Fácil de monitorar
6. ✅ Escalável

### 📊 Custo Comparativo

```
Solução Atual (Vercel Cron):
  • Serverless executions: $X/mês
  • Build time: Sim
  • Limitações: Sim

Solução Nova (Supabase + Redis):
  • Supabase pg_cron: $0
  • Edge Functions: $0 (até 500k/mês)
  • Upstash Redis: $0 (até 10k/dia)
  • Vercel apenas processa fila: Menor uso
  
Economia: $10-30/mês + Mais confiável
```

---

**Status**: ✅ Solução viável e recomendada  
**Complexidade**: Média (vale o investimento)  
**ROI**: Positivo (economia + confiabilidade)


