// Questionario «Conosciamoci meglio»: domande, invio e lettura delle risposte.
// Le risposte (anonime) stanno nella tabella public.sns_questionario del
// Supabase sul Mac mini: chi ha il link può inserire e leggere, non modificare.
// Serve js/sns-config.js (window.SNS_CONFIG) caricato prima di questo file.
// ?e=<evento> separa le serate (e i test: usare ?e=test-…); il default è «sns».
// Fase: «pre» a inizio show (parte 1 + 2), «post» alla fine (solo parte 2, per
// misurare l'impatto): ?fase=post oppure l'indirizzo /dopo.
// anon_id è un codice casuale del telefono: lega prima e dopo, senza dati personali.
const QZ = (function () {
  const CFG = window.SNS_CONFIG || {};
  const P = new URLSearchParams(location.search);
  const EVENTO = (P.get('e') || 'sns').slice(0, 64);
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

  // fase: 'pre', 'post' oppure nulla per tutte e due
  async function fetchAll(fase) {
    if (!TABLE) return [];
    const q = '?select=fase,anon_id,frequenza,strumenti,usi,futuro,paure,opportunita,parola&evento=eq.' + encodeURIComponent(EVENTO) +
      (fase ? '&fase=eq.' + fase : '') + '&order=created_at.asc&limit=10000';
    const r = await fetch(TABLE + q, { headers: HEADERS, cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }

  // Conteggi per ogni domanda: { n, frequenza:{mai:3,…}, …, futuroMedia, parole:[[parola, n]] }
  function aggregate(rows) {
    const out = { n: rows.length, futuroMedia: 0, futuroN: 0, parole: [] };
    Object.keys(Q).forEach(k => { if (Q[k].opts) { out[k] = {}; Q[k].opts.forEach(o => out[k][o[0]] = 0); } });
    const words = new Map();
    rows.forEach(row => {
      if (row.frequenza in out.frequenza) out.frequenza[row.frequenza]++;
      ['strumenti', 'usi', 'paure', 'opportunita'].forEach(k => (row[k] || []).forEach(v => { if (v in out[k]) out[k][v]++; }));
      if (row.futuro >= 1 && row.futuro <= 5) { out.futuro[row.futuro]++; out.futuroMedia += row.futuro; out.futuroN++; }
      const w = (row.parola || '').trim().toLowerCase().replace(/[.!?,;:"«»]+/g, '').replace(/\s+/g, ' ');
      if (w) { const key = w.slice(0, 40); words.set(key, (words.get(key) || 0) + 1); }
    });
    if (out.futuroN) out.futuroMedia /= out.futuroN;
    out.parole = [...words.entries()].sort((a, b) => b[1] - a[1]);
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
      parola: Math.random() < 0.7 ? words[Math.floor(Math.random() * Math.random() * words.length)] : ''
    }));
  }

  return { Q, EVENTO, FASE, insert, fetchAll, aggregate, demoRows, online: !!TABLE };
})();
