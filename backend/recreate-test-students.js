const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function recreateTestStudents() {
  try {
    console.log('🔄 Recreating test students...');
    
    // Clear existing data for Senior 1 A
    await prisma.droppedAccessNumber.deleteMany({
      where: { className: 'Senior 1', streamName: 'A' }
    });
    
    await prisma.student.deleteMany({
      where: { class: 'Senior 1', stream: 'A' }
    });
    
    console.log('✅ Cleared existing Senior 1 A data');
    
    // Create 3 students in Senior 1 A
    const students = [
      {
        name: 'Test Student 1',
        accessNumber: 'AA001',
        admissionId: 'A25A001',
        nin: 'NIN001',
        ninType: 'NIN',
        age: 16,
        gender: 'Male',
        phone: '1234567890',
        phoneCountryCode: 'UG',
        email: 'test1@example.com',
        class: 'Senior 1',
        stream: 'A',
        needsSponsorship: false,
        sponsorshipStatus: 'none',
        sponsorshipStory: '',
        photo: '',
        familyPhoto: '',
        passportPhoto: '',
        parentName: 'Parent 1',
        parentNin: 'PARENT001',
        parentNinType: 'NIN',
        parentPhone: '0987654321',
        parentPhoneCountryCode: 'UG',
        parentEmail: 'parent1@example.com',
        parentAddress: 'Kampala',
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
        name: 'Test Student 2',
        accessNumber: 'AA002',
        admissionId: 'A25A002',
        nin: 'NIN002',
        ninType: 'NIN',
        age: 16,
        gender: 'Male',
        phone: '1234567890',
        phoneCountryCode: 'UG',
        email: 'test2@example.com',
        class: 'Senior 1',
        stream: 'A',
        needsSponsorship: false,
        sponsorshipStatus: 'none',
        sponsorshipStory: '',
        photo: '',
        familyPhoto: '',
        passportPhoto: '',
        parentName: 'Parent 2',
        parentNin: 'PARENT002',
        parentNinType: 'NIN',
        parentPhone: '0987654321',
        parentPhoneCountryCode: 'UG',
        parentEmail: 'parent2@example.com',
        parentAddress: 'Kampala',
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
        name: 'Test Student 3',
        accessNumber: 'AA003',
        admissionId: 'A25A003',
        nin: 'NIN003',
        ninType: 'NIN',
        age: 16,
        gender: 'Male',
        phone: '1234567890',
        phoneCountryCode: 'UG',
        email: 'test3@example.com',
        class: 'Senior 1',
        stream: 'A',
        needsSponsorship: false,
        sponsorshipStatus: 'none',
        sponsorshipStory: '',
        photo: '',
        familyPhoto: '',
        passportPhoto: '',
        parentName: 'Parent 3',
        parentNin: 'PARENT003',
        parentNinType: 'NIN',
        parentPhone: '0987654321',
        parentPhoneCountryCode: 'UG',
        parentEmail: 'parent3@example.com',
        parentAddress: 'Kampala',
        parentOccupation: 'Teacher',
        parentStory: '',
        conductNotes: null,
        classCompletion: '',
        careerAspiration: 'Doctor',
        storyLocked: false,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    console.log('📝 Creating 3 test students...');
    for (const studentData of students) {
      await prisma.student.create({ data: studentData });
    }
    
    console.log('✅ Created 3 students: AA001, AA002, AA003');
    
    // Show created students
    const createdStudents = await prisma.student.findMany({
      where: { class: 'Senior 1', stream: 'A' },
      select: { accessNumber: true, name: true }
    });
    
    console.log('\n📋 Created students in Senior 1 A:');
    createdStudents.forEach(s => console.log(`   ${s.accessNumber} - ${s.name}`));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

recreateTestStudents();








