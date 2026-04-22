import React, { useState } from 'react';
import { ViewMode, Student, HomeVisit, TeacherData } from '../types';
import { ArrowLeft, Save, Upload, Home } from 'lucide-react';
import { useFormDraft } from '../hooks/useFormDraft';

interface HomeVisitInputProps {
  setView: (view: ViewMode) => void;
  students: Student[];
  onAdd: (v: HomeVisit, sync?: boolean) => void;
  teacherData: TeacherData;
}

const HomeVisitInput: React.FC<HomeVisitInputProps> = ({ setView, students, onAdd, teacherData }) => {
  const [newVisit, setNewVisit, clearNewVisit] = useFormDraft<Omit<HomeVisit, 'id'>>("draft_home_visit_input", {
    studentId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    address: '',
    metBy: '',
    familyStatus: '',
    purpose: '',
    result: '',
    followUp: '',
    photo: '',
    status: ''
  });

  const handleSave = () => {
    if (!newVisit.studentId || !newVisit.purpose || !newVisit.result) {
      alert('Lengkapi data kunjungan.');
      return;
    }
    onAdd({ ...newVisit, id: Date.now().toString() } as HomeVisit, true);
    clearNewVisit();
    setView(ViewMode.HOME_VISIT);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-10 animate-fade-in text-left">
      <div className="flex items-center gap-3 px-4">
        <button onClick={() => setView(ViewMode.HOME_VISIT)} className="p-1.5 bg-white rounded-xl border border-slate-200 hover:bg-slate-100 transition-all shadow-lg group">
          <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-1 transition-transform" />
        </button>
        <div>
          <p className="label-luxe text-blue-500 font-black text-[7px]">LAYANAN RESPONSIF</p>
          <h2 className="text-xl font-black text-slate-800 tracking-tighter uppercase leading-none">Tambah <span className="text-blue-500 font-light italic">Home Visit</span></h2>
        </div>
      </div>

      <div className="glass-card p-4.5 rounded-2xl border border-slate-200 mx-4 backdrop-blur-2xl shadow-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Siswa</label>
            <select 
              value={newVisit.studentId} 
              onChange={e => {
                const student = students.find(s => s.id === e.target.value);
                setNewVisit({...newVisit, studentId: e.target.value, address: student?.address || ''});
              }}
              className="w-full input-cyber p-2.5 text-[10px] rounded-xl outline-none"
            >
              <option value="">-- Pilih Siswa --</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.className})</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Tanggal</label>
            <input 
              type="date" 
              value={newVisit.date} 
              onChange={e => setNewVisit({...newVisit, date: e.target.value})}
              className="w-full input-cyber p-2.5 text-[10px] rounded-xl outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Waktu Mulai</label>
            <input 
              type="time" 
              value={newVisit.startTime} 
              onChange={e => setNewVisit({...newVisit, startTime: e.target.value})}
              className="w-full input-cyber p-2.5 text-[10px] rounded-xl outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Waktu Selesai</label>
            <input 
              type="time" 
              value={newVisit.endTime} 
              onChange={e => setNewVisit({...newVisit, endTime: e.target.value})}
              className="w-full input-cyber p-2.5 text-[10px] rounded-xl outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Status Kunjungan</label>
            <select 
              value={newVisit.status || ''} 
              onChange={e => setNewVisit({...newVisit, status: e.target.value as any})}
              className="w-full input-cyber p-2.5 text-[10px] rounded-xl outline-none"
            >
              <option value="">-- Pilih Status --</option>
              <option value="Terjadwal">Terjadwal</option>
              <option value="Selesai">Selesai</option>
              <option value="Dibatalkan">Dibatalkan</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Alamat Kunjungan</label>
            <textarea 
              rows={2}
              placeholder="Alamat lengkap..."
              value={newVisit.address} 
              onChange={e => setNewVisit({...newVisit, address: e.target.value})}
              className="w-full input-cyber p-2.5 text-[10px] rounded-xl outline-none leading-relaxed"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1 flex items-center gap-2">
              <Home className="w-3 h-3 text-blue-500" /> Peta Rumah (Otomatis)
            </label>
            <div className="w-full h-[200px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 relative group shadow-inner">
              {newVisit.address ? (
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(newVisit.address)}&output=embed`}
                  allowFullScreen
                  title="Peta Rumah"
                ></iframe>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Home className="w-8 h-8 opacity-20" />
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Masukkan alamat untuk melihat peta</p>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Ditemui Oleh</label>
            <input 
              type="text" 
              value={newVisit.metBy} 
              onChange={e => setNewVisit({...newVisit, metBy: e.target.value})}
              className="w-full input-cyber p-2.5 text-[10px] rounded-xl outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Status Keluarga</label>
            <select 
              value={newVisit.familyStatus} 
              onChange={e => setNewVisit({...newVisit, familyStatus: e.target.value as any})}
              className="w-full input-cyber p-2.5 text-[10px] rounded-xl outline-none"
            >
              <option value="">-- Pilih Status --</option>
              <option value="Ayah dan Ibu">Ayah dan Ibu</option>
              <option value="Ayah">Ayah</option>
              <option value="Ibu">Ibu</option>
              <option value="Kakak">Kakak</option>
              <option value="Saudara">Saudara</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Tujuan Kunjungan</label>
            <input 
              type="text" 
              value={newVisit.purpose} 
              onChange={e => setNewVisit({...newVisit, purpose: e.target.value})}
              className="w-full input-cyber p-2.5 text-[10px] rounded-xl outline-none"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Hasil Kunjungan</label>
            <textarea 
              rows={3}
              value={newVisit.result} 
              onChange={e => setNewVisit({...newVisit, result: e.target.value})}
              className="w-full input-cyber p-2.5 text-[10px] rounded-xl outline-none"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Tindak Lanjut</label>
            <textarea 
              rows={2}
              value={newVisit.followUp} 
              onChange={e => setNewVisit({...newVisit, followUp: e.target.value})}
              className="w-full input-cyber p-2.5 text-[10px] rounded-xl outline-none"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Foto Kunjungan</label>
            <div className="flex items-center gap-3">
              <button 
                type="button"
                className="p-2 bg-slate-100 rounded-xl text-slate-500 hover:bg-slate-200 transition-all"
                onClick={() => alert('Fitur unggah foto belum diimplementasikan.')}
              >
                <Upload className="w-4 h-4" />
              </button>
              <span className="text-[9px] text-slate-500">Unggah foto dokumentasi</span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button 
            onClick={() => setView(ViewMode.HOME_VISIT)}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all"
          >
            Batal
          </button>
          <button 
            onClick={handleSave}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-xl flex items-center gap-2"
          >
            <Save className="w-3.5 h-3.5" /> Simpan Kunjungan
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeVisitInput;
