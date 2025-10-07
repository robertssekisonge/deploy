import express from 'express';
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';

const router = Router();

// Get all sponsorships
router.get('/', async (req, res) => {
  try {
    console.log('Attempting to fetch sponsorships...');
    const sponsorships = await prisma.sponsorship.findMany();
    console.log('Sponsorships fetched successfully:', sponsorships.length, 'sponsorships');
    console.log('📊 Sponsorships details:', sponsorships.map(s => ({
      id: s.id,
      studentId: s.studentId,
      status: s.status,
      sponsorName: s.sponsorName
    })));
    res.json(sponsorships);
  } catch (error) {
    console.error('Error fetching sponsorships:', error);
    res.status(500).json({ error: 'Failed to fetch sponsorships', details: (error as any).message });
  }
});

// Get sponsorship by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sponsorship = await prisma.sponsorship.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!sponsorship) {
      return res.status(404).json({ error: 'Sponsorship not found' });
    }
    
    res.json(sponsorship);
  } catch (error) {
    console.error('Error fetching sponsorship:', error);
    res.status(500).json({ error: 'Failed to fetch sponsorship' });
  }
});

// Create new sponsorship
router.post('/', async (req, res) => {
  try {
    const {
      studentId,
      sponsorId,
      sponsorName,
      sponsorEmail,
      sponsorPhone,
      sponsorCountry,
      sponsorCity,
      sponsorRelationship,
      amount,
      duration,
      sponsorshipStartDate,
      description,
      paymentSchedule,
      preferredContactMethod
    } = req.body;

    console.log('Received sponsorship data:', req.body);

    // Validate required fields
    if (!studentId || !sponsorName || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create sponsorship
    const sponsorship = await prisma.sponsorship.create({
      data: {
        studentId: parseInt(studentId),
        sponsorId: sponsorId || null,
        sponsorName,
        sponsorCountry: sponsorCountry || 'Uganda',
        amount: parseFloat(amount),
        type: sponsorRelationship || 'individual',
        status: 'pending',
        startDate: sponsorshipStartDate ? new Date(sponsorshipStartDate) : new Date(),
        endDate: new Date(Date.now() + (duration || 12) * 30 * 24 * 60 * 60 * 1000),
        description: description || ''
      }
    });

    // Update student status to indicate they are under sponsorship review
    // This prevents them from reverting to 'available' after refresh
    await prisma.student.update({
      where: { id: parseInt(studentId) },
      data: { sponsorshipStatus: 'under-sponsorship-review' }
    });

    console.log('✅ Student status updated to under-sponsorship-review for student:', studentId);

    console.log('✅ Sponsorship created successfully:', sponsorship);
    console.log('📊 Sponsorship details:', {
      id: sponsorship.id,
      studentId: sponsorship.studentId,
      status: sponsorship.status,
      sponsorName: sponsorship.sponsorName
    });

    res.status(201).json(sponsorship);
  } catch (error) {
    console.error('Error creating sponsorship:', error);
    res.status(500).json({ error: 'Failed to create sponsorship', details: (error as any).message });
  }
});

// Update sponsorship
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.createdAt;

    const sponsorship = await prisma.sponsorship.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json(sponsorship);
  } catch (error) {
    console.error('Error updating sponsorship:', error);
    res.status(500).json({ error: 'Failed to update sponsorship' });
  }
});

// Delete sponsorship
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.sponsorship.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'Sponsorship deleted successfully' });
  } catch (error) {
    console.error('Error deleting sponsorship:', error);
    res.status(500).json({ error: 'Failed to delete sponsorship' });
  }
});

// Coordinator approve sponsorship
router.post('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Approving sponsorship with ID:', id, 'Type:', typeof id);
    
    // First check if sponsorship exists
    const existingSponsorship = await prisma.sponsorship.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingSponsorship) {
      console.log('❌ Sponsorship not found with ID:', id);
      return res.status(404).json({ error: 'Sponsorship not found', id: id });
    }
    
    console.log('✅ Found sponsorship:', existingSponsorship);
    
    const sponsorship = await prisma.sponsorship.update({
      where: { id: parseInt(id) },
      data: { status: 'coordinator-approved' }
    });
    
    console.log('✅ Sponsorship approved successfully:', sponsorship);
    res.json(sponsorship);
  } catch (error) {
    console.error('❌ Error approving sponsorship:', error);
    res.status(500).json({ error: 'Failed to approve sponsorship', details: (error as any).message });
  }
});

