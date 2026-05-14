import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mic, Clock, FileText, Settings } from 'lucide-react';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/dashboard', icon: Mic },
    { name: 'Recordings', path: '/recordings', icon: Clock },
    { name: 'Contacts', path: '/contacts', icon: FileText },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0F0F1A]/90 backdrop-blur-xl border-t border-white/10 p-4 pb-safe flex justify-around items-center z-50">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        
        return (
          <div 
            key={item.name}
            onClick={() => navigate(item.path)} 
            className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${isActive ? 'text-primary' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Icon className="w-6 h-6" />
            <span className="text-[10px] font-medium">{item.name}</span>
          </div>
        );
      })}
    </div>
  );
}
