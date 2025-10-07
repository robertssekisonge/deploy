const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAA0003Details() {
  try {
    console.log('🔍 Checking AA0003 details in database...');
    
    // Check the exact data in the dropped access numbers table
    const aa0003 = await prisma.droppedAccessNumber.findFirst({
      where: { accessNumber: 'AA0003' }
    });
    
    if (aa0003) {
      console.log('📋 AA0003 details:');
      console.log(`   Access Number: "${aa0003.accessNumber}"`);
      console.log(`   Student Name: "${aa0003.studentName}"`);
      console.log(`   Class Name: "${aa0003.className}"`);
      console.log(`   Stream Name: "${aa0003.streamName}"`);
      console.log(`   Reason: "${aa0003.reason}"`);
      
      // Check if there are any spaces or special characters
      console.log('\n🔍 Character analysis:');
      console.log(`   Class name length: ${aa0003.className.length}`);
      console.log(`   Stream name length: ${aa0003.streamName.length}`);
      console.log(`   Class name bytes: ${Buffer.from(aa0003.className).toString('hex')}`);
      console.log(`   Stream name bytes: ${Buffer.from(aa0003.streamName).toString('hex')}`);
      
      // Test different query variations
      console.log('\n🔍 Testing different query variations:');
      
      // Test 1: Exact match
      const exactMatch = await prisma.droppedAccessNumber.findMany({
        where: {
          className: 'Senior 1',
          streamName: 'A'
        }
      });
      console.log(`   Exact match "Senior 1" + "A": ${exactMatch.length} results`);
      
      // Test 2: With trim
      const trimMatch = await prisma.droppedAccessNumber.findMany({
        where: {
          className: { contains: 'Senior 1' },
          streamName: 'A'
        }
      });
      console.log(`   Contains "Senior 1" + "A": ${trimMatch.length} results`);
      
      // Test 3: All records to see what's there
      const allRecords = await prisma.droppedAccessNumber.findMany();
      console.log(`   All dropped records: ${allRecords.length}`);
      allRecords.forEach(r => {
        console.log(`     "${r.className}" + "${r.streamName}"`);
      });
      
    } else {
      console.log('❌ AA0003 not found in dropped access numbers');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAA0003Details();








