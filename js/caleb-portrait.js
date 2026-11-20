/* =====================================================================
   Retrato de Caleb (64x64), neto da Dona Celeste.
   Cabelo preto liso em camadas, franja longa varrida cobrindo o olho
   esquerdo (do nosso ponto de vista), mecha prateada discreta, brinco de
   argola, camiseta preta, camisa vinho aberta e corrente com pingente de
   mariposa. Expressões: neutro, sorriso (discreto), contente e
   envergonhado (surpreso, com as bochechas coradas). Só olho,
   sobrancelha, boca e rubor mudam entre elas.
   ===================================================================== */
(() => {
  const N = 64, LINE = '#1c1014';
  const hx = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mixc = (a, b, k) => { const A = hx(a), B = hx(b); return '#' + A.map((v, i) => Math.max(0, Math.min(255, Math.round(v + (B[i] - v) * k))).toString(16).padStart(2, '0')).join(''); };
  const ramp = b => [mixc(b, '#fff4ea', 0.36), mixc(b, '#fff0e0', 0.16), b, mixc(b, '#2a1018', 0.3), mixc(b, '#160810', 0.52)];
  const inPoly = (x, y, pts) => { let ins = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins; } return ins; };
  const poly = pts => { const m = new Set(); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (inPoly(x + 0.5, y + 0.5, pts)) m.add(y * N + x); return m; };
  const ell = (cx, cy, rx, ry) => { const m = new Set(); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) m.add(y * N + x); return m; };
  /* mecha: curva (bézier) da raiz à ponta, afinando */
  function lock(x0, y0, x1, y1, bend, w, tip = 0.5) {
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, len = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / len, ny = (x1 - x0) / len, cx = mx + nx * bend, cy = my + ny * bend, L = [], R = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t, px = a * x0 + b * cx + c * x1, py = a * y0 + b * cy + c * y1;
      const dx = 2 * (1 - t) * (cx - x0) + 2 * t * (x1 - cx), dy = 2 * (1 - t) * (cy - y0) + 2 * t * (y1 - cy), dl = Math.hypot(dx, dy) || 1, hw = tip / 2 + (w - tip) / 2 * Math.pow(1 - t, 0.85);
      L.push([px - dy / dl * hw, py + dx / dl * hw]); R.push([px + dy / dl * hw, py - dx / dl * hw]);
    }
    return poly([...L, ...R.reverse()]);
  }

  const SKIN = ramp('#e8a878');
  const HAIR = ['#5a4a52', '#3e3238', '#2c2228', '#1c1418', '#100a0c'];
  const SILVER = ['#f4f2f6', '#dcd8e0', '#b8b4c0', '#8e8a98', '#6a6672'];
  const WINE = ramp('#6e2432'), TEE = ['#3a3238', '#2a242a', '#1e1a20', '#141014', '#0c0a0c'];
  const IRIS = ['#9a9a5a', '#6e6e3c', '#3e3e22'], WHITE = '#f4ece4', PUP = '#140c0c';

  function make(e) {
    const px = new Array(N * N).fill(null);
    const set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && x < N && y >= 0 && y < N && c) px[y * N + x] = c; };
    const row = (y, a, b, c) => { for (let x = a; x <= b; x++) set(x, y, c); };
    const paint = (mask, R, tone = 0) => {
      const has = (x, y) => mask.has(y * N + x), T = i => R[Math.max(0, Math.min(R.length - 1, i + tone))];
      for (const k of mask) { const x = k % N, y = (k / N) | 0, ul = !has(x - 1, y) || !has(x, y - 1), dr = !has(x + 1, y) || !has(x, y + 1), dr2 = !has(x + 2, y + 1) || !has(x + 1, y + 2); set(x, y, dr ? T(3) : dr2 ? T(2) : ul ? T(0) : T(1)); }
    };
    /* 1) cabelo de trás: camadas lisas até o queixo, pontas desfiadas */
    paint(poly([[14, 22], [17, 12], [25, 6.5], [35, 5.5], [44, 9], [50, 17], [51.5, 30], [50, 42], [46, 47], [43, 40], [40, 46], [24, 46], [21, 40], [18, 47], [14.5, 41], [13, 32]]), HAIR, 1);
    [[19, 24, 13, 44, 2, 9, 2], [22, 34, 18, 48, 1, 7, 1.5], [46, 24, 52, 43, -2, 9, 2], [44, 34, 47, 48, -1, 7, 1.5],   // camadas laterais desfiadas
      [27, 10, 20, 5, 2, 9, 3], [41, 11, 48, 7, -2, 7, 2]].forEach(([a, b, c, d, bend, w, tip], i) => paint(lock(a, b, c, d, bend, w, tip), HAIR, i % 2 ? 1 : 2));
    /* 2) roupa: camisa vinho aberta sobre camiseta preta, colarinho e mangas */
    paint(poly([[6, 64], [9, 56], [18, 51.5], [26, 50], [38, 50], [46, 51.5], [55, 56], [58, 64]]), WINE, 1);
    paint(poly([[25, 51], [39, 51], [41, 64], [23, 64]]), TEE, 1);                                    // camiseta
    paint(poly([[24.5, 50], [29, 52], [26, 60], [21.5, 52.5]]), WINE, 0); paint(poly([[39.5, 50], [35, 52], [38, 60], [42.5, 52.5]]), WINE, 1);   // colarinho
    for (let y = 54; y < N; y++) { set(22.5 + (y - 54) * 0.05, y, WINE[4]); set(41.5 - (y - 54) * 0.05, y, WINE[4]); }   // borda da camisa aberta
    set(16, 60, '#c8c6d0'); set(16, 61, '#8e8a98');                                                 // botão
    /* 3) pescoço e rosto (maxilar mais fino, queixo marcado) */
    for (let y = 42; y <= 51; y++) { row(y, 27, 37, y < 46 ? SKIN[3] : SKIN[2]); set(37, y, SKIN[3]); }
    const face = poly([[20.5, 24], [22, 17], [31, 14.5], [41, 16], [43.5, 23], [43.5, 33], [41, 40], [36, 44.5], [32, 45.5], [28, 44.5], [23, 40], [20.5, 33]]);
    for (const k of face) {
      const x = k % N, y = (k / N) | 0; let c = SKIN[2];
      if (((x + 0.5 - 28) / 8) ** 2 + ((y + 0.5 - 27) / 10) ** 2 <= 1) c = SKIN[1];
      if (x >= 41 || (x >= 38 && y >= 38) || y >= 43) c = SKIN[3];
      set(x, y, c);
    }
    for (let y = 30; y <= 36; y++) { set(44, y, SKIN[3]); set(45, y, y > 31 && y < 35 ? SKIN[2] : SKIN[3]); }   // orelha
    set(45, 33, SKIN[4]);
    /* corrente com pingente de mariposa */
    for (let i = 0; i <= 8; i++) { set(27 + i * 0.6, 51 + i * 0.5, '#a8a6b2'); set(37 - i * 0.6, 51 + i * 0.5, '#a8a6b2'); }
    [[30, 56], [31, 55], [31, 56], [33, 55], [33, 56], [34, 56], [32, 56], [32, 57], [31, 57], [33, 57]].forEach(([x, y]) => set(x, y, '#d8d6e0'));
    set(30, 57, '#8e8a98'); set(34, 57, '#8e8a98'); set(32, 58, '#8e8a98'); set(32, 55, '#f4f2f6');
    /* 4) expressão: olho direito (visível), sobrancelha, boca e rubor */
    const blush = e === 'envergonhado' ? 0.42 : e === 'contente' ? 0.16 : 0;
    if (blush) [[24, 36], [25, 36], [26, 36], [37, 36], [38, 36], [39, 36], [38, 37]].forEach(([x, y]) => set(x, y, mixc(SKIN[2], '#e0607a', blush)));
    const LID = '#1a0e10', EX = 37;
    if (e === 'contente') {                                       // olho fechado, sorrindo
      set(EX - 3, 31, LID); set(EX - 2, 30, LID); set(EX - 1, 30, LID); set(EX, 30, LID); set(EX + 1, 30, LID); set(EX + 2, 31, LID); row(32, EX - 1, EX + 1, SKIN[1]);
    } else {
      const big = e === 'envergonhado', top = big ? 27 : 28;
      row(top, EX - 3, EX + 2, LID); set(EX + 3, top + 1, LID); set(EX - 4, top + 1, LID);
      const h = big ? 5 : 4;
      for (let y = top + 1; y < top + 1 + h; y++) row(y, EX - 3, EX + 2, WHITE);
      const iy = top + (big ? 2 : 1);
      for (let y = iy; y < iy + 3; y++) row(y, EX - 2, EX, y === iy ? IRIS[2] : IRIS[1]);
      set(EX - 1, iy + 1, PUP); set(EX - 1, iy + 2, IRIS[0]); set(EX - 2, iy, '#ffffff');
      if (!big) row(top + 1, EX - 3, EX + 2, mixc(LID, SKIN[2], 0.35));                            // pálpebra um pouco baixa: olhar calmo
      row(top + 1 + h, EX - 2, EX + 1, SKIN[3]);
    }
    const BR = '#1e1418', by = e === 'envergonhado' ? 23 : e === 'neutro' ? 25 : 24;
    for (let i = 0; i < 7; i++) set(EX - 4 + i, by + (i === 0 ? 1 : 0) + (e === 'neutro' && i >= 5 ? 1 : 0), BR); row(by + 1, EX - 3, EX + 1, mixc(BR, SKIN[2], 0.5));
    set(32, 36, SKIN[1]); set(31, 38, SKIN[3]); set(33, 38, SKIN[3]); set(32, 38, SKIN[2]); set(34, 37, SKIN[3]);   // nariz
    const ML = '#5a2a28', LIP = mixc(SKIN[2], '#a8605a', 0.16);
    if (e === 'sorriso') { row(41, 29, 34, ML); set(35, 40, ML); set(28, 41, mixc(ML, SKIN[2], 0.5)); row(42, 30, 33, LIP); }             // canto levantado de um lado só
    else if (e === 'contente') { row(40, 28, 36, ML); set(27, 39, ML); set(37, 39, ML); row(41, 29, 35, '#7a2a30'); row(41, 30, 34, '#f6eee8'); row(42, 30, 34, ML); }
    else if (e === 'envergonhado') { row(40, 31, 32, ML); set(30, 41, ML); set(33, 41, ML); row(41, 31, 32, '#6a2a2a'); row(42, 31, 32, ML); }
    else { row(41, 29, 35, ML); row(42, 30, 34, LIP); }
    /* 5) cabelo da frente: franja longa varrida da risca (à direita) para baixo, cobrindo o olho esquerdo */
    const F = [
      [lock(40, 12, 19.5, 40, 6, 9, 1.5), 1], [lock(36, 11, 22, 35, 4, 7, 1.2), 0], [lock(43, 14, 26, 31, 3, 5, 1), 1],
      [lock(30, 8, 16, 30, 3, 7, 1.2), 2], [lock(24, 9, 15, 38, -1, 6, 1.2), 1],
      [lock(42, 12, 47, 30, -2, 6, 1), 1], [lock(45, 15, 49, 40, -1, 5, 1), 2], [lock(44, 22, 47, 44, 1, 4, 1), 1],   // lado direito, atrás da orelha
      [lock(33, 6, 44, 18, -3, 6, 1.2), 0], [lock(27, 6, 38, 10, -2, 5, 1), 0],
    ];
    F.forEach(([m, t]) => paint(m, HAIR, t));
    paint(lock(34, 9, 21, 33, 5, 1.8, 0.6), SILVER, 2);                                         // mecha prateada
    for (const k of lock(38, 13, 23, 37, 5, 1.2, 0.6)) set(k % N, (k / N) | 0, HAIR[3]);          // divisão entre mechas
    for (const k of lock(30, 9, 18, 34, 3, 1.1, 0.5)) set(k % N, (k / N) | 0, HAIR[3]);
    /* brinco de argola (na frente da orelha e do cabelo) */
    [[44, 37], [44, 38], [44.5, 39], [45.5, 39.5], [46.5, 39], [47, 38], [46.5, 37]].forEach(([x, y]) => set(x, y, '#d0ced8')); set(44, 37, '#f4f2f6');
    /* 6) contorno só na silhueta */
    const out = px.slice(), get = (x, y) => (x >= 0 && x < N && y >= 0 && y < N ? px[y * N + x] : null);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!px[y * N + x] && (get(x - 1, y) || get(x + 1, y) || get(x, y - 1) || get(x, y + 1))) out[y * N + x] = LINE;
    const c = document.createElement('canvas'); c.width = N; c.height = N; const g = c.getContext('2d');
    for (let i = 0; i < N * N; i++) if (out[i]) { g.fillStyle = out[i]; g.fillRect(i % N, (i / N) | 0, 1, 1); }
    return c;
  }
  const EXPRS = ['neutro', 'sorriso', 'contente', 'envergonhado'];
  const MAP = { emocionado: 'contente', desconfiado: 'neutro', triste: 'neutro', surpresa: 'envergonhado', concentrada: 'neutro' };
  const cache = {};
  Sprites.PORTRAITS.caleb = (expr = 'neutro') => { const e = EXPRS.includes(expr) ? expr : MAP[expr] || 'neutro'; return cache[e] || (cache[e] = make(e)); };
  Sprites.PORTRAITS.caleb.expressions = EXPRS;
})();
