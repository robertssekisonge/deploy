#!/usr/bin/env node

/**
 * Photo System Test Script
 * Tests all photo upload and serving functionality
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:5000';
const TEST_PHOTO_PATH = path.join(__dirname, 'test-photo.jpg');

// Create a simple test image if it doesn't exist
function createTestImage() {
  if (!fs.existsSync(TEST_PHOTO_PATH)) {
    console.log('📸 Creating test image...');
    // Create a simple 1x1 pixel JPEG (minimal valid JPEG)
    const minimalJpeg = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
      0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
      0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
      0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
      0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
      0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4,
      0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x0C,
      0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0x8A, 0x00,
      0x07, 0xFF, 0xD9
    ]);
    fs.writeFileSync(TEST_PHOTO_PATH, minimalJpeg);
    console.log('✅ Test image created');
  } else {
    console.log('📸 Using existing test image');
  }
}

// Convert file to base64
function fileToBase64(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return fileBuffer.toString('base64');
}

// Test photo upload
async function testPhotoUpload(endpoint, studentId = 'new') {
  try {
    const base64Data = fileToBase64(TEST_PHOTO_PATH);
    const fileType = 'image/jpeg';
    
    const response = await fetch(`${BASE_URL}/api/photos/${endpoint}/${studentId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileData: `data:${fileType};base64,${base64Data}`,
        fileType: fileType
      })
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }
    
    const result = await response.json();
    console.log(`✅ ${endpoint} upload successful:`, result.photo);
    return result.photo;
  } catch (error) {
    console.error(`❌ ${endpoint} upload failed:`, error.message);
    return null;
  }
}

// Test photo serving
async function testPhotoServing(filename) {
  try {
    const response = await fetch(`${BASE_URL}/photos/${filename}`);
    
    if (!response.ok) {
      throw new Error(`Photo serving failed with status ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    const cacheControl = response.headers.get('cache-control');
    
    console.log(`✅ Photo serving successful: ${filename}`);
    console.log(`   Content-Type: ${contentType}`);
    console.log(`   Cache-Control: ${cacheControl}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Photo serving failed for ${filename}:`, error.message);
    return false;
  }
}

// Test photo system health
async function testPhotoHealth() {
  try {
    const response = await fetch(`${BASE_URL}/api/photos/health`);
    
    if (!response.ok) {
      throw new Error(`Health check failed with status ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Photo system health check successful');
    console.log(`   Uploads directory: ${result.uploadsDirectory.path}`);
    console.log(`   Photo count: ${result.uploadsDirectory.photoCount}`);
    
    return result;
  } catch (error) {
    console.error('❌ Photo system health check failed:', error.message);
    return null;
  }
}

// Test available photos list
async function testPhotosList() {
  try {
    const response = await fetch(`${BASE_URL}/api/photos/list`);
    
    if (!response.ok) {
      throw new Error(`Photos list failed with status ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Photos list successful');
    console.log(`   Available photos: ${result.count}`);
    
    if (result.photos.length > 0) {
      console.log('   Sample photos:', result.photos.slice(0, 5));
    }
    
    return result;
  } catch (error) {
    console.error('❌ Photos list failed:', error.message);
    return null;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Photo System Tests...\n');
  
  // Create test image
  createTestImage();
  
  // Test photo system health
  console.log('\n📊 Testing Photo System Health...');
  await testPhotoHealth();
  
  // Test available photos list
  console.log('\n📋 Testing Available Photos List...');
  await testPhotosList();
  
  // Test photo uploads
  console.log('\n📤 Testing Photo Uploads...');
  
  const uploadedPhotos = [];
  
  // Test student profile photo upload
  const studentPhoto = await testPhotoUpload('student-profile', 'new');
  if (studentPhoto) uploadedPhotos.push(studentPhoto);
  
  // Test family photo upload
  const familyPhoto = await testPhotoUpload('family', 'new');
  if (familyPhoto) uploadedPhotos.push(familyPhoto);
  
  // Test passport photo upload
  const passportPhoto = await testPhotoUpload('passport', 'new');
  if (passportPhoto) uploadedPhotos.push(passportPhoto);
  
  // Test general student photo upload
  const generalPhoto = await testPhotoUpload('student', 'new');
  if (generalPhoto) uploadedPhotos.push(generalPhoto);
  
  // Test photo serving
  console.log('\n📸 Testing Photo Serving...');
  for (const photo of uploadedPhotos) {
    await testPhotoServing(photo);
  }
  
  // Test moving temporary photos
  if (uploadedPhotos.length > 0) {
    console.log('\n🔄 Testing Temporary Photo Moving...');
    try {
      const response = await fetch(`${BASE_URL}/api/photos/move-temp/123`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tempPhotos: uploadedPhotos
        })
      });
      
      if (!response.ok) {
        throw new Error(`Move temp failed with status ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Temporary photos moved successfully');
      console.log(`   Moved photos: ${result.movedPhotos.length}`);
    } catch (error) {
      console.error('❌ Moving temporary photos failed:', error.message);
    }
  }
  
  // Final health check
  console.log('\n📊 Final Photo System Health Check...');
  await testPhotoHealth();
  
  console.log('\n🎉 Photo System Tests Completed!');
  console.log('\n📋 Available Endpoints:');
  console.log('   • POST /api/photos/profile/{userId} - Upload user profile photo');
  console.log('   • POST /api/photos/family/{studentId} - Upload family photo');
  console.log('   • POST /api/photos/passport/{studentId} - Upload passport photo');
  console.log('   • POST /api/photos/student-profile/{studentId} - Upload student profile photo');
  console.log('   • POST /api/photos/student/{studentId} - Upload general student photo');
  console.log('   • POST /api/photos/move-temp/{studentId} - Move temporary photos');
  console.log('   • GET /api/photos/list - List available photos');
  console.log('   • GET /api/photos/health - Photo system health check');
  console.log('   • GET /photos/{filename} - Serve photos');
  console.log('   • GET /uploads/{filename} - Direct file access');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testPhotoUpload,
  testPhotoServing,
  testPhotoHealth,
  testPhotosList,
  runTests
};
