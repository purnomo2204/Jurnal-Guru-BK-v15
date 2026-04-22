
import React, { useState, useMemo } from 'react';
import { 
  Inbox, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  User, 
  Users, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ChevronRight,
  Trash2,
  ExternalLink,
  Phone,
  Link
} from 'lucide-react';
import { ViewMode, ProblemReport, TeacherData } from '../types';

interface ProblemBoxProps {
  reports: ProblemReport[];
  onAdd: (report: ProblemReport) => void;
  onUpdate: (report: ProblemReport) => void;
  onDelete: (id: string) => void;
  teacherData: TeacherData;
  onUpdateTeacherData: (data: TeacherData) => void;
  setView: (view: ViewMode) => void;
  showNotification?: (msg: string, type: 'success' | 'error' | 'loading') => void;
  isStudentView?: boolean;
  teacherId?: string;
}

const ProblemBox: React.FC<ProblemBoxProps> = ({
  reports,
  onAdd,
  onUpdate,
  onDelete,
  teacherData,
  onUpdateTeacherData,
  setView,
  showNotification,
  isStudentView = false,
  teacherId = ''
}) => {
  const [isModalOpen, setIsModalOpen] = useState(isStudentView);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('Semua');
  const [teacherWa, setTeacherWa] = useState(teacherData.phone || '');

  // Sync teacherWa with teacherData.phone when it changes (e.g. after async fetch)
  React.useEffect(() => {
    setTeacherWa(teacherData.phone || '');
  }, [teacherData.phone]);

  const handleUpdateWa = (val: string) => {
    setTeacherWa(val);
    onUpdateTeacherData({ ...teacherData, phone: val });
  };

  // Form State
  const [formData, setFormData] = useState({
    studentName: '',
    className: '',
    problemType: 'Pribadi' as 'Pribadi' | 'Sosial' | 'Belajar' | 'Karier',
    problemDescription: '',
    specialNotes: '',
    consultationDay: '',
    consultationDate: '',
    consultationTime: '',
    consultationPlace: ''
  });

  const currentTime = useMemo(() => {
    const now = new Date();
    return {
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0]
    };
  }, [isModalOpen, isManualEntryOpen]);

  const filteredReports = reports.filter(r => {
    const matchesSearch = 
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.problemDescription.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'Semua' || r.problemType === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newReport: ProblemReport = {
      id: Date.now().toString(),
      date: currentTime.date,
      time: currentTime.time,
      ...formData,
      status: 'Pending'
    };

    onAdd(newReport);

    // Prepare WA message
    const waMessage = `*LAPORAN KOTAK MASALAH*%0A%0A` +
      `*Tanggal Lapor:* ${newReport.date}%0A` +
      `*Jam Lapor:* ${newReport.time}%0A` +
      `*Nama:* ${newReport.studentName}%0A` +
      `*Kelas:* ${newReport.className}%0A` +
      `*Jenis Masalah:* ${newReport.problemType}%0A` +
      `*Masalah:* ${newReport.problemDescription}%0A` +
      `*Catatan:* ${newReport.specialNotes || '-'}%0A%0A` +
      `*JADWAL KONSULTASI DIINGINKAN:*%0A` +
      `*Hari:* ${newReport.consultationDay || '-'}%0A` +
      `*Tanggal:* ${newReport.consultationDate || '-'}%0A` +
      `*Jam:* ${newReport.consultationTime || '-'}%0A` +
      `*Tempat:* ${newReport.consultationPlace || '-'}%0A%0A` +
      `_Laporan dikirim melalui Aplikasi Jurnal Guru BK_`;

    let waNumber = teacherWa.replace(/[^0-9]/g, '') || '';
    
    // Auto-format for Indonesia if it starts with 0
    if (waNumber.startsWith('0')) {
      waNumber = '62' + waNumber.substring(1);
    }

    if (waNumber) {
      window.open(`https://wa.me/${waNumber}?text=${waMessage}`, '_blank');
    } else {
      if (showNotification) {
        showNotification("Nomor WA Guru BK belum diisi. Silakan hubungi Guru BK Anda.", "error");
      } else {
        alert("Nomor WA Guru BK belum diisi.");
      }
    }

    setIsModalOpen(false);
    setFormData({
      studentName: '',
      className: '',
      problemType: 'Pribadi',
      problemDescription: '',
      specialNotes: '',
      consultationDay: '',
      consultationDate: '',
      consultationTime: '',
      consultationPlace: ''
    });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newReport: ProblemReport = {
      id: Date.now().toString(),
      date: currentTime.date,
      time: currentTime.time,
      ...formData,
      status: 'Pending'
    };

    onAdd(newReport);

    if (showNotification) {
      showNotification("Laporan berhasil disimpan secara manual.", "success");
    }

    setIsManualEntryOpen(false);
    setFormData({
      studentName: '',
      className: '',
      problemType: 'Pribadi',
      problemDescription: '',
      specialNotes: '',
      consultationDay: '',
      consultationDate: '',
      consultationTime: '',
      consultationPlace: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Follow-up': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getProblemTypeColor = (type: string) => {
    switch (type) {
      case 'Pribadi': return 'text-rose-500 bg-rose-50';
      case 'Sosial': return 'text-sky-500 bg-sky-50';
      case 'Belajar': return 'text-amber-500 bg-amber-50';
      case 'Karier': return 'text-indigo-500 bg-indigo-50';
      default: return 'text-slate-500 bg-slate-50';
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-rose-500 rounded-lg shadow-lg shadow-rose-500/20">
            <Inbox className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">KOTAK MASALAH</h1>
            <p className="text-slate-500 text-[10px] font-medium">
              {isStudentView ? 'Sampaikan masalahmu secara rahasia kepada Guru BK.' : 'Layanan pengaduan digital.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isStudentView && (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
              <Phone className="w-3.5 h-3.5 text-emerald-500" />
              <input 
                type="text"
                placeholder="Nomor WA Guru BK"
                value={teacherWa}
                onChange={(e) => handleUpdateWa(e.target.value)}
                className="text-[10px] font-bold text-slate-700 border-none p-0 focus:ring-0 w-28"
              />
            </div>
          )}
          {!isStudentView && (
            <button
              onClick={() => {
                if (!teacherId && !isStudentView) {
                  showNotification?.('Peringatan: Anda belum login ke Cloud. Link ini tidak akan berfungsi dengan baik untuk siswa. Silakan login di menu Pengaturan terlebih dahulu.', 'error');
                  return; // Prevent copying invalid link
                }
                const tId = teacherId || teacherData.nip || 'default';
                const shareUrl = `${window.location.origin}/#/kotak-masalah-siswa?teacher_id=${tId}`;
                navigator.clipboard.writeText(shareUrl);
                if (showNotification) {
                  showNotification('Link berhasil disalin! Bagikan ke siswa.', 'success');
                } else {
                  alert(`Link disalin: ${shareUrl}\n\nBagikan link ini ke siswa agar mereka bisa melapor langsung ke Anda.`);
                }
              }}
              className="flex items-center justify-center gap-2 px-3 py-1.5 bg-white text-slate-600 rounded-xl font-bold text-[10px] border border-slate-200 shadow-sm hover:bg-slate-50 transition-all"
              title="Salin Link untuk Siswa"
            >
              <Link className="w-3.5 h-3.5 text-slate-400" />
              SALIN LINK SISWA
            </button>
          )}
          {!isStudentView && (
            <button
              onClick={() => setIsManualEntryOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 hover:-translate-y-0.5 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              TAMBAH LAPORAN MASUK
            </button>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-rose-500/20 hover:bg-rose-600 hover:-translate-y-0.5 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            {isStudentView ? 'KIRIM LAPORAN BARU' : 'LAPORAN BARU'}
          </button>
        </div>
      </div>

      {/* Stats & Filters */}
      {!isStudentView && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Total Aduan</span>
            </div>
            <div className="text-xl font-black text-slate-900">{reports.length}</div>
          </div>
          
          <div className="md:col-span-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari laporan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border-none rounded-xl text-xs focus:ring-2 focus:ring-rose-500/20 transition-all"
              />
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="flex-1 md:w-32 px-3 py-1.5 bg-slate-50 border-none rounded-xl text-[10px] font-bold text-slate-700 focus:ring-2 focus:ring-rose-500/20 transition-all"
              >
                <option value="Semua">Semua</option>
                <option value="Pribadi">Pribadi</option>
                <option value="Sosial">Sosial</option>
                <option value="Belajar">Belajar</option>
                <option value="Karier">Karier</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Reports List */}
      {!isStudentView && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredReports.length > 0 ? (
            filteredReports.map((report) => (
              <div 
                key={report.id}
                className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
              >
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${getStatusColor(report.status)}`}>
                    {report.status}
                  </div>
                  <button 
                    onClick={() => onDelete(report.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${getProblemTypeColor(report.problemType)}`}>
                      {report.problemType}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" /> {report.date}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-slate-900 leading-tight uppercase">
                    {report.studentName}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Kelas {report.className}
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-xs text-slate-700 font-medium line-clamp-2 italic">
                    "{report.problemDescription}"
                  </p>
                </div>

                {(report.consultationDay || report.consultationDate) && (
                  <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100 space-y-1">
                    <p className="text-[9px] font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" /> Jadwal Konsultasi:
                    </p>
                    <p className="text-[9px] text-emerald-600 font-bold">
                      {report.consultationDay}, {report.consultationDate} {report.consultationTime && `@ ${report.consultationTime}`}
                    </p>
                    {report.consultationPlace && (
                      <p className="text-[9px] text-emerald-600 font-bold italic">
                        Tempat: {report.consultationPlace}
                      </p>
                    )}
                  </div>
                )}

                <div className="pt-1 flex items-center justify-between">
                  <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center">
                    <User className="w-3 h-3 text-rose-500" />
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
            <Inbox className="w-8 h-8 text-slate-200 mb-2" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Belum Ada Laporan</h3>
          </div>
        )}
        </div>
      )}

      {/* Manual Entry Modal (Green Theme) */}
      {isManualEntryOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4" />
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest">Tambah Laporan Masuk</h3>
                  <p className="text-[8px] opacity-80 font-bold uppercase tracking-wider">Input Manual Kotak Masalah</p>
                </div>
              </div>
              <button 
                onClick={() => setIsManualEntryOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Tanggal Lapor</label>
                  <input type="date" readOnly value={currentTime.date} className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-[10px] font-bold text-slate-400 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Jam Lapor</label>
                  <input type="text" readOnly value={currentTime.time} className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-[10px] font-bold text-slate-400 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Nama Lengkap</label>
                  <input 
                    type="text" required value={formData.studentName}
                    onChange={(e) => setFormData({...formData, studentName: e.target.value})}
                    placeholder="Nama..."
                    className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Kelas</label>
                  <input 
                    type="text" required value={formData.className}
                    onChange={(e) => setFormData({...formData, className: e.target.value})}
                    placeholder="Kelas..."
                    className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Jenis Masalah</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['Pribadi', 'Sosial', 'Belajar', 'Karier'] as const).map((type) => (
                    <button
                      key={type} type="button"
                      onClick={() => setFormData({...formData, problemType: type})}
                      className={`py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border ${
                        formData.problemType === type 
                          ? 'bg-emerald-500 text-white border-emerald-500' 
                          : 'bg-white text-slate-500 border-slate-100 hover:border-emerald-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Deskripsi Masalah</label>
                <textarea 
                  required rows={3} value={formData.problemDescription}
                  onChange={(e) => setFormData({...formData, problemDescription: e.target.value})}
                  placeholder="Ceritakan masalah..."
                  className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
                />
              </div>

              {/* Consultation Schedule Section */}
              <div className="p-3 bg-slate-50 rounded-2xl space-y-3 border border-slate-100">
                <h4 className="text-[9px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-emerald-500" /> Jadwal Konsultasi Diinginkan
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Hari</label>
                    <input 
                      type="text" value={formData.consultationDay}
                      onChange={(e) => setFormData({...formData, consultationDay: e.target.value})}
                      placeholder="Senin, Selasa..."
                      className="w-full bg-white border-none rounded-lg px-3 py-1.5 text-[10px] font-bold text-slate-700 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal</label>
                    <input 
                      type="date" value={formData.consultationDate}
                      onChange={(e) => setFormData({...formData, consultationDate: e.target.value})}
                      className="w-full bg-white border-none rounded-lg px-3 py-1.5 text-[10px] font-bold text-slate-700 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Jam (Opsional)</label>
                    <input 
                      type="time" value={formData.consultationTime}
                      onChange={(e) => setFormData({...formData, consultationTime: e.target.value})}
                      className="w-full bg-white border-none rounded-lg px-3 py-1.5 text-[10px] font-bold text-slate-700 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Tempat (Opsional)</label>
                    <input 
                      type="text" value={formData.consultationPlace}
                      onChange={(e) => setFormData({...formData, consultationPlace: e.target.value})}
                      placeholder="Ruang BK, Perpustakaan..."
                      className="w-full bg-white border-none rounded-lg px-3 py-1.5 text-[10px] font-bold text-slate-700 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Catatan Khusus (Opsional)</label>
                <input 
                  type="text" value={formData.specialNotes}
                  onChange={(e) => setFormData({...formData, specialNotes: e.target.value})}
                  placeholder="Catatan tambahan..."
                  className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button" onClick={() => setIsManualEntryOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  SIMPAN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-rose-500 to-pink-600 text-white">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest">Form Laporan Masalah</h3>
                  <p className="text-[8px] opacity-80 font-bold uppercase tracking-wider">Sampaikan Kendala Anda</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Tanggal Lapor</label>
                  <input type="date" readOnly value={currentTime.date} className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-[10px] font-bold text-slate-400 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Jam Lapor</label>
                  <input type="text" readOnly value={currentTime.time} className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-[10px] font-bold text-slate-400 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Nama Lengkap</label>
                  <input 
                    type="text" required value={formData.studentName}
                    onChange={(e) => setFormData({...formData, studentName: e.target.value})}
                    placeholder="Nama..."
                    className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Kelas</label>
                  <input 
                    type="text" required value={formData.className}
                    onChange={(e) => setFormData({...formData, className: e.target.value})}
                    placeholder="Kelas..."
                    className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Jenis Masalah</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['Pribadi', 'Sosial', 'Belajar', 'Karier'] as const).map((type) => (
                    <button
                      key={type} type="button"
                      onClick={() => setFormData({...formData, problemType: type})}
                      className={`py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border ${
                        formData.problemType === type 
                          ? 'bg-rose-500 text-white border-rose-500' 
                          : 'bg-white text-slate-500 border-slate-100 hover:border-rose-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Deskripsi Masalah</label>
                <textarea 
                  required rows={3} value={formData.problemDescription}
                  onChange={(e) => setFormData({...formData, problemDescription: e.target.value})}
                  placeholder="Ceritakan masalah Anda..."
                  className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-rose-500/20 transition-all resize-none"
                />
              </div>

              {/* Consultation Schedule Section */}
              <div className="p-3 bg-slate-50 rounded-2xl space-y-3 border border-slate-100">
                <h4 className="text-[9px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-rose-500" /> Jadwal Konsultasi Diinginkan
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Hari</label>
                    <input 
                      type="text" value={formData.consultationDay}
                      onChange={(e) => setFormData({...formData, consultationDay: e.target.value})}
                      placeholder="Senin, Selasa..."
                      className="w-full bg-white border-none rounded-lg px-3 py-1.5 text-[10px] font-bold text-slate-700 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal</label>
                    <input 
                      type="date" value={formData.consultationDate}
                      onChange={(e) => setFormData({...formData, consultationDate: e.target.value})}
                      className="w-full bg-white border-none rounded-lg px-3 py-1.5 text-[10px] font-bold text-slate-700 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Jam (Opsional)</label>
                    <input 
                      type="time" value={formData.consultationTime}
                      onChange={(e) => setFormData({...formData, consultationTime: e.target.value})}
                      className="w-full bg-white border-none rounded-lg px-3 py-1.5 text-[10px] font-bold text-slate-700 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Tempat (Opsional)</label>
                    <input 
                      type="text" value={formData.consultationPlace}
                      onChange={(e) => setFormData({...formData, consultationPlace: e.target.value})}
                      placeholder="Ruang BK, Perpustakaan..."
                      className="w-full bg-white border-none rounded-lg px-3 py-1.5 text-[10px] font-bold text-slate-700 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Catatan Khusus (Opsional)</label>
                <input 
                  type="text" value={formData.specialNotes}
                  onChange={(e) => setFormData({...formData, specialNotes: e.target.value})}
                  placeholder="Catatan tambahan..."
                  className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  Kirim & WA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProblemBox;
