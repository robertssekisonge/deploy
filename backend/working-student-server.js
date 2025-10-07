const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const app = express();
const PORT = 5000; // Using port 5000 for payment processing

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Data file paths
const STUDENTS_FILE = path.join(__dirname, 'data', 'students.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Load students
let students = [];
if (fs.existsSync(STUDENTS_FILE)) {
  try {
    const data = fs.readFileSync(STUDENTS_FILE, 'utf8');
    students = JSON.parse(data);
    console.log(`📚 Loaded ${students.length} students from file`);
  } catch (error) {
    console.log('📚 Starting with empty students list');
    students = [];
  }
}

// Save students function
function saveStudents() {
  try {
    fs.writeFileSync(STUDENTS_FILE, JSON.stringify(students, null, 2));
    console.log('💾 Students saved to file');
  } catch (error) {
    console.error('❌ Error saving students:', error);
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Student server is running!',
    studentsCount: students.length 
  });
});

// Get all students
app.get('/api/students', (req, res) => {
  res.json(students);
});

// Create new student
app.post('/api/students', (req, res) => {
  try {
    console.log('📥 Received student data:', req.body);
    
    const newStudent = {
      id: `ST${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    students.push(newStudent);
    saveStudents();
    
    console.log('✅ Student saved successfully:', newStudent.name);
    
    res.status(201).json({
      success: true,
      message: `Student "${newStudent.name}" saved successfully!`,
      student: newStudent
    });
  } catch (error) {
    console.error('❌ Error creating student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create student',
      error: error.message
    });
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
  console.log(`🚀 Student server running on http://localhost:${PORT}`);
  console.log(`📊 Current students: ${students.length}`);
  console.log('🎯 Available endpoints:');
  console.log(`   GET  /api/health`);
  console.log(`   GET  /api/students`);
  console.log(`   POST /api/students`);
  console.log(`   POST /api/payments/process`);
  console.log(`   GET  /api/payments/summary/:studentId`);
  console.log(`   GET  /api/students/search/:accessNumber`);
});

