const testUpdate = async () => {
  try {
    console.log('Testing teacher update...');
    
    // First, let's get a list of users to find a teacher
    const usersResponse = await fetch('http://localhost:5000/api/users');
    const users = await usersResponse.json();
    console.log('Users found:', users.length);
    
    // Find a teacher (role USER or SUPER-TEACHER)
    const teacher = users.find(u => u.role === 'USER' || u.role === 'SUPER-TEACHER');
    
    if (!teacher) {
      console.log('No teacher found');
      return;
    }
    
    console.log('Testing update for teacher:', teacher.name, 'ID:', teacher.id);
    
    // Test update data (simplified)
    const updateData = {
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone || '1234567890',
      role: 'USER',
      status: 'active',
      gender: teacher.gender || 'male',
      age: teacher.age || 25,
      residence: teacher.residence || 'Test Residence'
    };
    
    console.log('Update data:', updateData);
    
    // Try to update the teacher
    const updateResponse = await fetch(`http://localhost:5000/api/users/${teacher.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    
    console.log('Update response status:', updateResponse.status);
    
    if (updateResponse.ok) {
      const updatedTeacher = await updateResponse.json();
      console.log('Update successful:', updatedTeacher);
    } else {
      const errorText = await updateResponse.text();
      console.error('Update failed:', errorText);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
};

testUpdate(); 