# 💻 EXEMPLO PRÁTICO: Cron com Supabase + Redis

**Caso de Uso**: Processar mensagens WhatsApp pendentes a cada 5 minutos

---

## 🎯 OBJETIVO

Substituir o Vercel Cron por um sistema mais confiável usando:
- **Supabase pg_cron** (trigger automático)
- **Supabase Edge Function** (enfileirar no Redis)
- **Upstash Redis** (fila de jobs)
- **Vercel API Route** (processar fila)

---

## 📁 ESTRUTURA DE ARQUIVOS

```
Falachefe/
├── supabase/
│   └── functions/
│       └── enqueue-job/
│           ├── index.ts           ← Edge Function
│           └── .env.example
│
├── src/
│   └── app/
│       └── api/
│           └── cron/
│               └── process-queue/
│                   └── route.ts   ← Vercel API Route
│
└── sql/
    └── setup-cron.sql             ← SQL setup
```

---

## 🚀 PASSO A PASSO

### PASSO 1: Setup Supabase Database

**Arquivo**: `sql/setup-cron.sql`

```sql
-- ================================================
-- Setup pg_cron e funções auxiliares
-- Execute no Supabase SQL Editor
-- ================================================

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http;

-- 2. Configurar variáveis do projeto
ALTER DATABASE postgres SET app.edge_function_url = 'https://zpdartuyaergbxmbmtur.supabase.co/functions/v1/enqueue-job';
ALTER DATABASE postgres SET app.cron_secret = 'e096742e-7b6d-4b6a-b987-41d533adbd50';

-- 3. Função para enfileirar jobs via Edge Function
CREATE OR REPLACE FUNCTION enqueue_job(
  p_job_type TEXT,
  p_job_data JSONB,
  p_priority INT DEFAULT 5
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_edge_function_url TEXT;
  v_cron_secret TEXT;
  v_request_body TEXT;
  v_response http_response;
BEGIN
  -- Obter configurações
  v_edge_function_url := current_setting('app.edge_function_url', false);
  v_cron_secret := current_setting('app.cron_secret', false);
  
  -- Preparar payload
  v_request_body := jsonb_build_object(
    'type', p_job_type,
    'data', p_job_data,
    'priority', p_priority
  )::TEXT;

  -- Log da tentativa
  RAISE NOTICE 'Enqueueing job: % to %', p_job_type, v_edge_function_url;

  -- Fazer requisição HTTP
  SELECT * INTO v_response
  FROM http((
    'POST',
    v_edge_function_url,
    ARRAY[
      http_header('Content-Type', 'application/json'),
      http_header('Authorization', 'Bearer ' || v_cron_secret)
    ],
    'application/json',
    v_request_body
  )::http_request);

  -- Verificar status
  IF v_response.status != 200 THEN
    RAISE WARNING 'Edge Function returned status %: %', 
      v_response.status, 
      v_response.content;
  END IF;

  -- Parse resposta
  v_result := v_response.content::JSONB;

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error enqueueing job: %', SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 4. Agendar job para processar mensagens a cada 5 minutos
SELECT cron.schedule(
  'process-pending-messages',      -- Nome único
  '*/5 * * * *',                   -- A cada 5 minutos
  $$
    SELECT enqueue_job(
      'process-messages',
      jsonb_build_object(
        'maxMessages', 50,
        'maxAgeMinutes', 5,
        'priority', 'high'
      ),
      1  -- Prioridade alta
    );
  $$
);

-- 5. Agendar limpeza de dados antigos (diariamente às 2am)
SELECT cron.schedule(
  'cleanup-old-data',
  '0 2 * * *',
  $$
    SELECT enqueue_job(
      'cleanup-old-data',
      jsonb_build_object(
        'olderThanDays', 30,
        'tables', ARRAY['messages', 'conversations']
      ),
      9  -- Prioridade baixa
    );
  $$
);

-- 6. Criar tabela para log de cron jobs (opcional mas útil)
CREATE TABLE IF NOT EXISTS cron_job_logs (
  id BIGSERIAL PRIMARY KEY,
  job_name TEXT NOT NULL,
  job_type TEXT NOT NULL,
  status TEXT NOT NULL,  -- 'success', 'error'
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para performance
CREATE INDEX idx_cron_job_logs_created_at ON cron_job_logs(created_at DESC);
CREATE INDEX idx_cron_job_logs_job_type ON cron_job_logs(job_type);

-- Função melhorada com logging
CREATE OR REPLACE FUNCTION enqueue_job_with_log(
  p_job_name TEXT,
  p_job_type TEXT,
  p_job_data JSONB,
  p_priority INT DEFAULT 5
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Enfileirar job
  v_result := enqueue_job(p_job_type, p_job_data, p_priority);

  -- Log do resultado
  INSERT INTO cron_job_logs (job_name, job_type, status, details)
  VALUES (
    p_job_name,
    p_job_type,
    CASE WHEN (v_result->>'success')::BOOLEAN THEN 'success' ELSE 'error' END,
    v_result
  );

  RETURN v_result;
END;
$$;
```

