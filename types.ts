
export interface AcademicEvent {
  id: string;
  date: string; // ISO string YYYY-MM-DD
  endDate?: string; // ISO string YYYY-MM-DD for multi-day events
  title: string;
  type: 'pembelajaran' | 'libur' | 'lainnya' | 'mgbk' | 'ujian' | 'libur_sekolah' | 'dinas_dalam' | 'dinas_luar' | 'pelatihan' | 'daring';
  description?: string;
  reminder?: boolean;
}

export interface Sociometry {
  id: string;
  className: string;
  surveyDate: string;
  criteria: string;
  choices: {
    chooserStudentId: string;
    studentId: string;
    choiceType: 'positive' | 'negative';
    reason: string;
  }[];
}

export interface SubjectDefinition {
  id: string;
  label: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  certificateUrl?: string; // base64 or URL
  notes?: string;
}

export interface TeacherData {
  name: string;
  nip: string;
  school: string;
  schoolAddress: string;
  academicYear: string;
  accessPassword?: string;
  schoolPassword?: string;
  photo?: string;
  logoGov?: string;
  logoSchool?: string;
  approved?: boolean;
  govOrFoundation?: string;
  deptOrFoundation?: string;
  city?: string;
  approvalDate?: string;
  principalName?: string;
  principalNip?: string;
  phone?: string;
  orgDiagram?: string;
  googleFormUrl?: string;
  subjects?: SubjectDefinition[];
  certifications?: Certification[];
}

export interface FirebaseConfig {
  apiKey: string;
  projectId: string;
  appId: string;
  messagingSenderId?: string;
  authDomain?: string;
  firestoreDatabaseId?: string;
}

export interface Student {
  id: string;
  studentCode: string;
  photo: string;
  nis: string;
  nisn: string;
  name: string;
  gender: 'Laki-laki' | 'Perempuan' | '';
  className: string;
  attendanceNumber?: string; // Nomor Absen
  address: string;
  phone: string;
  status?: 'Aktif' | 'Non-Aktif' | 'Mutasi Keluar' | '';
  // Field Tambahan Buku Pribadi
  nickname?: string;
  domicile?: 'Dalam Kota' | 'Luar Kota' | '';
  birthPlace?: string;
  birthDate?: string;
  religion?: string;
  bloodType?: string;
  height?: string;
  weight?: string;
  siblingsCount?: string;
  birthOrder?: string;
  hobby?: string;
  ambition?: string;
  furtherSchool?: 'SMA' | 'SMK' | 'MAN' | 'Kursus' | 'Lainnya' | '';
  previousSchool?: string;
  favoriteSubject?: string;
  dislikedSubject?: string;
  achievements?: string;
  extracurricular?: string;
  livingWith?: 'Kedua Orang Tua' | 'Ayah' | 'Ibu' | 'Saudara' | 'Kakek/ Nenek' | 'Orang Lain' | 'Panti Asuhan' | '';
  bestFriend?: string;
  specialHealthNote?: string; // Penyakit Khusus
  homeroomTeacher?: string; // Nama Wali Kelas
  childStatus?: 'Orang Tua Lengkap' | 'Yatim' | 'Piatu' | 'Yatim-Piatu' | ''; // Status Anak
  // Data Orang Tua Spesifik
  fatherName?: string;
  fatherPhone?: string;
  fatherJob?: string;
  fatherEducation?: string;
  fatherReligion?: string;
  motherName?: string;
  motherPhone?: string;
  motherJob?: string;
  motherEducation?: string;
  motherReligion?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianJob?: string;
  guardianAddress?: string;
  // Atribut untuk kompatibilitas Database Umum
  parentName?: string;
  parentPhoneWA?: string;
  parentJob?: string;
  parentAddress: string; // Alamat Orang Tua / Wali
  notes: string;
  academicYear?: string;
  semester1Note?: string;
  semester2Note?: string;
  lastSync?: string;
}

export interface CounselingGroup {
  id: string;
  name: string;
  className: string;
  studentIds: string[];
  academicYear?: string;
}

export type ServiceComponent = 
  | 'Layanan Dasar' 
  | 'Layanan Responsif' 
  | 'Peminatan dan Perencanaan Individu' 
  | 'Dukungan Sistem';

export type CounselingType = 
  | 'Bimbingan Klasikal' 
  | 'Bimbingan Kelompok'
  | 'Konseling Individu' 
  | 'Konseling Kelompok' 
  | 'Referal' 
  | 'Konsultasi dengan Wali Kelas' 
  | 'Konsultasi dengan Guru' 
  | 'Konsultasi dengan Orang Tua / Wali' 
  | 'Home Visit' 
  | 'Konferensi Kasus' 
  | 'Pengembangan Diri'
  | 'Kolaborasi';

