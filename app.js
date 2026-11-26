(() => {
  "use strict";

  const LETTERS = ["А", "Б", "В", "Г"];
  const KEY_TO_INDEX = {
    "1": 0, "2": 1, "3": 2, "4": 3,
    a: 0, A: 0, а: 0, А: 0,
    b: 1, B: 1, б: 1, Б: 1,
    c: 2, C: 2, v: 2, V: 2, в: 2, В: 2,
    d: 3, D: 3, g: 3, G: 3, г: 3, Г: 3
  };

  const ASSET_V = window.SITE_VERSION || "";
  const asset = (path) => path + "?v=" + encodeURIComponent(ASSET_V);

  const SCENES = [
    { scene: 1, sceneLabel: "Сцена 1", webp: asset("images/scena-1.webp"), jpg: asset("images/scena-1.jpg") },
    { scene: 2, sceneLabel: "Сцена 2", webp: asset("images/scena-2.webp"), jpg: asset("images/scena-2.jpg") },
    { scene: 3, sceneLabel: "Сцена 3", webp: asset("images/scena-3.webp"), jpg: asset("images/scena-3.jpg") },
    { scene: 4, sceneLabel: "Сцена 4", webp: asset("images/scena-4.webp"), jpg: asset("images/scena-4.jpg") }
  ];

  const els = {
    startView: document.getElementById("start-view"),
    comicView: document.getElementById("comic-view"),
    quizView: document.getElementById("quiz-view"),
    endView: document.getElementById("end-view"),
    hud: document.getElementById("hud"),
    progressLabel: document.getElementById("progress-label"),
    barFill: document.getElementById("bar-fill"),
    scoreValue: document.getElementById("score-value"),
    sceneChip: document.getElementById("scene-chip"),
    examChip: document.getElementById("exam-chip"),
    questionText: document.getElementById("question-text"),
    answers: document.getElementById("answers"),
    explain: document.getElementById("explain"),
    explainKicker: document.getElementById("explain-kicker"),
    explainText: document.getElementById("explain-text"),
    nextBtn: document.getElementById("next-btn"),
    startBtn: document.getElementById("start-btn"),
    fsBtn: document.getElementById("fs-btn"),
    retryWrongBtn: document.getElementById("retry-wrong-btn"),
    restartBtn: document.getElementById("restart-btn"),
    endCorrect: document.getElementById("end-correct"),
    endTotal: document.getElementById("end-total"),
    endMessage: document.getElementById("end-message"),
    endEyebrow: document.getElementById("end-eyebrow"),
    comicChip: document.getElementById("comic-chip"),
    comicSource: document.getElementById("comic-source"),
    comicImg: document.getElementById("comic-img"),
    toQuestionsBtn: document.getElementById("to-questions-btn")
  };

  const state = {
    queue: [],
    index: 0,
    score: 0,
    locked: false,
    missed: [],
    shuffled: [],
    mode: "all" // "all" | "retry"
  };

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function show(view) {
    els.startView.hidden = view !== "start";
    els.comicView.hidden = view !== "comic";
    els.quizView.hidden = view !== "quiz";
    els.endView.hidden = view !== "end";
    els.hud.hidden = view !== "quiz" && view !== "comic";
  }

  function start(queue, mode) {
    state.queue = queue.slice();
    state.index = 0;
    state.score = 0;
    state.locked = false;
    state.missed = [];
    state.mode = mode;
    els.scoreValue.textContent = "0";
    if (mode === "all" && state.queue.length) {
      showComic(state.queue[0].scene);
    } else {
      show("quiz");
      renderQuestion();
    }
  }

  function currentQuestion() {
    return state.queue[state.index];
  }

  function updateProgress(beforeAnswer) {
    const total = state.queue.length;
    els.progressLabel.textContent = (state.index + 1) + " / " + total;
    const done = beforeAnswer ? state.index : state.index + 1;
    els.barFill.style.width = ((done / total) * 100) + "%";
  }

  function showComic(sceneNum) {
    const scene = SCENES.find((s) => s.scene === sceneNum);
    if (!scene) {
      show("quiz");
      renderQuestion();
      return;
    }
    els.comicChip.textContent = scene.sceneLabel;
    els.comicSource.srcset = scene.webp;
    els.comicImg.src = scene.jpg;
    els.comicImg.alt = scene.sceneLabel;
    updateProgress(true);
    show("comic");
    els.toQuestionsBtn.focus();
  }

  function goToQuestions() {
    show("quiz");
    renderQuestion();
  }

  function renderQuestion() {
    const q = currentQuestion();
    state.locked = false;
    state.shuffled = shuffle(q.answers);

    els.sceneChip.textContent = q.sceneLabel;
    els.examChip.textContent = "Въпрос " + q.examNumber;
    els.questionText.textContent = q.text;

    updateProgress(true);

    els.explain.hidden = true;
    els.explain.classList.remove("is-yes", "is-no");
    els.answers.classList.remove("is-locked");
    els.answers.innerHTML = "";

    state.shuffled.forEach((ans, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "answer";
      btn.dataset.index = String(i);
      btn.innerHTML =
        '<span class="letter">' + LETTERS[i] + "</span>" +
        '<span class="answer-text"></span>' +
        '<span class="mark" aria-hidden="true"></span>';
      btn.querySelector(".answer-text").textContent = ans.text;
      btn.addEventListener("click", () => choose(i));
      els.answers.appendChild(btn);
    });

    const isLast = state.index === state.queue.length - 1;
    els.nextBtn.textContent = isLast ? "Резултат" : "Напред";
  }

  function choose(i) {
    if (state.locked) return;
    const q = currentQuestion();
    const picked = state.shuffled[i];
    if (!picked) return;

    state.locked = true;
    els.answers.classList.add("is-locked");

    const correct = picked.id === q.correct;
    const buttons = els.answers.querySelectorAll(".answer");
    buttons.forEach((btn, idx) => {
      const ans = state.shuffled[idx];
      const mark = btn.querySelector(".mark");
      if (ans.id === q.correct) {
        btn.classList.add("is-correct");
        mark.textContent = "✓";
      } else if (idx === i) {
        btn.classList.add("is-wrong");
        mark.textContent = "✗";
      }
    });

    if (correct) {
      state.score += 1;
      els.scoreValue.textContent = String(state.score);
      els.explain.classList.add("is-yes");
      els.explain.classList.remove("is-no");
      els.explainKicker.textContent = "Вярно ✓";
    } else {
      state.missed.push(q);
      els.explain.classList.add("is-no");
      els.explain.classList.remove("is-yes");
      els.explainKicker.textContent = "Грешно ✗";
    }

    els.explainText.textContent = q.explanation;
    els.explain.hidden = false;
    updateProgress(false);
    els.nextBtn.focus();
  }

  function next() {
    if (!state.locked) return;
    if (state.index < state.queue.length - 1) {
      const current = currentQuestion();
      state.index += 1;
      const upcoming = currentQuestion();
      if (state.mode === "all" && upcoming.scene !== current.scene) {
        showComic(upcoming.scene);
      } else {
        show("quiz");
        renderQuestion();
      }
    } else {
      showEnd();
    }
  }

  function showEnd() {
    const total = state.queue.length;
    const score = state.score;
    els.endCorrect.textContent = String(score);
    els.endTotal.textContent = String(total);
    els.endEyebrow.textContent = state.mode === "retry" ? "Поправка" : "Резултат";

    let message;
    const ratio = total ? score / total : 0;
    if (score === total) message = "Отличен резултат — всички отговори са верни.";
    else if (ratio >= 0.75) message = "Много добре. Преговорете само пропуснатите въпроси.";
    else if (ratio >= 0.5) message = "Добра основа. Още един рунд с грешните ще помогне.";
    else message = "Струва си да минете грешните въпроси още веднъж.";

    els.endMessage.textContent = message;
    els.retryWrongBtn.hidden = state.missed.length === 0;
    show("end");
    if (state.missed.length) els.retryWrongBtn.focus();
    else els.restartBtn.focus();
  }

  function toggleFullscreen() {
    const root = document.documentElement;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      const req = root.requestFullscreen || root.webkitRequestFullscreen;
      if (req) req.call(root).catch(() => {});
    } else {
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (exit) exit.call(document);
    }
  }

  els.startBtn.addEventListener("click", () => start(QUESTIONS, "all"));
  els.nextBtn.addEventListener("click", next);
  els.toQuestionsBtn.addEventListener("click", goToQuestions);
  els.restartBtn.addEventListener("click", () => start(QUESTIONS, "all"));
  els.retryWrongBtn.addEventListener("click", () => {
    if (!state.missed.length) return;
    start(state.missed, "retry");
  });
  els.fsBtn.addEventListener("click", toggleFullscreen);

  document.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const key = e.key;

    if (key === "f" || key === "F" || key === "ф" || key === "Ф") {
      e.preventDefault();
      toggleFullscreen();
      return;
    }

    if (!els.startView.hidden && (key === "Enter" || key === " ")) {
      e.preventDefault();
      start(QUESTIONS, "all");
      return;
    }

    if (!els.endView.hidden) {
      if (key === "Enter" || key === " ") {
        e.preventDefault();
        if (state.missed.length) start(state.missed, "retry");
        else start(QUESTIONS, "all");
      }
      return;
    }

    if (!els.comicView.hidden && (key === "Enter" || key === " " || key === "ArrowRight")) {
      e.preventDefault();
      goToQuestions();
      return;
    }

    if (els.quizView.hidden) return;

    if (state.locked && (key === "Enter" || key === " " || key === "ArrowRight")) {
      e.preventDefault();
      next();
      return;
    }

    if (!state.locked && KEY_TO_INDEX[key] !== undefined) {
      e.preventDefault();
      choose(KEY_TO_INDEX[key]);
    }
  });
})();
