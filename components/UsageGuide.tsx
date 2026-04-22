
import React from 'react';
import { ViewMode } from '../types';
import { 
  X, UserCircle, Wifi, Users, FileEdit, 
  History, FileBarChart, HardDrive, ChevronRight, HelpCircle, ArrowUpRight,
  ShieldCheck, Cloud, Settings, Layout, MousePointer2, Sparkles, Database
} from 'lucide-react';

interface UsageGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: ViewMode) => void;
}

const UsageGuide: React.FC<UsageGuideProps> = ({ isOpen, onClose, onNavigate }) => {
  if (!isOpen) return null;

  const preparationSteps = [
    {
      title: 'Lengkapi Profil Guru',
      icon: <UserCircle className="w-5 h-5" />,
      color: 'bg-primary',
      desc: 'Klik Pengaturan > Profil Guru. Isi Nama, NIP, dan unggah Foto. Ini penting agar laporan (PDF) Anda memiliki identitas resmi.',
      view: ViewMode.SETTINGS
    },
    {
      title: 'Hubungkan ke Google Sheets',
      icon: <Cloud className="w-5 h-5" />,
      color: 'bg-emerald-600',
      desc: 'Agar data aman jika laptop rusak, hubungkan ke Google Sheets. Ikuti "Panduan Koneksi" di tab Cloud Sheets.',
      view: ViewMode.SETTINGS
    },
    {
      title: 'Isi Data Siswa',
      icon: <Users className="w-5 h-5" />,
      color: 'bg-primary/80',
      desc: 'Masukkan daftar siswa bimbingan Anda. Anda bisa mengetik satu per satu atau "Impor dari Excel" untuk mempercepat proses.',
      view: ViewMode.STUDENT_LIST
    }
  ];

  const operationalSteps = [
    {
      title: 'Catat Jurnal Harian',
      icon: <FileEdit className="w-5 h-5" />,
      color: 'bg-cyan-600',
      desc: 'Setiap kali melakukan layanan (Konseling, Bimbingan Klasikal, dll), segera catat di menu "Layanan BK".',
      view: ViewMode.COUNSELING_INPUT
    },
    {
      title: 'Kolaborasi Tim',
      icon: <Users className="w-5 h-5" />,
      color: 'bg-blue-600',
      desc: 'Berbagi informasi dan berkolaborasi dengan sesama guru BK di menu "Kolaborasi TIM".',
      view: ViewMode.COLLABORATION
    },
    {
      title: 'Lihat Arsip',
      icon: <History className="w-5 h-5" />,
      color: 'bg-purple-600',
      desc: 'Semua catatan Anda tersimpan rapi. Anda bisa memantau perkembangan siswa di menu "Riwayat".',
      view: ViewMode.COUNSELING_DATA
    },
    {
      title: 'Buat Laporan LPJ',
      icon: <FileBarChart className="w-5 h-5" />,
      color: 'bg-amber-600',
      desc: 'Di akhir semester, buka menu LPJ. Aplikasi akan merekap otomatis seluruh aktivitas Anda menjadi tabel laporan.',
      view: ViewMode.LPJ_MANAGEMENT
    }
  ];

  const handleShortcut = (view: ViewMode) => {
    onNavigate(view);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-white/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative glass-card w-full max-w-5xl max-h-[90vh] rounded-[3rem] border border-slate-200 shadow-3xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 bg-white">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-4 text-left">
            <div className="p-3 bg-primary rounded-2xl shadow-lg">
              <HelpCircle className="w-6 h-6 text-slate-800" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">Panduan Aplikasi</h2>
              <p className="label-luxe text-[8px] text-primary mt-1.5 uppercase tracking-widest">Digitalisasi Layanan BK Pro Indonesia</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-500 hover:text-slate-900">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Bagian 1: Persiapan */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                 <div className="p-2 bg-primary/10 rounded-lg text-primary"><Settings className="w-4 h-4" /></div>
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Tahap 1: Persiapan (Sekali Saja)</h3>
              </div>
              <div className="space-y-4">
                {preparationSteps.map((step, idx) => (
                  <div key={idx} className="group p-5 rounded-2xl bg-white border border-slate-100 hover:border-primary/20 transition-all text-left shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className={`shrink-0 w-10 h-10 ${step.color} rounded-xl flex items-center justify-center text-slate-800 shadow-lg`}>
                        {step.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-slate-900 mb-1">{step.title}</h4>
                        <p className="text-slate-500 text-[11px] leading-relaxed mb-4">{step.desc}</p>
                        <button 
                          onClick={() => handleShortcut(step.view)}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-primary text-[9px] font-black text-primary hover:text-white uppercase tracking-widest rounded-lg transition-all"
                        >
                          Buka Menu Ini <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bagian 2: Operasional */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                 <div className="p-2 bg-cyan-50 rounded-lg text-cyan-600"><MousePointer2 className="w-4 h-4" /></div>
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Tahap 2: Penggunaan Harian</h3>
              </div>
              <div className="space-y-4">
                {operationalSteps.map((step, idx) => (
                  <div key={idx} className="group p-5 rounded-2xl bg-white border border-slate-100 hover:border-cyan-200 transition-all text-left shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className={`shrink-0 w-10 h-10 ${step.color} rounded-xl flex items-center justify-center text-slate-800 shadow-lg`}>
                        {step.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-slate-900 mb-1">{step.title}</h4>
                        <p className="text-slate-500 text-[11px] leading-relaxed mb-4">{step.desc}</p>
                        <button 
                          onClick={() => handleShortcut(step.view)}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-cyan-600 text-[9px] font-black text-cyan-600 hover:text-white uppercase tracking-widest rounded-lg transition-all"
                        >
                          Mulai Kerja <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Bagian 3: Integrasi Cloud */}
            <div className="space-y-6 md:col-span-2 mt-4">
              <div className="flex items-center gap-3 mb-4">
                 <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><Cloud className="w-4 h-4" /></div>
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Tahap 3: Integrasi Cloud (Google Sheets)</h3>
              </div>
              <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100 shadow-sm">
                <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                  Untuk mengamankan data Anda dan memungkinkan akses dari perangkat lain, Anda dapat menghubungkan aplikasi ini ke Google Sheets menggunakan Apps Script.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {[
                      { 
                        title: "1. BUAT SALINAN & IZINKAN AKSES", 
                        desc: "Buka Google Sheets Baru (atau gunakan file yang sudah ada). Pastikan Anda sudah login ke akun Google di browser."
                      },
                      { 
                        title: "2. BUKA APPS SCRIPT", 
                        desc: "Di dalam Google Sheets, klik menu Extensions (Ekstensi) > Apps Script." 
                      },
                      { 
                        title: "3. SALIN & TEMPEL KODE", 
                        desc: "Hapus semua kode bawaan di editor, lalu salin kode script dari menu Pengaturan > Cloud Sheets dan tempelkan ke editor Apps Script." 
                      },
                      { 
                        title: "4. DEPLOY (PUBLIKASI)", 
                        desc: "Klik tombol biru Deploy > New Deployment. Pada bagian 'Select type', pilih Web App." 
                      },
                      { 
                        title: "5. SETEL AKSES & IZINKAN", 
                        desc: "Ubah 'Who has access' menjadi Anyone. Klik Deploy. Klik Authorize Access, pilih akun Anda. Jika muncul 'Google hasn't verified', klik Advanced > Go to Jurnal BK (unsafe) > Allow." 
                      },
                      { 
                        title: "6. HUBUNGKAN KE APLIKASI", 
                        desc: "Salin Web App URL yang muncul (berakhiran /exec), lalu tempelkan ke kolom 'LINK DATA PRIBADI' di menu Pengaturan > Cloud Sheets." 
                      }
                    ].map((step, i) => (
                      <div key={i} className="flex gap-3 group">
                         <span className="shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-[10px]">{i+1}</span>
                         <div className="space-y-1">
                           <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{step.title}</p>
                           <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{step.desc}</p>
                         </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col justify-center items-center bg-white p-6 rounded-xl border border-emerald-100 shadow-sm text-center space-y-4">
                    <Database className="w-12 h-12 text-emerald-500" />
                    <div>
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">Dapatkan Kode Script</h4>
                      <p className="text-xs text-slate-500 mb-4">Kode Apps Script tersedia di menu Pengaturan pada tab Cloud Sheets.</p>
                      <button 
                        onClick={() => handleShortcut(ViewMode.SETTINGS)}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                      >
                        Buka Pengaturan Cloud
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Info Tambahan Keamanan */}
          <div className="mt-8 p-6 rounded-[2rem] bg-indigo-50 border border-indigo-100 flex items-center gap-6">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0">
               <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="text-left">
               <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest mb-1">Keamanan Data Anda</h4>
               <p className="text-[10px] text-slate-600 leading-relaxed">Aplikasi ini menyimpan data di browser laptop Anda. Kami sangat menyarankan untuk rutin melakukan <strong>"Ekspor Database"</strong> (Backup) di menu Pengaturan agar data tidak hilang jika laptop di-reset atau browser dibersihkan.</p>
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-slate-100 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">© 2025 Jurnal BK Pro • Solusi Administrasi Digital Guru Indonesia</p>
          <button 
            onClick={onClose}
            className="w-full md:w-auto bg-primary hover:brightness-110 text-white px-10 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95"
          >
            Selesai, Siap Digunakan
          </button>
        </div>
      </div>
    </div>
  );
};

export default UsageGuide;
