import React, { useEffect } from 'react';
import { ViewMode, DailyJournal } from '../types';
import { Calendar, Clock, FileText, MapPin, BookOpen, CheckCircle2 } from 'lucide-react';
import FormActions from './FormActions';
import { useFormDraft } from '../hooks/useFormDraft';

const DailyJournalInput: React.FC<{ 
  onAdd: (journal: DailyJournal) => void; 
  onUpdate: (journal: DailyJournal) => void;
  setView: (v: ViewMode) => void;
  initialData: DailyJournal | null;
}> = ({ onAdd, onUpdate, setView, initialData }) => {
  const [formData, setFormData, clearFormData] = useFormDraft<Partial<DailyJournal>>("draft_daily_journal", {
    date: new Date().toISOString().split('T')[0],
    day: new Date().toLocaleDateString('id-ID', { weekday: 'long' }),
    time: '',
    activityType: 'Tugas Pokok',
    activityName: '',
    place: '',
    description: '',
    notes: '',
    status: 'Selesai'
  });

  const [isCustomCategory, setIsCustomCategory] = React.useState(false);
  const [customCategory, setCustomCategory] = React.useState('');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      const standardCategories = ['Tugas Pokok', 'Tugas Tambahan', 'Lain - Lain'];
      if (initialData.activityType && !standardCategories.includes(initialData.activityType)) {
        setIsCustomCategory(true);
        setCustomCategory(initialData.activityType);
      }
    }
  }, [initialData]);

  useEffect(() => {
    if (formData.date && !initialData) {
      const day = new Date(formData.date).toLocaleDateString('id-ID', { weekday: 'long' });
      setFormData(prev => ({ ...prev, day }));
    }
  }, [formData.date, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalActivityType = isCustomCategory ? customCategory : formData.activityType;
    
    if (isCustomCategory && !customCategory.trim()) {
      alert('Kategori manual wajib diisi');
      return;
    }

    const payload = { 
      ...formData, 
      activityType: finalActivityType 
    };

    if (initialData) {
      onUpdate(payload as DailyJournal);
    } else {
      onAdd({ ...payload, id: Date.now().toString() } as DailyJournal);
    }
    clearFormData();
    setIsCustomCategory(false);
    setCustomCategory('');
    setView(ViewMode.DAILY_JOURNAL_DATA);
  };

  return (
    <div className="max-w-4xl mx-auto glass-card p-4 rounded-xl shadow-lg animate-fade-in text-left mb-6 border border-white">
      <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-4">
        {initialData ? 'UPDATE JURNAL HARIAN BK' : 'JURNAL HARIAN BK'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="w-[30%] min-w-[120px] space-y-1">
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1.5"><Calendar className="w-2.5 h-2.5 text-blue-500" /> Tanggal</label>
            <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-2 text-[10px] input-cyber rounded-lg outline-none" />
          </div>
          <div className="w-[25%] min-w-[100px] space-y-1">
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1.5"><Calendar className="w-2.5 h-2.5 text-blue-500" /> Hari</label>
            <input type="text" disabled value={formData.day} className="w-full p-2 text-[10px] input-cyber rounded-lg outline-none bg-slate-50 text-slate-400" />
          </div>
          <div className="w-[10%] min-w-[80px] space-y-1">
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1.5"><Clock className="w-2.5 h-2.5 text-blue-500" /> Waktu</label>
            <input type="time" required value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full p-2 text-[10px] input-cyber rounded-lg outline-none" />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className={`${isCustomCategory ? 'w-[30%]' : 'w-full'} min-w-[180px] space-y-1`}>
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Jenis Kegiatan</label>
            <select 
              value={isCustomCategory ? 'CUSTOM' : formData.activityType} 
              onChange={e => {
                if (e.target.value === 'CUSTOM') {
                  setIsCustomCategory(true);
                } else {
                  setIsCustomCategory(false);
                  setFormData({...formData, activityType: e.target.value});
                }
              }} 
              className="w-full p-2 text-[10px] input-cyber rounded-lg outline-none appearance-none"
            >
              <option value="Tugas Pokok">Tugas Pokok</option>
              <option value="Tugas Tambahan">Tugas Tambahan</option>
              <option value="Lain - Lain">Lain - Lain</option>
              <option value="CUSTOM">Tambah Kategori lain...</option>
            </select>
          </div>
          {isCustomCategory && (
            <div className="flex-1 min-w-[180px] space-y-1 animate-in slide-in-from-left-2 duration-200">
              <label className="text-[8px] font-black text-blue-500 uppercase tracking-[0.2em]">Kategori Manual</label>
              <input 
                type="text" 
                required 
                value={customCategory} 
                onChange={e => setCustomCategory(e.target.value)} 
                className="w-full p-2 text-[10px] input-cyber rounded-lg outline-none border-blue-200 focus:border-blue-500" 
                placeholder="Masukkan kategori baru..." 
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="w-[30%] min-w-[150px] space-y-1">
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1.5"><FileText className="w-2.5 h-2.5 text-blue-500" /> Kegiatan</label>
            <input required value={formData.activityName} onChange={e => setFormData({...formData, activityName: e.target.value})} className="w-full p-2 text-[10px] input-cyber rounded-lg outline-none" placeholder="Nama kegiatan..." />
          </div>
          <div className="w-[50%] min-w-[200px] space-y-1">
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1.5"><MapPin className="w-2.5 h-2.5 text-blue-500" /> Tempat</label>
            <input required value={formData.place} onChange={e => setFormData({...formData, place: e.target.value})} className="w-full p-2 text-[10px] input-cyber rounded-lg outline-none" placeholder="Tempat kegiatan..." />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1.5"><BookOpen className="w-2.5 h-2.5 text-blue-500" /> Deskripsi Kegiatan</label>
          <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 h-16 text-[10px] leading-relaxed input-cyber rounded-lg outline-none resize-none" placeholder="Deskripsi kegiatan..." />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1.5"><FileText className="w-2.5 h-2.5 text-slate-500" /> Catatan</label>
            <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full p-2 h-12 text-[10px] input-cyber rounded-lg outline-none resize-none" placeholder="Catatan tambahan..." />
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Keterangan</label>
            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full p-2 text-[10px] input-cyber rounded-lg outline-none appearance-none">
              <option value="Selesai">Selesai</option>
              <option value="Belum Selesai">Belum Selesai</option>
              <option value="Ditunda">Ditunda</option>
              <option value="Dibatalkan">Dibatalkan</option>
            </select>
          </div>
        </div>
        <FormActions 
          onSaveLocal={() => handleSubmit({ preventDefault: () => {} } as any)}
          onSaveOnline={() => handleSubmit({ preventDefault: () => {} } as any)}
          onCancel={() => setView(ViewMode.DAILY_JOURNAL_DATA)}
          onClose={() => setView(ViewMode.DAILY_JOURNAL_DATA)}
          saveLabel="SIMPAN"
        />
      </form>
    </div>
  );
};

export default DailyJournalInput;
