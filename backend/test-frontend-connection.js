const fetch = require('node-fetch');

async function testFrontendConnection() {
  try {
    console.log('🧪 Testing frontend connection to backend...');
    
    // Test the exact endpoint the frontend uses
    const response = await fetch('http://localhost:5000/api/reports/weekly', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5173' // Frontend origin
      },
      body: JSON.stringify({
        userId: 'test-frontend',
        userName: 'Test Frontend User',
        userRole: 'user',
        weekStart: '2025-08-17T00:00:00.000Z',
        weekEnd: '2025-08-23T00:00:00.000Z',
        reportType: 'user',
        content: 'Test from frontend simulation',
        achievements: ['test achievement'],
        challenges: ['test challenge'],
        nextWeekGoals: ['test goal'],
        submittedAt: '2025-08-17T08:17:00.000Z',
        status: 'submitted'
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Frontend connection successful!');
      console.log('Response data:', data);
    } else {
      const errorText = await response.text();
      console.log('❌ Frontend connection failed:', response.status);
      console.log('Error response:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error testing frontend connection:', error.message);
  }
}

testFrontendConnection();
