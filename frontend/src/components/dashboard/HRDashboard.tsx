import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Image as ImageIcon, CalendarPlus, Layers } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

type Staff = {
  id?: string | number;
  name?: string;
  role?: string;
  department?: string;
  gender?: string;
  createdAt?: string | Date;
  passportPhotoFileName?: string;
};

const API_BASE_URL = '/api';

const COLORS = ['#7C3AED', '#06B6D4', '#22C55E', '#F59E0B', '#EF4444', '#3B82F6'];

const StatCard: React.FC<{ title: string; value: string | number; subtitle?: string; icon: React.ReactNode; gradient: string }> = ({ title, value, subtitle, icon, gradient }) => (
  <div className={`relative overflow-hidden rounded-2xl p-4 shadow-lg border border-white/30 bg-gradient-to-br ${gradient} transition-transform duration-300 hover:shadow-2xl hover:-translate-y-0.5 hover:ring-1 hover:ring-white/40 hover:brightness-105 cursor-default` }>
    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/20 blur-2xl"></div>
    <div className="flex items-center justify-between">
      <div>
        <div className="text-xs font-bold text-white/90">{title}</div>
        <div className="mt-1 text-2xl font-black text-white drop-shadow-sm">{value}</div>
        {subtitle ? <div className="mt-1 text-xs text-white/70">{subtitle}</div> : null}
      </div>
      <div className="p-2 bg-white/20 rounded-xl text-white">
        {icon}
      </div>
    </div>
  </div>
);

const HRDashboard: React.FC = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/staff`);
        if (!res.ok) {
          // Soft-fail: treat as empty so cards show 0 instead of error banner
          if (isMounted) { setStaff([]); setError(null); }
        } else {
          const data = await res.json();
          if (isMounted) setStaff(Array.isArray(data) ? data : []);
        }
      } catch (_e) {
        // Network error → still show zeros, not a red alert
        if (isMounted) { setStaff([]); setError(null); }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalStaff = staff.length;
  const withPhotos = useMemo(() => staff.filter(s => !!s.passportPhotoFileName).length, [staff]);
  const newThisMonth = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    return staff.filter(s => {
      if (!s.createdAt) return false;
      const d = new Date(s.createdAt);
      return d.getFullYear() === y && d.getMonth() === m;
    }).length;
  }, [staff]);

  const rolePieData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of staff) {
      const key = (s.role || s.department || 'Unknown').toString();
      counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [staff]);

  const hiresByMonth = useMemo(() => {
    // Last 6 months
    const buckets: { month: string; hires: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ month: d.toLocaleString(undefined, { month: 'short' }), hires: 0 });
    }
    const monthIndexMap = new Map<string, number>();
    buckets.forEach((b, idx) => monthIndexMap.set(b.month, idx));
    for (const s of staff) {
      if (!s.createdAt) continue;
      const d = new Date(s.createdAt);
      const diffMonths = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
      if (diffMonths >= 0 && diffMonths <= 5) {
        const label = d.toLocaleString(undefined, { month: 'short' });
        const idx = monthIndexMap.get(label);
        if (idx !== undefined) buckets[idx].hires += 1;
      }
    }
    return buckets;
  }, [staff]);

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-rose-600 to-fuchsia-600 bg-clip-text text-transparent">HR Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Overview of staff metrics and recent activity.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/hr/staff" className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">Manage Staff</Link>
          <Link to="/weekly-reports" className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700">Weekly Reports</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Staff" value={loading ? '—' : totalStaff} icon={<Users className="h-5 w-5" />} gradient="from-rose-500 to-pink-500" />
        <StatCard title="With Photos" value={loading ? '—' : withPhotos} icon={<ImageIcon className="h-5 w-5" />} gradient="from-indigo-500 to-sky-500" />
        <StatCard title="New This Month" value={loading ? '—' : newThisMonth} icon={<CalendarPlus className="h-5 w-5" />} gradient="from-emerald-500 to-lime-500" />
        <StatCard title="Distinct Roles/Depts" value={loading ? '—' : rolePieData.length} icon={<Layers className="h-5 w-5" />} gradient="from-fuchsia-500 to-violet-500" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* CFO-style Pie (Donut) Chart */}
        <div className="bg-gradient-to-br from-white/90 via-purple-50/30 to-indigo-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 transition-transform">
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm font-bold text-gray-800">Staff Distribution</div>
            <div className="text-xs text-gray-500">by role/department</div>
          </div>
          <div className="relative h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={rolePieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  stroke="none"
                >
                  {rolePieData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="drop-shadow" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value: any, name: any) => [value, name]}
                />
              </RechartsPieChart>
            </ResponsiveContainer>

            {/* Center total like CFO */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">{totalStaff}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
          </div>

          {/* CFO-style legend */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {rolePieData.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                <span className="text-sm font-black text-gray-800">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CFO-style Bar Chart */}
        <div className="bg-gradient-to-br from-white/90 via-blue-50/30 to-cyan-50/30 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm font-bold text-gray-800">Monthly Hires</div>
            <div className="text-xs text-gray-500">last 6 months</div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hiresByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis allowDecimals={false} stroke="#6B7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }}
                formatter={(value: any) => [value, 'Hires']}
              />
              <Bar dataKey="hires" fill="#7C3AED" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 text-sm font-bold text-gray-800">Recent Staff</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-gray-500">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Department</th>
                <th className="px-3 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {(loading ? Array.from({ length: 5 }) : [...staff]
                .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                .slice(0, 5)
              ).map((s: any, idx: number) => (
                <tr key={s?.id ?? idx} className="border-t border-gray-100">
                  <td className="px-3 py-2">{loading ? '—' : (s?.name || '—')}</td>
                  <td className="px-3 py-2">{loading ? '—' : (s?.role || '—')}</td>
                  <td className="px-3 py-2">{loading ? '—' : (s?.department || '—')}</td>
                  <td className="px-3 py-2">
                    {loading ? '—' : (s?.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;
