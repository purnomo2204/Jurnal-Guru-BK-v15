
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ViewMode, Student, CounselingLog, TeacherData, AppearanceConfig, CounselingSchedule, AKPDResponse, AKPDQuestion, ClassicalGuidanceSchedule, AttendanceRecord, DailyJournal } from '../types';
import { 
  Users, BarChart3, LogOut, FileCheck, 
  ChevronRight, UserCircle, ChevronDown, ChevronUp,
  Calendar, AlertCircle, HelpCircle, ArrowRight,
  School, Hash, HeartHandshake, ExternalLink, 
  FileText, LayoutGrid, ClipboardList, Settings as SettingsIcon,
  TableProperties, BookOpen, Sparkles, AlertTriangle, Home, Share2, Search,
  GripVertical, Unlock, Lock, User, Clock, CheckCircle, MessageSquare, Database, Inbox, Trash2, Bell
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts';
import StatisticsView from './StatisticsView';
import ClassicalGuidanceReminder from './ClassicalGuidanceReminder';
import AcademicCalendar from './AcademicCalendar';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DropAnimation
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DashboardProps {
  setView?: (view: ViewMode) => void;
  onOpenSettings: (tab?: 'profile' | 'report' | 'cloud' | 'backup' | 'firebase' | 'appearance') => void;
  onOpenProfile: () => void;
  students: Student[];
  logs: CounselingLog[];
  onOpenGuide: () => void;
  teacherData: TeacherData;
  selectedAcademicYear: string;
  setSelectedAcademicYear: (year: string) => void;
  availableAcademicYears: string[];
  appearance: AppearanceConfig;
  onUpdateAppearance?: (config: AppearanceConfig) => void;
  schedules?: CounselingSchedule[];
  onCompleteSchedule?: (id: string) => void;
  isFirebaseActive?: boolean;
  akpdResponses?: AKPDResponse[];
  akpdQuestions?: AKPDQuestion[];
  category?: string;
  academicEvents?: any[];
  onAddAcademicEvent?: (event: any) => void;
  onBulkAddAcademicEvents?: (events: any[]) => void;
  onDeleteAcademicEvent?: (id: string) => void;
  onUpdateAcademicEvent?: (event: any) => void;
  onAddAttendance?: (record: AttendanceRecord) => void;
  onAddDailyJournal?: (journal: DailyJournal) => void;
  classicalSchedules?: ClassicalGuidanceSchedule[];
  onEditClassicalSchedule?: (schedule: ClassicalGuidanceSchedule) => void;
  onDeleteClassicalSchedule?: (id: string) => void;
  editingClassicalSchedule?: ClassicalGuidanceSchedule;
  calendarViewMode?: 'month' | 'week' | 'day' | 'agenda';
  onCalendarViewModeChange?: (mode: 'month' | 'week' | 'day' | 'agenda') => void;
}

const colorClasses: Record<string, string> = {
  cyan: 'text-cyan-600 border-cyan-100 bg-cyan-50 group-hover:bg-cyan-100 group-hover:border-cyan-200',
  emerald: 'text-emerald-600 border-emerald-100 bg-emerald-50 group-hover:bg-emerald-100 group-hover:border-emerald-200',
  yellow: 'text-amber-600 border-amber-100 bg-amber-50 group-hover:bg-amber-100 group-hover:border-amber-200',
  rose: 'text-rose-600 border-rose-100 bg-rose-50 group-hover:bg-rose-100 group-hover:border-rose-200',
  orange: 'text-orange-600 border-orange-100 bg-orange-50 group-hover:bg-orange-100 group-hover:border-orange-200',
  blue: 'text-blue-600 border-blue-100 bg-blue-50 group-hover:bg-blue-100 group-hover:border-blue-200',
  purple: 'text-purple-600 border-purple-100 bg-purple-50 group-hover:bg-purple-100 group-hover:border-purple-200',
  amber: 'text-amber-600 border-amber-100 bg-amber-50 group-hover:bg-amber-100 group-hover:border-amber-200',
  violet: 'text-violet-600 border-violet-100 bg-violet-50 group-hover:bg-violet-100 group-hover:border-violet-200',
  teal: 'text-teal-600 border-teal-100 bg-teal-50 group-hover:bg-teal-100 group-hover:border-teal-200',
  indigo: 'text-indigo-600 border-indigo-100 bg-indigo-50 group-hover:bg-indigo-100 group-hover:border-indigo-200',
  pink: 'text-pink-600 border-pink-100 bg-pink-50 group-hover:bg-pink-100 group-hover:border-pink-200',
  sky: 'text-sky-600 border-sky-100 bg-sky-50 group-hover:bg-sky-100 group-hover:border-sky-200',
  lime: 'text-lime-600 border-lime-100 bg-lime-50 group-hover:bg-lime-100 group-hover:border-lime-200',
};

const SortableItem = ({ id, item, isEditMode, handleNavigate, isSpecial, category }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto',
    position: 'relative' as 'relative',
    touchAction: 'none'
  };

  let bgClass = 'bg-white standard:bg-blue-50/50 border-slate-300 standard:border-blue-200 shadow-sm hover:border-sky-400 standard:hover:border-blue-400 hover:shadow-md hover:shadow-sky-500/5';
  
  if (isSpecial) {
    bgClass = 'bg-gradient-to-br from-amber-50 to-orange-50 standard:from-blue-50 standard:to-indigo-50 border-blue-500 standard:border-blue-500 shadow-sm hover:border-blue-600 hover:shadow-md border-2';
  } else if (category === 'Laporan') {
    bgClass = 'bg-gradient-to-br from-white to-indigo-50/30 standard:from-blue-50 standard:to-blue-100/30 border-indigo-300 standard:border-blue-300 shadow-sm hover:border-indigo-400 hover:shadow-md';
  } else if (category === 'Sistem') {
    bgClass = 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-300 shadow-sm hover:border-slate-400 hover:shadow-md';
  } else if (category === 'KOLABORASI TIM') {
    bgClass = 'bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-500 shadow-lg shadow-blue-500/20 text-white';
  }

  return (
    <div ref={setNodeRef} style={style} className="h-full">
      <button
        onClick={() => { console.log("Clicked:", item.title, item.view); !isEditMode && (item.view ? handleNavigate(item.view) : item.onAction && item.onAction()); }}
        className={`group relative p-4 rounded-2xl border overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] w-full h-full text-left ${bgClass} ${isEditMode ? 'cursor-default' : ''}`}
      >
        <div className="flex items-center gap-3.5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${category === 'KOLABORASI TIM' ? 'text-slate-800 border-slate-400 bg-white/10' : colorClasses[item.color]}`}>
            {React.cloneElement(item.icon, { className: 'w-5 h-5' })}
          </div>
          <div>
            <h3 className={`${category === 'KOLABORASI TIM' ? 'text-slate-800' : (category === 'Laporan' ? 'text-indigo-600' : 'text-slate-800')} font-bold text-[16px] uppercase tracking-wider leading-tight`} style={{ fontFamily: 'Orbitron, sans-serif' }}>{item.title}</h3>
            <p className={`${category === 'KOLABORASI TIM' ? 'text-slate-800/70' : 'text-slate-500'} text-[13px] mt-1 line-clamp-1 font-medium`}>{item.desc}</p>
          </div>
        </div>
        
        {isEditMode && (
          <div {...attributes} {...listeners} className="absolute top-2 right-2 p-2 bg-slate-50 rounded-full cursor-grab active:cursor-grabbing text-slate-500 hover:text-sky-500 z-10 border border-slate-300 hover:bg-white transition-colors">
            <GripVertical className="w-4 h-4" />
          </div>
        )}
      </button>
    </div>
  );
};

