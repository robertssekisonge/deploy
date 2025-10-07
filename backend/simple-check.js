const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function simpleCheck() {
  try {
    console.log('🔍 Simple database check...\n');
    
    // Check if we can connect
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    // Check Users table
    const users = await prisma.user.findMany();
    console.log(`👥 Users found: ${users.length}`);
    
    if (users.length > 0) {
      users.forEach(user => {
        console.log(`  - ${user.email} (${user.role})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

simpleCheck();














