import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [dob, setDob] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (isSignUp && password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    const endpoint = isSignUp ? '/api/auth/register' : '/api/auth/login';
    
    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, mobile, dob })
      });
      
      const data = await response.json();

      // Artificial delay for realism
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Successful login/signup
      login({ _id: data._id, email: data.email }, data.token);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent-alt/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-md w-full bg-black/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/10 z-10">
        <div className="text-center mb-8">
          <img src="/vivid-logo.png" alt="VIVID" className="h-16 w-auto object-contain mx-auto mb-4" style={{ filter: 'grayscale(1) sepia(1) hue-rotate(220deg) saturate(3.5) brightness(1.1) drop-shadow(0 0 15px rgba(139,92,246,0.5))' }} />
          <p className="text-secondary">{isSignUp ? 'Create a new account' : 'Sign in to your account'}</p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
            <p className="text-sm text-red-500 text-center">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Email Address</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-black/50 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all" 
              placeholder="admin@vivid.ai" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Password</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-black/50 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all" 
              placeholder="••••••••" 
            />
          </div>

          {isSignUp && (
            <>
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Confirm Password</label>
                <input 
                  type="password" 
                  required={isSignUp}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all" 
                  placeholder="••••••••" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Mobile Number</label>
                <input 
                  type="tel" 
                  required={isSignUp}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all" 
                  placeholder="+1 234 567 8900" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Date of Birth</label>
                <input 
                  type="date" 
                  required={isSignUp}
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all [color-scheme:dark]" 
                />
              </div>
            </>
          )}
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 px-4 bg-accent text-white rounded-xl font-medium hover:bg-accent-hover transition-colors flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.3)] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignUp ? 'Create Account' : 'Secure Login')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-secondary text-sm">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button 
              onClick={() => { setIsSignUp(!isSignUp); setError(null); }} 
              className="text-accent hover:text-white font-medium transition-colors"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
