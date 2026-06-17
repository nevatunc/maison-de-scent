// Top-level wiring: initialises all modules and handles tab switching + language toggle.
document.addEventListener('DOMContentLoaded', () => {
  Lang.init();
  Modal.init();
  Catalogue.init();
  ForYou.init();

  // ── Tab switching ───────────────────────────────────────────────────────
  const tabs    = document.querySelectorAll('.tab');
  const panes   = document.querySelectorAll('.tab-pane');

  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;

      tabs.forEach(t  => t.classList.toggle('tab--active', t.dataset.tab === target));
      panes.forEach(p => {
        const isTarget = p.id === 'tab-' + target;
        p.classList.toggle('tab-pane--active', isTarget);
        p.hidden = !isTarget;
      });
    });
  });

  // ── Language toggle ─────────────────────────────────────────────────────
  const langBtn = document.getElementById('lang-toggle');

  function updateLangButton(lang) {
    // Show the *other* language so the button reads as a switch target
    langBtn.textContent = lang === 'en' ? 'TR' : 'EN';
    langBtn.setAttribute('aria-label', lang === 'en' ? 'Switch to Turkish' : 'Switch to English');
  }

  updateLangButton(Lang.get());

  langBtn.addEventListener('click', () => {
    const next = Lang.get() === 'en' ? 'tr' : 'en';
    Lang.set(next);
    updateLangButton(next);
    Catalogue.refresh();
    ForYou.refresh();
    Modal.refresh();
  });
});

// ── For You tab ───────────────────────────────────────────────────────────────
const ForYou = (function () {
  // All unique notes drawn from the dataset, sorted
  let allNotes = [];
  let selectedNotes = new Set();
  let noteSearchQuery = '';

  let poolEl, noteSearchEl, genderEl, seasonEl, getRecs, resetBtn, resultsEl, hintEl;

  function init() {
    poolEl       = document.getElementById('note-pool');
    noteSearchEl = document.getElementById('note-search');
    genderEl     = document.getElementById('pref-gender');
    seasonEl     = document.getElementById('pref-season');
    getRecs      = document.getElementById('get-recs');
    resetBtn     = document.getElementById('reset-foryou');
    resultsEl    = document.getElementById('recs-results');
    hintEl       = document.getElementById('pick-hint');

    allNotes = buildNoteList();
    populatePrefs();
    renderPool();
    bindEvents();
  }

  function buildNoteList() {
    const set = new Set();
    for (const p of window.PERFUMES) {
      for (const n of [...p.topNotes, ...p.middleNotes, ...p.baseNotes]) {
        set.add(n);
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }

  function populatePrefs() {
    buildPrefOptions(genderEl, ['men', 'women', 'unisex'], Lang.gender.bind(Lang), Lang.ui('gender'));
    buildPrefOptions(seasonEl, ['spring', 'summer', 'fall', 'winter'], Lang.season.bind(Lang), Lang.ui('season'));
  }

  function buildPrefOptions(select, values, labelFn, placeholder) {
    while (select.options.length > 1) select.remove(1);
    select.options[0].textContent = Lang.ui('all') + ' — ' + placeholder;
    for (const v of values) {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = labelFn(v);
      select.appendChild(opt);
    }
  }

  function renderPool() {
    const query = noteSearchQuery.toLowerCase();
    const visible = query
      ? allNotes.filter(n => n.toLowerCase().includes(query) || Lang.note(n).toLowerCase().includes(query))
      : allNotes;

    poolEl.innerHTML = '';
    const frag = document.createDocumentFragment();
    for (const n of visible) {
      const btn = document.createElement('button');
      btn.className = 'chip chip--selectable' + (selectedNotes.has(n) ? ' chip--selected' : '');
      btn.textContent = Lang.note(n);
      btn.dataset.note = n;
      btn.setAttribute('aria-pressed', selectedNotes.has(n) ? 'true' : 'false');
      btn.addEventListener('click', () => toggleNote(n, btn));
      frag.appendChild(btn);
    }
    poolEl.appendChild(frag);
    updateHint();
  }

  function toggleNote(n, btn) {
    if (selectedNotes.has(n)) {
      selectedNotes.delete(n);
      btn.classList.remove('chip--selected');
      btn.setAttribute('aria-pressed', 'false');
    } else {
      selectedNotes.add(n);
      btn.classList.add('chip--selected');
      btn.setAttribute('aria-pressed', 'true');
    }
    updateHint();
  }

  function updateHint() {
    hintEl.classList.toggle('hidden', selectedNotes.size > 0);
  }

  function bindEvents() {
    noteSearchEl.addEventListener('input', () => {
      noteSearchQuery = noteSearchEl.value.trim();
      renderPool();
    });

    getRecs.addEventListener('click', () => {
      if (selectedNotes.size === 0) return;
      const results = Recommend.getRecommendations(
        [...selectedNotes],
        genderEl.value,
        seasonEl.value,
        window.PERFUMES,
        12
      );
      renderResults(results);
      resetBtn.classList.remove('hidden');
    });

    resetBtn.addEventListener('click', reset);
  }

  function renderResults(results) {
    if (results.length === 0) {
      resultsEl.innerHTML = '<p class="hint-text" style="padding:1rem 0">' + esc(Lang.ui('noResults')) + '</p>';
      return;
    }

    const heading = '<div class="recs-heading">' + esc(Lang.ui('yourMatches')) + '</div>';
    const cards = results.map(r => buildRecCard(r)).join('');
    resultsEl.innerHTML = heading + '<div class="rec-list">' + cards + '</div>';

    resultsEl.querySelectorAll('.rec-card').forEach(card => {
      const id = card.dataset.id;
      function open() {
        const p = window.PERFUMES.find(x => x.id === id);
        if (p) Modal.open(p);
      }
      card.addEventListener('click', open);
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
  }

  function buildRecCard(r) {
    const matchedChips = r.matched.map(n => chip(Lang.note(n), 'chip--match')).join('');
    return '<div class="rec-card" tabindex="0" role="listitem" data-id="' + esc(r.perfume.id) + '">' +
      '<div class="rec-card__header">' +
        '<span class="rec-card__name">' + esc(r.perfume.name) + '</span>' +
        '<span class="rec-card__brand">' + esc(r.perfume.brand) + '</span>' +
      '</div>' +
      '<div class="rec-card__tags">' +
        tag(Lang.gender(r.perfume.gender)) +
        tag(Lang.family(r.perfume.family)) +
      '</div>' +
      '<div class="rec-card__match-label" style="margin-top:.5rem">' + esc(Lang.ui('yourMatches')) + '</div>' +
      '<div class="rec-card__notes">' + matchedChips + '</div>' +
    '</div>';
  }

  function reset() {
    selectedNotes.clear();
    noteSearchQuery = '';
    noteSearchEl.value = '';
    genderEl.value = seasonEl.value = '';
    resultsEl.innerHTML = '';
    resetBtn.classList.add('hidden');
    renderPool();
  }

  function refresh() {
    populatePrefs();
    renderPool();
    // Re-render results if any are showing
    if (resultsEl.querySelector('.rec-list')) {
      const results = Recommend.getRecommendations(
        [...selectedNotes],
        genderEl.value,
        seasonEl.value,
        window.PERFUMES,
        12
      );
      renderResults(results);
    }
  }

  return { init, refresh };
})();
