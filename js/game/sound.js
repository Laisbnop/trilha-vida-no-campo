/* Jogo — sons. Por enquanto, os golpes de quebrar coisas: machado na madeira (árvores, tocos e galhos),
   picareta na pedra (pedras e rochas) e foice no mato. Cada golpe tem um som curto e o último, que quebra,
   tem um som maior (a madeira racha, a pedra esfarela, o mato farfalha).
   Tudo é sintetizado na hora com a Web Audio API (ruído filtrado e tons), sem arquivos de áudio: funciona também
   abrindo o index.html direto do disco. O áudio só liga depois do primeiro toque ou tecla (regra dos navegadores).
   O volume fica salvo neste navegador (chave SOUND_KEY), separado da partida. As variações de cada som usam um
   gerador próprio, sem gastar o Math.random do jogo.
   Parte de js/game/: script comum, carregado em ordem pelo index.html (as declarações de nível superior valem
   para todos os arquivos, sem cópias; não é módulo). */

/* =====================================================
   SOM
   ===================================================== */
const SOUND_KEY = 'trilha-som';
const SOUND = { vol: 0.6, fx: 0.5 };                                        // volume geral (0 a 1) e dos golpes em relação a ele
try { const v = Number(JSON.parse(store.get(SOUND_KEY) || '{}').vol); if (v >= 0 && v <= 1) SOUND.vol = v; } catch { /* sem preferência salva */ }
let actx = null, amaster = null, anoise = null;
let sseed = 0x2f6e2b1;
const srnd = () => (sseed = (sseed * 1664525 + 1013904223) >>> 0) / 4294967296;

function audioInit() {
  if (actx) { if (actx.state === 'suspended') actx.resume().catch(() => {}); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  try { actx = new AC(); } catch { actx = null; return; }
  amaster = actx.createGain(); amaster.gain.value = SOUND.vol; amaster.connect(actx.destination);
  const n = Math.floor(actx.sampleRate * 0.5); anoise = actx.createBuffer(1, n, actx.sampleRate);   // meio segundo de ruído, reaproveitado
  const d = anoise.getChannelData(0); for (let i = 0; i < n; i++) d[i] = srnd() * 2 - 1;
}
['pointerdown', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, audioInit, { capture: true, passive: true }));

function setVolume(v) {
  SOUND.vol = Math.max(0, Math.min(1, v));
  if (amaster) amaster.gain.setTargetAtTime(SOUND.vol, actx.currentTime, 0.02);
  store.set(SOUND_KEY, JSON.stringify({ vol: SOUND.vol }));
}
const audioOn = () => !!actx && actx.state === 'running' && SOUND.vol > 0;

/* Um estalo de ruído filtrado: começa em t0, sobe em 3 ms e some em dur segundos (f2: o filtro desliza até f2). */
function noiseHit(t0, { type = 'bandpass', f, q = 1, dur, gain, f2 }) {
  const src = actx.createBufferSource(); src.buffer = anoise;
  const flt = actx.createBiquadFilter(); flt.type = type; flt.frequency.setValueAtTime(f, t0); flt.Q.value = q;
  if (f2) flt.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
  const g = actx.createGain(); g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(flt); flt.connect(g); g.connect(amaster);
  src.start(t0, srnd() * 0.4, dur + 0.02);
}
/* Um tom curto que cai de f para f2 (o corpo do golpe, ou o "tim" do metal na pedra). */
function toneHit(t0, { f, f2 = f, dur, gain, type = 'sine' }) {
  const o = actx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t0); o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
  const g = actx.createGain(); g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(amaster); o.start(t0); o.stop(t0 + dur + 0.02);
}
/* Receitas: hit = cada golpe; brk = o golpe que quebra (toca junto com o hit). p = variação de tom (≈0,93 a 1,07), v = volume. */
const BREAK_SOUND = {
  wood: {                                                                  // machado: "toc" oco de lâmina na madeira
    hit(t, p, v) { toneHit(t, { f: 190 * p, f2: 95, dur: 0.1, gain: 0.55 * v, type: 'triangle' }); noiseHit(t, { f: 950 * p, q: 1.3, dur: 0.07, gain: 0.7 * v }); noiseHit(t, { type: 'highpass', f: 3200, dur: 0.015, gain: 0.3 * v }); },
    brk(t, p, v) {                                                          // a madeira racha: estalos secos em seguida e um baque
      [0.05, 0.09, 0.12, 0.17, 0.21].forEach((d, i) => noiseHit(t + d, { f: (1300 - i * 120) * p * (0.9 + srnd() * 0.2), q: 2, dur: 0.035, gain: (0.6 - i * 0.08) * v }));
      toneHit(t + 0.2, { f: 95 * p, f2: 45, dur: 0.22, gain: 0.5 * v }); noiseHit(t + 0.2, { type: 'lowpass', f: 500, dur: 0.2, gain: 0.45 * v });
    },
  },
  stone: {                                                                 // picareta: "tim" metálico com raspa de pedra
    hit(t, p, v) { toneHit(t, { f: 1850 * p, f2: 1800 * p, dur: 0.14, gain: 0.22 * v }); toneHit(t, { f: 2780 * p, f2: 2700 * p, dur: 0.08, gain: 0.08 * v }); noiseHit(t, { f: 2400 * p, q: 1.6, dur: 0.04, gain: 1.0 * v }); noiseHit(t, { type: 'lowpass', f: 700, dur: 0.05, gain: 0.3 * v }); },
    brk(t, p, v) {                                                          // a pedra esfarela: pedrinhas caindo e um estrondo abafado
      for (let i = 0; i < 8; i++) noiseHit(t + 0.04 + i * 0.028 + srnd() * 0.02, { f: 1200 + srnd() * 2200, q: 3, dur: 0.025, gain: (0.65 - i * 0.05) * v });
      noiseHit(t + 0.03, { type: 'lowpass', f: 650, f2: 220, dur: 0.26, gain: 0.6 * v }); toneHit(t + 0.03, { f: 80, f2: 40, dur: 0.18, gain: 0.35 * v });
    },
  },
  leaf: {                                                                  // foice: "vush" da lâmina cortando o mato
    hit(t, p, v) { noiseHit(t, { f: 1600 * p, f2: 5200 * p, q: 1.2, dur: 0.13, gain: 0.9 * v }); noiseHit(t + 0.05, { type: 'highpass', f: 5500, dur: 0.07, gain: 0.4 * v }); },
    brk(t, p, v) { [0.07, 0.11, 0.16].forEach((d, i) => noiseHit(t + d, { f: (3200 + srnd() * 1500) * p, q: 0.8, dur: 0.06, gain: (0.5 - i * 0.1) * v })); },   // folhinhas caindo
  },
};
/* Toca o som de um golpe (fx do RESIST: 'wood', 'stone' ou 'leaf'); last = o golpe que quebra. */
function playBreak(fx, last) {
  const S0 = BREAK_SOUND[fx]; if (!S0 || !audioOn()) return;
  const t = actx.currentTime + 0.005, p = 0.93 + srnd() * 0.14, v = SOUND.fx * (0.9 + srnd() * 0.2);
  S0.hit(t, p, v); if (last) S0.brk(t, p, v);
}
