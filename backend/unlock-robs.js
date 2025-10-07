const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function unlockRobAccount() {
  try {
    console.log('🔓 Unlocking robs@school.com account...');
    await prisma.$connect();
    
    // Reset failed attempts and unlock account using correct field names
    const updatedUser = await prisma.user.update({
      where: {
        email: 'robs@school.com'
      },
      data: {
        passwordAttempts: 0,
        lockedUntil: null,
        lockReason: null
      }
    });
    
    console.log('✅ Rob Admin account unlocked successfully!');
    console.log(`Email: ${updatedUser.email}`);
    console.log('Account is now unlocked and ready for login');
    
  } catch (error) {
    console.error('❌ Error unlocking account:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

unlockRobAccount();
