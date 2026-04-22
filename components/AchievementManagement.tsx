import React, { useState, useMemo, useRef } from 'react';
import { ViewMode, Achievement, Scholarship, TeacherData, Student, EconomicallyDisadvantagedStudent } from '../types';
import { 
  Plus, Search, Calendar, Clock, Edit, Trash2, 
  X, Save, ClipboardList, Info, ArrowLeft, 
  Eye, CheckCircle2, AlertCircle, FileText, User, Users, ShieldCheck, FileDown, ImageIcon, Upload, Filter, Sparkles, TrendingUp, GraduationCap, DollarSign, ChevronDown, Check
} from 'lucide-react';
import FormActions from './FormActions';
import { useFormDraft } from '../hooks/useFormDraft';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, AlignmentType, WidthType, PageOrientation } from 'docx';
import { saveAs } from 'file-saver';
import { formatAcademicTitle } from '../src/lib/nameFormatter';

import { toast } from 'sonner';
import { validateRequired } from '../src/lib/validation';

interface AchievementManagementProps {
  view: ViewMode;
  setView: (v: ViewMode) => void;
  achievements: Achievement[];
  scholarships?: Scholarship[];
  economicallyDisadvantagedStudents?: EconomicallyDisadvantagedStudent[];
  students: Student[];
  onAdd: (achievement: Achievement, sync?: boolean) => void;
  onUpdate: (achievement: Achievement, sync?: boolean) => void;
  onDelete: (id: string) => void;
  onAddScholarship?: (scholarship: Scholarship, sync?: boolean) => void;
  onUpdateScholarship?: (scholarship: Scholarship, sync?: boolean) => void;
  onDeleteScholarship?: (id: string) => void;
  onAddEconomicallyDisadvantagedStudent?: (student: EconomicallyDisadvantagedStudent, sync?: boolean) => void;
  onUpdateEconomicallyDisadvantagedStudent?: (student: EconomicallyDisadvantagedStudent, sync?: boolean) => void;
  onDeleteEconomicallyDisadvantagedStudent?: (id: string) => void;
  teacherData: TeacherData;
  availableAcademicYears: string[];
}

