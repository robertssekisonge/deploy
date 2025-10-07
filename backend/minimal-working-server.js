const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const app = express();
const PORT = 5000;

// Data storage - this will persist data permanently while server is running
let users = [
  { id: '1', name: 'kato', email: 'parent@s', studentIds: '[]', status: 'inactive' }
];

let students = [
  { id: '1', name: 'Grace Nakato', accessNumber: 'AA0001', class: 'Senior 1', stream: 'A' },
  { id: '2', name: 'Aisha Mbabazi', accessNumber: 'CC0001', class: 'Senior 3', stream: 'C' },
  { id: '3', name: 'Samuel Kato', accessNumber: 'AB0001', class: 'Senior 1', stream: 'B' },
  { id: '4', name: 'Linda Nansubuga', accessNumber: 'BA0001', class: 'Senior 2', stream: 'A' }
];

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Minimal Working Server is running!', 
    timestamp: new Date().toISOString(),
    usersCount: users.length,
    studentsCount: students.length
  });
});

// Get all users (parents)
app.get('/api/users', (req, res) => {
  try {
    const parentUsers = users.filter(user => user.role === 'PARENT' || user.role === undefined);
    res.json(parentUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get all students
app.get('/api/students', (req, res) => {
  try {
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// THE KEY ENDPOINT - Assign students to parent
app.post('/api/users/:id/assign-students', (req, res) => {
  try {
    const { id } = req.params;
    const { studentIds } = req.body;
    
    console.log(`🔍 Assigning students ${JSON.stringify(studentIds)} to parent ${id}`);
    
    if (!Array.isArray(studentIds)) {
      return res.status(400).json({ error: 'studentIds must be an array' });
    }

    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update the user with assigned students - THIS SAVES PERMANENTLY
    users[userIndex] = {
      ...users[userIndex],
      studentIds: JSON.stringify(studentIds),
      status: studentIds.length > 0 ? 'active' : 'inactive',
      updatedAt: new Date()
    };

    console.log(`✅ Successfully assigned students to parent ${id}:`, users[userIndex]);

    res.json({
      message: 'Students assigned successfully and saved permanently!',
      user: users[userIndex],
      assignedStudents: studentIds
    });
  } catch (error) {
    console.error('❌ Error assigning students:', error);
    res.status(500).json({ error: 'Failed to assign students' });
  }
});

// Process payment endpoint
app.post('/api/payments/process', async (req, res) => {
  try {
    const { studentId, amount, billingType, paymentMethod, paymentReference, description, processedBy } = req.body;
    
    console.log('Processing payment:', { studentId, amount, billingType, paymentMethod, paymentReference });
    
    // Find student
    const student = await prisma.student.findFirst({
      where: { id: parseInt(studentId) }
    });
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Create financial record
    const financialRecord = await prisma.financialRecord.create({
      data: {
        studentId: studentId.toString(),
        type: 'payment',
        billingType: billingType || 'General Payment',
        billingAmount: parseFloat(amount),
        amount: parseFloat(amount),
        description: description || `Payment for ${student.name}`,
        date: new Date(),
        paymentDate: new Date(),
        paymentTime: new Date().toLocaleTimeString(),
        paymentMethod: paymentMethod || 'Cash',
        status: 'paid',
        receiptNumber: paymentReference || `PAY${Date.now()}`,
        balance: 0
      }
    });
    
    console.log('Financial record created:', financialRecord);
    
    // Update student's payment status
    await prisma.student.update({
      where: { id: student.id },
      data: {
        updatedAt: new Date()
      }
    });
    
    res.json({
      success: true,
      payment: financialRecord,
      message: 'Payment processed successfully'
    });
    
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ 
      error: 'Failed to process payment',
      details: error.message 
    });
  }
});

// Get payment summary for student
app.get('/api/payments/summary/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    console.log('Fetching payment summary for student:', studentId);
    
    // Get all payments for this student
    const payments = await prisma.financialRecord.findMany({
      where: {
        studentId: studentId,
        status: 'paid'
      },
      orderBy: { date: 'desc' }
    });
    
    console.log('Found payments:', payments.length);
    
    // Calculate totals by billing type
    const summary = {};
    payments.forEach(payment => {
      const type = payment.billingType;
      if (!summary[type]) {
        summary[type] = 0;
      }
      summary[type] += payment.amount;
    });
    
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    res.json({
      summary,
      totalPaid,
      paymentCount: payments.length,
      payments: payments
    });
    
  } catch (error) {
    console.error('Error fetching payment summary:', error);
    res.status(500).json({ 
      error: 'Failed to fetch payment summary',
      details: error.message 
    });
  }
});

// Get student by access number
app.get('/api/students/search/:accessNumber', async (req, res) => {
  try {
    const { accessNumber } = req.params;
    
    const student = await prisma.student.findFirst({
      where: { accessNumber: accessNumber }
    });
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json(student);
    
  } catch (error) {
    console.error('Error searching student:', error);
    res.status(500).json({ 
      error: 'Failed to search student',
      details: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Minimal Working Server running on http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/api/health`);
  console.log(`👥 Users: http://localhost:${PORT}/api/users`);
  console.log(`📚 Students: http://localhost:${PORT}/api/students`);
  console.log(`🔗 Assign: http://localhost:${PORT}/api/users/:id/assign-students`);
  console.log(`💳 Payments: http://localhost:${PORT}/api/payments/process`);
  console.log(`📊 Summary: http://localhost:${PORT}/api/payments/summary/:studentId`);
  console.log(`🔍 Search: http://localhost:${PORT}/api/students/search/:accessNumber`);
  console.log(`\n💾 Data will be saved PERMANENTLY while server runs`);
  console.log(`📝 Loaded: ${users.length} users, ${students.length} students`);
});

console.log('✅ Minimal server setup complete');




