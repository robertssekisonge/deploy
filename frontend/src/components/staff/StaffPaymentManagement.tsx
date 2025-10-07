import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Search,
  Filter,
  TrendingUp
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface Staff {
  id: number;
  name: string;
  role?: string;
  phone?: string;
  email?: string;
  amountToPay?: number;
  contractDurationMonths?: number;
}

interface StaffPayment {
  id: number;
  staffId: number;
  amount: number;
  date: string;
  paymentMethod: string;
  description?: string;
  staff?: Staff;
}

interface StaffPaymentManagementProps {
  readOnly?: boolean;
}

const StaffPaymentManagement: React.FC<StaffPaymentManagementProps> = ({ readOnly = false }) => {
  const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';
  
  // State
  const [staff, setStaff] = useState<Staff[]>([]);
  const [payments, setPayments] = useState<StaffPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentNote, setPaymentNote] = useState<string>('');
  
  // Salary allocation state
  const [salaryAllocations, setSalaryAllocations] = useState<any[]>([]);
  const [selectedAllocation, setSelectedAllocation] = useState<any | null>(null);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const previousSelectedId = selectedAllocation?.id;
      // Load staff
      const staffRes = await fetch(`${API_BASE_URL}/staff`);
      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStaff(Array.isArray(staffData) ? staffData : []);
      }

      // Load payments
      const paymentsRes = await fetch(`${API_BASE_URL}/staff/payments/list`);
      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      }

      // Load salary allocations (primary API)
      let allocationsData: any[] = [];
      try {
        const allocationsRes = await fetch(`${API_BASE_URL}/cfo/salary-allocations`);
        if (allocationsRes.ok) {
          const json = await allocationsRes.json();
          allocationsData = Array.isArray(json) ? json : [];
        }
      } catch (_err) {}

      // Fallback: derive from CFO dashboard data if none returned
      if (!allocationsData || allocationsData.length === 0) {
        try {
          const dashRes = await fetch(`${API_BASE_URL}/cfo/dashboard-data`);
          if (dashRes.ok) {
            const dash = await dashRes.json();
            const all = Array.isArray(dash?.fundAllocations) ? dash.fundAllocations : [];
            const matches = all.filter((a: any) => {
              const f = String(a?.allocatedFor || '').toLowerCase();
              return f.includes('salar') || f.includes('payroll') || f.includes('pay roll') || f.includes('pay') && f.includes('staff');
            });
            allocationsData = matches;
          }
        } catch (_err) {}
      }

      setSalaryAllocations(allocationsData);
      if (allocationsData && allocationsData.length > 0) {
        const reselected = previousSelectedId ? allocationsData.find((a: any) => a.id === previousSelectedId) : null;
        const preferred = reselected || allocationsData.find((a: any) => !a.isDerived) || allocationsData[0];
        setSelectedAllocation(preferred || null);
      } else {
        setSelectedAllocation(null);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique roles
  const roles = Array.from(new Set(staff.map(s => s.role || 'Unassigned'))).sort();

  // Filter staff
  const filteredStaff = staff.filter(s => {
    const roleMatch = !selectedRole || s.role === selectedRole;
    const searchMatch = !searchTerm || 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.phone && s.phone.includes(searchTerm));
    return roleMatch && searchMatch;
  });

  // Calculate totals
  const totalRequired = staff.reduce((sum, s) => sum + (s.amountToPay || 0), 0);
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalRemaining = totalRequired - totalPaid;
  const paidStaffCount = new Set(payments.map(p => p.staffId)).size;
  const totalStaffCount = staff.length;
  const unpaidStaffCount = totalStaffCount - paidStaffCount;

  // Payment status breakdown with thick colors
  const paymentStatusData = [
    { name: 'Paid', value: totalPaid, color: '#10B981' },
    { name: 'Remaining', value: totalRemaining, color: '#F59E0B' }
  ];

  // Staff status breakdown with thick colors
  const staffStatusData = [
    { name: 'Paid', value: paidStaffCount, color: '#10B981' },
    { name: 'Unpaid', value: unpaidStaffCount, color: '#EF4444' }
  ];

  // Monthly payment trend (last 6 months) - generate full 6 months even with no data
  const generateMonthlyData = () => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      months.push(monthKey);
    }
    
    const monthlyPayments = payments.reduce((acc, payment) => {
      const month = new Date(payment.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      acc[month] = (acc[month] || 0) + payment.amount;
      return acc;
    }, {} as Record<string, number>);

    return months.map(month => ({
      month,
      amount: monthlyPayments[month] || 0
    }));
  };

  const monthlyData = generateMonthlyData();

  // Handle payment
  const handlePayment = async () => {
    if (!selectedStaff || !paymentAmount) return;
    
    const amount = Number(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    // Check if we have a selected allocation and sufficient funds
    if (selectedAllocation && amount > selectedAllocation.allocatedAmount) {
      alert(`Insufficient allocated funds. Available: UGX ${selectedAllocation.allocatedAmount.toLocaleString()}`);
      return;
    }

    try {
      // First, deduct from allocation if one is selected and it is not derived from Expenditure
      if (selectedAllocation && !selectedAllocation.isDerived) {
        const deductResponse = await fetch(`${API_BASE_URL}/cfo/salary-allocation/${selectedAllocation.id}/deduct`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount })
        });

        if (!deductResponse.ok) {
          const errorData = await deductResponse.json();
          alert(`Failed to deduct from allocation: ${errorData.error}`);
          return;
        }

        // Optimistically update remaining amount while we reload
        setSelectedAllocation({
          ...selectedAllocation,
          allocatedAmount: Math.max(0, Number(selectedAllocation.allocatedAmount || 0) - amount)
        });
      }

      // Then process the staff payment
      const response = await fetch(`${API_BASE_URL}/staff/${selectedStaff.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          description: paymentNote || `Payment to ${selectedStaff.name}${selectedAllocation ? ` (from allocation: ${selectedAllocation.fundSource}${selectedAllocation.isDerived ? ' - derived' : ''})` : ''}`,
          method: 'cash'
        })
      });

      if (response.ok) {
        setShowPaymentModal(false);
        setPaymentAmount('');
        setPaymentNote('');
        setSelectedStaff(null);
        await loadData(); // Refresh data
        alert('Payment recorded successfully' + (selectedAllocation && !selectedAllocation.isDerived ? ' and deducted from allocation' : ''));
      } else {
        throw new Error('Payment failed');
      }
    } catch (error) {
      alert('Error recording payment');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading staff payment data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Payment Management</h1>
          <p className="text-sm text-gray-600">Manage staff salaries and payments</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-gradient-to-br from-white/90 via-slate-50/30 to-gray-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total Staff</p>
              <p className="text-2xl font-bold text-slate-600">{totalStaffCount}</p>
              <p className="text-xs text-gray-500">staff members</p>
            </div>
            <div className="h-12 w-12 bg-gradient-to-br from-slate-500 to-gray-500 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white/90 via-green-50/30 to-emerald-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total Required</p>
              <p className="text-2xl font-bold text-green-600">UGX {totalRequired.toLocaleString()}</p>
              <p className="text-xs text-gray-500">from all staff</p>
            </div>
            <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white/90 via-blue-50/30 to-indigo-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total Paid</p>
              <p className="text-2xl font-bold text-blue-600">UGX {totalPaid.toLocaleString()}</p>
              <p className="text-xs text-gray-500">{paidStaffCount} staff paid</p>
            </div>
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white/90 via-amber-50/30 to-orange-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Remaining</p>
              <p className="text-2xl font-bold text-amber-600">UGX {totalRemaining.toLocaleString()}</p>
              <p className="text-xs text-gray-500">{unpaidStaffCount} staff unpaid</p>
            </div>
            <div className="h-12 w-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white/90 via-purple-50/30 to-pink-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Payment Rate</p>
              <p className="text-2xl font-bold text-purple-600">
                {totalRequired > 0 ? ((totalPaid / totalRequired) * 100).toFixed(1) : 0}%
              </p>
              <p className="text-xs text-gray-500">of total required</p>
            </div>
            <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Salary Allocation Card */}
      {salaryAllocations.length > 0 && (
        <div className="bg-gradient-to-br from-white/90 via-orange-50/30 to-amber-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Salary Fund Allocation</h3>
                <p className="text-sm text-gray-600">Available allocated funds for staff payments</p>
              </div>
            </div>
            <select
              value={selectedAllocation?.id || ''}
              onChange={(e) => {
                const allocation = salaryAllocations.find(a => a.id === parseInt(e.target.value));
                setSelectedAllocation(allocation || null);
              }}
              disabled={readOnly}
              className={`px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <option value="">Select Allocation</option>
              {salaryAllocations.map((allocation) => (
                <option key={allocation.id} value={allocation.id}>
                  UGX {allocation.allocatedAmount.toLocaleString()} remaining
                </option>
              ))}
            </select>
          </div>
          
          {selectedAllocation && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/50 rounded-lg p-4">
                <div className="text-xs font-medium text-gray-600">Remaining Amount</div>
                <div className="text-sm font-bold text-green-600">UGX {selectedAllocation.allocatedAmount.toLocaleString()}</div>
                {selectedAllocation.isDerived ? (
                  <div className="text-[11px] text-gray-500 mt-1">Derived from expenditure – does not auto-deduct</div>
                ) : null}
              </div>
              <div className="bg-white/50 rounded-lg p-4">
                <div className="text-xs font-medium text-gray-600">Allocated For</div>
                <div className="text-sm font-bold text-blue-600">{selectedAllocation.allocatedFor}</div>
              </div>
            </div>
          )}
          
          {!selectedAllocation && salaryAllocations.length > 0 && (
            <div className="text-center py-4 text-gray-500">
              Select an allocation to view details and use for payments
            </div>
          )}
          
          {salaryAllocations.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No salary allocations available. CFO needs to allocate funds for salaries first.
            </div>
          )}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Status Pie Chart */}
        <div className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Payment Status
              </h3>
              <p className="text-sm text-gray-600">Financial Overview</p>
            </div>
          </div>
          
          <div className="relative">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentStatusData.filter(item => item.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  strokeWidth={2}
                >
                  {paymentStatusData.filter(item => item.value > 0).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      className="drop-shadow-lg"
                    />
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
                    `UGX ${Number(value).toLocaleString()}`, 
                    name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">
                  UGX {totalRequired.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Required</div>
              </div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex justify-center space-x-6 mt-4">
            {paymentStatusData.filter(item => item.value > 0).map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-5 h-5 rounded-full shadow-lg" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm font-black text-gray-800">
                  {item.name} (UGX {item.value.toLocaleString()})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Staff Status Pie Chart */}
        <div className="bg-gradient-to-br from-white via-green-50/30 to-emerald-50/30 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Staff Payment Status
              </h3>
              <p className="text-sm text-gray-600">Staff Overview</p>
            </div>
          </div>
          
          <div className="relative">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={staffStatusData.filter(item => item.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  strokeWidth={2}
                >
                  {staffStatusData.filter(item => item.value > 0).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      className="drop-shadow-lg"
                    />
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
                    `${value} staff`, 
                    name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">
                  {totalStaffCount}
                </div>
                <div className="text-sm text-gray-600">Total Staff</div>
              </div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex justify-center space-x-6 mt-4">
            {staffStatusData.filter(item => item.value > 0).map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-5 h-5 rounded-full shadow-lg" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm font-black text-gray-800">
                  {item.name} ({item.value} staff)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Payment Trend - Area Chart */}
      {monthlyData.length > 0 && (
        <div className="bg-gradient-to-br from-white via-indigo-50/30 to-blue-50/30 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                Monthly Payment Trend
              </h3>
              <p className="text-sm text-gray-600">6-Month Analytics</p>
            </div>
          </div>
          
          <div className="relative">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="paymentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
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
                  formatter={(value: any) => [`UGX ${Number(value).toLocaleString()}`, 'Amount']}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#3B82F6" 
                  strokeWidth={6}
                  fill="url(#paymentGradient)"
                  className="drop-shadow-lg"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Summary Stats */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-white/50 rounded-lg backdrop-blur-sm">
              <div className="text-2xl font-black text-blue-600">
                UGX {totalPaid.toLocaleString()}
              </div>
              <div className="text-sm font-bold text-blue-500">Total Paid</div>
            </div>
            <div className="text-center p-3 bg-white/50 rounded-lg backdrop-blur-sm">
              <div className="text-2xl font-black text-indigo-600">
                UGX {monthlyData.length > 0 ? Math.round(totalPaid / monthlyData.length).toLocaleString() : '0'}
              </div>
              <div className="text-sm font-bold text-indigo-500">Monthly Avg</div>
            </div>
            <div className="text-center p-3 bg-white/50 rounded-lg backdrop-blur-sm">
              <div className="text-2xl font-black text-purple-600">
                UGX {monthlyData.length > 0 ? Math.max(...monthlyData.map(d => d.amount)).toLocaleString() : '0'}
              </div>
              <div className="text-sm font-bold text-purple-500">Best Month</div>
            </div>
          </div>
        </div>
      )}

      {/* Staff List and Payment */}
      <div className="bg-gradient-to-br from-white via-gray-50/30 to-slate-50/30 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Staff Payment</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="border rounded-lg px-3 py-1 text-sm"
              >
                <option value="">All Roles</option>
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border rounded-lg px-3 py-1 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Phone</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">Amount to Pay</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">Paid</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">Remaining</th>
                <th className="text-center px-4 py-3 font-medium text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((s) => {
                const staffPayments = payments.filter(p => p.staffId === s.id);
                const totalPaid = staffPayments.reduce((sum, p) => sum + p.amount, 0);
                const remaining = (s.amountToPay || 0) - totalPaid;
                
                return (
                  <tr key={s.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3">{s.role || '-'}</td>
                    <td className="px-4 py-3">{s.phone || '-'}</td>
                    <td className="px-4 py-3 text-right">UGX {(s.amountToPay || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-green-600">UGX {totalPaid.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-amber-600">UGX {remaining.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      {readOnly ? (
                        <span className="px-3 py-1 bg-gray-300 text-gray-600 rounded text-sm">View Only</span>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedStaff(s);
                            setPaymentAmount(remaining > 0 ? remaining.toString() : '');
                            setShowPaymentModal(true);
                          }}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          disabled={remaining <= 0}
                        >
                          Pay
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedStaff && !readOnly && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Pay {selectedStaff.name}
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-xs text-green-700">Total Required</div>
                  <div className="font-bold text-green-800">
                    UGX {(selectedStaff.amountToPay || 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-xs text-blue-700">Already Paid</div>
                  <div className="font-bold text-blue-800">
                    UGX {payments
                      .filter(p => p.staffId === selectedStaff.id)
                      .reduce((sum, p) => sum + p.amount, 0)
                      .toLocaleString()}
                  </div>
                </div>
                <div className="bg-amber-50 rounded-lg p-3">
                  <div className="text-xs text-amber-700">Remaining</div>
                  <div className="font-bold text-amber-800">
                    UGX {((selectedStaff.amountToPay || 0) - 
                      payments.filter(p => p.staffId === selectedStaff.id)
                        .reduce((sum, p) => sum + p.amount, 0)).toLocaleString()}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Amount (UGX)
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note (optional)
                </label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Payment note"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedStaff(null);
                  setPaymentAmount('');
                  setPaymentNote('');
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffPaymentManagement;
