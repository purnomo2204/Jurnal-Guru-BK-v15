import React, { useState } from 'react';
import { Wrench, Target, Lightbulb, Users, ArrowRight, Info, Search, Sparkles, CheckCircle2, MessageSquare, Heart, Ear, MessageCircle, UserMinus, Octagon, UserCheck, RefreshCw, Activity, UserCog, Award, Brain, Scale, Wand2, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewMode } from '../types';

interface Technique {
  id: string;
  title: string;
  icon: React.ElementType;
  shortDescription: string;
  description: string;
  steps: string[];
  benefits: string[];
  practiceExample: string;
  applicationExample: string;
  category: 'Komunikasi' | 'Kognitif' | 'Perilaku' | 'Emosional';
  color: string;
}

const techniques: Technique[] = [
  {
    id: 'active-listening',
    title: 'Mendengarkan Aktif (Active Listening)',
    icon: Ear,
    shortDescription: 'Memberikan perhatian penuh secara verbal dan non-verbal.',
    description: 'Teknik dasar komunikasi di mana konselor memberikan perhatian penuh, baik secara verbal maupun non-verbal, untuk memahami pesan konseli secara mendalam.',
    steps: [
      'Kontak mata yang sesuai',
      'Memberikan respon minimal (anggukan, "ya", "saya mengerti")',
      'Menghindari interupsi',
      'Menunjukkan postur tubuh yang terbuka'
    ],
    benefits: ['Membangun kepercayaan', 'Mendorong konseli untuk terbuka', 'Mengurangi kesalahpahaman'],
    practiceExample: 'Konselor tetap tenang dan fokus saat konseli menceritakan masalahnya, tanpa terburu-buru memberikan nasihat.',
    applicationExample: 'Digunakan pada tahap awal konseling (Rapport) untuk membangun hubungan yang hangat dan saling percaya.',
    category: 'Komunikasi',
    color: 'bg-blue-600'
  },
  {
    id: 'paraphrasing',
    title: 'Parafrase (Paraphrasing)',
    icon: MessageCircle,
    shortDescription: 'Menyatakan kembali inti pesan konseli dengan kata-kata sendiri.',
    description: 'Menyatakan kembali inti pesan konseli dengan kata-kata konselor sendiri untuk memastikan pemahaman yang benar dan menunjukkan empati.',
    steps: [
      'Dengarkan pesan konseli secara utuh',
      'Identifikasi inti pesan',
      'Sampaikan kembali dengan bahasa yang lebih ringkas',
      'Minta konfirmasi dari konseli'
    ],
    benefits: ['Memvalidasi perasaan konseli', 'Mengklarifikasi informasi', 'Menunjukkan bahwa konselor mendengarkan'],
    practiceExample: 'Konseli: "Saya merasa sangat lelah dengan semua tugas ini." Konselor: "Jadi, Anda merasa kewalahan dengan beban kerja saat ini?"',
    applicationExample: 'Diterapkan saat konseli memberikan informasi yang panjang atau kompleks untuk menyederhanakan masalah.',
    category: 'Komunikasi',
    color: 'bg-indigo-600'
  },
  {
    id: 'empty-chair',
    title: 'Kursi Kosong (Empty Chair)',
    icon: UserMinus,
    shortDescription: 'Dialog imajiner dengan kursi kosong untuk resolusi konflik.',
    description: 'Teknik Gestalt di mana konseli melakukan dialog dengan kursi kosong yang mewakili orang lain atau bagian dari diri mereka sendiri untuk menyelesaikan konflik internal.',
    steps: [
      'Siapkan kursi kosong di depan konseli',
      'Minta konseli membayangkan sosok tertentu di kursi tersebut',
      'Minta konseli berbicara kepada sosok tersebut',
      'Minta konseli bertukar peran (duduk di kursi kosong)'
    ],
    benefits: ['Menyelesaikan "unfinished business"', 'Meningkatkan empati', 'Mengeksplorasi konflik internal'],
    practiceExample: 'Konseli berbicara kepada ayahnya yang sudah meninggal untuk mengungkapkan perasaan yang selama ini dipendam.',
    applicationExample: 'Sangat efektif untuk menangani rasa bersalah, kemarahan yang terpendam, atau duka cita yang belum selesai.',
    category: 'Emosional',
    color: 'bg-rose-600'
  },
  {
    id: 'thought-stopping',
    title: 'Penghentian Pikiran (Thought Stopping)',
    icon: Octagon,
    shortDescription: 'Menghentikan pikiran negatif yang berulang secara sadar.',
    description: 'Teknik kognitif-perilaku untuk membantu konseli menghentikan pikiran negatif atau obsesif yang berulang dengan menggunakan perintah internal.',
    steps: [
      'Identifikasi pikiran negatif yang muncul',
      'Gunakan perintah mental "STOP!" dengan tegas',
      'Ganti dengan pikiran positif atau aktivitas lain',
      'Lakukan latihan secara konsisten'
    ],
    benefits: ['Mengurangi kecemasan', 'Meningkatkan kontrol diri', 'Memutus siklus pikiran negatif'],
    practiceExample: 'Saat konseli mulai berpikir "Saya pasti gagal", ia segera membayangkan tanda stop merah besar dan berkata "STOP" dalam hati.',
    applicationExample: 'Digunakan untuk konseli dengan gangguan kecemasan atau pikiran obsesif yang mengganggu aktivitas harian.',
    category: 'Kognitif',
    color: 'bg-amber-600'
  },
  {
    id: 'role-playing',
    title: 'Bermain Peran (Role Playing)',
    icon: UserCheck,
    shortDescription: 'Simulasi situasi nyata dalam lingkungan yang aman.',
    description: 'Teknik di mana konseli melatih perilaku atau situasi tertentu dalam lingkungan yang aman sebelum melakukannya di dunia nyata untuk meningkatkan kesiapan.',
    steps: [
      'Tentukan skenario yang akan dilatih',
      'Tentukan peran masing-masing (konselor dan konseli)',
      'Lakukan simulasi interaksi',
      'Berikan umpan balik dan evaluasi'
    ],
    benefits: ['Meningkatkan keterampilan sosial', 'Mengurangi kecemasan sosial', 'Mempersiapkan diri menghadapi konflik'],
    practiceExample: 'Konseli berlatih cara menolak ajakan teman untuk merokok dengan bantuan konselor yang berperan sebagai teman tersebut.',
    applicationExample: 'Cocok untuk melatih keterampilan asertif, persiapan wawancara kerja, atau resolusi konflik interpersonal.',
    category: 'Perilaku',
    color: 'bg-emerald-600'
  },
  {
    id: 'reframing',
    title: 'Pembingkaian Ulang (Reframing)',
    icon: RefreshCw,
    shortDescription: 'Melihat masalah dari sudut pandang yang lebih positif.',
    description: 'Membantu konseli melihat masalah atau situasi dari sudut pandang yang berbeda, lebih positif, dan memberdayakan.',
    steps: [
      'Identifikasi persepsi negatif konseli',
      'Cari aspek positif atau peluang dalam situasi tersebut',
      'Sajikan sudut pandang baru kepada konseli',
      'Diskusikan bagaimana sudut pandang baru ini mengubah perasaan mereka'
    ],
    benefits: ['Mengubah sikap mental', 'Meningkatkan optimisme', 'Membuka solusi baru'],
    practiceExample: 'Melihat kegagalan ujian bukan sebagai "akhir segalanya", melainkan sebagai "kesempatan untuk belajar lebih baik lagi".',
    applicationExample: 'Digunakan saat konseli merasa terjebak dalam pesimisme atau menyalahkan diri sendiri secara berlebihan.',
    category: 'Kognitif',
    color: 'bg-purple-600'
  },
  {
    id: 'systematic-desensitization',
    title: 'Desensitisasi Sistematis',
    icon: Activity,
    shortDescription: 'Mengurangi kecemasan melalui paparan bertahap dan relaksasi.',
    description: 'Teknik untuk mengurangi respon kecemasan dengan menggantikannya dengan respon relaksasi melalui paparan bertahap terhadap stimulus yang ditakuti.',
    steps: [
      'Latihan relaksasi otot',
      'Penyusunan hierarki kecemasan',
      'Paparan bertahap (imajinasi/nyata)',
      'Evaluasi tingkat kecemasan'
    ],
    benefits: ['Mengatasi fobia', 'Mengurangi kecemasan spesifik', 'Meningkatkan ketenangan'],
    practiceExample: 'Konseli yang takut berbicara di depan umum mulai membayangkan situasi tersebut sambil melakukan relaksasi pernapasan.',
    applicationExample: 'Sangat efektif untuk menangani fobia spesifik, kecemasan ujian, atau trauma ringan.',
    category: 'Perilaku',
    color: 'bg-teal-600'
  },
  {
    id: 'self-management',
    title: 'Self Management',
    icon: UserCog,
    shortDescription: 'Mengatur dan memantau perilaku sendiri untuk mencapai tujuan.',
    description: 'Teknik di mana konseli belajar untuk mengatur, memantau, dan mengevaluasi perilaku mereka sendiri untuk mencapai perubahan perilaku yang diinginkan.',
    steps: [
      'Pemantauan diri (self-monitoring)',
      'Penentuan standar tujuan',
      'Evaluasi diri',
      'Pemberian penguatan diri (self-reward)'
    ],
    benefits: ['Meningkatkan kemandirian', 'Mengubah kebiasaan buruk', 'Meningkatkan disiplin diri'],
    practiceExample: 'Konseli mencatat setiap kali mereka berhasil belajar selama 1 jam tanpa gangguan dan memberikan hadiah kecil untuk diri sendiri.',
    applicationExample: 'Digunakan untuk manajemen waktu, pengendalian berat badan, atau menghentikan kebiasaan merokok.',
    category: 'Perilaku',
    color: 'bg-orange-600'
  },
  {
    id: 'reinforcement',
    title: 'Reinforcement',
    icon: Award,
    shortDescription: 'Pemberian penguatan positif untuk perilaku yang diinginkan.',
    description: 'Pemberian konsekuensi positif (penguatan) segera setelah perilaku yang diinginkan muncul untuk meningkatkan frekuensi perilaku tersebut di masa depan.',
    steps: [
      'Identifikasi perilaku target',
      'Pilih penguat yang bermakna',
      'Berikan penguatan segera',
      'Konsistensi pemberian'
    ],
    benefits: ['Membentuk perilaku baru', 'Meningkatkan motivasi', 'Memperkuat kebiasaan positif'],
    practiceExample: 'Guru memberikan pujian atau stiker bintang setiap kali siswa mengumpulkan tugas tepat waktu.',
    applicationExample: 'Efektif dalam modifikasi perilaku anak di sekolah atau rumah, serta dalam setting rehabilitasi.',
    category: 'Perilaku',
    color: 'bg-pink-600'
  },
  {
    id: 'cognitive-restructuring',
    title: 'Restrukturisasi Kognitif',
    icon: Brain,
    shortDescription: 'Mengubah pola pikir irasional menjadi lebih adaptif.',
    description: 'Proses mengidentifikasi, menantang, dan mengubah pikiran irasional atau maladaptif menjadi pikiran yang lebih rasional, logis, dan adaptif.',
    steps: [
      'Identifikasi pikiran otomatis',
      'Evaluasi bukti pendukung/penentang',
      'Cari alternatif pikiran rasional',
      'Uji pikiran baru dalam situasi nyata'
    ],
    benefits: ['Mengurangi depresi/kecemasan', 'Meningkatkan harga diri', 'Mengubah pola pikir negatif'],
    practiceExample: 'Mengubah pikiran "Saya tidak berguna karena gagal" menjadi "Kegagalan ini adalah pelajaran untuk sukses di masa depan".',
    applicationExample: 'Inti dari terapi CBT, digunakan untuk depresi, kecemasan umum, dan masalah harga diri rendah.',
    category: 'Kognitif',
    color: 'bg-cyan-600'
  },
  {
    id: 'homeostasis',
    title: 'Homeostasis',
    icon: Scale,
    shortDescription: 'Memahami kecenderungan sistem untuk menjaga stabilitas.',
    description: 'Kecenderungan sistem (individu atau keluarga) untuk mempertahankan stabilitas dan keseimbangan internal meskipun ada tekanan perubahan dari luar.',
    steps: [
      'Identifikasi pola interaksi yang kaku',
      'Sadari mekanisme pertahanan diri',
      'Eksplorasi kebutuhan akan keamanan',
      'Dorong perubahan bertahap tanpa merusak sistem'
    ],
    benefits: ['Memahami dinamika keluarga', 'Menjaga stabilitas emosional', 'Mengidentifikasi hambatan perubahan'],
    practiceExample: 'Memahami mengapa seorang anak tetap berperilaku buruk untuk menjaga perhatian orang tuanya agar tetap bersatu.',
    applicationExample: 'Digunakan dalam konseling keluarga untuk memahami mengapa perubahan pada satu anggota keluarga ditentang oleh anggota lainnya.',
    category: 'Emosional',
    color: 'bg-lime-600'
  },
  {
    id: 'miracle-question',
    title: 'Miracle Question',
    icon: Wand2,
    shortDescription: 'Membayangkan hidup tanpa masalah untuk mencari solusi.',
    description: 'Teknik dari Solution-Focused Brief Therapy (SFBT) yang meminta konseli membayangkan hidup mereka jika masalah tiba-tiba hilang secara ajaib untuk mengidentifikasi solusi.',
    steps: [
      'Sampaikan skenario "keajaiban"',
      'Minta konseli mendeskripsikan perubahan detail',
      'Identifikasi tanda-tanda kecil keajaiban',
      'Cari solusi berdasarkan deskripsi tersebut'
    ],
    benefits: ['Fokus pada solusi bukan masalah', 'Meningkatkan harapan', 'Memperjelas tujuan konseling'],
    practiceExample: '"Jika besok pagi Anda bangun dan masalah ini hilang secara ajaib, apa hal pertama yang akan Anda sadari berbeda?"',
    applicationExample: 'Sangat berguna saat konseli merasa sangat terbebani oleh masalah dan sulit melihat jalan keluar.',
    category: 'Kognitif',
    color: 'bg-sky-600'
  },
  {
    id: 'assertive-training',
    title: 'Assertive Training',
    icon: Zap,
    shortDescription: 'Melatih ekspresi diri yang jujur tanpa melanggar hak orang lain.',
    description: 'Melatih konseli untuk mengekspresikan perasaan, pikiran, dan kebutuhan mereka secara jujur, langsung, dan tepat tanpa melanggar hak orang lain.',
    steps: [
      'Identifikasi situasi interpersonal',
      'Bedakan perilaku pasif/agresif/asertif',
      'Latihan komunikasi asertif (I-message)',
      'Role play situasi nyata'
    ],
    benefits: ['Meningkatkan kepercayaan diri', 'Memperbaiki hubungan sosial', 'Mengurangi stres interpersonal'],
    practiceExample: 'Konseli berlatih mengatakan "Saya merasa keberatan jika Anda meminjam barang saya tanpa izin" daripada hanya diam atau marah.',
    applicationExample: 'Digunakan untuk konseli yang sering merasa dimanfaatkan orang lain atau sulit berkata "tidak".',
    category: 'Perilaku',
    color: 'bg-rose-500'
  }
];

