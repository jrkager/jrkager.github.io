// autosuggest.js

(function () {
  const input = document.getElementById("guess");
  if (!input) return;

  const container = document.createElement("div");
  container.id = "autosuggest-list";
  container.style.position = "absolute";
  container.style.border = "1px solid #ccc";
  container.style.background = "white";
  container.style.zIndex = "1000";
  container.style.maxHeight = "200px";
  container.style.overflowY = "auto";
  document.body.appendChild(container);

  function updateSuggestions() {
    if (!orte) {
    	fetch("data/orte_suedtirol.json")
		  .then(res => res.json())
		  .then(data => {
			orte = data;
		  });
    }

    const val = input.value.trim().toLowerCase();
container.innerHTML = "";
if (!val) return;

const rect = input.getBoundingClientRect();
container.style.left = `${rect.left + window.scrollX}px`;
container.style.top = `${rect.bottom + window.scrollY}px`;
container.style.width = `${rect.width}px`;

// Filter über alternativen[]
const passendeOrte = orte.filter(o =>
  (o.alternativen || []).some(a =>
    a.toLowerCase().includes(val)
  )
);

// Zeige die name-Felder dieser passenden Orte
passendeOrte.slice(0, 5).forEach(o => {
  const item = document.createElement("div");
  item.textContent = o.name;
  item.style.padding = "4px";
  item.style.cursor = "pointer";
  item.addEventListener("click", () => {
    input.value = o.name;
    container.innerHTML = "";
    input.focus();
  });
  container.appendChild(item);
});
  }

  input.addEventListener("input", updateSuggestions);

  document.addEventListener("click", (e) => {
    if (e.target !== input && e.target.parentNode !== container) {
      container.innerHTML = "";
    }
  });
})();