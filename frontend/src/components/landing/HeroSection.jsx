import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function HeroSection() {
  const { user, logout, isLoggingOut } = useAuth();
  return (
    <div className="relative min-h-screen flex flex-col pt-6 px-8 max-w-7xl mx-auto">


      <nav className="relative z-10 flex justify-between items-center mb-24">
        <div className="flex items-center">
          <img src="/vivid-logo.png" alt="VIVID" className="h-16 w-auto object-contain" style={{ filter: 'grayscale(1) sepia(1) hue-rotate(220deg) saturate(3.5) brightness(1.1) drop-shadow(0 0 15px rgba(139,92,246,0.5))' }} />
        </div>
        <div className="flex items-center space-x-4">
          <Link to="/dashboard" className="px-6 py-2 bg-transparent text-secondary hover:text-white transition-colors font-medium text-sm">
            Overview
          </Link>
          <Link to="/dashboard/simulate" className="px-6 py-2 bg-accent/20 border border-accent/50 text-accent hover:bg-accent/30 rounded-full transition-colors font-medium text-sm">
            Simulate Call
          </Link>
          {user ? (
            <button 
              onClick={logout} 
              disabled={isLoggingOut}
              className="px-6 py-2 bg-red-600 text-white hover:bg-red-700 rounded-full transition-colors font-medium text-sm flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed min-w-[100px]"
            >
              {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Logout'}
            </button>
          ) : (
            <Link to="/login" className="px-6 py-2 bg-white text-black hover:bg-gray-200 rounded-full transition-colors font-medium text-sm">
              Login/Signup
            </Link>
          )}
        </div>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col items-start justify-center text-left max-w-4xl space-y-8 mt-12">
        <h1 className="text-6xl md:text-8xl font-medium tracking-tighter text-white leading-[1.1]">
          Enterprise-Grade <br/> 
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-accent-alt to-accent-alt2">
            Call Intelligence.
          </span>
        </h1>
        <p className="text-xl md:text-2xl text-secondary max-w-2xl leading-relaxed font-light">
          Going beyond standard caller ID. VIVID intercepts sophisticated voice clones and social engineering fraud in real-time.
        </p>
      </main>
    </div>
  );
}
