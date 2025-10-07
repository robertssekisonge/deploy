const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCurrentUsers() {
  try {
    console.log('🔍 Checking current users in database...\n');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true
      }
    });
    
    console.log(`👥 Total users found: ${users.length}\n`);
    
    if (users.length > 0) {
      console.log('📋 User details:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Role: "${user.role}", Status: ${user.status}`);
      });
      
      // Count by role
      const roleCounts = {};
      users.forEach(user => {
        roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
      });
      
      console.log('\n📊 Role distribution:');
      Object.entries(roleCounts).forEach(([role, count]) => {
        console.log(`   ${role}: ${count} users`);
      });
      
      // Check for teachers specifically
      const teachers = users.filter(u => 
        u.role === 'TEACHER' || 
        u.role === 'SUPER_TEACHER' || 
        u.role === 'USER' ||
        u.role === 'teacher' ||
        u.role === 'super_teacher'
      );
      
      console.log(`\n👨‍🏫 Users that could be teachers: ${teachers.length}`);
      teachers.forEach(teacher => {
        console.log(`   - ${teacher.name} (${teacher.email}) - Role: "${teacher.role}"`);
      });
      
    } else {
      console.log('❌ No users found in database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentUsers();

