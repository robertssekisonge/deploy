const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkReAdmittedStudent() {
  try {
    console.log('🔍 Checking re-admitted student issue...');
    
    // Check all students
    const allStudents = await prisma.student.findMany({
      select: {
        accessNumber: true,
        name: true,
        class: true,
        stream: true,
        status: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: [
        { class: 'asc' },
        { stream: 'asc' },
        { accessNumber: 'asc' }
      ]
    });
    
    console.log(`📊 Total students: ${allStudents.length}`);
    
    if (allStudents.length > 0) {
      console.log('\n📋 All students:');
      allStudents.forEach(s => {
        console.log(`   ${s.accessNumber} - ${s.name} (${s.class} ${s.stream}) - Status: ${s.status}`);
        console.log(`     Created: ${s.createdAt}, Updated: ${s.updatedAt}`);
      });
    } else {
      console.log('   No students found');
    }
    
    // Check dropped access numbers
    const allDropped = await prisma.droppedAccessNumber.findMany();
    console.log(`\n📋 Dropped access numbers: ${allDropped.length}`);
    allDropped.forEach(d => console.log(`   ${d.accessNumber} - ${d.studentName} (${d.className} ${d.streamName})`));
    
    // Look for AA0003 specifically
    const aa0003Student = allStudents.find(s => s.accessNumber === 'AA0003');
    const aa0003Dropped = allDropped.find(d => d.accessNumber === 'AA0003');
    
    console.log('\n🔍 AA0003 Analysis:');
    if (aa0003Student) {
      console.log(`   ✅ Found as active student: ${aa0003Student.name} - Status: ${aa0003Student.status}`);
    } else {
      console.log('   ❌ Not found as active student');
    }
    
    if (aa0003Dropped) {
      console.log(`   ✅ Found in dropped list: ${aa0003Dropped.studentName}`);
    } else {
      console.log('   ❌ Not found in dropped list');
    }
    
    // Check if there's a conflict
    if (aa0003Student && aa0003Dropped) {
      console.log('\n⚠️ CONFLICT: AA0003 exists in both active students and dropped list!');
    } else if (!aa0003Student && !aa0003Dropped) {
      console.log('\n❌ PROBLEM: AA0003 is missing from both active students and dropped list!');
    } else if (aa0003Student && aa0003Student.status !== 'active') {
      console.log(`\n❌ PROBLEM: AA0003 exists but status is "${aa0003Student.status}" instead of "active"`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkReAdmittedStudent();








