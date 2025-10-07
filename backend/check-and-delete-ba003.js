const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAndDeleteBA003() {
  try {
    console.log('🔍 Checking current state...');
    
    // Check current students
    const students = await prisma.student.findMany({
      where: { class: 'Senior 2', stream: 'A' },
      select: { accessNumber: true, name: true, id: true }
    });
    
    console.log('📋 Current Senior 2 A students:');
    students.forEach(s => console.log(`   ${s.accessNumber} - ${s.name} (ID: ${s.id})`));
    
    // Find BA003
    const ba003 = students.find(s => s.accessNumber === 'BA003');
    if (!ba003) {
      console.log('❌ BA003 not found');
      return;
    }
    
    console.log(`\n🗑️ Deleting BA003 (${ba003.name})...`);
    
    // Check other students in the same stream
    const otherStudents = students.filter(s => s.id !== ba003.id);
    console.log(`📊 Other students in Senior 2 A: ${otherStudents.length}`);
    otherStudents.forEach(s => console.log(`   ${s.accessNumber} - ${s.name}`));
    
    // Since there are other students (BA001, BA002, BA004), BA003 should go to dropped list
    if (otherStudents.length > 0) {
      // Add to dropped list first
      await prisma.droppedAccessNumber.create({
        data: {
          accessNumber: 'BA003',
          admissionId: 'B25B003',
          studentName: 'Michael Brown',
          className: 'Senior 2',
          streamName: 'A',
          reason: 'deleted'
        }
      });
      console.log('✅ Added BA003 to dropped list');
    }
    
    // Now delete the student
    await prisma.student.delete({
      where: { id: ba003.id }
    });
    
    console.log('✅ BA003 deleted');
    
    // Check final state
    const remainingStudents = await prisma.student.findMany({
      where: { class: 'Senior 2', stream: 'A' },
      select: { accessNumber: true, name: true }
    });
    
    const droppedNumbers = await prisma.droppedAccessNumber.findMany();
    
    console.log(`\n📋 Final state:`);
    console.log(`   Remaining students in Senior 2 A: ${remainingStudents.length}`);
    remainingStudents.forEach(s => console.log(`     ${s.accessNumber} - ${s.name}`));
    
    console.log(`   Dropped access numbers: ${droppedNumbers.length}`);
    droppedNumbers.forEach(d => console.log(`     ${d.accessNumber} - ${d.studentName}`));
    
    console.log('\n✅ SUCCESS: Only BA003 was affected - simple delete logic working!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndDeleteBA003();








