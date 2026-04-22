
import React, { useMemo, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  FileBarChart, Download, Printer, TrendingUp, AlertTriangle, 
  CheckCircle2, Info, ArrowLeft, Calendar, Users, Target
} from 'lucide-react';
import { ViewMode, Student, CounselingLog, TeacherData, Violation, ProblemReport } from '../types';
import { useReactToPrint } from 'react-to-print';

interface AnnualReportDashboardProps {
  students: Student[];
  logs: CounselingLog[];
  violations: Violation[];
  problemReports: ProblemReport[];
  setView: (v: ViewMode) => void;
  teacherData: TeacherData;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

const AnnualReportDashboard: React.FC<AnnualReportDashboardProps> = ({ 
  students, logs, violations, problemReports, setView, teacherData 
}) => {
  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `Laporan_Statistik_Tahunan_BK_${teacherData.academicYear.replace('/', '_')}`,
  });

  // 1. Problem Distribution Data (Aspects + Top Violations)
  const problemDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      'Pribadi': 0,
      'Sosial': 0,
      'Belajar': 0,
      'Karier': 0
    };

    logs.forEach(l => {
      if (counts[l.aspect] !== undefined) counts[l.aspect]++;
    });

    problemReports.forEach(p => {
      if (counts[p.problemType] !== undefined) counts[p.problemType]++;
    });

    // Add specific violations to the mix if they are significant
    const violationCounts: Record<string, number> = {};
    violations.forEach(v => {
      violationCounts[v.violation] = (violationCounts[v.violation] || 0) + 1;
    });

    const aspectData = Object.entries(counts).map(([name, value]) => ({ name, value }));
    const violationData = Object.entries(violationCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3); // Top 3 specific violations

    return [...aspectData, ...violationData].sort((a, b) => b.value - a.value);
  }, [logs, problemReports, violations]);

  // 2. Monthly Trend Data
  const monthlyTrend = useMemo(() => {
    const months = ['Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'];
    const data = months.map(m => ({ name: m, total: 0 }));

    const processDate = (dateStr: string) => {
      const date = new Date(dateStr);
      const monthIdx = date.getMonth();
      // Map JS month (0-11) to our academic year months (Jul=0, ..., Jun=11)
      const academicIdx = (monthIdx + 6) % 12;
      data[academicIdx].total++;
    };

    logs.forEach(l => processDate(l.date));
    violations.forEach(v => processDate(v.date));
    problemReports.forEach(p => processDate(p.date));

    return data;
  }, [logs, violations, problemReports]);

  // 3. Top Problem Analysis
  const topProblem = problemDistribution[0];
  const totalProblems = problemDistribution.reduce((acc, curr) => acc + curr.value, 0);
  const topPercentage = totalProblems > 0 ? Math.round((topProblem.value / totalProblems) * 100) : 0;

  // 4. Violation Summary
  const violationSummary = useMemo(() => {
    const counts = { ringan: 0, sedang: 0, berat: 0 };
    violations.forEach(v => {
      if (v.level === 'ringan') counts.ringan++;
      if (v.level === 'sedang') counts.sedang++;
      if (v.level === 'berat') counts.berat++;
    });
    return counts;
  }, [violations]);

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto px-4">
      {/* Action Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setView(ViewMode.HOME)}
            className="p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Statistik Tahunan</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Evaluasi & Pelaporan Program BK</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handlePrint()}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
          >
            <Printer className="w-4 h-4" /> Cetak Laporan
          </button>
        </div>
      </div>

      {/* Report Content (Printable) */}
      <div ref={reportRef} className="space-y-8 bg-white p-10 rounded-3xl border border-slate-200 shadow-xl print:shadow-none print:border-none print:p-0">
        {/* Report Header */}
        <div className="text-center border-b-2 border-slate-900 pb-6 mb-8">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-1">LAPORAN EVALUASI & STATISTIK TAHUNAN</h1>
          <h2 className="text-xl font-bold text-slate-700 uppercase tracking-tight mb-1">BIMBINGAN DAN KONSELING</h2>
          <h3 className="text-lg font-black text-indigo-600 uppercase tracking-widest">{teacherData.school}</h3>
          <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">TAHUN PELAJARAN {teacherData.academicYear}</p>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Total Siswa</span>
            </div>
            <h4 className="text-2xl font-black text-slate-900">{students.length}</h4>
            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Siswa Terdaftar</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Total Layanan</span>
            </div>
            <h4 className="text-2xl font-black text-slate-900">{logs.length}</h4>
            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Sesi Konseling</p>
          </div>
          <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Pelanggaran</span>
            </div>
            <h4 className="text-2xl font-black text-slate-900">{violations.length}</h4>
            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Kasus Kedisiplinan</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-amber-600" />
              <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Masalah Utama</span>
            </div>
            <h4 className="text-lg font-black text-slate-900 uppercase truncate">{topProblem?.name || '-'}</h4>
            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{topPercentage}% Dari Total Kasus</p>
          </div>
        </div>

        {/* Visualizations Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Problem Distribution */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-l-4 border-indigo-600 pl-3">
              <h5 className="text-sm font-black text-slate-800 uppercase tracking-tight">Distribusi Bidang Masalah</h5>
            </div>
            <div className="h-[300px] w-full bg-slate-50 rounded-3xl p-6 border border-slate-100">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={problemDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {problemDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Trend */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-l-4 border-indigo-600 pl-3">
              <h5 className="text-sm font-black text-slate-800 uppercase tracking-tight">Tren Kasus Bulanan</h5>
            </div>
            <div className="h-[300px] w-full bg-slate-50 rounded-3xl p-6 border border-slate-100">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Detailed Analysis Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Violation Breakdown */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center gap-2 border-l-4 border-indigo-600 pl-3">
              <h5 className="text-sm font-black text-slate-800 uppercase tracking-tight">Analisis Kedisiplinan</h5>
            </div>
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pelanggaran Ringan</span>
                <span className="text-sm font-black text-slate-900">{violationSummary.ringan}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pelanggaran Sedang</span>
                <span className="text-sm font-black text-amber-600">{violationSummary.sedang}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pelanggaran Berat</span>
                <span className="text-sm font-black text-rose-600">{violationSummary.berat}</span>
              </div>
            </div>
          </div>

          {/* Recommendations / Policy Advice */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 border-l-4 border-indigo-600 pl-3">
              <h5 className="text-sm font-black text-slate-800 uppercase tracking-tight">Rekomendasi Kebijakan & Program</h5>
            </div>
            <div className="p-6 bg-indigo-600 text-white rounded-3xl shadow-xl shadow-indigo-600/20 space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                <h6 className="text-xs font-black uppercase tracking-widest">Analisis Strategis</h6>
              </div>
              <p className="text-sm font-medium leading-relaxed italic">
                "Berdasarkan data tahun ini, masalah bidang <span className="font-black underline">{topProblem?.name || '-'}</span> mendominasi sebesar <span className="font-black underline">{topPercentage}%</span>. Disarankan untuk meningkatkan program preventif melalui bimbingan klasikal dan kampanye kesadaran di bidang tersebut pada semester mendatang."
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-white/10 rounded-xl border border-white/20">
                  <p className="text-[9px] font-black uppercase tracking-widest mb-1">Fokus Utama</p>
                  <p className="text-[11px] font-bold">Penguatan Layanan {topProblem?.name || '-'}</p>
                </div>
                <div className="p-3 bg-white/10 rounded-xl border border-white/20">
                  <p className="text-[9px] font-black uppercase tracking-widest mb-1">Tindakan Lanjut</p>
                  <p className="text-[11px] font-bold">Workshop & Konseling Kelompok</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Report Footer / Signatures */}
        <div className="mt-16 grid grid-cols-2 gap-24 text-[12px] pt-10 border-t border-slate-100">
          <div className="text-center space-y-20">
            <p>Mengetahui,<br/>Kepala Sekolah</p>
            <div className="space-y-1">
              <p className="font-bold underline">{teacherData.principalName || '................................................'}</p>
              <p>NIP. {teacherData.principalNip || '................................................'}</p>
            </div>
          </div>
          <div className="text-center space-y-20">
            <p>{teacherData.city || 'Magelang'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>Guru BK</p>
            <div className="space-y-1">
              <p className="font-bold underline">{teacherData.name || '................................................'}</p>
              <p>NIP. {teacherData.nip || '................................................'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnualReportDashboard;
