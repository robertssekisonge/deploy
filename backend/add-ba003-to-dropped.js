const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addBA003ToDropped() {
  try {
    console.log('🔧 Adding BA003 to dropped access numbers...');
    
    // Check if BA003 is already in dropped list
    const existingBA003 = await prisma.droppedAccessNumber.findFirst({
      where: { accessNumber: 'BA003' }
    });
    
    if (existingBA003) {
      console.log('✅ BA003 is already in dropped list');
      console.log(`   ${existingBA003.accessNumber} - ${existingBA003.studentName}`);
      return;
    }
    
    // Add BA003 to dropped list
    const droppedBA003 = await prisma.droppedAccessNumber.create({
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
    console.log(`   ${droppedBA003.accessNumber} - ${droppedBA003.studentName} (${droppedBA003.className} ${droppedBA003.streamName})`);
    
    // Show all dropped access numbers
    const allDropped = await prisma.droppedAccessNumber.findMany();
    console.log(`\n📋 All dropped access numbers: ${allDropped.length}`);
    allDropped.forEach(d => console.log(`   ${d.accessNumber} - ${d.studentName} (${d.className} ${d.streamName})`));
    
    // Show remaining Senior 2 A students
    const senior2AStudents = await prisma.student.findMany({
      where: { class: 'Senior 2', stream: 'A' },
      select: { accessNumber: true, name: true }
    });
    
    console.log(`\n📋 Remaining Senior 2 A students: ${senior2AStudents.length}`);
    senior2AStudents.forEach(s => console.log(`   ${s.accessNumber} - ${s.name}`));
    
    console.log('\n✅ SUCCESS: BA003 is now in dropped list and available for reuse!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addBA003ToDropped();








