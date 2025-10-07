const http = require('http');

console.log('🧪 Testing student update...');

// First get all students
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
      console.log(`📚 Found ${students.length} students`);
      
      // Find a student with pending status
      const pendingStudent = students.find(s => s.sponsorshipStatus === 'pending');
      if (pendingStudent) {
        console.log(`🎯 Found pending student: ${pendingStudent.name} (ID: ${pendingStudent.id})`);
        
        // Update the student to eligible
        const updateData = {
          sponsorshipStatus: 'eligible'
        };
        
        console.log('📤 Updating student status to eligible...');
        
        const updateReq = http.request({
          hostname: 'localhost',
          port: 5000,
          path: `/api/students/${pendingStudent.id}`,
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          }
        }, (updateRes) => {
          let updateResponse = '';
          updateRes.on('data', (chunk) => updateResponse += chunk);
          updateRes.on('end', () => {
            console.log(`📡 Update Response Status: ${updateRes.statusCode}`);
            console.log(`📡 Update Response: ${updateResponse}`);
            
            if (updateRes.statusCode === 200) {
              console.log('✅ Student updated successfully!');
              
              // Verify the update by getting students again
              setTimeout(() => {
                const verifyReq = http.request({
                  hostname: 'localhost',
                  port: 5000,
                  path: '/api/students',
                  method: 'GET'
                }, (verifyRes) => {
                  let verifyData = '';
                  verifyRes.on('data', (chunk) => verifyData += chunk);
                  verifyRes.on('end', () => {
                    if (verifyRes.statusCode === 200) {
                      const updatedStudents = JSON.parse(verifyData);
                      const updatedStudent = updatedStudents.find(s => s.id === pendingStudent.id);
                      console.log(`✅ Verification: Student ${updatedStudent.name} now has status: ${updatedStudent.sponsorshipStatus}`);
                    }
                  });
                });
                verifyReq.end();
              }, 1000);
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
        console.log('❌ No pending students found');
      }
    }
  });
});

getReq.on('error', (error) => {
  console.error('❌ Error getting students:', error.message);
});

getReq.end();

