import React, { useState, useMemo, useRef } from 'react';
import { X, Download, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { Student, AttendanceRecord } from '../types';
import * as htmlToImage from 'html-to-image';

interface AttendanceChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  attendanceRecords: AttendanceRecord[];
}

const monthNames: Record<string, string> = {
  '01': 'Januari', '02': 'Februari', '03': 'Maret', '04': 'April',
  '05': 'Mei', '06': 'Juni', '07': 'Juli', '08': 'Agustus',
  '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember'
};

const AttendanceChartModal: React.FC<AttendanceChartModalProps> = ({ isOpen, onClose, students, attendanceRecords }) => {
  const [semesterFilter, setSemesterFilter] = useState<'SEMUA' | 'Ganjil' | 'Genap'>('SEMUA');
  const [classFilter, setClassFilter] = useState<string>('SEMUA KELAS');
  const [studentFilter, setStudentFilter] = useState<string>('SEMUA SISWA');
  const chartRef = useRef<HTMLDivElement>(null);

  const classes = useMemo(() => {
    const allClassNames = students.map(s => s.className);
    return Array.from(new Set(allClassNames)).sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    if (classFilter === 'SEMUA KELAS') return students;
    return students.filter(s => s.className === classFilter);
  }, [students, classFilter]);

  // Reset student filter when class changes
  React.useEffect(() => {
    setStudentFilter('SEMUA SISWA');
  }, [classFilter]);

  const chartData = useMemo(() => {
    // Determine which months to show based on semester
    const baseMonths = semesterFilter === 'Ganjil' ? ['07', '08', '09', '10', '11', '12'] :
                       semesterFilter === 'Genap' ? ['01', '02', '03', '04', '05', '06'] :
                       ['07', '08', '09', '10', '11', '12', '01', '02', '03', '04', '05', '06'];

    const dataMap = baseMonths.reduce((acc, month) => {
      acc[month] = { name: monthNames[month], Sakit: 0, Ijin: 0, Alpa: 0, Dispensasi: 0 };
      return acc;
    }, {} as Record<string, { name: string; Sakit: number; Ijin: number; Alpa: number; Dispensasi: number }>);

    // Aggregate attendance
    attendanceRecords.forEach(record => {
      if (semesterFilter !== 'SEMUA' && record.semester !== semesterFilter) return;

      const student = students.find(s => s.id === record.studentId);
      if (!student) return;
      
      if (classFilter !== 'SEMUA KELAS' && student.className !== classFilter) return;
      if (studentFilter !== 'SEMUA SISWA' && student.id !== studentFilter) return;

      const recordMonth = record.date.split('-')[1];
      
      if (dataMap[recordMonth]) {
        if (record.status === 'Sakit') dataMap[recordMonth].Sakit++;
        else if (record.status === 'Ijin') dataMap[recordMonth].Ijin++;
        else if (record.status === 'Alpa') dataMap[recordMonth].Alpa++;
        else if (record.status === 'Dispensasi') dataMap[recordMonth].Dispensasi++;
      }
    });

    return baseMonths.map(m => dataMap[m]);
  }, [students, attendanceRecords, semesterFilter, classFilter, studentFilter]);

  const handleDownloadImage = async () => {
    if (chartRef.current) {
      try {
        const dataUrl = await htmlToImage.toPng(chartRef.current, { backgroundColor: '#ffffff' });
        const link = document.createElement('a');
        link.download = `Statistik_Absensi_${classFilter.replace(/ /g, '_')}_${semesterFilter}.png`;
        link.href = dataUrl;
        link.click();
      } catch (error) {
        console.error('Error downloading chart image:', error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Statistik Absensi</h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Dinamika Absensi per Bulan</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={classFilter} 
              onChange={e => setClassFilter(e.target.value)}
              className="input-cyber rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary outline-none focus:ring-1 focus:ring-primary/20 bg-white border border-slate-200 shadow-sm"
            >
              <option value="SEMUA KELAS">SEMUA KELAS</option>
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select 
              value={semesterFilter} 
              onChange={e => setSemesterFilter(e.target.value as any)}
              className="input-cyber rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary outline-none focus:ring-1 focus:ring-primary/20 bg-white border border-slate-200 shadow-sm"
            >
              <option value="SEMUA">SEMUA SEMESTER</option>
              <option value="Ganjil">GANJIL</option>
              <option value="Genap">GENAP</option>
            </select>
            <select 
              value={studentFilter} 
              onChange={e => setStudentFilter(e.target.value)}
              className="input-cyber rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary outline-none focus:ring-1 focus:ring-primary/20 bg-white border border-slate-200 shadow-sm max-w-[150px] truncate"
            >
              <option value="SEMUA SISWA">SEMUA SISWA</option>
              {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button 
              onClick={handleDownloadImage}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg"
            >
              <Download className="w-4 h-4" /> Download
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors bg-slate-100 text-slate-500">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/30">
          <div ref={chartRef} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="text-center mb-6">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Grafik Absensi Siswa</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Kelas: {classFilter} | Semester: {semesterFilter}
                {studentFilter !== 'SEMUA SISWA' && ` | Siswa: ${students.find(s => s.id === studentFilter)?.name}`}
              </p>
            </div>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} 
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', fontWeight: 'bold', fontSize: '12px' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '10px', fontWeight: 800, paddingTop: '20px' }}
                    iconType="circle"
                  />
                  <Bar dataKey="Sakit" name="Sakit (S)" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="Sakit" position="top" fontSize={9} fontWeight={900} fill="#3b82f6" formatter={(val: number) => val > 0 ? val : ''} />
                  </Bar>
                  <Bar dataKey="Ijin" name="Ijin (I)" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="Ijin" position="top" fontSize={9} fontWeight={900} fill="#f59e0b" formatter={(val: number) => val > 0 ? val : ''} />
                  </Bar>
                  <Bar dataKey="Alpa" name="Alpa (A)" fill="#f43f5e" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="Alpa" position="top" fontSize={9} fontWeight={900} fill="#f43f5e" formatter={(val: number) => val > 0 ? val : ''} />
                  </Bar>
                  <Bar dataKey="Dispensasi" name="Dispensasi (D)" fill="#10b981" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="Dispensasi" position="top" fontSize={9} fontWeight={900} fill="#10b981" formatter={(val: number) => val > 0 ? val : ''} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceChartModal;
