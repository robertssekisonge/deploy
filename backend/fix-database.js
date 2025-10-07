const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixDatabase() {
  try {
    console.log('Checking database connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('Database connected successfully');
    
    // Check if columns exist by trying to query them
    try {
      const testUser = await prisma.user.findFirst({
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          photo: true,
          cv: true,
          assignedClasses: true
        }
      });
      console.log('All columns exist in database');
    } catch (error) {
      console.log('Some columns are missing, attempting to add them...');
      
      // Try to add the missing columns manually
      try {
        await prisma.$executeRaw`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" TEXT`;
        await prisma.$executeRaw`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "photo" TEXT`;
        await prisma.$executeRaw`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "cv" TEXT`;
        await prisma.$executeRaw`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "assignedClasses" TEXT`;
        console.log('Columns added successfully');
      } catch (addError) {
        console.error('Error adding columns:', addError);
      }
    }
    
  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDatabase(); 