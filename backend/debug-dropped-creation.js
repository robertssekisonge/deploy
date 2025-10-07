async function debugDroppedCreation() {
  try {
    console.log('🔍 Debugging dropped access number creation...');
    
    // First, check current state
    console.log('\n📊 Current state:');
    
    // Check all students
    const studentsResponse = await fetch('http://localhost:5000/api/students');
    const students = await studentsResponse.json();
    console.log(`   Students: ${students.length}`);
    students.forEach(s => {
      console.log(`     ${s.accessNumber} - ${s.name} (${s.class} ${s.stream}) - Status: ${s.status}`);
    });
    
    // Check dropped access numbers
    const droppedResponse = await fetch('http://localhost:5000/api/students/dropped-access-numbers');
    const droppedNumbers = await droppedResponse.json();
    console.log(`   Dropped access numbers: ${droppedNumbers.length}`);
    droppedNumbers.forEach(d => {
      console.log(`     ${d.accessNumber} - ${d.studentName} (${d.className} ${d.streamName})`);
    });
    
    // Test creating a student with AA0003
    console.log('\n🧪 Testing creation with AA0003...');
    
    const studentData = {
      name: 'Test Okello',
      nin: 'NIN001TEST001',
      ninType: 'NIN',
      accessNumber: 'AA0003',
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
      wasDroppedNumberChosen: true,
      status: 'active'
    };
    
    console.log('📝 Sending request...');
    const response = await fetch('http://localhost:5000/api/students', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(studentData)
    });
    
    console.log(`📊 Response status: ${response.status}`);
    const result = await response.json();
    console.log('📋 Response:', result);
    
    if (response.ok) {
      console.log('✅ Student created successfully!');
      
      // Check if AA0003 was removed from dropped list
      const newDroppedResponse = await fetch('http://localhost:5000/api/students/dropped-access-numbers');
      const newDroppedNumbers = await newDroppedResponse.json();
      
      const aa0003StillDropped = newDroppedNumbers.find(d => d.accessNumber === 'AA0003');
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

debugDroppedCreation();








