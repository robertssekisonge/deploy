const { PrismaClient } = require('./generated/prisma');

const prisma = new PrismaClient();

async function addTestData() {
  try {
    // Add a test user
    const user = await prisma.user.create({
      data: {
        name: "John Doe",
        email: "john.doe@school.com"
      }
    });
    
    console.log('✅ Test user created:', user);
    
    // Get all users
    const allUsers = await prisma.user.findMany();
    console.log('📋 All users in database:', allUsers);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestData(); 