import React, { useState } from 'react';
import { ArrowRight, HeartHandshake, Lock, Eye, EyeOff, AlertCircle, User, CheckCircle2, Sparkles, BarChart3, BookOpen, ShieldCheck, Mail, LogIn, UserPlus } from 'lucide-react';
import { TeacherData } from '../types';
import { formatAcademicTitle } from '../src/lib/nameFormatter';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '../src/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

type ViewState = 'intro' | 'login' | 'register' | 'offline';

const WelcomeScreen: React.FC<{ onEnter: () => void; teacherData: TeacherData; onOpenGuide: () => void; }> = ({ onEnter, teacherData, onOpenGuide }) => {
  const [viewState, setViewState] = useState<ViewState>('intro');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleOfflineLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (password === 'pedulisiswa' || password === teacherData?.accessPassword) {
      onEnter();
      setErrorMsg('');
    } else {
      setErrorMsg('Password Offline Salah!');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const handleCloudAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      setErrorMsg("Koneksi ke sistem cloud gagal. Coba Akses Offline.");
      return;
    }
    
    setIsLoading(true);
    setErrorMsg('');
    try {
      if (viewState === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const newTeacherData = {
          name: fullName,
          school: schoolName,
          nip: cred.user.uid,
          accessPassword: password, // Store same password to unlock Settings
          approved: false, // Default to unapproved
          schoolAddress: '',
          academicYear: '2023/2024',
          city: '',
          lastSync: new Date().toISOString()
        };
        await setDoc(doc(db, "teachers", cred.user.uid, "profile", "data"), newTeacherData);
        onEnter();
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const docRef = doc(db, "teachers", cred.user.uid, "profile", "data");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().approved !== true && cred.user.email !== "PURNOMOWIWIT@gmail.com") {
          setErrorMsg("Akun sedang menunggu persetujuan admin.");
          await auth.signOut();
        } else {
          onEnter();
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('Email sudah terdaftar. Silakan login.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setErrorMsg('Email atau password salah.');
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg('Password terlalu lemah (minimal 6 karakter).');
      } else {
        setErrorMsg('Gagal terhubung ke Cloud.');
      }
      setTimeout(() => setErrorMsg(''), 5000);
    } finally {
      setIsLoading(false);
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
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 bg-slate-50 relative">
        <AnimatePresence mode="wait">
          {viewState === 'intro' && (
            <motion.div 
              key="intro"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center space-y-8 max-w-sm w-full"
            >
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" />
                  Sistem Multi-Pengguna Terintegrasi
                </div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Siap Memulai Hari Ini?</h2>
                <p className="text-sm text-slate-500">Masuk untuk mengelola data siswa Anda sendiri dengan aman.</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setViewState('login')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 group"
                >
                  <LogIn className="w-5 h-5" />
                  MASUK AKUN CLOUD
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform ml-1" />
                </button>
                
                <button
                  onClick={() => setViewState('register')}
                  className="w-full bg-white hover:bg-blue-50 text-blue-600 border-2 border-blue-100 hover:border-blue-200 font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-5 h-5" />
                  DAFTAR AKUN BARU
                </button>

                <div className="pt-4 border-t border-slate-200 mt-6 relative">
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-slate-50 px-3 text-[10px] font-bold text-slate-400">Atau</span>
                  <button
                    onClick={() => setViewState('offline')}
                    className="w-full text-slate-500 hover:text-slate-800 font-bold py-3 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    Buka Akses Offline (Lokal)
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2 pt-4">
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
          )}
          {(viewState === 'login' || viewState === 'register') && (
            <motion.div 
              key="cloud_auth"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-sm bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-blue-900/10 border border-slate-100"
            >
              <button 
                onClick={() => setViewState('intro')}
                className="text-[10px] font-bold text-slate-400 hover:text-blue-600 mb-6 flex items-center gap-1 transition-colors"
              >
                <ChevronLeft className="w-3 h-3" /> KEMBALI
              </button>

              <div className="mb-8">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">{viewState === 'register' ? 'Daftar Akun Baru' : 'Masuk ke Cloud'}</h2>
                <p className="text-xs text-slate-500 mt-1">{viewState === 'register' ? 'Buat profil akun untuk mengelola data siswa pribadi.' : 'Masukkan email dan password untuk melanjutkan.'}</p>
              </div>

              <form onSubmit={handleCloudAuth} className="space-y-4">
                {viewState === 'register' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Dr. Budi Santoso, M.Pd"
                          className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-500 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-slate-800 outline-none transition-all shadow-inner"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Instansi / Sekolah</label>
                      <div className="relative">
                        <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input
                          type="text"
                          required
                          value={schoolName}
                          onChange={(e) => setSchoolName(e.target.value)}
                          placeholder="SMP Negeri 1 Contoh"
                          className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-500 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-slate-800 outline-none transition-all shadow-inner"
                        />
                      </div>
                    </div>
                  </>
                )}
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@sekolah.sch.id"
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-500 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-slate-800 outline-none transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password {viewState === 'register' ? 'Sistem' : ''}</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-500 rounded-2xl pl-11 pr-12 py-3 text-sm font-bold text-slate-800 outline-none transition-all shadow-inner"
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

                {errorMsg && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 text-rose-500 bg-rose-50 p-3 rounded-xl border border-rose-100"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-[10px] font-bold tracking-wider leading-tight">{errorMsg}</span>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-bold py-3 mt-2 rounded-2xl transition-all shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isLoading ? 'MEMPROSES...' : viewState === 'register' ? 'DAFTAR SEKARANG' : 'MASUK SEKARANG'}
                </button>
              </form>
            </motion.div>
          )}

          {viewState === 'offline' && (
            <motion.div 
              key="offline_auth"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-sm bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-blue-900/10 border border-slate-100"
            >
              <button 
                onClick={() => setViewState('intro')}
                className="text-[10px] font-bold text-slate-400 hover:text-blue-600 mb-6 flex items-center gap-1 transition-colors"
              >
                <ChevronLeft className="w-3 h-3" /> KEMBALI
              </button>

              <div className="mb-8">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Verifikasi Akses</h2>
                <p className="text-xs text-slate-500 mt-1">Masukkan password lokal untuk melanjutkan ke sistem secara offline.</p>
              </div>

              <form onSubmit={handleOfflineLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password Offline</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full bg-slate-50 border-2 ${errorMsg ? 'border-rose-400' : 'border-slate-100 focus:border-blue-500'} rounded-2xl pl-11 pr-12 py-3 text-sm font-bold text-slate-800 outline-none transition-all shadow-inner`}
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

                {errorMsg && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 text-rose-500 bg-rose-50 p-3 rounded-xl border border-rose-100"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-[10px] font-bold tracking-wider leading-tight">{errorMsg}</span>
                  </motion.div>
                )}

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 mt-2 rounded-2xl transition-all shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-[0.98]"
                >
                  AKSES LOKAL
                </button>
              </form>
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
