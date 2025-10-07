const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDeleteByClassStream() {
  try {
    console.log('🧪 Testing delete by class/stream functionality...');
    
    // First, check current state
    const allStudents = await prisma.student.findMany({
      select: {
        id: true,
        name: true,
        accessNumber: true,
        class: true,
        stream: true
      }
    });
    
    console.log(`📊 Current students: ${allStudents.length}`);
    
    // Check dropped access numbers
    const allDropped = await prisma.droppedAccessNumber.findMany();
    console.log(`📋 Current dropped access numbers: ${allDropped.length}`);
    allDropped.forEach(d => console.log(`   ${d.accessNumber} - ${d.studentName} (${d.className} ${d.streamName})`));
    
    // Test deleting Senior 1 A
    console.log('\n🗑️ Testing delete of Senior 1 A...');
    
    const senior1AStudents = allStudents.filter(s => s.class === 'Senior 1' && s.stream === 'A');
    console.log(`📊 Students in Senior 1 A: ${senior1AStudents.length}`);
    senior1AStudents.forEach(s => console.log(`   ${s.accessNumber} - ${s.name}`));
    
    // Simulate the API call
    const studentsToDelete = await prisma.student.findMany({
      where: {
        class: 'Senior 1',
        stream: 'A'
      },
      select: {
        id: true,
        accessNumber: true,
        name: true
      }
    });
    
    console.log(`📊 Found ${studentsToDelete.length} students to delete`);
    
    // Delete all students in Senior 1 A
    await prisma.student.deleteMany({
      where: {
        class: 'Senior 1',
        stream: 'A'
      }
    });
    
    // Also clear all dropped access numbers for Senior 1 A
    const deletedDropped = await prisma.droppedAccessNumber.deleteMany({
      where: {
        className: 'Senior 1',
        streamName: 'A'
      }
    });
    
    console.log(`✅ Deleted ${studentsToDelete.length} students and ${deletedDropped.count} dropped access numbers`);
    
    // Check final state
    const remainingStudents = await prisma.student.findMany({
      where: { class: 'Senior 1', stream: 'A' }
    });
    
    const remainingDropped = await prisma.droppedAccessNumber.findMany({
      where: { className: 'Senior 1', streamName: 'A' }
    });
    
    console.log(`\n📋 Final state:`);
    console.log(`   Students in Senior 1 A: ${remainingStudents.length}`);
    console.log(`   Dropped access numbers for Senior 1 A: ${remainingDropped.length}`);
    
    if (remainingStudents.length === 0 && remainingDropped.length === 0) {
      console.log('✅ SUCCESS: All students and dropped access numbers cleared for Senior 1 A');
    } else {
      console.log('❌ FAILED: Some data remains');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDeleteByClassStream();








