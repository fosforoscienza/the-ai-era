// ════════════════════════════════════════════════════
// i18n
// ════════════════════════════════════════════════════
const UI = {
  it: {
    loadErr: "Errore nel caricamento. Apri la pagina via HTTP (es: npx serve .).",
  },
  en: {
    loadErr: "Load error. Open via HTTP server (e.g. npx serve .).",
  },
};

// ════════════════════════════════════════════════════
// Language (persisted in localStorage)
// ════════════════════════════════════════════════════
let lang = localStorage.getItem('geopolitica-lang') || 'it';

function setLang(l) {
  lang = l;
  localStorage.setItem('geopolitica-lang', l);
  document.documentElement.lang = l;
  document.querySelectorAll('.lang-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.lang === l)
  );
  if (typeof onLangChange === 'function') onLangChange(l);
}

function initLangToggle() {
  document.documentElement.lang = lang;
  document.querySelectorAll('.lang-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === lang);
    b.addEventListener('click', () => setLang(b.dataset.lang));
  });
}

// ════════════════════════════════════════════════════
// Navigation dots (13 pages by default)
// ════════════════════════════════════════════════════
const DEFAULT_PAGES = [
  'saturday-night-science.html', 'index.html', 'video.html', 'fedro-voce.html', 'scrittura.html', 'fotografia.html',
  'pechino-1.html', 'pechino-2.html', 'pechino-3.html',
  'dartmouth-1956.html', 'dartmouth-1956-voce.html', 'dartmouth-1956-2.html',
  'timeline.html', 'napa-valley.html', 'musk-page.html', 'musk-page-2.html', 'musk-altman.html', 'paesi.html', 'leader.html',
  'trump-amodei.html', 'anthropic-usa-1.html', 'anthropic-usa-2.html', 'anthropic-usa-3.html', 'anthropic-usa-4.html',
  'llm-occidentali.html', 'llm-asiatici.html', 'llm-russi.html',
  'thiel.html', 'palantir-intro.html', 'palantir-intro-2.html', 'palantir.html', 'paypal-mafia.html', 'paypal-mafia-2.html', 'paypal-mafia-3.html', 'paypal-mafia-4.html',
  'epistemia.html', 'pappagallo.html',
  'alba-transformer.html',
  'quiz-emoji-1.html', 'quiz-emoji-2.html', 'quiz-emoji-3.html', 'quiz-emoji-4.html', 'quiz-emoji-5.html', 'quiz-emoji-6.html', 'quiz-emoji-7.html', 'quiz-emoji-8.html', 'quiz-emoji-9.html', 'quiz-emoji-10.html',
  'quiz-trama-1.html', 'quiz-trama-2.html', 'quiz-trama-3.html', 'quiz-trama-4.html', 'quiz-trama-5.html', 'quiz-trama-6.html',
  'fosforo-web.html', 'fosforo-dashboard.html',
  'tom-brad.html', 'tre-fattori.html', 'confronto-ai.html', 'grazie.html', 'instagram.html'
];

// Mutable runtime list — dashboard can reorder and hide entries.
// Hidden slides are removed entirely from PAGES (skipped in navigation).
const PAGES = DEFAULT_PAGES.slice();
const SLIDES_CONFIG_KEY = 'geopolitica-slides-config';

function loadSlidesConfig() {
  try {
    const raw = localStorage.getItem(SLIDES_CONFIG_KEY);
    if (!raw) return;
    const cfg = JSON.parse(raw);
    if (!cfg || !Array.isArray(cfg.order)) return;
    // Only accept entries we still know about.
    const known = new Set(DEFAULT_PAGES);
    // Slides deleted from the dashboard never come back automatically.
    const deleted = new Set(Array.isArray(cfg.deleted) ? cfg.deleted : []);
    const order = cfg.order.filter(p => known.has(p) && !deleted.has(p));
    // Insert any new default slides at their natural DEFAULT_PAGES position
    // (right after their nearest preceding neighbour that's still in the saved
    // order) instead of appending to the end — so newly added slides appear
    // where intended even when the user has a custom saved order.
    DEFAULT_PAGES.forEach((p, i) => {
      if (order.includes(p) || deleted.has(p)) return;
      let insertAt = order.length;
      for (let j = i - 1; j >= 0; j--) {
        const idx = order.indexOf(DEFAULT_PAGES[j]);
        if (idx !== -1) { insertAt = idx + 1; break; }
      }
      order.splice(insertAt, 0, p);
    });
    const hidden = new Set(Array.isArray(cfg.hidden) ? cfg.hidden : []);
    const visible = order.filter(p => !hidden.has(p));
    if (visible.length === 0) return; // never leave the user stuck
    PAGES.splice(0, PAGES.length, ...visible);
  } catch (e) { /* fall back to defaults */ }
}
loadSlidesConfig();

