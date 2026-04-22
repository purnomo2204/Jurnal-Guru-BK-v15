
import React, { useState, useMemo } from 'react';
import { ViewMode, Student, ParentCommunication, TeacherData } from '../types';
import { 
  ArrowLeft, MessageSquare, Send, User, 
  Search, Filter, Clock, CheckCheck, 
  Reply, MoreVertical, Trash2, ShieldCheck,
  Phone, Mail, MessageCircle, Edit2
} from 'lucide-react';

interface ParentCommunicationProps {
  setView: (v: ViewMode) => void;
  students: Student[];
  communications: ParentCommunication[];
  onAdd: (comm: ParentCommunication) => void;
  onUpdate: (id: string, updates: Partial<ParentCommunication>) => void;
  onUpdateStudent: (student: Student) => void;
  teacherData: TeacherData;
}

const ParentCommunicationComponent: React.FC<ParentCommunicationProps> = ({
  setView,
  students,
  communications,
  onAdd,
  onUpdate,
  onUpdateStudent,
  teacherData
}) => {
  const [isEditingWa, setIsEditingWa] = useState<string | null>(null);
  const [newWa, setNewWa] = useState('');

  const handleSetWaNumber = (student: Student) => {
    setIsEditingWa(student.id);
    setNewWa(student.parentPhoneWA || "");
  };

  const saveWaNumber = (student: Student) => {
    onUpdateStudent({ ...student, parentPhoneWA: newWa });
    setIsEditingWa(null);
    setNewWa('');
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [message, setMessage] = useState('');
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  const classes = useMemo(() => {
    const uniqueClasses = Array.from(new Set(students.map(s => s.className))).filter(Boolean).sort();
    return ['all', ...uniqueClasses];
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.className.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClass = selectedClass === 'all' || s.className === selectedClass;
      return matchesSearch && matchesClass;
    });
  }, [students, searchTerm, selectedClass]);

  const threads = useMemo(() => {
    const grouped: Record<string, ParentCommunication[]> = {};
    communications.forEach(c => {
      if (!grouped[c.studentId]) grouped[c.studentId] = [];
      grouped[c.studentId].push(c);
    });
    return grouped;
  }, [communications]);

  const handleSendMessage = () => {
    if (!selectedStudentId || !message.trim()) return;

    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return;

    const newComm: ParentCommunication = {
      id: Date.now().toString(),
      studentId: student.id,
      studentName: student.name,
      parentName: student.parentName || student.fatherName || student.motherName || 'Orang Tua',
      date: new Date().toISOString(),
      message: message.trim(),
      sender: 'Teacher',
      status: 'Sent'
    };

    onAdd(newComm);
    setMessage('');
    setActiveThreadId(student.id);
  };

  const handleSimulateReply = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const reply = prompt('Masukkan balasan simulasi dari orang tua:');
    if (!reply) return;

    const newComm: ParentCommunication = {
      id: Date.now().toString(),
      studentId: student.id,
      studentName: student.name,
      parentName: student.parentName || student.fatherName || student.motherName || 'Orang Tua',
      date: new Date().toISOString(),
      message: reply.trim(),
      sender: 'Parent',
      status: 'Replied'
    };

    onAdd(newComm);
  };

  const activeThread = activeThreadId ? threads[activeThreadId] || [] : [];
  const activeStudent = students.find(s => s.id === activeThreadId);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-fade-in text-left">
      {/* Header */}
      <div className="flex items-center gap-5 px-4">
        <button onClick={() => setView(ViewMode.HOME)} className="p-3 bg-white rounded-2xl border border-slate-200 hover:bg-slate-100 transition-all group shadow-lg">
          <ArrowLeft className="w-6 h-6 text-slate-500 group-hover:-translate-x-1 transition-transform" />
        </button>
        <div>
          <p className="label-luxe text-blue-500 font-black text-[8px]">PARENT ENGAGEMENT</p>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">Komunikasi <span className="text-blue-500 font-light italic lowercase">Orang Tua</span></h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4">
        {/* Sidebar: Student List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white/70 p-4 rounded-[2rem] border border-slate-200 space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <select 
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-3 text-[10px] font-bold text-slate-800 outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="all">SEMUA KELAS</option>
                  {classes.filter(c => c !== 'all').map(c => (
                    <option key={c} value={c}>KELAS {c}</option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Cari Siswa..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-3 text-[10px] font-bold text-slate-800 outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {filteredStudents.map(student => (
                <button
                  key={student.id}
                  onClick={() => setActiveThreadId(student.id)}
                  className={`w-full p-3 rounded-xl border transition-all text-left flex items-center gap-3 group ${
                    activeThreadId === student.id 
                    ? 'bg-blue-500/10 border-blue-500/30' 
                    : 'bg-slate-50/30 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
                    activeThreadId === student.id ? 'bg-blue-500 text-white border-blue-400' : 'bg-white text-slate-500 border-slate-200'
                  }`}>
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{student.name}</p>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{student.className}</p>
                  </div>
                  {threads[student.id] && (
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-[8px] font-black text-white">
                      {threads[student.id].length}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content: Chat Thread */}
        <div className="lg:col-span-8 space-y-6">
          {activeThreadId ? (
            <div className="bg-white/70 rounded-[2rem] border border-slate-200 flex flex-col h-[600px] overflow-hidden">
              {/* Thread Header */}
              <div className="p-4 border-bottom border-slate-200 bg-white/90 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                      {activeStudent?.name}
                      <button className="text-slate-500 hover:text-slate-800">
                        <Edit2 size={12} />
                      </button>
                    </h3>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      Orang Tua: {activeStudent?.parentName || activeStudent?.fatherName || 'Belum Diatur'}
                      <br />
                      No. WA: {activeStudent?.parentPhoneWA && !isEditingWa ? (
                        <span className="flex items-center gap-2">
                          {activeStudent.parentPhoneWA}
                          <button onClick={() => handleSetWaNumber(activeStudent!)} className="text-primary hover:underline font-bold">
                            EDIT
                          </button>
                        </span>
                      ) : (
                        isEditingWa === activeStudent?.id ? (
                          <span className="inline-flex items-center gap-2">
                            <input 
                              value={newWa} 
                              onChange={(e) => setNewWa(e.target.value)} 
                              className="bg-slate-100 text-slate-800 p-1 rounded" 
                            />
                            <button onClick={() => saveWaNumber(activeStudent!)} className="text-emerald-500 hover:underline font-bold">
                              SIMPAN
                            </button>
                            <button onClick={() => setIsEditingWa(null)} className="text-red-500 hover:underline font-bold">
                              BATAL
                            </button>
                          </span>
                        ) : (
                          <button onClick={() => handleSetWaNumber(activeStudent!)} className="text-primary hover:underline font-bold">
                            ATUR NOMOR WA
                          </button>
                        )
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {activeStudent?.parentPhoneWA && (
                    <a 
                      href={`https://wa.me/${activeStudent.parentPhoneWA.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Halo Bapak/Ibu ${activeStudent.parentName || activeStudent?.fatherName || ''}, ini dari Guru BK ${teacherData.school}. Ada update mengenai ${activeStudent.name}...`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"
                      title="Kirim via WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  )}
                  <button 
                    onClick={() => handleSimulateReply(activeThreadId)}
                    className="p-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-500 hover:bg-blue-500 hover:text-white transition-all"
                    title="Simulasi Balasan Ortu"
                  >
                    <Reply className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 bg-slate-100 border border-slate-300 rounded-lg text-slate-500 hover:text-slate-800 transition-all">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/20">
                {activeThread.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-2 opacity-30">
                    <MessageSquare className="w-12 h-12 text-slate-500" />
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Belum ada percakapan</p>
                  </div>
                ) : (
                  activeThread.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === 'Teacher' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] space-y-1 ${msg.sender === 'Teacher' ? 'items-end' : 'items-start'}`}>
                        <div className={`p-3 rounded-xl text-xs font-medium leading-relaxed shadow-lg ${
                          msg.sender === 'Teacher' 
                          ? 'bg-blue-600 text-white rounded-tr-none' 
                          : 'bg-slate-100 text-slate-700 rounded-tl-none border border-slate-300'
                        }`}>
                          {msg.message}
                        </div>
                        <div className="flex items-center gap-1 px-1">
                          <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">
                            {new Date(msg.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {msg.sender === 'Teacher' && (
                            <CheckCheck className="w-2.5 h-2.5 text-blue-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 bg-white/90 border-t border-slate-200">
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    placeholder="Tulis pesan untuk orang tua..." 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 transition-all shadow-inner"
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    className="p-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-xl transition-all shadow-xl shadow-blue-600/20"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/70 rounded-[2.5rem] border border-slate-200 h-[700px] flex flex-col items-center justify-center text-center p-12 space-y-6">
              <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 border border-blue-500/20">
                <MessageSquare className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Pusat Komunikasi Ortu</h3>
                <p className="text-slate-500 text-sm font-medium max-w-md mx-auto">
                  Pilih siswa dari daftar di samping untuk memulai percakapan atau mengirimkan update perkembangan kepada orang tua.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions / Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4">
        <div className="bg-white/70 p-4 rounded-2xl border border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Pesan</p>
            <p className="text-xl font-black text-slate-800">{communications.length}</p>
          </div>
        </div>
        <div className="bg-white/70 p-4 rounded-2xl border border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <Reply className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Balasan Ortu</p>
            <p className="text-xl font-black text-slate-800">{communications.filter(c => c.sender === 'Parent').length}</p>
          </div>
        </div>
        <div className="bg-white/70 p-4 rounded-2xl border border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Status Cloud</p>
            <p className="text-xl font-black text-slate-800 uppercase tracking-tighter text-emerald-500">Aktif</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentCommunicationComponent;
