import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  User,
  UserCredential
} from 'firebase/auth';
import { auth } from './config'; // You'll need to export `auth` from config.ts

const googleProvider = new GoogleAuthProvider();

export const authService = {
  // Email/Password Sign Up
  async signUpWithEmail(email: string, password: string, displayName: string): Promise < UserCredential > {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    return userCredential;
  },
  
  // Email/Password Login
  loginWithEmail(email: string, password: string): Promise < UserCredential > {
    return signInWithEmailAndPassword(auth, email, password);
  },
  
  // Google Sign-In
  loginWithGoogle(): Promise < UserCredential > {
    return signInWithPopup(auth, googleProvider);
  },
  
  // Logout
  logout(): Promise < void > {
    return signOut(auth);
  },
  
  // Get current user
  getCurrentUser(): User | null {
    return auth.currentUser;
  }
};