---

### PASSO 2: Edge Function (Supabase)

**Arquivo**: `supabase/functions/enqueue-job/index.ts`

```typescript
// Supabase Edge Function
// Deploy: supabase functions deploy enqueue-job

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Redis } from "https://esm.sh/@upstash/redis@1.20.1";

// Configurar Redis
const redis = new Redis({
  url: Deno.env.get('UPSTASH_REDIS_REST_URL')!,
  token: Deno.env.get('UPSTASH_REDIS_REST_TOKEN')!,
});

// Tipos
interface JobPayload {
  type: string;
  data: any;
  priority?: number;
}

interface Job {
  id: string;
  type: string;
  data: any;
  priority: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  scheduledFor: string;
  attempts: number;
  maxAttempts: number;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validar método
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validar autenticação
    const authHeader = req.headers.get('authorization');
    const expectedAuth = `Bearer ${Deno.env.get('CRON_SECRET')}`;
    
    if (authHeader !== expectedAuth) {
      console.error('❌ Unauthorized request');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse payload
    const payload: JobPayload = await req.json();

    // Validações
    if (!payload.type || typeof payload.type !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid job type' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!payload.data) {
      return new Response(
        JSON.stringify({ error: 'Invalid job data' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('📨 Enqueueing job:', {
      type: payload.type,
      priority: payload.priority || 5,
      dataKeys: Object.keys(payload.data)
    });

    // Criar job
    const jobId = `job:${Date.now()}:${crypto.randomUUID()}`;
    const job: Job = {
      id: jobId,
      type: payload.type,
      data: payload.data,
      priority: payload.priority || 5,
      status: 'pending',
      createdAt: new Date().toISOString(),
      scheduledFor: new Date().toISOString(),
      attempts: 0,
      maxAttempts: 3,
    };

    // Enfileirar no Redis (fila por prioridade)
    const queueKey = `jobs:queue:priority:${job.priority}`;
    await redis.lpush(queueKey, JSON.stringify(job));

    // Também adicionar à fila geral
    await redis.lpush('jobs:queue:all', JSON.stringify(job));

    // Salvar no hash para lookup
    await redis.hset('jobs:all', jobId, JSON.stringify(job));

    // TTL de 7 dias
    await redis.expire(jobId, 7 * 24 * 60 * 60);

    // Incrementar contador
    await redis.incr('jobs:stats:total');
    await redis.incr(`jobs:stats:${payload.type}`);

    console.log('✅ Job enqueued successfully:', jobId);

    // Resposta
    return new Response(
      JSON.stringify({
        success: true,
        jobId,
        queuePosition: await redis.llen(queueKey),
        message: 'Job enqueued successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Error enqueueing job:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
```

**Arquivo**: `supabase/functions/enqueue-job/.env.example`

