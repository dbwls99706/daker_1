/**
 * Lightweight fuzzy matching — no external dependencies.
 * Supports case-insensitive matching with consecutive-character bonus.
 */

export interface FuzzyResult {
  match: boolean;
  score: number;
  indices: number[];
}

export function fuzzyMatch(query: string, text: string): FuzzyResult {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  const indices: number[] = [];

  if (q.length === 0) return { match: true, score: 0, indices: [] };
  if (q.length > t.length) return { match: false, score: 0, indices: [] };

  // Exact substring match gets highest score
  const substringIdx = t.indexOf(q);
  if (substringIdx !== -1) {
    const idxArr = Array.from({ length: q.length }, (_, i) => substringIdx + i);
    // Bonus for matching at start
    const startBonus = substringIdx === 0 ? 100 : 0;
    return { match: true, score: 200 + startBonus - substringIdx, indices: idxArr };
  }

  // Character-by-character fuzzy match
  let qi = 0;
  let score = 0;
  let prevMatchIdx = -2;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      indices.push(ti);
      // Consecutive match bonus
      if (ti === prevMatchIdx + 1) {
        score += 10;
      }
      // Word boundary bonus (after space, hyphen, or start)
      if (ti === 0 || t[ti - 1] === " " || t[ti - 1] === "-" || t[ti - 1] === "_") {
        score += 15;
      }
      prevMatchIdx = ti;
      qi++;
      score += 5;
    }
  }

  if (qi === q.length) {
    // Penalty for spread-out matches
    const spread = indices.length > 1 ? indices[indices.length - 1] - indices[0] : 0;
    score -= spread * 0.5;
    return { match: true, score: Math.max(1, score), indices };
  }

  return { match: false, score: 0, indices: [] };
}

/** Highlight matching characters in text */
export function highlightMatches(text: string, indices: number[]): { char: string; highlight: boolean }[] {
  const set = new Set(indices);
  return text.split("").map((char, i) => ({
    char,
    highlight: set.has(i),
  }));
}
