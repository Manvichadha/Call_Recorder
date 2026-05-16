import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { 
  Filter, Play, Pause, UploadCloud, Loader2, 
  Download, Trash2, Clock, Brain
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import axios from 'axios';

export default function Recordings() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [playingId, setPlayingId] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [filterStatus, setFilterStatus] = useState('all');
  const audioRef = useRef(null);

  const fetchRecordings = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('recordings')
      .select('*, contacts(name, avatar_url)')
      .order('created_at', { ascending: false });
    if (!error && data) setRecordings(data);
    setLoading(false);
  };

  useEffect(() => { fetchRecordings(); }, [user]);

  // ── Supabase Realtime: auto-update when recordings change ──
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('recordings-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'recordings',
      }, () => {
        fetchRecordings();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Audio player logic
  const togglePlay = (rec) => {
    if (playingId === rec.id) {
      if (audioRef.current?.paused) {
        audioRef.current.play();
      } else {
        audioRef.current?.pause();
        setPlayingId(null);
      }
      return;
    }
    setPlayingId(rec.id);
    setCurrentTime(0);
    setDuration(0);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !playingId) return;

    const playing = recordings.find(r => r.id === playingId);
    if (!playing?.file_url) return;

    audio.src = playing.file_url;
    audio.play().catch(() => {});

    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    const onEnd = () => setPlayingId(null);

    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('ended', onEnd);

    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('ended', onEnd);
    };
  }, [playingId]);

  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  // ── Extract audio duration client-side ──
  const getAudioDuration = (file) => {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.addEventListener('loadedmetadata', () => {
        resolve(Math.round(audio.duration));
      });
      audio.addEventListener('error', () => resolve(0));
      audio.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;
    try {
      setUploading(true);

      // Extract filename (without extension) to use as recording name
      const recordingName = file.name.replace(/\.[^/.]+$/, '');

      // Extract duration from audio file
      const durationSecs = await getAudioDuration(file);

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}_${recordingName}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('recordings').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('recordings').getPublicUrl(fileName);

      const { data: dbData, error: dbError } = await supabase
        .from('recordings')
        .insert({
          user_id: user.id,
          file_url: publicUrl,
          file_size_bytes: file.size,
          phone_number: recordingName,         // Store filename as display name
          duration_seconds: durationSecs || null,
          status: 'pending',
        })
        .select().single();
      if (dbError) throw dbError;

      // Trigger transcription
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      await axios.post(`${API_URL}/api/transcribe`, {
        recordingId: dbData.id,
        audioUrl: publicUrl,
      });

      fetchRecordings();
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // ── Delete a recording ──
  const handleDelete = async (recId) => {
    if (!confirm('Delete this recording?')) return;
    const { error } = await supabase.from('recordings').delete().eq('id', recId);
    if (!error) fetchRecordings();
  };

  const filteredRecordings = recordings.filter(r => {
    return filterStatus === 'all' || r.status === filterStatus;
  });

  const statusCounts = {
    all: recordings.length,
    pending: recordings.filter(r => r.status === 'pending').length,
    transcribed: recordings.filter(r => r.status === 'transcribed').length,
    analyzed: recordings.filter(r => r.status === 'analyzed').length,
  };

  // Helper to get display name for a recording
  const getRecName = (rec) => rec.contacts?.name || rec.phone_number || 'Untitled Recording';

  return (
    <div className="min-h-screen bg-[#EEF2F9] font-sans p-0 lg:p-5">
      <Sidebar />
      <audio ref={audioRef} className="hidden" />

      <div className="bg-white rounded-none lg:rounded-[40px] shadow-sm lg:ml-[108px] min-h-screen lg:min-h-[calc(100vh-40px)] overflow-hidden pb-24 lg:pb-8 relative">
        {/* ── Header ── */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-50 px-4 lg:px-10 pb-4 lg:pb-8" style={{ paddingTop: 'max(2rem, calc(env(safe-area-inset-top) + 1rem))' }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl lg:text-[56px] font-extrabold text-gray-900 tracking-tight">Recordings</h1>
              <p className="text-xs lg:text-sm text-gray-400 mt-1 lg:mt-6">{recordings.length} total recordings</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Upload button */}
              <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" id="audio-upload" disabled={uploading} />
              <label htmlFor="audio-upload" 
                className="h-10 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95 transition-transform cursor-pointer gap-2 text-sm font-semibold">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                <span className="hidden sm:inline">{uploading ? 'Uploading...' : 'Upload'}</span>
              </label>
            </div>
          </div>
        </header>

        <div className="px-3 lg:px-8 pt-4 lg:pt-6">
          {/* ── Filter Tabs ── */}
          <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
            {[
              { key: 'all', label: 'All' },
              { key: 'pending', label: 'Pending' },
              { key: 'transcribed', label: 'Transcribed' },
              { key: 'analyzed', label: 'AI Ready' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilterStatus(f.key)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                  filterStatus === f.key
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {f.label} <span className="ml-1 text-xs opacity-60">{statusCounts[f.key]}</span>
              </button>
            ))}
          </div>

          {/* ── Recordings List ── */}
          {loading ? (
            <div className="space-y-4">
              {[1,2,3,4].map(i => <div key={i} className="h-20 bg-white animate-pulse rounded-2xl border border-gray-100" />)}
            </div>
          ) : filteredRecordings.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <UploadCloud className="w-9 h-9 text-gray-300" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">No recordings found</h4>
              <p className="text-sm text-gray-400 mb-6">Upload your first call recording to get started.</p>
              <label htmlFor="audio-upload" className="inline-flex items-center gap-2 bg-gray-900 text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-gray-800 transition-all cursor-pointer">
                <UploadCloud className="w-4 h-4" /> Upload Recording
              </label>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Table Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50/80 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <div className="col-span-4">Recording</div>
                <div className="col-span-2">Date</div>
                <div className="col-span-2">Duration</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {/* Recording Rows */}
              <div className="divide-y divide-gray-50">
                {filteredRecordings.map((rec) => {
                  const isPlaying = playingId === rec.id;
                  const name = getRecName(rec);
                  return (
                    <div key={rec.id} className="group hover:bg-gray-50/50 transition-colors">
                      {/* Desktop Row */}
                      <div className="hidden md:grid grid-cols-12 gap-4 items-center px-6 py-4">
                        {/* Name + Play */}
                        <div className="col-span-4 flex items-center gap-3">
                          <button
                            onClick={() => togglePlay(rec)}
                            disabled={!rec.file_url}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                              isPlaying
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                : 'bg-gray-100 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'
                            } ${!rec.file_url ? 'opacity-30 cursor-not-allowed' : ''}`}
                          >
                            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                          </button>
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">{name}</h4>
                            {isPlaying && (
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden max-w-[120px]">
                                  <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}></div>
                                </div>
                                <span className="text-[10px] text-gray-400 tabular-nums">{formatTime(currentTime)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Date */}
                        <div className="col-span-2">
                          <span className="text-sm text-gray-500">{new Date(rec.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>

                        {/* Duration */}
                        <div className="col-span-2">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-sm text-gray-500 tabular-nums">
                              {rec.duration_seconds 
                                ? `${Math.floor(rec.duration_seconds / 60)}:${String(Math.round(rec.duration_seconds % 60)).padStart(2, '0')}` 
                                : '—'}
                            </span>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="col-span-2">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${
                            rec.status === 'analyzed' ? 'bg-indigo-50 text-indigo-600' : 
                            rec.status === 'transcribed' ? 'bg-emerald-50 text-emerald-600' :
                            rec.status === 'error' ? 'bg-red-50 text-red-500' :
                            'bg-amber-50 text-amber-600'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              rec.status === 'analyzed' ? 'bg-indigo-500' :
                              rec.status === 'transcribed' ? 'bg-emerald-500' :
                              rec.status === 'error' ? 'bg-red-500' :
                              'bg-amber-500 animate-pulse'
                            }`}></div>
                            {rec.status === 'analyzed' ? 'AI Ready' : 
                             rec.status === 'transcribed' ? 'Transcribed' : 
                             rec.status === 'error' ? 'Error' : 'Processing...'}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="col-span-2 flex items-center justify-end gap-1">
                          {(rec.status === 'analyzed' || rec.status === 'transcribed') && (
                            <button 
                              onClick={() => navigate(`/analysis/${rec.id}`)}
                              className="h-8 px-3 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
                            >
                              <Brain className="w-3.5 h-3.5" /> View
                            </button>
                          )}
                          {rec.file_url && (
                            <a href={rec.file_url} target="_blank" rel="noopener noreferrer"
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all opacity-0 group-hover:opacity-100">
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                          <button 
                            onClick={() => handleDelete(rec.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Mobile Card */}
                      <div className="md:hidden px-3 py-3" onClick={() => {
                        if (rec.status === 'analyzed' || rec.status === 'transcribed') navigate(`/analysis/${rec.id}`);
                      }}>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); togglePlay(rec); }}
                            disabled={!rec.file_url}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              isPlaying ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">{name}</h4>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {new Date(rec.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              {rec.duration_seconds ? ` · ${formatTime(rec.duration_seconds)}` : ''}
                            </p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 ${
                            rec.status === 'analyzed' ? 'bg-indigo-50 text-indigo-600' : 
                            rec.status === 'transcribed' ? 'bg-emerald-50 text-emerald-600' :
                            'bg-amber-50 text-amber-600'
                          }`}>
                            {rec.status === 'analyzed' ? 'AI' : rec.status === 'transcribed' ? 'Done' : '...'}
                          </span>
                        </div>
                        {isPlaying && (
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}></div>
                            </div>
                            <span className="text-xs text-gray-400 tabular-nums">{formatTime(currentTime)} / {formatTime(duration)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
