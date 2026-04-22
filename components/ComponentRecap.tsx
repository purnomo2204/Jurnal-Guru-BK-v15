
import React, { useState, useMemo, useEffect } from 'react';
import { ViewMode, CounselingLog, Student, TeacherData, ServiceComponent, CounselingType } from '../types';
import { 
  ArrowLeft, Save, Info, 
  TableProperties, LayoutGrid, Filter, CheckCircle2,
  ChevronRight, Hash, Database, Sparkles
} from 'lucide-react';

interface ComponentRecapProps {
  logs: CounselingLog[];
  students: Student[];
  teacherData: TeacherData;
  setView: (v: ViewMode) => void;
}

interface RowData {
  no: number;
  component: ServiceComponent;
  type: CounselingType;
  rencana: number;
  realisasi: number;
  isFirstInComp: boolean;
  compSpan: number;
  planKey: string;
}

const ComponentRecap: React.FC<ComponentRecapProps> = ({ logs, students, teacherData, setView }) => {
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');
  const [selectedClass, setSelectedClass] = useState<string>('Semua Kelas');
  const [plans, setPlans] = useState<Record<string, number>>({});
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  useEffect(() => {
    const savedPlans = localStorage.getItem('guru_bk_rencana_program');
    if (savedPlans && savedPlans !== "undefined") setPlans(JSON.parse(savedPlans));
  }, []);

  const classes = useMemo(() => 
    Array.from(new Set(students.map(s => s.className))).sort()
  , [students]);

  const structure: { component: ServiceComponent; strategies: CounselingType[] }[] = [
    { 
      component: 'Layanan Dasar', 
      strategies: ['Bimbingan Klasikal', 'Bimbingan Kelompok'] 
    },
    { 
      component: 'Layanan Responsif', 
      strategies: [
        'Konseling Individu', 'Konseling Kelompok', 'Referal', 
        'Konsultasi dengan Wali Kelas', 'Konsultasi dengan Guru', 
        'Konsultasi dengan Orang Tua / Wali', 'Home Visit', 'Konferensi Kasus'
      ] 
    },
    { 
      component: 'Peminatan dan Perencanaan Individu', 
      strategies: [
        'Konseling Individu', 'Konseling Kelompok', 'Konsultasi dengan Orang Tua / Wali'
      ] 
    },
    { 
      component: 'Dukungan Sistem', 
      strategies: ['Pengembangan Diri', 'Kolaborasi'] 
    }
  ];

  const tableData = useMemo(() => {
    const rows: RowData[] = [];

    structure.forEach((comp, compIdx) => {
      comp.strategies.forEach((strat, stratIdx) => {
        const realizedCount = logs.filter(l => {
          const d = new Date(l.date);
          const month = d.getMonth();
          const isInSemester = semester === 'Ganjil' ? (month >= 6) : (month <= 5);
          const matchesClass = selectedClass === 'Semua Kelas' || l.className === selectedClass;
          return l.component === comp.component && l.type === strat && isInSemester && matchesClass;
        }).length;

        const planKey = `${comp.component}_${strat}_${semester}_${selectedClass}`;
        
        rows.push({
          no: compIdx + 1,
          component: comp.component,
          type: strat,
          rencana: plans[planKey] || 0,
          realisasi: realizedCount,
          isFirstInComp: stratIdx === 0,
          compSpan: comp.strategies.length,
          planKey: planKey
        });
      });
    });

    return rows;
  }, [logs, semester, selectedClass, plans]);

  const handleInputChange = (key: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setPlans(prev => ({ ...prev, [key]: numValue }));
  };

  const handleSaveRow = () => {
    localStorage.setItem('guru_bk_rencana_program', JSON.stringify(plans));
    setSavedFeedback("Data Rencana Tersimpan!");
    setTimeout(() => setSavedFeedback(null), 3000);
  };

  const calculateCategory = (percentage: number) => {
    if (percentage >= 91) return { label: 'Sangat Baik', color: 'text-emerald-400' };
    if (percentage >= 81) return { label: 'Baik', color: 'text-blue-400' };
    if (percentage >= 71) return { label: 'Cukup', color: 'text-amber-400' };
    return { label: 'Kurang', color: 'text-rose-400' };
  };

  return (
    <div className="space-y-4 animate-fade-in text-left pb-16">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-4">
        <div className="flex items-center gap-4">
           <button onClick={() => setView(ViewMode.HOME)} className="p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-all group shadow-md">
             <ArrowLeft className="w-5 h-5 text-primary group-hover:-translate-x-1 transition-transform" />
           </button>
           <div>
              <p className="label-luxe text-primary font-black text-[7px]">STATISTIK & REKAPITULASI</p>
              <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">Rekap <span className="text-primary font-light italic lowercase">Komponen Layanan</span></h2>
           </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
           {savedFeedback && (
             <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 text-[8px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-right-4">
                <CheckCircle2 className="w-3 h-3" /> {savedFeedback}
             </div>
           )}
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 px-4">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-primary" />
          <select 
            value={semester}
            onChange={(e) => setSemester(e.target.value as any)}
            className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-[9px] text-slate-900 appearance-none outline-none font-black uppercase tracking-widest cursor-pointer"
          >
            <option value="Ganjil">Semester Ganjil</option>
            <option value="Genap">Semester Genap</option>
          </select>
        </div>
        <div className="relative">
          <LayoutGrid className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-primary" />
          <select 
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-[9px] text-slate-900 appearance-none outline-none font-black uppercase tracking-widest cursor-pointer"
          >
            <option value="Semua Kelas">Semua Kelas</option>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Table Area */}
      <div className="mx-4">
         <div className="glass-card rounded-2xl border border-primary/10 overflow-hidden shadow-xl bg-white/80">
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
               <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tighter italic leading-none">Pelaksanaan Kegiatan Layanan BK</h3>
                  <p className="text-[7px] text-primary font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
                    <TableProperties className="w-2.5 h-2.5" /> Filter: {selectedClass} | Semester {semester}
                  </p>
               </div>
               <div className="flex gap-2">
                  <div className="px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg">
                    <p className="text-[6px] font-black text-primary uppercase tracking-widest mb-0.5">Tahun Ajaran</p>
                    <p className="text-base font-black text-slate-900 leading-none">{teacherData.academicYear}</p>
                  </div>
                  <button 
                    onClick={handleSaveRow}
                    className="px-3 py-1.5 bg-primary hover:opacity-90 text-white rounded-lg font-black text-[8px] uppercase tracking-widest shadow-md flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <Save className="w-3 h-3" /> Simpan Semua Rencana
                  </button>
               </div>
            </div>

            <div className="overflow-x-auto scroll-hide">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-slate-50 text-primary text-[6px] font-black uppercase tracking-widest border-b border-slate-200">
                        <th className="p-1.5 text-center border-r border-slate-100 w-6">No</th>
                        <th className="p-1.5 border-r border-slate-100 w-24">Komponen Layanan</th>
                        <th className="p-1.5 border-r border-slate-100">Strategi Layanan</th>
                        <th className="p-1.5 text-center border-r border-slate-100 w-24">Rencana Program (Input)</th>
                        <th className="p-1.5 text-center border-r border-slate-100 w-12">Keterlaksanaan</th>
                        <th className="p-1.5 text-center border-r border-slate-100 w-12">Persentase (%)</th>
                        <th className="p-1.5 text-center border-r border-slate-100 w-16">Kategori</th>
                        <th className="p-1.5 text-center">Aksi</th>
                     </tr>
                  </thead>
                  <tbody className="text-slate-700">
                     {tableData.map((row, i) => {
                        const percentage = row.rencana > 0 ? Math.min(100, Math.round((row.realisasi / row.rencana) * 100)) : 0;
                        const category = calculateCategory(percentage);

                        return (
                           <tr key={i} className="hover:bg-primary/5 transition-colors border-b border-slate-100 group/row">
                              {row.isFirstInComp && (
                                 <td rowSpan={row.compSpan} className="p-1.5 text-center font-black text-slate-900 text-[10px] border-r border-slate-100 align-middle">
                                    {row.no}
                                 </td>
                              )}
                              {row.isFirstInComp && (
                                 <td rowSpan={row.compSpan} className="p-1.5 font-black text-slate-900 text-[7px] uppercase border-r border-slate-100 align-middle bg-slate-50/50">
                                    {row.component}
                                 </td>
                              )}
                              <td className="p-1.5 font-bold text-slate-800 text-[9px] border-r border-slate-100 italic">
                                 {row.type}
                              </td>
                              <td className="p-1.5 border-r border-slate-100 bg-primary/5 relative">
                                 <div className="flex items-center gap-1 justify-center">
                                    <Hash className="w-2 h-2 text-slate-500" />
                                    <input 
                                       type="number"
                                       value={row.rencana}
                                       onChange={(e) => handleInputChange(row.planKey, e.target.value)}
                                       className="w-10 bg-white border border-primary/20 rounded-md p-1 text-center text-[10px] font-black text-primary outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all shadow-sm"
                                       placeholder="0"
                                    />
                                 </div>
                              </td>
                              <td className="p-1.5 text-center font-black text-primary border-r border-slate-100 text-[10px]">
                                 {row.realisasi}
                              </td>
                              <td className="p-1.5 text-center font-black text-slate-900 border-r border-slate-100">
                                 <div className="flex flex-col items-center gap-0.5">
                                    <span className="text-[10px]">{percentage}%</span>
                                    <div className="w-8 h-1 bg-slate-100 rounded-full overflow-hidden">
                                       <div className="h-full bg-primary shadow-[0_0_8px_var(--primary-color)]" style={{ width: `${percentage}%` }} />
                                    </div>
                                 </div>
                              </td>
                              <td className={`p-1.5 text-center font-black text-[6px] uppercase tracking-widest border-r border-slate-100 ${category.color}`}>
                                 <div className="flex flex-col items-center gap-0.5">
                                    {category.label}
                                    {percentage >= 91 && <Sparkles className="w-2 h-2 animate-pulse" />}
                                 </div>
                              </td>
                              <td className="p-1.5 text-center">
                                 <button 
                                    onClick={handleSaveRow}
                                    className="p-1 bg-white hover:bg-emerald-50 rounded-md text-slate-500 hover:text-emerald-600 transition-all border border-slate-200 group-hover/row:border-emerald-200 shadow-sm"
                                    title="Simpan Baris Ini"
                                 >
                                    <Save className="w-3 h-3" />
                                 </button>
                              </td>
                           </tr>
                        );
                     })}
                  </tbody>
               </table>
            </div>
            
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
               <div className="flex items-center gap-2">
                  <Info className="w-3 h-3 text-primary" />
                  <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest leading-none">
                     Klik ikon simpan pada baris atau tombol "Simpan Semua" di atas untuk menyimpan Rencana Program secara permanen.
                  </p>
               </div>
               <button 
                  onClick={handleSaveRow}
                  className="px-4 py-2 bg-primary hover:opacity-90 text-white rounded-lg font-black text-[8px] uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
               >
                  <Database className="w-3 h-3" /> SIMPAN DATABASE
               </button>
            </div>
            <div className="px-4 pb-4">
               <p className="text-[9px] text-red-600 font-bold italic uppercase tracking-tight">
                  Catatan : 'Kolom RENCANA PROGRAM diisi secara manual (sendiri), sesuai dengan perencanaan anda'
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ComponentRecap;
