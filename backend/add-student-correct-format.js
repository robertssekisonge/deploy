const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addStudentWithCorrectFormat() {
  try {
    console.log('🚀 Adding student to Senior 1 A with CORRECT format...');
    
    // Get all existing students in Senior 1 A to find next number
    const existingStudents = await prisma.student.findMany({
      where: {
        class: 'Senior 1',
        stream: 'A',
        status: 'active'
      }
    });
    
    console.log(`📊 Found ${existingStudents.length} existing students in Senior 1 A`);
    
    // Get all used numbers in this stream
    const usedNumbers = existingStudents.map(s => {
      const match = s.accessNumber?.match(/\d{4}$/);
      return match ? parseInt(match[0], 10) : 0;
    });
    
    console.log('🔢 Used numbers:', usedNumbers);
    
    // Find the next available number
    let nextNumber = 1;
    while (usedNumbers.includes(nextNumber)) {
      nextNumber++;
    }
    
    // Generate correct access number: AA0004 (A=Senior1, A=StreamA, 0004=next number)
    const accessNumber = `AA${String(nextNumber).padStart(4, '0')}`;
    
    // Generate correct admission ID: A25A04 (A=Senior1, 25=year, A=StreamA, 04=sequence)
    const admissionId = `A25A${String(nextNumber).padStart(2, '0')}`;
    
    console.log(`🎯 Next available number: ${nextNumber}`);
    console.log(`🔢 Generated Access Number: ${accessNumber}`);
    console.log(`🆔 Generated Admission ID: ${admissionId}`);
    
    // Check if these numbers already exist
    const existingAccess = await prisma.student.findFirst({
      where: { accessNumber: accessNumber }
    });
    
    const existingAdmission = await prisma.student.findFirst({
      where: { admissionId: admissionId }
    });
    
    if (existingAccess) {
      console.log('❌ Access number already exists:', accessNumber);
      return;
    }
    
    if (existingAdmission) {
      console.log('❌ Admission ID already exists:', admissionId);
      return;
    }
    
    // Create student with correct format
    const studentData = {
      name: 'Mary Johnson',
      nin: '12345678901234',
      ninType: 'NIN',
      accessNumber: accessNumber,
      admissionId: admissionId,
      age: 16,
      gender: 'Female',
      class: 'Senior 1',
      stream: 'A',
      phone: '+256700123456',
      phoneCountryCode: '+256',
      email: 'mary.johnson@example.com',
      needsSponsorship: false,
      sponsorshipStatus: 'none',
      sponsorshipStory: '',
      familyPhoto: '',
      passportPhoto: '',
      photo: '',
      // Parent information (flattened as per schema)
      parentName: 'John Johnson',
      parentNin: '98765432109876',
      parentNinType: 'NIN',
      parentPhone: '+256700654321',
      parentPhoneCountryCode: '+256',
      parentEmail: 'john.johnson@example.com',
      parentAddress: 'Kampala, Uganda',
      parentOccupation: 'Engineer',
      status: 'active'
    };
    
    console.log('👤 Creating student:', studentData.name);
    console.log('📋 Student data:', {
      name: studentData.name,
      accessNumber: studentData.accessNumber,
      admissionId: studentData.admissionId,
      class: studentData.class,
      stream: studentData.stream
    });
    
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

addStudentWithCorrectFormat();








