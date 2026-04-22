import React, { useState, useRef } from 'react';
import { Certification, TeacherData } from '../types';
import { Award, Plus, Trash2, Upload, Calendar, Building2, FileText, X } from 'lucide-react';
import { toast } from 'sonner';

interface CertificationsTabProps {
  teacherForm: TeacherData;
  setTeacherForm: React.Dispatch<React.SetStateAction<TeacherData>>;
}

const CertificationsTab: React.FC<CertificationsTabProps> = ({ teacherForm, setTeacherForm }) => {
  const [certifications, setCertifications] = useState<Certification[]>(teacherForm.certifications || []);
  const [newCert, setNewCert] = useState<Partial<Certification>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddCert = () => {
    if (!newCert.name || !newCert.issuer || !newCert.issueDate) {
      toast.error('Nama, Penerbit, dan Tanggal Terbit wajib diisi');
      return;
    }
    const cert: Certification = {
      id: Date.now().toString(),
      name: newCert.name,
      issuer: newCert.issuer,
      issueDate: newCert.issueDate,
      expiryDate: newCert.expiryDate,
      certificateUrl: newCert.certificateUrl,
      notes: newCert.notes
    };
    const updatedCerts = [...certifications, cert];
    setCertifications(updatedCerts);
    setTeacherForm({ ...teacherForm, certifications: updatedCerts });
    setNewCert({});
    toast.success('Sertifikasi berhasil ditambahkan');
  };

  const handleDeleteCert = (id: string) => {
    const updatedCerts = certifications.filter(c => c.id !== id);
    setCertifications(updatedCerts);
    setTeacherForm({ ...teacherForm, certifications: updatedCerts });
    toast.success('Sertifikasi berhasil dihapus');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewCert({ ...newCert, certificateUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Form Section */}
      <div className="glass-card p-5 rounded-[1.25rem] border border-slate-200 space-y-5 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
          <div className="w-10 h-10 bg-amber-600/10 rounded-xl flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-lg">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800 tracking-tight uppercase italic">Tambah Sertifikasi Baru</h3>
            <p className="label-luxe text-[8px] text-slate-500">Input data sertifikasi atau pelatihan yang telah Anda ikuti</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Nama Sertifikasi/Pelatihan *</label>
              <input 
                type="text" 
                value={newCert.name || ''} 
                onChange={e => setNewCert({...newCert, name: e.target.value})} 
                className="w-full input-cyber rounded-xl p-2.5 text-xs font-bold outline-none focus:border-amber-500/50 transition-all text-slate-800" 
                placeholder="Contoh: Sertifikasi Konselor Pendidikan" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Penerbit/Penyelenggara *</label>
              <input 
                type="text" 
                value={newCert.issuer || ''} 
                onChange={e => setNewCert({...newCert, issuer: e.target.value})} 
                className="w-full input-cyber rounded-xl p-2.5 text-xs font-bold outline-none focus:border-amber-500/50 transition-all text-slate-800" 
                placeholder="Contoh: Kemdikbud" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Tanggal Terbit *</label>
                <div className="relative">
                  <input 
                    type="date" 
                    value={newCert.issueDate || ''} 
                    onChange={e => setNewCert({...newCert, issueDate: e.target.value})} 
                    className="w-full input-cyber rounded-xl p-2.5 text-xs font-bold outline-none focus:border-amber-500/50 pl-10" 
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Tanggal Kedaluwarsa</label>
                <div className="relative">
                  <input 
                    type="date" 
                    value={newCert.expiryDate || ''} 
                    onChange={e => setNewCert({...newCert, expiryDate: e.target.value})} 
                    className="w-full input-cyber rounded-xl p-2.5 text-xs font-bold outline-none focus:border-amber-500/50 pl-10" 
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Unggah Sertifikat (Opsional, max 2MB)</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-300 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 hover:bg-amber-50/50 transition-all h-[42px] relative overflow-hidden"
              >
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-slate-400" />
                  <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">
                    {newCert.certificateUrl ? 'Sertifikat Terpilih' : 'Pilih File (JPG/PNG)'}
                  </p>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg, image/png" onChange={handleFileUpload} />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Catatan Tambahan</label>
            <textarea 
              value={newCert.notes || ''} 
              onChange={e => setNewCert({...newCert, notes: e.target.value})} 
              className="w-full input-cyber rounded-xl p-3 text-xs font-bold outline-none transition-all text-slate-800 h-20 resize-none focus:border-amber-500/50" 
              placeholder="Tambahkan catatan atau deskripsi singkat mengenai pelatihan ini..." 
            />
          </div>

          <button 
            onClick={handleAddCert}
            className="w-full bg-amber-500 hover:bg-amber-600 py-3 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl transition-all text-white text-[9px] border border-amber-600"
          >
            Simpan Sertifikasi Baru
          </button>
        </div>
      </div>

      {/* List Section */}
      <div className="glass-card p-5 rounded-[1.25rem] border border-slate-200 space-y-5 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
          <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800 tracking-tight uppercase italic">Riwayat Sertifikasi</h3>
            <p className="label-luxe text-[8px] text-slate-500">Daftar sertifikasi yang telah Anda simpan</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certifications.length > 0 ? (
            certifications.map(cert => (
              <div key={cert.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-200 relative group hover:border-amber-500/30 transition-all">
                <button 
                  onClick={() => handleDeleteCert(cert.id)}
                  className="absolute top-3 right-3 p-1.5 bg-rose-100 text-rose-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-200 shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-slate-800 text-xs uppercase tracking-tight truncate pr-8">{cert.name}</h4>
                    <div className="mt-2 space-y-1.5">
                      <p className="text-[10px] font-bold text-slate-600 flex items-center gap-2"><Building2 className="w-3 h-3 text-amber-500" /> {cert.issuer}</p>
                      <p className="text-[10px] font-bold text-slate-600 flex items-center gap-2"><Calendar className="w-3 h-3 text-amber-500" /> {cert.issueDate} {cert.expiryDate ? ` s/d ${cert.expiryDate}` : ''}</p>
                      {cert.notes && <p className="text-[9px] text-slate-500 italic mt-2 bg-white/50 p-2 rounded-lg border border-slate-100">{cert.notes}</p>}
                      {cert.certificateUrl && (
                        <a href={cert.certificateUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100">
                          <FileText className="w-3 h-3" /> Lihat Sertifikat
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-10 flex flex-col items-center justify-center text-slate-400 bg-slate-50/30 rounded-2xl border border-dashed border-slate-200">
              <Award className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-[10px] font-black uppercase tracking-widest">Belum ada riwayat sertifikasi</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CertificationsTab;
