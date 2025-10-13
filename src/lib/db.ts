import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema-consolidated";

// Carregar variáveis de ambiente se não estiverem definidas
if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('dotenv').config({ path: '.env.local' });
  } catch {
    // Ignorar se dotenv não estiver disponível
  }
}

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL as string;

if (!connectionString) {
  throw new Error("DATABASE_URL or POSTGRES_URL environment variable is not set");
}

const client = postgres(connectionString, {
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(client, { 
  schema
});
