import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';

const router = Router();

// Get all clinic records
router.get('/', async (req, res) => {
  try {
    const records = await prisma.clinicRecord.findMany({
      orderBy: { visitDate: 'desc' }
    });
    res.json(records);
  } catch (error) {
    console.error('Error fetching clinic records:', error);
    res.status(500).json({ error: 'Failed to fetch clinic records' });
  }
});

// Get clinic records by date range
router.get('/date-range', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const records = await prisma.clinicRecord.findMany({
      where: {
        visitDate: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        }
      },
      orderBy: { visitDate: 'desc' }
    });
    res.json(records);
  } catch (error) {
    console.error('Error fetching clinic records by date range:', error);
    res.status(500).json({ error: 'Failed to fetch clinic records by date range' });
  }
});

// Get clinic record by ID
router.get('/:id', async (req, res) => {
  try {
    const record = await prisma.clinicRecord.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (!record) {
      return res.status(404).json({ error: 'Clinic record not found' });
    }
    res.json(record);
  } catch (error) {
    console.error('Error fetching clinic record:', error);
    res.status(500).json({ error: 'Failed to fetch clinic record' });
  }
});

// Create new clinic record
router.post('/', async (req, res) => {
  try {
    const {
      studentId,
      accessNumber,
      studentName,
      className,
      streamName,
      visitDate,
      visitTime,
      symptoms,
      diagnosis,
      treatment,
      medication,
      cost,
      nurseId,
      nurseName,
      followUpRequired,
      followUpDate,
      parentNotified,
      status,
      notes
    } = req.body;

    // Validate required fields
    if (!studentId || !studentName || !nurseId || !nurseName) {
      return res.status(400).json({ error: 'Student ID, student name, nurse ID, and nurse name are required' });
    }

    // Handle date parsing safely
    let parsedVisitDate;
    try {
      parsedVisitDate = new Date(visitDate);
      if (isNaN(parsedVisitDate.getTime())) {
        throw new Error('Invalid visit date format');
      }
    } catch (error) {
      console.error('Invalid visit date provided:', visitDate);
      return res.status(400).json({ error: 'Invalid visit date format' });
    }

    // Handle follow-up date parsing safely
    let parsedFollowUpDate = null;
    if (followUpDate) {
      try {
        parsedFollowUpDate = new Date(followUpDate);
        if (isNaN(parsedFollowUpDate.getTime())) {
          parsedFollowUpDate = null; // Set to null if invalid
        }
      } catch (error) {
        console.error('Invalid follow-up date provided:', followUpDate);
        parsedFollowUpDate = null;
      }
    }

    const recordData = {
      studentId,
      accessNumber: accessNumber || '',
      studentName,
      className: className || '',
      streamName: streamName || '',
      visitDate: parsedVisitDate,
      visitTime: visitTime || '',
      symptoms: symptoms || '',
      diagnosis: diagnosis || '',
      treatment: treatment || '',
      medication: medication || '',
      cost: cost ? parseFloat(cost) : 0,
      nurseId,
      nurseName,
      followUpRequired: followUpRequired || false,
      followUpDate: parsedFollowUpDate,
      parentNotified: parentNotified || false,
      status: status || 'resolved',
      notes: notes || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('Creating clinic record with data:', recordData);
    
    const record = await prisma.clinicRecord.create({
      data: recordData
    });

    console.log('Clinic record created successfully:', record.id);

    res.status(201).json(record);
  } catch (error) {
    console.error('Error creating clinic record:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ error: 'Failed to create clinic record' });
  }
});

// Update clinic record
router.put('/:id', async (req, res) => {
  try {
    const {
      symptoms,
      diagnosis,
      treatment,
      medication,
      cost,
      followUpRequired,
      followUpDate,
      status,
      notes
    } = req.body;

    const updateData: any = {
      updatedAt: new Date()
    };

    if (symptoms !== undefined) updateData.symptoms = symptoms;
    if (diagnosis !== undefined) updateData.diagnosis = diagnosis;
    if (treatment !== undefined) updateData.treatment = treatment;
    if (medication !== undefined) updateData.medication = medication;
    if (cost !== undefined) updateData.cost = parseFloat(cost);
    if (followUpRequired !== undefined) updateData.followUpRequired = followUpRequired;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (followUpDate !== undefined) updateData.followUpDate = followUpDate ? new Date(followUpDate) : null;

    const record = await prisma.clinicRecord.update({
      where: { id: parseInt(req.params.id) },
      data: updateData
    });

    res.json(record);
  } catch (error) {
    console.error('Error updating clinic record:', error);
    res.status(500).json({ error: 'Failed to update clinic record' });
  }
});

// Delete clinic record
router.delete('/:id', async (req, res) => {
  try {
    await prisma.clinicRecord.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Clinic record deleted successfully' });
  } catch (error) {
    console.error('Error deleting clinic record:', error);
    res.status(500).json({ error: 'Failed to delete clinic record' });
  }
});

export default router; 