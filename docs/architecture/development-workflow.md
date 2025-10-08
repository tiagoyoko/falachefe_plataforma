# Development Workflow

## Fluxo de Desenvolvimento Completo

O fluxo de desenvolvimento foi projetado para garantir produtividade, qualidade e colaboração eficiente na arquitetura híbrida de autenticação WhatsApp e sistema CrewAI, seguindo as melhores práticas de DevOps e desenvolvimento ágil.

### Fluxo de Desenvolvimento

```mermaid
graph TD
    A[Feature Request] --> B[Planning]
    B --> C[Development]
    C --> D[Testing]
    D --> E[Code Review]
    E --> F[Deployment]
    F --> G[Monitoring]
    
    subgraph "Development Environment"
        H[Local Setup]
        I[Feature Branch]
        J[Hot Reload]
        K[Debug Tools]
    end
    
    subgraph "Testing Pipeline"
        L[Unit Tests]
        M[Integration Tests]
        N[E2E Tests]
        O[Security Tests]
    end
    
    subgraph "Deployment Pipeline"
        P[Staging]
        Q[Production]
        R[Rollback]
        S[Health Checks]
    end
    
    subgraph "Monitoring & Feedback"
        T[Performance Metrics]
        U[Error Tracking]
        V[User Feedback]
        W[Analytics]
    end
```

## 1. Configuração do Ambiente de Desenvolvimento

### Setup Inicial

```bash
# scripts/setup-dev.sh
#!/bin/bash

echo "🚀 Setting up Falachefe CrewAI Development Environment..."

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

echo "✅ pnpm version: $(pnpm -v)"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Setup environment variables
echo "🔧 Setting up environment variables..."
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "📝 Please update .env.local with your configuration"
fi

# Setup database
echo "🗄️ Setting up database..."
pnpm run db:setup:dev

# Setup Redis
echo "🔴 Setting up Redis..."
pnpm run redis:setup:dev

# Run initial migrations
echo "🔄 Running database migrations..."
pnpm run db:migrate:dev

# Seed development data
echo "🌱 Seeding development data..."
pnpm run db:seed:dev

# Setup pre-commit hooks
echo "🪝 Setting up pre-commit hooks..."
pnpm run husky:install

echo "🎉 Development environment setup complete!"
echo "📖 Run 'pnpm run dev' to start the development server"
```

### Configuração Docker para Desenvolvimento

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: falachefe-postgres-dev
    environment:
      POSTGRES_DB: falachefe_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
      - ./scripts/database/init-dev.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: falachefe-redis-dev
    ports:
      - "6379:6379"
    volumes:
      - redis_dev_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  jaeger:
    image: jaegertracing/all-in-one:latest
    container_name: falachefe-jaeger-dev
    ports:
      - "16686:16686"
      - "14268:14268"
    environment:
      - COLLECTOR_OTLP_ENABLED=true

  prometheus:
    image: prom/prometheus:latest
    container_name: falachefe-prometheus-dev
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus-dev.yml:/etc/prometheus/prometheus.yml
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'

volumes:
  postgres_dev_data:
  redis_dev_data:
```

### Scripts de Desenvolvimento

```json
// package.json - Scripts de desenvolvimento
{
  "scripts": {
    "dev": "next dev",
    "dev:debug": "NODE_OPTIONS='--inspect' next dev",
    "dev:docker": "docker-compose -f docker-compose.dev.yml up -d && pnpm run dev",
    "dev:clean": "pnpm run db:clean:dev && pnpm run redis:clean:dev && pnpm run dev",
    
    "db:setup:dev": "pnpm run db:create:dev && pnpm run db:migrate:dev && pnpm run db:seed:dev",
    "db:create:dev": "createdb falachefe_dev || true",
    "db:migrate:dev": "drizzle-kit migrate",
    "db:seed:dev": "tsx scripts/database/seed-dev.ts",
    "db:clean:dev": "dropdb falachefe_dev && pnpm run db:create:dev",
    "db:reset:dev": "pnpm run db:clean:dev && pnpm run db:migrate:dev && pnpm run db:seed:dev",
    
    "redis:setup:dev": "redis-server --daemonize yes || true",
    "redis:clean:dev": "redis-cli flushdb",
    
    "test:dev": "jest --watch",
    "test:dev:crewai": "jest --config jest.config.crewai.js --watch",
    "test:dev:integration": "jest --config jest.config.integration.js --watch",
    
    "lint:dev": "eslint . --ext .ts,.tsx --fix",
    "typecheck:dev": "tsc --noEmit --incremental",
    "format:dev": "prettier --write .",
    
    "storybook:dev": "storybook dev -p 6006",
    "storybook:build": "storybook build"
  }
}
```

## 2. Git Workflow e Branching Strategy

### Git Flow Configuration

```bash
# .gitflow-config
[gitflow "branch"]
    master = main
    develop = develop
    feature = feature/
    release = release/
    hotfix = hotfix/
    support = support/
    versiontag = v

