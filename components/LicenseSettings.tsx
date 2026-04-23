import React, { useState } from 'react';
import { TeacherData } from '../types';
import { CalendarIcon, Unlock, Check, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface LicenseSettingsProps {
  teacherData: TeacherData;
  onUpdateTeacherData: (data: TeacherData) => void;
}

const LicenseSettings: React.FC<LicenseSettingsProps> = ({ teacherData, onUpdateTeacherData }) => {
  const [expiryDate, setExpiryDate] = useState(teacherData.expiryDate || '');
  const [reactivationPassword, setReactivationPassword] = useState('');
  const [showReactivationPassword, setShowReactivationPassword] = useState(false);
  
  const parseDateForInput = (ddmmyy: string): string => {
    if (!ddmmyy) return '';
    const parts = ddmmyy.split(':');
    if (parts.length !== 3) return '';
    const yyyy = `20${parts[2]}`;
    return `${yyyy}-${parts[1]}-${parts[0]}`;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const yyyyMMdd = e.target.value;
    if (!yyyyMMdd) {
        setExpiryDate('');
        return;
    }
    const parts = yyyyMMdd.split('-');
    if (parts.length === 3) {
        const yy = parts[0].slice(2);
        setExpiryDate(`${parts[2]}:${parts[1]}:${yy}`);
    } else {
        setExpiryDate('');
    }
  };

  const handleSaveExpiry = () => {
    if (expiryDate && !/^\d{2}:\d{2}:\d{2}$/.test(expiryDate)) {
        toast.error("Format tanggal tidak valid");
        return;
    }
    onUpdateTeacherData({ ...teacherData, expiryDate: expiryDate });
    toast.success("Masa aktif berhasil diperbarui");
  };

  const handleReactivate = () => {
    if (reactivationPassword === '@Dutatama123') {
        onUpdateTeacherData({ ...teacherData, isAppActive: true, expiryDate: '' });
        toast.success("Aplikasi berhasil diaktifkan kembali (selamanya)");
        setReactivationPassword('');
    } else {
        toast.error("Password aktivasi salah");
    }
  };

  const clearExpiry = () => {
      if (teacherData.expiryDate) {
          const proceed = window.confirm(`Peringatan: Aplikasi saat ini dalam mode masa aktif.\nAplikasi aktif sampai tanggal ${teacherData.expiryDate}.\n\nApakah Anda yakin ingin mengatur agar aplikasi aktif selamanya?`);
          if (!proceed) return;
      }
      onUpdateTeacherData({ ...teacherData, expiryDate: '' });
      toast.success("Aplikasi aktif selamanya");
  };

  return (
    <div className="glass-card p-5 rounded-[1.5rem] border border-blue-500/10 space-y-5 shadow-xl animate-fade-in bg-blue-950/5">
        <div className="flex items-center gap-3 border-b border-blue-500/10 pb-4">
            <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-lg"><ShieldCheck className="w-5 h-5" /></div>
            <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase italic">Masa Aktif Aplikasi</h3>
                <p className="label-luxe text-[7px] text-blue-500">Atur masa berlaku aplikasi dan aktivasi ulang</p>
            </div>
        </div>

        <div className="space-y-4">
            <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Tanggal Kadaluwarsa (DD:MM:YY)</label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input 
                            type="date"
                            value={parseDateForInput(expiryDate)} 
                            onChange={handleDateChange} 
                            className="w-full input-cyber rounded-xl p-2.5 text-xs font-bold outline-none focus:border-blue-500/50 pl-10" 
                        />
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 pointer-events-none" />
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleSaveExpiry} className="flex-1 bg-blue-600 hover:bg-blue-500 py-2 rounded-xl font-black uppercase tracking-widest text-white text-[9px]">Simpan Tanggal</button>
                    <button onClick={clearExpiry} className="bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-xl font-black uppercase tracking-widest text-slate-700 text-[9px]">Aktif Selamanya</button>
                </div>
            </div>

            <div className="pt-4 border-t border-blue-500/10 space-y-1.5">
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Buka Aplikasi Kembali</label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input 
                            type={showReactivationPassword ? "text" : "password"}
                            value={reactivationPassword} 
                            onChange={e => setReactivationPassword(e.target.value)} 
                            className="w-full input-cyber rounded-xl p-2.5 text-xs font-bold outline-none focus:border-blue-500/50 pr-10" 
                            placeholder="Masukkan Password Aktivasi..."
                        />
                        <button type="button" onClick={() => setShowReactivationPassword(!showReactivationPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600">
                            {showReactivationPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    <button onClick={handleReactivate} className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-xl font-black uppercase tracking-widest text-white text-[9px] flex items-center gap-2">
                        <Unlock className="w-3 h-3" /> Aktifkan
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default LicenseSettings;
