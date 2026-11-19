/* =====================================================================
   Retrato de Iara (64x64), menina de 13 anos.
   Rosto redondo de criança, olhos grandes, cabelo preto-arroxeado em
   cachos até os ombros com uma presilha amarela, jardineira lilás com
   manchas de tinta e um pincel no bolso. No inverno: gorro de tricô com
   pompom, cachecol e casaco. Expressões: neutro, contente, concentrada,
   triste e surpresa (só olhos, sobrancelhas e boca mudam).
   ===================================================================== */
(() => {
  const N = 64, LINE = '#2a1420';
  const hx = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mixc = (a, b, k) => { const A = hx(a), B = hx(b); return '#' + A.map((v, i) => Math.max(0, Math.min(255, Math.round(v + (B[i] - v) * k))).toString(16).padStart(2, '0')).join(''); };
  const ramp = b => [mixc(b, '#fff8ec', 0.42), mixc(b, '#fff4e0', 0.2), b, mixc(b, '#3a1828', 0.3), mixc(b, '#24101c', 0.52)];
  const inPoly = (x, y, pts) => { let ins = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins; } return ins; };
  const poly = pts => { const m = new Set(); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (inPoly(x + 0.5, y + 0.5, pts)) m.add(y * N + x); return m; };
  const ell = (cx, cy, rx, ry) => { const m = new Set(); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) m.add(y * N + x); return m; };

  const SKIN = ramp('#6a4230'), HAIR = ['#7a6694', '#544470', '#352a4c', '#211a30', '#130e1c'];
  const IRIS = ['#c88a4a', '#9a5e30', '#5a3418'], WHITE = '#f6efe6', PUP = '#160c0a';

  function make(expr, outfit) {
    const px = new Array(N * N).fill(null);
    const set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && x < N && y >= 0 && y < N && c) px[y * N + x] = c; };
    const row = (y, a, b, c) => { for (let x = a; x <= b; x++) set(x, y, c); };
    const paint = (mask, R, tone = 0) => {
      const has = (x, y) => mask.has(y * N + x), T = i => R[Math.max(0, Math.min(R.length - 1, i + tone))];
      for (const k of mask) { const x = k % N, y = (k / N) | 0, ul = !has(x - 1, y) || !has(x, y - 1), dr = !has(x + 1, y) || !has(x, y + 1), dr2 = !has(x + 2, y + 1) || !has(x + 1, y + 2); set(x, y, dr ? T(3) : dr2 ? T(2) : ul ? T(0) : T(1)); }
    };
    const winter = outfit === 'inverno';
    /* 1) cabelo de trás: nuvem de cachos até os ombros */
    const back = [];
    for (let a = 0; a < 14; a++) { const t = Math.PI * (0.92 + a / 13 * 1.16); back.push([32 + Math.cos(t) * 16, 31 + Math.sin(t) * 16.5]); }
    back.push([16, 40], [15, 46], [18, 50], [48, 40], [49, 46], [46, 50], [21, 47], [43, 47]);
    back.forEach(([x, y], i) => paint(ell(x, y, 5.2, 5.2), HAIR, i % 2));
    /* 2) roupa */
    const shoulders = poly([[9, 64], [12, 56], [20, 51.5], [27, 50], [37, 50], [44, 51.5], [52, 56], [55, 64]]);
    if (winter) {
      const C = ramp('#8a64d0'); paint(shoulders, C, 1);
      for (let y = 53; y < N; y++) set(32, y, C[4]); [55, 58, 61].forEach(y => set(32, y, '#d8d8e8'));     // zíper
      paint(poly([[20, 51], [27, 49], [29, 55], [22, 56]]), ramp('#a888e0'), 0); paint(poly([[44, 51], [37, 49], [35, 55], [42, 56]]), ramp('#a888e0'), 1);   // gola
    } else {
      paint(shoulders, ramp('#f2ead6'), 1);                                              // camiseta creme
      const OV = ramp('#9a74d8');
      paint(poly([[23, 55], [41, 55], [42.5, 64], [21.5, 64]]), OV, 1);                 // peitilho da jardineira
      paint(poly([[24, 55.5], [27.5, 55.5], [23.5, 50.5], [20, 51.5]]), OV, 0); paint(poly([[40, 55.5], [36.5, 55.5], [40.5, 50.5], [44, 51.5]]), OV, 1);   // alças
      [[25, 56], [39, 56]].forEach(([x, y]) => { set(x, y, '#ffd75e'); set(x + 1, y, '#c89a20'); });
      row(59, 28, 36, OV[3]); for (let y = 59; y <= 63; y++) { set(28, y, OV[3]); set(36, y, OV[3]); }  // bolso
      for (let y = 54; y <= 60; y++) set(34, y, '#8a5a2a'); set(34, 53, '#e04a5a'); set(34, 52, '#e04a5a'); set(35, 53, '#a8303a');  // pincel no bolso
      [[24, 60, '#e0a23a'], [38, 61, '#3f86d0'], [29, 57, '#58b858'], [40, 58, '#e04a5a'], [26, 63, '#3f86d0'], [16, 59, '#e0a23a']].forEach(([x, y, c]) => set(x, y, c));   // manchas de tinta
    }
    /* 3) pescoço e rosto */
    for (let y = 43; y <= 51; y++) { row(y, 28, 36, y < 47 ? SKIN[3] : SKIN[2]); set(36, y, SKIN[3]); }
    if (winter) { const SC = ramp('#e0a23a'); paint(poly([[24, 47], [40, 47], [41, 53], [23, 53]]), SC, 0); for (let x = 25; x <= 39; x += 4) { set(x, 49, SC[3]); set(x + 1, 51, SC[3]); } paint(poly([[36, 52], [41, 52], [40, 60], [36, 59]]), SC, 1); }
    const face = ell(32, 32, 12.4, 14);
    for (const k of face) {
      const x = k % N, y = (k / N) | 0; let c = SKIN[2];
      if (((x + 0.5 - 28) / 8) ** 2 + ((y + 0.5 - 27) / 9) ** 2 <= 1) c = SKIN[1];
      if (x >= 42 || (x >= 40 && y >= 37) || y >= 44) c = SKIN[3];
      set(x, y, c);
    }
    [[19, 31], [19, 32], [19, 33], [20, 34]].forEach(([x, y]) => { set(x - 1, y, SKIN[3]); set(x, y, SKIN[2]); });
    [[45, 31], [45, 32], [45, 33], [44, 34]].forEach(([x, y]) => { set(x + 1, y, SKIN[4]); set(x, y, SKIN[3]); });
    /* 4) expressão */
    const e = expr;
    const blushK = e === 'contente' ? 0.5 : e === 'triste' ? 0.15 : 0.32, BL = mixc(SKIN[2], '#e8607a', blushK);
    [[22, 38], [23, 38], [24, 38], [23, 39], [40, 38], [41, 38], [42, 38], [41, 39]].forEach(([x, y]) => set(x, y, BL));
    const LID = '#1c0e10';
    const eye = (c, dir) => {                                   // dir: -1 olho esquerdo (lado de fora à esquerda), 1 direito
      const X = d => c + d * dir;
      if (e === 'contente') {                                   // olhos sorrindo (arcos)
        set(X(-2), 31, LID); set(X(-1), 30, LID); set(X(0), 30, LID); set(X(1), 30, LID); set(X(2), 31, LID); set(X(3), 30, LID);
        row(32, Math.min(X(-1), X(1)), Math.max(X(-1), X(1)), SKIN[1]); return;
      }
      if (e === 'concentrada') {                                // pálpebra baixa, olhando para baixo e de lado
        row(30, Math.min(X(-3), X(2)), Math.max(X(-3), X(2)), LID); set(X(3), 29, LID);
        set(X(-2), 31, WHITE); set(X(-1), 31, IRIS[2]); set(X(0), 31, PUP); set(X(1), 31, IRIS[1]); set(X(2), 31, WHITE);
        set(X(-1), 32, IRIS[1]); set(X(0), 32, IRIS[0]); set(X(1), 32, IRIS[1]); row(33, Math.min(X(-1), X(1)), Math.max(X(-1), X(1)), SKIN[3]); return;
      }
      const top = e === 'surpresa' ? 27 : 28;
      row(top, Math.min(X(-2), X(1)), Math.max(X(-2), X(1)), LID); set(X(2), top, LID); set(X(3), top - 1, LID);   // cílios
      set(X(-3), top + 1, LID);
      if (e === 'triste') { set(X(2), top, SKIN[2]); set(X(3), top - 1, SKIN[2]); set(X(2), top + 1, LID); }        // pálpebra caída para fora
      const y0 = top + 1;
      if (e === 'surpresa') {                                   // olho arregalado: branco em volta da íris pequena
        for (let y = y0; y <= y0 + 5; y++) row(y, Math.min(X(-2), X(2)), Math.max(X(-2), X(2)), WHITE);
        set(X(-1), y0 + 2, IRIS[2]); set(X(0), y0 + 2, PUP); set(X(-1), y0 + 3, IRIS[1]); set(X(0), y0 + 3, IRIS[2]); set(X(-1), y0 + 1, '#ffffff');
        row(y0 + 6, Math.min(X(-1), X(1)), Math.max(X(-1), X(1)), SKIN[3]); return;
      }
      row(y0, Math.min(X(-2), X(1)), Math.max(X(-2), X(1)), IRIS[2]); set(X(2), y0, WHITE);
      set(X(-3), y0 + 1, WHITE); set(X(-2), y0 + 1, IRIS[2]); set(X(-1), y0 + 1, PUP); set(X(0), y0 + 1, PUP); set(X(1), y0 + 1, IRIS[1]); set(X(2), y0 + 1, WHITE);
      set(X(-3), y0 + 2, WHITE); set(X(-2), y0 + 2, IRIS[1]); set(X(-1), y0 + 2, PUP); set(X(0), y0 + 2, IRIS[1]); set(X(1), y0 + 2, IRIS[0]); set(X(2), y0 + 2, WHITE);
      row(y0 + 3, Math.min(X(-2), X(1)), Math.max(X(-2), X(1)), IRIS[0]); set(X(-1), y0 + 3, IRIS[1]);
      set(X(-1), y0, '#ffffff'); set(X(0), y0 + 1, '#fff6e8');                                   // brilhos
      row(y0 + 4, Math.min(X(-1), X(1)), Math.max(X(-1), X(1)), SKIN[3]);
      if (e === 'triste') { set(X(-2), y0 + 4, '#a8d8f0'); }                                     // olho marejado
      if (e === 'triste' || e === 'neutro') { /* olhar um pouco para baixo na tristeza */ if (e === 'triste') { set(X(-1), y0 + 1, IRIS[2]); set(X(-1), y0 + 3, PUP); } }
    };
    eye(26, -1); eye(38, 1);
    const BR = '#24182e';
    const brow = (o, d, shape) => { for (let i = 0; i < 6; i++) { const x = o + i * d; set(x, shape(i), BR); } };
    const by = e === 'surpresa' ? 22 : e === 'contente' ? 23 : 24;
    if (e === 'triste') { brow(21, 1, i => by + 1 - (i >= 4 ? 1 : 0) - (i >= 5 ? 1 : 0)); brow(43, -1, i => by + 1 - (i >= 4 ? 1 : 0) - (i >= 5 ? 1 : 0)); }      // ponta de dentro levantada
    else if (e === 'concentrada') { brow(21, 1, i => by + (i >= 4 ? 1 : 0)); brow(43, -1, i => by + (i >= 4 ? 1 : 0)); }      // ponta de dentro baixa
    else { brow(21, 1, i => by - (i >= 1 && i <= 3 ? 1 : 0)); brow(43, -1, i => by - (i >= 1 && i <= 3 ? 1 : 0)); }
    set(32, 35, SKIN[1]); set(31, 37, SKIN[3]); set(33, 37, SKIN[3]); set(32, 37, SKIN[2]);   // nariz pequeno
    const ML = '#3a1018', IN = '#5a1820', LIP = mixc(SKIN[2], '#c04a5a', 0.45);
    if (e === 'contente') { row(40, 28, 36, ML); row(41, 29, 35, IN); row(41, 30, 34, '#fff4ec'); row(42, 29, 35, IN); set(28, 41, ML); set(36, 41, ML); row(43, 30, 34, ML); row(42, 31, 33, '#d8606a'); }
    else if (e === 'surpresa') { row(40, 31, 33, ML); set(30, 41, ML); set(34, 41, ML); row(41, 31, 33, IN); row(42, 31, 33, ML); set(32, 43, LIP); }
    else if (e === 'triste') { row(41, 30, 34, ML); set(29, 42, ML); set(35, 42, ML); row(42, 31, 33, LIP); }
    else if (e === 'concentrada') { row(41, 30, 33, ML); set(34, 41, ML); set(34, 42, '#e86a7a'); set(35, 42, '#c8505a'); }   // pontinha da língua
    else { row(41, 30, 34, ML); set(29, 40, ML); set(35, 40, ML); row(42, 31, 33, LIP); }
    set(41, 41, '#e0a23a');                                                                       // pinguinho de tinta na bochecha
    /* 5) cabelo da frente (franja de cachos) ou gorro */
    if (winter) {
      const G = ramp('#5a58b8'), band = ramp('#7a78d0');
      [[19, 30], [45, 30], [18, 37], [46, 37], [19, 43], [45, 43]].forEach(([x, y], i) => paint(ell(x, y, 3.6, 4), HAIR, i % 2));
      paint(ell(32, 18, 15.5, 11), G, 1);
      for (let x = 19; x <= 45; x += 3) for (let y = 10; y <= 19; y++) set(x, y, G[3]);
      paint(poly([[16, 18.5], [48, 18.5], [48.5, 24.5], [15.5, 24.5]]), band, 0); for (let x = 17; x <= 47; x += 2) set(x, 23, band[3]);
      paint(ell(32, 6, 5, 4.6), ramp('#eef0fa'), 0); set(30, 4, '#ffffff');                     // pompom
    } else {
      [[21, 22], [25, 17.5], [31, 15.5], [37, 16], [42, 19.5], [44.5, 25], [19.5, 28]].forEach(([x, y], i) => paint(ell(x, y, 5, 5), HAIR, i % 2 ? 1 : 0));
      [[28, 21.5], [35, 21]].forEach(([x, y]) => paint(ell(x, y, 3.4, 3), HAIR, 1));         // cachinhos da franja
      row(20, 20, 23, '#f2c84a'); row(21, 20, 23, '#c8962a'); set(20, 20, '#fff0a8');         // presilha amarela
    }
    /* 6) contorno só na silhueta */
    const out = px.slice(), get = (x, y) => (x >= 0 && x < N && y >= 0 && y < N ? px[y * N + x] : null);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!px[y * N + x] && (get(x - 1, y) || get(x + 1, y) || get(x, y - 1) || get(x, y + 1))) out[y * N + x] = LINE;
    const c = document.createElement('canvas'); c.width = N; c.height = N; const g = c.getContext('2d');
    for (let i = 0; i < N * N; i++) if (out[i]) { g.fillStyle = out[i]; g.fillRect(i % N, (i / N) | 0, 1, 1); }
    return c;
  }
  const EXPRS = ['neutro', 'contente', 'concentrada', 'triste', 'surpresa'];
  const MAP = { emocionado: 'contente', desconfiado: 'neutro' };
  const cache = {};
  /* outfit: 'inverno' ou 'comum'; sem informar, segue a estação do mapa (gorro e casaco no Inverno). */
  Sprites.PORTRAITS.iara = (expr = 'neutro', outfit) => {
    const e = EXPRS.includes(expr) ? expr : MAP[expr] || 'neutro';
    const o = outfit || (typeof World !== 'undefined' && World.SEASON === 3 ? 'inverno' : 'comum'), k = e + ':' + o;
    return cache[k] || (cache[k] = make(e, o));
  };
  Sprites.PORTRAITS.iara.expressions = EXPRS;
})();
