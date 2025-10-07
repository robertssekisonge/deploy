const http = require('http');

console.log('🧪 Testing student approval flow with detailed logging...');

// First, get all students to find one in Box 1
const getStudentsReq = http.request({
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
      
      // Find a student with pending status (Box 1)
      const pendingStudent = students.find(s => s.sponsorshipStatus === 'pending');
      if (pendingStudent) {
        console.log(`🎯 Found pending student: ${pendingStudent.name}`);
        console.log(`📊 Student ID: ${pendingStudent.id} (type: ${typeof pendingStudent.id})`);
        console.log(`📊 Current status: ${pendingStudent.sponsorshipStatus}`);
        
        // Update the student to eligible (Box 2)
        const updateData = {
          sponsorshipStatus: 'eligible'
        };
        
        console.log('📤 Updating student status to eligible...');
        console.log('📤 Update data:', JSON.stringify(updateData));
        
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
              const updatedStudent = JSON.parse(updateResponse);
              console.log('✅ Student updated successfully!');
              console.log(`📊 Updated status: ${updatedStudent.sponsorshipStatus}`);
              
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
                      console.log('🎯 The student should now appear in Box 2 (Eligible)');
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

getStudentsReq.on('error', (error) => {
  console.error('❌ Error getting students:', error.message);
});

getStudentsReq.end();
