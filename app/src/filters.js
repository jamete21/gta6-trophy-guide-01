// Filtering: search text, kind, grade, spoiler rule and earned-only.
// A story trophy stays hidden (name and description masked) while spoilers
// are on and it is not earned yet; the spoiler setting never hides a trophy
// the reader already earned.

export function trophyMatches(trophy, filters, store) {
  const query = filters.query.trim().toLowerCase();
  if (query) {
    const haystack = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  if (filters.kind !== "all") {
    if (filters.kind === "missable") {
      if (!trophy.missable) return false;
    } else if (trophy.kind !== filters.kind) {
      return false;
    }
  }
  if (filters.grade !== "all" && trophy.grade !== filters.grade) return false;
  if (filters.earnedOnly && !store.isEarned(trophy.id)) return false;
  return true;
}

export function isSpoilerMasked(trophy, store) {
  return store.spoilersHidden && trophy.kind === "story" && !store.isEarned(trophy.id);
}

export function kindLabel(kind) {
  if (kind === "story") return "Story";
  if (kind === "collectibles") return "Collectibles";
  if (kind === "activities") return "Activities";
  return kind;
}

export function gradeLetter(grade) {
  if (grade === "platinum") return "P";
  if (grade === "gold") return "G";
  if (grade === "silver") return "S";
  return "B";
}
