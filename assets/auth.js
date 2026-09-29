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

async function loadFirebaseConfig() {
  const url = new URL(window.SSS.API_URL);
  url.searchParams.set("action", "firebaseConfig");
  const response = await fetch(url, { method: "GET", cache: "no-store" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok !== true || !payload.data) {
    throw new Error(payload.error || "Firebase configuration is unavailable");
  }
  return payload.data;
}

let config = {};
let configError = null;
try {
  config = await loadFirebaseConfig();
} catch (error) {
  configError = error;
  console.error("Firebase configuration failed to load", error);
}

const configured = Boolean(
  config.apiKey &&
  config.authDomain &&
  config.projectId &&
  config.appId
);

let auth = null;
let readyResolve;
const readyPromise = new Promise(resolve => { readyResolve = resolve; });

if (configured) {
  const app = initializeApp(config);
  auth = getAuth(app);
  await setPersistence(auth, browserSessionPersistence).catch(error => {
    console.warn("Firebase Auth persistence setup failed", error);
  });
  onAuthStateChanged(auth, user => readyResolve(user));
} else {
  readyResolve(null);
}

function ensureConfigured() {
  if (!configured) {
    throw new Error(configError?.message || "Firebase Auth is not configured yet");
  }
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
  ensureConfigured();
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) await updateProfile(credential.user, { displayName });
  await sendEmailVerification(credential.user);
  return credential.user;
}

async function login(email, password) {
  ensureConfigured();
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
  ensureConfigured();
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
