(function initIndexPage() {
  const disclaimer = document.getElementById("disclaimer");
  if (!disclaimer) return;
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
  
  const DEV_MODE = true;
  const DEV_ACCOUNT = { username: "dev", password: "dev123" };
  
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
})();

(function initHomePage() {
  if (!document.getElementById("terminalScene")) return;

      const user = localStorage.getItem("currentUser");
      if (!user) window.location.href = "index.html";

      const homeParams = new URLSearchParams(window.location.search);
      const skipHomeIntro = homeParams.get("skipHomeIntro") === "1" || sessionStorage.getItem("skipHomeIntro") === "true";
      if (skipHomeIntro) {
        sessionStorage.removeItem("skipHomeIntro");
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      const archivistName = document.getElementById("archivistName");
      if (archivistName) archivistName.textContent = user;

      const homeWrap = document.querySelector(".home-wrap");
      const terminalScene = document.getElementById("terminalScene");
      const homeLoadingAudio = document.getElementById("homeLoadingAudio");
      const homeBootupAudio = document.getElementById("homeBootupAudio");
      const homeMusicAudio = document.getElementById("homeMusicAudio");
      const terminalClickAudio = document.getElementById("terminalClickAudio");
      const homeMusicVolume = document.getElementById("homeMusicVolume");
      const resetProgressBtn = document.getElementById("resetProgressBtn");
      const testingQueueCount = document.getElementById("testingQueueCount");
      const MAX_TEST = 4;
      const achievementAudio = document.getElementById("achievementAudio");
      const achievementPopup = document.getElementById("achievementPopup");
      const achievementPopupIcon = document.getElementById("achievementPopupIcon");
      const achievementPopupName = document.getElementById("achievementPopupName");

      let terminalInitialized = false;
      let terminalBooted = false;
      const DEFAULT_MUSIC_VOLUME = 0.4;

      function safePlay(audioEl) {
        if (!audioEl) return;
        const attempt = audioEl.play();
        if (attempt && typeof attempt.catch === "function") {
          attempt.catch(() => {});
        }
      }

      function stopAudio(audioEl) {
        if (!audioEl) return;
        audioEl.pause();
        audioEl.currentTime = 0;
      }

      function playClickSound() {
        if (!terminalClickAudio) return;
        terminalClickAudio.currentTime = 0;
        safePlay(terminalClickAudio);
      }

      function applyMasterVolume(value) {
        const v = Math.min(1, Math.max(0, Number(value)));
        const volume = Number.isFinite(v) ? v : DEFAULT_MUSIC_VOLUME;
        if (homeMusicAudio) homeMusicAudio.volume = volume;
        if (homeLoadingAudio) homeLoadingAudio.volume = volume;
        if (homeBootupAudio) homeBootupAudio.volume = volume;
        if (terminalClickAudio) terminalClickAudio.volume = volume;
      }

      const savedMusicVolume = localStorage.getItem("homeMusicVolume");
      const initialMusicVolume = savedMusicVolume !== null ? Number(savedMusicVolume) : DEFAULT_MUSIC_VOLUME;
      if (homeMusicVolume) homeMusicVolume.value = String(Number.isFinite(initialMusicVolume) ? initialMusicVolume : DEFAULT_MUSIC_VOLUME);
      applyMasterVolume(initialMusicVolume);

      if (homeMusicVolume) {
        homeMusicVolume.addEventListener("input", () => {
          applyMasterVolume(homeMusicVolume.value);
          localStorage.setItem("homeMusicVolume", homeMusicVolume.value);
        });
      }

      if (resetProgressBtn) {
        resetProgressBtn.addEventListener("click", () => {
          localStorage.removeItem("testProgress");
          localStorage.removeItem("failProgress");
          localStorage.removeItem("achievementsProgress");
          sessionStorage.removeItem("prevAchievements");
          window.location.reload();
        });
      }

      function getAchievementKeys() {
        return [
          "clockingOut",
          "digitallyTraditional",
          "rollCamera",
          "stomachKnowledge",
          "intoNewWorld",
          "congratulations"
        ];
      }

      function loadAchievements() {
        try {
          const stored = localStorage.getItem("achievementsProgress");
          return stored ? JSON.parse(stored) : {};
        } catch {
          return {};
        }
      }

      function saveAchievements(achievements) {
        localStorage.setItem("achievementsProgress", JSON.stringify(achievements));
      }

      function getAchievementMeta(key) {
        const card = document.querySelector(`.terminal-achievement[data-achievement="${key}"]`);
        const name = card?.querySelector("h3")?.textContent?.trim() || "Achievement Unlocked";
        const icon = card?.querySelector("img")?.getAttribute("src") || "";
        return { name, icon };
      }

      let popupTimer = null;
      let popupQueue = [];
      let popupActive = false;

      function dequeuePopup() {
        if (popupActive || popupQueue.length === 0) return;
        const nextKey = popupQueue.shift();
        popupActive = true;
        showAchievementPopup(nextKey);
      }

      function showAchievementPopup(key) {
        if (!achievementPopup || !achievementPopupName) return;
        const meta = getAchievementMeta(key);
        achievementPopupName.textContent = meta.name;
        if (achievementPopupIcon) {
          achievementPopupIcon.src = meta.icon;
          achievementPopupIcon.alt = `${meta.name} icon`;
        }

        if (achievementAudio) {
          achievementAudio.currentTime = 0;
          const attempt = achievementAudio.play();
          if (attempt && typeof attempt.catch === "function") attempt.catch(() => {});
        }

        achievementPopup.classList.add("show");
        if (popupTimer) clearTimeout(popupTimer);
        popupTimer = setTimeout(() => {
          achievementPopup.classList.remove("show");
          popupActive = false;
          setTimeout(dequeuePopup, 250);
        }, 2500);
      }

      function updateAchievementsUI() {
        const achievements = loadAchievements();
        const cards = document.querySelectorAll(".terminal-achievement[data-achievement]");
        cards.forEach((card) => {
          const key = card.getAttribute("data-achievement");
          const isUnlocked = Boolean(achievements[key]);
          card.classList.toggle("locked", !isUnlocked);
          const badge = card.querySelector(".terminal-badge");
          if (badge) badge.textContent = isUnlocked ? "Unlocked" : "Locked";
        });

        const achievementCount = document.getElementById("achievementCount");
        if (achievementCount) {
          const total = cards.length;
          const unlocked = Array.from(cards).filter((card) => !card.classList.contains("locked")).length;
          achievementCount.textContent = `Unlocked: ${unlocked} / ${total}`;
        }

        const prevJson = sessionStorage.getItem("prevAchievements");
        let prev = {};
        try { prev = prevJson ? JSON.parse(prevJson) : {}; } catch { prev = {}; }
        const newlyUnlocked = getAchievementKeys().filter((key) => achievements[key] && !prev[key]);
        if (newlyUnlocked.length) {
          popupQueue = popupQueue.concat(newlyUnlocked);
          dequeuePopup();
        }
        sessionStorage.setItem("prevAchievements", JSON.stringify(achievements));
      }

      function primeHomeAudio() {
        safePlay(homeMusicAudio);
      }

      ["pointerdown", "touchstart", "mousedown", "click", "keydown"].forEach((eventName) => {
        document.addEventListener(eventName, primeHomeAudio, { once: true, passive: true });
      });

      const showTerminal = () => {
        if (!terminalScene) return;
        terminalScene.style.display = "flex";
        terminalScene.classList.remove("terminal-fade-in");
        document.body.classList.add("terminal-page");
        homeWrap?.classList.add("terminal-active");

        if (!terminalInitialized) {
          document.body.classList.add("terminal-loading");
          document.body.classList.remove("terminal-loaded");
          safePlay(homeMusicAudio);
          initTerminal();
          requestAnimationFrame(() => terminalScene.classList.add("terminal-fade-in"));
        } else if (terminalBooted) {
          document.body.classList.add("terminal-loaded");
          document.body.classList.remove("terminal-loading");
          requestAnimationFrame(() => terminalScene.classList.add("terminal-fade-in"));
        }
      };

      if (terminalScene) {
        terminalScene.addEventListener("click", (event) => {
          const button = event.target.closest("button");
          if (!button || !terminalScene.contains(button)) return;
          playClickSound();
        });
      }

      const overlay = document.getElementById("letterOverlay");
      const pen = document.getElementById("pen");
      const sigImg = document.getElementById("signatureImg");
      const sigLine = document.getElementById("sigLine");
      const devMode = localStorage.getItem("devMode") === "true";

      let dragging = false;
      let startX = 0;
      let penStartTx = 0;
      let currentTx = 0;
      let signed = false;
      let bounds = { minTx: 0, maxTx: 0 };
      const PEN_EXTRA_END_PX = 40;
      let skipLetter = skipHomeIntro;
      let accountId = null;
      let accountCache = null;
      let letterStarted = false;

      overlay.style.display = "none";

      async function restdbFetch(path, options = {}) {
        if (devMode) {
          throw new Error("DEV_MODE is ON. RestDB requests are disabled.");
        }
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

      async function loadLetterState(username) {
        if (devMode) return;
        try {
          const account = await findAccount(username);
          accountCache = account;
          accountId = account?._id || null;
          if (account && account.letterSigned == null) {
            try {
              await restdbFetch(`${COLLECTION}/${accountId}`, {
                method: "PATCH",
                body: JSON.stringify({ letterSigned: false })
              });
            } catch (err) {
              console.warn("RestDB PATCH failed while initializing letterSigned:", err);
            }
          }
          if (account && account.letterSigned) {
            skipLetter = true;
            signed = true;
            overlay.classList.add("dismiss");
            overlay.style.display = "none";
            showTerminal();
            return;
          }
          startLetter();
        } catch {
          startLetter();
        }
      }

      async function markLetterSigned() {
        if (devMode) return;
        try {
          if (!accountId && user) {
            const account = await findAccount(user);
            accountCache = account;
            accountId = account?._id || null;
          }
          if (!accountId) return;

          try {
            await restdbFetch(`${COLLECTION}/${accountId}`, {
              method: "PATCH",
              body: JSON.stringify({ letterSigned: true })
            });
          } catch (err) {
            console.warn("RestDB PATCH failed while marking letterSigned:", err);
            if (accountCache) {
              const updated = { ...accountCache, letterSigned: true };
              delete updated._id;
              await restdbFetch(`${COLLECTION}/${accountId}`, {
                method: "PUT",
                body: JSON.stringify(updated)
              });
            }
          }
        } catch {
        }
      }

      function setPenX(x) {
        pen.style.setProperty("--pen-x", `${x}px`);
      }

      function setSignatureProgress(p) {
        const v = Math.min(1, Math.max(0, p));
        sigImg.style.opacity = v;
        sigImg.style.transform = `translateY(${6 - v * 6}px)`;
      }

      function computeBounds() {
        const prev = pen.style.getPropertyValue("--pen-x");
        setPenX(0);

        const lineRect = sigLine.getBoundingClientRect();
        const penRect = pen.getBoundingClientRect();

        const minTx = lineRect.left - penRect.left;
        const maxTx = lineRect.right - penRect.right + PEN_EXTRA_END_PX;

        setPenX(parseFloat(prev) || 0);

        bounds.minTx = Math.min(minTx, maxTx);
        bounds.maxTx = Math.max(minTx, maxTx);
      }

      function range() {
        return Math.max(1, bounds.maxTx - bounds.minTx);
      }

      function finish() {
        if (signed) return;
        signed = true;

        setPenX(bounds.maxTx);
        setSignatureProgress(1);
        markLetterSigned();

        setTimeout(() => {
          overlay.classList.add("slide-out");
          setTimeout(() => {
            overlay.classList.add("dismiss");
            setTimeout(() => {
              overlay.style.display = "none";
              showTerminal();
            }, 400);
          }, 900);
        }, 2500);
      }

      function startLetter() {
        if (letterStarted || skipLetter) return;
        letterStarted = true;
        overlay.style.display = "flex";

        setTimeout(() => {
          if (skipLetter) return;
          pen.classList.add("visible");
          computeBounds();
          currentTx = bounds.minTx;
          setPenX(currentTx);
          setSignatureProgress(0);
        }, 2000);
      }

      if (skipHomeIntro) {
        overlay.classList.add("dismiss");
        overlay.style.display = "none";
        showTerminal();
      } else {
        loadLetterState(user);
        if (devMode) startLetter();
      }

      window.addEventListener("resize", () => {
        if (!pen.classList.contains("visible") || signed) return;
        computeBounds();
        currentTx = Math.min(bounds.maxTx, Math.max(bounds.minTx, currentTx));
        setPenX(currentTx);
        setSignatureProgress((currentTx - bounds.minTx) / range());
      });

      pen.addEventListener("pointerdown", (e) => {
        if (!pen.classList.contains("visible") || signed) return;
        dragging = true;
        startX = e.clientX;
        penStartTx = currentTx;
        pen.setPointerCapture?.(e.pointerId);

      });

      window.addEventListener("pointermove", (e) => {
        if (!dragging || signed) return;

        const dx = e.clientX - startX;
        currentTx = Math.min(bounds.maxTx, Math.max(bounds.minTx, penStartTx + dx));

        setPenX(currentTx);
        setSignatureProgress((currentTx - bounds.minTx) / range());

        if (((currentTx - bounds.minTx) / range()) > 0.98) {
          dragging = false;
          finish();
        }
      });

      window.addEventListener("pointerup", () => {
        if (!dragging || signed) return;
        dragging = false;

        pen.style.transition = "transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1.15), opacity 0.6s ease";
        sigImg.style.transition = "opacity 0.3s ease, transform 0.3s ease";

        currentTx = bounds.minTx;
        setPenX(currentTx);
        setSignatureProgress(0);

        setTimeout(() => {
          pen.style.transition = "";
          sigImg.style.transition = "";
        }, 360);
      });


      sigImg.addEventListener("error", () => sigImg.style.display = "none");

      function initTerminal() {
        if (terminalInitialized) return;
        terminalInitialized = true;
  const tabButtons = document.querySelectorAll(".terminal-tab-btn");
      const tabs = document.querySelectorAll(".terminal-tab");

      function setActiveTabByIndex(index) {
        if (!tabButtons.length) return;
        const safeIndex = ((index % tabButtons.length) + tabButtons.length) % tabButtons.length;
        const button = tabButtons[safeIndex];
        const target = button.getAttribute("data-tab");

        tabButtons.forEach((btn) => {
          const isActive = btn === button;
          btn.classList.toggle("active", isActive);
          btn.setAttribute("aria-selected", isActive ? "true" : "false");
        });

        tabs.forEach((tab) => {
          tab.classList.toggle("active", tab.id === `tab-${target}`);
        });
      }

      tabButtons.forEach((button, index) => {
        button.addEventListener("click", () => setActiveTabByIndex(index));
      });

      document.addEventListener("keydown", (event) => {
        if (event.key !== "Tab") return;
        if (document.body.classList.contains("modal-open")) return;
        event.preventDefault();
        const activeIndex = Array.from(tabButtons).findIndex((btn) => btn.classList.contains("active"));
        const nextIndex = event.shiftKey ? activeIndex - 1 : activeIndex + 1;
        setActiveTabByIndex(nextIndex);
      });

      const achievementCount = document.getElementById("achievementCount");
      if (achievementCount) {
        const total = document.querySelectorAll(".terminal-achievement").length;
        const unlocked = document.querySelectorAll(".terminal-achievement:not(.locked)").length;
        achievementCount.textContent = `Unlocked: ${unlocked} / ${total}`;
      }

      const sessionTimer = document.getElementById("sessionTimer");
      if (sessionTimer) {
        const sessionStart = Date.now();
        const pad = (n) => String(n).padStart(2, "0");

        const updateSessionTime = () => {
          const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
          const hours = Math.floor(elapsed / 3600);
          const minutes = Math.floor((elapsed % 3600) / 60);
          const seconds = elapsed % 60;
          sessionTimer.textContent = `Session: ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
        };

        updateSessionTime();
        setInterval(updateSessionTime, 1000);
      }
      const archiveTitle = document.getElementById("archiveTitle");
      const archiveMeta = document.getElementById("archiveMeta");
      const archiveBody = document.getElementById("archiveBody");
      const archiveCompletionTag = document.getElementById("archiveCompletionTag");
      const activeCaseIntegrity = document.getElementById("activeCaseIntegrity");

      const archiveCases = {
        "b04-312": {
          title: "CAC-B04-312: Contained CRT Entity",
          meta: "Classification: Contained Bio-Mechanical Entity | Location: Site 9 - Media Anomaly Storage",
          folder: "object1"
        },
        "a17-049": {
          title: "CAC-A17-049: Temporal Camcorder",
          meta: "Classification: High Risk Temporal Artifact | Location: Site 14 - Temporal Observation Wing",
          folder: "object2"
        }
      };

      function loadTestProgress() {
        try {
          const stored = localStorage.getItem("testProgress");
          return stored ? JSON.parse(stored) : {};
        } catch {
          return {};
        }
      }

      function loadFailProgress() {
        try {
          const stored = localStorage.getItem("failProgress");
          return stored ? JSON.parse(stored) : {};
        } catch {
          return {};
        }
      }

      function getArchivePercent(progressValue, failCount) {
        const testValue = Number(progressValue) || 1;
        const completed = Math.min(MAX_TEST, Math.max(0, testValue - 1));
        const base = Math.round((completed / MAX_TEST) * 100);
        const extra = Math.min(5, Number(failCount) || 0) * 5;
        return Math.min(100, base + extra);
      }

      let activeArchiveCase = null;

      async function loadArchiveFile(caseId, percent) {
        if (!archiveBody) return;
        const data = archiveCases[caseId];
        if (!data) return;
        const fileName = `${percent}%.txt`;
        const url = `archive/${data.folder}/${encodeURIComponent(fileName)}`;
        archiveBody.textContent = "Loading archive...";
        try {
          const response = await fetch(url, { cache: "no-store" });
          if (!response.ok) throw new Error("missing");
          const text = await response.text();
          if (activeArchiveCase !== caseId) return;
          archiveBody.textContent = text;
        } catch {
          if (activeArchiveCase !== caseId) return;
          archiveBody.textContent = "Archive file unavailable.";
        }
      }

      const setArchiveCase = (caseId) => {
        const data = archiveCases[caseId];
        if (!data) return;
        activeArchiveCase = caseId;
        if (archiveTitle) archiveTitle.textContent = data.title;
        if (archiveMeta) archiveMeta.textContent = data.meta;

        const progress = loadTestProgress();
        const failProgress = loadFailProgress();
        const currentTest = Math.min(MAX_TEST, Number(progress[caseId]) || 1);
        const failCount = failProgress[caseId]?.[currentTest] || 0;
        const percent = getArchivePercent(progress[caseId], failCount);
        const roundedPercent = Math.round(percent / 5) * 5;

        if (archiveCompletionTag) {
          archiveCompletionTag.textContent = `Completion: ${percent}%`;
        }
        if (activeCaseIntegrity) {
          activeCaseIntegrity.textContent = `File integrity ${percent}% restored. Continue research to expand operational clearance.`;
        }
        loadArchiveFile(caseId, roundedPercent);
      };

      const archiveButtons = document.querySelectorAll("#tab-archive .terminal-list-item");
      archiveButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          archiveButtons.forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          setArchiveCase(btn.getAttribute("data-case"));
        });
      });

      function updateArchiveAvailability() {
        const progress = loadTestProgress();
        const failProgress = loadFailProgress();
        const object1Test = Number(progress["b04-312"]) || 1;
        const object2Unlocked = object1Test >= 4;

        archiveButtons.forEach((btn) => {
          const caseId = btn.getAttribute("data-case");
          const currentTest = Math.min(MAX_TEST, Number(progress[caseId]) || 1);
          const failCount = failProgress[caseId]?.[currentTest] || 0;
          const percent = getArchivePercent(progress[caseId], failCount);
          const small = btn.querySelector("small");
          if (small) small.textContent = `Completion: ${percent}%`;

          const isLocked = caseId === "a17-049" && !object2Unlocked;
          if (isLocked) {
            btn.style.display = "none";
            btn.classList.remove("active");
            return;
          }
          btn.style.display = "";
        });

        const visible = Array.from(archiveButtons).filter((btn) => btn.style.display !== "none");
        const activeVisible = visible.find((btn) => btn.classList.contains("active"));
        if (!activeVisible && visible.length) {
          archiveButtons.forEach((b) => b.classList.remove("active"));
          visible[0].classList.add("active");
          setArchiveCase(visible[0].getAttribute("data-case"));
        } else if (activeVisible) {
          setArchiveCase(activeVisible.getAttribute("data-case"));
        }
      }

      const objectTitle = document.getElementById("objectTitle");
      const objectClass = document.getElementById("objectClass");
      const objectFacility = document.getElementById("objectFacility");
      const objectStatus = document.getElementById("objectStatus");
      const objectDesc = document.getElementById("objectDesc");
      const objectModelNote = document.getElementById("objectModelNote");

      const objectData = {
        "b04-312": {
          title: "CAC-B04-312: Contained CRT Entity",
          classification: "Classification: Contained Bio-Mechanical Entity",
          facility: "Facility: Site 9 — Media Anomaly Storage",
          status: "Status: Active / Contained",
          desc: "Description unavailable.",
          modelNote: "CAC-B04-312 turntable"
        },
        "a17-049": {
          title: "CAC-A17-049: Temporal Camcorder",
          classification: "Classification: High Risk Temporal Artifact",
          facility: "Facility: Site 14 — Temporal Observation Wing",
          status: "Status: Active / Contained",
          desc: "Description unavailable.",
          modelNote: "CAC-A17-049 turntable"
        }
      };


      function getArchivePercentForCase(caseId) {
        const progress = loadTestProgress();
        const failProgress = loadFailProgress();
        const currentTest = Math.min(MAX_TEST, Number(progress[caseId]) || 1);
        const failCount = failProgress[caseId]?.[currentTest] || 0;
        const percent = getArchivePercent(progress[caseId], failCount);
        return Math.round(percent / 5) * 5;
      }

      function extractArtifactDescription(text) {
        const marker = "ARTIFACT DESCRIPTION";
        const start = text.indexOf(marker);
        if (start == -1) return "";
        const after = text.slice(start + marker.length);
        const divider = "------------------------------------------------------------";
        const end = after.indexOf(divider);
        const block = end == -1 ? after : after.slice(0, end);
        const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
        return lines.join(" ");
      }

      let activeObjectCase = null;
      async function loadObjectDescription(caseId) {
        if (!objectDesc) return;
        const data = objectData[caseId];
        const archiveCase = archiveCases[caseId];
        if (!data || !archiveCase) {
          const fallback = data?.desc || "";
          objectDesc.textContent = fallback;
          return;
        }

        const percent = getArchivePercentForCase(caseId);
        const fileName = `${percent}%.txt`;
        const url = `archive/${archiveCase.folder}/${encodeURIComponent(fileName)}`;
        objectDesc.textContent = "Loading description...";
        try {
          const response = await fetch(url, { cache: "no-store" });
          if (!response.ok) throw new Error("missing");
          const text = await response.text();
          if (activeObjectCase != caseId) return;
          const desc = extractArtifactDescription(text);
          const finalDesc = desc || data.desc || "";
          objectDesc.textContent = finalDesc;
        } catch {
          const fallback = data.desc || "";
          objectDesc.textContent = fallback;
        }
      }

      const setObjectCase = (caseId) => {
        const data = objectData[caseId];
        if (!data) return;
        activeObjectCase = caseId;
        if (objectTitle) objectTitle.textContent = data.title;
        if (objectClass) objectClass.textContent = data.classification;
        if (objectFacility) objectFacility.textContent = data.facility;
        if (objectStatus) objectStatus.textContent = data.status;
        loadObjectDescription(caseId);
        if (objectModelNote) {
          if (caseId === "b04-312") {
            if (!objectModelNote.querySelector("iframe")) {
              objectModelNote.innerHTML = `
                <div class="sketchfab-embed-wrapper">
                  <iframe title="CRT Monitor and Keyboard" frameborder="0" allowfullscreen mozallowfullscreen="true" webkitallowfullscreen="true" allow="autoplay; fullscreen; xr-spatial-tracking" xr-spatial-tracking execution-while-out-of-viewport execution-while-not-rendered web-share src="https://sketchfab.com/models/29476b2bb15246bfb9e5309a62097cf1/embed?autospin=1&autostart=1&camera=0&transparent=1&ui_theme=dark&ui_controls=0&ui_infos=0&ui_help=0&ui_hint=0&ui_settings=0&ui_stop=0&ui_watermark=0&ui_vr=0&ui_fullscreen=0&ui_annotations=0"></iframe>
                </div>
              `;
            }
          } else {
            objectModelNote.innerHTML = `3D Model Turntable<span>${data.modelNote}</span>`;
          }
        }
      };

      const objectButtons = document.querySelectorAll("#tab-objects .terminal-list-item");
      objectButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          objectButtons.forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          setObjectCase(btn.getAttribute("data-case"));
        });
      });
      const initialObject = document.querySelector("#tab-objects .terminal-list-item.active");
      if (initialObject) setObjectCase(initialObject.getAttribute("data-case"));

      function updateObjectAvailability() {
        const progress = loadTestProgress();

        const object1Test = Number(progress["b04-312"]) || 1;
        const object2Unlocked = object1Test >= 4;

        objectButtons.forEach((btn) => {
          const caseId = btn.getAttribute("data-case");
          const testValue = Number(progress[caseId]) || 1;
          const isCompleted = testValue > MAX_TEST;
          const isLocked = caseId === "a17-049" && !object2Unlocked;

          if (isCompleted || isLocked) {
            btn.style.display = "none";
            btn.classList.remove("active");
            return;
          }

          btn.style.display = "";
        });

        const visibleButtons = Array.from(objectButtons).filter((btn) => btn.style.display !== "none");
        const activeVisible = visibleButtons.find((btn) => btn.classList.contains("active"));
        if (!activeVisible && visibleButtons.length) {
          objectButtons.forEach((b) => b.classList.remove("active"));
          visibleButtons[0].classList.add("active");
          setObjectCase(visibleButtons[0].getAttribute("data-case"));
        }

        if (testingQueueCount) {
          testingQueueCount.textContent = String(visibleButtons.length);
        }
      }

      const startTestingBtn = document.querySelector(".terminal-start-btn");
      if (startTestingBtn) {
        startTestingBtn.addEventListener("click", () => {
          const activeObject = document.querySelector("#tab-objects .terminal-list-item.active");
          const caseId = activeObject?.getAttribute("data-case") || "b04-312";
          const progress = loadTestProgress();
          const testNumber = Math.min(MAX_TEST, Number(progress[caseId]) || 1);
          window.location.href = `game.html?object=${encodeURIComponent(caseId)}&test=${testNumber}`;
        });
      }

      updateObjectAvailability();
      updateAchievementsUI();
      updateArchiveAvailability();

      const loadingPercent = document.getElementById("loadingPercent");
      const loadingFill = document.getElementById("loadingFill");
      const bodyEl = document.body;

      let progress = 0;
      const bootLog = document.getElementById("bootLog");
      const bootLines = [
        "CHECKSUM OK",
        "MEMORY BANKS ONLINE",
        "VAULT CHANNEL LINKED",
        "ARCHIVE INDEX MOUNTED",
        "BIOLOCKS SYNCHRONIZED",
        "FAILSAFE ARMED",
        "ENCRYPTION HANDSHAKE COMPLETE",
        "TEMPORAL BUFFER STABLE",
        "SITE 9 FEED ACTIVE",
        "SITE 14 FEED ACTIVE",
        "OBSERVATION QUEUE READY",
        "SECURE BUS HANDSHAKE",
        "RUNNING DIAGNOSTIC PASS 1",
        "RUNNING DIAGNOSTIC PASS 2",
        "SYNCING CLOCK DRIFT",
        "MOUNTING LOG PARTITIONS",
        "CACHE WARMUP COMPLETE",
        "CIPHER MODULE LOADED",
        "CONTAINMENT GRID ONLINE",
        "ANOMALY INDEX READY",
        "OPERATOR KEYS VERIFIED",
        "SENSOR ARRAY CALIBRATED",
        "THERMAL GUARD ACTIVE",
        "POWER STABILIZED",
        "ARCHIVE MIRROR READY",
        "AUDIT TRAIL OPEN",
        "VAULT ACCESS ENABLED",
        "CRC PASS",
        "STACK INTEGRITY OK",
        "NETWORK BUS ONLINE",
        "SECURITY DAEMON START",
        "KERNEL HOOKS LOADED",
        "PCI BUS ENUMERATED",
        "GPU DIAGNOSTIC OK",
        "I/O CHANNEL READY",
        "SCANNER GRID ONLINE",
        "LOCKDOWN KEYS SYNCED",
        "PHASE LOCK ACQUIRED",
        "ARCHIVE HASH VERIFIED",
        "RUNTIME CLOCK SYNC",
        "SHIELDING ACTIVE",
        "DATA PIPELINE READY",
        "OBSERVER NODE READY",
        "LOGGING ACTIVE"
      ];
      const bootInterval = bootLog ? setInterval(() => {
        const stamp = new Date().toLocaleTimeString("en-US", { hour12: false });
        const batch = Math.floor(Math.random() * 2) + 1;
        const lines = bootLog.textContent.split("\n");
        for (let i = 0; i < batch; i += 1) {
          const line = `[${stamp}] ${bootLines[Math.floor(Math.random() * bootLines.length)]}`;
          lines.push(line);
        }
        if (lines.length > 36) lines.shift();
        bootLog.textContent = lines.join("\n");
      }, 40) : null;

      safePlay(homeLoadingAudio);
      const loadingInterval = setInterval(() => {
        progress = Math.min(100, progress + Math.floor(Math.random() * 7) + 4);
        if (loadingPercent) loadingPercent.textContent = `${progress}%`;
        if (loadingFill) loadingFill.style.width = `${progress}%`;

        if (progress >= 100) {
          clearInterval(loadingInterval);
          if (bootInterval) clearInterval(bootInterval);
          bodyEl.classList.remove("terminal-loading");
          bodyEl.classList.add("terminal-loaded");
          terminalBooted = true;
          stopAudio(homeLoadingAudio);
          safePlay(homeBootupAudio);
        }
      }, 120);
      }

})();
