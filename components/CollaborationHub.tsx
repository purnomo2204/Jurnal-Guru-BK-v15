import React, { useState, useEffect, useRef } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { Firestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, where, limit } from 'firebase/firestore';
import { TeacherData, ViewMode } from '../types';
import { ArrowLeft, Send, MessageSquare, Users, Share2, Clock, User, Flame, Lock, Plus, FileText, X, Check, Unlink, Info, ExternalLink, LogIn } from 'lucide-react';

interface CollaborationHubProps {
  db: Firestore | null;
  currentUser: FirebaseUser | null;
  teacherData: TeacherData;
  setView: (view: ViewMode) => void;
  showNotification: (msg: string, type: 'success' | 'error' | 'info' | 'loading') => void;
  onLogin: () => void;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  timestamp: any;
  type: 'chat' | 'system';
}

interface SharedItem {
  id: string;
  title: string;
  type: 'journal' | 'note' | 'plan';
  author: string;
  content: string;
  timestamp: any;
  comments?: number;
}

const GuideModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-white/60 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="bg-white border border-slate-100 rounded-[2rem] max-w-2xl w-full p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
      <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full text-slate-500 hover:text-slate-600 hover:bg-slate-100 transition-all">
        <X className="w-5 h-5" />
      </button>
      
      <div className="mb-8">
        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Panduan Singkat</h3>
        <p className="text-slate-500 text-sm">Cara mudah berkolaborasi dengan rekan guru BK lainnya.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 font-bold text-lg border border-blue-100">1</div>
            <div>
              <h4 className="text-slate-800 font-bold text-sm uppercase tracking-wider mb-1">Diskusi Tim</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Gunakan menu <strong>Diskusi Tim</strong> untuk mengobrol santai. Pesan Anda akan terbaca oleh semua guru yang terhubung.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 font-bold text-lg border border-emerald-100">2</div>
            <div>
              <h4 className="text-slate-800 font-bold text-sm uppercase tracking-wider mb-1">Berbagi File</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Klik menu <strong>File Bersama</strong> lalu tekan tombol <span className="inline-block bg-orange-600 text-white px-1.5 py-0.5 rounded text-[8px] mx-1"><Plus className="w-2 h-2 inline" /></span> untuk membagikan catatan kasus atau rencana layanan.</p>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 font-bold text-lg border border-purple-100">3</div>
            <div>
              <h4 className="text-slate-800 font-bold text-sm uppercase tracking-wider mb-1">Buka & Komentar</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Klik salah satu item di daftar <strong>File Bersama</strong> untuk membaca isinya. Anda bisa menulis komentar atau saran di kolom bawah.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 font-bold text-lg border border-rose-100">4</div>
            <div>
              <h4 className="text-slate-800 font-bold text-sm uppercase tracking-wider mb-1">Real-Time</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Semua pesan dan komentar muncul secara langsung (live) tanpa perlu refresh halaman.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
        <button onClick={onClose} className="px-8 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg">
          Saya Mengerti
        </button>
      </div>
    </div>
  </div>
);

