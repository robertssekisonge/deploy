/**
 * Fee calculation utilities for student admission (Backend)
 * NO HARDCODED DEFAULTS - All fees must come from database
 */

// Fee constants - these should be overridden by database values
const BOARDING_FEE = 500000;
const LUNCH_FEE = 0; // Will be set from database
const BASE_CLASS_FEES = {
  Default: 0, // Will be set from database
  'P.1': 0,
  'P.2': 0,
  'P.3': 0,
  'P.4': 0,
  'P.5': 0,
  'P.6': 0,
  'P.7': 0,
  'S.1': 0,
  'S.2': 0,
  'S.3': 0,
  'S.4': 0,
  'S.5': 0,
  'S.6': 0,
};

/**
 * Calculate total fees for a student - NO DEFAULTS
 * @param className - Student's class
 * @param residenceType - Student's residence type ('Day' or 'Boarding')
 * @returns Always returns 0 - fees must be set via database only
 */
export function calculateStudentFees(className: string, residenceType?: 'Day' | 'Boarding'): number {
  // NO HARDCODED DEFAULTS - All fees must come from database
  return 0;
}

/**
 * Get breakdown of student fees
 * @param className - Student's class
 * @param residenceType - Student's residence type ('Day' or 'Boarding')
 * @returns Object with fee breakdown
 */
export function getStudentFeeBreakdown(className: string, residenceType?: 'Day' | 'Boarding') {
  const baseFee = BASE_CLASS_FEES[className as keyof typeof BASE_CLASS_FEES] || BASE_CLASS_FEES.Default;
  const lunchFee = residenceType === 'Day' ? LUNCH_FEE : 0;
  const boardingFee = residenceType === 'Boarding' ? BOARDING_FEE : 0;
  const totalFees = baseFee + lunchFee + boardingFee;
  
  return {
    baseTuition: baseFee,
    lunchFee: lunchFee,
    boardingFee: boardingFee,
    totalFees: totalFees,
    residenceType: residenceType || 'Day',
    hasBoarding: residenceType === 'Boarding',
    hasLunch: residenceType === 'Day'
  };
}

/**
 * Filter a fee items array by residence type rules:
 * - Day students: remove Boarding-related fee items (keep lunch fees)
 * - Boarding students: remove Lunch-related fee items (keep boarding fees)
 */
export function filterFeeItemsByResidence(
  items: Array<{ feeName?: string; name?: string; amount: number }>,
  residenceType?: 'Day' | 'Boarding'
) {
  const safeItems = Array.isArray(items) ? items : [];
  const normalize = (v: any) => String(v || '').toLowerCase().trim();

  console.log('🔍 Filter Debug - Input:', { residenceType, itemCount: safeItems.length, items: safeItems.slice(0, 3) });

  let filtered = safeItems;
  
  // For Day students: remove boarding fees, keep lunch fees
  if (residenceType === 'Day') {
    console.log('🔍 Filter Debug - Applying Day filter (remove boarding fees, keep lunch fees)...');
    filtered = safeItems.filter((it) => {
      const label = normalize(it.feeName ?? it.name);
      const shouldKeep = !(label.includes('board') || label.includes('boarding'));
      console.log(`🔍 Filter Debug - Day Student Item: "${it.feeName ?? it.name}" (${label}) -> ${shouldKeep ? 'KEEP' : 'REMOVE'}`);
      return shouldKeep;
    });
  } 
  // For Boarding students: remove lunch fees, keep boarding fees
  else if (residenceType === 'Boarding') {
    console.log('🔍 Filter Debug - Applying Boarding filter (remove lunch fees, keep boarding fees)...');
    filtered = safeItems.filter((it) => {
      const label = normalize(it.feeName ?? it.name);
      const shouldKeep = !(label.includes('lunch') || label.includes('luch'));
      console.log(`🔍 Filter Debug - Boarding Student Item: "${it.feeName ?? it.name}" (${label}) -> ${shouldKeep ? 'KEEP' : 'REMOVE'}`);
      return shouldKeep;
    });
  }
  // Default behavior: treat as Day student (remove boarding fees)
  else {
    console.log('🔍 Filter Debug - Default to Day filter (remove boarding fees)...');
    filtered = safeItems.filter((it) => {
      const label = normalize(it.feeName ?? it.name);
      const shouldKeep = !(label.includes('board') || label.includes('boarding'));
      console.log(`🔍 Filter Debug - Default Item: "${it.feeName ?? it.name}" (${label}) -> ${shouldKeep ? 'KEEP' : 'REMOVE'}`);
      return shouldKeep;
    });
  }

  const total = filtered.reduce((sum, it) => sum + Number(it.amount || 0), 0);
  console.log('🔍 Filter Debug - Result:', { residenceType, filteredCount: filtered.length, total });
  return { items: filtered, total };
}

// Export constants for use in other services
export { BOARDING_FEE, LUNCH_FEE, BASE_CLASS_FEES };
