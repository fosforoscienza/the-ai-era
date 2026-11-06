// ════════════════════════════════════════════════════
// Saturday Night Science — regia condivisa tra show e console
// Lo show (sns-show.html) va sul proiettore, la console (sns-console.html)
// sullo schermo del relatore o sul telefono, anche su un altro dispositivo.
// I video caricati dalla console restano in IndexedDB di quel browser: per
// lo show su un altro dispositivo valgono solo i VIDEOS pubblicati col sito.
// ════════════════════════════════════════════════════
const SNS = (function () {
  // thumb: anteprima statica per la console (le slide vive in miniatura
  // esauriscono la memoria dei telefoni). Si rigenera dopo ogni modifica.
  const SLIDES = [
    { id: 'slide:saturday-night-science', src: 'saturday-night-science.html', thumb: 'img/sns/saturday-night-science.jpg', title: 'Saturday Night Science', sub: 'Macchine che pensano da sole' },
    { id: 'slide:dartmouth-1956-2',       src: 'dartmouth-1956-2.html', thumb: 'img/sns/dartmouth-1956-2.jpg',       title: "La nascita dell'AI",     sub: 'Proposta · Pionieri · Promessa' },
    { id: 'slide:dartmouth-1956',         src: 'dartmouth-1956.html', thumb: 'img/sns/dartmouth-1956.jpg',         title: 'Dartmouth 1956',         sub: 'Copertina' },
    // Il video sul machine learning fa parte della sequenza (quarto, dopo la foto
    // di Dartmouth). Stesso id della galleria video.
    { id: 'video:che-cose-il-machine-learning', video: true, thumb: 'img/che-cose-il-machine-learning-poster.jpg',
      title: "Che cos'è il machine learning", sub: 'Video · Cicerone AI' },
    { id: 'slide:adozione-trasporti', src: 'adozione-trasporti.html', thumb: 'img/sns/adozione-trasporti.jpg', title: 'Decenni',  sub: 'Tempi di adozione · Trasporti' },
    { id: 'slide:adozione-llm',       src: 'adozione-llm.html',       thumb: 'img/sns/adozione-llm.jpg',       title: 'Mesi',     sub: 'Tempi di adozione · LLM' },
    { id: 'slide:millennium',         src: 'millennium.html',         thumb: 'img/sns/millennium.jpg',         title: 'Una dimostrazione da $1.000.000', sub: 'Navier–Stokes e gli agenti AI' },
    // id usato anche da Jarvis («dammi le news»): non cambiarlo
    { id: 'slide:news', src: 'news.html', thumb: 'img/sns/news.jpg', title: 'News', sub: 'crivellini.it' },
    // Dalla presentazione «The AI Era» (Geopolitica della AI)
    { id: 'video:intro', video: true, thumb: 'img/intro-poster.jpg', title: 'Intro The AI Era', sub: 'Video · The AI Era' },
    { id: 'slide:scrittura',        src: 'scrittura.html',        thumb: 'img/sns/scrittura.jpg',        title: 'Citazione',            sub: 'The AI Era' },
    { id: 'slide:fotografia',       src: 'fotografia.html',       thumb: 'img/sns/fotografia.jpg',       title: 'Fotografia',           sub: 'The AI Era' },
    { id: 'slide:napa-valley',      src: 'napa-valley.html',      thumb: 'img/sns/napa-valley.jpg',      title: 'Napa Valley',          sub: 'The AI Era' },
    { id: 'slide:musk-page',        src: 'musk-page.html',        thumb: 'img/sns/musk-page.jpg',        title: 'Musk e Larry Page',    sub: 'The AI Era' },
    { id: 'slide:musk-page-2',      src: 'musk-page-2.html',      thumb: 'img/sns/musk-page-2.jpg',      title: "Musk e Page — due visioni dell'AI", sub: 'The AI Era' },
    { id: 'slide:musk-altman',      src: 'musk-altman.html',      thumb: 'img/sns/musk-altman.jpg',      title: 'Musk e Sam Altman',    sub: 'The AI Era' },
    { id: 'slide:llm-occidentali',  src: 'llm-occidentali.html',  thumb: 'img/sns/llm-occidentali.jpg',  title: 'LLM occidentali',      sub: 'The AI Era' },
    { id: 'slide:llm-asiatici',     src: 'llm-asiatici.html',     thumb: 'img/sns/llm-asiatici.jpg',     title: 'LLM asiatici',         sub: 'The AI Era' },
    { id: 'slide:llm-russi',        src: 'llm-russi.html',        thumb: 'img/sns/llm-russi.jpg',        title: 'LLM russi',            sub: 'The AI Era' },
    { id: 'slide:thiel',            src: 'thiel.html',            thumb: 'img/sns/thiel.jpg',            title: 'Peter Thiel',          sub: 'The AI Era' },
    { id: 'slide:palantir-intro',   src: 'palantir-intro.html',   thumb: 'img/sns/palantir-intro.jpg',   title: 'Palantír',             sub: 'The AI Era' },
    { id: 'slide:palantir-intro-2', src: 'palantir-intro-2.html', thumb: 'img/sns/palantir-intro-2.jpg', title: "Che cos'è un Palantír", sub: 'The AI Era' },
    { id: 'slide:palantir',         src: 'palantir.html',         thumb: 'img/sns/palantir.jpg',         title: 'Palantir',             sub: 'The AI Era' },
    { id: 'slide:paypal-mafia-2',   src: 'paypal-mafia-2.html',   thumb: 'img/sns/paypal-mafia-2.jpg',   title: 'PayPal Mafia',         sub: 'The AI Era' },
    { id: 'slide:paypal-mafia-3',   src: 'paypal-mafia-3.html',   thumb: 'img/sns/paypal-mafia-3.jpg',   title: 'PayPal Mafia — foto',  sub: 'The AI Era' }
  ].concat(quizSlides());
  // Se cambia l'ordine predefinito (qui sopra), gli ordini salvati prima non valgono più
  const ORDER_BASE = SLIDES.map(x => x.id).join('|');

  // Quiz film (js/film-quiz-data.js): la soluzione compare sulla scheda della console.
  // Nello show SNS solo i quiz trama (gli emoji restano per dashboard e onepage).
  function quizSlides() {
    if (typeof FILM_QUIZ === 'undefined') return [];
    const out = [];
    [['trama', 'Quiz trama']].forEach(([kind, label]) => {
      FILM_QUIZ[kind].forEach((q, i) => out.push({
        id: 'slide:quiz-' + kind + '-' + (i + 1), src: 'quiz-' + kind + '-' + (i + 1) + '.html',
        thumb: 'img/sns/quiz-' + kind + '-' + (i + 1) + '.jpg',
        title: label + ' ' + (i + 1), sub: '✓ ' + q.it + ' (' + q.y + ')', solution: q.it
      }));
    });
    return out;
  }

  // Video pubblicati insieme al sito (sempre presenti in galleria)
  const VIDEOS = [
    { id: 'video:che-cose-il-machine-learning', src: 'video/che-cose-il-machine-learning.mp4',
      poster: 'img/che-cose-il-machine-learning-poster.jpg',
      title: "Che cos'è il machine learning", sub: 'Cicerone AI', dur: 138 },
    { id: 'video:intro', src: 'video/intro.m4v', poster: 'img/intro-poster.jpg',
      title: 'Intro The AI Era', sub: 'The AI Era', dur: 60 }
  ];

  // ── Trasporto ──
  // Stesso browser: BroadcastChannel (immediato). Dispositivi diversi (console
  // sul telefono, show sul computer del proiettore): canale broadcast di
  // Supabase Realtime self-hosted sul Mac mini (api.fosforo.info), identificato
  // dalla stanza. Prima di questo file vanno caricati supabase-js e
  // js/sns-config.js (URL e chiave pubblica; non versionato).
  const CONFIG = window.SNS_CONFIG || {};
  const ROOM_KEY = 'sns-regia-room';
  const room = (function () {
    const q = new URLSearchParams(location.search).get('room');
    try {
      if (q && /^[A-Za-z0-9_-]{8,64}$/.test(q)) { localStorage.setItem(ROOM_KEY, q); return q; }
      return localStorage.getItem(ROOM_KEY) || 'sns-regia-m4c7q2xk';
    } catch (e) { return q || 'sns-regia-m4c7q2xk'; }
  })();
  const me = Math.random().toString(36).slice(2, 10);
  const seen = new Set();
  const handlers = [];
  let netOk = false;

  const channel = ('BroadcastChannel' in window) ? new BroadcastChannel('sns-regia') : null;
  function deliver(msg) {
    if (!msg || msg.from === me || seen.has(msg.mid)) return;
    seen.add(msg.mid);
    if (seen.size > 500) seen.delete(seen.values().next().value);
    handlers.forEach(fn => fn(msg));
  }
  if (channel) channel.addEventListener('message', e => deliver(e.data));

  // Prima del collegamento i messaggi aspettano: l'invio via REST di supabase-js
  // non è autorizzato sull'istanza del Mac mini (401).
  let rt = null;
  const pending = [];
  function netSend(msg) { rt.send({ type: 'broadcast', event: 'msg', payload: msg }).catch(() => {}); }
  function connect() {
    if (!window.supabase || !CONFIG.url || !CONFIG.key) return;
    const client = window.supabase.createClient(CONFIG.url, CONFIG.key, { auth: { persistSession: false } });
    rt = client.channel('sns-regia:' + room, { config: { broadcast: { self: false } } });
    rt.on('broadcast', { event: 'msg' }, p => deliver(p.payload));
    rt.subscribe(status => {                                       // la libreria si riconnette da sola
      netOk = status === 'SUBSCRIBED';
      if (netOk) pending.splice(0).forEach(netSend);
    });
  }
  connect();

  // Jarvis (assistente vocale sullo stesso Mac): ponte locale sul suo server. Riceve tutti i messaggi, anche quelli locali,
  // così sa cosa è in onda; i suoi comandi arrivano come quelli della console.
  // Se Jarvis non è acceso riprova in silenzio con attesa crescente.
  const JARVIS = 'http://127.0.0.1:8787/api/sns/';
  let jarvisOk = false, jarvisWait = 3000;
  function connectJarvis() {
    const es = new EventSource(JARVIS + 'events');
    es.onopen = () => { jarvisOk = true; jarvisWait = 3000; postCatalog(); };
    es.onerror = () => {
      jarvisOk = false;
      es.close();
      setTimeout(connectJarvis, jarvisWait);
      jarvisWait = Math.min(jarvisWait * 2, 30000);
    };
    es.onmessage = e => { let msg; try { msg = JSON.parse(e.data); } catch (_) { return; } deliver(msg); };
  }
  function toJarvis(msg) {
    if (jarvisOk) fetch(JARVIS + 'send', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                                           body: JSON.stringify(msg) }).catch(() => {});
  }
  // Elenco di slide e video, per poterli chiamare per nome a voce
  function postCatalog() {
    videos.list().catch(() => []).then(up => toJarvis({ t: 'catalog',
      slides: SLIDES.map(s => ({ id: s.id, title: s.title, sub: s.sub })),
      videos: VIDEOS.map(v => ({ id: v.id, title: v.title, sub: v.sub }))
        .concat(up.map(v => ({ id: v.id, title: v.name, sub: 'Caricato' }))) }));
  }

  // local: true → solo stesso browser (aggiornamenti frequenti)
  function send(msg, local) {
    msg = Object.assign({ mid: me + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), from: me }, msg);
    seen.add(msg.mid);
    if (channel) channel.postMessage(msg);
    toJarvis(msg);
    if (!local && rt) { if (netOk) netSend(msg); else if (pending.push(msg) > 20) pending.shift(); }
  }
  function listen(fn) { handlers.push(fn); }

  // Suoni lanciati dalla console e suonati dallo show. Il file lo carica chi
  // usa lo show (pannello audio, tasto A) e resta solo in quel browser: i brani
  // protetti da diritti non vanno pubblicati con il sito.
  const SOUNDS = [
    { id: 'star-wars', title: 'Star Wars', sub: 'Tema dell\'Impero', max: 10 }   // max: secondi, poi sfuma
  ];

  // ── Video e suoni in IndexedDB ──
  const DB_NAME = 'sns-regia', STORE = 'videos', SOUND_STORE = 'sounds';
  let dbp = null;
  function db() {
    if (!dbp) dbp = new Promise((res, rej) => {
      const r = indexedDB.open(DB_NAME, 2);
      r.onupgradeneeded = () => {
        const d = r.result;
        if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE, { keyPath: 'id' });
        if (!d.objectStoreNames.contains(SOUND_STORE)) d.createObjectStore(SOUND_STORE, { keyPath: 'id' });
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  function tx(mode, fn, store) {
    store = store || STORE;
    return db().then(d => new Promise((res, rej) => {
      const t = d.transaction(store, mode), s = t.objectStore(store);
      const r = fn(s);
      t.oncomplete = () => res(r && r.result);
      t.onerror = () => rej(t.error);
    }));
  }
  const videos = {
    list: () => tx('readonly', s => s.getAll()).then(a => (a || []).sort((x, y) => x.added - y.added)),
    get: (id) => tx('readonly', s => s.get(id)),
    add: (file) => {
      const v = { id: 'video:' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
                  name: file.name.replace(/\.[^.]+$/, ''), type: file.type, blob: file, added: Date.now() };
      return tx('readwrite', s => s.put(v)).then(() => { postCatalog(); return v; });
    },
    remove: (id) => tx('readwrite', s => s.delete(id)).then(r => { postCatalog(); return r; })
  };
  const sounds = {
    list: () => tx('readonly', s => s.getAll(), SOUND_STORE).then(a => a || []),
    get: (id) => tx('readonly', s => s.get(id), SOUND_STORE),
    put: (id, file) => tx('readwrite', s => s.put({ id, name: file.name, type: file.type, blob: file, added: Date.now() }), SOUND_STORE)
  };

  function isNext(e) {
    const k = e.key, c = e.code;
    return k === 'ArrowRight' || c === 'ArrowRight' || k === 'ArrowDown' || c === 'ArrowDown' ||
           k === 'PageDown' || c === 'PageDown' || k === ' ' || k === 'Spacebar' || c === 'Space' ||
           k === 'Enter' || c === 'Enter';
  }
  function isPrev(e) {
    const k = e.key, c = e.code;
    return k === 'ArrowLeft' || c === 'ArrowLeft' || k === 'ArrowUp' || c === 'ArrowUp' ||
           k === 'PageUp' || c === 'PageUp' || k === 'Backspace' || c === 'Backspace';
  }

  connectJarvis();

  return { SLIDES, ORDER_BASE, VIDEOS, SOUNDS, send, listen, videos, sounds, isNext, isPrev, room, online: () => netOk };
})();
