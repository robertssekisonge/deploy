const fs = require('fs');
const path = require('path');

// Data file path
const STUDENTS_FILE = path.join(__dirname, 'data', 'students.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('📁 Created data directory');
}

// Demo student data
const demoStudent = {
  id: 'demo-student-001',
  name: 'John Demo Student',
  age: 15,
  class: 'Senior 1',
  gender: 'Male',
  dateOfBirth: '2008-01-15',
  address: 'Kampala, Uganda',
  
  // Parent information
  parent: {
    name: 'Mary Demo Parent',
    age: 35,
    occupation: 'Teacher',
    familySize: 4,
    address: 'Kampala, Uganda',
    relationship: 'Mother',
    phone: '+256123456789',
    email: 'mary.demo@email.com',
    nin: 'DEMO123456'
  },
  
  // Additional information
  medicalCondition: 'None',
  hobbies: 'Reading, Football',
  dreams: 'Doctor',
  aspirations: 'Graduate from University',
  
  // Photos
  photo: '',
  familyPhoto: '',
  passportPhoto: '',
  
  // Sponsorship information
  sponsorshipStatus: 'pending',
  needsSponsorship: true,
  accessNumber: 'CA0001',
  stream: 'A',
  sponsorshipStory: 'John is a bright 15-year-old student who dreams of becoming a doctor. His family struggles to provide for his education, and he needs sponsorship support to continue his studies.',
  
  // Financial information
  status: 'active',
  totalFees: 800000,
  paidAmount: 0,
  balance: 800000,
  paymentStatus: 'unpaid',
  
  // Records
  academicRecords: [],
  financialRecords: [],
  attendanceRecords: [],
  
  // Required fields
  nin: 'DEMO123456',
  admissionId: 'ADM001',
  sponsorshipApplications: [],
  maxSponsors: 3,
  
  // Timestamps
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Load existing students or create empty array
let students = [];
if (fs.existsSync(STUDENTS_FILE)) {
  try {
    const studentsData = fs.readFileSync(STUDENTS_FILE, 'utf8');
    students = JSON.parse(studentsData);
    console.log(`📚 Loaded ${students.length} existing students`);
  } catch (error) {
    console.error('❌ Error loading existing students:', error);
    students = [];
  }
}

// Add demo student
students.push(demoStudent);

// Save to file
try {
  fs.writeFileSync(STUDENTS_FILE, JSON.stringify(students, null, 2));
  console.log('✅ Demo student created successfully!');
  console.log('📋 Student details:');
  console.log(`   Name: ${demoStudent.name}`);
  console.log(`   Access Number: ${demoStudent.accessNumber}`);
  console.log(`   Class: ${demoStudent.class} ${demoStudent.stream}`);
  console.log(`   Sponsorship Status: ${demoStudent.sponsorshipStatus}`);
  console.log(`   Total students in database: ${students.length}`);
} catch (error) {
  console.error('❌ Error saving demo student:', error);
}

