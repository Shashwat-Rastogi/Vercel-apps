import { inject } from '@vercel/analytics';
import { createClient } from '@supabase/supabase-js';

// Initialize Vercel Web Analytics
inject();

// --- GAMIFICATION: Dynamic CSS Injection ---
const style = document.createElement('style');
style.innerHTML = `
  @keyframes popUp {
    0% { opacity: 0; transform: translate(-50%, -30%) scale(0.5); }
    50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
    100% { opacity: 0; transform: translate(-50%, -70%) scale(1); }
  }
  .combo-popup {
    position: fixed; top: 40%; left: 50%; transform: translate(-50%, -50%);
    font-size: 4rem; font-family: system-ui, sans-serif; color: #FFD700;
    font-weight: 900; text-shadow: 0 4px 20px rgba(0,0,0,0.5), 0 0 10px rgba(255,215,0,0.8);
    z-index: 9999; pointer-events: none;
    animation: popUp 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }
  .critical-health { animation: pulseRed 1s infinite; }
  @keyframes pulseRed {
    0% { box-shadow: inset 0 0 0px rgba(255, 0, 0, 0); }
    50% { box-shadow: inset 0 0 80px rgba(220, 38, 38, 0.3); }
    100% { box-shadow: inset 0 0 0px rgba(255, 0, 0, 0); }
  }
`;
document.head.appendChild(style);

// --- GAMIFICATION: Retro Audio Synth (CRASH PROOFED) ---
let audioCtx = null;
function initAudio() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext && !audioCtx) audioCtx = new AudioContext();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  } catch (e) {
    console.warn("Audio engine bypassed to prevent freeze.");
  }
}

function playSound(type, streak) {
  try {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400 + (streak * 40), audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600 + (streak * 40), audioCtx.currentTime + 0.1);
      gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.2);
      gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    }
  } catch(e) {
    // Ignore audio errors silently so the game never freezes
  }
}

function showComboPopup(streak) {
  const pop = document.createElement("div");
  pop.textContent = streak + "x COMBO!";
  pop.className = "combo-popup";
  document.body.appendChild(pop);
  setTimeout(() => pop.remove(), 1000);
}

// Initialize Supabase
const SUPABASE_URL = "https://obsihotephygxkqpbrrv.supabase.co"; 
const SUPABASE_KEY = "sb_publishable_CAMYNujLRhfeGfv6ofDSrQ_ABk_4pMf";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const MODULES = [
  { key: "english", name: "English Comprehension", count: 20, minutes: 20, topics: ["Synonyms", "Antonyms", "Contextual Vocabulary", "Error Identification", "Sentence Improvement", "Reading Comprehension"] },
  { key: "logic", name: "Logical Ability", count: 18, minutes: 20, topics: ["Coding Deductive Logic", "Data Sufficiency", "Direction Sense", "Word Sequence", "Analogy", "Classification", "Number Series", "Puzzles"] },
  { key: "quant", name: "Quantitative Ability", count: 12, minutes: 15, topics: ["Divisibility", "HCF & LCM", "Numbers", "Decimal Fractions", "Profit & Loss", "Interest", "Time Speed Distance", "Logarithms", "Permutation", "Probability"] }
];

const STORAGE_KEY = "amcatPracticeArenaUsers";
const SESSION_KEY = "amcatPracticeArenaCurrentUser";

const state = {
  questions: [], index: 0, score: 0, streak: 0, answers: [], moduleEnds: [],
  timer: null, secondsLeft: 0, locked: false, startedAt: null, shields: 3,
  maxStreak: 0, liveXp: 0, hintUsed: false, fiftyUsed: false,
};

let currentUser = null;
const $ = (selector) => document.querySelector(selector);

const screens = {
  login: $("#loginScreen"), intro: $("#introScreen"), game: $("#gameScreen"), result: $("#resultScreen"),
};

function shuffle(items) { return [...items].sort(() => Math.random() - 0.5); }
function makeOptions(answer, distractors) { return shuffle([answer, ...shuffle(distractors).slice(0, 3)]); }

