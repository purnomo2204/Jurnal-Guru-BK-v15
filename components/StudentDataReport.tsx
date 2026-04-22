
import React, { useMemo, useState } from 'react';
import { ViewMode, Student, TeacherData } from '../types';
import { formatAcademicTitle } from '../src/lib/nameFormatter';
import { 
  ArrowLeft, Download, Eye, Search, 
  Filter, Users, X, FileText, FileDown
} from 'lucide-react';
import { 
  Document, Packer, Paragraph, TextRun, HeadingLevel, 
  Table, TableRow, TableCell, WidthType, BorderStyle, 
  AlignmentType, VerticalAlign
} from 'docx';
import { saveAs } from 'file-saver';

interface StudentDataReportProps {
  students: Student[];
  teacherData: TeacherData;
  setView: (v: ViewMode) => void;
}

const StudentDataReport: React.FC<StudentDataReportProps> = ({ 
  students, teacherData, setView 
}) => {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Student, direction: 'asc' | 'desc' } | null>(null);

  const requestSort = (key: keyof Student) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getGenderCode = (gender?: string) => {
    if (!gender) return '-';
    const g = gender.toLowerCase().trim();
    if (['laki-laki', 'laki - laki', 'l', 'laki'].includes(g)) return 'L';
    if (['perempuan', 'p'].includes(g)) return 'P';
    return '-';
  };

  const handleDownloadDocx = () => {
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children: [
          // Kop Surat
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: teacherData.govOrFoundation?.toUpperCase() || "PEMERINTAH DAERAH", bold: true, size: 24 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: teacherData.deptOrFoundation?.toUpperCase() || "DINAS PENDIDIKAN", bold: true, size: 24 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: teacherData.school?.toUpperCase() || "NAMA SEKOLAH", bold: true, size: 28 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: teacherData.schoolAddress || "Alamat Lengkap Sekolah", italics: true, size: 18 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "________________________________________________________________________________", bold: true }),
            ],
            spacing: { after: 200 },
          }),

          // Judul
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "DAFTAR SISWA ASUH", bold: true, underline: {}, size: 28 }),
            ],
            spacing: { before: 200 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: `KELAS: ${selectedClass || "SEMUA KELAS"}`, bold: true, size: 24 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: `TAHUN PELAJARAN ${teacherData.academicYear}`, bold: true, size: 24 }),
            ],
            spacing: { after: 400 },
          }),

          // Tabel
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "No", bold: true })], alignment: AlignmentType.CENTER })], width: { size: 5, type: WidthType.PERCENTAGE } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "NISN / NIS", bold: true })], alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "NAMA SISWA", bold: true })], alignment: AlignmentType.CENTER })], width: { size: 35, type: WidthType.PERCENTAGE } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "L/P", bold: true })], alignment: AlignmentType.CENTER })], width: { size: 5, type: WidthType.PERCENTAGE } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "ALAMAT", bold: true })], alignment: AlignmentType.CENTER })], width: { size: 25, type: WidthType.PERCENTAGE } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "NOMOR WA/ HP", bold: true })], alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }),
                ],
              }),
              ...filteredStudents.map((s, idx) => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: (idx + 1).toString(), alignment: AlignmentType.CENTER })] }),
                  new TableCell({ 
                    children: [
                      new Paragraph({ text: s.nisn || "-", alignment: AlignmentType.CENTER }),
                      new Paragraph({ text: s.nis || "-", alignment: AlignmentType.CENTER }),
                    ] 
                  }),
                  new TableCell({ children: [new Paragraph({ text: s.name.toUpperCase() })] }),
                  new TableCell({ children: [new Paragraph({ text: getGenderCode(s.gender), alignment: AlignmentType.CENTER })] }),
                  new TableCell({ children: [new Paragraph({ text: s.address || "-" })] }),
                  new TableCell({ children: [new Paragraph({ text: s.phone || "-", alignment: AlignmentType.CENTER })] }),
                ],
              })),
            ],
          }),

          // Tanda Tangan
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: `${teacherData.city || "Kota"}, ${new Date().toLocaleDateString('id-ID', {day:'2-digit', month:'long', year:'numeric'})}`, size: 22 }),
            ],
            spacing: { before: 800 },
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: "Guru Bimbingan dan Konseling", size: 22 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: "", size: 22 }),
            ],
            spacing: { before: 1000 },
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: formatAcademicTitle(teacherData.name), bold: true, underline: {}, size: 22, font: "Arial" }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: `NIP. ${teacherData.nip || "-"}`, size: 22 }),
            ],
          }),
        ],
      }],
    });

    Packer.toBlob(doc).then(blob => {
      saveAs(blob, `Daftar Siswa Asuh - ${selectedClass || "Semua"}.docx`);
    });
  };

  const uniqueClasses = useMemo(() => 
    Array.from(new Set(students.map(s => s.className))).sort()
  , [students]);

  const filteredStudents = useMemo(() => {
    let result = students;
    if (selectedClass && selectedClass !== 'SEMUA KELAS') {
      result = result.filter(s => s.className === selectedClass);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.nis?.toLowerCase().includes(q) || 
        s.nisn?.toLowerCase().includes(q) ||
        s.className.toLowerCase().includes(q)
      );
    }
    
    if (sortConfig !== null) {
      result = [...result].sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (aValue === undefined || aValue === null) aValue = '';
        if (bValue === undefined || bValue === null) bValue = '';

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const aNum = Number(aValue);
          const bNum = Number(bValue);
          if (!isNaN(aNum) && !isNaN(bNum) && aValue.trim() !== '' && bValue.trim() !== '') {
            return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
          }
          return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return result;
  }, [students, selectedClass, searchQuery, sortConfig]);

  if (!selectedClass) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 animate-fade-in">
        <div className="glass-card w-full max-w-md p-6 rounded-[1.5rem] border border-slate-200 shadow-2xl bg-white/90 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setView(ViewMode.HOME)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-800 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter leading-none">Daftar Siswa Asuh</h2>
              <p className="text-blue-400 text-[7px] font-black uppercase tracking-widest mt-0.5">Pilih Kelas atau Cari Siswa</p>
            </div>
          </div>

          {/* Search Bar for Initial View */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input 
              type="text"
              placeholder="Cari Nama Siswa atau Kelas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100/50 border border-slate-200 rounded-lg py-2.5 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-600 outline-none focus:border-blue-500/50 transition-all"
            />
          </div>

          <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1 scroll-hide">
            {!searchQuery && (
              <button 
                onClick={() => setSelectedClass('SEMUA KELAS')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 transition-all group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                    <Users className="w-3 h-3" />
                  </div>
                  <span className="text-slate-800 font-bold uppercase tracking-widest text-[9px]">SEMUA KELAS</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-blue-400/60 text-[6px] uppercase font-black">Report</span>
                  <ArrowLeft className="w-2.5 h-2.5 text-blue-400/40 rotate-180" />
                </div>
              </button>
            )}

            {searchQuery ? (
              <div className="space-y-0.5">
                {filteredStudents.slice(0, 50).map(s => (
                  <button 
                    key={s.id}
                    onClick={() => {
                      setSelectedClass(s.className);
                      setSearchQuery('');
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-100/30 border border-slate-200 hover:bg-slate-100/50 transition-all group text-left"
                  >
                    <div>
                      <div className="text-slate-800 font-bold uppercase text-[9px]">{s.name}</div>
                      <div className="text-slate-500 text-[7px] uppercase font-black">Kelas {s.className} • {s.nisn || s.nis || '-'}</div>
                    </div>
                    <ArrowLeft className="w-2.5 h-2.5 text-slate-500/40 rotate-180" />
                  </button>
                ))}
                {filteredStudents.length === 0 && (
                  <p className="text-center py-6 text-slate-600 text-[8px] font-black uppercase tracking-widest italic">Siswa tidak ditemukan</p>
                )}
              </div>
            ) : (
              uniqueClasses.map(c => (
                <button 
                  key={c}
                  onClick={() => setSelectedClass(c)}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-100/30 border border-slate-200 hover:bg-slate-100/50 transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-slate-200 rounded-md flex items-center justify-center text-slate-800 group-hover:scale-110 transition-transform">
                      <Filter className="w-3 h-3" />
                    </div>
                    <span className="text-slate-800 font-bold uppercase tracking-widest text-[9px]">KELAS {c}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 text-[6px] uppercase font-black">Report</span>
                    <ArrowLeft className="w-2.5 h-2.5 text-slate-500/40 rotate-180" />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in text-left pb-16 px-4 max-w-6xl mx-auto">
      {/* Header Actions */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="flex items-center gap-4">
           <button onClick={() => setSelectedClass(null)} className="p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-all group shadow-md">
             <ArrowLeft className="w-5 h-5 text-primary group-hover:-translate-x-1 transition-transform" />
           </button>
           <div>
              <p className="label-luxe text-primary font-black text-[7px]">LAPORAN DATA SISWA</p>
              <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                {selectedClass === 'SEMUA KELAS' ? 'DAFTAR SISWA ASUH' : `KELAS ${selectedClass}`}
              </h2>
           </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
          {/* Internal Search & Filter */}
          <div className="flex-1 min-w-[150px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input 
              type="text"
              placeholder="Cari nama..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-[10px] font-bold text-slate-900 outline-none focus:border-blue-500 transition-all shadow-sm"
            />
          </div>

          <select 
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="bg-white border border-slate-200 text-slate-900 px-3 py-2.5 rounded-xl font-bold text-[10px] outline-none focus:border-blue-500 transition-all shadow-sm"
          >
            <option value="SEMUA KELAS">SEMUA KELAS</option>
            {uniqueClasses.map(c => (
              <option key={c} value={c}>KELAS {c}</option>
            ))}
          </select>

          <div className="flex gap-1.5">
            <button onClick={() => setShowPreview(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2.5 rounded-xl font-black text-[8px] flex items-center gap-1.5 shadow-md transition-all uppercase tracking-widest text-nowrap">
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
            <button onClick={handleDownloadDocx} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2.5 rounded-xl font-black text-[8px] flex items-center gap-1.5 shadow-md transition-all uppercase tracking-widest text-nowrap">
              <FileDown className="w-3.5 h-3.5" /> Download DOCX
            </button>
          </div>
        </div>
      </div>

      {/* Preview Table (Matching Dashboard Style) */}
      <div className="glass-card rounded-2xl border border-slate-200 overflow-hidden shadow-lg bg-white/90 backdrop-blur-xl">
         <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-tighter italic leading-none">DAFTAR SISWA ASUH</h3>
              <p className="label-luxe text-blue-400 text-[7px] mt-1">Tahun Ajaran: {teacherData.academicYear}</p>
            </div>
            <div className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-[6px] font-black text-blue-400 uppercase tracking-widest mb-0.5 text-center">Total Siswa</p>
              <p className="text-base font-black text-slate-800 text-center leading-none">{filteredStudents.length}</p>
            </div>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-100/50 text-blue-400 text-[8px] font-black uppercase tracking-widest border-b border-slate-200">
                     <th className="p-1.5 text-center w-8">No</th>
                     <th className="p-1.5 w-20 cursor-pointer hover:bg-slate-200/50 transition-colors" onClick={() => requestSort('nisn')}>
                       NISN {sortConfig?.key === 'nisn' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                     </th>
                     <th className="p-1.5 w-16 cursor-pointer hover:bg-slate-200/50 transition-colors" onClick={() => requestSort('nis')}>
                       NIS {sortConfig?.key === 'nis' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                     </th>
                     <th className="p-1.5 cursor-pointer hover:bg-slate-200/50 transition-colors" onClick={() => requestSort('name')}>
                       Nama Siswa {sortConfig?.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                     </th>
                     <th className="p-1.5 w-8 text-center cursor-pointer hover:bg-slate-200/50 transition-colors" onClick={() => requestSort('gender')}>
                       L/P {sortConfig?.key === 'gender' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                     </th>
                     <th className="p-1.5 cursor-pointer hover:bg-slate-200/50 transition-colors" onClick={() => requestSort('address')}>
                       Alamat {sortConfig?.key === 'address' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                     </th>
                     <th className="p-1.5 w-24 cursor-pointer hover:bg-slate-200/50 transition-colors" onClick={() => requestSort('phone')}>
                       Nomor WA/ HP {sortConfig?.key === 'phone' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                     </th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {filteredStudents.length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest text-[8px] italic">Tidak ada data siswa.</td></tr>
                  ) : filteredStudents.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-white/5 transition-colors group">
                       <td className="p-1.5 text-center text-[9px] font-bold text-slate-500 align-top">{idx + 1}</td>
                       <td className="p-1.5 align-top">
                          <div className="text-[9px] font-black text-slate-800">{s.nisn || '-'}</div>
                       </td>
                       <td className="p-1.5 align-top">
                          <div className="text-[9px] font-bold text-slate-600">{s.nis || '-'}</div>
                       </td>
                       <td className="p-1.5 align-top">
                          <div className="text-[10px] font-black text-slate-800 group-hover:text-blue-400 transition-colors uppercase">{s.name}</div>
                          <div className="text-[8px] font-black text-slate-500 mt-0.5 uppercase tracking-widest">{s.className}</div>
                       </td>
                       <td className="p-1.5 text-center align-top">
                          <span className={`px-1 py-0.5 rounded text-[8px] font-black uppercase ${getGenderCode(s.gender) === 'L' ? 'bg-blue-500/10 text-blue-400' : getGenderCode(s.gender) === 'P' ? 'bg-pink-500/10 text-pink-400' : 'bg-slate-500/10 text-slate-400'}`}>
                            {getGenderCode(s.gender)}
                          </span>
                       </td>
                       <td className="p-1.5 align-top">
                          <div className="text-[9px] text-slate-500 leading-relaxed max-w-[200px] line-clamp-2">{s.address || '-'}</div>
                       </td>
                       <td className="p-1.5 align-top">
                          <div className="text-[9px] font-bold text-slate-600">{s.phone || '-'}</div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-5xl h-[90vh] rounded-[2rem] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 bg-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-slate-800 font-black uppercase tracking-widest text-sm">Preview Daftar Siswa Asuh</h3>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleDownloadDocx}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2"
                >
                  <FileDown className="w-4 h-4" /> Download DOCX
                </button>
                <button 
                  onClick={() => setShowPreview(false)} 
                  className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2"
                >
                  <X className="w-4 h-4" /> Batal
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-slate-100 p-12 flex justify-center">
              <div id="printable-student-report" className="bg-white w-[215.9mm] min-h-[330.2mm] shadow-xl text-black font-serif print-page">
                {/* Kop Surat */}
                <div className="flex items-center border-b-[3px] border-black pb-3 mb-2 relative font-serif">
                  <div className="w-24 shrink-0">
                    {teacherData.logoGov && <img src={teacherData.logoGov} className="w-full h-16 object-contain" alt="Logo Pemda" />}
                  </div>
                  <div className="flex-1 text-center space-y-0">
                    <h1 className="text-xs font-bold uppercase leading-tight text-black font-serif">{teacherData.govOrFoundation?.trim() || "PEMERINTAH DAERAH"}</h1>
                    <h1 className="text-xs font-bold uppercase leading-tight text-black font-serif">{teacherData.deptOrFoundation?.trim() || "DINAS PENDIDIKAN"}</h1>
                    <h2 className="text-sm font-bold uppercase leading-tight text-black font-serif">{teacherData.school?.trim() || "NAMA SEKOLAH"}</h2>
                    <p className="text-[9px] italic leading-tight text-black font-serif">{teacherData.schoolAddress?.trim() || "Alamat Lengkap Sekolah"}</p>
                  </div>
                  <div className="w-24 shrink-0">
                    {teacherData.logoSchool && <img src={teacherData.logoSchool} className="w-full h-16 object-contain" alt="Logo Sekolah" />}
                  </div>
                </div>

                {/* Judul Laporan */}
                <div className="text-center space-y-0 mb-4 font-serif">
                  <h3 className="text-lg font-bold underline uppercase text-black font-serif">DAFTAR SISWA ASUH</h3>
                  <p className="text-sm font-bold uppercase text-black font-serif">TAHUN PELAJARAN {teacherData.academicYear}</p>
                  <p className="text-sm font-bold uppercase text-black font-serif">KELAS: {selectedClass}</p>
                </div>

                {/* Tabel */}
                <table className="w-full border-collapse border border-black text-[8px] text-black font-serif">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="border border-black px-1 py-0.5 text-center w-6 text-black">No</th>
                      <th className="border border-black px-1 py-0.5 text-center w-14 text-black">NISN</th>
                      <th className="border border-black px-1 py-0.5 text-center w-12 text-black">NIS</th>
                      <th className="border border-black px-1 py-0.5 text-center text-black">NAMA SISWA</th>
                      <th className="border border-black px-1 py-0.5 text-center w-8 text-black">L/P</th>
                      <th className="border border-black px-1 py-0.5 text-center text-black">ALAMAT</th>
                      <th className="border border-black px-1 py-0.5 text-center text-black w-24">NOMOR WA/ HP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s, idx) => (
                      <tr key={s.id}>
                        <td className="border border-black px-1 py-0.5 text-center text-black">{idx + 1}</td>
                        <td className="border border-black px-1 py-0.5 text-center text-black">{s.nisn || '-'}</td>
                        <td className="border border-black px-1 py-0.5 text-center text-black">{s.nis || '-'}</td>
                        <td className="border border-black px-1 py-0.5 uppercase text-black">{s.name}</td>
                        <td className="border border-black px-1 py-0.5 text-center text-black">{getGenderCode(s.gender)}</td>
                        <td className="border border-black px-1 py-0.5 text-black">{s.address || '-'}</td>
                        <td className="border border-black px-1 py-0.5 text-center text-black">{s.phone || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Tanda Tangan */}
                <div className="mt-8 flex justify-end font-serif">
                  <div className="w-64 text-center space-y-10">
                    <div className="space-y-1">
                      <p className="text-xs text-black">{teacherData.city || "Kota"}, {new Date().toLocaleDateString('id-ID', {day:'2-digit', month:'long', year:'numeric'})}</p>
                      <p className="text-xs font-bold text-black">Guru Bimbingan dan Konseling</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold underline text-black font-arial">{formatAcademicTitle(teacherData.name)}</p>
                      <p className="text-xs text-black">NIP. {teacherData.nip || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Print Root removed */}
    </div>
  );
};

export default StudentDataReport;
