const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testClassFees() {
  try {
    console.log('🧪 Testing class-specific fee structures...\n');
    
    // Get all students
    const students = await prisma.student.findMany({
      select: { id: true, name: true, class: true, accessNumber: true }
    });
    
    // Get all billing types
    const billingTypes = await prisma.billingType.findMany();
    
    console.log('📊 Fee Structure Test Results:\n');
    
    students.forEach(student => {
      console.log(`👤 Student: ${student.name} (${student.accessNumber})`);
      console.log(`📚 Class: ${student.class}`);
      
      // Filter billing types for this student's class
      const classBillingTypes = billingTypes.filter(bt => bt.className === student.class);
      
      if (classBillingTypes.length === 0) {
        console.log('❌ No billing types found for this class!');
      } else {
        console.log(`✅ Found ${classBillingTypes.length} fee types:`);
        let total = 0;
        classBillingTypes.forEach(bt => {
          console.log(`   - ${bt.name}: UGX ${bt.amount.toLocaleString()}`);
          total += bt.amount;
        });
        console.log(`💰 Total: UGX ${total.toLocaleString()}`);
      }
      console.log('');
    });
    
    // Test the API endpoint
    console.log('🌐 Testing API endpoint...');
    const response = await fetch('http://localhost:5000/api/settings/billing-types');
    if (response.ok) {
      const apiBillingTypes = await response.json();
      console.log(`✅ API returned ${apiBillingTypes.length} billing types`);
      
      // Test filtering by class
      const senior1Types = apiBillingTypes.filter(bt => bt.className === 'Senior 1');
      const senior2Types = apiBillingTypes.filter(bt => bt.className === 'Senior 2');
      const senior3Types = apiBillingTypes.filter(bt => bt.className === 'Senior 3');
      
      console.log(`📊 API Filter Results:`);
      console.log(`   Senior 1: ${senior1Types.length} types`);
      console.log(`   Senior 2: ${senior2Types.length} types`);
      console.log(`   Senior 3: ${senior3Types.length} types`);
    } else {
      console.log('❌ API endpoint failed:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Error testing class fees:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testClassFees();

