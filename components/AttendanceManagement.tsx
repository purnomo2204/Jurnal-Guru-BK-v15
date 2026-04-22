import React, { useState, useMemo, useEffect } from 'react';
import { ViewMode, Student, AttendanceRecord, AttendanceStatus, TeacherData } from '../types';
import { ArrowLeft, Plus, Edit, Trash2, FileDown, FileUp, Search, Eye, EyeOff, Save, X, FileText, BarChart2 } from 'lucide-react';
import FormActions from './FormActions';
import AttendanceChartModal from './AttendanceChartModal';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { toast } from 'sonner';
import { validateRequired, validateDateNotFuture } from '../src/lib/validation';

interface AttendanceManagementProps {
  setView: (view: ViewMode) => void;
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  onAddAttendance: (record: AttendanceRecord, sync?: boolean) => void;
  onUpdateAttendance: (record: AttendanceRecord, sync?: boolean) => void;
  onDeleteAttendance: (id: string) => void;
  teacherData: TeacherData;
}

const AttendanceManagement: React.FC<AttendanceManagementProps> = ({ 
  setView, 
  students, 
  attendanceRecords, 
  onAddAttendance, 
  onUpdateAttendance, 
  onDeleteAttendance,
  teacherData
}) => {
  const [newRecord, setNewRecord] = useState<{ date: string; endDate: string; studentId: string; status: AttendanceStatus; semester: 'Ganjil' | 'Genap'; notes: string }>({ 
    date: new Date().toISOString().split('T')[0], 
    endDate: new Date().toISOString().split('T')[0],
    studentId: '', 
    status: 'Sakit',
    semester: 'Ganjil',
    notes: ''
  });
  const [isRange, setIsRange] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassForForm, setSelectedClassForForm] = useState('');
  const [classFilter, setClassFilter] = useState('SEMUA KELAS');
  const [studentFilter, setStudentFilter] = useState('SEMUA SISWA');
  const [semesterFilter, setSemesterFilter] = useState<'SEMUA' | 'Ganjil' | 'Genap'>('SEMUA');
  const [monthFilter, setMonthFilter] = useState<string>('SEMUA');
  const [statusFilter, setStatusFilter] = useState<string>('SEMUA STATUS');
  const [showPreview, setShowPreview] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [showRekapModal, setShowRekapModal] = useState(false);
  const [showRekapPreview, setShowRekapPreview] = useState(false);
  const [showChartModal, setShowChartModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);

  const rekapData = useMemo(() => {
    const studentsInClass = students.filter(s => s.className === classFilter || classFilter === 'SEMUA KELAS');
    return studentsInClass.map(student => {
      const studentRecords = attendanceRecords.filter(r => {
        const matchesStudent = r.studentId === student.id;
        const matchesSemester = semesterFilter === 'SEMUA' || r.semester === semesterFilter;
        const recordMonth = r.date.split('-')[1];
        const matchesMonth = monthFilter === 'SEMUA' || recordMonth === monthFilter;
        return matchesStudent && matchesSemester && matchesMonth;
      });
      const counts = {
        Sakit: studentRecords.filter(r => r.status === 'Sakit').length,
        Ijin: studentRecords.filter(r => r.status === 'Ijin').length,
        Alpa: studentRecords.filter(r => r.status === 'Alpa').length,
        Dispensasi: studentRecords.filter(r => r.status === 'Dispensasi').length,
      };
      return {
        studentId: student.id,
        name: student.name,
        className: student.className,
        ...counts,
        Total: counts.Sakit + counts.Ijin + counts.Alpa + counts.Dispensasi
      };
    });
  }, [students, attendanceRecords, classFilter, semesterFilter, monthFilter]);

  const handleDownloadRekapExcel = () => {
    const ws = XLSX.utils.json_to_sheet(rekapData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekapitulasi Absensi");
    XLSX.writeFile(wb, `Rekapitulasi_Absensi_${classFilter.replace(/ /g, '_')}.xlsx`);
  };

  const generateRekapPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("REKAPITULASI ABSENSI SISWA", 105, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text(teacherData.school?.trim() || "INSTANSI SEKOLAH", 105, 30, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`KELAS: ${classFilter}`, 105, 40, { align: 'center' });
    doc.text(`SEMESTER: ${semesterFilter}`, 105, 47, { align: 'center' });
    if (monthFilter !== 'SEMUA') {
      const monthName = months.find(m => m.id === monthFilter)?.name;
      doc.text(`BULAN: ${monthName?.toUpperCase()}`, 105, 54, { align: 'center' });
    }
    doc.text(`TAHUN PELAJARAN: ${teacherData.academicYear || '-'}`, 105, monthFilter !== 'SEMUA' ? 61 : 54, { align: 'center' });

    const tableData = rekapData.map((student, index) => [
      index + 1,
      student.name,
      student.className,
      student.Sakit,
      student.Ijin,
      student.Alpa,
      student.Dispensasi,
      student.Total
    ]);

    autoTable(doc, {
      startY: monthFilter !== 'SEMUA' ? 70 : 60,
      head: [['No', 'Nama Siswa', 'Kelas', 'Sakit', 'Ijin', 'Alpa', 'Dispensasi', 'Total']],
      body: tableData,
    });

    doc.save(`Rekapitulasi_Absensi_${classFilter.replace(/ /g, '_')}.pdf`);
  };

  const handleDownloadDailyPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("LAPORAN ABSENSI SISWA HARIAN", 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Kelas: ${classFilter} | Semester: ${semesterFilter}`, 105, 30, { align: 'center' });
    if (monthFilter !== 'SEMUA') {
      const monthName = months.find(m => m.id === monthFilter)?.name;
      doc.text(`Bulan: ${monthName}`, 105, 37, { align: 'center' });
    }
    
    const tableData = filteredRecords.map(record => {
      const student = students.find(s => s.id === record.studentId);
      return [record.date, record.semester, student?.name || 'N/A', student?.className || 'N/A', record.status, record.notes || '-'];
    });

    autoTable(doc, {
      startY: monthFilter !== 'SEMUA' ? 45 : 35,
      head: [['Tanggal', 'Semester', 'Nama Siswa', 'Kelas', 'Status', 'Keterangan']],
      body: tableData,
    });

    doc.save("Laporan_Absensi_Harian.pdf");
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const studentsInFilteredClass = useMemo(() => {
    if (classFilter === 'SEMUA KELAS') return students;
    return students.filter(s => s.className === classFilter);
  }, [students, classFilter]);

  const classes = useMemo(() => {
    const allClassNames = students.map(s => s.className);
    return Array.from(new Set(allClassNames)).sort();
  }, [students]);

  const studentsInSelectedClass = useMemo(() => {
    if (!selectedClassForForm) return [];
    return students.filter(s => s.className === selectedClassForForm);
  }, [students, selectedClassForForm]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!validateRequired(newRecord.date)) newErrors.date = "Tanggal wajib diisi";
    if (newRecord.date && !validateDateNotFuture(newRecord.date)) newErrors.date = "Tanggal tidak boleh di masa depan";
    
    if (isRange) {
      if (!validateRequired(newRecord.endDate)) newErrors.endDate = "Tanggal akhir wajib diisi";
      if (newRecord.endDate && !validateDateNotFuture(newRecord.endDate)) newErrors.endDate = "Tanggal akhir tidak boleh di masa depan";
      if (newRecord.date && newRecord.endDate && newRecord.endDate < newRecord.date) {
        newErrors.endDate = "Tanggal akhir harus setelah tanggal mulai";
      }
    }
    
    if (!validateRequired(newRecord.studentId)) newErrors.studentId = "Siswa wajib dipilih";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (syncOnline: boolean = true) => {
    if (!validateForm()) {
      toast.error("Mohon perbaiki kesalahan pada form sebelum menyimpan.");
      return;
    }

    if (editingRecord) {
      onUpdateAttendance(editingRecord, syncOnline);
      setEditingRecord(null);
      setNotification('Data absensi berhasil diperbarui!');
    } else {
      if (!newRecord.date || !newRecord.studentId) {
        setNotification('Silakan lengkapi tanggal dan nama siswa.');
        return;
      }

      if (isRange) {
        const start = new Date(newRecord.date);
        const end = new Date(newRecord.endDate);
        
        if (end < start) {
          setNotification('Tanggal akhir tidak boleh sebelum tanggal mulai.');
          return;
        }

        let current = new Date(start);
        while (current <= end) {
          const dateStr = current.toISOString().split('T')[0];
          onAddAttendance({ 
            ...newRecord, 
            date: dateStr,
            id: (Date.now() + Math.random()).toString() 
          }, syncOnline);
          current.setDate(current.getDate() + 1);
        }
        setNotification(`Data absensi rentang tanggal berhasil disimpan!`);
      } else {
        onAddAttendance({ ...newRecord, id: Date.now().toString() }, syncOnline);
        setNotification('Data absensi berhasil disimpan!');
      }

      setNewRecord({ ...newRecord, studentId: '', status: 'Sakit', notes: '' });
      setSelectedClassForForm('');
    }
  };

  const handleAddOrUpdate = () => {
    handleSave(true);
  };

  const months = useMemo(() => {
    const allMonths = [
      { id: '01', name: 'Januari' },
      { id: '02', name: 'Februari' },
      { id: '03', name: 'Maret' },
      { id: '04', name: 'April' },
      { id: '05', name: 'Mei' },
      { id: '06', name: 'Juni' },
      { id: '07', name: 'Juli' },
      { id: '08', name: 'Agustus' },
      { id: '09', name: 'September' },
      { id: '10', name: 'Oktober' },
      { id: '11', name: 'November' },
      { id: '12', name: 'Desember' }
    ];

    if (semesterFilter === 'Ganjil') {
      return allMonths.filter(m => parseInt(m.id) >= 7);
    } else if (semesterFilter === 'Genap') {
      return allMonths.filter(m => parseInt(m.id) <= 6);
    }
    return allMonths;
  }, [semesterFilter]);

  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter(record => {
      const student = students.find(s => s.id === record.studentId);
      const matchesSearch = student?.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClass = classFilter === 'SEMUA KELAS' || student?.className === classFilter;
      const matchesStudent = studentFilter === 'SEMUA SISWA' || record.studentId === studentFilter;
      const matchesSemester = semesterFilter === 'SEMUA' || record.semester === semesterFilter;
      const matchesStatus = statusFilter === 'SEMUA STATUS' || record.status === statusFilter;
      
      const recordMonth = record.date.split('-')[1];
      const matchesMonth = monthFilter === 'SEMUA' || recordMonth === monthFilter;

      return matchesSearch && matchesClass && matchesStudent && matchesSemester && matchesStatus && matchesMonth;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [attendanceRecords, students, searchTerm, classFilter, studentFilter, semesterFilter, statusFilter, monthFilter]);

  const handleDownloadTemplate = () => {
    const template = [
      {
        "Tanggal (YYYY-MM-DD)": "2024-01-01",
        "Semester (Ganjil/Genap)": "Ganjil",
        "Nama Siswa": "Contoh Nama",
        "Kelas": "X-A",
        "Status (Sakit/Ijin/Alpa/Dispensasi)": "Sakit",
        "Keterangan": "Catatan tambahan"
      }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Absensi");
    XLSX.writeFile(wb, "Template_Absensi_Siswa.xlsx");
  };

  const handleDownloadExcel = () => {
    const dataToExport = filteredRecords.map(record => {
      const student = students.find(s => s.id === record.studentId);
      return {
        "Tanggal": record.date,
        "Semester": record.semester,
        "Nama Siswa": student?.name || 'N/A',
        "Kelas": student?.className || 'N/A',
        "Status": record.status,
        "Keterangan": record.notes || '-'
      };
    });
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Absensi");
    XLSX.writeFile(wb, `Data_Absensi_${classFilter.replace(/ /g, '_')}.xlsx`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10 animate-fade-in text-left">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setView(ViewMode.HOME)} className="p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-100 transition-all group shadow-lg">
            <ArrowLeft className="w-5 h-5 text-primary group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <p className="label-luxe text-primary font-black text-[8px]">MANAJEMEN SISWA</p>
            <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase leading-none">Absensi Siswa <span className="text-primary font-light italic lowercase">Harian</span></h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showPreview && (
            <button onClick={handleDownloadDailyPdf} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl">
              <FileDown className="w-3 h-3" /> Download PDF
            </button>
          )}
          <button 
            onClick={() => setShowPreview(!showPreview)} 
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-xl ${showPreview ? 'bg-primary text-white' : 'bg-white text-primary border border-slate-200 hover:bg-slate-100'}`}
          >
            {showPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {showPreview ? 'Tutup Preview' : 'Preview Laporan'}
          </button>
        </div>
      </div>

      {/* Form Section - Hidden in Print and Preview */}
      {!showPreview && (
        <div className="glass-card p-4.5 rounded-2xl border border-slate-200 mx-4 bg-white/90 shadow-2xl">
          <div className="flex flex-wrap gap-2">
            <button onClick={handleDownloadTemplate} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all shadow-sm">
              <FileDown className="w-3 h-3" /> Template Excel
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-emerald-900/20 border border-emerald-900/30 text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-900/30 transition-all shadow-sm">
              <FileUp className="w-3 h-3" /> Upload Excel
            </button>
            <button onClick={handleDownloadExcel} className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all shadow-sm">
              <FileDown className="w-3 h-3" /> Download Excel
            </button>
            <button onClick={() => setShowRekapModal(true)} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all shadow-sm">
              <FileText className="w-3 h-3" /> Rekapitulasi Absensi
            </button>
            <button onClick={() => setShowChartModal(true)} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all shadow-sm">
              <BarChart2 className="w-3 h-3" /> Statistik Absensi
            </button>
          </div>

          {notification && (
            <div className="mb-4 p-3 bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2">
              <Save className="w-4 h-4" /> {notification}
            </div>
          )}

          <div className="mt-6 mb-4 flex items-center gap-3 border-b border-slate-100 pb-4">
            <button 
              onClick={() => setIsRange(false)}
              className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border-2 ${!isRange ? 'bg-blue-600 text-white border-blue-700 shadow-lg' : 'bg-white text-blue-600 border-blue-200 hover:border-blue-400 hover:bg-blue-50'}`}
            >
              Satu Hari
            </button>
            <button 
              onClick={() => setIsRange(true)}
              className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border-2 ${isRange ? 'bg-emerald-600 text-white border-emerald-700 shadow-lg' : 'bg-white text-emerald-600 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50'}`}
            >
              Rentang Tanggal
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="label-luxe ml-1 text-[7px]">{isRange ? 'Tanggal Mulai' : 'Tanggal'}</label>
              <input 
                type="date" 
                value={editingRecord ? editingRecord.date : newRecord.date} 
                onChange={e => {
                  const val = e.target.value;
                  if (editingRecord) setEditingRecord({...editingRecord, date: val});
                  else setNewRecord({ ...newRecord, date: val });
                  if (errors.date) setErrors(prev => ({ ...prev, date: "" }));
                }}
                className={`w-full p-2.5 text-[10px] input-cyber rounded-xl focus:border-primary focus:ring-primary outline-none ${errors.date ? 'border-rose-500' : ''}`}
              />
              {errors.date && <p className="text-[7px] text-rose-500 font-bold ml-1">{errors.date}</p>}
            </div>
            {isRange && !editingRecord && (
              <div className="space-y-1 animate-fade-in">
                <label className="label-luxe ml-1 text-[7px]">Tanggal Selesai</label>
                <input 
                  type="date" 
                  value={newRecord.endDate} 
                  onChange={e => {
                    setNewRecord({ ...newRecord, endDate: e.target.value });
                    if (errors.endDate) setErrors(prev => ({ ...prev, endDate: "" }));
                  }}
                  className={`w-full p-2.5 text-[10px] input-cyber rounded-xl focus:border-primary focus:ring-primary outline-none ${errors.endDate ? 'border-rose-500' : ''}`}
                />
                {errors.endDate && <p className="text-[7px] text-rose-500 font-bold ml-1">{errors.endDate}</p>}
              </div>
            )}
            <div className="space-y-1">
              <label className="label-luxe ml-1 text-[7px]">Kelas</label>
              <select 
                value={selectedClassForForm} 
                onChange={e => setSelectedClassForForm(e.target.value)}
                className="w-full p-2.5 text-[10px] input-cyber rounded-xl focus:border-primary focus:ring-primary outline-none"
              >
                <option value="">-- Pilih Kelas --</option>
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="label-luxe ml-1 text-[7px]">Nama Siswa</label>
              <select 
                value={editingRecord ? editingRecord.studentId : newRecord.studentId} 
                onChange={e => {
                  const val = e.target.value;
                  if (editingRecord) setEditingRecord({...editingRecord, studentId: val});
                  else setNewRecord({ ...newRecord, studentId: val });
                  if (errors.studentId) setErrors(prev => ({ ...prev, studentId: "" }));
                }}
                className={`w-full p-2.5 text-[10px] input-cyber rounded-xl focus:border-primary focus:ring-primary outline-none ${errors.studentId ? 'border-rose-500' : ''}`}
                disabled={!selectedClassForForm}
              >
                <option value="">-- Pilih Siswa --</option>
                {studentsInSelectedClass.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {errors.studentId && <p className="text-[7px] text-rose-500 font-bold ml-1">{errors.studentId}</p>}
            </div>
            <div className="space-y-1">
              <label className="label-luxe ml-1 text-[7px]">Semester</label>
              <select 
                value={editingRecord ? editingRecord.semester : newRecord.semester} 
                onChange={e => editingRecord ? setEditingRecord({...editingRecord, semester: e.target.value as 'Ganjil' | 'Genap'}) : setNewRecord({ ...newRecord, semester: e.target.value as 'Ganjil' | 'Genap' })}
                className="w-full p-2.5 text-[10px] input-cyber rounded-xl focus:border-primary focus:ring-primary outline-none"
              >
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="label-luxe ml-1 text-[7px]">Status Absensi</label>
              <select 
                value={editingRecord ? editingRecord.status : newRecord.status} 
                onChange={e => editingRecord ? setEditingRecord({...editingRecord, status: e.target.value as AttendanceStatus}) : setNewRecord({ ...newRecord, status: e.target.value as AttendanceStatus })}
                className="w-full p-2.5 text-[10px] input-cyber rounded-xl focus:border-primary focus:ring-primary outline-none"
              >
                <option>Masuk</option>
                <option>Sakit</option>
                <option>Ijin</option>
                <option>Alpa</option>
                <option>Dispensasi</option>
              </select>
            </div>
            <div className="space-y-1 lg:col-span-2">
              <label className="label-luxe ml-1 text-[7px]">Keterangan / Catatan</label>
              <input 
                type="text" 
                placeholder="Contoh: Sakit demam, Ijin acara keluarga..."
                value={editingRecord ? editingRecord.notes : newRecord.notes} 
                onChange={e => editingRecord ? setEditingRecord({...editingRecord, notes: e.target.value}) : setNewRecord({ ...newRecord, notes: e.target.value })}
                className="w-full p-2.5 text-[10px] input-cyber rounded-xl focus:border-primary focus:ring-primary outline-none"
              />
            </div>
          </div>
          <FormActions 
            onSaveLocal={() => handleSave(false)}
            onSaveOnline={() => handleSave(true)}
            onCancel={() => { setEditingRecord(null); setSelectedClassForForm(''); }}
            onClose={() => { setEditingRecord(null); setSelectedClassForForm(''); }}
          />
        </div>
      )}

      {/* Table Section */}
      <div className={`glass-card p-10 rounded-[3rem] border border-slate-200 mx-4 bg-white shadow-2xl ${showPreview ? 'shadow-none border-none bg-white' : ''}`}>
        {/* Header for Print/Preview */}
        {(showPreview || window.matchMedia('print').matches) && (
          <div className="text-center mb-10 space-y-2 border-b-2 border-slate-900 pb-6">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-black">Laporan Absensi Siswa</h2>
            <p className="text-sm font-bold uppercase tracking-widest text-slate-600">{teacherData.school?.trim() || 'Instansi Sekolah'}</p>
            <div className="flex justify-center gap-10 pt-4 text-[10px] font-bold uppercase tracking-widest text-black">
              <p>Kelas: {classFilter}</p>
              {studentFilter !== 'SEMUA SISWA' && <p>Siswa: {students.find(s => s.id === studentFilter)?.name}</p>}
              <p>Semester: {semesterFilter}</p>
              {monthFilter !== 'SEMUA' && <p>Bulan: {months.find(m => m.id === monthFilter)?.name}</p>}
              <p>Tahun Pelajaran: {teacherData.academicYear || '-'}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Data Absensi</h3>
            <select 
              value={classFilter} 
              onChange={e => { setClassFilter(e.target.value); setStudentFilter('SEMUA SISWA'); }}
              className="input-cyber rounded-full px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-primary outline-none focus:ring-1 focus:ring-primary/20 bg-white"
            >
              <option>SEMUA KELAS</option>
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select 
              value={studentFilter} 
              onChange={e => setStudentFilter(e.target.value)}
              className="input-cyber rounded-full px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-primary outline-none focus:ring-1 focus:ring-primary/20 bg-white w-32"
            >
              <option>SEMUA SISWA</option>
              {studentsInFilteredClass.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select 
              value={semesterFilter} 
              onChange={e => {
                setSemesterFilter(e.target.value as any);
                setMonthFilter('SEMUA');
              }}
              className="input-cyber rounded-full px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-primary outline-none focus:ring-1 focus:ring-primary/20 bg-white"
            >
              <option value="SEMUA">SEMUA SEMESTER</option>
              <option value="Ganjil">GANJIL</option>
              <option value="Genap">GENAP</option>
            </select>
            <select 
              value={monthFilter} 
              onChange={e => setMonthFilter(e.target.value)}
              className="input-cyber rounded-full px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-primary outline-none focus:ring-1 focus:ring-primary/20 bg-white"
            >
              <option value="SEMUA">SEMUA BULAN</option>
              {months.map(m => <option key={m.id} value={m.id}>{m.name.toUpperCase()}</option>)}
            </select>
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
              className="input-cyber rounded-full px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-primary outline-none focus:ring-1 focus:ring-primary/20 bg-white w-32"
            >
              <option value="SEMUA STATUS">SEMUA STATUS</option>
              <option value="Masuk">MASUK</option>
              <option value="Sakit">SAKIT</option>
              <option value="Ijin">IJIN</option>
              <option value="Alpa">ALPA</option>
              <option value="Dispensasi">DISPENSASI</option>
            </select>
          </div>
          <div className="relative w-full md:w-60">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-primary" />
            <input 
              type="text" 
              placeholder="Cari nama siswa..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full input-cyber rounded-full py-2 pl-10 pr-4 text-[10px] text-slate-800 outline-none focus:ring-1 focus:ring-primary/20 bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[9px] text-primary uppercase bg-white font-black tracking-widest">
              <tr>
                <th className="p-3">Tanggal</th>
                <th className="p-3">Semester</th>
                <th className="p-3">Nama Siswa</th>
                <th className="p-3">Kelas</th>
                <th className="p-3">Status</th>
                <th className="p-3">Keterangan</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-500 font-medium italic">Tidak ada data absensi ditemukan.</td>
                </tr>
              ) : (
                filteredRecords.map(record => {
                  const student = students.find(s => s.id === record.studentId);
                  return (
                    <tr key={record.id} className="hover:bg-white/5 transition-all group">
                      <td className="p-3 font-bold text-slate-800">{record.date}</td>
                      <td className="p-3 font-bold text-slate-600 text-[10px]">{record.semester}</td>
                      <td className="p-3 font-black text-slate-800 uppercase tracking-tighter">{student?.name}</td>
                      <td className="p-3 font-black text-primary text-[9px] uppercase tracking-widest">{student?.className}</td>
                      <td className="p-3">
                        <span className={`px-3 py-1 text-[8px] font-black uppercase tracking-[0.15em] rounded-lg border ${
                          record.status === 'Sakit' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                          record.status === 'Ijin' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                          record.status === 'Alpa' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                          'bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 italic text-[10px]">{record.notes || '-'}</td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => {
                            setEditingRecord(record);
                            setSelectedClassForForm(student?.className || '');
                            setShowPreview(false);
                            setIsRange(false);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }} className="p-1.5 bg-white border border-slate-300 hover:bg-primary/10 rounded-lg text-primary transition-all shadow-sm">
                            <Edit className="w-3 h-3" />
                          </button>
                          <button onClick={() => {
                            setRecordToDelete(record.id);
                            setShowDeleteConfirm(true);
                          }} title="Hapus" className="p-1.5 bg-white border border-slate-300 hover:bg-rose-900/20 rounded-lg text-rose-500 transition-all shadow-sm">
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-scale-in">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 mb-2">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Konfirmasi Hapus</h3>
              <p className="text-sm text-slate-600 font-medium">
                Apakah Anda yakin ingin menghapus data absensi ini? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3 w-full pt-4">
                <button 
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setRecordToDelete(null);
                  }}
                  className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Batal
                </button>
                <button 
                  onClick={() => {
                    if (recordToDelete) {
                      onDeleteAttendance(recordToDelete);
                      setRecordToDelete(null);
                      setShowDeleteConfirm(false);
                      setNotification('Data absensi berhasil dihapus!');
                    }
                  }}
                  className="flex-1 px-6 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rekapitulasi Absensi Modal */}
      {showRekapModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-4xl shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Rekapitulasi Absensi
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => setShowRekapPreview(!showRekapPreview)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-xl bg-white text-primary border border-slate-200 hover:bg-slate-100">
                  {showRekapPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {showRekapPreview ? 'Tutup Preview' : 'Preview'}
                </button>
                <select 
                  value={classFilter} 
                  onChange={e => setClassFilter(e.target.value)}
                  className="input-cyber rounded-full px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-primary outline-none focus:ring-1 focus:ring-primary/20 bg-slate-50"
                >
                  <option>SEMUA KELAS</option>
                  {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select 
                  value={semesterFilter} 
                  onChange={e => {
                    setSemesterFilter(e.target.value as any);
                    setMonthFilter('SEMUA');
                  }}
                  className="input-cyber rounded-full px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-primary outline-none focus:ring-1 focus:ring-primary/20 bg-slate-50"
                >
                  <option value="SEMUA">SEMUA SEMESTER</option>
                  <option value="Ganjil">GANJIL</option>
                  <option value="Genap">GENAP</option>
                </select>
                <select 
                  value={monthFilter} 
                  onChange={e => setMonthFilter(e.target.value)}
                  className="input-cyber rounded-full px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-primary outline-none focus:ring-1 focus:ring-primary/20 bg-slate-50"
                >
                  <option value="SEMUA">SEMUA BULAN</option>
                  {months.map(m => <option key={m.id} value={m.id}>{m.name.toUpperCase()}</option>)}
                </select>
                <button onClick={handleDownloadRekapExcel} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-emerald-600">
                  <FileDown className="w-5 h-5" />
                </button>
                <button onClick={generateRekapPdf} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-rose-600">
                  <FileText className="w-5 h-5" />
                </button>
                <button onClick={() => { setShowRekapModal(false); setShowRekapPreview(false); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>
            
            {showRekapPreview ? (
              <div className="bg-white p-10 border border-slate-200 rounded-2xl shadow-lg">
                <div className="text-center mb-10 space-y-2 border-b-2 border-slate-900 pb-6">
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-black">Rekapitulasi Absensi Siswa</h2>
                  <p className="text-sm font-bold uppercase tracking-widest text-slate-600">{teacherData.school?.trim() || 'Instansi Sekolah'}</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-800">Kelas: {classFilter} | Semester: {semesterFilter}</p>
                  {monthFilter !== 'SEMUA' && <p className="text-xs font-bold uppercase tracking-widest text-slate-800">Bulan: {months.find(m => m.id === monthFilter)?.name}</p>}
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-800">Tahun Pelajaran: {teacherData.academicYear || '-'}</p>
                </div>
                <table className="w-full text-xs text-left mb-10">
                  <thead className="text-[9px] text-primary uppercase bg-slate-50 font-black tracking-widest">
                    <tr>
                      <th className="p-3">No</th>
                      <th className="p-3">Nama Siswa</th>
                      <th className="p-3">Kelas</th>
                      <th className="p-3">Sakit</th>
                      <th className="p-3">Ijin</th>
                      <th className="p-3">Alpa</th>
                      <th className="p-3">Dispensasi</th>
                      <th className="p-3">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rekapData.map((student, index) => (
                      <tr key={student.studentId} className="hover:bg-slate-50 transition-all">
                        <td className="p-3 font-bold text-slate-600">{index + 1}</td>
                        <td className="p-3 font-black text-slate-800 uppercase">{student.name}</td>
                        <td className="p-3 font-bold text-slate-600">{student.className}</td>
                        <td className="p-3 font-bold text-blue-600">{student.Sakit}</td>
                        <td className="p-3 font-bold text-amber-600">{student.Ijin}</td>
                        <td className="p-3 font-bold text-rose-600">{student.Alpa}</td>
                        <td className="p-3 font-bold text-emerald-600">{student.Dispensasi}</td>
                        <td className="p-3 font-black text-slate-900">{student.Total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <table className="w-full text-xs text-left mb-6">
                <thead className="text-[9px] text-primary uppercase bg-slate-50 font-black tracking-widest">
                  <tr>
                    <th className="p-3">No</th>
                    <th className="p-3">Nama Siswa</th>
                    <th className="p-3">Kelas</th>
                    <th className="p-3">Sakit</th>
                    <th className="p-3">Ijin</th>
                    <th className="p-3">Alpa</th>
                    <th className="p-3">Dispensasi</th>
                    <th className="p-3">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rekapData.map((student, index) => (
                    <tr key={student.studentId} className="hover:bg-slate-50 transition-all">
                      <td className="p-3 font-bold text-slate-600">{index + 1}</td>
                      <td className="p-3 font-black text-slate-800 uppercase">{student.name}</td>
                      <td className="p-3 font-bold text-slate-600">{student.className}</td>
                      <td className="p-3 font-bold text-blue-600">{student.Sakit}</td>
                      <td className="p-3 font-bold text-amber-600">{student.Ijin}</td>
                      <td className="p-3 font-bold text-rose-600">{student.Alpa}</td>
                      <td className="p-3 font-bold text-emerald-600">{student.Dispensasi}</td>
                      <td className="p-3 font-black text-slate-900">{student.Total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="flex justify-end gap-3">
              <button 
                onClick={handleDownloadRekapExcel}
                className="px-5 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg flex items-center gap-2"
              >
                <FileDown className="w-4 h-4" /> Download Excel
              </button>
              <button 
                onClick={() => setShowRekapModal(false)}
                className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      <AttendanceChartModal 
        isOpen={showChartModal} 
        onClose={() => setShowChartModal(false)} 
        students={students} 
        attendanceRecords={attendanceRecords} 
      />
    </div>
  );
};

export default AttendanceManagement;