[gitflow "prefix"]
    feature = feature/
    release = release/
    hotfix = hotfix/
    support = support/
    versiontag = v
```

### Branching Strategy

```mermaid
graph TD
    A[main] --> B[develop]
    B --> C[feature/whatsapp-auth]
    B --> D[feature/crewai-integration]
    B --> E[feature/admin-panel]
    B --> F[release/v1.0.0]
    A --> G[hotfix/critical-bug]
    
    C --> H[PR to develop]
    D --> I[PR to develop]
    E --> J[PR to develop]
    F --> K[PR to main]
    G --> L[PR to main]
    
    subgraph "Feature Development"
        M[Create Feature Branch]
        N[Develop Feature]
        O[Write Tests]
        P[Create PR]
        Q[Code Review]
        R[Merge to Develop]
    end
    
    subgraph "Release Process"
        S[Create Release Branch]
        T[Final Testing]
        U[Deploy to Staging]
        V[Deploy to Production]
        W[Tag Release]
    end
```

### Pre-commit Hooks

```javascript
// .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run linting
echo "🔍 Running ESLint..."
pnpm run lint:dev

# Run type checking
echo "🔍 Running TypeScript check..."
pnpm run typecheck:dev

# Run formatting
echo "🎨 Running Prettier..."
pnpm run format:dev

# Run unit tests for changed files
echo "🧪 Running unit tests..."
pnpm run test:unit:changed

# Check for sensitive data
echo "🔒 Checking for sensitive data..."
pnpm run security:check

echo "✅ Pre-commit checks passed!"
```

## 3. Code Quality e Standards

### ESLint Configuration

```javascript
// eslint.config.js
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends(
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "prettier"
  ),
  {
    rules: {
      // TypeScript specific rules
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-non-null-assertion": "warn",
      
      // React specific rules
      "react-hooks/exhaustive-deps": "warn",
      "react/no-unescaped-entities": "off",
      "react/display-name": "off",
      
      // General rules
      "no-console": "warn",
      "no-debugger": "error",
      "prefer-const": "error",
      "no-var": "error",
      
      // Import rules
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          "newlines-between": "always",
        },
      ],
      
      // CrewAI specific rules
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../../*"],
              message: "Use absolute imports instead of relative imports",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
    },
  },
];

export default eslintConfig;
```

### Prettier Configuration

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "quoteProps": "as-needed",
  "jsxSingleQuote": true,
  "proseWrap": "preserve"
}
```

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/app/*": ["./src/app/*"],
      "@/types/*": ["./src/types/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/stores/*": ["./src/stores/*"],
      "@/services/*": ["./src/services/*"],
      "@/agents/*": ["./src/agents/*"]
    },
    "forceConsistentCasingInFileNames": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": ["node_modules", ".next", "dist", "build"]
}
```

## 4. Development Tools

### VSCode Configuration

```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "files.eol": "\n",
  "files.insertFinalNewline": true,
  "files.trimTrailingWhitespace": true,
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.next": true,
    "**/build": true,
    "**/coverage": true
  },
  "files.exclude": {
    "**/.git": true,
    "**/.DS_Store": true,
    "**/node_modules": true,
    "**/.next": true,
    "**/dist": true,
    "**/build": true
  },
  "jest.jestCommandLine": "pnpm test",
  "jest.autoRun": {
    "watch": true,
    "onSave": "test-file"
  }
}
```

### VSCode Extensions

```json
// .vscode/extensions.json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-vscode.vscode-docker",
    "ms-azuretools.vscode-docker",
    "ms-vscode.vscode-github-pullrequest",
    "github.vscode-pull-request-github",
    "ms-vscode.vscode-jest",
    "firsttris.vscode-jest-runner",
    "ms-playwright.playwright",
    "ms-vscode.vscode-jest",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### Debug Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    },
    {
      "name": "Next.js: debug full stack",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev"],
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Debug Jest Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "name": "Debug CrewAI Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--config", "jest.config.crewai.js", "--runInBand"],
      "console": "integratedTerminal"
    }
  ]
}
```

## 5. CI/CD Pipeline

### GitHub Actions - Development

```yaml
# .github/workflows/development.yml
name: Development Pipeline

