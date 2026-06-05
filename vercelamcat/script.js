const MODULES = [
  {
    key: "english",
    name: "English Comprehension",
    count: 20,
    minutes: 20,
    topics: ["Synonyms", "Antonyms", "Contextual Vocabulary", "Error Identification", "Sentence Improvement", "Reading Comprehension"],
  },
  {
    key: "logic",
    name: "Logical Ability",
    count: 18,
    minutes: 20,
    topics: ["Coding Deductive Logic", "Data Sufficiency", "Direction Sense", "Word Sequence", "Analogy", "Classification", "Number Series", "Puzzles"],
  },
  {
    key: "quant",
    name: "Quantitative Ability",
    count: 12,
    minutes: 15,
    topics: ["Divisibility", "HCF & LCM", "Numbers", "Decimal Fractions", "Profit & Loss", "Interest", "Time Speed Distance", "Logarithms", "Permutation", "Probability"],
  },
];

const STORAGE_KEY = "amcatPracticeArenaUsers";
const SESSION_KEY = "amcatPracticeArenaCurrentUser";

const state = {
  questions: [],
  index: 0,
  score: 0,
  streak: 0,
  answers: [],
  moduleEnds: [],
  timer: null,
  secondsLeft: 0,
  locked: false,
  startedAt: null,
  shields: 3,
  maxStreak: 0,
  liveXp: 0,
  hintUsed: false,
  fiftyUsed: false,
};

let currentUser = null;
const $ = (selector) => document.querySelector(selector);

const screens = {
  login: $("#loginScreen"),
  intro: $("#introScreen"),
  game: $("#gameScreen"),
  result: $("#resultScreen"),
};

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (items) => items[rand(0, items.length - 1)];

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function makeOptions(answer, distractors) {
  return shuffle([answer, ...shuffle(distractors).slice(0, 3)]);
}

function vocabularyQuestion(topic) {
  const words = [
    ["abundant", "plentiful", ["scarce", "ancient", "fragile", "silent"]],
    ["meticulous", "careful", ["careless", "quick", "ordinary", "doubtful"]],
    ["reluctant", "unwilling", ["eager", "bright", "loyal", "simple"]],
    ["brief", "short", ["lengthy", "formal", "direct", "clever"]],
    ["expand", "increase", ["reduce", "repair", "defend", "measure"]],
    ["hostile", "unfriendly", ["friendly", "hidden", "patient", "useful"]],
  ];
  const [word, synonym, antonyms] = pick(words);
  if (topic === "Antonyms") {
    return {
      topic,
      text: `Choose the antonym of "${word}".`,
      answer: antonyms[0],
      options: makeOptions(antonyms[0], [synonym, ...antonyms.slice(1), "neutral"]),
    };
  }
  return {
    topic,
    text: `Choose the closest meaning of "${word}".`,
    answer: synonym,
    options: makeOptions(synonym, antonyms),
  };
}

function englishQuestion() {
  const topic = pick(MODULES[0].topics);
  if (["Synonyms", "Antonyms", "Contextual Vocabulary"].includes(topic)) return vocabularyQuestion(topic);
  if (topic === "Reading Comprehension") {
    const passages = [
      ["A team improves fastest when it reviews small failures immediately after practice.", "quick review helps learning"],
      ["A product is useful only when it solves a real problem for the person using it.", "usefulness depends on solving user problems"],
      ["Regular mock tests reveal weak areas better than reading notes alone.", "practice tests identify gaps"],
    ];
    const [passage, answer] = pick(passages);
    return {
      topic,
      text: `${passage} What is the main idea?`,
      answer,
      options: makeOptions(answer, ["luck matters more than practice", "notes should never be used", "speed is always more important", "all teams work the same way"]),
    };
  }
  if (topic === "Sentence Improvement") {
    return {
      topic,
      text: "Choose the best improvement: She is senior than me in the company.",
      answer: "She is senior to me in the company.",
      options: makeOptions("She is senior to me in the company.", ["She is senior from me in the company.", "She is senior than I in the company.", "No improvement"]),
    };
  }
  return {
    topic,
    text: "Find the error: Neither the manager nor the employees was ready for the audit.",
    answer: "was ready",
    options: makeOptions("was ready", ["Neither the manager", "nor the employees", "for the audit"]),
  };
}

