import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../common/NotificationProvider';
import { 
  Target, 
  DollarSign, 
  Building2, 
  Banknote, 
  Wheat, 
  Stethoscope,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

interface FundSource {
  source: string;
  category: string;
}

interface FundAllocation {
  id: number;
  fundSource: string;
  allocatedAmount: number;
  allocatedFor: string;
  allocatedTo?: string;
  description: string;
  date: string;
  allocatedBy: string;
  status: string;
}

const FundAllocationManagement: React.FC = () => {
  const { user } = useAuth();
  const { showAINotification } = useNotification();
  const [allocations, setAllocations] = useState<FundAllocation[]>([]);
  const [fundSources, setFundSources] = useState<FundSource[]>([]);
  const [availableBySource, setAvailableBySource] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState<FundAllocation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const [formData, setFormData] = useState({
    fundSource: '',
    allocatedAmount: '',
    allocatedFor: '',
    allocatedTo: '', // New field for user selection
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [allocationsResponse, sourcesResponse, dashboardResponse] = await Promise.all([
        fetch('/api/cfo/fund-allocation'),
        fetch('/api/cfo/fund-sources'),
        fetch('/api/cfo/dashboard-data')
      ]);

      if (allocationsResponse.ok) {
        const allocationsData = await allocationsResponse.json();
        setAllocations(allocationsData);
      }

      if (sourcesResponse.ok) {
        const sourcesData = await sourcesResponse.json();
        const allSources = [
          ...sourcesData.schoolFunding.map((s: any) => ({ ...s, category: 'School Funding' })),
          ...sourcesData.foundationFunding.map((s: any) => ({ ...s, category: 'Foundation Funding' })),
          ...sourcesData.farmIncome.map((s: any) => ({ ...s, category: 'Farm Income' })),
          ...sourcesData.clinicIncome.map((s: any) => ({ ...s, category: 'Clinic Income' }))
        ];
        setFundSources(allSources);
      }

      if (dashboardResponse.ok) {
        const data = await dashboardResponse.json();
        const sumMap: Record<string, number> = {};
        const add = (k?: string, v?: number) => { if (!k) return; sumMap[k] = (sumMap[k] || 0) + Number(v || 0); };
        (data.schoolFunding || []).forEach((r: any) => add(r.fundType, r.amount));
        (data.foundationFunding || []).forEach((r: any) => add(r.fundType, r.amount));
        (data.farmIncome || []).forEach((r: any) => add(r.incomeType, r.amount));
        (data.clinicIncome || []).forEach((r: any) => add(r.incomeType, r.amount));
        const spentMap: Record<string, number> = {};
        (data.expenditures || []).forEach((e: any) => { if (!e.fundSource) return; spentMap[e.fundSource] = (spentMap[e.fundSource] || 0) + Number(e.amount || 0); });
        const all = Array.from(new Set([...Object.keys(sumMap), ...Object.keys(spentMap)]));
        const avail: Record<string, number> = {};
        all.forEach(k => { avail[k] = (sumMap[k] || 0) - (spentMap[k] || 0); });
        setAvailableBySource(avail);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showAINotification('❌ Failed to fetch data', 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/cfo/fund-allocation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          allocatedAmount: parseFloat(formData.allocatedAmount),
          allocatedBy: user?.name || 'Unknown'
        }),
      });

      if (response.ok) {
        showAINotification('✅ Fund allocation created successfully!', 3000);
        setShowModal(false);
        setFormData({ fundSource: '', allocatedAmount: '', allocatedFor: '', allocatedTo: '', description: '' });
        fetchData();
      } else {
        showAINotification('❌ Failed to create fund allocation', 3000);
      }
    } catch (error) {
      console.error('Error creating allocation:', error);
      showAINotification('❌ Error creating fund allocation', 3000);
    }
  };

  const handleEdit = (allocation: FundAllocation) => {
    setEditingAllocation(allocation);
    setFormData({
      fundSource: allocation.fundSource,
      allocatedAmount: allocation.allocatedAmount.toString(),
      allocatedFor: allocation.allocatedFor,
      allocatedTo: allocation.allocatedTo || '',
      description: allocation.description
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this allocation?')) {
      try {
        const response = await fetch(`/api/cfo/fund-allocation/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          showAINotification('✅ Fund allocation deleted successfully!', 3000);
          fetchData();
        } else {
          showAINotification('❌ Failed to delete fund allocation', 3000);
        }
      } catch (error) {
        console.error('Error deleting allocation:', error);
        showAINotification('❌ Error deleting fund allocation', 3000);
      }
    }
  };

  const filteredAllocations = allocations.filter(allocation => {
    const matchesSearch = allocation.allocatedFor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         allocation.fundSource.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         allocation.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterCategory === 'all' || 
                         fundSources.find(s => s.source === allocation.fundSource)?.category === filterCategory;
    
    return matchesSearch && matchesFilter;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'School Funding': return <Building2 className="h-4 w-4" />;
      case 'Foundation Funding': return <Banknote className="h-4 w-4" />;
      case 'Farm Income': return <Wheat className="h-4 w-4" />;
      case 'Clinic Income': return <Stethoscope className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-purple-600 font-medium">Loading fund allocations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">
                Fund Allocation Management
              </h1>
              <p className="text-gray-600 mt-2">Manage fund allocations and track resource distribution</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setFormData({ 
                    fundSource: '', 
                    allocatedAmount: '', 
                    allocatedFor: 'Salaries', 
                    allocatedTo: 'Accountant',
                    description: 'Salary allocation for staff payments' 
                  });
                  setShowModal(true);
                }}
                className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-200 flex items-center space-x-2 shadow-lg"
              >
                <Plus className="h-5 w-5" />
                <span>Quick Salary Allocation</span>
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2 shadow-lg"
              >
                <Plus className="h-5 w-5" />
                <span>New Allocation</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search allocations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="md:w-64">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="School Funding">School Funding</option>
                <option value="Foundation Funding">Foundation Funding</option>
                <option value="Farm Income">Farm Income</option>
                <option value="Clinic Income">Clinic Income</option>
              </select>
            </div>
            <button
              onClick={fetchData}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors duration-200 flex items-center space-x-2"
            >
              <RefreshCw className="h-5 w-5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Allocations grouped by Fund Source */}
        <div className="mb-8">
          {filteredAllocations.length === 0 ? (
            <div className="p-6 text-gray-500">No allocations yet</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Object.entries(filteredAllocations.reduce((acc: Record<string, FundAllocation[]>, a) => {
                const key = a.fundSource;
                if (!acc[key]) acc[key] = [];
                acc[key].push(a);
                return acc;
              }, {})).map(([source, items]) => {
                const subtotal = (items as FundAllocation[]).reduce((s, r) => s + (r.allocatedAmount || 0), 0);
                return (
                  <div key={source} className="bg-white/80 rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                    <div className="p-3 bg-gradient-to-r from-purple-100 to-indigo-100 flex items-center justify-between">
                      <div className="font-semibold text-gray-900 truncate pr-2">{source}</div>
                      <div className="text-indigo-700 font-semibold">UGX {subtotal.toLocaleString()}</div>
                    </div>
                    <div className="p-3 grid grid-cols-1 gap-3">
                      {(items as FundAllocation[]).map((allocation, idx) => (
                        <div key={allocation.id} className="rounded-xl border border-white/40 bg-gradient-to-br from-indigo-50 to-purple-50 p-4 shadow-sm hover:shadow-md transform transition-transform hover:-translate-y-0.5">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-gray-900 font-semibold">{allocation.allocatedFor}</div>
                              <div className="text-xs text-indigo-600 font-medium mt-1">Allocated to: {allocation.allocatedTo || 'Not specified'}</div>
                              <div className="text-xs text-gray-600 mt-1">{new Date(allocation.date).toLocaleDateString()} — {allocation.description || 'No description'}</div>
                            </div>
                            <div className="text-emerald-700 font-semibold">UGX {Number(allocation.allocatedAmount).toLocaleString()}</div>
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <button onClick={() => handleEdit(allocation)} className="px-3 py-1 rounded-md text-white bg-indigo-600 hover:bg-indigo-700">Edit</button>
                            <button onClick={() => handleDelete(allocation.id)} className="px-3 py-1 rounded-md text-white bg-rose-600 hover:bg-rose-700">Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-indigo-900/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-50 rounded-2xl shadow-2xl max-w-2xl w-full mx-4">
              <div className="px-6 py-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-2xl">
                <h2 className="text-lg font-bold">{editingAllocation ? 'Edit Allocation' : 'New Fund Allocation'}</h2>
              </div>
              <div className="p-6">
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fund Source</label>
                  <select
                    value={formData.fundSource}
                    onChange={(e) => setFormData({ ...formData, fundSource: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select fund source</option>
                    {fundSources.map((source, index) => (
                      <option key={index} value={source.source}>
                        {source.source} ({source.category})
                      </option>
                    ))}
                  </select>
                  {(() => {
                    const selected = formData.fundSource;
                    if (!selected) return null;
                    const available = Math.max(0, (availableBySource[selected] ?? 0));
                    const requested = Number(formData.allocatedAmount || 0);
                    const remaining = available - requested;
                    const pct = available === 0 ? 0 : Math.max(0, Math.min(100, Math.round((remaining / available) * 100)));
                    const tone = remaining < 0 ? 'from-rose-500 to-pink-500' : remaining <= available * 0.2 ? 'from-amber-500 to-orange-500' : 'from-emerald-500 to-teal-500';
                    const bar = remaining < 0 ? 0 : pct;
                    return (
                      <div className="mt-2">
                        <div className={`relative overflow-hidden rounded-xl border border-white/40 bg-gradient-to-r ${tone} text-white shadow`}>
                          <div className="px-3 py-2 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/20">💰</span>
                              <div>
                                <div className="text-xs/5 opacity-90">Selected Fund</div>
                                <div className="text-sm font-semibold truncate max-w-[12rem]">{selected}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] uppercase opacity-90">Available</div>
                              <div className="text-sm font-bold">UGX {available.toLocaleString()}</div>
                            </div>
                          </div>
                          <div className="px-3 pb-2">
                            <div className="flex items-center justify-between text-[11px]">
                              <div className="opacity-95">After this allocation</div>
                              <div className="font-semibold">{remaining < 0 ? 'Insufficient' : `UGX ${remaining.toLocaleString()}`}</div>
                            </div>
                            <div className="mt-1 h-1.5 w-full rounded-full bg-white/25">
                              <div className="h-1.5 rounded-full bg-white/90" style={{ width: `${bar}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Allocated Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.allocatedAmount}
                    onChange={(e) => setFormData({ ...formData, allocatedAmount: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Allocate To</label>
                  <select
                    value={formData.allocatedTo}
                    onChange={(e) => setFormData({ ...formData, allocatedTo: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select User/Role</option>
                    <option value="OPM">Operations Manager (OPM)</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Sponsorship Coordinator">Sponsorship Coordinator</option>
                    <option value="HR">Human Resources</option>
                    <option value="Nurse">Nurse</option>
                    <option value="Secretary">Secretary</option>
                    <option value="General Operations">General Operations</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Allocated For</label>
                  <input
                    type="text"
                    value={formData.allocatedFor}
                    onChange={(e) => setFormData({ ...formData, allocatedFor: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., School Infrastructure, Teacher Salaries, Sponsored Children Support"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                    placeholder="Additional details about this allocation"
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingAllocation(null);
                      setFormData({ fundSource: '', allocatedAmount: '', allocatedFor: '', allocatedTo: '', description: '' });
                    }}
                    className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
                  >
                    {editingAllocation ? 'Update' : 'Create'} Allocation
                  </button>
                </div>
              </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FundAllocationManagement;