on:
  push:
    branches: [develop]
  pull_request:
    branches: [develop]

jobs:
  quality-checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Lint code
        run: pnpm run lint:dev
      
      - name: Type check
        run: pnpm run typecheck:dev
      
      - name: Format check
        run: pnpm run format:dev --check
      
      - name: Security audit
        run: pnpm audit --audit-level moderate

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run unit tests
        run: pnpm run test:unit
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: falachefe_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run database migrations
        run: pnpm run db:migrate:test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/falachefe_test
          REDIS_URL: redis://localhost:6379
      
      - name: Run integration tests
        run: pnpm run test:integration

  build:
    runs-on: ubuntu-latest
    needs: [quality-checks, unit-tests, integration-tests]
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build application
        run: pnpm run build
        env:
          NEXT_PUBLIC_APP_URL: https://dev.falachefe.com
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-files
          path: .next/
```

### GitHub Actions - Staging

```yaml
# .github/workflows/staging.yml
name: Staging Deployment

on:
  push:
    branches: [main]

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build application
        run: pnpm run build
        env:
          NEXT_PUBLIC_APP_URL: https://staging.falachefe.com
      
      - name: Deploy to Vercel (Staging)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./
      
      - name: Run E2E tests against staging
        run: pnpm run test:e2e:staging
        env:
          BASE_URL: https://staging.falachefe.com
      
      - name: Health check
        run: |
          curl -f https://staging.falachefe.com/api/health || exit 1
```

## 6. Monitoring de Desenvolvimento

### Development Metrics

```typescript
// src/lib/monitoring/dev-metrics.ts
export class DevMetrics {
  private static metrics = {
    buildTime: 0,
    testTime: 0,
    deployTime: 0,
    errorCount: 0,
    warningCount: 0
  };

  static recordBuildTime(startTime: number) {
    this.metrics.buildTime = Date.now() - startTime;
    console.log(`🏗️ Build completed in ${this.metrics.buildTime}ms`);
  }

  static recordTestTime(startTime: number) {
    this.metrics.testTime = Date.now() - startTime;
    console.log(`🧪 Tests completed in ${this.metrics.testTime}ms`);
  }

  static recordDeployTime(startTime: number) {
    this.metrics.deployTime = Date.now() - startTime;
    console.log(`🚀 Deploy completed in ${this.metrics.deployTime}ms`);
  }

  static recordError(error: Error) {
    this.metrics.errorCount++;
    console.error(`❌ Error: ${error.message}`);
  }

  static recordWarning(warning: string) {
    this.metrics.warningCount++;
    console.warn(`⚠️ Warning: ${warning}`);
  }

  static getMetrics() {
    return { ...this.metrics };
  }

  static reset() {
    this.metrics = {
      buildTime: 0,
      testTime: 0,
      deployTime: 0,
      errorCount: 0,
      warningCount: 0
    };
  }
}
```

### Development Dashboard

```typescript
// src/app/dev/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { DevMetrics } from '@/lib/monitoring/dev-metrics';

export default function DevDashboard() {
  const [metrics, setMetrics] = useState(DevMetrics.getMetrics());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(DevMetrics.getMetrics());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Development Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Build Time</h3>
          <p className="text-2xl font-bold text-blue-600">
            {metrics.buildTime}ms
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Test Time</h3>
          <p className="text-2xl font-bold text-green-600">
            {metrics.testTime}ms
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Errors</h3>
          <p className="text-2xl font-bold text-red-600">
            {metrics.errorCount}
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Warnings</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {metrics.warningCount}
          </p>
        </div>
      </div>
    </div>
  );
}
```

## 7. Documentação de Desenvolvimento

### README de Desenvolvimento

```markdown
# Falachefe CrewAI - Guia de Desenvolvimento

# 🚀 Quick Start

```bash