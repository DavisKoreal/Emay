import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAjR8OCUeJMHlEeW-mOj6AUw8LM6JI8ds",
  authDomain: "m-duka-eedca.firebaseapp.com",
  projectId: "m-duka-eedca",
  storageBucket: "m-duka-eedca.appspot.com",
  messagingSenderId: "1090643805836",
  appId: "1:1090643805836:web:7f8cf6df71bbc4a7429da9",
  measurementId: "G-T7LEJMX7Z0"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore
const firestore = getFirestore(app);

// Initialize Auth
const auth = getAuth(app);

// Function to save the user's authentication state to AsyncStorage
const saveAuthState = async (user: any) => {
  if (user) {
    await AsyncStorage.setItem('authUser', JSON.stringify({
      uid: user.uid,
      email: user.email,
      // Add other user properties you want to persist
    }));
  } else {
    await AsyncStorage.removeItem('authUser');
  }
};

// Listener for auth state changes
onAuthStateChanged(auth, async (user) => {
  await saveAuthState(user);
});

export { app, firestore, auth, saveAuthState };