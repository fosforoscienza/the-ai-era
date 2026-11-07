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

  // [chiave salvata, etichetta, icona]
  const Q = {
    frequenza: {
      part: 1, type: 'one', title: 'Quanto spesso usi l’AI?',
      opts: [['mai', 'Mai', '🚫'], ['mese', 'Qualche volta al mese', '🌙'], ['settimana', 'Ogni settimana', '📅'],
             ['giorno', 'Ogni giorno', '☀️'], ['sempre', 'Non ne posso più fare a meno', '⚡']]
    },
    strumenti: {
      part: 1, type: 'many', title: 'Quali strumenti usi?', hint: 'Anche più di uno',
      opts: [['chatgpt', 'ChatGPT', '💬'], ['gemini', 'Gemini', '✨'], ['claude', 'Claude', '🟠'], ['copilot', 'Copilot', '🪁'],
             ['meta', 'Meta AI (WhatsApp)', '🟢'], ['perplexity', 'Perplexity', '🔭'], ['altro', 'Altro', '➕'], ['nessuno', 'Nessuno', '🙅']]
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
      strumenti: some(Q.strumenti.opts, [9, 5, 3, 2, 4, 1, 1, 1], 3),
      usi: some(Q.usi.opts, [9, 6, 6, 4, 4, 3, 2, 2, 3], 4),
      fase: post ? 'post' : 'pre',
      futuro: +pick(Q.futuro.opts, post ? [0.5, 2, 3, 6, 3.5] : [1, 3, 4, 5, 2]),
      paure: some(Q.paure.opts, post ? [4, 8, 6, 8, 7, 3, 2, 0.5] : [6, 7, 5, 5, 6, 2, 3, 1], 3),
      opportunita: some(Q.opportunita.opts, post ? [9, 7, 9, 5, 4, 4, 4, 0.3] : [9, 6, 7, 5, 3, 3, 3, 1], 3),
      parola: Math.random() < 0.7 ? words[Math.floor(Math.random() * Math.random() * words.length)] : '',
      created_at: new Date().toISOString()
    }));
  }

  return { Q, EVENTO, SERATA, FASE, insert, resetResults, setWord, isBad, wordKey, ctl: () => ctl, fetchAll, aggregate, demoRows, online: !!TABLE };
})();
