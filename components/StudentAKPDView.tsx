import React, { useState, useMemo, useEffect } from 'react';
import { Student, AKPDResponse, AKPDQuestion } from '../types';
import { AKPD_QUESTIONS } from '../constants';
import { Check, X, ChevronRight, ChevronLeft, ClipboardCheck, User, Search, Loader2, Info, Sheet } from 'lucide-react';
import AkpdSheetIntegration from './AkpdSheetIntegration';

interface StudentAKPDViewProps {
  students: Student[];
  akpdQuestions?: AKPDQuestion[];
  onSubmit: (r: AKPDResponse) => Promise<void>;
}



const StudentAKPDView: React.FC<StudentAKPDViewProps> = ({ students: propStudents, akpdQuestions, onSubmit }) => {
  const currentQuestions = akpdQuestions && akpdQuestions.length > 0 ? akpdQuestions : AKPD_QUESTIONS;
  const students = propStudents || [];
  const [step, setStep] = useState<'select' | 'questions' | 'success'>('select');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [responses, setResponses] = useState<(boolean | undefined)[]>(new Array(AKPD_QUESTIONS.length).fill(undefined));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [filteredStudentsByClass, setFilteredStudentsByClass] = useState<Student[]>([]);
  const [showSheetModal, setShowSheetModal] = useState(false);

  const classes = useMemo(() => {
    return Array.from(new Set((students || []).map(s => s.className))).sort();
  }, [students]);

  useEffect(() => {
    if (selectedClass && students) {
      setFilteredStudentsByClass(students.filter(s => s.className === selectedClass));
    } else {
      setFilteredStudentsByClass([]);
    }
    // Only reset student selection if it's not already set by URL params
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.get('nama')) {
      setSelectedStudentId('');
    }
  }, [selectedClass, students]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const nama = urlParams.get('nama');
    const kelas = urlParams.get('kelas');

    if (nama && kelas) {
      setSelectedClass(kelas);
      const student = students.find(s => s.name.toLowerCase() === nama.toLowerCase() && s.className === kelas);
      if (student) {
        setSelectedStudentId(student.id);
      }
    }
  }, [students]);



  const handleNext = () => {
    if (currentIdx < currentQuestions.length - 1) setCurrentIdx(currentIdx + 1);
  };

  const handlePrev = () => {
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
  };

  const handleResponse = (val: boolean) => {
    const newRes = [...responses];
    newRes[currentIdx] = val;
    setResponses(newRes);
    if (currentIdx < currentQuestions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        id: Date.now().toString(),
        studentId: selectedStudentId,
        date: new Date().toISOString().split('T')[0],
        responses: responses.map(r => r === true) // Ensure boolean
      });
      setStep('success');
    } catch (error) {
      alert('Gagal mengirim data. Pastikan koneksi internet stabil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-sm w-full bg-white p-5 rounded-[1.5rem] shadow-xl border border-emerald-100 animate-scale-in">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClipboardCheck className="w-6 h-6 text-emerald-600" />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tighter">Terima Kasih!</h2>
          <p className="text-xs text-slate-500 mb-4 font-medium">Jawaban angket kamu berhasil dikirim ke Guru BK. Kamu bisa menutup halaman ini sekarang.</p>
          <div className="h-1 w-10 bg-emerald-500 mx-auto rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 flex flex-col items-center">
      <div className="max-w-3xl w-full space-y-8">
        <div className="text-center space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Bimbingan & Konseling</p>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            Angket <span className="text-primary italic font-light">AKPD</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium">Silakan isi angket ini dengan jujur sesuai keadaan dirimu.</p>
          <button 
            onClick={() => setShowSheetModal(true)}
            className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black hover:bg-emerald-600 transition-all shadow-sm uppercase tracking-widest flex items-center gap-2 mx-auto"
          >
            <Sheet className="w-3 h-3" /> Integrasi Google Sheet
          </button>
        </div>

        {students.length === 0 ? (
          <div className="bg-white p-6 rounded-[1.5rem] shadow-lg border border-slate-100 flex flex-col items-center justify-center space-y-2 animate-pulse">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <p className="text-xs text-slate-500 font-bold">Mengambil data siswa dari Cloud...</p>
          </div>
        ) : step === 'select' ? (
          <div className="bg-white p-4 md:p-6 rounded-[1.5rem] shadow-lg border border-slate-100 space-y-4 animate-fade-in">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-2 rounded-r-lg">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-500" />
                <div>
                  <h4 className="text-xs font-bold text-blue-800">Panduan Pengisian</h4>
                  <p className="text-[10px] text-blue-600">Cari namamu berdasarkan Kelas dan Nomor Absen, lalu klik tombol 'Mulai'.</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Identitas Siswa
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value)}
                  className="w-full p-2 text-xs bg-blue-950 text-slate-800 border border-blue-800 rounded-lg outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                >
                  <option value="">-- Pilih Kelas --</option>
                  {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                  value={selectedStudentId}
                  onChange={e => setSelectedStudentId(e.target.value)}
                  disabled={!selectedClass}
                  className="w-full p-2 text-xs bg-blue-950 text-slate-800 border border-blue-800 rounded-lg outline-none focus:ring-2 focus:ring-blue-400 transition-all disabled:bg-blue-900/50 disabled:text-slate-500"
                >
                  <option value="">-- Pilih Nama --</option>
                  {filteredStudentsByClass.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <input 
                  type="text" 
                  placeholder="Nomor Absen"
                  readOnly
                  value={students.find(s => s.id === selectedStudentId)?.attendanceNumber || ''}
                  className="w-full p-2 text-xs bg-blue-950 text-slate-800 border border-blue-800 rounded-lg outline-none focus:ring-2 focus:ring-blue-400 transition-all placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              <button 
                disabled={!selectedStudentId}
                onClick={() => setStep('questions')}
                className="w-full bg-primary text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
              >
                Mulai Mengisi Angket <ChevronRight className="w-4 h-4" />
              </button>
              <button 
                onClick={() => { setSelectedStudentId(''); setSelectedClass(''); }}
                className="w-full text-center text-xs text-slate-500 font-bold hover:text-primary transition-all"
              >
                Batal / Pilih Ulang
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white p-4 md:p-6 rounded-[1.5rem] shadow-lg border border-slate-100 space-y-5 animate-fade-in relative overflow-hidden">
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
              <div 
                className="h-full bg-primary transition-all duration-500 ease-out" 
                style={{ width: `${((currentIdx + 1) / currentQuestions.length) * 100}%` }}
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-[8px] font-black uppercase tracking-widest">
                Aspek: {currentQuestions[currentIdx]?.aspect}
              </span>
              <span className="text-[10px] font-black text-slate-600 tracking-widest">{currentIdx + 1} / {currentQuestions.length}</span>
            </div>

            <div className="min-h-[75px] flex items-center justify-center text-center">
              <h2 className="text-lg md:text-xl font-bold text-slate-800 leading-tight">
                {currentQuestions[currentIdx]?.text}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => handleResponse(true)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${responses[currentIdx] === true ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-md shadow-emerald-100' : 'bg-white border-slate-100 hover:border-emerald-200 text-slate-500'}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${responses[currentIdx] === true ? 'bg-emerald-500 text-white' : 'bg-slate-50'}`}>
                  <Check className="w-3 h-3" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest">Ya</span>
              </button>
              <button 
                onClick={() => handleResponse(false)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${responses[currentIdx] === false && responses[currentIdx] !== undefined ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-md shadow-rose-100' : 'bg-white border-slate-100 hover:border-rose-200 text-slate-500'}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${responses[currentIdx] === false ? 'bg-rose-500 text-white' : 'bg-slate-50'}`}>
                  <X className="w-3 h-3" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest">Tidak</span>
              </button>
            </div>

            <div className="flex justify-between items-center pt-3">
              <button 
                disabled={currentIdx === 0}
                onClick={handlePrev}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Kembali
              </button>

              {currentIdx === currentQuestions.length - 1 ? (
                <button 
                  disabled={isSubmitting || responses[currentIdx] === undefined}
                  onClick={handleSubmit}
                  className="bg-primary text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center gap-2 animate-pulse disabled:opacity-50 disabled:animate-none"
                >
                  {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <ClipboardCheck className="w-3 h-3" />}
                  Kirim Jawaban
                </button>
              ) : (
                <button 
                  disabled={responses[currentIdx] === undefined}
                  onClick={handleNext}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-all disabled:opacity-30"
                >
                  Lanjut <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      {showSheetModal && (
        <AkpdSheetIntegration isOpen={showSheetModal} onClose={() => setShowSheetModal(false)} />
      )}
    </div>
  );
};

export default StudentAKPDView;
