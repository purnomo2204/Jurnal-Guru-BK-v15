import React, { useState, useRef, useMemo } from "react";
import { ViewMode, Student, TeacherData, CounselingGroup } from "../types";
import { useFormDraft } from "../hooks/useFormDraft";
import {
  Plus,
  Trash2,
  Edit,
  Upload,
  User,
  ArrowLeft,
  Phone,
  Search,
  MapPin,
  Users,
  ImageIcon,
  FileSpreadsheet,
  Download,
  Filter,
  PieChart as PieChartIcon,
  TrendingUp,
  Info,
  Hash,
  HelpCircle,
  X,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  Layers,
  UserPlus,
  Key,
  AlertCircle,
  Activity,
  ShieldCheck,
  ExternalLink,
  CloudUpload,
  Link,
  MessageCircle
} from "lucide-react";
import FormActions from "./FormActions";
import LoadingSpinner from "./LoadingSpinner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import * as XLSX from "xlsx";
import StatisticsView from "./StatisticsView";

import { toast } from "sonner";
import { 
  validateRequired, 
  validateNIS, 
  validateNISN, 
  validatePhone, 
  validateDateNotFuture 
} from "../src/lib/validation";

interface StudentManagementProps {
  onOpenPersonalBook: (studentId: string) => void;
  onOpen360Profile: (studentId: string) => void;
  view: ViewMode;
  setView: (v: ViewMode) => void;
  students: Student[];
  groups: CounselingGroup[];
  onAdd: (s: Student) => void;
  onUpdate: (s: Student) => void;
  onDelete: (id: string) => void;
  onDeleteAllStudents: (className?: string) => void;
  onAddGroup: (g: CounselingGroup) => void;
  onUpdateGroup: (g: CounselingGroup) => void;
  onDeleteGroup: (id: string) => void;
  counselingGroups: CounselingGroup[];
  onAddCounselingGroup: (g: CounselingGroup) => void;
  onUpdateCounselingGroup: (g: CounselingGroup) => void;
  onDeleteCounselingGroup: (id: string) => void;
  onAddBatch?: (students: Student[]) => void;
  onUpdateBatch?: (students: Student[]) => void;
  academicYear: string;
  teacherData: TeacherData;
  onDownloadExcelTemplate: () => void;
  onUploadExcel: () => void;
  onSyncAll?: () => void;
  onSyncAllToFirebase?: () => void;
  onDownloadFromCloud?: () => void;
  akpdSheetUrl: string;
}

const formatWhatsAppNumber = (phone?: string) => {
  if (!phone) return null;
  let formatted = phone.replace(/\D/g, '');
  if (formatted.startsWith('0')) {
    formatted = '62' + formatted.substring(1);
  }
  return formatted;
};

