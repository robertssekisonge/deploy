async function testApiDeleteMiddle() {
  try {
    console.log('🧪 Testing API delete middle student...');
    
    // First, get all students to find AA002
    const response = await fetch('http://localhost:5000/api/students');
    const students = await response.json();
    
    const aa002 = students.find(s => s.accessNumber === 'AA002');
    if (!aa002) {
      console.log('❌ AA002 not found');
      return;
    }
    
    console.log(`📋 Found AA002: ${aa002.name} (ID: ${aa002.id})`);
    
    // Check other students in the same stream
    const otherStudents = students.filter(s => 
      s.class === aa002.class && 
      s.stream === aa002.stream && 
      s.id !== aa002.id
    );
    
    console.log(`📊 Other students in ${aa002.class} ${aa002.stream}: ${otherStudents.length}`);
    otherStudents.forEach(s => console.log(`   ${s.accessNumber} - ${s.name}`));
    
    // Delete AA002 via API
    console.log('\n🗑️ Deleting AA002 via API...');
    const deleteResponse = await fetch(`http://localhost:5000/api/students/${aa002.id}`, {
      method: 'DELETE'
    });
    
    const deleteResult = await deleteResponse.json();
    console.log('✅ Delete response:', deleteResult);
    
    // Check dropped access numbers
    const droppedResponse = await fetch('http://localhost:5000/api/students/dropped-access-numbers');
    const droppedNumbers = await droppedResponse.json();
    
    console.log(`\n📋 Dropped access numbers: ${droppedNumbers.length}`);
    droppedNumbers.forEach(d => console.log(`   ${d.accessNumber} - ${d.studentName}`));
    
    // Check if AA002 is in dropped list
    const aa002Dropped = droppedNumbers.find(d => d.accessNumber === 'AA002');
    if (aa002Dropped) {
      console.log('✅ AA002 is in dropped list (correct - not last in stream)');
    } else {
      console.log('❌ AA002 is NOT in dropped list (incorrect - should be there)');
    }
    
    // Check remaining students
    const remainingResponse = await fetch('http://localhost:5000/api/students');
    const remainingStudents = await remainingResponse.json();
    
    const senior1AStudents = remainingStudents.filter(s => s.class === 'Senior 1' && s.stream === 'A');
    console.log(`\n📋 Remaining students in Senior 1 A: ${senior1AStudents.length}`);
    senior1AStudents.forEach(s => console.log(`   ${s.accessNumber} - ${s.name}`));
    
    // Verify the logic
    console.log('\n🔍 Verification:');
    console.log(`   Expected: AA002 should be in dropped list (not last in stream)`);
    console.log(`   Expected: AA001 and AA003 should remain as active students`);
    console.log(`   Expected: Only 1 dropped access number (AA002)`);
    
    if (aa002Dropped && senior1AStudents.length === 2 && droppedNumbers.length === 1) {
      console.log('✅ SUCCESS: API logic working correctly!');
    } else {
      console.log('❌ FAILED: API logic not working as expected');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testApiDeleteMiddle();








