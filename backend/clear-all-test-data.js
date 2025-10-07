const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearAllTestData() {
  try {
    console.log('🗑️ Clearing all test data...');
    
    // Check current state
    const allStudents = await prisma.student.findMany();
    const allDropped = await prisma.droppedAccessNumber.findMany();
    
    console.log(`📊 Current state:`);
    console.log(`   Students: ${allStudents.length}`);
    console.log(`   Dropped access numbers: ${allDropped.length}`);
    
    if (allStudents.length > 0) {
      console.log('\n📋 Current students:');
      allStudents.forEach(s => console.log(`   ${s.accessNumber} - ${s.name} (${s.class} ${s.stream})`));
    }
    
    if (allDropped.length > 0) {
      console.log('\n📋 Current dropped access numbers:');
      allDropped.forEach(d => console.log(`   ${d.accessNumber} - ${d.studentName} (${d.className} ${d.streamName})`));
    }
    
    // Delete all students
    console.log('\n🗑️ Deleting all students...');
    const deletedStudents = await prisma.student.deleteMany();
    console.log(`✅ Deleted ${deletedStudents.count} students`);
    
    // Delete all dropped access numbers
    console.log('🗑️ Deleting all dropped access numbers...');
    const deletedDropped = await prisma.droppedAccessNumber.deleteMany();
    console.log(`✅ Deleted ${deletedDropped.count} dropped access numbers`);
    
    // Verify everything is cleared
    const remainingStudents = await prisma.student.findMany();
    const remainingDropped = await prisma.droppedAccessNumber.findMany();
    
    console.log('\n🔍 Verification:');
    console.log(`   Remaining students: ${remainingStudents.length}`);
    console.log(`   Remaining dropped access numbers: ${remainingDropped.length}`);
    
    if (remainingStudents.length === 0 && remainingDropped.length === 0) {
      console.log('\n✅ SUCCESS: All test data cleared!');
      console.log('   - All students deleted');
      console.log('   - All dropped access numbers cleared');
      console.log('   - System is ready for your data');
    } else {
      console.log('\n❌ FAILED: Some data still remains');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllTestData();








