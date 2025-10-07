const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listUsers() {
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    
    console.log('\n=== ALL USERS IN DATABASE ===\n');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    if (users.length === 0) {
      console.log('❌ No users found in database!');
      console.log('\nYou need to seed the database with users.');
      console.log('Run: npm run seed');
    } else {
      console.log(`✅ Found ${users.length} user(s):\n`);
      
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email})`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
        console.log('');
      });
      
      console.log('\n=== LOGIN SUGGESTIONS ===');
      console.log('Try logging in with any of these emails:');
      users.forEach(user => {
        console.log(`- ${user.email}`);
      });
      
      console.log('\n=== DEFAULT PASSWORDS ===');
      console.log('If these are seeded users, try these passwords:');
      console.log('- admin123');
      console.log('- password123');
      console.log('- Admin@123');
      console.log('- hub h@11 (for hub@school.com)');
    }
    
  } catch (error) {
    console.error('❌ Error connecting to database:', error.message);
    console.log('\nMake sure:');
    console.log('1. Database file exists');
    console.log('2. Run: npm run seed');
  } finally {
    await prisma.$disconnect();
  }
}

listUsers(); 

const prisma = new PrismaClient();

async function listUsers() {
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    
    console.log('\n=== ALL USERS IN DATABASE ===\n');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    if (users.length === 0) {
      console.log('❌ No users found in database!');
      console.log('\nYou need to seed the database with users.');
      console.log('Run: npm run seed');
    } else {
      console.log(`✅ Found ${users.length} user(s):\n`);
      
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email})`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
        console.log('');
      });
      
      console.log('\n=== LOGIN SUGGESTIONS ===');
      console.log('Try logging in with any of these emails:');
      users.forEach(user => {
        console.log(`- ${user.email}`);
      });
      
      console.log('\n=== DEFAULT PASSWORDS ===');
      console.log('If these are seeded users, try these passwords:');
      console.log('- admin123');
      console.log('- password123');
      console.log('- Admin@123');
      console.log('- hub h@11 (for hub@school.com)');
    }
    
  } catch (error) {
    console.error('❌ Error connecting to database:', error.message);
    console.log('\nMake sure:');
    console.log('1. Database file exists');
    console.log('2. Run: npm run seed');
  } finally {
    await prisma.$disconnect();
  }
}

listUsers(); 