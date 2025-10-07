import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { filterFeeItemsByResidence } from '../../utils/feeCalculation';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../common/NotificationProvider';
import { useInteractionTracker } from '../analytics/InteractionTracker';
import { 
  CreditCard, 
  DollarSign, 
  Calendar, 
  Receipt, 
  Search, 
  Filter, 
  Plus, 
  Lock,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  BarChart3,
  PieChart,
  Activity,
  Heart,
  RefreshCw,
  Database
} from 'lucide-react';
import { buildApiUrl } from '../../utils/api';
import { PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const PaymentSystem: React.FC = () => {
  const { students, financialRecords, addFinancialRecord, settings } = useData();

  // Normalize Day/Boarding from explicit residenceType field only
  const getResidenceFromStudent = (student: any): 'Day' | 'Boarding' | undefined => {
    // Only use explicit residenceType field, don't infer from other fields
    const residenceType = student?.residenceType;
    
    console.log('🔍 PaymentSystem Residence detection:', {
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
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { trackPayment, trackInteraction } = useInteractionTracker();
  
  // Check if user can see sponsorship status
  const canSeeSponsorshipStatus = (userRole: string) => {
    return ['ADMIN', 'SUPERUSER', 'SPONSORSHIPS_OVERSEER', 'sponsorships-overseer', 'SPONSORSHIP-OVERSEER', 'SPONSORSHIPS-OVERSEER'].includes(userRole);
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [filterStream, setFilterStream] = useState('all');
  const [dateRange, setDateRange] = useState('last-7-days');
  const [viewMode, setViewMode] = useState('overview');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showFinancialStatement, setShowFinancialStatement] = useState(false);
  const [showChildDetails, setShowChildDetails] = useState(false);
  const [overdueSettings, setOverdueSettings] = useState({
    gracePeriod: 30, // days
    overdueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  });

  // Check if teacher has assigned classes
  const hasAssignedClasses = () => {
    if (user?.role?.toLowerCase() !== 'user' && user?.role?.toLowerCase() !== 'super-teacher') {
      return true; // Admin and other roles can see everything
    }

    // Check for new assignedClasses structure
    if (user.assignedClasses) {
      try {
        const assignedClasses = typeof user.assignedClasses === 'string' 
          ? JSON.parse(user.assignedClasses) 
          : user.assignedClasses;
        return assignedClasses && assignedClasses.length > 0;
      } catch (error) {
        console.error('Error parsing assignedClasses:', error);
      }
    }

    // Fallback to old assignedStream logic
    if (user.assignedStream) {
      return true;
    }

    return false;
  };


  // Calculate payment statistics
  const calculatePaymentStats = () => {
    const totalStudents = students.length;
    
    // Calculate total fees from fee structure (only for currently selected class if loaded)
    const totalFeesDemanded = students.reduce((sum, student) => {
      const classTotal = (selectedStudent && student.class === selectedStudent.class) ? (classFeeTotal || 0) : 0;
      return sum + classTotal;
    }, 0);
    
    // Calculate total amount paid including both payments and sponsorships
    const totalAmountPaid = financialRecords
      .filter(record => (record.type === 'payment' || record.type === 'sponsorship') && record.status === 'paid')
      .reduce((sum, record) => sum + record.amount, 0);
    
    const totalBalance = Math.max(0, totalFeesDemanded - totalAmountPaid);
    const paymentRate = totalFeesDemanded > 0 ? Math.round((totalAmountPaid / totalFeesDemanded) * 100) : 0;

    // Sponsored students calculations
    const sponsoredStudents = students.filter(student => student.sponsorshipStatus === 'sponsored');
    const totalSponsoredFees = sponsoredStudents.reduce((sum, student) => {
      const classTotal = (selectedStudent && student.class === selectedStudent.class) ? (classFeeTotal || 0) : 0;
      return sum + classTotal;
    }, 0);
    const totalSponsoredPaid = financialRecords
      .filter(record => (record.type === 'payment' || record.type === 'sponsorship') && record.status === 'paid' && 
        sponsoredStudents.some(s => s.id === record.studentId))
      .reduce((sum, record) => sum + record.amount, 0);

    // Status breakdown including sponsorships
    // Completed should reflect number of students fully paid (not number of payment records)
    const paidByStudent: Record<string, number> = {};
    financialRecords
      .filter(record => (record.type === 'payment' || record.type === 'sponsorship') && record.status === 'paid')
      .forEach(record => {
        const key = String(record.studentId);
        paidByStudent[key] = (paidByStudent[key] || 0) + Number(record.amount || 0);
      });
    const completedPayments = students.filter(student => {
      const totalRequiredForStudent = (selectedStudent && student.class === selectedStudent.class) ? (classFeeTotal || 0) : 0;
      const paid = paidByStudent[String(student.id)] || 0;
      return totalRequiredForStudent > 0 && paid >= totalRequiredForStudent;
    }).length;
    // Pending = students with a positive outstanding balance
    const pendingPayments = students.filter(student => {
      const required = (selectedStudent && student.class === selectedStudent.class) ? (classFeeTotal || 0) : 0;
      if (required <= 0) return false;
      const paid = paidByStudent[String(student.id)] || 0;
      return paid < required;
    }).length;
    const overduePayments = financialRecords.filter(record => 
      (record.type === 'payment' || record.type === 'sponsorship') && record.status === 'overdue'
    ).length;
    const partialPayments = financialRecords.filter(record => 
      (record.type === 'payment' || record.type === 'sponsorship') && record.status === 'paid' && record.balance > 0
    ).length;

    return {
      totalStudents,
      totalFeesDemanded,
      totalAmountPaid,
      totalBalance,
      paymentRate,
      completedPayments,
      pendingPayments,
      overduePayments,
      partialPayments,
      sponsoredStudents: sponsoredStudents.length,
      totalSponsoredFees,
      totalSponsoredPaid
    };
  };

  const stats = calculatePaymentStats();
  // Force refresh: reload student, class fee items, and recompute panels
  const forceRefresh = async () => {
    try {
      if (!selectedStudent) return;
      setIsRefreshing(true);
      
      console.log('🔄 Starting comprehensive refresh...');
      
      // 0. Fetch a fresh copy of the student (ensures latest Day/Boarding)
      let freshStudent = selectedStudent as any;
      try {
        const sRes = await fetch(buildApiUrl(`students/${selectedStudent.id}?t=${Date.now()}`));
        if (sRes.ok) {
          freshStudent = await sRes.json();
          console.log('👤 Fresh student for refresh:', { id: freshStudent?.id, residenceType: freshStudent?.residenceType });
          // Replace selected student so all dependent UIs re-bind instantly
          setSelectedStudent(freshStudent);
        }
      } catch (_err) {}

      // 1. Re-fetch class fee structures from database
      console.log('📊 Fetching fresh fee structures for class:', selectedStudent.class);
      const data = await fetchFeeStructures(selectedStudent.class);
      if (data && Array.isArray(data.feeStructures)) {
        const items = data.feeStructures.map((f: any) => ({ feeName: f.feeName || f.name, amount: Number(f.amount || 0) }));
        const residence: 'Day' | 'Boarding' | undefined = getResidenceFromStudent(freshStudent);
        const filtered = filterFeeItemsByResidence(items, residence);
        setClassFeeItems(filtered.items as any[]);
        setClassFeeTotal(filtered.total);
        try {
          const cacheKey = String(selectedStudent.class);
          (window as any).__feeStructCache = (window as any).__feeStructCache || {};
          (window as any).__feeStructCache[cacheKey] = { items: filtered.items, total: filtered.total, residence: residence || 'Day' };
        } catch (_cacheErr) {}
        console.log('✅ Fee structures updated (filtered):', filtered.items.length, 'items');
      }
      
      // 2. Re-fetch student payment summary from database
      console.log('💰 Fetching fresh payment summary for student:', selectedStudent.id);
      try {
        const sid = (freshStudent?.id || selectedStudent.id);
        const paymentResponse = await fetch(buildApiUrl(`payments/student/${sid}/summary?t=${Date.now()}`));
        if (paymentResponse.ok) {
          const paymentData = await paymentResponse.json();
          console.log('✅ Payment summary refreshed:', paymentData);
          // Sync selected student's paid/balance/total for immediate UI reflection
          try {
            const totalPaid = Number(paymentData?.totalPaid || 0);
            const totalFeesRequired = Number(paymentData?.totalFeesRequired || 0);
            const balance = Math.max(0, totalFeesRequired - totalPaid);
            setSelectedStudent((prev: any) => prev ? { ...prev, feesPaid: totalPaid, totalFees: totalFeesRequired, feeBalance: balance } : prev);
            // Avoid localStorage caching; always compute from backend
          } catch (_syncErr) {}
        }
      } catch (paymentError) {
        console.warn('⚠️ Could not refresh payment summary:', paymentError);
      }
      
      // 3. Re-fetch billing types from database
      console.log('🏷️ Fetching fresh billing types...');
      try {
        const billingResponse = await fetch(buildApiUrl('settings/billing-types'));
        if (billingResponse.ok) {
          const billingData = await billingResponse.json();
          console.log('✅ Billing types refreshed:', billingData.length, 'types');
          // Update billing types context if available
        }
      } catch (billingError) {
        console.warn('⚠️ Could not refresh billing types:', billingError);
      }
      
      // 4. Clear any cached fee structure data
      if (typeof window !== 'undefined') {
        delete (window as any).__feeStructCache;
        // Clear localStorage fee structure cache
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('feeStructure_')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log('🗑️ Cleared fee structure cache and localStorage');
      }
      
      // 5. Trigger a state nudge so dependent UIs re-render
      setRefreshTick((t) => t + 1);

      // Keep the student selected; do not clear UI so payments persist visually
      
      console.log('🎉 Comprehensive refresh completed successfully!');
      showSuccess('Data Refreshed!', 'All fee structures and payment data have been updated from the database.', 3000);
      
    } catch (e) {
      console.error('❌ Refresh failed:', e);
      showError('Refresh Failed', 'Could not refresh data. Please try again.', 3000);
    } finally {
      // Reduce delay to minimize flickering
      setTimeout(() => setIsRefreshing(false), 100);
    }
  };

  const [refreshTick, setRefreshTick] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Helper function to calculate total fees for a student based on their class
  // Debug: Log billing types when they change
  useEffect(() => {
    if (selectedStudent) {
      console.log('👤 PaymentSystem Debug: Selected student:', selectedStudent.name, selectedStudent.class);
    }
  }, [selectedStudent]);

  // Component mounted - using fee structure only
  useEffect(() => {
    console.log('🔄 PaymentSystem: Component mounted - using fee structure system');
    // Listen for immediate student updates from anywhere in the app (e.g., StudentForm)
    const onStudentUpdated = (e: any) => {
      try {
        const detail = e?.detail || {};
        if (selectedStudent && detail?.id && String(detail.id) === String(selectedStudent.id)) {
          console.log('🔔 Student updated event received, refreshing fees immediately');
          // Trigger refresh and re-pull fee items to reflect Day/Boarding instantly
          (async () => {
            await forceRefresh();
          })();
        }
      } catch (_err) {}
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('student:updated' as any, onStudentUpdated as any);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('student:updated' as any, onStudentUpdated as any);
      }
    };
  }, []);

  // Refresh billing types when a student is selected to ensure correct fee structure
  // Student selected - using fee structure only (no billing types needed)
  useEffect(() => {
    if (selectedStudent) {
      console.log('🔄 PaymentSystem: Student selected:', selectedStudent.name, selectedStudent.class);
      console.log('💰 Using fee structure:', { 
        totalFees: selectedStudent.totalFees, 
        feesPaid: selectedStudent.feesPaid, 
        feeBalance: selectedStudent.feeBalance 
      });
    }
  }, [selectedStudent]);

  // Store class fee items fetched for the selected student's class
  const [classFeeItems, setClassFeeItems] = useState<any[]>([]);
  const [classFeeTotal, setClassFeeTotal] = useState<number>(0);

  // Whenever selected student changes, fetch the fee items for their class
  useEffect(() => {
    const loadFees = async () => {
      if (!selectedStudent) return;
      
      console.log('🔍 PaymentSystem Debug: Selected student residenceType:', (selectedStudent as any)?.residenceType);
      
      // Always fetch a fresh copy of the student from backend to reflect latest Day/Boarding updates
      let freshStudent = null as any;
      try {
        const res = await fetch(buildApiUrl(`students/${selectedStudent.id}`));
        if (res.ok) {
          freshStudent = await res.json();
          console.log('🔄 Fresh student fetched for fee filtering:', { id: freshStudent?.id, residenceType: freshStudent?.residenceType });
        }
      } catch (_err) {}

      const data = await fetchFeeStructures(selectedStudent.class);
      if (data && Array.isArray(data.feeStructures)) {
        const items = data.feeStructures.map((f: any) => ({ feeName: f.feeName || f.name, amount: Number(f.amount || 0) }));
        console.log('🔍 PaymentSystem Debug: Original fee items:', items);
        
        const residence: 'Day' | 'Boarding' | undefined = getResidenceFromStudent(freshStudent || selectedStudent);
        console.log('🔍 PaymentSystem Debug: Student residenceType:', residence);
        console.log('🔍 PaymentSystem Debug: Full API data:', data);
        
        const filtered = filterFeeItemsByResidence(items, residence);
        console.log('🔍 PaymentSystem Debug: Filtered fee items:', filtered.items);
        console.log('🔍 PaymentSystem Debug: Total after filtering (student-specific):', filtered.total);
        console.log('🔍 PaymentSystem Debug: Item examples:', items.slice(0, 3));
        
        setClassFeeItems(filtered.items as any[]);
        setClassFeeTotal(filtered.total);
        try {
          // Cache filtered items globally for other views (e.g., Balance Remaining panel)
          const cacheKey = String(selectedStudent.class);
          (window as any).__feeStructCache = (window as any).__feeStructCache || {};
          (window as any).__feeStructCache[cacheKey] = { items: filtered.items, total: filtered.total, residence: residence || 'Day' };
          console.log('🗂️ Cached filtered fee items for class:', cacheKey);
        } catch (_cacheErr) {}
      } else {
        setClassFeeItems([]);
        setClassFeeTotal(0);
      }
    };
    loadFees();
  }, [selectedStudent]);

  // Fetch class fee items strictly from Billing Types (single source of truth)
  const fetchFeeStructures = async (className: string) => {
    if (!className) return { feeStructures: [], totalFees: 0 };
    const normalized = String(className).trim();
    try {
      const btRes = await fetch(buildApiUrl('settings/billing-types'));
      if (btRes.ok) {
        const data = await btRes.json();
        const list = Array.isArray(data?.value) ? data.value : (Array.isArray(data) ? data : []);
        const filtered = list.filter((b: any) => String(b.className || '').toLowerCase() === normalized.toLowerCase());
        const items = filtered.map((bt: any) => ({
          id: bt.id,
          feeName: bt.name || bt.feeName,
          amount: Number(bt.amount || 0),
          frequency: bt.frequency,
          term: bt.term,
          year: bt.year,
        }));
        // Don't calculate total here - let the filtering function handle it based on residence type
        return { feeStructures: items as any[], totalFees: 0 };
      }
    } catch (_e) {}
    return { feeStructures: [], totalFees: 0 };
  };

  // Get student's fee structure dynamically
  const getStudentFeeStructure = async (student) => {
    console.log('🔍 Getting fee structure for student:', student.name, student.class);
    
    // First check if student has fee structure in database
    if (student.totalFees && student.totalFees > 0) {
      console.log('💰 Using existing student fee structure:', student.totalFees);
      return {
        totalFees: student.totalFees,
        feesPaid: student.feesPaid || 0,
        feeBalance: student.feeBalance || student.totalFees,
        feeStructures: [], // Will be populated from API
        source: 'student_record'
      };
    }
    
    // If no student fee structure, fetch from fee structures table
    const feeData = await fetchFeeStructures(student.class);
    
    if (feeData && feeData.feeStructures.length > 0) {
      console.log('📋 Using fee structures from database:', feeData.totalFees);
      return {
        totalFees: feeData.totalFees,
        feesPaid: 0, // New students start with zero payments
        feeBalance: feeData.totalFees,
        feeStructures: feeData.feeStructures,
        source: 'fee_structures_table'
      };
    }
    
    // No fee structure available
    console.log('⚠️ No fee structure found');
    return {
      totalFees: 0,
      feesPaid: 0,
      feeBalance: 0,
      feeStructures: [],
      source: 'none'
    };
  };

  // Generate financial statement for a student
  const generateFinancialStatement = (student) => {
    const studentRecords = financialRecords.filter(record => record.studentId === student.id);
    
    // Calculate total fees based on billing types for the student's class
    const totalFees = getStudentTotalFees(student);
    
    // Calculate total paid including both payments and sponsorships
    const totalPaid = studentRecords
      .filter(record => (record.type === 'payment' || record.type === 'sponsorship') && record.status === 'paid')
      .reduce((sum, record) => sum + record.amount, 0);
    
    const balance = Math.max(0, totalFees - totalPaid);
    
    return {
      student,
      totalFees,
      totalPaid,
      balance,
      records: studentRecords,
      paymentHistory: studentRecords
        .filter(record => record.type === 'payment' || record.type === 'sponsorship')
        .sort((a, b) => new Date(b.date) - new Date(a.date))
    };
  };

  // Calculate child payment details for the 3 boxes view - DYNAMIC FEE STRUCTURE
  const getChildPaymentDetails = async (student) => {
    console.log('🔍 getChildPaymentDetails called for student:', student.name, student.class);
    
    // Get dynamic fee structure
    const feeStructure = await getStudentFeeStructure(student);
    
    console.log('💰 Fee structure result:', feeStructure);
    
    const result = {
      totalFees: feeStructure.totalFees,
      feesPaid: feeStructure.feesPaid,
      feeBalance: feeStructure.feeBalance,
      feeStructures: feeStructure.feeStructures,
      source: feeStructure.source,
      paymentsByType: {}, // Empty for fee structure system
      balanceByType: {}, // Empty for fee structure system
      isSponsored: student.sponsorshipStatus === 'sponsored',
      sponsorshipDetails: student.sponsorship
    };
    
    console.log('✅ Final result (dynamic fee structure):', result);
    return result;
  };

  // Check if payment is overdue
  const isPaymentOverdue = (record) => {
    if (record.status === 'paid') return false;
    if (!record.date) return false; // If no date, consider it not overdue
    const dueDate = new Date(record.date);
    const today = new Date();
    const daysDiff = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
    return daysDiff > overdueSettings.gracePeriod;
  };

  // Generate chart data for payment distribution
  const getPaymentDistributionData = () => {
    const statusCounts = {
      'Paid': financialRecords.filter(r => (r.type === 'payment' || r.type === 'sponsorship') && r.status === 'paid').length,
      'Pending': financialRecords.filter(r => (r.type === 'payment' || r.type === 'sponsorship') && r.status === 'pending').length,
      'Overdue': financialRecords.filter(r => (r.type === 'payment' || r.type === 'sponsorship') && r.status === 'overdue').length,
      'Partial': financialRecords.filter(r => (r.type === 'payment' || r.type === 'sponsorship') && r.status === 'paid' && r.balance > 0).length
    };

    return Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
      color: name === 'Paid' ? '#10B981' : name === 'Pending' ? '#F59E0B' : name === 'Overdue' ? '#EF4444' : '#8B5CF6'
    }));
  };

  // Generate chart data for payment trends
  const getPaymentTrendsData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    return months.map(month => {
      const monthIndex = months.indexOf(month);
      const monthStart = new Date(currentYear, monthIndex, 1);
      const monthEnd = new Date(currentYear, monthIndex + 1, 0);
      
      const monthPayments = financialRecords.filter(record => {
        if (!record.date) return false; // Skip records without dates
        const recordDate = new Date(record.date);
        return (record.type === 'payment' || record.type === 'sponsorship') && record.status === 'paid' && 
               recordDate >= monthStart && recordDate <= monthEnd;
      });
      
      const totalAmount = monthPayments.reduce((sum, record) => sum + record.amount, 0);
      
      return {
        month,
        amount: totalAmount
      };
    });
  };

  // Generate chart data for payment status trends
  const getPaymentStatusTrendsData = () => {
    const statuses = ['Paid', 'Pending', 'Overdue'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    
    return months.map(month => {
      const monthIndex = months.indexOf(month);
      const monthStart = new Date(2024, monthIndex, 1);
      const monthEnd = new Date(2024, monthIndex + 1, 0);
      
      const monthRecords = financialRecords.filter(record => {
        if (!record.date) return false; // Skip records without dates
        const recordDate = new Date(record.date);
        return (record.type === 'payment' || record.type === 'sponsorship') && 
               recordDate >= monthStart && recordDate <= monthEnd;
      });
      
      return {
        month,
        Paid: monthRecords.filter(r => r.status === 'paid').length,
        Pending: monthRecords.filter(r => r.status === 'pending').length,
        Overdue: monthRecords.filter(r => r.status === 'overdue').length
      };
    });
  };

  // Generate chart data for seasonal patterns
  const getSeasonalPatternsData = () => {
    const seasons = [
      { name: 'Term 1', months: [0, 1, 2], color: '#3B82F6' },
      { name: 'Term 2', months: [3, 4, 5], color: '#10B981' },
      { name: 'Term 3', months: [6, 7, 8], color: '#F59E0B' },
      { name: 'Holiday', months: [9, 10, 11], color: '#EF4444' }
    ];
    
    return seasons.map(season => {
      const seasonPayments = financialRecords.filter(record => {
        if (!record.date) return false; // Skip records without dates
        const recordDate = new Date(record.date);
        const month = recordDate.getMonth();
        return (record.type === 'payment' || record.type === 'sponsorship') && record.status === 'paid' && 
               season.months.includes(month);
      });
      
      const totalAmount = seasonPayments.reduce((sum, record) => sum + record.amount, 0);
      
      return {
        season: season.name,
        amount: totalAmount,
        color: season.color
      };
    });
  };

  // Quick payment for remaining balance (one-click)
  const quickPayRemaining = async () => {
    try {
      if (!selectedStudent) return;
      // Recompute balance with current residence filter
      const freshRes = getResidenceFromStudent(selectedStudent);
      const filtered = filterFeeItemsByResidence(classFeeItems, freshRes);
      const totalForCalc = Number(filtered.total || 0);
      const feesPaid = Number(selectedStudent.feesPaid || 0);
      const balance = Math.max(0, totalForCalc - feesPaid);
      if (!balance || balance <= 0) return;

      const resp = await fetch(buildApiUrl('payments/process'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: String(selectedStudent.id),
          amount: balance,
          billingType: 'fee',
          paymentMethod: 'cash',
          paymentReference: '',
          description: `Quick payment of remaining balance for ${selectedStudent.name}`
        })
      });
      if (resp.ok) {
        await forceRefresh();
      } else {
        console.warn('Quick pay failed:', await resp.text());
      }
    } catch (e) {
      console.warn('Quick pay error:', e);
    }
  };

  // Handle sponsored child payment with comprehensive tracking
  const handleSponsoredPayment = async (student, amount, paymentMethod, reference) => {
    try {
      console.log('💳 Processing sponsored payment:', {
        student: student.name,
        amount,
        paymentMethod,
        reference
      });

      // Calculate current student balance
      const studentRecords = financialRecords.filter(record => record.studentId === student.id);
      const totalFees = getStudentTotalFees(student);
      const totalPaid = studentRecords
        .filter(record => (record.type === 'payment' || record.type === 'sponsorship') && record.status === 'paid')
        .reduce((sum, record) => sum + record.amount, 0);
      const currentBalance = Math.max(0, totalFees - totalPaid);
      const newBalance = Math.max(0, currentBalance - amount);

      // Create comprehensive payment record
      const newPayment = {
        studentId: student.id,
        studentName: student.name,
        type: 'payment' as const,
        billingType: 'Sponsored Payment',
        billingAmount: amount,
        amount: amount,
        description: `Sponsored payment for ${student.name} (${student.accessNumber || 'No Access Number'})`,
        date: new Date(),
        paymentDate: new Date(),
        paymentTime: new Date().toLocaleTimeString(),
        paymentMethod: paymentMethod as 'mobile-money' | 'bank-transfer' | 'cash' | 'momo' | 'airtel-money' | 'visa' | 'mastercard',
        status: 'paid' as const,
        receiptNumber: `SP${Date.now()}`,
        balance: newBalance,
        reference: reference || '',
        // Additional tracking fields
        processedBy: user?.name || 'System',
        processedAt: new Date(),
        studentClass: student.class,
        studentStream: student.stream,
        sponsorshipStatus: student.sponsorshipStatus,
        paymentCategory: 'sponsorship',
        notes: `Payment processed via ${paymentMethod}${reference ? ` - Reference: ${reference}` : ''}`
      };

      console.log('📝 Payment record created:', newPayment);

      // Add to financial records via addFinancialRecord (saves to database)
      const savedRecord = await addFinancialRecord(newPayment);
      
      // Update student's financial status
      await updateStudentFinancialStatus(student.id, amount, newBalance);

      // Track payment in analytics
      trackPaymentAnalytics(student, amount, paymentMethod);
      
      // Track payment interaction
      trackPayment(student.id.toString(), student.name, amount, paymentMethod);

      // Close modal
      setShowSponsoredPaymentModal(false);
      setSelectedSponsoredStudent(null);
      
      // Show celebration success message with more emojis
      showSuccess(
        '🎉🎊 Payment Successful! 🎉🎊',
        `✅ Payment of UGX ${amount.toLocaleString()} for ${student.name} has been processed!\n\n💳 Method: ${paymentMethod}${reference ? `\n🔗 Reference: ${reference}` : ''}\n🧾 Receipt: ${newPayment.receiptNumber}\n\n🎯 New Balance: UGX ${newBalance.toLocaleString()}\n🚀 Great job!`,
        7000
      );

      // Refresh data to show updated information
      await forceRefresh();

    } catch (error) {
      console.error('❌ Error processing sponsored payment:', error);
      showError('Payment Failed', `Failed to process payment: ${error.message}`, 5000);
    }
  };

  // Update student financial status after payment
  const updateStudentFinancialStatus = async (studentId, paymentAmount, newBalance) => {
    try {
      // Update student record with new financial status
      const student = students.find(s => s.id === studentId);
      if (student) {
        const updatedStudent = {
          ...student,
          totalFees: getStudentTotalFees(student),
          paidAmount: (student.paidAmount || 0) + paymentAmount,
          balance: newBalance,
          lastPaymentDate: new Date(),
          lastPaymentAmount: paymentAmount,
          updatedAt: new Date()
        };

        // Update student in backend
        const response = await fetch(buildApiUrl(`students/${studentId}`), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paidAmount: updatedStudent.paidAmount,
            balance: updatedStudent.balance,
            lastPaymentDate: updatedStudent.lastPaymentDate,
            lastPaymentAmount: updatedStudent.lastPaymentAmount
          })
        });

        if (response.ok) {
          console.log('✅ Student financial status updated successfully');
        }
      }
    } catch (error) {
      console.error('❌ Error updating student financial status:', error);
    }
  };

  // Track payment analytics for graphs and reporting
  const trackPaymentAnalytics = (student, amount, paymentMethod) => {
    try {
      // Create analytics record
      const analyticsRecord = {
        studentId: student.id,
        studentName: student.name,
        studentClass: student.class,
        studentStream: student.stream,
        paymentAmount: amount,
        paymentMethod: paymentMethod,
        paymentDate: new Date(),
        sponsorshipStatus: student.sponsorshipStatus,
        admittedBy: student.admittedBy,
        // Analytics categories
        category: 'sponsorship_payment',
        subcategory: paymentMethod,
        value: amount,
        metadata: {
          studentAge: student.age,
          studentGender: student.gender,
          parentName: student.parentName,
          parentOccupation: student.parentJob
        }
      };

      console.log('📊 Payment analytics tracked:', analyticsRecord);
      
      // Skip localStorage; optionally send to backend analytics if available
      // await fetch(buildApiUrl('analytics/payments'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(analyticsRecord) });

    } catch (error) {
      console.error('❌ Error tracking payment analytics:', error);
    }
  };

  // Filter records based on search and filters
  const filteredRecords = financialRecords.filter(record => {
    const student = students.find(s => s.id === record.studentId);
    if (!student) return false;

    // Enhanced search to include access numbers
    const matchesSearch = student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student?.accessNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    const matchesClass = filterClass === 'all' || student.class === filterClass;
    const matchesStream = filterStream === 'all' || student.stream === filterStream;

    return matchesSearch && matchesStatus && matchesClass && matchesStream;
  });

  // Get unique classes and streams for filters
  const uniqueClasses = [...new Set(students.map(s => s.class))].filter(Boolean);
  const uniqueStreams = [...new Set(students.map(s => s.stream))].filter(Boolean);

  // If teacher has no assigned classes, show restricted view
  if (user?.role === 'USER' || user?.role === 'SUPER_TEACHER') {
    if (!hasAssignedClasses()) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Payment Analysis</h1>
          </div>
            
          {/* Restricted Access Message */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
            <Lock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-yellow-800 mb-2">Access Restricted</h2>
            <p className="text-yellow-700 mb-4">
              You haven't been assigned to any classes or streams yet. Please contact an administrator to get assigned.
            </p>
            <div className="bg-yellow-100 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-yellow-800">
                <strong>What you need:</strong> Class and stream assignments to access the payment analysis.
              </p>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payment Analysis</h1>
            <p className="text-gray-600 mt-1">Comprehensive payment overview and analytics for all students</p>
          </div>
          <button
            onClick={async () => {
              console.log('🔄 Refreshing payment window...');
              await forceRefresh();
            }}
            className={`flex items-center space-x-2 px-4 py-2 ${isRefreshing ? 'bg-green-500' : 'bg-green-600'} hover:bg-green-700 text-white rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md`}
            title="🔄 Real-time refresh: Fetches latest fee structures, payment data, and billing types from database"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
            <Database className="h-3 w-3 opacity-75" />
          </button>
        </div>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
          <Download className="h-5 w-5" />
          <span>Export</span>
        </button>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-wrap items-center gap-4">
          {/* Date Range */}
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="rounded-lg border-gray-300 px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            >
              <option value="last-7-days">Last 7 days</option>
              <option value="last-30-days">Last 30 days</option>
              <option value="last-3-months">Last 3 months</option>
              <option value="this-year">This year</option>
            </select>
          </div>

          {/* Overdue Settings */}
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-red-500" />
            <select
              value={overdueSettings.gracePeriod}
              onChange={(e) => setOverdueSettings(prev => ({
                ...prev,
                gracePeriod: parseInt(e.target.value),
                overdueDate: new Date(Date.now() + parseInt(e.target.value) * 24 * 60 * 60 * 1000)
              }))}
              className="rounded-lg border-gray-300 px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            >
              <option value={7}>7 days grace</option>
              <option value={15}>15 days grace</option>
              <option value={30}>30 days grace</option>
              <option value={60}>60 days grace</option>
            </select>
          </div>

          {/* Class Filter */}
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="rounded-lg border-gray-300 px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
          >
            <option value="all">All Classes</option>
            {uniqueClasses.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>

          {/* Stream Filter */}
          <select
            value={filterStream}
            onChange={(e) => setFilterStream(e.target.value)}
            className="rounded-lg border-gray-300 px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
          >
            <option value="all">All Streams</option>
            {uniqueStreams.map(stream => (
              <option key={stream} value={stream}>{stream}</option>
            ))}
          </select>

          {/* View Toggles */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'overview' 
                  ? 'bg-white text-purple-700 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="h-4 w-4 inline mr-1" />
              Overview
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'detailed' 
                  ? 'bg-white text-purple-700 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Activity className="h-4 w-4 inline mr-1" />
              Detailed
            </button>
            <button
              onClick={() => setViewMode('trends')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'trends' 
                  ? 'bg-white text-purple-700 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <TrendingUp className="h-4 w-4 inline mr-1" />
              Trends
            </button>
          </div>
        </div>
      </div>

      {/* View Mode Content */}
      {viewMode === 'overview' && (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Payment Rate */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Payment Rate</p>
                  <p className="text-3xl font-bold">{stats.paymentRate.toFixed(1)}%</p>
                  <p className="text-green-100 text-sm">
                    UGX {stats.totalAmountPaid.toLocaleString()} of {stats.totalFeesDemanded.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="h-12 w-12 text-green-200" />
              </div>
            </div>

            {/* Completed Payments */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
      <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Completed</p>
                  <p className="text-3xl font-bold">{stats.completedPayments}</p>
                  <p className="text-blue-100 text-sm">
                    {stats.totalStudents > 0 ? ((stats.completedPayments / stats.totalStudents) * 100).toFixed(1) : 0}% of students
                  </p>
                </div>
                <CheckCircle className="h-12 w-12 text-blue-200" />
              </div>
            </div>

            {/* Pending Payments */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Pending</p>
                  <p className="text-3xl font-bold">{stats.pendingPayments}</p>
                  <p className="text-orange-100 text-sm">
                    {stats.totalStudents > 0 ? ((stats.pendingPayments / stats.totalStudents) * 100).toFixed(1) : 0}% of students
                  </p>
                </div>
                <Clock className="h-12 w-12 text-orange-200" />
              </div>
            </div>

            {/* Overdue Payments */}
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Overdue</p>
                  <p className="text-3xl font-bold">{stats.overduePayments}</p>
                  <p className="text-red-100 text-sm">
                    {stats.totalStudents > 0 ? ((stats.overduePayments / stats.totalStudents) * 100).toFixed(1) : 0}% of students
                  </p>
                </div>
                <XCircle className="h-12 w-12 text-red-200" />
              </div>
            </div>

            {/* Sponsored Children */}
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Sponsored</p>
                  <p className="text-3xl font-bold">{stats.sponsoredStudents}</p>
                  <p className="text-emerald-100 text-sm">
                    UGX {stats.totalSponsoredFees.toLocaleString()}
                  </p>
                </div>
                <Heart className="h-12 w-12 text-emerald-200" />
              </div>
            </div>
          </div>

          {/* Data Visualization Placeholders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Distribution - AI Designed Pie Chart */}
            <div className="bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 backdrop-blur-sm border border-purple-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden">
              {/* AI Design Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-400/20 to-purple-400/20 rounded-full blur-xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                    <PieChart className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Payment Distribution
                    </h3>
                    <p className="text-sm text-gray-600">Status Overview</p>
                  </div>
                </div>
                
                <div className="relative">
                  <ResponsiveContainer width="100%" height={300}>
                    {(() => {
                      const dist = getPaymentDistributionData();
                      const total = dist.reduce((s, d) => s + (Number(d.value) || 0), 0);
                      if (total === 0) {
                        return (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            <div className="text-center">
                              <div className="text-4xl mb-2">📭</div>
                              <div className="text-sm">No payment data yet</div>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <RechartsPieChart>
                      <Pie
                        data={dist}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                            {dist.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: 'none',
                              borderRadius: '12px',
                              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                              backdropFilter: 'blur(10px)'
                            }}
                            formatter={(value: any, name: any) => [
                              `${value} payments`, 
                              name
                            ]}
                          />
                        </RechartsPieChart>
                      );
                    })()}
                </ResponsiveContainer>
                </div>
                
                {/* Summary Stats */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-white/50 rounded-lg backdrop-blur-sm">
                    <div className="text-lg font-bold text-purple-600">
                      {getPaymentDistributionData().reduce((sum, item) => sum + item.value, 0)}
                    </div>
                    <div className="text-xs text-gray-600">Total Payments</div>
                  </div>
                  <div className="text-center p-3 bg-white/50 rounded-lg backdrop-blur-sm">
                    <div className="text-lg font-bold text-pink-600">
                      {getPaymentDistributionData().length}
                    </div>
                    <div className="text-xs text-gray-600">Status Types</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Trends - AI Designed Line Chart */}
            <div className="bg-gradient-to-br from-white via-green-50/30 to-blue-50/30 backdrop-blur-sm border border-green-200/50 rounded-2xl shadow-xl p-6 relative overflow-hidden">
              {/* AI Design Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-400/20 to-green-400/20 rounded-full blur-xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                      Payment Trends
                    </h3>
                    <p className="text-sm text-gray-600">Monthly Overview</p>
                  </div>
                </div>
                
                <div className="relative">
                  <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getPaymentTrendsData()}>
                      <defs>
                        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.3} />
                      <XAxis 
                        dataKey="month" 
                        stroke="#6B7280"
                        fontSize={12}
                        fontWeight={500}
                      />
                      <YAxis 
                        stroke="#6B7280"
                        fontSize={12}
                        fontWeight={500}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                          backdropFilter: 'blur(10px)'
                        }}
                        formatter={(value: any, name: any) => [
                          `UGX ${value.toLocaleString()}`, 
                          'Amount'
                        ]}
                      />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                        stroke="url(#trendGradient)"
                      strokeWidth={3}
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
                        className="drop-shadow-lg"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
                
                {/* Summary Stats */}
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-white/50 rounded-lg backdrop-blur-sm">
                    <div className="text-lg font-bold text-green-600">
                      {getPaymentTrendsData().reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600">Total Amount</div>
                  </div>
                  <div className="text-center p-3 bg-white/50 rounded-lg backdrop-blur-sm">
                    <div className="text-lg font-bold text-blue-600">
                      {getPaymentTrendsData().length}
                    </div>
                    <div className="text-xs text-gray-600">Months</div>
                  </div>
                  <div className="text-center p-3 bg-white/50 rounded-lg backdrop-blur-sm">
                    <div className="text-lg font-bold text-purple-600">
                      {getPaymentTrendsData().length > 0 ? Math.round(getPaymentTrendsData().reduce((sum, item) => sum + item.amount, 0) / getPaymentTrendsData().length).toLocaleString() : 0}
                    </div>
                    <div className="text-xs text-gray-600">Avg/Month</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {viewMode === 'detailed' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Payment Analysis</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900">Payment Methods Breakdown</h4>
                <div className="mt-2 space-y-2">
                  {['mobile-money', 'bank-transfer', 'cash', 'momo', 'airtel-money', 'visa', 'mastercard'].map(method => {
                    const count = financialRecords.filter(r => r.paymentMethod === method).length;
                    const amount = financialRecords.filter(r => r.paymentMethod === method).reduce((sum, r) => sum + r.amount, 0);
                    return count > 0 ? (
                      <div key={method} className="flex justify-between text-sm">
                        <span className="capitalize">{method.replace('-', ' ')}</span>
                        <span className="font-medium">{count} payments • UGX {amount.toLocaleString()}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900">Class Performance</h4>
                <div className="mt-2 space-y-2">
                  {uniqueClasses.map(cls => {
                    const classStudents = students.filter(s => s.class === cls);
                    const classPayments = financialRecords.filter(r => 
                      classStudents.some(s => s.id === r.studentId) && 
                      (r.type === 'payment' || r.type === 'sponsorship') && 
                      r.status === 'paid'
                    );
                    const totalPaid = classPayments.reduce((sum, r) => sum + r.amount, 0);
                    return (
                      <div key={cls} className="flex justify-between text-sm">
                        <span>{cls}</span>
                        <span className="font-medium">UGX {totalPaid.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-medium text-orange-900">Overdue Analysis</h4>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Grace Period</span>
                    <span className="font-medium">{overdueSettings.gracePeriod} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Overdue Date</span>
                    <span className="font-medium">{overdueSettings.overdueDate.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Overdue Records</span>
                    <span className="font-medium">{financialRecords.filter(r => isPaymentOverdue(r)).length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'trends' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Trends & Patterns</h3>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-purple-900">Monthly Payment Trends</h4>
                <div className="mt-4 h-48 bg-gray-50 rounded-lg flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getPaymentTrendsData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`UGX ${value.toLocaleString()}`, 'Amount']} />
                      <Line 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="#8B5CF6" 
                        strokeWidth={3}
                        dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#8B5CF6', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
      </div>

              <div className="bg-indigo-50 p-4 rounded-lg">
                <h4 className="font-medium text-indigo-900">Payment Status Trends</h4>
                <div className="mt-4 h-48 bg-gray-50 rounded-lg flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getPaymentStatusTrendsData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Paid" fill="#10B981" />
                      <Bar dataKey="Pending" fill="#F59E0B" />
                      <Bar dataKey="Overdue" fill="#EF4444" />
                    </BarChart>
                  </ResponsiveContainer>
            </div>
        </div>
      </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-900">Seasonal Payment Patterns</h4>
              <div className="mt-4 h-48 bg-gray-50 rounded-lg flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getSeasonalPatternsData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="season" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`UGX ${value.toLocaleString()}`, 'Amount']} />
                    <Bar dataKey="amount" fill="#F59E0B" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border-gray-300 px-4 py-2 focus:border-purple-500 focus:ring-purple-500"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
            <option value="partial">Partial</option>
          </select>
        </div>
      </div>

      {/* Payment Records Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Payment Records</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billing Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.slice(0, 10).map((record) => {
                const student = students.find(s => s.id === record.studentId);
                if (!student) return null;

                const getStatusColor = (status: string) => {
                  switch (status) {
                    case 'paid': return 'bg-green-100 text-green-800';
                    case 'pending': return 'bg-yellow-100 text-yellow-800';
                    case 'overdue': return 'bg-red-100 text-red-800';
                    case 'partial': return 'bg-blue-100 text-blue-800';
                    default: return 'bg-gray-100 text-gray-800';
                  }
                };

                const getStatusIcon = (status: string) => {
                  switch (status) {
                    case 'paid': return <CheckCircle className="h-4 w-4" />;
                    case 'pending': return <Clock className="h-4 w-4" />;
                    case 'overdue': return <XCircle className="h-4 w-4" />;
                    case 'partial': return <TrendingDown className="h-4 w-4" />;
                    default: return <Clock className="h-4 w-4" />;
                  }
                };

                return (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.accessNumber} • {student.class}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{record.billingType || 'General Fee'}</div>
                      <div className="text-sm text-gray-500">{record.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                          <div className="text-sm text-gray-900">
                          {record.date ? new Date(record.date).toLocaleDateString() : 'N/A'} {record.paymentTime || ''}
                          </div>
                        <div className="text-sm text-gray-500">{record.paymentMethod?.toUpperCase()}</div>
                          </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                      <div className="text-sm font-medium text-gray-900">
                        UGX {record.amount.toLocaleString()}
                      </div>
                      {record.balance > 0 && (
                          <div className="text-sm text-gray-500">
                          Balance: UGX {record.balance.toLocaleString()}
                        </div>
                      )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                        {getStatusIcon(record.status)}
                        <span className="ml-1">{record.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowFinancialStatement(true);
                          }}
                          className="text-green-600 hover:text-green-900 flex items-center"
                        >
                          <Receipt className="h-4 w-4 mr-1" />
                          Statement
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowChildDetails(true);
                          }}
                          className="text-purple-600 hover:text-purple-900 flex items-center"
                        >
                          <Receipt className="h-4 w-4 mr-1" />
                          Details
                      </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredRecords.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Receipt className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No payment records found</p>
          </div>
        )}
      </div>

      {/* Data Visualization Placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Distribution</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <PieChart className="h-16 w-16 mx-auto mb-2 text-gray-300" />
              <p>Payment distribution chart will be displayed here</p>
            </div>
          </div>
        </div>

        {/* Payment Trends */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Trends</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <TrendingUp className="h-16 w-16 mx-auto mb-2 text-gray-300" />
              <p>Payment trends chart will be displayed here</p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Statement Modal */}
      {showFinancialStatement && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Financial Statement</h2>
                <p className="text-gray-600">Comprehensive payment history for {selectedStudent.name}</p>
              </div>
              <button
                onClick={() => setShowFinancialStatement(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>

            {/* Student Information */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-blue-600 text-sm">Student Name</div>
                  <div className="font-bold text-blue-800">{selectedStudent.name}</div>
                </div>
                <div>
                  <div className="text-blue-600 text-sm">Access Number</div>
                  <div className="font-bold text-blue-800">{selectedStudent.accessNumber}</div>
                </div>
                <div>
                  <div className="text-blue-600 text-sm">Class</div>
                  <div className="font-bold text-blue-800">{selectedStudent.class}</div>
                </div>
                <div>
                  <div className="text-blue-600 text-sm">Stream</div>
                  <div className="font-bold text-blue-800">{selectedStudent.stream}</div>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            {(() => {
              const statement = generateFinancialStatement(selectedStudent);
              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h3 className="font-semibold text-green-800 mb-2">Total Fees Required</h3>
                    <div className="text-2xl font-bold text-green-700">UGX {statement.totalFees.toLocaleString()}</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h3 className="font-semibold text-blue-800 mb-2">Total Amount Paid</h3>
                    <div className="text-2xl font-bold text-blue-700">UGX {statement.totalPaid.toLocaleString()}</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <h3 className="font-semibold text-orange-800 mb-2">Outstanding Balance</h3>
                    <div className="text-2xl font-bold text-orange-700">UGX {statement.balance.toLocaleString()}</div>
                  </div>
                </div>
              );
            })()}

            {/* Payment History Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(() => {
                      const statement = generateFinancialStatement(selectedStudent);
                      return statement.paymentHistory.map((record, index) => (
                        <tr key={record.id || index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.date ? new Date(record.date).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {record.description || record.billingType || 'General Payment'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            UGX {record.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.paymentMethod ? record.paymentMethod.replace('-', ' ').toUpperCase() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              record.status === 'paid' ? 'bg-green-100 text-green-800' :
                              record.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              record.status === 'overdue' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {record.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.receiptNumber || 'N/A'}
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
              {(() => {
                const statement = generateFinancialStatement(selectedStudent);
                return statement.paymentHistory.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Receipt className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No payment records found for this student</p>
                  </div>
                );
              })()}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  // Generate PDF or export functionality
                  alert('Export functionality will be implemented here');
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Export PDF
              </button>
              <button
                onClick={() => setShowFinancialStatement(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
                </div>
          </div>
        </div>
      )}

      {/* Child Details Modal - 3 Boxes View */}
      {showChildDetails && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                <h2 className="text-2xl font-bold text-gray-900">Payment Details for {selectedStudent.name}</h2>
                <p className="text-gray-600">View-only payment status and fee structure</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={async () => {
                    // Full refresh: reload fee structure items and re-render panels
                    await forceRefresh();
                  }}
                  className="flex items-center space-x-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors duration-200"
                  title="🔄 Real-time refresh: Fetches latest fee structures, payment data, and billing types from database"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Refresh</span>
                  <Database className="h-2 w-2 opacity-75" />
                </button>
                <button 
                  onClick={() => setShowChildDetails(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Child Information */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-blue-600 text-sm">Student Name</div>
                  <div className="font-bold text-blue-800">{selectedStudent.name}</div>
                </div>
                <div>
                  <div className="text-blue-600 text-sm">Access Number</div>
                  <div className="font-bold text-blue-800">{selectedStudent.accessNumber}</div>
                </div>
                <div>
                  <div className="text-blue-600 text-sm">Class</div>
                  <div className="font-bold text-blue-800">{selectedStudent.class}</div>
                </div>
                {canSeeSponsorshipStatus(user?.role || '') && (
                  <div>
                    <div className="text-blue-600 text-sm">Status</div>
                    <div className="font-bold text-blue-800">
                      {selectedStudent.sponsorshipStatus === 'sponsored' ? (
                        <span className="text-green-600">Sponsored</span>
                      ) : (
                        <span className="text-blue-600">Regular</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sponsorship Information (if sponsored) */}
            {canSeeSponsorshipStatus(user?.role || '') && selectedStudent.sponsorshipStatus === 'sponsored' && (
              <div className="bg-green-50 rounded-lg p-4 mb-6 border border-green-200">
                <h3 className="text-lg font-bold text-green-800 mb-3">🎯 Sponsorship Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-green-600">Sponsorship Status</div>
                    <div className="font-bold text-green-800">Active</div>
                  </div>
                  <div>
                    <div className="text-sm text-green-600">Sponsored Amount</div>
                    <div className="font-bold text-green-800">
                      UGX {selectedStudent.sponsorship?.amount?.toLocaleString() || '0'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-green-600">Sponsor</div>
                    <div className="font-bold text-green-800">
                      {selectedStudent.sponsorship?.sponsorName || 'Not specified'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Three Boxes Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Box 1: Original Fee Structure */}
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h3 className="text-lg font-bold text-purple-800 mb-2">📋 Original Fee Structure</h3>
                <div className="text-sm text-purple-600 mb-4 font-medium">
                  Class: {selectedStudent.class}
                </div>
                <div className="space-y-3">
                  {(() => {
                    const residence: 'Day' | 'Boarding' | undefined = getResidenceFromStudent(selectedStudent);
                    const filteredDisplay = filterFeeItemsByResidence(classFeeItems, residence);
                    // Extra guard: hide any boarding-labelled item for Day students even if it slipped through
                    const itemsForDisplay = (filteredDisplay.items as any[]).filter((fee: any) => {
                      const label = String(fee.feeName || fee.name || '').toLowerCase();
                      return residence === 'Boarding' || !label.includes('board');
                    });
                    return (itemsForDisplay && itemsForDisplay.length > 0) ? (
                      itemsForDisplay.map((fee: any) => (
                      <div key={fee.id} className="bg-white p-3 rounded border border-purple-200">
                        <div className="font-semibold text-sm">{fee.feeName || fee.name}</div>
                        <div className="text-lg font-bold text-purple-700">UGX {Number(fee.amount || 0).toLocaleString()}</div>
                        <div className="text-xs text-gray-600">{fee.frequency} • {fee.term} {fee.year}</div>
                      </div>
                      ))
                    ) : (
                    <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                      <div className="text-yellow-800 font-semibold text-sm">⚠️ No fee structure found</div>
                      <div className="text-yellow-600 text-xs">No fee structure configured for {selectedStudent.class}</div>
                    </div>
                    );
                  })()}
                </div>
                <div className="mt-4 pt-3 border-t border-purple-200">
                  <div className="text-sm text-gray-600">Total Required:</div>
                  <div className="text-xl font-bold text-purple-800">
                    {(() => {
                      const residence: 'Day' | 'Boarding' | undefined = getResidenceFromStudent(selectedStudent);
                      const filteredDisplay = filterFeeItemsByResidence(classFeeItems, residence);
                      return `UGX ${(filteredDisplay.total || 0).toLocaleString()}`;
                    })()}
                  </div>
                </div>
                </div>

              {/* Box 2: Already Paid */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h3 className="text-lg font-bold text-green-800 mb-4">✅ Already Paid</h3>
                <div className="space-y-3">
                  {(() => {
                    // Use ONLY student's fee structure - NO billing types
                    if (selectedStudent.totalFees && selectedStudent.totalFees > 0) {
                      const paidAmount = selectedStudent.feesPaid || 0;
                      const paidPercentage = ((paidAmount / selectedStudent.totalFees) * 100).toFixed(1);
                      
                      return (
                        <div className="bg-white p-3 rounded border border-green-200">
                          <div className="font-semibold text-sm">Total School Fees</div>
                          <div className={`text-lg font-bold ${paidAmount > 0 ? 'text-green-700' : 'text-gray-500'}`}>
                            UGX {paidAmount.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-600">
                            {paidAmount > 0 ? `${paidPercentage}% paid` : 'Not paid'}
                          </div>
                        </div>
                      );
                    }
                    
                    // If no fee structure, show warning
                    return (
                      <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                        <div className="text-yellow-800 font-semibold text-sm">⚠️ No fee structure found</div>
                        <div className="text-yellow-600 text-xs">No fee structure configured for {selectedStudent.class}</div>
                      </div>
                    );
                  })()}
                </div>
                <div className="mt-4 pt-3 border-t border-green-200">
                  <div className="text-sm text-gray-600">Total Paid:</div>
                  <div className="text-xl font-bold text-green-800">
                    UGX {(selectedStudent.feesPaid || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Box 3: Balance Remaining */}
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <h3 className="text-lg font-bold text-orange-800 mb-4">💰 Balance Remaining</h3>
                <div className="space-y-3">
                  {(() => {
                    // Use filtered class fee items/total so Day/Boarding rules apply
                    const residence: 'Day' | 'Boarding' | undefined = getResidenceFromStudent(selectedStudent);
                    const filteredDisplay = filterFeeItemsByResidence(classFeeItems, residence);
                    const totalForCalc = Number(filteredDisplay.total || 0);
                    if (totalForCalc && totalForCalc > 0) {
                      const feesPaid = Number(selectedStudent.feesPaid || 0);
                      const balance = Math.max(0, totalForCalc - feesPaid);
                      const isFullyPaid = balance <= 0;
                      
                      return (
                        <div className="bg-white p-3 rounded border border-orange-200">
                          <div className="font-semibold text-sm">Total School Fees</div>
                          <div className={`text-lg font-bold ${isFullyPaid ? 'text-green-700' : 'text-orange-700'}`}>
                            UGX {balance.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-600">
                            {isFullyPaid ? 'Fully paid' : 'Remaining'}
                          </div>
                          {!isFullyPaid && (
                            <button className="mt-2 w-full bg-orange-600 hover:bg-orange-700 text-white text-xs py-1 px-2 rounded transition-colors">
                              Pay UGX {balance.toLocaleString()}
                            </button>
                          )}
                        </div>
                      );
                    }
                    
                    // If no fee structure, show warning
                    return (
                      <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                        <div className="text-yellow-800 font-semibold text-sm">⚠️ No fee structure found</div>
                        <div className="text-yellow-600 text-xs">No fee structure configured for {selectedStudent.class}</div>
                      </div>
                    );
                  })()}
                </div>
                <div className="mt-4 pt-3 border-t border-orange-200">
                  <div className="text-sm text-gray-600">Total Remaining:</div>
                  <div className="text-xl font-bold text-orange-800">
                    UGX {(selectedStudent.feeBalance || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowChildDetails(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PaymentSystem;