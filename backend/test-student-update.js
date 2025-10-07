const http = require('http');

console.log('🧪 Testing student update endpoint...');

// First, let's get a student to update
const getReq = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/students',
  method: 'GET'
}, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      const students = JSON.parse(data);
      if (students.length > 0) {
        const studentToUpdate = students[0];
        console.log('📋 Found student to update:', studentToUpdate.name, 'ID:', studentToUpdate.id);
        
        // Now try to update the student
        const updateData = {
          sponsorshipStatus: 'eligible'
        };
        
        console.log('📤 Updating student with data:', updateData);
        
        const updateReq = http.request({
          hostname: 'localhost',
          port: 5000,
          path: `/api/students/${studentToUpdate.id}`,
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          }
        }, (updateRes) => {
          let updateData = '';
          updateRes.on('data', (chunk) => updateData += chunk);
          updateRes.on('end', () => {
            console.log('📡 Update Response Status:', updateRes.statusCode);
            console.log('📡 Update Response:', updateData);
            
            if (updateRes.statusCode === 200) {
              console.log('✅ Student updated successfully!');
            } else {
              console.log('❌ Failed to update student');
            }
          });
        });
        
        updateReq.on('error', (error) => {
          console.error('❌ Error updating student:', error.message);
        });
        
        updateReq.write(JSON.stringify(updateData));
        updateReq.end();
      } else {
        console.log('❌ No students found to update');
      }
    }
  });
});

getReq.on('error', (error) => {
  console.error('❌ Error getting students:', error.message);
});

getReq.end();

