import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDOuSiGxz95-YkU2MzjFUXzVu_X6Ggz0sA',
  authDomain: 'kalorikollen-faac8.firebaseapp.com',
  projectId: 'kalorikollen-faac8',
  storageBucket: 'kalorikollen-faac8.firebasestorage.app',
  messagingSenderId: '972695867575',
  appId: '1:972695867575:web:7553a5200ed4b94d7b7d32',
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

const USER_ID_KEY = 'kalorikollen-anon-user-id';

export function getOrCreateUserId() {
  try {
    let id = localStorage.getItem(USER_ID_KEY);
    if (!id) {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        id = crypto.randomUUID();
      } else {
        id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      }
      localStorage.setItem(USER_ID_KEY, id);
    }
    return id;
  } catch (error) {
    // Fallback om localStorage inte är tillgängligt
    return 'anonymous';
  }
}

