import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp({
  apiKey: firebaseConfig.apiKey.trim(),
  authDomain: firebaseConfig.authDomain?.trim() || `${firebaseConfig.projectId.trim()}.firebaseapp.com`,
  projectId: firebaseConfig.projectId.trim(),
  appId: firebaseConfig.appId?.trim(),
  messagingSenderId: firebaseConfig.messagingSenderId?.trim()
}) : getApp();

export const db: Firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
}, firebaseConfig.firestoreDatabaseId);

export const auth: Auth = getAuth(app);
