const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDeleteAA001() {
  try {
    console.log('🧪 Testing delete of AA001...');
    
    // Find AA001
    const student = await prisma.student.findFirst({
      where: { accessNumber: 'AA001' }
    });
    
    if (!student) {
      console.log('❌ AA001 not found');
      return;
    }
    
    console.log(`📋 Found student: ${student.name} (${student.accessNumber})`);
    console.log(`   Class: ${student.class}, Stream: ${student.stream}`);
    
    // Check other students in the same stream
    const otherStudents = await prisma.student.findMany({
      where: {
        class: student.class,
        stream: student.stream,
        id: { not: student.id }
      }
    });
    
    console.log(`📊 Other students in ${student.class} ${student.stream}: ${otherStudents.length}`);
    otherStudents.forEach(s => console.log(`   ${s.accessNumber} - ${s.name}`));
    
    // Delete the student
    console.log('\n🗑️ Deleting AA001...');
    await prisma.student.delete({
      where: { id: student.id }
    });
    
    console.log('✅ AA001 deleted');
    
    // Check if AA001 was added to dropped list
    const droppedAA001 = await prisma.droppedAccessNumber.findFirst({
      where: { accessNumber: 'AA001' }
    });
    
    if (droppedAA001) {
      console.log('✅ AA001 was added to dropped list (correct - not last in stream)');
      console.log(`   Dropped: ${droppedAA001.accessNumber} - ${droppedAA001.studentName}`);
    } else {
      console.log('✅ AA001 went back to main pool (correct - last in stream)');
    }
    
    // Show final state
    const remainingStudents = await prisma.student.findMany({
      where: { class: 'Senior 1', stream: 'A' },
      select: { accessNumber: true, name: true }
    });
    
    console.log(`\n📋 Remaining students in Senior 1 A: ${remainingStudents.length}`);
    remainingStudents.forEach(s => console.log(`   ${s.accessNumber} - ${s.name}`));
    
    const allDropped = await prisma.droppedAccessNumber.findMany();
    console.log(`\n📋 Dropped access numbers: ${allDropped.length}`);
    allDropped.forEach(d => console.log(`   ${d.accessNumber} - ${d.studentName}`));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDeleteAA001();








