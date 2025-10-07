const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCiscoResource() {
  try {
    console.log('🔍 Checking cisco resource details...\n');
    
    const ciscoResource = await prisma.resource.findFirst({
      where: {
        title: 'cisco'
      }
    });
    
    if (ciscoResource) {
      console.log('📄 Cisco resource found:');
      console.log(`  - Title: ${ciscoResource.title}`);
      console.log(`  - File Type: ${ciscoResource.fileType}`);
      console.log(`  - File URL: ${ciscoResource.fileUrl || 'None'}`);
      console.log(`  - Has File Data: ${ciscoResource.fileData ? 'Yes' : 'No'}`);
      console.log(`  - Class IDs: ${ciscoResource.classIds}`);
      console.log(`  - Uploaded By: ${ciscoResource.uploadedBy}`);
      console.log(`  - Upload Date: ${ciscoResource.uploadedAt}`);
    } else {
      console.log('❌ Cisco resource not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCiscoResource();







