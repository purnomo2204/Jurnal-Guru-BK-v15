
import React, { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, Legend, AreaChart, Area
} from 'recharts';
import { 
  ArrowLeft, ArrowRight, TrendingUp, Users, Calendar, AlertCircle, 
  CheckCircle2, Clock, Filter, Download, RefreshCw,
  Activity, PieChart as PieChartIcon, BarChart3, LineChart as LineChartIcon
} from 'lucide-react';
import { ViewMode, Student, CounselingLog, TeacherData } from '../types';

interface AnalyticsDashboardProps {
  students: Student[];
  logs: CounselingLog[];
  setView: (v: ViewMode) => void;
  teacherData: TeacherData;
  isCloudActive: boolean;
}

const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e'];

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  students, logs, setView, teacherData, isCloudActive 
}) => {
  
  // 1. Data for Line Chart: Counseling Logs over time (last 6 months)
  const timeSeriesData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const now = new Date();
    const last6Months = [];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = months[d.getMonth()];
      const yearLabel = d.getFullYear();
      
      const count = logs.filter(l => {
        const logDate = new Date(l.date);
        return logDate.getMonth() === d.getMonth() && logDate.getFullYear() === d.getFullYear();
      }).length;
      
      last6Months.push({
        name: `${monthLabel} ${yearLabel}`,
        count: count
      });
    }
    return last6Months;
  }, [logs]);

  // 2. Data for Pie Chart: Counseling Types
  const typeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach(l => {
      counts[l.type] = (counts[l.type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [logs]);

  // 3. Data for Bar Chart: Counseling Aspects
  const aspectDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach(l => {
      counts[l.aspect] = (counts[l.aspect] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [logs]);

  // 4. Student Status Summary
  const statusSummary = useMemo(() => {
    const counts = {
      baik: 0,
      'perlu perhatian': 0,
      'butuh bantuan': 0
    };
    logs.forEach(l => {
      if (l.status) counts[l.status]++;
    });
    return counts;
  }, [logs]);

  const handleExportReport = () => {
    const reportData = {
      summary: {
        totalStudents: students.length,
        totalLogs: logs.length,
        priorityCases: statusSummary['butuh bantuan'],
        resolvedCases: statusSummary['baik']
      },
      typeDistribution,
      aspectDistribution,
      timeSeriesData,
      exportDate: new Date().toLocaleString('id-ID')
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Analytics_Report_BK_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div className="space-y-3 animate-fade-in text-left pb-12 max-w-5xl mx-auto px-3">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setView(ViewMode.HOME)} 
            className="p-1.5 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 transition-all group shadow-md"
          >
            <ArrowLeft className="w-5 h-5 text-primary group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <p className="label-luxe text-slate-800 font-black text-[7px]">ANALYTICS ENGINE v2.0</p>
            <h2 className="text-lg font-black text-slate-800 tracking-tighter uppercase leading-none">
              Dasbor <span className="text-primary font-light italic lowercase">Analitik</span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className={`px-2 py-1 rounded-lg border flex items-center gap-1.5 ${isCloudActive ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
            {isCloudActive ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            <span className="text-[8px] font-black uppercase tracking-widest">
              {isCloudActive ? 'Cloud Connected' : 'Local Mode'}
            </span>
          </div>
          <button className="p-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-all">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="glass-card p-2 rounded-lg border border-primary/10 bg-white/80 flex items-center gap-2">
          <div className="p-1 bg-primary rounded-lg text-white shadow-sm"><Users className="w-3 h-3" /></div>
          <div>
            <p className="text-[6px] font-black text-primary uppercase tracking-widest">Total Siswa</p>
            <h3 className="text-sm font-black text-slate-900">{students.length}</h3>
          </div>
        </div>

        <div className="glass-card p-2 rounded-lg border border-primary/10 bg-white/80 flex items-center gap-2">
          <div className="p-1 bg-primary rounded-lg text-white shadow-sm"><Calendar className="w-3 h-3" /></div>
          <div>
            <p className="text-[6px] font-black text-primary uppercase tracking-widest">Total Layanan</p>
            <h3 className="text-sm font-black text-slate-900">{logs.length}</h3>
          </div>
        </div>

        <div className="glass-card p-2 rounded-lg border border-rose-100 bg-white/80 flex items-center gap-2">
          <div className="p-1 bg-rose-600 rounded-lg text-white shadow-sm"><AlertCircle className="w-3 h-3" /></div>
          <div>
            <p className="text-[6px] font-black text-rose-600 uppercase tracking-widest">Butuh Bantuan</p>
            <h3 className="text-sm font-black text-slate-900">{statusSummary['butuh bantuan']}</h3>
          </div>
        </div>

        <div className="glass-card p-2 rounded-lg border border-emerald-100 bg-white/80 flex items-center gap-2">
          <div className="p-1 bg-emerald-600 rounded-lg text-white shadow-sm"><CheckCircle2 className="w-3 h-3" /></div>
          <div>
            <p className="text-[6px] font-black text-emerald-600 uppercase tracking-widest">Kondisi Baik</p>
            <h3 className="text-sm font-black text-slate-900">{statusSummary['baik']}</h3>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Line Chart: Activity Over Time */}
        <div className="lg:col-span-2 glass-card p-3 rounded-lg border border-slate-100 bg-white/80 space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <LineChartIcon className="w-3.5 h-3.5 text-primary" />
              <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-tight">Tren Layanan BK (6 Bulan Terakhir)</h4>
            </div>
            <div className="flex gap-1">
              <button className="p-1 bg-slate-50 rounded-md text-slate-500 hover:text-slate-600 transition-all"><Download className="w-3 h-3" /></button>
            </div>
          </div>
          <div className="h-[110px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={8} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={5}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={8} 
                  tickLine={false} 
                  axisLine={false} 
                  dx={-5}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '10px', color: '#0f172a' }}
                  itemStyle={{ color: 'var(--primary-color)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="var(--primary-color)" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Distribution */}
        <div className="glass-card p-3 rounded-lg border border-slate-100 bg-white/80 space-y-3">
          <div className="flex items-center gap-2">
            <PieChartIcon className="w-3.5 h-3.5 text-primary" />
            <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-tight">Jenis Layanan</h4>
          </div>
          <div className="h-[110px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {typeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '8px', color: '#0f172a' }}
                />
                <Legend 
                  layout="vertical" 
                  verticalAlign="bottom" 
                  align="center"
                  wrapperStyle={{ fontSize: '8px', paddingTop: '10px', color: '#64748b' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Bar Chart: Aspects */}
        <div className="glass-card p-3 rounded-lg border border-slate-100 bg-white/80 space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
            <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-tight">Aspek Bimbingan</h4>
          </div>
          <div className="h-[110px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aspectDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={8} hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#94a3b8" 
                  fontSize={8} 
                  width={80}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '10px', color: '#0f172a' }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {aspectDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Table or List */}
        <div className="glass-card p-2 rounded-lg border border-slate-100 bg-white/80 space-y-2">
          <div className="flex items-center gap-2">
            <Filter className="w-3 h-3 text-amber-500" />
            <h4 className="text-[9px] font-bold text-slate-900 uppercase tracking-tight">Ringkasan Prioritas</h4>
          </div>
          <div className="space-y-1 max-h-[120px] overflow-y-auto pr-1 scroll-hide">
            {logs.filter(l => l.status === 'butuh bantuan').slice(0, 5).map((log, i) => (
              <div key={i} className="p-1 bg-slate-50 rounded-lg border border-rose-100 flex items-center justify-between group hover:bg-rose-50 transition-all">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-[10px]">
                    {log.studentName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-900 uppercase tracking-tight">{log.studentName}</p>
                    <p className="text-[7px] text-slate-500 font-medium">{log.type} • {log.date}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setView(ViewMode.COUNSELING_DATA)}
                  className="p-0.5 bg-white border border-slate-200 rounded-md text-slate-500 group-hover:text-rose-600 transition-all"
                >
                  <ArrowRight className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
            {logs.filter(l => l.status === 'butuh bantuan').length === 0 && (
              <div className="flex flex-col items-center justify-center py-4 text-slate-500 space-y-1">
                <CheckCircle2 className="w-6 h-6 opacity-20" />
                <p className="text-[9px] font-medium italic">Tidak ada siswa dalam prioritas bantuan.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 glass-card rounded-lg border border-primary/10 bg-primary/5 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-primary rounded-lg shadow-md">
            <TrendingUp className="w-5 h-5 text-slate-800" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-black text-slate-900 mb-0.5 uppercase tracking-tighter">Insight Analitik</h3>
            <p className="text-[10px] text-primary font-medium">Data divisualisasikan dari riwayat layanan yang tersinkronisasi.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportReport}
            className="px-3 py-1.5 bg-primary text-white rounded-lg font-black text-[8px] uppercase tracking-widest hover:opacity-90 transition-all shadow-md active:scale-95"
          >
            Export Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
