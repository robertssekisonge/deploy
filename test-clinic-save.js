// Simple test to verify clinic record saving
const testClinicSave = async () => {
  try {
    console.log('🧪 Testing clinic record save...');
    
    const testRecord = {
      studentId: '1',
      accessNumber: 'TEST001',
      studentName: 'Test Student',
      className: 'Senior 1',
      streamName: 'A',
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
      notes: 'Test record'
    };
    
    console.log('📤 Sending test record:', testRecord);
    
    const response = await fetch('http://localhost:5000/api/clinic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRecord),
    });
    
    console.log('📡 Response status:', response.status);
    
    if (response.ok) {
      const savedRecord = await response.json();
      console.log('✅ Record saved successfully:', savedRecord);
      
      // Verify it was saved by fetching all records
      const fetchResponse = await fetch('http://localhost:5000/api/clinic');
      const allRecords = await fetchResponse.json();
      console.log('📊 All records in database:', allRecords.length);
      console.log('📋 Records:', allRecords);
      
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ Save failed:', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ Test error:', error);
    return false;
  }
};

// Run the test
testClinicSave();

