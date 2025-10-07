const fs = require('fs');
const path = require('path');

console.log('🎯 Creating test student...');

// Data file path
const STUDENTS_FILE = path.join(__dirname, 'data', 'students.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('📁 Created data directory');
}

// Load existing students
let students = [];
if (fs.existsSync(STUDENTS_FILE)) {
  try {
    const data = fs.readFileSync(STUDENTS_FILE, 'utf8');
    students = JSON.parse(data);
    console.log(`📚 Loaded ${students.length} existing students`);
  } catch (error) {
    console.log('📚 Starting with empty students list');
    students = [];
  }
}

// Create test student
const testStudent = {
  id: `ST${Date.now()}`,
  name: "John Test Student",
  age: 15,
  class: "Senior 1",
  gender: "Male",
  dateOfBirth: "2010-01-01",
  address: "Test Address, Kampala",
  
  parent: {
    name: "Mary Test Parent",
    age: 35,
    occupation: "Teacher",
    familySize: 4,
    address: "Test Parent Address",
    relationship: "Mother",
    phone: "",
    email: "",
    nin: ""
  },
  
  medicalCondition: "None",
  hobbies: "Reading, Football",
  dreams: "Become a Doctor",
  aspirations: "Graduate from University and help others",
  
  photo: "",
  familyPhoto: "",
  passportPhoto: "",
  
  sponsorshipStatus: "pending",
  needsSponsorship: true,
  accessNumber: "CA1234",
  stream: "A",
  sponsorshipStory: "John is a bright 15-year-old student who dreams of becoming a doctor. His family struggles to provide for his education, and he needs sponsorship support to achieve his dreams.",
  
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
  maxSponsors: 3,
  
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Add test student to the list
students.push(testStudent);

// Save to file
try {
  fs.writeFileSync(STUDENTS_FILE, JSON.stringify(students, null, 2));
  console.log('✅ Test student created successfully!');
  console.log(`📊 Total students in database: ${students.length}`);
  console.log(`👤 Test student: ${testStudent.name} (${testStudent.class})`);
  console.log(`📋 Sponsorship status: ${testStudent.sponsorshipStatus}`);
  console.log(`📁 Saved to: ${STUDENTS_FILE}`);
} catch (error) {
  console.error('❌ Error saving test student:', error);
}

