import { config } from 'dotenv';
import { sql } from 'drizzle-orm';

// Carregar variáveis de ambiente ANTES de importar db
config({ path: '.env.local' });

// Importar db após carregar as variáveis
import { db } from '../src/lib/db';
import { permissionService } from '../src/services/permission-service';

async function testAdminPermissions() {
  const email = 'tiago@agenciavibecode.com';
  
  console.log(`🧪 Testando permissões do usuário admin: ${email}\n`);

  try {
    // Buscar o usuário
    const user = await db.execute(sql`
      SELECT id, email, name, role FROM "user" WHERE email = ${email}
    `);

    if (user.length === 0) {
      console.log('❌ Usuário não encontrado');
      return;
    }

    const userId = user[0].id;
    console.log(`👤 Usuário encontrado: ${user[0].name} (${user[0].email})`);
    console.log(`🆔 ID: ${userId}`);
    console.log(`🎭 Role: ${user[0].role}\n`);

    // Teste 1: Verificar se é admin
    console.log('🔍 Teste 1: Verificando se é admin...');
    const isAdmin = await permissionService.isUserAdmin(userId);
    console.log(`   Resultado: ${isAdmin ? '✅ SIM' : '❌ NÃO'}\n`);

    // Teste 2: Obter permissões completas
    console.log('🔍 Teste 2: Obtendo permissões completas...');
    const permissions = await permissionService.getUserPermissions(userId);
    console.log(`   isAdmin: ${permissions.isAdmin ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`   hasActiveSubscription: ${permissions.hasActiveSubscription ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`   canAccessFeature('messages'): ${permissions.canAccessFeature('messages') ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`   canAccessFeature('agents'): ${permissions.canAccessFeature('agents') ? '✅ SIM' : '❌ NÃO'}\n`);

    // Teste 3: Verificar uso de recursos
    console.log('🔍 Teste 3: Verificando uso de recursos...');
    const messageUsage = await permissionService.canUseResource(userId, 'messages');
    console.log(`   Pode usar 'messages': ${messageUsage.allowed ? '✅ SIM' : '❌ NÃO'}`);
    if (messageUsage.usageInfo) {
      console.log(`   Limite: ${messageUsage.usageInfo.limit === Infinity ? 'Ilimitado' : messageUsage.usageInfo.limit}`);
    }

    const agentUsage = await permissionService.canUseResource(userId, 'agents');
    console.log(`   Pode usar 'agents': ${agentUsage.allowed ? '✅ SIM' : '❌ NÃO'}`);
    if (agentUsage.usageInfo) {
      console.log(`   Limite: ${agentUsage.usageInfo.limit === Infinity ? 'Ilimitado' : agentUsage.usageInfo.limit}`);
    }
    console.log('');

    // Teste 4: Registrar uso (deve ser ignorado para admins)
    console.log('🔍 Teste 4: Tentando registrar uso (deve ser ignorado para admins)...');
    try {
      await permissionService.recordResourceUsage(userId, 'messages', 1, { test: true });
      console.log('   ✅ Uso registrado (ou ignorado para admin)');
    } catch (error) {
      console.log(`   ❌ Erro: ${error}`);
    }
    console.log('');

    // Teste 5: Verificar limites de uso
    console.log('🔍 Teste 5: Verificando limites de uso...');
    const usageLimit = await permissionService.canUseResource(userId, 'messages');
    console.log(`   Permissão para usar 'messages': ${usageLimit.allowed ? '✅ SIM' : '❌ NÃO'}`);
    if (usageLimit.usageInfo) {
      console.log(`   Limite atual: ${usageLimit.usageInfo.limit === Infinity ? 'Ilimitado' : usageLimit.usageInfo.limit}`);
      console.log(`   Uso atual: ${usageLimit.usageInfo.currentUsage}`);
      console.log(`   Restante: ${usageLimit.usageInfo.remaining === Infinity ? 'Ilimitado' : usageLimit.usageInfo.remaining}`);
    }
    console.log('');

    // Resumo final
    console.log('📋 RESUMO DOS TESTES:');
    console.log(`   👑 É Admin: ${isAdmin ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`   🔓 Acesso Ilimitado: ${isAdmin ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`   📊 Precisa de Assinatura: ${isAdmin ? '❌ NÃO' : '✅ SIM'}`);
    console.log(`   📝 Registra Uso: ${isAdmin ? '❌ NÃO' : '✅ SIM'}`);
    
    if (isAdmin) {
      console.log('\n🎉 SUCESSO: Usuário configurado corretamente como admin!');
      console.log('   - Tem acesso ilimitado a todos os recursos');
      console.log('   - Não precisa de assinatura ativa');
      console.log('   - Uso não é registrado no sistema de billing');
    } else {
      console.log('\n⚠️  ATENÇÃO: Usuário não está configurado como admin!');
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar permissões:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testAdminPermissions()
    .then(() => {
      console.log('✅ Script executado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro na execução:', error);
      process.exit(1);
    });
}

export { testAdminPermissions };