function currentPageIndex() {
  const fn = (window.location.pathname.split('/').pop() || 'index.html') || 'index.html';
  // A slide can appear more than once in PAGES (duplicates from the dashboard).
  // The exact position is carried in the ?i= query param; fall back to the
  // first occurrence by filename when it's absent or stale.
  const qi = parseInt(new URLSearchParams(window.location.search).get('i'), 10);
  if (!isNaN(qi) && qi >= 0 && qi < PAGES.length && PAGES[qi] === fn) return qi;
  const idx = PAGES.indexOf(fn);
  return idx < 0 ? 0 : idx;
}

// Navigation target that preserves the exact position (so duplicate slides
// are disambiguated). When embedded in the onepage shell, navigation is
// positional and handled by the shell, so this is only used standalone.
function pageHref(idx) { return PAGES[idx] + '?i=' + idx; }

// Hidden shortcut: press "O" anywhere to open the slide-order dashboard.
document.addEventListener('keydown', (e) => {
  if (e.key !== 'o' && e.key !== 'O') return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const tag = (e.target && e.target.tagName) || '';
  if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target && e.target.isContentEditable)) return;
  window.location.href = 'dashboard.html';
});

// Fills #nav-dots to match PAGES.length, sets the active dot, and
// wires click navigation. Safe to call multiple times — extra dots
// are appended, listeners aren't re-attached.
function buildNavDots(activePage) {
  const c = document.getElementById('nav-dots');
  if (!c) return;
  while (c.children.length < PAGES.length) {
    const dot = document.createElement('button');
    dot.className = 'nav-dot';
    c.appendChild(dot);
  }
  c.querySelectorAll('.nav-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === activePage);
    if (!dot._navWired) {
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        if (i !== activePage) window.location.href = pageHref(i);
      });
      dot._navWired = true;
    }
  });
}

// Updates only the ← → arrow hrefs (no keydown). Use on slides with custom keyboard handlers.
function initNavArrows(activePage) {
  if (typeof activePage !== 'number') activePage = currentPageIndex();
  const prev = document.getElementById('nav-prev');
  const next = document.getElementById('nav-next');
  if (prev) {
    if (activePage === 0) prev.classList.add('hidden');
    else { prev.classList.remove('hidden'); prev.href = pageHref(activePage - 1); }
  }
  if (next) {
    if (activePage === PAGES.length - 1) next.classList.add('hidden');
    else { next.classList.remove('hidden'); next.href = pageHref(activePage + 1); }
  }
}

function initNav(activePage) {
  if (typeof activePage !== 'number') activePage = currentPageIndex();
  buildNavDots(activePage);

  const prev = document.getElementById('nav-prev');
  const next = document.getElementById('nav-next');
  if (prev) {
    if (activePage === 0) prev.classList.add('hidden');
    else { prev.classList.remove('hidden'); prev.href = pageHref(activePage - 1); }
  }
  if (next) {
    if (activePage === PAGES.length - 1) next.classList.add('hidden');
    else { next.classList.remove('hidden'); next.href = pageHref(activePage + 1); }
  }

  // Keyboard — global (slide nav only, carousels override per-page)
  // Supports presenter remotes via PageUp/PageDown, Space, Backspace,
  // ArrowUp/ArrowDown, plus the usual ArrowLeft/ArrowRight.
  // Matches on both e.key and e.code to be robust across keyboard layouts
  // and different presenter brands (Logitech, Kensington, Targus, etc.).
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.open').forEach(m => m.classList.remove('open'));
      return;
    }
    if (document.querySelector('.modal-backdrop.open')) return; // modal absorbs arrows

    // Ignore navigation keys when typing into a field
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target && e.target.isContentEditable)) return;

    const k = e.key;
    const c = e.code;

    const isPrev =
      k === 'ArrowLeft'  || c === 'ArrowLeft'  ||
      k === 'ArrowUp'    || c === 'ArrowUp'    ||
      k === 'PageUp'     || c === 'PageUp'     ||
      k === 'Backspace'  || c === 'Backspace';

    const isNext =
      k === 'ArrowRight' || c === 'ArrowRight' ||
      k === 'ArrowDown'  || c === 'ArrowDown'  ||
      k === 'PageDown'   || c === 'PageDown'   ||
      k === ' '          || k === 'Spacebar'   || c === 'Space' ||
      k === 'Enter'      || c === 'Enter';

    if (isPrev && activePage > 0) {
      e.preventDefault();
      window.location.href = pageHref(activePage - 1);
    }
    if (isNext && activePage < PAGES.length - 1) {
      e.preventDefault();
      window.location.href = pageHref(activePage + 1);
    }
  });
}

