import React, { useState, useMemo, useEffect } from 'react';
import { ViewMode, Student, NeedAssessment, AKPDResponse, AKPDQuestion, TeacherData } from '../types';
import { AKPD_QUESTIONS } from '../constants';
import { ArrowLeft, Plus, Trash2, Search, BarChart3, ClipboardCheck, Check, X, ChevronRight, ChevronLeft, PieChart, Users, User, Link, Copy, Info, Sheet, ExternalLink, Edit, Trophy, BookOpen, Loader2, Download, FileDown, RefreshCw } from 'lucide-react';
import AkpdQuestionEditor from './AkpdQuestionEditor';
import AkpdSheetIntegration from './AkpdSheetIntegration';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface NeedAssessmentProps {
  setView: (view: ViewMode) => void;
  students: Student[];
  akpdResponses: AKPDResponse[];
  onAddAssessment: (a: NeedAssessment) => void;
  onDeleteAssessment: (id: string) => void;
  onAddAkpd: (r: AKPDResponse) => void;
  onDeleteAkpd: (id: string) => void;
  akpdSheetUrl: string;
  onSetAkpdSheetUrl: (url: string) => void;
  akpdQuestions: AKPDQuestion[];
  onUpdateAkpdQuestions: (questions: AKPDQuestion[]) => void;
  teacherData: TeacherData;
  onSyncAkpdFromCloud?: () => Promise<void>;
  onRefreshFromFirebase?: () => Promise<void>;
  teacherId: string;
}

