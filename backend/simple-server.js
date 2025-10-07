const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Get all students
app.get('/api/students', async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Get enrolled students (active status)
app.get('/api/students/enrolled', async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' }
    });
    res.json(students);
  } catch (error) {
    console.error('Error fetching enrolled students:', error);
    res.status(500).json({ error: 'Failed to fetch enrolled students' });
  }
});

// Get dropped access numbers
app.get('/api/students/dropped-access-numbers', async (req, res) => {
  try {
    const droppedNumbers = await prisma.droppedAccessNumber.findMany({
      orderBy: { droppedAt: 'desc' }
    });
    res.json(droppedNumbers);
  } catch (error) {
    console.error('Error fetching dropped access numbers:', error);
    res.status(500).json({ error: 'Failed to fetch dropped access numbers' });
  }
});

// Delete student
app.delete('/api/students/:id', async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);
    
    if (!studentId || isNaN(studentId)) {
      return res.status(400).json({ error: 'Invalid student ID' });
    }

    // Get the student first to check their access number
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    console.log(`🗑️ Deleting student: ${student.name} (${student.accessNumber})`);

    // Check if this student is the highest numbered active student in their stream
    const allStudentsInStream = await prisma.student.findMany({
      where: {
        class: student.class,
        stream: student.stream,
        status: 'active'
      },
      orderBy: { accessNumber: 'desc' }
    });

    const isHighestNumbered = allStudentsInStream.length > 0 && 
      allStudentsInStream[0].accessNumber === student.accessNumber;

    if (isHighestNumbered) {
      console.log(`✅ ${student.accessNumber} goes back to main pool (highest number - can be reused)`);
    } else {
      // Add to dropped access numbers list
      await prisma.droppedAccessNumber.create({
        data: {
          accessNumber: student.accessNumber,
          class: student.class,
          stream: student.stream,
          droppedAt: new Date(),
          reason: 'Student deleted'
        }
      });
      console.log(`✅ Added ${student.accessNumber} to dropped list (not highest numbered in stream)`);
    }

    // Now delete the original student with explicit transaction
    await prisma.$transaction(async (tx) => {
      await tx.student.delete({
        where: { id: studentId }
      });
    });

    console.log(`✅ Student ${student.name} (${student.accessNumber}) deleted successfully`);

    res.json({ 
      message: 'Student deleted successfully',
      droppedAccessNumber: student.accessNumber,
      isHighestNumbered: isHighestNumbered
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// Flag student
app.patch('/api/students/:id/flag', async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);
    const { status, comment } = req.body;

    if (!studentId || isNaN(studentId)) {
      return res.status(400).json({ error: 'Invalid student ID' });
    }

    // Get the current student
    const currentStudent = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!currentStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }

    console.log(`🏷️ Flagging student: ${currentStudent.name} (${currentStudent.accessNumber}) as ${status}`);

    // SPECIAL CASE: Re-admitted students should NOT go to dropped list
    if (status === 're-admitted') {
      console.log(`✅ ${currentStudent.accessNumber} marked as re-admitted (kept for reference, not available for reuse)`);
    } else {
      // CORRECT LOGIC: Check if this is the highest numbered student in the stream
      const allStudentsInStream = await prisma.student.findMany({
        where: {
          class: currentStudent.class,
          stream: currentStudent.stream,
          status: 'active'
        },
        orderBy: { accessNumber: 'desc' }
      });

      const isHighestNumbered = allStudentsInStream.length > 0 && 
        allStudentsInStream[0].accessNumber === currentStudent.accessNumber;

      if (isHighestNumbered) {
        console.log(`✅ ${currentStudent.accessNumber} goes back to main pool (highest numbered in stream)`);
      } else {
        // Add to dropped access numbers list
        await prisma.droppedAccessNumber.create({
          data: {
            accessNumber: currentStudent.accessNumber,
            class: currentStudent.class,
            stream: currentStudent.stream,
            droppedAt: new Date(),
            reason: `Student flagged as ${status}`
          }
        });
        console.log(`✅ Added ${currentStudent.accessNumber} to dropped list (not highest numbered in stream)`);
      }
    }

    // Update the student status
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        status: status || 'left',
        flagComment: comment || '',
        updatedAt: new Date()
      }
    });

    console.log(`✅ Student ${currentStudent.name} flagged successfully as ${status}`);

    res.json({
      message: 'Student flagged successfully',
      student: updatedStudent,
      accessNumber: currentStudent.accessNumber
    });
  } catch (error) {
    console.error('Error flagging student:', error);
    res.status(500).json({ error: 'Failed to flag student' });
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📊 Students API: http://localhost:${PORT}/api/students`);
  console.log(`📊 Enrolled Students API: http://localhost:${PORT}/api/students/enrolled`);
  console.log(`📊 Dropped Access Numbers API: http://localhost:${PORT}/api/students/dropped-access-numbers`);
  console.log(`💳 Payments API: http://localhost:${PORT}/api/payments/process`);
  console.log(`📊 Payment Summary API: http://localhost:${PORT}/api/payments/summary/:studentId`);
  console.log(`🔍 Student Search API: http://localhost:${PORT}/api/students/search/:accessNumber`);
});