export type CounselingAspect = 'Belajar' | 'Pribadi' | 'Sosial' | 'Karier' | 'Bakat dan Minat';
export type CounselingStatus = 'baik' | 'perlu perhatian' | 'butuh bantuan';

export interface CounselingLog {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  academicYear: string;
  studentId: string;
  studentName: string;
  className: string;
  component: ServiceComponent;
  type: CounselingType;
  aspect: CounselingAspect;
  result: string;
  status: CounselingStatus;
  followUp: string;
  notes: string;
  consultantName?: string;
  topic?: string;
  purpose?: string;
  absentStudentIds?: string[];
  groupId?: string;
}

export interface EventLog {
  id: string;
  date: string;
  time: string;
  studentId: string;
  studentName: string;
  className: string;
  homeroomTeacher: string;
  description: string;
  resolution: string;
  followUp: string;
  notes: string;
  photo?: string;
  manualStudentName?: string;
  manualClassName?: string;
  academicYear?: string;
}

export interface Violation {
  id: string;
  studentId: string;
  date: string;
  violation: string;
  level: 'ringan' | 'sedang' | 'berat';
  actionTaken: string;
  description: string;
  status?: 'Selesai' | 'Pending';
}

export interface Achievement {
  id: string;
  studentId: string;
  date: string;
  achievement: string;
  achievementType: 'Akademik' | 'Non Akademik';
  level: 'sekolah' | 'kota' | 'provinsi' | 'nasional' | 'internasional';
  description: string;
  academicYear?: string;
  status?: 'Selesai' | 'Pending';
}

export interface Scholarship {
  id: string;
  studentId: string;
  date: string;
  scholarshipName: string;
  level: 'sekolah' | 'kota' | 'provinsi' | 'nasional' | 'internasional';
  description: string;
  academicYear?: string;
}

export interface EconomicallyDisadvantagedStudent {
  id: string;
  studentId: string;
  manualStudentName?: string;
  manualClassName?: string;
  manualNis?: string;
  manualNisn?: string;
  manualBirthDate?: string;
  manualPhone?: string;
  date: string;
  academicYear?: string;
  address: string;
  fatherJob: string;
  motherJob: string;
  specialNotes: string;
  level?: 'sekolah' | 'kota' | 'provinsi' | 'nasional' | 'internasional';
  assistanceStatus?: 'DAPAT' | 'TIDAK DAPAT' | 'DALAM PROSES';
  assistanceSource?: string;
}

export type AttendanceStatus = 'Sakit' | 'Ijin' | 'Alpa' | 'Dispensasi';

export interface AttendanceRecord {
  id: string;
  date: string;
  studentId: string;
  status: AttendanceStatus;
  semester: 'Ganjil' | 'Genap';
  notes?: string;
}

export interface CounselingSchedule {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  date: string;
  time: string;
  topic: string;
  notes?: string;
  status?: 'scheduled' | 'completed';
}

export interface NeedAssessment {
  id: string;
  studentId: string;
  aspect: 'Pribadi' | 'Sosial' | 'Belajar' | 'Karier';
  problem: string;
  priority: 'Tinggi' | 'Sedang' | 'Rendah';
  date: string;
}

export interface AKPDResponse {
  id: string;
  studentId: string;
  date: string;
  responses: boolean[]; // Array of 40 booleans
}

export interface AKPDQuestion {
  id: number;
  text: string;
  aspect: 'Pribadi' | 'Sosial' | 'Belajar' | 'Karier';
}

export interface HomeVisit {
  id: string;
  studentId: string;
  date: string;
  startTime?: string;
  endTime?: string;
  address?: string;
  metBy?: string;
  familyStatus?: 'Ayah dan Ibu' | 'Ayah' | 'Ibu' | 'Kakak' | 'Saudara' | 'Lainnya' | '';
  purpose: string;
  result: string;
  followUp: string;
  photo?: string;
  status?: 'Terjadwal' | 'Selesai' | 'Dibatalkan' | '';
}

export interface VulnerabilityMap {
  studentId: string;
  riskLevel: 'Aman' | 'Waspada' | 'Rawan' | 'Sangat Rawan';
  factors: string[]; // e.g., ["Absensi", "Ekonomi", "Broken Home"]
}

