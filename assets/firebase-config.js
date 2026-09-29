// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCyThE_lX4DdUnbFYl4MrACA_ZXei2Wgrw",
  authDomain: "sss-attendance-prods.firebaseapp.com",
  projectId: "sss-attendance-prods",
  storageBucket: "sss-attendance-prods.firebasestorage.app",
  messagingSenderId: "458616437535",
  appId: "1:458616437535:web:09b342ab01e3e2acae8e2a",
  measurementId: "G-WCRM1TK3D3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);