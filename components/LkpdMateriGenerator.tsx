import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, FileText, BookOpen, Download, RefreshCw, X, Loader2 } from 'lucide-react';
import { TeacherData } from '../types';
import html2pdf from 'html2pdf.js';

interface LkpdMateriGeneratorProps {
  teacherData: TeacherData;
}

const LkpdMateriGenerator: React.FC<LkpdMateriGeneratorProps> = ({ teacherData }) => {
  const [type, setType] = useState<'LKPD' | 'MATERI'>('LKPD');
  const [kelas, setKelas] = useState('');
  const [strategi, setStrategi] = useState('');
  const [waktu, setWaktu] = useState('');
  const [format, setFormat] = useState('DOCS');
  const [materi, setMateri] = useState('');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    if (!kelas || !materi || !prompt || (type === 'MATERI' && (!strategi || !waktu))) {
      alert('Mohon isi semua form.');
      return;
    }

    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Buatkan ${type} untuk kelas ${kelas} dengan materi ${materi}. 
        ${type === 'MATERI' ? `Strategi: ${strategi}, Waktu: ${waktu}, Format: ${format}.` : ''}
        Perintah khusus: ${prompt}. 
        Gunakan data berikut: Nama Guru: ${teacherData.name}, Nama Sekolah: ${teacherData.school}.
        Berikan hasil dalam format markdown yang rapi.`,
      });
      setResult(response.text || '');
    } catch (error) {
      console.error('AI Generation error:', error);
      alert('Gagal membuat konten dengan AI.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const element = previewRef.current;
    if (!element) return;

    const opt = {
      margin:       [20, 20, 20, 20] as [number, number, number, number],
      filename:     `${type}_${materi}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { 
        scale: 2, 
        useCORS: true, 
        allowTaint: true,
        onclone: (document: Document) => {
          const styles = document.querySelectorAll('style');
          styles.forEach(s => {
            if (s.innerHTML.includes('oklch')) {
              s.innerHTML = s.innerHTML.replace(/oklch\([^)]+\)/g, 'inherit');
            }
          });
          const allElements = document.querySelectorAll('*');
          allElements.forEach(el => {
            const style = el.getAttribute('style');
            if (style && style.includes('oklch')) {
              el.setAttribute('style', style.replace(/oklch\([^)]+\)/g, 'inherit'));
            }
          });
        }
      },
      jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200 animate-fade-in">
      <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-sky-500" />
        Generator {type} & Materi BK
      </h2>

      <div className="flex gap-1.5 mb-3">
        <button 
          onClick={() => setType('LKPD')}
          className={`flex-1 py-1.5 rounded-md font-black text-[8px] uppercase tracking-widest transition-all ${type === 'LKPD' ? 'bg-sky-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          LKPD
        </button>
        <button 
          onClick={() => setType('MATERI')}
          className={`flex-1 py-1.5 rounded-md font-black text-[8px] uppercase tracking-widest transition-all ${type === 'MATERI' ? 'bg-sky-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          Materi Layanan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
        <div className="space-y-0.5">
          <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Nama Guru BK</label>
          <input type="text" value={teacherData.name} disabled className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-md text-[9px] font-bold" />
        </div>
        <div className="space-y-0.5">
          <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Nama Sekolah</label>
          <input type="text" value={teacherData.school} disabled className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-md text-[9px] font-bold" />
        </div>
      </div>

      <div className="space-y-2 mb-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-0.5 col-span-1">
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Kelas</label>
            <input type="text" value={kelas} onChange={e => setKelas(e.target.value)} placeholder="Contoh: VII-A" className="w-full p-1.5 border border-slate-200 rounded-md text-[9px] outline-none focus:ring-2 focus:ring-sky-500/20" />
          </div>
          <div className="space-y-0.5 col-span-1">
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Strategi</label>
            <input type="text" value={strategi} onChange={e => setStrategi(e.target.value)} placeholder="Contoh: Diskusi" className="w-full p-1.5 border border-slate-200 rounded-md text-[9px] outline-none focus:ring-2 focus:ring-sky-500/20" />
          </div>
          <div className="space-y-0.5 col-span-1">
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Waktu</label>
            <input type="text" value={waktu} onChange={e => setWaktu(e.target.value)} placeholder="Contoh: 45 Menit" className="w-full p-1.5 border border-slate-200 rounded-md text-[9px] outline-none focus:ring-2 focus:ring-sky-500/20" />
          </div>
        </div>
        
        {type === 'MATERI' && (
          <div className="space-y-0.5">
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Format</label>
            <select value={format} onChange={e => setFormat(e.target.value)} className="w-full p-1.5 border border-slate-200 rounded-md text-[9px] outline-none focus:ring-2 focus:ring-sky-500/20">
              <option value="DOCS">DOCS</option>
              <option value="PDF">PDF</option>
              <option value="PPT">PPT</option>
            </select>
          </div>
        )}

        <div className="space-y-0.5">
          <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Materi</label>
          <input type="text" value={materi} onChange={e => setMateri(e.target.value)} placeholder="Contoh: Manajemen Waktu" className="w-full p-1.5 border border-slate-200 rounded-md text-[9px] outline-none focus:ring-2 focus:ring-sky-500/20" />
        </div>
        <div className="space-y-0.5">
          <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Tulis Perintah (Prompt)</label>
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Jelaskan detail..." className="w-full p-1.5 border border-slate-200 rounded-md text-[9px] outline-none focus:ring-2 focus:ring-sky-500/20 h-16" />
        </div>
        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-1.5 bg-sky-600 text-white rounded-md text-[9px] font-black uppercase tracking-widest hover:bg-sky-700 transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />}
          {loading ? 'Membuat...' : 'Buat Dengan AI'}
        </button>
      </div>

      {result && (
        <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-tight mb-2">Hasil Generator</h3>
          <div ref={previewRef} className="border border-slate-300 bg-white p-4 shadow-sm rounded-md mb-3 min-h-[300px]">
            <div className="prose prose-sm max-w-none text-[10px] whitespace-pre-wrap">{result}</div>
          </div>
          <div className="flex gap-1.5">
            <button onClick={handleDownload} className="flex-1 py-1.5 bg-white border border-slate-200 rounded-md text-[8px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-1">
              <Download className="w-2.5 h-2.5" /> Download
            </button>
            <button onClick={() => setResult('')} className="flex-1 py-1.5 bg-white border border-slate-200 rounded-md text-[8px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-1">
              <X className="w-2.5 h-2.5" /> Batal
            </button>
            <button onClick={handleGenerate} className="flex-1 py-1.5 bg-sky-600 text-white rounded-md text-[8px] font-black uppercase tracking-widest hover:bg-sky-700 transition-all shadow-sm flex items-center justify-center gap-1">
              <RefreshCw className="w-2.5 h-2.5" /> Buat Lain
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LkpdMateriGenerator;
