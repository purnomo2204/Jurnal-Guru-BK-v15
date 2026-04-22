import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  X,
  Edit,
  Info,
  Bell,
  RefreshCw,
  CheckCircle2,
  LayoutGrid,
  Columns,
  Calendar as DayIcon,
  List
} from 'lucide-react';
import { AcademicEvent } from '../types';

interface AcademicCalendarProps {
  events: AcademicEvent[];
  onAddEvent: (event: Omit<AcademicEvent, 'id'>) => void;
  onBulkAddEvents?: (events: Omit<AcademicEvent, 'id'>[]) => void;
  onDeleteEvent: (id: string) => void;
  onUpdateEvent: (event: AcademicEvent) => void;
  viewMode?: 'month' | 'week' | 'day' | 'agenda';
  onViewModeChange?: (mode: 'month' | 'week' | 'day' | 'agenda') => void;
}

const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const INDONESIAN_DAYS = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU', 'MINGGU'];

const KEMENDIKBUD_STANDARD_EVENTS = [
  { date: '2025-07-14', title: 'Hari Pertama Sekolah', type: 'pembelajaran', description: 'Awal Tahun Pelajaran 2025/2026' },
  { date: '2025-08-17', title: 'Hari Kemerdekaan RI', type: 'libur', description: 'HUT Proklamasi Kemerdekaan RI' },
  { date: '2025-10-28', title: 'Hari Sumpah Pemuda', type: 'lainnya', description: 'Peringatan Hari Sumpah Pemuda' },
  { date: '2025-11-10', title: 'Hari Pahlawan', type: 'lainnya', description: 'Peringatan Hari Pahlawan' },
  { date: '2025-11-25', title: 'Hari Guru Nasional', type: 'lainnya', description: 'Peringatan Hari Guru Nasional / HUT PGRI' },
  { date: '2025-12-20', title: 'Pembagian Raport Smt 1', type: 'pembelajaran', description: 'Penyerahan Buku Laporan Hasil Belajar Semester 1' },
  { date: '2025-12-22', title: 'Libur Semester 1', type: 'libur_sekolah', description: 'Awal Libur Akhir Semester 1' },
  { date: '2025-12-25', title: 'Hari Raya Natal', type: 'libur', description: 'Libur Nasional Hari Raya Natal' },
  { date: '2026-01-01', title: 'Tahun Baru Masehi', type: 'libur', description: 'Libur Nasional Tahun Baru 2026' },
  { date: '2026-01-05', title: 'Hari Pertama Smt 2', type: 'pembelajaran', description: 'Awal Kegiatan Belajar Mengajar Semester 2' },
  { date: '2026-03-20', title: 'Hari Raya Nyepi', type: 'libur', description: 'Libur Nasional Tahun Baru Saka' },
  { date: '2026-03-31', title: 'Hari Raya Idul Fitri', type: 'libur', description: 'Estimasi Libur Hari Raya Idul Fitri 1447 H' },
  { date: '2026-04-01', title: 'Hari Raya Idul Fitri', type: 'libur', description: 'Estimasi Libur Hari Raya Idul Fitri 1447 H' },
  { date: '2026-05-01', title: 'Hari Buruh Internasional', type: 'libur', description: 'Libur Nasional Hari Buruh' },
  { date: '2026-05-02', title: 'Hari Pendidikan Nasional', type: 'lainnya', description: 'Peringatan Hardiknas' },
  { date: '2026-05-20', title: 'Hari Kebangkitan Nasional', type: 'lainnya', description: 'Peringatan Harkitnas' },
  { date: '2026-06-01', title: 'Hari Lahir Pancasila', type: 'libur', description: 'Libur Nasional Hari Lahir Pancasila' },
  { date: '2026-06-19', title: 'Pembagian Raport Smt 2', type: 'pembelajaran', description: 'Penyerahan Buku Laporan Hasil Belajar Semester 2' },
  { date: '2026-06-22', title: 'Libur Akhir Tahun', type: 'libur_sekolah', description: 'Awal Libur Akhir Tahun Pelajaran' },
];

