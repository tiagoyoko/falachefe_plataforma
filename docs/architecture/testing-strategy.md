# Testing Strategy

## Estratégia Abrangente de Testes

A estratégia de testes foi projetada para garantir qualidade, confiabilidade e robustez da arquitetura híbrida de autenticação WhatsApp e sistema CrewAI, cobrindo todos os níveis e cenários críticos.

### Pirâmide de Testes

```mermaid
graph TD
    A[E2E Tests] --> B[Integration Tests]
    B --> C[Unit Tests]
    
    subgraph "E2E Tests"
        D[WhatsApp Auth Flow]
        E[CrewAI Workflow]
        F[Multi-tenant Scenarios]
    end
    
    subgraph "Integration Tests"
        G[API Integration]
        H[Database Integration]
        I[External Services]
    end
    
    subgraph "Unit Tests"
        J[Auth Logic]
        K[CrewAI Components]
        L[Business Logic]
    end
    
    subgraph "Test Types"
        M[Functional Tests]
        N[Performance Tests]
        O[Security Tests]
        P[Load Tests]
    end
```

## 1. Testes Unitários

### Configuração Jest para CrewAI

```typescript
// jest.config.crewai.js
module.exports = {
  displayName: 'CrewAI Tests',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/lib/crewai'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/lib/crewai/**/*.ts',
    '!src/lib/crewai/**/*.d.ts',
    '!src/lib/crewai/**/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.crewai.js']
};
```

### Testes de Autenticação WhatsApp

```typescript
// src/lib/auth/__tests__/whatsapp-auth.test.ts
import { WhatsAppAuthService } from '../whatsapp-auth';
import { Redis } from 'ioredis';
import { db } from '../../database';

jest.mock('ioredis');
jest.mock('../../database');

describe('WhatsAppAuthService', () => {
  let authService: WhatsAppAuthService;
  let mockRedis: jest.Mocked<Redis>;

  beforeEach(() => {
    mockRedis = new Redis() as jest.Mocked<Redis>;
    authService = new WhatsAppAuthService(mockRedis);
  });

  describe('authenticateUser', () => {
    it('should authenticate user with valid phone number', async () => {
      // Arrange
      const phoneNumber = '+5511999999999';
      const companyId = 'company-123';
      const mockUser = {
        id: 'user-123',
        phoneNumber,
        companyId,
        name: 'Test User'
      };

      db.query.mockResolvedValueOnce({ rows: [mockUser] });

      // Act
      const result = await authService.authenticateUser(phoneNumber, companyId);

      // Assert
      expect(result.authenticated).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(result.authMethod).toBe('phone_number');
    });

    it('should generate verification code for unknown user', async () => {
      // Arrange
      const phoneNumber = '+5511888888888';
      const companyId = 'company-123';

      db.query.mockResolvedValueOnce({ rows: [] });
      mockRedis.setex.mockResolvedValueOnce('OK');

      // Act
      const result = await authService.authenticateUser(phoneNumber, companyId);

      // Assert
      expect(result.authenticated).toBe(false);
      expect(result.requiresVerification).toBe(true);
      expect(result.verificationCode).toHaveLength(6);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        `verify:${phoneNumber}:${companyId}`,
        300,
        expect.any(String)
      );
    });

    it('should handle rate limiting', async () => {
      // Arrange
      const phoneNumber = '+5511777777777';
      const companyId = 'company-123';

      mockRedis.get.mockResolvedValueOnce('5'); // Rate limit exceeded

      // Act & Assert
      await expect(
        authService.authenticateUser(phoneNumber, companyId)
      ).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('verifyCode', () => {
    it('should verify correct code', async () => {
      // Arrange
      const phoneNumber = '+5511666666666';
      const companyId = 'company-123';
      const code = '123456';

      mockRedis.get.mockResolvedValueOnce(code);

      // Act
      const result = await authService.verifyCode(phoneNumber, companyId, code);

      // Assert
      expect(result.verified).toBe(true);
      expect(result.sessionToken).toBeDefined();
    });

    it('should reject incorrect code', async () => {
      // Arrange
      const phoneNumber = '+5511555555555';
      const companyId = 'company-123';
      const code = '123456';

      mockRedis.get.mockResolvedValueOnce('654321'); // Different code

      // Act
      const result = await authService.verifyCode(phoneNumber, companyId, code);

      // Assert
      expect(result.verified).toBe(false);
    });
  });
});
```

