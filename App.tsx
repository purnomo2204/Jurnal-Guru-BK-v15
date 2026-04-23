
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AnimatePresence, motion } from "motion/react";
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { initializeApp, getApp } from 'firebase/app';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, setDoc, getDoc, getDocs, collection, Firestore, deleteDoc } from 'firebase/firestore';
import { getMessaging, onMessage } from 'firebase/messaging';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { ViewMode, Student, CounselingLog, TeacherData, FirebaseConfig, CounselingGroup, CounselingType, EventLog, AppearanceConfig, Achievement, Scholarship, Violation, AttendanceRecord, CounselingSchedule, NeedAssessment, HomeVisit, VulnerabilityMap, Referral, AKPDResponse, AKPDQuestion, ReportAndMutation, ParentCommunication, EconomicallyDisadvantagedStudent, TDA, Sociometry, DailyJournal, AcademicEvent, ProblemReport, GuidanceMaterial, RPL, ClassicalGuidanceSchedule } from './types';
import { AKPD_QUESTIONS } from './constants';
import DailyJournalInput from './components/DailyJournalInput';
import DailyJournalManagement from './components/DailyJournalManagement';
import ErrorBoundary from './components/ErrorBoundary';
import SidebarLayout from './components/SidebarLayout';
import WelcomeScreen from './components/WelcomeScreen';
import Dashboard from './components/Dashboard';
import StudentManagement from './components/StudentManagement';
import CounselingManagement from './components/CounselingManagement';
import AnecdotalRecordManagement from './components/AnecdotalRecordManagement';
import LPJManagement from './components/LPJManagement';
import StrategyHub from './components/StrategyHub';
import StrategyReports from './components/StrategyReports';
import GuidanceBoard from './components/GuidanceBoard';
import Settings from './components/Settings';
import UsageGuide from './components/UsageGuide';
import DutaAssistant from './components/DutaAssistant';
import WorkMechanism from './components/WorkMechanism';
import ComponentRecap from './components/ComponentRecap';
import StudentPersonalBook from './components/StudentPersonalBook';
import Student360Profile from './components/Student360Profile';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AchievementManagement from './components/AchievementManagement';
import RplGenerator from './components/RplGenerator';
import StrategyGenerator from './components/StrategyGenerator';
import ViolationManagement from './components/ViolationManagement';
import AutomatedReports from './components/AutomatedReports';
import AnnualReportDashboard from './components/AnnualReportDashboard';
import AttendanceManagement from './components/AttendanceManagement';
import CounselingScheduleComponent from './components/CounselingSchedule';
import ClassicalGuidanceScheduleManagement from './components/ClassicalGuidanceScheduleManagement';
import NeedAssessmentComponent from './components/NeedAssessment';
import VulnerabilityMapComponent from './components/VulnerabilityMap';
import HomeVisitManagement from './components/HomeVisitManagement';
import HomeVisitInput from './components/HomeVisitInput';
import ReferralManagement from './components/ReferralManagement';
import ReportAndMutationManagement from './components/ReportAndMutationManagement';
import StudentAKPDView from './components/StudentAKPDView';
import ExcelImportPreview from './components/ExcelImportPreview';
import CollaborationHub from './components/CollaborationHub';
import ParentCommunicationComponent from './components/ParentCommunication';
import StudentDataReport from './components/StudentDataReport';
import TdaInput from './components/TdaInput';
import SociometryManagement from './components/SociometryManagement';
import CertificationsTab from './components/CertificationsTab';
import DocumentManagement from './components/DocumentManagement';
import ProblemBox from './components/ProblemBox';
import LkpdMateriGenerator from './components/LkpdMateriGenerator';
import CounselingApproaches from './components/CounselingApproaches';
import CounselingTechniques from './components/CounselingTechniques';
import CounselingDictionary from './components/CounselingDictionary';
import IceBreaking from './components/IceBreaking';
import SopManagement from './components/SopManagement';
import KodeEtik from './components/KodeEtik';
import AsasBK from './components/AsasBK';

import { db, auth } from './src/lib/firebase';
import firebaseAppletConfig from './firebase-applet-config.json';
import { Loader2, CheckCircle2, AlertCircle, X, ChevronLeft, Search, Users, BookOpen, Link, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Toaster, toast } from 'sonner';

