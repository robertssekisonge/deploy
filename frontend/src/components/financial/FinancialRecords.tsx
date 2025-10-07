import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, FileText, TrendingUp, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import CurrencyAmountInput from '../common/CurrencyAmountInput';
import { DEFAULT_CURRENCY, createFinancialRecordData } from '../../utils/currency';

const FinancialRecords: React.FC = () => {
  const { financialRecords, students, addFinancialRecord } = useData();
  const { user } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formCurrency, setFormCurrency] = useState<string>(DEFAULT_CURRENCY);

  // Filter records for overseer: only sponsored children
  let visibleRecords = financialRecords;
  let visibleStudents = students;
  if (user?.role === 'SPONSORSHIPS-OVERSEER' || user?.role === 'sponsorships-overseer') {
    const sponsoredIds = students.filter(s => s.sponsorshipStatus === 'sponsored').map(s => s.id);
    visibleRecords = financialRecords.filter(r => sponsoredIds.includes(r.studentId));
    visibleStudents = students.filter(s => s.sponsorshipStatus === 'sponsored');
  }

  const filteredRecords = visibleRecords.filter(record => {
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    const matchesType = filterType === 'all' || record.type === filterType;
    return matchesStatus && matchesType;
  });

  const totalPaid = visibleRecords
    .filter(r => r.status === 'paid')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalPending = visibleRecords
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalOverdue = visibleRecords
    .filter(r => r.status === 'overdue')
    .reduce((sum, r) => sum + r.amount, 0);

  const handleAddRecord = (formData: { studentId: string; type: string; amount: string; description: string; date: string; status: string; receiptNumber?: string }) => {
    const recordData = createFinancialRecordData(
      formAmount,
      formCurrency,
      {
        studentId: formData.studentId,
        type: formData.type,
        billingType: formData.type,
        billingAmount: formAmount,
        description: formData.description,
        date: new Date(formData.date),
        status: formData.status,
        receiptNumber: formData.receiptNumber || undefined,
        balance: 0
      }
    );
    
    addFinancialRecord(recordData);
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Records</h1>
          <p className="text-gray-600 mt-1">Comprehensive financial tracking and analysis for all students</p>
        </div>
        {user?.role?.toLowerCase() === 'admin' && (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 shadow-lg"
          >
            <Plus className="h-5 w-5" />
            <span>Add Record</span>
          </button>
        )}
      </div>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Paid */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Paid</p>
              <p className="text-3xl font-bold">UGX {totalPaid.toLocaleString()}</p>
              <p className="text-green-100 text-sm">
                {visibleRecords.length > 0 ? ((visibleRecords.filter(r => r.status === 'paid').length / visibleRecords.length) * 100).toFixed(1) : 0}% of records
              </p>
            </div>
            <TrendingUp className="h-12 w-12 text-green-200" />
          </div>
        </div>

        {/* Total Pending */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Total Pending</p>
              <p className="text-3xl font-bold">UGX {totalPending.toLocaleString()}</p>
              <p className="text-orange-100 text-sm">
                {visibleRecords.length > 0 ? ((visibleRecords.filter(r => r.status === 'pending').length / visibleRecords.length) * 100).toFixed(1) : 0}% of records
              </p>
            </div>
            <Calendar className="h-12 w-12 text-orange-200" />
          </div>
        </div>

        {/* Total Overdue */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Total Overdue</p>
              <p className="text-3xl font-bold">UGX {totalOverdue.toLocaleString()}</p>
              <p className="text-red-100 text-sm">
                {visibleRecords.length > 0 ? ((visibleRecords.filter(r => r.status === 'overdue').length / visibleRecords.length) * 100).toFixed(1) : 0}% of records
              </p>
            </div>
            <FileText className="h-12 w-12 text-red-200" />
          </div>
        </div>

        {/* Total Records */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Total Records</p>
              <p className="text-3xl font-bold">{visibleRecords.length}</p>
              <p className="text-purple-100 text-sm">
                {visibleStudents.length} students
              </p>
            </div>
            <FileText className="h-12 w-12 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="all">All Types</option>
              <option value="fee">School Fees</option>
              <option value="payment">Payments</option>
              <option value="sponsorship">Sponsorship</option>
            </select>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Receipt
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.map((record) => {
                const student = visibleStudents.find(s => s.id === record.studentId);
                return (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {student?.name || 'Unknown Student'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {student?.class} - {student?.stream}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        record.type === 'fee' ? 'bg-blue-100 text-blue-800' :
                        record.type === 'payment' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {record.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      UGX {record.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(record.date, 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        record.status === 'paid' ? 'bg-green-100 text-green-800' :
                        record.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.receiptNumber || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Record Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Add Financial Record</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              handleAddRecord(Object.fromEntries(formData));
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student
                </label>
                <select
                  name="studentId"
                  required
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                >
                  <option value="">Select Student</option>
                  {visibleStudents.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.name} - {student.class}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  name="type"
                  required
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                >
                  <option value="fee">School Fee</option>
                  <option value="payment">Payment</option>
                  <option value="sponsorship">Sponsorship</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  name="description"
                  required
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              
              <CurrencyAmountInput
                amount={formAmount}
                currency={formCurrency}
                onAmountChange={setFormAmount}
                onCurrencyChange={setFormCurrency}
                label="Amount"
                showUGXEquivalent={true}
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  required
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  required
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Receipt Number (optional)
                </label>
                <input
                  type="text"
                  name="receiptNumber"
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialRecords;