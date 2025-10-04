import type { Config } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL!;

export default {
  dialect: "postgresql",
  schema: ["./src/lib/schema-consolidated.ts"],
  out: "./drizzle",
  dbCredentials: {
    url: connectionString,
  },
  verbose: true,
  strict: true,
} satisfies Config;
