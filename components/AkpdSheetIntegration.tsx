import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sheet, X } from 'lucide-react';

interface AkpdSheetIntegrationProps {
  isOpen: boolean;
  onClose: () => void;
}

const AkpdSheetIntegration: React.FC<AkpdSheetIntegrationProps> = ({ isOpen, onClose }) => {
  const [akpdSheetUrl, setAkpdSheetUrl] = useState(() => localStorage.getItem('guru_bk_akpd_sheet_url') || '');
  const [akpdImageUrl, setAkpdImageUrl] = useState(() => localStorage.getItem('guru_bk_akpd_image_url') || '');
  const [tempSheetUrl, setTempSheetUrl] = useState(akpdSheetUrl);

  useEffect(() => {
    localStorage.setItem('guru_bk_akpd_sheet_url', akpdSheetUrl);
  }, [akpdSheetUrl]);

  useEffect(() => {
    localStorage.setItem('guru_bk_akpd_image_url', akpdImageUrl);
  }, [akpdImageUrl]);

  const handleSaveSheetUrl = async () => {
    if (tempSheetUrl && tempSheetUrl.includes('/exec')) {
      setAkpdSheetUrl(tempSheetUrl);
      setAkpdImageUrl('');
      onClose();
    } else {
      alert('URL tidak valid. Sedang membuat gambar placeholder...');
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              {
                text: 'A professional placeholder image for an invalid Google Sheet link for AKPD data.',
              },
            ],
          },
        });
        
        if (response.candidates && response.candidates[0].content.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              const base64EncodeString: string = part.inlineData.data;
              const imageUrl = `data:image/png;base64,${base64EncodeString}`;
              setAkpdImageUrl(imageUrl);
              setAkpdSheetUrl(tempSheetUrl); // Save the invalid URL too
              break;
            }
          }
        }
        onClose();
      } catch (error) {
        console.error('Error generating image:', error);
        alert('Gagal membuat gambar placeholder.');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-50/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-[3rem] shadow-2xl max-w-2xl w-full p-10 space-y-8 relative border border-slate-200 overflow-y-auto max-h-[90vh]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-3xl -mr-32 -mt-32 rounded-full" />
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-500 hover:text-slate-800 transition-all z-10">
          <X className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-5 relative">
          <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30">
            <Sheet className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Integrasi Google Sheet AKPD</h3>
            <p className="text-xs text-slate-500 font-medium">Sinkronisasikan hasil AKPD siswa ke Google Sheet secara otomatis.</p>
          </div>
        </div>

        <div className="space-y-5 text-sm text-slate-600 relative">
          <p className="font-black text-emerald-400 uppercase text-[10px] tracking-widest">Langkah-langkah Integrasi:</p>
          <ol className="space-y-4">
            {[
              { text: "Buat Salinan & Izinkan Akses", desc: "Buka tautan Template Google Sheet AKPD, klik 'Buat Salinan'. Gunakan menu 'Jurnal BK' untuk mengizinkan akses." },
              { text: "Deploy sebagai Aplikasi Web", desc: "Klik Ekstensi > Apps Script > Deploy > Deployment baru. Pilih 'Aplikasi Web', atur akses ke 'Siapa saja'." },
              { text: "Salin & Tempel URL", desc: "Salin 'URL Aplikasi Web' yang muncul dan tempelkan pada kolom di bawah ini." }
            ].map((step, i) => (
              <li key={i} className="flex gap-4 p-4 bg-slate-50/40 rounded-2xl border border-slate-200">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-emerald-400 font-black text-xs shrink-0">{i+1}</div>
                <div>
                  <p className="font-bold text-slate-800 text-xs uppercase tracking-wide mb-1">{step.text}</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-3 relative">
          <label htmlFor="sheet-url" className="label-luxe ml-1">URL Aplikasi Web Anda</label>
          <input 
            id="sheet-url"
            type="text" 
            value={tempSheetUrl}
            onChange={e => setTempSheetUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/.../exec"
            className="w-full p-5 text-sm input-cyber rounded-2xl outline-none focus:border-primary transition-all"
          />
        </div>

        <div className="flex justify-end gap-4 relative">
          <button onClick={onClose} className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 rounded-xl transition-all">
            Batal
          </button>
          <button onClick={async () => {
            if (!tempSheetUrl || !tempSheetUrl.includes('/exec')) {
              alert('Masukkan URL yang valid terlebih dahulu.');
              return;
            }
            try {
              const response = await fetch(`${tempSheetUrl}?t=${Date.now()}`, { method: 'GET', mode: 'cors' });
              if (response.ok) {
                alert('Koneksi berhasil!');
              } else {
                alert('Koneksi gagal. Server merespon error.');
              }
            } catch (err) {
              alert('Koneksi gagal (CORS/URL). Pastikan Apps Script sudah di-Deploy sebagai "Web App" dengan akses "Anyone".');
            }
          }} className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-600/10 border border-emerald-500/30 rounded-xl shadow-lg hover:bg-emerald-600 hover:text-white transition-all">
            Test Koneksi
          </button>
          <button onClick={handleSaveSheetUrl} className="px-10 py-4 text-[10px] font-black uppercase tracking-widest text-white bg-blue-600/20 border border-blue-500/30 rounded-xl shadow-2xl hover:bg-blue-600 transition-all">
            Simpan & Aktifkan
          </button>
        </div>
      </div>
    </div>
  );
};

export default AkpdSheetIntegration;
