import React, { useState } from 'react';
import { BookOpen, Search, ArrowRight, Info, Languages, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewMode } from '../types';

interface DictionaryEntry {
  term: string;
  definition: string;
  category: string;
  detailedExplanation?: string;
}

const dictionaryData: DictionaryEntry[] = [
  {
    term: 'Abnormalitas',
    definition: 'Kondisi psikologis yang menyimpang dari norma-norma umum atau standar kesehatan mental yang berlaku.',
    category: 'Psikologi',
    detailedExplanation: 'Abnormalitas dalam psikologi merujuk pada pola perilaku atau mental yang tidak biasa, menyebabkan penderitaan (distress), atau mengganggu fungsi sehari-hari individu. Penilaian abnormalitas sering melibatkan perbandingan dengan norma statistik, norma sosial, atau kriteria klinis yang ditetapkan dalam buku panduan diagnostik seperti DSM-5.'
  },
  {
    term: 'Acceptance (Penerimaan)',
    definition: 'Sikap konselor yang menerima konseli apa adanya tanpa memberikan penilaian atau syarat tertentu.',
    category: 'Teknik Konseling',
    detailedExplanation: 'Penerimaan (Unconditional Positive Regard) adalah salah satu kondisi inti dalam konseling humanistik Carl Rogers. Ini berarti konselor menghargai konseli sebagai manusia yang berharga tanpa memandang perilaku atau pilihan hidup mereka. Hal ini menciptakan lingkungan aman di mana konseli merasa cukup berharga untuk mengeksplorasi diri tanpa takut dihakimi.'
  },
  {
    term: 'Adiksi',
    definition: 'Ketergantungan fisik atau mental terhadap suatu zat atau aktivitas tertentu yang sulit dihentikan.',
    category: 'Kesehatan Mental',
    detailedExplanation: 'Adiksi melibatkan perubahan dalam sistem otak yang membuat individu terus mencari zat atau perilaku tertentu meskipun mengetahui dampak negatifnya. Ini mencakup toleransi (kebutuhan dosis lebih tinggi), gejala putus zat (withdrawal) saat berhenti, dan kehilangan kontrol atas penggunaan.'
  },
  {
    term: 'Afeksi',
    definition: 'Perasaan atau emosi yang ditunjukkan oleh individu sebagai respon terhadap stimulus tertentu.',
    category: 'Psikologi',
    detailedExplanation: 'Afeksi mencakup spektrum luas dari emosi, perasaan, dan suasana hati (mood). Dalam konteks konseling, memahami afeksi konseli membantu konselor mengenali bagaimana individu memproses pengalaman hidup mereka secara emosional.'
  },
  {
    term: 'Akomodasi',
    definition: 'Proses penyesuaian diri atau struktur kognitif untuk menerima informasi atau pengalaman baru.',
    category: 'Perkembangan',
    detailedExplanation: 'Konsep dari Jean Piaget. Ketika informasi baru tidak cocok dengan skema yang ada, individu harus mengubah skema tersebut (akomodasi) agar informasi baru dapat dipahami. Ini adalah bagian fundamental dari proses belajar dan perkembangan kognitif.'
  },
  {
    term: 'Aktualisasi Diri',
    definition: 'Kebutuhan tertinggi manusia untuk mengembangkan seluruh potensi dan bakat yang dimilikinya secara maksimal.',
    category: 'Humanistik',
    detailedExplanation: 'Puncak dari hierarki kebutuhan Abraham Maslow. Aktualisasi diri bukan tentang menjadi sempurna, melainkan menjadi versi terbaik dari diri sendiri, hidup dengan tujuan, kreativitas, dan penerimaan diri yang tinggi.'
  },
  {
    term: 'Aliansi Terapeutik',
    definition: 'Hubungan kerjasama yang saling percaya antara konselor dan konseli untuk mencapai tujuan konseling.',
    category: 'Proses Konseling',
    detailedExplanation: 'Aliansi terapeutik adalah prediktor terkuat keberhasilan konseling. Terdiri dari tiga elemen: kesepakatan tujuan (goals), pembagian tugas (tasks), dan ikatan emosional (bond) yang kuat antara konselor dan konseli.'
  },
  {
    term: 'Ambang Pintu (Threshold)',
    definition: 'Titik minimum stimulus yang diperlukan untuk menghasilkan respon atau kesadaran pada individu.',
    category: 'Psikologi',
    detailedExplanation: 'Dalam psikofisika, ambang pintu (threshold) adalah intensitas stimulus terendah yang dapat dideteksi oleh indra manusia. Ini menjelaskan mengapa beberapa rangsangan tidak kita sadari, sementara yang lain memicu respon.'
  },
  {
    term: 'Ambivalensi',
    definition: 'Kondisi di mana individu memiliki perasaan atau pikiran yang bertentangan terhadap objek atau situasi yang sama.',
    category: 'Psikologi',
    detailedExplanation: 'Ambivalensi sering terjadi saat seseorang membuat keputusan besar. Misalnya, perasaan takut sekaligus bersemangat saat memulai pekerjaan baru. Dalam konseling, mengenali ambivalensi membantu konseli memahami konflik internal mereka.'
  },
  {
    term: 'Amnesia',
    definition: 'Gangguan ingatan yang menyebabkan hilangnya memori sebagian atau seluruhnya akibat trauma atau penyakit.',
    category: 'Kesehatan Mental',
    detailedExplanation: 'Amnesia bisa bersifat retrograde (lupa masa lalu) atau anterograde (sulit membentuk memori baru). Penyebabnya bisa organik (cedera otak, penyakit) atau psikogenik (trauma emosional berat).'
  },
  {
    term: 'Analisis Transaksional',
    definition: 'Teori kepribadian dan metode psikoterapi yang berfokus pada interaksi sosial dan status ego (Orang Tua, Dewasa, Anak).',
    category: 'Teori Konseling',
    detailedExplanation: 'Dikembangkan oleh Eric Berne. AT membantu individu memahami bagaimana mereka berkomunikasi dengan orang lain berdasarkan status ego mereka, dan bagaimana mereka dapat mengubah pola komunikasi yang tidak sehat menjadi lebih produktif.'
  },
  {
    term: 'Anamnesa',
    definition: 'Kegiatan pengumpulan data atau riwayat hidup konseli melalui wawancara mendalam.',
    category: 'Asesmen',
    detailedExplanation: 'Anamnesa bertujuan mendapatkan gambaran komprehensif tentang latar belakang konseli, termasuk riwayat keluarga, pendidikan, kesehatan, dan masalah yang dihadapi saat ini, sebagai dasar perencanaan intervensi.'
  },
  {
    term: 'Anxiety (Kecemasan)',
    definition: 'Perasaan tidak tenang, khawatir, atau takut yang berlebihan terhadap sesuatu yang belum pasti terjadi.',
    category: 'Kesehatan Mental',
    detailedExplanation: 'Kecemasan adalah respon alami tubuh terhadap stres, tetapi menjadi gangguan jika intensitasnya berlebihan, berlangsung lama, dan mengganggu fungsi hidup sehari-hari. Berbeda dengan rasa takut yang memiliki objek jelas, kecemasan sering kali tidak memiliki objek yang spesifik.'
  },
  {
    term: 'Apatis',
    definition: 'Sikap acuh tak acuh atau kurangnya minat dan emosi terhadap situasi atau lingkungan sekitar.',
    category: 'Psikologi',
    detailedExplanation: 'Apatis sering kali merupakan mekanisme pertahanan diri atau gejala dari kondisi kesehatan mental seperti depresi. Ini ditandai dengan kurangnya motivasi, energi, atau keterlibatan emosional dalam aktivitas yang biasanya menyenangkan.'
  },
  {
    term: 'Asertif',
    definition: 'Kemampuan untuk mengekspresikan pikiran dan perasaan secara jujur dan terbuka tanpa melanggar hak orang lain.',
    category: 'Keterampilan Sosial',
    detailedExplanation: 'Perilaku asertif berada di tengah antara pasif (mengabaikan hak sendiri) dan agresif (mengabaikan hak orang lain). Ini melibatkan penggunaan "I-statements" untuk menyampaikan kebutuhan dengan hormat namun tegas.'
  },
  {
    term: 'Asesmen',
    definition: 'Proses sistematis untuk mengumpulkan informasi guna memahami masalah, potensi, dan kebutuhan konseli.',
    category: 'Asesmen',
    detailedExplanation: 'Asesmen dapat menggunakan berbagai metode seperti tes psikologi, wawancara, observasi, atau inventori. Hasil asesmen menjadi dasar bagi konselor untuk menentukan strategi intervensi yang paling tepat.'
  },
  {
    term: 'Asimilasi',
    definition: 'Proses penggabungan informasi baru ke dalam skema atau pemahaman yang sudah ada sebelumnya.',
    category: 'Perkembangan',
    detailedExplanation: 'Konsep dari Jean Piaget. Asimilasi terjadi ketika kita menafsirkan pengalaman baru menggunakan konsep yang sudah kita miliki. Ini adalah cara kita memahami dunia tanpa harus mengubah cara berpikir kita secara mendasar.'
  },
  {
    term: 'Atensi',
    definition: 'Pemusatan energi psikis atau perhatian terhadap suatu objek atau aktivitas tertentu.',
    category: 'Psikologi',
    detailedExplanation: 'Atensi adalah sumber daya kognitif yang terbatas. Kita tidak bisa memperhatikan segalanya sekaligus. Kemampuan untuk memfokuskan atensi sangat penting untuk belajar, bekerja, dan berinteraksi secara efektif.'
  },
  {
    term: 'Attending',
    definition: 'Keterampilan konselor untuk memberikan perhatian penuh secara fisik dan psikologis kepada konseli.',
    category: 'Teknik Konseling',
    detailedExplanation: 'Attending melibatkan kontak mata, postur tubuh yang terbuka, mengangguk, dan respon verbal yang menunjukkan konselor benar-benar hadir dan mendengarkan konseli. Ini adalah fondasi dari aliansi terapeutik.'
  },
  {
    term: 'Bakat (Aptitude)',
    definition: 'Kemampuan bawaan yang merupakan potensi yang masih perlu dikembangkan untuk mencapai kecakapan tertentu.',
    category: 'Bimbingan Karier',
    detailedExplanation: 'Bakat berbeda dengan minat. Bakat adalah kapasitas potensial untuk mempelajari keterampilan tertentu dengan lebih cepat atau lebih baik daripada orang lain. Mengidentifikasi bakat membantu dalam perencanaan karier dan pendidikan.'
  },
  {
    term: 'Behaviorisme',
    definition: 'Aliran psikologi yang menekankan pada perilaku yang tampak dan dapat diukur sebagai hasil belajar.',
    category: 'Teori Konseling',
    detailedExplanation: 'Behaviorisme berfokus pada hubungan antara stimulus dan respon. Tokoh utamanya termasuk B.F. Skinner dan John B. Watson. Dalam konseling, pendekatan ini digunakan untuk memodifikasi perilaku maladaptif melalui penguatan (reinforcement) atau penghapusan (extinction).'
  },
  {
    term: 'Biblioterapi',
    definition: 'Penggunaan buku atau bahan bacaan sebagai sarana untuk membantu memecahkan masalah psikologis.',
    category: 'Teknik Konseling',
    detailedExplanation: 'Konselor merekomendasikan buku tertentu yang relevan dengan masalah konseli. Membaca cerita atau informasi tentang masalah serupa membantu konseli mendapatkan perspektif baru, merasa tidak sendirian, dan menemukan strategi pemecahan masalah.'
  },
  {
    term: 'Bimbingan Kelompok',
    definition: 'Layanan bimbingan yang diberikan kepada sejumlah individu dalam suasana kelompok untuk membahas topik umum.',
    category: 'Layanan BK',
    detailedExplanation: 'Tujuannya adalah untuk memberikan informasi, mengembangkan keterampilan sosial, atau membahas topik-topik preventif (seperti bahaya narkoba atau manajemen waktu) dalam suasana yang mendukung dan interaktif.'
  },
  {
    term: 'Burnout',
    definition: 'Kondisi kelelahan fisik, emosional, dan mental yang ekstrem akibat stres yang berkepanjangan.',
    category: 'Kesehatan Mental',
    detailedExplanation: 'Burnout sering terjadi di lingkungan kerja atau pendidikan. Gejalanya meliputi perasaan sinis, kurangnya pencapaian, dan perasaan tidak berdaya. Ini berbeda dengan stres biasa karena burnout melibatkan rasa kehilangan makna atau motivasi.'
  },
  {
    term: 'Catharsis (Katarsis)',
    definition: 'Pelepasan emosi yang terpendam untuk mengurangi ketegangan psikis melalui ekspresi perasaan.',
    category: 'Proses Konseling',
    detailedExplanation: 'Katarsis memungkinkan konseli untuk mengeluarkan emosi yang selama ini ditekan, seperti kemarahan, kesedihan, atau ketakutan, dalam lingkungan aman. Ini sering menjadi titik balik dalam proses konseling.'
  },
  {
    term: 'Cognitive Restructuring',
    definition: 'Teknik untuk mengubah pola pikir negatif atau irasional menjadi pola pikir yang lebih positif dan rasional.',
    category: 'CBT',
    detailedExplanation: 'Bagian utama dari Cognitive Behavioral Therapy (CBT). Teknik ini melibatkan identifikasi "pikiran otomatis" yang negatif, menantang kebenarannya dengan bukti, dan menggantinya dengan pikiran yang lebih seimbang dan adaptif.'
  },
  {
    term: 'Confidentiality (Kerahasiaan)',
    definition: 'Asas bimbingan konseling yang menuntut konselor untuk menjaga rahasia data dan keterangan konseli.',
    category: 'Etika Profesi',
    detailedExplanation: 'Kerahasiaan adalah hak konseli dan kewajiban etis konselor. Tanpa jaminan kerahasiaan, konseli tidak akan merasa aman untuk terbuka. Pengecualian hanya berlaku jika ada ancaman bahaya bagi diri sendiri atau orang lain.'
  },
  {
    term: 'Coping Mechanism',
    definition: 'Cara atau strategi yang digunakan individu untuk menghadapi dan mengatasi stres atau masalah.',
    category: 'Psikologi',
    detailedExplanation: 'Coping bisa bersifat adaptif (seperti berolahraga, mencari dukungan sosial) atau maladaptif (seperti menghindari masalah, penggunaan zat). Membantu konseli mengembangkan coping mechanism yang adaptif adalah tujuan utama konseling.'
  },
  {
    term: 'Counseling (Konseling)',
    definition: 'Hubungan profesional antara konselor dan konseli untuk membantu konseli memecahkan masalah dan mengembangkan potensi.',
    category: 'Dasar BK',
    detailedExplanation: 'Konseling bukan sekadar memberi nasihat. Ini adalah proses kolaboratif di mana konselor menggunakan keterampilan profesional untuk memfasilitasi pertumbuhan, pemecahan masalah, dan perubahan perilaku konseli.'
  },
  {
    term: 'Defense Mechanism',
    definition: 'Cara tidak sadar yang digunakan individu untuk melindungi diri dari kecemasan (misal: proyeksi, regresi).',
    category: 'Psikoanalisis',
    detailedExplanation: 'Mekanisme pertahanan diri (seperti penyangkalan, rasionalisasi) adalah cara ego melindungi diri dari pikiran atau perasaan yang menyakitkan. Meskipun berguna dalam jangka pendek, penggunaan berlebihan dapat menghambat pertumbuhan pribadi.'
  },
  {
    term: 'Depresi',
    definition: 'Gangguan suasana hati yang ditandai dengan perasaan sedih yang mendalam, kehilangan minat, dan keputusasaan.',
    category: 'Kesehatan Mental',
    detailedExplanation: 'Depresi klinis berbeda dari kesedihan biasa. Ini melibatkan perubahan fisik (tidur, nafsu makan) dan kognitif (sulit konsentrasi, pikiran bunuh diri) yang berlangsung setidaknya selama dua minggu.'
  },
  {
    term: 'Dinamika Kelompok',
    definition: 'Interaksi dan hubungan timbal balik antar anggota kelompok yang mempengaruhi perilaku kelompok.',
    category: 'Layanan BK',
    detailedExplanation: 'Memahami dinamika kelompok membantu konselor mengelola proses konseling kelompok, seperti bagaimana kepemimpinan muncul, bagaimana konflik diselesaikan, dan bagaimana kohesi kelompok terbentuk.'
  },
  {
    term: 'Ego',
    definition: 'Bagian dari kepribadian yang berfungsi sebagai penengah antara dorongan insting dan realitas dunia luar.',
    category: 'Psikoanalisis',
    detailedExplanation: 'Konsep Freud. Ego bekerja berdasarkan "prinsip realitas". Tugasnya adalah memuaskan keinginan Id dengan cara yang dapat diterima oleh dunia nyata dan sesuai dengan moral Superego.'
  },
  {
    term: 'Empati',
    definition: 'Kemampuan untuk memahami dan merasakan apa yang dirasakan orang lain dari sudut pandang orang tersebut.',
    category: 'Teknik Konseling',
    detailedExplanation: 'Empati berbeda dengan simpati. Simpati adalah merasa kasihan, sedangkan empati adalah "berjalan di sepatu orang lain". Ini melibatkan pemahaman kognitif dan resonansi emosional terhadap pengalaman konseli.'
  },
  {
    term: 'Extinction (Pemadaman)',
    definition: 'Proses pengurangan atau penghilangan perilaku dengan cara tidak memberikan penguatan lagi.',
    category: 'Behavioristik',
    detailedExplanation: 'Jika perilaku yang sebelumnya diperkuat (misalnya, anak yang menangis untuk mendapatkan permen) tidak lagi mendapatkan penguatan (permen tidak diberikan), maka perilaku tersebut lambat laun akan berkurang dan hilang.'
  },
  {
    term: 'Fobia',
    definition: 'Ketakutan yang berlebihan dan tidak rasional terhadap objek atau situasi tertentu.',
    category: 'Kesehatan Mental',
    detailedExplanation: 'Fobia menyebabkan kecemasan ekstrem dan penghindaran aktif terhadap objek atau situasi pemicu. Ini sangat membatasi kehidupan konseli jika tidak ditangani.'
  },
  {
    term: 'Genuineness (Keaslian)',
    definition: 'Sikap jujur dan apa adanya dari konselor dalam berinteraksi dengan konseli tanpa kepura-puraan.',
    category: 'Teknik Konseling',
    detailedExplanation: 'Konselor yang otentik tidak bersembunyi di balik peran profesional. Mereka jujur dengan perasaan mereka sendiri dalam batas-batas etika, yang mendorong konseli untuk juga menjadi jujur dan otentik.'
  },
  {
    term: 'Gestalt',
    definition: 'Pendekatan konseling yang menekankan pada kesadaran saat ini dan keutuhan pengalaman individu.',
    category: 'Teori Konseling',
    detailedExplanation: 'Gestalt berfokus pada "di sini dan sekarang" (here and now). Tekniknya sering kali eksperiensial, bertujuan membantu konseli menyadari bagaimana mereka menghambat diri mereka sendiri dan menjadi lebih utuh.'
  },
  {
    term: 'Home Visit (Kunjungan Rumah)',
    definition: 'Kegiatan untuk memperoleh data dan keterangan tentang konseli dengan mengunjungi tempat tinggalnya.',
    category: 'Layanan BK',
    detailedExplanation: 'Home visit memberikan konteks penting tentang lingkungan keluarga, kondisi ekonomi, dan pola asuh konseli yang tidak selalu terlihat di sekolah. Ini sangat berguna untuk masalah yang berakar dari rumah.'
  },
  {
    term: 'Id',
    definition: 'Bagian kepribadian yang berisi dorongan insting dasar dan bekerja berdasarkan prinsip kesenangan.',
    category: 'Psikoanalisis',
    detailedExplanation: 'Konsep Freud. Id bersifat tidak sadar, impulsif, dan menuntut kepuasan segera. Id tidak peduli dengan realitas, moralitas, atau konsekuensi.'
  },
  {
    term: 'Identifikasi',
    definition: 'Proses di mana individu meniru atau mengambil alih ciri-ciri orang lain ke dalam kepribadiannya sendiri.',
    category: 'Psikologi',
    detailedExplanation: 'Identifikasi sering terjadi pada masa kanak-kanak (misalnya, mengidentifikasi diri dengan orang tua). Ini adalah mekanisme penting dalam pembentukan identitas dan kepribadian.'
  },
  {
    term: 'Insight (Pemahaman Diri)',
    definition: 'Kesadaran mendalam yang diperoleh konseli tentang penyebab atau arti dari perilakunya sendiri.',
    category: 'Proses Konseling',
    detailedExplanation: 'Insight bukan sekadar tahu "apa" yang terjadi, tapi memahami "mengapa" dan "bagaimana" pola perilaku tersebut terbentuk. Insight adalah langkah awal menuju perubahan perilaku yang permanen.'
  },
  {
    term: 'Inteligensi (IQ)',
    definition: 'Kemampuan umum individu untuk bertindak secara terarah, berpikir rasional, dan menghadapi lingkungan secara efektif.',
    category: 'Psikologi',
    detailedExplanation: 'IQ mencakup kemampuan penalaran, pemecahan masalah, pemahaman bahasa, dan pembelajaran. Meskipun penting, IQ bukan satu-satunya penentu kesuksesan hidup; faktor emosional dan sosial juga berperan besar.'
  },
  {
    term: 'Intervensi',
    definition: 'Tindakan terencana yang dilakukan konselor untuk membantu mengubah kondisi atau perilaku konseli.',
    category: 'Proses Konseling',
    detailedExplanation: 'Intervensi bisa berupa teknik konseling, pemberian informasi, rujukan, atau perubahan lingkungan. Intervensi harus didasarkan pada asesmen yang akurat dan tujuan konseling yang disepakati.'
  },
  {
    term: 'Introvert',
    definition: 'Tipe kepribadian yang cenderung mengarahkan perhatian ke dalam diri sendiri dan lebih suka kesendirian.',
    category: 'Psikologi',
    detailedExplanation: 'Introvert mendapatkan energi dari waktu sendirian dan sering merasa lelah setelah interaksi sosial yang intens. Ini adalah perbedaan temperamen, bukan gangguan kesehatan mental.'
  },
  {
    term: 'Konfrontasi',
    definition: 'Teknik konseling untuk menunjukkan adanya pertentangan antara perkataan dan perbuatan konseli.',
    category: 'Teknik Konseling',
    detailedExplanation: 'Konfrontasi harus dilakukan dengan empati, bukan untuk menyerang. Tujuannya adalah membantu konseli menyadari ketidakkonsistenan mereka agar mereka dapat mengambil tanggung jawab atas perilaku mereka.'
  },
  {
    term: 'Konformitas',
    definition: 'Kecenderungan individu untuk mengubah perilaku atau kepercayaan agar sesuai dengan norma kelompok.',
    category: 'Psikologi Sosial',
    detailedExplanation: 'Konformitas bisa positif (mengikuti aturan sekolah) atau negatif (mengikuti perilaku merusak teman sebaya). Memahami konformitas penting dalam konseling remaja yang sangat dipengaruhi teman sebaya.'
  },
  {
    term: 'Konseli',
    definition: 'Individu yang menerima layanan bimbingan dan konseling dari seorang konselor.',
    category: 'Dasar BK',
    detailedExplanation: 'Istilah "konseli" menekankan posisi individu sebagai mitra aktif dalam proses konseling, bukan objek pasif yang "diperbaiki" oleh konselor.'
  },
  {
    term: 'Konselor',
    definition: 'Tenaga profesional yang memiliki kualifikasi untuk memberikan layanan bimbingan dan konseling.',
    category: 'Dasar BK',
    detailedExplanation: 'Konselor harus memiliki kompetensi akademik, teknis, dan etis. Peran mereka adalah sebagai fasilitator pertumbuhan, bukan pemberi nasihat otoriter.'
  },
  {
    term: 'Locus of Control',
    definition: 'Keyakinan individu tentang sejauh mana mereka dapat mengendalikan peristiwa yang mempengaruhi hidup mereka.',
    category: 'Psikologi',
    detailedExplanation: 'Internal Locus of Control: merasa diri sendiri bertanggung jawab atas hasil hidup. External Locus of Control: merasa hasil hidup ditentukan oleh nasib, keberuntungan, atau orang lain. Internal locus of control umumnya dikaitkan dengan kesehatan mental yang lebih baik.'
  },
  {
    term: 'Minat (Interest)',
    definition: 'Kecenderungan jiwa yang relatif menetap untuk memperhatikan dan mengenang beberapa aktivitas atau objek.',
    category: 'Bimbingan Karier',
    detailedExplanation: 'Minat adalah motivator kuat untuk belajar dan berkarier. Mengidentifikasi minat membantu konseli menemukan bidang yang membuat mereka merasa antusias dan bersemangat.'
  },
  {
    term: 'Motivasi',
    definition: 'Dorongan internal atau eksternal yang menggerakkan individu untuk bertindak mencapai tujuan tertentu.',
    category: 'Psikologi',
    detailedExplanation: 'Motivasi intrinsik (dari dalam diri) biasanya lebih tahan lama daripada motivasi ekstrinsik (hadiah/hukuman). Konseling sering bertujuan meningkatkan motivasi intrinsik konseli untuk berubah.'
  },
  {
    term: 'Narcissism (Narsisme)',
    definition: 'Kecintaan yang berlebihan terhadap diri sendiri dan kebutuhan yang besar untuk dikagumi orang lain.',
    category: 'Kesehatan Mental',
    detailedExplanation: 'Narsisme dalam tingkat klinis (Narcissistic Personality Disorder) ditandai dengan kurangnya empati terhadap orang lain dan rasa kepentingan diri yang sangat tinggi.'
  },
  {
    term: 'Observasi',
    definition: 'Teknik pengumpulan data melalui pengamatan langsung terhadap perilaku atau fenomena tertentu.',
    category: 'Asesmen',
    detailedExplanation: 'Observasi bisa dilakukan secara terstruktur (menggunakan panduan) atau tidak terstruktur. Ini sangat berguna untuk mendapatkan data objektif tentang perilaku konseli dalam situasi nyata.'
  },
  {
    term: 'Paradigma BK',
    definition: 'Pola pikir atau kerangka kerja yang mendasari praktik bimbingan dan konseling.',
    category: 'Dasar BK',
    detailedExplanation: 'Paradigma BK terus berkembang, dari fokus pada pemecahan masalah (remedial) ke fokus pada pengembangan potensi dan pencegahan masalah (preventif dan developmental).'
  },
  {
    term: 'Peer Counseling (Konseling Sebaya)',
    definition: 'Layanan bantuan yang diberikan oleh teman sebaya yang telah dilatih untuk membantu teman lainnya.',
    category: 'Layanan BK',
    detailedExplanation: 'Remaja sering lebih terbuka kepada teman sebaya daripada orang dewasa. Konseling sebaya sangat efektif untuk masalah-masalah sosial atau penyesuaian diri di sekolah.'
  },
  {
    term: 'Psikodinamika',
    definition: 'Studi tentang interaksi antara berbagai bagian pikiran, kepribadian, atau psikis individu.',
    category: 'Psikoanalisis',
    detailedExplanation: 'Psikodinamika menekankan pada pengaruh pengalaman masa kecil dan proses bawah sadar terhadap perilaku saat ini. Ini adalah fondasi dari teori psikoanalisis.'
  },
  {
    term: 'Rapport',
    definition: 'Hubungan yang harmonis, hangat, dan penuh kepercayaan antara konselor dan konseli.',
    category: 'Teknik Konseling',
    detailedExplanation: 'Rapport adalah prasyarat mutlak konseling. Tanpa rapport, konseli tidak akan merasa nyaman untuk berbagi masalah yang paling dalam. Membangun rapport adalah tugas utama di sesi-sesi awal.'
  },
  {
    term: 'Rehabilitasi',
    definition: 'Proses pemulihan kondisi fisik atau mental individu agar dapat berfungsi kembali secara normal dalam masyarakat.',
    category: 'Kesehatan Mental',
    detailedExplanation: 'Rehabilitasi tidak hanya tentang menghilangkan gejala, tetapi juga tentang pemberdayaan individu untuk memiliki kualitas hidup yang baik kembali setelah mengalami gangguan.'
  },
  {
    term: 'Reinforcement (Penguatan)',
    definition: 'Konsekuensi yang meningkatkan kemungkinan terulangnya suatu perilaku di masa depan.',
    category: 'Behavioristik',
    detailedExplanation: 'Penguatan positif (memberikan sesuatu yang disukai) dan penguatan negatif (menghilangkan sesuatu yang tidak disukai) keduanya bertujuan meningkatkan perilaku yang diinginkan.'
  },
  {
    term: 'Self-Esteem (Harga Diri)',
    definition: 'Penilaian atau evaluasi subjektif individu terhadap keberhargaan dirinya sendiri.',
    category: 'Psikologi',
    detailedExplanation: 'Harga diri yang sehat tidak berarti merasa lebih baik dari orang lain, melainkan merasa cukup baik dan berharga sebagai manusia. Harga diri rendah sering menjadi akar dari banyak masalah kesehatan mental.'
  },
  {
    term: 'Sosiometri',
    definition: 'Metode untuk mengukur dan memetakan hubungan sosial atau struktur interaksi dalam suatu kelompok.',
    category: 'Asesmen',
    detailedExplanation: 'Sosiometri membantu konselor melihat siapa yang populer, siapa yang terisolasi, dan bagaimana pola pertemanan dalam sebuah kelas. Ini sangat berguna untuk intervensi dinamika kelompok.'
  },
  {
    term: 'Stres',
    definition: 'Respon fisik atau psikologis terhadap tuntutan lingkungan yang dianggap menekan atau mengancam.',
    category: 'Kesehatan Mental',
    detailedExplanation: 'Stres adalah bagian dari kehidupan. Masalah muncul ketika stres menjadi kronis dan individu tidak memiliki mekanisme coping yang memadai untuk mengelolanya.'
  },
  {
    term: 'Superego',
    definition: 'Bagian kepribadian yang mewakili nilai-nilai moral dan standar ideal masyarakat.',
    category: 'Psikoanalisis',
    detailedExplanation: 'Konsep Freud. Superego adalah "suara hati" yang menuntut kesempurnaan dan sering kali bertentangan dengan dorongan impulsif Id.'
  },
  {
    term: 'Terminasi',
    definition: 'Tahap akhir atau pengakhiran dari proses hubungan konseling antara konselor dan konseli.',
    category: 'Proses Konseling',
    detailedExplanation: 'Terminasi yang baik melibatkan evaluasi kemajuan, pembahasan perasaan tentang perpisahan, dan perencanaan untuk menjaga perubahan yang telah dicapai secara mandiri.'
  },
  {
    term: 'Trauma',
    definition: 'Luka psikologis yang mendalam akibat peristiwa yang sangat mengejutkan atau mengancam jiwa.',
    category: 'Kesehatan Mental',
    detailedExplanation: 'Trauma dapat menyebabkan PTSD (Post-Traumatic Stress Disorder). Penanganan trauma memerlukan pendekatan yang sangat hati-hati dan khusus agar tidak terjadi retraumatisi.'
  },
  {
    term: 'Wawancara Konseling',
    definition: 'Percakapan tatap muka yang memiliki tujuan tertentu antara konselor dan konseli.',
    category: 'Teknik Konseling',
    detailedExplanation: 'Wawancara konseling berbeda dengan percakapan biasa. Ini terstruktur, berfokus pada konseli, dan bertujuan untuk memfasilitasi perubahan, bukan sekadar bertukar informasi.'
  }
];

