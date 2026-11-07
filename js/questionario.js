// Questionario «Conosciamoci meglio»: domande, invio e lettura delle risposte.
// Le risposte (anonime) stanno nella tabella public.sns_questionario del
// Supabase sul Mac mini: chi ha il link può inserire e leggere, non modificare.
// Serve js/sns-config.js (window.SNS_CONFIG) caricato prima di questo file.
// Serata: di default «sns-AAAA-MM-GG» (ora di Roma, cambia alle 6 del mattino, così chi
// risponde dopo mezzanotte resta nella stessa serata); ?e=<evento> la sceglie a mano
// (i test: ?e=test-…).
// Righe di controllo (dalla console, stessa tabella): fase «reset» azzera i risultati
// da quel momento; «hide»/«show» con una parola la nascondono o la mostrano nella nuvola.
// Fase: «pre» a inizio show (parte 1 + 2), «post» alla fine (solo parte 2, per
// misurare l'impatto): ?fase=post oppure l'indirizzo /dopo.
// anon_id è un codice casuale del telefono: lega prima e dopo, senza dati personali.
const QZ = (function () {
  const CFG = window.SNS_CONFIG || {};
  const P = new URLSearchParams(location.search);
  const SERATA = 'sns-' + new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(new Date(Date.now() - 6 * 3600e3));
  const EVENTO = (P.get('e') || SERATA).slice(0, 64);
  const FASE = P.get('fase') === 'post' || /\/dopo\/?$/.test(location.pathname) ? 'post' : 'pre';
  const TABLE = CFG.url ? CFG.url.replace(/\/$/, '') + '/rest/v1/sns_questionario' : '';
  const HEADERS = { apikey: CFG.key, Authorization: 'Bearer ' + CFG.key };

  // [chiave salvata, etichetta, emoji] — le icone vettoriali sono in ICONS, più sotto
  const Q = {
    frequenza: {
      part: 1, type: 'one', title: 'Quanto spesso usi l’AI?',
      opts: [['mai', 'Mai', '🚫'], ['mese', 'Qualche volta al mese', '🌙'], ['settimana', 'Ogni settimana', '📅'],
             ['giorno', 'Ogni giorno', '☀️'], ['sempre', 'Non ne posso più fare a meno', '⚡']]
    },
    strumenti: {
      part: 1, type: 'many', title: 'Quali strumenti usi?', hint: 'Anche più di uno',
      opts: [['chatgpt', 'ChatGPT', '💬'], ['gemini', 'Gemini', '✨'], ['claude', 'Claude', '🟠'], ['copilot', 'Copilot', '🪁'],
             ['meta', 'Meta AI (WhatsApp)', '🟢'], ['perplexity', 'Perplexity', '🔭'], ['mistral', 'Mistral (Le Chat)', '🌬️'], ['altro', 'Altro', '➕'], ['nessuno', 'Nessuno', '🙅']]
    },
    usi: {
      part: 1, type: 'many', title: 'Per cosa la usi?', hint: 'Anche più di una cosa',
      opts: [['info', 'Cercare informazioni', '🔎'], ['scrivere', 'Scrivere e correggere testi', '✍️'], ['lavoro', 'Lavoro', '💼'],
             ['studio', 'Studio e scuola', '📚'], ['tradurre', 'Tradurre', '🌍'], ['immagini', 'Immagini e video', '🎨'],
             ['codice', 'Programmare', '💻'], ['consigli', 'Consigli personali e salute', '🩺'], ['svago', 'Svago e curiosità', '🎲']]
    },
    futuro: {
      part: 2, type: 'scale', title: 'Come vedi il futuro con l’AI?',
      opts: [[1, 'Molto preoccupato', '😨'], [2, 'Preoccupato', '😟'], [3, 'Così così', '😐'], [4, 'Fiducioso', '🙂'], [5, 'Entusiasta', '🤩']]
    },
    paure: {
      part: 2, type: 'many', max: 3, title: 'Cosa ti fa più paura?', hint: 'Fino a 3',
      opts: [['lavoro', 'Perdita di posti di lavoro', '💼'], ['fake', 'Fake news e deepfake', '🎭'], ['privacy', 'Privacy e sorveglianza', '👁️'],
             ['potere', 'Potere a poche aziende', '🏢'], ['pensiero', 'Smettere di pensare da soli', '🧠'],
             ['armi', 'Uso militare', '🎯'], ['controllo', 'Perdere il controllo', '⚠️'], ['nessuna', 'Niente, sono tranquillo', '😌']]
    },
    opportunita: {
      part: 2, type: 'many', max: 3, title: 'Quali opportunità vedi?', hint: 'Fino a 3',
      opts: [['medicina', 'Medicina e cure', '🩺'], ['scuola', 'Scuola e apprendimento', '🎓'], ['scienza', 'Scienza e scoperte', '🔬'],
             ['noia', 'Meno lavori noiosi', '⏱️'], ['accesso', 'Aiuto a chi ha disabilità', '♿'], ['clima', 'Ambiente e clima', '🌱'],
             ['creativita', 'Creatività', '🎨'], ['nessuna', 'Nessuna', '🤷']]
    },
    parola: { part: 2, type: 'text', max: 40, title: 'Il futuro dell’AI in una parola', hint: 'Facoltativo' }
  };

  // Icone vettoriali (stile Lucide, 24×24, a tratto) per questionario e risultati.
  // L'emoji in Q resta come terzo campo per le pagine che la usano ancora (confronto).
  const FACE = '<circle cx="12" cy="12" r="9"/><path d="M9 9.5h.01M15 9.5h.01" stroke-width="2.6"/>';
  const ICONS = {
    frequenza: {
      mai: '<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>',
      mese: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
      settimana: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
      giorno: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/>',
      sempre: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"/>'
    },
    strumenti: {
      chatgpt: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
      gemini: '<path d="M12 2c0 6 4 10 10 10-6 0-10 4-10 10 0-6-4-10-10-10 6 0 10-4 10-10Z"/>',
      claude: '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/>',
      copilot: '<path d="M3 11 22 2l-9 19-2-8-8-2Z"/>',
      meta: '<path d="M12 12c-2-2.7-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.3 6-4Zm0 0c2 2.7 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.3-6 4Z"/>',
      perplexity: '<circle cx="12" cy="12" r="9"/><path d="m16.2 7.8-2.1 6.3-6.3 2.1 2.1-6.3 6.3-2.1Z"/>',
      mistral: '<path d="M12.8 19.6A2 2 0 1 0 14 16H2M17.5 8a2.5 2.5 0 1 1 2 4H2M9.8 4.4A2 2 0 1 1 11 8H2"/>',
      altro: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8M12 8v8"/>',
      nessuno: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>'
    },
    usi: {
      info: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
      scrivere: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
      lavoro: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
      studio: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2Z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7Z"/>',
      tradurre: '<path d="m5 8 6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6"/>',
      immagini: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
      codice: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
      consigli: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/>',
      svago: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 8h.01M16 8h.01M12 12h.01M8 16h.01M16 16h.01" stroke-width="3"/>'
    },
    futuro: {
      1: FACE + '<path d="M8 17c1-1.9 2.4-2.8 4-2.8s3 .9 4 2.8M7.5 6.8 10 7.8M16.5 6.8 14 7.8"/>',
      2: FACE + '<path d="M8.5 16.2c.9-1.1 2.1-1.6 3.5-1.6s2.6.5 3.5 1.6"/>',
      3: FACE + '<path d="M8.5 15h7"/>',
      4: FACE + '<path d="M8.5 14c.9 1.1 2.1 1.6 3.5 1.6s2.6-.5 3.5-1.6"/>',
      5: FACE + '<path d="M7.5 13h9a4.5 4.5 0 0 1-9 0Z"/>'
    },
    paure: {
      lavoro: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
      fake: '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>',
      privacy: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
      potere: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
      pensiero: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5A5 5 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5M9 18h6M10 22h4"/>',
      armi: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
      controllo: '<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z"/><path d="M12 9v4M12 17h.01"/>',
      nessuna: FACE + '<path d="M8.5 14c.9 1.1 2.1 1.6 3.5 1.6s2.6-.5 3.5-1.6"/>'
    },
    opportunita: {
      medicina: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/><path d="M3.5 12H9l1-2 2 4.5 2-7 1.5 4.5h5"/>',
      scuola: '<path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c3 3 9 3 12 0v-5M22 10v6"/>',
      scienza: '<path d="M10 2v7.5L4.5 19A2 2 0 0 0 6.3 22h11.4a2 2 0 0 0 1.8-3L14 9.5V2M8.5 2h7M7 16h10"/>',
      noia: '<circle cx="12" cy="14" r="8"/><path d="M10 2h4M12 14l3-3"/>',
      accesso: '<circle cx="16" cy="4" r="1"/><path d="m18 19 1-7-6 1M5 8l3-3 5.5 3-2.4 3.5M4.2 14.5a5 5 0 0 0 6.9 6.9M13.8 17.5a5 5 0 0 0-6.9-6.9"/>',
      clima: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z"/><path d="M2 21c0-3 1.9-5.4 5.2-6"/>',
      creativita: '<path d="M12 22a10 10 0 1 1 10-10c0 2.8-2.2 4-4 4h-2a2 2 0 0 0-1.5 3.3A1.7 1.7 0 0 1 12 22Z"/><path d="M7.5 11h.01M10 7h.01M15 7.5h.01" stroke-width="3"/>',
      nessuna: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>'
    }
  };
  const SVG = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const icon = (key, id) => { const d = ICONS[key] && ICONS[key][id]; return d ? SVG(d) : ''; };
  const CHECK = SVG('<path d="M20 6 9 17l-5-5"/>');

  function anonId() {
    let id = '';
    try { id = localStorage.getItem('sns-anon-id') || ''; } catch (e) {}
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now().toString(36)).slice(0, 40);
      try { localStorage.setItem('sns-anon-id', id); } catch (e) {}
    }
    return id;
  }

  async function insert(row) {
    if (!TABLE) throw new Error('config');
    const r = await fetch(TABLE, {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }, HEADERS),
      body: JSON.stringify(Object.assign({ evento: EVENTO, fase: FASE, anon_id: anonId() }, row))
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
  }

  // ── Parole: chiave normalizzata, filtro parolacce, scelte della console ──
  function wordKey(s) { return String(s || '').trim().toLowerCase().replace(/[.!?,;:"«»()]+/g, '').replace(/\s+/g, ' ').slice(0, 40); }
  // Radici volgari, bestemmie e insulti (anche dentro parole più lunghe)…
  const BAD_ROOTS = ['cazz', 'minchi', 'stronz', 'merd', 'vaffan', 'fancul', 'coglion', 'puttan', 'troia', 'troie', 'mignott', 'zoccol',
    'bastard', 'ricchion', 'frocio', 'froci', 'culatton', 'pompin', 'sborr', 'inculat', 'fottut', 'fottere', 'scopare', 'porcodi', 'porcadi',
    'diocan', 'dioporc', 'diobo', 'porcamad', 'madonnaputt', 'cristodi', 'fuck', 'shit', 'bitch', 'cunt', 'pussy', 'nigg', 'whore', 'slut',
    'asshole', 'motherf', 'retard', 'hitler', 'siegheil'];
  // …e parole da bloccare solo se intere
  const BAD_WORDS = new Set(['culo', 'figa', 'fica', 'tette', 'sega', 'pene', 'negro', 'negri', 'nazi', 'duce', 'dick', 'cock', 'fag', 'ass', 'porco', 'porca', 'cesso']);
  function isBad(w) {
    const plain = w.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e')
      .replace(/4|@/g, 'a').replace(/5|\$/g, 's');
    const letters = plain.replace(/[^a-z]/g, '');
    return BAD_ROOTS.some(r => letters.includes(r)) || plain.split(/[^a-z]+/).some(t => BAD_WORDS.has(t)) || BAD_WORDS.has(letters);
  }
  let ctl = { hidden: new Set(), shown: new Set(), resetAt: null };
  // 'ok' | 'hidden' (nascosta dalla console) | 'filtro' (bloccata in automatico) | 'shown' (sbloccata dalla console)
  function wordStatus(w) { return ctl.hidden.has(w) ? 'hidden' : ctl.shown.has(w) ? 'shown' : isBad(w) ? 'filtro' : 'ok'; }

  // Risposte della serata dopo l'ultimo azzeramento. fase: 'pre', 'post' oppure nulla per tutte e due.
  // Aggiorna anche le scelte sulle parole e l'ora dell'ultimo azzeramento (QZ.control()).
  async function fetchAll(fase) {
    if (!TABLE) return [];
    const q = '?select=created_at,fase,anon_id,frequenza,strumenti,usi,futuro,paure,opportunita,parola&evento=eq.' + encodeURIComponent(EVENTO) +
      '&order=created_at.asc&limit=20000';
    const r = await fetch(TABLE + q, { headers: HEADERS, cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const all = await r.json(), next = { hidden: new Set(), shown: new Set(), resetAt: null };
    all.forEach(row => {                                   // in ordine di tempo: l'ultima scelta vince
      if (row.fase === 'reset') next.resetAt = row.created_at;
      else if (row.fase === 'hide' || row.fase === 'show') {
        const w = wordKey(row.parola); if (!w) return;
        (row.fase === 'hide' ? next.hidden : next.shown).add(w); (row.fase === 'hide' ? next.shown : next.hidden).delete(w);
      }
    });
    ctl = next;
    const from = next.resetAt ? Date.parse(next.resetAt) : 0;
    return all.filter(row => (row.fase === 'pre' || row.fase === 'post') && (!fase || row.fase === fase) && Date.parse(row.created_at) > from);
  }

  // Comandi della console
  function control(fase, parola) { return insert({ fase, parola: parola || null }); }
  const resetResults = () => control('reset');
  const setWord = (w, visible) => control(visible ? 'show' : 'hide', wordKey(w));

  // Conteggi per ogni domanda: { n, frequenza:{mai:3,…}, …, futuroMedia, parole:[[parola, n]] }
  function aggregate(rows) {
    const out = { n: rows.length, futuroMedia: 0, futuroN: 0, parole: [], paroleTutte: [] };
    Object.keys(Q).forEach(k => { if (Q[k].opts) { out[k] = {}; Q[k].opts.forEach(o => out[k][o[0]] = 0); } });
    const words = new Map();
    rows.forEach(row => {
      if (row.frequenza in out.frequenza) out.frequenza[row.frequenza]++;
      ['strumenti', 'usi', 'paure', 'opportunita'].forEach(k => (row[k] || []).forEach(v => { if (v in out[k]) out[k][v]++; }));
      if (row.futuro >= 1 && row.futuro <= 5) { out.futuro[row.futuro]++; out.futuroMedia += row.futuro; out.futuroN++; }
      const w = wordKey(row.parola);
      if (w) words.set(w, (words.get(w) || 0) + 1);
    });
    if (out.futuroN) out.futuroMedia /= out.futuroN;
    out.paroleTutte = [...words.entries()].sort((a, b) => b[1] - a[1]).map(([w, c]) => [w, c, wordStatus(w)]);
    out.parole = out.paroleTutte.filter(x => x[2] === 'ok' || x[2] === 'shown').map(x => [x[0], x[1]]);
    return out;
  }

  // Dati finti per provare le grafiche senza toccare il database (?demo=1)
  function demoRows(n, fase) {
    const post = fase === 'post';
    const pick = (opts, w) => { let r = Math.random() * w.reduce((a, b) => a + b), i = 0; while ((r -= w[i]) > 0) i++; return opts[i][0]; };
    const some = (opts, w, max) => { const s = new Set(); const k = 1 + Math.floor(Math.random() * max); for (let i = 0; i < k * 2 && s.size < k; i++) s.add(pick(opts, w)); return [...s]; };
    const words = ['opportunità', 'paura', 'futuro', 'rivoluzione', 'curiosità', 'potere', 'aiuto', 'incognita', 'speranza', 'controllo', 'magia', 'lavoro'];
    return Array.from({ length: n }, () => ({
      frequenza: pick(Q.frequenza.opts, [1, 3, 5, 6, 2]),
      strumenti: some(Q.strumenti.opts, [9, 5, 3, 2, 4, 1, 1, 1, 1], 3),
      usi: some(Q.usi.opts, [9, 6, 6, 4, 4, 3, 2, 2, 3], 4),
      fase: post ? 'post' : 'pre',
      futuro: +pick(Q.futuro.opts, post ? [0.5, 2, 3, 6, 3.5] : [1, 3, 4, 5, 2]),
      paure: some(Q.paure.opts, post ? [4, 8, 6, 8, 7, 3, 2, 0.5] : [6, 7, 5, 5, 6, 2, 3, 1], 3),
      opportunita: some(Q.opportunita.opts, post ? [9, 7, 9, 5, 4, 4, 4, 0.3] : [9, 6, 7, 5, 3, 3, 3, 1], 3),
      parola: Math.random() < 0.7 ? words[Math.floor(Math.random() * Math.random() * words.length)] : '',
      created_at: new Date().toISOString()
    }));
  }

  return { Q, icon, CHECK, EVENTO, SERATA, FASE, insert, resetResults, setWord, isBad, wordKey, ctl: () => ctl, fetchAll, aggregate, demoRows, online: !!TABLE };
})();
