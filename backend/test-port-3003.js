const http = require('http');

console.log('🧪 Testing port 3003...');

const req = http.request({
  hostname: 'localhost',
  port: 3003,
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

