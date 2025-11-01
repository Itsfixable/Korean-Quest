// ../js/main/auth.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut,
  GoogleAuthProvider, signInWithPopup
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

/* 1) Replace with your Firebase values */
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const provider = new GoogleAuthProvider();

/* 2) Helpers */
const $ = id => document.getElementById(id);
const loginBtn  = $('loginBtn');
const logoutBtn = $('logoutBtn');
const userBadge = $('userBadge');

let modal = $('authModal');
if (!modal) {
  // Optional: inject the modal if the page didn’t include it
  document.body.insertAdjacentHTML('beforeend', `
    <div id="authModal" class="modal" hidden>
      <div class="modal-card">
        <h3>Sign in</h3>
        <form id="authForm">
          <label>Email</label><input id="authEmail" type="email" required />
          <label>Password</label><input id="authPass" type="password" required minlength="6" />
          <div class="row">
            <button id="emailSignIn" class="btn primary" type="submit">Sign in</button>
            <button id="emailSignUp" class="btn secondary" type="button">Create account</button>
          </div>
        </form>
        <div class="row">
          <button id="googleBtn" class="btn" type="button">Continue with Google</button>
          <button id="authClose" class="btn" type="button">Close</button>
        </div>
        <p id="authMsg" class="muted" aria-live="polite"></p>
      </div>
    </div>`);
  modal = $('authModal');
}

const emailEl = $('authEmail'), passEl = $('authPass');
const msgEl = $('authMsg'), closeEl = $('authClose');
const signUpEl = $('emailSignUp'), googleEl = $('googleBtn'), form = $('authForm');

export const getUser = () => auth.currentUser;
export function requireAuth(orOpenModal = true){
  if (!auth.currentUser && orOpenModal) $('loginBtn')?.click();
  return !!auth.currentUser;
}
function openModal(){ modal.hidden = false; emailEl?.focus(); }
function closeModal(){ modal.hidden = true; if (msgEl) msgEl.textContent = ''; }

/* 3) Wire */
loginBtn && (loginBtn.onclick = openModal);
logoutBtn && (logoutBtn.onclick = async () => { await signOut(auth); });

closeEl && (closeEl.onclick = closeModal);
googleEl && (googleEl.onclick = async () => {
  try { await signInWithPopup(auth, provider); closeModal(); }
  catch(e){ msgEl.textContent = e.message; }
});
form && form.addEventListener('submit', async (e) => {
  e.preventDefault();
  try { await signInWithEmailAndPassword(auth, emailEl.value, passEl.value); closeModal(); }
  catch(e){ msgEl.textContent = e.message; }
});
signUpEl && signUpEl.addEventListener('click', async () => {
  try { await createUserWithEmailAndPassword(auth, emailEl.value, passEl.value); closeModal(); }
  catch(e){ msgEl.textContent = e.message; }
});

/* 4) Auth state → nav UI */
onAuthStateChanged(auth, (user) => {
  const name = user?.displayName || user?.email || '';
  if (user){
    if (userBadge) userBadge.textContent = `Signed in as ${name}`;
    if (loginBtn)  loginBtn.hidden = true;
    if (logoutBtn) logoutBtn.hidden = false;
    document.body.classList.add('authed');
  } else {
    if (userBadge) userBadge.textContent = '';
    if (loginBtn)  loginBtn.hidden = false;
    if (logoutBtn) logoutBtn.hidden = true;
    document.body.classList.remove('authed');
  }
  console.log('[KQ] auth state:', user ? 'signed-in' : 'signed-out');
});

console.log('[KQ] auth.js ready');
