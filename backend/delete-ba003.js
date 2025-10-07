const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteBA003() {
  try {
    console.log('🗑️ Deleting BA003 (Michael Brown)...');
    
    // Find BA003
    const student = await prisma.student.findFirst({
      where: { accessNumber: 'BA003' }
    });
    
    if (!student) {
      console.log('❌ BA003 not found');
      return;
    }
    
    console.log(`📋 Found student: ${student.name} (${student.accessNumber})`);
    console.log(`   Class: ${student.class}, Stream: ${student.stream}`);
    
    // Check other students in the same stream
    const otherStudentsInStream = await prisma.student.findMany({
      where: {
        class: student.class,
        stream: student.stream,
        id: { not: student.id }
      }
    });
    
    console.log(`📊 Other students in ${student.class} ${student.stream}: ${otherStudentsInStream.length}`);
    otherStudentsInStream.forEach(s => console.log(`   ${s.accessNumber} - ${s.name}`));
    
    // Delete the student
    console.log('\n🗑️ Deleting BA003...');
    await prisma.student.delete({
      where: { id: student.id }
    });
    
    console.log('✅ BA003 deleted');
    
    // Check if BA003 was added to dropped list
    const droppedBA003 = await prisma.droppedAccessNumber.findFirst({
      where: { accessNumber: 'BA003' }
    });
    
    if (droppedBA003) {
      console.log('✅ BA003 was added to dropped list (correct - not last in stream)');
      console.log(`   Dropped: ${droppedBA003.accessNumber} - ${droppedBA003.studentName}`);
    } else {
      console.log('❌ BA003 was NOT added to dropped list (incorrect - should be there)');
    }
    
    // Show final state
    const remainingStudents = await prisma.student.findMany({
      where: { class: 'Senior 2', stream: 'A' },
      select: { accessNumber: true, name: true }
    });
    
    console.log(`\n📋 Remaining students in Senior 2 A: ${remainingStudents.length}`);
    remainingStudents.forEach(s => console.log(`   ${s.accessNumber} - ${s.name}`));
    
    const allDropped = await prisma.droppedAccessNumber.findMany();
    console.log(`\n📋 Dropped access numbers: ${allDropped.length}`);
    allDropped.forEach(d => console.log(`   ${d.accessNumber} - ${d.studentName} (${d.className} ${d.streamName})`));
    
    // Verify the logic
    console.log('\n🔍 Verification:');
    console.log(`   Expected: BA003 should be in dropped list (not last in stream)`);
    console.log(`   Expected: BA001, BA002, BA004 should remain as active students`);
    console.log(`   Expected: Only 1 dropped access number (BA003)`);
    
    if (droppedBA003 && remainingStudents.length === 3 && allDropped.length === 1) {
      console.log('✅ SUCCESS: Only BA003 was affected - simple delete logic working!');
    } else {
      console.log('❌ FAILED: Logic not working as expected');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteBA003();








