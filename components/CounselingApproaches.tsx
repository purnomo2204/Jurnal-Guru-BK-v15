import React, { useState } from 'react';
import { BookOpen, Target, Lightbulb, Users, ArrowRight, Info, Search, Sparkles, X, Loader2, Book } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewMode } from '../types';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';

interface KeyConcept {
  name: string;
  explanation: string;
  example: string;
}

interface Approach {
  id: string;
  title: string;
  description: string;
  keyConcepts: KeyConcept[];
  goals: string;
  practiceExample: string;
  color: string;
}

const approaches: Approach[] = [
  {
    id: 'psychoanalysis',
    title: 'Psikoanalisis (Sigmund Freud)',
    description: 'Pendekatan yang berfokus pada pengaruh pikiran bawah sadar terhadap perilaku. Menekankan pada pengalaman masa kecil dan konflik internal.',
    keyConcepts: [
      { 
        name: 'Id, Ego, Superego', 
        explanation: 'Struktur kepribadian manusia. Id adalah insting dasar (prinsip kesenangan), Ego adalah penengah realitas, dan Superego adalah aspek moral/norma.', 
        example: 'Seseorang ingin mencuri karena lapar (Id), tahu itu salah (Superego), lalu memutuskan bekerja untuk membeli makanan (Ego).' 
      },
      { 
        name: 'Kesadaran & Ketidaksadaran', 
        explanation: 'Pikiran sadar adalah apa yang kita sadari saat ini, sedangkan ketidaksadaran berisi memori, keinginan, dan trauma yang ditekan namun sangat mempengaruhi perilaku.', 
        example: 'Ketakutan yang tidak beralasan pada air mungkin berasal dari trauma tenggelam di masa kecil yang sudah terlupakan secara sadar.' 
      },
      { 
        name: 'Mekanisme Pertahanan Diri', 
        explanation: 'Strategi psikologis yang digunakan ego secara tidak sadar untuk melindungi diri dari kecemasan akibat konflik internal.', 
        example: 'Proyeksi, yaitu menyalahkan orang lain atas kesalahan atau sifat buruk diri sendiri agar tidak merasa bersalah.' 
      },
      { 
        name: 'Transferensi', 
        explanation: 'Fenomena di mana konseli secara tidak sadar mengalihkan perasaan atau harapan terhadap orang penting di masa lalunya kepada konselor.', 
        example: 'Konseli mulai melihat konselor sebagai sosok ayah yang otoriter dan bereaksi dengan kemarahan yang sebenarnya ditujukan untuk ayahnya.' 
      }
    ],
    goals: 'Membawa konflik bawah sadar ke kesadaran agar dapat diselesaikan secara rasional.',
    practiceExample: 'Konselor membantu konseli mengeksplorasi mimpi atau ingatan masa kecil untuk memahami akar kecemasan saat ini.',
    color: 'bg-blue-600'
  },
  {
    id: 'behavioral',
    title: 'Behavioristik (Skinner, Pavlov)',
    description: 'Berfokus pada perilaku yang tampak dan bagaimana perilaku tersebut dipelajari melalui pengkondisian lingkungan.',
    keyConcepts: [
      { 
        name: 'Classical Conditioning', 
        explanation: 'Proses belajar melalui asosiasi stimulus lingkungan dengan stimulus alami yang terjadi secara berulang.', 
        example: 'Siswa merasa cemas setiap kali mendengar bel sekolah karena sering dihukum tepat setelah bel berbunyi.' 
      },
      { 
        name: 'Operant Conditioning', 
        explanation: 'Belajar melalui konsekuensi dari perilaku, baik berupa penguatan (hadiah) maupun hukuman.', 
        example: 'Siswa rajin belajar karena setiap mendapat nilai bagus ia diberi pujian dan hadiah oleh orang tuanya.' 
      },
      { 
        name: 'Reinforcement', 
        explanation: 'Penguatan perilaku agar terulang kembali melalui pemberian konsekuensi positif atau penghilangan konsekuensi negatif.', 
        example: 'Memberikan stiker bintang kepada siswa yang berhasil menjaga ketertiban di dalam kelas.' 
      },
      { 
        name: 'Punishment', 
        explanation: 'Pemberian konsekuensi negatif atau penghilangan konsekuensi positif untuk mengurangi frekuensi perilaku yang tidak diinginkan.', 
        example: 'Memberikan tugas tambahan atau teguran kepada siswa yang terlambat masuk kelas tanpa alasan.' 
      }
    ],
    goals: 'Menghilangkan perilaku maladaptif dan mempelajari perilaku baru yang lebih efektif.',
    practiceExample: 'Menggunakan teknik desensitisasi sistematis untuk membantu konseli mengatasi fobia ketinggian secara bertahap.',
    color: 'bg-emerald-600'
  },
  {
    id: 'humanistic',
    title: 'Humanistik / Person-Centered (Carl Rogers)',
    description: 'Menekankan pada potensi manusia untuk tumbuh dan mengarahkan diri sendiri. Konselor berperan sebagai fasilitator yang menyediakan iklim pertumbuhan.',
    keyConcepts: [
      { 
        name: 'Unconditional Positive Regard', 
        explanation: 'Penerimaan dan penghargaan tanpa syarat dari konselor terhadap konseli sebagai pribadi, tanpa menghakimi perilakunya.', 
        example: 'Konselor tetap menunjukkan sikap hangat dan menerima meskipun konseli mengaku telah melakukan kesalahan atau pelanggaran.' 
      },
      { 
        name: 'Empathy', 
        explanation: 'Kemampuan konselor untuk merasakan dunia internal konseli seolah-olah itu dunianya sendiri tanpa kehilangan identitas diri.', 
        example: '"Saya bisa merasakan betapa beratnya beban dan kesedihan yang Anda pikul saat ini setelah kehilangan pekerjaan tersebut."' 
      },
      { 
        name: 'Congruence', 
        explanation: 'Keaslian, kejujuran, dan keterbukaan konselor dalam hubungan konseling; tidak ada kepura-puraan atau topeng profesional.', 
        example: 'Konselor berani menunjukkan sisi manusianya dan mengakui jika ia merasa bingung atau tersentuh oleh cerita konseli.' 
      },
      { 
        name: 'Self-Actualization', 
        explanation: 'Kecenderungan alami manusia untuk mengembangkan semua potensinya guna mencapai kematangan dan fungsi yang penuh.', 
        example: 'Seseorang yang terus belajar hal baru dan berkarya demi kepuasan batin meskipun sudah sukses secara finansial.' 
      }
    ],
    goals: 'Membantu konseli menjadi lebih terbuka terhadap pengalaman dan lebih percaya pada diri sendiri.',
    practiceExample: 'Konselor mendengarkan dengan penuh penerimaan tanpa menghakimi, sehingga konseli merasa aman untuk mengeksplorasi perasaannya.',
    color: 'bg-amber-600'
  },
  {
    id: 'rebt',
    title: 'REBT (Rational Emotive Behavior Therapy)',
    description: 'Pendekatan kognitif yang menekankan bahwa masalah emosional disebabkan oleh pola pikir yang tidak rasional, bukan oleh peristiwa itu sendiri.',
    keyConcepts: [
      { 
        name: 'ABC Model', 
        explanation: 'A (Activating event), B (Belief), C (Consequence). Bukan peristiwa (A) yang menyebabkan emosi (C), tapi keyakinan kita (B) tentang peristiwa itu.', 
        example: 'Gagal ujian (A), berpikir "saya bodoh dan gagal" (B), merasa depresi dan putus asa (C).' 
      },
      { 
        name: 'Disputing Irrational Beliefs', 
        explanation: 'Proses kognitif untuk menantang, mendebat, dan mempertanyakan keyakinan yang tidak rasional atau tidak logis.', 
        example: 'Konselor bertanya: "Apa buktinya kalau satu kegagalan ujian berarti Anda adalah orang yang bodoh selamanya?".' 
      },
      { 
        name: 'Rational Beliefs', 
        explanation: 'Keyakinan yang logis, fleksibel, dan berbasis realitas yang membantu individu mencapai tujuan dan kesejahteraan emosional.', 
        example: '"Saya sangat kecewa gagal ujian, tapi ini bukan akhir dunia dan saya bisa belajar lebih giat untuk memperbaikinya."' 
      }
    ],
    goals: 'Mengubah keyakinan irasional menjadi keyakinan rasional untuk meningkatkan kesejahteraan emosional.',
    practiceExample: 'Menantang pikiran konseli "Saya harus sempurna dalam segala hal" dan menggantinya dengan "Saya ingin melakukan yang terbaik, tapi kegagalan adalah hal manusiawi".',
    color: 'bg-rose-600'
  },
  {
    id: 'gestalt',
    title: 'Gestalt (Fritz Perls)',
    description: 'Berfokus pada kesadaran saat ini (here and now) dan integrasi antara pikiran, perasaan, serta perilaku untuk mencapai keutuhan diri.',
    keyConcepts: [
      { 
        name: 'Kesadaran (Awareness)', 
        explanation: 'Menyadari apa yang dirasakan tubuh, dipikirkan, dan dilakukan pada saat ini juga tanpa melakukan penilaian.', 
        example: '"Apa yang Anda rasakan di bagian dada dan tenggorokan Anda saat menceritakan konflik dengan ibu Anda tadi?".' 
      },
      { 
        name: 'Urusan yang Belum Selesai', 
        explanation: 'Perasaan masa lalu yang tidak tuntas (marah, benci, cinta) yang menghambat fungsi individu pada saat ini.', 
        example: 'Kemarahan pada orang tua yang dipendam bertahun-tahun sehingga membuat konseli sulit percaya pada orang lain di masa kini.' 
      },
      { 
        name: 'Kontak', 
        explanation: 'Pertemuan atau interaksi antara individu dengan lingkungan atau orang lain tanpa kehilangan identitas diri yang unik.', 
        example: 'Berani menyatakan pendapat yang berbeda secara jujur dalam sebuah diskusi kelompok tanpa merasa terancam.' 
      },
      { 
        name: 'Eksperimen', 
        explanation: 'Aktivitas kreatif yang dirancang konselor untuk membantu konseli mengeksplorasi pengalaman baru secara langsung.', 
        example: 'Menggunakan teknik "Kursi Kosong" untuk membantu konseli berbicara dengan bagian dirinya yang merasa takut.' 
      }
    ],
    goals: 'Membantu konseli mencapai kesadaran penuh dan mengambil tanggung jawab atas hidupnya.',
    practiceExample: 'Menggunakan teknik "Kursi Kosong" untuk membantu konseli berbicara dengan orang yang memiliki konflik dengannya di masa lalu.',
    color: 'bg-indigo-600'
  },
  {
    id: 'sfbt',
    title: 'SFBT (Solution-Focused Brief Therapy)',
    description: 'Pendekatan yang berorientasi pada masa depan dan berfokus pada pembangunan solusi daripada analisis masalah.',
    keyConcepts: [
      { 
        name: 'Miracle Question', 
        explanation: 'Pertanyaan imajinatif untuk membantu konseli membayangkan masa depan di mana masalah sudah tidak ada lagi.', 
        example: '"Jika besok pagi masalah ini hilang secara ajaib saat Anda tidur, apa hal pertama yang akan Anda sadari berbeda?".' 
      },
      { 
        name: 'Scaling Questions', 
        explanation: 'Menggunakan skala 1-10 untuk membantu konseli mengukur kemajuan, motivasi, atau tingkat keparahan masalah secara subjektif.', 
        example: '"Pada skala 1 sampai 10, di mana 10 adalah sangat siap, seberapa siap Anda untuk mencoba langkah baru besok?".' 
      },
      { 
        name: 'Exception Questions', 
        explanation: 'Mencari waktu atau situasi di mana masalah tidak terjadi atau tidak terlalu berat untuk menemukan kekuatan konseli.', 
        example: '"Kapan terakhir kali Anda merasa sedikit lebih tenang atau bahagia meskipun masalah ini masih ada?".' 
      },
      { 
        name: 'Small Steps', 
        explanation: 'Fokus pada perubahan atau langkah kecil yang bisa dilakukan segera untuk membangun momentum keberhasilan.', 
        example: '"Apa satu hal kecil yang bisa Anda lakukan besok pagi untuk membuat hari Anda terasa sedikit lebih baik?".' 
      }
    ],
    goals: 'Membangun solusi yang efektif berdasarkan kekuatan dan sumber daya yang dimiliki konseli.',
    practiceExample: 'Bertanya kepada konseli: "Jika besok pagi terjadi keajaiban dan masalahmu selesai, apa hal pertama yang akan kamu sadari berbeda?"',
    color: 'bg-purple-600'
  },
  {
    id: 'trait-factor',
    title: 'Trait & Factor (E.G. Williamson)',
    description: 'Pendekatan yang berfokus pada kecocokan antara karakteristik individu (trait) dengan persyaratan pekerjaan (factor). Sangat populer dalam bimbingan karier.',
    keyConcepts: [
      { 
        name: 'Analisis Diri', 
        explanation: 'Proses memahami bakat, minat, kepribadian, dan nilai-nilai diri melalui tes psikologi dan observasi mendalam.', 
        example: 'Siswa mengikuti tes minat jabatan untuk mengetahui kecenderungan karier yang paling sesuai dengan kepribadiannya.' 
      },
      { 
        name: 'Analisis Pekerjaan', 
        explanation: 'Proses memahami persyaratan, tugas, lingkungan, dan peluang yang ada di berbagai bidang dunia kerja.', 
        example: 'Mencari tahu kualifikasi pendidikan, keterampilan teknis, dan prospek gaji yang dibutuhkan untuk menjadi seorang arsitek.' 
      },
      { 
        name: 'Matching', 
        explanation: 'Proses menghubungkan karakteristik diri yang unik dengan persyaratan pekerjaan yang paling sesuai untuk mencapai kepuasan.', 
        example: 'Memilih jurusan teknik karena memiliki bakat matematika yang tinggi dan minat yang besar pada konstruksi bangunan.' 
      },
      { 
        name: 'Keputusan Rasional', 
        explanation: 'Proses pengambilan keputusan yang didasarkan pada data objektif dan analisis logis, bukan sekadar emosi atau ikut-ikutan.', 
        example: 'Memilih sekolah berdasarkan akreditasi, fasilitas, dan kesesuaian kurikulum dengan minat, bukan sekadar ikut teman dekat.' 
      }
    ],
    goals: 'Membantu konseli memilih karier yang paling sesuai dengan potensi dirinya secara ilmiah.',
    practiceExample: 'Konselor menggunakan hasil tes minat bakat untuk membantu siswa memilih jurusan kuliah yang tepat.',
    color: 'bg-teal-600'
  },
  {
    id: 'cbt',
    title: 'Cognitive Behavior Therapy (CBT)',
    description: 'Pendekatan terstruktur yang berfokus pada hubungan antara pikiran, perasaan, dan perilaku untuk mengatasi berbagai masalah psikologis.',
    keyConcepts: [
      { 
        name: 'Kognisi', 
        explanation: 'Proses berpikir, keyakinan, dan cara individu memproses informasi yang sangat mempengaruhi emosi dan tindakannya.', 
        example: 'Berpikir "saya tidak berguna" akan membuat seseorang merasa sedih dan akhirnya menarik diri dari pergaulan sosial.' 
      },
      { 
        name: 'Distorsi Kognitif', 
        explanation: 'Pola pikir yang tidak akurat, bias, atau tidak logis yang seringkali menyebabkan penderitaan emosional.', 
        example: '"Catastrophizing", yaitu kecenderungan membayangkan skenario terburuk yang mungkin terjadi dari sebuah kejadian kecil.' 
      },
      { 
        name: 'Restrukturisasi Kognitif', 
        explanation: 'Teknik untuk mengidentifikasi, menantang, dan mengganti pikiran negatif otomatis dengan pikiran yang lebih seimbang.', 
        example: 'Mengganti pikiran "semua orang membenci saya" dengan "beberapa orang mungkin tidak setuju, tapi banyak juga yang mendukung saya".' 
      },
      { 
        name: 'Eksperimen Perilaku', 
        explanation: 'Menguji kebenaran pikiran negatif atau ketakutan melalui tindakan nyata di dunia luar untuk mendapatkan bukti baru.', 
        example: 'Seseorang yang takut ditolak mencoba menyapa orang baru untuk membuktikan apakah benar semua orang akan menolaknya.' 
      }
    ],
    goals: 'Mengubah pola pikir dan perilaku yang tidak sehat untuk meningkatkan kesejahteraan mental.',
    practiceExample: 'Konseli yang takut berbicara di depan umum diajak untuk mengidentifikasi pikiran negatif dan mengujinya dalam kelompok kecil.',
    color: 'bg-orange-600'
  },
  {
    id: 'reality-therapy',
    title: 'Reality Therapy (William Glasser)',
    description: 'Berfokus pada tanggung jawab pribadi dan pemenuhan kebutuhan dasar melalui pilihan-pilihan perilaku yang efektif di masa sekarang.',
    keyConcepts: [
      { 
        name: 'Teori Pilihan', 
        explanation: 'Keyakinan bahwa kita memilih semua perilaku kita (termasuk emosi) sebagai upaya terbaik untuk memenuhi kebutuhan dasar.', 
        example: 'Memilih untuk marah seringkali merupakan cara yang kita pilih untuk mencoba mengendalikan situasi atau orang lain.' 
      },
      { 
        name: 'Kebutuhan Dasar', 
        explanation: 'Lima kebutuhan genetik manusia: Bertahan hidup, kasih sayang (belonging), kekuasaan, kebebasan, dan kesenangan.', 
        example: 'Siswa yang membuat keributan di kelas mungkin sedang mencoba memenuhi kebutuhan akan kekuasaan atau kesenangan.' 
      },
      { 
        name: 'WDEP Model', 
        explanation: 'Wants (Keinginan), Doing (Tindakan), Evaluation (Evaluasi), Planning (Perencanaan). Kerangka kerja untuk mengevaluasi perilaku.', 
        example: '"Apa yang kamu inginkan? Apa yang kamu lakukan? Apakah itu berhasil? Apa rencana barumu yang lebih efektif?".' 
      },
      { 
        name: 'Tanggung Jawab', 
        explanation: 'Kemampuan untuk memenuhi kebutuhan diri sendiri tanpa mengganggu orang lain dalam memenuhi kebutuhan mereka.', 
        example: 'Mengakui bahwa nilai ujian yang jelek adalah akibat kurang belajar, bukan karena guru yang dianggap tidak adil.' 
      }
    ],
    goals: 'Membantu konseli membuat pilihan yang lebih baik untuk memenuhi kebutuhan mereka secara bertanggung jawab.',
    practiceExample: 'Konselor bertanya kepada siswa: "Apakah tindakan membolos ini membantu kamu mendapatkan apa yang kamu inginkan di masa depan?"',
    color: 'bg-sky-600'
  }
];

