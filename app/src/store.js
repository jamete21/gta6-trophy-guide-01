// Progress store: earned trophies and settings, saved in localStorage only.
// Nothing leaves the browser except an export file the reader asks for.

export const STORAGE_KEY = "leonida-trophy-atlas-v1";

export function createStore() {
  let earned = new Set();
  let spoilersHidden = true;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (Array.isArray(saved.earned)) earned = new Set(saved.earned.filter(Number.isInteger));
      if (typeof saved.spoilersHidden === "boolean") spoilersHidden = saved.spoilersHidden;
    }
  } catch {
    earned = new Set();
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        earned: [...earned].sort((a, b) => a - b),
        spoilersHidden,
      }));
    } catch {
      // Storage full or blocked: the in-memory state still works for this visit.
    }
  }

  return {
    isEarned(id) { return earned.has(id); },
    toggleEarned(id) {
      if (earned.has(id)) earned.delete(id);
      else earned.add(id);
      persist();
      return earned.has(id);
    },
    setEarned(id, value) {
      if (value) earned.add(id);
      else earned.delete(id);
      persist();
    },
    earnedCount() { return earned.size; },
    earnedIds() { return [...earned].sort((a, b) => a - b); },
    get spoilersHidden() { return spoilersHidden; },
    setSpoilersHidden(value) {
      spoilersHidden = !!value;
      persist();
    },
    reset() {
      earned = new Set();
      persist();
    },
    exportText() {
      return JSON.stringify({
        app: "Leonida Trophy Atlas",
        exportedAt: new Date().toISOString(),
        earned: [...earned].sort((a, b) => a - b),
        spoilersHidden,
      }, null, 2);
    },
    importText(text) {
      const parsed = JSON.parse(text);
      if (!parsed || !Array.isArray(parsed.earned)) throw new Error("not a Leonida Trophy Atlas export");
      const ids = parsed.earned.filter(Number.isInteger);
      earned = new Set(ids);
      if (typeof parsed.spoilersHidden === "boolean") spoilersHidden = parsed.spoilersHidden;
      persist();
      return ids.length;
    },
  };
}
