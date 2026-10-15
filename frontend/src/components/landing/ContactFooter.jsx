import React from 'react';
import { Link } from 'react-router-dom';

export default function ContactFooter() {
  return (
    <footer className="py-32 px-8 border-t border-border mt-12 relative overflow-hidden">
       {/* Background Glow */}
       <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent/10 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="max-w-3xl mx-auto text-center relative z-10">
        <h2 className="text-5xl font-medium text-white mb-10 tracking-tight">Your workplace has the answer.<br/>Ask VIVID to find it.</h2>
        
        <Link to="/login" className="inline-block px-8 py-4 bg-accent/20 border border-accent/50 text-accent hover:bg-accent/30 rounded-full transition-colors font-medium text-lg">
          REQUEST ACCESS
        </Link>
        
        <div className="mt-32 pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center text-sm text-secondary">
          <p>© 2026 VIVID Fraud Defense. All rights reserved.</p>
          <div className="space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">MANIFESTO</a>
            <a href="#" className="hover:text-white transition-colors">TEAM</a>
            <a href="#" className="hover:text-white transition-colors">PRIVACY</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
