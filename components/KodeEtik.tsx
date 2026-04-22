import React, { useState, useEffect } from 'react';
import { Edit2, Download, Save, X, Shield } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

const DEFAULT_KODE_ETIK = `KODE ETIK PROFESI BIMBINGAN DAN KONSELING INDONESIA

BAB I: KUALIFIKASI DAN KEGIATAN PROFESIONAL KONSELOR
1. Konselor wajib terus menerus mengembangkan dan menguasai dirinya.
2. Konselor wajib memperlihatkan sifat-sifat kepribadian yang tangguh, toleran, dan dapat dipercaya.
3. Konselor wajib menangani klien dengan penuh tanggung jawab.

BAB II: HUBUNGAN DENGAN KLIEN
1. Konselor wajib menghormati harkat, martabat, dan keunikan klien.
2. Konselor wajib menempatkan kepentingan klien di atas kepentingan pribadi.
3. Konselor tidak diperkenankan melakukan diskriminasi terhadap klien.
4. Konselor wajib menjaga kerahasiaan data dan informasi klien.

BAB III: HUBUNGAN DENGAN TEMAN SEJAWAT
1. Konselor wajib membangun hubungan yang kooperatif dan saling menghargai dengan teman sejawat.
2. Konselor wajib saling berbagi pengetahuan dan pengalaman untuk peningkatan mutu layanan.

BAB IV: HUBUNGAN DENGAN LEMBAGA DAN PIHAK LAIN
1. Konselor wajib mematuhi peraturan dan kebijakan lembaga tempat bekerja.
2. Konselor wajib menjalin kerja sama yang baik dengan pihak-pihak terkait demi kepentingan klien.

BAB V: PELANGGARAN KODE ETIK
1. Pelanggaran terhadap kode etik akan dikenakan sanksi sesuai dengan ketentuan yang berlaku.
2. Sanksi dapat berupa teguran, peringatan, hingga pencabutan izin praktik.`;

const KodeEtik: React.FC = () => {
  const [content, setContent] = useState(() => {
    return localStorage.getItem('guru_bk_kode_etik') || DEFAULT_KODE_ETIK;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);

  useEffect(() => {
    localStorage.setItem('guru_bk_kode_etik', content);
  }, [content]);

  const handleSave = () => {
    setContent(editContent);
    setIsEditing(false);
    toast.success('Kode Etik berhasil diperbarui');
  };

  const handleCancel = () => {
    setEditContent(content);
    setIsEditing(false);
  };

  const downloadPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("KODE ETIK GURU BK", 105, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const splitText = doc.splitTextToSize(content, 170);
    
    // Handle pagination
    let yPos = 40;
    for (let i = 0; i < splitText.length; i++) {
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(splitText[i], 20, yPos);
      yPos += 7;
    }
    
    doc.save("Kode_Etik_Guru_BK.pdf");
    toast.success('PDF berhasil diunduh');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Kode Etik Guru BK</h1>
            <p className="text-xs text-slate-500">Pedoman perilaku dan etika profesional Bimbingan dan Konseling</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50 transition-colors text-xs font-bold uppercase tracking-wider"
              >
                <Edit2 className="w-3.5 h-3.5" />
                EDIT
              </button>
              <button
                onClick={downloadPdf}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-xs font-bold uppercase tracking-wider shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                DOWNLOAD
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50 transition-colors text-xs font-bold uppercase tracking-wider"
              >
                <X className="w-3.5 h-3.5" />
                BATAL
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-xs font-bold uppercase tracking-wider shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                SIMPAN
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {isEditing ? (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full h-[600px] p-6 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-sans text-sm text-slate-700 leading-relaxed"
            placeholder="Masukkan teks kode etik di sini..."
          />
        ) : (
          <div className="p-6 h-[600px] overflow-y-auto">
            <div className="prose prose-slate prose-sm max-w-none">
              {content.split('\n').map((line, index) => {
                if (line.startsWith('BAB') || line.startsWith('KODE ETIK')) {
                  return <h3 key={index} className="text-sm font-bold text-slate-800 mt-4 mb-2">{line}</h3>;
                }
                if (line.trim() === '') {
                  return <br key={index} />;
                }
                return <p key={index} className="text-xs text-slate-600 leading-relaxed mb-1.5">{line}</p>;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KodeEtik;
