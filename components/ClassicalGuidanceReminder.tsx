import React, { useMemo } from 'react';
import { Calendar, Clock, BookOpen, FileText, Edit, Trash2 } from 'lucide-react';
import { ClassicalGuidanceSchedule } from '../types';

interface Props {
  schedules: ClassicalGuidanceSchedule[];
  onEdit: (schedule: ClassicalGuidanceSchedule) => void;
  onDelete: (id: string) => void;
}

const ClassicalGuidanceReminder: React.FC<Props> = ({ schedules, onEdit, onDelete }) => {
  const upcomingSchedules = useMemo(() => {
    return schedules.slice(0, 3);
  }, [schedules]);

  if (upcomingSchedules.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-8">
      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-indigo-500" /> Jadwal Bimbingan Klasikal Mendatang
      </h3>
      <div className="space-y-3">
        {upcomingSchedules.map((schedule) => (
          <div key={schedule.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
            <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-800 text-sm">{schedule.topic || 'Tanpa Topik'}</p>
              <p className="text-xs text-slate-500">{schedule.className} • {schedule.day} • Jam ke: {schedule.period}</p>
              {schedule.date && <p className="text-xs font-bold text-indigo-600 mt-1">{new Date(schedule.date).toLocaleDateString('id-ID', {day:'2-digit', month:'long', year:'numeric'})}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => onEdit(schedule)} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={() => onDelete(schedule.id)} className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClassicalGuidanceReminder;
