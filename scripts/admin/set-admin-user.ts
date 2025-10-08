import { config } from 'dotenv';
import { sql } from 'drizzle-orm';

// Carregar variáveis de ambiente ANTES de importar db
config({ path: '.env.local' });

// Importar db após carregar as variáveis
import { db } from '../src/lib/db';

async function setAdminUser() {
  const email = 'tiago@agenciavibecode.com';
  
  console.log(`🔧 Configurando usuário ${email} como admin...`);

  try {
    // Verificar se o usuário existe
    const existingUser = await db.execute(sql`
      SELECT id, email, role FROM "user" WHERE email = ${email}
    `);

    if (existingUser.length === 0) {
      console.log(`❌ Usuário ${email} não encontrado. Criando usuário admin...`);
      
      // Criar usuário admin
      await db.execute(sql`
        INSERT INTO "user" (id, email, name, role, "isActive", "createdAt", "updatedAt")
        VALUES (
          ${`admin_${Date.now()}`},
          ${email},
          ${'Tiago Admin'},
          ${'super_admin'},
          ${true},
          NOW(),
          NOW()
        )
      `);
      
      console.log(`✅ Usuário ${email} criado como super_admin`);
    } else {
      console.log(`👤 Usuário ${email} encontrado. Atualizando role para super_admin...`);
      
      // Atualizar role para super_admin
      await db.execute(sql`
        UPDATE "user" 
        SET role = ${'super_admin'}, "updatedAt" = NOW()
        WHERE email = ${email}
      `);
      
      console.log(`✅ Usuário ${email} atualizado para super_admin`);
    }

    // Verificar se foi configurado corretamente
    const updatedUser = await db.execute(sql`
      SELECT id, email, name, role, "isActive" FROM "user" WHERE email = ${email}
    `);

    if (updatedUser.length > 0) {
      const user = updatedUser[0];
      console.log(`\n📋 Dados do usuário admin:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Nome: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Ativo: ${user.isActive}`);
    }

    console.log(`\n🎉 Usuário ${email} configurado como admin com sucesso!`);
    
  } catch (error) {
    console.error('❌ Erro ao configurar usuário admin:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setAdminUser()
    .then(() => {
      console.log('✅ Script executado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro na execução:', error);
      process.exit(1);
    });
}

export { setAdminUser };