```bash
# Copiar para .env e preencher valores
UPSTASH_REDIS_REST_URL=https://sound-minnow-16817.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
CRON_SECRET=e096742e-7b6d-4b6a-b987-41d533adbd50
```

---

### PASSO 3: API Route Vercel (Processar Fila)

**Arquivo**: `src/app/api/cron/process-queue/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { createClient } from '@supabase/supabase-js';

// Configurar Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Configurar Supabase (para acessar dados)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

export const maxDuration = 60; // 60s timeout

export async function POST(request: NextRequest) {
  try {
    // Validar secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('❌ Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 [CRON] Processing job queue...');

    // Estatísticas
    const stats = {
      processed: 0,
      failed: 0,
      errors: [] as any[],
    };

    // Processar até 10 jobs por execução (para não estourar timeout)
    const maxJobs = 10;

    for (let i = 0; i < maxJobs; i++) {
      // Tentar todas as filas de prioridade (1-9)
      let job: Job | null = null;
      
      for (let priority = 1; priority <= 9; priority++) {
        const queueKey = `jobs:queue:priority:${priority}`;
        const jobString = await redis.rpop<string>(queueKey);
        
        if (jobString) {
          job = JSON.parse(jobString);
          break;
        }
      }

      // Se não há mais jobs, parar
      if (!job) {
        console.log('📭 Queue empty');
        break;
      }

      console.log(`📨 Processing job ${job.id} (${job.type})`);

      // Marcar como processando
      await redis.hset('jobs:all', job.id, JSON.stringify({
        ...job,
        status: 'processing',
        startedAt: new Date().toISOString()
      }));

      try {
        // Executar job baseado no tipo
        await executeJob(job);

        // Marcar como concluído
        await redis.hset('jobs:all', job.id, JSON.stringify({
          ...job,
          status: 'completed',
          completedAt: new Date().toISOString()
        }));

        stats.processed++;
        console.log(`✅ Job ${job.id} completed`);

      } catch (error) {
        console.error(`❌ Job ${job.id} failed:`, error);

        // Incrementar tentativas
        job.attempts += 1;

        if (job.attempts < job.maxAttempts) {
          // Recolocar na fila (com prioridade reduzida)
          const retryPriority = Math.min(job.priority + 2, 9);
          const retryQueue = `jobs:queue:priority:${retryPriority}`;
          
          console.log(`🔄 Retrying job ${job.id} (attempt ${job.attempts}/${job.maxAttempts})`);
          
          await redis.lpush(retryQueue, JSON.stringify({
            ...job,
            status: 'pending',
            lastError: error instanceof Error ? error.message : 'Unknown error',
            lastAttemptAt: new Date().toISOString()
          }));
        } else {
          // Marcar como falho permanentemente
          console.log(`💀 Job ${job.id} failed permanently`);
          
          await redis.hset('jobs:all', job.id, JSON.stringify({
            ...job,
            status: 'failed',
            failedAt: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error'
          }));

          // Mover para dead letter queue
          await redis.lpush('jobs:dead-letter', JSON.stringify(job));

          stats.failed++;
        }

        stats.errors.push({
          jobId: job.id,
          type: job.type,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Log final
    console.log('✅ [CRON] Queue processing completed:', stats);

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [CRON] Fatal error processing queue:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ============================================
// JOB EXECUTORS
// ============================================

async function executeJob(job: Job): Promise<void> {
  switch (job.type) {
    case 'process-messages':
      await processMessages(job.data);
      break;
    
    case 'cleanup-old-data':
      await cleanupOldData(job.data);
      break;
    
    case 'sync-uazapi':
      await syncUAZAPI(job.data);
      break;
    
    default:
      throw new Error(`Unknown job type: ${job.type}`);
  }
}

async function processMessages(data: any): Promise<void> {
  console.log('📬 Processing pending messages:', data);

  // Buscar mensagens pendentes do Supabase
  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(data.maxMessages || 50);

  if (error) {
    throw new Error(`Failed to fetch messages: ${error.message}`);
  }

  console.log(`Found ${messages?.length || 0} pending messages`);

  // Processar cada mensagem
  for (const message of messages || []) {
    try {
      // Lógica de processamento
      // (integração com CrewAI, etc)
      
      // Atualizar status
      await supabase
        .from('messages')
        .update({ 
          status: 'processed',
          processed_at: new Date().toISOString()
        })
        .eq('id', message.id);
      
    } catch (error) {
      console.error(`Failed to process message ${message.id}:`, error);
      // Continuar com próxima mensagem
    }
  }
}

async function cleanupOldData(data: any): Promise<void> {
  console.log('🧹 Cleaning up old data:', data);

  const olderThan = new Date();
  olderThan.setDate(olderThan.getDate() - (data.olderThanDays || 30));

  for (const table of data.tables || []) {
    const { error } = await supabase
      .from(table)
      .delete()
      .lt('created_at', olderThan.toISOString());

    if (error) {
      console.error(`Failed to cleanup ${table}:`, error);
    }
  }
}

async function syncUAZAPI(data: any): Promise<void> {
  console.log('🔄 Syncing with UAZAPI:', data);
  // Implementar lógica de sincronização
}
```

