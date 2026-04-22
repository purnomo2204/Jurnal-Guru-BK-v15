import React, { useState, useMemo, useEffect } from 'react';
import { ViewMode, Student, CounselingLog, CounselingType, CounselingAspect, CounselingStatus, TeacherData, CounselingGroup, ServiceComponent } from '../types';
import { formatAcademicTitle } from '../src/lib/nameFormatter';
import { Send, ArrowLeft, Eye, X, Plus, Filter, Calendar, Clock, BookOpen, Activity, CheckCircle2, Edit, Trash2, Sparkles, Loader2, HeartHandshake, Users, Info, Briefcase, UserCheck, UserPlus, FileText, UserMinus, Layers, ExternalLink, Target } from 'lucide-react';
import FormActions from './FormActions';
import { useFormDraft } from '../hooks/useFormDraft';
import { GoogleGenAI } from "@google/genai";
import { toast } from 'sonner';
import { validateRequired, validateDateNotFuture } from '../src/lib/validation';

const strategyMapping: Record<ServiceComponent, CounselingType[]> = {
  'Layanan Dasar': ['Bimbingan Klasikal', 'Bimbingan Kelompok'],
  'Layanan Responsif': [
    'Konseling Individu', 'Konseling Kelompok', 'Referal', 
    'Konsultasi dengan Wali Kelas', 'Konsultasi dengan Guru', 
    'Konsultasi dengan Orang Tua / Wali', 'Home Visit', 'Konferensi Kasus'
  ],
  'Peminatan dan Perencanaan Individu': [
    'Konseling Individu', 'Konseling Kelompok', 'Konsultasi dengan Orang Tua / Wali'
  ],
  'Dukungan Sistem': ['Pengembangan Diri', 'Kolaborasi']
};

