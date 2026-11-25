/* Mundo — base: tamanhos, sorteio, cores e paletas das estações.
   Parte de js/world/ (antes era js/world.js). São scripts comuns, carregados em ordem pelo index.html:
   as declarações de nível superior valem para todos os arquivos (não são módulos). O objeto World,
   com as funções públicas, é montado no fim, em js/world/index.js. */

/* Mundo do jogo: o mapa externo (fazenda, vila e bosque, maior que a tela) e
   os interiores (casa e Armazém). Cada mapa tem um fundo pré-desenhado, uma
   grade de colisão e pontos de interação. O que muda durante o jogo (terra,
   plantas, árvores, pedras, galinhas) é desenhado por cima a cada quadro.
   Tudo é desenhado por código, sem imagens externas. */

const RW = 256, RH = 160;          // tamanho dos interiores
let VW = 256, VH = 160;            // área visível (a câmera); muda com o tamanho da janela
function setView(w, h) { VW = w; VH = h; }
const CELL = 8;                    // célula de colisão
const OUT = '#2c1a12';                     // contorno marrom-escuro, quente
let W = VW, H = VH, g, rand;

function rng(seed) { return () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296; }
const shade = (hex, k) => {
  const n = parseInt(hex.slice(1), 16);
  const f = v => Math.max(0, Math.min(255, Math.round(v * k))).toString(16).padStart(2, '0');
  return '#' + f(n >> 16) + f((n >> 8) & 255) + f(n & 255);
};

/* Posição presa ao corpo (mão, cabeça, boca) no personagem do mundo, que é menor (Sprites.WORLD). */
const OX = dx => Sprites.WORLD.ox(dx), OY = dy => Sprites.WORLD.oy(dy);
/* ================= peças do cenário ================= */
/* ================= estações =================
   Os cenários externos são desenhados uma vez por estação. Cada elemento troca
   as próprias cores (grama, copas, arbustos, água, terra) e ganha detalhes da
   estação (flores, folhas caídas, neve, galhos nus). O sorteio que posiciona as
   coisas é o mesmo em todas as estações: caminhos, portas e colisões não mudam. */
let SEASON = 0, paintSeason = -1;                  // paintSeason >= 0 só enquanto se desenha um cenário externo
const SMAP = [
  {},
  // verão: grama um pouco mais quente (verde puxado para o amarelo) e copas cheias, de verde vivo
  { '#58a83c': '#62ac30', '#4f9c38': '#54982a', '#63b444': '#76b838', '#468c32': '#468826', '#78c452': '#9ccc46', '#3a7e2c': '#367622',
    '#267a3a': '#2a8a2c', '#369a48': '#44a836', '#58b858': '#6cc444', '#84d470': '#a2dc5a', '#1c5c30': '#1d6424', '#2f8a40': '#38902e', '#2f7028': '#2c6a1e',
    '#1f6a34': '#24782a', '#2a7e40': '#349034', '#3f9a52': '#54ae3e' },
  { '#58a83c': '#a49a4c', '#4f9c38': '#968c42', '#63b444': '#b2a658', '#468c32': '#867a38', '#78c452': '#c4b468', '#3a7e2c': '#6e6a2e',
    '#143c24': '#4a2210', '#267a3a': '#b8521c', '#369a48': '#d06e22', '#58b858': '#e89a34', '#84d470': '#f4c050', '#1c5c30': '#7a3214',
    '#2f8a40': '#b0602a', '#2f7028': '#7a6a2c', '#0f3020': '#3e1a0c', '#1f6a34': '#a8461c', '#2a7e40': '#c8622a', '#3f9a52': '#e08a30', '#175428': '#7a3418' },
  { '#58a83c': '#e8eef5', '#4f9c38': '#dce6f0', '#63b444': '#f4f8fc', '#468c32': '#c9d6e4', '#78c452': '#ffffff', '#3a7e2c': '#8a9aa6',
    '#2f7028': '#9aa8b4', '#2f8a40': '#5a7a68',
    '#3f86d8': '#7aa6cc', '#3478cc': '#6a96c0', '#bfe4ff': '#eef6ff', '#86764c': '#9a9894',
    '#dcc48c': '#d8d0c2', '#b4945a': '#a8a090', '#c8ac70': '#c6beb0', '#f0e0b0': '#f4f0ea' },
];
/* Paleta-base dos cenários externos: cores vivas e quentes (verde-folha, terra
   dourada, água turquesa). As estações trocam por cima dela. */
