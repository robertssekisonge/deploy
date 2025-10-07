import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
// import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../common/NotificationProvider';
import { 
  DollarSign, 
  X,
  Receipt,
  CheckCircle
} from 'lucide-react';
import { filterFeeItemsByResidence } from '../../utils/feeCalculation';

interface BillingType {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  className: string;
  term: string;
  year: string;
}

const PaymentSystemSearch: React.FC = () => {
  const { students, billingTypes, findStudentByAccessNumber } = useData();
  // const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  
  // Load class fee structure directly from Settings endpoint; no hardcoded fallbacks
  const [classFeeItems, setClassFeeItems] = useState<any[]>([]);
  const fetchFeeStructures = async (className?: string) => {
    if (!className) { setClassFeeItems([]); return; }
    const normalized = String(className).trim();
    try {
      const res = await fetch((await import('../../utils/api')).buildApiUrl('settings/billing-types'));
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data?.value) ? data.value : (Array.isArray(data) ? data : []);
        const classBillingTypes = list.filter((bt: any) => String(bt.className || '').toLowerCase() === normalized.toLowerCase());
        const items = classBillingTypes.map((bt: any) => ({
          id: String(bt.id),
          name: bt.name || bt.feeName,
          amount: Number(bt.amount || 0),
          frequency: bt.frequency,
          className: normalized,
          term: bt.term,
          year: bt.year
        }));
        setClassFeeItems(items);
        return;
      }
    } catch (_e2) {}
    setClassFeeItems([]);
  };
  
  // Payment System State
  const [searchAccessNumber, setSearchAccessNumber] = useState('');
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  // const [selectedBillingTypes, setSelectedBillingTypes] = useState<string[]>([]);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [congratulationsMessage, setCongratulationsMessage] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showPaymentOptionsModal, setShowPaymentOptionsModal] = useState(false);
  const [selectedBillingType, setSelectedBillingType] = useState<BillingType | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('mobile-money');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [paidTotal, setPaidTotal] = useState<number>(0);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [feeRemaining, setFeeRemaining] = useState<Record<string, number>>({});
  // const [originalFeeMap, setOriginalFeeMap] = useState<Record<string, number>>({});
  const normalizeKey = (name: string) => (name || '').toString().trim().toLowerCase();

  // Compute the billing types to display once we know the selected child
  const displayedBillingTypes = React.useMemo(() => {
    if (!selectedChild) return [] as any[];
    console.log('🔄 Computing displayedBillingTypes for:', selectedChild.class);
    console.log('📊 classFeeItems:', classFeeItems);
    console.log('📊 billingTypes from context:', billingTypes);
    // Only use explicit residenceType field, default to Day if not specified
    const residence: 'Day' | 'Boarding' | undefined = (selectedChild as any)?.residenceType || 'Day';
    
    // Use classFeeItems if available, otherwise filter billingTypes from context
    if (classFeeItems && classFeeItems.length > 0) {
      // Filter by residenceType using shared util, then map back to original enriched items
      const { items } = filterFeeItemsByResidence(
        classFeeItems.map((it: any) => ({ feeName: it.name || it.feeName, name: it.feeName || it.name, amount: Number(it.amount || 0) })),
        residence
      );
      const allowed = new Set(items.map((i: any) => String(i.feeName || i.name).toLowerCase().trim()));
      const filtered = classFeeItems.filter((it: any) => allowed.has(String(it.name || it.feeName).toLowerCase().trim()));
      console.log('✅ Using residence-filtered classFeeItems:', filtered);
      return filtered as any[];
    } else if (billingTypes && billingTypes.length > 0) {
      const filtered = billingTypes.filter((bt: any) => bt.className === selectedChild.class);
      const { items } = filterFeeItemsByResidence(
        filtered.map((bt: any) => ({ feeName: bt.name, name: bt.name, amount: Number(bt.amount || 0) })),
        residence
      );
      const allowed = new Set(items.map((i: any) => String(i.feeName || i.name).toLowerCase().trim()));
      const residenceFiltered = filtered.filter((bt: any) => allowed.has(String(bt.name).toLowerCase().trim()));
      console.log('✅ Using residence-filtered billingTypes:', residenceFiltered);
      return residenceFiltered as any[];
    } else {
      console.log('⚠️ No billing types available');
      return [] as any[];
    }
  }, [classFeeItems, selectedChild, billingTypes]);

  // Handle click outside to close search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setShowSearchResults(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-refresh payment data when component mounts or when selectedChild changes
  useEffect(() => {
    if (selectedChild?.accessNumber) {
      console.log('🔄 Auto-refreshing payment data for:', selectedChild.name);
      // Debounce the refresh to prevent flickering
      const timeoutId = setTimeout(() => {
        refreshSummaryByAccess(selectedChild.accessNumber);
        // Also refresh fee structures for the selected child's class
        if (selectedChild.class) {
          console.log('🔄 Refreshing fee structures for class:', selectedChild.class);
          fetchFeeStructures(selectedChild.class);
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedChild]);

  // Force refresh payment data when modal opens
  useEffect(() => {
    if (showPaymentModal && selectedChild?.accessNumber) {
      console.log('🔄 Modal opened, fetching fresh payment data');
      // Debounce the refresh to prevent flickering
      const timeoutId = setTimeout(() => {
        refreshSummaryByAccess(selectedChild.accessNumber);
        // Also refresh fee structures for the selected child's class
        if (selectedChild.class) {
          console.log('🔄 Modal: Refreshing fee structures for class:', selectedChild.class);
          fetchFeeStructures(selectedChild.class);
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [showPaymentModal, selectedChild]);
  
  // Payment System Functions
  const handleSearchInputChange = (value: string) => {
    setSearchAccessNumber(value);
    setSelectedIndex(-1); // Reset selection when typing
    
    if (value.trim().length === 0) {
      setFilteredStudents([]);
      setShowSearchResults(false);
      return;
    }
    
    // Filter students based on access number, name, or class
    const filtered = students.filter(student => 
      student.accessNumber.toLowerCase().includes(value.toLowerCase()) ||
      student.name.toLowerCase().includes(value.toLowerCase()) ||
      student.class.toLowerCase().includes(value.toLowerCase())
    );
    
    setFilteredStudents(filtered);
    setShowSearchResults(filtered.length > 0);
  };

  const selectStudent = (student: any) => {
    setSelectedChild({
      accessNumber: student.accessNumber,
      name: student.name,
      className: student.class,
      residenceType: (student as any).residenceType,
      // Parent display not needed in this compact modal
    });
    setSearchAccessNumber(student.accessNumber);
    setShowSearchResults(false);
    setShowPaymentModal(true);
    
    // Immediately fetch payment data
    console.log('🔍 Opening payment modal for:', student.name);
    void refreshSummaryByAccess(student.accessNumber);
    void fetchFeeStructures(student.class);
  };

  const searchChild = () => {
    const student = findStudentByAccessNumber(searchAccessNumber);
    
    if (student) {
      setSelectedChild({
        accessNumber: student.accessNumber,
        name: student.name,
        className: student.class,
        residenceType: (student as any).residenceType,
        // Parent display not needed in this compact modal
      });
      setShowPaymentModal(true);
      
      // Immediately fetch payment data
      console.log('🔍 Opening payment modal for:', student.name);
      void refreshSummaryByAccess(student.accessNumber);
      void fetchFeeStructures(student.class);
    } else {
      showError('Student Not Found', `No student found with access number: ${searchAccessNumber}`, 5000);
    }
  };

  async function refreshSummaryByAccess(accessNumber: string) {
    try {
      const s = findStudentByAccessNumber(accessNumber);
      if (!s) {
        console.error('❌ Student not found for access number:', accessNumber);
        return;
      }

      console.log('🔄 Fetching payment summary for:', s.name, '(ID:', s.id, ')');
      console.log('🌐 API URL:', `http://localhost:5000/api/payments/summary/${s.id}`);
      
      const res = await fetch((await import('../../utils/api')).buildApiUrl(`payments/summary/${s.id}`));
      
      if (!res.ok) {
        console.error('❌ Failed to fetch payment summary:', res.status, res.statusText);
        return;
      }

      const summary = await res.json();
      console.log('📊 Raw payment summary:', summary);
      console.log('💰 Total Paid from API:', summary.totalPaid);
      console.log('💳 Balance from API:', summary.balance);
      
      // Set the totals
      const totalPaid = Number(summary.totalPaid || 0);
      const balance = Number(summary.balance || 0);
      
      setPaidTotal(totalPaid);
      setCurrentBalance(balance);
      
      console.log('💰 Set totals - Paid:', totalPaid, 'Balance:', balance);
      
      // Handle fee remaining amounts
      if (summary.paymentBreakdown && summary.paymentBreakdown.length > 0) {
        console.log('✅ Using payment breakdown from backend');
        const breakdownMap: Record<string, number> = {};
        
        summary.paymentBreakdown.forEach((item: any) => {
          const key = normalizeKey(item.billingType);
          const remaining = Number(item.remaining || 0);
          breakdownMap[key] = remaining;
          console.log(`📝 ${item.billingType}: remaining = ${remaining}`);
        });
        
        setFeeRemaining(breakdownMap);
        console.log('🎯 Final fee remaining map:', breakdownMap);
        
      } else {
        console.log('⚠️ No payment breakdown, deriving from class fee structure only');
        // Compute from class fee structure and financial records; no hardcoded defaults
        const paidByType: Record<string, number> = {};
        (summary.financialRecords || []).forEach((r: any) => {
          const key = normalizeKey(r.billingType || r.type || '');
          if (key) paidByType[key] = (paidByType[key] || 0) + Number(r.amount || 0);
        });
        // Ensure fee structure is loaded for this student's class
        if (classFeeItems.length === 0) {
          await fetchFeeStructures(s.class);
        }
        const remainingMap: Record<string, number> = {};
        const residence: 'Day' | 'Boarding' | undefined = (s as any)?.residenceType;
        const { items } = filterFeeItemsByResidence(
          (classFeeItems || []).map((bt: any) => ({ name: bt.name, feeName: bt.name, amount: Number(bt.amount || 0) })),
          residence
        );
        items.forEach((bt: any) => {
          const key = normalizeKey(bt.name || bt.feeName);
          const original = Number(bt.amount || 0);
          const paid = Number(paidByType[key] || 0);
          remainingMap[key] = Math.max(0, original - paid);
        });
        setFeeRemaining(remainingMap);
        console.log('🎯 Derived remaining map from fee structure:', remainingMap);
      }
      
    } catch (error) {
      console.error('❌ Error in refreshSummaryByAccess:', error);
    }
  }

  const handleBillingTypeSelect = (billingType: BillingType) => {
    setSelectedBillingType(billingType);
    // Default to the remaining amount for this fee if available
    const remainingForFee = feeRemaining[normalizeKey(billingType.name)];
    setPaymentAmount(
      typeof remainingForFee === 'number' ? remainingForFee : billingType.amount
    );
    setPaymentReference(`PAY${Date.now()}`);
    setShowPaymentOptionsModal(true);
  };

  const processPayment = async (billingType: BillingType, amount: number) => {
    // Find the student by access number to get their actual ID
    const student = findStudentByAccessNumber(searchAccessNumber);
    if (!student) {
      showError('Error', 'Student not found');
      return;
    }

    try {
      const response = await fetch((await import('../../utils/api')).buildApiUrl('payments/process'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: student.id,
          accessNumber: student.accessNumber,
          studentName: student.name,
          billingType: billingType.name,
          amount: Number(amount),
          paymentMethod: paymentMethod,
          paymentReference: paymentReference,
          description: `Payment for ${billingType.name} - ${student.name} (${student.accessNumber})`
        }),
      });

      if (response.ok) {
        await response.json();
        showSuccess('Payment Processed', `Payment of UGX ${amount.toLocaleString()} for ${billingType.name} has been processed successfully!`);
        
        // Show congratulations
        setCongratulationsMessage(`Payment of UGX ${amount.toLocaleString()} for ${billingType.name} processed successfully!`);
        setShowCongratulations(true);
        
        // Refresh summary from database to get accurate data
        await refreshSummaryByAccess(student.accessNumber);

        // Close only the payment options modal; keep the main modal open for continued payments
        setShowPaymentOptionsModal(false);
        
        // Reset form
        setTimeout(() => {
          setShowCongratulations(false);
        }, 5000);
      } else {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (_e) {}
        console.error('❌ Payment failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        // Try parse JSON
        let message = 'Failed to process payment';
        try {
          const parsed = JSON.parse(errorText);
          message = parsed.error || parsed.message || message;
        } catch (_e) {
          if (errorText) message = errorText;
        }
        showError('Payment Failed', `${message} (HTTP ${response.status})`);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      showError('Payment Failed', 'Failed to process payment. Please try again.');
    }
  };

  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-extrabold text-green-700 mb-2 tracking-wide">Payment System</h3>
      <p className="text-gray-600 mb-6">Search for children by access number and process their fee payments.</p>
      
      {/* Search Section */}
      <div className="bg-green-50 rounded-xl p-3 border border-green-200">
        <h4 className="text-sm font-bold text-green-800 mb-2">🔍 Search Child</h4>
        <div className="flex space-x-2">
          <div className="flex-1 relative search-container">
            <label className="block text-xs font-medium text-green-700 mb-1">Access Number</label>
            <input
              type="text"
              placeholder="Enter access number..."
              value={searchAccessNumber}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              onFocus={() => {
                if (searchAccessNumber.trim().length > 0 && filteredStudents.length > 0) {
                  setShowSearchResults(true);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setSelectedIndex(prev => 
                    prev < filteredStudents.length - 1 ? prev + 1 : prev
                  );
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  if (selectedIndex >= 0 && filteredStudents[selectedIndex]) {
                    selectStudent(filteredStudents[selectedIndex]);
                  } else {
                    searchChild();
                  }
                } else if (e.key === 'Escape') {
                  setShowSearchResults(false);
                  setSelectedIndex(-1);
                }
              }}
              className="w-full rounded-lg border border-green-200 px-2 py-1.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-200"
            />
            
            {/* Real-time Search Results Dropdown */}
            {showSearchResults && (
              <div className="absolute z-50 w-full mt-1 bg-white border-2 border-green-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student, index) => (
                    <div
                      key={student.id}
                      onClick={() => selectStudent(student)}
                      className={`px-4 py-3 cursor-pointer transition-colors ${
                        index === selectedIndex 
                          ? 'bg-green-100 border-l-4 border-green-500' 
                          : 'hover:bg-green-50'
                      } ${
                        index === filteredStudents.length - 1 ? '' : 'border-b border-green-100'
                      }`}
                    >
                      <div className="font-medium text-green-800">{student.name}</div>
                      <div className="text-sm text-green-600">
                        {student.accessNumber} • {student.class}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-gray-500 text-center">
                    No students found matching "{searchAccessNumber}"
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-end">
            <button
              onClick={searchChild}
              className="bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700 transition-colors shadow-md text-sm"
            >
              Search
            </button>
          </div>
        </div>
              
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedChild && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-4 shadow-xl w-full max-w-2xl max-h-[60vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Payment for {selectedChild.name}</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Student Info Banner */}
            <div className="bg-gradient-to-r from-purple-50/50 to-blue-50/50 rounded-lg p-3 mb-4 border border-purple-200/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-purple-600 text-sm">Student</div>
                  <div className="font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">{selectedChild.name}</div>
                </div>
                <div>
                  <div className="text-purple-600 text-sm">Access Number</div>
                  <div className="font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">{selectedChild.accessNumber}</div>
                </div>
                <div>
                  <div className="text-purple-600 text-sm">Class</div>
                  <div className="font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">{selectedChild.className}</div>
                </div>
              </div>
            </div>

            {/* Three Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Original Fees Column (Purple) */}
              <div className="bg-gradient-to-br from-purple-50/50 to-blue-50/50 rounded-lg p-3 border border-purple-200/50">
                <h3 className="text-base font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-3 flex items-center">
                  <Receipt className="h-4 w-4 mr-2" /> Original Fees
                </h3>
                <div className="space-y-1">
                  {displayedBillingTypes.map(bt => (
                    <div key={bt.id} className="bg-white/80 backdrop-blur-sm p-1 rounded border border-purple-200/50">
                      <div className="font-semibold text-xs">{bt.name}</div>
                      <div className="text-sm font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">UGX {bt.amount.toLocaleString()}</div>
                      <div className="text-xs text-gray-600">{bt.frequency} • {bt.term} {bt.year}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-2 border-t border-purple-200/50">
                  <div className="text-xs text-gray-600">Total Required:</div>
                  <div className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    UGX {displayedBillingTypes.reduce((sum, bt) => sum + bt.amount, 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Already Paid Column (Green) */}
              <div className="bg-gradient-to-br from-green-50/50 to-emerald-50/50 rounded-lg p-3 border border-green-200/50">
                <h3 className="text-base font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" /> Already Paid
                </h3>
                <div className="space-y-2">
                  {paidTotal > 0 ? (
                    <>
                      <div className="text-sm font-semibold text-green-700">Total Paid:</div>
                      <div className="text-xl font-extrabold text-green-700">UGX {paidTotal.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">Balance: UGX {currentBalance.toLocaleString()}</div>
                    </>
                  ) : (
                    <div className="text-sm text-gray-500">No payments made yet</div>
                  )}
                  <button
                    onClick={() => refreshSummaryByAccess(selectedChild?.accessNumber)}
                    className="w-full bg-white/80 backdrop-blur-sm p-2 rounded border border-green-200/50 text-xs hover:bg-white"
                  >
                    Refresh Paid Amount
                  </button>
                </div>
              </div>

              {/* Balance Remaining Column (Orange) */}
              <div className="bg-gradient-to-br from-orange-50/50 to-red-50/50 rounded-lg p-3 border border-orange-200/50">
                <h3 className="text-base font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-3 flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" /> Balance Remaining
                </h3>
                <div className="space-y-1">
                  {displayedBillingTypes
                    .map(bt => {
                      const key = normalizeKey(bt.name);
                      const remaining = typeof feeRemaining[key] === 'number' 
                        ? Math.max(0, Number(feeRemaining[key])) 
                        : bt.amount;
                      const disabled = remaining <= 0;
                      return (
                        <div key={bt.id} className="bg-white/80 backdrop-blur-sm p-1 rounded border border-orange-200/50">
                          <div className="font-semibold text-xs">{bt.name}</div>
                          <div className="text-sm font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">UGX {remaining.toLocaleString()}</div>
                          <div className="text-xs text-gray-600">Remaining</div>
                          <button
                            onClick={() => handleBillingTypeSelect(bt)}
                            disabled={disabled}
                            className={`mt-1 w-full text-white px-2 py-1 rounded text-xs transition-all duration-200 shadow-md hover:shadow-lg ${disabled ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'}`}
                          >
                            {disabled ? 'Paid' : `Pay UGX ${remaining.toLocaleString()}`}
                          </button>
                        </div>
                      );
                    })}
                </div>
                <div className="mt-3 pt-2 border-t border-orange-200/50">
                  <div className="text-xs text-gray-600">Total Remaining:</div>
                  <div className="text-lg font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    {(() => {
                      const total = displayedBillingTypes.reduce((sum, bt) => {
                        const key = normalizeKey(bt.name);
                        const remaining = typeof feeRemaining[key] === 'number' ? Number(feeRemaining[key]) : bt.amount;
                        return sum + Math.max(0, remaining);
                      }, 0);
                      return `UGX ${total.toLocaleString()}`;
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Options Modal */}
      {showPaymentOptionsModal && selectedBillingType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-white to-purple-50/30 backdrop-blur-sm rounded-xl p-6 shadow-xl w-full max-w-md border border-purple-200/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Process Payment</h3>
              <button
                onClick={() => setShowPaymentOptionsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Billing Type</label>
                <div className="p-3 bg-gradient-to-r from-purple-50/50 to-blue-50/50 rounded-lg border border-purple-200/50">
                  <div className="font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">{selectedBillingType.name}</div>
                  <div className="text-sm text-gray-600">{selectedBillingType.frequency} • {selectedBillingType.term} {selectedBillingType.year}</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full rounded-lg border-purple-200/50 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-white/80 backdrop-blur-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded-lg border-purple-200/50 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-white/80 backdrop-blur-sm"
                >
                  <option value="mobile-money">Mobile Money</option>
                  <option value="bank-transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="momo">MTN MoMo</option>
                  <option value="airtel-money">Airtel Money</option>
                  <option value="visa">Visa</option>
                  <option value="mastercard">Mastercard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Reference</label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full rounded-lg border-purple-200/50 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-white/80 backdrop-blur-sm"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowPaymentOptionsModal(false)}
                className="flex-1 px-4 py-2 border border-purple-200/50 rounded-lg text-gray-700 hover:bg-purple-50/50 transition-all duration-200 bg-white/80 backdrop-blur-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => processPayment(selectedBillingType, paymentAmount)}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Process Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Congratulations Modal */}
      {showCongratulations && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 shadow-xl text-center max-w-md">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-green-600 mb-4">Payment Successful!</h3>
            <p className="text-gray-600 mb-6">{congratulationsMessage}</p>
            <button
              onClick={() => setShowCongratulations(false)}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentSystemSearch;
