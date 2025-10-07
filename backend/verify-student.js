const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyStudent() {
  try {
    console.log('🔍 Checking students in Senior 1 A...');
    
    const students = await prisma.student.findMany({
      where: { 
        class: 'Senior 1', 
        stream: 'A' 
      }
    });
    
    console.log(`📊 Found ${students.length} student(s) in Senior 1 A:`);
    
    students.forEach((student, index) => {
      console.log(`\n${index + 1}. Student Details:`);
      console.log(`   👤 Name: ${student.name}`);
      console.log(`   🔢 Access Number: ${student.accessNumber}`);
      console.log(`   🆔 Admission ID: ${student.admissionId}`);
      console.log(`   🎓 Class: ${student.class} - ${student.stream}`);
      console.log(`   👨‍👩‍👧‍👦 Parent: ${student.parentName}`);
      console.log(`   📞 Parent Phone: ${student.parentPhone}`);
      console.log(`   📧 Parent Email: ${student.parentEmail}`);
      console.log(`   🏠 Parent Address: ${student.parentAddress}`);
      console.log(`   💼 Parent Occupation: ${student.parentOccupation}`);
      console.log(`   📅 Created: ${student.createdAt.toLocaleString()}`);
    });
    
  } catch (error) {
    console.error('❌ Error verifying student:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyStudent();








