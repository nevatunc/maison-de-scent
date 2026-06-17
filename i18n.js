const Lang = (function () {
  let current = localStorage.getItem('maison-lang') || 'en';

  function get() {
    return current;
  }

  function set(lang) {
    current = lang;
    localStorage.setItem('maison-lang', lang);
    document.documentElement.lang = lang;
    applyAll();
  }

  // UI string lookup with English fallback
  function ui(key) {
    const dict = window.I18N.ui;
    return (dict[current] && dict[current][key]) || dict.en[key] || key;
  }

  // Note display: TR if available, else keep the English key as-is
  function note(n) {
    const dict = window.I18N.note;
    if (current === 'en' || !dict[n]) return n;
    return dict[n] || n;
  }

  function gender(g) {
    const dict = window.I18N.gender;
    if (current === 'en') {
      return g.charAt(0).toUpperCase() + g.slice(1);
    }
    return dict[g] || g;
  }

  function season(s) {
    const dict = window.I18N.season;
    if (current === 'en') {
      return s.charAt(0).toUpperCase() + s.slice(1);
    }
    return dict[s] || s;
  }

  function accord(a) {
    const dict = window.I18N.accord;
    if (current === 'en' || !dict[a]) return a;
    return dict[a];
  }

  function family(f) {
    const dict = window.I18N.family;
    if (current === 'en' || !dict[f]) return f;
    return dict[f];
  }

  // Walk the DOM and update all elements that carry translation keys
  function applyAll() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = ui(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = ui(el.dataset.i18nPlaceholder);
    });
  }

  // Called once on page load to set the initial state without a full re-render
  function init() {
    document.documentElement.lang = current;
    applyAll();
  }

  return { get, set, init, ui, note, gender, season, accord, family };
})();
