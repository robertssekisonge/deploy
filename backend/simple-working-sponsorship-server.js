const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.json({
    status: 'healthy',
    message: 'Simple sponsorship server is running',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Create sponsorship endpoint
app.post('/api/sponsorships', (req, res) => {
  try {
    const sponsorshipData = req.body;
    console.log('🎯 Creating sponsorship:', sponsorshipData);
    
    // Simulate database save
    const newSponsorship = {
      id: Date.now(),
      studentId: sponsorshipData.studentId,
      sponsorName: sponsorshipData.sponsorName,
      amount: sponsorshipData.amount,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };
    
    console.log('✅ Sponsorship created:', newSponsorship);
    res.status(201).json(newSponsorship);
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Failed to create sponsorship' });
  }
});

// Get sponsorships endpoint
app.get('/api/sponsorships', (req, res) => {
  console.log('📋 Getting sponsorships');
  res.json([]);
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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Simple sponsorship server running on http://localhost:${PORT}`);
  console.log(`🎯 Available endpoints:`);
  console.log(`   GET  /api/health`);
  console.log(`   POST /api/sponsorships`);
  console.log(`   GET  /api/sponsorships`);
  console.log(`   POST /api/payments/process`);
  console.log(`   GET  /api/payments/summary/:studentId`);
  console.log(`   GET  /api/students/search/:accessNumber`);
});
