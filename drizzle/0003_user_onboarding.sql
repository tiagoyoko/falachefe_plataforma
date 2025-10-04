CREATE TYPE "public"."company_size" AS ENUM('1-10', '11-50', '51-200', '201-1000', '1000+');

CREATE TABLE IF NOT EXISTS "user_onboarding" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(100) NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"position" varchar(255) NOT NULL,
	"company_size" "company_size" NOT NULL,
	"industry" varchar(255) NOT NULL,
	"whatsapp_phone" varchar(20) NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_onboarding_user_id_unique" UNIQUE("user_id")
);

CREATE UNIQUE INDEX "user_onboarding_user_id_unique" ON "user_onboarding" USING btree ("user_id");
