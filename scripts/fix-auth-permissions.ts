import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const filesToFix = [
  'src/app/api/admin/users/[userId]/notify/route.ts',
  'src/app/api/admin/plans/route.ts',
  'src/app/api/admin/reports/subscriptions/route.ts',
  'src/app/api/admin/metrics/subscriptions/route.ts',
  'src/app/api/admin/users/[userId]/route.ts'
];

const importStatement = `import { getFullUser, isManagerOrAbove, isAnalystOrAbove, isSuperAdmin } from "@/lib/auth-utils";`;

const replacements = [
  {
    pattern: /if \(!session\?\.user \|\| !\['super_admin', 'manager'\]\.includes\(session\.user\.role\)\)/g,
    replacement: `const fullUser = await getFullUser(session.user);
    if (!fullUser || !isManagerOrAbove(fullUser.role))`
  },
  {
    pattern: /if \(!session\?\.user \|\| !\['super_admin', 'manager', 'analyst'\]\.includes\(session\.user\.role\)\)/g,
    replacement: `const fullUser = await getFullUser(session.user);
    if (!fullUser || !isAnalystOrAbove(fullUser.role))`
  },
  {
    pattern: /if \(!session\?\.user \|\| session\.user\.role !== 'super_admin'\)/g,
    replacement: `const fullUser = await getFullUser(session.user);
    if (!fullUser || !isSuperAdmin(fullUser.role))`
  }
];

filesToFix.forEach(filePath => {
  try {
    const fullPath = join(process.cwd(), filePath);
    let content = readFileSync(fullPath, 'utf8');
    
    // Adicionar import se não existir
    if (!content.includes('@/lib/auth-utils')) {
      const importIndex = content.indexOf('import {');
      if (importIndex !== -1) {
        const nextLineIndex = content.indexOf('\n', importIndex);
        content = content.slice(0, nextLineIndex) + '\n' + importStatement + content.slice(nextLineIndex);
      }
    }
    
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

console.log('🎉 All auth permission fixes applied!');
