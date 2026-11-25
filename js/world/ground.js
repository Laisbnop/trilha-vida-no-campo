/* Mundo — chão: posições fixas do mapa externo, montagem dos mapas (colisão), pavimento, calçamento,
   grama baixa e mato alto.
   Parte de js/world/ (antes era js/world.js). São scripts comuns, carregados em ordem pelo index.html:
   as declarações de nível superior valem para todos os arquivos (não são módulos). O objeto World,
   com as funções públicas, é montado no fim, em js/world/index.js. */

/* ================= posições fixas do mapa externo ================= */
const FORA = { w: 1600, h: 896 };              // fazenda (oeste), vila, bosque, beira-rio (sul) e bairro leste
const GRID = { x0: 40, y0: 196, cols: 20, rows: 10, s: 16 };            // terra cultivável da fazenda
const YARD = { x0: 156, y0: 402, x1: 290, y1: 440 };                    // onde as galinhas ciscam (cercado)
const SPOT = { water: [336, 136], dummy: [214, 142], bench: [598, 206], hat: [1150, 470] };
const NTREES = [[880, 90], [930, 70], [900, 236], [950, 276], [880, 336], [940, 388], [1000, 428], [900, 450], [1070, 96], [1130, 116], [1164, 66], [1060, 392], [1120, 440], [1172, 366]];
const NROCKS = [[862, 206], [984, 246], [1012, 344], [872, 404], [962, 468], [1102, 350], [1152, 196], [1092, 140]];
const FORAGE = [[916, 124], [1042, 204], [892, 296], [976, 352], [1036, 470], [1142, 404], [1186, 316], [852, 466]];

/* ================= construção de mapas ================= */
let cur;
function newMap(id, w, h, seed) {
  W = w; H = h; rand = rng(seed);
  const bg = document.createElement('canvas'); bg.width = w; bg.height = h;
  g = bg.getContext('2d');
  cur = { id, w, h, bg, cols: Math.ceil(w / CELL), rows: Math.ceil(h / CELL), objs: [], sprites: [], doors: {}, lights: [], smokes: [], spawn: { x: w / 2, y: h - 10 } };
  cur.solid = new Uint8Array(cur.cols * cur.rows);
  cur.path = new Uint8Array(cur.cols * cur.rows);
  return cur;
}
function mark(grid, x, y, w, h, v = 1) {
  for (let cy = Math.max(0, Math.floor(y / CELL)); cy <= Math.min(cur.rows - 1, Math.floor((y + h - 1) / CELL)); cy++)
    for (let cx = Math.max(0, Math.floor(x / CELL)); cx <= Math.min(cur.cols - 1, Math.floor((x + w - 1) / CELL)); cx++) grid[cy * cur.cols + cx] = v;
}
const solid = (x, y, w, h) => mark(cur.solid, x, y, w, h);
const open = (x, y, w, h) => mark(cur.solid, x, y, w, h, 0);
const keep = (x, y, w, h) => mark(cur.path, x, y, w, h);            // nada de vegetação aqui
const isFree = (x, y, w, h) => {
  for (let cy = Math.floor(y / CELL); cy <= Math.floor((y + h - 1) / CELL); cy++) for (let cx = Math.floor(x / CELL); cx <= Math.floor((x + w - 1) / CELL); cx++) {
    if (cx < 0 || cy < 0 || cx >= cur.cols || cy >= cur.rows) return false;
    if (cur.solid[cy * cur.cols + cx] || cur.path[cy * cur.cols + cx]) return false;
  }
  return true;
};
/* ================= pavimento: terra batida, calçamento de pedras e areia =================
   As ruas não são pintadas retângulo por retângulo: cada uma marca uma máscara do mapa
   (1 terra, 2 pedra, 3 areia) e paveFlush() pinta tudo de uma vez, pixel a pixel, com
   texturas que dependem só da posição no mundo. Assim os trechos ligados continuam o mesmo
   padrão, cruzamentos e curvas não têm emendas e nada muda de um quadro para o outro. */
