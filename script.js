let allPlaces = [];
let places = [];
let target, ref1, ref2;

let seedFromURL;
let dayFromURL;
let today;

let guessedPlaces = [];
let gameOver = false;

// Calculates the distance between two points using the Haversine formula
const calcDistanceInKm = (a, b) => {
	if (a === b) return 0;
    const toRad = deg => deg * Math.PI / 180;
    const earthRadius = 6371;
    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);
    const latA = toRad(a.latitude);
    const latB = toRad(b.latitude);
    const aVal = Math.sin(dLat/2)**2 + Math.cos(latA)*Math.cos(latB)*Math.sin(dLon/2)**2;
    return 2 * earthRadius * Math.asin(Math.sqrt(aVal));
  };

const formatDistance = (distance, decimalPlaces) => {
	if (distance < 1) return `${Math.round(distance * 1000)} m`;
    faktor = Math.pow(10, decimalPlaces)
    return `${Math.round((distance + Number.EPSILON) * faktor) / faktor} km`;
};

function calcAngleBetweenThreePoints(a, x, b) {
  // Convert to Cartesian coordinates (approximate)
  const ax = [a.longitude - x.longitude, a.latitude - x.latitude];
  const bx = [b.longitude - x.longitude, b.latitude - x.latitude];

  // Dot product and magnitudes
  const dot = ax[0] * bx[0] + ax[1] * bx[1];
  const magA = Math.hypot(ax[0], ax[1]);
  const magB = Math.hypot(bx[0], bx[1]);

  if (magA === 0 || magB === 0) return 0; // No defined angle

  const cosAngle = dot / (magA * magB);
  let angle = Math.acos(Math.max(-1, Math.min(1, cosAngle))); // In radians

  return angle * 180 / Math.PI; // In degrees
}

