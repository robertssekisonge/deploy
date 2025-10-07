const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createUsers() {
  try {
    console.log('🔧 Creating users in PostgreSQL "sms" database...\n');
    
    // Create robs@school.com admin
    const robsPassword = await bcrypt.hash('admin123', 10);
    const robs = await prisma.user.create({
      data: {
        email: 'robs@school.com',
        name: 'Rob Admin',
        password: robsPassword,
        role: 'admin',
        status: 'ACTIVE',
        firstTimeLogin: false
      }
    });
    console.log('✅ Created robs@school.com admin user');
    
    // Create hub@school.com admin
    const hubPassword = await bcrypt.hash('admin123', 10);
    const hub = await prisma.user.create({
      data: {
        email: 'hub@school.com',
        name: 'Hub Admin',
        password: hubPassword,
        role: 'admin',
        status: 'ACTIVE',
        firstTimeLogin: false
      }
    });
    console.log('✅ Created hub@school.com admin user');
    
    // Create superadmin
    const superPassword = await bcrypt.hash('admin123', 10);
    const superadmin = await prisma.user.create({
      data: {
        email: 'superadmin@school.com',
        name: 'Super Admin',
        password: superPassword,
        role: 'superuser',
        status: 'ACTIVE',
        firstTimeLogin: false
      }
    });
    console.log('✅ Created superadmin@school.com superuser');
    
    console.log('\n🎉 All users created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('- robs@school.com / admin123');
    console.log('- hub@school.com / admin123');
    console.log('- superadmin@school.com / admin123');
    
  } catch (error) {
    console.error('❌ Error creating users:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createUsers();














