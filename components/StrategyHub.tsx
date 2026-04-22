
import React from 'react';
import { ViewMode, CounselingLog } from '../types';
import { 
  BookOpen, Users2, UserCircle, Users, UserPlus, 
  Home, Share2, Briefcase, Activity, LayoutGrid, 
  FileText, ArrowLeft, ChevronRight, Sparkles
} from 'lucide-react';

interface StrategyHubProps {
  logs: CounselingLog[];
  setView: (v: ViewMode) => void;
  onSelectStrategyReport: (strategy: string) => void;
}

const StrategyHub: React.FC<StrategyHubProps> = ({ logs, setView, onSelectStrategyReport }) => {
  const reportStrategies = [
    { name: 'Bimbingan Klasikal', icon: <BookOpen className="w-5 h-5" />, color: 'bg-blue-500', desc: 'Bimbingan kelompok besar per-kelas' },
    { name: 'Bimbingan Kelompok', icon: <Users2 className="w-5 h-5" />, color: 'bg-indigo-500', desc: 'Grup bimbingan kecil terpadu' },
    { name: 'Konseling Individu', icon: <UserCircle className="w-5 h-5" />, color: 'bg-sky-500', desc: 'Sesi tatap muka mandiri siswa' },
    { name: 'Konseling Kelompok', icon: <Users className="w-5 h-5" />, color: 'bg-violet-500', desc: 'Penyelesaian masalah dlm grup' },
    { name: 'Konsultasi', icon: <UserPlus className="w-5 h-5" />, color: 'bg-teal-500', desc: 'Diskusi bersama Wali/Guru/Ortu' },
    { name: 'Home Visit', icon: <Home className="w-5 h-5" />, color: 'bg-rose-500', desc: 'Kunjungan ke kediaman siswa' },
    { name: 'Referal', icon: <Share2 className="w-5 h-5" />, color: 'bg-emerald-500', desc: 'Alih tangan kasus ke ahli lain' },
    { name: 'Konferensi Kasus', icon: <Briefcase className="w-5 h-5" />, color: 'bg-amber-500', desc: 'Pembahasan kasus bersama tim' },
    { name: 'Pengembangan Diri', icon: <Activity className="w-5 h-5" />, color: 'bg-pink-500', desc: 'Peningkatan kompetensi guru BK' },
    { name: 'Kolaborasi', icon: <LayoutGrid className="w-5 h-5" />, color: 'bg-slate-600', desc: 'Kerjasama lintas institusi' },
  ];

  const getStrategyCount = (name: string) => {
    if (name === 'Konsultasi') {
      return logs.filter(l => ['Konsultasi dengan Wali Kelas', 'Konsultasi dengan Guru', 'Konsultasi dengan Orang Tua / Wali'].includes(l.type)).length;
    }
    return logs.filter(l => l.type === name).length;
  };

  return (
    <div className="space-y-6 animate-fade-in text-left max-w-6xl mx-auto pb-10 px-4">
      <div className="flex items-center gap-3">
         <button onClick={() => setView(ViewMode.HOME)} className="p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-all group shadow-sm">
           <ArrowLeft className="w-5 h-5 text-primary group-hover:-translate-x-1 transition-transform" />
         </button>
         <div>
            <p className="label-luxe text-primary font-black text-[8px]">FOLDER ADMINISTRASI</p>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">Laporan <span className="text-primary font-light italic lowercase">Layanan BK</span></h2>
         </div>
      </div>

      <div className="mb-6">
        <button 
          onClick={() => setView(ViewMode.STRATEGY_GENERATOR)}
          className="w-full bg-primary text-white font-semibold py-3 px-4 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-sm text-sm"
        >
          <Sparkles className="w-4 h-4" />
          Buat Strategi Konseling Baru dengan AI
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {reportStrategies.map((strat, i) => (
          <button
            key={i}
            onClick={() => onSelectStrategyReport(strat.name)}
            className="glass-card p-3 rounded-xl border border-blue-500/20 text-left group relative overflow-hidden transition-all hover:border-blue-400 bg-white/80 hover:bg-slate-100/80 shadow-sm hover:shadow-blue-500/10"
          >
            <div className="relative z-10">
              <div className={`w-8 h-8 ${strat.color} rounded-lg flex items-center justify-center text-slate-800 mb-2 shadow-sm shadow-black/10 transition-transform group-hover:scale-110 group-hover:-rotate-6`}>
                {React.cloneElement(strat.icon as React.ReactElement<any>, { className: "w-4 h-4" })}
              </div>
              <h4 className="text-[10px] font-black text-slate-800 mb-0.5 uppercase tracking-tighter leading-tight">{strat.name}</h4>
              <p className="text-slate-500 text-[9px] font-medium leading-relaxed mb-2 h-5 line-clamp-2">
                {strat.desc}
              </p>
              
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-[7px] font-black text-blue-300 uppercase tracking-widest">{getStrategyCount(strat.name)} Arsip</span>
                </div>
                <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 blur-[30px] -mr-8 -mt-8 rounded-full group-hover:bg-blue-500/20 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default StrategyHub;
