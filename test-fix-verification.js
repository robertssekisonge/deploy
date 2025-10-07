// Test the clinic record creation with the exact data from the frontend
const testClinicRecordCreation = async () => {
  try {
    console.log('🧪 Testing clinic record creation with frontend data...');
    
    // This is the exact data structure that was causing the 500 error
    const testData = {
      studentId: "7",  // Now as string (was number 7)
      accessNumber: "TEST001",
      studentName: "Test Student",
      className: "Senior 1",
      streamName: "A",
      visitDate: new Date().toISOString(),
      visitTime: "10:00",
      symptoms: "Test symptoms",
      diagnosis: "Test diagnosis",
      treatment: "Test treatment",
      medication: "Test medication",
      cost: 1000,
      nurseId: "7",  // Now as string (was number 7)
      nurseName: "Test Nurse",
      followUpRequired: false,
      followUpDate: null,
      parentNotified: true,
      status: "active",
      notes: "Test record"
    };
    
    console.log('📤 Sending test data:', testData);
    
    const response = await fetch('http://localhost:5000/api/clinic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);
    
    if (response.ok) {
      const savedRecord = await response.json();
      console.log('✅ SUCCESS! Record saved:', savedRecord);
      
      // Clean up - delete the test record
      const deleteResponse = await fetch(`http://localhost:5000/api/clinic/${savedRecord.id}`, {
        method: 'DELETE'
      });
      
      if (deleteResponse.ok) {
        console.log('🧹 Test record cleaned up');
      }
      
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ FAILED:', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ Test error:', error);
    return false;
  }
};

// Run the test
testClinicRecordCreation().then(success => {
  console.log('🎯 Test result:', success ? 'SUCCESS - Fix works!' : 'FAILED - Still broken');
});