// Reject sponsorship
router.post('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('❌ Rejecting sponsorship with ID:', id, 'Type:', typeof id);
    
    // First check if sponsorship exists
    const existingSponsorship = await prisma.sponsorship.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingSponsorship) {
      console.log('❌ Sponsorship not found with ID:', id);
      return res.status(404).json({ error: 'Sponsorship not found', id: id });
    }
    
    console.log('✅ Found sponsorship to reject:', existingSponsorship);
    
    const sponsorship = await prisma.sponsorship.update({
      where: { id: parseInt(id) },
      data: { status: 'rejected' }
    });
    
    console.log('✅ Sponsorship rejected successfully:', sponsorship);
    
    // Also update the student's sponsorshipStatus back to 'available-for-sponsors'
    const student = await prisma.student.findUnique({
      where: { id: sponsorship.studentId }
    });
    
    if (student) {
      console.log('👤 Student found for rejection status update:', student);
      
      const updatedStudent = await prisma.student.update({
        where: { id: sponsorship.studentId },
        data: { 
          sponsorshipStatus: 'available-for-sponsors'
        }
      });
      
      console.log('✅ Student status updated to available-for-sponsors:', updatedStudent);
    } else {
      console.log('❌ Student not found with ID:', sponsorship.studentId);
    }
    
    res.json(sponsorship);
  } catch (error) {
    console.error('❌ Error rejecting sponsorship:', error);
    res.status(500).json({ error: 'Failed to reject sponsorship', details: (error as any).message });
  }
});

// Complete sponsorship
router.post('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const sponsorship = await prisma.sponsorship.update({
      where: { id: parseInt(id) },
      data: { status: 'completed' }
    });
    res.json(sponsorship);
  } catch (error) {
    console.error('Error completing sponsorship:', error);
    res.status(500).json({ error: 'Failed to complete sponsorship' });
  }
});

// Admin approve sponsored
router.post('/:id/approve-sponsored', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🎯 Admin approving sponsored sponsorship with ID:', id, 'Type:', typeof id);
    
    // First check if sponsorship exists
    const existingSponsorship = await prisma.sponsorship.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingSponsorship) {
      console.log('❌ Sponsorship not found with ID:', id);
      return res.status(404).json({ error: 'Sponsorship not found', id: id });
    }
    
    console.log('✅ Found sponsorship:', existingSponsorship);
    
    const sponsorship = await prisma.sponsorship.update({
      where: { id: parseInt(id) },
      data: { status: 'sponsored' }
    });
    
    console.log('✅ Sponsorship approved by admin successfully:', sponsorship);
    
    // Also update the student's sponsorshipStatus to 'sponsored'
    // First, get the student to check their admittedBy status
    const student = await prisma.student.findUnique({
      where: { id: sponsorship.studentId }
    });
    
    if (student) {
      console.log('👤 Student found for status update:', student);
      console.log('📊 Student admittedBy:', student.admittedBy);
      
      // Update student status to 'sponsored' (this moves them from Box 5 to Box 6/7)
      const updatedStudent = await prisma.student.update({
        where: { id: sponsorship.studentId },
        data: {
          sponsorshipStatus: 'sponsored',
          admittedBy: student.admittedBy || 'admin'
        }
      });
      
      console.log('✅ Student status updated to sponsored:', updatedStudent.sponsorshipStatus);
      console.log('✅ Student will move from Box 5 to Box 6/7');
    } else {
      console.log('❌ Student not found with ID:', sponsorship.studentId);
    }
    
    res.json(sponsorship);
  } catch (error) {
    console.error('❌ Error approving sponsored:', error);
    res.status(500).json({ error: 'Failed to approve sponsored', details: (error as any).message });
  }
});

// Make student available for sponsors
router.post('/student/:studentId/make-available', async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await prisma.student.update({
      where: { id: parseInt(studentId) },
      data: { 
        sponsorshipStatus: 'available-for-sponsors',
        updatedAt: new Date()
      }
    });
    res.json({ message: 'Student is now available for sponsors', student });
  } catch (error) {
    console.error('Error making student available:', error);
    res.status(500).json({ error: 'Failed to make student available for sponsors' });
  }
});

// Make student eligible
router.post('/student/:studentId/make-eligible', async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await prisma.student.update({
      where: { id: parseInt(studentId) },
      data: { 
        sponsorshipStatus: 'eligible',
        updatedAt: new Date()
      }
    });
    res.json({ message: 'Student is now eligible for sponsorship', student });
  } catch (error) {
    console.error('Error making student eligible:', error);
    res.status(500).json({ error: 'Failed to make student eligible for sponsorship' });
  }
});

export default router;

