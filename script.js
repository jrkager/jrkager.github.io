let orte = [];
let ziel, ref1, ref2;

let useSeeded = true;

document.getElementById("toggle-mode").addEventListener("click", () => {
  useSeeded = !useSeeded;
  document.getElementById("toggle-mode").textContent =
    useSeeded ? "Modus: Tagesrätsel" : "Modus: Zufallsrätsel";
  startGame();
});

const distanzKm = (a, b) => {
	if (a === b) return 0;
    const toRad = deg => deg * Math.PI / 180;
    const R = 6371;
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lon - a.lon);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const aVal = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
    return 2 * R * Math.asin(Math.sqrt(aVal));
  };
  
function winkelZwischenDreiPunkten(a, x, b) {
  function toRad(deg) {
    return deg * Math.PI / 180;
  }

  // Umrechnung in kartesische Koordinaten (angenähert)
  const ax = [a.lon - x.lon, a.lat - x.lat];
  const bx = [b.lon - x.lon, b.lat - x.lat];

  // Skalarprodukt und Längen
  const dot = ax[0] * bx[0] + ax[1] * bx[1];
  const magA = Math.hypot(ax[0], ax[1]);
  const magB = Math.hypot(bx[0], bx[1]);

  if (magA === 0 || magB === 0) return 0; // kein definierter Winkel

  const cosAngle = dot / (magA * magB);
  let angle = Math.acos(Math.max(-1, Math.min(1, cosAngle))); // in Bogenmaß

  return angle * 180 / Math.PI; // in Grad
}

function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getSeedFromDate() {
  const today = new Date();
  return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
}

function startGame() {
  document.getElementById("share-button").style.display = "none";
  const subheading = document.getElementById("subheading");
  if (useSeeded) {
    const today = new Date();
    const dateStr = today.toLocaleDateString("de-DE");
    subheading.textContent = `Tagesrätsel vom ${dateStr}`;
  } else {
    subheading.textContent = "";
  }
  var seed = getSeedFromDate();
  seed = Math.floor(seededRandom(seed) * 10000);
  const rand = (() => {
    let i = 0;
    return () => {
      return useSeeded ? seededRandom(seed + i++) : Math.random();
    };
  })();

  const ratbareOrte = orte.filter(o => o.ratbar);
  ziel = ratbareOrte[Math.floor(rand() * ratbareOrte.length)];

  const ratbareAndere = ratbareOrte.filter(o => o.name !== ziel.name);
  ref1 = ratbareAndere[Math.floor(rand() * ratbareAndere.length)];
  ref2 = ratbareAndere[Math.floor(rand() * ratbareAndere.length)];
  var retryCounter = 0; // zur sicherheit, falls keine passenden orte zu den bedingungen gefunden
  while (ref1 === ref2 || 
  		 (retryCounter <= 100 && 
  		  (distanzKm(ref1, ziel) <= 10 || distanzKm(ref2, ziel) <= 10 || winkelZwischenDreiPunkten(ref1,ziel,ref2) <= 20))) {
	  ref1 = ratbareAndere[Math.floor(rand() * ratbareAndere.length)];
	  ref2 = ratbareAndere[Math.floor(rand() * ratbareAndere.length)];
  }

  gerateneOrte = [];
  spielVorbei = false;
  document.getElementById("guess").style.display = "inline";
  document.getElementById("guess-button").style.display = "inline";
  document.getElementById("feedback").textContent = "";
  zeichne();
}

fetch("data/orte_suedtirol.json")
  .then(res => res.json())
  .then(data => {
    orte = data;
    startGame();
  });

