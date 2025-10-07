const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixAccessNumbers() {
  try {
    console.log('🔧 Fixing access numbers - S1-S4 use A,B,C streams...');
    
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
    
    // Class letter mapping
    const classMap = {
      'Senior 1': 'A',
      'Senior 2': 'B',
      'Senior 3': 'C',
      'Senior 4': 'D',
      'Senior 5': 'E',
      'Senior 6': 'F'
    };
    
    // Stream letter mapping for Senior 1-4: A, B, C
    const streamMapS1S4 = {
      'A': 'A',
      'B': 'B',
      'C': 'C'
    };
    
    // Stream letter mapping for Senior 5-6: Arts, Sciences
    const streamMapS5S6 = {
      'Arts': 'A',
      'Sciences': 'S'
    };
    
    console.log('\n🔄 Updating access numbers...');
    
    // Track student numbers per class/stream
    const studentCounters = {};
    
    for (const student of students) {
      const classLetter = classMap[student.class];
      let streamLetter;
      
      // Determine stream letter based on class
      if (['Senior 1', 'Senior 2', 'Senior 3', 'Senior 4'].includes(student.class)) {
        streamLetter = streamMapS1S4[student.stream] || 'A';
      } else if (['Senior 5', 'Senior 6'].includes(student.class)) {
        streamLetter = streamMapS5S6[student.stream] || 'A';
      }
      
      // Create counter key
      const counterKey = `${student.class}-${student.stream}`;
      if (!studentCounters[counterKey]) {
        studentCounters[counterKey] = 0;
      }
      studentCounters[counterKey]++;
      
      // Generate new access number
      const studentNumber = studentCounters[counterKey].toString().padStart(3, '0');
      const newAccessNumber = `${classLetter}${streamLetter}${studentNumber}`;
      
      // Update the student
      await prisma.student.update({
        where: { id: student.id },
        data: { accessNumber: newAccessNumber }
      });
      
      console.log(`   ${student.name}: ${student.accessNumber} → ${newAccessNumber} (${student.class} ${student.stream})`);
    }
    
    console.log('\n✅ All access numbers updated!');
    
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

fixAccessNumbers();








