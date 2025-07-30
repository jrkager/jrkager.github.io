let orteAlle = [];
let orte = [];
let ziel, ref1, ref2;

let useSeeded = true; // on reload, start with daily puzzle
let archiveDate = null;

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
  
const distString = (dist, nachkomma) => {
	if (dist < 1) return `${Math.round(dist * 1000)} m`;
    faktor = Math.pow(10,nachkomma)
    return `${Math.round((dist + Number.EPSILON) * faktor) / faktor} km`;
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
  const d = archiveDate ? new Date(archiveDate) : new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function nextRandWaehlbar(rand) {
	var ret = orteAlle[Math.floor(rand() * orteAlle.length)];
	while (ret.waehlbar == false) ret = orteAlle[Math.floor(rand() * orteAlle.length)];
	return ret;
}

function startGame() {
  document.getElementById("share-button").style.display = "none";
  const subheading = document.getElementById("subheading");
  if (useSeeded) {
    const d = archiveDate ? new Date(archiveDate) : new Date();
    const dateStr = d.toLocaleDateString("de-DE");
    subheading.textContent = `Tagesrätsel vom ${dateStr}`;
  } else {
    subheading.textContent = "Zufallsrätsel";
  }
  var seed = getSeedFromDate();
  seed = Math.floor(seededRandom(seed) * 10000);
  const rand = (() => {
    let i = 0;
    return () => {
      return useSeeded ? seededRandom(seed + i++) : Math.random();
    };
  })();

  ziel = nextRandWaehlbar(rand);
  ref1 = nextRandWaehlbar(rand);
  ref2 = nextRandWaehlbar(rand);
  // manually fix this archive entry (database and, thus, choice based on date changed since then)
  if (useSeeded && seed == Math.floor(seededRandom(20250729) * 10000)) {
  	ziel = orte.filter(o=>o.name=="Welsberg-Taisten/Monguelfo-Tesido")[0];
  	ref1 = orte.filter(o=>o.name=="Sterzing/Vipiteno")[0];
  	ref2 = orte.filter(o=>o.name=="St. Vigil in Enneberg/San Vigilio di Marebbe")[0];
  }
  var retryCounter = 0; // zur sicherheit, falls keine passenden orte zu den bedingungen gefunden
  while (ref1 === ziel || ref2 === ziel || ref1 === ref2 || 
  		 (retryCounter <= 300 && 
  		  (distanzKm(ref1, ziel) <= 10 || distanzKm(ref2, ziel) <= 10 || winkelZwischenDreiPunkten(ref1,ziel,ref2) <= 20))) {
	  ref1 = nextRandWaehlbar(rand);
	  ref2 = nextRandWaehlbar(rand);
	  retryCounter++;
  }

  gerateneOrte = [];
  spielVorbei = false;
  document.getElementById("guess").style.display = "inline";
  document.getElementById("guess-button").style.display = "inline";
  document.getElementById("feedback").textContent = "";
  zeichne();
}

function zeichne() {
  const canvas = document.getElementById("map");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const canvasCenter = [250, 250];

  const alleOrteZeichnen = [ref1, ref2, ...gerateneOrte];
  if (spielVorbei) alleOrteZeichnen.push(ziel); // Zielort zeigen, wenn vorbei

  const verschiebungen = alleOrteZeichnen.map(o => ({
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
    console.log(v.ort.name, x);

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
      ctx.fillText(`${distString(v.dist,1)}`, mx + 5, my - 5);
    }

    const lines = v.ort.name.split("/");
    const maxl = Math.max(...lines.map(s => s.length));
    const xtext = x + 7*maxl>=canvas.width ? canvas.width - 6 * maxl : x - 8;
    const ytext = v.dy >= 0 ? y - 23 : y + 19;
    lines.forEach((line, idx) => {
      ctx.fillText(line.trim(), xtext, ytext + idx * 14);
    });
  });

  // Hinweis nach 2 Versuchen
  if (gerateneOrte.length >= 2 && !spielVorbei) {
    ctx.fillStyle = "black";
    ctx.font = "14px sans-serif";
    ctx.fillText(window.SUGG2_STR.replace("{}",ziel.einwohner.toLocaleString()), 10, 20);
  }
  // if (gerateneOrte.length >= 4 && !spielVorbei) {
// 	  let hint = "";
// 	if (ziel.name.includes("/")) {
// 	  const teil = ziel.name.split("/")[1].trim();
// 	  if (teil.length >= 2) {
// 		hint = teil[0] + "_".repeat(teil.length - 2) + teil[teil.length - 1];
// 	  } else {
// 		hint = teil;
// 	  }
// 	} else {
// 	  hint = ziel.name[0] + "_".repeat(ziel.name.length - 2) + ziel.name[ziel.name.length - 1];
// 	}
//     ctx.fillStyle = "black";
//     ctx.font = "14px sans-serif";
//     ctx.fillText(`💡 ${hint}`, 10, 40);
//   }

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
    if (useSeeded) {
		document.getElementById("share-button").style.display = "inline";
	}
  }
}


let gerateneOrte = [];
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
  
  document.getElementById("feedback").textContent = `${ort.name} ist falsch (${distString(distanzKm(ort,ziel),1)}).`;
  if (gerateneOrte.length >= 6) {
    spielVorbei = true;
  }
  
  zeichne();
}

document.getElementById("guess").addEventListener("keydown", function (e) {
  const autosuggestList = document.getElementById("autosuggest-list");
  if (e.key === "Enter" && autosuggestList.children.length <= 1) {
    // Nur raten, wenn keine oder 1 Vorschläge angezeigt werden
    raten();
  }
});

document.getElementById("daily-mode").addEventListener("click", () => {
//   useSeeded = true;
//   archiveDate = null;
//   document.getElementById("archive-date").value = "";
//   startGame();
  location.reload();
});

document.getElementById("random-mode").addEventListener("click", () => {
  useSeeded = false;
  archiveDate = null;
  document.getElementById("archive-date").value = "";
  startGame();
});

document.getElementById("archive-date").addEventListener("change", (e) => {
  const val = e.target.value;
  if (val) {
    archiveDate = val;
    useSeeded = true;
    startGame();
  }
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
    } else {
      dist = distString(d,0);
    }
    return `Versuch ${i + 1}: ${dist}`;
  });

  const d = archiveDate ? new Date(archiveDate) : new Date();
  const dateStr = d.toLocaleDateString("de-DE");
  const text = `🌍 Südtirol-Raten vom ${dateStr}\n` + zeilen.join("\n") + "\n-\njrkager.github.io";
  navigator.share({
    text: text
  });
});

fetch(window.DATA_FILE)
  .then(res => res.json())
  .then(data => {
    orteAlle = data;
    orte = orteAlle.filter(o => !('versteckt' in o) || o.versteckt === false);
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