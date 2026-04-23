import React, { useState, useMemo } from 'react';
import { ViewMode, Student, CounselingLog, EventLog, Violation, Achievement, TeacherData, DailyJournal, HomeVisit } from '../types';
import { formatAcademicTitle } from '../src/lib/nameFormatter';
import { ArrowLeft, User, Calendar, FileText, BarChart2, Download, Loader2, CheckCircle2, AlertCircle, Users, TableProperties } from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

interface AutomatedReportsProps {
  setView: (view: ViewMode) => void;
  students: Student[];
  counselingLogs: CounselingLog[];
  eventLogs: EventLog[];
  violations: Violation[];
  achievements: Achievement[];
  dailyJournals: DailyJournal[];
  homeVisits: HomeVisit[];
  teacherData: TeacherData;
  showNotification: (msg: string, type: 'success' | 'error' | 'info' | 'loading') => void;
}

const AutomatedReports: React.FC<AutomatedReportsProps> = ({ 
  setView, 
  students, 
  counselingLogs, 
  eventLogs, 
  violations, 
  achievements, 
  dailyJournals,
  homeVisits,
  teacherData,
  showNotification
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [generatedReport, setGeneratedReport] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateStudentReport = async () => {
    if (!selectedStudentId) {
      showNotification('Silakan pilih siswa terlebih dahulu.', 'error');
      return;
    }
    
    setIsGenerating(true);
    showNotification('Sedang menyusun laporan...', 'loading');
    
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const student = students.find(s => s.id === selectedStudentId);
    if (!student) {
      setIsGenerating(false);
      return;
    }

    const studentLogs = counselingLogs.filter(l => l.studentId === student.id);
    const studentEvents = eventLogs.filter(l => l.studentId === student.id);
    const studentViolations = violations.filter(l => l.studentId === student.id);
    const studentAchievements = achievements.filter(l => l.studentId === student.id);

    const reportData = {
      type: 'student',
      title: `Laporan Kemajuan Siswa: ${student.name}`,
      student,
      stats: {
        counseling: studentLogs.length,
        events: studentEvents.length,
        violations: studentViolations.length,
        achievements: studentAchievements.length
      },
      details: {
        logs: studentLogs,
        events: studentEvents,
        violations: studentViolations,
        achievements: studentAchievements
      }
    };

    setGeneratedReport(reportData);
    setIsGenerating(false);
    showNotification('Laporan berhasil disusun!', 'success');
  };

  const handleGenerateWeeklySummary = async () => {
    if (!selectedWeek) {
      showNotification('Silakan pilih minggu terlebih dahulu.', 'error');
      return;
    }
    
    setIsGenerating(true);
    showNotification('Sedang menyusun ringkasan...', 'loading');
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    const getWeekDateRange = (weekString: string) => {
      const [year, week] = weekString.split('-W').map(Number);
      const date = new Date(year, 0, 1 + (week - 1) * 7);
      const day = date.getDay();
      const startDate = new Date(date);
      startDate.setDate(date.getDate() - day + (day === 0 ? -6 : 1)); // Monday
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6); // Sunday
      endDate.setHours(23, 59, 59, 999);
      return { startDate, endDate };
    };

    const { startDate, endDate } = getWeekDateRange(selectedWeek);

    const isWithinWeek = (dateStr: string) => {
      const d = new Date(dateStr);
      return d >= startDate && d <= endDate;
    };

    const weeklyCounseling = counselingLogs.filter(l => isWithinWeek(l.date));
    const weeklyEvents = eventLogs.filter(l => isWithinWeek(l.date));
    const weeklyViolations = violations.filter(l => isWithinWeek(l.date));
    const weeklyAchievements = achievements.filter(l => isWithinWeek(l.date));
    const weeklyJournals = dailyJournals.filter(l => isWithinWeek(l.date));
    const weeklyHomeVisits = homeVisits.filter(l => isWithinWeek(l.date));

    const reportData = {
      type: 'weekly',
      title: `Laporan Mingguan Bimbingan dan Konseling`,
      week: selectedWeek,
      dateRange: `${startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} - ${endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      stats: {
        totalCounseling: weeklyCounseling.length,
        totalEvents: weeklyEvents.length,
        totalViolations: weeklyViolations.length,
        totalAchievements: weeklyAchievements.length,
        totalJournals: weeklyJournals.length,
        totalHomeVisits: weeklyHomeVisits.length
      },
      details: {
        counseling: weeklyCounseling,
        events: weeklyEvents,
        violations: weeklyViolations,
        achievements: weeklyAchievements,
        journals: weeklyJournals,
        homeVisits: weeklyHomeVisits
      }
    };

    setGeneratedReport(reportData);
    setIsGenerating(false);
    showNotification('Laporan mingguan berhasil disusun!', 'success');
  };

  const downloadAsDocx = () => {
    if (!generatedReport) return;

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children: [
          // Kop Surat (Letterhead)
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: teacherData.govOrFoundation?.toUpperCase() || "PEMERINTAH DAERAH", bold: true, size: 24 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: teacherData.deptOrFoundation?.toUpperCase() || "DINAS PENDIDIKAN", bold: true, size: 24 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: teacherData.school?.toUpperCase() || "NAMA SEKOLAH", bold: true, size: 28 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: teacherData.schoolAddress || "Alamat Lengkap Sekolah", italics: true, size: 18 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "________________________________________________________________________________", bold: true }),
            ],
            spacing: { after: 200 },
          }),

          // Judul Laporan
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: generatedReport.title.toUpperCase(), bold: true, underline: {}, size: 28 }),
            ],
            spacing: { before: 200, after: 400 },
          }),
          
          ...(generatedReport.type === 'student' ? [
            new Paragraph({
              children: [
                new TextRun({ text: `Nama Siswa: `, bold: true }),
                new TextRun({ text: generatedReport.student.name }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Kelas: `, bold: true }),
                new TextRun({ text: generatedReport.student.className }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Tahun Pelajaran: `, bold: true }),
                new TextRun({ text: teacherData.academicYear }),
              ],
            }),
            new Paragraph({ text: "", spacing: { before: 200 } }),
            new Paragraph({ text: "RINGKASAN STATISTIK", heading: HeadingLevel.HEADING_3 }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Kategori", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Jumlah", bold: true })] })] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: "Sesi Konseling" })] }),
                    new TableCell({ children: [new Paragraph({ text: generatedReport.stats.counseling.toString() })] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: "Catatan Anekdot" })] }),
                    new TableCell({ children: [new Paragraph({ text: generatedReport.stats.events.toString() })] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: "Pelanggaran" })] }),
                    new TableCell({ children: [new Paragraph({ text: generatedReport.stats.violations.toString() })] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: "Prestasi" })] }),
                    new TableCell({ children: [new Paragraph({ text: generatedReport.stats.achievements.toString() })] }),
                  ],
                }),
              ],
            }),
          ] : [
            new Paragraph({
              children: [
                new TextRun({ text: `Periode: `, bold: true }),
                new TextRun({ text: generatedReport.dateRange }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Tahun Pelajaran: `, bold: true }),
                new TextRun({ text: teacherData.academicYear }),
              ],
            }),
            new Paragraph({ text: "", spacing: { before: 200 } }),
            new Paragraph({ text: "RINGKASAN AKTIVITAS", heading: HeadingLevel.HEADING_3 }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Kategori", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Jumlah", bold: true })] })] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: "Jurnal Kegiatan Harian" })] }),
                    new TableCell({ children: [new Paragraph({ text: generatedReport.stats.totalJournals.toString() })] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: "Sesi Konseling" })] }),
                    new TableCell({ children: [new Paragraph({ text: generatedReport.stats.totalCounseling.toString() })] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: "Kunjungan Rumah" })] }),
                    new TableCell({ children: [new Paragraph({ text: generatedReport.stats.totalHomeVisits.toString() })] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: "Catatan Anekdot" })] }),
                    new TableCell({ children: [new Paragraph({ text: generatedReport.stats.totalEvents.toString() })] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: "Pelanggaran" })] }),
                    new TableCell({ children: [new Paragraph({ text: generatedReport.stats.totalViolations.toString() })] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: "Prestasi" })] }),
                    new TableCell({ children: [new Paragraph({ text: generatedReport.stats.totalAchievements.toString() })] }),
                  ],
                }),
              ],
            }),
          ]),

          // Tanda Tangan
          new Paragraph({ text: "", spacing: { before: 800 } }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: `${teacherData.city || "Kota"}, ${new Date().toLocaleDateString('id-ID', {day:'2-digit', month:'long', year:'numeric'})}` }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: "Guru Bimbingan dan Konseling", bold: true }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: "" }),
            ],
            spacing: { before: 1000 },
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: formatAcademicTitle(teacherData.name), bold: true, underline: {}, font: "Arial" }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: `NIP. ${teacherData.nip || "-"}` }),
            ],
          }),
        ],
      }],
    });

    Packer.toBlob(doc).then(blob => {
      saveAs(blob, `${generatedReport.title}.docx`);
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-fade-in text-left px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => setView(ViewMode.HOME)} className="p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-all group shadow-md">
            <ArrowLeft className="w-5 h-5 text-primary group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <p className="label-luxe text-primary font-black text-[7px]">ANALITIK & LAPORAN</p>
            <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">Laporan <span className="text-primary font-light italic">Otomatis</span></h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Student Progress Report Section */}
        <div className="glass-card p-4 rounded-2xl border border-primary/10 bg-white shadow-lg">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 bg-blue-500 rounded-lg text-white shadow-md shadow-blue-500/20"><User className="w-4 h-4" /></div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Laporan Kemajuan Siswa</h3>
              <p className="text-slate-500 text-[8px] font-medium">Generate ringkasan perkembangan individu siswa.</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Pilih Siswa</label>
              <select 
                value={selectedStudentId} 
                onChange={e => setSelectedStudentId(e.target.value)}
                className="w-full p-2 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              >
                <option value="">-- Pilih Siswa --</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.className})</option>)}
              </select>
            </div>
            <button 
              onClick={handleGenerateStudentReport} 
              disabled={isGenerating}
              className="w-full bg-white hover:bg-slate-100 text-slate-800 px-4 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
              Buat Laporan Individu
            </button>
          </div>
        </div>

        {/* Teacher Weekly Summary Section */}
        <div className="glass-card p-4 rounded-2xl border border-primary/10 bg-white shadow-lg">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 bg-emerald-500 rounded-lg text-white shadow-md shadow-emerald-500/20"><Calendar className="w-4 h-4" /></div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Ringkasan Aktivitas Mingguan</h3>
              <p className="text-slate-500 text-[8px] font-medium">Generate rekapitulasi layanan BK dalam satu minggu.</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Pilih Minggu</label>
              <input 
                type="week" 
                value={selectedWeek}
                onChange={e => setSelectedWeek(e.target.value)}
                className="w-full p-2 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>
            <button 
              onClick={handleGenerateWeeklySummary} 
              disabled={isGenerating}
              className="w-full bg-white hover:bg-slate-100 text-slate-800 px-4 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BarChart2 className="w-3.5 h-3.5" />}
              Buat Ringkasan Mingguan
            </button>
          </div>
        </div>

        {/* Student List Report Section */}
        <div className="glass-card p-4 rounded-2xl border border-primary/10 bg-white shadow-lg">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 bg-violet-500 rounded-lg text-white shadow-md shadow-violet-500/20"><Users className="w-4 h-4" /></div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Daftar Siswa Asuh</h3>
              <p className="text-slate-500 text-[8px] font-medium">Generate daftar siswa per kelas dengan format resmi.</p>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-slate-600 text-xs leading-relaxed">
              Gunakan fitur ini untuk mencetak daftar siswa asuh per kelas atau seluruh kelas sekaligus dalam format surat resmi yang dilengkapi dengan Kop Surat dan tanda tangan.
            </p>
            <button 
              onClick={() => setView(ViewMode.STUDENT_DATA_REPORT)}
              className="w-full bg-white hover:bg-slate-100 text-slate-800 px-4 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2"
            >
              <TableProperties className="w-3.5 h-3.5" />
              Buka Laporan Data Siswa
            </button>
          </div>
        </div>
      </div>

      {generatedReport && (
        <div className="animate-fade-in-up">
          <div className="glass-card p-4 rounded-2xl border border-primary/10 bg-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-3xl -mr-24 -mt-24 rounded-full pointer-events-none" />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tighter">{generatedReport.title}</h3>
                  <p className="text-slate-500 text-[7px] font-black uppercase tracking-widest mt-0.5">Laporan berhasil disusun dan siap diunduh</p>
                </div>
              </div>
              <button 
                onClick={downloadAsDocx} 
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-md flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5" /> Download (.docx)
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              {generatedReport.type === 'student' ? (
                <>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Konseling</p>
                    <p className="text-lg font-black text-slate-900">{generatedReport.stats.counseling}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Anekdot</p>
                    <p className="text-lg font-black text-slate-900">{generatedReport.stats.events}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Pelanggaran</p>
                    <p className="text-lg font-black text-rose-600">{generatedReport.stats.violations}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Prestasi</p>
                    <p className="text-lg font-black text-emerald-600">{generatedReport.stats.achievements}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Jurnal Harian</p>
                    <p className="text-lg font-black text-slate-900">{generatedReport.stats.totalJournals}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Konseling</p>
                    <p className="text-lg font-black text-slate-900">{generatedReport.stats.totalCounseling}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Home Visit</p>
                    <p className="text-lg font-black text-slate-900">{generatedReport.stats.totalHomeVisits}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Anekdot</p>
                    <p className="text-lg font-black text-slate-900">{generatedReport.stats.totalEvents}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Pelanggaran</p>
                    <p className="text-lg font-black text-rose-600">{generatedReport.stats.totalViolations}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Prestasi</p>
                    <p className="text-lg font-black text-emerald-600">{generatedReport.stats.totalAchievements}</p>
                  </div>
                </>
              )}
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-inner">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-3.5 h-3.5 text-blue-400" />
                <p className="text-[8px] font-bold text-blue-400 uppercase tracking-widest">Pratinjau Ringkasan</p>
              </div>
              <div className="text-xs text-slate-600 leading-relaxed font-medium">
                {generatedReport.type === 'student' ? (
                  <p>
                    Berdasarkan data yang tercatat, siswa bernama <span className="text-slate-800 font-bold">{generatedReport.student.name}</span> dari kelas <span className="text-slate-800 font-bold">{generatedReport.student.className}</span> telah mengikuti sebanyak {generatedReport.stats.counseling} sesi layanan bimbingan dan konseling. 
                    Terdapat {generatedReport.stats.events} catatan anekdot yang mendokumentasikan perilaku harian. 
                    Dalam hal kedisiplinan, tercatat {generatedReport.stats.violations} poin pelanggaran, sementara di sisi positif terdapat {generatedReport.stats.achievements} catatan prestasi yang membanggakan.
                  </p>
                ) : (
                  <p>
                    Rekapitulasi aktivitas bimbingan dan konseling untuk periode <span className="text-slate-800 font-bold">{generatedReport.dateRange}</span> menunjukkan total {generatedReport.stats.totalJournals} jurnal kegiatan harian, {generatedReport.stats.totalCounseling} layanan konseling, dan {generatedReport.stats.totalHomeVisits} kunjungan rumah yang telah diberikan kepada siswa. 
                    Seluruh aktivitas telah terdokumentasi dalam sistem, termasuk {generatedReport.stats.totalEvents} catatan kejadian penting, {generatedReport.stats.totalViolations} penanganan pelanggaran, dan {generatedReport.stats.totalAchievements} apresiasi prestasi siswa.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomatedReports;
