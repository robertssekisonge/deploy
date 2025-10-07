const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixConflict() {
  try {
    console.log('🔧 Fixing AA003 conflict - removing from dropped list...');
    
    // Check current state
    const activeStudent = await prisma.student.findFirst({
      where: { accessNumber: 'AA003' }
    });
    
    const droppedAA003 = await prisma.droppedAccessNumber.findFirst({
      where: { accessNumber: 'AA003' }
    });
    
    console.log('Current state:');
    console.log('Active student with AA003:', activeStudent ? `${activeStudent.name} (${activeStudent.class} ${activeStudent.stream})` : 'None');
    console.log('AA003 in dropped list:', droppedAA003 ? 'YES' : 'NO');
    
    if (activeStudent && droppedAA003) {
      console.log('\n❌ CONFLICT DETECTED: AA003 is both active and dropped!');
      
      // Remove AA003 from dropped list since it's actively in use
      await prisma.droppedAccessNumber.delete({
        where: { id: droppedAA003.id }
      });
      
      console.log('✅ Removed AA003 from dropped list');
    }
    
    // Check for any other conflicts
    const allDropped = await prisma.droppedAccessNumber.findMany();
    const allActive = await prisma.student.findMany({
      select: { accessNumber: true, name: true }
    });
    
    const activeAccessNumbers = new Set(allActive.map(s => s.accessNumber));
    const conflicts = allDropped.filter(dropped => activeAccessNumbers.has(dropped.accessNumber));
    
    if (conflicts.length > 0) {
      console.log(`\n🔍 Found ${conflicts.length} other conflicts:`);
      for (const conflict of conflicts) {
        console.log(`   ${conflict.accessNumber} - ${conflict.studentName}`);
        await prisma.droppedAccessNumber.delete({
          where: { id: conflict.id }
        });
      }
      console.log('✅ Removed all conflicting dropped access numbers');
    }
    
    // Show final state
    const finalDropped = await prisma.droppedAccessNumber.findMany();
    console.log(`\n📋 Final dropped access numbers (${finalDropped.length}):`);
    finalDropped.forEach(dropped => {
      console.log(`   ${dropped.accessNumber} - ${dropped.studentName} (${dropped.className} ${dropped.streamName})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixConflict();








