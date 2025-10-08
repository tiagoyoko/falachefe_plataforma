#!/usr/bin/env tsx

import { config } from 'dotenv';
import { eq, sql } from 'drizzle-orm';
import { db } from '../src/lib/db';
import { userOnboarding } from '../src/lib/schema-consolidated';

// Carregar variáveis de ambiente
config({ path: '.env.local' });

async function queryUserData() {
  try {
    console.log('🔍 Consultando dados do usuário tiagoyoko@gmail.com...');
    
    // Buscar usuário por email na tabela 'user' (que existe)
    const user = await db.execute(sql`
      SELECT * FROM "user" 
      WHERE email = 'tiagoyoko@gmail.com' 
      LIMIT 1
    `);
    
    if (user.length === 0) {
      console.log('❌ Usuário não encontrado na tabela user');
      return;
    }
    
    console.log('✅ Usuário encontrado na tabela user:');
    console.log('📋 Dados do usuário:');
    console.log(JSON.stringify(user[0], null, 2));
    
    // Buscar dados de onboarding usando o ID do usuário
    const onboarding = await db
      .select()
      .from(userOnboarding)
      .where(eq(userOnboarding.userId, user[0].id))
      .limit(1);
    
    if (onboarding.length === 0) {
      console.log('⚠️  Dados de onboarding não encontrados para este usuário');
    } else {
      console.log('✅ Dados de onboarding encontrados:');
      console.log('📋 Dados de onboarding:');
      console.log(JSON.stringify(onboarding[0], null, 2));
    }
    
    // Resumo dos dados
    console.log('\n📊 RESUMO DOS DADOS:');
    console.log('👤 Nome:', user[0].name);
    console.log('📧 Email:', user[0].email);
    console.log('🔑 ID:', user[0].id);
    console.log('👑 Role:', user[0].role);
    console.log('✅ Ativo:', user[0].isActive);
    console.log('📅 Criado em:', user[0].createdAt);
    console.log('🔄 Atualizado em:', user[0].updatedAt);
    
    if (onboarding.length > 0) {
      console.log('\n📝 DADOS DE ONBOARDING:');
      console.log('👤 Nome completo:', `${onboarding[0].firstName} ${onboarding[0].lastName}`);
      console.log('🏢 Empresa:', onboarding[0].companyName);
      console.log('💼 Cargo:', onboarding[0].position);
      console.log('📏 Tamanho da empresa:', onboarding[0].companySize);
      console.log('🏭 Indústria:', onboarding[0].industry);
      console.log('📱 WhatsApp:', onboarding[0].whatsappPhone);
      console.log('✅ Onboarding completo:', onboarding[0].isCompleted);
      console.log('📅 Completado em:', onboarding[0].completedAt);
    }
    
  } catch (error) {
    console.error('❌ Erro na consulta:', error);
    process.exit(1);
  }
}

queryUserData();
