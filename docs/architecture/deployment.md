# Deployment

## Estratégia de Deploy Multi-Ambiente

A estratégia de deploy foi projetada para suportar a arquitetura híbrida de autenticação WhatsApp e sistema CrewAI, com foco em confiabilidade, escalabilidade e monitoramento.

### Ambientes de Deploy

```mermaid
graph TD
    A[Developer] --> B[Local Development]
    B --> C[Feature Branch]
    C --> D[Staging Environment]
    D --> E[Production Environment]
    
    F[Hotfix Branch] --> E
    
    subgraph "Local Development"
        B1[Docker Compose]
        B2[Local Database]
        B3[Mock Services]
    end
    
    subgraph "Staging"
        D1[Vercel Preview]
        D2[Supabase Staging]
        D3[Redis Staging]
        D4[UAZ Sandbox]
    end
    
    subgraph "Production"
        E1[Vercel Production]
        E2[Supabase Production]
        E3[Redis Production]
        E4[UAZ Production]
        E5[Monitoring Stack]
    end
```

## 1. Configuração Docker

### Dockerfile Otimizado

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build CrewAI and WhatsApp Auth components
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Docker Compose para Desenvolvimento

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/falachefe_dev
      - REDIS_URL=redis://redis:6379
      - UAZ_API_URL=https://sandbox.uazapi.com
      - UAZ_API_TOKEN=${UAZ_API_TOKEN}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - postgres
      - redis
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=falachefe_dev
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/database/init.sql:/docker-entrypoint-initdb.d/init.sql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx.conf:/etc/nginx/nginx.conf
      - ./docker/ssl:/etc/nginx/ssl
    depends_on:
      - app

volumes:
  postgres_data:
  redis_data:
```

## 2. Configuração Vercel

### vercel.json

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/webhook/uaz",
      "dest": "/api/webhook/uaz",
      "methods": ["POST"]
    },
    {
      "src": "/api/auth/whatsapp/(.*)",
      "dest": "/api/auth/whatsapp/$1",
      "methods": ["GET", "POST"]
    },
    {
      "src": "/api/crewai/(.*)",
      "dest": "/api/crewai/$1",
      "methods": ["GET", "POST"]
    },
    {
      "src": "/api/admin/(.*)",
      "dest": "/api/admin/$1",
      "methods": ["GET", "POST", "PUT", "DELETE"]
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "src/app/api/webhook/uaz/route.ts": {
      "maxDuration": 30
    },
    "src/app/api/crewai/process/route.ts": {
      "maxDuration": 60
    }
  },
  "regions": ["iad1", "sfo1"],
  "crons": [
    {
      "path": "/api/cron/cleanup-sessions",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/cleanup-metrics",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### Environment Variables por Ambiente

```bash
# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db.supabase.co:5432/postgres
REDIS_URL=rediss://prod-redis.redis.com:6380
UAZ_API_URL=https://api.uazapi.com
UAZ_API_TOKEN=prod_token_here
OPENAI_API_KEY=sk-prod_key_here
SUPABASE_URL=https://prod-project.supabase.co
SUPABASE_ANON_KEY=prod_anon_key
SUPABASE_SERVICE_ROLE_KEY=prod_service_key
SENTRY_DSN=https://prod_sentry_dsn
VERCEL_URL=your-domain.vercel.app

# WhatsApp Auth Config
WHATSAPP_VERIFICATION_CODE_LENGTH=6
WHATSAPP_SESSION_EXPIRATION_HOURS=24
WHATSAPP_RATE_LIMIT_MESSAGES_PER_MINUTE=10
WHATSAPP_MAX_VERIFICATION_ATTEMPTS=3

# CrewAI Config
CREWAI_MAX_AGENTS_PER_CREW=5
CREWAI_TASK_TIMEOUT_SECONDS=30
CREWAI_MEMORY_RETENTION_DAYS=30
```

## 3. Configuração Supabase

### Database Migrations

```sql
-- scripts/database/migrations/0001_initial_setup.sql
-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Configurar RLS
ALTER DATABASE postgres SET row_security = on;

-- Criar schema para WhatsApp Auth
CREATE SCHEMA IF NOT EXISTS whatsapp_auth;

