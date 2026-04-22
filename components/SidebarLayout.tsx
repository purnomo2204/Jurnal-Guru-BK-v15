import React from 'react';
import { NavLink, useLocation, Outlet } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  LayoutGrid, FileText, BarChart3, Users, Settings, LogOut, School, 
  BookOpen, Sun, AppWindow, Coffee, Inbox, Archive, Search, X, Zap, Sparkles, Shield,
  ChevronDown, ChevronUp, HelpCircle, Award, Maximize, Minimize
} from 'lucide-react';
import { TeacherData, ViewMode, AppearanceConfig, ThemeMode } from '../types';
import { formatAcademicTitle } from '../src/lib/nameFormatter';
import ErrorBoundary from './ErrorBoundary';

interface SidebarLayoutProps {
  onOpenSettings: (tab?: 'profile' | 'report' | 'cloud' | 'backup' | 'firebase' | 'appearance') => void;
  onNavigate: (view: ViewMode) => void;
  teacherData: TeacherData;
  appearance?: AppearanceConfig;
  onUpdateAppearance?: (config: AppearanceConfig) => void;
  onOpenGuide?: () => void;
  globalSearch?: string;
  onSearch?: (query: string) => void;
  currentView?: ViewMode;
}

const SidebarLayout: React.FC<SidebarLayoutProps> = ({ onOpenSettings, onNavigate, teacherData, appearance, onUpdateAppearance, onOpenGuide, globalSearch, onSearch, currentView }) => {
  const location = useLocation();
  const [isFullScreen, setIsFullScreen] = React.useState(false);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Error attempting to enable full-screen mode: ${e.message}`);
      });
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  React.useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);
  
  const navCategories = [
    {
      title: 'Menu Utama',
      items: [
        { name: 'Dashboard', icon: LayoutGrid, path: '/dashboard', view: ViewMode.HOME },
        { 
          name: 'Input Data', 
          icon: FileText, 
          path: '/input', 
          view: ViewMode.INPUT_DATA_CATEGORY,
          subItems: [
            { name: 'Database Siswa', view: ViewMode.STUDENT_LIST },
            { name: 'AKPD', view: ViewMode.NEED_ASSESSMENT },
            { name: 'TDA', view: ViewMode.TDA_INPUT },
            { name: 'Absensi Siswa', view: ViewMode.ATTENDANCE_MANAGEMENT },
            { name: 'Prestasi & Beasiswa', view: ViewMode.ACHIEVEMENT_MANAGEMENT },
            { name: 'Catatan Anekdot', view: ViewMode.ANECDOTAL_RECORD_DATA },
            { name: 'Catatan Kasus', view: ViewMode.VIOLATION_MANAGEMENT },
            { name: 'Home Visit', view: ViewMode.HOME_VISIT },
            { name: 'Raport & Mutasi', view: ViewMode.REPORT_MUTATION },
            { name: 'Layanan BK', view: ViewMode.COUNSELING_INPUT },
            { name: 'Jadwal Klasikal', view: ViewMode.CLASSICAL_GUIDANCE_SCHEDULE },
            { name: 'Jadwal Konseling', view: ViewMode.COUNSELING_SCHEDULE },
            { name: 'Rujukan Siswa', view: ViewMode.REFERRAL_MANAGEMENT },
            { name: 'Komunikasi Ortu', view: ViewMode.PARENT_COMMUNICATION },
            { name: 'Sosiometri', view: ViewMode.SOCIOMETRY },
            { name: 'Jurnal Harian', view: ViewMode.DAILY_JOURNAL_DATA },
          ]
        },
        { 
          name: 'Laporan', 
          icon: BarChart3, 
          path: '/laporan', 
          view: ViewMode.REPORT_CATEGORY,
          subItems: [
            { name: 'Analitik Data', view: ViewMode.ANALYTICS },
            { name: 'Statistik Tahunan', view: ViewMode.ANNUAL_REPORT },
            { name: 'Laporan LPJ', view: ViewMode.LPJ_MANAGEMENT },
            { name: 'Buku Pribadi', view: ViewMode.STUDENT_PERSONAL_BOOK },
            { name: 'Peta Kerawanan', view: ViewMode.VULNERABILITY_MAP },
            { name: 'Laporan Layanan', view: ViewMode.STRATEGY_HUB },
            { name: 'Riwayat Layanan', view: ViewMode.COUNSELING_DATA },
            { name: 'Laporan Kemajuan', view: ViewMode.AUTOMATED_REPORTS },
            { name: 'Rekapitulasi', view: ViewMode.COMPONENT_RECAP },
            { name: 'Data Siswa Asuh', view: ViewMode.STUDENT_DATA_REPORT },
          ]
        },
      ]
    },
    {
      title: 'Sumber Daya & Media',
      items: [
        { name: 'LKPD & Materi', icon: FileText, path: '/lkpd-materi', view: ViewMode.LKPD_MATERI_GENERATOR },
        { name: 'RPL Otomatis', icon: Sparkles, path: '/rpl-otomatis', view: ViewMode.RPL_GENERATOR },
        { name: 'Papan Bimbingan', icon: LayoutGrid, path: '/papan-bimbingan', view: ViewMode.GUIDANCE_BOARD },
        { name: 'Ice Breaking', icon: Sparkles, path: '/ice-breaking', view: ViewMode.ICE_BREAKING },
        { name: 'Sertifikat', icon: Award, path: '/sertifikat', view: ViewMode.CERTIFICATE_MANAGEMENT },
        { name: 'Simpan Dokumen', icon: Archive, path: '/dokumen', view: ViewMode.DOCUMENT_MANAGEMENT },
        { name: 'Kotak Masalah', icon: Inbox, path: '/kotak-masalah', view: ViewMode.PROBLEM_BOX },
        { name: 'Kolaborasi TIM', icon: Users, path: '/kolaborasi', view: ViewMode.COLLABORATION },
      ]
    },
    {
      title: 'Wawasan & SOP',
      items: [
        { name: 'Pendekatan Konseling', icon: BookOpen, path: '/pendekatan-konseling', view: ViewMode.COUNSELING_APPROACHES },
        { name: 'Teknik Konseling', icon: Zap, path: '/teknik-konseling', view: ViewMode.COUNSELING_TECHNIQUES },
        { name: 'Asas BK', icon: Shield, path: '/asas-bk', view: ViewMode.ASAS_BK },
        { name: 'SOP BK', icon: FileText, path: '/sop-bk', view: ViewMode.SOP_MANAGEMENT },
        { name: 'Kode Etik', icon: Shield, path: '/kode-etik', view: ViewMode.KODE_ETIK },
        { name: 'Kamus BK', icon: BookOpen, path: '/kamus-bk', view: ViewMode.COUNSELING_DICTIONARY },
      ]
    },
    {
      title: 'Sistem',
      items: [
        { name: 'Guru Wali', icon: School, action: () => window.open('https://guru-wali-pro.vercel.app/', '_blank') },
        { name: 'Pengaturan', icon: Settings, path: '/settings-menu', view: ViewMode.SETTINGS_CATEGORY },
        { name: 'Pengembang', icon: Users, path: '/developer', view: ViewMode.DEVELOPER_INFO },
        { name: 'Keluar', icon: LogOut, path: '/welcome', view: ViewMode.WELCOME, isDanger: true },
      ]
    }
  ];

  const toggleTheme = () => {
    if (!appearance || !onUpdateAppearance) return;
    const themes: ThemeMode[] = ['light', 'standard', 'classic'];
    const currentIndex = themes.indexOf(appearance.theme);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % themes.length;
    const newTheme = themes[nextIndex];
    onUpdateAppearance({ ...appearance, theme: newTheme });
  };

  const isPathActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path;
  };

  const getThemeIcon = () => {
    if (!appearance) return Sun;
    switch (appearance.theme) {
      case 'standard': return AppWindow;
      case 'classic': return Coffee;
      default: return Sun;
    }
  };

  const ThemeIcon = getThemeIcon();

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${
      appearance?.theme === 'classic' ? 'bg-[#f4f1ea]' : appearance?.theme === 'standard' ? 'bg-blue-50' : 'bg-slate-50'
    }`}>
      {/* Left Sidebar (Split Theme) */}
      <aside className={`w-64 flex flex-col z-50 shadow-2xl shrink-0 ${
        appearance?.theme === 'classic' ? 'border-r border-[#d7ccb9]' : ''
      }`}>
        {/* Top Section (15%) */}
        <div className={`h-[15%] flex flex-col items-center justify-center border-b transition-colors duration-300 ${
          appearance?.theme === 'classic' 
            ? 'bg-[#e6dfd1] text-[#5d4a33] border-[#d7ccb9]' 
            : appearance?.theme === 'standard'
              ? 'bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 text-blue-900 border-blue-200'
              : 'bg-slate-100 text-slate-900 border-slate-200'
        }`}>
          {teacherData.logoSchool ? (
            <img src={teacherData.logoSchool} alt="Logo Sekolah" className="w-24 h-24 object-contain" />
          ) : (
            <BookOpen className="w-14 h-14" />
          )}
        </div>
        {/* Bottom Section (85%) */}
        <div className={`h-[85%] p-4 overflow-y-auto custom-scrollbar transition-colors duration-300 ${
          appearance?.theme === 'classic'
            ? 'bg-[#faf9f6]'
            : appearance?.theme === 'standard'
              ? 'bg-gradient-to-br from-blue-800 via-blue-900 to-indigo-950'
              : 'bg-gradient-to-br from-slate-50 to-white border-r border-slate-200'
        }`}>
          <nav className="space-y-6">
            {navCategories.map((category) => (
              <div key={category.title} className="space-y-2">
                <h3 className={`px-2 text-[8px] font-black uppercase tracking-[0.2em] mb-2 ${
                  appearance?.theme === 'classic' ? 'text-yellow-700' : appearance?.theme === 'standard' ? 'text-yellow-400' : 'text-yellow-600'
                }`}>
                  {category.title}
                </h3>
                <div className="space-y-1">
                  {category.items.map((item) => {
                    const isActive = item.path ? isPathActive(item.path) : false;
                    const hasSubItems = item.subItems && item.subItems.length > 0;
                    const showSubItems = isActive && hasSubItems;

                    return (
                      <div key={item.name} className="space-y-1">
                        {item.action ? (
                          <button
                            onClick={item.action}
                            className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all active:scale-95 hover:scale-[1.02] cursor-pointer ${
                              appearance?.theme === 'classic'
                                ? 'hover:bg-[#e6dfd1] text-[#5d4a33]'
                                : appearance?.theme === 'standard'
                                  ? 'hover:bg-white/10 text-blue-50'
                                  : 'hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <item.icon className="w-3.5 h-3.5" />
                            <span className="font-medium text-[10px] uppercase tracking-widest">{item.name}</span>
                          </button>
                        ) : (
                          <>
                            <NavLink
                              to={item.path!}
                              onClick={() => {
                                if (item.view) onNavigate(item.view);
                              }}
                              className={({ isActive }) =>
                                `w-full flex items-center justify-between p-2 rounded-xl transition-all active:scale-95 hover:scale-[1.02] cursor-pointer ${
                                  item.isDanger
                                    ? 'text-red-600 hover:bg-red-100 hover:text-red-700 font-bold'
                                    : appearance?.theme === 'classic'
                                      ? isActive ? 'bg-[#d7ccb9] text-[#433422]' : 'hover:bg-[#e6dfd1] text-[#5d4a33]'
                                      : appearance?.theme === 'standard'
                                        ? isActive ? 'bg-white/20 text-white shadow-lg' : 'hover:bg-white/10 text-blue-50'
                                        : isActive ? 'bg-slate-200 text-slate-900 shadow-sm' : 'hover:bg-slate-100 text-slate-600'
                                }`
                              }
                            >
                              <div className="flex items-center gap-3">
                                <item.icon className="w-3.5 h-3.5" />
                                <span className="font-medium text-[10px] uppercase tracking-widest">{item.name}</span>
                              </div>
                              {hasSubItems && (
                                isActive ? <ChevronUp className="w-3 h-3 opacity-50" /> : <ChevronDown className="w-3 h-3 opacity-50" />
                              )}
                            </NavLink>
                            
                            {showSubItems && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="ml-6 space-y-1 border-l border-slate-200 dark:border-slate-700 pl-2 mt-1"
                              >
                                {item.subItems?.map((subItem) => (
                                  <button
                                    key={subItem.name}
                                    onClick={() => subItem.view && onNavigate(subItem.view)}
                                    className={`w-full text-left p-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all hover:translate-x-1 ${
                                      subItem.view === currentView
                                        ? appearance?.theme === 'classic'
                                          ? 'bg-[#d7ccb9] text-[#433422]'
                                          : appearance?.theme === 'standard'
                                            ? 'bg-white/20 text-white shadow-sm'
                                            : 'bg-slate-200 text-slate-900 shadow-sm'
                                        : appearance?.theme === 'classic'
                                          ? 'text-[#7c664d] hover:text-[#433422] hover:bg-[#e6dfd1]'
                                          : appearance?.theme === 'standard'
                                            ? 'text-blue-200 hover:text-white hover:bg-white/5'
                                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                                    }`}
                                  >
                                    {subItem.name}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* Right Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Section (15%) */}
        <div className={`h-[15%] p-6 flex items-center justify-between border-b transition-colors duration-300 ${
          appearance?.theme === 'classic'
            ? 'bg-[#e6dfd1] border-[#d7ccb9]'
            : appearance?.theme === 'standard'
              ? 'bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 border-blue-200'
              : 'bg-white border-slate-200'
        }`}>
          <div>
            <h1 className={`text-[22px] font-black uppercase tracking-tighter ${
              appearance?.theme === 'classic' ? 'text-[#433422]' : appearance?.theme === 'standard' ? 'text-blue-950' : 'text-slate-900'
            }`}>JURNAL GURU BK</h1>
            <p className={`text-[10px] font-black uppercase tracking-widest ${
              appearance?.theme === 'classic' ? 'text-[#5d4a33]' : appearance?.theme === 'standard' ? 'text-blue-900' : 'text-slate-600'
            }`}>SISTEM ADMINISTRASI DIGITAL BIMBINGAN KONSELING</p>
            <p className={`text-[9px] font-black tracking-widest mt-1 ${
              appearance?.theme === 'classic' ? 'text-[#5d4a33]' : appearance?.theme === 'standard' ? 'text-blue-800' : 'text-slate-500'
            }`}>{formatAcademicTitle(teacherData.name)}</p>
            <p className={`text-[8px] font-black uppercase tracking-widest ${
              appearance?.theme === 'classic' ? 'text-[#7c664d]' : appearance?.theme === 'standard' ? 'text-blue-600' : 'text-slate-400'
            }`}>{teacherData.school}</p>
          </div>

          {/* Global Search */}
          <div className="flex-1 max-w-md mx-8 relative group hidden lg:flex items-center gap-2 z-[60]">
            <div className="relative flex-1">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                appearance?.theme === 'classic' ? 'text-[#7c664d]' : appearance?.theme === 'standard' ? 'text-blue-400' : 'text-slate-400'
              } group-focus-within:text-primary pointer-events-none`} />
              <input 
                type="text" 
                placeholder="Pencarian Global (Siswa, Kasus, Laporan...)" 
                value={globalSearch || ''}
                onChange={(e) => onSearch && onSearch(e.target.value)}
                className={`w-full pl-11 pr-10 py-2.5 rounded-2xl text-xs font-medium outline-none transition-all border relative z-[61] ${
                  appearance?.theme === 'classic'
                    ? 'bg-white/50 border-[#d7ccb9] focus:bg-white focus:border-[#433422] text-[#433422]'
                    : appearance?.theme === 'standard'
                      ? 'bg-blue-900/5 border-blue-200 focus:bg-white focus:border-blue-500 text-blue-950'
                      : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-primary text-slate-900'
                }`}
              />
              {globalSearch && (
                <button 
                  onClick={() => onSearch && onSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full transition-colors z-[62]"
                >
                  <X className="w-3 h-3 text-slate-400" />
                </button>
              )}
            </div>
            <div className="relative group/tooltip">
              <button className={`p-2.5 rounded-xl border shadow-sm transition-all active:scale-95 flex-shrink-0 ${
                appearance?.theme === 'classic'
                  ? 'bg-white border-[#d7ccb9] text-[#5d4a33] hover:bg-[#faf9f6]'
                  : appearance?.theme === 'standard'
                    ? 'bg-white border-blue-200 text-blue-600 hover:bg-blue-50'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>
                <HelpCircle className="w-4 h-4" />
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-[100] text-center shadow-xl">
                Gunakan ini untuk menemukan data siswa atau catatan dengan cepat.
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 relative z-50">
            <button 
              onClick={toggleFullScreen}
              className={`p-2.5 rounded-xl border shadow-sm transition-all active:scale-95 ${
                appearance?.theme === 'classic'
                  ? 'bg-white border-[#d7ccb9] text-[#5d4a33] hover:bg-[#faf9f6]'
                  : appearance?.theme === 'standard'
                    ? 'bg-white border-blue-200 text-blue-700 hover:bg-blue-50'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title={isFullScreen ? "Keluar Layar Penuh" : "Layar Penuh"}
            >
              {isFullScreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
            <button 
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl border shadow-sm transition-all active:scale-95 ${
                appearance?.theme === 'classic'
                  ? 'bg-white border-[#d7ccb9] text-[#5d4a33] hover:bg-[#faf9f6]'
                  : appearance?.theme === 'standard'
                    ? 'bg-white border-blue-200 text-blue-700 hover:bg-blue-50'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title="Ganti Tema"
            >
              <ThemeIcon className="w-4 h-4" />
            </button>
            <button className={`px-4 py-2 rounded-lg text-xs font-bold uppercase shadow-lg transition-all ${
              appearance?.theme === 'classic'
                ? 'bg-[#433422] text-[#faf9f6]'
                : appearance?.theme === 'standard'
                  ? 'bg-blue-700 hover:bg-blue-800 text-white shadow-blue-500/20'
                  : 'bg-slate-900 text-white'
            }`}>TAHUN AJARAN: {teacherData.academicYear}</button>
            <button 
              onClick={() => onOpenGuide && onOpenGuide()}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase shadow-lg transition-all flex items-center gap-2 z-50 ${
              appearance?.theme === 'classic'
                ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                : appearance?.theme === 'standard'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}>
              <BookOpen className="w-4 h-4" />
              PANDUAN APLIKASI
            </button>
          </div>
        </div>
        {/* Bottom Section (90%) */}
        <div className={`h-[90%] pt-4 pb-8 px-8 overflow-y-auto transition-colors duration-300 ${
          appearance?.theme === 'classic' ? 'bg-[#faf9f6]' : appearance?.theme === 'standard' ? 'bg-blue-50/30' : 'bg-white'
        }`}>
          <ErrorBoundary>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
};

export default SidebarLayout;
