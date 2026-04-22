import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Sparkles, Loader2, ArrowLeft } from 'lucide-react';
import { ViewMode } from '../types';

interface StrategyGeneratorProps {
  setView: (view: ViewMode) => void;
}

const StrategyGenerator: React.FC<StrategyGeneratorProps> = ({ setView }) => {
  const [problem, setProblem] = useState('');
  const [strategy, setStrategy] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const generateStrategy = async () => {
    if (!problem) {
      setError('Mohon deskripsikan masalah siswa terlebih dahulu.');
      return;
    }
    setIsLoading(true);
    setError('');
    setStrategy('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Anda adalah seorang konselor sekolah yang berpengalaman. Berikan strategi bimbingan dan konseling yang komprehensif untuk siswa dengan masalah berikut: "${problem}". Sertakan: 1. Analisis singkat masalah. 2. Pendekatan utama (misalnya, CBT, realitas, dll.). 3. Langkah-langkah konkret untuk beberapa sesi konseling. 4. Pertanyaan kunci untuk diajukan kepada siswa. 5. Potensi tantangan dan cara mengatasinya. 6. Saran tindak lanjut dan kolaborasi dengan pihak lain (orang tua/wali kelas). Format jawaban dalam bentuk markdown.`;
      
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      
      setStrategy(response.text || 'Tidak ada strategi yang dihasilkan.');
    } catch (err) {
      console.error(err);
      setError('Gagal menghasilkan strategi. Silakan coba lagi.');
    }
    setIsLoading(false);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <button onClick={() => setView(ViewMode.STRATEGY_HUB)} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-500 hover:text-primary dark:hover:text-primary mb-6">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Laporan
      </button>
      <div className="bg-white dark:bg-slate-100 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-300">
        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-800">AI Strategy Generator</h2>
        <p className="text-slate-500 dark:text-slate-500 mb-6">Deskripsikan masalah atau tantangan yang dihadapi siswa untuk mendapatkan rekomendasi strategi konseling dari AI.</p>
        
        <textarea
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          placeholder="Contoh: Siswa kelas 8 sering tidak mengerjakan PR, terlihat lesu di kelas, dan dilaporkan sering menyendiri oleh teman-temannya."
          className="w-full h-32 p-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-200 focus:ring-2 focus:ring-primary outline-none transition"
        />
        
        <button 
          onClick={generateStrategy} 
          disabled={isLoading}
          className="w-full mt-4 bg-primary text-white font-semibold py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:bg-primary/50"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {isLoading ? 'Menghasilkan...' : 'Generate Strategi'}
        </button>

        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}

        {strategy && (
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-300">
            <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-800">Rekomendasi Strategi</h3>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {strategy.split('\n').map((line, i) => <p key={i}>{line}</p>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StrategyGenerator;
