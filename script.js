const disclaimer = document.getElementById("disclaimer");
const logo1 = document.getElementById("logo1");
const logo2 = document.getElementById("logo2");
const artwork = document.getElementById("artwork");
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
const loadingOverlay = document.getElementById("loadingOverlay");
const feedbackModal = document.getElementById("feedbackModal");
const feedbackText = document.getElementById("feedbackText");
const feedbackTitle = document.getElementById("feedbackTitle");
const feedbackClose = document.getElementById("feedbackClose");
const introAudio = document.getElementById("introAudio");
const loginAudio = document.getElementById("loginAudio");

// Toggle: set DEV_MODE true to bypass RestDB and use DEV_ACCOUNT
const DEV_MODE = true;
const DEV_ACCOUNT = { username: "dev", password: "dev123" };

// Let other pages know whether DEV_MODE is active.
localStorage.setItem("devMode", DEV_MODE ? "true" : "false");

function show(el) { el.classList.add("show"); el.classList.remove("hide"); }
function hide(el) { el.classList.add("hide"); el.classList.remove("show"); }

function setBusy(isBusy) {
  loginSubmit.disabled = isBusy;
  signupSubmit.disabled = isBusy;
  goToSignup.disabled = isBusy;
  backToLogin.disabled = isBusy;
  if (loadingOverlay) {
    loadingOverlay.classList.toggle("show", isBusy);
  }
}

let audioReady = false;
const INTRO_FADE_MS = 1200;
const INTRO_VOLUME = 0.1;
const SWITCH_FADE_MS = 800;
const LOGIN_VOLUME = 0.4;
const LOGIN_FADE_IN_MS = 800;
const LOGIN_FADE_OUT_MS = 1400;
let loginAudioStarted = false;

function safePlay(audioEl) {
  if (!audioEl) return;
  const attempt = audioEl.play();
  if (attempt && typeof attempt.catch === "function") {
    attempt.catch(() => { audioReady = false; });
  }
}

function stopAudio(audioEl) {
  if (!audioEl) return;
  audioEl.pause();
  audioEl.currentTime = 0;
}

function fadeTo(audioEl, targetVolume, durationMs, onDone) {
  if (!audioEl) return;
  const startVolume = audioEl.volume;
  const delta = targetVolume - startVolume;
  if (durationMs <= 0 || Math.abs(delta) < 0.001) {
    audioEl.volume = targetVolume;
    if (onDone) onDone();
    return;
  }

  const startTime = performance.now();
  function step(now) {
    const t = Math.min((now - startTime) / durationMs, 1);
    audioEl.volume = startVolume + delta * t;
    if (t < 1) {
      requestAnimationFrame(step);
    } else if (onDone) {
      onDone();
    }
  }
  requestAnimationFrame(step);
}

function fadeIn(audioEl, durationMs, targetVolume = 1) {
  if (!audioEl) return;
  audioEl.volume = 0;
  safePlay(audioEl);
  fadeTo(audioEl, targetVolume, durationMs);
}

function fadeOut(audioEl, durationMs, onDone) {
  if (!audioEl) return;
  fadeTo(audioEl, 0, durationMs, () => {
    audioEl.pause();
    audioEl.currentTime = 0;
    if (onDone) onDone();
  });
}

function playIntroAudio() {
  if (!introAudio) return;
  if (loginAudio) loginAudio.pause();
  fadeIn(introAudio, INTRO_FADE_MS, INTRO_VOLUME);
}

function playLoginLoop() {
  if (!loginAudio) return;
  if (introAudio && !introAudio.paused) {
    fadeOut(introAudio, SWITCH_FADE_MS, () => {
      loginAudio.volume = 0;
      safePlay(loginAudio);
      if (!loginAudioStarted) {
        loginAudioStarted = true;
        fadeTo(loginAudio, LOGIN_VOLUME, LOGIN_FADE_IN_MS);
      } else {
        loginAudio.volume = LOGIN_VOLUME;
      }
    });
    return;
  }
  if (!loginAudioStarted) {
    loginAudioStarted = true;
    fadeIn(loginAudio, LOGIN_FADE_IN_MS, LOGIN_VOLUME);
    return;
  }
  loginAudio.volume = LOGIN_VOLUME;
  safePlay(loginAudio);
}

function stopAllAudio() {
  stopAudio(introAudio);
  stopAudio(loginAudio);
}

function primeAudio() {
  if (audioReady) return;
  audioReady = true;
  const loginVisible = login.classList.contains("show");
  const logo2Visible = logo2.classList.contains("show");
  if (skipIntro || loginVisible || logo2Visible) {
    playLoginLoop();
    return;
  }
  playIntroAudio();
}

["pointerdown", "touchstart", "touchend", "mousedown", "click", "keydown"].forEach((eventName) => {
  const opts = eventName.startsWith("touch") ? { once: true, passive: true } : { once: true };
  document.addEventListener(eventName, primeAudio, opts);
});

window.addEventListener("load", () => {
  if (introAudio) introAudio.load();
  if (loginAudio) loginAudio.load();
});

// Toggle: add ?skipIntro=1 to jump straight to the login sequence
const params = new URLSearchParams(window.location.search);
const skipIntro = params.get("skipIntro") === "1";

const scenes = [disclaimer, logo1, logo2, artwork, login, signup];
scenes.forEach(hide);
logo2.classList.remove("move-up");

const desktopMedia = window.matchMedia("(min-width: 900px)");
function triggerDesktopSplit() {
  if (!desktopMedia.matches) return;
  document.body.classList.add("desktop-split");
  show(artwork);
}

