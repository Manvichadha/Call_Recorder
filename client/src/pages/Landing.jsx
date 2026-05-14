import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic, Shield, Brain, Cloud, ChevronRight, Play,
  Phone, FileText, BarChart3, Users, Star, ArrowRight,
  CheckCircle2, Zap, Lock, Globe
} from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-cycle features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: <Mic className="w-6 h-6" />,
      title: 'Smart Recording',
      description: 'Crystal-clear call recording with automatic cloud backup and zero-effort setup.',
      color: 'from-indigo-500 to-indigo-600',
      bgLight: 'bg-indigo-50',
      textColor: 'text-indigo-600'
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: 'AI Transcription',
      description: 'Instant speech-to-text powered by AssemblyAI with speaker identification.',
      color: 'from-violet-500 to-violet-600',
      bgLight: 'bg-violet-50',
      textColor: 'text-violet-600'
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: 'Intelligent Analysis',
      description: 'Get summaries, sentiment analysis, and action items from every conversation.',
      color: 'from-amber-500 to-orange-500',
      bgLight: 'bg-amber-50',
      textColor: 'text-amber-600'
    },
    {
      icon: <Cloud className="w-6 h-6" />,
      title: 'Cloud Sync',
      description: 'Access your recordings from anywhere with secure cloud storage and real-time sync.',
      color: 'from-emerald-500 to-teal-500',
      bgLight: 'bg-emerald-50',
      textColor: 'text-emerald-600'
    }
  ];

  const stats = [
    { value: '95%', label: 'Accuracy Rate', description: 'AI transcription precision' },
    { value: '10x', label: 'Time Saved', description: 'vs. manual note-taking' },
    { value: '50K+', label: 'Calls Processed', description: 'and counting' },
  ];

  const steps = [
    { step: '01', title: 'Record', description: 'Start recording your calls with one tap. Works with any phone call seamlessly.', icon: <Phone className="w-8 h-8" /> },
    { step: '02', title: 'Transcribe', description: 'Our AI instantly converts speech to text with speaker labels and timestamps.', icon: <FileText className="w-8 h-8" /> },
    { step: '03', title: 'Analyze', description: 'Get intelligent summaries, sentiment scores, and key action items automatically.', icon: <BarChart3 className="w-8 h-8" /> },
    { step: '04', title: 'Organize', description: 'All your recordings synced to the cloud, searchable and organized by contacts.', icon: <Users className="w-8 h-8" /> },
  ];

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-gray-900 font-sans overflow-x-hidden">

      {/* ── Navigation ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-100' : 'bg-transparent'
        }`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Call<span className="text-indigo-600">Vault</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">How It Works</a>
            <a href="#stats" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">Why CallVault</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors px-4 py-2 rounded-xl hover:bg-indigo-50"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 px-5 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-gray-900/20 flex items-center gap-2"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 px-6">
        {/* Soft gradient background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-indigo-100/60 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-violet-100/50 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-1/3 w-[350px] h-[350px] bg-amber-50/60 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-indigo-100 rounded-full px-4 py-1.5 mb-8 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-medium text-gray-600">AI-Powered Recording Platform</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-tight mb-6">
            Smart Call Recording
            <br />
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-amber-500 bg-clip-text text-transparent">
              Revolution
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Record, transcribe, and analyze every call with
            cutting-edge AI technology wrapped in a seamless
            modern experience.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="group w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white font-semibold px-8 py-4 rounded-2xl transition-all hover:shadow-xl hover:shadow-gray-900/20 flex items-center justify-center gap-3"
            >
              Start Recording Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-700 font-semibold px-8 py-4 rounded-2xl border border-gray-200 transition-all hover:shadow-lg flex items-center justify-center gap-3"
            >
              <Play className="w-5 h-5 text-indigo-600" />
              Watch Demo
            </button>
          </div>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-6 mt-12 text-sm text-gray-400">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>End-to-end encrypted</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-300"></div>
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-400" />
              <span>4.9/5 rating</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-300 hidden sm:block"></div>
            <div className="hidden sm:flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-indigo-500" />
              <span>Real-time processing</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Section ── */}
      <section id="stats" className="relative py-20 px-6">
        <div className="max-w-5xl mx-auto text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
            The Problem We Solve
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Important conversations happen every day. Without the right tools,
            critical details are lost forever.
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-4xl md:text-5xl font-extrabold text-indigo-600 mb-2">{stat.value}</div>
              <div className="text-lg font-bold text-gray-900 mb-1">{stat.label}</div>
              <div className="text-sm text-gray-400">{stat.description}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Section ── */}
      <section id="features" className="relative py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
            Our Solution
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Four powerful features powered by AI that transform how you handle calls.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className={`group relative bg-white rounded-2xl p-7 border transition-all duration-500 cursor-pointer ${activeFeature === i
                  ? 'border-indigo-200 shadow-lg shadow-indigo-100/50 scale-[1.02]'
                  : 'border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200'
                }`}
              onMouseEnter={() => setActiveFeature(i)}
            >
              <div className={`w-12 h-12 rounded-xl ${feature.bgLight} flex items-center justify-center mb-5 ${feature.textColor} transition-transform group-hover:scale-110`}>
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works Section ── */}
      <section id="how-it-works" className="relative py-24 px-6">
        <div className="max-w-5xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
            How It Works
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            From recording to insights in four simple steps.
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="relative group">
              {/* Connector line (hidden on last and mobile) */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[calc(100%_-_8px)] w-full h-[2px] bg-gradient-to-r from-indigo-200 to-transparent z-0"></div>
              )}
              <div className="relative z-10 bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-lg hover:border-indigo-100 transition-all duration-300">
                <div className="text-xs font-bold text-indigo-400 tracking-widest mb-4">STEP {step.step}</div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center mb-5 text-indigo-600 group-hover:scale-110 transition-transform">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Security Section ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-10 md:p-16 text-center text-white relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl"></div>

            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-6">
                <Lock className="w-8 h-8 text-indigo-400" />
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Your Privacy, Our Priority</h2>
              <p className="text-gray-400 text-lg max-w-xl mx-auto mb-10">
                Every recording is encrypted end-to-end and stored securely in the cloud.
                Only you have access to your data.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
                {[
                  { icon: <Shield className="w-6 h-6" />, label: 'End-to-End Encryption' },
                  { icon: <Lock className="w-6 h-6" />, label: 'OTP-Based Auth' },
                  { icon: <Globe className="w-6 h-6" />, label: 'GDPR Compliant' },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-3 bg-white/5 rounded-2xl p-5 border border-white/10">
                    <div className="text-indigo-400">{item.icon}</div>
                    <span className="text-sm font-medium text-gray-300">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">
            Ready to Never Miss a
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Detail Again?</span>
          </h2>
          <p className="text-gray-500 text-lg mb-10 max-w-lg mx-auto">
            Join thousands of professionals who trust CallVault
            to capture and analyze their most important conversations.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="group bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold px-10 py-4 rounded-2xl transition-all hover:shadow-xl hover:shadow-indigo-300/40 text-lg flex items-center justify-center gap-3 mx-auto"
          >
            Get Started
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-gray-100 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold">Call<span className="text-indigo-600">Vault</span></span>
          </div>

          <div className="flex items-center gap-8 text-sm text-gray-400">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How It Works</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Terms</a>
          </div>

          <p className="text-sm text-gray-400">
            © 2026 CallVault. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
