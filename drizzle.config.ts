import type { Config } from "drizzle-kit";

export default {
  dialect: "postgresql",
  schema: [
    "./src/lib/schema.ts",
    "./src/lib/memory-schema.ts",
    "./src/lib/auth-schema.ts",
    "./src/lib/better-auth-schema.ts" // Adicionar schema do Better Auth
  ],
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL || process.env.POSTGRES_URL!,
    ssl: { rejectUnauthorized: false }, // Para desenvolvimento com certificados self-signed
  },
} satisfies Config;
