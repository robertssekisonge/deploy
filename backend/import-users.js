const fs = require('fs');
const fetch = require('node-fetch');

const API_URL = 'http://localhost:5000/api/users'; // Adjust if your backend runs elsewhere
const BACKUP_FILE = 'users-backup.json';

async function importUsers() {
  if (!fs.existsSync(BACKUP_FILE)) {
    console.error(`❌ Backup file not found: ${BACKUP_FILE}`);
    return;
  }
  const users = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf-8'));
  let imported = 0, skipped = 0, failed = 0;
  for (const user of users) {
    // Remove id and createdAt/lastLogin fields to avoid conflicts
    const { id, createdAt, lastLogin, ...userData } = user;
    try {
      // Check if user already exists by email
      const resCheck = await fetch(`${API_URL}?email=${encodeURIComponent(user.email)}`);
      if (resCheck.ok) {
        const existing = await resCheck.json();
        if (Array.isArray(existing) && existing.length > 0) {
          console.log(`⏩ Skipping existing user: ${user.email}`);
          skipped++;
          continue;
        }
      }
      // Import user (with hashed password)
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (res.ok) {
        console.log(`✅ Imported user: ${user.email}`);
        imported++;
      } else {
        console.error(`❌ Failed to import user: ${user.email} (${res.status})`);
        failed++;
      }
    } catch (err) {
      console.error(`❌ Error importing user: ${user.email}`, err);
      failed++;
    }
  }
  console.log(`\nDone. Imported: ${imported}, Skipped: ${skipped}, Failed: ${failed}`);
}

importUsers(); 