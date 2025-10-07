import { Router } from 'express';

const router = Router();

// Define classes and streams structure
const classesData = [
  {
    id: '1',
    name: 'Senior 1',
    level: 'Secondary',
    subjects: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Literature'],
    streams: [
      { id: '1a', name: 'A', subjects: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Literature'] },
      { id: '1b', name: 'B', subjects: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Literature'] },
      { id: '1c', name: 'C', subjects: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Literature'] }
    ]
  },
  {
    id: '2',
    name: 'Senior 2',
    level: 'Secondary',
    subjects: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Literature'],
    streams: [
      { id: '2a', name: 'A', subjects: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Literature'] },
      { id: '2b', name: 'B', subjects: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Literature'] },
      { id: '2c', name: 'C', subjects: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Literature'] }
    ]
  },
  {
    id: '3',
    name: 'Senior 3',
    level: 'Secondary',
    subjects: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Literature'],
    streams: [
      { id: '3a', name: 'A', subjects: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Literature'] },
      { id: '3b', name: 'B', subjects: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Literature'] },
      { id: '3c', name: 'C', subjects: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Literature'] }
    ]
  },
  {
    id: '4',
    name: 'Senior 4',
    level: 'Secondary',
    subjects: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Literature'],
    streams: [
      { id: '4a', name: 'A', subjects: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Literature'] },
      { id: '4b', name: 'B', subjects: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Literature'] },
      { id: '4c', name: 'C', subjects: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Literature'] }
    ]
  },
  {
    id: '5',
    name: 'Senior 5',
    level: 'Advanced',
    subjects: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Literature', 'Economics', 'Computer Science'],
    streams: [
      { id: '5a', name: 'Arts', subjects: ['English', 'History', 'Geography', 'Literature', 'Economics', 'Religious Education'] },
      { id: '5s', name: 'Sciences', subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science'] }
    ]
  },
  {
    id: '6',
    name: 'Senior 6',
    level: 'Advanced',
    subjects: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Literature', 'Economics', 'Computer Science'],
    streams: [
      { id: '6a', name: 'Arts', subjects: ['English', 'History', 'Geography', 'Literature', 'Economics', 'Religious Education'] },
      { id: '6s', name: 'Sciences', subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science'] }
    ]
  }
];

// Get all classes with their streams
router.get('/', (req, res) => {
  try {
    res.json(classesData);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// Get a specific class by ID
router.get('/:id', (req, res) => {
  try {
    const classId = req.params.id;
    const classData = classesData.find(cls => cls.id === classId);
    
    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    res.json(classData);
  } catch (error) {
    console.error('Error fetching class:', error);
    res.status(500).json({ error: 'Failed to fetch class' });
  }
});

export default router; 