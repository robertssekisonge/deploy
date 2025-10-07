// Extended API test: health + sample payment processing
console.log('🧪 Testing API connectivity and payment endpoint...');

const runTests = async () => {
  const base = 'http://localhost:5000';
  try {
    const health = await fetch(`${base}/api/health/simple`).then(r => r.json());
    console.log('✅ Health:', health);
  } catch (e) {
    console.error('❌ Health check failed:', e.message);
  }

  try {
    // Get students to pick one valid id
    const studentsResp = await fetch(`${base}/api/students`);
    const studentsText = await studentsResp.text();
    const students = (() => { try { return JSON.parse(studentsText); } catch { return []; } })();
    const student = Array.isArray(students) && students.length > 0 ? students[0] : null;
    if (!student) {
      console.warn('⚠️ No students found. Skipping payment test.');
      return;
    }

    const payload = {
      studentId: String(student.id),
      billingType: 'Test Fee',
      amount: 1234,
      paymentMethod: 'cash',
      paymentReference: `TEST${Date.now()}`,
      description: `Automated test payment for ${student.name}`
    };

    const resp = await fetch(`${base}/api/payments/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const text = await resp.text();
    let body; try { body = JSON.parse(text); } catch { body = text; }
    console.log('💳 Payment response:', resp.status, body);
    if (!resp.ok) throw new Error(typeof body === 'string' ? body : (body?.error || body?.message || 'Unknown error'));
    console.log('✅ Payment endpoint OK');
  } catch (e) {
    console.error('❌ Payment test failed:', e.message);
  }
};

runTests();
