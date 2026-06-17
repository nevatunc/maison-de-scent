const Recommend = (function () {
  // Base notes anchor a fragrance's character most; heart notes define its identity;
  // top notes are fleeting. Accords get a weight between heart and base because they
  // capture the blender's intent rather than individual ingredients.
  const WEIGHTS = { base: 3, middle: 2, top: 1, accord: 2.5 };

  // Small bonus when two fragrances share the same olfactory family
  const FAMILY_BONUS = 0.04;

  // Build a feature vector keyed by "<type>:<value>" so note and accord namespaces
  // don't collide. Values are the cumulative weights for that feature.
  function buildVector(perfume) {
    const v = {};
    function add(keys, w) {
      for (const k of keys) {
        const key = 'n:' + k.toLowerCase();
        v[key] = (v[key] || 0) + w;
      }
    }
    function addAccords(keys, w) {
      for (const k of keys) {
        const key = 'a:' + k.toLowerCase();
        v[key] = (v[key] || 0) + w;
      }
    }
    add(perfume.topNotes,    WEIGHTS.top);
    add(perfume.middleNotes, WEIGHTS.middle);
    add(perfume.baseNotes,   WEIGHTS.base);
    addAccords(perfume.accords, WEIGHTS.accord);
    return v;
  }

  // Weighted cosine similarity: direction matters more than magnitude, so two
  // fragrances with different total note counts can still score very high.
  function cosine(a, b) {
    let dot = 0, magA = 0, magB = 0;
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) {
      const va = a[k] || 0;
      const vb = b[k] || 0;
      dot  += va * vb;
      magA += va * va;
      magB += vb * vb;
    }
    if (magA === 0 || magB === 0) return 0;
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }

  // Cache vectors so "find similar" on every card click doesn't rebuild 300 vectors
  const vectorCache = new Map();

  function getVector(perfume) {
    if (!vectorCache.has(perfume.id)) {
      vectorCache.set(perfume.id, buildVector(perfume));
    }
    return vectorCache.get(perfume.id);
  }

  // Score two perfumes against each other
  function scorePair(a, b) {
    let s = cosine(getVector(a), getVector(b));
    if (a.family === b.family) s += FAMILY_BONUS;
    return s;
  }

  // Return the top n fragrances most similar to `target`
  function findSimilar(target, all, n) {
    n = n || 5;
    return all
      .filter(p => p.id !== target.id)
      .map(p => ({ perfume: p, score: scorePair(target, p) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, n)
      .map(r => r.perfume);
  }

  // Score a single perfume against the user's selected notes.
  // Returns both the numeric score and the list of matched note strings so the
  // UI can show exactly why a fragrance was recommended.
  function scoreForUser(perfume, selectedNotes, genderPref, seasonPref) {
    const profileSet = new Set(selectedNotes.map(n => n.toLowerCase()));

    const noteSlots = [
      ...perfume.topNotes.map(n    => ({ note: n, w: WEIGHTS.top })),
      ...perfume.middleNotes.map(n => ({ note: n, w: WEIGHTS.middle })),
      ...perfume.baseNotes.map(n   => ({ note: n, w: WEIGHTS.base })),
    ];

    let raw = 0;
    const seen = new Set();
    const matched = [];

    for (const { note, w } of noteSlots) {
      if (profileSet.has(note.toLowerCase())) {
        raw += w;
        if (!seen.has(note.toLowerCase())) {
          seen.add(note.toLowerCase());
          matched.push(note);
        }
      }
    }

    if (matched.length === 0) return null;

    // Normalise against the total possible score for this fragrance so
    // fragrances with fewer notes aren't systematically disadvantaged.
    const maxRaw =
      perfume.topNotes.length    * WEIGHTS.top +
      perfume.middleNotes.length * WEIGHTS.middle +
      perfume.baseNotes.length   * WEIGHTS.base;

    let score = maxRaw > 0 ? raw / maxRaw : 0;

    // Preferences are soft boosts, not hard filters, so a men's fragrance can
    // still surface for someone who prefers unisex — it just ranks a bit lower.
    if (genderPref) {
      if (perfume.gender === genderPref)              score *= 1.15;
      else if (perfume.gender !== 'unisex')           score *= 0.75;
    }
    if (seasonPref && perfume.seasons.includes(seasonPref)) score *= 1.10;

    return { perfume, score, matched };
  }

  // Build a ranked list of recommendations from the user's note selection
  function getRecommendations(selectedNotes, genderPref, seasonPref, all, n) {
    n = n || 12;
    const results = [];
    for (const p of all) {
      const r = scoreForUser(p, selectedNotes, genderPref, seasonPref);
      if (r) results.push(r);
    }
    return results.sort((a, b) => b.score - a.score).slice(0, n);
  }

  return { findSimilar, getRecommendations };
})();
