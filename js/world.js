/* Mundo do jogo: o mapa externo (fazenda, vila e bosque, maior que a tela) e
   os interiores (casa e Armazém). Cada mapa tem um fundo pré-desenhado, uma
   grade de colisão e pontos de interação. O que muda durante o jogo (terra,
   plantas, árvores, pedras, galinhas) é desenhado por cima a cada quadro.
   Tudo é desenhado por código, sem imagens externas. */

const World = (() => {
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

  function grass(worn) {
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
    R(x - 1, top, 2, r + 10, B); R(x - 1, top, 1, r + 10, BL);
    [[-1, 0.2, -1], [1, 0.35, 1], [-1, 0.55, -1], [1, 0.7, 1], [-1, 0.85, -1]].forEach(([dir, k, s2]) => {
      const by = top + Math.round(r * k), len = Math.round(r * (1.1 - k * 0.5));
      for (let i = 0; i < len; i++) { R(x + dir * (i + 1), by - Math.floor(i * 0.7), 1, 1, B); if (i % 3 === 2) R(x + dir * (i + 1), by - Math.floor(i * 0.7) - 1, 1, 1, '#f4f8fc'); }
      R(x + dir * (len + 1), by - Math.floor(len * 0.7) - 1, 1, 1, B);
      R(x + dir * Math.floor(len / 2), by - Math.floor(len * 0.35) - 2, 1, 2, B);
    });
    R(x - 1, top - 1, 2, 1, '#f4f8fc');
  }
  function tree(x, y, r = 11) {            // (x, y) = base do tronco
    shadowOval(x, y, r, 3);
    R(x - 4, y - 10, 8, 10, OUT); R(x - 3, y - 10, 6, 9, '#6a4426'); R(x - 3, y - 10, 2, 9, '#8a5e36'); R(x + 1, y - 8, 1, 6, '#4a2c18');
    R(x - 5, y - 2, 2, 2, OUT); R(x + 3, y - 2, 2, 2, OUT); R(x - 4, y - 2, 1, 1, '#6a4426'); R(x + 3, y - 2, 1, 1, '#6a4426');   // raízes
    const cy = y - 8 - r;
    if (paintSeason === 3) {                                   // inverno: sem folhas
      bareBranches(x, cy - r + 2, r);
      for (let i = 0; i < r * 2; i++) { rand(); rand(); }
      return;
    }
    // no outono, cada árvore tem um tom: laranja, vermelho ou amarelo
    const AUT = [{ '#267a3a': '#b8521c', '#369a48': '#d06e22', '#58b858': '#e89a34' }, { '#267a3a': '#9a2e1c', '#369a48': '#c0442a', '#58b858': '#de6a3a' }, { '#267a3a': '#b88a1c', '#369a48': '#d8a82a', '#58b858': '#f0c848' }][Math.abs(treeSeed) % 3];
    const L = c => (paintSeason === 2 ? AUT[c] || c : c);
    // copa feita de cachos de folhas: contorno, base, luz no alto à esquerda e brilho
    const tv = i => { let h = (treeSeed * 2654435761 + i * 40503) | 0; h = Math.imul(h ^ (h >>> 15), 2246822519); h ^= h >>> 13; return ((h >>> 0) % 1000) / 1000; };   // variação de cada exemplar
    const lobes = [[0, -0.55, 0.6], [-0.58, -0.12, 0.56], [0.58, -0.12, 0.56], [-0.32, 0.42, 0.56], [0.34, 0.42, 0.56], [0, 0.05, 0.62], [tv(9) < 0.5 ? -0.7 : 0.7, 0.2, tv(8) < 0.5 ? 0.42 : 0]].filter(l => l[2] > 0).map(([a, b2, k], i) => [x + (a + (tv(i) - 0.5) * 0.24) * r, cy + (b2 + (tv(i + 20) - 0.5) * 0.2) * r, Math.max(3, Math.round(k * r * (0.9 + tv(i + 40) * 0.22)))]);
    lobes.forEach(([lx, ly, rr]) => blob(Math.round(lx), Math.round(ly), rr + 1, '#143c24'));
    lobes.forEach(([lx, ly, rr]) => blob(Math.round(lx), Math.round(ly), rr, L('#267a3a')));
    lobes.forEach(([lx, ly, rr]) => blob(Math.round(lx - rr * 0.25), Math.round(ly - rr * 0.3), Math.max(1, Math.round(rr * 0.62)), L('#369a48')));
    lobes.forEach(([lx, ly, rr]) => blob(Math.round(lx - rr * 0.42), Math.round(ly - rr * 0.48), Math.max(1, Math.round(rr * 0.28)), L('#58b858')));
    lobes.forEach(([lx, ly, rr]) => { R(lx + rr * 0.2, ly + rr * 0.62, 3, 1, L('#1c5c30')); R(lx + rr * 0.5, ly + rr * 0.3, 1, 2, L('#1c5c30')); });
    for (let i = 0; i < r * 2; i++) {
      const a = rand() * 6.28, d = rand() * (r - 2), px = x + Math.cos(a) * d, py = cy + Math.sin(a) * d;
      if (paintSeason === 0 && i % 3 === 0) { R(px, py, 2, 2, i % 2 ? '#ffc2d8' : '#fff4f8'); R(px + 1, py, 1, 1, '#f090b0'); }   // florada
      else R(px, py, 2, 1, a > 2.4 && a < 5.2 ? '#84d470' : '#1c5c30');
    }
    if (paintSeason === 2) for (let i = 0; i < 5; i++) R(x - r + (i * 5) % (r * 2), y + 1 + (i % 2), 2, 1, ['#c8581e', '#e09030', '#8a3a18'][i % 3]);   // folhas no chão
    if (paintSeason === 1) {                                                                                                         // verão: copa cheia e folhas vivas (sem flores)
      blob(x + 3, cy + 3, Math.max(2, r - 5), '#2a8a2c');
      for (let i = 0; i < r; i++) { const a = i * 2.4, d = (i * 7) % Math.max(2, r - 3); R(x + Math.cos(a) * d, cy + Math.sin(a) * d - 1, 2, 1, '#a2dc5a'); }
    }
  }
  /* Pinheiro: ramos em camadas que caem para os lados, com pontas recortadas, luz à esquerda, sombra sob cada
     camada e tronco com casca. Cada exemplar varia (altura, largura, número de camadas, inclinação), pela posição. */
  function pine(x, y) {
    const hs = (i, k) => { let h = (treeSeed * 374761393 + i * 668265263 + k * 1013904223) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
    const OL = '#173a20', DP = '#21522a', BD = '#2c6e38', MD = '#3a8444', LT = '#58a050', TP = '#82c060', snow = paintSeason === 3;
    const tiers = 3 + (hs(1, 1) < 0.5 ? 1 : 0), wk = 0.88 + hs(2, 1) * 0.24, ht = 30 + Math.floor(hs(3, 1) * 5), lean = hs(4, 1) < 0.33 ? -1 : hs(4, 1) > 0.67 ? 1 : 0;
    shadowOval(x, y, 8, 2);
    R(x - 2, y - 7, 5, 8, '#3a2416'); R(x - 1, y - 7, 3, 7, '#6a4428'); R(x - 1, y - 7, 1, 7, '#8a5e36'); R(x + 1, y - 5, 1, 2, '#4a3020');   // tronco
    R(x - 3, y - 1, 2, 1, '#4a3020'); R(x + 2, y - 1, 2, 1, '#4a3020');                                                                  // raízes
    const top = y - 6 - ht, step = (ht - 4) / tiers;
    for (let t = tiers - 1; t >= 0; t--) {                                                        // de baixo para cima: cada camada cai por cima da de baixo
      const k = (t + 1) / tiers, cy = Math.round(top + 2 + t * step), th = Math.round(step + 5), half = Math.min(12, Math.round((3 + k * 8.5) * wk)), sh = (t % 2 ? 1 : -1) * (hs(5, t) < 0.5 ? 1 : 0), lx = Math.round(lean * (1 - k) * 2);
      for (let r = 0; r < th; r++) {
        const f = Math.pow((r + 1) / th, 0.6), hw = Math.max(1, Math.round(half * f)), jl = 0, jr = 0, xl = x + lx - hw + jl + (r > th - 3 ? sh : 0), xr = x + lx + hw - jr + (r > th - 3 ? sh : 0);   // lados recortados
        R(xl - 1, cy + r, xr - xl + 2, 1, OL);
        R(xl, cy + r, xr - xl, 1, BD);
        R(xl, cy + r, Math.max(1, Math.round((xr - xl) * (r < th * 0.45 ? 0.5 : 0.3))), 1, r < 2 ? TP : r < th * 0.45 ? LT : MD);   // luz à esquerda e no alto da camada
        R(xr - Math.max(1, Math.round((xr - xl) * 0.28)), cy + r, Math.max(1, Math.round((xr - xl) * 0.28)), 1, DP);   // sombra à direita
        if (snow && r < 2) R(xl + 1, cy + r, Math.max(1, Math.round((xr - xl) * 0.6)), 1, '#eef4fa');
      }
      // pontas recortadas da camada (caem 1–2 px, desencontradas)
      const by = cy + th, hw = half;
      for (let i = -hw; i <= hw; i += 2) { const d = hs(10 + t, i + 20) < 0.5 ? 1 : 2; R(x + lx + i + sh, by, 1, d, OL); if (d === 2) R(x + lx + i + sh, by, 1, 1, i < 0 ? MD : DP); }
      R(x + lx - Math.round(half * 0.4), by - 1, Math.round(half * 1.2), 1, DP);                            // sombra sob a camada
      if (!snow) {                                                                                            // tufos de folhas iluminadas (volume)
        const ry2 = cy + Math.round(th * 0.45), lx2 = x + lx - Math.round(half * (0.45 + hs(50, t) * 0.2));
        R(lx2, ry2, 3, 1, LT); R(lx2 + 1, ry2 - 1, 2, 1, TP); R(lx2 - 1, ry2 + 1, 3, 1, MD);
        if (half > 7) { const lx3 = x + lx + Math.round(half * 0.15); R(lx3, ry2 + 2, 2, 1, MD); R(lx3 + 1, ry2 + 1, 1, 1, LT); }
      }
    }
    R(x + Math.round(lean * 2) - 1, top, 2, 2, OL); R(x + Math.round(lean * 2), top, 1, 2, snow ? '#ffffff' : TP);   // ponta
  }
  function bush(x, y, r = 5, c = '#2f8a40') {
    shadowOval(x, y + 1, r + 1, 2);
    blob(x, y - r + 1, r + 1, '#143c24', 0.8); blob(x, y - r + 1, r, c, 0.8);
    blob(x - 1, y - r, r - 2, paintSeason > 0 ? shade(SC(c), 1.3) : shade(c, 1.3), 0.8);
    if (paintSeason === 3) { blob(x, y - r - 1, r, '#f4f8fc', 0.5); R(x - r + 1, y - r + 1, r * 2 - 2, 1, '#d4e0ec'); return; }   // arbusto coberto de neve
    if (paintSeason === 2) { R(x + 1, y - r + 2, 1, 1, '#f0c050'); R(x - 3, y - r + 1, 1, 1, '#8a3a18'); return; }
    R(x + 1, y - r + 2, 1, 1, '#ff9ec0'); R(x - 3, y - r + 1, 1, 1, '#ffe066');
    if (paintSeason === 0) { R(x - 1, y - r - 1, 1, 1, '#ffffff'); R(x + 3, y - r, 1, 1, '#ff9ec0'); }
  }
  function fence(x0, x1, y, c = '#b88448') {
    const C = SC(c), D = shade(C, 0.7), Lc = shade(C, 1.2);
    R(x0, y - 5, x1 - x0 + 3, 3, OUT); R(x0, y - 4, x1 - x0 + 3, 1, Lc); R(x0, y - 3, x1 - x0 + 3, 1, D);       // travessa
    for (let x = x0; x <= x1; x += 6) { R(x - 1, y - 8, 4, 10, OUT); R(x, y - 7, 2, 8, C); R(x, y - 7, 1, 8, Lc); R(x, y - 7, 2, 1, shade(C, 1.35)); R(x + 1, y, 1, 1, D); }
    if (paintSeason === 3) for (let x = x0; x <= x1; x += 6) R(x - 1, y - 9, 4, 2, '#f4f8fc');
  }
  function lamp(x, y) {
    R(x - 1, y - 20, 3, 20, OUT); R(x, y - 19, 1, 19, '#6a6a7a');
    R(x - 3, y - 26, 7, 7, OUT); R(x - 2, y - 25, 5, 5, '#ffe89a'); R(x - 1, y - 24, 2, 2, '#fffbe0');
    R(x - 2, y - 1, 5, 2, OUT);
  }
  function barrel(x, y) {
    R(x - 1, y - 1, 10, 12, OUT); R(x, y, 8, 10, '#9a6a3a'); R(x + 1, y, 2, 10, '#c08a4e');
    R(x, y + 2, 8, 1, '#5a4030'); R(x, y + 7, 8, 1, '#5a4030');
  }
  function sign(x, y, c) {
    R(x + 5, y, 2, 10, '#6a4426'); R(x - 1, y - 9, 14, 10, OUT); R(x, y - 8, 12, 8, '#f0e6cc'); R(x + 3, y - 6, 6, 4, c);
  }
  function well(x, y) {
    shadowOval(x + 9, y + 12, 11, 3);
    R(x - 1, y - 1, 20, 14, OUT); R(x, y, 18, 12, '#a8a098'); R(x, y, 18, 3, '#c8c0b8');
    for (let i = 0; i < 18; i += 6) { R(x + i + 5, y + 3, 1, 9, '#807870'); R(x + i + 2, y + 7, 1, 5, '#807870'); }
    R(x + 3, y + 1, 12, 3, '#2a5a9a'); R(x + 5, y + 2, 4, 1, '#8fc8f0');
    R(x, y - 14, 2, 14, '#6a4426'); R(x + 16, y - 14, 2, 14, '#6a4426');
    R(x - 3, y - 18, 24, 5, OUT); R(x - 2, y - 17, 22, 3, '#b0502e'); R(x - 2, y - 17, 22, 1, '#d87048');
  }
  function fountain(x, y) {
    shadowOval(x, y + 9, 15, 4);
    blob(x, y, 14, OUT, 0.6); blob(x, y, 13, '#d8d2c4', 0.6); blob(x, y, 10, '#3f86d8', 0.6); blob(x - 2, y - 1, 6, '#6aacf0', 0.6);
    R(x - 2, y - 10, 4, 10, OUT); R(x - 1, y - 9, 2, 9, '#e8e2d4');
    R(x - 4, y - 12, 8, 3, OUT); R(x - 3, y - 11, 6, 1, '#bfe4ff');
  }

  /* Coreto da praça sul: piso redondo de tábuas, colunas e telhado em ponta. (x, y) = centro do piso. */
  function coreto(x, y) {
    shadowOval(x + 2, y + 14, 30, 6);
    blob(x, y + 6, 27, OUT, 0.45); blob(x, y + 6, 26, '#c8a070', 0.45); blob(x, y + 5, 22, '#dcb886', 0.45);
    for (let i = -20; i <= 20; i += 5) R(x + i, y, 1, 11, '#b08458');
    [[-22, 2], [22, 2], [-12, 11], [12, 11]].forEach(([dx, dy]) => { R(x + dx - 1, y + dy - 20, 4, 21, OUT); R(x + dx, y + dy - 19, 2, 19, '#f4ead4'); });
    for (let r = 0; r < 18; r++) { const hw = 6 + Math.round(r * 1.5); R(x - hw - 1, y - 38 + r, hw * 2 + 2, 1, OUT); R(x - hw, y - 38 + r, hw * 2, 1, r % 4 === 3 ? '#8a3a2a' : r < 3 ? '#e07a5a' : '#c8583e'); }
    R(x - 1, y - 43, 3, 6, OUT); R(x, y - 42, 1, 4, '#f0c050');
    snowCap(x - 26, y - 22, 52, 3);
  }
  /* Canteiro de flores com moldura de madeira. */
  function flowerBed(x, y, w, h) {
    R(x - 1, y - 1, w + 2, h + 2, OUT); R(x, y, w, h, '#8a5e36'); R(x + 1, y + 1, w - 2, h - 2, '#6a4426');
    const cs = ['#ff7088', '#ffe066', '#ffffff', '#c8a0ff', '#ff9ec0'];
    for (let yy = y + 2; yy < y + h - 2; yy += 3) for (let xx = x + 2; xx < x + w - 2; xx += 3) {
      if (paintSeason === 3) { R(xx, yy, 2, 1, '#eef3f8'); continue; }
      R(xx, yy + 1, 1, 1, '#2f7028');
      R(xx, yy, 1, 1, paintSeason === 2 ? ['#c8581e', '#e09030', '#8a3a18'][(xx + yy) % 3] : cs[(xx * 3 + yy) % cs.length]);
    }
    solid(x, y, w, h);
  }
  /* Banco de madeira (só enfeite; o banco da praça principal é o de Seu Honório). */
  function benchDeco(x, y) {
    R(x - 1, y - 1, 22, 6, OUT); R(x, y, 20, 4, '#b88448'); R(x, y, 20, 1, '#d8a868');
    R(x - 1, y - 6, 22, 4, OUT); R(x, y - 5, 20, 2, '#a8743e');
    R(x + 1, y + 4, 2, 3, '#5a3a1e'); R(x + 17, y + 4, 2, 3, '#5a3a1e'); solid(x, y - 4, 20, 8);
  }
  /* Mesa de piquenique. */
  function picnic(x, y) {
    shadowOval(x + 13, y + 12, 16, 3);
    R(x - 1, y - 1, 28, 12, OUT); R(x, y, 26, 10, '#c08a4e'); R(x, y, 26, 2, '#dcae6e'); for (let i = 6; i < 26; i += 7) R(x + i, y + 2, 1, 8, '#9a6a3a');
    R(x - 3, y - 6, 32, 4, OUT); R(x - 2, y - 5, 30, 2, '#a8743e'); R(x - 3, y + 12, 32, 4, OUT); R(x - 2, y + 13, 30, 2, '#a8743e');
    solid(x - 3, y - 6, 32, 22);
  }
  /* Terreno reservado: estacas com fita, mato baixo e uma placa. */
  function lot(x, y, w, h, gapY) {
    for (let i = 0; i < w * h / 60; i++) R(x + 3 + rand() * (w - 6), y + 3 + rand() * (h - 6), 2, 1, rand() < 0.5 ? '#a8a060' : '#c8b878');
    const stake = (sx, sy) => { R(sx - 1, sy - 9, 4, 10, OUT); R(sx, sy - 8, 2, 8, '#d8a868'); R(sx, sy - 8, 2, 1, '#e04a3a'); };
    for (let xx = x; xx <= x + w; xx += 16) { stake(xx, y); stake(xx, y + h); }
    for (let yy = y + 16; yy < y + h; yy += 16) { if (!(yy > gapY - 14 && yy < gapY + 14)) stake(x, yy); stake(x + w, yy); }
    R(x, y - 6, w + 2, 1, '#e8d070'); R(x, y + h - 6, w + 2, 1, '#e8d070'); R(x + w, y - 6, 1, h + 1, '#e8d070');
    R(x, y - 6, 1, gapY - 12 - y, '#e8d070'); R(x, gapY + 10, 1, y + h - gapY - 10, '#e8d070');
    solid(x - 2, y - 4, w + 4, 6); solid(x - 2, y + h - 4, w + 4, 6); solid(x + w - 2, y, 6, h);
    solid(x - 2, y, 6, gapY - 12 - y); solid(x - 2, gapY + 12, 6, y + h - gapY - 12);
  }
  /* Píer de tábuas sobre a água, para pescar. */
  function pier(x, y, w, h) {
    R(x - 1, y - 1, w + 2, h + 3, OUT); R(x, y, w, h, '#b88448');
    for (let yy = y + 3; yy < y + h; yy += 4) R(x, yy, w, 1, '#7a5028');
    R(x, y, 1, h, '#d8a868'); R(x + w - 2, y, 2, h, '#6a4426');
    [[x - 2, y + h - 4], [x + w - 1, y + h - 4]].forEach(([px, py]) => { R(px - 1, py - 1, 4, 7, OUT); R(px, py, 2, 5, '#5a3a1e'); });
    open(x, y, w, h); keep(x - 8, y - 8, w + 16, h + 16);
  }

  /* ================= fachadas detalhadas da vila =================
     Cada prédio é desenhado num sprite alto (o personagem passa atrás do telhado) e
     só a parte de baixo bloqueia a passagem. Peças comuns: paredes de tábua, tijolo,
     pedra e toras; janelas, portas, telhados de água única e de duas águas, chaminés. */
  const FX = {
    planksH(x, y, w, h, c) { R(x, y, w, h, c); for (let r = 0; r < h; r += 4) { R(x, y + r, w, 1, shade(c, 1.1)); R(x, y + r + 3, w, 1, shade(c, 0.78)); for (let k = (r * 7) % 19; k < w; k += 23) R(x + k, y + r, 1, 3, shade(c, 0.82)); } },
    planksV(x, y, w, h, c) { R(x, y, w, h, c); for (let k = 0; k < w; k += 4) { R(x + k, y, 1, h, shade(c, 0.76)); R(x + k + 1, y, 1, h, shade(c, 1.1)); } for (let k = 2; k < w; k += 8) R(x + k, y + 2 + (k * 5) % Math.max(1, h - 4), 1, 2, shade(c, 0.86)); },
    brick(x, y, w, h, c) {
      R(x, y, w, h, c);
      for (let r = 0; r < h; r += 4) { R(x, y + r + 3, w, 1, shade(c, 0.68)); for (let k = ((r / 4) % 2) * 4; k < w; k += 8) { R(x + k, y + r, 1, 3, shade(c, 0.68)); if ((k + r) % 3 === 0) R(x + k + 2, y + r, 4, 1, shade(c, 1.14)); } }
    },
    stone(x, y, w, h) {
      R(x, y, w, h, '#7e776a');
      for (let r = 0; r < h; r += 4) for (let k = ((r / 4) % 2) * 3; k < w; k += 7) { const ww = Math.min(6, x + w - (x + k)); if (ww <= 0) continue; R(x + k, y + r, ww, 3, ['#a8a090', '#9a9284', '#b4ac9c'][(k + r) % 3]); R(x + k, y + r, ww, 1, '#c8c0b0'); }
    },
    logs(x, y, w, h, c) {
      for (let r = 0; r < h; r += 5) {
        R(x, y + r, w, 5, c); R(x, y + r, w, 1, shade(c, 1.25)); R(x, y + r + 4, w, 1, shade(c, 0.58)); for (let k = (r * 3) % 13; k < w; k += 17) R(x + k, y + r + 2, 4, 1, shade(c, 0.8));
        [x - 3, x + w - 1].forEach(ex => { R(ex, y + r, 4, 5, OUT); R(ex + 1, y + r + 1, 2, 3, '#d8b078'); R(ex + 1, y + r + 2, 1, 1, '#a8783a'); });
      }
    },
  };
  /* Janela: moldura, vidro com reflexo, travessas, peitoril; opções: venezianas, floreira, cortina, arco. Acende à noite. */
  function win(x, y, w, h, o = {}) {
    const fr = o.frame || '#f4f0e4';
    if (o.shutters) [x - 5, x + w + 1].forEach(sx => { R(sx, y - 1, 4, h + 2, OUT); R(sx + 1, y, 2, h, o.shutters); R(sx + 1, y, 2, 1, shade(o.shutters, 1.3)); for (let i = 2; i < h - 1; i += 3) R(sx + 1, y + i, 2, 1, shade(o.shutters, 0.68)); });
    R(x - 1, y - 1, w + 2, h + 2, OUT); R(x, y, w, h, fr);
    R(x + 1, y + 1, w - 2, h - 2, '#4f98cc'); R(x + 1, y + 1, w - 2, 2, '#8ccaf0'); R(x + 2, y + 3, 1, Math.max(1, h - 6), '#bfe4ff');
    if (o.inside) o.inside(x + 1, y + 1, w - 2, h - 2);
    if (o.curtain) { R(x + 1, y + 1, 2, h - 3, o.curtain); R(x + w - 3, y + 1, 2, h - 3, o.curtain); R(x + 1, y + 1, w - 2, 1, shade(o.curtain, 0.8)); }
    if (!o.noBars) { R(x + (w >> 1), y + 1, 1, h - 2, fr); if (h > 9) R(x + 1, y + (h >> 1), w - 2, 1, fr); }
    if (o.arch) { R(x - 1, y - 3, w + 2, 2, OUT); R(x, y - 2, w, 1, fr); R(x + 1, y - 4, w - 2, 1, OUT); }
    R(x - 2, y + h, w + 4, 2, OUT); R(x - 1, y + h, w + 2, 1, shade(fr, 0.86));
    if (o.box) {
      R(x - 2, y + h + 2, w + 4, 4, OUT); R(x - 1, y + h + 2, w + 2, 3, o.boxColor || '#8a5a32'); R(x - 1, y + h + 2, w + 2, 1, shade(o.boxColor || '#8a5a32', 1.25));
      const fl = o.flowers || ['#ff7088', '#ffe066', '#ffffff'];
      for (let i = 0; i < w + 1; i += 2) { if (paintSeason === 3) { R(x - 1 + i, y + h, 2, 1, '#f4f8fc'); continue; } R(x - 1 + i, y + h + 1, 1, 1, '#2f7028'); R(x - 1 + i, y + h, 1, 1, paintSeason === 2 ? '#c8781e' : fl[(i >> 1) % fl.length]); }
    }
    cur.lights.push({ kind: 'win', x: x + 1, y: y + 1, w: w - 2, h: h - 2 });
  }
  /* Porta com batente, almofadas, maçaneta e degrau; opções: vidro, dupla, arco. Devolve o centro. */
  function door(cx, by, w, h, c, o = {}) {
    const x = Math.round(cx - w / 2), y = by - h;
    if (o.arch) { R(x - 1, y - 4, w + 2, 2, OUT); R(x + 1, y - 5, w - 2, 1, OUT); R(x, y - 3, w, 2, o.frame || '#e8dcc0'); }
    R(x - 2, y - 2, w + 4, h + 2, OUT); R(x - 1, y - 1, w + 2, h + 1, o.frame || '#e8dcc0');
    R(x, y, w, h, c); R(x, y, 1, h, shade(c, 1.3));
    if (o.double) { R(Math.round(cx), y, 1, h, shade(c, 0.55)); [x + 2, Math.round(cx) + 2].forEach(px => { R(px, y + 2, Math.floor(w / 2) - 4, (h >> 1) - 3, shade(c, 0.84)); R(px, y + (h >> 1) + 1, Math.floor(w / 2) - 4, (h >> 1) - 3, shade(c, 0.84)); }); }
    else { R(x + 2, y + 2, w - 4, (h >> 1) - 3, shade(c, 0.84)); R(x + 2, y + (h >> 1) + 1, w - 4, (h >> 1) - 3, shade(c, 0.84)); }
    if (o.glass) { const gw = o.double ? Math.floor(w / 2) - 4 : w - 4; [x + 2, o.double ? Math.round(cx) + 2 : -1].forEach(px => { if (px < 0) return; R(px, y + 2, gw, 7, '#8ccaf0'); R(px, y + 2, gw, 1, '#d8f0ff'); R(px + 1, y + 4, 1, 3, '#d8f0ff'); }); }
    R(o.double ? Math.round(cx) - 2 : x + w - 3, y + (h >> 1), 1, 2, '#ffd75e'); if (o.double) R(Math.round(cx) + 1, y + (h >> 1), 1, 2, '#ffd75e');
    R(x - 3, by, w + 6, 2, '#c8c0b0'); R(x - 3, by, w + 6, 1, '#e0d8c8'); R(x - 3, by + 2, w + 6, 1, '#807868');
    return cx;
  }
  /* Telhado de uma água em perspectiva (beiral à frente). */
  function roofSlope(x, y, w, h, roof, o = {}) {
    for (let r = 0; r < h; r++) {
      const inset = Math.round((1 - r / h) * 4) - 3, x0 = x + inset, ww = w - inset * 2;
      R(x0 - 1, y + r, ww + 2, 1, OUT);
      for (let c = 0; c < ww; c++) {
        const band = Math.floor(r / 4), seam = (c + inset + band * 3) % 6 === 0, edge = r % 4 === 3;
        g.fillStyle = SC(edge ? shade(roof, 0.64) : seam ? shade(roof, 0.8) : r % 4 === 0 ? shade(roof, 1.16) : roof);
        if (o.moss && ((c * 7 + r * 13) % 29 === 0 || (c * 3 + r * 5) % 37 === 0)) g.fillStyle = SC('#58884a');
        g.fillRect(x0 + c, y + r, 1, 1);
      }
    }
    R(x + 1, y - 1, w - 2, 1, OUT); R(x + 1, y, w - 2, 2, shade(roof, 1.32));
    R(x - 4, y + h, w + 8, 1, OUT); R(x - 3, y + h - 1, w + 6, 1, o.trim || shade(roof, 0.5));
    snowCap(x - 2, y, w + 4, Math.max(5, Math.round(h * 0.45)));
  }
  /* Telhado de duas águas visto de frente (empena triangular com parede própria). */
  function roofGable(x, y, w, h, roof, face, o = {}) {
    const cx = x + w / 2, eave = o.eave == null ? 4 : o.eave, t = o.t || 7;
    for (let r = 0; r <= h; r++) {
      const hw = (r + 1) / (h + 1) * (w / 2 + eave), xl = Math.round(cx - hw), xr = Math.round(cx + hw);
      R(xl - 1, y + r, xr - xl + 2, 1, OUT);
      for (let px = xl; px < xr; px++) { const seam = (px + Math.floor(r / 3) * 2) % 5 === 0; g.fillStyle = SC(r % 3 === 2 ? shade(roof, 0.7) : seam ? shade(roof, 0.84) : (px - xl < 2 || xr - px <= 2) ? shade(roof, 1.2) : roof); g.fillRect(px, y + r, 1, 1); }
      if (paintSeason === 3) { R(xl, y + r, Math.min(3, xr - xl), 1, '#f4f8fc'); R(xr - 3, y + r, 3, 1, '#f4f8fc'); }
      const ih = hw - t; if (ih > 1 && r < h) {
        const il = Math.round(cx - ih), ir = Math.round(cx + ih);
        R(il - 1, y + r, ir - il + 2, 1, OUT); R(il, y + r, ir - il, 1, r % 4 === 3 ? shade(face, 0.8) : face);
      }
    }
    R(Math.round(cx - w / 2 - eave) - 1, y + h + 1, w + eave * 2 + 2, 1, OUT);
    if (o.vent) { const vy = y + Math.round(h * 0.55); R(cx - 4, vy - 1, 8, 8, OUT); R(cx - 3, vy, 6, 6, o.ventColor || '#e8dcc0'); if (o.vent === 'round') { R(cx - 2, vy + 1, 4, 4, '#4f98cc'); R(cx - 2, vy + 1, 2, 1, '#bfe4ff'); cur.lights.push({ kind: 'win', x: cx - 2, y: vy + 1, w: 4, h: 4 }); } else for (let i = 0; i < 6; i += 2) R(cx - 3, vy + i, 6, 1, shade(o.ventColor || '#e8dcc0', 0.6)); }
    if (paintSeason === 3) { R(cx - 2, y, 4, 2, '#ffffff'); }
  }
  function chimney(x, y, h, c = '#a09088') {
    R(x - 1, y - 1, 8, h + 1, OUT); FX.brick(x, y, 6, h, c); R(x - 2, y - 3, 10, 3, OUT); R(x - 1, y - 2, 8, 1, '#d0c8c0');
    if (paintSeason === 3) R(x - 1, y - 3, 8, 1, '#ffffff');
    if (cur.smokes) cur.smokes.push([x + 2, y - 4]);
  }
  /* Fonte das placas grandes: letras de 8×11 com traço de 2 px, desenhadas uma a uma
     (nada de esticar uma fonte pequena), com 2 px entre as letras. */
  const SIGN_FONT = { h: 11, gap: 2, g: {
    C: ['.######.', '########', '##....##', '##......', '##......', '##......', '##......', '##......', '##....##', '########', '.######.'],
    E: ['########', '########', '##......', '##......', '######..', '######..', '##......', '##......', '##......', '########', '########'],
    L: ['##......', '##......', '##......', '##......', '##......', '##......', '##......', '##......', '##......', '########', '########'],
    S: ['.######.', '########', '##....##', '##......', '#######.', '.#######', '......##', '......##', '##....##', '########', '.######.'],
    T: ['########', '########', '...##...', '...##...', '...##...', '...##...', '...##...', '...##...', '...##...', '...##...', '...##...'],
  } };
  const signWidth = str => [...str].reduce((a, ch) => a + (SIGN_FONT.g[ch] ? SIGN_FONT.g[ch][0].length : 4), 0) + SIGN_FONT.gap * (str.length - 1);
  function signText(x, y, str, c) {
    let cx = x;
    [...str].forEach(ch => { const gl = SIGN_FONT.g[ch]; if (gl) { gl.forEach((row, j) => [...row].forEach((v, i) => { if (v === '#') R(cx + i, y + j, 1, 1, c); })); cx += gl[0].length + SIGN_FONT.gap; } else cx += 4 + SIGN_FONT.gap; });
  }
  /* Letreiro com letras de pixel em escala 2 (bem legível). */
  function bigText(x, y, str, c) {
    [...str].forEach((ch, i) => { const gl = GLYPH[ch]; if (!gl) return; for (let k = 0; k < 15; k++) if (gl[k] === '1') R(x + i * 8 + (k % 3) * 2, y + Math.floor(k / 3) * 2, 2, 2, c); });
  }
  function sideTrim(x, y, h, c) { R(x - 1, y, 4, h, OUT); R(x, y, 2, h, c); R(x, y, 1, h, shade(c, 1.25)); }
  function crate(x, y, fruit) { R(x - 1, y - 1, 16, 11, OUT); R(x, y, 14, 9, '#b88448'); R(x, y + 4, 14, 1, '#7a5028'); R(x, y, 14, 1, '#d8a868'); for (let i = 1; i < 13; i += 3) { R(x + i, y - 3, 3, 3, OUT); R(x + i, y - 3, 2, 2, fruit[(i / 3 | 0) % fruit.length]); } }
  function potPlant(x, y, c = '#3f9648') { R(x - 1, y - 6, 8, 7, OUT); R(x, y - 5, 6, 5, '#b0603a'); R(x, y - 5, 6, 1, '#d08050'); blob(x + 3, y - 9, 4, OUT); blob(x + 3, y - 9, 3, paintSeason === 3 ? '#9aa8b4' : c); if (paintSeason === 0) R(x + 2, y - 11, 1, 1, '#ff9ec0'); }
  function lantern(x, y) { R(x, y, 1, 3, OUT); R(x - 2, y + 3, 5, 6, OUT); R(x - 1, y + 4, 3, 4, '#ffe89a'); R(x - 2, y + 9, 5, 1, OUT); cur.lights.push({ kind: 'glow', x, y: y + 6, r: 16 }); }
  function picketFence(x0, x1, y, colors) {
    R(x0, y - 5, x1 - x0 + 3, 2, OUT); R(x0, y - 4, x1 - x0 + 3, 1, '#f4f0e4');
    for (let x = x0, i = 0; x <= x1; x += 4, i++) { const c = colors ? colors[i % colors.length] : '#f4f0e4'; R(x - 1, y - 9, 4, 10, OUT); R(x, y - 8, 2, 8, c); R(x, y - 9, 2, 1, OUT); R(x, y - 8, 1, 8, shade(c, 1.15)); if (paintSeason === 3) R(x - 1, y - 10, 4, 1, '#ffffff'); }
  }
  /* Sprite do prédio: desenha em coordenadas do mundo, num canvas próprio. */
  function bldSprite(x0, y0, w, h, base, fn) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const prev = g; g = c.getContext('2d'); g.translate(-x0, -y0);
    let out; try { out = fn(); } finally { g = prev; }
    cur.sprites.push({ img: c, x: x0, y: y0, base });
    return out;
  }

  /* ---------- Armazém CELESTE: comércio no térreo, casa de Dona Celeste em cima ---------- */
  function paintArmazem(o) {
    const { x, w } = o, b = o.y + o.h, cx = x + w / 2;
    chimney(x + 78, 14, 18, '#a86a4a');
    roofSlope(x, 22, w, 32, '#a8402e', { trim: '#5a1a12' });
    // empena central com janela redonda (a casa de cima)
    roofGable(cx - 22, 10, 44, 30, '#8e3424', '#f2e6cc', { vent: 'round', t: 6 });
    // andar de cima: tábuas creme, cantoneiras, três janelas com floreira e cortina
    R(x - 1, 53, w + 2, 44, OUT); FX.planksH(x, 54, w, 42, '#efe2c4'); R(x, 54, w, 3, shade('#efe2c4', 0.7));
    sideTrim(x, 54, 42, '#6a4426'); sideTrim(x + w - 2, 54, 42, '#6a4426');
    [x + 12, cx - 6, x + w - 24].forEach(wx => win(wx, 63, 12, 14, { shutters: '#3f7a4a', box: true, curtain: '#e8a0a8', flowers: ['#ff7088', '#ffe066', '#c8a0ff'] }));
    // térreo: comércio de madeira pintada, vitrines com toldos listrados, porta dupla de vidro
    R(x - 1, 113, w + 2, b - 112, OUT); FX.planksV(x, 114, w, b - 114, '#5f8f6a'); R(x, 114, w, 2, shade('#5f8f6a', 0.6));
    sideTrim(x, 114, b - 114, '#4a3020'); sideTrim(x + w - 2, 114, b - 114, '#4a3020');
    [[x + 8, 26], [x + w - 34, 26]].forEach(([vx, vw]) => {
      for (let i = 0; i < vw + 4; i++) { R(vx - 2 + i, 118, 1, 5, Math.floor(i / 3) % 2 ? '#f4ecd8' : '#c8402e'); R(vx - 2 + i, 123, 1, 1, Math.floor(i / 3) % 2 ? '#d8ccb0' : '#8a2a1a'); }
      R(vx - 3, 117, vw + 6, 1, OUT); R(vx - 3, 124, vw + 6, 1, OUT);
      win(vx, 126, vw, 12, { frame: '#e8dcc0', noBars: true, inside: (ix, iy, iw, ih) => { R(ix, iy + ih - 4, iw, 1, '#8a5e36'); R(ix, iy + 5, iw, 1, '#8a5e36'); for (let i = 1; i < iw - 2; i += 4) { R(ix + i, iy + ih - 7, 3, 3, ['#e04a3a', '#f0a020', '#58b858', '#ffe066'][(i >> 2) % 4]); R(ix + i + 1, iy + 1, 2, 4, ['#c89858', '#f4f0e4', '#e8a0a8'][(i >> 2) % 3]); } } });
    });
    // letreiro CELESTE: faixa contínua de uma ponta à outra da fachada, entre o comércio e a casa de cima
    const bx0 = x - 4, bw = w + 8, by0 = 92, bh = 24;                               // moldura de madeira (contorno incluído)
    R(bx0, by0, bw, bh, OUT); R(bx0 + 1, by0 + 1, bw - 2, bh - 2, '#5a3a22'); R(bx0 + 1, by0 + 1, bw - 2, 1, '#8a5a32'); R(bx0 + 1, by0 + bh - 2, bw - 2, 1, '#3a2414');
    for (let i = bx0 + 3; i < bx0 + bw - 3; i += 5) R(i, by0 + bh - 3, 2, 1, '#4a2e1a');
    const px0 = bx0 + 3, pw = bw - 6, py0 = by0 + 3, ph = bh - 6;                   // fundo bege
    R(px0, py0, pw, ph, '#f6e6b8'); R(px0, py0, pw, 1, '#fff6d8'); R(px0, py0 + ph - 1, pw, 1, '#d8c490');
    [[px0 + 2, py0 + 2], [px0 + pw - 4, py0 + 2], [px0 + 2, py0 + ph - 4], [px0 + pw - 4, py0 + ph - 4]].forEach(([nx, ny]) => R(nx, ny, 2, 2, '#b89868'));   // pregos
    const tw = signWidth('CELESTE');                                               // centralizado pela largura real do texto
    signText(Math.round(px0 + (pw - tw) / 2), py0 + Math.floor((ph - SIGN_FONT.h) / 2), 'CELESTE', '#6a1c10');
    FX.stone(x, b - 4, w, 4);
    const dc = door(cx, b, 18, 24, '#7a4a2a', { double: true, glass: true, frame: '#f0e0b8' });
    lantern(cx - 15, 119); lantern(cx + 14, 119);
    crate(x + 4, b - 8, ['#e04a3a', '#58b858', '#f0a020']); crate(x + w - 18, b - 8, ['#ffe066', '#e88a20', '#9ac850']);
    potPlant(cx - 15, b, '#3f9648'); potPlant(cx + 10, b, '#2f8a40');
    return dc;
  }
  /* ---------- Casa de Seu Honório: carpinteiro aposentado (madeira escura, pedra, bancada) ---------- */
  function paintHonorio(o) {
    const { x, w } = o, b = o.y + o.h, cx = x + w / 2;
    chimney(x + 52, 34, 24, '#9a8a7a');
    roofGable(x, 40, w, 52, '#5a5a6e', '#a07a52', { vent: 'slats', ventColor: '#c8a070', t: 8 });
    R(x - 1, 93, w + 2, b - 92, OUT); FX.planksV(x, 94, w, b - 94, '#7a5a3a'); R(x, 94, w, 3, shade('#7a5a3a', 0.6));
    FX.stone(x, b - 8, w, 8);
    win(x + 8, 104, 11, 12, { shutters: '#4a3020', frame: '#d8c8a8' }); win(x + w - 19, 104, 11, 12, { shutters: '#4a3020', frame: '#d8c8a8' });
    // alpendre sobre a porta, com dois esteios
    R(cx - 15, 98, 30, 5, OUT); for (let i = 0; i < 28; i++) R(cx - 14 + i, 99, 1, 3, i % 3 ? '#6a6a7e' : '#4a4a5a'); snowCap(cx - 15, 97, 30, 3);
    [cx - 13, cx + 11].forEach(px => { R(px - 1, 103, 4, b - 103, OUT); R(px, 103, 2, b - 103, '#c8a070'); });
    const dc = door(cx, b, 12, 18, '#5a3a22', { frame: '#c8a070' });
    // bancada de carpinteiro e tábuas encostadas
    R(x - 22, b - 13, 20, 4, OUT); R(x - 21, b - 12, 18, 2, '#c89858'); R(x - 20, b - 9, 2, 9, '#6a4426'); R(x - 6, b - 9, 2, 9, '#6a4426'); R(x - 16, b - 16, 6, 3, '#8a8a98'); R(x - 9, b - 15, 4, 2, '#c8483a');
    [[x + w + 3, 0], [x + w + 7, 2]].forEach(([px, k]) => { R(px - 1, b - 30 + k, 4, 30 - k, OUT); R(px, b - 29 + k, 2, 29 - k, '#d8a868'); });
    return dc;
  }
  /* ---------- Casa de Bia: amarela, varanda, catavento de galo, horta com cerquinha ---------- */
  function paintBia(o) {
    const { x, w } = o, b = o.y + o.h, cx = x + w / 2;
    chimney(x + 10, 214, 14, '#b07a5a');
    roofSlope(x, 216, w, 32, '#4a8a5a', { trim: '#c8402e' });
    // água-furtada com janelinha
    R(cx - 10, 222, 20, 18, OUT); R(cx - 9, 228, 18, 12, '#f6dc8a'); for (let r = 0; r < 7; r++) R(cx - 10 + r, 222 + r - 1, 20 - r * 2, 1, r % 2 ? '#3f7a4e' : '#58a06a');
    win(cx - 4, 230, 8, 8, { frame: '#ffffff' });
    // catavento de galo
    R(cx + 18, 202, 1, 16, OUT); R(cx + 14, 205, 9, 1, OUT); R(cx + 16, 199, 5, 3, '#e8a020'); R(cx + 20, 197, 2, 2, '#c8402e'); R(cx + 15, 198, 2, 2, '#e8a020');
    R(x - 1, 247, w + 2, b - 246, OUT); FX.planksH(x, 248, w, b - 248, '#f0d27a'); R(x, 248, w, 3, shade('#f0d27a', 0.7));
    sideTrim(x, 248, b - 248, '#ffffff'); sideTrim(x + w - 2, 248, b - 248, '#ffffff');
    win(x + 8, 255, 12, 12, { box: true, boxColor: '#c8402e', flowers: ['#ff7088', '#ffffff', '#ffe066'], curtain: '#ffffff' });
    win(x + w - 20, 255, 12, 12, { box: true, boxColor: '#c8402e', flowers: ['#ffe066', '#ff7088', '#ffffff'], curtain: '#ffffff' });
    // varanda coberta com degraus
    R(x - 4, 272, w + 8, 4, OUT); for (let i = 0; i < w + 6; i++) R(x - 3 + i, 273, 1, 2, i % 4 < 2 ? '#c8402e' : '#ffffff'); snowCap(x - 4, 271, w + 8, 3);
    [x - 1, x + 22, x + w - 24, x + w - 3].forEach(px => { R(px - 1, 276, 4, b - 276, OUT); R(px, 276, 2, b - 276, '#ffffff'); });
    R(x - 2, b - 3, w + 4, 4, '#c89858'); R(x - 2, b - 3, w + 4, 1, '#e8c088');
    const dc = door(cx, b - 2, 12, 18, '#c8683a', { frame: '#ffffff', glass: true });
    // galinha de madeira na varanda e casinha de passarinho
    R(x + 4, b - 12, 7, 6, OUT); R(x + 5, b - 11, 5, 4, '#ffffff'); R(x + 9, b - 14, 2, 2, '#e04a3a'); R(x + 11, b - 10, 1, 1, '#f0a020');
    const hx = x + w + 14; R(hx, b - 28, 1, 26, OUT); R(hx - 4, b - 36, 9, 8, OUT); R(hx - 3, b - 35, 7, 6, '#58a06a'); R(hx - 4, b - 38, 9, 2, '#c8402e'); R(hx, b - 33, 2, 2, OUT);
    return dc;
  }
  /* ---------- Casa de Iara: lilás, sótão-ateliê com cavalete, cerca colorida e respingos de tinta ---------- */
  function paintIara(o) {
    const { x, w } = o, b = o.y + o.h, cx = x + w / 2;
    chimney(x + 54, 228, 12, '#b0a0c0');
    roofGable(x, 230, w, 34, '#7a4ac8', '#f4eefc', { t: 7 });
    // janela do sótão-ateliê com cavalete e tela à mostra
    win(cx - 6, 246, 12, 11, { frame: '#ffffff', noBars: true, inside: (ix, iy) => { R(ix + 2, iy + 2, 1, 7, '#6a4426'); R(ix + 7, iy + 2, 1, 7, '#6a4426'); R(ix + 1, iy + 1, 8, 5, '#fff8ec'); R(ix + 2, iy + 2, 3, 2, '#9ac8e8'); R(ix + 4, iy + 3, 4, 2, '#78b04c'); R(ix + 6, iy + 2, 2, 1, '#f2d24a'); } });
    R(x - 1, 263, w + 2, b - 262, OUT); FX.planksV(x, 264, w, b - 264, '#e6dcf6'); R(x, 264, w, 3, shade('#e6dcf6', 0.72));
    sideTrim(x, 264, b - 264, '#9a74d8'); sideTrim(x + w - 2, 264, b - 264, '#9a74d8');
    win(x + 8, 270, 12, 12, { shutters: '#e0a23a', box: true, boxColor: '#5a58b8', flowers: ['#ff7088', '#ffe066', '#3f86d0', '#78b04c'] });
    win(x + w - 20, 270, 12, 12, { shutters: '#e0a23a', box: true, boxColor: '#5a58b8', flowers: ['#c8a0ff', '#ff9ec0', '#ffe066', '#58b858'] });
    const dc = door(cx, b, 12, 18, '#3f86d0', { arch: true, frame: '#ffffff' });
    // paleta pendurada ao lado da porta e respingos de tinta no degrau
    R(cx + 9, 278, 10, 7, OUT); R(cx + 10, 279, 8, 5, '#e8c890'); [['#e04a5a', 11, 280], ['#3f86d0', 14, 280], ['#f2d24a', 16, 282], ['#78b04c', 12, 282]].forEach(([c, dx, dy]) => R(cx + dx, dy, 2, 1, c));
    [['#e04a5a', -9, 1], ['#3f86d0', 6, 2], ['#f2d24a', -2, 2], ['#78b04c', 9, 1]].forEach(([c, dx, dy]) => R(cx + dx, b + dy, 2, 1, c));
    // cerquinha de estacas pintadas de cores diferentes, com canteiro
    picketFence(x - 26, x - 6, b + 2, ['#e04a5a', '#f2d24a', '#3f86d0', '#78b04c', '#c8a0ff', '#e0a23a']);
    for (let i = 0; i < 18; i += 3) { if (paintSeason === 3) continue; R(x - 24 + i, b - 6, 1, 3, '#2f7028'); R(x - 24 + i, b - 7, 2, 2, ['#ff7088', '#ffe066', '#c8a0ff'][i % 3]); }
    return dc;
  }
  /* ---------- Escola: tijolinho, frontão com relógio, torre do sino, escadaria e mastro ---------- */
  function paintEscola(o) {
    const { x, w } = o, b = o.y + o.h, cx = x + w / 2;
    // torre do sino
    R(cx - 7, 470, 14, 16, OUT); R(cx - 6, 476, 12, 10, '#f4f0e4'); R(cx - 4, 478, 8, 7, '#3a2a20'); R(cx - 2, 479, 4, 4, '#e8c060'); R(cx - 1, 483, 2, 1, '#a88030');
    for (let r = 0; r < 7; r++) R(cx - 8 + r, 470 + r - 2, 16 - r * 2, 1, r % 2 ? '#3f6a4a' : '#2f5a3a'); R(cx, 466, 1, 3, OUT);
    roofSlope(x, 486, w, 26, '#3f6a4a', { trim: '#f4f0e4' });
    roofGable(cx - 20, 484, 40, 22, '#355e40', '#f4f0e4', { t: 5, eave: 3 });
    R(cx - 5, 493, 10, 10, OUT); R(cx - 4, 494, 8, 8, '#ffffff'); R(cx, 495, 1, 4, OUT); R(cx, 498, 3, 1, OUT);   // relógio
    R(x - 1, 511, w + 2, b - 510, OUT); FX.brick(x, 512, w, b - 512, '#b8583a'); R(x, 512, w, 3, '#7a3424');
    sideTrim(x, 512, b - 512, '#f4f0e4'); sideTrim(x + w - 2, 512, b - 512, '#f4f0e4'); FX.stone(x, b - 5, w, 5);
    [x + 7, x + 20, x + w - 28, x + w - 15].forEach(wx => win(wx, 532, 8, 14, { frame: '#ffffff', arch: true }));
    R(cx - 17, 514, 34, 12, OUT); R(cx - 16, 515, 32, 10, '#2f5a3a'); R(cx - 15, 516, 30, 8, '#f8f0dc'); pixelText(cx - 11, 517, 'ESCOLA', '#2f5a3a');
    const dc = door(cx, b - 2, 16, 20, '#3f7a4a', { double: true, arch: true, frame: '#ffffff' });
    R(cx - 14, b - 2, 28, 3, '#c8c0b0'); R(cx - 14, b - 2, 28, 1, '#e8e0d0'); R(cx - 16, b + 1, 32, 2, '#a8a090');
    // mastro com bandeirola verde e amarela
    R(x - 16, 486, 2, b - 486, OUT); R(x - 15, 486, 1, b - 486, '#d8d8e0'); R(x - 13, 488, 12, 7, OUT); R(x - 12, 489, 10, 5, '#3f9a52'); R(x - 9, 490, 4, 3, '#f2d24a');
    return dc;
  }
  /* ---------- Cabana de Tomé: toras, telhado com musgo, chaminé de pedra, lenha e vara de pesca ---------- */
  function paintTome(o) {
    const { x, w } = o, b = o.y + o.h;
    R(x + 4, 38, 10, 32, OUT); FX.stone(x + 5, 39, 8, 30); R(x + 3, 36, 12, 3, OUT); if (cur.smokes) cur.smokes.push([x + 8, 34]);
    roofSlope(x - 2, 48, w + 4, 38, '#4a6a4a', { moss: true, trim: '#2a3a22' });
    R(x - 1, 85, w + 2, b - 84, OUT); FX.logs(x, 86, w, b - 86, '#8a5e36');
    win(x + 8, 96, 10, 10, { frame: '#c8a070', curtain: '#a8c870' }); win(x + w - 18, 96, 10, 10, { frame: '#c8a070' });
    const dc = door(x + o.doorX, b, 12, 18, '#5a3a22', { frame: '#a07a52' });
    lantern(x + o.doorX + 10, 104);
    // pilha de lenha, balde e vara de pesca encostada
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4 - r; c++) { const lx = x + w + 6 + c * 5 + r * 2, ly = b - 6 - r * 5; R(lx - 1, ly - 1, 6, 6, OUT); R(lx, ly, 4, 4, '#a8743e'); R(lx + 1, ly + 1, 2, 2, '#d8b078'); }
    R(x - 10, b - 7, 7, 7, OUT); R(x - 9, b - 6, 5, 5, '#8a8a98'); R(x - 8, b - 6, 3, 1, '#4f98cc');
    for (let i = 0; i < 26; i++) R(x - 4 + Math.round(i * 0.15), b - 2 - i, 1, 1, i > 20 ? '#e8e0c0' : '#c8a060');
    return dc;
  }

  /* Casa vista de cima, de frente. opts: x, y (canto de cima), w, h, cores. */
  function house(o) {
    const { x, y, w, h } = o;
    const rh = Math.round(h * (o.roofRatio || 0.5)), wy = y + rh, wh = h - rh;
    const wall = o.wall || '#ece2c8', roof = o.roof || '#c2523a';
    g.fillStyle = 'rgba(20,40,20,.25)'; g.fillRect(x + 3, y + h, w + 2, 3); g.fillRect(x + w, wy + 4, 5, wh - 2);
    // parede
    R(x - 1, wy - 1, w + 2, wh + 2, OUT); R(x, wy, w, wh, wall);
    if (o.brick) {
      for (let r = 0; r < wh; r += 3) { R(x, wy + r + 2, w, 1, shade(wall, 0.78));
        for (let c = (r / 3 % 2) * 3; c < w; c += 6) R(x + c, wy + r, 1, 2, shade(wall, 0.78)); }
    } else {
      for (let r = 3; r < wh - 4; r += 3) R(x, wy + r, w, 1, shade(wall, 0.92));      // tábuas da parede
      R(x, wy + wh - 4, w, 4, shade(wall, 0.86)); R(x, wy + wh - 4, w, 1, shade(wall, 0.78));
      if (o.timber !== false) { const t = o.timber || '#7a5a3a'; R(x, wy, 2, wh, t); R(x + w - 2, wy, 2, wh, t); R(x, wy + Math.floor(wh / 2) - 1, w, 1, shade(wall, 0.9)); }
    }
    R(x, wy, w, 3, shade(wall, 0.72));                       // sombra do beiral
    // telhado em perspectiva: mais estreito na cumeeira
    for (let r = 0; r < rh; r++) {
      const inset = Math.round((1 - r / rh) * 4) - 3;        // de +1 a -3 → beiral avança 3px
      const x0 = x + inset, ww = w - inset * 2;
      R(x0 - 1, y + r, ww + 2, 1, OUT);
      for (let c = 0; c < ww; c++) {
        const band = Math.floor(r / 4), seam = (c + inset + band * 3) % 6 === 0, edge = r % 4 === 3;
        g.fillStyle = o.flatRoof ? (c % 4 === 0 ? shade(roof, 0.82) : roof)
          : edge ? shade(roof, 0.66) : seam ? shade(roof, 0.8) : (r % 4 === 0 ? shade(roof, 1.18) : roof);
        g.fillRect(x0 + c, y + r, 1, 1);
      }
    }
    R(x + 1, y - 1, w - 2, 1, OUT); R(x + 1, y, w - 2, 2, shade(roof, 1.3));
    snowCap(x - 2, y, w + 4, Math.max(5, Math.round(rh * 0.45)));
    R(x - 4, y + rh, w + 8, 1, OUT);
    if (o.chimney) { const cx = x + o.chimney; R(cx - 1, y - 7, 8, 12, OUT); R(cx, y - 6, 6, 10, '#a09088'); R(cx, y - 6, 6, 2, '#c8bab0'); R(cx + 4, y - 4, 2, 8, '#807068'); }
    // janelas
    (o.windows || []).forEach(([wx, wyy, ww = 9, whh = 9]) => {
      const X = x + wx, Y = wy + wyy;
      if (cur.lights) cur.lights.push({ kind: 'win', x: X + 1, y: Y + 1, w: ww - 2, h: whh - 2 });
      R(X - 1, Y - 1, ww + 2, whh + 2, OUT); R(X, Y, ww, whh, '#f4f0e4');
      R(X + 1, Y + 1, ww - 2, whh - 2, '#6ab4e8'); R(X + 1, Y + 1, ww - 2, 2, '#a8dcff');
      R(X + Math.floor(ww / 2), Y + 1, 1, whh - 2, '#f4f0e4'); R(X + 1, Y + Math.floor(whh / 2), ww - 2, 1, '#f4f0e4');
      if (o.flowerBox) { R(X - 1, Y + whh, ww + 2, 2, '#7a4a2a'); for (let i = 0; i < ww; i += 2) R(X + i, Y + whh - 1, 1, 1, i % 4 ? '#ff7088' : '#ffe066'); }
      if (o.shutters) { R(X - 3, Y - 1, 2, whh + 2, o.shutters); R(X + ww + 1, Y - 1, 2, whh + 2, o.shutters); }
    });
    // porta
    if (o.door !== false) {
      const dw = o.doorW || 10, dx = x + (o.doorX != null ? o.doorX : Math.floor(w / 2) - dw / 2), dh = Math.min(16, wh - 3), dy = y + h - dh;
      R(dx - 1, dy - 1, dw + 2, dh + 1, OUT); R(dx, dy, dw, dh, o.door || '#8a5a34');
      R(dx, dy, 2, dh, shade(o.door || '#8a5a34', 1.25)); R(dx + Math.floor(dw / 2), dy, 1, dh, shade(o.door || '#8a5a34', 0.75));
      R(dx + dw - 3, dy + Math.floor(dh / 2), 1, 2, '#ffd75e');
      R(dx - 2, y + h, dw + 4, 2, '#b8b0a0'); R(dx - 2, y + h + 2, dw + 4, 1, '#807868');
      return dx + dw / 2;
    }
  }

  /* Casa da fazenda: madeira, telhado de telhas, varanda com toldo e degraus.
     (x, y) = canto de cima do telhado. Devolve o ponto em frente à porta. */
  function farmhouse(x, y) {
    const w = 96, roofH = 44, wy = y + roofH, wallH = 36, by = wy + wallH, dx = x + w / 2;
    g.fillStyle = 'rgba(20,40,20,.25)'; g.fillRect(x + 4, by + 14, w, 3); g.fillRect(x + w + 1, wy + 4, 5, wallH + 10);
    // parede de tábuas horizontais
    R(x - 1, wy - 1, w + 2, wallH + 2, OUT);
    for (let r = 0; r < wallH; r += 4) {
      R(x, wy + r, w, 4, r % 8 ? '#b47c48' : '#a8703e'); R(x, wy + r + 3, w, 1, '#7a4e2a'); R(x, wy + r, w, 1, '#c8925a');
      for (let c = (r % 8 ? 9 : 22); c < w; c += 31) R(x + c, wy + r, 1, 3, '#7a4e2a');
      if (rand() < 0.5) R(x + 6 + Math.floor(rand() * (w - 12)), wy + r + 1, 2, 1, '#8a5a32');
    }
    R(x, wy, 3, wallH, '#6a4426'); R(x + w - 3, wy, 3, wallH, '#6a4426'); R(x, wy, w, 3, 'rgba(40,20,10,.35)');
    // janelas com venezianas verdes e floreiras
    [[x + 12, wy + 9], [x + w - 28, wy + 9]].forEach(([X, Y]) => {
      cur.lights.push({ kind: 'win', x: X + 2, y: Y + 2, w: 12, h: 9 });
      R(X - 1, Y - 1, 18, 15, OUT); R(X, Y, 16, 13, '#f2e6c8'); R(X + 2, Y + 2, 12, 9, '#ffd98a'); R(X + 2, Y + 2, 12, 3, '#fff0c0');
      R(X + 7, Y + 2, 2, 9, '#f2e6c8'); R(X + 2, Y + 6, 12, 1, '#f2e6c8');
      R(X - 5, Y - 1, 4, 15, OUT); R(X - 4, Y, 2, 13, '#4a8a5a'); R(X + 17, Y - 1, 4, 15, OUT); R(X + 18, Y, 2, 13, '#4a8a5a');
      R(X - 1, Y + 13, 18, 3, '#6a4426'); for (let i = 0; i < 16; i += 2) R(X + i, Y + 12, 2, 1, ['#ff7088', '#ffe066', '#ffffff', '#ff9ec0'][(i / 2) % 4]);
    });
    // porta de madeira com janelinha
    R(dx - 8, by - 24, 16, 24, OUT); R(dx - 7, by - 23, 14, 23, '#7a4422'); R(dx - 7, by - 23, 14, 2, '#9a5a30');
    R(dx - 5, by - 20, 10, 6, '#ffd98a'); R(dx - 1, by - 20, 1, 6, '#7a4422'); R(dx - 5, by - 12, 4, 9, '#6a3a1c'); R(dx + 1, by - 12, 4, 9, '#6a3a1c');
    R(dx + 4, by - 9, 2, 2, '#ffd75e');
    // lampião ao lado da porta
    R(dx + 12, by - 22, 5, 7, OUT); R(dx + 13, by - 21, 3, 5, '#ffe89a'); R(dx + 14, by - 23, 1, 2, OUT);
    // telhado de telhas com beiral e cumeeira
    for (let r = 0; r < roofH; r++) {
      const inset = Math.round((1 - r / roofH) * 7) - 5, x0 = x + inset, ww = w - inset * 2;
      R(x0 - 1, y + r, ww + 2, 1, OUT);
      for (let c = 0; c < ww; c++) {
        const band = Math.floor(r / 5), edge = r % 5 === 4, seam = (c + band * 4) % 8 === 0;
        g.fillStyle = edge ? '#5e2a1c' : seam ? '#7a3826' : r % 5 === 0 ? '#c0603e' : '#a24c32';
        g.fillRect(x0 + c, y + r, 1, 1);
      }
    }
    R(x - 1, y - 2, w + 2, 3, OUT); R(x, y - 1, w, 2, '#d0744c');
    snowCap(x - 3, y - 1, w + 6, 12);
    R(x - 6, wy, w + 12, 2, OUT); R(x - 5, wy, w + 10, 1, '#5e2a1c');
    cur.lights.push({ kind: 'glow', x: dx + 14, y: by - 19, r: 26 }, { kind: 'win', x: dx - 5, y: by - 20, w: 10, h: 6 }, { kind: 'win', x: dx - 5, y: y + 18, w: 10, h: 8 });
    // água-furtada no meio do telhado
    R(dx - 11, y + 12, 22, 18, OUT); R(dx - 10, y + 13, 20, 16, '#b47c48'); R(dx - 6, y + 17, 12, 10, '#f2e6c8'); R(dx - 5, y + 18, 10, 8, '#ffd98a'); R(dx, y + 18, 1, 8, '#f2e6c8');
    for (let r = 0; r < 8; r++) R(dx - 12 - (r >> 1) + 4, y + 6 + r, 16 + r - 0, 1, r === 7 ? '#5e2a1c' : '#a24c32');
    R(dx - 9, y + 5, 18, 1, OUT);
    // chaminé de pedra
    const cx = x + w - 22; R(cx - 1, y - 12, 12, 22, OUT); R(cx, y - 11, 10, 20, '#9a9088');
    for (let r = 0; r < 20; r += 4) for (let c = (r % 8 ? 0 : 3); c < 10; c += 6) R(cx + c, y - 11 + r, 1, 3, '#7a7068');
    R(cx - 2, y - 13, 14, 3, '#6a6058');
    // varanda: assoalho, toldo, colunas, guarda-corpo e degraus
    R(x + 3, by, w - 6, 13, OUT); R(x + 4, by, w - 8, 12, '#c89a62');
    for (let r = 0; r < 12; r += 3) R(x + 4, by + r + 2, w - 8, 1, '#a07848');
    R(x + 4, by, w - 8, 2, 'rgba(40,20,10,.3)');
    R(x + 8, wy + 1, w - 16, 5, OUT); R(x + 9, wy + 1, w - 18, 3, '#8a4a2e'); R(x + 9, wy + 1, w - 18, 1, '#b8603e');
    [x + 10, x + w - 13].forEach(px => { R(px - 1, wy + 5, 5, by - wy + 6, OUT); R(px, wy + 5, 3, by - wy + 5, '#e8dcc0'); R(px, wy + 5, 1, by - wy + 5, '#ffffff'); });
    [[x + 4, dx - 13], [dx + 13, x + w - 4]].forEach(([a, b]) => { R(a, by + 6, b - a, 2, OUT); R(a, by + 6, b - a, 1, '#e8dcc0'); for (let i = a + 3; i < b - 1; i += 5) R(i, by + 7, 1, 5, '#e8dcc0'); });
    R(dx - 12, by + 12, 24, 4, OUT); R(dx - 11, by + 12, 22, 3, '#b08050'); R(dx - 11, by + 12, 22, 1, '#d8a868');
    // vasos e barril
    [[x + 6, by + 1], [x + w - 12, by + 1]].forEach(([X, Y]) => { R(X, Y + 2, 6, 4, '#b0603a'); blob(X + 3, Y, 3, '#2f8a40'); R(X + 2, Y - 1, 1, 1, '#ff7088'); });
    return { x: dx, y: by + 10 };
  }

  /* Galinheiro: celeiro pequeno de madeira vermelha, com placa e portinhola para o cercado. */
  function coopHouse(x, y) {
    const w = 84, roofH = 32, wy = y + roofH, wallH = 48, by = wy + wallH, dx = x + 42;
    g.fillStyle = 'rgba(20,40,20,.25)'; g.fillRect(x + 4, by, w, 3); g.fillRect(x + w, wy + 4, 5, wallH - 2);
    R(x - 1, wy - 1, w + 2, wallH + 2, OUT);
    for (let c = 0; c < w; c += 4) { R(x + c, wy, 4, wallH, c % 8 ? '#b0432e' : '#a03c28'); R(x + c + 3, wy, 1, wallH, '#7a2a1c'); }
    R(x, wy, w, 3, 'rgba(40,10,10,.35)'); R(x, by - 3, w, 3, '#7a2a1c');
    R(x, wy + 3, 2, wallH - 3, '#f2e6d0'); R(x + w - 2, wy + 3, 2, wallH - 3, '#f2e6d0');
    // janela redonda
    blob(x + 16, wy + 13, 6, OUT); blob(x + 16, wy + 13, 5, '#f2e6d0'); blob(x + 16, wy + 13, 3, '#ffd98a'); R(x + 16, wy + 9, 1, 8, '#f2e6d0');
    // placa com galinha sobre a porta
    R(dx - 13, wy + 3, 26, 11, OUT); R(dx - 12, wy + 4, 24, 9, '#f2e6c8');
    R(dx - 5, wy + 6, 7, 5, '#ffffff'); R(dx + 1, wy + 5, 3, 3, '#ffffff'); R(dx + 2, wy + 4, 1, 1, '#e04a3a'); R(dx + 4, wy + 6, 1, 1, '#f0a020'); R(dx - 6, wy + 6, 1, 2, '#d8d8c8'); R(dx + 2, wy + 6, 1, 1, OUT);
    R(dx - 3, wy + 11, 1, 1, '#f0a020'); R(dx, wy + 11, 1, 1, '#f0a020');
    // porta de celeiro (com X branco)
    const dh = 24, dw = 20, dy = by - dh;
    R(dx - dw / 2 - 1, dy - 1, dw + 2, dh + 1, OUT); R(dx - dw / 2, dy, dw, dh, '#8a3424');
    R(dx - dw / 2, dy, dw, 2, '#f2e6d0'); R(dx - dw / 2, dy, 2, dh, '#f2e6d0'); R(dx + dw / 2 - 2, dy, 2, dh, '#f2e6d0'); R(dx - 1, dy, 2, dh, '#f2e6d0');
    for (let i = 0; i < dh - 2; i++) { const k = Math.round(i * 8 / (dh - 2)); R(dx - 9 + k, dy + 2 + i, 1, 1, '#f2e6d0'); R(dx + 8 - k, dy + 2 + i, 1, 1, '#f2e6d0'); R(dx + 1 + k, dy + 2 + i, 1, 1, '#f2e6d0'); R(dx - 2 - k, dy + 2 + i, 1, 1, '#f2e6d0'); }
    R(dx + 4, dy + 12, 2, 2, '#ffd75e');
    R(dx - 13, by, 26, 2, '#b8b0a0'); R(dx - 13, by + 2, 26, 1, '#807868');
    // portinhola e rampa para o cercado
    R(x + w - 12, by - 12, 10, 12, OUT); R(x + w - 11, by - 11, 8, 11, '#3a1a12');
    for (let i = 0; i < 10; i++) R(x + w - 3 + i, by - 4 + Math.floor(i / 3), 3, 2, i % 2 ? '#a07848' : '#c89a62');
    // telhado escuro de duas águas
    for (let r = 0; r < roofH; r++) {
      const inset = Math.round((1 - r / roofH) * 6) - 4, x0 = x + inset, ww = w - inset * 2;
      R(x0 - 1, y + r, ww + 2, 1, OUT);
      for (let c = 0; c < ww; c++) { const edge = r % 4 === 3, seam = c % 6 === 0; g.fillStyle = edge ? '#2e3442' : seam ? '#3a4254' : r % 4 === 0 ? '#5e6a80' : '#4a5468'; g.fillRect(x0 + c, y + r, 1, 1); }
    }
    R(x - 1, y - 2, w + 2, 3, OUT); R(x, y - 1, w, 2, '#7a869c'); snowCap(x - 2, y - 1, w + 4, 11); R(x - 5, wy, w + 10, 2, OUT);
    cur.lights.push({ kind: 'win', x: x + 13, y: wy + 10, w: 6, h: 6 });
    // cata-vento
    R(dx, y - 8, 1, 7, OUT); R(dx - 3, y - 9, 7, 2, OUT); R(dx - 2, y - 9, 5, 1, '#e0a23a');
    return { x: dx, y: by };
  }

  function car(x, y, c) {
    shadowOval(x + 18, y + 14, 19, 2);
    R(x + 7, y - 1, 22, 8, OUT); R(x + 8, y, 20, 7, shade(c, 0.85));
    R(x + 10, y + 1, 7, 5, '#a8dcff'); R(x + 19, y + 1, 7, 5, '#8cc8f0');
    R(x - 1, y + 6, 38, 9, OUT); R(x, y + 7, 36, 7, c); R(x, y + 7, 36, 2, shade(c, 1.2));
    R(x + 34, y + 9, 2, 2, '#ffe89a'); R(x, y + 9, 2, 2, '#e04a3a');
    [6, 26].forEach(wx => { R(x + wx - 1, y + 11, 8, 6, OUT); R(x + wx, y + 12, 6, 4, '#3a3a44'); R(x + wx + 2, y + 13, 2, 2, '#b0b0b8'); });
  }


  function roomBase(wall, f1, f2, planks) {
    R(0, 0, W, 72, wall);
    for (let x = 0; x < W; x += 16) R(x, 0, 1, 62, shade(wall, 0.94));
    R(0, 62, W, 6, shade(wall, 0.82)); R(0, 68, W, 4, '#5a4030');
    const tw = planks ? 40 : 16, th = planks ? 8 : 12;
    for (let y = 72, r = 0; y < H; y += th, r++) for (let x = planks ? -((r % 2) * 20) : 0, c = 0; x < W; x += tw, c++) {
      R(x, y, tw, th, planks ? f1 : ((c + r) % 2 ? f1 : f2));
      if (planks) { R(x, y + th - 1, tw, 1, f2); R(x + tw - 1, y, 1, th, f2); }
    }
    g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(0, 72, W, 3);
  }
  function box(x, y, w, h, c) { R(x - 1, y - 1, w + 2, h + 2, OUT); R(x, y, w, h, c); }
  function desk(x, w, top, front) {
    R(x - 1, 113, w + 2, 27, OUT); R(x, 114, w, 5, top); R(x, 114, w, 1, shade(top, 1.2));
    R(x, 119, w, 20, front); R(x, 119, w, 2, shade(front, 0.72)); R(x + 3, 125, w - 6, 1, shade(front, 0.88));
  }
  function bubble(x, y, mark, t) {
    R(x - 1, y - 1, 16, 12, OUT); R(x, y, 14, 10, '#ffffff'); R(x + 2, y + 10, 5, 1, OUT); R(x + 3, y + 10, 3, 1, '#ffffff'); R(x + 3, y + 11, 2, 1, OUT);
    if (mark === '!') { R(x + 6, y + 2, 2, 4, '#e04a3a'); R(x + 6, y + 7, 2, 1, '#e04a3a'); }
    else for (let i = 0; i <= Math.floor(t / 220) % 3; i++) R(x + 2 + i * 4, y + 4, 2, 2, OUT);
  }


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
    const peb = [[150, 140, 128], [184, 176, 164], [118, 104, 88]];
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
        // borda em curvas suaves: a grama entra até 3 px, em ondas largas (não pixel a pixel)
        const e = vnoise(x, y, 9, 43);
        if ((dG === 1 && e < 0.5) || (dG === 2 && e < 0.33) || (dG === 3 && e < 0.16)) continue;
        let c = T.base;
        const fine = vnoise(x, y, 4, 21) * 0.6 + vnoise(x, y, 10, 31) * 0.4;                      // variações pequenas e suaves
        if (fine > 0.64) c = mixC(T.base, T.dark, 0.3); else if (fine < 0.3) c = mixC(T.base, T.light, 0.12);
        if (dG === 1 || (dG === 2 && e < 0.5)) c = mixC(c, T.edge, 0.45);                          // borda suave, sem contorno
        // pedrinhas ocasionais (2×1 com sombra embaixo)
        if (hash(x, y, 13) < 0.0025) c = peb[0]; else if (hash(x - 1, y, 13) < 0.0025) c = peb[1]; else if (hash(x, y - 1, 13) < 0.0025 || hash(x - 1, y - 1, 13) < 0.0025) c = peb[2];
        if (S === 2 && hash(x, y, 17) < 0.006) c = hash(x, y, 18) < 0.5 ? [200, 88, 30] : [138, 58, 24];
        if (d4 === 1) c = n < 0.5 ? shadeC(T.dark, 0.94) : T.dark;    // terra encostada nas pedras do centrinho
        else if (d4 === 2 && n < 0.25) c = T.dark;
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
    g.putImageData(img, x0, y0);
  }
  /* Chão da fazenda: a área de trabalho é uma clareira contínua de terra ocre dourada (que engloba a estrada em
     frente à casa e os caminhos da fazenda), com bordas de grama viva avançando sobre a terra em recortes e tufos.
     A grama fica junto à casa, ao lago e nas bordas, com vegetação mais densa nas bordas. Detalhes do chão só em
     grupos ocasionais. Tudo pela posição (hash/ruído), sem tocar no sorteio do cenário; nada sobre caminhos de
     moradores, construções ou objetos. A forma do chão não muda o que se cultiva ou atravessa. */
  const FARM = { x0: 8, y0: 26, x1: 402, y1: 512 };
  const mix0 = (a, b2, k) => a.map((v, j) => Math.round(v + (b2[j] - v) * k));
  function farmDirtPal(S) {
    if (S === 3) return { base: [226, 230, 236], v1: [214, 220, 228], v2: [236, 240, 245], mark: [196, 200, 206], shade: [198, 204, 214] };   // neve (terra por baixo)
    if (S === 2) return { base: [206, 146, 70], v1: [196, 137, 64], v2: [214, 155, 80], mark: [172, 116, 54], shade: [180, 122, 58] };
    return { base: [220, 160, 66], v1: [211, 151, 61], v2: [227, 169, 77], mark: [186, 126, 52], shade: [192, 134, 56] };
  }
  function farmIsDirt(x, y) {
    const M = cur.pave; if (M && M[y * W + x] === 1) return true;                           // caminhos da fazenda viram parte da clareira
    // área de trabalho: retângulo arredondado em volta da grade de plantio, ligado à estrada; borda em curvas e recortes
    const rx0 = 30, ry0 = 180, rx1 = 376, ry1 = 368, out = Math.hypot(Math.max(0, rx0 - x, x - rx1), Math.max(0, ry0 - y, y - ry1));
    const lim = 8 + (vnoise(x, y, 26, 401) - 0.5) * 18 + (vnoise(x, y, 6, 402) - 0.5) * 5;
    if (out === 0 || out < lim) return true;                                              // dentro da área de trabalho, sempre terra (sem ilhas)
    // a estrada em frente à casa se abre um pouco para os lados (sem parecer faixa colada por cima)
    if (x > 56 && x < 402) { const d = Math.max(0, Math.abs(y - 164) - 12); if (d < 3 + (vnoise(x, y, 14, 403) - 0.5) * 8 + (vnoise(x, y, 5, 404) - 0.5) * 3) return true; }
    return false;
  }
  function farmGround() {
    const { x0: X0, y0: Y0, x1: X1, y1: Y1 } = FARM, w = X1 - X0, h = Y1 - Y0, img = g.getImageData(X0, Y0, w, h), D = img.data, M = cur.pave, S = paintSeason;
    const Pd = farmDirtPal(S), G0 = rgb('#58a83c'), G1 = mix0(rgb('#58a83c'), rgb('#4f9c38'), 0.5), GB = mix0(rgb('#3a7e2c'), rgb('#4f9c38'), 0.3);
    const dirt = new Uint8Array(w * h);
    for (let y = Y0; y < Y1; y++) for (let x = X0; x < X1; x++) dirt[(y - Y0) * w + (x - X0)] = farmIsDirt(x, y) ? 1 : 0;
    const isD = (x, y) => x < X0 || y < Y0 || x >= X1 || y >= Y1 ? 0 : dirt[(y - Y0) * w + (x - X0)];
    for (let y = Y0; y < Y1; y++) for (let x = X0; x < X1; x++) {
      const i = ((y - Y0) * w + (x - X0)) * 4; let c;
      if (isD(x, y)) {
        c = Pd.base;
        // textura fina, de baixo contraste: marquinhas desenhadas em células de 5 px, só onde há grupo (áreas tranquilas entre eles)
        const cx5 = Math.floor(x / 5), cy5 = Math.floor(y / 5), lx5 = x - cx5 * 5, ly5 = y - cy5 * 5, mk = hash(cx5, cy5, 440);
        if (vnoise(x, y, 18, 441) > 0.48 && mk < 0.5) {
          const kind = Math.floor(mk * 6) % 3, ox = 1 + Math.floor(hash(cx5, cy5, 442) * 2), oy = 1 + Math.floor(hash(cx5, cy5, 443) * 3);
          if (kind === 0 && ly5 === oy && (lx5 === ox || lx5 === ox + 1)) c = Pd.v1;                       // risquinho
          else if (kind === 1 && lx5 === ox && ly5 === oy) c = Pd.v2; else if (kind === 1 && lx5 === ox && ly5 === oy + 1) c = Pd.v1;   // grão com sombra
          else if (kind === 2 && ((lx5 === ox && ly5 === oy) || (lx5 === ox + 1 && ly5 === oy + 1))) c = Pd.v1;  // marca diagonal
        }
        if (!isD(x, y - 1) || !isD(x, y - 2) && hash(x, 0, 407) < 0.5) c = Pd.shade;                  // sombra suave sob a borda de grama
        if (x > X1 - 18 && M && M[y * W + x] === 1) { const k = (x - (X1 - 18)) / 18, o = [D[i], D[i + 1], D[i + 2]]; c = c.map((v, j) => Math.round(v + (o[j] - v) * k)); }   // emenda com a estrada da vila
      } else {
        if (M && M[y * W + x]) continue;
        c = vnoise(x, y, 40, 408) > 0.63 ? G1 : G0;
        if (isD(x, y + 1) || isD(x, y + 2) && hash(x, y, 409) < 0.6) c = GB;                         // base escura da grama que avança sobre a terra
      }
      D[i] = c[0]; D[i + 1] = c[1]; D[i + 2] = c[2];
    }
    g.putImageData(img, X0, Y0);
    const busy = (x, y) => { const c = Math.floor(x / CELL), r = Math.floor(y / CELL), i = r * cur.cols + c; return c < 0 || r < 0 || !!(cur.path[i] || cur.solid[i]); };
    const L = { d: SC('#2f7028'), m: SC('#468c32'), l: SC('#78c452'), b: SC('#3a7e2c') };
    // tufo de grama (folhas reconhecíveis: base escura, volume médio, pontas iluminadas)
    // grama baixa: pequenos grupos de folhas curtas, em direções e tamanhos variados (não um leque simétrico)
    const tuft = (x, y, n, hmax, v) => {
      const leaves = 2 + n + (v & 1);
      for (let j = 0; j < leaves; j++) {
        const r = a => hash(x * 3 + j, y, a), len = Math.max(2, Math.min(hmax, 2 + Math.floor(r(431) * (hmax - 1)))), dx = r(432) < 0.4 ? -1 : r(432) > 0.7 ? 1 : 0, ox = Math.round((j - leaves / 2) * 1.3 + (r(433) - 0.5));
        for (let k = 0; k < len; k++) { const px = x + ox + (k >= 1 ? dx * Math.ceil(k / 2) : 0); R(px, y - k, 1, 1, k === 0 ? L.d : k === len - 1 ? L.l : (j + v) % 2 ? L.m : L.b); }
      }
      if (S === 3) R(x - 1, y - hmax + 1, 3, 1, '#f4f8fc');
    };
    // tufos na borda grama/terra, debruçados sobre a terra
    for (let y = Y0 + 2; y < Y1 - 2; y += 3) for (let x = X0 + 2; x < X1 - 2; x += 2) {
      if (isD(x, y) || !(isD(x, y + 1) || isD(x + 1, y) || isD(x - 1, y))) continue;
      if (hash(Math.floor(x / 9), Math.floor(y / 9), 411) > 0.55 || hash(x, y, 412) > 0.22 || busy(x, y) || (M && M[(y + 1) * W + x] && M[(y + 1) * W + x] !== 1)) continue;
      tuft(x, y + 1, 1 + Math.floor(hash(x, y, 413) * 2), 4 + Math.floor(hash(x, y, 414) * 3), x & 1);
    }
    // grama: poucos grupos de folhas; vegetação mais volumosa perto das bordas da fazenda
    const edgeK = (x, y) => Math.max(0, 1 - Math.min(x - 24, 392 - x, y - 36, 504 - y) / 28);
    for (let cy = Y0 + 6; cy < Y1 - 6; cy += 12) for (let cx = X0 + 6; cx < X1 - 6; cx += 12) {
      const x = cx + Math.floor(hash(cx, cy, 415) * 8), y = cy + Math.floor(hash(cx, cy, 416) * 8), ek = edgeK(x, y);
      if (isD(x, y) || isD(x, y + 3) || busy(x, y) || busy(x, y - 6) || (M && M[y * W + x])) continue;
      if (hash(cx, cy, 417) < (vnoise(cx, cy, 40, 430) > 0.5 ? 0.3 : 0.04) + ek * 0.5) {
        if (ek > 0.35 && hash(cx, cy, 418) < 0.55) { tuft(x - 2, y, 2, 4, 0); tuft(x + 2, y + 1, 1, 5, 1); tuft(x, y + 2, 1, 3, 0); }   // grupinhos mais cheios nas bordas
        else tuft(x, y, 1, 3 + Math.floor(hash(cx, cy, 419) * 2), cx & 1);
      }
    }
    // detalhes da terra: pequenos grupos (pedrinhas, marcas e brotinhos), com espaço livre entre eles
    for (let cy = Y0 + 10; cy < Y1 - 10; cy += 30) for (let cx = X0 + 10; cx < X1 - 10; cx += 30) {
      if (hash(cx, cy, 420) > 0.42) continue;
      const ox = cx + Math.floor(hash(cx, cy, 421) * 20) - 10, oy = cy + Math.floor(hash(cx, cy, 422) * 20) - 10, kind = Math.floor(hash(cx, cy, 423) * 3);
      for (let k = 0; k < 3 + (cx + cy) % 2; k++) {
        const x = ox + Math.floor(hash(ox, k, 424) * 9) - 4, y = oy + Math.floor(hash(oy, k, 425) * 6) - 3;
        if (!isD(x, y) || !isD(x + 2, y + 1) || !isD(x, y - 2) || busy(x, y)) continue;
        if (kind === 0) { R(x, y, 2, 1, S === 3 ? '#c8ccd4' : '#c8b49a'); R(x, y + 1, 2, 1, S === 3 ? '#a8aeb8' : '#9a8468'); }       // pedrinha
        else if (kind === 1) { g.fillStyle = `rgb(${Pd.mark.join(',')})`; g.fillRect(x, y, 2 + (k % 2), 1); }                            // marca na terra
        else if (S !== 3) { R(x, y, 1, 1, L.m); R(x + 1, y - 1, 1, 1, L.l); R(x + 2, y, 1, 1, L.m); }                                    // brotinho
      }
    }
  }
  function road(kind, x, y, w, h) { spendRand(() => ground(kind, x, y, w, h)); paveRect(kind, x, y, w, h); keep(x - 4, y - 4, w + 8, h + 8); }
  /* Trilha de terra em curva (pontos [x, y]), com borda e pedrinhas. */
  function trail(pts, r = 9) {
    const L = [];
    for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 2); for (let k = 0; k <= n; k++) L.push([x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n]); }
    const disc = (x, y, rr, c) => { for (let dy = -rr; dy <= rr; dy++) { const w = Math.round(Math.sqrt(rr * rr - dy * dy)); R(Math.round(x) - w, Math.round(y) + dy, w * 2 + 1, 1, c); } };
    L.forEach(([x, y]) => paveDisc('terra', x, y, r));
    L.forEach(([x, y], i) => { if (i % 3 === 0) spendRand(() => R(x - r + 2 + rand2() * (r * 2 - 4), y - r + 2 + rand2() * (r * 2 - 4), 2, 1, rand2() < 0.5 ? '#f0e0b0' : '#c8ac70')); keep(x - r - 4, y - r - 4, r * 2 + 8, r * 2 + 8); });
  }
  const obj = o => { cur.objs.push(Object.assign({ r: 18 }, o)); };

  /* Figura alta em canvas próprio: o personagem pode passar por trás. */
  function tallImg(drawFn, w, h, ox) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const prev = g, pr = rand; g = c.getContext('2d'); rand = rng(w * 31 + h * 7 + ox); g.translate(ox, h - 4); drawFn(0, 0); g = prev; rand = pr;
    return { img: c, ox, h };
  }
  let treeSeed = 0;
  function tall(drawFn, x, y, w, h, ox, box) {
    treeSeed = Math.round(x * 7 + y * 3);
    const s = tallImg(drawFn, w, h, ox);
    cur.sprites.push({ img: s.img, x: x - ox, y: y - h + 4, base: y });
    if (box) solid(x + box[0], y + box[1], box[2], box[3]);
  }
  const addTree = (x, y, r = 11) => tall((a, b) => tree(a, b, r), x, y, r * 2 + 8, r * 2 + 20, r + 4, [-4, -6, 8, 6]);
  const addPine = (x, y) => tall(pine, x, y, 26, 40, 13, [-4, -6, 8, 6]);
  const addLamp = (x, y) => { tall(lamp, x, y, 12, 32, 6, [-2, -3, 5, 3]); cur.lights.push({ kind: 'lamp', x, y: y - 26, r: 40 }); };

  function building(id, label, o, enter) {
    let doorX;
    if (o.paint) {                                   // fachada detalhada: sprite alto; só a parte de baixo bloqueia
      const b = o.y + o.h, pad = 32;
      g.fillStyle = 'rgba(20,40,20,.25)'; g.fillRect(o.x + 3, b + 1, o.w + 2, 3); g.fillRect(o.x + o.w + 1, o.solidY, 5, b - o.solidY);
      doorX = bldSprite(o.x - pad, o.top - 12, o.w + pad * 2, b - o.top + 18, b, () => o.paint(o));
      solid(o.x - 2, o.solidY, o.w + 4, b - o.solidY); keep(o.x - 10, o.top - 8, o.w + 20, b - o.top + 12);   // nada de árvore sorteada sobre o telhado
    } else { doorX = house(o); solid(o.x - 3, o.y + 4, o.w + 6, o.h - 4); }
    const d = { x: Math.round(doorX), y: Math.ceil((o.y + o.h) / CELL) * CELL + 7 };     // primeiro ponto livre em frente à porta
    const hit = [d.x - 9, o.y + o.h - 18, 18, 20];
    if (enter) { cur.doors[id] = d; obj({ id: 'door:' + id, kind: 'door', to: id, x: d.x, y: d.y - 3, r: 14, hit, label: 'Entrar: ' + label }); }
    else obj({ id: 'house:' + id, kind: 'text', x: d.x, y: d.y - 3, r: 13, hit, label, text: 'A porta está fechada. Bater sem ser chamado não é costume por aqui.' });
    return d;
  }
  function water(cx, cy, rx, ry, zone = 'lago') {
    /* Lago de margem natural: contorno com pequenas reentrâncias (sempre dentro da elipse de colisão), barranco de
       terra com grama entrando, faixa rasa clara junto à margem e água mais funda no meio. Variação pela posição. */
    const ph1 = hsh(cx, cy, 111) * 6.28, ph2 = hsh(cx, cy, 112) * 6.28, ph3 = hsh(cx, cy, 113) * 6.28;
    const edge = th => 0.955 + 0.03 * Math.sin(3 * th + ph1) + 0.015 * Math.sin(5 * th + ph2) + 0.012 * Math.sin(9 * th + ph3) - 0.012;
    const C = { bank: SC('#86764c'), bankD: shade(SC('#86764c'), 0.82), bankL: shade(SC('#86764c'), 1.14), gr: SC('#58a83c'), grD: SC('#4f9c38'), foam: SC('#bfe4ff'),
      sh: shade(SC('#3f86d8'), 1.16), mid: SC('#3f86d8'), deep: SC('#3478cc'), deeper: shade(SC('#3478cc'), 0.88), lip: shade(SC('#3f86d8'), 0.8) };
    const P = (x, y, c) => { g.fillStyle = c; g.fillRect(x, y, 1, 1); };
    for (let y = Math.floor(cy - ry - 5); y <= cy + ry + 5; y++) for (let x = Math.floor(cx - rx - 5); x <= cx + rx + 5; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = Math.hypot(dx, dy), th = Math.atan2(dy, dx), b = edge(th);
      const reff = 1 / Math.hypot(Math.cos(th) / rx, Math.sin(th) / ry), px = (b - d) * reff, h = hsh(x, y, 114);
      const bankW = 2.4 + 1.6 * vnoise(th * 30 + 100, 0, 7, cx);                                  // largura do barranco varia devagar
      if (px < -bankW) continue;
      if (px < 0) {                                                                              // barranco de terra, com a grama entrando
        P(x, y, px > -1 ? C.bankD : C.bank); continue;
      }
      // margem rasa estreita e a água do lago num tom só; a parte funda é uma mancha suave fora do centro (sem anéis)
      const dz = Math.hypot((x + 0.5 - cx - rx * 0.12) / (rx * 0.62), (y + 0.5 - cy + ry * 0.1) / (ry * 0.55)) + (vnoise(x, y, 9, cx) - 0.5) * 0.25;
      let c = px < 1 ? (dy < 0 ? C.lip : C.foam) : px < 3 ? C.sh : dz < 1 ? C.deep : C.mid;
      if (px >= 3 && px < 4 && (x + y) % 2) c = C.sh;                                            // uma passagem discreta da faixa rasa
      P(x, y, c);
    }
    // pedrinhas e taboas na margem (sem taboas no inverno)
    for (let i = 0; i < 8; i++) {
      const th = ph1 + i * 0.79 + hsh(i, cx, 117) * 0.6, b = edge(th), reff = 1 / Math.hypot(Math.cos(th) / rx, Math.sin(th) / ry), x = Math.round(cx + Math.cos(th) * (b * reff + 2)), y = Math.round(cy + Math.sin(th) * (b * reff + 2));
      if (i % 3 === 1) { P(x, y, '#6a6870'); P(x + 1, y, '#8a8890'); P(x, y - 1, '#a8a6ae'); }
      else if (paintSeason !== 3 && Math.sin(th) > -0.3) { const st = paintSeason === 2 ? '#a08a3a' : '#3a7a2c'; for (let k = 0; k < 3; k++) { const hx = x - 1 + k * 2, hh = 5 + ((i + k) % 3); g.fillStyle = st; g.fillRect(hx, y - hh, 1, hh); g.fillStyle = '#6a4424'; g.fillRect(hx, y - hh - 1, 1, 2); } }
    }
    // margem clara por dentro e vitórias-régias (não no inverno)
    if (paintSeason !== 3) for (let i = 0; i < Math.max(1, Math.round(rx / 14)); i++) {
      const lx = Math.round(cx - rx * 0.6 + rand2() * rx * 1.2), ly = Math.round(cy - ry * 0.4 + rand2() * ry * 0.8);
      R(lx - 3, ly - 2, 6, 4, '#2c6a22'); R(lx - 2, ly - 2, 4, 3, '#58a838'); R(lx, ly - 2, 1, 2, '#2c6a22'); if (paintSeason === 0 && i % 2 === 0) { R(lx + 2, ly - 3, 2, 2, '#ffb8d0'); R(lx + 2, ly - 3, 1, 1, '#ffffff'); }
    }
    solid(cx - rx + 2, cy - ry + 4, rx * 2 - 4, ry * 2 - 6); keep(cx - rx - 8, cy - ry - 8, rx * 2 + 16, ry * 2 + 16);
    cur.waters.push({ cx, cy, rx, ry, zone });
  }
  /* Rio: água corrente ao longo de uma linha (pontos [x, y]), com margem de terra.
     A margem não é pintada por cima de um lago em que o rio desemboca. hw = meia largura da água. */
  function stream(pts, hw, bridges) {
    const BR = !bridges ? [] : typeof bridges[0] === 'number' ? [bridges] : bridges;
    const L = [], inLake = (x, y) => cur.waters.some(w => ((x - w.cx) / (w.rx - 1)) ** 2 + ((y - w.cy) / (w.ry - 1)) ** 2 < 1);
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], n = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
      for (let k = 0; k < n; k++) L.push([x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n]);
    }
    const disc = (x, y, r, c) => { for (let dy = -r; dy <= r; dy++) { const w = Math.round(Math.sqrt(r * r - dy * dy)); R(x - w, y + dy, w * 2 + 1, 1, c); } };
    L.forEach(([x, y]) => { if (!inLake(x, y)) disc(Math.round(x), Math.round(y), hw + 3, '#86764c'); });
    L.forEach(([x, y]) => disc(Math.round(x), Math.round(y), hw, '#bfe4ff'));
    L.forEach(([x, y]) => disc(Math.round(x), Math.round(y), hw - 1, '#3f86d8'));
    L.forEach(([x, y]) => disc(Math.round(x), Math.round(y), hw - 4, '#3478cc'));
    L.forEach(([x, y], i) => { if (i % 3 === 0) { solid(x - hw + 3, y - 2, hw * 2 - 6, 4); keep(x - hw - 8, y - hw - 8, hw * 2 + 16, hw * 2 + 16); } });
    BR.forEach(([bx, by, bw, bh]) => {              // ponte de tábuas: dá para atravessar a pé
      const across = bh > bw;                        // ponte comprida no sentido norte-sul: tábuas deitadas
      R(bx - 1, by - 1, bw + 2, bh + 3, OUT); R(bx, by, bw, bh, '#a8743e');
      if (across) { for (let y = by + 3; y < by + bh; y += 4) R(bx, y, bw, 1, '#7a5028'); R(bx, by, 1, bh, '#d8a868'); R(bx + bw - 2, by, 2, bh, '#5a3a1e'); }
      else { for (let x = bx + 3; x < bx + bw; x += 4) R(x, by, 1, bh, '#7a5028'); R(bx, by, bw, 1, '#d8a868'); R(bx, by + bh - 1, bw, 2, '#5a3a1e'); }
      [[bx + 1, by - 3], [bx + bw - 3, by - 3], [bx + 1, by + bh - 1], [bx + bw - 3, by + bh - 1]].forEach(([x, y]) => { R(x - 1, y - 1, 4, 5, OUT); R(x, y, 2, 3, '#6a4426'); });
      open(bx, by, bw, bh); keep(bx - 10, by - 10, bw + 20, bh + 20);
    });
    cur.streams = cur.streams || [];
    cur.streams.push({ pts: L, hw, zone: 'rio', bridges: BR });
  }

  function buildFora() {
    const m = newMap('fora', FORA.w, FORA.h, 11); m.waters = [];
    grass();
    // ---------- estradas ----------
    road('terra', 60, 152, 1500, 24);                                              // estrada principal: fazenda → vila → bosque → bairro leste
    road('terra', 366, 176, 20, 298); road('terra', 52, 458, 334, 16);
    road('pedra', 560, 110, 140, 122);
    road('terra', 450, 176, 20, 124); road('terra', 622, 232, 20, 68); road('terra', 440, 300, 392, 22);
    // vila sul: ruelas descem até a rua de baixo, a praça do coreto e a beira-rio
    road('terra', 450, 322, 20, 264);                                              // ruela de Bia
    road('terra', 622, 322, 20, 120); road('terra', 622, 534, 20, 54);              // ruela da fonte ao coreto e à rua de baixo
    road('terra', 770, 322, 20, 264);                                              // ruela de Iara (caminho da escola)
    road('pedra', 560, 440, 150, 96);                                              // praça do coreto
    road('terra', 440, 586, 1120, 22);                                             // rua de baixo: vila → escola → bairro leste
    road('terra', 770, 608, 20, 162); road('terra', 1300, 608, 20, 162);            // descidas para a beira-rio
    road('areia', 410, 770, 1186, 22);                                             // areia da beira-rio (margem norte)
    road('areia', 410, 840, 1186, 30);                                             // margem sul do rio
    road('terra', 1300, 176, 20, 410);                                             // avenida do bairro leste
    trail([[1302, 300], [1262, 292], [1222, 280], [1186, 272], [1172, 266]]);          // trilha até a margem leste da lagoa
    trail([[710, 500], [736, 508], [756, 520], [772, 536]], 8);                     // atalho do coreto à ruela de Iara
    trail([[1110, 608], [1130, 640], [1166, 668], [1180, 700], [1168, 740], [1150, 770]], 8);   // trilha do poço à beira-rio
    trail([[1560, 608], [1530, 640], [1500, 690], [1470, 730], [1440, 770]], 8);     // trilha do pomar leste ao rio
    // centrinho calçado: frente do Armazém CELESTE, a rua até a casa de Seu Honório e a praça da fonte, num piso só
    paveRect('centro', 446, 148, 360, 30); paveRect('centro', 560, 110, 140, 122);
    paveDisc('terra', 100, 157, 14);                                                // terra batida que chega ao degrau da varanda
    paveFlush();
    farmGround();
    // ---------- fazenda ----------
    keep(GRID.x0 - 6, GRID.y0 - 6, GRID.cols * GRID.s + 12, GRID.rows * GRID.s + 12);
    {
      const d = farmhouse(52, 56);                                                   // casa: x 52..148, varanda até y 150
      solid(46, 50, 108, 86); solid(52, 144, 34, 8); solid(114, 144, 34, 8); solid(52, 136, 6, 10); solid(142, 136, 6, 10);
      keep(40, 40, 124, 116);
      m.doors.casa = d; obj({ id: 'door:casa', kind: 'door', to: 'casa', x: d.x, y: d.y - 3, r: 14, hit: [d.x - 12, d.y - 36, 24, 40], label: 'Entrar: Sua casa' });
    }
    water(336, 100, 40, 24);
    obj({ id: 'water', kind: 'water', x: SPOT.water[0], y: SPOT.water[1], r: 22, hit: [296, 76, 80, 54], label: 'Lago' });
    // boneco de treino
    box(SPOT.dummy[0] - 2, SPOT.dummy[1] - 4, 4, 4, '#6a4426'); solid(SPOT.dummy[0] - 5, SPOT.dummy[1] - 6, 10, 6); keep(SPOT.dummy[0] - 14, SPOT.dummy[1] - 30, 28, 40);
    obj({ id: 'dummy', kind: 'dummy', x: SPOT.dummy[0], y: SPOT.dummy[1] + 6, r: 16, hit: [SPOT.dummy[0] - 9, SPOT.dummy[1] - 32, 18, 36], label: 'Boneco de treino' });
    // galinheiro (com porta e interior) e cercado das galinhas
    {
      const d = coopHouse(52, 372);                                                  // prédio: x 52..136, y 372..452; porta embaixo, na estrada
      solid(47, 376, 94, 76); keep(40, 364, 270, 96);
      m.doors.galinheiro = { x: d.x, y: 463 };
      obj({ id: 'door:galinheiro', kind: 'door', to: 'galinheiro', x: d.x, y: 460, r: 14, hit: [d.x - 11, d.y - 26, 22, 28], label: 'Entrar: Galinheiro' });
      const X0 = 144, X1 = 300, Y0 = 392, Y1 = 448;                                 // cercado
      R(X0, Y0 - 4, X1 - X0, Y1 - Y0 + 4, '#b89858'); for (let i = 0; i < 110; i++) R(X0 + 2 + rand() * (X1 - X0 - 4), Y0 - 2 + rand() * (Y1 - Y0), 2, 1, rand() < 0.5 ? '#a08448' : '#d0b470');
      for (let i = 0; i < 8; i++) { const hx = X0 + 10 + rand() * (X1 - X0 - 20), hy = Y0 + 4 + rand() * (Y1 - Y0 - 10); R(hx, hy, 3, 1, '#e8d070'); R(hx + 1, hy - 1, 1, 1, '#e8d070'); }
      box(X1 - 26, Y0 + 2, 12, 5, '#8a9aa8'); R(X1 - 25, Y0 + 3, 10, 2, '#6aacf0');                        // bebedouro
      fence(X0, X1, Y0, '#d8b078'); fence(X0, 196, Y1, '#d8b078'); fence(226, X1, Y1, '#d8b078');
      for (let y = Y0; y <= Y1; y += 6) { R(X0 - 1, y - 6, 3, 7, OUT); R(X0, y - 5, 1, 6, '#d8b078'); R(X1 + 1, y - 6, 3, 7, OUT); R(X1 + 2, y - 5, 1, 6, '#d8b078'); }
      box(196, Y1 - 10, 3, 12, '#8a5e36'); box(224, Y1 - 10, 3, 12, '#8a5e36');                             // porteira aberta
      solid(X0 - 2, Y0 - 8, X1 - X0 + 6, 8); solid(X0 - 2, Y1 - 6, 56, 8); solid(226, Y1 - 6, X1 - 222, 8); solid(X0 - 2, Y0, 6, Y1 - Y0); solid(X1 - 2, Y0, 6, Y1 - Y0);
      R(X0 + 6, Y0 - 16, 30, 9, OUT); R(X0 + 7, Y0 - 15, 28, 7, '#f0e6cc'); R(X0 + 10, Y0 - 13, 22, 1, '#8a5e36'); R(X0 + 10, Y0 - 11, 16, 1, '#8a5e36');
      obj({ id: 'cercado', kind: 'text', x: 211, y: 456, r: 14, hit: [X0 + 4, Y0 - 18, 34, 12], label: 'Cercado das galinhas', text: 'Cercado das galinhas. O comedouro e os ninhos ficam dentro do galinheiro: entre pela porta vermelha, à esquerda.' });
    }
    // cerca e porteira da fazenda
    for (let y = 40; y < 500; y += 8) if (y < 144 || y > 180) { R(404, y, 3, 6, '#b88448'); R(404, y, 1, 6, '#d8a868'); }
    solid(402, 30, 6, 116); solid(402, 182, 6, 320); keep(396, 30, 18, 470);
    box(396, 140, 6, 12, '#8a5e36'); box(396, 176, 6, 12, '#8a5e36');
    R(158, 124, 30, 16, OUT); R(159, 125, 28, 14, '#c89a62'); R(159, 125, 28, 2, '#e8c088'); R(162, 129, 22, 1, '#6a4426'); R(162, 132, 18, 1, '#6a4426'); R(162, 135, 20, 1, '#6a4426');
    R(161, 140, 3, 8, '#6a4426'); R(182, 140, 3, 8, '#6a4426'); solid(160, 140, 26, 8);
    obj({ id: 'placa', kind: 'sign', x: 173, y: 154, r: 14, hit: [156, 122, 34, 26], label: 'Placa da fazenda' });
    // ---------- vila ----------
    // Armazém CELESTE: dois andares (comércio embaixo, a casa de Dona Celeste em cima; só o térreo tem porta)
    building('loja', 'Armazém', { x: 456, y: 62, w: 100, h: 86, top: 8, solidY: 70, paint: paintArmazem }, true);
    obj({ id: 'celeste-casa', kind: 'text', x: 506, y: 100, r: 12, hit: [470, 50, 72, 44], label: 'Casa de Dona Celeste (andar de cima)', text: 'O andar de cima é a casa de Dona Celeste. A entrada fica nos fundos, e só ela sobe.' });
    building('honorio', 'Casa de Seu Honório', { x: 720, y: 70, w: 70, h: 78, top: 30, solidY: 100, paint: paintHonorio }, false);
    solid(698, 132, 22, 16); solid(792, 116, 10, 32);                              // bancada e tábuas de Seu Honório
    building('bia', 'Casa de Bia', { x: 480, y: 228, w: 70, h: 72, top: 196, solidY: 254, paint: paintBia }, false);
    solid(560, 288, 8, 12);                                                        // casinha de passarinho
    building('iara', 'Casa de Iara', { x: 690, y: 228, w: 70, h: 72, top: 226, solidY: 268, paint: paintIara }, true);
    solid(662, 290, 24, 12);                                                       // cerquinha colorida
    // escola da vila: no leste da vila, de frente para a rua de baixo, com placa e sino
    {
      const X = 880, Y = 498;
      building('escola', 'Escola da vila', { x: X, y: Y, w: 76, h: 72, top: 464, solidY: 518, paint: paintEscola }, true);
      solid(X - 18, 540, 6, 30);                                                   // mastro
      fence(X - 34, X - 8, Y + 64, '#d8b078'); fence(X + 84, X + 112, Y + 64, '#d8b078'); solid(X - 36, Y + 54, 30, 10); solid(X + 82, Y + 54, 32, 10);   // pátio cercado dos dois lados
    }
    fountain(630, 136); solid(616, 126, 28, 16);
    [[566, 226], [694, 226], [566, 116], [694, 116]].forEach(([x, y]) => addLamp(x, y));
    keep(SPOT.bench[0] - 18, SPOT.bench[1] - 14, 36, 22); solid(SPOT.bench[0] - 13, SPOT.bench[1] - 8, 26, 8);
    obj({ id: 'bench', kind: 'bench', x: SPOT.bench[0], y: SPOT.bench[1] + 6, r: 14, hit: [SPOT.bench[0] - 14, SPOT.bench[1] - 15, 28, 17], label: 'Banco da praça' });
    // ---------- bosque ----------
    building('tome', 'Cabana de Tomé', { x: 980, y: 66, w: 60, h: 76, top: 34, solidY: 92, doorX: 30, paint: paintTome }, false);
    solid(1044, 124, 24, 18); solid(966, 130, 14, 12);                              // lenha, balde e vara de pesca
    water(1104, 258, 62, 36);
    // rio do bosque: sai da lagoa e desce até o fim da mata, com uma ponte de tábuas
    stream([[1110, 280], [1126, 330], [1129, 365], [1114, 392], [1106, 418], [1092, 445], [1086, 475], [1084, 520], [1082, 570], [1080, 620], [1070, 680], [1058, 740], [1050, 812]], 6,
      [[1106, 371, 36, 12], [1062, 588, 38, 18], [1036, 768, 40, 24]]);              // pontes: trilha do bosque, rua de baixo e beira-rio
    // rio do sul: atravessa a vila de oeste a leste, com margens de areia, duas pontes e um píer
    stream([[-20, 836], [200, 842], [420, 826], [620, 812], [800, 816], [1000, 808], [1200, 818], [1400, 806], [1620, 812]], 13,
      [[769, 790, 22, 50], [1299, 786, 22, 54]]);
    pier(566, 784, 18, 26);
    NTREES.forEach(([x, y]) => keep(x - 16, y - 34, 32, 44)); NROCKS.forEach(([x, y]) => keep(x - 12, y - 14, 24, 22)); FORAGE.forEach(([x, y]) => keep(x - 12, y - 14, 24, 24));
    keep(SPOT.hat[0] - 12, SPOT.hat[1] - 14, 24, 24);
    R(846, 150, 14, 10, OUT); R(847, 151, 12, 8, '#f0e6cc'); R(852, 160, 2, 8, '#6a4426'); solid(848, 162, 10, 5);
    obj({ id: 'placa2', kind: 'text', x: 853, y: 176, r: 12, hit: [844, 148, 18, 22], label: 'Placa', text: 'BOSQUE — madeira, pedra e o que a mata oferecer. Corte com juízo: o que se tira hoje volta em alguns dias.' });
    // ---------- trilha da serra: sobe ao norte, entre a vila e o bosque ----------
    road('terra', 812, 18, 18, 136); paveFlush();
    R(836, 34, 22, 12, OUT); R(837, 35, 20, 10, '#c89a62'); R(840, 39, 9, 1, '#6a4426'); R(848, 37, 1, 5, '#6a4426'); R(847, 38, 3, 1, '#6a4426'); R(846, 46, 2, 10, '#6a4426'); solid(844, 48, 8, 8);
    // ---------- vila sul: praça do coreto, horta comunitária e jardins da beira-rio ----------
    coreto(635, 486); solid(608, 464, 56, 34);
    flowerBed(568, 448, 26, 12); flowerBed(676, 448, 26, 12); flowerBed(568, 516, 26, 12); flowerBed(676, 516, 26, 12);
    [[566, 538], [706, 538], [566, 444], [706, 444]].forEach(([x, y]) => addLamp(x, y));
    benchDeco(588, 532); benchDeco(662, 532);
    obj({ id: 'coreto', kind: 'text', x: 635, y: 504, r: 16, hit: [608, 448, 56, 52], label: 'Coreto', text: 'O coreto da praça sul. Em dia de festa tem música aqui; nos outros, é sombra e conversa.' });
    {                                                                             // horta comunitária: canteiros cercados ao sul da rua de baixo
      const X0 = 482, X1 = 590, Y0 = 628, Y1 = 708;
      R(X0, Y0, X1 - X0, Y1 - Y0, '#9a7a4a');
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const bx = X0 + 8 + c * 25, by = Y0 + 8 + r * 18; R(bx - 1, by - 1, 19, 12, '#6a4426'); R(bx, by, 17, 10, '#7a5230');
        for (let k = 2; k < 16; k += 4) { if (paintSeason === 3) { R(bx + k, by + 3, 2, 1, '#eef3f8'); continue; } R(bx + k, by + 2, 1, 6, '#3f9648'); R(bx + k - 1, by + 3, 3, 1, (r + c) % 3 ? '#58b858' : '#e04a3a'); } }
      fence(X0, X1, Y0, '#d8b078'); fence(X0, 526, Y1, '#d8b078'); fence(548, X1, Y1, '#d8b078');
      for (let y = Y0; y <= Y1; y += 6) { R(X0 - 1, y - 6, 3, 7, OUT); R(X0, y - 5, 1, 6, '#d8b078'); R(X1 + 1, y - 6, 3, 7, OUT); R(X1 + 2, y - 5, 1, 6, '#d8b078'); }
      solid(X0 - 2, Y0 - 8, X1 - X0 + 6, 8); solid(X0 - 2, Y1 - 6, 532 - X0, 8); solid(546, Y1 - 6, X1 - 542, 8); solid(X0 - 2, Y0, 6, Y1 - Y0); solid(X1 - 2, Y0, 6, Y1 - Y0);
      keep(X0 - 6, Y0 - 12, X1 - X0 + 12, Y1 - Y0 + 24);
      obj({ id: 'horta', kind: 'text', x: 537, y: 716, r: 14, hit: [X0, Y0 - 10, X1 - X0, Y1 - Y0 + 10], label: 'Horta comunitária', text: 'Canteiros cuidados pelos moradores da vila. Cada um planta um pouco e todo mundo colhe.' });
    }
    flowerBed(810, 640, 30, 12); flowerBed(860, 640, 30, 12); flowerBed(810, 690, 30, 12); flowerBed(860, 690, 30, 12);
    benchDeco(830, 730); picnic(940, 660); keep(800, 630, 180, 120);
    [[800, 760], [1000, 760], [600, 760], [1200, 760]].forEach(([x, y]) => addLamp(x, y));
    obj({ id: 'piquenique', kind: 'text', x: 953, y: 684, r: 14, hit: [936, 652, 34, 24], label: 'Mesa de piquenique', text: 'Uma mesa de piquenique de frente para o rio. Alguém esqueceu uma casca de laranja aqui.' });
    // ---------- bairro leste: avenida, terrenos reservados (ferraria e museu) e pomar ----------
    lot(1350, 206, 120, 84, 248);
    sign(1326, 230, '#8a8478'); solid(1328, 232, 8, 8);
    obj({ id: 'lote-ferraria', kind: 'text', x: 1332, y: 250, r: 14, hit: [1322, 218, 20, 26], label: 'Terreno reservado', text: 'Terreno reservado. Dizem que um ferreiro vai se instalar aqui. Por enquanto, só estacas e capim.' });
    lot(1350, 336, 150, 124, 398);
    sign(1326, 380, '#c8a050'); solid(1328, 382, 8, 8);
    obj({ id: 'lote-museu', kind: 'text', x: 1332, y: 400, r: 14, hit: [1322, 368, 20, 26], label: 'Terreno do futuro museu', text: 'Terreno reservado para o museu da vila. A obra ainda não começou.' });
    keep(1340, 196, 170, 276);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const x = 1206 + c * 22 + (r % 2) * 10, y = 470 + r * 34; addTree(x, y, 9); keep(x - 14, y - 30, 28, 40); }   // pomarzinho
    flowerBed(1352, 640, 30, 12); flowerBed(1402, 640, 30, 12); benchDeco(1380, 700); picnic(1440, 640);
    water(1246, 380, 26, 15);                                                      // laguinho do bairro leste (dá para pescar)
    well(1192, 664); solid(1190, 650, 22, 28); keep(1180, 640, 44, 44);
    obj({ id: 'poco', kind: 'text', x: 1201, y: 688, r: 14, hit: [1188, 644, 26, 34], label: 'Poço antigo', text: 'Um poço antigo, de pedra. A água lá embaixo é fria e reflete o céu.' });
    benchDeco(1226, 404); benchDeco(1252, 356);
    // ---------- floresta fechada ao sul da fazenda ----------
    solid(0, 500, 404, FORA.h - 500);
    // trajetos dos moradores na vila: a vegetação sorteada nunca cai neles
    (typeof VILLAGERS !== 'undefined' ? VILLAGERS : []).filter(v => !v.map).forEach(v => v.sched.forEach(([, path]) => {
      if (!Array.isArray(path)) return;
      path.forEach((q, i) => { const a = path[i - 1] || q, n = Math.max(1, Math.ceil(Math.hypot(q[0] - a[0], q[1] - a[1]) / 6)); for (let k = 0; k <= n; k++) keep(a[0] + (q[0] - a[0]) * k / n - 10, a[1] + (q[1] - a[1]) * k / n - 12, 20, 16); });
    }));
    // ---------- vegetação: bordas fechadas e enfeites ----------
    solid(0, 0, W, 26); solid(0, H - 10, W, 10); solid(0, 0, 8, H); solid(W - 8, 0, 8, H);
    open(810, 0, 22, 26);
    m.doors.montanha = { x: 821, y: 44 };
    obj({ id: 'door:montanha', kind: 'door', to: 'montanha', x: 821, y: 40, r: 14, hit: [806, 0, 30, 40], label: 'Subir a trilha da serra' });
    for (let x = 14; x < W; x += 26) { if (Math.abs(x - 821) > 22) (x % 3 ? addTree : addPine)(x, 30 + (x % 4) * 3, 10); (x % 2 ? addTree : addPine)(x + 8, H - 4 - (x % 3) * 2, 10); }
    for (let y = 60; y < H - 30; y += 34) { addPine(10, y); addTree(W - 10, y, 9); }
    const riverY = x => (x < 420 ? 836 + (x / 420) * -10 : 826);
    for (let y = 512; y < H - 20; y += 24) for (let x = 22; x < 400; x += 26) {        // mata fechada ao sul da fazenda (o rio passa por baixo dela)
      const xx = x + ((y / 24) % 2) * 12, yy = y + ((x * 7) % 9);
      if (Math.abs(yy - riverY(xx)) < 26 || xx > 396) continue;
      ((xx + yy) % 3 ? addTree : addPine)(xx, yy, 10);
    }
    let placed = 0;
    const villageArea = (x, y) => x > 410 && y < 770 && !(x > 850 && x < 1200 && y < 500) && (y > 40 || x > 1200);   // fora da fazenda, do bosque e da beira-rio
    for (let i = 0; i < 4000 && placed < 96; i++) {
      const x = 30 + Math.floor(rand() * (W - 60)), y = 60 + Math.floor(rand() * (H - 90));
      if (!villageArea(x, y) || !isFree(x - 16, y - 30, 32, 40)) continue;                 // só na vila: o bosque e a fazenda têm as próprias árvores
      (rand() < 0.35 ? addPine : addTree)(x, y, 9 + Math.floor(rand() * 3)); keep(x - 16, y - 30, 32, 40); placed++;
    }
    for (let i = 0; i < 150; i++) { const x = 30 + rand() * (W - 60), y = 50 + rand() * (H - 80); if (x > 404 && isFree(x - 8, y - 10, 16, 14)) { bush(Math.round(x), Math.round(y), 4 + Math.floor(rand() * 2)); solid(x - 4, y - 4, 8, 5); } }
    flowers(1200, (x, y) => !isFree(x - 2, y - 2, 6, 8), (x, y) => x < 404 && y < 512 && hash(x, y, 230) > 0.12);   // fazenda: poucas flores, chão tranquilo
    m.spawn = { x: m.doors.casa.x, y: m.doors.casa.y };
    m.places = PLACES;
    m.spawns = villageSpawns(m);
    return m;
  }
  /* Pontos onde coletáveis sazonais podem surgir na Vila Acapulco: grama, beira de
     caminhos, perto de árvores e entre as casas. Ficam de fora paredes, água,
     obstáculos, portas e passagens, e o que estiver escondido sob copas e telhados. */
  function villageSpawns(m) {
    const pts = [], blocked = (x0, y0, w, h) => {
      for (let cy = Math.floor(y0 / CELL); cy <= Math.floor((y0 + h - 1) / CELL); cy++) for (let cx = Math.floor(x0 / CELL); cx <= Math.floor((x0 + w - 1) / CELL); cx++)
        if (cx < 0 || cy < 0 || cx >= m.cols || cy >= m.rows || m.solid[cy * m.cols + cx]) return true;
      return false;
    };
    const covered = (x, y) => m.sprites.some(sp => x > sp.x - 4 && x < sp.x + sp.img.width + 4 && y > sp.y - 4 && y < sp.base + 8)
      || m.objs.some(o => { const r = o.hit || [o.x - 10, o.y - 20, 20, 22]; return x > r[0] - 10 && x < r[0] + r[2] + 10 && y > r[1] - 6 && y < r[1] + r[3] + 16; })
      || m.waters.some(w => ((x - w.cx) / (w.rx + 12)) ** 2 + ((y - w.cy) / (w.ry + 12)) ** 2 < 1)
      || (m.streams || []).some(st => st.pts.some(([px, py], i) => i % 4 === 0 && (x - px) ** 2 + (y - py) ** 2 < (st.hw + 10) ** 2));
    for (let y = 70; y <= 860; y += 10) for (let x = 424; x <= 1580; x += 10) {
      if (x > 848 && x < 1200 && y < 500) continue;                            // o bosque tem coletas próprias
      if (blocked(x - 9, y - 20, 18, 26) || covered(x, y)) continue;           // folga em volta de paredes e telhados
      if (pts.some(([px, py]) => Math.abs(px - x) < 22 && Math.abs(py - y) < 18)) continue;
      pts.push([x, y]);
    }
    return pts;
  }

  /* Lugares mostrados na tela do mapa (coordenadas do mapa externo). */
  const PLACES = [
    { id: 'casa', label: 'Sua casa', x: 100, y: 120, icon: 'casa' },
    { id: 'galinheiro', label: 'Galinheiro', x: 94, y: 420, icon: 'galinha' },
    { id: 'cercado', label: 'Cercado', x: 222, y: 420, icon: 'cerca' },
    { id: 'roca', label: 'Roça', x: 200, y: 276, icon: 'roca' },
    { id: 'lago', label: 'Lago', x: 336, y: 100, icon: 'agua' },
    { id: 'loja', label: 'Armazém', x: 510, y: 110, icon: 'loja' },
    { id: 'praca', label: 'Praça', x: 630, y: 170, icon: 'praca' },
    { id: 'honorio', label: 'Seu Honório', x: 755, y: 112, icon: 'morador' },
    { id: 'bia', label: 'Bia', x: 515, y: 266, icon: 'morador' },
    { id: 'iara', label: 'Casa de Iara', x: 725, y: 266, icon: 'morador' },
    { id: 'escola', label: 'Escola', x: 918, y: 540, icon: 'casa' },
    { id: 'coreto', label: 'Praça do coreto', x: 635, y: 488, icon: 'praca' },
    { id: 'horta', label: 'Horta comunitária', x: 536, y: 668, icon: 'roca' },
    { id: 'beirario', label: 'Beira-rio', x: 700, y: 800, icon: 'agua' },
    { id: 'lote-ferraria', label: 'Terreno reservado', x: 1410, y: 248, icon: 'obra' },
    { id: 'lote-museu', label: 'Terreno do museu (reservado)', x: 1425, y: 398, icon: 'obra' },
    { id: 'tome', label: 'Tomé', x: 1010, y: 106, icon: 'morador' },
    { id: 'bosque', label: 'Bosque', x: 950, y: 330, icon: 'bosque' },
    { id: 'rio', label: 'Lagoa do bosque', x: 1104, y: 258, icon: 'agua' },
    { id: 'riacho', label: 'Rio do bosque', x: 1100, y: 440, icon: 'agua' },
    { id: 'trilha', label: 'Trilha da serra', x: 821, y: 70, icon: 'trilha' },
  ];

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

  /* ================= serra (montanhas ao norte da vila) ================= */
  const SERRA = {
    w: 640, h: 400,
    tent: { x: 228, base: 176 },                    // tenda de Lúcio (centro, base)
    fire: [262, 216],
    keepsake: [588, 150],                           // apito perdido (missão)
    forage: [[92, 232], [62, 282], [152, 336], [404, 336], [606, 230], [560, 360]],
  };
  /* Lugares da serra mostrados no mapa (coordenadas da serra). */
  const MPLACES = [
    { id: 'tenda', label: 'Tenda', x: 228, y: 146, icon: 'tenda' },
    { id: 'nascente', label: 'Nascente', x: 500, y: 300, icon: 'agua' },
    { id: 'mata', label: 'Mata da serra', x: 96, y: 300, icon: 'bosque' },
    { id: 'rochedo', label: 'Rochedo do leste', x: 590, y: 170, icon: 'rocha' },
    { id: 'fenda', label: 'Fenda fechada', x: 496, y: 52, icon: 'rocha' },
  ];
  function buildMontanha() {
    const m = newMap('montanha', SERRA.w, SERRA.h, 23); m.waters = [];
    grass();
    g.fillStyle = 'rgba(70,80,40,.16)'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 60; i++) { const x = rand() * W, y = 70 + rand() * (H - 80); R(x, y, 2 + rand() * 3, 2, '#9a9488'); R(x, y, 2, 1, '#c8c2b4'); }   // pedrinhas
    // paredão de rocha ao norte
    for (let y = 0; y < 70; y++) {
      const edge = 62 + Math.round(Math.sin(y) * 0);
      for (let x = 0; x < W; x++) {
        const bot = 60 + Math.round(Math.sin(x / 13) * 3 + Math.sin(x / 5) * 2);
        if (y > bot) continue;
        const band = Math.floor((y + Math.sin(x / 9) * 3) / 8);
        g.fillStyle = y === bot ? OUT : y > bot - 3 ? '#6a6458' : band % 2 ? '#8a8478' : '#9a9486';
        g.fillRect(x, y, 1, 1);
      }
      if (edge && y % 8 === 3) for (let x = (y * 7) % 23; x < W; x += 23) R(x, y, 6, 1, '#b4ae9e');
    }
    solid(0, 0, W, 66);
    if (paintSeason === 3) for (let x = 0; x < W; x++) { const top = 6 + ((x * 7) % 9 === 0 ? 1 : 0); for (let y = 0; y < 60 + Math.round(Math.sin(x / 13) * 3 + Math.sin(x / 5) * 2); y += 8) R(x, y, 1, 2 + ((x * 3) % 2), '#f2f6fb'); R(x, 0, 1, top, '#f6f9fd'); }
    // fenda fechada no paredão (lugar reservado; ninguém entra)
    R(476, 24, 40, 40, OUT); R(478, 26, 36, 38, '#1c1612'); for (let i = 0; i < 4; i++) { R(474, 30 + i * 8, 44, 4, OUT); R(475, 31 + i * 8, 42, 2, '#a07848'); }
    R(472, 22, 3, 44, '#6a4426'); R(517, 22, 3, 44, '#6a4426'); R(470, 20, 52, 4, '#7a5230');
    obj({ id: 'fenda', kind: 'text', x: 496, y: 78, r: 16, hit: [468, 18, 56, 50], label: 'Fenda fechada', text: 'Uma fenda no paredão, escorada e fechada com tábuas velhas. Ninguém passa por ali há muitos anos.' });
    // caminhos de terra batida
    road('terra', 312, 196, 20, 204);                 // trilha que desce para a vila
    road('terra', 140, 250, 192, 16);                 // ramal oeste, até a mata
    road('terra', 332, 252, 140, 16);                 // ramal leste, até a nascente
    road('terra', 472, 252, 124, 14); road('terra', 580, 140, 16, 126);   // trilha do rochedo
    road('terra', 168, 182, 160, 30);                 // terreiro da tenda
    paveFlush();
    // nascente
    water(500, 300, 44, 22, 'rio');
    obj({ id: 'water', kind: 'water', x: 500, y: 276, r: 22, hit: [458, 280, 86, 40], label: 'Nascente' });
    // fogueira com troncos para sentar
    const [fx, fy] = SERRA.fire;
    for (let a = 0; a < 8; a++) { const ang = a / 8 * Math.PI * 2; box(Math.round(fx + Math.cos(ang) * 8) - 2, Math.round(fy - 2 + Math.sin(ang) * 4) - 1, 4, 3, '#8a8478'); }
    R(fx - 5, fy - 3, 10, 3, '#3a2a1a');
    solid(fx - 8, fy - 8, 16, 8); keep(fx - 30, fy - 20, 60, 34);
    const log = (x, y, w) => { R(x - 1, y - 1, w + 2, 7, OUT); R(x, y, w, 5, '#7a5230'); R(x, y, w, 1, '#a07448'); R(x + 1, y + 2, w - 2, 1, '#5a3a22'); R(x, y, 3, 5, '#c8a070'); R(x + 1, y + 1, 1, 3, '#a07448'); };
    log(228, 222, 20); solid(228, 222, 20, 5);
    log(276, 210, 18); solid(276, 210, 18, 5);
    cur.lights.push({ kind: 'fire', x: fx, y: fy - 8, r: 56 });
    obj({ id: 'fogueira', kind: 'fire', x: fx, y: fy + 12, r: 18, hit: [fx - 12, fy - 18, 24, 22], label: 'Fogueira' });
    // pertences organizados: varal de ervas, caixotes, panela sobre pedras
    R(140, 150, 2, 26, '#6a4426'); R(178, 150, 2, 26, '#6a4426'); R(140, 150, 40, 2, '#8a5e36');
    for (let i = 0; i < 6; i++) { const hx = 144 + i * 6; R(hx, 152, 1, 3, '#6a4426'); R(hx - 1, 155, 3, 6, ['#58b858', '#c8a040', '#8ac060', '#3f9648', '#b06a3a', '#6aa050'][i]); }
    box(142, 168, 12, 10, '#a07848'); R(142, 171, 12, 1, '#6a4426'); box(156, 170, 10, 8, '#b88448'); R(158, 168, 6, 2, '#58b858');
    box(170, 168, 10, 7, '#3a3a44'); R(171, 167, 8, 1, '#5a5a66'); box(168, 175, 3, 3, '#8a8478'); box(178, 175, 3, 3, '#8a8478');
    for (let x = 136; x < 186; x += 5) box(x, 182, 3, 2, '#9a9486');                          // borda de pedrinhas arrumadas
    solid(138, 150, 46, 32);
    obj({ id: 'pertences', kind: 'text', x: 160, y: 192, r: 16, hit: [136, 146, 50, 40], label: 'Pertences de Lúcio', text: 'Ervas secando no varal, caixotes empilhados e uma panela sobre as pedras. Tudo no lugar, arrumado com cuidado. Melhor não mexer.' });
    // tenda (desenhada a cada quadro; a melhoria muda o visual)
    const T = SERRA.tent; solid(T.x - 32, T.base - 54, 64, 50); solid(T.x - 32, T.base - 8, 22, 8); solid(T.x + 10, T.base - 8, 22, 8);
    keep(T.x - 40, T.base - 64, 80, 70);
    m.doors.tenda = { x: T.x, y: T.base + 13 };
    obj({ id: 'door:tenda', kind: 'door', to: 'tenda', x: T.x, y: T.base + 10, r: 14, hit: [T.x - 10, T.base - 28, 20, 30], label: 'Entrar na tenda' });
    obj({ id: 'lona', kind: 'lona', x: T.x + 22, y: T.base + 10, r: 16, hit: [T.x + 12, T.base - 52, 22, 42], label: 'Lona da tenda' });
    // árvores e arbustos da mata (fora dos caminhos)
    [[40, 236], [70, 258], [30, 300], [110, 296], [64, 340], [118, 372], [200, 372], [250, 340], [392, 380], [610, 300], [624, 380], [440, 220], [380, 120], [110, 120], [60, 150]].forEach(([x, y], i) => { if (isFree(x - 16, y - 30, 32, 40)) { (i % 3 ? addTree : addPine)(x, y, 10); keep(x - 16, y - 30, 32, 40); } });
    SERRA.forage.forEach(([x, y]) => keep(x - 12, y - 14, 24, 24)); keep(SERRA.keepsake[0] - 12, SERRA.keepsake[1] - 14, 24, 24);
    for (let i = 0; i < 30; i++) { const x = 20 + rand() * (W - 40), y = 80 + rand() * (H - 100); if (isFree(x - 8, y - 10, 16, 14)) { bush(Math.round(x), Math.round(y), 4, i % 2 ? '#3f8a48' : '#5a8a3a'); solid(x - 4, y - 4, 8, 5); } }
    // bordas: paredão ao norte, mata nas laterais e embaixo (com a saída da trilha)
    solid(0, 0, 8, H); solid(W - 8, 0, 8, H); solid(0, H - 6, 300, 6); solid(344, H - 6, W - 344, 6);
    for (let y = 90; y < H; y += 32) { addPine(8, y); addPine(W - 8, y); }
    for (let x = 22; x < W; x += 26) if (x < 290 || x > 356) (x % 3 ? addTree : addPine)(x, H + 2, 10);
    flowers(160, (x, y) => !isFree(x - 2, y - 2, 6, 8) || y < 70);
    obj({ id: 'exit', kind: 'exit', x: 322, y: H - 6, r: 14, hit: [302, H - 18, 40, 18], label: 'Descer para a vila' });
    m.spawn = { x: 322, y: H - 14 };
    m.places = MPLACES;
    return m;
  }
  /* Tenda de Lúcio vista de frente. up = coberta reforçada (missão "Antes da próxima chuva"). */
  function tent(ctx, up, t, prog) {
    const { x, base } = SERRA.tent, P = (a, b, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x + a, base + b, w, h); };
    ctx.fillStyle = 'rgba(20,30,20,.28)'; ctx.fillRect(x - 34, base - 2, 70, 4);
    // estacas e cordas
    P(-38, -4, 2, 6, '#6a4426'); P(36, -4, 2, 6, '#6a4426'); for (let i = 0; i < 12; i++) { P(-37 + i * 0.5 | 0, -6 - i * 3, 1, 1, '#d8c8a0'); P(36 - (i * 0.5 | 0), -6 - i * 3, 1, 1, '#d8c8a0'); }
    // lona em "A"
    for (let r = 0; r < 54; r++) {
      const half = Math.round(4 + r * 0.53), y = base - 54 + r;
      ctx.fillStyle = OUT; ctx.fillRect(x - half - 1, y, half * 2 + 2, 1);
      for (let c = -half; c < half; c++) {
        const left = c < 0, seam = (c + 64) % 9 === 0;
        ctx.fillStyle = up ? (left ? '#5e7a4c' : '#4a6440') : left ? '#c8b48a' : '#a8946c';
        if (seam) ctx.fillStyle = up ? '#3e5636' : '#8a7652';
        ctx.fillRect(x + c, y, 1, 1);
      }
    }
    if (!up) {                                          // remendos e um rasgo na lona velha
      P(-18, -36, 8, 7, '#8a6a48'); P(-17, -35, 6, 1, '#c8a878'); P(-17, -33, 1, 3, '#5a3a22');
      P(10, -26, 9, 6, '#b89868'); P(11, -25, 7, 1, '#d8c8a0');
      P(16, -44, 2, 7, '#3a2a1a'); P(17, -41, 3, 1, '#3a2a1a'); P(14, -38, 2, 1, '#3a2a1a');
    } else {                                            // reforço: cumeeira de madeira, cordas novas e saia de proteção
      P(-2, -58, 4, 6, '#7a5230'); P(-1, -60, 2, 3, '#a07448');
      P(-6, -55, 12, 2, '#8a5e36');
      for (let i = 0; i < 4; i++) { P(-28 + i * 16, -14 - (i % 2) * 3, 10, 1, '#e8d8a8'); }
      P(-31, -6, 62, 4, '#7a5230'); P(-31, -6, 62, 1, '#a07448');
    }
    // entrada escura com aba presa
    for (let r = 0; r < 26; r++) { const hw = Math.round(r * 0.36); ctx.fillStyle = '#2a1e16'; ctx.fillRect(x - hw, base - 26 + r, hw * 2, 1); }
    P(-10, -24, 4, 18, up ? '#6e8a5c' : '#d8c8a0'); P(-10, -24, 1, 18, OUT);
    if (prog > 0 && prog < 1) {                         // barra de progresso do reparo
      P(-9, -66, 18, 4, OUT); P(-8, -65, 16, 2, '#5a1a1a'); P(-8, -65, Math.max(1, Math.round(16 * prog)), 2, '#8fe88f');
    }
  }
  function fireFx(ctx, t, lit) {
    const [fx, fy] = SERRA.fire, P = (a, b, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(fx + a, fy + b, w, h); };
    P(-6, -4, 12, 3, '#5a3a22'); P(-4, -5, 8, 2, '#7a5230');
    if (!lit) { P(-2, -6, 4, 1, '#9a9488'); return; }
    const f = Math.floor(t / 120) % 3;
    P(-4, -9 - f, 8, 5 + f, '#e04a1a'); P(-3, -12 + (f === 1 ? 1 : 0), 6, 7, '#f08a20'); P(-1, -15 + f, 3, 8, '#ffd75e'); P(0, -12, 1, 4, '#fff6c0');
    for (let i = 0; i < 3; i++) { const k = ((t / 900) + i / 3) % 1; ctx.fillStyle = `rgba(255,190,90,${1 - k})`; ctx.fillRect(Math.round(fx - 3 + i * 3 + Math.sin(k * 7 + i) * 2), Math.round(fy - 16 - k * 18), 1, 1); }
  }
  function whistle(ctx, x, y) { ctx.fillStyle = OUT; ctx.fillRect(x - 5, y - 4, 11, 5); ctx.fillStyle = '#c89858'; ctx.fillRect(x - 4, y - 3, 9, 3); ctx.fillStyle = '#7a5230'; ctx.fillRect(x - 2, y - 3, 2, 1); ctx.fillRect(x + 3, y - 2, 1, 1); ctx.fillStyle = '#e8c888'; ctx.fillRect(x - 4, y - 3, 9, 1); }

  const cache = {};
  const OUTDOOR = { fora: () => buildFora(), montanha: () => buildMontanha() };
  /* Mapas externos têm uma versão por estação; interiores, uma só. */
  function get(id) {
    const key = OUTDOOR[id] ? id + ':' + SEASON : id;
    if (!cache[key]) {
      const prevSeed = treeSeed;
      paintSeason = OUTDOOR[id] ? SEASON : -1;
      try { cache[key] = OUTDOOR[id] ? OUTDOOR[id]() : buildRoom(id); } finally { paintSeason = -1; treeSeed = prevSeed; }
    }
    return cache[key];
  }
  function setSeason(si) { SEASON = ((si % 4) + 4) % 4; }
  /* A caixa dos pés (10x6, com x,y no centro da base) está livre de obstáculos fixos? */
  function free(map, x, y) {
    const x0 = x - 5, y0 = y - 6;
    if (x0 < 0 || y0 < 0 || x0 + 10 > map.w || y > map.h) return false;
    for (let cy = Math.floor(y0 / CELL); cy <= Math.floor((y - 1) / CELL); cy++) for (let cx = Math.floor(x0 / CELL); cx <= Math.floor((x0 + 9) / CELL); cx++) if (map.solid[cy * map.cols + cx]) return false;
    return true;
  }
  /* Água de pesca no ponto: devolve 'lago', 'rio' ou null. A ponte não conta como água. */
  function waterZone(map, x, y) {
    for (const w of map.waters || []) if (((x - w.cx) / (w.rx - 2)) ** 2 + ((y - w.cy) / (w.ry - 2)) ** 2 <= 1) return w.zone || 'lago';
    for (const st of map.streams || []) {
      if ((st.bridges || []).some(([bx, by, bw, bh]) => x >= bx - 1 && x <= bx + bw && y >= by - 3 && y <= by + bh + 1)) continue;
      for (let i = 0; i < st.pts.length; i += 2) { const [px, py] = st.pts[i]; if ((x - px) ** 2 + (y - py) ** 2 <= (st.hw - 1) ** 2) return st.zone; }
    }
    return null;
  }
  /* Ponto dentro de um obstáculo fixo (parede, casa, tronco, água)? */
  const solidAt = (map, x, y) => { const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL); return cx < 0 || cy < 0 || cx >= map.cols || cy >= map.rows || !!map.solid[cy * map.cols + cx]; };
  /* Câmera: segue o personagem; se o mapa for menor que a tela, fica centralizado. */
  const axis = (size, view, p) => size <= view ? Math.round((size - view) / 2) : Math.round(Math.max(0, Math.min(size - view, p - view / 2)));
  /* padB: folga embaixo (interiores mais altos que a tela): a saída nunca fica sob a barra de ferramentas. */
  const camera = (map, px, py) => ({ x: axis(map.w, VW, px), y: axis(map.h + (map.padB || 0), VH, py - 14) });
  /* Canteiro da grade da fazenda que contém o ponto (ou -1). */
  const tileAt = (x, y) => { const c = Math.floor((x - GRID.x0) / GRID.s), r = Math.floor((y - GRID.y0) / GRID.s); return c < 0 || r < 0 || c >= GRID.cols || r >= GRID.rows ? -1 : r * GRID.cols + c; };
  const tilePos = i => ({ x: GRID.x0 + (i % GRID.cols) * GRID.s, y: GRID.y0 + Math.floor(i / GRID.cols) * GRID.s });

  /* ================= figuras que mudam com o jogo ================= */
  const figs = {};
  const fig = (key, w, h, ox, fn) => { const k = key + ':' + SEASON; if (!figs[k]) { paintSeason = SEASON; try { figs[k] = tallImg(fn, w, h, ox); } finally { paintSeason = -1; } } return figs[k]; };
  const FRUIT = { laranja: ['#256e34', '#3f9648', '#f08a20'], goiaba: ['#4a8a3a', '#7ab84e', '#f07a90'] };
  function fruitTree(sp, stage, fruit) {
    const [dark, mid, fr] = FRUIT[sp];
    if (stage === 0) return fig('ft0' + sp, 14, 18, 7, () => { R(-1, -8, 2, 8, '#6a4426'); box(-5, -11, 4, 3, mid); box(1, -13, 4, 3, mid); R(-3, 0, 6, 1, '#5a3a1e'); });
    if (stage === 1) return fig('ft1' + sp, 22, 30, 11, () => { shadowOval(0, 0, 7, 2); R(-2, -10, 3, 10, OUT); R(-1, -10, 1, 10, '#8a5e36'); blob(0, -15, 8, OUT); blob(0, -15, 7, dark); blob(-2, -17, 4, mid); });
    return fig('ft2' + sp + (fruit ? 'f' : ''), 34, 46, 17, () => {
      shadowOval(0, 0, 11, 3); R(-3, -12, 6, 12, OUT); R(-2, -12, 4, 11, '#6a4426'); R(-2, -12, 1, 11, '#8a5e36');
      blob(0, -24, 13, OUT); blob(0, -24, 12, dark); blob(-3, -27, 8, mid); blob(-5, -30, 4, shade(mid, 1.25));
      if (fruit) [[-7, -22], [5, -28], [6, -18], [-2, -16], [-9, -30], [1, -33]].forEach(([x, y]) => { box(x, y, 3, 3, fr); R(x, y, 1, 1, shade(fr, 1.3)); });
    });
  }
  const wildTree = (i = 0) => fig('wild' + (i % 3), 34, 50, 17, () => { treeSeed = 9173 + (i % 3) * 131; shadowOval(0, 0, 11, 3); R(-3, -14, 6, 14, OUT); R(-2, -14, 4, 13, '#5a3a22'); R(-2, -14, 1, 13, '#7a5230'); if (paintSeason === 3) return bareBranches(0, -40, 13); return tree(0, 0, 13); blob(0, -28, 13, '#0f3020'); blob(0, -28, 12, '#1f6a34'); blob(-3, -31, 8, '#2a7e40'); blob(-5, -34, 4, '#3f9a52'); blob(5, -22, 4, '#175428'); });
  const stump = (i = 0) => fig('stump' + (i % 4), 22, 16, 11, () => stumpShape((a, b, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(a), Math.round(b), w, h); }, 0, 2, [11, 12, 11, 13][i % 4], [10, 9, 11, 9][i % 4], i % 4));
  const dummyFig = () => fig('dummy', 22, 34, 11, () => { R(-1, -22, 2, 22, '#6a4426'); box(-6, -22, 12, 12, '#d8b878'); R(-6, -22, 12, 2, '#f0d8a0'); R(-3, -18, 2, 2, OUT); R(2, -18, 2, 2, OUT); R(-9, -17, 18, 2, '#8a5e36'); blob(0, -26, 5, OUT); blob(0, -26, 4, '#e8c888'); blob(0, -16, 2, '#c8483a'); });
  const HEN = [['#f8f8f0', '#d8d8c8'], ['#c8843a', '#a06428'], ['#4a4a52', '#2e2e36'], ['#e8c878', '#c8a050']];
  function hen(ctx, x, y, kind, flip, peck, bob) {
    const [c, d] = HEN[kind % HEN.length], s = flip ? -1 : 1, hx = x + s * 4, hy = y - 9 + (peck ? 3 : 0) - bob;
    ctx.fillStyle = 'rgba(20,30,20,.25)'; ctx.fillRect(x - 5, y - 1, 10, 2);
    ctx.fillStyle = OUT; ctx.fillRect(x - 6, y - 8 - bob, 12, 8); ctx.fillRect(hx - 3, hy - 1, 6, 6);
    ctx.fillStyle = c; ctx.fillRect(x - 5, y - 7 - bob, 10, 6); ctx.fillRect(hx - 2, hy, 4, 4);
    ctx.fillStyle = d; ctx.fillRect(x - 5 - (flip ? -8 : 0), y - 7 - bob, 2, 3); ctx.fillRect(x - 3, y - 3 - bob, 6, 2);
    ctx.fillStyle = '#e04a3a'; ctx.fillRect(hx - 1, hy - 2, 2, 2);
    ctx.fillStyle = '#f0a020'; ctx.fillRect(hx + s * 2 - (flip ? 1 : 0), hy + 2, 2, 1); ctx.fillRect(x - 2, y - 1, 1, 2); ctx.fillRect(x + 1, y - 1, 1, 2);
    ctx.fillStyle = OUT; ctx.fillRect(hx + (flip ? -1 : 0), hy + 1, 1, 1);
  }

  /* Ícones 16x16 dos itens. */
  const TOOLC = { enxada: '#9a9aa8', machado: '#b0b0c0', picareta: '#8a8a98', foice: '#c8c8d8' };
  const ICON = {
    enxada() { R(7, 2, 2, 12, '#8a5e36'); box(4, 2, 8, 3, '#9a9aa8'); R(4, 5, 2, 2, '#9a9aa8'); },
    regador() { box(4, 6, 8, 7, '#6a8ab8'); R(4, 6, 8, 2, '#8aa8d0'); R(12, 7, 3, 2, '#6a8ab8'); R(14, 5, 1, 3, '#6a8ab8'); R(2, 4, 2, 6, '#4a6a98'); R(3, 3, 5, 1, '#4a6a98'); },
    machado() { R(7, 3, 2, 11, '#8a5e36'); box(8, 2, 5, 6, '#b0b0c0'); R(12, 3, 1, 4, '#e0e0ec'); },
    picareta() { R(7, 3, 2, 11, '#8a5e36'); box(3, 2, 10, 2, '#8a8a98'); R(2, 3, 2, 2, '#8a8a98'); R(12, 3, 2, 2, '#8a8a98'); },
    foice() { R(4, 8, 2, 7, '#8a5e36'); box(5, 2, 7, 2, '#c8c8d8'); R(11, 3, 2, 4, '#c8c8d8'); R(9, 6, 3, 2, '#c8c8d8'); },
    espada() { box(7, 1, 2, 10, '#d8d8e8'); R(7, 1, 1, 10, '#ffffff'); box(4, 11, 8, 2, '#c89838'); R(7, 13, 2, 3, '#6a4426'); },
    seed(c) { box(4, 4, 8, 9, '#e8dcc0'); R(4, 4, 8, 2, '#c8b890'); box(6, 7, 4, 4, c); R(5, 2, 6, 2, '#c8b890'); },
    rabanete() { blob(8, 10, 5, OUT); blob(8, 10, 4, '#e0507a'); R(7, 13, 2, 2, '#f8f0f0'); R(6, 2, 2, 5, '#3f9648'); R(9, 3, 2, 4, '#58b858'); },
    tomate() { blob(8, 9, 6, OUT); blob(8, 9, 5, '#e04a3a'); R(5, 6, 2, 2, '#f8907a'); R(6, 3, 4, 2, '#3f9648'); R(7, 2, 2, 1, '#3f9648'); },
    abobora() { blob(8, 9, 7, OUT, 0.8); blob(8, 9, 6, '#e88a20', 0.8); R(5, 6, 1, 7, '#c06a10'); R(8, 5, 1, 9, '#c06a10'); R(11, 6, 1, 7, '#c06a10'); R(7, 2, 2, 3, '#3f9648'); },
    muda(c) { box(5, 10, 6, 5, '#b0603a'); R(7, 4, 2, 6, '#6a4426'); box(3, 3, 4, 3, c); box(9, 1, 4, 3, c); },
    laranja() { blob(8, 9, 6, OUT); blob(8, 9, 5, '#f08a20'); R(5, 6, 2, 2, '#ffc070'); R(8, 2, 3, 2, '#3f9648'); },
    goiaba() { blob(8, 9, 6, OUT, 1.1); blob(8, 9, 5, '#9ac850', 1.1); blob(8, 10, 2, '#f07a90'); R(7, 2, 2, 2, '#6a4426'); },
    madeira() { box(2, 8, 12, 5, '#8a5e36'); R(2, 8, 12, 1, '#b88448'); box(4, 3, 10, 5, '#7a5230'); R(13, 4, 1, 3, '#d8b078'); R(13, 9, 1, 3, '#d8b078'); },
    pedra() { blob(8, 10, 6, OUT, 0.7); blob(8, 10, 5, '#9a9aa8', 0.7); R(5, 8, 4, 1, '#c8c8d4'); R(9, 11, 3, 1, '#6a6a78'); },
    racao() { box(4, 4, 8, 10, '#c8a050'); R(4, 4, 8, 2, '#e8d070'); R(6, 8, 4, 3, '#8a5e36'); R(6, 2, 4, 2, '#a08030'); },
    ovo() { blob(8, 9, 6, OUT, 1.15); blob(8, 9, 5, '#f8f0e0', 1.15); R(6, 5, 2, 3, '#ffffff'); },
    amora() { [[6, 6], [10, 6], [8, 9], [5, 10], [11, 10], [8, 12]].forEach(([x, y]) => { blob(x, y, 3, OUT); blob(x, y, 2, '#6a2a8a'); }); R(7, 2, 3, 2, '#3f9648'); },
    cogumelo() { box(6, 9, 4, 5, '#f0e6cc'); blob(8, 7, 6, OUT, 0.7); blob(8, 7, 5, '#c8483a', 0.7); R(5, 6, 2, 2, '#ffffff'); R(10, 5, 2, 2, '#ffffff'); },
    flor() { R(7, 8, 2, 7, '#3f9648'); [[8, 3], [5, 6], [11, 6], [8, 8]].forEach(([x, y]) => blob(x, y, 3, '#ffe066')); blob(8, 6, 2, '#f0a020'); },
    chapeu_palha() { box(4, 4, 8, 6, '#e8c860'); R(4, 8, 8, 2, '#8a5e36'); box(1, 10, 14, 2, '#e8c860'); },
    boina() { blob(8, 9, 7, OUT, 0.6); blob(8, 9, 6, '#c8483a', 0.6); R(8, 3, 2, 2, '#a83a2e'); R(4, 12, 8, 1, '#a83a2e'); },
    chapeu_pescador() { box(4, 4, 8, 6, '#8a9a6a'); R(4, 4, 8, 2, '#a4b482'); box(2, 10, 12, 2, '#6a7a4e'); },
    encomenda() { box(3, 5, 10, 9, '#c8a878'); R(7, 5, 2, 9, '#c8483a'); R(3, 9, 10, 1, '#c8483a'); },
    narciso() { R(7, 8, 2, 7, '#2f7028'); R(4, 11, 3, 2, '#3f9648'); blob(8, 6, 5, OUT); blob(8, 6, 4, '#f8f0a0'); blob(8, 6, 2, '#f0a020'); R(8, 6, 1, 1, '#c86a10'); },
    ervilha_cheiro() { R(7, 8, 1, 7, '#2f7028'); R(9, 6, 1, 6, '#3f9648'); blob(5, 6, 3, OUT); blob(5, 6, 2, '#f090c0'); blob(11, 5, 3, OUT); blob(11, 5, 2, '#c890f0'); blob(8, 3, 3, OUT); blob(8, 3, 2, '#ffb8e0'); },
    acafrao() { R(7, 9, 2, 6, '#3a7a3a'); box(4, 2, 8, 8, '#8a5ad9'); R(5, 2, 6, 2, '#b48af0'); R(7, 4, 2, 4, '#f0a020'); R(4, 9, 8, 1, '#6a3ab8'); },
    azevinho() { box(1, 6, 6, 6, '#1f6a34'); box(9, 6, 6, 6, '#2a7e40'); R(2, 7, 2, 1, '#4fa060'); blob(8, 5, 3, OUT); blob(7, 5, 2, '#e03a3a'); R(6, 4, 1, 1, '#ff8a7a'); blob(10, 4, 2, '#c02a2a'); },
    fruta_cristal() { blob(8, 9, 6, OUT); blob(8, 9, 5, '#a8e0f4'); blob(6, 7, 2, '#e8fbff'); R(10, 11, 2, 2, '#6ab4d8'); R(8, 1, 1, 3, '#5a8a5a'); R(9, 2, 2, 1, '#6aa86a'); },
    morango() {                                     // morango: vermelho com sementinhas e coroa verde
      blob(8, 10, 6, OUT, 1.1); blob(8, 10, 5, '#e0283a', 1.1); R(4, 6, 8, 2, '#e0283a'); R(5, 14, 6, 1, OUT); R(6, 15, 4, 1, OUT);
      R(5, 8, 2, 2, '#ff7a7a'); [[6, 11], [9, 9], [10, 12], [8, 13], [5, 10], [11, 7]].forEach(([x, y]) => R(x, y, 1, 1, '#ffe080'));
      R(5, 3, 6, 2, OUT); R(5, 4, 2, 2, '#3f9648'); R(9, 4, 2, 2, '#3f9648'); R(7, 2, 2, 3, '#58b858'); R(7, 1, 1, 2, '#2f7028');
    },
    chapeu_tome() { box(4, 5, 8, 5, '#7a6a4a'); box(2, 10, 12, 2, '#5a4a32'); R(5, 7, 2, 1, '#3a2a1a'); },
    vara() {                                        // vara de bambu: gomos dourados com nós escuros, cabo amarrado com cordão
      for (let i = 0; i < 13; i++) { R(1 + i, 14 - i, 2, 2, OUT); }
      for (let i = 0; i < 12; i++) { R(2 + i, 14 - i, 1, 1, i % 4 === 3 ? '#8a5a1e' : '#e8c060'); R(2 + i, 15 - i, 1, 1, i % 4 === 3 ? '#6a4012' : '#b88a30'); }
      R(2, 13, 2, 2, '#c8402a'); R(3, 12, 1, 1, '#e86a4a');
      R(14, 1, 1, 1, '#f4e8a0'); for (let y = 2; y < 11; y++) R(15, y, 1, 1, 'rgba(240,240,250,.85)'); R(14, 11, 3, 3, OUT); R(15, 12, 1, 1, '#ffffff');
    },
    vara_fibra() {                                  // fibra de vidro: haste fina vinho e cinza, molinete prateado, cabo de cortiça
      for (let i = 0; i < 13; i++) R(1 + i, 14 - i, 2, 2, OUT);
      for (let i = 0; i < 12; i++) { R(2 + i, 14 - i, 1, 1, i < 4 ? '#c89a62' : i < 8 ? '#8a2a3a' : '#b8b8c8'); R(2 + i, 15 - i, 1, 1, i < 4 ? '#8a6038' : i < 8 ? '#5a1a26' : '#7a7a8a'); }
      box(5, 9, 3, 3, '#c8c8d8'); R(6, 10, 1, 1, '#ffffff'); R(4, 12, 1, 1, '#e0e0ec');
      for (let y = 2; y < 11; y++) R(15, y, 1, 1, 'rgba(240,240,250,.85)'); R(14, 11, 3, 3, OUT); R(15, 12, 1, 1, '#e04a3a');
    },
    minhoca() {                                     // minhoca rosada em curva
      [[3, 11], [4, 10], [5, 9], [6, 9], [7, 10], [8, 11], [9, 11], [10, 10], [11, 9], [12, 8], [12, 7]].forEach(([x, y]) => { R(x - 1, y - 1, 3, 3, OUT); });
      [[3, 11], [4, 10], [5, 9], [6, 9], [7, 10], [8, 11], [9, 11], [10, 10], [11, 9], [12, 8], [12, 7]].forEach(([x, y], i) => { R(x, y, 1, 1, i % 3 === 0 ? '#c85a72' : '#f08aa0'); });
      R(12, 6, 1, 1, '#f8b0c0'); R(4, 13, 8, 1, '#7a5230');
    },
    alga() {                                        // três folhas de alga saindo de um tufo, com nervura clara
      ['................', '............OO..', '...........OLMO.', '......OO...OLMO.', '.....OLMO..OMLO.', '.O...OMLO.OMLO..', 'OLO..OMLO.OMLO..', 'OMLO.OLMO.OLMO..',
        '.OMLOOMLOOMLO...', '..OMLOLMOMLO....', '...OMLMLMLO.....', '....OMLMLO......', '....OMMMLO......', '.....OMMO.......', '.....OOOO.......', '................']
        .forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') R(x, y, 1, 1, { O: '#1a4a2a', M: '#3f9a3a', L: '#b8e060' }[ch]); }));
    },
    musgo() {                                       // tufo verde-musgo, fofo, com pontinhos claros
      blob(8, 10, 7, OUT, 0.6); blob(8, 10, 6, '#4a6a2a', 0.6); blob(6, 9, 3, '#6a8a32'); blob(10, 8, 3, '#7a9a3a'); blob(8, 11, 3, '#5a7a2e');
      [[5, 8], [9, 7], [11, 10], [7, 11], [4, 11]].forEach(([x, y]) => R(x, y, 1, 1, '#b8d070')); R(3, 13, 10, 1, '#3a5220');
    },
    lixo() {                                        // bota velha, furada e pingando
      box(4, 2, 6, 9, '#6a4a32'); R(5, 3, 4, 1, '#8a6442'); box(4, 10, 10, 4, '#6a4a32'); R(4, 13, 10, 1, '#3a2a1e'); R(11, 11, 2, 1, '#8a6442');
      R(6, 6, 2, 1, '#2a1a12'); R(6, 8, 2, 1, '#2a1a12'); R(9, 12, 1, 1, '#c8b890'); R(2, 14, 1, 1, '#8ac8e8'); R(14, 9, 1, 2, '#8ac8e8');
    },
    milho() {                                       // espiga dourada com palha verde
      for (let i = 0; i < 9; i++) { R(4 + i, 11 - i, 4, 4, OUT); }
      for (let i = 0; i < 8; i++) { R(5 + i, 11 - i, 3, 3, i % 2 ? '#f2d040' : '#f8e070'); R(6 + i, 12 - i, 1, 1, '#c89a20'); }
      R(2, 11, 5, 4, OUT); R(3, 11, 3, 3, '#4f9c32'); R(2, 13, 2, 1, '#8ac850'); R(5, 14, 3, 1, '#2a6a22'); R(12, 2, 2, 2, '#e8c060');
    },
    melao() {                                       // melão laranja-avermelhado com folhas no alto
      blob(8, 10, 6, OUT); blob(8, 10, 5, '#e8604a'); blob(7, 9, 3, '#f07a5a'); R(5, 7, 2, 2, '#ffb090'); R(5, 14, 6, 1, '#b8402e');
      R(5, 3, 6, 3, OUT); R(6, 3, 4, 2, '#3f9648'); R(4, 4, 2, 1, '#2a6422'); R(10, 4, 2, 1, '#2a6422'); R(7, 2, 2, 1, '#7ac24e');
    },
    repolho_roxo() {                                // repolho roxo com folhas e nervuras
      blob(8, 9, 7, OUT); blob(8, 9, 6, '#8a3aa8'); blob(7, 8, 3, '#c27ae0'); R(8, 6, 1, 8, '#4a1a5a'); R(5, 10, 6, 1, '#4a1a5a'); R(3, 12, 10, 2, '#5a2a6a'); R(4, 5, 2, 1, '#e0b0f0');
    },
    sardinha() {                                    // corpo prateado e fino, dorso azul
      R(2, 6, 11, 5, OUT); R(1, 7, 1, 3, OUT); R(13, 7, 2, 3, OUT); R(14, 5, 2, 2, OUT); R(14, 10, 2, 2, OUT);
      R(3, 7, 10, 3, '#c8d4e0'); R(3, 7, 10, 1, '#4a78a8'); R(4, 9, 8, 1, '#f0f4f8'); R(13, 8, 1, 1, '#9aa8b8'); R(15, 6, 1, 1, '#4a78a8'); R(15, 10, 1, 1, '#4a78a8');
      R(4, 8, 1, 1, OUT); R(6, 8, 1, 1, '#8aa0b8'); R(8, 6, 3, 1, '#4a78a8');
    },
    tucunare() {                                    // corpo dourado-esverdeado, faixas escuras e o "olho" no rabo
      R(2, 5, 11, 8, OUT); R(1, 7, 1, 4, OUT); R(13, 7, 1, 4, OUT); R(14, 5, 2, 8, OUT); R(6, 3, 5, 2, OUT);
      R(3, 6, 10, 6, '#c8b03a'); R(3, 6, 10, 2, '#6a8a3a'); R(3, 10, 10, 2, '#e8d070'); R(7, 4, 3, 1, '#6a8a3a');
      R(6, 6, 1, 5, '#3a4a22'); R(9, 6, 1, 5, '#3a4a22'); R(14, 6, 1, 6, '#e07a2a'); R(12, 7, 2, 2, '#2a2a1a'); R(12, 7, 1, 1, '#ffb84a');
      R(4, 8, 1, 1, OUT); R(3, 10, 2, 1, '#e8603a');
    },
  };
  const iconCache = {};
  /* Canvas 16x16 com o ícone do item. */
  function icon(id) {
    if (iconCache[id]) return iconCache[id];
    const c = document.createElement('canvas'); c.width = 16; c.height = 16; c.className = 'pixel';
    const prev = g; g = c.getContext('2d');
    const it = ITEMS[id];
    if (it && it.kind === 'seed') {                  // pacote de sementes com o desenho do cultivo
      ICON.seed({ rabanete: '#e0507a', tomate: '#e04a3a', abobora: '#e88a20', morango: '#e0283a', milho: '#f2d040', melao: '#f07a5a', repolho_roxo: '#8a3aa8' }[it.crop]);
      if (it.crop === 'milho') { R(6, 7, 4, 4, '#2a1a14'); R(7, 7, 2, 4, '#f2d040'); R(6, 9, 1, 2, '#4f9c32'); R(9, 9, 1, 2, '#4f9c32'); }
      if (it.crop === 'melao') { R(6, 7, 4, 4, '#2a1a14'); R(7, 8, 2, 2, '#e8604a'); R(7, 7, 2, 1, '#3f9648'); }
      if (it.crop === 'repolho_roxo') { R(6, 7, 4, 4, '#2a1a14'); R(7, 8, 2, 2, '#8a3aa8'); R(6, 10, 4, 1, '#4f9c48'); }
    }
    else if (it && it.kind === 'sapling') ICON.muda(FRUIT[it.tree][1]);
    else if (ICON[id]) ICON[id]();
    g = prev;
    return (iconCache[id] = c);
  }

  function crop(ctx, x, y, kind, stage) {       // stage 0..3 (3 = madura)
    const P = (a, b, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x + a, y + b, w, h); };
    if (stage === 0) { P(7, 9, 2, 2, '#c8b078'); P(4, 5, 1, 1, '#c8b078'); P(11, 11, 1, 1, '#c8b078'); return; }
    if (kind === 'rabanete') {
      if (stage === 1) { P(7, 7, 2, 4, '#58b858'); P(5, 6, 2, 2, '#58b858'); P(9, 6, 2, 2, '#58b858'); }
      else { P(4, 3, 3, 6, '#3f9648'); P(9, 3, 3, 6, '#58b858'); P(7, 2, 2, 7, '#2f8a40'); if (stage === 3) { P(5, 9, 6, 4, OUT); P(6, 9, 4, 3, '#e0507a'); P(6, 9, 1, 1, '#f8a0b8'); } }
    } else if (kind === 'tomate') {
      P(7, stage === 1 ? 6 : 1, 1, stage === 1 ? 6 : 12, '#8a5e36');
      if (stage === 1) { P(5, 6, 2, 2, '#58b858'); P(8, 8, 3, 2, '#58b858'); }
      else { P(3, 3, 4, 4, '#2f8a40'); P(8, 2, 5, 4, '#3f9648'); P(4, 8, 4, 3, '#3f9648'); P(9, 7, 4, 4, '#2f8a40'); const c = stage === 3 ? '#e04a3a' : '#9ac850'; P(4, 5, 3, 3, c); P(10, 4, 3, 3, c); P(8, 9, 3, 3, c); }
    } else {
      if (stage === 1) { P(6, 8, 4, 2, '#58b858'); P(4, 7, 2, 2, '#3f9648'); P(10, 9, 2, 2, '#3f9648'); }
      else { P(1, 9, 14, 2, '#3f9648'); P(2, 6, 4, 4, '#2f8a40'); P(10, 10, 4, 4, '#2f8a40'); P(12, 5, 3, 3, '#58b858'); if (stage === 3) { P(4, 4, 9, 8, OUT); P(5, 5, 7, 6, '#e88a20'); P(7, 5, 1, 6, '#c06a10'); P(10, 5, 1, 6, '#c06a10'); P(6, 6, 1, 2, '#ffc070'); P(8, 3, 2, 2, '#3f9648'); } else { P(6, 7, 4, 4, '#9ac850'); } }
    }
  }
  /* Morango e abóbora: 5 estágios na primeira produção, o pé adulto na rebrota (flor →
     fruto em formação → maduro) e o pé seco no fim da estação. */
  function staged(ctx, x, y, o) {
    const P = (a, b, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x + a, y + b, w, h); }, st = cropState(o);
    if (!o.dead && !(o.g > 0) && !(o.cyc > 0)) return plantedSeeds(P, o.crop);   // semente plantada, ainda sem germinar
    const s = o.dead ? 0 : st.ripe ? 6 : st.regrow ? (st.frac < 0.5 ? 4 : 5) : st.stage;
    if (o.crop === 'morango') strawberryPlant(P, s);
    else if (o.crop === 'abobora') pumpkinPlant(P, s);
    else if (o.crop === 'milho') cornPlant(P, s, !!st.regrow, o.dead);
    else if (o.crop === 'melao') melonPlant(P, s, o.dead);
    else if (o.crop === 'repolho_roxo') cabbagePlant(P, s, o.dead);
  }
  /* Sementes na terra (antes de germinar): covinhas com grãos. */
  function plantedSeeds(P, crop) {
    const c = { milho: '#e8c040', melao: '#f4e8c8', repolho_roxo: '#5a3a5a', morango: '#c8a060', abobora: '#f0e0b0' }[crop] || '#c8a060';
    [[4, 8], [9, 7], [6, 11], [11, 11]].forEach(([a, b]) => { P(a - 1, b, 4, 2, '#5a3a1a'); P(a, b, 2, 1, c); });
  }
  const deadPlant = P => { P(4, 10, 8, 3, '#5a3a1a'); P(3, 9, 3, 2, '#8a6a3a'); P(10, 9, 3, 2, '#8a6a3a'); P(6, 6, 1, 4, '#7a5a2a'); P(9, 7, 1, 3, '#7a5a2a'); P(5, 5, 2, 1, '#a8884a'); };
  /* Milho: alto (passa do canteiro para cima, desenhado antes do personagem, que fica sempre à frente). */
  function cornPlant(P, s, regrow, dead) {
    const D = '#2a6a22', M = '#4f9c32', L = '#8ac850', Y = '#f2d040', YD = '#c89a20', T = '#e8c060';
    if (dead || s === 0) { P(7, -2, 2, 14, '#8a7040'); P(4, 4, 3, 1, '#a8884a'); P(9, 1, 3, 1, '#a8884a'); P(5, 9, 2, 1, '#a8884a'); return; }
    if (s === 1) { P(7, 9, 1, 4, M); P(6, 9, 1, 1, L); P(8, 8, 1, 1, L); return; }
    if (s === 2) { P(7, 6, 2, 7, D); P(7, 6, 1, 7, M); P(4, 8, 3, 1, M); P(9, 7, 3, 1, M); P(4, 7, 1, 1, L); P(11, 6, 1, 1, L); return; }
    const top = s === 3 ? 0 : -10, h = 13 - top;
    P(6, top, 3, h, D); P(7, top, 1, h, M);                                   // colmo
    const leaf = (y, dir) => { if (dir < 0) { P(2, y, 5, 1, D); P(1, y - 1, 2, 1, M); P(3, y, 3, 1, M); } else { P(9, y, 5, 1, D); P(13, y - 1, 2, 1, M); P(10, y, 3, 1, M); } };
    for (let y = top + 3, i = 0; y < 12; y += 3, i++) leaf(y, i % 2 ? 1 : -1);
    P(5, 11, 6, 2, D);
    if (s >= 4) { P(6, top - 3, 3, 3, T); P(7, top - 4, 1, 1, T); P(5, top - 2, 1, 1, T); P(9, top - 2, 1, 1, T); }   // pendão
    if (s === 6) [[4, -2], [9, 2]].forEach(([a, b]) => { P(a - 1, b - 1, 4, 7, '#2a1a14'); P(a, b, 2, 5, Y); P(a, b, 1, 1, '#fff0a0'); P(a + 1, b + 3, 1, 1, YD); P(a - 1, b + 2, 1, 3, L); P(a + 2, b + 2, 1, 3, L); });   // espigas
    else if (s === 5 && !regrow) [[4, 0]].forEach(([a, b]) => { P(a, b, 2, 4, L); P(a, b, 1, 1, '#d8f0a0'); });
    else if (s === 5 && regrow) [[4, -1], [9, 3]].forEach(([a, b]) => { P(a, b, 2, 3, L); });                 // espigas novas, ainda verdes
  }
  /* Melão: rama rasteira, flor amarela e o fruto que cresce de verde a laranja-avermelhado. */
  function melonPlant(P, s, dead) {
    const D = '#2a6422', M = '#3f9648', L = '#7ac24e';
    if (dead || s === 0) return deadPlant(P);
    const leaf = (a, b) => { P(a, b, 4, 3, D); P(a, b, 3, 2, M); P(a, b, 1, 1, L); };
    if (s === 1) { P(7, 10, 1, 3, M); P(6, 9, 1, 1, L); P(8, 9, 1, 1, L); return; }
    if (s === 2) { P(7, 9, 1, 4, D); leaf(3, 8); leaf(9, 8); return; }
    P(2, 12, 12, 1, '#4a8a30'); leaf(1, 8); leaf(6, 6); leaf(11, 8); leaf(4, 11); leaf(10, 11);
    if (s === 3) return;
    if (s === 4) { P(7, 9, 3, 3, '#ffd040'); P(8, 10, 1, 1, '#e09020'); return; }
    if (s === 5) { P(5, 8, 6, 5, '#2a1a14'); P(6, 9, 4, 3, '#9ac850'); P(6, 9, 1, 1, '#d8f0a0'); return; }
    P(3, 5, 10, 9, '#2a1a14'); P(4, 6, 8, 7, '#e8604a'); P(5, 7, 6, 5, '#f07a5a'); P(5, 7, 2, 2, '#ffb090'); P(4, 12, 8, 1, '#b8402e');
    P(6, 4, 4, 3, D); P(7, 3, 2, 2, M); P(5, 5, 1, 1, L); P(10, 5, 1, 1, L);
  }
  /* Repolho roxo: roseta verde que fecha num repolho roxo. */
  function cabbagePlant(P, s, dead) {
    const D = '#2a6422', M = '#4f9c48', L = '#8ad070', PD = '#4a1a5a', PM = '#8a3aa8', PL = '#c27ae0';
    if (dead || s === 0) return deadPlant(P);
    if (s === 1) { P(7, 10, 2, 3, M); P(6, 10, 1, 1, L); P(9, 10, 1, 1, L); return; }
    if (s === 2) { P(5, 9, 6, 4, D); P(6, 9, 4, 3, M); P(6, 9, 1, 1, L); P(9, 10, 1, 1, L); return; }
    P(2, 7, 12, 7, D); P(3, 8, 10, 5, M); P(2, 7, 2, 2, L); P(12, 7, 2, 2, L); P(3, 12, 2, 1, L); P(11, 12, 2, 1, L);   // folhas de fora
    if (s === 3) { P(6, 8, 4, 3, '#3f7a3a'); return; }
    if (s === 4) { P(6, 8, 4, 3, PD); P(7, 8, 2, 2, PM); return; }
    if (s === 5) { P(5, 6, 6, 6, PD); P(6, 7, 4, 4, PM); P(6, 7, 1, 1, PL); return; }
    P(4, 4, 8, 9, '#2a1a14'); P(5, 5, 6, 7, PM); P(6, 5, 4, 1, PL); P(5, 6, 2, 2, PL); P(8, 7, 1, 4, PD); P(6, 9, 4, 1, PD); P(5, 11, 6, 1, PD);   // repolho fechado
  }
  function strawberryPlant(P, s) {
    const D = '#2a6a2a', M = '#4fa848', L = '#8ad060';
    if (s === 0) { P(4, 10, 8, 3, '#5a3a1a'); P(3, 9, 3, 2, '#8a6a3a'); P(10, 9, 3, 2, '#8a6a3a'); P(6, 7, 1, 3, '#7a5a2a'); P(9, 7, 1, 3, '#7a5a2a'); P(7, 11, 3, 1, '#a8884a'); P(5, 8, 1, 1, '#a8884a'); return; }
    if (s === 1) { P(7, 10, 2, 3, M); P(6, 9, 1, 1, L); P(9, 9, 1, 1, L); P(7, 12, 2, 1, D); return; }
    if (s === 2) { P(7, 9, 1, 4, D); P(5, 8, 2, 2, M); P(9, 8, 2, 2, M); P(7, 6, 2, 2, M); P(5, 8, 1, 1, L); P(7, 6, 1, 1, L); return; }
    const leaf = (a, b) => { P(a, b, 3, 3, D); P(a, b, 2, 2, M); P(a, b, 1, 1, L); };
    if (s === 3) { leaf(4, 8); leaf(9, 8); leaf(6, 5); leaf(7, 10); return; }
    leaf(2, 8); leaf(11, 8); leaf(5, 5); leaf(9, 5); leaf(7, 9); leaf(4, 11); leaf(10, 11);
    if (s === 4) [[3, 6], [12, 6], [7, 3]].forEach(([a, b]) => { P(a - 1, b, 3, 1, '#f8f8f0'); P(a, b - 1, 1, 3, '#f8f8f0'); P(a, b, 1, 1, '#f0c040'); });
    if (s === 5) [[3, 6], [12, 7], [7, 13]].forEach(([a, b]) => { P(a - 1, b - 1, 3, 4, '#2a4a1a'); P(a, b, 1, 2, '#b8e080'); });
    if (s === 6) [[2, 6], [12, 6], [7, 12]].forEach(([a, b]) => {        // maduro: morangos vermelhos bem à vista
      P(a - 1, b - 1, 5, 6, '#2a1a14'); P(a, b, 3, 4, '#e0283a'); P(a, b, 1, 1, '#ff8a8a'); P(a + 1, b + 2, 1, 1, '#ffe080'); P(a + 2, b + 1, 1, 1, '#ffe080');
      P(a, b - 1, 3, 1, '#3f9648'); P(a + 1, b + 4, 1, 1, '#a81a2a');
    });
  }
  function pumpkinPlant(P, s) {
    const D = '#2a6422', M = '#3f9648', L = '#6ab84a', V = '#4a8a30';
    const bigLeaf = (a, b) => { P(a, b, 4, 3, D); P(a, b, 3, 2, M); P(a + 1, b, 1, 1, L); };
    if (s === 0) { P(1, 11, 14, 1, '#7a5a2a'); P(2, 9, 3, 2, '#8a6a3a'); P(10, 9, 4, 2, '#8a6a3a'); P(6, 8, 3, 3, '#6a4a22'); P(7, 7, 1, 1, '#a8884a'); P(12, 12, 2, 1, '#5a3a1a'); return; }
    if (s === 1) { P(7, 10, 1, 3, M); P(5, 9, 2, 2, L); P(8, 9, 2, 2, L); return; }
    if (s === 2) { P(7, 8, 1, 5, D); bigLeaf(3, 8); bigLeaf(8, 7); bigLeaf(5, 5); return; }
    P(1, 11, 14, 1, V); P(3, 10, 1, 1, V); P(12, 12, 1, 1, V);                 // rama espalhada
    bigLeaf(1, 7); bigLeaf(5, 5); bigLeaf(10, 6); bigLeaf(12, 9); bigLeaf(3, 12);
    if (s === 3) return;
    if (s === 4) { P(7, 9, 3, 3, '#ffd040'); P(8, 10, 1, 1, '#e09020'); P(6, 10, 1, 1, '#ffe880'); return; }
    if (s === 5) { P(5, 8, 6, 5, '#2a1a14'); P(6, 9, 4, 3, '#8ac850'); P(7, 9, 1, 3, '#6aa838'); P(8, 7, 1, 2, '#5a3a1e'); return; }   // abóbora em formação: pequena e verde
    P(3, 5, 10, 9, '#2a1a14'); P(4, 6, 8, 7, '#e88a20'); P(6, 6, 1, 7, '#c06a10'); P(9, 6, 1, 7, '#c06a10');   // madura: grande e laranja
    P(4, 7, 1, 3, '#ffc070'); P(5, 6, 1, 1, '#ffc070'); P(7, 3, 2, 3, '#2a1a14'); P(7, 4, 1, 2, '#6a8a2a'); P(4, 12, 8, 1, '#a85a10');
  }
  /* Recursos do chão (pedras, galhos, tocos e matinhos): sprites pequenos com variações que dependem só da
     posição do objeto (mesma aparência ao mover a câmera, salvar e carregar). Ficam em cache por tipo e variação. */
  const DCACHE = {};
  function dsprite(key, w, h, fn) {
    if (!DCACHE[key]) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); fn((a, b, ww, hh, col) => { x.fillStyle = col; x.fillRect(Math.round(a), Math.round(b), ww, hh); }); DCACHE[key] = c; }
    return DCACHE[key];
  }
  const hsh = (a, b, s = 0) => { let h = (a * 374761393 + b * 668265263 + s * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
  /* pedra de silhueta irregular: perfil linha a linha com lados independentes, faces claras em cima,
     lado direito na sombra, contorno suave e sombra de contato. (cx, by) = centro da base. */
  function stoneShape(P, cx, by, w, h, v, big) {
    const rows = [];
    for (let j = 0; j < h; j++) {
      const t = (j + 0.5) / h, k = t < 0.62 ? Math.sqrt(Math.max(0, 1 - ((0.62 - t) / 0.62) ** 2)) : 1 - Math.max(0, t - 0.86) * 1.2;
      const jl = j === Math.floor(h * 0.3) && v % 2 ? 1 : 0, jr = j === Math.floor(h * 0.5) && v % 2 === 0 ? -1 : 0, lean = (v % 2 ? 1 : -1) * Math.round((1 - t) * 0.8);   // facetas discretas, sem ruído
      rows.push([Math.round(cx - (w / 2) * k) + jl + lean, Math.round(cx + (w / 2) * k) + jr + lean]);
    }
    P(cx - w / 2 - 1, by - 1, w + 3, 2, 'rgba(30,36,24,.28)');                                     // sombra de contato
    const y0 = by - h;
    rows.forEach(([l, r], j) => { if (r - l < 1) return; P(l - 1, y0 + j, r - l + 2, 1, '#55505a'); });
    if (rows[0][1] - rows[0][0] > 0) P(rows[0][0], y0 - 1, rows[0][1] - rows[0][0], 1, '#55505a');
    const base = ['#9a96a0', '#a29a94', '#96989e', '#a09c98'][v % 4], light = shade(base, 1.18), top = shade(base, 1.32), dark = shade(base, 0.78), deep = shade(base, 0.66);
    rows.forEach(([l, r], j) => {
      if (r - l < 1) return; const y = y0 + j, t = j / h, wd = r - l;
      P(l, y, wd, 1, t < 0.38 ? light : base);
      if (t < 0.22) P(l + 1, y, Math.max(1, Math.round(wd * 0.55)), 1, top);                        // face de cima, luz do alto à esquerda
      P(r - Math.max(1, Math.round(wd * (t < 0.4 ? 0.2 : 0.34))), y, Math.max(1, Math.round(wd * (t < 0.4 ? 0.2 : 0.34))), 1, dark);
      if (j === h - 1) P(l, y, wd, 1, deep);
    });
    const mid = rows[Math.floor(h * 0.5)];
    if (v % 3 === 0) { const cx2 = mid[0] + Math.round((mid[1] - mid[0]) * 0.45); P(cx2, y0 + Math.floor(h * 0.42), 1, 2, dark); }   // uma rachadura só, em algumas
    if (v % 4 === 2 || big) { P(rows[1][0] + 1, y0 + 1, 2, 1, '#6e8a3c'); P(rows[2][0], y0 + 2, 1, 1, '#58763a'); }   // musgo
    if (v % 4 === 0) { P(cx + w / 2 + 2, by - 2, 2, 2, '#55505a'); P(cx + w / 2 + 2, by - 2, 1, 1, light); }        // pedrinha ao lado
  }
  /* galho caído: tronco fino em diagonal, casca com luz em cima, pontas de corte e raminhos */
  function branchShape(P, v, ss = 0) {
    const flip = v % 2, L = 11 + (v >> 1) % 2 * 2, x0 = flip ? 15 : 3, y0 = 13 - (v % 3), dx = flip ? -1 : 1, rise = 3 + (v % 3);
    const pt = i => [x0 + dx * i, y0 - Math.round(i * rise / L)];
    for (let i = 0; i <= L; i++) { const [x, y] = pt(i); P(x, y + 2, 1, 1, 'rgba(30,36,24,.22)'); }
    for (let i = 0; i <= L; i++) {
      const [x, y] = pt(i); P(x, y - 1, 1, 3, '#4a301c');
      P(x, y - 1, 1, 1, '#a87a48'); P(x, y, 1, 1, '#7a5232');                                       // casca: luz em cima, base contínua
    }
    const [ax, ay] = pt(0), [bx, by] = pt(L);
    P(ax, ay - 1, 1, 2, '#e0c088'); P(ax, ay, 1, 1, '#b08a58');                                    // pontas de corte
    P(bx, by - 1, 1, 2, '#d8b47a');
    const twig = (i, up, len, leaf) => { const [x, y] = pt(i); for (let k = 1; k <= len; k++) P(x + dx * (k >> 1) * (up ? 1 : -1), y - 1 - k, 1, 1, k === len ? '#7a5232' : '#5e3e24'); if (leaf && ss !== 3) { P(x + dx * (len >> 1) * (up ? 1 : -1) - 1, y - 2 - len, 2, 1, ss === 2 ? '#c8781e' : '#58a848'); P(x + dx * (len >> 1) * (up ? 1 : -1), y - 3 - len, 1, 1, ss === 2 ? '#e8a040' : '#7cc458'); } };
    twig(4 + v % 2, true, 3, v % 3 !== 1); if (v % 4 !== 3) twig(8, false, 2, v % 2 === 0);
  }
  /* toco: raízes abertas, casca com estrias verticais, corte de cima oval com anéis */
  function stumpShape(P, cx, by, w, h, v) {
    const l = Math.round(cx - w / 2), top = by - h, r = l + w;
    P(l - 2, by - 1, w + 4, 2, 'rgba(30,36,24,.28)');
    P(l - 3, by - 3, 4, 3, '#3e2816'); P(l - 2, by - 3, 3, 2, '#6a4428'); P(l - 3, by - 1, 1, 1, '#6a4428');   // raízes
    P(r - 1, by - 3, 4, 3, '#3e2816'); P(r - 1, by - 3, 3, 2, '#5e3e24'); P(r + 2, by - 1, 1, 1, '#5e3e24');
    if (v % 2) { P(cx - 2, by - 1, 4, 1, '#3e2816'); P(cx - 1, by - 1, 2, 1, '#6a4428'); }
    P(l - 1, top + 1, w + 2, h - 1, '#3e2816');                                                          // corpo
    for (let x = 0; x < w; x++) {
      const t = x / (w - 1), c = t < 0.25 ? '#8e6440' : t < 0.6 ? '#74502e' : t < 0.85 ? '#62422a' : '#523620';
      P(l + x, top + 2, 1, h - 3, c);
    }
    P(l, top - 1, w, 4, '#3e2816'); P(l + 1, top - 2, w - 2, 1, '#3e2816');                               // corte de cima (oval)
    P(l + 1, top - 1, w - 2, 3, '#d8b47c'); P(l, top, 1, 1, '#d8b47c'); P(r - 1, top, 1, 1, '#c09a64');
    P(l + 2, top - 1, w - 4, 1, '#ead0a0');
    P(l + 2, top, w - 4, 1, '#c09a64'); P(cx - 1, top, 2, 1, '#e2c690');                          // um anel
    P(l + Math.round(w * 0.35), top + 3, 1, h - 5, '#5e3e24'); P(l + Math.round(w * 0.7), top + 4, 1, h - 6, '#46301c');   // duas estrias
    if (v % 3 === 1) { P(r - 3, top + 4, 2, 2, '#6e8a3c'); }                                              // musgo
  }
  /* matinho: tufo de lâminas de alturas diferentes, inclinadas para lados diferentes, com base cheia */
  function weedShape(P, v, ss = 0) {
    const n = 6 + v % 2, cols = ss === 3 ? ['#5a6a52', '#6a7a60', '#7a8a6e', '#62725a'] : ss === 2 ? ['#6a6a2c', '#8a7a36', '#a08a3c', '#7a7032'] : ['#2a6a2c', '#3a8436', '#4c9a3c', '#327a32'];
    P(2, 13, 12, 2, 'rgba(30,36,24,.25)');
    P(3, 11, 10, 3, cols[0]); P(4, 10, 8, 1, cols[3]);
    for (let i = 0; i < n; i++) {
      const bx = 3 + Math.round(i * 9 / (n - 1) + (hsh(v, i, 71) - 0.5) * 1.5), ht = 4 + Math.floor(hsh(v, i, 72) * 6) + (i === (v * 3) % n ? 3 : 0), lean = hsh(v, i, 73) < 0.5 ? -1 : 1, c = cols[i % 2 ? 1 : 2];
      for (let k = 0; k < ht; k++) { const x = bx + (k > ht * 0.5 ? lean : 0) + (k > ht * 0.85 && ht > 6 ? lean : 0); P(x, 12 - k, 1, 1, k > ht - 2 && ss < 2 ? '#6fb84a' : c); }
    }
    if (v % 4 === 1) { P(10, 3, 2, 2, '#ffe066'); P(10, 3, 1, 1, '#fff4a8'); P(11, 5, 1, 2, '#3a8436'); }   // florzinha
    if (v % 4 === 3) { P(5, 2, 1, 3, '#c8b878'); P(5, 1, 1, 1, '#e0d090'); P(6, 3, 1, 1, '#c8b878'); }       // espiga de capim
  }
  /* Canteiro preparado (revisão limpa): marrom médio, três sulcos discretos e de baixo contraste, bordas simples
     levemente irregulares. Lados encostados em outro canteiro continuam sem borda. Molhado mais escuro, mas legível.
     Cache por (molhado, vizinhos, variação). */
  const SOIL = {}, SOILP = [{ base: [146, 90, 48], dark: [128, 77, 40], light: [160, 101, 56], edge: [122, 74, 38] }, { base: [94, 57, 31], dark: [80, 47, 25], light: [106, 66, 37], edge: [74, 44, 23] }];
  function soilImg(wet, mask, v) {
    const key = (wet ? 'w' : 'd') + mask + ':' + v; if (SOIL[key]) return SOIL[key];
    const c = document.createElement('canvas'); c.width = c.height = 18; const x2 = c.getContext('2d'), img = x2.createImageData(18, 18), D = img.data, Pl = SOILP[wet ? 1 : 0];
    const put = (x, y, col) => { const i = (y * 18 + x) * 4; D[i] = col[0]; D[i + 1] = col[1]; D[i + 2] = col[2]; D[i + 3] = 255; };
    const N = !(mask & 1), E = !(mask & 2), S = !(mask & 4), Wd = !(mask & 8);
    for (let ly = 0; ly < 16; ly++) for (let lx = 0; lx < 16; lx++) {
      let col = Pl.base;
      // sulcos curtos e desencontrados (traços de 3 px), em quatro fileiras
      const row = Math.floor(ly / 4), fy = row * 4 + 2, ph = (row * 3 + v * 2) % 5, on = (lx + ph) % 5 < 3;
      if (ly === fy && on) col = Pl.dark; else if (ly === fy - 1 && on && (lx + ph) % 5 === 1) col = Pl.light;
      const eN = N && ly === 0, eS = S && ly === 15, eW = Wd && lx === 0, eE = E && lx === 15;
      if ((eN || eS) && (eW || eE)) continue;                                                       // canto arredondado
      if (eN || eS || eW || eE) col = Pl.edge;
      put(lx + 1, ly + 1, col);
    }
    x2.putImageData(img, 0, 0); return (SOIL[key] = c);
  }
  /* Capim alto (mato removível): folhas estreitas, compridas e curvas, de alturas diferentes e inclinadas para
     lados variados; base verde-escura, meios-tons e pontas verde-amareladas; flores ou sementes em alguns. Se há
     capim vizinho, as folhas avançam até ele e as moitas se emendam (bordas, centro mais denso, aberturas onde não
     há capim). Só as pontas oscilam, de leve. Cache por (variação, vizinhos, quadro, estação). */
  const CAPIM = {};
  function capim(v, mask, f) {
    const ss = SEASON, key = v + ':' + mask + ':' + f + ':' + ss; if (CAPIM[key]) return CAPIM[key];
    const pal = ss === 3 ? ['#4a5a50', '#62726a', '#76867c', '#dfe6ea'] : ss === 2 ? ['#5a4818', '#86662a', '#a07c30', '#d8b04a'] : ss === 1 ? ['#1d5a1c', '#2f852a', '#42a034', '#9cd444'] : ['#1f5a20', '#2f7f2a', '#3d9433', '#8fca3e'];
    const c = document.createElement('canvas'); c.width = 28; c.height = 34; const x2 = c.getContext('2d');
    const P = (x, y, col) => { x2.fillStyle = col; x2.fillRect(x + 6, y + 15, 1, 1); };                 // coordenadas do quadrado: (0,0)..(15,15)
    const N = mask & 1, E = mask & 2, S = mask & 4, Wn = mask & 8, nb = (N ? 1 : 0) + (E ? 1 : 0) + (S ? 1 : 0) + (Wn ? 1 : 0);
    const r = (i, a) => hsh(v * 131 + mask * 7, i, a);
    const xa = Wn ? -3 : 0, xb = E ? 18 : 15, bot = S ? 17 : 15;
    // massa da moita: topo irregular, mais alta no meio e onde há vizinhos; base sem linha reta
    const top = [], botY = [];
    for (let x = xa; x <= xb; x++) {
      const u = (x - xa) / (xb - xa), dome = Math.sin(Math.PI * (Wn && E ? 0.5 : Wn ? 0.25 + u * 0.75 : E ? u * 0.75 : u)), bump = Math.round((r(x + 40, 601) - 0.5) * 3);
      top[x - xa] = Math.round(bot - 2 - Math.round(dome * 2) - dome * (5 + (N ? 4 : 0) + (nb >= 3 ? 2 : 0)) - bump - (N ? 3 : 0) * (1 - dome));
      botY[x - xa] = bot - ((!Wn && x < xa + 2) || (!E && x > xb - 2) ? 1 : 0) - (!S && r(x, 602) < 0.25 ? 1 : 0);
    }
    if (!S) { x2.fillStyle = 'rgba(60,40,10,.24)'; for (let x = xa + 1; x < xb; x++) x2.fillRect(x + 6, botY[x - xa] + 15, 1, 1); }   // sombra junto à base
    for (let x = xa; x <= xb; x++) for (let y = top[x - xa]; y <= botY[x - xa]; y++) {
      const d = botY[x - xa] - y, hgt = botY[x - xa] - top[x - xa];
      P(x, y, d < 2 ? pal[0] : pal[1]);
    }
    for (let j = 0; j < 4 + nb * 2; j++) { const x = xa + 1 + Math.floor(r(j, 609) * (xb - xa - 2)), ti = x - xa, y = botY[ti] - 2 - Math.floor(r(j, 610) * Math.max(1, botY[ti] - top[ti] - 3)), d = r(j, 611) < 0.5 ? -1 : 1; P(x, y, pal[0]); P(x + d, y - 1, pal[0]); }   // folhas na sombra, por dentro
    // folhas: curvas, de alturas e direções variadas, saindo de dentro da massa (as de trás primeiro)
    const n = 12 + nb * 3 + (v % 3), tips = [];
    const blade = (bx, by, hgt, dir, L, col, tip, sway) => {
      for (let k = 0; k < hgt; k++) { const t = k / hgt, x = bx + dir * Math.round(L * t * t) + (t > 0.6 ? sway : 0); P(x, by - k, k >= hgt - 2 ? tip : col); if (t < 0.3) P(x - dir, by - k, col); }
      return [bx + dir * L + sway, by - hgt + 1];
    };
    for (let layer = 0; layer < 2; layer++) for (let i = 0; i < n; i++) {
      if ((i % 2) !== layer) continue;
      const bx = Math.round(xa + 1 + (i + 0.5) * (xb - xa - 2) / n + (r(i, 603) - 0.5) * 2), ti = Math.max(0, Math.min(top.length - 1, bx - xa));
      const nearW = !Wn && bx < 3, nearE = !E && bx > 12, dir = nearW ? -1 : nearE ? 1 : r(i, 604) < 0.5 ? -1 : 1;
      const hgt = Math.round((layer ? 4 + r(i, 605) * 5 : 6 + r(i, 605) * 6) * (nearW || nearE ? 0.65 : 1)) + 2;
      const by = top[ti] + 2 + (layer ? 2 : 0);
      tips.push(blade(bx, by, hgt, dir, 2 + Math.floor(r(i, 606) * 3), layer ? (i % 3 ? pal[2] : pal[1]) : pal[1], layer ? pal[3] : pal[2], i % 3 === 0 ? f : 0));
    }
    // luz agrupada no alto à esquerda da massa (traços de folha, não pontos)
    for (let j = 0; j < 3 + nb; j++) { const x = xa + 2 + Math.floor(r(j, 607) * (xb - xa - 4) * 0.7), ti = x - xa, y = top[ti] + 2 + Math.floor(r(j, 608) * 3); P(x, y, pal[2]); P(x + 1, y - 1, pal[2]); P(x + 2, y - 2, pal[3]); }
    if (ss < 3 && v % 3 === 0) [tips[3], tips[tips.length - 4]].forEach(tp => { if (!tp) return; const [x, y] = tp; P(x, y - 1, ss === 2 ? '#c86a20' : '#f08a28'); P(x + 1, y - 1, ss === 2 ? '#c86a20' : '#f08a28'); P(x, y - 2, '#ffc040'); });   // florzinhas
    if (ss < 3 && v % 3 === 1) { const tp = tips[Math.floor(tips.length / 2)]; if (tp) { P(tp[0], tp[1] - 1, '#d8c070'); P(tp[0], tp[1] - 2, '#e8d488'); P(tp[0], tp[1] - 3, '#d8c070'); } }   // sementes
    return (CAPIM[key] = c);
  }
  function debris(ctx, x, y, k, seed = 0) {
    const v = Math.floor(seed * 4) % 4;
    const ss = k === 'branch' || k === 'weed' ? SEASON : 0;
    const img = dsprite(k + v + ':' + ss, 20, 20, P => {
      const Q = (a, b, w, h, c) => P(a + 2, b + 2, w, h, c);
      if (k === 'stone') stoneShape(Q, 8, 14, [12, 13, 11, 12][v], [9, 8, 10, 9][v], v);
      else if (k === 'branch') branchShape(Q, v, ss);
      else if (k === 'stump') stumpShape(Q, 8, 15, [9, 10, 9, 11][v], [9, 8, 10, 8][v], v);
      else if (k === 'weed') weedShape(Q, v, ss);
    });
    ctx.drawImage(img, x - 2, y - 2);
  }
  function rock(ctx, x, y, i = 0) { const v = i % 4; ctx.drawImage(dsprite('rock' + v, 30, 22, P => stoneShape(P, 15, 20, [18, 20, 17, 19][v], [12, 11, 13, 12][v], v + 4, true)), x - 15, y - 19); }
  function forage(ctx, x, y, id) {
    const P = (a, b, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x + a, y + b, w, h); };
    if (id === 'amora') { P(-6, -8, 12, 8, '#267a3a'); P(-4, -11, 8, 4, '#3f9648'); [[-4, -6], [1, -8], [3, -4], [-2, -3]].forEach(([a, b]) => P(a, b, 2, 2, '#6a2a8a')); }
    if (id === 'cogumelo') { P(-1, -4, 3, 4, '#f0e6cc'); P(-5, -9, 11, 5, OUT); P(-4, -8, 9, 3, '#c8483a'); P(-2, -8, 2, 1, '#fff'); P(2, -7, 2, 1, '#fff'); }
    if (id === 'flor') { P(0, -6, 1, 6, '#2f8a40'); P(-2, -10, 5, 5, '#ffe066'); P(-1, -9, 3, 3, '#f0a020'); P(-5, -4, 1, 4, '#2f8a40'); P(-7, -7, 4, 4, '#ffe066'); P(4, -3, 1, 3, '#2f8a40'); P(3, -6, 4, 4, '#ffe066'); }
    if (id === 'chapeu_tome') { P(-6, -4, 12, 3, OUT); P(-5, -3, 10, 2, '#5a4a32'); P(-4, -8, 8, 5, OUT); P(-3, -7, 6, 4, '#7a6a4a'); }
  }

  /* ================= desenho ================= */
  /* v: { map, cam, t, state, actors, hens, cursor, markers, tint, floats } */
  function render(ctx, v) {
    const { map, cam, t, state: S } = v;
    if (cam.x < 0 || cam.y < 0 || map.w < VW || map.h < VH || cam.y + VH > map.h) { ctx.fillStyle = map.id === 'fora' ? '#2f6a2c' : '#1c1420'; ctx.fillRect(0, 0, VW, VH); }
    ctx.drawImage(map.bg, -cam.x, -cam.y);
    g = ctx;
    ctx.save(); ctx.translate(-cam.x, -cam.y);
    const seen = (x, y, pad = 34) => x > cam.x - pad && x < cam.x + VW + pad && y > cam.y - pad && y < cam.y + VH + pad + 24;
    const list = [];
    map.sprites.forEach(s => { if (s.x < cam.x + VW + 8 && s.x + s.img.width > cam.x - 8 && s.y < cam.y + VH + 8 && s.y + s.img.height > cam.y - 8) list.push({ base: s.base, img: s.img, x: s.x, y: s.y }); });
    const put = (f, x, y) => list.push({ base: y, img: f.img, x: x - f.ox, y: y - f.h + 4 });
    /* deslocamento de tremor do objeto que acabou de levar um golpe */
    const shk = key => (v.shake && v.shake.key === key && t - v.shake.t0 < 240 ? Math.round(Math.sin((t - v.shake.t0) / 20) * 2) : 0);

    if (map.id === 'fora') {
      const ph = Math.floor(t / 280);
      map.waters.forEach((w, k) => { for (let i = 0; i < 9; i++) { const y = w.cy - w.ry + 4 + (i * 7 + ph + k * 3) % (w.ry * 2 - 8), hw = w.rx * Math.sqrt(1 - ((y - w.cy) ** 2) / (w.ry * w.ry)) - 8; if (hw > 4 && i % 3 !== 2) R(w.cx - hw + (i * 13 + ph * 2) % (hw * 2), y, 2 + i % 2, 1, i % 2 ? '#bfe9f0' : '#8fd2e0'); } });
      (map.streams || []).forEach(st => { const n = st.pts.length; for (let i = 0; i < n; i += 23) { const j = Math.floor(i + t / 70) % n, [x, y] = st.pts[j]; R(x - 2 + (i % 3) - 1, y - 1 + (i % 2) * 2, 3, 1, i % 2 ? '#e4fbf6' : '#9fe0e4'); } });
      for (let i = 0; i < 4; i++) { const k = ((t / 900) + i / 4) % 1; ctx.fillStyle = `rgba(255,255,255,${0.8 * (1 - k)})`; ctx.fillRect(Math.round(628 + Math.sin(k * 5 + i) * 5), Math.round(126 - k * 8), 2, 2); }
      // terra, plantas e entulho da fazenda
      const tiles = S.farm.tiles;
      for (const key in tiles) {
        const o = tiles[key], q = tilePos(+key); if (!seen(q.x + 8, q.y + 8)) continue;
        if (o.k === 'soil') {
          const key0 = +key, col = key0 % GRID.cols, isSoil = n => !!(tiles[n] && tiles[n].k === 'soil');
          const mask = (key0 >= GRID.cols && isSoil(key0 - GRID.cols) ? 1 : 0) | (col < GRID.cols - 1 && isSoil(key0 + 1) ? 2 : 0) | (isSoil(key0 + GRID.cols) ? 4 : 0) | (col > 0 && isSoil(key0 - 1) ? 8 : 0);
          ctx.drawImage(soilImg(!!o.w, mask, Math.floor(hsh(key0, 3, 91) * 4)), q.x - 1, q.y - 1);
          if (o.crop) { if (CROPS[o.crop].stages) staged(ctx, q.x, q.y, o); else { const st = cropState(o); crop(ctx, q.x, q.y, o.crop, st.ripe ? 3 : !o.g ? 0 : o.g * 2 > CROPS[o.crop].days ? 2 : 1); } }
        } else if (o.k === 'tree') put(fruitTree(o.sp, o.age >= TREES[o.sp].grow ? 2 : o.age * 2 >= TREES[o.sp].grow ? 1 : 0, o.fruit), q.x + 8, q.y + 13);
        else if (o.k === 'weed') {                                        // capim alto: entra na ordenação (folhas da frente cobrem os pés)
          const k0 = +key, col = k0 % GRID.cols, isW = n => !!(tiles[n] && tiles[n].k === 'weed');
          const mask = (k0 >= GRID.cols && isW(k0 - GRID.cols) ? 1 : 0) | (col < GRID.cols - 1 && isW(k0 + 1) ? 2 : 0) | (isW(k0 + GRID.cols) ? 4 : 0) | (col > 0 && isW(k0 - 1) ? 8 : 0);
          const v = Math.floor(hsh(k0, 7, 81) * 4) % 4, f = [0, 1, 0, -1][Math.floor(t / 560 + hsh(k0, 1, 500) * 4) % 4], gx = q.x + shk('f' + key), gy = q.y;
          list.push({ base: q.y + 14, fn: () => ctx.drawImage(capim(v, mask, f), gx - 6, gy - 15) });
        }
        else debris(ctx, q.x + shk('f' + key), q.y, o.k, hsh(+key, 7, 81));
      }
      // bosque
      const cleared = S.nature.cleared || {};
      NTREES.forEach(([x, y], i) => { if (!cleared[i] && seen(x, y, 50)) put(S.nature.trees[i] ? stump(i) : wildTree(i), x + shk((S.nature.trees[i] ? 's' : 't') + i), y); });
      NROCKS.forEach(([x, y], i) => { if (!S.nature.rocks[i] && seen(x, y)) rock(ctx, x + shk('r' + i), y, i); });
      FORAGE.forEach(([x, y], i) => { if (S.nature.forage[i] && seen(x, y)) forage(ctx, x, y, S.nature.forage[i]); });
      if (S.nature.hat) forage(ctx, SPOT.hat[0], SPOT.hat[1], 'chapeu_tome');
      // banco da praça: quebrado até a missão do Seu Honório
      const bx = SPOT.bench[0], by = SPOT.bench[1];
      if (S.world.banco) { box(bx - 13, by - 8, 26, 5, '#c89858'); R(bx - 13, by - 8, 26, 1, '#e8c888'); R(bx - 11, by - 3, 3, 4, '#6a4426'); R(bx + 8, by - 3, 3, 4, '#6a4426'); box(bx - 13, by - 14, 26, 3, '#b88448'); }
      else { box(bx - 13, by - 7, 14, 4, '#8a6a48'); R(bx - 11, by - 3, 3, 4, '#5a4030'); R(bx + 2, by - 4, 11, 3, OUT); R(bx + 3, by - 3, 9, 2, '#7a5a3a'); R(bx + 9, by - 1, 3, 2, '#5a4030'); }
      // boneco de treino
      const dk = v.dummyHit ? Math.max(0, 1 - (t - v.dummyHit) / 350) : 0, df = dummyFig();
      list.push({ base: SPOT.dummy[1], img: df.img, x: SPOT.dummy[0] - df.ox + Math.round(Math.sin(t / 30) * 3 * dk), y: SPOT.dummy[1] - df.h + 4 });
      (v.seasonal || []).forEach(o => { if (seen(o.x, o.y)) seasonalItem(ctx, o.x, o.y, o.id, t); });
      if (v.debugSpawns) map.spawns.forEach(([x, y]) => { ctx.fillStyle = 'rgba(255,0,0,.75)'; ctx.fillRect(x - 2, y - 2, 4, 4); });
      (v.hens || []).forEach(h => list.push({ base: h.y, hen: h }));
      if (v.pet) list.push({ base: v.pet.y, pet: v.pet });
      // fumaça da chaminé
      for (let i = 0; i < 4; i++) { const k = ((t / 1400) + i / 4) % 1; ctx.fillStyle = `rgba(230,230,236,${0.7 * (1 - k)})`; ctx.fillRect(Math.round(131 + Math.sin(k * 6 + i) * 3 + k * 6), Math.round(40 - k * 22), 3, 3); }
      (map.smokes || []).forEach(([sx, sy], n) => { if (!seen(sx, sy, 40)) return; for (let i = 0; i < 3; i++) { const k = ((t / 1600) + i / 3 + n * 0.17) % 1; ctx.fillStyle = `rgba(230,230,236,${0.6 * (1 - k)})`; ctx.fillRect(Math.round(sx + Math.sin(k * 6 + i + n) * 3 + k * 5), Math.round(sy - k * 20), 3, 3); } });
    }
    if (map.id === 'montanha') {
      const L = S.lucio || {};
      tent(ctx, !!L.tentUp, t, v.repair || 0);
      fireFx(ctx, t, S.time >= 1020 || S.time < 360);
      (SERRA.forage).forEach(([x, y], i) => { const id = S.nature.mforage && S.nature.mforage[i]; if (id) forage(ctx, x, y, id); });
      if (v.keepsake) whistle(ctx, SERRA.keepsake[0], SERRA.keepsake[1]);
      const ph = Math.floor(t / 280);
      map.waters.forEach(w => { for (let i = 0; i < 5; i++) { const y = w.cy - w.ry + 4 + (i * 7 + ph) % (w.ry * 2 - 8), hw = w.rx * Math.sqrt(1 - ((y - w.cy) ** 2) / (w.ry * w.ry)) - 8; if (hw > 4) R(w.cx - hw + (i * 13 + ph * 2) % (hw * 2), y, 3, 1, '#bfe4ff'); } });
    }
    if (map.id === 'fora' && S.iara && S.iara.ev3 === 'seek') {           // florzinha entre as pedras (acontecimento de 3 corações)
      const [fx, fy] = [IARA.detail.x, IARA.detail.y]; ctx.fillStyle = '#2f7a36'; ctx.fillRect(fx, fy - 4, 1, 4);
      ctx.fillStyle = '#b48af0'; [[-1, -6], [1, -6], [0, -7], [0, -5]].forEach(([dx, dy]) => ctx.fillRect(fx + dx, fy + dy, 1, 1)); ctx.fillStyle = '#f2c84a'; ctx.fillRect(fx, fy - 6, 1, 1);
      if (Math.floor(t / 700) % 4 === 0) { ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(fx + 2, fy - 8, 1, 1); }
    }
    if (map.id === 'casa' && S.house && S.house.quadro) {                 // quadro da fonte pendurado
      ctx.fillStyle = OUT; ctx.fillRect(157, 15, 28, 22); ctx.fillStyle = '#b8783c'; ctx.fillRect(158, 16, 26, 20); ctx.drawImage(painting('fonte', S.house.quadro.si || 0), 0, 0, 48, 36, 160, 18, 22, 16);
    }
    if (map.id === 'galinheiro') {
      // ração no cocho (até 6 porções aparecem) e ovos nos ninhos
      const f = Math.min(6, S.coop.feed || 0);
      if (f) { R(22, 83, Math.round(52 * f / 6), 5, '#e8d070'); for (let i = 0; i < f * 4; i++) R(23 + (i * 7) % Math.max(4, Math.round(50 * f / 6)), 83 + (i * 3) % 4, 1, 1, '#c8a040'); }
      const hens = (S.coop.hens || []).length;
      for (let i = 0; i < Math.min(3, S.coop.eggs || 0); i++) { const nx = 166 + i * 29; blob(nx, 70, 3, OUT, 1.2); blob(nx, 70, 2, '#fff8e8', 1.3); R(nx - 1, 68, 1, 1, '#ffffff'); }
      if (hens && !(S.coop.eggs > 0)) hen(ctx, 166, 76, 0, false, false, Math.floor(t / 600) % 2);
    }

    v.actors.forEach(a => list.push({ base: a.y, a }));
    list.sort((p, q) => p.base - q.base);
    list.forEach(e => {
      if (e.img) return ctx.drawImage(e.img, Math.round(e.x), Math.round(e.y));
      if (e.fn) return e.fn();
      if (e.pet) return pet(ctx, e.pet, t);
      if (e.hen) { const h = e.hen; hen(ctx, Math.round(h.x), Math.round(h.y), h.kind, h.flip, h.peck, h.moving ? Math.floor(t / 150) % 2 : 0); if (h.heart) heart(ctx, Math.round(h.x) - 3, Math.round(h.y) - 20 - Math.floor(t / 250) % 2); return; }
      const a = e.a, ax = Math.round(a.x), ay = Math.round(a.y);
      ctx.fillStyle = 'rgba(20,30,20,.28)'; ctx.fillRect(ax + OX(-6), ay - 2, OX(6) - OX(-6), 3);   // sombra no tamanho do personagem do mundo
      const tk = a.tool ? Math.min(1, (t - a.tool.t0) / 280) : -1, using = tk >= 0 && tk < 1;
      if (using && a.dir === 'up') toolSwing(ctx, a, ax, ay, tk);
      const fy = ay + (a.hop || 0) + (using && tk > 0.4 ? 1 : 0) + (a.fish ? a.fish.lean || 0 : 0), fr = a.moving ? Sprites.walk(t) : (using ? 1 : 0);
      if (!(a.art && typeof CharArt !== 'undefined' && CharArt.draw(ctx, a.art, ax, fy, fr, a.dir || 'down'))) Sprites.drawWorld(ctx, a.look, ax, fy, fr, a.dir || 'down');   // arte própria (Caleb) ou sprite comum
      if (using && a.dir !== 'up') toolSwing(ctx, a, ax, ay, tk);
      if (a.fish) fishRod(ctx, a);
      if (a.act) actFx(ctx, a, t);
      if (a.fish && a.fish.hold) liftFish(ctx, a, t);
      if (a.eat) eating(ctx, a, t);
    });
    v.actors.forEach(a => { if (a.fish) fishLine(ctx, a.fish, t); });
    v.actors.forEach(a => { if (a.bubble) bubble(Math.round(a.x) - 7, Math.round(a.y) + OY(-46), a.bubble === '...' ? '' : '!', t); if (a.heart) heart(ctx, Math.round(a.x) - 3, Math.round(a.y) + OY(-42) - Math.floor(t / 300) % 2); });
    if (v.cursor) { const c = v.cursor, b = Math.floor(t / 350) % 2; ctx.fillStyle = c.far ? 'rgba(255,255,255,.45)' : b ? '#ffffff' : '#ffd75e'; [[0, 0, 5, 1], [0, 0, 1, 5], [c.w - 5, 0, 5, 1], [c.w - 1, 0, 1, 5], [0, c.h - 1, 5, 1], [0, c.h - 5, 1, 5], [c.w - 5, c.h - 1, 5, 1], [c.w - 1, c.h - 5, 1, 5]].forEach(([a, e, w, h]) => ctx.fillRect(c.x + a, c.y + e, w, h)); }
    (v.bars || []).forEach(b => { const x = Math.round(b.x) - 8, y = Math.round(b.y); ctx.fillStyle = OUT; ctx.fillRect(x - 1, y - 1, 18, 4); ctx.fillStyle = '#5a1a1a'; ctx.fillRect(x, y, 16, 2); ctx.fillStyle = b.frac > 0.5 ? '#8fe88f' : b.frac > 0.25 ? '#ffd75e' : '#ff7b5a'; ctx.fillRect(x, y, Math.max(1, Math.round(16 * b.frac)), 2); });
    (v.impacts || []).forEach(f => impact(ctx, f, t));
    // luz do dia e da noite: o cenário escurece aos poucos; janelas, postes e fogueiras acendem
    const L = v.light;
    if (L && L.glow > 0) (map.lights || []).forEach(l => { if (l.kind === 'win') { ctx.fillStyle = `rgba(255,214,130,${L.glow})`; ctx.fillRect(l.x, l.y, l.w, l.h); } });
    if (L && L.a > 0.003) { ctx.restore(); applyLight(ctx, map, cam, L, t); ctx.save(); ctx.translate(-cam.x, -cam.y); }
    (v.floats || []).forEach(f => { const k = (t - f.t0) / 700; if (k < 0 || k > 1) return; ctx.globalAlpha = 1 - k; ctx.drawImage(icon(f.icon), Math.round(f.x) - 8, Math.round(f.y - 24 - k * 14)); ctx.globalAlpha = 1; });
    ctx.restore();
  }
  /* Camada de luz: cor do céu por cima do cenário, com "furos" de luz em volta de
     janelas, postes e fogueiras e um brilho quente aditivo. Anéis em degraus para
     combinar com o pixel art. Não afeta HUD, textos e menus (que são HTML). */
  let lightCanvas = null;
  function applyLight(ctx, map, cam, L, t) {
    if (!lightCanvas) lightCanvas = document.createElement('canvas');
    const lc = lightCanvas; if (lc.width !== VW || lc.height !== VH) { lc.width = VW; lc.height = VH; }
    const g2 = lc.getContext('2d');
    g2.globalCompositeOperation = 'source-over'; g2.clearRect(0, 0, VW, VH);
    g2.fillStyle = `rgba(${L.r},${L.g},${L.b},${L.a})`; g2.fillRect(0, 0, VW, VH);
    const lights = (map.lights || []).filter(l => l.x > cam.x - 80 && l.x < cam.x + VW + 80 && l.y > cam.y - 80 && l.y < cam.y + VH + 80);
    if (L.glow > 0) {
      g2.globalCompositeOperation = 'destination-out';
      const flick = 1 + Math.sin(t / 130) * 0.04;
      lights.forEach(l => {
        const x = Math.round(l.x - cam.x), y = Math.round(l.y - cam.y);
        if (l.kind === 'win') { g2.fillStyle = `rgba(0,0,0,${0.9 * L.glow})`; g2.fillRect(x, y, l.w, l.h); g2.fillStyle = `rgba(0,0,0,${0.25 * L.glow})`; g2.fillRect(x - 6, y - 4, l.w + 12, l.h + 14); return; }
        const r = l.r * (l.kind === 'fire' ? flick : 1);
        for (let k = 3; k >= 1; k--) { g2.fillStyle = `rgba(0,0,0,${0.32 * L.glow})`; g2.beginPath(); g2.arc(x, y + (l.kind === 'lamp' ? 10 : 0), Math.round(r * k / 3), 0, Math.PI * 2); g2.fill(); }
      });
    }
    ctx.drawImage(lc, 0, 0);
    if (L.glow > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      lights.forEach(l => {
        const x = Math.round(l.x - cam.x), y = Math.round(l.y - cam.y);
        if (l.kind === 'win') { ctx.fillStyle = `rgba(255,190,90,${0.35 * L.glow})`; ctx.fillRect(x, y, l.w, l.h); return; }
        const warm = l.kind === 'fire' ? [255, 120, 40] : [255, 190, 90];
        for (let k = 2; k >= 1; k--) { ctx.fillStyle = `rgba(${warm[0]},${warm[1]},${warm[2]},${0.07 * L.glow})`; ctx.beginPath(); ctx.arc(x, y + (l.kind === 'lamp' ? 8 : 0), Math.round(l.r * 0.55 * k / 2), 0, Math.PI * 2); ctx.fill(); }
      });
      ctx.restore();
    }
  }
  /* Coletáveis sazonais no chão. */
  function seasonalItem(ctx, x, y, id, t) {
    const P = (a, b, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x + a, y + b, w, h); };
    ctx.fillStyle = 'rgba(20,30,20,.22)'; ctx.fillRect(x - 5, y - 1, 10, 2);
    if (id === 'amora') return forage(ctx, x, y, 'amora');
    if (id === 'narciso') { P(0, -7, 1, 7, '#2f7028'); P(-2, -4, 2, 1, '#3f9648'); P(-3, -12, 7, 5, OUT); P(-2, -11, 5, 3, '#f8f0a0'); P(-1, -12, 3, 1, '#f8f0a0'); P(-1, -11, 3, 3, '#f0a020'); P(0, -10, 1, 1, '#c86a10'); P(-2, -9, 5, 1, '#f8f0a0'); }
    if (id === 'ervilha_cheiro') { P(0, -6, 1, 6, '#2f7028'); P(1, -9, 1, 4, '#3f9648'); P(-4, -11, 4, 4, OUT); P(-3, -10, 2, 2, '#f090c0'); P(1, -12, 4, 4, OUT); P(2, -11, 2, 2, '#c890f0'); P(-1, -14, 3, 3, OUT); P(0, -13, 1, 1, '#ffb8e0'); P(-3, -10, 1, 1, '#ffd8ec'); }
    if (id === 'acafrao') { P(0, -5, 1, 5, '#3a7a3a'); P(-3, -11, 7, 7, OUT); P(-2, -10, 5, 5, '#8a5ad9'); P(-1, -10, 3, 1, '#b48af0'); P(0, -9, 1, 3, '#f0a020'); P(-2, -6, 5, 1, '#6a3ab8'); P(-4, -1, 9, 1, '#f4f8fc'); }
    if (id === 'azevinho') { P(-5, -6, 10, 6, OUT); P(-4, -5, 4, 4, '#1f6a34'); P(1, -5, 4, 4, '#2a7e40'); P(-4, -5, 1, 1, '#4fa060'); P(2, -6, 1, 1, '#1f6a34'); P(-1, -8, 3, 3, OUT); P(-1, -7, 1, 1, '#e03a3a'); P(0, -8, 1, 1, '#ff6a5a'); P(1, -7, 1, 1, '#c02a2a'); }
    if (id === 'fruta_cristal') { const s = Math.floor(t / 400) % 2; P(-4, -9, 9, 9, OUT); P(-3, -8, 7, 7, '#a8e0f4'); P(-2, -8, 3, 3, '#e8fbff'); P(1, -4, 2, 3, '#6ab4d8'); P(0, -11, 1, 3, '#5a8a5a'); P(1, -11, 2, 1, '#6aa86a'); if (s) P(-1, -7, 1, 1, '#ffffff'); }
  }
  /* A ferramenta descreve um arco à frente do personagem. */
  function toolSwing(ctx, a, x, y, k) {
    const d = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[a.dir] || [0, 1];
    const lift = Math.sin(k * Math.PI) * 9, reach = 4 + k * 9;
    const tx = x + d[0] * reach - 8 + (d[1] ? (k - 0.5) * 8 : 0), ty = y + OY(-20) - lift + (d[1] > 0 ? 6 + k * 6 : d[1] < 0 ? -6 - k * 4 : k * 8);
    ctx.save();
    if (a.dir === 'left') { ctx.translate(Math.round(tx) + 16, Math.round(ty)); ctx.scale(-1, 1); ctx.drawImage(icon(a.tool.id), 0, 0); }
    else ctx.drawImage(icon(a.tool.id), Math.round(tx), Math.round(ty));
    ctx.restore();
    if (a.tool.id === 'regador' && k > 0.3) { ctx.fillStyle = '#8fd0f0'; for (let i = 0; i < 4; i++) ctx.fillRect(Math.round(x + d[0] * 14 - 4 + i * 3), Math.round(y + OY(-8) + d[1] * 10 + ((k * 20 + i * 5) % 8)), 1, 2); }
    if (a.tool.id === 'espada' && k > 0.2 && k < 0.8) { ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillRect(Math.round(x + d[0] * 14 - 6), Math.round(y - 12 + d[1] * 12), 12, 1); ctx.fillRect(Math.round(x + d[0] * 16 - 3), Math.round(y - 15 + d[1] * 12), 6, 1); }
  }
  /* ---------- pesca ----------
     f (montado pelo jogo): grip/tip = mão e ponta da vara; bob = boia [x, y] ou null;
     bobMode: 'fly' | 'float' | 'nibble' | 'sink' | 'reel'; slack (0..1) = quanto a linha cai;
     rings = respingos [{ x, y, t0 }]; charge = força (0..1) ou null; alert = fisgada (0..1 do tempo que resta);
     hold = peixe erguido; jump = peixe pulando { x, y, id }. */
  const skinOf = look => { const s = Sprites.SKINS.find(k => k.id === look.skin) || Sprites.SKINS[0]; return s.c; };
  const ROD_COL = { vara: ['#5a3a1e', '#c8902a', '#e8c060', '#8a5a1e'], vara_fibra: ['#c89a62', '#8a2a3a', '#b8b8c8', '#5a1a26'] };
  function fishRod(ctx, a) {                        // a vara verga (curva) conforme a força na linha
    const f = a.fish; if (!f.tip || f.hold) return;
    const [gx, gy] = f.grip, [tx, ty] = f.tip, len = Math.hypot(tx - gx, ty - gy) || 1, n = Math.max(2, Math.ceil(len * 1.2));
    let px = -(ty - gy) / len, py = (tx - gx) / len; if (py < 0) { px = -px; py = -py; }          // vergar para baixo
    const b = (f.bend || 0) * len * 0.35, cx = (gx + tx) / 2 + px * b, cy = (gy + ty) / 2 + py * b;
    const at = k => [(1 - k) * (1 - k) * gx + 2 * (1 - k) * k * cx + k * k * tx, (1 - k) * (1 - k) * gy + 2 * (1 - k) * k * cy + k * k * ty];
    const C = ROD_COL[f.rod] || ROD_COL.vara;
    for (let i = 0; i <= n; i++) { const k = i / n, [x, y] = at(k); ctx.fillStyle = OUT; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, k < 0.45 ? 3 : 2, k < 0.45 ? 3 : 2); }
    for (let i = 0; i <= n; i++) { const k = i / n, [x, y] = at(k); ctx.fillStyle = k < 0.25 ? C[0] : f.rod === 'vara' && i % 5 === 4 ? C[3] : k < 0.65 ? C[1] : C[2]; ctx.fillRect(Math.round(x), Math.round(y), k < 0.45 ? 2 : 1, 1); }
    const [rx, ry] = at(0.18);                       // molinete
    ctx.fillStyle = OUT; ctx.fillRect(Math.round(rx) - 2, Math.round(ry), 4, 4); ctx.fillStyle = f.rod === 'vara_fibra' ? '#d8d8e8' : '#9a9aa8'; ctx.fillRect(Math.round(rx) - 1, Math.round(ry) + 1, 2, 2);
    f.tipBent = at(1);
    if (a.dir === 'up') return;                     // de costas, a mão fica escondida pelo corpo
    const [sk, sd] = skinOf(a.look); ctx.fillStyle = OUT; ctx.fillRect(Math.round(gx) - 2, Math.round(gy) - 1, 4, 4); ctx.fillStyle = sk; ctx.fillRect(Math.round(gx) - 1, Math.round(gy), 2, 2); ctx.fillStyle = sd; ctx.fillRect(Math.round(gx) - 1, Math.round(gy) + 1, 2, 1);
  }
  /* Comendo: o alimento perto da boca, seguro com as duas mãos, encolhe a cada mordida; migalhas caem. */
  function eating(ctx, a, t) {
    const x = Math.round(a.x), y = Math.round(a.y), k = a.eat.k, bites = Math.min(3, Math.floor(k * 4)), [sk, sd] = skinOf(a.look);
    const w = 8 - bites * 2, ix = x - 4, iy = y + OY(-22) + (Math.floor(k * 8) % 2);
    if (w > 0) { ctx.drawImage(icon(a.eat.id), 0, 0, w * 2, 16, ix, iy, w, 8); for (let i = 0; i < bites; i++) { ctx.fillStyle = OUT; ctx.fillRect(ix + w - 1, iy + 2 + i * 2, 1, 1); } }
    [[OX(-7), OY(-19)], [OX(5), OY(-19)]].forEach(([dx, dy]) => { ctx.fillStyle = OUT; ctx.fillRect(x + dx - 1, y + dy - 1, 4, 4); ctx.fillStyle = sk; ctx.fillRect(x + dx, y + dy, 2, 2); ctx.fillStyle = sd; ctx.fillRect(x + dx, y + dy + 1, 2, 1); });
    for (let i = 0; i < bites * 2; i++) { const s2 = (i * 37) % 7, fy = y + OY(-14) + ((k * 900 + i * 53) % 12); ctx.fillStyle = i % 2 ? '#f4e8c8' : '#d8b878'; ctx.fillRect(x - 4 + s2 + (i % 3), Math.round(fy), 1, 1); }
    if (k > 0.85) { ctx.fillStyle = '#8fe88f'; ctx.fillRect(x + 8, y + OY(-34), 1, 3); ctx.fillRect(x + 7, y + OY(-33), 3, 1); }
  }
  /* O que um morador está fazendo: cavalete pintando (mão mexe o pincel devagar), caderno de
     desenho, xícara de chá com vapor ou livro. Discreto: não muda a câmera nem abre nada. */
  function actFx(ctx, a, t) {
    // objetos na mão acompanham o tamanho do personagem do mundo (as mãos ficam um pouco mais baixas)
    const x = Math.round(a.x), y = Math.round(a.y) + OY(-15) + 15, P = (px, py, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(px, py, w, h); }, slow = Math.floor(t / 450) % 2;
    if (a.act === 'paint') {
      const s = a.dir === 'right' ? 1 : -1, ex = x + s * 13, yd = y; { const y = Math.round(a.y);    // o cavalete fica no chão; só a mão segue o personagem
      P(ex - 5, y - 6, 1, 7, '#5a3a22'); P(ex + 4, y - 6, 1, 7, '#5a3a22'); P(ex, y - 20, 1, 21, '#6a4426');
      P(ex - 7, y - 23, 15, 13, OUT); P(ex - 6, y - 22, 13, 11, '#f8f4ea'); P(ex - 5, y - 21, 6, 4, '#9ac8e8'); P(ex - 1, y - 18, 7, 4, '#78b04c'); P(ex - 4, y - 16, 4, 3, '#a8a8b8'); P(ex + 2, y - 21, 3, 2, '#f2d24a');
      }
      const hx = x + s * (OX(5) + slow), hy = yd - 15 + slow;            // mão com o pincel, indo e voltando
      P(hx, hy, 1, 1, '#8a5a2a'); P(hx + s, hy - 1, 1, 1, '#8a5a2a'); P(hx + s * 2, hy - 2, 1, 1, ['#e04a5a', '#3f86d0'][Math.floor(t / 2400) % 2]);
    } else if (a.act === 'brush') {                                   // em casa, pintando pelos esboços: só o pincel na mão
      const s = a.dir === 'right' ? 1 : -1, hx = x + s * (5 + slow), hy = y - 15 + slow;
      P(hx, hy, 1, 1, '#8a5a2a'); P(hx + s, hy - 1, 1, 1, '#8a5a2a'); P(hx + s * 2, hy - 2, 1, 1, '#3f86d0');
    } else if (a.act === 'draw') {
      P(x - 4, y - 16, 8, 6, OUT); P(x - 3, y - 15, 6, 4, '#f8f4ea'); P(x - 2, y - 14, 3, 1, '#a8a8b8'); P(x + (slow ? 1 : -1), y - 13, 1, 1, '#5a5a6a'); P(x + 3, y - 15 + slow, 1, 3, '#e0a23a');
    } else if (a.act === 'tea') {
      P(x - 2, y - 15, 5, 4, OUT); P(x - 1, y - 14, 3, 2, '#f0e8f4'); P(x + 2, y - 14, 1, 1, '#f0e8f4');
      ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(x - (slow ? 0 : 1), y - 18, 1, 2); ctx.fillRect(x + (slow ? 1 : 0), y - 20, 1, 2);
    } else if (a.act === 'notebook') {                               // Caleb no notebook: aberto sobre a mesinha (à direita dele), fones e notinhas
      const yy = Math.round(a.y); P(114, 63, 9, 7, '#2a2a34'); P(115, 64, 7, 5, slow ? '#7ab0d8' : '#8ac0e0'); P(116, 65, 3, 1, '#d8ecf8'); P(113, 70, 11, 2, '#5a5a6a'); P(114, 70, 9, 1, '#8a8a98');
      P(x - 6, yy - 23, 2, 3, '#2a2a34'); if (slow) { P(x + 3, yy - 35, 1, 3, '#3a2a40'); P(x + 3, yy - 36, 2, 1, '#3a2a40'); P(x + 2, yy - 33, 1, 1, '#3a2a40'); }
    } else if (a.act === 'music') {                                  // ouvindo música: fones e uma notinha subindo
      const yy = Math.round(a.y), k = Math.floor(t / 600) % 3; P(x - 7, yy - 23, 2, 3, '#2a2a34'); P(x + 5, yy - 23, 2, 3, '#2a2a34');
      P(x + 4 + k, yy - 33 - k * 2, 1, 3, '#3a2a40'); P(x + 4 + k, yy - 34 - k * 2, 2, 1, '#3a2a40'); P(x + 3 + k, yy - 31 - k * 2, 1, 1, '#3a2a40');
    } else if (a.act === 'boxes') {                                  // ajudando com as caixas
      P(x - 5, y - 17, 10, 7, OUT); P(x - 4, y - 16, 8, 5, '#c89a62'); P(x - 4, y - 16, 8, 1, '#e0b878'); P(x - 1, y - 16, 2, 5, '#a87a48');
    } else if (a.act === 'lunch') {                                  // almoçando com a avó: pratinho na mão
      P(x - 4, y - 14, 8, 2, '#f0ecf4'); P(x - 3, y - 15, 3, 1, '#e8a050'); P(x + 1, y - 15, 2, 1, '#78b04c');
    } else if (a.act === 'read' || a.act === 'study') {
      P(x - 4, y - 15, 8, 5, OUT); P(x - 3, y - 14, 3, 3, a.act === 'study' ? '#3f86d0' : '#c8483a'); P(x + 1, y - 14, 3, 3, a.act === 'study' ? '#3f86d0' : '#c8483a'); P(x, y - 14, 1, 3, '#f8f4ea');
    }
  }
  /* Pinturas da fonte feitas por Iara (48x36), uma por estação, e o esboço do detalhe da praça. */
  const PAINT_SKY = [['#f0d8e8', '#c8e4f4'], ['#8ad0f0', '#bfe8f8'], ['#f0c890', '#f4dcb0'], ['#d8e2ee', '#eef2f6']];
  const paintCache = {};
  function painting(kind, si = 0) {
    const key = kind + si; if (paintCache[key]) return paintCache[key];
    const c = document.createElement('canvas'); c.width = 48; c.height = 36; const g2 = c.getContext('2d');
    const P = (x, y, w, h, col) => { g2.fillStyle = col; g2.fillRect(x, y, w, h); };
    if (kind === 'esboco') {                                          // esboço a lápis: florzinha entre as pedras
      P(0, 0, 48, 36, '#f4eedc'); for (let y = 6; y < 36; y += 6) P(0, y, 48, 1, '#e4dcc4');
      [[8, 22, 9, 6], [30, 24, 10, 6], [18, 28, 12, 5], [2, 30, 8, 5], [38, 30, 9, 5]].forEach(([x, y, w, h]) => { P(x, y, w, 1, '#6a6a72'); P(x, y + h, w, 1, '#6a6a72'); P(x - 1, y + 1, 1, h - 1, '#6a6a72'); P(x + w, y + 1, 1, h - 1, '#6a6a72'); for (let i = 1; i < w; i += 2) P(x + i, y + h - 1, 1, 1, '#a8a8b0'); });
      P(23, 14, 1, 13, '#6a6a72'); P(21, 18, 2, 1, '#6a6a72'); P(24, 20, 2, 1, '#6a6a72');
      [[22, 10], [25, 10], [23, 8], [23, 12]].forEach(([x, y]) => P(x, y, 2, 2, '#b48af0')); P(23, 10, 2, 2, '#f2c84a');
      return (paintCache[key] = c);
    }
    const [s1, s2] = PAINT_SKY[si];
    for (let y = 0; y < 16; y++) P(0, y, 48, 1, y < 8 ? s1 : s2);
    for (let i = 0; i < 40; i++) P((i * 13) % 48, (i * 7) % 15, 2, 1, i % 2 ? s2 : s1);      // pinceladas no céu
    const TREE = [['#f4b8d0', '#58a838'], ['#2f8a40', '#3f9a52'], ['#e07a2a', '#c8483a'], ['#8a8a96', '#f4f8fc']][si];
    [[6, 13], [15, 11], [36, 12], [44, 14]].forEach(([x, y], i) => { P(x - 1, y, 2, 6, '#6a4426'); P(x - 5, y - 5, 10, 6, TREE[i % 2]); P(x - 3, y - 7, 6, 3, TREE[(i + 1) % 2]); });
    P(0, 18, 48, 18, si === 3 ? '#eef2f6' : '#d8c8a0'); for (let i = 0; i < 30; i++) P((i * 11) % 48, 19 + (i * 5) % 16, 3, 1, si === 3 ? '#d4dce8' : '#c0ae84');   // pedras da praça
    P(12, 22, 24, 9, '#7a7a88'); P(13, 23, 22, 7, '#a8a8b8'); P(15, 24, 18, 4, si === 3 ? '#cfe8f4' : '#4a9ad8'); P(16, 24, 16, 1, si === 3 ? '#f4fbff' : '#8fd0f0');   // bacia e água
    P(23, 12, 3, 12, '#8a8a98'); P(21, 11, 7, 2, '#a8a8b8'); if (si !== 3) { P(20, 13, 1, 9, '#bfe4ff'); P(28, 13, 1, 9, '#bfe4ff'); }
    if (si === 0) [[18, 25], [27, 26], [30, 24]].forEach(([x, y]) => P(x, y, 2, 1, '#f8c8d8'));
    if (si === 1) { P(40, 3, 5, 5, '#f8e070'); [[19, 25], [29, 26]].forEach(([x, y]) => P(x, y, 1, 1, '#ffffff')); }
    if (si === 2) [[18, 26], [26, 25], [31, 27], [9, 30], [38, 33]].forEach(([x, y]) => P(x, y, 2, 1, '#e0902a'));
    if (si === 3) for (let i = 0; i < 18; i++) P((i * 17) % 48, (i * 9) % 30, 1, 1, '#ffffff');
    return (paintCache[key] = c);
  }
  function liftFish(ctx, a, t) {                   // personagem de frente, com o peixe erguido acima da cabeça
    const x = Math.round(a.x), y = Math.round(a.y), [sk, sd] = skinOf(a.look), bob = Math.floor(t / 300) % 2;
    [[OX(-9), OY(-27)], [OX(8), OY(-27)]].forEach(([dx, dy]) => { ctx.fillStyle = OUT; ctx.fillRect(x + dx - 1, y + dy - 8, 4, 10); ctx.fillStyle = sk; ctx.fillRect(x + dx, y + dy - 7, 2, 8); ctx.fillStyle = sd; ctx.fillRect(x + dx + 1, y + dy - 7, 1, 8); });
    ctx.drawImage(icon(a.fish.hold), x - 8, y + OY(-46) - bob);
    if (Math.floor(t / 180) % 3 === 0) { ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 9, y + OY(-46), 1, 3); ctx.fillRect(x + 8, y + OY(-45), 3, 1); ctx.fillRect(x - 11, y + OY(-38), 1, 1); }
  }
  function fishLine(ctx, f, t) {
    (f.rings || []).forEach(r => {                  // respingo: anéis que se abrem na água
      const k = (t - r.t0) / 650; if (k < 0 || k > 1) return;
      const rx = 2 + k * 9, ry = 1 + k * 4; ctx.fillStyle = `rgba(232,251,255,${0.9 * (1 - k)})`;
      for (let i = 0; i < 20; i++) { const an = (i / 20) * Math.PI * 2; ctx.fillRect(Math.round(r.x + Math.cos(an) * rx), Math.round(r.y + Math.sin(an) * ry), 1, 1); }
      if (k < 0.35) { ctx.fillStyle = '#e8fbff'; ctx.fillRect(Math.round(r.x) - 1, Math.round(r.y - 3 - k * 10), 2, 2); ctx.fillRect(Math.round(r.x) + 3, Math.round(r.y - 2 - k * 6), 1, 1); ctx.fillRect(Math.round(r.x) - 4, Math.round(r.y - 2 - k * 7), 1, 1); }
    });
    if (f.tip && f.bob && !f.hold) {               // linha: da ponta da vara até a boia, caindo um pouco no meio
      const [ax, ay] = f.tip, [bx, by] = f.bob, d = Math.hypot(bx - ax, by - ay), sag = (f.slack || 0) * Math.min(14, d * 0.3);
      const cx = (ax + bx) / 2, cy = (ay + by) / 2 + sag, n = Math.max(2, Math.ceil(d * 1.3));
      ctx.fillStyle = 'rgba(250,250,240,.9)';
      for (let i = 0; i <= n; i++) { const k = i / n, x = (1 - k) * (1 - k) * ax + 2 * (1 - k) * k * cx + k * k * bx, y = (1 - k) * (1 - k) * ay + 2 * (1 - k) * k * cy + k * k * by; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); }
    }
    if (f.bob && f.bobMode !== 'none') {           // boia vermelha e branca
      const [x0, y0] = f.bob, x = Math.round(x0), m = f.bobMode;
      const y = Math.round(y0 + (m === 'float' ? (Math.floor(t / 420) % 2) : m === 'nibble' ? 1 + (Math.floor(t / 70) % 2) : 0));
      if (m === 'sink') { ctx.fillStyle = OUT; ctx.fillRect(x - 2, y, 4, 2); ctx.fillStyle = '#e04a3a'; ctx.fillRect(x - 1, y, 2, 1); ctx.fillStyle = 'rgba(232,251,255,.9)'; ctx.fillRect(x - 4, y + 2, 8, 1); }
      else {
        ctx.fillStyle = OUT; ctx.fillRect(x - 2, y - 4, 5, 6); ctx.fillRect(x, y - 6, 1, 2);
        ctx.fillStyle = '#e04a3a'; ctx.fillRect(x - 1, y - 3, 3, 2); ctx.fillStyle = '#ff8a7a'; ctx.fillRect(x - 1, y - 3, 1, 1);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 1, y - 1, 3, 2);
        if (m !== 'fly' && m !== 'reel') { ctx.fillStyle = 'rgba(232,251,255,.7)'; ctx.fillRect(x - 3, y + 1, 7, 1); }
      }
    }
    if (f.jump) { const j = f.jump; ctx.save(); ctx.translate(Math.round(j.x), Math.round(j.y)); if (j.flip) ctx.scale(-1, 1); ctx.drawImage(icon(j.id), -8, -8); ctx.restore(); }
    if (f.charge != null && f.head) {              // barra de força acima da cabeça
      const [hx, hy] = f.head, x = Math.round(hx) - 13, y = Math.round(hy), w = 26, k = f.charge;
      ctx.fillStyle = OUT; ctx.fillRect(x - 1, y - 1, w + 2, 7); ctx.fillStyle = '#e8dcb8'; ctx.fillRect(x, y, w, 5); ctx.fillStyle = '#5a3a22'; ctx.fillRect(x + 1, y + 1, w - 2, 3);
      const fw = Math.round((w - 2) * k); ctx.fillStyle = k < 0.4 ? '#8fe88f' : k < 0.8 ? '#ffd75e' : '#ff8a4a'; ctx.fillRect(x + 1, y + 1, fw, 3); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(x + 1, y + 1, fw, 1);
      for (let i = 1; i < 4; i++) { ctx.fillStyle = '#e8dcb8'; ctx.fillRect(x + Math.round(w * i / 4), y + 4, 1, 2); }
    }
    if (f.alert != null && f.head) {               // fisgada: "!" grande piscando e o tempo que resta
      const [hx, hy] = f.head, x = Math.round(hx), y = Math.round(hy) - 4, on = Math.floor(t / 110) % 2;
      ctx.fillStyle = OUT; ctx.fillRect(x - 6, y - 14, 13, 14); ctx.fillRect(x - 1, y, 3, 3);
      ctx.fillStyle = on ? '#ffd75e' : '#ffffff'; ctx.fillRect(x - 5, y - 13, 11, 12); ctx.fillRect(x, y, 1, 2);
      ctx.fillStyle = '#c8302a'; ctx.fillRect(x - 1, y - 11, 3, 6); ctx.fillRect(x - 1, y - 4, 3, 2);
      ctx.fillStyle = OUT; ctx.fillRect(x - 7, y + 4, 15, 3); ctx.fillStyle = '#ff6a4a'; ctx.fillRect(x - 6, y + 5, Math.max(1, Math.round(13 * f.alert)), 1);
      if (f.bob) { const [bx, by] = f.bob, k = (t % 500) / 500; ctx.fillStyle = `rgba(255,215,94,${1 - k})`; for (let i = 0; i < 16; i++) { const an = i / 16 * Math.PI * 2; ctx.fillRect(Math.round(bx + Math.cos(an) * (4 + k * 6)), Math.round(by + 1 + Math.sin(an) * (2 + k * 3)), 1, 1); } }
    }
  }
  /* Efeito de impacto: lascas que voam e um brilho rápido no ponto do golpe. */
  const CHIP = { wood: ['#b88448', '#7a5230'], stone: ['#c0c0cc', '#8a8a98'], leaf: ['#58b858', '#2f8a40'], soil: ['#a07848', '#6e4c28'], water: ['#bfe4ff', '#6aacf0'], spark: ['#ffffff', '#ffd75e'] };
  function impact(ctx, f, t) {
    const k = (t - f.t0) / 380; if (k < 0 || k > 1) return;
    const [a, b] = CHIP[f.k] || CHIP.spark;
    if (k < 0.25 && f.k !== 'water' && f.k !== 'soil') { ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(f.x) - 3, Math.round(f.y), 7, 1); ctx.fillRect(Math.round(f.x), Math.round(f.y) - 3, 1, 7); }
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + f.t0 % 1, sp = f.k === 'water' ? 7 : 11;
      const x = f.x + Math.cos(ang) * sp * k, y = f.y + Math.sin(ang) * sp * k * 0.6 + (f.k === 'water' ? 0 : k * k * 8);
      ctx.fillStyle = i % 2 ? a : b; ctx.fillRect(Math.round(x), Math.round(y), k < 0.5 ? 2 : 1, k < 0.5 ? 2 : 1);
    }
  }
  /* Bicho de estimação (gato ou cachorro), 16x14, com pés em (x, y). */
  const PETC = { gato: ['#e8a048', '#b87028', '#fff0d8'], cachorro: ['#a87048', '#7a4a28', '#f4e4cc'] };
  function petFig(ctx, x, y, sp, frame, flip, sit) {
    const [c, d, l] = PETC[sp] || PETC.gato, s = flip ? -1 : 1, P = (a, b, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(flip ? x - a - w : x + a, y + b, w, h); };
    ctx.fillStyle = 'rgba(20,30,20,.25)'; ctx.fillRect(x - 7, y - 1, 14, 2);
    const leg = frame % 2;
    if (sit) { P(-5, -9, 9, 9, OUT); P(-4, -8, 7, 8, c); P(-3, -5, 4, 5, l); P(-8, -3, 4, 3, OUT); P(-7, -2, 3, 1, c); }
    else {
      P(-7, -8, 12, 7, OUT); P(-6, -7, 10, 5, c); P(-6, -3, 10, 1, d); P(-4, -5, 5, 2, l);
      P(-6, -2, 2, 2 + leg, OUT); P(2, -2, 2, 3 - leg, OUT); P(-3, -2, 2, 3 - leg, d); P(5 - 1, -2, 1, 2 + leg, d);
      if (sp === 'gato') { P(-10, -12 + leg, 2, 6, OUT); P(-9, -11 + leg, 1, 5, c); } else { P(-9, -9 - leg, 3, 2, OUT); P(-8, -9 - leg, 2, 1, c); }
    }
    // cabeça
    const hx = sit ? 0 : 3, hy = sit ? -15 : -13;
    P(hx - 1, hy, 9, 8, OUT); P(hx, hy + 1, 7, 6, c); P(hx + 2, hy + 4, 4, 3, l);
    if (sp === 'gato') { P(hx, hy - 2, 2, 3, OUT); P(hx + 5, hy - 2, 2, 3, OUT); P(hx + 1, hy - 1, 1, 1, '#f08fb0'); P(hx + 5, hy - 1, 1, 1, '#f08fb0'); P(hx + 1, hy + 3, 1, 1, '#2e6a3a'); P(hx + 5, hy + 3, 1, 1, '#2e6a3a'); }
    else { P(hx - 2, hy + 1, 3, 5, OUT); P(hx - 1, hy + 1, 1, 4, d); P(hx + 6, hy + 1, 3, 5, OUT); P(hx + 7, hy + 1, 1, 4, d); P(hx + 2, hy + 3, 1, 1, OUT); P(hx + 5, hy + 3, 1, 1, OUT); P(hx + 3, hy + 5, 2, 1, OUT); }
    if (sp === 'gato') P(hx + 3, hy + 5, 1, 1, '#f08fb0');
  }
  function pet(ctx, p, t) {
    petFig(ctx, Math.round(p.x), Math.round(p.y), p.sp, p.moving ? Math.floor(t / 160) : 0, p.flip, !p.moving);
    if (p.heart) heart(ctx, Math.round(p.x) - 3, Math.round(p.y) - 26 - Math.floor(t / 250) % 2);
  }
  /* Pequena imagem do bicho para painéis. */
  function petCanvas(sp, sit = true) {
    const c = document.createElement('canvas'); c.width = 24; c.height = 20; c.className = 'pixel';
    petFig(c.getContext('2d'), 12, 19, sp, 0, false, sit); return c;
  }

  function heart(ctx, x, y) { ctx.fillStyle = '#e04a3a'; ctx.fillRect(x, y, 3, 3); ctx.fillRect(x + 4, y, 3, 3); ctx.fillRect(x + 1, y + 3, 5, 2); ctx.fillRect(x + 3, y + 5, 1, 1); }

  return {
    get VW() { return VW; }, get VH() { return VH; }, RW, RH, setView, setSeason, get SEASON() { return SEASON; }, SERRA, MPLACES,
    get, free, camera, render, icon, tileAt, tilePos, petCanvas, waterZone, solidAt, painting, GRID, YARD, SPOT, NTREES, NROCKS, FORAGE, PLACES, FORA,
  };
})();
