(function initVisualNovelEngine() {
  const storyTitleEl = document.getElementById("vnStoryTitle");
  const bgEl = document.getElementById("vnBackground");
  const charLeftEl = document.getElementById("vnCharLeft");
  const charCenterEl = document.getElementById("vnCharCenter");
  const charRightEl = document.getElementById("vnCharRight");
  const speakerEl = document.getElementById("vnSpeaker");
  const textEl = document.getElementById("vnText");
  const choicesEl = document.getElementById("vnChoices");
  const dialogBoxEl = document.getElementById("vnDialogBox");
  const autoplayBtn = document.getElementById("vnAutoplayBtn");
  const skipBtn = document.getElementById("vnSkipBtn");
  const restartBtn = document.getElementById("vnRestartBtn");
  const errorWrapEl = document.getElementById("vnError");
  const errorTextEl = document.getElementById("vnErrorText");

  if (!storyTitleEl || !bgEl || !speakerEl || !textEl || !choicesEl || !dialogBoxEl || !autoplayBtn || !skipBtn || !restartBtn || !errorWrapEl || !errorTextEl) {
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

  const state = {
    story: null,
    currentLabel: "",
    currentIndex: 0,
    waitingForChoice: false,
    finished: false,
    currentMusicSrc: "",
    autoMode: false,
    skipMode: false,
    playbackTimer: null
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
    const activeAudio = document.querySelector("audio[data-vn-music='true']");
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.remove();
    }
    state.currentMusicSrc = "";
  }

  function playMusic(assetRef) {
    const src = resolveAsset(assetRef);
    if (!src || state.currentMusicSrc === src) return;

    stopMusic();

    const audio = document.createElement("audio");
    audio.dataset.vnMusic = "true";
    audio.loop = true;
    audio.volume = 0.3;
    audio.src = src;
    document.body.appendChild(audio);

    const attempt = audio.play();
    if (attempt && typeof attempt.catch === "function") {
      attempt.catch(() => {});
    }

    state.currentMusicSrc = src;
  }

  function playSfx(assetRef) {
    const src = resolveAsset(assetRef);
    if (!src) return;
    const audio = new Audio(src);
    audio.volume = 0.45;
    const attempt = audio.play();
    if (attempt && typeof attempt.catch === "function") {
      attempt.catch(() => {});
    }
  }

  function getSpeakerData(speakerKeyOrName) {
    if (!speakerKeyOrName) return { name: "Narrator", color: "#ffdede" };

    const fromCharacters = state.story.characters && state.story.characters[speakerKeyOrName];
    if (fromCharacters) {
      return {
        name: fromCharacters.name || speakerKeyOrName,
        color: fromCharacters.color || "#ffdede"
      };
    }

    return { name: String(speakerKeyOrName), color: "#ffdede" };
  }

  function setDialogue(speakerName, text, speakerColor) {
    speakerEl.textContent = speakerName || "Narrator";
    speakerEl.style.color = speakerColor || "#ffdede";
    textEl.textContent = text || "";
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
    if (Object.prototype.hasOwnProperty.call(step, "charLeft")) setCharacter("left", step.charLeft);
    if (Object.prototype.hasOwnProperty.call(step, "charCenter")) setCharacter("center", step.charCenter);
    if (Object.prototype.hasOwnProperty.call(step, "charRight")) setCharacter("right", step.charRight);
    if (step.hideChars) hideCharacters(step.hideChars === true ? null : step.hideChars);
    if (step.music) playMusic(step.music);
    if (step.stopMusic) stopMusic();
    if (step.sfx) playSfx(step.sfx);
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
    if (state.finished || state.waitingForChoice) return;

    while (!state.finished && !state.waitingForChoice) {
      const step = readStepAtCursor();
      if (step === null) {
        handleEnd({ result: "none", text: "End of label reached." });
        return;
      }

      if (typeof step === "string") {
        setDialogue("Narrator", step, "#ffdede");
        queuePlaybackAdvance();
        return;
      }

      if (!step || typeof step !== "object") {
        continue;
      }

      applyVisualCommands(step);

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
        queuePlaybackAdvance();
        return;
      }

      if (step.narrate) {
        setDialogue("Narrator", step.narrate, "#ffdede");
        queuePlaybackAdvance();
        return;
      }
    }
  }

  function advance() {
    if (state.finished || state.waitingForChoice) return;
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

  async function boot() {
    try {
      hideError();
      localStorage.setItem("lastTestedCase", objectKey);

      state.story = await loadStory(storyPath);
      storyTitleEl.textContent = state.story.meta.title || "Untitled Story";
      jumpTo(state.story.meta.start || "start");
      setDialogue("System", "Story loaded.", "#ffb9b9");
      runUntilStop();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Unknown error while loading story.");
    }
  }

  dialogBoxEl.addEventListener("click", advance);
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
    clearPlaybackTimer();
    state.finished = false;
    state.waitingForChoice = false;
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
    stopMusic();
  });

  boot();
})();
