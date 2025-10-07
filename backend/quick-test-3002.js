const http = require('http');

console.log('🧪 Quick test for port 3002...');

const req = http.request({
  hostname: 'localhost',
  port: 3002,
  path: '/api/health',
  method: 'GET'
}, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('📡 Status:', res.statusCode);
    console.log('📡 Response:', data);
    if (res.statusCode === 200) {
      console.log('✅ Server is working!');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Server not running:', error.message);
});

req.end();

