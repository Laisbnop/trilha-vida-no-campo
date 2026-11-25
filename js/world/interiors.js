/* Mundo — interiores: piso e paredes, o Armazém CELESTE por dentro e os cômodos.
   Parte de js/world/ (antes era js/world.js). São scripts comuns, carregados em ordem pelo index.html:
   as declarações de nível superior valem para todos os arquivos (não são módulos). O objeto World,
   com as funções públicas, é montado no fim, em js/world/index.js. */

/* ================= interiores ================= */
const ST = {
  shelf(x, w) { box(x, 44, w, 46, '#8a5e36'); for (let r = 0; r < 3; r++) { R(x + 2, 48 + r * 14, w - 4, 10, '#5a3a22'); for (let i = 0; i + 6 <= w - 6; i += 7) box(x + 4 + i, 50 + r * 14, 4, 7, ['#c8483a', '#e0a23a', '#58b858', '#3f86d0', '#f0e6cc', '#8a5ad9'][(i + r * 3) % 6]); } },
  stove(x, w) { box(x, 62, w, 28, '#b8b8c4'); R(x, 62, w, 5, '#3a3a44'); box(x + 5, 56, 12, 8, '#7a7a8a'); R(x + 6, 57, 10, 2, '#c8642a'); box(x + 4, 74, w - 8, 12, '#2a2a34'); R(x + 6, 76, w - 12, 2, '#e88a3a'); },
  wardrobe(x, w) { box(x, 34, w, 56, '#8a5e36'); R(x, 34, w, 3, '#b88448'); R(x + w / 2 - 1, 38, 2, 50, '#5a3a22'); box(x + 3, 42, w / 2 - 6, 34, '#bfe4ff'); R(x + 5, 44, 3, 12, '#ffffff'); R(x + w - 6, 62, 2, 4, '#ffd75e'); R(x + w / 2 + 3, 44, w / 2 - 8, 1, '#5a3a22'); },
  crate(x, w) { for (let i = 0; i + 16 <= w; i += 17) { box(x + i, 72, 16, 18, '#b88448'); R(x + i, 80, 16, 1, '#7a5028'); R(x + i + 7, 72, 2, 18, '#7a5028'); if (i % 2 === 0) box(x + i + 1, 58, 14, 13, '#c89858'); } },
};
const FLOOR = {
  table(x, y, w = 30) { box(x, y - 12, w, 12, '#b88448'); R(x, y - 12, w, 3, '#d8a868'); R(x + 2, y, 3, 4, '#6a4426'); R(x + w - 5, y, 3, 4, '#6a4426'); solid(x, y - 12, w, 14); },
  rug(x, y, w, h, c) { R(x, y, w, h, shade(c, 0.7)); R(x + 2, y + 2, w - 4, h - 4, c); R(x + 5, y + 5, w - 10, h - 10, shade(c, 1.2)); },
  plant(x, y) { box(x, y - 8, 8, 8, '#b0603a'); blob(x + 4, y - 13, 6, '#143c24'); blob(x + 4, y - 13, 5, '#2f8a40'); blob(x + 2, y - 15, 2, '#58b858'); solid(x, y - 6, 8, 6); },
  bed(x, y, c) { box(x, y - 30, 22, 30, '#8a5e36'); R(x + 2, y - 28, 18, 26, c); box(x + 3, y - 28, 16, 8, '#ffffff'); R(x + 2, y - 18, 18, 2, shade(c, 0.75)); solid(x, y - 30, 22, 30); },
  chest(x, y) { box(x, y - 12, 18, 12, '#8a5e36'); R(x, y - 12, 18, 4, '#b88448'); R(x + 8, y - 8, 2, 3, '#ffd75e'); R(x, y - 7, 18, 1, '#5a3a22'); solid(x, y - 12, 18, 12); },
};

/* ================= Armazém CELESTE por dentro =================
   Mercadinho de 304×208: parede com papel de parede e lambri, balcão com caixa no canto
   superior esquerdo, duas fileiras de gôndolas no centro e à direita, caixotes, sacos,
   mural de avisos, plantas e tapete na entrada. Móveis altos são sprites (o personagem
   passa atrás deles), e só a base de cada um bloqueia. */
