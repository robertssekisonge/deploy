const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPasswords() {
  try {
    const users = await prisma.user.findMany({
      select: {
        email: true,
        password: true,
        name: true
      }
    });
    
    console.log('User passwords:');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.name}): ${user.password}`);
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

checkPasswords(); 