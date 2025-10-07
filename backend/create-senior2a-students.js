const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSenior2AStudents() {
  try {
    console.log('📝 Creating 4 demo students in Senior 2 A...');
    
    // Create 4 students in Senior 2 A
    const students = [
      {
        name: 'John Smith',
        accessNumber: 'BA001',
        admissionId: 'B25B001',
        nin: 'NIN001',
        ninType: 'NIN',
        age: 17,
        gender: 'Male',
        phone: '1234567890',
        phoneCountryCode: 'UG',
        email: 'john.smith@example.com',
        class: 'Senior 2',
        stream: 'A',
        needsSponsorship: false,
        sponsorshipStatus: 'none',
        sponsorshipStory: '',
        photo: '',
        familyPhoto: '',
        passportPhoto: '',
        parentName: 'Robert Smith',
        parentNin: 'PARENT001',
        parentNinType: 'NIN',
        parentPhone: '0987654321',
        parentPhoneCountryCode: 'UG',
        parentEmail: 'robert.smith@example.com',
        parentAddress: 'Kampala, Uganda',
        parentOccupation: 'Engineer',
        parentStory: '',
        conductNotes: null,
        classCompletion: '',
        careerAspiration: 'Software Engineer',
        storyLocked: false,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Sarah Johnson',
        accessNumber: 'BA002',
        admissionId: 'B25B002',
        nin: 'NIN002',
        ninType: 'NIN',
        age: 17,
        gender: 'Female',
        phone: '1234567891',
        phoneCountryCode: 'UG',
        email: 'sarah.johnson@example.com',
        class: 'Senior 2',
        stream: 'A',
        needsSponsorship: false,
        sponsorshipStatus: 'none',
        sponsorshipStory: '',
        photo: '',
        familyPhoto: '',
        passportPhoto: '',
        parentName: 'Mary Johnson',
        parentNin: 'PARENT002',
        parentNinType: 'NIN',
        parentPhone: '0987654322',
        parentPhoneCountryCode: 'UG',
        parentEmail: 'mary.johnson@example.com',
        parentAddress: 'Entebbe, Uganda',
        parentOccupation: 'Teacher',
        parentStory: '',
        conductNotes: null,
        classCompletion: '',
        careerAspiration: 'Doctor',
        storyLocked: false,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Michael Brown',
        accessNumber: 'BA003',
        admissionId: 'B25B003',
        nin: 'NIN003',
        ninType: 'NIN',
        age: 17,
        gender: 'Male',
        phone: '1234567892',
        phoneCountryCode: 'UG',
        email: 'michael.brown@example.com',
        class: 'Senior 2',
        stream: 'A',
        needsSponsorship: false,
        sponsorshipStatus: 'none',
        sponsorshipStory: '',
        photo: '',
        familyPhoto: '',
        passportPhoto: '',
        parentName: 'David Brown',
        parentNin: 'PARENT003',
        parentNinType: 'NIN',
        parentPhone: '0987654323',
        parentPhoneCountryCode: 'UG',
        parentEmail: 'david.brown@example.com',
        parentAddress: 'Jinja, Uganda',
        parentOccupation: 'Business Owner',
        parentStory: '',
        conductNotes: null,
        classCompletion: '',
        careerAspiration: 'Business Manager',
        storyLocked: false,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Emily Davis',
        accessNumber: 'BA004',
        admissionId: 'B25B004',
        nin: 'NIN004',
        ninType: 'NIN',
        age: 17,
        gender: 'Female',
        phone: '1234567893',
        phoneCountryCode: 'UG',
        email: 'emily.davis@example.com',
        class: 'Senior 2',
        stream: 'A',
        needsSponsorship: false,
        sponsorshipStatus: 'none',
        sponsorshipStory: '',
        photo: '',
        familyPhoto: '',
        passportPhoto: '',
        parentName: 'Lisa Davis',
        parentNin: 'PARENT004',
        parentNinType: 'NIN',
        parentPhone: '0987654324',
        parentPhoneCountryCode: 'UG',
        parentEmail: 'lisa.davis@example.com',
        parentAddress: 'Mbarara, Uganda',
        parentOccupation: 'Nurse',
        parentStory: '',
        conductNotes: null,
        classCompletion: '',
        careerAspiration: 'Lawyer',
        storyLocked: false,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    console.log('📝 Creating students...');
    for (const studentData of students) {
      await prisma.student.create({ data: studentData });
    }
    
    console.log('✅ Created 4 students in Senior 2 A');
    
    // Show created students
    const createdStudents = await prisma.student.findMany({
      where: { class: 'Senior 2', stream: 'A' },
      select: { 
        accessNumber: true, 
        name: true, 
        admissionId: true,
        age: true,
        gender: true,
        careerAspiration: true
      },
      orderBy: { accessNumber: 'asc' }
    });
    
    console.log('\n📋 Created students in Senior 2 A:');
    createdStudents.forEach(student => {
      console.log(`   ${student.accessNumber} - ${student.name} (${student.gender}, Age ${student.age})`);
      console.log(`     Admission ID: ${student.admissionId}`);
      console.log(`     Career Aspiration: ${student.careerAspiration}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSenior2AStudents();








