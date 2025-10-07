const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixStreams() {
  try {
    console.log('🔧 Fixing streams - S1-S4 use A,B,C; S5-S6 use Arts/Sciences...');
    
    // Get all students
    const students = await prisma.student.findMany({
      select: {
        id: true,
        name: true,
        accessNumber: true,
        admissionId: true,
        class: true,
        stream: true
      },
      orderBy: [
        { class: 'asc' },
        { stream: 'asc' },
        { accessNumber: 'asc' }
      ]
    });
    
    console.log(`\n📊 Found ${students.length} students to update`);
    
    // Stream mapping for Senior 1-4: A, B, C
    const streamMapS1S4 = {
      'A': 'A',
      'S': 'B'  // Convert Sciences to B for S1-S4
    };
    
    // Stream mapping for Senior 5-6: Arts, Sciences
    const streamMapS5S6 = {
      'A': 'Arts',
      'S': 'Sciences'
    };
    
    console.log('\n🔄 Updating streams...');
    
    for (const student of students) {
      let newStream = student.stream;
      
      // Check if it's Senior 1-4
      if (['Senior 1', 'Senior 2', 'Senior 3', 'Senior 4'].includes(student.class)) {
        if (student.stream === 'S') {
          newStream = 'B';  // Convert Sciences to B
        } else if (student.stream === 'A') {
          newStream = 'A';  // Keep Arts as A
        }
      }
      // Check if it's Senior 5-6
      else if (['Senior 5', 'Senior 6'].includes(student.class)) {
        if (student.stream === 'A') {
          newStream = 'Arts';
        } else if (student.stream === 'S') {
          newStream = 'Sciences';
        }
      }
      
      // Only update if stream changed
      if (newStream !== student.stream) {
        await prisma.student.update({
          where: { id: student.id },
          data: { stream: newStream }
        });
        
        console.log(`   ${student.accessNumber} - ${student.name}: ${student.class} ${student.stream} → ${newStream}`);
      }
    }
    
    console.log('\n✅ All streams updated!');
    
    // Show updated students grouped by class
    const updatedStudents = await prisma.student.findMany({
      select: {
        name: true,
        accessNumber: true,
        admissionId: true,
        class: true,
        stream: true
      },
      orderBy: [
        { class: 'asc' },
        { stream: 'asc' },
        { accessNumber: 'asc' }
      ]
    });
    
    console.log('\n📋 Updated students:');
    
    // Group by class for display
    const groupedStudents = updatedStudents.reduce((acc, student) => {
      const key = `${student.class} ${student.stream}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(student);
      return acc;
    }, {});
    
    Object.entries(groupedStudents).forEach(([classStream, students]) => {
      console.log(`\n   ${classStream}:`);
      students.forEach(student => {
        console.log(`     ${student.accessNumber} - ${student.name} (${student.admissionId})`);
      });
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixStreams();








