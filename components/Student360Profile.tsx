import React, { useMemo } from 'react';
import { 
  Student, 
  CounselingLog, 
  Violation, 
  Achievement, 
  AttendanceRecord, 
  AKPDResponse, 
  HomeVisit, 
  EventLog, 
  TDA, 
  ReportAndMutation,
  ViewMode
} from '../types';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Award, 
  AlertTriangle, 
  MessageSquare, 
  Home, 
  BookOpen, 
  TrendingUp, 
  Activity,
  MapPin,
  Phone,
  Heart,
  Target,
  Briefcase,
  GraduationCap,
  Clock,
  ChevronRight,
  Download,
  Share2,
  MoreVertical,
  Star,
  Hash,
  Users
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { AKPD_QUESTIONS } from '../constants';

interface Student360ProfileProps {
  student: Student;
  counselingLogs: CounselingLog[];
  violations: Violation[];
  achievements: Achievement[];
  attendanceRecords: AttendanceRecord[];
  akpdResponses: AKPDResponse[];
  homeVisits: HomeVisit[];
  eventLogs: EventLog[];
  tdaRecords: TDA[];
  reportAndMutations: ReportAndMutation[];
  setView: (v: ViewMode) => void;
  onClose: () => void;
}

const Student360Profile: React.FC<Student360ProfileProps> = ({
  student,
  counselingLogs,
  violations,
  achievements,
  attendanceRecords,
  akpdResponses,
  homeVisits,
  eventLogs,
  tdaRecords,
  reportAndMutations,
  setView,
  onClose
}) => {
  // Data Filtering
  const studentCounseling = useMemo(() => counselingLogs.filter(l => l.studentId === student.id), [counselingLogs, student.id]);
  const studentViolations = useMemo(() => violations.filter(v => v.studentId === student.id), [violations, student.id]);
  const studentAchievements = useMemo(() => achievements.filter(a => a.studentId === student.id), [achievements, student.id]);
  const studentAttendance = useMemo(() => attendanceRecords.filter(r => r.studentId === student.id), [attendanceRecords, student.id]);
  const studentHomeVisits = useMemo(() => homeVisits.filter(v => v.studentId === student.id), [homeVisits, student.id]);
  const studentAnecdotes = useMemo(() => eventLogs.filter(e => e.studentId === student.id), [eventLogs, student.id]);
  const studentTda = useMemo(() => tdaRecords.find(t => t.studentId === student.id), [tdaRecords, student.id]);
  const studentAkpd = useMemo(() => akpdResponses.find(r => r.studentId === student.id), [akpdResponses, student.id]);

  // Metrics Calculation
  const attendanceRate = useMemo(() => {
    if (studentAttendance.length === 0) return 100;
    const alpa = studentAttendance.filter(r => r.status === 'Alpa').length;
    // Assuming 100 school days for simplicity or just showing count
    return Math.max(0, 100 - (alpa * 2)); // Simple penalty for Alpa
  }, [studentAttendance]);

  const akpdData = useMemo(() => {
    if (!studentAkpd) return [];
    
    const aspects = {
      Pribadi: 0,
      Sosial: 0,
      Belajar: 0,
      Karier: 0
    };
    
    const counts = {
      Pribadi: 0,
      Sosial: 0,
      Belajar: 0,
      Karier: 0
    };

    AKPD_QUESTIONS.forEach((q, idx) => {
      counts[q.aspect]++;
      if (studentAkpd.responses[idx]) {
        aspects[q.aspect]++;
      }
    });

    return Object.entries(aspects).map(([name, value]) => ({
      subject: name,
      A: (value / counts[name as keyof typeof counts]) * 100,
      fullMark: 100
    }));
  }, [studentAkpd]);

  const timelineItems = useMemo(() => {
    const items = [
      ...studentCounseling.map(l => ({ date: l.date, type: 'Counseling', title: l.type, color: 'blue', icon: MessageSquare })),
      ...studentViolations.map(v => ({ date: v.date, type: 'Violation', title: v.violation, color: 'red', icon: AlertTriangle })),
      ...studentAchievements.map(a => ({ date: a.date, type: 'Achievement', title: a.achievement, color: 'green', icon: Award })),
      ...studentHomeVisits.map(v => ({ date: v.date, type: 'Home Visit', title: v.purpose, color: 'purple', icon: Home })),
      ...studentAnecdotes.map(e => ({ date: e.date, type: 'Anecdote', title: e.description.substring(0, 30) + '...', color: 'amber', icon: BookOpen }))
    ];

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
  }, [studentCounseling, studentViolations, studentAchievements, studentHomeVisits, studentAnecdotes]);

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Header Section */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-lg font-black text-slate-800 uppercase tracking-tight">Profil 360 Siswa</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dashboard Terpadu & Analisis Perkembangan</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
              <Download className="w-3.5 h-3.5" /> Export PDF
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <MoreVertical className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Main Info Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-8 items-center sm:items-start text-center sm:text-left">
              <div className="relative">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl overflow-hidden border-4 border-white shadow-xl ring-1 ring-slate-100">
                  {student.photo ? (
                    <img src={student.photo} alt={student.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                      <User className="w-16 h-16 text-slate-300" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-2 rounded-xl shadow-lg border-2 border-white">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
              
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2 justify-center sm:justify-start">
                    <span className="px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full text-[9px] font-black uppercase tracking-widest">
                      {student.className}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                      {student.gender}
                    </span>
                    {student.status && (
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        student.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {student.status}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-800 uppercase tracking-tight leading-tight mb-1">
                    {student.name}
                  </h2>
                  <div className="flex items-center gap-4 text-slate-500 text-xs font-bold justify-center sm:justify-start">
                    <span className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" /> {student.nis || '-'} / {student.nisn || '-'}</span>
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {student.birthPlace || '-'}, {student.birthDate || '-'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hobi</p>
                    <p className="text-xs font-bold text-slate-700">{student.hobby || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cita-cita</p>
                    <p className="text-xs font-bold text-slate-700">{student.ambition || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Alamat</p>
                    <p className="text-xs font-bold text-slate-700 truncate">{student.address || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6"
          >
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-500" /> Ringkasan Performa
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  <span className="text-[8px] font-black text-blue-400 uppercase">Konseling</span>
                </div>
                <p className="text-2xl font-black text-blue-700">{studentCounseling.length}</p>
                <p className="text-[8px] font-bold text-blue-500 mt-1 uppercase">Sesi Terdaftar</p>
              </div>
              
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                <div className="flex items-center justify-between mb-2">
                  <Award className="w-4 h-4 text-emerald-500" />
                  <span className="text-[8px] font-black text-emerald-400 uppercase">Prestasi</span>
                </div>
                <p className="text-2xl font-black text-emerald-700">{studentAchievements.length}</p>
                <p className="text-[8px] font-bold text-emerald-500 mt-1 uppercase">Total Dicapai</p>
              </div>
              
              <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
                <div className="flex items-center justify-between mb-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span className="text-[8px] font-black text-rose-400 uppercase">Pelanggaran</span>
                </div>
                <p className="text-2xl font-black text-rose-700">{studentViolations.length}</p>
                <p className="text-[8px] font-bold text-rose-500 mt-1 uppercase">Catatan Kasus</p>
              </div>
              
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="text-[8px] font-black text-amber-400 uppercase">Kehadiran</span>
                </div>
                <p className="text-2xl font-black text-amber-700">{attendanceRate}%</p>
                <p className="text-[8px] font-bold text-amber-500 mt-1 uppercase">Tingkat Kehadiran</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts and Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AKPD Analysis */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-500" /> Analisis Kebutuhan (AKPD)
              </h3>
              <button 
                onClick={() => setView(ViewMode.NEED_ASSESSMENT)}
                className="text-[9px] font-black text-sky-600 uppercase tracking-widest hover:underline"
              >
                Detail AKPD
              </button>
            </div>
            
            <div className="h-[300px] w-full">
              {akpdData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={akpdData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                    <Radar
                      name="Kebutuhan"
                      dataKey="A"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.4}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <Activity className="w-12 h-12 opacity-10" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Belum ada data AKPD</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* TDA / Learning Profile */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-500" /> Profil Belajar & Bakat (TDA)
              </h3>
              <button 
                onClick={() => setView(ViewMode.TDA_INPUT)}
                className="text-[9px] font-black text-sky-600 uppercase tracking-widest hover:underline"
              >
                Update TDA
              </button>
            </div>

            {studentTda ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Gaya Belajar</p>
                    <p className="text-sm font-black text-slate-700">{studentTda.learningStyle}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Tipe Kepribadian</p>
                    <p className="text-sm font-black text-slate-700">{studentTda.personalityType}</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Kecerdasan Majemuk</p>
                  <p className="text-sm font-black text-slate-700">{studentTda.multipleIntelligences}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Minat Karir</p>
                  <p className="text-sm font-black text-slate-700">{studentTda.careerKey}</p>
                </div>
              </div>
            ) : (
              <div className="h-[250px] flex flex-col items-center justify-center text-slate-400 space-y-2">
                <GraduationCap className="w-12 h-12 opacity-10" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Belum ada data TDA</p>
                <button 
                  onClick={() => setView(ViewMode.TDA_INPUT)}
                  className="mt-2 px-4 py-2 bg-sky-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-sky-600 transition-all"
                >
                  Input Data TDA
                </button>
              </div>
            )}
          </motion.div>
        </div>

        {/* Timeline and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6"
          >
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" /> Timeline Aktivitas Terkini
            </h3>

            <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:via-slate-200 before:to-transparent">
              {timelineItems.length > 0 ? (
                timelineItems.map((item, idx) => (
                  <div key={idx} className="relative flex items-start gap-6 group">
                    <div className={`absolute left-0 w-10 h-10 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 ${
                      item.color === 'blue' ? 'bg-blue-500' :
                      item.color === 'red' ? 'bg-rose-500' :
                      item.color === 'green' ? 'bg-emerald-500' :
                      item.color === 'purple' ? 'bg-purple-500' :
                      'bg-amber-500'
                    }`}>
                      <item.icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 pt-1 ml-12">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[8px] font-black uppercase tracking-widest ${
                          item.color === 'blue' ? 'text-blue-500' :
                          item.color === 'red' ? 'text-rose-500' :
                          item.color === 'green' ? 'text-emerald-500' :
                          item.color === 'purple' ? 'text-purple-500' :
                          'text-amber-500'
                        }`}>
                          {item.type}
                        </span>
                        <span className="text-[8px] font-bold text-slate-400">{item.date}</span>
                      </div>
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight group-hover:text-sky-600 transition-colors">
                        {item.title}
                      </h4>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Belum ada riwayat aktivitas</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Family & Environment */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6"
          >
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-500" /> Lingkungan & Keluarga
            </h3>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase">Ayah</p>
                    <p className="text-xs font-black text-slate-700">{student.fatherName || '-'}</p>
                    <p className="text-[9px] font-bold text-slate-500">{student.fatherJob || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase">Ibu</p>
                    <p className="text-xs font-black text-slate-700">{student.motherName || '-'}</p>
                    <p className="text-[9px] font-bold text-slate-500">{student.motherJob || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100">
                <div className="flex items-center gap-2 mb-2">
                  <Home className="w-4 h-4 text-sky-500" />
                  <p className="text-[9px] font-black text-sky-700 uppercase tracking-widest">Status Tinggal</p>
                </div>
                <p className="text-xs font-bold text-slate-700">Tinggal bersama: <span className="text-sky-700">{student.livingWith || '-'}</span></p>
              </div>

              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-purple-500" />
                  <p className="text-[9px] font-black text-purple-700 uppercase tracking-widest">Status Keluarga</p>
                </div>
                <p className="text-xs font-bold text-slate-700">{student.childStatus || '-'}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Bottom Action Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <div className="bg-slate-900/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-6">
          <button 
            onClick={() => setView(ViewMode.STUDENT_PERSONAL_BOOK)}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[8px] font-black uppercase tracking-widest">Buku Pribadi</span>
          </button>
          <div className="w-px h-8 bg-slate-700"></div>
          <button 
            onClick={() => setView(ViewMode.COUNSELING_DATA)}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[8px] font-black uppercase tracking-widest">Konseling</span>
          </button>
          <div className="w-px h-8 bg-slate-700"></div>
          <button 
            onClick={() => setView(ViewMode.ACHIEVEMENT_MANAGEMENT)}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            <Award className="w-5 h-5" />
            <span className="text-[8px] font-black uppercase tracking-widest">Prestasi</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper component for ShieldCheck icon which was missing in imports
const ShieldCheck = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
);

export default Student360Profile;
