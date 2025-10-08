import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const filesToFix = [
  'src/app/api/admin/metrics/subscriptions/route.ts',
  'src/app/api/admin/plans/route.ts',
  'src/app/api/admin/reports/subscriptions/route.ts',
  'src/app/api/admin/users/[userId]/notify/route.ts',
  'src/app/api/admin/users/[userId]/route.ts',
  'src/app/api/admin/users/route.ts'
];

const replacements = [
  {
    pattern: /const fullUser = await getFullUser\(session\.user\);/g,
    replacement: `const fullUser = await getFullUser(session.user);
    if (!fullUser) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }`
  },
  {
    pattern: /if \(!session\?\.user\)/g,
    replacement: `if (!session?.user)`
  },
  {
    pattern: /session\.user/g,
    replacement: `session.user`
  }
];

filesToFix.forEach(filePath => {
  try {
    const fullPath = join(process.cwd(), filePath);
    let content = readFileSync(fullPath, 'utf8');
    
    // Aplicar substituições
    replacements.forEach(({ pattern, replacement }) => {
      content = content.replace(pattern, replacement);
    });
    
    writeFileSync(fullPath, content);
    console.log(`✅ Fixed: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error);
  }
});

console.log('🎉 Remaining error fixes applied!');
