const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const targetYear = process.env.UPDATE_YEAR || '2025';
    const targetTerm = process.env.UPDATE_TERM || 'Term 3';

    console.log(`\n🔧 Updating billing type terms to "${targetTerm}" for year ${targetYear}...`);

    const result = await prisma.billingType.updateMany({
      where: { year: targetYear },
      data: { term: targetTerm },
    });

    console.log(`✅ Updated ${result.count} billing type records.`);

    // Show a brief summary by class
    const byClass = await prisma.billingType.groupBy({
      by: ['className', 'term', 'year'],
      _count: { _all: true },
    });

    console.log('\n📊 Current term/year summary by class:');
    byClass.forEach((row) => {
      console.log(` - ${row.className}: ${row.term} ${row.year} (${row._count._all} items)`);
    });
  } catch (e) {
    console.error('❌ Error updating billing terms:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();



