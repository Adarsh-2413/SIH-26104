import React from 'react';
import { Shield, Activity, PhoneCall, Settings, LogOut } from 'lucide-react';
import { Link, useLocation, Outlet } from 'react-router-dom';

export default function DashboardLayout() {
  const location = useLocation();

  const navItems = [
    { icon: <Shield size={20} />, label: 'Overview', path: '/dashboard' },
    { icon: <PhoneCall size={20} />, label: 'Simulate Call', path: '/dashboard/simulate' },
    { icon: <Activity size={20} />, label: 'History', path: '/dashboard/history' },
    { icon: <Settings size={20} />, label: 'Settings', path: '/dashboard/settings' },
  ];

  return (
    <div className="flex h-screen bg-background text-white">
      {/* Sidebar */}
      <div className="w-64 bg-[#0a0a0a] border-r border-border flex flex-col">
        <div className="p-6">
          <Link to="/" className="inline-block">
            <img src="/vivid-logo.png" alt="VIVID" className="h-14 w-auto object-contain" style={{ filter: 'grayscale(1) sepia(1) hue-rotate(220deg) saturate(3.5) brightness(1.1) drop-shadow(0 0 10px rgba(139,92,246,0.4))' }} />
          </Link>
          <p className="text-xs text-secondary mt-1">Enterprise Call Intelligence</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item, idx) => {
            // Determine if active. Note: for '/dashboard', we must exactly match or match without trailing slash to avoid matching everything.
            // Better active logic:
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            
            return (
              <Link 
                key={idx} 
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${isActive ? 'bg-accent/20 text-accent font-medium border border-accent/20' : 'text-secondary hover:bg-white/5 hover:text-white'}`}
              >
              {item.icon}
              <span>{item.label}</span>
            </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <Link to="/" className="flex items-center space-x-3 px-4 py-3 text-secondary hover:text-red-500 transition-colors">
            <LogOut size={20} />
            <span>Logout</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto relative">
        <Outlet />
      </div>
    </div>
  );
}