### Testes do Sistema CrewAI

```typescript
// src/lib/crewai/__tests__/crew-orchestrator.test.ts
import { CrewOrchestrator } from '../crew-orchestrator';
import { CrewAI } from 'crewai';
import { db } from '../../database';

jest.mock('crewai');
jest.mock('../../database');

describe('CrewOrchestrator', () => {
  let orchestrator: CrewOrchestrator;
  let mockCrewAI: jest.Mocked<CrewAI>;

  beforeEach(() => {
    mockCrewAI = new CrewAI() as jest.Mocked<CrewAI>;
    orchestrator = new CrewOrchestrator(mockCrewAI);
  });

  describe('processMessage', () => {
    it('should process message through crew', async () => {
      // Arrange
      const messageData = {
        message: 'Hello, I need help with my order',
        userId: 'user-123',
        companyId: 'company-123',
        conversationId: 'conv-123'
      };

      const mockCrew = {
        kickoff: jest.fn().mockResolvedValue({
          result: 'I can help you with your order',
          agent: 'customer_service'
        })
      };

      db.query.mockResolvedValueOnce({ 
        rows: [{ id: 'crew-123', configuration: {} }] 
      });
      mockCrewAI.createCrew.mockReturnValue(mockCrew);

      // Act
      const result = await orchestrator.processMessage(messageData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.response).toBe('I can help you with your order');
      expect(result.agent).toBe('customer_service');
    });

    it('should handle crew creation failure', async () => {
      // Arrange
      const messageData = {
        message: 'Hello',
        userId: 'user-123',
        companyId: 'company-123'
      };

      db.query.mockRejectedValueOnce(new Error('Database error'));

      // Act & Assert
      await expect(orchestrator.processMessage(messageData))
        .rejects.toThrow('Database error');
    });

    it('should handle agent handoff', async () => {
      // Arrange
      const messageData = {
        message: 'I want to speak to a manager',
        userId: 'user-123',
        companyId: 'company-123'
      };

      const mockCrew = {
        kickoff: jest.fn().mockResolvedValue({
          result: 'Transferring you to a manager',
          agent: 'manager',
          handoff: true
        })
      };

      db.query.mockResolvedValueOnce({ 
        rows: [{ id: 'crew-123', configuration: {} }] 
      });
      mockCrewAI.createCrew.mockReturnValue(mockCrew);

      // Act
      const result = await orchestrator.processMessage(messageData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.handoff).toBe(true);
      expect(result.agent).toBe('manager');
    });
  });
});
```

## 2. Testes de Integração

### Configuração de Testes de Integração

```typescript
// jest.config.integration.js
module.exports = {
  displayName: 'Integration Tests',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/integration'],
  testMatch: ['**/*.integration.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.integration.js'],
  testTimeout: 30000,
  maxWorkers: 1 // Run integration tests sequentially
};
```

### Testes de API Integration

```typescript
// tests/integration/api/whatsapp-auth.integration.test.ts
import { createMocks } from 'node-mocks-http';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/whatsapp/verify/route';
import { db } from '@/lib/database';
import { redis } from '@/lib/redis';

describe('/api/auth/whatsapp/verify', () => {
  beforeEach(async () => {
    // Clean up test data
    await db.query('DELETE FROM whatsapp_sessions WHERE phone_number LIKE \'+5511%\'');
    await redis.flushdb();
  });

  afterAll(async () => {
    await db.query('DELETE FROM whatsapp_sessions WHERE phone_number LIKE \'+5511%\'');
    await redis.flushdb();
  });

  it('should verify WhatsApp authentication', async () => {
    // Arrange
    const phoneNumber = '+5511999999999';
    const companyId = 'company-123';
    const code = '123456';

    // Store verification code
    await redis.setex(`verify:${phoneNumber}:${companyId}`, 300, code);

    const request = new NextRequest('http://localhost:3000/api/auth/whatsapp/verify', {
      method: 'POST',
      body: JSON.stringify({
        phoneNumber,
        companyId,
        code
      })
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.authenticated).toBe(true);
    expect(data.sessionToken).toBeDefined();
  });

  it('should reject invalid verification code', async () => {
    // Arrange
    const phoneNumber = '+5511888888888';
    const companyId = 'company-123';
    const code = '123456';

    // Store different code
    await redis.setex(`verify:${phoneNumber}:${companyId}`, 300, '654321');

    const request = new NextRequest('http://localhost:3000/api/auth/whatsapp/verify', {
      method: 'POST',
      body: JSON.stringify({
        phoneNumber,
        companyId,
        code
      })
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data.authenticated).toBe(false);
  });
});
```

