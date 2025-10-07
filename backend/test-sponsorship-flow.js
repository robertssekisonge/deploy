const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';

async function testSponsorshipFlow() {
  console.log('🧪 Testing Sponsorship Flow...\n');

  try {
    // Test 1: Check if server is running
    console.log('1️⃣ Testing server connection...');
    const healthCheck = await fetch(`${API_BASE}/sponsorships`);
    if (healthCheck.ok) {
      console.log('✅ Server is running and accessible');
    } else {
      console.log('❌ Server responded with error:', healthCheck.status);
      return;
    }

    // Test 2: Get all sponsorships
    console.log('\n2️⃣ Testing GET /sponsorships...');
    const sponsorships = await fetch(`${API_BASE}/sponsorships`);
    if (sponsorships.ok) {
      const data = await sponsorships.json();
      console.log('✅ Got sponsorships:', data.length);
    } else {
      console.log('❌ Failed to get sponsorships:', sponsorships.status);
    }

    // Test 3: Test make-available endpoint
    console.log('\n3️⃣ Testing POST /sponsorships/student/TEST001/make-available...');
    const makeAvailable = await fetch(`${API_BASE}/sponsorships/student/TEST001/make-available`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (makeAvailable.ok) {
      const data = await makeAvailable.json();
      console.log('✅ Make available endpoint working:', data.message);
    } else {
      const error = await makeAvailable.text();
      console.log('❌ Make available failed:', makeAvailable.status, error);
    }

    // Test 4: Test make-eligible endpoint
    console.log('\n4️⃣ Testing POST /sponsorships/student/TEST001/make-eligible...');
    const makeEligible = await fetch(`${API_BASE}/sponsorships/student/TEST001/make-eligible`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (makeEligible.ok) {
      const data = await makeEligible.json();
      console.log('✅ Make eligible endpoint working:', data.message);
    } else {
      const error = await makeEligible.text();
      console.log('❌ Make eligible failed:', makeEligible.status, error);
    }

    // Test 5: Test sponsorship creation
    console.log('\n5️⃣ Testing POST /sponsorships (create)...');
    const createSponsorship = await fetch(`${API_BASE}/sponsorships`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: 'TEST001',
        sponsorName: 'Test Sponsor',
        sponsorEmail: 'test@example.com',
        sponsorPhone: '+256123456789',
        amount: 50000,
        duration: 12,
        description: 'Test sponsorship',
        paymentSchedule: 'monthly'
      })
    });
    
    if (createSponsorship.ok) {
      const data = await createSponsorship.json();
      console.log('✅ Sponsorship creation working, ID:', data.id);
      
      // Test 6: Test sponsorship update
      console.log('\n6️⃣ Testing PUT /sponsorships (update)...');
      const updateSponsorship = await fetch(`${API_BASE}/sponsorships/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'pending-admin-approval'
        })
      });
      
      if (updateSponsorship.ok) {
        const updateData = await updateSponsorship.json();
        console.log('✅ Sponsorship update working, new status:', updateData.status);
      } else {
        const error = await updateSponsorship.text();
        console.log('❌ Sponsorship update failed:', updateSponsorship.status, error);
      }
      
      // Test 7: Test final approval
      console.log('\n7️⃣ Testing POST /sponsorships/approve-sponsored...');
      const finalApproval = await fetch(`${API_BASE}/sponsorships/${data.id}/approve-sponsored`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (finalApproval.ok) {
        const approvalData = await finalApproval.json();
        console.log('✅ Final approval working, status:', approvalData.status);
      } else {
        const error = await finalApproval.text();
        console.log('❌ Final approval failed:', finalApproval.status, error);
      }
      
    } else {
      const error = await createSponsorship.text();
      console.log('❌ Sponsorship creation failed:', createSponsorship.status, error);
    }

    console.log('\n🎉 Sponsorship flow testing completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testSponsorshipFlow();

