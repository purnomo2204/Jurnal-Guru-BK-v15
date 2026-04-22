
import React, { useState, useMemo, useRef } from 'react';
import { ViewMode, Violation, TeacherData, Student } from '../types';
import { 
  Plus, Search, Calendar, Clock, Edit, Trash2, 
  X, Save, ClipboardList, Info, ArrowLeft, 
  Eye, CheckCircle2, AlertCircle, FileText, User, Users, ShieldCheck, FileDown, ImageIcon, Upload, Filter
} from 'lucide-react';
import FormActions from './FormActions';
import * as XLSX from 'xlsx';
import ReportPreviewModal from './ReportPreviewModal';

import { toast } from 'sonner';
import { validateRequired, validateDateNotFuture } from '../src/lib/validation';

interface ViolationManagementProps {
  view: ViewMode;
  setView: (v: ViewMode) => void;
  violations: Violation[];
  students: Student[];
  onAdd: (violation: Violation, sync?: boolean) => void;
  onUpdate: (violation: Violation, sync?: boolean) => void;
  onDelete: (id: string) => void;
  teacherData: TeacherData;
}

const ViolationManagement: React.FC<ViolationManagementProps> = ({ 
  view, setView, violations, students, onAdd, onUpdate, onDelete, teacherData 
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('SEMUA');
  const [studentFilter, setStudentFilter] = useState('SEMUA');
  const [statusFilter, setStatusFilter] = useState('SEMUA');
  const [previewViolation, setPreviewViolation] = useState<Violation | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [inputClassFilter, setInputClassFilter] = useState('');
  const [isInputMode, setIsInputMode] = useState(false);

  const [formData, setFormData] = useState<Partial<Violation>>({
    date: new Date().toISOString().split('T')[0],
    studentId: '',
    violation: '',
    level: 'ringan',
    actionTaken: '',
    description: ''
  });

  const filteredViolations = useMemo(() => {
    return violations.filter(v => {
      const student = students.find(s => s.id === v.studentId);
      const studentName = student?.name || '';
      const studentClass = student?.className || '';
      
      const matchesSearch = 
        studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.violation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesClass = classFilter === 'SEMUA' || studentClass === classFilter;
      const matchesStudent = studentFilter === 'SEMUA' || v.studentId === studentFilter;
      const matchesStatus = statusFilter === 'SEMUA' || v.status === statusFilter;
      
      return matchesSearch && matchesClass && matchesStudent && matchesStatus;
    });
  }, [violations, students, searchQuery, classFilter, studentFilter, statusFilter]);

  const studentsInFilterClass = useMemo(() => {
    if (classFilter === 'SEMUA') return students;
    return students.filter(s => s.className === classFilter);
  }, [students, classFilter]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!validateRequired(formData.date)) newErrors.date = "Tanggal wajib diisi";
    if (formData.date && !validateDateNotFuture(formData.date)) newErrors.date = "Tanggal tidak boleh di masa depan";
    
    if (!validateRequired(formData.studentId)) newErrors.studentId = "Peserta didik wajib dipilih";
    
    if (!validateRequired(formData.violation)) newErrors.violation = "Nama kasus wajib diisi";
    if (formData.violation && formData.violation.length < 3) newErrors.violation = "Nama kasus minimal 3 karakter";
    
    if (!validateRequired(formData.description)) newErrors.description = "Uraian kronologi wajib diisi";
    if (formData.description && formData.description.length < 10) newErrors.description = "Uraian minimal 10 karakter";
    
    if (!validateRequired(formData.actionTaken)) newErrors.actionTaken = "Tindakan wajib diisi";
    if (formData.actionTaken && formData.actionTaken.length < 5) newErrors.actionTaken = "Tindakan minimal 5 karakter";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (syncOnline: boolean = true) => {
    if (!validateForm()) {
      toast.error("Mohon perbaiki kesalahan pada form sebelum menyimpan.");
      return;
    }

    if (editingId) {
      onUpdate({ ...formData as Violation, id: editingId }, syncOnline);
    } else {
      onAdd({ ...formData as Violation, id: Date.now().toString() }, syncOnline);
    }
    resetForm();
    setIsInputMode(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setInputClassFilter('');
    setFormData({
      date: new Date().toISOString().split('T')[0],
      studentId: '',
      violation: '',
      level: 'ringan',
      actionTaken: '',
      description: '',
      status: 'Selesai'
    });
  };

  const startEdit = (violation: Violation) => {
    setEditingId(violation.id);
    setFormData(violation);
    const student = students.find(s => s.id === violation.studentId);
    if (student) setInputClassFilter(student.className);
    setIsInputMode(true);
  };

  const availableClasses = useMemo(() => {
    const cls = new Set(students.map(s => s.className));
    return Array.from(cls).sort();
  }, [students]);

  const filteredStudentsForInput = useMemo(() => {
    if (!inputClassFilter) return students;
    return students.filter(s => s.className === inputClassFilter);
  }, [students, inputClassFilter]);

  const selectedStudent = useMemo(() => {
    return students.find(s => s.id === formData.studentId);
  }, [students, formData.studentId]);

  if (isInputMode) {
    return (
      <div className="max-w-3xl mx-auto glass-card p-6 rounded-3xl border border-slate-200 shadow-2xl animate-fade-in text-left mb-10 backdrop-blur-2xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-rose-600/20 rounded-xl text-rose-500 border border-rose-500/30 shadow-lg">
               <AlertCircle className="w-5 h-5" />
             </div>
             <div>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  Input <span className="text-rose-600 font-light italic">Kasus</span>
                </h2>
                <p className="text-[8px] font-black text-rose-500/60 uppercase tracking-widest mt-1">Dokumentasi Pelanggaran & Kasus Siswa</p>
             </div>
          </div>
          <button onClick={() => { resetForm(); setIsInputMode(false); }} className="p-2 bg-slate-50/50 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 transition-all backdrop-blur-xl">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2"><Calendar className="w-2.5 h-2.5" /> Tanggal Kejadian</label>
              <input type="date" required value={formData.date} onChange={e => { setFormData({...formData, date: e.target.value}); if (errors.date) setErrors(prev => ({ ...prev, date: "" })); }} className={`w-full input-cyber rounded-lg p-2 text-[10px] outline-none ${errors.date ? 'border-rose-500' : ''}`} />
              {errors.date && <p className="text-[7px] text-rose-500 font-bold">{errors.date}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2"><ShieldCheck className="w-2.5 h-2.5" /> Tingkat Kasus</label>
              <select 
                required 
                value={formData.level} 
                onChange={e => setFormData({...formData, level: e.target.value as any})} 
                className="w-full input-cyber rounded-lg p-2 text-[10px] outline-none"
              >
                <option value="ringan">Ringan</option>
                <option value="sedang">Sedang</option>
                <option value="berat">Berat</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-200 space-y-2 shadow-inner">
            <div className="flex items-center gap-2 mb-0.5">
                <User className="w-2.5 h-2.5 text-rose-500" />
                <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">Identitas Siswa</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2"><Filter className="w-2.5 h-2.5" /> 1. Filter Kelas</label>
                <select 
                  value={inputClassFilter} 
                  onChange={e => { setInputClassFilter(e.target.value); setFormData({...formData, studentId: ''}); }} 
                  className="w-full input-cyber rounded-lg p-2 text-[10px] outline-none"
                >
                  <option value="">Semua Kelas</option>
                  {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2"><Users className="w-2.5 h-2.5" /> 2. Pilih Peserta Didik</label>
                <select 
                  required 
                  value={formData.studentId} 
                  onChange={e => { setFormData({...formData, studentId: e.target.value}); if (errors.studentId) setErrors(prev => ({ ...prev, studentId: "" })); }} 
                  className={`w-full input-cyber rounded-lg p-2 text-[10px] outline-none ${errors.studentId ? 'border-rose-500' : ''}`}
                >
                  <option value="">-- Pilih Nama Siswa --</option>
                  {filteredStudentsForInput.map(s => <option key={s.id} value={s.id}>{s.name} ({s.className})</option>)}
                </select>
                {errors.studentId && <p className="text-[7px] text-rose-500 font-bold">{errors.studentId}</p>}
              </div>

              {selectedStudent && (
                <div className="md:col-span-2 grid grid-cols-2 gap-2">
                   <div className="p-2 bg-slate-50/80 rounded-lg border border-slate-200 shadow-sm">
                      <p className="text-[6px] font-black text-rose-500 uppercase tracking-widest">NIS / NISN</p>
                      <p className="text-[9px] font-bold text-slate-600 mt-0.5">{selectedStudent.nis} / {selectedStudent.nisn}</p>
                   </div>
                   <div className="p-2 bg-slate-50/80 rounded-lg border border-slate-200 shadow-sm">
                      <p className="text-[6px] font-black text-rose-500 uppercase tracking-widest">Kelas</p>
                      <p className="text-[9px] font-bold text-slate-600 mt-0.5">{selectedStudent.className}</p>
                   </div>
                   <div className="p-2 bg-slate-50/80 rounded-lg border border-slate-200 shadow-sm col-span-2">
                      <p className="text-[6px] font-black text-rose-500 uppercase tracking-widest">Wali Kelas</p>
                      <p className="text-[9px] font-bold text-slate-600 mt-0.5">{selectedStudent.homeroomTeacher || '-'}</p>
                   </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2"><AlertCircle className="w-3 h-3 text-rose-500" /> Nama Kasus / Pelanggaran</label>
            <input required value={formData.violation} onChange={e => { setFormData({...formData, violation: e.target.value}); if (errors.violation) setErrors(prev => ({ ...prev, violation: "" })); }} className={`w-full input-cyber rounded-xl p-3 text-[10px] outline-none ${errors.violation ? 'border-rose-500' : ''}`} placeholder="Contoh: Terlambat, Tidak memakai atribut, dll..." />
            {errors.violation && <p className="text-[7px] text-rose-500 font-bold">{errors.violation}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2"><Info className="w-3 h-3" /> Uraian Kronologi Kasus</label>
            <textarea required value={formData.description} onChange={e => { setFormData({...formData, description: e.target.value}); if (errors.description) setErrors(prev => ({ ...prev, description: "" })); }} className={`w-full input-cyber rounded-xl p-3 h-20 text-[10px] leading-relaxed outline-none ${errors.description ? 'border-rose-500' : ''}`} placeholder="Ceritakan detail kejadian kasus..." />
            {errors.description && <p className="text-[7px] text-rose-500 font-bold">{errors.description}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Tindakan yang Diambil</label>
            <textarea required value={formData.actionTaken} onChange={e => { setFormData({...formData, actionTaken: e.target.value}); if (errors.actionTaken) setErrors(prev => ({ ...prev, actionTaken: "" })); }} className={`w-full input-cyber rounded-xl p-3 h-16 text-[10px] leading-relaxed outline-none ${errors.actionTaken ? 'border-rose-500' : ''}`} placeholder="Tindakan atau sanksi yang diberikan..." />
            {errors.actionTaken && <p className="text-[7px] text-rose-500 font-bold">{errors.actionTaken}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-blue-500" /> Status Kasus</label>
            <select 
              required 
              value={formData.status} 
              onChange={e => setFormData({...formData, status: e.target.value as any})} 
              className="w-full input-cyber rounded-xl p-3 text-[10px] outline-none appearance-none"
            >
              <option value="Selesai">Selesai</option>
              <option value="Pending">Pending</option>
              <option value="Proses">Proses</option>
            </select>
          </div>

          <FormActions 
            onSaveLocal={() => handleSave(false)}
            onSaveOnline={() => handleSave(true)}
            onCancel={() => { resetForm(); setIsInputMode(false); }}
            onClose={() => { resetForm(); setIsInputMode(false); }}
          />
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 animate-fade-in text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-4">
        <div className="flex items-center gap-3">
           <button onClick={() => setView(ViewMode.HOME)} className="p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-100 transition-all group shadow-md">
             <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-1 transition-transform" />
           </button>
           <div>
              <p className="label-luxe text-rose-600 font-black text-[7px]">DISCIPLINE LOG</p>
              <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase leading-none">Catatan <span className="text-rose-600 font-light italic lowercase">Kasus</span></h2>
           </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full md:w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-rose-600" />
            <input 
              type="text" 
              placeholder="Cari..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full input-cyber rounded-xl py-2 pl-10 pr-3 text-[10px] text-slate-600 outline-none focus:ring-2 focus:ring-rose-600/10" 
            />
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={classFilter}
              onChange={e => { setClassFilter(e.target.value); setStudentFilter('SEMUA'); }}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[9px] font-bold text-slate-700 focus:ring-2 focus:ring-rose-600/10 outline-none transition-all shadow-sm"
            >
              <option value="SEMUA">KELAS</option>
              {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select 
              value={studentFilter}
              onChange={e => setStudentFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[9px] font-bold text-slate-700 focus:ring-2 focus:ring-rose-600/10 outline-none transition-all shadow-sm max-w-[120px]"
            >
              <option value="SEMUA">NAMA SISWA</option>
              {studentsInFilterClass.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[9px] font-bold text-slate-700 focus:ring-2 focus:ring-rose-600/10 outline-none transition-all shadow-sm"
            >
              <option value="SEMUA">STATUS</option>
              <option value="Selesai">Selesai</option>
              <option value="Pending">Pending</option>
              <option value="Proses">Proses</option>
            </select>
          </div>
          <button onClick={() => setShowReportModal(true)} className="bg-blue-600/20 text-blue-400 border border-blue-500/30 px-2 py-1 rounded-lg font-black text-[8px] uppercase tracking-widest transition-all shadow-lg hover:bg-blue-600 hover:text-white flex items-center gap-1">
            <FileText className="w-2.5 h-2.5" /> LAPORAN CATATAN KASUS
          </button>
          <button onClick={() => { resetForm(); setIsInputMode(true); }} className="bg-rose-600/20 text-rose-400 border border-rose-500/30 px-2 py-1 rounded-lg font-black text-[8px] uppercase tracking-widest transition-all shadow-lg hover:bg-rose-600 hover:text-white flex items-center gap-1">
            <Plus className="w-2.5 h-2.5" /> TAMBAH KASUS
          </button>
        </div>
      </div>

      {showReportModal && (
        <ReportPreviewModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          data={violations}
          type="kasus"
          students={students}
          teacherData={teacherData}
        />
      )}

      <div className="glass-card p-4 rounded-3xl border border-slate-200 mx-4 bg-white/60">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="p-2 text-[8px] font-black uppercase text-slate-500 tracking-widest">Siswa</th>
                <th className="p-2 text-[8px] font-black uppercase text-slate-500 tracking-widest">Kelas</th>
                <th className="p-2 text-[8px] font-black uppercase text-slate-500 tracking-widest">Tanggal</th>
                <th className="p-2 text-[8px] font-black uppercase text-slate-500 tracking-widest">Kasus</th>
                <th className="p-2 text-[8px] font-black uppercase text-slate-500 tracking-widest">Uraian Kronologi Kasus</th>
                <th className="p-2 text-[8px] font-black uppercase text-slate-500 tracking-widest">Tindakan</th>
                <th className="p-2 text-[8px] font-black uppercase text-slate-500 tracking-widest">Status</th>
                <th className="p-2 text-[8px] font-black uppercase text-slate-500 tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredViolations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-[10px] text-slate-500 italic">Belum ada catatan kasus.</td>
                </tr>
              ) : (
                filteredViolations.map(v => {
                  const student = students.find(s => s.id === v.studentId);
                  return (
                    <tr key={v.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-2">
                        <p className="text-xs font-bold text-slate-800">{student?.name || 'Siswa Dihapus'}</p>
                      </td>
                      <td className="p-2 text-[10px] text-slate-500">{student?.className || '-'}</td>
                      <td className="p-2 text-[10px] text-slate-500">
                        {new Date(v.date).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'})}
                      </td>
                      <td className="p-2 text-[10px] font-bold text-slate-700">{v.violation}</td>
                      <td className="p-2 text-[9px] text-slate-500 max-w-[150px] truncate">{v.description}</td>
                      <td className="p-2 text-[9px] text-slate-500 max-w-[120px] truncate">{v.actionTaken}</td>
                      <td className="p-2">
                        <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest border ${
                          v.status === 'Selesai' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                          v.status === 'Pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                          'bg-blue-500/10 text-blue-500 border-blue-500/20'
                        }`}>
                          {v.status || 'Selesai'}
                        </span>
                      </td>
                      <td className="p-2 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setPreviewViolation(v)} className="p-1.5 bg-white border border-slate-200 hover:bg-rose-500/10 rounded-lg text-rose-500 transition-all">
                            <Eye className="w-2.5 h-2.5" />
                          </button>
                          <button onClick={() => startEdit(v)} className="p-1.5 bg-white border border-slate-200 hover:bg-indigo-500/10 rounded-lg text-indigo-400 transition-all">
                            <Edit className="w-2.5 h-2.5" />
                          </button>
                          <button onClick={() => { if(confirm('Hapus catatan kasus ini?')) onDelete(v.id); }} className="p-1.5 bg-rose-900/20 border border-rose-500/20 hover:bg-rose-900/40 rounded-lg text-rose-500 transition-all">
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {previewViolation && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-md" onClick={() => setPreviewViolation(null)} />
           <div className="relative glass-card w-full max-w-2xl rounded-[4rem] border border-rose-200 p-12 shadow-3xl bg-white animate-in zoom-in-95 duration-300 print:bg-white print:text-black print:border-none print:shadow-none print:max-w-none print:w-full print:p-0">
              
              <div className="flex justify-between items-start mb-10">
                 <div className="flex items-center gap-5">
                    <div className="p-4 bg-rose-600 rounded-3xl text-white shadow-2xl"><AlertCircle className="w-8 h-8" /></div>
                    <div>
                       <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">Detail Kasus</h3>
                       <p className="text-[10px] text-rose-600 font-black mt-1 uppercase tracking-widest">{new Date(previewViolation.date).toLocaleDateString('id-ID', {day:'2-digit', month:'long', year:'numeric'})}</p>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => setPreviewViolation(null)} className="p-3 hover:bg-slate-100 rounded-2xl text-primary transition-all"><X className="w-5 h-5" /></button>
                 </div>
              </div>

              <div className="space-y-8 h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                       <label className="label-luxe text-rose-600">Nama Siswa</label>
                       <div className="text-lg font-black text-slate-900 mt-1">{students.find(s => s.id === previewViolation.studentId)?.name || 'Siswa Dihapus'}</div>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                       <label className="label-luxe text-rose-600">Kelas / Tingkat</label>
                       <div className="text-sm font-bold text-slate-700 mt-1">{students.find(s => s.id === previewViolation.studentId)?.className || '-'} / {previewViolation.level.toUpperCase()}</div>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="label-luxe text-rose-600">Nama Kasus / Pelanggaran</label>
                    <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100 text-sm text-rose-900 font-black uppercase tracking-tight">{previewViolation.violation}</div>
                 </div>

                 <div className="space-y-3">
                    <label className="label-luxe text-slate-500">Uraian Kronologi Kasus</label>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-sm text-slate-700 italic font-medium leading-relaxed">"{previewViolation.description}"</div>
                 </div>
                 <div className="space-y-3">
                    <label className="label-luxe text-emerald-600">Tindakan yang Diambil</label>
                    <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 text-sm text-emerald-900 font-bold leading-relaxed">{previewViolation.actionTaken}</div>
                 </div>
                 <div className="space-y-3">
                    <label className="label-luxe text-blue-600">Status Kasus</label>
                    <div className="p-6 bg-blue-500/10 rounded-3xl border border-blue-100 text-sm text-blue-900 font-bold leading-relaxed">{previewViolation.status || 'Selesai'}</div>
                 </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button onClick={() => setPreviewViolation(null)} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black py-6 rounded-3xl transition-all text-xs uppercase tracking-widest shadow-2xl">TUTUP DETAIL</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ViolationManagement;
