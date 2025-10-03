-- Financial Categories Table Migration
-- For the Financial Agent system

-- Create financial categories table
CREATE TABLE IF NOT EXISTS "financial_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"color" varchar(7), -- Hex color code
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"user_id" varchar(100), -- NULL for global categories
	"company_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_financial_categories_user" ON "financial_categories" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_financial_categories_company" ON "financial_categories" ("company_id");
CREATE INDEX IF NOT EXISTS "idx_financial_categories_active" ON "financial_categories" ("is_active");
CREATE INDEX IF NOT EXISTS "idx_financial_categories_default" ON "financial_categories" ("is_default");

-- Add foreign key constraint
ALTER TABLE "financial_categories" ADD CONSTRAINT "financial_categories_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE cascade ON UPDATE no action;

-- Insert default categories
INSERT INTO "financial_categories" ("name", "description", "color", "is_default", "is_active") VALUES
('alimentação', 'Gastos com comida e bebida', '#FF6B6B', true, true),
('transporte', 'Gastos com transporte e combustível', '#4ECDC4', true, true),
('saúde', 'Gastos com saúde e medicamentos', '#45B7D1', true, true),
('educação', 'Gastos com educação e cursos', '#96CEB4', true, true),
('lazer', 'Gastos com entretenimento e lazer', '#FFEAA7', true, true),
('serviços', 'Gastos com serviços diversos', '#DDA0DD', true, true),
('produtos', 'Gastos com produtos físicos', '#98D8C8', true, true),
('vendas', 'Receitas de vendas', '#6C5CE7', true, true),
('consultoria', 'Receitas de consultoria', '#A29BFE', true, true),
('investimentos', 'Receitas de investimentos', '#FD79A8', true, true),
('outros', 'Outras categorias', '#636E72', true, true);