const CounselingDictionary: React.FC<{ setView: (v: ViewMode) => void }> = ({ setView }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<DictionaryEntry | null>(null);

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const filteredData = dictionaryData.filter(entry => {
    const matchesSearch = entry.term.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         entry.definition.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLetter = selectedLetter ? entry.term.toUpperCase().startsWith(selectedLetter) : true;
    return matchesSearch && matchesLetter;
  }).sort((a, b) => a.term.localeCompare(b.term));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-indigo-600" />
            Kamus <span className="text-indigo-600 italic">BK</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1">Glosarium istilah populer dan terkini dalam dunia Bimbingan dan Konseling.</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari istilah atau definisi..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm font-medium"
          />
        </div>
      </div>

      {/* Alphabet Filter */}
      <div className="flex flex-wrap gap-1 justify-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <button
          onClick={() => setSelectedLetter(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${!selectedLetter ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
        >
          SEMUA
        </button>
        {alphabet.map(letter => (
          <button
            key={letter}
            onClick={() => setSelectedLetter(letter)}
            className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${selectedLetter === letter ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
          >
            {letter}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filteredData.length > 0 ? (
            filteredData.map((entry, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                key={entry.term}
                className="p-6 hover:bg-slate-50 transition-colors group"
              >
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                        {entry.term}
                      </h3>
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded uppercase tracking-widest">
                        {entry.category}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-sm font-medium mb-4">
                      {entry.definition}
                    </p>
                    {entry.detailedExplanation && (
                      <button
                        onClick={() => setSelectedEntry(entry)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline uppercase tracking-widest cursor-pointer"
                      >
                        Pelajari Lebih Lanjut
                      </button>
                    )}
                  </div>
                  <div className="hidden md:block">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all">
                      <Languages className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="p-20 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Istilah tidak ditemukan</h3>
              <p className="text-slate-500 text-sm mt-1">Coba gunakan kata kunci lain atau pilih huruf yang berbeda.</p>
              <button 
                onClick={() => { setSearchTerm(''); setSelectedLetter(null); }}
                className="mt-6 px-6 py-2 bg-indigo-600 text-white text-xs font-black rounded-xl hover:bg-indigo-700 transition-all shadow-lg uppercase tracking-widest"
              >
                Reset Pencarian
              </button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedEntry(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">{selectedEntry.term}</h3>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <p className="text-gray-700 mb-4">{selectedEntry.definition}</p>
                {selectedEntry.detailedExplanation && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">Penjelasan Detail</h4>
                    <p className="text-sm text-blue-800 leading-relaxed">
                      {selectedEntry.detailedExplanation}
                    </p>
                  </div>
                )}
              </div>
              <div className="p-4 border-t flex justify-end">
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
            <Sparkles className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h4 className="text-sm font-black text-indigo-900 uppercase tracking-tight">Kamus Digital BK</h4>
            <p className="text-xs text-indigo-700 font-medium">Menyediakan {dictionaryData.length} istilah bimbingan konseling profesional.</p>
          </div>
        </div>
        <button 
          onClick={() => setView(ViewMode.HOME)}
          className="px-6 py-2.5 bg-white text-indigo-600 text-xs font-black rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-200 uppercase tracking-widest flex items-center gap-2"
        >
          Kembali ke Dashboard <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default CounselingDictionary;
