const fs = require('fs');
const path = require('path');

console.log('🧪 Adding test student directly to students.json...');

const STUDENTS_FILE = path.join(__dirname, 'data', 'students.json');

// Read current students
let students = [];
if (fs.existsSync(STUDENTS_FILE)) {
  const studentsData = fs.readFileSync(STUDENTS_FILE, 'utf8');
  students = JSON.parse(studentsData);
  console.log(`📚 Current students: ${students.length}`);
}

// Add a new test student
const testStudent = {
  id: "test-student-001",
  name: "Test Student for Approval",
  class: "S3",
  stream: "A",
  accessNumber: "CA1720",
  age: 16,
  gender: "Male",
  phoneNumber: "1234567892",
  parentNames: "Test Parent",
  parentJob: "Engineer",
  parentContact: "0987654323",
  parentResidence: "Kampala",
  sponsorshipStory: "This is a test student to verify the approval flow works correctly.",
  sponsorshipStatus: "pending",
  needsSponsorship: true,
  photo: null,
  status: "active",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

students.push(testStudent);

// Save back to file
fs.writeFileSync(STUDENTS_FILE, JSON.stringify(students, null, 2));
console.log(`✅ Added test student: ${testStudent.name}`);
console.log(`📊 Total students: ${students.length}`);
console.log(`📊 Test student ID: ${testStudent.id}`);
console.log(`📊 Test student status: ${testStudent.sponsorshipStatus}`);

