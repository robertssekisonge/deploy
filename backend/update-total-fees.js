const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateStudentTotalFees() {
  try {
    console.log('🔧 Updating student total fees to match payment modal...');
    
    const students = await prisma.student.findMany();
    console.log(`Found ${students.length} students`);
    
    // Update all students with the correct total fees (UGX 975,000 as shown in payment modal)
    for (const student of students) {
      await prisma.student.update({
        where: { id: student.id },
        data: {
          totalFees: 975000, // UGX 975,000 as shown in payment modal
          feeBalance: 975000  // Full balance since payments were cleared
        }
      });
      
      console.log(`✅ Updated ${student.name}: Total UGX 975,000, Balance UGX 975,000`);
    }
    
    console.log(`\n🎉 Successfully updated all ${students.length} students!`);
    console.log('All students now have UGX 975,000 total fees and balance.');
    
  } catch (error) {
    console.error('❌ Error updating fees:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateStudentTotalFees();







