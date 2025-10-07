async function testAPIEncoding() {
  try {
    console.log('🔍 Testing API endpoint with different URL encodings...');
    
    // Test 1: Direct URL with space
    console.log('\n📋 Test 1: Direct URL with space');
    try {
      const response1 = await fetch('http://localhost:5000/api/students/dropped-access-numbers/Senior 1/A');
      const result1 = await response1.json();
      console.log(`   Result: ${result1.length} dropped numbers`);
      result1.forEach(d => console.log(`     ${d.accessNumber} - ${d.studentName}`));
    } catch (error) {
      console.log(`   Error: ${error.message}`);
    }
    
    // Test 2: URL encoded space (%20)
    console.log('\n📋 Test 2: URL encoded space (%20)');
    try {
      const response2 = await fetch('http://localhost:5000/api/students/dropped-access-numbers/Senior%201/A');
      const result2 = await response2.json();
      console.log(`   Result: ${result2.length} dropped numbers`);
      result2.forEach(d => console.log(`     ${d.accessNumber} - ${d.studentName}`));
    } catch (error) {
      console.log(`   Error: ${error.message}`);
    }
    
    // Test 3: URL encoded space (+)
    console.log('\n📋 Test 3: URL encoded space (+)');
    try {
      const response3 = await fetch('http://localhost:5000/api/students/dropped-access-numbers/Senior+1/A');
      const result3 = await response3.json();
      console.log(`   Result: ${result3.length} dropped numbers`);
      result3.forEach(d => console.log(`     ${d.accessNumber} - ${d.studentName}`));
    } catch (error) {
      console.log(`   Error: ${error.message}`);
    }
    
    // Test 4: Check what the frontend is actually sending
    console.log('\n📋 Test 4: Check server logs for actual requests');
    console.log('   (Check the backend server console for incoming requests)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPIEncoding();