-- Configurar políticas de segurança
ALTER SCHEMA whatsapp_auth OWNER TO postgres;
GRANT USAGE ON SCHEMA whatsapp_auth TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA whatsapp_auth TO authenticated;
```

```sql
-- scripts/database/migrations/0002_whatsapp_auth_tables.sql
-- Executar no ambiente de produção via Supabase CLI
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Índices para performance
CREATE INDEX idx_whatsapp_sessions_token ON whatsapp_sessions(session_token);
CREATE INDEX idx_whatsapp_sessions_phone ON whatsapp_sessions(phone_number, company_id);
CREATE INDEX idx_whatsapp_sessions_expires ON whatsapp_sessions(expires_at);

-- RLS Policies
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions" ON whatsapp_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON whatsapp_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON whatsapp_sessions
  FOR UPDATE USING (auth.uid() = user_id);
```

## 4. Configuração Redis Cloud

### Redis Configuration

```typescript
// src/lib/config/redis-config.ts
export const RedisConfig = {
  development: {
    host: 'localhost',
    port: 6379,
    password: undefined,
    db: 0,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
  },
  staging: {
    host: process.env.REDIS_STAGING_HOST,
    port: parseInt(process.env.REDIS_STAGING_PORT || '6379'),
    password: process.env.REDIS_STAGING_PASSWORD,
    db: 0,
    tls: {},
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
  },
  production: {
    host: process.env.REDIS_PRODUCTION_HOST,
    port: parseInt(process.env.REDIS_PRODUCTION_PORT || '6379'),
    password: process.env.REDIS_PRODUCTION_PASSWORD,
    db: 0,
    tls: {},
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
  }
};

export const getRedisConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return RedisConfig[env as keyof typeof RedisConfig];
};
```

## 5. CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy Falachefe CrewAI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run type checking
        run: npm run type-check

      - name: Run unit tests
        run: npm run test:unit
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          REDIS_URL: redis://localhost:6379

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
          REDIS_URL: ${{ secrets.TEST_REDIS_URL }}

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Install Vercel CLI
        run: npm install --global vercel@latest

      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build Project Artifacts
        run: vercel build --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy Project Artifacts to Vercel
        run: vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }}

      - name: Run Database Migrations (Staging)
        run: |
          npx supabase db push --project-ref=${{ secrets.SUPABASE_STAGING_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Run E2E Tests
        run: npm run test:e2e:staging
        env:
          VERCEL_URL: ${{ steps.deploy.outputs.url }}

  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Install Vercel CLI
        run: npm install --global vercel@latest

      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build Project Artifacts
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy Project Artifacts to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Run Database Migrations (Production)
        run: |
          npx supabase db push --project-ref=${{ secrets.SUPABASE_PRODUCTION_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Run Health Checks
        run: npm run health-check:production
        env:
          VERCEL_URL: ${{ steps.deploy.outputs.url }}

      - name: Notify Deployment Success
        uses: 8398a7/action-slack@v3
        with:
          status: success
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## 6. Scripts de Deploy

### Deploy Script para Desenvolvimento

```bash
#!/bin/bash
# scripts/deploy/dev-deploy.sh

set -e

echo "🚀 Starting development deployment..."

# Build and start services
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Run database migrations
echo "🗄️ Running database migrations..."
docker-compose exec app npm run db:migrate

# Seed development data
echo "🌱 Seeding development data..."
docker-compose exec app npm run db:seed

# Run health checks
echo "🏥 Running health checks..."
docker-compose exec app npm run health-check

echo "✅ Development deployment completed!"
echo "📱 App available at: http://localhost:3000"
echo "🗄️ Database available at: localhost:5432"
echo "📊 Redis available at: localhost:6379"
```

### Deploy Script para Produção

```bash
#!/bin/bash
# scripts/deploy/prod-deploy.sh

set -e

echo "🚀 Starting production deployment..."

# Backup current database
echo "💾 Creating database backup..."
npx supabase db dump --project-ref=$SUPABASE_PRODUCTION_PROJECT_REF > backup-$(date +%Y%m%d-%H%M%S).sql

# Deploy to Vercel
echo "☁️ Deploying to Vercel..."
vercel deploy --prod --token=$VERCEL_TOKEN

# Run database migrations
echo "🗄️ Running database migrations..."
npx supabase db push --project-ref=$SUPABASE_PRODUCTION_PROJECT_REF

# Clear Redis cache
echo "🧹 Clearing Redis cache..."
redis-cli -u $REDIS_PRODUCTION_URL FLUSHDB

# Run health checks
echo "🏥 Running health checks..."
npm run health-check:production

# Notify deployment
echo "📢 Deployment completed successfully!"

# Cleanup old backups (keep last 7 days)
find . -name "backup-*.sql" -mtime +7 -delete

