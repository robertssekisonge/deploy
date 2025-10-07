const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function fixRobPassword() {
  try {
    console.log('🔧 Fixing robs@school.com password...');
    await prisma.$connect();
    
    // Hash the password properly
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update robs@school.com password with proper hash
    const updatedUser = await prisma.user.update({
      where: {
        email: 'robs@school.com'
      },
      data: {
        password: hashedPassword
      }
    });
    
    console.log('✅ Rob Admin password fixed successfully!');
    console.log(`Email: ${updatedUser.email}`);
    console.log(`New Password: ${newPassword}`);
    console.log('\nYou can now login with:');
    console.log('- Email: robs@school.com');
    console.log('- Password: admin123');
    
  } catch (error) {
    console.error('❌ Error fixing password:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixRobPassword();
