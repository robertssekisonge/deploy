const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugUsers() {
  try {
    console.log('🔍 Debugging user creation...\n');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    // Check if User table exists
    const users = await prisma.user.findMany();
    console.log(`👥 Current users: ${users.length}`);
    
    // Try to create a simple user
    console.log('🔄 Attempting to create test user...');
    const testUser = await prisma.user.create({
      data: {
        email: 'test@school.com',
        name: 'Test User',
        password: 'test123',
        role: 'admin',
        status: 'ACTIVE',
        firstTimeLogin: false
      }
    });
    
    console.log('✅ Test user created:', testUser.email);
    
  } catch (error) {
    console.error('❌ Detailed error:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugUsers();














