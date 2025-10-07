const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    
    // Hash the new password
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the admin user
    const updatedUser = await prisma.user.update({
      where: {
        email: 'superadmin@school.com'
      },
      data: {
        password: hashedPassword
      }
    });
    
    console.log('✅ Admin password reset successfully!');
    console.log(`Email: ${updatedUser.email}`);
    console.log(`New Password: ${newPassword}`);
    console.log('\nYou can now login with:');
    console.log('- Email: superadmin@school.com');
    console.log('- Password: admin123');
    
  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword(); 
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    
    // Hash the new password
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the admin user
    const updatedUser = await prisma.user.update({
      where: {
        email: 'superadmin@school.com'
      },
      data: {
        password: hashedPassword
      }
    });
    
    console.log('✅ Admin password reset successfully!');
    console.log(`Email: ${updatedUser.email}`);
    console.log(`New Password: ${newPassword}`);
    console.log('\nYou can now login with:');
    console.log('- Email: superadmin@school.com');
    console.log('- Password: admin123');
    
  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword(); 