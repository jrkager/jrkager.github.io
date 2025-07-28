// // autosuggest.js
// 
// (function () {
//   const input = document.getElementById("guess");
//   if (!input) return;
// 
//   const container = document.createElement("div");
//   container.id = "autosuggest-list";
//   container.style.position = "absolute";
//   container.style.border = "1px solid #ccc";
//   container.style.background = "white";
//   container.style.zIndex = "1000";
//   container.style.maxHeight = "200px";
//   container.style.overflowY = "auto";
//   document.body.appendChild(container);
// 
//   function updateSuggestions() {
//     if (!orte) {
//       fetch("data/orte_suedtirol.json")
//         .then(res => res.json())
//         .then(data => {
//           orte = data;
//         });
//     }
// 
//     const val = input.value.trim().toLowerCase();
//     container.innerHTML = "";
//     if (!val) {
//       container.style.border = "0px";
//       return;
//     }
// 
//     const rect = input.getBoundingClientRect();
//     container.style.left = `${rect.left + window.scrollX}px`;
//     container.style.top = `${rect.bottom + window.scrollY}px`;
//     container.style.width = `${rect.width}px`;
// 
//     // Filter über alternativen[]
//     const passendeOrte = orte.filter(o =>
//       (o.alternativen || []).some(a =>
//         a.toLowerCase().includes(val)
//       )
//     );
// 
//     // Zeige die name-Felder dieser passenden Orte
//     passendeOrte.slice(0, 5).forEach(o => {
//       const item = document.createElement("div");
//       item.textContent = o.name;
//       item.style.padding = "4px";
//       item.style.cursor = "pointer";
//       item.addEventListener("click", () => {
//         input.value = o.name;
//         container.innerHTML = "";
//         input.focus();
//       });
//       container.appendChild(item);
//     });
// 
//     if (container.children.length === 0) {
//       container.style.border = "0px";
//     } else {
//       container.style.border = "1px solid #ccc";
//     }
//   }
// 
//   input.addEventListener("input", updateSuggestions);
// 
//   input.addEventListener("keydown", (e) => {
//     if (e.key === "Enter") {
//       container.innerHTML = "";
//       container.style.border = "0px";
//     }
//   });
// 
//   document.addEventListener("click", (e) => {
//     if (e.target !== input && e.target.parentNode !== container) {
//       container.innerHTML = "";
//       container.style.border = "0px";
//     }
//   });
// })();

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

  let selectedIndex = -1;

  function updateSuggestions() {
    selectedIndex = -1;

    if (!orte) {
      fetch("data/orte_suedtirol.json")
        .then(res => res.json())
        .then(data => {
          orte = data;
        });
    }

    const val = input.value.trim().toLowerCase();
    container.innerHTML = "";
    if (!val) {
      container.style.border = "0px";
      return;
    }

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
      item.style.background = "white";
      item.addEventListener("click", () => {
        input.value = o.name;
        container.innerHTML = "";
        container.style.border = "0px";
        input.focus();
      });
      container.appendChild(item);
    });

    if (container.children.length === 0) {
      container.style.border = "0px";
    } else {
      container.style.border = "1px solid #ccc";
    }
  }

  function updateHighlight(items) {
    items.forEach((item, index) => {
      item.style.background = index === selectedIndex ? "#eef" : "white";
    });
  }

  input.addEventListener("input", updateSuggestions);

  input.addEventListener("keydown", (e) => {
    const items = container.querySelectorAll("div");

    if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % items.length;
      updateHighlight(items);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedIndex = (selectedIndex - 1 + items.length) % items.length;
      updateHighlight(items);
    } else if (e.key === "Enter") {
      if (selectedIndex >= 0 && items[selectedIndex]) {
        input.value = items[selectedIndex].textContent;
      }
      container.innerHTML = "";
      container.style.border = "0px";
      selectedIndex = -1;
    }
  });

  document.addEventListener("click", (e) => {
    if (e.target !== input && e.target.parentNode !== container) {
      container.innerHTML = "";
      container.style.border = "0px";
    }
  });
})();