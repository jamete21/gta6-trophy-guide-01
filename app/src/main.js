// Leonida Trophy Atlas — boot. Loads the trophy data, wires the controls,
// and re-renders on every change. All progress stays in localStorage.

import { createStore } from "./store.js";
import { renderChecklist, renderRoadmap, renderMissables, renderDetail, renderProgress } from "./views.js";

const store = createStore();
let trophies = [];
let selectedId = null;
const filters = { query: "", kind: "all", grade: "all", earnedOnly: false };

const trophyList = document.getElementById("trophyList");
const listSummary = document.getElementById("listSummary");
const detailPane = document.getElementById("detailPane");
const roadmapStages = document.getElementById("roadmapStages");
const missableList = document.getElementById("missableList");

function selectedTrophy() {
  return trophies.find((t) => t.id === selectedId) ?? null;
}

function renderAll() {
  renderProgress(trophies, store);
  renderChecklist(trophyList, listSummary, trophies, filters, store, selectTrophy, selectedId, renderAll);
  renderRoadmap(roadmapStages, trophies, store, selectTrophy);
  renderMissables(missableList, trophies, store, selectTrophy);
  renderDetail(detailPane, selectedTrophy(), store, renderAll);
}

function selectTrophy(id) {
  selectedId = id;
  renderAll();
  detailPane.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function switchView(name) {
  for (const tab of document.querySelectorAll("#tabs .tab")) {
    tab.classList.toggle("active", tab.dataset.view === name);
  }
  for (const view of document.querySelectorAll(".view")) {
    view.classList.toggle("active", view.id === `view-${name}`);
  }
}

function downloadFile(name, text) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function boot() {
  const response = await fetch("data/trophies.json");
  if (!response.ok) throw new Error(`trophies.json failed: ${response.status}`);
  const data = await response.json();
  trophies = data.trophies;

  document.getElementById("missableBadge").textContent =
    String(trophies.filter((t) => t.missable).length);

  for (const tab of document.querySelectorAll("#tabs .tab")) {
    tab.addEventListener("click", () => switchView(tab.dataset.view));
  }

  document.getElementById("search").addEventListener("input", (event) => {
    filters.query = event.target.value;
    renderAll();
  });

  for (const chip of document.querySelectorAll("#kindFilters .chip")) {
    chip.addEventListener("click", () => {
      for (const other of document.querySelectorAll("#kindFilters .chip")) {
        other.classList.toggle("active", other === chip);
      }
      filters.kind = chip.dataset.kind;
      renderAll();
    });
  }

  document.getElementById("gradeFilter").addEventListener("change", (event) => {
    filters.grade = event.target.value;
    renderAll();
  });

  const spoilerToggle = document.getElementById("spoilerToggle");
  spoilerToggle.checked = store.spoilersHidden;
  spoilerToggle.addEventListener("change", () => {
    store.setSpoilersHidden(spoilerToggle.checked);
    renderAll();
  });

  document.getElementById("earnedOnly").addEventListener("change", (event) => {
    filters.earnedOnly = event.target.checked;
    renderAll();
  });

  document.getElementById("exportBtn").addEventListener("click", () => {
    downloadFile("leonida-trophy-atlas-progress.json", store.exportText());
  });

  const importFile = document.getElementById("importFile");
  document.getElementById("importBtn").addEventListener("click", () => importFile.click());
  importFile.addEventListener("change", async () => {
    const file = importFile.files[0];
    if (!file) return;
    try {
      const count = store.importText(await file.text());
      alert(`Imported ${count} earned trophies.`);
    } catch {
      alert("That file is not a Leonida Trophy Atlas export.");
    }
    importFile.value = "";
    renderAll();
  });

  document.getElementById("resetBtn").addEventListener("click", () => {
    if (confirm("Clear all earned trophies and start over?")) {
      store.reset();
      selectedId = null;
      renderAll();
    }
  });

  renderAll();
}

boot().catch((error) => {
  trophyList.innerHTML = "";
  const note = document.createElement("li");
  note.className = "trophy-row";
  note.textContent = `The trophy data could not be loaded: ${error.message}`;
  trophyList.append(note);
});
