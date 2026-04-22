import React, { useState, useMemo } from 'react';
import { ViewMode, Student, Referral, TeacherData } from '../types';
import { ArrowLeft, Plus, Trash2, Search, Share2, CheckCircle2, Clock, FileText, Download, Printer, X, Eye, Building2, UserCheck } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, PageOrientation, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { formatAcademicTitle } from '../src/lib/nameFormatter';

interface ReferralManagementProps {
  setView: (view: ViewMode) => void;
  students: Student[];
  referrals: Referral[];
  onAdd: (r: Referral) => void;
  onDelete: (id: string) => void;
  onUpdate: (r: Referral) => void;
  teacherData: TeacherData;
  showNotification: (message: string, type: 'success' | 'error' | 'loading') => void;
}

const ReferralManagement: React.FC<ReferralManagementProps> = ({ setView, students, referrals, onAdd, onDelete, onUpdate, teacherData, showNotification }) => {
  const [newReferral, setNewReferral] = useState<Omit<Referral, 'id'>>({
    studentId: '',
    date: new Date().toISOString().split('T')[0],
    referredTo: '',
    reason: '',
    status: 'Proses',
    notes: '',
    letterNumber: '',
    targetInstitution: '',
    principalName: teacherData.principalName || '',
    principalNip: teacherData.principalNip || '',
    bkTeacherName: teacherData.name || '',
    bkTeacherNip: teacherData.nip || ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [previewData, setPreviewData] = useState<{ type: 'report' | 'letter', referral: Referral } | null>(null);
  const [showRecapPrintPreview, setShowRecapPrintPreview] = useState(false);

  const uniqueClasses = useMemo(() => Array.from(new Set(students.map(s => s.className))), [students]);
  const studentsInClass = useMemo(() => students.filter(s => s.className === selectedClass), [students, selectedClass]);

  const filteredReferrals = useMemo(() => {
    return referrals.filter(r => {
      const student = students.find(s => s.id === r.studentId);
      const matchesSearch = student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            r.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            r.referredTo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClass = selectedClass ? student?.className === selectedClass : true;
      return matchesSearch && matchesClass;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [referrals, students, searchTerm, selectedClass]);

  const generateRecapReport = async () => {
    if (filteredReferrals.length === 0) {
      showNotification('Tidak ada data referal untuk direkap.', 'error');
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
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Dirujuk Ke", bold: true, size: 24, font: "Times New Roman" })], alignment: AlignmentType.CENTER })], verticalAlign: "center" }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Alasan Rujukan", bold: true, size: 24, font: "Times New Roman" })], alignment: AlignmentType.CENTER })], verticalAlign: "center" }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Status", bold: true, size: 24, font: "Times New Roman" })], alignment: AlignmentType.CENTER })], verticalAlign: "center" }),
        ],
      }),
    ];

    filteredReferrals.forEach((referral, index) => {
      const student = students.find(s => s.id === referral.studentId);
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: (index + 1).toString(), size: 24, font: "Times New Roman" })], alignment: AlignmentType.CENTER })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: new Date(referral.date).toLocaleDateString('id-ID'), size: 24, font: "Times New Roman" })], alignment: AlignmentType.CENTER })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: student?.name || '-', size: 24, font: "Times New Roman" })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: student?.className || '-', size: 24, font: "Times New Roman" })], alignment: AlignmentType.CENTER })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: referral.referredTo, size: 24, font: "Times New Roman" })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: referral.reason, size: 24, font: "Times New Roman" })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: referral.status, size: 24, font: "Times New Roman" })], alignment: AlignmentType.CENTER })] }),
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
              bottom: 1701, // 3cm
              left: 1134,   // 2cm
              right: 1134,  // 2cm
            },
          },
        },
        children: [
          // Kop Surat
          new Paragraph({
            children: [
              new TextRun({ text: (teacherData.govOrFoundation || 'PEMERINTAH DAERAH').toUpperCase(), bold: true, size: 28, font: "Times New Roman" }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: (teacherData.deptOrFoundation || 'DINAS PENDIDIKAN').toUpperCase(), bold: true, size: 28, font: "Times New Roman" }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: (teacherData.school || 'NAMA SEKOLAH').toUpperCase(), bold: true, size: 32, font: "Times New Roman" }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: teacherData.schoolAddress || 'Alamat Lengkap Sekolah', size: 24, font: "Times New Roman" }),
            ],
            alignment: AlignmentType.CENTER,
            border: {
              bottom: { color: "auto", space: 1, style: BorderStyle.SINGLE, size: 12 },
            },
            spacing: { after: 400 }
          }),
          
          // Judul Laporan
          new Paragraph({
            children: [
              new TextRun({ text: "LAPORAN REKAPITULASI RUJUKAN / ALIH TANGAN KASUS", bold: true, size: 24, font: "Times New Roman" }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 400 }
          }),

          // Tabel
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRows,
          }),

          // Tanda Tangan
          new Paragraph({
            children: [
              new TextRun({ text: "", size: 24, font: "Times New Roman" }),
            ],
            spacing: { before: 800 }
          }),
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
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "Mengetahui,", size: 24, font: "Times New Roman" })], alignment: AlignmentType.CENTER }),
                      new Paragraph({ children: [new TextRun({ text: "Kepala Sekolah", size: 24, font: "Times New Roman" })], alignment: AlignmentType.CENTER }),
                      new Paragraph({ children: [new TextRun({ text: "", size: 24, font: "Times New Roman" })], spacing: { before: 800 } }),
                      new Paragraph({ children: [new TextRun({ text: formatAcademicTitle(teacherData.principalName || '(..........................................)'), bold: true, underline: {}, size: 24, font: "Times New Roman" })], alignment: AlignmentType.CENTER }),
                      new Paragraph({ children: [new TextRun({ text: `NIP. ${teacherData.principalNip || '-'}`, size: 24, font: "Times New Roman" })], alignment: AlignmentType.CENTER }),
                    ],
                    width: { size: 50, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: `${teacherData.city || 'Kota'}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, size: 24, font: "Times New Roman" })], alignment: AlignmentType.CENTER }),
                      new Paragraph({ children: [new TextRun({ text: "Guru Bimbingan dan Konseling", size: 24, font: "Times New Roman" })], alignment: AlignmentType.CENTER }),
                      new Paragraph({ children: [new TextRun({ text: "", size: 24, font: "Times New Roman" })], spacing: { before: 800 } }),
                      new Paragraph({ children: [new TextRun({ text: formatAcademicTitle(teacherData.name || '(..........................................)'), bold: true, underline: {}, size: 24, font: "Times New Roman" })], alignment: AlignmentType.CENTER }),
                      new Paragraph({ children: [new TextRun({ text: `NIP. ${teacherData.nip || '-'}`, size: 24, font: "Times New Roman" })], alignment: AlignmentType.CENTER }),
                    ],
                    width: { size: 50, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
            ],
          }),
        ],
      }],
    });

    try {
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `Rekap_Referal_${new Date().toISOString().split('T')[0]}.docx`);
      showNotification('Laporan rekap berhasil diunduh.', 'success');
    } catch (error) {
      console.error('Error generating document:', error);
      showNotification('Gagal membuat laporan rekap.', 'error');
    }
  };

  const handleAdd = () => {
    if (!newReferral.studentId || !newReferral.referredTo || !newReferral.reason) {
      alert('Lengkapi data rujukan.');
      return;
    }
    onAdd({ ...newReferral, id: Date.now().toString() } as Referral);
    setNewReferral({ 
      ...newReferral, 
      studentId: '', 
      referredTo: '', 
      reason: '', 
      notes: '',
      letterNumber: '',
      targetInstitution: ''
    });
  };

  const generatePDF = (type: 'report' | 'letter', referral: Referral) => {
    const doc = new jsPDF();
    const student = students.find(s => s.id === referral.studentId);
    const margin = 20;
    let y = 20;

    // Kop Surat
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(teacherData.govOrFoundation?.toUpperCase() || 'PEMERINTAH KOTA', 105, y, { align: 'center' });
    y += 7;
    doc.text(teacherData.deptOrFoundation?.toUpperCase() || 'DINAS PENDIDIKAN', 105, y, { align: 'center' });
    y += 7;
    doc.setFontSize(16);
    doc.text(teacherData.school?.toUpperCase() || 'NAMA SEKOLAH', 105, y, { align: 'center' });
    y += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(teacherData.schoolAddress || 'Alamat Sekolah', 105, y, { align: 'center' });
    y += 5;
    doc.setLineWidth(0.5);
    doc.line(margin, y, 210 - margin, y);
    y += 1;
    doc.setLineWidth(0.2);
    doc.line(margin, y, 210 - margin, y);
    y += 10;

    if (type === 'report') {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('LAPORAN REFERAL (ALIH TANGAN KASUS)', 105, y, { align: 'center' });
      y += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const data = [
        ['Nama Siswa', `: ${student?.name || '-'}`],
        ['Kelas', `: ${student?.className || '-'}`],
        ['Tanggal Rujukan', `: ${referral.date}`],
        ['Dirujuk Ke', `: ${referral.referredTo}`],
        ['Instansi Tujuan', `: ${referral.targetInstitution || '-'}`],
        ['Alasan Rujukan', `: ${referral.reason}`],
        ['Catatan', `: ${referral.notes || '-'}`],
      ];

      autoTable(doc, {
        startY: y,
        body: data,
        theme: 'plain',
        styles: { fontSize: 11, cellPadding: 2 },
        columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold' } },
        margin: { left: margin }
      });

      y = (doc as any).lastAutoTable.finalY + 20;
    } else {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('SURAT RUJUKAN', 105, y, { align: 'center' });
      y += 6;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Nomor: ${referral.letterNumber || '.../.../...' }`, 105, y, { align: 'center' });
      y += 15;

      doc.text(`Kepada Yth.`, margin, y); y += 6;
      doc.setFont('helvetica', 'bold');
      doc.text(`${referral.referredTo}`, margin, y); y += 6;
      doc.text(`${referral.targetInstitution || 'Instansi Tujuan'}`, margin, y); y += 6;
      doc.setFont('helvetica', 'normal');
      doc.text(`di Tempat`, margin, y); y += 12;

      doc.text('Dengan hormat,', margin, y); y += 10;
      doc.text('Bersama ini kami sampaikan rujukan alih tangan kasus untuk siswa kami:', margin, y); y += 10;

      const studentData = [
        ['Nama', `: ${student?.name || '-'}`],
        ['NIS/NISN', `: ${student?.nis || '-'}/${student?.nisn || '-'}`],
        ['Kelas', `: ${student?.className || '-'}`],
        ['Alamat', `: ${student?.address || '-'}`],
      ];

      autoTable(doc, {
        startY: y,
        body: studentData,
        theme: 'plain',
        styles: { fontSize: 11, cellPadding: 2 },
        columnStyles: { 0: { cellWidth: 40, fontStyle: 'bold' } },
        margin: { left: margin + 10 }
      });

      y = (doc as any).lastAutoTable.finalY + 10;
      doc.text('Adapun alasan rujukan adalah sebagai berikut:', margin, y); y += 8;
      doc.setFont('helvetica', 'italic');
      const splitReason = doc.splitTextToSize(referral.reason, 170);
      doc.text(splitReason, margin + 5, y);
      y += (splitReason.length * 6) + 10;

      doc.setFont('helvetica', 'normal');
      doc.text('Demikian surat rujukan ini kami sampaikan, atas perhatian dan kerjasamanya kami ucapkan terima kasih.', margin, y);
      y += 20;
    }

    // Tanda Tangan
    const dateStr = `${teacherData.city || 'Kota'}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    doc.text(dateStr, 140, y);
    y += 10;

    if (type === 'letter') {
      doc.text('Mengetahui,', margin, y);
      doc.text('Kepala Sekolah,', margin, y + 5);
      doc.text('Guru Pembimbing/BK,', 140, y + 5);
      y += 25;
      doc.setFont('helvetica', 'bold');
      doc.text(referral.principalName || teacherData.principalName || '', margin, y);
      doc.text(referral.bkTeacherName || teacherData.name || '', 140, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.text(`NIP. ${referral.principalNip || teacherData.principalNip || '-'}`, margin, y);
      doc.text(`NIP. ${referral.bkTeacherNip || teacherData.nip || '-'}`, 140, y);
    } else {
      doc.text('Guru Pembimbing/BK,', 140, y);
      y += 25;
      doc.setFont('helvetica', 'bold');
      doc.text(referral.bkTeacherName || teacherData.name || '', 140, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.text(`NIP. ${referral.bkTeacherNip || teacherData.nip || '-'}`, 140, y);
    }

    doc.save(`${type === 'report' ? 'Laporan' : 'Surat'}_Referal_${student?.name || 'Siswa'}.pdf`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-fade-in text-left px-4">
      <div className="flex items-center gap-4">
        <button onClick={() => setView(ViewMode.HOME)} className="p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-100 transition-all shadow-md group">
          <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:-translate-x-1 transition-transform" />
        </button>
        <div className="flex-1">
          <p className="text-blue-500 font-black text-[8px] tracking-widest uppercase">LAYANAN REFERAL</p>
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase leading-none">Alih Tangan <span className="text-blue-500 font-light italic">Kasus</span></h2>
        </div>
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
          <Download className="w-3.5 h-3.5" /> Laporan Rekap Referal
        </button>
      </div>

      <div className="glass-card p-6 rounded-3xl border border-slate-200 backdrop-blur-2xl shadow-xl bg-white/80">
        <h3 className="text-sm font-black text-slate-800 uppercase mb-6 flex items-center gap-2">
          <Share2 className="w-5 h-5 text-blue-500" /> Buat <span className="text-blue-500 italic">Rujukan Baru</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-1">Kelas</label>
            <select 
              value={selectedClass} 
              onChange={e => {
                setSelectedClass(e.target.value);
                setNewReferral({...newReferral, studentId: ''});
              }}
              className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
              <option value="">-- Pilih Kelas --</option>
              {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-1">Siswa</label>
            <select 
              value={newReferral.studentId} 
              onChange={e => setNewReferral({...newReferral, studentId: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              disabled={!selectedClass}
            >
              <option value="">-- Pilih Siswa --</option>
              {studentsInClass.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-1">Dirujuk Ke (Profesi)</label>
            <input 
              type="text" 
              placeholder="Psikolog, Dokter, dll"
              value={newReferral.referredTo} 
              onChange={e => setNewReferral({...newReferral, referredTo: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-1">Instansi Tujuan</label>
            <input 
              type="text" 
              placeholder="Nama RS/Lembaga"
              value={newReferral.targetInstitution} 
              onChange={e => setNewReferral({...newReferral, targetInstitution: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-1">Nomor Surat</label>
            <input 
              type="text" 
              placeholder="001/BK/2024"
              value={newReferral.letterNumber} 
              onChange={e => setNewReferral({...newReferral, letterNumber: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-1">Tanggal</label>
            <input 
              type="date" 
              value={newReferral.date} 
              onChange={e => setNewReferral({...newReferral, date: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div className="space-y-1 md:col-span-2 lg:col-span-2">
            <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-1">Alasan Rujukan</label>
            <textarea 
              rows={1}
              placeholder="Alasan alih tangan kasus..."
              value={newReferral.reason} 
              onChange={e => setNewReferral({...newReferral, reason: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" /> SIMPAN REFERAL
          </button>
        </div>
      </div>

      <div className="glass-card p-6 rounded-3xl border border-slate-200 bg-white/60 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h3 className="text-sm font-black text-slate-800 uppercase">Daftar Alih Tangan Kasus</h3>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari rujukan..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-full py-2 pl-9 pr-4 text-xs outline-none focus:ring-2 focus:ring-blue-500/10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="p-3 text-[9px] font-black uppercase text-slate-400 tracking-widest">Siswa</th>
                <th className="p-3 text-[9px] font-black uppercase text-slate-400 tracking-widest">Kelas</th>
                <th className="p-3 text-[9px] font-black uppercase text-slate-400 tracking-widest">Dirujuk Ke</th>
                <th className="p-3 text-[9px] font-black uppercase text-slate-400 tracking-widest">Instansi Tujuan</th>
                <th className="p-3 text-[9px] font-black uppercase text-slate-400 tracking-widest">Alasan</th>
                <th className="p-3 text-[9px] font-black uppercase text-slate-400 tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredReferrals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 text-xs italic">Belum ada data rujukan.</td>
                </tr>
              ) : (
                filteredReferrals.map(referral => {
                  const student = students.find(s => s.id === referral.studentId);
                  return (
                    <tr key={referral.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-3">
                        <p className="text-xs font-bold text-slate-800">{student?.name || 'Siswa Dihapus'}</p>
                        <p className="text-[8px] font-black text-blue-500 uppercase">{referral.date}</p>
                      </td>
                      <td className="p-3 text-xs font-bold text-slate-800">{student?.className || '-'}</td>
                      <td className="p-3 text-xs font-bold text-blue-600">{referral.referredTo}</td>
                      <td className="p-3 text-xs text-slate-600">{referral.targetInstitution || '-'}</td>
                      <td className="p-3 text-xs text-slate-600">{referral.reason}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => setPreviewData({ type: 'report', referral })}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Preview Laporan"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => setPreviewData({ type: 'letter', referral })}
                            className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                            title="Preview Surat Rujukan"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => generatePDF('report', referral)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Download Laporan"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => onDelete(referral.id)} 
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
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
                <h3 className="text-slate-800 font-black uppercase tracking-widest text-sm">Preview Cetak Rekap Referal</h3>
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
                  <h4 className="font-bold text-lg underline uppercase">LAPORAN REKAPITULASI RUJUKAN / ALIH TANGAN KASUS</h4>
                </div>

                <table className="w-full border-collapse border border-black mb-12">
                  <thead>
                    <tr>
                      <th className="border border-black p-2 text-center">No</th>
                      <th className="border border-black p-2 text-center">Tanggal</th>
                      <th className="border border-black p-2 text-center">Nama Siswa</th>
                      <th className="border border-black p-2 text-center">Kelas</th>
                      <th className="border border-black p-2 text-center">Dirujuk Ke</th>
                      <th className="border border-black p-2 text-center">Instansi Tujuan</th>
                      <th className="border border-black p-2 text-center">Alasan Rujukan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReferrals.map((referral, index) => {
                      const student = students.find(s => s.id === referral.studentId);
                      return (
                        <tr key={referral.id}>
                          <td className="border border-black p-2 text-center">{index + 1}</td>
                          <td className="border border-black p-2 text-center">{new Date(referral.date).toLocaleDateString('id-ID')}</td>
                          <td className="border border-black p-2">{student?.name || '-'}</td>
                          <td className="border border-black p-2 text-center">{student?.className || '-'}</td>
                          <td className="border border-black p-2">{referral.referredTo}</td>
                          <td className="border border-black p-2">{referral.targetInstitution || '-'}</td>
                          <td className="border border-black p-2">{referral.reason}</td>
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

      {/* Preview Modal */}
      {previewData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                Preview {previewData.type === 'report' ? 'Laporan Referal' : 'Surat Rujukan'}
              </h3>
              <button onClick={() => setPreviewData(null)} className="p-2 hover:bg-slate-200 rounded-full transition-all">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 bg-slate-200/30">
              <div className="bg-white shadow-lg mx-auto p-10 min-h-[800px] w-full max-w-[21cm] text-slate-800 text-sm leading-relaxed" style={{ fontFamily: 'serif' }}>
                {/* Header / Kop */}
                <div className="text-center border-b-2 border-slate-800 pb-2 mb-6">
                  <h4 className="text-base font-bold uppercase">{teacherData.govOrFoundation || 'PEMERINTAH KOTA'}</h4>
                  <h4 className="text-base font-bold uppercase">{teacherData.deptOrFoundation || 'DINAS PENDIDIKAN'}</h4>
                  <h3 className="text-lg font-bold uppercase">{teacherData.school || 'NAMA SEKOLAH'}</h3>
                  <p className="text-[10px] italic">{teacherData.schoolAddress || 'Alamat Lengkap Sekolah'}</p>
                </div>

                {previewData.type === 'report' ? (
                  <div className="space-y-6">
                    <h2 className="text-center text-base font-bold underline uppercase">LAPORAN REFERAL (ALIH TANGAN KASUS)</h2>
                    <table className="w-full">
                      <tbody>
                        <tr><td className="w-40 font-bold py-1">Nama Siswa</td><td>: {students.find(s => s.id === previewData.referral.studentId)?.name}</td></tr>
                        <tr><td className="font-bold py-1">Kelas</td><td>: {students.find(s => s.id === previewData.referral.studentId)?.className}</td></tr>
                        <tr><td className="font-bold py-1">Tanggal Rujukan</td><td>: {previewData.referral.date}</td></tr>
                        <tr><td className="font-bold py-1">Dirujuk Ke</td><td>: {previewData.referral.referredTo}</td></tr>
                        <tr><td className="font-bold py-1">Instansi Tujuan</td><td>: {previewData.referral.targetInstitution || '-'}</td></tr>
                        <tr><td className="font-bold py-1 align-top">Alasan Rujukan</td><td className="italic">: {previewData.referral.reason}</td></tr>
                        <tr><td className="font-bold py-1 align-top">Catatan</td><td>: {previewData.referral.notes || '-'}</td></tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-base font-bold underline uppercase">SURAT RUJUKAN</h2>
                      <p className="text-xs">Nomor: {previewData.referral.letterNumber || '.../.../...'}</p>
                    </div>
                    <div className="space-y-1">
                      <p>Kepada Yth.</p>
                      <p className="font-bold">{previewData.referral.referredTo}</p>
                      <p className="font-bold">{previewData.referral.targetInstitution || 'Instansi Tujuan'}</p>
                      <p>di Tempat</p>
                    </div>
                    <p>Dengan hormat,</p>
                    <p>Bersama ini kami sampaikan rujukan alih tangan kasus untuk siswa kami:</p>
                    <table className="w-full ml-6">
                      <tbody>
                        {(() => {
                          const s = students.find(st => st.id === previewData.referral.studentId);
                          return (
                            <>
                              <tr><td className="w-32 font-bold py-0.5">Nama</td><td>: {s?.name}</td></tr>
                              <tr><td className="font-bold py-0.5">NIS/NISN</td><td>: {s?.nis || '-'}/{s?.nisn || '-'}</td></tr>
                              <tr><td className="font-bold py-0.5">Kelas</td><td>: {s?.className}</td></tr>
                              <tr><td className="font-bold py-0.5">Alamat</td><td>: {s?.address || '-'}</td></tr>
                            </>
                          );
                        })()}
                      </tbody>
                    </table>
                    <p>Adapun alasan rujukan adalah sebagai berikut:</p>
                    <p className="italic border-l-4 border-slate-200 pl-4 py-2 bg-slate-50">{previewData.referral.reason}</p>
                    <p>Demikian surat rujukan ini kami sampaikan, atas perhatian dan kerjasamanya kami ucapkan terima kasih.</p>
                  </div>
                )}

                {/* Signatures */}
                <div className="mt-12 flex justify-between">
                  {previewData.type === 'letter' && (
                    <div className="text-center">
                      <p>Mengetahui,</p>
                      <p>Kepala Sekolah</p>
                      <div className="h-20"></div>
                      <p className="font-bold underline">{previewData.referral.principalName || teacherData.principalName || 'Nama Kepala Sekolah'}</p>
                      <p>NIP. {previewData.referral.principalNip || teacherData.principalNip || '-'}</p>
                    </div>
                  )}
                  <div className="text-center ml-auto">
                    <p>{teacherData.city || 'Kota'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <p>Guru Pembimbing/BK</p>
                    <div className="h-20"></div>
                    <p className="font-bold underline">{previewData.referral.bkTeacherName || teacherData.name || 'Nama Guru BK'}</p>
                    <p>NIP. {previewData.referral.bkTeacherNip || teacherData.nip || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button 
                onClick={() => generatePDF(previewData.type, previewData.referral)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg"
              >
                <Download className="w-4 h-4" /> DOWNLOAD PDF
              </button>
              <button 
                onClick={() => setPreviewData(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest"
              >
                TUTUP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralManagement;
