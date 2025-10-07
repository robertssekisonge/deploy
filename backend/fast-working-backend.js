const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Fast in-memory data storage - no database needed
let users = [
  { id: '1', name: 'kato', email: 'parent@s', studentIds: '[]', status: 'inactive', role: 'PARENT' }
];

let students = [
  { id: '1', name: 'Alice Johnson', accessNumber: 'AA0001', class: 'Senior 1', stream: 'A', status: 'active' },
  { id: '2', name: 'Bob Smith', accessNumber: 'AA0002', class: 'Senior 1', stream: 'A', status: 'active' },
  { id: '3', name: 'Carol Davis', accessNumber: 'AA0003', class: 'Senior 1', stream: 'A', status: 'active' },
  { id: '4', name: 'David Wilson', accessNumber: 'AA0004', class: 'Senior 1', stream: 'A', status: 'active' }
];

// Fast middleware setup
app.use(cors());
app.use(express.json());

// Fast health check
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Fast Backend is running smoothly!', 
    timestamp: new Date().toISOString(),
    usersCount: users.length,
    studentsCount: students.length,
    status: 'healthy'
  });
});

// Fast users endpoint
app.get('/api/users', (req, res) => {
  try {
    const parentUsers = users.filter(user => user.role === 'PARENT');
    res.json(parentUsers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Fast students endpoint
app.get('/api/students', (req, res) => {
  try {
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Fast parent assignment endpoint
app.post('/api/users/:id/assign-students', (req, res) => {
  try {
    const { id } = req.params;
    const { studentIds } = req.body;
    
    if (!Array.isArray(studentIds)) {
      return res.status(400).json({ error: 'studentIds must be an array' });
    }

    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fast update - no database needed
    users[userIndex] = {
      ...users[userIndex],
      studentIds: JSON.stringify(studentIds),
      status: studentIds.length > 0 ? 'active' : 'inactive',
      updatedAt: new Date()
    };

    res.json({
      message: 'Students assigned successfully!',
      user: users[userIndex],
      assignedStudents: studentIds
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign students' });
  }
});

// Fast server startup
app.listen(PORT, () => {
  console.log(`🚀 Fast Backend running on http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/api/health`);
  console.log(`👥 Users: http://localhost:${PORT}/api/users`);
  console.log(`📚 Students: http://localhost:${PORT}/api/students`);
  console.log(`🔗 Assign: http://localhost:${PORT}/api/users/:id/assign-students`);
  console.log(`\n⚡ Fast, lightweight, no database needed!`);
  console.log(`📝 Loaded: ${users.length} users, ${students.length} students`);
});

console.log('✅ Fast backend setup complete');




