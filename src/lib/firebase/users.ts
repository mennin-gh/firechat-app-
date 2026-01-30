import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL ? : string;
  bio ? : string;
  phoneNumber ? : string;
  status: 'online' | 'away' | 'offline';
  lastSeen: any; // Firestore timestamp
  fcmToken ? : string;
  createdAt: any;
  updatedAt: any;
}

export const userService = {
  // Create or update user profile
  async createOrUpdateUser(uid: string, userData: Partial < UserProfile > ) {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    const data = {
      ...userData,
      updatedAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
      status: 'online'
    };
    
    if (userDoc.exists()) {
      await updateDoc(userRef, data);
    } else {
      await setDoc(userRef, {
        ...data,
        uid,
        createdAt: serverTimestamp()
      });
    }
  },
  
  // Update user status
  async updateUserStatus(uid: string, status: 'online' | 'away' | 'offline') {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      status,
      lastSeen: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  },
  
  // Get user by ID
  async getUser(uid: string): Promise < UserProfile | null > {
    const userRef = doc(db, 'users', uid);
    const snapshot = await getDoc(userRef);
    return snapshot.exists() ? snapshot.data() as UserProfile : null;
  },
  
  // Get all users (except current user)
  async getAllUsers(excludeUid: string): Promise < UserProfile[] > {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('uid', '!=', excludeUid));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => doc.data() as UserProfile);
  },
  
  // Listen to user presence changes
  onUserPresenceChange(uid: string, callback: (user: UserProfile | null) => void) {
    const userRef = doc(db, 'users', uid);
    return onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as UserProfile);
      } else {
        callback(null);
      }
    });
  },
  
  // Search users by name or email
  async searchUsers(searchTerm: string, currentUserId: string): Promise < UserProfile[] > {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    return snapshot.docs
      .map(doc => doc.data() as UserProfile)
      .filter(user =>
        user.uid !== currentUserId &&
        (
          user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
  }
};