function logicalQuestion() {
  const topic = pick(MODULES[1].topics);
  if (topic === "Number Series") {
    const start = rand(2, 9);
    const gap = rand(3, 8);
    const answer = start + gap * 4;
    return {
      topic,
      text: `Find the next number: ${start}, ${start + gap}, ${start + gap * 2}, ${start + gap * 3}, ?`,
      answer: String(answer),
      options: makeOptions(String(answer), [String(answer + gap), String(answer - 1), String(answer + 2), String(answer - gap)]),
    };
  }
  if (topic === "Direction Sense") {
    const north = rand(2, 8);
    const east = rand(3, 9);
    return {
      topic,
      text: `A person walks ${north} km north, then ${east} km east. Which direction is the person from the starting point?`,
      answer: "North-East",
      options: makeOptions("North-East", ["South-East", "North-West", "East", "South"]),
    };
  }
  if (topic === "Analogy") {
    return {
      topic,
      text: "Book is to Reading as Fork is to ____.",
      answer: "Eating",
      options: makeOptions("Eating", ["Drawing", "Writing", "Sleeping", "Driving"]),
    };
  }
  if (topic === "Coding Deductive Logic") {
    const code = rand(2, 5);
    return {
      topic,
      text: `If A = ${code}, B = ${code + 1}, C = ${code + 2}, what is the value of CAB?`,
      answer: `${code + 2}${code}${code + 1}`,
      options: makeOptions(`${code + 2}${code}${code + 1}`, [`${code}${code + 1}${code + 2}`, `${code + 1}${code + 2}${code}`, `${code + 2}${code + 1}${code}`, `${code}${code + 2}${code + 1}`]),
    };
  }
  return {
    topic,
    text: "Statements: All roses are flowers. Some flowers fade quickly. Which conclusion definitely follows?",
    answer: "All roses are flowers",
    options: makeOptions("All roses are flowers", ["All flowers are roses", "Some roses fade quickly", "No flowers fade", "All fading things are roses"]),
  };
}

function quantQuestion() {
  const topic = pick(MODULES[2].topics);
  if (topic === "Profit & Loss") {
    const cp = rand(20, 80) * 10;
    const profit = pick([10, 15, 20, 25]);
    const answer = cp + (cp * profit) / 100;
    return {
      topic,
      text: `An article costs Rs. ${cp}. It is sold at ${profit}% profit. What is the selling price?`,
      answer: `Rs. ${answer}`,
      options: makeOptions(`Rs. ${answer}`, [`Rs. ${cp - profit}`, `Rs. ${cp + profit}`, `Rs. ${answer + 20}`, `Rs. ${answer - 20}`]),
    };
  }
  if (topic === "Time Speed Distance") {
    const speed = rand(30, 80);
    const time = rand(2, 6);
    return {
      topic,
      text: `A train travels at ${speed} km/h for ${time} hours. What distance does it cover?`,
      answer: `${speed * time} km`,
      options: makeOptions(`${speed * time} km`, [`${speed + time} km`, `${speed * (time + 1)} km`, `${speed * time - 10} km`, `${speed * time + 15} km`]),
    };
  }
  if (topic === "HCF & LCM") {
    const a = pick([12, 18, 24, 30, 36]);
    const b = pick([18, 24, 30, 42, 48]);
    const hcf = gcd(a, b);
    return {
      topic,
      text: `Find the HCF of ${a} and ${b}.`,
      answer: String(hcf),
      options: makeOptions(String(hcf), [String(hcf + 2), String(Math.max(a, b)), String(a + b), String(Math.abs(a - b))]),
    };
  }
  if (topic === "Probability") {
    return {
      topic,
      text: "A fair die is rolled once. What is the probability of getting an even number?",
      answer: "1/2",
      options: makeOptions("1/2", ["1/3", "1/6", "2/3", "5/6"]),
    };
  }
  const a = rand(12, 48);
  const b = rand(3, 12);
  return {
    topic,
    text: `Calculate ${a} x ${b}.`,
    answer: String(a * b),
    options: makeOptions(String(a * b), [String(a + b), String(a * b + b), String(a * b - a), String(a * (b + 1))]),
  };
}

