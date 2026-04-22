import React, { useState, useMemo } from 'react';
import { ViewMode, Student, ReportAndMutation, TeacherData, SubjectGrades } from '../types';
import { ArrowLeft, ClipboardList, Search, Trash2, Edit2, Save, X, FileText, GraduationCap, MoveHorizontal, Share2, User, BookOpen } from 'lucide-react';
import FormActions from './FormActions';

interface ReportAndMutationManagementProps {
  view: ViewMode;
  setView: (view: ViewMode) => void;
  students: Student[];
  reportAndMutations: ReportAndMutation[];
  onAdd: (data: ReportAndMutation, sync?: boolean) => void;
  onUpdate: (data: ReportAndMutation, sync?: boolean) => void;
  onDelete: (id: string) => void;
  teacherData: TeacherData;
  studentMode?: boolean;
  onOpenSettings: (tab: 'profile' | 'report' | 'subjects' | 'cloud' | 'backup' | 'firebase' | 'appearance') => void;
}

const ReportAndMutationManagement: React.FC<ReportAndMutationManagementProps> = ({ 
  view,
  setView, 
  students, 
  reportAndMutations, 
  onAdd, 
  onUpdate, 
  onDelete,
  teacherData,
  studentMode = false,
  onOpenSettings
}) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [reportClass, setReportClass] = useState<string>('');
  const [reportSemester, setReportSemester] = useState<'semester1' | 'semester2'>('semester1');

  const [formData, setFormData] = useState<Omit<ReportAndMutation, 'id'>>({
    studentId: '',
    grade7Sem1: '', grade7Sem2: '',
    grade8Sem1: '', grade8Sem2: '',
    grade9Sem1: '', grade9Sem2: '',
    grade7: {}, grade8: {}, grade9: {},
    mutationDate: '',
    mutationDestination: '',
    mutationReason: '',
    notes: ''
  });

  const subjects = useMemo(() => {
    if (teacherData.subjects && teacherData.subjects.length > 0) {
      return teacherData.subjects;
    }
    return [
      { id: 'agama', label: 'Pendidikan Agama dan Budi Pekerti' },
      { id: 'pancasila', label: 'Pendidikan Pancasila' },
      { id: 'bahasaIndonesia', label: 'Bahasa Indonesia' },
      { id: 'matematika', label: 'Matematika' },
      { id: 'ipa', label: 'Ilmu Pengetahuan Alam (IPA)' },
      { id: 'ips', label: 'Ilmu Pengetahuan Sosial (IPS)' },
      { id: 'bahasaInggris', label: 'Bahasa Inggris' },
      { id: 'pjok', label: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)' },
      { id: 'informatika', label: 'Informatika' },
      { id: 'seniBudaya', label: 'Seni Budaya' },
      { id: 'mulok', label: 'Muatan Lokal' },
    ];
  }, [teacherData.subjects]);

  const uniqueClasses = useMemo(() => Array.from(new Set(students.map(s => s.className))).sort(), [students]);
  const studentsInClass = useMemo(() => students.filter(s => s.className === selectedClass), [students, selectedClass]);

  const handleSave = (syncOnline: boolean = true) => {
    if (!formData.studentId) {
      alert('Pilih siswa terlebih dahulu.');
      return;
    }

    if (isEditing) {
      onUpdate({ ...formData, id: isEditing } as ReportAndMutation, syncOnline);
      setIsEditing(null);
    } else {
      onAdd({ ...formData, id: Date.now().toString() } as ReportAndMutation, syncOnline);
    }
    
    if (studentMode) {
      alert('Data berhasil dikirim. Terima kasih!');
    }
    resetForm();
  };

  const handleShareLink = () => {
    const shareUrl = `${window.location.origin}/?view=report_mutation_student`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Link berhasil disalin! Silakan bagikan lewat WhatsApp.');
    });
  };

  const handleSubjectGradeChange = (subjectId: string, value: string) => {
    if (!reportClass.trim()) {
      alert('Silakan isi Kelas terlebih dahulu.');
      return;
    }
    setFormData(prev => {
      const customGrades = prev.customGrades || {};
      const currentClassData = customGrades[reportClass] || {};
      const currentSemesterData = currentClassData[reportSemester] || {};
      
      return {
        ...prev,
        customGrades: {
          ...customGrades,
          [reportClass]: {
            ...currentClassData,
            [reportSemester]: {
              ...currentSemesterData,
              [subjectId]: value
            }
          }
        }
      };
    });
  };

  const resetForm = () => {
    setFormData({
      studentId: '',
      grade7Sem1: '',
      grade7Sem2: '',
      grade8Sem1: '',
      grade8Sem2: '',
      grade9Sem1: '',
      grade9Sem2: '',
      grade7: {},
      grade8: {},
      grade9: {},
      customGrades: {},
      mutationDate: '',
      mutationDestination: '',
      mutationReason: '',
      notes: ''
    });
    setIsEditing(null);
    setSelectedClass('');
    setReportClass('');
  };

  const handleEdit = (item: ReportAndMutation) => {
    const student = students.find(s => s.id === item.studentId);
    if (student) {
      setSelectedClass(student.className);
    }
    
    // Migrate old grades to customGrades for editing
    const customGrades = { ...(item.customGrades || {}) };
    if (item.grade7 && Object.keys(item.grade7).length > 0 && !customGrades['VII']) customGrades['VII'] = item.grade7;
    if (item.grade8 && Object.keys(item.grade8).length > 0 && !customGrades['VIII']) customGrades['VIII'] = item.grade8;
    if (item.grade9 && Object.keys(item.grade9).length > 0 && !customGrades['IX']) customGrades['IX'] = item.grade9;

    setFormData({
      studentId: item.studentId,
      grade7Sem1: item.grade7Sem1 || '',
      grade7Sem2: item.grade7Sem2 || '',
      grade8Sem1: item.grade8Sem1 || '',
      grade8Sem2: item.grade8Sem2 || '',
      grade9Sem1: item.grade9Sem1 || '',
      grade9Sem2: item.grade9Sem2 || '',
      grade7: item.grade7 || {},
      grade8: item.grade8 || {},
      grade9: item.grade9 || {},
      customGrades: customGrades,
      mutationDate: item.mutationDate || '',
      mutationDestination: item.mutationDestination || '',
      mutationReason: item.mutationReason || '',
      notes: item.notes || ''
    });
    setIsEditing(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredData = useMemo(() => {
    return reportAndMutations.filter(rm => {
      const student = students.find(s => s.id === rm.studentId);
      return student?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
             student?.className.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [reportAndMutations, students, searchTerm]);

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 animate-fade-in text-left">
      {/* Header */}
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-5">
          {!studentMode && (
            <button onClick={() => setView(ViewMode.HOME)} className="p-3 bg-white rounded-2xl border border-slate-200 hover:bg-slate-100 transition-all shadow-lg group">
              <ArrowLeft className="w-6 h-6 text-slate-500 group-hover:-translate-x-1 transition-transform" />
            </button>
          )}
          <div>
            <p className="label-luxe text-violet-500 font-black text-[9px]">INPUT DATA</p>
            <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none">NILAI RAPORT & <span className="text-violet-500 font-light italic">MUTASI</span></h2>
          </div>
        </div>
        {!studentMode && (
          <div className="flex gap-2">
            <button 
              onClick={() => onOpenSettings('subjects')}
              className="flex items-center gap-2 px-6 py-3 bg-violet-600/20 text-violet-400 border border-violet-500/30 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-violet-600 hover:text-white transition-all shadow-lg"
            >
              <BookOpen className="w-4 h-4" /> UBAH & TAMBAH MAPEL
            </button>
            <button 
              onClick={handleShareLink}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-lg"
            >
              <Share2 className="w-4 h-4" /> Bagikan Link Siswa
            </button>
          </div>
        )}
      </div>

      {/* Form Section */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200 mx-4 backdrop-blur-2xl shadow-xl">
        
        {/* Top Section: Student Selection */}
        <div className="mb-6 p-4 bg-white/60 rounded-xl border border-slate-200">
          <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2 mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            <User className="w-4 h-4 text-blue-500" /> <span className="text-blue-500 italic">PILIH SISWA</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Kelas</label>
              <select 
                value={selectedClass} 
                onChange={e => {
                  setSelectedClass(e.target.value);
                  setFormData(prev => ({ ...prev, studentId: '' }));
                }}
                className="w-full input-cyber p-2 text-xs rounded-lg outline-none"
              >
                <option value="">-- Pilih Kelas --</option>
                {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Nama Siswa</label>
              <select 
                value={formData.studentId} 
                onChange={e => setFormData(prev => ({ ...prev, studentId: e.target.value }))}
                className="w-full input-cyber p-2 text-xs rounded-lg outline-none"
                disabled={!selectedClass}
              >
                <option value="">-- Pilih Siswa --</option>
                {studentsInClass.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Left Column: Report Card Grades */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              <GraduationCap className="w-4 h-4 text-violet-500" /> <span className="text-violet-500 italic">NILAI RAPORT</span>
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[8px] font-bold uppercase text-slate-500">Kelas</label>
                  <input 
                    type="text"
                    placeholder="Contoh: VII, 1, X"
                    value={reportClass} 
                    onChange={e => setReportClass(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2 text-xs rounded-lg outline-none focus:border-violet-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-bold uppercase text-slate-500">Pilih Semester</label>
                  <select 
                    value={reportSemester} 
                    onChange={e => setReportSemester(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 p-2 text-xs rounded-lg outline-none focus:border-violet-500/50"
                  >
                    <option value="semester1">Semester 1</option>
                    <option value="semester2">Semester 2</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-white/60 rounded-xl border border-slate-200 space-y-3">
                <p className="text-[9px] font-black text-violet-400 uppercase tracking-widest">Mata Pelajaran</p>
                <div className="grid grid-cols-1 gap-2">
                  {subjects.map(subject => (
                    <div key={subject.id} className="flex items-center justify-between gap-3">
                      <label className="text-[9px] font-bold uppercase text-slate-500 w-1/2 truncate">{subject.label}</label>
                      <input 
                        type="text" 
                        placeholder="Nilai..."
                        value={formData.customGrades?.[reportClass]?.[reportSemester]?.[subject.id] || ''} 
                        onChange={e => handleSubjectGradeChange(subject.id, e.target.value)}
                        className="w-1/2 bg-slate-50 border border-slate-200 p-1.5 text-xs rounded-md outline-none focus:border-violet-500/50"
                        disabled={!reportClass.trim()}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Mutation */}
          <div className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                <MoveHorizontal className="w-4 h-4 text-rose-500" /> <span className="text-rose-500 italic">MUTASI</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Tanggal Mutasi</label>
                  <input 
                    type="date" 
                    value={formData.mutationDate} 
                    onChange={e => setFormData(prev => ({ ...prev, mutationDate: e.target.value }))}
                    className="w-full input-cyber p-2 text-xs rounded-lg outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Tujuan Mutasi</label>
                  <input 
                    type="text" 
                    placeholder="Sekolah tujuan..."
                    value={formData.mutationDestination} 
                    onChange={e => setFormData(prev => ({ ...prev, mutationDestination: e.target.value }))}
                    className="w-full input-cyber p-2 text-xs rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Alasan Mutasi</label>
                <input 
                  type="text" 
                  placeholder="Alasan pindah..."
                  value={formData.mutationReason} 
                  onChange={e => setFormData(prev => ({ ...prev, mutationReason: e.target.value }))}
                  className="w-full input-cyber p-2 text-xs rounded-lg outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Keterangan</label>
                <textarea 
                  rows={2}
                  placeholder="Catatan tambahan..."
                  value={formData.notes} 
                  onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full input-cyber p-2 text-xs rounded-lg outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200">
          {studentMode ? (
            <div className="flex justify-center">
              <button 
                onClick={() => handleSave(true)}
                className="w-full max-w-xs py-3 bg-violet-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-violet-700 transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> Kirim Data Nilai
              </button>
            </div>
          ) : (
            <FormActions 
              onSaveLocal={() => handleSave(false)}
              onSaveOnline={() => handleSave(true)}
              onCancel={resetForm}
              onClose={() => setView(ViewMode.HOME)}
            />
          )}
        </div>
      </div>

      {/* List Section */}
      {!studentMode && (
        <div className="glass-card p-6 rounded-3xl border border-slate-200 mx-4 bg-white/60">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h3 className="text-sm font-black text-slate-800 uppercase">Riwayat Nilai & Mutasi</h3>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-violet-500" />
            <input 
              type="text" 
              placeholder="Cari siswa/kelas..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full input-cyber rounded-full py-1.5 pl-8 pr-3 text-xs outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="p-2 text-[9px] font-black uppercase text-slate-500 tracking-widest">Siswa</th>
                <th className="p-2 text-[9px] font-black uppercase text-slate-500 tracking-widest text-center">Data Nilai (Kelas)</th>
                <th className="p-2 text-[9px] font-black uppercase text-slate-500 tracking-widest">Mutasi</th>
                <th className="p-2 text-[9px] font-black uppercase text-slate-500 tracking-widest">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-500 text-xs italic">Belum ada data.</td>
                </tr>
              ) : (
                filteredData.map(item => {
                  const student = students.find(s => s.id === item.studentId);
                  return (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-2">
                        <p className="text-xs font-bold text-slate-800">{student?.name}</p>
                        <p className="text-[8px] font-black text-violet-500 uppercase">{student?.className}</p>
                      </td>
                      <td className="p-2 text-center">
                        <div className="flex flex-wrap justify-center gap-1">
                          {Object.keys(item.customGrades || {}).length > 0 ? (
                            Object.keys(item.customGrades || {}).map(c => (
                              <span key={c} className="px-1.5 py-0.5 bg-violet-50 text-violet-600 text-[8px] font-bold rounded border border-violet-100">
                                Kelas {c}
                              </span>
                            ))
                          ) : (
                            <span className="text-[9px] text-slate-400 italic">Belum ada nilai</span>
                          )}
                        </div>
                      </td>
                      <td className="p-2">
                        {item.mutationDate ? (
                          <div className="space-y-0.5">
                            <p className="text-[9px] font-bold text-rose-400">{item.mutationDate}</p>
                            <p className="text-[9px] text-slate-500 truncate max-w-[120px]">{item.mutationDestination}</p>
                          </div>
                        ) : (
                          <span className="text-[9px] text-slate-600 italic">Aktif</span>
                        )}
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(item)} className="p-1.5 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20 transition-colors">
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button onClick={() => onDelete(item.id)} className="p-1.5 bg-rose-500/10 text-rose-400 rounded hover:bg-rose-500/20 transition-colors">
                            <Trash2 className="w-3 h-3" />
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
      )}
    </div>
  );
};

export default ReportAndMutationManagement;
