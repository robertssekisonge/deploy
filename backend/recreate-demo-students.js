const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function recreateDemoStudents() {
  try {
    console.log('🔄 Recreating demo students...');
    
    // Clear any existing data
    await prisma.droppedAccessNumber.deleteMany();
    await prisma.student.deleteMany();
    console.log('✅ Cleared existing data');
    
    // Class and stream configuration
    const classes = [
      { name: 'Senior 1', letter: 'A' },
      { name: 'Senior 2', letter: 'B' },
      { name: 'Senior 3', letter: 'C' },
      { name: 'Senior 4', letter: 'D' },
      { name: 'Senior 5', letter: 'E' },
      { name: 'Senior 6', letter: 'F' }
    ];
    
    const students = [];
    
    for (const classInfo of classes) {
      // For Senior 1-4: streams A, B
      // For Senior 5-6: streams Arts, Sciences
      const streams = ['Senior 1', 'Senior 2', 'Senior 3', 'Senior 4'].includes(classInfo.name) 
        ? ['A', 'B'] 
        : ['Arts', 'Sciences'];
      
      for (const stream of streams) {
        for (let i = 1; i <= 3; i++) {
          // Generate access number
          const streamLetter = ['Senior 1', 'Senior 2', 'Senior 3', 'Senior 4'].includes(classInfo.name)
            ? stream
            : (stream === 'Arts' ? 'A' : 'S');
          
          const accessNumber = `${classInfo.letter}${streamLetter}${i.toString().padStart(3, '0')}`;
          
          // Generate admission number (Month + Year + Class + Number)
          const monthLetter = classInfo.letter; // A=Jan, B=Feb, etc.
          const admissionNumber = `${monthLetter}25${classInfo.letter}${(i + (stream === 'B' || stream === 'Sciences' ? 3 : 0)).toString().padStart(3, '0')}`;
          
          students.push({
            name: `${classInfo.name} ${stream} Student${i}`,
            accessNumber: accessNumber,
            admissionId: admissionNumber,
            nin: `NIN${accessNumber}`,
            ninType: 'NIN',
            age: 16,
            gender: 'Male',
            phone: '1234567890',
            phoneCountryCode: 'UG',
            email: `student${i}@example.com`,
            class: classInfo.name,
            stream: stream,
            needsSponsorship: false,
            sponsorshipStatus: 'none',
            sponsorshipStory: '',
            photo: '',
            familyPhoto: '',
            passportPhoto: '',
            parentName: `Parent of ${classInfo.name} ${stream} Student${i}`,
            parentNin: `PARENT${accessNumber}`,
            parentNinType: 'NIN',
            parentPhone: '0987654321',
            parentPhoneCountryCode: 'UG',
            parentEmail: `parent${i}@example.com`,
            parentAddress: 'Kampala, Uganda',
            parentOccupation: 'Teacher',
            parentStory: '',
            conductNotes: null,
            classCompletion: '',
            careerAspiration: 'Doctor',
            storyLocked: false,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    }
    
    console.log(`📝 Creating ${students.length} students...`);
    
    for (const studentData of students) {
      await prisma.student.create({ data: studentData });
    }
    
    console.log('✅ Demo students created successfully!');
    
    // Show summary
    const createdStudents = await prisma.student.findMany({
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
    
    console.log('\n📋 Created students:');
    const groupedStudents = createdStudents.reduce((acc, student) => {
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

recreateDemoStudents();
