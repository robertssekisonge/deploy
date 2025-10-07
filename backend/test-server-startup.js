console.log('🧪 Testing server startup...');

try {
  console.log('📁 Current directory:', __dirname);
  console.log('📁 Checking if server file exists...');
  
  const fs = require('fs');
  const path = require('path');
  
  const serverFile = path.join(__dirname, 'sponsorship-server-5000.js');
  console.log('📁 Server file path:', serverFile);
  console.log('📁 File exists:', fs.existsSync(serverFile));
  
  if (fs.existsSync(serverFile)) {
    console.log('✅ Server file found, attempting to start...');
    require('./sponsorship-server-5000.js');
  } else {
    console.log('❌ Server file not found');
  }
} catch (error) {
  console.error('❌ Error starting server:', error);
}