const CollaborationHub: React.FC<CollaborationHubProps> = ({ db, currentUser, teacherData, setView, showNotification, onLogin }) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'shared'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sharedItems, setSharedItems] = useState<SharedItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<SharedItem | null>(null);
  const [itemComments, setItemComments] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newComment, setNewComment] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!db || !currentUser) return;

    // Listen to Chat Messages
    const q = query(collection(db, 'public_chat'), orderBy('timestamp', 'asc'), limit(50));
    const unsubscribeChat = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      setMessages(msgs);
      scrollToBottom();
    }, (error) => {
      console.error("Chat error:", error);
      showNotification("Gagal memuat diskusi tim.", "error");
    });

    // Listen to Shared Items
    const qShared = query(collection(db, 'shared_items'), orderBy('timestamp', 'desc'), limit(20));
    const unsubscribeShared = onSnapshot(qShared, (snapshot) => {
      const items: SharedItem[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as SharedItem);
      });
      setSharedItems(items);
    }, (error) => {
      console.error("Shared items error:", error);
      showNotification("Gagal memuat file bersama.", "error");
    });

    return () => {
      unsubscribeChat();
      unsubscribeShared();
    };
  }, [db]);

  useEffect(() => {
    if (!db || !selectedItem || !currentUser) return;

    const qComments = query(collection(db, `shared_items/${selectedItem.id}/comments`), orderBy('timestamp', 'asc'));
    const unsubscribeComments = onSnapshot(qComments, (snapshot) => {
      const comments: any[] = [];
      snapshot.forEach((doc) => {
        comments.push({ id: doc.id, ...doc.data() });
      });
      setItemComments(comments);
    }, (error) => {
      console.error("Comments error:", error);
      showNotification("Gagal memuat komentar.", "error");
    });

    return () => unsubscribeComments();
  }, [db, selectedItem]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !db) return;

    try {
      await addDoc(collection(db, 'public_chat'), {
        text: newMessage,
        sender: teacherData.name || 'Anonymous Teacher',
        timestamp: serverTimestamp(),
        type: 'chat'
      });
      setNewMessage('');
    } catch (error: any) {
      console.error("Error sending message:", error);
      showNotification("Gagal mengirim pesan: " + error.message, "error");
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !db || !selectedItem) return;

    try {
      await addDoc(collection(db, `shared_items/${selectedItem.id}/comments`), {
        text: newComment,
        sender: teacherData.name || 'Anonymous Teacher',
        timestamp: serverTimestamp()
      });
      setNewComment('');
    } catch (error: any) {
      console.error("Error sending comment:", error);
      showNotification("Gagal mengirim komentar: " + error.message, "error");
    }
  };

  const handleShareNote = async () => {
    if (!db) return;
    const title = prompt("Judul Catatan / Rencana:");
    if (!title) return;
    const content = prompt("Isi Catatan:");
    if (!content) return;

    try {
      await addDoc(collection(db, 'shared_items'), {
        title,
        content,
        type: 'plan',
        author: teacherData.name || 'Anonymous',
        authorUid: currentUser?.uid || 'global',
        timestamp: serverTimestamp(),
        comments: 0
      });
      showNotification("Item berhasil dibagikan!", "success");
    } catch (error: any) {
      console.error("Error sharing item:", error);
      showNotification("Gagal membagikan item: " + error.message, "error");
    }
  };

  if (!db || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center space-y-8">
        <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center border border-orange-100 shadow-2xl animate-pulse">
          {!db ? <Flame className="w-12 h-12 text-orange-500" /> : <Lock className="w-12 h-12 text-orange-500" />}
        </div>
        <div className="space-y-4 max-w-md">
          <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">
            {!db ? 'Fitur Belum Aktif' : 'Akses Terbatas'}
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            {!db 
              ? 'Untuk menggunakan fitur Kolaborasi Real-Time, Anda perlu menghubungkan aplikasi ini dengan Firebase Database.'
              : 'Silakan login dengan akun Google Anda untuk mengakses Ruang Kolaborasi dan berdiskusi dengan rekan guru lainnya.'}
          </p>
          <p className="text-orange-600 text-xs font-bold uppercase tracking-wider bg-orange-50 p-3 rounded-lg border border-orange-100">
            {!db 
              ? 'Fitur KONFIGURASI memungkinkan anda untuk berkolaborasi dengan teman sejawat'
              : 'Keamanan data adalah prioritas kami. Login diperlukan untuk identitas pengirim pesan.'}
          </p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setView(ViewMode.HOME)} className="px-8 py-4 rounded-2xl bg-white text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all border border-slate-200 shadow-sm">
            Kembali
          </button>
          {!db ? (
            <>
              <button onClick={() => setShowGuide(true)} className="px-8 py-4 rounded-2xl bg-white text-slate-600 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all border border-slate-200 flex items-center gap-2 shadow-sm">
                <Info className="w-4 h-4" /> Panduan
              </button>
              <button onClick={() => setView(ViewMode.SETTINGS)} className="px-8 py-4 rounded-2xl bg-orange-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-orange-500 transition-all shadow-lg shadow-orange-600/20">
                Konfigurasi Sekarang
              </button>
            </>
          ) : (
            <button onClick={onLogin} className="px-8 py-4 rounded-2xl bg-orange-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-orange-500 transition-all shadow-lg shadow-orange-600/20 flex items-center gap-2">
              <LogIn className="w-4 h-4" /> Login dengan Google
            </button>
          )}
        </div>
        {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-orange-500/30">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
            <button onClick={() => setView(ViewMode.HOME)} className="p-4 bg-white rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all group shadow-sm">
              <ArrowLeft className="w-6 h-6 text-slate-500 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-[10px] font-black text-orange-600 uppercase tracking-widest">
                  Live Collaboration
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Online</span>
                </div>
              </div>
              <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none">Ruang <span className="text-slate-500 font-light italic">Kolaborasi</span></h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={() => setShowGuide(true)} className="flex items-center gap-2 px-5 py-3 bg-white rounded-xl text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-all border border-slate-200 shadow-sm">
              <Info className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Panduan</span>
            </button>
            <div className="flex items-center gap-4 bg-white p-2 pr-6 rounded-full border border-slate-100 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold shadow-lg">
                {teacherData.name ? teacherData.name.charAt(0) : <User className="w-5 h-5" />}
              </div>
              <div className="text-xs">
                <p className="font-bold text-slate-800">{teacherData.name || 'Anonymous'}</p>
                <p className="text-slate-500">{teacherData.school || 'Guru BK'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-200px)]">
          {/* Sidebar / Menu */}
          <div className="lg:col-span-1 space-y-6 flex flex-col">
            <div className="bg-white p-2 rounded-[2rem] border border-slate-100 flex shadow-sm">
              <button 
                onClick={() => setActiveTab('chat')} 
                className={`flex-1 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'chat' ? 'bg-slate-100 text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-600'}`}
              >
                <MessageSquare className="w-4 h-4" /> Diskusi Tim
              </button>
              <button 
                onClick={() => setActiveTab('shared')} 
                className={`flex-1 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'shared' ? 'bg-slate-100 text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-600'}`}
              >
                <Share2 className="w-4 h-4" /> File Bersama
              </button>
            </div>

            {activeTab === 'chat' ? (
              <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 flex flex-col overflow-hidden shadow-sm relative">
                <div className="p-6 border-b border-slate-50 bg-white/80 backdrop-blur-sm absolute top-0 w-full z-10">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <Users className="w-4 h-4 text-orange-500" /> Public Chat Room
                  </h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 pt-20 space-y-6 custom-scrollbar">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.sender === teacherData.name ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${msg.sender === teacherData.name ? 'bg-orange-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-700 rounded-tl-none border border-slate-200'}`}>
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-slate-500 mt-1 font-bold uppercase tracking-wider px-2">
                        {msg.sender === teacherData.name ? 'Anda' : msg.sender} • {msg.timestamp?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-4 bg-slate-50 border-t border-slate-100 backdrop-blur-md">
                  <div className="relative">
                    <input 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Ketik pesan..." 
                      className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-6 pr-14 text-xs text-slate-800 outline-none focus:border-orange-500 transition-all shadow-sm"
                    />
                    <button type="submit" disabled={!newMessage.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-orange-600 rounded-xl text-white hover:bg-orange-500 disabled:opacity-50 disabled:hover:bg-orange-600 transition-all">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 flex flex-col overflow-hidden shadow-sm">
                 <div className="p-6 border-b border-slate-50 bg-white/80 backdrop-blur-sm flex justify-between items-center">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <FileText className="w-4 h-4 text-orange-500" /> Shared Items
                  </h3>
                  <button onClick={handleShareNote} className="p-2 bg-orange-600 rounded-lg text-white hover:bg-orange-500 transition-all">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                  {sharedItems.length === 0 && (
                    <div className="text-center py-10 opacity-50">
                      <Share2 className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                      <p className="text-xs text-slate-500">Belum ada item yang dibagikan</p>
                    </div>
                  )}
                  {sharedItems.map(item => (
                    <div key={item.id} onClick={() => setSelectedItem(item)} className={`p-5 rounded-2xl border transition-all group cursor-pointer ${selectedItem?.id === item.id ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-100 hover:border-orange-200'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-wider ${item.type === 'plan' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          {item.type}
                        </span>
                        <span className="text-[9px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {item.timestamp?.toDate().toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className={`text-sm font-bold mb-1 transition-colors ${selectedItem?.id === item.id ? 'text-orange-600' : 'text-slate-800 group-hover:text-orange-600'}`}>{item.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-3">{item.content}</p>
                      <div className="flex items-center gap-2 text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                        <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-[8px]">{item.author.charAt(0)}</div>
                        {item.author}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Content Area (For Joint Planning / Details) */}
          <div className="lg:col-span-2 bg-white rounded-[3rem] border border-slate-100 p-8 flex flex-col relative overflow-hidden h-full shadow-sm">
             {selectedItem ? (
               <div className="flex flex-col h-full relative z-10">
                 <div className="flex justify-between items-start mb-6 border-b border-slate-50 pb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedItem.type === 'plan' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          {selectedItem.type}
                        </span>
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {selectedItem.timestamp?.toDate().toLocaleDateString()}
                        </span>
                      </div>
                      <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-tight">{selectedItem.title}</h2>
                      <p className="text-xs text-slate-500 mt-2 font-bold uppercase tracking-wider">Oleh: {selectedItem.author}</p>
                    </div>
                    <button onClick={() => setSelectedItem(null)} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all text-slate-500">
                      <X className="w-5 h-5" />
                    </button>
                 </div>

                 <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pr-4">
                    <div className="max-w-none">
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedItem.content}</p>
                    </div>

                    <div className="pt-8 border-t border-slate-50">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-orange-500" /> Komentar & Diskusi
                      </h3>
                      
                      <div className="space-y-4 mb-6">
                        {itemComments.length === 0 && <p className="text-xs text-slate-500 italic">Belum ada komentar.</p>}
                        {itemComments.map(comment => (
                          <div key={comment.id} className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200">
                              {comment.sender.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-slate-800">{comment.sender}</span>
                                <span className="text-[9px] text-slate-500">{comment.timestamp?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed">{comment.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <form onSubmit={handleSendComment} className="flex gap-3">
                        <input 
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Tulis komentar..."
                          className="flex-1 bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs text-slate-800 outline-none focus:border-orange-500 transition-all shadow-sm"
                        />
                        <button type="submit" disabled={!newComment.trim()} className="p-3 bg-orange-600 rounded-xl text-white hover:bg-orange-500 disabled:opacity-50 transition-all">
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                 </div>
               </div>
             ) : (
               <div className="flex flex-col items-center justify-center text-center h-full space-y-6 relative z-10">
                 <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none" />
                 
                 <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 shadow-sm relative z-10">
                    <Users className="w-10 h-10 text-slate-600" />
                 </div>
                 <div className="max-w-md space-y-2 relative z-10">
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Area Kerja Bersama</h2>
                    <p className="text-sm text-slate-500 leading-relaxed">Pilih item dari daftar "File Bersama" untuk melihat detail atau memulai perencanaan bersama. Fitur ini memungkinkan Anda mengedit dokumen secara kolaboratif.</p>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4 mt-8 w-full max-w-lg relative z-10">
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                       <h3 className="text-2xl font-black text-slate-800 mb-1">{messages.length}</h3>
                       <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Pesan Terkirim</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                       <h3 className="text-2xl font-black text-slate-800 mb-1">{sharedItems.length}</h3>
                       <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Item Dibagikan</p>
                    </div>
                 </div>
               </div>
             )}
          </div>
        </div>

        {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
      </div>
    </div>
  );
};

export default CollaborationHub;
