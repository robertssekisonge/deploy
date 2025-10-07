async function testDroppedNumberCreation() {
  try {
    console.log('🔧 Testing dropped access number creation...');
    
    // Test creating a student with a dropped access number
    const studentData = {
      name: 'Test Student',
      nin: 'NIN001TEST001',
      ninType: 'NIN',
      accessNumber: 'AA0003', // This is the dropped access number
      age: 18,
      gender: 'Male',
      phone: '1234567890',
      phoneCountryCode: 'UG',
      email: 'test@example.com',
      class: 'Senior 1',
      stream: 'A',
      needsSponsorship: false,
      sponsorshipStatus: 'none',
      sponsorshipStory: '',
      familyPhoto: '',
      passportPhoto: '',
      photo: '',
      parent: {
        name: 'Test Parent',
        nin: 'NIN002TEST002',
        ninType: 'NIN',
        phone: '0987654321',
        phoneCountryCode: 'UG',
        email: 'parent@example.com',
        address: 'Test Address',
        occupation: 'Test Job'
      },
      wasDroppedNumberChosen: true, // This is the key flag
      status: 'active'
    };
    
    console.log('📝 Sending student data:', JSON.stringify(studentData, null, 2));
    
    const response = await fetch('http://localhost:5000/api/students', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(studentData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Student created successfully!');
      console.log('📋 Created student:', {
        id: result.id,
        name: result.name,
        accessNumber: result.accessNumber,
        admissionId: result.admissionId
      });
      
      // Check if AA0003 was removed from dropped list
      const droppedResponse = await fetch('http://localhost:5000/api/students/dropped-access-numbers');
      const droppedNumbers = await droppedResponse.json();
      
      const aa0003StillDropped = droppedNumbers.find(d => d.accessNumber === 'AA0003');
      if (aa0003StillDropped) {
        console.log('❌ AA0003 is still in dropped list - removal failed');
      } else {
        console.log('✅ AA0003 was successfully removed from dropped list');
      }
      
    } else {
      console.log('❌ Student creation failed:', result);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDroppedNumberCreation();








