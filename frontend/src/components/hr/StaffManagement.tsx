import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Users, X } from 'lucide-react';

interface Staff {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  role?: string;
  dateOfBirth?: string;
  village?: string;
  nextOfKin?: string;
  nextOfKinPhone?: string;
  medicalIssues?: string;
  contractDurationMonths?: number;
  amountToPay?: number;
  hrNotes?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankBranch?: string;
  mobileMoneyNumber?: string;
  mobileMoneyProvider?: string;
  nationalId?: string;
  notes?: string;
  cvFileName?: string;
  passportPhotoFileName?: string;
}

// Inline component to preview and download staff CV
const CVPreview: React.FC<{ staffId: number; apiBase: string }> = ({ staffId, apiBase }) => {
  const [dataUri, setDataUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await fetch(`${apiBase}/staff/${staffId}/cv-base64`);
        if (!r.ok) throw new Error('Failed to load CV');
        const j = await r.json();
        setDataUri(j?.fileData || null);
      } catch (e: any) {
        setError(e.message || 'Failed to load CV');
      } finally {
        setLoading(false);
      }
    })();
  }, [staffId, apiBase]);

  if (loading) return <div className="text-xs text-gray-500">Loading CV…</div>;
  if (error) return <div className="text-xs text-rose-600">{error}</div>;
  if (!dataUri) {
    return (
      <div className="text-xs text-gray-500">
        No CV attached.
        <a className="ml-2 text-blue-600 hover:underline" href={`${apiBase}/staff/${staffId}/cv-download`} target="_blank" rel="noreferrer">Download (if available)</a>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="h-60 border rounded overflow-hidden bg-gray-50">
        <iframe title="cv" src={dataUri} className="w-full h-full" />
      </div>
      <div className="text-xs">
        <a className="text-blue-600 hover:underline" href={dataUri} download={`cv_${staffId}.pdf`}>Download PDF</a>
        <a className="ml-3 text-blue-600 hover:underline" href={`${apiBase}/staff/${staffId}/cv-download`} target="_blank" rel="noreferrer">Server download</a>
      </div>
    </div>
  );
};

