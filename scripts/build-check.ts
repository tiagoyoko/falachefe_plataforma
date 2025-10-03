#!/usr/bin/env tsx

import { config } from 'dotenv';
import { execSync } from 'node:child_process';
import postgres from 'postgres';

// Load environment variables
config();

async function checkDatabaseConnection(): Promise<boolean> {
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!databaseUrl) {
    console.log('No database URL found, skipping migration');
    return false;
  }

  try {
    console.log('Checking database connection...');
    const sql = postgres(databaseUrl, {
      max: 1,
      idle_timeout: 5,
      connect_timeout: 10,
      ssl: { rejectUnauthorized: false }, // Para desenvolvimento com certificados self-signed
    });

    // Simple query to test connection
    await sql`SELECT 1`;
    await sql.end();

    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.log('Database connection failed, skipping migration:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function main() {
  const hasConnection = await checkDatabaseConnection();

  if (hasConnection) {
    const shouldSkipMigration =
      process.env.SKIP_BUILD_DB_MIGRATE === 'true' ||
      process.env.VERCEL === '1' ||
      process.env.NODE_ENV === 'production';

    if (shouldSkipMigration) {
      console.log('Skipping database migration in build environment');
      return;
    }

    console.log('Running database migration...');
    execSync('pnpm run db:migrate', { stdio: 'inherit' });
  } else {
    console.log('Skipping database migration');
  }
}

main().catch((error) => {
  console.error('Build check failed:', error);
  process.exit(1);
});
