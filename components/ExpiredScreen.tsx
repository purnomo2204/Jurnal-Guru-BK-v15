import React, { useState } from 'react';
import { Lock, Unlock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface ExpiredScreenProps {
  onReactivate: (password: string) => void;
}

const ExpiredScreen: React.FC<ExpiredScreenProps> = ({ onReactivate }) => {
  const [password, setPassword] = useState('');
  const [showWarning, setShowWarning] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'pedulisiswa') {
      setShowWarning(true);
      toast.error("PERINGATAN: Aplikasi Sudah Kadaluwarsa!");
    } else if (password === '@Dutatama123') {
      onReactivate(password);
    } else {
      toast.error("Password salah");
    }
  };

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-slate-100 p-4">
      <div className="max-w-md w-full glass-card p-8 rounded-[2rem] border border-slate-200 shadow-2xl bg-white text-center space-y-6">
        <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-500">
          <Lock className="w-10 h-10" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-800">Aplikasi Terkunci</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.1em]">Masa aktif aplikasi telah berakhir.</p>
        </div>

        {showWarning && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-3 animate-fade-in">
            <AlertTriangle className="w-5 h-5" />
            <span>Aplikasi sudah kadaluwarsa! Silakan hubungi admin untuk aktivasi kembali.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder="Masukkan Password..." 
            className="w-full input-cyber rounded-xl p-4 text-center text-sm tracking-widest outline-none border border-slate-200 shadow-inner"
          />
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-black uppercase tracking-[0.2em] shadow-xl transition-all text-white text-[10px]">VERIFIKASI</button>
        </form>
      </div>
    </div>
  );
};

export default ExpiredScreen;