// ════════════════════════════════════════════════════
// Modal helpers
// ════════════════════════════════════════════════════
function openModal(id) {
  document.getElementById(id).classList.add('open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}
function backdropClose(e, id) {
  if (e.target === document.getElementById(id)) closeModal(id);
}

// ════════════════════════════════════════════════════
// Loader
// ════════════════════════════════════════════════════
function hideLoader() {
  const el = document.getElementById('loader');
  if (!el) return;
  el.style.opacity = '0';
  setTimeout(() => el.remove(), 500);
}
function showLoadError() {
  const el = document.getElementById('loader');
  if (el) el.innerHTML =
    `<p style="color:#64748b;font-size:14px;padding:24px;text-align:center">${UI[lang].loadErr}</p>`;
}

// ════════════════════════════════════════════════════
// Schede loader
// ════════════════════════════════════════════════════
const SCHEDE_IDS = ['usa','china','eu','uk','russia','india','uae','canada','japan','israel'];

async function loadSchede(folder) {
  const results = await Promise.all(
    SCHEDE_IDS.map(id =>
      fetch(`${folder}/${id}.json`)
        .then(r => { if (!r.ok) throw new Error(id); return r.json(); })
        .catch(err => { console.warn('Scheda not loaded:', err); return null; })
    )
  );
  return results.filter(Boolean);
}

// ════════════════════════════════════════════════════
// One-page embedding
// When a slide runs inside the onepage.html shell (in an iframe) it must NOT
// navigate on its own: it hides its own chrome, forwards presenter/keyboard
// input to the parent shell, and accepts language-sync messages. Inert when
// the slide is opened standalone (window.self === window.top).
// ════════════════════════════════════════════════════
(function initEmbed() {
  if (window.self === window.top) return;          // standalone → do nothing
  document.documentElement.classList.add('op-embedded');

  function hideChrome() {
    ['nav-dots', 'lang-toggle'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    document.querySelectorAll('.nav-arrow').forEach(a => { a.style.display = 'none'; });
  }
  if (document.readyState !== 'loading') hideChrome();
  else document.addEventListener('DOMContentLoaded', hideChrome);

  // Forward navigation keys to the parent shell (capture phase, so the slide's
  // own keyboard handlers never fire while embedded).
  window.addEventListener('keydown', (e) => {
    // Slides that drive their own step-by-step navigation (e.g. progressive
    // reveals) opt out of key-forwarding and talk to the shell themselves.
    if (window.__opSelfNav) return;
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target && e.target.isContentEditable)) return;
    const k = e.key, c = e.code;
    if ((k === 'c' || k === 'C') && !e.metaKey && !e.ctrlKey && !e.altKey) {   // show SNS: apre la console
      try { window.parent.postMessage({ type: 'sns-console', op: 'toggle' }, '*'); } catch (_) {}
      return;
    }
    const isNext = k === 'ArrowRight' || c === 'ArrowRight' || k === 'ArrowDown' || c === 'ArrowDown' ||
                   k === 'PageDown' || c === 'PageDown' || k === ' ' || k === 'Spacebar' || c === 'Space' ||
                   k === 'Enter' || c === 'Enter';
    const isPrev = k === 'ArrowLeft' || c === 'ArrowLeft' || k === 'ArrowUp' || c === 'ArrowUp' ||
                   k === 'PageUp' || c === 'PageUp' || k === 'Backspace' || c === 'Backspace';
    if (!isNext && !isPrev) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    try { window.parent.postMessage({ type: 'op-nav', dir: isNext ? 'next' : 'prev' }, '*'); } catch (_) {}
  }, true);

  // Accept language sync from the shell.
  window.addEventListener('message', (e) => {
    const d = e.data || {};
    if (d.type === 'op-setlang' && (d.lang === 'it' || d.lang === 'en')) {
      try { setLang(d.lang); } catch (_) {}
    }
  });
})();
