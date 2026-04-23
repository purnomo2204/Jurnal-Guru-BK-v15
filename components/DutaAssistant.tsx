import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface DutaAssistantProps {
  studentsCount: number;
}

const DutaAssistant: React.FC<DutaAssistantProps> = ({ studentsCount }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: "Hallo saya Duta, saya asisten anda. Ada yang bisa saya bantu?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = "gemini-3-flash-preview";
      
      const systemInstruction = `
        Nama Anda adalah Duta, asisten virtual untuk aplikasi Jurnal Guru BK.
        Anda adalah seorang pria yang ramah, profesional, dan ahli dalam bidang Bimbingan Konseling (BK).
        Tugas Anda adalah:
        1. Menjawab pertanyaan seputar penggunaan aplikasi Jurnal Guru BK.
        2. Menjawab pertanyaan seputar teori, praktik, dan etika Bimbingan Konseling.
        3. Memberikan saran konstruktif bagi Guru BK dalam menangani berbagai kasus siswa.
        
        Konteks Aplikasi:
        - Aplikasi ini memiliki fitur: Database Siswa, Jurnal Harian, Catatan Prestasi, Catatan Kasus, Absensi, Jadwal Konseling, AKPD, Home Visit, Alih Tangan Kasus, Analitik Data, Laporan LPJ, Buku Pribadi, Peta Kerawanan, dan Kolaborasi Tim.
        - Jumlah siswa saat ini: ${studentsCount}.
        
        Gunakan bahasa Indonesia yang santun, empatik, dan mudah dipahami.
      `;

      // Add an empty assistant message to append the stream to
      setMessages(prev => [...prev, { role: 'assistant', content: "" }]);

      const stream = await ai.models.generateContentStream({
        model: model,
        contents: [...messages, { role: 'user', content: userMessage }].map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        })),
        config: {
          systemInstruction,
        }
      });

      for await (const chunk of stream) {
        const chunkText = chunk.text || "";
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content += chunkText;
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Error calling Gemini AI:", error);
      setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: "Maaf, terjadi kesalahan saat menghubungi server." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[2000] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="mb-4 w-72 sm:w-[345px] h-[500px] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border border-white/30">
                  <img 
                    src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/People%20with%20professions/Man%20Office%20Worker%20Light%20Skin%20Tone.png" 
                    alt="Duta" 
                    className="w-full h-full object-cover scale-125 translate-y-1"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h3 className="text-white font-black text-sm uppercase tracking-tight">Duta Assistant</h3>
                  <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest">Online</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-slate-100 text-slate-700 rounded-tl-none border border-slate-200'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 p-3 rounded-2xl rounded-tl-none border border-slate-200">
                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-slate-200">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Tanya Duta..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-4 pr-12 text-xs text-slate-800 outline-none focus:border-blue-500 transition-all"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white disabled:opacity-50 transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button / Avatar */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={!isOpen ? { y: [0, -10, 0] } : {}}
        transition={!isOpen ? { repeat: Infinity, duration: 2, ease: "easeInOut" } : {}}
        onClick={() => setIsOpen(!isOpen)}
        className="relative group"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative w-16 h-16 rounded-full bg-white border-2 border-blue-500 overflow-hidden shadow-xl flex items-center justify-center">
          <img 
            src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/People%20with%20professions/Man%20Office%20Worker%20Light%20Skin%20Tone.png" 
            alt="Duta" 
            className="w-full h-full object-cover scale-125 translate-y-1"
            referrerPolicy="no-referrer"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-blue-600/80 py-0.5">
            <p className="text-[8px] font-black text-white text-center uppercase tracking-tighter">Duta</p>
          </div>
        </div>
        {!isOpen && (
          <div className="absolute -top-2 -right-2 bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg animate-bounce">
            1
          </div>
        )}
      </motion.button>
    </div>
  );
};

export default DutaAssistant;
