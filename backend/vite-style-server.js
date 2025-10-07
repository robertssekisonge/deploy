const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5174; // Using port 5174 since 5173 is already working

// Middleware - same as Vite
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://0.0.0.0:5173'],
  credentials: true
}));
app.use(express.json());

// In-memory storage
let sponsorships = [];
let students = [
  {
    id: '1',
    name: 'Nakato Grace',
    accessNumber: 'AA0001',
    class: 'Senior 1',
    stream: 'A',
    age: 13,
    sponsorshipStatus: 'available-for-sponsors',
    sponsorshipStory: 'Grace dreams of becoming a doctor to help her family struggles to provide for her education.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.json({
    status: 'healthy',
    message: 'Vite-style sponsorship server is running',
    timestamp: new Date().toISOString(),
    port: PORT,
    data: {
      sponsorships: sponsorships.length,
      students: students.length
    }
  });
});

// Create sponsorship endpoint
app.post('/api/sponsorships', (req, res) => {
  try {
    const sponsorshipData = req.body;
    console.log('🎯 Creating sponsorship:', sponsorshipData);
    
    const newSponsorship = {
      id: 'sponsorship-' + Date.now(),
      ...sponsorshipData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    sponsorships.push(newSponsorship);
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
  res.json(sponsorships);
});

// Get students endpoint
app.get('/api/students', (req, res) => {
  console.log('📚 Getting students');
  res.json(students);
});

// Get available students for sponsors
app.get('/api/students/available-for-sponsors', (req, res) => {
  console.log('🎯 Getting available students');
  const availableStudents = students.filter(s => s.sponsorshipStatus === 'available-for-sponsors');
  res.json(availableStudents);
});

// Get pending sponsorships
app.get('/api/sponsorships/pending', (req, res) => {
  console.log('⏳ Getting pending sponsorships');
  const pendingSponsorships = sponsorships.filter(s => s.status === 'pending');
  res.json(pendingSponsorships);
});

// Update sponsorship
app.put('/api/sponsorships/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    console.log(`🔄 Updating sponsorship ${id}:`, updates);
    
    const sponsorshipIndex = sponsorships.findIndex(s => s.id === id);
    if (sponsorshipIndex === -1) {
      return res.status(404).json({ error: 'Sponsorship not found' });
    }
    
    sponsorships[sponsorshipIndex] = {
      ...sponsorships[sponsorshipIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    console.log('✅ Sponsorship updated:', sponsorships[sponsorshipIndex]);
    res.json(sponsorships[sponsorshipIndex]);
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Failed to update sponsorship' });
  }
});

// Weekly reports endpoint (to fix the 404 error)
app.get('/api/reports/weekly', (req, res) => {
  console.log('📊 Getting weekly reports');
  res.json([]);
});

// Start server - using same config as Vite
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Vite-style sponsorship server running on http://0.0.0.0:${PORT}`);
  console.log(`🎯 Available endpoints:`);
  console.log(`   GET  /api/health`);
  console.log(`   POST /api/sponsorships`);
  console.log(`   GET  /api/sponsorships`);
  console.log(`   GET  /api/students`);
  console.log(`   GET  /api/students/available-for-sponsors`);
  console.log(`   GET  /api/sponsorships/pending`);
  console.log(`   PUT  /api/sponsorships/:id`);
  console.log(`   GET  /api/reports/weekly`);
});

// Error handling
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});
