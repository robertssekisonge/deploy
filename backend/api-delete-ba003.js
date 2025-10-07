async function apiDeleteBA003() {
  try {
    console.log('🗑️ Deleting BA003 via API...');
    
    // First, get all students to find BA003
    const response = await fetch('http://localhost:5000/api/students');
    const students = await response.json();
    
    const ba003 = students.find(s => s.accessNumber === 'BA003');
    if (!ba003) {
      console.log('❌ BA003 not found');
      return;
    }
    
    console.log(`📋 Found BA003: ${ba003.name} (ID: ${ba003.id})`);
    
    // Check other students in the same stream
    const otherStudents = students.filter(s => 
      s.class === ba003.class && 
      s.stream === ba003.stream && 
      s.id !== ba003.id
    );
    
    console.log(`📊 Other students in ${ba003.class} ${ba003.stream}: ${otherStudents.length}`);
    otherStudents.forEach(s => console.log(`   ${s.accessNumber} - ${s.name}`));
    
    // Delete BA003 via API
    console.log('\n🗑️ Deleting BA003 via API...');
    const deleteResponse = await fetch(`http://localhost:5000/api/students/${ba003.id}`, {
      method: 'DELETE'
    });
    
    const deleteResult = await deleteResponse.json();
    console.log('✅ Delete response:', deleteResult);
    
    // Check dropped access numbers
    const droppedResponse = await fetch('http://localhost:5000/api/students/dropped-access-numbers');
    const droppedNumbers = await droppedResponse.json();
    
    console.log(`\n📋 Dropped access numbers: ${droppedNumbers.length}`);
    droppedNumbers.forEach(d => console.log(`   ${d.accessNumber} - ${d.studentName}`));
    
    // Check if BA003 is in dropped list
    const ba003Dropped = droppedNumbers.find(d => d.accessNumber === 'BA003');
    if (ba003Dropped) {
      console.log('✅ BA003 is in dropped list (correct - not last in stream)');
    } else {
      console.log('❌ BA003 is NOT in dropped list (incorrect - should be there)');
    }
    
    // Check remaining students
    const remainingResponse = await fetch('http://localhost:5000/api/students');
    const remainingStudents = await remainingResponse.json();
    
    const senior2AStudents = remainingStudents.filter(s => s.class === 'Senior 2' && s.stream === 'A');
    console.log(`\n📋 Remaining students in Senior 2 A: ${senior2AStudents.length}`);
    senior2AStudents.forEach(s => console.log(`   ${s.accessNumber} - ${s.name}`));
    
    // Verify the logic
    console.log('\n🔍 Verification:');
    console.log(`   Expected: BA003 should be in dropped list (not last in stream)`);
    console.log(`   Expected: BA001, BA002, BA004 should remain as active students`);
    console.log(`   Expected: Only 1 dropped access number (BA003)`);
    
    if (ba003Dropped && senior2AStudents.length === 3 && droppedNumbers.length === 1) {
      console.log('✅ SUCCESS: Only BA003 was affected - simple delete logic working!');
    } else {
      console.log('❌ FAILED: Logic not working as expected');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

apiDeleteBA003();








