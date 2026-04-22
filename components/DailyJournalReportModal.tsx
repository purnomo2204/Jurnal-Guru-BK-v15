import React, { useState, useRef } from 'react';
import { DailyJournal, TeacherData } from '../types';
import { X, Download, Edit, Eye, Save, Printer } from 'lucide-react';
import html2pdf from 'html2pdf.js';

interface DailyJournalReportModalProps {
  journals: DailyJournal[];
  teacherData: TeacherData;
  onClose: () => void;
}

const DailyJournalReportModal: React.FC<DailyJournalReportModalProps> = ({ journals, teacherData, onClose }) => {
  const [viewMode, setViewMode] = useState<'PREVIEW' | 'EDIT'>('PREVIEW');
  const reportRef = useRef<HTMLDivElement>(null);

  const [kopSurat, setKopSurat] = useState({
    instansi: teacherData.govOrFoundation || 'PEMERINTAH PROVINSI JAWA TIMUR',
    dinas: teacherData.deptOrFoundation || 'DINAS PENDIDIKAN',
    sekolah: teacherData.school || 'SMA NEGERI 1 CONTOH',
    alamat: teacherData.schoolAddress || 'Jl. Pendidikan No. 1, Kota Contoh, Kode Pos 12345',
    kontak: teacherData.phone ? `Telp: ${teacherData.phone}` : '(0123) 456789 | Email: info@sman1contoh.sch.id',
    website: 'Website: www.sman1contoh.sch.id'
  });

  const [tandaTangan, setTandaTangan] = useState({
    tempatTanggal: `${teacherData.city || 'Kota Contoh'}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    jabatanKepala: 'Kepala Sekolah',
    namaKepala: teacherData.principalName || 'Dr. Budi Santoso, M.Pd.',
    nipKepala: teacherData.principalNip ? `NIP. ${teacherData.principalNip}` : 'NIP. 19700101 199512 1 001',
    jabatanGuru: 'Guru Bimbingan dan Konseling',
    namaGuru: teacherData.name || 'Purnomo Wiwit, S.Pd.',
    nipGuru: teacherData.nip ? `NIP. ${teacherData.nip}` : 'NIP. 19850202 201001 1 002'
  });

  const handleDownload = () => {
    if (!reportRef.current) return;
    
    const element = reportRef.current;
    
    const opt = {
      margin:       [20, 30, 30, 20] as [number, number, number, number], // Top, Left, Bottom, Right in mm
      filename:     'Laporan_Jurnal_Harian_BK.pdf',
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { 
        scale: 2, 
        useCORS: true,
        letterRendering: true,
        onclone: (document: Document) => {
          const styles = document.querySelectorAll('style');
          styles.forEach(s => {
            if (s.innerHTML.includes('oklch')) {
              s.innerHTML = s.innerHTML.replace(/oklch\([^)]+\)/g, 'inherit');
            }
          });
        }
      },
      jsPDF:        { unit: 'mm', format: 'legal', orientation: 'landscape' as const }
    };

    html2pdf().set(opt).from(element).save();
  };

  const handlePrint = () => {
    if (!reportRef.current) return;
    
    const printContent = reportRef.current.innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); // Reload to restore React state properly
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header Actions */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-600" />
            LAPORAN JURNAL HARIAN BK
          </h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setViewMode('PREVIEW')}
              className={`px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all flex items-center gap-1.5 ${viewMode === 'PREVIEW' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
            >
              <Eye className="w-3.5 h-3.5" /> PREVIEW
            </button>
            <button 
              onClick={() => setViewMode('EDIT')}
              className={`px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all flex items-center gap-1.5 ${viewMode === 'EDIT' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
            >
              <Edit className="w-3.5 h-3.5" /> EDIT
            </button>
            <button 
              onClick={handleDownload}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest shadow-md hover:bg-emerald-700 transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> DOWNLOAD PDF
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-100 p-6 custom-scrollbar flex justify-center">
          
          {viewMode === 'EDIT' ? (
            <div className="w-full max-w-3xl bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-8">
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 border-b pb-2">Edit Kop Surat</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Instansi</label>
                    <input type="text" value={kopSurat.instansi} onChange={e => setKopSurat({...kopSurat, instansi: e.target.value})} className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Dinas</label>
                    <input type="text" value={kopSurat.dinas} onChange={e => setKopSurat({...kopSurat, dinas: e.target.value})} className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Sekolah</label>
                    <input type="text" value={kopSurat.sekolah} onChange={e => setKopSurat({...kopSurat, sekolah: e.target.value})} className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none font-bold" />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Alamat</label>
                    <input type="text" value={kopSurat.alamat} onChange={e => setKopSurat({...kopSurat, alamat: e.target.value})} className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Kontak</label>
                    <input type="text" value={kopSurat.kontak} onChange={e => setKopSurat({...kopSurat, kontak: e.target.value})} className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Website</label>
                    <input type="text" value={kopSurat.website} onChange={e => setKopSurat({...kopSurat, website: e.target.value})} className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 border-b pb-2">Edit Tanda Tangan</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Tempat & Tanggal</label>
                      <input type="text" value={tandaTangan.tempatTanggal} onChange={e => setTandaTangan({...tandaTangan, tempatTanggal: e.target.value})} className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Jabatan Kiri (Kepala Sekolah)</label>
                      <input type="text" value={tandaTangan.jabatanKepala} onChange={e => setTandaTangan({...tandaTangan, jabatanKepala: e.target.value})} className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Kiri</label>
                      <input type="text" value={tandaTangan.namaKepala} onChange={e => setTandaTangan({...tandaTangan, namaKepala: e.target.value})} className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">NIP Kiri</label>
                      <input type="text" value={tandaTangan.nipKepala} onChange={e => setTandaTangan({...tandaTangan, nipKepala: e.target.value})} className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase invisible">Spacer</label>
                      <div className="w-full p-2 text-xs text-transparent">Spacer</div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Jabatan Kanan (Guru BK)</label>
                      <input type="text" value={tandaTangan.jabatanGuru} onChange={e => setTandaTangan({...tandaTangan, jabatanGuru: e.target.value})} className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Kanan</label>
                      <input type="text" value={tandaTangan.namaGuru} onChange={e => setTandaTangan({...tandaTangan, namaGuru: e.target.value})} className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">NIP Kanan</label>
                      <input type="text" value={tandaTangan.nipGuru} onChange={e => setTandaTangan({...tandaTangan, nipGuru: e.target.value})} className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button 
                  onClick={() => setViewMode('PREVIEW')}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> SIMPAN & PREVIEW
                </button>
              </div>
            </div>
          ) : (
            /* Preview Area (Legal Landscape: 355.6mm x 215.9mm) */
            <div 
              className="bg-white shadow-xl border border-slate-200 overflow-hidden"
              style={{ 
                width: '100%', 
                maxWidth: '1344px', // Approx 355.6mm in pixels at 96dpi
                minHeight: '816px', // Approx 215.9mm
              }}
            >
              <div 
                ref={reportRef} 
                className="p-10 bg-white text-black"
                style={{ 
                  width: '100%', 
                  minHeight: '100%',
                  fontFamily: "'Times New Roman', Times, serif"
                }}
              >
                {/* Kop Surat */}
                <div className="flex items-center justify-center border-b-4 border-double border-black pb-4 mb-6">
                  <div className="text-center">
                    <h1 className="text-lg font-bold uppercase leading-tight">{kopSurat.instansi}</h1>
                    <h2 className="text-xl font-bold uppercase leading-tight">{kopSurat.dinas}</h2>
                    <h3 className="text-2xl font-black uppercase tracking-wider leading-tight mt-1">{kopSurat.sekolah}</h3>
                    <p className="text-sm mt-1">{kopSurat.alamat}</p>
                    <p className="text-sm">{kopSurat.kontak}</p>
                    <p className="text-sm">{kopSurat.website}</p>
                  </div>
                </div>

                {/* Title */}
                <div className="text-center mb-6">
                  <h4 className="text-xl font-bold uppercase underline">LAPORAN JURNAL HARIAN BIMBINGAN DAN KONSELING</h4>
                </div>

                {/* Table */}
                <table className="w-full border-collapse border-2 border-black text-sm mb-8">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border-2 border-black p-2 text-center w-10">No</th>
                      <th className="border-2 border-black p-2 text-center w-32">Hari, Tanggal</th>
                      <th className="border-2 border-black p-2 text-center w-20">Waktu</th>
                      <th className="border-2 border-black p-2 text-center w-32">Jenis Kegiatan</th>
                      <th className="border-2 border-black p-2 text-center w-48">Nama Kegiatan</th>
                      <th className="border-2 border-black p-2 text-center w-32">Tempat</th>
                      <th className="border-2 border-black p-2 text-center">Deskripsi / Hasil</th>
                      <th className="border-2 border-black p-2 text-center w-24">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {journals.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="border-2 border-black p-4 text-center italic text-gray-500">
                          Tidak ada data jurnal harian.
                        </td>
                      </tr>
                    ) : (
                      journals.map((journal, index) => (
                        <tr key={journal.id}>
                          <td className="border-2 border-black p-2 text-center">{index + 1}</td>
                          <td className="border-2 border-black p-2">{journal.day}, {journal.date}</td>
                          <td className="border-2 border-black p-2 text-center">{journal.time}</td>
                          <td className="border-2 border-black p-2 text-center">{journal.activityType}</td>
                          <td className="border-2 border-black p-2">{journal.activityName}</td>
                          <td className="border-2 border-black p-2">{journal.place}</td>
                          <td className="border-2 border-black p-2">{journal.description}</td>
                          <td className="border-2 border-black p-2 text-center">{journal.status}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Tanda Tangan */}
                <div className="flex justify-between mt-12 px-10">
                  <div className="text-center">
                    <p className="mb-20">{tandaTangan.jabatanKepala}</p>
                    <p className="font-bold underline">{tandaTangan.namaKepala}</p>
                    <p>{tandaTangan.nipKepala}</p>
                  </div>
                  <div className="text-center">
                    <p>{tandaTangan.tempatTanggal}</p>
                    <p className="mb-20">{tandaTangan.jabatanGuru}</p>
                    <p className="font-bold underline">{tandaTangan.namaGuru}</p>
                    <p>{tandaTangan.nipGuru}</p>
                  </div>
                </div>

              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
};

export default DailyJournalReportModal;
