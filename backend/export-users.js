const fs = require('fs');
const fetch = require('node-fetch');

const API_URL = 'http://localhost:5000/api/users'; // Adjust if your backend runs elsewhere

async function exportUsers() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const users = await res.json();
    fs.writeFileSync('users-backup.json', JSON.stringify(users, null, 2));
    console.log(`✅ Exported ${users.length} users to users-backup.json`);
  } catch (err) {
    console.error('❌ Failed to export users:', err);
  }
}

exportUsers(); 