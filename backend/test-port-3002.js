const http = require('http');

console.log('🧪 Testing port 3002 server...');

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/health',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📡 Response status:', res.statusCode);
    console.log('📡 Response:', data);
    
    if (res.statusCode === 200) {
      console.log('✅ Server is working!');
    } else {
      console.log('❌ Server not responding properly');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Server not running:', error.message);
});

req.end();

