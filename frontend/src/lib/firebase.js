import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth"
import { getAnalytics } from "firebase/analytics"

const firebaseConfig = {
    apiKey: "AIzaSyDqrUCdnYTi0eI8st4fOzLG3uPREcK9DTU",
    authDomain: "scholar-sync-07.firebaseapp.com",
    projectId: "scholar-sync-07",
    storageBucket: "scholar-sync-07.firebasestorage.app",
    messagingSenderId: "900156323413",
    appId: "1:900156323413:web:97a477cd77f65bb3d246dc",
    measurementId: "G-QKQXDP6NMP"
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()

let analytics = null
if (typeof window !== 'undefined') {
    analytics = getAnalytics(app)
}

export {
    auth,
    googleProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    analytics
}
