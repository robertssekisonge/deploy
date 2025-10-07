// Run this in the browser console to clear all payment-related caches

console.log('🧹 Clearing all payment-related caches...');

// Clear localStorage
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (
    key.startsWith('paymentSummary_') ||
    key.startsWith('feeStructure_') ||
    key.startsWith('paymentCache_') ||
    key.startsWith('studentCache_') ||
    key.includes('payment') ||
    key.includes('fee') ||
    key.includes('medical')
  )) {
    keysToRemove.push(key);
  }
}

keysToRemove.forEach(key => {
  localStorage.removeItem(key);
  console.log('🗑️ Removed localStorage key:', key);
});

// Clear sessionStorage
const sessionKeysToRemove = [];
for (let i = 0; i < sessionStorage.length; i++) {
  const key = sessionStorage.key(i);
  if (key && (
    key.startsWith('paymentSummary_') ||
    key.startsWith('feeStructure_') ||
    key.includes('payment') ||
    key.includes('fee')
  )) {
    sessionKeysToRemove.push(key);
  }
}

sessionKeysToRemove.forEach(key => {
  sessionStorage.removeItem(key);
  console.log('🗑️ Removed sessionStorage key:', key);
});

// Clear window cache
if (typeof window !== 'undefined') {
  delete window.__feeStructCache;
  delete window.__paymentCache;
  delete window.__studentCache;
  console.log('🗑️ Cleared window cache objects');
}

console.log(`✅ Cache clearing complete! Removed ${keysToRemove.length + sessionKeysToRemove.length} cache entries.`);
console.log('🔄 Please refresh the parent dashboard to see the updated data.');

// Force a hard refresh
if (confirm('Would you like to refresh the page now?')) {
  window.location.reload(true);
}



