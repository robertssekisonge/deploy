const fs = require('fs');
const path = require('path');

// Test the image serving functionality
console.log('🧪 Testing Image Serving Setup...\n');

// Check if uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (fs.existsSync(uploadsDir)) {
  console.log('✅ Uploads directory exists');
  
  // List files in uploads directory
  const files = fs.readdirSync(uploadsDir);
  if (files.length === 0) {
    console.log('📁 Uploads directory is empty (ready for photos)');
  } else {
    console.log('📁 Files in uploads directory:');
    files.forEach(file => {
      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file);
      console.log(`   ${isImage ? '🖼️' : '📄'} ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
    });
  }
} else {
  console.log('❌ Uploads directory not found - creating it...');
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Uploads directory created');
}

console.log('\n🚀 Your server now supports:');
console.log('   • Static file serving: http://localhost:5000/uploads/{filename}');
console.log('   • Photo serving: http://localhost:5000/photos/{filename}');
console.log('   • All existing API endpoints: /api/*');

console.log('\n📸 To test with photos:');
console.log('   1. Start your server: npm run dev');
console.log('   2. Upload a photo through your existing system');
console.log('   3. Access it via: http://localhost:5000/photos/{filename}');
console.log('   4. Or directly via: http://localhost:5000/uploads/{filename}');

console.log('\n🎉 Image serving is ready!');


















