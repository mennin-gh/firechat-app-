import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// REPLACE THESE VALUES WITH YOUR ACTUAL FIREBASE CONFIG FROM STEP 2
export const firebaseConfig = {
  apiKey: "AIzaSyDk2162LJTRPRKtNPjwK1wdIuXGXG6JScA",
  authDomain: "firechat-pro-52ed5.firebaseapp.com",
  projectId: "firechat-pro-52ed5",
  storageBucket: "firechat-pro-52ed5.firebasestorage.app",
  messagingSenderId: "828493856491",
  appId: "1:828493856491:web:8e4fb3346512d9179988ae"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export initialized services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Export the config for use in other services if needed
export default app;