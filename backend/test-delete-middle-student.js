const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDeleteMiddleStudent() {
  try {
    console.log('🧪 Testing delete middle student functionality...');
    
    // First, clear any existing data for Senior 1 A
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
    
    // Show initial state
    const initialStudents = await prisma.student.findMany({
      where: { class: 'Senior 1', stream: 'A' },
      select: { accessNumber: true, name: true }
    });
    
    console.log('\n📋 Initial students in Senior 1 A:');
    initialStudents.forEach(s => console.log(`   ${s.accessNumber} - ${s.name}`));
    
    // Find the middle student (AA002)
    const middleStudent = await prisma.student.findFirst({
      where: { accessNumber: 'AA002' }
    });
    
    if (!middleStudent) {
      console.log('❌ Middle student AA002 not found');
      return;
    }
    
    console.log(`\n🗑️ Deleting middle student: ${middleStudent.name} (${middleStudent.accessNumber})`);
    
    // Check other students in the same stream before deletion
    const otherStudentsInStream = await prisma.student.findMany({
      where: {
        class: middleStudent.class,
        stream: middleStudent.stream,
        id: { not: middleStudent.id }
      }
    });
    
    console.log(`📊 Other students in ${middleStudent.class} ${middleStudent.stream}: ${otherStudentsInStream.length}`);
    otherStudentsInStream.forEach(s => console.log(`   ${s.accessNumber} - ${s.name}`));
    
    // Delete the middle student
    await prisma.student.delete({
      where: { id: middleStudent.id }
    });
    
    console.log('✅ Middle student deleted');
    
    // Check if AA002 was added to dropped list
    const droppedAA002 = await prisma.droppedAccessNumber.findFirst({
      where: { accessNumber: 'AA002' }
    });
    
    if (droppedAA002) {
      console.log('✅ AA002 was added to dropped list (correct - not last in stream)');
      console.log(`   Dropped: ${droppedAA002.accessNumber} - ${droppedAA002.studentName}`);
    } else {
      console.log('❌ AA002 was NOT added to dropped list (incorrect - should be there)');
    }
    
    // Show final state
    const remainingStudents = await prisma.student.findMany({
      where: { class: 'Senior 1', stream: 'A' },
      select: { accessNumber: true, name: true }
    });
    
    console.log(`\n📋 Remaining students in Senior 1 A: ${remainingStudents.length}`);
    remainingStudents.forEach(s => console.log(`   ${s.accessNumber} - ${s.name}`));
    
    const allDropped = await prisma.droppedAccessNumber.findMany();
    console.log(`\n📋 Dropped access numbers: ${allDropped.length}`);
    allDropped.forEach(d => console.log(`   ${d.accessNumber} - ${d.studentName} (${d.className} ${d.streamName})`));
    
    // Verify the logic
    console.log('\n🔍 Verification:');
    console.log(`   Expected: AA002 should be in dropped list (not last in stream)`);
    console.log(`   Expected: AA001 and AA003 should remain as active students`);
    console.log(`   Expected: Only 1 dropped access number (AA002)`);
    
    if (droppedAA002 && remainingStudents.length === 2 && allDropped.length === 1) {
      console.log('✅ SUCCESS: Logic working correctly!');
    } else {
      console.log('❌ FAILED: Logic not working as expected');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDeleteMiddleStudent();