const NeedAssessmentComponent: React.FC<NeedAssessmentProps> = ({ 
  setView, students, akpdResponses, onAddAssessment, onDeleteAssessment, onAddAkpd, onDeleteAkpd, akpdSheetUrl, onSetAkpdSheetUrl, akpdQuestions, onUpdateAkpdQuestions, teacherData, onSyncAkpdFromCloud, onRefreshFromFirebase, teacherId
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'input' | 'analysis' | 'report'>('input');
  const [analysisMode, setAnalysisMode] = useState<'all' | 'class' | 'individual' | 'student-summary' | 'class-summary'>('all');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedIndividualClass, setSelectedIndividualClass] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Form State
  const [formStudentId, setFormStudentId] = useState('');
  const [formResponses, setFormResponses] = useState<boolean[]>(new Array(AKPD_QUESTIONS.length).fill(false));
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [showLinkCopied, setShowLinkCopied] = useState(false);
  const [showSheetModal, setShowSheetModal] = useState(false);
  const [akpdImageUrl, setAkpdImageUrl] = useState<string | null>(localStorage.getItem('guru_bk_akpd_image_url') || null);
  const [selectedAkpdDetail, setSelectedAkpdDetail] = useState<AKPDResponse | null>(null);
  const [showTop10Modal, setShowTop10Modal] = useState(false);
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [recommendationType, setRecommendationType] = useState<'all' | 'class'>('all');

  useEffect(() => {
    const handleStorageChange = () => {
      setAkpdImageUrl(localStorage.getItem('guru_bk_akpd_image_url') || null);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const currentQuestions = akpdQuestions && akpdQuestions.length > 0 ? akpdQuestions : AKPD_QUESTIONS;

  const studentAspectPercentages = useMemo(() => {
    const result: Record<string, Record<string, number>> = {};
    
    akpdResponses.forEach(r => {
      const student = students.find(s => s.id === r.studentId);
      if (!student) return;
      
      const aspectCounts: Record<string, number> = { Pribadi: 0, Sosial: 0, Belajar: 0, Karier: 0 };
      const aspectTotals: Record<string, number> = { Pribadi: 0, Sosial: 0, Belajar: 0, Karier: 0 };
      
      r.responses.forEach((res, idx) => {
        const aspect = currentQuestions[idx]?.aspect;
        if (aspect) {
          aspectTotals[aspect]++;
          if (res) aspectCounts[aspect]++;
        }
      });
      
      result[r.studentId] = {
        Pribadi: aspectTotals['Pribadi'] > 0 ? (aspectCounts['Pribadi'] / aspectTotals['Pribadi']) * 100 : 0,
        Sosial: aspectTotals['Sosial'] > 0 ? (aspectCounts['Sosial'] / aspectTotals['Sosial']) * 100 : 0,
        Belajar: aspectTotals['Belajar'] > 0 ? (aspectCounts['Belajar'] / aspectTotals['Belajar']) * 100 : 0,
        Karier: aspectTotals['Karier'] > 0 ? (aspectCounts['Karier'] / aspectTotals['Karier']) * 100 : 0,
      };
    });
    return result;
  }, [akpdResponses, students, currentQuestions]);

  const classAspectPercentages = useMemo(() => {
    const result: Record<string, Record<string, number>> = {};
    const classCounts: Record<string, number> = {};

    akpdResponses.forEach(r => {
      const student = students.find(s => s.id === r.studentId);
      if (!student) return;
      
      const className = student.className;
      if (!result[className]) {
        result[className] = { Pribadi: 0, Sosial: 0, Belajar: 0, Karier: 0 };
        classCounts[className] = 0;
      }
      
      const aspectCounts: Record<string, number> = { Pribadi: 0, Sosial: 0, Belajar: 0, Karier: 0 };
      const aspectTotals: Record<string, number> = { Pribadi: 0, Sosial: 0, Belajar: 0, Karier: 0 };
      
      r.responses.forEach((res, idx) => {
        const aspect = currentQuestions[idx]?.aspect;
        if (aspect) {
          aspectTotals[aspect]++;
          if (res) aspectCounts[aspect]++;
        }
      });
      
      result[className].Pribadi += aspectTotals['Pribadi'] > 0 ? (aspectCounts['Pribadi'] / aspectTotals['Pribadi']) * 100 : 0;
      result[className].Sosial += aspectTotals['Sosial'] > 0 ? (aspectCounts['Sosial'] / aspectTotals['Sosial']) * 100 : 0;
      result[className].Belajar += aspectTotals['Belajar'] > 0 ? (aspectCounts['Belajar'] / aspectTotals['Belajar']) * 100 : 0;
      result[className].Karier += aspectTotals['Karier'] > 0 ? (aspectCounts['Karier'] / aspectTotals['Karier']) * 100 : 0;
      classCounts[className]++;
    });

    Object.keys(result).forEach(className => {
      if (classCounts[className] > 0) {
        result[className].Pribadi /= classCounts[className];
        result[className].Sosial /= classCounts[className];
        result[className].Belajar /= classCounts[className];
        result[className].Karier /= classCounts[className];
      }
    });

    return { result, classCounts };
  }, [akpdResponses, students, currentQuestions]);

  const classes = useMemo(() => {
    return Array.from(new Set(students.map(s => s.className))).sort();
  }, [students]);

  const handleSaveAkpd = () => {
    if (!formStudentId) {
      alert('Pilih siswa terlebih dahulu.');
      return;
    }
    onAddAkpd({
      id: Date.now().toString(),
      studentId: formStudentId,
      date: new Date().toISOString().split('T')[0],
      responses: [...formResponses]
    });
    setFormStudentId('');
    setFormResponses(new Array(currentQuestions.length).fill(false));
    setCurrentQuestionIdx(0);
    alert('Data AKPD berhasil disimpan.');
  };


  const [inputClassFilter, setInputClassFilter] = useState<string>('');

  const handleCopyLink = () => {
    let url = window.location.origin + window.location.pathname + '?view=akpd';
    if (akpdSheetUrl) {
      url += `&akpd_sheet=${encodeURIComponent(akpdSheetUrl)}`;
    }
    if (teacherId) {
      url += `&teacher_id=${encodeURIComponent(teacherId)}`;
    }
    navigator.clipboard.writeText(url);
    setShowLinkCopied(true);
    setTimeout(() => setShowLinkCopied(false), 3000);
  };

  const filteredStudentsForInput = useMemo(() => {
    if (!inputClassFilter) return students;
    return students.filter(s => s.className === inputClassFilter);
  }, [students, inputClassFilter]);

  const generateRecommendationsData = (type: 'all' | 'class') => {
    let filtered = akpdResponses;
    if (type === 'class' && selectedClass) {
      const studentIdsInClass = new Set(students.filter(s => s.className === selectedClass).map(s => s.id));
      filtered = akpdResponses.filter(r => studentIdsInClass.has(r.studentId));
    }

    if (filtered.length === 0) {
      return [{ topic: 'Belum ada data', reason: 'Silakan kumpulkan data AKPD terlebih dahulu.', aspect: 'Umum' }];
    }

    const questionCounts = new Array(currentQuestions.length).fill(0);
    filtered.forEach(r => {
      r.responses.forEach((res, idx) => {
        if (res && idx < currentQuestions.length) questionCounts[idx]++;
      });
    });

    const topIssues = questionCounts
      .map((count, idx) => ({ idx, count, text: currentQuestions[idx]?.text, aspect: currentQuestions[idx]?.aspect }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const generatedRecs = topIssues.map((issue, i) => {
      let topic = '';
      if (issue.aspect === 'Pribadi') topic = `Manajemen Diri: Mengatasi ${issue.text.split(' ').slice(0, 3).join(' ')}...`;
      else if (issue.aspect === 'Sosial') topic = `Dinamika Sosial: Strategi Menghadapi ${issue.text.split(' ').slice(0, 3).join(' ')}...`;
      else if (issue.aspect === 'Belajar') topic = `Keterampilan Belajar: Solusi untuk ${issue.text.split(' ').slice(0, 3).join(' ')}...`;
      else topic = `Perencanaan Karier: Persiapan ${issue.text.split(' ').slice(0, 3).join(' ')}...`;

      return {
        topic,
        reason: `Berdasarkan tingginya persentase siswa yang memilih: "${issue.text}"`,
        aspect: issue.aspect
      };
    });

    while (generatedRecs.length < 20) {
      generatedRecs.push({
        topic: `Topik Pengembangan ${generatedRecs.length + 1}`,
        reason: 'Pengembangan karakter umum',
        aspect: 'Pribadi'
      });
    }
    return generatedRecs;
  };

  const handleGenerateRecommendations = async (type: 'all' | 'class') => {
    setRecommendationType(type);
    setShowRecommendationModal(true);
    setRecommendations([]); 

    const generatedRecs = generateRecommendationsData(type);

    setTimeout(() => {
      setRecommendations(generatedRecs);
    }, 1500);
  };

  const handleDirectDownload = (type: 'all' | 'class') => {
    const data = generateRecommendationsData(type);
    handleDownloadDocx(type, data);
  };

  const handleDownloadDocx = async (type?: 'all' | 'class', customRecs?: any[]) => {
    const targetType = type || recommendationType;
    const data = customRecs || recommendations;
    if (data.length === 0) return;

    const titleText = targetType === 'class' 
      ? `Rekomendasi Program BK - Kelas ${selectedClass}` 
      : 'Rekomendasi Program BK - Seluruh Kelas';

    const createRow = (no: number, topic: string, reason: string, aspect: string) => {
      return new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: no.toString(), alignment: 'center' })], width: { size: 5, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ text: topic })], width: { size: 40, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ text: reason })], width: { size: 40, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ text: aspect, alignment: 'center' })], width: { size: 15, type: WidthType.PERCENTAGE } }),
        ],
      });
    };

    const createHeaderRow = () => {
      return new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "No", bold: true })], alignment: 'center' })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Topik Layanan", bold: true })], alignment: 'center' })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Alasan / Kebutuhan", bold: true })], alignment: 'center' })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Aspek", bold: true })], alignment: 'center' })] }),
        ],
      });
    };

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: teacherData?.school || "SEKOLAH MENENGAH", bold: true, size: 28 }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: teacherData?.schoolAddress || "Alamat Sekolah", size: 20 }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: "__________________________________________________________________",
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),
          new Paragraph({
            text: titleText,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            text: "Semester 1",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 200 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
              insideVertical: { style: BorderStyle.SINGLE, size: 1 },
            },
            rows: [
              createHeaderRow(),
              ...data.slice(0, 10).map((rec: any, idx: number) => createRow(idx + 1, rec.topic, rec.reason, rec.aspect)),
            ],
          }),
          new Paragraph({
            text: "Semester 2",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
              insideVertical: { style: BorderStyle.SINGLE, size: 1 },
            },
            rows: [
              createHeaderRow(),
              ...data.slice(10, 20).map((rec: any, idx: number) => createRow(idx + 11, rec.topic, rec.reason, rec.aspect)),
            ],
          }),
        ],
      }],
    });

    Packer.toBlob(doc).then(blob => {
      saveAs(blob, `${titleText}.docx`);
    });
  };

  const handleDownloadAnalysisDocx = async (type: 'all' | 'class') => {
    let filtered = akpdResponses;
    let subtitle = "Seluruh Kelas";
    if (type === 'class' && selectedClass) {
      const studentIdsInClass = new Set(students.filter(s => s.className === selectedClass).map(s => s.id));
      filtered = akpdResponses.filter(r => studentIdsInClass.has(r.studentId));
      subtitle = `Kelas ${selectedClass}`;
    } else if (type === 'class' && !selectedClass) {
      alert("Silakan pilih kelas terlebih dahulu di tab Analisis.");
      return;
    }

    const totalResponses = filtered.length;
    if (totalResponses === 0) {
      alert("Tidak ada data untuk diunduh.");
      return;
    }

    const questionCounts = new Array(currentQuestions.length).fill(0);
    filtered.forEach(r => {
      r.responses.forEach((res, idx) => {
        if (res && idx < currentQuestions.length) questionCounts[idx]++;
      });
    });

    const ranking = currentQuestions
      .map((q, idx) => ({ 
        text: q.text, 
        count: questionCounts[idx], 
        percentage: (questionCounts[idx] / totalResponses) * 100 
      }))
      .sort((a, b) => b.percentage - a.percentage);

    const titleText = "ANALISA HASIL NEED ASESMEN";
    
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: teacherData?.school || "SEKOLAH MENENGAH", bold: true, size: 28 }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: teacherData?.schoolAddress || "Alamat Sekolah", size: 20 }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: "__________________________________________________________________",
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),
          new Paragraph({
            text: titleText,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: subtitle.toUpperCase(),
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Jumlah Responden: ${totalResponses} Siswa`, bold: true }),
            ],
            spacing: { after: 200 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "No", bold: true })], alignment: AlignmentType.CENTER })], width: { size: 5, type: WidthType.PERCENTAGE } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Butir Pertanyaan", bold: true })], alignment: AlignmentType.CENTER })], width: { size: 65, type: WidthType.PERCENTAGE } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Jumlah Pemilih", bold: true })], alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Prosentase", bold: true })], alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }),
                ],
              }),
              ...ranking.map((item, idx) => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: (idx + 1).toString(), alignment: AlignmentType.CENTER })] }),
                  new TableCell({ children: [new Paragraph({ text: item.text })] }),
                  new TableCell({ children: [new Paragraph({ text: item.count.toString(), alignment: AlignmentType.CENTER })] }),
                  new TableCell({ children: [new Paragraph({ text: `${item.percentage.toFixed(1)}%`, alignment: AlignmentType.CENTER })] }),
                ],
              })),
            ],
          }),
        ],
      }],
    });

    Packer.toBlob(doc).then(blob => {
      saveAs(blob, `Analisa Hasil AKPD - ${subtitle}.docx`);
    });
  };

  const handleSyncFromCloud = async () => {
    if (!onSyncAkpdFromCloud) return;
    setIsSyncing(true);
    try {
      await onSyncAkpdFromCloud();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRefreshFromFirebase = async () => {
    if (!onRefreshFromFirebase) return;
    setIsRefreshing(true);
    try {
      await onRefreshFromFirebase();
    } finally {
      setIsRefreshing(false);
    }
  };

  const analysisData = useMemo(() => {
    let filtered = akpdResponses;
    if (analysisMode === 'class' && selectedClass) {
      filtered = akpdResponses.filter(r => {
        const student = students.find(s => s.id === r.studentId);
        return student?.className === selectedClass;
      });
    } else if (analysisMode === 'individual' && selectedStudentId) {
      filtered = akpdResponses.filter(r => r.studentId === selectedStudentId);
    }

    const totalResponses = filtered.length;
    if (totalResponses === 0) return null;

    const aspectCounts = { Pribadi: 0, Sosial: 0, Belajar: 0, Karier: 0 };
    const questionCounts = new Array(currentQuestions.length).fill(0);

    filtered.forEach(r => {
      r.responses.forEach((res, idx) => {
        if (res && idx < currentQuestions.length) {
          questionCounts[idx]++;
          const aspect = currentQuestions[idx]?.aspect as keyof typeof aspectCounts;
          if (aspect) aspectCounts[aspect]++;
        }
      });
    });

    // Calculate percentages
    const aspectQuestionCounts = currentQuestions.reduce((acc, q) => {
      const aspect = q.aspect as keyof typeof aspectCounts;
      if (aspect) acc[aspect] = (acc[aspect] || 0) + 1;
      return acc;
    }, { Pribadi: 0, Sosial: 0, Belajar: 0, Karier: 0 });

    const aspectPercentages = {
      Pribadi: (aspectCounts.Pribadi / (totalResponses * aspectQuestionCounts.Pribadi)) * 100,
      Sosial: (aspectCounts.Sosial / (totalResponses * aspectQuestionCounts.Sosial)) * 100,
      Belajar: (aspectCounts.Belajar / (totalResponses * aspectQuestionCounts.Belajar)) * 100,
      Karier: (aspectCounts.Karier / (totalResponses * aspectQuestionCounts.Karier)) * 100,
    };

    return {
      totalResponses,
      aspectCounts,
      aspectPercentages,
      questionCounts: questionCounts.map(c => (c / totalResponses) * 100)
    };
  }, [akpdResponses, analysisMode, selectedClass, selectedStudentId, students]);

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 animate-fade-in text-left">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-4 gap-6">
        <div className="flex items-center gap-5">
          <button onClick={() => setView(ViewMode.HOME)} className="p-3 bg-white rounded-2xl border border-slate-200 hover:bg-slate-100 transition-all group shadow-lg">
            <ArrowLeft className="w-6 h-6 text-slate-500 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <p className="label-luxe text-blue-500 font-black text-[9px]">INSTRUMEN BK</p>
            <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none">AKPD <span className="text-blue-500 font-light italic lowercase">Siswa</span></h2>
          </div>
        </div>
        <div className="flex flex-wrap bg-slate-50/50 p-1.5 rounded-2xl border border-slate-200 shadow-xl">
          <button
            onClick={() => setShowSheetModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all mr-2"
          >
            <Sheet className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Integrasi G-Sheet</span>
          </button>
          {akpdImageUrl && (
            <div className="px-4 mb-4">
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200">
                <p className="text-xs font-bold text-rose-500 mb-2">Gambar Placeholder (URL Tidak Valid):</p>
                <img src={akpdImageUrl} alt="Placeholder" className="w-full h-auto rounded-xl" referrerPolicy="no-referrer" />
              </div>
            </div>
          )}
          <button 
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-4 py-2 text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all mr-2"
          >
            {showLinkCopied ? <Check className="w-4 h-4" /> : <Link className="w-4 h-4" />}
            <span className="text-[10px] font-black uppercase tracking-widest">{showLinkCopied ? 'Tersalin!' : 'Salin Link Siswa'}</span>
          </button>
          <button 
            onClick={() => setActiveTab('input')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'input' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Input Data
          </button>
          <button 
            onClick={() => setActiveTab('analysis')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'analysis' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Analisis
          </button>
          <button 
            onClick={() => setActiveTab('report')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'report' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Laporan
          </button>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isEditing ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {isEditing ? 'Batal' : 'Edit Pertanyaan'}
          </button>
          <button 
            onClick={() => setShowSheetModal(true)}
            className="px-6 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black hover:bg-emerald-600 transition-all shadow-lg uppercase tracking-widest flex items-center gap-2"
          >
            <Sheet className="w-4 h-4" />
            AKPD Sheet
          </button>
        </div>
      </div>

      {showSheetModal && (
        <AkpdSheetIntegration isOpen={showSheetModal} onClose={() => setShowSheetModal(false)} />
      )}

      {isEditing ? (
        <div className="space-y-4 mx-2">
          <div className="glass-card p-5 rounded-3xl border border-slate-200 shadow-xl">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-4 flex items-center gap-2">
              <div className="p-1.5 bg-rose-500/20 rounded-md"><Edit className="w-4 h-4 text-rose-500" /></div>
              Edit Pertanyaan AKPD
            </h3>
            <div className="space-y-6">
              {['Pribadi', 'Sosial', 'Belajar', 'Karier'].map(aspect => (
                <div key={aspect} className="space-y-2">
                  <h4 className="font-black text-blue-500 text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                    <div className="w-6 h-[1px] bg-blue-500/30" />
                    Bidang {aspect}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {currentQuestions.filter(q => q.aspect === aspect).map(q => (
                      <div key={q.id} className="flex items-start gap-2 p-2 bg-slate-50/30 rounded-xl border border-slate-200">
                        <span className="font-black text-blue-500 text-[10px] mt-2">{q.id}.</span>
                        <textarea 
                          value={q.text}
                          onChange={e => {
                            const newQuestions = currentQuestions.map(qn => qn.id === q.id ? {...qn, text: e.target.value} : qn);
                            onUpdateAkpdQuestions(newQuestions);
                          }}
                          className="w-full p-2 input-cyber rounded-lg text-xs leading-relaxed focus:border-blue-500/20 outline-none"
                          rows={2}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => {
                onUpdateAkpdQuestions(AKPD_QUESTIONS); // Reset to default
                setIsEditing(false);
              }} className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 rounded-lg transition-all">
                Batal
              </button>
              <button onClick={() => {
                setIsEditing(false);
                alert('Pertanyaan berhasil disimpan!');
              }} className="px-5 py-2 text-[9px] font-black uppercase tracking-widest text-white bg-blue-600/20 border border-blue-500/30 rounded-lg shadow-lg hover:bg-blue-600 transition-all">
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      ) : activeTab === 'input' ? (
        <div className="space-y-8 mx-4">
          <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-[2rem] flex items-start gap-5">
            <div className="p-3 bg-blue-500/20 rounded-2xl">
              <Info className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h4 className="font-black text-blue-100 uppercase text-xs tracking-wider mb-2">Panduan Membagikan Tautan AKPD ke Siswa</h4>
              <ol className="list-decimal list-inside text-xs text-slate-500 space-y-1.5 leading-relaxed">
                <li>Klik tombol <strong className="text-blue-500">'Salin Link Siswa'</strong> untuk menyalin tautan unik angket.</li>
                <li>Bagikan tautan tersebut melalui WhatsApp atau media lain kepada siswa.</li>
                <li>Siswa membuka tautan, mencari nama berdasarkan kelas & no. absen, lalu mengisi angket.</li>
                <li>Hasilnya akan otomatis masuk ke tab <strong className="text-blue-500">'Analisis'</strong> di halaman ini setelah siswa mengirim jawaban.</li>
              </ol>
            </div>
          </div>

          <div className="glass-card p-5 rounded-[1.5rem] border border-slate-200 shadow-xl">
            <div className="flex flex-col md:flex-row gap-4 items-end mb-6">
              <div className="flex-1 space-y-1.5">
                <label className="label-luxe ml-1 text-[10px]">Filter Kelas</label>
                <select 
                  value={inputClassFilter}
                  onChange={e => { setInputClassFilter(e.target.value); setFormStudentId(''); }}
                  className="w-full p-2.5 text-xs input-cyber rounded-xl outline-none focus:border-blue-500/20"
                >
                  <option value="">Semua Kelas</option>
                  {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="label-luxe ml-1 text-[10px]">Pilih Siswa yang Mengisi Angket</label>
                <select 
                  value={formStudentId}
                  onChange={e => setFormStudentId(e.target.value)}
                  className="w-full p-2.5 text-xs input-cyber rounded-xl outline-none focus:border-blue-500/20"
                >
                  <option value="">-- Pilih Siswa --</option>
                  {filteredStudentsForInput.map(s => <option key={s.id} value={s.id}>{s.name} ({s.className})</option>)}
                </select>
              </div>
              <div className="flex-1 bg-slate-50/50 p-3 rounded-xl border border-slate-200">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">Progress Pengisian</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                      style={{ width: `${((currentQuestionIdx + 1) / currentQuestions.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-black text-blue-500">{currentQuestionIdx + 1}/{currentQuestions.length}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50/40 p-6 rounded-[1.25rem] border border-slate-200 shadow-inner relative overflow-hidden min-h-[200px] flex flex-col justify-center items-center text-center">
              <div className="absolute top-0 left-0 w-full h-1 bg-white">
                <div 
                  className="h-full bg-blue-500 transition-all duration-500" 
                  style={{ width: `${((currentQuestionIdx + 1) / currentQuestions.length) * 100}%` }}
                />
              </div>
              
              <div className="space-y-4 max-w-xl relative">
                <span className="px-3 py-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-full text-[8px] font-black uppercase tracking-[0.2em]">
                  Aspek: {currentQuestions[currentQuestionIdx]?.aspect}
                </span>
                <h3 className="text-xl font-black text-slate-800 leading-tight uppercase tracking-tighter">
                  {currentQuestions[currentQuestionIdx]?.text}
                </h3>
                
                <div className="flex justify-center gap-4 pt-4">
                  <button 
                    onClick={() => {
                      const newRes = [...formResponses];
                      newRes[currentQuestionIdx] = true;
                      setFormResponses(newRes);
                      if (currentQuestionIdx < currentQuestions.length - 1) setCurrentQuestionIdx(currentQuestionIdx + 1);
                    }}
                    className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all w-20 group ${formResponses[currentQuestionIdx] === true ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-white border-slate-200 hover:border-emerald-500/50 text-slate-500'}`}
                  >
                    <Check className={`w-5 h-5 transition-transform group-hover:scale-110 ${formResponses[currentQuestionIdx] === true ? 'text-emerald-400' : 'text-slate-700'}`} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Ya</span>
                  </button>
                  <button 
                    onClick={() => {
                      const newRes = [...formResponses];
                      newRes[currentQuestionIdx] = false;
                      setFormResponses(newRes);
                      if (currentQuestionIdx < currentQuestions.length - 1) setCurrentQuestionIdx(currentQuestionIdx + 1);
                    }}
                    className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all w-20 group ${formResponses[currentQuestionIdx] === false ? 'bg-rose-500/10 border-rose-500 text-rose-400' : 'bg-white border-slate-200 hover:border-rose-500/50 text-slate-500'}`}
                  >
                    <X className={`w-5 h-5 transition-transform group-hover:scale-110 ${formResponses[currentQuestionIdx] === false ? 'text-rose-400' : 'text-slate-700'}`} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Tidak</span>
                  </button>
                </div>
              </div>

              <div className="absolute bottom-4 left-0 w-full px-6 flex justify-between items-center">
                <button 
                  disabled={currentQuestionIdx === 0}
                  onClick={() => setCurrentQuestionIdx(currentQuestionIdx - 1)}
                  className="p-2 bg-white rounded-xl text-slate-500 disabled:opacity-20 hover:bg-slate-100 transition-all border border-slate-200"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {currentQuestionIdx === currentQuestions.length - 1 ? (
                  <button 
                    onClick={handleSaveAkpd}
                    className="bg-blue-600/20 text-blue-400 border border-blue-500/30 px-6 py-2.5 rounded-xl font-black text-[8px] uppercase tracking-[0.2em] shadow-lg flex items-center gap-2 animate-pulse hover:bg-blue-600 hover:text-white transition-all"
                  >
                    <ClipboardCheck className="w-3 h-3" /> Simpan Hasil Angket
                  </button>
                ) : (
                  <button 
                    onClick={() => setCurrentQuestionIdx(currentQuestionIdx + 1)}
                    className="p-2 bg-white rounded-xl text-slate-500 hover:bg-slate-100 transition-all border border-slate-200"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="glass-card p-5 rounded-[1.5rem] border border-slate-200 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">DATA AKPD</h3>
              <button 
                onClick={() => setShowTop10Modal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-md"
              >
                <Trophy className="w-3 h-3" /> Top 10 Analisa
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-[9px] font-black uppercase tracking-widest text-blue-500 border-b border-slate-200">
                    <th className="p-2.5">Siswa</th>
                    <th className="p-2.5">Tanggal</th>
                    <th className="p-2.5">Skor (Ya)</th>
                    <th className="p-2.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {akpdResponses.map(r => {
                    const student = students.find(s => s.id === r.studentId);
                    const score = r.responses.filter(res => res).length;
                    return (
                      <tr key={r.id} className="hover:bg-blue-500/5 transition-all group">
                        <td className="p-2.5">
                          <p className="font-black text-slate-800 uppercase tracking-tighter">{student?.name}</p>
                          <p className="text-[9px] text-blue-500 uppercase font-black tracking-widest mt-0.5">{student?.className}</p>
                        </td>
                        <td className="p-2.5 text-slate-500 font-bold">{r.date}</td>
                        <td className="p-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-200">
                              <div className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${(score/currentQuestions.length)*100}%` }} />
                            </div>
                            <span className="text-[10px] font-black text-slate-800">{score}/{currentQuestions.length}</span>
                          </div>
                        </td>
                        <td className="p-2.5 text-right flex items-center justify-end gap-1.5">
                          <button onClick={() => setSelectedAkpdDetail(r)} className="p-1.5 bg-slate-100 border border-slate-200 hover:bg-blue-900/20 rounded-lg text-blue-400 transition-all shadow-sm">
                            <Info className="w-3 h-3" />
                          </button>
                          <button onClick={() => onDeleteAkpd(r.id)} className="p-1.5 bg-slate-100 border border-slate-200 hover:bg-rose-900/20 rounded-lg text-rose-500 transition-all shadow-sm">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'analysis' ? (
        <div className="space-y-4 mx-4">
          <div className="flex flex-wrap gap-2 bg-slate-50/50 p-2 rounded-xl border border-slate-200 shadow-xl">
            <button 
              onClick={() => setAnalysisMode('all')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${analysisMode === 'all' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-500 hover:text-slate-800'}`}
            >
              <PieChart className="w-3 h-3" /> Semua Kelas
            </button>
            <button 
              onClick={() => setAnalysisMode('class')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${analysisMode === 'class' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-500 hover:text-slate-800'}`}
            >
              <Users className="w-3 h-3" /> Per Kelas
            </button>
            <button 
              onClick={() => setAnalysisMode('individual')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${analysisMode === 'individual' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-500 hover:text-slate-800'}`}
            >
              <User className="w-3 h-3" /> Individual
            </button>
            <button 
              onClick={() => setAnalysisMode('class-summary')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${analysisMode === 'class-summary' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-500 hover:text-slate-800'}`}
            >
              <Users className="w-3 h-3" /> Ringkasan Kelas
            </button>
            <button 
              onClick={() => setAnalysisMode('student-summary')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${analysisMode === 'student-summary' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-500 hover:text-slate-800'}`}
            >
              <Users className="w-3 h-3" /> Ringkasan Siswa
            </button>
            
            <div className="h-6 w-[1px] bg-white/10 mx-1 self-center hidden md:block" />

            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => handleDownloadAnalysisDocx('all')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white shadow-lg"
              >
                <FileDown className="w-3 h-3" /> Hasil Need Asesmen (Seluruh)
              </button>
              <button 
                onClick={() => handleDownloadAnalysisDocx('class')}
                disabled={analysisMode !== 'class' || !selectedClass}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <FileDown className="w-3 h-3" /> Hasil Need Asesmen (Per Kelas)
              </button>
            </div>

            <div className="h-6 w-[1px] bg-white/10 mx-1 self-center hidden md:block" />
            
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => handleGenerateRecommendations('all')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white shadow-lg"
              >
                <BookOpen className="w-3 h-3" /> Rekomendasi Topik utk Seluruh Kelas
              </button>
              <button 
                onClick={() => handleDirectDownload('all')}
                title="Download DOCX Seluruh Kelas"
                className="p-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-lg"
              >
                <Download className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => handleGenerateRecommendations('class')}
                disabled={analysisMode !== 'class' || !selectedClass}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <BookOpen className="w-3 h-3" /> Rekomendasi Topik Per Kelas
              </button>
              <button 
                onClick={() => handleDirectDownload('class')}
                disabled={analysisMode !== 'class' || !selectedClass}
                title="Download DOCX Per Kelas"
                className="p-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Download className="w-3 h-3" />
              </button>
            </div>

            <div className="h-6 w-[1px] bg-white/10 mx-1 self-center hidden md:block" />

            <button 
              onClick={handleSyncFromCloud}
              disabled={isSyncing || !akpdSheetUrl}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all bg-amber-600/20 text-amber-400 border border-amber-500/30 hover:bg-amber-600 hover:text-white shadow-lg disabled:opacity-30"
            >
              {isSyncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sheet className="w-3 h-3" />}
              Sync Google Sheet
            </button>

            <button 
              onClick={handleRefreshFromFirebase}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white shadow-lg disabled:opacity-30"
            >
              {isRefreshing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Refresh Firebase
            </button>
          </div>

          <div className="flex gap-3">
            {analysisMode === 'class' && (
              <select 
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="p-2.5 text-xs input-cyber rounded-xl outline-none focus:border-blue-500/20 min-w-[150px] shadow-xl"
              >
                <option value="">-- Pilih Kelas --</option>
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            {analysisMode === 'individual' && (
              <div className="flex gap-2">
                <select 
                  value={selectedIndividualClass}
                  onChange={e => {
                    setSelectedIndividualClass(e.target.value);
                    setSelectedStudentId('');
                  }}
                  className="p-2.5 text-xs input-cyber rounded-xl outline-none focus:border-blue-500/20 min-w-[120px] shadow-xl"
                >
                  <option value="">-- Pilih Kelas --</option>
                  {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select 
                  value={selectedStudentId}
                  onChange={e => setSelectedStudentId(e.target.value)}
                  disabled={!selectedIndividualClass}
                  className="p-2.5 text-xs input-cyber rounded-xl outline-none focus:border-blue-500/20 min-w-[150px] shadow-xl disabled:opacity-50"
                >
                  <option value="">-- Pilih Siswa --</option>
                  {students
                    .filter(s => s.className === selectedIndividualClass)
                    .map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}
          </div>

          {analysisMode === 'class-summary' ? (
            <div className="glass-card p-6 rounded-2xl border border-slate-200 shadow-2xl">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-5 flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/20 rounded-xl"><Users className="w-4 h-4 text-blue-500" /></div>
                Ringkasan Analisis Per Kelas
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 uppercase tracking-widest text-[8px] border-b border-slate-200">
                      <th className="p-3 text-left">Kelas</th>
                      <th className="p-3 text-center">Responden</th>
                      <th className="p-3 text-center">Pribadi</th>
                      <th className="p-3 text-center">Sosial</th>
                      <th className="p-3 text-center">Belajar</th>
                      <th className="p-3 text-center">Karier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classes.map(className => {
                      const percentages = classAspectPercentages.result[className];
                      const count = classAspectPercentages.classCounts[className] || 0;
                      if (!percentages) return (
                        <tr key={className} className="border-b border-slate-100 opacity-50">
                          <td className="p-3 font-bold text-slate-400">{className}</td>
                          <td className="p-3 text-center text-slate-400">0</td>
                          <td className="p-3 text-center text-slate-400">-</td>
                          <td className="p-3 text-center text-slate-400">-</td>
                          <td className="p-3 text-center text-slate-400">-</td>
                          <td className="p-3 text-center text-slate-400">-</td>
                        </tr>
                      );
                      return (
                        <tr key={className} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-bold text-slate-800">{className}</td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-black text-[10px]">
                              {count}
                            </span>
                          </td>
                          <td className="p-3 text-center font-medium">{percentages.Pribadi.toFixed(1)}%</td>
                          <td className="p-3 text-center font-medium">{percentages.Sosial.toFixed(1)}%</td>
                          <td className="p-3 text-center font-medium">{percentages.Belajar.toFixed(1)}%</td>
                          <td className="p-3 text-center font-medium">{percentages.Karier.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : analysisMode === 'student-summary' ? (
            <div className="glass-card p-6 rounded-2xl border border-slate-200 shadow-2xl">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-5 flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/20 rounded-xl"><Users className="w-4 h-4 text-blue-500" /></div>
                Ringkasan Analisis Per Siswa
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 uppercase tracking-widest text-[8px] border-b border-slate-200">
                      <th className="p-3 text-left">Siswa</th>
                      <th className="p-3 text-left">Kelas</th>
                      <th className="p-3 text-center">Pribadi</th>
                      <th className="p-3 text-center">Sosial</th>
                      <th className="p-3 text-center">Belajar</th>
                      <th className="p-3 text-center">Karier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(student => {
                      const percentages = studentAspectPercentages[student.id];
                      if (!percentages) return null;
                      return (
                        <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-800">{student.name}</td>
                          <td className="p-3 text-slate-500">{student.className}</td>
                          <td className="p-3 text-center">{percentages.Pribadi.toFixed(1)}%</td>
                          <td className="p-3 text-center">{percentages.Sosial.toFixed(1)}%</td>
                          <td className="p-3 text-center">{percentages.Belajar.toFixed(1)}%</td>
                          <td className="p-3 text-center">{percentages.Karier.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : analysisData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {(Object.entries(analysisData.aspectPercentages) as [string, number][]).map(([aspect, percentage]) => (
                  <div key={aspect} className="bg-white/60 p-5 rounded-2xl border border-slate-200 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 blur-2xl -mr-8 -mt-8 rounded-full" />
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1.5">{aspect}</p>
                    <div className="flex items-end gap-1.5">
                      <p className="text-3xl font-black text-slate-800 tracking-tighter">{percentage.toFixed(1)}%</p>
                      <span className="text-[8px] font-black text-blue-500 mb-1 uppercase tracking-widest">Kebutuhan</span>
                    </div>
                    <div className="mt-3 h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-200">
                      <div className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="glass-card p-6 rounded-2xl border border-slate-200 shadow-2xl">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-5 flex items-center gap-2">
                  <div className="p-1.5 bg-blue-500/20 rounded-xl"><BarChart3 className="w-4 h-4 text-blue-500" /></div>
                  Ringkasan Aspek
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={Object.entries(analysisData.aspectPercentages).map(([name, value]) => ({ name, value }))} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card p-6 rounded-2xl border border-slate-200 shadow-2xl">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-5 flex items-center gap-2">
                  <div className="p-1.5 bg-blue-500/20 rounded-xl"><PieChart className="w-4 h-4 text-blue-500" /></div>
                  Visualisasi Data per Aspek
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {['Pribadi', 'Sosial', 'Belajar', 'Karier'].map(aspect => {
                    const aspectData = currentQuestions
                      .map((q, idx) => ({
                        name: `Q${idx + 1}`,
                        fullText: q.text,
                        percentage: analysisData.questionCounts[idx],
                        aspect: q.aspect
                      }))
                      .filter(q => q.aspect === aspect);

                    return (
                      <div key={aspect} className="bg-white p-3 rounded-xl border border-slate-100 shadow-lg">
                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${
                            aspect === 'Pribadi' ? 'bg-blue-500' : 
                            aspect === 'Sosial' ? 'bg-emerald-500' : 
                            aspect === 'Belajar' ? 'bg-amber-500' : 'bg-rose-500'
                          }`} />
                          Aspek {aspect}
                        </h4>
                        <div className="h-40 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={aspectData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#64748b' }} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#64748b' }} domain={[0, 100]} />
                              <Tooltip 
                                cursor={{ fill: '#f8fafc' }}
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl max-w-xs border border-slate-800">
                                        <p className="text-[10px] font-bold mb-1 text-blue-400">{data.name}</p>
                                        <p className="text-[8px] leading-relaxed mb-2 text-slate-300">{data.fullText}</p>
                                        <p className="text-xs font-black">{data.percentage.toFixed(1)}% <span className="text-[8px] font-normal text-slate-400">memilih Ya</span></p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Bar dataKey="percentage" radius={[2, 2, 0, 0]}>
                                {aspectData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={
                                    aspect === 'Pribadi' ? '#3b82f6' : 
                                    aspect === 'Sosial' ? '#10b981' : 
                                    aspect === 'Belajar' ? '#f59e0b' : '#f43f5e'
                                  } />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="glass-card p-6 rounded-2xl border border-slate-200 shadow-2xl">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-5 flex items-center gap-2">
                  <div className="p-1.5 bg-blue-500/20 rounded-xl"><BarChart3 className="w-4 h-4 text-blue-500" /></div>
                  Urutan Ranking Masalah ({currentQuestions.length} Butir Pertanyaan)
                </h3>
                <div className="space-y-4">
                  {currentQuestions
                    .map((q, idx) => ({ ...q, percentage: analysisData.questionCounts[idx] }))
                    .sort((a, b) => b.percentage - a.percentage)
                    .map((q, idx) => (
                      <div key={q.id} className="space-y-1.5">
                        <div className="flex justify-between items-start gap-3">
                          <p className="text-xs font-bold text-slate-600 flex-1 leading-relaxed">
                            <span className="text-blue-500 font-black mr-2 text-[10px] uppercase tracking-widest">#{idx + 1}</span> {q.text}
                          </p>
                          <span className="text-sm font-black text-slate-800 tracking-tighter">{q.percentage.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-200">
                          <div 
                            className={`h-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,0,0,0.5)] ${q.percentage > 50 ? 'bg-rose-500' : q.percentage > 25 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${q.percentage}%` }} 
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white/60 rounded-2xl border border-slate-200 shadow-2xl">
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-4 border border-slate-200">
                <BarChart3 className="w-6 h-6 text-slate-700" />
              </div>
              <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-1.5">Data Tidak Ditemukan</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">Silakan pilih filter atau pastikan sudah ada data AKPD yang diinput untuk melihat analisis.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8 mx-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-2 bg-slate-50/50 p-2 rounded-xl border border-slate-200 shadow-xl">
              <button 
                onClick={() => setAnalysisMode('class')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${analysisMode === 'class' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-500 hover:text-slate-800'}`}
              >
                <Users className="w-3 h-3" /> Profil Kelas
              </button>
              <button 
                onClick={() => setAnalysisMode('individual')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${analysisMode === 'individual' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-500 hover:text-slate-800'}`}
              >
                <User className="w-3 h-3" /> Profil Konseli
              </button>
              <button 
                onClick={() => setAnalysisMode('class-summary')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${analysisMode === 'class-summary' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-500 hover:text-slate-800'}`}
              >
                <Users className="w-3 h-3" /> Ringkasan Kelas
              </button>
              <button 
                onClick={() => setAnalysisMode('student-summary')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${analysisMode === 'student-summary' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-500 hover:text-slate-800'}`}
              >
                <Users className="w-3 h-3" /> Ringkasan Siswa
              </button>
            </div>

            <div className="flex gap-2">
              {analysisMode === 'class' && selectedClass && (
                <button 
                  onClick={() => handleDownloadAnalysisDocx('class')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg"
                >
                  <FileDown className="w-4 h-4" /> Cetak Profil Kelas
                </button>
              )}
              {analysisMode === 'individual' && selectedStudentId && (
                <button 
                  onClick={() => {
                    const r = akpdResponses.find(res => res.studentId === selectedStudentId);
                    if (r) setSelectedAkpdDetail(r);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg"
                >
                  <Info className="w-4 h-4" /> Lihat Detail Jawaban
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            {analysisMode === 'class' && (
              <select 
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="p-2.5 text-xs input-cyber rounded-xl outline-none focus:border-blue-500/20 min-w-[150px] shadow-xl"
              >
                <option value="">-- Pilih Kelas --</option>
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            {analysisMode === 'individual' && (
              <div className="flex gap-2">
                <select 
                  value={selectedIndividualClass}
                  onChange={e => {
                    setSelectedIndividualClass(e.target.value);
                    setSelectedStudentId('');
                  }}
                  className="p-2.5 text-xs input-cyber rounded-xl outline-none focus:border-blue-500/20 min-w-[120px] shadow-xl"
                >
                  <option value="">-- Pilih Kelas --</option>
                  {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select 
                  value={selectedStudentId}
                  onChange={e => setSelectedStudentId(e.target.value)}
                  disabled={!selectedIndividualClass}
                  className="p-2.5 text-xs input-cyber rounded-xl outline-none focus:border-blue-500/20 min-w-[150px] shadow-xl disabled:opacity-50"
                >
                  <option value="">-- Pilih Siswa --</option>
                  {students
                    .filter(s => s.className === selectedIndividualClass)
                    .map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}
          </div>

          {analysisMode === 'class-summary' ? (
            <div className="glass-card p-8 rounded-3xl border border-slate-200 shadow-2xl bg-white/80 backdrop-blur-md">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-6 flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/20 rounded-xl"><Users className="w-5 h-5 text-blue-500" /></div>
                Ringkasan Analisis Per Kelas
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 uppercase tracking-widest text-[9px] border-b border-slate-200">
                      <th className="p-4 text-left">Kelas</th>
                      <th className="p-4 text-center">Responden</th>
                      <th className="p-4 text-center">Pribadi</th>
                      <th className="p-4 text-center">Sosial</th>
                      <th className="p-4 text-center">Belajar</th>
                      <th className="p-4 text-center">Karier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classes.map(className => {
                      const percentages = classAspectPercentages.result[className];
                      const count = classAspectPercentages.classCounts[className] || 0;
                      if (!percentages) return (
                        <tr key={className} className="border-b border-slate-100 opacity-50">
                          <td className="p-4 font-bold text-slate-400">{className}</td>
                          <td className="p-4 text-center text-slate-400">0</td>
                          <td className="p-4 text-center text-slate-400">-</td>
                          <td className="p-4 text-center text-slate-400">-</td>
                          <td className="p-4 text-center text-slate-400">-</td>
                          <td className="p-4 text-center text-slate-400">-</td>
                        </tr>
                      );
                      return (
                        <tr key={className} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-bold text-slate-800">{className}</td>
                          <td className="p-4 text-center">
                            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full font-black text-[10px]">
                              {count}
                            </span>
                          </td>
                          <td className="p-4 text-center font-bold text-slate-700">{percentages.Pribadi.toFixed(1)}%</td>
                          <td className="p-4 text-center font-bold text-slate-700">{percentages.Sosial.toFixed(1)}%</td>
                          <td className="p-4 text-center font-bold text-slate-700">{percentages.Belajar.toFixed(1)}%</td>
                          <td className="p-4 text-center font-bold text-slate-700">{percentages.Karier.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : analysisMode === 'student-summary' ? (
            <div className="glass-card p-8 rounded-3xl border border-slate-200 shadow-2xl bg-white/80 backdrop-blur-md">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-6 flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/20 rounded-xl"><Users className="w-5 h-5 text-blue-500" /></div>
                Ringkasan Analisis Per Siswa
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 uppercase tracking-widest text-[9px] border-b border-slate-200">
                      <th className="p-4 text-left">Siswa</th>
                      <th className="p-4 text-left">Kelas</th>
                      <th className="p-4 text-center">Pribadi</th>
                      <th className="p-4 text-center">Sosial</th>
                      <th className="p-4 text-center">Belajar</th>
                      <th className="p-4 text-center">Karier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(student => {
                      const percentages = studentAspectPercentages[student.id];
                      if (!percentages) return null;
                      return (
                        <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-bold text-slate-800">{student.name}</td>
                          <td className="p-4 text-slate-500 font-medium">{student.className}</td>
                          <td className="p-4 text-center font-bold text-slate-700">{percentages.Pribadi.toFixed(1)}%</td>
                          <td className="p-4 text-center font-bold text-slate-700">{percentages.Sosial.toFixed(1)}%</td>
                          <td className="p-4 text-center font-bold text-slate-700">{percentages.Belajar.toFixed(1)}%</td>
                          <td className="p-4 text-center font-bold text-slate-700">{percentages.Karier.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : analysisMode === 'class' && analysisData ? (
            <div className="space-y-8">
              <div className="glass-card p-8 rounded-3xl border border-slate-200 shadow-2xl bg-white/80 backdrop-blur-md">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-100 pb-6">
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Profil Kelas: {selectedClass}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">Ringkasan Kebutuhan Peserta Didik berdasarkan Aspek Perkembangan</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center px-4 py-2 bg-blue-50 rounded-2xl border border-blue-100">
                      <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-1">Responden</p>
                      <p className="text-xl font-black text-slate-800">{analysisData.totalResponses}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                  {(Object.entries(analysisData.aspectPercentages) as [string, number][]).map(([aspect, percentage]) => (
                    <div key={aspect} className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 shadow-sm">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{aspect}</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-800 tracking-tighter">{percentage.toFixed(1)}%</span>
                      </div>
                      <div className="mt-4 h-2 bg-white rounded-full overflow-hidden border border-slate-100">
                        <div 
                          className={`h-full transition-all duration-1000 ${
                            aspect === 'Pribadi' ? 'bg-blue-500' : 
                            aspect === 'Sosial' ? 'bg-emerald-500' : 
                            aspect === 'Belajar' ? 'bg-amber-500' : 'bg-rose-500'
                          }`} 
                          style={{ width: `${percentage}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-blue-500" /> Analisis Butir Instrumen
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-[9px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">
                          <th className="p-4 text-left">No</th>
                          <th className="p-4 text-left">Butir Pertanyaan</th>
                          <th className="p-4 text-center">Persentase</th>
                          <th className="p-4 text-center">Prioritas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {currentQuestions.map((q, idx) => {
                          const percentage = analysisData.questionCounts[idx];
                          const priority = percentage > 50 ? 'Tinggi' : percentage > 25 ? 'Sedang' : 'Rendah';
                          return (
                            <tr key={q.id} className="hover:bg-slate-50/50 transition-all">
                              <td className="p-4 font-black text-slate-400">{idx + 1}</td>
                              <td className="p-4">
                                <p className="font-bold text-slate-700">{q.text}</p>
                                <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">{q.aspect}</span>
                              </td>
                              <td className="p-4 text-center">
                                <span className="font-black text-slate-800">{percentage.toFixed(1)}%</span>
                              </td>
                              <td className="p-4 text-center">
                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                  priority === 'Tinggi' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                                  priority === 'Sedang' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                  'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                }`}>
                                  {priority}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : analysisMode === 'individual' && analysisData ? (
            <div className="space-y-8">
              <div className="glass-card p-8 rounded-3xl border border-slate-200 shadow-2xl bg-white/80 backdrop-blur-md">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-100 pb-6">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20">
                      <User className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                        {students.find(s => s.id === selectedStudentId)?.name}
                      </h3>
                      <p className="text-xs text-blue-500 font-bold mt-1 uppercase tracking-widest">
                        Profil Individual • Kelas {selectedIndividualClass}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-blue-500" /> Ringkasan Aspek
                    </h4>
                    <div className="space-y-4">
                      {(Object.entries(analysisData.aspectPercentages) as [string, number][]).map(([aspect, percentage]) => (
                        <div key={aspect} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-600">{aspect}</span>
                            <span className="text-xs font-black text-slate-800">{percentage.toFixed(1)}%</span>
                          </div>
                          <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                            <div 
                              className={`h-full transition-all duration-1000 ${
                                aspect === 'Pribadi' ? 'bg-blue-500' : 
                                aspect === 'Sosial' ? 'bg-emerald-500' : 
                                aspect === 'Belajar' ? 'bg-amber-500' : 'bg-rose-500'
                              }`} 
                              style={{ width: `${percentage}%` }} 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <ClipboardCheck className="w-4 h-4 text-blue-500" /> Masalah yang Dipilih
                    </h4>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {currentQuestions.map((q, idx) => {
                        const isYes = analysisData.questionCounts[idx] > 0;
                        if (!isYes) return null;
                        return (
                          <div key={q.id} className="p-3 bg-slate-50/50 border border-slate-200 rounded-xl flex gap-3 items-start">
                            <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center shrink-0 mt-0.5">
                              <Check className="w-3 h-3" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-700">{q.text}</p>
                              <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">{q.aspect}</span>
                            </div>
                          </div>
                        );
                      })}
                      {analysisData.questionCounts.every(c => c === 0) && (
                        <div className="text-center py-8 text-slate-400 italic text-xs">
                          Tidak ada masalah yang dipilih.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white/60 rounded-2xl border border-slate-200 shadow-2xl">
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-4 border border-slate-200">
                <ClipboardCheck className="w-6 h-6 text-slate-700" />
              </div>
              <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-1.5">Laporan Belum Siap</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">Pilih mode laporan dan filter yang sesuai untuk melihat ringkasan data AKPD.</p>
            </div>
          )}
        </div>
      )}
      {selectedAkpdDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-slate-50/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Detail Jawaban AKPD</h3>
                <p className="text-xs text-blue-400 font-bold mt-1">
                  {students.find(s => s.id === selectedAkpdDetail.studentId)?.name} • {students.find(s => s.id === selectedAkpdDetail.studentId)?.className}
                </p>
              </div>
              <button 
                onClick={() => setSelectedAkpdDetail(null)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestions.map((q, idx) => {
                  const isYes = selectedAkpdDetail.responses[idx];
                  return (
                    <div key={q.id} className={`p-4 rounded-2xl border ${isYes ? 'bg-blue-500/10 border-blue-500/30' : 'bg-slate-50/50 border-slate-200'} flex gap-4 items-start`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isYes ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {isYes ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1 block">{q.aspect}</span>
                        <p className={`text-sm ${isYes ? 'text-blue-100 font-medium' : 'text-slate-500'}`}>{q.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-200 bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <span className="text-xs font-black text-blue-400 uppercase tracking-widest">
                    Total Ya: {selectedAkpdDetail.responses.filter(r => r).length} / {currentQuestions.length}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedAkpdDetail(null)}
                className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {showTop10Modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-slate-50/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/20">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Top 10 Analisa AKPD</h3>
                  <p className="text-xs text-amber-500 font-bold mt-1">Siswa dengan skor AKPD tertinggi</p>
                </div>
              </div>
              <button 
                onClick={() => setShowTop10Modal(false)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                {[...akpdResponses]
                  .map(r => ({
                    ...r,
                    score: r.responses.filter(res => res).length,
                    student: students.find(s => s.id === r.studentId)
                  }))
                  .sort((a, b) => b.score - a.score)
                  .slice(0, 10)
                  .map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between p-5 bg-slate-50/50 border border-slate-200 rounded-2xl hover:bg-slate-100/50 transition-all">
                      <div className="flex items-center gap-5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${index < 3 ? 'bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-slate-100 text-slate-500'}`}>
                          #{index + 1}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-800 uppercase tracking-tighter text-lg">{item.student?.name || 'Siswa Tidak Ditemukan'}</h4>
                          <p className="text-[10px] text-blue-500 uppercase font-black tracking-widest mt-1">{item.student?.className}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Skor AKPD</p>
                          <p className="text-2xl font-black text-slate-800">{item.score} <span className="text-sm text-slate-500">/ {currentQuestions.length}</span></p>
                        </div>
                      </div>
                    </div>
                  ))}
                
                {akpdResponses.length === 0 && (
                  <div className="text-center py-12">
                    <BarChart3 className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Belum ada data AKPD untuk dianalisa.</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-200 bg-slate-50/50 flex justify-end">
              <button 
                onClick={() => setShowTop10Modal(false)}
                className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {showRecommendationModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-slate-50/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Rekomendasi Program BK</h3>
                  <p className="text-xs text-emerald-500 font-bold mt-1">20 Topik Layanan (2 Semester) berdasarkan {recommendationType === 'class' ? `Kelas ${selectedClass}` : 'Seluruh Kelas'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {recommendations.length > 0 && (
                  <button 
                    onClick={() => handleDownloadDocx()}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-lg"
                  >
                    <Download className="w-4 h-4" /> Download DOCX
                  </button>
                )}
                <button 
                  onClick={() => setShowRecommendationModal(false)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-8 custom-scrollbar">
              {recommendations.length > 0 ? (
                <div className="space-y-8">
                  <div>
                    <h4 className="text-lg font-black text-slate-800 uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">Semester 1</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recommendations.slice(0, 10).map((rec, idx) => (
                        <div key={idx} className="p-4 bg-slate-50/50 border border-slate-200 rounded-2xl flex gap-4">
                          <div className="w-8 h-8 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center font-black text-xs border border-emerald-500/20 shrink-0">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{rec.topic}</p>
                            <p className="text-[10px] text-slate-500 mt-1">{rec.reason}</p>
                            <span className="inline-block mt-2 px-2 py-1 bg-slate-100 text-slate-600 text-[9px] rounded-md font-bold uppercase tracking-widest">{rec.aspect}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-800 uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">Semester 2</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recommendations.slice(10, 20).map((rec, idx) => (
                        <div key={idx + 10} className="p-4 bg-slate-50/50 border border-slate-200 rounded-2xl flex gap-4">
                          <div className="w-8 h-8 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center font-black text-xs border border-blue-500/20 shrink-0">
                            {idx + 11}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{rec.topic}</p>
                            <p className="text-[10px] text-slate-500 mt-1">{rec.reason}</p>
                            <span className="inline-block mt-2 px-2 py-1 bg-slate-100 text-slate-600 text-[9px] rounded-md font-bold uppercase tracking-widest">{rec.aspect}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-12">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">Menghasilkan rekomendasi berdasarkan data AKPD...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default NeedAssessmentComponent;
