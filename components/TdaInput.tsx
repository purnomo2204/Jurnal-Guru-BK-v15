import React, { useState, useMemo } from 'react';
import { ViewMode, Student, TDA, TeacherData } from '../types';
import { 
  ArrowLeft, Plus, Trash2, Edit, Download, Upload, FileSpreadsheet, 
  FileText, Search, Filter, UserCheck, BookOpen, Brain, Heart, 
  Target, Briefcase, GraduationCap, Users, Calendar, Clock, X, CheckCircle2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } from 'docx';

interface TdaInputProps {
  view: ViewMode;
  setView: (v: ViewMode) => void;
  students: Student[];
  tdaRecords: TDA[];
  onAdd: (record: TDA) => void;
  onUpdate: (record: TDA) => void;
  onDelete: (id: string) => void;
  teacherData: TeacherData;
}

const TdaInput: React.FC<TdaInputProps> = ({ 
  view, setView, students, tdaRecords, onAdd, onUpdate, onDelete, teacherData 
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [inputClassFilter, setInputClassFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<Partial<TDA>>({
    date: new Date().toISOString().split('T')[0],
    studentId: '',
    className: '',
    studentName: '',
    homeroomTeacher: '',
    learningStyle: '',
    personalityType: '',
    multipleIntelligences: '',
    talentInterest: '',
    careerKey: ''
  });

  const availableClasses = useMemo(() => {
    return Array.from(new Set(students.map(s => s.className))).sort();
  }, [students]);

  const filteredStudentsForInput = useMemo(() => {
    if (!inputClassFilter) return [];
    return students.filter(s => s.className === inputClassFilter);
  }, [students, inputClassFilter]);

  const filteredTdaRecords = useMemo(() => {
    return tdaRecords.filter(r => 
      r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.className.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [tdaRecords, searchTerm]);

  const handleStudentChange = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      setFormData({
        ...formData,
        studentId: student.id,
        studentName: student.name,
        className: student.className,
        homeroomTeacher: student.homeroomTeacher || ''
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId) {
      alert("Pilih peserta didik terlebih dahulu.");
      return;
    }

    const record: TDA = {
      ...formData as TDA,
      id: editingId || Date.now().toString(),
      date: formData.date || new Date().toISOString().split('T')[0]
    };

    if (editingId) {
      onUpdate(record);
    } else {
      onAdd(record);
    }

    resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      studentId: '',
      className: '',
      studentName: '',
      homeroomTeacher: '',
      learningStyle: '',
      personalityType: '',
      multipleIntelligences: '',
      talentInterest: '',
      careerKey: ''
    });
    setInputClassFilter('');
  };

  const startEdit = (record: TDA) => {
    setEditingId(record.id);
    setFormData(record);
    setInputClassFilter(record.className);
  };

  const downloadTemplate = () => {
    const template = [
      ['NISN', 'Nama Siswa', 'Kelas', 'Wali Kelas', 'Gaya Belajar', 'Kepribadian', 'Kecerdasan Majemuk', 'Bakat Minat', 'Kunci Karier'],
      ['0012345678', 'Contoh Nama', 'X-A', 'Nama Wali Kelas', 'Visual', 'INTJ', 'Logis-Matematis', 'Seni', 'Investigative']
    ];
    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template TDA");
    XLSX.writeFile(wb, "Template_TDA.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      let importedCount = 0;
      data.forEach((row: any) => {
        const student = students.find(s => s.nisn === String(row['NISN']) || s.name === row['Nama Siswa']);
        if (student) {
          const newRecord: TDA = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            studentId: student.id,
            studentName: student.name,
            className: student.className,
            homeroomTeacher: student.homeroomTeacher || row['Wali Kelas'] || '',
            learningStyle: row['Gaya Belajar'] || '',
            personalityType: row['Kepribadian'] || '',
            multipleIntelligences: row['Kecerdasan Majemuk'] || '',
            talentInterest: row['Bakat Minat'] || '',
            careerKey: row['Kunci Karier'] || '',
            date: new Date().toISOString().split('T')[0]
          };
          onAdd(newRecord);
          importedCount++;
        }
      });
      alert(`Berhasil mengimpor ${importedCount} data TDA.`);
    };
    reader.readAsBinaryString(file);
  };

  const downloadDocx = async (record: TDA) => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: "DOKUMENTASI TES DIAGNOSTIK AWAL (TDA)",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "" }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [new TableCell({ children: [new Paragraph("Nama Siswa")] }), new TableCell({ children: [new Paragraph(record.studentName)] })] }),
              new TableRow({ children: [new TableCell({ children: [new Paragraph("Kelas")] }), new TableCell({ children: [new Paragraph(record.className)] })] }),
              new TableRow({ children: [new TableCell({ children: [new Paragraph("Wali Kelas")] }), new TableCell({ children: [new Paragraph(record.homeroomTeacher)] })] }),
              new TableRow({ children: [new TableCell({ children: [new Paragraph("Tipe Gaya Belajar")] }), new TableCell({ children: [new Paragraph(record.learningStyle)] })] }),
              new TableRow({ children: [new TableCell({ children: [new Paragraph("Tipe Kepribadian")] }), new TableCell({ children: [new Paragraph(record.personalityType)] })] }),
              new TableRow({ children: [new TableCell({ children: [new Paragraph("Kecerdasan Majemuk")] }), new TableCell({ children: [new Paragraph(record.multipleIntelligences)] })] }),
              new TableRow({ children: [new TableCell({ children: [new Paragraph("Bakat Minat")] }), new TableCell({ children: [new Paragraph(record.talentInterest)] })] }),
              new TableRow({ children: [new TableCell({ children: [new Paragraph("Kunci Karier")] }), new TableCell({ children: [new Paragraph(record.careerKey)] })] }),
            ],
          }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `TDA_${record.studentName}.docx`);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex items-center justify-between">
        <button onClick={() => setView(ViewMode.INPUT_DATA_CATEGORY)} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-bold text-xs uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>
        <div className="flex gap-2">
          <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-all font-black text-[10px] uppercase tracking-widest">
            <FileSpreadsheet className="w-3.5 h-3.5" /> Template
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 hover:bg-blue-100 transition-all font-black text-[10px] uppercase tracking-widest cursor-pointer">
            <Upload className="w-3.5 h-3.5" /> Upload Data
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-1">
          <div className="glass-card p-4 rounded-2xl border border-white shadow-lg space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
              <Brain className="w-4 h-4 text-blue-600" /> {editingId ? 'Edit' : 'Input'} TDA
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Kelas</label>
                  <select 
                    value={inputClassFilter} 
                    onChange={e => { setInputClassFilter(e.target.value); setFormData({...formData, studentId: ''}); }}
                    className="w-full p-2 text-[10px] input-cyber rounded-lg outline-none appearance-none"
                  >
                    <option value="">Pilih Kelas</option>
                    {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-0.5">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Nama Siswa</label>
                  <select 
                    required
                    value={formData.studentId} 
                    onChange={e => handleStudentChange(e.target.value)}
                    className="w-full p-2 text-[10px] input-cyber rounded-lg outline-none appearance-none"
                  >
                    <option value="">Pilih Siswa</option>
                    {filteredStudentsForInput.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-0.5">
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Nama Wali Kelas</label>
                <input 
                  type="text" 
                  readOnly
                  value={formData.homeroomTeacher || ''} 
                  className="w-full p-2 text-[10px] bg-slate-50 border border-slate-100 rounded-lg outline-none text-slate-500 font-bold"
                  placeholder="Otomatis..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Gaya Belajar</label>
                  <input 
                    type="text" 
                    value={formData.learningStyle || ''} 
                    onChange={e => setFormData({...formData, learningStyle: e.target.value})}
                    className="w-full p-2 text-[10px] input-cyber rounded-lg outline-none"
                    placeholder="e.g. Visual"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Kepribadian</label>
                  <input 
                    type="text" 
                    value={formData.personalityType || ''} 
                    onChange={e => setFormData({...formData, personalityType: e.target.value})}
                    className="w-full p-2 text-[10px] input-cyber rounded-lg outline-none"
                    placeholder="e.g. INTJ"
                  />
                </div>
              </div>

              <div className="space-y-0.5">
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Kecerdasan Majemuk</label>
                <input 
                  type="text" 
                  value={formData.multipleIntelligences || ''} 
                  onChange={e => setFormData({...formData, multipleIntelligences: e.target.value})}
                  className="w-full p-2 text-[10px] input-cyber rounded-lg outline-none"
                  placeholder="e.g. Logis"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Bakat Minat</label>
                  <input 
                    type="text" 
                    value={formData.talentInterest || ''} 
                    onChange={e => setFormData({...formData, talentInterest: e.target.value})}
                    className="w-full p-2 text-[10px] input-cyber rounded-lg outline-none"
                    placeholder="e.g. Seni"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Kunci Karier</label>
                  <input 
                    type="text" 
                    value={formData.careerKey || ''} 
                    onChange={e => setFormData({...formData, careerKey: e.target.value})}
                    className="w-full p-2 text-[10px] input-cyber rounded-lg outline-none"
                    placeholder="e.g. Sosial"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all shadow-md">
                  {editingId ? 'Update' : 'Simpan'}
                </button>
                {editingId && (
                  <button type="button" onClick={resetForm} className="px-3 py-2 bg-slate-100 text-slate-500 rounded-lg font-black text-[10px] uppercase tracking-widest">
                    Batal
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Preview Table Section */}
        <div className="lg:col-span-2">
          <div className="glass-card rounded-2xl border border-white shadow-lg overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" /> Preview Data TDA
              </h3>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Cari..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] outline-none focus:border-blue-500 w-36 transition-all"
                />
              </div>
            </div>
            
            <div className="overflow-x-auto flex-1 custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[8px] font-black uppercase tracking-widest border-b border-slate-100">
                    <th className="px-3 py-2">Siswa</th>
                    <th className="px-3 py-2">Gaya Belajar</th>
                    <th className="px-3 py-2">Kepribadian</th>
                    <th className="px-3 py-2">Kecerdasan</th>
                    <th className="px-3 py-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredTdaRecords.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-slate-400 italic text-[10px]">Belum ada data TDA.</td>
                    </tr>
                  ) : (
                    filteredTdaRecords.map(record => (
                      <tr key={record.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-3 py-2">
                          <div className="text-[10px] font-black text-slate-800">{record.studentName}</div>
                          <div className="text-[8px] text-blue-600 font-bold uppercase tracking-widest">{record.className}</div>
                        </td>
                        <td className="px-3 py-2 text-[9px] font-medium text-slate-600">{record.learningStyle || '-'}</td>
                        <td className="px-3 py-2 text-[9px] font-medium text-slate-600">{record.personalityType || '-'}</td>
                        <td className="px-3 py-2 text-[9px] font-medium text-slate-600">{record.multipleIntelligences || '-'}</td>
                        <td className="px-3 py-2 text-right space-x-0.5">
                          <button onClick={() => downloadDocx(record)} className="p-1 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Download">
                            <Download className="w-3 h-3" />
                          </button>
                          <button onClick={() => startEdit(record)} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Edit">
                            <Edit className="w-3 h-3" />
                          </button>
                          <button onClick={() => { if(confirm('Hapus data TDA ini?')) onDelete(record.id); }} className="p-1 text-rose-600 hover:bg-rose-50 rounded-md transition-colors" title="Hapus">
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
      </div>
    </div>
  );
};

export default TdaInput;
