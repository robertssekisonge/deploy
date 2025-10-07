const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  res.json({ 
    message: 'Test server is running!', 
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Sponsorships endpoint
app.get('/api/sponsorships', (req, res) => {
  console.log('Sponsorships requested');
  res.json([]);
});

// Start server
app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Test server running on http://127.0.0.1:${PORT}`);
  console.log(`🎯 Available endpoints:`);
  console.log(`   GET  /api/health`);
  console.log(`   GET  /api/sponsorships`);
});

// Error handling
app.on('error', (error) => {
  console.error('❌ Server error:', error);
});