const AcademicCalendar: React.FC<AcademicCalendarProps> = ({ 
  events, 
  onAddEvent, 
  onBulkAddEvents,
  onDeleteEvent, 
  onUpdateEvent,
  viewMode: propViewMode,
  onViewModeChange
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [localViewMode, setLocalViewMode] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
  
  const viewMode = propViewMode || localViewMode;
  const setViewMode = (mode: 'month' | 'week' | 'day' | 'agenda') => {
    if (onViewModeChange) {
      onViewModeChange(mode);
    } else {
      setLocalViewMode(mode);
    }
  };

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<AcademicEvent | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  
  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<'pembelajaran' | 'libur' | 'lainnya' | 'mgbk' | 'ujian' | 'libur_sekolah' | 'dinas_dalam' | 'dinas_luar' | 'pelatihan' | 'daring'>('pembelajaran');
  const [formDesc, setFormDesc] = useState('');
  const [formEndDate, setFormEndDate] = useState<string>('');
  const [formReminder, setFormReminder] = useState(false);

  const getLocalISODate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  // Adjust firstDayOfMonth for Indonesian standard (Monday start)
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthEvents = useMemo(() => {
    return events.filter(event => {
      const [startYearStr, startMonthStr] = event.date.split('-');
      const startYear = parseInt(startYearStr, 10);
      const startMonth = parseInt(startMonthStr, 10) - 1;
      
      if (event.endDate) {
        const [endYearStr, endMonthStr] = event.endDate.split('-');
        const endYear = parseInt(endYearStr, 10);
        const endMonth = parseInt(endMonthStr, 10) - 1;
        
        // Check if current month/year is between start and end
        const current = currentYear * 12 + currentMonth;
        const start = startYear * 12 + startMonth;
        const end = endYear * 12 + endMonth;
        
        return current >= start && current <= end;
      }
      
      return startMonth === currentMonth && startYear === currentYear;
    });
  }, [events, currentMonth, currentYear]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentDate(new Date(parseInt(e.target.value), currentMonth, 1));
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentDate(new Date(currentYear, parseInt(e.target.value), 1));
  };

  const handleSyncKemendikbud = async () => {
    setIsSyncing(true);
    // Simulate API call to Kemendikbud
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Filter out events that already exist to avoid duplicates
    const existingDates = new Set(events.map(e => e.date + e.title));
    
    const newEventsToAdd: Omit<AcademicEvent, 'id'>[] = [];
    KEMENDIKBUD_STANDARD_EVENTS.forEach(event => {
      if (!existingDates.has(event.date + event.title)) {
        newEventsToAdd.push(event as Omit<AcademicEvent, 'id'>);
      }
    });

    if (newEventsToAdd.length > 0) {
      if (onBulkAddEvents) {
        onBulkAddEvents(newEventsToAdd);
      } else {
        newEventsToAdd.forEach(e => onAddEvent(e));
      }
    }

    setIsSyncing(false);
    setSyncSuccess(true);
    setTimeout(() => setSyncSuccess(false), 3000);
  };

  const openAddModal = (dateStr: string) => {
    setSelectedDate(dateStr);
    setFormEndDate('');
    setEditingEvent(null);
    setFormTitle('');
    setFormType('pembelajaran');
    setFormDesc('');
    setFormReminder(false);
    setIsEditModalOpen(true);
  };

  const openEditModal = (event: AcademicEvent) => {
    setEditingEvent(event);
    setSelectedDate(event.date);
    setFormEndDate(event.endDate || '');
    setFormTitle(event.title);
    setFormType(event.type);
    setFormDesc(event.description || '');
    setFormReminder(event.reminder || false);
    setIsEditModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !formTitle) return;

    const eventData = {
      title: formTitle,
      type: formType,
      description: formDesc,
      date: selectedDate,
      endDate: formEndDate || undefined,
      reminder: formReminder
    };

    if (editingEvent) {
      onUpdateEvent({
        ...editingEvent,
        ...eventData
      });
    } else {
      onAddEvent(eventData);
    }
    setIsEditModalOpen(false);
  };

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    const arr = [];
    for (let i = current - 2; i <= current + 5; i++) {
      arr.push(i);
    }
    return arr;
  }, []);

  const renderCalendarDays = () => {
    const days = [];
    
    // Empty slots for previous month
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 sm:h-14 border border-slate-200/50 bg-slate-100/30"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = monthEvents.filter(e => {
        if (e.endDate) {
          return dateStr >= e.date && dateStr <= e.endDate;
        }
        return e.date === dateStr;
      });
      const isToday = getLocalISODate(new Date()) === dateStr;

      days.push(
        <div 
          key={day} 
          className={`h-10 sm:h-14 border border-slate-200/50 p-0.5 sm:p-1 relative group transition-all hover:bg-sky-100/30 ${isToday ? 'bg-sky-600 text-white shadow-lg z-10 ring-2 ring-sky-400 ring-offset-1' : 'bg-white/80'}`}
          onClick={() => openAddModal(dateStr)}
        >
          <span className={`text-[9px] sm:text-[10px] font-bold ${isToday ? 'text-white' : 'text-slate-700'}`}>
            {day}
          </span>
          
          <div className="mt-0.5 space-y-0.5 max-h-[calc(100%-1.2rem)] overflow-y-auto scrollbar-hide">
            {dayEvents.map(event => (
              <div 
                key={event.id}
                onClick={(e) => {
                  e.stopPropagation();
                  openEditModal(event);
                }}
                className={`text-[6px] sm:text-[8px] px-1 py-0 rounded border truncate cursor-pointer transition-transform hover:scale-105 flex items-center gap-0.5 ${
                  event.type === 'pembelajaran' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                  event.type === 'libur' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                  event.type === 'mgbk' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                  event.type === 'ujian' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                  event.type === 'libur_sekolah' ? 'bg-teal-100 text-teal-700 border-teal-200' :
                  event.type === 'dinas_dalam' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                  event.type === 'dinas_luar' ? 'bg-cyan-100 text-cyan-700 border-cyan-200' :
                  event.type === 'pelatihan' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                  event.type === 'daring' ? 'bg-pink-100 text-pink-700 border-pink-200' :
                  'bg-amber-100 text-amber-700 border-amber-200'
                }`}
                title={event.title}
              >
                {event.reminder && <Bell className="w-2 h-2 shrink-0" />}
                <span className="truncate">{event.title}</span>
              </div>
            ))}
          </div>

          <button className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 p-0.5 bg-sky-500 text-white rounded transition-opacity hidden sm:block">
            <Plus className="w-2 h-2" />
          </button>
        </div>
      );
    }

    return days;
  };

  const renderWeekView = () => {
    const days = [];
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = getLocalISODate(date);
      const dayEvents = events.filter(e => {
        if (e.endDate) return dateStr >= e.date && dateStr <= e.endDate;
        return e.date === dateStr;
      });
      const isToday = getLocalISODate(new Date()) === dateStr;

      days.push(
        <div 
          key={dateStr} 
          className={`min-h-[200px] border border-slate-200/50 p-2 relative group transition-all hover:bg-sky-100/30 ${isToday ? 'bg-sky-50/50' : 'bg-white/80'}`}
          onClick={() => openAddModal(dateStr)}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{INDONESIAN_DAYS[i]}</span>
            <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold ${isToday ? 'bg-sky-600 text-white shadow-md' : 'text-slate-700'}`}>
              {date.getDate()}
            </span>
          </div>
          
          <div className="space-y-1">
            {dayEvents.map(event => (
              <div 
                key={event.id}
                onClick={(e) => {
                  e.stopPropagation();
                  openEditModal(event);
                }}
                className={`text-[9px] px-2 py-1 rounded border cursor-pointer transition-transform hover:scale-[1.02] flex items-center gap-1.5 ${
                  event.type === 'pembelajaran' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                  event.type === 'libur' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                  event.type === 'mgbk' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                  event.type === 'ujian' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                  event.type === 'libur_sekolah' ? 'bg-teal-100 text-teal-700 border-teal-200' :
                  event.type === 'dinas_dalam' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                  event.type === 'dinas_luar' ? 'bg-cyan-100 text-cyan-700 border-cyan-200' :
                  event.type === 'pelatihan' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                  event.type === 'daring' ? 'bg-pink-100 text-pink-700 border-pink-200' :
                  'bg-amber-100 text-amber-700 border-amber-200'
                }`}
              >
                {event.reminder && <Bell className="w-2.5 h-2.5 shrink-0" />}
                <span className="font-bold truncate">{event.title}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return <div className="grid grid-cols-1 sm:grid-cols-7 border border-slate-300 rounded-lg overflow-hidden shadow-sm">{days}</div>;
  };

  const renderDayView = () => {
    const dateStr = getLocalISODate(currentDate);
    const dayEvents = events.filter(e => {
      if (e.endDate) return dateStr >= e.date && dateStr <= e.endDate;
      return e.date === dateStr;
    });
    const isToday = getLocalISODate(new Date()) === dateStr;

    return (
      <div className="border border-slate-300 rounded-lg overflow-hidden shadow-sm bg-white p-6">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center border-2 ${isToday ? 'bg-sky-600 border-sky-400 text-white shadow-lg' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
              <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">{INDONESIAN_DAYS[(currentDate.getDay() + 6) % 7]}</span>
              <span className="text-2xl font-black leading-none">{currentDate.getDate()}</span>
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{INDONESIAN_MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
              <p className="text-xs text-slate-500 font-medium">{dayEvents.length} Kegiatan Terjadwal</p>
            </div>
          </div>
          <button 
            onClick={() => openAddModal(dateStr)}
            className="px-4 py-2 bg-sky-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-sky-600 transition-all shadow-md flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Tambah Kegiatan
          </button>
        </div>

        <div className="space-y-3">
          {dayEvents.length > 0 ? (
            dayEvents.map(event => (
              <div 
                key={event.id}
                onClick={() => openEditModal(event)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-md flex items-center justify-between group ${
                  event.type === 'pembelajaran' ? 'bg-blue-50 border-blue-100 hover:border-blue-300' :
                  event.type === 'libur' ? 'bg-rose-50 border-rose-100 hover:border-rose-300' :
                  event.type === 'mgbk' ? 'bg-purple-50 border-purple-100 hover:border-purple-300' :
                  event.type === 'ujian' ? 'bg-orange-50 border-orange-100 hover:border-orange-300' :
                  event.type === 'libur_sekolah' ? 'bg-teal-50 border-teal-100 hover:border-teal-300' :
                  event.type === 'dinas_dalam' ? 'bg-indigo-50 border-indigo-100 hover:border-indigo-300' :
                  event.type === 'dinas_luar' ? 'bg-cyan-50 border-cyan-100 hover:border-cyan-300' :
                  event.type === 'pelatihan' ? 'bg-emerald-50 border-emerald-100 hover:border-emerald-300' :
                  event.type === 'daring' ? 'bg-pink-50 border-pink-100 hover:border-pink-300' :
                  'bg-amber-50 border-amber-100 hover:border-amber-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    event.type === 'pembelajaran' ? 'bg-blue-500 text-white' :
                    event.type === 'libur' ? 'bg-rose-500 text-white' :
                    event.type === 'mgbk' ? 'bg-purple-500 text-white' :
                    event.type === 'ujian' ? 'bg-orange-500 text-white' :
                    event.type === 'libur_sekolah' ? 'bg-teal-500 text-white' :
                    event.type === 'dinas_dalam' ? 'bg-indigo-500 text-white' :
                    event.type === 'dinas_luar' ? 'bg-cyan-500 text-white' :
                    event.type === 'pelatihan' ? 'bg-emerald-500 text-white' :
                    event.type === 'daring' ? 'bg-pink-500 text-white' :
                    'bg-amber-500 text-white'
                  }`}>
                    {event.reminder ? <Bell className="w-5 h-5" /> : <CalendarIcon className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{event.title}</h4>
                    {event.description && <p className="text-xs text-slate-500 font-medium mt-0.5">{event.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 hover:bg-white/50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <CalendarIcon className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-xs font-bold uppercase tracking-widest">Tidak ada kegiatan hari ini</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAgendaView = () => {
    const sortedEvents = [...events].sort((a, b) => a.date.localeCompare(b.date));
    const futureEvents = sortedEvents.filter(e => {
      const today = getLocalISODate(new Date());
      return e.date >= today || (e.endDate && e.endDate >= today);
    });

    return (
      <div className="border border-slate-300 rounded-lg overflow-hidden shadow-sm bg-white">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Agenda Mendatang</h3>
          <span className="text-[10px] font-black text-sky-600 bg-sky-100 px-2 py-0.5 rounded-full">{futureEvents.length} Kegiatan</span>
        </div>
        <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto custom-scrollbar">
          {futureEvents.length > 0 ? (
            futureEvents.map(event => (
              <div 
                key={event.id}
                onClick={() => openEditModal(event)}
                className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-4 group"
              >
                <div className="flex flex-col items-center min-w-[50px] py-1 bg-slate-100 rounded-xl border border-slate-200">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{new Date(event.date).toLocaleDateString('id-ID', { month: 'short' })}</span>
                  <span className="text-lg font-black text-slate-800 leading-none">{new Date(event.date).getDate()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest ${
                      event.type === 'pembelajaran' ? 'bg-blue-100 text-blue-700' :
                      event.type === 'libur' ? 'bg-rose-100 text-rose-700' :
                      event.type === 'mgbk' ? 'bg-purple-100 text-purple-700' :
                      event.type === 'ujian' ? 'bg-orange-100 text-orange-700' :
                      event.type === 'libur_sekolah' ? 'bg-teal-100 text-teal-700' :
                      event.type === 'dinas_dalam' ? 'bg-indigo-100 text-indigo-700' :
                      event.type === 'dinas_luar' ? 'bg-cyan-100 text-cyan-700' :
                      event.type === 'pelatihan' ? 'bg-emerald-100 text-emerald-700' :
                      event.type === 'daring' ? 'bg-pink-100 text-pink-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {event.type.replace('_', ' ')}
                    </span>
                    {event.endDate && (
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                        s/d {new Date(event.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight truncate group-hover:text-sky-600 transition-colors">{event.title}</h4>
                  {event.description && <p className="text-xs text-slate-500 font-medium mt-0.5 line-clamp-1">{event.description}</p>}
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Edit className="w-4 h-4 text-slate-300" />
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <List className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-xs font-bold uppercase tracking-widest">Belum ada agenda mendatang</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-50 rounded-[1.5rem] border border-slate-200 shadow-lg shadow-slate-200/30 overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-white/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-600">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              Kalender Akademik
            </h2>
            <p className="text-[9px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">
              Agenda & Kegiatan Sekolah
            </p>
          </div>
        </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-200/50 p-0.5 rounded-lg mr-2">
              <button 
                onClick={() => setViewMode('month')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'month' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                title="Bulan"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setViewMode('week')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'week' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                title="Minggu"
              >
                <Columns className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setViewMode('day')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'day' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                title="Hari"
              >
                <DayIcon className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setViewMode('agenda')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'agenda' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                title="Agenda"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
            <button 
              onClick={handleSyncKemendikbud}
            disabled={isSyncing}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black transition-all shadow-sm uppercase tracking-widest mr-1 ${
              syncSuccess 
                ? 'bg-emerald-500 text-white' 
                : 'bg-white text-sky-600 border border-sky-200 hover:bg-sky-50'
            }`}
          >
            {isSyncing ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : syncSuccess ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            {isSyncing ? 'Sinkronisasi...' : syncSuccess ? 'Berhasil' : 'Sinkron Kemendikbud'}
          </button>
          <button 
            onClick={() => {
              setSelectedDate(getLocalISODate(new Date()));
              setEditingEvent(null);
              setFormTitle('');
              setFormType('pembelajaran');
              setFormDesc('');
              setIsEditModalOpen(true);
            }}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-sky-500 text-white rounded-lg text-[9px] font-black hover:bg-sky-600 transition-all shadow-sm uppercase tracking-widest mr-1"
          >
            <Plus className="w-3 h-3" /> Edit Kalender
          </button>
          <select 
            value={currentMonth} 
            onChange={handleMonthChange}
            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[9px] font-bold outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
          >
            {INDONESIAN_MONTHS.map((month, idx) => (
              <option key={month} value={idx}>{month}</option>
            ))}
          </select>
          <select 
            value={currentYear} 
            onChange={handleYearChange}
            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[9px] font-bold outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <div className="flex items-center bg-slate-200/50 rounded-lg p-0.5">
            <button onClick={handlePrevMonth} className="p-1 hover:bg-white rounded-md transition-all text-slate-600">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleNextMonth} className="p-1 hover:bg-white rounded-md transition-all text-slate-600">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-3 sm:p-4">
        {viewMode === 'month' && (
          <>
            <div className="grid grid-cols-7 mb-1 bg-sky-600 rounded-t-xl border border-sky-700 overflow-hidden shadow-md">
              {INDONESIAN_DAYS.map(day => (
                <div key={day} className="text-center text-[8px] sm:text-[10px] font-black text-white uppercase tracking-wider py-2.5 border-r border-sky-500/30 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 border border-slate-300 rounded-b-lg overflow-hidden shadow-sm">
              {renderCalendarDays()}
            </div>
          </>
        )}

        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'day' && renderDayView()}
        {viewMode === 'agenda' && renderAgendaView()}

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-3 px-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/20"></div>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Pembelajaran</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/20"></div>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Libur Nasional</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-sm shadow-purple-500/20"></div>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">MGBK (Musyawarah Guru BK)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500/20"></div>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Ujian</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-teal-500 shadow-sm shadow-teal-500/20"></div>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Libur Sekolah</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/20"></div>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Dinas Dalam</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-sm shadow-cyan-500/20"></div>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Dinas Luar</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/20"></div>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Pelatihan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-sm shadow-pink-500/20"></div>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Daring</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/20"></div>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Lain-lain</span>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-sky-500 to-blue-600 text-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <Edit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {editingEvent ? 'Edit Kegiatan' : 'Tambah Kegiatan'}
                  </h3>
                  <p className="text-[9px] opacity-80 font-bold uppercase tracking-wider">
                    {new Date(selectedDate!).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Dari Tanggal</label>
                  <input 
                    type="date"
                    required
                    value={selectedDate || ''}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Sampai Tanggal</label>
                  <input 
                    type="date"
                    value={formEndDate}
                    min={selectedDate || ''}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Nama Kegiatan</label>
                <input 
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Contoh: Ujian Tengah Semester"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Jenis Kegiatan</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['pembelajaran', 'libur', 'mgbk', 'ujian', 'libur_sekolah', 'dinas_dalam', 'dinas_luar', 'pelatihan', 'daring', 'lainnya'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormType(type)}
                      className={`py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                        formType === type 
                          ? (type === 'pembelajaran' ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/20' :
                             type === 'libur' ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20' :
                             type === 'mgbk' ? 'bg-purple-500 border-purple-500 text-white shadow-lg shadow-purple-500/20' :
                             type === 'ujian' ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20' :
                             type === 'libur_sekolah' ? 'bg-teal-500 border-teal-500 text-white shadow-lg shadow-teal-500/20' :
                             type === 'dinas_dalam' ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' :
                             type === 'dinas_luar' ? 'bg-cyan-500 border-cyan-500 text-white shadow-lg shadow-cyan-500/20' :
                             type === 'pelatihan' ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' :
                             type === 'daring' ? 'bg-pink-500 border-pink-500 text-white shadow-lg shadow-pink-500/20' :
                             'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20')
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {type === 'pembelajaran' ? 'Belajar' : 
                       type === 'libur' ? 'Libur Nas' : 
                       type === 'mgbk' ? 'MGBK' : 
                       type === 'ujian' ? 'Ujian' : 
                       type === 'libur_sekolah' ? 'Libur Sek' : 
                       type === 'dinas_dalam' ? 'Dinas Dalam' : 
                       type === 'dinas_luar' ? 'Dinas Luar' : 
                       type === 'pelatihan' ? 'Pelatihan' : 
                       type === 'daring' ? 'Daring' :
                       'Lain-lain'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Keterangan (Opsional)</label>
                <textarea 
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Tambahkan detail kegiatan..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-sky-500/20 transition-all h-16 resize-none"
                />
              </div>

              <div className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${formReminder ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-500'}`}>
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-slate-800">Set Pengingat</h4>
                  <p className="text-[9px] text-slate-500 font-medium">Tampilkan ikon pengingat di kalender</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormReminder(!formReminder)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${formReminder ? 'bg-amber-500' : 'bg-slate-300'}`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-transform ${formReminder ? 'translate-x-[22px]' : 'translate-x-[3px]'}`} />
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                {editingEvent && (
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteEvent(editingEvent.id);
                      setIsEditModalOpen(false);
                    }}
                    className="flex-1 py-2 bg-rose-50 text-rose-500 border border-rose-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-[2] py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-sky-500/25 transition-all"
                >
                  {editingEvent ? 'Simpan Perubahan' : 'Tambah Kegiatan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicCalendar;