### Testes de Database Integration

```typescript
// tests/integration/database/crewai.integration.test.ts
import { db } from '@/lib/database';
import { CrewService } from '@/lib/crewai/crew-service';

describe('CrewAI Database Integration', () => {
  let crewService: CrewService;

  beforeEach(() => {
    crewService = new CrewService(db);
  });

  it('should create and retrieve crew', async () => {
    // Arrange
    const crewData = {
      name: 'Test Crew',
      companyId: 'company-123',
      configuration: {
        agents: ['customer_service', 'sales'],
        tasks: ['handle_inquiry', 'process_order']
      }
    };

    // Act
    const createdCrew = await crewService.createCrew(crewData);
    const retrievedCrew = await crewService.getCrew(createdCrew.id);

    // Assert
    expect(createdCrew.name).toBe(crewData.name);
    expect(createdCrew.companyId).toBe(crewData.companyId);
    expect(retrievedCrew).toEqual(createdCrew);
  });

  it('should handle multi-tenant isolation', async () => {
    // Arrange
    const crew1 = {
      name: 'Crew 1',
      companyId: 'company-1',
      configuration: {}
    };

    const crew2 = {
      name: 'Crew 2',
      companyId: 'company-2',
      configuration: {}
    };

    // Act
    const createdCrew1 = await crewService.createCrew(crew1);
    const createdCrew2 = await crewService.createCrew(crew2);

    const company1Crews = await crewService.getCrewsByCompany('company-1');
    const company2Crews = await crewService.getCrewsByCompany('company-2');

    // Assert
    expect(company1Crews).toHaveLength(1);
    expect(company1Crews[0].id).toBe(createdCrew1.id);
    expect(company2Crews).toHaveLength(1);
    expect(company2Crews[0].id).toBe(createdCrew2.id);
  });
});
```

## 3. Testes End-to-End

### Configuração Playwright

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Testes E2E WhatsApp Auth Flow

```typescript
// tests/e2e/whatsapp-auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('WhatsApp Authentication Flow', () => {
  test('should complete WhatsApp authentication flow', async ({ page }) => {
    // Arrange
    await page.goto('/auth/whatsapp');

    // Act - Enter phone number
    await page.fill('[data-testid="phone-input"]', '+5511999999999');
    await page.click('[data-testid="send-code-button"]');

    // Assert - Verification code form appears
    await expect(page.locator('[data-testid="verification-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="phone-display"]')).toContainText('+5511999999999');

    // Act - Enter verification code
    await page.fill('[data-testid="code-input"]', '123456');
    await page.click('[data-testid="verify-button"]');

    // Assert - Success redirect
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should handle invalid verification code', async ({ page }) => {
    // Arrange
    await page.goto('/auth/whatsapp');

    // Act
    await page.fill('[data-testid="phone-input"]', '+5511888888888');
    await page.click('[data-testid="send-code-button"]');
    await page.fill('[data-testid="code-input"]', '000000');
    await page.click('[data-testid="verify-button"]');

    // Assert
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid verification code');
  });

  test('should handle rate limiting', async ({ page }) => {
    // Arrange
    await page.goto('/auth/whatsapp');

    // Act - Multiple rapid requests
    for (let i = 0; i < 6; i++) {
      await page.fill('[data-testid="phone-input"]', '+5511777777777');
      await page.click('[data-testid="send-code-button"]');
      await page.waitForTimeout(100);
    }

    // Assert
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Rate limit exceeded');
  });
});
```

### Testes E2E CrewAI Workflow

