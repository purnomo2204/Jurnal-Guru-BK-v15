import React from 'react';
import { CounselingSchedule, TeacherData } from '../types';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { X, Mail, Download } from 'lucide-react';

interface CounselingInvitationModalProps {
  schedule: CounselingSchedule;
  teacherData: TeacherData;
  onClose: () => void;
}

const CounselingInvitationModal: React.FC<CounselingInvitationModalProps> = ({
  schedule,
  teacherData,
  onClose
}) => {

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Letterhead
    doc.setFontSize(18);
    doc.text('KOP SURAT SEKOLAH', 105, 20, { align: 'center' });
    doc.line(20, 25, 190, 25);
    
    // Invitation Content
    doc.setFontSize(14);
    doc.text('UNDANGAN SESI KONSELING', 105, 40, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Kepada Yth. Siswa/Orang Tua,`, 20, 60);
    doc.text(`Sehubungan dengan jadwal konseling, kami mengundang Anda untuk hadir pada:`, 20, 70);
    
    doc.text(`Topik: ${schedule.topic}`, 30, 85);
    doc.text(`Tanggal: ${schedule.date}`, 30, 95);
    doc.text(`Waktu: ${schedule.time}`, 30, 105);
    
    doc.text(`Demikian undangan ini kami sampaikan. Terima kasih atas perhatiannya.`, 20, 120);
    
    // Signature
    doc.text(`${teacherData.name || 'Guru BK'}`, 150, 150, { align: 'center' });
    doc.text(`(Tanda Tangan)`, 150, 165, { align: 'center' });
    
    doc.save(`Undangan_Konseling_${schedule.studentName}.pdf`);
    toast.success('Undangan berhasil diunduh sebagai PDF');
  };

  const sendNotification = () => {
    // Simulate sending email/notification
    toast.info(`Notifikasi undangan untuk ${schedule.studentName} telah dikirim.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Undangan Konseling</h2>
          <button onClick={onClose}><X className="w-6 h-6" /></button>
        </div>
        
        <div className="space-y-4 mb-6">
          <p><strong>Siswa:</strong> {schedule.studentName}</p>
          <p><strong>Topik:</strong> {schedule.topic}</p>
          <p><strong>Tanggal:</strong> {schedule.date}</p>
          <p><strong>Waktu:</strong> {schedule.time}</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={generatePDF}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            <Download className="w-4 h-4" /> Unduh PDF
          </button>
          <button 
            onClick={sendNotification}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
          >
            <Mail className="w-4 h-4" /> Kirim Notifikasi
          </button>
        </div>
      </div>
    </div>
  );
};

export default CounselingInvitationModal;
