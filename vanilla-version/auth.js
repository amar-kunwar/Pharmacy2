// ===================================================
//  auth.js – PharmaBill Authentication
// ===================================================

let currentUser = null;

// ─── Boot: check session ─────────────────────────
async function initAuth() {
  const { data: { session } } = await sb.auth.getSession();
  if (session?.user) {
    currentUser = session.user;
    showApp();
  } else {
    showLogin();
  }

  // Listen for auth state changes (OAuth redirect, logout, etc.)
  sb.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      currentUser = session.user;
      showApp();
    } else {
      currentUser = null;
      showLogin();
    }
  });
}

// ─── UI toggling ─────────────────────────────────
function showLogin() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app-wrapper').style.display  = 'none';
  clearAuthError();
  setAuthTab('login');
}

function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-wrapper').style.display  = 'flex';
  // Set user email in sidebar
  const emailEl = document.getElementById('user-email-display');
  if (emailEl && currentUser) emailEl.textContent = currentUser.email || 'Logged in';
  // Load settings & re-init app data from Supabase
  if (typeof initAppData === 'function') initAppData();
}

// ─── Tab switching ───────────────────────────────
function setAuthTab(tab) {
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-signup').classList.toggle('active', tab === 'signup');
  document.getElementById('login-form').style.display  = tab === 'login'  ? 'flex' : 'none';
  document.getElementById('signup-form').style.display = tab === 'signup' ? 'flex' : 'none';
  clearAuthError();
}

// ─── Email / Password Login ──────────────────────
async function doLogin() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || !password) { showAuthError('Please enter email and password.'); return; }

  setAuthLoading(true);
  const { error } = await sb.auth.signInWithPassword({ email, password });
  setAuthLoading(false);
  if (error) showAuthError(error.message);
}

// ─── Email / Password Sign Up ────────────────────
async function doSignup() {
  const email    = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const confirm  = document.getElementById('signup-confirm').value;
  if (!email || !password) { showAuthError('Please enter email and password.'); return; }
  if (password !== confirm) { showAuthError('Passwords do not match.'); return; }
  if (password.length < 6)  { showAuthError('Password must be at least 6 characters.'); return; }

  setAuthLoading(true);
  const { error } = await sb.auth.signUp({ email, password });
  setAuthLoading(false);
  if (error) {
    showAuthError(error.message);
  } else {
    showAuthError('✅ Account created! Check your email to confirm, then log in.', 'success');
    setAuthTab('login');
  }
}

// ─── Google SSO ──────────────────────────────────
async function doGoogleLogin() {
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.href }
  });
  if (error) showAuthError(error.message);
}

// ─── Logout ──────────────────────────────────────
async function doLogout() {
  await sb.auth.signOut();
  showLogin();
}

// ─── Helpers ─────────────────────────────────────
function showAuthError(msg, type = 'error') {
  const el = document.getElementById('auth-error');
  el.textContent  = msg;
  el.className    = `auth-error show ${type}`;
}
function clearAuthError() {
  const el = document.getElementById('auth-error');
  el.textContent = '';
  el.className   = 'auth-error';
}
function setAuthLoading(loading) {
  document.getElementById('btn-login').disabled  = loading;
  document.getElementById('btn-signup').disabled = loading;
  document.getElementById('btn-google').disabled = loading;
}

// Keyboard shortcuts on login forms
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-password')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
  });
  document.getElementById('signup-confirm')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') doSignup();
  });
  initAuth();
});
