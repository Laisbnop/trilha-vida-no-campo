/* Núcleo do minijogo de pesca: sem desenho e sem tela, só movimento e progresso.
   Tudo é calculado pelo tempo decorrido (em passos fixos de 10 ms), então a velocidade é a
   mesma em qualquer taxa de quadros. Posições são proporções da pista (0 a 1).

   create(opts) → rodada nova. opts: { behavior, zoneW, cfg (FISHING), rnd }
   step(r, ms, hold) → avança; hold = comando pressionado (mouse ou Espaço).
   Campos úteis: r.x (centro do peixe), r.v, r.zone (borda esquerda), r.w, r.prog (0..100),
   r.inside, r.perfect, r.done ('catch' | 'flee' | null), r.dir (-1/1, para onde o peixe olha). */
const FishCore = (() => {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const span = (rnd, [a, b]) => a + (b - a) * rnd();

  function create({ behavior, zoneW, cfg, rnd = Math.random }) {
    const B = cfg.behaviors[behavior] || cfg.behaviors.tranquilo;
    const T = cfg.track, x = T.fishMin + 0.04 + rnd() * 0.12;   // abertura justa: peixe parado, zona centrada nele
    const r = {
      B, cfg, rnd, w: zoneW, x, v: 0, dir: 1, zone: clamp(x - zoneW / 2, 0, 1 - zoneW), u: 0,
      prog: cfg.progress.start, t: 0, perfect: true, inside: true, done: null,
      armed: false, hold: false,                          // até armar, a zona fica parada
      target: x, vmax: 0, pause: 0.9, turnAt: -1, segT: 0,
    };
    return r;
  }
  /* Próximo trecho de nado: alvo, velocidade e, às vezes, uma virada no meio do caminho. */
  function nextSegment(r) {
    const B = r.B, rnd = r.rnd;
    let d = span(rnd, B.dist) * (rnd() < 0.5 ? -1 : 1);
    const T = r.cfg.track;
    if (r.x + d < T.fishMin + 0.02 || r.x + d > T.fishMax - 0.02) d = -d;   // perto da borda, volta para o meio
    r.target = clamp(r.x + d, T.fishMin, T.fishMax);
    const dash = rnd() < B.dash;
    r.vmax = span(rnd, B.speed) * (dash ? 1.35 : 1);
    r.acc = B.accel * (dash ? 1.6 : 1);
    r.segT = 0; r.turnAt = rnd() < B.turn ? 0.25 + rnd() * 0.5 : -1;
  }
  function stepFish(r, s) {
    if (r.pause > 0) {                                   // pausa: desacelera até parar
      r.pause -= s; r.v *= Math.exp(-7 * s); r.x = clamp(r.x + r.v * s, r.cfg.track.fishMin, r.cfg.track.fishMax);
      if (r.pause <= 0) nextSegment(r);
      return;
    }
    r.segT += s;
    if (r.turnAt > 0 && r.segT >= r.turnAt) { r.turnAt = -1; const d = span(r.rnd, r.B.dist) * 0.8 * -Math.sign(r.target - r.x || 1); r.target = clamp(r.x + d, r.cfg.track.fishMin, r.cfg.track.fishMax); }
    const dx = r.target - r.x, acc = r.acc || r.B.accel;
    const want = Math.sign(dx) * Math.min(r.vmax, Math.sqrt(2 * acc * Math.abs(dx)));   // chega devagar, sem frear de repente
    r.v += clamp(want - r.v, -acc * s, acc * s);
    r.x += r.v * s;
    const T = r.cfg.track;
    if (r.x < T.fishMin || r.x > T.fishMax) { r.x = clamp(r.x, T.fishMin, T.fishMax); r.v = 0; r.target = r.x; }
    if (Math.abs(r.target - r.x) < 0.004 && Math.abs(r.v) < 0.03) {
      if (r.rnd() < r.B.pauseChance) r.pause = span(r.rnd, r.B.pause); else nextSegment(r);
    }
    if (Math.abs(r.v) > 0.015) r.dir = r.v > 0 ? 1 : -1;
  }
  function stepZone(r, s, hold) {
    const C = r.cfg.control;
    if (hold) r.u += (r.u < 0 ? C.accel * C.reverse : C.accel) * s;        // virar para a direita responde mais rápido
    else r.u -= (r.u > 0 ? C.back * C.reverse : C.back) * s;
    r.u = clamp(r.u, -C.maxSpeed, C.maxSpeed);
    r.zone += r.u * s;
    const max = 1 - r.w;
    if (r.zone <= 0) { r.zone = 0; if (r.u < 0) r.u = 0; }                 // nas pontas: para, sem rebote
    if (r.zone >= max) { r.zone = max; if (r.u > 0) r.u = 0; }
  }
  function step(r, ms, hold) {
    if (r.done) return r;
    if (!hold || r.t >= r.cfg.control.settle) r.armed = true;           // o clique que fisgou não empurra a zona: ela espera soltar (ou um instante)
    r.hold = !!hold;
    const P = r.cfg.progress;
    r.bank = (r.bank || 0) + ms;                         // passos fixos de 10 ms: o mesmo resultado em qualquer taxa de quadros
    while (r.bank >= 10) {
      r.bank -= 10; const s = 0.01;
      r.t += 10;
      stepFish(r, s); if (r.armed) stepZone(r, s, r.hold);
      r.inside = r.x >= r.zone && r.x <= r.zone + r.w;
      const grace = r.t <= P.grace;
      if (!r.inside) r.perfect = false;                                    // perfeito: o peixe dentro da faixa verde durante todo o minijogo
      r.prog = clamp(r.prog + (r.inside ? P.gain * s : grace ? 0 : -P.loss * s), 0, 100);
      if (r.prog >= 100) { r.done = 'catch'; break; }
      if (r.prog <= 0) { r.done = 'flee'; break; }
    }
    return r;
  }
  return { create, step };
})();
if (typeof module !== 'undefined') module.exports = FishCore;
