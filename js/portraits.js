/* Retratos em pixel art (grade nativa de 64x64), desenhados por formas:
   cada mecha de cabelo, tufo de barba e folha do manto é uma forma própria,
   com luz vinda do alto à esquerda, sombra no lado oposto e contorno só na
   silhueta. Nada de pixels espalhados ao acaso.
   Uso: Sprites.PORTRAITS.lucio(expr) → canvas 64x64.
   expr: 'neutro' | 'desconfiado' | 'contente' | 'emocionado'. */

(() => {
  const N = 64;

  /* ---------- paletas ---------- */
  // cabelo e barba: luz, claro, médio, escuro, fundo (cinzas quentes)
  const HAIR = ['#f5f0ea', '#dcd3cc', '#b8ada7', '#8d7f7a', '#665350'];
  const BEARD = ['#f2ede8', '#d6cdc6', '#b2a7a1', '#8a7b76', '#625050'];
  const LINE = '#45272b';                                   // contorno da silhueta
  // pele queimada de sol: luz, claro, base, sombra, sombra funda
  const SKIN = ['#f9d2a8', '#efb182', '#db8f60', '#bb6c46', '#8e4833'];
  const EYE = { white: '#f3e6da', iris: '#5a3020', pupil: '#2c1612', shine: '#fff8ee', lid: '#6a3426' };
  const MOUTH = { line: '#5c2a26', lip: '#b8604c', inside: '#3a1a1a' };
  // folhas do manto (claro, base, sombra) e túnica de baixo
  const LEAF = [['#f3cc58', '#dda23a', '#a86a26'], ['#eea049', '#cf6f2a', '#94461c'], ['#d6703e', '#b24c2a', '#7a2f1c'], ['#b07440', '#86512c', '#58321c']];
  const LEAF_LINE = '#4a2216';
  const CLOTH = ['#94704a', '#755438', '#573c27', '#3e2a1c'];

  /* ---------- formas ---------- */
  const inPoly = (x, y, pts) => {
    let ins = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins;
    }
    return ins;
  };
  /* Máscara (conjunto de pixels) de um polígono. */
  function maskPoly(pts) {
    const m = new Set();
    let x0 = N, x1 = 0, y0 = N, y1 = 0;
    pts.forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
    for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(N - 1, Math.ceil(y1)); y++)
      for (let x = Math.max(0, Math.floor(x0)); x <= Math.min(N - 1, Math.ceil(x1)); x++)
        if (inPoly(x + 0.5, y + 0.5, pts)) m.add(y * N + x);
    return m;
  }
  /* Mecha/tufo: linha central curva (bézier) da raiz até a ponta, afinando.
     bend = quanto a curva se desvia; w = largura na raiz; tip = largura na ponta. */
  function lock(x0, y0, x1, y1, bend, w, tip = 0.6) {
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, len = Math.hypot(x1 - x0, y1 - y0) || 1;
    const nx = -(y1 - y0) / len, ny = (x1 - x0) / len, cx = mx + nx * bend, cy = my + ny * bend;
    const L = [], R = [];
    for (let i = 0; i <= 14; i++) {
      const t = i / 14, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t;
      const px = a * x0 + b * cx + c * x1, py = a * y0 + b * cy + c * y1;
      const dx = 2 * (1 - t) * (cx - x0) + 2 * t * (x1 - cx), dy = 2 * (1 - t) * (cy - y0) + 2 * t * (y1 - cy), dl = Math.hypot(dx, dy) || 1;
      const hw = tip / 2 + (w - tip) / 2 * Math.pow(1 - t, 0.9);
      L.push([px - dy / dl * hw, py + dx / dl * hw]); R.push([px + dy / dl * hw, py - dx / dl * hw]);
    }
    return maskPoly([...L, ...R.reverse()]);
  }
  /* Folha: elipse pontuda girada. */
  function leaf(cx, cy, ang, len, wid) {
    const pts = [], ca = Math.cos(ang), sa = Math.sin(ang);
    for (let i = 0; i < 20; i++) {
      const t = i / 20 * Math.PI * 2, u = Math.cos(t) * len / 2, v = Math.sin(t) * wid / 2 * Math.pow(Math.abs(Math.sin(t)), 0.15) * (1 - 0.35 * Math.max(0, Math.cos(t)));
      pts.push([cx + u * ca - v * sa, cy + u * sa + v * ca]);
    }
    return maskPoly(pts);
  }
  const ellMask = (cx, cy, rx, ry) => { const m = new Set(); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) m.add(y * N + x); return m; };

  function make(expr) {
    const px = new Array(N * N).fill(null);
    const set = (x, y, c) => { if (x >= 0 && x < N && y >= 0 && y < N) px[y * N + x] = c; };
    const get = (x, y) => (x >= 0 && x < N && y >= 0 && y < N ? px[y * N + x] : null);
    const row = (y, a, b, c) => { for (let x = a; x <= b; x++) set(x, y, c); };
    /* Pinta uma forma com luz no alto à esquerda: borda de cima/esquerda clara,
       borda de baixo/direita escura, miolo no tom base. tone desloca a rampa (0 = mais clara). */
    function paint(mask, ramp, tone = 0, opt = {}) {
      const has = (x, y) => mask.has(y * N + x);
      const R = i => ramp[Math.max(0, Math.min(ramp.length - 1, i + tone))];
      for (const k of mask) {
        const x = k % N, y = (k / N) | 0;
        if (opt.clip && !opt.clip(x, y)) continue;
        const ul = !has(x - 1, y) || !has(x, y - 1), dr = !has(x + 1, y) || !has(x, y + 1), dr2 = !has(x + 2, y + 1) || !has(x + 1, y + 2);
        let c = R(1);
        if (dr) c = R(3); else if (dr2) c = R(2);
        if (ul && !dr) c = R(0);
        if (opt.under && y >= opt.under) c = R(dr ? 4 : 3);
        set(x, y, c);
      }
    }

    /* ======== túnica (roupa de baixo) ======== */
    const tunic = maskPoly([[14, 48], [24, 44], [40, 44], [50, 48], [56, 64], [8, 64]]);
    for (const k of tunic) { const x = k % N, y = (k / N) | 0; set(x, y, x < 28 ? CLOTH[1] : x > 40 ? CLOTH[2] : CLOTH[1]); }
    for (let y = 48; y < N; y += 4) { set(20 - ((y - 48) >> 2), y, CLOTH[3]); set(44 + ((y - 48) >> 2), y, CLOTH[3]); }   // costuras
    for (let y = 46; y < N; y++) { set(23, y, CLOTH[0]); set(41, y, CLOTH[2]); }                                        // gola de cordão

    /* ======== manto de folhas nos ombros ======== */
    const LEAVES = [
      // ombro esquerdo (de trás para a frente)
      [3, 61, 2.0, 11, 6, 3], [9, 63, 1.8, 10, 6, 1], [2, 54, 2.3, 11, 6, 1], [8, 56, 2.0, 11, 6, 0], [14, 58, 1.7, 10, 6, 2],
      [5, 49, 2.5, 10, 5, 2], [11, 50, 2.2, 11, 6, 1], [16, 52, 1.9, 10, 5, 0], [18, 60, 1.6, 9, 5, 3], [14, 46, 2.6, 9, 5, 0], [20, 48, 2.3, 8, 5, 1],
      // ombro direito (espelhado, com variação)
      [61, 61, 1.14, 11, 6, 2], [55, 63, 1.34, 10, 6, 0], [62, 54, 0.84, 11, 6, 0], [56, 56, 1.14, 11, 6, 1], [50, 58, 1.44, 10, 6, 3],
      [59, 49, 0.64, 10, 5, 1], [53, 50, 0.94, 11, 6, 2], [48, 52, 1.24, 10, 5, 1], [46, 60, 1.54, 9, 5, 0], [50, 46, 0.54, 9, 5, 2], [44, 48, 0.84, 8, 5, 0],
    ];
    for (const [cx, cy, ang, len, wid, ci] of LEAVES) {
      const m = leaf(cx, cy, ang, len, wid), pal = LEAF[ci], ca = Math.cos(ang), sa = Math.sin(ang);
      for (const k of m) {
        const x = k % N, y = (k / N) | 0, side = (x + 0.5 - cx) * -sa + (y + 0.5 - cy) * ca;     // de que lado da nervura
        const along = (x + 0.5 - cx) * ca + (y + 0.5 - cy) * sa;
        let c = side < -0.4 ? pal[0] : pal[1];
        if (Math.abs(side) <= 0.5 && Math.abs(along) < len / 2 - 1.5) c = pal[2];                // nervura
        const edgeDR = !m.has(y * N + x + 1) || !m.has((y + 1) * N + x), edgeUL = !m.has(y * N + x - 1) || !m.has((y - 1) * N + x);
        if (edgeDR) c = LEAF_LINE; else if (edgeUL && c !== pal[2]) c = pal[0];
        set(x, y, c);
      }
    }

    /* ======== cabelo de trás (atrás do rosto) ======== */
    // massa de volume (fica por baixo das mechas, sem buracos)
    const mass = new Set([...ellMask(32, 17, 20.5, 14), ...maskPoly([[13, 12], [23, 12], [23, 44], [17, 47], [10, 41], [9, 24]]), ...maskPoly([[51, 12], [41, 12], [41, 44], [47, 47], [54, 41], [55, 24]])]);
    paint(mass, HAIR, 2);
    const BACK = [
      [24, 10, 10, 42, -5, 10, 1], [21, 14, 12, 47, -3, 8, 2], [40, 10, 54, 42, 5, 10, 2], [43, 14, 52, 47, 3, 8, 2],
      [19, 18, 8, 37, -3, 6, 1], [45, 18, 56, 37, 3, 6, 2],
    ];
    BACK.forEach(([a, b, c, d, e, w, t]) => paint(lock(a, b, c, d, e, w, 2), HAIR, t));

    /* ======== rosto ======== */
    const face = ellMask(32, 29.5, 11.6, 14.5);
    for (const k of face) {
      const x = k % N, y = (k / N) | 0;
      let c = SKIN[2];
      if (((x + 0.5 - 27) / 7) ** 2 + ((y + 0.5 - 22) / 8) ** 2 <= 1) c = SKIN[1];             // testa e face iluminadas
      if (x >= 41 || (x >= 39 && y >= 33)) c = SKIN[3];                                          // lado na sombra
      if (x <= 21) c = SKIN[2];
      set(x, y, c);
    }
    row(15, 27, 36, SKIN[1]); row(16, 26, 33, SKIN[0]); row(17, 26, 30, SKIN[0]);                // luz na testa
    // rugas da testa
    row(19, 26, 29, SKIN[3]); row(19, 34, 38, SKIN[3]); row(21, 28, 36, SKIN[3]); set(27, 21, SKIN[2]);
    // orelhas
    [[20, 27], [20, 28], [20, 29], [20, 30], [21, 31]].forEach(([x, y]) => { set(x - 1, y, SKIN[3]); set(x, y, SKIN[2]); });
    [[44, 27], [44, 28], [44, 29], [44, 30], [43, 31]].forEach(([x, y]) => { set(x + 1, y, SKIN[4]); set(x, y, SKIN[3]); });
    // maçãs do rosto (volume) e sulcos
    row(31, 23, 26, SKIN[1]); row(32, 22, 26, SKIN[1]); row(31, 24, 25, SKIN[0]); row(33, 23, 25, SKIN[2]);
    row(31, 39, 41, SKIN[2]); row(32, 38, 41, SKIN[2]); row(34, 38, 42, SKIN[3]); row(35, 39, 42, SKIN[3]);
    [[28, 36], [27, 37], [27, 38]].forEach(([x, y]) => set(x, y, SKIN[3])); [[36, 36], [37, 37], [37, 38]].forEach(([x, y]) => set(x, y, SKIN[4]));
    // sombra sob a sobrancelha (arcada)
    row(26, 22, 29, SKIN[3]); row(26, 35, 42, SKIN[3]);
    // nariz: ponte iluminada à esquerda, sombra à direita, ponta e narinas
    for (let y = 26; y <= 34; y++) { set(31, y, SKIN[0]); set(32, y, SKIN[1]); set(34, y, SKIN[3]); }
    set(33, 26, SKIN[3]); set(30, 27, SKIN[2]);
    row(35, 30, 34, SKIN[1]); set(31, 35, SKIN[0]); set(34, 35, SKIN[3]); set(35, 35, SKIN[3]); set(29, 35, SKIN[2]);
    row(36, 29, 35, SKIN[2]); set(30, 36, SKIN[1]); set(35, 36, SKIN[4]); set(34, 36, SKIN[3]); set(29, 36, SKIN[3]);
    set(30, 37, SKIN[4]); row(37, 31, 33, SKIN[3]); set(34, 37, SKIN[4]); set(35, 37, SKIN[3]); set(29, 37, SKIN[3]);

    /* ---- olhos e pálpebras (mudam com a expressão) ---- */
    const eye = (cx, mirror) => {
      const X = dx => cx + (mirror ? -dx : dx);
      if (expr === 'contente') {                                       // olhos apertados num sorriso
        [[-2, 29], [-1, 28], [0, 28], [1, 28], [2, 29]].forEach(([dx, y]) => set(X(dx), y, EYE.lid));
        [[-2, 30], [-1, 29], [0, 29], [1, 29], [2, 30]].forEach(([dx, y]) => set(X(dx), y, SKIN[2]));
        set(X(3), 29, SKIN[3]); set(X(3), 30, SKIN[3]); set(X(4), 30, SKIN[3]);            // pés de galinha
        row(31, Math.min(X(-2), X(2)), Math.max(X(-2), X(2)), SKIN[1]);                    // bochecha erguida
        return;
      }
      const lidY = expr === 'desconfiado' ? 28 : 27;
      row(lidY, Math.min(X(-3), X(2)), Math.max(X(-3), X(2)), EYE.lid);                     // pálpebra de cima
      set(X(3), lidY + 1, SKIN[3]);
      const ey = lidY + 1;
      set(X(-2), ey, EYE.white); set(X(-1), ey, EYE.iris); set(X(0), ey, EYE.pupil); set(X(1), ey, EYE.iris); set(X(2), ey, EYE.white);
      if (expr !== 'desconfiado') { set(X(-1), ey + 1, EYE.iris); set(X(0), ey + 1, EYE.iris); set(X(1), ey + 1, EYE.white); set(X(-2), ey + 1, SKIN[2]); set(X(2), ey + 1, SKIN[2]); }
      set(X(-1), ey, EYE.shine);
      row(ey + (expr === 'desconfiado' ? 1 : 2), Math.min(X(-2), X(2)), Math.max(X(-2), X(2)), SKIN[3]);     // pálpebra de baixo
      set(X(-3), ey + 2, SKIN[3]); set(X(3), ey + 1, SKIN[3]);
      row(ey + 3, Math.min(X(-1), X(2)), Math.max(X(-1), X(2)), SKIN[3]);                   // olheira
      if (expr === 'emocionado') { set(X(1), ey, EYE.shine); set(X(-2), ey + 2, '#bfe6ff'); set(X(-2), ey + 3, '#9fd0f4'); set(X(-3), ey + 4, '#bfe6ff'); }
    };
    eye(26, false); eye(38, true);

    /* ---- sobrancelhas grossas e grisalhas ---- */
    const BROW = {                       // altura do topo, coluna a coluna, de fora para dentro
      neutro:      [24, 23, 23, 22, 22, 22, 22, 23, 23],
      desconfiado: [22, 22, 22, 23, 23, 24, 24, 25, 25],
      contente:    [24, 23, 22, 22, 21, 21, 22, 22, 23],
      emocionado:  [25, 25, 24, 24, 23, 23, 22, 22, 21],
    }[expr];
    const brow = (outer, dir) => BROW.forEach((top, i) => {
      const x = outer + i * dir, thick = i < 2 ? 2 : 3;
      set(x, top, i % 3 === 0 ? HAIR[1] : HAIR[0]);
      for (let k = 1; k < thick; k++) set(x, top + k, k === thick - 1 ? HAIR[3] : HAIR[1]);
      set(x, top + thick, SKIN[3]);
    });
    brow(21, 1); brow(43, -1);
    set(30, BROW[8] + 1, SKIN[3]); set(34, BROW[8] + 1, SKIN[3]);                               // ruga entre as sobrancelhas
    if (expr === 'desconfiado') { set(31, 25, SKIN[3]); set(33, 25, SKIN[3]); }

    /* ======== cabelo da frente: mechas com direção ======== */
    const FRONT = [
      // [raiz x, y, ponta x, y, curva, largura, tom]
      [28, 7, 9, 27, -6, 8, 2],   [36, 7, 55, 27, 6, 8, 2],                    // laterais de fora
      [33, 5, 13, 14, -5, 9, 1],  [32, 5, 52, 13, 5, 9, 1],                    // grandes mechas do alto
      [31, 7, 17, 19, -3, 7, 0],  [34, 7, 47, 19, 3, 7, 0],                    // caem sobre as têmporas (entradas visíveis)
      [32, 6, 24, 2, -1, 5, 0],   [34, 6, 41, 2, 1, 5, 1],   [29, 7, 18, 5, -2, 5, 0],  [36, 7, 47, 5, 2, 5, 1],  // topo despenteado
      [26, 9, 12, 21, -4, 6, 1],  [39, 9, 53, 21, 4, 6, 1],
      [30, 8, 26, 17, -1, 3, 0],  [35, 8, 39, 16, 1, 3, 1],                     // fios soltos sobre a testa
    ];
    FRONT.forEach(([a, b, c, d, e, w, t]) => paint(lock(a, b, c, d, e, w, 1.4), HAIR, t));
    // fios desalinhados de 1 pixel
    [[[11, 11], [9, 14], [8, 17]], [[53, 11], [55, 14], [56, 17]], [[9, 32], [7, 35], [6, 38]], [[55, 32], [57, 35], [58, 38]], [[27, 2], [26, 1]], [[38, 2], [40, 1]]]
      .forEach(pts => pts.forEach(([x, y]) => set(x, y, HAIR[2])));

    /* ======== barba: tufos com volume nas laterais e base arredondada ======== */
    const bmass = maskPoly([[19, 29], [21, 34], [24, 38], [28, 40.5], [36, 40.5], [40, 38], [43, 34], [45, 29], [48, 36], [50, 46], [47, 55], [41, 61], [32, 63], [23, 61], [17, 55], [14, 46], [16, 36]]);
    paint(bmass, BEARD, 2);
    const TUFTS = [
      // laterais volumosas, que descem das costeletas
      [20, 31, 15, 47, -3, 5, 1], [44, 31, 49, 47, 3, 5, 2],
      [22, 36, 17, 55, -4, 7, 1], [42, 36, 47, 55, 4, 7, 2],
      // corpo, em camadas que se sobrepõem
      [26, 41, 22, 60, -3, 10, 1], [38, 41, 42, 60, 3, 10, 1],
      [30, 43, 28, 62, -2, 10, 1], [34, 43, 36, 62, 2, 10, 1],
      [27, 47, 24, 59, -2, 7, 0], [37, 47, 40, 59, 2, 7, 1], [32, 49, 31, 61, -1, 6, 0],
    ];
    TUFTS.forEach(([a, b, c, d, e, w, t]) => paint(lock(a, b, c, d, e, w, 5), BEARD, t));

    /* ======== bigode: duas mechas separadas, sobre a barba ======== */
    const must = [lock(32, 38, 22, 43, 2, 6, 2), lock(32, 38, 42, 43, -2, 6, 2)];
    const mm = new Set([...must[0], ...must[1]]);
    paint(must[0], HAIR, 0); paint(must[1], HAIR, 0);
    for (const k of mm) { const x = k % N, y = (k / N) | 0; if (!mm.has((y + 1) * N + x)) set(x, y + 1, BEARD[4]); }   // sombra embaixo separa do resto
    set(32, 38, HAIR[2]); set(32, 39, HAIR[3]);

    /* ---- boca entre o bigode e a barba ---- */
    if (expr === 'contente') { set(29, 42, MOUTH.line); row(43, 30, 34, MOUTH.line); set(35, 42, MOUTH.line); row(44, 31, 33, MOUTH.lip); }
    else if (expr === 'emocionado') { row(43, 30, 34, MOUTH.line); row(44, 31, 33, MOUTH.inside); row(45, 31, 33, MOUTH.lip); }
    else if (expr === 'desconfiado') { row(43, 30, 33, MOUTH.line); set(34, 44, MOUTH.line); row(44, 31, 32, MOUTH.lip); }
    else { row(43, 30, 34, MOUTH.line); row(44, 31, 33, MOUTH.lip); }

    /* ======== contorno só na silhueta ======== */
    const out = px.slice();
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (px[y * N + x]) continue;
      if (get(x - 1, y) || get(x + 1, y) || get(x, y - 1) || get(x, y + 1)) out[y * N + x] = LINE;
    }
    const c = document.createElement('canvas'); c.width = N; c.height = N;
    const g = c.getContext('2d');
    for (let i = 0; i < N * N; i++) if (out[i]) { g.fillStyle = out[i]; g.fillRect(i % N, (i / N) | 0, 1, 1); }
    return c;
  }

  const cache = {};
  Sprites.PORTRAITS.lucio = (expr = 'neutro') => cache[expr] || (cache[expr] = make(expr));
})();