function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getSeedFromDate() {
  const d = dayFromURL ? new Date(dayFromURL) : new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function getSeedFromURL() {
  const params = new URLSearchParams(window.location.search);
  const seedParam = params.get("game");
  const ret = parseInt(seedParam, 10);
  return isNaN(ret) ? null : ret;
}

function getDayFromURL() {
  const params = new URLSearchParams(window.location.search);
  const day = params.get("day");
  const date = new Date(day);
  return (day && !isNaN(date)) ? day : null;
}

function getNextRandSelectable(rand) {
	var ret = allPlaces[Math.floor(rand() * allPlaces.length)];
	while (ret.selectable == false) ret = allPlaces[Math.floor(rand() * allPlaces.length)];
	return ret;
}

function startGame() {
  document.getElementById("share-button").style.display = "none";
  const subheading = document.getElementById("subheading");

  seedFromURL = getSeedFromURL();
  dayFromURL = getDayFromURL();
  today = new Date().toLocaleDateString("sv-SE").split("T")[0];

  // If params are invalid use Tagesrätsel as fallback and remove URL params
  if (dayFromURL == null && seedFromURL == null && window.location.search.length > 0)
  	window.location.href = window.location.pathname

  if (dayFromURL !== null && dayFromURL >= today) {
    dayFromURL = null;
  }

  let seed;

  // Random puzzle
  if (seedFromURL !== null) {
    seed = seedFromURL;
    subheading.textContent = `Zufallsrätsel (Nr: ${seed})`;

  // Daily puzzle
  } else {
    const d = dayFromURL ? new Date(dayFromURL) : new Date();
    const dateStr = d.toLocaleDateString("de-DE");
    seed = getSeedFromDate();
    seed = Math.floor(seededRandom(seed) * 10000);
    subheading.textContent = `Tagesrätsel vom ${dateStr}`;
  }

  // Select archive date in dropdown if available
  const archiveDropdown = document.getElementById("archive-date");
  if (dayFromURL && [...archiveDropdown.options].some(opt => opt.value === dayFromURL)) {
    archiveDropdown.value = dayFromURL;
  } else {
    archiveDropdown.selectedIndex = 0;
  }

  const rand = (() => {
    let i = 0;
    return () => {
      return seededRandom(seed + i++)
    };
  })();

  target = getNextRandSelectable(rand);
  ref1 = getNextRandSelectable(rand);
  ref2 = getNextRandSelectable(rand);

  var retryCounter = 0; // To be safe, if no suitable places can be found under the given conditions
  while (
    ref1 === target ||
    ref2 === target ||
    ref1 === ref2 ||
    (retryCounter <= 300 &&
      (
        calcDistanceInKm(ref1, target) <= 10 ||
        calcDistanceInKm(ref2, target) <= 10 ||
        calcAngleBetweenThreePoints(ref1, target, ref2) <= 20
      )
    )
  ) {
    ref1 = getNextRandSelectable(rand);
    ref2 = getNextRandSelectable(rand);
    retryCounter++;
  }

  guessedPlaces = [];
  gameOver = false;
  document.getElementById("guess").style.display = "inline";
  document.getElementById("guess-button").style.display = "inline";
  document.getElementById("feedback").textContent = "";
  drawMap();
}

function drawMap() {
  const canvas = document.getElementById("map");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const canvasCenter = [250, 250];

  const placesToBeDrawn = [ref1, ref2, ...guessedPlaces];
  if (gameOver) placesToBeDrawn.push(target); // Show target when the game is over

  const offsetsFromTarget = placesToBeDrawn.map(p => ({
    place: p,
    dx: (p.longitude - target.longitude) * 85,
    dy: (p.latitude - target.latitude) * 111,
    dist: calcDistanceInKm(target, p)
  }));

  const maxDist = Math.max(...offsetsFromTarget.map(v => Math.hypot(v.dx, v.dy)));
  const scale = 200 / (maxDist || 1);

  offsetsFromTarget.forEach((v, i) => {
    const x = canvasCenter[0] + v.dx * scale;
    const y = canvasCenter[1] - v.dy * scale;

    let color = "orange";
    if (v.place.name === ref1.name) color = "blue";
    else if (v.place.name === ref2.name) color = "green";
    else if (v.place.name === target.name && gameOver) color = "red";

    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();

	if (v.place.name !== target.name) {
      // Connecting line
      ctx.beginPath();
      ctx.moveTo(...canvasCenter);
      ctx.lineTo(x, y);
      ctx.strokeStyle = color;
      ctx.stroke();

  	  // Show distance
      const mx = (x + canvasCenter[0]) / 2;
      const my = (y + canvasCenter[1]) / 2;
      ctx.fillStyle = "black";
      ctx.font = "12px sans-serif";
      ctx.fillText(`${formatDistance(v.dist,1)}`, mx + 5, my - 5);
    }

    const lines = v.place.name.split("/");
    const maxl = Math.max(...lines.map(s => s.length));
    const xtext = x + 7*maxl>=canvas.width ? canvas.width - 6 * maxl : x - 8;
    const ytext = v.dy >= 0 ? y - 23 : y + 19;
    lines.forEach((line, idx) => {
      ctx.fillText(line.trim(), xtext, ytext + idx * 14);
    });
  });

  // Hint after 2 tries
  if (guessedPlaces.length >= 2 && !gameOver) {
    ctx.fillStyle = "black";
    ctx.font = "14px sans-serif";
    if ('SUGG2_STR' in window && window.SUGG2_STR !== null)
    	ctx.fillText(window.SUGG2_STR.replace("{}", target.population.toLocaleString()), 10, 20);
  }

  // Show game over
  if (gameOver) {
    const hasWon = target.name === guessedPlaces[guessedPlaces.length - 1].name;
    ctx.fillStyle = hasWon ? "green" : "red";
    ctx.font = "bold 24px sans-serif";
    const text1 = hasWon
      ? `🎉 Richtig in ${guessedPlaces.length} Versuch${guessedPlaces.length === 1 ? '' : 'en'}!`
      : `❌ Game Over! Gesucht war:`;
    const text2 = hasWon ? "" : `${target.name}`;

    ctx.fillText(text1, 40, 40);
    ctx.fillText(text2, 40, 70);

    document.getElementById("guess").style.display = "none";
    document.getElementById("guess-button").style.display = "none";
    document.getElementById("share-button").style.display = "inline";
  }
}

function guess() {
  if (gameOver) return;

  const userInput = document.getElementById("guess").value.trim().toLowerCase();
  document.getElementById("guess").value = "";

  if (!userInput) return;

  // Search place
  const guessedPlace = places.find(p =>
    p.name.toLowerCase() === userInput ||
    p.alternatives.some(alt => alt.toLowerCase() === userInput)
  );

  if (!guessedPlace) {
  	if ('NOTFOUND_STR' in window && window.NOTFOUND_STR !== null)
  		document.getElementById("feedback").textContent = window.NOTFOUND_STR;
  	else
		  document.getElementById("feedback").textContent = "Ort nicht gefunden.";
    return;
  }

  // Already guessed?
  if (guessedPlaces.some(o => o.name === guessedPlace.name)) {
  	if ('ALREADYGUESSED_STR' in window && window.ALREADYGUESSED_STR !== null)
  		document.getElementById("feedback").textContent = window.ALREADYGUESSED_STR;
  	else
    	document.getElementById("feedback").textContent = "Diesen Ort hast du schon geraten.";
    return;
  }

  guessedPlaces.push(guessedPlace);

  // Guessed correctly?
  if (guessedPlace.name === target.name) {
    document.getElementById("feedback").textContent = `🎉 Richtig! Der Ort war ${target.name}.`;
    gameOver = true;
    drawMap();
    return;
  }

  document.getElementById("feedback").textContent = `${guessedPlace.name} ist falsch (${formatDistance(calcDistanceInKm(guessedPlace,target),1)}).`;
  if (guessedPlaces.length >= 6) {
    gameOver = true;
  }

  drawMap();
}

document.getElementById("guess").addEventListener("keydown", function (e) {
  const autosuggestList = document.getElementById("autosuggest-list");
  if (e.key === "Enter" && autosuggestList.children.length <= 1) {
    // Only guess if 0 or 1 suggestions are displayed
    guess();
  }
});

document.getElementById("daily-mode").addEventListener("click", () => {
  // Here we make the site refresh, to make sure everyone has the latest database version
  window.location.href = `${window.location.pathname}`;
});

document.getElementById("random-mode").addEventListener("click", () => {
  let gameId = Math.floor(Math.random() * 1000000);
  if (history.pushState) {
    var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + `?game=${gameId}`;
    window.history.pushState({path:newurl},'',newurl);
    startGame();
  } else {
    window.location.href = `${window.location.pathname}?game=${gameId}`;
  }
});

document.getElementById("archive-date").addEventListener("change", (e) => {
  const val = e.target.value;
  if (val) {
	  if (history.pushState) {
		var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + `?day=${val}`;
		window.history.pushState({path:newurl},'',newurl);
		startGame();
	  } else {
		window.location.href = `${window.location.pathname}?day=${val}`;
	  }
  }
});

document.getElementById("share-button").addEventListener("click", () => {
  if (!navigator.share) {
    alert("Teilen wird auf diesem Gerät nicht unterstützt.");
    return;
  }

  const rows = guessedPlaces.map((p, i) => {
    const d = calcDistanceInKm(target, p);
    let dist;
    if (d==0) {
      dist = "📍";
    } else {
      dist = formatDistance(d,0);
    }
    return `Versuch ${i + 1}: ${dist}`;
  });

  const d = dayFromURL ? new Date(dayFromURL) : new Date();
  const dateStr = d.toLocaleDateString("de-DE");
  const game_name = 'SHARE_NAME_STR' in window && window.SHARE_NAME_STR !== null ? `${window.SHARE_NAME_STR}-` : "";
  const identifier = seedFromURL !== null ? `Nr. ${seedFromURL}` : `vom ${dateStr}`;
  const url = window.location.href;
  const text = `🌍 ${game_name}Raten ${identifier}\n` + rows.join("\n") + `\n-\n${url}`;
  navigator.share({
    text: text
  });
});

fetch(window.DATA_FILE)
  .then(res => res.json())
  .then(data => {
    allPlaces = data;
    places = allPlaces.filter(o => !('hidden' in o) || o.hidden === false);
    const select = document.getElementById("archive-date");
	var startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    for (let d = new Date(startDate); d <= yesterday; d.setDate(d.getDate() + 1)) {
      const iso = d.toLocaleDateString("sv-SE").split("T")[0];
      const option = document.createElement("option");
      option.value = iso;
      option.textContent = iso.split("-").reverse().join(".");
      select.appendChild(option);
    }
    startGame();
  });