const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabaseState() {
  try {
    console.log('🔍 Checking database state...');
    
    // Check students table
    const students = await prisma.student.findMany();
    console.log(`📊 Students table: ${students.length} records`);
    
    if (students.length > 0) {
      console.log('📋 Students:');
      students.forEach(s => {
        console.log(`   ${s.accessNumber} - ${s.name} (${s.class} ${s.stream}) - Status: ${s.status}`);
      });
    }
    
    // Check dropped access numbers table
    const dropped = await prisma.droppedAccessNumber.findMany();
    console.log(`📊 Dropped access numbers table: ${dropped.length} records`);
    
    if (dropped.length > 0) {
      console.log('📋 Dropped access numbers:');
      dropped.forEach(d => {
        console.log(`   ${d.accessNumber} - ${d.studentName} (${d.className} ${d.streamName})`);
      });
    }
    
    // Check if tables exist and are accessible
    console.log('\n🔍 Table accessibility check:');
    try {
      const studentCount = await prisma.student.count();
      console.log(`   ✅ Students table accessible - ${studentCount} records`);
    } catch (error) {
      console.log(`   ❌ Students table error: ${error.message}`);
    }
    
    try {
      const droppedCount = await prisma.droppedAccessNumber.count();
      console.log(`   ✅ Dropped access numbers table accessible - ${droppedCount} records`);
    } catch (error) {
      console.log(`   ❌ Dropped access numbers table error: ${error.message}`);
    }
    
    if (students.length === 0 && dropped.length === 0) {
      console.log('\n📝 Database is completely empty - ready for fresh data');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseState();








