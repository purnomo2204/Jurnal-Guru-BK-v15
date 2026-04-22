import React, { useState } from 'react';
import { Firestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationCreatorProps {
  db: Firestore | null;
  auth: Auth | null;
}

export const NotificationCreator: React.FC<NotificationCreatorProps> = ({ db, auth }) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  const handleCreate = async () => {
    if (!db || !auth?.currentUser) return;

    try {
      await addDoc(collection(db, `teachers/${auth.currentUser.uid}/notifications`), {
        userId: auth.currentUser.uid,
        title,
        message,
        scheduledTime: Timestamp.fromDate(new Date(scheduledTime)),
        isRead: false,
        type: 'reminder'
      });
      toast.success('Notification scheduled!');
      setTitle('');
      setMessage('');
      setScheduledTime('');
    } catch (error) {
      console.error(error);
      toast.error('Failed to schedule notification');
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Judul Notifikasi</label>
        <input 
          type="text" 
          placeholder="Contoh: Pengingat Rapat" 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          className="w-full input-cyber rounded-xl p-2.5 text-[10px] font-bold outline-none focus:border-emerald-500 transition-all text-slate-800" 
        />
      </div>
      
      <div className="space-y-1">
        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Isi Pesan</label>
        <textarea 
          placeholder="Tulis pesan Anda di sini..." 
          value={message} 
          onChange={e => setMessage(e.target.value)} 
          className="w-full input-cyber rounded-xl p-2.5 text-[10px] font-bold outline-none focus:border-emerald-500 transition-all text-slate-800 min-h-[80px] resize-none" 
        />
      </div>
      
      <div className="space-y-1">
        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Waktu Penjadwalan</label>
        <input 
          type="datetime-local" 
          value={scheduledTime} 
          onChange={e => setScheduledTime(e.target.value)} 
          className="w-full input-cyber rounded-xl p-2.5 text-[10px] font-bold outline-none focus:border-emerald-500 transition-all text-slate-800" 
        />
      </div>
      
      <button 
        onClick={handleCreate} 
        disabled={!title || !message || !scheduledTime}
        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-xl font-black uppercase tracking-widest text-[10px] text-white shadow-lg transition-all flex items-center justify-center gap-2 border border-emerald-700"
      >
        <Bell className="w-4 h-4" /> Jadwalkan Notifikasi
      </button>
    </div>
  );
};
