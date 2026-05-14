import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Phone, PhoneOff, Mic, MicOff, User, Delete, Loader2, LayoutGrid } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import axios from 'axios';

export default function Simulator() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callState, setCallState] = useState('idle'); // 'idle', 'dialing', 'connected'
  const [callDuration, setCallDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const handleDial = (digit) => {
    if (phoneNumber.length < 15) setPhoneNumber(prev => prev + digit);
  };

  const handleBackspace = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  const startCall = () => {
    if (!phoneNumber) return;
    setCallState('connected');
    setCallDuration(0);
    setIsMuted(false);
    setShowKeypad(false);
    
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please allow microphone permissions.');
    }
  };

  const stopRecordingAndUpload = async () => {
    return new Promise((resolve, reject) => {
      const mediaRecorder = mediaRecorderRef.current;
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        resolve(null);
        return;
      }

      mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const file = new File([audioBlob], `${phoneNumber || 'simulated_call'}.webm`, { type: 'audio/webm' });
          
          // Upload to Supabase
          const fileName = `${user.id}/${Date.now()}_${file.name}`;
          const { error: uploadError } = await supabase.storage.from('recordings').upload(fileName, file);
          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage.from('recordings').getPublicUrl(fileName);

          // Insert into DB
          const { data: dbData, error: dbError } = await supabase
            .from('recordings')
            .insert({
              user_id: user.id,
              file_url: publicUrl,
              file_size_bytes: file.size,
              phone_number: phoneNumber || 'Simulated Call',
              duration_seconds: callDuration,
              status: 'pending',
            })
            .select()
            .single();

          if (dbError) throw dbError;

          // Trigger backend transcription
          await axios.post('http://localhost:5001/api/transcribe', {
            recordingId: dbData.id,
            audioUrl: publicUrl,
          });

          resolve(dbData);
        } catch (err) {
          console.error('Upload failed:', err);
          reject(err);
        }
      };

      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    });
  };

  const toggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      setIsUploading(true);
      try {
        await stopRecordingAndUpload();
      } catch (error) {
        alert('Failed to save recording: ' + error.message);
      } finally {
        setIsUploading(false);
      }
    } else {
      await startRecording();
    }
  };

  const endCall = async () => {
    clearInterval(timerRef.current);
    
    if (isRecording) {
      setIsRecording(false);
      setIsUploading(true);
      try {
        await stopRecordingAndUpload();
        setCallState('idle');
        setPhoneNumber('');
        navigate('/recordings');
      } catch (error) {
        alert('Failed to save recording: ' + error.message);
        setCallState('idle');
      } finally {
        setIsUploading(false);
      }
    } else {
      setCallState('idle');
      setIsMuted(false);
      setShowKeypad(false);
      setPhoneNumber('');
      navigate('/recordings');
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] font-sans">
      <Sidebar />
      <main className="flex-1 lg:pl-[120px] pb-24 lg:pb-0 p-4 lg:p-8 flex items-center justify-center">
        
        {/* Phone UI Container */}
        <div className="w-full bg-white shadow-2xl overflow-hidden relative flex flex-col mx-auto" style={{ maxWidth: '400px', height: '780px', borderRadius: '48px', border: '8px solid #111827' }}>
          
          {/* Screen Content */}
          <div className="flex-1 flex flex-col bg-slate-50 pt-16 pb-8 px-6 relative">
            
            {/* ── Idle State (Dialer) ── */}
            {callState === 'idle' && (
              <div className="flex-1 flex flex-col">
                <h2 className="text-center text-sm font-semibold text-gray-400 mb-8 uppercase tracking-widest">Simulator</h2>
                
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div style={{ display: 'grid', gridTemplateColumns: '16px 1fr 44px', width: '100%', height: '80px', alignItems: 'center', marginBottom: '24px' }}>
                    <div></div> {/* Spacer */}
                    <div className="hide-scrollbar" style={{ fontSize: '40px', fontWeight: 300, color: '#374151', letterSpacing: '0.05em', whiteSpace: 'nowrap', overflowX: 'auto', textAlign: 'center', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {phoneNumber}
                    </div>
                    <div>
                      {phoneNumber && (
                        <button onClick={handleBackspace} style={{ color: '#9CA3AF', padding: '8px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          <Delete style={{ width: '28px', height: '28px' }} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Numpad */}
                  <div className="flex flex-wrap justify-center w-full mx-auto" style={{ maxWidth: '290px', rowGap: '16px', columnGap: '24px' }}>
                    {[
                      { num: '1', letters: '' }, { num: '2', letters: 'ABC' }, { num: '3', letters: 'DEF' },
                      { num: '4', letters: 'GHI' }, { num: '5', letters: 'JKL' }, { num: '6', letters: 'MNO' },
                      { num: '7', letters: 'PQRS' }, { num: '8', letters: 'TUV' }, { num: '9', letters: 'WXYZ' },
                      { num: '*', letters: '' }, { num: '0', letters: '+' }, { num: '#', letters: '' }
                    ].map(btn => (
                      <button 
                        key={btn.num} 
                        onClick={() => handleDial(btn.num)}
                        className="rounded-full border border-gray-300 bg-transparent flex flex-col items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors shrink-0"
                        style={{ width: '76px', height: '76px' }}
                      >
                        <span className={`font-light text-gray-700 ${!btn.letters ? 'mb-0' : '-mb-1'}`} style={{ fontSize: '36px' }}>{btn.num}</span>
                        {btn.letters && <span className="font-medium text-gray-400 tracking-widest" style={{ fontSize: '9px' }}>{btn.letters}</span>}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center mt-auto pt-6">
                  <button 
                    onClick={startCall}
                    disabled={!phoneNumber}
                    className="rounded-full flex items-center justify-center transition-all shrink-0"
                    style={{ 
                      width: '76px', 
                      height: '76px',
                      backgroundColor: phoneNumber ? '#4CD964' : '#A3ECAE',
                      opacity: phoneNumber ? 1 : 0.5,
                      cursor: phoneNumber ? 'pointer' : 'not-allowed'
                    }}
                  >
                    <Phone className="w-8 h-8 text-white fill-current" />
                  </button>
                </div>
              </div>
            )}

            {/* ── Active / Dialing State ── */}
            {callState !== 'idle' && (
              <div className={`flex-1 flex flex-col items-center pt-10 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-100 to-violet-200 flex items-center justify-center mb-6 shadow-inner">
                  <User className="w-12 h-12 text-indigo-400" />
                </div>
                
                <h1 className="text-3xl font-light text-gray-900 mb-2">{phoneNumber}</h1>
                <p className="text-gray-500 text-sm font-medium mb-12">
                  {callState === 'dialing' ? 'Calling...' : formatTime(callDuration)}
                </p>

                {callState === 'connected' && (
                  <>
                    {showKeypad ? (
                      <div className="flex-1 w-full flex flex-col items-center justify-center mb-auto mt-auto">
                        {/* Active Call Numpad */}
                        <div className="flex flex-wrap justify-center w-full mx-auto" style={{ maxWidth: '290px', rowGap: '12px', columnGap: '20px' }}>
                          {[
                            { num: '1', letters: '' }, { num: '2', letters: 'ABC' }, { num: '3', letters: 'DEF' },
                            { num: '4', letters: 'GHI' }, { num: '5', letters: 'JKL' }, { num: '6', letters: 'MNO' },
                            { num: '7', letters: 'PQRS' }, { num: '8', letters: 'TUV' }, { num: '9', letters: 'WXYZ' },
                            { num: '*', letters: '' }, { num: '0', letters: '+' }, { num: '#', letters: '' }
                          ].map(btn => (
                            <button 
                              key={btn.num} 
                              onClick={() => setPhoneNumber(prev => prev + btn.num)}
                              className="rounded-full border border-gray-300 bg-transparent flex flex-col items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors shrink-0"
                              style={{ width: '64px', height: '64px' }}
                            >
                              <span className={`font-light text-gray-700 ${!btn.letters ? 'mb-0' : '-mb-1'}`} style={{ fontSize: '28px' }}>{btn.num}</span>
                              {btn.letters && <span className="font-medium text-gray-400 tracking-widest" style={{ fontSize: '8px' }}>{btn.letters}</span>}
                            </button>
                          ))}
                        </div>
                        <button 
                          onClick={() => setShowKeypad(false)}
                          className="mt-6 text-[10px] font-bold text-gray-500 hover:text-gray-700 transition-colors tracking-widest bg-white shadow-sm border border-gray-200 py-2 px-6 rounded-full"
                        >
                          HIDE
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-6 w-full mx-auto mb-auto mt-auto" style={{ maxWidth: '280px' }}>
                        {/* Record Button */}
                        <button 
                          onClick={toggleRecording}
                          className={`flex flex-col items-center justify-center gap-2 group ${isRecording ? 'opacity-100' : 'opacity-80 hover:opacity-100'}`}
                        >
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 shadow-lg shadow-red-200 animate-pulse' : 'bg-white shadow-sm border border-gray-200 group-hover:bg-gray-50'}`}>
                            {isRecording ? <Mic className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-gray-600" />}
                          </div>
                          <span className={`text-[10px] font-semibold tracking-wider ${isRecording ? 'text-red-500' : 'text-gray-500'}`}>
                            {isRecording ? 'STOP' : 'RECORD'}
                          </span>
                        </button>
                        
                        {/* Mute */}
                        <button 
                          onClick={() => setIsMuted(!isMuted)}
                          className={`flex flex-col items-center justify-center gap-2 group ${isMuted ? 'opacity-100' : 'opacity-80 hover:opacity-100'}`}
                        >
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-indigo-50 shadow-inner border border-indigo-200' : 'bg-white shadow-sm border border-gray-200 group-hover:bg-gray-50'}`}>
                            {isMuted ? <MicOff className="w-6 h-6 text-indigo-500" /> : <MicOff className="w-6 h-6 text-gray-600" />}
                          </div>
                          <span className={`text-[10px] font-semibold tracking-wider ${isMuted ? 'text-indigo-500' : 'text-gray-500'}`}>
                            {isMuted ? 'MUTED' : 'MUTE'}
                          </span>
                        </button>
                        
                        {/* Keypad */}
                        <button 
                          onClick={() => setShowKeypad(true)}
                          className={`flex flex-col items-center justify-center gap-2 group opacity-80 hover:opacity-100`}
                        >
                          <div className="w-16 h-16 rounded-full flex items-center justify-center transition-all bg-white shadow-sm border border-gray-200 group-hover:bg-gray-50">
                            <LayoutGrid className="w-6 h-6 text-gray-600" />
                          </div>
                          <span className="text-[10px] font-semibold tracking-wider text-gray-500">KEYPAD</span>
                        </button>
                      </div>
                    )}
                  </>
                )}

                <div className="flex justify-center mt-auto w-full pt-8 pb-4">
                  <button 
                    onClick={endCall}
                    className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200/50 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                  >
                    <PhoneOff className="w-8 h-8 text-white fill-current" />
                  </button>
                </div>
              </div>
            )}

            {/* Upload Overlay */}
            {isUploading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-[32px]">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                <h3 className="text-gray-900 font-semibold mb-1">Saving Recording...</h3>
                <p className="text-xs text-gray-500 text-center max-w-[200px]">Processing audio and starting AI analysis</p>
              </div>
            )}
            
          </div>
        </div>

      </main>
    </div>
  );
}