function gcd(a, b) {
  while (b) [a, b] = [b, a % b];
  return a;
}

function buildExam() {
  state.questions = [];
  state.moduleEnds = [];
  MODULES.forEach((module) => {
    const generator = module.key === "english" ? englishQuestion : module.key === "logic" ? logicalQuestion : quantQuestion;
    for (let i = 0; i < module.count; i += 1) {
      state.questions.push({ ...generator(), module: module.name, moduleKey: module.key, minutes: module.minutes });
    }
    state.moduleEnds.push(state.questions.length - 1);
  });
  state.index = 0;
  state.score = 0;
  state.streak = 0;
  state.answers = [];
  state.locked = false;
  state.startedAt = new Date().toISOString();
  state.shields = 3;
  state.maxStreak = 0;
  state.liveXp = 0;
  state.hintUsed = false;
  state.fiftyUsed = false;
}

function showScreen(name) {
  Object.values(screens).forEach((screen) => screen.classList.add("hidden"));
  screens[name].classList.remove("hidden");
  $("#userBar").classList.toggle("hidden", name === "login");
}

function startExam() {
  buildExam();
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
    state.secondsLeft -= 1;
    tickTimer();
    saveCurrentAttempt();
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
  startModuleTimer();
  renderQuestion();
  saveCurrentAttempt();
}

function renderQuestion() {
  state.locked = false;
  const question = state.questions[state.index];
  $("#moduleLabel").textContent = question.module;
  $("#questionTitle").textContent = `Question ${state.index + 1} of ${state.questions.length}`;
  $("#topicBadge").textContent = question.topic;
  $("#streakBadge").textContent = `Streak ${state.streak}`;
  $("#questionText").textContent = question.text;
  $("#scoreText").textContent = state.score;
  $("#answeredText").textContent = state.answers.length;
  $("#progressFill").style.width = `${(state.answers.length / state.questions.length) * 100}%`;
  $("#shieldText").textContent = `${state.shields}/3`;
  $("#comboText").textContent = `x${Math.max(1, state.streak)}`;
  $("#liveXpText").textContent = `+${state.liveXp}`;
  $("#hintBox").classList.add("hidden");
  $("#hintBox").textContent = "";
  $("#hintButton").disabled = state.hintUsed;
  $("#fiftyButton").disabled = state.fiftyUsed;
  $("#nextQuestion").disabled = true;

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
  const question = state.questions[state.index];
  const correct = selected === question.answer;
  const comboBonus = correct ? state.streak * 2 : 0;
  const gained = correct ? 10 + comboBonus : 0;
  state.score += gained;
  state.streak = correct ? state.streak + 1 : 0;
  state.maxStreak = Math.max(state.maxStreak, state.streak);
  state.liveXp += correct ? 12 + comboBonus : 2;
  state.shields = correct ? state.shields : Math.max(0, state.shields - 1);
  state.answers.push({ ...question, selected, correct });

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
  renderQuestion();
  saveCurrentAttempt();
}

function finishExam() {
  clearInterval(state.timer);
  showScreen("result");
  const correct = state.answers.filter((answer) => answer.correct).length;
  const accuracy = Math.round((correct / state.questions.length) * 100);
  $("#resultTitle").textContent = `${correct}/50 correct`;
  $("#resultMessage").textContent = `You scored ${state.score} points with ${accuracy}% accuracy. Play again to get a fresh randomized AMCAT-style set.`;
  renderModuleResults();
  const rewards = saveFinishedAttempt(correct, accuracy);
  renderRewards(rewards);
  $("#reviewList").classList.add("hidden");
}