```typescript
// tests/e2e/crewai-workflow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('CrewAI Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin user
    await page.goto('/auth/whatsapp');
    await page.fill('[data-testid="phone-input"]', '+5511999999999');
    await page.click('[data-testid="send-code-button"]');
    await page.fill('[data-testid="code-input"]', '123456');
    await page.click('[data-testid="verify-button"]');
  });

  test('should process message through CrewAI', async ({ page }) => {
    // Arrange
    await page.goto('/chat');

    // Act - Send message
    await page.fill('[data-testid="message-input"]', 'I need help with my order #12345');
    await page.click('[data-testid="send-button"]');

    // Assert - Message appears in chat
    await expect(page.locator('[data-testid="message-list"]')).toContainText('I need help with my order #12345');

    // Assert - AI response appears
    await expect(page.locator('[data-testid="ai-response"]')).toBeVisible();
    await expect(page.locator('[data-testid="agent-indicator"]')).toContainText('Customer Service Agent');
  });

  test('should handle agent handoff', async ({ page }) => {
    // Arrange
    await page.goto('/chat');

    // Act - Request manager
    await page.fill('[data-testid="message-input"]', 'I want to speak to a manager');
    await page.click('[data-testid="send-button"]');

    // Assert - Handoff occurs
    await expect(page.locator('[data-testid="agent-indicator"]')).toContainText('Manager');
    await expect(page.locator('[data-testid="handoff-notification"]')).toBeVisible();
  });

  test('should maintain conversation context', async ({ page }) => {
    // Arrange
    await page.goto('/chat');

    // Act - Multi-turn conversation
    await page.fill('[data-testid="message-input"]', 'My order is delayed');
    await page.click('[data-testid="send-button"]');
    await page.waitForSelector('[data-testid="ai-response"]');

    await page.fill('[data-testid="message-input"]', 'What is the new delivery date?');
    await page.click('[data-testid="send-button"]');

    // Assert - Context maintained
    await expect(page.locator('[data-testid="ai-response"]').last()).toContainText('order');
  });
});
```

## 4. Testes de Performance

### Configuração K6

```javascript
// tests/performance/whatsapp-auth-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.1'],     // Error rate under 10%
  },
};

export default function () {
  // Test WhatsApp auth endpoint
  const phoneNumber = `+5511${Math.floor(Math.random() * 100000000)}`;
  const companyId = 'company-123';

  let response = http.post('http://localhost:3000/api/auth/whatsapp/send-code', {
    phoneNumber,
    companyId
  });

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  sleep(1);
}
```

### Testes de Load CrewAI

```javascript
// tests/performance/crewai-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 50 },  // Ramp up
    { duration: '5m', target: 50 },  // Stay at 50 users
    { duration: '2m', target: 100 }, // Ramp to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // 95% of requests under 5s
    http_req_failed: ['rate<0.05'],    // Error rate under 5%
  },
};

export default function () {
  // Test CrewAI processing endpoint
  const message = `Test message ${Math.random()}`;
  const userId = 'user-123';
  const companyId = 'company-123';

  let response = http.post('http://localhost:3000/api/crewai/process', {
    message,
    userId,
    companyId
  });

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 5000ms': (r) => r.timings.duration < 5000,
    'has response': (r) => JSON.parse(r.body).response !== undefined,
  });

  sleep(2);
}
```

## 5. Testes de Segurança

### Configuração OWASP ZAP

```yaml
# tests/security/zap-config.yml
api:
  key: "your-zap-api-key"
  baseurl: "http://localhost:3000"

scanner:
  spider:
    maxdepth: 5
    threads: 5
  
  active:
    threads: 5
    delay: 100
  
  passive:
    enabled: true

targets:
  - "http://localhost:3000/api/auth/whatsapp"
  - "http://localhost:3000/api/crewai/process"
  - "http://localhost:3000/api/admin"

reports:
  - format: "json"
    output: "security-report.json"
  - format: "html"
    output: "security-report.html"
```

### Testes de Segurança Customizados

