import type { Config } from "drizzle-kit";

export default {
  dialect: "postgresql",
  schema: [
    "./src/lib/schema.ts",
    "./src/lib/memory-schema.ts",
    "./src/lib/auth-schema.ts"
  ],
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL || process.env.POSTGRES_URL!,
  },
} satisfies Config;
