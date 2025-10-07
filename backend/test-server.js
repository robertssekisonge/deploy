const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Test server is running!', 
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.get('/api/sponsorships', (req, res) => {
  res.json([]);
});

app.post('/api/sponsorships', (req, res) => {
  console.log('Received sponsorship data:', req.body);
  res.status(201).json({
    id: Date.now().toString(),
    ...req.body,
    status: 'pending',
    createdAt: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/api/health`);
  console.log(`📋 Sponsorships: http://localhost:${PORT}/api/sponsorships`);
});

console.log('✅ Test server setup complete!');
