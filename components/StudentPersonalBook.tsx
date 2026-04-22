import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ViewMode, Student, TeacherData, CounselingLog, Achievement, Violation, EventLog, AttendanceRecord, AKPDResponse, HomeVisit, ReportAndMutation, SubjectGrades, TDA, AKPDQuestion } from '../types';
import { ArrowLeft, User, Hash, Plus, X, FileDown, CalendarDays, Trash2, Edit, FileText, Sparkles, Loader2, Sheet, Download, MessageCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2pdf from 'html2pdf.js';
import { domToCanvas } from 'modern-screenshot';
import { GoogleGenAI } from "@google/genai";
import { AKPD_QUESTIONS } from '../constants';
import { formatAcademicTitle } from '../src/lib/nameFormatter';
import AkpdSheetIntegration from './AkpdSheetIntegration';

interface StudentPersonalBookProps {
  student?: Student;
  students: Student[];
  counselingLogs: CounselingLog[];
  achievements: Achievement[];
  violations: Violation[];
  eventLogs: EventLog[];
  attendanceRecords: AttendanceRecord[];
  akpdResponses: AKPDResponse[];
  akpdQuestions?: AKPDQuestion[];
  homeVisits: HomeVisit[];
  tdaRecords: TDA[];
  reportAndMutations: ReportAndMutation[];
  setView: (v: ViewMode) => void;
  teacherData: TeacherData;
  onUpdate: (student: Student) => void;
  onDelete: (id: string) => void;
  onAddAchievement: (achievement: Achievement) => void;
  onAddViolation: (violation: Violation) => void;
  onAddReportMutation: (data: ReportAndMutation) => void;
  onUpdateReportMutation: (data: ReportAndMutation) => void;
  googleFormUrl: string;
  onDownloadExcelTemplate: () => void;
  onUploadExcel: () => void;
  onSelectStudent: (id: string) => void;
}

const formatWhatsAppNumber = (phone?: string) => {
  if (!phone) return null;
  let formatted = phone.replace(/\D/g, '');
  if (formatted.startsWith('0')) {
    formatted = '62' + formatted.substring(1);
  }
  return formatted;
};

const WhatsAppLink = ({ phone, className }: { phone?: string, className?: string }) => {
  const waNumber = formatWhatsAppNumber(phone);
  if (!waNumber) return <span className={className}>{phone || '-'}</span>;
  
  return (
    <a 
      href={`https://wa.me/${waNumber}`} 
      target="_blank" 
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 hover:opacity-80 transition-opacity ${className}`}
      title="Kirim pesan WhatsApp"
    >
      <MessageCircle className="w-3 h-3" />
      <span>{phone}</span>
    </a>
  );
};

const StudentPersonalBook: React.FC<StudentPersonalBookProps> = ({ 
  student: activeStudent, students, counselingLogs, achievements, violations, eventLogs, attendanceRecords, akpdResponses, akpdQuestions, homeVisits, tdaRecords, reportAndMutations, setView, teacherData, onUpdate, onDelete, onAddAchievement, onAddViolation, onAddReportMutation, onUpdateReportMutation, googleFormUrl, onSelectStudent, onDownloadExcelTemplate, onUploadExcel, onSelectStudent: onSelectStudentProp
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showAchievementForm, setShowAchievementForm] = useState(false);
  const [showViolationForm, setShowViolationForm] = useState(false);
  const [showReportMutationForm, setShowReportMutationForm] = useState(false);
  const [showSemester1Form, setShowSemester1Form] = useState(false);
  const [showSemester2Form, setShowSemester2Form] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [reportType, setReportType] = useState<'personal-book' | 'database-siswa'>('personal-book');
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setShowDownloadMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSheetModal, setShowSheetModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const hiddenPrintRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const student = useMemo(() => activeStudent || students.find(s => s.id === selectedStudentId), [activeStudent, students, selectedStudentId]);
  const [formData, setFormData] = useState<Student | null>(student || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const studentCounselingLogs = useMemo(() => counselingLogs.filter(log => log.studentId === student?.id), [counselingLogs, student]);
  const studentViolations = useMemo(() => violations.filter(v => v.studentId === student?.id), [violations, student]);
  const studentAchievements = useMemo(() => achievements.filter(a => a.studentId === student?.id), [achievements, student]);
  const studentAttendance = useMemo(() => attendanceRecords.filter(r => r.studentId === student?.id), [attendanceRecords, student]);

  // Sync local state when activeStudent prop changes
  useEffect(() => {
    if (activeStudent) {
      setSelectedClass(activeStudent.className);
      setSelectedStudentId(activeStudent.id);
      setFormData(activeStudent);
    }
  }, [activeStudent]);

  // Update formData when local student selection changes
  useEffect(() => {
    if (!activeStudent && student) {
        setFormData(student);
    }
  }, [student, activeStudent]);

  const currentQuestions = akpdQuestions && akpdQuestions.length > 0 ? akpdQuestions : AKPD_QUESTIONS;

  const handleDownloadAkpdPdf = () => {
    if (!student || studentAkpd.length === 0) {
      showToast('Tidak ada data AKPD untuk diunduh.');
      return;
    }

    const doc = new jsPDF();
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxLineWidth = pageWidth - margin * 2;
    
    doc.setFontSize(16);
    doc.text(`Hasil Analisis AKPD - ${student.name}`, margin, margin + 5);
    
    doc.setFontSize(10);
    doc.text(`Kelas: ${student.className || '-'}`, margin, margin + 12);
    doc.text(`NIS/NISN: ${student.nis || '-'} / ${student.nisn || '-'}`, margin, margin + 17);
    
    doc.setFontSize(12);
    let yPos = margin + 30;
    
    studentAkpd.forEach((q, i) => {
      const text = `${i + 1}. ${q.text}`;
      const lines = doc.splitTextToSize(text, maxLineWidth);
      
      // Check if we need a new page
      if (yPos + (lines.length * 7) > pageHeight - margin) {
        doc.addPage();
        yPos = margin + 10;
      }
      
      doc.text(lines, margin, yPos);
      yPos += (lines.length * 7) + 3; // Add some spacing between items
    });

    doc.save(`AKPD_${student.name}.pdf`);
    showToast('Berhasil mendownload PDF AKPD!');
  };

  const studentAkpd = useMemo(() => {
    if (!student) return [];
    const response = akpdResponses.find(r => r.studentId === student.id);
    if (!response) return [];
    
    const problems = response.responses
      .map((isProblem, index) => isProblem ? currentQuestions[index] : null)
      .filter(Boolean) as typeof currentQuestions;
      
    return problems; 
  }, [akpdResponses, student, currentQuestions]);

  const subjects = useMemo(() => {
    if (teacherData.subjects && teacherData.subjects.length > 0) {
      return teacherData.subjects;
    }
    return [
      { id: 'agama', label: 'Pend. Agama' },
      { id: 'pancasila', label: 'Pend. Pancasila' },
      { id: 'bahasaIndonesia', label: 'B. Indonesia' },
      { id: 'matematika', label: 'Matematika' },
      { id: 'ipa', label: 'IPA' },
      { id: 'ips', label: 'IPS' },
      { id: 'bahasaInggris', label: 'B. Inggris' },
      { id: 'pjok', label: 'PJOK' },
      { id: 'informatika', label: 'Informatika' },
      { id: 'seniBudaya', label: 'Seni Budaya' },
      { id: 'mulok', label: 'Mulok' }
    ];
  }, [teacherData.subjects]);

  const analyzeStudentData = async (semester: number) => {
    if (!student) return;
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const studentContext = {
        identitas: {
          nama: student.name,
          gender: student.gender,
          kelas: student.className,
          hobi: student.hobby,
          citaCita: student.ambition
        },
        akpd: studentAkpd.map(q => q.text),
        absensi: attendanceRecords.filter(r => r.studentId === student.id),
        prestasi: achievements.filter(a => a.studentId === student.id),
        kasus: violations.filter(v => v.studentId === student.id),
        konseling: counselingLogs.filter(l => l.studentId === student.id),
        homeVisit: homeVisits.filter(v => v.studentId === student.id)
      };

      const prompt = `Sebagai Guru BK (Bimbingan Konseling), berikan analisis singkat dan rekomendasi catatan perkembangan untuk siswa berikut di Semester ${semester}. 
      Gunakan bahasa Indonesia yang profesional, empatik, dan konstruktif.
      
      Data Siswa:
      ${JSON.stringify(studentContext, null, 2)}
      
      Berikan catatan yang mencakup:
      1. Ringkasan perkembangan (akademik/non-akademik/perilaku).
      2. Hal positif yang perlu dipertahankan.
      3. Area yang perlu ditingkatkan atau perhatian khusus.
      4. Rekomendasi tindakan selanjutnya.
      
      Catatan harus ringkas (maksimal 150 kata).`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const recommendation = response.text;
      if (recommendation) {
        if (semester === 1) {
          setFormData(prev => ({ ...prev!, semester1Note: recommendation }));
        } else {
          setFormData(prev => ({ ...prev!, semester2Note: recommendation }));
        }
      }
    } catch (error) {
      console.error('AI Analysis Error:', error);
      showToast('Gagal melakukan analisis AI. Silakan coba lagi.');
    } finally {
      setIsAnalyzing(false);
    }
  };
  const [achievementData, setAchievementData] = useState<Partial<Achievement>>({
    date: new Date().toISOString().split('T')[0],
    achievement: '',
    level: 'sekolah',
    description: ''
  });
  const [violationData, setViolationData] = useState<Partial<Violation>>({
    date: new Date().toISOString().split('T')[0],
    violation: '',
    level: 'ringan',
    actionTaken: '',
    description: ''
  });
  const [reportMutationData, setReportMutationData] = useState<Partial<ReportAndMutation>>({
    customGrades: {},
    mutationDate: '', mutationDestination: '', mutationReason: '', notes: ''
  });

  const [reportClass, setReportClass] = useState<string>('');
  const [reportSemester, setReportSemester] = useState<'semester1' | 'semester2'>('semester1');

  const handleSubjectGradeChange = (subjectId: string, value: string) => {
    if (!reportClass.trim()) {
      showToast('Silakan isi kelas terlebih dahulu.');
      return;
    }

    setReportMutationData(prev => {
      const customGrades = { ...(prev.customGrades || {}) };
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (formData) setFormData(prev => ({ ...prev!, [name]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData) return;
      
      if (!formData.name?.trim()) {
        showToast('Nama lengkap harus diisi');
        return;
      }

      onUpdate(formData);
      setIsEditing(false);
      showToast('Data siswa berhasil diperbarui');
    } catch (error) {
      console.error('Error updating student:', error);
      showToast('Gagal memperbarui data siswa');
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (student) {
      onDelete(student.id);
      setView(ViewMode.STUDENT_LIST);
    }
    setShowDeleteConfirm(false);
  };

  const classes = useMemo(() => Array.from(new Set(students.map(s => s.className))).sort(), [students]);
  const studentsInClass = useMemo(() => {
    if (selectedClass === 'ALL') return students.sort((a, b) => a.name.localeCompare(b.name));
    return students.filter(s => s.className === selectedClass).sort((a, b) => a.name.localeCompare(b.name));
  }, [students, selectedClass]);



  const handleAchievementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!student) return;
      
      if (!achievementData.achievement?.trim()) {
        showToast('Nama prestasi harus diisi');
        return;
      }

      onAddAchievement({
        ...achievementData,
        id: Date.now().toString(),
        studentId: student.id
      } as Achievement);
      setShowAchievementForm(false);
      setAchievementData({
        date: new Date().toISOString().split('T')[0],
        achievement: '',
        level: 'sekolah',
        description: ''
      });
      showToast('Prestasi berhasil ditambahkan');
    } catch (error) {
      console.error('Error adding achievement:', error);
      showToast('Gagal menambahkan prestasi');
    }
  };

  const handleViolationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!student) return;

      if (!violationData.violation?.trim()) {
        showToast('Nama pelanggaran/kasus harus diisi');
        return;
      }

      onAddViolation({
        ...violationData,
        id: Date.now().toString(),
        studentId: student.id
      } as Violation);
      setShowViolationForm(false);
      setViolationData({
        date: new Date().toISOString().split('T')[0],
        violation: '',
        level: 'ringan',
        actionTaken: '',
        description: ''
      });
      showToast('Catatan kasus berhasil ditambahkan');
    } catch (error) {
      console.error('Error adding violation:', error);
      showToast('Gagal menambahkan catatan kasus');
    }
  };

  const handleReportMutationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!student) return;
      
      if (!reportClass.trim()) {
        showToast('Kelas harus diisi');
        return;
      }

      const existingRecord = reportAndMutations.find(r => r.studentId === student.id);
      
      if (existingRecord) {
        onUpdateReportMutation({
          ...existingRecord,
          ...reportMutationData
        } as ReportAndMutation);
      } else {
        onAddReportMutation({
          ...reportMutationData,
          id: Date.now().toString(),
          studentId: student.id
        } as ReportAndMutation);
      }
      
      setShowReportMutationForm(false);
      showToast('Data nilai berhasil disimpan');
    } catch (error) {
      console.error('Error adding report mutation:', error);
      showToast('Gagal menyimpan data nilai');
    }
  };

  const openReportMutationForm = () => {
    if (!student) return;
    const existingRecord = reportAndMutations.find(r => r.studentId === student.id);
    if (existingRecord) {
      const customGrades = { ...(existingRecord.customGrades || {}) };
      
      // Migrate legacy data if it exists and hasn't been migrated
      if (existingRecord.grade7 && Object.keys(existingRecord.grade7).length > 0 && !customGrades['VII']) customGrades['VII'] = existingRecord.grade7;
      if (existingRecord.grade8 && Object.keys(existingRecord.grade8).length > 0 && !customGrades['VIII']) customGrades['VIII'] = existingRecord.grade8;
      if (existingRecord.grade9 && Object.keys(existingRecord.grade9).length > 0 && !customGrades['IX']) customGrades['IX'] = existingRecord.grade9;

      setReportMutationData({
        ...existingRecord,
        customGrades
      });
      
      const availableClasses = Object.keys(customGrades);
      setReportClass(availableClasses.length > 0 ? availableClasses[0] : '');
    } else {
      setReportMutationData({
        customGrades: {},
        mutationDate: '', mutationDestination: '', mutationReason: '', notes: ''
      });
      setReportClass('');
    }
    setShowReportMutationForm(true);
  };

  const formatDateIndo = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const [year, month, day] = dateStr.split('-');
      return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
    } catch (e) { return dateStr; }
  };

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return '-';
    try {
      const b = new Date(birthDate);
      if (isNaN(b.getTime())) return '-';
      const t = new Date();
      let y = t.getFullYear() - b.getFullYear();
      let m = t.getMonth() - b.getMonth();
      let d = t.getDate() - b.getDate();
      if (m < 0 || (m === 0 && d < 0)) { y--; }
      const lastB = new Date(b);
      lastB.setFullYear(b.getFullYear() + y);
      const diff = Math.floor((t.getTime() - lastB.getTime()) / (1000 * 60 * 60 * 24));
      return y >= 0 ? `${y} tahun ${diff} hari` : '-';
    } catch (e) {
      return '-';
    }
  };

  const handleExcelExport = () => {
    if (!student) return;
    const wb = XLSX.utils.book_new();

    // --- DATA DIRI SHEET ---
    const studentData = [
      { Key: 'NO. ABSEN', Value: student.attendanceNumber || '-' },
      { Key: 'NAMA SISWA', Value: student.name },
      { Key: 'JENIS KELAMIN', Value: student.gender },
      { Key: 'KELAS', Value: student.className },
      { Key: 'NAMA PANGGILAN', Value: student.nickname || '-' },
      { Key: 'ALAMAT', Value: student.address },
      { Key: 'KOTA / LUAR KOTA', Value: student.domicile || '-' },
      { Key: 'NOMOR TELEPON / WA ORANG TUA', Value: student.parentPhoneWA || '-' },
      { Key: 'TEMPAT LAHIR', Value: student.birthPlace || '-' },
      { Key: 'TANGGAL LAHIR', Value: formatDateIndo(student.birthDate) },
      { Key: 'UMUR', Value: calculateAge(student.birthDate) },
      { Key: 'GOLONGAN DARAH', Value: student.bloodType || '-' },
      { Key: 'AGAMA', Value: student.religion || '-' },
      { Key: 'BAHASA SEHARI - HARI', Value: '' }, // Placeholder
      { Key: 'SEKARANG TINGGAL DENGAN', Value: student.livingWith || '-' },
    ];
    const wsStudent = XLSX.utils.json_to_sheet(studentData, { header: ["Key", "Value"], skipHeader: true });
    XLSX.utils.book_append_sheet(wb, wsStudent, 'DATA DIRI');

    // --- DATA AYAH SHEET ---
    const fatherData = [
        { Key: 'NAMA AYAH', Value: student.fatherName || '-' },
        { Key: 'ALAMAT', Value: student.parentAddress || '-' },
        { Key: 'NOMOR TELEPON', Value: student.fatherPhone || '-' },
        { Key: 'AGAMA', Value: student.fatherReligion || '-' },
        { Key: 'PENDIDIKAN TERAKHIR', Value: student.fatherEducation || '-' },
        { Key: 'PEKERJAAN', Value: student.fatherJob || '-' },
    ];
    const wsFather = XLSX.utils.json_to_sheet(fatherData, { header: ["Key", "Value"], skipHeader: true });
    XLSX.utils.book_append_sheet(wb, wsFather, 'DATA AYAH');

    // --- DATA IBU SHEET ---
    const motherData = [
        { Key: 'NAMA IBU KANDUNG', Value: student.motherName || '-' },
        { Key: 'ALAMAT', Value: student.parentAddress || '-' },
        { Key: 'NOMOR TELEPON', Value: student.motherPhone || '-' },
        { Key: 'AGAMA', Value: student.motherReligion || '-' },
        { Key: 'PENDIDIKAN TERAKHIR', Value: student.motherEducation || '-' },
        { Key: 'PEKERJAAN', Value: student.motherJob || '-' },
    ];
    const wsMother = XLSX.utils.json_to_sheet(motherData, { header: ["Key", "Value"], skipHeader: true });
    XLSX.utils.book_append_sheet(wb, wsMother, 'DATA IBU');

    XLSX.writeFile(wb, `Data Pribadi - ${student.name}.xlsx`);
  };

  const openGoogleForm = () => {
    if (googleFormUrl) {
      window.open(googleFormUrl, '_blank');
    } else {
      showToast('Silakan atur URL Google Form di menu Pengaturan terlebih dahulu.');
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('personal-book-print-area');
    const wrapper = document.getElementById('hidden-print-wrapper');
    if (!element || !wrapper) return;
    
    showToast('Sedang memproses PDF...');
    
    // Temporarily move on-screen to ensure html2canvas captures it properly
    const originalLeft = wrapper.style.left;
    const originalTop = wrapper.style.top;
    const originalZIndex = wrapper.style.zIndex;
    
    wrapper.style.left = '0';
    wrapper.style.top = '0';
    wrapper.style.zIndex = '-1000'; // Keep it behind other elements
    
    // Temporarily adjust styles for html2pdf
    const originalPadding = element.style.padding;
    const originalWidth = element.style.width;
    const originalMinHeight = element.style.minHeight;
    const originalBoxShadow = element.style.boxShadow;
    
    // Remove padding from the element itself so html2pdf can apply it as margins
    // We target the inner .print-page-standard
    const printPage = element.querySelector('.print-page-standard') as HTMLElement;
    let originalPagePadding = '';
    let originalPageWidth = '';
    let originalPageMinHeight = '';
    let originalPageBoxShadow = '';
    
    if (printPage) {
      originalPagePadding = printPage.style.padding;
      originalPageWidth = printPage.style.width;
      originalPageMinHeight = printPage.style.minHeight;
      originalPageBoxShadow = printPage.style.boxShadow;
      
      printPage.style.padding = '0';
      printPage.style.width = '165.9mm'; // 215.9 - 30 (left) - 20 (right)
      printPage.style.minHeight = 'auto';
      printPage.style.boxShadow = 'none';
    }

    const opt = {
      margin:       [20, 20, 20, 30] as [number, number, number, number], // [top, right, bottom, left] in mm
      filename:     `${reportType === 'database-siswa' ? 'Database_Siswa' : 'Buku_Pribadi'}_${student?.name}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { 
        scale: 2, 
        useCORS: true, 
        allowTaint: true, 
        windowWidth: 1000,
        onclone: (document: Document) => {
          const styles = document.querySelectorAll('style');
          styles.forEach(s => {
            if (s.innerHTML.includes('oklch')) {
              s.innerHTML = s.innerHTML.replace(/oklch\([^)]+\)/g, 'inherit');
            }
          });
          const allElements = document.querySelectorAll('*');
          allElements.forEach(el => {
            const style = el.getAttribute('style');
            if (style && style.includes('oklch')) {
              el.setAttribute('style', style.replace(/oklch\([^)]+\)/g, 'inherit'));
            }
          });
        }
      },
      jsPDF:        { unit: 'mm', format: [215.9, 355.6] as [number, number], orientation: 'portrait' as const },
      pagebreak:    { mode: ['css', 'legacy'], avoid: '.avoid-break' }
    };

    try {
      await html2pdf().set(opt).from(element).save();
      showToast('Berhasil mendownload PDF!');
    } catch (error) {
      console.error('PDF Error:', error);
      showToast('Gagal mendownload PDF.');
    } finally {
      // Restore styles
      wrapper.style.left = originalLeft;
      wrapper.style.top = originalTop;
      wrapper.style.zIndex = originalZIndex;

      if (printPage) {
        printPage.style.padding = originalPagePadding;
        printPage.style.width = originalPageWidth;
        printPage.style.minHeight = originalPageMinHeight;
        printPage.style.boxShadow = originalPageBoxShadow;
      }
    }
  };

  const handleDownloadWord = () => {
    const element = document.getElementById('personal-book-print-area');
    if (!element) return;
    
    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Export HTML to Word</title>
        <style>
          @page Section1 {
            size: 21.59cm 35.56cm;
            margin: 2cm 2cm 2cm 3cm;
            mso-header-margin: 35.4pt;
            mso-footer-margin: 35.4pt;
            mso-paper-source: 0;
          }
          div.Section1 {
            page: Section1;
          }
          body { 
            font-family: "Arial", sans-serif; 
            font-size: 12pt; 
            line-height: 1.2;
          }
          p, td, th, span, li, h1, h2, h3, h4, h5 { font-size: 12pt; margin: 0; }
          .school-name { font-size: 14pt !important; font-weight: bold; }
          .school-address { font-size: 10pt !important; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 10pt; }
          .data-table td, .data-table th { border: 1pt solid black; padding: 5pt; }
          .layout-table td, .layout-table th { border: none !important; padding: 2pt; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .underline { text-decoration: underline; }
          .uppercase { text-transform: uppercase; }
          .no-print { display: none; }
          .page-break { page-break-before: always; }
        </style>
      </head>
      <body>
        <div class="Section1">
          ${element.innerHTML}
        </div>
      </body>
      </html>
    `;
    
    const blob = new Blob(['\ufeff', html], {
      type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportType === 'database-siswa' ? 'Database_Siswa' : 'Buku_Pribadi'}_${student?.name}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Berhasil mendownload Word!');
  };

  const getStudentClassNames = (studentId: string) => {
    const record = reportAndMutations.find(r => r.studentId === studentId);
    if (!record) return ['VII', 'VIII', 'IX'];
    
    let classes = record.customGrades ? Object.keys(record.customGrades) : [];
    if (classes.length === 0) {
        if (record.grade7 && Object.keys(record.grade7).length > 0) classes.push('VII');
        if (record.grade8 && Object.keys(record.grade8).length > 0) classes.push('VIII');
        if (record.grade9 && Object.keys(record.grade9).length > 0) classes.push('IX');
    }
    if (classes.length === 0) return ['VII', 'VIII', 'IX'];
    
    const romanToNum: Record<string, number> = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12 };
    const getVal = (str: string) => {
        const upper = str.toUpperCase().trim();
        if (romanToNum[upper]) return romanToNum[upper];
        const numMatch = str.match(/\d+/);
        if (numMatch) return parseInt(numMatch[0]);
        return str;
    };
    
    return classes.sort((a, b) => {
        const valA = getVal(a);
        const valB = getVal(b);
        if (typeof valA === 'number' && typeof valB === 'number') return valA - valB;
        return String(a).localeCompare(String(b));
    });
  };

  const studentClassNames = student ? getStudentClassNames(student.id) : ['VII', 'VIII', 'IX'];

  const renderPrintLayout = (isPreview = false, includeId = false) => {
    if (!student) return null;
    
    const isDatabaseSiswa = reportType === 'database-siswa';

    // Photo size: 3x4 cm normally, 50% smaller (1.5x2 cm) in preview
    const photoStyle = isPreview 
      ? { width: '1.5cm', height: '2cm' } 
      : { width: '3cm', height: '4cm' };

    const colorFixStyle = (
      <style>{`
        .print-container, .print-container * {
          color-scheme: light;
          font-family: "Times New Roman", Times, serif !important;
        }
        .print-container, 
        .print-container p, 
        .print-container td, 
        .print-container th, 
        .print-container span, 
        .print-container li,
        .print-container h1,
        .print-container h2,
        .print-container h3,
        .print-container h4,
        .print-container h5 {
          font-size: 12pt !important;
        }
        .print-container .school-name, .print-container .school-name * {
          font-size: 14pt !important;
          font-weight: bold !important;
        }
        .print-container .school-address, .print-container .school-address * {
          font-size: 10pt !important;
        }
        .print-container {
          --color-slate-50: #f8fafc;
          --color-slate-100: #f1f5f9;
          --color-slate-200: #e2e8f0;
          --color-slate-300: #cbd5e1;
          --color-slate-400: #94a3b8;
          --color-slate-500: #64748b;
          --color-slate-600: #475569;
          --color-slate-700: #334155;
          --color-slate-800: #1e293b;
          --color-slate-900: #0f172a;
          
          --color-blue-50: #eff6ff;
          --color-blue-100: #dbeafe;
          --color-blue-200: #bfdbfe;
          --color-blue-300: #93c5fd;
          --color-blue-400: #60a5fa;
          --color-blue-500: #3b82f6;
          --color-blue-600: #2563eb;
          --color-blue-700: #1d4ed8;
          --color-blue-800: #1e40af;
          --color-blue-900: #1e3a8a;
          
          --color-amber-50: #fffbeb;
          --color-amber-100: #fef3c7;
          --color-amber-200: #fde68a;
          --color-amber-300: #fcd34d;
          --color-amber-400: #fbbf24;
          --color-amber-500: #f59e0b;
          --color-amber-600: #d97706;
          --color-amber-700: #b45309;
          --color-amber-800: #92400e;
          --color-amber-900: #78350f;
          
          --color-rose-50: #fff1f2;
          --color-rose-100: #ffe4e6;
          --color-rose-200: #fecdd3;
          --color-rose-300: #fda4af;
          --color-rose-400: #fb7185;
          --color-rose-500: #f43f5e;
          --color-rose-600: #e11d48;
          --color-rose-700: #be123c;
          --color-rose-800: #9f1239;
          --color-rose-900: #881337;
          
          --color-emerald-50: #ecfdf5;
          --color-emerald-100: #d1fae5;
          --color-emerald-200: #a7f3d0;
          --color-emerald-300: #6ee7b7;
          --color-emerald-400: #34d399;
          --color-emerald-500: #10b981;
          --color-emerald-600: #059669;
          --color-emerald-700: #047857;
          --color-emerald-800: #065f46;
          --color-emerald-900: #064e3b;
          
          --color-violet-50: #f5f3ff;
          --color-violet-100: #ede9fe;
          --color-violet-200: #ddd6fe;
          --color-violet-300: #c4b5fd;
          --color-violet-400: #a78bfa;
          --color-violet-500: #8b5cf6;
          --color-violet-600: #7c3aed;
          --color-violet-700: #6d28d9;
          --color-violet-800: #5b21b6;
          --color-violet-900: #4c1d95;
          
          --color-indigo-50: #eef2ff;
          --color-indigo-100: #e0e7ff;
          --color-indigo-200: #c7d2fe;
          --color-indigo-300: #a5b4fc;
          --color-indigo-400: #818cf8;
          --color-indigo-500: #6366f1;
          --color-indigo-600: #4f46e5;
          --color-indigo-700: #4338ca;
          --color-indigo-800: #3730a3;
          --color-indigo-900: #312e81;
          
          --color-green-50: #f0fdf4;
          --color-green-100: #dcfce7;
          --color-green-200: #bbf7d0;
          --color-green-300: #86efac;
          --color-green-400: #4ade80;
          --color-green-500: #22c55e;
          --color-green-600: #16a34a;
          --color-green-700: #15803d;
          --color-green-800: #166534;
          --color-green-900: #14532d;
          
          --color-yellow-50: #fefce8;
          --color-yellow-100: #fef9c3;
          --color-yellow-200: #fef08a;
          --color-yellow-300: #fde047;
          --color-yellow-400: #facc15;
          --color-yellow-500: #eab308;
          --color-yellow-600: #ca8a04;
          --color-yellow-700: #a16207;
          --color-yellow-800: #854d0e;
          --color-yellow-900: #713f12;
          
          --color-orange-50: #fff7ed;
          --color-orange-100: #ffedd5;
          --color-orange-200: #fed7aa;
          --color-orange-300: #fdba74;
          --color-orange-400: #fb923c;
          --color-orange-500: #f97316;
          --color-orange-600: #ea580c;
          --color-orange-700: #c2410c;
          --color-orange-800: #9a3412;
          --color-orange-900: #7c2d12;
          
          --color-red-50: #fef2f2;
          --color-red-100: #fee2e2;
          --color-red-200: #fecaca;
          --color-red-300: #fca5a5;
          --color-red-400: #f87171;
          --color-red-500: #ef4444;
          --color-red-600: #dc2626;
          --color-red-700: #b91c1c;
          --color-red-800: #991b1b;
          --color-red-900: #7f1d1d;
          
          --color-pink-50: #fdf2f8;
          --color-pink-100: #fce7f3;
          --color-pink-200: #fbcfe8;
          --color-pink-300: #f9a8d4;
          --color-pink-400: #f472b6;
          --color-pink-500: #ec4899;
          --color-pink-600: #db2777;
          --color-pink-700: #be185d;
          --color-pink-800: #9d174d;
          --color-pink-900: #831843;
          
          --color-purple-50: #faf5ff;
          --color-purple-100: #f3e8ff;
          --color-purple-200: #e9d5ff;
          --color-purple-300: #d8b4fe;
          --color-purple-400: #c084fc;
          --color-purple-500: #a855f7;
          --color-purple-600: #9333ea;
          --color-purple-700: #7e22ce;
          --color-purple-800: #6b21a8;
          --color-purple-900: #581c87;
          
          --color-white: #ffffff;
          --color-black: #000000;
          --color-transparent: transparent;
        }
        
        .print-container.bg-white, .print-container .bg-white { background-color: #ffffff !important; }
        .print-container.text-black, .print-container .text-black { color: #000000 !important; }
        .print-container .border-black { border-color: #000000 !important; }
        .print-container .border-b-2.border-black { border-bottom-color: #000000 !important; }
        .print-container .border-l-4.border-black { border-left-color: #000000 !important; }
        
        .print-container .text-slate-500 { color: #64748b !important; }
        .print-container .text-slate-600 { color: #475569 !important; }
        .print-container .text-slate-800 { color: #1e293b !important; }
        .print-container .bg-slate-50 { background-color: #f8fafc !important; }
        .print-container .bg-slate-100 { background-color: #f1f5f9 !important; }
        .print-container .border-slate-200 { border-color: #e2e8f0 !important; }
        .print-container .border-b.border-slate-200 { border-bottom-color: #e2e8f0 !important; }
        .print-container .border-slate-300 { border-color: #cbd5e1 !important; }
        .print-container .border-b-2.border-slate-300 { border-bottom-color: #cbd5e1 !important; }
        
        .print-container .text-blue-400 { color: #60a5fa !important; }
        .print-container .text-blue-500 { color: #3b82f6 !important; }
        .print-container .text-blue-600 { color: #2563eb !important; }
        .print-container .border-blue-600 { border-color: #2563eb !important; }
        .print-container .border-l-4.border-blue-600 { border-left-color: #2563eb !important; }
        
        .print-container .text-amber-400 { color: #fbbf24 !important; }
        .print-container .text-amber-500 { color: #f59e0b !important; }
        .print-container .text-amber-600 { color: #d97706 !important; }
        .print-container .border-amber-600 { border-color: #d97706 !important; }
        .print-container .border-l-4.border-amber-600 { border-left-color: #d97706 !important; }
        
        .print-container .text-rose-400 { color: #fb7185 !important; }
        .print-container .text-rose-500 { color: #f43f5e !important; }
        .print-container .text-rose-600 { color: #e11d48 !important; }
        .print-container .border-rose-600 { border-color: #e11d48 !important; }
        .print-container .border-l-4.border-rose-600 { border-left-color: #e11d48 !important; }
        
        .print-container .text-emerald-400 { color: #34d399 !important; }
        .print-container .text-emerald-500 { color: #10b981 !important; }
        .print-container .text-emerald-600 { color: #059669 !important; }
        .print-container .border-emerald-600 { border-color: #059669 !important; }
        .print-container .border-l-4.border-emerald-600 { border-left-color: #059669 !important; }
        
        .print-container .text-violet-400 { color: #a78bfa !important; }
        .print-container .text-violet-500 { color: #8b5cf6 !important; }
        .print-container .text-violet-600 { color: #7c3aed !important; }
        .print-container .border-violet-600 { border-color: #7c3aed !important; }
        .print-container .border-l-4.border-violet-600 { border-left-color: #7c3aed !important; }
        
        .print-container .text-indigo-400 { color: #818cf8 !important; }
        .print-container .text-indigo-500 { color: #6366f1 !important; }
        .print-container .text-indigo-600 { color: #4f46e5 !important; }
        .print-container .border-indigo-600 { border-color: #4f46e5 !important; }
        .print-container .border-l-4.border-indigo-600 { border-left-color: #4f46e5 !important; }
        
        .print-container .text-green-400 { color: #4ade80 !important; }
        .print-container .text-green-500 { color: #22c55e !important; }
        .print-container .text-green-600 { color: #16a34a !important; }
        .print-container .border-green-600 { border-color: #16a34a !important; }
        .print-container .border-l-4.border-green-600 { border-left-color: #16a34a !important; }
        
        .print-container .text-yellow-400 { color: #facc15 !important; }
        .print-container .text-yellow-500 { color: #eab308 !important; }
        .print-container .text-yellow-600 { color: #ca8a04 !important; }
        .print-container .border-yellow-600 { border-color: #ca8a04 !important; }
        .print-container .border-l-4.border-yellow-600 { border-left-color: #ca8a04 !important; }
        
        .print-container .text-orange-400 { color: #fb923c !important; }
        .print-container .text-orange-500 { color: #f97316 !important; }
        .print-container .text-orange-600 { color: #ea580c !important; }
        .print-container .border-orange-600 { border-color: #ea580c !important; }
        .print-container .border-l-4.border-orange-600 { border-left-color: #ea580c !important; }
        
        .print-container .text-red-400 { color: #f87171 !important; }
        .print-container .text-red-500 { color: #ef4444 !important; }
        .print-container .text-red-600 { color: #dc2626 !important; }
        .print-container .border-red-600 { border-color: #dc2626 !important; }
        .print-container .border-l-4.border-red-600 { border-left-color: #dc2626 !important; }
        
        .print-container .text-pink-400 { color: #f472b6 !important; }
        .print-container .text-pink-500 { color: #ec4899 !important; }
        .print-container .text-pink-600 { color: #db2777 !important; }
        
        .print-page-standard {
          width: 215.9mm;
          min-height: 355.6mm;
          padding: 20mm 20mm 20mm 30mm; /* Standard Indonesian Official Margins: T:2, B:2, R:2, L:3 */
          background: white;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          margin: 0 auto;
          box-sizing: border-box;
          position: relative;
        }

        .preview-mode .print-page-standard {
          transform: scale(0.55);
          transform-origin: top center;
          margin-bottom: -160mm;
        }

        .page-break {
          page-break-before: always;
        }
        
        .avoid-break {
          page-break-inside: avoid;
        }

        .print-only-wrapper {
          display: none;
        }

        @media print {
          body * { visibility: hidden !important; }
          .print-only-wrapper, .print-only-wrapper * { visibility: visible !important; }
          .print-only-wrapper {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          @page {
            size: 215.9mm 355.6mm portrait;
            margin: 20mm 20mm 20mm 30mm; /* Standard Indonesian Official Margins */
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-page-standard {
            box-shadow: none !important;
            margin: 0 !important;
            width: 100% !important;
            min-height: auto !important;
            padding: 0 !important; /* Padding removed, @page handles margins */
          }
          .no-print { display: none !important; }
        }
      `}</style>
    );

    if (isDatabaseSiswa) {
        return (
            <div id={includeId ? "personal-book-print-area" : undefined} className={`bg-white text-black p-0 font-sans leading-tight print-container relative text-center ${isPreview ? 'preview-mode' : ''}`}>
                {colorFixStyle}
                <div className="print-page-standard">
                    <div className="print-content-standard">
                        {/* Kop Surat */}
                        <table className="layout-table w-full font-bold mx-auto" style={{ width: '100%' }}>
                            <tbody>
                                <tr>
                                    <td style={{ width: '80px', verticalAlign: 'middle', textAlign: 'center' }}>
                                        {teacherData.logoGov && <img src={teacherData.logoGov} style={{ width: '60px', height: '60px', objectFit: 'contain' }} className="mx-auto" />}
                                    </td>
                                    <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                        <h1 style={{ fontSize: '12pt', margin: 0, textTransform: 'uppercase', lineHeight: '1.2', textAlign: 'center' }}>{teacherData.govOrFoundation?.trim() || "PEMERINTAH DAERAH"}</h1>
                                        <h1 style={{ fontSize: '12pt', margin: 0, textTransform: 'uppercase', lineHeight: '1.2', textAlign: 'center' }}>{teacherData.deptOrFoundation?.trim() || "DINAS PENDIDIKAN"}</h1>
                                        <h2 className="school-name" style={{ fontSize: '14pt', margin: '2px 0', textTransform: 'uppercase', letterSpacing: '1px', lineHeight: '1.2', textAlign: 'center' }}>{teacherData.school?.trim() || "NAMA SEKOLAH"}</h2>
                                        <p className="school-address" style={{ fontSize: '10pt', margin: '10px 0 0 0', fontStyle: 'normal', lineHeight: '1.2', textAlign: 'center', fontWeight: 'normal' }}>{teacherData.schoolAddress?.trim() || "Alamat Lengkap Sekolah"}</p>
                                    </td>
                                    <td style={{ width: '80px', verticalAlign: 'middle', textAlign: 'center' }}>
                                        {teacherData.logoSchool && <img src={teacherData.logoSchool} style={{ width: '60px', height: '60px', objectFit: 'contain' }} className="mx-auto" />}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <div style={{ borderBottom: '3px double black', margin: '20px 0', width: '100%' }}></div>

                        {/* Judul */}
                        <div className="text-center mb-6 space-y-1" style={{ textAlign: 'center' }}>
                            <h2 className="text-lg font-bold underline uppercase tracking-widest" style={{ textAlign: 'center' }}>DATABASE SISWA</h2>
                            <p className="text-lg font-bold uppercase" style={{ textAlign: 'center' }}>TAHUN PELAJARAN {teacherData.academicYear}</p>
                        </div>

                        {/* Content Sections */}
                        <div className="space-y-6 text-left">
                            {/* A. Identitas */}
                            <section className="space-y-4 avoid-break">
                                <h3 className="text-lg font-bold uppercase border-b border-black pb-1">A. IDENTITAS SISWA</h3>
                                <table className="layout-table w-full">
                                    <tbody>
                                        <tr>
                                            <td style={{ width: '3cm', verticalAlign: 'top' }}>
                                                <div style={{ width: '3cm', height: '4cm', border: '1px solid black', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                                    {student.photo ? <img src={student.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ textAlign: 'center', color: '#ccc', fontSize: '10pt' }}>FOTO<br/>3x4</div>}
                                                </div>
                                            </td>
                                            <td style={{ paddingLeft: '20px', verticalAlign: 'top' }}>
                                                <table className="layout-table w-full" style={{ fontSize: '12pt' }}>
                                                    <tbody>
                                                        <tr><td style={{ padding: '2px 0', width: '180px' }}>Nama Lengkap</td><td style={{ width: '16px' }}>:</td><td style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{student.name}</td></tr>
                                                        <tr><td style={{ padding: '2px 0' }}>NIS / NISN</td><td>:</td><td>{student.nis || '-'} / {student.nisn || '-'}</td></tr>
                                                        <tr><td style={{ padding: '2px 0' }}>Jenis Kelamin</td><td>:</td><td>{student.gender}</td></tr>
                                                        <tr><td style={{ padding: '2px 0' }}>Tempat, Tgl Lahir</td><td>:</td><td>{student.birthPlace || '-'}, {formatDateIndo(student.birthDate)}</td></tr>
                                                        <tr><td style={{ padding: '2px 0' }}>Agama</td><td>:</td><td>{student.religion || '-'}</td></tr>
                                                        <tr><td style={{ padding: '2px 0' }}>Golongan Darah</td><td>:</td><td>{student.bloodType || '-'}</td></tr>
                                                        <tr><td style={{ padding: '2px 0' }}>No. WA / HP</td><td>:</td><td>{student.phone || '-'}</td></tr>
                                                        <tr><td style={{ padding: '2px 0' }}>Kelas / No. Absen</td><td>:</td><td>{student.className} / {student.attendanceNumber || '-'}</td></tr>
                                                        <tr><td style={{ padding: '2px 0', verticalAlign: 'top' }}>Alamat</td><td style={{ verticalAlign: 'top' }}>:</td><td>{student.address || '-'}</td></tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </section>

                            {/* B. Keluarga */}
                            <section className="space-y-2 avoid-break">
                                <h3 className="text-lg font-bold uppercase border-b border-black pb-1">B. LINGKUNGAN KELUARGA</h3>
                                <table className="layout-table w-full" style={{ fontSize: '12pt' }}>
                                    <tbody>
                                        <tr><td style={{ padding: '2px 0', width: '180px' }}>Nama Ayah / Ibu</td><td style={{ width: '16px' }}>:</td><td style={{ fontWeight: 'bold' }}>{student.fatherName || '-'} / {student.motherName || '-'}</td></tr>
                                        <tr><td style={{ padding: '2px 0' }}>Pekerjaan Ayah / Ibu</td><td>:</td><td>{student.fatherJob || '-'} / {student.motherJob || '-'}</td></tr>
                                        <tr><td style={{ padding: '2px 0' }}>Alamat Orang Tua</td><td>:</td><td>{student.parentAddress || '-'}</td></tr>
                                        <tr><td style={{ padding: '2px 0' }}>Nomor Telepon / WA orang tua</td><td>:</td><td>{student.parentPhoneWA || '-'}</td></tr>
                                        <tr><td style={{ padding: '2px 0' }}>Tinggal Bersama</td><td>:</td><td>{student.livingWith || '-'}</td></tr>
                                    </tbody>
                                </table>
                            </section>

                            {/* C. Potensi & Minat */}
                            <section className="space-y-2 avoid-break">
                                <h3 className="text-lg font-bold uppercase border-b border-black pb-1">C. POTENSI & MINAT</h3>
                                <table className="layout-table w-full" style={{ fontSize: '12pt' }}>
                                    <tbody>
                                        <tr><td style={{ padding: '2px 0', width: '180px' }}>Hobi</td><td style={{ width: '16px' }}>:</td><td>{student.hobby || '-'}</td></tr>
                                        <tr><td style={{ padding: '2px 0' }}>Cita-cita</td><td>:</td><td>{student.ambition || '-'}</td></tr>
                                        <tr><td style={{ padding: '2px 0' }}>Mapel Disukai</td><td>:</td><td>{student.favoriteSubject || '-'}</td></tr>
                                        <tr><td style={{ padding: '2px 0' }}>Mapel Tidak Disukai</td><td>:</td><td>{student.dislikedSubject || '-'}</td></tr>
                                        <tr><td style={{ padding: '2px 0' }}>Sekolah Lanjut</td><td>:</td><td>{student.furtherSchool || '-'}</td></tr>
                                        <tr><td style={{ padding: '2px 0' }}>Teman Akrab</td><td>:</td><td>{student.bestFriend || '-'}</td></tr>
                                        <tr><td style={{ padding: '2px 0' }}>Prestasi</td><td>:</td><td>{student.achievements || '-'}</td></tr>
                                        <tr><td style={{ padding: '2px 0' }}>Ekstrakurikuler</td><td>:</td><td>{student.extracurricular || '-'}</td></tr>
                                    </tbody>
                                </table>
                            </section>

                            {/* D. AKPD */}
                            <section className="space-y-2 avoid-break">
                                <div className="flex justify-between items-center border-b-2 border-black pb-1">
                                    <h3 className="text-lg font-black uppercase">D. HASIL AKPD</h3>
                                    {studentAkpd.length > 0 && (
                                        <button onClick={handleDownloadAkpdPdf} className="flex items-center gap-2 text-xs bg-blue-600 text-white px-2 py-1 rounded-lg hover:bg-blue-700 no-print">
                                            <FileDown className="w-3.5 h-3.5" /> Unduh PDF
                                        </button>
                                    )}
                                </div>
                                {studentAkpd.length > 0 ? (
                                    <table className="w-full text-base border-collapse border border-black">
                                        <thead>
                                            <tr className="bg-slate-100">
                                                <th className="border border-black p-1 text-center w-12">No</th>
                                                <th className="border border-black p-1 text-left">Pernyataan</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {studentAkpd.map((q, i) => (
                                                <tr key={i}>
                                                    <td className="border border-black p-1 text-center">{i + 1}</td>
                                                    <td className="border border-black p-1">{q.text}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : <p className="text-base italic">Belum mengisi AKPD.</p>}
                            </section>
                            {showSheetModal && (
                              <AkpdSheetIntegration isOpen={showSheetModal} onClose={() => setShowSheetModal(false)} />
                            )}

                            {/* E. TDA */}
                            <section className="space-y-2 avoid-break">
                                <h3 className="text-lg font-black uppercase border-b-2 border-black pb-1">E. TES DIAGNOSTIK AWAL (TDA)</h3>
                                {(() => {
                                    const tda = tdaRecords.find(r => r.studentId === student.id);
                                    if (!tda) return <p className="text-base italic">Belum ada data TDA.</p>;
                                    return (
                                        <table className="w-full text-base border-collapse border border-black">
                                            <tbody>
                                                <tr><td className="border border-black p-1 font-bold w-48">Gaya Belajar</td><td className="border border-black p-1">{tda.learningStyle}</td></tr>
                                                <tr><td className="border border-black p-1 font-bold">Kepribadian (MBTI)</td><td className="border border-black p-1">{tda.personalityType}</td></tr>
                                                <tr><td className="border border-black p-1 font-bold">Kecerdasan Majemuk</td><td className="border border-black p-1">{tda.multipleIntelligences}</td></tr>
                                                <tr><td className="border border-black p-1 font-bold">Bakat Minat</td><td className="border border-black p-1">{tda.talentInterest}</td></tr>
                                                <tr><td className="border border-black p-1 font-bold">Kunci Karier</td><td className="border border-black p-1">{tda.careerKey}</td></tr>
                                            </tbody>
                                        </table>
                                    );
                                })()}
                            </section>

                            {/* F. Absensi */}
                            <section className="space-y-2 avoid-break">
                                <h3 className="text-lg font-black uppercase border-b-2 border-black pb-1">F. REKAP ABSENSI</h3>
                                <table className="data-table w-full text-left border-collapse border border-black text-base">
                                    <thead>
                                        <tr className="bg-slate-100">
                                            <th className="border border-black p-2 text-center">Semester</th>
                                            <th className="border border-black p-2 text-center text-blue-600">Sakit (S)</th>
                                            <th className="border border-black p-2 text-center text-amber-600">Ijin (I)</th>
                                            <th className="border border-black p-2 text-center text-rose-600">Alpa (A)</th>
                                            <th className="border border-black p-2 text-center text-emerald-600">Disp (D)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="border border-black p-2 text-center font-bold">Ganjil (1)</td>
                                            <td className="border border-black p-2 text-center text-blue-600 font-bold">{attendanceRecords.filter(r => r.studentId === student.id && r.semester === 'Ganjil' && r.status === 'Sakit').length}</td>
                                            <td className="border border-black p-2 text-center text-amber-600 font-bold">{attendanceRecords.filter(r => r.studentId === student.id && r.semester === 'Ganjil' && r.status === 'Ijin').length}</td>
                                            <td className="border border-black p-2 text-center text-rose-600 font-bold">{attendanceRecords.filter(r => r.studentId === student.id && r.semester === 'Ganjil' && r.status === 'Alpa').length}</td>
                                            <td className="border border-black p-2 text-center text-emerald-600 font-bold">{attendanceRecords.filter(r => r.studentId === student.id && r.semester === 'Ganjil' && r.status === 'Dispensasi').length}</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-black p-2 text-center font-bold">Genap (2)</td>
                                            <td className="border border-black p-2 text-center text-blue-600 font-bold">{attendanceRecords.filter(r => r.studentId === student.id && r.semester === 'Genap' && r.status === 'Sakit').length}</td>
                                            <td className="border border-black p-2 text-center text-amber-600 font-bold">{attendanceRecords.filter(r => r.studentId === student.id && r.semester === 'Genap' && r.status === 'Ijin').length}</td>
                                            <td className="border border-black p-2 text-center text-rose-600 font-bold">{attendanceRecords.filter(r => r.studentId === student.id && r.semester === 'Genap' && r.status === 'Alpa').length}</td>
                                            <td className="border border-black p-2 text-center text-emerald-600 font-bold">{attendanceRecords.filter(r => r.studentId === student.id && r.semester === 'Genap' && r.status === 'Dispensasi').length}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </section>

                            {/* G, H, I (Simplified for standard report) */}
                            <div className="grid grid-cols-2 gap-6 avoid-break">
                                <section className="space-y-2">
                                    <h3 className="text-lg font-black uppercase border-b-2 border-black pb-1">G. PRESTASI</h3>
                                    <div className="space-y-1">
                                        {achievements.length > 0 ? achievements.map(ach => (
                                            <div key={ach.id} className="text-base">[{ach.date}] {ach.achievement}</div>
                                        )) : <p className="text-base italic">Tidak ada data.</p>}
                                    </div>
                                </section>
                                <section className="space-y-2">
                                    <h3 className="text-lg font-black uppercase border-b-2 border-black pb-1">H. KASUS</h3>
                                    <div className="space-y-1">
                                        {violations.length > 0 ? violations.map(vio => (
                                            <div key={vio.id} className="text-base">[{vio.date}] {vio.violation}</div>
                                        )) : <p className="text-base italic">Tidak ada data.</p>}
                                    </div>
                                </section>
                            </div>

                            {/* I. Nilai Raport */}
                            <section className="space-y-2 avoid-break">
                                <h3 className="text-lg font-black uppercase border-b-2 border-black pb-1">I. NILAI RAPORT</h3>
                                <table className="data-table w-full text-left border-collapse border border-black text-base">
                                    <thead>
                                        <tr className="bg-slate-100">
                                            <th className="border border-black p-1 text-center" rowSpan={2}>Mata Pelajaran</th>
                                            {studentClassNames.map(c => (
                                                <th key={c} className="border border-black p-1 text-center" colSpan={2}>{c}</th>
                                            ))}
                                        </tr>
                                        <tr className="bg-slate-100">
                                            {studentClassNames.map(c => (
                                                <React.Fragment key={c}>
                                                    <th className="border border-black p-1 text-center">1</th>
                                                    <th className="border border-black p-1 text-center">2</th>
                                                </React.Fragment>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {subjects.map(subject => {
                                            const record = reportAndMutations.find(r => r.studentId === student.id);
                                            return (
                                                <tr key={subject.id}>
                                                    <td className="border border-black p-1 font-bold">{subject.label}</td>
                                                    {studentClassNames.map(c => {
                                                        const classData = record?.customGrades?.[c] || (c === 'VII' ? record?.grade7 : c === 'VIII' ? record?.grade8 : c === 'IX' ? record?.grade9 : undefined);
                                                        return (
                                                            <React.Fragment key={c}>
                                                                <td className="border border-black p-1 text-center">{classData?.semester1?.[subject.id] || '-'}</td>
                                                                <td className="border border-black p-1 text-center">{classData?.semester2?.[subject.id] || '-'}</td>
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </section>

                            {/* Tanda Tangan */}
                            <table className="layout-table avoid-break" style={{ width: '100%', marginTop: '48px' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ width: '60%' }}></td>
                                        <td style={{ width: '40%', textAlign: 'center' }}>
                                            <p style={{ fontSize: '12pt', margin: '0 0 64px 0' }}>{teacherData.city || "Kota"}, {new Date().toLocaleDateString('id-ID', {day:'2-digit', month:'long', year:'numeric'})}<br/>Guru BK,</p>
                                            <p style={{ fontSize: '12pt', fontWeight: 'bold', textDecoration: 'underline', margin: 0 }}>{formatAcademicTitle(teacherData.name)}</p>
                                            <p style={{ fontSize: '12pt', margin: '0 0 20px 0' }}>NIP. {teacherData.nip}</p>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
    <div id={includeId ? "personal-book-print-area" : undefined} className={`bg-white text-black p-0 font-sans leading-tight relative print-container text-center ${isPreview ? 'preview-mode' : ''}`}>
        {colorFixStyle}
        
        <div className="print-page-standard mx-auto">
            <div className="print-content-standard">
                {/* Kop Surat */}
                <table className="layout-table w-full font-bold mx-auto" style={{ width: '100%' }}>
                    <tbody>
                        <tr>
                            <td style={{ width: '80px', verticalAlign: 'middle', textAlign: 'center' }}>
                                {teacherData.logoGov && <img src={teacherData.logoGov} style={{ width: '60px', height: '60px', objectFit: 'contain' }} className="mx-auto" />}
                            </td>
                            <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                <h1 style={{ fontSize: '12pt', margin: 0, textTransform: 'uppercase', lineHeight: '1.2', textAlign: 'center' }}>{teacherData.govOrFoundation?.trim() || "PEMERINTAH DAERAH"}</h1>
                                <h1 style={{ fontSize: '12pt', margin: 0, textTransform: 'uppercase', lineHeight: '1.2', textAlign: 'center' }}>{teacherData.deptOrFoundation?.trim() || "DINAS PENDIDIKAN"}</h1>
                                <h2 className="school-name" style={{ fontSize: '14pt', margin: '2px 0', textTransform: 'uppercase', letterSpacing: '1px', lineHeight: '1.2', textAlign: 'center' }}>{teacherData.school?.trim() || "NAMA SEKOLAH"}</h2>
                                <p className="school-address" style={{ fontSize: '10pt', margin: '10px 0 0 0', fontStyle: 'normal', lineHeight: '1.2', textAlign: 'center', fontWeight: 'normal' }}>{teacherData.schoolAddress?.trim() || "Alamat Lengkap Sekolah"}</p>
                            </td>
                            <td style={{ width: '80px', verticalAlign: 'middle', textAlign: 'center' }}>
                                {teacherData.logoSchool && <img src={teacherData.logoSchool} style={{ width: '60px', height: '60px', objectFit: 'contain' }} className="mx-auto" />}
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div style={{ borderBottom: '3px double black', margin: '20px 0', width: '100%' }}></div>

                {/* Judul */}
                <div className="text-center mb-10 space-y-2" style={{ textAlign: 'center', marginTop: '40px' }}>
                    <h2 className="text-xl font-black underline uppercase tracking-widest" style={{ textAlign: 'center' }}>BUKU PRIBADI SISWA</h2>
                    <p className="text-lg font-bold uppercase" style={{ textAlign: 'center' }}>TAHUN PELAJARAN {teacherData.academicYear}</p>
                </div>

                {/* Identitas Singkat di Depan */}
                <div className="border-2 border-black p-6 w-full max-w-md mx-auto mb-12 avoid-break">
                    <table className="layout-table w-full text-xs font-bold mx-auto">
                        <tbody>
                            <tr className="border-b border-black"><td className="py-4 w-32 text-left">NAMA SISWA</td><td className="w-4">:</td><td className="uppercase text-left">{student.name}</td></tr>
                            <tr className="border-b border-black"><td className="py-4 text-left">KELAS</td><td>:</td><td className="text-left">{student.className}</td></tr>
                            <tr className="border-b border-black"><td className="py-4 text-left">NIS</td><td>:</td><td className="text-left">{student.nis || '-'}</td></tr>
                            <tr><td className="py-4 text-left">NISN</td><td>:</td><td className="text-left">{student.nisn || '-'}</td></tr>
                        </tbody>
                    </table>
                </div>

                {/* Detail Content */}
                <div className="space-y-8 text-left">
                    <section className="space-y-4 avoid-break">
                        <h3 className="text-lg font-bold uppercase border-b border-black pb-1">A. IDENTITAS SISWA</h3>
                        <table className="layout-table w-full">
                            <tbody>
                                <tr>
                                    <td style={{ width: '3cm', verticalAlign: 'top' }}>
                                        <div style={{ width: '3cm', height: '4cm', border: '1px solid black', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                            {student.photo ? <img src={student.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ textAlign: 'center', color: '#ccc', fontSize: '10pt' }}>FOTO<br/>3x4</div>}
                                        </div>
                                    </td>
                                    <td style={{ paddingLeft: '20px', verticalAlign: 'top' }}>
                                        <table className="layout-table w-full" style={{ fontSize: '12pt' }}>
                                            <tbody>
                                                <tr><td style={{ padding: '2px 0', width: '180px' }}>Nama Lengkap</td><td style={{ width: '16px' }}>:</td><td style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{student.name}</td></tr>
                                                <tr><td style={{ padding: '2px 0' }}>NIS / NISN</td><td>:</td><td>{student.nis || '-'} / {student.nisn || '-'}</td></tr>
                                                <tr><td style={{ padding: '2px 0' }}>Jenis Kelamin</td><td>:</td><td>{student.gender}</td></tr>
                                                <tr><td style={{ padding: '2px 0' }}>Tempat, Tgl Lahir</td><td>:</td><td>{student.birthPlace || '-'}, {formatDateIndo(student.birthDate)}</td></tr>
                                                <tr><td style={{ padding: '2px 0' }}>Agama</td><td>:</td><td>{student.religion || '-'}</td></tr>
                                                <tr><td style={{ padding: '2px 0' }}>Golongan Darah</td><td>:</td><td>{student.bloodType || '-'}</td></tr>
                                                <tr><td style={{ padding: '2px 0' }}>No. WA / HP</td><td>:</td><td>{student.phone || '-'}</td></tr>
                                                <tr><td style={{ padding: '2px 0' }}>Kelas / No. Absen</td><td>:</td><td>{student.className} / {student.attendanceNumber || '-'}</td></tr>
                                                <tr><td style={{ padding: '2px 0', verticalAlign: 'top' }}>Alamat</td><td style={{ verticalAlign: 'top' }}>:</td><td>{student.address || '-'}</td></tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </section>

                    <section className="space-y-2 avoid-break">
                        <h3 className="text-lg font-bold uppercase border-b border-black pb-1">B. LINGKUNGAN KELUARGA</h3>
                        <table className="layout-table w-full" style={{ fontSize: '12pt' }}>
                            <tbody>
                                <tr><td style={{ width: '180px' }}>Nama Ayah / Ibu</td><td style={{ width: '16px' }}>:</td><td style={{ fontWeight: 'bold' }}>{student.fatherName || '-'} / {student.motherName || '-'}</td></tr>
                                <tr><td>Pekerjaan Ayah / Ibu</td><td>:</td><td>{student.fatherJob || '-'} / {student.motherJob || '-'}</td></tr>
                                <tr><td>Alamat Orang Tua</td><td>:</td><td>{student.parentAddress || '-'}</td></tr>
                                <tr><td>Nomor Telepon / WA orang tua</td><td>:</td><td>{student.parentPhoneWA || '-'}</td></tr>
                                <tr><td>Tinggal Bersama</td><td>:</td><td>{student.livingWith || '-'}</td></tr>
                            </tbody>
                        </table>
                    </section>

                    <section className="space-y-2 avoid-break">
                        <h3 className="text-lg font-bold uppercase border-b border-black pb-1">C. POTENSI & MINAT</h3>
                        <table className="layout-table w-full" style={{ fontSize: '12pt' }}>
                            <tbody>
                                <tr><td style={{ width: '180px' }}>Hobi</td><td style={{ width: '16px' }}>:</td><td>{student.hobby || '-'}</td></tr>
                                <tr><td>Cita-cita</td><td>:</td><td>{student.ambition || '-'}</td></tr>
                                <tr><td>Mapel Disukai</td><td>:</td><td>{student.favoriteSubject || '-'}</td></tr>
                                <tr><td>Mapel Tidak Disukai</td><td>:</td><td>{student.dislikedSubject || '-'}</td></tr>
                                <tr><td>Sekolah Lanjut</td><td>:</td><td>{student.furtherSchool || '-'}</td></tr>
                                <tr><td>Teman Akrab</td><td>:</td><td>{student.bestFriend || '-'}</td></tr>
                                <tr><td>Prestasi</td><td>:</td><td>{student.achievements || '-'}</td></tr>
                                <tr><td>Ekstrakurikuler</td><td>:</td><td>{student.extracurricular || '-'}</td></tr>
                            </tbody>
                        </table>
                    </section>

                    <section className="space-y-2 avoid-break">
                        <h3 className="text-lg font-bold uppercase border-b border-black pb-1">D. HASIL AKPD</h3>
                        {studentAkpd.length > 0 ? (
                            <table className="w-full text-[11pt] border-collapse border border-black">
                                <thead>
                                    <tr className="bg-slate-100">
                                        <th className="border border-black p-1 text-center w-12">No</th>
                                        <th className="border border-black p-1 text-left">Pernyataan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentAkpd.map((q, i) => (
                                        <tr key={i}>
                                            <td className="border border-black p-1 text-center">{i + 1}</td>
                                            <td className="border border-black p-1">{q.text}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : <p className="italic text-[11pt]">Belum mengisi AKPD.</p>}
                    </section>

                    <section className="space-y-2 avoid-break">
                        <h3 className="text-lg font-bold uppercase border-b border-black pb-1">E. TES DIAGNOSTIK AWAL (TDA)</h3>
                        {(() => {
                            const tda = tdaRecords.find(r => r.studentId === student.id);
                            if (!tda) return <p className="italic">Belum ada data TDA.</p>;
                            return (
                                <table className="w-full text-[11pt] border-collapse border border-black">
                                    <tbody>
                                        <tr><td className="border border-black p-1 font-bold w-48">Gaya Belajar</td><td className="border border-black p-1">{tda.learningStyle}</td></tr>
                                        <tr><td className="border border-black p-1 font-bold">Kepribadian (MBTI)</td><td className="border border-black p-1">{tda.personalityType}</td></tr>
                                        <tr><td className="border border-black p-1 font-bold">Kecerdasan Majemuk</td><td className="border border-black p-1">{tda.multipleIntelligences}</td></tr>
                                        <tr><td className="border border-black p-1 font-bold">Bakat Minat</td><td className="border border-black p-1">{tda.talentInterest}</td></tr>
                                        <tr><td className="border border-black p-1 font-bold">Kunci Karier</td><td className="border border-black p-1">{tda.careerKey}</td></tr>
                                    </tbody>
                                </table>
                            );
                        })()}
                    </section>

                    <section className="space-y-2 avoid-break">
                        <h3 className="text-lg font-bold uppercase border-b border-black pb-1">F. REKAP ABSENSI</h3>
                        <table className="w-full text-left border-collapse border border-black text-[11pt]">
                            <thead>
                                <tr className="bg-slate-100">
                                    <th className="border border-black p-2 text-center">Semester</th>
                                    <th className="border border-black p-2 text-center text-blue-600">Sakit (S)</th>
                                    <th className="border border-black p-2 text-center text-amber-600">Ijin (I)</th>
                                    <th className="border border-black p-2 text-center text-rose-600">Alpa (A)</th>
                                    <th className="border border-black p-2 text-center text-emerald-600">Disp (D)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-black p-2 text-center font-bold">Ganjil (1)</td>
                                    <td className="border border-black p-2 text-center text-blue-600 font-bold">{attendanceRecords.filter(r => r.studentId === student.id && r.semester === 'Ganjil' && r.status === 'Sakit').length}</td>
                                    <td className="border border-black p-2 text-center text-amber-600 font-bold">{attendanceRecords.filter(r => r.studentId === student.id && r.semester === 'Ganjil' && r.status === 'Ijin').length}</td>
                                    <td className="border border-black p-2 text-center text-rose-600 font-bold">{attendanceRecords.filter(r => r.studentId === student.id && r.semester === 'Ganjil' && r.status === 'Alpa').length}</td>
                                    <td className="border border-black p-2 text-center text-emerald-600 font-bold">{attendanceRecords.filter(r => r.studentId === student.id && r.semester === 'Ganjil' && r.status === 'Dispensasi').length}</td>
                                </tr>
                                <tr>
                                    <td className="border border-black p-2 text-center font-bold">Genap (2)</td>
                                    <td className="border border-black p-2 text-center text-blue-600 font-bold">{attendanceRecords.filter(r => r.studentId === student.id && r.semester === 'Genap' && r.status === 'Sakit').length}</td>
                                    <td className="border border-black p-2 text-center text-amber-600 font-bold">{attendanceRecords.filter(r => r.studentId === student.id && r.semester === 'Genap' && r.status === 'Ijin').length}</td>
                                    <td className="border border-black p-2 text-center text-rose-600 font-bold">{attendanceRecords.filter(r => r.studentId === student.id && r.semester === 'Genap' && r.status === 'Alpa').length}</td>
                                    <td className="border border-black p-2 text-center text-emerald-600 font-bold">{attendanceRecords.filter(r => r.studentId === student.id && r.semester === 'Genap' && r.status === 'Dispensasi').length}</td>
                                </tr>
                            </tbody>
                        </table>
                    </section>

                    <section className="space-y-2 avoid-break">
                        <h3 className="text-lg font-bold uppercase border-b border-black pb-1">G. CATATAN PRESTASI & KASUS</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <h4 className="font-bold text-[11pt] mb-1 underline">Prestasi:</h4>
                                {achievements.length > 0 ? achievements.map(ach => (
                                    <div key={ach.id} className="text-[10pt] mb-1">• {ach.achievement} ({ach.level})</div>
                                )) : <p className="text-[10pt] italic">Tidak ada data.</p>}
                            </div>
                            <div>
                                <h4 className="font-bold text-[11pt] mb-1 underline">Kasus:</h4>
                                {violations.length > 0 ? violations.map(vio => (
                                    <div key={vio.id} className="text-[10pt] mb-1">• {vio.violation} ({vio.level})</div>
                                )) : <p className="text-[10pt] italic">Tidak ada data.</p>}
                            </div>
                        </div>
                    </section>

                    <section className="space-y-2 avoid-break">
                        <h3 className="text-lg font-bold uppercase border-b border-black pb-1">H. ANALISIS AKPD</h3>
                        <div className="border border-black p-3 min-h-[50px] text-[10pt]">
                            {studentAkpd.length > 0 ? (
                                <div className="grid grid-cols-1 gap-1">
                                    {studentAkpd.map((q, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <span className="font-bold">{idx + 1}.</span>
                                            <span>{q.text}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="italic">Tidak ada data AKPD.</p>
                            )}
                        </div>
                    </section>

                    <section className="space-y-2 avoid-break">
                        <h3 className="text-lg font-bold uppercase border-b border-black pb-1">I. NILAI RAPORT</h3>
                        <table className="w-full text-left border-collapse border border-black text-[10pt]">
                            <thead>
                                <tr className="bg-slate-100">
                                    <th className="border border-black p-1 text-center" rowSpan={2}>Mata Pelajaran</th>
                                    {studentClassNames.map(c => (
                                        <th key={c} className="border border-black p-1 text-center" colSpan={2}>{c}</th>
                                    ))}
                                </tr>
                                <tr className="bg-slate-100">
                                    {studentClassNames.map(c => (
                                        <React.Fragment key={c}>
                                            <th className="border border-black p-1 text-center">1</th>
                                            <th className="border border-black p-1 text-center">2</th>
                                        </React.Fragment>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {subjects.map(subject => {
                                    const record = reportAndMutations.find(r => r.studentId === student.id);
                                    return (
                                        <tr key={subject.id}>
                                            <td className="border border-black p-1 font-bold">{subject.label}</td>
                                            {studentClassNames.map(c => {
                                                const classData = record?.customGrades?.[c] || (c === 'VII' ? record?.grade7 : c === 'VIII' ? record?.grade8 : c === 'IX' ? record?.grade9 : undefined);
                                                return (
                                                    <React.Fragment key={c}>
                                                        <td className="border border-black p-1 text-center">{classData?.semester1?.[subject.id] || '-'}</td>
                                                        <td className="border border-black p-1 text-center">{classData?.semester2?.[subject.id] || '-'}</td>
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </section>

                    <section className="space-y-4 avoid-break">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <h4 className="font-bold uppercase border-b border-black pb-1">Catatan Semester 1</h4>
                                <div className="border border-black p-3 min-h-[100px] text-[11pt] italic">
                                    {student.semester1Note || "Belum ada catatan."}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-bold uppercase border-b border-black pb-1">Catatan Semester 2</h4>
                                <div className="border border-black p-3 min-h-[100px] text-[11pt] italic">
                                    {student.semester2Note || "Belum ada catatan."}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Tanda Tangan */}
                    <table className="layout-table avoid-break" style={{ width: '100%', marginTop: '48px' }}>
                        <tbody>
                            <tr>
                                <td style={{ width: '60%' }}></td>
                                <td style={{ width: '40%', textAlign: 'center' }}>
                                    <p style={{ fontSize: '12pt', margin: '0 0 64px 0' }}>{teacherData.city || "Kota"}, {new Date().toLocaleDateString('id-ID', {day:'2-digit', month:'long', year:'numeric'})}<br/>Guru BK,</p>
                                    <p style={{ fontSize: '12pt', fontWeight: 'bold', textDecoration: 'underline', margin: 0 }}>{formatAcademicTitle(teacherData.name)}</p>
                                    <p style={{ fontSize: '12pt', margin: '0 0 20px 0' }}>NIP. {teacherData.nip}</p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
  );
  };

  if (!activeStudent && !showPreview) {
    if (students.length === 0) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 max-w-md w-full space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-violet-100 rounded-full flex items-center justify-center mx-auto">
              <User className="w-10 h-10 text-violet-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Data Siswa Kosong</h2>
              <p className="text-slate-500 text-sm font-medium">
                Belum ada data siswa yang tersimpan. Silakan tambah data siswa terlebih dahulu di menu Data Siswa untuk dapat menggunakan fitur Buku Pribadi.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setView(ViewMode.STUDENT_LIST)}
                className="w-full bg-violet-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-violet-700 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
              >
                <Plus className="w-4 h-4" /> Tambah Data Siswa
              </button>
              <button 
                onClick={() => setView(ViewMode.HOME)}
                className="w-full bg-white text-slate-600 font-bold py-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
              >
                Kembali ke Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 space-y-10 text-left pb-24 max-w-7xl mx-auto relative p-3 md:p-6">
        <div className="flex items-center gap-5">
           <button onClick={() => setView(ViewMode.STUDENT_LIST)} className="p-1.5 bg-white rounded-2xl border border-slate-200 hover:bg-slate-100 transition-all group shadow-md">
             <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:-translate-x-1 transition-transform" />
           </button>
           <div>
              <p className="text-violet-400 font-black text-[10px] uppercase tracking-widest mb-1">BUKU PRIBADI SISWA</p>
               <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none">Pilih Siswa</h2>
            </div>
         </div>

         <div className="glass-card p-3 rounded-2xl border border-slate-200 shadow-xl max-w-md mx-auto mt-6">
            <div className="space-y-3">
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Pilih Kelas</label>
                    <select 
                        value={selectedClass} 
                        onChange={(e) => {
                            setSelectedClass(e.target.value);
                            setSelectedStudentId('');
                        }}
                        className="w-full input-cyber rounded-lg p-2 text-slate-800 text-[10px] focus:border-primary outline-none bg-white"
                    >
                        <option value="">-- Pilih Kelas --</option>
                        <option value="ALL">-- SEMUA SISWA --</option>
                        {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                {selectedClass && (
                    <div className="space-y-1 animate-in fade-in slide-in-from-top-4">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Pilih Siswa</label>
                        <select 
                            value={selectedStudentId} 
                            onChange={(e) => {
                                setSelectedStudentId(e.target.value);
                                // Removed immediate onSelectStudent call to keep dashboard view
                            }}
                            className="w-full input-cyber rounded-lg p-2 text-slate-800 text-[10px] focus:border-primary outline-none bg-white"
                        >
                            <option value="">-- Pilih Siswa --</option>
                            <option value="ALL">-- SEMUA SISWA --</option>
                            {studentsInClass.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                )}

                {/* Buttons for selected student */}
                {selectedStudentId && selectedStudentId !== 'ALL' && !student && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-[10px] font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center shrink-0">
                            <X className="w-4 h-4 text-rose-500" />
                        </div>
                        <p>ID Siswa tidak valid atau data siswa telah dihapus dari database. Silakan pilih siswa lain.</p>
                    </div>
                )}

                {student && selectedStudentId !== 'ALL' && (
                    <div className="pt-3 space-y-2 animate-in fade-in slide-in-from-bottom-4">
                        <button 
                            onClick={() => {
                                setReportType('personal-book');
                                setShowPreview(true);
                            }}
                            className="w-full bg-primary text-white font-bold py-2 text-[10px] rounded-lg shadow-md hover:shadow-primary/20 hover:scale-[1.02] transition-all uppercase tracking-widest flex items-center justify-center gap-1.5"
                        >
                            <FileText className="w-3.5 h-3.5" />
                            e-book BUKU PRIBADI SISWA
                        </button>

                        <button 
                            onClick={() => {
                                setReportType('database-siswa');
                                setShowPreview(true);
                            }}
                            className="w-full bg-emerald-600 text-white font-bold py-2 text-[10px] rounded-lg shadow-md hover:shadow-emerald-500/20 hover:scale-[1.02] transition-all uppercase tracking-widest flex items-center justify-center gap-1.5"
                        >
                            <FileText className="w-3.5 h-3.5" />
                            DATABASE SISWA
                        </button>
                        
                        <button 
                            onClick={() => onSelectStudentProp(student.id)}
                            className="w-full bg-slate-100 text-slate-600 font-bold py-2 rounded-lg border border-slate-300 hover:bg-slate-200 hover:text-slate-800 transition-all uppercase tracking-widest flex items-center justify-center gap-1.5 text-[9px]"
                        >
                            <Edit className="w-3 h-3" />
                            Lihat Detail / Edit Data
                        </button>
                    </div>
                )}

                {selectedStudentId === 'ALL' && (
                    <div className="pt-6 animate-in fade-in slide-in-from-top-4">
                        <button 
                            onClick={() => {
                                showToast('Fitur download semua siswa sedang disiapkan. Silakan pilih siswa satu per satu untuk saat ini.');
                            }}
                            className="w-full bg-blue-600/20 text-blue-400 border border-blue-500/30 px-4 py-2 rounded-xl font-black text-[10px] flex items-center justify-center gap-2 uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-lg"
                        >
                            <FileDown className="w-3.5 h-3.5" /> DOWNLOAD SEMUA BUKU PRIBADI SISWA
                        </button>
                    </div>
                )}
            </div>
         </div>
      </div>
    );
  }

  // Preview Mode
  if (showPreview && student) {
    return (
      <div className="min-h-screen bg-slate-100 text-left pb-24 relative">
          {/* Hidden Print Area for Download/Print */}
          <div className="print-only-wrapper">
            <div id="hidden-print-wrapper" ref={hiddenPrintRef}>
                {renderPrintLayout(false, true)}
            </div>
          </div>
          
          {/* Toolbar */}
          <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 p-4 flex justify-between items-center shadow-md no-print">
              <div className="flex items-center gap-2">
                  <div>
                      <h2 className="text-xs font-black text-slate-800 uppercase tracking-tight leading-none">
                          {reportType === 'database-siswa' ? 'Preview Database Siswa' : 'Preview Buku Pribadi'}
                      </h2>
                      <p className="text-[10px] text-slate-500 font-bold mt-1">{student.name} - {student.className}</p>
                  </div>
              </div>
              <div className="flex gap-2 items-center">
                  {reportType === 'database-siswa' && (
                      <button onClick={() => setShowSheetModal(true)} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200">
                          <Sheet className="w-3.5 h-3.5" /> SINKRONISASI SHEET
                      </button>
                  )}
                  <div className="relative" ref={downloadMenuRef}>
                    <button 
                      onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200"
                    >
                        <FileDown className="w-3.5 h-3.5" /> DOWNLOAD
                    </button>
                    {/* Added pt-2 wrapper to bridge the hover gap */}
                    {showDownloadMenu && (
                        <div className="absolute right-0 top-full pt-2 w-48 z-50">
                            <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 animate-fade-in">
                                <button 
                                  onClick={() => {
                                      setShowDownloadMenu(false);
                                      handleDownloadPDF();
                                  }} 
                                  className="w-full text-left px-2 py-1.5 text-[10px] font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <FileText className="w-3.5 h-3.5 text-rose-500" /> PDF Document
                                </button>
                                <button 
                                  onClick={() => {
                                      setShowDownloadMenu(false);
                                      handleDownloadWord();
                                  }} 
                                  className="w-full text-left px-2 py-1.5 text-[10px] font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <FileText className="w-3.5 h-3.5 text-blue-500" /> Word Document
                                </button>
                            </div>
                        </div>
                    )}
                  </div>
                  <div className="h-8 w-px bg-slate-200 mx-2" />
                  <button 
                    onClick={() => setView(ViewMode.HOME)} 
                    className="px-2 py-1.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-slate-200"
                  >
                      <ArrowLeft className="w-3.5 h-3.5" /> KEMBALI
                  </button>
                  <button 
                    onClick={() => setShowPreview(false)} 
                    className="px-2 py-1.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-rose-100"
                  >
                      <X className="w-3.5 h-3.5" /> BATAL
                  </button>
              </div>
          </div>
          
          {/* Preview Content */}
          <div className="pt-28 pb-12 px-4 overflow-auto flex flex-col items-center bg-slate-100 min-h-screen">
              <div className="bg-white shadow-[0_0_50px_rgba(0,0,0,0.1)] rounded-sm overflow-hidden mb-12">
                  <div className="scale-[0.85] origin-top p-4">
                      {renderPrintLayout(true, false)}
                  </div>
              </div>
          </div>
      </div>
    );
  }

  return (
    <div ref={printRef} className="min-h-screen bg-slate-50 space-y-10 text-left pb-24 max-w-7xl mx-auto relative p-3 md:p-6">
      {/* Hidden Print Area for Download/Print */}
      {student && (
        <div className="print-only-wrapper">
          <div id="hidden-print-wrapper" ref={hiddenPrintRef}>
              {renderPrintLayout(false, true)}
          </div>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
           <button onClick={() => {
               onSelectStudent('');
               setSelectedClass('');
               setSelectedStudentId('');
           }} className="p-1.5 bg-white rounded-2xl border border-slate-200 hover:bg-slate-100 transition-all group shadow-md">
             <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:-translate-x-1 transition-transform" />
           </button>
           <div>
              <p className="text-violet-400 font-black text-[10px] uppercase tracking-widest mb-1">BUKU PRIBADI SISWA</p>
               <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none">{student.name}</h2>
            </div>
         </div>
         <div className="flex flex-wrap items-center gap-2">
          <button onClick={openGoogleForm} className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-xl font-black text-[10px] flex items-center gap-2 uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-lg">
             <Sheet className="w-3 h-3" /> GOOGLE FORM
          </button>
          <button onClick={() => setIsEditing(!isEditing)} className="bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-4 py-2 rounded-xl font-black text-[10px] flex items-center gap-2 uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-lg">
            <Edit className="w-3.5 h-3.5" /> {isEditing ? 'BATAL' : 'EDIT DATA'}
          </button>
          <button onClick={() => setShowSemester1Form(true)} className="bg-blue-600/20 text-blue-400 border border-blue-500/30 px-4 py-2 rounded-xl font-black text-[10px] flex items-center gap-2 uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-lg">
            <FileText className="w-3.5 h-3.5" /> CATATAN SMT 1
          </button>
          <button onClick={() => setShowSemester2Form(true)} className="bg-purple-600/20 text-purple-400 border border-purple-500/30 px-4 py-2 rounded-xl font-black text-[10px] flex items-center gap-2 uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all shadow-lg">
            <FileText className="w-3.5 h-3.5" /> CATATAN SMT 2
          </button>
          <button onClick={handleExcelExport} className="bg-green-600/20 text-green-400 border border-green-500/30 px-4 py-2 rounded-xl font-black text-[10px] flex items-center gap-2 uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all shadow-lg">
              <FileDown className="w-3.5 h-3.5" /> EXPORT EXCEL
          </button>
          <button onClick={handleDelete} className="bg-rose-600/20 text-rose-400 border border-rose-500/30 px-4 py-2 rounded-xl font-black text-[10px] flex items-center gap-2 uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-lg">
              <Trash2 className="w-3.5 h-3.5" /> HAPUS
          </button>
          <button onClick={() => {
               onSelectStudent('');
               setSelectedClass('');
               setSelectedStudentId('');
           }} className="bg-slate-100 text-slate-500 border border-slate-300 px-4 py-2 rounded-xl font-black text-[10px] flex items-center gap-2 uppercase tracking-widest hover:bg-slate-200 hover:text-slate-800 transition-all shadow-lg">
              BATAL
          </button>
          <button onClick={() => setView(ViewMode.STUDENT_LIST)} className="bg-slate-100 text-slate-500 border border-slate-300 px-4 py-2 rounded-xl font-black text-[10px] flex items-center gap-2 uppercase tracking-widest hover:bg-slate-200 hover:text-slate-800 transition-all shadow-lg">
              <ArrowLeft className="w-3.5 h-3.5" /> KEMBALI KE DATABASE SISWA
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {showSemester1Form && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/80 backdrop-blur-sm">
            <div className="glass-card p-6 rounded-2xl w-full max-w-lg space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Catatan Semester 1</h3>
                <button 
                  onClick={() => analyzeStudentData(1)}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2 px-2 py-1.5 bg-violet-600/20 text-violet-400 border border-violet-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-violet-600 hover:text-white transition-all disabled:opacity-50"
                >
                  {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  Analisa AI
                </button>
              </div>
              <textarea 
                value={formData?.semester1Note || ''} 
                onChange={(e) => setFormData(prev => ({ ...prev!, semester1Note: e.target.value }))}
                className="w-full h-64 input-cyber rounded-xl p-2.5 text-slate-800 text-[10px] bg-white focus:border-primary outline-none"
                placeholder="Tulis catatan perkembangan siswa di semester 1..."
              />
              <div className="flex gap-2">
                <button onClick={() => { onUpdate(formData!); setShowSemester1Form(false); }} className="flex-1 bg-indigo-600 text-white font-black py-2 rounded-xl text-[10px] uppercase tracking-widest">Simpan</button>
                <button onClick={() => setShowSemester1Form(false)} className="flex-1 bg-slate-100 text-slate-500 font-black py-2 rounded-xl text-[10px] uppercase tracking-widest">Tutup</button>
              </div>
            </div>
          </div>
        )}

        {showSemester2Form && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/80 backdrop-blur-sm">
            <div className="glass-card p-6 rounded-2xl w-full max-w-lg space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Catatan Semester 2</h3>
                <button 
                  onClick={() => analyzeStudentData(2)}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2 px-2 py-1.5 bg-violet-600/20 text-violet-400 border border-violet-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-violet-600 hover:text-white transition-all disabled:opacity-50"
                >
                  {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  Analisa AI
                </button>
              </div>
              <textarea 
                value={formData?.semester2Note || ''} 
                onChange={(e) => setFormData(prev => ({ ...prev!, semester2Note: e.target.value }))}
                className="w-full h-64 input-cyber rounded-xl p-2.5 text-slate-800 text-[10px] bg-white focus:border-primary outline-none"
                placeholder="Tulis catatan perkembangan siswa di semester 2..."
              />
              <div className="flex gap-2">
                <button onClick={() => { onUpdate(formData!); setShowSemester2Form(false); }} className="flex-1 bg-indigo-600 text-white font-black py-2 rounded-xl text-[10px] uppercase tracking-widest">Simpan</button>
                <button onClick={() => setShowSemester2Form(false)} className="flex-1 bg-slate-100 text-slate-500 font-black py-2 rounded-xl text-[10px] uppercase tracking-widest">Tutup</button>
              </div>
            </div>
          </div>
        )}

        {isEditing && formData ? (
          <form onSubmit={handleFormSubmit} className="glass-card p-6 md:p-8 rounded-3xl space-y-10 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-200 pb-6">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Edit Buku Pribadi</h3>
              <div className="flex gap-2">
                <button type="submit" className="bg-indigo-600 text-white font-black py-2 px-6 rounded-xl text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-colors">Simpan Perubahan</button>
                <button type="button" onClick={() => setIsEditing(false)} className="bg-slate-100 text-slate-500 font-black py-2 px-6 rounded-xl text-[10px] uppercase tracking-widest hover:bg-slate-200">Batal</button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Bagian A: Identitas */}
              <div className="space-y-6">
                <h4 className="text-xs font-black text-violet-400 uppercase tracking-widest border-l-4 border-violet-600 pl-4">A. Identitas Diri</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Nama Lengkap</label>
                    <input name="name" value={formData.name} onChange={handleInputChange} className="w-full input-cyber rounded-xl p-2.5 text-slate-800 text-[10px] focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Nama Panggilan</label>
                    <input name="nickname" value={formData.nickname || ''} onChange={handleInputChange} className="w-full input-cyber rounded-xl p-2.5 text-slate-800 text-[10px] focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">NIS</label>
                    <input name="nis" value={formData.nis || ''} onChange={handleInputChange} className="w-full input-cyber rounded-xl p-2.5 text-slate-800 text-[10px] focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">NISN</label>
                    <input name="nisn" value={formData.nisn || ''} onChange={handleInputChange} className="w-full input-cyber rounded-xl p-2.5 text-slate-800 text-[10px] focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Jenis Kelamin</label>
                    <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full input-cyber rounded-xl p-2.5 text-slate-800 text-[10px] focus:border-primary outline-none">
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Tempat Lahir</label>
                    <input name="birthPlace" value={formData.birthPlace || ''} onChange={handleInputChange} className="w-full input-cyber rounded-xl p-2.5 text-slate-800 text-[10px] focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Tanggal Lahir</label>
                    <input type="date" name="birthDate" value={formData.birthDate || ''} onChange={handleInputChange} className="w-full input-cyber rounded-xl p-2.5 text-slate-800 text-[10px] focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Umur</label>
                    <input readOnly value={calculateAge(formData.birthDate)} className="w-full input-cyber rounded-xl p-2.5 text-slate-500 text-[10px] bg-white/70 cursor-not-allowed outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Agama</label>
                    <input name="religion" value={formData.religion || ''} onChange={handleInputChange} className="w-full input-cyber rounded-xl p-2.5 text-slate-800 text-[10px] focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Golongan Darah</label>
                    <select name="bloodType" value={formData.bloodType || ''} onChange={handleInputChange} className="w-full input-cyber rounded-xl p-2.5 text-slate-800 text-[10px] focus:border-primary outline-none">
                      <option value="">Pilih...</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="AB">AB</option>
                      <option value="O">O</option>
                      <option value="-">-</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Alamat Lengkap</label>
                  <textarea name="address" value={formData.address || ''} onChange={handleInputChange} className="w-full input-cyber rounded-xl p-2.5 text-slate-800 text-[10px] h-20 focus:border-primary outline-none" />
                </div>
              </div>

              {/* Bagian B: Keluarga */}
              <div className="space-y-6">
                <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest border-l-4 border-emerald-600 pl-4">B. Lingkungan Keluarga</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Nama Ayah</label>
                    <input name="fatherName" value={formData.fatherName || ''} onChange={handleInputChange} className="w-full input-cyber rounded-xl p-2.5 text-slate-800 text-[10px] focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Pekerjaan Ayah</label>
                    <input name="fatherJob" value={formData.fatherJob || ''} onChange={handleInputChange} className="w-full input-cyber rounded-xl p-2.5 text-slate-800 text-[10px] focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Agama Ayah</label>
                    <input name="fatherReligion" value={formData.fatherReligion || ''} onChange={handleInputChange} className="w-full input-cyber rounded-xl p-2.5 text-slate-800 text-[10px] focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Nama Ibu</label>
                    <input name="motherName" value={formData.motherName || ''} onChange={handleInputChange} className="w-full input-cyber rounded-xl p-2.5 text-slate-800 text-[10px] focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Pekerjaan Ibu</label>
                    <input name="motherJob" value={formData.motherJob || ''} onChange={handleInputChange} className="w-full input-cyber rounded-xl p-2.5 text-slate-800 text-[10px] focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Agama Ibu</label>
                    <input name="motherReligion" value={formData.motherReligion || ''} onChange={handleInputChange} className="w-full input-cyber rounded-xl p-2.5 text-slate-800 text-[10px] focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Anak Ke</label>
                    <input type="number" name="birthOrder" value={formData.birthOrder || ''} onChange={handleInputChange} className="w-full input-cyber rounded-xl p-2.5 text-slate-800 text-[10px] focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Jumlah Saudara</label>
                    <input type="number" name="siblingsCount" value={formData.siblingsCount || ''} onChange={handleInputChange} className="w-full input-cyber rounded-xl p-2.5 text-slate-800 text-[10px] focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Tinggal Bersama</label>
                    <select name="livingWith" value={formData.livingWith || ''} onChange={handleInputChange} className="w-full input-cyber rounded-xl p-2.5 text-slate-800 text-[10px] focus:border-primary outline-none">
                      <option value="">Pilih...</option>
                      <option value="Kedua Orang Tua">Kedua Orang Tua</option>
                      <option value="Ayah">Ayah</option>
                      <option value="Ibu">Ibu</option>
                      <option value="Saudara">Saudara</option>
                      <option value="Kakek/ Nenek">Kakek/ Nenek</option>
                      <option value="Orang Lain">Orang Lain</option>
                      <option value="Panti Asuhan">Panti Asuhan</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Status Anak</label>
                    <select name="childStatus" value={formData.childStatus || ''} onChange={handleInputChange} className="w-full input-cyber rounded-xl p-2.5 text-slate-800 text-[10px] focus:border-primary outline-none">
                      <option value="">Pilih...</option>
                      <option value="Orang Tua Lengkap">Orang Tua Lengkap</option>
                      <option value="Yatim">Yatim</option>
                      <option value="Piatu">Piatu</option>
                      <option value="Yatim-Piatu">Yatim-Piatu</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bagian C: Potensi & Kesehatan */}
              <div className="space-y-6">
                <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest border-l-4 border-amber-600 pl-4">C. Potensi & Kesehatan</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Tinggi Badan (cm)</label>
                    <input type="number" name="height" value={formData.height || ''} onChange={handleInputChange} className="w-full input-cyber rounded-xl p-2.5 text-slate-800 text-[10px] focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Berat Badan (kg)</label>
                    <input type="number" name="weight" value={formData.weight || ''} onChange={handleInputChange} className="w-full input-cyber rounded-xl p-2.5 text-slate-800 text-[10px] focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Hobi</label>
                    <input name="hobby" value={formData.hobby || ''} onChange={handleInputChange} className="w-full input-cyber rounded-xl p-2.5 text-slate-800 text-[10px] focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Cita-cita</label>
                    <input name="ambition" value={formData.ambition || ''} onChange={handleInputChange} className="w-full input-cyber rounded-xl p-2.5 text-slate-800 text-[10px] focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Mata Pelajaran Favorit</label>
                    <input name="favoriteSubject" value={formData.favoriteSubject || ''} onChange={handleInputChange} className="w-full input-cyber rounded-xl p-2.5 text-slate-800 text-[10px] focus:border-primary outline-none" />
                  </div>
                </div>
              </div>

              {/* Bagian D: Catatan Semester */}
              <div className="space-y-6">
                <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest border-l-4 border-indigo-600 pl-4">D. Catatan Semester</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Catatan Semester 1</label>
                    <textarea name="semester1Note" value={formData.semester1Note || ''} onChange={handleInputChange} className="w-full h-32 input-cyber rounded-xl p-2.5 text-slate-800 text-[10px] bg-white focus:border-primary outline-none" placeholder="Tulis catatan perkembangan siswa di semester 1..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Catatan Semester 2</label>
                    <textarea name="semester2Note" value={formData.semester2Note || ''} onChange={handleInputChange} className="w-full h-32 input-cyber rounded-xl p-2.5 text-slate-800 text-[10px] bg-white focus:border-primary outline-none" placeholder="Tulis catatan perkembangan siswa di semester 2..." />
                  </div>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <>
            <div className="glass-card p-10 rounded-[3rem] border border-slate-200 space-y-10 shadow-2xl bg-white/90">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-4 space-y-8 text-center">
                  <div className="relative aspect-[3/4] w-full max-w-[280px] mx-auto rounded-[2.5rem] overflow-hidden border-8 border-slate-950 shadow-3xl">
                    {student.photo ? <img src={student.photo} className="w-full h-full object-cover" /> : <User className="w-full h-full p-16 text-slate-800" />}
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">{student.name}</h4>
                    <div className="inline-flex items-center gap-2 px-6 py-2 bg-violet-600/20 text-violet-400 rounded-full font-black text-[10px] uppercase tracking-widest border border-violet-500/20">
                      <Hash className="w-3.5 h-3.5" /> ID: {student.studentCode}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-8 space-y-12 text-left">
                  <section className="space-y-6">
                    <h5 className="flex items-center gap-2.5 text-[10px] font-black text-violet-400 uppercase tracking-[0.3em] border-l-4 border-violet-600 pl-4">A. DATA IDENTITAS</h5>
                    <div className="grid grid-cols-2 gap-y-6 text-xs font-bold px-4">
                      <div className="col-span-2 space-y-1"><p className="text-slate-500 text-[9px] uppercase font-black">Nama Sekolah</p><p className="text-slate-800 text-[10px] font-black">{teacherData.school || '-'}</p></div>
                      <div className="space-y-1"><p className="text-slate-500 text-[9px] uppercase font-black">NIS / NISN</p><p className="text-slate-800 text-[10px]">{student.nis || '-'} / {student.nisn || '-'}</p></div>
                      <div className="space-y-1"><p className="text-slate-500 text-[9px] uppercase font-black">Wali Kelas</p><p className="text-slate-800 text-[10px]">{student.homeroomTeacher || '-'}</p></div>
                      <div className="space-y-1"><p className="text-slate-500 text-[9px] uppercase font-black">Kelas / Absen</p><p className="text-slate-800 text-[10px]">{student.className} / {student.attendanceNumber || '-'}</p></div>
                      <div className="space-y-1"><p className="text-slate-500 text-[9px] uppercase font-black">Asal SD</p><p className="text-slate-800 text-[10px]">{student.previousSchool || '-'}</p></div>
                      <div className="space-y-1"><p className="text-slate-500 text-[9px] uppercase font-black">L / P</p><p className="text-slate-800 text-[10px]">{student.gender}</p></div>
                      <div className="space-y-1"><p className="text-slate-500 text-[9px] uppercase font-black">Umur</p><p className="text-slate-800 text-[10px]">{calculateAge(student.birthDate)}</p></div>
                      <div className="space-y-1"><p className="text-slate-500 text-[9px] uppercase font-black">Agama</p><p className="text-slate-800 text-[10px]">{student.religion || '-'}</p></div>
                      <div className="space-y-1"><p className="text-slate-500 text-[9px] uppercase font-black">Fisik & Kesehatan</p><p className="text-slate-800 text-[10px]">TB: {student.height} / BB: {student.weight} / GOL: {student.bloodType || '-'}</p></div>
                      <div className="space-y-1"><p className="text-slate-500 text-[9px] uppercase font-black">Penyakit Khusus</p><p className="text-slate-800 text-[10px]">{student.specialHealthNote || '-'}</p></div>
                      <div className="space-y-1"><p className="text-slate-500 text-[9px] uppercase font-black">No. WA / HP</p><WhatsAppLink phone={student.phone} className="text-slate-800 text-[10px] font-bold text-emerald-600" /></div>
                      <div className="col-span-2 space-y-1"><p className="text-slate-500 text-[9px] uppercase font-black">Alamat Rumah ({student.domicile})</p><p className="text-slate-800 leading-relaxed italic text-xs">{student.address || '-'}</p></div>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h5 className="flex items-center gap-2.5 text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] border-l-4 border-emerald-600 pl-4">B. LINGKUNGAN KELUARGA</h5>
                    <div className="grid grid-cols-2 gap-y-8 px-4">
                      <div className="space-y-1"><p className="text-emerald-500 text-[9px] uppercase font-black">Anak Ke / Dari</p><p className="text-slate-800 font-black text-xs">Anak ke-{student.birthOrder} dari {student.siblingsCount} Bersaudara</p></div>
                      <div className="space-y-1"><p className="text-emerald-500 text-[9px] uppercase font-black">Status Anak</p><p className="text-slate-800 font-black text-xs">{student.childStatus || '-'}</p></div>
                      <div className="space-y-1"><p className="text-emerald-500 text-[9px] uppercase font-black">Tinggal Bersama</p><p className="text-slate-800 font-black text-xs">{student.livingWith || '-'}</p></div>
                      
                      <div className="space-y-2">
                        <p className="text-blue-400 text-[10px] uppercase font-black border-b border-slate-200 pb-1">Ayah Kandung</p>
                        <div className="space-y-1 font-bold text-[11px] text-slate-800">
                          <p className="text-xs font-black uppercase">{student.fatherName || '-'}</p>
                          <p className="text-slate-500">{student.fatherJob || '-'} ({student.fatherReligion || '-'})</p>
                          <WhatsAppLink phone={student.fatherPhone} className="text-blue-500 font-black" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-pink-400 text-[10px] uppercase font-black border-b border-slate-200 pb-1">Ibu Kandung</p>
                        <div className="space-y-1 font-bold text-[11px] text-slate-800">
                          <p className="text-xs font-black uppercase">{student.motherName || '-'}</p>
                          <p className="text-slate-500">{student.motherJob || '-'} ({student.motherReligion || '-'})</p>
                          <WhatsAppLink phone={student.motherPhone} className="text-pink-500 font-black" />
                        </div>
                      </div>

                      {student.guardianName && (
                        <div className="col-span-2 space-y-2 mt-4">
                          <p className="text-amber-400 text-[10px] uppercase font-black border-b border-slate-200 pb-1">Wali Siswa</p>
                          <div className="grid grid-cols-2 gap-2 font-bold text-[11px] text-slate-800">
                            <div>
                              <p className="text-xs font-black uppercase">{student.guardianName}</p>
                              <p className="text-slate-500">{student.guardianJob || '-'}</p>
                              <WhatsAppLink phone={student.guardianPhone} className="text-amber-500 font-black mt-1" />
                            </div>
                            <div className="text-right">
                              <p className="text-slate-500 text-[9px] uppercase font-black">Alamat Wali</p>
                              <p className="italic">{student.guardianAddress || '-'}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="col-span-2 space-y-1">
                        <p className="text-slate-500 text-[9px] uppercase font-black">Alamat Ortu / Wali</p>
                        <p className="text-slate-800 leading-relaxed italic text-[11px]">{student.parentAddress || '-'}</p>
                      </div>
                      <div className="col-span-2 space-y-1">
                        <p className="text-slate-500 text-[9px] uppercase font-black">Nomor Telepon / WA orang tua</p>
                        <WhatsAppLink phone={student.parentPhoneWA} className="text-emerald-600 font-black text-[11px]" />
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
              <div className="lg:col-span-1 glass-card p-6 rounded-[2.5rem] border border-slate-200 shadow-lg bg-white/90">
                <h5 className="flex items-center gap-2.5 text-[10px] font-black text-green-400 uppercase tracking-[0.3em] border-l-4 border-green-600 pl-4 mb-6">Riwayat Konseling</h5>
                <div className="space-y-3">
                  {studentCounselingLogs.length === 0 ? (
                    <p className="text-[10px] italic text-slate-500">Belum ada riwayat konseling.</p>
                  ) : (
                    studentCounselingLogs.map(log => (
                      <div key={log.id} className="p-1.5 bg-white/60 rounded-xl border border-slate-200">
                        <p className="text-[9px] font-black text-green-400 uppercase tracking-widest">{log.date} - {log.type}</p>
                        <p className="text-xs text-slate-600 mt-1">{log.result}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="lg:col-span-1 glass-card p-6 rounded-[2.5rem] border border-slate-200 shadow-lg bg-white/90">
                <div className="flex justify-between items-center mb-6">
                  <h5 className="flex items-center gap-2.5 text-[10px] font-black text-yellow-400 uppercase tracking-[0.3em] border-l-4 border-yellow-600 pl-4">Prestasi</h5>
                  <button onClick={() => setShowAchievementForm(true)} className="p-2 bg-yellow-900/20 text-yellow-500 rounded-lg hover:bg-yellow-900/40 transition-all"><Plus className="w-3.5 h-3.5" /></button>
                </div>
                <div className="space-y-3">
                  {studentAchievements.length === 0 ? (
                    <p className="text-[10px] italic text-slate-500">Belum ada prestasi.</p>
                  ) : (
                    studentAchievements.map(ach => (
                      <div key={ach.id} className="p-1.5 bg-white/60 rounded-xl border border-slate-200">
                        <p className="text-[9px] font-black text-yellow-400 uppercase tracking-widest">{ach.date} - {ach.level}</p>
                        <p className="text-xs text-slate-600 mt-1 font-bold">{ach.achievement}</p>
                        <p className="text-[10px] text-slate-500 mt-1 italic">"{ach.description}"</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="lg:col-span-1 glass-card p-6 rounded-[2.5rem] border border-slate-200 shadow-lg bg-white/90">
                <div className="flex justify-between items-center mb-6">
                  <h5 className="flex items-center gap-2.5 text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] border-l-4 border-blue-600 pl-4">Catatan Anekdot</h5>
                </div>
                <div className="overflow-x-auto">
                  {eventLogs.length === 0 ? (
                    <p className="text-[10px] italic text-slate-500">Belum ada catatan anekdot.</p>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">Waktu</th>
                          <th className="py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">Deskripsi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {eventLogs.map(log => (
                          <tr key={log.id} className="group">
                            <td className="py-2 pr-2 align-top">
                              <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{log.date}</div>
                              <div className="text-[7px] text-slate-400 font-bold">{log.time}</div>
                            </td>
                            <td className="py-2 align-top">
                              <p className="text-[10px] text-slate-600 leading-relaxed italic line-clamp-2">"{log.description}"</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              <div className="lg:col-span-1 glass-card p-6 rounded-[2.5rem] border border-slate-200 shadow-lg bg-white/90">
                <div className="flex justify-between items-center mb-6">
                  <h5 className="flex items-center gap-2.5 text-[10px] font-black text-orange-400 uppercase tracking-[0.3em] border-l-4 border-orange-600 pl-4">Absensi Siswa</h5>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-3">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-1">Semester Ganjil</p>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                      <div className="text-blue-600">S: {studentAttendance.filter(r => r.semester === 'Ganjil' && r.status === 'Sakit').length}</div>
                      <div className="text-amber-600">I: {studentAttendance.filter(r => r.semester === 'Ganjil' && r.status === 'Ijin').length}</div>
                      <div className="text-rose-600">A: {studentAttendance.filter(r => r.semester === 'Ganjil' && r.status === 'Alpa').length}</div>
                      <div className="text-emerald-600">D: {studentAttendance.filter(r => r.semester === 'Ganjil' && r.status === 'Dispensasi').length}</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-1">Semester Genap</p>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                      <div className="text-blue-600">S: {studentAttendance.filter(r => r.semester === 'Genap' && r.status === 'Sakit').length}</div>
                      <div className="text-amber-600">I: {studentAttendance.filter(r => r.semester === 'Genap' && r.status === 'Ijin').length}</div>
                      <div className="text-rose-600">A: {studentAttendance.filter(r => r.semester === 'Genap' && r.status === 'Alpa').length}</div>
                      <div className="text-emerald-600">D: {studentAttendance.filter(r => r.semester === 'Genap' && r.status === 'Dispensasi').length}</div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200">
                   <p className="text-[9px] text-slate-500 italic">* S: Sakit, I: Ijin, A: Alpa, D: Dispensasi</p>
                </div>
              </div>

              <div className="lg:col-span-1 glass-card p-4 rounded-3xl border border-slate-200 shadow-lg bg-white/90">
                <div className="flex justify-between items-center mb-3">
                  <h5 className="flex items-center gap-2.5 text-[10px] font-black text-red-400 uppercase tracking-[0.3em] border-l-4 border-red-600 pl-4">Catatan Kasus</h5>
                  <button onClick={() => setShowViolationForm(true)} className="p-1.5 bg-red-900/20 text-red-500 rounded-lg hover:bg-red-900/40 transition-all"><Plus className="w-3 h-3" /></button>
                </div>
                <div className="space-y-2">
                  {studentViolations.length === 0 ? (
                    <p className="text-[9px] italic text-slate-500">Belum ada catatan kasus.</p>
                  ) : (
                    studentViolations.map(vio => (
                      <div key={vio.id} className="p-1 bg-white/60 rounded-xl border border-slate-200">
                        <p className="text-[8px] font-black text-red-400 uppercase tracking-widest">{vio.date} - {vio.level}</p>
                        <p className="text-[10px] text-slate-600 mt-0.5 font-bold">{vio.violation}</p>
                        <p className="text-[9px] text-slate-500 mt-0.5 italic">"{vio.description}"</p>
                        <p className="text-[8px] text-emerald-600 mt-0.5 font-bold">Tindakan: {vio.actionTaken}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="lg:col-span-1 glass-card p-6 rounded-[2.5rem] border border-slate-200 shadow-lg bg-white/90">
                <div className="flex justify-between items-center mb-6">
                  <h5 className="flex items-center gap-2.5 text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] border-l-4 border-indigo-600 pl-4">Analisis AKPD</h5>
                  {studentAkpd.length > 0 && (
                    <button 
                      onClick={handleDownloadAkpdPdf} 
                      className="p-2 bg-indigo-900/20 text-indigo-500 rounded-lg hover:bg-indigo-900/40 transition-all"
                      title="Download PDF AKPD"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {studentAkpd.length === 0 ? (
                    <p className="text-[10px] italic text-slate-500">Belum ada data AKPD.</p>
                  ) : (
                    studentAkpd.map((q, idx) => (
                      <div key={idx} className="p-1.5 bg-white/60 rounded-xl border border-slate-200">
                        <p className="text-xs text-slate-600">
                          <span className="font-black text-indigo-400 mr-2">{idx + 1}.</span>
                          {q.text}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="lg:col-span-3 glass-card p-6 rounded-3xl border border-slate-200 shadow-lg bg-white/90">
                <div className="flex justify-between items-center mb-6">
                  <h5 className="flex items-center gap-2.5 text-[10px] font-black text-violet-400 uppercase tracking-[0.3em] border-l-4 border-violet-600 pl-4">I. Nilai Raport</h5>
                  <button onClick={openReportMutationForm} className="p-2 bg-violet-900/20 text-violet-500 rounded-lg hover:bg-violet-900/40 transition-all"><Plus className="w-3.5 h-3.5" /></button>
                </div>
                <div className="overflow-x-auto mb-8">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="p-1 text-[8px] font-black text-slate-500 uppercase tracking-widest" rowSpan={2}>Mata Pelajaran</th>
                        {studentClassNames.map(c => (
                            <th key={c} className="p-1 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center border-l border-slate-200" colSpan={2}>Kelas {c}</th>
                        ))}
                      </tr>
                      <tr className="border-b border-slate-200">
                        {studentClassNames.map(c => (
                            <React.Fragment key={c}>
                                <th className="p-1 text-[8px] font-bold text-slate-600 uppercase text-center border-l border-slate-200">Sem 1</th>
                                <th className="p-1 text-[8px] font-bold text-slate-600 uppercase text-center border-l border-slate-200">Sem 2</th>
                            </React.Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportAndMutations.filter(r => r.studentId === student.id).length === 0 ? (
                        <tr>
                          <td colSpan={1 + studentClassNames.length * 2} className="p-4 text-center text-[10px] italic text-slate-500">Belum ada data nilai.</td>
                        </tr>
                      ) : (
                        subjects.map(subject => {
                          const record = reportAndMutations.find(r => r.studentId === student.id);
                          return (
                            <tr key={subject.id} className="border-b border-slate-200 hover:bg-white/5 transition-colors">
                              <td className="p-2 text-[10px] font-bold text-slate-800">{subject.label}</td>
                              {studentClassNames.map(c => {
                                  const classData = record?.customGrades?.[c] || (c === 'VII' ? record?.grade7 : c === 'VIII' ? record?.grade8 : c === 'IX' ? record?.grade9 : undefined);
                                  return (
                                      <React.Fragment key={c}>
                                          <td className="p-1 text-[10px] text-slate-600 text-center border-l border-slate-200">{classData?.semester1?.[subject.id] || '-'}</td>
                                          <td className="p-1 text-[10px] text-slate-600 text-center border-l border-slate-200">{classData?.semester2?.[subject.id] || '-'}</td>
                                      </React.Fragment>
                                  );
                              })}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <h5 className="flex items-center gap-2.5 text-[10px] font-black text-rose-400 uppercase tracking-[0.3em] border-l-4 border-rose-600 pl-4 mb-6">J. Mutasi</h5>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="p-1 text-[8px] font-black text-slate-500 uppercase tracking-widest">Tanggal</th>
                        <th className="p-1 text-[8px] font-black text-slate-500 uppercase tracking-widest">Tujuan</th>
                        <th className="p-1 text-[8px] font-black text-slate-500 uppercase tracking-widest">Alasan</th>
                        <th className="p-1 text-[8px] font-black text-slate-500 uppercase tracking-widest">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportAndMutations.filter(r => r.studentId === student.id).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-[10px] italic text-slate-500">Belum ada data mutasi.</td>
                        </tr>
                      ) : (
                        reportAndMutations.filter(r => r.studentId === student.id).map(record => (
                          <tr key={record.id} className="border-b border-slate-200 hover:bg-white/5 transition-colors">
                            <td className="p-2 text-[10px] font-bold text-rose-400">{record.mutationDate ? formatDateIndo(record.mutationDate) : '-'}</td>
                            <td className="p-2 text-[10px] text-slate-600">{record.mutationDestination || '-'}</td>
                            <td className="p-2 text-[10px] text-slate-600">{record.mutationReason || '-'}</td>
                            <td className="p-2 text-[10px] text-slate-500 italic">{record.notes || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Form Report & Mutation Modal */}
      {showReportMutationForm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-50/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] border border-slate-200 p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Input Nilai Raport & Mutasi</h3>
              <button onClick={() => setShowReportMutationForm(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-500"><X className="w-3.5 h-3.5" /></button>
            </div>
            <form onSubmit={handleReportMutationSubmit} className="space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nilai Raport */}
                <div className="space-y-6">
                  <h4 className="text-xs font-black text-violet-400 uppercase tracking-widest border-b border-slate-200 pb-2">I. Nilai Raport</h4>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <label className="text-[8px] font-bold uppercase text-slate-500">Kelas</label>
                        <input 
                          type="text"
                          placeholder="Contoh: VII, 1, X"
                          value={reportClass} 
                          onChange={e => setReportClass(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 p-2.5 text-[10px] rounded-lg outline-none focus:border-violet-500/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-bold uppercase text-slate-500">Pilih Semester</label>
                        <select 
                          value={reportSemester} 
                          onChange={e => setReportSemester(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 p-2.5 text-[10px] rounded-lg outline-none focus:border-violet-500/50"
                        >
                          <option value="semester1">Semester 1</option>
                          <option value="semester2">Semester 2</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-3 bg-white/60 rounded-2xl border border-slate-200 space-y-3">
                      <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Mata Pelajaran</p>
                      <div className="grid grid-cols-1 gap-2">
                        {subjects.map(subject => (
                          <div key={subject.id} className="flex items-center justify-between gap-2">
                            <label className="text-[10px] font-bold uppercase text-slate-500 w-1/2">{subject.label}</label>
                            <input 
                              type="text" 
                              placeholder="Nilai..."
                              value={reportMutationData.customGrades?.[reportClass]?.[reportSemester]?.[subject.id] || ''} 
                              onChange={e => handleSubjectGradeChange(subject.id, e.target.value)}
                              className="w-1/2 bg-slate-50 border border-slate-200 p-1.5 text-[10px] rounded-lg outline-none focus:border-violet-500/50"
                              disabled={!reportClass.trim()}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mutasi */}
                <div className="space-y-6">
                  <h4 className="text-xs font-black text-rose-400 uppercase tracking-widest border-b border-slate-200 pb-2">J. Mutasi</h4>
                  
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">Tanggal Mutasi</label>
                      <input type="date" value={reportMutationData.mutationDate || ''} onChange={e => setReportMutationData({...reportMutationData, mutationDate: e.target.value})} className="w-full p-3 text-[10px] input-cyber rounded-xl text-slate-800" />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">Tujuan Mutasi</label>
                      <input type="text" value={reportMutationData.mutationDestination || ''} onChange={e => setReportMutationData({...reportMutationData, mutationDestination: e.target.value})} className="w-full p-3 text-[10px] input-cyber rounded-xl text-slate-800" placeholder="Sekolah tujuan..." />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">Alasan Mutasi</label>
                      <input type="text" value={reportMutationData.mutationReason || ''} onChange={e => setReportMutationData({...reportMutationData, mutationReason: e.target.value})} className="w-full p-3 text-[10px] input-cyber rounded-xl text-slate-800" placeholder="Alasan pindah..." />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">Keterangan</label>
                      <textarea value={reportMutationData.notes || ''} onChange={e => setReportMutationData({...reportMutationData, notes: e.target.value})} className="w-full p-3 text-[10px] input-cyber rounded-xl h-24 text-slate-800" placeholder="Catatan tambahan..." />
                    </div>
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full py-3 bg-violet-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-violet-500 transition-colors">SIMPAN DATA</button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-50/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[3rem] border border-slate-200 p-6 shadow-2xl animate-in zoom-in-95 text-center">
            <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-10 h-10 text-rose-500" />
            </div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-4">Hapus Data Siswa?</h3>
            <p className="text-slate-500 mb-8">Data yang dihapus tidak dapat dikembalikan. Apakah Anda yakin?</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 bg-slate-100 text-slate-800 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-colors">Batal</button>
              <button onClick={confirmDelete} className="flex-1 py-3 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-rose-500 transition-colors">Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Form Prestasi Modal */}
      {showAchievementForm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-50/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-[3rem] border border-slate-200 p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Tambah Prestasi</h3>
              <button onClick={() => setShowAchievementForm(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-500"><X className="w-3.5 h-3.5" /></button>
            </div>
            <form onSubmit={handleAchievementSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Tanggal</label>
                  <input type="date" required value={achievementData.date} onChange={e => setAchievementData({...achievementData, date: e.target.value})} className="w-full p-3 text-[10px] input-cyber rounded-xl text-slate-800" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Tingkat</label>
                  <select required value={achievementData.level} onChange={e => setAchievementData({...achievementData, level: e.target.value as any})} className="w-full p-3 text-[10px] input-cyber rounded-xl text-slate-800">
                    <option value="sekolah">Sekolah</option>
                    <option value="kota">Kota</option>
                    <option value="provinsi">Provinsi</option>
                    <option value="nasional">Nasional</option>
                    <option value="internasional">Internasional</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase">Nama Prestasi</label>
                <input required value={achievementData.achievement} onChange={e => setAchievementData({...achievementData, achievement: e.target.value})} className="w-full p-3 text-[10px] input-cyber rounded-xl text-slate-800" placeholder="Contoh: Juara 1 Lomba..." />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase">Uraian</label>
                <textarea required value={achievementData.description} onChange={e => setAchievementData({...achievementData, description: e.target.value})} className="w-full p-3 text-[10px] input-cyber rounded-xl h-24 text-slate-800" placeholder="Detail prestasi..." />
              </div>
              <button type="submit" className="w-full py-3 bg-yellow-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">SIMPAN PRESTASI</button>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[2000] bg-slate-100 text-slate-800 px-4 py-3 rounded-2xl shadow-2xl border border-slate-300 animate-in slide-in-from-bottom-5">
          <p className="font-bold text-xs">{toastMessage}</p>
        </div>
      )}

      {/* Form Kasus Modal */}
      {showViolationForm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-50/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 p-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Tambah Catatan Kasus</h3>
              <button onClick={() => setShowViolationForm(false)} className="p-1.5 hover:bg-slate-100 rounded-xl transition-all text-slate-500"><X className="w-3.5 h-3.5" /></button>
            </div>
            <form onSubmit={handleViolationSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase">Tanggal</label>
                  <input type="date" required value={violationData.date} onChange={e => setViolationData({...violationData, date: e.target.value})} className="w-full p-2 text-[10px] input-cyber rounded-xl text-slate-800" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase">Tingkat</label>
                  <select required value={violationData.level} onChange={e => setViolationData({...violationData, level: e.target.value as any})} className="w-full p-2 text-[10px] input-cyber rounded-xl text-slate-800">
                    <option value="ringan">Ringan</option>
                    <option value="sedang">Sedang</option>
                    <option value="berat">Berat</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase">Nama Kasus</label>
                <input required value={violationData.violation} onChange={e => setViolationData({...violationData, violation: e.target.value})} className="w-full p-2 text-[10px] input-cyber rounded-xl text-slate-800" placeholder="Contoh: Terlambat..." />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase">Uraian</label>
                <textarea required value={violationData.description} onChange={e => setViolationData({...violationData, description: e.target.value})} className="w-full p-2 text-[10px] input-cyber rounded-xl h-16 text-slate-800" placeholder="Detail kejadian..." />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase">Tindakan</label>
                <input required value={violationData.actionTaken} onChange={e => setViolationData({...violationData, actionTaken: e.target.value})} className="w-full p-2 text-[10px] input-cyber rounded-xl text-slate-800" placeholder="Tindakan yang diambil..." />
              </div>
              <button type="submit" className="w-full py-2 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">SIMPAN CATATAN KASUS</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPersonalBook;
