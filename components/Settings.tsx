
import React, { useState, useRef, useEffect } from 'react';
import { ViewMode, TeacherData, FirebaseConfig, AppearanceConfig, ThemeMode, FontChoice } from '../types';
import { formatAcademicTitle } from '../src/lib/nameFormatter';
import { 
  Copy, Check, Save, ArrowLeft, ExternalLink, 
  UserCircle, HardDrive, Download, Upload, 
  Wifi, Lock, X, 
  RefreshCw, HelpCircle, PlayCircle, RotateCcw,
  Database, User, Activity, AlertCircle, WifiOff, Flame, Trash2,
  Info, Eye, EyeOff, KeyRound, ShieldCheck, ImageIcon,
  ChevronRight, ChevronUp, ChevronDown, Terminal, Globe, Link, Unlink, Cloud, Loader2,
  Unlock, ShieldAlert, BookOpen, Code, Layers, FileText, Calendar as CalendarIcon,
  Building2, School, CheckCircle2, Network, Palette, Type, Sun, AppWindow, Coffee,
  Monitor, Apple, CheckCircle, Bell, Award
} from 'lucide-react';

import { toast } from 'sonner';
import { validateRequired, validateNumeric } from '../src/lib/validation';

import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { NotificationCreator } from './NotificationCreator';
import TeacherProfile from './TeacherProfile';
// ... existing imports ...
interface SettingsProps {
  spreadsheetUrl: string;
  googleFormUrl: string;
  onSaveUrl: (url: string) => void;
  onSaveGoogleFormUrl: (url: string) => void;
  onTestUrl?: (url: string) => void;
  onSaveDocUrl: (docUrl: string) => void;
  setView: (v: ViewMode) => void;
  teacherData: TeacherData;
  onUpdateTeacherData: (data: TeacherData) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  onManualSave: () => void;
  initialTab?: 'profile' | 'report' | 'subjects' | 'cloud' | 'backup' | 'firebase' | 'appearance' | 'notifications';
  firebaseConfig?: FirebaseConfig | null;
  onSaveFirebase?: (config: FirebaseConfig) => void;
  appearance: AppearanceConfig;
  onUpdateAppearance: (config: AppearanceConfig) => void;
  showNotification?: (msg: string, type?: 'success' | 'error' | 'info' | 'loading') => void;
  onResetData?: () => void;
  onSyncCloud?: () => void;
  onSyncAllStudents?: () => void;
  onDownloadFromCloud?: () => void;
  syncQueue?: {target: string, payload: any}[];
  onProcessSyncQueue?: () => void;
  onClearSyncQueue?: () => void;
  isOffline?: boolean;
  db: Firestore | null;
  auth: Auth | null;
}

