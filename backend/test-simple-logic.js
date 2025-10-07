const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSimpleLogic() {
  try {
    console.log('🧪 Testing simple delete/flag logic...');
    
    // First, clear any existing dropped access numbers
    await prisma.droppedAccessNumber.deleteMany();
    console.log('✅ Cleared all dropped access numbers');
    
    // Get current students
    const students = await prisma.student.findMany({
      select: {
        id: true,
        name: true,
        accessNumber: true,
        class: true,
        stream: true,
        status: true
      },
      orderBy: [
        { class: 'asc' },
        { stream: 'asc' },
        { accessNumber: 'asc' }
      ]
    });
    
    console.log(`\n📊 Current students (${students.length}):`);
    students.forEach(student => {
      console.log(`   ${student.accessNumber} - ${student.name} (${student.class} ${student.stream}) - ${student.status}`);
    });
    
    // Test 1: Delete a student who is NOT the last in their stream
    console.log('\n🧪 Test 1: Delete AA001 (should go to dropped list)');
    const studentToDelete = students.find(s => s.accessNumber === 'AA001');
    
    if (studentToDelete) {
      // Check how many other students are in the same stream
      const otherStudentsInStream = students.filter(s => 
        s.class === studentToDelete.class && 
        s.stream === studentToDelete.stream && 
        s.id !== studentToDelete.id
      );
      
      console.log(`   Other students in ${studentToDelete.class} ${studentToDelete.stream}: ${otherStudentsInStream.length}`);
      otherStudentsInStream.forEach(s => console.log(`     ${s.accessNumber} - ${s.name}`));
      
      if (otherStudentsInStream.length > 0) {
        console.log('   ✅ Expected: AA001 should go to dropped list (not last in stream)');
      } else {
        console.log('   ✅ Expected: AA001 should go back to main pool (last in stream)');
      }
    }
    
    // Test 2: Delete a student who IS the last in their stream
    console.log('\n🧪 Test 2: Check if any student is last in their stream');
    const streamCounts = {};
    students.forEach(student => {
      const key = `${student.class}-${student.stream}`;
      streamCounts[key] = (streamCounts[key] || 0) + 1;
    });
    
    Object.entries(streamCounts).forEach(([stream, count]) => {
      if (count === 1) {
        const lastStudent = students.find(s => `${s.class}-${s.stream}` === stream);
        console.log(`   ${stream}: Only ${lastStudent.accessNumber} - ${lastStudent.name}`);
        console.log(`   ✅ Expected: ${lastStudent.accessNumber} should go back to main pool (last in stream)`);
      }
    });
    
    console.log('\n📋 Stream counts:');
    Object.entries(streamCounts).forEach(([stream, count]) => {
      console.log(`   ${stream}: ${count} students`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSimpleLogic();








