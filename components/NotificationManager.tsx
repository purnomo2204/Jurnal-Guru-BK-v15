import React, { useState, useEffect } from 'react';
import { Firestore, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  scheduledTime: any; // Firestore Timestamp
  isRead: boolean;
  type: string;
}

interface NotificationManagerProps {
  db: Firestore | null;
  auth: Auth | null;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({ db, auth }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!db || !auth?.currentUser) return;

    const q = query(
      collection(db, `teachers/${auth.currentUser.uid}/notifications`),
      orderBy('scheduledTime', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      setNotifications(newNotifications);
      
      // Check for new notifications due
      newNotifications.forEach(n => {
        if (!n.isRead && n.scheduledTime?.toDate() <= new Date()) {
          toast.info(n.title, { description: n.message });
        }
      });
    });

    return () => unsubscribe();
  }, [db, auth]);

  return (
    <div className="relative">
      <Bell className="w-5 h-5 text-slate-600 cursor-pointer" />
      {notifications.filter(n => !n.isRead).length > 0 && (
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
      )}
    </div>
  );
};