function renderModuleResults() {
  const container = $("#moduleResults");
  container.innerHTML = "";
  MODULES.forEach((module) => {
    const answers = state.answers.filter((answer) => answer.moduleKey === module.key);
    const correct = answers.filter((answer) => answer.correct).length;
    const card = document.createElement("div");
    card.className = "module-card";
    card.innerHTML = `<div><strong>${module.name}</strong><span>${module.count} MCQ - ${module.minutes} minutes</span></div><strong>${correct}/${module.count}</strong>`;
    container.appendChild(card);
  });
}

function reviewMistakes() {
  const misses = state.answers.filter((answer) => !answer.correct);
  const list = $("#reviewList");
  list.innerHTML = "";
  list.classList.toggle("hidden", !list.classList.contains("hidden"));
  if (list.classList.contains("hidden")) return;
  if (!misses.length) {
    list.innerHTML = `<div class="review-card"><strong>Clean run.</strong><p>No missed answers in this attempt.</p></div>`;
    return;
  }
  misses.forEach((miss) => {
    const card = document.createElement("div");
    card.className = "review-card";
    card.innerHTML = `<span>${miss.module} - ${miss.topic}</span><p><strong>Q:</strong> ${miss.text}</p><p><strong>Your answer:</strong> ${miss.selected}</p><p><strong>Correct:</strong> ${miss.answer}</p>`;
    list.appendChild(card);
  });
}

function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function getUser() {
  if (!currentUser) return null;
  return loadUsers()[currentUser] || null;
}

function updateUser(updater) {
  if (!currentUser) return;
  const users = loadUsers();
  const user = users[currentUser];
  if (!user) return;
  updater(user);
  users[currentUser] = user;
  saveUsers(users);
}

function login(event) {
  event.preventDefault();
  const name = $("#loginName").value.trim();
  const password = $("#loginPassword").value;
  const message = $("#loginMessage");
  if (!name || !password) return;

  const key = name.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  const users = loadUsers();
  if (users[key] && users[key].password !== password) {
    message.textContent = "Wrong password for this profile.";
    return;
  }

  if (!users[key]) {
    users[key] = {
      name,
      password,
      attempts: [],
      inProgress: null,
      xp: 0,
      badges: [],
      createdAt: new Date().toISOString(),
    };
    saveUsers(users);
  }

  currentUser = key;
  localStorage.setItem(SESSION_KEY, key);
  message.textContent = "";
  openHome();
}

function logout() {
  clearInterval(state.timer);
  currentUser = null;
  localStorage.removeItem(SESSION_KEY);
  $("#loginPassword").value = "";
  showScreen("login");
}

function openHome() {
  clearInterval(state.timer);
  const user = getUser();
  if (!user) {
    showScreen("login");
    return;
  }
  $("#playerName").textContent = user.name;
  renderHistory();
  renderQuestBoard();
  showScreen("intro");
}

function renderHistory() {
  const user = getUser();
  const list = $("#historyList");
  const attempts = user?.attempts || [];
  list.innerHTML = "";
  $("#resumeExam").classList.toggle("hidden", !user?.inProgress);

  if (!attempts.length) {
    $("#bestScore").textContent = "Best 0/50";
    list.innerHTML = `<p class="empty-history">No saved results yet. Complete one practice attempt to start tracking your progress.</p>`;
    return;
  }

  const best = attempts.reduce((top, attempt) => (attempt.correct > top.correct ? attempt : top), attempts[0]);
  $("#bestScore").textContent = `Best ${best.correct}/50`;

  attempts.slice(0, 5).forEach((attempt) => {
    const date = new Date(attempt.finishedAt).toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
    const item = document.createElement("div");
    item.className = "history-item";
    item.innerHTML = `<div><strong>${date}</strong><span>${attempt.accuracy}% accuracy - ${attempt.score} points</span></div><div class="history-score">${attempt.correct}/50</div>`;
    list.appendChild(item);
  });
}

function getLevelInfo(xp = 0) {
  const level = Math.floor(xp / 500) + 1;
  const currentLevelXp = xp % 500;
  const ranks = ["Rookie Runner", "Logic Raider", "Quant Knight", "Verbal Victor", "AMCAT Champion"];
  const rank = ranks[Math.min(ranks.length - 1, Math.floor((level - 1) / 3))];
  return { level, currentLevelXp, rank };
}

