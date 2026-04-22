import { AKPDQuestion, SOP } from './types';

export const EXAMPLE_SOPS: SOP[] = [
  {
    id: '1',
    title: 'SOP Konseling Individu',
    category: 'Konseling',
    description: 'Prosedur standar untuk melakukan konseling individu.',
    content: '1. Penerimaan siswa.\n2. Identifikasi masalah.\n3. Diagnosis.\n4. Prognosis.\n5. Treatment/Konseling.\n6. Evaluasi dan tindak lanjut.'
  },
  {
    id: '2',
    title: 'SOP Bimbingan Klasikal',
    category: 'Bimbingan',
    description: 'Prosedur standar untuk pelaksanaan bimbingan klasikal di kelas.',
    content: '1. Persiapan materi dan media.\n2. Pembukaan (ice breaking).\n3. Penyampaian materi.\n4. Diskusi/Tanya jawab.\n5. Penutup dan refleksi.'
  },
  {
    id: '3',
    title: 'SOP Penanganan Siswa Bermasalah',
    category: 'Administrasi',
    description: 'Prosedur penanganan siswa yang melanggar aturan sekolah.',
    content: '1. Pemanggilan siswa.\n2. Wawancara dan klarifikasi.\n3. Pemberian arahan/sanksi edukatif.\n4. Pencatatan dalam buku kasus.\n5. Komunikasi dengan orang tua.'
  }
];

export const AKPD_QUESTIONS: AKPDQuestion[] = [
  // Pribadi (1-15)
  { id: 1, text: "Saya merasa sulit mengendalikan emosi (marah/sedih).", aspect: "Pribadi" },
  { id: 2, text: "Saya merasa kurang percaya diri tampil di depan umum.", aspect: "Pribadi" },
  { id: 3, text: "Saya sering merasa cemas menghadapi masa depan.", aspect: "Pribadi" },
  { id: 4, text: "Saya sulit mengambil keputusan sendiri.", aspect: "Pribadi" },
  { id: 5, text: "Saya merasa kurang mengenal potensi diri saya.", aspect: "Pribadi" },
  { id: 6, text: "Saya sering merasa kesepian meskipun di tengah keramaian.", aspect: "Pribadi" },
  { id: 7, text: "Saya sulit mengatur waktu antara hobi dan kewajiban.", aspect: "Pribadi" },
  { id: 8, text: "Saya merasa kurang bersyukur dengan keadaan fisik saya.", aspect: "Pribadi" },
  { id: 9, text: "Saya sering menunda-nunda pekerjaan yang seharusnya diselesaikan.", aspect: "Pribadi" },
  { id: 10, text: "Saya merasa sulit memaafkan kesalahan diri sendiri.", aspect: "Pribadi" },
  { id: 11, text: "Saya merasa kesulitan mengendalikan emosi saat marah.", aspect: "Pribadi" },
  { id: 12, text: "Saya sering merasa cemas tanpa alasan yang jelas.", aspect: "Pribadi" },
  { id: 13, text: "Saya merasa kurang termotivasi untuk mengembangkan bakat saya.", aspect: "Pribadi" },
  { id: 14, text: "Saya sering merasa tidak berharga dibandingkan orang lain.", aspect: "Pribadi" },
  { id: 15, text: "Saya merasa sulit beradaptasi dengan perubahan yang mendadak.", aspect: "Pribadi" },
  // Sosial (16-25)
  { id: 16, text: "Saya merasa sulit bergaul dengan teman baru.", aspect: "Sosial" },
  { id: 17, text: "Saya sering merasa dikucilkan oleh teman sekelas.", aspect: "Sosial" },
  { id: 18, text: "Saya sulit menyampaikan pendapat dalam diskusi kelompok.", aspect: "Sosial" },
  { id: 19, text: "Saya merasa kurang nyaman berada di lingkungan baru.", aspect: "Sosial" },
  { id: 20, text: "Saya sering terlibat konflik dengan teman.", aspect: "Sosial" },
  { id: 21, text: "Saya merasa sulit menolak ajakan teman yang negatif.", aspect: "Sosial" },
  { id: 22, text: "Saya merasa kurang mendapat perhatian dari orang tua.", aspect: "Sosial" },
  { id: 23, text: "Saya sering merasa diperlakukan tidak adil oleh orang lain.", aspect: "Sosial" },
  { id: 24, text: "Saya sulit memahami perasaan orang lain (empati).", aspect: "Sosial" },
  { id: 25, text: "Saya merasa kurang mampu bekerja sama dalam tim.", aspect: "Sosial" },
  // Belajar (26-40)
  { id: 26, text: "Saya sulit berkonsentrasi saat guru menjelaskan pelajaran.", aspect: "Belajar" },
  { id: 27, text: "Saya merasa malas belajar untuk mata pelajaran tertentu.", aspect: "Belajar" },
  { id: 28, text: "Saya tidak memiliki jadwal belajar yang teratur di rumah.", aspect: "Belajar" },
  { id: 29, text: "Saya merasa terbebani dengan banyaknya tugas sekolah.", aspect: "Belajar" },
  { id: 30, text: "Saya sulit memahami materi pelajaran yang bersifat hitungan.", aspect: "Belajar" },
  { id: 31, text: "Saya merasa takut menghadapi ujian atau ulangan.", aspect: "Belajar" },
  { id: 32, text: "Saya tidak tahu cara belajar yang efektif bagi diri saya.", aspect: "Belajar" },
  { id: 33, text: "Saya merasa fasilitas belajar di rumah kurang mendukung.", aspect: "Belajar" },
  { id: 34, text: "Saya sering mengantuk saat jam pelajaran berlangsung.", aspect: "Belajar" },
  { id: 35, text: "Saya merasa kurang motivasi untuk meraih prestasi akademik.", aspect: "Belajar" },
  { id: 36, text: "Saya kesulitan memahami penjelasan guru di kelas.", aspect: "Belajar" },
  { id: 37, text: "Saya merasa gaya belajar saya belum efektif.", aspect: "Belajar" },
  { id: 38, text: "Saya mudah kehilangan konsentrasi saat belajar sendiri.", aspect: "Belajar" },
  { id: 39, text: "Saya merasa kesulitan dalam menghadapi ujian atau ulangan.", aspect: "Belajar" },
  { id: 40, text: "Saya sering merasa kewalahan dengan materi pelajaran yang banyak.", aspect: "Belajar" },
  // Karier (41-50)
  { id: 41, text: "Saya belum tahu cita-cita yang ingin saya raih.", aspect: "Karier" },
  { id: 42, text: "Saya bingung memilih jurusan setelah lulus sekolah nanti.", aspect: "Karier" },
  { id: 43, text: "Saya kurang tahu informasi tentang dunia kerja.", aspect: "Karier" },
  { id: 44, text: "Saya merasa pilihan karier saya ditentukan oleh orang tua.", aspect: "Karier" },
  { id: 45, text: "Saya tidak tahu bakat apa yang menonjol dalam diri saya.", aspect: "Karier" },
  { id: 46, text: "Saya ingin tahu lebih banyak tentang jenis-jenis profesi.", aspect: "Karier" },
  { id: 47, text: "Saya merasa ragu dengan kemampuan saya untuk sukses.", aspect: "Karier" },
  { id: 48, text: "Saya belum tahu sekolah lanjutan yang sesuai dengan minat.", aspect: "Karier" },
  { id: 49, text: "Saya ingin tahu cara membuat perencanaan karier yang baik.", aspect: "Karier" },
  { id: 50, text: "Saya merasa kurang informasi tentang beasiswa pendidikan.", aspect: "Karier" },
];
