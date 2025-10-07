import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../common/NotificationProvider';
import CurrencyAmountInput from '../common/CurrencyAmountInput';
import { DEFAULT_CURRENCY, createFinancialRecordData } from '../../utils/currency';

const FarmIncomeManagement: React.FC = () => {
  const { user } = useAuth();
  const { showAINotification } = useNotification();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [openSources, setOpenSources] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ incomeType: '', source: '', amount: '', description: '', date: new Date().toISOString().slice(0,10) });
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formCurrency, setFormCurrency] = useState<string>(DEFAULT_CURRENCY);

  const loadData = async () => {
    try {
      const res = await fetch('/api/cfo/dashboard-data');
      if (res.ok) {
        const data = await res.json();
        setRecords(data.farmIncome || []);
      }
    } finally { setLoading(false); }
  };
  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const recordData = createFinancialRecordData(
      formAmount,
      formCurrency,
      {
        ...form,
        recordedBy: user?.name || 'CFO'
      }
    );
    
    const res = await fetch(editingId ? `/api/cfo/farm-income/${editingId}` : '/api/cfo/farm-income', {
      method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recordData)
    });
    if (res.ok) { 
      showAINotification(editingId ? '✅ Income updated' : '✅ Farm income recorded', 2000); 
      setShowModal(false); setEditingId(null);
      setForm({ incomeType: '', source: '', amount: '', description: '', date: new Date().toISOString().slice(0,10) });
      setFormAmount(0);
      setFormCurrency(DEFAULT_CURRENCY); 
      loadData(); 
    }
    else showAINotification('❌ Save failed', 3000);
  };

  const onEdit = (r: any) => {
    setForm({ incomeType: r.incomeType, source: r.source, amount: String(r.amount), description: r.description || '', date: String(r.date).slice(0,10) });
    setEditingId(r.id);
    setShowModal(true);
  };

  const onDelete = async (id: number) => {
    if (!confirm('Delete this record?')) return;
    const res = await fetch(`/api/cfo/farm-income/${id}`, { method: 'DELETE' });
    if (res.ok) { showAINotification('🗑️ Deleted', 1500); loadData(); } else showAINotification('❌ Delete failed', 3000);
  };

  const toggleSource = (source: string) => setOpenSources(prev => { const n = new Set(prev); if (n.has(source)) n.delete(source); else n.add(source); return n; });

  const total = records.reduce((s, r) => s + (r.amount || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 p-6">
      <div className="flex items-center justify-between mb-8 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">Farm Income Management</h1>
          <p className="text-gray-600 mt-2">Record and manage farm income.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all">Add Income</button>
      </div>
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Records</h2>
          <div className="text-sm text-gray-700 font-medium">Total: UGX {total.toLocaleString()}</div>
        </div>
        {loading ? (
          <div className="p-6 text-gray-500">Loading...</div>
        ) : records.length === 0 ? (
          <div className="p-6 text-gray-500">No records yet</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Object.entries(records.reduce((acc: Record<string, any[]>, r: any) => {
              const key = (r.source || 'Unspecified').trim();
              if (!acc[key]) acc[key] = [];
              acc[key].push(r);
              return acc;
            }, {})).map(([source, items]) => {
              const subtotal = (items as any[]).reduce((s, r: any) => s + (r.amount || 0), 0);
              const isOpen = openSources.has(source);
              return (
                <div key={source} className={`${isOpen ? 'xl:col-span-4 lg:col-span-3 sm:col-span-2 col-span-1' : ''}`}>
                  <div className="bg-white/80 rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                    <button onClick={() => toggleSource(source)} className={`w-full ${isOpen ? 'p-4' : 'p-3'} bg-gradient-to-r from-purple-100 to-indigo-100 flex items-center justify-between transition-all hover:opacity-90 hover:shadow`}>
                      <div className="font-semibold text-gray-900 truncate pr-2">{source}</div>
                      <div className="flex items-center gap-3">
                        <div className="text-indigo-700 font-semibold">UGX {subtotal.toLocaleString()}</div>
                        <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</span>
                      </div>
                    </button>
                    {isOpen && (
                      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(items as any[]).map((r: any, idx: number) => {
                          const gradients = ['from-indigo-50 to-purple-50','from-blue-50 to-cyan-50','from-emerald-50 to-teal-50','from-amber-50 to-orange-50','from-rose-50 to-pink-50','from-fuchsia-50 to-violet-50'];
                          const accent = ['text-indigo-700','text-blue-700','text-emerald-700','text-amber-700','text-rose-700','text-fuchsia-700'];
                          const eb = ['bg-indigo-600 hover:bg-indigo-700','bg-blue-600 hover:bg-blue-700','bg-emerald-600 hover:bg-emerald-700','bg-amber-600 hover:bg-amber-700','bg-rose-600 hover:bg-rose-700','bg-fuchsia-600 hover:bg-fuchsia-700'];
                          const db = ['bg-rose-600 hover:bg-rose-700','bg-red-600 hover:bg-red-700','bg-orange-600 hover:bg-orange-700','bg-pink-600 hover:bg-pink-700','bg-violet-600 hover:bg-violet-700','bg-purple-600 hover:bg-purple-700'];
                          const g = gradients[idx % gradients.length];
                          return (
                            <div key={r.id} className={`rounded-xl border border-white/40 bg-gradient-to-br ${g} p-4 shadow-sm hover:shadow-md transform transition-transform hover:-translate-y-0.5`}>
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="text-gray-900 font-semibold">{r.incomeType}</div>
                                  <div className="text-xs text-gray-600 mt-1">{new Date(r.date).toLocaleDateString()} — {r.description || 'No description'}</div>
                                </div>
                                <div className={`${accent[idx % accent.length]} font-semibold`}>UGX {Number(r.amount).toLocaleString()}</div>
                              </div>
                              <div className="mt-3 flex items-center gap-2">
                                <button onClick={() => onEdit(r)} className={`px-3 py-1 rounded-md text-white ${eb[idx % eb.length]}`}>Edit</button>
                                <button onClick={() => onDelete(r.id)} className={`px-3 py-1 rounded-md text-white ${db[idx % db.length]}`}>Delete</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-indigo-900/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/80 backdrop-blur-md border border-white/30 rounded-2xl w-full max-w-2xl shadow-2xl">
            <div className="px-6 py-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-2xl flex items-center justify-between">
              <h3 className="text-lg font-bold">Add Farm Income</h3>
              <button onClick={() => setShowModal(false)} className="text-white/90 hover:text-white">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                  <input value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} className="w-full rounded-lg border-gray-300 focus:ring-purple-500 focus:border-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Income Type</label>
                  <input value={form.incomeType} onChange={e => setForm({ ...form, incomeType: e.target.value })} className="w-full rounded-lg border-gray-300 focus:ring-purple-500 focus:border-purple-500" />
                </div>
                <div className="md:col-span-2">
                  <CurrencyAmountInput
                    amount={formAmount}
                    currency={formCurrency}
                    onAmountChange={setFormAmount}
                    onCurrencyChange={setFormCurrency}
                    label="Amount"
                    showUGXEquivalent={true}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full rounded-lg border-gray-300 focus:ring-purple-500 focus:border-purple-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description/Notes</label>
                <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border-gray-300 focus:ring-purple-500 focus:border-purple-500" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmIncomeManagement;


