import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import Sidebar from '../components/Sidebar';
import { 
  Play, Pause, ArrowLeft, Download, Trash2,
  FileText, Brain, BarChart3, Info, Clock, 
  HardDrive, Calendar, ChevronRight, Sparkles, 
  CheckCircle2, AlertTriangle, Mic
} from 'lucide-react';

/* ── Status column config ── */
const STATUS_COLS = [
  { key: 'pending', label: 'PENDING', color: 'bg-amber-500', badgeBg: 'bg-amber-50 text-amber-600' },
  { key: 'transcribed', label: 'TRANSCRIBED', color: 'bg-emerald-500', badgeBg: 'bg-emerald-50 text-emerald-600' },
  { key: 'analyzed', label: 'AI READY', color: 'bg-indigo-500', badgeBg: 'bg-indigo-50 text-indigo-600' },
  { key: 'error', label: 'ERROR', color: 'bg-red-500', badgeBg: 'bg-red-50 text-red-500' },
];

export default function Analysis() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  /* ── List view state (no id) ── */
  const [allRecordings, setAllRecordings] = useState([]);
  const [listFilter, setListFilter] = useState('all');
  const [listLoading, setListLoading] = useState(true);

  /* ── Detail view state (with id) ── */
  const [recording, setRecording] = useState(null);
  const [activeTab, setActiveTab] = useState('transcript');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  // Helper for display name
  const getRecName = (rec) => rec?.contacts?.name || rec?.phone_number || 'Untitled Recording';

  /* ── Fetch all recordings for list view ── */
  const fetchAll = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('recordings')
      .select('*, contacts(name, phone_number)')
      .order('created_at', { ascending: false });
    setAllRecordings(data || []);
    setListLoading(false);
  };

  useEffect(() => {
    if (id) return;
    fetchAll();
  }, [id, user]);

  /* ── Fetch single recording for detail view ── */
  const fetchRec = async () => {
    if (!id) return;
    const { data } = await supabase
      .from('recordings')
      .select('*, contacts(*)')
      .eq('id', id)
      .single();
    if (data) setRecording(data);
  };

  useEffect(() => { fetchRec(); }, [id]);

  /* ── Supabase Realtime: auto-update when recording changes ── */
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('analysis-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recordings' }, () => {
        if (id) fetchRec(); else fetchAll();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, id]);

  // Audio playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    const onEnd = () => setIsPlaying(false);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('ended', onEnd);
    };
  }, [recording]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); } else { audioRef.current.play(); }
    setIsPlaying(!isPlaying);
  };

  const seekTo = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const finalDuration = recording?.duration_seconds || duration;
    if (audioRef.current && finalDuration && isFinite(finalDuration)) {
      audioRef.current.currentTime = percent * finalDuration;
    }
  };

  const formatTime = (s) => {
    if (!s || isNaN(s) || !isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  /* ══════════════════════════════════════════
     LIST VIEW — /analysis (no id)
     ══════════════════════════════════════════ */
  if (!id) {
    const filtered = listFilter === 'all' ? allRecordings : allRecordings.filter(r => r.status === listFilter);
    const countByStatus = (s) => allRecordings.filter(r => r.status === s).length;
    const filterTabs = [
      { key: 'all', label: 'All' },
      { key: 'pending', label: 'Pending' },
      { key: 'transcribed', label: 'Transcribed' },
      { key: 'analyzed', label: 'AI Ready' },
    ];

    return (
      <div className="min-h-screen bg-[#EEF2F9] font-sans p-0 lg:p-5">
        <Sidebar />
        <div className="bg-white rounded-none lg:rounded-[40px] shadow-sm lg:ml-[108px] min-h-screen lg:min-h-[calc(100vh-40px)] overflow-hidden pb-24 lg:pb-8 relative">
          <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-50 px-4 lg:px-10 pb-4 lg:pb-8" style={{ paddingTop: 'max(2rem, calc(env(safe-area-inset-top) + 1rem))' }}>
            <h1 className="text-2xl lg:text-[56px] font-extrabold text-gray-900 tracking-tight">AI Analysis</h1>
            <p className="text-xs lg:text-sm text-gray-400 mt-1 lg:mt-6">{allRecordings.length} recordings · {countByStatus('analyzed')} analyzed</p>
          </header>

          <div className="px-3 lg:px-8 pt-4 lg:pt-6">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mb-8">
              {filterTabs.map(tab => (
                <button key={tab.key} onClick={() => setListFilter(tab.key)}
                  className={`px-3 lg:px-5 py-1.5 lg:py-2 rounded-full text-xs lg:text-sm font-semibold transition-all ${
                    listFilter === tab.key
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {listLoading ? (
              <div className="text-center py-20 text-gray-400">Loading recordings...</div>
            ) : allRecordings.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-7 h-7 text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">No recordings yet</h3>
                <p className="text-sm text-gray-400 mb-5">Upload a recording to get AI analysis</p>
                <button onClick={() => navigate('/recordings')} className="bg-gray-900 text-white font-semibold text-sm px-5 py-2.5 rounded-xl">
                  Go to Recordings
                </button>
              </div>
            ) : (
              /* ── Kanban Columns ── */
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-5">
                {STATUS_COLS.filter(col => listFilter === 'all' || col.key === listFilter).map(col => {
                  const colRecs = allRecordings.filter(r => r.status === col.key);
                  return (
                    <div key={col.key} className="min-w-0 bg-gray-50/60 rounded-[24px] p-4 border border-gray-100/80">
                      <div className="flex items-center gap-2 mb-5 px-1 border-b border-gray-200/60 pb-3">
                        <div className={`w-2 h-2 rounded-full ${col.color}`}></div>
                        <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">{col.label}</h3>
                        <span className="text-[10px] font-bold text-gray-500 bg-white shadow-sm border border-gray-100 rounded-full px-2 py-0.5 ml-auto">{colRecs.length}</span>
                      </div>
                      <div className="space-y-3">
                        {colRecs.length === 0 ? (
                          <div className="border-2 border-dashed border-gray-200/80 bg-gray-50/50 rounded-2xl py-10 flex flex-col items-center justify-center text-gray-400">
                            <span className="text-xs font-medium">No recordings</span>
                          </div>
                        ) : colRecs.map(rec => (
                          <div key={rec.id} onClick={() => navigate(`/analysis/${rec.id}`)}
                            className="bg-white border border-gray-100/80 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-indigo-200 hover:-translate-y-0.5 cursor-pointer transition-all duration-200 group">
                            <div className="flex items-center justify-end mb-3">
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${col.badgeBg}`}>{col.label}</span>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-start gap-2.5 text-gray-800 font-semibold">
                                <Mic className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                                <span className="line-clamp-2 leading-snug">{getRecName(rec)}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium pl-6.5">
                                <Calendar className="w-3.5 h-3.5 opacity-70" />
                                <span>
                                  {new Date(rec.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  {rec.duration_seconds ? ` · ${Math.floor(rec.duration_seconds / 60)}:${String(Math.round(rec.duration_seconds % 60)).padStart(2, '0')}` : ''}
                                </span>
                              </div>
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
        </div>
      </div>
    );
  }

  /* ── Detail view loading ── */
  if (!recording) return (
    <div className="min-h-screen bg-[#EEF2F9] flex items-center justify-center">
      <Sidebar />
      <div className="text-gray-400 text-lg">Loading...</div>
    </div>
  );

  const tabs = [
    { key: 'transcript', label: 'Transcript', icon: FileText },
    { key: 'analysis', label: 'AI Analysis', icon: Brain },
    { key: 'details', label: 'Details', icon: Info },
  ];

  return (
    <div className="min-h-screen bg-[#EEF2F9] font-sans p-0 lg:p-5">
      <Sidebar />
      {recording.file_url && <audio ref={audioRef} src={recording.file_url} preload="metadata" />}

      <div className="bg-white rounded-none lg:rounded-[40px] shadow-sm lg:ml-[108px] min-h-screen lg:min-h-[calc(100vh-40px)] overflow-hidden pb-24 lg:pb-8 relative">
        {/* ── Header ── */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-50 px-4 lg:px-10 pb-4 lg:pb-8" style={{ paddingTop: 'max(2rem, calc(env(safe-area-inset-top) + 1rem))' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 lg:gap-3 min-w-0">
              <button onClick={() => navigate('/recordings')} className="w-8 h-8 lg:w-9 lg:h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-all shadow-sm shrink-0">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="min-w-0">
                <h1 className="text-xl lg:text-[56px] font-extrabold text-gray-900 tracking-tight truncate">
                  {getRecName(recording)}
                </h1>
                <p className="text-[10px] lg:text-xs text-gray-400 mt-0.5 lg:mt-3">
                  {new Date(recording.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[10px] lg:text-xs font-bold px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg ${
                recording.status === 'analyzed' ? 'bg-indigo-50 text-indigo-600' : 
                recording.status === 'transcribed' ? 'bg-emerald-50 text-emerald-600' :
                'bg-amber-50 text-amber-600'
              }`}>
                {recording.status === 'analyzed' ? '✨ AI Ready' : recording.status === 'transcribed' ? '✅ Done' : '⏳ Pending'}
              </span>
            </div>
          </div>
        </header>

        <div className="px-3 lg:px-8 pt-4 lg:pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Left Column (2/3) ── */}
            <div className="lg:col-span-2 space-y-6">

              {/* ── Audio Player Card ── */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 lg:p-6 shadow-sm">
                <div className="flex items-center gap-3 lg:gap-4 mb-3 lg:mb-5">
                  <button
                    onClick={togglePlay}
                    className={`w-11 h-11 lg:w-14 lg:h-14 rounded-2xl flex items-center justify-center transition-all shrink-0 ${
                      isPlaying 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                        : 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200'
                    }`}
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-gray-900 truncate">{getRecName(recording)}</h3>
                    <p className="text-sm text-gray-400">{formatTime(currentTime)} / {formatTime(recording.duration_seconds || duration)}</p>
                  </div>
                  <div className="flex gap-1.5">
                    {recording.file_url && (
                      <a href={recording.file_url} target="_blank" rel="noopener noreferrer" 
                        className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all">
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="cursor-pointer" onClick={seekTo}>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full transition-all duration-200" 
                      style={{ width: `${(recording.duration_seconds || duration) ? (currentTime / (recording.duration_seconds || duration)) * 100 : 0}%` }}></div>
                  </div>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-gray-400 tabular-nums">{formatTime(currentTime)}</span>
                  <span className="text-xs text-gray-400 tabular-nums">{formatTime(recording.duration_seconds || duration)}</span>
                </div>
              </div>

              {/* ── Tabs ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex border-b border-gray-100">
                  {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button 
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-all border-b-2 ${
                          activeTab === tab.key 
                            ? 'text-indigo-600 border-indigo-600 bg-indigo-50/30' 
                            : 'text-gray-400 border-transparent hover:text-gray-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="p-6">
                  {/* Transcript Tab */}
                  {activeTab === 'transcript' && (
                    <div>
                      {recording.transcript_text ? (
                        <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">{recording.transcript_text}</div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <FileText className="w-6 h-6 text-amber-500 animate-pulse" />
                          </div>
                          <p className="text-sm font-medium text-gray-700">Transcript is being generated...</p>
                          <p className="text-xs text-gray-400 mt-1">This usually takes 1-2 minutes. The page will auto-update.</p>
                          <div className="flex justify-center gap-1 mt-4">
                            <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                            <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                            <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Analysis Tab */}
                  {activeTab === 'analysis' && (
                    <div className="space-y-5">
                      {recording.status !== 'analyzed' ? (
                        <div className="text-center py-12">
                          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <Brain className="w-6 h-6 text-indigo-500 animate-pulse" />
                          </div>
                          <p className="text-sm font-medium text-gray-700">AI Analysis in progress...</p>
                          <p className="text-xs text-gray-400 mt-1">Results will appear automatically when ready.</p>
                        </div>
                      ) : (
                        <>
                          {/* Summary */}
                          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                            <div className="flex items-center gap-2 mb-3">
                              <Sparkles className="w-4 h-4 text-amber-500" />
                              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Summary</h4>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                              {recording.summary || 'No summary available.'}
                            </p>
                          </div>

                          {/* Sentiment — real data */}
                          {(() => {
                            let sent = { positive: 33, negative: 33, neutral: 34 };
                            try {
                              if (recording.sentiment) {
                                const parsed = typeof recording.sentiment === 'string' ? JSON.parse(recording.sentiment) : recording.sentiment;
                                if (parsed.positive !== undefined) sent = parsed;
                              }
                            } catch {}
                            return (
                              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                                <div className="flex items-center gap-2 mb-4">
                                  <BarChart3 className="w-4 h-4 text-indigo-500" />
                                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Sentiment Analysis</h4>
                                </div>
                                <div className="w-full h-3 rounded-full overflow-hidden flex bg-gray-200">
                                  <div className="bg-red-400 h-full transition-all" style={{width: `${sent.negative}%`}} />
                                  <div className="bg-gray-400 h-full transition-all" style={{width: `${sent.neutral}%`}} />
                                  <div className="bg-emerald-400 h-full transition-all" style={{width: `${sent.positive}%`}} />
                                </div>
                                <div className="flex justify-between mt-3 text-xs font-semibold">
                                  <span className="text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Negative {sent.negative}%</span>
                                  <span className="text-gray-400">Neutral {sent.neutral}%</span>
                                  <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Positive {sent.positive}%</span>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Key Highlights — real data */}
                          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                            <div className="flex items-center gap-2 mb-3">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Key Highlights</h4>
                            </div>
                            {recording.action_items && Array.isArray(recording.action_items) && recording.action_items.length > 0 ? (
                              <ul className="space-y-2.5">
                                {recording.action_items.map((item, i) => (
                                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                                    <div className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    </div>
                                    <span>{typeof item === 'string' ? item : item.text || JSON.stringify(item)}{item.count ? ` (mentioned ${item.count}×)` : ''}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-400">No highlights extracted.</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Details Tab */}
                  {activeTab === 'details' && (
                    <div className="space-y-3">
                      {[
                        { icon: Mic, label: 'Recording', value: getRecName(recording) },
                        { icon: Calendar, label: 'Date & Time', value: new Date(recording.created_at).toLocaleString() },
                        { icon: Clock, label: 'Duration', value: recording.duration_seconds ? `${Math.floor(recording.duration_seconds / 60)}:${String(Math.round(recording.duration_seconds % 60)).padStart(2, '0')}` : 'Unknown' },
                        { icon: HardDrive, label: 'File Size', value: recording.file_size_bytes ? `${(recording.file_size_bytes / 1024 / 1024).toFixed(2)} MB` : 'Unknown' },
                        { icon: Brain, label: 'Status', value: recording.status?.charAt(0).toUpperCase() + recording.status?.slice(1) },
                      ].map((item, i) => {
                        const Icon = item.icon;
                        return (
                          <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                                <Icon className="w-4 h-4" />
                              </div>
                              <span className="text-sm text-gray-500">{item.label}</span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{item.value}</span>
                          </div>
                        );
                      })}

                      {/* Delete button */}
                      <div className="pt-4">
                        <button 
                          onClick={async () => {
                            if (!confirm('Delete this recording permanently?')) return;
                            await supabase.from('recordings').delete().eq('id', recording.id);
                            navigate('/recordings');
                          }}
                          className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 rounded-xl border border-red-100 text-red-500 text-sm font-semibold hover:bg-red-100 transition-all">
                          <Trash2 className="w-4 h-4" /> Delete Recording
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Right Column (1/3) ── */}
            <div className="space-y-6">
              {/* Quick Info Card */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Recording Info</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                      {getRecName(recording)[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{getRecName(recording)}</p>
                      <p className="text-xs text-gray-400">{new Date(recording.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-50 pt-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Status</span>
                      <span className="font-semibold text-gray-900 capitalize">{recording.status}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Created</span>
                      <span className="font-medium text-gray-700">{new Date(recording.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                    {recording.assembly_id && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">AI ID</span>
                        <span className="font-mono text-xs text-gray-500">{recording.assembly_id.slice(0, 12)}...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigate to other recordings */}
              <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200 relative overflow-hidden">
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full"></div>
                <Brain className="w-8 h-8 mb-3 text-white/80" />
                <h4 className="text-base font-bold mb-1">All Recordings</h4>
                <p className="text-sm text-white/70 mb-4">View and manage all your recorded conversations.</p>
                <button 
                  onClick={() => navigate('/recordings')}
                  className="bg-white text-indigo-600 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-indigo-50 transition-all flex items-center gap-2"
                >
                  Browse <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
