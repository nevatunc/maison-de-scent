const Catalogue = (function () {
  const state = { query: '', gender: '', family: '', season: '' };

  // ── DOM refs ──────────────────────────────────────────────────────────────
  let grid, noResults, countEl, searchEl, genderEl, familyEl, seasonEl;

  function init() {
    grid      = document.getElementById('card-grid');
    noResults = document.getElementById('no-results');
    countEl   = document.getElementById('result-count');
    searchEl  = document.getElementById('search');
    genderEl  = document.getElementById('filter-gender');
    familyEl  = document.getElementById('filter-family');
    seasonEl  = document.getElementById('filter-season');

    populateDropdowns();
    bindEvents();
    render();
  }

  function populateDropdowns() {
    const genders  = ['men', 'women', 'unisex'];
    const families = [...new Set(window.PERFUMES.map(p => p.family))].sort();
    const seasons  = ['spring', 'summer', 'fall', 'winter'];

    buildOptions(genderEl,  genders,  Lang.gender.bind(Lang));
    buildOptions(familyEl,  families, Lang.family.bind(Lang));
    buildOptions(seasonEl,  seasons,  Lang.season.bind(Lang));
  }

  function buildOptions(select, values, labelFn) {
    // Keep the first option (the "all" placeholder)
    while (select.options.length > 1) select.remove(1);
    for (const v of values) {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = labelFn(v);
      select.appendChild(opt);
    }
  }

  function bindEvents() {
    searchEl.addEventListener('input', () => { state.query  = searchEl.value.trim().toLowerCase(); render(); });
    genderEl.addEventListener('change', () => { state.gender = genderEl.value; render(); });
    familyEl.addEventListener('change', () => { state.family = familyEl.value; render(); });
    seasonEl.addEventListener('change', () => { state.season = seasonEl.value; render(); });

    document.getElementById('clear-filters').addEventListener('click', clearFilters);
  }

  function clearFilters() {
    state.query = state.gender = state.family = state.season = '';
    searchEl.value = '';
    genderEl.value = familyEl.value = seasonEl.value = '';
    render();
  }

  function filter(perfumes) {
    return perfumes.filter(p => {
      if (state.gender && p.gender !== state.gender)              return false;
      if (state.family && p.family !== state.family)              return false;
      if (state.season && !p.seasons.includes(state.season))     return false;
      if (state.query) {
        const q = state.query;
        const inName   = p.name.toLowerCase().includes(q);
        const inBrand  = p.brand.toLowerCase().includes(q);
        const inNotes  = [...p.topNotes, ...p.middleNotes, ...p.baseNotes]
                           .some(n => n.toLowerCase().includes(q));
        if (!inName && !inBrand && !inNotes) return false;
      }
      return true;
    });
  }

  function render() {
    const visible = filter(window.PERFUMES);
    grid.innerHTML = '';
    countEl.textContent = visible.length + ' ' + Lang.ui('results');
    noResults.classList.toggle('hidden', visible.length > 0);

    const frag = document.createDocumentFragment();
    for (const p of visible) {
      frag.appendChild(buildCard(p));
    }
    grid.appendChild(frag);
  }

  function buildCard(p) {
    const el = document.createElement('div');
    el.className = 'card';
    el.setAttribute('role', 'listitem');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', p.name + ' by ' + p.brand);

    // 3-4 notes to highlight: prefer middle notes as the heart of the fragrance
    const highlight = [
      ...p.middleNotes.slice(0, 2),
      ...p.topNotes.slice(0, 2),
    ]
      .filter((n, i, arr) => arr.indexOf(n) === i)
      .slice(0, 4);

    el.innerHTML =
      '<div class="card__name">' + esc(p.name) + '</div>' +
      '<div class="card__brand">' + esc(p.brand) + '</div>' +
      '<div class="card__tags">' +
        tag(Lang.gender(p.gender)) +
        tag(Lang.family(p.family)) +
        p.seasons.map(s => tag(Lang.season(s))).join('') +
      '</div>' +
      '<div class="card__notes">' +
        highlight.map(n => chip(Lang.note(n))).join('') +
      '</div>';

    function open() { Modal.open(p); }
    el.addEventListener('click', open);
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });

    return el;
  }

  // Called when language changes — rebuilds dropdowns and re-renders cards
  function refresh() {
    populateDropdowns();
    render();
  }

  return { init, refresh };
})();

// ── Helpers (module-level so modal.js can share them) ────────────────────────
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function chip(label, extra) {
  return '<span class="chip' + (extra ? ' ' + extra : '') + '">' + esc(label) + '</span>';
}

function tag(label) {
  return '<span class="tag">' + esc(label) + '</span>';
}
