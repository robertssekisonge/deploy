import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';

const router = Router();

// GET all timetables
router.get('/', async (req, res) => {
  try {
    const timetables = await prisma.timeTable.findMany({
      orderBy: [
        { day: 'asc' },
        { startTime: 'asc' }
      ]
    });
    console.log('GET /api/timetables - Returning', timetables.length, 'timetables');
    res.json(timetables);
  } catch (error) {
    console.error('Error fetching timetables:', error);
    res.status(500).json({ error: 'Failed to fetch timetables' });
  }
});

// GET timetables by teacher ID
router.get('/teacher/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const teacherTimetables = await prisma.timeTable.findMany({
      where: { teacherId },
      orderBy: [
        { day: 'asc' },
        { startTime: 'asc' }
      ]
    });
    console.log(`GET /api/timetables/teacher/${teacherId} - Returning`, teacherTimetables.length, 'timetables');
    res.json(teacherTimetables);
  } catch (error) {
    console.error('Error fetching teacher timetables:', error);
    res.status(500).json({ error: 'Failed to fetch teacher timetables' });
  }
});

// GET timetables by class and stream
router.get('/class/:className/stream/:streamName', async (req, res) => {
  try {
    const { className, streamName } = req.params;
    const classTimetables = await prisma.timeTable.findMany({
      where: {
        className,
        streamName
      },
      orderBy: [
        { day: 'asc' },
        { startTime: 'asc' }
      ]
    });
    console.log(`GET /api/timetables/class/${className}/stream/${streamName} - Returning`, classTimetables.length, 'timetables');
    res.json(classTimetables);
  } catch (error) {
    console.error('Error fetching class timetables:', error);
    res.status(500).json({ error: 'Failed to fetch class timetables' });
  }
});

// GET timetables by teacher, class, and stream
router.get('/teacher/:teacherId/class/:className/stream/:streamName', async (req, res) => {
  try {
    const { teacherId, className, streamName } = req.params;
    const filteredTimetables = await prisma.timeTable.findMany({
      where: {
        teacherId,
        className,
        streamName
      },
      orderBy: [
        { day: 'asc' },
        { startTime: 'asc' }
      ]
    });
    console.log(`GET /api/timetables/teacher/${teacherId}/class/${className}/stream/${streamName} - Returning`, filteredTimetables.length, 'timetables');
    res.json(filteredTimetables);
  } catch (error) {
    console.error('Error fetching class timetables:', error);
    res.status(500).json({ error: 'Failed to fetch class timetables' });
  }
});

// Create new timetable entry
router.post('/', async (req, res) => {
  try {
    const {
      day,
      startTime,
      endTime,
      subject,
      teacherId,
      teacherName,
      classId,
      streamId,
      className,
      streamName,
      room,
      duration
    } = req.body;

    const newTimetable = await prisma.timeTable.create({
      data: {
        day,
        startTime,
        endTime,
        subject,
        teacherId,
        teacherName,
        classId,
        streamId,
        className,
        streamName,
        room,
        duration
      }
    });

    console.log('Timetable created (database):', newTimetable);
    res.status(201).json(newTimetable);
  } catch (error) {
    console.error('Error creating timetable:', error);
    res.status(500).json({ error: 'Failed to create timetable' });
  }
});

// Update timetable entry
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const timetableId = parseInt(id);
    
    const updatedTimetable = await prisma.timeTable.update({
      where: { id: timetableId },
      data: {
        ...req.body,
        updatedAt: new Date()
      }
    });

    console.log('Timetable updated (database):', updatedTimetable);
    res.json(updatedTimetable);
  } catch (error) {
    console.error('Error updating timetable:', error);
    res.status(500).json({ error: 'Failed to update timetable' });
  }
});

// Delete timetable entry
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const timetableId = parseInt(id);
    
    const deletedTimetable = await prisma.timeTable.delete({
      where: { id: timetableId }
    });

    console.log('Timetable deleted (database):', deletedTimetable);
    res.json({ message: 'Timetable deleted successfully' });
  } catch (error) {
    console.error('Error deleting timetable:', error);
    res.status(500).json({ error: 'Failed to delete timetable' });
  }
});

export default router;
