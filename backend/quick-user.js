const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createUser() {
  try {
    const hash = await bcrypt.hash('user123', 10);
    
    const user = await prisma.user.upsert({
      where: { email: 'admin@school.com' },
      update: { password: hash },
      create: {
        email: 'admin@school.com',
        password: hash,
        name: 'Admin User',
        role: 'ADMIN',
        status: 'ACTIVE',
        accountLocked: false,
        passwordAttempts: 0
      }
    });
    
    console.log('✅ User created:', user.email);
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

createUser(); 