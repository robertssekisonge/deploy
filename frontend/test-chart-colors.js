// Test script to verify chart colors
console.log('🧪 Testing chart colors...');

// Check if the flowData has the correct colors
const testFlowData = [
  { name: 'Eligibility Check', value: 0, color: '#DC2626' },
  { name: 'Eligible', value: 0, color: '#2563EB' },
  { name: 'Available', value: 1, color: '#7C3AED' },
  { name: 'Pending Requests', value: 0, color: '#D97706' },
  { name: 'Admin Approval', value: 0, color: '#EA580C' },
  { name: 'Sponsored', value: 0, color: '#059669' },
];

console.log('📊 Test flowData:', testFlowData);
console.log('🎨 Available color should be:', testFlowData[2].color);
console.log('✅ If you see purple (#7C3AED) for Available, colors are working');
