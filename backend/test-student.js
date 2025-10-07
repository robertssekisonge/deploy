// Quick test to add sample student with fees
const sampleStudent = {
  name: "John Doe",
  accessNumber: "STU001",
  age: 16,
  class: "Senior 1",
  stream: "Science",
  gender: "Male",
  phone: "+256700123456",
  email: "john.doe@example.com",
  parentName: "Jane Doe",
  parentPhone: "+256700123457",
  parentEmail: "jane.doe@example.com",
  totalFees: 500000,
  feesPaid: 150000,
  feeBalance: 350000
};

console.log('Sample student data:', sampleStudent);
console.log('Balance percentage:', ((sampleStudent.feeBalance / sampleStudent.totalFees) * 100).toFixed(1) + '%');







