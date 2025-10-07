import React, { useEffect, useState } from 'react';

const HRPolicy: React.FC = () => {
  const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const [title, setTitle] = useState('HR Policy and Code of Conduct');
  const [content, setContent] = useState(`
1. Professional conduct and punctuality are mandatory.
2. Confidentiality must be observed at all times.
3. Respectful communication among staff and stakeholders is required.
4. Compliance with safety, health and institutional procedures is required.
5. Misconduct may result in disciplinary action according to applicable laws.
`);

  const [org, setOrg] = useState<any>({});
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_BASE_URL}/settings`);
        if (r.ok) setOrg(await r.json());
      } catch {}
    })();
  }, []);

  const print = () => {
    const safe = (v: any) => (v == null ? '' : String(v));
    const badgeHtml = (org as any).schoolBadge
      ? `<img src="${safe((org as any).schoolBadge)}" alt="School Logo" style="height:40px;width:40px;border-radius:8px;object-fit:contain;background:#fff" />`
      : `<div style="height:40px;width:40px;border-radius:8px;background:#e2e8f0;display:flex;align-items:center;justify-content:center;font-weight:800;color:#334155">${safe((org as any).schoolName || 'S').slice(0,1)}</div>`;

    const html = `<!doctype html>
<html>
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
  <title>${safe(title)}</title>
  <style>
    :root { --primary: ${safe((org as any).docPrimaryColor || '#0ea5e9')}; --font: ${safe((org as any).docFontFamily || 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif')}; --fontSize: ${safe((org as any).docFontSize || 14)}px; }
    html, body { height:100%; }
    body { margin:0; padding:24px; background:#fff; font-family:var(--font); font-size:var(--fontSize); color:#0f172a; }
    .sheet { max-width: 700px; margin: 0 auto; }
    .header { display:flex; gap:12px; align-items:center; padding-bottom:12px; border-bottom:1px solid #e5e7eb; }
    .title { margin:14px 0 4px; font-weight:900; color:var(--primary); font-size:20px; }
    .muted { color:#475569; font-size:12px; }
    .content { margin-top:10px; line-height:1.7; color:#334155; white-space:pre-wrap; }
    .decl { margin-top:24px; padding:14px; border:1px dashed #cbd5e1; border-radius:10px; background:#f8fafc; }
    .sig-row { display:flex; gap:18px; margin-top:14px; }
    .sig-col { flex:1; font-size:12px; color:#334155; }
    .line { height:1px; background:#cbd5e1; margin-top:22px; }
    @media print { body { padding:0; } .sheet { padding:22mm; } }
  </style>
  <script>window.addEventListener('load',()=>setTimeout(()=>window.print(),50));</script>
  </head>
  <body>
    <div class=\"sheet\">
      <div class=\"header\">
        ${badgeHtml}
        <div>
          <div style=\"font-weight:900;font-size:${safe(((org as any).schoolNameSize || 18))}px;color:${safe((org as any).schoolNameColor || '#0f172a')}\">${safe((org as any).schoolName || 'Your School Name')}</div>
          <div class=\"muted\">${safe((org as any).schoolAddress || 'City')} • P.O. Box ${safe((org as any).schoolPOBox || '___')} • Tel: ${safe((org as any).schoolPhone || '___')} • Email: ${safe((org as any).schoolEmail || 'info@school.com')}</div>
          ${(org as any).schoolMotto ? `<div class=\\\"muted\\\" style=\\\"color:${safe((org as any).mottoColor || '#475569')};font-size:${safe((org as any).mottoSize || 12)}px\\\">${safe((org as any).schoolMotto)}</div>` : ''}
        </div>
      </div>

      <div class=\"title\">${safe(title)}</div>
      <div class=\"content\">${safe(content)}</div>

      <div class=\"decl\">
        <div style=\"font-weight:700;color:#0b1324\">Declaration</div>
        <div style=\"margin-top:8px\">I hereby declare that I have read and understood the <strong>${safe(title)}</strong> and agree to abide by it.</div>
        <div class=\"sig-row\">
          <div class=\"sig-col\">
            <div>Staff Name</div>
            <div class=\"line\"></div>
          </div>
          <div class=\"sig-col\">
            <div>Signature</div>
            <div class=\"line\"></div>
          </div>
          <div class=\"sig-col\">
            <div>Date</div>
            <div class=\"line\"></div>
          </div>
        </div>
      </div>
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
      <h1 className="text-2xl font-extrabold bg-gradient-to-r from-rose-700 to-pink-700 bg-clip-text text-transparent">HR Policy</h1>
      <p className="text-sm text-gray-600">Create, review and print HR policy for staff to sign.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow border p-4">
          <label className="text-sm font-medium text-gray-700">Title</label>
          <input className="mt-1 w-full border rounded px-3 py-2 text-sm" value={title} onChange={e=>setTitle(e.target.value)} />

          <label className="mt-3 block text-sm font-medium text-gray-700">Content</label>
          <textarea className="mt-1 w-full border rounded px-3 py-2 text-sm h-64" value={content} onChange={e=>setContent(e.target.value)} />
        </div>

        <div className="bg-white rounded-xl shadow border p-6 print-a4">
          <div className="flex items-center gap-3 border-b pb-3">
            <img src={(org as any).schoolBadge || '/logo.png'} onError={(e:any)=>{ e.currentTarget.style.display='none'; }} alt="School Logo" className="h-10 w-10 rounded" />
            <div>
              <div className="text-base font-extrabold" style={{ color: (org as any).schoolNameColor || undefined, fontSize: ((org as any).schoolNameSize || 18) + 'px' }}>{(org as any).schoolName || 'Your School Name'}</div>
              <div className="text-xs text-gray-600">{(org as any).schoolAddress || 'City'} • P.O. Box {(org as any).schoolPOBox || '___'} • Tel: {(org as any).schoolPhone || '___'} • Email: {(org as any).schoolEmail || 'info@school.com'}</div>
              {(org as any).schoolMotto && (
                <div className="text-xs" style={{ color: (org as any).mottoColor || '#475569', fontSize: ((org as any).mottoSize || 12) + 'px' }}>
                  {(org as any).schoolMotto}
                </div>
              )}
            </div>
          </div>
          <h2 className="text-lg font-bold mt-4" style={{ color: (org as any).docPrimaryColor || undefined }}>{title}</h2>
          <pre className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-800" style={{ fontFamily: (org as any).docFontFamily || undefined, fontSize: ((org as any).docFontSize || 14) + 'px' }}>{content}</pre>
          <div className="mt-5 border border-dashed rounded-lg p-4 bg-slate-50">
            <div className="font-semibold text-slate-900">Declaration</div>
            <div className="text-sm text-slate-700 mt-1">I hereby declare that I have read and understood the <span className="font-medium">{title}</span> and agree to abide by it.</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 text-xs text-slate-600">
              <div>
                <div>Staff Name</div>
                <div className="h-[1px] bg-slate-300 mt-6"></div>
              </div>
              <div>
                <div>Signature</div>
                <div className="h-[1px] bg-slate-300 mt-6"></div>
              </div>
              <div>
                <div>Date</div>
                <div className="h-[1px] bg-slate-300 mt-6"></div>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <button onClick={print} className="px-3 py-1.5 text-sm rounded bg-gradient-to-r from-rose-600 to-pink-600 text-white">Print</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRPolicy;


