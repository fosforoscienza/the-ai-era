// ════════════════════════════════════════════════════
// Rete neurale a strati per gli sfondi delle slide SNS: segnali che entrano
// da sinistra, accendono i neuroni e si propagano strato dopo strato.
// Uso: startNeuralNet(document.getElementById('sky'))
//      startNeuralNet(cv, { hot: [255, 64, 88] })  → neuroni accesi di quel colore
// ════════════════════════════════════════════════════
function startNeuralNet(cv, opts) {
  const COLD = [143, 210, 255];                       // anello a riposo
  const HOT = (opts && opts.hot) || null;             // colore dei neuroni accesi (default: azzurro)
  const haloRGB = (HOT || [65, 183, 255]).join(',');
  const ring = k => HOT ? COLD.map((c, i) => Math.round(c + (HOT[i] - c) * k)).join(',') : COLD.join(',');
  const ctx = cv.getContext('2d');
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COUNTS = [5, 8, 11, 13, 11, 8, 5];          // neuroni per strato
  let W, H, layers = [], edges = [], pulses = [], lastWave = -1e9;

  function init() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const x0 = W * 0.05, x1 = W * 0.95, top = H * 0.08, bot = H * 0.92;
    layers = COUNTS.map((n, li) => {
      const x = x0 + (x1 - x0) * li / (COUNTS.length - 1);
      const span = (bot - top) * (0.45 + 0.55 * n / Math.max(...COUNTS));
      return Array.from({ length: n }, (_, k) => ({
        x: x + (Math.random() - 0.5) * W * 0.02,
        y: H / 2 - span / 2 + span * (n === 1 ? 0.5 : k / (n - 1)),
        ph: Math.random() * 6.283, act: 0, li
      }));
    });
    edges = [];
    for (let li = 0; li < layers.length - 1; li++)
      for (const a of layers[li]) for (const b of layers[li + 1])
        edges.push({ a, b, w: Math.random() });
    pulses = [];
  }

  function fire(from, t) {
    const next = layers[from.li + 1];
    if (!next) return;
    const k = 1 + (Math.random() * 2.4 | 0);          // ogni neurone ne eccita 1–3
    for (let i = 0; i < k; i++) pulses.push({ a: from, b: next[Math.random() * next.length | 0], p: 0, v: 0.018 + Math.random() * 0.008 });
  }

  function pos(n, t) { return [n.x, n.y + Math.sin(t * 0.0005 + n.ph) * 5]; }

  function frame(t) {
    ctx.clearRect(0, 0, W, H);
    // un'onda di ingresso ogni ~0,8 s
    if (t - lastWave > 800 && pulses.length < 160) {
      lastWave = t;
      const inp = layers[0];
      for (let i = 0; i < 2; i++) { const n = inp[Math.random() * inp.length | 0]; n.act = 1; fire(n, t); }
    }
    // collegamenti: tenui, più chiari dove passa un segnale
    ctx.lineWidth = 1;
    for (const e of edges) {
      const [ax, ay] = pos(e.a, t), [bx, by] = pos(e.b, t);
      const glow = Math.max(e.a.act, e.b.act) * 0.18;
      ctx.strokeStyle = `rgba(65,183,255,${0.06 + e.w * 0.08 + glow})`;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    }
    // segnali in viaggio
    for (const pl of pulses) {
      pl.p += pl.v;
      const [ax, ay] = pos(pl.a, t), [bx, by] = pos(pl.b, t);
      const x = ax + (bx - ax) * pl.p, y = ay + (by - ay) * pl.p;
      ctx.strokeStyle = 'rgba(143,210,255,0.55)'; ctx.lineWidth = 1.6;
      const q = Math.max(0, pl.p - 0.12);
      ctx.beginPath(); ctx.moveTo(ax + (bx - ax) * q, ay + (by - ay) * q); ctx.lineTo(x, y); ctx.stroke();
      const g = ctx.createRadialGradient(x, y, 0, x, y, 9);
      g.addColorStop(0, 'rgba(143,210,255,0.95)'); g.addColorStop(1, 'rgba(65,183,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 9, 0, 6.283); ctx.fill();
      if (pl.p >= 1) { pl.b.act = 1; if (Math.random() < 0.8) fire(pl.b, t); }
    }
    pulses = pulses.filter(pl => pl.p < 1);
    // neuroni: si accendono quando arriva un segnale e si spengono piano
    for (const L of layers) for (const n of L) {
      const [x, y] = pos(n, t);
      if (n.act > 0.02) {
        const r = 6 + n.act * 16;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(${haloRGB},${(HOT ? 0.7 : 0.55) * n.act})`); g.addColorStop(1, `rgba(${haloRGB},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
      }
      ctx.fillStyle = '#02040b'; ctx.beginPath(); ctx.arc(x, y, 5, 0, 6.283); ctx.fill();
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = `rgba(${ring(Math.min(1, n.act * 1.5))},${0.6 + n.act * 0.4})`;
      ctx.beginPath(); ctx.arc(x, y, 5, 0, 6.283); ctx.stroke();
      if (n.act > 0.05) { ctx.fillStyle = HOT ? `rgba(255,220,224,${n.act})` : `rgba(255,255,255,${n.act})`; ctx.beginPath(); ctx.arc(x, y, 2, 0, 6.283); ctx.fill(); }
      n.act *= 0.965;
    }
    if (!still) requestAnimationFrame(frame);
  }

  init();
  window.addEventListener('resize', init);
  requestAnimationFrame(frame);
}
