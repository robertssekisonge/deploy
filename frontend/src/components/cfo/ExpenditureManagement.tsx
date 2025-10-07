import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../common/NotificationProvider';
import CurrencyAmountInput from '../common/CurrencyAmountInput';
import { DEFAULT_CURRENCY, createFinancialRecordData } from '../../utils/currency';

const ExpenditureManagement: React.FC = () => {
  const { user } = useAuth();
  const { showAINotification } = useNotification();
  const [records, setRecords] = useState<any[]>([]);
  const [fundSourceOptions, setFundSourceOptions] = useState<string[]>([]);
  const [availableBySource, setAvailableBySource] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [openSources, setOpenSources] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ expenseType: '', category: '', amount: '', description: '', fundSource: '', receiptNumber: '' });
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formCurrency, setFormCurrency] = useState<string>(DEFAULT_CURRENCY);

  const loadData = async () => {
    try {
      const [dashRes, srcRes] = await Promise.all([
        fetch('/api/cfo/dashboard-data'),
        fetch('/api/cfo/fund-sources')
      ]);
      if (dashRes.ok) {
        const data = await dashRes.json();
        setRecords(data.expenditures || []);

        // compute available amounts by fund source (income minus expenditures)
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
      if (srcRes.ok) {
        const src = await srcRes.json();
        const flattened: string[] = [
          ...(src.schoolFunding || []).map((x: any) => x.source),
          ...(src.foundationFunding || []).map((x: any) => x.source),
          ...(src.farmIncome || []).map((x: any) => x.source),
          ...(src.clinicIncome || []).map((x: any) => x.source)
        ].filter(Boolean);
        const unique = Array.from(new Set(flattened));
        setFundSourceOptions(unique);
      }
    } finally { setLoading(false); }
  };
  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // guard overspending when fund source selected
    if (form.fundSource) {
      const remaining = availableBySource[form.fundSource] ?? 0;
      const ugxAmount = formAmount; // Already converted to UGX
      if (ugxAmount > remaining) {
        showAINotification(`❌ Amount exceeds available balance (UGX ${Math.max(0, remaining).toLocaleString()})`, 5000);
        return;
      }
    }
    
    const recordData = createFinancialRecordData(
      formAmount,
      formCurrency,
      {
        ...form,
        recordedBy: user?.name || 'CFO'
      }
    );
    
    const res = await fetch(editingId ? `/api/cfo/expenditure/${editingId}` : '/api/cfo/expenditure', {
      method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recordData)
    });
    if (res.ok) { 
      showAINotification(editingId ? '✅ Expenditure updated' : '✅ Expenditure recorded', 2000); 
      setShowModal(false); setEditingId(null); setForm({ expenseType: '', category: '', amount: '', description: '', fundSource: '', receiptNumber: '' }); setFormAmount(0); setFormCurrency(DEFAULT_CURRENCY); loadData(); 
    }
    else showAINotification('❌ Save failed', 3000);
  };

  const onEdit = (r: any) => {
    setForm({ expenseType: r.expenseType, category: r.category, amount: String(r.amount), description: r.description || '', fundSource: r.fundSource || '', receiptNumber: r.receiptNumber || '' });
    setEditingId(r.id);
    setShowModal(true);
  };

  const onDelete = async (id: number) => {
    if (!confirm('Delete this record?')) return;
    const res = await fetch(`/api/cfo/expenditure/${id}`, { method: 'DELETE' });
    if (res.ok) { showAINotification('🗑️ Deleted', 1500); loadData(); } else showAINotification('❌ Delete failed', 3000);
  };

  const toggleSource = (source: string) => setOpenSources(prev => { const n = new Set(prev); if (n.has(source)) n.delete(source); else n.add(source); return n; });

  const total = records.reduce((s, r) => s + (r.amount || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 p-6">
      <div className="flex items-center justify-between mb-8 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">Expenditure Management</h1>
          <p className="text-gray-600 mt-2">Manage expenditure records and tracking.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all">Add Expenditure</button>
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
              const key = (r.category || 'Unspecified').trim();
              if (!acc[key]) acc[key] = [];
              acc[key].push(r);
              return acc;
            }, {})).map(([category, items]) => {
              const subtotal = (items as any[]).reduce((s, r: any) => s + (r.amount || 0), 0);
              const isOpen = openSources.has(category);
              return (
                <div key={category} className={`${isOpen ? 'xl:col-span-4 lg:col-span-3 sm:col-span-2 col-span-1' : ''}`}>
                  <div className="bg-white/80 rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                    <button onClick={() => toggleSource(category)} className={`w-full ${isOpen ? 'p-4' : 'p-3'} bg-gradient-to-r from-purple-100 to-indigo-100 flex items-center justify-between transition-all hover:opacity-90 hover:shadow`}>
                      <div className="font-semibold text-gray-900 truncate pr-2">{category}</div>
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
                                  <div className="text-gray-900 font-semibold">{r.expenseType}</div>
                                  <div className="text-xs text-gray-600 mt-1">{new Date(r.date).toLocaleDateString()} — {r.description || 'No description'} {r.fundSource ? `• Fund: ${r.fundSource}` : ''}</div>
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
              <h3 className="text-lg font-bold">Add Expenditure</h3>
              <button onClick={() => setShowModal(false)} className="text-white/90 hover:text-white">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expense Type</label>
                  <select value={form.expenseType} onChange={e => setForm({ ...form, expenseType: e.target.value })} className="w-full rounded-lg border-gray-300 focus:ring-purple-500 focus:border-purple-500 bg-white">
                    <option value="">Select expense type</option>
                    <option>Operations</option>
                    <option>Maintenance</option>
                    <option>Supplies</option>
                    <option>Salaries</option>
                    <option>Utilities</option>
                    <option>Transport</option>
                    <option>Miscellaneous</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border-gray-300 focus:ring-purple-500 focus:border-purple-500 bg-white">
                    <option value="">Select category</option>
                    <option>Administration</option>
                    <option>Academic</option>
                    <option>Payroll</option>
                    <option>Infrastructure</option>
                    <option>Student Welfare</option>
                    <option>Healthcare</option>
                    <option>Farm</option>
                    <option>Other</option>
                  </select>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fund Source (optional)</label>
                  <select value={form.fundSource} onChange={e => setForm({ ...form, fundSource: e.target.value })} className="w-full rounded-lg border-gray-300 focus:ring-purple-500 focus:border-purple-500 bg-white">
                    <option value="">Select fund source</option>
                    {fundSourceOptions.map(src => (
                      <option key={src} value={src}>{src}{availableBySource[src] !== undefined ? ` — Balance: UGX ${Math.max(0, availableBySource[src]).toLocaleString()}` : ''}</option>
                    ))}
                  </select>
                  {(() => {
                    const selected = form.fundSource;
                    if (!selected) return null;
                    const available = Math.max(0, (availableBySource[selected] ?? 0));
                    const requested = Number(form.amount || 0);
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
                              <div className="opacity-95">After this amount</div>
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
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border-gray-300 focus:ring-purple-500 focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Number (optional)</label>
                <input value={form.receiptNumber} onChange={e => setForm({ ...form, receiptNumber: e.target.value })} className="w-full rounded-lg border-gray-300 focus:ring-purple-500 focus:border-purple-500" />
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

export default ExpenditureManagement;