export interface Referral {
  id: string;
  studentId: string;
  date: string;
  referredTo: string; // e.g., "Psikolog", "Rumah Sakit"
  reason: string;
  status: 'Proses' | 'Selesai';
  notes?: string;
  // New fields for Referral Letter
  letterNumber?: string;
  targetInstitution?: string;
  principalName?: string;
  principalNip?: string;
  bkTeacherName?: string;
  bkTeacherNip?: string;
}

export interface ParentCommunication {
  id: string;
  studentId: string;
  studentName: string;
  parentName: string;
  date: string;
  message: string;
  sender: 'Teacher' | 'Parent';
  status: 'Sent' | 'Read' | 'Replied';
  replyToId?: string;
}

export interface SubjectGrades {
  [key: string]: string | undefined;
}

export interface SemesterGrades {
  semester1?: SubjectGrades;
  semester2?: SubjectGrades;
}

export interface ReportAndMutation {
  id: string;
  studentId: string;
  // Nilai Raport (legacy)
  grade7Sem1?: string;
  grade7Sem2?: string;
  grade8Sem1?: string;
  grade8Sem2?: string;
  grade9Sem1?: string;
  grade9Sem2?: string;
  
  // Nilai Raport (detailed)
  grade7?: SemesterGrades;
  grade8?: SemesterGrades;
  grade9?: SemesterGrades;
  customGrades?: {
    [className: string]: SemesterGrades;
  };

  // Mutasi
  mutationDate?: string;
  mutationDestination?: string;
  mutationReason?: string;
  notes?: string;
}

export interface TDA {
  id: string;
  studentId: string;
  className: string;
  studentName: string;
  homeroomTeacher: string;
  learningStyle: string;
  personalityType: string;
  multipleIntelligences: string;
  talentInterest: string;
  careerKey: string;
  date: string;
}

export interface DailyJournal {
  id: string;
  date: string;
  day: string;
  time: string;
  activityType: string;
  activityName: string;
  place: string;
  description: string;
  notes: string;
  status: 'Selesai' | 'Belum Selesai' | 'Ditunda' | 'Dibatalkan';
  className?: string;
}

export interface StoredDocument {
  id: string;
  name: string;
  fileName: string;
  fileType: string;
  fileData: string; // Base64 string
  uploadDate: string;
  size: number;
  category: 'PROGRAM BK' | 'RPLBK' | 'LKPD' | 'MATERI' | 'TDA' | 'TES PSIKOLOGI' | 'SERTIFIKAT' | 'SK' | 'DOKUMEN KEPEGAWAIAN' | 'LAINNYA';
}

export interface ProblemReport {
  id: string;
  date: string;
  time: string;
  studentName: string;
  className: string;
  problemType: 'Pribadi' | 'Sosial' | 'Belajar' | 'Karier';
  problemDescription: string;
  specialNotes: string;
  status: 'Pending' | 'Follow-up' | 'Resolved';
  consultationDay?: string;
  consultationDate?: string;
  consultationTime?: string;
  consultationPlace?: string;
}

export interface GuidanceMaterial {
  id: string;
  title: string;
  type: 'Artikel' | 'Brosur' | 'Poster' | 'Tips & Trik' | 'Powerpoint' | 'Gambar' | 'Foto';
  category: 'Artikel Ilmiah' | 'Bimbingan Siswa' | 'Tips Belajar' | 'Pengetahuan Populer' | 'Psikologi' | 'Lainnya';
  content: string;
  author: string;
  date: string;
  tags?: string[];
  imageUrl?: string;
  layout?: string;
}

export interface SOP {
  id: string;
  title: string;
  category: string;
  description: string;
  content: string;
}

export interface RPL {
  id: string;
  topic: string;
  component: ServiceComponent;
  type: CounselingType;
  aspect: CounselingAspect;
  targetClass: string;
  semester: 'Ganjil' | 'Genap';
  academicYear: string;
  duration: string;
  objectives: {
    general: string;
    specific: string[];
  };
  materials: string[];
  methods: string[];
  media: string[];
  steps: {
    opening: string[];
    core: string[];
    closing: string[];
  };
  evaluation: {
    process: string;
    result: string;
  };
  date: string;
}

export interface ClassicalGuidanceSchedule {
  id: string;
  academicYear: string;
  semester: 'Ganjil' | 'Genap' | 'Semua Semester';
  day: 'SENIN' | 'SELASA' | 'RABU' | 'KAMIS' | 'JUMAT' | 'SABTU' | 'MINGGU';
  period: string;
  className: string;
  topic?: string;
  notes?: string;
  date?: string;
}

