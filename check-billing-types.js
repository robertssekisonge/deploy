const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBillingTypes() {
  try {
    console.log('Checking billing types for Senior 2...');
    const billingTypes = await prisma.billingType.findMany({ 
      where: { className: 'Senior 2' },
      orderBy: { name: 'asc' }
    });
    
    console.log(`Found ${billingTypes.length} billing types for Senior 2:`);
    billingTypes.forEach((bt, index) => {
      console.log(`${index + 1}. ${bt.name} - UGX ${bt.amount} (${bt.frequency}) - Term: ${bt.term} Year: ${bt.year}`);
    });
    
    const total = billingTypes.reduce((sum, bt) => sum + Number(bt.amount || 0), 0);
    console.log(`\nTotal fees for Senior 2: UGX ${total.toLocaleString()}`);
    
    // Also check current settings
    const settings = await prisma.settings.findFirst();
    console.log(`\nCurrent settings:`);
    console.log(`Current Term: ${settings?.currentTerm}`);
    console.log(`Current Year: ${settings?.currentYear}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBillingTypes();

