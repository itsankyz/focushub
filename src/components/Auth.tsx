import React, { useState } from 'react';
import { Eye, ArrowRight, ShieldCheck, Zap, BarChart3 } from 'lucide-react';

interface AuthProps {
  cloudEnabled: boolean;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (name: string, email: string, password: string) => Promise<void>;
}

export default function Auth({ cloudEnabled, onLogin, onRegister }: AuthProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (isRegister) {
        await onRegister(name, email, password);
      } else {
        await onLogin(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl shadow-[#3856c4]/5 overflow-hidden border border-gray-100">
        <div className="p-12 text-center">
          <div className="inline-flex p-5 bg-[#3856c4] rounded-[2rem] mb-8 shadow-2xl shadow-[#3856c4]/30">
            <Eye className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2 uppercase text-[#2c3437]">FOCUSHUB</h1>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-10">
            VISION MANAGEMENT
          </p>

          <div className="space-y-4 mb-12">
            <FeatureItem icon={Zap} text="Precision Prescription Tracking" />
            <BarChart3 className="w-4 h-4 text-[#3856c4] hidden" /> {/* Just to keep imports clean */}
            <FeatureItem icon={ShieldCheck} text="Secure Visionary Registry" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {isRegister && (
              <input
                className="w-full bg-[#f7f9fb] border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-[#3856c4]/20 transition-all"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}
            <input
              type="email"
              className="w-full bg-[#f7f9fb] border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-[#3856c4]/20 transition-all"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              className="w-full bg-[#f7f9fb] border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-[#3856c4]/20 transition-all"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && <p className="text-xs font-bold text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-5 bg-[#0b0f10] text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-black active:scale-[0.98] transition-all group shadow-xl shadow-black/10 disabled:opacity-70"
            >
              <span>{busy ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <button
            onClick={() => setIsRegister((prev) => !prev)}
            className="mt-4 w-full text-xs font-black uppercase tracking-widest text-[#3856c4]"
          >
            {isRegister ? 'Already have an account? Sign in' : 'New user? Create account'}
          </button>

          <p className="mt-6 text-[10px] font-black uppercase tracking-widest text-gray-300 text-center">
            Mode: {cloudEnabled ? 'Cloud + Local' : 'Local Only'}
          </p>
        </div>
        
        <div className="px-12 py-6 bg-[#f7f9fb] border-t border-gray-100 text-center">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
            FocusHub Enterprise v2.0
          </p>
        </div>
      </div>
      
      <p className="mt-8 text-[10px] text-gray-300 font-black uppercase tracking-widest">
        © 2026 FOCUSHUB. All rights reserved.
      </p>
    </div>
  );
}

function FeatureItem({ icon: Icon, text }: { icon: any, text: string }) {
  return (
    <div className="flex items-center gap-4 text-left p-4 bg-[#f7f9fb] rounded-2xl border border-gray-50">
      <div className="p-2 bg-white rounded-xl shadow-sm">
        <Icon className="w-5 h-5 text-[#3856c4]" />
      </div>
      <span className="text-sm font-bold text-[#2c3437]">{text}</span>
    </div>
  );
}
