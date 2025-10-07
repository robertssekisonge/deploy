const fetch = require('node-fetch');

async function testTempPassword() {
  try {
    console.log('Testing temporary password functionality...');
    
    // Test the API endpoint
    const response = await fetch('http://localhost:5000/api/auth/provide-temp-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 1, // Replace with actual user ID
        tempPassword: 'temp123',
        adminEmail: 'admin@example.com' // Replace with actual admin email
      }),
    });

    const data = await response.json();
    console.log('Response:', data);
    
    if (response.ok) {
      console.log('✅ Temporary password functionality works!');
    } else {
      console.log('❌ Failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Error testing temp password:', error);
  }
}

testTempPassword(); 