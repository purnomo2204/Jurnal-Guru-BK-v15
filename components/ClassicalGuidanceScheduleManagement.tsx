import React, { useState, useMemo } from 'react';
import { Plus, Search, Trash2, Edit, Calendar, Clock, BookOpen, FileText } from 'lucide-react';
import { ClassicalGuidanceSchedule, TeacherData } from '../types';

interface ClassicalGuidanceScheduleManagementProps {
  schedules: ClassicalGuidanceSchedule[];
  onAdd: (schedule: Omit<ClassicalGuidanceSchedule, 'id'>) => void;
  onUpdate: (schedule: ClassicalGuidanceSchedule) => void;
  onDelete: (id: string) => void;
  teacherData: TeacherData;
  initialEditingSchedule?: ClassicalGuidanceSchedule;
}

const DAYS = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU', 'MINGGU'];
const SEMESTERS = ['Ganjil', 'Genap', 'Semua Semester'];

const ClassicalGuidanceScheduleManagement: React.FC<ClassicalGuidanceScheduleManagementProps> = ({
  schedules,
  onAdd,
  onUpdate,
  onDelete,
  teacherData,
  initialEditingSchedule
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSemester, setFilterSemester] = useState<'Semua' | 'Ganjil' | 'Genap' | 'Semua Semester'>('Semua');

  const [formData, setFormData] = useState<Omit<ClassicalGuidanceSchedule, 'id'>>({
    academicYear: teacherData.academicYear || '',
    semester: 'Ganjil',
    day: 'SENIN',
    period: '1',
    className: '',
    topic: '',
    notes: ''
  });

  React.useEffect(() => {
    if (initialEditingSchedule) {
      handleEdit(initialEditingSchedule);
    }
  }, [initialEditingSchedule]);

  const filteredSchedules = useMemo(() => {
    return schedules.filter(s => {
      const matchesSearch = s.className.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (s.topic || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSemester = filterSemester === 'Semua' || s.semester === filterSemester;
      const matchesYear = s.academicYear === teacherData.academicYear;
      return matchesSearch && matchesSemester && matchesYear;
    }).sort((a, b) => {
      const dayDiff = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
      if (dayDiff !== 0) return dayDiff;
      return parseInt(a.period) - parseInt(b.period);
    });
  }, [schedules, searchTerm, filterSemester, teacherData.academicYear]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdate({ ...formData, id: editingId } as ClassicalGuidanceSchedule);
    } else {
      onAdd(formData);
    }
    setIsFormOpen(false);
    setEditingId(null);
    resetForm();
  };

  const handleEdit = (schedule: ClassicalGuidanceSchedule) => {
    setFormData({
      academicYear: schedule.academicYear,
      semester: schedule.semester,
      day: schedule.day,
      period: schedule.period,
      className: schedule.className,
      topic: schedule.topic,
      notes: schedule.notes
    });
    setEditingId(schedule.id);
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setFormData({
      academicYear: teacherData.academicYear || '',
      semester: 'Ganjil',
      day: 'SENIN',
      period: '1',
      className: '',
      topic: '',
      notes: '',
      date: ''
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            Jadwal Bimbingan Klasikal
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Kelola jadwal rutin layanan klasikal yang akan otomatis masuk ke Kalender Akademik.</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsFormOpen(true); }}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          <Plus className="w-5 h-5" /> Tambah Jadwal
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kelas atau topik..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-medium text-sm"
          />
        </div>
        <select
          value={filterSemester}
          onChange={(e) => setFilterSemester(e.target.value as any)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-bold text-sm text-slate-700 bg-slate-50"
        >
          <option value="Semua">Semua Semester</option>
          <option value="Ganjil">Ganjil</option>
          <option value="Genap">Genap</option>
          <option value="Semua Semester">Ganjil & Genap</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSchedules.map(schedule => (
          <div key={schedule.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-md mb-2">
                  {schedule.semester}
                </span>
                <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                  {schedule.className}
                </h3>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(schedule)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(schedule.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-2 mt-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="font-bold">{schedule.day}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Jam ke: <span className="font-bold">{schedule.period}</span></span>
              </div>
              {schedule.topic && (
                <div className="flex items-start gap-2 text-sm text-slate-600 mt-2 pt-2 border-t border-slate-100">
                  <BookOpen className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{schedule.topic}</span>
                </div>
              )}
              {schedule.notes && (
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <span className="line-clamp-2 italic text-xs">{schedule.notes}</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {filteredSchedules.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Belum ada jadwal bimbingan klasikal untuk filter ini.</p>
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-800 tracking-tight">
                {editingId ? 'Edit Jadwal Klasikal' : 'Tambah Jadwal Klasikal'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                <Trash2 className="w-5 h-5 hidden" /> {/* Placeholder for X icon if imported, using text for now */}
                <span className="font-bold text-xl leading-none">&times;</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Semester</label>
                  <select
                    required
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value as any })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-medium text-sm bg-slate-50"
                  >
                    {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Hari</label>
                  <select
                    required
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: e.target.value as any })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-medium text-sm bg-slate-50"
                  >
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Jam Ke</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 1-2"
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-medium text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Kelas</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: VII A"
                    value={formData.className}
                    onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-medium text-sm"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Tanggal</label>
                <input
                  type="date"
                  value={formData.date || ''}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-medium text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Topik / Materi (Opsional)</label>
                <input
                  type="text"
                  placeholder="Topik bimbingan..."
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-medium text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Catatan (Opsional)</label>
                <textarea
                  placeholder="Catatan tambahan..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-medium text-sm resize-none h-24"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassicalGuidanceScheduleManagement;
