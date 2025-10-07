// Test database connection and clinic record creation
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test if we can query students
    const studentCount = await prisma.student.count();
    console.log(`📊 Found ${studentCount} students in database`);
    
    // Test if we can query clinic records
    const clinicCount = await prisma.clinicRecord.count();
    console.log(`🏥 Found ${clinicCount} clinic records in database`);
    
    // Test creating a clinic record
    console.log('🧪 Testing clinic record creation...');
    
    // First, get a student to use
    const student = await prisma.student.findFirst();
    if (!student) {
      console.log('❌ No students found in database');
      return;
    }
    
    console.log(`👨‍🎓 Using student: ${student.name} (ID: ${student.id})`);
    
    // Create a test clinic record
    const testRecord = await prisma.clinicRecord.create({
      data: {
        studentId: student.id.toString(),
        accessNumber: student.accessNumber,
        studentName: student.name,
        className: student.class,
        streamName: student.stream,
        visitDate: new Date(),
        visitTime: '10:00',
        symptoms: 'Test symptoms',
        diagnosis: 'Test diagnosis',
        treatment: 'Test treatment',
        medication: 'Test medication',
        cost: 1000,
        nurseId: '1',
        nurseName: 'Test Nurse',
        followUpRequired: false,
        followUpDate: null,
        parentNotified: true,
        status: 'active',
        notes: 'Database test record'
      }
    });
    
    console.log('✅ Test clinic record created successfully:', testRecord.id);
    
    // Clean up - delete the test record
    await prisma.clinicRecord.delete({
      where: { id: testRecord.id }
    });
    
    console.log('🧹 Test record cleaned up');
    console.log('🎉 Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection();

