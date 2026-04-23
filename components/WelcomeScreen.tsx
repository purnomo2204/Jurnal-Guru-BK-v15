import React, { useState } from 'react';
import { ArrowRight, HeartHandshake, Lock, Eye, EyeOff, AlertCircle, User, CheckCircle2, Sparkles, BarChart3, BookOpen, ShieldCheck, HelpCircle } from 'lucide-react';
import { TeacherData } from '../types';
import { formatAcademicTitle } from '../src/lib/nameFormatter';
import { motion, AnimatePresence } from 'framer-motion';

const WelcomeScreen: React.FC<{ onEnter: () => void; teacherData: TeacherData; onOpenGuide: () => void; }> = ({ onEnter, teacherData, onOpenGuide }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (password === 'pedulisiswa') {
      onEnter();
      setError(false);
    } else {
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
  };

  const features = [
    {
      icon: <BarChart3 className="w-5 h-5 text-blue-500" />,
      title: "Administrasi Digital",
      desc: "Pencatatan jurnal, konseling, dan bimbingan secara terintegrasi."
    },
    {
      icon: <Sparkles className="w-5 h-5 text-amber-500" />,
      title: "Analisis Otomatis",
      desc: "Laporan bulanan dan grafik perkembangan siswa yang akurat."
    },
    {
      icon: <BookOpen className="w-5 h-5 text-emerald-500" />,
      title: "Hub Strategi",
      desc: "Akses teknik konseling, teori, dan ide ice breaking kreatif."
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-indigo-500" />,
      title: "Peta Kerawanan",
      desc: "Pemetaan masalah siswa secara visual untuk intervensi tepat."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans overflow-hidden">
      {/* Left Section: Info & Branding */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 p-8 md:p-12 flex flex-col justify-center text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400 rounded-full blur-[100px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative z-10"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl">
              <HeartHandshake className="w-10 h-10 text-blue-300" />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter leading-none">
                <span className="text-sky-300">JURNAL GURU</span> <span className="text-blue-400">BK PRO</span>
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-blue-200/80 mt-1">Professional Counseling System</p>
            </div>
          </div>

          <div className="space-y-6 max-w-md">
            <div>
              <h2 className="text-lg font-bold text-blue-100 mb-2">Tujuan Utama</h2>
              <p className="text-sm text-blue-100/70 leading-relaxed">
                Memberdayakan Guru Bimbingan Konseling dengan alat digital yang modern, efisien, dan profesional untuk mendukung perkembangan optimal setiap siswa melalui manajemen data yang cerdas.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((f, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + (i * 0.1) }}
                  className="p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="mb-2">{f.icon}</div>
                  <h3 className="text-xs font-bold text-white mb-1">{f.title}</h3>
                  <p className="text-[10px] text-blue-100/60 leading-tight">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Section: Login/Enter */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 bg-slate-50">
        <AnimatePresence mode="wait">
          {!showLogin ? (
            <motion.div 
              key="intro"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center space-y-8 max-w-sm"
            >
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" />
                  Selamat Datang Kembali
                </div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Siap Memulai Hari Ini?</h2>
                <p className="text-sm text-slate-500">Kelola administrasi BK Anda dengan lebih mudah dan menyenangkan.</p>
              </div>

              <div className="p-6 bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-slate-100">
                <div className="flex flex-col items-center mb-6">
                  {teacherData?.photo ? (
                    <img 
                      src={teacherData.photo} 
                      alt="Foto Guru" 
                      className="w-32 h-32 object-cover rounded-full border-4 border-white shadow-lg mb-4"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-blue-50 rounded-full border-4 border-white shadow-lg mb-4 flex items-center justify-center text-blue-400">
                       <User className="w-16 h-16" />
                    </div>
                  )}
                  <h3 className="text-lg font-bold text-slate-800">{formatAcademicTitle(teacherData?.name || 'Bapak/Ibu Guru BK')}</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1 text-center">{teacherData?.school || 'Instansi Pendidikan'}</p>
                </div>

                <button
                  onClick={() => setShowLogin(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 group"
                >
                  MULAI SEKARANG
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="flex flex-col items-center gap-2">
                <img 
                  src="https://lh3.googleusercontent.com/d/1UNix_IGpjmt2q0apsIQy-6s3Zr9SnLJ9" 
                  alt="Logo" 
                  className="h-8 w-auto object-contain opacity-60"
                  referrerPolicy="no-referrer"
                />
                <p className="text-[8px] text-slate-400 font-bold tracking-widest">
                  dutatama@gmail.com
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-sm bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-blue-900/10 border border-slate-100"
            >
              <button 
                onClick={() => setShowLogin(false)}
                className="text-[10px] font-bold text-slate-400 hover:text-blue-600 mb-6 flex items-center gap-1 transition-colors"
              >
                <ChevronLeft className="w-3 h-3" /> KEMBALI
              </button>

              <div className="mb-8">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Verifikasi Akses</h2>
                <p className="text-xs text-slate-500 mt-1">Masukkan password untuk melanjutkan ke dashboard.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password Sistem</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full bg-slate-50 border-2 ${error ? 'border-rose-400' : 'border-slate-100 focus:border-blue-500'} rounded-2xl pl-11 pr-12 py-3 text-sm font-bold text-slate-800 outline-none transition-all shadow-inner`}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 text-rose-500 bg-rose-50 p-3 rounded-xl border border-rose-100"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Password Salah!</span>
                  </motion.div>
                )}

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-2xl transition-all shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-[0.98]"
                >
                  KONFIRMASI & MASUK
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">Versi Pro 1.0</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Helper component for back button
const ChevronLeft = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

export default WelcomeScreen;
