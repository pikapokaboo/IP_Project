const disclaimer = document.getElementById("disclaimer");
const logo1 = document.getElementById("logo1");
const logo2 = document.getElementById("logo2");
const login = document.getElementById("loginScreen");
const signup = document.getElementById("signupScreen");
const goToSignup = document.getElementById("goToSignup");
const backToLogin = document.getElementById("backToLogin");
const loginUser = document.getElementById("loginUser");
const loginPass = document.getElementById("loginPass");
const loginSubmit = document.getElementById("loginSubmit");
const signupUser = document.getElementById("signupUser");
const signupPass = document.getElementById("signupPass");
const signupPass2 = document.getElementById("signupPass2");
const signupSubmit = document.getElementById("signupSubmit");

/* ===== Dev (no RestDB) ===== */
const DEV_MODE = true;
const DEV_ACCOUNT = { username: "dev", password: "dev123" };

/* ===== RestDB (only used when DEV_MODE=false) ===== */
const RESTDB_BASE = "https://thearchive-6738.restdb.io/rest";
const COLLECTION = "accounts";
const CORS_API_KEY = "698167a3bf4bccff6a53e43f";

/* ===== UI helpers ===== */
function show(el) { el.classList.add("show"); el.classList.remove("hide"); }
function hide(el) { el.classList.add("hide"); el.classList.remove("show"); }

function setBusy(isBusy) {
  loginSubmit.disabled = isBusy;
  signupSubmit.disabled = isBusy;
  goToSignup.disabled = isBusy;
  backToLogin.disabled = isBusy;
}

/* ===== Cutscene / skipIntro ===== */
const params = new URLSearchParams(window.location.search);
const skipIntro = params.get("skipIntro") === "1";

hide(disclaimer); hide(logo1); hide(logo2); hide(login); hide(signup);
logo2.classList.remove("move-up");

if (skipIntro) {
  show(logo2);
  setTimeout(() => logo2.classList.add("move-up"), 4000);
  setTimeout(() => { show(login); hide(signup); }, 5500);
  window.history.replaceState({}, document.title, window.location.pathname);
} else {
  show(disclaimer);
  setTimeout(() => hide(disclaimer), 4500);

  setTimeout(() => show(logo1), 6000);
  setTimeout(() => hide(logo1), 10000);

  setTimeout(() => show(logo2), 11500);
  setTimeout(() => logo2.classList.add("move-up"), 15500);

  setTimeout(() => { show(login); hide(signup); }, 16500);
}

/* ===== Screen switching ===== */
goToSignup.addEventListener("click", () => { hide(login); show(signup); });
backToLogin.addEventListener("click", () => { hide(signup); show(login); });

/* ===== Crypto ===== */
async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/* ===== Dev login ===== */
function devLogin(username) {
  localStorage.setItem("currentUser", username);
  window.location.href = "home.html";
}

/* ===== RestDB helpers ===== */
async function restdbFetch(path, options = {}) {
  const url = `${RESTDB_BASE}/${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-apikey": CORS_API_KEY,
      ...(options.headers || {})
    }
  });

  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    const msg = (data && (data.msg || data.message)) ? (data.msg || data.message) : `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data;
}

async function findAccount(username) {
  const q = encodeURIComponent(JSON.stringify({ username }));
  const results = await restdbFetch(`${COLLECTION}?q=${q}`, { method: "GET" });
  return Array.isArray(results) && results.length ? results[0] : null;
}

/* ===== Signup ===== */
signupSubmit.addEventListener("click", async () => {
  const username = signupUser.value.trim();
  const pass = signupPass.value;
  const pass2 = signupPass2.value;

  if (!username || !pass || !pass2) return alert("Please fill in all fields.");
  if (pass !== pass2) return alert("Passwords do not match.");

  // Dev mode: block RestDB entirely
  if (DEV_MODE) {
    return alert("DEV_MODE is ON.\nSignup is disabled to save API quota.\nUse dev / dev123 to login.");
  }

  try {
    setBusy(true);

    const existing = await findAccount(username);
    if (existing) return alert("That username is already taken.");

    const passwordHash = await sha256(pass);
    await restdbFetch(COLLECTION, {
      method: "POST",
      body: JSON.stringify({ username, passwordHash, createdAt: new Date().toISOString() })
    });

    alert("Signup successful! Please login.");
    hide(signup); show(login);
  } catch (err) {
    alert(err.message);
  } finally {
    setBusy(false);
  }
});

/* ===== Login ===== */
loginSubmit.addEventListener("click", async () => {
  const username = loginUser.value.trim();
  const pass = loginPass.value;

  if (!username || !pass) return alert("Please enter username and password.");

  // Dev login: no RestDB calls
  if (DEV_MODE && username === DEV_ACCOUNT.username && pass === DEV_ACCOUNT.password) {
    return devLogin(username);
  }

  // Dev mode: block RestDB entirely
  if (DEV_MODE) {
    return alert("DEV_MODE is ON.\nUse dev / dev123 to login (no RestDB).");
  }

  try {
    setBusy(true);

    const account = await findAccount(username);
    if (!account) return alert("Account not found.");

    const passwordHash = await sha256(pass);
    if (passwordHash !== account.passwordHash) return alert("Wrong password.");

    localStorage.setItem("currentUser", account.username);
    window.location.href = "home.html";
  } catch (err) {
    alert(err.message);
  } finally {
    setBusy(false);
  }
});
