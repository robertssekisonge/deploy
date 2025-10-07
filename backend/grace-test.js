const http = require('http');

// Simple in-memory storage for Grace Nakato's sponsorship
let graceSponsorship = null;

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const url = req.url;
  
  // Health check
  if (url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      message: 'Grace Nakato Sponsorship Server is working!', 
      timestamp: new Date().toISOString(),
      hasSponsorship: graceSponsorship !== null
    }));
    return;
  }
  
  // Get Grace's sponsorship
  if (url === '/api/sponsorships' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(graceSponsorship ? [graceSponsorship] : []));
    return;
  }
  
  // Create Grace's sponsorship
  if (url === '/api/sponsorships' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        console.log('🎉 Creating sponsorship for Grace Nakato:', data);
        
        graceSponsorship = {
          id: 'grace-' + Date.now(),
          studentId: data.studentId || 'grace-001',
          studentName: data.studentName || 'Grace Nakato',
          sponsorName: data.sponsorName,
          sponsorEmail: data.sponsorEmail,
          sponsorPhone: data.sponsorPhone,
          sponsorCountry: data.sponsorCountry,
          sponsorCity: data.sponsorCity,
          sponsorRelationship: data.sponsorRelationship,
          amount: data.amount,
          duration: data.duration,
          sponsorshipStartDate: data.sponsorshipStartDate,
          description: data.description,
          paymentSchedule: data.paymentSchedule,
          preferredContactMethod: data.preferredContactMethod,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        console.log('✅ Grace Nakato sponsorship created successfully!');
        console.log('📋 Sponsorship details:', graceSponsorship);
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(graceSponsorship));
      } catch (error) {
        console.error('❌ Error creating Grace Nakato sponsorship:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }
  
  // Default response
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = 5000;

server.listen(PORT, '127.0.0.1', () => {
  console.log(`🎉 Grace Nakato Sponsorship Server running on http://127.0.0.1:${PORT}`);
  console.log(`📊 Health: http://127.0.0.1:${PORT}/api/health`);
  console.log(`📋 Sponsorships: http://127.0.0.1:${PORT}/api/sponsorships`);
  console.log('✅ Ready to process Grace Nakato sponsorship!');
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});