const PAVE = { terra: 1, pedra: 2, areia: 3, centro: 4 };
let dummyG = null;
/* Mantém o sorteio do cenário igual ao de antes (árvores e arbustos nos mesmos lugares). */
function spendRand(fn) { if (!dummyG) { const c = document.createElement('canvas'); c.width = c.height = 1; dummyG = c.getContext('2d'); } const prev = g; g = dummyG; try { fn(); } finally { g = prev; } }
function paveBox(x0, y0, x1, y1) { const b = cur.paveBox || (cur.paveBox = [1e9, 1e9, -1e9, -1e9]); b[0] = Math.min(b[0], x0); b[1] = Math.min(b[1], y0); b[2] = Math.max(b[2], x1); b[3] = Math.max(b[3], y1); }
function paveRect(kind, x, y, w, h) {
  if (!cur.pave) cur.pave = new Uint8Array(W * H);
  const k = PAVE[kind] || 1, x0 = Math.max(0, Math.round(x)), y0 = Math.max(0, Math.round(y)), x1 = Math.min(W, Math.round(x + w)), y1 = Math.min(H, Math.round(y + h));
  for (let yy = y0; yy < y1; yy++) cur.pave.fill(k, yy * W + x0, yy * W + x1);
  paveBox(x0, y0, x1, y1);
}
function paveDisc(kind, cx, cy, r) { for (let dy = -r; dy <= r; dy++) { const w = Math.round(Math.sqrt(r * r - dy * dy)); paveRect(kind, Math.round(cx) - w, Math.round(cy) + dy, w * 2 + 1, 1); } }
const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
const vnoise = (x, y, s, seed) => {                                  // ruído suave (manchas grandes, estáveis)
  const gx = Math.floor(x / s), gy = Math.floor(y / s), fx = x / s - gx, fy = y / s - gy, sm = t => t * t * (3 - 2 * t);
  const a = hash(gx, gy, seed), b = hash(gx + 1, gy, seed), c = hash(gx, gy + 1, seed), d = hash(gx + 1, gy + 1, seed), u = sm(fx), v = sm(fy);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};
