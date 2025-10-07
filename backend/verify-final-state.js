const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyFinalState() {
  try {
    console.log('🔍 Verifying final state after BA003 deletion...');
    
    // Check all students
    const allStudents = await prisma.student.findMany({
      select: {
        accessNumber: true,
        name: true,
        class: true,
        stream: true
      },
      orderBy: [
        { class: 'asc' },
        { stream: 'asc' },
        { accessNumber: 'asc' }
      ]
    });
    
    console.log(`📊 Total students: ${allStudents.length}`);
    
    // Check Senior 2 A specifically
    const senior2AStudents = allStudents.filter(s => s.class === 'Senior 2' && s.stream === 'A');
    console.log(`\n📋 Senior 2 A students: ${senior2AStudents.length}`);
    senior2AStudents.forEach(s => console.log(`   ${s.accessNumber} - ${s.name}`));
    
    // Check dropped access numbers
    const allDropped = await prisma.droppedAccessNumber.findMany();
    console.log(`\n📋 Dropped access numbers: ${allDropped.length}`);
    allDropped.forEach(d => console.log(`   ${d.accessNumber} - ${d.studentName} (${d.className} ${d.streamName})`));
    
    // Verify the logic
    console.log('\n🔍 Verification:');
    console.log(`   Expected: BA003 should be in dropped list ✅`);
    console.log(`   Expected: BA001, BA002, BA004 should remain as active students ✅`);
    console.log(`   Expected: Only 1 dropped access number (BA003) ✅`);
    
    const ba003Dropped = allDropped.find(d => d.accessNumber === 'BA003');
    const hasCorrectStudents = senior2AStudents.length === 3 && 
                              senior2AStudents.some(s => s.accessNumber === 'BA001') &&
                              senior2AStudents.some(s => s.accessNumber === 'BA002') &&
                              senior2AStudents.some(s => s.accessNumber === 'BA004');
    
    if (ba003Dropped && hasCorrectStudents && allDropped.length === 1) {
      console.log('\n✅ SUCCESS: Simple delete logic working perfectly!');
      console.log('   - Only BA003 was deleted');
      console.log('   - BA003 is in dropped list for reuse');
      console.log('   - Other students (BA001, BA002, BA004) remain unaffected');
    } else {
      console.log('\n❌ FAILED: Logic not working as expected');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyFinalState();