function renderQuestBoard() {
  const user = getUser();
  if (!user) return;
  const attempts = user.attempts || [];
  const badges = user.badges || [];
  const totalCorrect = attempts.reduce((sum, attempt) => sum + attempt.correct, 0);
  const { level, currentLevelXp, rank } = getLevelInfo(user.xp || 0);

  $("#rankTitle").textContent = rank;
  $("#levelText").textContent = `Lv ${level}`;
  $("#xpText").textContent = `${user.xp || 0} XP`;
  $("#xpFill").style.width = `${(currentLevelXp / 500) * 100}%`;
  $("#totalAttempts").textContent = attempts.length;
  $("#totalCorrect").textContent = totalCorrect;
  $("#badgeCount").textContent = badges.length;

  const rack = $("#badgeRack");
  rack.innerHTML = "";
  if (!badges.length) {
    rack.innerHTML = `<span class="empty-history">Badges unlock after completed attempts.</span>`;
    return;
  }
  badges.slice(0, 8).forEach((badge) => {
    const chip = document.createElement("span");
    chip.className = "badge-chip";
    chip.textContent = badge;
    rack.appendChild(chip);
  });
}

function hintText(topic) {
  const hints = {
    Synonyms: "Look for the option with the closest meaning, not just a related word.",
    Antonyms: "Reverse the emotion or direction of the word.",
    "Contextual Vocabulary": "Read the sentence tone first, then choose the word that fits that tone.",
    "Error Identification": "Check subject-verb agreement and comparison words first.",
    "Sentence Improvement": "Prefer the grammatically natural sentence.",
    "Reading Comprehension": "Find the main idea, not a small detail.",
    "Number Series": "Check whether the same difference repeats.",
    "Direction Sense": "Draw north, south, east, west quickly in your mind.",
    Analogy: "Identify the relationship between the first pair, then copy it.",
    "Coding Deductive Logic": "Convert each letter before joining the code.",
    "Profit & Loss": "Selling price = cost price plus profit.",
    "Time Speed Distance": "Distance = speed x time.",
    "HCF & LCM": "HCF is the biggest number dividing both values.",
    Probability: "Probability = favorable outcomes / total outcomes.",
  };
  return hints[topic] || "Eliminate the clearly wrong options first, then compare the final two.";
}

function useHint() {
  if (state.locked || state.hintUsed) return;
  state.hintUsed = true;
  state.liveXp = Math.max(0, state.liveXp - 5);
  const question = state.questions[state.index];
  $("#hintBox").textContent = hintText(question.topic);
  $("#hintBox").classList.remove("hidden");
  $("#hintButton").disabled = true;
  $("#liveXpText").textContent = `+${state.liveXp}`;
  saveCurrentAttempt();
}

function useFifty() {
  if (state.locked || state.fiftyUsed) return;
  state.fiftyUsed = true;
  state.liveXp = Math.max(0, state.liveXp - 10);
  const question = state.questions[state.index];
  const wrongButtons = [...document.querySelectorAll(".option-button")]
    .filter((button) => button.dataset.value !== question.answer)
    .slice(0, 2);
  wrongButtons.forEach((button) => {
    button.disabled = true;
    button.style.opacity = "0.34";
  });
  $("#fiftyButton").disabled = true;
  $("#liveXpText").textContent = `+${state.liveXp}`;
  saveCurrentAttempt();
}

function renderRewards(rewards) {
  const badges = rewards.newBadges.length ? rewards.newBadges.join(", ") : "No new badge";
  $("#rewardPanel").innerHTML = `
    <div class="reward-card"><span>XP Earned</span><strong>+${rewards.earnedXp}</strong></div>
    <div class="reward-card"><span>Best Combo</span><strong>${state.maxStreak}</strong></div>
    <div class="reward-card"><span>New Badges</span><strong>${badges}</strong></div>
  `;
}

