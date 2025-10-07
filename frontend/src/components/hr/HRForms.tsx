import React, { useEffect, useState } from 'react';

const HRForms: React.FC = () => {
  const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const [staff, setStaff] = useState<any[]>([]);
  const [org, setOrg] = useState<any>({});
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await fetch(`${API_BASE_URL}/staff`);
        if (!r.ok) throw new Error('Failed to load staff');
        const j = await r.json();
        setStaff(Array.isArray(j) ? j : []);
        // Load organization/school settings for header
        try {
          const s = await fetch(`${API_BASE_URL}/settings`);
          if (s.ok) {
            const sj = await s.json();
            setOrg(sj || {});
          }
        } catch {}
      } catch (e: any) {
        setError(e.message || 'Failed to load staff');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selected = staff.find(s => s.id === selectedId) || null;

  const parseDate = (d: any) => {
    if (!d) return null;
    try { return new Date(d); } catch { return null; }
  };
  const addMonths = (date: Date, months: number) => {
    const dt = new Date(date.getTime());
    const m = dt.getMonth() + Number(months || 0);
    dt.setMonth(m);
    return dt;
  };
  const formatDate = (d: Date | null) => d ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';

  const startDateDerived = (() => {
    if (!selected) return null;
    return parseDate((selected as any).contractStartDate || (selected as any).startDate || (selected as any).createdAt) || new Date();
  })();
  const endDateDerived = (() => {
    if (!selected) return null;
    const dur = (selected as any).contractDurationMonths;
    const explicit = parseDate((selected as any).contractEndDate || (selected as any).endDate);
    if (explicit) return explicit;
    if (startDateDerived && (typeof dur === 'number' || (dur && !isNaN(Number(dur))))) {
      return addMonths(startDateDerived as Date, Number(dur));
    }
    return null;
  })();

  const print = () => {
    if (!selected) return;

    const safe = (v: any) => (v == null ? '' : String(v));
    const currency = (n: any) => {
      const num = typeof n === 'number' ? n : Number(n || 0);
      return isNaN(num) ? '-' : num.toLocaleString();
    };

    const badgeHtml = (org as any).schoolBadge
      ? `<img src="${(org as any).schoolBadge}" alt="School Logo" style="height:40px;width:40px;border-radius:8px;object-fit:contain;background:#fff" />`
      : `<div style="height:40px;width:40px;border-radius:8px;background:#e2e8f0;display:flex;align-items:center;justify-content:center;font-weight:800;color:#334155">${safe((org as any).schoolName || 'S').slice(0,1)}</div>`;

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Appointment Letter</title>
  <style>
    :root {
      --primary: ${safe((org as any).docPrimaryColor || '#0ea5e9')};
      --font: ${safe((org as any).docFontFamily || 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif')};
      --fontSize: ${safe((org as any).docFontSize || 14)}px;
    }
    html, body { height: 100%; }
    body { margin: 0; padding: 24px; background: #f1f5f9; font-family: var(--font); font-size: var(--fontSize); color: #0f172a; }
    .sheet { max-width: 680px; margin: 0 auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 10px 30px rgba(2,6,23,0.08); }
    .content { padding: 20px; }
    .header { display:flex; gap:12px; align-items:center; padding-bottom:12px; border-bottom:1px solid #e5e7eb; }
    .title { margin: 12px 0 0; font-weight: 900; color: var(--primary); font-size: 18px; letter-spacing: 0.2px; }
    .muted { color:#475569; font-size:12px; }
    .section { margin-top: 16px; line-height: 1.7; color: #334155; }
    .info { display:flex; flex-wrap:wrap; gap:10px; margin-top:10px; }
    .chip { display:inline-flex; align-items:center; gap:8px; padding:8px 10px; background:#f8fafc; border:1px solid #e5e7eb; border-radius:10px; font-size:12px; color:#0f172a; }
    .chip strong { color:#0b1324; }
    .sig { margin-top: 18px; }
    .sig-line { height: 1px; width: 260px; background: #e5e7eb; margin-top: 12px; }
    .footer { position: fixed; left: 24px; right: 24px; bottom: 24px; border-top:1px solid #e5e7eb; padding-top:6px; text-align:center; color:#475569; font-size:11px; }
    @media print {
      body { background: #fff; padding: 0; }
      .sheet { box-shadow: none; border: 0; border-radius: 0; }
      .content { padding: 24mm; }
      .footer { position: fixed; left: 24mm; right: 24mm; bottom: 18mm; }
    }
  </style>
  <script>
    window.addEventListener('load', () => setTimeout(() => window.print(), 50));
  </script>
  </head>
  <body>
    <div class="sheet">
      <div class="content">
        <div class="header">
          ${badgeHtml}
          <div>
            <div style="font-weight:900;font-size:${safe(((org as any).schoolNameSize || 18))}px;color:${safe((org as any).schoolNameColor || '#0f172a')}">${safe((org as any).schoolName || 'Your School Name')}</div>
            <div class="muted" style="line-height:1.5">
              <div>${safe((org as any).schoolAddress || 'City')}${(org as any).schoolPOBox ? ` • P.O. Box ${safe((org as any).schoolPOBox)}` : ''}</div>
              <div>
                ${((org as any).schoolPhone ? `Tel: ${safe((org as any).schoolPhone)}` : '')}
                ${(((org as any).schoolPhone) && (org as any).schoolEmail ? ' | ' : '')}
                ${((org as any).schoolEmail ? `Email: ${safe((org as any).schoolEmail)}` : '')}
                ${((((org as any).schoolPhone || (org as any).schoolEmail) && (org as any).schoolWebsite) ? ' | ' : '')}
                ${safe((org as any).schoolWebsite || '')}
              </div>
            </div>
            ${(org as any).schoolMotto ? `<div class="muted" style="margin-top:4px;color:${safe((org as any).mottoColor || '#475569')};font-size:${safe((org as any).mottoSize || 12)}px">${safe((org as any).schoolMotto)}</div>` : ''}
          </div>
        </div>

        <div class="title">Appointment Letter</div>
        <div class="muted">Date: ${new Date().toLocaleDateString()}</div>

        <div class="info">
          <div class="chip"><strong>Name:</strong> ${safe((selected as any).name)}</div>
          <div class="chip"><strong>Role:</strong> ${safe((selected as any).role || 'STAFF')}</div>
          ${(selected as any).nationalId ? `<div class=\"chip\"><strong>NIN:</strong> ${safe((selected as any).nationalId)}</div>` : ''}
          <div class="chip"><strong>Start Date:</strong> ${formatDate(startDateDerived as any)}</div>
          <div class="chip"><strong>End Date:</strong> ${formatDate(endDateDerived as any)}</div>
        </div>

        <div class="section">
          <p>Dear ${safe((selected as any).name)},</p>
          <p style="margin-top:12px">We are pleased to offer you an appointment as <strong>${safe((selected as any).role || 'STAFF')}</strong> at our institution.</p>
          <p style="margin-top:12px">Your contract duration will be <strong>${(selected as any).contractDurationMonths ?? '-' } months</strong>, with a monthly remuneration of <strong>UGX ${currency((selected as any).amountToPay)}</strong>.</p>
          <p style="margin-top:12px">You are expected to report to the Human Resources Office on your start date for onboarding and to sign the HR Policy and Code of Conduct.</p>
          <p style="margin-top:12px">Please bring your National ID (${safe((selected as any).nationalId || '—')}) and any requested documents.</p>
          <p style="margin-top:12px">We look forward to your contribution to our mission.</p>
          <p style="margin-top:18px">Sincerely,</p>

          <div class="sig">
            ${(org as any).hrSignatureImage ? `<img src="${safe((org as any).hrSignatureImage)}" alt="HR Signature" style="height:64px;object-fit:contain" />` : ''}
            <div style="height:48px"></div>
            <div class="sig-line"></div>
            <div style="font-size:13px;font-weight:600">${safe((org as any).hrName || 'HR Name')}</div>
            <div class="muted">Human Resources Department</div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <div><strong>${safe((org as any).schoolName || 'SCHOOL NAME')}</strong></div>
      <div>${(org as any).schoolPOBox ? `P.O. Box ${safe((org as any).schoolPOBox)}` : ''}${(org as any).schoolPOBox && (org as any).schoolEmail ? ' | ' : ''}${safe((org as any).schoolEmail || '')}${(org as any).schoolPhone ? ` | ${safe((org as any).schoolPhone)}` : ''}</div>
      ${(org as any).schoolMotto ? `<div><em>${safe((org as any).schoolMotto)}</em></div>` : ''}
    </div>
  </body>
</html>`;

    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      w.focus();
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-extrabold bg-gradient-to-r from-rose-700 to-pink-700 bg-clip-text text-transparent">HR Forms</h1>
      <p className="text-sm text-gray-600">Generate a formal Appointment Letter for any staff member.</p>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-1/3 w-full">
          <label className="text-sm font-medium text-gray-700">Choose staff</label>
          <select className="mt-1 w-full border rounded px-3 py-2 text-sm" value={selectedId ?? ''} onChange={e => setSelectedId(e.target.value ? Number(e.target.value) : null)}>
            <option value="">Select staff</option>
            {staff.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
        </div>

        <div className="flex-1">
          <div className="bg-white rounded-xl shadow border p-5">
            {!selected ? (
              <div className="text-gray-500 text-sm">Select a staff member to preview the appointment letter.</div>
            ) : (
              <div className="prose max-w-none" style={{ fontFamily: org.docFontFamily || undefined, fontSize: (org.docFontSize || 14) + 'px' }}>
                {/* Header with school logo and info */}
                <div className="flex items-center gap-3 border-b pb-3">
                  <img src={(org as any).schoolBadge || '/logo.png'} onError={(e:any)=>{ e.currentTarget.style.display='none'; }} alt="School Logo" className="h-10 w-10 rounded" />
                  <div>
                    <div className="text-base font-extrabold" style={{ color: (org as any).schoolNameColor || undefined, fontSize: ((org as any).schoolNameSize || 18) + 'px' }}>{(org as any).schoolName || 'Your School Name'}</div>
                    <div className="text-xs text-gray-600 leading-5">
                      <div>{(org as any).schoolAddress || 'City'}{(org as any).schoolPOBox ? ` • P.O. Box ${(org as any).schoolPOBox}` : ''}</div>
                      <div>
                        {(org as any).schoolPhone ? `Tel: ${(org as any).schoolPhone}` : ''}
                        {((org as any).schoolPhone && (org as any).schoolEmail) ? ' | ' : ''}
                        {(org as any).schoolEmail ? `Email: ${(org as any).schoolEmail}` : ''}
                        {(((org as any).schoolPhone || (org as any).schoolEmail) && (org as any).schoolWebsite) ? ' | ' : ''}
                        {(org as any).schoolWebsite || ''}
                      </div>
                    </div>
                    {(org as any).schoolMotto && (
                      <div className="text-xs" style={{ color: (org as any).mottoColor || '#475569', fontSize: ((org as any).mottoSize || 12) + 'px' }}>
                        {(org as any).schoolMotto}
                      </div>
                    )}
                  </div>
                </div>
                <h2 className="text-lg font-bold mt-4" style={{ color: org.docPrimaryColor || undefined }}>Appointment Letter</h2>
                <p className="text-sm" style={{ color: '#475569' }}>Date: {new Date().toLocaleDateString()}</p>
                <div className="mt-4 text-sm leading-6 text-gray-800">
                  <p>Dear {selected.name},</p>
                  <p className="mt-3">We are pleased to offer you an appointment as <span className="font-semibold">{selected.role || 'STAFF'}</span> at our institution.</p>
                  <p className="mt-3">Your contract duration will be <span className="font-semibold">{selected.contractDurationMonths ?? '-'} months</span>, with a monthly remuneration of <span className="font-semibold">UGX {typeof selected.amountToPay === 'number' ? selected.amountToPay.toLocaleString() : '-'}</span>.</p>
                  <p className="mt-3">You are expected to report to the Human Resources Office on your start date for onboarding and to sign the HR Policy and Code of Conduct.</p>
                  <p className="mt-3">Please bring your National ID ({(selected as any).nationalId || '—'}) and any requested documents.</p>
                  <p className="mt-3">We look forward to your contribution to our mission.</p>
                  <p className="mt-6">Sincerely,</p>
                  <div className="mt-6">
                    {org.hrSignatureImage && <img src={org.hrSignatureImage} alt="HR Signature" className="h-16 object-contain" />}
                    <div className="h-12"></div>
                    <div className="border-t w-64" style={{ borderColor: org.docPrimaryColor || undefined }}></div>
                    <div className="text-sm font-medium">{org.hrName || 'HR Name'} </div>
                    <div className="text-xs text-gray-600">Human Resources Department</div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={print} className="px-3 py-1.5 text-sm rounded bg-gradient-to-r from-rose-600 to-pink-600 text-white">Print</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRForms;


