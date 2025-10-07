const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addStudentToSenior1A() {
  try {
    console.log('🚀 Adding student to Senior 1 A...');
    
    // Check if student with this access number already exists
    const existingStudent = await prisma.student.findFirst({
      where: { accessNumber: 'SA001' }
    });
    
    if (existingStudent) {
      console.log('⚠️ Student with access number SA001 already exists');
      console.log('👤 Existing student:', existingStudent.name);
      console.log('🎓 Class:', existingStudent.class, '-', existingStudent.stream);
      return;
    }
    
    // Now add a student
    const studentData = {
      name: 'John Doe',
      nin: '12345678901234',
      ninType: 'NIN',
      accessNumber: 'SA001', // Senior 1 A - 001
      admissionId: 'ADM' + Date.now(),
      age: 15,
      gender: 'Male',
      class: 'Senior 1',
      stream: 'A',
      phone: '+256700123456',
      phoneCountryCode: '+256',
      email: 'john.doe@example.com',
      needsSponsorship: false,
      sponsorshipStatus: 'none',
      sponsorshipStory: '',
      familyPhoto: '',
      passportPhoto: '',
      photo: '',
      // Parent information (flattened as per schema)
      parentName: 'Jane Doe',
      parentNin: '98765432109876',
      parentNinType: 'NIN',
      parentPhone: '+256700654321',
      parentPhoneCountryCode: '+256',
      parentEmail: 'jane.doe@example.com',
      parentAddress: 'Kampala, Uganda',
      parentOccupation: 'Teacher',
      status: 'active'
    };
    
    console.log('👤 Creating student:', studentData.name);
    
    const student = await prisma.student.create({
      data: studentData
    });
    
    console.log('✅ Student created successfully!');
    console.log('🆔 Student ID:', student.id);
    console.log('👤 Name:', student.name);
    console.log('🎓 Class:', student.class, '-', student.stream);
    console.log('🔢 Access Number:', student.accessNumber);
    console.log('🆔 Admission ID:', student.admissionId);
    console.log('👨‍👩‍👧‍👦 Parent:', student.parentName);
    console.log('📞 Parent Phone:', student.parentPhone);
    
  } catch (error) {
    console.error('❌ Error adding student:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addStudentToSenior1A();
