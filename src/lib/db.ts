import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import * as memorySchema from "./memory-schema";
import * as authSchema from "./auth-schema";
import * as betterAuthSchema from "./better-auth-schema";

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL as string;

if (!connectionString) {
  throw new Error("DATABASE_URL or POSTGRES_URL environment variable is not set");
}

const client = postgres(connectionString);
export const db = drizzle(client, { 
  schema: {
    ...schema,
    ...memorySchema,
    ...authSchema,
    ...betterAuthSchema,
  }
});
