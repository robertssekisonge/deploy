const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAndFixBA003() {
  try {
    console.log('🔍 Checking current state...');
    
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
    
    // Check if BA003 is missing from dropped list
    const ba003Dropped = allDropped.find(d => d.accessNumber === 'BA003');
    
    if (!ba003Dropped && senior2AStudents.length < 4) {
      console.log('\n❌ BA003 is missing from dropped list! Adding it now...');
      
      // Add BA003 to dropped list
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
      
      console.log('✅ BA003 added to dropped list');
      
      // Verify
      const updatedDropped = await prisma.droppedAccessNumber.findMany();
      console.log(`\n📋 Updated dropped access numbers: ${updatedDropped.length}`);
      updatedDropped.forEach(d => console.log(`   ${d.accessNumber} - ${d.studentName} (${d.className} ${d.streamName})`));
      
    } else if (ba003Dropped) {
      console.log('\n✅ BA003 is already in dropped list');
    } else {
      console.log('\n❓ BA003 might still be active - checking...');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndFixBA003();








