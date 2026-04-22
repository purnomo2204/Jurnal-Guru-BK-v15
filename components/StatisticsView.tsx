import React from 'react';
import { Student } from '../types';
import { School, Users, User } from 'lucide-react';

interface StatisticsViewProps {
  students: Student[];
}

const StatisticsView: React.FC<StatisticsViewProps> = ({ students }) => {
  const classes = Array.from(new Set(students.map(s => s.className))).sort();
  const stats = {
    total: students.length,
    male: students.filter(s => {
      const g = s.gender?.trim().toLowerCase() || '';
      return g === 'laki-laki' || g === 'l' || g === 'laki - laki' || g.includes('laki');
    }).length,
    female: students.filter(s => {
      const g = s.gender?.trim().toLowerCase() || '';
      return g === 'perempuan' || g === 'p' || g.includes('perempuan');
    }).length,
    totalClasses: classes.length
  };

  const classStats = classes.map(className => {
    const classStudents = students.filter(s => s.className === className);
    return {
      name: className,
      total: classStudents.length,
      male: classStudents.filter(s => {
        const g = s.gender?.trim().toLowerCase() || '';
        return g === 'laki-laki' || g === 'l' || g === 'laki - laki' || g.includes('laki');
      }).length,
      female: classStudents.filter(s => {
        const g = s.gender?.trim().toLowerCase() || '';
        return g === 'perempuan' || g === 'p' || g.includes('perempuan');
      }).length
    };
  });

  return (
    <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
      <h2 className="text-xl font-black text-slate-950 dark:text-slate-100 uppercase tracking-tighter mb-4 border-b-2 border-slate-900 dark:border-slate-700 pb-2">
        Statistik <span className="text-slate-500 dark:text-slate-400 italic">Siswa</span>
      </h2>
      
      {/* Global Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-gradient-to-br from-violet-500 to-fuchsia-600 p-3.5 rounded-xl shadow-md border border-violet-400 flex items-center justify-between group hover:scale-[1.02] transition-transform">
          <div>
            <p className="text-[9px] font-bold text-violet-100 uppercase tracking-widest mb-0.5">Total Kelas</p>
            <p className="text-2xl font-mono font-bold text-white">{stats.totalClasses}</p>
          </div>
          <div className="p-2 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
            <School className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-3.5 rounded-xl shadow-md border border-amber-300 flex items-center justify-between group hover:scale-[1.02] transition-transform">
          <div>
            <p className="text-[9px] font-bold text-amber-50 uppercase tracking-widest mb-0.5">Total Siswa</p>
            <p className="text-2xl font-mono font-bold text-white">{stats.total}</p>
          </div>
          <div className="p-2 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
            <Users className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-400 to-teal-500 p-3.5 rounded-xl shadow-md border border-emerald-300 flex items-center justify-between group hover:scale-[1.02] transition-transform">
          <div>
            <p className="text-[9px] font-bold text-emerald-50 uppercase tracking-widest mb-0.5">Laki-laki</p>
            <p className="text-2xl font-mono font-bold text-white">{stats.male}</p>
          </div>
          <div className="p-2 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
            <User className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-rose-400 to-pink-500 p-3.5 rounded-xl shadow-md border border-rose-300 flex items-center justify-between group hover:scale-[1.02] transition-transform">
          <div>
            <p className="text-[9px] font-bold text-rose-50 uppercase tracking-widest mb-0.5">Perempuan</p>
            <p className="text-2xl font-mono font-bold text-white">{stats.female}</p>
          </div>
          <div className="p-2 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
            <User className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      {/* Per Class Breakdown */}
      <h3 className="text-[11px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-3">Detail Per Kelas</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {classStats.map((c) => (
          <div key={c.name} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
            <p className="text-[10px] font-black text-slate-900 dark:text-slate-100 mb-2 uppercase tracking-wider">{c.name}</p>
            <div className="space-y-0.5">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">Total</span>
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">{c.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">L</span>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">{c.male}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400">P</span>
                <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">{c.female}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatisticsView;
