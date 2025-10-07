import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';

const router = Router();

// Get all attendance records
router.get('/', async (req, res) => {
  try {
    const records = await prisma.attendance.findMany({
      orderBy: { date: 'desc' }
    });
    res.json(records);
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
});

// Get attendance by student ID
router.get('/student/:studentId', async (req, res) => {
  try {
    const records = await prisma.attendance.findMany({
      where: { studentId: req.params.studentId },
      orderBy: { date: 'desc' }
    });
    res.json(records);
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({ error: 'Failed to fetch student attendance' });
  }
});

// Create new attendance record (with duplicate handling)
router.post('/', async (req, res) => {
  try {
    const {
      studentId,
      date,
      time,
      status,
      teacherId,
      teacherName,
      remarks,
      notificationSent
    } = req.body;

    // Validate required fields
    if (!studentId || !date || !status || !teacherId || !teacherName) {
      return res.status(400).json({ error: 'Student ID, date, status, teacher ID, and teacher name are required' });
    }

    const studentIdStr = studentId.toString();
    const dateObj = new Date(date);

    // Check if attendance already exists for this student on this date
    const existingRecord = await prisma.attendance.findFirst({
      where: {
        studentId: studentIdStr,
        date: {
          gte: new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()),
          lt: new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate() + 1)
        }
      }
    });

    let record;

    if (existingRecord) {
      // Update existing record
      record = await prisma.attendance.update({
        where: { id: existingRecord.id },
        data: {
          status,
          time: time || new Date().toLocaleTimeString(),
          teacherId: teacherId.toString(),
          teacherName,
          remarks,
          notificationSent: notificationSent || false,
          updatedAt: new Date()
        }
      });
      console.log(`Updated existing attendance record for student ${studentIdStr}`);
    } else {
      // Create new record
      const recordData = {
        studentId: studentIdStr,
        date: dateObj,
        time: time || new Date().toLocaleTimeString(),
        status,
        teacherId: teacherId.toString(),
        teacherName,
        remarks,
        notificationSent: notificationSent || false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      record = await prisma.attendance.create({
        data: recordData
      });
      console.log(`Created new attendance record for student ${studentIdStr}`);
    }

    res.status(201).json(record);
  } catch (error) {
    console.error('Error creating/updating attendance record:', error);
    res.status(500).json({ error: 'Failed to create/update attendance record' });
  }
});

// Update attendance record
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      remarks,
      notificationSent
    } = req.body;

    console.log('Updating attendance record with ID:', id);
    console.log('Update data:', { status, remarks, notificationSent });

    // Handle ID conversion for PostgreSQL
    const recordId = parseInt(id);
    if (isNaN(recordId)) {
      return res.status(400).json({ error: 'Invalid attendance record ID' });
    }
    console.log('Record ID:', recordId);

    const updateData: any = {
      updatedAt: new Date()
    };

    if (status) updateData.status = status;
    if (remarks !== undefined) updateData.remarks = remarks;
    if (notificationSent !== undefined) updateData.notificationSent = notificationSent;

    console.log('Final update data:', updateData);

    // Try to find the record first to see if it exists
    const existingRecord = await prisma.attendance.findFirst({
      where: { id: recordId }
    });

    if (!existingRecord) {
      console.log('Record not found with ID:', recordId);
      return res.status(404).json({ 
        error: 'Attendance record not found',
        requestedId: id,
        processedId: recordId
      });
    }

    console.log('Found existing record:', existingRecord);

    const record = await prisma.attendance.update({
      where: { id: recordId },
      data: updateData
    });

    console.log('Successfully updated record:', record);
    res.json(record);
  } catch (error) {
    console.error('Error updating attendance record:', error);
    res.status(500).json({ 
      error: 'Failed to update attendance record',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete attendance record
router.delete('/:id', async (req, res) => {
  try {
    await prisma.attendance.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error('Error deleting attendance record:', error);
    res.status(500).json({ error: 'Failed to delete attendance record' });
  }
});

// Get attendance by date
router.get('/date/:date', async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const records = await prisma.attendance.findMany({
      where: {
        date: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lt: new Date(date.setHours(23, 59, 59, 999))
        }
      },
      orderBy: { time: 'asc' }
    });
    res.json(records);
  } catch (error) {
    console.error('Error fetching attendance by date:', error);
    res.status(500).json({ error: 'Failed to fetch attendance by date' });
  }
});

export default router;
 
// Ensure daily attendance placeholders exist for all students for a specific date
// POST /api/attendance/ensure-daily { date?: string }
// Creates a record with status 'not_marked' for any student missing an entry that day
router.post('/ensure-daily', async (req, res) => {
  try {
    const inputDate = req.body?.date ? new Date(req.body.date) : new Date();
    const dayStart = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());
    const dayEnd = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate() + 1);

    // Fetch all students
    const students = await prisma.student.findMany();

    let createdCount = 0;
    for (const student of students) {
      const existing = await prisma.attendance.findFirst({
        where: {
          studentId: student.id.toString(),
          date: { gte: dayStart, lt: dayEnd }
        }
      });
      if (!existing) {
        await prisma.attendance.create({
          data: {
            studentId: student.id.toString(),
            date: dayStart,
            time: new Date().toLocaleTimeString(),
            status: 'not_marked',
            teacherId: 'system',
            teacherName: 'System',
            remarks: 'Auto-generated placeholder for accountability',
            notificationSent: false,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        createdCount++;
      }
    }

    res.json({ success: true, date: dayStart.toISOString().slice(0,10), created: createdCount, totalStudents: students.length });
  } catch (error) {
    console.error('Error ensuring daily attendance:', error);
    res.status(500).json({ error: 'Failed to ensure daily attendance' });
  }
});