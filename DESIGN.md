# Design notes — Maison de Scent

This is a plain-language walkthrough of every file and the main decisions behind them. I wrote it so I can explain the project confidently in an interview without having to re-read the code.

---

## File layout

```
index.html    — structure and tab scaffolding
style.css     — design system and all layout rules
data.js       — both JSON files embedded as globals
i18n.js       — Lang module: translations and language switching
recommend.js  — Recommend module: scoring algorithm
catalogue.js  — Catalogue module: filtering and card rendering
modal.js      — Modal module: detail view and focus trap
app.js        — top-level wiring; also contains the ForYou module
```

I split things this way because each file has one job. The data layer is separate from display logic, the algorithm is isolated from the DOM, and the top-level wiring in `app.js` is the only place that knows all the modules exist. If I wanted to swap the recommendation algorithm for something more sophisticated, nothing in `catalogue.js` or `modal.js` would need to change.

---

## data.js

`fetch()` of local JSON fails under `file://` in Chrome and Firefox for security reasons, so I embed both files as JavaScript globals: `window.PERFUMES` and `window.I18N`. This is the only approach that works when someone simply opens `index.html` from their desktop. I generate `data.js` with a small Python script that reads the two source JSON files and writes them out as a single JS assignment.

---

## i18n.js — the `Lang` module

The `Lang` module is an IIFE that exposes six functions: `get`, `set`, `init`, `ui`, `note`, and helpers for gender/season/accord/family. Keeping these together means every translation lookup goes through one place.

The key design decision was making the recommendation engine language-independent. Filtering and scoring always run on the original English keys from the dataset. Translations only happen at render time. This means switching language doesn't invalidate any scores or filter state — it just re-renders the existing results with different labels.

For notes with no Turkish entry in `i18n.json`, I fall back to the English key. There are hundreds of notes in a 300-fragrance dataset and many of them are proper nouns or trademarked ingredients; keeping the original name is more honest than guessing a translation.

---

## recommend.js — the `Recommend` module

### Feature representation

I turn each fragrance into a weighted dictionary keyed by `n:<note>` and `a:<accord>`. The prefix stops note and accord namespaces from colliding (imagine a fragrance whose note and accord both contain "rose" — without the prefix, their weights would merge incorrectly).

Weights: base notes = 3, heart notes = 2, top notes = 1, accords = 2.5. Base notes get the highest weight because they're what's left after the top notes evaporate — they define a fragrance's long-term character. Accords get 2.5 because they represent the blender's stated intent rather than raw ingredients; they're a higher-level signal.

### Similarity (Find Similar)

I use weighted cosine similarity. Cosine measures the angle between two vectors rather than their dot product, so a fragrance with 20 notes doesn't automatically outscore one with 8. Two fragrances that share 4 highly-weighted base notes score very high even if they differ everywhere else.

A tiny family bonus (0.04, about one tenth of a single top-note overlap) nudges fragrances in the same olfactory family slightly higher. It's small enough that a different-family fragrance with strong note overlap still wins.

Vectors are cached in a `Map` so clicking "find similar" on multiple cards doesn't rebuild 300 vectors each time.

### Recommendation (For You)

The user's selected notes form a profile set. I score each fragrance by how much of its weighted note mass matches the profile, then normalise by the fragrance's total possible weight. Normalisation matters: a fragrance with 6 notes matching 2 of your picks scores higher than one with 20 notes matching the same 2.

Gender and season preferences apply multiplicative boosts (×1.15 and ×1.10 for a match; ×0.75 for a gender mismatch) rather than hard filters. This way a women's fragrance can still appear in the results for someone who checked "men" — it just ranks lower. I think that's more honest to how fragrance actually works; gender labels are marketing, not chemistry.

The UI shows which specific notes matched so the user understands the recommendation rather than just trusting a black box.

---

## catalogue.js

State is just a plain object (`{ query, gender, family, season }`). Every filter change calls `render()`, which re-filters the full 300-perfume array and rebuilds the card grid. For 300 items this is fast enough that there's no need for debouncing or virtual scrolling.

Cards show 3-4 highlighted notes. I pull middle notes first (the heart of the fragrance), then top notes, deduplicate, and cap at 4. Middle notes are the most meaningful because they last long enough to smell but are still accessible without knowing the dry-down.

The `esc()`, `chip()`, and `tag()` helpers are defined at module scope rather than inside the IIFE so `modal.js` can share them. They're pure functions with no side effects, so sharing them across files doesn't create coupling.

---

## modal.js

The modal stores `currentPerfume` and `previousFocus` so it can re-render on language switch and return focus to the triggering element on close. Both are needed for accessibility: `aria-modal` and a focus trap keep keyboard and screen reader users inside the dialog, and restoring focus on close means they end up back where they started.

The focus trap intercepts `Tab` and `Shift+Tab` and cycles within the focusable elements inside the modal box. I query focusable elements fresh each time (rather than caching them) because the modal content changes when "find similar" is clicked.

"Find similar" replaces the button with an inline grid rather than opening a new page or modal-within-modal — I wanted the interaction to feel like a natural expansion of the detail view, not a navigation event.

---

## app.js and the ForYou module

I put `ForYou` in `app.js` rather than its own file. It's the most UI-heavy module and its logic is straightforward enough that a dedicated file would be ceremony without benefit. If it grew significantly it would be worth splitting.

The note pool renders all unique notes as toggleable chips. I used `<button>` elements with `aria-pressed` so screen readers announce the selected/deselected state without any custom ARIA role. The pool filters live as the user types; selection state is kept in a `Set` so toggles are O(1) regardless of pool size.

---

## Design system

I chose a dark, warm, muted palette (deep bordeaux-black background, ivory text, gold accents) because luxury fragrance brands tend toward drama and restraint. The design is deliberately flat — no gradients, no shadows, no glows. Thin gold hairlines (`#3A2A22` borders, `#9C7B3A` tag outlines) do all the separation work. The combination of Cormorant Garamond for headings and Inter for body text is a classic pairing: the serif brings historical weight, the sans-serif keeps the UI legible at small sizes.

The card grid uses `auto-fill` with a `260px` minimum so it adapts naturally from 1 column on very small screens to 4+ columns on wide displays, with no explicit breakpoints needed for the grid itself.

---

## What I'd change with more time

- Add a proper virtualised list for very slow devices — 300 DOM nodes is fine in practice but could be noticeable on budget phones.
- Add URL-based state so filtered views are shareable (e.g. `?family=floral&season=summer`).
- Explore a TF-IDF weighting for notes that appear across many fragrances (common notes like musk and cedar are less discriminating than rare ones like iso e super or oud).
- Add a "wishlist" that persists to localStorage so returning visitors see their saved fragrances.