const rgb = hex => { const n = parseInt(SC(hex).slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
/* ================= grama baixa: folhinhas em grupos =================
   Pintada uma vez por estação, pixel a pixel, só pela posição no mundo (nada de sorteio por quadro: a textura não
   "ferve" com a câmera e é igual em qualquer lugar onde for desenhada). Fundo em três tons (sombra, meio e luz) em
   manchas irregulares e suaves; por cima, folhinhas de 3 a 5 pixels (base escura, meio e ponta clara) numa grade
   desencontrada, com deslocamentos e falhas, para não formar fileiras nem emendas de ladrilho. */
const mixRGB = (a, b2, k) => a.map((v, j) => Math.round(v + (b2[j] - v) * k));
function grassPal() {
  const c = rgb, P = { deep: c('#2f7028'), dark: c('#3a7e2c'), mdk: c('#468c32'), mid: c('#4f9c38'), base: c('#58a83c'), lite: c('#63b444'), hi: c('#78c452') };
  P.bg = [mixRGB(P.mdk, P.dark, 0.5), mixRGB(P.mid, P.mdk, 0.5), P.mid];                           // fundo (vãos entre as folhas): sombra, meio e luz
  P.leaf = [[P.deep, P.mid, P.base], [P.dark, P.base, P.lite], [P.mdk, P.lite, P.hi]];             // [sombra, corpo, ponta] por tom
  if (paintSeason === 3) P.bg = [mixRGB(P.mid, P.mdk, 0.35), P.mid, P.base];                        // neve: tons suaves, sem manchas escuras
  return P;
}
const grassLevel = (x, y) => { const n = vnoise(x, y, 30, 601) * 0.7 + vnoise(x, y, 8, 602) * 0.3; return n < 0.4 ? 0 : n > 0.6 ? 2 : 1; };
/* formas das folhas (apontam para cima): [dx, dy, papel] — 0 sombra embaixo, 1 corpo, 2 ponta iluminada */
const LEAVES = [
  [[0, 0, 2], [4, 0, 2], [0, 1, 1], [2, 1, 2], [4, 1, 1], [1, 2, 1], [2, 2, 1], [3, 2, 1], [1, 3, 0], [2, 3, 0], [3, 3, 0]],   // tufo de três folhas
  [[0, 0, 2], [2, 0, 2], [0, 1, 1], [2, 1, 1], [1, 2, 1], [0, 3, 0], [1, 3, 0], [2, 3, 0]],                                   // duas folhas em "v"
  [[2, 0, 2], [1, 1, 1], [2, 1, 1], [1, 2, 1], [0, 3, 0], [1, 3, 0]],                                                         // folha caída para a direita
  [[0, 0, 2], [0, 1, 1], [1, 1, 1], [1, 2, 1], [1, 3, 0], [2, 3, 0]],                                                         // folha caída para a esquerda
  [[1, 0, 2], [1, 1, 1], [0, 2, 2], [1, 2, 1], [2, 2, 1], [0, 3, 0], [1, 3, 0], [2, 3, 0]],                                   // folha em pé com folhinha ao lado
];
function grassBake(x0, y0, w, h) {
  const img = g.getImageData(x0, y0, w, h), D = img.data, P = grassPal(), winter = paintSeason === 3;
  const lv = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const L = grassLevel(x + x0, y + y0), i = (y * w + x) * 4, c = P.bg[L]; lv[y * w + x] = L;
    D[i] = c[0]; D[i + 1] = c[1]; D[i + 2] = c[2]; D[i + 3] = 255;
  }
  const CW = 5, CH = 4;
  for (let cy = Math.floor(y0 / CH) - 1; cy <= Math.ceil((y0 + h) / CH); cy++) for (let cx = Math.floor(x0 / CW) - 2; cx <= Math.ceil((x0 + w) / CW); cx++) {
    const hs = k => hash(cx, cy, 610 + k);
    const ox = cx * CW + Math.floor(hash(cy, 0, 615) * 5) + Math.floor(hs(0) * 2), oy = cy * CH + Math.floor(hs(1) * 2) - 1;   // fileiras desencontradas
    const lx = ox - x0, ly = oy - y0, L = lx >= 0 && ly >= 0 && lx < w && ly < h ? lv[ly * w + lx] : grassLevel(ox, oy);
    if (hs(2) < (winter ? 0.75 : [0.1, 0.16, 0.24][L])) continue;                 // falhas: respiro entre as folhas
    const shape = LEAVES[Math.floor(hs(3) * LEAVES.length)], col = P.leaf[winter ? 2 : L];
    for (const [dx, dy, role] of shape) {
      const px = lx + dx, py = ly + dy; if (px < 0 || py < 0 || px >= w || py >= h) continue;
      const i = (py * w + px) * 4, c = col[role]; D[i] = c[0]; D[i + 1] = c[1]; D[i + 2] = c[2];
    }
  }
  g.putImageData(img, x0, y0);
}
/* ================= mato alto =================
   Tufos com altura (5 a 8 px): folhas sobrepostas (as de trás mais escuras), pontas iluminadas e base sombreada.
   Ficam em grupinhos irregulares de 2 a 4, com espaço livre entre os grupos: rente às margens dos caminhos, junto às
   construções e cercas e, mais raros, no meio dos gramados. Só enfeite pintado no fundo: não bloqueia, não é coletável,
   não cai em caminhos, rotas dos moradores, portas, placas nem objetos (só onde o fundo ainda é grama). */
function tallGrassPatch(D, x0, y0, w, h, okPx) {
  const P = grassPal(), winter = paintSeason === 3;
  const mine = new Uint8Array(w * h);                                         // pixels já pintados por outros tufos (podem se sobrepor)
  const put = (x, y, c) => { const j = (y - y0) * w + (x - x0), i = j * 4; D[i] = c[0]; D[i + 1] = c[1]; D[i + 2] = c[2]; mine[j] = 1; };
  const OUTG = winter ? [150, 166, 182] : mixRGB(P.deep, [16, 34, 18], 0.55);
  const tuft = (bx, by, v) => {
    const hs = k => hash(bx, by, 700 + k), hw = 3 + Math.floor(hs(0) * 2), ht = 8 + Math.floor(hs(1) * 4), tilt = hs(2) < 0.5 ? 0 : hs(2) < 0.75 ? -1 : 1;
    // altura de cada coluna: cúpula com pontas desencontradas (folhas sobrepostas)
    const top = {};
    for (let x = -hw; x <= hw; x++) {
      const f = 1 - Math.pow(Math.abs(x - tilt * 0.6) / (hw + 1), 2), spike = (x + hw + (hs(3) < 0.5 ? 0 : 1)) % 2 ? 0 : 1 + Math.floor(hash(bx + x, by, 705) * 3);
      top[x] = Math.max(2, Math.round(ht * f * (0.62 + 0.18 * hash(bx + x, by, 706))) + spike);
    }
    const inT = (x, y) => top[x] !== undefined && y <= by && y >= by - top[x] + 1;
    for (let x = -hw - 1; x <= hw + 1; x++) for (let y = by - ht - 3; y <= by + 1; y++) if (!mine[(y - y0) * w + (bx + x - x0)] && !okPx(bx + x, y)) return false;   // só sobre grama (ou sobre outro tufo do grupo)
    for (let x = -hw; x <= hw; x++) { const i = ((by + 1 - y0) * w + (bx + x - x0)) * 4; put(bx + x, by + 1, [D[i], D[i + 1], D[i + 2]].map(c => Math.round(c * 0.72))); }   // sombra na base
    for (let x = -hw - 1; x <= hw + 1; x++) for (let y = by - ht - 3; y <= by; y++) {
      if (inT(x, y)) continue;
      if (inT(x, y + 1) || inT(x - 1, y) || inT(x + 1, y)) put(bx + x, y, OUTG);                        // contorno escuro (topo e lados)
    }
    for (let x = -hw; x <= hw; x++) for (let k = 0; k < top[x]; k++) {
      const y = by - k, rel = k / top[x], lit = x < 0 ? 1 : x > 1 ? -1 : 0;
      let c = rel < 0.28 ? P.deep : rel < 0.6 ? (lit > 0 ? P.mdk : P.dark) : (lit > 0 ? P.base : lit < 0 ? P.mdk : P.mid);
      if (k === top[x] - 1) c = lit > 0 ? P.hi : lit < 0 ? P.base : P.lite;                              // pontas iluminadas
      if (winter) c = k === top[x] - 1 ? [244, 248, 252] : c;
      put(bx + x, y, c);
    }
    // nervuras: folhas que saem do centro para as pontas mais altas
    for (let x = -hw; x <= hw; x++) {
      if (!(top[x] > (top[x - 1] || 0) && top[x] >= (top[x + 1] || 0)) || top[x] < 4) continue;
      for (let k = 1; k < top[x] - 1; k++) { const xx = Math.round(x * k / top[x]); if (inT(xx, by - k)) put(bx + xx, by - k, x <= 0 ? P.lite : P.base); }
    }
    return true;
  };
  tuft.mine = mine;
  return tuft;
}
function tallGrass(nearFn, avoidFn) {
  const img = g.getImageData(0, 0, W, H), D = img.data, GS = grassColorSet();
  const isGrass = (x, y) => { if (x < 0 || y < 0 || x >= W || y >= H) return false; const i = (y * W + x) * 4; return GS.has((D[i] << 16) | (D[i + 1] << 8) | D[i + 2]); };
  const cellFree = (x, y) => { const c = Math.floor(x / CELL), r = Math.floor(y / CELL); if (c < 0 || r < 0 || c >= cur.cols || r >= cur.rows) return false; const i = r * cur.cols + c; return !cur.path[i] && !cur.solid[i]; };
  const okPx = (x, y) => isGrass(x, y) && cellFree(x, y) && !(cur.pave && cur.pave[y * W + x]);
  const tuft = tallGrassPatch(D, 0, 0, W, H, okPx);
  let n = 0;
  for (let gy = 30; gy < H - 16; gy += 11) for (let gx = 12; gx < W - 12; gx += 13) {
    const x = gx + Math.floor(hash(gx, gy, 720) * 9) - 4, y = gy + Math.floor(hash(gx, gy, 721) * 7) - 3;
    if (avoidFn(x, y) || !cellFree(x, y)) continue;
    const near = nearFn(x, y), clump = vnoise(x, y, 34, 722);
    if (clump < 0.42) continue;                                             // áreas livres entre os grupos
    if (hash(gx, gy, 723) > (near ? 0.42 : clump > 0.7 ? 0.16 : 0.012)) continue;
    const k = 2 + Math.floor(hash(gx, gy, 724) * 3);                       // grupinho irregular de 2 a 4 tufos encostados
    for (let q = 0; q < k; q++) if (tuft(x + Math.round((hash(gx, gy, 725 + q) - 0.5) * 14), y + Math.round((hash(gx, gy, 730 + q) - 0.5) * 6), q)) n++;
  }
  g.putImageData(img, 0, 0);
  const cells = new Set(); for (let i = 0; i < tuft.mine.length; i++) if (tuft.mine[i]) cells.add(Math.floor(Math.floor(i / W) / CELL) * cur.cols + Math.floor((i % W) / CELL));
  cur.tallGrassCells = [...cells];
  return n;
}
/* Cores da grama (para saber, depois, se um pixel do fundo ainda é grama). */
function grassColorSet() {
  const P = grassPal(), s = new Set(), k = c => (c[0] << 16) | (c[1] << 8) | c[2];
  P.bg.forEach(c => s.add(k(c))); P.leaf.forEach(l => l.forEach(c => s.add(k(c)))); return s;
}
/* Pedras do calçamento: grade com sorteio estável e peças irregulares (a mais próxima de cada ponto). */
function cobbleAt(x, y) {
  const cw = 7, ch = 6, ry = Math.floor(y / ch);
  let d1 = 1e9, d2 = 1e9, id = 0, sy = 0;
  for (let j = ry - 1; j <= ry + 1; j++) {
    const off = (j & 1) ? cw / 2 : 0, rx = Math.floor((x - off) / cw);
    for (let i = rx - 1; i <= rx + 1; i++) {
      const px = i * cw + off + 1.5 + hash(i, j, 3) * (cw - 3), py = j * ch + 1.2 + hash(i, j, 4) * (ch - 2.4);
      const d = Math.hypot((x + 0.5 - px) * 0.95, (y + 0.5 - py) * 1.12);
      if (d < d1) { d2 = d1; d1 = d; id = hash(i, j, 5); sy = py; } else if (d < d2) d2 = d;
    }
  }
  return { gap: d2 - d1, id, up: y + 0.5 - sy };
}
/* Calçamento antigo do centrinho (frente do Armazém CELESTE e praça da fonte): fileiras desencontradas de
   pedras pequenas, de cantos gastos, alinhadas pelas coordenadas do mundo (sem emendas entre os trechos). */
const SETT_H = 5, SETT_W = 6;
const settEdge = (i, r, off) => i * SETT_W + off + Math.floor(hash(i, r, 52) * 3) - 1;
function settAt(x, y) {
  const r = Math.floor(y / SETT_H), ly = y - r * SETT_H, off = ((r & 1) ? 3 : 0) + Math.floor(hash(r, 0, 51) * 2);
  let i = Math.floor((x - off) / SETT_W);
  if (x < settEdge(i, r, off)) i--; else if (x >= settEdge(i + 1, r, off)) i++;
  const b0 = settEdge(i, r, off), sw = settEdge(i + 1, r, off) - b0;
  return { lx: x - b0, ly, sw, id: hash(i, r, 53), id2: hash(i, r, 54), id3: hash(i, r, 56), id4: hash(i, r, 57) };
}
function paveFlush() {
  const b = cur.paveBox; if (!b || !cur.pave) return; cur.paveBox = null;
  const M = cur.pave, x0 = Math.max(0, b[0] - 4), y0 = Math.max(0, b[1] - 4), x1 = Math.min(W, b[2] + 4), y1 = Math.min(H, b[3] + 4), w = x1 - x0, h = y1 - y0;
  if (w <= 0 || h <= 0) return;
  const img = g.getImageData(x0, y0, w, h), D = img.data, S = paintSeason;
  const T = { base: rgb('#dcc48c'), dark: rgb('#c8ac70'), edge: rgb('#b4945a'), light: rgb('#f0e0b0') };
  const peb = [[160, 144, 124], [192, 178, 158], [128, 108, 86]];
  // terra dos caminhos: ocre quente (variações bem próximas da base); no inverno, a terra fica sob a neve
  const TR = S === 3 ? { base: T.base, v1: T.dark, v2: T.light, edge: T.edge, shade: T.base.map(v => Math.round(v * 0.9)) }
    : { base: [214, 164, 96], v1: [202, 152, 88], v2: [226, 180, 114], edge: [192, 142, 80], shade: [190, 140, 82] };
  const STONE = [[204, 190, 164], [186, 176, 158], [196, 172, 140], [214, 202, 178], [178, 160, 138]], JOINT = [118, 102, 82], CURB = [[150, 138, 118], [170, 158, 136], [104, 90, 72]];
  const SETT = [[204, 188, 160], [194, 180, 156], [186, 172, 150], [200, 180, 150], [182, 172, 158], [196, 184, 166]], SETT_J = [150, 132, 110], SETT_CURB = [[178, 166, 144], [168, 157, 137]];
  const mixC = (a, b2, k) => a.map((v, j) => Math.round(v + (b2[j] - v) * k));
  const SAND = { base: [236, 212, 154], edge: [200, 168, 104], s1: [244, 226, 180], s2: [255, 240, 200] };
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : M[y * W + x]);
  const put = (i, c) => { D[i] = c[0]; D[i + 1] = c[1]; D[i + 2] = c[2]; D[i + 3] = 255; };
  const shadeC = (c, k) => c.map(v => Math.max(0, Math.min(255, Math.round(v * k))));
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const k = M[y * W + x]; if (!k) continue;
    const i = ((y - y0) * w + (x - x0)) * 4;
    // distância até a grama (0 = pavimento algum) e até outro tipo de piso, em até 3 px
    let dG = 9, dO = 9, d4 = 9;
    for (let oy = -3; oy <= 3; oy++) for (let ox = -3; ox <= 3; ox++) {
      const d = Math.max(Math.abs(ox), Math.abs(oy)); if (!d || (d >= dG && d >= dO)) continue;
      const m = at(x + ox, y + oy); if (!m) { if (d < dG) dG = d; } else if (m !== k && d < dO) { dO = d; if (m === 4) d4 = d; } else if (m === 4 && m !== k && d < d4) d4 = d;
    }
    const n = vnoise(x, y, 5, 7), hh = hash(x, y, 11);
    if (k === 1) {                                                   // ---------- terra batida ----------
      // borda irregular: a grama entra até 3 px em recortes (ondas largas com dentes menores), nunca em linha reta
      const e = vnoise(x, y, 9, 43) * 0.65 + vnoise(x, y, 3, 44) * 0.35;
      if ((dG === 1 && e < 0.5) || (dG === 2 && e < 0.32) || (dG === 3 && e < 0.14)) continue;
      let c = TR.base;
      // textura delicada: marquinhas de 1–2 px em células de 5 px, só em grupos (com áreas lisas entre eles)
      const cx5 = Math.floor(x / 5), cy5 = Math.floor(y / 5), lx5 = x - cx5 * 5, ly5 = y - cy5 * 5, mk = hash(cx5, cy5, 640);
      if (vnoise(x, y, 16, 641) > 0.46 && mk < 0.55) {
        const kind = Math.floor(mk * 6) % 3, ox = 1 + Math.floor(hash(cx5, cy5, 642) * 2), oy = 1 + Math.floor(hash(cx5, cy5, 643) * 3);
        if (kind === 0 && ly5 === oy && (lx5 === ox || lx5 === ox + 1)) c = TR.v1;
        else if (kind === 1 && lx5 === ox && ly5 === oy) c = TR.v2; else if (kind === 1 && lx5 === ox && ly5 === oy + 1) c = TR.v1;
        else if (kind === 2 && ((lx5 === ox && ly5 === oy) || (lx5 === ox + 1 && ly5 === oy + 1))) c = TR.v1;
      }
      // pedrinhas ocasionais, em grupinhos de 1 a 3 (2×1 com luz em cima e sombra embaixo)
      const cp = Math.floor(x / 23), rp = Math.floor(y / 19);
      if (hash(cp, rp, 650) < 0.3) for (let q = 0; q < 1 + Math.floor(hash(cp, rp, 651) * 3); q++) {
        const px = cp * 23 + 3 + Math.floor(hash(cp, rp, 652 + q) * 16), py = rp * 19 + 3 + Math.floor(hash(cp, rp, 656 + q) * 12), big = hash(cp, rp, 660 + q) < 0.35;
        if (y === py && x >= px && x <= px + (big ? 2 : 1)) c = x === px ? peb[1] : peb[0];
        else if (y === py + 1 && x >= px && x <= px + (big ? 2 : 1)) c = peb[2];
      }
      if (dG === 1 || (dG === 2 && e < 0.5)) c = mixC(c, TR.edge, 0.4);                         // borda um pouco mais escura, sem contorno
      if (at(x, y - 1) === 0 || (at(x, y - 2) === 0 && e < 0.6)) c = mixC(c, TR.shade, 0.8);     // sombra suave sob a grama de cima
      if (S === 2 && hash(x, y, 17) < 0.006) c = hash(x, y, 18) < 0.5 ? [200, 88, 30] : [138, 58, 24];
      if (d4 === 1) c = n < 0.5 ? shadeC(TR.v1, 0.94) : TR.v1;      // terra encostada nas pedras do centrinho
      else if (d4 === 2 && n < 0.25) c = TR.v1;
      put(i, c);
    } else if (k === 4) {                                            // ---------- calçamento do centrinho ----------
      const e = Math.min(dG, dO);
      if (e <= 3) {                                                  // contorno: pedras alongadas, juntas finas
        const horiz = [1, 2, 3].some(dd => dd <= e && (at(x, y - dd) !== 4 || at(x, y + dd) !== 4)), a = horiz ? x : y;
        if (dG <= 2) {                                               // borda com a grama: falhas e tufos, sem recorte reto
          if ((dG === 1 && vnoise(x, y, 5, 71) < 0.4) || (dG === 2 && vnoise(x, y, 5, 71) < 0.16)) continue;
          const sg = Math.floor(a / 13), ta = sg * 13 + 2 + Math.floor(hash(sg, horiz ? 1 : 2, 73) * 9);
          if (hash(sg, horiz ? 1 : 2, 72) < 0.4 && Math.abs(a - ta) <= 1 && (a === ta ? dG <= 2 : dG === 1)) { put(i, shadeC([D[i], D[i + 1], D[i + 2]], a === ta ? 0.8 : 0.9)); continue; }
        }
        if (e === 3) { put(i, hh < 0.5 ? SETT_J : shadeC(SETT_J, 1.05)); continue; }
        const seg = Math.floor((a + 2) / 8);
        if ((a + 2) % 8 === 7) { put(i, SETT_J); continue; }
        let c = SETT_CURB[hash(seg, horiz ? 3 : 4, 74) < 0.5 ? 0 : 1];
        const ca = (a + 2) % 8; if (ca === 0 || ca === 6) c = mixC(c, SETT_J, e === 1 ? 0.5 : 0.25);   // pontas gastas
        c = shadeC(c, e === 1 ? 0.92 : 1.04);
        if (S === 3 && e === 2 && hash(x, y, 19) < 0.5) c = [240, 244, 250];
        put(i, c); continue;
      }
      const st = settAt(x, y);
      if (st.lx === st.sw - 1 || st.ly === SETT_H - 1) { put(i, hh < 0.5 ? SETT_J : shadeC(SETT_J, 0.96)); continue; }
      // peças um pouco menores aqui e ali (topo ou lado recolhido): fileiras menos certinhas
      const top = st.id3 < 0.28 ? 1 : 0, right = st.sw > 5 && st.id4 < 0.3 ? st.sw - 3 : st.sw - 2;
      if (st.ly < top || st.lx > right) { put(i, shadeC(SETT_J, 1.06)); continue; }
      let c = st.id2 < 0.07 ? [168, 152, 130] : st.id2 > 0.94 ? [216, 204, 180] : SETT[Math.floor(st.id * SETT.length)];
      c = shadeC(c, (0.95 + 0.1 * st.id4) * (0.97 + 0.06 * vnoise(x, y, 23, 61)));
      const cx = st.lx === 0 || st.lx === right, cy = st.ly === top || st.ly === SETT_H - 2;
      if (cx && cy) c = mixC(c, SETT_J, 0.6);                        // cantos gastos, arredondados
      else if (st.ly === top) c = shadeC(c, 1.06);                   // luz discreta em cima
      else if (st.ly === SETT_H - 2) c = shadeC(c, 0.91);            // sombra suave embaixo
      else if (hash(x, y, 55) < 0.03) c = shadeC(c, 0.94);
      if (S === 3 && st.ly === top && hash(x, y, 19) < 0.55) c = [240, 244, 250];
      if (S === 2 && hash(x, y, 17) < 0.003) c = [200, 88, 30];
      put(i, c);
    } else if (k === 2) {                                            // ---------- calçamento de pedras ----------
      if (dG <= 2 || dO <= 1) {                                       // meio-fio: pedras de contorno, alongadas
        const along = (dG <= 2 && (at(x, y - dG) === 0 || at(x, y + dG) === 0)) || (dO <= 1 && (at(x, y - 1) !== 2 || at(x, y + 1) !== 2)) ? x : y;
        const ring = Math.min(dG, dO + 1), seg = Math.floor((along + (ring === 1 ? 0 : 3)) / 6);
        if (ring === 1) { put(i, (along % 6 === 5) ? CURB[2] : shadeC(CURB[hash(seg, 1, 41) < 0.5 ? 0 : 1], 0.92)); continue; }
        put(i, (along + 3) % 6 === 5 ? CURB[2] : CURB[hash(seg, 2, 41) < 0.5 ? 1 : 0]); continue;
      }
      const s = cobbleAt(x, y);
      if (s.gap < 1.05) { put(i, hh < 0.5 ? JOINT : shadeC(JOINT, 1.08)); continue; }
      let c = STONE[Math.floor(s.id * STONE.length)];
      if (s.gap < 2.2 && s.up < -0.6) c = shadeC(c, 1.12);             // luz em cima
      else if (s.gap < 2.2 && s.up > 0.9) c = shadeC(c, 0.84);         // sombra embaixo
      else if (hh < 0.06) c = shadeC(c, 0.95);
      if (S === 3 && s.up < 0.2 && hash(x, y, 19) < 0.45) c = [240, 244, 250];
      if (S === 2 && hash(x, y, 17) < 0.004) c = [200, 88, 30];
      put(i, c);
    } else {                                                         // ---------- areia ----------
      if (dG === 1 && n < 0.2) continue;
      if (dG === 1) { put(i, SAND.edge); continue; }
      let c = SAND.base; if (hh < 0.05) c = SAND.s1; else if (hh < 0.06) c = SAND.s2; else if (hh > 0.995) c = SAND.edge;
      if (S === 3 && hash(x, y, 19) < 0.3) c = [240, 244, 250];
      put(i, c);
    }
  }
  // pontas de folha da grama avançando sobre a beira da terra (e, mais curtas, sobre a borda das pedras): sem corte reto
  const GP = grassPal();
  for (let y = y0 + 1; y < y1 - 1; y++) for (let x = x0 + 1; x < x1 - 1; x++) {
    if (M[y * W + x]) continue;
    const below = at(x, y + 1), above = at(x, y - 1), left = at(x - 1, y), right = at(x + 1, y), kk = below || above || left || right;
    if (!kk || kk === 3 || hash(x, y, 670) > (kk === 1 ? 0.34 : 0.12)) continue;
    const col = GP.leaf[S === 3 ? 2 : grassLevel(x, y)], len = kk === 1 ? 1 + Math.floor(hash(x, y, 671) * 3) : 1;
    const dx = below || above ? 0 : left ? -1 : 1, dy = below ? 1 : above ? -1 : 0, bend = hash(x, y, 672) < 0.5 ? 0 : hash(x, y, 673) < 0.5 ? -1 : 1;
    for (let s2 = 1; s2 <= len; s2++) {
      const px = x + dx * s2 + (dy && s2 === len && len > 1 ? bend : 0), py = y + dy * s2;
      if (px < x0 || py < y0 || px >= x1 || py >= y1 || !at(px, py)) break;
      put(((py - y0) * w + (px - x0)) * 4, s2 === len ? col[2] : col[1]);
    }
  }
  g.putImageData(img, x0, y0);
}