function saveCurrentAttempt() {
  if (!currentUser || !state.questions.length || state.index >= state.questions.length) return;
  updateUser((user) => {
    user.inProgress = {
      questions: state.questions,
      index: state.index,
      score: state.score,
      streak: state.streak,
      answers: state.answers,
      moduleEnds: state.moduleEnds,
      secondsLeft: state.secondsLeft,
      startedAt: state.startedAt,
      shields: state.shields,
      maxStreak: state.maxStreak,
      liveXp: state.liveXp,
      hintUsed: state.hintUsed,
      fiftyUsed: state.fiftyUsed,
    };
  });
}

function resumeAttempt() {
  const saved = getUser()?.inProgress;
  if (!saved) return;
  clearInterval(state.timer);
  state.questions = saved.questions;
  state.index = saved.index;
  state.score = saved.score;
  state.streak = saved.streak;
  state.answers = saved.answers;
  state.moduleEnds = saved.moduleEnds;
  state.secondsLeft = saved.secondsLeft;
  state.startedAt = saved.startedAt;
  state.shields = saved.shields ?? 3;
  state.maxStreak = saved.maxStreak ?? 0;
  state.liveXp = saved.liveXp ?? 0;
  state.hintUsed = saved.hintUsed ?? false;
  state.fiftyUsed = saved.fiftyUsed ?? false;
  state.locked = false;
  showScreen("game");
  tickTimer();
  state.timer = setInterval(() => {
    state.secondsLeft -= 1;
    tickTimer();
    saveCurrentAttempt();
    if (state.secondsLeft <= 0) finishModuleByTimeout();
  }, 1000);
  renderQuestion();
}

function moduleSummary() {
  return MODULES.map((module) => {
    const answers = state.answers.filter((answer) => answer.moduleKey === module.key);
    return {
      key: module.key,
      name: module.name,
      total: module.count,
      correct: answers.filter((answer) => answer.correct).length,
      minutes: module.minutes,
    };
  });
}

function saveFinishedAttempt(correct, accuracy) {
  if (!currentUser) return { earnedXp: 0, newBadges: [] };
  const earnedXp = state.liveXp + correct * 5 + Math.max(0, accuracy - 50) * 2 + state.shields * 25;
  let newBadges = [];
  updateUser((user) => {
    const attempts = user.attempts || [];
    const badges = new Set(user.badges || []);
    const award = (badge) => {
      if (!badges.has(badge)) {
        badges.add(badge);
        newBadges.push(badge);
      }
    };

    award("First Login");
    if (!attempts.length) award("First Run");
    if (accuracy >= 70) award("Sharp Shooter");
    if (accuracy >= 85) award("Arena Ace");
    if (state.maxStreak >= 5) award("Combo Climber");
    if (state.shields === 3) award("Untouched Shields");
    if (moduleSummary().some((module) => module.correct === module.total)) award("Module Master");

    user.inProgress = null;
    user.xp = (user.xp || 0) + earnedXp;
    user.badges = [...badges];
    user.attempts = [
      {
        id: globalThis.crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
        startedAt: state.startedAt,
        finishedAt: new Date().toISOString(),
        score: state.score,
        correct,
        total: state.questions.length,
        accuracy,
        earnedXp,
        maxStreak: state.maxStreak,
        shieldsLeft: state.shields,
        modules: moduleSummary(),
        misses: state.answers.filter((answer) => !answer.correct),
      },
      ...(user.attempts || []),
    ].slice(0, 25);
  });
  return { earnedXp, newBadges };
}

function boot() {
  currentUser = localStorage.getItem(SESSION_KEY);
  if (currentUser && getUser()) {
    openHome();
  } else {
    currentUser = null;
    showScreen("login");
  }
}

$("#loginForm").addEventListener("submit", login);
$("#logoutButton").addEventListener("click", logout);
$("#startExam").addEventListener("click", startExam);
$("#resumeExam").addEventListener("click", resumeAttempt);
$("#retryExam").addEventListener("click", startExam);
$("#nextQuestion").addEventListener("click", nextQuestion);
$("#reviewMistakes").addEventListener("click", reviewMistakes);
$("#backHome").addEventListener("click", openHome);
$("#hintButton").addEventListener("click", useHint);
$("#fiftyButton").addEventListener("click", useFifty);

boot();