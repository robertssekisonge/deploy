// Test script to verify clinic records persistence
const testClinicPersistence = async () => {
  try {
    console.log('🧪 Testing clinic records persistence...');
    
    // Test 1: Check if backend is accessible
    const response = await fetch('http://localhost:5000/api/clinic');
    console.log('📡 Backend response:', response.status, response.statusText);
    
    if (response.ok) {
      const records = await response.json();
      console.log('📊 Current clinic records in database:', records.length);
      console.log('📋 Records:', records);
      
      // Test 2: Create a test record
      const testRecord = {
        studentId: '999',
        accessNumber: 'TEST001',
        studentName: 'Test Student',
        className: 'Test Class',
        streamName: 'Test Stream',
        visitDate: new Date().toISOString(),
        visitTime: '10:00',
        symptoms: 'Test symptoms',
        diagnosis: 'Test diagnosis',
        treatment: 'Test treatment',
        medication: 'Test medication',
        cost: 1000,
        nurseId: '1',
        nurseName: 'Test Nurse',
        followUpRequired: false,
        followUpDate: null,
        parentNotified: true,
        status: 'active',
        notes: 'Test record for persistence verification'
      };
      
      console.log('📤 Creating test record...');
      const createResponse = await fetch('http://localhost:5000/api/clinic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testRecord)
      });
      
      if (createResponse.ok) {
        const createdRecord = await createResponse.json();
        console.log('✅ Test record created:', createdRecord);
        
        // Test 3: Verify record persists
        const verifyResponse = await fetch('http://localhost:5000/api/clinic');
        const updatedRecords = await verifyResponse.json();
        console.log('🔍 Records after creation:', updatedRecords.length);
        
        const foundRecord = updatedRecords.find(r => r.studentId === '999');
        if (foundRecord) {
          console.log('✅ Record persists in database!');
          return true;
        } else {
          console.log('❌ Record not found in database');
          return false;
        }
      } else {
        console.log('❌ Failed to create test record:', createResponse.status);
        return false;
      }
    } else {
      console.log('❌ Backend not accessible');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
};

// Run the test
testClinicPersistence().then(success => {
  console.log('🧪 Test result:', success ? 'PASSED' : 'FAILED');
});

