const http = require('http');

console.log('🧪 Testing port 3004...');

const req = http.request({
  hostname: 'localhost',
  port: 3004,
  path: '/api/health',
  method: 'GET'
}, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('📡 Status:', res.statusCode);
    console.log('📡 Response:', data);
    if (res.statusCode === 200) {
      console.log('✅ Server is working on port 3004!');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Server not running on port 3004:', error.message);
});

req.end();

