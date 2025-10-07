const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAA0003Dropped() {
  try {
    console.log('🔍 Checking where AA0003 should be...');
    
    // Check all students
    const allStudents = await prisma.student.findMany({
      select: {
        accessNumber: true,
        name: true,
        class: true,
        stream: true,
        status: true
      }
    });
    
    // Check dropped access numbers
    const allDropped = await prisma.droppedAccessNumber.findMany();
    
    console.log(`📊 Current state:`);
    console.log(`   Students: ${allStudents.length}`);
    console.log(`   Dropped access numbers: ${allDropped.length}`);
    
    // Look for AA0003
    const aa0003Student = allStudents.find(s => s.accessNumber === 'AA0003');
    const aa0003Dropped = allDropped.find(d => d.accessNumber === 'AA0003');
    
    console.log('\n🔍 AA0003 Analysis:');
    if (aa0003Student) {
      console.log(`   ✅ Found as student: ${aa0003Student.name} - Status: ${aa0003Student.status}`);
    } else {
      console.log('   ❌ Not found as student');
    }
    
    if (aa0003Dropped) {
      console.log(`   ✅ Found in dropped list: ${aa0003Dropped.studentName}`);
    } else {
      console.log('   ❌ NOT found in dropped list - THIS IS THE PROBLEM!');
    }
    
    // Check if AA0003 should be in dropped list
    if (aa0003Student && aa0003Student.status === 're-admitted' && !aa0003Dropped) {
      console.log('\n❌ PROBLEM: AA0003 is re-admitted but NOT in dropped list!');
      console.log('   When a student is re-admitted, their old access number should go to dropped list');
      
      // Add AA0003 to dropped list
      console.log('\n🔧 Adding AA0003 to dropped list...');
      await prisma.droppedAccessNumber.create({
        data: {
          accessNumber: 'AA0003',
          admissionId: 'A25A03',
          studentName: 'S1A Student2',
          className: 'Senior 1',
          streamName: 'A',
          reason: 're-admitted'
        }
      });
      
      console.log('✅ AA0003 added to dropped list');
      
      // Verify
      const updatedDropped = await prisma.droppedAccessNumber.findMany();
      console.log(`\n📋 Updated dropped access numbers: ${updatedDropped.length}`);
      updatedDropped.forEach(d => console.log(`   ${d.accessNumber} - ${d.studentName} (${d.className} ${d.streamName})`));
      
    } else if (aa0003Dropped) {
      console.log('\n✅ AA0003 is correctly in dropped list');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAA0003Dropped();








