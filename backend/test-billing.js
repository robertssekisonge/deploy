const testBilling = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/settings/billing-types', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Fee',
        amount: 50000,
        frequency: 'term',
        description: 'Test billing type',
        classId: '1',
        year: '2025',
        term: 'Term 1',
        className: 'Senior 1'
      })
    });
    
    const result = await response.json();
    console.log('Success:', result);
  } catch (error) {
    console.error('Error:', error);
  }
};

testBilling(); 
  try {
    const response = await fetch('http://localhost:5000/api/settings/billing-types', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Fee',
        amount: 50000,
        frequency: 'term',
        description: 'Test billing type',
        classId: '1',
        year: '2025',
        term: 'Term 1',
        className: 'Senior 1'
      })
    });
    
    const result = await response.json();
    console.log('Success:', result);
  } catch (error) {
    console.error('Error:', error);
  }
};

testBilling(); 