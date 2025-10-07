const { PrismaClient } = require('./generated/prisma');

const prisma = new PrismaClient();

async function simpleReset() {
  try {
    console.log('🔧 Simple password reset for admin@sukrop.com...\n');
    
    // Direct password reset without bcrypt
    await prisma.user.update({
      where: { email: 'admin@sukrop.com' },
      data: { 
        password: 'password',
        passwordAttempts: 0,
        accountLocked: false,
        lockedUntil: null
      }
    });
    
    console.log('✅ admin@sukrop.com password reset to: password');
    console.log('🎯 Try logging in with: admin@sukrop.com / password');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simpleReset(); 