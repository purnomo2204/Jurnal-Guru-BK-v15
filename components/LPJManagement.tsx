
import React, { useState, useMemo, useEffect } from 'react';
import { ViewMode, Student, CounselingLog, TeacherData } from '../types';
import { FileDown, ArrowLeft, Save, FileText, Sparkles, Loader2, ClipboardCheck } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface LPJManagementProps {
  students: Student[];
  logs: CounselingLog[];
  academicYear: string;
  setView: (v: ViewMode) => void;
  teacherData: TeacherData;
  onSyncLPJ?: (payload: any) => void;
}

interface ManualNote {
  catatan: string;
  solusi: string;
  ket: string;
}

const LPJManagement: React.FC<LPJManagementProps> = ({ students, logs, academicYear, setView, teacherData, onSyncLPJ }) => {
  const [semester, setSemester] = useState<'Ganjil' | 'Genap' | 'Ganjil & Genap'>('Ganjil');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [isAISummarizing, setIsAISummarizing] = useState(false);
  
  const [manualNotes, setManualNotes] = useState<Record<string, ManualNote>>({});
  const [formMonth, setFormMonth] = useState<string>('');
  const [formCatatan, setFormCatatan] = useState<string>('');
  const [formSolusi, setFormSolusi] = useState<string>('');
  const [formKet, setFormKet] = useState<string>('');

  useEffect(() => {
    const saved = localStorage.getItem('guru_bk_lpj_notes');
    if (saved && saved !== "undefined") setManualNotes(JSON.parse(saved));
  }, []);

  const saveToLocal = (newNotes: Record<string, ManualNote>) => {
    localStorage.setItem('guru_bk_lpj_notes', JSON.stringify(newNotes));
    setManualNotes(newNotes);
  };

  const classes = useMemo(() => Array.from(new Set(students.map(s => s.className))), [students]);

  const ALL_MONTHS = [
    { name: 'Januari', index: 0 }, { name: 'Februari', index: 1 }, { name: 'Maret', index: 2 },
    { name: 'April', index: 3 }, { name: 'Mei', index: 4 }, { name: 'Juni', index: 5 },
    { name: 'Juli', index: 6 }, { name: 'Agustus', index: 7 }, { name: 'September', index: 8 },
    { name: 'Oktober', index: 9 }, { name: 'November', index: 10 }, { name: 'Desember', index: 11 },
  ];

  const targetMonths = useMemo(() => {
    if (semester === 'Ganjil') return ALL_MONTHS.slice(6, 12);
    if (semester === 'Genap') return ALL_MONTHS.slice(0, 6);
    return ALL_MONTHS;
  }, [semester]);

  useEffect(() => {
    if (targetMonths.length > 0 && !formMonth) {
      const firstMonth = targetMonths[0].name;
      setFormMonth(firstMonth);
      setFormCatatan(manualNotes[firstMonth]?.catatan || '');
      setFormSolusi(manualNotes[firstMonth]?.solusi || '');
      setFormKet(manualNotes[firstMonth]?.ket || '');
    }
  }, [targetMonths, formMonth, manualNotes]);

  const handleAISummarizeMonthly = async () => {
    const monthData = ALL_MONTHS.find(m => m.name === formMonth);
    if (!monthData) return;

    const monthlyLogs = logs.filter(l => {
      const d = new Date(l.date);
      return d.getMonth() === monthData.index && l.academicYear === academicYear && (selectedClass ? l.className === selectedClass : true);
    });

    if (monthlyLogs.length === 0) {
      alert("Tidak ada data layanan untuk diringkas pada bulan ini.");
      return;
    }

    setIsAISummarizing(true);
    try {
      const logDetails = monthlyLogs.map(l => `- [${l.studentName}]${l.topic ? ` (${l.topic})` : ''}: ${l.result}`).join('\n');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analisis data layanan BK ini dan buatkan ringkasan profesional (maksimal 25 kata) untuk laporan kinerja bulanan: \n\n${logDetails}`,
      });
      
      const summaryText = response.text?.trim();
      if (summaryText) {
        setFormCatatan(summaryText);
        setFormSolusi("Tindak lanjut pemantauan intensif berkala dan pendampingan berkelanjutan.");
      }
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setIsAISummarizing(false);
    }
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMonth) return;
    const updatedNotes = { ...manualNotes, [formMonth]: { catatan: formCatatan, solusi: formSolusi, ket: formKet } };
    saveToLocal(updatedNotes);
    if (onSyncLPJ) onSyncLPJ({ month: formMonth, note: formCatatan, solution: formSolusi, info: formKet, className: selectedClass || "Global" });
  };

  const rekapData = useMemo(() => {
    return targetMonths.map((m) => {
      const monthlyLogs = logs.filter(l => {
        const d = new Date(l.date);
        return d.getMonth() === m.index && l.academicYear === academicYear && (selectedClass ? l.className === selectedClass : true);
      });
      const note = manualNotes[m.name] || { catatan: '', solusi: '', ket: '' };
      
      const uniqueTopics = Array.from(new Set(monthlyLogs.filter(l => (l.type === 'Bimbingan Klasikal' || l.type === 'Bimbingan Kelompok' || l.type === 'Konseling Kelompok') && l.topic).map(l => l.topic))).join(', ');
      const totalAbsents = monthlyLogs.reduce((acc, l) => acc + (l.absentStudentIds?.length || 0), 0);

      return {
        bulan: m.name,
        // Layanan Dasar
        klasikal: monthlyLogs.filter(l => l.type === 'Bimbingan Klasikal').length,
        bimbKelompok: monthlyLogs.filter(l => l.type === 'Bimbingan Kelompok').length,
        // Layanan Responsif / Peminatan
        konsIndividu: monthlyLogs.filter(l => l.type === 'Konseling Individu').length,
        konsKelompok: monthlyLogs.filter(l => l.type === 'Konseling Kelompok').length,
        // Konsultasi
        konsultasi: monthlyLogs.filter(l => ['Konsultasi dengan Wali Kelas', 'Konsultasi dengan Guru', 'Konsultasi dengan Orang Tua / Wali'].includes(l.type)).length,
        // Home Visit (Terpisah)
        homeVisit: monthlyLogs.filter(l => l.type === 'Home Visit').length,
        // Referal (Termasuk Konferensi Kasus)
        referal: monthlyLogs.filter(l => l.type === 'Referal' || l.type === 'Konferensi Kasus').length,
        // Dukungan Sistem
        dukunganSistem: monthlyLogs.filter(l => l.component === 'Dukungan Sistem').length,
        
        topics: uniqueTopics,
        absents: totalAbsents,
        catatan: note.catatan, solusi: note.solusi, ket: note.ket
      };
    });
  }, [logs, academicYear, selectedClass, targetMonths, manualNotes]);

  const handleDownloadDocx = () => {
    let content = `LAPORAN PERTANGGUNGJAWABAN (LPJ) LAYANAN BK\n`;
    content += `Sekolah: ${teacherData.school}\n`;
    content += `Tahun Ajaran: ${academicYear}\n`;
    content += `Semester: ${semester}\n`;
    content += `Guru BK: ${teacherData.name}\n\n`;
    content += `REKAPITULASI LAYANAN:\n`;
    content += `--------------------------------------------------------------------------------------------------\n`;
    content += `Bulan | Klasikal | Bimb.Kelp | Kons.Indiv | Kons.Kelp | Konsultasi | Home Visit | Referal | Dukungan\n`;
    content += `--------------------------------------------------------------------------------------------------\n`;
    
    rekapData.forEach(d => {
      content += `${d.bulan.padEnd(10)} | ${String(d.klasikal).padEnd(8)} | ${String(d.bimbKelompok).padEnd(9)} | ${String(d.konsIndividu).padEnd(10)} | ${String(d.konsKelompok).padEnd(9)} | ${String(d.konsultasi).padEnd(10)} | ${String(d.homeVisit).padEnd(10)} | ${String(d.referal).padEnd(7)} | ${String(d.dukunganSistem).padEnd(8)}\n`;
    });
    
    content += `\nNARASI LAPORAN BULANAN:\n`;
    rekapData.forEach(d => {
      if (d.catatan) {
        content += `\n[${d.bulan}]\nCatatan: ${d.catatan}\nSolusi: ${d.solusi}\n`;
      }
    });

    const blob = new Blob([content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LPJ_BK_${teacherData.name.replace(/\s+/g, '_')}_${semester}.doc`;
    link.click();
  };

  return (
    <div className="space-y-3 animate-fade-in pb-4 text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 px-4">
        <div className="space-y-0">
          <p className="label-luxe text-blue-500 font-black tracking-[0.2em] text-[6px]">EVALUASI KINERJA BK PRO</p>
          <h2 className="text-lg font-black text-slate-800 tracking-tighter uppercase leading-none">Laporan <span className="text-blue-500 font-light italic lowercase">LPJ Kinerja</span></h2>
        </div>
        <div className="flex flex-wrap gap-1">
          <button onClick={() => setView(ViewMode.HOME)} className="bg-white px-2 py-1 rounded-md font-black border border-slate-200 transition-all hover:bg-slate-100 flex items-center gap-1 text-[7px] text-blue-500 shadow-sm uppercase tracking-widest group">
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" /> DASHBOARD
          </button>
          <button onClick={handleDownloadDocx} className="bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white px-3 py-1 rounded-md font-black flex items-center gap-1 shadow-md shadow-blue-500/10 text-[7px] uppercase tracking-widest transition-all hover:scale-[1.01] active:scale-[0.99]">
            <FileDown className="w-3 h-3" /> GENERATE LPJ .DOCX
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mx-4">
        <div className="lg:col-span-1 space-y-3">
          <div className="glass-card p-3 rounded-xl border border-slate-200 space-y-2 bg-white/60 shadow-md">
            <div className="space-y-2">
              <div className="space-y-1 text-left">
                <label className="label-luxe ml-1 text-[6px]">Pilih Semester</label>
                <select value={semester} onChange={(e) => setSemester(e.target.value as any)} className="w-full input-cyber p-1.5 text-[9px] font-black outline-none text-slate-800 rounded-md cursor-pointer focus:border-blue-500/20">
                  <option value="Ganjil">Semester Ganjil</option>
                  <option value="Genap">Semester Genap</option>
                  <option value="Ganjil & Genap">Full Satu Tahun Ajaran</option>
                </select>
              </div>
              <div className="space-y-1 text-left">
                <label className="label-luxe ml-1 text-[6px]">Filter Bimbingan</label>
                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full input-cyber p-1.5 text-[9px] font-black outline-none text-slate-800 rounded-md cursor-pointer focus:border-blue-500/20">
                  <option value="">Semua Siswa Bimbingan</option>
                  {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="glass-card p-3 rounded-xl border border-slate-200 bg-white/60 shadow-md">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-black text-slate-800 flex items-center gap-1 uppercase tracking-tighter"><div className="p-1 bg-blue-500/20 rounded-md"><ClipboardCheck className="w-3 h-3 text-blue-500" /></div> Input Rekap</h3>
              <button type="button" onClick={handleAISummarizeMonthly} disabled={isAISummarizing} className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[6px] font-black uppercase tracking-widest transition-all hover:bg-blue-500/20">
                {isAISummarizing ? <Loader2 className="w-2 h-2 animate-spin" /> : <Sparkles className="w-2 h-2" />} AI Ringkas
              </button>
            </div>
            <form onSubmit={handleSaveNote} className="space-y-2 text-left">
              <div className="space-y-1">
                <label className="label-luxe ml-1 text-[6px]">Bulan Laporan</label>
                <select value={formMonth} onChange={(e) => setFormMonth(e.target.value)} className="w-full p-1.5 text-[9px] font-black input-cyber text-slate-800 rounded-md outline-none cursor-pointer focus:border-blue-500/20">
                  {targetMonths.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="label-luxe ml-1 text-[6px]">Narasi Laporan</label>
                <textarea value={formCatatan} onChange={e => setFormCatatan(e.target.value)} className="w-full p-1.5 h-16 text-[8px] outline-none input-cyber text-slate-800 rounded-md leading-tight placeholder:text-slate-700 focus:border-blue-500/20" placeholder="Masukan narasi singkat laporan..." />
              </div>
              <div className="space-y-1">
                <label className="label-luxe ml-1 text-[6px]">Solusi / Tindak Lanjut</label>
                <input value={formSolusi} onChange={e => setFormSolusi(e.target.value)} className="w-full p-1.5 text-[8px] input-cyber text-slate-800 rounded-md outline-none placeholder:text-slate-700 focus:border-blue-500/20" placeholder="Solusi penanganan..." />
              </div>
              <button type="submit" className="w-full bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white py-1.5 rounded-md font-black text-[7px] uppercase tracking-[0.2em] shadow-md shadow-blue-500/10 transition-all flex items-center justify-center gap-1">
                <Save className="w-3 h-3" /> SIMPAN REKAP BULANAN
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="glass-card rounded-xl border border-slate-200 overflow-hidden shadow-md bg-white/60">
            <div className="p-3 border-b border-slate-200 bg-slate-50/50 text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl -mr-12 -mt-12 rounded-full" />
              <h3 className="text-sm font-black text-slate-800 tracking-tighter uppercase italic relative">Preview Rekap Administrasi BK</h3>
              <p className="text-[6px] text-blue-500 font-black tracking-[0.2em] mt-0.5 uppercase relative">Dashboard Akumulasi Strategi Layanan Bimbingan & Konseling</p>
            </div>
            <div className="overflow-x-auto scroll-hide">
              <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/80 text-blue-500 text-[6px] font-black uppercase tracking-widest border-b border-slate-200">
                    <th className="p-1.5">Bulan</th>
                    <th className="p-1 text-center">Klasikal</th>
                    <th className="p-1 text-center">Bimb. Kelp</th>
                    <th className="p-1 text-center">Kons. Indiv</th>
                    <th className="p-1 text-center">Kons. Kelp</th>
                    <th className="p-1 text-center">Konsultasi</th>
                    <th className="p-1 text-center">Home Visit</th>
                    <th className="p-1 text-center">Referal</th>
                    <th className="p-1 text-center">Dukungan</th>
                    <th className="p-1.5 text-center">Absen</th>
                    <th className="p-1.5">Topik Layanan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rekapData.map((d) => (
                    <tr key={d.bulan} className="hover:bg-blue-500/5 transition-all group">
                      <td className="p-1.5 font-black text-slate-800 text-[9px] uppercase tracking-tighter">{d.bulan}</td>
                      <td className="p-1 text-center text-blue-500 font-black text-[9px]">{d.klasikal || '-'}</td>
                      <td className="p-1 text-center text-sky-400 font-black text-[9px]">{d.bimbKelompok || '-'}</td>
                      <td className="p-1 text-center text-indigo-400 font-black text-[9px]">{d.konsIndividu || '-'}</td>
                      <td className="p-1 text-center text-violet-400 font-black text-[9px]">{d.konsKelompok || '-'}</td>
                      <td className="p-1 text-center text-teal-400 font-black text-[9px]">{d.konsultasi || '-'}</td>
                      <td className="p-1 text-center text-rose-400 font-black text-[9px]">{d.homeVisit || '-'}</td>
                      <td className="p-1 text-center text-emerald-400 font-black text-[9px]">{d.referal || '-'}</td>
                      <td className="p-1 text-center text-amber-400 font-black text-[9px]">{d.dukunganSistem || '-'}</td>
                      <td className="p-1.5 text-center text-rose-500 font-black text-[9px]">{d.absents || '-'}</td>
                      <td className="p-1.5 max-w-[80px]">
                        <p className="text-[6px] text-indigo-400 font-black uppercase tracking-widest truncate" title={d.topics}>{d.topics || '-'}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-2 p-2 glass-card rounded-lg border border-blue-500/10 flex items-center gap-2 bg-blue-500/5 shadow-sm">
            <div className="p-1 bg-blue-500/20 rounded-md">
              <FileText className="w-3 h-3 text-blue-500" />
            </div>
            <p className="text-[7px] text-slate-500 font-medium uppercase tracking-widest text-left leading-tight">
              Tabel di atas merekapitulasi data berdasarkan <span className="text-blue-500 font-black">Komponen dan Strategi Layanan</span> sesuai panduan operasional BK terbaru. 
              Gunakan <span className="text-slate-800 font-black">"Generate LPJ"</span> untuk menyusun dokumen laporan formal .docx secara otomatis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LPJManagement;
