import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { LogOut, Bell, Database, Mic, User, Phone, Mail, Download, CheckCircle2, Clock, Brain, FileText, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function Settings() {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);
  const [autoTranscribe, setAutoTranscribe] = useState(true);
  const [profile, setProfile] = useState({
    fullName: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [reportType, setReportType] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [toast, setToast] = useState('');
  const [stats, setStats] = useState({ total: 0, transcribed: 0, analyzed: 0, hours: 0 });

  useEffect(() => {
    async function fetchStats() {
      if (!user) return;
      const { data } = await supabase.from('recordings').select('*');
      if (data) {
        const dur = data.reduce((a, r) => a + (r.duration_seconds || 0), 0);
        setStats({
          total: data.length,
          transcribed: data.filter(r => r.status === 'transcribed' || r.status === 'analyzed').length,
          analyzed: data.filter(r => r.status === 'analyzed').length,
          hours: (dur / 3600).toFixed(1),
        });
      }
    }
    fetchStats();
  }, [user]);

  const handleSignOut = async () => { await signOut(); navigate('/login'); };
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const Toggle = ({ enabled, onChange }) => (
    <button onClick={onChange}
      className={`w-12 h-[26px] rounded-full transition-colors relative ${enabled ? 'bg-indigo-600' : 'bg-gray-200'}`}>
      <div className={`w-[22px] h-[22px] rounded-full bg-white absolute top-[2px] transition-transform shadow-sm ${enabled ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
    </button>
  );

  /* ── Vibrant Donut Chart ── */
  const DonutChart = () => {
    const total = stats.total || 1;
    const segments = [
      { pct: (stats.analyzed / total) * 100, color: '#6366F1', label: 'Analyzed' },
      { pct: ((stats.transcribed - stats.analyzed) / total) * 100, color: '#3B82F6', label: 'Transcribed' },
      { pct: ((total - stats.transcribed) / total) * 50, color: '#10B981', label: 'Pending' },
      { pct: ((total - stats.transcribed) / total) * 20, color: '#F59E0B', label: 'Queued' },
      { pct: ((total - stats.transcribed) / total) * 15, color: '#EF4444', label: 'Errors' },
      { pct: ((total - stats.transcribed) / total) * 10, color: '#8B5CF6', label: 'Other' },
      { pct: ((total - stats.transcribed) / total) * 5, color: '#EC4899', label: 'New' },
    ];
    const r = 56, c = 2 * Math.PI * r;
    let offset = 0;
    return (
      <div>
        <svg viewBox="0 0 150 150" className="w-full max-w-[200px] mx-auto drop-shadow-sm">
          <defs>
            {segments.map((seg, i) => (
              <linearGradient key={i} id={`grad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={seg.color} stopOpacity="1" />
                <stop offset="100%" stopColor={seg.color} stopOpacity="0.7" />
              </linearGradient>
            ))}
          </defs>
          <circle cx="75" cy="75" r={r} fill="none" stroke="#F3F4F6" strokeWidth="20" />
          {segments.map((seg, i) => {
            const dash = (Math.max(seg.pct, 0) / 100) * c;
            const el = (
              <circle key={i} cx="75" cy="75" r={r} fill="none"
                stroke={`url(#grad-${i})`} strokeWidth="20"
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 75 75)"
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}
              />
            );
            offset += dash;
            return el;
          })}
          <text x="75" y="70" textAnchor="middle" dominantBaseline="middle" fontSize="28" fontWeight="800" fill="#111827">{stats.total}</text>
          <text x="75" y="90" textAnchor="middle" fontSize="9" fontWeight="700" fill="#9CA3AF" letterSpacing="1.5">TOTAL</text>
        </svg>
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-5">
          {[
            { c: 'bg-indigo-500', l: 'Analyzed' },
            { c: 'bg-blue-500', l: 'Transcribed' },
            { c: 'bg-emerald-500', l: 'Pending' },
            { c: 'bg-amber-500', l: 'Queued' },
            { c: 'bg-red-500', l: 'Errors' },
            { c: 'bg-violet-500', l: 'Other' },
            { c: 'bg-pink-500', l: 'New' },
          ].map((item, i) => (
            <span key={i} className="flex items-center gap-1.5 text-[11px] text-gray-600 font-medium">
              <span className={`w-2.5 h-2.5 rounded-full ${item.c}`}></span>{item.l}
            </span>
          ))}
        </div>
      </div>
    );
  };

  /* ── Vibrant Bar Chart with Y-axis ── */
  const BarChart = () => {
    const bars = [
      { label: 'Total Rec.', value: stats.total, gradient: 'from-indigo-400 via-indigo-500 to-violet-600' },
      { label: 'Transcribed', value: stats.transcribed, gradient: 'from-emerald-400 via-green-500 to-emerald-600' },
      { label: 'AI Ready', value: stats.analyzed, gradient: 'from-rose-400 via-red-500 to-red-600' },
      { label: 'Hours', value: parseFloat(stats.hours), gradient: 'from-amber-300 via-orange-400 to-orange-600' },
    ];
    const maxVal = Math.max(...bars.map(b => b.value), 1);
    const yTicks = [0, 25, 50, 75, 100].map(p => Math.round((p / 100) * maxVal));

    return (
      <div className="relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-right pr-1">
          {[...yTicks].reverse().map((tick, i) => (
            <span key={i} className="text-[10px] text-gray-400 font-medium">{tick}</span>
          ))}
        </div>
        {/* Grid lines */}
        <div className="ml-9 relative">
          <div className="absolute inset-0 bottom-8 flex flex-col justify-between pointer-events-none">
            {yTicks.map((_, i) => (
              <div key={i} className="border-t border-gray-100 w-full"></div>
            ))}
          </div>
          {/* Bars */}
          <div className="flex items-end justify-around gap-4 h-44 pt-2 relative z-10">
            {bars.map((bar, i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-1">
                <span className="text-xs font-extrabold text-gray-900">{bar.value}</span>
                <div className={`w-full max-w-[48px] rounded-xl bg-gradient-to-t ${bar.gradient} shadow-lg relative overflow-hidden`}
                  style={{ height: `${Math.max((bar.value / maxVal) * 100, 10)}%` }}>
                  {/* Glossy shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-transparent to-transparent rounded-xl" />
                </div>
                <span className="text-[10px] text-gray-500 font-bold text-center leading-tight">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e8edf5] to-[#dfe5f0] font-sans p-3 lg:p-5" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <Sidebar />

      {toast && (
        <div className="fixed top-6 right-6 z-[100] bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-sm font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {toast}
        </div>
      )}

      <div className="bg-white rounded-3xl lg:rounded-[40px] shadow-sm lg:ml-[108px] min-h-[calc(100vh-24px)] lg:min-h-[calc(100vh-40px)] overflow-hidden pb-24 lg:pb-8 relative">
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-50 px-5 lg:px-10 pt-6 lg:pt-16 pb-4 lg:pb-8">
          <h1 className="text-2xl lg:text-[56px] font-extrabold text-gray-900 tracking-tight">Settings</h1>
          <p className="text-xs lg:text-sm text-gray-400 mt-1 lg:mt-6">Manage your account preferences and security</p>
        </header>

        <div className="px-4 lg:px-10 pt-5 lg:pt-8">

          {/* ═══ ROW 1: User Profile + Stats Donut ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            {/* User Profile — 2/3 */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">User Profile</h2>
                  <p className="text-xs text-gray-400">Update your identification and contact details</p>
                </div>
              </div>
              <div className="border-t border-gray-100 mt-4 pt-6">
                <div className="bg-[#F8FAFC] rounded-2xl p-6 lg:p-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Full Name</label>
                      <input type="text" value={profile.fullName} onChange={e => setProfile({ ...profile, fullName: e.target.value })}
                        placeholder="Your name" className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Email Address</label>
                      <input type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })}
                        placeholder="you@example.com" className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Phone Number</label>
                      <input type="tel" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })}
                        placeholder="+1 (555) 000-0000" className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Account Type</label>
                      <input type="text" value="Personal" disabled
                        className="w-full px-4 py-3.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 text-sm cursor-not-allowed" />
                    </div>
                  </div>
                  <div className="flex justify-end mt-6">
                    <button onClick={() => showToast('Profile saved!')}
                      className="bg-gray-900 text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-gray-800 transition-all">
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Donut — 1/3 */}
            <div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4">Inventory by Status</h3>
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <DonutChart />
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-5">
                  <span className="flex items-center gap-1.5 text-xs text-gray-600"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Analyzed</span>
                  <span className="flex items-center gap-1.5 text-xs text-gray-600"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Transcribed</span>
                  <span className="flex items-center gap-1.5 text-xs text-gray-600"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Pending</span>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ ROW 2: Generate Report + Target Metrics Bar Chart ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            {/* Generate Report — 2/3 */}
            <div className="lg:col-span-2">
              <h2 className="text-lg font-bold text-gray-900">Generate Custom Report</h2>
              <p className="text-xs text-gray-400 mt-0.5 mb-5">Export analytics and raw tabular data seamlessly</p>
              <div className="border-t border-gray-100 pt-6">
                <div className="flex flex-wrap items-end gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Report Type</label>
                    <select value={reportType} onChange={e => setReportType(e.target.value)}
                      className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44">
                      <option value="monthly">Monthly Report</option>
                      <option value="weekly">Weekly Report</option>
                      <option value="daily">Daily Report</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Start Date</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                      className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">End Date</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                      className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <button onClick={() => showToast('Report generated!')}
                    className="h-[46px] px-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95 transition-transform">
                    Generate Report
                  </button>
                </div>
              </div>
            </div>

            {/* Target Metrics — 1/3 */}
            <div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4">Target Metrics</h3>
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <BarChart />
              </div>
            </div>
          </div>

          {/* ═══ ROW 3: Preferences + Account ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            {/* Preferences */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Preferences</h2>
              <p className="text-xs text-gray-400 mb-4">Customize your app experience</p>
              <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 shadow-sm">
                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600"><Bell className="w-[18px] h-[18px]" /></div>
                    <div>
                      <span className="text-sm font-semibold text-gray-900 block">Notifications</span>
                      <span className="text-xs text-gray-400">Get alerts when transcription completes</span>
                    </div>
                  </div>
                  <Toggle enabled={notifications} onChange={() => setNotifications(!notifications)} />
                </div>
                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600"><Brain className="w-[18px] h-[18px]" /></div>
                    <div>
                      <span className="text-sm font-semibold text-gray-900 block">Auto AI Analysis</span>
                      <span className="text-xs text-gray-400">Run AI analysis after transcription</span>
                    </div>
                  </div>
                  <Toggle enabled={autoTranscribe} onChange={() => setAutoTranscribe(!autoTranscribe)} />
                </div>
                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600"><Database className="w-[18px] h-[18px]" /></div>
                    <div>
                      <span className="text-sm font-semibold text-gray-900 block">Cloud Sync</span>
                      <span className="text-xs text-gray-400">Supabase storage active</span>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg font-bold border border-emerald-100">Active</span>
                </div>
              </div>
            </div>

            {/* Account */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Account</h2>
              <p className="text-xs text-gray-400 mb-4">Manage your session</p>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div onClick={handleSignOut}
                  className="flex items-center gap-3 p-5 text-red-500 cursor-pointer hover:bg-red-50 transition-colors rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center"><LogOut className="w-[18px] h-[18px]" /></div>
                  <div>
                    <span className="text-sm font-bold block">Log Out</span>
                    <span className="text-xs text-red-400">End your current session</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