function zeichne() {
  const canvas = document.getElementById("map");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const canvasCenter = [250, 250];

  const alleOrte = [ref1, ref2, ...gerateneOrte];
  if (spielVorbei) alleOrte.push(ziel); // Zielort zeigen, wenn vorbei

  const verschiebungen = alleOrte.map(o => ({
    ort: o,
    dx: (o.lon - ziel.lon) * 85,
    dy: (o.lat - ziel.lat) * 111,
    dist: distanzKm(ziel, o)
  }));

  const maxDist = Math.max(...verschiebungen.map(v => Math.hypot(v.dx, v.dy)));
  const scale = 200 / (maxDist || 1);

  verschiebungen.forEach((v, i) => {
    const x = canvasCenter[0] + v.dx * scale;
    const y = canvasCenter[1] - v.dy * scale;

    let farbe = "orange";
    if (v.ort.name === ref1.name) farbe = "blue";
    else if (v.ort.name === ref2.name) farbe = "green";
    else if (v.ort.name === ziel.name && spielVorbei) farbe = "red";

    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.fillStyle = farbe;
    ctx.fill();

	if (v.ort.name !== ziel.name) {
      // Verbindungslinie
      ctx.beginPath();
      ctx.moveTo(...canvasCenter);
      ctx.lineTo(x, y);
      ctx.strokeStyle = farbe;
      ctx.stroke();

  	  // Distanz anzeigen
      const mx = (x + canvasCenter[0]) / 2;
      const my = (y + canvasCenter[1]) / 2;
      ctx.fillStyle = "black";
      ctx.font = "12px sans-serif";
      ctx.fillText(`${v.dist.toFixed(1)} km`, mx + 5, my - 5);
    }

    const lines = v.ort.name.split("/");
    lines.forEach((line, idx) => {
      ctx.fillText(line.trim(), x + 8, y + idx * 14);
    });
  });

  // Hinweis nach 2 Versuchen
  if (gerateneOrte.length >= 2 && !spielVorbei) {
    ctx.fillStyle = "black";
    ctx.font = "14px sans-serif";
    ctx.fillText(`💡 Der Ort hat ca. ${ziel.einwohner.toLocaleString()} Einwohner.`, 10, 20);
  }
  if (gerateneOrte.length >= 4 && !spielVorbei) {
	  let hint = "";
	if (ziel.name.includes("/")) {
	  const teil = ziel.name.split("/")[1].trim();
	  if (teil.length >= 2) {
		hint = teil[0] + "_".repeat(teil.length - 2) + teil[teil.length - 1];
	  } else {
		hint = teil;
	  }
	} else {
	  hint = ziel.name[0] + "_".repeat(ziel.name.length - 2) + ziel.name[ziel.name.length - 1];
	}
    ctx.fillStyle = "black";
    ctx.font = "14px sans-serif";
    ctx.fillText(`💡 ${hint}`, 10, 40);
  }

  // Spielende anzeigen
  if (spielVorbei) {
    const gewonnen = ziel.name === gerateneOrte[gerateneOrte.length - 1].name;
    ctx.fillStyle = gewonnen ? "green" : "red";
    ctx.font = "bold 24px sans-serif";
    const text1 = gewonnen
      ? `🎉 Richtig in ${gerateneOrte.length} Versuch${gerateneOrte.length === 1 ? '' : 'en'}!`
      : `❌ Game Over! Gesucht war:`;
    const text2 = gewonnen ? "" : `${ziel.name}`;
  
    ctx.fillText(text1, 40, 40);
    ctx.fillText(text2, 40, 70);
    
    document.getElementById("guess").style.display = "none";
    document.getElementById("guess-button").style.display = "none";
    document.getElementById("share-button").style.display = "inline";
  }
}


let gerateneOrte = [];
let guessCount = 0;
let spielVorbei = false;

function raten() {
  if (spielVorbei) return;

  const eingabe = document.getElementById("guess").value.trim().toLowerCase();
  document.getElementById("guess").value = "";

  if (!eingabe) return;


  // Ort suchen
  const ort = orte.find(o =>
    o.name.toLowerCase() === eingabe ||
    o.alternativen.some(alt => alt.toLowerCase() === eingabe)
  );

  if (!ort) {
    document.getElementById("feedback").textContent = "Ort nicht gefunden.";
    return;
  }

  // Schon geraten?
  if (gerateneOrte.some(o => o.name === ort.name)) {
    document.getElementById("feedback").textContent = "Diesen Ort hast du schon geraten.";
    return;
  }

  gerateneOrte.push(ort);
  
  // Richtig geraten?
  if (ort.name === ziel.name) {
    document.getElementById("feedback").textContent = `🎉 Richtig! Der Ort war ${ziel.name}.`;
    spielVorbei = true;
    zeichne();
    return;
  }
  
  document.getElementById("feedback").textContent = `${ort.name} ist falsch.`;
  if (gerateneOrte.length >= 6) {
    spielVorbei = true;
  }
  
  zeichne();
}

document.getElementById("guess").addEventListener("keydown", function (e) {
  if (e.key === "Enter") raten();
});

document.getElementById("share-button").addEventListener("click", () => {
  if (!navigator.share) {
    alert("Teilen wird auf diesem Gerät nicht unterstützt.");
    return;
  }

  const versuche = gerateneOrte.length;
  const zeilen = gerateneOrte.map((ort, i) => {
    const d = distanzKm(ziel, ort);
    let dist;
    if (d==0) {
      dist = "📍";
    } else if (d < 1) {
      dist = `${Math.round(d * 1000)} m`;
    } else {
      dist = `${Math.round(d)} km`;
    }
    return `Versuch ${i + 1}: ${dist}`;
  });

  const today = new Date();
  const dateStr = today.toLocaleDateString("de-DE");
  const text = `🌍 Südtirol-Raten vom ${dateStr}\n` + zeilen.join("\n") + "\n-\njrkager.github.io";
  navigator.share({
    text: text
  });
});