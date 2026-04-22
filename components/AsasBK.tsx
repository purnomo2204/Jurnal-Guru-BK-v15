import React, { useState } from 'react';
import { Shield, Lock, Users, Heart, Lightbulb, Activity, BookOpen, Target, CheckCircle, RefreshCcw, Search, ChevronDown, ChevronUp } from 'lucide-react';

interface AsasItem {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const asasData: AsasItem[] = [
  {
    id: 'kerahasiaan',
    name: 'Asas Kerahasiaan',
    description: 'Asas yang menuntut dirahasiakannya segenap data dan keterangan peserta didik (klien) yang menjadi sasaran layanan, yaitu data atau keterangan yang tidak boleh dan tidak layak diketahui orang lain. Guru BK berkewajiban memelihara dan menjaga semua rahasia tersebut.',
    icon: <Lock className="w-6 h-6" />,
    color: 'bg-rose-500'
  },
  {
    id: 'kesukarelaan',
    name: 'Asas Kesukarelaan',
    description: 'Asas yang menghendaki adanya kesukaan dan kerelaan peserta didik (klien) mengikuti/menjalani layanan/kegiatan yang diperuntukkan baginya. Guru BK berkewajiban membina dan mengembangkan kesukarelaan tersebut.',
    icon: <Heart className="w-6 h-6" />,
    color: 'bg-pink-500'
  },
  {
    id: 'keterbukaan',
    name: 'Asas Keterbukaan',
    description: 'Asas yang menghendaki agar peserta didik (klien) yang menjadi sasaran layanan/kegiatan bersikap terbuka dan tidak berpura-pura, baik dalam memberikan keterangan tentang dirinya sendiri maupun dalam menerima berbagai informasi dan materi dari luar yang berguna bagi pengembangan dirinya.',
    icon: <BookOpen className="w-6 h-6" />,
    color: 'bg-blue-500'
  },
  {
    id: 'kegiatan',
    name: 'Asas Kegiatan',
    description: 'Asas yang menghendaki agar peserta didik (klien) yang menjadi sasaran layanan dapat berpartisipasi aktif di dalam penyelenggaraan/kegiatan bimbingan. Guru BK perlu mendorong dan memotivasi peserta didik untuk dapat aktif dalam setiap layanan/kegiatan yang diberikan kepadanya.',
    icon: <Activity className="w-6 h-6" />,
    color: 'bg-emerald-500'
  },
  {
    id: 'kemandirian',
    name: 'Asas Kemandirian',
    description: 'Asas yang menunjukkan pada tujuan umum bimbingan dan konseling; yaitu peserta didik (klien) sebagai sasaran layanan bimbingan dan konseling diharapkan menjadi individu-individu yang mandiri, dengan ciri-ciri mengenal diri sendiri dan lingkungannya, mampu mengambil keputusan, mengarahkan, serta mewujudkan diri sendiri.',
    icon: <Target className="w-6 h-6" />,
    color: 'bg-amber-500'
  },
  {
    id: 'kekinian',
    name: 'Asas Kekinian',
    description: 'Asas yang menghendaki agar objek sasaran layanan bimbingan dan konseling yakni permasalahan yang dihadapi peserta didik/klien dalam kondisi sekarang. Kondisi masa lampau dan masa depan dilihat sebagai dampak dan memiliki keterkaitan dengan apa yang ada dan diperbuat peserta didik (klien) pada saat sekarang.',
    icon: <RefreshCcw className="w-6 h-6" />,
    color: 'bg-cyan-500'
  },
  {
    id: 'kedinamisan',
    name: 'Asas Kedinamisan',
    description: 'Asas yang menghendaki agar isi layanan terhadap sasaran layanan (peserta didik/klien) hendaknya selalu bergerak maju, tidak monoton, dan terus berkembang serta berkelanjutan sesuai dengan kebutuhan dan tahap perkembangannya dari waktu ke waktu.',
    icon: <Lightbulb className="w-6 h-6" />,
    color: 'bg-violet-500'
  },
  {
    id: 'keterpaduan',
    name: 'Asas Keterpaduan',
    description: 'Asas yang menghendaki agar berbagai layanan dan kegiatan bimbingan dan konseling, baik yang dilakukan oleh guru BK maupun pihak lain, saling menunjang, harmonis, dan terpadu. Dalam hal ini, kerja sama dan koordinasi dengan berbagai pihak yang terkait dengan peserta didik (klien) menjadi amat penting.',
    icon: <Users className="w-6 h-6" />,
    color: 'bg-indigo-500'
  },
  {
    id: 'kenormatifan',
    name: 'Asas Kenormatifan',
    description: 'Asas yang menghendaki agar segenap layanan dan kegiatan bimbingan dan konseling didasarkan pada norma-norma, baik norma agama, hukum, peraturan, adat istiadat, ilmu pengetahuan, dan kebiasaan-kebiasaan yang berlaku. Bahkan lebih jauh lagi, melalui segenap layanan/kegiatan bimbingan dan konseling ini harus dapat meningkatkan kemampuan peserta didik (klien) dalam memahami, menghayati, dan mengamalkan norma-norma tersebut.',
    icon: <Shield className="w-6 h-6" />,
    color: 'bg-teal-500'
  },
  {
    id: 'keahlian',
    name: 'Asas Keahlian',
    description: 'Asas yang menghendaki agar layanan dan kegiatan bimbingan dan konseling diselenggarakan atas dasar kaidah-kaidah profesional. Dalam hal ini, para pelaksana layanan dan kegiatan bimbingan dan konseling hendaknya tenaga yang benar-benar ahli dalam bidang bimbingan dan konseling.',
    icon: <CheckCircle className="w-6 h-6" />,
    color: 'bg-orange-500'
  },
  {
    id: 'alih_tangan_kasus',
    name: 'Asas Alih Tangan Kasus',
    description: 'Asas yang menghendaki agar pihak-pihak yang tidak mampu menyelenggarakan layanan bimbingan dan konseling secara tepat dan tuntas atas suatu permasalahan peserta didik (klien) mengalihtangankan permasalahan itu kepada pihak yang lebih ahli. Guru BK dapat menerima alih tangan kasus dari orang tua, guru-guru lain, atau ahli lain. Demikian pula, guru BK dapat mengalihtangankan kasus kepada pihak yang lebih kompeten, baik di dalam maupun di luar sekolah.',
    icon: <RefreshCcw className="w-6 h-6" />,
    color: 'bg-fuchsia-500'
  },
  {
    id: 'tut_wuri_handayani',
    name: 'Asas Tut Wuri Handayani',
    description: 'Asas yang menghendaki agar pelayanan bimbingan dan konseling secara keseluruhan dapat menciptakan suasana mengayomi (memberikan rasa aman), mengembangkan keteladanan, dan memberikan dorongan, serta kesempatan yang seluas-luasnya kepada peserta didik (klien) untuk maju.',
    icon: <Heart className="w-6 h-6" />,
    color: 'bg-sky-500'
  }
];

const AsasBK: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredAsas = asasData.filter(asas => 
    asas.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    asas.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm border border-white/10">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-amber-400">ASAS BIMBINGAN DAN KONSELING</h1>
              <p className="text-indigo-100 text-sm font-medium mt-0.5">Pondasi Utama Pelayanan Profesional Guru BK</p>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 mt-4">
            <p className="text-xs leading-relaxed text-indigo-50">
              Keterlaksanaan dan keberhasilan pelayanan bimbingan dan konseling sangat ditentukan oleh diwujudkannya asas-asas berikut. Asas-asas ini merupakan jiwa dan nafas dari seluruh kehidupan pelayanan bimbingan dan konseling. Apabila asas-asas ini tidak dijalankan dengan baik, maka penyelenggaraan bimbingan dan konseling akan berjalan tersendat-sendat atau bahkan terhenti sama sekali.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-5">
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            12 Asas BK
          </h2>
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari asas..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredAsas.map((asas) => (
            <div 
              key={asas.id} 
              className={`border border-slate-200 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-md hover:border-indigo-200 bg-white ${expandedId === asas.id ? 'ring-2 ring-indigo-500/20 shadow-md' : ''}`}
            >
              <div 
                className="p-4 cursor-pointer flex items-start gap-3"
                onClick={() => toggleExpand(asas.id)}
              >
                <div className={`p-2 rounded-lg text-white shadow-sm shrink-0 ${asas.color}`}>
                  {React.cloneElement(asas.icon as React.ReactElement, { className: "w-5 h-5" })}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 text-sm mb-1">{asas.name}</h3>
                  <p className={`text-[11px] leading-relaxed text-slate-500 transition-all duration-300 ${expandedId === asas.id ? '' : 'line-clamp-2'}`}>
                    {asas.description}
                  </p>
                </div>
                <div className="shrink-0 mt-0.5 text-slate-400">
                  {expandedId === asas.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </div>
          ))}
          
          {filteredAsas.length === 0 && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Search className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm font-bold">Tidak ada asas yang sesuai dengan pencarian.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AsasBK;