let introStarted = false;
function startIntroSequence() {
  if (introStarted) return;
  introStarted = true;

  if (skipIntro) {
    show(logo2);
    playLoginLoop();
    setTimeout(() => logo2.classList.add("move-up"), 4000);
    setTimeout(() => {
      show(login);
      hide(signup);
      setTimeout(triggerDesktopSplit, 600);
    }, 5500);
    window.history.replaceState({}, document.title, window.location.pathname);
    return;
  }

  show(disclaimer);
  playIntroAudio();
  setTimeout(() => hide(disclaimer), 4500);

  setTimeout(() => show(logo1), 6000);
  setTimeout(() => hide(logo1), 10000);

  setTimeout(() => show(logo2), 11500);
  setTimeout(() => playLoginLoop(), 11500);
  setTimeout(() => logo2.classList.add("move-up"), 15500);

  setTimeout(() => {
    show(login);
    hide(signup);
    setTimeout(triggerDesktopSplit, 1000);
  }, 16500);
}

if (skipIntro) {
  startIntroSequence();
} else {
  show(disclaimer);
  const startOnUser = () => {
    hide(disclaimer);
    startIntroSequence();
  };
  disclaimer.addEventListener("click", startOnUser, { once: true });
  disclaimer.addEventListener("touchstart", startOnUser, { once: true, passive: true });
}

goToSignup.addEventListener("click", () => { hide(login); show(signup); });
backToLogin.addEventListener("click", () => { hide(signup); show(login); });

const modalOpenButtons = document.querySelectorAll(".modal-open");
const modalCloseButtons = document.querySelectorAll(".modal-close");
const modalOverlays = document.querySelectorAll(".modal-overlay");

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  const modalContent = modal.querySelector(".modal-content");
  if (modalContent) {
    modalContent.scrollTop = 0;
    requestAnimationFrame(() => { modalContent.scrollTop = 0; });
  }
}

function closeModal(modal) {
  if (!modal) return;
  const active = document.activeElement;
  if (active && modal.contains(active)) active.blur();
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  const anyOpen = Array.from(modalOverlays).some((el) => el.classList.contains("show"));
  if (!anyOpen) document.body.classList.remove("modal-open");
}

function showFeedback(message, title = "Notice") {
  if (!feedbackModal) return;
  if (feedbackTitle) feedbackTitle.textContent = title;
  if (feedbackText) feedbackText.textContent = message;
  openModal("feedbackModal");
}

modalOpenButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.getAttribute("data-modal");
    openModal(target);
  });
});

modalCloseButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const modal = btn.closest(".modal-overlay");
    closeModal(modal);
  });
});

modalOverlays.forEach((overlay) => {
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeModal(overlay);
  });
});

if (feedbackClose) {
  feedbackClose.addEventListener("click", () => closeModal(feedbackModal));
}

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  modalOverlays.forEach((overlay) => {
    if (overlay.classList.contains("show")) closeModal(overlay);
  });
});

// Hash password client-side before sending to RestDB
async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

function devLogin(username) {
  localStorage.setItem("currentUser", username);
  playLoadingThenRedirect();
}

function playLoadingThenRedirect() {
  if (loginAudio && !loginAudio.paused) {
    fadeOut(loginAudio, LOGIN_FADE_OUT_MS, () => {
      if (loadingOverlay) loadingOverlay.classList.add("show");
      setTimeout(() => {
        window.location.href = "home.html";
      }, 3000);
    });
    return;
  }
  if (loadingOverlay) loadingOverlay.classList.add("show");
  stopAllAudio();
  setTimeout(() => {
    window.location.href = "home.html";
  }, 3000);
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

signupSubmit.addEventListener("click", async () => {
  const username = signupUser.value.trim();
  const pass = signupPass.value;
  const pass2 = signupPass2.value;

  if (!username || !pass || !pass2) return showFeedback("Please fill in all fields.");
  if (pass !== pass2) return showFeedback("Passwords do not match.");

  if (DEV_MODE) {
    return showFeedback("DEV_MODE is ON.\nSignup is disabled to save API quota.\nUse dev / dev123 to login.");
  }

  try {
    setBusy(true);

    const existing = await findAccount(username);
    if (existing) return showFeedback("That username is already taken.");

    const passwordHash = await sha256(pass);
    await restdbFetch(COLLECTION, {
      method: "POST",
      body: JSON.stringify({ username, passwordHash, createdAt: new Date().toISOString() })
    });

    showFeedback("Signup successful! Please login.");
    hide(signup); show(login);
  } catch (err) {
    showFeedback(err.message);
  } finally {
    setBusy(false);
  }
});

loginSubmit.addEventListener("click", async () => {
  const username = loginUser.value.trim();
  const pass = loginPass.value;
  let shouldReleaseBusy = true;

  if (!username || !pass) return showFeedback("Please enter username and password.");

  if (DEV_MODE && username === DEV_ACCOUNT.username && pass === DEV_ACCOUNT.password) {
    return devLogin(username);
  }

  if (DEV_MODE) {
    return showFeedback("DEV_MODE is ON.\nUse dev / dev123 to login (no RestDB).");
  }

  try {
    setBusy(true);

    const account = await findAccount(username);
    if (!account) return showFeedback("Account not found.");

    const passwordHash = await sha256(pass);
    if (passwordHash !== account.passwordHash) return showFeedback("Wrong password.");

    localStorage.setItem("currentUser", account.username);
    shouldReleaseBusy = false;
    playLoadingThenRedirect();
  } catch (err) {
    showFeedback(err.message);
  } finally {
    if (shouldReleaseBusy) setBusy(false);
  }
});
