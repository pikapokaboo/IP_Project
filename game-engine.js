(function initVisualNovelEngine() {
  const storyTitleEl = document.getElementById("vnStoryTitle");
  const stageEl = document.querySelector(".vn-stage");
  const bgEl = document.getElementById("vnBackground");
  const bgFadeEl = document.getElementById("vnBgFade");
  const charLeftEl = document.getElementById("vnCharLeft");
  const charCenterEl = document.getElementById("vnCharCenter");
  const charRightEl = document.getElementById("vnCharRight");
  const speakerEl = document.getElementById("vnSpeaker");
  const textEl = document.getElementById("vnText");
  const choicesEl = document.getElementById("vnChoices");
  const dialogBoxEl = document.getElementById("vnDialogBox");
  const cutsceneEl = document.getElementById("vnCutscene");
  const cutsceneVideoEl = document.getElementById("vnCutsceneVideo");
  const autoplayBtn = document.getElementById("vnAutoplayBtn");
  const skipBtn = document.getElementById("vnSkipBtn");
  const restartBtn = document.getElementById("vnRestartBtn");
  const errorWrapEl = document.getElementById("vnError");
  const errorTextEl = document.getElementById("vnErrorText");

  if (
    !storyTitleEl ||
    !stageEl ||
    !bgEl ||
    !bgFadeEl ||
    !speakerEl ||
    !textEl ||
    !choicesEl ||
    !dialogBoxEl ||
    !cutsceneEl ||
    !cutsceneVideoEl ||
    !autoplayBtn ||
    !skipBtn ||
    !restartBtn ||
    !errorWrapEl ||
    !errorTextEl
  ) {
    return;
  }

  const params = new URLSearchParams(window.location.search);

  const rawObject = (params.get("object") || "b04-312").toLowerCase();
  const objectMap = {
    "b04-312": "CAC-B04-312",
    "a17-049": "CAC-A17-049"
  };
  const objectKey = objectMap[rawObject] ? rawObject : "b04-312";
  const MAX_TEST = 4;
  const TEST_PROGRESS_KEY = "testProgress";
  const FAIL_PROGRESS_KEY = "failProgress";
  const ACHIEVEMENTS_KEY = "achievementsProgress";

  function getDefaultStoryPath() {
    const requestedTest = Number.parseInt(params.get("test") || "", 10);
    const safeTest = Number.isFinite(requestedTest) ? Math.min(MAX_TEST, Math.max(1, requestedTest)) : 1;
    const objectPrefix = objectKey === "a17-049" ? "obj2" : "obj1";
    return `story/${objectPrefix}-test${safeTest}.json`;
  }

  const storyPath = params.get("story") || getDefaultStoryPath();
  const currentUsername = localStorage.getItem("currentUser") || "Archivist";
  const DEFAULT_TEXT_BLIP_SRC = "audio/blip.mp3";
  const CHOICE_CLICK_SFX_SRC = "audio/click.mp3";
  const CUTSCENE_END_PAUSE_MS = 600;
  const CUTSCENE_FADE_MS = 700;
  const OPENING_BGM_LEAD_MS = 220;

  const state = {
    story: null,
    currentLabel: "",
    currentIndex: 0,
    waitingForChoice: false,
    finished: false,
    currentMusicSrc: "",
    currentBgmAudio: null,
    activeSfx: [],
    autoMode: false,
    skipMode: false,
    playbackTimer: null,
    isTyping: false,
    typingTimer: null,
    typingFullText: "",
    typingIndex: 0,
    activeTextBlips: [],
    lastTextBlipAt: 0,
    waitTimer: null,
    waitingForDelay: false
  };

  const charElements = {
    left: charLeftEl,
    center: charCenterEl,
    right: charRightEl
  };

  function showError(message) {
    errorTextEl.textContent = message;
    errorWrapEl.hidden = false;
    dialogBoxEl.hidden = true;
    choicesEl.hidden = true;
  }

  function hideError() {
    errorWrapEl.hidden = true;
    dialogBoxEl.hidden = false;
    choicesEl.hidden = false;
  }

  function loadProgress() {
    try {
      const stored = localStorage.getItem(TEST_PROGRESS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  function saveProgress(progress) {
    localStorage.setItem(TEST_PROGRESS_KEY, JSON.stringify(progress));
  }

  function loadFailProgress() {
    try {
      const stored = localStorage.getItem(FAIL_PROGRESS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  function saveFailProgress(failProgress) {
    localStorage.setItem(FAIL_PROGRESS_KEY, JSON.stringify(failProgress));
  }

  function loadAchievements() {
    try {
      const stored = localStorage.getItem(ACHIEVEMENTS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  function saveAchievements(achievements) {
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
  }

  function goHome() {
    sessionStorage.setItem("skipHomeIntro", "true");
    window.location.href = "home.html?skipHomeIntro=1";
  }

  function updateAchievementsOnPass(currentTest, currentObject) {
    const achievements = loadAchievements();
    if (!achievements.clockingOut) achievements.clockingOut = true;
    if (currentObject === "b04-312" && currentTest >= 4) achievements.digitallyTraditional = true;
    if (currentObject === "a17-049" && currentTest >= 4) achievements.rollCamera = true;
    if (achievements.digitallyTraditional && achievements.rollCamera) {
      achievements.congratulations = true;
    }
    saveAchievements(achievements);
  }

  function updateAchievementsOnFail(currentObject) {
    const achievements = loadAchievements();
    if (currentObject === "b04-312" && !achievements.stomachKnowledge) {
      achievements.stomachKnowledge = true;
    }
    if (currentObject === "a17-049" && !achievements.intoNewWorld) {
      achievements.intoNewWorld = true;
    }
    saveAchievements(achievements);
  }

  function passTest() {
    const progress = loadProgress();
    const current = Number(progress[objectKey]) || 1;
    if (current >= MAX_TEST) {
      progress[objectKey] = MAX_TEST + 1;
    } else {
      progress[objectKey] = Math.min(MAX_TEST, current + 1);
    }
    saveProgress(progress);
    updateAchievementsOnPass(current, objectKey);
  }

  function failTest() {
    const progress = loadProgress();
    const current = Number(progress[objectKey]) || 1;
    progress[objectKey] = current;
    saveProgress(progress);

    const failProgress = loadFailProgress();
    const objectFails = failProgress[objectKey] || {};
    const currentFails = Number(objectFails[current]) || 0;
    objectFails[current] = Math.min(5, currentFails + 1);
    failProgress[objectKey] = objectFails;
    saveFailProgress(failProgress);
    updateAchievementsOnFail(objectKey);
  }

  function resolveAsset(value) {
    if (!value) return "";
    const assets = state.story.assets || {};
    if (typeof value === "string" && assets[value]) return assets[value];
    return value;
  }

  function setBackground(assetRef) {
    const src = resolveAsset(assetRef);
    if (!src) return;
    bgEl.style.backgroundImage = `url("${src}")`;
  }

  function setBgFade(show, durationMs) {
    if (Number.isFinite(Number(durationMs)) && Number(durationMs) >= 0) {
      bgFadeEl.style.transitionDuration = `${Number(durationMs)}ms`;
    } else {
      bgFadeEl.style.transitionDuration = "";
    }
    bgFadeEl.classList.toggle("show", Boolean(show));
  }

  function setCharacter(slot, assetRef) {
    const el = charElements[slot];
    if (!el) return;

    if (!assetRef) {
      el.classList.remove("show");
      el.removeAttribute("src");
      return;
    }

    const src = resolveAsset(assetRef);
    if (!src) return;
    el.src = src;
    el.classList.add("show");
  }

  function hideCharacters(slots) {
    if (Array.isArray(slots)) {
      slots.forEach((slot) => setCharacter(slot, null));
      return;
    }
    Object.keys(charElements).forEach((slot) => setCharacter(slot, null));
  }

  function stopMusic() {
    if (state.currentBgmAudio) {
      state.currentBgmAudio.pause();
      state.currentBgmAudio.remove();
      state.currentBgmAudio = null;
    }
    state.currentMusicSrc = "";
  }

  function playMusic(config) {
    const cfg = typeof config === "string" ? { play: config } : (config || {});
    const src = resolveAsset(cfg.play || cfg.src || cfg.music || config);
    if (!src || state.currentMusicSrc === src) return;

    stopMusic();

    const audio = document.createElement("audio");
    audio.dataset.vnMusic = "true";
    audio.loop = cfg.loop !== false;
    audio.volume = Number.isFinite(Number(cfg.volume)) ? Math.min(1, Math.max(0, Number(cfg.volume))) : 0.3;
    audio.src = src;
    document.body.appendChild(audio);

    const attempt = audio.play();
    if (attempt && typeof attempt.catch === "function") {
      attempt.catch(() => {});
    }

    state.currentBgmAudio = audio;
    state.currentMusicSrc = src;
  }

  function stopSfx(target) {
    const ids = Array.isArray(target) ? target : [target];
    const stopAll = !target || target === true;
    state.activeSfx = state.activeSfx.filter((entry) => {
      const shouldStop = stopAll || ids.includes(entry.id);
      if (shouldStop) {
        entry.audio.pause();
        entry.audio.currentTime = 0;
      }
      return !shouldStop;
    });
  }

  function playSfx(config) {
    const cfg = typeof config === "string" ? { play: config } : (config || {});
    const src = resolveAsset(cfg.play || cfg.src || config);
    if (!src) return;

    if (cfg.stop) {
      stopSfx(cfg.id || true);
      return;
    }

    const audio = new Audio(src);
    audio.loop = Boolean(cfg.loop);
    audio.volume = Number.isFinite(Number(cfg.volume)) ? Math.min(1, Math.max(0, Number(cfg.volume))) : 0.45;
    const entry = { id: cfg.id || null, audio };
    state.activeSfx.push(entry);
    audio.addEventListener("ended", () => {
      state.activeSfx = state.activeSfx.filter((item) => item !== entry);
    });
    const attempt = audio.play();
    if (attempt && typeof attempt.catch === "function") {
      attempt.catch(() => {});
    }
  }

  function playChoiceClickSfx() {
    const audio = new Audio(CHOICE_CLICK_SFX_SRC);
    audio.volume = 1;
    const attempt = audio.play();
    if (attempt && typeof attempt.catch === "function") {
      attempt.catch(() => {});
    }
  }

  function getSpeakerData(speakerKeyOrName) {
    if (!speakerKeyOrName) return { name: "", color: "#ffdede" };
    const rawKey = String(speakerKeyOrName).trim();
    const normalizedKey = rawKey.toLowerCase();

    if (normalizedKey === "you") {
      return { name: currentUsername, color: "#ffe9e9" };
    }

    const fromCharacters = state.story.characters && state.story.characters[speakerKeyOrName];
    if (fromCharacters) {
      const characterName = String(fromCharacters.name || speakerKeyOrName).trim();
      return {
        name: characterName.toLowerCase() === "you" ? currentUsername : characterName,
        color: fromCharacters.color || "#ffdede"
      };
    }

    return { name: rawKey, color: "#ffdede" };
  }

  function resolveStoryText(rawText) {
    const safeText = rawText == null ? "" : String(rawText);
    return safeText.replace(/<username>/gi, currentUsername);
  }

  function clearTypingTimer() {
    if (state.typingTimer) {
      window.clearTimeout(state.typingTimer);
      state.typingTimer = null;
    }
  }

  function getTypingSpeed() {
    const metaSpeed = Number(state.story && state.story.meta ? state.story.meta.typeSpeed : 0);
    if (Number.isFinite(metaSpeed) && metaSpeed > 0) return metaSpeed;
    return 38;
  }

  function getTypeDelayForChar(char, cps) {
    const base = Math.max(8, Math.round(1000 / cps));
    if (char === "\n") return base * 2;
    if (/[.,!?;:]/.test(char)) return base * 4;
    return base;
  }

  function stopTextBlips() {
    state.activeTextBlips.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    state.activeTextBlips = [];
  }

  function getTextBlipSettings() {
    const meta = state.story && state.story.meta ? state.story.meta : {};
    if (meta.textBlip === false) return null;
    const src = resolveAsset(meta.textBlip || DEFAULT_TEXT_BLIP_SRC);
    if (!src) return null;
    const volume = Number.isFinite(Number(meta.textBlipVolume))
      ? Math.min(1, Math.max(0, Number(meta.textBlipVolume)))
      : 0.12;
    const rate = Number.isFinite(Number(meta.textBlipRate))
      ? Math.min(2.5, Math.max(0.3, Number(meta.textBlipRate)))
      : 1;
    const step = Number.isFinite(Number(meta.textBlipEvery))
      ? Math.max(1, Math.round(Number(meta.textBlipEvery)))
      : 2;
    return { src, volume, rate, step };
  }

  function shouldPlayTextBlip(char, step) {
    if (!char) return false;
    if (!/[A-Za-z0-9]/.test(char)) return false;
    if (state.typingIndex % step !== 0) return false;
    const now = performance.now();
    if (now - state.lastTextBlipAt < 20) return false;
    state.lastTextBlipAt = now;
    return true;
  }

  function playTextBlipForChar(char) {
    if (state.skipMode || !state.isTyping) return;
    const settings = getTextBlipSettings();
    if (!settings) return;
    if (!shouldPlayTextBlip(char, settings.step)) return;

    const audio = new Audio(settings.src);
    audio.volume = settings.volume;
    audio.playbackRate = settings.rate;
    state.activeTextBlips.push(audio);
    audio.addEventListener("ended", () => {
      state.activeTextBlips = state.activeTextBlips.filter((item) => item !== audio);
    });
    const attempt = audio.play();
    if (attempt && typeof attempt.catch === "function") {
      attempt.catch(() => {
        state.activeTextBlips = state.activeTextBlips.filter((item) => item !== audio);
      });
    }
  }

  function finishTyping() {
    if (!state.isTyping) return;
    clearTypingTimer();
    state.isTyping = false;
    state.typingIndex = state.typingFullText.length;
    textEl.textContent = state.typingFullText;
    queuePlaybackAdvance();
  }

  function startTyping(text, instant) {
    clearTypingTimer();
    stopTextBlips();
    state.typingFullText = text || "";
    state.typingIndex = 0;

    if (instant || !state.typingFullText) {
      state.isTyping = false;
      textEl.textContent = state.typingFullText;
      queuePlaybackAdvance();
      return;
    }

    state.isTyping = true;
    textEl.textContent = "";
    const cps = getTypingSpeed();

    const tick = () => {
      if (!state.isTyping) return;
      state.typingIndex += 1;
      textEl.textContent = state.typingFullText.slice(0, state.typingIndex);
      const currentChar = state.typingFullText[state.typingIndex - 1];
      playTextBlipForChar(currentChar);
      if (state.typingIndex >= state.typingFullText.length) {
        state.isTyping = false;
        state.typingTimer = null;
        queuePlaybackAdvance();
        return;
      }
      state.typingTimer = window.setTimeout(tick, getTypeDelayForChar(currentChar, cps));
    };

    state.typingTimer = window.setTimeout(tick, 12);
  }

  function setDialogue(speakerName, text, speakerColor) {
    const hasSpeaker = Boolean(speakerName && String(speakerName).trim());
    speakerEl.textContent = hasSpeaker ? String(speakerName) : "\u00a0";
    speakerEl.style.color = speakerColor || "#ffdede";
    speakerEl.style.opacity = hasSpeaker ? "1" : "0.45";
    speakerEl.setAttribute("aria-hidden", hasSpeaker ? "false" : "true");
    speakerEl.classList.toggle("is-empty", !hasSpeaker);
    startTyping(resolveStoryText(text || ""), state.skipMode);
  }

  function clearChoices() {
    choicesEl.innerHTML = "";
    state.waitingForChoice = false;
  }

  function clearPlaybackTimer() {
    if (state.playbackTimer) {
      window.clearTimeout(state.playbackTimer);
      state.playbackTimer = null;
    }
  }

  function clearWaitTimer() {
    if (state.waitTimer) {
      window.clearTimeout(state.waitTimer);
      state.waitTimer = null;
    }
    state.waitingForDelay = false;
  }

  function updatePlaybackButtons() {
    autoplayBtn.setAttribute("aria-pressed", state.autoMode ? "true" : "false");
    skipBtn.setAttribute("aria-pressed", state.skipMode ? "true" : "false");
    autoplayBtn.classList.toggle("active", state.autoMode);
    skipBtn.classList.toggle("active", state.skipMode);
  }

  function queuePlaybackAdvance() {
    clearPlaybackTimer();
    if (state.finished || state.waitingForChoice) return;
    if (!state.autoMode && !state.skipMode) return;
    const delay = state.skipMode ? 40 : 1400;
    state.playbackTimer = window.setTimeout(() => {
      state.playbackTimer = null;
      advance();
    }, delay);
  }

  function setAutoMode(enabled) {
    state.autoMode = Boolean(enabled);
    if (state.autoMode) {
      state.skipMode = false;
    }
    updatePlaybackButtons();
    if (!state.autoMode) {
      clearPlaybackTimer();
      return;
    }
    queuePlaybackAdvance();
  }

  function setSkipMode(enabled) {
    state.skipMode = Boolean(enabled);
    if (state.skipMode) {
      state.autoMode = false;
    }
    updatePlaybackButtons();
    if (!state.skipMode) {
      clearPlaybackTimer();
      return;
    }
    queuePlaybackAdvance();
  }

  function validateLabel(labelName) {
    if (!state.story.labels || !state.story.labels[labelName]) {
      throw new Error(`Label not found: ${labelName}`);
    }
  }

  function jumpTo(labelName) {
    validateLabel(labelName);
    state.currentLabel = labelName;
    state.currentIndex = 0;
  }

  function renderChoices(prompt, options) {
    clearChoices();
    state.waitingForChoice = true;
    clearPlaybackTimer();
    if (state.skipMode) {
      state.skipMode = false;
      updatePlaybackButtons();
    }

    if (prompt) {
      const promptEl = document.createElement("div");
      promptEl.className = "vn-choice-prompt";
      promptEl.textContent = prompt;
      choicesEl.appendChild(promptEl);
    }

    (options || []).forEach((option) => {
      const btn = document.createElement("button");
      btn.className = "vn-choice-btn";
      btn.type = "button";
      btn.textContent = option.text || "Continue";
      btn.addEventListener("click", () => {
        playChoiceClickSfx();
        clearChoices();
        if (option.set && typeof option.set === "object") {
          Object.keys(option.set).forEach((key) => {
            state.story.vars[key] = option.set[key];
          });
        }
        if (option.call) {
          const shouldStop = executeStoryCall(option.call);
          if (shouldStop) return;
        }
        if (option.jump) {
          jumpTo(option.jump);
          runUntilStop();
          return;
        }
        runUntilStop();
      });
      choicesEl.appendChild(btn);
    });
  }

  function applyVisualCommands(step) {
    if (step.bg) setBackground(step.bg);
    if (step.fadeToBlack || step.fadeOut || step.fadeOutBlack) {
      setBgFade(true, step.fadeDurationMs);
    }
    if (step.clearFade || step.fadeIn) {
      setBgFade(false, step.fadeDurationMs);
    }
    if (Object.prototype.hasOwnProperty.call(step, "charLeft")) setCharacter("left", step.charLeft);
    if (Object.prototype.hasOwnProperty.call(step, "charCenter")) setCharacter("center", step.charCenter);
    if (Object.prototype.hasOwnProperty.call(step, "charRight")) setCharacter("right", step.charRight);
    if (step.hideChars) hideCharacters(step.hideChars === true ? null : step.hideChars);
    if (step.music) playMusic(step.music);
    if (step.bgm) playMusic(step.bgm);
    if (step.stopMusic || step.stopBgm) stopMusic();
    if (step.sfx) playSfx(step.sfx);
    if (step.stopSfx) stopSfx(step.stopSfx);
  }

  function handleEnd(endConfig) {
    const cfg = typeof endConfig === "string" ? { result: endConfig } : (endConfig || {});
    const endingText = cfg.text || "End.";
    setDialogue("System", endingText, "#ffb9b9");
    clearChoices();
    clearPlaybackTimer();
    state.finished = true;

    const result = String(cfg.result || "none").toLowerCase();
    if (result === "pass") passTest();
    if (result === "fail") failTest();

    if (cfg.jumpHome !== false && (result === "pass" || result === "fail")) {
      window.setTimeout(() => {
        goHome();
      }, 1200);
    }
  }

  function executeStoryCall(callConfig) {
    if (!callConfig) return false;
    const cfg = typeof callConfig === "string" ? { name: callConfig } : callConfig;
    const rawName = cfg.name || cfg.fn || cfg.action || cfg.call;
    const callName = String(rawName || "").toLowerCase();

    if (!callName) {
      throw new Error("Invalid call command. Expected a call name.");
    }

    if (callName === "passsequence" || callName === "pass_sequence" || callName === "pass") {
      passTest();
      if (cfg.text) setDialogue("System", cfg.text, "#ffb9b9");
      if (cfg.jumpHome) {
        state.finished = true;
        window.setTimeout(() => {
          goHome();
        }, Number(cfg.delayMs) || 1200);
        return true;
      }
      return false;
    }

    if (callName === "failsequence" || callName === "fail_sequence" || callName === "fail") {
      failTest();
      if (cfg.text) setDialogue("System", cfg.text, "#ffb9b9");
      if (cfg.jumpHome) {
        state.finished = true;
        window.setTimeout(() => {
          goHome();
        }, Number(cfg.delayMs) || 1200);
        return true;
      }
      return false;
    }

    if (callName === "gohome" || callName === "go_home" || callName === "returnhome" || callName === "return_home") {
      state.finished = true;
      goHome();
      return true;
    }

    throw new Error(`Unknown call command: ${rawName}`);
  }

  function readStepAtCursor() {
    const labelSteps = state.story.labels[state.currentLabel] || [];
    if (state.currentIndex >= labelSteps.length) return null;
    const step = labelSteps[state.currentIndex];
    state.currentIndex += 1;
    return step;
  }

  function runUntilStop() {
    if (state.finished || state.waitingForChoice || state.waitingForDelay) return;

    while (!state.finished && !state.waitingForChoice && !state.waitingForDelay) {
      const step = readStepAtCursor();
      if (step === null) {
        handleEnd({ result: "none", text: "End of label reached." });
        return;
      }

      if (typeof step === "string") {
        setDialogue("", step, "#ffdede");
        return;
      }

      if (!step || typeof step !== "object") {
        continue;
      }

      applyVisualCommands(step);

      if (Object.prototype.hasOwnProperty.call(step, "waitMs")) {
        const waitMs = Math.max(0, Number(step.waitMs) || 0);
        if (waitMs > 0) {
          clearWaitTimer();
          state.waitingForDelay = true;
          state.waitTimer = window.setTimeout(() => {
            state.waitTimer = null;
            state.waitingForDelay = false;
            runUntilStop();
          }, waitMs);
          return;
        }
      }

      if (step.call) {
        const shouldStop = executeStoryCall(step.call);
        if (shouldStop) return;
      }

      if (step.jump) {
        jumpTo(step.jump);
        continue;
      }

      if (step.choice) {
        const prompt = typeof step.choice === "string" ? step.choice : step.choice.prompt;
        const options = Array.isArray(step.options) ? step.options : (step.choice.options || []);
        renderChoices(prompt, options);
        return;
      }

      if (step.end) {
        handleEnd(step.end);
        return;
      }

      if (step.say || step.text) {
        const speaker = getSpeakerData(step.say);
        setDialogue(speaker.name, step.text || "", speaker.color);
        return;
      }

      if (step.narrate) {
        setDialogue("", step.narrate, "#ffdede");
        return;
      }
    }
  }

  function advance() {
    if (!state.story) return;
    if (state.isTyping) {
      finishTyping();
      return;
    }
    if (state.finished || state.waitingForChoice || state.waitingForDelay) return;
    clearPlaybackTimer();
    runUntilStop();
  }

  async function loadStory(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Could not load story file: ${url}`);
    }
    const json = await response.json();

    const story = {
      meta: json.meta || {},
      assets: json.assets || {},
      characters: json.characters || {},
      labels: json.labels || {},
      vars: json.vars || {}
    };

    const startLabel = story.meta.start || "start";
    if (!story.labels[startLabel]) {
      throw new Error(`Start label not found: ${startLabel}`);
    }

    return story;
  }

  function primeOpeningBgm() {
    if (!state.story || !state.story.labels) return false;
    const startLabel = state.story.meta.start || "start";
    const steps = state.story.labels[startLabel] || [];
    const beforeSrc = state.currentMusicSrc;

    for (const step of steps) {
      if (typeof step === "string") break;
      if (!step || typeof step !== "object") continue;
      if (step.say || step.text || step.narrate || step.choice || step.end || step.jump || step.call) {
        break;
      }
      applyVisualCommands(step);
    }

    return Boolean(state.currentMusicSrc && state.currentMusicSrc !== beforeSrc);
  }

  async function playPreTestCutscene() {
    cutsceneEl.hidden = false;
    cutsceneEl.classList.remove("fade-out");
    cutsceneVideoEl.currentTime = 0;
    cutsceneVideoEl.pause();

    return new Promise((resolve) => {
      let finished = false;

      function finishCutscene() {
        if (finished) return;
        finished = true;
        cutsceneVideoEl.pause();
        window.setTimeout(() => {
          cutsceneEl.classList.add("fade-out");
          window.setTimeout(() => {
            cutsceneEl.hidden = true;
            cutsceneEl.classList.remove("fade-out");
            resolve();
          }, CUTSCENE_FADE_MS);
        }, CUTSCENE_END_PAUSE_MS);
      }

      function handleVideoClick() {
        const videoAttempt = cutsceneVideoEl.play();
        if (videoAttempt && typeof videoAttempt.catch === "function") {
          videoAttempt.catch(() => {
            finishCutscene();
          });
        }
      }

      cutsceneVideoEl.addEventListener("click", handleVideoClick, { once: true });
      cutsceneVideoEl.addEventListener("ended", finishCutscene, { once: true });
      cutsceneVideoEl.addEventListener("error", finishCutscene, { once: true });
    });
  }

  async function boot() {
    try {
      hideError();
      setBgFade(false, 0);
      localStorage.setItem("lastTestedCase", objectKey);
      await playPreTestCutscene();

      state.story = await loadStory(storyPath);
      storyTitleEl.textContent = state.story.meta.title || "Untitled Story";
      jumpTo(state.story.meta.start || "start");
      if (primeOpeningBgm()) {
        await new Promise((resolve) => window.setTimeout(resolve, OPENING_BGM_LEAD_MS));
      }
      setDialogue("System", "Story loaded.", "#ffb9b9");
      runUntilStop();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Unknown error while loading story.");
    }
  }

  function isInteractiveTarget(target) {
    if (!target || typeof target.closest !== "function") return false;
    if (target.closest("#vnDialogBox")) return false;
    return Boolean(target.closest("button, a, input, select, textarea, label, [role='button']"));
  }

  document.addEventListener("click", (event) => {
    if (isInteractiveTarget(event.target)) return;
    advance();
  });

  dialogBoxEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      advance();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      if (event.target && (event.target.tagName === "BUTTON" || event.target.tagName === "A")) return;
      event.preventDefault();
      advance();
    }
  });

  restartBtn.addEventListener("click", () => {
    if (!state.story) {
      boot();
      return;
    }
    stopMusic();
    stopSfx(true);
    clearTypingTimer();
    stopTextBlips();
    state.isTyping = false;
    state.typingIndex = 0;
    state.typingFullText = "";
    clearPlaybackTimer();
    clearWaitTimer();
    state.finished = false;
    state.waitingForChoice = false;
    setBgFade(false, 0);
    clearChoices();
    jumpTo(state.story.meta.start || "start");
    runUntilStop();
  });

  autoplayBtn.addEventListener("click", () => {
    setAutoMode(!state.autoMode);
  });

  skipBtn.addEventListener("click", () => {
    setSkipMode(!state.skipMode);
  });

  window.addEventListener("beforeunload", () => {
    clearPlaybackTimer();
    clearTypingTimer();
    clearWaitTimer();
    stopTextBlips();
    cutsceneVideoEl.pause();
    cutsceneVideoEl.currentTime = 0;
    stopMusic();
    stopSfx(true);
  });

  boot();
})();
