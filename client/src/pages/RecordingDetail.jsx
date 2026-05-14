import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Play, Pause, FastForward, MoreVertical, Share2, Download, Trash2 } from 'lucide-react';

export default function RecordingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recording, setRecording] = useState(null);
  const [activeTab, setActiveTab] = useState('transcript'); // transcript | analysis | details
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    async function fetchRec() {
      const { data } = await supabase
        .from('recordings')
        .select('*, contacts(*)')
        .eq('id', id)
        .single();
      if (data) setRecording(data);
    }
    fetchRec();
  }, [id]);

  if (!recording) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#0F0F1A] flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-white/5 sticky top-0 bg-[#0F0F1A]/80 backdrop-blur-md z-10">
        <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-white font-medium">{recording.contacts?.name || recording.phone_number || 'Unknown'}</h2>
          <p className="text-xs text-gray-500">{new Date(recording.created_at).toLocaleDateString()}</p>
        </div>
        <button className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-full">
          <MoreVertical className="w-5 h-5" />
        </button>
      </header>

      {/* Audio Player */}
      <div className="p-6 bg-gradient-to-b from-primary/10 to-transparent">
        <div className="glass-card p-6 rounded-3xl">
          {/* Waveform */}
          <div className="h-16 flex items-center justify-between gap-1 opacity-70 mb-6">
            {Array.from({length: 50}).map((_, i) => (
              <div key={i} className={`w-1.5 rounded-full ${i < 15 ? 'bg-primary' : 'bg-white/20'}`} style={{ height: `${Math.max(10, Math.random() * 100)}%` }} />
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-primary font-medium">01:24</span>
            <span className="text-xs text-gray-500">{Math.floor((recording.duration_seconds || 0) / 60)}:{(recording.duration_seconds || 0) % 60 < 10 ? '0' : ''}{(recording.duration_seconds || 0) % 60}</span>
          </div>

          <div className="flex items-center justify-center gap-6 mt-4">
            <button className="text-gray-400 hover:text-white font-medium text-sm">1x</button>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-14 h-14 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white shadow-lg shadow-primary/30"
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
            </button>
            <button className="text-gray-400 hover:text-white">
              <FastForward className="w-5 h-5 fill-current" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 border-b border-white/10 mt-2">
        {['transcript', 'analysis', 'details'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 pb-3 text-sm font-medium capitalize border-b-2 transition-colors ${activeTab === tab ? 'text-primary border-primary' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-10">
        {activeTab === 'transcript' && (
          <div className="space-y-6">
            {recording.transcript_text ? (
               <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">{recording.transcript_text}</div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-400">Transcript is still generating...</p>
              </div>
            )}
            
            {/* Mock Chat bubbles if no actual transcript text */}
            {!recording.transcript_text && (
              <>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-800 flex-shrink-0" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">{recording.contacts?.name || 'Caller'}</span>
                      <span className="text-xs text-gray-500">00:00</span>
                    </div>
                    <p className="text-gray-300 bg-white/5 p-3 rounded-2xl rounded-tl-sm">Hello, I am calling about the invoice.</p>
                  </div>
                </div>
                <div className="flex gap-3 flex-row-reverse">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center text-primary text-xs font-bold">ME</div>
                  <div className="items-end flex flex-col">
                    <div className="flex items-center gap-2 mb-1 flex-row-reverse">
                      <span className="text-sm font-medium text-white">You</span>
                      <span className="text-xs text-gray-500">00:05</span>
                    </div>
                    <p className="text-white bg-primary p-3 rounded-2xl rounded-tr-sm">Sure, let me pull that up for you right now.</p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-4">
             <div className="glass-card p-4">
               <h4 className="text-sm text-gray-400 uppercase font-bold tracking-wider mb-2">Summary</h4>
               <p className="text-gray-200">{recording.summary || "Client asked about the Q3 invoice and requested a breakdown of the new API charges. Promised to email it by EOD."}</p>
             </div>

             <div className="glass-card p-4">
               <h4 className="text-sm text-gray-400 uppercase font-bold tracking-wider mb-3">Sentiment</h4>
               <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden flex">
                 <div className="bg-red-500 h-full w-[10%]" />
                 <div className="bg-gray-400 h-full w-[60%]" />
                 <div className="bg-green-500 h-full w-[30%]" />
               </div>
               <div className="flex justify-between mt-2 text-xs font-medium">
                 <span className="text-red-400">Negative 10%</span>
                 <span className="text-gray-400">Neutral 60%</span>
                 <span className="text-green-400">Positive 30%</span>
               </div>
             </div>

             <div className="glass-card p-4">
               <h4 className="text-sm text-gray-400 uppercase font-bold tracking-wider mb-2">Action Items</h4>
               <ul className="list-disc pl-4 text-gray-200 space-y-2">
                 <li>Email Q3 invoice breakdown to client</li>
                 <li>Schedule follow-up call for next Tuesday</li>
               </ul>
             </div>
          </div>
        )}

        {activeTab === 'details' && (
          <div className="space-y-4">
            <div className="glass-card p-4 divide-y divide-white/5">
              <div className="py-3 flex justify-between">
                <span className="text-gray-400">Direction</span>
                <span className="text-white capitalize">{recording.direction || 'Inbound'}</span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-gray-400">Date & Time</span>
                <span className="text-white">{new Date(recording.created_at).toLocaleString()}</span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-gray-400">File Size</span>
                <span className="text-white">{(recording.file_size_bytes / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 glass-card p-3 flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-colors">
                <Share2 className="w-5 h-5 text-gray-300" />
                <span className="text-xs text-white">Share</span>
              </button>
              <button className="flex-1 glass-card p-3 flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-colors">
                <Download className="w-5 h-5 text-gray-300" />
                <span className="text-xs text-white">Download</span>
              </button>
              <button className="flex-1 glass-card p-3 flex flex-col items-center justify-center gap-2 hover:bg-red-500/10 hover:border-red-500/30 transition-colors group">
                <Trash2 className="w-5 h-5 text-red-400 group-hover:text-red-500" />
                <span className="text-xs text-red-400 group-hover:text-red-500">Delete</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