const BASE = {
  '#58a83c': '#5cab3c', '#4f9c38': '#4b9632', '#63b444': '#72bd48', '#468c32': '#3f8a2c', '#78c452': '#9ad25a', '#3a7e2c': '#2f7424',
  '#143c24': '#1d3d17', '#267a3a': '#3d8a2c', '#369a48': '#58a838', '#58b858': '#80c646', '#84d470': '#b0de60', '#1c5c30': '#2a6422',
  '#2a8046': '#2f7a36', '#58b860': '#62ac48', '#2f8a40': '#408c2e', '#2f7028': '#2e6a22',
  '#0f3020': '#1a3414', '#1f6a34': '#357a26', '#2a7e40': '#4c962e', '#3f9a52': '#6cb440', '#175428': '#24561c',
  '#3f86d8': '#3aa6c8', '#3478cc': '#2c90b6', '#bfe4ff': '#c8f2ec', '#86764c': '#9a7844',
  '#dcc48c': '#c9a473', '#b4945a': '#94704a', '#c8ac70': '#b8935f', '#f0e0b0': '#dcbf92',          // terra ocre, menos amarela
  '#cdbfa4': '#ccb690', '#8e8068': '#7a6450', '#b4a68a': '#ab966e', '#e6dcc6': '#ecdcbc',
  '#b88448': '#b8763a', '#d8a868': '#dca05a',
};
const SC = c => (paintSeason >= 0 ? (SMAP[paintSeason][c] || BASE[c] || c) : c);
/* Sorteio separado para enfeites: não mexe no sorteio que posiciona árvores, arbustos e caminhos. */
let rand2 = Math.random;
const R = (x, y, w, h, c) => { g.fillStyle = SC(c); g.fillRect(Math.round(x), Math.round(y), w, h); };
/* Neve sobre um telhado (inverno): faixa branca com borda irregular e sombra azulada. */
function snowCap(x0, y0, w, rows) {
  if (paintSeason !== 3) return;
  for (let c = 0; c < w; c++) {
    const depth = rows - 2 + ((c * 7) % 5 === 0 ? 2 : (c * 3) % 4 === 0 ? 1 : 0);
    g.fillStyle = '#f6f9fd'; g.fillRect(x0 + c, y0, 1, depth);
    g.fillStyle = '#c8d6e6'; g.fillRect(x0 + c, y0 + depth, 1, 1);
    if (c % 5 === 0) { g.fillStyle = '#ffffff'; g.fillRect(x0 + c, y0, 1, 1); }
  }
}

/* Grama do mapa inteiro: o sorteio antigo é consumido igual (árvores, arbustos e caminhos nos mesmos lugares)
   e a pintura nova vem de grassBake (folhinhas pela posição no mundo). */
function grass(worn) { spendRand(() => grassOld(worn)); grassBake(0, 0, W, H); }
function grassOld(worn) {
  rand2 = rng(W * 7 + H * 13 + 5);
  R(0, 0, W, H, '#58a83c');
  for (let i = 0; i < 26 * (W * H) / 40960; i++) {                         // manchas mais escuras e mais claras
    const cx = rand() * W, cy = rand() * H, rx = 8 + rand() * 18, ry = 4 + rand() * 8;
    g.fillStyle = SC(i % 3 ? '#4f9c38' : '#63b444');
    for (let y = -ry; y <= ry; y++) {
      const hw = Math.round(rx * Math.sqrt(1 - (y * y) / (ry * ry)));
      g.fillRect(Math.round(cx - hw), Math.round(cy + y), hw * 2, 1);
    }
  }
  for (let i = 0; i < 520 * (W * H) / 40960; i++) R(rand() * W, rand() * H, 1, 1, rand() < 0.5 ? '#468c32' : '#78c452');
  for (let i = 0; i < 90 * (W * H) / 40960; i++) {                         // tufos de capim
    const x = Math.floor(rand() * W), y = Math.floor(rand() * H);
    R(x, y, 1, 2, '#3a7e2c'); R(x + 2, y, 1, 2, '#3a7e2c'); R(x + 1, y + 1, 1, 1, '#3a7e2c');
  }
  // textura de gramado: tufos em "v" com ponta clara e folhinhas
  for (let i = 0; i < 260 * (W * H) / 40960; i++) {
    const x = Math.floor(rand2() * W), y = Math.floor(rand2() * H), k = rand2();
    if (k < 0.5) { R(x, y + 1, 1, 2, '#3a7e2c'); R(x + 2, y + 1, 1, 2, '#3a7e2c'); R(x + 1, y + 2, 1, 1, '#3a7e2c'); R(x, y, 1, 1, '#78c452'); R(x + 2, y, 1, 1, '#78c452'); }
    else if (k < 0.8) { R(x, y, 2, 1, '#63b444'); R(x + 1, y + 1, 2, 1, '#468c32'); }
    else { R(x, y, 1, 3, '#3a7e2c'); R(x + 1, y + 1, 1, 2, '#468c32'); R(x - 1, y + 1, 1, 2, '#468c32'); R(x, y, 1, 1, '#78c452'); }
  }
  if (worn) for (let i = 0; i < 14; i++) {               // chão batido
    const x = rand() * W, y = rand() * H;
    R(x, y, 6 + rand() * 8, 2, '#a8a060'); R(x + 1, y + 2, 4 + rand() * 6, 1, '#98924e');
  }
}

