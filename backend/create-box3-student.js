const http = require('http');

console.log('🧪 Creating test student for Box 3 (Available for Sponsors)...');

const testStudent = {
  name: "Sarah Johnson",
  class: "S3",
  stream: "A",
  accessNumber: "CA1717",
  age: 15,
  gender: "Female",
  phoneNumber: "1234567890",
  parentNames: "John Johnson",
  parentJob: "Teacher",
  parentContact: "0987654321",
  parentResidence: "Kampala",
  sponsorshipStory: "Sarah is a bright student who needs sponsorship support to continue her education. Her family is struggling financially and she is at risk of dropping out of school.",
  sponsorshipStatus: "available-for-sponsors",
  needsSponsorship: true,
  photo: null
};

const postData = JSON.stringify(testStudent);

console.log('📤 Sending data:', postData);

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/students',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log(`📡 Response Status: ${res.statusCode}`);
    console.log(`📡 Response: ${data}`);
    
    if (res.statusCode === 201) {
      console.log('✅ Test student created successfully for Box 3!');
      console.log('🎯 Now check the sponsor account to see the student');
      console.log('🔗 Go to: http://localhost:5173/available-for-sponsors');
    } else {
      console.log('❌ Failed to create test student');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error creating test student:', error.message);
  console.error('❌ Error details:', error);
});

req.write(postData);
req.end();