const CounselingTechniques: React.FC<{ setView: (v: ViewMode) => void }> = ({ setView }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('Semua');

  const filteredTechniques = techniques.filter(t => 
    (activeCategory === 'Semua' || t.category === activeCategory) &&
    (t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     t.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const categories = ['Semua', 'Komunikasi', 'Kognitif', 'Perilaku', 'Emosional'];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3">
            <Wrench className="w-8 h-8 text-indigo-600" />
            Teknik <span className="text-indigo-600 italic">Konseling</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1">Kumpulan metode dan keterampilan praktis untuk memfasilitasi perubahan pada konseli.</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari teknik..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm font-medium"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${activeCategory === cat ? 'bg-indigo-600 text-white border-indigo-700 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTechniques.map((tech) => (
          <motion.div 
            key={tech.id}
            layoutId={tech.id}
            onClick={() => setSelectedId(tech.id)}
            className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden flex flex-col"
            whileHover={{ y: -3 }}
          >
            <div className={`h-1.5 w-full ${tech.color}`} />
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <div className={`p-1.5 rounded-lg ${tech.color} bg-opacity-10 text-slate-900`}>
                  <tech.icon className={`w-4 h-4 ${tech.color.replace('bg-', 'text-')}`} />
                </div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{tech.category}</span>
              </div>
              
              <h3 className="text-sm font-black text-slate-900 mb-1.5 group-hover:text-indigo-600 transition-colors leading-tight flex items-center gap-2">
                {tech.title}
              </h3>
              
              <p className="text-[11px] text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                {tech.shortDescription}
              </p>

              <div className="bg-indigo-50/30 rounded-lg p-3 mb-3 border border-indigo-100/50">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="p-1 bg-indigo-100 rounded-md">
                    <Lightbulb className="w-2.5 h-2.5 text-indigo-600" />
                  </div>
                  <h4 className="text-[9px] font-black text-indigo-900 uppercase tracking-wider">
                    Contoh Kasus
                  </h4>
                </div>
                <p className="text-[10px] text-slate-700 italic line-clamp-2 font-medium leading-relaxed">
                  "{tech.practiceExample}"
                </p>
              </div>

              <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                  Detail Teknik <ArrowRight className="w-2.5 h-2.5" />
                </span>
                <div className="flex gap-1">
                  {tech.benefits.slice(0, 3).map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${tech.color} opacity-40`} />
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
              onClick={() => setSelectedId(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            
            <motion.div 
              layoutId={selectedId}
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-white max-h-[90vh] overflow-y-auto"
            >
              {techniques.find(t => t.id === selectedId) && (
                <>
                  <div className={`h-2 w-full ${techniques.find(t => t.id === selectedId)?.color}`} />
                  <div className="p-4 md:p-8">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-xl ${techniques.find(t => t.id === selectedId)?.color} bg-opacity-10`}>
                          {React.createElement(techniques.find(t => t.id === selectedId)?.icon || MessageSquare, {
                            className: `w-6 h-6 ${techniques.find(t => t.id === selectedId)?.color.replace('bg-', 'text-')}`
                          })}
                        </div>
                        <div>
                          <h2 className="text-lg md:text-2xl font-black text-slate-900 tracking-tight">
                            {techniques.find(t => t.id === selectedId)?.title}
                          </h2>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] md:text-[10px] font-black rounded uppercase tracking-widest">{techniques.find(t => t.id === selectedId)?.category}</span>
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] md:text-[10px] font-black rounded uppercase tracking-widest">Metode Praktis</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedId(null)}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                      >
                        <ArrowRight className="w-5 h-5 rotate-180 text-slate-400" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <section>
                          <h4 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                            <Target className="w-3 h-3" /> Langkah-Langkah
                          </h4>
                          <div className="space-y-1.5">
                            {techniques.find(t => t.id === selectedId)?.steps.map((step, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <div className="w-4 h-4 rounded-full bg-indigo-50 text-indigo-600 text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5 border border-indigo-100">{i + 1}</div>
                                <p className="text-[11px] md:text-xs text-slate-700 font-medium leading-relaxed">{step}</p>
                              </div>
                            ))}
                          </div>
                        </section>

                        <section>
                          <h4 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                            <CheckCircle2 className="w-3 h-3" /> Manfaat Utama
                          </h4>
                          <div className="space-y-1.5">
                            {techniques.find(t => t.id === selectedId)?.benefits.map((benefit, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                                <p className="text-[11px] md:text-xs text-slate-700 font-bold">{benefit}</p>
                              </div>
                            ))}
                          </div>
                        </section>
                      </div>

                      <div className="space-y-4">
                        <section className="p-3 md:p-5 bg-indigo-50 rounded-xl border border-indigo-100 shadow-inner">
                          <h4 className="text-[9px] md:text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                            <Lightbulb className="w-3 h-3" /> Contoh Kasus
                          </h4>
                          <p className="text-[10px] md:text-xs text-indigo-900 leading-relaxed font-bold italic">
                            "{techniques.find(t => t.id === selectedId)?.practiceExample}"
                          </p>
                        </section>

                        <section className="p-3 md:p-5 bg-emerald-50 rounded-xl border border-emerald-100">
                          <h4 className="text-[9px] md:text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                            <Sparkles className="w-3 h-3" /> Contoh Aplikasi
                          </h4>
                          <p className="text-[10px] md:text-xs text-emerald-900 leading-relaxed font-bold italic">
                            "{techniques.find(t => t.id === selectedId)?.applicationExample}"
                          </p>
                        </section>

                        <section className="p-3 md:p-5 bg-slate-50 rounded-xl border border-slate-100">
                          <h4 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                            <Info className="w-3 h-3" /> Deskripsi
                          </h4>
                          <p className="text-[10px] md:text-xs text-slate-600 leading-relaxed font-medium">
                            {techniques.find(t => t.id === selectedId)?.description}
                          </p>
                        </section>
                      </div>
                    </div>

                    <button 
                      onClick={() => setSelectedId(null)}
                      className="w-full mt-6 py-2.5 bg-indigo-600 text-white font-black rounded-lg hover:bg-indigo-700 transition-all text-[10px] md:text-xs uppercase tracking-widest shadow-lg"
                    >
                      Selesai Mempelajari
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CounselingTechniques;
