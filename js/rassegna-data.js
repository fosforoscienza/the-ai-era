// ════════════════════════════════════════════════════
// Dati delle slide «rassegna stampa» (rassegna.html?id=...).
// items: ritagli di articoli veri ({ paper, date, headline }) o prime pagine
// vere ({ img, paper, date, w, box:[x,y,w,h] in % dell'immagine, at }).
// Titoli e date verificati il 6 novembre 2026.
// ════════════════════════════════════════════════════
const RASSEGNA = {
  // La notizia AI n. 1 (6 set – 6 nov 2026)
  navier: {
    rank: 1,
    it: {
      kicker: 'La notizia AI più importante', title: 'Un’AI attacca un Problema del Millennio', date: '8 – 9 settembre 2026',
      lead: 'Un modello interno di OpenAI produce una dimostrazione sulle <b>equazioni di Navier–Stokes</b>: un fluido può sviluppare una singolarità in tempo finito. È pubblicata e verificabile in Lean, ma i matematici la stanno ancora controllando.',
      facts: [['10.000', 'agenti AI al lavoro'], ['88 ore', 'di calcolo'], ['$1M', 'premio non rivendicato']],
      note: 'Titoli originali · Il Post, AGI, Il Fatto Quotidiano, Quanta Magazine, CNBC, NPR'
    },
    en: {
      kicker: 'The most important AI story', title: 'An AI takes on a Millennium Problem', date: 'September 8 – 9, 2026',
      lead: 'An internal OpenAI model produces a proof on the <b>Navier–Stokes equations</b>: a fluid can develop a singularity in finite time. It is published and checkable in Lean, but mathematicians are still checking it.',
      facts: [['10,000', 'AI agents at work'], ['88 hours', 'of compute'], ['$1M', 'prize not claimed']],
      note: 'Original headlines · Il Post, AGI, Il Fatto Quotidiano, Quanta Magazine, CNBC, NPR'
    },
    items: [
      { paper: 'Quanta Magazine', date: '8 settembre 2026', headline: 'AI Has Solved One of Math’s $1 Million Millennium Prize Problems' },
      { paper: 'Il Post', date: '9 settembre 2026', headline: 'OpenAI dice di aver risolto uno dei Problemi del millennio' },
      { paper: 'CNBC', date: '9 settembre 2026', headline: 'OpenAI claims to have solved the 90-year-old Navier-Stokes math problem in 88 hours' },
      { paper: 'Il Fatto Quotidiano', date: '9 settembre 2026', headline: 'OpenAI risolve Navier-Stokes, ma le scoperte fatte prima da due matematici sono probabilmente l’input' },
      { paper: 'AGI', date: '9 settembre 2026', headline: 'OpenAI dice di aver risolto un problema matematico da un milione' },
      { paper: 'NPR', date: '22 settembre 2026', headline: 'AI solved one of math’s hardest problems. Humanity learned nothing (so far)' }
    ]
  },

  // La notizia AI n. 3
  anthropic: {
    rank: 3,
    it: {
      kicker: 'Notizia AI n. 3 · rassegna stampa', title: 'Anthropic verso la Borsa', date: '29 settembre 2026',
      lead: 'Nel prospetto per la quotazione, un terzo delle pagine è dedicato ai rischi: l’AI avanzata potrebbe rappresentare un <b>«rischio catastrofico o esistenziale per l’umanità»</b>, e i modelli potrebbero perfino resistere allo spegnimento.',
      facts: [['2.000 mld $', 'la valutazione cercata'], ['80 / 261', 'pagine sui rischi'], ['16 nov.', 'debutto atteso al Nasdaq']],
      note: 'Titoli originali · Il Sole 24 Ore (3 novembre, prima pagina), CNBC (Reuters), Sky TG24, Open, Money.it, Avvenire'
    },
    en: {
      kicker: 'AI story no. 3 · press review', title: 'Anthropic heads to Wall Street', date: 'September 29, 2026',
      lead: 'A third of its IPO prospectus is about risks: advanced AI could pose a <b>“catastrophic or existential risk to humanity”</b>, and models might even resist being shut down.',
      facts: [['$2 trillion', 'target valuation'], ['80 / 261', 'pages on risks'], ['Nov 16', 'expected Nasdaq debut']],
      note: 'Original headlines · CNBC (Reuters), Sky TG24, Open, Money.it, Avvenire'
    },
    clipW: 'min(27vw, 470px)', clipX: [2, 9],
    items: [
      { img: 'img/rassegna/2026-11-03-il-sole-24-ore.webp', paper: 'Il Sole 24 Ore', date: '3 novembre 2026', w: 21, at: { x: 54, y: 7, r: 3 }, box: [84, 49.5, 15.5, 8] },
      { paper: 'CNBC', date: '29 settembre 2026', headline: 'Anthropic warns of AI’s ‘existential risk to humanity’ in IPO filing' },
      { paper: 'Sky TG24', date: '29 settembre 2026', headline: 'Anthropic avverte investitori: «L’IA può comportare rischi per l’umanità»' },
      { paper: 'Open', date: '29 settembre 2026', headline: 'Anthropic prepara la quotazione ma nel dossier spuntano 80 pagine sui rischi che l’AI può causare all’umanità' },
      { paper: 'Money.it', date: 'settembre 2026', headline: 'Anthropic, «con l’AI rischi catastrofici ed esistenziali per l’umanità». L’allarme (anche) nel prospetto dell’IPO' },
      { paper: 'Avvenire', date: 'autunno 2026', headline: 'Con Anthropic la Borsa si prepara alla grande scommessa sull’IA' }
    ]
  },

  frigo: {
    it: {
      kicker: 'Cybersicurezza · rassegna stampa', title: 'Frigoriferi hackerati', date: 'Ottobre – novembre 2026',
      lead: 'Attacchi ai sistemi che controllano i frigoriferi dei supermercati: prima in Francia, poi in Italia — <b>Sicilia, Toscana, Trentino</b> — e in mezza Europa. Celle spente, merce buttata. Lo rivendicano gruppi filorussi, con un video fatto con l’AI.',
      facts: [['~700', 'negozi colpiti in Francia a metà ottobre'], ['10', 'Paesi europei colpiti'], ['3', 'regioni italiane: Sicilia, Toscana, Trentino']],
      note: 'Prime pagine del 3 novembre 2026 · fonti: Il Post, ACN, Fortune Italia'
    },
    en: {
      kicker: 'Cybersecurity · press review', title: 'Hacked fridges', date: 'October – November 2026',
      lead: 'Attacks on the systems that run supermarket fridges: first in France, then Italy — <b>Sicily, Tuscany, Trentino</b> — and across Europe. Units switched off, food thrown away. Pro-Russian groups claim it, with an AI-made video.',
      facts: [['~700', 'stores hit in France in mid-October'], ['10', 'European countries hit'], ['3', 'Italian regions: Sicily, Tuscany, Trentino']],
      note: 'Italian front pages, November 3, 2026 · sources: Il Post, ACN, Fortune Italia'
    },
    // le prime pagine del 3 novembre 2026: la notizia apre o è in prima ovunque
    items: [
      { img: 'img/rassegna/2026-11-03-la-stampa.webp',          paper: 'La Stampa',          date: '3 novembre 2026', w: 15, at: { x: 66, y: 5,  r: 3 },  box: [0.5, 66, 15.5, 7] },
      { img: 'img/rassegna/2026-11-03-il-sole-24-ore.webp',     paper: 'Il Sole 24 Ore',     date: '3 novembre 2026', w: 15, at: { x: 50, y: 49, r: -2 }, box: [84, 24, 15.5, 14] },
      { img: 'img/rassegna/2026-11-03-il-messaggero.webp',      paper: 'Il Messaggero',      date: '3 novembre 2026', w: 15, at: { x: 34, y: 3,  r: -2 }, box: [62, 22.5, 37.5, 15] },
      { img: 'img/rassegna/2026-11-03-la-repubblica.webp',      paper: 'la Repubblica',      date: '3 novembre 2026', w: 15, at: { x: 17, y: 50, r: 2.5 }, box: [75, 31, 24.5, 11.5] },
      { img: 'img/rassegna/2026-11-03-corriere-della-sera.webp', paper: 'Corriere della Sera', date: '3 novembre 2026', w: 16, at: { x: 2,  y: 6,  r: -3 }, box: [16, 38.5, 68, 9.5] }
    ]
  },

  php: {
    it: {
      kicker: 'Cybersicurezza · rassegna stampa', title: 'PHP2Shell: la falla trovata dall’AI', date: '21 – 22 ottobre 2026',
      lead: 'Due vulnerabilità critiche nel linguaggio che fa girare <b>il 70% dei siti web</b>, scoperte con l’aiuto dell’intelligenza artificiale. Patch d’urgenza, l’Agenzia per la cybersicurezza parla di «gravità critica»: chi non aggiorna deve spegnere i siti.',
      facts: [['70%', 'dei siti usa PHP'], ['9,2 / 10', 'gravità delle falle'], ['21 ott.', 'patch d’urgenza']],
      note: 'Titoli originali · Corriere del Ticino (23 ottobre, prima pagina), Sky TG24, Il Fatto Quotidiano, Geopop, Fanpage, ICT Business'
    },
    en: {
      kicker: 'Cybersecurity · press review', title: 'PHP2Shell: the flaw found by AI', date: 'October 21 – 22, 2026',
      lead: 'Two critical vulnerabilities in the language that runs <b>70% of websites</b>, discovered with the help of artificial intelligence. Emergency patches; Italy’s cyber agency rates them “critical”: whoever can’t update should take sites offline.',
      facts: [['70%', 'of sites use PHP'], ['9.2 / 10', 'severity'], ['Oct 21', 'emergency patches']],
      note: 'Original headlines · Sky TG24, Il Fatto Quotidiano, Geopop, Fanpage, ICT Business, Linkiesta'
    },
    clipW: 'min(27vw, 470px)', clipX: [2, 9],
    items: [
      { img: 'img/rassegna/2026-10-23-corriere-del-ticino.webp', paper: 'Corriere del Ticino', date: '23 ottobre 2026', w: 21, at: { x: 54, y: 7, r: 3 }, box: [0, 78.5, 22, 21] },
      { paper: 'Sky TG24', date: '22 ottobre 2026', headline: 'Vulnerabilità Php, scoperte falle nella sicurezza: siti a rischio' },
      { paper: 'Il Fatto Quotidiano', date: '22 ottobre 2026', headline: 'Vulnerabilità PHP mette a rischio il 70% dei siti web: allerta globale' },
      { paper: 'Geopop', date: 'ottobre 2026', headline: 'Falla nel codice PHP, due vulnerabilità mettono a rischio il 70% dei siti Web: lo ha scoperto l’AI' },
      { paper: 'Fanpage', date: 'ottobre 2026', headline: 'Tempesta di attacchi informatici in tutto il mondo: IA svela falla critica nei siti in PHP e gli hacker ne approfittano' },
      { paper: 'ICT Business', date: 'ottobre 2026', headline: 'Vulnerabilità di Php scoperte con l’AI, tra le più gravi della storia del software' }
    ]
  }
};