const StudentManagement: React.FC<StudentManagementProps> = ({
  view,
  setView,
  students = [],
  groups = [],
  onAdd,
  onUpdate,
  onDelete,
  onDeleteAllStudents,
  onAddGroup,
  onUpdateGroup,
  onDeleteGroup,
  onAddBatch,
  onUpdateBatch,
  academicYear,
  teacherData,
  onOpenPersonalBook,
  onOpen360Profile,
  onDownloadExcelTemplate,
  onUploadExcel,
  counselingGroups = [],
  onAddCounselingGroup,
  onUpdateCounselingGroup,
  onDeleteCounselingGroup,
  onSyncAll,
  onSyncAllToFirebase,
  onDownloadFromCloud,
  akpdSheetUrl,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    "students" | "homeroom" | "groups" | "analytics" | "counseling-groups"
  >("students");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("Semua Kelas");
  const [statusFilter, setStatusFilter] = useState("Semua Status");
  const [domicileFilter, setDomicileFilter] = useState("Semua Domisili");
  const [showFillGuide, setShowFillGuide] = useState(false);
  const [showGoogleFormGuide, setShowGoogleFormGuide] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [deleteClassFilter, setDeleteClassFilter] = useState("Semua Kelas");
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showWaModal, setShowWaModal] = useState<{
    show: boolean;
    number: string;
  }>({ show: false, number: "" });

  const [isLoading, setIsLoading] = useState(false);

  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const handleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map(s => s.id));
    }
  };

  const handleSelectStudent = (id: string) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter(sid => sid !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedStudentIds.length === 0) return;
    if (confirm(`Apakah Anda yakin ingin menghapus ${selectedStudentIds.length} siswa terpilih?`)) {
      setIsLoading(true);
      try {
        selectedStudentIds.forEach(id => onDelete(id));
        setSelectedStudentIds([]);
        toast.success("Siswa terpilih berhasil dihapus.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!validateRequired(formData.name)) newErrors.name = "Nama lengkap wajib diisi";
    if (formData.name && formData.name.length < 3) newErrors.name = "Nama minimal 3 karakter";
    
    if (!validateRequired(formData.gender)) newErrors.gender = "Jenis kelamin wajib dipilih";
    if (!validateRequired(formData.className)) newErrors.className = "Kelas wajib diisi";
    if (!validateRequired(formData.address)) newErrors.address = "Alamat wajib diisi";
    
    if (formData.nis && !validateNIS(formData.nis)) newErrors.nis = "NIS harus berupa angka (4-15 digit)";
    if (formData.nisn && !validateNISN(formData.nisn)) newErrors.nisn = "NISN harus berupa 10 digit angka";
    
    if (formData.phone && !validatePhone(formData.phone)) newErrors.phone = "Format nomor HP tidak valid (contoh: 08123456789)";
    if (formData.fatherPhone && !validatePhone(formData.fatherPhone)) newErrors.fatherPhone = "Format nomor HP Ayah tidak valid";
    if (formData.motherPhone && !validatePhone(formData.motherPhone)) newErrors.motherPhone = "Format nomor HP Ibu tidak valid";
    if (formData.guardianPhone && !validatePhone(formData.guardianPhone)) newErrors.guardianPhone = "Format nomor HP Wali tidak valid";
    
    if (formData.birthDate && !validateDateNotFuture(formData.birthDate)) newErrors.birthDate = "Tanggal lahir tidak boleh di masa depan";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [homeroomClass, setHomeroomClass] = useState("");
  const [homeroomTeacherName, setHomeroomTeacherName] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Student | "status";
    direction: "asc" | "desc";
  } | null>(null);
  const [homeroomSortConfig, setHomeroomSortConfig] = useState<{
    key: "className" | "teacher" | "studentCount";
    direction: "asc" | "desc";
  } | null>(null);

  const requestSort = (key: keyof Student | "status") => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const requestHomeroomSort = (
    key: "className" | "teacher" | "studentCount",
  ) => {
    let direction: "asc" | "desc" = "asc";
    if (
      homeroomSortConfig &&
      homeroomSortConfig.key === key &&
      homeroomSortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setHomeroomSortConfig({ key, direction });
  };

  const handleSaveHomeroom = () => {
    if (!homeroomClass || !homeroomTeacherName) {
      alert("Pilih kelas dan masukkan nama wali kelas.");
      return;
    }

    const studentsToUpdate = students
      .filter((s) => s.className === homeroomClass)
      .map((s) => ({
        ...s,
        homeroomTeacher: homeroomTeacherName,
      }));

    if (studentsToUpdate.length === 0) {
      alert("Tidak ada siswa di kelas ini.");
      return;
    }

    if (onUpdateBatch) {
      onUpdateBatch(studentsToUpdate);
      alert(
        `Berhasil menyimpan Wali Kelas ${homeroomTeacherName} untuk kelas ${homeroomClass}`,
      );
      setHomeroomClass("");
      setHomeroomTeacherName("");
    } else {
      alert("Fitur update batch belum tersedia.");
    }
  };

  const generateStudentCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "BK-";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const [formData, setFormData, clearFormData] = useFormDraft<Partial<Student>>("draft_student_form", {
    studentCode: "",
    nis: "",
    nisn: "",
    name: "",
    gender: "",
    className: "",
    attendanceNumber: "",
    nickname: "",
    birthPlace: "",
    birthDate: "",
    address: "",
    domicile: "",
    phone: "",
    hobby: "",
    ambition: "",
    furtherSchool: "",
    bestFriend: "",
    achievements: "",
    bloodType: "",
    livingWith: "",
    fatherName: "",
    fatherPhone: "",
    fatherJob: "",
    fatherEducation: "",
    motherName: "",
    motherPhone: "",
    motherJob: "",
    motherEducation: "",
    parentAddress: "",
    photo: "",
    guardianName: "",
    guardianPhone: "",
    guardianJob: "",
    guardianAddress: "",
    homeroomTeacher: "",
    childStatus: "",
    favoriteSubject: "",
    dislikedSubject: "",
  });

  const [groupFormData, setGroupFormData, clearGroupFormData] = useFormDraft<Partial<CounselingGroup>>("draft_group_form", {
    name: "",
    className: "",
    studentIds: [],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const [showCsvModal, setShowCsvModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>(
    {},
  );

  const uniqueClasses = useMemo(
    () => Array.from(new Set(students.map((s) => s.className))).sort(),
    [students],
  );

  const classDistributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach(
      (s) => (counts[s.className] = (counts[s.className] || 0) + 1),
    );
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [students]);

  const genderDistributionData = useMemo(() => {
    const counts: Record<string, number> = { "Laki-laki": 0, Perempuan: 0 };
    students.forEach((s) => {
      const g = s.gender?.trim().toLowerCase() || "";
      const genderKey =
        g === "l" ||
        g === "laki-laki" ||
        g === "laki - laki" ||
        g.includes("laki")
          ? "Laki-laki"
          : g === "p" || g === "perempuan" || g.includes("perempuan")
            ? "Perempuan"
            : "Tidak Diisi";
      counts[genderKey] = (counts[genderKey] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [students]);

  const statusDistributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach((s) => {
      const status = s.childStatus || "Tidak Diisi";
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [students]);

  const domicileDistributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach((s) => {
      const dom = s.domicile || "Tidak Diisi";
      counts[dom] = (counts[dom] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [students]);

  const filteredStudents = useMemo(() => {
    let result = students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.nis && s.nis.includes(searchQuery)) ||
        (s.nisn && s.nisn.includes(searchQuery)) ||
        (s.studentCode &&
          s.studentCode.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesClass =
        classFilter === "Semua Kelas" || s.className === classFilter;
      const matchesStatus =
        statusFilter === "Semua Status" ||
        s.status === statusFilter ||
        (statusFilter === "Aktif" && !s.status);
      const matchesDomicile =
        domicileFilter === "Semua Domisili" ||
        (domicileFilter === "Dalam Kota" && s.domicile === "Dalam Kota") ||
        (domicileFilter === "Luar Kota" && s.domicile === "Luar Kota");
      return matchesSearch && matchesClass && matchesStatus && matchesDomicile;
    });

    if (sortConfig !== null) {
      result.sort((a, b) => {
        let aValue = a[sortConfig.key as keyof Student];
        let bValue = b[sortConfig.key as keyof Student];

        if (aValue === undefined || aValue === null) aValue = "";
        if (bValue === undefined || bValue === null) bValue = "";

        // Handle numeric strings for proper sorting (e.g., attendanceNumber)
        if (typeof aValue === "string" && typeof bValue === "string") {
          const aNum = Number(aValue);
          const bNum = Number(bValue);
          if (
            !isNaN(aNum) &&
            !isNaN(bNum) &&
            aValue.trim() !== "" &&
            bValue.trim() !== ""
          ) {
            return sortConfig.direction === "asc" ? aNum - bNum : bNum - aNum;
          }
          return sortConfig.direction === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [students, searchQuery, classFilter, statusFilter, domicileFilter, sortConfig]);

  const handleCopyAkpdLink = (student: Student) => {
    let url =
      window.location.origin +
      window.location.pathname +
      "?view=akpd&nama=" +
      encodeURIComponent(student.name) +
      "&kelas=" +
      encodeURIComponent(student.className);
    if (akpdSheetUrl) {
      url += `&akpd_sheet=${encodeURIComponent(akpdSheetUrl)}`;
    }
    navigator.clipboard.writeText(url);
    alert("Link AKPD untuk " + student.name + " berhasil disalin!");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 2 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setFormData((prev) => ({
          ...prev,
          photo: ev.target?.result as string,
        }));
      reader.readAsDataURL(file);
    } else if (file) alert("Maksimal ukuran foto adalah 2MB");
  };

  const startEdit = (student: Student) => {
    setEditingId(student.id);
    setFormData(student);
    setView(ViewMode.STUDENT_INPUT);
  };

  const onAddStudent = onAdd as (s: Student, sync?: boolean) => void;
  const onUpdateStudent = onUpdate as (s: Student, sync?: boolean) => void;

  const handleSave = async (syncOnline: boolean = true) => {
    if (!validateForm()) {
      toast.error("Mohon perbaiki kesalahan pada form sebelum menyimpan.");
      return;
    }

    setIsLoading(true);
    try {
      const dataToSave = {
        ...formData,
        studentCode: formData.studentCode || generateStudentCode(),
        academicYear: formData.academicYear || academicYear,
      };

      if (editingId)
        onUpdateStudent(
          { ...(dataToSave as Student), id: editingId },
          syncOnline,
        );
      else
        onAddStudent(
          { ...(dataToSave as Student), id: Date.now().toString() },
          syncOnline,
        );

      setEditingId(null);
      clearFormData({ studentCode: generateStudentCode() });
      setView(ViewMode.STUDENT_LIST);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave(true); // Default to online if submitted via Enter
  };

  const handleDeleteAll = () => {
    if (students.length === 0) return;
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    onDeleteAllStudents(deleteClassFilter);
    setShowDeleteModal(false);
  };

  const handleExportExcel = () => {
    if (students.length === 0) {
      alert("Tidak ada data siswa untuk diekspor.");
      return;
    }

    const dataToExport = filteredStudents.map((s, index) => ({
      'No': index + 1,
      'ID Siswa': s.studentCode || '',
      'NIS': s.nis || '',
      'NISN': s.nisn || '',
      'Nama Lengkap': s.name || '',
      'Nama Panggilan': s.nickname || '',
      'Jenis Kelamin': s.gender || '',
      'Kelas': s.className || '',
      'No. Absen': s.attendanceNumber || '',
      'Tempat Lahir': s.birthPlace || '',
      'Tanggal Lahir': s.birthDate || '',
      'Alamat': s.address || '',
      'Domisili': s.domicile || '',
      'No. HP': s.phone || '',
      'Wali Kelas': s.homeroomTeacher || '',
      'Status Anak': s.childStatus || '',
      'Agama': s.religion || '',
      'Golongan Darah': s.bloodType || '',
      'Tinggi Badan': s.height || '',
      'Berat Badan': s.weight || '',
      'Hobi': s.hobby || '',
      'Cita-cita': s.ambition || '',
      'Sekolah Lanjut': s.furtherSchool || '',
      'Prestasi': s.achievements || '',
      'Ekstrakurikuler': s.extracurricular || '',
      'Tinggal Bersama': s.livingWith || '',
      'Nama Ayah': s.fatherName || '',
      'Pekerjaan Ayah': s.fatherJob || '',
      'Nama Ibu': s.motherName || '',
      'Pekerjaan Ibu': s.motherJob || '',
      'Nama Wali': s.guardianName || '',
      'Pekerjaan Wali': s.guardianJob || '',
      'Tahun Ajaran': s.academicYear || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Siswa");
    
    // Auto-size columns
    const maxWidths = Object.keys(dataToExport[0] || {}).map(key => {
      const headerLen = key.length;
      const maxContentLen = Math.max(...dataToExport.map(row => String(row[key as keyof typeof row] || '').length));
      return { wch: Math.max(headerLen, maxContentLen) + 2 };
    });
    worksheet['!cols'] = maxWidths;

    XLSX.writeFile(workbook, `Data_Siswa_${classFilter === 'Semua Kelas' ? '' : classFilter + '_'}${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportCSV = () => {
    if (students.length === 0) {
      alert("Tidak ada data siswa untuk diekspor.");
      return;
    }

    // Define CSV headers based on Student type
    const headers = [
      "Kode Siswa",
      "NIS",
      "NISN",
      "Nama Lengkap",
      "Nama Panggilan",
      "Jenis Kelamin",
      "Kelas",
      "No. Absen",
      "Tempat Lahir",
      "Tanggal Lahir",
      "Alamat",
      "Domisili",
      "No. HP",
      "Wali Kelas",
      "Status Anak",
      "Mapel Disukai",
      "Mapel Tidak Disukai",
      "Golongan Darah",
      "Tahun Ajaran",
    ];

    // Map students to CSV rows
    const csvRows = students.map((student) => [
      student.studentCode || "",
      student.nis || "",
      student.nisn || "",
      student.name || "",
      student.nickname || "",
      student.gender || "",
      student.className || "",
      student.attendanceNumber || "",
      student.birthPlace || "",
      student.birthDate || "",
      `"${(student.address || "").replace(/"/g, '""')}"`, // Handle commas in address
      student.domicile || "",
      student.phone || "",
      student.homeroomTeacher || "",
      student.childStatus || "",
      student.favoriteSubject || "",
      student.dislikedSubject || "",
      student.bloodType || "",
      student.academicYear || "",
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...csvRows.map((row) => row.join(",")),
    ].join("\n");

    // Create and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", url);
    linkElement.setAttribute(
      "download",
      `Data_Siswa_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const wb = XLSX.read(data, { type: "array" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const dataJson = XLSX.utils.sheet_to_json(ws, { header: 1 });

      if (dataJson.length > 0) {
        const headers = dataJson[0] as string[];
        const rows = dataJson.slice(1).map((row) => {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = (row as any)[index];
          });
          return obj;
        });

        setCsvHeaders(headers);
        setCsvData(rows);
        setShowCsvModal(true);

        // Auto-map some common columns
        const initialMapping: Record<string, string> = {};
        const studentFields = [
          { key: "studentCode", labels: ["Kode Siswa", "Kode"] },
          { key: "nis", labels: ["NIS"] },
          { key: "nisn", labels: ["NISN"] },
          { key: "name", labels: ["Nama", "Nama Lengkap"] },
          { key: "nickname", labels: ["Nama Panggilan", "Panggilan"] },
          { key: "gender", labels: ["Jenis Kelamin", "L/P", "JK"] },
          { key: "className", labels: ["Kelas"] },
          { key: "attendanceNumber", labels: ["No. Absen", "Absen"] },
          { key: "birthPlace", labels: ["Tempat Lahir"] },
          { key: "birthDate", labels: ["Tanggal Lahir"] },
          { key: "address", labels: ["Alamat"] },
          { key: "domicile", labels: ["Domisili"] },
          { key: "phone", labels: ["No. HP", "HP", "Telepon"] },
          { key: "homeroomTeacher", labels: ["Wali Kelas"] },
          { key: "childStatus", labels: ["Status Anak"] },
          { key: "favoriteSubject", labels: ["Mapel Disukai"] },
          { key: "dislikedSubject", labels: ["Mapel Tidak Disukai"] },
          { key: "bloodType", labels: ["Golongan Darah", "Gol Darah"] },
        ];

        studentFields.forEach((field) => {
          const match = headers.find((h) =>
            field.labels.some(
              (l) => h && h.toLowerCase().includes(l.toLowerCase()),
            ),
          );
          if (match) {
            initialMapping[field.key] = match;
          }
        });

        setColumnMapping(initialMapping);
      }
    };
    reader.readAsArrayBuffer(file);
    if (csvInputRef.current) csvInputRef.current.value = "";
  };

  const handleProcessCSV = () => {
    if (!onAddBatch) {
      alert("Fitur tambah batch belum tersedia.");
      return;
    }

    const newStudents: Student[] = csvData.map((row: any) => {
      const student: any = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        academicYear,
        studentCode: generateStudentCode(),
      };

      (Object.entries(columnMapping) as [string, string][]).forEach(
        ([fieldKey, csvHeader]) => {
          const r = row as any;
          if (csvHeader && r[csvHeader] !== undefined) {
            let value = String(r[csvHeader]).trim();

            // Normalize gender
            if (fieldKey === "gender") {
              const lowerVal = value.toLowerCase();
              if (lowerVal === "l" || lowerVal.includes("laki"))
                value = "Laki-laki";
              else if (lowerVal === "p" || lowerVal.includes("perempuan"))
                value = "Perempuan";
            }

            student[fieldKey] = value;
          }
        },
      );

      return student as Student;
    });

    onAddBatch(newStudents);
    setShowCsvModal(false);
    setCsvData([]);
    setCsvHeaders([]);
    setColumnMapping({});
    alert(`Berhasil mengimpor ${newStudents.length} siswa.`);
  };

  const handleSaveGroup = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = {
      ...groupFormData,
      academicYear,
      studentIds: groupFormData.studentIds || [],
    } as CounselingGroup;

    if (activeSubTab === "counseling-groups") {
      if (dataToSave.id) {
        onUpdateCounselingGroup(dataToSave);
      } else {
        onAddCounselingGroup({ ...dataToSave, id: Date.now().toString() });
      }
    } else {
      // This will be for 'groups'
      if (dataToSave.id) {
        onUpdateGroup(dataToSave);
      } else {
        onAddGroup({ ...dataToSave, id: Date.now().toString() });
      }
    }
    setShowGroupModal(false);
    clearGroupFormData();
  };

  const startEditGroup = (
    group: CounselingGroup,
    type: "guidance" | "counseling",
  ) => {
    setGroupFormData(group);
    setShowGroupModal(true);
  };

  if (view === ViewMode.STUDENT_INPUT) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 animate-fade-in pb-10 text-left px-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter">
            {editingId ? "Edit Data" : "Pendaftaran"}{" "}
            <span className="text-primary italic">Siswa</span>
          </h2>
          <button
            onClick={() => setView(ViewMode.STUDENT_LIST)}
            className="bg-white px-4 py-2 rounded-lg font-black border border-slate-200 text-slate-500 flex items-center gap-2 text-[9px] uppercase tracking-widest transition-all hover:bg-slate-50 hover:text-slate-800 shadow-sm"
          >
            <ArrowLeft className="w-3 h-3" /> BATAL
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* I. Identitas */}
          <div className="bg-white p-4 rounded-xl space-y-3 shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl border border-primary/20 shadow-sm">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-800 tracking-tight uppercase">
                  I. Identitas Peserta Didik
                </h3>
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                  Informasi dasar dan administrasi siswa
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative aspect-square w-full rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden cursor-pointer group transition-all hover:border-primary/30 shadow-sm"
              >
                {formData.photo ? (
                  <img
                    src={formData.photo}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-600 group-hover:text-primary/50 transition-colors" />
                )}
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Upload className="w-4 h-4 text-slate-800" />
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                {/* ID SISWA - AUTO GENERATED */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[8px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-1">
                    <Key className="w-2.5 h-2.5" /> ID Siswa (Otomatis)
                  </label>
                  <input
                    readOnly
                    value={
                      formData.studentCode ||
                      (editingId ? "" : "[Dibuat saat simpan]")
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[10px] font-black text-primary outline-none cursor-not-allowed italic shadow-sm"
                  />
                </div>

                <div className="space-y-0.5">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    NIS
                  </label>
                  <input
                    value={formData.nis || ""}
                    onChange={(e) => {
                      setFormData({ ...formData, nis: e.target.value });
                      if (errors.nis) setErrors(prev => ({ ...prev, nis: "" }));
                    }}
                    className={`w-full bg-slate-50 border ${errors.nis ? 'border-rose-500' : 'border-slate-200'} rounded-xl p-2.5 text-[10px] font-bold text-slate-800 outline-none focus:border-primary transition-all shadow-sm`}
                  />
                  {errors.nis && <p className="text-[7px] text-rose-500 font-bold">{errors.nis}</p>}
                </div>
                <div className="space-y-0.5">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    NISN
                  </label>
                  <input
                    value={formData.nisn || ""}
                    onChange={(e) => {
                      setFormData({ ...formData, nisn: e.target.value });
                      if (errors.nisn) setErrors(prev => ({ ...prev, nisn: "" }));
                    }}
                    className={`w-full bg-slate-50 border ${errors.nisn ? 'border-rose-500' : 'border-slate-200'} rounded-xl p-2.5 text-[10px] font-bold text-slate-800 outline-none focus:border-primary transition-all shadow-sm`}
                  />
                  {errors.nisn && <p className="text-[7px] text-rose-500 font-bold">{errors.nisn}</p>}
                </div>
                <div className="space-y-0.5 md:col-span-2">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    Nama Lengkap
                  </label>
                  <input
                    required
                    value={formData.name || ""}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) setErrors(prev => ({ ...prev, name: "" }));
                    }}
                    className={`w-full bg-slate-50 border ${errors.name ? 'border-rose-500' : 'border-slate-200'} rounded-xl p-2.5 text-[10px] font-bold text-slate-800 outline-none focus:border-primary transition-all shadow-sm`}
                  />
                  {errors.name && <p className="text-[7px] text-rose-500 font-bold">{errors.name}</p>}
                </div>
                <div className="space-y-0.5">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    Jenis Kelamin
                  </label>
                  <select
                    required
                    value={formData.gender || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        gender: e.target.value as any,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[10px] font-bold text-slate-800 outline-none focus:border-primary transition-all shadow-sm"
                  >
                    <option value="">-- Pilih --</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div className="space-y-0.5">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    Kelas
                  </label>
                  <input
                    required
                    value={formData.className || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, className: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[10px] font-bold text-slate-800 outline-none focus:border-primary transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    Nama Wali Kelas
                  </label>
                  <input
                    value={formData.homeroomTeacher || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        homeroomTeacher: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[10px] font-bold text-slate-800 outline-none focus:border-primary transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    Nomor Absen
                  </label>
                  <input
                    value={formData.attendanceNumber || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        attendanceNumber: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[10px] font-bold text-slate-800 outline-none focus:border-primary transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    Status Siswa
                  </label>
                  <select
                    value={formData.status || "Aktif"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as any,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[10px] font-bold text-slate-800 outline-none focus:border-primary transition-all shadow-sm appearance-none"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Non-Aktif">Non-Aktif</option>
                    <option value="Mutasi Keluar">Mutasi Keluar</option>
                  </select>
                </div>
                <div className="space-y-0.5">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    Nama Panggilan
                  </label>
                  <input
                    value={formData.nickname || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, nickname: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[10px] font-bold text-slate-800 outline-none focus:border-primary transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    Tempat Lahir
                  </label>
                  <input
                    value={formData.birthPlace || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, birthPlace: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[10px] font-bold text-slate-800 outline-none focus:border-primary transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    Tanggal Lahir
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, birthDate: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[10px] font-bold text-slate-800 outline-none focus:border-primary transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    Umur
                  </label>
                  <input
                    readOnly
                    value={
                      formData.birthDate
                        ? (() => {
                            const b = new Date(formData.birthDate);
                            const t = new Date();
                            let y = t.getFullYear() - b.getFullYear();
                            let m = t.getMonth() - b.getMonth();
                            let d = t.getDate() - b.getDate();
                            if (m < 0 || (m === 0 && d < 0)) {
                              y--;
                            }
                            const lastB = new Date(b);
                            lastB.setFullYear(b.getFullYear() + y);
                            const diff = Math.floor(
                              (t.getTime() - lastB.getTime()) /
                                (1000 * 60 * 60 * 24),
                            );
                            return `${y} tahun ${diff} hari`;
                          })()
                        : ""
                    }
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-[10px] font-bold text-slate-500 outline-none cursor-not-allowed shadow-inner"
                  />
                </div>
                <div className="space-y-0.5 md:col-span-2">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    Alamat Lengkap
                  </label>
                  <textarea
                    required
                    value={formData.address || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[10px] font-bold text-slate-800 outline-none focus:border-primary transition-all shadow-sm h-12"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    Domisili
                  </label>
                  <select
                    value={formData.domicile || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        domicile: e.target.value as any,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[10px] font-bold text-slate-800 outline-none focus:border-primary transition-all shadow-sm"
                  >
                    <option value="">-- Pilih --</option>
                    <option value="Dalam Kota">Dalam Kota</option>
                    <option value="Luar Kota">Luar Kota</option>
                  </select>
                </div>
                <div className="space-y-0.5">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    Status Anak
                  </label>
                  <select
                    value={formData.childStatus || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        childStatus: e.target.value as any,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[10px] font-bold text-slate-800 outline-none focus:border-primary transition-all shadow-sm"
                  >
                    <option value="">-- Pilih --</option>
                    <option value="Orang Tua Lengkap">Orang Tua Lengkap</option>
                    <option value="Yatim">Yatim</option>
                    <option value="Piatu">Piatu</option>
                    <option value="Yatim-Piatu">Yatim-Piatu</option>
                  </select>
                </div>
                <div className="space-y-0.5">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    Golongan Darah
                  </label>
                  <select
                    value={formData.bloodType || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, bloodType: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[10px] font-bold text-slate-800 outline-none focus:border-primary transition-all shadow-sm"
                  >
                    <option value="">-- Pilih --</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                    <option value="-">-</option>
                  </select>
                </div>
                <div className="space-y-0.5">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    No. WA / HP Siswa
                  </label>
                  <input
                    value={formData.phone || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[10px] font-bold text-slate-800 outline-none focus:border-primary transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* II. Potensi */}
          <div className="bg-white p-4 rounded-xl space-y-3 shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shadow-sm">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-800 tracking-tight uppercase">
                  II. Potensi & Minat
                </h3>
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                  Bakat, hobi, dan aspirasi masa depan
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="space-y-0.5">
                <label className="text-[8px] font-black text-indigo-600 uppercase tracking-[0.2em]">
                  Hobi
                </label>
                <input
                  value={formData.hobby || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, hobby: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[10px] font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>
              <div className="space-y-0.5">
                <label className="text-[8px] font-black text-indigo-600 uppercase tracking-[0.2em]">
                  Cita-cita
                </label>
                <input
                  value={formData.ambition || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, ambition: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[10px] font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>
              <div className="space-y-0.5">
                <label className="text-[8px] font-black text-indigo-600 uppercase tracking-[0.2em]">
                  Mapel Disukai
                </label>
                <input
                  value={formData.favoriteSubject || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      favoriteSubject: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[10px] font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>
              <div className="space-y-0.5">
                <label className="text-[8px] font-black text-indigo-600 uppercase tracking-[0.2em]">
                  Mapel Tidak Disukai
                </label>
                <input
                  value={formData.dislikedSubject || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dislikedSubject: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[10px] font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>
              <div className="space-y-0.5">
                <label className="text-[8px] font-black text-indigo-600 uppercase tracking-[0.2em]">
                  Cita-cita Sekolah Lanjut
                </label>
                <select
                  value={formData.furtherSchool || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      furtherSchool: e.target.value as any,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[10px] font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all shadow-sm"
                >
                  <option value="">-- Pilih --</option>
                  <option value="SMA">SMA</option>
                  <option value="SMK">SMK</option>
                  <option value="MAN">MAN</option>
                  <option value="Kursus">Kursus</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div className="space-y-0.5">
                <label className="text-[8px] font-black text-indigo-600 uppercase tracking-[0.2em]">
                  Teman Akrab di Sekolah
                </label>
                <input
                  value={formData.bestFriend || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, bestFriend: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[10px] font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>
              <div className="space-y-0.5">
                <label className="text-[8px] font-black text-indigo-600 uppercase tracking-[0.2em]">
                  Prestasi
                </label>
                <textarea
                  value={formData.achievements || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, achievements: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[10px] font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all shadow-sm h-12"
                  placeholder="Contoh: 1. Juara 1 Lomba Lukis, 2. Juara 3 Futsal"
                />
              </div>
              <div className="space-y-0.5">
                <label className="text-[8px] font-black text-indigo-600 uppercase tracking-[0.2em]">
                  Ekstrakurikuler
                </label>
                <textarea
                  value={formData.extracurricular || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      extracurricular: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[10px] font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all shadow-sm h-12"
                  placeholder="Contoh: Pramuka, PMR, Futsal"
                />
              </div>
            </div>
          </div>

          {/* III. Lingkungan & Keluarga */}
          <div className="bg-white p-4 rounded-xl space-y-3 shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shadow-sm">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-800 tracking-tight uppercase">
                  III. Lingkungan & Keluarga
                </h3>
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                  Latar belakang keluarga dan tempat tinggal
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="space-y-0.5 md:col-span-2">
                <label className="text-[8px] font-black text-emerald-600 uppercase tracking-[0.2em]">
                  Tinggal Bersama
                </label>
                <select
                  value={formData.livingWith || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      livingWith: e.target.value as any,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[10px] font-bold text-slate-800 outline-none focus:border-emerald-500 transition-all shadow-sm"
                >
                  <option value="">-- Pilih --</option>
                  <option value="Kedua Orang Tua">Kedua Orang Tua</option>
                  <option value="Ayah">Ayah</option>
                  <option value="Ibu">Ibu</option>
                  <option value="Saudara">Saudara</option>
                  <option value="Kakek/ Nenek">Kakek/ Nenek</option>
                  <option value="Orang Lain">Orang Lain</option>
                  <option value="Panti Asuhan">Panti Asuhan</option>
                </select>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl space-y-3 border border-slate-100 shadow-inner">
                <p className="text-[8px] font-black text-blue-600 uppercase tracking-[0.2em]">
                  Data Ayah
                </p>
                <div className="space-y-0.5">
                  <label className="text-[8px] uppercase text-slate-500 font-black tracking-widest">
                    Nama Ayah
                  </label>
                  <input
                    value={formData.fatherName || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, fatherName: e.target.value })
                    }
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[10px] font-bold text-slate-800 outline-none focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[8px] uppercase text-slate-500 font-black tracking-widest">
                    Pekerjaan Ayah
                  </label>
                  <input
                    value={formData.fatherJob || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, fatherJob: e.target.value })
                    }
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[10px] font-bold text-slate-800 outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl space-y-3 border border-slate-100 shadow-inner">
                <p className="text-[8px] font-black text-rose-500 uppercase tracking-[0.2em]">
                  Data Ibu
                </p>
                <div className="space-y-0.5">
                  <label className="text-[8px] uppercase text-slate-500 font-black tracking-widest">
                    Nama Ibu
                  </label>
                  <input
                    value={formData.motherName || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, motherName: e.target.value })
                    }
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[10px] font-bold text-slate-800 outline-none focus:border-rose-500 transition-all"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[8px] uppercase text-slate-500 font-black tracking-widest">
                    Pekerjaan Ibu
                  </label>
                  <input
                    value={formData.motherJob || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, motherJob: e.target.value })
                    }
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[10px] font-bold text-slate-800 outline-none focus:border-rose-500 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-0.5 md:col-span-2">
                <label className="text-[8px] font-black text-emerald-600 uppercase tracking-[0.2em]">
                  Alamat Orang Tua / Wali
                </label>
                <textarea
                  value={formData.parentAddress || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, parentAddress: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[10px] font-bold text-slate-800 outline-none focus:border-emerald-500 transition-all shadow-sm h-12"
                />
              </div>
              <div className="space-y-0.5 md:col-span-2">
                <label className="text-[8px] font-black text-emerald-600 uppercase tracking-[0.2em]">
                  Nomor Telepon / WA orang tua
                </label>
                <input
                  value={formData.parentPhoneWA || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, parentPhoneWA: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[10px] font-bold text-slate-800 outline-none focus:border-emerald-500 transition-all shadow-sm"
                />
              </div>
              <div className="p-4 bg-slate-50 rounded-xl space-y-3 border border-slate-100 shadow-inner md:col-span-2">
                <p className="text-[8px] font-black text-amber-600 uppercase tracking-[0.2em]">
                  Data Wali (Opsional)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <label className="text-[8px] uppercase text-slate-500 font-black tracking-widest">
                      Nama Wali
                    </label>
                    <input
                      value={formData.guardianName || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          guardianName: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[10px] font-bold text-slate-800 outline-none focus:border-amber-500 transition-all"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[8px] uppercase text-slate-500 font-black tracking-widest">
                      Pekerjaan Wali
                    </label>
                    <input
                      value={formData.guardianJob || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          guardianJob: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[10px] font-bold text-slate-800 outline-none focus:border-amber-500 transition-all"
                    />
                  </div>
                  <div className="space-y-0.5 md:col-span-2">
                    <label className="text-[8px] uppercase text-slate-500 font-black tracking-widest">
                      Alamat Wali
                    </label>
                    <input
                      value={formData.guardianAddress || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          guardianAddress: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[10px] font-bold text-slate-800 outline-none focus:border-amber-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <FormActions
            onSaveLocal={() => handleSave(false)}
            onSaveOnline={() => handleSave(true)}
            onCancel={() => setView(ViewMode.STUDENT_LIST)}
            onClose={() => setView(ViewMode.STUDENT_LIST)}
          />
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-left max-w-6xl mx-auto pb-16">
      {isLoading && <LoadingSpinner />}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none">
            Database{" "}
            <span className="text-primary font-light italic lowercase">
              Siswa
            </span>
          </h2>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-2">
            <Users className="w-3 h-3 text-primary" /> {students.length} Siswa
            Terdaftar
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Kelompok Tombol Excel */}
          <div className="flex items-center gap-2 bg-emerald-50 p-1.5 rounded-2xl border border-emerald-100 shadow-sm">
            <button
              onClick={onDownloadExcelTemplate}
              className="bg-white border border-emerald-200 text-emerald-600 px-4 py-2.5 rounded-xl font-black text-[9px] flex items-center gap-2 uppercase tracking-widest hover:bg-emerald-50 transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5" /> TEMPLATE EXCEL
            </button>
            <button
              onClick={onUploadExcel}
              className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-black text-[9px] flex items-center gap-2 uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md"
            >
              <Upload className="w-3.5 h-3.5" /> UPLOAD EXCEL
            </button>
            <button
              onClick={handleExportExcel}
              className="bg-white border border-emerald-200 text-emerald-600 px-4 py-2.5 rounded-xl font-black text-[9px] flex items-center gap-2 uppercase tracking-widest hover:bg-emerald-50 transition-all shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> UNDUH DATA
            </button>
          </div>

          {/* Tombol Google Form */}
          <button
            onClick={() => setShowGoogleFormGuide(true)}
            className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-black text-[9px] flex items-center gap-2 uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg"
          >
            <ExternalLink className="w-3.5 h-3.5" /> KONEKSI GOOGLE FORM
          </button>

          <input
            type="file"
            ref={csvInputRef}
            className="hidden"
            accept=".csv"
            onChange={handleImportCSV}
          />

          <div className="h-8 w-[1px] bg-slate-200 hidden md:block mx-1" />

          <button
            onClick={handleDeleteAll}
            disabled={students.length === 0}
            className="bg-rose-600 text-white px-4 py-2.5 rounded-xl font-black text-[9px] flex items-center gap-2 uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" /> HAPUS
          </button>

          <button
            onClick={() => {
              setEditingId(null);
              clearFormData({ studentCode: generateStudentCode() });
              setView(ViewMode.STUDENT_INPUT);
            }}
            className="bg-primary px-5 py-2.5 rounded-xl font-black text-[9px] flex items-center gap-2 whitespace-nowrap shadow-xl uppercase tracking-widest text-white hover:scale-105 transition-transform"
          >
            <Plus className="w-3.5 h-3.5" /> TAMBAH SISWA
          </button>

          <button
            onClick={() => setView(ViewMode.HOME)}
            className="bg-white text-slate-500 border border-slate-200 px-4 py-2.5 rounded-xl font-black text-[9px] flex items-center gap-2 uppercase tracking-widest hover:bg-slate-50 hover:text-slate-800 transition-all shadow-sm"
          >
            KEMBALI
          </button>
        </div>
      </div>

      <div className="px-4 flex gap-2 overflow-x-auto scroll-hide pb-2">
        <button
          onClick={() => setActiveSubTab("students")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${activeSubTab === "students" ? "bg-primary text-white shadow-lg shadow-primary/25 border-2 border-primary" : "bg-white border-2 border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400 shadow-sm"}`}
        >
          <Users className="w-3.5 h-3.5" /> Data Siswa
        </button>
        <button
          onClick={() => setActiveSubTab("homeroom")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${activeSubTab === "homeroom" ? "bg-teal-600 text-white shadow-lg shadow-teal-600/25 border-2 border-teal-600" : "bg-white border-2 border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400 shadow-sm"}`}
        >
          <UserPlus className="w-3.5 h-3.5" /> Wali Kelas
        </button>
        <button
          onClick={() => setActiveSubTab("groups")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${activeSubTab === "groups" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 border-2 border-indigo-600" : "bg-white border-2 border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400 shadow-sm"}`}
        >
          <Layers className="w-3.5 h-3.5" /> Kelompok Bimbingan
        </button>
        <button
          onClick={() => setActiveSubTab("counseling-groups")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${activeSubTab === "counseling-groups" ? "bg-purple-600 text-white shadow-lg shadow-purple-600/25 border-2 border-purple-600" : "bg-white border-2 border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400 shadow-sm"}`}
        >
          <Layers className="w-3.5 h-3.5" /> Kelompok Konseling
        </button>
        <button
          onClick={() => setActiveSubTab("analytics")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${activeSubTab === "analytics" ? "bg-amber-600 text-white shadow-lg shadow-amber-600/25 border-2 border-amber-600" : "bg-white border-2 border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400 shadow-sm"}`}
        >
          <TrendingUp className="w-3.5 h-3.5" /> Visualisasi Data
        </button>
        <button
          onClick={() => setShowStatsModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all whitespace-nowrap bg-white border-2 border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400 shadow-sm"
        >
          <PieChartIcon className="w-3.5 h-3.5" /> Statistik Ringkas
        </button>
      </div>

      {activeSubTab === "students" && (
        <>
          <div className="px-4 flex flex-col md:flex-row items-center gap-2">
            <div className="relative w-full md:w-72 shrink-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
              <input
                type="text"
                placeholder="Cari nama, NIS, NISN, atau ID Siswa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-[10px] text-slate-800 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all shadow-sm"
              />
            </div>
            <div className="relative w-full flex-1 min-w-[160px]">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-[9px] text-slate-800 appearance-none outline-none font-bold shadow-sm focus:border-primary uppercase tracking-widest"
              >
                <option value="Semua Kelas">Semua Kelas</option>
                {uniqueClasses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative w-full flex-1 min-w-[160px]">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-[9px] text-slate-800 appearance-none outline-none font-bold shadow-sm focus:border-primary uppercase tracking-widest"
              >
                <option value="Semua Status">Semua Status</option>
                <option value="Aktif">Aktif</option>
                <option value="Non-Aktif">Non-Aktif</option>
                <option value="Mutasi Keluar">Mutasi Keluar</option>
              </select>
            </div>
            <div className="relative w-full flex-1 min-w-[160px]">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
              <select
                value={domicileFilter}
                onChange={(e) => setDomicileFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-[9px] text-slate-800 appearance-none outline-none font-bold shadow-sm focus:border-primary uppercase tracking-widest"
              >
                <option value="Semua Domisili">Semua Domisili</option>
                <option value="Dalam Kota">Dalam Kota</option>
                <option value="Luar Kota">Luar Kota</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-xl shadow-slate-200/50 mx-4">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto pb-4 custom-scrollbar">
              {selectedStudentIds.length > 0 && (
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                    {selectedStudentIds.length} siswa terpilih
                  </span>
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center gap-2 px-3 py-1.5 bg-rose-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-colors shadow-sm"
                  >
                    <Trash2 className="w-3 h-3" /> Hapus Terpilih
                  </button>
                </div>
              )}
              <table className="w-full text-left table-auto">
                <thead>
                  <tr className="bg-slate-50 text-primary text-[8px] font-black uppercase tracking-widest border-b border-slate-100">
                    <th className="px-2 py-2 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-primary focus:ring-primary"
                      />
                    </th>
                    <th className="px-2 py-2 whitespace-nowrap">No.</th>
                    <th
                      className="px-2 py-2 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                      onClick={() => requestSort("studentCode")}
                    >
                      ID Siswa{" "}
                      {sortConfig?.key === "studentCode"
                        ? sortConfig.direction === "asc"
                          ? "↑"
                          : "↓"
                        : ""}
                    </th>
                    <th
                      className="px-2 py-2 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                      onClick={() => requestSort("name")}
                    >
                      Nama Siswa{" "}
                      {sortConfig?.key === "name"
                        ? sortConfig.direction === "asc"
                          ? "↑"
                          : "↓"
                        : ""}
                    </th>
                    <th
                      className="px-2 py-2 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                      onClick={() => requestSort("nisn")}
                    >
                      Identitas (NIS/NISN){" "}
                      {sortConfig?.key === "nisn"
                        ? sortConfig.direction === "asc"
                          ? "↑"
                          : "↓"
                        : ""}
                    </th>
                    <th
                      className="px-2 py-2 text-center cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                      onClick={() => requestSort("attendanceNumber")}
                    >
                      No. ABSEN{" "}
                      {sortConfig?.key === "attendanceNumber"
                        ? sortConfig.direction === "asc"
                          ? "↑"
                          : "↓"
                        : ""}
                    </th>
                    <th className="px-2 py-2 text-right whitespace-nowrap">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="p-8 text-center text-slate-500 italic text-xs"
                      >
                        Tidak ada data siswa.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s, idx) => (
                      <tr
                        key={s.id}
                        className="hover:bg-primary/5 transition-all group"
                      >
                        <td className="px-2 py-2 text-[10px] font-black text-slate-800 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(s.id)}
                            onChange={() => handleSelectStudent(s.id)}
                            className="rounded border-slate-300 text-primary focus:ring-primary"
                          />
                        </td>
                        <td className="px-2 py-2 text-[10px] font-black text-slate-800 whitespace-nowrap">
                          {idx + 1}
                        </td>
                        <td className="px-2 py-2 font-black text-primary text-[9px] tracking-widest whitespace-nowrap">
                          {s.studentCode || "-"}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm shrink-0">
                              {s.photo ? (
                                <img
                                  src={s.photo}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-full h-full p-1.5 text-slate-600" />
                              )}
                            </div>
                            <div>
                              <div className="text-[10px] font-black text-slate-800 uppercase tracking-tighter leading-none mb-1">
                                {s.name}
                              </div>
                              <div className="text-[8px] text-primary font-black uppercase tracking-widest">
                                {s.gender} | {s.className}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <div className="text-[9px] font-black text-primary">
                            NIS: {s.nis || "-"}
                          </div>
                          <div className="text-[9px] font-black text-slate-500 mt-0.5">
                            NISN: {s.nisn || "-"}
                          </div>
                        </td>
                        <td className="px-2 py-2 text-center whitespace-nowrap">
                          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                            {s.attendanceNumber || "-"}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-right space-x-1.5 whitespace-nowrap">
                          {s.parentPhoneWA && (
                            <button
                              onClick={() =>
                                setShowWaModal({
                                  show: true,
                                  number: s.parentPhoneWA || "",
                                })
                              }
                              className="p-1.5 bg-white border border-slate-200 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-all shadow-sm"
                              title="Lihat Nomor WA Orang Tua"
                            >
                              <Phone className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => handleCopyAkpdLink(s)}
                            className="p-1.5 bg-white border border-slate-200 hover:bg-blue-50 rounded-lg text-blue-600 transition-all shadow-sm"
                            title="Salin Link AKPD"
                          >
                            <Link className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onOpen360Profile(s.id)}
                            className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 border border-purple-500/50 rounded-lg text-white transition-all shadow-md inline-flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest"
                            title="Lihat Profil 360"
                          >
                            <Activity className="w-3 h-3" /> PROFIL 360
                          </button>
                          <button
                            onClick={() => onOpenPersonalBook(s.id)}
                            className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 border border-indigo-500/50 rounded-lg text-white transition-all shadow-md inline-flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest"
                            title="Lihat Buku Pribadi"
                          >
                            <BookOpen className="w-3 h-3" /> BUKU PRIBADI
                          </button>
                          <button
                            onClick={() => startEdit(s)}
                            className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-primary/10 rounded-lg text-primary transition-all shadow-sm inline-flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest"
                            title="Edit Data"
                          >
                            <Edit className="w-3 h-3" /> EDIT
                          </button>
                          <button
                            onClick={() => setStudentToDelete(s.id)}
                            className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-rose-50 rounded-lg text-rose-500 transition-all shadow-sm inline-flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest"
                            title="Hapus Data"
                          >
                            <Trash2 className="w-3 h-3" /> HAPUS
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-slate-500 italic text-xs">
                  Tidak ada data siswa.
                </div>
              ) : (
                filteredStudents.map((s, idx) => (
                  <div
                    key={s.id}
                    className="p-4 flex flex-col gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm shrink-0">
                          {s.photo ? (
                            <img
                              src={s.photo}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <User className="w-full h-full p-2.5 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[13px] font-black text-slate-800 uppercase tracking-tight leading-tight mb-0.5 truncate">
                            {s.name}
                          </div>
                          <div className="text-[10px] text-primary font-black uppercase tracking-widest flex items-center gap-1.5">
                            <span className="bg-primary/10 px-1.5 py-0.5 rounded">{s.studentCode || "-"}</span>
                            <span className="text-slate-300">|</span>
                            <span>{s.className}</span>
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <span className="text-[9px] font-black px-2 py-1 rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-600 whitespace-nowrap">
                          ABSEN: {s.attendanceNumber || "-"}
                        </span>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md border ${s.status === 'Non-Aktif' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                          {s.status || 'Aktif'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[8px] font-black uppercase tracking-widest mb-1">
                          NIS / NISN
                        </span>
                        <span className="font-bold text-slate-700 block truncate">
                          {s.nis || "-"} / {s.nisn || "-"}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block text-[8px] font-black uppercase tracking-widest mb-1">
                          Gender
                        </span>
                        <span className="font-bold text-slate-700 block truncate">
                          {s.gender || "-"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-1">
                      <button
                        onClick={() => onOpen360Profile(s.id)}
                        className="flex flex-col items-center justify-center gap-1 p-2 bg-purple-600 text-white rounded-xl shadow-md active:scale-95 transition-all"
                      >
                        <Activity className="w-4 h-4" />
                        <span className="text-[8px] font-black uppercase tracking-tighter">Profil 360</span>
                      </button>
                      <button
                        onClick={() => onOpenPersonalBook(s.id)}
                        className="flex flex-col items-center justify-center gap-1 p-2 bg-indigo-600 text-white rounded-xl shadow-md active:scale-95 transition-all"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span className="text-[8px] font-black uppercase tracking-tighter">Buku Pribadi</span>
                      </button>
                      <button
                        onClick={() => startEdit(s)}
                        className="flex flex-col items-center justify-center gap-1 p-2 bg-white border border-slate-200 text-primary rounded-xl shadow-sm active:scale-95 transition-all"
                      >
                        <Edit className="w-4 h-4" />
                        <span className="text-[8px] font-black uppercase tracking-tighter">Edit Data</span>
                      </button>
                      
                      <button
                        onClick={() => handleCopyAkpdLink(s)}
                        className="flex items-center justify-center gap-2 p-2 bg-white border border-slate-200 text-blue-600 rounded-xl shadow-sm active:scale-95 transition-all"
                      >
                        <Link className="w-3.5 h-3.5" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Link AKPD</span>
                      </button>
                      
                      {s.parentPhoneWA ? (
                        <button
                          onClick={() =>
                            setShowWaModal({
                              show: true,
                              number: s.parentPhoneWA || "",
                            })
                          }
                          className="flex items-center justify-center gap-2 p-2 bg-white border border-slate-200 text-emerald-600 rounded-xl shadow-sm active:scale-95 transition-all"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span className="text-[8px] font-black uppercase tracking-widest">WA Ortu</span>
                        </button>
                      ) : (
                        <div className="flex items-center justify-center gap-2 p-2 bg-slate-50 border border-slate-100 text-slate-300 rounded-xl cursor-not-allowed">
                          <Phone className="w-3.5 h-3.5" />
                          <span className="text-[8px] font-black uppercase tracking-widest">No WA</span>
                        </div>
                      )}

                      <button
                        onClick={() => setStudentToDelete(s.id)}
                        className="flex items-center justify-center gap-2 p-2 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl shadow-sm active:scale-95 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Hapus</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {activeSubTab === "homeroom" &&
        (() => {
          // Group students by class to find homeroom teachers
          let homeroomData = uniqueClasses.map((className) => {
            const studentsInClass = students.filter(
              (s) => s.className === className,
            );
            // Find the first non-empty homeroom teacher for this class
            const teacher =
              studentsInClass.find((s) => s.homeroomTeacher)?.homeroomTeacher ||
              "-";
            return { className, teacher, studentCount: studentsInClass.length };
          });

          if (homeroomSortConfig !== null) {
            homeroomData.sort((a, b) => {
              let aValue = a[homeroomSortConfig.key];
              let bValue = b[homeroomSortConfig.key];

              if (aValue < bValue) {
                return homeroomSortConfig.direction === "asc" ? -1 : 1;
              }
              if (aValue > bValue) {
                return homeroomSortConfig.direction === "asc" ? 1 : -1;
              }
              return 0;
            });
          }

          return (
            <div className="px-4 space-y-6 animate-fade-in">
              <div className="bg-white p-6 rounded-3xl space-y-6 shadow-xl shadow-slate-200/50 border border-slate-100 max-w-2xl mx-auto">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                  <div className="p-3 bg-teal-50 text-teal-600 rounded-xl border border-teal-100 shadow-sm">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase">
                      Pengaturan Wali Kelas
                    </h3>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                      Tetapkan wali kelas untuk setiap kelas
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-teal-600 uppercase tracking-[0.2em]">
                      Pilih Kelas
                    </label>
                    <select
                      value={homeroomClass}
                      onChange={(e) => setHomeroomClass(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 outline-none focus:border-teal-500 transition-all shadow-sm appearance-none"
                    >
                      <option value="">-- Pilih Kelas --</option>
                      {uniqueClasses.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-teal-600 uppercase tracking-[0.2em]">
                      Nama Wali Kelas
                    </label>
                    <input
                      type="text"
                      value={homeroomTeacherName}
                      onChange={(e) => setHomeroomTeacherName(e.target.value)}
                      placeholder="Masukkan Nama Wali Kelas..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 outline-none focus:border-teal-500 transition-all shadow-sm"
                    />
                  </div>

                  <button
                    onClick={handleSaveHomeroom}
                    className="w-full bg-teal-600 hover:bg-teal-700 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.3em] shadow-lg shadow-teal-600/25 transition-all active:scale-[0.98] text-white mt-4"
                  >
                    SIMPAN WALI KELAS
                  </button>
                </div>
              </div>

              {/* Tabel Preview Wali Kelas */}
              <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xl shadow-slate-200/50 max-w-4xl mx-auto">
                <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                  <div className="p-2 bg-teal-50 text-teal-600 rounded-lg border border-teal-100">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-800 uppercase tracking-tight">
                      Daftar Wali Kelas
                    </h4>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                      Berdasarkan data siswa saat ini
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left table-auto">
                    <thead>
                      <tr className="bg-slate-50 text-teal-600 text-[8px] font-black uppercase tracking-widest border-b border-slate-100">
                        <th
                          className="px-2 py-2 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                          onClick={() => requestHomeroomSort("className")}
                        >
                          Kelas{" "}
                          {homeroomSortConfig?.key === "className"
                            ? homeroomSortConfig.direction === "asc"
                              ? "↑"
                              : "↓"
                            : ""}
                        </th>
                        <th
                          className="px-2 py-2 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                          onClick={() => requestHomeroomSort("teacher")}
                        >
                          Nama Wali Kelas{" "}
                          {homeroomSortConfig?.key === "teacher"
                            ? homeroomSortConfig.direction === "asc"
                              ? "↑"
                              : "↓"
                            : ""}
                        </th>
                        <th
                          className="px-2 py-2 text-center cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                          onClick={() => requestHomeroomSort("studentCount")}
                        >
                          Jumlah Siswa{" "}
                          {homeroomSortConfig?.key === "studentCount"
                            ? homeroomSortConfig.direction === "asc"
                              ? "↑"
                              : "↓"
                            : ""}
                        </th>
                        <th className="px-2 py-2 text-right whitespace-nowrap">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {homeroomData.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="p-8 text-center text-slate-500 italic text-xs"
                          >
                            Belum ada data kelas.
                          </td>
                        </tr>
                      ) : (
                        homeroomData.map((data, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-teal-50/50 transition-all"
                          >
                            <td className="px-2 py-2 text-[10px] font-black text-slate-800 whitespace-nowrap">
                              {data.className}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap">
                              {data.teacher !== "-" ? (
                                <span className="text-[10px] font-bold text-slate-700">
                                  {data.teacher}
                                </span>
                              ) : (
                                <span className="text-[8px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 uppercase tracking-widest">
                                  Belum Diatur
                                </span>
                              )}
                            </td>
                            <td className="px-2 py-2 text-center text-[9px] font-black text-slate-500 bg-slate-50/50 whitespace-nowrap">
                              {data.studentCount} Siswa
                            </td>
                            <td className="px-2 py-2 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => {
                                  setHomeroomClass(data.className);
                                  setHomeroomTeacherName(
                                    data.teacher !== "-" ? data.teacher : "",
                                  );
                                  window.scrollTo({
                                    top: 0,
                                    behavior: "smooth",
                                  });
                                }}
                                className="p-1.5 bg-white border border-slate-200 hover:bg-teal-50 rounded-lg text-teal-600 transition-all shadow-sm"
                                title="Edit Wali Kelas"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => {
                                  if (
                                    confirm(
                                      `Hapus wali kelas untuk kelas ${data.className}?`,
                                    )
                                  ) {
                                    const studentsToUpdate = students
                                      .filter(
                                        (s) => s.className === data.className,
                                      )
                                      .map((s) => ({
                                        ...s,
                                        homeroomTeacher: "",
                                      }));
                                    if (onUpdateBatch) {
                                      onUpdateBatch(studentsToUpdate);
                                    }
                                  }
                                }}
                                className="p-1.5 bg-white border border-slate-200 hover:bg-rose-50 rounded-lg text-rose-500 transition-all shadow-sm"
                                title="Hapus Wali Kelas"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

      {activeSubTab === "counseling-groups" &&
        (() => {
          const filteredGroups =
            classFilter === "Semua Kelas"
              ? counselingGroups
              : counselingGroups.filter((g) => g.className === classFilter);
          const studentsInCurrentGroupType = new Set<string>();
          counselingGroups.forEach((g) =>
            g.studentIds.forEach((id) => studentsInCurrentGroupType.add(id)),
          );
          const relevantStudents =
            classFilter === "Semua Kelas"
              ? students
              : students.filter((s) => s.className === classFilter);
          let unassignedStudents = relevantStudents.filter(
            (s) => !studentsInCurrentGroupType.has(s.id),
          );

          if (sortConfig !== null) {
            unassignedStudents.sort((a, b) => {
              let aValue = a[sortConfig.key as keyof Student];
              let bValue = b[sortConfig.key as keyof Student];

              if (aValue === undefined || aValue === null) aValue = "";
              if (bValue === undefined || bValue === null) bValue = "";

              if (typeof aValue === "string" && typeof bValue === "string") {
                const aNum = Number(aValue);
                const bNum = Number(bValue);
                if (
                  !isNaN(aNum) &&
                  !isNaN(bNum) &&
                  aValue.trim() !== "" &&
                  bValue.trim() !== ""
                ) {
                  return sortConfig.direction === "asc"
                    ? aNum - bNum
                    : bNum - aNum;
                }
                return sortConfig.direction === "asc"
                  ? aValue.localeCompare(bValue)
                  : bValue.localeCompare(aValue);
              }

              if (aValue < bValue) {
                return sortConfig.direction === "asc" ? -1 : 1;
              }
              if (aValue > bValue) {
                return sortConfig.direction === "asc" ? 1 : -1;
              }
              return 0;
            });
          }

          return (
            <div className="px-4 space-y-8 animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-6">
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
                  Daftar Kelompok{" "}
                  <span className="text-purple-600">Konseling</span>
                </h3>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <div className="relative w-full sm:w-56">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-600" />
                    <select
                      value={classFilter}
                      onChange={(e) => setClassFilter(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 text-xs text-slate-800 appearance-none outline-none font-bold shadow-sm focus:border-purple-500"
                    >
                      <option value="Semua Kelas">Semua Kelas</option>
                      {uniqueClasses.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      clearGroupFormData();
                      setShowGroupModal(true);
                    }}
                    className="bg-purple-600 hover:bg-purple-700 px-6 py-3.5 rounded-2xl font-black text-[10px] flex items-center justify-center gap-2 shadow-xl shadow-purple-600/25 uppercase tracking-widest text-white transition-all"
                  >
                    <UserPlus className="w-4 h-4" /> BUAT KELOMPOK BARU
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredGroups.length === 0 ? (
                  <div className="col-span-full p-20 text-center border-2 border-dashed border-slate-200 rounded-[3rem] bg-slate-50">
                    <Layers className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500 font-black uppercase tracking-widest text-xs">
                      Tidak ada kelompok konseling untuk kelas ini.
                    </p>
                  </div>
                ) : (
                  filteredGroups.map((group) => (
                    <div
                      key={group.id}
                      className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-purple-200/50 transition-all relative group overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-[5rem] -mr-12 -mt-12 group-hover:bg-purple-100 transition-colors" />
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                          <div className="p-4 bg-purple-600 rounded-2xl text-white shadow-lg shadow-purple-600/30">
                            <Layers className="w-6 h-6" />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                startEditGroup(group, "counseling")
                              }
                              className="p-2.5 bg-white hover:bg-purple-50 rounded-xl text-purple-600 border border-slate-200 transition-all shadow-sm"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("Hapus?"))
                                  onDeleteCounselingGroup(group.id);
                              }}
                              className="p-2.5 bg-white hover:bg-rose-50 rounded-xl text-rose-500 border border-slate-200 transition-all shadow-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <h4 className="text-lg font-black text-slate-800 mb-1 uppercase tracking-tighter leading-none">
                          {group.name}
                        </h4>
                        <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-6 bg-purple-50 w-fit px-3 py-1 rounded-lg border border-purple-100">
                          Kelas: {group.className} • {group.studentIds.length}{" "}
                          Anggota
                        </p>

                        <div className="flex flex-wrap gap-1.5">
                          {group.studentIds.slice(0, 4).map((sid) => {
                            const s = students.find((st) => st.id === sid);
                            return s ? (
                              <span
                                key={sid}
                                className="text-[8px] font-bold bg-slate-50 text-slate-500 px-2 py-1 rounded-md border border-slate-100"
                              >
                                {s.name.split(" ")[0]}
                              </span>
                            ) : null;
                          })}
                          {group.studentIds.length > 4 && (
                            <span className="text-[8px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-md">
                              +{group.studentIds.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Unassigned Students Table */}
              <div className="mt-12 bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-xl shadow-slate-200/50">
                <div className="p-8 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                  <div className="p-4 bg-rose-50 text-rose-500 rounded-2xl border border-rose-100 shadow-sm">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                      Siswa Belum Mendapat Kelompok
                    </h4>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                      {classFilter === "Semua Kelas"
                        ? "Seluruh Kelas"
                        : `Kelas ${classFilter}`}{" "}
                      • {unassignedStudents.length} Siswa
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left table-auto">
                    <thead>
                      <tr className="bg-slate-50 text-rose-500 text-[9px] font-black uppercase tracking-widest border-b border-slate-100">
                        <th
                          className="px-3 py-2 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                          onClick={() => requestSort("attendanceNumber")}
                        >
                          No. Absen{" "}
                          {sortConfig?.key === "attendanceNumber"
                            ? sortConfig.direction === "asc"
                              ? "↑"
                              : "↓"
                            : ""}
                        </th>
                        <th
                          className="px-3 py-2 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                          onClick={() => requestSort("name")}
                        >
                          Nama Siswa{" "}
                          {sortConfig?.key === "name"
                            ? sortConfig.direction === "asc"
                              ? "↑"
                              : "↓"
                            : ""}
                        </th>
                        <th
                          className="px-3 py-2 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                          onClick={() => requestSort("className")}
                        >
                          Kelas{" "}
                          {sortConfig?.key === "className"
                            ? sortConfig.direction === "asc"
                              ? "↑"
                              : "↓"
                            : ""}
                        </th>
                        <th
                          className="px-3 py-2 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                          onClick={() => requestSort("gender")}
                        >
                          Jenis Kelamin{" "}
                          {sortConfig?.key === "gender"
                            ? sortConfig.direction === "asc"
                              ? "↑"
                              : "↓"
                            : ""}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {unassignedStudents.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="p-16 text-center text-slate-500 italic text-xs"
                          >
                            Semua siswa di kelas ini sudah masuk kelompok.
                          </td>
                        </tr>
                      ) : (
                        unassignedStudents.map((s) => (
                          <tr
                            key={s.id}
                            className="hover:bg-rose-50/50 transition-all"
                          >
                            <td className="px-3 py-2 text-[10px] font-black text-slate-500 whitespace-nowrap">
                              {s.attendanceNumber || "-"}
                            </td>
                            <td className="px-3 py-2 text-[10px] font-black text-slate-800 uppercase tracking-tight whitespace-nowrap">
                              {s.name}
                            </td>
                            <td className="px-3 py-2 text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                              {s.className}
                            </td>
                            <td className="px-3 py-2 text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                              {s.gender}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

      {activeSubTab === "groups" &&
        (() => {
          const filteredGroups =
            classFilter === "Semua Kelas"
              ? groups
              : groups.filter((g) => g.className === classFilter);

          // Calculate unassigned students for the selected class (or all classes if 'Semua Kelas')
          const studentsInCurrentGroupType = new Set<string>();
          groups.forEach((g) =>
            g.studentIds.forEach((id) => studentsInCurrentGroupType.add(id)),
          );

          const relevantStudents =
            classFilter === "Semua Kelas"
              ? students
              : students.filter((s) => s.className === classFilter);
          let unassignedStudents = relevantStudents.filter(
            (s) => !studentsInCurrentGroupType.has(s.id),
          );

          if (sortConfig !== null) {
            unassignedStudents.sort((a, b) => {
              let aValue = a[sortConfig.key as keyof Student];
              let bValue = b[sortConfig.key as keyof Student];

              if (aValue === undefined || aValue === null) aValue = "";
              if (bValue === undefined || bValue === null) bValue = "";

              if (typeof aValue === "string" && typeof bValue === "string") {
                const aNum = Number(aValue);
                const bNum = Number(bValue);
                if (
                  !isNaN(aNum) &&
                  !isNaN(bNum) &&
                  aValue.trim() !== "" &&
                  bValue.trim() !== ""
                ) {
                  return sortConfig.direction === "asc"
                    ? aNum - bNum
                    : bNum - aNum;
                }
                return sortConfig.direction === "asc"
                  ? aValue.localeCompare(bValue)
                  : bValue.localeCompare(aValue);
              }

              if (aValue < bValue) {
                return sortConfig.direction === "asc" ? -1 : 1;
              }
              if (aValue > bValue) {
                return sortConfig.direction === "asc" ? 1 : -1;
              }
              return 0;
            });
          }

          return (
            <div className="px-4 space-y-8 animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-6">
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
                  Daftar Kelompok{" "}
                  <span className="text-indigo-600">Bimbingan</span>
                </h3>

                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <div className="relative w-full sm:w-56">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-600" />
                    <select
                      value={classFilter}
                      onChange={(e) => setClassFilter(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 text-xs text-slate-800 appearance-none outline-none font-bold shadow-sm focus:border-indigo-500"
                    >
                      <option value="Semua Kelas">Semua Kelas</option>
                      {uniqueClasses.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      clearGroupFormData();
                      setShowGroupModal(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3.5 rounded-2xl font-black text-[10px] flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/25 uppercase tracking-widest text-white transition-all"
                  >
                    <UserPlus className="w-4 h-4" /> BUAT KELOMPOK BARU
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredGroups.length === 0 ? (
                  <div className="col-span-full p-20 text-center border-2 border-dashed border-slate-200 rounded-[3rem] bg-slate-50">
                    <Layers className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500 font-black uppercase tracking-widest text-xs">
                      Tidak ada kelompok bimbingan untuk kelas ini.
                    </p>
                  </div>
                ) : (
                  filteredGroups.map((group) => (
                    <div
                      key={group.id}
                      className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-indigo-200/50 transition-all relative group overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[5rem] -mr-12 -mt-12 group-hover:bg-indigo-100 transition-colors" />
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                          <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-600/30">
                            <Layers className="w-6 h-6" />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEditGroup(group, "guidance")}
                              className="p-2.5 bg-white hover:bg-indigo-50 rounded-xl text-indigo-600 border border-slate-200 transition-all shadow-sm"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("Hapus?")) onDeleteGroup(group.id);
                              }}
                              className="p-2.5 bg-white hover:bg-rose-50 rounded-xl text-rose-500 border border-slate-200 transition-all shadow-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <h4 className="text-lg font-black text-slate-800 mb-1 uppercase tracking-tighter leading-none">
                          {group.name}
                        </h4>
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-6 bg-indigo-50 w-fit px-3 py-1 rounded-lg border border-indigo-100">
                          Kelas: {group.className} • {group.studentIds.length}{" "}
                          Anggota
                        </p>

                        <div className="flex flex-wrap gap-1.5">
                          {group.studentIds.slice(0, 4).map((sid) => {
                            const s = students.find((st) => st.id === sid);
                            return s ? (
                              <span
                                key={sid}
                                className="text-[8px] font-bold bg-slate-50 text-slate-500 px-2 py-1 rounded-md border border-slate-100"
                              >
                                {s.name.split(" ")[0]}
                              </span>
                            ) : null;
                          })}
                          {group.studentIds.length > 4 && (
                            <span className="text-[8px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-md">
                              +{group.studentIds.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Unassigned Students Table */}
              <div className="mt-12 bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-xl shadow-slate-200/50">
                <div className="p-8 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                  <div className="p-4 bg-rose-50 text-rose-500 rounded-2xl border border-rose-100 shadow-sm">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                      Siswa Belum Mendapat Kelompok
                    </h4>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                      {classFilter === "Semua Kelas"
                        ? "Seluruh Kelas"
                        : `Kelas ${classFilter}`}{" "}
                      • {unassignedStudents.length} Siswa
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left table-auto">
                    <thead>
                      <tr className="bg-slate-50 text-rose-500 text-[9px] font-black uppercase tracking-widest border-b border-slate-100">
                        <th
                          className="px-3 py-2 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                          onClick={() => requestSort("attendanceNumber")}
                        >
                          No. Absen{" "}
                          {sortConfig?.key === "attendanceNumber"
                            ? sortConfig.direction === "asc"
                              ? "↑"
                              : "↓"
                            : ""}
                        </th>
                        <th
                          className="px-3 py-2 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                          onClick={() => requestSort("name")}
                        >
                          Nama Siswa{" "}
                          {sortConfig?.key === "name"
                            ? sortConfig.direction === "asc"
                              ? "↑"
                              : "↓"
                            : ""}
                        </th>
                        <th
                          className="px-3 py-2 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                          onClick={() => requestSort("className")}
                        >
                          Kelas{" "}
                          {sortConfig?.key === "className"
                            ? sortConfig.direction === "asc"
                              ? "↑"
                              : "↓"
                            : ""}
                        </th>
                        <th
                          className="px-3 py-2 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                          onClick={() => requestSort("gender")}
                        >
                          Jenis Kelamin{" "}
                          {sortConfig?.key === "gender"
                            ? sortConfig.direction === "asc"
                              ? "↑"
                              : "↓"
                            : ""}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {unassignedStudents.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="p-16 text-center text-slate-500 italic text-xs"
                          >
                            Semua siswa di kelas ini sudah masuk kelompok.
                          </td>
                        </tr>
                      ) : (
                        unassignedStudents.map((s) => (
                          <tr
                            key={s.id}
                            className="hover:bg-rose-50/50 transition-all"
                          >
                            <td className="px-3 py-2 text-[10px] font-black text-slate-500 whitespace-nowrap">
                              {s.attendanceNumber || "-"}
                            </td>
                            <td className="px-3 py-2 text-[10px] font-black text-slate-800 uppercase tracking-tight whitespace-nowrap">
                              {s.name}
                            </td>
                            <td className="px-3 py-2 text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                              {s.className}
                            </td>
                            <td className="px-3 py-2 text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                              {s.gender}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

      {activeSubTab === "analytics" && (
        <div className="px-4 space-y-10 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                label: "Total Siswa",
                value: students.length,
                icon: Users,
                color: "blue",
              },
              {
                label: "Laki-laki",
                value: students.filter((s) => {
                  const g = s.gender?.trim().toLowerCase() || "";
                  return (
                    g === "l" ||
                    g === "laki-laki" ||
                    g === "laki - laki" ||
                    g.includes("laki")
                  );
                }).length,
                icon: User,
                color: "indigo",
              },
              {
                label: "Perempuan",
                value: students.filter((s) => {
                  const g = s.gender?.trim().toLowerCase() || "";
                  return (
                    g === "p" || g === "perempuan" || g.includes("perempuan")
                  );
                }).length,
                icon: User,
                color: "rose",
              },
              {
                label: "Total Kelas",
                value: uniqueClasses.length,
                icon: Layers,
                color: "teal",
              },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center gap-6 group hover:scale-[1.02] transition-all"
              >
                <div
                  className={`p-5 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 border border-${stat.color}-100 shadow-sm group-hover:bg-${stat.color}-600 group-hover:text-slate-800 transition-all`}
                >
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-black text-slate-800 tracking-tighter">
                    {stat.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Class Distribution */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-8">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-6">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                  <Layers className="w-4 h-4" />
                </div>
                <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                  Distribusi Per Kelas
                </h4>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classDistributionData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f1f5f9"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      fontWeight={800}
                      dy={10}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      fontWeight={800}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #f1f5f9",
                        borderRadius: "16px",
                        fontSize: "12px",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
                        color: "#1e293b",
                      }}
                      itemStyle={{ color: "#1e293b", fontWeight: 800 }}
                    />
                    <Bar
                      dataKey="value"
                      fill="#3b82f6"
                      radius={[10, 10, 0, 0]}
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gender Distribution */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-8">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-6">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                  <Users className="w-4 h-4" />
                </div>
                <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                  Distribusi Jenis Kelamin
                </h4>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {["#3b82f6", "#ec4899"].map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #f1f5f9",
                        borderRadius: "16px",
                        fontSize: "12px",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
                        color: "#1e293b",
                      }}
                      itemStyle={{ color: "#1e293b", fontWeight: 800 }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      wrapperStyle={{
                        fontWeight: 800,
                        fontSize: "10px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Status Distribution */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-8">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-6">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                  <Activity className="w-4 h-4" />
                </div>
                <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                  Status Kekeluargaan
                </h4>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {[
                        "#22c55e",
                        "#eab308",
                        "#f97316",
                        "#ef4444",
                        "#6366f1",
                      ].map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #f1f5f9",
                        borderRadius: "16px",
                        fontSize: "12px",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
                        color: "#1e293b",
                      }}
                      itemStyle={{ color: "#1e293b", fontWeight: 800 }}
                    />
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      wrapperStyle={{
                        fontSize: "10px",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Domicile Distribution */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-8">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-6">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                  <MapPin className="w-4 h-4" />
                </div>
                <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                  Distribusi Domisili
                </h4>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={domicileDistributionData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f1f5f9"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      fontWeight={800}
                      dy={10}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      fontWeight={800}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #f1f5f9",
                        borderRadius: "16px",
                        fontSize: "12px",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
                        color: "#1e293b",
                      }}
                      itemStyle={{ color: "#1e293b", fontWeight: 800 }}
                    />
                    <Bar
                      dataKey="value"
                      fill="#f59e0b"
                      radius={[10, 10, 0, 0]}
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Statistik Ringkas */}
      {showStatsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[3rem] border border-slate-100 w-full max-w-4xl shadow-2xl overflow-hidden">
            <div className="p-10 space-y-8">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-lg">
                    <PieChartIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
                      Statistik{" "}
                      <span className="text-blue-600 italic">Ringkas</span>
                    </h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                      Gambaran umum data siswa
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowStatsModal(false)}
                  className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <StatisticsView students={students} />

              <div className="flex justify-end">
                <button
                  onClick={() => setShowStatsModal(false)}
                  className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl"
                >
                  TUTUP
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Panduan Koneksi Google Form */}
      {showGoogleFormGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[3rem] border border-slate-100 w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-10 space-y-8 overflow-y-auto flex-1">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-lg">
                    <ExternalLink className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
                      Koneksi Google Form
                    </h3>
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1">
                      Langkah praktis untuk Bapak/Ibu Guru
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGoogleFormGuide(false)}
                  className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {[
                  {
                    title: "Buka Google Form",
                    desc: "Buka formulir pendaftaran atau survei yang sudah Anda buat di Google Forms.",
                  },
                  {
                    title: "Klik Tombol 'Kirim'",
                    desc: "Klik tombol ungu bertuliskan 'Kirim' atau 'Send' di pojok kanan atas.",
                  },
                  {
                    title: "Pilih Ikon Tautan",
                    desc: "Pilih ikon berbentuk rantai/tautan di bagian tengah jendela yang muncul.",
                  },
                  {
                    title: "Salin Tautan",
                    desc: "Klik tombol 'Salin' atau 'Copy'. Anda juga bisa mencentang 'Perpendek URL' agar lebih rapi.",
                  },
                  {
                    title: "Tempel di Pengaturan",
                    desc: "Kembali ke aplikasi ini, buka menu 'Pengaturan', lalu tempel (Paste) di kolom 'Link Google Form'.",
                  },
                ].map((step, i) => (
                  <div
                    key={i}
                    className="flex gap-6 p-5 bg-slate-50 rounded-3xl border border-slate-100"
                  >
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-blue-600 font-black text-xs shadow-sm shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 uppercase text-xs tracking-wider mb-1">
                        {step.title}
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setView(ViewMode.SETTINGS);
                    setShowGoogleFormGuide(false);
                  }}
                  className="flex-1 bg-blue-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all"
                >
                  BUKA PENGATURAN SEKARANG
                </button>
                <button
                  onClick={() => setShowGoogleFormGuide(false)}
                  className="flex-1 bg-slate-100 text-slate-600 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  TUTUP
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Panduan Pengisian Modal */}
      {showFillGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[3rem] border border-slate-100 w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-10 space-y-8 overflow-y-auto flex-1">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-lg">
                    <HelpCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
                      Panduan Pengisian
                    </h3>
                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1">
                      Langkah-langkah pendaftaran siswa
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFillGuide(false)}
                  className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {[
                  {
                    title: "Siapkan Data",
                    desc: "Pastikan Anda memiliki NIS, NISN, dan data pribadi siswa yang valid.",
                  },
                  {
                    title: "Foto Profil",
                    desc: "Gunakan foto formal dengan latar belakang polos untuk hasil terbaik.",
                  },
                  {
                    title: "Gunakan Excel",
                    desc: "Gunakan fitur 'Import Excel' jika ingin memasukkan data dalam jumlah banyak sekaligus.",
                  },
                  {
                    title: "ID Siswa",
                    desc: "Sistem akan otomatis menghasilkan ID Siswa unik untuk setiap pendaftaran.",
                  },
                ].map((step, i) => (
                  <div
                    key={i}
                    className="flex gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100"
                  >
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-indigo-600 font-black text-xs shadow-sm shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 uppercase text-xs tracking-wider mb-1">
                        {step.title}
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowFillGuide(false)}
                className="w-full bg-indigo-600 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl text-white hover:bg-indigo-700 transition-all"
              >
                MENGERTI, LANJUTKAN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Buat/Edit Kelompok */}
      {showGroupModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[3rem] border border-slate-100 w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-10 overflow-y-auto space-y-8 flex-1">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 shadow-sm">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
                      {groupFormData.id ? "Edit" : "Buat"}{" "}
                      <span className="text-blue-600 italic">Kelompok</span>
                    </h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                      Kelola kelompok bimbingan siswa
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGroupModal(false)}
                  className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSaveGroup} className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em]">
                    Nama Kelompok
                  </label>
                  <input
                    required
                    value={groupFormData.name || ""}
                    onChange={(e) =>
                      setGroupFormData({
                        ...groupFormData,
                        name: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 transition-all"
                    placeholder="Contoh: Kelompok Belajar A..."
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em]">
                    Pilih Kelas
                  </label>
                  <select
                    required
                    value={groupFormData.className || ""}
                    onChange={(e) =>
                      setGroupFormData({
                        ...groupFormData,
                        className: e.target.value,
                        studentIds: [],
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 transition-all"
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {uniqueClasses.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {groupFormData.className &&
                  (() => {
                    const classStudents = students.filter(
                      (s) => s.className === groupFormData.className,
                    );
                    // Find students who are already in ANY group
                    const studentsInAnyGroup = new Set<string>();
                    const groupsToScan =
                      activeSubTab === "counseling-groups"
                        ? counselingGroups
                        : groups;
                    groupsToScan.forEach((g) => {
                      if (g.id !== groupFormData.id) {
                        // Exclude current group being edited
                        g.studentIds.forEach((id) =>
                          studentsInAnyGroup.add(id),
                        );
                      }
                    });

                    const unassignedStudents = classStudents.filter(
                      (s) =>
                        !studentsInAnyGroup.has(s.id) &&
                        !(groupFormData.studentIds || []).includes(s.id),
                    );
                    const assignedCount =
                      classStudents.length -
                      unassignedStudents.length -
                      (groupFormData.studentIds || []).length;
                    const currentGroupCount = (groupFormData.studentIds || [])
                      .length;

                    const pieData = [
                      {
                        name: "Sudah Punya Kelompok",
                        value: assignedCount,
                        color: "#10b981",
                      }, // Emerald
                      {
                        name: "Di Kelompok Ini",
                        value: currentGroupCount,
                        color: "#6366f1",
                      }, // Indigo
                      {
                        name: "Belum Punya Kelompok",
                        value: unassignedStudents.length,
                        color: "#f43f5e",
                      }, // Rose
                    ].filter((d) => d.value > 0);

                    return (
                      <div className="space-y-6 animate-fade-in">
                        {/* Infografis */}
                        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 shadow-inner flex flex-col md:flex-row items-center gap-6">
                          <div className="w-32 h-32 shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={pieData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={25}
                                  outerRadius={40}
                                  paddingAngle={5}
                                  dataKey="value"
                                >
                                  {pieData.map((entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={entry.color}
                                    />
                                  ))}
                                </Pie>
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: "#fff",
                                    border: "1px solid #f1f5f9",
                                    borderRadius: "12px",
                                    fontSize: "10px",
                                    color: "#1e293b",
                                  }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="flex-1 space-y-3 w-full">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">
                              Status Kelompok Kelas {groupFormData.className}
                            </h4>
                            <div className="space-y-2">
                              {pieData.map((d, i) => (
                                <div
                                  key={i}
                                  className="flex justify-between items-center text-xs"
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: d.color }}
                                    ></div>
                                    <span className="text-slate-600 font-medium">
                                      {d.name}
                                    </span>
                                  </div>
                                  <span className="font-black text-slate-800">
                                    {d.value} Siswa
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Pilih Anggota */}
                          <div className="space-y-3">
                            <label className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em]">
                              Pilih Anggota Siswa
                            </label>
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 max-h-80 overflow-y-auto space-y-1 shadow-inner">
                              {classStudents.map((student) => {
                                const isAssignedElsewhere =
                                  studentsInAnyGroup.has(student.id);
                                return (
                                  <label
                                    key={student.id}
                                    className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-colors border border-transparent ${isAssignedElsewhere ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-50 hover:border-blue-100"}`}
                                  >
                                    <input
                                      type="checkbox"
                                      disabled={isAssignedElsewhere}
                                      checked={
                                        groupFormData.studentIds?.includes(
                                          student.id,
                                        ) || false
                                      }
                                      onChange={(e) => {
                                        const currentIds =
                                          groupFormData.studentIds || [];
                                        if (e.target.checked) {
                                          setGroupFormData({
                                            ...groupFormData,
                                            studentIds: [
                                              ...currentIds,
                                              student.id,
                                            ],
                                          });
                                        } else {
                                          setGroupFormData({
                                            ...groupFormData,
                                            studentIds: currentIds.filter(
                                              (id) => id !== student.id,
                                            ),
                                          });
                                        }
                                      }}
                                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 bg-white disabled:opacity-50"
                                    />
                                    <div className="flex-1 flex items-center justify-between">
                                      <span className="text-xs font-bold text-slate-700">
                                        {student.name}
                                      </span>
                                      <span className="text-[10px] font-black text-slate-500 bg-white border border-slate-100 px-2 py-0.5 rounded-md">
                                        No. {student.attendanceNumber || "-"}
                                      </span>
                                    </div>
                                  </label>
                                );
                              })}
                              {classStudents.length === 0 && (
                                <p className="text-xs text-slate-500 italic text-center py-4">
                                  Tidak ada siswa di kelas ini.
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Belum Masuk Kelompok */}
                          <div className="space-y-3">
                            <label className="text-[9px] font-black text-rose-500 uppercase tracking-[0.2em]">
                              Siswa Belum Masuk Kelompok
                            </label>
                            <div className="bg-rose-50/30 border border-rose-100 rounded-2xl p-4 max-h-80 overflow-y-auto space-y-2 shadow-inner">
                              {unassignedStudents.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full py-10 text-center opacity-50">
                                  <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
                                  <p className="text-xs text-slate-500 italic">
                                    Semua siswa di kelas ini sudah masuk
                                    kelompok.
                                  </p>
                                </div>
                              ) : (
                                unassignedStudents.map((student) => (
                                  <div
                                    key={student.id}
                                    className="flex items-center justify-between p-3 bg-white rounded-xl border border-rose-100"
                                  >
                                    <span className="text-xs font-bold text-slate-600">
                                      {student.name}
                                    </span>
                                    <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                                      No. {student.attendanceNumber || "-"}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="pt-6">
                          <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98] text-white"
                          >
                            {groupFormData.id
                              ? "SIMPAN PERUBAHAN"
                              : "BUAT KELOMPOK"}
                          </button>
                        </div>
                      </div>
                    );
                  })()}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Student Modal */}
      {studentToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2rem] border border-slate-100 w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-2 text-rose-500">
                <div className="p-3 bg-rose-50 rounded-2xl">
                  <Trash2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-widest text-slate-800">
                  Hapus Data Siswa
                </h3>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed font-medium">
                Apakah Anda yakin ingin menghapus data siswa ini? Tindakan ini{" "}
                <strong className="text-rose-600">
                  tidak dapat dibatalkan
                </strong>
                .
              </p>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setStudentToDelete(null)}
                className="px-6 py-3 text-xs font-black text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors uppercase tracking-widest"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDelete(studentToDelete);
                  setStudentToDelete(null);
                }}
                className="px-6 py-3 text-xs font-black text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition-colors shadow-lg shadow-rose-500/30 uppercase tracking-widest"
              >
                Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2rem] border border-slate-100 w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-2 text-rose-500">
                <div className="p-3 bg-rose-50 rounded-2xl">
                  <Trash2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-widest text-slate-800">
                  Hapus Data Siswa
                </h3>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed font-medium">
                Pilih kelas yang ingin dihapus datanya. Tindakan ini{" "}
                <strong className="text-rose-600">
                  tidak dapat dibatalkan
                </strong>
                .
              </p>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Pilih Kelas
                </label>
                <select
                  value={deleteClassFilter}
                  onChange={(e) => setDeleteClassFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs text-slate-800 appearance-none outline-none font-bold shadow-sm focus:border-rose-500 transition-all"
                >
                  <option value="Semua Kelas">
                    Semua Kelas (Hapus Seluruh Data)
                  </option>
                  {uniqueClasses.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-white border border-slate-200 text-slate-500 font-black py-3 rounded-xl text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-rose-600 text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-widest hover:bg-rose-700 transition-colors shadow-lg shadow-rose-600/20"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
      {showWaModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center">
            <h3 className="text-lg font-black text-slate-800 mb-4 uppercase tracking-tight">
              Nomor WA Orang Tua
            </h3>
            <p className="text-3xl font-mono text-emerald-600 mb-8 tracking-widest font-black">
              {showWaModal.number}
            </p>
            <div className="flex gap-2">
              <a
                href={`https://wa.me/${formatWhatsAppNumber(showWaModal.number)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-4 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                KIRIM PESAN
              </a>
              <button
                onClick={() => setShowWaModal({ show: false, number: "" })}
                className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-xl hover:bg-slate-200 transition-all text-[10px] uppercase tracking-widest"
              >
                TUTUP
              </button>
            </div>
          </div>
        </div>
      )}

      {showCsvModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2rem] border border-slate-100 w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2 text-emerald-600">
                <div className="p-3 bg-emerald-50 rounded-2xl">
                  <FileSpreadsheet className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-widest text-slate-800">
                    Import Data CSV
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                    Petakan Kolom CSV ke Data Siswa
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCsvModal(false)}
                className="p-2 text-slate-500 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 mb-6">
                <p className="text-xs text-emerald-800 font-medium">
                  Ditemukan{" "}
                  <strong className="text-emerald-600 font-black">
                    {csvData.length}
                  </strong>{" "}
                  baris data. Silakan cocokkan kolom dari file CSV Anda dengan
                  kolom di sistem.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  { key: "studentCode", label: "Kode Siswa" },
                  { key: "nis", label: "NIS" },
                  { key: "nisn", label: "NISN" },
                  { key: "name", label: "Nama Lengkap" },
                  { key: "nickname", label: "Nama Panggilan" },
                  { key: "gender", label: "Jenis Kelamin (L/P)" },
                  { key: "className", label: "Kelas" },
                  { key: "attendanceNumber", label: "No. Absen" },
                  { key: "birthPlace", label: "Tempat Lahir" },
                  { key: "birthDate", label: "Tanggal Lahir" },
                  { key: "address", label: "Alamat" },
                  { key: "domicile", label: "Domisili" },
                  { key: "phone", label: "No. HP" },
                  { key: "homeroomTeacher", label: "Wali Kelas" },
                  { key: "childStatus", label: "Status Anak" },
                  { key: "favoriteSubject", label: "Mapel Disukai" },
                  { key: "dislikedSubject", label: "Mapel Tidak Disukai" },
                  { key: "bloodType", label: "Golongan Darah" },
                ].map((field) => (
                  <div key={field.key} className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      {field.label}
                    </label>
                    <select
                      value={columnMapping[field.key] || ""}
                      onChange={(e) =>
                        setColumnMapping({
                          ...columnMapping,
                          [field.key]: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs text-slate-800 outline-none focus:border-emerald-500 transition-all font-bold"
                    >
                      <option value="">-- Abaikan --</option>
                      {csvHeaders.map((header, idx) => (
                        <option key={idx} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => setShowCsvModal(false)}
                className="flex-1 bg-white border border-slate-200 text-slate-500 font-black py-4 rounded-xl text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleProcessCSV}
                className="flex-1 bg-emerald-600 text-white font-black py-4 rounded-xl text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" /> Import {csvData.length} Siswa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
