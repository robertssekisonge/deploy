import express from 'express';
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';

const router = Router();

// Get all financial records
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all financial records...');
    const records = await prisma.financialRecord.findMany({
      orderBy: { createdAt: 'desc' }
    });
    console.log(`Found ${records.length} financial records`);
    res.json(records);
  } catch (error) {
    console.error('Error fetching financial records:', error);
    res.status(500).json({ error: 'Failed to fetch financial records', details: error.message });
  }
});

// Get financial records for a specific student
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log(`Fetching financial records for student: ${studentId}`);
    
    const records = await prisma.financialRecord.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Found ${records.length} records for student ${studentId}`);
    res.json(records);
  } catch (error) {
    console.error('Error fetching student financial records:', error);
    res.status(500).json({ error: 'Failed to fetch student financial records', details: error.message });
  }
});

// Create a new financial record
router.post('/', async (req, res) => {
  try {
    const recordData = req.body;
    console.log('Creating new financial record:', recordData);
    
    const newRecord = await prisma.financialRecord.create({
      data: {
        studentId: recordData.studentId,
        type: recordData.type,
        billingType: recordData.billingType,
        billingAmount: recordData.billingAmount,
        amount: recordData.amount,
        description: recordData.description,
        date: new Date(recordData.date),
        paymentDate: recordData.paymentDate ? new Date(recordData.paymentDate) : null,
        paymentTime: recordData.paymentTime,
        paymentMethod: recordData.paymentMethod,
        status: recordData.status,
        receiptNumber: recordData.receiptNumber,
        balance: recordData.balance || 0
      }
    });
    
    console.log('Financial record created successfully:', newRecord);
    res.status(201).json(newRecord);
  } catch (error) {
    console.error('Error creating financial record:', error);
    res.status(500).json({ error: 'Failed to create financial record', details: error.message });
  }
});

// Update a financial record
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    console.log(`Updating financial record ${id}:`, updateData);
    
    const updatedRecord = await prisma.financialRecord.update({
      where: { id: parseInt(id) },
      data: {
        ...updateData,
        paymentDate: updateData.paymentDate ? new Date(updateData.paymentDate) : undefined,
        date: updateData.date ? new Date(updateData.date) : undefined,
        updatedAt: new Date()
      }
    });
    
    console.log('Financial record updated successfully:', updatedRecord);
    res.json(updatedRecord);
  } catch (error) {
    console.error('Error updating financial record:', error);
    res.status(500).json({ error: 'Failed to update financial record', details: error.message });
  }
});

// Delete a financial record
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Deleting financial record ${id}`);
    
    await prisma.financialRecord.delete({
      where: { id: parseInt(id) }
    });
    
    console.log('Financial record deleted successfully');
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting financial record:', error);
    res.status(500).json({ error: 'Failed to delete financial record', details: error.message });
  }
});

// Get financial summary for a student
router.get('/summary/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log(`Fetching financial summary for student: ${studentId}`);
    
    const records = await prisma.financialRecord.findMany({
      where: { studentId }
    });
    
    const summary = {
      totalFees: records.filter(r => r.type === 'fee').reduce((sum, r) => sum + r.amount, 0),
      totalPaid: records.filter(r => r.type === 'payment' && r.status === 'paid').reduce((sum, r) => sum + r.amount, 0),
      totalPending: records.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0),
      totalOverdue: records.filter(r => r.status === 'overdue').reduce((sum, r) => sum + r.amount, 0),
      balance: 0,
      recordCount: records.length
    };
    
    summary.balance = summary.totalFees - summary.totalPaid;
    
    console.log('Financial summary:', summary);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    res.status(500).json({ error: 'Failed to fetch financial summary', details: error.message });
  }
});

export default router;
