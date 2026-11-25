/* Moradores com sprite do mapa desenhado à mão (em vez do gerador de js/sprites.js), na mesma grade dos outros
   personagens: 1 pixel do desenho = 1 pixel do mundo, quadro de 24x32 com os pés na linha 30, contorno automático igual
   ao do gerador. Vistas: 'down', 'up' e 'side' (olhando para a esquerda; a direita é o espelho). Quadros: 0 parado,
   1 e 2 passos (só as linhas das pernas mudam). As cores vêm da aparência (look) de cada um.
   Uso: look.sprite = 'iara' | 'caleb'.

   IARA (13 anos): proporção de criança, inspirada nas crianças dos jogos de fazenda em pixel art (arte própria), cerca
   de 16 x 22 pontos. Cabelo preto rente à cabeça, franja reta e duas chuquinhas baixas com elástico amarelo, laço
   amarelo no alto, jardineira lilás com manchinhas de tinta e tênis brancos. No inverno: gorro com pompom, cachecol,
   moletom e calça.
   Letras: h/d/l cabelo; s/S/z pele; e olho; w brilho; m boca; c bochecha; b/B laço; x elástico; n pescoço (cachecol no
   inverno); t camiseta; J/j jardineira; k fivela; P/p short; a/A braço (manga no inverno); q mão; v/V perna (calça no
   inverno); f/F tênis; r/u tinta; G/X/W gorro.

   CALEB: adulto alto e magro (cerca de 12 x 30 pontos), cabelo preto arroxeado com franja longa e lisa caída de lado,
   cobrindo um olho; moletom escuro com capuz abaixado (o capuz aparece atrás da nuca), cordões claros, calça justa e
   tênis escuros. Letras: h/d/l cabelo; s/S/z pele; e olho; m boca; n pescoço; K/k moletom; y cordão; q mão;
   L/l calça; o/O tênis. */