function flowers(n, avoid, thin) {
  for (let i = 0; i < n; i++) {
    const x = Math.floor(rand() * (W - 4)), y = Math.floor(rand() * (H - 4));
    if (avoid(x, y)) continue;
    const k = Math.floor(rand() * 4), c = ['#ffffff', '#ffe066', '#ff9ec0', '#c8a0ff'][k];
    if (thin && thin(x, y)) continue;                                  // (o sorteio é consumido igual: nada muda de lugar)
    if (hash(x, y, 232) < 0.4) continue;                               // flores com moderação (pequenos pontos, não um tapete)
    if (paintSeason === 2) { const lc = ['#c8581e', '#e09030', '#8a3a18', '#b8742a'][k]; R(x, y + 2, 2, 1, lc); R(x + 1, y + 1, 2, 1, lc); continue; }   // folhas caídas
    if (paintSeason === 3) { if (k === 0) { R(x + 1, y + 2, 1, 1, '#ffffff'); R(x, y + 3, 3, 1, '#d4e0ec'); } continue; }                                 // montinhos de neve
    if (paintSeason === 1) {                                                                                                                      // verão: capim alto e florzinhas quentes
      if (k > 1) { R(x + 1, y, 1, 4, '#2c6a1e'); R(x, y + 1, 1, 3, '#3f8e28'); R(x + 2, y + 2, 1, 2, '#2c6a1e'); continue; }
      const sc = k ? '#ff8a3a' : '#ffd23a'; R(x + 1, y + 3, 1, 2, '#2f7028'); R(x, y + 1, 3, 1, sc); R(x + 1, y, 1, 3, sc); R(x + 1, y + 1, 1, 1, '#8a4a1a'); continue;
    }
    R(x + 1, y, 1, 3, c); R(x, y + 1, 3, 1, c); R(x + 1, y + 1, 1, 1, '#f0a020');
    R(x + 1, y + 3, 1, 2, '#2f7028');
  }
}

/* Faixa de chão: 'terra', 'pedra' (calçamento), 'calcada', 'asfalto', 'laje'. */
function ground(kind, x, y, w, h) {
  const P = {
    terra:   ['#dcc48c', '#b4945a', '#c8ac70', '#f0e0b0'],
    pedra:   ['#cdbfa4', '#8e8068', '#b4a68a', '#e6dcc6'],
    calcada: ['#c8c8c0', '#8c8c88', '#b0b0a8', '#e0e0d8'],
    asfalto: ['#5a5a66', '#3c3c46', '#4e4e5a', '#6a6a76'],
    laje:    ['#e4dcc8', '#a89c84', '#cfc6ae', '#f6f0e0'],
    areia:   ['#ecd49a', '#c8a868', '#f4e2b4', '#fff0c8'],
  }[kind];
  R(x - 1, y - 1, w + 2, h + 2, P[1]);
  R(x, y, w, h, P[0]);
  if (kind === 'areia') {                              // areia da beira-rio: grãos claros e conchinhas
    for (let i = 0; i < w * h / 12; i++) R(x + rand() * (w - 1), y + rand() * (h - 1), 1, 1, rand() < 0.5 ? P[2] : P[3]);
    for (let i = 0; i < w * h / 400; i++) R(x + 2 + rand2() * (w - 4), y + 1 + rand2() * (h - 2), 2, 1, rand2() < 0.5 ? '#c8a868' : '#ffffff');
  } else if (kind === 'terra') {
    for (let i = 0; i < w * h / 10; i++) R(x + rand() * (w - 2), y + rand() * (h - 1), 2, 1, rand() < 0.5 ? P[2] : P[3]);
    for (let i = x; i < x + w; i += 3) if (rand() < 0.4) { R(i, y - 1, 2, 1, '#58a83c'); R(i + 1, y + h, 2, 1, '#58a83c'); }
    // pedrinhas e marcas de terra dourada
    for (let i = 0; i < w * h / 70; i++) { const px = x + 1 + Math.floor(rand2() * (w - 3)), py = y + 1 + Math.floor(rand2() * (h - 2)); R(px, py, 2, 1, '#f0e0b0'); R(px, py + 1, 2, 1, '#b4945a'); }
    if (paintSeason === 3) for (let i = x; i < x + w; i += 2) { R(i, y, 1, 1 + ((i * 7) % 3), '#eef3f8'); R(i + 1, y + h - 1 - ((i * 5) % 2), 1, 1 + ((i * 5) % 2), '#eef3f8'); }   // neve nas bordas
    if (paintSeason === 2) for (let i = x + 2; i < x + w; i += 9) { R(i, y + ((i * 3) % Math.max(1, h - 1)), 2, 1, '#c8581e'); R(i + 4, y + ((i * 7) % Math.max(1, h - 1)), 1, 1, '#8a3a18'); }
  } else if (kind === 'asfalto') {
    for (let i = 0; i < w * h / 16; i++) R(x + rand() * (w - 1), y + rand() * (h - 1), 1, 1, rand() < 0.5 ? P[2] : P[3]);
  } else {                                              // blocos assentados
    const bw = kind === 'pedra' ? 7 : 10, bh = kind === 'pedra' ? 4 : 6;
    for (let r = 0, yy = y; yy < y + h; r++, yy += bh) {
      R(x, yy + bh - 1, w, 1, P[2]);
      for (let xx = x - (r % 2) * Math.floor(bw / 2); xx < x + w; xx += bw) {
        if (xx + bw - 1 >= x && xx + bw - 1 < x + w) R(xx + bw - 1, yy, 1, Math.min(bh, y + h - yy), P[2]);
        if (rand() < 0.3 && xx >= x && xx + bw - 2 < x + w) R(xx + 1, yy + 1, bw - 3, 1, P[3]);
      }
    }
  }
}