---

### PASSO 4: Configurar Vercel Cron

**Arquivo**: `vercel.json` (adicionar)

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

## 🧪 TESTES

### 1. Testar Edge Function Localmente

```bash
# Instalar Supabase CLI
npm install -g supabase

# Iniciar Supabase local
supabase start

# Servir função localmente
supabase functions serve enqueue-job --env-file supabase/functions/enqueue-job/.env

# Testar com curl
curl -X POST http://localhost:54321/functions/v1/enqueue-job \
  -H "Authorization: Bearer e096742e-7b6d-4b6a-b987-41d533adbd50" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "process-messages",
    "data": {
      "maxMessages": 10
    },
    "priority": 1
  }'
```

### 2. Testar Cron Job SQL

```sql
-- Executar manualmente no Supabase SQL Editor
SELECT enqueue_job(
  'process-messages',
  jsonb_build_object(
    'maxMessages', 5,
    'test', true
  ),
  1
);

-- Ver resultado
SELECT * FROM cron_job_logs ORDER BY created_at DESC LIMIT 5;
```

### 3. Verificar Fila Redis

```typescript
// Script Node.js
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

async function checkQueue() {
  // Total de jobs por prioridade
  for (let p = 1; p <= 9; p++) {
    const count = await redis.llen(`jobs:queue:priority:${p}`);
    if (count > 0) {
      console.log(`Priority ${p}: ${count} jobs`);
    }
  }

  // Estatísticas
  const total = await redis.get('jobs:stats:total');
  console.log(`Total jobs enqueued: ${total}`);
}

checkQueue();
```

---

## 📊 MONITORAMENTO

### Dashboard SQL (Supabase)

```sql
-- Ver histórico de cron jobs
SELECT 
  job_name,
  COUNT(*) as total_runs,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors,
  MAX(created_at) as last_run
FROM cron_job_logs
GROUP BY job_name
ORDER BY last_run DESC;

-- Jobs com mais erros
SELECT 
  job_type,
  COUNT(*) as error_count,
  MAX(created_at) as last_error
FROM cron_job_logs
WHERE status = 'error'
GROUP BY job_type
ORDER BY error_count DESC;
```

---

## ✅ CHECKLIST DE DEPLOY

- [ ] SQL setup executado no Supabase
- [ ] Edge Function deployed (`supabase functions deploy enqueue-job`)
- [ ] Secrets configurados (UPSTASH_*, CRON_SECRET)
- [ ] API Route criada em `/api/cron/process-queue`
- [ ] `vercel.json` atualizado
- [ ] Deploy no Vercel
- [ ] Teste manual da Edge Function
- [ ] Teste manual do cron job SQL
- [ ] Monitorar logs por 1 dia

---

**Status**: ✅ Pronto para implementação  
**Tempo estimado**: 2-3 horas  
**Economia**: $10-30/mês + Mais confiável


