import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

const config = window.SSS_FIREBASE_CONFIG || {};
const configured = Boolean(config.apiKey && !String(config.apiKey).startsWith("PASTE_") && config.appId && !String(config.appId).startsWith("PASTE_"));
let auth = null;
let readyResolve;
const readyPromise = new Promise(resolve => { readyResolve = resolve; });

if (configured) {
  const app = initializeApp(config);
  auth = getAuth(app);
  setPersistence(auth, browserSessionPersistence).catch(console.warn);
  onAuthStateChanged(auth, user => readyResolve(user));
} else {
  console.error("Firebase Auth is not configured. Fill assets/firebase-config.js first.");
  readyResolve(null);
}

async function ready() {
  await readyPromise;
  return auth?.currentUser || null;
}

async function idToken(forceRefresh = false) {
  const user = await ready();
  if (!user) return "";
  return user.getIdToken(forceRefresh);
}

async function register({ email, password, displayName }) {
  if (!configured) throw new Error("Firebase Auth is not configured yet");
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) await updateProfile(credential.user, { displayName });
  await sendEmailVerification(credential.user);
  return credential.user;
}

async function login(email, password) {
  if (!configured) throw new Error("Firebase Auth is not configured yet");
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

async function logout() {
  if (auth) await signOut(auth);
}

async function resendVerification() {
  const user = await ready();
  if (!user) throw new Error("Sign in first");
  await sendEmailVerification(user);
}

async function resetPassword(email) {
  if (!configured) throw new Error("Firebase Auth is not configured yet");
  await sendPasswordResetEmail(auth, email);
}

window.SSSAuth = {
  configured,
  ready,
  idToken,
  register,
  login,
  logout,
  resendVerification,
  resetPassword,
  currentUser: () => auth?.currentUser || null
};
