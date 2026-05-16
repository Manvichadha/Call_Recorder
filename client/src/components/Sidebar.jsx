import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TrendingUp, Clock, Brain, Users, BarChart3, LogOut, Phone } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuthStore();

  const navItems = [
    { icon: TrendingUp, path: '/dashboard', label: 'Dashboard' },
    { icon: Phone, path: '/simulator', label: 'Call Simulator' },
    { icon: Clock, path: '/recordings', label: 'Recordings' },
    { icon: Brain, path: '/analysis', label: 'AI Analysis' },
    { icon: Users, path: '/contacts', label: 'Contacts' },
    { icon: BarChart3, path: '/settings', label: 'Settings' },
  ];

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex fixed left-5 top-5 bottom-5 w-[80px] bg-white rounded-full shadow-sm shadow-sky-100/50 flex-col items-center py-8 z-50">
        
        {/* ── Logo ── */}
        <div 
          className="relative w-11 h-11 cursor-pointer flex-shrink-0 mb-10"
          onClick={() => navigate('/dashboard')}
        >
          {/* Outer cyan ring */}
          <div className="absolute inset-0 rounded-full border-[5px] border-[#D6F3FA]"></div>
          {/* Cyan accent dot overlapping the top right */}
          <div className="absolute top-[-3px] right-[-3px] w-[18px] h-[18px] rounded-full bg-[#42DDF2]"></div>
        </div>

        {/* ── Nav Icons ── */}
        <nav className="flex-1 flex flex-col items-center gap-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path === '/recordings' && location.pathname.startsWith('/recordings/')) ||
              (item.path === '/analysis' && location.pathname.startsWith('/analysis/'));
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="group relative flex items-center justify-center"
                title={item.label}
              >
                {isActive ? (
                  /* Active — solid orange circle */
                  <div className="w-14 h-14 rounded-full bg-[#FBB244] flex items-center justify-center shadow-md shadow-orange-300/40 transition-all duration-300">
                    <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                ) : (
                  /* Inactive — plain gray icon (no border) */
                  <div className="w-14 h-14 flex items-center justify-center text-[#B0BAC9] hover:text-gray-500 transition-all duration-200">
                    <Icon className="w-6 h-6" strokeWidth={2.2} />
                  </div>
                )}

                {/* Tooltip */}
                <div className="absolute left-[calc(100%+16px)] px-3 py-1.5 bg-gray-800 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
                  {item.label}
                </div>
              </button>
            );
          })}
        </nav>

        {/* ── Logout at bottom ── */}
        <button
          onClick={signOut}
          className="w-14 h-14 flex items-center justify-center text-[#B0BAC9] hover:text-red-400 transition-all flex-shrink-0 mb-2"
          title="Sign out"
        >
          <LogOut className="w-6 h-6" strokeWidth={2.2} />
        </button>
      </aside>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 px-1 py-1 flex justify-around items-center z-50" style={{ paddingBottom: 'max(6px, env(safe-area-inset-bottom))' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-0.5 py-0.5 px-1"
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                isActive 
                  ? 'bg-[#FBB244] text-white shadow-sm' 
                  : 'text-[#B0BAC9]'
              }`}>
                <Icon className="w-4 h-4" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[9px] font-semibold ${isActive ? 'text-amber-600' : 'text-gray-400'}`}>
                {item.label.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
