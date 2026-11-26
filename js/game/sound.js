/* Jogo — sons. Por enquanto, só os passos: leves, curtinhos, um em cada pisada da animação de andar,
   com um som para cada chão (grama, terra, pedra, areia e madeira). Tudo é sintetizado na hora com a
   Web Audio API (ruído filtrado e um toque grave), sem arquivos de áudio: funciona também abrindo o
   index.html direto do disco. O áudio só liga depois do primeiro toque ou tecla (regra dos navegadores).
   O volume fica salvo neste navegador (chave SOUND_KEY), separado da partida. O sorteio de cada passo usa
   um gerador próprio, sem gastar o Math.random do jogo.
   Parte de js/game/: script comum, carregado em ordem pelo index.html (as declarações de nível superior valem
   para todos os arquivos, sem cópias; não é módulo). */

/* =====================================================
   SOM
   ===================================================== */
const SOUND_KEY = 'trilha-som';
const SOUND = { vol: 0.6, step: 0.45 };                                     // volume geral (0 a 1) e dos passos em relação a ele
try { const v = Number(JSON.parse(store.get(SOUND_KEY) || '{}').vol); if (v >= 0 && v <= 1) SOUND.vol = v; } catch { /* sem preferência salva */ }
let actx = null, amaster = null, anoise = null, stepFrame = 0, stepSide = 0;
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

/* Um estalo de ruído filtrado: começa em t0, sobe em 3 ms e some em dur segundos. */
function noiseHit(t0, { type = 'bandpass', f, q = 1, dur, gain, f2 }) {
  const src = actx.createBufferSource(); src.buffer = anoise;
  const flt = actx.createBiquadFilter(); flt.type = type; flt.frequency.setValueAtTime(f, t0); flt.Q.value = q;
  if (f2) flt.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
  const g = actx.createGain(); g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(flt); flt.connect(g); g.connect(amaster);
  src.start(t0, srnd() * 0.4, dur + 0.02);
}
/* Um "toc" grave (seno que cai de tom), para o peso do pé na madeira e na terra. */
function toneHit(t0, { f, f2, dur, gain, type = 'sine' }) {
  const o = actx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t0); o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
  const g = actx.createGain(); g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(amaster); o.start(t0); o.stop(t0 + dur + 0.02);
}
/* Receitas de cada chão. p = variação de tom do passo (0,9 a 1,1), v = volume do passo. */
const STEP_SOUND = {
  grama(t, p, v) { noiseHit(t, { f: 2600 * p, q: 0.9, dur: 0.07, gain: 0.5 * v }); noiseHit(t + 0.018, { type: 'highpass', f: 3800 * p, dur: 0.05, gain: 0.22 * v }); },
  terra(t, p, v) { noiseHit(t, { type: 'lowpass', f: 900 * p, f2: 300, q: 0.7, dur: 0.08, gain: 0.75 * v }); toneHit(t, { f: 120 * p, f2: 60, dur: 0.06, gain: 0.25 * v }); },
  pedra(t, p, v) { noiseHit(t, { f: 1700 * p, q: 2.5, dur: 0.04, gain: 1.1 * v }); toneHit(t, { f: 520 * p, f2: 380, dur: 0.03, gain: 0.14 * v, type: 'triangle' }); },
  areia(t, p, v) { noiseHit(t, { f: 4200 * p, f2: 2400, q: 0.6, dur: 0.11, gain: 0.4 * v }); },
  madeira(t, p, v) { toneHit(t, { f: 210 * p, f2: 120, dur: 0.07, gain: 0.36 * v, type: 'triangle' }); noiseHit(t, { type: 'lowpass', f: 1400 * p, q: 0.8, dur: 0.045, gain: 0.35 * v }); },
};
function playStep(kind) {
  if (!audioOn()) return;
  stepSide ^= 1;                                                               // pé direito e esquerdo soam um pouquinho diferentes
  const p = (stepSide ? 1.04 : 0.96) * (0.95 + srnd() * 0.1), v = SOUND.step * (0.85 + srnd() * 0.3);
  (STEP_SOUND[kind] || STEP_SOUND.grama)(actx.currentTime + 0.005, p, v);
}
/* Chamado a cada quadro: toca quando o pé encosta no chão (quadros 1 e 2 da caminhada). */
function stepSounds(t) {
  const f = P.moving ? Sprites.walk(t) : 0;
  if (f && f !== stepFrame) playStep(World.surface(map, P.x, P.y));
  stepFrame = f;
}
