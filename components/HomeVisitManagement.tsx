import React, { useState, useMemo } from 'react';
import { ViewMode, Student, HomeVisit, TeacherData } from '../types';
import { formatAcademicTitle } from '../src/lib/nameFormatter';
import { ArrowLeft, Plus, Trash2, Search, Home, MapPin, FileText, Save, X, Users, Edit2, Eye, Download } from 'lucide-react';
import FormActions from './FormActions';
import { useFormDraft } from '../hooks/useFormDraft';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, PageOrientation, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

interface HomeVisitManagementProps {
  setView: (view: ViewMode) => void;
  onOpenSettings: (tab?: 'profile' | 'report' | 'cloud' | 'backup' | 'firebase' | 'appearance') => void;
  students: Student[];
  visits: HomeVisit[];
  onAdd: (v: HomeVisit, sync?: boolean) => void;
  onUpdate: (v: HomeVisit, sync?: boolean) => void;
  onDelete: (id: string) => void;
  teacherData: TeacherData;
  showNotification: (msg: string, type: 'success' | 'error' | 'loading' | 'info') => void;
}

const HomeVisitManagement: React.FC<HomeVisitManagementProps> = ({ setView, onOpenSettings, students, visits, onAdd, onUpdate, onDelete, teacherData, showNotification }) => {
  const [newVisit, setNewVisit, clearNewVisit] = useFormDraft<Omit<HomeVisit, 'id'>>("draft_home_visit", {
    studentId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    address: '',
    metBy: '',
    familyStatus: '',
    purpose: '',
    result: '',
    followUp: '',
    photo: '',
    status: ''
  });
  const [editingVisitId, setEditingVisitId] = useState<string | null>(null);
  const [printPreviewVisit, setPrintPreviewVisit] = useState<HomeVisit | null>(null);
  const [showRecapPrintPreview, setShowRecapPrintPreview] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStudentId, setFilterStudentId] = useState('');
  const [filterStatus, setFilterStatus] = useState<'Terjadwal' | 'Selesai' | 'Dibatalkan' | ''>('');

  const uniqueClasses = useMemo(() => Array.from(new Set(students.map(s => s.className))), [students]);
  const studentsInClass = useMemo(() => students.filter(s => s.className === selectedClass), [students, selectedClass]);

  const handleSave = (syncOnline: boolean = true) => {
    if (!newVisit.studentId || !newVisit.purpose || !newVisit.result) {
      alert('Lengkapi data kunjungan.');
      return;
    }
    
    if (editingVisitId) {
      onUpdate({ ...newVisit, id: editingVisitId } as HomeVisit, syncOnline);
      setEditingVisitId(null);
    } else {
      onAdd({ ...newVisit, id: Date.now().toString() } as HomeVisit, syncOnline);
    }
    
    clearNewVisit();
    setSelectedClass('');
  };

  const handleEdit = (visit: HomeVisit) => {
    const student = students.find(s => s.id === visit.studentId);
    if (student) {
      setSelectedClass(student.className);
    }
    setNewVisit({ ...visit });
    setEditingVisitId(visit.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdd = () => {
    handleSave(true);
  };

  const filteredVisits = useMemo(() => {
    return visits.filter(v => {
      const student = students.find(s => s.id === v.studentId);
      const matchesSearch = student?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            v.purpose.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate = filterDate ? v.date === filterDate : true;
      const matchesStudent = filterStudentId ? v.studentId === filterStudentId : true;
      const matchesStatus = filterStatus ? v.status === filterStatus : true;
      return matchesSearch && matchesDate && matchesStudent && matchesStatus;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [visits, students, searchTerm, filterDate, filterStudentId, filterStatus]);

  const generateRecapReport = async () => {
    if (filteredVisits.length === 0) {
      showNotification('Tidak ada data kunjungan rumah untuk direkap.', 'error');
      return;
    }

    showNotification('Sedang membuat laporan rekap...', 'loading');

    const tableRows = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "No", bold: true, size: 24, font: "Times New Roman" })], alignment: AlignmentType.CENTER })], verticalAlign: "center" }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Tanggal", bold: true, size: 24, font: "Times New Roman" })], alignment: AlignmentType.CENTER })], verticalAlign: "center" }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Nama Siswa", bold: true, size: 24, font: "Times New Roman" })], alignment: AlignmentType.CENTER })], verticalAlign: "center" }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Kelas", bold: true, size: 24, font: "Times New Roman" })], alignment: AlignmentType.CENTER })], verticalAlign: "center" }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Tujuan Kunjungan", bold: true, size: 24, font: "Times New Roman" })], alignment: AlignmentType.CENTER })], verticalAlign: "center" }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Hasil Kunjungan & Kesepakatan", bold: true, size: 24, font: "Times New Roman" })], alignment: AlignmentType.CENTER })], verticalAlign: "center" }),
        ],
      }),
    ];

    filteredVisits.forEach((visit, index) => {
      const student = students.find(s => s.id === visit.studentId);
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: (index + 1).toString(), size: 24, font: "Times New Roman" })], alignment: AlignmentType.CENTER })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: new Date(visit.date).toLocaleDateString('id-ID'), size: 24, font: "Times New Roman" })], alignment: AlignmentType.CENTER })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: student?.name || '-', size: 24, font: "Times New Roman" })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: student?.className || '-', size: 24, font: "Times New Roman" })], alignment: AlignmentType.CENTER })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: visit.purpose, size: 24, font: "Times New Roman" })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: visit.result, size: 24, font: "Times New Roman" })] })] }),
          ],
        })
      );
    });

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
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: teacherData.govOrFoundation?.toUpperCase() || "PEMERINTAH DAERAH", bold: true, size: 28, font: "Times New Roman" }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: teacherData.deptOrFoundation?.toUpperCase() || "DINAS PENDIDIKAN", bold: true, size: 28, font: "Times New Roman" }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: teacherData.school?.toUpperCase() || "NAMA SEKOLAH", bold: true, size: 32, font: "Times New Roman" }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: teacherData.schoolAddress || "Alamat Lengkap Sekolah", size: 24, font: "Times New Roman" }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "________________________________________________________________________________________________________________________________________________________________", bold: true, size: 24, font: "Times New Roman" }),
            ],
            spacing: { after: 400 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "LAPORAN REKAPITULASI KUNJUNGAN RUMAH (HOME VISIT)", bold: true, size: 24, font: "Times New Roman" }),
            ],
            spacing: { after: 400 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRows,
          }),
          new Paragraph({ text: "", spacing: { before: 800 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "Mengetahui,", size: 24, font: "Times New Roman" })], alignment: AlignmentType.CENTER }),
                      new Paragraph({ children: [new TextRun({ text: "Kepala Sekolah", size: 24, font: "Times New Roman" })], alignment: AlignmentType.CENTER }),
                      new Paragraph({ text: "", spacing: { before: 800 } }),
                      new Paragraph({ children: [new TextRun({ text: teacherData.principalName || "(...................................)", bold: true, size: 24, font: "Times New Roman", underline: {} })], alignment: AlignmentType.CENTER }),
                      new Paragraph({ children: [new TextRun({ text: `NIP. ${teacherData.principalNip || "..................................."}`, size: 24, font: "Times New Roman" })], alignment: AlignmentType.CENTER }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: `${teacherData.city || "Kota"}, ${new Date().toLocaleDateString('id-ID', {day:'2-digit', month:'long', year:'numeric'})}`, size: 24, font: "Times New Roman" })], alignment: AlignmentType.CENTER }),
                      new Paragraph({ children: [new TextRun({ text: "Guru Bimbingan dan Konseling", size: 24, font: "Times New Roman" })], alignment: AlignmentType.CENTER }),
                      new Paragraph({ text: "", spacing: { before: 800 } }),
                      new Paragraph({ children: [new TextRun({ text: formatAcademicTitle(teacherData.name) || "(...................................)", bold: true, size: 24, font: "Times New Roman", underline: {} })], alignment: AlignmentType.CENTER }),
                      new Paragraph({ children: [new TextRun({ text: `NIP. ${teacherData.nip || "..................................."}`, size: 24, font: "Times New Roman" })], alignment: AlignmentType.CENTER }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }],
    });

    Packer.toBlob(doc).then(blob => {
      saveAs(blob, `Rekap_Home_Visit_${new Date().getTime()}.docx`);
      showNotification('Laporan berhasil diunduh!', 'success');
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-fade-in text-left">
      <div className="flex items-center gap-3 px-4">
        <button onClick={() => setView(ViewMode.HOME)} className="p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-100 transition-all shadow-lg group">
          <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-1 transition-transform" />
        </button>
        <div className="flex-1">
          <p className="label-luxe text-blue-500 font-black text-[7px]">LAYANAN RESPONSIF</p>
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase leading-none">Home <span className="text-blue-500 font-light italic">Visit</span></h2>
        </div>
        <button 
          onClick={() => setView(ViewMode.HOME_VISIT_INPUT)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 border border-blue-500/30 rounded-xl text-white font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl"
        >
          <Plus className="w-3.5 h-3.5" /> Tambah Kunjungan
        </button>
        <button 
          onClick={() => setShowRecapPrintPreview(true)}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 border border-amber-500/30 rounded-xl text-white font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl"
        >
          <Eye className="w-3.5 h-3.5" /> Preview Cetak
        </button>
        <button 
          onClick={generateRecapReport}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/30 rounded-xl text-white font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl"
        >
          <Download className="w-3.5 h-3.5" /> Laporan Rekap Home Visit
        </button>
        <button 
          onClick={() => onOpenSettings('report')}
          className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-xl text-indigo-400 font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl"
        >
          <FileText className="w-3.5 h-3.5" /> Atur Kop Surat
        </button>
      </div>

      <div className="glass-card p-4 rounded-3xl border border-slate-200 mx-4 backdrop-blur-2xl shadow-3xl">
        <h3 className="text-base font-black text-slate-800 uppercase mb-4 flex items-center gap-3" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          <Home className="w-4 h-4 text-blue-500" /> {editingVisitId ? 'Edit' : 'Dokumentasi'} <span className="text-blue-500 italic">Kunjungan Rumah</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="flex gap-2">
            <div className="w-1/3 space-y-1">
              <label className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Kelas</label>
              <select 
                value={selectedClass} 
                onChange={e => {
                  setSelectedClass(e.target.value);
                  const firstStudent = students.find(s => s.className === e.target.value);
                  setNewVisit({...newVisit, studentId: '', address: firstStudent?.address || ''});
                }}
                className="w-full input-cyber p-2 text-[9px] rounded-xl outline-none"
              >
                <option value="">-- Pilih Kelas --</option>
                {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Siswa</label>
              <select 
                value={newVisit.studentId} 
                onChange={e => {
                  const student = students.find(s => s.id === e.target.value);
                  setNewVisit({...newVisit, studentId: e.target.value, address: student?.address || ''});
                }}
                className="w-full input-cyber p-2 text-[9px] rounded-xl outline-none"
                disabled={!selectedClass}
              >
                <option value="">-- Pilih Siswa --</option>
                {studentsInClass.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Tanggal</label>
            <input 
              type="date" 
              value={newVisit.date} 
              onChange={e => setNewVisit({...newVisit, date: e.target.value})}
              className="w-full input-cyber p-2 text-[9px] rounded-xl outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Waktu (Dari - Sampai)</label>
            <div className="flex items-center gap-2">
              <input 
                type="time" 
                value={newVisit.startTime} 
                onChange={e => setNewVisit({...newVisit, startTime: e.target.value})}
                className="w-full input-cyber p-2 text-[9px] rounded-xl outline-none"
              />
              <span className="text-slate-500 font-bold">-</span>
              <input 
                type="time" 
                value={newVisit.endTime} 
                onChange={e => setNewVisit({...newVisit, endTime: e.target.value})}
                className="w-full input-cyber p-2 text-[9px] rounded-xl outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Status Kunjungan</label>
            <select 
              value={newVisit.status || ''} 
              onChange={e => setNewVisit({...newVisit, status: e.target.value as any})}
              className="w-full input-cyber p-2 text-[9px] rounded-xl outline-none"
            >
              <option value="">-- Pilih Status --</option>
              <option value="Terjadwal">Terjadwal</option>
              <option value="Selesai">Selesai</option>
              <option value="Dibatalkan">Dibatalkan</option>
            </select>
          </div>
          <div className="space-y-1 md:col-span-1 lg:col-span-2">
            <label className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Alamat Kunjungan</label>
            <textarea 
              rows={1}
              placeholder="Alamat lengkap lokasi kunjungan..."
              value={newVisit.address} 
              onChange={e => setNewVisit({...newVisit, address: e.target.value})}
              className="w-full input-cyber p-2 text-[9px] rounded-xl outline-none leading-relaxed"
            />
          </div>

          <div className="space-y-1 md:col-span-2 lg:col-span-3">
            <label className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1 flex items-center gap-2">
              <MapPin className="w-3 h-3 text-blue-500" /> Peta Rumah (Otomatis)
            </label>
            <div className="w-full h-[180px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 relative group shadow-inner">
              {newVisit.address ? (
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(newVisit.address)}&output=embed`}
                  allowFullScreen
                  title="Peta Rumah"
                ></iframe>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <MapPin className="w-8 h-8 opacity-20" />
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Masukkan alamat untuk melihat peta</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Ditemui Oleh</label>
            <input 
              type="text" 
              placeholder="Nama orang yang ditemui..."
              value={newVisit.metBy} 
              onChange={e => setNewVisit({...newVisit, metBy: e.target.value})}
              className="w-full input-cyber p-2 text-[9px] rounded-xl outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Status Keluarga</label>
            <select 
              value={newVisit.familyStatus} 
              onChange={e => setNewVisit({...newVisit, familyStatus: e.target.value as any})}
              className="w-full input-cyber p-2 text-[9px] rounded-xl outline-none"
            >
              <option value="">-- Pilih Status --</option>
              <option value="Ayah dan Ibu">Ayah dan Ibu</option>
              <option value="Ayah">Ayah</option>
              <option value="Ibu">Ibu</option>
              <option value="Kakak">Kakak</option>
              <option value="Saudara">Saudara</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Tujuan Kunjungan</label>
            <input 
              type="text" 
              placeholder="Contoh: Konfirmasi ketidakhadiran..."
              value={newVisit.purpose} 
              onChange={e => setNewVisit({...newVisit, purpose: e.target.value})}
              className="w-full input-cyber p-2 text-[9px] rounded-xl outline-none"
            />
          </div>
          <div className="space-y-1 md:col-span-2 lg:col-span-3">
            <label className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Hasil Kunjungan & Kesepakatan</label>
            <textarea 
              rows={2}
              placeholder="Tuliskan hasil diskusi dengan orang tua..."
              value={newVisit.result} 
              onChange={e => setNewVisit({...newVisit, result: e.target.value})}
              className="w-full input-cyber p-2 text-[9px] rounded-xl outline-none leading-relaxed"
            />
          </div>
        </div>
        <FormActions 
          onSaveLocal={() => handleSave(false)}
          onSaveOnline={() => handleSave(true)}
          saveLabel={editingVisitId ? "UPDATE" : "SIMPAN"}
          onCancel={() => { 
            setNewVisit({
              studentId: '', date: new Date().toISOString().split('T')[0], startTime: '', endTime: '', address: '', metBy: '', familyStatus: '', purpose: '', result: '', followUp: '', photo: '', status: ''
            }); 
            setSelectedClass(''); 
            setEditingVisitId(null);
          }}
          onClose={() => { 
            setNewVisit({
              studentId: '', date: new Date().toISOString().split('T')[0], startTime: '', endTime: '', address: '', metBy: '', familyStatus: '', purpose: '', result: '', followUp: '', photo: '', status: ''
            }); 
            setSelectedClass(''); 
            setEditingVisitId(null);
          }}
        />
      </div>

      <div className="glass-card p-6 rounded-3xl border border-slate-200 mx-4 bg-white overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 px-2">
          <h3 className="text-base font-black text-slate-800 uppercase tracking-widest">Riwayat Home Visit</h3>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <input 
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="input-cyber rounded-full py-2 px-4 text-[10px] outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
            />
            <select
              value={filterStudentId}
              onChange={e => setFilterStudentId(e.target.value)}
              className="input-cyber rounded-full py-2 px-4 text-[10px] outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
            >
              <option value="">-- Semua Siswa --</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
              className="input-cyber rounded-full py-2 px-4 text-[10px] outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
            >
              <option value="">-- Semua Status --</option>
              <option value="Terjadwal">Terjadwal</option>
              <option value="Selesai">Selesai</option>
              <option value="Dibatalkan">Dibatalkan</option>
            </select>
            <div className="relative w-full md:w-56">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-500" />
              <input 
                type="text" 
                placeholder="Cari laporan..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full input-cyber rounded-full py-2 pl-10 pr-4 text-[10px] outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="p-3 text-[8px] font-black uppercase tracking-widest text-slate-500">No</th>
                <th className="p-3 text-[8px] font-black uppercase tracking-widest text-slate-500">Tanggal & Waktu</th>
                <th className="p-3 text-[8px] font-black uppercase tracking-widest text-slate-500">Siswa</th>
                <th className="p-3 text-[8px] font-black uppercase tracking-widest text-slate-500">Kelas</th>
                <th className="p-3 text-[8px] font-black uppercase tracking-widest text-slate-500">Tujuan</th>
                <th className="p-3 text-[8px] font-black uppercase tracking-widest text-slate-500">Hasil Kunjungan & Kesepakatan</th>
                <th className="p-3 text-[8px] font-black uppercase tracking-widest text-slate-500 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredVisits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500 font-medium italic text-xs">Belum ada data home visit.</td>
                </tr>
              ) : (
                filteredVisits.map((visit, idx) => {
                  const student = students.find(s => s.id === visit.studentId);
                  return (
                    <tr key={visit.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-3 text-[10px] font-bold text-slate-500">{idx + 1}</td>
                      <td className="p-3">
                        <div className="text-[10px] font-bold text-slate-800">{visit.date}</div>
                        <div className="text-[8px] text-slate-500">{visit.startTime} - {visit.endTime}</div>
                      </td>
                      <td className="p-3 text-[10px] font-bold text-slate-800">{student?.name}</td>
                      <td className="p-3 text-[10px] font-bold text-blue-500">{student?.className}</td>
                      <td className="p-3 text-[10px] text-slate-500 truncate max-w-[150px]">{visit.purpose}</td>
                      <td className="p-3 text-[9px] text-slate-500 truncate max-w-[200px]">{visit.result}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            onClick={() => setPrintPreviewVisit(visit)}
                            className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"
                            title="Preview"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleEdit(visit)}
                            className="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition-all"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => onDelete(visit.id)}
                            className="p-1.5 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Recap Print Preview Modal */}
      {showRecapPrintPreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-6xl h-[90vh] rounded-[2rem] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 bg-white flex justify-between items-center border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500">
                  <Eye className="w-5 h-5" />
                </div>
                <h3 className="text-slate-800 font-black uppercase tracking-widest text-sm">Preview Cetak Rekap Home Visit</h3>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    setShowRecapPrintPreview(false);
                    generateRecapReport();
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
                <button 
                  onClick={() => setShowRecapPrintPreview(false)} 
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-slate-100 p-8 flex justify-center">
              {/* Actual Report Layout for Preview */}
              <div id="preview-recap-printable" className="bg-white w-[356mm] min-h-[216mm] p-[20mm] pb-[30mm] shadow-xl text-black" style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '12pt' }}>
                {/* Header / Kop */}
                <div className="border-b-[3px] border-double border-black pb-4 mb-8 flex items-center gap-4">
                  {teacherData.logoGov ? (
                    <img src={teacherData.logoGov} alt="Logo Pemda" className="w-24 h-24 object-contain" />
                  ) : (
                    <div className="w-24 h-24 bg-slate-100 flex items-center justify-center text-[8px] text-slate-500 border border-dashed border-slate-300">Logo Pemda</div>
                  )}
                  <div className="flex-1 text-center space-y-1">
                    <h1 className="text-xl font-bold uppercase tracking-wide">{teacherData.govOrFoundation || 'PEMERINTAH DAERAH'}</h1>
                    <h2 className="text-xl font-bold uppercase tracking-wide">{teacherData.deptOrFoundation || 'DINAS PENDIDIKAN'}</h2>
                    <h3 className="text-2xl font-black uppercase tracking-widest">{teacherData.school || 'NAMA SEKOLAH'}</h3>
                    <p className="text-sm">{teacherData.schoolAddress || 'Alamat Lengkap Sekolah'}</p>
                  </div>
                  {teacherData.logoSchool ? (
                    <img src={teacherData.logoSchool} alt="Logo Sekolah" className="w-24 h-24 object-contain" />
                  ) : (
                    <div className="w-24 h-24 bg-slate-100 flex items-center justify-center text-[8px] text-slate-500 border border-dashed border-slate-300">Logo Sekolah</div>
                  )}
                </div>

                <div className="text-center mb-8">
                  <h4 className="font-bold text-lg underline uppercase">LAPORAN REKAPITULASI KUNJUNGAN RUMAH (HOME VISIT)</h4>
                </div>

                <table className="w-full border-collapse border border-black mb-12">
                  <thead>
                    <tr>
                      <th className="border border-black p-2 text-center">No</th>
                      <th className="border border-black p-2 text-center">Tanggal</th>
                      <th className="border border-black p-2 text-center">Nama Siswa</th>
                      <th className="border border-black p-2 text-center">Kelas</th>
                      <th className="border border-black p-2 text-center">Tujuan Kunjungan</th>
                      <th className="border border-black p-2 text-center">Hasil Kunjungan & Kesepakatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVisits.map((visit, index) => {
                      const student = students.find(s => s.id === visit.studentId);
                      return (
                        <tr key={visit.id}>
                          <td className="border border-black p-2 text-center">{index + 1}</td>
                          <td className="border border-black p-2 text-center">{new Date(visit.date).toLocaleDateString('id-ID')}</td>
                          <td className="border border-black p-2">{student?.name || '-'}</td>
                          <td className="border border-black p-2 text-center">{student?.className || '-'}</td>
                          <td className="border border-black p-2">{visit.purpose}</td>
                          <td className="border border-black p-2">{visit.result}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Signatures */}
                <div className="mt-16 grid grid-cols-2 gap-20 text-base">
                  <div className="text-center space-y-24">
                    <p>Mengetahui,<br/>Kepala Sekolah</p>
                    <div className="space-y-1">
                      <p className="font-bold underline">{formatAcademicTitle(teacherData.principalName || '(..........................................)')}</p>
                      <p>NIP. {teacherData.principalNip || '-'}</p>
                    </div>
                  </div>
                  <div className="text-center space-y-24">
                    <p>{teacherData.city || 'Kota'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>Guru Bimbingan dan Konseling</p>
                    <div className="space-y-1">
                      <p className="font-bold underline">{formatAcademicTitle(teacherData.name || '(..........................................)')}</p>
                      <p>NIP. {teacherData.nip || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {printPreviewVisit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-4xl h-[90vh] rounded-[2rem] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 bg-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                  <Eye className="w-5 h-5" />
                </div>
                <h3 className="text-slate-800 font-black uppercase tracking-widest text-sm">Preview Laporan Home Visit</h3>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setPrintPreviewVisit(null)} 
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-slate-100 p-12 flex justify-center">
              {/* Actual Report Layout for Preview */}
              <div id="preview-printable-report" className="bg-white w-[210mm] min-h-[297mm] p-[20mm] shadow-xl text-black font-serif">
                {/* Header / Kop */}
                <div className="border-b-4 border-double border-black pb-4 mb-8 flex items-center gap-4">
                  {teacherData.logoGov ? (
                    <img src={teacherData.logoGov} alt="Logo Pemda" className="w-20 h-20 object-contain" />
                  ) : (
                    <div className="w-20 h-20 bg-slate-100 flex items-center justify-center text-[8px] text-slate-500 border border-dashed border-slate-300">Logo Pemda</div>
                  )}
                  <div className="flex-1 text-center">
                    <h1 className="text-lg font-bold uppercase leading-tight">{teacherData.govOrFoundation?.trim() || 'PEMERINTAH KOTA / YAYASAN'}</h1>
                    <h2 className="text-base font-bold uppercase leading-tight">{teacherData.deptOrFoundation?.trim() || 'DINAS PENDIDIKAN'}</h2>
                    <h3 className="text-xl font-black uppercase leading-tight tracking-tighter">{teacherData.school?.trim() || 'NAMA SEKOLAH'}</h3>
                    <p className="text-[10px] italic mt-1 leading-tight">{teacherData.schoolAddress?.trim() || 'Alamat Lengkap Sekolah'}</p>
                  </div>
                  {teacherData.logoSchool ? (
                    <img src={teacherData.logoSchool} alt="Logo Sekolah" className="w-20 h-20 object-contain" />
                  ) : (
                    <div className="w-20 h-20 bg-slate-100 flex items-center justify-center text-[8px] text-slate-500 border border-dashed border-slate-300">Logo Sekolah</div>
                  )}
                </div>

                <div className="text-center mb-10">
                  <h4 className="text-lg font-bold uppercase underline decoration-2 underline-offset-4">LAPORAN KUNJUNGAN RUMAH (HOME VISIT)</h4>
                  <p className="text-sm font-bold mt-1">Tahun Pelajaran: {teacherData.academicYear || '-'}</p>
                </div>

                <div className="space-y-6 text-sm">
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr>
                        <td className="w-40 py-2 font-bold">Nama Siswa</td>
                        <td className="w-4 py-2">:</td>
                        <td className="py-2">{students.find(s => s.id === printPreviewVisit.studentId)?.name}</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-bold">Kelas</td>
                        <td className="py-2">:</td>
                        <td className="py-2">{students.find(s => s.id === printPreviewVisit.studentId)?.className}</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-bold">Hari / Tanggal</td>
                        <td className="py-2">:</td>
                        <td className="py-2">{printPreviewVisit.date}</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-bold">Waktu</td>
                        <td className="py-2">:</td>
                        <td className="py-2">{printPreviewVisit.startTime} s.d {printPreviewVisit.endTime} WIB</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-bold">Alamat Lokasi</td>
                        <td className="py-2">:</td>
                        <td className="py-2">{printPreviewVisit.address || '-'}</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-bold">Ditemui Oleh</td>
                        <td className="py-2">:</td>
                        <td className="py-2">{printPreviewVisit.metBy} ({printPreviewVisit.familyStatus})</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <p className="font-bold underline">I. TUJUAN KUNJUNGAN:</p>
                      <p className="pl-4 leading-relaxed">{printPreviewVisit.purpose}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="font-bold underline">II. HASIL KUNJUNGAN & KESEPAKATAN:</p>
                      <p className="pl-4 leading-relaxed whitespace-pre-wrap">{printPreviewVisit.result}</p>
                    </div>

                    <div className="space-y-2">
                      <p className="font-bold underline">III. TINDAK LANJUT:</p>
                      <p className="pl-4 leading-relaxed">{printPreviewVisit.followUp || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Signatures */}
                <div className="mt-20 grid grid-cols-2 gap-20 text-sm">
                  <div className="text-center space-y-20">
                    <p>Mengetahui,<br/>Kepala Sekolah</p>
                    <div className="space-y-1">
                      <p className="font-bold underline font-arial">{formatAcademicTitle(teacherData.principalName || '(..........................................)')}</p>
                      <p>NIP. {teacherData.principalNip || '-'}</p>
                    </div>
                  </div>
                  <div className="text-center space-y-20">
                    <p>{teacherData.city || 'Kota'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>Guru Pembimbing / BK</p>
                    <div className="space-y-1">
                      <p className="font-bold underline font-arial">{formatAcademicTitle(teacherData.name || '(..........................................)')}</p>
                      <p>NIP. {teacherData.nip || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Print Content removed */}
    </div>
  );
};

export default HomeVisitManagement;