const StaffManagement: React.FC = () => {
  const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const [detailsPhoto, setDetailsPhoto] = useState<string | null>(null);
  const [items, setItems] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<any>({ name: '', role: '', dateOfBirth: '', amountToPay: '' });
  const [passportPreview, setPassportPreview] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [customRole, setCustomRole] = useState('');
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [addingRole, setAddingRole] = useState(false);
  const [addRoleError, setAddRoleError] = useState<string | null>(null);

  // Group staff by role for role-based cards
  const staffByRole = useMemo(() => {
    const groups: Record<string, Staff[]> = {};
    for (const s of items) {
      const key = (s.role || 'Unassigned').trim();
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    }
    // Sort each group by name for consistent display
    Object.keys(groups).forEach(k => groups[k].sort((a, b) => (a.name || '').localeCompare(b.name || '')));
    return groups;
  }, [items]);

  const [openRoles, setOpenRoles] = useState<Set<string>>(new Set());
  const toggleRole = (role: string) => {
    setOpenRoles(prev => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role); else next.add(role);
      return next;
    });
  };

  // Tap-to-expand per staff card
  const [expandedStaffIds, setExpandedStaffIds] = useState<Set<number>>(new Set());
  const toggleStaffCard = (id: number) => {
    setExpandedStaffIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Dedicated modal for staff details
  const [detailsStaff, setDetailsStaff] = useState<Staff | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/staff`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError('Failed to load staff');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/staff-roles`);
        if (!res.ok) throw new Error('Failed to load roles');
        const data = await res.json();
        setRoles(Array.isArray(data) ? data : []);
      } catch {}
    })();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const isEditing = editingId !== null;
      const url = isEditing ? `${API_BASE_URL}/staff/${editingId}` : `${API_BASE_URL}/staff`;
      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Create failed');
      setForm({ name: '' });
      setEditingId(null);
      await load();
    } catch (e: any) {
      setError(e.message || 'Create failed');
    }
  }

  async function startEdit(s: Staff) {
    // Fetch full record to ensure all fields are present
    let full: Staff = s;
    try {
      const r = await fetch(`${API_BASE_URL}/staff/${s.id}`);
      if (r.ok) full = await r.json();
    } catch {}
    setForm({
      name: full.name || '',
      phone: full.phone || '',
      email: full.email || '',
      role: full.role || '',
      dateOfBirth: full.dateOfBirth || '',
      amountToPay: full.amountToPay ?? '',
      nationalId: full.nationalId || '',
      village: full.village || '',
      nextOfKin: full.nextOfKin || '',
      nextOfKinPhone: full.nextOfKinPhone || '',
      medicalIssues: full.medicalIssues || '',
      contractDurationMonths: full.contractDurationMonths,
      hrNotes: full.hrNotes || '',
      bankAccountName: full.bankAccountName || '',
      bankAccountNumber: full.bankAccountNumber || '',
      bankName: full.bankName || '',
      bankBranch: full.bankBranch || '',
      mobileMoneyNumber: full.mobileMoneyNumber || '',
      mobileMoneyProvider: full.mobileMoneyProvider || '',
      notes: full.notes || ''
    } as any);
    setEditingId(full.id);
    setShowForm(true);
    // Load existing passport preview so user doesn't have to re-upload
    setPassportPreview(null);
    (async () => {
      try {
        const r = await fetch(`${API_BASE_URL}/staff/${full.id}/passport-base64`);
        if (r.ok) {
          const j = await r.json();
          if (j && j.fileData) {
            setPassportPreview(j.fileData);
          }
        }
      } catch {}
    })();
  }

  async function handleDelete(id: number) {
    const ok = window.confirm('Delete this staff record? This cannot be undone.');
    if (!ok) return;
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/staff/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await load();
    } catch (e: any) {
      setError(e.message || 'Delete failed');
    }
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
            HR Portal - Staff Management
          </h1>
          <p className="text-sm text-gray-600">Manage staff records and details.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow hover:from-indigo-700 hover:to-purple-700 transition-all">
          Add Staff
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-3">
          <div className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 backdrop-blur-xl rounded-xl p-4 max-w-lg w-full mx-3 max-h-[85vh] overflow-y-auto shadow-2xl border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3 relative">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl shadow-lg">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">{editingId ? 'Edit Staff' : 'Add Staff'}</h2>
                {/* Always-visible rotating accent */}
                <div className="absolute -left-4 -top-3 h-4 w-4 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 opacity-70 spin-slow"></div>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-rose-100 rounded-xl transition-all duration-200 group">
                <X className="h-5 w-5 text-gray-500 group-hover:text-red-500" />
              </button>
            </div>

            <form onSubmit={(e)=>{handleCreate(e); if(!error){ setShowForm(false); setPassportPreview(null); }}} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input className="border rounded px-3 py-1.5 text-sm" placeholder="Full name" value={form.name || ''} onChange={e => setForm((s: any) => ({ ...s, name: e.target.value }))} required />
                <input className="border rounded px-3 py-1.5 text-sm" placeholder="Phone" value={form.phone || ''} onChange={e => setForm((s: any) => ({ ...s, phone: e.target.value }))} />
                <input className="border rounded px-3 py-1.5 text-sm" placeholder="Email" value={form.email || ''} onChange={e => setForm((s: any) => ({ ...s, email: e.target.value }))} />
                <input className="border rounded px-3 py-1.5 text-sm" placeholder="Amount to pay (UGX)" type="number" min={0} step="0.01" value={form.amountToPay} onChange={e => setForm((s:any)=>({...s, amountToPay: e.target.value }))} />
              <input className="border rounded px-3 py-1.5 text-sm uppercase" maxLength={14} placeholder="National ID Number (14 chars)" value={(form.nationalId || '').toUpperCase()} onChange={e => {
                const v = (e.target.value || '').toUpperCase().slice(0,14);
                setForm((s:any)=>({...s, nationalId: v }));
              }} />

                <div className="flex gap-2">
                  <select className="border rounded px-3 py-1.5 text-sm w-full" value={form.role || ''} onChange={e => setForm((s:any)=>({...s, role: e.target.value}))}>
                    <option value="">Select role</option>
                    {roles.map(r => (<option key={r.id} value={r.name}>{r.name}</option>))}
                  </select>
                  <input className="border rounded px-3 py-1.5 text-sm w-full" placeholder="Add new role (e.g., Cleaner, Cook)" value={newRoleName} onChange={e=>setNewRoleName(e.target.value)} />
                  <button type="button" disabled={addingRole} onClick={async ()=>{
                    const name = newRoleName.trim();
                    if(!name) return;
                    setAddRoleError(null);
                    setAddingRole(true);
                    try{
                      const res = await fetch(`${API_BASE_URL}/staff-roles`,{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name })});
                      if(res.status === 201){
                        const created = await res.json();
                        setRoles(prev=>[...prev, created].sort((a,b)=>a.name.localeCompare(b.name)));
                        setForm((s:any)=>({...s, role: created.name}));
                        setNewRoleName('');
                      } else if (res.status === 409) {
                        // role exists: select it and refresh list
                        setForm((s:any)=>({...s, role: name }));
                        const r = await fetch(`${API_BASE_URL}/staff-roles`);
                        if(r.ok){ const list = await r.json(); setRoles(list); }
                      } else {
                        const msg = await res.text();
                        throw new Error(msg || 'Failed to add role');
                      }
                    }catch(err){
                      setAddRoleError('Could not add role. Check backend and DB migration.');
                      try{ const r = await fetch(`${API_BASE_URL}/staff-roles`); if(r.ok){ const list = await r.json(); setRoles(list);} }catch{}
                    } finally {
                      setAddingRole(false);
                    }
                  }} className={`px-2.5 py-1.5 text-sm text-white rounded ${addingRole ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600'}`}>{addingRole ? 'Adding...' : 'Add'}</button>
                </div>
                {addRoleError && <div className="text-red-600 text-sm">{addRoleError}</div>}

                <input className="border rounded px-3 py-1.5 text-sm" type="date" placeholder="Date of Birth" value={form.dateOfBirth || ''} onChange={e => setForm((s:any)=>({...s, dateOfBirth: e.target.value}))} />
                <input className="border rounded px-3 py-1.5 text-sm" placeholder="Village" value={form.village || ''} onChange={e => setForm((s:any)=>({...s, village: e.target.value}))} />
                <input className="border rounded px-3 py-1.5 text-sm" placeholder="Next of kin" value={form.nextOfKin || ''} onChange={e => setForm((s:any)=>({...s, nextOfKin: e.target.value}))} />
                <input className="border rounded px-3 py-1.5 text-sm" placeholder="Next of kin phone" value={form.nextOfKinPhone || ''} onChange={e => setForm((s:any)=>({...s, nextOfKinPhone: e.target.value}))} />
                <input className="border rounded px-3 py-1.5 text-sm" placeholder="Contract duration (months)" type="number" min={1} value={form.contractDurationMonths || ''} onChange={e => setForm((s:any)=>({...s, contractDurationMonths: Number(e.target.value) || undefined}))} />
              </div>

              <textarea className="border rounded px-3 py-1.5 text-sm w-full" placeholder="Medical issues" value={form.medicalIssues || ''} onChange={e => setForm((s:any)=>({...s, medicalIssues: e.target.value}))}></textarea>
              <textarea className="border rounded px-3 py-1.5 text-sm w-full" placeholder="HR notes" value={form.hrNotes || ''} onChange={e => setForm((s:any)=>({...s, hrNotes: e.target.value}))}></textarea>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input className="border rounded px-3 py-1.5 text-sm" placeholder="Bank Account Name" value={form.bankAccountName || ''} onChange={e => setForm((s: any) => ({ ...s, bankAccountName: e.target.value }))} />
                <input className="border rounded px-3 py-1.5 text-sm" placeholder="Bank Account Number" value={form.bankAccountNumber || ''} onChange={e => setForm((s: any) => ({ ...s, bankAccountNumber: e.target.value }))} />
                <input className="border rounded px-3 py-1.5 text-sm" placeholder="Bank Name" value={form.bankName || ''} onChange={e => setForm((s: any) => ({ ...s, bankName: e.target.value }))} />
                <input className="border rounded px-3 py-1.5 text-sm" placeholder="Bank Branch" value={form.bankBranch || ''} onChange={e => setForm((s: any) => ({ ...s, bankBranch: e.target.value }))} />
                <input className="border rounded px-3 py-1.5 text-sm" placeholder="Mobile Money Number" value={form.mobileMoneyNumber || ''} onChange={e => setForm((s: any) => ({ ...s, mobileMoneyNumber: e.target.value }))} />
                <input className="border rounded px-3 py-1.5 text-sm" placeholder="Mobile Money Provider" value={form.mobileMoneyProvider || ''} onChange={e => setForm((s: any) => ({ ...s, mobileMoneyProvider: e.target.value }))} />
              </div>

              {/* Passport photo uploader (base64 inline with request) */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-800">Passport Photo (staff)</div>
                {passportPreview ? (
                  <div className="flex items-center gap-3">
                    <img src={passportPreview} alt="Passport preview" className="h-16 w-16 rounded object-cover border" />
                    <button type="button" onClick={() => setPassportPreview(null)} className="px-2 py-1 text-xs rounded bg-rose-50 hover:bg-rose-100 border text-rose-600">Remove</button>
                  </div>
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    className="text-sm"
                    onChange={(e)=>{
                      const file = e.target.files?.[0];
                      if(!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev)=>{
                        const result = ev.target?.result as string;
                        setPassportPreview(result);
                        setForm((s:any)=>({
                          ...s,
                          passportPhoto: { fileData: result, fileType: file.type }
                        }));
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                )}
              </div>

              {/* CV uploader (PDF, base64 inline with request) */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-800">Curriculum Vitae (PDF)</div>
                <input
                  type="file"
                  accept="application/pdf"
                  className="text-sm"
                  onChange={(e)=>{
                    const file = e.target.files?.[0];
                    if(!file) return;
                    if(file.type !== 'application/pdf'){
                      alert('Please upload a PDF file.');
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = (ev)=>{
                      const result = ev.target?.result as string;
                      setForm((s:any)=>({
                        ...s,
                        cvFile: { fileData: result, fileType: file.type }
                      }));
                    };
                    reader.readAsDataURL(file);
                  }}
                />
                {form?.cvFile?.fileData && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="px-2 py-1 rounded bg-gray-100 border">PDF attached</span>
                    <button type="button" onClick={()=> setForm((s:any)=> ({ ...s, cvFile: undefined }))} className="px-2 py-1 text-xs rounded bg-rose-50 hover:bg-rose-100 border text-rose-600">Remove</button>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md">{editingId ? 'Update' : 'Save'}</button>
                {editingId !== null && (
                  <button type="button" onClick={()=>{ setEditingId(null); setForm({ name: '', role: '', dateOfBirth: '' }); setShowForm(false); }} className="px-3 py-1.5 text-sm bg-gray-100 rounded-md border">Cancel</button>
                )}
                {error && <span className="text-red-600 text-sm self-center">{error}</span>}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role-based cards (similar aesthetic to CFO sections) */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-4 text-sm text-gray-600">Loading...</div>
      ) : Object.keys(staffByRole).length === 0 ? (
        <div className="bg-white rounded-lg shadow p-4 text-sm text-gray-600">No staff yet</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Object.entries(staffByRole).sort(([a], [b]) => a.localeCompare(b)).map(([roleName, group]) => {
            const isOpen = openRoles.has(roleName);
            return (
              <div key={roleName} className={`${isOpen ? 'xl:col-span-4 lg:col-span-3 sm:col-span-2 col-span-1' : ''}`}>
                <div className="bg-gradient-to-br from-white/90 via-blue-50/30 to-purple-50/30 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 overflow-hidden">
                  <button onClick={() => toggleRole(roleName)} className="w-full text-left p-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-gray-500">Role</div>
                      <div className="text-base font-semibold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">{roleName}</div>
                    </div>
                    <div className="text-xs text-gray-600 bg-white/70 px-2 py-1 rounded-md border border-white/50">{group.length} member{group.length === 1 ? '' : 's'}</div>
                  </button>
                  <div className={`${isOpen ? 'block' : 'hidden'} border-t border-white/50`}></div>
                  <div className={`${isOpen ? 'block' : 'hidden'} p-3`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {group.map((s, idx) => {
                        const isExpanded = expandedStaffIds.has(s.id);
                        const gradient = [
                          'from-indigo-500/90 to-blue-500/90',
                          'from-rose-500/90 to-pink-500/90',
                          'from-emerald-500/90 to-teal-500/90',
                          'from-amber-500/90 to-orange-500/90',
                          'from-fuchsia-500/90 to-purple-500/90',
                          'from-cyan-500/90 to-sky-500/90'
                        ][idx % 6];
                        return (
                          <div key={s.id} className={`rounded-lg shadow-sm overflow-hidden hover:shadow-md transition bg-gradient-to-br ${gradient} p-[1px]`}>
                            <div className={`h-1.5 bg-gradient-to-r ${gradient}`}></div>
                            <div className="p-3 cursor-pointer bg-white/85" onClick={async () => {
                              setDetailsStaff(s);
                              setDetailsPhoto(null);
                              try{
                                const r = await fetch(`${API_BASE_URL}/staff/${s.id}/passport-base64`);
                                if(r.ok){
                                  const j = await r.json();
                                  if(j && j.fileData){ setDetailsPhoto(j.fileData); }
                                }
                              }catch{}
                            }}>
                              <div className="text-sm font-semibold text-gray-900 truncate">{s.name}</div>
                              <div className="text-xs text-gray-600 truncate">{s.phone || '-'}{s.email ? ` · ${s.email}` : ''}</div>
                              <div className="mt-1 text-xs text-gray-500 truncate">{s.bankName || '-'}{s.bankAccountNumber ? ` (${s.bankAccountNumber})` : ''}</div>
                              {/* Actions moved to details modal; intentionally removed on card */}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      {detailsStaff && (
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 backdrop-blur-xl rounded-2xl p-8 max-w-2xl w-full mx-6 max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="h-24 w-24 rounded-2xl overflow-hidden bg-gradient-to-r from-purple-500 to-blue-500 shadow-lg flex items-center justify-center">
                  {detailsPhoto ? (
                    <img src={detailsPhoto} alt={detailsStaff.name} className="h-full w-full object-cover" />
                  ) : (
                    <Calendar className="h-10 w-10 text-white" />
                  )}
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">{detailsStaff.name}</h2>
              </div>
              <button onClick={()=>setDetailsStaff(null)} className="p-2 hover:bg-rose-100 rounded-xl transition-all duration-200 group">
                <X className="h-5 w-5 text-gray-500 group-hover:text-red-500 transition-colors" />
              </button>
            </div>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="text-gray-600">{detailsStaff.phone || '-'}{detailsStaff.email ? ` · ${detailsStaff.email}` : ''}</div>
              <div><span className="text-gray-500">Role:</span> {detailsStaff.role || '-'}</div>
              <div><span className="text-gray-500">National ID:</span> {(detailsStaff as any).nationalId || '-'}</div>
              <div><span className="text-gray-500">DOB:</span> {detailsStaff.dateOfBirth || '-'}</div>
              <div><span className="text-gray-500">Village:</span> {detailsStaff.village || '-'}</div>
              <div><span className="text-gray-500">Next of kin:</span> {detailsStaff.nextOfKin || '-'}{detailsStaff.nextOfKinPhone ? ` (${detailsStaff.nextOfKinPhone})` : ''}</div>
              <div><span className="text-gray-500">Medical issues:</span> {detailsStaff.medicalIssues || '-'}</div>
              <div><span className="text-gray-500">Contract (months):</span> {detailsStaff.contractDurationMonths ?? '-'}</div>
              <div><span className="text-gray-500">Amount to pay:</span> {typeof detailsStaff.amountToPay === 'number' ? `UGX ${detailsStaff.amountToPay.toLocaleString()}` : '-'}</div>
              <div><span className="text-gray-500">Bank:</span> {detailsStaff.bankName || '-'}{detailsStaff.bankAccountNumber ? ` (${detailsStaff.bankAccountNumber})` : ''}</div>
              <div><span className="text-gray-500">Bank branch:</span> {detailsStaff.bankBranch || '-'}</div>
              <div><span className="text-gray-500">Mobile money:</span> {detailsStaff.mobileMoneyNumber || '-'}{detailsStaff.mobileMoneyProvider ? ` (${detailsStaff.mobileMoneyProvider})` : ''}</div>
              <div><span className="text-gray-500">Notes:</span> {detailsStaff.notes || '-'}</div>
              {/* CV preview & download */}
              <div className="mt-3">
                <div className="text-gray-500 mb-1">Curriculum Vitae:</div>
                <CVPreview staffId={detailsStaff.id} apiBase={API_BASE_URL} />
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200/50">
              <button onClick={()=>setDetailsStaff(null)} className="px-6 py-2 text-gray-600 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all duration-200 font-medium shadow-sm">Close</button>
              <button onClick={()=>{ startEdit(detailsStaff); setDetailsStaff(null); }} className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-200 font-medium shadow-lg">Edit</button>
              <button onClick={()=>{ handleDelete(detailsStaff.id); setDetailsStaff(null); }} className="px-6 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl hover:from-rose-600 hover:to-pink-600 transition-all duration-200 font-medium shadow-lg">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;


