
import React, { useState, useEffect } from 'react';
import { ViewMode, TeacherData } from '../types';
// Fixed missing imports: Users, School, UserCircle, ShieldCheck
import { ArrowLeft, Network, GitMerge, Workflow, Eye, X, ChevronRight, Layout, Info, Users, School, UserCircle, ShieldCheck } from 'lucide-react';

interface WorkMechanismProps {
  setView: (v: ViewMode) => void;
  teacherData: TeacherData;
}

type MechanismType = 'organisasi' | 'penanganan' | 'kerja';

const WorkMechanism: React.FC<WorkMechanismProps> = ({ setView, teacherData }) => {
  const [activeType, setActiveType] = useState<MechanismType>('organisasi');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    const savedType = localStorage.getItem('bk_mech_type') as MechanismType;
    if (savedType) setActiveType(savedType);
  }, []);

  const handleTypeChange = (type: MechanismType) => {
    setActiveType(type);
    localStorage.setItem('bk_mech_type', type);
  };

  // Komponen Diagram Struktur Organisasi (Enhanced Infographic)
  const OrganizationStructure = () => {
    if (teacherData.orgDiagram) {
        return (
            <div className="w-full max-w-6xl mx-auto p-4 md:p-8 bg-white">
                <img src={teacherData.orgDiagram} className="w-full h-auto object-contain shadow-2xl" alt="Struktur Organisasi BK Kustom" />
                <div className="mt-8 text-center text-[10px] text-slate-500 font-bold uppercase italic">
                    * Menampilkan Lampiran Gambar Kustom yang Diunggah di Pengaturan
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl mx-auto p-12 font-sans text-slate-900 bg-white shadow-inner overflow-x-auto">
          <div className="min-w-[900px] flex flex-col items-center pb-16">
            
            {/* Header Infographic Style */}
            <div className="w-full border-b-[4px] border-blue-600 pb-8 mb-16 flex justify-between items-center px-10">
               <div className="space-y-1">
                  <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-800">STRUKTUR ORGANISASI</h1>
                  <p className="text-lg font-bold text-blue-600 uppercase italic">Pelayanan Bimbingan dan Konseling</p>
               </div>
               <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl">
                  <Network className="w-10 h-10" />
               </div>
            </div>

            {/* Diagram Content */}
            <div className="w-full flex flex-col items-center">
                {/* Level 1: Komite & Tenaga Ahli */}
                <div className="flex justify-between items-center w-full mb-10 px-10 relative">
                    <div className="w-56 p-6 bg-slate-100 text-slate-800 rounded-2xl shadow-xl text-center font-black text-xs uppercase border-b-4 border-slate-900">
                        KOMITE SEKOLAH
                    </div>
                    
                    <div className="z-20 w-64 bg-gradient-to-b from-[#ed7d31] to-[#c55a11] text-white rounded-2xl shadow-2xl overflow-hidden border-b-4 border-slate-900">
                        <div className="p-5 text-center font-black text-sm uppercase tracking-widest border-b border-slate-300">KEPALA SEKOLAH</div>
                        <div className="p-4 bg-white/10 text-center font-bold text-xs uppercase italic">WAKASEK</div>
                    </div>

                    <div className="w-56 p-6 bg-slate-200 text-slate-800 rounded-2xl shadow-xl text-center font-black text-xs uppercase border-b-4 border-slate-900">
                        TENAGA AHLI<br/>INSTANSI LAIN
                    </div>

                    {/* Connecting Dashed Lines Level 1 */}
                    <div className="absolute left-[25%] top-1/2 w-[18%] border-t-2 border-dashed border-slate-400 -z-10"></div>
                    <div className="absolute right-[25%] top-1/2 w-[18%] border-t-2 border-dashed border-slate-400 -z-10"></div>
                </div>

                {/* Vertical Connector */}
                <div className="h-12 w-1 bg-slate-400 relative">
                    <div className="absolute top-1/2 left-0 w-32 border-t-2 border-slate-400"></div>
                    <div className="absolute top-1/2 left-32 w-44 p-4 bg-amber-400 text-slate-900 rounded-xl font-black text-[10px] shadow-lg border-b-4 border-amber-600 text-center -translate-y-1/2 uppercase">
                        TATA USAHA
                    </div>
                </div>

                {/* Level 2: Core Collaborators */}
                <div className="mt-12 w-full flex justify-between items-center px-6 relative">
                    <div className="w-60 p-6 bg-[#70ad47] text-slate-800 rounded-2xl shadow-xl text-center font-black text-sm border-b-4 border-[#385723] uppercase">
                        WALI KELAS
                    </div>

                    <div className="z-10 w-72 bg-gradient-to-br from-[#2e75b6] to-[#1f4e79] text-white p-10 rounded-[3rem] shadow-2xl text-center font-black text-xl uppercase tracking-widest border-[6px] border-white ring-4 ring-[#2e75b6]/20">
                        GURU BK
                    </div>

                    <div className="w-60 p-6 bg-[#2e7d32] text-slate-800 rounded-2xl shadow-xl text-center font-black text-sm border-b-4 border-[#1b4b1e] uppercase">
                        GURU BID. STUDI
                    </div>

                    {/* Collaborative Links */}
                    <div className="absolute left-[25%] top-1/2 w-[12%] border-t-4 border-double border-slate-400"></div>
                    <div className="absolute right-[25%] top-1/2 w-[12%] border-t-4 border-double border-slate-400"></div>
                </div>

                {/* Level 3: Target Vertical Lines */}
                <div className="flex justify-around w-full mt-2 px-10">
                    <div className="h-16 w-1 bg-slate-400 relative"><div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-slate-500">▼</div></div>
                    <div className="h-16 w-1 bg-slate-400 relative"><div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-slate-500">▼</div></div>
                    <div className="h-16 w-1 bg-slate-400 relative"><div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-slate-500">▼</div></div>
                </div>

                {/* Level 4: Students */}
                <div className="w-full bg-[#00b0f0] text-slate-800 py-8 rounded-2xl shadow-2xl text-center font-black text-3xl tracking-[1.5em] pl-[1.5em] uppercase border-b-8 border-blue-800">
                    SISWA
                </div>
            </div>

            <div className="mt-20 w-full flex justify-between items-center text-[11px] font-bold text-slate-500 uppercase tracking-widest italic px-10">
                <span>© 2025 Jurnal BK Pro Edition</span>
                <span className="text-blue-600 font-black">Digital Counseling Intelligence</span>
            </div>
          </div>
        </div>
    );
  };

  // Komponen Diagram Penanganan Siswa Bermasalah (Circular Concept)
  const ProblemStudentHandling = () => (
    <div className="w-full max-w-5xl mx-auto p-12 font-sans text-slate-900 bg-white overflow-x-auto shadow-inner">
      <div className="min-w-[850px] flex flex-col items-center pb-16">
        <div className="w-full text-center space-y-3 mb-16 border-b-4 border-rose-600 pb-8">
           <h1 className="text-3xl font-black uppercase tracking-tighter">MEKANISME PENANGANAN SISWA</h1>
           <p className="text-xl font-bold text-rose-600 italic uppercase">Alur Resolusi & Pembinaan Berkelanjutan</p>
        </div>

        <div className="grid grid-cols-12 w-full items-center gap-4">
            {/* Left Col: Sources */}
            <div className="col-span-3 flex flex-col gap-6">
                {['GURU MATA PELAJARAN', 'GURU PIKET', 'PERSONEL SEKOLAH'].map((src, idx) => (
                    <div key={idx} className="p-5 bg-slate-100 rounded-2xl border-l-8 border-rose-600 shadow-md font-black text-[10px] uppercase text-slate-700">
                        {src}
                    </div>
                ))}
            </div>

            {/* Connector arrows */}
            <div className="col-span-1 flex flex-col justify-around h-full py-10">
                <ChevronRight className="text-slate-600 w-8 h-8" />
                <ChevronRight className="text-slate-600 w-8 h-8" />
                <ChevronRight className="text-slate-600 w-8 h-8" />
            </div>

            {/* Center: Wali Kelas & BK Interaction */}
            <div className="col-span-4 flex flex-col items-center gap-10">
                <div className="w-56 h-56 rounded-full bg-gradient-to-br from-[#92d050] to-[#548235] shadow-2xl flex items-center justify-center p-8 border-8 border-white ring-4 ring-[#92d050]/30">
                    <p className="text-slate-800 font-black text-2xl text-center leading-tight uppercase">WALI<br/>KELAS</p>
                </div>
                <div className="flex flex-col items-center">
                    <div className="h-10 w-1 bg-slate-300 relative">
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-slate-600">▼</div>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full text-slate-600">▲</div>
                    </div>
                </div>
                <div className="w-56 h-56 rounded-full bg-gradient-to-br from-[#ffff00] to-[#ffc000] shadow-2xl flex items-center justify-center p-8 border-8 border-white ring-4 ring-yellow-400/20">
                    <p className="text-slate-900 font-black text-2xl text-center leading-tight uppercase">GURU<br/>BK</p>
                </div>
            </div>

            {/* Right: Decision Makers */}
            <div className="col-span-4 flex flex-col items-center gap-10 pl-10">
                <div className="w-64 p-8 bg-slate-100 text-slate-800 rounded-3xl shadow-2xl text-center font-black text-sm uppercase relative border-b-4 border-slate-950">
                    KEPALA SEKOLAH
                    <div className="absolute left-[-40px] top-1/2 -translate-y-1/2 w-10 border-t-2 border-dashed border-slate-400"></div>
                </div>
                <div className="w-64 p-8 bg-slate-100 text-slate-800 rounded-3xl border-2 border-slate-200 shadow-xl text-center font-black text-xs uppercase italic">
                    ORANG TUA / WALI
                </div>
                <div className="w-64 p-8 bg-rose-100 text-rose-900 rounded-3xl border-2 border-rose-200 shadow-xl text-center font-black text-xs uppercase">
                    REFERAL TENAGA AHLI
                </div>
            </div>
        </div>

        <div className="mt-20 w-full bg-[#bdd7ee] py-5 rounded-xl border-2 border-slate-200 text-center font-black text-3xl tracking-[4em] pl-[4em]">
            SISWA
        </div>
      </div>
    </div>
  );

  // Komponen Diagram Mekanisme Kerja BK (Grid Matrix Style)
  const WorkMechanismDiagram = () => (
    <div className="w-full max-w-6xl mx-auto p-12 font-sans text-slate-900 bg-white shadow-inner overflow-x-auto">
      <div className="min-w-[1000px] flex flex-col items-center">
        <div className="w-full text-center border-b-[4px] border-emerald-600 pb-8 mb-16">
            <h1 className="text-3xl font-black tracking-tighter uppercase">MEKANISME KERJA ADMINISTRASI</h1>
            <p className="text-xl font-bold text-emerald-600 uppercase italic">Standard Operasional Prosedur (SOP) Digital</p>
        </div>
        
        <div className="w-full grid grid-cols-4 bg-slate-50 border-2 border-slate-300 rounded-t-3xl overflow-hidden">
           <div className="p-8 border-r-2 border-slate-300 flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white"><Users className="w-6 h-6" /></div>
              <span className="font-black text-[10px] uppercase text-center text-emerald-800">Guru Mapel</span>
           </div>
           <div className="p-8 border-r-2 border-slate-300 flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white"><School className="w-6 h-6" /></div>
              <span className="font-black text-[10px] uppercase text-center text-blue-800">Wali Kelas</span>
           </div>
           <div className="p-8 border-r-2 border-slate-300 flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white"><UserCircle className="w-6 h-6" /></div>
              <span className="font-black text-[10px] uppercase text-center text-indigo-800">Guru BK</span>
           </div>
           <div className="p-8 flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-800"><ShieldCheck className="w-6 h-6" /></div>
              <span className="font-black text-[10px] uppercase text-center text-slate-800">Pimpinan</span>
           </div>
        </div>

        <div className="w-full border-2 border-t-0 border-slate-300 grid grid-cols-4 text-[11px] font-bold">
            {/* Row 1 */}
            <div className="p-8 border-r-2 border-b-2 border-slate-300 bg-white">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-900 shadow-sm leading-relaxed">
                    Menyerahkan Nilai Harian & Catatan Akademik
                </div>
            </div>
            <div className="p-8 border-r-2 border-b-2 border-slate-300 bg-white flex items-center justify-center">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 shadow-sm w-full text-center">
                    REKAP NILAI & ABSENSI
                </div>
            </div>
            <div className="p-8 border-r-2 border-b-2 border-slate-300 bg-white flex items-center justify-center">
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 shadow-sm w-full text-center font-black">
                    KARTU AKADEMIS SISWA
                </div>
            </div>
            <div className="p-8 border-b-2 border-slate-300 bg-slate-50 flex items-center justify-center italic text-slate-500">
                MENGETAHUI
            </div>

            {/* Row 2 */}
            <div className="p-8 border-r-2 border-b-2 border-slate-300 bg-white">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-900 shadow-sm leading-relaxed">
                    Memberikan Catatan Anekdot
                </div>
            </div>
            <div className="p-8 border-r-2 border-b-2 border-slate-300 bg-white">
                <div className="flex flex-col gap-3">
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-800 text-[10px]">LAPORAN OBSERVASI</div>
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-800 text-[10px]">LAPORAN KUNJUNGAN RUMAH</div>
                </div>
            </div>
            <div className="p-8 border-r-2 border-b-2 border-slate-300 bg-white">
                 <div className="p-5 bg-indigo-600 text-white rounded-2xl shadow-xl text-center uppercase tracking-tighter">
                    BUKU PRIBADI SISWA
                 </div>
            </div>
            <div className="p-8 border-b-2 border-slate-300 bg-slate-50 flex items-center justify-center italic text-slate-500">
                MEMERIKSA
            </div>
        </div>

        <div className="mt-12 p-8 bg-emerald-50 border-2 border-emerald-100 rounded-[2.5rem] w-full flex items-center gap-6">
            <Info className="w-10 h-10 text-emerald-600" />
            <div>
                <p className="text-emerald-900 font-black uppercase text-sm">Prinsip Kerahasiaan</p>
                <p className="text-emerald-700 text-xs font-bold leading-relaxed">Semua dokumen dalam alur ini dikelola secara rahasia dan profesional melalui sistem Jurnal BK Pro untuk melindungi privasi peserta didik.</p>
            </div>
        </div>
      </div>
    </div>
  );

  const mechanismContent = {
    organisasi: {
      title: 'STRUKTUR ORGANISASI BK',
      subtitle: 'Skema Hubungan Kerja Personel Sekolah',
      icon: <Network className="w-6 h-6" />,
      color: 'blue',
      component: <OrganizationStructure />
    },
    penanganan: {
      title: 'PENANGANAN BERMASALAH',
      subtitle: 'Alur Kolaborasi Resolusi Kasus Siswa',
      icon: <GitMerge className="w-6 h-6" />,
      color: 'rose',
      component: <ProblemStudentHandling />
    },
    kerja: {
      title: 'MEKANISME KERJA BK',
      subtitle: 'SOP Dokumentasi Administrasi Bimbingan',
      icon: <Workflow className="w-6 h-6" />,
      color: 'emerald',
      component: <WorkMechanismDiagram />
    }
  };

  const current = mechanismContent[activeType];

  return (
    <div className="space-y-10 animate-fade-in text-left pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 px-4">
        <div className="flex items-center gap-5">
           <button onClick={() => setView(ViewMode.HOME)} className="p-3 bg-slate-100/50 rounded-2xl border border-primary/50 hover:bg-slate-100 transition-all group shadow-lg">
             <ArrowLeft className="w-6 h-6 text-primary group-hover:-translate-x-1 transition-transform" />
           </button>
           <div>
              <p className="label-luxe text-primary font-black text-[9px]">PANDUAN OPERASIONAL</p>
              <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none">Mekanisme <span className="text-primary font-light italic lowercase">Kerja BK</span></h2>
           </div>
        </div>
        
        <div className="flex gap-4">
           <button onClick={() => setView(ViewMode.SETTINGS)} className="bg-white border border-slate-200 hover:bg-slate-100 text-primary px-6 py-3.5 rounded-2xl font-black text-[9px] flex items-center gap-3 shadow-xl transition-all uppercase tracking-widest">
             <Layout className="w-4 h-4" /> Ganti Lampiran
           </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 px-4">
        {(Object.keys(mechanismContent) as MechanismType[]).map((type) => (
          <button
            key={type}
            onClick={() => handleTypeChange(type)}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all ${
              activeType === type 
                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                : 'bg-white/70 text-slate-500 hover:text-slate-600 border border-slate-200'
            }`}
          >
            {mechanismContent[type].icon} {mechanismContent[type].title}
          </button>
        ))}
      </div>

      <div className="mx-4">
         <div className="glass-card rounded-[3rem] border border-primary/10 overflow-hidden bg-white/60 p-10 flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-8 border-b border-slate-200 pb-6">
               <div>
                  <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter italic leading-none">{current.title}</h3>
                  <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-2">{current.subtitle}</p>
               </div>
               <button 
                onClick={() => setIsPreviewOpen(true)}
                className="flex items-center gap-2 text-[9px] font-black text-primary uppercase tracking-widest hover:text-slate-800 transition-colors"
               >
                 <Eye className="w-4 h-4" /> Perbesar Preview
               </button>
            </div>

            <div 
              className="relative w-full bg-white rounded-[2rem] overflow-hidden border border-slate-200 group cursor-pointer shadow-2xl"
              onClick={() => setIsPreviewOpen(true)}
            >
               <div className="scale-[0.5] md:scale-[0.7] lg:scale-100 origin-top">
                  {current.component}
               </div>
               <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-primary px-6 py-3 rounded-xl text-[10px] font-black uppercase text-white shadow-2xl">Lihat Fullscreen</div>
               </div>
            </div>
         </div>
      </div>

      {isPreviewOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-10">
           <div className="absolute inset-0 bg-slate-50/95 backdrop-blur-xl" onClick={() => setIsPreviewOpen(false)} />
           <div className="relative w-full max-w-7xl h-full flex flex-col bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-3xl animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-slate-200 flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary rounded-xl text-white">{current.icon}</div>
                    <div>
                       <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">{current.title}</h3>
                       <p className="text-[10px] text-primary uppercase font-black tracking-widest">{current.subtitle}</p>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => setIsPreviewOpen(false)} className="p-4 hover:bg-white/10 rounded-2xl text-rose-500 transition-all"><X className="w-6 h-6" /></button>
                 </div>
              </div>
              <div className="flex-1 overflow-auto bg-slate-200 p-4 md:p-12 flex justify-center items-start scroll-hide">
                 <div className="bg-white shadow-2xl border border-slate-300 w-full min-h-full">
                    {current.component}
                 </div>
              </div>
           </div>
        </div>
      )}




    </div>
  );
};

export default WorkMechanism;
