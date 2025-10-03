import { config } from 'dotenv';
import { sql } from 'drizzle-orm';

// Carregar variáveis de ambiente ANTES de importar db
config({ path: '.env.local' });

// Importar db após carregar as variáveis
import { db } from '../src/lib/db';

async function createBillingTables() {
  console.log('🚀 Criando tabelas de billing...');

  try {
    // Criar enums
    console.log('📝 Criando enums...');
    
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE "subscription_status" AS ENUM(
          'active', 
          'inactive', 
          'cancelled', 
          'past_due', 
          'unpaid', 
          'trialing',
          'paused'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE "payment_status" AS ENUM(
          'pending',
          'processing', 
          'succeeded',
          'failed',
          'cancelled',
          'refunded',
          'partially_refunded'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE "payment_method" AS ENUM(
          'credit_card',
          'debit_card',
          'pix',
          'boleto',
          'bank_transfer',
          'stripe',
          'paypal'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE "billing_cycle" AS ENUM(
          'monthly',
          'quarterly', 
          'yearly',
          'lifetime'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE "invoice_status" AS ENUM(
          'draft',
          'open',
          'paid',
          'void',
          'uncollectible'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    console.log('✅ Enums criados com sucesso');

    // Criar tabela de planos de assinatura
    console.log('📝 Criando tabela subscription_plans...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "subscription_plans" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR(100) NOT NULL,
        "slug" VARCHAR(50) UNIQUE NOT NULL,
        "description" TEXT,
        "price_monthly" DECIMAL(10,2) NOT NULL,
        "price_yearly" DECIMAL(10,2),
        "price_lifetime" DECIMAL(10,2),
        "billing_cycle" "billing_cycle" DEFAULT 'monthly',
        "trial_days" INTEGER DEFAULT 0,
        "max_agents" INTEGER DEFAULT 1,
        "max_users" INTEGER DEFAULT 10,
        "max_messages_per_month" INTEGER DEFAULT 1000,
        "max_templates" INTEGER DEFAULT 5,
        "max_storage_gb" INTEGER DEFAULT 1,
        "features" JSONB DEFAULT '{}',
        "is_active" BOOLEAN DEFAULT true,
        "is_popular" BOOLEAN DEFAULT false,
        "stripe_price_id" VARCHAR(255),
        "stripe_product_id" VARCHAR(255),
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Criar tabela de assinaturas de usuários
    console.log('📝 Criando tabela user_subscriptions...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "user_subscriptions" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" TEXT NOT NULL,
        "company_id" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
        "plan_id" UUID NOT NULL REFERENCES "subscription_plans"("id"),
        "status" "subscription_status" DEFAULT 'active',
        "start_date" TIMESTAMP DEFAULT NOW() NOT NULL,
        "end_date" TIMESTAMP,
        "trial_end_date" TIMESTAMP,
        "cancelled_at" TIMESTAMP,
        "billing_cycle" "billing_cycle" NOT NULL,
        "next_billing_date" TIMESTAMP,
        "stripe_subscription_id" VARCHAR(255),
        "stripe_customer_id" VARCHAR(255),
        "metadata" JSONB DEFAULT '{}',
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Criar tabela de pagamentos
    console.log('📝 Criando tabela payments...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payments" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "subscription_id" UUID NOT NULL REFERENCES "user_subscriptions"("id") ON DELETE CASCADE,
        "amount" DECIMAL(10,2) NOT NULL,
        "currency" VARCHAR(3) DEFAULT 'BRL',
        "status" "payment_status" DEFAULT 'pending',
        "payment_method" "payment_method" NOT NULL,
        "stripe_payment_intent_id" VARCHAR(255),
        "stripe_charge_id" VARCHAR(255),
        "paid_at" TIMESTAMP,
        "failed_at" TIMESTAMP,
        "failure_reason" TEXT,
        "metadata" JSONB DEFAULT '{}',
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Criar tabela de faturas
    console.log('📝 Criando tabela invoices...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "invoices" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "subscription_id" UUID NOT NULL REFERENCES "user_subscriptions"("id") ON DELETE CASCADE,
        "payment_id" UUID REFERENCES "payments"("id"),
        "invoice_number" VARCHAR(50) UNIQUE NOT NULL,
        "subtotal" DECIMAL(10,2) NOT NULL,
        "tax" DECIMAL(10,2) DEFAULT 0.00,
        "discount" DECIMAL(10,2) DEFAULT 0.00,
        "total" DECIMAL(10,2) NOT NULL,
        "currency" VARCHAR(3) DEFAULT 'BRL',
        "status" "invoice_status" DEFAULT 'draft',
        "issue_date" TIMESTAMP DEFAULT NOW() NOT NULL,
        "due_date" TIMESTAMP NOT NULL,
        "paid_date" TIMESTAMP,
        "stripe_invoice_id" VARCHAR(255),
        "notes" TEXT,
        "metadata" JSONB DEFAULT '{}',
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Criar tabela de limites de uso
    console.log('📝 Criando tabela usage_limits...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "usage_limits" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "plan_id" UUID NOT NULL REFERENCES "subscription_plans"("id") ON DELETE CASCADE,
        "limit_type" VARCHAR(50) NOT NULL,
        "limit_value" INTEGER NOT NULL,
        "is_hard_limit" BOOLEAN DEFAULT true,
        "reset_period" VARCHAR(20) DEFAULT 'monthly',
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
        "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Criar tabela de histórico de uso
    console.log('📝 Criando tabela usage_history...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "usage_history" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "subscription_id" UUID NOT NULL REFERENCES "user_subscriptions"("id") ON DELETE CASCADE,
        "usage_type" VARCHAR(50) NOT NULL,
        "usage_value" INTEGER NOT NULL,
        "period_start" TIMESTAMP NOT NULL,
        "period_end" TIMESTAMP NOT NULL,
        "metadata" JSONB DEFAULT '{}',
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Criar tabela de webhooks do Stripe
    console.log('📝 Criando tabela stripe_webhooks...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "stripe_webhooks" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "stripe_event_id" VARCHAR(255) UNIQUE NOT NULL,
        "event_type" VARCHAR(100) NOT NULL,
        "processed" BOOLEAN DEFAULT false,
        "processed_at" TIMESTAMP,
        "event_data" JSONB NOT NULL,
        "error_message" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Criar índices para performance
    console.log('📝 Criando índices...');
    
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_user_subscriptions_user_id" ON "user_subscriptions"("user_id")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_user_subscriptions_company_id" ON "user_subscriptions"("company_id")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_user_subscriptions_status" ON "user_subscriptions"("status")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_payments_subscription_id" ON "payments"("subscription_id")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_payments_status" ON "payments"("status")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_invoices_subscription_id" ON "invoices"("subscription_id")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_invoices_status" ON "invoices"("status")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_usage_history_subscription_id" ON "usage_history"("subscription_id")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_usage_history_period" ON "usage_history"("period_start", "period_end")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_stripe_webhooks_event_id" ON "stripe_webhooks"("stripe_event_id")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_stripe_webhooks_processed" ON "stripe_webhooks"("processed")`);

    console.log('✅ Índices criados com sucesso');

    // Inserir planos padrão
    console.log('📝 Inserindo planos padrão...');
    
    await db.execute(sql`
      INSERT INTO "subscription_plans" (
        "name", "slug", "description", "price_monthly", "price_yearly", 
        "max_agents", "max_users", "max_messages_per_month", "max_templates", "max_storage_gb",
        "features", "is_active", "is_popular"
      ) VALUES 
      (
        'Starter', 'starter', 'Plano básico para pequenas empresas', 
        29.90, 299.00,
        1, 10, 1000, 5, 1,
        '{"whatsapp_integration": true, "basic_analytics": true, "email_support": true}',
        true, false
      ),
      (
        'Professional', 'professional', 'Plano profissional para empresas em crescimento', 
        99.90, 999.00,
        5, 50, 10000, 25, 10,
        '{"whatsapp_integration": true, "advanced_analytics": true, "priority_support": true, "custom_templates": true, "api_access": true}',
        true, true
      ),
      (
        'Enterprise', 'enterprise', 'Plano empresarial com recursos avançados', 
        299.90, 2999.00,
        50, 500, 100000, 100, 100,
        '{"whatsapp_integration": true, "advanced_analytics": true, "dedicated_support": true, "custom_templates": true, "api_access": true, "white_label": true, "custom_integrations": true}',
        true, false
      )
      ON CONFLICT ("slug") DO NOTHING
    `);

    console.log('✅ Planos padrão inseridos com sucesso');

    console.log('🎉 Todas as tabelas de billing foram criadas com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao criar tabelas de billing:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createBillingTables()
    .then(() => {
      console.log('✅ Script executado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro na execução:', error);
      process.exit(1);
    });
}

export { createBillingTables };