echo "✅ Production deployment completed!"
```

## 7. Monitoramento e Observabilidade

### Health Check Endpoint

```typescript
// src/app/api/health/route.ts
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    uaz: await checkUAZAPI(),
    openai: await checkOpenAI(),
    timestamp: new Date().toISOString()
  };

  const allHealthy = Object.values(checks).every(
    check => check === true || check.status === 'healthy'
  );

  return Response.json(checks, {
    status: allHealthy ? 200 : 503
  });
}

async function checkDatabase(): Promise<boolean> {
  try {
    await db.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

async function checkRedis(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}
```

### Cron Jobs para Limpeza

```typescript
// src/app/api/cron/cleanup-sessions/route.ts
export async function GET() {
  try {
    // Limpar sessões expiradas
    const expiredSessions = await db
      .delete(whatsappSessions)
      .where(lt(whatsappSessions.expiresAt, new Date()));

    // Limpar logs antigos
    const oldLogs = await db
      .delete(whatsappAuthLogs)
      .where(lt(whatsappAuthLogs.createdAt, 
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 dias
      ));

    return Response.json({
      status: 'success',
      expiredSessions: expiredSessions.rowCount,
      oldLogs: oldLogs.rowCount
    });
  } catch (error) {
    return Response.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
```

## 8. Configuração de Domínio e SSL

### Nginx Configuration

```nginx
# docker/nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=webhook:10m rate=5r/s;

    server {
        listen 80;
        server_name falachefe.com www.falachefe.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name falachefe.com www.falachefe.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

        # API routes with rate limiting
        location /api/webhook/ {
            limit_req zone=webhook burst=20 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /api/ {
            limit_req zone=api burst=50 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Static files
        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## 9. Rollback Strategy

### Rollback Script

```bash
#!/bin/bash
# scripts/deploy/rollback.sh

set -e

DEPLOYMENT_ID=$1

if [ -z "$DEPLOYMENT_ID" ]; then
    echo "❌ Please provide a deployment ID to rollback to"
    exit 1
fi

echo "🔄 Rolling back to deployment: $DEPLOYMENT_ID"

# Rollback Vercel deployment
vercel rollback $DEPLOYMENT_ID --token=$VERCEL_TOKEN

# Rollback database if needed
if [ "$ROLLBACK_DB" = "true" ]; then
    echo "🗄️ Rolling back database..."
    npx supabase db reset --project-ref=$SUPABASE_PRODUCTION_PROJECT_REF
fi

# Clear caches
redis-cli -u $REDIS_PRODUCTION_URL FLUSHDB

# Run health checks
npm run health-check:production

echo "✅ Rollback completed successfully!"
```

## 10. Environment-Specific Configurations

### Configuração por Ambiente

```typescript
// src/lib/config/environment.ts
export const EnvironmentConfig = {
  development: {
    apiBaseUrl: 'http://localhost:3000',
    databaseUrl: 'postgresql://postgres:password@localhost:5432/falachefe_dev',
    redisUrl: 'redis://localhost:6379',
    uazApiUrl: 'https://sandbox.uazapi.com',
    logLevel: 'debug',
    enableMetrics: false,
    enableAuditLogs: false,
  },
  staging: {
    apiBaseUrl: process.env.VERCEL_URL || 'https://staging.falachefe.com',
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    uazApiUrl: 'https://sandbox.uazapi.com',
    logLevel: 'info',
    enableMetrics: true,
    enableAuditLogs: true,
  },
  production: {
    apiBaseUrl: 'https://falachefe.com',
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    uazApiUrl: 'https://api.uazapi.com',
    logLevel: 'warn',
    enableMetrics: true,
    enableAuditLogs: true,
  }
};

export const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return EnvironmentConfig[env as keyof typeof EnvironmentConfig];
};
```

## Benefícios da Estratégia de Deploy

✅ **Multi-Ambiente**: Desenvolvimento, staging e produção isolados  
✅ **CI/CD Automatizado**: Deploy automático via GitHub Actions  
✅ **Rollback Rápido**: Estratégia de rollback em caso de problemas  
✅ **Monitoramento**: Health checks e métricas em tempo real  
✅ **Segurança**: SSL, rate limiting e headers de segurança  
✅ **Escalabilidade**: Configuração para crescimento automático  
✅ **Observabilidade**: Logs, métricas e alertas configurados  

**A estratégia de deploy está completa e pronta para implementação! Próxima seção?**
