import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCWp6dqShdHCCtvLlJA03QMMqqb6LSePSU",
  authDomain: "lemhand-6de2a.firebaseapp.com",
  databaseURL: "https://lemhand-6de2a-default-rtdb.firebaseio.com",
  projectId: "lemhand-6de2a",
  storageBucket: "lemhand-6de2a.appspot.com",
  messagingSenderId: "148302455321",
  appId: "1:148302455321:web:4f899d96f460842e868088",
  measurementId: "G-M96JLWHLSP"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