```typescript
// tests/security/security.test.ts
import { test, expect } from '@playwright/test';

test.describe('Security Tests', () => {
  test('should prevent SQL injection in WhatsApp auth', async ({ page }) => {
    // Arrange
    await page.goto('/auth/whatsapp');

    // Act - Attempt SQL injection
    await page.fill('[data-testid="phone-input"]', "'; DROP TABLE users; --");
    await page.click('[data-testid="send-code-button"]');

    // Assert - Should handle gracefully
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test('should enforce rate limiting', async ({ page }) => {
    // Arrange
    await page.goto('/auth/whatsapp');

    // Act - Rapid requests
    for (let i = 0; i < 10; i++) {
      await page.fill('[data-testid="phone-input"]', '+5511111111111');
      await page.click('[data-testid="send-code-button"]');
      await page.waitForTimeout(50);
    }

    // Assert
    await expect(page.locator('[data-testid="rate-limit-message"]')).toBeVisible();
  });

  test('should validate phone number format', async ({ page }) => {
    // Arrange
    await page.goto('/auth/whatsapp');

    // Act - Invalid phone numbers
    const invalidPhones = ['123', 'abc', '+999999999999999'];

    for (const phone of invalidPhones) {
      await page.fill('[data-testid="phone-input"]', phone);
      await page.click('[data-testid="send-code-button"]');
      
      // Assert
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid phone number');
    }
  });

  test('should enforce HTTPS in production', async ({ page, context }) => {
    // Arrange - Set production environment
    await context.addCookies([{
      name: 'NODE_ENV',
      value: 'production',
      domain: 'localhost',
      path: '/'
    }]);

    // Act
    await page.goto('http://localhost:3000/auth/whatsapp');

    // Assert - Should redirect to HTTPS
    expect(page.url()).toMatch(/^https:/);
  });
});
```

## 6. Testes de Acessibilidade

### Configuração Axe

```typescript
// tests/accessibility/accessibility.test.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('should not have accessibility violations on WhatsApp auth page', async ({ page }) => {
    // Arrange
    await page.goto('/auth/whatsapp');

    // Act & Assert
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Arrange
    await page.goto('/auth/whatsapp');

    // Act - Navigate with keyboard
    await page.keyboard.press('Tab');
    await page.keyboard.type('+5511999999999');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    // Assert
    await expect(page.locator('[data-testid="verification-form"]')).toBeVisible();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    // Arrange
    await page.goto('/auth/whatsapp');

    // Assert
    await expect(page.locator('[data-testid="phone-input"]')).toHaveAttribute('aria-label');
    await expect(page.locator('[data-testid="send-code-button"]')).toHaveAttribute('aria-label');
  });
});
```

## 7. CI/CD Pipeline de Testes

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
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
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
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
        run: npm ci
      
      - name: Run database migrations
        run: npm run db:migrate:test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/falachefe_test
          REDIS_URL: redis://localhost:6379
      
      - name: Run integration tests
        run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Build application
        run: npm run build
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Start application
        run: npm run start &
        env:
          NODE_ENV: production
      
      - name: Wait for application
        run: npx wait-on http://localhost:3000
      
      - name: Run performance tests
        run: k6 run tests/performance/whatsapp-auth-load.js
      
      - name: Run CrewAI performance tests
        run: k6 run tests/performance/crewai-load.js
```

## 8. Scripts de Teste

### Package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --config jest.config.js",
    "test:crewai": "jest --config jest.config.crewai.js",
    "test:integration": "jest --config jest.config.integration.js",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:security": "zap-baseline.py -t http://localhost:3000",
    "test:accessibility": "playwright test tests/accessibility/",
    "test:performance": "k6 run tests/performance/",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch",
    "test:ci": "npm run test:unit && npm run test:integration && npm run test:e2e"
  }
}
```

## Benefícios da Estratégia de Testes

✅ **Cobertura Completa**: Unit, Integration, E2E e Performance  
✅ **Qualidade Garantida**: Testes automatizados em CI/CD  
✅ **Segurança**: Testes de segurança e vulnerabilidades  
✅ **Acessibilidade**: Conformidade com padrões de acessibilidade  
✅ **Performance**: Testes de carga e stress  
✅ **Multi-tenant**: Testes de isolamento por empresa  
✅ **WhatsApp Auth**: Cobertura completa do fluxo de autenticação  
✅ **CrewAI**: Testes de orquestração e handoff de agentes  

**A estratégia de testes está completa e pronta para implementação! Próxima seção?**
