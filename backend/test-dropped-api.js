async function testDroppedAPI() {
  try {
    console.log('🔍 Testing dropped access numbers API...');
    
    // Test the general dropped access numbers endpoint
    const response = await fetch('http://localhost:5000/api/students/dropped-access-numbers');
    const droppedNumbers = await response.json();
    
    console.log(`📊 General dropped access numbers: ${droppedNumbers.length}`);
    droppedNumbers.forEach(d => {
      console.log(`   ${d.accessNumber} - ${d.studentName} (${d.className} ${d.streamName})`);
    });
    
    // Test the specific class/stream endpoint for Senior 1 A
    const specificResponse = await fetch('http://localhost:5000/api/students/dropped-access-numbers/Senior%201/A');
    const specificDropped = await specificResponse.json();
    
    console.log(`\n📊 Dropped access numbers for Senior 1 A: ${specificDropped.length}`);
    specificDropped.forEach(d => {
      console.log(`   ${d.accessNumber} - ${d.studentName} (${d.className} ${d.streamName})`);
    });
    
    // Check if AA0003 is in the results
    const aa0003InGeneral = droppedNumbers.find(d => d.accessNumber === 'AA0003');
    const aa0003InSpecific = specificDropped.find(d => d.accessNumber === 'AA0003');
    
    console.log('\n🔍 AA0003 Analysis:');
    console.log(`   In general list: ${aa0003InGeneral ? 'YES' : 'NO'}`);
    console.log(`   In Senior 1 A list: ${aa0003InSpecific ? 'YES' : 'NO'}`);
    
    if (aa0003InSpecific) {
      console.log('✅ AA0003 should appear in the "Choose from Dropped" button');
    } else {
      console.log('❌ AA0003 is missing from Senior 1 A dropped list - this is why the button is not showing');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDroppedAPI();








