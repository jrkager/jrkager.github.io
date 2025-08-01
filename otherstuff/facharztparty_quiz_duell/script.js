
let questions = [];
let tasks = [];
let current = 0;
let players = SETTINGS.PLAYER_NAMES;
let scores = [0, 0];
let currentPlayer = 0;
let phase = 'main'; // 'main' or 'defense' or 'end'
let lastTask = "";

const correctSound = new Audio('correct.mp3');
const wrongSound = new Audio('wrong.mp3');

const startScreen = document.getElementById("start-screen");
startScreen.innerHTML = startScreen.innerHTML.replace(
  /wer zuerst \d+ Punkte hat/,
  `wer zuerst ${SETTINGS.WINNING_SCORE} Punkte hat`
);

async function loadData() {
  const qRes = await fetch('questions.json');
  questions = await qRes.json();
  const tRes = await fetch('tasks.json');
  tasks = await tRes.json();
}

function startGame() {
  phase = 'main';
  currentPlayer = Math.random() < 0.5 ? 0 : 1;
  document.getElementById('start-screen').style.display = 'none';
  document.getElementById('quiz-box').style.display = 'block';
  document.querySelector("button[onclick='nextRound()']").style.display = 'none';
  showQuestion();
}

function updateScoreboard() {
  document.getElementById('score0').textContent = scores[0];
  document.getElementById('score1').textContent = scores[1];
}

function showQuestion() {
  const q = questions[current];
  let label = phase === 'main' ? players[currentPlayer] : `Abwehr: ${players[currentPlayer]}`;
  document.getElementById("question").textContent = `${label}: ${q.question}`;
  const answersDiv = document.getElementById("answers");
  answersDiv.innerHTML = "";
  document.getElementById("task").textContent = "";
  document.getElementById("defend-btn").style.display = "none";

  const labels = ['A', 'B', 'C', 'D'];
  q.answers.forEach((answer, index) => {
    const btn = document.createElement("button");
    let text = `${labels[index]}. ${answer}`;
    if (SETTINGS.DEBUG && index === q.correct - 1) text += ' *';
    btn.textContent = text;
    btn.onclick = () => checkAnswer(index);
    answersDiv.appendChild(btn);
  });

  const nextBtn = document.querySelector("button[onclick='nextRound()']");
  nextBtn.textContent = "Nächste Frage";

  updateScoreboard();
}


function checkAnswer(index) {
  const q = questions[current];
  const buttons = document.querySelectorAll("#answers button");
  buttons.forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.correct - 1 && (phase === 'defense' || i === index)) btn.style.background = '#14b33e';
    if (i === index && i !== q.correct - 1) btn.style.background = '#d72805';
  });

  const nextBtn = document.querySelector("button[onclick='nextRound()']");
  nextBtn.style.display = "inline-block";

  if (index === q.correct - 1) {
    if(SETTINGS.SOUNDS) correctSound.play();
    scores[currentPlayer]++;
    document.getElementById("task").textContent = phase === 'main'
      ? "Richtig! 🎉"
      : `${players[currentPlayer]} hat erfolgreich abgewehrt! ✅`;

    updateScoreboard();

    if (scores[currentPlayer] >= SETTINGS.WINNING_SCORE) {
      nextBtn.textContent = "Spiel beenden";
      phase = 'end';
      const q = document.getElementById("question");
      q.textContent = `${players[currentPlayer]} hat gewonnen! 🏆`;
      q.style.fontSize = "3em";
      q.style.fontWeight = "bold";
      q.style.color = "#d4af37"; // gold
      q.style.textAlign = "center";
      q.style.textShadow = "2px 2px 5px #000";
      q.style.marginTop = "1em";
      // document.getElementById("answers").innerHTML = "";
      // document.getElementById("task").textContent = "";
      document.getElementById("defend-btn").style.display = "none";
      return;
    }

    return;
  } else {

    if(SETTINGS.SOUNDS) wrongSound.play();

    if (phase === 'main') {
      lastTask = tasks[Math.floor(Math.random() * tasks.length)];
      document.getElementById("task").textContent = `Falsch! Aufgabe: ${lastTask}`;
      const otherPlayer = players[1 - currentPlayer];
      const btn = document.getElementById("defend-btn");
      btn.textContent = `Aufgabe an ${otherPlayer} weitergeben`;
      btn.style.display = "inline-block";
      nextBtn.textContent = "Aufgabe erledigt. Weiter!";
    } else {
      document.getElementById("task").textContent = `Falsch! ${players[currentPlayer]} muss die Aufgabe machen: ${lastTask}`;
      nextBtn.textContent = "Aufgabe erledigt. Weiter!";
    }
  }
}

function triggerDefense() {
  document.querySelector("button[onclick='nextRound()']").style.display = "none";
  currentPlayer = 1 - currentPlayer;
  phase = 'defense';
  showQuestion();
}

function nextRound() {
  document.querySelector("button[onclick='nextRound()']").style.display = "none";
  if (phase === 'end') {
    document.getElementById('start-screen').style.display = 'block';
    document.getElementById('quiz-box').style.display = 'none';
    document.getElementById("question").removeAttribute("style");
    scores = [0, 0];
    return;
  }
  current = (current + 1) % questions.length;
  currentPlayer = 1 - currentPlayer;
  phase = 'main';
  showQuestion();
}

window.onload = loadData;