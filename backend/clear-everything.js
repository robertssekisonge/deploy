const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearEverything() {
  try {
    console.log('🗑️ Clearing everything from the system...');
    
    // Delete all students
    const deletedStudents = await prisma.student.deleteMany();
    console.log(`✅ Deleted ${deletedStudents.count} students`);
    
    // Delete all dropped access numbers
    const deletedDropped = await prisma.droppedAccessNumber.deleteMany();
    console.log(`✅ Deleted ${deletedDropped.count} dropped access numbers`);
    
    console.log('\n🎯 System is now completely clean and ready for fresh data');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearEverything();