export enum ViewMode {
  STUDENT_PERSONAL_BOOK = 'STUDENT_PERSONAL_BOOK',
  STUDENT_360_PROFILE = 'STUDENT_360_PROFILE',
  WELCOME = 'WELCOME',
  HOME = 'HOME',
  STUDENT_LIST = 'STUDENT_LIST',
  STUDENT_INPUT = 'STUDENT_INPUT',
  COUNSELING_INPUT = 'COUNSELING_INPUT',
  COUNSELING_DATA = 'COUNSELING_DATA',
  DAILY_JOURNAL_INPUT = 'DAILY_JOURNAL_INPUT',
  DAILY_JOURNAL_DATA = 'DAILY_JOURNAL_DATA',
  ANECDOTAL_RECORD_INPUT = 'ANECDOTAL_RECORD_INPUT',
  ANECDOTAL_RECORD_DATA = 'ANECDOTAL_RECORD_DATA',
  LPJ_MANAGEMENT = 'LPJ_MANAGEMENT',
  STRATEGY_HUB = 'STRATEGY_HUB',
  STRATEGY_REPORTS = 'STRATEGY_REPORTS',
  SETTINGS = 'SETTINGS',
  WORK_MECHANISM = 'WORK_MECHANISM',
  COMPONENT_RECAP = 'COMPONENT_RECAP',

  ANNUAL_REPORT = 'ANNUAL_REPORT',
  ANALYTICS = 'ANALYTICS',
  ACHIEVEMENT_MANAGEMENT = 'ACHIEVEMENT_MANAGEMENT',
  STRATEGY_GENERATOR = 'STRATEGY_GENERATOR',
  VIOLATION_MANAGEMENT = 'VIOLATION_MANAGEMENT',
  AUTOMATED_REPORTS = 'AUTOMATED_REPORTS',
  ATTENDANCE_MANAGEMENT = 'ATTENDANCE_MANAGEMENT',
  COUNSELING_SCHEDULE = 'COUNSELING_SCHEDULE',
  CLASSICAL_GUIDANCE_SCHEDULE = 'CLASSICAL_GUIDANCE_SCHEDULE',
  NEED_ASSESSMENT = 'NEED_ASSESSMENT',
  VULNERABILITY_MAP = 'VULNERABILITY_MAP',
  HOME_VISIT = 'HOME_VISIT',
  HOME_VISIT_INPUT = 'HOME_VISIT_INPUT',
  REFERRAL_MANAGEMENT = 'REFERRAL_MANAGEMENT',
  STUDENT_AKPD = 'STUDENT_AKPD',
  COLLABORATION = 'COLLABORATION',
  SETTINGS_CATEGORY = 'SETTINGS_CATEGORY',
  INPUT_DATA_CATEGORY = 'INPUT_DATA_CATEGORY',
  REPORT_CATEGORY = 'REPORT_CATEGORY',
  REPORT_MUTATION = 'REPORT_MUTATION',
  STUDENT_REPORT_INPUT = 'STUDENT_REPORT_INPUT',
  PARENT_COMMUNICATION = 'PARENT_COMMUNICATION',
  STUDENT_DATA_REPORT = 'STUDENT_DATA_REPORT',
  TDA_INPUT = 'TDA_INPUT',
  SOCIOMETRY = 'SOCIOMETRY',
  DOCUMENT_MANAGEMENT = 'DOCUMENT_MANAGEMENT',
  PROBLEM_BOX = 'PROBLEM_BOX',
  GUIDANCE_BOARD = 'GUIDANCE_BOARD',
  LKPD_MATERI_GENERATOR = 'LKPD_MATERI_GENERATOR',
  RPL_GENERATOR = 'RPL_GENERATOR',
  COUNSELING_APPROACHES = 'COUNSELING_APPROACHES',
  COUNSELING_TECHNIQUES = 'COUNSELING_TECHNIQUES',
  COUNSELING_DICTIONARY = 'COUNSELING_DICTIONARY',
  ICE_BREAKING = 'ICE_BREAKING',
  SOP_MANAGEMENT = 'SOP_MANAGEMENT',
  DEVELOPER_INFO = 'DEVELOPER_INFO',
  KODE_ETIK = 'KODE_ETIK',
  ASAS_BK = 'ASAS_BK',
  CERTIFICATE_MANAGEMENT = 'CERTIFICATE_MANAGEMENT'
}

export type ThemeMode = 'light' | 'standard' | 'classic';
export type FontChoice = 'sans' | 'serif' | 'mono' | 'jakarta' | 'inter' | 'poppins';

export interface AppearanceConfig {
  theme: ThemeMode;
  font: FontChoice;
  primaryColor: string;
  moduleOrder?: string[];
  dashboardLayout?: { [key: string]: string[] };
}