const HandArt = (() => {
  const W = 24, H = 32, FOOT = 30, OUT = '#2a1a14';
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const toHex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const shade = (h, k) => toHex(hex(h).map(v => v * k));
  const mix = (a, b, k) => { const A = hex(a), B = hex(b); return toHex(A.map((v, i) => v + (B[i] - v) * k)); };

  /* ---------------- Iara ---------------- */
  const IARA_MAPS = {
    down: [
      '........bb.bb...',
      '.....hhhbbBbb...',
      '....hhlhhhhhh...',
      '...hhhhhhhhlh...',
      '...hdhhhhhhdh...',
      '...hdhhdhhdhh...',
      '...hssssssssh...',
      '...hsessssesh...',
      '..xhsesssseshx..',
      '.hh.cssmmssc.hh.',
      '.hd..ssssss..dh.',
      '.dh...nnnn...hd.',
      '..d..tJJJJt..d..',
      '....atJkkJta....',
      '....aJJJJJJa....',
      '....qJJrJJJq....',
      '.....PPPPPP.....',
      '.....PPp.pP.....',
      '......vv.vV.....',
      '.....fff.fFF....',
    ],
    up: [
      '........bb.bb...',
      '.....hhhbbBbb...',
      '....hhlhhhhhh...',
      '...hhhhhhhhlh...',
      '...hdhhhhhhdh...',
      '...hhhdhhdhhh...',
      '...hlhhhhhhlh...',
      '...hdhhhhhhdh...',
      '..xhhhdhhdhhhx..',
      '.hh.hhhhhhhh.hh.',
      '.hd..hhhhhh..dh.',
      '.dh...nnnn...hd.',
      '..d..JJJJJJ..d..',
      '....aJJJJJJa....',
      '....aJJJJJJa....',
      '....qJJJJJJq....',
      '.....PPPPPP.....',
      '.....PPp.pP.....',
      '......vv.vV.....',
      '.....fff.fFF....',
    ],
    side: [
      '..........bb.bb.',
      '.......hhhbbBbb.',
      '......hhlhhhhhh.',
      '.....hhhhhhhlhh.',
      '.....hdhhhhhhdh.',
      '.....hdhdhhhhhh.',
      '.....ssssshhhhh.',
      '.....sesshhhdhh.',
      '....zsesShhhdh..',
      '.....smcsShxhh..',
      '......sssS..hh..',
      '.......nn....dh.',
      '......tJJt...d..',
      '......JJJa......',
      '......JJJA......',
      '......JrJq......',
      '......PPPP......',
      '......PPPP......',
      '.......vv.......',
      '......fff.......',
    ],
  };
  /* as três últimas linhas (barra do short, pernas, tênis) mudam na caminhada */
  const IARA_LEGS = {
    down: [
      ['.....PPp.pP.....', '......vv.vV.....', '.....fff.fFF....'],
      ['.....PPp.pP.....', '.....fff.vV.....', '.........fFF....'],
      ['.....PPp.pP.....', '......vv.fFF....', '.....fff........'],
    ],
    side: [
      ['......PPPP......', '.......vv.......', '......fff.......'],
      ['......PPPP......', '......v..V......', '.....ff..FF.....'],
      ['......PPPP......', '......V..v......', '.....FF..ff.....'],
    ],
  };
  IARA_LEGS.up = IARA_LEGS.down;
  /* gorro (inverno): substitui as primeiras linhas (laço e topo do cabelo) */
  const IARA_HAT = {
    down: ['.......WW.......', '.....GGWWGG.....', '....GGXGGXGG....', '...GGGGGGGGGG...', '...XXXXXXXXXX...'],
    side: ['.........WW.....', '.......GGWWGG...', '......GGXGGXGG..', '.....GGGGGGGGGG.', '.....XXXXXXXXXX.'],
  };
  IARA_HAT.up = IARA_HAT.down;

  function iaraPalette(look) {
    const sk = (Sprites.SKINS.find(s => s.id === look.skin) || Sprites.SKINS[5]).c, hr = Sprites.hairPaletteOf(look);
    const winter = look.top === 'moletom', pants = look.bottom === 'calca';
    const top = look.topColor || '#9a74d8', bot = look.bottomColor || '#8a64c8', shoe = look.shoeColor || '#f4f4f4';
    const bow = look.accessory === 'laco' ? (look.accColor || '#f2c84a') : null, scarf = look.accessory === 'cachecol' ? (look.accColor || '#e0a23a') : null;
    const hat = look.hat === 'gorro' ? (look.hatColor || '#5a58b8') : null;
    return {
      h: hr[0], d: hr[1], l: hr[2], s: sk[0], S: sk[1], z: sk[2], e: '#140c10', w: '#e8dcd4', m: '#a04a4a', c: mix(sk[0], '#e05a5a', 0.3),
      b: bow, B: bow && shade(bow, 0.78), x: bow || (look.hat === 'gorro' ? look.hatColor || '#5a58b8' : hr[2]),
      n: scarf || sk[1], t: winter ? top : '#f4eee4', J: top, j: shade(top, 0.8), k: winter ? top : '#e0b84a',
      P: bot, p: shade(bot, 0.78), a: winter ? top : sk[0], A: winter ? shade(top, 0.8) : sk[1], q: sk[0],
      v: pants ? bot : sk[0], V: pants ? shade(bot, 0.78) : sk[1], f: shoe, F: shade(shoe, 0.76),
      r: look.paint ? '#e04a5a' : top, u: look.paint ? '#3f86d0' : top,
      G: hat, X: hat && shade(hat, 0.75), W: '#f4f4f4',
    };
  }


  /* ---------------- Caleb ---------------- */
  const CALEB_MAPS = {
    down: [
      '......hhhh......',
      '....hhhhhhhh....',
      '...hhllllhhhh...',
      '...hhhhhhllhhh..',
      '..hhhhhhhhhhdh..',
      '..hdhhhhhhsshd..',
      '..hhdhhhhsssdh..',
      '...hhdhhssesh...',
      '...hhhdsssesh...',
      '....hdssssssS...',
      '....hsssssmsS...',
      '.....SssssSS....',
      '......nSSSn.....',
      '...KKkkkkkkKK...',
      '...KKKyKKyKKK...',
      '...KKKyKKyKKK...',
      '...KkKKKKKKkK...',
      '...KkKKKKKKkK...',
      '...KkKKKKKKkK...',
      '...KkkkkkkkkK...',
      '...KKKKKKKKKK...',
      '...qKKKKKKKKq...',
      '....LLLLLLLL....',
      '....LLLLlLLL....',
      '....LLL..LLL....',
      '....LLl..lLL....',
      '....LLl..lLL....',
      '....LLl..lLL....',
      '....LLl..lLL....',
      '...ooO...oOo....',
    ],
    up: [
      '......hhhh......',
      '....hhhhhhhh....',
      '...hhllllhhhh...',
      '...hhhhhhllhh...',
      '..hhhhhhhhhhhh..',
      '..hhdhhhhhhdhh..',
      '..hhhdhhhhdhhh..',
      '...hhhdhhdhhh...',
      '...hhhhhhhhhh...',
      '....hdhhhhdh....',
      '....hhdhhdhh....',
      '.....hhhhhh.....',
      '......nSSn......',
      '...KKkkkkkkKK...',
      '...KKkKKKKkKK...',
      '...KKKkkkkKKK...',
      '...KkKKKKKKkK...',
      '...KkKKKKKKkK...',
      '...KkKKKKKKkK...',
      '...KkKKKKKKkK...',
      '...KKKKKKKKKK...',
      '...qKKKKKKKKq...',
      '....LLLLLLLL....',
      '....LLLLlLLL....',
      '....LLL..LLL....',
      '....LLl..lLL....',
      '....LLl..lLL....',
      '....LLl..lLL....',
      '....LLl..lLL....',
      '...ooO...oOo....',
    ],
    side: [
      '.......hhhh.....',
      '.....hhhhhhhh...',
      '....hhllllhhhh..',
      '...hhhhhhhllhhh.',
      '..hhhhhhhhhhhdh.',
      '..hhhhhhhhhhhhd.',
      '...hhhsshhhdhhh.',
      '...hdsesshhhdhh.',
      '..zssessShhdhh..',
      '...sssssShhhh...',
      '...smssSShhh....',
      '....sssSS.......',
      '.....nSS........',
      '....kKKKkk......',
      '....KKKKKkk.....',
      '....KKKKKk......',
      '....KKKKKK......',
      '....KkKKKK......',
      '....KkKKKK......',
      '....KkKKKK......',
      '....KkKKKK......',
      '....KqKKKK......',
      '.....LLLL.......',
      '.....LLLL.......',
      '.....LLLl.......',
      '.....LLLl.......',
      '.....LLLl.......',
      '.....LLLl.......',
      '.....LLLl.......',
      '....oooO........',
    ],
  };
  /* as seis últimas linhas (pernas e tênis) mudam na caminhada */
  const CALEB_LEGS = {
    down: [
      ['....LLL..LLL....', '....LLl..lLL....', '....LLl..lLL....', '....LLl..lLL....', '....LLl..lLL....', '...ooO...oOo....'],
      ['....LLL..LLL....', '....LLl..lLL....', '....LLl..lLL....', '....LLl..lLL....', '...ooO...lLL....', '.........oOo....'],
      ['....LLL..LLL....', '....LLl..lLL....', '....LLl..lLL....', '....LLl..lLL....', '....LLl..oOo....', '...ooO..........'],
    ],
    side: [
      ['.....LLLl.......', '.....LLLl.......', '.....LLLl.......', '.....LLLl.......', '.....LLLl.......', '....oooO........'],
      ['.....LLLl.......', '....LLl.Ll......', '....LL...Ll.....', '...LL....lL.....', '...LL.....ll....', '..ooO.....oO....'],
      ['.....LLLl.......', '.....LlLL.......', '....Ll..LL......', '....Ll...LL.....', '...ll....LL.....', '...oO....ooO....'],
    ],
  };
  CALEB_LEGS.up = CALEB_LEGS.down;
  function calebPalette(look) {
    const sk = (Sprites.SKINS.find(s => s.id === look.skin) || Sprites.SKINS[1]).c, hr = Sprites.hairPaletteOf(look);
    const top = look.topColor || '#34303c', bot = look.bottomColor || '#2e2b36', shoe = look.shoeColor || '#141016';
    return {
      h: hr[0], d: hr[1], l: hr[2], s: sk[0], S: sk[1], z: sk[2], e: '#1a1420', m: mix(sk[0], '#a04a4a', 0.45), n: sk[1],
      K: top, k: shade(top, 0.72), y: '#9a96a8', q: sk[0], L: bot, l: shade(bot, 0.7), o: shoe, O: mix(shoe, '#ffffff', 0.18),
    };
  }

  const SETS = {
    iara: { maps: IARA_MAPS, legs: IARA_LEGS, legRows: 3, hat: IARA_HAT, palette: iaraPalette },
    caleb: { maps: CALEB_MAPS, legs: CALEB_LEGS, legRows: 6, palette: calebPalette },
  };

  function render(look, frame, dir) {
    const S = SETS[look.sprite], v = dir === 'side' || dir === 'left' || dir === 'right' ? 'side' : dir === 'up' ? 'up' : 'down';
    const rows = S.maps[v].slice(0, -S.legRows).concat(S.legs[v][Math.abs(frame | 0) % 3]);
    if (S.hat && look.hat === 'gorro') S.hat[v].forEach((r, i) => { rows[i] = r.split('').map((ch, x) => (ch === '.' ? (rows[i][x] === 'b' || rows[i][x] === 'B' ? '.' : rows[i][x]) : ch)).join(''); });
    const pal = S.palette(look), top = FOOT - rows.length + 1, grid = Array.from({ length: H }, () => Array(W).fill(null));
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
  return { render, has: id => !!SETS[id] };
})();
