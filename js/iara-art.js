/* Iara (13 anos): sprite do mapa desenhado à mão, com proporção de criança no estilo dos jogos de fazenda em pixel art
   (cabeça grande, corpo curto, pernas curtas), na mesma grade dos outros personagens: 1 pixel do desenho = 1 pixel do
   mundo, quadro de 24x32 com os pés na linha 30. Figura de cerca de 16 x 23 pontos.
   Arte própria: cabelo cacheado volumoso arredondado em volta da cabeça (sem cobrir braços e corpo), laço amarelo no
   alto, jardineira lilás com manchinhas de tinta e tênis brancos. No inverno (lookWinter): gorro com pompom, cachecol,
   moletom e calça.
   Cores vêm da aparência (pele, cabelo, roupas, calçado, laço, gorro e cachecol). Contorno automático, igual ao do
   gerador. Vistas: 'down', 'up' e 'side' (olhando para a esquerda; a direita é o espelho). Quadros: 0 parado, 1 e 2 passos.

   Letras do mapa: h/d/l cabelo (base, sombra, luz); s/S/z pele; e olho; w brilho do olho; m boca; c bochecha;
   b/B laço; n pescoço (cachecol no inverno); t camiseta por baixo; J/j jardineira; k fivela; P/p short;
   a/A braço (manga no inverno); q mão; v/V perna (calça no inverno); f/F tênis; r/u manchas de tinta. */