interface MenuItem {
  title: string;
  desc: string;
  icon: React.ReactNode;
  view?: ViewMode;
  color: string;
  onAction?: () => void;
}

const menuItems: Record<string, MenuItem[]> = {
  'Input Data': [
    { title: 'Database Siswa', desc: 'Manajemen data profil bimbingan.', icon: <Users/>, view: ViewMode.STUDENT_LIST, color: 'cyan' },
    { title: 'AKPD', desc: 'Analisa Kebutuhan Peserta Didik.', icon: <ClipboardList/>, view: ViewMode.NEED_ASSESSMENT, color: 'teal' },
    { title: 'TDA', desc: 'Dokumentasi Tes Diagnostik Awal.', icon: <ClipboardList/>, view: ViewMode.TDA_INPUT, color: 'purple' },
    { title: 'Absensi Siswa', desc: 'Kelola absensi harian siswa.', icon: <FileCheck/>, view: ViewMode.ATTENDANCE_MANAGEMENT, color: 'orange' },
    { title: 'Prestasi, Beasiswa & Siswa Tidak Mampu', desc: 'Dokumentasikan pencapaian, beasiswa, dan data siswa tidak mampu.', icon: <Sparkles/>, view: ViewMode.ACHIEVEMENT_MANAGEMENT, color: 'yellow' },
    { title: 'Catatan Anekdot', desc: 'Dokumentasi insiden & penanganan.', icon: <ClipboardList/>, view: ViewMode.ANECDOTAL_RECORD_DATA, color: 'pink' },
    { title: 'Catatan Kasus', desc: 'Dokumentasikan kasus siswa.', icon: <AlertCircle/>, view: ViewMode.VIOLATION_MANAGEMENT, color: 'rose' },
    { title: 'Home Visit', desc: 'Dokumentasi kunjungan rumah.', icon: <Home/>, view: ViewMode.HOME_VISIT, color: 'orange' },
    { title: 'Nilai Raport & Mutasi', desc: 'Data raport & mutasi siswa.', icon: <ClipboardList/>, view: ViewMode.REPORT_MUTATION, color: 'violet' },
    { title: 'LAYANAN BK', desc: 'Pencatatan aktivitas pendampingan.', icon: <FileText/>, view: ViewMode.COUNSELING_INPUT, color: 'emerald' },
    { title: 'Jadwal Klasikal', desc: 'Jadwal bimbingan klasikal rutin.', icon: <Calendar/>, view: ViewMode.CLASSICAL_GUIDANCE_SCHEDULE, color: 'teal' },
    { title: 'Jadwal Konseling', desc: 'Atur agenda pertemuan siswa.', icon: <Calendar/>, view: ViewMode.COUNSELING_SCHEDULE, color: 'blue' },
    { title: 'Alih Tangan Kasus', desc: 'Proses rujukan siswa.', icon: <Share2/>, view: ViewMode.REFERRAL_MANAGEMENT, color: 'indigo' },
    { title: 'Komunikasi Ortu', desc: 'Pesan & update untuk orang tua.', icon: <MessageSquare/>, view: ViewMode.PARENT_COMMUNICATION, color: 'blue' },
    { title: 'Sosiometri', desc: 'Analisis hubungan sosial siswa.', icon: <Users/>, view: ViewMode.SOCIOMETRY, color: 'blue' },
    { title: 'JURNAL HARIAN BK', desc: 'Catatan kegiatan harian.', icon: <BookOpen/>, view: ViewMode.DAILY_JOURNAL_DATA, color: 'orange' },
  ],
  'KOLABORASI TIM': [
    { title: 'Kotak Masalah', desc: 'Wadah aspirasi & pengaduan siswa.', icon: <Inbox/>, view: ViewMode.PROBLEM_BOX, color: 'rose' },
  ],
  'Laporan': [
    { title: 'Analitik Data', desc: 'Visualisasi riwayat bimbingan.', icon: <BarChart3/>, view: ViewMode.ANALYTICS, color: 'purple' },
    { title: 'Laporan LPJ', desc: 'Generasi laporan pertanggungjawaban.', icon: <FileCheck/>, view: ViewMode.LPJ_MANAGEMENT, color: 'amber' },
    { title: 'Buku Pribadi', desc: 'Profil mendalam & riwayat klien.', icon: <BookOpen/>, view: ViewMode.STUDENT_PERSONAL_BOOK, color: 'violet' },
    { title: 'Peta Kerawanan', desc: 'Deteksi dini risiko masalah siswa.', icon: <AlertTriangle/>, view: ViewMode.VULNERABILITY_MAP, color: 'rose' },
    { title: 'Laporan Layanan', desc: 'Arsip per jenis layanan bimbingan.', icon: <LayoutGrid/>, view: ViewMode.STRATEGY_HUB, color: 'cyan' },
    { title: 'Riwayat Layanan', desc: 'Review arsip administrasi BK.', icon: <HeartHandshake/>, view: ViewMode.COUNSELING_DATA, color: 'sky' },
    { title: 'Laporan Kemajuan', desc: 'Generate laporan kemajuan siswa.', icon: <FileText/>, view: ViewMode.AUTOMATED_REPORTS, color: 'lime' },
    { title: 'Rekapitulasi', desc: 'Laporan Pelaksanaan Kegiatan.', icon: <TableProperties/>, view: ViewMode.COMPONENT_RECAP, color: 'indigo' },
    { title: 'Data Siswa Asuh', desc: 'Daftar siswa bimbingan per kelas.', icon: <Users/>, view: ViewMode.STUDENT_DATA_REPORT, color: 'emerald' },
  ],
  'Sistem': [
    { title: 'Pengaturan Aplikasi', desc: 'Pengaturan sistem, cloud, & backup.', icon: <SettingsIcon/>, color: 'blue' },
    { title: 'Backup ke Flashdisk', desc: 'Simpan data ke Flashdisk / HD Eksternal.', icon: <Database/>, color: 'cyan' },
    { title: 'Hapus Semua Data', desc: 'Hapus semua data di aplikasi ini.', icon: <Trash2/>, color: 'rose' },
  ]
};

