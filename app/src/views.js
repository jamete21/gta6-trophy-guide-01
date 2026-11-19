// Views: the checklist rows, the roadmap stages, the missables list and the
// per-trophy detail pane. Rendering is plain DOM, no framework.

import { trophyMatches, isSpoilerMasked, kindLabel, gradeLetter } from "./filters.js";

export const ROADMAP_STAGES = [
  {
    stage: 1,
    title: "Stage 1 — First steps",
    intro: "Start the story, sample every activity once, and learn the map. Nothing here can be missed.",
  },
  {
    stage: 2,
    title: "Stage 2 — The story run",
    intro: "Play the chapters and the named missions in order — and finish the ally strands, stranger strands and partner trophies before the final mission. This stage holds every missable.",
  },
  {
    stage: 3,
    title: "Stage 3 — Leonida at large",
    intro: "After the story opens the map up: explore every area, discover vehicles, rob vaults and trucks, and build your money.",
  },
  {
    stage: 4,
    title: "Stage 4 — Activities and skills",
    intro: "The long grinds: stunts, the shooting range, races, fishing, meditation, cards, WAiNK It and the rest. Chip away at these between story beats.",
  },
  {
    stage: 5,
    title: "Stage 5 — Mop-up and platinum",
    intro: "Finish the choices count, reach 100% completion, and the platinum is yours.",
  },
];

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderChecklist(listEl, summaryEl, trophies, filters, store, onSelect, selectedId, onToggle) {
  const visible = trophies.filter((t) => trophyMatches(t, filters, store));
  const earned = trophies.filter((t) => store.isEarned(t.id)).length;
  summaryEl.textContent =
    `${visible.length} of 55 trophies shown · ${earned} earned. ` +
    "Tick one off when it pops — progress saves in this browser.";

  listEl.innerHTML = "";
  if (visible.length === 0) {
    const empty = document.createElement("li");
    empty.className = "trophy-row";
    empty.textContent = "No trophies match these filters. Clear the search or pick another kind.";
    listEl.append(empty);
    return;
  }

  for (const trophy of visible) {
    const masked = isSpoilerMasked(trophy, store);
    const row = document.createElement("li");
    row.className = "trophy-row" + (store.isEarned(trophy.id) ? " earned" : "") + (selectedId === trophy.id ? " selected" : "");
    row.dataset.id = String(trophy.id);

    const check = document.createElement("input");
    check.type = "checkbox";
    check.className = "trophy-check";
    check.checked = store.isEarned(trophy.id);
    check.setAttribute("aria-label", `Mark ${trophy.name} earned`);
    check.addEventListener("click", (event) => {
      event.stopPropagation();
      store.toggleEarned(trophy.id);
      onToggle();
    });

    const medal = document.createElement("span");
    medal.className = `medal ${trophy.grade}`;
    medal.textContent = gradeLetter(trophy.grade);
    medal.title = trophy.grade;

    const body = document.createElement("div");
    body.className = masked ? "spoiler-hidden" : "";
    const name = document.createElement("div");
    name.className = "trophy-name";
    name.textContent = masked ? "Hidden story trophy" : trophy.name;
    const desc = document.createElement("div");
    desc.className = "trophy-desc";
    desc.textContent = masked ? "Earn it to reveal the name and description." : trophy.description;
    const tags = document.createElement("div");
    tags.className = "trophy-tags";
    const kindTag = document.createElement("span");
    kindTag.className = `tag kind-${trophy.kind}`;
    kindTag.textContent = kindLabel(trophy.kind);
    tags.append(kindTag);
    if (trophy.missable) {
      const missTag = document.createElement("span");
      missTag.className = "tag missable";
      missTag.textContent = "Missable";
      tags.append(missTag);
    }
    if (trophy.target != null) {
      const targetTag = document.createElement("span");
      targetTag.className = "tag";
      targetTag.textContent = `${trophy.target} ${trophy.targetUnit ?? ""}`.trim();
      tags.append(targetTag);
    }
    body.append(name, desc, tags);

    const gradeLabel = document.createElement("span");
    gradeLabel.className = "trophy-grade-label";
    gradeLabel.textContent = trophy.grade;

    row.addEventListener("click", () => onSelect(trophy.id));
    row.append(check, medal, body, gradeLabel);
    listEl.append(row);
  }
}

export function renderRoadmap(container, trophies, store, onSelect) {
  container.innerHTML = "";
  for (const stage of ROADMAP_STAGES) {
    const stageTrophies = trophies.filter((t) => t.stage === stage.stage);
    const earned = stageTrophies.filter((t) => store.isEarned(t.id)).length;
    const block = document.createElement("section");
    block.className = "stage";
    const heading = document.createElement("h3");
    heading.textContent = stage.title;
    const intro = document.createElement("p");
    intro.textContent = stage.intro;
    const progress = document.createElement("p");
    progress.className = "stage-progress";
    progress.textContent = `${earned} of ${stageTrophies.length} earned in this stage`;
    const list = document.createElement("ul");
    for (const trophy of stageTrophies) {
      const item = document.createElement("li");
      const masked = isSpoilerMasked(trophy, store);
      item.textContent = (store.isEarned(trophy.id) ? "✓ " : "○ ") +
        (masked ? "Hidden story trophy" : trophy.name) +
        (trophy.missable ? " — missable" : "");
      item.style.cursor = "pointer";
      item.addEventListener("click", () => onSelect(trophy.id));
      list.append(item);
    }
    block.append(heading, intro, progress, list);
    container.append(block);
  }
}

