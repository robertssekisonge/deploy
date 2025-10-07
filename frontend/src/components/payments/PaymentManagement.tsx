import React, { useState, useEffect } from 'react';
import { buildApiUrl } from '../../utils/api';
import { Student } from '../../types';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../common/NotificationProvider';
import { 
  DollarSign, 
  Search, 
  CreditCard,
  Receipt,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Eye
} from 'lucide-react';

const PaymentManagement: React.FC = () => {
  const { students } = useData();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [studentPaymentData, setStudentPaymentData] = useState<Record<string, any>>({});
  
  // Fetch payment data for all students
  const fetchAllStudentPayments = async () => {
    const paymentData: Record<string, any> = {};
    for (const student of students) {
      try {
        const response = await fetch(buildApiUrl(`payments/summary/${student.id}`));
        if (response.ok) {
          const data = await response.json();
          paymentData[student.id] = data;
        }
      } catch (error) {
        console.error(`Error fetching payment data for student ${student.id}:`, error);
      }
    }
    setStudentPaymentData(paymentData);
  };

  // Load payment data when component mounts or students change
  useEffect(() => {
    if (students.length > 0) {
      fetchAllStudentPayments();
    }
  }, [students]);
  
  // State management
  const [selectedClass, setSelectedClass] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentPaymentSummary, setStudentPaymentSummary] = useState<any | null>(null);
  const [paymentSummaryLoading, setPaymentSummaryLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  // const [filterStatus, setFilterStatus] = useState('all');
  
  // Payment form
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    billingType: '',
    paymentMethod: 'cash',
    paymentReference: '',
    description: ''
  });

  // Get unique classes for filtering
  const uniqueClasses = [...new Set(students.map((s: Student) => s.class))].filter(Boolean) as string[];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // Handle payment processing
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStudent) {
      showError('Error', 'Please select a student');
      return;
    }
    
    try {
      const response = await fetch(buildApiUrl('payments/process'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          amount: parseFloat(paymentForm.amount),
          billingType: paymentForm.billingType,
          paymentMethod: paymentForm.paymentMethod,
          paymentReference: paymentForm.paymentReference,
          description: paymentForm.description,
          processedBy: user?.name || 'Admin'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        showSuccess('Payment Processed', result.message);

        // Immediately refresh summaries so data persists across refresh and UI reflects backend
        try {
          await fetchAllStudentPayments();
          if (selectedStudent?.id) {
            // refresh detailed summary in modal if needed
            const resp = await fetch(`http://localhost:5000/api/payments/summary/${selectedStudent.id}`);
            if (resp.ok) {
              const data = await resp.json();
              setStudentPaymentSummary(data);
            }
          }
        } catch (_ignored) {}

        resetPaymentForm();
        setShowPaymentModal(false);
        setSelectedStudent(null);
      } else {
        throw new Error('Failed to process payment');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      showError('Error', 'Failed to process payment');
    }
  };

  const resetPaymentForm = () => {
    setPaymentForm({
      amount: '',
      billingType: '',
      paymentMethod: 'cash',
      paymentReference: '',
      description: ''
    });
  };

  // Open payment modal for student
  const handleMakePayment = (student: any) => {
    setSelectedStudent(student);
    setShowPaymentModal(true);
  };

  // When Add Payment window opens, fetch student's summary so Original Fees can render
  useEffect(() => {
    const fetchSummary = async () => {
      if (!showPaymentModal || !selectedStudent) return;
      try {
        setPaymentSummaryLoading(true);
        console.log('🔍 Fetching payment summary for student:', selectedStudent.id);
        
        const response = await fetch(buildApiUrl(`payments/summary/${selectedStudent.id}`));
        let data: any = null;
        if (response.ok) {
          data = await response.json();
          console.log('✅ Payment summary received:', data);
        } else {
          console.error('❌ Failed to fetch payment summary:', response.status);
        }

        // The backend should already provide the correct payment breakdown
        // No need for fallback logic since we fixed the backend filtering
        if (data) {
          console.log('🔍 Payment summary data structure:', {
            hasPaymentBreakdown: !!data.paymentBreakdown,
            breakdownLength: data.paymentBreakdown?.length || 0,
            totalFeesRequired: data.totalFeesRequired,
            breakdown: data.paymentBreakdown
          });
          setStudentPaymentSummary(data);
          console.log('✅ Payment summary set:', data);
        } else {
          console.warn('⚠️ No payment data received');
          setStudentPaymentSummary(null);
        }
      } catch (error) {
        console.error('❌ Error fetching payment summary:', error);
        setStudentPaymentSummary(null);
      } finally {
        setPaymentSummaryLoading(false);
      }
    };

    fetchSummary();
  }, [showPaymentModal, selectedStudent]);

  // Get student payment summary and show view modal
  const getStudentPaymentSummary = async (studentId: string | number) => {
    try {
      const response = await fetch(buildApiUrl(`payments/summary/${studentId}`));
      const data: any = await response.json();
      setStudentPaymentSummary(data);
      setShowViewModal(true);
    } catch (error) {
      console.error('Error fetching student payment summary:', error);
      showError('Error', 'Failed to load student payment details');
    }
  };

  // Filter students based on search and filters
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.accessNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === '' || student.class === selectedClass;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-600 mt-1">Process student payments and view payment status</p>
        </div>
      </div>

      {/* Students Payment Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Students Payment Status</h2>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="rounded-lg border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="">All Classes</option>
              {uniqueClasses.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Fees</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student: any) => {
                // Get payment data from API
                const paymentData: any = studentPaymentData[student.id];
                const totalFees = paymentData?.totalFeesRequired || 0;
                const totalPaid = paymentData?.totalPaid || 0;
                const balance = paymentData?.balance || 0;
                const paymentStatus = totalFees === 0 ? 'no-fees' : balance === 0 ? 'paid' : totalPaid > 0 ? 'partial' : 'pending';
                
                const getStatusColor = (status: string) => {
                  switch (status) {
                    case 'paid': return 'bg-green-100 text-green-800';
                    case 'partial': return 'bg-yellow-100 text-yellow-800';
                    case 'pending': return 'bg-red-100 text-red-800';
                    case 'no-fees': return 'bg-gray-100 text-gray-800';
                    default: return 'bg-gray-100 text-gray-800';
                  }
                };

                const getStatusIcon = (status: string) => {
                  switch (status) {
                    case 'paid': return <CheckCircle className="h-4 w-4" />;
                    case 'partial': return <Clock className="h-4 w-4" />;
                    case 'pending': return <XCircle className="h-4 w-4" />;
                    case 'no-fees': return <AlertCircle className="h-4 w-4" />;
                    default: return <AlertCircle className="h-4 w-4" />;
                  }
                };

                return (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.accessNumber}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.class}</div>
                      <div className="text-sm text-gray-500">{student.stream}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        UGX {totalFees.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        UGX {totalPaid.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${balance === 0 ? 'text-green-600' : 'text-red-600'}`}>
                        UGX {balance.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(paymentStatus)}`}>
                        {getStatusIcon(paymentStatus)}
                        <span className="ml-1">{paymentStatus}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleMakePayment(student)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Pay
                        </button>
                        <button
                          onClick={() => getStudentPaymentSummary(student.id)}
                          className="text-green-600 hover:text-green-900 flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Payment for {selectedStudent.name}</h2>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedStudent(null);
                  resetPaymentForm();
                }}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>

            {/* Student Info Banner */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-blue-600 text-sm">Student</div>
                  <div className="font-bold text-blue-800">{selectedStudent.name}</div>
                </div>
                <div>
                  <div className="text-blue-600 text-sm">Class</div>
                  <div className="font-bold text-blue-800">{selectedStudent.class}</div>
                </div>
                <div>
                  <div className="text-blue-600 text-sm">Parent</div>
                  <div className="font-bold text-blue-800">{(selectedStudent as any)?.parentName || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Three Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Original Fees Column */}
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center">
                  <Receipt className="h-5 w-5 mr-2" />
                  Original Fees
                </h3>
                <div className="space-y-2">
                  {paymentSummaryLoading && (
                    <div className="text-sm text-purple-700">Loading fee structure...</div>
                  )}
                  {console.log('🔍 Debug payment summary:', studentPaymentSummary)}
                  {!paymentSummaryLoading && studentPaymentSummary?.paymentBreakdown?.length > 0 && (
                    studentPaymentSummary.paymentBreakdown.map((pb: any) => (
                      <div key={pb.billingType} className="bg-white p-2 rounded border border-purple-200">
                        <div className="font-semibold text-sm">{pb.billingType}</div>
                        <div className="text-base font-bold text-purple-700">UGX {pb.required.toLocaleString()}</div>
                        <div className="text-xs text-gray-600">{pb.frequency} • {pb.term} {pb.year}</div>
                      </div>
                    ))
                  )}
                  {!paymentSummaryLoading && (!studentPaymentSummary || !studentPaymentSummary.paymentBreakdown || studentPaymentSummary.paymentBreakdown.length === 0) && (
                    <div className="text-sm text-purple-700">No fee structure found for this student/class.</div>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-purple-200">
                  <div className="text-sm text-gray-600">Total Required:</div>
                  <div className="text-xl font-bold text-purple-800">
                    UGX {studentPaymentSummary?.totalFeesRequired?.toLocaleString() || '0'}
                  </div>
                </div>
              </div>

              {/* Already Paid Column */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Already Paid
                </h3>
                <div className="space-y-2">
                  {studentPaymentSummary?.paymentBreakdown?.filter((pb: any) => pb.paid > 0).map((pb: any) => (
                    <div key={pb.billingType} className="bg-white p-2 rounded border border-green-200">
                      <div className="font-semibold text-sm">{pb.billingType}</div>
                      <div className="text-base font-bold text-green-700">UGX {pb.paid.toLocaleString()}</div>
                      <div className="text-xs text-gray-600">Paid</div>
                    </div>
                  ))}
                  {(!studentPaymentSummary?.paymentBreakdown?.some((pb: any) => pb.paid > 0)) && (
                    <div className="text-center py-4 text-gray-500">
                      <div className="text-sm">No payments made yet</div>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-green-200">
                  <div className="text-sm text-gray-600">Total Paid:</div>
                  <div className="text-xl font-bold text-green-800">
                    UGX {studentPaymentSummary?.totalPaid?.toLocaleString() || '0'}
                  </div>
                </div>
              </div>

              {/* Balance Remaining Column */}
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <h3 className="text-lg font-bold text-orange-800 mb-4 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Balance Remaining
                </h3>
                <div className="space-y-2">
                  {studentPaymentSummary?.paymentBreakdown?.map((pb: any) => (
                    <div key={pb.billingType} className="bg-white p-2 rounded border border-orange-200">
                      <div className="font-semibold text-sm">{pb.billingType}</div>
                      <div className="text-base font-bold text-orange-700">UGX {pb.remaining.toLocaleString()}</div>
                      <div className="text-xs text-gray-600">Remaining</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-orange-200">
                  <div className="text-sm text-gray-600">Total Remaining:</div>
                  <div className="text-xl font-bold text-orange-800">
                    UGX {studentPaymentSummary?.balance?.toLocaleString() || '0'}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* View Payment Details Modal */}
      {showViewModal && studentPaymentSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Payment Details</h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setStudentPaymentSummary(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>

            {/* Student Info */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-blue-600 text-sm">Student Name</div>
                  <div className="font-bold text-blue-800">{studentPaymentSummary.student?.name}</div>
                </div>
                <div>
                  <div className="text-blue-600 text-sm">Access Number</div>
                  <div className="font-bold text-blue-800">{studentPaymentSummary.student?.accessNumber}</div>
                </div>
                <div>
                  <div className="text-blue-600 text-sm">Class</div>
                  <div className="font-bold text-blue-800">{studentPaymentSummary.student?.class}</div>
                </div>
                <div>
                  <div className="text-blue-600 text-sm">Stream</div>
                  <div className="font-bold text-blue-800">{studentPaymentSummary.student?.stream}</div>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="text-green-600 text-sm font-medium">Total Fees Required</div>
                <div className="text-2xl font-bold text-green-800">
                  UGX {studentPaymentSummary.totalFees?.toLocaleString() || '0'}
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="text-blue-600 text-sm font-medium">Total Paid</div>
                <div className="text-2xl font-bold text-blue-800">
                  UGX {studentPaymentSummary.totalPaid?.toLocaleString() || '0'}
                </div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="text-red-600 text-sm font-medium">Outstanding Balance</div>
                <div className="text-2xl font-bold text-red-800">
                  UGX {studentPaymentSummary.balance?.toLocaleString() || '0'}
                </div>
              </div>
            </div>

            {/* Payment History */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
              {studentPaymentSummary.payments && studentPaymentSummary.payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {studentPaymentSummary.payments.map((payment: any, index: number) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.date ? new Date(payment.date).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            UGX {payment.amount?.toLocaleString() || '0'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.paymentMethod || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.paymentReference || payment.receiptNumber || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              payment.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {payment.status || 'pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No payment records found for this student.</p>
                </div>
              )}
            </div>

            {/* Close Button */}
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setStudentPaymentSummary(null);
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
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

export default PaymentManagement;