async function buildExam() {
  state.questions = [];
  state.moduleEnds = [];
  
  try {
    const { data: allDbQuestions, error } = await supabase.from('questions').select('*');
    if (error) { console.error("Supabase Error:", error); return; }

    const user = getUser();
    const seenTexts = new Set(user?.seenQuestions || []);

    MODULES.forEach((module) => {
      const moduleQuestions = allDbQuestions.filter(q => q.module === module.key);
      let availableQs = moduleQuestions.filter(q => !seenTexts.has(q.text));

      if (availableQs.length < module.count) {
        console.warn(`Running low on fresh questions for ${module.key}. Recycling pool!`);
        availableQs = moduleQuestions; 
      }

      const shuffledModuleQs = shuffle(availableQs);

      for (let i = 0; i < module.count; i += 1) {
        const q = shuffledModuleQs[i];
        if (q) {
          let distractorsList = [];
          if (Array.isArray(q.distractors)) { distractorsList = q.distractors; } 
          else if (typeof q.distractors === 'string') {
            try { distractorsList = JSON.parse(q.distractors); } 
            catch(e) {
              try { distractorsList = JSON.parse(q.distractors.replace(/'/g, '"')); } 
              catch(e2) { distractorsList = q.distractors.replace(/[\[\]]/g, '').split(',').map(s => s.trim()); }
            }
          }
          if (!Array.isArray(distractorsList) || distractorsList.length === 0) distractorsList = ["A", "B", "C"];

          state.questions.push({ 
            topic: q.topic || "General", text: q.text, answer: q.answer, 
            options: makeOptions(q.answer, distractorsList),
            module: module.name, moduleKey: module.key, minutes: module.minutes 
          });
        }
      }
      state.moduleEnds.push(state.questions.length - 1);
    });
  } catch (error) { console.error("Exam build failed:", error); }

  state.index = 0; state.score = 0; state.streak = 0; state.answers = [];
  state.locked = false; state.startedAt = new Date().toISOString();
  state.shields = 3; state.maxStreak = 0; state.liveXp = 0;
  state.hintUsed = false; state.fiftyUsed = false;
  document.body.classList.remove("critical-health");
}

function showScreen(name) {
  Object.values(screens).forEach((screen) => screen.classList.add("hidden"));
  screens[name].classList.remove("hidden");
  $("#userBar").classList.toggle("hidden", name === "login");
}

async function startExam() {
  initAudio();
  const btn = $("#startExam"); const retryBtn = $("#retryExam");
  if(btn) btn.innerHTML = "<span>Connecting...</span>";
  if(retryBtn) retryBtn.innerHTML = "<span>Fetching...</span>";
  if(btn) btn.disabled = true; if(retryBtn) retryBtn.disabled = true;

  await buildExam();

  if(btn) { btn.innerHTML = `<span>Start Practice</span><span aria-hidden="true">&gt;</span>`; btn.disabled = false; }
  if(retryBtn) { retryBtn.innerHTML = "Play Again"; retryBtn.disabled = false; }

  showScreen("game");
  startModuleTimer();
  renderQuestion();
  saveCurrentAttempt();
}

function startModuleTimer() {
  clearInterval(state.timer);
  const question = state.questions[state.index];
  state.secondsLeft = question.minutes * 60;
  tickTimer();
  state.timer = setInterval(() => {
    state.secondsLeft -= 1; tickTimer(); saveCurrentAttempt();
    if (state.secondsLeft <= 0) finishModuleByTimeout();
  }, 1000);
}

function tickTimer() {
  const minutes = Math.max(0, Math.floor(state.secondsLeft / 60));
  const seconds = Math.max(0, state.secondsLeft % 60);
  $("#timerText").textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function finishModuleByTimeout() {
  const end = state.moduleEnds.find((moduleEnd) => moduleEnd >= state.index);
  while (state.index <= end) {
    state.answers.push({ ...state.questions[state.index], selected: "Timed out", correct: false });
    state.index += 1;
  }
  if (state.index >= state.questions.length) return finishExam();
  startModuleTimer(); renderQuestion(); saveCurrentAttempt();
}

function renderQuestion() {
  state.locked = false;
  const question = state.questions[state.index];
  $("#moduleLabel").textContent = question.module;
  $("#questionTitle").textContent = `Question ${state.index + 1} of ${state.questions.length}`;
  $("#topicBadge").textContent = question.topic || "General";
  $("#streakBadge").textContent = `Streak ${state.streak}`;
  $("#questionText").textContent = question.text;
  $("#scoreText").textContent = state.score;
  $("#answeredText").textContent = state.answers.length;
  $("#progressFill").style.width = `${(state.answers.length / state.questions.length) * 100}%`;
  $("#shieldText").textContent = `${state.shields}/3`;
  $("#comboText").textContent = `x${Math.max(1, state.streak)}`;
  $("#liveXpText").textContent = `+${state.liveXp}`;
  $("#hintBox").classList.add("hidden"); $("#hintBox").textContent = "";
  
  $("#hintButton").disabled = state.hintUsed;
  $("#fiftyButton").disabled = state.fiftyUsed;
  $("#nextQuestion").disabled = true;

  if (state.shields === 1) document.body.classList.add("critical-health");
  else document.body.classList.remove("critical-health");

  const optionsGrid = $("#optionsGrid");
  optionsGrid.innerHTML = "";
  
  question.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.className = "option-button";
    button.dataset.value = option;
    button.innerHTML = `<span class="option-letter">${String.fromCharCode(65 + index)}</span><span class="option-copy">${option}</span>`;
    button.addEventListener("click", () => chooseAnswer(button, option));
    optionsGrid.appendChild(button);
  });
}

function chooseAnswer(button, selected) {
  if (state.locked) return;
  state.locked = true;
  initAudio();
  
  const question = state.questions[state.index];
  const correct = selected === question.answer;

  const comboBonus = correct ? state.streak * 2 : 0;
  state.score += correct ? 10 + comboBonus : 0;
  state.streak = correct ? state.streak + 1 : 0;
  state.maxStreak = Math.max(state.maxStreak, state.streak);
  state.liveXp += correct ? 12 + comboBonus : 2;
  state.shields = correct ? state.shields : Math.max(0, state.shields - 1);
  state.answers.push({ ...question, selected, correct });

  playSound(correct ? 'correct' : 'wrong', state.streak);
  if (correct && state.streak > 0 && state.streak % 3 === 0) showComboPopup(state.streak);
  if (state.shields === 1) document.body.classList.add("critical-health");

  document.querySelectorAll(".option-button").forEach((optionButton) => {
    optionButton.disabled = true;
    if (optionButton.dataset.value === question.answer) optionButton.classList.add("correct");
  });
  if (!correct) button.classList.add("wrong");

  $("#scoreText").textContent = state.score;
  $("#answeredText").textContent = state.answers.length;
  $("#streakBadge").textContent = `Streak ${state.streak}`;
  $("#shieldText").textContent = `${state.shields}/3`;
  $("#comboText").textContent = `x${Math.max(1, state.streak)}`;
  $("#liveXpText").textContent = `+${state.liveXp}`;
  $("#progressFill").style.width = `${(state.answers.length / state.questions.length) * 100}%`;
  $("#nextQuestion").disabled = false;
  saveCurrentAttempt();
}

function nextQuestion() {
  if (!state.locked) return;
  const wasModuleEnd = state.moduleEnds.includes(state.index);
  state.index += 1;
  if (state.index >= state.questions.length) return finishExam();
  if (wasModuleEnd) startModuleTimer();
  renderQuestion(); saveCurrentAttempt();
}

function finishExam() {
  clearInterval(state.timer);
  document.body.classList.remove("critical-health");
  showScreen("result");
  const correct = state.answers.filter((answer) => answer.correct).length;
  const accuracy = Math.round((correct / state.questions.length) * 100);
  $("#resultTitle").textContent = `${correct}/${state.questions.length} correct`;
  $("#resultMessage").textContent = `You scored ${state.score} points with ${accuracy}% accuracy.`;
  renderModuleResults();
  const rewards = saveFinishedAttempt(correct, accuracy);
  renderRewards(rewards);
  $("#reviewList").classList.add("hidden");
}

function renderModuleResults() {
  const container = $("#moduleResults"); container.innerHTML = "";
  MODULES.forEach((module) => {
    const answers = state.answers.filter((answer) => answer.moduleKey === module.key);
    const correct = answers.filter((answer) => answer.correct).length;
    const card = document.createElement("div"); card.className = "module-card";
    card.innerHTML = `<div><strong>${module.name}</strong><span>${module.count} Q - ${module.minutes} minutes</span></div><strong>${correct}/${module.count}</strong>`;
    container.appendChild(card);
  });
}

function reviewMistakes() {
  const misses = state.answers.filter((answer) => !answer.correct);
  const list = $("#reviewList"); list.innerHTML = "";
  list.classList.toggle("hidden", !list.classList.contains("hidden"));
  if (list.classList.contains("hidden")) return;
  if (!misses.length) { list.innerHTML = `<div class="review-card"><strong>Clean run.</strong><p>No missed answers.</p></div>`; return; }
  misses.forEach((miss) => {
    const card = document.createElement("div"); card.className = "review-card";
    card.innerHTML = `<span>${miss.module} - ${miss.topic}</span><p><strong>Q:</strong> ${miss.text}</p><p><strong>Your answer:</strong> ${miss.selected}</p><p><strong>Correct:</strong> ${miss.answer}</p>`;
    list.appendChild(card);
  });
}

function loadUsers() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; } }
function saveUsers(users) { localStorage.setItem(STORAGE_KEY, JSON.stringify(users)); }
function getUser() { if (!currentUser) return null; return loadUsers()[currentUser] || null; }
function updateUser(updater) {
  if (!currentUser) return;
  const users = loadUsers(); const user = users[currentUser];
  if (!user) return;
  updater(user); users[currentUser] = user; saveUsers(users);
}