const AchievementManagement: React.FC<AchievementManagementProps> = ({ 
  view, setView, achievements, scholarships = [], economicallyDisadvantagedStudents = [], students, onAdd, onUpdate, onDelete, onAddScholarship, onUpdateScholarship, onDeleteScholarship, onAddEconomicallyDisadvantagedStudent, onUpdateEconomicallyDisadvantagedStudent, onDeleteEconomicallyDisadvantagedStudent, teacherData, availableAcademicYears 
}) => {
  const [activeTab, setActiveTab] = useState<'prestasi' | 'beasiswa' | 'siswa-tidak-mampu'>('prestasi');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [previewAchievement, setPreviewAchievement] = useState<Achievement | null>(null);
  const [previewScholarship, setPreviewScholarship] = useState<Scholarship | null>(null);
  const [previewEconomicallyDisadvantagedStudent, setPreviewEconomicallyDisadvantagedStudent] = useState<EconomicallyDisadvantagedStudent | null>(null);
  const [inputClassFilter, setInputClassFilter] = useState('');
  const [isInputMode, setIsInputMode] = useState(false);

  const [formData, setFormData, clearFormData] = useFormDraft<Partial<Achievement>>("draft_achievement", {
    date: new Date().getFullYear().toString(),
    studentId: '',
    achievement: '',
    achievementType: 'Akademik',
    level: 'sekolah',
    description: '',
    academicYear: teacherData.academicYear || ''
  });

  const [scholarshipFormData, setScholarshipFormData, clearScholarshipFormData] = useFormDraft<Partial<Scholarship>>("draft_scholarship", {
    date: new Date().getFullYear().toString(),
    studentId: '',
    scholarshipName: '',
    level: 'sekolah',
    description: '',
    academicYear: teacherData.academicYear || ''
  });

  const [economicallyDisadvantagedFormData, setEconomicallyDisadvantagedFormData, clearEconomicallyDisadvantagedFormData] = useFormDraft<Partial<EconomicallyDisadvantagedStudent>>("draft_economically_disadvantaged", {
    date: new Date().getFullYear().toString(),
    studentId: '',
    manualStudentName: '',
    manualClassName: '',
    manualNis: '',
    manualNisn: '',
    manualBirthDate: '',
    manualPhone: '',
    specialNotes: '',
    fatherJob: '',
    motherJob: '',
    address: '',
    assistanceStatus: 'TIDAK DAPAT',
    assistanceSource: '',
    academicYear: teacherData.academicYear || ''
  });

  const availableClasses = useMemo(() => {
    const cls = new Set(students.map(s => s.className));
    economicallyDisadvantagedStudents.forEach(s => {
      if (s.manualClassName) {
        cls.add(s.manualClassName);
      }
    });
    return Array.from(cls).sort();
  }, [students, economicallyDisadvantagedStudents]);

  const filteredAchievements = useMemo(() => {
    return achievements.filter(a => {
      const student = students.find(s => s.id === a.studentId);
      const studentName = student?.name || '';
      const studentClass = student?.className || '';
      
      const matchesSearch = 
        studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.achievement.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesClass = selectedClasses.length === 0 || selectedClasses.includes(studentClass);
      
      return matchesSearch && matchesClass;
    });
  }, [achievements, students, searchQuery, selectedClasses]);

  const filteredScholarships = useMemo(() => {
    return scholarships.filter(s => {
      const student = students.find(st => st.id === s.studentId);
      const studentName = student?.name || '';
      const studentClass = student?.className || '';
      
      const matchesSearch = 
        studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.scholarshipName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesClass = selectedClasses.length === 0 || selectedClasses.includes(studentClass);
      
      return matchesSearch && matchesClass;
    });
  }, [scholarships, students, searchQuery, selectedClasses]);

  const filteredEconomicallyDisadvantagedStudents = useMemo(() => {
    return economicallyDisadvantagedStudents.filter(s => {
      const student = students.find(st => st.id === s.studentId);
      const studentName = student?.name || s.manualStudentName || '';
      const className = student?.className || s.manualClassName || '';
      
      const matchesSearch = 
        studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        className.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.specialNotes.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesClass = selectedClasses.length === 0 || selectedClasses.includes(className);
      
      return matchesSearch && matchesClass;
    });
  }, [economicallyDisadvantagedStudents, students, searchQuery, selectedClasses]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (activeTab === 'prestasi') {
      if (!validateRequired(formData.studentId)) newErrors.studentId = "Siswa wajib dipilih";
      if (!validateRequired(formData.achievement)) newErrors.achievement = "Nama prestasi wajib diisi";
      if (formData.achievement && formData.achievement.length < 3) newErrors.achievement = "Nama prestasi minimal 3 karakter";
      if (!validateRequired(formData.description)) newErrors.description = "Keterangan wajib diisi";
    } else if (activeTab === 'beasiswa') {
      if (!validateRequired(scholarshipFormData.studentId)) newErrors.studentId = "Siswa wajib dipilih";
      if (!validateRequired(scholarshipFormData.scholarshipName)) newErrors.scholarshipName = "Nama beasiswa wajib diisi";
      if (!validateRequired(scholarshipFormData.description)) newErrors.description = "Keterangan wajib diisi";
    } else {
      if (economicallyDisadvantagedFormData.studentId !== '__MANUAL__') {
        if (!validateRequired(economicallyDisadvantagedFormData.studentId)) newErrors.studentId = "Siswa wajib dipilih";
      } else {
        if (!validateRequired(economicallyDisadvantagedFormData.manualStudentName)) newErrors.manualStudentName = "Nama siswa wajib diisi";
        if (inputClassFilter === '__MANUAL__' && !validateRequired(economicallyDisadvantagedFormData.manualClassName)) newErrors.manualClassName = "Kelas wajib diisi";
        
        // NIS Validation (9 digits)
        if (economicallyDisadvantagedFormData.manualNis && !/^\d{9,10}$/.test(economicallyDisadvantagedFormData.manualNis)) {
          newErrors.manualNis = "NIS harus berupa 9-10 digit angka";
        }
        
        // NISN Validation (10 digits)
        if (economicallyDisadvantagedFormData.manualNisn && !/^\d{10}$/.test(economicallyDisadvantagedFormData.manualNisn)) {
          newErrors.manualNisn = "NISN harus berupa 10 digit angka";
        }
        
        // Phone Validation (10-13 digits)
        if (economicallyDisadvantagedFormData.manualPhone && !/^\d{10,14}$/.test(economicallyDisadvantagedFormData.manualPhone)) {
          newErrors.manualPhone = "Nomor telepon tidak valid (10-14 digit)";
        }
        
        // BirthDate Validation (YYYY-MM-DD)
        if (economicallyDisadvantagedFormData.manualBirthDate && !/^\d{4}-\d{2}-\d{2}$/.test(economicallyDisadvantagedFormData.manualBirthDate)) {
          newErrors.manualBirthDate = "Format tanggal lahir tidak valid (YYYY-MM-DD)";
        }
      }
      if (!validateRequired(economicallyDisadvantagedFormData.fatherJob)) newErrors.fatherJob = "Pekerjaan ayah wajib diisi";
      if (!validateRequired(economicallyDisadvantagedFormData.motherJob)) newErrors.motherJob = "Pekerjaan ibu wajib diisi";
      if (!validateRequired(economicallyDisadvantagedFormData.address)) newErrors.address = "Alamat wajib diisi";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (syncOnline: boolean = true) => {
    if (!validateForm()) {
      toast.error("Mohon perbaiki kesalahan pada form sebelum menyimpan.");
      return;
    }

    if (activeTab === 'prestasi') {
      if (editingId) {
        onUpdate({ ...formData as Achievement, id: editingId }, syncOnline);
      } else {
        onAdd({ ...formData as Achievement, id: Date.now().toString() }, syncOnline);
      }
    } else if (activeTab === 'beasiswa') {
      if (editingId && onUpdateScholarship) {
        onUpdateScholarship({ ...scholarshipFormData as Scholarship, id: editingId }, syncOnline);
      } else if (onAddScholarship) {
        onAddScholarship({ ...scholarshipFormData as Scholarship, id: Date.now().toString() }, syncOnline);
      }
    } else {
      const finalEconomicallyDisadvantagedData = {
        ...economicallyDisadvantagedFormData as EconomicallyDisadvantagedStudent,
        manualClassName: economicallyDisadvantagedFormData.studentId === '__MANUAL__' && inputClassFilter !== '__MANUAL__' 
          ? inputClassFilter 
          : economicallyDisadvantagedFormData.manualClassName
      };

      if (editingId && onUpdateEconomicallyDisadvantagedStudent) {
        onUpdateEconomicallyDisadvantagedStudent({ 
          ...finalEconomicallyDisadvantagedData, 
          id: editingId
        }, syncOnline);
      } else if (onAddEconomicallyDisadvantagedStudent) {
        onAddEconomicallyDisadvantagedStudent({ 
          ...finalEconomicallyDisadvantagedData, 
          id: Date.now().toString()
        }, syncOnline);
      }
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
    clearFormData();
    clearScholarshipFormData();
    clearEconomicallyDisadvantagedFormData();
    setErrors({});
  };

  const startEdit = (achievement: Achievement) => {
    setEditingId(achievement.id);
    setFormData(achievement);
    const student = students.find(s => s.id === achievement.studentId);
    if (student) setInputClassFilter(student.className);
    setIsInputMode(true);
  };

  const startEditScholarship = (scholarship: Scholarship) => {
    setEditingId(scholarship.id);
    setScholarshipFormData(scholarship);
    const student = students.find(s => s.id === scholarship.studentId);
    if (student) setInputClassFilter(student.className);
    setIsInputMode(true);
  };

  const startEditEconomicallyDisadvantagedStudent = (student: EconomicallyDisadvantagedStudent) => {
    setEditingId(student.id);
    setEconomicallyDisadvantagedFormData(student);
    if (student.studentId === '__MANUAL__') {
      setInputClassFilter(student.manualClassName ? '__MANUAL__' : '');
    } else {
      const s = students.find(st => st.id === student.studentId);
      if (s) setInputClassFilter(s.className);
    }
    setIsInputMode(true);
  };

  const filteredStudentsForInput = useMemo(() => {
    let filtered = students;
    if (inputClassFilter && inputClassFilter !== '__MANUAL__') {
      filtered = students.filter(s => s.className === inputClassFilter);
    } else if (inputClassFilter === '__MANUAL__') {
      filtered = [];
    }

    if (activeTab === 'siswa-tidak-mampu') {
      const manualStudents = new Map<string, any>();
      economicallyDisadvantagedStudents.forEach(s => {
        if (s.manualStudentName) {
          const clsName = s.manualClassName || (students.find(st => st.id === s.studentId)?.className);
          if (!inputClassFilter || inputClassFilter === '__MANUAL__' || clsName === inputClassFilter) {
            const id = `__MANUAL_STUDENT__${s.manualStudentName}`;
            if (!manualStudents.has(id)) {
              manualStudents.set(id, {
                id,
                name: s.manualStudentName,
                className: clsName,
                isManual: true
              });
            }
          }
        }
      });
      return [...filtered, ...Array.from(manualStudents.values())];
    }

    return filtered;
  }, [students, inputClassFilter, economicallyDisadvantagedStudents, activeTab]);

  const selectedStudent = useMemo(() => {
    return students.find(s => s.id === (activeTab === 'prestasi' ? formData.studentId : scholarshipFormData.studentId));
  }, [students, formData.studentId, scholarshipFormData.studentId, activeTab]);

  const exportToDocx = async (type: 'prestasi' | 'beasiswa' | 'siswa-tidak-mampu') => {
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE,
              width: 20160, // Legal Landscape width
              height: 12240, // Legal Landscape height
            },
            margin: {
              top: 1134,    // 2cm
              right: 1134,  // 2cm
              bottom: 1701, // 3cm
              left: 1134,   // 2cm
            },
          },
        },
        children: [
          new Paragraph({
            text: teacherData.school.toUpperCase(),
            heading: "Heading1",
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: teacherData.schoolAddress,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "________________________________________________________________________________" }),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: type === 'prestasi' ? "LAPORAN PRESTASI SISWA" : type === 'beasiswa' ? "LAPORAN BEASISWA SISWA" : "LAPORAN SISWA TIDAK MAMPU",
            heading: "Heading2",
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "" }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: type === 'siswa-tidak-mampu' ? [
                  new TableCell({ children: [new Paragraph({ text: "No", style: "Strong" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Nama Siswa", style: "Strong" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Kelas", style: "Strong" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Bantuan", style: "Strong" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Sumber", style: "Strong" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Alamat", style: "Strong" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Pekerjaan Ayah", style: "Strong" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Catatan", style: "Strong" })] }),
                ] : [
                  new TableCell({ children: [new Paragraph({ text: "No", style: "Strong" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Nama Siswa", style: "Strong" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Kelas", style: "Strong" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Tanggal", style: "Strong" })] }),
                  new TableCell({ children: [new Paragraph({ text: type === 'prestasi' ? "Prestasi" : "Beasiswa", style: "Strong" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Tingkat", style: "Strong" })] }),
                  new TableCell({ children: [new Paragraph({ text: "Keterangan", style: "Strong" })] }),
                ],
              }),
              ...(type === 'prestasi' ? filteredAchievements : type === 'beasiswa' ? filteredScholarships : [...filteredEconomicallyDisadvantagedStudents].sort((a, b) => {
                const studentA = students.find(st => st.id === a.studentId);
                const studentB = students.find(st => st.id === b.studentId);
                const classA = studentA?.className || a.manualClassName || '';
                const classB = studentB?.className || b.manualClassName || '';
                if (classA !== classB) return classA.localeCompare(classB, undefined, { numeric: true, sensitivity: 'base' });
                const nameA = studentA?.name || a.manualStudentName || '';
                const nameB = studentB?.name || b.manualStudentName || '';
                return nameA.localeCompare(nameB);
              })).map((item, index) => {
                const student = students.find(s => s.id === item.studentId);
                if (type === 'siswa-tidak-mampu') {
                    const s = item as EconomicallyDisadvantagedStudent;
                    return new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ text: (index + 1).toString() })] }),
                            new TableCell({ children: [new Paragraph({ text: student?.name || s.manualStudentName || '-' })] }),
                            new TableCell({ children: [new Paragraph({ text: student?.className || s.manualClassName || '-' })] }),
                            new TableCell({ children: [new Paragraph({ text: s.assistanceStatus || '-' })] }),
                            new TableCell({ children: [new Paragraph({ text: s.assistanceSource || '-' })] }),
                            new TableCell({ children: [new Paragraph({ text: s.address })] }),
                            new TableCell({ children: [new Paragraph({ text: s.fatherJob })] }),
                            new TableCell({ children: [new Paragraph({ text: s.specialNotes })] }),
                        ],
                    });
                }
                return new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: (index + 1).toString() })] }),
                    new TableCell({ children: [new Paragraph({ text: student?.name || '-' })] }),
                    new TableCell({ children: [new Paragraph({ text: student?.className || '-' })] }),
                    new TableCell({ children: [new Paragraph({ text: new Date(item.date).toLocaleDateString('id-ID') })] }),
                    new TableCell({ children: [new Paragraph({ text: type === 'prestasi' ? (item as Achievement).achievement : (item as Scholarship).scholarshipName })] }),
                    new TableCell({ children: [new Paragraph({ text: item.level })] }),
                    new TableCell({ children: [new Paragraph({ text: item.description })] }),
                  ],
                });
              }),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: `................, ${new Date().toLocaleDateString('id-ID')}`,
            alignment: AlignmentType.RIGHT,
          }),
          new Paragraph({
            text: "Mengetahui,",
            alignment: AlignmentType.RIGHT,
          }),
          new Paragraph({
            text: "Guru BK",
            alignment: AlignmentType.RIGHT,
          }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "" }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ 
                text: formatAcademicTitle(teacherData.name), 
                font: "Arial" 
              }),
            ],
          }),
          new Paragraph({
            text: `NIP. ${teacherData.nip || "..................................."}`,
            alignment: AlignmentType.RIGHT,
          }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Laporan_${type === 'prestasi' ? 'Prestasi' : type === 'beasiswa' ? 'Beasiswa' : 'SiswaTidakMampu'}_${new Date().toISOString().split('T')[0]}.docx`);
  };

  if (isInputMode) {
    return (
      <div className="max-w-3xl mx-auto glass-card p-4 rounded-2xl border border-slate-200 shadow-xl animate-fade-in text-left mb-6 backdrop-blur-2xl">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
             <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-500 border border-yellow-500/30 shadow-lg">
               {activeTab === 'prestasi' ? <Sparkles className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
             </div>
             <div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter leading-none" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  Input <span className="text-yellow-500 font-light italic">{activeTab === 'prestasi' ? 'Prestasi' : activeTab === 'beasiswa' ? 'Beasiswa' : 'Siswa Tidak Mampu'}</span>
                </h2>
                <p className="text-[7px] font-black text-yellow-500/60 uppercase tracking-widest mt-0.5">Dokumentasi {activeTab === 'prestasi' ? 'Pencapaian & Prestasi' : activeTab === 'beasiswa' ? 'Penerimaan Beasiswa' : 'Siswa Tidak Mampu'} Siswa</p>
             </div>
          </div>
          <button onClick={() => { resetForm(); setIsInputMode(false); }} className="p-1.5 bg-slate-50/50 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition-all backdrop-blur-xl">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-200 space-y-2 shadow-inner">
            <div className="flex items-center gap-1 mb-0.5">
                <User className="w-2.5 h-2.5 text-yellow-500" />
                <span className="text-[7px] font-black text-yellow-500 uppercase tracking-widest">Identitas Siswa</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-0.5">
                <label className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1"><Filter className="w-2.5 h-2.5" /> 1. Filter Kelas</label>
                <select 
                  value={inputClassFilter} 
                  onChange={e => { 
                    const val = e.target.value;
                    setInputClassFilter(val); 
                    if (activeTab === 'prestasi') setFormData({...formData, studentId: ''});
                    else if (activeTab === 'beasiswa') setScholarshipFormData({...scholarshipFormData, studentId: ''});
                    else {
                      // Reset student selection when class filter changes
                      setEconomicallyDisadvantagedFormData({
                        ...economicallyDisadvantagedFormData, 
                        studentId: val === '__MANUAL__' ? '__MANUAL__' : '',
                        manualClassName: val === '__MANUAL__' ? '' : economicallyDisadvantagedFormData.manualClassName,
                        manualStudentName: ''
                      });
                    }
                  }} 
                  className="w-full input-cyber rounded-lg p-2 text-[10px] outline-none"
                >
                  <option value="">{activeTab === 'siswa-tidak-mampu' ? '-- Pilih Kelas --' : 'Semua Kelas'}</option>
                  {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
                  {activeTab === 'siswa-tidak-mampu' && <option value="__MANUAL__">+ Tambah Kelas Baru...</option>}
                </select>
                {activeTab === 'siswa-tidak-mampu' && inputClassFilter === '__MANUAL__' && (
                  <div className="mt-1">
                    <input 
                      type="text"
                      value={economicallyDisadvantagedFormData.manualClassName}
                      onChange={e => setEconomicallyDisadvantagedFormData({...economicallyDisadvantagedFormData, manualClassName: e.target.value})}
                      placeholder="Masukkan Nama Kelas Baru..."
                      className={`w-full input-cyber rounded-lg p-2 text-[10px] outline-none ${errors.manualClassName ? 'border-rose-500' : ''}`}
                    />
                    {errors.manualClassName && <p className="text-[7px] text-rose-500 font-bold">{errors.manualClassName}</p>}
                  </div>
                )}
              </div>
              <div className="space-y-0.5">
                <label className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1"><Users className="w-2.5 h-2.5" /> 2. Pilih Peserta Didik</label>
                <select 
                  required 
                  value={activeTab === 'prestasi' ? formData.studentId : activeTab === 'beasiswa' ? scholarshipFormData.studentId : economicallyDisadvantagedFormData.studentId} 
                  onChange={e => {
                    const val = e.target.value;
                    if (activeTab === 'prestasi') setFormData({...formData, studentId: val});
                    else if (activeTab === 'beasiswa') setScholarshipFormData({...scholarshipFormData, studentId: val});
                    else {
                      setEconomicallyDisadvantagedFormData({
                        ...economicallyDisadvantagedFormData, 
                        studentId: val,
                        manualStudentName: val === '__MANUAL__' ? '' : (val.startsWith('__MANUAL_STUDENT__') ? val.replace('__MANUAL_STUDENT__', '') : economicallyDisadvantagedFormData.manualStudentName)
                      });
                    }
                    if (errors.studentId) setErrors(prev => ({ ...prev, studentId: "" }));
                  }} 
                  className={`w-full input-cyber rounded-lg p-2 text-[10px] outline-none ${errors.studentId ? 'border-rose-500' : ''}`}
                  disabled={activeTab === 'siswa-tidak-mampu' && !inputClassFilter}
                >
                  <option value="">{activeTab === 'siswa-tidak-mampu' && !inputClassFilter ? '-- Pilih Kelas Dulu --' : '-- Pilih Nama Siswa --'}</option>
                  {filteredStudentsForInput.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  {activeTab === 'siswa-tidak-mampu' && inputClassFilter && (
                    <option value="__MANUAL__">+ Tambah Siswa Baru...</option>
                  )}
                </select>
                {activeTab === 'siswa-tidak-mampu' && (economicallyDisadvantagedFormData.studentId === '__MANUAL__' || economicallyDisadvantagedFormData.studentId?.startsWith('__MANUAL_STUDENT__')) && (
                  <div className="mt-1 space-y-1">
                    <input 
                      type="text"
                      value={economicallyDisadvantagedFormData.manualStudentName}
                      onChange={e => setEconomicallyDisadvantagedFormData({...economicallyDisadvantagedFormData, manualStudentName: e.target.value})}
                      placeholder="Masukkan Nama Siswa Baru..."
                      className={`w-full input-cyber rounded-lg p-2 text-[10px] outline-none ${errors.manualStudentName ? 'border-rose-500' : ''}`}
                    />
                    {errors.manualStudentName && <p className="text-[7px] text-rose-500 font-bold">{errors.manualStudentName}</p>}
                    
                    <div className="grid grid-cols-2 gap-1">
                      <div>
                        <input 
                          type="text"
                          value={economicallyDisadvantagedFormData.manualNis}
                          onChange={e => setEconomicallyDisadvantagedFormData({...economicallyDisadvantagedFormData, manualNis: e.target.value})}
                          placeholder="NIS (9-10 digit)"
                          className={`w-full input-cyber rounded-lg p-2 text-[10px] outline-none ${errors.manualNis ? 'border-rose-500' : ''}`}
                        />
                        {errors.manualNis && <p className="text-[6px] text-rose-500 font-bold">{errors.manualNis}</p>}
                      </div>
                      <div>
                        <input 
                          type="text"
                          value={economicallyDisadvantagedFormData.manualNisn}
                          onChange={e => setEconomicallyDisadvantagedFormData({...economicallyDisadvantagedFormData, manualNisn: e.target.value})}
                          placeholder="NISN (10 digit)"
                          className={`w-full input-cyber rounded-lg p-2 text-[10px] outline-none ${errors.manualNisn ? 'border-rose-500' : ''}`}
                        />
                        {errors.manualNisn && <p className="text-[6px] text-rose-500 font-bold">{errors.manualNisn}</p>}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-1">
                      <div>
                        <input 
                          type="date"
                          value={economicallyDisadvantagedFormData.manualBirthDate}
                          onChange={e => setEconomicallyDisadvantagedFormData({...economicallyDisadvantagedFormData, manualBirthDate: e.target.value})}
                          className={`w-full input-cyber rounded-lg p-2 text-[10px] outline-none ${errors.manualBirthDate ? 'border-rose-500' : ''}`}
                        />
                        {errors.manualBirthDate && <p className="text-[6px] text-rose-500 font-bold">{errors.manualBirthDate}</p>}
                      </div>
                      <div>
                        <input 
                          type="text"
                          value={economicallyDisadvantagedFormData.manualPhone}
                          onChange={e => setEconomicallyDisadvantagedFormData({...economicallyDisadvantagedFormData, manualPhone: e.target.value})}
                          placeholder="No. Telepon"
                          className={`w-full input-cyber rounded-lg p-2 text-[10px] outline-none ${errors.manualPhone ? 'border-rose-500' : ''}`}
                        />
                        {errors.manualPhone && <p className="text-[6px] text-rose-500 font-bold">{errors.manualPhone}</p>}
                      </div>
                    </div>
                  </div>
                )}
                {errors.studentId && <p className="text-[7px] text-rose-500 font-bold">{errors.studentId}</p>}
              </div>
            </div>
            <div className="space-y-0.5">
              <label className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1"><Info className="w-2.5 h-2.5" /> 3. Tahun Ajaran</label>
              <select 
                required 
                value={activeTab === 'prestasi' ? formData.academicYear : activeTab === 'beasiswa' ? scholarshipFormData.academicYear : economicallyDisadvantagedFormData.academicYear} 
                onChange={e => {
                  const val = e.target.value;
                  if (activeTab === 'prestasi') setFormData({...formData, academicYear: val});
                  else if (activeTab === 'beasiswa') setScholarshipFormData({...scholarshipFormData, academicYear: val});
                  else setEconomicallyDisadvantagedFormData({...economicallyDisadvantagedFormData, academicYear: val});
                }} 
                className="w-full input-cyber rounded-lg p-2 text-[10px] outline-none"
              >
                <option value="">-- Pilih Tahun Ajaran --</option>
                {availableAcademicYears.map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {activeTab === 'siswa-tidak-mampu' && (
              <>
                <div className="space-y-0.5">
                  <label className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1"><ClipboardList className="w-2.5 h-2.5" /> Bantuan</label>
                  <select 
                    required 
                    value={economicallyDisadvantagedFormData.assistanceStatus} 
                    onChange={e => setEconomicallyDisadvantagedFormData({...economicallyDisadvantagedFormData, assistanceStatus: e.target.value as any})} 
                    className="w-full input-cyber rounded-lg p-2 text-[10px] outline-none"
                  >
                    <option value="DAPAT">DAPAT</option>
                    <option value="TIDAK DAPAT">TIDAK DAPAT</option>
                    <option value="DALAM PROSES">DALAM PROSES</option>
                  </select>
                </div>
                <div className="space-y-0.5">
                  <label className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1"><Info className="w-2.5 h-2.5" /> Sumber Bantuan</label>
                  <input 
                    required 
                    value={economicallyDisadvantagedFormData.assistanceSource} 
                    onChange={e => setEconomicallyDisadvantagedFormData({...economicallyDisadvantagedFormData, assistanceSource: e.target.value})} 
                    className="w-full input-cyber rounded-lg p-2 text-[10px] outline-none" 
                    placeholder="Sumber Bantuan..." 
                  />
                </div>
              </>
            )}
            <div className="space-y-0.5">
              <label className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1"><Calendar className="w-2.5 h-2.5" /> Tahun Perolehan</label>
              <input type="text" required value={activeTab === 'prestasi' ? formData.date : activeTab === 'beasiswa' ? scholarshipFormData.date : economicallyDisadvantagedFormData.date} onChange={e => activeTab === 'prestasi' ? setFormData({...formData, date: e.target.value}) : activeTab === 'beasiswa' ? setScholarshipFormData({...scholarshipFormData, date: e.target.value}) : setEconomicallyDisadvantagedFormData({...economicallyDisadvantagedFormData, date: e.target.value})} className="w-full input-cyber rounded-lg p-2 text-[10px] outline-none" placeholder="Contoh: 2025, 2025/2026, dll..." />
            </div>
            <div className="space-y-0.5">
              <label className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1"><TrendingUp className="w-2.5 h-2.5" /> Tingkat {activeTab === 'prestasi' ? 'Prestasi' : activeTab === 'beasiswa' ? 'Beasiswa' : ''}</label>
              <select 
                required 
                value={activeTab === 'prestasi' ? formData.level : activeTab === 'beasiswa' ? scholarshipFormData.level : economicallyDisadvantagedFormData.level} 
                onChange={e => activeTab === 'prestasi' ? setFormData({...formData, level: e.target.value as any}) : activeTab === 'beasiswa' ? setScholarshipFormData({...scholarshipFormData, level: e.target.value as any}) : setEconomicallyDisadvantagedFormData({...economicallyDisadvantagedFormData, level: e.target.value as any})} 
                className="w-full input-cyber rounded-lg p-2 text-[10px] outline-none"
              >
                <option value="sekolah">Sekolah</option>
                <option value="kota">Kota / Kabupaten</option>
                <option value="provinsi">Provinsi</option>
                <option value="nasional">Nasional</option>
                <option value="internasional">Internasional</option>
              </select>
            </div>
          </div>

          {activeTab === 'prestasi' && (
            <div className="space-y-1">
              <label className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1"><Sparkles className="w-3 h-3 text-yellow-500" /> Jenis Prestasi</label>
              <select 
                required 
                value={formData.achievementType} 
                onChange={e => setFormData({...formData, achievementType: e.target.value as any})} 
                className="w-full input-cyber rounded-lg p-2 text-[10px] outline-none"
              >
                <option value="Akademik">Akademik</option>
                <option value="Non Akademik">Non Akademik</option>
              </select>
            </div>
          )}

          {activeTab === 'siswa-tidak-mampu' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1">Pekerjaan Ayah</label>
                <input required value={economicallyDisadvantagedFormData.fatherJob} onChange={e => { setEconomicallyDisadvantagedFormData({...economicallyDisadvantagedFormData, fatherJob: e.target.value}); if (errors.fatherJob) setErrors(prev => ({ ...prev, fatherJob: "" })); }} className={`w-full input-cyber rounded-lg p-2 text-[10px] outline-none ${errors.fatherJob ? 'border-rose-500' : ''}`} placeholder="Pekerjaan Ayah" />
                {errors.fatherJob && <p className="text-[7px] text-rose-500 font-bold">{errors.fatherJob}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1">Pekerjaan Ibu</label>
                <input required value={economicallyDisadvantagedFormData.motherJob} onChange={e => { setEconomicallyDisadvantagedFormData({...economicallyDisadvantagedFormData, motherJob: e.target.value}); if (errors.motherJob) setErrors(prev => ({ ...prev, motherJob: "" })); }} className={`w-full input-cyber rounded-lg p-2 text-[10px] outline-none ${errors.motherJob ? 'border-rose-500' : ''}`} placeholder="Pekerjaan Ibu" />
                {errors.motherJob && <p className="text-[7px] text-rose-500 font-bold">{errors.motherJob}</p>}
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1">Alamat</label>
                <input required value={economicallyDisadvantagedFormData.address} onChange={e => { setEconomicallyDisadvantagedFormData({...economicallyDisadvantagedFormData, address: e.target.value}); if (errors.address) setErrors(prev => ({ ...prev, address: "" })); }} className={`w-full input-cyber rounded-lg p-2 text-[10px] outline-none ${errors.address ? 'border-rose-500' : ''}`} placeholder="Alamat" />
                {errors.address && <p className="text-[7px] text-rose-500 font-bold">{errors.address}</p>}
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1"><Sparkles className="w-3 h-3 text-yellow-500" /> {activeTab === 'prestasi' ? 'Nama Prestasi / Penghargaan' : activeTab === 'beasiswa' ? 'Nama Beasiswa' : 'Catatan Khusus'}</label>
            <input 
              required 
              value={activeTab === 'prestasi' ? formData.achievement : activeTab === 'beasiswa' ? scholarshipFormData.scholarshipName : economicallyDisadvantagedFormData.specialNotes} 
              onChange={e => {
                const val = e.target.value;
                if (activeTab === 'prestasi') {
                  setFormData({...formData, achievement: val});
                  if (errors.achievement) setErrors(prev => ({ ...prev, achievement: "" }));
                } else if (activeTab === 'beasiswa') {
                  setScholarshipFormData({...scholarshipFormData, scholarshipName: val});
                  if (errors.scholarshipName) setErrors(prev => ({ ...prev, scholarshipName: "" }));
                } else {
                  setEconomicallyDisadvantagedFormData({...economicallyDisadvantagedFormData, specialNotes: val});
                }
              }} 
              className={`w-full input-cyber rounded-lg p-2 text-[10px] outline-none ${((activeTab === 'prestasi' && errors.achievement) || (activeTab === 'beasiswa' && errors.scholarshipName)) ? 'border-rose-500' : ''}`} 
              placeholder={`Contoh: ${activeTab === 'prestasi' ? 'Juara 1 Lomba Matematika' : activeTab === 'beasiswa' ? 'Beasiswa PIP' : 'Keterangan khusus...'}, dll...`} 
            />
            {activeTab === 'prestasi' && errors.achievement && <p className="text-[7px] text-rose-500 font-bold">{errors.achievement}</p>}
            {activeTab === 'beasiswa' && errors.scholarshipName && <p className="text-[7px] text-rose-500 font-bold">{errors.scholarshipName}</p>}
          </div>

          {activeTab !== 'siswa-tidak-mampu' && (
            <div className="space-y-1">
              <label className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1"><Info className="w-3 h-3" /> Catatan / Keterangan</label>
              <textarea 
                required 
                value={activeTab === 'prestasi' ? formData.description : scholarshipFormData.description} 
                onChange={e => {
                  const val = e.target.value;
                  if (activeTab === 'prestasi') {
                    setFormData({...formData, description: val});
                  } else {
                    setScholarshipFormData({...scholarshipFormData, description: val});
                  }
                  if (errors.description) setErrors(prev => ({ ...prev, description: "" }));
                }} 
                className={`w-full input-cyber rounded-lg p-2 h-20 text-[10px] leading-relaxed outline-none ${errors.description ? 'border-rose-500' : ''}`} 
                placeholder={`Jelaskan detail ${activeTab === 'prestasi' ? 'prestasi' : 'beasiswa'} yang diraih...`} 
              />
              {errors.description && <p className="text-[7px] text-rose-500 font-bold">{errors.description}</p>}
            </div>
          )}

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
    <div className="space-y-6 pb-12 animate-fade-in text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-4">
        <div className="flex items-center gap-3">
           <button onClick={() => setView(ViewMode.HOME)} className="p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-100 transition-all group shadow-md">
             <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:-translate-x-1 transition-transform" />
           </button>
           <div>
              <p className="label-luxe text-yellow-500 font-black text-[7px]">ACHIEVEMENT & SCHOLARSHIP LOG</p>
              <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase leading-none">Prestasi & <span className="text-yellow-500 font-light italic lowercase">Beasiswa</span></h2>
           </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full md:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-yellow-500" />
            <input 
              type="text" 
              placeholder={`Cari siswa atau ${activeTab}...`} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full input-cyber rounded-lg py-2 pl-9 pr-3 text-[10px] text-slate-600 outline-none focus:ring-2 focus:ring-yellow-500/10" 
            />
          </div>
          <div className="relative group">
            <button 
              className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-[9px] font-bold text-slate-700 focus:ring-2 focus:ring-yellow-500/10 outline-none transition-all shadow-sm flex items-center gap-2 hover:bg-slate-50"
              onClick={() => {
                const el = document.getElementById('class-filter-dropdown');
                if (el) el.classList.toggle('hidden');
              }}
            >
              <Filter className="w-3 h-3 text-yellow-500" />
              {selectedClasses.length === 0 ? 'SEMUA KELAS' : `${selectedClasses.length} KELAS`}
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            <div id="class-filter-dropdown" className="hidden absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-2 px-2 py-1 border-b border-slate-100">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pilih Kelas</span>
                <button 
                  onClick={() => setSelectedClasses([])}
                  className="text-[8px] font-black text-yellow-600 hover:text-yellow-700 uppercase"
                >
                  Reset
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
                {availableClasses.map(className => (
                  <label key={className} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedClasses.includes(className) ? 'bg-yellow-500 border-yellow-500' : 'border-slate-300 group-hover:border-yellow-500'}`}>
                      {selectedClasses.includes(className) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={selectedClasses.includes(className)}
                      onChange={() => {
                        if (selectedClasses.includes(className)) {
                          setSelectedClasses(selectedClasses.filter(c => c !== className));
                        } else {
                          setSelectedClasses([...selectedClasses, className]);
                        }
                      }}
                    />
                    <span className={`text-[10px] font-bold ${selectedClasses.includes(className) ? 'text-slate-900' : 'text-slate-500'}`}>{className}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <button onClick={() => exportToDocx(activeTab)} className="bg-slate-100 text-slate-600 border border-slate-300 px-3 py-2 rounded-lg font-black text-[8px] uppercase tracking-widest transition-all shadow-sm hover:bg-slate-200 hover:text-slate-800 flex items-center gap-1.5">
            <FileDown className="w-3.5 h-3.5" /> EXPORT DOCX
          </button>
          <button onClick={() => { resetForm(); setIsInputMode(true); }} className="bg-yellow-600/20 text-yellow-400 border border-yellow-500/30 px-4 py-2 rounded-lg font-black text-[8px] uppercase tracking-widest transition-all shadow-sm hover:bg-yellow-600 hover:text-white flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> TAMBAH {activeTab === 'prestasi' ? 'PRESTASI' : activeTab === 'beasiswa' ? 'BEASISWA' : 'SISWA TIDAK MAMPU'}
          </button>
        </div>
      </div>

      <div className="flex gap-2 px-4">
        <button 
          onClick={() => setActiveTab('prestasi')}
          className={`flex-1 py-2 rounded-lg font-black text-[8px] uppercase tracking-widest transition-all ${activeTab === 'prestasi' ? 'bg-yellow-500 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'}`}
        >
          <Sparkles className="w-3 h-3 inline-block mr-1" /> Data Prestasi
        </button>
        <button 
          onClick={() => setActiveTab('beasiswa')}
          className={`flex-1 py-2 rounded-lg font-black text-[8px] uppercase tracking-widest transition-all ${activeTab === 'beasiswa' ? 'bg-yellow-500 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'}`}
        >
          <GraduationCap className="w-3 h-3 inline-block mr-1" /> Data Beasiswa
        </button>
        <button 
          onClick={() => setActiveTab('siswa-tidak-mampu')}
          className={`flex-1 py-2 rounded-lg font-black text-[8px] uppercase tracking-widest transition-all ${activeTab === 'siswa-tidak-mampu' ? 'bg-yellow-500 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'}`}
        >
          <DollarSign className="w-3 h-3 inline-block mr-1" /> Siswa Tidak Mampu
        </button>
      </div>

      {activeTab === 'prestasi' ? (
        <>
          {/* Preview Rekap Prestasi */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200 bg-white/60 mx-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Preview Rekap Prestasi</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="p-2 text-[9px] font-black uppercase tracking-widest text-slate-500">Nama Siswa</th>
                    <th className="p-2 text-[9px] font-black uppercase tracking-widest text-slate-500">Kelas</th>
                    <th className="p-2 text-[9px] font-black uppercase tracking-widest text-slate-500">Tanggal</th>
                    <th className="p-2 text-[9px] font-black uppercase tracking-widest text-slate-500">Thn Ajaran</th>
                    <th className="p-2 text-[9px] font-black uppercase tracking-widest text-slate-500">Jenis</th>
                    <th className="p-2 text-[9px] font-black uppercase tracking-widest text-slate-500">Prestasi</th>
                    <th className="p-2 text-[9px] font-black uppercase tracking-widest text-slate-500">Tingkat</th>
                    <th className="p-2 text-[9px] font-black uppercase tracking-widest text-slate-500">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-yellow-600 font-black">TOTAL: {filteredAchievements.length}</span>
                        <span>Aksi</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...filteredAchievements].sort((a, b) => {
                    const nameA = students.find(s => s.id === a.studentId)?.name || '';
                    const nameB = students.find(s => s.id === b.studentId)?.name || '';
                    return nameA.localeCompare(nameB);
                  }).map(a => {
                    const student = students.find(s => s.id === a.studentId);
                    return (
                      <tr key={a.id} className="border-b border-slate-200 hover:bg-white/5 transition-colors">
                        <td className="p-2 text-xs font-bold text-slate-800">{student?.name || '-'}</td>
                        <td className="p-2 text-xs text-slate-500">{student?.className || '-'}</td>
                        <td className="p-2 text-[10px] text-slate-500">{a.date || '-'}</td>
                        <td className="p-2 text-[10px] text-slate-500">{a.academicYear || '-'}</td>
                        <td className="p-2 text-xs font-bold text-yellow-500">{a.achievementType}</td>
                        <td className="p-2 text-xs text-slate-600">{a.achievement}</td>
                        <td className="p-2 text-xs text-slate-500 capitalize">{a.level}</td>
                        <td className="p-2 text-xs">
                          <div className="flex gap-1">
                            <button onClick={() => setPreviewAchievement(a)} title="Lihat Detail" className="p-1 bg-white border border-slate-200 hover:bg-yellow-500/10 rounded text-yellow-500 transition-all"><Eye className="w-3 h-3" /></button>
                            <button onClick={() => startEdit(a)} title="Edit" className="p-1 bg-white border border-slate-200 hover:bg-indigo-500/10 rounded text-indigo-400 transition-all"><Edit className="w-3 h-3" /></button>
                            <button onClick={() => { onDelete(a.id); toast.success("Catatan prestasi berhasil dihapus"); }} title="Hapus" className="p-1 bg-rose-900/20 border border-rose-500/20 hover:bg-rose-900/40 rounded text-rose-500 transition-all"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : activeTab === 'beasiswa' ? (
        <>
          {/* Preview Rekap Beasiswa */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200 bg-white/60 mx-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Preview Rekap Beasiswa</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="p-2 text-[9px] font-black uppercase tracking-widest text-slate-500">Nama Siswa</th>
                    <th className="p-2 text-[9px] font-black uppercase tracking-widest text-slate-500">Kelas</th>
                    <th className="p-2 text-[9px] font-black uppercase tracking-widest text-slate-500">Tanggal</th>
                    <th className="p-2 text-[9px] font-black uppercase tracking-widest text-slate-500">Thn Ajaran</th>
                    <th className="p-2 text-[9px] font-black uppercase tracking-widest text-slate-500">Nama Beasiswa</th>
                    <th className="p-2 text-[9px] font-black uppercase tracking-widest text-slate-500">Tingkat</th>
                    <th className="p-2 text-[9px] font-black uppercase tracking-widest text-slate-500">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-yellow-600 font-black">TOTAL: {filteredScholarships.length}</span>
                        <span>Aksi</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...filteredScholarships].sort((a, b) => {
                    const nameA = students.find(s => s.id === a.studentId)?.name || '';
                    const nameB = students.find(s => s.id === b.studentId)?.name || '';
                    return nameA.localeCompare(nameB);
                  }).map(s => {
                    const student = students.find(st => st.id === s.studentId);
                    return (
                      <tr key={s.id} className="border-b border-slate-200 hover:bg-white/5 transition-colors">
                        <td className="p-2 text-xs font-bold text-slate-800">{student?.name || '-'}</td>
                        <td className="p-2 text-xs text-slate-500">{student?.className || '-'}</td>
                        <td className="p-2 text-[10px] text-slate-500">{s.date || '-'}</td>
                        <td className="p-2 text-[10px] text-slate-500">{s.academicYear || '-'}</td>
                        <td className="p-2 text-xs text-slate-600">{s.scholarshipName}</td>
                        <td className="p-2 text-xs text-slate-500 capitalize">{s.level}</td>
                        <td className="p-2 text-xs">
                          <div className="flex gap-1">
                            <button onClick={() => setPreviewScholarship(s)} title="Lihat Detail" className="p-1 bg-white border border-slate-200 hover:bg-yellow-500/10 rounded text-yellow-500 transition-all"><Eye className="w-3 h-3" /></button>
                            <button onClick={() => startEditScholarship(s)} title="Edit" className="p-1 bg-white border border-slate-200 hover:bg-indigo-500/10 rounded text-indigo-400 transition-all"><Edit className="w-3 h-3" /></button>
                            <button onClick={() => { if(onDeleteScholarship) { onDeleteScholarship(s.id); toast.success("Catatan beasiswa berhasil dihapus"); } }} title="Hapus" className="p-1 bg-rose-900/20 border border-rose-500/20 hover:bg-rose-900/40 rounded text-rose-500 transition-all"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Preview Rekap Siswa Tidak Mampu */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200 bg-white/60 mx-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Preview Rekap Siswa Tidak Mampu</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="p-2 text-[9px] font-black uppercase tracking-widest text-slate-500">Nama Siswa</th>
                    <th className="p-2 text-[9px] font-black uppercase tracking-widest text-slate-500">Kelas</th>
                    <th className="p-2 text-[9px] font-black uppercase tracking-widest text-slate-500">Bantuan</th>
                    <th className="p-2 text-[9px] font-black uppercase tracking-widest text-slate-500">Sumber</th>
                    <th className="p-2 text-[9px] font-black uppercase tracking-widest text-slate-500">Alamat</th>
                    <th className="p-2 text-[9px] font-black uppercase tracking-widest text-slate-500">Pekerjaan Ayah</th>
                    <th className="p-2 text-[9px] font-black uppercase tracking-widest text-slate-500">Catatan Khusus</th>
                    <th className="p-2 text-[9px] font-black uppercase tracking-widest text-slate-500">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-yellow-600 font-black">TOTAL: {filteredEconomicallyDisadvantagedStudents.length}</span>
                        <span>Aksi</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...filteredEconomicallyDisadvantagedStudents].sort((a, b) => {
                    const studentA = students.find(st => st.id === a.studentId);
                    const studentB = students.find(st => st.id === b.studentId);
                    const classA = studentA?.className || a.manualClassName || '';
                    const classB = studentB?.className || b.manualClassName || '';
                    if (classA !== classB) {
                      return classA.localeCompare(classB, undefined, { numeric: true, sensitivity: 'base' });
                    }
                    const nameA = studentA?.name || a.manualStudentName || '';
                    const nameB = studentB?.name || b.manualStudentName || '';
                    return nameA.localeCompare(nameB);
                  }).map(s => {
                    const student = students.find(st => st.id === s.studentId);
                    return (
                      <tr key={s.id} className="border-b border-slate-200 hover:bg-white/5 transition-colors">
                        <td className="p-2 text-xs font-bold text-slate-800">{student?.name || s.manualStudentName || '-'}</td>
                        <td className="p-2 text-xs text-slate-500">{student?.className || s.manualClassName || '-'}</td>
                        <td className="p-2 text-xs font-bold text-yellow-500">{s.assistanceStatus || '-'}</td>
                        <td className="p-2 text-xs text-slate-600">{s.assistanceSource || '-'}</td>
                        <td className="p-2 text-xs text-slate-600">{s.address}</td>
                        <td className="p-2 text-xs text-slate-600">{s.fatherJob}</td>
                        <td className="p-2 text-xs text-slate-600">{s.specialNotes}</td>
                        <td className="p-2 text-xs">
                          <div className="flex gap-1">
                            <button onClick={() => startEditEconomicallyDisadvantagedStudent(s)} title="Edit" className="p-1 bg-white border border-slate-200 hover:bg-indigo-500/10 rounded text-indigo-400 transition-all"><Edit className="w-3 h-3" /></button>
                            <button onClick={() => { if(onDeleteEconomicallyDisadvantagedStudent) { onDeleteEconomicallyDisadvantagedStudent(s.id); toast.success("Catatan berhasil dihapus"); } }} title="Hapus" className="p-1 bg-rose-900/20 border border-rose-500/20 hover:bg-rose-900/40 rounded text-rose-500 transition-all"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {previewAchievement && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-md" onClick={() => setPreviewAchievement(null)} />
           <div className="relative glass-card w-full max-w-2xl rounded-[4rem] border border-yellow-200 p-12 shadow-3xl bg-white animate-in zoom-in-95 duration-300">
              
              <div className="flex justify-between items-start mb-10">
                 <div className="flex items-center gap-5">
                    <div className="p-4 bg-yellow-500 rounded-3xl text-white shadow-2xl"><Sparkles className="w-8 h-8" /></div>
                    <div>
                       <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">Detail Prestasi</h3>
                       <p className="text-[10px] text-yellow-600 font-black mt-1 uppercase tracking-widest">{new Date(previewAchievement.date).toLocaleDateString('id-ID', {day:'2-digit', month:'long', year:'numeric'})}</p>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => setPreviewAchievement(null)} className="p-3 hover:bg-slate-100 rounded-2xl text-primary transition-all"><X className="w-5 h-5" /></button>
                 </div>
              </div>

              <div className="space-y-8 h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                       <label className="label-luxe text-yellow-600">Nama Siswa</label>
                       <div className="text-lg font-black text-slate-900 mt-1">{students.find(s => s.id === previewAchievement.studentId)?.name || 'Siswa Dihapus'}</div>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                       <label className="label-luxe text-yellow-500">Kelas / Tingkat / Thn Ajaran</label>
                       <div className="text-sm font-bold text-slate-700 mt-1">{students.find(s => s.id === previewAchievement.studentId)?.className || '-'} / {previewAchievement.level.toUpperCase()} / {previewAchievement.academicYear || '-'}</div>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="label-luxe text-yellow-600">Nama Prestasi / Penghargaan</label>
                    <div className="p-6 bg-yellow-50 rounded-3xl border border-yellow-100 text-sm text-yellow-900 font-black uppercase tracking-tight">{previewAchievement.achievement}</div>
                 </div>

                 <div className="space-y-3">
                    <label className="label-luxe text-slate-500">Uraian / Keterangan Prestasi</label>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-sm text-slate-700 italic font-medium leading-relaxed">"{previewAchievement.description}"</div>
                 </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button onClick={() => setPreviewAchievement(null)} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-black py-6 rounded-3xl transition-all text-xs uppercase tracking-widest shadow-2xl">TUTUP DETAIL</button>
              </div>
           </div>
        </div>
      )}

      {previewScholarship && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-md" onClick={() => setPreviewScholarship(null)} />
           <div className="relative glass-card w-full max-w-2xl rounded-[4rem] border border-yellow-200 p-12 shadow-3xl bg-white animate-in zoom-in-95 duration-300">
              
              <div className="flex justify-between items-start mb-10">
                 <div className="flex items-center gap-5">
                    <div className="p-4 bg-yellow-500 rounded-3xl text-white shadow-2xl"><GraduationCap className="w-8 h-8" /></div>
                    <div>
                       <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">Detail Beasiswa</h3>
                       <p className="text-[10px] text-yellow-600 font-black mt-1 uppercase tracking-widest">{new Date(previewScholarship.date).toLocaleDateString('id-ID', {day:'2-digit', month:'long', year:'numeric'})}</p>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => setPreviewScholarship(null)} className="p-3 hover:bg-slate-100 rounded-2xl text-primary transition-all"><X className="w-5 h-5" /></button>
                 </div>
              </div>

              <div className="space-y-8 h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                       <label className="label-luxe text-yellow-600">Nama Siswa</label>
                       <div className="text-lg font-black text-slate-900 mt-1">{students.find(s => s.id === previewScholarship.studentId)?.name || 'Siswa Dihapus'}</div>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                       <label className="label-luxe text-yellow-500">Kelas / Tingkat / Thn Ajaran</label>
                       <div className="text-sm font-bold text-slate-700 mt-1">{students.find(s => s.id === previewScholarship.studentId)?.className || '-'} / {previewScholarship.level.toUpperCase()} / {previewScholarship.academicYear || '-'}</div>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="label-luxe text-yellow-600">Nama Beasiswa</label>
                    <div className="p-6 bg-yellow-50 rounded-3xl border border-yellow-100 text-sm text-yellow-900 font-black uppercase tracking-tight">{previewScholarship.scholarshipName}</div>
                 </div>

                 <div className="space-y-3">
                    <label className="label-luxe text-slate-500">Catatan / Keterangan</label>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-sm text-slate-700 italic font-medium leading-relaxed">"{previewScholarship.description}"</div>
                 </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button onClick={() => setPreviewScholarship(null)} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-black py-6 rounded-3xl transition-all text-xs uppercase tracking-widest shadow-2xl">TUTUP DETAIL</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AchievementManagement;
