const http = require('http');
const { Client } = require('pg');

// Database connection
const client = new Client({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:GALZ2BOYZ@localhost:5432/sms"
});

// Connect to database
client.connect().then(() => {
  console.log('✅ Connected to PostgreSQL database');
}).catch(err => {
  console.error('❌ Database connection failed:', err);
});

// In-memory storage for users and login attempts (fallback)
const users = {
  'robs@school.com': {
    id: '1',
    email: 'robs@school.com',
    password: 'hub h@11',
    role: 'admin',
    name: 'Rob Admin',
    loginAttempts: 0,
    lockedUntil: null,
    tempPassword: null
  }
};

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const url = req.url;
  
  // Health check
  if (url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Server is running!', timestamp: new Date().toISOString() }));
    return;
  }
  
  // Login endpoint
  if (url === '/api/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const { email, password } = JSON.parse(body);
        console.log('🔐 Login attempt:', email);
        
        const user = users[email];
        if (!user) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid credentials' }));
          return;
        }
        
        // Check if account is locked
        if (user.lockedUntil && new Date() < user.lockedUntil) {
          const remainingTime = Math.ceil((user.lockedUntil - new Date()) / 1000);
          res.writeHead(423, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: 'Account temporarily locked. Please wait ' + remainingTime + ' seconds before trying again.',
            lockedUntil: user.lockedUntil,
            remainingSeconds: remainingTime
          }));
          return;
        }
        
        // Check if using temp password
        if (password === user.tempPassword) {
          // Temp password used - prompt for new password
          console.log('✅ Temp password used - prompting for new password');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            user: { 
              id: user.id, 
              email: user.email, 
              role: user.role, 
              name: user.name 
            },
            token: 'dummy-token-' + Date.now(),
            requiresPasswordChange: true,
            message: 'Please enter a new password'
          }));
          return;
        }
        
        // Check regular password
        if (password === user.password) {
          // Reset login attempts on successful login
          user.loginAttempts = 0;
          user.lockedUntil = null;
          user.tempPassword = null;
          
          console.log('✅ Login successful!');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            user: { 
              id: user.id, 
              email: user.email, 
              role: user.role, 
              name: user.name 
            },
            token: 'dummy-token-' + Date.now()
          }));
        } else {
          // Increment failed attempts
          user.loginAttempts++;
          console.log('❌ Login failed - attempt', user.loginAttempts);
          
          if (user.loginAttempts >= 5) {
            // Lock account for 3 minutes
            user.lockedUntil = new Date(Date.now() + 3 * 60 * 1000);
            res.writeHead(423, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              error: 'Account temporarily locked. Please wait 180 seconds before trying again.',
              lockedUntil: user.lockedUntil,
              remainingSeconds: 180
            }));
          } else {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              error: 'Invalid credentials (' + (5 - user.loginAttempts) + ' attempts remaining)'
            }));
          }
        }
      } catch (error) {
        console.error('❌ Error parsing login data:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }
  
  // Generate temporary password endpoint
  if (url === '/api/auth/generate-temp-password' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const { email } = JSON.parse(body);
        console.log('🔑 Generating temp password for:', email);
        
        const user = users[email];
        if (!user) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'User not found' }));
          return;
        }
        
        // Generate a random 8-character temp password
        const tempPassword = Math.random().toString(36).substring(2, 10);
        user.tempPassword = tempPassword;
        user.loginAttempts = 0; // Reset login attempts
        user.lockedUntil = null; // Unlock account
        
        console.log('✅ Temp password generated:', tempPassword);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          tempPassword: tempPassword,
          message: 'Temporary password generated successfully. Use this password to login and you will be prompted to change it.'
        }));
      } catch (error) {
        console.error('❌ Error generating temp password:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }
  
  // Change password endpoint
  if (url === '/api/auth/change-password' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const { email, newPassword } = JSON.parse(body);
        console.log('🔐 Changing password for:', email);
        
        const user = users[email];
        if (!user) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'User not found' }));
          return;
        }
        
        // Update password and clear temp password
        user.password = newPassword;
        user.tempPassword = null;
        user.loginAttempts = 0;
        user.lockedUntil = null;
        
        console.log('✅ Password changed successfully');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Password changed successfully'
        }));
      } catch (error) {
        console.error('❌ Error changing password:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }
  
  // Reset password endpoint (admin function)
  if (url === '/api/auth/reset-password' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        console.log('📝 Received reset password request');
        console.log('📝 Request body:', body);
        
        const { userId, newPassword } = JSON.parse(body);
        console.log('🔐 Resetting password for user ID:', userId);
        
        if (!userId || !newPassword) {
          console.log('❌ Missing required fields');
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'All fields are required' }));
          return;
        }
        
        // Try to update password in database first
        try {
          const updateQuery = 'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2 RETURNING *';
          const updateResult = await client.query(updateQuery, [newPassword, userId]);
          
          if (updateResult.rows.length > 0) {
            const user = updateResult.rows[0];
            console.log('✅ Password reset successfully in database for:', user.email);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              message: 'Password reset successfully and stored permanently',
              user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
              }
            }));
            return;
          }
        } catch (dbError) {
          console.log('⚠️ Database update failed, falling back to in-memory:', dbError.message);
        }
        
        // Fallback to in-memory storage
        const user = Object.values(users).find(u => u.id === userId);
        if (!user) {
          console.log('❌ User not found:', userId);
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'User not found' }));
          return;
        }
        
        // Update password and clear any locks
        user.password = newPassword;
        user.tempPassword = null;
        user.loginAttempts = 0;
        user.lockedUntil = null;
        
        console.log('✅ Password reset successfully (in-memory) for:', user.email);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Password reset successfully (in-memory)',
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        }));
      } catch (error) {
        console.error('❌ Error resetting password:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }
  
  // Default response
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`🚀 Test login server running on http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Login: http://localhost:${PORT}/api/auth/login`);
  console.log('✅ Server is ready!');
  console.log('📝 Test credentials: robs@school.com / hub h@11');
});
