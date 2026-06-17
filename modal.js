const Modal = (function () {
  let currentPerfume = null;
  let previousFocus  = null;
  let modalEl, boxEl, bodyEl, closeBtn, backdropEl;

  function init() {
    modalEl    = document.getElementById('modal');
    boxEl      = document.querySelector('.modal__box');
    bodyEl     = document.getElementById('modal-body');
    closeBtn   = document.getElementById('modal-close');
    backdropEl = document.getElementById('modal-backdrop');

    closeBtn.addEventListener('click', close);
    backdropEl.addEventListener('click', close);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !modalEl.hidden) close();
      if (e.key === 'Tab'    && !modalEl.hidden) trapFocus(e);
    });
  }

  function open(perfume) {
    currentPerfume = perfume;
    previousFocus  = document.activeElement;
    renderBody(perfume, false);
    bindBodyEvents();
    modalEl.hidden = false;
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function close() {
    modalEl.hidden = true;
    document.body.style.overflow = '';
    currentPerfume = null;
    if (previousFocus) previousFocus.focus();
  }

  function renderBody(perfume, showSimilar) {
    const rating     = perfume.rating.toFixed(1);
    const locale     = Lang.get() === 'tr' ? 'tr-TR' : 'en-US';
    const ratingLine =
      rating + ' <span style="color:var(--text-muted);font-size:.75rem">(' +
      perfume.ratingCount.toLocaleString(locale) + ')</span>';
    const yearRow = perfume.year
      ? '<div class="meta-item">' +
          '<span class="meta-label">' + Lang.ui('year') + '</span>' +
          '<span class="meta-value">' + esc(String(perfume.year)) + '</span>' +
        '</div>'
      : '';
    const seasons = perfume.seasons.map(s => Lang.season(s)).join(', ');

    bodyEl.innerHTML =
      '<div class="modal__name" id="modal-title">' + esc(perfume.name) + '</div>' +
      '<div class="modal__brand">' + esc(perfume.brand) + '</div>' +
      '<hr class="modal__divider">' +
      '<div class="modal__meta">' +
        '<div class="meta-item">' +
          '<span class="meta-label">' + Lang.ui('gender') + '</span>' +
          '<span class="meta-value">' + esc(Lang.gender(perfume.gender)) + '</span>' +
        '</div>' +
        yearRow +
        '<div class="meta-item">' +
          '<span class="meta-label">' + Lang.ui('season') + '</span>' +
          '<span class="meta-value">' + esc(seasons) + '</span>' +
        '</div>' +
        '<div class="meta-item">' +
          '<span class="meta-label">' + Lang.ui('rating') + '</span>' +
          '<span class="meta-value">' + ratingLine + '</span>' +
        '</div>' +
      '</div>' +
      '<hr class="modal__divider">' +
      noteSection(Lang.ui('topNotes'),    perfume.topNotes,    false) +
      noteSection(Lang.ui('middleNotes'), perfume.middleNotes, false) +
      noteSection(Lang.ui('baseNotes'),   perfume.baseNotes,   false) +
      noteSection(Lang.ui('accords'),     perfume.accords,     true) +
      '<div class="modal__find-similar">' +
        buildSimilarSection(perfume, showSimilar) +
      '</div>';
  }

  function noteSection(label, notes, isAccord) {
    if (!notes || notes.length === 0) return '';
    const chips = notes.map(n => chip(isAccord ? Lang.accord(n) : Lang.note(n))).join('');
    return '<div class="modal__section">' +
      '<div class="section-label">' + esc(label) + '</div>' +
      '<div class="chip-row">' + chips + '</div>' +
    '</div>';
  }

  function buildSimilarSection(perfume, showSimilar) {
    if (!showSimilar) {
      return '<button class="btn-ghost" id="find-similar-btn">' +
        esc(Lang.ui('findSimilar')) + '</button>';
    }

    const similar = Recommend.findSimilar(perfume, window.PERFUMES, 5);
    if (similar.length === 0) return '';

    const cards = similar.map(s =>
      '<div class="similar-card" tabindex="0" role="button" ' +
        'aria-label="' + esc(s.name) + ' by ' + esc(s.brand) + '" ' +
        'data-id="' + esc(s.id) + '">' +
        '<div class="similar-card__name">' + esc(s.name) + '</div>' +
        '<div class="similar-card__brand">' + esc(s.brand) + '</div>' +
      '</div>'
    ).join('');

    return '<div class="section-label">' +
      esc(Lang.ui('similarTo') + ' ' + perfume.name) + '</div>' +
      '<div class="similar-grid">' + cards + '</div>';
  }

  // Wire interactive elements in the modal body after each render.
  // Using innerHTML replaces old nodes, so we never accumulate duplicate listeners.
  function bindBodyEvents() {
    const findBtn = document.getElementById('find-similar-btn');
    if (findBtn) {
      findBtn.addEventListener('click', () => {
        renderBody(currentPerfume, true);
        bindBodyEvents();
        boxEl.scrollTop = 0;
      });
    }

    bodyEl.querySelectorAll('.similar-card').forEach(card => {
      function openSimilar() {
        const target = window.PERFUMES.find(p => p.id === card.dataset.id);
        if (!target) return;
        currentPerfume = target;
        renderBody(target, false);
        bindBodyEvents();
        boxEl.scrollTop = 0;
      }
      card.addEventListener('click', openSimilar);
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSimilar(); }
      });
    });
  }

  function trapFocus(e) {
    const focusable = [...modalEl.querySelectorAll(
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )];
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  }

  // Re-renders the current open modal after a language switch
  function refresh() {
    if (!modalEl.hidden && currentPerfume) {
      renderBody(currentPerfume, false);
      bindBodyEvents();
    }
  }

  return { init, open, close, refresh };
})();