const CounselingManagement: React.FC<{ view: ViewMode; setView: (v: ViewMode) => void; students: Student[]; groups: CounselingGroup[]; logs: CounselingLog[]; onAdd: (l: CounselingLog, sync?: boolean) => void; onUpdate: (log: CounselingLog, sync?: boolean) => void; onDelete: (id: string) => void; globalAcademicYear: string; teacherData: TeacherData; initialEditId?: string | null; clearEditId?: () => void }> = ({ view, setView, students, groups, logs, onAdd, onUpdate, onDelete, globalAcademicYear, teacherData, initialEditId, clearEditId }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [filterType, setFilterType] = useState<string>('Semua Strategi');
  const [inputClassFilter, setInputClassFilter] = useState<string>(''); 
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  const toggleSelectedClass = (className: string) => {
    setSelectedClasses(prev => prev.includes(className) ? prev.filter(c => c !== className) : [...prev, className]);
  };

  const filteredDisplayLogs = useMemo(() => {
    let filtered = logs;
    if (filterType !== 'Semua Strategi') {
      filtered = filtered.filter(log => log.type === filterType);
    }
    if (inputClassFilter) {
      filtered = filtered.filter(log => log.className === inputClassFilter);
    }
    return filtered;
  }, [logs, filterType, inputClassFilter]);
  
  const [formData, setFormData, clearFormData] = useFormDraft<Partial<CounselingLog>>("draft_counseling_form", {
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    academicYear: globalAcademicYear,
    studentId: '',
    component: 'Layanan Dasar',
    type: 'Bimbingan Klasikal',
    aspect: 'Belajar',
    result: '',
    status: 'baik',
    followUp: '',
    notes: '',
    consultantName: '',
    topic: '',
    purpose: '',
    absentStudentIds: [],
    groupId: ''
  });

  const startEdit = (log: CounselingLog) => {
    setEditingId(log.id);
    setFormData(log);
    if (log.studentId && log.studentId.startsWith('CLASS_')) setInputClassFilter(log.className);
    else {
      const student = students.find(s => s.id === log.studentId);
      if (student) setInputClassFilter(student.className);
    }
    setView(ViewMode.COUNSELING_INPUT);
  };

  useEffect(() => {
    if (initialEditId) {
      const logToEdit = logs.find(l => l.id === initialEditId);
      if (logToEdit) {
        startEdit(logToEdit);
      }
      if (clearEditId) clearEditId();
    }
  }, [initialEditId, logs, clearEditId]);

  const [previewLog, setPreviewLog] = useState<CounselingLog | null>(null);

  useEffect(() => {
    if (!editingId) setFormData(prev => ({ ...prev, academicYear: globalAcademicYear }));
  }, [globalAcademicYear, editingId]);

  const availableClasses = useMemo(() => {
    return Array.from(new Set(students.map(s => s.className))).sort();
  }, [students]);

  const filteredStudentsForInput = useMemo(() => {
    if (!inputClassFilter) return students;
    return students.filter(s => s.className === inputClassFilter);
  }, [students, inputClassFilter]);

  const selectedStudent = useMemo(() => students.find(s => s.id === formData.studentId), [formData.studentId, students]);
  

  const isConsultation = (type: string) => ['Konsultasi dengan Wali Kelas', 'Konsultasi dengan Guru', 'Konsultasi dengan Orang Tua / Wali', 'Referal', 'Home Visit', 'Konferensi Kasus', 'Kolaborasi'].includes(type);
  const isSpecialField = (type: string) => type === 'Bimbingan Klasikal' || type === 'Bimbingan Kelompok';

  const handleComponentChange = (comp: ServiceComponent) => {
    const availableStrategies = strategyMapping[comp];
    setFormData({
      ...formData,
      component: comp,
      type: availableStrategies[0],
      studentId: '',
      groupId: '',
      absentStudentIds: []
    });
  };

  const handleAISuggestFollowUp = async () => {
    if (!formData.result) return;
    setIsAIThinking(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Sebagai guru BK profesional, sarankan rencana tindak lanjut singkat (maks 2 kalimat) untuk layanan BK atas temuan: "${formData.result}". Gunakan Bahasa Indonesia edukatif.`,
      });
      const text = response.text?.trim();
      if (text) setFormData(prev => ({ ...prev, followUp: text }));
    } catch (e) { console.error(e); } finally { setIsAIThinking(false); }
  };

  const toggleAbsentStudent = (id: string) => {
    setFormData(prev => {
      const current = prev.absentStudentIds || [];
      const updated = current.includes(id) 
        ? current.filter(sId => sId !== id) 
        : [...current, id];
      return { ...prev, absentStudentIds: updated };
    });
  };

  const [waModal, setWaModal] = useState<{ show: boolean; number: string }>({ show: false, number: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!validateRequired(formData.date)) newErrors.date = "Tanggal wajib diisi";
    if (formData.date && !validateDateNotFuture(formData.date)) newErrors.date = "Tanggal tidak boleh di masa depan";
    
    if (!validateRequired(formData.startTime)) newErrors.startTime = "Waktu mulai wajib diisi";
    if (!validateRequired(formData.endTime)) newErrors.endTime = "Waktu selesai wajib diisi";
    
    if (formData.startTime && formData.endTime) {
      if (formData.startTime >= formData.endTime) {
        newErrors.endTime = "Waktu selesai harus setelah waktu mulai";
      }
    }
    
    if (!validateRequired(formData.topic)) newErrors.topic = "Topik wajib diisi";
    if (formData.topic && formData.topic.length < 5) newErrors.topic = "Topik minimal 5 karakter";
    
    if (!validateRequired(formData.result)) newErrors.result = "Uraian kegiatan wajib diisi";
    if (formData.result && formData.result.length < 10) newErrors.result = "Uraian minimal 10 karakter";
    
    if (!validateRequired(formData.followUp)) newErrors.followUp = "Tindak lanjut wajib diisi";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (syncOnline: boolean = true) => {
    if (!validateForm()) {
      toast.error("Mohon perbaiki kesalahan pada form sebelum menyimpan.");
      return;
    }

    const form = document.getElementById('counseling-form') as HTMLFormElement;
    if (form && !form.checkValidity()) {
      form.reportValidity();
      return;
    }

    let logData: Partial<CounselingLog>;
    const isKelompok = formData.type === 'Bimbingan Kelompok' || formData.type === 'Konseling Kelompok';
    const isKlasikal = formData.type === 'Bimbingan Klasikal';
    const isSupportSystem = formData.component === 'Dukungan Sistem';

    if (isKelompok) {
      const selectedGroup = groups.find(g => g.id === formData.groupId);
      if (!selectedGroup) { toast.error("Pilih kelompok bimbingan."); return; }
      logData = { ...formData, studentName: `${formData.type}: ${selectedGroup.name}`, className: selectedGroup.className, studentId: `GROUP_${selectedGroup.id}` };
    } else if (isKlasikal && inputClassFilter === '') {
      if (selectedClasses.length === 0) { toast.error("Pilih minimal satu kelas."); return; }
      
      // If multiple classes are selected, create multiple logs
      selectedClasses.forEach((className, index) => {
        const logForClass = { ...formData, studentId: `CLASS_${className}`, studentName: `Seluruh Siswa ${className}`, className: className };
        if (editingId && index === 0) {
          onUpdate({ ...logForClass as CounselingLog, id: editingId }, syncOnline);
        } else {
          onAdd({ ...logForClass as CounselingLog, id: Date.now().toString() + index }, syncOnline);
        }
      });
      
      toast.success(syncOnline ? "Data berhasil disimpan secara online" : "Data berhasil disimpan secara lokal");
      setEditingId(null);
      clearFormData();
      setInputClassFilter('');
      setSelectedClasses([]);
      setView(ViewMode.COUNSELING_DATA);
      return;
    } else if (isKlasikal || (formData.studentId && formData.studentId.startsWith('CLASS_'))) {
      const className = isKlasikal ? inputClassFilter : formData.studentId?.replace('CLASS_', '') || '';
      if (!className) { toast.error("Pilih kelas."); return; }
      logData = { ...formData, studentId: `CLASS_${className}`, studentName: `Seluruh Siswa ${className}`, className: className };
    } else if (isSupportSystem && !formData.studentId) {
      logData = { ...formData, studentId: 'SYSTEM', studentName: 'Umum / Pengembangan Diri', className: 'Instansi' };
    } else {
      const student = students.find(s => s.id === formData.studentId);
      if (!student) { toast.error("Pilih peserta didik."); return; }
      logData = { ...formData, studentName: student.name, className: student.className };
    }

    if (editingId) {
      onUpdate({ ...logData as CounselingLog, id: editingId }, syncOnline);
      toast.success(syncOnline ? "Data berhasil diperbarui secara online" : "Data berhasil diperbarui secara lokal");
    } else {
      onAdd({ ...logData as CounselingLog, id: Date.now().toString() }, syncOnline);
      toast.success(syncOnline ? "Data berhasil disimpan secara online" : "Data berhasil disimpan secara lokal");
    }
    
    setEditingId(null);
    clearFormData();
    setInputClassFilter('');
    setView(ViewMode.COUNSELING_DATA);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave(true);
  };

  if (view === ViewMode.COUNSELING_INPUT) {
    const currentStrategies = strategyMapping[formData.component as ServiceComponent] || [];
    const isCurrentKlasikal = formData.type === 'Bimbingan Klasikal';
    const isCurrentKelompok = formData.type === 'Bimbingan Kelompok' || formData.type === 'Konseling Kelompok';

    return (
      <div className="max-w-2xl mx-auto glass-card p-3 rounded-xl shadow-lg animate-fade-in text-left mb-4 border border-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 gap-2">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Input <span className="text-blue-600 italic">Layanan BK</span>
          </h2>
          <div className="bg-blue-50/50 px-2 py-1 rounded-lg border border-blue-100 shadow-sm backdrop-blur-xl">
            <label className="text-[12px] font-black text-blue-600 uppercase block mb-0 tracking-widest">Tahun Ajaran</label>
            <input type="text" value={formData.academicYear} onChange={e => setFormData({...formData, academicYear: e.target.value})} className="bg-transparent border-none p-0 text-slate-800 font-black focus:ring-0 text-[14px] w-16" />
          </div>
        </div>

        <form id="counseling-form" onSubmit={handleSubmit} className="space-y-2.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[13px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1"><Calendar className="w-3 h-3 text-blue-500" /> Tanggal Kejadian</label>
              <input type="date" required value={formData.date} onChange={e => { setFormData({...formData, date: e.target.value}); if (errors.date) setErrors(prev => ({ ...prev, date: "" })); }} className={`w-full p-2 text-[15px] input-cyber rounded-lg outline-none ${errors.date ? 'border-rose-500' : ''}`} />
              {errors.date && <p className="text-[12px] text-rose-500 font-bold">{errors.date}</p>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[13px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1"><Clock className="w-3 h-3 text-blue-500" /> Mulai</label>
                <input type="time" required value={formData.startTime} onChange={e => { setFormData({...formData, startTime: e.target.value}); if (errors.startTime) setErrors(prev => ({ ...prev, startTime: "" })); }} className={`w-full p-2 text-[15px] input-cyber rounded-lg outline-none ${errors.startTime ? 'border-rose-500' : ''}`} />
                {errors.startTime && <p className="text-[12px] text-rose-500 font-bold">{errors.startTime}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-[13px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1"><Clock className="w-3 h-3 text-blue-500" /> Selesai</label>
                <input type="time" required value={formData.endTime} onChange={e => { setFormData({...formData, endTime: e.target.value}); if (errors.endTime) setErrors(prev => ({ ...prev, endTime: "" })); }} className={`w-full p-2 text-[15px] input-cyber rounded-lg outline-none ${errors.endTime ? 'border-rose-500' : ''}`} />
                {errors.endTime && <p className="text-[12px] text-rose-500 font-bold">{errors.endTime}</p>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[13px] font-black text-slate-500 uppercase tracking-[0.2em]">Komponen Layanan</label>
              <select value={formData.component} onChange={e => handleComponentChange(e.target.value as ServiceComponent)} className="w-full p-2 text-[15px] input-cyber rounded-lg outline-none appearance-none">
                <option value="Layanan Dasar">Layanan Dasar</option>
                <option value="Layanan Responsif">Layanan Responsif</option>
                <option value="Peminatan dan Perencanaan Individu">Peminatan & Perencanaan Individu</option>
                <option value="Dukungan Sistem">Dukungan Sistem</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[13px] font-black text-slate-500 uppercase tracking-[0.2em]">Strategi Layanan</label>
              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as CounselingType, studentId: '', groupId: '', absentStudentIds: []})} className="w-full p-2 text-[15px] input-cyber rounded-lg outline-none appearance-none">
                {currentStrategies.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[13px] font-black text-slate-500 uppercase tracking-[0.2em]">Bidang Bimbingan</label>
            <select value={formData.aspect} onChange={e => setFormData({...formData, aspect: e.target.value as CounselingAspect})} className="w-full p-2 text-[15px] input-cyber rounded-lg outline-none appearance-none">
              <option value="Belajar">Belajar</option>
              <option value="Pribadi">Pribadi</option>
              <option value="Sosial">Sosial</option>
              <option value="Karier">Karier</option>
              <option value="Bakat dan Minat">Bakat & Minat</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[13px] font-black text-slate-500 uppercase tracking-[0.2em]">TOPIK/ TEMA</label>
            <textarea required value={formData.topic || ''} onChange={e => { setFormData({...formData, topic: e.target.value}); if (errors.topic) setErrors(prev => ({ ...prev, topic: "" })); }} className={`w-full p-2.5 text-[15px] input-cyber rounded-lg outline-none h-24 ${errors.topic ? 'border-rose-500' : ''}`} placeholder="Tuliskan topik atau tema layanan..." />
            {errors.topic && <p className="text-[12px] text-rose-500 font-bold">{errors.topic}</p>}
          </div>

          {formData.type === 'Konferensi Kasus' && (
            <a 
              href="https://gemini.google.com/share/a98462987429" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-black text-[14px] uppercase tracking-widest py-3 rounded-lg shadow-md transition-all"
            >
              BUAT LAPORAN KONFERENSI KASUS
            </a>
          )}

          {formData.type === 'Home Visit' && (
            <a 
              href="https://gemini.google.com/share/5d3a4bbbf234" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[14px] uppercase tracking-widest py-3 rounded-lg shadow-md transition-all"
            >
              BUAT LAPORAN HOME VISIT
            </a>
          )}

          {formData.component !== 'Dukungan Sistem' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 shadow-inner">
              {isCurrentKelompok ? (
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[13px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-1"><Layers className="w-3 h-3" /> Pilih Kelompok Bimbingan</label>
                  <select required value={formData.groupId} onChange={e => setFormData({...formData, groupId: e.target.value, absentStudentIds: []})} className="w-full p-2 text-[15px] input-cyber rounded-lg outline-none appearance-none">
                    <option value="">-- Pilih Kelompok --</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.className})</option>)}
                  </select>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-[13px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-1"><Filter className="w-3 h-3" /> 1. Filter Kelas</label>
                    <select value={inputClassFilter} onChange={e => { setInputClassFilter(e.target.value); setFormData({...formData, studentId: ''}); setSelectedClasses([]); }} className="w-full p-2 text-[15px] input-cyber rounded-lg outline-none appearance-none">
                      <option value="">Semua Kelas</option>
                      {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    {isCurrentKlasikal && inputClassFilter === '' ? (
                      <>
                        <label className="text-[13px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-1"><Users className="w-3 h-3" /> 2. Pilih Kelas (Bisa Lebih Dari Satu)</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 p-1.5 h-24 overflow-y-auto custom-scrollbar bg-white rounded-lg border border-slate-100 shadow-inner">
                          {availableClasses.map(c => (
                            <div key={c} onClick={() => toggleSelectedClass(c)} className={`p-1.5 rounded-md border cursor-pointer transition-all flex items-center gap-1 ${selectedClasses.includes(c) ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-blue-200'}`}>
                              <span className="text-[13px] font-bold uppercase tracking-tight truncate">Kelas {c}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : isCurrentKlasikal && inputClassFilter !== '' ? (
                      <>
                        <label className="text-[13px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-1"><Users className="w-3 h-3" /> 2. Peserta Didik</label>
                        <div className="w-full p-2 text-[15px] input-cyber rounded-lg bg-blue-50 text-blue-700 font-black flex items-center justify-center border border-blue-200 uppercase">
                          SELURUH SISWA KELAS {inputClassFilter}
                        </div>
                      </>
                    ) : (
                      <>
                        <label className="text-[13px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-1"><Users className="w-3 h-3" /> 2. Pilih Peserta Didik</label>
                        <select required={!isCurrentKlasikal} value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})} className="w-full p-2 text-[15px] input-cyber rounded-lg outline-none appearance-none">
                          <option value="">-- Pilih Nama Siswa --</option>
                          {inputClassFilter && <option value={`CLASS_${inputClassFilter}`} className="text-blue-600 font-black bg-blue-50">[!] SELURUH SISWA KELAS {inputClassFilter}</option>}
                          {filteredStudentsForInput.map(s => <option key={s.id} value={s.id}>{s.name} ({s.className})</option>)}
                        </select>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {(isCurrentKlasikal || isCurrentKelompok) && (
            <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-100 shadow-inner">
               
               {isCurrentKlasikal && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <a href="https://gemini.google.com/share/5c45a8ccd89f" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-blue-600 text-white border border-blue-700 hover:bg-blue-700 transition-all font-black text-[11px] uppercase tracking-widest shadow-md">
                      <ExternalLink className="w-3 h-3" /> RPLBK (Versi ARKA)
                    </a>
                    <a href="https://gemini.google.com/share/8a632c3a54a9" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-purple-600 text-white border border-purple-700 hover:bg-purple-700 transition-all font-black text-[11px] uppercase tracking-widest shadow-md">
                      <ExternalLink className="w-3 h-3" /> RPLBK (Deep Learning)
                    </a>
                    <a href="https://gemini.google.com/share/b9d67d63f2e0" target="_blank" rel="noreferrer" className="md:col-span-2 flex items-center justify-center gap-1.5 p-2 rounded-lg bg-emerald-600 text-white border border-emerald-700 hover:bg-emerald-700 transition-all font-black text-[11px] uppercase tracking-widest shadow-md">
                      <ExternalLink className="w-3 h-3" /> BUAT LAPORAN BIMBINGAN KLASIKAL
                    </a>
                  </div>
               )}

               {isSpecialField(formData.type || '') && (
                 <div className="space-y-1">
                    <label className="text-[13px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-1"><Target className="w-3 h-3" /> TUJUAN BIMBINGAN</label>
                    <textarea required value={formData.purpose || ''} onChange={e => setFormData({...formData, purpose: e.target.value})} className="w-full p-2 text-[14px] h-20 leading-relaxed input-cyber rounded-lg outline-none resize-none" placeholder="Tujuan yang ingin dicapai..." />
                 </div>
               )}

               {formData.type === 'Bimbingan Kelompok' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
                   <a 
                     href="https://gemini.google.com/share/c01a35eb66f0" 
                     target="_blank" 
                     rel="noreferrer" 
                     className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-blue-600 text-white border border-blue-700 hover:bg-blue-700 transition-all font-black text-[11px] md:text-[12px] uppercase tracking-[0.1em] md:tracking-[0.2em] shadow-md group"
                   >
                     <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" /> 
                     RPL BIMBINGAN KELOMPOK
                   </a>
                   <a 
                     href="https://gemini.google.com/share/92138deb3cd3" 
                     target="_blank" 
                     rel="noreferrer" 
                     className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-indigo-600 text-white border border-indigo-700 hover:bg-indigo-700 transition-all font-black text-[11px] md:text-[12px] uppercase tracking-[0.1em] md:tracking-[0.2em] shadow-md group"
                   >
                     <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" /> 
                     LAPORAN BIMBINGAN KELOMPOK
                   </a>
                 </div>
               )}
               <div className="space-y-1.5">
                  <label className="text-[13px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1"><UserMinus className="w-3 h-3 text-rose-500" /> Siswa Tidak Hadir</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5 p-1.5 h-28 overflow-y-auto custom-scrollbar bg-white rounded-lg border border-slate-100 shadow-inner">
                      {(isCurrentKlasikal ? filteredStudentsForInput : students.filter(s => groups.find(g => g.id === formData.groupId)?.studentIds.includes(s.id))).map(s => (
                        <div key={s.id} onClick={() => toggleAbsentStudent(s.id)} className={`p-1.5 rounded-md border cursor-pointer transition-all flex items-center gap-1 ${formData.absentStudentIds?.includes(s.id) ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-blue-200'}`}>
                          <span className="text-[12px] font-bold uppercase tracking-tight truncate">{s.name}</span>
                        </div>
                      ))}
                  </div>
               </div>
            </div>
          )}

          {isConsultation(formData.type || '') && (
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-[13px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1"><UserPlus className="w-3 h-3 text-emerald-500" /> Nama Pihak Terkait</label>
                <input required value={formData.consultantName || ''} onChange={e => setFormData({...formData, consultantName: e.target.value})} className="w-full p-2 text-[15px] input-cyber rounded-lg outline-none font-arial" placeholder="Nama Guru / Ortu / Instansi..." />
              </div>
              {formData.type === 'Referal' && (
                <a 
                  href="https://gemini.google.com/share/2fc507480fb6" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-emerald-600 text-white border border-emerald-700 hover:bg-emerald-700 transition-all font-black text-[12px] uppercase tracking-widest shadow-md w-full md:w-max px-6"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> BUAT SURAT REFERAL
                </a>
              )}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[13px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1"><BookOpen className="w-3 h-3 text-blue-500" /> Uraian Kegiatan</label>
            <textarea required value={formData.result} onChange={e => { setFormData({...formData, result: e.target.value}); if (errors.result) setErrors(prev => ({ ...prev, result: "" })); }} placeholder="Temuan selama bimbingan..." className={`w-full p-2.5 h-24 text-[15px] leading-relaxed input-cyber rounded-lg outline-none resize-none ${errors.result ? 'border-rose-500' : ''}`} />
            {errors.result && <p className="text-[12px] text-rose-500 font-bold">{errors.result}</p>}
          </div>

          {formData.type === 'Konseling Individu' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1 duration-300">
              <a 
                href="https://gemini.google.com/share/4a377ee53b55" 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-emerald-600 text-white border border-emerald-700 hover:bg-emerald-700 transition-all font-black text-[11px] md:text-[12px] uppercase tracking-[0.1em] md:tracking-[0.2em] shadow-md group"
              >
                <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" /> 
                RPL KONSELING INDIVIDU
              </a>
              <a 
                href="https://gemini.google.com/share/12ea11e20054" 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-indigo-600 text-white border border-indigo-700 hover:bg-indigo-700 transition-all font-black text-[11px] md:text-[12px] uppercase tracking-[0.1em] md:tracking-[0.2em] shadow-md group"
              >
                <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" /> 
                LAPORAN KONSELING INDIVIDU
              </a>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[13px] font-black text-slate-500 uppercase tracking-[0.2em]">Hasil / Kondisi Akhir</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as CounselingStatus})} className="w-full p-2 text-[15px] input-cyber rounded-lg outline-none appearance-none">
                <option value="baik">Stabil / Baik</option>
                <option value="perlu perhatian">Monitoring</option>
                <option value="butuh bantuan">Prioritas / Mendesak</option>
              </select>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center mb-0">
                <label className="text-[13px] font-black text-slate-500 uppercase tracking-[0.2em]">Tindak Lanjut</label>
                <button type="button" onClick={handleAISuggestFollowUp} className="flex items-center gap-1 text-blue-600 font-black uppercase tracking-widest text-[12px] hover:text-blue-500 transition-colors"><Sparkles className="w-3 h-3" /> Smart AI</button>
              </div>
              <input required value={formData.followUp} onChange={e => setFormData({...formData, followUp: e.target.value})} className="w-full p-2 text-[15px] input-cyber rounded-lg outline-none" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[13px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1"><Info className="w-3 h-3 text-slate-500" /> Catatan / Keterangan (Opsional)</label>
            <textarea value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full p-2 text-[15px] h-16 input-cyber rounded-lg outline-none resize-none" placeholder="Tambahkan keterangan atau catatan singkat..." />
          </div>

          <FormActions 
            onSaveLocal={() => handleSave(false)}
            onSaveOnline={() => handleSave(true)}
            onCancel={() => { setEditingId(null); setView(ViewMode.COUNSELING_DATA); setInputClassFilter(''); }}
            onClose={() => { setEditingId(null); setView(ViewMode.COUNSELING_DATA); setInputClassFilter(''); }}
          />
        </form>
      </div>
    );

  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 px-4">
        <h2 className="text-xl font-black tracking-tighter uppercase text-slate-900">Arsip <span className="text-blue-600 font-light italic lowercase">Administrasi BK</span></h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2 py-1.5 shadow-sm">
            <Filter className="w-3.5 h-3.5 text-blue-600 mr-1.5" />
            <select value={inputClassFilter} onChange={e => setInputClassFilter(e.target.value)} className="bg-transparent border-none text-[8px] font-black text-slate-800 uppercase tracking-widest outline-none appearance-none">
              <option value="">SEMUA KELAS</option>
              {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2 py-1.5 shadow-sm">
            <Filter className="w-3.5 h-3.5 text-blue-600 mr-1.5" />
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-transparent border-none text-[8px] font-black text-slate-800 uppercase tracking-widest outline-none appearance-none">
              <option value="Semua Strategi">Semua Strategi</option>
              <option value="Bimbingan Klasikal">Bimbingan Klasikal</option>
              <option value="Bimbingan Kelompok">Bimbingan Kelompok</option>
              <option value="Konseling Individu">Konseling Individu</option>
              <option value="Konseling Kelompok">Konseling Kelompok</option>
              <option value="Referal">Referal</option>
              <option value="Home Visit">Home Visit</option>
              <option value="Konferensi Kasus">Konferensi Kasus</option>
            </select>
          </div>
          <button onClick={() => { setEditingId(null); setView(ViewMode.COUNSELING_INPUT); }} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-black text-[8px] uppercase tracking-widest transition-all shadow-sm flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> TAMBAH JURNAL
          </button>
        </div>
      </div>

      <div className="glass-card rounded-xl border border-slate-200 overflow-hidden shadow-md mx-4">
        <div className="overflow-x-auto scroll-hide">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-blue-600 text-[8px] font-black uppercase tracking-widest border-b border-slate-100">
                <th className="p-3 w-28">Waktu & Tanggal</th>
                {isSpecialField(filterType) ? (
                  <th className="p-3">TOPIK/ TEMA</th>
                ) : (
                  <th className="p-3">Siswa / Peserta Didik</th>
                )}
                <th className="p-3">Layanan & Bidang</th>
                {isConsultation(filterType) && <th className="p-3">Pihak Terkait</th>}
                <th className="p-3">Evaluasi</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDisplayLogs.length === 0 ? (
                <tr><td colSpan={6} className="p-10 text-center text-slate-500 italic text-[10px]">Belum ada catatan.</td></tr>
              ) : filteredDisplayLogs.map(log => {
                const isKlasikalRow = log.type === 'Bimbingan Klasikal';
                const isKelompokRow = log.type === 'Bimbingan Kelompok' || log.type === 'Konseling Kelompok';

                return (
                  <tr key={log.id} className="hover:bg-blue-50/50 transition-all group">
                    <td className="p-3">
                      <div className="text-[10px] font-black text-slate-800">{new Date(log.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</div>
                      <div className="text-[8px] text-blue-600 font-bold mt-0.5 uppercase flex items-center gap-1"><Clock className="w-2 h-2" /> {log.startTime}</div>
                    </td>
                    <td className="p-3">
                      {isSpecialField(log.type) ? (
                        <div className="space-y-0.5">
                           <div className="text-xs font-black text-slate-900 uppercase tracking-tighter italic">{log.topic || 'Tanpa Topik'}</div>
                           {log.purpose && <div className="text-[8px] text-indigo-600 font-bold italic line-clamp-1">Tujuan: {log.purpose}</div>}
                           <div className="text-[7px] text-slate-500 font-black uppercase tracking-widest">Kelas {log.className}</div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-xs font-black text-slate-800 flex items-center gap-1 group-hover:text-blue-600 transition-colors">
                            <UserCheck className="w-3 h-3 opacity-30" /> {log.studentName}
                          </div>
                          <div className="text-[8px] text-blue-600/80 font-black uppercase tracking-widest mt-0">{log.className}</div>
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1">
                           <div className="p-0.5 bg-blue-50 rounded-md text-blue-600"><HeartHandshake className="w-2.5 h-2.5" /></div>
                           <span className="text-[8px] font-black text-blue-600 uppercase tracking-tighter">{log.type}</span>
                        </div>
                        <div className="flex items-center gap-1">
                           <div className="p-0.5 bg-indigo-50 rounded-md text-indigo-600"><Briefcase className="w-2.5 h-2.5" /></div>
                           <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{log.aspect}</span>
                        </div>
                      </div>
                    </td>
                    {isConsultation(filterType) && (
                      <td className="p-3">
                         <div className="flex items-center gap-1 text-emerald-600 font-black text-[9px] uppercase tracking-tight">
                           <UserPlus className="w-2.5 h-2.5" /> <span className="font-arial">{formatAcademicTitle(log.consultantName || '-')}</span>
                         </div>
                      </td>
                    )}
                    <td className="p-3">
                      <div className={`text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 ${log.status === 'baik' ? 'text-blue-600' : log.status === 'perlu perhatian' ? 'text-amber-600' : 'text-rose-600'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${log.status === 'baik' ? 'bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.3)]' : log.status === 'perlu perhatian' ? 'bg-amber-500' : 'bg-rose-500 animate-pulse'}`} />
                        {log.status}
                      </div>
                    </td>
                    <td className="p-3 text-right space-x-1">
                      <button onClick={() => setPreviewLog(log)} className="p-1.5 bg-slate-50 hover:bg-blue-50 rounded-lg text-blue-600 transition-all shadow-sm"><Eye className="w-3.5 h-3.5" /></button>
                      <button onClick={() => startEdit(log)} className="p-1.5 bg-slate-50 hover:bg-indigo-50 rounded-lg text-indigo-600 transition-all shadow-sm"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { if(confirm('Hapus?')) onDelete(log.id); }} className="p-1.5 bg-rose-50 hover:bg-rose-100 rounded-lg text-rose-600 transition-all shadow-sm"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {previewLog && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4" onClick={() => setPreviewLog(null)}>
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm" />
          <div className="relative glass-card w-full max-w-md rounded-2xl border border-white p-5 shadow-2xl bg-white" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600 rounded-lg text-white shadow-md"><HeartHandshake className="w-4 h-4" /></div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tighter uppercase leading-none">Detail Jurnal</h3>
                  <p className="text-[8px] text-blue-600 mt-0.5 font-black uppercase tracking-widest">{previewLog.studentName}</p>
                </div>
              </div>
              <button onClick={() => setPreviewLog(null)} className="p-1 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
            </div>
            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1.5 custom-scrollbar">
               <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100"><label className="text-[7px] font-black text-slate-500 uppercase tracking-widest block mb-0">Tanggal</label><p className="text-[10px] font-black text-slate-800">{previewLog.date}</p></div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100"><label className="text-[7px] font-black text-slate-500 uppercase tracking-widest block mb-0">Strategi</label><p className="text-[10px] font-black text-indigo-600">{previewLog.type}</p></div>
               </div>
               {previewLog.topic && <div className="p-2.5 bg-indigo-50 rounded-lg border border-indigo-100"><label className="text-[7px] font-black text-indigo-400 uppercase tracking-widest block mb-0">TOPIK/ TEMA</label><p className="text-[10px] font-black text-slate-800 italic uppercase">"{previewLog.topic}"</p></div>}
               {previewLog.purpose && <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-100"><label className="text-[7px] font-black text-blue-600 uppercase tracking-widest block mb-0">Tujuan Bimbingan</label><p className="text-[10px] font-medium text-slate-700 leading-relaxed italic">"{previewLog.purpose}"</p></div>}
               {previewLog.notes && <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100"><label className="text-[7px] font-black text-slate-500 uppercase tracking-widest block mb-0">Catatan</label><p className="text-[10px] text-slate-600 font-medium leading-relaxed italic">"{previewLog.notes}"</p></div>}
               <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><label className="text-[7px] font-black text-slate-500 uppercase tracking-widest block mb-1">Hasil / Temuan</label><p className="text-[10px] text-slate-700 italic font-medium leading-relaxed">"{previewLog.result}"</p></div>
               <div className="p-3 bg-blue-50 rounded-lg border border-blue-100"><label className="text-[7px] font-black text-blue-600 uppercase tracking-widest block mb-1">Tindak Lanjut</label><p className="text-xs text-slate-900 font-extrabold flex items-start gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0" /> {previewLog.followUp}</p></div>
            </div>
            <button onClick={() => setPreviewLog(null)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 rounded-lg transition-all text-[9px] uppercase tracking-widest shadow-md mt-3">TUTUP DETAIL</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CounselingManagement;
