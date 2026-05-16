import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import {
  Play, Pause, Mic, Clock, FileText, Sparkles,
  TrendingUp, ArrowUpRight, Brain, ChevronRight, BarChart3
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [recordings, setRecordings] = useState([]);
  const [allRecordings, setAllRecordings] = useState([]);
  const [stats, setStats] = useState({ total: 0, hours: 0, transcribed: 0, insights: 0 });
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState(null);
  const audioRef = React.useRef(null);

  const fetchDashboardData = async () => {
    if (!user) return;

    // Fetch ALL recordings for stats
    const { data: allData } = await supabase
      .from('recordings')
      .select('*')
      .order('created_at', { ascending: false });

    if (allData) {
      setAllRecordings(allData);
      // Show latest 5 for the list
      setRecordings(allData.slice(0, 5).map(r => ({ ...r })));

      const totalDuration = allData.reduce((acc, r) => acc + (r.duration_seconds || 0), 0);
      setStats({
        total: allData.length,
        hours: (totalDuration / 3600).toFixed(1),
        transcribed: allData.filter(r => r.status === 'transcribed' || r.status === 'analyzed').length,
        insights: allData.filter(r => r.status === 'analyzed').length,
      });
    }
    setLoading(false);
  };

  useEffect(() => { fetchDashboardData(); }, [user]);

  // ── Supabase Realtime: auto-update dashboard ──
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'recordings',
      }, () => {
        fetchDashboardData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Audio playback
  const togglePlay = (rec, e) => {
    e.stopPropagation();
    if (!rec.file_url) return;
    if (playingId === rec.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.src = rec.file_url;
      audioRef.current.play().catch(() => {});
    }
    setPlayingId(rec.id);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnd = () => setPlayingId(null);
    audio.addEventListener('ended', onEnd);
    return () => audio.removeEventListener('ended', onEnd);
  }, []);

  // Helper to get display name
  const getRecName = (rec) => rec.contacts?.name || rec.phone_number || 'Untitled Recording';

  // Mini sparkline SVG
  const Sparkline = () => (
    <svg viewBox="0 0 120 40" className="w-full h-10 mt-3">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366F1" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0 30 Q10 28, 20 25 T40 20 T60 15 T80 18 T100 10 T120 8" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
      <path d="M0 30 Q10 28, 20 25 T40 20 T60 15 T80 18 T100 10 T120 8 V40 H0 Z" fill="url(#sparkGrad)" />
    </svg>
  );

  // Donut chart
  const statusColors = { pending: '#F59E0B', transcribed: '#10B981', analyzed: '#6366F1', error: '#EF4444' };

  const DonutChart = () => {
    const total = Math.max(stats.total, 1);
    const segments = [
      { label: 'Pending', count: stats.total - stats.transcribed, color: statusColors.pending },
      { label: 'Transcribed', count: stats.transcribed - stats.insights, color: statusColors.transcribed },
      { label: 'AI Ready', count: stats.insights, color: statusColors.analyzed },
    ].filter(s => s.count > 0);

    if (segments.length === 0) segments.push({ label: 'No Data', count: 1, color: '#E5E7EB' });

    let cumulativePercent = 0;
    const radius = 40, circumference = 2 * Math.PI * radius;

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {segments.map((seg, i) => {
              const percent = seg.count / total;
              const dashArray = `${percent * circumference} ${circumference}`;
              const dashOffset = -cumulativePercent * circumference;
              cumulativePercent += percent;
              return (
                <circle key={i} cx="50" cy="50" r={radius} fill="none" stroke={seg.color}
                  strokeWidth="10" strokeDasharray={dashArray} strokeDashoffset={dashOffset}
                  strokeLinecap="round" className="transition-all duration-700" />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold text-gray-900">{stats.total}</span>
            <span className="text-[10px] text-gray-400 font-medium">TOTAL</span>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {[
            { label: 'Pending', color: statusColors.pending },
            { label: 'Transcribed', color: statusColors.transcribed },
            { label: 'AI Ready', color: statusColors.analyzed },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#EEF2F9] font-sans p-0 lg:p-5">
      <Sidebar />
      <audio ref={audioRef} className="hidden" />

      <div className="bg-white rounded-none lg:rounded-[40px] shadow-sm lg:ml-[108px] min-h-screen lg:min-h-[calc(100vh-40px)] overflow-hidden pb-24 lg:pb-8 relative">

        {/* ── Top Bar ── */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-50 px-4 lg:px-10 pb-4 lg:pb-8" style={{ paddingTop: 'max(2rem, calc(env(safe-area-inset-top) + 1rem))' }}>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl lg:text-[56px] font-extrabold text-gray-900 tracking-tight">Dashboard</h1>

            {/* User */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">User {user?.phone?.slice(-4) || ''}</p>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Personal</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-200">
                  {user?.phone ? user.phone.slice(-2) : 'U'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ── Dashboard Content ── */}
        <div className="px-3 lg:px-8 pt-4 lg:pt-6">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Left Column (2/3) ── */}
            <div className="lg:col-span-2 space-y-6">

              {/* ── Stat Cards ── */}
              <div className="grid grid-cols-2 gap-3 lg:gap-6">
                {/* Recordings Card */}
                <div className="bg-white rounded-2xl border border-gray-100 p-4 lg:p-6 shadow-sm">
                  <h3 className="text-xs lg:text-sm font-semibold text-gray-500 mb-1">Total Recordings</h3>
                  <div className="flex items-baseline gap-1 lg:gap-2 mb-1">
                    <span className="text-2xl lg:text-3xl font-extrabold text-gray-900">{stats.total}</span>
                    <span className="text-[10px] lg:text-xs font-semibold text-emerald-500 hidden sm:flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" /> recorded
                    </span>
                  </div>
                  <Sparkline />
                  <div className="flex justify-between mt-1 px-1">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                      <span key={d} className="text-[10px] text-gray-400">{d}</span>
                    ))}
                  </div>
                </div>

                {/* Transcriptions Card */}
                <div className="bg-white rounded-2xl border border-gray-100 p-4 lg:p-6 shadow-sm">
                  <h3 className="text-xs lg:text-sm font-semibold text-gray-500 mb-1">Transcriptions</h3>
                  <div className="flex items-baseline gap-1 lg:gap-2 mb-2 lg:mb-4">
                    <span className="text-2xl lg:text-3xl font-extrabold text-gray-900">{stats.transcribed}</span>
                    <span className="text-[10px] lg:text-xs font-medium text-gray-400">completed</span>
                  </div>

                  {/* Status pills */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {allRecordings.length > 0 ? allRecordings.slice(0, 8).map((r, i) => (
                      <div key={i}
                        className={`w-9 h-5 rounded-md ${r.status === 'analyzed' ? 'bg-indigo-500' :
                            r.status === 'transcribed' ? 'bg-emerald-500' :
                              r.status === 'error' ? 'bg-red-500' : 'bg-amber-400'}`}
                        title={`${r.status} — ${r.phone_number || 'Untitled'}`}
                      ></div>
                    )) : Array(6).fill(0).map((_, i) => (
                      <div key={i} className="w-9 h-5 rounded-md bg-gray-100"></div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-3 mt-4">
                    {[
                      { label: 'Pending', color: 'bg-amber-400' },
                      { label: 'Done', color: 'bg-emerald-500' },
                      { label: 'AI', color: 'bg-indigo-500' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[10px] text-gray-400">
                        <div className={`w-2 h-2 rounded-sm ${item.color}`}></div>
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── AI Card ── */}
              <div className="relative bg-gradient-to-br from-amber-400 via-amber-400 to-orange-400 rounded-2xl p-4 lg:p-7 overflow-hidden shadow-sm">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full"></div>
                <div className="absolute -bottom-8 -right-4 w-28 h-28 bg-white/10 rounded-full"></div>
                <div className="relative z-10 max-w-md">
                  <div className="flex items-center gap-2 mb-2 lg:mb-3">
                    <Brain className="w-5 h-5 lg:w-6 lg:h-6 text-amber-900" />
                    <span className="text-[10px] lg:text-xs font-bold uppercase tracking-wider text-amber-900/70">New Feature</span>
                  </div>
                  <h3 className="text-lg lg:text-2xl font-extrabold text-gray-900 mb-1 lg:mb-2">Optimize with AI Analysis</h3>
                  <p className="text-xs lg:text-sm text-amber-900/70 mb-3 lg:mb-5 leading-relaxed">
                    Get intelligent summaries, sentiment scores, and action items from every call.
                  </p>
                  <button onClick={() => navigate('/recordings')}
                    className="bg-gray-900 text-white font-semibold text-xs lg:text-sm px-4 lg:px-5 py-2 lg:py-2.5 rounded-xl hover:bg-gray-800 transition-all hover:shadow-lg flex items-center gap-2">
                    Try Now <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ── Recent Recordings ── */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 lg:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-gray-900">Recent Recordings</h3>
                  <button onClick={() => navigate('/recordings')}
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1">
                    View all <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-50 animate-pulse rounded-xl"></div>)}
                  </div>
                ) : recordings.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Mic className="w-7 h-7 text-gray-300" />
                    </div>
                    <h4 className="text-base font-semibold text-gray-900 mb-1">No recordings yet</h4>
                    <p className="text-sm text-gray-400 mb-5">Upload your first call to get started</p>
                    <button onClick={() => navigate('/recordings')}
                      className="bg-gray-900 text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-all">
                      Upload Recording
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {recordings.map((rec) => (
                      <div key={rec.id}
                        className="flex items-center gap-4 py-3.5 cursor-pointer hover:bg-gray-50 -mx-3 px-3 rounded-xl transition-colors group"
                        onClick={() => navigate(`/analysis/${rec.id}`)}>
                        {/* Avatar */}
                        <div className="relative">
                          <div className="w-11 h-11 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                            <span className="text-gray-500 font-semibold text-sm">
                              {getRecName(rec).charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">{getRecName(rec)}</h4>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(rec.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            {rec.duration_seconds ? ` · ${Math.floor(rec.duration_seconds / 60)}:${String(Math.round(rec.duration_seconds % 60)).padStart(2, '0')}` : ''}
                          </p>
                        </div>

                        {/* Status */}
                        <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg ${
                          rec.status === 'analyzed' ? 'bg-indigo-50 text-indigo-600' :
                          rec.status === 'transcribed' ? 'bg-emerald-50 text-emerald-600' :
                          rec.status === 'error' ? 'bg-red-50 text-red-500' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {rec.status === 'analyzed' ? 'AI Ready' :
                           rec.status === 'transcribed' ? 'Done' :
                           rec.status === 'error' ? 'Error' : 'Processing'}
                        </span>

                        {/* Play button */}
                        <button 
                          onClick={(e) => togglePlay(rec, e)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                            playingId === rec.id 
                              ? 'bg-indigo-600 text-white' 
                              : 'bg-indigo-50 text-indigo-600 opacity-0 group-hover:opacity-100'
                          }`}>
                          {playingId === rec.id 
                            ? <Pause className="w-4 h-4" /> 
                            : <Play className="w-4 h-4 fill-current ml-0.5" />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Right Column (1/3) ── */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 lg:p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  {[
                    { icon: <Sparkles className="w-5 h-5" />, label: 'AI Insights', value: stats.insights, color: 'bg-amber-50 text-amber-600' },
                    { icon: <FileText className="w-5 h-5" />, label: 'Transcriptions Done', value: stats.transcribed, color: 'bg-emerald-50 text-emerald-600' },
                    { icon: <Clock className="w-5 h-5" />, label: 'Hours Recorded', value: stats.hours, color: 'bg-indigo-50 text-indigo-600' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50/80 hover:bg-gray-50 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                          {item.icon}
                        </div>
                        <span className="text-sm font-medium text-gray-700">{item.label}</span>
                      </div>
                      <span className="text-lg font-extrabold text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Donut */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 lg:p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-5">Recordings by Status</h3>
                <DonutChart />
              </div>

              {/* Quick Upload */}
              <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200 relative overflow-hidden">
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full"></div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full"></div>
                <div className="relative z-10">
                  <Mic className="w-8 h-8 mb-3 text-white/80" />
                  <h4 className="text-lg font-bold mb-1">Upload a Recording</h4>
                  <p className="text-sm text-white/70 mb-4 leading-relaxed">
                    Drop an audio file to get instant transcription and AI analysis.
                  </p>
                  <button onClick={() => navigate('/recordings')}
                    className="bg-white text-indigo-600 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-indigo-50 transition-all flex items-center gap-2">
                    Go to Recordings <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
