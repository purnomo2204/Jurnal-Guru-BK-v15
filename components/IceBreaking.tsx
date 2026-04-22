
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Users, MapPin, Home, Info, ChevronRight, Sparkles, Zap, Heart, Brain, X, Globe, Loader2 } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

interface IceBreakingActivity {
  id: string;
  title: string;
  category: 'DALAM KELAS' | 'LUAR KELAS' | 'ONLINE';
  duration: string;
  participants: string;
  materials: string[];
  instructions: string[];
  benefit: string;
  traits: string[];
  icon: React.ReactNode;
}

const activities: IceBreakingActivity[] = [
  // DALAM KELAS
  {
    id: '1',
    title: 'Dua Kebenaran dan Satu Kebohongan',
    category: 'DALAM KELAS',
    duration: '15-20 Menit',
    participants: '10-30 Orang',
    materials: ['Kertas (opsional)', 'Pena (opsional)'],
    instructions: [
      'Setiap siswa memikirkan tiga pernyataan tentang diri mereka: dua benar dan satu bohong.',
      'Siswa lain harus menebak mana yang merupakan kebohongan.',
      'Siswa yang menebak dengan benar mendapatkan poin atau giliran berikutnya.'
    ],
    benefit: 'Membangun kedekatan dan mengenal fakta unik teman sekelas.',
    traits: ['Keakraban', 'Keterbukaan'],
    icon: <Brain className="w-3.5 h-3.5" />
  },
  {
    id: '2',
    title: 'Sambung Kata',
    category: 'DALAM KELAS',
    duration: '10 Menit',
    participants: 'Seluruh Kelas',
    materials: ['Tanpa Alat'],
    instructions: [
      'Guru memulai dengan satu kata (misal: "Sekolah").',
      'Siswa berikutnya harus menyebutkan kata yang berawalan dari huruf terakhir kata sebelumnya (misal: "Halaman").',
      'Lanjutkan hingga ada yang gagal atau waktu habis.'
    ],
    benefit: 'Melatih konsentrasi dan kecepatan berpikir.',
    traits: ['Konsentrasi', 'Kecepatan Berpikir'],
    icon: <Zap className="w-3.5 h-3.5" />
  },
  {
    id: '3',
    title: 'Siapa Aku?',
    category: 'DALAM KELAS',
    duration: '15 Menit',
    participants: '10-20 Orang',
    materials: ['Sticky Notes', 'Spidol'],
    instructions: [
      'Tulis nama tokoh terkenal atau benda pada sticky note.',
      'Tempelkan di dahi siswa tanpa ia melihat tulisannya.',
      'Siswa harus menebak siapa dirinya dengan bertanya "Ya/Tidak" kepada teman-temannya.'
    ],
    benefit: 'Mendorong interaksi aktif dan kemampuan bertanya.',
    traits: ['Interaksi', 'Analisis'],
    icon: <Search className="w-3.5 h-3.5" />
  },
  {
    id: '4',
    title: 'Tebak Gaya (Charades)',
    category: 'DALAM KELAS',
    duration: '15 Menit',
    participants: 'Kelompok (4-6 orang)',
    materials: ['Kertas berisi daftar kata kerja/benda'],
    instructions: [
      'Satu perwakilan kelompok memperagakan kata tanpa suara.',
      'Anggota kelompok lain menebak dalam waktu 1 menit.',
      'Kelompok dengan tebakan terbanyak menang.'
    ],
    benefit: 'Meningkatkan kreativitas dan ekspresi non-verbal.',
    traits: ['Kreativitas', 'Ekspresi'],
    icon: <Sparkles className="w-3.5 h-3.5" />
  },
  {
    id: '5',
    title: 'Garis Kehidupan',
    category: 'DALAM KELAS',
    duration: '20-30 Menit',
    participants: 'Individu/Berpasangan',
    materials: ['Kertas HVS', 'Alat Tulis'],
    instructions: [
      'Siswa menggambar garis horizontal yang mewakili perjalanan hidup mereka.',
      'Tandai titik-titik penting (kebahagiaan, kesedihan, pencapaian).',
      'Ceritakan garis tersebut kepada teman sebangku.'
    ],
    benefit: 'Membangun empati dan pemahaman diri yang mendalam.',
    traits: ['Empati', 'Refleksi'],
    icon: <Heart className="w-3.5 h-3.5" />
  },
  {
    id: '6',
    title: 'Tepuk Konsentrasi',
    category: 'DALAM KELAS',
    duration: '5 Menit',
    participants: 'Seluruh Kelas',
    materials: ['Tanpa Alat'],
    instructions: [
      'Guru memberikan kode tepukan tertentu (misal: Tepuk 1 = "Pagi", Tepuk 2 = "Siang").',
      'Guru menyebutkan waktu, siswa harus menepuk sesuai kode.',
      'Siswa yang salah menepuk harus maju ke depan untuk memimpin sesi berikutnya.'
    ],
    benefit: 'Menyegarkan suasana dan melatih fokus.',
    traits: ['Fokus', 'Refleks'],
    icon: <Zap className="w-3.5 h-3.5" />
  },

  // LUAR KELAS
  {
    id: '7',
    title: 'Lingkaran Nama',
    category: 'LUAR KELAS',
    duration: '15 Menit',
    participants: '15-40 Orang',
    materials: ['Bola Kecil (opsional)'],
    instructions: [
      'Siswa berdiri membentuk lingkaran besar.',
      'Satu orang menyebutkan namanya, lalu menunjuk orang lain.',
      'Orang yang ditunjuk menyebutkan nama orang sebelumnya baru namanya sendiri.',
      'Lanjutkan hingga orang terakhir harus menyebutkan semua nama di lingkaran.'
    ],
    benefit: 'Menghafal nama teman dengan cara yang menyenangkan.',
    traits: ['Memori', 'Sosialisasi'],
    icon: <Users className="w-3.5 h-3.5" />
  },
  {
    id: '8',
    title: 'Manusia ke Manusia',
    category: 'LUAR KELAS',
    duration: '10-15 Menit',
    participants: 'Genap (Minimal 10)',
    materials: ['Tanpa Alat'],
    instructions: [
      'Siswa berpasangan and berdiri bebas.',
      'Guru meneriakkan instruksi (misal: "Sikut ke Sikut!", "Punggung ke Punggung!").',
      'Siswa harus menempelkan bagian tubuh tersebut dengan pasangannya.',
      'Saat guru teriak "Manusia ke Manusia!", semua harus mencari pasangan baru.'
    ],
    benefit: 'Mencairkan suasana dan meningkatkan keakraban fisik yang sopan.',
    traits: ['Keakraban', 'Ketangkasan'],
    icon: <Users className="w-3.5 h-3.5" />
  },
  {
    id: '9',
    title: 'Perang Naga',
    category: 'LUAR KELAS',
    duration: '20 Menit',
    participants: 'Kelompok (8-10 orang)',
    materials: ['Tali/Kain untuk ekor'],
    instructions: [
      'Siswa berbaris memegang pinggang teman di depannya (membentuk naga).',
      'Siswa paling belakang memakai "ekor" (kain).',
      'Kepala naga (siswa paling depan) harus berusaha mengambil ekor naga kelompok lain.',
      'Naga tidak boleh putus.'
    ],
    benefit: 'Melatih kerjasama tim dan ketangkasan.',
    traits: ['Kerjasama', 'Strategi'],
    icon: <MapPin className="w-3.5 h-3.5" />
  },
  {
    id: '10',
    title: 'Jaring Laba-Laba',
    category: 'LUAR KELAS',
    duration: '30 Menit',
    participants: '10-15 Orang',
    materials: ['Tali Rafia/Tambang Kecil'],
    instructions: [
      'Buat jaring laba-laba dari tali di antara dua pohon.',
      'Siswa harus melewati lubang jaring tanpa menyentuh tali.',
      'Setiap lubang hanya boleh dilewati satu kali.'
    ],
    benefit: 'Problem solving dan strategi kelompok.',
    traits: ['Problem Solving', 'Kepercayaan'],
    icon: <MapPin className="w-3.5 h-3.5" />
  },
  {
    id: '11',
    title: 'Evakuasi Telur',
    category: 'LUAR KELAS',
    duration: '20 Menit',
    participants: 'Kelompok (5-7 orang)',
    materials: ['Sendok', 'Kelereng/Telur Plastik'],
    instructions: [
      'Siswa berbaris estafet.',
      'Membawa kelereng dengan sendok di mulut dari titik A ke B.',
      'Jika jatuh, harus mengulang dari awal barisan kelompok.'
    ],
    benefit: 'Melatih kesabaran dan keseimbangan.',
    traits: ['Kesabaran', 'Keseimbangan'],
    icon: <Zap className="w-3.5 h-3.5" />
  },
  {
    id: '12',
    title: 'Pesan Berantai Gerak',
    category: 'LUAR KELAS',
    duration: '15 Menit',
    participants: 'Kelompok (6-10 orang)',
    materials: ['Tanpa Alat'],
    instructions: [
      'Siswa berbaris menghadap ke belakang.',
      'Orang pertama diberikan satu gerakan kompleks.',
      'Ia menepuk bahu orang kedua and memperagakan gerakan tersebut.',
      'Lanjutkan hingga orang terakhir harus menebak apa pesan gerakannya.'
    ],
    benefit: 'Melatih komunikasi visual dan memori.',
    traits: ['Komunikasi', 'Memori'],
    icon: <Users className="w-3.5 h-3.5" />
  }
];