const LOJA = { w: 304, h: 208, wallH: 62, keeper: [52, 76] };
function jar(x, y, c, lid = '#c8b8a0') { R(x - 1, y - 1, 6, 9, OUT); R(x, y + 1, 4, 6, c); R(x, y + 1, 1, 6, shade(c, 1.35)); R(x, y, 4, 1, lid); R(x + 1, y + 3, 2, 2, '#f4ecd8'); }
function bottle(x, y, c) { R(x, y - 1, 2, 2, OUT); R(x - 1, y + 1, 4, 8, OUT); R(x, y + 2, 2, 6, c); R(x, y + 2, 1, 6, shade(c, 1.4)); R(x, y + 5, 2, 1, '#f4ecd8'); }
function boxPack(x, y, c) { R(x - 1, y - 1, 7, 9, OUT); R(x, y, 5, 7, c); R(x, y, 5, 2, shade(c, 1.25)); R(x + 1, y + 3, 3, 2, '#f4ecd8'); }
function sack(x, y, c, tag) {
  R(x - 1, y - 1, 18, 17, OUT); R(x, y + 2, 16, 13, c); R(x + 1, y, 14, 3, shade(c, 0.85)); R(x + 6, y - 2, 4, 3, shade(c, 0.7)); R(x + 6, y - 3, 4, 1, OUT);
  R(x + 1, y + 3, 2, 11, shade(c, 1.15)); R(x + 13, y + 4, 2, 10, shade(c, 0.82)); if (tag) { R(x + 4, y + 6, 8, 6, '#f4ecd8'); R(x + 5, y + 7, 6, 4, tag); }
}
/* Gôndola (prateleira dupla) vista de frente: topo com mercadorias e três prateleiras abastecidas. */
function gondola(x, base, w) {
  const top = base - 30;
  shadowOval(x + w / 2, base + 1, w / 2 + 2, 3);
  R(x - 1, top - 9, w + 2, 40, OUT);
  R(x, top - 8, w, 7, '#efe8f4'); R(x, top - 8, w, 1, '#ffffff'); R(x, top - 2, w, 2, '#b8a8c8');                 // tampo
  for (let i = 2; i < w - 6; i += 9) { const k = (i / 9 | 0) % 4; if (k === 0) bottle(x + i + 1, top - 15, '#c8402e'); else if (k === 1) boxPack(x + i, top - 14, '#d8a868'); else if (k === 2) { R(x + i - 1, top - 13, 9, 7, OUT); R(x + i, top - 12, 7, 5, '#5ac0c8'); R(x + i + 1, top - 12, 5, 1, '#9ae8ec'); R(x + i + 3, top - 15, 1, 3, '#3f9648'); } else jar(x + i + 1, top - 15, '#f0d040'); }
  R(x, top, w, 30, '#e4dcec'); R(x, top, 2, 30, '#ffffff'); R(x + w - 2, top, 2, 30, '#a898b8');
  const cols = ['#c8402e', '#3f86d0', '#58b858', '#f0a020', '#e8e0c8', '#8a5ad9', '#e0607a'];
  for (let s = 0; s < 3; s++) {
    const sy = top + 2 + s * 9;
    R(x + 2, sy, w - 4, 7, '#4a3a58'); R(x + 2, sy + 7, w - 4, 2, '#cfc4dc'); R(x + 2, sy + 7, w - 4, 1, '#ffffff');
    for (let i = 3; i < w - 5; i += 3) { const c = cols[(i * 3 + s * 5 + x) % cols.length], hh = 3 + ((i + s) % 3); R(x + i, sy + 7 - hh, 2, hh, c); R(x + i, sy + 7 - hh, 1, 1, shade(c, 1.4)); }
  }
  R(x + 2, base - 1, w - 4, 1, '#8a7a98');
  cur.lights.push({ kind: 'glow', x: x + w / 2, y: top - 4, r: 10 });
}
function produceBin(x, y, w, c1, c2) {
  R(x - 1, y - 1, w + 2, 12, OUT); R(x, y + 4, w, 7, '#a8743e'); R(x, y + 4, w, 1, '#d8a868'); R(x, y + 8, w, 1, '#7a5028');
  for (let i = 0; i < w - 2; i += 3) { R(x + 1 + i, y + 1 + (i % 2), 3, 3, OUT); R(x + 1 + i, y + 1 + (i % 2), 2, 2, i % 6 < 3 ? c1 : c2); R(x + 1 + i, y + 1 + (i % 2), 1, 1, shade(c1, 1.4)); }
}
function buildLoja() {
  const m = newMap('loja', LOJA.w, LOJA.h, 29), WH = LOJA.wallH;
  // ---------- parede: papel de parede suave, faixa, lambri de madeira e rodapé ----------
  R(0, 0, W, 36, '#f4ead4'); for (let x = 4; x < W; x += 10) { R(x, 0, 3, 36, '#e6ecd8'); if (x % 20 === 4) for (let y = 6; y < 34; y += 10) { R(x + 6, y, 1, 1, '#e8a0a8'); R(x + 5, y + 1, 3, 1, '#c8d8b0'); } }
  R(0, 34, W, 3, '#8a5a32'); R(0, 34, W, 1, '#b88448');
  for (let x = 0; x < W; x += 6) { R(x, 37, 6, 21, '#c48a52'); R(x, 37, 1, 21, '#a06a3a'); R(x + 1, 37, 1, 21, '#d8a068'); }
  R(0, 56, W, 2, '#8a5a32'); R(0, 58, W, 4, '#5a3a22');
  // janelas no fundo, à direita
  [[236, 6], [270, 6]].forEach(([x, y]) => { R(x - 2, y - 2, 26, 28, OUT); R(x - 1, y - 1, 24, 26, '#f4f0e4'); R(x + 1, y + 1, 20, 22, '#9ad4f4'); R(x + 1, y + 1, 20, 6, '#c8ecff'); R(x + 11, y + 1, 1, 22, '#f4f0e4'); R(x + 1, y + 12, 20, 1, '#f4f0e4'); R(x + 1, y + 1, 4, 22, '#e8a0a8'); R(x + 17, y + 1, 4, 22, '#e8a0a8'); R(x - 3, y + 24, 28, 3, OUT); R(x - 2, y + 24, 26, 2, '#d8c8a8'); cur.lights.push({ kind: 'win', x: x + 1, y: y + 1, w: 20, h: 22 }); });
  // mural de avisos (cortiça com bilhetes)
  R(118, 6, 46, 28, OUT); R(119, 7, 44, 26, '#8a5a32'); R(121, 9, 40, 22, '#c89a62'); for (let i = 0; i < 30; i++) R(122 + rand() * 38, 10 + rand() * 20, 1, 1, '#a87a48');   // (6 px à direita: abre espaço para a escada)
  [[124, 11, '#f4f0e4'], [137, 13, '#f8e8a0'], [150, 10, '#c8f0e8'], [127, 21, '#f8c8d8'], [144, 22, '#f4f0e4']].forEach(([x, y, c]) => { R(x, y, 9, 8, c); R(x + 1, y + 3, 6, 1, '#8a8a98'); R(x + 1, y + 5, 4, 1, '#8a8a98'); R(x + 4, y - 1, 2, 2, '#e04a3a'); });
  obj({ id: 'mural-loja', kind: 'text', x: 141, y: 72, r: 16, hit: [116, 4, 50, 32], label: 'Mural de avisos', text: 'Bilhetes presos com tachinhas: "Vendo mudas de goiabeira", "Quem achou um chapéu velho no bosque?", "Ensaio no coreto, sábado à tarde".' });
  // porta da escada para a casa, no andar de cima (particular: só Dona Celeste e Caleb usam)
  R(95, 24, 21, 40, OUT); R(96, 25, 19, 39, '#8a5a32'); R(98, 27, 15, 37, '#2e2018');
  for (let i = 0; i < 6; i++) { const sy = 58 - i * 6, sx = 98 + i; R(sx, sy, 15 - i, 2, '#7a5634'); R(sx, sy, 15 - i, 1, '#a07448'); R(sx, sy + 2, 15 - i, 4, '#3a2a1e'); }   // degraus subindo
  R(112, 28, 1, 34, '#c89a62'); for (let y = 32; y < 62; y += 7) R(110, y, 2, 1, '#c89a62');     // corrimão
  R(95, 24, 21, 2, '#b88448'); R(96, 22, 19, 2, OUT); R(99, 18, 13, 5, '#f4ead4'); R(99, 18, 13, 5, OUT); R(100, 19, 11, 3, '#f8f0dc'); R(101, 20, 9, 1, '#8a8a98');   // plaquinha "Particular"
  obj({ id: 'escada-loja', kind: 'text', x: 105, y: 72, r: 14, hit: [95, 18, 21, 46], label: 'Escada (particular)', text: 'Na plaquinha: "Particular". A escada sobe para a casa da Dona Celeste e do Caleb, no andar de cima do Armazém.' });
  // cantinho do Caleb: mesinha com notebook e banquinho, ao lado do balcão (fora da circulação)
  bldSprite(108, 62, 22, 26, 82, () => {
    R(111, 70, 15, 7, OUT); R(112, 71, 13, 4, '#a8784a'); R(112, 71, 13, 1, '#c89a62'); R(112, 75, 13, 1, '#7a5230');
    R(113, 76, 2, 6, '#6a4426'); R(122, 76, 2, 6, '#6a4426');
    R(114, 69, 9, 3, '#2a2a34'); R(115, 69, 7, 1, '#5a5a6a'); R(118, 70, 1, 1, '#c8c6d0');            // notebook fechado (com adesivo)
  });
  solid(112, 72, 12, 8);
  bldSprite(96, 76, 16, 12, 85, () => { R(99, 79, 11, 3, OUT); R(100, 79, 9, 2, '#8a5a32'); R(100, 82, 1, 4, '#6a4426'); R(108, 82, 1, 4, '#6a4426'); });   // banquinho
  obj({ id: 'mesa-caleb', kind: 'text', x: 118, y: 86, r: 12, hit: [110, 66, 18, 18], label: 'Mesinha com notebook', text: 'Uma mesinha com um notebook cheio de adesivos e um fone enrolado em cima. É o cantinho do Caleb.' });
  // cartaz de frutas e relógio
  R(166, 8, 28, 24, OUT); R(167, 9, 26, 22, '#f8f0dc'); [[170, 12, '#e04a3a'], [178, 12, '#f0a020'], [186, 12, '#58b858'], [170, 20, '#8a5ad9'], [178, 20, '#ffe066'], [186, 20, '#e0607a']].forEach(([x, y, c]) => { R(x, y, 5, 5, OUT); R(x + 1, y + 1, 3, 3, c); }); R(170, 27, 20, 1, '#8a8a98');
  R(204, 10, 14, 14, OUT); R(205, 11, 12, 12, '#f4f0e4'); R(210, 13, 1, 5, OUT); R(210, 17, 4, 1, OUT); R(205, 11, 12, 1, '#c8a060');
  // prateleira de parede com potes, sobre o balcão
  R(10, 18, 78, 3, OUT); R(11, 18, 76, 2, '#8a5a32'); [14, 24, 34, 44, 54, 64, 74].forEach((x, i) => jar(x, 10, ['#e04a3a', '#f0d040', '#58b858', '#e8a050', '#c8a0ff', '#f4ecd8', '#e0607a'][i]));
  // ---------- piso de tábuas com variação discreta ----------
  for (let y = WH, r = 0; y < H; y += 8, r++) for (let x = -((r * 13) % 32), c = 0; x < W; x += 32, c++) {
    const k = (r * 7 + c * 3) % 5, col = ['#c8925a', '#c08a52', '#cc985e', '#bc8650', '#c48e56'][k];
    R(x, y, 32, 8, col); R(x, y, 32, 1, shade(col, 1.12)); R(x, y + 7, 32, 1, '#8a5a32'); R(x + 31, y, 1, 8, '#8a5a32');
    if ((r + c) % 3 === 0) R(x + 8 + (c * 5) % 14, y + 3, 4, 1, shade(col, 0.86)); if ((r * c) % 7 === 1) R(x + 20, y + 4, 1, 1, '#6a4426');
  }
  g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(0, WH, W, 3);
  // luz quente das luminárias no piso
  g.fillStyle = 'rgba(255,220,150,.10)'; [[60, 104], [160, 136], [250, 136]].forEach(([cx, cy]) => { for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(cx, cy, 34 - k * 10, 16 - k * 5, 0, 0, Math.PI * 2); g.fill(); } });
  [[60, 40], [160, 40], [250, 40]].forEach(([x, y]) => cur.lights.push({ kind: 'glow', x, y: y + 30, r: 40 }));
  // ---------- tapete da entrada ----------
  const cx = W / 2;
  R(cx - 24, H - 34, 48, 26, OUT); R(cx - 23, H - 33, 46, 24, '#a8402e'); R(cx - 20, H - 30, 40, 18, '#c8683a'); R(cx - 17, H - 27, 34, 12, '#a8402e');
  for (let i = 0; i < 34; i += 4) { R(cx - 17 + i, H - 22, 2, 2, '#f0c050'); } R(cx - 23, H - 33, 46, 1, '#d8885a');
  // ---------- balcão de atendimento (canto superior esquerdo) com caixa registradora ----------
  bldSprite(4, 44, 96, 56, 96, () => {
    R(9, 67, 86, 30, OUT); R(10, 68, 84, 9, '#f0e8f4'); R(10, 68, 84, 1, '#ffffff'); R(10, 76, 84, 1, '#b8a8c8');
    R(10, 77, 84, 19, '#7a9aa8'); R(10, 77, 84, 2, '#5a7a88'); for (let x = 14; x < 90; x += 20) { R(x, 81, 15, 12, '#6a8a98'); R(x, 81, 15, 1, '#8ab0c0'); }
    R(10, 94, 84, 2, '#4a6a78');
    // caixa registradora
    R(55, 58, 20, 14, OUT); R(56, 59, 18, 12, '#5a5a6a'); R(56, 59, 18, 2, '#7a7a8e'); R(58, 62, 14, 4, '#9ad0a8'); R(59, 63, 6, 1, '#2f5a3a');
    for (let i = 0; i < 4; i++) R(58 + i * 4, 67, 3, 2, '#e8e0d0'); R(54, 71, 22, 3, OUT); R(55, 71, 20, 2, '#3a3a48');
    // balança, pote de balas, sacolas de papel e uma plantinha
    R(18, 66, 14, 6, OUT); R(19, 67, 12, 4, '#c8c8d4'); R(23, 62, 4, 4, OUT); R(24, 63, 2, 2, '#c8c8d4'); R(17, 61, 16, 2, '#a8a8b8');
    R(38, 62, 9, 11, OUT); R(39, 63, 7, 9, '#c8ecff'); [[40, 66, '#e04a3a'], [42, 68, '#ffe066'], [43, 65, '#58b858'], [40, 69, '#e0607a']].forEach(([x, y, c]) => R(x, y, 2, 2, c)); R(39, 62, 7, 1, '#e04a3a');
    R(78, 62, 9, 11, OUT); R(79, 63, 7, 9, '#d8b078'); R(79, 63, 7, 2, '#b88448');
    potPlant(87, 68, '#2f8a40');
  });
  solid(4, 62, 90, 34);                                                          // células de 8 px: o balcão ocupa x < 96 e y < 96
  obj({ id: 'counter', kind: 'counter', x: 52, y: 106, r: 24, hit: [8, 58, 88, 40], label: 'Balcão do Armazém' });
  // ---------- caixas de hortaliças na parede da esquerda ----------
  bldSprite(0, 100, 30, 84, 180, () => {
    R(3, 103, 22, 77, OUT); R(4, 104, 20, 75, '#8a5a32');
    [['#e04a3a', '#c8402e'], ['#f0a020', '#e88a20'], ['#58b858', '#3f9648'], ['#8a5ad9', '#6a3ab8'], ['#ffe066', '#e8c040'], ['#9ac850', '#78b04c']].forEach(([a, b], i) => produceBin(6, 106 + i * 12, 16, a, b));
  });
  solid(2, 104, 24, 76);
  // ---------- caixotes de frutas com pazinhas ----------
  bldSprite(30, 120, 60, 52, 166, () => {
    [[36, 128, '#e04a3a', '#c8402e'], [62, 128, '#f0c040', '#e0a020'], [36, 148, '#58b858', '#3f9648'], [62, 148, '#5a7ad8', '#3f5ab8']].forEach(([x, y, a, b]) => {
      R(x - 1, y - 1, 24, 20, OUT); R(x, y + 6, 22, 13, '#b88448'); R(x, y + 6, 22, 1, '#d8a868'); R(x, y + 12, 22, 1, '#7a5028'); R(x + 10, y + 6, 2, 13, '#7a5028');
      for (let i = 0; i < 20; i += 3) for (let j = 0; j < 2; j++) { R(x + 1 + i, y + 1 + j * 3, 3, 3, OUT); R(x + 1 + i, y + 1 + j * 3, 2, 2, (i + j) % 2 ? a : b); R(x + 1 + i, y + 1 + j * 3, 1, 1, shade(a, 1.4)); }
      R(x + 15, y + 1, 4, 4, '#c8c8d4'); R(x + 17, y - 3, 1, 4, '#8a5a32');
    });
  });
  solid(34, 144, 52, 24);
  obj({ id: 'caixotes-loja', kind: 'text', x: 60, y: 178, r: 16, hit: [34, 126, 52, 42], label: 'Caixotes de frutas e verduras', text: 'Frutas e verduras da estação, escolhidas uma a uma. Para comprar, fale com Dona Celeste no balcão.' });
  // ---------- duas fileiras de gôndolas, com corredores ----------
  [[128, 64], [216, 72]].forEach(([x, w]) => [112, 160].forEach(base => {    // vãos e corredores alinhados às células de 8 px
    bldSprite(x - 4, base - 46, w + 8, 50, base, () => gondola(x, base, w));
    solid(x, base - 8, w, 8);
    obj({ id: `gondola-${x}-${base}`, kind: 'text', x: x + w / 2, y: base + 10, r: 16, hit: [x, base - 40, w, 40], label: 'Prateleira', text: 'Potes, garrafas e pacotes bem arrumados. Os produtos à venda ficam no balcão, com Dona Celeste.' });
  }));
  // ---------- sacos de sementes e de ração, barril e plantas ----------
  bldSprite(232, 168, 72, 36, 200, () => {
    sack(240, 182, '#d8c08a', '#58b858'); sack(258, 180, '#d8c08a', '#e04a3a'); sack(276, 182, '#c8b078', '#f0a020');
    sack(268, 168, '#b89868', '#8a5a32');
  });
  solid(238, 182, 60, 18);
  obj({ id: 'sacos-loja', kind: 'text', x: 268, y: 172, r: 16, hit: [236, 164, 64, 38], label: 'Sacos de sementes e ração', text: 'Sacos de sementes da estação e de ração para galinhas. O que está à venda aparece no balcão.' });
  bldSprite(4, 180, 24, 24, 200, () => { R(7, 185, 14, 15, OUT); R(8, 186, 12, 13, '#9a6a3a'); R(9, 186, 2, 13, '#c08a4e'); R(8, 189, 12, 1, '#5a4030'); R(8, 195, 12, 1, '#5a4030'); for (let i = 0; i < 10; i += 3) { R(9 + i, 182, 3, 3, OUT); R(9 + i, 182, 2, 2, '#e04a3a'); } });
  solid(6, 192, 16, 8);
  [[292, 84], [224, 202]].forEach(([x, y]) => bldSprite(x - 10, y - 24, 20, 26, y, () => FLOOR.plant(x - 4, y)));
  // ---------- paredes e saída ----------
  solid(0, 0, W, WH + 4); solid(0, 0, 4, H); solid(W - 4, 0, 4, H); solid(0, H - 3, W, 3);
  R(cx - 16, H - 8, 32, 8, '#6a4426'); R(cx - 14, H - 6, 28, 6, '#c8a878'); R(cx - 10, H - 5, 20, 1, '#a88858');
  obj({ id: 'exit', kind: 'exit', x: cx, y: H - 8, r: 14, hit: [cx - 20, H - 16, 40, 16], label: 'Sair' });
  m.spawn = { x: cx, y: H - 14 }; m.keeper = LOJA.keeper; m.padB = 40;
  return m;
}

