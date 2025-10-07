const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAA0006Issue() {
  try {
    console.log('🔍 Checking why AA0006 (Okello) is missing...');
    
    // Check all students
    const allStudents = await prisma.student.findMany({
      select: {
        accessNumber: true,
        name: true,
        class: true,
        stream: true,
        status: true,
        createdAt: true
      },
      orderBy: { accessNumber: 'asc' }
    });
    
    console.log(`📊 Current students: ${allStudents.length}`);
    allStudents.forEach(s => {
      console.log(`   ${s.accessNumber} - ${s.name} (${s.class} ${s.stream}) - Status: ${s.status}`);
    });
    
    // Check what the next auto-generated number should be
    const senior1AStudents = allStudents.filter(s => s.class === 'Senior 1' && s.stream === 'A' && s.status === 'active');
    console.log(`\n📊 Active Senior 1 A students: ${senior1AStudents.length}`);
    
    const accessNumbers = senior1AStudents.map(s => s.accessNumber).sort();
    console.log(`📋 Current access numbers: ${accessNumbers.join(', ')}`);
    
    // Find the next available number
    let nextNumber = 1;
    while (accessNumbers.includes(`AA${String(nextNumber).padStart(4, '0')}`)) {
      nextNumber++;
    }
    const nextAccessNumber = `AA${String(nextNumber).padStart(4, '0')}`;
    
    console.log(`\n🔍 Next auto-generated access number should be: ${nextAccessNumber}`);
    
    // Check if AA0006 exists
    const aa0006Exists = allStudents.find(s => s.accessNumber === 'AA0006');
    if (aa0006Exists) {
      console.log(`✅ AA0006 exists: ${aa0006Exists.name} - Status: ${aa0006Exists.status}`);
    } else {
      console.log('❌ AA0006 does not exist - this is the problem!');
    }
    
    // Check if there are any students with similar names
    const similarNames = allStudents.filter(s => 
      s.name.toLowerCase().includes('okello') || 
      s.name.toLowerCase().includes('okelo') ||
      s.name.toLowerCase().includes('okel')
    );
    
    if (similarNames.length > 0) {
      console.log('\n🔍 Found students with similar names:');
      similarNames.forEach(s => {
        console.log(`   ${s.accessNumber} - ${s.name} (${s.class} ${s.stream}) - Status: ${s.status}`);
      });
    } else {
      console.log('\n❌ No students found with similar names to "Okello"');
    }
    
    // Check if there are any recent students that might be Okello
    const recentStudents = allStudents
      .filter(s => s.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    if (recentStudents.length > 0) {
      console.log('\n📋 Recent students (last 24 hours):');
      recentStudents.forEach(s => {
        console.log(`   ${s.accessNumber} - ${s.name} (${s.class} ${s.stream}) - Created: ${s.createdAt}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAA0006Issue();








