#!/usr/bin/env tsx

import { config } from 'dotenv';
import { execSync } from 'node:child_process';
import postgres from 'postgres';

// Load environment variables
config();

interface MigrationConfig {
  databaseUrl: string;
  sslMode: 'require' | 'prefer' | 'disable';
  timeout: number;
  retries: number;
}

class DatabaseMigrator {
  private config: MigrationConfig;

  constructor() {
    this.config = {
      databaseUrl: process.env.DATABASE_URL || process.env.POSTGRES_URL || '',
      sslMode: this.determineSSLMode(),
      timeout: 30000,
      retries: 3,
    };
  }

  private determineSSLMode(): 'require' | 'prefer' | 'disable' {
    const env = process.env.NODE_ENV;
    const isVercel = process.env.VERCEL === '1';
    const isProduction = env === 'production';
    
    // Em produção (Vercel), usar SSL require
    if (isVercel || isProduction) {
      return 'require';
    }
    
    // Em desenvolvimento, tentar prefer primeiro, depois disable
    return 'prefer';
  }

  private buildDatabaseUrl(sslMode: string): string {
    const baseUrl = this.config.databaseUrl;
    
    if (!baseUrl) {
      throw new Error('DATABASE_URL não encontrada');
    }

    // Se já tem parâmetros SSL, substituir
    if (baseUrl.includes('sslmode=')) {
      return baseUrl.replace(/sslmode=[^&]*/, `sslmode=${sslMode}`);
    }

    // Adicionar parâmetro SSL
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}sslmode=${sslMode}`;
  }

  private async testConnection(sslMode: string): Promise<boolean> {
    const testUrl = this.buildDatabaseUrl(sslMode);
    
    console.log(`🔍 Testando conexão com sslmode=${sslMode}...`);
    
    try {
      const sql = postgres(testUrl, {
        max: 1,
        idle_timeout: 5,
        connect_timeout: 10,
        ssl: sslMode === 'disable' ? false : { rejectUnauthorized: false },
      });

      await sql`SELECT 1 as test`;
      await sql.end();
      
      console.log(`✅ Conexão bem-sucedida com sslmode=${sslMode}`);
      return true;
    } catch (error) {
      console.log(`❌ Falha na conexão com sslmode=${sslMode}:`, 
        error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  private async findWorkingConnection(): Promise<string> {
    const sslModes: Array<'require' | 'prefer' | 'disable'> = ['prefer', 'require', 'disable'];
    
    for (const sslMode of sslModes) {
      if (await this.testConnection(sslMode)) {
        return this.buildDatabaseUrl(sslMode);
      }
    }
    
    throw new Error('Não foi possível estabelecer conexão com o banco de dados');
  }

  private async runMigration(databaseUrl: string): Promise<void> {
    console.log('🚀 Executando migration...');
    
    try {
      // Definir DATABASE_URL temporariamente
      process.env.DATABASE_URL = databaseUrl;
      
      // Executar migration
      execSync('pnpm run db:push', { 
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: databaseUrl }
      });
      
      console.log('✅ Migration executada com sucesso');
    } catch (error) {
      console.error('❌ Erro na migration:', error);
      throw error;
    }
  }

  private async verifyMigration(): Promise<void> {
    console.log('🔍 Verificando estrutura do banco...');
    
    try {
      const sql = postgres(this.config.databaseUrl, {
        ssl: { rejectUnauthorized: false }
      });

      // Verificar tabelas do Better Auth
      const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('user', 'session', 'account', 'verification', 'admin_users', 'audit_logs')
        ORDER BY table_name
      `;

      console.log('📋 Tabelas encontradas:');
      tables.forEach(table => {
        console.log(`  ✅ ${table.table_name}`);
      });

      if (tables.length < 6) {
        throw new Error('Algumas tabelas do Better Auth não foram criadas');
      }

      await sql.end();
      console.log('✅ Estrutura do banco verificada com sucesso');
    } catch (error) {
      console.error('❌ Erro na verificação:', error);
      throw error;
    }
  }

  async migrate(): Promise<void> {
    console.log('🔄 Iniciando processo de migration robusto...');
    console.log(`📊 Configuração: sslMode=${this.config.sslMode}, timeout=${this.config.timeout}ms`);
    
    try {
      // 1. Encontrar conexão funcional
      const workingUrl = await this.findWorkingConnection();
      console.log(`🔗 URL de conexão funcional encontrada`);
      
      // 2. Executar migration
      await this.runMigration(workingUrl);
      
      // 3. Verificar resultado
      await this.verifyMigration();
      
      console.log('🎉 Migration concluída com sucesso!');
      
    } catch (error) {
      console.error('💥 Falha na migration:', error);
      process.exit(1);
    }
  }
}

async function main() {
  const migrator = new DatabaseMigrator();
  await migrator.migrate();
}

main().catch((error) => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
