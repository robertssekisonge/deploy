const fetch = require('node-fetch');

async function testLogin() {
    console.log('🔐 Testing login API...\n');
    
    const testCases = [
        {
            email: 'robs@school.com',
            password: 'hub h123',
            description: 'Robs with correct password'
        },
        {
            email: 'robs@school.com',
            password: 'password123',
            description: 'Robs with wrong password'
        },
        {
            email: 'admin@school.com',
            password: 'hub h123',
            description: 'Admin with correct password'
        },
        {
            email: 'nonexistent@test.com',
            password: 'password',
            description: 'Non-existent user'
        }
    ];
    
    for (const testCase of testCases) {
        console.log(`📧 Testing: ${testCase.description}`);
        console.log(`   Email: ${testCase.email}`);
        console.log(`   Password: ${testCase.password}`);
        
        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: testCase.email,
                    password: testCase.password
                }),
            });
            
            const data = await response.json();
            
            console.log(`   Status: ${response.status}`);
            console.log(`   Response:`, data);
            
            if (response.ok) {
                console.log(`   ✅ SUCCESS: Login worked!`);
                console.log(`   User: ${data.name} (${data.role})`);
            } else {
                console.log(`   ❌ FAILED: ${data.error || data.message}`);
            }
            
        } catch (error) {
            console.log(`   ❌ ERROR: ${error.message}`);
        }
        
        console.log(''); // Empty line for readability
    }
}

// Test if backend is running
async function testBackendHealth() {
    console.log('🏥 Testing backend health...\n');
    
    try {
        const response = await fetch('http://localhost:5000/api/health');
        const data = await response.json();
        
        console.log(`✅ Backend is running!`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Message: ${data.message}`);
        
    } catch (error) {
        console.log(`❌ Backend is not running: ${error.message}`);
        console.log(`   Make sure to run: cd backend && npm run dev`);
    }
    
    console.log('');
}

// Test database connection
async function testDatabase() {
    console.log('🗄️ Testing database connection...\n');
    
    try {
        const response = await fetch('http://localhost:5000/api/test-db');
        const data = await response.json();
        
        console.log(`✅ Database is connected!`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Message: ${data.message}`);
        
    } catch (error) {
        console.log(`❌ Database test failed: ${error.message}`);
    }
    
    console.log('');
}

async function runAllTests() {
    console.log('🚀 Starting comprehensive login tests...\n');
    
    await testBackendHealth();
    await testDatabase();
    await testLogin();
    
    console.log('🏁 Tests completed!');
}

runAllTests(); 