const { PrismaClient } = require('@prisma/client');

async function removeDuplicates() {
  const prisma = new PrismaClient();
  
  try {
    // Find all students named 'jery'
    const jeryStudents = await prisma.student.findMany({
      where: { name: 'jery' },
      orderBy: { createdAt: 'asc' }
    });
    
    console.log(`Found ${jeryStudents.length} students named 'jery':`, jeryStudents.map(s => ({
      id: s.id,
      name: s.name,
      class: s.class,
      createdAt: s.createdAt
    })));
    
    if (jeryStudents.length > 1) {
      // Keep the first one, delete the rest
      const toDelete = jeryStudents.slice(1);
      
      for (const student of toDelete) {
        await prisma.student.delete({
          where: { id: student.id }
        });
        console.log(`Deleted duplicate student: ${student.name} (ID: ${student.id})`);
      }
      
      console.log(`✅ Removed ${toDelete.length} duplicate students`);
    } else {
      console.log('No duplicates found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeDuplicates();