const IaraArt = (() => {
  const W = 24, H = 32, FOOT = 30, OUT = '#2a1a14';
  const MAPS = {
    down: [
      '........bb.bb...',
      '......hhbbBbb...',
      '....hhlhhbhlhh..',
      '...hlhhdhhhhhdh.',
      '..hhhdhhlhhdhhhh',
      '..hlhhhhhhhhhlhh',
      '.hhhddhhhhhhddhh',
      '.hhdhssssssssdhh',
      '.hlhssssssssssdh',
      '.hhhseesssseeshh',
      '.hdhsewsssswesdh',
      '.hhhcsssSsssschh',
      '.hlhsssmmmsssshd',
      '..hhdssssssssdh.',
      '..hdh.nnnnnn.hd.',
      '...h.tJJJJJJt.h.',
      '....atJkJJkJta..',
      '....aJJJJJJJJA..',
      '....qJJJrJJJJq..',
      '.....PPPPPPPP...',
      '.....PPp..pPP...',
      '......vv..vV....',
      '.....fff..fFF...',
    ],
    up: [
      '........bb.bb...',
      '......hhbbBbb...',
      '....hhlhhbhlhh..',
      '...hlhhdhhhhhdh.',
      '..hhhdhhlhhdhhhh',
      '..hlhhhhhhhhhlhh',
      '.hhhdhhlhhdhhhhh',
      '.hlhhhdhhhhhlhdh',
      '.hhhlhhhhdhhhhhh',
      '.hdhhhhlhhhhdhhh',
      '.hhhdhhhhhlhhdhh',
      '.hlhhhdhhhhhhhhd',
      '.hhdhhhhlhhdhhhh',
      '..hhhlhhhhhhlhh.',
      '..hdhhdhhhdhhhd.',
      '...h.JJJJJJJJ.h.',
      '....aJJJJJJJJa..',
      '....aJJJJJJJJA..',
      '....qJJJJJJJJq..',
      '.....PPPPPPPP...',
      '.....PPp..pPP...',
      '......vv..vV....',
      '.....fff..fFF...',
    ],
    side: [
      '..........bb.bb.',
      '........hhbbBbb.',
      '......hhlhhbhh..',
      '.....hlhhdhhlhh.',
      '....hhhdhhhhhdhh',
      '...hhhhhhlhhhhlh',
      '...hhdhhhhhhdhhh',
      '..hsssshhhlhhhdh',
      '..sssssshhhhhhhh',
      '..ssesssshdhhlhh',
      '.zssessshhhhhdh.',
      '..sscsSShhlhhhh.',
      '..smssSShdhhhdh.',
      '...sssShhhhhh...',
      '....nnnhdhhd....',
      '.....tJJt.hh....',
      '.....JJJa.......',
      '.....JJJA.......',
      '.....JrJq.......',
      '.....PPPP.......',
      '.....PPPP.......',
      '......vv........',
      '.....fff........',
    ],
  };
  /* as três últimas linhas (barra do short, pernas, tênis) mudam na caminhada */
  const LEGS = {
    down: [
      ['.....PPp..pPP...', '......vv..vV....', '.....fff..fFF...'],
      ['.....PPp..pPP...', '.....fff..vV....', '..........fFF...'],
      ['.....PPp..pPP...', '......vv..fFF...', '.....fff........'],
    ],
    side: [
      ['.....PPPP.......', '......vv........', '.....fff........'],
      ['.....PPPP.......', '.....v..V.......', '....ff..FF......'],
      ['.....PPPP.......', '.....V..v.......', '....FF..ff......'],
    ],
  };
  LEGS.up = LEGS.down;
  /* gorro (inverno): substitui as primeiras linhas (laço e topo do cabelo) */
  const HAT = {
    down: ['.......WW.......', '.....GGWWGG.....', '....GGXGGGXGG...', '...GGGGGGGGGGG..', '..XXXXXXXXXXXXX.'],
    side: ['.........WW.....', '.......GGWWGG...', '.....GGXGGGXGG..', '....GGGGGGGGGGG.', '...XXXXXXXXXXXXh'],
  };
  HAT.up = HAT.down;

  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const toHex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const shade = (h, k) => toHex(hex(h).map(v => v * k));
  const mix = (a, b, k) => { const A = hex(a), B = hex(b); return toHex(A.map((v, i) => v + (B[i] - v) * k)); };

  function palette(look) {
    const sk = (Sprites.SKINS.find(s => s.id === look.skin) || Sprites.SKINS[5]).c, hr = Sprites.hairPaletteOf(look);
    const winter = look.top === 'moletom', pants = look.bottom === 'calca';
    const top = look.topColor || '#9a74d8', bot = look.bottomColor || '#8a64c8', shoe = look.shoeColor || '#f4f4f4';
    const bow = look.accessory === 'laco' ? (look.accColor || '#f2c84a') : null, scarf = look.accessory === 'cachecol' ? (look.accColor || '#e0a23a') : null;
    const hat = look.hat === 'gorro' ? (look.hatColor || '#5a58b8') : null;
    return {
      h: hr[0], d: hr[1], l: hr[2], s: sk[0], S: sk[1], z: sk[2], e: '#140c10', w: '#e8dcd4', m: '#a04a4a', c: mix(sk[0], '#e05a5a', 0.3),
      b: bow, B: bow && shade(bow, 0.78),
      n: scarf || sk[1], t: winter ? top : '#f4eee4', J: top, j: shade(top, 0.8), k: winter ? top : '#e0b84a',
      P: bot, p: shade(bot, 0.78), a: winter ? top : sk[0], A: winter ? shade(top, 0.8) : sk[1], q: sk[0],
      v: pants ? bot : sk[0], V: pants ? shade(bot, 0.78) : sk[1], f: shoe, F: shade(shoe, 0.76),
      r: look.paint ? '#e04a5a' : top, u: look.paint ? '#3f86d0' : top,
      G: hat, X: hat && shade(hat, 0.75), W: '#f4f4f4',
    };
  }

  function render(look, frame, dir) {
    const v = dir === 'side' || dir === 'left' || dir === 'right' ? 'side' : dir === 'up' ? 'up' : 'down';
    const rows = MAPS[v].slice(0, -3).concat(LEGS[v][Math.abs(frame | 0) % 3]);
    if (look.hat === 'gorro') HAT[v].forEach((r, i) => { rows[i] = r.split('').map((ch, x) => (ch === '.' ? (rows[i][x] === 'b' || rows[i][x] === 'B' ? '.' : rows[i][x]) : ch)).join(''); });
    const pal = palette(look), top = FOOT - rows.length + 1, grid = Array.from({ length: H }, () => Array(W).fill(null));
    rows.forEach((r, j) => [...r].forEach((ch, i) => { const c = ch === '.' ? null : pal[ch]; if (c) grid[top + j][4 + i] = c; }));
    const filled = grid.map(r => r.slice());
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (filled[y][x]) continue;
      const n = (filled[y + 1] && filled[y + 1][x]) || filled[y][x - 1] || filled[y][x + 1] || (filled[y - 1] && filled[y - 1][x]);
      if (n) grid[y][x] = mix(OUT, n, 0.16);
    }
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (grid[y][x]) { g.fillStyle = grid[y][x]; g.fillRect(x, y, 1, 1); }
    return c;
  }
  return { render };
})();
