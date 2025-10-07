const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPersistence() {
  try {
    console.log('🔍 Testing data persistence...');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected!');
    
    // Check existing users
    const users = await prisma.user.findMany();
    console.log(`👥 Found ${users.length} users in database`);
    
    // Test creating a new user
    const testUser = await prisma.user.create({
      data: {
        email: 'test@school.com',
        name: 'Test User',
        password: 'hashedpassword',
        role: 'USER',
        status: 'ACTIVE'
      }
    });
    console.log('✅ Created test user:', testUser.email);
    
    // Verify it was saved
    const savedUser = await prisma.user.findUnique({
      where: { email: 'test@school.com' }
    });
    console.log('✅ User persisted:', savedUser ? 'YES' : 'NO');
    
    // Clean up test user
    await prisma.user.delete({
      where: { email: 'test@school.com' }
    });
    console.log('✅ Test user cleaned up');
    
    console.log('🎉 Data persistence test PASSED!');
    
  } catch (error) {
    console.error('❌ Persistence test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPersistence(); 