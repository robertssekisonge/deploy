const express = require('express');
const app = express();

app.use(express.json());

app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  res.json({ status: 'ok', message: 'Server is running on port 3001' });
});

app.post('/api/sponsorships', (req, res) => {
  console.log('Creating sponsorship:', req.body);
  res.status(201).json({
    id: 'test-' + Date.now(),
    ...req.body,
    status: 'pending',
    createdAt: new Date().toISOString()
  });
});

app.listen(3001, () => {
  console.log('🚀 Simple test server running on port 3001');
  console.log('🏥 Health check: http://localhost:3001/api/health');
});
