import fetch from 'node-fetch';

async function unlockAdmin() {
  try {
    const response = await fetch('http://localhost:5000/api/users/25', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountLocked: false,
        lockReason: null,
        passwordAttempts: 0,
        lastPasswordAttempt: null
      }),
    });

    if (response.ok) {
      console.log('✅ Admin Robs account unlocked successfully!');
    } else {
      console.log('❌ Failed to unlock account');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

unlockAdmin(); 