function login(event) {
  event.preventDefault();
  const name = $("#loginName").value.trim(); const password = $("#loginPassword").value;
  const message = $("#loginMessage");
  if (!name || !password) return;

  const key = name.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  const users = loadUsers();
  if (users[key] && users[key].password !== password) { message.textContent = "Wrong password."; return; }

  if (!users[key]) {
    users[key] = { name, password, attempts: [], inProgress: null, xp: 0, badges: [], seenQuestions: [], createdAt: new Date().toISOString() };
    saveUsers(users);
  }
  currentUser = key; localStorage.setItem(SESSION_KEY, key);
  message.textContent = ""; openHome();
}

function logout() { clearInterval(state.timer); currentUser = null; localStorage.removeItem(SESSION_KEY); $("#loginPassword").value = ""; showScreen("login"); }

function openHome() {
  clearInterval(state.timer);
  const user = getUser();
  if (!user) { showScreen("login"); return; }
  $("#playerName").textContent = user.name;
  renderHistory(); renderQuestBoard(); showScreen("intro");
}

function renderHistory() {
  const user = getUser(); const list = $("#historyList"); const attempts = user?.attempts || [];
  list.innerHTML = ""; $("#resumeExam").classList.toggle("hidden", !user?.inProgress);
  if (!attempts.length) {
    $("#bestScore").textContent = `Best 0/${MODULES.reduce((sum, m) => sum + m.count, 0)}`;
    list.innerHTML = `<p class="empty-history">No saved results yet.</p>`; return;
  }
  const totalQuestions = MODULES.reduce((sum, m) => sum + m.count, 0);
  const best = attempts.reduce((top, attempt) => (attempt.correct > top.correct ? attempt : top), attempts[0]);
  $("#bestScore").textContent = `Best ${best.correct}/${totalQuestions}`;
  attempts.slice(0, 5).forEach((attempt) => {
    const date = new Date(attempt.finishedAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
    const item = document.createElement("div"); item.className = "history-item";
    item.innerHTML = `<div><strong>${date}</strong><span>${attempt.accuracy}% accuracy - ${attempt.score} points</span></div><div class="history-score">${attempt.correct}/${totalQuestions}</div>`;
    list.appendChild(item);
  });
}

function getLevelInfo(xp = 0) {
  const level = Math.floor(xp / 500) + 1; const currentLevelXp = xp % 500;
  const ranks = ["Rookie Runner", "Logic Raider", "Quant Knight", "Verbal Victor", "AMCAT Champion"];
  const rank = ranks[Math.min(ranks.length - 1, Math.floor((level - 1) / 3))];
  return { level, currentLevelXp, rank };
}

function renderQuestBoard() {
  const user = getUser(); if (!user) return;
  const attempts = user.attempts || []; const badges = user.badges || [];
  const totalCorrect = attempts.reduce((sum, attempt) => sum + attempt.correct, 0);
  const { level, currentLevelXp, rank } = getLevelInfo(user.xp || 0);

  $("#rankTitle").textContent = rank; $("#levelText").textContent = `Lv ${level}`;
  $("#xpText").textContent = `${user.xp || 0} XP`; $("#xpFill").style.width = `${(currentLevelXp / 500) * 100}%`;
  $("#totalAttempts").textContent = attempts.length; $("#totalCorrect").textContent = totalCorrect;
  $("#badgeCount").textContent = badges.length;

  const rack = $("#badgeRack"); rack.innerHTML = "";
  if (!badges.length) { rack.innerHTML = `<span class="empty-history">Badges unlock later.</span>`; return; }
  badges.slice(0, 8).forEach((badge) => {
    const chip = document.createElement("span"); chip.className = "badge-chip"; chip.textContent = badge; rack.appendChild(chip);
  });
}

function hintText(topic) { return "Eliminate the clearly wrong options first, then compare the final two."; }

function useHint() {
  if (state.locked || state.hintUsed) return;
  state.hintUsed = true; state.liveXp = Math.max(0, state.liveXp - 5);
  $("#hintBox").textContent = hintText(state.questions[state.index].topic);
  $("#hintBox").classList.remove("hidden"); $("#hintButton").disabled = true;
  $("#liveXpText").textContent = `+${state.liveXp}`; saveCurrentAttempt();
}

function useFifty() {
  if (state.locked || state.fiftyUsed) return;
  state.fiftyUsed = true; state.liveXp = Math.max(0, state.liveXp - 10);
  const wrongButtons = [...document.querySelectorAll(".option-button")].filter((button) => button.dataset.value !== state.questions[state.index].answer).slice(0, 2);
  wrongButtons.forEach((button) => { button.disabled = true; button.style.opacity = "0.34"; });
  $("#fiftyButton").disabled = true; $("#liveXpText").textContent = `+${state.liveXp}`; saveCurrentAttempt();
}

function renderRewards(rewards) {
  const badges = rewards.newBadges.length ? rewards.newBadges.join(", ") : "No new badge";
  $("#rewardPanel").innerHTML = `<div class="reward-card"><span>XP Earned</span><strong>+${rewards.earnedXp}</strong></div><div class="reward-card"><span>Best Combo</span><strong>${state.maxStreak}</strong></div><div class="reward-card"><span>New Badges</span><strong>${badges}</strong></div>`;
}

function saveCurrentAttempt() {
  if (!currentUser || !state.questions.length || state.index >= state.questions.length) return;
  updateUser((user) => {
    user.inProgress = { questions: state.questions, index: state.index, score: state.score, streak: state.streak, answers: state.answers, moduleEnds: state.moduleEnds, secondsLeft: state.secondsLeft, startedAt: state.startedAt, shields: state.shields, maxStreak: state.maxStreak, liveXp: state.liveXp, hintUsed: state.hintUsed, fiftyUsed: state.fiftyUsed };
  });
}

function resumeAttempt() {
  const saved = getUser()?.inProgress; if (!saved) return;
  clearInterval(state.timer);
  Object.assign(state, saved); state.locked = false;
  showScreen("game"); tickTimer();
  state.timer = setInterval(() => {
    state.secondsLeft -= 1; tickTimer(); saveCurrentAttempt();
    if (state.secondsLeft <= 0) finishModuleByTimeout();
  }, 1000);
  renderQuestion();
}

function moduleSummary() {
  return MODULES.map((module) => {
    const answers = state.answers.filter((answer) => answer.moduleKey === module.key);
    return { key: module.key, name: module.name, total: module.count, correct: answers.filter((answer) => answer.correct).length, minutes: module.minutes };
  });
}

function saveFinishedAttempt(correct, accuracy) {
  if (!currentUser) return { earnedXp: 0, newBadges: [] };
  const earnedXp = state.liveXp + correct * 5 + Math.max(0, accuracy - 50) * 2 + state.shields * 25;
  let newBadges = [];
  updateUser((user) => {
    const attempts = user.attempts || []; const badges = new Set(user.badges || []);
    const award = (badge) => { if (!badges.has(badge)) { badges.add(badge); newBadges.push(badge); } };

    award("First Login"); if (!attempts.length) award("First Run");
    if (accuracy >= 70) award("Sharp Shooter"); if (accuracy >= 85) award("Arena Ace");
    if (state.maxStreak >= 5) award("Combo Climber"); if (state.shields === 3) award("Untouched Shields");
    if (moduleSummary().some((module) => module.correct === module.total)) award("Module Master");

    const seen = new Set(user.seenQuestions || []);
    state.questions.forEach(q => seen.add(q.text));
    user.seenQuestions = [...seen];

    user.inProgress = null; user.xp = (user.xp || 0) + earnedXp; user.badges = [...badges];
    user.attempts = [{ id: String(Date.now()), startedAt: state.startedAt, finishedAt: new Date().toISOString(), score: state.score, correct, total: state.questions.length, accuracy, earnedXp, maxStreak: state.maxStreak, shieldsLeft: state.shields, modules: moduleSummary(), misses: state.answers.filter((answer) => !answer.correct) }, ...attempts].slice(0, 25);
  });
  return { earnedXp, newBadges };
}

function boot() {
  currentUser = localStorage.getItem(SESSION_KEY);
  if (currentUser && getUser()) { openHome(); } else { currentUser = null; showScreen("login"); }
}

$("#loginForm").addEventListener("submit", login); $("#logoutButton").addEventListener("click", logout);
$("#startExam").addEventListener("click", startExam); $("#resumeExam").addEventListener("click", resumeAttempt);
$("#retryExam").addEventListener("click", startExam); $("#nextQuestion").addEventListener("click", nextQuestion);
$("#reviewMistakes").addEventListener("click", reviewMistakes); $("#backHome").addEventListener("click", openHome);
$("#hintButton").addEventListener("click", useHint); $("#fiftyButton").addEventListener("click", useFifty);

boot();