/* Letreiro em fonte de pixel 3x5 (só as letras usadas nas placas). */
const GLYPH = { T: '111010010010010', E: '111100110100111', L: '100100100100111', R: '110101110101101', A: '010101111101101', C: '011100100100011', O: '010101101101010', N: '110101101101101', I: '111010010010111', H: '101101111101101', S: '011100010001110' };
function pixelText(x, y, str, c) {
  [...str].forEach((ch, i) => {
    const base = { 'Ç': 'C', 'Ã': 'A' }[ch] || ch, gl = GLYPH[base]; if (!gl) return;
    for (let k = 0; k < 15; k++) if (gl[k] === '1') R(x + i * 4 + (k % 3), y + Math.floor(k / 3), 1, 1, c);
    if (ch === 'Ç') R(x + i * 4 + 1, y + 5, 1, 1, c);
    if (ch === 'Ã') { R(x + i * 4, y - 2, 2, 1, c); R(x + i * 4 + 1, y - 3, 2, 1, c); }
  });
}

function shadowOval(cx, cy, rx, ry) {
  g.fillStyle = 'rgba(20,40,20,.28)';
  for (let y = -ry; y <= ry; y++) {
    const hw = Math.round(rx * Math.sqrt(1 - (y * y) / (ry * ry)));
    g.fillRect(cx - hw, cy + y, hw * 2, 1);
  }
}
function blob(cx, cy, r, c, squash = 1) {
  g.fillStyle = SC(c);
  for (let y = -r; y <= r; y++) {
    const hw = Math.round(Math.sqrt(r * r - y * y));
    g.fillRect(cx - hw, Math.round(cy + y * squash), hw * 2, 1);
  }
}

/* Galhos nus de uma árvore de folhas caducas (inverno), com neve por cima. */
function bareBranches(x, top, r) {
  const B = '#4a3020', BL = '#6a4a32';
  R(x - 2, top + 3, 4, r + 7, OUT); R(x - 1, top + 3, 2, r + 7, B); R(x - 1, top + 3, 1, r + 7, BL); R(x - 1, top, 2, 3, B);   // galho principal mais grosso, saindo do tronco
  [[-1, 0.2, -1], [1, 0.35, 1], [-1, 0.55, -1], [1, 0.7, 1], [-1, 0.85, -1]].forEach(([dir, k, s2]) => {
    const by = top + Math.round(r * k), len = Math.round(r * (1.1 - k * 0.5));
    for (let i = 0; i < len; i++) { R(x + dir * (i + 1), by - Math.floor(i * 0.7), 1, 1, B); if (i % 3 === 2) R(x + dir * (i + 1), by - Math.floor(i * 0.7) - 1, 1, 1, '#f4f8fc'); }
    R(x + dir * (len + 1), by - Math.floor(len * 0.7) - 1, 1, 1, B);
    R(x + dir * Math.floor(len / 2), by - Math.floor(len * 0.35) - 2, 1, 2, B);
  });
  R(x - 1, top - 1, 2, 1, '#f4f8fc');
}