const Settings: React.FC<SettingsProps> = ({ 
  spreadsheetUrl, googleFormUrl, onSaveUrl, onSaveGoogleFormUrl, onTestUrl, setView, teacherData, onUpdateTeacherData, onExportBackup, onImportBackup, onManualSave,
  initialTab = 'profile', firebaseConfig, onSaveFirebase, appearance, onUpdateAppearance, showNotification,
  onResetData, onSyncCloud, onSyncAllStudents, onDownloadFromCloud, 
  syncQueue = [], onProcessSyncQueue, onClearSyncQueue, isOffline = false,
  db, auth
}) => {
  const [url, setUrl] = useState(spreadsheetUrl);
  const [gfUrl, setGfUrl] = useState(googleFormUrl);
  const [copied, setCopied] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showCloudGuide, setShowCloudGuide] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'report' | 'subjects' | 'cloud' | 'backup' | 'firebase' | 'appearance' | 'notifications'>(initialTab as any);
  const [teacherForm, setTeacherForm] = useState<TeacherData>(teacherData);
  const [fbForm, setFbForm] = useState<FirebaseConfig>(firebaseConfig || { apiKey: '', projectId: '', appId: '', firestoreDatabaseId: '' });

  const [newSubjectLabel, setNewSubjectLabel] = useState('');
  
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isSchoolUnlocked, setIsSchoolUnlocked] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [showSchoolPassModal, setShowSchoolPassModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [schoolPassInput, setSchoolPassInput] = useState('');
  const [passError, setPassError] = useState(false);
  const [schoolPassError, setSchoolPassError] = useState(false);
  const [showVerifyPass, setShowVerifyPass] = useState(false);
  const [showVerifySchoolPass, setShowVerifySchoolPass] = useState(false);
  const [showFormPass, setShowFormPass] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateTeacherForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!validateRequired(teacherForm.name)) newErrors.name = "Nama lengkap wajib diisi";
    if (teacherForm.nip && !validateNumeric(teacherForm.nip)) newErrors.nip = "NIP harus berupa angka";
    
    if (!validateRequired(teacherForm.school)) newErrors.school = "Nama instansi wajib diisi";
    if (teacherForm.principalNip && !validateNumeric(teacherForm.principalNip)) newErrors.principalNip = "NIP harus berupa angka";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [changePassMode, setChangePassMode] = useState<'akses' | 'instansi' | null>(null);
  const [oldPassInput, setOldPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [changePassStep, setChangePassStep] = useState<1 | 2>(1);
  const [changePassError, setChangePassError] = useState('');
  
  const [showSaveNotification, setShowSaveNotification] = useState(false);

  const teacherPhotoInputRef = useRef<HTMLInputElement>(null);
  const logoGovInputRef = useRef<HTMLInputElement>(null);
  const logoSchoolInputRef = useRef<HTMLInputElement>(null);
  const orgDiagramInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const session = localStorage.getItem('bk_admin_session');
    if (session === 'unlocked') {
      setIsUnlocked(true);
    }
  }, []);

  useEffect(() => {
    if (!teacherForm.subjects || teacherForm.subjects.length === 0) {
      setTeacherForm(prev => ({
        ...prev,
        subjects: [
          { id: 'agama', label: 'Pendidikan Agama dan Budi Pekerti' },
          { id: 'pancasila', label: 'Pendidikan Pancasila' },
          { id: 'bahasaIndonesia', label: 'Bahasa Indonesia' },
          { id: 'matematika', label: 'Matematika' },
          { id: 'ipa', label: 'Ilmu Pengetahuan Alam (IPA)' },
          { id: 'ips', label: 'Ilmu Pengetahuan Sosial (IPS)' },
          { id: 'bahasaInggris', label: 'Bahasa Inggris' },
          { id: 'pjok', label: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)' },
          { id: 'informatika', label: 'Informatika' },
          { id: 'seniBudaya', label: 'Seni Budaya' },
          { id: 'mulok', label: 'Muatan Lokal' },
        ]
      }));
    }
  }, []);

  useEffect(() => {
    if (firebaseConfig) {
      setFbForm(firebaseConfig);
    }
  }, [firebaseConfig]);

  const handleCopyScript = () => {
    const appsScriptCode = `function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);
    var target = data.target || 'Sheet1';
    var payload = data.payload;
    
    // Select or create sheet based on 'target' (e.g., 'students', 'logs')
    var sheet = ss.getSheetByName(target);
    if (!sheet) {
      sheet = ss.insertSheet(target);
    }

    // Handle Headers
    var headers = [];
    if (sheet.getLastRow() === 0) {
      // Create headers if sheet is empty
      headers = ["Timestamp", ...Object.keys(payload)];
      sheet.appendRow(headers);
    } else {
      headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      // Add new headers if payload has new keys
      var newKeys = Object.keys(payload).filter(k => headers.indexOf(k) === -1);
      if (newKeys.length > 0) {
        var startCol = headers.length + 1;
        sheet.getRange(1, startCol, 1, newKeys.length).setValues([newKeys]);
        headers = headers.concat(newKeys);
      }
    }

    // Map payload to headers
    var row = headers.map(function(header) {
      if (header === 'Timestamp') return new Date();
      // Convert objects/arrays to string to avoid [object Object]
      var val = payload[header];
      return (typeof val === 'object' && val !== null) ? JSON.stringify(val) : val;
    });

    sheet.appendRow(row);

    return ContentService.createTextOutput(JSON.stringify({result: "success", row: sheet.getLastRow()}))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({result: "error", error: e.message}))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  var target = e.parameter.target || 'students';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(target);
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: 'Sheet not found'})).setMimeType(ContentService.MimeType.JSON);
  }
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = data.slice(1);
  
  var result = rows.map(function(row) {
    var obj = {};
    headers.forEach(function(header, index) {
      if (header === 'Timestamp') return;
      var val = row[index];
      try {
        if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
             obj[header] = JSON.parse(val);
        } else {
             obj[header] = val;
        }
      } catch (e) {
        obj[header] = val;
      }
    });
    return obj;
  });
  
  return ContentService.createTextOutput(JSON.stringify({status: 'success', data: result})).setMimeType(ContentService.MimeType.JSON);
}`;
    navigator.clipboard.writeText(appsScriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestConnection = async () => {
    if (isOffline) {
      showNotification?.("Tidak dapat tes koneksi saat offline.", "error");
      return;
    }
    if (!url.includes('/exec')) {
      alert("Link Data Pribadi Siswa tidak valid (Harus berakhiran /exec).");
      return;
    }
    setIsTesting(true);
    if (onTestUrl) await onTestUrl(url);
    setIsTesting(false);
  };

  const handleSaveTeacherData = () => {
    if (!validateTeacherForm()) {
      toast.error("Mohon perbaiki kesalahan pada profil sebelum menyimpan.");
      return;
    }
    const formattedForm = {
      ...teacherForm,
      name: formatAcademicTitle(teacherForm.name),
      principalName: formatAcademicTitle(teacherForm.principalName || '')
    };
    onUpdateTeacherData(formattedForm);
    setShowSaveNotification(true);
    setTimeout(() => {
      setShowSaveNotification(false);
    }, 3000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'photo' | 'logoGov' | 'logoSchool' | 'orgDiagram') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Ukuran file maksimal 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => setTeacherForm(prev => ({ ...prev, [field]: event.target?.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (field: 'photo' | 'logoGov' | 'logoSchool' | 'orgDiagram') => {
    setTeacherForm(prev => ({ ...prev, [field]: undefined }));
  };

  const verifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const currentPass = teacherData.accessPassword || '@Spero123';
    if (passwordInput === currentPass) {
      setIsUnlocked(true);
      localStorage.setItem('bk_admin_session', 'unlocked');
      setShowPassModal(false);
      setPasswordInput('');
      setPassError(false);
    } else {
      setPassError(true);
    }
  };

  const verifySchoolPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const currentSchoolPass = teacherData.schoolPassword || '@Dutatama220469';
    if (schoolPassInput === currentSchoolPass) {
      setIsSchoolUnlocked(true);
      setShowSchoolPassModal(false);
      setSchoolPassInput('');
      setSchoolPassError(false);
    } else {
      setSchoolPassError(true);
    }
  };

  const handleLockSession = () => {
    setIsUnlocked(false);
    setIsSchoolUnlocked(false);
    localStorage.removeItem('bk_admin_session');
  };

  const handleProtectedClick = () => {
    if (!isUnlocked) {
      setShowPassModal(true);
    }
  };

  const handleVerifyOldPass = (e: React.FormEvent) => {
    e.preventDefault();
    const currentPass = changePassMode === 'akses' ? (teacherData.accessPassword || '@Spero123') : (teacherData.schoolPassword || '@Dutatama220469');
    if (oldPassInput === currentPass) {
      setChangePassStep(2);
      setChangePassError('');
    } else {
      setChangePassError('Password lama salah!');
    }
  };

  const handleSaveNewPass = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassInput !== confirmPassInput) {
      setChangePassError('Konfirmasi password tidak cocok!');
      return;
    }
    if (newPassInput.length < 6) {
      setChangePassError('Password minimal 6 karakter!');
      return;
    }
    
    if (changePassMode === 'akses') {
      setTeacherForm(prev => ({ ...prev, accessPassword: newPassInput }));
    } else {
      setTeacherForm(prev => ({ ...prev, schoolPassword: newPassInput }));
    }
    
    alert('Password baru berhasil dibuat! Jangan lupa klik "Simpan Seluruh Perubahan" di bagian bawah.');
    setChangePassMode(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-10 animate-fade-in text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 px-4">
        <div>
          <p className="label-luxe text-blue-500 text-[6px] mb-0.5">JURNAL GURU BK • KONTROL PANEL</p>
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase leading-none">Pusat <span className="text-slate-500 font-light lowercase italic">Pengaturan</span></h2>
        </div>
        <div className="flex gap-2">
          {isUnlocked && (
            <button onClick={handleLockSession} className="bg-rose-900/20 px-3 py-1.5 rounded-xl font-bold border border-rose-500/20 text-rose-500 transition-all hover:bg-rose-900/40 flex items-center gap-1.5 text-[9px] uppercase tracking-widest">
              <Lock className="w-3 h-3" /> Kunci Sesi
            </button>
          )}
          <button onClick={() => setView(ViewMode.HOME)} className="bg-white px-4 py-1.5 rounded-xl font-bold border border-slate-200 transition-all hover:bg-slate-100 flex items-center gap-1.5 shadow-lg text-[9px] uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4" /> KEMBALI
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 p-1.5 bg-white/60 backdrop-blur-md rounded-[1.25rem] border border-slate-200 w-fit mx-4">
        <button onClick={() => setActiveTab('profile')} className={`flex items-center gap-2 px-4 py-2 rounded-[0.75rem] font-bold text-[9px] uppercase tracking-[0.2em] transition-all duration-500 border ${activeTab === 'profile' ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md border-slate-200' : 'text-slate-500 hover:text-slate-600 border-blue-500 hover:border-slate-200'}`}>
          <UserCircle className="w-3 h-3" /> Profil Guru
        </button>
        <button onClick={() => setActiveTab('report')} className={`flex items-center gap-2 px-4 py-2 rounded-[0.75rem] font-bold text-[9px] uppercase tracking-[0.2em] transition-all duration-500 border ${activeTab === 'report' ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md border-slate-200' : 'text-slate-500 hover:text-slate-600 border-blue-500 hover:border-slate-200'}`}>
          <FileText className="w-3 h-3" /> Atribut Laporan
        </button>
        <button onClick={() => setActiveTab('subjects')} className={`flex items-center gap-2 px-4 py-2 rounded-[0.75rem] font-bold text-[9px] uppercase tracking-[0.2em] transition-all duration-500 border ${activeTab === 'subjects' ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md border-slate-200' : 'text-slate-500 hover:text-slate-600 border-blue-500 hover:border-slate-200'}`}>
          <BookOpen className="w-3 h-3" /> Mata Pelajaran
        </button>
        <button onClick={() => setActiveTab('cloud')} className={`flex items-center gap-2 px-4 py-2 rounded-[0.75rem] font-bold text-[9px] uppercase tracking-[0.2em] transition-all duration-500 border ${activeTab === 'cloud' ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md border-slate-200' : 'text-slate-500 hover:text-slate-600 border-blue-500 hover:border-slate-200'}`}>
          <Wifi className="w-3 h-3" /> Cloud Sheets
        </button>
        <button onClick={() => setActiveTab('backup')} className={`flex items-center gap-2 px-4 py-2 rounded-[0.75rem] font-bold text-[9px] uppercase tracking-[0.2em] transition-all duration-500 border ${activeTab === 'backup' ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md border-slate-200' : 'text-slate-500 hover:text-slate-600 border-blue-500 hover:border-slate-200'}`}>
          <Database className="w-3 h-3" /> Backup Flashdisk
        </button>
        <button onClick={() => setActiveTab('appearance')} className={`flex items-center gap-2 px-4 py-2 rounded-[0.75rem] font-bold text-[9px] uppercase tracking-[0.2em] transition-all duration-500 border ${activeTab === 'appearance' ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md border-slate-200' : 'text-slate-500 hover:text-slate-600 border-blue-500 hover:border-slate-200'}`}>
          <Palette className="w-3 h-3" /> Tampilan
        </button>
        <button onClick={() => setActiveTab('firebase')} className={`flex items-center gap-2 px-4 py-2 rounded-[0.75rem] font-bold text-[9px] uppercase tracking-[0.2em] transition-all duration-500 border ${activeTab === 'firebase' ? 'bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-md border-slate-200' : 'text-slate-500 hover:text-slate-600 border-blue-500 hover:border-slate-200'}`}>
          <Flame className="w-3 h-3" /> Kolaborasi
        </button>
        <button onClick={() => setActiveTab('notifications')} className={`flex items-center gap-2 px-4 py-2 rounded-[0.75rem] font-bold text-[9px] uppercase tracking-[0.2em] transition-all duration-500 border ${activeTab === 'notifications' ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md border-slate-200' : 'text-slate-500 hover:text-slate-600 border-blue-500 hover:border-slate-200'}`}>
          <Bell className="w-3 h-3" /> Notifikasi
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 mx-4">
        {activeTab === 'profile' && (
          <div className="glass-card p-3 rounded-[1.25rem] border border-slate-200 space-y-3 shadow-xl animate-fade-in relative overflow-hidden">
             <TeacherProfile data={teacherForm} />
             <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <div className="w-8 h-8 bg-blue-600/10 rounded-lg flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-lg"><User className="w-4 h-4" /></div>
              <div>
                <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase italic">Identitas Guru & Instansi</h3>
                <p className="label-luxe text-[6px] text-slate-500">Kelola informasi profil profesional dan atribut laporan</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-1 space-y-2">
                <div className="space-y-1">
                  <label className="label-luxe text-[6px] text-blue-400">Pas Foto Guru</label>
                  <div className="relative aspect-square w-full max-w-[100px] mx-auto rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden group transition-all hover:border-blue-500/50 shadow-lg">
                    {teacherForm.photo ? (
                      <div className="relative w-full h-full group/img">
                        <img src={teacherForm.photo} className="w-full h-full object-cover" alt="Profile" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                          <button 
                            onClick={(e) => { e.stopPropagation(); teacherPhotoInputRef.current?.click(); }} 
                            className="px-2 py-1 bg-white rounded-md text-[7px] font-black text-blue-600 hover:bg-blue-50 transition-all shadow-lg uppercase tracking-widest flex items-center gap-1"
                          >
                            <ImageIcon className="w-2.5 h-2.5" /> EDIT
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleRemoveImage('photo'); }} 
                            className="px-2 py-1 bg-white rounded-md text-[7px] font-black text-rose-600 hover:bg-rose-50 transition-all shadow-lg uppercase tracking-widest flex items-center gap-1"
                          >
                            <Trash2 className="w-2.5 h-2.5" /> HAPUS
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div onClick={() => teacherPhotoInputRef.current?.click()} className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                        <ImageIcon className="w-6 h-6 text-slate-800 mx-auto" />
                        <p className="text-[5px] text-slate-600 font-black uppercase tracking-widest">Upload Foto</p>
                        <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"><Upload className="w-4 h-4 text-slate-800" /></div>
                      </div>
                    )}
                    <input type="file" ref={teacherPhotoInputRef} className="hidden" accept="image/jpeg, image/png" onChange={(e) => handleImageUpload(e, 'photo')} />
                  </div>
                </div>

                <div className="flex flex-col gap-2 p-2 bg-slate-50/30 rounded-xl border border-slate-200">
                  <div className="space-y-1">
                    <label className="label-luxe text-[6px] text-emerald-400 text-center block">Logo Pemda / Yayasan</label>
                    <div className="relative aspect-[3/2] w-full rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden group hover:border-emerald-500/50 transition-all shadow-inner">
                      {teacherForm.logoGov ? (
                        <div className="relative w-full h-full group/img">
                          <img src={teacherForm.logoGov} className="w-full h-full object-contain p-1" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                            <div className="flex gap-1.5">
                              <button 
                                onClick={(e) => { e.stopPropagation(); logoGovInputRef.current?.click(); }} 
                                className="px-2 py-1 bg-white rounded-md text-[7px] font-black text-emerald-600 hover:bg-emerald-50 transition-all shadow-lg uppercase tracking-widest flex items-center gap-1"
                              >
                                <ImageIcon className="w-2.5 h-2.5" /> EDIT
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleRemoveImage('logoGov'); }} 
                                className="px-2 py-1 bg-white rounded-md text-[7px] font-black text-rose-600 hover:bg-rose-50 transition-all shadow-lg uppercase tracking-widest flex items-center gap-1"
                              >
                                <Trash2 className="w-2.5 h-2.5" /> HAPUS
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div onClick={() => logoGovInputRef.current?.click()} className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                          <Building2 className="w-4 h-4 text-slate-800" />
                          <p className="text-[5px] text-slate-500 font-black uppercase tracking-widest mt-1">Upload Logo</p>
                          <div className="absolute inset-0 bg-emerald-600/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"><Upload className="w-3 h-3 text-slate-800" /></div>
                        </div>
                      )}
                      <input type="file" ref={logoGovInputRef} className="hidden" accept="image/jpeg, image/png" onChange={(e) => handleImageUpload(e, 'logoGov')} />
                    </div>
                  </div>
                  <div className="h-[1px] bg-white/5 w-full" />
                  <div className="space-y-1">
                    <label className="label-luxe text-[6px] text-indigo-400 text-center block">Logo Sekolah</label>
                    <div className="relative aspect-[3/2] w-full rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden group hover:border-indigo-500/50 transition-all shadow-inner">
                      {teacherForm.logoSchool ? (
                        <div className="relative w-full h-full group/img">
                          <img src={teacherForm.logoSchool} className="w-full h-full object-contain p-1" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                            <div className="flex gap-1.5">
                              <button 
                                onClick={(e) => { e.stopPropagation(); logoSchoolInputRef.current?.click(); }} 
                                className="px-2 py-1 bg-white rounded-md text-[7px] font-black text-indigo-600 hover:bg-indigo-50 transition-all shadow-lg uppercase tracking-widest flex items-center gap-1"
                              >
                                <ImageIcon className="w-2.5 h-2.5" /> EDIT
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleRemoveImage('logoSchool'); }} 
                                className="px-2 py-1 bg-white rounded-md text-[7px] font-black text-rose-600 hover:bg-rose-50 transition-all shadow-lg uppercase tracking-widest flex items-center gap-1"
                              >
                                <Trash2 className="w-2.5 h-2.5" /> HAPUS
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div onClick={() => logoSchoolInputRef.current?.click()} className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                          <School className="w-4 h-4 text-slate-800" />
                          <p className="text-[5px] text-slate-500 font-black uppercase tracking-widest mt-1">Upload Logo</p>
                          <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"><Upload className="w-3 h-3 text-slate-800" /></div>
                        </div>
                      )}
                      <input type="file" ref={logoSchoolInputRef} className="hidden" accept="image/jpeg, image/png" onChange={(e) => handleImageUpload(e, 'logoSchool')} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="space-y-1 text-left">
                    <div className="flex items-center gap-1">
                      <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Nama Lengkap</label>
                      {!isUnlocked && <Lock className="w-2 h-2 text-blue-500/50" />}
                    </div>
                    <div className="relative group" onClick={handleProtectedClick}>
                      <input 
                        readOnly={!isUnlocked}
                        value={teacherForm.name} 
                        onChange={e => {
                          if (isUnlocked) {
                            setTeacherForm({...teacherForm, name: e.target.value});
                            if (errors.name) setErrors(prev => ({ ...prev, name: "" }));
                          }
                        }} 
                        className={`w-full input-cyber rounded-lg p-2 text-[10px] font-bold outline-none transition-all ${!isUnlocked ? 'cursor-pointer group-hover:border-blue-500/30' : (errors.name ? 'border-rose-500' : 'focus:border-blue-500')} font-arial`} 
                      />
                      {!isUnlocked && <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-700"><Unlock className="w-2.5 h-2.5" /></div>}
                    </div>
                    {errors.name && <p className="text-[7px] text-rose-500 font-bold">{errors.name}</p>}
                  </div>

                  <div className="space-y-1 text-left">
                    <div className="flex items-center gap-1">
                      <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Password Akses</label>
                    </div>
                    <button 
                      type="button"
                      onClick={() => { setChangePassMode('akses'); setChangePassStep(1); setOldPassInput(''); setNewPassInput(''); setConfirmPassInput(''); setChangePassError(''); }}
                      className="w-full bg-white hover:bg-slate-100 border border-slate-200 rounded-lg p-2 text-[10px] font-bold text-slate-800 transition-all flex items-center justify-between"
                    >
                      <span>Ganti Password Akses</span>
                      <ChevronRight className="w-3 h-3 text-slate-500" />
                    </button>
                    <p className="text-[6px] text-slate-500 italic">* Klik untuk ganti password.</p>
                  </div>

                  <div className="space-y-1 text-left">
                    <div className="flex items-center gap-1">
                      <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Instansi / Sekolah</label>
                      {!isSchoolUnlocked && <Lock className="w-2 h-2 text-blue-500/50" />}
                    </div>
                    <div className="relative group" onClick={() => !isSchoolUnlocked && setShowSchoolPassModal(true)}>
                      <input 
                        readOnly={!isSchoolUnlocked}
                        value={teacherForm.school} 
                        onChange={e => {
                          if (isSchoolUnlocked) {
                            setTeacherForm({...teacherForm, school: e.target.value});
                            if (errors.school) setErrors(prev => ({ ...prev, school: "" }));
                          }
                        }} 
                        className={`w-full input-cyber rounded-lg p-2 text-[10px] font-bold outline-none transition-all ${!isSchoolUnlocked ? 'cursor-pointer group-hover:border-blue-500/30' : (errors.school ? 'border-rose-500' : 'focus:border-blue-500')}`} 
                      />
                      {!isSchoolUnlocked && <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-700"><Unlock className="w-2.5 h-2.5" /></div>}
                    </div>
                    {errors.school && <p className="text-[7px] text-rose-500 font-bold">{errors.school}</p>}
                  </div>

                  <div className="space-y-1 text-left">
                    <div className="flex items-center gap-1">
                      <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Password Instansi</label>
                    </div>
                    <button 
                      type="button"
                      onClick={() => { setChangePassMode('instansi'); setChangePassStep(1); setOldPassInput(''); setNewPassInput(''); setConfirmPassInput(''); setChangePassError(''); }}
                      className="w-full bg-white hover:bg-slate-100 border border-slate-200 rounded-lg p-2 text-[10px] font-bold text-slate-800 transition-all flex items-center justify-between"
                    >
                      <span>Ganti Password Instansi</span>
                      <ChevronRight className="w-3 h-3 text-slate-500" />
                    </button>
                    <p className="text-[6px] text-slate-500 italic">* Klik untuk ganti password.</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest">NIP / ID Pegawai <span className="text-[6px] font-normal italic">(Opsional)</span></label>
                    <input 
                      value={teacherForm.nip} 
                      onChange={e => {
                        setTeacherForm({...teacherForm, nip: e.target.value});
                        if (errors.nip) setErrors(prev => ({ ...prev, nip: "" }));
                      }} 
                      className={`w-full input-cyber rounded-lg p-2 text-[10px] font-bold outline-none transition-all ${errors.nip ? 'border-rose-500' : 'focus:border-blue-500/50'}`} 
                    />
                    {errors.nip && <p className="text-[7px] text-rose-500 font-bold">{errors.nip}</p>}
                  </div>

                  <div className="space-y-1 text-left">
                    <div className="flex items-center gap-1">
                      <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Nomor WA/HP Guru BK <span className="text-[6px] font-normal italic">(Opsional)</span></label>
                    </div>
                    <input 
                      placeholder="Contoh: 081234567890"
                      value={teacherForm.phone || ''} 
                      onChange={e => setTeacherForm({...teacherForm, phone: e.target.value})} 
                      className="w-full input-cyber rounded-lg p-2 text-[10px] font-bold outline-none focus:border-blue-500 transition-all" 
                    />
                    <p className="text-[6px] text-slate-500 italic">* Untuk menerima laporan.</p>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Tahun Ajaran Aktif</label>
                    <input value={teacherForm.academicYear} onChange={e => setTeacherForm({...teacherForm, academicYear: e.target.value})} className="w-full input-cyber rounded-lg p-2 text-[10px] font-bold outline-none focus:border-blue-500/50 transition-all" />
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Alamat Sekolah <span className="text-[6px] font-normal italic">(Opsional)</span></label>
                    <textarea 
                      value={teacherForm.schoolAddress} 
                      onChange={e => {
                        setTeacherForm({...teacherForm, schoolAddress: e.target.value});
                        if (errors.schoolAddress) setErrors(prev => ({ ...prev, schoolAddress: "" }));
                      }} 
                      className={`w-full input-cyber rounded-lg p-2 text-[10px] font-bold outline-none h-12 transition-all ${errors.schoolAddress ? 'border-rose-500' : 'focus:border-blue-500/50'}`} 
                    />
                    {errors.schoolAddress && <p className="text-[7px] text-rose-500 font-bold">{errors.schoolAddress}</p>}
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Link Google Form (Integrasi Data)</label>
                    <input 
                      type="url"
                      value={teacherForm.googleFormUrl || ''} 
                      onChange={e => setTeacherForm({...teacherForm, googleFormUrl: e.target.value})} 
                      className="w-full input-cyber rounded-lg p-2 text-[10px] font-bold outline-none focus:border-blue-500/50 transition-all" 
                      placeholder="https://docs.google.com/forms/d/e/.../viewform"
                    />
                    <p className="text-[6px] text-slate-500 italic">* URL Google Form.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <button onClick={handleSaveTeacherData} className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded-xl font-black uppercase tracking-[0.2em] shadow-xl transition-all text-white text-[8px]">Simpan Seluruh Perubahan</button>
              {showSaveNotification && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-emerald-500/90 text-white text-[7px] font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 animate-fade-in whitespace-nowrap">
                  <CheckCircle className="w-2.5 h-2.5" /> Data tersimpan
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'report' && (
          <div className="glass-card p-5 rounded-[1.5rem] border border-indigo-500/10 space-y-5 shadow-xl animate-fade-in relative overflow-hidden bg-indigo-950/10">
            <div className="flex items-center gap-3 border-b border-indigo-500/10 pb-4">
              <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-lg"><FileText className="w-5 h-5" /></div>
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase italic">Atribut Laporan (PDF)</h3>
                <p className="label-luxe text-[7px] text-indigo-500">Konfigurasi Kop Surat, Tanda Tangan & Identitas Instansi</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Pemerintah Kota / Yayasan</label>
                <input value={teacherForm.govOrFoundation || ''} onChange={e => setTeacherForm({...teacherForm, govOrFoundation: e.target.value})} className="w-full input-cyber rounded-xl p-2.5 text-xs font-bold outline-none focus:border-indigo-500/50" placeholder="Contoh: Pemerintah Kota Magelang" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Dinas / Instansi Atas</label>
                <input value={teacherForm.deptOrFoundation || ''} onChange={e => setTeacherForm({...teacherForm, deptOrFoundation: e.target.value})} className="w-full input-cyber rounded-xl p-2.5 text-xs font-bold outline-none focus:border-indigo-500/50" placeholder="Contoh: Dinas Pendidikan" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Nama Kota Pengesahan</label>
                <input value={teacherForm.city || ''} onChange={e => setTeacherForm({...teacherForm, city: e.target.value})} className="w-full input-cyber rounded-xl p-2.5 text-xs font-bold outline-none focus:border-indigo-500/50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Tanggal Pengesahan</label>
                <div className="relative">
                  <input type="date" value={teacherForm.approvalDate || ''} onChange={e => setTeacherForm({...teacherForm, approvalDate: e.target.value})} className="w-full input-cyber rounded-xl p-2.5 text-xs font-bold outline-none focus:border-indigo-500/50 pl-10" />
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Nama Kepala Sekolah <span className="text-[7px] font-normal italic">(Opsional)</span></label>
                <input 
                  value={teacherForm.principalName || ''} 
                  onChange={e => {
                    setTeacherForm({...teacherForm, principalName: e.target.value});
                    if (errors.principalName) setErrors(prev => ({ ...prev, principalName: "" }));
                  }} 
                  className={`w-full input-cyber rounded-xl p-2.5 text-xs font-bold outline-none transition-all ${errors.principalName ? 'border-rose-500' : 'focus:border-indigo-500/50'} font-arial`} 
                />
                {errors.principalName && <p className="text-[7px] text-rose-500 font-bold">{errors.principalName}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">NIP Kepala Sekolah <span className="text-[7px] font-normal italic">(Opsional)</span></label>
                <input 
                  value={teacherForm.principalNip || ''} 
                  onChange={e => {
                    setTeacherForm({...teacherForm, principalNip: e.target.value});
                    if (errors.principalNip) setErrors(prev => ({ ...prev, principalNip: "" }));
                  }} 
                  className={`w-full input-cyber rounded-xl p-2.5 text-xs font-bold outline-none transition-all ${errors.principalNip ? 'border-rose-500' : 'focus:border-indigo-500/50'}`} 
                />
                {errors.principalNip && <p className="text-[7px] text-rose-500 font-bold">{errors.principalNip}</p>}
              </div>
            </div>
            
            <button onClick={() => {
              const formattedForm = {
                ...teacherForm,
                name: formatAcademicTitle(teacherForm.name),
                principalName: formatAcademicTitle(teacherForm.principalName || '')
              };
              onUpdateTeacherData(formattedForm);
              if (showNotification) showNotification("Atribut Laporan Berhasil Disimpan", "success");
            }} className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl transition-all text-white text-[9px]">Simpan Atribut Laporan</button>
          </div>
        )}

        {activeTab === 'subjects' && (
          <div className="glass-card p-5 rounded-[1.5rem] border border-violet-500/10 space-y-5 shadow-xl animate-fade-in relative overflow-hidden bg-violet-950/10">
            <div className="flex items-center gap-3 border-b border-violet-500/10 pb-4">
              <div className="w-10 h-10 bg-violet-600/10 rounded-xl flex items-center justify-center text-violet-500 border border-violet-500/20 shadow-lg"><BookOpen className="w-5 h-5" /></div>
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase italic">Manajemen Mata Pelajaran</h3>
                <p className="label-luxe text-[7px] text-violet-500">Sesuaikan nomenklatur mata pelajaran untuk berbagai jenjang sekolah</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <input 
                  value={newSubjectLabel} 
                  onChange={e => setNewSubjectLabel(e.target.value)} 
                  placeholder="Tambah Mata Pelajaran Baru..." 
                  className="flex-1 input-cyber rounded-xl p-2.5 text-xs font-bold outline-none focus:border-violet-500/50"
                />
                <button 
                  onClick={() => {
                    if (!newSubjectLabel.trim()) return;
                    const id = newSubjectLabel.toLowerCase().replace(/\s+/g, '_');
                    setTeacherForm(prev => ({
                      ...prev,
                      subjects: [...(prev.subjects || []), { id, label: newSubjectLabel }]
                    }));
                    setNewSubjectLabel('');
                  }}
                  className="bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest text-white shadow-lg transition-all"
                >
                  Tambah
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar items-start">
                <div className="flex-1 flex flex-col gap-3 w-full">
                  {(teacherForm.subjects || []).slice(0, Math.ceil((teacherForm.subjects?.length || 0) / 2)).map((subject, index) => (
                    <div key={subject.id} className="flex items-center gap-2 p-3 bg-white/50 border border-slate-200 rounded-xl group hover:border-violet-500/30 transition-all">
                      <div className="flex flex-col gap-1">
                        <button 
                          onClick={() => {
                            if (index > 0) {
                              const newSubjects = [...(teacherForm.subjects || [])];
                              const temp = newSubjects[index - 1];
                              newSubjects[index - 1] = newSubjects[index];
                              newSubjects[index] = temp;
                              setTeacherForm({ ...teacherForm, subjects: newSubjects });
                            }
                          }}
                          disabled={index === 0}
                          className="text-slate-400 hover:text-violet-500 disabled:opacity-30 transition-colors"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            if (index < (teacherForm.subjects?.length || 0) - 1) {
                              const newSubjects = [...(teacherForm.subjects || [])];
                              const temp = newSubjects[index + 1];
                              newSubjects[index + 1] = newSubjects[index];
                              newSubjects[index] = temp;
                              setTeacherForm({ ...teacherForm, subjects: newSubjects });
                            }
                          }}
                          disabled={index === (teacherForm.subjects?.length || 0) - 1}
                          className="text-slate-400 hover:text-violet-500 disabled:opacity-30 transition-colors"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex-1">
                        <input 
                          value={subject.label} 
                          onChange={e => {
                            const newSubjects = [...(teacherForm.subjects || [])];
                            newSubjects[index] = { ...subject, label: e.target.value };
                            setTeacherForm({ ...teacherForm, subjects: newSubjects });
                          }}
                          className="w-full bg-transparent border-none outline-none text-xs font-bold text-slate-800"
                        />
                        <p className="text-[6px] text-slate-400 font-mono uppercase tracking-widest">ID: {subject.id}</p>
                      </div>
                      <button 
                        onClick={() => {
                          if (window.confirm(`Hapus mata pelajaran ${subject.label}?`)) {
                            setTeacherForm(prev => ({
                              ...prev,
                              subjects: (prev.subjects || []).filter(s => s.id !== subject.id)
                            }));
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex-1 flex flex-col gap-3 w-full">
                  {(teacherForm.subjects || []).slice(Math.ceil((teacherForm.subjects?.length || 0) / 2)).map((subject, i) => {
                    const index = Math.ceil((teacherForm.subjects?.length || 0) / 2) + i;
                    return (
                      <div key={subject.id} className="flex items-center gap-2 p-3 bg-white/50 border border-slate-200 rounded-xl group hover:border-violet-500/30 transition-all">
                        <div className="flex flex-col gap-1">
                          <button 
                            onClick={() => {
                              if (index > 0) {
                                const newSubjects = [...(teacherForm.subjects || [])];
                                const temp = newSubjects[index - 1];
                                newSubjects[index - 1] = newSubjects[index];
                                newSubjects[index] = temp;
                                setTeacherForm({ ...teacherForm, subjects: newSubjects });
                              }
                            }}
                            disabled={index === 0}
                            className="text-slate-400 hover:text-violet-500 disabled:opacity-30 transition-colors"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              if (index < (teacherForm.subjects?.length || 0) - 1) {
                                const newSubjects = [...(teacherForm.subjects || [])];
                                const temp = newSubjects[index + 1];
                                newSubjects[index + 1] = newSubjects[index];
                                newSubjects[index] = temp;
                                setTeacherForm({ ...teacherForm, subjects: newSubjects });
                              }
                            }}
                            disabled={index === (teacherForm.subjects?.length || 0) - 1}
                            className="text-slate-400 hover:text-violet-500 disabled:opacity-30 transition-colors"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex-1">
                          <input 
                            value={subject.label} 
                            onChange={e => {
                              const newSubjects = [...(teacherForm.subjects || [])];
                              newSubjects[index] = { ...subject, label: e.target.value };
                              setTeacherForm({ ...teacherForm, subjects: newSubjects });
                            }}
                            className="w-full bg-transparent border-none outline-none text-xs font-bold text-slate-800"
                          />
                          <p className="text-[6px] text-slate-400 font-mono uppercase tracking-widest">ID: {subject.id}</p>
                        </div>
                        <button 
                          onClick={() => {
                            if (window.confirm(`Hapus mata pelajaran ${subject.label}?`)) {
                              setTeacherForm(prev => ({
                                ...prev,
                                subjects: (prev.subjects || []).filter(s => s.id !== subject.id)
                              }));
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-violet-500/10 flex items-center justify-center">
                <div className="w-1/2 flex items-center gap-3">
                  <button 
                    onClick={() => {
                      if (window.confirm('Simpan urutan dan daftar mata pelajaran saat ini sebagai default Anda?')) {
                        localStorage.setItem('custom_subjects_default', JSON.stringify(teacherForm.subjects));
                        if (showNotification) showNotification('Default kustom berhasil disimpan', 'success');
                      }
                    }}
                    className="flex-1 py-3 border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                  >
                    <Save className="w-4 h-4" /> Buat Default
                  </button>
                  <button 
                    onClick={() => {
                      if (window.confirm('Reset daftar mata pelajaran ke default?')) {
                        const customDefault = localStorage.getItem('custom_subjects_default');
                        if (customDefault) {
                          try {
                            const parsed = JSON.parse(customDefault);
                            setTeacherForm(prev => ({
                              ...prev,
                              subjects: parsed
                            }));
                            if (showNotification) showNotification('Berhasil memuat default kustom', 'success');
                            return;
                          } catch (e) {
                            console.error(e);
                          }
                        }
                        
                        setTeacherForm(prev => ({
                          ...prev,
                          subjects: [
                            { id: 'agama', label: 'Pendidikan Agama dan Budi Pekerti' },
                            { id: 'pancasila', label: 'Pendidikan Pancasila' },
                            { id: 'bahasaIndonesia', label: 'Bahasa Indonesia' },
                            { id: 'matematika', label: 'Matematika' },
                            { id: 'ipa', label: 'Ilmu Pengetahuan Alam (IPA)' },
                            { id: 'ips', label: 'Ilmu Pengetahuan Sosial (IPS)' },
                            { id: 'bahasaInggris', label: 'Bahasa Inggris' },
                            { id: 'pjok', label: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)' },
                            { id: 'informatika', label: 'Informatika' },
                            { id: 'seniBudaya', label: 'Seni Budaya' },
                            { id: 'mulok', label: 'Muatan Lokal' },
                          ]
                        }));
                        if (showNotification) showNotification('Berhasil memuat default sistem', 'success');
                      }
                    }}
                    className="flex-1 py-3 border-2 border-rose-500 text-rose-600 hover:bg-rose-50 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                  >
                    <RotateCcw className="w-4 h-4" /> Reset ke Default
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-2 mt-2">
              <button onClick={() => {
                onUpdateTeacherData(teacherForm);
                if (showNotification) showNotification("Daftar Mata Pelajaran Berhasil Disimpan", "success");
              }} className="w-1/2 bg-violet-600 hover:bg-violet-500 py-3 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl transition-all text-white text-[9px]">Simpan Perubahan Mata Pelajaran</button>
              <button onClick={() => setView(ViewMode.REPORT_MUTATION)} className="w-1/2 bg-slate-600 hover:bg-slate-500 py-3 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl transition-all text-white text-[9px]">Kembali ke Input Nilai Raport</button>
            </div>
          </div>
        )}

        {activeTab === 'cloud' && (
          <div className="space-y-4 animate-fade-in">
            <div className="glass-card p-5 rounded-[1.5rem] border border-emerald-500/10 shadow-xl bg-gradient-to-br from-emerald-950/20 to-transparent">
               <div className="flex justify-between items-center mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-600/10 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-lg"><Globe className="w-5 h-5" /></div>
                    <div>
                      <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase italic">Cloud Database</h3>
                      <p className="label-luxe text-[7px] text-emerald-500">Sinkronisasi Google Sheets Harian</p>
                    </div>
                  </div>
                  <button onClick={() => setShowCloudGuide(!showCloudGuide)} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-emerald-400 font-black text-[8px] uppercase tracking-widest transition-all">
                    {showCloudGuide ? <ChevronRight className="w-3 h-3 rotate-90" /> : <BookOpen className="w-3 h-3" />} {showCloudGuide ? 'Tutup Panduan' : 'Lihat Panduan Koneksi'}
                  </button>
               </div>
               
                {showCloudGuide && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in slide-in-from-top-4 duration-500 mb-5">
                    <div className="space-y-3">
                       <h4 className="text-[9px] font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-1.5"><Layers className="w-3 h-3 text-emerald-500" /> Tahap Integrasi (Sederhana)</h4>
                        <div className="space-y-2">
                          {[
                            { 
                              title: "1. BUAT SALINAN & IZINKAN AKSES", 
                              desc: "Buka [Google Sheets Baru](https://sheets.new) (atau gunakan file yang sudah ada). Pastikan Anda sudah login ke akun Google di browser.",
                              link: "https://sheets.new"
                            },
                            { 
                              title: "2. BUKA APPS SCRIPT", 
                              desc: "Di dalam Google Sheets, klik menu **Extensions** (Ekstensi) > **Apps Script**." 
                            },
                            { 
                              title: "3. SALIN & TEMPEL KODE", 
                              desc: "Hapus semua kode bawaan di editor, lalu klik tombol **'SALIN KODE'** di samping dan tempelkan (Paste) ke editor Apps Script." 
                            },
                            { 
                              title: "4. DEPLOY (PUBLIKASI)", 
                              desc: "Klik tombol biru **Deploy** > **New Deployment**. Pada bagian 'Select type', pilih **Web App**." 
                            },
                            { 
                              title: "5. SETEL AKSES & IZINKAN", 
                              desc: "Ubah 'Who has access' menjadi **Anyone**. Klik **Deploy**. Klik **Authorize Access**, pilih akun Anda. Jika muncul 'Google hasn't verified', klik **Advanced** > **Go to Jurnal BK (unsafe)** > **Allow**." 
                            },
                            { 
                              title: "6. HUBUNGKAN KE APLIKASI", 
                              desc: "Salin **Web App URL** yang muncul (berakhiran /exec), lalu tempelkan ke kolom 'LINK DATA PRIBADI' di bawah." 
                            }
                          ].map((step, i) => (
                            <div key={i} className="flex gap-2 group">
                               <span className="shrink-0 w-5 h-5 rounded-md bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-[8px]">{i+1}</span>
                               <div className="space-y-0.5">
                                 <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">{step.title}</p>
                                 <p className="text-[9px] text-slate-500 font-medium group-hover:text-slate-700 transition-colors leading-relaxed">
                                   {step.title.includes("BUAT SALINAN") ? (
                                     <>Buka <a href={step.link} target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline hover:text-emerald-300 font-bold">Google Sheets Baru (Klik Disini)</a> atau gunakan file yang sudah ada. Pastikan Anda sudah login ke akun Google.</>
                                   ) : step.desc}
                                 </p>
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                    <div className="space-y-2">
                       <div className="flex justify-between items-center"><h4 className="text-[9px] font-black text-slate-800 uppercase tracking-widest">Script Jurnal</h4><button onClick={handleCopyScript} className="px-2 py-1 bg-emerald-500 text-white rounded-md font-black text-[8px] uppercase tracking-widest shadow-md">{copied ? 'Tersalin!' : 'Klik Untuk Salin'}</button></div>
                       <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 h-48 overflow-y-auto custom-scrollbar font-mono text-[8px] text-emerald-400 leading-relaxed shadow-inner"><pre>{`function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);
    var target = data.target || 'Sheet1';
    var payload = data.payload;
    
    var sheet = ss.getSheetByName(target);
    if (!sheet) {
      sheet = ss.insertSheet(target);
    }

    var headers = [];
    if (sheet.getLastRow() === 0) {
      headers = ["Timestamp", ...Object.keys(payload)];
      sheet.appendRow(headers);
    } else {
      headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      var newKeys = Object.keys(payload).filter(k => headers.indexOf(k) === -1);
      if (newKeys.length > 0) {
        sheet.getRange(1, headers.length + 1, 1, newKeys.length).setValues([newKeys]);
        headers = headers.concat(newKeys);
      }
    }

    var rowData = headers.map(function(header) {
      if (header === 'Timestamp') return new Date();
      var val = payload[header];
      return (typeof val === 'object' && val !== null) ? JSON.stringify(val) : val;
    });

    // Update if ID exists, else append
    var idIndex = headers.indexOf('id');
    var updated = false;
    if (idIndex !== -1 && payload.id) {
      var dataRange = sheet.getDataRange();
      var values = dataRange.getValues();
      for (var i = 1; i < values.length; i++) {
        if (values[i][idIndex] == payload.id) {
          sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
          updated = true;
          break;
        }
      }
    }

    if (!updated) {
      sheet.appendRow(rowData);
    }

    return ContentService.createTextOutput(JSON.stringify({result: "success", updated: updated}))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({result: "error", error: e.message}))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  var target = e.parameter.target || 'students';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(target);
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: 'Sheet not found'})).setMimeType(ContentService.MimeType.JSON);
  }
  
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return ContentService.createTextOutput(JSON.stringify({status: 'success', data: []})).setMimeType(ContentService.MimeType.JSON);
  
  var headers = data[0];
  var rows = data.slice(1);
  
  var result = rows.map(function(row) {
    var obj = {};
    headers.forEach(function(header, index) {
      if (header === 'Timestamp') return;
      var val = row[index];
      try {
        if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
             obj[header] = JSON.parse(val);
        } else {
             obj[header] = val;
        }
      } catch (e) {
        obj[header] = val;
      }
    });
    return obj;
  });
  
  return ContentService.createTextOutput(JSON.stringify({status: 'success', data: result})).setMimeType(ContentService.MimeType.JSON);
}`}</pre></div>
                    </div>
                 </div>
               )}

                   <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-200 space-y-4">
                      {syncQueue.length > 0 && (
                        <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 flex items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-300 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600">
                              <RefreshCw className={`w-4 h-4 ${!isOffline ? 'animate-spin' : ''}`} />
                            </div>
                            <div>
                              <h5 className="text-[10px] font-black text-slate-800 uppercase tracking-tight">Antrean Sinkronisasi</h5>
                              <p className="text-[8px] text-amber-600 font-bold">{syncQueue.length} Data Menunggu Sinkronisasi</p>
                            </div>
                          </div>
                          {!isOffline && (
                            <button 
                              onClick={onProcessSyncQueue}
                              className="bg-amber-600 hover:bg-amber-500 px-3 py-1.5 rounded-lg text-white font-black text-[8px] uppercase tracking-widest transition-all shadow-lg"
                            >
                              Sinkron Sekarang
                            </button>
                          )}
                          <button 
                            onClick={onClearSyncQueue}
                            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 px-3 py-1.5 rounded-lg font-black text-[8px] uppercase tracking-widest transition-all"
                          >
                            Bersihkan
                          </button>
                        </div>
                      )}
                      <div className="space-y-1.5">
                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">LINK DATA PRIBADI SISWA</label>
                        <div className="flex flex-col md:flex-row gap-2">
                           <div className="relative flex-1"><input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://script.google.com/macros/s/.../exec" className="w-full input-cyber rounded-xl py-2.5 pl-10 pr-2 text-[10px] font-bold outline-none focus:border-emerald-500 transition-all text-emerald-400" /><Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" /></div>
                           <div className="flex gap-2"><button onClick={() => onSaveUrl(url)} className="bg-emerald-600 px-4 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest text-white shadow-lg">SIMPAN URL</button><button onClick={handleTestConnection} disabled={isTesting || !url} className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest text-emerald-400">{isTesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wifi className="w-3 h-3" />} TES KONEKSI</button></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                          <button 
                            onClick={onSyncAllStudents}
                            disabled={!url || !url.includes('/exec')}
                            className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-center gap-2 transition-all group disabled:opacity-50"
                          >
                            <Cloud className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                            <div className="text-left">
                              <p className="text-[9px] font-black text-slate-800 uppercase tracking-tight">Upload Semua Siswa</p>
                              <p className="text-[7px] text-slate-500 font-bold">Kirim data lokal ke Google Sheets</p>
                            </div>
                          </button>
                          
                          <button 
                            onClick={onDownloadFromCloud}
                            disabled={!url || !url.includes('/exec')}
                            className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl p-3 flex items-center justify-center gap-2 transition-all group disabled:opacity-50"
                          >
                            <Download className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
                            <div className="text-left">
                              <p className="text-[9px] font-black text-slate-800 uppercase tracking-tight">Download dari Cloud</p>
                              <p className="text-[7px] text-slate-500 font-bold">Ambil data dari Google Sheets</p>
                            </div>
                          </button>
                       </div>

                      <div className="h-[1px] bg-white/5 w-full" />

                      <div className="space-y-1.5">
                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">GOOGLE FORM URL (DATABASE SISWA)</label>
                        <div className="flex flex-col md:flex-row gap-2">
                           <div className="relative flex-1">
                             <input value={gfUrl} onChange={e => setGfUrl(e.target.value)} placeholder="https://docs.google.com/forms/d/.../viewform" className="w-full input-cyber rounded-xl py-2.5 pl-10 pr-2 text-[10px] font-bold outline-none focus:border-emerald-500 transition-all text-emerald-400" />
                             <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                           </div>
                           <button onClick={() => onSaveGoogleFormUrl(gfUrl)} className="bg-emerald-600 px-4 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest text-white shadow-lg">SIMPAN LINK FORM</button>
                        </div>
                      </div>
                   </div>
            </div>
          </div>
        )}

        {activeTab === 'backup' && (
          <div className="glass-card p-5 rounded-[1.5rem] border border-blue-500/10 space-y-4 animate-fade-in bg-gradient-to-br from-blue-950/20 to-transparent">
             <div className="flex items-center gap-3 border-b border-blue-500/10 pb-4">
              <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-lg"><Database className="w-5 h-5" /></div>
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase italic">Pencadangan Data (Flashdisk)</h3>
                <p className="label-luxe text-[7px] text-slate-500">Amankan database Anda dengan menyimpannya ke Flashdisk atau Hard Disk Eksternal</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
              <button onClick={onExportBackup} className="group p-4 bg-white/80 border border-slate-200 rounded-xl text-left hover:border-blue-500/30 transition-all flex items-center gap-3 shadow-lg">
                <div className="p-2 bg-blue-600/10 rounded-lg text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-md"><Download className="w-5 h-5" /></div>
                <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-tighter">Simpan ke Flashdisk</h4>
                  <p className="text-[8px] text-slate-500 font-medium">Download file cadangan .JSON dan pindahkan ke Flashdisk</p>
                </div>
              </button>
              
              <label className="group p-4 bg-white/80 border border-slate-200 rounded-xl text-left hover:border-emerald-500/30 transition-all flex items-center gap-3 cursor-pointer shadow-lg">
                <div className="p-2 bg-emerald-600/10 rounded-lg text-emerald-500 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-md"><Upload className="w-5 h-5" /></div>
                <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-tighter">Buka dari Flashdisk</h4>
                  <p className="text-[8px] text-slate-500 font-medium">Pulihkan data dari file .JSON yang ada di Flashdisk</p>
                </div>
                <input type="file" className="hidden" accept=".json" onChange={(e) => e.target.files?.[0] && onImportBackup(e.target.files[0])} />
              </label>
            </div>

            <div className="pt-2 space-y-3">
              <button 
                onClick={onManualSave} 
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 py-3 rounded-xl font-black uppercase tracking-[0.2em] shadow-xl transition-all text-white text-[8px] flex items-center justify-center gap-2 border border-emerald-700"
              >
                <Save className="w-4 h-4" /> PAKSA SIMPAN KE BROWSER SEKARANG
              </button>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button 
                  onClick={onSyncCloud} 
                  className="bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-black uppercase tracking-[0.2em] shadow-xl transition-all text-white text-[8px] flex items-center justify-center gap-2 border border-indigo-700"
                >
                  <Cloud className="w-4 h-4" /> SINKRONISASI CLOUD
                </button>
                <button 
                  onClick={onResetData} 
                  className="bg-rose-600 hover:bg-rose-500 py-3 rounded-xl font-black uppercase tracking-[0.2em] shadow-xl transition-all text-white text-[8px] flex items-center justify-center gap-2 border border-rose-700"
                >
                  <Trash2 className="w-4 h-4" /> RESET SELURUH DATA
                </button>
              </div>

              <p className="text-[8px] text-slate-500 text-center mt-2 font-bold uppercase tracking-widest italic">
                * Gunakan tombol ini jika Anda ingin memastikan data segera tertulis ke penyimpanan fisik komputer atau sinkron ke cloud.
              </p>
            </div>

            <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/20 rounded-xl flex items-start gap-3">
              <div className="p-1.5 bg-blue-500/20 rounded-lg text-blue-400 mt-0.5">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-slate-800 font-bold text-xs mb-1 uppercase tracking-widest">Cara Memindahkan Data ke PC Lain via Flashdisk:</h4>
                <ol className="list-decimal list-inside text-slate-500 text-[9px] space-y-1">
                  <li>Klik tombol <strong>"Simpan ke Flashdisk"</strong> di atas.</li>
                  <li>File dengan nama <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-300">Backup_JurnalGuruBK_...json</code> akan terunduh ke folder Downloads laptop Anda.</li>
                  <li>Copy file tersebut ke dalam Flashdisk atau Hard Disk Eksternal Anda.</li>
                  <li>Buka aplikasi ini di PC/Laptop lain tanpa perlu internet, masuk ke menu Pengaturan &gt; Backup Flashdisk.</li>
                  <li>Klik <strong>"Buka dari Flashdisk"</strong> dan pilih file .JSON dari Flashdisk Anda.</li>
                </ol>
              </div>
            </div>
            
            <div className="p-3 bg-slate-50/40 rounded-xl border border-blue-500/10 flex items-center gap-3">
              <HardDrive className="w-4 h-4 text-blue-500 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-[8px] font-black text-slate-800 uppercase tracking-widest">Penyimpanan Hard Disk Aktif</p>
                <p className="text-[8px] font-bold text-slate-500 leading-relaxed uppercase tracking-widest">
                  Aplikasi ini secara otomatis menyimpan semua data yang Anda masukkan ke dalam folder penyimpanan browser di Hard Disk komputer Anda. 
                </p>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <Terminal className="w-4 h-4 text-blue-400" />
                <h4 className="text-[9px] font-black text-slate-800 uppercase tracking-widest">Detail Lokasi Penyimpanan Fisik</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[8px] font-black text-blue-400 uppercase tracking-widest">
                    <Monitor className="w-3 h-3" /> Windows (Chrome/Edge)
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[8px] text-slate-500 break-all leading-relaxed">
                    %LOCALAPPDATA%\Google\Chrome\User Data\Default\Local Storage
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[8px] font-black text-blue-400 uppercase tracking-widest">
                    <Apple className="w-3 h-3" /> macOS (Chrome)
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[8px] text-slate-500 break-all leading-relaxed">
                    ~/Library/Application Support/Google/Chrome/Default/Local Storage
                  </div>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <div className="flex items-center gap-1.5 text-[8px] font-black text-emerald-400 uppercase tracking-widest">
                  <FileText className="w-3 h-3" /> Format File
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-2 bg-slate-50/50 rounded-xl border border-slate-200">
                    <p className="text-[8px] font-black text-slate-600 uppercase mb-0.5">Otomatis (Internal)</p>
                    <p className="text-[8px] text-slate-500 leading-relaxed uppercase font-bold">SQLite / LevelDB</p>
                  </div>
                  <div className="p-2 bg-slate-50/50 rounded-xl border border-slate-200">
                    <p className="text-[8px] font-black text-slate-600 uppercase mb-0.5">Cadangan (Manual)</p>
                    <p className="text-[8px] text-slate-500 leading-relaxed uppercase font-bold">.JSON Portable</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-blue-500 shrink-0" />
              <p className="text-[8px] font-bold text-blue-400 leading-relaxed uppercase tracking-widest">Lakukan pencadangan (Backup) minimal sekali sebulan untuk keamanan arsip digital Anda.</p>
            </div>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="glass-card p-5 rounded-[1.5rem] border border-blue-500/10 space-y-6 shadow-xl animate-fade-in bg-gradient-to-br from-blue-950/20 to-transparent">
            <div className="flex items-center gap-3 border-b border-blue-500/10 pb-4">
              <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-lg"><Palette className="w-5 h-5" /></div>
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase italic">Kustomisasi Tampilan</h3>
                <p className="label-luxe text-[7px] text-slate-500">Personalisasi tema, font, dan warna aplikasi Anda</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Monitor className="w-3 h-3 text-blue-500" /> Tema Aplikasi
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'light', name: 'Terang', icon: Sun, color: 'bg-white' },
                      { id: 'standard', name: 'Standar', icon: AppWindow, color: 'bg-blue-600' },
                      { id: 'classic', name: 'Klasik', icon: Coffee, color: 'bg-amber-50' }
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => onUpdateAppearance({ ...appearance, theme: t.id as ThemeMode })}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${appearance.theme === t.id ? 'border-blue-500 bg-blue-50/50 shadow-md' : 'border-slate-300 bg-white/50 hover:border-blue-300'}`}
                      >
                        <div className={`w-8 h-8 rounded-lg ${t.color} flex items-center justify-center border border-slate-200 shadow-sm`}>
                          <t.icon className={`w-4 h-4 ${t.id === 'standard' ? 'text-white' : 'text-slate-600'}`} />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-700">{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Type className="w-3 h-3 text-blue-500" /> Pilihan Font
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'jakarta', name: 'Plus Jakarta', font: 'font-jakarta' },
                      { id: 'inter', name: 'Inter Sans', font: 'font-inter' },
                      { id: 'poppins', name: 'Poppins', font: 'font-poppins' },
                      { id: 'sans', name: 'System Sans', font: 'font-sans' }
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => onUpdateAppearance({ ...appearance, font: f.id as FontChoice })}
                        className={`p-3 rounded-xl border text-left transition-all ${appearance.font === f.id ? 'border-blue-500 bg-blue-50/50 shadow-md' : 'border-slate-300 bg-white/50 hover:border-blue-300'}`}
                      >
                        <span className={`text-xs font-bold ${f.font} text-slate-800`}>{f.name}</span>
                        <p className="text-[7px] text-slate-500 mt-1 uppercase tracking-widest">The quick brown fox</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Palette className="w-3 h-3 text-blue-500" /> Warna Utama
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      '#2563eb', '#4f46e5', '#7c3aed', '#db2777', '#dc2626',
                      '#ea580c', '#d97706', '#65a30d', '#059669', '#0891b2'
                    ].map((color) => (
                      <button
                        key={color}
                        onClick={() => onUpdateAppearance({ ...appearance, primaryColor: color })}
                        className={`w-full aspect-square rounded-full border-4 transition-all ${appearance.primaryColor === color ? 'border-white shadow-lg scale-110' : 'border-transparent hover:scale-105'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-3 mt-4 p-3 bg-white/50 rounded-xl border border-slate-200">
                    <div className="w-8 h-8 rounded-lg shadow-inner" style={{ backgroundColor: appearance.primaryColor }} />
                    <div className="flex-1">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Warna Terpilih</p>
                      <input 
                        type="text" 
                        value={appearance.primaryColor} 
                        onChange={(e) => onUpdateAppearance({ ...appearance, primaryColor: e.target.value })}
                        className="bg-transparent border-none outline-none text-xs font-mono font-bold text-slate-800 w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 space-y-2">
                  <h4 className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                    <Info className="w-3 h-3" /> Info Tampilan
                  </h4>
                  <p className="text-[9px] text-slate-600 font-medium leading-relaxed">
                    Perubahan tampilan akan langsung diterapkan ke seluruh aplikasi. Pengaturan ini disimpan secara lokal di browser Anda.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-blue-500/10">
              <button 
                onClick={() => {
                  onUpdateAppearance(appearance);
                  if (showNotification) showNotification("Pengaturan Tampilan Berhasil Disimpan", "success");
                }} 
                className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl transition-all text-white text-[9px] border border-blue-700"
              >
                Simpan Pengaturan Tampilan
              </button>
            </div>
          </div>
        )}

        {activeTab === 'firebase' &&
          <div className="glass-card p-5 rounded-[1.5rem] border border-orange-500/10 space-y-4 animate-fade-in bg-gradient-to-br from-orange-950/20 to-transparent">
             <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-600/10 rounded-xl flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-lg"><Flame className="w-5 h-5" /></div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase italic">Kolaborasi Tim</h3>
                    <p className="label-luxe text-[7px] text-orange-500">Hubungkan ke Firebase untuk fitur Real-Time</p>
                  </div>
                </div>
                <button onClick={() => window.open('https://console.firebase.google.com/', '_blank')} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-lg text-orange-400 font-black text-[8px] uppercase tracking-widest transition-all">
                  <ExternalLink className="w-3 h-3" /> Console Firebase
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-3">
                   <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-200 space-y-3">
                      <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5"><Lock className="w-3 h-3 text-orange-500" /> Konfigurasi Project</h4>
                      
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">API Key</label>
                        <input 
                          type="password"
                          value={fbForm.apiKey || ''} 
                          onChange={e => setFbForm({ ...fbForm, apiKey: e.target.value })} 
                          placeholder="AIzaSy..." 
                          className="w-full input-cyber rounded-xl p-2.5 text-[10px] font-bold outline-none focus:border-orange-500 transition-all text-slate-800" 
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Project ID</label>
                        <input 
                          value={fbForm.projectId || ''} 
                          onChange={e => setFbForm({ ...fbForm, projectId: e.target.value })} 
                          placeholder="my-school-project" 
                          className="w-full input-cyber rounded-xl p-2.5 text-[10px] font-bold outline-none focus:border-orange-500 transition-all text-slate-800" 
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">App ID</label>
                        <input 
                          value={fbForm.appId || ''} 
                          onChange={e => setFbForm({ ...fbForm, appId: e.target.value })} 
                          placeholder="1:1234567890:web:..." 
                          className="w-full input-cyber rounded-xl p-2.5 text-[10px] font-bold outline-none focus:border-orange-500 transition-all text-slate-800" 
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Database ID (Opsional)</label>
                        <input 
                          value={fbForm.firestoreDatabaseId || ''} 
                          onChange={e => setFbForm({ ...fbForm, firestoreDatabaseId: e.target.value })} 
                          placeholder="(default)" 
                          className="w-full input-cyber rounded-xl p-2.5 text-[10px] font-bold outline-none focus:border-orange-500 transition-all text-slate-800" 
                        />
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => onSaveFirebase && onSaveFirebase(fbForm)}
                          className="flex-1 bg-orange-600 hover:bg-orange-500 py-2.5 rounded-xl font-black uppercase tracking-widest text-[9px] text-white shadow-lg transition-all flex items-center justify-center gap-1.5 border border-orange-700"
                        >
                          <RefreshCw className="w-3 h-3" /> Simpan & Hubungkan
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm('Reset konfigurasi ke default?')) {
                              localStorage.removeItem('guru_bk_firebase_config');
                              window.location.reload();
                            }
                          }}
                          className="px-3 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-300 text-slate-500 transition-all"
                          title="Reset ke Default"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      </div>
                   </div>
                   
                   <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20 text-[9px] text-slate-800 leading-relaxed space-y-2">
                      <p className="font-black uppercase tracking-widest flex items-center gap-1.5 text-orange-600"><Info className="w-3 h-3" /> Panduan Detail Mencari API Key:</p>
                      <ol className="list-decimal list-inside space-y-1 font-bold">
                        <li>Buka <strong>Firebase Console</strong> dan masuk ke proyek Anda.</li>
                        <li>Klik ikon <strong>Gear</strong>, pilih <strong>Project settings</strong>.</li>
                        <li>Tab <strong>General</strong>, scroll ke <strong>Your apps</strong>.</li>
                        <li>Cari <strong>SDK setup and configuration</strong>.</li>
                        <li>Pilih opsi <strong>Config</strong>.</li>
                        <li>Salin <code>apiKey</code> yang diawali <strong>"AIzaSy"</strong>.</li>
                      </ol>
                      <div className="pt-1.5 border-t border-orange-500/20 italic text-[8px] text-orange-700">
                        * Pastikan Firestore Database & Auth sudah aktif.
                      </div>
                   </div>
                </div>

                <div className="space-y-3">
                   <div className="glass-card p-4 rounded-xl border border-slate-200 space-y-4">
                      <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Status Koneksi</h4>
                      {firebaseConfig?.apiKey ? (
                        <div className="flex items-center gap-3 p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                           <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20"><Check className="w-4 h-4 text-slate-800" /></div>
                           <div>
                              <h5 className="text-xs font-black text-slate-800 uppercase tracking-tight">Terhubung</h5>
                              <p className="text-[8px] text-emerald-600 font-bold">Project ID: {firebaseConfig.projectId}</p>
                           </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-2 bg-slate-100/50 rounded-lg border border-slate-200">
                           <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center"><Unlink className="w-4 h-4 text-slate-500" /></div>
                           <div>
                              <h5 className="text-xs font-black text-slate-500 uppercase tracking-tight">Belum Terhubung</h5>
                              <p className="text-[8px] text-slate-500 font-bold">Masukkan konfigurasi di samping</p>
                           </div>
                        </div>
                      )}
                      
                      <div className="space-y-2 pt-3 border-t border-slate-200">
                         <h5 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Fitur Aktif:</h5>
                         <ul className="space-y-1.5">
                            {['Sharing Jurnal & Catatan', 'Diskusi Tim Real-time', 'Sinkronisasi Perangkat'].map((feat, i) => (
                              <li key={i} className="flex items-center gap-2 text-[9px] text-slate-600 font-bold">
                                <div className="w-1 h-1 rounded-full bg-orange-500" /> {feat}
                              </li>
                            ))}
                         </ul>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        }
        {activeTab === 'notifications' && (
          <div className="glass-card p-5 rounded-[1.5rem] border border-emerald-500/10 space-y-4 animate-fade-in bg-gradient-to-br from-emerald-950/20 to-transparent">
             <div className="flex items-center gap-3 border-b border-emerald-500/10 pb-4">
              <div className="w-10 h-10 bg-emerald-600/10 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-lg"><Bell className="w-5 h-5" /></div>
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase italic">Pusat Notifikasi</h3>
                <p className="label-luxe text-[7px] text-slate-500">Kirim pengumuman atau pengingat ke seluruh tim BK</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-4">
                <div className="p-4 bg-white/50 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <RefreshCw className="w-3 h-3 text-emerald-500" /> Buat Notifikasi Baru
                  </h4>
                  <NotificationCreator db={db} auth={auth} />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 space-y-3">
                  <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                    <Info className="w-3 h-3" /> Info Notifikasi
                  </h4>
                  <div className="space-y-2">
                    <p className="text-[9px] text-slate-700 font-medium leading-relaxed">
                      Fitur ini memungkinkan Anda untuk mengirimkan notifikasi real-time ke semua perangkat yang terhubung dengan database Firebase yang sama.
                    </p>
                    <ul className="space-y-1.5">
                      {[
                        'Notifikasi akan muncul di pojok kanan atas',
                        'Dapat digunakan untuk pengingat jadwal konseling',
                        'Memerlukan koneksi Firebase yang aktif',
                        'Hanya admin yang dapat mengirim notifikasi massal'
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-[8px] text-slate-600 font-bold uppercase tracking-widest">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {showPassModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4 bg-slate-50/95 backdrop-blur-2xl animate-in fade-in duration-200">
          <div className="relative glass-card w-full max-w-xs rounded-[1.5rem] p-5 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200 bg-white/95">
            <h3 className="text-lg font-black text-slate-800 text-center mb-1 uppercase tracking-tighter italic">Otorisasi Guru</h3>
            <p className="text-[8px] text-slate-500 text-center mb-4 uppercase tracking-[0.2em] font-black">Masukkan Password Keamanan</p>
            <form onSubmit={verifyPassword} className="space-y-3">
              <div className="relative">
                <input autoFocus type={showVerifyPass ? "text" : "password"} value={passwordInput} onChange={e => setPasswordInput(e.target.value)} placeholder="••••••••" className={`w-full input-cyber ${passError ? 'border-rose-500' : ''} rounded-xl p-3 text-center text-sm tracking-[0.5em] outline-none transition-all pr-10 text-slate-800 shadow-inner`} />
                <button type="button" onClick={() => setShowVerifyPass(!showVerifyPass)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-600 hover:text-slate-800 transition-colors">{showVerifyPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
              {passError && <p className="text-[8px] text-rose-500 text-center font-bold animate-bounce uppercase tracking-widest">Password Salah!</p>}
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-blue-600 py-2.5 rounded-xl font-black uppercase text-[9px] tracking-widest text-white shadow-lg">VERIFIKASI</button>
                <button type="button" onClick={() => { setShowPassModal(false); setPassError(false); setPasswordInput(''); }} className="px-4 bg-slate-100 rounded-xl text-slate-500 hover:bg-slate-200 transition-all border border-slate-200"><X className="w-4 h-4" /></button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSchoolPassModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4 bg-slate-50/95 backdrop-blur-2xl animate-in fade-in duration-200">
          <div className="relative glass-card w-full max-w-xs rounded-[1.5rem] p-5 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200 bg-white/95">
            <h3 className="text-lg font-black text-slate-800 text-center mb-1 uppercase tracking-tighter italic">Otorisasi Instansi</h3>
            <p className="text-[8px] text-slate-500 text-center mb-4 uppercase tracking-[0.2em] font-black">Masukkan Password Khusus Sekolah</p>
            <form onSubmit={verifySchoolPassword} className="space-y-3">
              <div className="relative">
                <input autoFocus type={showVerifySchoolPass ? "text" : "password"} value={schoolPassInput} onChange={e => setSchoolPassInput(e.target.value)} placeholder="••••••••" className={`w-full input-cyber ${schoolPassError ? 'border-rose-500' : ''} rounded-xl p-3 text-center text-sm tracking-[0.5em] outline-none transition-all pr-10 text-slate-800 shadow-inner`} />
                <button type="button" onClick={() => setShowVerifySchoolPass(!showVerifySchoolPass)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-600 hover:text-slate-800 transition-colors">{showVerifySchoolPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
              {schoolPassError && <p className="text-[8px] text-rose-500 text-center font-bold animate-bounce uppercase tracking-widest">Password Salah!</p>}
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-blue-600 py-2.5 rounded-xl font-black uppercase text-[9px] tracking-widest text-white shadow-lg">VERIFIKASI</button>
                <button type="button" onClick={() => { setShowSchoolPassModal(false); setSchoolPassError(false); setSchoolPassInput(''); }} className="px-4 bg-slate-100 rounded-xl text-slate-500 hover:bg-slate-200 transition-all border border-slate-200"><X className="w-4 h-4" /></button>
              </div>
            </form>
          </div>
        </div>
      )}

      {changePassMode && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4 bg-slate-50/95 backdrop-blur-2xl animate-in fade-in duration-200">
          <div className="relative glass-card w-full max-w-xs rounded-[1.5rem] p-5 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200 bg-white/95">
            <h3 className="text-lg font-black text-slate-800 text-center mb-1 uppercase tracking-tighter italic">Ganti Password</h3>
            <p className="text-[8px] text-slate-500 text-center mb-4 uppercase tracking-[0.2em] font-black">
              {changePassMode === 'akses' ? 'Password Akses Guru' : 'Password Instansi / Sekolah'}
            </p>
            
            {changePassStep === 1 ? (
              <form onSubmit={handleVerifyOldPass} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Password Lama</label>
                  <div className="relative">
                    <input autoFocus type={showVerifyPass ? "text" : "password"} value={oldPassInput} onChange={e => setOldPassInput(e.target.value)} placeholder="••••••••" className={`w-full input-cyber ${changePassError ? 'border-rose-500' : ''} rounded-xl p-3 text-center text-sm tracking-[0.5em] outline-none transition-all pr-10 text-slate-800 shadow-inner`} />
                    <button type="button" onClick={() => setShowVerifyPass(!showVerifyPass)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-600 hover:text-slate-800 transition-colors">{showVerifyPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                  </div>
                </div>
                {changePassError && <p className="text-[8px] text-rose-500 text-center font-bold animate-bounce uppercase tracking-widest">{changePassError}</p>}
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-blue-600 py-2.5 rounded-xl font-black uppercase text-[9px] tracking-widest text-white shadow-lg">LANJUT</button>
                  <button type="button" onClick={() => setChangePassMode(null)} className="px-4 bg-slate-100 rounded-xl text-slate-500 hover:bg-slate-200 transition-all border border-slate-200"><X className="w-4 h-4" /></button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSaveNewPass} className="space-y-3">
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Password Baru</label>
                    <div className="relative">
                      <input autoFocus type={showVerifyPass ? "text" : "password"} value={newPassInput} onChange={e => setNewPassInput(e.target.value)} placeholder="••••••••" className={`w-full input-cyber ${changePassError && newPassInput.length < 6 ? 'border-rose-500' : ''} rounded-xl p-3 text-center text-sm tracking-[0.5em] outline-none transition-all pr-10 text-slate-800 shadow-inner`} />
                      <button type="button" onClick={() => setShowVerifyPass(!showVerifyPass)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-600 hover:text-slate-800 transition-colors">{showVerifyPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Konfirmasi Password Baru</label>
                    <div className="relative">
                      <input type={showVerifyPass ? "text" : "password"} value={confirmPassInput} onChange={e => setConfirmPassInput(e.target.value)} placeholder="••••••••" className={`w-full input-cyber ${changePassError && newPassInput !== confirmPassInput ? 'border-rose-500' : ''} rounded-xl p-3 text-center text-sm tracking-[0.5em] outline-none transition-all pr-10 text-slate-800 shadow-inner`} />
                    </div>
                  </div>
                </div>
                {changePassError && <p className="text-[8px] text-rose-500 text-center font-bold animate-bounce uppercase tracking-widest">{changePassError}</p>}
                <div className="flex flex-col gap-2">
                  <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 py-2.5 rounded-xl font-black uppercase text-[9px] tracking-widest text-white shadow-lg transition-all">BUAT PASSWORD BARU</button>
                  <button type="button" onClick={() => setChangePassMode(null)} className="w-full bg-slate-100 hover:bg-slate-200 py-2.5 rounded-xl font-black uppercase text-[9px] tracking-widest text-slate-600 transition-all border border-slate-200">BATAL</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
