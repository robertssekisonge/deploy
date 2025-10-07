const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAccessNumbers() {
  try {
    console.log('🔍 Checking existing access numbers...\n');
    
    const students = await prisma.student.findMany({
      where: { status: 'active' },
      select: {
        name: true,
        accessNumber: true,
        class: true,
        stream: true
      },
      orderBy: { accessNumber: 'asc' }
    });
    
    console.log(`📊 Found ${students.length} active students:\n`);
    
    students.forEach(student => {
      console.log(`- ${student.name}: ${student.accessNumber} (${student.class} ${student.stream})`);
    });
    
    // Check Senior 1 A stream specifically
    const senior1A = students.filter(s => s.class === 'Senior 1' && s.stream === 'A');
    console.log(`\n🎯 Senior 1 A stream students: ${senior1A.length}`);
    senior1A.forEach(student => {
      console.log(`  - ${student.name}: ${student.accessNumber}`);
    });
    
    // Check what the next number should be
    const senior1ANumbers = senior1A.map(s => {
      const match = s.accessNumber?.match(/\d{2}$/);
      return match ? parseInt(match[0], 10) : 0;
    }).filter(n => n > 0).sort((a, b) => a - b);
    
    console.log(`\n🔢 Existing Senior 1 A numbers: ${senior1ANumbers.join(', ')}`);
    
    if (senior1ANumbers.length > 0) {
      const maxNumber = Math.max(...senior1ANumbers);
      const nextNumber = maxNumber + 1;
      console.log(`📈 Next available number should be: AA${String(nextNumber).padStart(2, '0')}`);
    } else {
      console.log(`📈 Next available number should be: AA01`);
    }
    
  } catch (error) {
    console.error('❌ Error checking access numbers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAccessNumbers();
