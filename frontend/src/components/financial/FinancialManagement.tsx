import React, { useState, useEffect, useRef } from 'react';

// Extend window interface for timeout
declare global {
  interface Window {
    paymentSearchTimeout?: NodeJS.Timeout;
  }
}
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { calculateStudentFees, filterFeeItemsByResidence } from '../../utils/feeCalculation';
import { buildApiUrl } from '../../utils/api';
import PaymentSystem from '../payments/PaymentSystem';
import PaymentOptionsModal from '../payments/PaymentOptionsModal';
import { InteractionTrackerProvider } from '../analytics/InteractionTracker';
import { 
  CreditCard,
  FileText,
  BarChart3,
  Receipt,
  Users,
  AlertTriangle,
  DollarSign,
  Stethoscope,
  Mail,
  MessageSquare,
  ChevronDown,
  Send,
  Calendar,
  ExternalLink,
  Plus,
  RefreshCw,
  X
} from 'lucide-react';

const FinancialManagement: React.FC<{ initialTab?: 'financial-statements' | 'add-payment' | 'financial-records' | 'payment-system' }> = ({ initialTab }) => {
  const { user } = useAuth();
  const location = useLocation();
  const { students, financialRecords, clinicRecords, findStudentByAccessNumber, fetchStudents, fetchFinancialRecords, billingTypes } = useData();
  const [activeTab, setActiveTab] = useState<'financial-statements' | 'add-payment' | 'financial-records' | 'payment-system'>(initialTab || 'financial-statements');

  // Force Payment Analysis when routed via /payment-analysis
  useEffect(() => {
    if (location.pathname.includes('/payment-analysis')) {
      setActiveTab('payment-system');
      return;
    }
    if (location.pathname.includes('/pay-staff')) {
      setActiveTab('payment-system');
      return;
    }
    if (location.pathname.includes('/financial-management')) {
      setActiveTab('financial-statements');
    }
  }, [location.pathname]);

  // Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<{
    type: string;
    amount: number;
    studentName: string;
    className?: string;
    term?: string;
    year?: string;
  } | null>(null);

  // Payment data state
  const [paymentSummary, setPaymentSummary] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Student search for payments
  const [paymentStudentSearch, setPaymentStudentSearch] = useState('');
  const [selectedPaymentStudent, setSelectedPaymentStudent] = useState<any>(null);
  
  // Term and Year selection for payment filtering
  const [selectedTerm, setSelectedTerm] = useState('Term 3');
  const [selectedYear, setSelectedYear] = useState('2025');

  // ===== Staff Pay UI state =====
  const [staffList, setStaffList] = useState<any[]>([]);
  const [staffRoles, setStaffRoles] = useState<string[]>([]);
  const [selectedStaffRole, setSelectedStaffRole] = useState<string>('');
  const [staffSearch, setStaffSearch] = useState('');
  const [payingStaffId, setPayingStaffId] = useState<number | null>(null);
  const [payAmount, setPayAmount] = useState<string>('');
  const [payNote, setPayNote] = useState<string>('');
  const [staffSummary, setStaffSummary] = useState<any | null>(null);
  const [showStaffModal, setShowStaffModal] = useState(false);

  useEffect(() => {
    // Load staff and roles for Pay Staff screen
    const loadStaff = async () => {
      try {
        const r = await fetch('http://localhost:5000/api/staff');
        if (r.ok) {
          const list = await r.json();
          setStaffList(Array.isArray(list) ? list : []);
          const rs = Array.from(new Set((list || []).map((s: any) => (s.role || 'Unassigned').trim()))).filter(Boolean).sort();
          setStaffRoles(rs);
          if (!selectedStaffRole && rs.length) setSelectedStaffRole(rs[0]);
        }
      } catch {}
    };
    if (location.pathname.includes('/pay-staff')) {
      loadStaff();
    }
  }, [location.pathname]);

  const filteredStaff = staffList.filter((s: any) => {
    const roleOk = !selectedStaffRole || (s.role || 'Unassigned') === selectedStaffRole;
    const term = (s.name || '').toLowerCase();
    const phone = (s.phone || '').toLowerCase();
    const q = staffSearch.toLowerCase();
    const searchOk = !q || term.includes(q) || phone.includes(q);
    return roleOk && searchOk;
  });

  const openStaffPayment = async (id: number) => {
    try {
      const r = await fetch(`http://localhost:5000/api/staff/${id}/payments/summary`);
      if (r.ok) {
        const j = await r.json();
        setStaffSummary(j);
        setPayingStaffId(id);
        setPayAmount(String(j.remaining || j.staff?.amountToPay || ''));
        setShowStaffModal(true);
      }
    } catch {}
  };

  const payStaff = async () => {
    if (!payingStaffId) return;
    const amountNum = Number(payAmount);
    if (!amountNum || isNaN(amountNum) || amountNum <= 0) {
      alert('Enter a valid amount');
      return;
    }
    try {
      const r = await fetch(`http://localhost:5000/api/staff/${payingStaffId}/pay`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountNum, description: payNote, method: 'cash' })
      });
      if (!r.ok) throw new Error(await r.text());
      const id = payingStaffId;
      setPayingStaffId(null);
      setPayAmount('');
      setPayNote('');
      await openStaffPayment(id);
      alert('Staff payment recorded');
    } catch (e: any) {
      alert(e.message || 'Payment failed');
    }
  };
  
  // Get student's admission term/year based on createdAt date
  const getStudentAdmissionTerm = (student: any) => {
    if (!student?.createdAt) return { term: 'Term 3', year: '2025' };
    
    const admissionDate = new Date(student.createdAt);
    const year = admissionDate.getFullYear();
    
    // Determine term based on month
    const month = admissionDate.getMonth() + 1; // 1-12
    let term = 'Term 3'; // Default
    
    if (month >= 1 && month <= 4) {
      term = 'Term 1';
    } else if (month >= 5 && month <= 8) {
      term = 'Term 2';
    } else if (month >= 9 && month <= 12) {
      term = 'Term 3';
    }
    
    return { term, year: year.toString() };
  };
  
  // Get available terms/years for this student (from admission onwards)
  const getAvailableTermsForStudent = (student: any) => {
    const admission = getStudentAdmissionTerm(student);
    const currentYear = new Date().getFullYear();
    const years = [];
    const terms = [];
    
    // Generate years from admission year to current year + 1
    for (let year = parseInt(admission.year); year <= currentYear + 1; year++) {
      years.push(year.toString());
    }
    
    // Generate all terms (1, 2, 3) for all available years
    // This allows students to see all terms from their admission onwards
    terms.push('Term 1', 'Term 2', 'Term 3');
    
    return { terms, years };
  };
  
  // Refresh payment data when term or year changes
  useEffect(() => {
    if (selectedPaymentStudent) {
      fetchPaymentDataForStudent(selectedPaymentStudent.id, selectedTerm, selectedYear);
    }
  }, [selectedTerm, selectedYear, selectedPaymentStudent]);
  
  // Set default term/year to student's admission term when student is selected
  useEffect(() => {
    if (selectedPaymentStudent) {
      const admission = getStudentAdmissionTerm(selectedPaymentStudent);
      setSelectedTerm(admission.term);
      setSelectedYear(admission.year);
    }
  }, [selectedPaymentStudent]);
  
  // Normalize Day/Boarding from explicit residenceType field only
  const getResidenceFromStudent = (student: any): 'Day' | 'Boarding' | undefined => {
    // Only use explicit residenceType field, don't infer from other fields
    const residenceType = student?.residenceType;
    
    console.log('🔍 Residence detection debug:', {
      student: student?.name,
      residenceType: residenceType,
      detected: residenceType === 'Boarding' ? 'Boarding' : residenceType === 'Day' ? 'Day' : undefined
    });
    
    // Only return explicit values, don't infer from class names or other fields
    if (residenceType === 'Boarding' || residenceType === 'Day') {
      return residenceType;
    }
    
    return undefined; // Let the calling code decide the default
  };
  const [isSearchingStudent, setIsSearchingStudent] = useState(false);

  // Financial Statements state
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [searchAccessNumber, setSearchAccessNumber] = useState('');
  const [statementType, setStatementType] = useState<'school-wide' | 'individual'>('school-wide');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [generatedStatement, setGeneratedStatement] = useState<any>(null);

  // Balance Reminder state
  const [selectedBalanceAmount, setSelectedBalanceAmount] = useState<string>('');
  const [showReminderDropdown, setShowReminderDropdown] = useState(false);
  const [balanceRefreshTrigger, setBalanceRefreshTrigger] = useState(0);
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const [whatsappUrls, setWhatsappUrls] = useState<string[]>([]);
  const [showWhatsappUrls, setShowWhatsappUrls] = useState(false);

  // On-demand fee structure fetcher - fetch fresh from fee-structures (single source of truth)
  const loadFeeStructureForClass = async (className: string, term?: string, year?: string, student?: any) => {
    const cls = String(className || '').trim();
    
    if (!cls) {
      console.warn('⚠️ Empty class name provided to loadFeeStructureForClass');
      return { items: [], total: 0 };
    }
    
    console.log(`🔄 Loading fee structure for class: "${cls}"`);
    
    try {
      // Build API URL with term and year parameters if provided
      let apiUrl = buildApiUrl(`settings/fee-structures/${encodeURIComponent(cls)}`);
      if (term && year) {
        apiUrl += `?term=${encodeURIComponent(term)}&year=${encodeURIComponent(year)}`;
      }
      console.log(`🌐 API URL: ${apiUrl}`);
      
      const res = await fetch(apiUrl);
      console.log(`📡 Response status: ${res.status} ${res.statusText}`);
      
      if (res.ok) {
        const json = await res.json();
        console.log(`📋 Raw response for ${cls}:`, json);
        
        let items = Array.isArray(json?.feeStructures) ? json.feeStructures.map((f: any) => ({
          id: f.id,
          feeName: f.feeName || f.name,
          amount: Number(f.amount || 0),
          frequency: f.frequency,
          term: f.term,
          year: f.year,
        })) : [];
        
        // Filter fees by student's admission term if student info is provided
        if (student && term && year) {
          const admission = getStudentAdmissionTerm(student);
          const admissionTermNum = parseInt(admission.term.split(' ')[1]);
          const admissionYear = parseInt(admission.year);
          const selectedTermNum = parseInt(term.split(' ')[1]);
          const selectedYearNum = parseInt(year);
          
          // Only show fees for terms from admission onwards
          if (selectedYearNum < admissionYear || 
              (selectedYearNum === admissionYear && selectedTermNum < admissionTermNum)) {
            console.log(`🚫 Filtering out fee structures for ${term} ${year} - student joined in ${admission.term} ${admission.year}`);
            items = []; // No fee structures for terms before admission
          }
        }
        
        // Backend now handles term/year filtering, so use all items returned
        let filteredItems = items;
        
        // Don't calculate total here - let the filtering function handle it based on residence type
        const total = 0;
        
        console.log(`✅ Loaded fee structure for ${cls}:`, { 
          itemsCount: filteredItems.length, 
          total, 
          apiResponse: json,
          parsedItems: filteredItems
        });
        
        // populate in-memory cache and localStorage used by renderers
        const cache: any = (window as any).__feeStructCache || {};
        cache[cls] = { items: filteredItems, total };
        (window as any).__feeStructCache = cache;
        
        try { 
          localStorage.setItem(`feeStructure_${cls}`, JSON.stringify({ items: filteredItems, total })); 
        } catch (_) {}
        
        return { items: filteredItems, total };
      } else {
        console.error(`❌ Failed to load fee structure for ${cls}:`, res.status, res.statusText);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to fetch fee structure for ${cls}:`, error);
    }
    
    console.log(`❌ Returning empty fee structure for ${cls}`);
    return { items: [], total: 0 };
  };

  // Helper function to calculate remaining balance for a fee type

  // Helper function to calculate previous term balance
  const getPreviousTermBalance = async (student: any, currentTerm: string, currentYear: string) => {
    if (!student || !currentTerm || !currentYear) return 0;
    
    try {
      const admission = getStudentAdmissionTerm(student);
      const currentTermNum = parseInt(currentTerm.split(' ')[1]);
      const currentYearNum = parseInt(currentYear);
      
      // Don't calculate previous balance for the first term of admission
      if (currentTermNum === parseInt(admission.term.split(' ')[1]) && 
          currentYearNum === parseInt(admission.year)) {
        return 0; // Student's first term, no previous balance
      }
      
      // Calculate previous term
      let previousTerm = '';
      let previousYear = currentYear;
      
      if (currentTermNum === 1) {
        // Previous term is Term 3 of previous year
        previousTerm = 'Term 3';
        previousYear = (currentYearNum - 1).toString();
      } else {
        // Previous term is Term (currentTermNum - 1) of same year
        previousTerm = `Term ${currentTermNum - 1}`;
      }
      
      // Fetch payment data for previous term
      const response = await fetch(buildApiUrl(`payments/summary/${student.id}?term=${previousTerm}&year=${previousYear}`));
      if (!response.ok) return 0;
      
      const data = await response.json();
      
      // Calculate previous term balance
      const previousRequired = getTotalRequiredFees(student.class, undefined, student, previousTerm, previousYear);
      const previousPaid = data.totalPaid || 0;
      const previousBalance = Math.max(0, previousRequired - previousPaid);
      
      console.log(`💰 Previous term balance for ${student.name}:`, {
        previousTerm,
        previousYear,
        previousRequired,
        previousPaid,
        previousBalance
      });
      
      return previousBalance;
    } catch (error) {
      console.error('Error calculating previous term balance:', error);
      return 0;
    }
  };

  // Helper function to calculate total required fees for a student's class
  const getTotalRequiredFees = (studentClass: string, residenceType?: 'Day' | 'Boarding', student?: any, selectedTerm?: string, selectedYear?: string) => {
    const cached = (window as any).__feeStructCache || {};
    let items: any[] = Array.isArray(cached[String(studentClass)]?.items) ? cached[String(studentClass)].items : [];
    
    // Filter fees by student's admission term if student info is provided
    if (student && selectedTerm && selectedYear) {
      const admission = getStudentAdmissionTerm(student);
      const admissionTermNum = parseInt(admission.term.split(' ')[1]);
      const admissionYear = parseInt(admission.year);
      const selectedTermNum = parseInt(selectedTerm.split(' ')[1]);
      const selectedYearNum = parseInt(selectedYear);
      
      // Only show fees for terms from admission onwards
      if (selectedYearNum < admissionYear || 
          (selectedYearNum === admissionYear && selectedTermNum < admissionTermNum)) {
        console.log(`🚫 Filtering out fees for ${selectedTerm} ${selectedYear} - student joined in ${admission.term} ${admission.year}`);
        return 0; // No fees for terms before admission
      }
    }
    
    // Apply Day/Boarding filtering to cached items to ensure correct totals
    const { items: filteredItems, total: filteredCachedTotal } = filterFeeItemsByResidence(items, residenceType);
    
    // If we have cached items, use them (they already include boarding fee if applicable)
    if (filteredCachedTotal > 0) {
      console.log(`💰 Fee calculation for ${studentClass}:`, {
        cacheExists: !!cached[String(studentClass)],
        itemsCount: filteredItems.length,
        items: filteredItems,
        total: filteredCachedTotal,
        source: 'cached'
      });
      return filteredCachedTotal;
    }
    
    // Fallback to our fee calculation utility if no cached data
    const calculatedTotal = calculateStudentFees(studentClass, residenceType);
    
    console.log(`💰 Fee calculation for ${studentClass} (${residenceType || 'Day'}):`, {
      cacheExists: false,
      total: calculatedTotal,
      source: 'calculated'
    });
    
    return calculatedTotal;
  };

  // Remove aggressive preloading to avoid repeated 500s; lazy-load per class on demand instead

  // School Configuration - Customize your school details here
  const schoolConfig = {
    logo: 'SMS', // You can replace this with an actual logo image URL
    name: 'St. Mary\'s Secondary School',
    motto: '"Excellence Through Knowledge"',
    address: 'P.O. Box 1234, Kampala, Uganda',
    phone: '+256 700 123 456',
    email: 'info@stmarys.ac.ug',
    website: 'www.stmarys.ac.ug',
    logoColor: 'linear-gradient(135deg, #2563eb, #1d4ed8)', // Blue gradient
    primaryColor: '#1e40af', // Blue
    secondaryColor: '#2563eb' // Lighter blue
  };

  // Auto-complete search for individual student (triggered as user types)
  useEffect(() => {
    const value = searchAccessNumber.trim();
    if (!value) {
      setSelectedStudent(null);
      return;
    }
    const student = findStudentByAccessNumber(value);
    if (student) {
      setSelectedStudent(student);
      setStatementType('individual');
    } else {
      setSelectedStudent(null);
    }
  }, [searchAccessNumber, findStudentByAccessNumber]);

  // Generate student statement function (uses backend data)
  const handleGenerateStudentStatement = async () => {
    try {
      if (!selectedStudent) {
        alert('Please select a student first');
        return;
      }
  
      if (!fromDate || !toDate) {
        alert('Please select both from and to dates');
        return;
      }

      const base = buildApiUrl('');
      const summaryRes = await fetch(`${base}/payments/summary/${selectedStudent.id}`);
      if (!summaryRes.ok) throw new Error('Failed to fetch payment summary');
      const data = await summaryRes.json();

      // Build fees from billing types - use actual fee structure from database
      const studentClass = data.student?.class || 'Senior 1';
      const feeStructure = await loadFeeStructureForClass(studentClass, selectedTerm, selectedYear, data.student);
      
      // Create fees object from actual billing types
      const fees = {
        tuition: 0,
        uniform: 0,
        library: 0,
        development: 0,
        lunch: 0,
        sports: 0,
        laboratory: 0,
        examination: 0,
        ict: 0,
        practical: 0,
        boarding: 0,
        total: feeStructure.total
      };
      
      // Map billing types to fee categories
      feeStructure.items.forEach((item: any) => {
        const feeName = (item.feeName || item.name || '').toLowerCase();
        const amount = Number(item.amount || 0);
        
        if (feeName.includes('tuit')) fees.tuition = amount;
        else if (feeName.includes('uniform')) fees.uniform = amount;
        else if (feeName.includes('library')) fees.library = amount;
        else if (feeName.includes('development')) fees.development = amount;
        else if (feeName.includes('lunch')) fees.lunch = amount;
        else if (feeName.includes('sport')) fees.sports = amount;
        else if (feeName.includes('laboratory') || feeName.includes('lab')) fees.laboratory = amount;
        else if (feeName.includes('examination') || feeName.includes('exam')) fees.examination = amount;
        else if (feeName.includes('ict') || feeName.includes('computer')) fees.ict = amount;
        else if (feeName.includes('practical')) fees.practical = amount;
        else if (feeName.includes('boarding')) fees.boarding = amount;
        else {
          // For any other fees, add to development as a catch-all
          fees.development += amount;
        }
      });
      
      // Use backend data if available, otherwise use calculated fees
      const totalFeesFromBillingTypes = feeStructure.total;
      const backendTotalFees = Number(data.totalFeesRequired || 0);
      const finalTotalFees = backendTotalFees > 0 ? backendTotalFees : totalFeesFromBillingTypes;
      
      fees.total = finalTotalFees;

      // Build payments list from financialRecords within the selected range if provided by backend
      const payments = (data.financialRecords || data.payments || []).filter((p: any) => {
        try {
          if (!p.date && !p.paymentDate) return true;
          const d = new Date(p.date || p.paymentDate);
          return (!fromDate || d >= new Date(fromDate)) && (!toDate || d <= new Date(toDate));
        } catch { return true; }
      }).map((p: any) => ({
        date: (p.date || p.paymentDate || '').toString(),
        amount: Number(p.amount || 0),
        type: p.type || p.billingType || 'Payment',
        method: p.paymentMethod || 'N/A',
        reference: p.receiptNumber || p.reference || ''
      }));

      const totalFees = Number(data.totalFeesRequired || fees.total);
      const totalPaid = Number(data.totalPaid || 0);
      const balance = Math.max(0, totalFees - totalPaid);

      const statement = {
        student: selectedStudent,
        period: { from: fromDate, to: toDate },
        fees: { ...fees, total: totalFees },
        feeStructure: feeStructure, // Include the actual fee structure
        payments,
        summary: {
          totalFees,
          totalPaid,
          balance,
          status: balance === 0 ? 'Paid' : totalPaid === 0 ? 'Unpaid' : 'Partial'
        }
      };

      setGeneratedStatement(statement);
      alert('Student financial statement generated successfully!');
    } catch (e: any) {
      console.error('Failed to generate statement:', e);
      alert('Failed to generate statement from backend.');
    }
  };

  // Quick date range functions
  const setQuickDateRange = (range: 'this-month' | 'last-month' | 'this-term' | 'this-year') => {
    const today = new Date();
    let fromDateStr = '';
    let toDateStr = '';

    switch (range) {
      case 'this-month':
        fromDateStr = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        toDateStr = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
        break;
      case 'last-month':
        fromDateStr = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
        toDateStr = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];
        break;
      case 'this-term':
        // Assuming Term 1: Jan-Mar, Term 2: Apr-Aug, Term 3: Sep-Dec
        const currentMonth = today.getMonth();
        if (currentMonth >= 0 && currentMonth <= 2) { // Term 1: Jan-Mar
          fromDateStr = new Date(today.getFullYear(), 0, 15).toISOString().split('T')[0];
          toDateStr = new Date(today.getFullYear(), 2, 5).toISOString().split('T')[0];
        } else if (currentMonth >= 3 && currentMonth <= 7) { // Term 2: Apr-Aug
          fromDateStr = new Date(today.getFullYear(), 3, 6).toISOString().split('T')[0];
          toDateStr = new Date(today.getFullYear(), 7, 16).toISOString().split('T')[0];
        } else { // Term 3: Sep-Dec
          fromDateStr = new Date(today.getFullYear(), 8, 2).toISOString().split('T')[0];
          toDateStr = new Date(today.getFullYear(), 11, 13).toISOString().split('T')[0];
        }
        break;
      case 'this-year':
        fromDateStr = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        toDateStr = new Date(today.getFullYear(), 11, 31).toISOString().split('T')[0];
        break;
    }

    setFromDate(fromDateStr);
    setToDate(toDateStr);
  };

  // Print statement function
  const handlePrintStatement = () => {
    if (!generatedStatement) {
      alert('Please generate a statement first');
      return;
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Financial Statement - ${generatedStatement.student.name}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              
              /* School Header Styles */
              .school-header { 
                text-align: center; 
                margin-bottom: 30px; 
                border-bottom: 3px solid #2563eb; 
                padding-bottom: 20px;
              }
              .school-logo { 
                width: 80px; 
                height: 80px; 
                margin: 0 auto 15px; 
                border-radius: 50%; 
                background: ${schoolConfig.logoColor};
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 24px;
                font-weight: bold;
              }
              .school-name { 
                font-size: 28px; 
                font-weight: bold; 
                color: ${schoolConfig.primaryColor}; 
                margin-bottom: 5px;
                text-transform: uppercase;
                letter-spacing: 1px;
              }
              .school-motto { 
                font-size: 14px; 
                color: #64748b; 
                font-style: italic;
                margin-bottom: 10px;
              }
              .school-details { 
                font-size: 12px; 
                color: #475569; 
                line-height: 1.4;
              }
              
              /* Statement Header */
              .statement-header { 
                text-align: center; 
                margin-bottom: 30px; 
                background: linear-gradient(135deg, #f8fafc, #e2e8f0);
                padding: 20px;
                border-radius: 8px;
                border: 1px solid #cbd5e1;
              }
              .statement-title { 
                font-size: 24px; 
                font-weight: bold; 
                color: #1e293b; 
                margin-bottom: 8px;
              }
              .statement-period { 
                font-size: 16px; 
                color: #64748b;
              }
              
              .student-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
              .section { margin-bottom: 25px; }
              .fees-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              .fees-table th, .fees-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              .fees-table th { background-color: #f2f2f2; }
              .summary { background-color: #f9f9f9; padding: 15px; border-radius: 5px; }
              .summary-grid { display: flex; justify-content: space-around; margin-bottom: 15px; }
              .summary-item { text-align: center; }
              .status { text-align: center; }
              
              /* Footer */
              .footer { 
                margin-top: 40px; 
                text-align: center; 
                font-size: 12px; 
                color: #64748b; 
                border-top: 1px solid #e2e8f0; 
                padding-top: 20px;
              }
            </style>
          </head>
          <body>
            <!-- School Header with Logo and Badge -->
            <div class="school-header">
              <div class="school-logo">${schoolConfig.logo}</div>
              <div class="school-name">${schoolConfig.name}</div>
              <div class="school-motto">${schoolConfig.motto}</div>
              <div class="school-details">
                ${schoolConfig.address}<br>
                Tel: ${schoolConfig.phone} | Email: ${schoolConfig.email}<br>
                Website: ${schoolConfig.website}
              </div>
            </div>
            
            <!-- Statement Header -->
            <div class="statement-header">
              <div class="statement-title">Financial Statement</div>
              <div class="statement-period">Period: ${generatedStatement.period.from} to ${generatedStatement.period.to}</div>
            </div>
            
            <div class="student-info">
              <div><strong>Student:</strong> ${generatedStatement.student.name}</div>
              <div><strong>Access Number:</strong> ${generatedStatement.student.accessNumber}</div>
              <div><strong>Class:</strong> ${generatedStatement.student.class}</div>
            </div>
            
            <div class="section">
              <h3>Fee Structure</h3>
              <table class="fees-table">
                <tr><th>Fee Type</th><th>Amount</th></tr>
                ${generatedStatement.feeStructure?.items?.map((fee: any) => 
                  `<tr><td>${fee.feeName || fee.name}</td><td>UGX ${Number(fee.amount || 0).toLocaleString()}</td></tr>`
                ).join('') || `
                  <tr><td>Tuition Fee</td><td>UGX ${generatedStatement.fees.tuition.toLocaleString()}</td></tr>
                  <tr><td>Uniform Fee</td><td>UGX ${generatedStatement.fees.uniform.toLocaleString()}</td></tr>
                  <tr><td>Library Fee</td><td>UGX ${generatedStatement.fees.library.toLocaleString()}</td></tr>
                  <tr><td>Development Fee</td><td>UGX ${generatedStatement.fees.development.toLocaleString()}</td></tr>
                `}
                <tr><th>Total Fees</th><th>UGX ${generatedStatement.fees.total.toLocaleString()}</th></tr>
              </table>
            </div>
            
            <div class="section">
              <h3>Payment History</h3>
              <table class="fees-table">
                <tr><th>Date</th><th>Type</th><th>Amount</th><th>Method</th><th>Reference</th></tr>
                ${generatedStatement.payments.map((payment: any) => `
                  <tr>
                    <td>${payment.date}</td>
                    <td>${payment.type}</td>
                    <td>UGX ${payment.amount.toLocaleString()}</td>
                    <td>${payment.method}</td>
                    <td>${payment.reference}</td>
                  </tr>
                `).join('')}
              </table>
            </div>
            
            <div class="summary">
              <h3>Summary</h3>
              <div class="summary-grid">
                <div class="summary-item">
                  <div><strong>Total Fees</strong></div>
                  <div>UGX ${generatedStatement.summary.totalFees.toLocaleString()}</div>
                </div>
                <div class="summary-item">
                  <div><strong>Total Paid</strong></div>
                  <div>UGX ${generatedStatement.summary.totalPaid.toLocaleString()}</div>
                </div>
                <div class="summary-item">
                  <div><strong>Balance</strong></div>
                  <div>UGX ${generatedStatement.summary.balance.toLocaleString()}</div>
                </div>
              </div>
              <div class="status">
                <strong>Status: ${generatedStatement.summary.status}</strong>
              </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
              <p><strong>This statement was generated on:</strong> ${new Date().toLocaleDateString('en-GB', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
              <p>For any queries regarding this statement, please contact the school administration.</p>
              <p><em>This is a computer-generated document and does not require a signature.</em></p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Payment handling functions
  const handlePayButtonClick = (feeType: string, amount: number) => {
    if (!selectedPaymentStudent) {
      alert('Please select a student first');
      return;
    }
    
    setSelectedPayment({
      type: feeType,
      amount: amount,
      studentName: selectedPaymentStudent.name,
      className: selectedPaymentStudent.className,
      term: 'Term 1',
      year: '2024'
    });
    setIsPaymentModalOpen(true);
  };

  // Fetch payment data for demo student

  // Search for student by access number for payments
  const handlePaymentStudentSearch = async (accessNumber?: string) => {
    const searchTerm = accessNumber || paymentStudentSearch.trim();
    
    if (!searchTerm) {
      setSelectedPaymentStudent(null);
      setPaymentSummary(null);
      return;
    }

    setIsSearchingStudent(true);
    try {
      const student = findStudentByAccessNumber(searchTerm);
      if (student) {
        setSelectedPaymentStudent(student);
        // Save student to localStorage for persistence
        localStorage.setItem('selectedPaymentStudent', JSON.stringify(student));
        
        // Fetch payment data for this student
        await fetchPaymentDataForStudent(student.id.toString());
      } else {
        setSelectedPaymentStudent(null);
        setPaymentSummary(null);
        // Clear localStorage when no student is found
        localStorage.removeItem('selectedPaymentStudent');
      }
    } catch (error) {
      console.error('Error searching for student:', error);
    } finally {
      setIsSearchingStudent(false);
    }
  };

  // Handle input change with auto-search
  const handlePaymentStudentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPaymentStudentSearch(value);
    
    // Clear any existing timeout
    if (window.paymentSearchTimeout) {
      clearTimeout(window.paymentSearchTimeout);
    }
    
    // Auto-search when access number is entered (with debounce)
    if (value.trim().length >= 3) {
      window.paymentSearchTimeout = setTimeout(() => {
        handlePaymentStudentSearch(value);
      }, 500); // 500ms debounce
    } else if (value.trim().length === 0) {
      setSelectedPaymentStudent(null);
      setPaymentSummary(null);
    }
  };

  // Prevent race conditions: ensure only the newest fetch updates UI
  const latestRequestId = useRef(0);

  // Refresh payment data after a payment is made (shows real data)
  const refreshPaymentDataAfterPayment = async (studentId: string) => {
    const requestId = ++latestRequestId.current;
    try {
      setIsRefreshing(true);
      
      // Clear fee structure cache to ensure updated fee amounts are loaded
      (window as any).__feeStructCache = {};
      
      // Also clear localStorage cache to force fresh fetch
      const studentObj = students.find((s: any) => String(s.id) === String(studentId));
      if (studentObj?.class) {
        localStorage.removeItem(`feeStructure_${studentObj.class}`);
      }
      
      const response = await fetch(buildApiUrl(`payments/summary/${studentId}`));
      const backendOk = response.ok;
      const data = backendOk ? await response.json() : {};

      // Identify student's class to resolve fee structure
      const studentClass = studentObj?.class || '';
      const feeStruct = studentClass ? await loadFeeStructureForClass(studentClass) : { items: [], total: 0 };

      // Map paid by type from backend if available
      const summary: Record<string, number> = {};
      const paidByType: Record<string, number> = {};
      
      // First, process paymentBreakdown if available
      if (data?.paymentBreakdown) {
        data.paymentBreakdown.forEach((item: any) => {
          const displayName = item.billingType === 'Tuition' ? 'Tuition Fee' :
                             item.billingType === 'Uniform' ? 'Uniform Fee' :
                             item.billingType === 'Library' ? 'Library Fee' :
                             item.billingType === 'Development' ? 'Development Fee' :
                             item.billingType;
          const paid = Number(item.paid || 0);
          summary[displayName] = paid;
          paidByType[(item.billingType || displayName).toLowerCase()] = paid;
        });
      }
      
      // If backend didn't provide paymentBreakdown, fall back to summing financialRecords
      if ((!data?.paymentBreakdown || data.paymentBreakdown.length === 0) && data.financialRecords && Array.isArray(data.financialRecords)) {
        data.financialRecords
          .filter((r: any) => r.type === 'payment' && r.status === 'paid')
          .forEach((r: any) => {
            const billingType = (r.billingType || '').toLowerCase();
            const amount = Number(r.amount || 0);
            
            // Map to display names
            const displayName = billingType.includes('uniform') ? 'Uniform Fee' :
                               billingType.includes('library') ? 'Library Fee' :
                               billingType.includes('development') ? 'Development Fee' :
                               billingType.includes('tuition') ? 'Tuition Fee' :
                               r.billingType || 'General Fee';
            
            summary[displayName] = (summary[displayName] || 0) + amount;
            paidByType[billingType] = (paidByType[billingType] || 0) + amount;
          });
      }

      // Build fee-structure-informed breakdown
      const paymentBreakdown = (feeStruct.items || []).map((f: any) => {
        const feeName = f.feeName || f.name || 'General Fee';
        const key = feeName.toLowerCase();
        
        // Map fee names to match backend billing types
        const billingTypeMapping: Record<string, string> = {
          'uniform': 'uniform',
          'uniform fee': 'uniform',
          'library': 'library',
          'library fee': 'library',
          'development': 'development',
          'development fee': 'development',
          'tuition': 'tuition',
          'tuition fee': 'tuition'
        };
        
        const mappedKey = billingTypeMapping[key] || key;
        const required = Number(f.amount || 0);
        const paid = Number(paidByType[mappedKey] || 0);
        return { billingType: feeName, required, paid, remaining: Math.max(0, required - paid) };
      });

      const totalFeesRequired = Number(feeStruct.total || 0) || Number(data.totalFeesRequired || 0) || 0;
      const calculatedPaid = paymentBreakdown.reduce((s: number, it: any) => s + Number(it.paid || 0), 0);
      const totalPaid = calculatedPaid; // single source of truth
      const balance = Math.max(0, totalFeesRequired - totalPaid);

      const paymentData = {
        summary,
        totalPaid,
        totalFeesRequired,
        balance,
        paymentBreakdown,
        financialRecords: data.financialRecords || []
      };
      
      if (requestId === latestRequestId.current) {
        setPaymentSummary(paymentData);
        // Do not cache payment summaries in localStorage to avoid stale dashboards
      }
    } catch (error) {
      console.error('Error fetching updated payment data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fetch payment data for specific student (initial load - use real backend summary)
  const fetchPaymentDataForStudent = async (studentId: string, term?: string, year?: string) => {
    const requestId = ++latestRequestId.current;
    try {
      const response = await fetch(buildApiUrl(`payments/summary/${studentId}`));
      const backendOk = response.ok;
      const data = backendOk ? await response.json() : {};

      // Resolve student's class fee structure from Settings card
      const studentObj = students.find((s: any) => String(s.id) === String(studentId));
      const studentClass = studentObj?.class || '';
      const feeStruct = studentClass ? await loadFeeStructureForClass(studentClass, term, year, studentObj) : { items: [], total: 0 };

      const summary: Record<string, number> = {};
      const paidByType: Record<string, number> = {};
      
      // Process payment breakdown from backend
      if (data?.paymentBreakdown) {
        data.paymentBreakdown.forEach((item: any) => {
          // Filter by term and year if specified
          if (term && year) {
            const itemTerm = String(item.term || '').toLowerCase();
            const itemYear = String(item.year || '');
            const selectedTermLower = String(term).toLowerCase();
            const selectedYearStr = String(year);
            
            if (itemTerm !== selectedTermLower || itemYear !== selectedYearStr) {
              return; // Skip this item if it doesn't match the selected term/year
            }
          }
          
          const displayName = item.billingType === 'Tuition' ? 'Tuition Fee' :
                             item.billingType === 'Uniform' ? 'Uniform Fee' :
                             item.billingType === 'Library' ? 'Library Fee' :
                             item.billingType === 'Development' ? 'Development Fee' :
                             item.billingType;
          const paid = Number(item.paid || 0);
          summary[displayName] = paid;
          paidByType[(item.billingType || displayName).toLowerCase()] = paid;
        });
      } else if (data?.summary) {
        Object.entries(data.summary).forEach(([key, val]: any) => {
          const displayName = key === 'Tuition' ? 'Tuition Fee' :
                              key === 'Uniform' ? 'Uniform Fee' :
                              key === 'Library' ? 'Library Fee' :
                              key === 'Development' ? 'Development Fee' : key;
          const paid = Number(val || 0);
          summary[displayName] = paid;
          paidByType[key.toLowerCase()] = paid;
        });
      }
      
      // If backend didn't provide paymentBreakdown/summary, fall back to financialRecords
      if ((!data?.paymentBreakdown && !data?.summary) && data.financialRecords && Array.isArray(data.financialRecords)) {
        data.financialRecords
          .filter((r: any) => r.type === 'payment' && r.status === 'paid')
          .forEach((r: any) => {
            const billingType = (r.billingType || '').toLowerCase();
            const amount = Number(r.amount || 0);
            
            // Map to display names
            const displayName = billingType.includes('uniform') ? 'Uniform Fee' :
                               billingType.includes('library') ? 'Library Fee' :
                               billingType.includes('development') ? 'Development Fee' :
                               billingType.includes('tuition') ? 'Tuition Fee' :
                               r.billingType || 'General Fee';
            
            summary[displayName] = (summary[displayName] || 0) + amount;
            paidByType[billingType] = (paidByType[billingType] || 0) + amount;
          });
      }

      const paymentBreakdown = (feeStruct.items || []).map((f: any) => {
        const feeName = f.feeName || f.name || 'General Fee';
        const key = feeName.toLowerCase();
        
        // Map fee names to match backend billing types
        const billingTypeMapping: Record<string, string> = {
          'uniform': 'uniform',
          'uniform fee': 'uniform',
          'library': 'library',
          'library fee': 'library',
          'development': 'development',
          'development fee': 'development',
          'tuition': 'tuition',
          'tuition fee': 'tuition'
        };
        
        const mappedKey = billingTypeMapping[key] || key;
        const required = Number(f.amount || 0);
        const paid = Number(paidByType[mappedKey] || 0);
        return { billingType: feeName, required, paid, remaining: Math.max(0, required - paid) };
      });

      const currentTermFees = Number(feeStruct.total || 0) || Number(data.totalFeesRequired || 0) || 0;
      
      // Only calculate previous balance if no specific term is selected (show all fees)
      // When a specific term is selected, only show that term's fees
      let previousBalance = 0;
      let totalFeesRequired = currentTermFees;
      
      if (!term || !year) {
        // No specific term selected - show all fees including previous balances
        previousBalance = await getPreviousTermBalance(studentObj, term || 'Term 1', year || '2025');
        totalFeesRequired = currentTermFees + previousBalance;
      }
      
      const calculatedPaid = paymentBreakdown.reduce((s: number, it: any) => s + Number(it.paid || 0), 0);
      const totalPaid = calculatedPaid;
      const balance = Math.max(0, totalFeesRequired - totalPaid);

      // Add previous balance to payment breakdown only if no specific term is selected
      const updatedPaymentBreakdown = [...paymentBreakdown];
      if (previousBalance > 0 && (!term || !year)) {
        updatedPaymentBreakdown.push({
          billingType: 'Previous Fee Balance',
          required: previousBalance,
          paid: 0,
          remaining: previousBalance
        });
      }

      const paymentData = {
        summary,
        totalPaid,
        totalFeesRequired,
        currentTermFees,
        previousBalance,
        balance,
        paymentBreakdown: updatedPaymentBreakdown,
        financialRecords: data.financialRecords || []
      };
      
      if (requestId === latestRequestId.current) {
        setPaymentSummary(paymentData);
        // Save payment summary to localStorage for persistence
        localStorage.setItem(`paymentSummary_${studentId}`, JSON.stringify(paymentData));
      }
    } catch (error) {
      console.error('Error fetching payment data:', error);
    }
  };

  // Force complete data reload for selected student
  const forceCompleteReload = async () => {
    if (!selectedPaymentStudent) return;
    
    try {
      setIsRefreshing(true);
      console.log('Forcing complete reload for student:', selectedPaymentStudent.name);
      
      // Clear all caches
      (window as any).__feeStructCache = {};
      localStorage.removeItem(`feeStructure_${selectedPaymentStudent.class}`);
      localStorage.removeItem(`paymentSummary_${selectedPaymentStudent.id}`);
      
      // Reload fee structure
      await loadFeeStructureForClass(selectedPaymentStudent.class, selectedTerm, selectedYear, selectedPaymentStudent);
      
      // Reload payment data
      await fetchPaymentDataForStudent(selectedPaymentStudent.id.toString());
      
      console.log('Complete reload finished');
    } catch (error) {
      console.error('Error during complete reload:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-load fee structures for all classes on component mount and when students change
  useEffect(() => {
    const loadAllFeeStructures = async () => {
      if (students.length === 0) return;
      
      console.log('🚀 Auto-loading fee structures for all classes...');
      const uniqueClasses = [...new Set(students.map((s: any) => s.class).filter(Boolean))];
      
      console.log('📋 Classes found:', uniqueClasses);
      
      await Promise.all(
        uniqueClasses.map(async (className: string) => {
          try {
            await loadFeeStructureForClass(className);
          } catch (error) {
            console.warn(`Failed to auto-load fee structure for ${className}:`, error);
          }
        })
      );
      
      console.log('✅ Auto-loading fee structures completed');
    };
    
    loadAllFeeStructures();
  }, [students]);

  // Auto-load fee structure when student is selected (keep existing functionality)
  useEffect(() => {
    const loadFeeStructureForStudent = async () => {
      if (selectedPaymentStudent?.class) {
        console.log('Auto-loading fee structure for student class:', selectedPaymentStudent.class);
        await loadFeeStructureForClass(selectedPaymentStudent.class, selectedTerm, selectedYear, selectedPaymentStudent);
        
        // If fee structure is still empty after loading, try to fetch fresh data
        const cache: any = (window as any).__feeStructCache || {};
        const items = cache[selectedPaymentStudent.class]?.items || [];
        if (items.length === 0) {
          console.log('Fee structure still empty, forcing fresh fetch...');
          // Clear cache and try again
          delete cache[selectedPaymentStudent.class];
          (window as any).__feeStructCache = cache;
          localStorage.removeItem(`feeStructure_${selectedPaymentStudent.class}`);
          await loadFeeStructureForClass(selectedPaymentStudent.class, selectedTerm, selectedYear, selectedPaymentStudent);
        }
      }
    };
    
    loadFeeStructureForStudent();
  }, [selectedPaymentStudent]);

  // Ensure data persists on refresh by rehydrating from backend
  useEffect(() => {
    (async () => {
      try {
        await fetchStudents();
        await fetchFinancialRecords();
      } catch (_e) {}
    })();
  }, []);

  // Load payment data on component mount
  useEffect(() => {
    // Don't auto-load payment data - wait for student selection
  }, []);

  const handleProcessPayment = async (paymentData: any) => {
    try {
      console.log('Processing payment:', paymentData);
      
      if (!selectedPaymentStudent) {
        alert('No student selected. Please search for a student first.');
        return;
      }
      
      // Make API call to process the payment
      const response = await fetch(buildApiUrl('payments/process'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: selectedPaymentStudent.id.toString(),
          amount: paymentData.amount,
          billingType: paymentData.paymentType,
          paymentMethod: paymentData.method,
          paymentReference: paymentData.reference,
          description: `Payment for ${paymentData.paymentType} - ${selectedPaymentStudent.name}`,
          processedBy: user?.name || 'Admin'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Payment processed successfully:', result);
        
        alert(`Payment of UGX ${paymentData.amount.toLocaleString()} for ${paymentData.paymentType} processed successfully!\nDate: ${paymentData.currentDate}\nTime: ${paymentData.currentTime}`);
        
        // Refresh payment data for the selected student with real data
        await refreshPaymentDataAfterPayment(selectedPaymentStudent.id.toString());
        
        // Also refresh the financial records context to ensure all data is up to date
        await fetchFinancialRecords();
        
        // Force a small delay to ensure backend has processed the payment
        setTimeout(async () => {
          await refreshPaymentDataAfterPayment(selectedPaymentStudent.id.toString());
        }, 1000);
      } else {
        const error = await response.json();
        console.error('Payment failed:', error);
        alert(`Failed to process payment: ${error.error || 'Unknown error'}`);
      }
      
      // Close modal and reset state
      setIsPaymentModalOpen(false);
      setSelectedPayment(null);
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Failed to process payment. Please try again.');
    }
  };

  // Export PDF function
  const handleExportPDF = () => {
    if (!generatedStatement) {
      alert('Please generate a statement first');
      return;
    }

    // For now, we'll use the browser's print to PDF functionality
    // In a real application, you might want to use a library like jsPDF or Puppeteer
    alert('PDF export functionality would be implemented here. For now, you can use "Print Statement" and select "Save as PDF" in the print dialog.');
    
    // Alternative: Trigger print with PDF option
    // handlePrintStatement();
  };

  // Balance Reminder: compute using actual billingTypes and paid financialRecords
  const getStudentsByBalanceAmount = (amountRange: string) => {
    console.log('🔍 Calculating balance for range:', amountRange);
    console.log('📊 Students count:', students.length);
    console.log('💰 Financial records count:', financialRecords.length);
    
    // Pre-compute paid sums by student
    const paidByStudent: Record<string, number> = {};
    financialRecords
      .filter((r: any) => (r.type === 'payment' || r.type === 'sponsorship') && r.status === 'paid')
      .forEach((r: any) => {
        const key = String(r.studentId);
        paidByStudent[key] = (paidByStudent[key] || 0) + Number(r.amount || 0);
      });

    const results = students.map((s: any) => {
      // Sum fee structure items for the student's class to get required
      let required = getTotalRequiredFees(s.class, undefined, s, selectedTerm, selectedYear);
      
      // NO FALLBACK DEFAULTS - If fee structure is not loaded or returns 0, use 0
      if (required === 0) {
        console.log(`ℹ️ No fee structure found for ${s.class}, using 0`);
        required = 0;
      }
      
      const paid = paidByStudent[String(s.id)] || 0;
      const balance = Math.max(0, required - paid);
      
      console.log(`📚 ${s.name} (${s.class}): Required=${required}, Paid=${paid}, Balance=${balance}`);
      
      return { student: s, required, paid, balance };
    });

    const inRange = (balance: number) => {
      switch (amountRange) {
        case '500000+':
          return balance >= 500000;
        case '300000-500000':
          return balance >= 300000 && balance < 500000;
        case '200000-300000':
          return balance >= 200000 && balance < 300000;
        case '100000-200000':
          return balance >= 100000 && balance < 200000;
        case '50000-100000':
          return balance >= 50000 && balance < 100000;
        case '0-50000':
          return balance > 0 && balance < 50000;
        default:
          return false;
      }
    };

    const filteredResults = results.filter(s => inRange(Number(s.balance || 0)));
    console.log(`✅ Found ${filteredResults.length} students with balance in range ${amountRange}`);
    
    return filteredResults;
  };

  const handleSendEmailReminders = async () => {
    if (!selectedBalanceAmount) {
      alert('Please select a balance amount range first');
      return;
    }

    setIsSendingReminders(true);
    const eligibleStudents = getStudentsByBalanceAmount(selectedBalanceAmount);
    
    try {
      // Send bulk email reminders
      const response = await fetch('http://localhost:5000/api/reminders/send-bulk-reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          students: eligibleStudents.map(student => ({
            name: student.student.name,
            parentName: student.student.parentName || 'Parent',
            parentEmail: student.student.parentEmail || 'parent@example.com',
            balance: student.balance,
            class: student.student.class
          })),
          reminderType: 'email'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        const sentCount = result.results.filter((r: any) => r.status === 'sent').length;
        const failedCount = result.results.filter((r: any) => r.status === 'failed').length;
        const demoCount = result.results.filter((r: any) => r.demo === true).length;
        const realCount = result.results.filter((r: any) => r.demo === false).length;
        
        if (demoCount > 0) {
          alert(`📧 Email reminders sent!\n✅ Sent: ${sentCount}\n❌ Failed: ${failedCount}\n\n🎭 Demo Mode: ${demoCount} emails simulated\n📧 Real Emails: ${realCount}\n\n💡 To send real emails, configure your email credentials in backend/.env file`);
        } else {
          alert(`📧 Email reminders sent!\n✅ Sent: ${sentCount}\n❌ Failed: ${failedCount}`);
        }
      } else {
        alert('Error sending email reminders. Please try again.');
      }
    } catch (error) {
      console.error('Email sending error:', error);
      alert('Error sending email reminders. Please check your connection and try again.');
    } finally {
      setIsSendingReminders(false);
    }
  };

  const handleSendWhatsAppReminders = async () => {
    if (!selectedBalanceAmount) {
      alert('Please select a balance amount range first');
      return;
    }

    setIsSendingReminders(true);
    const eligibleStudents = getStudentsByBalanceAmount(selectedBalanceAmount);
    
    try {
      // Send bulk WhatsApp reminders
      const response = await fetch('http://localhost:5000/api/reminders/send-bulk-reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          students: eligibleStudents.map(student => ({
            name: student.student.name,
            parentName: student.student.parentName || 'Parent',
            parentPhone: student.student.parentPhone || '+256700000000',
            balance: student.balance,
            class: student.student.class
          })),
          reminderType: 'whatsapp'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        const preparedCount = result.results.filter((r: any) => r.status === 'prepared').length;
        const failedCount = result.results.filter((r: any) => r.status === 'failed').length;
        
        // Open WhatsApp URLs for prepared messages
        let openedCount = 0;
        result.results.forEach((r: any) => {
          if (r.status === 'prepared' && r.url) {
            const newWindow = window.open(r.url, '_blank');
            if (newWindow) {
              openedCount++;
            }
          }
        });
        
        // If popup blocker prevented windows from opening, show URLs
        if (openedCount === 0 && preparedCount > 0) {
          const urls = result.results
            .filter((r: any) => r.status === 'prepared' && r.url)
            .map((r: any) => r.url);
          
          setWhatsappUrls(urls);
          setShowWhatsappUrls(true);
          
          alert(`📱 WhatsApp reminders prepared!\n✅ Prepared: ${preparedCount}\n❌ Failed: ${failedCount}\n\n⚠️ Popup blocker prevented windows from opening.\n\nClick "View WhatsApp URLs" button to access the messages.`);
        } else {
          alert(`📱 WhatsApp reminders prepared!\n✅ Prepared: ${preparedCount}\n❌ Failed: ${failedCount}\n\n📱 Opened ${openedCount} WhatsApp windows for sending.`);
        }
      } else {
        alert('Error sending WhatsApp reminders. Please try again.');
      }
    } catch (error) {
      console.error('WhatsApp sending error:', error);
      alert('Error sending WhatsApp reminders. Please check your connection and try again.');
    } finally {
      setIsSendingReminders(false);
    }
  };

  // Payment Analysis moved to its own page via sidebar route
  const tabs = [
    { id: 'financial-statements', name: 'Financial Statements', icon: FileText },
    { id: 'add-payment', name: 'Add Payment', icon: Plus },
    { id: 'financial-records', name: 'Financial Records', icon: Receipt }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 backdrop-blur-xl">
      <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold text-gray-900">{location.pathname.includes('/pay-staff') ? 'Pay Staff' : activeTab === 'payment-system' ? 'Payment Analysis' : 'Financial Management'}</h1>
        </div>
        
        {/* AI-Generated Balance Reminder Button */}
        {activeTab !== 'payment-system' && !location.pathname.includes('/pay-staff') && (
          <div className="relative">
            <button
              onClick={() => setShowReminderDropdown(!showReminderDropdown)}
              className="group relative overflow-hidden flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 text-white rounded-xl hover:from-purple-700 hover:via-pink-700 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <AlertTriangle className="h-5 w-5 relative z-10 animate-pulse" />
              <span className="relative z-10 font-semibold">Smart Balance Reminders</span>
              <ChevronDown className="h-4 w-4 relative z-10 transition-transform duration-200 group-hover:rotate-180" />
            </button>
          
            {showReminderDropdown && (
              <div className="absolute right-0 mt-3 w-96 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 z-50 animate-in slide-in-from-top-2 duration-300">
              <div className="p-6">
                {/* Header with Refresh */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-3">
                    <Send className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Smart Payment Reminders</h3>
                  <p className="text-sm text-gray-600 mt-1">Smart parent communication</p>
                  <button
                    onClick={async () => {
                      setIsRefreshing(true);
                      try {
                        console.log('🔄 Refreshing student and financial data...');
                        // Preserve focused student to avoid UI jumping
                        const currentId = selectedPaymentStudent?.id?.toString();
                        // Clear fee structure cache to ensure updated fee amounts are loaded
                        (window as any).__feeStructCache = {};
                        await Promise.all([fetchStudents(), fetchFinancialRecords()]);
                        
                        // Reload fee structures for all unique classes to ensure accurate balance calculations
                        console.log('🏫 Reloading fee structures for all classes...');
                        const uniqueClasses = [...new Set(students.map((s: any) => s.class).filter(Boolean))];
                        console.log('Classes found:', uniqueClasses);
                        
                        await Promise.all(
                          uniqueClasses.map(async (className: string) => {
                            try {
                              await loadFeeStructureForClass(className);
                              console.log(`✅ Loaded fee structure for ${className}`);
                            } catch (error) {
                              console.warn(`⚠️ Failed to load fee structure for ${className}:`, error);
                            }
                          })
                        );
                        
                        // Trigger a re-render to update balance calculations
                        setBalanceRefreshTrigger(prev => prev + 1);
                        
                        // Re-sync the open payment panel if a student is selected
                        if (currentId) {
                          try {
                            await refreshPaymentDataAfterPayment(currentId);
                          } catch (e) {
                            console.warn('Failed to refresh payment summary for selected student:', e);
                          }
                        }
                        console.log('✅ All data refreshed successfully - balance calculations should now be accurate');
                      } catch (error) {
                        console.error('❌ Error refreshing data:', error);
                      } finally {
                        setIsRefreshing(false);
                        // Close the dropdown to avoid layout reflows "disorganising" the panel
                        setShowReminderDropdown(false);
                      }
                    }}
                    disabled={isRefreshing}
                    className="mt-2 px-3 py-1 text-xs bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors duration-200 disabled:bg-blue-50 disabled:text-blue-400"
                  >
                    {isRefreshing ? '🔄 Refreshing...' : '🔄 Refresh Student Data'}
                  </button>
                </div>
                
                {/* Balance Amount Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    💰 Select students by balance amount:
                  </label>
                  <div className="relative">
                    <select
                      value={selectedBalanceAmount}
                      onChange={(e) => setSelectedBalanceAmount(e.target.value)}
                      className="w-full rounded-xl border-2 border-purple-200 bg-white/80 backdrop-blur-sm shadow-sm focus:border-purple-500 focus:ring-4 focus:ring-purple-200 transition-all duration-200 py-3 px-4 font-medium"
                    >
                      <option value="">🔍 Select amount range...</option>
                      <option value="500000+">🚩 UGX 500,000+</option>
                      <option value="300000-500000">🔥 UGX 300,000 - 500,000</option>
                      <option value="200000-300000">📊 UGX 200,000 - 300,000</option>
                      <option value="100000-200000">💰 UGX 100,000 - 200,000</option>
                      <option value="50000-100000">💵 UGX 50,000 - 100,000</option>
                      <option value="0-50000">💸 UGX 0 - 50,000</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <ChevronDown className="h-5 w-5 text-purple-500" />
                    </div>
                  </div>
                </div>
                
                {/* Student Count Display */}
                {selectedBalanceAmount && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl border border-blue-200/50 backdrop-blur-sm">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-blue-800">
                          <span className="text-lg font-bold text-purple-600">{getStudentsByBalanceAmount(selectedBalanceAmount).length}</span> students 
                        </p>
                        <p className="text-xs text-blue-600">
                          have balance {selectedBalanceAmount === '500000+' ? 'UGX 500,000+' : 
                                       selectedBalanceAmount.includes('-') ? `UGX ${selectedBalanceAmount.replace('-', '-')}` : 
                                       `UGX ${selectedBalanceAmount}`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* AI-Generated Action Buttons */}
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={handleSendEmailReminders}
                    disabled={!selectedBalanceAmount || isSendingReminders}
                    className="group relative overflow-hidden flex items-center justify-center space-x-3 px-4 py-3 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <Mail className="h-5 w-5 relative z-10" />
                    <span className="relative z-10 font-semibold">
                      {isSendingReminders ? '📤 Sending...' : '📧 Email Reminders'}
                    </span>
                  </button>
                  
                 <button
                   onClick={handleSendWhatsAppReminders}
                   disabled={!selectedBalanceAmount || isSendingReminders}
                   className="group relative overflow-hidden flex items-center justify-center space-x-3 px-4 py-3 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 text-white rounded-xl hover:from-green-600 hover:via-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                 >
                   <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                   <MessageSquare className="h-5 w-5 relative z-10" />
                   <span className="relative z-10 font-semibold">
                     {isSendingReminders ? '📱 Sending...' : '💬 WhatsApp Messages'}
                   </span>
                 </button>
                 
                 {whatsappUrls.length > 0 && (
                   <button
                     onClick={() => setShowWhatsappUrls(true)}
                     className="group relative overflow-hidden flex items-center justify-center space-x-3 px-4 py-3 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                   >
                     <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                     <ExternalLink className="h-5 w-5 relative z-10" />
                     <span className="relative z-10 font-semibold">
                       📱 View WhatsApp URLs ({whatsappUrls.length})
                     </span>
                   </button>
                 )}
                </div>
                
                {/* AI-Generated Close Button */}
                <button
                  onClick={() => setShowReminderDropdown(false)}
                  className="w-full mt-4 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium"
                >
                  ✨ Close
                </button>
              </div>
            </div>
            )}
          </div>
        )}
      </div>

      {/* CFO-friendly revenue summary visible on Payment Analysis */}
      {activeTab === 'payment-system' && !location.pathname.includes('/pay-staff') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total School Revenue */}
          <div className="bg-gradient-to-br from-white/90 via-green-50/30 to-emerald-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total School Revenue</p>
                <p className="text-2xl font-bold text-green-600">UGX {Number((financialRecords||[]).reduce((s:any,r:any)=>s + Number(r.amount||0),0)).toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>

          {/* Total Clinic Revenue */}
          <div className="bg-gradient-to-br from-white/90 via-blue-50/30 to-indigo-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Clinic Revenue</p>
                <p className="text-2xl font-bold text-indigo-600">UGX {Number((clinicRecords||[]).reduce((s:any,c:any)=>s + Number(c.cost||0),0)).toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>

          {/* Combined Revenue */}
          <div className="bg-gradient-to-br from-white/90 via-purple-50/30 to-pink-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Total Revenue (School + Clinic)</p>
                <p className="text-2xl font-bold text-purple-600">UGX {(() => {
                  const school = Number((financialRecords||[]).reduce((s:any,r:any)=>s + Number(r.amount||0),0));
                  const clinic = Number((clinicRecords||[]).reduce((s:any,c:any)=>s + Number(c.cost||0),0));
                  return Number(school + clinic).toLocaleString();
                })()}</p>
              </div>
              <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pay Staff by Category (visible on /pay-staff route) */}
      {location.pathname.includes('/pay-staff') && (
        <div className="bg-gradient-to-br from-white via-green-50/30 to-emerald-50/30 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6">
          <h2 className="text-xl font-semibold text-emerald-700 mb-4">Pay Staff</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Category (Role)</label>
              <select value={selectedStaffRole} onChange={(e)=>setSelectedStaffRole(e.target.value)} className="w-full rounded-lg border-emerald-200/70 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 bg-white/80 backdrop-blur-sm">
                {staffRoles.map(r => (<option key={r} value={r}>{r}</option>))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-1">Search Staff</label>
              <input value={staffSearch} onChange={(e)=>setStaffSearch(e.target.value)} placeholder="Search by name or phone" className="w-full rounded-lg border-emerald-200/70 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 bg-white/80 backdrop-blur-sm" />
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm text-gray-700 mb-1">Amount (UGX)</label>
              <input type="number" min={0} value={payAmount} onChange={(e)=>setPayAmount(e.target.value)} className="w-full rounded-lg border-emerald-200/70 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 bg-white/80 backdrop-blur-sm" />
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-sm text-gray-700 mb-1">Note (optional)</label>
            <input value={payNote} onChange={(e)=>setPayNote(e.target.value)} className="w-full rounded-lg border-emerald-200/70 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 bg-white/80 backdrop-blur-sm" />
          </div>
          <div className="mt-4 border rounded-xl bg-white/70">
            <table className="w-full text-sm">
              <thead className="bg-emerald-50">
                <tr>
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-left px-3 py-2">Role</th>
                  <th className="text-left px-3 py-2">Phone</th>
                  <th className="text-right px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((s:any)=> (
                  <tr key={s.id} className="border-t">
                    <td className="px-3 py-2">{s.name}</td>
                    <td className="px-3 py-2">{s.role || '-'}</td>
                    <td className="px-3 py-2">{s.phone || '-'}</td>
                    <td className="px-3 py-2 text-right">
                      <button onClick={()=> openStaffPayment(s.id)}
                        className={`px-3 py-1.5 rounded text-white bg-emerald-600 hover:bg-emerald-700`}>Pay</button>
                    </td>
                  </tr>
                ))}
                {filteredStaff.length === 0 && (
                  <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-500">No staff match</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {location.pathname.includes('/pay-staff') && showStaffModal && staffSummary && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border p-6 w-full max-w-lg">
            <div className="text-lg font-semibold text-emerald-700 mb-1">Pay {staffSummary?.staff?.name}</div>
            <div className="text-xs text-gray-600 mb-4">Role: {staffSummary?.staff?.role || '-'} • Phone: {filteredStaff.find((x:any)=>x.id===payingStaffId)?.phone || '-'}</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div className="bg-emerald-50 rounded-lg p-3">
                <div className="text-xs text-emerald-700">Original</div>
                <div className="text-lg font-bold text-emerald-800">UGX {Number(staffSummary?.staff?.amountToPay || 0).toLocaleString()}</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-xs text-blue-700">Paid</div>
                <div className="text-lg font-bold text-blue-800">UGX {Number(staffSummary?.totalPaid || 0).toLocaleString()}</div>
              </div>
              <div className="bg-amber-50 rounded-lg p-3">
                <div className="text-xs text-amber-700">Remaining</div>
                <div className="text-lg font-bold text-amber-800">UGX {Number(staffSummary?.remaining || 0).toLocaleString()}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 mb-1">Amount to pay (UGX)</label>
                <input type="number" min={0} value={payAmount} onChange={(e)=>setPayAmount(e.target.value)} className="w-full rounded-lg border-emerald-200/70 shadow-sm focus:border-emerald-500 focus:ring-emerald-500" />
              </div>
              <div className="md:col-span-1 flex items-end">
                <button onClick={payStaff} className={`w-full px-4 py-2 rounded-lg text-white ${payAmount? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-emerald-300 cursor-not-allowed'}`} disabled={!payAmount}>Confirm Pay</button>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-700 mb-1">Note</label>
              <input value={payNote} onChange={(e)=>setPayNote(e.target.value)} className="w-full rounded-lg border-emerald-200/70 shadow-sm focus:border-emerald-500 focus:ring-emerald-500" />
            </div>

            <div className="max-h-56 overflow-y-auto border rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2">Date</th>
                    <th className="text-left px-3 py-2">Amount</th>
                    <th className="text-left px-3 py-2">Method</th>
                  </tr>
                </thead>
                <tbody>
                  {staffSummary?.payments?.map((p:any, i:number)=> (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2">{new Date(p.date).toLocaleString()}</td>
                      <td className="px-3 py-2">UGX {Number(p.amount||0).toLocaleString()}</td>
                      <td className="px-3 py-2">{p.paymentMethod || '-'}</td>
                    </tr>
                  ))}
                  {(!staffSummary?.payments || staffSummary.payments.length===0) && (
                    <tr><td colSpan={3} className="px-3 py-4 text-center text-gray-500">No payments yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={()=>{ setShowStaffModal(false); setPayAmount(''); setPayNote(''); }} className="px-4 py-2 rounded-lg border">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs (hidden on /payment-analysis) */}
      {activeTab !== 'payment-system' && (
        <div className="bg-gradient-to-r from-white/80 via-blue-50/50 to-purple-50/50 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-2">
          <nav className="flex space-x-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`group relative overflow-hidden flex items-center space-x-3 px-6 py-4 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-600 text-white shadow-2xl'
                    : 'bg-gradient-to-r from-gray-100/80 to-gray-200/80 text-gray-700 hover:from-purple-100 hover:to-blue-100 hover:text-purple-700 shadow-lg hover:shadow-xl'
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                  activeTab === tab.id ? 'opacity-100' : ''
                }`}></div>
                <tab.icon className={`h-5 w-5 relative z-10 transition-all duration-300 ${
                  activeTab === tab.id ? 'animate-pulse' : 'group-hover:scale-110'
                }`} />
                <span className="relative z-10">{tab.name}</span>
                {activeTab === tab.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-blue-400/20 to-indigo-400/20 animate-pulse"></div>
                )}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'financial-statements' && (
          <div className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6">
            <h2 className="text-xl font-semibold text-purple-600 mb-6">Financial Statements</h2>
            <div className="space-y-6">
              {/* Statement Type Selection */}
              <div className="bg-gradient-to-r from-purple-50/50 to-blue-50/50 rounded-lg p-4 border border-purple-200/50">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">Select Statement Type</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={() => setStatementType('school-wide')}
                    className={`p-4 border rounded-lg transition-all duration-200 ${
                      statementType === 'school-wide' 
                        ? 'bg-gradient-to-r from-blue-100 to-cyan-100 border-blue-300' 
                        : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 hover:from-blue-100 hover:to-cyan-100'
                    }`}
                  >
                    <div className="text-center">
                      <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <div className="font-semibold text-blue-800">School-wide Statement</div>
                      <div className="text-xs text-blue-600">Generate for all students</div>
                    </div>
                  </button>
                  <button 
                    onClick={() => setStatementType('individual')}
                    className={`p-4 border rounded-lg transition-all duration-200 ${
                      statementType === 'individual' 
                        ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-300' 
                        : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:from-green-100 hover:to-emerald-100'
                    }`}
                  >
                    <div className="text-center">
                      <CreditCard className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <div className="font-semibold text-green-800">Individual Student</div>
                      <div className="text-xs text-green-600">Generate for specific student</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* School-wide Statement Generation */}
              <div className="bg-gradient-to-r from-purple-50/50 to-blue-50/50 rounded-lg p-4 border border-purple-200/50">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">Generate School-wide Financial Statement</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                    <input
                      type="date"
                      className="w-full rounded-lg border-purple-200/50 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-white/80 backdrop-blur-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                    <input
                      type="date"
                      className="w-full rounded-lg border-purple-200/50 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-white/80 backdrop-blur-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-200 shadow-md hover:shadow-lg">
                      Generate Statement
                    </button>
                  </div>
                </div>
              </div>

              {/* Individual Student Statement Generation */}
              <div className="bg-gradient-to-r from-green-50/50 to-emerald-50/50 rounded-lg p-4 border border-green-200/50">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">Generate Individual Student Statement</h3>
                <div className="space-y-4">
                  {/* Student Search - auto suggest by access number (no submit button) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Search Student</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Enter access number..."
                          value={searchAccessNumber}
                          onChange={(e) => setSearchAccessNumber(e.target.value)}
                          className="w-full rounded-lg border-green-200/50 shadow-sm focus:border-green-500 focus:ring-green-500 bg-white/80 backdrop-blur-sm pr-10"
                        />
                        {/* live prediction dropdown */}
                        {searchAccessNumber && !selectedStudent && (
                          <div className="absolute z-10 mt-1 w-full bg-white border border-green-200 rounded-md shadow-lg p-2 text-sm text-gray-600">
                            No match for that access number
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Removed the explicit Search button - selection happens automatically */}
                    <div></div>
                  </div>

                  {/* Student Info Display */}
                  {selectedStudent && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-green-200/50">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-green-600">Student Name</div>
                          <div className="font-semibold text-gray-800">{selectedStudent.name}</div>
                        </div>
                        <div>
                          <div className="text-sm text-green-600">Access Number</div>
                          <div className="font-semibold text-gray-800">{selectedStudent.accessNumber}</div>
                        </div>
                        <div>
                          <div className="text-sm text-green-600">Class</div>
                          <div className="font-semibold text-gray-800">{selectedStudent.class}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Statement Period Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="w-full rounded-lg border-green-200/50 shadow-sm focus:border-green-500 focus:ring-green-500 bg-white/80 backdrop-blur-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="w-full rounded-lg border-green-200/50 shadow-sm focus:border-green-500 focus:ring-green-500 bg-white/80 backdrop-blur-sm"
                      />
                    </div>
                    <div className="flex items-end">
                      <button 
                        onClick={handleGenerateStudentStatement}
                        disabled={!selectedStudent}
                        className={`w-full px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg ${
                          selectedStudent 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Generate Student Statement
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Date Ranges */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button 
                  onClick={() => setQuickDateRange('this-month')}
                  className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg hover:from-green-100 hover:to-emerald-100 transition-all duration-200"
                >
                  <div className="text-sm font-semibold text-green-800">This Month</div>
                  <div className="text-xs text-green-600">Current month</div>
                </button>
                <button 
                  onClick={() => setQuickDateRange('last-month')}
                  className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg hover:from-blue-100 hover:to-cyan-100 transition-all duration-200"
                >
                  <div className="text-sm font-semibold text-blue-800">Last Month</div>
                  <div className="text-xs text-blue-600">Previous month</div>
                </button>
                <button 
                  onClick={() => setQuickDateRange('this-term')}
                  className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg hover:from-purple-100 hover:to-pink-100 transition-all duration-200"
                >
                  <div className="text-sm font-semibold text-purple-800">This Term</div>
                  <div className="text-xs text-purple-600">Current term</div>
                </button>
                <button 
                  onClick={() => setQuickDateRange('this-year')}
                  className="p-3 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg hover:from-orange-100 hover:to-red-100 transition-all duration-200"
                >
                  <div className="text-sm font-semibold text-orange-800">This Year</div>
                  <div className="text-xs text-orange-600">Current year</div>
                </button>
              </div>

              {/* Financial Statement Preview */}
              <div className="bg-gradient-to-br from-gray-50/50 to-blue-50/30 backdrop-blur-sm border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Financial Statement Preview</h4>
                {generatedStatement ? (
                  <div className="space-y-6">
                    {/* Statement Header */}
                    <div className="bg-white rounded-lg p-6 border border-gray-200">
                      <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-800">Financial Statement</h3>
                        <p className="text-gray-600">Period: {generatedStatement.period.from} to {generatedStatement.period.to}</p>
                      </div>
                      
                      {/* Student Info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                          <div className="text-sm text-gray-600">Student Name</div>
                          <div className="font-semibold text-gray-800">{generatedStatement.student.name}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Access Number</div>
                          <div className="font-semibold text-gray-800">{generatedStatement.student.accessNumber}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Class</div>
                          <div className="font-semibold text-gray-800">{generatedStatement.student.class}</div>
                        </div>
                      </div>

                      {/* Fee Breakdown */}
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-800 mb-3">Fee Structure</h4>
                        <div className="space-y-1">
                          {generatedStatement.feeStructure?.items?.map((fee: any, index: number) => (
                            <div key={index} className="flex justify-between">
                              <span>{fee.feeName || fee.name}</span>
                              <span className="font-semibold">UGX {Number(fee.amount || 0).toLocaleString()}</span>
                            </div>
                          )) || (
                            <>
                              <div className="flex justify-between">
                                <span>Tuition Fee</span>
                                <span className="font-semibold">UGX {generatedStatement.fees.tuition.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Uniform Fee</span>
                                <span className="font-semibold">UGX {generatedStatement.fees.uniform.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Library Fee</span>
                                <span className="font-semibold">UGX {generatedStatement.fees.library.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Development Fee</span>
                                <span className="font-semibold">UGX {generatedStatement.fees.development.toLocaleString()}</span>
                              </div>
                            </>
                          )}
                          <div className="flex justify-between border-t pt-2">
                            <span className="font-bold">Total Fees</span>
                            <span className="font-bold text-lg">UGX {generatedStatement.fees.total.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Payment History */}
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-800 mb-3">Payment History</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="text-left py-2 px-3 font-semibold text-gray-700">Date</th>
                                <th className="text-left py-2 px-3 font-semibold text-gray-700">Type</th>
                                <th className="text-left py-2 px-3 font-semibold text-gray-700">Amount</th>
                                <th className="text-left py-2 px-3 font-semibold text-gray-700">Method</th>
                                <th className="text-left py-2 px-3 font-semibold text-gray-700">Reference</th>
                              </tr>
                            </thead>
                            <tbody>
                              {generatedStatement.payments.map((payment: any, index: number) => (
                                <tr key={index} className="border-b">
                                  <td className="py-2 px-3">{payment.date}</td>
                                  <td className="py-2 px-3">{payment.type}</td>
                                  <td className="py-2 px-3 font-semibold">UGX {payment.amount.toLocaleString()}</td>
                                  <td className="py-2 px-3">{payment.method}</td>
                                  <td className="py-2 px-3 text-sm text-gray-600">{payment.reference}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-gray-800 mb-3">Summary</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-sm text-gray-600">Total Fees</div>
                            <div className="text-xl font-bold text-gray-800">UGX {generatedStatement.summary.totalFees.toLocaleString()}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-gray-600">Total Paid</div>
                            <div className="text-xl font-bold text-green-600">UGX {generatedStatement.summary.totalPaid.toLocaleString()}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-gray-600">Balance</div>
                            <div className="text-xl font-bold text-orange-600">UGX {generatedStatement.summary.balance.toLocaleString()}</div>
                          </div>
                        </div>
                        <div className="text-center mt-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            generatedStatement.summary.status === 'Paid' 
                              ? 'bg-green-100 text-green-800' 
                              : generatedStatement.summary.status === 'Partial'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            Status: {generatedStatement.summary.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3">
                      <button 
                        onClick={handlePrintStatement}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Print Statement
                      </button>
                      <button 
                        onClick={handleExportPDF}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg hover:from-blue-600 hover:to-green-600 transition-all duration-200"
                      >
                        Export PDF
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>Select a date range and student to generate financial statement</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'add-payment' && (
          <div className={`bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 transition-all duration-500 ${
            selectedPaymentStudent ? 'via-emerald-50/40 to-green-50/40' : ''
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Add Payment - Reducing Balance Method
              </h2>
              {selectedPaymentStudent && (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-emerald-100 to-green-100 rounded-full">
                    <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-emerald-700">Student Selected</span>
                  </div>
                  <button
                    onClick={() => forceCompleteReload()}
                    disabled={isRefreshing}
                    className="group relative overflow-hidden flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:via-green-600 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <RefreshCw className={`h-4 w-4 relative z-10 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span className="relative z-10 text-sm font-semibold">
                      {isRefreshing ? '🔄 Refreshing...' : '🔄 Refresh Data'}
                    </span>
                  </button>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              {/* Compact Student Selection */}
              <div className={`bg-gradient-to-r from-purple-50/50 to-blue-50/50 rounded-lg p-3 border border-purple-200/50 transition-all duration-500 ${
                selectedPaymentStudent ? 'from-emerald-50/60 to-green-50/60 border-emerald-200/60 shadow-md' : ''
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    🔍 Search Student
                  </h3>
                  {selectedPaymentStudent && (
                    <div className="flex items-center space-x-1">
                      <div className="w-1.5 h-1.5 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium text-emerald-600">Active</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Enter access number (e.g., AA0001)..."
                        value={paymentStudentSearch}
                        onChange={handlePaymentStudentInputChange}
                        className={`w-full rounded-lg border-2 shadow-sm focus:ring-2 bg-white/80 backdrop-blur-sm pr-8 text-sm py-2 px-3 transition-all duration-300 ${
                          selectedPaymentStudent 
                            ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-200' 
                            : 'border-purple-200/50 focus:border-purple-500 focus:ring-purple-200'
                        }`}
                      />
                      <Users className={`absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors duration-300 ${
                        selectedPaymentStudent ? 'text-emerald-500' : 'text-purple-500'
                      }`} />
                      {isSearchingStudent && (
                        <div className="absolute right-6 top-1/2 transform -translate-y-1/2">
                          <div className={`animate-spin rounded-full h-3 w-3 border-b-2 ${
                            selectedPaymentStudent ? 'border-emerald-500' : 'border-purple-500'
                          }`}></div>
                    </div>
                      )}
                  </div>
                </div>
                
                {selectedPaymentStudent && (
                    <div className="flex items-center space-x-2 bg-gradient-to-r from-emerald-50/80 to-green-50/80 rounded-lg border border-emerald-200/60 px-2 py-1">
                      <div className="w-6 h-6 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center">
                        <Users className="h-3 w-3 text-white" />
                      </div>
                      <div className="text-xs">
                        <div className="font-semibold text-gray-800">{selectedPaymentStudent.name}</div>
                        <div className="text-emerald-600">{selectedPaymentStudent.accessNumber}</div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedPaymentStudent(null);
                          setPaymentSummary(null);
                          setPaymentStudentSearch('');
                          // Clear localStorage when student is deselected
                          localStorage.removeItem('selectedPaymentStudent');
                        }}
                        className="w-5 h-5 bg-gradient-to-r from-red-100 to-pink-100 hover:from-red-200 hover:to-pink-200 text-red-600 hover:text-red-700 rounded flex items-center justify-center transition-all duration-200"
                      >
                        <X className="h-3 w-3" />
                      </button>
                  </div>
                )}
              </div>

                <p className="text-xs text-gray-500 mt-1">
                  ✨ Student info appears automatically
                </p>
                </div>

              {/* Student Fee Breakdown - Only show when student is selected */}
              {selectedPaymentStudent ? (
                <>
                  {/* Compact Student Information Header */}
                  <div className="bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 p-4 mb-3 max-w-3xl mx-auto">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-600 rounded-lg shadow-md flex items-center justify-center">
                          <Users className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h2 className="text-sm font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Student Payment Information
                          </h2>
                          <p className="text-xs text-gray-600">Payment details for {selectedPaymentStudent.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Payment Date</div>
                        <div className="text-xs font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                          {new Date().toLocaleDateString('en-GB')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-white/80 backdrop-blur-sm p-2 rounded-lg border border-white/20 shadow-md">
                        <div className="text-xs text-purple-600 font-medium mb-1">Student Name</div>
                        <div className="text-sm font-bold text-gray-800">{selectedPaymentStudent.name}</div>
                      </div>
                      <div className="bg-white/80 backdrop-blur-sm p-2 rounded-lg border border-white/20 shadow-md">
                        <div className="text-xs text-blue-600 font-medium mb-1">Access Number</div>
                        <div className="text-sm font-bold text-gray-800">{selectedPaymentStudent.accessNumber}</div>
                      </div>
                      <div className="bg-white/80 backdrop-blur-sm p-2 rounded-lg border border-white/20 shadow-md">
                        <div className="text-xs text-indigo-600 font-medium mb-1">Class</div>
                        <div className="text-sm font-bold text-gray-800">{selectedPaymentStudent.className || selectedPaymentStudent.class}</div>
                      </div>
                      <div className="bg-white/80 backdrop-blur-sm p-2 rounded-lg border border-white/20 shadow-md">
                        <div className="text-xs text-emerald-600 font-medium mb-1">Parent/Guardian</div>
                        <div className="text-sm font-bold text-gray-800">{selectedPaymentStudent.parent?.name || 'N/A'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Term and Year Selector */}
                  {(() => {
                    const admission = getStudentAdmissionTerm(selectedPaymentStudent);
                    const available = getAvailableTermsForStudent(selectedPaymentStudent);
                    
                    return (
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-4 max-w-3xl mx-auto border border-blue-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                              <Calendar className="h-3 w-3 text-white" />
                            </div>
                            <h3 className="text-sm font-bold text-gray-700">Filter by Term & Year</h3>
                          </div>
                          <div className="text-xs text-gray-500">
                            Student joined: {admission.term} {admission.year}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Term</label>
                            <select
                              value={selectedTerm}
                              onChange={(e) => setSelectedTerm(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                            >
                              {available.terms.map(term => (
                                <option key={term} value={term}>{term}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
                            <select
                              value={selectedYear}
                              onChange={(e) => setSelectedYear(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                            >
                              {available.years.map(year => (
                                <option key={year} value={year}>{year}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        
                        <div className="mt-3 pt-2 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Currently viewing:</span>
                            <span className="text-xs font-bold text-blue-600">{selectedTerm} {selectedYear}</span>
                          </div>
                          <div className="mt-1 text-xs text-green-600">
                            ✅ Showing fees for {selectedTerm} {selectedYear} only
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 max-w-3xl mx-auto mb-3">
                
                {/* AI-Generated Original Fees */}
                <div className="group relative overflow-hidden bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 backdrop-blur-xl rounded-lg shadow-md border border-white/20 p-2 transform hover:scale-105 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-md shadow-sm flex items-center justify-center">
                        <FileText className="h-3 w-3 text-white" />
                      </div>
                      <h3 className="text-xs font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">📋 Original Fees</h3>
                    </div>
                  <div className="space-y-2">
                    {(() => {
                      const cls = (selectedPaymentStudent?.className || selectedPaymentStudent?.class || '').trim();
                      if (!cls) {
                        return (
                          <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 text-xs text-gray-600">
                            No student selected
                          </div>
                        );
                      }

                      // Use cached fee structure that was loaded with proper admission term filtering
                      const cache: any = (window as any).__feeStructCache || {};
                      let items: any[] = Array.isArray(cache[cls]?.items) ? cache[cls].items : [];
                      
                      // If no cached data, fallback to billing types with term/year filtering
                      if (!items.length) {
                        console.log('⚠️ No cached fee structure, falling back to billing types');
                        const classBillingTypes = billingTypes.filter(bt => 
                          bt.className === cls && 
                          (!selectedTerm || bt.term === selectedTerm) &&
                          (!selectedYear || bt.year === selectedYear)
                        );
                        
                        items = classBillingTypes.map(bt => ({
                          id: bt.id,
                          feeName: bt.name,
                          name: bt.name,
                          amount: Number(bt.amount || 0),
                          frequency: bt.frequency || 'termly',
                          term: bt.term,
                          year: bt.year,
                          className: bt.className
                        }));
                      }
                      
                      console.log('🔍 Fee items for display:', {
                        class: cls,
                        term: selectedTerm,
                        year: selectedYear,
                        itemsCount: items.length,
                        items: items.map(i => ({ name: i.feeName || i.name, amount: i.amount, term: i.term, year: i.year }))
                      });

                      if (!items.length) {
                        return (
                          <div className="bg-blue-50 p-2 rounded-lg border border-blue-200 text-xs text-blue-800">
                            ✅ No fee structure found for {cls}. Database is empty.
                          </div>
                        );
                      }

                      // Apply Day/Boarding filter so displayed items match the student's residence
                      const residenceDisplay: 'Day' | 'Boarding' | undefined = getResidenceFromStudent(selectedPaymentStudent);
                      
                      // If residence type is not detected, try to infer from student data
                      let finalResidenceType = residenceDisplay;
                      if (!finalResidenceType) {
                        // Only use explicit residenceType field, don't infer from class names
                        // Default to Day if not explicitly specified
                        finalResidenceType = 'Day';
                        
                        console.log('🔍 Residence type determination:', {
                          original: residenceDisplay,
                          studentResidenceType: selectedPaymentStudent?.residenceType,
                          finalResidenceType,
                          note: 'Defaulting to Day student - boarding fees will be excluded'
                        });
                      }
                      
                      console.log('🔍 Student residence debug:', {
                        student: selectedPaymentStudent,
                        residenceType: selectedPaymentStudent?.residenceType,
                        section: selectedPaymentStudent?.section,
                        residenceDisplay,
                        finalResidenceType,
                        itemsCount: items.length,
                        items: items.map(i => ({ name: i.feeName || i.name, amount: i.amount }))
                      });
                      const { items: itemsForDisplay } = filterFeeItemsByResidence(items, finalResidenceType);
                      console.log('🔍 After filtering:', {
                        residenceDisplay: finalResidenceType,
                        filteredCount: itemsForDisplay.length,
                        filteredItems: itemsForDisplay.map(i => ({ name: i.feeName || i.name, amount: i.amount }))
                      });
                      const finalDisplay = (itemsForDisplay as any[]).filter((f: any) => {
                        if (finalResidenceType === 'Boarding') return true;
                        const label = String(f.feeName || f.name || '').toLowerCase();
                        return !label.includes('board');
                      });
                      console.log('🔍 Final display:', {
                        finalCount: finalDisplay.length,
                        finalItems: finalDisplay.map(i => ({ name: i.feeName || i.name, amount: i.amount }))
                      });
                      return finalDisplay.map((fee: any) => {
                        // Try multiple possible field names for fee name
                        const feeName = fee.feeName || fee.name || fee.fee_name || fee.title || fee.label || 'Fee';
                        const amount = Number(fee.amount || 0);
                        const meta: string[] = [];
                        if (fee.frequency) meta.push(String(fee.frequency));
                        if (fee.term || fee.year) meta.push(`${fee.term || ''} ${fee.year || ''}`.trim());
                        
                        console.log('🔍 Fee display debug:', {
                          fee: fee,
                          feeName: feeName,
                          amount: amount,
                          fields: Object.keys(fee)
                        });
                        
                        return (
                          <div key={(fee.id || feeName)} className="bg-white/80 backdrop-blur-sm p-2 rounded-lg border border-white/20 shadow-md">
                            <div className="font-semibold text-xs text-gray-700">{feeName}</div>
                            <div className="text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">UGX {amount.toLocaleString()}</div>
                            {meta.length > 0 && (
                              <div className="text-[10px] text-gray-500">{meta.join(' • ')}</div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                  <div className="mt-2 pt-2 border-t border-gradient-to-r from-purple-200/50 to-pink-200/50 bg-gradient-to-r from-purple-50/30 to-pink-50/30 rounded-lg p-2">
                    <div className="text-xs text-gray-600 font-medium">Total Required:</div>
                    <div className="text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {(() => {
                        const cls = (selectedPaymentStudent?.className || selectedPaymentStudent?.class || '').trim();
                        
                        // Fetch fee structure directly from admin's billing types configuration
                        let items: any[] = [];
                        
                        // Get billing types for this student's class from admin configuration
                        const classBillingTypes = billingTypes.filter(bt => 
                          bt.className === cls && 
                          (!selectedTerm || bt.term === selectedTerm) &&
                          (!selectedYear || bt.year === selectedYear)
                        );
                        
                        // Convert billing types to fee structure format
                        items = classBillingTypes.map(bt => ({
                          id: bt.id,
                          feeName: bt.feeName,
                          name: bt.feeName,
                          amount: Number(bt.amount || 0),
                          frequency: bt.frequency || 'termly',
                          term: bt.term,
                          year: bt.year,
                          className: bt.className
                        }));
                        
                        // Ensure Day students do not include any boarding-related items in the total
                        const residenceTotal: 'Day' | 'Boarding' | undefined = getResidenceFromStudent(selectedPaymentStudent);
                        const { total: filteredTotal } = filterFeeItemsByResidence(items, residenceTotal);
                        
                        console.log('🔍 Total Required calculation:', {
                          class: cls,
                          residence: residenceTotal,
                          itemsCount: items.length,
                          items: items.map(i => ({ name: i.feeName || i.name, amount: i.amount })),
                          filteredTotal: filteredTotal,
                          rawTotal: items.reduce((sum, item) => sum + Number(item.amount || 0), 0)
                        });
                        
                        // Use payment summary API data if available (more reliable than frontend filtering)
                        const apiTotal = paymentSummary?.totalFeesRequired;
                        if (apiTotal && apiTotal > 0) {
                          console.log('🔍 Using API total:', apiTotal);
                          return `UGX ${apiTotal.toLocaleString()}`;
                        }
                        
                        console.log('🔍 Using frontend filtered total:', filteredTotal);
                        return `UGX ${filteredTotal.toLocaleString()}`;
                      })()}
                    </div>
                  </div>
                  </div>
                </div>

                {/* AI-Generated Already Paid */}
                <div className="group relative overflow-hidden bg-gradient-to-br from-white via-green-50/30 to-emerald-50/30 backdrop-blur-xl rounded-lg shadow-md border border-white/20 p-2 transform hover:scale-105 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-emerald-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-md shadow-sm flex items-center justify-center">
                        <DollarSign className="h-3 w-3 text-white" />
                      </div>
                      <h3 className="text-xs font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">✅ Already Paid</h3>
                    </div>
                  <div className="space-y-2">
                    {(() => {
                      const cls = selectedPaymentStudent?.className || selectedPaymentStudent?.class || '';
                      const cache: any = (window as any).__feeStructCache || {};
                      const items: any[] = Array.isArray(cache[String(cls)]?.items) ? cache[String(cls)].items : [];
                      
                      // Map fee names to match payment summary keys
                      const feeMapping: Record<string, string> = {
                        'Uniform': 'Uniform Fee',
                        'Library': 'Library Fee', 
                        'Development': 'Development Fee',
                        'Tuition': 'Tuition Fee',
                        'Uniform Fee': 'Uniform Fee',
                        'Library Fee': 'Library Fee',
                        'Development Fee': 'Development Fee',
                        'Tuition Fee': 'Tuition Fee'
                      };
                      
                      const getPaidAmount = (feeName: string) => {
                        // Source of truth: backend paymentBreakdown per billingType
                        const mappedName = feeMapping[feeName] || feeName;
                        const findPaid = (name: string) => {
                          const b = paymentSummary?.paymentBreakdown?.find((it: any) => String(it.billingType || '').toLowerCase() === String(name).toLowerCase());
                          return b ? Number(b.paid || 0) : 0;
                        };
                        const paid = Math.max(findPaid(feeName), findPaid(mappedName));
                        return paid;
                      };
                      
                      // Hide Boarding for Day students in the Already Paid list
                      const residencePaid: 'Day' | 'Boarding' | undefined = getResidenceFromStudent(selectedPaymentStudent);
                      const { items: itemsPaidDisplay } = filterFeeItemsByResidence(items, residencePaid);
                      const finalPaid = (itemsPaidDisplay as any[]).filter((f: any) => {
                        if (residencePaid === 'Boarding') return true;
                        const label = String(f.feeName || f.name || '').toLowerCase();
                        return !label.includes('board');
                      });
                      return finalPaid.map((fee: any) => {
                        const feeName = fee.feeName || fee.name;
                        const paidAmount = getPaidAmount(feeName);
                        return (
                          <div key={(fee.id || feeName)} className="bg-white/80 backdrop-blur-sm p-2 rounded-lg border border-white/20 shadow-md hover:shadow-lg transition-all duration-300">
                            <div className="flex items-center justify-between mb-1">
                              <div className="font-semibold text-xs text-gray-700">{feeName}</div>
                              <div className="w-1.5 h-1.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-pulse"></div>
                            </div>
                            <div className="text-sm font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                              UGX {paidAmount.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {paidAmount > 0 ? 'Paid' : 'Not paid'}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                    <div className="mt-2 pt-2 border-t border-gradient-to-r from-green-200/50 to-emerald-200/50 bg-gradient-to-r from-green-50/30 to-emerald-50/30 rounded-lg p-2">
                      <div className="text-xs text-gray-600 font-medium">Total Paid:</div>
                      <div className="text-sm font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        UGX {paymentSummary?.totalPaid?.toLocaleString() || '0'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI-Generated Balance Remaining */}
                <div className="group relative overflow-hidden bg-gradient-to-br from-white via-orange-50/30 to-amber-50/30 backdrop-blur-xl rounded-lg shadow-md border border-white/20 p-2 transform hover:scale-105 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400/10 to-amber-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-amber-500 rounded-md shadow-sm flex items-center justify-center">
                        <DollarSign className="h-3 w-3 text-white" />
                      </div>
                      <h3 className="text-xs font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">💰 Balance Remaining</h3>
                    </div>
                  <div className="space-y-2">
                    {(() => {
                      const cls = selectedPaymentStudent?.className || selectedPaymentStudent?.class || '';
                      
                      // Use cached fee structure that was loaded with proper admission term filtering
                      const cache: any = (window as any).__feeStructCache || {};
                      let items: any[] = Array.isArray(cache[cls]?.items) ? cache[cls].items : [];
                      
                      // If no cached data, fallback to billing types with term/year filtering
                      if (!items.length) {
                        const classBillingTypes = billingTypes.filter(bt => 
                          bt.className === cls && 
                          (!selectedTerm || bt.term === selectedTerm) &&
                          (!selectedYear || bt.year === selectedYear)
                        );
                        
                        items = classBillingTypes.map(bt => ({
                          id: bt.id,
                          feeName: bt.name,
                          name: bt.name,
                          amount: Number(bt.amount || 0),
                          frequency: bt.frequency || 'termly',
                          term: bt.term,
                          year: bt.year,
                          className: bt.className
                        }));
                      }
                      
                      // Apply Day/Boarding filter so Day students do NOT see boarding-related items
                      const residence: 'Day' | 'Boarding' | undefined = getResidenceFromStudent(selectedPaymentStudent);
                      const { items: filteredItems } = filterFeeItemsByResidence(items, residence);
                      const itemsForBalance = (filteredItems as any[]).filter((f: any) => {
                        if (residence === 'Boarding') return true;
                        const label = String(f.feeName || f.name || '').toLowerCase();
                        return !label.includes('board');
                      });
                      const paidFor = (name: string) => {
                        // Source of truth: backend paymentBreakdown
                        const feeMappingLocal: Record<string, string> = {
                          'Uniform': 'Uniform Fee',
                          'Library': 'Library Fee', 
                          'Development': 'Development Fee',
                          'Tuition': 'Tuition Fee',
                          'Uniform Fee': 'Uniform Fee',
                          'Library Fee': 'Library Fee',
                          'Development Fee': 'Development Fee',
                          'Tuition Fee': 'Tuition Fee'
                        };
                        const mappedName = feeMappingLocal[name] || name;
                        const findPaid = (n: string) => {
                          const b = paymentSummary?.paymentBreakdown?.find((it: any) => String(it.billingType || '').toLowerCase() === String(n).toLowerCase());
                          return b ? Number(b.paid || 0) : 0;
                        };
                        return Math.max(findPaid(name), findPaid(mappedName));
                      };
                      return itemsForBalance.map((fee: any) => {
                        // Try multiple possible field names for fee name
                        const feeName = fee.feeName || fee.name || fee.fee_name || fee.title || fee.label || 'Fee';
                        const required = Number(fee.amount || 0);
                        const remaining = Math.max(0, required - paidFor(feeName));
                        
                        console.log('🔍 Balance Remaining fee debug:', {
                          fee: fee,
                          feeName: feeName,
                          amount: required,
                          remaining: remaining
                        });
                        return (
                          <div key={(fee.id || feeName)} className="bg-white/80 backdrop-blur-sm p-2 rounded-lg border border-white/20 shadow-md hover:shadow-lg transition-all duration-300">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-semibold text-xs text-gray-700">{feeName}</div>
                              <div className="w-1.5 h-1.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full animate-pulse"></div>
                            </div>
                            <div className="text-sm font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">UGX {remaining.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">{remaining === 0 ? 'Fully paid' : 'Remaining'}</div>
                            {remaining > 0 && (
                              <button onClick={() => handlePayButtonClick(feeName, remaining)} className="mt-3 w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-amber-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                                💳 Pay UGX {remaining.toLocaleString()}
                              </button>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gradient-to-r from-orange-200/50 to-amber-200/50 bg-gradient-to-r from-orange-50/30 to-amber-50/30 rounded-lg p-2">
                      <div className="text-xs text-gray-600 font-medium">Total Remaining:</div>
                      <div className="text-sm font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                        {(() => {
                          // When specific term/year is selected, use frontend calculation for accurate term-specific totals
                          if (selectedTerm && selectedYear) {
                            const residence = getResidenceFromStudent(selectedPaymentStudent);
                            const required = getTotalRequiredFees(selectedPaymentStudent?.class || 'Senior 1', residence, selectedPaymentStudent, selectedTerm, selectedYear);
                            const balance = Math.max(0, required - (paymentSummary?.totalPaid || 0));
                            console.log('🔍 Using term-specific frontend calculated balance:', balance);
                            return `UGX ${balance.toLocaleString()}`;
                          }
                          
                          // Use API data when no specific term is selected
                          const apiBalance = paymentSummary?.balance;
                          if (apiBalance !== undefined && apiBalance !== null) {
                            console.log('🔍 Using API balance:', apiBalance);
                            return `UGX ${apiBalance.toLocaleString()}`;
                          }
                          
                          // Fallback to frontend calculation
                          const residence = getResidenceFromStudent(selectedPaymentStudent);
                          const required = getTotalRequiredFees(selectedPaymentStudent?.class || 'Senior 1', residence, selectedPaymentStudent, selectedTerm, selectedYear);
                          const balance = Math.max(0, required - (paymentSummary?.totalPaid || 0));
                          console.log('🔍 Using fallback frontend calculated balance:', balance);
                          return `UGX ${balance.toLocaleString()}`;
                        })()}
                      </div>
                    </div>
                </div>
              </div>

              {/* Ultra-Compact Payment Summary */}
              <div className="bg-gradient-to-br from-white via-green-50/30 to-emerald-50/30 backdrop-blur-xl rounded-xl shadow-lg border border-white/20 p-3 max-w-xl mx-auto">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-md shadow-md flex items-center justify-center">
                    <BarChart3 className="h-3 w-3 text-white" />
                  </div>
                  <h3 className="text-sm font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">📊 Payment Summary</h3>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gradient-to-br from-white via-purple-50/50 to-pink-50/50 backdrop-blur-sm rounded-lg p-2 border border-white/20 shadow-md text-center">
                    <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-1">
                      <DollarSign className="h-2 w-2 text-white" />
                  </div>
                    <div className="text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent truncate">
                      {(() => {
                        const cls = selectedPaymentStudent?.class || selectedPaymentStudent?.className || '';
                        
                        // Use the same calculation method as Original Fees section
                        const classBillingTypes = billingTypes.filter(bt => 
                          bt.className === cls && 
                          (!selectedTerm || bt.term === selectedTerm) &&
                          (!selectedYear || bt.year === selectedYear)
                        );
                        
                        const items = classBillingTypes.map(bt => ({
                          id: bt.id,
                          feeName: bt.name,
                          name: bt.name,
                          amount: Number(bt.amount || 0),
                          frequency: bt.frequency || 'termly',
                          term: bt.term,
                          year: bt.year,
                          className: bt.className
                        }));
                        
                        const residence = getResidenceFromStudent(selectedPaymentStudent);
                        const { total: filteredTotal } = filterFeeItemsByResidence(items, residence);
                        
                        console.log('🔍 Payment Summary Required calculation:', {
                          class: cls,
                          residence: residence,
                          itemsCount: items.length,
                          items: items.map(i => ({ name: i.feeName || i.name, amount: i.amount })),
                          filteredTotal: filteredTotal
                        });
                        
                        return filteredTotal.toLocaleString();
                      })()}
                    </div>
                    <div className="text-xs text-gray-600">Required</div>
                    </div>
                  <div className="bg-gradient-to-br from-white via-green-50/50 to-emerald-50/50 backdrop-blur-sm rounded-lg p-2 border border-white/20 shadow-md text-center">
                    <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-1">
                      <DollarSign className="h-2 w-2 text-white" />
                  </div>
                    <div className="text-sm font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent truncate">
                      {paymentSummary?.totalPaid?.toLocaleString() || '0'}
                    </div>
                    <div className="text-xs text-gray-600">Paid</div>
                  </div>
                  <div className="bg-gradient-to-br from-white via-orange-50/50 to-amber-50/50 backdrop-blur-sm rounded-lg p-2 border border-white/20 shadow-md text-center">
                    <div className="w-4 h-4 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-1">
                      <DollarSign className="h-2 w-2 text-white" />
                </div>
                    <div className="text-sm font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent truncate">
                      {(() => {
                        // When specific term/year is selected, use frontend calculation for accurate term-specific totals
                        if (selectedTerm && selectedYear) {
                          const residence = getResidenceFromStudent(selectedPaymentStudent);
                          const required = getTotalRequiredFees(selectedPaymentStudent?.class || 'Senior 1', residence, selectedPaymentStudent, selectedTerm, selectedYear);
                          const balance = Math.max(0, required - (paymentSummary?.totalPaid || 0));
                          console.log('🔍 Payment Summary - Using term-specific frontend calculated balance:', balance);
                          return balance.toLocaleString();
                        }
                        
                        // Use API data when no specific term is selected
                        const apiBalance = paymentSummary?.balance;
                        if (apiBalance !== undefined && apiBalance !== null) {
                          console.log('🔍 Payment Summary - Using API balance:', apiBalance);
                          return apiBalance.toLocaleString();
                        }
                        
                        // Fallback to frontend calculation
                        const residence = getResidenceFromStudent(selectedPaymentStudent);
                        const required = getTotalRequiredFees(selectedPaymentStudent?.class || 'Senior 1', residence, selectedPaymentStudent, selectedTerm, selectedYear);
                        const balance = Math.max(0, required - (paymentSummary?.totalPaid || 0));
                        console.log('🔍 Payment Summary - Using fallback frontend calculated balance:', balance);
                        return balance.toLocaleString();
                      })()}
              </div>
                    <div className="text-xs text-gray-600">Remaining</div>
            </div>
                </div>
              </div>
              </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-500 text-lg mb-4">👤</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Student Selected</h3>
                  <p className="text-gray-500">Please search for a student using their access number to view payment information.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'financial-records' && (
          <div className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6">
            <h2 className="text-xl font-semibold text-purple-600 mb-6">Financial Records</h2>
            <div className="space-y-6">
              {/* Search and Filter */}
              <div className="bg-gradient-to-r from-purple-50/50 to-blue-50/50 rounded-lg p-4 border border-purple-200/50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                    <input
                      type="text"
                      placeholder="Search records..."
                      className="w-full rounded-lg border-purple-200/50 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-white/80 backdrop-blur-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select className="w-full rounded-lg border-purple-200/50 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-white/80 backdrop-blur-sm">
                      <option>All Status</option>
                      <option>Paid</option>
                      <option>Pending</option>
                      <option>Overdue</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                    <select className="w-full rounded-lg border-purple-200/50 shadow-sm focus:border-purple-500 focus:ring-purple-500 bg-white/80 backdrop-blur-sm">
                      <option>All Classes</option>
                      <option>Senior 1</option>
                      <option>Senior 2</option>
                      <option>Senior 3</option>
                      <option>Senior 4</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-200 shadow-md hover:shadow-lg">
                      Filter Records
                    </button>
                  </div>
                </div>
              </div>

              {/* Financial Records Table */}
              <div className="bg-gradient-to-br from-white to-gray-50/30 backdrop-blur-sm border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-purple-50/50 to-blue-50/50">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Student</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Class</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Fee Type</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Method</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="py-3 px-4">2024-09-13</td>
                        <td className="py-3 px-4 font-semibold">Robert Ssekisongebbsb</td>
                        <td className="py-3 px-4">Senior 1</td>
                        <td className="py-3 px-4">Tuition</td>
                        <td className="py-3 px-4 font-semibold">UGX 800,000</td>
                        <td className="py-3 px-4">Cash</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Paid</span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">PAY1757776307372</td>
                      </tr>
                      <tr className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="py-3 px-4">2024-09-12</td>
                        <td className="py-3 px-4 font-semibold">John Doe</td>
                        <td className="py-3 px-4">Senior 1</td>
                        <td className="py-3 px-4">Uniform</td>
                        <td className="py-3 px-4 font-semibold">UGX 50,000</td>
                        <td className="py-3 px-4">Mobile Money</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Paid</span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">PAY1757776207372</td>
                      </tr>
                      <tr className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="py-3 px-4">2024-09-11</td>
                        <td className="py-3 px-4 font-semibold">Test Student</td>
                        <td className="py-3 px-4">Senior 1</td>
                        <td className="py-3 px-4">Library Fee</td>
                        <td className="py-3 px-4 font-semibold">UGX 25,000</td>
                        <td className="py-3 px-4">Bank Transfer</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">Pending</span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">PAY1757776107372</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Export Options */}
              <div className="flex justify-end space-x-3">
                <button className="px-4 py-2 border border-purple-200/50 rounded-lg text-purple-700 hover:bg-purple-50/50 transition-all duration-200 bg-white/80 backdrop-blur-sm">
                  Export CSV
                </button>
                <button className="px-4 py-2 border border-blue-200/50 rounded-lg text-blue-700 hover:bg-blue-50/50 transition-all duration-200 bg-white/80 backdrop-blur-sm">
                  Export PDF
                </button>
                <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-200 shadow-md hover:shadow-lg">
                  Print Records
                </button>
              </div>
            </div>
          </div>
        )}









        {activeTab === 'payment-system' && !location.pathname.includes('/pay-staff') && (
          <div className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6">
            <InteractionTrackerProvider>
              <PaymentSystem />
            </InteractionTrackerProvider>
          </div>
        )}

        {/* WhatsApp URLs Modal */}
        {showWhatsappUrls && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  📱 WhatsApp Reminder URLs
                </h3>
                <button
                  onClick={() => setShowWhatsappUrls(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-600 mb-4">
                  Click on any URL below to open WhatsApp with the pre-formatted message:
                </p>
                
                {whatsappUrls.map((url, index) => (
                  <div key={index} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-green-800 mb-2">
                          Message #{index + 1}
                        </p>
                        <p className="text-xs text-gray-600 break-all">
                          {url}
                        </p>
                      </div>
                      <button
                        onClick={() => window.open(url, '_blank')}
                        className="ml-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center space-x-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>Open</span>
                      </button>
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      const allUrls = whatsappUrls.join('\n');
                      navigator.clipboard.writeText(allUrls);
                      alert('All URLs copied to clipboard!');
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                  >
                    📋 Copy All URLs
                  </button>
                  <button
                    onClick={() => setShowWhatsappUrls(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Payment Options Modal */}
      {selectedPayment && (
        <PaymentOptionsModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedPayment(null);
          }}
          paymentItem={selectedPayment}
          onProcessPayment={handleProcessPayment}
        />
      )}
      </div>
    </div>
  );
};

export default FinancialManagement;