function buildRoom(id) {
  if (id === 'loja') return buildLoja();
  const m = newMap(id, RW, RH, 29);
  if (id === 'casa') {
    roomBase('#eadfc4', '#b08a5a', '#96744a', true);
    box(30, 12, 26, 20, '#f4f0e4'); R(32, 14, 22, 16, '#8fd0f0'); R(42, 14, 2, 16, '#f4f0e4');
    R(84, 22, 60, 2, '#8a5e36'); ['#c8483a', '#7a7a8a', '#e0a23a'].forEach((c, i) => box(90 + i * 18, 12, 10, 9, c));
    FLOOR.rug(96, 104, 64, 34, '#a86a48');
    ST.stove(108, 34); solid(108, 72, 34, 20);
    obj({ id: 'fogao', kind: 'text', x: 125, y: 100, hit: [108, 56, 34, 36], label: 'Fogão a lenha', text: 'O fogão a lenha do sítio. Antigo, mas ainda esquenta a casa inteira.' });
    FLOOR.bed(12, 108, '#3f86d0'); obj({ id: 'bed', kind: 'bed', x: 23, y: 114, hit: [10, 76, 26, 40], label: 'Dormir' });
    FLOOR.chest(44, 92); obj({ id: 'chest', kind: 'chest', x: 53, y: 98, hit: [42, 78, 22, 16], label: 'Baú' });
    ST.wardrobe(190, 36); solid(190, 72, 36, 20); obj({ id: 'wardrobe', kind: 'wardrobe', x: 208, y: 100, hit: [190, 34, 36, 62], label: 'Guarda-roupa e espelho' });
    FLOOR.table(170, 144, 34); FLOOR.plant(236, 150);
  } else if (id === 'tenda') {
    m.parent = 'montanha';
    roomBase('#c8b48a', '#8a6a48', '#7a5a3a', true);
    for (let x = 0; x < W; x += 24) { R(x, 0, 2, 62, '#a8946c'); }
    R(0, 0, W, 6, '#a8946c'); R(126, 0, 4, 66, '#6a4426');                                                  // mastro central
    for (let i = 0; i < 9; i++) { const hx = 20 + i * 12; R(hx, 6, 1, 6, '#6a4426'); R(hx - 2, 12, 5, 9, ['#58b858', '#c8a040', '#8ac060', '#b06a3a'][i % 4]); R(hx - 1, 13, 3, 1, '#ffffff22'); }  // ervas penduradas
    // esteira de dormir e cobertor
    box(18, 96, 56, 24, '#8a5e36'); R(20, 98, 52, 20, '#c8701e'); R(20, 98, 52, 3, '#e0a530'); box(22, 100, 14, 8, '#f0e6cc'); solid(16, 94, 60, 28);
    obj({ id: 'esteira', kind: 'text', x: 46, y: 132, r: 18, hit: [16, 92, 60, 30], label: 'Esteira de dormir', text: 'Uma esteira bem enrolada nas pontas e um cobertor cor de folha seca. Simples, e arrumada com capricho.' });
    // prateleira de caixotes com potes
    box(170, 40, 70, 34, '#8a5e36'); R(172, 56, 66, 2, '#5a3a22');
    for (let i = 0; i < 6; i++) { box(174 + i * 11, 44, 8, 10, ['#c8a050', '#58b858', '#b06a3a', '#e8e0c8', '#8ac060', '#c8a050'][i]); box(174 + i * 11, 60, 8, 10, ['#e8e0c8', '#c8701e', '#58b858', '#b06a3a', '#e0a530', '#8a5e36'][i]); }
    solid(170, 72, 70, 20);
    obj({ id: 'potes', kind: 'text', x: 205, y: 100, r: 18, hit: [168, 38, 74, 56], label: 'Potes de ervas', text: 'Potes rotulados com letra miúda: "boldo", "macela", "erva-cidreira", "para tosse", "para quem não dorme".' });
    // mapa desenhado à mão e lampião
    box(96, 22, 26, 20, '#f0e6cc'); R(100, 28, 18, 1, '#8a5e36'); R(104, 32, 1, 6, '#8a5e36'); R(108, 26, 8, 1, '#3f86d8'); R(112, 35, 6, 1, '#8a5e36');
    obj({ id: 'mapa-lucio', kind: 'text', x: 109, y: 100, r: 18, hit: [94, 20, 30, 24], label: 'Mapa desenhado à mão', text: 'Um mapa da serra feito a lápis, com trilhas, nascentes e atalhos que não aparecem em mapa nenhum.' });
    R(150, 30, 1, 10, '#6a4426'); box(146, 40, 9, 10, '#3a3a44'); R(148, 42, 5, 6, '#ffd75e');
    FLOOR.rug(96, 110, 70, 30, '#a86a48'); FLOOR.plant(232, 150);
  } else if (id === 'galinheiro') {
    roomBase('#b86a4a', '#d8b868', '#c0a050', true);
    for (let i = 0; i < 160; i++) R(rand() * W, 74 + rand() * (H - 76), 3, 1, rand() < 0.5 ? '#e8d080' : '#a88a40');      // palha
    for (let x = 0; x < W; x += 8) R(x, 0, 1, 62, '#9a5236');
    box(112, 14, 32, 22, '#f2e6d0'); R(114, 16, 28, 18, '#8fd0f0'); R(127, 16, 2, 18, '#f2e6d0'); R(114, 24, 28, 2, '#f2e6d0');      // janela
    R(4, 30, 60, 3, '#6a4426'); R(4, 33, 2, 10, '#6a4426'); R(62, 33, 2, 10, '#6a4426');                                            // poleiro
    // comedouro: cocho comprido com placa "RAÇÃO"
    box(26, 38, 44, 14, '#f0e6cc'); pixelText(29, 43, 'RAÇÃO', '#6a3a1c'); R(52, 41, 2, 2, '#c8a050'); R(56, 44, 3, 3, '#c8a050'); R(60, 41, 2, 2, '#c8a050'); R(63, 44, 3, 3, '#c8a050');
    box(20, 80, 56, 12, '#8a5e36'); R(20, 80, 56, 3, '#b88448'); R(22, 83, 52, 5, '#4a2e18'); R(22, 92, 3, 4, '#6a4426'); R(71, 92, 3, 4, '#6a4426');
    box(80, 74, 12, 16, '#c8a050'); R(80, 74, 12, 4, '#e8d070'); R(83, 80, 6, 4, '#8a5e36');                                         // saco de ração
    solid(18, 76, 76, 20);
    obj({ id: 'feeder', kind: 'feeder', x: 48, y: 106, r: 20, hit: [16, 36, 80, 62], label: 'Comedouro' });
    // ninhos: três caixas com palha numa prateleira
    box(150, 46, 90, 8, '#8a5e36'); R(150, 46, 90, 2, '#b88448');
    for (let i = 0; i < 3; i++) { const nx = 154 + i * 29; box(nx, 56, 24, 26, '#a87a48'); R(nx + 2, 58, 20, 20, '#4a2e18'); R(nx + 2, 70, 20, 8, '#e8d070'); R(nx + 4, 68, 16, 3, '#f8e8a0'); R(nx + 1, 82, 2, 10, '#6a4426'); R(nx + 21, 82, 2, 10, '#6a4426'); }
    R(150, 92, 90, 2, '#6a4426'); solid(148, 76, 94, 20);
    box(182, 28, 34, 11, '#f0e6cc'); pixelText(187, 31, 'NINHOS', '#6a3a1c');
    obj({ id: 'nest', kind: 'nest', x: 196, y: 106, r: 20, hit: [146, 28, 98, 70], label: 'Ninhos' });
    // fardos de feno e bebedouro
    [[8, 140], [8, 124], [26, 140]].forEach(([x, y]) => { box(x, y, 18, 12, '#d8b858'); R(x, y, 18, 3, '#f0d878'); R(x + 5, y, 1, 12, '#a88a40'); R(x + 12, y, 1, 12, '#a88a40'); });
    solid(6, 122, 40, 32);
    box(214, 132, 20, 8, '#8a9aa8'); R(216, 134, 16, 4, '#6aacf0'); solid(212, 130, 24, 12);
  } else if (id === 'iara') {
    /* casa de Iara: lar de uma estudante — mesa do chá, cantinho de pintura, estante e poltrona */
    roomBase('#efe4f2', '#c8a878', '#a88a5a', true);
    box(40, 14, 30, 22, '#f4f0e4'); R(42, 16, 26, 18, '#8fd0f0'); R(54, 16, 2, 18, '#f4f0e4'); R(42, 24, 26, 2, '#f4f0e4');   // janela
    [[86, 20, '#f8e8a0'], [102, 24, '#bfe4ff'], [118, 18, '#f8c8d8'], [134, 26, '#c8f0b8']].forEach(([x, y, c], i) => { box(x, y, 12, 10, c); R(x + 2, y + 3, 6, 1, ['#e0a23a', '#3f86d0', '#e04a5a', '#58a838'][i]); R(x + 5, y - 2, 2, 2, '#c8483a'); });   // desenhos presos na parede
    // cantinho de pintura: cavalete, banquinho e potes de tinta
    R(16, 112, 2, 18, '#6a4426'); R(32, 112, 2, 18, '#6a4426'); R(24, 96, 2, 34, '#5a3a22'); box(14, 92, 22, 18, '#f8f4ea'); R(17, 96, 8, 6, '#9ac8e8'); R(22, 100, 10, 5, '#78b04c'); R(18, 103, 6, 3, '#e0a23a');
    box(4, 128, 22, 6, '#8a5e36'); [['#e04a5a', 6], ['#3f86d0', 12], ['#f2d24a', 18]].forEach(([c, x]) => box(x, 122, 4, 5, c)); solid(2, 90, 40, 46);
    obj({ id: 'canto-pintura', kind: 'text', x: 26, y: 140, r: 18, hit: [2, 88, 40, 48], label: 'Cantinho de pintura', text: 'Um cavalete pequeno, potes de tinta com nomes escritos à mão ("azul de fonte gelada", "verde de folha depois da chuva") e um pano todo manchado.' });
    // mesa do chá
    FLOOR.table(150, 124, 34); box(158, 106, 8, 6, '#f0e8f4'); R(160, 104, 4, 2, '#f0e8f4'); R(166, 108, 2, 2, '#f0e8f4'); box(172, 108, 4, 4, '#f8f0e0'); box(178, 108, 4, 4, '#f8f0e0');
    obj({ id: 'mesa-cha', kind: 'text', x: 167, y: 140, r: 18, hit: [148, 100, 38, 26], label: 'Mesa do chá', text: 'Um bule lilás e duas xícaras. Cheira a maçã com canela.' });
    FLOOR.rug(86, 110, 52, 30, '#9a74d8');
    ST.shelf(206, 40); solid(206, 72, 40, 20);
    obj({ id: 'estante-iara', kind: 'text', x: 226, y: 100, r: 18, hit: [204, 40, 44, 52], label: 'Estante', text: 'Livros da escola, cadernos de desenho numerados e um livro de capa gasta: "Cores do mundo".' });
    box(222, 118, 22, 18, '#8a5ad9'); R(222, 118, 22, 5, '#a888e0'); R(224, 134, 3, 4, '#5a3a22'); R(239, 134, 3, 4, '#5a3a22'); solid(222, 116, 22, 22);   // poltrona de leitura
    FLOOR.plant(110, 150);
  } else if (id === 'escola') {
    /* sala de aula: quadro-negro, mesa da professora, carteiras, livros e o mural de desenhos */
    roomBase('#f4ead0', '#c8b088', '#b09868');
    box(70, 12, 116, 36, '#2f5a3a'); R(72, 14, 112, 2, '#3f7a4a'); R(80, 22, 30, 1, '#e8f0e0'); R(80, 28, 44, 1, '#e8f0e0'); R(80, 34, 22, 1, '#e8f0e0'); R(140, 24, 12, 8, '#e8f0e0'); R(70, 48, 116, 3, '#8a5e36');
    obj({ id: 'quadro-negro', kind: 'text', x: 128, y: 100, r: 20, hit: [68, 10, 120, 42], label: 'Quadro-negro', text: 'No quadro, com letra caprichada: "Tarefa: desenhar um lugar da vila em duas estações diferentes."' });
    FLOOR.table(108, 92, 40); box(114, 74, 8, 6, '#c8483a'); box(124, 75, 8, 5, '#3f86d0');
    ST.shelf(8, 36); solid(8, 72, 36, 20);
    obj({ id: 'livros-escola', kind: 'text', x: 26, y: 100, r: 18, hit: [6, 40, 40, 52], label: 'Livros', text: 'Livros de português, de ciências e uma prateleira inteira de livros de arte, com as lombadas gastas.' });
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const x = 200 + c * 12, y = 14 + r * 16; box(x, y, 10, 12, ['#f8e8a0', '#bfe4ff', '#f8c8d8', '#c8f0b8', '#f0d8f8'][(r * 4 + c) % 5]); R(x + 2, y + 4, 5, 2, ['#e0a23a', '#3f86d0', '#e04a5a', '#58a838', '#8a5ad9'][(r + c) % 5]); }
    obj({ id: 'mural', kind: 'text', x: 222, y: 100, r: 18, hit: [196, 10, 54, 54], label: 'Mural de desenhos', text: 'O mural da turma. No canto, um desenho da fonte assinado com letra redonda: "Iara, 6ª série".' });
    [[30, 120], [74, 120], [160, 120], [204, 120], [30, 146], [74, 146], [160, 146], [204, 146]].forEach(([x, y]) => { FLOOR.table(x, y, 22); box(x + 7, y + 4, 8, 4, '#8a5e36'); });
  } else {
    roomBase('#f8e8c8', '#c8b088', '#b09868');
    ST.shelf(10, 40); solid(10, 72, 40, 20); ST.shelf(206, 40); solid(206, 72, 40, 20);
    box(100, 14, 56, 18, '#f0e6cc'); R(108, 19, 40, 2, '#8a5e36'); R(108, 24, 28, 2, '#8a5e36');
    // balcão
    box(70, 96, 116, 14, '#b88448'); R(70, 96, 116, 4, '#d8a868'); solid(70, 92, 116, 18); solid(60, 76, 10, 34); solid(186, 76, 10, 34);
    [['#c8483a', 78], ['#58b858', 90], ['#e0a23a', 160], ['#f0e6cc', 172]].forEach(([c, x]) => box(x, 88, 8, 8, c));
    obj({ id: 'counter', kind: 'counter', x: 128, y: 118, r: 24, hit: [70, 92, 116, 20], label: 'Balcão do Armazém' });
    ST.crate(14, 34); FLOOR.plant(232, 150);
    for (let i = 0; i < 3; i++) { box(22 + i * 14, 136, 10, 12, ['#c8a050', '#8a5e36', '#c8a050'][i]); R(22 + i * 14, 136, 10, 3, '#e8d070'); } solid(20, 136, 42, 12);
    m.keeper = [128, 90];
  }
  solid(0, 0, W, 76); solid(0, 0, 4, H); solid(W - 4, 0, 4, H); solid(0, H - 3, W, 3);
  R(112, H - 8, 32, 8, '#6a4426'); R(114, H - 6, 28, 6, '#c8a878'); R(118, H - 5, 20, 1, '#a88858');
  obj({ id: 'exit', kind: 'exit', x: 128, y: H - 8, r: 14, hit: [108, H - 16, 40, 16], label: 'Sair' });
  m.spawn = { x: 128, y: H - 14 };
  return m;
}
