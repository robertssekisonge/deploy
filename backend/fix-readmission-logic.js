const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixReAdmissionLogic() {
  try {
    console.log('🔧 Fixing re-admission logic...');
    
    // Check current state
    const allStudents = await prisma.student.findMany();
    const allDropped = await prisma.droppedAccessNumber.findMany();
    
    console.log(`📊 Current state:`);
    console.log(`   Students: ${allStudents.length}`);
    console.log(`   Dropped access numbers: ${allDropped.length}`);
    
    if (allStudents.length > 0) {
      console.log('\n📋 All students:');
      allStudents.forEach(s => {
        console.log(`   ${s.accessNumber} - ${s.name} (${s.class} ${s.stream}) - Status: ${s.status}`);
      });
    }
    
    if (allDropped.length > 0) {
      console.log('\n📋 Dropped access numbers:');
      allDropped.forEach(d => {
        console.log(`   ${d.accessNumber} - ${d.studentName} (${d.className} ${d.streamName})`);
      });
    }
    
    // Look for the specific student mentioned in the image
    const s1aStudent2 = allStudents.find(s => s.name === 'S1A Student2' || s.accessNumber === 'AA0003');
    
    if (s1aStudent2) {
      console.log(`\n🔍 Found S1A Student2: ${s1aStudent2.accessNumber} - ${s1aStudent2.name}`);
      console.log(`   Status: ${s1aStudent2.status}`);
      console.log(`   Class: ${s1aStudent2.class} ${s1aStudent2.stream}`);
      
      if (s1aStudent2.status === 're-admitted') {
        console.log('\n❌ PROBLEM: Student is marked as re-admitted but should have a new active record');
        console.log('   The re-admission process should create a NEW student record');
        console.log('   The old record should remain for reference');
        
        // Check if there's already a new active student with similar details
        const possibleNewStudent = allStudents.find(s => 
          s.id !== s1aStudent2.id && 
          s.name === s1aStudent2.name && 
          s.status === 'active'
        );
        
        if (possibleNewStudent) {
          console.log(`\n✅ Found new active student: ${possibleNewStudent.accessNumber} - ${possibleNewStudent.name}`);
        } else {
          console.log('\n❌ No new active student found - re-admission process failed');
        }
      }
    } else {
      console.log('\n❌ S1A Student2 not found in database');
      console.log('   This suggests the frontend is showing cached/stale data');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixReAdmissionLogic();








