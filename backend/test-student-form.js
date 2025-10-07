const http = require('http');

console.log('🧪 Testing student form submission...');

const testStudent = {
  name: "Test Student",
  age: 15,
  class: "Senior 1",
  gender: "Male",
  dateOfBirth: "2010-01-01",
  address: "Test Address",
  
  parent: {
    name: "Test Parent",
    age: 35,
    occupation: "Teacher",
    familySize: 4,
    address: "Test Parent Address",
    relationship: "Parent",
    phone: "",
    email: "",
    nin: ""
  },
  
  medicalCondition: "None",
  hobbies: "Reading",
  dreams: "Graduate",
  aspirations: "Graduate from University",
  
  photo: "",
  familyPhoto: "",
  passportPhoto: "",
  
  sponsorshipStatus: "pending",
  needsSponsorship: true,
  accessNumber: "CA1234",
  stream: "A",
  sponsorshipStory: "Test Student is a 15-year-old student in Senior 1 who needs sponsorship support.",
  
  status: "active",
  totalFees: 800000,
  paidAmount: 0,
  balance: 800000,
  paymentStatus: "unpaid",
  
  academicRecords: [],
  financialRecords: [],
  attendanceRecords: [],
  
  nin: "",
  admissionId: "",
  sponsorshipApplications: [],
  maxSponsors: 3
};

const postData = JSON.stringify(testStudent);

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/students',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('📤 Sending student data:', JSON.stringify(testStudent, null, 2));

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📡 Response status:', res.statusCode);
    console.log('📡 Response headers:', res.headers);
    console.log('📡 Response body:', data);
    
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ Student created successfully!');
    } else {
      console.log('❌ Failed to create student');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
});

req.write(postData);
req.end();