const CounselingApproaches: React.FC<{ setView: (v: ViewMode) => void }> = ({ setView }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<KeyConcept | null>(null);
  const [isLearningMore, setIsLearningMore] = useState(false);
  const [learningMoreContent, setLearningMoreContent] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const filteredApproaches = approaches.filter(a => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedApproach = approaches.find(a => a.id === selectedId);

  const handleLearnMore = async (approach: Approach) => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    setLearningMoreContent(null);
    setIsLearningMore(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Berikan penjelasan mendalam, profesional, dan komprehensif tentang pendekatan konseling: "${approach.title}". 
        
        Struktur penjelasan harus mencakup:
        1. **Sejarah & Filosofi Dasar**: Latar belakang kemunculan teori ini.
        2. **Tokoh-Tokoh Kunci**: Selain yang sudah disebutkan (${approach.title}), siapa lagi tokoh pentingnya?
        3. **Teknik-Teknik Spesifik**: Jelaskan 3-5 teknik praktis yang sering digunakan dalam pendekatan ini.
        4. **Aplikasi di Sekolah**: Bagaimana guru BK bisa menerapkan ini secara efektif untuk siswa?
        5. **Kelebihan & Keterbatasan**: Analisis kritis terhadap pendekatan ini.
        6. **Tips Praktis untuk Guru BK**: Langkah konkret untuk memulai.

        Gunakan Bahasa Indonesia yang formal, informatif, dan mudah dipahami oleh praktisi pendidikan. Gunakan format Markdown untuk struktur yang rapi.`,
      });

      setLearningMoreContent(response.text);
    } catch (error) {
      console.error("Error fetching deep dive:", error);
      setLearningMoreContent("Maaf, terjadi kesalahan saat mengambil data. Silakan coba lagi nanti.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-600" />
            Pendekatan <span className="text-blue-600 italic">Konseling</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1">Eksplorasi berbagai teori dan paradigma dalam praktik bimbingan konseling profesional.</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari pendekatan..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm font-medium"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredApproaches.map((approach) => (
          <motion.div 
            key={approach.id}
            layoutId={approach.id}
            onClick={() => setSelectedId(approach.id)}
            className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden flex flex-col"
            whileHover={{ y: -3 }}
          >
            <div className={`h-1.5 w-full ${approach.color}`} />
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <div className={`p-1.5 rounded-lg ${approach.color} bg-opacity-10 text-slate-900`}>
                  <Lightbulb className={`w-4 h-4 ${approach.color.replace('bg-', 'text-')}`} />
                </div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Teori Konseling</span>
              </div>
              
              <h3 className="text-sm font-black text-slate-900 mb-1.5 group-hover:text-blue-600 transition-colors leading-tight">
                {approach.title}
              </h3>
              
              <p className="text-[11px] text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                {approach.description}
              </p>

              <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                  Lihat Detail <ArrowRight className="w-2.5 h-2.5" />
                </span>
                <div className="flex -space-x-1.5">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-5 h-5 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center">
                      <Users className="w-2.5 h-2.5 text-slate-400" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedId && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setSelectedId(null); setSelectedConcept(null); }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            
            <motion.div 
              layoutId={selectedId}
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-white"
            >
              {selectedApproach && (
                <>
                  <div className={`h-3 w-full ${selectedApproach.color}`} />
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 
                          className="text-2xl font-black text-slate-900 tracking-tight cursor-help"
                          title={selectedApproach.description}
                        >
                          Pendekatan {selectedApproach.title} dalam Praktik BK
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded uppercase tracking-widest">Pendekatan</span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black rounded uppercase tracking-widest">Teori Utama</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => { setSelectedId(null); setSelectedConcept(null); }}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                      >
                        <ArrowRight className="w-5 h-5 rotate-180 text-slate-400" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <section>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                            <Info className="w-3 h-3" /> Deskripsi Umum
                          </h4>
                          <p className="text-sm text-slate-700 leading-relaxed font-medium">
                            {selectedApproach.description}
                          </p>
                        </section>

                        <section>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                            <Target className="w-3 h-3" /> Tujuan Utama
                          </h4>
                          <p className="text-sm text-slate-700 leading-relaxed font-medium italic">
                            "{selectedApproach.goals}"
                          </p>
                        </section>
                      </div>

                      <div className="space-y-6">
                        <section>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                            <Sparkles className="w-3 h-3" /> Konsep Kunci
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedApproach.keyConcepts.map(concept => (
                              <button 
                                key={concept.name} 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedConcept(concept);
                                }}
                                className={`px-3 py-1.5 bg-slate-50 text-slate-700 text-xs font-bold rounded-lg border border-slate-100 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all flex items-center gap-2 group/btn cursor-pointer ${selectedConcept?.name === concept.name ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200 text-blue-600' : ''}`}
                              >
                                {concept.name}
                                <ArrowRight className="w-2.5 h-2.5 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                              </button>
                            ))}
                          </div>
                        </section>

                        <section className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                          <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                            <Lightbulb className="w-3 h-3" /> Contoh Praktik
                          </h4>
                          <p className="text-xs text-blue-800 leading-relaxed font-bold italic">
                            {selectedApproach.practiceExample}
                          </p>
                        </section>
                      </div>
                    </div>

                    <AnimatePresence mode="wait">
                      {selectedConcept && (
                        <motion.div 
                          key={selectedConcept.name}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="mt-8 p-6 bg-slate-900 rounded-2xl text-white shadow-xl border border-slate-800"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <h5 className="text-lg font-black text-blue-400 tracking-tight uppercase">{selectedConcept.name}</h5>
                            <button 
                              onClick={() => setSelectedConcept(null)}
                              className="text-slate-500 hover:text-white transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Penjelasan Detail</label>
                              <p className="text-sm text-slate-200 leading-relaxed font-medium">{selectedConcept.explanation}</p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                              <label className="text-[8px] font-black text-blue-400 uppercase tracking-widest block mb-1">Contoh Kasus</label>
                              <p className="text-xs text-slate-300 italic leading-relaxed font-medium">"{selectedConcept.example}"</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {!selectedConcept && (
                      <div className="space-y-3 mt-8">
                        <button 
                          onClick={() => handleLearnMore(selectedApproach)}
                          disabled={isLoadingMore}
                          className="w-full py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isLoadingMore ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                          Pelajari Lebih Lanjut
                        </button>
                        <button 
                          onClick={() => setSelectedId(null)}
                          className="w-full py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all text-xs uppercase tracking-widest shadow-lg"
                        >
                          Tutup Detail
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>

            {/* Deep Dive Overlay */}
            <AnimatePresence>
              {isLearningMore && (
                <motion.div
                  initial={{ opacity: 0, x: '100%' }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: '100%' }}
                  className="absolute inset-0 z-[1001] bg-white overflow-hidden flex flex-col"
                >
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-600 text-white rounded-lg">
                        <Book className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Eksplorasi Mendalam</h3>
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{selectedApproach?.title}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsLearningMore(false)}
                      className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 text-slate-500" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8">
                    {isLoadingMore ? (
                      <div className="h-full flex flex-col items-center justify-center space-y-4 text-slate-400">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                        <p className="text-sm font-bold animate-pulse">Sedang menyusun materi mendalam...</p>
                      </div>
                    ) : (
                      <div className="max-w-3xl mx-auto">
                        <div className="markdown-body prose prose-slate prose-sm max-w-none">
                          <Markdown>{learningMoreContent}</Markdown>
                        </div>
                        
                        <div className="mt-12 pt-8 border-t border-slate-100 flex justify-center">
                          <button 
                            onClick={() => setIsLearningMore(false)}
                            className="px-8 py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all text-xs uppercase tracking-widest shadow-lg"
                          >
                            Tutup
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CounselingApproaches;