const App: React.FC = () => {
  // Helper for lazy initialization
  const getSaved = <T,>(key: string, fallback: T): T => {
    if (typeof window === 'undefined') return fallback;
    const saved = localStorage.getItem(key);
    if (saved && saved !== "undefined") {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return fallback;
      }
    }
    return fallback;
  };

  const [calendarViewMode, setCalendarViewMode] = useState<'month' | 'week' | 'day' | 'agenda'>(() => getSaved('guru_bk_calendar_view_mode', 'month'));
  const [settingsTab, setSettingsTab] = useState<'profile' | 'report' | 'subjects' | 'cloud' | 'backup' | 'firebase' | 'appearance'>('profile');
  const navigate = useNavigate();
  const location = useLocation();
  const [view, setViewState] = useState<ViewMode>(ViewMode.HOME);

  useEffect(() => {
    if (teacherData.school === '') {
      const updatedTeacherData = { ...teacherData, school: 'SMP NEGERI 2 MAGELANG' };
      setTeacherData(updatedTeacherData);
      localStorage.setItem('guru_bk_teacher_data', JSON.stringify(updatedTeacherData));
    }
  }, []);

  useEffect(() => {
    const path = location.pathname;
    if (path === '/welcome' || path === '/') {
      if (view !== ViewMode.WELCOME) setViewState(ViewMode.WELCOME);
    } else if (path === '/dashboard') {
      if (![ViewMode.HOME, ViewMode.STUDENT_LIST, ViewMode.COLLABORATION, ViewMode.STUDENT_PERSONAL_BOOK, ViewMode.STUDENT_360_PROFILE, ViewMode.WORK_MECHANISM, ViewMode.STUDENT_AKPD].includes(view)) {
        setViewState(ViewMode.HOME);
      }
    } else if (path === '/input') {
      if (![ViewMode.INPUT_DATA_CATEGORY, ViewMode.STUDENT_INPUT, ViewMode.COUNSELING_INPUT, ViewMode.ANECDOTAL_RECORD_INPUT, ViewMode.ACHIEVEMENT_MANAGEMENT, ViewMode.STRATEGY_GENERATOR, ViewMode.VIOLATION_MANAGEMENT, ViewMode.ATTENDANCE_MANAGEMENT, ViewMode.COUNSELING_SCHEDULE, ViewMode.CLASSICAL_GUIDANCE_SCHEDULE, ViewMode.NEED_ASSESSMENT, ViewMode.HOME_VISIT, ViewMode.HOME_VISIT_INPUT, ViewMode.REFERRAL_MANAGEMENT, ViewMode.STUDENT_REPORT_INPUT, ViewMode.PARENT_COMMUNICATION, ViewMode.TDA_INPUT, ViewMode.REPORT_MUTATION, ViewMode.SOCIOMETRY].includes(view)) {
        setViewState(ViewMode.INPUT_DATA_CATEGORY);
      }
    } else if (path === '/laporan') {
      if (![ViewMode.REPORT_CATEGORY, ViewMode.COUNSELING_DATA, ViewMode.ANECDOTAL_RECORD_DATA, ViewMode.LPJ_MANAGEMENT, ViewMode.STRATEGY_HUB, ViewMode.STRATEGY_REPORTS, ViewMode.COMPONENT_RECAP, ViewMode.ANALYTICS, ViewMode.AUTOMATED_REPORTS, ViewMode.VULNERABILITY_MAP, ViewMode.STUDENT_DATA_REPORT, ViewMode.ANNUAL_REPORT].includes(view)) {
        setViewState(ViewMode.REPORT_CATEGORY);
      }
    } else if (path === '/jurnal') {
      if (view !== ViewMode.DAILY_JOURNAL_DATA) setViewState(ViewMode.DAILY_JOURNAL_DATA);
    } else if (path === '/jurnal/input') {
      if (view !== ViewMode.DAILY_JOURNAL_INPUT) setViewState(ViewMode.DAILY_JOURNAL_INPUT);
    } else if (path === '/kotak-masalah') {
      if (view !== ViewMode.PROBLEM_BOX) setViewState(ViewMode.PROBLEM_BOX);
    } else if (path === '/pendekatan-konseling') {
      if (view !== ViewMode.COUNSELING_APPROACHES) setViewState(ViewMode.COUNSELING_APPROACHES);
    } else if (path === '/teknik-konseling') {
      if (view !== ViewMode.COUNSELING_TECHNIQUES) setViewState(ViewMode.COUNSELING_TECHNIQUES);
    } else if (path === '/asas-bk') {
      if (view !== ViewMode.ASAS_BK) setViewState(ViewMode.ASAS_BK);
    } else if (path === '/kamus-bk') {
      if (view !== ViewMode.COUNSELING_DICTIONARY) setViewState(ViewMode.COUNSELING_DICTIONARY);
    } else if (path === '/ice-breaking') {
      if (view !== ViewMode.ICE_BREAKING) setViewState(ViewMode.ICE_BREAKING);
    } else if (path === '/sop-bk') {
      if (view !== ViewMode.SOP_MANAGEMENT) setViewState(ViewMode.SOP_MANAGEMENT);
    } else if (path === '/kode-etik') {
      if (view !== ViewMode.KODE_ETIK) setViewState(ViewMode.KODE_ETIK);
    } else if (path === '/kolaborasi') {
      if (view !== ViewMode.COLLABORATION) setViewState(ViewMode.COLLABORATION);
    } else if (path === '/dokumen') {
      if (view !== ViewMode.DOCUMENT_MANAGEMENT) setViewState(ViewMode.DOCUMENT_MANAGEMENT);
    } else if (path === '/lkpd-materi') {
      if (view !== ViewMode.LKPD_MATERI_GENERATOR) setViewState(ViewMode.LKPD_MATERI_GENERATOR);
    } else if (path === '/papan-bimbingan') {
      if (view !== ViewMode.GUIDANCE_BOARD) setViewState(ViewMode.GUIDANCE_BOARD);
    } else if (path === '/rpl-otomatis') {
      if (view !== ViewMode.RPL_GENERATOR) setViewState(ViewMode.RPL_GENERATOR);
    } else if (path === '/sertifikat') {
      if (view !== ViewMode.CERTIFICATE_MANAGEMENT) setViewState(ViewMode.CERTIFICATE_MANAGEMENT);
    } else if (path === '/developer') {
      if (view !== ViewMode.DEVELOPER_INFO) setViewState(ViewMode.DEVELOPER_INFO);
    } else if (path === '/settings-menu') {
      if (view !== ViewMode.SETTINGS_CATEGORY && view !== ViewMode.SETTINGS) setViewState(ViewMode.SETTINGS_CATEGORY);
    } else if (path === '/settings') {
      if (view !== ViewMode.SETTINGS) setViewState(ViewMode.SETTINGS);
    }
  }, [location.pathname]); // Only depend on pathname

  const setView = (v: ViewMode) => {
    console.log("Setting view to:", v);
    setViewState(v);
    switch(v) {
      case ViewMode.WELCOME: navigate('/welcome'); break;
      case ViewMode.HOME: 
      case ViewMode.STUDENT_LIST:
      case ViewMode.WORK_MECHANISM:
      case ViewMode.STUDENT_AKPD:
      case ViewMode.STUDENT_PERSONAL_BOOK:
      case ViewMode.STUDENT_360_PROFILE:
        navigate('/dashboard'); break;
      case ViewMode.INPUT_DATA_CATEGORY:
      case ViewMode.STUDENT_INPUT:
      case ViewMode.COUNSELING_INPUT:
      case ViewMode.ANECDOTAL_RECORD_INPUT:
      case ViewMode.ACHIEVEMENT_MANAGEMENT:
      case ViewMode.STRATEGY_GENERATOR:
      case ViewMode.VIOLATION_MANAGEMENT:
      case ViewMode.ATTENDANCE_MANAGEMENT:
      case ViewMode.COUNSELING_SCHEDULE:
      case ViewMode.CLASSICAL_GUIDANCE_SCHEDULE:
      case ViewMode.NEED_ASSESSMENT:
      case ViewMode.HOME_VISIT:
      case ViewMode.HOME_VISIT_INPUT:
      case ViewMode.REFERRAL_MANAGEMENT:
      case ViewMode.REPORT_MUTATION:
      case ViewMode.STUDENT_REPORT_INPUT:
      case ViewMode.PARENT_COMMUNICATION:
      case ViewMode.TDA_INPUT:
      case ViewMode.SOCIOMETRY:
        navigate('/input'); break;
      case ViewMode.REPORT_CATEGORY:
      case ViewMode.COUNSELING_DATA:
      case ViewMode.ANECDOTAL_RECORD_DATA:
      case ViewMode.LPJ_MANAGEMENT:
      case ViewMode.STRATEGY_HUB:
      case ViewMode.STRATEGY_REPORTS:
      case ViewMode.COMPONENT_RECAP:
      case ViewMode.ANALYTICS:
      case ViewMode.ANNUAL_REPORT:
      case ViewMode.AUTOMATED_REPORTS:
      case ViewMode.VULNERABILITY_MAP:
      case ViewMode.STUDENT_DATA_REPORT:
        navigate('/laporan'); break;
      case ViewMode.SETTINGS: navigate('/settings'); break;
      case ViewMode.SETTINGS_CATEGORY: navigate('/settings-menu'); break;
      case ViewMode.COLLABORATION: navigate('/kolaborasi'); break;
      case ViewMode.DOCUMENT_MANAGEMENT: navigate('/dokumen'); break;
      case ViewMode.LKPD_MATERI_GENERATOR: navigate('/lkpd-materi'); break;
      case ViewMode.RPL_GENERATOR: navigate('/rpl-otomatis'); break;
      case ViewMode.GUIDANCE_BOARD: navigate('/papan-bimbingan'); break;
      case ViewMode.DAILY_JOURNAL_INPUT: navigate('/jurnal/input'); break;
      case ViewMode.DAILY_JOURNAL_DATA: navigate('/jurnal'); break;
      case ViewMode.PROBLEM_BOX: navigate('/kotak-masalah'); break;
      case ViewMode.COUNSELING_DICTIONARY: navigate('/kamus-bk'); break;
      case ViewMode.ICE_BREAKING: navigate('/ice-breaking'); break;
      case ViewMode.SOP_MANAGEMENT: navigate('/sop-bk'); break;
      case ViewMode.KODE_ETIK: navigate('/kode-etik'); break;
      case ViewMode.ASAS_BK: navigate('/asas-bk'); break;
      case ViewMode.COUNSELING_APPROACHES: navigate('/pendekatan-konseling'); break;
      case ViewMode.COUNSELING_TECHNIQUES: navigate('/teknik-konseling'); break;
      case ViewMode.DEVELOPER_INFO: navigate('/developer'); break;
      case ViewMode.CERTIFICATE_MANAGEMENT: navigate('/sertifikat'); break;
      default: navigate('/dashboard');
    }
  };
  const [excelImportPreview, setExcelImportPreview] = useState<Student[]>([]);
  const [selectedStudentIdForBook, setSelectedStudentIdForBook] = useState<string | null>(null);
  const [selectedStudentIdFor360, setSelectedStudentIdFor360] = useState<string | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');
  
  const [students, setStudents] = useState<Student[]>(() => getSaved('guru_bk_students', []));
  const [counselingLogs, setCounselingLogs] = useState<CounselingLog[]>(() => getSaved('guru_bk_logs', []));
  const [eventLogs, setEventLogs] = useState<EventLog[]>(() => getSaved('guru_bk_events', []));
  const [achievements, setAchievements] = useState<Achievement[]>(() => getSaved('guru_bk_achievements', []));
  const [scholarships, setScholarships] = useState<Scholarship[]>(() => getSaved('guru_bk_scholarships', []));
  const [economicallyDisadvantagedStudents, setEconomicallyDisadvantagedStudents] = useState<EconomicallyDisadvantagedStudent[]>(() => getSaved('guru_bk_economically_disadvantaged', []));
  const [violations, setViolations] = useState<Violation[]>(() => getSaved('guru_bk_violations', []));
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => getSaved('guru_bk_attendance', []));
  const [counselingSchedules, setCounselingSchedules] = useState<CounselingSchedule[]>(() => getSaved('guru_bk_schedules', []));
  const [classicalSchedules, setClassicalSchedules] = useState<ClassicalGuidanceSchedule[]>(() => getSaved('guru_bk_classical_schedules', []));
  const [needAssessments, setNeedAssessments] = useState<NeedAssessment[]>(() => getSaved('guru_bk_assessments', []));
  const [akpdResponses, setAkpdResponses] = useState<AKPDResponse[]>(() => getSaved('guru_bk_akpd', []));
  const [akpdSheetUrl, setAkpdSheetUrl] = useState(() => localStorage.getItem('guru_bk_akpd_sheet_url') || '');
  const [urlTeacherId, setUrlTeacherId] = useState<string | null>(null);
  const [homeVisits, setHomeVisits] = useState<HomeVisit[]>(() => getSaved('guru_bk_home_visits', []));
  const [vulnerabilityMaps, setVulnerabilityMaps] = useState<VulnerabilityMap[]>(() => getSaved('guru_bk_vuln_maps', []));
  const [referrals, setReferrals] = useState<Referral[]>(() => getSaved('guru_bk_referrals', []));
  const [reportAndMutations, setReportAndMutations] = useState<ReportAndMutation[]>(() => getSaved('guru_bk_report_mutations', []));
  const [parentCommunications, setParentCommunications] = useState<ParentCommunication[]>(() => getSaved('guru_bk_parent_comms', []));
  const [dailyJournals, setDailyJournals] = useState<DailyJournal[]>(() => getSaved('guru_bk_daily_journals', []));
  const [academicEvents, setAcademicEvents] = useState<AcademicEvent[]>(() => getSaved('guru_bk_academic_events', []));
  const [sociometryData, setSociometryData] = useState<Sociometry[]>(() => getSaved('guru_bk_sociometry', []));
  const [tdaRecords, setTdaRecords] = useState<TDA[]>(() => getSaved('guru_bk_tda', []));
  const [rpls, setRpls] = useState<RPL[]>(() => getSaved('guru_bk_rpls', []));
  const [problemReports, setProblemReports] = useState<ProblemReport[]>(() => getSaved('guru_bk_problem_reports', []));
  const [guidanceMaterials, setGuidanceMaterials] = useState<GuidanceMaterial[]>(() => getSaved('guru_bk_guidance_materials', []));
  const [akpdQuestions, setAkpdQuestions] = useState<AKPDQuestion[]>(() => getSaved('guru_bk_akpd_questions', AKPD_QUESTIONS));
  const [groups, setGroups] = useState<CounselingGroup[]>(() => getSaved('guru_bk_groups', []));
  const [counselingGroups, setCounselingGroups] = useState<CounselingGroup[]>(() => getSaved('guru_bk_counseling_groups', []));
  const [academicYear, setAcademicYear] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>(() => localStorage.getItem('guru_bk_selected_academic_year') || '');
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'loading' | 'error' | 'info'} | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [syncQueue, setSyncQueue] = useState<{target: string, payload: any}[]>(() => getSaved('guru_bk_sync_queue', []));

  const [counselingEditId, setCounselingEditId] = useState<string | null>(null);
  const [editingJournal, setEditingJournal] = useState<DailyJournal | null>(null);
  const [editingClassicalSchedule, setEditingClassicalSchedule] = useState<ClassicalGuidanceSchedule | null>(null);

  useEffect(() => { localStorage.setItem('guru_bk_calendar_view_mode', JSON.stringify(calendarViewMode)); }, [calendarViewMode]);
  useEffect(() => { localStorage.setItem('guru_bk_students', JSON.stringify(students)); }, [students]);
  useEffect(() => { localStorage.setItem('guru_bk_logs', JSON.stringify(counselingLogs)); }, [counselingLogs]);
  useEffect(() => { localStorage.setItem('guru_bk_events', JSON.stringify(eventLogs)); }, [eventLogs]);
  useEffect(() => { localStorage.setItem('guru_bk_achievements', JSON.stringify(achievements)); }, [achievements]);
  useEffect(() => { localStorage.setItem('guru_bk_scholarships', JSON.stringify(scholarships)); }, [scholarships]);
  useEffect(() => { localStorage.setItem('guru_bk_economically_disadvantaged', JSON.stringify(economicallyDisadvantagedStudents)); }, [economicallyDisadvantagedStudents]);
  useEffect(() => { localStorage.setItem('guru_bk_violations', JSON.stringify(violations)); }, [violations]);
  useEffect(() => { localStorage.setItem('guru_bk_attendance', JSON.stringify(attendanceRecords)); }, [attendanceRecords]);
  useEffect(() => { localStorage.setItem('guru_bk_schedules', JSON.stringify(counselingSchedules)); }, [counselingSchedules]);
  useEffect(() => { localStorage.setItem('guru_bk_classical_schedules', JSON.stringify(classicalSchedules)); }, [classicalSchedules]);
  useEffect(() => { localStorage.setItem('guru_bk_assessments', JSON.stringify(needAssessments)); }, [needAssessments]);
  useEffect(() => { localStorage.setItem('guru_bk_akpd', JSON.stringify(akpdResponses)); }, [akpdResponses]);
  useEffect(() => { localStorage.setItem('guru_bk_akpd_sheet_url', akpdSheetUrl); }, [akpdSheetUrl]);
  useEffect(() => { localStorage.setItem('guru_bk_home_visits', JSON.stringify(homeVisits)); }, [homeVisits]);
  useEffect(() => { localStorage.setItem('guru_bk_vuln_maps', JSON.stringify(vulnerabilityMaps)); }, [vulnerabilityMaps]);
  useEffect(() => { localStorage.setItem('guru_bk_referrals', JSON.stringify(referrals)); }, [referrals]);
  useEffect(() => { localStorage.setItem('guru_bk_report_mutations', JSON.stringify(reportAndMutations)); }, [reportAndMutations]);
  useEffect(() => { localStorage.setItem('guru_bk_parent_comms', JSON.stringify(parentCommunications)); }, [parentCommunications]);
  useEffect(() => { localStorage.setItem('guru_bk_daily_journals', JSON.stringify(dailyJournals)); }, [dailyJournals]);
  useEffect(() => { localStorage.setItem('guru_bk_academic_events', JSON.stringify(academicEvents)); }, [academicEvents]);
  useEffect(() => { localStorage.setItem('guru_bk_sociometry', JSON.stringify(sociometryData)); }, [sociometryData]);
  useEffect(() => { localStorage.setItem('guru_bk_tda', JSON.stringify(tdaRecords)); }, [tdaRecords]);
  useEffect(() => { localStorage.setItem('guru_bk_rpls', JSON.stringify(rpls)); }, [rpls]);
  useEffect(() => { localStorage.setItem('guru_bk_problem_reports', JSON.stringify(problemReports)); }, [problemReports]);
  useEffect(() => { localStorage.setItem('guru_bk_guidance_materials', JSON.stringify(guidanceMaterials)); }, [guidanceMaterials]);
  useEffect(() => { localStorage.setItem('guru_bk_akpd_questions', JSON.stringify(akpdQuestions)); }, [akpdQuestions]);
  useEffect(() => { localStorage.setItem('guru_bk_groups', JSON.stringify(groups)); }, [groups]);
  useEffect(() => { localStorage.setItem('guru_bk_counseling_groups', JSON.stringify(counselingGroups)); }, [counselingGroups]);
  useEffect(() => { localStorage.setItem('guru_bk_selected_academic_year', selectedAcademicYear); }, [selectedAcademicYear]);
  useEffect(() => { localStorage.setItem('guru_bk_sync_queue', JSON.stringify(syncQueue)); }, [syncQueue]);

  const studentIdsMatchingSearch = useMemo(() => {
    if (!globalSearch) return null;
    const query = globalSearch.toLowerCase();
    return new Set(
      students
        .filter(s => 
          s.name?.toLowerCase().includes(query) || 
          s.nis?.toLowerCase().includes(query) ||
          s.nisn?.toLowerCase().includes(query) ||
          s.studentCode?.toLowerCase().includes(query)
        )
        .map(s => s.id)
    );
  }, [students, globalSearch]);

  const filteredStudents = useMemo(() => {
    if (globalSearch) {
      const query = globalSearch.toLowerCase();
      return students.filter(s => 
        s.name?.toLowerCase().includes(query) || 
        s.nis?.toLowerCase().includes(query) ||
        s.nisn?.toLowerCase().includes(query) ||
        s.className?.toLowerCase().includes(query) ||
        s.studentCode?.toLowerCase().includes(query)
      );
    }
    return selectedAcademicYear ? students.filter(s => s.academicYear === selectedAcademicYear) : students;
  }, [students, selectedAcademicYear, globalSearch]);

  const studentIdsInYear = useMemo(() => new Set(filteredStudents.map(s => s.id)), [filteredStudents]);

  const filteredCounselingLogs = useMemo(() => {
    if (globalSearch) {
      const query = globalSearch.toLowerCase();
      return counselingLogs.filter(l => 
        (studentIdsMatchingSearch?.has(l.studentId)) ||
        l.studentName?.toLowerCase().includes(query) ||
        l.topic?.toLowerCase().includes(query) ||
        l.result?.toLowerCase().includes(query) ||
        l.notes?.toLowerCase().includes(query) ||
        l.type?.toLowerCase().includes(query) ||
        l.aspect?.toLowerCase().includes(query)
      );
    }
    return selectedAcademicYear 
      ? counselingLogs.filter(l => {
          // If the log has an academicYear, use it directly (this handles CLASS_, GROUP_, SYSTEM logs correctly)
          if (l.academicYear) {
            return l.academicYear === selectedAcademicYear;
          }
          // Fallback for older data without academicYear: check if the student is in the selected year
          return studentIdsInYear.has(l.studentId);
        }) 
      : counselingLogs;
  }, [counselingLogs, studentIdsInYear, selectedAcademicYear, globalSearch, studentIdsMatchingSearch]);

  const filteredEventLogs = useMemo(() => {
    if (globalSearch) {
      const query = globalSearch.toLowerCase();
      return eventLogs.filter(e => 
        (studentIdsMatchingSearch?.has(e.studentId)) ||
        e.studentName?.toLowerCase().includes(query) ||
        e.manualStudentName?.toLowerCase().includes(query) ||
        e.manualClassName?.toLowerCase().includes(query) ||
        e.description?.toLowerCase().includes(query) ||
        e.resolution?.toLowerCase().includes(query) ||
        e.notes?.toLowerCase().includes(query)
      );
    }
    return selectedAcademicYear 
      ? eventLogs.filter(e => studentIdsInYear.has(e.studentId) || e.academicYear === selectedAcademicYear) 
      : eventLogs;
  }, [eventLogs, studentIdsInYear, selectedAcademicYear, globalSearch, studentIdsMatchingSearch]);

  const filteredAchievements = useMemo(() => {
    if (globalSearch) {
      const query = globalSearch.toLowerCase();
      return achievements.filter(a => 
        (studentIdsMatchingSearch?.has(a.studentId)) ||
        a.achievement?.toLowerCase().includes(query) ||
        a.description?.toLowerCase().includes(query) ||
        a.achievementType?.toLowerCase().includes(query)
      );
    }
    return selectedAcademicYear ? achievements.filter(a => {
      if (a.academicYear) return a.academicYear === selectedAcademicYear;
      return studentIdsInYear.has(a.studentId);
    }) : achievements;
  }, [achievements, studentIdsInYear, selectedAcademicYear, globalSearch, studentIdsMatchingSearch]);

  const filteredViolations = useMemo(() => {
    if (globalSearch) {
      const query = globalSearch.toLowerCase();
      return violations.filter(v => 
        (studentIdsMatchingSearch?.has(v.studentId)) ||
        v.violation?.toLowerCase().includes(query) ||
        v.description?.toLowerCase().includes(query) ||
        v.actionTaken?.toLowerCase().includes(query)
      );
    }
    return selectedAcademicYear ? violations.filter(v => studentIdsInYear.has(v.studentId)) : violations;
  }, [violations, studentIdsInYear, selectedAcademicYear, globalSearch, studentIdsMatchingSearch]);

  const filteredAttendance = useMemo(() => {
    if (globalSearch) {
      const query = globalSearch.toLowerCase();
      return attendanceRecords.filter(r => 
        (studentIdsMatchingSearch?.has(r.studentId)) ||
        r.status?.toLowerCase().includes(query) ||
        r.notes?.toLowerCase().includes(query)
      );
    }
    return selectedAcademicYear ? attendanceRecords.filter(r => studentIdsInYear.has(r.studentId)) : attendanceRecords;
  }, [attendanceRecords, studentIdsInYear, selectedAcademicYear, globalSearch, studentIdsMatchingSearch]);

  const filteredSchedules = useMemo(() => {
    if (globalSearch) {
      const query = globalSearch.toLowerCase();
      return counselingSchedules.filter(s => 
        (studentIdsMatchingSearch?.has(s.studentId)) ||
        s.studentName?.toLowerCase().includes(query) ||
        s.topic?.toLowerCase().includes(query) ||
        s.notes?.toLowerCase().includes(query)
      );
    }
    return selectedAcademicYear ? counselingSchedules.filter(s => studentIdsInYear.has(s.studentId)) : counselingSchedules;
  }, [counselingSchedules, studentIdsInYear, selectedAcademicYear, globalSearch, studentIdsMatchingSearch]);

  const filteredAssessments = useMemo(() => {
    if (globalSearch) {
      const query = globalSearch.toLowerCase();
      return needAssessments.filter(a => 
        (studentIdsMatchingSearch?.has(a.studentId)) ||
        a.problem?.toLowerCase().includes(query) ||
        a.aspect?.toLowerCase().includes(query)
      );
    }
    return selectedAcademicYear ? needAssessments.filter(a => studentIdsInYear.has(a.studentId)) : needAssessments;
  }, [needAssessments, studentIdsInYear, selectedAcademicYear, globalSearch, studentIdsMatchingSearch]);

  const filteredAkpd = useMemo(() => {
    if (globalSearch) {
      return akpdResponses.filter(r => studentIdsMatchingSearch?.has(r.studentId));
    }
    return selectedAcademicYear ? akpdResponses.filter(r => studentIdsInYear.has(r.studentId)) : akpdResponses;
  }, [akpdResponses, studentIdsInYear, selectedAcademicYear, globalSearch, studentIdsMatchingSearch]);

  const filteredHomeVisits = useMemo(() => {
    if (globalSearch) {
      const query = globalSearch.toLowerCase();
      return homeVisits.filter(v => 
        (studentIdsMatchingSearch?.has(v.studentId)) ||
        v.purpose?.toLowerCase().includes(query) ||
        v.result?.toLowerCase().includes(query) ||
        v.followUp?.toLowerCase().includes(query) ||
        v.address?.toLowerCase().includes(query)
      );
    }
    return selectedAcademicYear ? homeVisits.filter(v => studentIdsInYear.has(v.studentId)) : homeVisits;
  }, [homeVisits, studentIdsInYear, selectedAcademicYear, globalSearch, studentIdsMatchingSearch]);

  const filteredVulnMaps = useMemo(() => {
    if (globalSearch) {
      const query = globalSearch.toLowerCase();
      return vulnerabilityMaps.filter(m => 
        (studentIdsMatchingSearch?.has(m.studentId)) ||
        m.riskLevel?.toLowerCase().includes(query) ||
        m.factors?.some(f => f?.toLowerCase().includes(query))
      );
    }
    return selectedAcademicYear ? vulnerabilityMaps.filter(m => studentIdsInYear.has(m.studentId)) : vulnerabilityMaps;
  }, [vulnerabilityMaps, studentIdsInYear, selectedAcademicYear, globalSearch, studentIdsMatchingSearch]);

  const filteredReferrals = useMemo(() => {
    if (globalSearch) {
      const query = globalSearch.toLowerCase();
      return referrals.filter(r => 
        (studentIdsMatchingSearch?.has(r.studentId)) ||
        r.referredTo?.toLowerCase().includes(query) ||
        r.reason?.toLowerCase().includes(query) ||
        r.notes?.toLowerCase().includes(query)
      );
    }
    return selectedAcademicYear ? referrals.filter(r => studentIdsInYear.has(r.studentId)) : referrals;
  }, [referrals, studentIdsInYear, selectedAcademicYear, globalSearch, studentIdsMatchingSearch]);

  const filteredTda = useMemo(() => {
    if (globalSearch) {
      const query = globalSearch.toLowerCase();
      return tdaRecords.filter(t => 
        (studentIdsMatchingSearch?.has(t.studentId)) ||
        t.studentName?.toLowerCase().includes(query) ||
        t.learningStyle?.toLowerCase().includes(query) ||
        t.personalityType?.toLowerCase().includes(query) ||
        t.multipleIntelligences?.toLowerCase().includes(query) ||
        t.talentInterest?.toLowerCase().includes(query) ||
        t.careerKey?.toLowerCase().includes(query)
      );
    }
    return selectedAcademicYear ? tdaRecords.filter(t => studentIdsInYear.has(t.studentId)) : tdaRecords;
  }, [tdaRecords, studentIdsInYear, selectedAcademicYear, globalSearch, studentIdsMatchingSearch]);

  const filteredReportMutations = useMemo(() => {
    if (globalSearch) {
      const query = globalSearch.toLowerCase();
      return reportAndMutations.filter(rm => 
        (studentIdsMatchingSearch?.has(rm.studentId)) ||
        rm.mutationDestination?.toLowerCase().includes(query) ||
        rm.mutationReason?.toLowerCase().includes(query) ||
        rm.notes?.toLowerCase().includes(query)
      );
    }
    return selectedAcademicYear ? reportAndMutations.filter(rm => studentIdsInYear.has(rm.studentId)) : reportAndMutations;
  }, [reportAndMutations, studentIdsInYear, selectedAcademicYear, globalSearch, studentIdsMatchingSearch]);

  const filteredGroups = useMemo(() => {
    let result = selectedAcademicYear ? groups.filter(g => g.academicYear === selectedAcademicYear) : groups;
    if (globalSearch) {
      const query = globalSearch.toLowerCase();
      result = result.filter(g => 
        g.name?.toLowerCase().includes(query) ||
        g.className?.toLowerCase().includes(query)
      );
    }
    return result;
  }, [groups, selectedAcademicYear, globalSearch]);

  const filteredCounselingGroups = useMemo(() => {
    let result = selectedAcademicYear ? counselingGroups.filter(g => g.academicYear === selectedAcademicYear) : counselingGroups;
    if (globalSearch) {
      const query = globalSearch.toLowerCase();
      result = result.filter(g => 
        g.name?.toLowerCase().includes(query) ||
        g.className?.toLowerCase().includes(query)
      );
    }
    return result;
  }, [counselingGroups, selectedAcademicYear, globalSearch]);

  const filteredDailyJournals = useMemo(() => {
    let result = dailyJournals;
    if (globalSearch) {
      const query = globalSearch.toLowerCase();
      result = result.filter(j => 
        j.activityName?.toLowerCase().includes(query) ||
        j.activityType?.toLowerCase().includes(query) ||
        j.description?.toLowerCase().includes(query) ||
        j.notes?.toLowerCase().includes(query) ||
        j.place?.toLowerCase().includes(query)
      );
    }
    return result;
  }, [dailyJournals, globalSearch]);

  const filteredProblemReports = useMemo(() => {
    let result = problemReports;
    if (globalSearch) {
      const query = globalSearch.toLowerCase();
      result = result.filter(r => 
        r.studentName?.toLowerCase().includes(query) ||
        r.problemDescription?.toLowerCase().includes(query) ||
        r.specialNotes?.toLowerCase().includes(query) ||
        r.problemType?.toLowerCase().includes(query)
      );
    }
    return result;
  }, [problemReports, globalSearch]);

  const filteredGuidanceMaterials = useMemo(() => {
    let result = guidanceMaterials;
    if (globalSearch) {
      const query = globalSearch.toLowerCase();
      result = result.filter(m => 
        m.title?.toLowerCase().includes(query) ||
        m.content?.toLowerCase().includes(query) ||
        m.author?.toLowerCase().includes(query) ||
        m.category?.toLowerCase().includes(query) ||
        m.tags?.some(t => t?.toLowerCase().includes(query))
      );
    }
    return result;
  }, [guidanceMaterials, globalSearch]);

  const filteredSociometry = useMemo(() => {
    let result = sociometryData;
    if (globalSearch) {
      const query = globalSearch.toLowerCase();
      result = result.filter(s => 
        s.className?.toLowerCase().includes(query) ||
        s.criteria?.toLowerCase().includes(query)
      );
    }
    return result;
  }, [sociometryData, globalSearch]);

  const filteredScholarships = useMemo(() => {
    if (globalSearch) {
      const query = globalSearch.toLowerCase();
      return scholarships.filter(s => 
        (studentIdsMatchingSearch?.has(s.studentId)) ||
        s.scholarshipName?.toLowerCase().includes(query) ||
        s.level?.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query)
      );
    }
    return selectedAcademicYear ? scholarships.filter(s => {
      if (s.academicYear) return s.academicYear === selectedAcademicYear;
      return studentIdsInYear.has(s.studentId);
    }) : scholarships;
  }, [scholarships, studentIdsInYear, selectedAcademicYear, globalSearch, studentIdsMatchingSearch]);

  const filteredEconomicallyDisadvantagedStudents = useMemo(() => {
    if (globalSearch) {
      const query = globalSearch.toLowerCase();
      return economicallyDisadvantagedStudents.filter(s => 
        (studentIdsMatchingSearch?.has(s.studentId)) ||
        s.manualStudentName?.toLowerCase().includes(query) ||
        s.manualClassName?.toLowerCase().includes(query) ||
        s.address?.toLowerCase().includes(query) ||
        s.fatherJob?.toLowerCase().includes(query) ||
        s.motherJob?.toLowerCase().includes(query) ||
        s.specialNotes?.toLowerCase().includes(query) ||
        s.assistanceSource?.toLowerCase().includes(query)
      );
    }
    return selectedAcademicYear ? economicallyDisadvantagedStudents.filter(s => {
      if (s.academicYear) return s.academicYear === selectedAcademicYear;
      return (s.studentId === '__MANUAL__' && s.date.includes(selectedAcademicYear.split('/')[0])) || studentIdsInYear.has(s.studentId);
    }) : economicallyDisadvantagedStudents;
  }, [economicallyDisadvantagedStudents, studentIdsInYear, selectedAcademicYear, globalSearch, studentIdsMatchingSearch]);

  const filteredParentCommunications = useMemo(() => {
    if (globalSearch) {
      const query = globalSearch.toLowerCase();
      return parentCommunications.filter(c => 
        (studentIdsMatchingSearch?.has(c.studentId)) ||
        c.studentName?.toLowerCase().includes(query) ||
        c.parentName?.toLowerCase().includes(query) ||
        c.message?.toLowerCase().includes(query)
      );
    }
    return selectedAcademicYear ? parentCommunications.filter(c => studentIdsInYear.has(c.studentId)) : parentCommunications;
  }, [parentCommunications, studentIdsInYear, selectedAcademicYear, globalSearch, studentIdsMatchingSearch]);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState(() => localStorage.getItem('guru_bk_spreadsheet_url') || '');
  const [googleFormUrl, setGoogleFormUrl] = useState(() => localStorage.getItem('guru_bk_google_form_url') || '');
  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseConfig | null>(() => {
    const saved = getSaved<FirebaseConfig | null>('guru_bk_firebase_config', null);
    const appletConfig = (firebaseAppletConfig && firebaseAppletConfig.apiKey && firebaseAppletConfig.apiKey.startsWith('AIzaSy')) 
      ? firebaseAppletConfig as FirebaseConfig 
      : null;

    if (saved) {
      // Merge with applet config if it's the same project to ensure all fields are present
      if (appletConfig && saved.projectId === appletConfig.projectId) {
        return { ...appletConfig, ...saved };
      }
      return saved;
    }
    return appletConfig;
  });
  const [showGuide, setShowGuide] = useState(false);
  const [appearance, setAppearance] = useState<AppearanceConfig>(() => {
    const defaultAppearance = {
      theme: 'light',
      font: 'jakarta',
      primaryColor: '#2563eb',
      moduleOrder: ['Input Data', 'Laporan', 'Sistem']
    };
    const saved = getSaved('guru_bk_appearance', defaultAppearance);
    return { ...defaultAppearance, ...saved };
  });
  
  // Migration for appearance.moduleOrder
  useEffect(() => {
    if (appearance.moduleOrder && appearance.moduleOrder.includes('PUSAT PENGATURAN')) {
      const newOrder = appearance.moduleOrder.map(key => key === 'PUSAT PENGATURAN' ? 'Sistem' : key);
      setAppearance(prev => ({ ...prev, moduleOrder: newOrder }));
      localStorage.setItem('guru_bk_appearance', JSON.stringify({ ...appearance, moduleOrder: newOrder }));
    }
  }, [appearance]);
  
  const [teacherData, setTeacherData] = useState<TeacherData>(() => getSaved('guru_bk_teacher_data', {
    name: '',
    nip: '',
    school: 'SMP NEGERI 2 MAGELANG',
    schoolAddress: '',
    academicYear: '',
    accessPassword: '',
    photo: '',
    govOrFoundation: '',
    deptOrFoundation: '',
    city: '',
    approvalDate: '',
    principalName: '',
    principalNip: '',
    phone: '',
    schoolPassword: '@Dutatama220469'
  }));

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '');
      
      const getParam = (name: string) => searchParams.get(name) || hashParams.get(name);

      if (getParam('view') === 'akpd') {
        setView(ViewMode.STUDENT_AKPD);
      }
      if (getParam('view') === 'report_mutation_student') {
        setView(ViewMode.STUDENT_REPORT_INPUT);
      }
      
      const urlAkpdSheet = getParam('akpd_sheet');
      if (urlAkpdSheet) {
        setAkpdSheetUrl(urlAkpdSheet);
      }

      const teacherIdParam = getParam('teacher_id');
      if (teacherIdParam) {
        setUrlTeacherId(teacherIdParam);
      }

      // Initialize Firebase if config exists
      if (firebaseConfig) {
        initFirebase(firebaseConfig);
      }

      // Notify if starting offline
      if (!navigator.onLine) {
        toast.error('Mode Offline Aktif', {
          description: 'Aplikasi mendeteksi Anda sedang offline. Data akan disimpan di penyimpanan lokal.',
          icon: <WifiOff className="w-5 h-5 text-rose-500" />,
          duration: 5000,
        });
      }

      // Initialize Messaging
      if (firebaseConfig?.messagingSenderId) {
        try {
          const messaging = getMessaging(getApp());
          onMessage(messaging, (payload) => {
            console.log('Message received. ', payload);
            toast.info(payload.notification?.title || 'Pesan Baru', {
              description: payload.notification?.body,
            });
          });
        } catch (messagingErr) {
          console.warn("Firebase Messaging initialization failed:", messagingErr);
        }
      }

      // Auto-save confirmation for user
      setTimeout(() => {
        showNotification('Data berhasil dimuat dari penyimpanan lokal (Hard Disk)', 'success');
      }, 1000);

      const handleOnline = () => {
        setIsOffline(false);
        toast.success('Koneksi Terhubung Kembali', {
          description: 'Aplikasi sekarang dalam mode Online. Data Anda akan disinkronkan ke Cloud secara otomatis.',
          icon: <Wifi className="w-5 h-5 text-emerald-500" />,
          duration: 5000,
        });
      };
      const handleOffline = () => {
        setIsOffline(true);
        toast.error('Koneksi Terputus', {
          description: 'Aplikasi sekarang dalam mode Offline. Jangan khawatir, semua data baru akan tetap tersimpan dengan aman di penyimpanan lokal (Hard Disk) perangkat ini.',
          icon: <WifiOff className="w-5 h-5 text-rose-500" />,
          duration: 8000,
        });
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    } catch (err) {
      console.error("Error loading initial data:", err);
    }
  }, []);

  const initFirebase = (config: FirebaseConfig) => {
    if (config.apiKey && config.projectId && config.apiKey.startsWith('AIzaSy')) {
      try {
        // Check if app already initialized to avoid error
        let app;
        try {
          app = initializeApp({
            apiKey: config.apiKey.trim(),
            authDomain: config.authDomain?.trim() || `${config.projectId.trim()}.firebaseapp.com`,
            projectId: config.projectId.trim(),
            appId: config.appId?.trim(),
            messagingSenderId: config.messagingSenderId?.trim()
          });
        } catch (e: any) {
          if (e.code === 'app/duplicate-app') {
             // If duplicate, we can ignore or get existing app
             console.warn("Firebase App already initialized");
             app = getApp();
          } else {
            let errorMessage = "Terjadi kesalahan saat menginisialisasi Firebase.";
            switch (e.code) {
              case 'auth/invalid-api-key':
                errorMessage = "Kunci API Firebase tidak valid. Silakan periksa kembali di Pengaturan.";
                break;
              case 'auth/invalid-project-id':
                errorMessage = "ID Proyek Firebase tidak valid.";
                break;
              case 'auth/app-not-found':
                errorMessage = "Aplikasi Firebase tidak ditemukan.";
                break;
              default:
                errorMessage = `Kesalahan Firebase: ${e.message || e.code}`;
            }
            showNotification(errorMessage, "error");
            console.error("Firebase Initialization Error:", e);
            return;
          }
        }
        
        let firestore: Firestore;
        try {
          firestore = initializeFirestore(app, {
            localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
          }, config.firestoreDatabaseId);
        } catch (e) {
          // Fallback if already initialized
          firestore = getFirestore(app, config.firestoreDatabaseId);
        }
        
        const firebaseAuth = getAuth(app);
        
        onAuthStateChanged(firebaseAuth, (user) => {
          setCurrentUser(user);
          setIsAuthReady(true);
          if (user) {
            showNotification(`Terhubung sebagai ${user.displayName}`, 'success');
          }
        });
      } catch (err: any) {
        console.error("Firebase Init Error:", err);
        if (err.code === 'auth/invalid-api-key') {
          showNotification("Kunci API Firebase tidak valid. Periksa kembali di Pengaturan.", "error");
        } else {
          showNotification("Gagal inisialisasi Firebase: " + err.message, "error");
        }
      }
    } else if (config.apiKey && !config.apiKey.startsWith('AIzaSy')) {
      console.warn("Invalid API Key format detected");
      // Don't show notification here to avoid spamming on every load if it's just empty/placeholder
    }
  };

  const handleLogin = async () => {
    if (!auth) {
      showNotification("Firebase belum dikonfigurasi", "error");
      return;
    }
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Login Error:", err);
      if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
        // User cancelled the login, no need to show an error notification
        return;
      }
      showNotification("Gagal Login ke Cloud", "error");
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      showNotification("Berhasil Logout", "success");
    } catch (err) {
      console.error("Logout Error:", err);
    }
  };

  const processSyncQueue = async () => {
    if (isOffline || syncQueue.length === 0) return;
    
    const queue = [...syncQueue];
    setSyncQueue([]); // Clear queue before processing
    
    showNotification(`Sinkronisasi ${queue.length} Data Tertunda...`, "loading");
    
    let successCount = 0;
    for (const item of queue) {
      try {
        await syncDataToCloud(item.target as any, item.payload);
        successCount++;
      } catch (err) {
        console.error("Sync Queue Error:", err);
        setSyncQueue(prev => [...prev, item]);
      }
    }
    
    if (successCount > 0) {
      showNotification(`${successCount} Data Berhasil Disinkronkan`, "success");
    }
  };

  const handleClearSyncQueue = () => {
    if (window.confirm(`Anda yakin ingin menghapus ${syncQueue.length} data yang belum disinkronkan? Data ini tidak akan tersimpan di Cloud.`)) {
      setSyncQueue([]);
      showNotification("Antrean sinkronisasi telah dibersihkan", "info");
    }
  };

  useEffect(() => {
    if (!isOffline && syncQueue.length > 0) {
      const timer = setTimeout(() => {
        processSyncQueue();
      }, 3000); // Wait 3 seconds after coming online to start sync
      return () => clearTimeout(timer);
    }
  }, [isOffline, syncQueue.length]);

  useEffect(() => {
    localStorage.setItem('guru_bk_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('guru_bk_logs', JSON.stringify(counselingLogs));
  }, [counselingLogs]);

  useEffect(() => {
    localStorage.setItem('guru_bk_events', JSON.stringify(eventLogs));
  }, [eventLogs]);

  useEffect(() => {
    localStorage.setItem('guru_bk_achievements', JSON.stringify(achievements));
  }, [achievements]);

  useEffect(() => {
    localStorage.setItem('guru_bk_scholarships', JSON.stringify(scholarships));
  }, [scholarships]);

  useEffect(() => {
    localStorage.setItem('guru_bk_economically_disadvantaged', JSON.stringify(economicallyDisadvantagedStudents));
  }, [economicallyDisadvantagedStudents]);

  useEffect(() => {
    localStorage.setItem('guru_bk_violations', JSON.stringify(violations));
  }, [violations]);

  useEffect(() => {
    localStorage.setItem('guru_bk_attendance', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem('guru_bk_schedules', JSON.stringify(counselingSchedules));
  }, [counselingSchedules]);

  useEffect(() => {
    localStorage.setItem('guru_bk_assessments', JSON.stringify(needAssessments));
  }, [needAssessments]);

  useEffect(() => {
    localStorage.setItem('guru_bk_akpd', JSON.stringify(akpdResponses));
  }, [akpdResponses]);

  useEffect(() => {
    localStorage.setItem('guru_bk_akpd_sheet_url', akpdSheetUrl);
  }, [akpdSheetUrl]);

  useEffect(() => {
    localStorage.setItem('guru_bk_home_visits', JSON.stringify(homeVisits));
  }, [homeVisits]);

  useEffect(() => {
    localStorage.setItem('guru_bk_vuln_maps', JSON.stringify(vulnerabilityMaps));
  }, [vulnerabilityMaps]);

  useEffect(() => {
    localStorage.setItem('guru_bk_referrals', JSON.stringify(referrals));
  }, [referrals]);

  useEffect(() => {
    localStorage.setItem('guru_bk_report_mutations', JSON.stringify(reportAndMutations));
  }, [reportAndMutations]);

  useEffect(() => {
    localStorage.setItem('guru_bk_parent_comms', JSON.stringify(parentCommunications));
  }, [parentCommunications]);

  useEffect(() => {
    localStorage.setItem('guru_bk_tda', JSON.stringify(tdaRecords));
  }, [tdaRecords]);

  useEffect(() => {
    localStorage.setItem('guru_bk_problem_reports', JSON.stringify(problemReports));
  }, [problemReports]);

  useEffect(() => {
    localStorage.setItem('guru_bk_sociometry', JSON.stringify(sociometryData));
  }, [sociometryData]);

  useEffect(() => {
    localStorage.setItem('guru_bk_academic_events', JSON.stringify(academicEvents));
  }, [academicEvents]);

  useEffect(() => {
    localStorage.setItem('guru_bk_akpd_questions', JSON.stringify(akpdQuestions));
  }, [akpdQuestions]);

  useEffect(() => {
    localStorage.setItem('guru_bk_groups', JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem('guru_bk_counseling_groups', JSON.stringify(counselingGroups));
  }, [counselingGroups]);

  useEffect(() => {
    localStorage.setItem('guru_bk_teacher_data', JSON.stringify(teacherData));
  }, [teacherData]);

  useEffect(() => {
    localStorage.setItem('guru_bk_spreadsheet_url', spreadsheetUrl);
  }, [spreadsheetUrl]);

  useEffect(() => {
    if (selectedAcademicYear) {
      localStorage.setItem('guru_bk_selected_academic_year', selectedAcademicYear);
    }
  }, [selectedAcademicYear]);

  useEffect(() => {
    localStorage.setItem('guru_bk_appearance', JSON.stringify(appearance));
    
    // Apply theme class to body
    document.body.classList.remove('theme-light', 'theme-standard', 'theme-classic', 'light', 'standard', 'classic');
    document.body.classList.add(`theme-${appearance.theme}`);
    document.body.classList.add(appearance.theme);
    
    // Apply font class to body
    document.body.classList.remove('font-sans', 'font-serif', 'font-mono', 'font-jakarta', 'font-inter', 'font-poppins');
    document.body.classList.add(`font-${appearance.font}`);
    
    // Apply primary color as CSS variable
    document.documentElement.style.setProperty('--primary-color', appearance.primaryColor);
    
    // Standard theme is the blue one, we don't need 'dark' class for it unless we want to keep dark mode support
    // But the user specifically asked to replace 'dark' with 'standard' blue.
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
  }, [appearance]);

  // Sync teacher profile to cloud
  useEffect(() => {
    if (db && currentUser) {
      const docRef = doc(db, "teachers", currentUser.uid, "profile", "data");
      setDoc(docRef, { ...teacherData, lastSync: new Date().toISOString() }, { merge: true });
    }
  }, [teacherData, db, currentUser]);

  // Fetch teacher profile if teacher_id is in URL
  useEffect(() => {
    const fetchTeacherProfile = async () => {
      if (db && urlTeacherId) {
        try {
          const docRef = doc(db, "teachers", urlTeacherId, "profile", "data");
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as TeacherData;
            setTeacherData(prev => ({ ...prev, ...data }));
            showNotification(`Profil Guru ${data.name || ''} berhasil dimuat`, "success");
          }
        } catch (e) {
          console.error("Error fetching teacher profile:", e);
        }
      }
    };
    fetchTeacherProfile();
  }, [db, urlTeacherId]);

  const showNotification = (msg: string, type: 'success' | 'loading' | 'error' | 'info' = 'success') => {
    setNotification({ msg, type });
    if (type !== 'loading') {
      setTimeout(() => setNotification(null), 5000);
    }
  };

  enum OperationType {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    LIST = 'list',
    GET = 'get',
    WRITE = 'write',
  }

  interface FirestoreErrorInfo {
    error: string;
    operationType: OperationType;
    path: string | null;
    authInfo: {
      userId: string | undefined;
      email: string | null | undefined;
      emailVerified: boolean | undefined;
      isAnonymous: boolean | undefined;
      tenantId: string | null | undefined;
      providerInfo: {
        providerId: string;
        displayName: string | null;
        email: string | null;
        photoUrl: string | null;
      }[];
    }
  }

  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: currentUser?.uid,
        email: currentUser?.email,
        emailVerified: currentUser?.emailVerified,
        isAnonymous: currentUser?.isAnonymous,
        tenantId: currentUser?.tenantId,
        providerInfo: currentUser?.providerData.map(provider => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL
        })) || []
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    showNotification("Gagal sinkronisasi ke Cloud. Periksa koneksi atau izin.", "error");
    throw new Error(JSON.stringify(errInfo));
  };

  const syncToFirebase = async (collectionName: 'students' | 'logs' | 'groups' | 'events' | 'akpd' | 'schedules' | 'parent_communications' | 'homeroom_journals' | 'tda' | 'sociometry' | 'achievements' | 'violations' | 'problem_reports' | 'guidance_materials' | 'scholarships' | 'daily_journals' | 'report_mutations' | 'attendance', data: any) => {
    if (!db) return;
    
    // Prioritize urlTeacherId in student-facing views to ensure data goes to the right teacher
    // even if the student is logged into their own Google account
    const isStudentView = view === ViewMode.STUDENT_AKPD || view === ViewMode.STUDENT_REPORT_INPUT || window.location.hash.includes('/kotak-masalah-siswa');
    
    // If it's not a student view and the user is not logged in, don't try to write to protected collections
    if (!isStudentView && !currentUser) {
      showNotification("Silakan login dengan Google di Pengaturan untuk menyimpan ke Cloud.", "error");
      return;
    }

    const teacherId = isStudentView 
      ? (urlTeacherId || currentUser?.uid || "global_teacher")
      : (currentUser?.uid || teacherData.nip || "global_teacher");

    const path = `teachers/${teacherId}/${collectionName}/${data.id || "latest"}`;
    try {
      const docRef = doc(db, "teachers", teacherId, collectionName, data.id || "latest");
      await setDoc(docRef, { ...data, lastSync: new Date().toISOString() }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  };

  const deleteFromFirebase = async (collectionName: string, id: string) => {
    if (!db || !currentUser) return;
    const teacherId = currentUser.uid || teacherData.nip || "global_teacher";
    const path = `teachers/${teacherId}/${collectionName}/${id}`;
    try {
      await deleteDoc(doc(db, "teachers", teacherId, collectionName, id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  };

  const fetchFromFirebase = async (collectionName: 'students' | 'akpd' | 'logs' | 'schedules' | 'parent_communications' | 'homeroom_journals' | 'tda' | 'problem_reports' | 'guidance_materials' | 'scholarships' | 'daily_journals' | 'report_mutations' | 'groups' | 'events' | 'sociometry' | 'achievements' | 'violations' | 'attendance') => {
    if (!db) return;
    
    const isStudentView = view === ViewMode.STUDENT_AKPD || view === ViewMode.STUDENT_REPORT_INPUT || window.location.hash.includes('/kotak-masalah-siswa');
    
    // If it's not a student view and the user is not logged in, don't try to read protected collections
    if (!isStudentView && !currentUser) {
      return;
    }
    
    setIsLoading(true);
    const teacherId = currentUser?.uid || urlTeacherId || teacherData.nip || "global_teacher";
    const path = `teachers/${teacherId}/${collectionName}`;
    try {
      const querySnapshot = await getDocs(collection(db, "teachers", teacherId, collectionName));
      const data: any[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ ...doc.data(), id: doc.id });
      });
      
      if (collectionName === 'students') {
        setStudents(prev => {
          const studentMap = new Map(prev.map(s => [s.id, s]));
          data.forEach(s => {
            if (s.id && s.name) {
              studentMap.set(s.id, { ...s });
            }
          });
          return Array.from(studentMap.values());
        });
      } else if (collectionName === 'akpd') {
        setAkpdResponses(prev => {
          const akpdMap = new Map(prev.map(r => [r.id, r]));
          data.forEach(r => {
            if (r.id && r.studentId) {
              akpdMap.set(r.id, { ...r });
            }
          });
          return Array.from(akpdMap.values());
        });
      } else if (collectionName === 'tda') {
        setTdaRecords(prev => {
          const tdaMap = new Map(prev.map(r => [r.id, r]));
          data.forEach(r => {
            if (r.id && r.studentId) {
              tdaMap.set(r.id, { ...r });
            }
          });
          return Array.from(tdaMap.values());
        });
      } else if (collectionName === 'attendance') {
        setAttendanceRecords(prev => {
          const attendanceMap = new Map(prev.map(r => [r.id, r]));
          data.forEach(r => {
            if (r.id && r.studentId) {
              attendanceMap.set(r.id, { ...r });
            }
          });
          return Array.from(attendanceMap.values());
        });
      }
      
      if (data.length > 0) {
        showNotification(`Berhasil memuat ${data.length} data ${collectionName} dari Firebase`, "success");
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, path);
    } finally {
      setIsLoading(false);
    }
  };

  const syncDataToCloud = async (target: 'students' | 'logs' | 'groups' | 'events' | 'lpj' | 'test' | 'achievements' | 'violations' | 'akpd' | 'schedules' | 'parent_communications' | 'homeroom_journals' | 'tda' | 'sociometry' | 'daily_journals' | 'problem_reports' | 'guidance_materials' | 'scholarships' | 'report_mutations' | 'rpls', payload: any, customUrl?: string | React.MouseEvent) => {
    if (isOffline) {
      if (target !== 'test' && target !== 'lpj') {
        setSyncQueue(prev => [...prev, { target, payload }]);
        showNotification("Disimpan di Antrean Offline", "info");
      }
      return;
    }
    
    if (target !== 'lpj' && target !== 'test') await syncToFirebase(target as any, payload);

    let urlToUse = typeof customUrl === 'string' ? customUrl : spreadsheetUrl;
    if (target === 'akpd') {
      urlToUse = akpdSheetUrl;
    }
    
    if (!urlToUse || typeof urlToUse !== 'string' || !urlToUse.includes('/exec')) return;
    
    const baseUrl = urlToUse.split('?')[0];
    const syncUrl = `${baseUrl}?t=${Date.now()}`;

    // Special handling for test connection to actually detect CORS/URL issues
    if (target === 'test') {
      showNotification("Mengetes Koneksi...", "loading");
      try {
        const testResp = await fetch(syncUrl, { method: 'GET', mode: 'cors' });
        if (testResp.ok) {
          showNotification("Cloud Terhubung!", "success");
        } else {
          showNotification("Server Merespon Error.", "error");
        }
      } catch (err) {
        showNotification("Koneksi Gagal (CORS/URL).", "error");
        alert("TES KONEKSI GAGAL\n\nPastikan Apps Script sudah di-Deploy sebagai 'Web App' dengan akses 'Anyone'.");
      }
      return;
    }

    showNotification(`Sync Cloud (${target})...`, "loading");

    let finalPayload = payload;
    if (target === 'akpd') {
      const student = students.find(s => s.id === payload.studentId);
      finalPayload = {
        ...payload,
        studentName: student?.name || 'N/A',
        studentClass: student?.className || 'N/A',
      };
    }

    try {
      await fetch(syncUrl, {
        method: 'POST',
        mode: 'no-cors', 
        headers: { 'Content-Type': 'text/plain' }, 
        body: JSON.stringify({ target, payload: finalPayload })
      });
      showNotification(`Sinkronisasi Otomatis Berhasil`, "success");
    } catch (err) {
      showNotification("Sinkronisasi Gagal.", "error");
    }
  };

  const isCloudActive = spreadsheetUrl && spreadsheetUrl.includes('/exec');

  const handleExportBackup = () => {
    const data = {
      students,
      logs: counselingLogs,
      events: eventLogs,
      achievements,
      scholarships,
      economicallyDisadvantagedStudents,
      violations,
      attendance: attendanceRecords,
      schedules: counselingSchedules,
      assessments: needAssessments,
      akpd: akpdResponses,
      homeVisits,
      vulnMaps: vulnerabilityMaps,
      referrals,
      tdaRecords,
      guidanceMaterials,
      problemReports,
      academicEvents,
      reportMutations: reportAndMutations,
      parentComms: parentCommunications,
      sociometry: sociometryData,
      dailyJournals,
      akpdQuestions,
      groups,
      counselingGroups,
      teacher: teacherData,
      spreadsheetUrl,
      akpdSheetUrl,
      googleFormUrl,
      appearance,
      selectedAcademicYear,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Backup_JurnalGuruBK_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    showNotification("Database berhasil diekspor ke file .JSON", "success");
  };

  const handleManualSave = () => {
    localStorage.setItem('guru_bk_students', JSON.stringify(students));
    localStorage.setItem('guru_bk_logs', JSON.stringify(counselingLogs));
    localStorage.setItem('guru_bk_events', JSON.stringify(eventLogs));
    localStorage.setItem('guru_bk_achievements', JSON.stringify(achievements));
    localStorage.setItem('guru_bk_scholarships', JSON.stringify(scholarships));
    localStorage.setItem('guru_bk_economically_disadvantaged', JSON.stringify(economicallyDisadvantagedStudents));
    localStorage.setItem('guru_bk_violations', JSON.stringify(violations));
    localStorage.setItem('guru_bk_attendance', JSON.stringify(attendanceRecords));
    localStorage.setItem('guru_bk_schedules', JSON.stringify(counselingSchedules));
    localStorage.setItem('guru_bk_assessments', JSON.stringify(needAssessments));
    localStorage.setItem('guru_bk_akpd', JSON.stringify(akpdResponses));
    localStorage.setItem('guru_bk_home_visits', JSON.stringify(homeVisits));
    localStorage.setItem('guru_bk_vuln_maps', JSON.stringify(vulnerabilityMaps));
    localStorage.setItem('guru_bk_referrals', JSON.stringify(referrals));
    localStorage.setItem('guru_bk_tda', JSON.stringify(tdaRecords));
    localStorage.setItem('guru_bk_problem_reports', JSON.stringify(problemReports));
    localStorage.setItem('guru_bk_guidance_materials', JSON.stringify(guidanceMaterials));
    localStorage.setItem('guru_bk_report_mutations', JSON.stringify(reportAndMutations));
    localStorage.setItem('guru_bk_parent_comms', JSON.stringify(parentCommunications));
    localStorage.setItem('guru_bk_sociometry', JSON.stringify(sociometryData));
    localStorage.setItem('guru_bk_daily_journals', JSON.stringify(dailyJournals));
    localStorage.setItem('guru_bk_academic_events', JSON.stringify(academicEvents));
    localStorage.setItem('guru_bk_akpd_questions', JSON.stringify(akpdQuestions));
    localStorage.setItem('guru_bk_groups', JSON.stringify(groups));
    localStorage.setItem('guru_bk_counseling_groups', JSON.stringify(counselingGroups));
    localStorage.setItem('guru_bk_teacher_data', JSON.stringify(teacherData));
    localStorage.setItem('guru_bk_spreadsheet_url', spreadsheetUrl);
    localStorage.setItem('guru_bk_google_form_url', googleFormUrl);
    localStorage.setItem('guru_bk_appearance', JSON.stringify(appearance));
    if (selectedAcademicYear) localStorage.setItem('guru_bk_selected_academic_year', selectedAcademicYear);
    
    showNotification("Semua data berhasil dipaksa simpan ke Hard Disk", "success");
  };

  const handleImportBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.students) setStudents(data.students);
        if (data.academicEvents) setAcademicEvents(data.academicEvents);
        if (data.logs) setCounselingLogs(data.logs);
        if (data.events) setEventLogs(data.events);
        if (data.achievements) setAchievements(data.achievements);
        if (data.scholarships) setScholarships(data.scholarships);
        if (data.economicallyDisadvantagedStudents) setEconomicallyDisadvantagedStudents(data.economicallyDisadvantagedStudents);
        if (data.violations) setViolations(data.violations);
        if (data.attendance) setAttendanceRecords(data.attendance);
        if (data.schedules) setCounselingSchedules(data.schedules);
        if (data.assessments) setNeedAssessments(data.assessments);
        if (data.akpd) setAkpdResponses(data.akpd);
        if (data.homeVisits) setHomeVisits(data.homeVisits);
        if (data.vulnMaps) setVulnerabilityMaps(data.vulnMaps);
        if (data.referrals) setReferrals(data.referrals);
        if (data.tdaRecords) setTdaRecords(data.tdaRecords);
        if (data.problemReports) setProblemReports(data.problemReports);
        if (data.guidanceMaterials) setGuidanceMaterials(data.guidanceMaterials);
        if (data.reportMutations) setReportAndMutations(data.reportMutations);
        if (data.parentComms) setParentCommunications(data.parentComms);
        if (data.sociometry) setSociometryData(data.sociometry);
        if (data.dailyJournals) setDailyJournals(data.dailyJournals);
        if (data.akpdQuestions) setAkpdQuestions(data.akpdQuestions);
        if (data.groups) setGroups(data.groups);
        if (data.counselingGroups) setCounselingGroups(data.counselingGroups);
        if (data.teacher) setTeacherData(data.teacher);
        if (data.spreadsheetUrl) setSpreadsheetUrl(data.spreadsheetUrl);
        if (data.akpdSheetUrl) setAkpdSheetUrl(data.akpdSheetUrl);
        if (data.googleFormUrl) setGoogleFormUrl(data.googleFormUrl);
        if (data.appearance) setAppearance(data.appearance);
        if (data.selectedAcademicYear) setSelectedAcademicYear(data.selectedAcademicYear);
        
        showNotification("Pemulihan data berhasil & Otomatis tersimpan di Hard Disk", "success");
      } catch (err) {
        showNotification("File backup tidak valid", "error");
      }
    };
    reader.readAsText(file);
  };

  const downloadRecordAsFile = (type: string, data: any) => {
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const namePart = data.name || data.studentName || data.topic || data.id;
      const fileName = `${type}_${namePart.toString().replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.json`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download Error", e);
    }
  };

  const handleAddStudent = (student: Student, syncOnline: boolean = true) => {
    setStudents(prev => [...prev, student]);
    if (syncOnline) {
      syncDataToCloud('students', student);
    } else {
      downloadRecordAsFile('Siswa', student);
      showNotification("Data disimpan di PC (Folder Unduhan)", "success");
    }
  };

  const handleAddBatchStudents = (newStudents: Student[], syncOnline: boolean = true) => {
    setStudents(prev => [...prev, ...newStudents]);
    if (syncOnline) {
      newStudents.forEach(s => syncDataToCloud('students', s));
      showNotification(`Berhasil mengimpor ${newStudents.length} siswa & Otomatis tersimpan di Hard Disk`, "success");
    } else {
      downloadRecordAsFile('Batch_Siswa', newStudents);
      showNotification("Data batch disimpan di PC (Folder Unduhan)", "success");
    }
  };

  const handleUpdateStudent = (student: Student, syncOnline: boolean = true) => {
    setStudents(prev => prev.map(s => s.id === student.id ? student : s));
    if (syncOnline) {
      syncDataToCloud('students', student);
    } else {
      downloadRecordAsFile('Update_Siswa', student);
      showNotification("Perubahan disimpan di PC (Folder Unduhan)", "success");
    }
  };

  const handleUpdateBatchStudents = (updatedStudents: Student[]) => {
    setStudents(prev => {
      const updatedMap = new Map(updatedStudents.map(s => [s.id, s]));
      return prev.map(s => updatedMap.has(s.id) ? updatedMap.get(s.id)! : s);
    });
    updatedStudents.forEach(s => syncDataToCloud('students', s));
  };

  const handleDeleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    deleteFromFirebase('students', id);
  };

  const handleDeleteAllStudents = (className?: string) => {
    if (className && className !== 'Semua Kelas') {
      const remainingStudents = students.filter(s => s.className !== className);
      const toDelete = students.filter(s => s.className === className);
      setStudents(remainingStudents);
      toDelete.forEach(s => deleteFromFirebase('students', s.id));
      showNotification(`Data siswa kelas ${className} telah dihapus`, "info");
    } else {
      const toDelete = [...students];
      setStudents([]);
      toDelete.forEach(s => deleteFromFirebase('students', s.id));
      showNotification("Seluruh data siswa telah dihapus", "info");
    }
  };

  const handleAddLog = (log: CounselingLog, syncOnline: boolean = true) => {
    setCounselingLogs(prev => [log, ...prev]);
    if (syncOnline) {
      syncDataToCloud('logs', log);
    }
  };

  const handleUpdateLog = (log: CounselingLog, syncOnline: boolean = true) => {
    setCounselingLogs(prev => prev.map(l => l.id === log.id ? log : l));
    if (syncOnline) {
      syncDataToCloud('logs', log);
    }
  };

  const handleAddEventLog = (log: EventLog, syncOnline: boolean = true) => {
    setEventLogs(prev => [log, ...prev]);
    if (syncOnline) {
      syncDataToCloud('events', log);
    } else {
      downloadRecordAsFile('Catatan', log);
      showNotification("Catatan disimpan di PC (Folder Unduhan)", "success");
    }
  };

  const handleUpdateEventLog = (log: EventLog, syncOnline: boolean = true) => {
    setEventLogs(prev => prev.map(l => l.id === log.id ? log : l));
    if (syncOnline) {
      syncDataToCloud('events', log);
    } else {
      downloadRecordAsFile('Update_Catatan', log);
      showNotification("Perubahan catatan disimpan di PC (Folder Unduhan)", "success");
    }
  };

  const handleAddGroup = (group: CounselingGroup, syncOnline: boolean = true) => {
    setGroups(prev => [...prev, group]);
    if (syncOnline) {
      syncDataToCloud('groups', group);
    } else {
      downloadRecordAsFile('Kelompok', group);
      showNotification("Kelompok disimpan di PC (Folder Unduhan)", "success");
    }
  };

  const handleUpdateGroup = (group: CounselingGroup, syncOnline: boolean = true) => {
    setGroups(prev => prev.map(g => g.id === group.id ? group : g));
    if (syncOnline) {
      syncDataToCloud('groups', group);
    } else {
      downloadRecordAsFile('Update_Kelompok', group);
      showNotification("Perubahan kelompok disimpan di PC (Folder Unduhan)", "success");
    }
  };

  const handleAddCounselingGroup = (group: CounselingGroup) => {
    setCounselingGroups(prev => [...prev, group]);
  };

  const handleUpdateCounselingGroup = (group: CounselingGroup) => {
    setCounselingGroups(prev => prev.map(g => g.id === group.id ? group : g));
  };

  const handleDeleteCounselingGroup = (id: string) => {
    setCounselingGroups(prev => prev.filter(g => g.id !== id));
    deleteFromFirebase('counseling_groups', id);
  };

  const handleAddAchievement = (achievement: Achievement, syncOnline: boolean = true) => {
    setAchievements(prev => [achievement, ...prev]);
    if (syncOnline) {
      syncDataToCloud('achievements', achievement);
    } else {
      downloadRecordAsFile('Prestasi', achievement);
      showNotification("Prestasi disimpan di PC (Folder Unduhan)", "success");
    }
  };

  const handleUpdateAchievement = (achievement: Achievement, syncOnline: boolean = true) => {
    setAchievements(prev => prev.map(a => a.id === achievement.id ? achievement : a));
    if (syncOnline) {
      syncDataToCloud('achievements', achievement);
    } else {
      downloadRecordAsFile('Update_Prestasi', achievement);
      showNotification("Perubahan prestasi disimpan di PC (Folder Unduhan)", "success");
    }
  };

  const handleDeleteAchievement = (id: string) => {
    setAchievements(prev => prev.filter(a => a.id !== id));
    deleteFromFirebase('achievements', id);
  };

  const handleAddScholarship = (scholarship: Scholarship, syncOnline: boolean = true) => {
    setScholarships(prev => [scholarship, ...prev]);
    if (syncOnline) {
      syncDataToCloud('scholarships' as any, scholarship);
    } else {
      downloadRecordAsFile('Beasiswa', scholarship);
      showNotification("Beasiswa disimpan di PC (Folder Unduhan)", "success");
    }
  };

  const handleUpdateScholarship = (scholarship: Scholarship, syncOnline: boolean = true) => {
    setScholarships(prev => prev.map(s => s.id === scholarship.id ? scholarship : s));
    if (syncOnline) {
      syncDataToCloud('scholarships' as any, scholarship);
    } else {
      downloadRecordAsFile('Update_Beasiswa', scholarship);
      showNotification("Perubahan beasiswa disimpan di PC (Folder Unduhan)", "success");
    }
  };

  const handleDeleteScholarship = (id: string) => {
    setScholarships(prev => prev.filter(s => s.id !== id));
    deleteFromFirebase('scholarships', id);
  };

  const handleAddEconomicallyDisadvantagedStudent = (student: EconomicallyDisadvantagedStudent, syncOnline: boolean = true) => {
    setEconomicallyDisadvantagedStudents(prev => [student, ...prev]);
    if (syncOnline) {
      syncDataToCloud('students' as any, student); // Assuming it uses students collection or similar
    } else {
      downloadRecordAsFile('Siswa_Tidak_Mampu', student);
      showNotification("Data siswa tidak mampu disimpan di PC (Folder Unduhan)", "success");
    }
  };

  const handleUpdateEconomicallyDisadvantagedStudent = (student: EconomicallyDisadvantagedStudent, syncOnline: boolean = true) => {
    setEconomicallyDisadvantagedStudents(prev => prev.map(s => s.id === student.id ? student : s));
    if (syncOnline) {
      syncDataToCloud('students' as any, student);
    } else {
      downloadRecordAsFile('Update_Siswa_Tidak_Mampu', student);
      showNotification("Perubahan data siswa tidak mampu disimpan di PC (Folder Unduhan)", "success");
    }
  };

  const handleDeleteEconomicallyDisadvantagedStudent = (id: string) => {
    setEconomicallyDisadvantagedStudents(prev => prev.filter(s => s.id !== id));
    deleteFromFirebase('students', id); // Warning: are EconomicallyDisadvantaged stored in students?
  };

  const handleAddViolation = (violation: Violation, syncOnline: boolean = true) => {
    setViolations(prev => [violation, ...prev]);
    if (syncOnline) {
      syncDataToCloud('violations', violation);
    } else {
      downloadRecordAsFile('Pelanggaran', violation);
      showNotification("Pelanggaran disimpan di PC (Folder Unduhan)", "success");
    }
  };

  const handleUpdateViolation = (violation: Violation, syncOnline: boolean = true) => {
    setViolations(prev => prev.map(v => v.id === violation.id ? violation : v));
    if (syncOnline) {
      syncDataToCloud('violations', violation);
    } else {
      downloadRecordAsFile('Update_Pelanggaran', violation);
      showNotification("Perubahan pelanggaran disimpan di PC (Folder Unduhan)", "success");
    }
  };

  const handleDeleteViolation = (id: string) => {
    setViolations(prev => prev.filter(v => v.id !== id));
    deleteFromFirebase('violations', id);
  };

  const handleAddAttendance = (record: AttendanceRecord, sync: boolean = true) => {
    setAttendanceRecords(prev => [record, ...prev]);
    if (sync) syncToFirebase('attendance', record);
  };

  const handleUpdateAttendance = (record: AttendanceRecord, sync: boolean = true) => {
    setAttendanceRecords(prev => prev.map(r => r.id === record.id ? record : r));
    if (sync) syncToFirebase('attendance', record);
  };

  const handleDeleteAttendance = (id: string) => {
    setAttendanceRecords(prev => prev.filter(r => r.id !== id));
    deleteFromFirebase('attendance', id);
  };

  const handleAddSchedule = (schedule: CounselingSchedule, syncOnline: boolean = true) => {
    setCounselingSchedules(prev => [schedule, ...prev]);
    if (syncOnline) {
      // syncDataToCloud('schedules', schedule); // If cloud supports it
    } else {
      downloadRecordAsFile('Jadwal', schedule);
      showNotification("Jadwal disimpan di PC (Folder Unduhan)", "success");
    }
  };

  const handleUpdateSchedule = (schedule: CounselingSchedule, syncOnline: boolean = true) => {
    setCounselingSchedules(prev => prev.map(s => s.id === schedule.id ? schedule : s));
    if (syncOnline) {
      // syncDataToCloud('schedules', schedule);
    } else {
      downloadRecordAsFile('Update_Jadwal', schedule);
      showNotification("Perubahan jadwal disimpan di PC (Folder Unduhan)", "success");
    }
  };

  const handleDeleteSchedule = (id: string) => {
    setCounselingSchedules(prev => prev.filter(s => s.id !== id));
    deleteFromFirebase('schedules', id);
  };

  const handleAddClassicalSchedule = (schedule: Omit<ClassicalGuidanceSchedule, 'id'>) => {
    const newSchedule = { ...schedule, id: Date.now().toString() };
    setClassicalSchedules(prev => [newSchedule, ...prev]);
    showNotification("Jadwal klasikal berhasil ditambahkan", "success");
  };

  const handleUpdateClassicalSchedule = (schedule: ClassicalGuidanceSchedule) => {
    setClassicalSchedules(prev => prev.map(s => s.id === schedule.id ? schedule : s));
    showNotification("Jadwal klasikal berhasil diperbarui", "success");
    setEditingClassicalSchedule(null);
  };

  const handleEditClassicalScheduleFromDashboard = (schedule: ClassicalGuidanceSchedule) => {
    setEditingClassicalSchedule(schedule);
    setView(ViewMode.CLASSICAL_GUIDANCE_SCHEDULE);
  };

  const handleDeleteClassicalSchedule = (id: string) => {
    setClassicalSchedules(prev => prev.filter(s => s.id !== id));
    deleteFromFirebase('classical_schedules', id);
    showNotification("Jadwal klasikal berhasil dihapus", "success");
  };

  const handleAddAssessment = (a: NeedAssessment, syncOnline: boolean = true) => {
    setNeedAssessments(prev => [a, ...prev]);
    if (syncOnline) {
      // syncDataToCloud('assessments', a);
    } else {
      downloadRecordAsFile('Assessment', a);
      showNotification("Assessment disimpan di PC (Folder Unduhan)", "success");
    }
  };

  const handleDeleteAssessment = (id: string) => {
    setNeedAssessments(prev => prev.filter(a => a.id !== id));
    deleteFromFirebase('assessments', id);
  };

  const handleAddAkpd = async (r: AKPDResponse, syncOnline: boolean = true) => {
    setAkpdResponses(prev => [r, ...prev]);
    if (syncOnline) {
      await syncDataToCloud('akpd', r);
    } else {
      downloadRecordAsFile('AKPD', r);
      showNotification("AKPD disimpan di PC (Folder Unduhan)", "success");
    }
  };

  const handleDeleteAkpd = (id: string) => {
    setAkpdResponses(prev => prev.filter(r => r.id !== id));
    deleteFromFirebase('akpd', id);
  };

  const handleSetAkpdSheetUrl = (url: string) => {
    setAkpdSheetUrl(url);
    showNotification('Link Google Sheet AKPD berhasil disimpan.', 'success');
  };



  const handleAddHomeVisit = (v: HomeVisit, syncOnline: boolean = true) => {
    setHomeVisits(prev => [v, ...prev]);
    if (syncOnline) {
      // syncDataToCloud('home_visits', v);
    } else {
      downloadRecordAsFile('HomeVisit', v);
      showNotification("Home Visit disimpan di PC (Folder Unduhan)", "success");
    }
  };

  const handleDeleteHomeVisit = (id: string) => {
    setHomeVisits(prev => prev.filter(v => v.id !== id));
    deleteFromFirebase('home_visits', id);
  };

  const handleUpdateHomeVisit = (v: HomeVisit, syncOnline: boolean = true) => {
    setHomeVisits(prev => prev.map(item => item.id === v.id ? v : item));
    if (!syncOnline) {
      downloadRecordAsFile('HomeVisit_Update', v);
      showNotification("Update Home Visit disimpan di PC", "success");
    }
  };

  const handleAddReferral = (r: Referral, syncOnline: boolean = true) => {
    setReferrals(prev => [r, ...prev]);
    if (syncOnline) {
      // syncDataToCloud('referrals', r);
    } else {
      downloadRecordAsFile('Referral', r);
      showNotification("Referral disimpan di PC (Folder Unduhan)", "success");
    }
  };

  const handleUpdateReferral = (r: Referral, syncOnline: boolean = true) => {
    setReferrals(prev => prev.map(ref => ref.id === r.id ? r : ref));
    if (syncOnline) {
      // syncDataToCloud('referrals', r);
    } else {
      downloadRecordAsFile('Update_Referral', r);
      showNotification("Perubahan referral disimpan di PC (Folder Unduhan)", "success");
    }
  };

  const handleUpdateAkpdQuestions = (questions: AKPDQuestion[]) => {
    setAkpdQuestions(questions);
  };

  const handleDeleteReferral = (id: string) => {
    setReferrals(prev => prev.filter(r => r.id !== id));
    deleteFromFirebase('referrals', id);
  };

  const handleAddReportMutation = (data: ReportAndMutation, syncOnline: boolean = true) => {
    setReportAndMutations(prev => [data, ...prev]);
    if (syncOnline) {
      // syncDataToCloud('report_mutations', data);
    } else {
      downloadRecordAsFile('Nilai_Mutasi', data);
      showNotification("Data disimpan di PC (Folder Unduhan)", "success");
    }
  };

  const handleUpdateReportMutation = (data: ReportAndMutation, syncOnline: boolean = true) => {
    setReportAndMutations(prev => prev.map(item => item.id === data.id ? data : item));
    if (syncOnline) {
      // syncDataToCloud('report_mutations', data);
    } else {
      downloadRecordAsFile('Update_Nilai_Mutasi', data);
      showNotification("Perubahan disimpan di PC (Folder Unduhan)", "success");
    }
  };

  const handleDeleteReportMutation = (id: string) => {
    setReportAndMutations(prev => prev.filter(item => item.id !== id));
    deleteFromFirebase('report_mutations', id);
  };

  const handleAddTda = (record: TDA) => {
    setTdaRecords(prev => [record, ...prev]);
    syncDataToCloud('tda' as any, record);
    showNotification("Data TDA berhasil ditambahkan", "success");
  };

  const handleUpdateTda = (record: TDA) => {
    setTdaRecords(prev => prev.map(r => r.id === record.id ? record : r));
    syncDataToCloud('tda' as any, record);
    showNotification("Data TDA berhasil diperbarui", "success");
  };

  const handleDeleteTda = (id: string) => {
    setTdaRecords(prev => prev.filter(r => r.id !== id));
    deleteFromFirebase('tda', id);
    showNotification("Data TDA berhasil dihapus", "success");
  };

  const handleAddProblemReport = (report: ProblemReport, syncOnline: boolean = true) => {
    setProblemReports(prev => [report, ...prev]);
    if (syncOnline) {
      syncDataToCloud('problem_reports' as any, report);
    }
  };

  const handleUpdateProblemReport = (report: ProblemReport, syncOnline: boolean = true) => {
    setProblemReports(prev => prev.map(r => r.id === report.id ? report : r));
    if (syncOnline) {
      syncDataToCloud('problem_reports' as any, report);
    }
  };

  const handleDeleteProblemReport = (id: string) => {
    setProblemReports(prev => prev.filter(r => r.id !== id));
    deleteFromFirebase('problem_reports', id);
  };

  const handleSaveGuidanceMaterial = (material: GuidanceMaterial) => {
    setGuidanceMaterials(prev => {
      const exists = prev.find(m => m.id === material.id);
      if (exists) {
        return prev.map(m => m.id === material.id ? material : m);
      }
      return [material, ...prev];
    });
    syncDataToCloud('guidance_materials' as any, material);
  };

  const handleDeleteGuidanceMaterial = (id: string) => {
    setGuidanceMaterials(prev => prev.filter(m => m.id !== id));
    deleteFromFirebase('guidance_materials', id);
  };

  const handleUpdateVulnMap = (map: VulnerabilityMap) => {
    setVulnerabilityMaps(prev => {
      const existing = prev.findIndex(m => m.studentId === map.studentId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = map;
        return updated;
      }
      return [...prev, map];
    });
  };

  const handleSaveRpl = (rpl: RPL) => {
    setRpls(prev => {
      const exists = prev.find(r => r.id === rpl.id);
      if (exists) return prev.map(r => r.id === rpl.id ? rpl : r);
      return [...prev, rpl];
    });
    syncDataToCloud('rpls', rpl);
  };

  const handleDeleteRpl = (id: string) => {
    setRpls(prev => prev.filter(r => r.id !== id));
    deleteFromFirebase('rpls', id);
  };

  const handleViewStudentBook = (studentId: string) => {
    setSelectedStudentIdForBook(studentId);
    setView(ViewMode.STUDENT_PERSONAL_BOOK);
  };

  const handleViewStudent360 = (studentId: string) => {
    setSelectedStudentIdFor360(studentId);
    setView(ViewMode.STUDENT_360_PROFILE);
  };

  const handleDeleteGroup = (id: string) => {
    setGroups(prev => prev.filter(g => g.id !== id));
    deleteFromFirebase('groups', id);
  };

  const handleSaveFirebaseConfig = (config: FirebaseConfig) => {
    setFirebaseConfig(config);
    localStorage.setItem('guru_bk_firebase_config', JSON.stringify(config));
    initFirebase(config);
    showNotification("Konfigurasi Firebase Tersimpan", "success");
  };



  const excelInputRef = useRef<HTMLInputElement>(null);

  const generateStudentCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = 'BK-';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleUploadExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
      
      if (data.length > 1) {
        const headers = data[0] as string[];
        const rows = data.slice(1).map(row => {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = row[index];
          });
          return obj;
        });

        const newStudents: Student[] = rows.map((row: any) => {
          return {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            academicYear: selectedAcademicYear,
            studentCode: generateStudentCode(),
            nis: row['NIS'] || '',
            nisn: row['NISN'] || '',
            name: row['Nama Lengkap'] || '',
            className: row['Kelas'] || '',
            gender: row['Jenis Kelamin'] || '',
            attendanceNumber: row['Nomor Absen'] || '',
            birthPlace: row['Tempat Lahir'] || '',
            birthDate: row['Tanggal Lahir'] || '',
            address: row['Alamat'] || '',
            phone: row['Kontak'] || '',
            bloodType: row['Golongan Darah'] || '',
            fatherName: row['Nama Ayah'] || '',
            motherName: row['Nama Ibu'] || '',
            fatherJob: row['Pekerjaan Ayah'] || '',
            motherJob: row['Pekerjaan Ibu'] || '',
            parentAddress: row['Alamat Ortu Wali'] || '',
            parentPhoneWA: row['No. WA / HP Orang Tua'] || '',
          } as Student;
        });
        
        handleAddBatchStudents(newStudents);
        showNotification(`Berhasil mengimpor ${newStudents.length} siswa.`, "success");
      }
    };
    reader.readAsBinaryString(file);
    if (excelInputRef.current) excelInputRef.current.value = '';
  };

  const handleDownloadTemplate = () => {
    const template = [
      {
        "Nama Lengkap": "Contoh Nama Siswa",
        "NIS": "12345",
        "NISN": "0012345678",
        "Kelas": "X-A",
        "Jenis Kelamin": "Laki-laki",
        "Nomor Absen": "1",
        "Tempat Lahir": "Jakarta",
        "Tanggal Lahir": "2008-01-01",
        "Alamat": "Jl. Contoh No. 123",
        "Kontak": "08123456789",
        "Golongan Darah": "O",
        "Hobi": "Membaca",
        "Cita-cita": "Dokter",
        "Prestasi": "Juara 1 Lomba Cerdas Cermat",
        "Ekstrakurikuler": "Pramuka, PMR",
        "Nama Ayah": "Nama Ayah",
        "Nama Ibu": "Nama Ibu",
        "Pekerjaan Ayah": "Wiraswasta",
        "Pekerjaan Ibu": "Ibu Rumah Tangga",
        "Alamat Ortu Wali": "Sama dengan siswa",
        "No. WA / HP Orang Tua": "08123456789"
      }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Siswa");
    XLSX.writeFile(wb, "Template_Import_Siswa_BK.xlsx");
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const json: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        const newStudents: Student[] = json.map((item, idx) => ({
          id: (Date.now() + idx).toString(),
          studentCode: item["ID Siswa"] || generateStudentCode(),
          nis: item["NIS"]?.toString() || "",
          nisn: item["NISN"]?.toString() || "",
          name: item["Nama Lengkap"] || "",
          gender: item["Jenis Kelamin"] || "",
          className: item["Kelas"] || "",
          attendanceNumber: item["Nomor Absen"]?.toString() || "",
          nickname: item["Nama Panggilan"] || "",
          birthPlace: item["Tempat Lahir"] || "",
          birthDate: item["Tanggal Lahir"] || "",
          religion: item["Agama"] || "",
          address: item["Alamat"] || "",
          domicile: item["Domisili"] || "",
          phone: item["Kontak"]?.toString() || "",
          hobby: item["Hobi"] || "",
          ambition: item["Cita-cita"] || "",
          furtherSchool: item["Sekolah Lanjut"] || "",
          previousSchool: item["Asal SD"] || "",
          bestFriend: item["Teman Akrab"] || "",
          achievements: item["Prestasi"] || "",
          extracurricular: item["Ekstrakurikuler"] || "",
          livingWith: item["Tinggal Bersama"] || "",
          siblingsCount: item["Jumlah Saudara"]?.toString() || "",
          birthOrder: item["Anak Ke"]?.toString() || "",
          fatherName: item["Nama Ayah"] || "",
          fatherJob: item["Pekerjaan Ayah"] || "",
          fatherPhone: item["Nomor Telepon Ayah"] || item["Telepon Ayah"] || "",
          fatherEducation: item["Pendidikan Ayah"] || "",
          motherName: item["Nama Ibu"] || "",
          motherJob: item["Pekerjaan Ibu"] || "",
          motherPhone: item["Nomor Telepon Ibu"] || item["Telepon Ibu"] || "",
          motherEducation: item["Pendidikan Ibu"] || "",
          fatherReligion: item["Agama Ayah"] || "",
          motherReligion: item["Agama Ibu"] || "",
          parentAddress: item["Alamat Ortu Wali"] || "",
          parentPhoneWA: item["No. WA / HP Orang Tua"]?.toString() || "",
          guardianName: item["Nama Wali"] || "",
          guardianJob: item["Pekerjaan Wali"] || "",
          guardianAddress: item["Alamat Wali"] || "",
          bloodType: item["Golongan Darah"] || "",
          photo: "", notes: "",
          academicYear: selectedAcademicYear
        })).filter(s => s.name !== "");
        
        setExcelImportPreview(newStudents);

      } catch (err) { 
        showNotification("Gagal impor Excel.", "error");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const availableAcademicYears = useMemo(() => {
    const years = new Set<string>();
    if (teacherData.academicYear) years.add(teacherData.academicYear);
    students.forEach(s => {
      if (s.academicYear) years.add(s.academicYear);
    });
    return Array.from(years).filter(Boolean).sort((a, b) => b.localeCompare(a));
  }, [students, teacherData.academicYear]);

  useEffect(() => {
    if (!selectedAcademicYear && availableAcademicYears.length > 0) {
      setSelectedAcademicYear(availableAcademicYears[0]);
    }
  }, [selectedAcademicYear, availableAcademicYears]);

  const handleSyncAllStudents = async () => {
    if (isOffline) {
      showNotification("Tidak dapat sinkronisasi massal saat offline. Harap hubungkan internet.", "error");
      return;
    }
    if (!spreadsheetUrl || !spreadsheetUrl.includes('/exec')) {
      showNotification("URL Google Sheet belum valid/diatur", "error");
      return;
    }
    
    setIsLoading(true);
    showNotification(`Mulai sinkronisasi ${students.length} siswa ke Cloud...`, "loading");
    
    let successCount = 0;
    // Send in parallel to speed up, but limit concurrency if needed. 
    // For now, simple Promise.all might be too much if there are many students.
    // Let's do sequential to be safe with Apps Script limits.
    
    try {
      for (const student of students) {
        try {
          await fetch(spreadsheetUrl, {
            method: 'POST',
            mode: 'no-cors', 
            headers: { 'Content-Type': 'text/plain' }, 
            body: JSON.stringify({ target: 'students', payload: student })
          });
          successCount++;
        } catch (err) {
          console.error("Error syncing student:", err);
        }
      }
      showNotification(`Sinkronisasi ${successCount} siswa ke Cloud Berhasil`, "success");
    } finally {
      setIsLoading(false);
    }
  };

  const syncAllStudentsToFirebase = async () => {
    if (!db) {
      showNotification("Firebase belum dikonfigurasi", "error");
      return;
    }
    
    setIsLoading(true);
    showNotification(`Mulai sinkronisasi ${students.length} siswa ke Firebase...`, "loading");
    
    try {
      for (const student of students) {
        await syncToFirebase('students', student);
      }
      showNotification(`Berhasil sinkronisasi ${students.length} siswa ke Firebase`, "success");
    } catch (e) {
      console.error("Error syncing all students to Firebase:", e);
      showNotification("Gagal sinkronisasi ke Firebase", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadFromCloud = async (customUrl?: string | React.MouseEvent) => {
    if (isOffline) {
      showNotification("Tidak dapat mengunduh data saat offline. Harap hubungkan internet.", "error");
      return;
    }
    const urlString = typeof customUrl === 'string' ? customUrl : undefined;
    const urlToUse = urlString || spreadsheetUrl;
    if (!urlToUse || typeof urlToUse !== 'string' || !urlToUse.includes('/exec')) {
      if (!urlString) showNotification("URL Google Sheet belum valid (Harus berakhiran /exec)", "error");
      return;
    }

    setIsLoading(true);
    showNotification("Mengunduh data siswa dari Cloud...", "loading");

    try {
      const baseUrl = spreadsheetUrl.split('?')[0];
      const downloadUrl = `${baseUrl}?target=students&t=${Date.now()}`;
      
      // Standard fetch for GET
      const response = await fetch(downloadUrl, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();

      if (json.status === 'success' && Array.isArray(json.data)) {
        const cloudStudents = json.data as Student[];
        
        if (cloudStudents.length === 0) {
          showNotification("Data di Cloud masih kosong.", "info");
          return;
        }

        setStudents(prev => {
          const studentMap = new Map(prev.map(s => [s.id, s]));
          cloudStudents.forEach(s => {
            if (s.id && s.name) {
              studentMap.set(s.id, { ...s });
            }
          });
          return Array.from(studentMap.values());
        });

        showNotification(`Berhasil mengunduh ${json.data.length} data siswa & Otomatis tersimpan di Hard Disk.`, "success");
      } else {
        showNotification(json.message || "Format data Cloud tidak valid.", "error");
      }
    } catch (e: any) {
      console.error("Download error details:", e);
      
      let errorMsg = "Gagal mengunduh data.";
      
      if (e.message === 'Failed to fetch') {
        errorMsg = "Koneksi Terblokir (CORS). Pastikan Apps Script di-Deploy ulang: New Deployment > Web App > Anyone.";
        // Add a more helpful alert for this specific common error
        alert("KONEKSI GAGAL (Failed to fetch)\n\nIni biasanya terjadi karena:\n1. Apps Script belum di-Deploy sebagai 'Anyone'.\n2. Anda belum klik 'Authorize Access' saat Deploy.\n3. URL yang dimasukkan salah (bukan Web App URL).\n\nSilakan cek kembali Panduan Koneksi di menu Pengaturan.");
      } else {
        errorMsg = `Error: ${e.message}`;
      }
      
      showNotification(errorMsg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncAkpdFromCloud = async () => {
    if (!akpdSheetUrl || !akpdSheetUrl.includes('/exec')) {
      return;
    }

    setIsLoading(true);
    showNotification("Sinkronisasi data AKPD dari Cloud...", "loading");

    try {
      const baseUrl = akpdSheetUrl.split('?')[0];
      const downloadUrl = `${baseUrl}?target=akpd&t=${Date.now()}`;
      
      const response = await fetch(downloadUrl, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = await response.json();

      if (json.status === 'success' && Array.isArray(json.data)) {
        const cloudAkpd = json.data as AKPDResponse[];
        
        if (cloudAkpd.length > 0) {
          setAkpdResponses(prev => {
            const akpdMap = new Map(prev.map(r => [r.id, r]));
            cloudAkpd.forEach(r => {
              if (r.id && r.studentId) {
                akpdMap.set(r.id, { ...r });
              }
            });
            return Array.from(akpdMap.values());
          });
          showNotification(`Berhasil sinkronisasi ${json.data.length} data AKPD.`, "success");
        } else {
          showNotification("Data AKPD di Cloud masih kosong.", "info");
        }
      } else {
        showNotification(json.message || "Format data AKPD tidak valid.", "error");
      }
    } catch (e: any) {
      console.error("AKPD Sync error:", e);
      showNotification("Gagal sinkronisasi AKPD: " + e.message + ". Pastikan Google Apps Script sudah di-deploy sebagai 'Web App' dengan akses 'Anyone'.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if ((view === ViewMode.NEED_ASSESSMENT || view === ViewMode.STUDENT_AKPD) && isAuthReady) {
      if (db) {
        if (view === ViewMode.NEED_ASSESSMENT) {
          fetchFromFirebase('akpd');
        }
        if (students.length === 0) {
          fetchFromFirebase('students');
        }
      }
      if (akpdSheetUrl && view === ViewMode.NEED_ASSESSMENT) {
        handleSyncAkpdFromCloud();
      }
    }
  }, [view, db, akpdSheetUrl, isAuthReady, students.length]);

  const handleCompleteSchedule = (id: string) => {
    setCounselingSchedules(prev => prev.map(s => s.id === id ? { ...s, status: 'completed' } : s));
    showNotification("Jadwal ditandai selesai", "success");
    syncDataToCloud('schedules', { id, status: 'completed' }); // Optimistic sync
  };

  const handleAddParentCommunication = (comm: ParentCommunication) => {
    setParentCommunications(prev => [comm, ...prev]);
    syncDataToCloud('parent_communications', comm);
  };

  const handleUpdateParentCommunication = (id: string, updates: Partial<ParentCommunication>) => {
    setParentCommunications(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    const updated = parentCommunications.find(c => c.id === id);
    if (updated) {
      syncDataToCloud('parent_communications', { ...updated, ...updates });
    }
  };

  const handleAddDailyJournal = (journal: DailyJournal) => {
    setDailyJournals(prev => {
      const updated = [journal, ...prev];
      localStorage.setItem('guru_bk_daily_journals', JSON.stringify(updated));
      return updated;
    });
    syncDataToCloud('daily_journals', journal);
  };
  
  const handleUpdateDailyJournal = (journal: DailyJournal) => {
    setDailyJournals(prev => {
      const updated = prev.map(j => j.id === journal.id ? journal : j);
      localStorage.setItem('guru_bk_daily_journals', JSON.stringify(updated));
      return updated;
    });
    syncDataToCloud('daily_journals', journal);
    setEditingJournal(null);
  };

  const handleAddSociometry = (s: Sociometry) => {
    setSociometryData(prev => [s, ...prev]);
    syncDataToCloud('sociometry', s);
  };

  const handleDeleteSociometry = (id: string) => {
    setSociometryData(prev => prev.filter(s => s.id !== id));
    deleteFromFirebase('sociometry', id);
  };

  const handleResetData = () => {
    if (window.confirm("PERINGATAN: Seluruh data yang tersimpan di browser ini akan dihapus permanen. Pastikan Anda sudah melakukan backup ke Flashdisk. Lanjutkan?")) {
      const keysToRemove = [
        'guru_bk_students', 'guru_bk_logs', 'guru_bk_events', 'guru_bk_achievements',
        'guru_bk_scholarships', 'guru_bk_economically_disadvantaged', 'guru_bk_violations',
        'guru_bk_attendance', 'guru_bk_schedules', 'guru_bk_assessments', 'guru_bk_akpd',
        'guru_bk_akpd_sheet_url', 'guru_bk_home_visits', 'guru_bk_vuln_maps', 'guru_bk_referrals',
        'guru_bk_report_mutations', 'guru_bk_parent_comms', 'guru_bk_tda', 'guru_bk_problem_reports',
        'guru_bk_sociometry', 'guru_bk_academic_events', 'guru_bk_akpd_questions', 'guru_bk_groups',
        'guru_bk_counseling_groups', 'guru_bk_teacher_data', 'guru_bk_spreadsheet_url',
        'guru_bk_selected_academic_year', 'guru_bk_appearance', 'guru_bk_daily_journals',
        'guru_bk_guidance_materials'
      ];
      keysToRemove.forEach(key => localStorage.removeItem(key));
      showNotification("Seluruh data lokal berhasil dihapus. Aplikasi akan dimuat ulang.", "success");
      setTimeout(() => window.location.reload(), 2000);
    }
  };

  const handleSyncCloud = async () => {
    if (isOffline) {
      showNotification("Tidak dapat sinkronisasi cloud saat offline. Harap hubungkan internet.", "error");
      return;
    }
    if (!db || !currentUser) {
      showNotification("Harap login ke Cloud terlebih dahulu", "error");
      return;
    }
    setIsLoading(true);
    showNotification("Memulai sinkronisasi cloud...", "loading");
    try {
      const syncData = {
        students, counselingLogs, eventLogs, achievements, scholarships,
        economicallyDisadvantagedStudents, violations, attendanceRecords,
        counselingSchedules, needAssessments, akpdResponses, homeVisits,
        vulnerabilityMaps, referrals, reportAndMutations, parentCommunications,
        tdaRecords, problemReports, sociometryData, academicEvents,
        akpdQuestions, groups, counselingGroups, teacherData, dailyJournals,
        guidanceMaterials, lastSync: new Date().toISOString()
      };
      const docRef = doc(db, "teachers", currentUser.uid, "sync", "full_backup");
      await setDoc(docRef, syncData, { merge: true });
      showNotification("Sinkronisasi Cloud Berhasil", "success");
    } catch (err) {
      console.error("Sync Error:", err);
      showNotification("Gagal Sinkronisasi Cloud", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const combinedAcademicEvents = useMemo(() => {
    const events = [...academicEvents];
    
    if (!selectedAcademicYear) return events;
    
    const [startYearStr, endYearStr] = selectedAcademicYear.split('/');
    const startYear = parseInt(startYearStr);
    const endYear = parseInt(endYearStr);
    
    if (isNaN(startYear) || isNaN(endYear)) return events;

    const dayMap: Record<string, number> = {
      'MINGGU': 0, 'SENIN': 1, 'SELASA': 2, 'RABU': 3, 'KAMIS': 4, 'JUMAT': 5, 'SABTU': 6
    };

    classicalSchedules.forEach(schedule => {
      if (schedule.academicYear !== selectedAcademicYear) return;

      const addEventsForPeriod = (startMonth: number, startY: number, endMonth: number, endY: number) => {
        let currentDate = new Date(startY, startMonth, 1);
        const endDate = new Date(endY, endMonth + 1, 0);

        while (currentDate <= endDate) {
          if (currentDate.getDay() === dayMap[schedule.day]) {
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const day = String(currentDate.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            events.push({
              id: `routine-${schedule.id}-${dateStr}`,
              date: dateStr,
              title: `Bimbingan Klasikal: ${schedule.className} (Jam ke-${schedule.period})`,
              type: 'pembelajaran',
              description: `Topik: ${schedule.topic || '-'}\nCatatan: ${schedule.notes || '-'}`,
            });
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
      };

      if (schedule.semester === 'Ganjil' || schedule.semester === 'Semua Semester') {
        addEventsForPeriod(6, startYear, 11, startYear);
      }
      if (schedule.semester === 'Genap' || schedule.semester === 'Semua Semester') {
        addEventsForPeriod(0, endYear, 5, endYear);
      }
    });

    return events;
  }, [academicEvents, classicalSchedules, selectedAcademicYear]);

  const renderContent = () => {
    console.log("Rendering view:", view);
    switch (view) {
      case ViewMode.WELCOME: 
        return <WelcomeScreen onEnter={() => setView(ViewMode.HOME)} teacherData={teacherData} onOpenGuide={() => setShowGuide(true)} />;
      case ViewMode.HOME: 
        return (
          <Dashboard 
            key="home"
            setView={setView} 
            onOpenSettings={(tab) => {
              if (tab) setSettingsTab(tab);
              setView(ViewMode.SETTINGS);
            }}
            onOpenProfile={() => { setSettingsTab('profile'); setView(ViewMode.SETTINGS); }} 
            students={filteredStudents} 
            logs={filteredCounselingLogs} 
            onOpenGuide={() => setShowGuide(true)} 
            teacherData={teacherData}
            selectedAcademicYear={selectedAcademicYear}
            setSelectedAcademicYear={setSelectedAcademicYear}
            availableAcademicYears={availableAcademicYears}
            appearance={appearance}
            onUpdateAppearance={setAppearance}
            schedules={filteredSchedules}
            onCompleteSchedule={handleCompleteSchedule}
            isFirebaseActive={!!db}
            akpdResponses={filteredAkpd}
            akpdQuestions={akpdQuestions}
            category="Dashboard"
            academicEvents={combinedAcademicEvents}
            classicalSchedules={classicalSchedules}
            onEditClassicalSchedule={handleEditClassicalScheduleFromDashboard}
            onDeleteClassicalSchedule={handleDeleteClassicalSchedule}
            onAddAttendance={handleAddAttendance}
            onAddDailyJournal={handleAddDailyJournal}
            onAddAcademicEvent={(event) => {
              const newEvent = { ...event, id: Date.now().toString() };
              setAcademicEvents(prev => [...prev, newEvent]);
              showNotification('Kegiatan akademik berhasil ditambahkan', 'success');
            }}
            onBulkAddAcademicEvents={(events) => {
              const newEvents = events.map((e, idx) => ({ ...e, id: (Date.now() + idx).toString() }));
              setAcademicEvents(prev => [...prev, ...newEvents]);
              showNotification(`${newEvents.length} kegiatan akademik berhasil disinkronkan`, 'success');
            }}
            onDeleteAcademicEvent={(id) => {
              setAcademicEvents(prev => prev.filter(e => e.id !== id));
              showNotification('Kegiatan akademik berhasil dihapus', 'success');
            }}
            onUpdateAcademicEvent={(event) => {
              setAcademicEvents(prev => prev.map(e => e.id === event.id ? event : e));
              showNotification('Kegiatan akademik berhasil diperbarui', 'success');
            }}
            calendarViewMode={calendarViewMode}
            onCalendarViewModeChange={setCalendarViewMode}
          />
        );
      case ViewMode.INPUT_DATA_CATEGORY:
        return (
          <Dashboard 
            key="input"
            setView={setView} 
            onOpenSettings={(tab) => {
              if (tab) setSettingsTab(tab);
              setView(ViewMode.SETTINGS);
            }}
            onOpenProfile={() => { setSettingsTab('profile'); setView(ViewMode.SETTINGS); }} 
            students={filteredStudents} 
            logs={filteredCounselingLogs} 
            onOpenGuide={() => setShowGuide(true)} 
            teacherData={teacherData}
            selectedAcademicYear={selectedAcademicYear}
            setSelectedAcademicYear={setSelectedAcademicYear}
            availableAcademicYears={availableAcademicYears}
            appearance={appearance}
            onUpdateAppearance={setAppearance}
            schedules={filteredSchedules}
            onCompleteSchedule={handleCompleteSchedule}
            isFirebaseActive={!!db}
            akpdResponses={filteredAkpd}
            akpdQuestions={akpdQuestions}
            category="Input Data"
            academicEvents={combinedAcademicEvents}
            classicalSchedules={classicalSchedules}
            onEditClassicalSchedule={handleEditClassicalScheduleFromDashboard}
            onDeleteClassicalSchedule={handleDeleteClassicalSchedule}
            onAddAttendance={handleAddAttendance}
            onAddDailyJournal={handleAddDailyJournal}
            onAddAcademicEvent={(event) => {
              const newEvent = { ...event, id: Date.now().toString() };
              setAcademicEvents(prev => [...prev, newEvent]);
              showNotification('Kegiatan akademik berhasil ditambahkan', 'success');
            }}
            onBulkAddAcademicEvents={(events) => {
              const newEvents = events.map((e, idx) => ({ ...e, id: (Date.now() + idx).toString() }));
              setAcademicEvents(prev => [...prev, ...newEvents]);
              showNotification(`${newEvents.length} kegiatan akademik berhasil disinkronkan`, 'success');
            }}
            onDeleteAcademicEvent={(id) => {
              setAcademicEvents(prev => prev.filter(e => e.id !== id));
              showNotification('Kegiatan akademik berhasil dihapus', 'success');
            }}
            onUpdateAcademicEvent={(event) => {
              setAcademicEvents(prev => prev.map(e => e.id === event.id ? event : e));
              showNotification('Kegiatan akademik berhasil diperbarui', 'success');
            }}
            calendarViewMode={calendarViewMode}
            onCalendarViewModeChange={setCalendarViewMode}
          />
        );
      case ViewMode.REPORT_CATEGORY:
        return (
          <Dashboard 
            key="report"
            setView={setView} 
            onOpenSettings={(tab) => {
              if (tab) setSettingsTab(tab);
              setView(ViewMode.SETTINGS);
            }}
            onOpenProfile={() => { setSettingsTab('profile'); setView(ViewMode.SETTINGS); }} 
            students={filteredStudents} 
            logs={filteredCounselingLogs} 
            onOpenGuide={() => setShowGuide(true)} 
            teacherData={teacherData}
            selectedAcademicYear={selectedAcademicYear}
            setSelectedAcademicYear={setSelectedAcademicYear}
            availableAcademicYears={availableAcademicYears}
            appearance={appearance}
            onUpdateAppearance={setAppearance}
            schedules={filteredSchedules}
            onCompleteSchedule={handleCompleteSchedule}
            isFirebaseActive={!!db}
            akpdResponses={filteredAkpd}
            akpdQuestions={akpdQuestions}
            category="Laporan"
            academicEvents={combinedAcademicEvents}
            classicalSchedules={classicalSchedules}
            onEditClassicalSchedule={handleEditClassicalScheduleFromDashboard}
            onDeleteClassicalSchedule={handleDeleteClassicalSchedule}
            onAddAttendance={handleAddAttendance}
            onAddDailyJournal={handleAddDailyJournal}
            onAddAcademicEvent={(event) => {
              const newEvent = { ...event, id: Date.now().toString() };
              setAcademicEvents(prev => [...prev, newEvent]);
              showNotification('Kegiatan akademik berhasil ditambahkan', 'success');
            }}
            onBulkAddAcademicEvents={(events) => {
              const newEvents = events.map((e, idx) => ({ ...e, id: (Date.now() + idx).toString() }));
              setAcademicEvents(prev => [...prev, ...newEvents]);
              showNotification(`${newEvents.length} kegiatan akademik berhasil disinkronkan`, 'success');
            }}
            onDeleteAcademicEvent={(id) => {
              setAcademicEvents(prev => prev.filter(e => e.id !== id));
              showNotification('Kegiatan akademik berhasil dihapus', 'success');
            }}
            onUpdateAcademicEvent={(event) => {
              setAcademicEvents(prev => prev.map(e => e.id === event.id ? event : e));
              showNotification('Kegiatan akademik berhasil diperbarui', 'success');
            }}
            calendarViewMode={calendarViewMode}
            onCalendarViewModeChange={setCalendarViewMode}
          />
        );
      case ViewMode.TDA_INPUT:
        return (
          <TdaInput
            view={view}
            setView={setView}
            students={filteredStudents}
            tdaRecords={filteredTda}
            onAdd={handleAddTda}
            onUpdate={handleUpdateTda}
            onDelete={handleDeleteTda}
            teacherData={teacherData}
          />
        );
      case ViewMode.STUDENT_360_PROFILE:
        const student360 = students.find(s => s.id === selectedStudentIdFor360);
        return (
          <Student360Profile
            student={student360!}
            counselingLogs={filteredCounselingLogs}
            violations={filteredViolations}
            achievements={filteredAchievements}
            attendanceRecords={filteredAttendance}
            akpdResponses={filteredAkpd}
            homeVisits={filteredHomeVisits}
            eventLogs={filteredEventLogs}
            tdaRecords={filteredTda}
            reportAndMutations={filteredReportMutations}
            setView={setView}
            onClose={() => setView(ViewMode.STUDENT_LIST)}
          />
        );
      case ViewMode.STUDENT_PERSONAL_BOOK:
        const selectedStudent = students.find(s => s.id === selectedStudentIdForBook);
        return <StudentPersonalBook 
          student={selectedStudent}
          students={filteredStudents}
          counselingLogs={filteredCounselingLogs}
          achievements={filteredAchievements}
          violations={filteredViolations}
          eventLogs={filteredEventLogs}
          attendanceRecords={filteredAttendance}
          akpdResponses={filteredAkpd}
          akpdQuestions={akpdQuestions}
          homeVisits={filteredHomeVisits}
          tdaRecords={filteredTda}
          setView={setView} 
          teacherData={teacherData}
          onUpdate={handleUpdateStudent}
          onDelete={handleDeleteStudent}
          onAddAchievement={handleAddAchievement}
          onAddViolation={handleAddViolation}
          onAddReportMutation={handleAddReportMutation}
          onUpdateReportMutation={handleUpdateReportMutation}
          googleFormUrl={googleFormUrl}
          onDownloadExcelTemplate={handleDownloadTemplate}
          onUploadExcel={() => excelInputRef.current?.click()}
          onSelectStudent={(id) => setSelectedStudentIdForBook(id)}
          reportAndMutations={filteredReportMutations}
        />;

      case ViewMode.STUDENT_LIST:
      case ViewMode.STUDENT_INPUT: 
        return (
          <StudentManagement onOpenPersonalBook={handleViewStudentBook} 
            onOpen360Profile={handleViewStudent360}
            view={view} 
            setView={setView} 
            students={filteredStudents} 
            groups={filteredGroups}
            counselingGroups={filteredCounselingGroups}
            onAdd={handleAddStudent} 
            onAddBatch={handleAddBatchStudents} 
            onUpdate={handleUpdateStudent} 
            onUpdateBatch={handleUpdateBatchStudents}
            onDelete={handleDeleteStudent} 
            onDeleteAllStudents={handleDeleteAllStudents}
            onAddGroup={handleAddGroup}
            onUpdateGroup={handleUpdateGroup}
            onDeleteGroup={handleDeleteGroup}
            onAddCounselingGroup={handleAddCounselingGroup}
            onUpdateCounselingGroup={handleUpdateCounselingGroup}
            onDeleteCounselingGroup={handleDeleteCounselingGroup}
            academicYear={selectedAcademicYear} 
            teacherData={teacherData} 
            onDownloadExcelTemplate={handleDownloadTemplate}
            onUploadExcel={() => excelInputRef.current?.click()}
            onSyncAll={handleSyncAllStudents}
            onSyncAllToFirebase={syncAllStudentsToFirebase}
            onDownloadFromCloud={handleDownloadFromCloud}
            akpdSheetUrl={akpdSheetUrl}
          />
        );
      case ViewMode.COUNSELING_INPUT:
      case ViewMode.COUNSELING_DATA: 
        return (
          <CounselingManagement 
            view={view} 
            setView={setView} 
            students={filteredStudents} 
            groups={filteredGroups}
            logs={filteredCounselingLogs} 
            onAdd={handleAddLog} 
            onUpdate={handleUpdateLog} 
            onDelete={id => {
              setCounselingLogs(l => l.filter(x => x.id !== id));
              deleteFromFirebase('logs', id);
              showNotification('Log berhasil dihapus', 'success');
            }} 
            globalAcademicYear={selectedAcademicYear} 
            teacherData={teacherData} 
            initialEditId={counselingEditId}
            clearEditId={() => setCounselingEditId(null)}
          />
        );
      case ViewMode.GUIDANCE_BOARD:
        return (
          <GuidanceBoard 
            materials={filteredGuidanceMaterials}
            onSave={handleSaveGuidanceMaterial}
            onDelete={handleDeleteGuidanceMaterial}
            teacherData={teacherData}
          />
        );
      case ViewMode.DAILY_JOURNAL_INPUT:
        return (
          <DailyJournalInput 
            onAdd={handleAddDailyJournal} 
            onUpdate={handleUpdateDailyJournal}
            setView={setView} 
            initialData={editingJournal}
          />
        );
      case ViewMode.DAILY_JOURNAL_DATA:
        return (
          <DailyJournalManagement 
            journals={filteredDailyJournals} 
            teacherData={teacherData}
            setView={setView} 
            onDelete={id => {
              const updated = dailyJournals.filter(j => j.id !== id);
              setDailyJournals(updated);
              localStorage.setItem('guru_bk_daily_journals', JSON.stringify(updated));
              deleteFromFirebase('daily_journals', id);
              showNotification('Jurnal berhasil dihapus', 'success');
            }} 
            onEdit={(journal) => {
              setEditingJournal(journal);
              setView(ViewMode.DAILY_JOURNAL_INPUT);
            }}
            onAddNew={() => {
              setEditingJournal(null);
              setView(ViewMode.DAILY_JOURNAL_INPUT);
            }}
          />
        );
      case ViewMode.ANECDOTAL_RECORD_INPUT:
      case ViewMode.ANECDOTAL_RECORD_DATA:
        return (
          <AnecdotalRecordManagement 
            view={view}
            setView={setView}
            logs={filteredEventLogs}
            students={filteredStudents}
            onAdd={handleAddEventLog}
            onUpdate={handleUpdateEventLog}
            onDelete={id => {
              setEventLogs(ev => ev.filter(x => x.id !== id));
              deleteFromFirebase('events', id);
              showNotification('Anekdot berhasil dihapus', 'success');
            }}
            teacherData={teacherData}
            selectedAcademicYear={selectedAcademicYear}
          />
        );
      case ViewMode.REPORT_MUTATION:
        return (
          <ReportAndMutationManagement 
            view={view}
            setView={setView}
            students={filteredStudents}
            reportAndMutations={filteredReportMutations}
            onAdd={handleAddReportMutation}
            onUpdate={handleUpdateReportMutation}
            onDelete={handleDeleteReportMutation}
            teacherData={teacherData}
            onOpenSettings={(tab) => {
              if (tab) setSettingsTab(tab);
              setView(ViewMode.SETTINGS);
            }}
          />
        );
      case ViewMode.STUDENT_REPORT_INPUT:
        return (
          <ReportAndMutationManagement 
            view={view}
            setView={setView}
            students={filteredStudents}
            reportAndMutations={filteredReportMutations}
            onAdd={handleAddReportMutation}
            onUpdate={handleUpdateReportMutation}
            onDelete={handleDeleteReportMutation}
            teacherData={teacherData}
            studentMode={true}
            onOpenSettings={(tab) => {
              if (tab) setSettingsTab(tab);
              setView(ViewMode.SETTINGS);
            }}
          />
        );
      case ViewMode.LPJ_MANAGEMENT: 
        return <LPJManagement students={filteredStudents} logs={filteredCounselingLogs} academicYear={selectedAcademicYear} setView={setView} teacherData={teacherData} onSyncLPJ={p => syncDataToCloud('lpj', {...p, teacherName: teacherData.name})} />;
      case ViewMode.STRATEGY_HUB:
        return (
          <StrategyHub 
            logs={filteredCounselingLogs} 
            setView={setView} 
            onSelectStrategyReport={(s) => { setSelectedStrategy(s); setView(ViewMode.STRATEGY_REPORTS); }} 
          />
        );
      case ViewMode.STRATEGY_GENERATOR:
        return <StrategyGenerator setView={setView} />;
      case ViewMode.STRATEGY_REPORTS:
        return (
          <StrategyReports 
            strategyName={selectedStrategy} 
            logs={filteredCounselingLogs} 
            students={filteredStudents} 
            teacherData={teacherData} 
            setView={setView} 
            onAddLog={(initial) => { 
                setView(ViewMode.COUNSELING_INPUT);
            }} 
            onEditLog={(id) => {
              setCounselingEditId(id);
              setView(ViewMode.COUNSELING_INPUT);
            }}
            onDeleteLog={(id) => {
              setCounselingLogs(l => l.filter(x => x.id !== id));
              deleteFromFirebase('logs', id);
              showNotification('Laporan berhasil dihapus', 'success');
            }}
          />
        );
      case ViewMode.COLLABORATION:
        return (
          <CollaborationHub 
            db={db}
            currentUser={currentUser}
            teacherData={teacherData}
            setView={setView}
            showNotification={showNotification}
            onLogin={handleLogin}
          />
        );
      case ViewMode.SETTINGS_CATEGORY:
        return (
          <Dashboard 
            key="settings-menu"
            setView={setView} 
            onOpenSettings={(tab) => {
              if (tab) setSettingsTab(tab);
              setView(ViewMode.SETTINGS);
            }}
            onOpenProfile={() => { setSettingsTab('profile'); setView(ViewMode.SETTINGS); }} 
            students={filteredStudents} 
            logs={filteredCounselingLogs} 
            onOpenGuide={() => setShowGuide(true)} 
            teacherData={teacherData}
            selectedAcademicYear={selectedAcademicYear}
            setSelectedAcademicYear={setSelectedAcademicYear}
            availableAcademicYears={availableAcademicYears}
            appearance={appearance}
            onUpdateAppearance={setAppearance}
            schedules={filteredSchedules}
            onCompleteSchedule={handleCompleteSchedule}
            isFirebaseActive={!!db}
            akpdResponses={filteredAkpd}
            akpdQuestions={akpdQuestions}
            category="Sistem"
            academicEvents={combinedAcademicEvents}
            onEditClassicalSchedule={handleEditClassicalScheduleFromDashboard}
            onDeleteClassicalSchedule={handleDeleteClassicalSchedule}
            onAddAttendance={handleAddAttendance}
            onAddDailyJournal={handleAddDailyJournal}
            onAddAcademicEvent={(event) => {
              const newEvent = { ...event, id: Date.now().toString() };
              setAcademicEvents(prev => [...prev, newEvent]);
              showNotification('Kegiatan akademik berhasil ditambahkan', 'success');
            }}
            onBulkAddAcademicEvents={(events) => {
              const newEvents = events.map((e, idx) => ({ ...e, id: (Date.now() + idx).toString() }));
              setAcademicEvents(prev => [...prev, ...newEvents]);
              showNotification(`${newEvents.length} kegiatan akademik berhasil disinkronkan`, 'success');
            }}
            onDeleteAcademicEvent={(id) => {
              setAcademicEvents(prev => prev.filter(e => e.id !== id));
              showNotification('Kegiatan akademik berhasil dihapus', 'success');
            }}
            onUpdateAcademicEvent={(event) => {
              setAcademicEvents(prev => prev.map(e => e.id === event.id ? event : e));
              showNotification('Kegiatan akademik berhasil diperbarui', 'success');
            }}
            calendarViewMode={calendarViewMode}
            onCalendarViewModeChange={setCalendarViewMode}
          />
        );
      case ViewMode.SETTINGS: 
        return <Settings 
          appearance={appearance} 
          onUpdateAppearance={setAppearance} 
          spreadsheetUrl={spreadsheetUrl} 
          googleFormUrl={googleFormUrl}
          onSaveUrl={u => { setSpreadsheetUrl(u); localStorage.setItem('guru_bk_spreadsheet_url', u); }} 
          onSaveGoogleFormUrl={u => { setGoogleFormUrl(u); localStorage.setItem('guru_bk_google_form_url', u); showNotification("Link Google Form Tersimpan", "success"); }}
          onTestUrl={u => syncDataToCloud('test', {status:'OK'}, u)} 
          onSaveDocUrl={() => {}} 
          setView={setView} 
          teacherData={teacherData} 
          onUpdateTeacherData={d => { setTeacherData(d); setAcademicYear(d.academicYear); localStorage.setItem('guru_bk_teacher_data', JSON.stringify(d)); }} 
          onExportBackup={handleExportBackup} 
          onImportBackup={handleImportBackup} 
          onManualSave={handleManualSave}
          firebaseConfig={firebaseConfig} 
          onSaveFirebase={handleSaveFirebaseConfig} 
          initialTab={settingsTab}
          showNotification={showNotification}
          onResetData={handleResetData}
          onSyncCloud={handleSyncCloud}
          onSyncAllStudents={handleSyncAllStudents}
          onDownloadFromCloud={handleDownloadFromCloud}
          syncQueue={syncQueue}
          onProcessSyncQueue={processSyncQueue}
          onClearSyncQueue={handleClearSyncQueue}
          isOffline={isOffline}
          db={db}
          auth={auth}
        />;
      case ViewMode.WORK_MECHANISM:
        return <WorkMechanism setView={setView} teacherData={teacherData} />;
      case ViewMode.COMPONENT_RECAP:
        return <ComponentRecap logs={filteredCounselingLogs} students={filteredStudents} teacherData={teacherData} setView={setView} />;
      case ViewMode.VIOLATION_MANAGEMENT:
        return (
          <ViolationManagement 
            view={view}
            setView={setView}
            violations={filteredViolations}
            students={filteredStudents}
            onAdd={handleAddViolation}
            onUpdate={handleUpdateViolation}
            onDelete={handleDeleteViolation}
            teacherData={teacherData}
          />
        );
      case ViewMode.ACHIEVEMENT_MANAGEMENT:
        return (
          <AchievementManagement 
            view={view}
            setView={setView}
            achievements={filteredAchievements}
            scholarships={filteredScholarships}
            students={filteredStudents}
            onAdd={handleAddAchievement}
            onUpdate={handleUpdateAchievement}
            onDelete={handleDeleteAchievement}
            onAddScholarship={handleAddScholarship}
            onUpdateScholarship={handleUpdateScholarship}
            onDeleteScholarship={handleDeleteScholarship}
            economicallyDisadvantagedStudents={filteredEconomicallyDisadvantagedStudents}
            onAddEconomicallyDisadvantagedStudent={handleAddEconomicallyDisadvantagedStudent}
            onUpdateEconomicallyDisadvantagedStudent={handleUpdateEconomicallyDisadvantagedStudent}
            onDeleteEconomicallyDisadvantagedStudent={handleDeleteEconomicallyDisadvantagedStudent}
            teacherData={teacherData}
            availableAcademicYears={availableAcademicYears}
          />
        );
      case ViewMode.ANALYTICS:
        return <AnalyticsDashboard students={filteredStudents} logs={filteredCounselingLogs} setView={setView} teacherData={teacherData} isCloudActive={isCloudActive} />;
      case ViewMode.ANNUAL_REPORT:
        return <AnnualReportDashboard students={filteredStudents} logs={filteredCounselingLogs} violations={filteredViolations} problemReports={filteredProblemReports} setView={setView} teacherData={teacherData} />;
      case ViewMode.AUTOMATED_REPORTS:
        return <AutomatedReports 
          setView={setView}
          students={filteredStudents}
          counselingLogs={filteredCounselingLogs}
          eventLogs={filteredEventLogs}
          violations={filteredViolations}
          achievements={filteredAchievements}
          dailyJournals={filteredDailyJournals}
          homeVisits={filteredHomeVisits}
          teacherData={teacherData}
          showNotification={showNotification}
        />;
      case ViewMode.ATTENDANCE_MANAGEMENT:
        return <AttendanceManagement 
          setView={setView}
          students={filteredStudents}
          attendanceRecords={filteredAttendance}
          onAddAttendance={handleAddAttendance}
          onUpdateAttendance={handleUpdateAttendance}
          onDeleteAttendance={handleDeleteAttendance}
          teacherData={teacherData}
        />;
      case ViewMode.COUNSELING_SCHEDULE:
        return <CounselingScheduleComponent 
          setView={setView}
          students={filteredStudents}
          schedules={filteredSchedules}
          onAddSchedule={handleAddSchedule}
          onUpdateSchedule={handleUpdateSchedule}
          onDeleteSchedule={handleDeleteSchedule}
          teacherData={teacherData}
        />;
      case ViewMode.CLASSICAL_GUIDANCE_SCHEDULE:
        return <ClassicalGuidanceScheduleManagement
          schedules={classicalSchedules}
          onAdd={handleAddClassicalSchedule}
          onUpdate={handleUpdateClassicalSchedule}
          onDelete={handleDeleteClassicalSchedule}
          teacherData={teacherData}
          initialEditingSchedule={editingClassicalSchedule || undefined}
        />;
      case ViewMode.NEED_ASSESSMENT:
        return <NeedAssessmentComponent 
          setView={setView}
          students={filteredStudents}
          akpdResponses={filteredAkpd}
          onAddAssessment={handleAddAssessment}
          onDeleteAssessment={handleDeleteAssessment}
          onAddAkpd={handleAddAkpd}
          onDeleteAkpd={handleDeleteAkpd}
          akpdSheetUrl={akpdSheetUrl}
          onSetAkpdSheetUrl={handleSetAkpdSheetUrl}
          akpdQuestions={akpdQuestions}
          onUpdateAkpdQuestions={handleUpdateAkpdQuestions}
          teacherData={teacherData}
          onSyncAkpdFromCloud={handleSyncAkpdFromCloud}
          onRefreshFromFirebase={() => fetchFromFirebase('akpd')}
          teacherId={currentUser?.uid || ""}
        />;
      case ViewMode.VULNERABILITY_MAP:
        return <VulnerabilityMapComponent 
          setView={setView}
          students={filteredStudents}
          attendance={filteredAttendance}
          violations={filteredViolations}
          anecdotalRecords={filteredEventLogs}
          homeVisits={filteredHomeVisits}
          referrals={filteredReferrals}
          maps={filteredVulnMaps}
          onUpdateMap={handleUpdateVulnMap}
        />;
      case ViewMode.HOME_VISIT:
        return <HomeVisitManagement 
          setView={setView}
          onOpenSettings={(tab) => {
            if (tab) setSettingsTab(tab);
            setView(ViewMode.SETTINGS);
          }}
          students={filteredStudents}
          visits={filteredHomeVisits}
          onAdd={handleAddHomeVisit}
          onUpdate={handleUpdateHomeVisit}
          onDelete={handleDeleteHomeVisit}
          teacherData={teacherData}
          showNotification={showNotification}
        />;
      case ViewMode.HOME_VISIT_INPUT:
        return <HomeVisitInput
          setView={setView}
          students={filteredStudents}
          onAdd={handleAddHomeVisit}
          teacherData={teacherData}
        />;
      case ViewMode.REFERRAL_MANAGEMENT:
        return <ReferralManagement 
          setView={setView}
          students={filteredStudents}
          referrals={filteredReferrals}
          onAdd={handleAddReferral}
          onUpdate={handleUpdateReferral}
          onDelete={handleDeleteReferral}
          teacherData={teacherData}
          showNotification={showNotification}
        />;
      case ViewMode.STUDENT_AKPD:
        return <StudentAKPDView 
          students={filteredStudents}
          akpdQuestions={akpdQuestions}
          onSubmit={async (r) => {
            handleAddAkpd(r);
          }}
        />;
      case ViewMode.STUDENT_DATA_REPORT:
        return (
          <StudentDataReport 
            students={filteredStudents}
            teacherData={teacherData}
            setView={setView}
          />
        );
      case ViewMode.PARENT_COMMUNICATION:
        return (
          <ParentCommunicationComponent 
            setView={setView}
            students={filteredStudents}
            communications={filteredParentCommunications}
            onAdd={handleAddParentCommunication}
            onUpdate={handleUpdateParentCommunication}
            onUpdateStudent={handleUpdateStudent}
            teacherData={teacherData}
          />
        );
      case ViewMode.SOCIOMETRY:
        return (
          <SociometryManagement 
            students={filteredStudents}
            sociometryData={sociometryData}
            academicYear={selectedAcademicYear}
            teacherData={teacherData}
            onAdd={handleAddSociometry}
            onDelete={handleDeleteSociometry}
          />
        );
      case ViewMode.DOCUMENT_MANAGEMENT:
        return (
          <DocumentManagement 
            setView={setView}
            showNotification={showNotification}
          />
        );
      case ViewMode.CERTIFICATE_MANAGEMENT:
        return (
          <div className="max-w-4xl mx-auto">
            <CertificationsTab 
              teacherForm={teacherData} 
              setTeacherForm={(dataOrFn) => {
                if (typeof dataOrFn === 'function') {
                  setTeacherData(prev => {
                    const newData = dataOrFn(prev);
                    localStorage.setItem('guru_bk_teacher_data', JSON.stringify(newData));
                    return newData;
                  });
                } else {
                  setTeacherData(dataOrFn);
                  localStorage.setItem('guru_bk_teacher_data', JSON.stringify(dataOrFn));
                }
              }} 
            />
          </div>
        );
      case ViewMode.LKPD_MATERI_GENERATOR:
        return (
          <LkpdMateriGenerator
            teacherData={teacherData}
          />
        );
      case ViewMode.RPL_GENERATOR:
        return (
          <RplGenerator 
            teacherData={teacherData}
            savedRpls={rpls}
            onSave={handleSaveRpl}
            onDelete={handleDeleteRpl}
          />
        );
      case ViewMode.PROBLEM_BOX:
        return (
          <ProblemBox 
            reports={filteredProblemReports}
            onAdd={handleAddProblemReport}
            onUpdate={handleUpdateProblemReport}
            onDelete={handleDeleteProblemReport}
            teacherData={teacherData}
            onUpdateTeacherData={(d) => {
              setTeacherData(d);
              localStorage.setItem('guru_bk_teacher_data', JSON.stringify(d));
            }}
            setView={setView}
            showNotification={showNotification}
            teacherId={currentUser?.uid || ''}
          />
        );
      case ViewMode.COUNSELING_APPROACHES:
        return <CounselingApproaches setView={setView} />;
      case ViewMode.COUNSELING_TECHNIQUES:
        return <CounselingTechniques setView={setView} />;
      case ViewMode.ASAS_BK:
        return <AsasBK />;
      case ViewMode.COUNSELING_DICTIONARY:
        return <CounselingDictionary setView={setView} />;
      case ViewMode.ICE_BREAKING:
        return <IceBreaking />;
      case ViewMode.SOP_MANAGEMENT:
        return <SopManagement />;
      case ViewMode.KODE_ETIK:
        return <KodeEtik />;
      case ViewMode.DEVELOPER_INFO:
        return (
          <div className="flex flex-col items-center justify-center min-h-[40vh] p-6 text-center bg-white rounded-3xl shadow-xl border border-slate-100 max-w-md mx-auto mt-10">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-lg font-black text-slate-800 mb-3 tracking-tight uppercase">Pengembang Aplikasi</h2>
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 shadow-sm w-full">
              <p className="text-sm font-bold text-slate-700 leading-relaxed">
                Aplikasi ini di desain dan di kembangkan oleh :
              </p>
              <p className="text-base font-black text-blue-700 mt-1 tracking-tight">
                W. Purnomo - SMP Negeri 2 Magelang
              </p>
              <p className="text-xs text-blue-600 font-bold mt-1">
                dutatama@gmail.com
              </p>
            </div>
            <p className="mt-6 text-slate-400 text-[10px] font-medium uppercase tracking-widest">
              Professional Counseling System &copy; 2026
            </p>
          </div>
        );
      default: return null;
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-700 selection:bg-primary/10">
      <Toaster position="top-right" expand={true} richColors closeButton />
      {(isOffline || syncQueue.length > 0) && (
        <div className={`fixed top-0 left-0 w-full z-[10000] ${isOffline ? 'bg-rose-500' : 'bg-amber-500'} text-white px-4 py-1.5 flex items-center justify-center gap-4 animate-in slide-in-from-top-full duration-300 shadow-lg`}>
          <div className="flex items-center gap-2">
            {isOffline ? <WifiOff className="w-4 h-4 animate-pulse" /> : <Wifi className="w-4 h-4" />}
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              {isOffline ? 'Mode Offline Aktif — Data Tersimpan Secara Lokal' : 'Kembali Online — Sinkronisasi Cloud Aktif'}
            </span>
          </div>
          {syncQueue.length > 0 && (
            <div className="flex items-center gap-2 border-l border-white/20 pl-4">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">{syncQueue.length} Data Menunggu Sinkronisasi</span>
              {!isOffline && (
                <button 
                  onClick={processSyncQueue}
                  className="ml-2 bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all"
                >
                  Sinkron Sekarang
                </button>
              )}
            </div>
          )}
        </div>
      )}
      <Routes>
          <Route path="/welcome" element={<WelcomeScreen onEnter={() => { setView(ViewMode.HOME); window.location.hash = '/dashboard'; }} teacherData={teacherData} onOpenGuide={() => setShowGuide(true)} />} />
          <Route path="/kotak-masalah-siswa" element={
            <div className="min-h-screen bg-slate-50 p-4 md:p-8">
              <div className="max-w-4xl mx-auto">
                <ProblemBox 
                  reports={[]} 
                  onAdd={handleAddProblemReport}
                  onUpdate={handleUpdateProblemReport}
                  onDelete={handleDeleteProblemReport}
                  teacherData={teacherData}
                  onUpdateTeacherData={(d) => {
                    setTeacherData(d);
                    localStorage.setItem('guru_bk_teacher_data', JSON.stringify(d));
                  }}
                  setView={setView}
                  showNotification={showNotification}
                  isStudentView={true}
                  teacherId={urlTeacherId || ''}
                />
              </div>
            </div>
          } />
          <Route path="/" element={<Navigate to="/welcome" />} />
            <Route element={
            <ErrorBoundary>
              <SidebarLayout 
                onOpenSettings={(tab) => { if (tab) setSettingsTab(tab); setView(ViewMode.SETTINGS); }} 
                onNavigate={setView} 
                teacherData={teacherData} 
                appearance={appearance} 
                onUpdateAppearance={setAppearance} 
                onOpenGuide={() => setShowGuide(true)}
                globalSearch={globalSearch}
                onSearch={setGlobalSearch}
                currentView={view}
              />
            </ErrorBoundary>
          } >
            <Route path="*" element={
              (isLoading || !isAuthReady) ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-blue-600 animate-pulse" />
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-sm font-black text-slate-800 uppercase tracking-widest">Memuat Data</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mohon Tunggu Sebentar...</p>
                  </div>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={view}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {renderContent()}
                  </motion.div>
                </AnimatePresence>
              )
            } />
          </Route>
        </Routes>
        
        {notification && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-bottom-5 duration-300">
            <div className={`bg-amber-500 backdrop-blur-xl px-6 py-4 rounded-2xl flex items-center gap-4 border shadow-2xl ${notification.type === 'error' ? 'border-rose-200' : 'border-slate-300'}`}>
              {notification.type === 'loading' ? <Loader2 className="w-5 h-5 text-slate-800 animate-spin" /> : notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-slate-800" /> : <AlertCircle className="w-5 h-5 text-slate-800" />}
              <span className="text-sm font-bold text-slate-800 tracking-tight">{notification.msg}</span>
              <button onClick={() => setNotification(null)} className="p-1 hover:bg-white/20 rounded-lg transition-colors"><X className="w-4 h-4 text-slate-800/80" /></button>
            </div>
          </div>
        )}
        
        <DutaAssistant studentsCount={filteredStudents.length} />
        <UsageGuide isOpen={showGuide} onClose={() => setShowGuide(false)} onNavigate={setView} />
        <input type="file" ref={excelInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleUploadExcel} />
      </main>
  );
};

export default App;
