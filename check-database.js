const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Checking billing types...');
    const billingTypes = await prisma.billingType.findMany();
    console.log('📊 Found', billingTypes.length, 'billing types:');
    billingTypes.forEach(bt => {
      console.log(`- ${bt.name} (${bt.className}): ${bt.amount} UGX - ${bt.year} ${bt.term}`);
    });
    
    console.log('\n🔍 Checking fee structures...');
    const feeStructures = await prisma.feeStructure.findMany();
    console.log('📋 Found', feeStructures.length, 'fee structures:');
    feeStructures.forEach(fs => {
      console.log(`- ${fs.feeName} (${fs.className}): ${fs.amount} UGX`);
    });
    
    console.log('\n🔍 Checking students with Senior 1 class...');
    const students = await prisma.student.findMany({
      where: { class: 'Senior 1' },
      select: { id: true, name: true, class: true, individualFee: true, totalFees: true }
    });
    console.log('👥 Found', students.length, 'Senior 1 students:');
    students.forEach(s => {
      console.log(`- ${s.name}: individualFee=${s.individualFee}, totalFees=${s.totalFees}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
