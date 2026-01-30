import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
  signOut,
  updateProfile,
  UserCredential
} from 'firebase/auth';
import { auth } from './config';
import { userService } from './users';

const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();
const twitterProvider = new TwitterAuthProvider();

// Helper function to update Firestore user profile
const updateFirestoreUser = async (userCredential: UserCredential, displayName ? : string) => {
  const { user } = userCredential;
  
  await userService.createOrUpdateUser(user.uid, {
    uid: user.uid,
    email: user.email || '',
    displayName: displayName || user.displayName || user.email?.split('@')[0] || 'User',
    photoURL: user.photoURL || undefined,
    status: 'online',
    lastSeen: new Date() // Will be converted to Firestore timestamp in service
  });
  
  return userCredential;
};

export const AuthService = {
  // Email/Password Auth
  loginWithEmail: async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await updateFirestoreUser(userCredential);
    return userCredential;
  },
  
  signupWithEmail: async (email: string, password: string, displayName: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update Firebase auth profile
    await updateProfile(userCredential.user, { displayName });
    
    // Update Firestore user profile
    await updateFirestoreUser(userCredential, displayName);
    
    return userCredential;
  },
  
  // Social Logins
  loginWithGoogle: async () => {
    const userCredential = await signInWithPopup(auth, googleProvider);
    await updateFirestoreUser(userCredential);
    return userCredential;
  },
  
  loginWithFacebook: async () => {
    const userCredential = await signInWithPopup(auth, facebookProvider);
    await updateFirestoreUser(userCredential);
    return userCredential;
  },
  
  loginWithTwitter: async () => {
    const userCredential = await signInWithPopup(auth, twitterProvider);
    await updateFirestoreUser(userCredential);
    return userCredential;
  },
  
  // Account Management
  logout: async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      await userService.updateUserStatus(currentUser.uid, 'offline');
    }
    await signOut(auth);
  },
  
  updateUserProfile: async (updates: { displayName ? : string;photoURL ? : string }) => {
    if (!auth.currentUser) throw new Error('No user logged in');
    
    await updateProfile(auth.currentUser, updates);
    
    // Also update Firestore
    await userService.createOrUpdateUser(auth.currentUser.uid, updates);
  }
};