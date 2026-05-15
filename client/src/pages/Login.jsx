import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Phone, ArrowRight, ShieldCheck, Mic, Lock, Cloud, Sparkles, Eye, EyeOff, ChevronLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { signInWithOtp, verifyOtp } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isSignUp = searchParams.get('mode') === 'signup';

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithOtp(phone);
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const token = otp.join('');
    if (token.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await verifyOtp(phone, token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^[0-9]*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    pasted.split('').forEach((char, i) => { newOtp[i] = char; });
    setOtp(newOtp);
    const nextIndex = Math.min(pasted.length, 5);
    document.getElementById(`otp-${nextIndex}`)?.focus();
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F6F8FC]">

      {/* ── Left Panel — Dark Branding ── */}
      <div className="relative lg:w-[48%] bg-gradient-to-br from-[#0F0F1A] via-[#1a1a2e] to-[#0F0F1A] text-white p-6 lg:p-16 flex flex-col justify-between overflow-hidden min-h-[180px] lg:min-h-screen">
        {/* Decorative gradient blobs */}
        <div className="absolute -top-32 -left-32 w-[400px] h-[400px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute -bottom-32 -right-32 w-[350px] h-[350px] bg-violet-600/15 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none"></div>

        {/* Logo */}
        <div className="relative z-10">
          <div 
            className="flex items-center gap-2.5 cursor-pointer" 
            onClick={() => navigate('/')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">CallVault</span>
          </div>
        </div>

        {/* Welcome text */}
        <div className="relative z-10 my-8 lg:my-0">
          <h1 className="text-2xl lg:text-5xl font-extrabold leading-tight tracking-tight mb-2 lg:mb-4">
            Welcome to
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              CallVault
            </span>
          </h1>
          <p className="text-gray-400 text-sm lg:text-lg leading-relaxed max-w-md hidden lg:block">
            Sign in to record calls, access AI-powered
            transcriptions, and get intelligent insights
            from every conversation.
          </p>
        </div>

        {/* Trust indicators */}
        <div className="relative z-10 hidden lg:block">
          <div className="flex flex-wrap gap-6">
            {[
              { icon: <Lock className="w-4 h-4" />, label: 'End-to-end encrypted' },
              { icon: <Cloud className="w-4 h-4" />, label: 'Cloud synced' },
              { icon: <Sparkles className="w-4 h-4" />, label: 'AI-powered' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-500">
                <div className="text-indigo-400">{item.icon}</div>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel — Form ── */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-16">
        <div className="w-full max-w-md">

          {/* Sign In heading */}
          <div className="mb-5 lg:mb-8">
            <h2 className="text-2xl lg:text-4xl font-extrabold text-gray-900 tracking-tight mb-1 lg:mb-2">
              {step === 'phone' ? (isSignUp ? 'Sign Up' : 'Sign In') : 'Verify OTP'}
            </h2>
            <p className="text-gray-500 text-base">
              {step === 'phone' 
                ? (isSignUp ? 'Create your account' : 'Access your account')
                : <>Enter the 6-digit code sent to <span className="font-semibold text-gray-900">{phone}</span></>
              }
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 shrink-0 text-red-500" />
              <p>{error}</p>
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              {/* Phone Number Field */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="+1 (555) 000-0000"
                    className="block w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-base shadow-sm"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">Include your country code (e.g. +1234567890)</p>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading || !phone}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3.5 px-6 rounded-xl transition-all hover:shadow-lg hover:shadow-gray-900/20 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed text-base"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending OTP...
                  </span>
                ) : (
                  <>
                    <span>Send OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[#F6F8FC] px-4 text-sm text-gray-400">or continue with</span>
                </div>
              </div>

              {/* Demo button */}
              <button
                type="button"
                onClick={() => {
                  setPhone('+1234567890');
                }}
                className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3.5 px-6 rounded-xl border border-gray-200 transition-all hover:shadow-md flex items-center justify-center gap-2 text-sm"
              >
                <Phone className="w-4 h-4 text-indigo-500" />
                Use Demo Number
              </button>

              {/* Toggle sign in / sign up */}
              <p className="text-center text-sm text-gray-500 mt-6">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button 
                  type="button"
                  onClick={() => navigate(isSignUp ? '/login' : '/login?mode=signup')}
                  className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors"
                >
                  {isSignUp ? 'Sign in' : 'Sign up'}
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              {/* OTP inputs */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Verification Code
                </label>
                <div className="flex justify-between gap-2.5">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className="w-full aspect-square max-w-[56px] text-center text-2xl font-bold bg-white border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                    />
                  ))}
                </div>
              </div>

              {/* Verify button */}
              <button
                type="submit"
                disabled={loading || otp.join('').length !== 6}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3.5 px-6 rounded-xl transition-all hover:shadow-lg hover:shadow-gray-900/20 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed text-base"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  <>
                    <span>Verify & Login</span>
                    <ShieldCheck className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Resend / Back */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); setError(null); }}
                  className="text-sm text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-1.5 font-medium"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Change number
                </button>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="text-sm font-semibold text-gray-900 hover:text-indigo-600 transition-colors"
                >
                  Resend Code
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
