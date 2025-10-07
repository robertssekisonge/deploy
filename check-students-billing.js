const { PrismaClient } = require('@prisma/client');

async function checkStudentsAndBillingTypes() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking students and billing types...');
    
    // Get all students
    const students = await prisma.student.findMany({
      select: {
        id: true,
        name: true,
        accessNumber: true,
        class: true,
        stream: true
      }
    });
    
    console.log(`📊 Found ${students.length} students:`);
    students.forEach(student => {
      console.log(`  - ${student.name} (${student.accessNumber}) - ${student.class} ${student.stream}`);
    });
    
    // Group students by class
    const byClass = {};
    students.forEach(student => {
      if (!byClass[student.class]) {
        byClass[student.class] = [];
      }
      byClass[student.class].push(student);
    });
    
    console.log('\n📋 Students by class:');
    Object.keys(byClass).forEach(className => {
      console.log(`\n${className}:`);
      byClass[className].forEach(student => {
        console.log(`  - ${student.name} (${student.accessNumber})`);
      });
    });
    
    // Get billing types
    const billingTypes = await prisma.billingType.findMany();
    
    console.log('\n💰 Billing types by class:');
    const billingByClass = {};
    billingTypes.forEach(bt => {
      if (!billingByClass[bt.className]) {
        billingByClass[bt.className] = [];
      }
      billingByClass[bt.className].push(bt);
    });
    
    Object.keys(billingByClass).forEach(className => {
      console.log(`\n${className}:`);
      billingByClass[className].forEach(bt => {
        console.log(`  - ${bt.name}: UGX ${bt.amount} (${bt.frequency})`);
      });
    });
    
    // Check if Senior 2 students exist and what fees they should have
    const senior2Students = students.filter(s => s.class === 'Senior 2');
    const senior2BillingTypes = billingTypes.filter(bt => bt.className === 'Senior 2');
    
    console.log('\n🎯 Senior 2 Analysis:');
    console.log(`Students in Senior 2: ${senior2Students.length}`);
    console.log(`Billing types for Senior 2: ${senior2BillingTypes.length}`);
    
    if (senior2Students.length > 0) {
      console.log('\nSenior 2 Students:');
      senior2Students.forEach(student => {
        console.log(`  - ${student.name} (${student.accessNumber})`);
      });
    }
    
    if (senior2BillingTypes.length > 0) {
      console.log('\nSenior 2 Billing Types:');
      senior2BillingTypes.forEach(bt => {
        console.log(`  - ${bt.name}: UGX ${bt.amount} (${bt.frequency})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStudentsAndBillingTypes();


