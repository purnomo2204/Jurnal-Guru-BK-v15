import React, { useState, useMemo, useRef } from 'react';
import { X, Download, Printer } from 'lucide-react';
import { Student, TeacherData } from '../types';
import html2pdf from 'html2pdf.js';

interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any[];
  type: 'kasus' | 'anekdot';
  students: Student[];
  teacherData: TeacherData;
}

const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  isOpen, onClose, data, type, students, teacherData
}) => {
  const [reportType, setReportType] = useState<'perkelas' | 'persiswa'>('perkelas');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const reportRef = useRef<HTMLDivElement>(null);

  const availableClasses = useMemo(() => Array.from(new Set(students.map(s => s.className))).sort(), [students]);
  const studentsInClass = useMemo(() => {
    if (!selectedClass) return students;
    return students.filter(s => s.className === selectedClass);
  }, [students, selectedClass]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const student = students.find(s => String(s.id) === String(item.studentId));
      const matchesClass = !selectedClass || student?.className === selectedClass;
      const matchesStudent = !selectedStudent || String(item.studentId) === String(selectedStudent);
      return matchesClass && matchesStudent;
    });
  }, [data, selectedClass, selectedStudent, students]);

  if (!isOpen) return null;

  const handleDownload = () => {
    const element = reportRef.current;
    if (!element) return;

    const opt = {
      margin: [30, 20, 30, 30] as [number, number, number, number], // top, right, bottom, left in mm
      filename: `Laporan_${type}_${reportType}.pdf`,
      image: { type: 'jpeg' as 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        onclone: (document: Document) => {
          const styles = document.querySelectorAll('style');
          styles.forEach(s => {
            if (s.innerHTML.includes('oklch')) {
              s.innerHTML = s.innerHTML.replace(/oklch\([^)]+\)/g, 'inherit');
            }
          });
          const allElements = document.querySelectorAll('*');
          allElements.forEach(el => {
            const style = el.getAttribute('style');
            if (style && style.includes('oklch')) {
              el.setAttribute('style', style.replace(/oklch\([^)]+\)/g, 'inherit'));
            }
          });
        }
      },
      jsPDF: { unit: 'mm' as 'mm', format: 'legal' as 'legal', orientation: 'portrait' as 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-4 border-b flex justify-between items-center bg-white">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Preview Laporan {type === 'kasus' ? 'Catatan Kasus' : 'Catatan Anekdot'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        
        <div className="p-3 flex flex-wrap gap-2 bg-slate-50 border-b">
          <select value={reportType} onChange={e => setReportType(e.target.value as any)} className="p-1 text-[9px] rounded-lg border bg-white font-bold text-slate-700 outline-none focus:ring-1 focus:ring-blue-500">
            <option value="perkelas">LAPORAN PERKELAS</option>
            <option value="persiswa">LAPORAN PERSISWA</option>
          </select>
          <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedStudent(''); }} className="p-1 text-[9px] rounded-lg border bg-white font-bold text-slate-700 outline-none focus:ring-1 focus:ring-blue-500">
            <option value="">KELAS</option>
            {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={selectedStudent} onChange={e => { setSelectedStudent(e.target.value); if(e.target.value) setReportType('persiswa'); }} className="p-1 text-[9px] rounded-lg border bg-white font-bold text-slate-700 outline-none focus:ring-1 focus:ring-blue-500 min-w-[120px]">
            <option value="">NAMA SISWA</option>
            {studentsInClass.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-8" ref={reportRef}>
          <div style={{ fontFamily: 'Times New Roman' }}>
            {/* Letterhead */}
            <div className="text-center border-b-2 border-black pb-4 mb-6">
              <h1 className="text-xl font-bold uppercase">{teacherData.govOrFoundation}</h1>
              <h1 className="text-xl font-bold uppercase">{teacherData.deptOrFoundation}</h1>
              <h1 className="text-2xl font-bold uppercase">{teacherData.school}</h1>
              <p>{teacherData.schoolAddress}</p>
            </div>

            <h2 className="text-center font-bold text-lg uppercase mb-6">Laporan {type === 'kasus' ? 'Catatan Kasus' : 'Catatan Anekdot'}</h2>

            <table className="w-full border-collapse border border-black text-[10px]">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-black p-1">No</th>
                  <th className="border border-black p-1">Tanggal</th>
                  <th className="border border-black p-1">Nama Siswa</th>
                  <th className="border border-black p-1">Kelas</th>
                  {type === 'kasus' ? (
                    <>
                      <th className="border border-black p-1">Pelanggaran</th>
                      <th className="border border-black p-1">Kelas</th>
                      <th className="border border-black p-1">Uraian Kronologi Kasus</th>
                      <th className="border border-black p-1">Tindakan</th>
                      <th className="border border-black p-1">Status</th>
                    </>
                  ) : (
                    <>
                      <th className="border border-black p-1">Deskripsi</th>
                      <th className="border border-black p-1">Analisis</th>
                      <th className="border border-black p-1">Tindak Lanjut</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => {
                  const student = students.find(s => String(s.id) === String(item.studentId));
                  // Robust student name retrieval
                  const studentName = student?.name || item.studentName || (item.studentId ? `ID: ${item.studentId}` : 'Siswa Dihapus');
                  const className = student?.className || item.className || item.manualClassName || '-';
                  
                  return (
                    <tr key={item.id}>
                      <td className="border border-black p-1 text-center">{index + 1}</td>
                      <td className="border border-black p-1">{item.date}</td>
                      <td className="border border-black p-1">{studentName}</td>
                      <td className="border border-black p-1">{className}</td>
                      {type === 'kasus' ? (
                        <>
                          <td className="border border-black p-1">{item.violation}</td>
                          <td className="border border-black p-1">{student?.className || '-'}</td>
                          <td className="border border-black p-1">{item.description}</td>
                          <td className="border border-black p-1">{item.actionTaken}</td>
                          <td className="border border-black p-1">{item.status}</td>
                        </>
                      ) : (
                        <>
                          <td className="border border-black p-1">{item.description}</td>
                          <td className="border border-black p-1">{item.resolution}</td>
                          <td className="border border-black p-1">{item.followUp}</td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Signature */}
            <div className="mt-12 flex justify-end">
              <div className="text-center">
                <p>{teacherData.city}, {teacherData.approvalDate}</p>
                <p>Guru BK</p>
                <br/><br/><br/>
                <p className="font-bold underline">{teacherData.name}</p>
                <p>NIP. {teacherData.nip}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2 bg-slate-50">
          <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-1.5 bg-slate-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all shadow-md"><Printer className="w-3 h-3"/> CETAK</button>
          <button onClick={handleDownload} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md"><Download className="w-3 h-3"/> DOWNLOAD PDF</button>
        </div>
      </div>
    </div>
  );
};

export default ReportPreviewModal;
