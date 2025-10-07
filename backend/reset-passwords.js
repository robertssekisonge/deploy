const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function resetPasswords() {
  try {
    console.log('🔧 Resetting passwords to working credentials...\n');
    
    // Reset admin@school.com to a simple password
    const adminPassword = await bcrypt.hash('password1', 5);
    await prisma.user.update({
      where: { email: 'admin@school.com' },
      data: { 
        password: adminPassword,
        passwordAttempts: 0,
        accountLocked: false,
        lockedUntil: null
      }
    });
    console.log('✅ admin@school.com password reset to: password1');
    
    // Reset testlock@test.com to a simple password
    const testPassword = await bcrypt.hash('password1', 5);
    await prisma.user.update({
      where: { email: 'testlock@test.com' },
      data: { 
        password: testPassword,
        passwordAttempts: 0,
        accountLocked: false,
        lockedUntil: null
      }
    });
    console.log('✅ testlock@test.com password reset to: password1');
    
    // Reset robertssekisonge1147@gmail.com to a simple password
    const robertPassword = await bcrypt.hash('password1', 5);
    await prisma.user.update({
      where: { email: 'robertssekisonge1147@gmail.com' },
      data: { 
        password: robertPassword,
        passwordAttempts: 0,
        accountLocked: false,
        lockedUntil: null
      }
    });
    console.log('✅ robertssekisonge1147@gmail.com password reset to: password1');
    
    // Reset reset@school.com to a simple password
    const resetPassword = await bcrypt.hash('password1', 5);
    await prisma.user.update({
      where: { email: 'reset@school.com' },
      data: { 
        password: resetPassword,
        passwordAttempts: 0,
        accountLocked: false,
        lockedUntil: null
      }
    });
    console.log('✅ reset@school.com password reset to: password1');
    
    // Reset admin@sukrop.com to password1
    const sukropPassword = await bcrypt.hash('password1', 5);
    await prisma.user.update({
      where: { email: 'admin@sukrop.com' },
      data: { 
        password: sukropPassword,
        passwordAttempts: 0,
        accountLocked: false,
        lockedUntil: null
      }
    });
    console.log('✅ admin@sukrop.com password reset to: password1');
    
    // Reset ella@school.com
    const ellaPassword = await bcrypt.hash('password1', 5);
    await prisma.user.update({
      where: { email: 'ella@school.com' },
      data: { 
        password: ellaPassword,
        passwordAttempts: 0,
        accountLocked: false,
        lockedUntil: null
      }
    });
    console.log('✅ ella@school.com password reset to: password1');
    
    // Reset hub@school.com
    const hubPassword = await bcrypt.hash('password1', 5);
    await prisma.user.update({
      where: { email: 'hub@school.com' },
      data: { 
        password: hubPassword,
        passwordAttempts: 0,
        accountLocked: false,
        lockedUntil: null
      }
    });
    console.log('✅ hub@school.com password reset to: password1');
    
    // Reset robs@school.com
    const robsPassword = await bcrypt.hash('password1', 5);
    await prisma.user.update({
      where: { email: 'robs@school.com' },
      data: { 
        password: robsPassword,
        passwordAttempts: 0,
        accountLocked: false,
        lockedUntil: null
      }
    });
    console.log('✅ robs@school.com password reset to: password1');
    
    // Reset locked@school.com
    const lockedPassword = await bcrypt.hash('password1', 5);
    await prisma.user.update({
      where: { email: 'locked@school.com' },
      data: { 
        password: lockedPassword,
        passwordAttempts: 0,
        accountLocked: false,
        lockedUntil: null
      }
    });
    console.log('✅ locked@school.com password reset to: password1');
    
    // Reset katija@school.com
    const katijaPassword = await bcrypt.hash('password1', 5);
    await prisma.user.update({
      where: { email: 'katija@school.com' },
      data: { 
        password: katijaPassword,
        passwordAttempts: 0,
        accountLocked: false,
        lockedUntil: null
      }
    });
    console.log('✅ katija@school.com password reset to: password1');
    
    console.log('\n🎯 **UPDATED WORKING CREDENTIALS:**');
    console.log('=====================================');
    console.log('1. admin@school.com | password1 | ADMIN');
    console.log('2. testlock@test.com | password1 | USER');
    console.log('3. robertssekisonge1147@gmail.com | password1 | USER');
    console.log('4. reset@school.com | password1 | PARENT');
    console.log('5. admin@sukrop.com | password1 | ADMIN');
    console.log('6. ella@school.com | password1 | ADMIN');
    console.log('7. hub@school.com | password1 | ADMIN');
    console.log('8. robs@school.com | password1 | ADMIN');
    console.log('9. locked@school.com | password1 | USER');
    console.log('10. katija@school.com | password1 | SPONSOR');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPasswords(); 