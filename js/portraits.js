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

/* =====================================================================
   Retratos dos moradores (64x64), no mesmo acabamento do de Lúcio:
   rosto e ombros desenhados por formas, mechas com luz e sombra,
   roupas reconhecíveis e contorno só na silhueta. Cada morador tem
   expressão "neutro" e "contente" (outras expressões caem nessas duas).
   ===================================================================== */
(() => {
  const N = 64, LINE = '#3a2018';
  const hx = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mixc = (a, b, k) => { const A = hx(a), B = hx(b); return '#' + A.map((v, i) => Math.max(0, Math.min(255, Math.round(v + (B[i] - v) * k))).toString(16).padStart(2, '0')).join(''); };
  /* rampa de 5 tons: brilho, luz, base, sombra, sombra funda (sombras puxadas para o vinho, não para o cinza) */
  const ramp = b => [mixc(b, '#fff8ec', 0.45), mixc(b, '#fff4e0', 0.22), b, mixc(b, '#3a1828', 0.3), mixc(b, '#24101c', 0.52)];
  const inPoly = (x, y, pts) => { let ins = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins; } return ins; };
  const maskPoly = pts => { const m = new Set(); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (inPoly(x + 0.5, y + 0.5, pts)) m.add(y * N + x); return m; };
  const ellMask = (cx, cy, rx, ry) => { const m = new Set(); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) m.add(y * N + x); return m; };
  function lock(x0, y0, x1, y1, bend, w, tip = 0.8) {
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, len = Math.hypot(x1 - x0, y1 - y0) || 1;
    const cx = mx - (y1 - y0) / len * bend, cy = my + (x1 - x0) / len * bend, L = [], R = [];
    for (let i = 0; i <= 14; i++) {
      const t = i / 14, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t;
      const px = a * x0 + b * cx + c * x1, py = a * y0 + b * cy + c * y1;
      const dx = 2 * (1 - t) * (cx - x0) + 2 * t * (x1 - cx), dy = 2 * (1 - t) * (cy - y0) + 2 * t * (y1 - cy), dl = Math.hypot(dx, dy) || 1;
      const hw = tip / 2 + (w - tip) / 2 * Math.pow(1 - t, 0.9);
      L.push([px - dy / dl * hw, py + dx / dl * hw]); R.push([px + dy / dl * hw, py - dx / dl * hw]);
    }
    return maskPoly([...L, ...R.reverse()]);
  }
  const union = (...ms) => { const m = new Set(); ms.forEach(a => a.forEach(k => m.add(k))); return m; };
  const minus = (a, keep) => { const m = new Set(); a.forEach(k => { if (keep(k % N, (k / N) | 0)) m.add(k); }); return m; };

  function makeVillager(P, expr) {
    const px = new Array(N * N).fill(null);
    const set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && x < N && y >= 0 && y < N && c) px[y * N + x] = c; };
    const row = (y, a, b, c) => { for (let x = a; x <= b; x++) set(x, y, c); };
    /* luz do alto à esquerda: borda de cima/esquerda clara, de baixo/direita escura */
    const paint = (mask, R, tone = 0) => {
      const has = (x, y) => mask.has(y * N + x), T = i => R[Math.max(0, Math.min(R.length - 1, i + tone))];
      for (const k of mask) {
        const x = k % N, y = (k / N) | 0, ul = !has(x - 1, y) || !has(x, y - 1), dr = !has(x + 1, y) || !has(x, y + 1), dr2 = !has(x + 2, y + 1) || !has(x + 1, y + 2);
        set(x, y, dr ? T(3) : dr2 ? T(2) : ul ? T(0) : T(1));
      }
    };
    const happy = expr === 'contente' || expr === 'emocionado';
    const SK = ramp(P.skin), HR = P.hair, CL = ramp(P.cloth);
    const faceM = ellMask(32, 29.5, P.faceW || 11.2, 13.8);
    const inFace = (x, y) => faceM.has(y * N + x);
    const ctx = { set, row, paint, SK, HR, CL, lock, ellMask, maskPoly, union, minus, inFace, mixc, ramp, N };

    // 1) cabelo de trás (fica atrás de rosto e roupa)
    if (P.back) P.back(ctx);
    // 2) roupa e ombros
    const shoulders = maskPoly([[5, 64], [8, 54], [17, 47.5], [27, 44.5], [37, 44.5], [47, 47.5], [56, 54], [59, 64]]);
    if (P.top === 'jardineira') {
      const SH = ramp('#efe6cf'); paint(shoulders, SH, 1);
      for (const k of ellMask(32, 44.5, 5.5, 3)) set(k % N, (k / N) | 0, SK[3]);
      const bib = maskPoly([[23.5, 52], [40.5, 52], [42, 64], [22, 64]]); paint(bib, CL, 1);
      paint(lock(25, 53, 21, 45, 0, 3.4, 3), CL, 0); paint(lock(39, 53, 43, 45, 0, 3.4, 3), CL, 1);
      [[25, 53], [39, 53]].forEach(([x, y]) => { set(x, y, '#ffd75e'); set(x + 1, y, '#c89a20'); });
      row(56, 29, 35, CL[3]); for (let y = 57; y <= 60; y++) { set(29, y, CL[3]); set(35, y, CL[3]); } row(60, 29, 35, CL[3]);
    } else {
      paint(shoulders, CL, 1);
      if (P.top === 'camisa') {
        for (const k of maskPoly([[28.5, 44], [35.5, 44], [32, 49.5]])) set(k % N, (k / N) | 0, SK[3]);
        paint(maskPoly([[25, 44], [31.5, 48.5], [29, 53], [22.5, 47]]), ramp(mixc(P.cloth, '#ffffff', 0.35)), 0);
        paint(maskPoly([[39, 44], [32.5, 48.5], [35, 53], [41.5, 47]]), ramp(mixc(P.cloth, '#ffffff', 0.35)), 1);
        for (let y = 50; y < N; y++) set(32, y, CL[3]); [53, 58, 63].forEach(y => set(32, y, CL[0]));
      } else {                                                         // blusa: decote redondo e mangas bufantes
        for (const k of ellMask(32, 45, 6.8, 4.4)) set(k % N, (k / N) | 0, ((k / N) | 0) > 46 ? SK[2] : SK[3]);
        for (let x = 25; x <= 39; x++) { const y = Math.round(45 + 4.4 * Math.sqrt(Math.max(0, 1 - ((x + 0.5 - 32) / 6.8) ** 2))); set(x, y, CL[3]); }
        [[13, 55], [51, 57]].forEach(([x, y], i) => { set(x, y, CL[i ? 3 : 0]); set(x + (i ? 1 : -1), y + 2, CL[i ? 3 : 0]); });
      }
    }
    // 3) pescoço
    for (let y = 37; y <= 46; y++) { if (P.top !== 'blusa' && y > 44) break; row(y, 28, 36, y < 41 ? SK[3] : SK[2]); set(36, y, SK[3]); }
    // 4) rosto (e crânio, para quem é careca)
    if (P.bald) paint(ellMask(32, 27.5, 12, 16), [SK[0], SK[1], SK[2], SK[3], SK[4]], 1);
    for (const k of faceM) {
      const x = k % N, y = (k / N) | 0;
      let c = SK[2];
      if (((x + 0.5 - 28) / 7.5) ** 2 + ((y + 0.5 - 24) / 9) ** 2 <= 1) c = SK[1];          // testa e face iluminadas
      if (x >= 41 || (x >= 39 && y >= 34) || y >= 42) c = SK[3];                                // lado e queixo na sombra
      set(x, y, c);
    }
    if (P.bald) { row(13, 27, 31, SK[0]); row(14, 25, 30, SK[0]); row(15, 25, 28, SK[0]); }
    // orelhas
    [[20, 28], [20, 29], [20, 30], [20, 31], [21, 32]].forEach(([x, y]) => { set(x - 1, y, SK[3]); set(x, y, SK[2]); });
    [[44, 28], [44, 29], [44, 30], [44, 31], [43, 32]].forEach(([x, y]) => { set(x + 1, y, SK[4]); set(x, y, SK[3]); });
    // maçãs do rosto e queixo
    row(33, 23, 25, SK[1]); row(34, 23, 26, SK[1]); row(33, 39, 41, SK[2]); row(35, 39, 41, SK[3]);
    // 5) olhos (pálpebras), sobrancelhas, nariz e boca
    const EY = P.eye || '#4a2a1a', LID = mixc(P.eye || '#4a2a1a', '#1a0a08', 0.5);
    const eye = (c, dir) => {
      if (happy) {                                                        // olhos sorrindo
        [[-2, 29], [-1, 28], [0, 28], [1, 28], [2, 29]].forEach(([d, y]) => set(c + d * dir, y, LID));
        row(30, c - 2, c + 2, SK[1]); if (P.lashes) set(c + 3 * dir, 28, LID);
        return;
      }
      row(28, c - 2, c + 2, LID); if (P.lashes) { set(c + 3 * dir, 27, LID); set(c + 3 * dir, 28, LID); }
      set(c - 2, 29, '#f4ece4'); set(c + 2, 29, '#f4ece4');
      set(c - 1, 29, EY); set(c, 29, '#1a0e0a'); set(c + 1, 29, EY); set(c - dir, 29, '#fff8ee');
      set(c - 1, 30, EY); set(c, 30, mixc(EY, '#000', 0.3)); set(c + 1, 30, EY); set(c - 2, 30, SK[3]); set(c + 2, 30, SK[3]);
      row(31, c - 1, c + 1, SK[3]);
    };
    eye(27, -1); eye(37, 1);
    const BR = P.brow || HR[3], bY = happy ? 24 : 25;
    [[22, 1], [42, -1]].forEach(([o, d]) => { for (let i = 0; i < 7; i++) { const y = bY - (i >= 1 && i <= 4 ? 1 : 0) + (P.browFrown && i >= 5 ? 1 : 0); set(o + i * d, y, BR); if (P.thickBrow || i > 0 && i < 6) set(o + i * d, y + 1, mixc(BR, SK[3], 0.3)); } });
    for (let y = 30; y <= 34; y++) { set(31, y, SK[1]); set(33, y, SK[3]); }
    set(32, 30, SK[2]); set(31, 35, SK[0]); row(35, 30, 34, SK[2]); set(31, 35, SK[1]); set(34, 35, SK[3]);
    set(30, 36, SK[3]); set(31, 36, SK[4]); set(32, 36, SK[3]); set(33, 36, SK[4]); set(34, 36, SK[3]);
    const ML = mixc(SK[4], '#3a0a10', 0.4), LIP = P.lip || mixc(SK[2], '#c04848', 0.4);
    if (happy) {
      set(28, 38, ML); set(36, 38, ML); row(39, 29, 35, ML); row(40, 30, 34, '#fff4ec'); row(41, 31, 33, LIP); set(30, 41, ML); set(34, 41, ML);
      [[23, 35], [24, 35], [40, 35], [41, 35]].forEach(([x, y]) => set(x, y, mixc(SK[2], '#e85a6a', 0.35)));
    } else { row(39, 29, 35, ML); row(40, 30, 34, LIP); set(29, 40, SK[3]); set(35, 40, SK[3]); }
    // marcas da idade
    if (P.old) {
      row(19, 26, 29, SK[3]); row(19, 34, 37, SK[3]); row(21, 28, 35, SK[3]);
      [[28, 37], [27, 38], [36, 37], [37, 38]].forEach(([x, y]) => set(x, y, SK[3]));
      set(23, 30, SK[3]); set(23, 31, SK[3]); set(41, 30, SK[4]); set(41, 31, SK[4]); row(32, 25, 28, SK[3]); row(32, 36, 39, SK[3]);
    }
    // 6) cabelo da frente e detalhes próprios
    if (P.front) P.front(ctx, expr);
    if (P.extra) P.extra(ctx, expr);
    // 7) contorno só na silhueta
    const out = px.slice(), get = (x, y) => (x >= 0 && x < N && y >= 0 && y < N ? px[y * N + x] : null);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!px[y * N + x] && (get(x - 1, y) || get(x + 1, y) || get(x, y - 1) || get(x, y + 1))) out[y * N + x] = LINE;
    const c = document.createElement('canvas'); c.width = N; c.height = N;
    const g = c.getContext('2d');
    for (let i = 0; i < N * N; i++) if (out[i]) { g.fillStyle = out[i]; g.fillRect(i % N, (i / N) | 0, 1, 1); }
    return c;
  }

  /* hairline(x): onde termina o cabelo sobre a testa. Fica cabelo acima dela ou fora do rosto. */
  const capMask = (ctx, mass, hairline) => ctx.minus(mass, (x, y) => y <= hairline(x) || !ctx.inFace(x, y));

  const SPECS = {
    /* Dona Celeste: senhora de pele morena, coque grisalho preso com fita, blusa terracota. */
    celeste: {
      skin: '#b9794f', cloth: '#c8683a', top: 'blusa', old: true, lashes: true, eye: '#4a2a18', brow: '#a8a4a2', lip: '#a85048', faceW: 11,
      hair: ['#f6f4f2', '#dcd8d6', '#b8b2b0', '#8e8684', '#625a58'],
      front(c) {
        const cap = capMask(c, c.ellMask(32, 22.5, 13.2, 11.5), x => 18 + ((x - 32) / 11.5) ** 2 * 9);
        c.paint(cap, c.HR, 1);
        [-9, -6, -3, 0, 3, 6, 9].forEach((k, i) => c.paint(c.lock(32 + k, 18 + Math.abs(k) * 0.5, 32 + k * 0.35, 12, k * 0.15, 3, 1), c.HR, i % 2));
        c.paint(c.ellMask(32, 7.5, 6.8, 5.6), c.HR, 0);                                     // coque
        for (let x = 27; x <= 37; x++) c.set(x, 8 + (x === 27 || x === 37 ? 1 : 0), c.HR[3]);
        c.row(12, 28, 36, '#e04a3a'); c.row(13, 28, 36, '#a8302a'); c.set(29, 12, '#ff7a6a');
      },
      extra(c) { c.set(19, 34, '#ffd75e'); c.set(45, 34, '#ffd75e'); c.set(19, 35, '#c89a20'); c.set(45, 35, '#c89a20'); },
    },
    /* Seu Honório: senhor careca de pele escura, sobrancelhas grisalhas, camisa marrom; cara de poucos amigos. */
    honorio: {
      skin: '#8a5636', cloth: '#8a5e36', top: 'camisa', old: true, bald: true, thickBrow: true, browFrown: true, eye: '#2a1810', brow: '#dedad6', faceW: 11.6,
      hair: ['#f0eeec', '#d4d0cc', '#aaa4a0', '#7c7470', '#56504c'],
      front(c) {                                                                        // fios grisalhos curtinhos nas laterais
        [[19, 22], [19, 24], [20, 26], [44, 22], [44, 24], [43, 26], [18, 25], [45, 25]].forEach(([x, y]) => { c.set(x, y, c.HR[1]); c.set(x, y + 1, c.HR[2]); });
      },
    },
    /* Bia: jovem ruiva de rabo de cavalo com fita vermelha, sardas, jardineira verde sobre camisa clara. */
    bia: {
      skin: '#f6c89c', cloth: '#3fa070', top: 'jardineira', lashes: true, eye: '#3a7a3a', faceW: 10.8,
      hair: ['#ffc090', '#f08a54', '#cc5a2c', '#963a18', '#68240e'],
      back(c) { c.paint(c.lock(41, 16, 52, 41, 5, 10, 3), c.HR, 1); c.paint(c.lock(43, 18, 49, 43, 2, 6, 2), c.HR, 0); },
      front(c) {
        const cap = capMask(c, c.ellMask(32, 22.5, 13.3, 11.8), x => 17 + ((x - 32) / 11.5) ** 2 * 10);
        c.paint(cap, c.HR, 1);
        c.paint(c.lock(37, 12, 22, 22, -3, 7, 1), c.HR, 0); c.paint(c.lock(35, 13, 26, 21, -2, 5, 1), c.HR, 1);
        c.paint(c.lock(21, 19, 19, 32, -1, 4, 1), c.HR, 1); c.paint(c.lock(43, 19, 45, 31, 1, 4, 1), c.HR, 2);
        for (let y = 15; y <= 18; y++) { c.set(42, y, '#e04a3a'); c.set(43, y, '#e04a3a'); c.set(44, y, '#a8302a'); }
      },
      extra(c) { const F = c.mixc(c.SK[2], '#a0502a', 0.4); [[24, 33], [26, 34], [25, 35], [38, 34], [40, 33], [39, 35]].forEach(([x, y]) => c.set(x, y, F)); },
    },
    /* Tomé: rapaz calado do bosque, cabelo castanho na altura do queixo com franja, camisa verde-musgo. */
    tome: {
      skin: '#dca272', cloth: '#5a7a5a', top: 'camisa', eye: '#3a2414', faceW: 11.3,
      hair: ['#b48a64', '#8e6442', '#6c4a30', '#4c3020', '#301c12'],
      back(c) { c.paint(c.maskPoly([[17, 22], [23, 20], [23, 43], [18, 42]]), c.HR, 2); c.paint(c.maskPoly([[47, 22], [41, 20], [41, 43], [46, 42]]), c.HR, 2); },
      front(c) {
        const cap = capMask(c, c.ellMask(32, 21.5, 14.3, 12.3), () => 20);
        c.paint(cap, c.HR, 1);
        [23, 27, 31, 35, 39].forEach((x0, i) => c.paint(c.lock(x0 + 1, 11, x0, 22 + (i % 2), 0, 5, 2), c.HR, i % 2));
        c.paint(c.lock(21, 17, 19, 41, -1, 6, 2), c.HR, 1); c.paint(c.lock(43, 17, 45, 41, 1, 6, 2), c.HR, 2);
      },
    },
    /* Iara: pintora de pele muito escura, cabelo preto longo e cacheado, blusa lilás e tinta na bochecha. */
    iara: {
      skin: '#5e3a26', cloth: '#8a5ad9', top: 'blusa', lashes: true, eye: '#2a160e', lip: '#7a3434', faceW: 10.9,
      hair: ['#7a6a8c', '#544668', '#362c46', '#201a2c', '#120e18'],
      back(c) {
        const pts = [];
        for (let a = 0; a < 16; a++) { const t = Math.PI * (0.95 + a / 15 * 1.1); pts.push([32 + Math.cos(t) * 17, 30 + Math.sin(t) * 19]); }
        pts.push([14, 46], [12, 53], [16, 59], [50, 46], [52, 53], [48, 59], [20, 50], [44, 50]);
        pts.forEach(([x, y], i) => c.paint(c.ellMask(x, y, 5.6, 5.6), c.HR, i % 2));
      },
      front(c) { [[21, 21], [25, 16], [31, 13.5], [37, 14], [42, 18], [44, 24], [20, 27]].forEach(([x, y], i) => c.paint(c.ellMask(x, y, 5, 5), c.HR, i % 2 ? 1 : 0)); },
      extra(c) { c.set(40, 33, '#e0a23a'); c.set(41, 33, '#f0c050'); c.set(40, 34, '#3f86d0'); c.set(19, 36, '#ffd75e'); c.set(45, 36, '#ffd75e'); },
    },
  };
  const cache = {};
  Object.keys(SPECS).forEach(id => {
    Sprites.PORTRAITS[id] = (expr = 'neutro') => { const e = expr === 'contente' || expr === 'emocionado' ? 'contente' : 'neutro'; const k = id + ':' + e; return cache[k] || (cache[k] = makeVillager(SPECS[id], e)); };
  });
  /* Reserva neutra: silhueta, para quando faltar um retrato (nunca o rosto de outra pessoa). */
  Sprites.PORTRAITS._reserva = () => {
    if (cache._r) return cache._r;
    const c = document.createElement('canvas'); c.width = N; c.height = N; const g = c.getContext('2d');
    g.fillStyle = '#6a6a80'; g.beginPath(); g.arc(32, 26, 12, 0, Math.PI * 2); g.fill(); g.fillRect(10, 46, 44, 18); g.beginPath(); g.arc(32, 50, 22, Math.PI, 0); g.fill();
    g.fillStyle = '#8a8aa0'; g.fillRect(26, 18, 4, 4);
    return (cache._r = c);
  };
})();
