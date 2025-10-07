import React, { useEffect, useState } from 'react';

const HRCustomise: React.FC = () => {
  const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const [org, setOrg] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_BASE_URL}/settings`);
        if (r.ok) setOrg(await r.json());
      } catch {}
    })();
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      const body = {
        currentYear: (org as any).currentYear || new Date().getFullYear(),
        currentTerm: (org as any).currentTerm || 'Term 1',
        schoolName: org.schoolName || '',
        schoolAddress: org.schoolAddress || '',
        schoolPhone: org.schoolPhone || '',
        schoolEmail: org.schoolEmail || '',
        schoolPOBox: org.schoolPOBox || '',
        schoolMotto: org.schoolMotto || '',
        mottoColor: org.mottoColor || '#475569',
        mottoSize: org.mottoSize || 12,
        schoolBadge: org.schoolBadge || '',
        schoolNameSize: Number(org.schoolNameSize) || 18,
        schoolNameColor: org.schoolNameColor || '#0f172a',
        docPrimaryColor: org.docPrimaryColor || '#0f172a',
        docFontFamily: org.docFontFamily || 'Inter, ui-sans-serif, system-ui, sans-serif',
        docFontSize: org.docFontSize || 14,
        hrName: org.hrName || '',
        hrSignatureImage: org.hrSignatureImage || '',
      };
      const r = await fetch(`${API_BASE_URL}/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error('Failed to save');
      setOk('Saved successfully.');
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-extrabold bg-gradient-to-r from-rose-700 to-pink-700 bg-clip-text text-transparent">Customise HR Documents</h1>
      <p className="text-sm text-gray-600">Update organization information displayed on Appointment Letters and HR Policy.</p>

      <div className="bg-white rounded-xl shadow border p-5 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-700">School Name</label>
            <input className="mt-1 w-full border rounded px-3 py-2 text-sm" value={org.schoolName || ''} onChange={e=>setOrg({...org, schoolName: e.target.value})} />
          </div>
          <div>
            <label className="text-sm text-gray-700">School Email</label>
            <input className="mt-1 w-full border rounded px-3 py-2 text-sm" value={org.schoolEmail || ''} onChange={e=>setOrg({...org, schoolEmail: e.target.value})} />
          </div>
          <div>
            <label className="text-sm text-gray-700">Phone</label>
            <input className="mt-1 w-full border rounded px-3 py-2 text-sm" value={org.schoolPhone || ''} onChange={e=>setOrg({...org, schoolPhone: e.target.value})} />
          </div>
          <div>
            <label className="text-sm text-gray-700">Address</label>
            <input className="mt-1 w-full border rounded px-3 py-2 text-sm" value={org.schoolAddress || ''} onChange={e=>setOrg({...org, schoolAddress: e.target.value})} />
          </div>
          <div>
            <label className="text-sm text-gray-700">P.O. Box</label>
            <input className="mt-1 w-full border rounded px-3 py-2 text-sm" value={org.schoolPOBox || ''} onChange={e=>setOrg({...org, schoolPOBox: e.target.value})} />
          </div>
          <div>
            <label className="text-sm text-gray-700">Motto</label>
            <input className="mt-1 w-full border rounded px-3 py-2 text-sm" value={org.schoolMotto || ''} onChange={e=>setOrg({...org, schoolMotto: e.target.value})} />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-700">Logo URL (schoolBadge)</label>
            <input className="mt-1 w-full border rounded px-3 py-2 text-sm" placeholder="/logo.png or https://..." value={org.schoolBadge || ''} onChange={e=>setOrg({...org, schoolBadge: e.target.value})} />
            <div className="mt-2 text-xs text-gray-500">You can paste a base64 data URL or upload below.</div>
            <input type="file" accept="image/*" className="mt-2 text-sm" onChange={(e:any)=>{
              const f = e.target.files?.[0]; if(!f) return; const r = new FileReader(); r.onload=(ev:any)=> setOrg({...org, schoolBadge: ev.target.result}); r.readAsDataURL(f);
            }} />
          </div>
          <div>
            <label className="text-sm text-gray-700">Primary Color</label>
            <input type="color" className="mt-1 w-16 h-10 border rounded" value={org.docPrimaryColor || '#0f172a'} onChange={e=>setOrg({...org, docPrimaryColor: e.target.value})} />
          </div>
          <div>
            <label className="text-sm text-gray-700">School Name Color</label>
            <input type="color" className="mt-1 w-16 h-10 border rounded" value={org.schoolNameColor || '#0f172a'} onChange={e=>setOrg({...org, schoolNameColor: e.target.value})} />
          </div>
          <div>
            <label className="text-sm text-gray-700">Font Family</label>
            <input className="mt-1 w-full border rounded px-3 py-2 text-sm" placeholder="e.g., Inter, Arial" value={org.docFontFamily || ''} onChange={e=>setOrg({...org, docFontFamily: e.target.value})} />
          </div>
          <div>
            <label className="text-sm text-gray-700">Base Font Size (px)</label>
            <input type="number" min={10} max={20} className="mt-1 w-full border rounded px-3 py-2 text-sm" value={org.docFontSize || 14} onChange={e=>setOrg({...org, docFontSize: Number(e.target.value) || 14})} />
          </div>
          <div>
            <label className="text-sm text-gray-700">School Name Font Size (px)</label>
            <input type="number" min={10} max={48} className="mt-1 w-full border rounded px-3 py-2 text-sm" value={org.schoolNameSize || 18} onChange={e=>setOrg({...org, schoolNameSize: Number(e.target.value) || 18})} />
          </div>
          <div>
            <label className="text-sm text-gray-700">Motto Color</label>
            <input type="color" className="mt-1 w-16 h-10 border rounded" value={org.mottoColor || '#475569'} onChange={e=>setOrg({...org, mottoColor: e.target.value})} />
          </div>
          <div>
            <label className="text-sm text-gray-700">Motto Font Size (px)</label>
            <input type="number" min={10} max={32} className="mt-1 w-full border rounded px-3 py-2 text-sm" value={org.mottoSize || 12} onChange={e=>setOrg({...org, mottoSize: Number(e.target.value) || 12})} />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-700">HR Name</label>
            <input className="mt-1 w-full border rounded px-3 py-2 text-sm" value={org.hrName || ''} onChange={e=>setOrg({...org, hrName: e.target.value})} />
            <label className="mt-3 block text-sm text-gray-700">HR Signature (image)</label>
            <input className="mt-1 w-full border rounded px-3 py-2 text-sm" placeholder="Paste base64 or upload below" value={org.hrSignatureImage || ''} onChange={e=>setOrg({...org, hrSignatureImage: e.target.value})} />
            <input type="file" accept="image/*" className="mt-2 text-sm" onChange={(e:any)=>{
              const f = e.target.files?.[0]; if(!f) return; const r = new FileReader(); r.onload=(ev:any)=> setOrg({...org, hrSignatureImage: ev.target.result}); r.readAsDataURL(f);
            }} />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button onClick={save} disabled={saving} className={`px-3 py-1.5 text-sm rounded text-white ${saving ? 'bg-rose-300' : 'bg-gradient-to-r from-rose-600 to-pink-600'}`}>{saving ? 'Saving...' : 'Save'}</button>
          {ok && <span className="text-green-600 text-sm self-center">{ok}</span>}
          {error && <span className="text-red-600 text-sm self-center">{error}</span>}
        </div>
      </div>
    </div>
  );
};

export default HRCustomise;


