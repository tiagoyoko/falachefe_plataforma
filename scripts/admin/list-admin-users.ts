import { config } from 'dotenv';
import { sql } from 'drizzle-orm';

// Carregar variáveis de ambiente ANTES de importar db
config({ path: '.env.local' });

// Importar db após carregar as variáveis
import { db } from '../src/lib/db';

async function listAdminUsers() {
  console.log('👥 Listando usuários admin do sistema...\n');

  try {
    // Buscar todos os usuários admin
    const adminUsers = await db.execute(sql`
      SELECT id, email, name, role, "isActive", "createdAt", "updatedAt"
      FROM "user" 
      WHERE role IN ('super_admin', 'admin', 'manager')
      ORDER BY "createdAt" DESC
    `);

    if (adminUsers.length === 0) {
      console.log('❌ Nenhum usuário admin encontrado no sistema.');
      return;
    }

    console.log(`✅ Encontrados ${adminUsers.length} usuário(s) admin:\n`);

    adminUsers.forEach((user, index) => {
      const roleIcon = user.role === 'super_admin' ? '👑' : 
                      user.role === 'admin' ? '🔧' : '👨‍💼';
      
      console.log(`${index + 1}. ${roleIcon} ${user.name}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🆔 ID: ${user.id}`);
      console.log(`   🎭 Role: ${user.role}`);
      console.log(`   ✅ Ativo: ${user.isActive ? 'Sim' : 'Não'}`);
      console.log(`   📅 Criado: ${new Date(user.createdAt).toLocaleString('pt-BR')}`);
      console.log(`   🔄 Atualizado: ${new Date(user.updatedAt).toLocaleString('pt-BR')}`);
      console.log('');
    });

    // Estatísticas
    const superAdmins = adminUsers.filter(u => u.role === 'super_admin').length;
    const admins = adminUsers.filter(u => u.role === 'admin').length;
    const managers = adminUsers.filter(u => u.role === 'manager').length;
    const activeAdmins = adminUsers.filter(u => u.isActive).length;

    console.log('📊 Estatísticas:');
    console.log(`   👑 Super Admins: ${superAdmins}`);
    console.log(`   🔧 Admins: ${admins}`);
    console.log(`   👨‍💼 Managers: ${managers}`);
    console.log(`   ✅ Ativos: ${activeAdmins}/${adminUsers.length}`);
    
  } catch (error) {
    console.error('❌ Erro ao listar usuários admin:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  listAdminUsers()
    .then(() => {
      console.log('✅ Script executado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro na execução:', error);
      process.exit(1);
    });
}

export { listAdminUsers };
