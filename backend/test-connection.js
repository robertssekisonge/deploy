const http = require('http');

console.log('🧪 Testing server connection on port 5000...');

// Test health endpoint
const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/health',
  method: 'GET'
}, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('📡 Status:', res.statusCode);
    console.log('📡 Response:', data);
    
    if (res.statusCode === 200) {
      console.log('✅ Server is running and responding!');
    } else {
      console.log('❌ Server responded with error status');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Cannot connect to server:', error.message);
  console.log('💡 Make sure the server is running on port 5000');
});

req.end(); 