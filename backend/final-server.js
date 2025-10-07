const http = require('http');

// In-memory storage for sponsorships
let sponsorships = [];

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Parse URL
  const url = req.url;
  
  // Health check endpoint
  if (url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      message: 'Server is running!', 
      timestamp: new Date().toISOString(),
      status: 'healthy',
      sponsorshipsCount: sponsorships.length
    }));
    return;
  }
  
  // Get all sponsorships
  if (url === '/api/sponsorships' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(sponsorships));
    return;
  }
  
  // Create new sponsorship
  if (url === '/api/sponsorships' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        console.log('📝 Creating sponsorship:', data);
        
        const newSponsorship = {
          id: Date.now().toString(),
          ...data,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        sponsorships.push(newSponsorship);
        console.log('✅ Sponsorship created successfully');
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(newSponsorship));
      } catch (error) {
        console.error('❌ Error creating sponsorship:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }
  
  // Update sponsorship
  if (url.startsWith('/api/sponsorships/') && req.method === 'PUT') {
    const id = url.split('/')[3];
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const index = sponsorships.findIndex(s => s.id === id);
        if (index !== -1) {
          sponsorships[index] = { ...sponsorships[index], ...data, updatedAt: new Date().toISOString() };
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(sponsorships[index]));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Sponsorship not found' }));
        }
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }
  
  // Authentication endpoints
  if (url === '/api/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const { email, password } = JSON.parse(body);
        console.log('🔐 Login attempt:', email);
        
                 // Simple authentication - you can add your actual user data here
         const users = [
           { id: '1', email: 'robs@school.com', password: 'hub h@11', role: 'admin', name: 'Rob Admin' },
           { id: '2', email: 'admin@school.com', password: 'admin123', role: 'overseer', name: 'Admin Overseer' },
           { id: '3', email: 'parent@school.com', password: 'parent123', role: 'parent', name: 'Test Parent' }
         ];
        
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
          console.log('✅ Login successful:', user.email);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            user: { id: user.id, email: user.email, role: user.role, name: user.name },
            token: 'dummy-token-' + Date.now()
          }));
        } else {
          console.log('❌ Login failed:', email);
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid credentials' }));
        }
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }
  
     // Get users endpoint
   if (url === '/api/users' && req.method === 'GET') {
     res.writeHead(200, { 'Content-Type': 'application/json' });
     res.end(JSON.stringify([
       { id: '1', email: 'robs@school.com', role: 'admin', name: 'Rob Admin' },
       { id: '2', email: 'admin@school.com', role: 'overseer', name: 'Admin Overseer' },
       { id: '3', email: 'parent@school.com', role: 'parent', name: 'Test Parent' }
     ]));
     return;
   }
  
  // Default response
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`🚀 Sponsorship server running on http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/api/health`);
  console.log(`📋 Sponsorships: http://localhost:${PORT}/api/sponsorships`);
  console.log('✅ Server is ready!');
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});
