const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createOkelloTest() {
  try {
    console.log('🔧 Testing access number generation for Okello...');
    
    // Simulate the access number generation logic
    const className = 'Senior 1';
    const stream = 'A';
    
    // Helper function to get class code
    const getClassCode = (className) => {
      switch (className) {
        case 'Senior 1': return 'A';
        case 'Senior 2': return 'B';
        case 'Senior 3': return 'C';
        case 'Senior 4': return 'D';
        default: return 'X';
      }
    };

    const classCode = getClassCode(className);
    const streamCode = stream ? stream.charAt(0).toUpperCase() : 'X';
    
    // Get all existing students in this class and stream (any status)
    const existingStudents = await prisma.student.findMany({
      where: {
        class: className,
        stream: stream
      }
    });

    console.log(`📊 Found ${existingStudents.length} existing students in ${className} ${stream}`);
    existingStudents.forEach(s => {
      console.log(`   ${s.accessNumber} - ${s.name} - Status: ${s.status}`);
    });

    // Get all used numbers in this stream
    const usedNumbers = existingStudents.map(s => {
      const match = s.accessNumber?.match(/\d{4}$/);
      return match ? parseInt(match[0], 10) : 0;
    });

    console.log(`📋 Used numbers: ${usedNumbers.sort((a, b) => a - b).join(', ')}`);

    // Find the next available number
    let nextNumber = 1;
    while (usedNumbers.includes(nextNumber)) {
      nextNumber++;
    }

    const finalAccessNumber = `${classCode}${streamCode}${String(nextNumber).padStart(4, '0')}`;
    
    console.log(`\n🆕 Next available access number: ${finalAccessNumber}`);
    
    // Check if this access number already exists
    const existingStudent = await prisma.student.findFirst({
      where: { accessNumber: finalAccessNumber }
    });

    if (existingStudent) {
      console.log(`❌ Access number ${finalAccessNumber} already exists: ${existingStudent.name}`);
    } else {
      console.log(`✅ Access number ${finalAccessNumber} is available for Okello`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createOkelloTest();








