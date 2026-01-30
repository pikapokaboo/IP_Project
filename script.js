const disclaimer = document.getElementById("disclaimer");
const logo1 = document.getElementById("logo1");
const logo2 = document.getElementById("logo2");
const login = document.getElementById("loginScreen");
const signup = document.getElementById("signupScreen");

const goToSignup = document.getElementById("goToSignup");
const backToLogin = document.getElementById("backToLogin");

const RESTDB_BASE = "https://thearchive-6738.restdb.io/rest";
const COLLECTION = "accounts";
const CORS_API_KEY = "697c47bc53d66e17391956ea";

const loginUser = document.getElementById("loginUser");
const loginPass = document.getElementById("loginPass");
const loginSubmit = document.getElementById("loginSubmit");

const signupUser = document.getElementById("signupUser");
const signupPass = document.getElementById("signupPass");
const signupPass2 = document.getElementById("signupPass2");
const signupSubmit = document.getElementById("signupSubmit");

function show(el) {
  el.classList.add("show");
  el.classList.remove("hide");
}

function hide(el) {
  el.classList.add("hide");
  el.classList.remove("show");
}

// --- SKIP INTRO (Support/Credits return) ---
const params = new URLSearchParams(window.location.search);
const skipIntro = params.get("skipIntro") === "1";

// Always start hidden
hide(disclaimer);
hide(logo1);
hide(logo2);
hide(login);
hide(signup);

// Always reset logo2 position (so it starts centered when shown)
logo2.classList.remove("move-up");

if (skipIntro) {
  // Mini-intro: Logo2 fades in center, then moves up, then show login

  show(logo2);

  // wait 4 seconds (change to 3000-5000 if you want)
  setTimeout(() => {
    logo2.classList.add("move-up");
  }, 4000);

  // after move-up transition (1.5s), show login
  setTimeout(() => {
    show(login);
    hide(signup);
  }, 4000 + 1500);

  // Remove the ?skipIntro=1 so a reload plays full cutscene again
  window.history.replaceState({}, document.title, window.location.pathname);

} else {
  // Full cutscene normally
  show(disclaimer);

  setTimeout(() => hide(disclaimer), 4500);

  setTimeout(() => show(logo1), 6000);
  setTimeout(() => hide(logo1), 10000);

  setTimeout(() => show(logo2), 11500);
  setTimeout(() => logo2.classList.add("move-up"), 15500);

  setTimeout(() => {
    show(login);
    hide(signup);
  }, 16500);
}

// Switch to signup
goToSignup.addEventListener("click", () => {
  hide(login);
  show(signup);
});

// Back to login
backToLogin.addEventListener("click", () => {
  hide(signup);
  show(login);
});

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

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
    throw new Error((data && data.message) ? data.message : `Request failed (${res.status})`);
  }
  return data;
}

async function findAccount(username) {
  const q = encodeURIComponent(JSON.stringify({ username }));
  const results = await restdbFetch(`${COLLECTION}?q=${q}`, { method: "GET" });
  return Array.isArray(results) && results.length ? results[0] : null;
}

// SIGNUP
signupSubmit.addEventListener("click", async () => {
  const username = signupUser.value.trim();
  const pass = signupPass.value;
  const pass2 = signupPass2.value;

  if (!username || !pass || !pass2) {
    alert("Please fill in all fields.");
    return;
  }
  if (pass !== pass2) {
    alert("Passwords do not match.");
    return;
  }

  try {
    const existing = await findAccount(username);
    if (existing) {
      alert("That username is already taken.");
      return;
    }

    const passwordHash = await sha256(pass);

    await restdbFetch(COLLECTION, {
      method: "POST",
      body: JSON.stringify({
        username,
        passwordHash,
        createdAt: new Date().toISOString()
      })
    });

    alert("Signup successful! Please login.");
    hide(signup);
    show(login);
  } catch (err) {
    alert(err.message);
  }
});

// LOGIN
loginSubmit.addEventListener("click", async () => {
  const username = loginUser.value.trim();
  const pass = loginPass.value;

  if (!username || !pass) {
    alert("Please enter username and password.");
    return;
  }

  try {
    const account = await findAccount(username);
    if (!account) {
      alert("Account not found.");
      return;
    }

    const passwordHash = await sha256(pass);
    if (passwordHash !== account.passwordHash) {
      alert("Wrong password.");
      return;
    }

    localStorage.setItem("currentUser", account.username);
    window.location.href = "home.html";

  } catch (err) {
    alert(err.message);
  }
});
