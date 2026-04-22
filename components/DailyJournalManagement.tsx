import React, { useState, useMemo } from 'react';
import { ViewMode, DailyJournal, TeacherData } from '../types';
import { Calendar, Clock, FileText, MapPin, Edit2, Trash2, Plus, Search, Filter, Tag, Eye, X, Info, Users, FileOutput } from 'lucide-react';
import DailyJournalReportModal from './DailyJournalReportModal';

const DailyJournalManagement: React.FC<{
  journals: DailyJournal[];
  teacherData: TeacherData;
  setView: (v: ViewMode) => void;
  onDelete: (id: string) => void;
  onEdit: (journal: DailyJournal) => void;
  onAddNew: () => void;
}> = ({ journals, teacherData, setView, onDelete, onEdit, onAddNew }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('SEMUA');
  const [statusFilter, setStatusFilter] = useState<string>('SEMUA');
  const [selectedJournal, setSelectedJournal] = useState<DailyJournal | null>(null);
  const [journalToDelete, setJournalToDelete] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const availableCategories = useMemo(() => {
    const standard = ['Tugas Pokok', 'Tugas Tambahan', 'Lain - Lain'];
    const fromData = Array.from(new Set(journals.map(j => j.activityType)))
      .filter((c): c is string => 
        typeof c === 'string' && 
        !standard.includes(c) && 
        c !== 'Jurnal Wali Kelas'
      );
    return [...standard, ...fromData];
  }, [journals]);

  const filteredJournals = useMemo(() => {
    return journals.filter(journal => {
      const matchesSearch = 
        journal.activityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        journal.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        journal.place.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'SEMUA' || journal.activityType === categoryFilter;
      const matchesStatus = statusFilter === 'SEMUA' || journal.status === statusFilter;
      
      return matchesSearch && matchesCategory && matchesStatus;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [journals, searchTerm, categoryFilter, statusFilter]);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">DATA JURNAL HARIAN BK</h2>
          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Manajemen aktivitas dan tugas harian guru BK</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowReportModal(true)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-md hover:bg-emerald-700 transition-all flex items-center gap-1.5"
          >
            <FileOutput className="w-3 h-3" /> BUAT LAPORAN
          </button>
          <button 
            onClick={onAddNew}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-md hover:bg-blue-700 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3 h-3" /> TAMBAH JURNAL
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari kegiatan, deskripsi, atau tempat..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-[10px] focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Filter className="w-3 h-3 text-slate-400" />
          <select 
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2 py-2 text-[10px] font-bold text-slate-700 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-sm"
          >
            <option value="SEMUA">KATEGORI</option>
            {availableCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2 py-2 text-[10px] font-bold text-slate-700 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-sm"
          >
            <option value="SEMUA">STATUS</option>
            <option value="Selesai">Selesai</option>
            <option value="Belum Selesai">Belum Selesai</option>
            <option value="Ditunda">Ditunda</option>
            <option value="Dibatalkan">Dibatalkan</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-2 text-[9px] font-black text-slate-500 uppercase tracking-widest w-10 text-center">No</th>
                <th className="px-3 py-2 text-[9px] font-black text-slate-500 uppercase tracking-widest w-32">Hari, Tanggal</th>
                <th className="px-3 py-2 text-[9px] font-black text-slate-500 uppercase tracking-widest w-20">Waktu</th>
                <th className="px-3 py-2 text-[9px] font-black text-slate-500 uppercase tracking-widest w-28">Kategori</th>
                <th className="px-3 py-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">Nama Kegiatan</th>
                <th className="px-3 py-2 text-[9px] font-black text-slate-500 uppercase tracking-widest w-24">Tempat</th>
                <th className="px-3 py-2 text-[9px] font-black text-slate-500 uppercase tracking-widest w-24 text-center">Status</th>
                <th className="px-3 py-2 text-[9px] font-black text-slate-500 uppercase tracking-widest w-20 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredJournals.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-8 h-8 text-slate-300" />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Tidak ada jurnal ditemukan</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredJournals.map((journal, index) => (
                  <tr key={journal.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-3 py-2 text-[10px] font-bold text-slate-400 text-center">{index + 1}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700">
                        <Calendar className="w-3 h-3 text-blue-500" />
                        <span>{journal.day}, {journal.date}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                        <Clock className="w-3 h-3 text-blue-400" />
                        <span>{journal.time}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${
                        journal.activityType === 'Tugas Pokok' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        journal.activityType === 'Tugas Tambahan' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                        'bg-slate-50 text-slate-600 border-slate-100'
                      }`}>
                        {journal.activityType}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="max-w-xs">
                        <p className="text-[10px] font-black text-slate-900 truncate group-hover:text-blue-600 transition-colors">{journal.activityName}</p>
                        <p className="text-[9px] text-slate-500 truncate">{journal.description}</p>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600">
                        <MapPin className="w-3 h-3 text-rose-400" />
                        <span className="truncate">{journal.place}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        journal.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                        journal.status === 'Belum Selesai' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        journal.status === 'Ditunda' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        'bg-rose-50 text-rose-700 border-rose-100'
                      }`}>
                        {journal.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => setSelectedJournal(journal)}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                          title="Lihat Detail"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => onEdit(journal)}
                          className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-all"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setJournalToDelete(journal.id)} 
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Delete Confirmation Modal */}
      {journalToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-8 h-8 text-rose-500" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">HAPUS JURNAL?</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => setJournalToDelete(null)}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                >
                  BATAL
                </button>
                <button 
                  onClick={() => {
                    onDelete(journalToDelete);
                    setJournalToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-200 transition-all"
                >
                  HAPUS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedJournal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">DETAIL JURNAL HARIAN</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {selectedJournal.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedJournal(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu & Tanggal</p>
                  <div className="flex items-center gap-2 text-slate-700 font-bold">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span>{selectedJournal.date} ({selectedJournal.day})</span>
                    <Clock className="w-4 h-4 text-blue-500 ml-2" />
                    <span>{selectedJournal.time}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori Aktivitas</p>
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-blue-500" />
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      selectedJournal.activityType === 'Tugas Pokok' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                      selectedJournal.activityType === 'Tugas Tambahan' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                      'bg-slate-50 text-slate-600 border border-slate-100'
                    }`}>
                      {selectedJournal.activityType}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lokasi / Tempat</p>
                  <div className="flex items-center gap-2 text-slate-700 font-bold">
                    <MapPin className="w-4 h-4 text-rose-500" />
                    <span>{selectedJournal.place}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      selectedJournal.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                      selectedJournal.status === 'Belum Selesai' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                      selectedJournal.status === 'Ditunda' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      'bg-rose-50 text-rose-700 border-rose-100'
                    }`}>
                      {selectedJournal.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Kegiatan</p>
                <h4 className="text-xl font-black text-slate-900 tracking-tight leading-tight">{selectedJournal.activityName}</h4>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deskripsi Kegiatan</p>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedJournal.description}</p>
                </div>
              </div>

              {selectedJournal.notes && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Catatan Tambahan</p>
                  <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100 flex gap-3">
                    <Info className="w-5 h-5 text-amber-500 shrink-0" />
                    <p className="text-sm text-slate-700 italic leading-relaxed">{selectedJournal.notes}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setSelectedJournal(null)}
                className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all"
              >
                TUTUP
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Report Modal */}
      {showReportModal && (
        <DailyJournalReportModal 
          journals={filteredJournals} 
          teacherData={teacherData}
          onClose={() => setShowReportModal(false)} 
        />
      )}
    </div>
  );
};

export default DailyJournalManagement;
