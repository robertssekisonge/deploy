const { PrismaClient } = require('./generated/prisma');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function quickReset() {
  try {
    console.log('🔧 Quick password reset for admin@sukrop.com...\n');
    
    // Just reset admin@sukrop.com to password1
    const hashedPassword = await bcrypt.hash('password1', 5);
    await prisma.user.update({
      where: { email: 'admin@sukrop.com' },
      data: { 
        password: hashedPassword,
        passwordAttempts: 0,
        accountLocked: false,
        lockedUntil: null
      }
    });
    
    console.log('✅ admin@sukrop.com password reset to: password1');
    console.log('🎯 Try logging in with: admin@sukrop.com / password1');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

quickReset(); 