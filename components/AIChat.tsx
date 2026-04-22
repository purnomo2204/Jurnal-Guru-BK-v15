
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, X, Send, Bot, User, Loader2, MessageSquare, ChevronDown, Wand2 } from 'lucide-react';
import { Student, CounselingLog, TeacherData } from '../types';
import { formatAcademicTitle } from '../src/lib/nameFormatter';

interface AIChatProps {
  students: Student[];
  logs: CounselingLog[];
  teacherData: TeacherData;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const AIChat: React.FC<AIChatProps> = ({ students, logs, teacherData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: `Halo ${teacherData.name || 'Bapak/Ibu Guru'}! Saya Asisten AI BK Pro. Ada yang bisa saya bantu terkait administrasi bimbingan konseling hari ini?` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const generateContext = () => {
    return `
      Konteks Aplikasi Jurnal BK Pro:
      - Nama Guru: ${formatAcademicTitle(teacherData.name || 'Belum diatur')}
      - Instansi: ${teacherData.school || 'Belum diatur'}
      - Jumlah Siswa Bimbingan: ${students.length}
      - Jumlah Riwayat Layanan: ${logs.length}
      - Tahun Ajaran: ${teacherData.academicYear}
      
      Statistik Singkat:
      - Layanan Individu: ${logs.filter(l => l.type === 'Konseling Individu').length}
      - Kasus Prioritas (Butuh Bantuan): ${logs.filter(l => l.status === 'butuh bantuan').length}
      
      Instruksi: Kamu adalah asisten ahli administrasi Bimbingan Konseling (BK) di sekolah. 
      Tugasmu membantu guru dalam menganalisis data, memberikan saran penanganan siswa, dan panduan administrasi BK. 
      Gunakan gaya bahasa profesional, suportif, dan edukatif dalam Bahasa Indonesia.
    `;
  };

  const handleSendMessage = async (textOverride?: string) => {
    const messageText = textOverride || input;
    if (!messageText.trim() || isLoading) return;

    const newMessages: Message[] = [...messages, { role: 'user', text: messageText }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Create a new instance right before making the API call
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        // Gemini history must start with 'user'. Filter out initial model welcome message if it's first.
        contents: newMessages
          .filter((m, i) => !(i === 0 && m.role === 'model'))
          .map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
          })),
        config: {
          systemInstruction: generateContext(),
          temperature: 0.7,
        }
      });

      // Use response.text property directly
      const responseText = response.text || "Maaf, saya sedang mengalami kendala teknis. Mohon coba lagi.";
      setMessages([...newMessages, { role: 'model', text: responseText }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages([...newMessages, { role: 'model', text: "Maaf, terjadi kesalahan saat menghubungi server AI." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedPrompts = [
    "Ringkas kondisi bimbingan bulan ini",
    "Cara menangani siswa yang sering absen",
    "Tips membuat laporan LPJ yang baik",
    "Analisis jumlah kasus prioritas"
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[2000]">
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
          <Sparkles className="w-8 h-8 relative z-10 group-hover:rotate-12 transition-transform" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-main" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="glass-card w-[380px] md:w-[420px] h-[600px] rounded-[2.5rem] border border-primary/20 shadow-[0_25px_60px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 bg-card backdrop-blur-2xl">
          {/* Header */}
          <div className="p-6 bg-primary/10 border-b border-primary/10 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg">
                <Bot className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-black text-main uppercase tracking-tight">AI Counselor Assistant</h3>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Active System</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-primary/10 rounded-full text-slate-500 hover:text-primary transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar scroll-smooth"
          >
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${m.role === 'user' ? 'bg-primary' : 'bg-card border border-primary/20'}`}>
                    {m.role === 'user' ? <User className="w-5 h-5 text-slate-800" /> : <Bot className="w-5 h-5 text-primary" />}
                  </div>
                  <div className={`p-4 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                    m.role === 'user' 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-card text-main border border-primary/10 rounded-tl-none'
                  }`}>
                    {m.text}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-pulse">
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-lg bg-card border border-primary/20 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  </div>
                  <div className="p-4 bg-card rounded-2xl rounded-tl-none border border-primary/10">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Suggestions */}
          {messages.length === 1 && (
            <div className="px-6 pb-4 flex flex-wrap gap-2">
              {suggestedPrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(p)}
                  className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-all flex items-center gap-1.5"
                >
                  <Wand2 className="w-3 h-3" /> {p}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="p-6 bg-card border-t border-primary/10">
            <div className="relative flex items-center gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Tanya asisten BK..."
                className="flex-1 bg-main border border-primary/10 rounded-2xl py-4 pl-5 pr-14 text-xs text-main focus:border-primary outline-none transition-all"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-3 bg-primary text-white rounded-xl hover:brightness-110 disabled:opacity-30 disabled:hover:scale-100 transition-all hover:scale-105 active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[8px] text-slate-600 text-center mt-3 font-black uppercase tracking-widest">Powered by Gemini AI Technology</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChat;
