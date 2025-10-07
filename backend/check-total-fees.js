const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTotalFees() {
  try {
    const students = await prisma.student.findMany();
    console.log('Student total fees:');
    students.forEach(s => {
      console.log(`${s.name}: Total UGX ${s.totalFees?.toLocaleString() || '0'}, Balance UGX ${s.feeBalance?.toLocaleString() || '0'}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTotalFees();







