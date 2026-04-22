import React, { useState, useMemo } from 'react';
import { ViewMode, Student, CounselingSchedule, TeacherData } from '../types';
import { ArrowLeft, Plus, Edit, Trash2, Calendar, Clock, Search, User, Mail } from 'lucide-react';
import CounselingInvitationModal from './CounselingInvitationModal';

interface CounselingScheduleProps {
  setView: (view: ViewMode) => void;
  students: Student[];
  schedules: CounselingSchedule[];
  onAddSchedule: (schedule: CounselingSchedule) => void;
  onUpdateSchedule: (schedule: CounselingSchedule) => void;
  onDeleteSchedule: (id: string) => void;
  teacherData: TeacherData;
}

const CounselingScheduleComponent: React.FC<CounselingScheduleProps> = ({
  setView,
  students,
  schedules,
  onAddSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
  teacherData
}) => {
  const [newSchedule, setNewSchedule] = useState<Omit<CounselingSchedule, 'id' | 'studentName' | 'className'>>({
    studentId: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    topic: '',
    notes: ''
  });
  const [editingSchedule, setEditingSchedule] = useState<CounselingSchedule | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<CounselingSchedule | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  const classes = useMemo(() => {
    const allClassNames = students.map(s => s.className);
    return Array.from(new Set(allClassNames)).sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    if (!selectedClass) return [];
    return students.filter(s => s.className === selectedClass);
  }, [students, selectedClass]);

  const handleAddOrUpdate = () => {
    const student = students.find(s => s.id === (editingSchedule ? editingSchedule.studentId : newSchedule.studentId));
    if (!student) {
      alert('Silakan pilih siswa.');
      return;
    }

    if (editingSchedule) {
      onUpdateSchedule({
        ...editingSchedule,
        studentName: student.name,
        className: student.className
      });
      setEditingSchedule(null);
    } else {
      if (!newSchedule.date || !newSchedule.time || !newSchedule.topic) {
        alert('Silakan lengkapi semua field.');
        return;
      }
      onAddSchedule({
        ...newSchedule,
        id: Date.now().toString(),
        studentName: student.name,
        className: student.className
      });
      setNewSchedule({
        studentId: '',
        date: new Date().toISOString().split('T')[0],
        time: '',
        topic: '',
        notes: ''
      });
      setSelectedClass('');
    }
  };

  const filteredSchedules = useMemo(() => {
    return schedules.filter(s => 
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.topic.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return b.time.localeCompare(a.time);
    });
  }, [schedules, searchTerm]);

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 animate-fade-in text-left">
      <div className="flex items-center gap-5 px-4">
        <button onClick={() => setView(ViewMode.HOME)} className="p-3 bg-white rounded-2xl border border-slate-200 hover:bg-slate-100 transition-all group shadow-lg">
          <ArrowLeft className="w-6 h-6 text-primary group-hover:-translate-x-1 transition-transform" />
        </button>
        <div>
          <p className="label-luxe text-primary font-black text-[9px]">ADMINISTRASI BK</p>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none">Jadwal <span className="text-primary font-light italic lowercase">Konseling</span></h2>
        </div>
      </div>

      {/* Form Section */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200 mx-4 bg-white/90 shadow-2xl">
        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-6 flex items-center gap-3">
          <div className="p-1.5 bg-primary/20 rounded-lg"><Plus className="w-4 h-4 text-primary" /></div>
          {editingSchedule ? 'Edit' : 'Buat'} Jadwal Baru
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="label-luxe ml-1 text-[8px]">Kelas</label>
            <select 
              value={selectedClass} 
              onChange={e => setSelectedClass(e.target.value)}
              className="w-full p-2.5 text-[10px] input-cyber rounded-xl focus:border-primary focus:ring-primary outline-none"
            >
              <option value="">-- Pilih Kelas --</option>
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="label-luxe ml-1 text-[8px]">Siswa</label>
            <select 
              value={editingSchedule ? editingSchedule.studentId : newSchedule.studentId} 
              onChange={e => editingSchedule ? setEditingSchedule({...editingSchedule, studentId: e.target.value}) : setNewSchedule({ ...newSchedule, studentId: e.target.value })}
              className="w-full p-2.5 text-[10px] input-cyber rounded-xl focus:border-primary focus:ring-primary outline-none"
              disabled={!selectedClass && !editingSchedule}
            >
              <option value="">-- Pilih Siswa --</option>
              {(editingSchedule ? students : filteredStudents).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="label-luxe ml-1 text-[8px]">Tanggal</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-primary" />
              <input 
                type="date" 
                value={editingSchedule ? editingSchedule.date : newSchedule.date} 
                onChange={e => editingSchedule ? setEditingSchedule({...editingSchedule, date: e.target.value}) : setNewSchedule({ ...newSchedule, date: e.target.value })}
                className="w-full p-2.5 pl-9 text-[10px] input-cyber rounded-xl focus:border-primary focus:ring-primary outline-none"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="label-luxe ml-1 text-[8px]">Waktu</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-primary" />
              <input 
                type="time" 
                value={editingSchedule ? editingSchedule.time : newSchedule.time} 
                onChange={e => editingSchedule ? setEditingSchedule({...editingSchedule, time: e.target.value}) : setNewSchedule({ ...newSchedule, time: e.target.value })}
                className="w-full p-2.5 pl-9 text-[10px] input-cyber rounded-xl focus:border-primary focus:ring-primary outline-none"
              />
            </div>
          </div>
          <div className="space-y-1.5 lg:col-span-2">
            <label className="label-luxe ml-1 text-[8px]">Topik Konseling</label>
            <input 
              type="text" 
              placeholder="Contoh: Masalah belajar, Konsultasi karier..."
              value={editingSchedule ? editingSchedule.topic : newSchedule.topic} 
              onChange={e => editingSchedule ? setEditingSchedule({...editingSchedule, topic: e.target.value}) : setNewSchedule({ ...newSchedule, topic: e.target.value })}
              className="w-full p-2.5 text-[10px] input-cyber rounded-xl focus:border-primary focus:ring-primary outline-none"
            />
          </div>
          <div className="space-y-1.5 lg:col-span-3">
            <label className="label-luxe ml-1 text-[8px]">Catatan Tambahan (Opsional)</label>
            <textarea 
              rows={2}
              placeholder="Detail tambahan jika diperlukan..."
              value={editingSchedule ? editingSchedule.notes : newSchedule.notes} 
              onChange={e => editingSchedule ? setEditingSchedule({...editingSchedule, notes: e.target.value}) : setNewSchedule({ ...newSchedule, notes: e.target.value })}
              className="w-full p-2.5 text-[10px] input-cyber rounded-xl focus:border-primary focus:ring-primary outline-none"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          {editingSchedule && (
            <button onClick={() => setEditingSchedule(null)} className="px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest border border-slate-200 text-slate-500 hover:bg-slate-100 transition-all">
              Batal
            </button>
          )}
          <button onClick={handleAddOrUpdate} className="bg-primary hover:opacity-90 text-white px-8 py-3 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all shadow-2xl flex items-center justify-center gap-2 active:scale-95">
            <Plus className="w-4 h-4" /> {editingSchedule ? 'Update Jadwal' : 'Simpan Jadwal'}
          </button>
        </div>
      </div>

      {/* List Section */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200 mx-4 bg-white/90 shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Daftar Jadwal</h3>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary" />
            <input 
              type="text" 
              placeholder="Cari nama atau topik..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full input-cyber rounded-full py-2 pl-10 pr-5 text-[10px] text-slate-800 outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="p-2.5 text-[8px] font-black uppercase text-slate-500 tracking-widest">Siswa</th>
                <th className="p-2.5 text-[8px] font-black uppercase text-slate-500 tracking-widest">Waktu</th>
                <th className="p-2.5 text-[8px] font-black uppercase text-slate-500 tracking-widest">Topik</th>
                <th className="p-2.5 text-[8px] font-black uppercase text-slate-500 tracking-widest">Catatan</th>
                <th className="p-2.5 text-[8px] font-black uppercase text-slate-500 tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredSchedules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-500 italic text-[10px]">Belum ada jadwal konseling.</td>
                </tr>
              ) : (
                filteredSchedules.map(schedule => (
                  <tr key={schedule.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-2.5">
                      <p className="text-[10px] font-bold text-slate-800">{schedule.studentName}</p>
                      <p className="text-[7px] font-black text-primary uppercase">{schedule.className}</p>
                    </td>
                    <td className="p-2.5">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-slate-600">{new Date(schedule.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span className="text-[8px] text-slate-500">{schedule.time} WIB</span>
                      </div>
                    </td>
                    <td className="p-2.5 text-[9px] font-bold text-slate-700">
                      {schedule.topic}
                    </td>
                    <td className="p-2.5 text-[8px] text-slate-500 italic max-w-[150px] truncate">
                      {schedule.notes || '-'}
                    </td>
                    <td className="p-2.5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => {
                          setEditingSchedule(schedule);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }} className="p-1 bg-slate-100 border border-slate-300 hover:bg-primary/10 rounded-lg text-primary transition-all shadow-sm">
                          <Edit className="w-2.5 h-2.5" />
                        </button>
                        <button onClick={() => setSelectedSchedule(schedule)} className="p-1 bg-slate-100 border border-slate-300 hover:bg-primary/10 rounded-lg text-green-600 transition-all shadow-sm">
                          <Mail className="w-2.5 h-2.5" />
                        </button>
                        <button onClick={() => {
                          if(confirm('Hapus jadwal ini?')) onDeleteSchedule(schedule.id);
                        }} className="p-1 bg-slate-100 border border-slate-300 hover:bg-rose-900/20 rounded-lg text-rose-500 transition-all shadow-sm">
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {selectedSchedule && (
        <CounselingInvitationModal 
          schedule={selectedSchedule}
          teacherData={teacherData}
          onClose={() => setSelectedSchedule(null)}
        />
      )}
    </div>
  );
};

export default CounselingScheduleComponent;
