const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createNewActiveStudent() {
  try {
    console.log('🔧 Creating new active student for S1A Student2...');
    
    // Find the re-admitted student
    const reAdmittedStudent = await prisma.student.findFirst({
      where: { 
        accessNumber: 'AA0003',
        name: 'S1A Student2'
      }
    });
    
    if (!reAdmittedStudent) {
      console.log('❌ Re-admitted student not found');
      return;
    }
    
    console.log(`📋 Found re-admitted student: ${reAdmittedStudent.name} (${reAdmittedStudent.accessNumber})`);
    console.log(`   Status: ${reAdmittedStudent.status}`);
    
    // Check what access numbers are available in Senior 1 A
    const senior1AStudents = await prisma.student.findMany({
      where: { 
        class: 'Senior 1', 
        stream: 'A',
        status: 'active'
      },
      select: { accessNumber: true, name: true }
    });
    
    console.log(`\n📊 Current active students in Senior 1 A: ${senior1AStudents.length}`);
    senior1AStudents.forEach(s => console.log(`   ${s.accessNumber} - ${s.name}`));
    
    // Find the next available access number
    const existingNumbers = senior1AStudents.map(s => s.accessNumber).sort();
    console.log(`\n📋 Existing access numbers: ${existingNumbers.join(', ')}`);
    
    // Generate new access number (AA0005 since AA0001, AA0002, AA0004 are taken)
    const newAccessNumber = 'AA0005';
    const newAdmissionId = 'A25A005';
    
    console.log(`\n🆕 Creating new student with:`);
    console.log(`   Access Number: ${newAccessNumber}`);
    console.log(`   Admission ID: ${newAdmissionId}`);
    
    // Create new active student
    const newStudent = await prisma.student.create({
      data: {
        name: reAdmittedStudent.name,
        accessNumber: newAccessNumber,
        admissionId: newAdmissionId,
        nin: reAdmittedStudent.nin,
        ninType: reAdmittedStudent.ninType,
        age: reAdmittedStudent.age,
        gender: reAdmittedStudent.gender,
        phone: reAdmittedStudent.phone,
        phoneCountryCode: reAdmittedStudent.phoneCountryCode,
        email: reAdmittedStudent.email,
        class: reAdmittedStudent.class,
        stream: reAdmittedStudent.stream,
        needsSponsorship: reAdmittedStudent.needsSponsorship,
        sponsorshipStatus: reAdmittedStudent.sponsorshipStatus,
        sponsorshipStory: reAdmittedStudent.sponsorshipStory,
        photo: reAdmittedStudent.photo,
        familyPhoto: reAdmittedStudent.familyPhoto,
        passportPhoto: reAdmittedStudent.passportPhoto,
        parentName: reAdmittedStudent.parentName,
        parentNin: reAdmittedStudent.parentNin,
        parentNinType: reAdmittedStudent.parentNinType,
        parentPhone: reAdmittedStudent.parentPhone,
        parentPhoneCountryCode: reAdmittedStudent.parentPhoneCountryCode,
        parentEmail: reAdmittedStudent.parentEmail,
        parentAddress: reAdmittedStudent.parentAddress,
        parentOccupation: reAdmittedStudent.parentOccupation,
        parentStory: reAdmittedStudent.parentStory,
        conductNotes: reAdmittedStudent.conductNotes,
        classCompletion: reAdmittedStudent.classCompletion,
        careerAspiration: reAdmittedStudent.careerAspiration,
        storyLocked: reAdmittedStudent.storyLocked,
        status: 'active', // New student is active
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log(`\n✅ Created new active student: ${newStudent.accessNumber} - ${newStudent.name}`);
    
    // Show final state
    const finalStudents = await prisma.student.findMany({
      where: { class: 'Senior 1', stream: 'A' },
      select: { accessNumber: true, name: true, status: true },
      orderBy: { accessNumber: 'asc' }
    });
    
    console.log(`\n📋 Final Senior 1 A students: ${finalStudents.length}`);
    finalStudents.forEach(s => {
      console.log(`   ${s.accessNumber} - ${s.name} - Status: ${s.status}`);
    });
    
    console.log('\n✅ SUCCESS: S1A Student2 is now active with new access number AA0005!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createNewActiveStudent();








