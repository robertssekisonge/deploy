const http = require('http');

console.log('🧪 Creating test student for Box 1 (Eligibility Check)...');

const testStudent = {
  name: "Mary Smith",
  class: "S3",
  stream: "A",
  accessNumber: "CA1719",
  age: 15,
  gender: "Female",
  phoneNumber: "1234567891",
  parentNames: "John Smith",
  parentJob: "Engineer",
  parentContact: "0987654322",
  parentResidence: "Kampala",
  sponsorshipStory: "Mary is a bright student who needs sponsorship support to continue her education. Her family is struggling financially.",
  sponsorshipStatus: "pending",
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
      console.log('✅ Test student created successfully for Box 1!');
      console.log('🎯 Now go to the overseer account and approve this student');
      console.log('🔗 Go to: http://localhost:5173/sponsorships');
      console.log('📋 Click on "1. Eligibility Check" and then "Approve"');
    } else {
      console.log('❌ Failed to create test student');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error creating test student:', error.message);
});

req.write(postData);
req.end();
