import React, { useState, useRef } from 'react';
import { 
  RPL, 
  TeacherData, 
  ServiceComponent, 
  CounselingType, 
  CounselingAspect 
} from '../types';
import { 
  FileText, 
  Sparkles, 
  Plus, 
  Trash2, 
  ArrowLeft,
  Loader2,
  Printer,
  Save,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';

interface RplGeneratorProps {
  teacherData: TeacherData;
  onSave?: (rpl: RPL) => void;
  savedRpls: RPL[];
  onDelete?: (id: string) => void;
}

const RplGenerator: React.FC<RplGeneratorProps> = ({ 
  teacherData, 
  onSave, 
  savedRpls,
  onDelete 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedRpl, setSelectedRpl] = useState<RPL | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    topic: '',
    component: 'Layanan Dasar' as ServiceComponent,
    type: 'Bimbingan Klasikal' as CounselingType,
    aspect: 'Pribadi' as CounselingAspect,
    targetClass: '',
    semester: 'Ganjil' as 'Ganjil' | 'Genap',
    academicYear: teacherData.academicYear || '',
    duration: '1 x 45 Menit',
    date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  });

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `RPL_${selectedRpl?.topic || 'BK'}`,
  });

  const generateRplWithAI = async () => {
    if (!formData.topic) {
      toast.error('Tolong masukkan topik RPL');
      return;
    }

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

      const prompt = `
        Buatkan Rencana Pelaksanaan Layanan (RPL) Bimbingan Konseling yang profesional dan lengkap dalam format JSON.
        Topik: ${formData.topic}
        Komponen Layanan: ${formData.component}
        Jenis Layanan: ${formData.type}
        Bidang Layanan: ${formData.aspect}
        Sasaran: Kelas ${formData.targetClass}
        Waktu: ${formData.duration}

        JSON harus memiliki struktur berikut:
        {
          "objectives": {
            "general": "tujuan umum",
            "specific": ["tujuan khusus 1", "tujuan khusus 2"]
          },
          "materials": ["materi 1", "materi 2"],
          "methods": ["metode 1", "metode 2"],
          "media": ["media 1", "media 2"],
          "steps": {
            "opening": ["langkah pembukaan 1", "langkah pembukaan 2"],
            "core": ["langkah inti 1", "langkah inti 2"],
            "closing": ["langkah penutup 1", "langkah penutup 2"]
          },
          "evaluation": {
            "process": "evaluasi proses",
            "result": "evaluasi hasil"
          }
        }
        Berikan hanya JSON saja, tanpa markdown formatting.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      
      const text = response.text || '';
      const cleanJson = text.replace(/```json|```/g, '').trim();
      const aiData = JSON.parse(cleanJson);

      const newRpl: RPL = {
        id: Date.now().toString(),
        ...formData,
        ...aiData
      };

      setSelectedRpl(newRpl);
      toast.success('RPL Berhasil Dihasilkan oleh AI');
    } catch (error) {
      console.error('Error generating RPL:', error);
      toast.error('Gagal menghasilkan RPL. Pastikan API Key Gemini sudah benar.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (selectedRpl && onSave) {
      onSave(selectedRpl);
      toast.success('RPL Berhasil Disimpan');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Modul RPL Otomatis</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hasilkan Rencana Pelaksanaan Layanan dengan AI</p>
        </div>
        {!showForm && !selectedRpl && (
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
          >
            <Plus className="w-4 h-4" /> Buat RPL Baru
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          {showForm ? (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Parameter RPL</h3>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Topik / Tema Layanan</label>
                  <input 
                    type="text"
                    value={formData.topic}
                    onChange={(e) => setFormData({...formData, topic: e.target.value})}
                    placeholder="Contoh: Bahaya Narkoba, Manajemen Waktu"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Sasaran Kelas</label>
                    <input 
                      type="text"
                      value={formData.targetClass}
                      onChange={(e) => setFormData({...formData, targetClass: e.target.value})}
                      placeholder="Contoh: 7A, 8B"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Durasi</label>
                    <input 
                      type="text"
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Semester</label>
                    <select 
                      value={formData.semester}
                      onChange={(e) => setFormData({...formData, semester: e.target.value as 'Ganjil' | 'Genap'})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:border-indigo-500 outline-none appearance-none"
                    >
                      <option value="Ganjil">Ganjil</option>
                      <option value="Genap">Genap</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Tahun Ajaran</label>
                    <input 
                      type="text"
                      value={formData.academicYear}
                      onChange={(e) => setFormData({...formData, academicYear: e.target.value})}
                      placeholder="Contoh: 2023/2024"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Komponen Layanan</label>
                  <select 
                    value={formData.component}
                    onChange={(e) => setFormData({...formData, component: e.target.value as ServiceComponent})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:border-indigo-500 outline-none appearance-none"
                  >
                    <option value="Layanan Dasar">Layanan Dasar</option>
                    <option value="Layanan Responsif">Layanan Responsif</option>
                    <option value="Peminatan dan Perencanaan Individu">Peminatan dan Perencanaan Individu</option>
                    <option value="Dukungan Sistem">Dukungan Sistem</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Bidang Layanan</label>
                  <select 
                    value={formData.aspect}
                    onChange={(e) => setFormData({...formData, aspect: e.target.value as CounselingAspect})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:border-indigo-500 outline-none appearance-none"
                  >
                    <option value="Pribadi">Pribadi</option>
                    <option value="Sosial">Sosial</option>
                    <option value="Belajar">Belajar</option>
                    <option value="Karier">Karier</option>
                  </select>
                </div>

                <button 
                  onClick={generateRplWithAI}
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-indigo-600 to-sky-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-sky-600/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Menghasilkan RPL...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Generate dengan AI
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">RPL Tersimpan</h3>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {savedRpls.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <FileText className="w-12 h-12 mx-auto opacity-10 mb-2" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Belum ada RPL tersimpan</p>
                  </div>
                ) : (
                  savedRpls.map((rpl) => (
                    <div 
                      key={rpl.id}
                      onClick={() => setSelectedRpl(rpl)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
                        selectedRpl?.id === rpl.id 
                          ? 'bg-indigo-50 border-indigo-200' 
                          : 'bg-slate-50 border-slate-100 hover:border-indigo-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-[8px] font-black text-indigo-600 uppercase tracking-widest mb-1">{rpl.aspect}</p>
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight line-clamp-1">{rpl.topic}</h4>
                          <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Kelas {rpl.targetClass} • {rpl.date}</p>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onDelete) onDelete(rpl.id);
                          }}
                          className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedRpl ? (
              <motion.div 
                key="preview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <div className="bg-slate-50 border-b border-slate-200 p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                      <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Preview RPL</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Siap Cetak & Simpan</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleSave}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-700 transition-all"
                    >
                      <Save className="w-3.5 h-3.5" /> Simpan
                    </button>
                    <button 
                      onClick={() => handlePrint()}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-900 transition-all"
                    >
                      <Printer className="w-3.5 h-3.5" /> Cetak
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-slate-100/50 overflow-auto max-h-[800px]">
                  <div 
                    ref={printRef}
                    className="bg-white p-12 shadow-2xl mx-auto w-[210mm] min-h-[297mm] text-slate-900 font-serif"
                    style={{ 
                      printColorAdjust: 'exact',
                      WebkitPrintColorAdjust: 'exact'
                    }}
                  >
                    <div className="text-center border-b-[3px] border-slate-900 pb-4 mb-8 space-y-1">
                      <h2 className="text-xl font-bold uppercase tracking-tight">RENCANA PELAKSANAAN LAYANAN (RPL)</h2>
                      <h2 className="text-xl font-bold uppercase tracking-tight">BIMBINGAN DAN KONSELING</h2>
                      <h3 className="text-lg font-bold uppercase tracking-wide">{teacherData.school}</h3>
                      <p className="text-[11px] font-medium italic">{teacherData.schoolAddress}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-[12px] mb-8">
                      <div className="flex justify-between border-b border-slate-200 pb-1">
                        <span className="font-bold">Komponen Layanan</span>
                        <span className="text-right">{selectedRpl.component}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-1">
                        <span className="font-bold">Bidang Layanan</span>
                        <span className="text-right">{selectedRpl.aspect}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-1">
                        <span className="font-bold">Topik / Tema</span>
                        <span className="text-right font-bold">{selectedRpl.topic}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-1">
                        <span className="font-bold">Sasaran / Kelas</span>
                        <span className="text-right">{selectedRpl.targetClass}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-1">
                        <span className="font-bold">Semester / TA</span>
                        <span className="text-right">{selectedRpl.semester} / {selectedRpl.academicYear}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-1">
                        <span className="font-bold">Alokasi Waktu</span>
                        <span className="text-right">{selectedRpl.duration}</span>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <section className="space-y-2">
                        <h5 className="text-[13px] font-bold uppercase bg-slate-100 p-1 px-3 border-l-4 border-indigo-600">1. Tujuan Layanan</h5>
                        <div className="pl-6 space-y-3">
                          <div>
                            <p className="text-[12px] font-bold underline mb-1">Tujuan Umum:</p>
                            <p className="text-[12px] text-justify">{selectedRpl.objectives.general}</p>
                          </div>
                          <div>
                            <p className="text-[12px] font-bold underline mb-1">Tujuan Khusus:</p>
                            <ul className="list-disc pl-5 text-[12px] space-y-1">
                              {selectedRpl.objectives.specific.map((obj, i) => <li key={i} className="text-justify">{obj}</li>)}
                            </ul>
                          </div>
                        </div>
                      </section>

                      <section className="space-y-2">
                        <h5 className="text-[13px] font-bold uppercase bg-slate-100 p-1 px-3 border-l-4 border-indigo-600">2. Metode, Alat dan Media</h5>
                        <div className="pl-6 grid grid-cols-2 gap-8 text-[12px]">
                          <div>
                            <p className="font-bold underline mb-1">Metode:</p>
                            <p>{selectedRpl.methods.join(', ')}</p>
                          </div>
                          <div>
                            <p className="font-bold underline mb-1">Alat / Media:</p>
                            <p>{selectedRpl.media.join(', ')}</p>
                          </div>
                        </div>
                      </section>

                      <section className="space-y-2">
                        <h5 className="text-[13px] font-bold uppercase bg-slate-100 p-1 px-3 border-l-4 border-indigo-600">3. Langkah-langkah Kegiatan</h5>
                        <div className="pl-6 space-y-4 text-[12px]">
                          <div>
                            <p className="font-bold underline mb-1 italic">A. Tahap Pembentukan (Opening):</p>
                            <ul className="list-decimal pl-5 space-y-1">
                              {selectedRpl.steps.opening.map((step, i) => <li key={i} className="text-justify">{step}</li>)}
                            </ul>
                          </div>
                          <div>
                            <p className="font-bold underline mb-1 italic">B. Tahap Inti (Core):</p>
                            <ul className="list-decimal pl-5 space-y-1">
                              {selectedRpl.steps.core.map((step, i) => <li key={i} className="text-justify">{step}</li>)}
                            </ul>
                          </div>
                          <div>
                            <p className="font-bold underline mb-1 italic">C. Tahap Penutup (Closing):</p>
                            <ul className="list-decimal pl-5 space-y-1">
                              {selectedRpl.steps.closing.map((step, i) => <li key={i} className="text-justify">{step}</li>)}
                            </ul>
                          </div>
                        </div>
                      </section>

                      <section className="space-y-2">
                        <h5 className="text-[13px] font-bold uppercase bg-slate-100 p-1 px-3 border-l-4 border-indigo-600">4. Evaluasi</h5>
                        <div className="pl-6 grid grid-cols-2 gap-8 text-[12px]">
                          <div>
                            <p className="font-bold underline mb-1">Evaluasi Proses:</p>
                            <p className="text-justify">{selectedRpl.evaluation.process}</p>
                          </div>
                          <div>
                            <p className="font-bold underline mb-1">Evaluasi Hasil:</p>
                            <p className="text-justify">{selectedRpl.evaluation.result}</p>
                          </div>
                        </div>
                      </section>
                    </div>

                    <div className="mt-16 grid grid-cols-2 gap-24 text-[12px]">
                      <div className="text-center space-y-20">
                        <p>Mengetahui,<br/>Kepala Sekolah</p>
                        <div className="space-y-1">
                          <p className="font-bold underline">{teacherData.principalName || '................................................'}</p>
                          <p>NIP. {teacherData.principalNip || '................................................'}</p>
                        </div>
                      </div>
                      <div className="text-center space-y-20">
                        <p>{teacherData.city || 'Magelang'}, {selectedRpl.date}<br/>Guru BK</p>
                        <div className="space-y-1">
                          <p className="font-bold underline">{teacherData.name || '................................................'}</p>
                          <p>NIP. {teacherData.nip || '................................................'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full min-h-[600px] flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 border-dashed p-10 text-slate-400"
              >
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                  <Sparkles className="w-10 h-10 opacity-20" />
                </div>
                <h4 className="text-lg font-black text-slate-300 uppercase tracking-tight">Belum Ada RPL Terpilih</h4>
                <p className="text-xs font-bold uppercase tracking-widest max-w-xs text-center mt-2">
                  Silakan buat RPL baru menggunakan AI atau pilih dari daftar RPL yang sudah tersimpan.
                </p>
                {!showForm && (
                  <button 
                    onClick={() => setShowForm(true)}
                    className="mt-8 px-8 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Mulai Sekarang
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default RplGenerator;