export function renderMissables(container, trophies, store, onSelect) {
  container.innerHTML = "";
  const missables = trophies.filter((t) => t.missable);
  for (const trophy of missables) {
    const card = document.createElement("article");
    card.className = "missable-card";
    const heading = document.createElement("h3");
    heading.textContent = trophy.name;
    const why = document.createElement("p");
    why.className = "why";
    why.textContent = trophy.missableWhy ?? "Do this before the final mission.";
    const desc = document.createElement("p");
    desc.textContent = trophy.description;
    const hint = document.createElement("p");
    hint.textContent = "Tap to read the full guide.";
    hint.style.cursor = "pointer";
    hint.style.color = "var(--mint)";
    hint.addEventListener("click", () => onSelect(trophy.id));
    card.append(heading, why, desc, hint);
    container.append(card);
  }
}

export function renderDetail(pane, trophy, store, onToggle) {
  pane.innerHTML = "";
  if (!trophy) {
    const empty = document.createElement("p");
    empty.className = "detail-empty";
    empty.textContent = "Pick a trophy on the left to read its guide, its sources and when it can be missed.";
    pane.append(empty);
    return;
  }
  const masked = isSpoilerMasked(trophy, store);
  const title = document.createElement("h3");
  title.textContent = masked ? "Hidden story trophy" : trophy.name;
  const meta = document.createElement("ul");
  meta.className = "meta-list";
  const metaRows = [
    ["Grade", trophy.grade],
    ["Kind", kindLabel(trophy.kind)],
    ["Roadmap stage", String(trophy.stage)],
  ];
  if (trophy.target != null) metaRows.push(["PSN target", `${trophy.target} ${trophy.targetUnit ?? ""}`.trim()]);
  for (const [label, value] of metaRows) {
    const row = document.createElement("li");
    row.textContent = `${label}: ${value}`;
    meta.append(row);
  }
  const desc = document.createElement("p");
  desc.className = "official-desc";
  desc.textContent = masked ? "Earn this trophy to reveal its official description." : `“${trophy.description}” — official description`;
  const guide = document.createElement("p");
  guide.className = "guide-text";
  guide.textContent = masked ? "This is a story trophy. Its guide stays hidden until you earn it." : trophy.guide;
  const sources = document.createElement("p");
  sources.className = "sources-line";
  sources.textContent = `Sources: ${trophy.sources}.`;
  pane.append(title, meta, desc, guide);
  if (trophy.missable && !masked) {
    const callout = document.createElement("p");
    callout.className = "missable-callout";
    callout.textContent = `Missable — ${trophy.missableWhy ?? "Do this before the final mission."}`;
    pane.append(callout);
  }
  pane.append(sources);
  const earnBtn = document.createElement("button");
  earnBtn.type = "button";
  earnBtn.className = "earn-btn" + (store.isEarned(trophy.id) ? " earned" : "");
  earnBtn.textContent = store.isEarned(trophy.id) ? "✓ Earned — tap to undo" : "Mark as earned";
  earnBtn.addEventListener("click", () => {
    store.toggleEarned(trophy.id);
    onToggle();
  });
  pane.append(earnBtn);
}

export function renderProgress(trophies, store) {
  const earned = trophies.filter((t) => store.isEarned(t.id)).length;
  const earnedCount = document.getElementById("earnedCount");
  const progressFill = document.getElementById("progressFill");
  const progressText = document.getElementById("progressText");
  const gradeCounts = document.getElementById("gradeCounts");
  earnedCount.textContent = String(earned);
  progressFill.style.width = `${Math.round((earned / trophies.length) * 100)}%`;
  progressText.textContent =
    earned === 0 ? "Your platinum run starts here." :
    earned === trophies.length ? "Platinum! You are a Leonida Legend." :
    `${earned} of ${trophies.length} down — ${trophies.length - earned} to go.`;
  gradeCounts.innerHTML = "";
  for (const grade of ["platinum", "gold", "silver", "bronze"]) {
    const total = trophies.filter((t) => t.grade === grade).length;
    const got = trophies.filter((t) => t.grade === grade && store.isEarned(t.id)).length;
    const item = document.createElement("li");
    const letter = document.createElement("b");
    letter.textContent = gradeLetter(grade);
    item.append(letter, document.createTextNode(` ${got}/${total} ${grade}`));
    gradeCounts.append(item);
  }
}