const Dashboard: React.FC<DashboardProps> = ({ 
  setView, onOpenSettings, onOpenProfile, students = [], logs = [], onOpenGuide, 
  teacherData, selectedAcademicYear, setSelectedAcademicYear, 
  availableAcademicYears = [], appearance, onUpdateAppearance, schedules = [], 
  onCompleteSchedule, isFirebaseActive, akpdResponses = [], akpdQuestions = [], 
  category, academicEvents = [], onAddAcademicEvent, 
  onBulkAddAcademicEvents,
  onDeleteAcademicEvent, onUpdateAcademicEvent,
  onAddAttendance, onAddDailyJournal,
  classicalSchedules = [],
  onEditClassicalSchedule, onDeleteClassicalSchedule,
  editingClassicalSchedule,
  calendarViewMode,
  onCalendarViewModeChange
}) => {
  const navigate = useNavigate();
  const [isQuickJournalVisible, setIsQuickJournalVisible] = useState(true);
  const [showClassicalReminder, setShowClassicalReminder] = useState(true);
  const [selectedClassForQuickJournal, setSelectedClassForQuickJournal] = useState('ALL');
  const [quickJournal, setQuickJournal] = useState({
    activityName: '',
    place: '',
    description: '',
    note: '',
    studentId: '',
    attendanceStatus: 'Hadir' as any,
  });

  // Smart Default Logic for Quick Journal
  useEffect(() => {
    if (quickJournal.studentId && !quickJournal.activityName) {
      const student = students.find(s => s.id === quickJournal.studentId);
      if (student) {
        const defaultName = (quickJournal.attendanceStatus === 'Hadir' || !quickJournal.attendanceStatus) 
          ? `Pendampingan Siswa: ${student.name}` 
          : `Siswa ${quickJournal.attendanceStatus}: ${student.name}`;
        setQuickJournal(prev => ({ ...prev, activityName: defaultName }));
      }
    }
  }, [quickJournal.studentId, quickJournal.attendanceStatus, students]);

  const filteredStudentsForQuickJournal = useMemo(() => {
    if (selectedClassForQuickJournal === 'ALL') return students;
    return students.filter(s => s.className === selectedClassForQuickJournal);
  }, [students, selectedClassForQuickJournal]);

  const handleQuickJournalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate: at least activityName or studentId must be present
    if (!quickJournal.activityName && !quickJournal.studentId) {
      alert('Mohon isi nama kegiatan atau pilih siswa.');
      return;
    }

    const student = students.find(s => s.id === quickJournal.studentId);
    
    // 1. Save to Daily Journal (Tugas Pokok)
    if (onAddDailyJournal) {
      let finalActivityName = quickJournal.activityName;
      if (!finalActivityName && student) {
        if (quickJournal.attendanceStatus === 'Hadir' || !quickJournal.attendanceStatus) {
          finalActivityName = `Pendampingan Siswa: ${student.name}`;
        } else {
          finalActivityName = `Siswa ${quickJournal.attendanceStatus}: ${student.name}`;
        }
      } else if (!finalActivityName) {
        finalActivityName = 'Kegiatan BK';
      }

      onAddDailyJournal({
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        day: new Date().toLocaleDateString('id-ID', { weekday: 'long' }),
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        activityType: 'Tugas Pokok',
        activityName: finalActivityName,
        place: quickJournal.place || 'Ruang BK',
        description: quickJournal.description || (student ? `Konseling/Pendampingan untuk ${student.name}` : '-'),
        notes: quickJournal.note,
        status: 'Selesai',
        className: student?.className || ''
      });
    }

    // 2. Save to Attendance if student selected and not "Hadir"
    if (student && quickJournal.attendanceStatus !== 'Hadir' && onAddAttendance) {
      onAddAttendance({
        id: (Date.now() + 1).toString(),
        date: new Date().toISOString().split('T')[0],
        studentId: student.id,
        status: quickJournal.attendanceStatus,
        semester: 'Ganjil', // Default
        notes: quickJournal.note
      });
    }

    setQuickJournal({
      activityName: '',
      place: '',
      description: '',
      note: '',
      studentId: '',
      attendanceStatus: 'Hadir',
    });
    alert('Jurnal cepat berhasil disimpan!');
  };
  const handleNavigate = (view: ViewMode) => {
    console.log("Navigating to:", view);
    if (setView) {
      setView(view);
    } else {
      switch(view) {
        case ViewMode.HOME: navigate('/dashboard'); break;
        case ViewMode.WELCOME: navigate('/welcome'); break;
        case ViewMode.STUDENT_LIST: navigate('/dashboard'); break;
        case ViewMode.COUNSELING_INPUT: navigate('/input'); break;
        case ViewMode.ACHIEVEMENT_MANAGEMENT: navigate('/input'); break;
        case ViewMode.VIOLATION_MANAGEMENT: navigate('/input'); break;
        case ViewMode.ATTENDANCE_MANAGEMENT: navigate('/input'); break;
        case ViewMode.COUNSELING_SCHEDULE: navigate('/input'); break;
        case ViewMode.CLASSICAL_GUIDANCE_SCHEDULE: navigate('/input'); break;
        case ViewMode.ANECDOTAL_RECORD_DATA: navigate('/input'); break;
        case ViewMode.HOME_VISIT: navigate('/input'); break;
        case ViewMode.NEED_ASSESSMENT: navigate('/input'); break;
        case ViewMode.REFERRAL_MANAGEMENT: navigate('/input'); break;
        case ViewMode.REPORT_MUTATION: navigate('/laporan'); break;
        case ViewMode.PARENT_COMMUNICATION: navigate('/input'); break;
        case ViewMode.TDA_INPUT: navigate('/input'); break;
        case ViewMode.SOCIOMETRY: navigate('/input'); break;
        case ViewMode.ANALYTICS: navigate('/laporan'); break;
        case ViewMode.LPJ_MANAGEMENT: navigate('/laporan'); break;
        case ViewMode.STUDENT_PERSONAL_BOOK: navigate('/dashboard'); break;
        case ViewMode.VULNERABILITY_MAP: navigate('/laporan'); break;
        case ViewMode.STRATEGY_HUB: navigate('/laporan'); break;
        case ViewMode.COUNSELING_DATA: navigate('/laporan'); break;
        case ViewMode.AUTOMATED_REPORTS: navigate('/laporan'); break;
        case ViewMode.COMPONENT_RECAP: navigate('/laporan'); break;
        case ViewMode.STUDENT_DATA_REPORT: navigate('/laporan'); break;
        case ViewMode.COLLABORATION: navigate('/dashboard'); break;
        case ViewMode.DOCUMENT_MANAGEMENT: navigate('/settings-menu'); break;
        case ViewMode.SETTINGS: navigate('/settings'); break;
        default: navigate('/dashboard');
      }
    }
  };
  console.log("Dashboard category:", category);
  const [selectedClassForStats, setSelectedClassForStats] = useState('ALL');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const classes = useMemo(() => {
    return Array.from(new Set(students.map(s => s.className))).sort();
  }, [students]);

  const stats = useMemo(() => {
    const normalizeGender = (g: string) => {
      if (!g) return '';
      const normalized = g.toLowerCase().replace(/[\s-]/g, '');
      if (normalized === 'l' || normalized.includes('laki')) return 'lakilaki';
      if (normalized === 'p' || normalized.includes('perempuan')) return 'perempuan';
      return normalized;
    };
    
    const allStats = {
      total: students.length,
      male: students.filter(s => normalizeGender(s.gender) === 'lakilaki').length,
      female: students.filter(s => normalizeGender(s.gender) === 'perempuan').length
    };

    const classStats = classes.map(c => {
      const classStudents = students.filter(s => s.className === c);
      return {
        className: c,
        total: classStudents.length,
        male: classStudents.filter(s => normalizeGender(s.gender) === 'lakilaki').length,
        female: classStudents.filter(s => normalizeGender(s.gender) === 'perempuan').length
      };
    });

    return { all: allStats, classes: classStats };
  }, [students, classes]);

  const upcomingSchedules = useMemo(() => {
    if (!schedules) return [];
    return schedules
      .filter(s => s.status !== 'completed')
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.time.localeCompare(b.time);
      });
  }, [schedules]);

  const filteredAcademicEvents = useMemo(() => {
    if (!selectedAcademicYear) return academicEvents;
    return academicEvents.filter(e => {
      const date = new Date(e.date);
      const month = date.getMonth();
      const year = date.getFullYear();
      // Academic year starts in July (month 6)
      const eventAcademicYear = month >= 6 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
      return eventAcademicYear === selectedAcademicYear;
    });
  }, [academicEvents, selectedAcademicYear]);

  const akpdStats = useMemo(() => {
    if (!akpdResponses || !akpdQuestions || akpdResponses.length === 0) return [];

    const aspectCounts: Record<string, { yes: number, total: number }> = {
      'Pribadi': { yes: 0, total: 0 },
      'Sosial': { yes: 0, total: 0 },
      'Belajar': { yes: 0, total: 0 },
      'Karier': { yes: 0, total: 0 }
    };

    akpdResponses.forEach(response => {
      response.responses?.forEach((isYes, index) => {
        const question = akpdQuestions[index];
        if (question && aspectCounts[question.aspect]) {
          aspectCounts[question.aspect].total++;
          if (isYes) {
            aspectCounts[question.aspect].yes++;
          }
        }
      });
    });

    const COLORS: Record<string, string> = {
      'Pribadi': '#3b82f6', // blue-500
      'Sosial': '#10b981', // emerald-500
      'Belajar': '#f59e0b', // amber-500
      'Karier': '#8b5cf6' // violet-500
    };

    return Object.entries(aspectCounts).map(([name, counts]) => ({
      name,
      value: counts.total > 0 ? Math.round((counts.yes / counts.total) * 100) : 0,
      color: COLORS[name] || '#64748b'
    })).filter(stat => stat.value > 0);
  }, [akpdResponses, akpdQuestions]);


  const [isEditMode, setIsEditMode] = useState(false);
  
  // Initialize layout from localStorage or default
  const [layout, setLayout] = useState<{ [key: string]: string[] }>(() => {
    const defaultLayout = {
      'Input Data': menuItems['Input Data'].map(i => i.title),
      'KOLABORASI TIM': menuItems['KOLABORASI TIM'].map(i => i.title),
      'Laporan': menuItems['Laporan'].map(i => i.title),
      'Sistem': menuItems['Sistem'].map(i => i.title)
    };

    let parsed = null;
    if (appearance.dashboardLayout) {
      parsed = appearance.dashboardLayout;
    } else {
      const saved = localStorage.getItem('guru_bk_dashboard_layout');
      if (saved) {
        try {
          parsed = JSON.parse(saved);
        } catch (e) {
          console.error("Error parsing saved layout", e);
        }
      }
    }

    if (parsed) {
      // Migration: rename PUSAT PENGATURAN to Sistem and Konfigurasi to Pengaturan Aplikasi
      if (parsed['PUSAT PENGATURAN'] && Array.isArray(parsed['PUSAT PENGATURAN'])) {
        parsed['Sistem'] = parsed['PUSAT PENGATURAN'].map((t: string) => t === 'Konfigurasi' ? 'Pengaturan Aplikasi' : t);
        delete parsed['PUSAT PENGATURAN'];
      }
      if (parsed['Input Data'] && Array.isArray(parsed['Input Data'])) {
        parsed['Input Data'] = parsed['Input Data'].map((t: string) => t === 'Jurnal Harian' ? 'LAYANAN BK' : t);
      }
      
      // Ensure new items are added to the layout
      const mergedLayout: { [key: string]: string[] } = { ...defaultLayout };
      Object.keys(defaultLayout).forEach(category => {
        const defaultItems = defaultLayout[category as keyof typeof defaultLayout];
        const savedItems = parsed[category] || [];
        
        // Keep saved order, but add any missing default items at the end
        const missingItems = defaultItems.filter(item => !savedItems.includes(item));
        mergedLayout[category] = [...savedItems, ...missingItems];
      });
      
      return mergedLayout;
    }
    
    return defaultLayout;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active && over && active.id !== over.id) {
      // Find category
      let category = '';
      for (const cat in layout) {
        if (layout[cat].includes(active.id) && layout[cat].includes(over.id)) {
          category = cat;
          break;
        }
      }

      if (category) {
        setLayout((prev) => {
          const oldIndex = prev[category].indexOf(active.id);
          const newIndex = prev[category].indexOf(over.id);
          
          const newLayout = {
            ...prev,
            [category]: arrayMove(prev[category], oldIndex, newIndex),
          };
          localStorage.setItem('guru_bk_dashboard_layout', JSON.stringify(newLayout));
          if (onUpdateAppearance) {
            onUpdateAppearance({ ...appearance, dashboardLayout: newLayout });
          }
          return newLayout;
        });
      }
    }
  };

  const allMenuItems = useMemo(() => {
    const items = { ...menuItems };
    // Inject actions for Sistem
    items['Sistem'] = [
      { 
        title: 'Pengaturan Aplikasi', 
        desc: 'Pengaturan sistem, cloud, & backup.', 
        icon: <SettingsIcon/>, 
        color: 'blue',
        onAction: () => onOpenSettings()
      },
      { 
        title: 'Backup ke Flashdisk', 
        desc: 'Simpan data ke Flashdisk / HD Eksternal.', 
        icon: <Database/>, 
        color: 'cyan',
        onAction: () => onOpenSettings('backup')
      },
      { 
        title: 'Hapus Semua Data', 
        desc: 'Hapus semua data di aplikasi ini.', 
        icon: <Trash2/>, 
        color: 'rose',
        onAction: () => setShowDeleteConfirm(true)
      },
    ];
    return items;
  }, [onOpenSettings, onOpenGuide]);

  const getItemByTitle = (title: string, category: string) => {
    return allMenuItems[category as keyof typeof allMenuItems]?.find(i => i.title === title);
  };

  return (
    <div className="animate-fade-in transition-colors duration-300">
      <div className="fixed inset-0 bg-grid-slate-200/50 standard:bg-grid-blue-200/20 [mask-image:linear-gradient(to_bottom,white_20%,transparent_100%)] pointer-events-none"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_400px_at_50%_200px,#3b82f610,transparent)] standard:bg-[radial-gradient(circle_400px_at_50%_200px,#3b82f605,transparent)]"></div>

      <div className="relative z-10">
        {/* Header - Always show for context */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div />
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 standard:bg-emerald-100/50 border border-emerald-100 standard:border-emerald-200 rounded-full">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
              <span className="text-[8px] font-black text-emerald-600 standard:text-emerald-700 uppercase tracking-widest">Penyimpanan Lokal Aktif</span>
            </div>
            {isFirebaseActive ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-50 standard:bg-blue-100/50 border border-sky-100 standard:border-blue-200 rounded-full cursor-pointer hover:bg-sky-100 standard:hover:bg-blue-200 transition-colors" onClick={() => onOpenSettings('firebase')} title="Firebase Terhubung">
                <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(14,165,233,0.3)]" />
                <span className="text-[8px] font-black text-sky-600 standard:text-blue-700 uppercase tracking-widest">Firebase Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 standard:bg-blue-50/50 border border-slate-200 standard:border-blue-100 rounded-full cursor-pointer hover:bg-slate-200 standard:hover:bg-blue-100 transition-colors" onClick={() => onOpenSettings('firebase')} title="Hubungkan ke Firebase">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                <span className="text-[8px] font-black text-slate-500 standard:text-blue-400 uppercase tracking-widest">Firebase Offline</span>
              </div>
            )}
            <button 
              onClick={() => setIsEditMode(!isEditMode)} 
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center gap-2 shadow-sm ${isEditMode ? 'bg-sky-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-600 hover:text-sky-600 dark:hover:text-sky-400'}`}
            >
              {isEditMode ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              {isEditMode ? 'Selesai Edit' : 'Edit Susunan'}
            </button>
            <div className="flex flex-col">
              <label className="text-[8px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-1 ml-1">PILIH TAHUN AJARAN</label>
              <select
                value={selectedAcademicYear}
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-[10px] font-bold outline-none focus:ring-2 focus:ring-sky-500/20 transition-all shadow-sm text-slate-800 dark:text-slate-200"
              >
                {availableAcademicYears.map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
            <button onClick={() => handleNavigate(ViewMode.WELCOME)} className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-xl text-[10px] font-black hover:bg-red-100 hover:text-red-700 transition-all shadow-sm uppercase tracking-widest self-end">
              <LogOut className="w-3.5 h-3.5" /> KELUAR
            </button>
          </div>
        </header>

        {category === 'Dashboard' && (
          <div className="space-y-8">
            {/* Quick Journal Entry */}
            <div className="glass-card p-6 rounded-3xl border border-white/50 shadow-xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-sky-500/10 transition-colors"></div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-500/10 flex items-center justify-center border border-sky-100">
                    <BookOpen className="w-5 h-5 text-sky-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest" style={{ fontFamily: 'Orbitron, sans-serif' }}>AKSES CEPAT JURNAL HARIAN</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Input cepat kegiatan harian & absensi</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsQuickJournalVisible(!isQuickJournalVisible)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-sky-500"
                  title={isQuickJournalVisible ? "Sembunyikan" : "Tampilkan"}
                >
                  {isQuickJournalVisible ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>

              {isQuickJournalVisible && (
                <form onSubmit={handleQuickJournalSubmit} className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Kegiatan</label>
                    <input
                      type="text"
                      value={quickJournal.activityName}
                      onChange={e => setQuickJournal({ ...quickJournal, activityName: e.target.value })}
                      placeholder="Nama kegiatan..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Tempat</label>
                    <input
                      type="text"
                      value={quickJournal.place}
                      onChange={e => setQuickJournal({ ...quickJournal, place: e.target.value })}
                      placeholder="Lokasi..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Filter Kelas</label>
                    <select
                      value={selectedClassForQuickJournal}
                      onChange={e => {
                        setSelectedClassForQuickJournal(e.target.value);
                        setQuickJournal(prev => ({ ...prev, studentId: '' }));
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
                    >
                      <option value="ALL">Semua Kelas</option>
                      {classes.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Pilih Siswa (Opsional)</label>
                    <select
                      value={quickJournal.studentId}
                      onChange={e => setQuickJournal({ ...quickJournal, studentId: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
                    >
                      <option value="">Pilih Siswa...</option>
                      {filteredStudentsForQuickJournal.sort((a, b) => a.name.localeCompare(b.name)).map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.className})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="space-y-1 md:col-span-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Deskripsi Kegiatan</label>
                    <input
                      type="text"
                      value={quickJournal.description}
                      onChange={e => setQuickJournal({ ...quickJournal, description: e.target.value })}
                      placeholder="Detail kegiatan..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Catatan / Observasi</label>
                    <input
                      type="text"
                      value={quickJournal.note}
                      onChange={e => setQuickJournal({ ...quickJournal, note: e.target.value })}
                      placeholder="Catatan singkat..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Status Absensi</label>
                    <select
                      value={quickJournal.attendanceStatus}
                      onChange={e => setQuickJournal({ ...quickJournal, attendanceStatus: e.target.value as any })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
                      disabled={!quickJournal.studentId}
                    >
                      <option value="Hadir">Hadir</option>
                      <option value="Sakit">Sakit</option>
                      <option value="Ijin">Izin</option>
                      <option value="Alpa">Alpa</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="bg-sky-500 hover:bg-sky-600 text-white font-black text-[10px] uppercase tracking-widest py-2.5 px-6 rounded-xl shadow-lg shadow-sky-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> Simpan Jurnal
                  </button>
                </div>
              </form>
            )}
            </div>

            {/* Classical Guidance Reminder */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest" style={{ fontFamily: 'Orbitron, sans-serif' }}>Jadwal Bimbingan Klasikal</h3>
                <button 
                  onClick={() => setShowClassicalReminder(!showClassicalReminder)}
                  className="text-[10px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 transition-colors"
                >
                  {showClassicalReminder ? 'Sembunyikan' : 'Tampilkan'}
                </button>
              </div>
              
              {showClassicalReminder && (
                <ClassicalGuidanceReminder 
                  schedules={classicalSchedules || []} 
                  onEdit={onEditClassicalSchedule || (() => {})} 
                  onDelete={onDeleteClassicalSchedule || (() => {})} 
                />
              )}
            </div>

            {/* Key Metrics & Stats */}
            <StatisticsView students={students} />

            {/* Academic Calendar */}
            <div className="mt-8">
              <AcademicCalendar 
                events={academicEvents || []}
                onAddEvent={onAddAcademicEvent || (() => {})}
                onBulkAddEvents={onBulkAddAcademicEvents || (() => {})}
                onDeleteEvent={onDeleteAcademicEvent || (() => {})}
                onUpdateEvent={onUpdateAcademicEvent || (() => {})}
                viewMode={calendarViewMode}
                onViewModeChange={onCalendarViewModeChange}
              />
            </div>
          </div>
        )}

        {/* Main Layout */}
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter} 
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            {category !== 'Dashboard' && (
              <main className="lg:col-span-3 space-y-8">
                {(() => {
                  const baseOrder = appearance.moduleOrder || Object.keys(menuItems);
                  const missingKeys = Object.keys(menuItems).filter(key => !baseOrder.includes(key));
                  const fullOrder = [...baseOrder, ...missingKeys];
                  
                  const filteredCategories = category && category !== 'Dashboard'
                    ? fullOrder.filter(key => key === category && menuItems[key])
                    : fullOrder.filter(key => menuItems[key]);
                  
                  return filteredCategories.map((categoryKey) => {
                    const itemTitles = layout[categoryKey] || (menuItems[categoryKey] ? menuItems[categoryKey].map(i => i.title) : []);
                    
                    return (
                      <section key={categoryKey}>
                        <h2 className="text-xl font-black text-slate-600 uppercase tracking-widest mb-6 px-1 border-l-4 border-sky-500 pl-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>{categoryKey}</h2>
                        <SortableContext 
                          items={itemTitles} 
                          strategy={rectSortingStrategy}
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {itemTitles.map((title) => {
                              const item = getItemByTitle(title, categoryKey);
                              if (!item) return null;
                              return (
                                <SortableItem 
                                  key={title} 
                                  id={title} 
                                  item={item} 
                                  isEditMode={isEditMode} 
                                  handleNavigate={handleNavigate} 
                                  isSpecial={categoryKey === 'Sistem'}
                                  category={categoryKey}
                                />
                              );
                            })}
                          </div>
                        </SortableContext>
                      </section>
                    );
                  });
                })()}
              </main>
            )}
          </div>
        </DndContext>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-rose-500 to-pink-600 text-white">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest">Hapus Semua Data</h3>
                  <p className="text-[8px] opacity-80 font-bold uppercase tracking-wider">Peringatan Kritis</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-8 h-8 text-rose-500" />
                </div>
              </div>
              <p className="text-sm text-center text-slate-600 font-medium">
                Apakah Anda yakin ingin menghapus <strong>SEMUA DATA</strong> di aplikasi ini?
              </p>
              <div className="bg-rose-50 p-3 rounded-xl border border-rose-100">
                <p className="text-xs text-rose-600 font-bold text-center">
                  Tindakan ini tidak dapat dibatalkan. Semua data siswa, laporan, jadwal, dan pengaturan akan hilang selamanya.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 bg-white text-slate-600 rounded-xl font-bold text-xs border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                TIDAK, BATALKAN
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  alert("Semua data telah berhasil dihapus. Aplikasi akan dimuat ulang dalam keadaan kosong.");
                  window.location.reload();
                }}
                className="flex-1 py-2.5 bg-rose-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-colors"
              >
                YA, HAPUS SEMUA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
