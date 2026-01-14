// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// Cloud Firestore
import { getFirestore } from "firebase/firestore";

// Authentication
import { getAuth } from "firebase/auth";

// Cloud Storage
import { getStorage } from "firebase/storage";

// AI-LEGO's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCJ8cbkQs2Avk8EsNZhAlk0j4mhGGFNcus",
  authDomain: "ai-lego.firebaseapp.com",
  projectId: "ai-lego",
  storageBucket: "ai-lego.appspot.com",
  messagingSenderId: "420213198892",
  appId: "1:420213198892:web:dee1a30862ab2fddc74189",
  measurementId: "G-V7B5B16YFP",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Firebase Auth
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
export { auth, app, db, storage };
