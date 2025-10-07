const http = require('http');

console.log('🧪 Testing students API on port 3004...');

// Test health endpoint
const healthReq = http.request({
  hostname: 'localhost',
  port: 3004,
  path: '/api/health',
  method: 'GET'
}, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('📡 Health Status:', res.statusCode);
    console.log('📡 Health Response:', data);
    
    if (res.statusCode === 200) {
      console.log('✅ Health check passed!');
      
      // Now test getting students
      const studentsReq = http.request({
        hostname: 'localhost',
        port: 3004,
        path: '/api/students',
        method: 'GET'
      }, (studentsRes) => {
        let studentsData = '';
        studentsRes.on('data', (chunk) => studentsData += chunk);
        studentsRes.on('end', () => {
          console.log('📡 Students Status:', studentsRes.statusCode);
          console.log('📡 Students Response:', studentsData);
          
          if (studentsRes.statusCode === 200) {
            try {
              const students = JSON.parse(studentsData);
              console.log(`✅ Found ${students.length} students in database!`);
              
              if (students.length > 0) {
                console.log('👥 Students found:');
                students.forEach((student, index) => {
                  console.log(`  ${index + 1}. ${student.name} (${student.class}) - Status: ${student.sponsorshipStatus}`);
                });
              }
            } catch (error) {
              console.error('❌ Error parsing students data:', error);
            }
          } else {
            console.error('❌ Failed to get students');
          }
        });
      });
      
      studentsReq.on('error', (error) => {
        console.error('❌ Error getting students:', error.message);
      });
      
      studentsReq.end();
    } else {
      console.error('❌ Health check failed');
    }
  });
});

healthReq.on('error', (error) => {
  console.error('❌ Server not running on port 3004:', error.message);
});

healthReq.end();