const IceBreaking: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DALAM KELAS' | 'LUAR KELAS' | 'ONLINE'>('DALAM KELAS');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<IceBreakingActivity | null>(null);
  const [onlineActivities, setOnlineActivities] = useState<IceBreakingActivity[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);

  const handleOnlineSearch = async () => {
    if (isSearchingOnline) return;
    setIsSearchingOnline(true);
    setActiveTab('ONLINE');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Berikan 5 ide ice breaking yang kreatif dan edukatif untuk siswa sekolah (BK). 
        Topik pencarian: ${searchQuery || 'umum'}. 
        Berikan dalam format JSON array of objects dengan property: id (string random), title, category (selalu "ONLINE"), duration, participants, materials (array of strings), instructions (array of strings), benefit, traits (array of strings, misal: ["Konsentrasi", "Kecepatan"]). 
        Gunakan Bahasa Indonesia yang baik dan benar.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                category: { type: Type.STRING },
                duration: { type: Type.STRING },
                participants: { type: Type.STRING },
                materials: { type: Type.ARRAY, items: { type: Type.STRING } },
                instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
                benefit: { type: Type.STRING },
                traits: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["id", "title", "category", "duration", "participants", "materials", "instructions", "benefit", "traits"]
            }
          }
        }
      });

      const data = JSON.parse(response.text);
      const formattedData = data.map((item: any) => ({
        ...item,
        icon: <Globe className="w-4 h-4" />
      }));
      setOnlineActivities(formattedData);
    } catch (error) {
      console.error("Error searching online:", error);
    } finally {
      setIsSearchingOnline(false);
    }
  };

  const filteredActivities = [
    ...activities.filter(activity => activity.category === activeTab),
    ...onlineActivities.filter(activity => activity.category === activeTab)
  ].filter(activity => 
    activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    activity.benefit.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-3 space-y-3 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 bg-white p-3 rounded-xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Ice Breaking Hub
          </h1>
          <p className="text-slate-500 text-[10px] mt-0.5">
            Kumpulan aktivitas penyegar suasana untuk Guru BK yang profesional.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari aktivitas..."
              className="pl-8 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-40 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={handleOnlineSearch}
            disabled={isSearchingOnline}
            className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[11px] font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {isSearchingOnline ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Globe className="w-3 h-3" />
            )}
            Online
          </button>
        </div>
      </div>

      {/* Introduction Section */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-50 border border-blue-100 p-3 rounded-xl"
      >
        <div className="flex gap-2.5">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-sm">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-blue-900 mb-0.5 uppercase tracking-wider">Mengapa Ice Breaking Penting?</h2>
            <p className="text-[10px] text-blue-800 leading-relaxed">
              Ice breaking adalah kegiatan singkat yang dirancang untuk mencairkan ketegangan, membangun <span className="font-bold italic">rapport</span> (hubungan baik), dan meningkatkan keterlibatan peserta. Dalam sesi konseling, ice breaking membantu konseli merasa lebih nyaman, mengurangi kecemasan, dan membuka jalur komunikasi yang lebih efektif antara konselor dan konseli.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-100 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('DALAM KELAS')}
          className={`flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
            activeTab === 'DALAM KELAS'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Home className="w-3 h-3" />
          Dalam Kelas
        </button>
        <button
          onClick={() => setActiveTab('LUAR KELAS')}
          className={`flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
            activeTab === 'LUAR KELAS'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <MapPin className="w-3 h-3" />
          Luar Kelas
        </button>
        {onlineActivities.length > 0 && (
          <button
            onClick={() => setActiveTab('ONLINE')}
            className={`flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
              activeTab === 'ONLINE'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Globe className="w-3 h-3" />
            Hasil Online
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <AnimatePresence mode="popLayout">
          {filteredActivities.map((activity) => (
            <motion.div
              key={activity.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-pointer overflow-hidden"
              onClick={() => setSelectedActivity(activity)}
            >
              <div className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {activity.icon}
                  </div>
                  <span className="text-[8px] font-bold uppercase tracking-wider px-1 py-0.5 bg-slate-100 text-slate-500 rounded">
                    {activity.duration}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 text-xs mb-0.5 group-hover:text-blue-600 transition-colors line-clamp-1">
                  {activity.title}
                </h3>
                <p className="text-slate-500 text-[9px] line-clamp-2 leading-tight">
                  {activity.benefit}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {activity.traits.slice(0, 2).map((trait, i) => (
                    <span key={i} className="text-[7px] font-bold bg-blue-50 text-blue-600 px-1 py-0.5 rounded border border-blue-100">
                      {trait}
                    </span>
                  ))}
                </div>
                <div className="mt-2 flex items-center text-blue-600 text-[9px] font-bold">
                  Detail
                  <ChevronRight className="w-2 h-2 ml-0.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Modal Detail */}
      <AnimatePresence>
        {selectedActivity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-lg shadow-blue-200">
                    {selectedActivity.icon}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">{selectedActivity.title}</h2>
                    <span className="text-[8px] font-bold text-blue-600 uppercase tracking-widest">
                      {selectedActivity.category}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedActivity(null)}
                  className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">Durasi</div>
                    <div className="text-[10px] font-bold text-slate-700">{selectedActivity.duration}</div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">Peserta</div>
                    <div className="text-[10px] font-bold text-slate-700">{selectedActivity.participants}</div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">Alat</div>
                    <div className="text-[10px] font-bold text-slate-700 truncate">{selectedActivity.materials.join(', ')}</div>
                  </div>
                </div>

                {/* Instructions & Interactive Nature */}
                <div className="space-y-3">
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-800 mb-2 flex items-center gap-1">
                      <Info className="w-3 h-3 text-blue-600" />
                      Langkah-langkah & Instruksi
                    </h4>
                    <div className="space-y-1.5">
                      {selectedActivity.instructions.map((step, idx) => (
                        <div key={idx} className="flex gap-2 p-2 bg-blue-50/30 rounded-lg border border-blue-100/50">
                          <div className="flex-shrink-0 w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                            {idx + 1}
                          </div>
                          <p className="text-[10px] text-slate-600 leading-normal">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sifat Interaktif Sub-section */}
                  <div className="p-2.5 bg-indigo-50 rounded-lg border border-indigo-100">
                    <h5 className="text-[10px] font-bold text-indigo-800 mb-2 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-indigo-500" />
                      Sifat Interaktif (Fokus Pengembangan)
                    </h5>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedActivity.traits.map((trait, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-2 py-1 bg-white rounded border border-indigo-100">
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-sm shadow-indigo-200" />
                          <span className="text-[9px] font-medium text-indigo-700">Melatih {trait}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Benefit */}
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <h4 className="text-[11px] font-bold text-amber-800 mb-0.5 flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    Manfaat Utama
                  </h4>
                  <p className="text-[10px] text-amber-700 leading-normal">
                    {selectedActivity.benefit}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedActivity(null)}
                  className="px-3 py-1 bg-slate-800 text-white rounded-lg text-[11px] font-bold hover:bg-slate-700 transition-colors shadow-lg shadow-slate-200"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IceBreaking;
