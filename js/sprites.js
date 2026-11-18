/* Personagens em pixel art (24x32), montados por código a partir da aparência:
   tom de pele, penteado e cor, parte de cima, parte de baixo, calçado,
   acessório e chapéu. Qualquer combinação vale para qualquer gênero.
   Sem imagens externas.

   Camadas: cabelo de trás → corpo e roupas → cabeça e rosto → cabelo da
   frente → acessório → chapéu → contorno escuro automático.
   Vistas: de frente ('down'), de costas ('up') e de perfil ('side', olhando
   para a esquerda; a direita é o espelho). Quadros: 0 parado, 1 passo com a
   perna esquerda, 2 passo com a perna direita. */

const Sprites = (() => {
  const W = 24, H = 32;
  const OUT = '#2a1a14';

  /* [base, sombra, luz] */
  const SKINS = [
    { id: 's1', name: 'Muito clara',  c: ['#ffe2c8', '#eab894', '#fff2e4'] },
    { id: 's2', name: 'Clara',        c: ['#f6c89c', '#d89c70', '#ffdcb8'] },
    { id: 's3', name: 'Morena clara', c: ['#dca272', '#b47848', '#ecb888'] },
    { id: 's4', name: 'Morena',       c: ['#b9794f', '#8f5634', '#cc8e62'] },
    { id: 's5', name: 'Escura',       c: ['#8a5636', '#663a22', '#a06a48'] },
    { id: 's6', name: 'Muito escura', c: ['#5e3a26', '#422616', '#764c34'] },
  ];
  /* [base, sombra, luz] */
  /* Cores de cabelo só de moradores (não aparecem na criação). */
  const EXTRA_HAIR = [{ id: 'cinzaQuente', name: 'Grisalho quente', c: ['#c4bab4', '#8d7f7a', '#eee8e2'] }];
  const HAIR_COLORS = [
    { id: 'preto',    name: 'Preto',           c: ['#2e2836', '#17131c', '#504862'] },
    { id: 'castanho', name: 'Castanho escuro', c: ['#5a3a24', '#3a2212', '#80583a'] },
    { id: 'claro',    name: 'Castanho claro',  c: ['#9a6a3c', '#704626', '#c08e5a'] },
    { id: 'loiro',    name: 'Loiro',           c: ['#e8c45a', '#b88e34', '#fae29a'] },
    { id: 'ruivo',    name: 'Ruivo',           c: ['#c8562a', '#923818', '#ec8250'] },
    { id: 'grisalho', name: 'Grisalho',        c: ['#b8b8c8', '#84849a', '#e4e4ee'] },
    { id: 'azul',     name: 'Azul',            c: ['#3f7fd8', '#2652a2', '#74acf4'] },
    { id: 'rosa',     name: 'Rosa',            c: ['#e870a8', '#b0467a', '#fcaad0'] },
  ];
  /* 16 penteados, de estilos tradicionalmente masculinos a femininos — todos livres. */
  const HAIRS = [
    { id: 'careca',        name: 'Careca' },
    { id: 'raspado',       name: 'Raspado' },
    { id: 'curtoLiso',     name: 'Curto liso' },
    { id: 'topete',        name: 'Topete' },
    { id: 'curtoOndulado', name: 'Curto ondulado' },
    { id: 'curtoCacheado', name: 'Curto cacheado' },
    { id: 'crespoCurto',   name: 'Crespo curto' },
    { id: 'crespo',        name: 'Black power' },
    { id: 'medio',         name: 'Chanel com franja' },
    { id: 'medioOndulado', name: 'Médio ondulado' },
    { id: 'longoLiso',     name: 'Longo liso' },
    { id: 'longoOndulado', name: 'Longo ondulado' },
    { id: 'longoCacheado', name: 'Longo cacheado' },
    { id: 'trancas',       name: 'Tranças' },
    { id: 'rabo',          name: 'Rabo de cavalo' },
    { id: 'coque',         name: 'Coque' },
  ];
  const GENDERS = [{ id: 'f', name: 'Feminino' }, { id: 'm', name: 'Masculino' }, { id: 'n', name: 'Não-binário' }];
  const TOPS = [
    { id: 'camiseta', name: 'Camiseta' }, { id: 'regata', name: 'Regata' }, { id: 'camisa', name: 'Camisa' },
    { id: 'blusa', name: 'Blusa' }, { id: 'moletom', name: 'Moletom' }, { id: 'jardineira', name: 'Jardineira' },
  ];
  const BOTTOMS = [{ id: 'calca', name: 'Calça' }, { id: 'short', name: 'Short' }, { id: 'saia', name: 'Saia' }, { id: 'saiaLonga', name: 'Saia longa' }];
  const ACCESSORIES = [{ id: 'oculos', name: 'Óculos' }, { id: 'laco', name: 'Laço' }, { id: 'bandana', name: 'Bandana' }, { id: 'cachecol', name: 'Cachecol' }];
  const CLOTH_COLORS = ['#d8507c', '#e04a3a', '#e0a23a', '#f2d24a', '#3fa070', '#5a7a5a', '#3f86d0', '#3a4a8a', '#8a5ad9', '#f4f4f4', '#3a3a4a', '#6a5038', '#c8683a', '#f08fb0'];
  const SHOE_COLORS = ['#3a2a22', '#8a5e36', '#f4f4f4', '#c8483a', '#3a4a8a', '#2a2a34'];
  const HATS = [{ id: 'palha', name: 'Chapéu de palha' }, { id: 'boina', name: 'Boina' }, { id: 'pescador', name: 'Chapéu de pescador' }];

  /* Pontos de partida da criação, aplicados ao escolher o gênero (só se mudar a escolha).
     body = base visual; o resto é livre e pode ser trocado depois, para qualquer gênero. */
  const GENDER_PRESETS = {
    m: { gender: 'm', body: 'm', hair: 'curtoLiso', hairColor: 'castanho', top: 'camisa', topColor: '#5a7a5a', bottom: 'calca', bottomColor: '#3a4a8a', shoeColor: '#3a2a22', accessory: null, accColor: '#e04a3a' },
    f: { gender: 'f', body: 'f', hair: 'longoOndulado', hairColor: 'castanho', top: 'blusa', topColor: '#d8507c', bottom: 'saia', bottomColor: '#3a4a8a', shoeColor: '#8a5e36', accessory: 'laco', accColor: '#f2d24a' },
    n: { gender: 'n', body: 'n', hair: 'medio', hairColor: 'claro', top: 'moletom', topColor: '#3fa070', bottom: 'calca', bottomColor: '#6a5038', shoeColor: '#f4f4f4', accessory: null, accColor: '#e04a3a' },
  };
  const genderPreset = id => Object.assign({}, GENDER_PRESETS[id] || GENDER_PRESETS.n);
  const byId = (list, id) => list.find(o => o.id === id) || list[0];
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const toHex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const shade = (h, k) => toHex(hex(h).map(v => v * k));
  const mix = (a, b, k) => { const A = hex(a), B = hex(b); return toHex(A.map((v, i) => v + (B[i] - v) * k)); };
  const ell = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;

  function render(look, frame, dir) {
    const grid = Array.from({ length: H }, () => Array(W).fill(null));
    const inb = (x, y) => x >= 1 && x < W - 1 && y >= 0 && y < H - 1;
    const p = (x, y, c) => { if (inb(x, y)) grid[y][x] = c; };
    const row = (y, x0, x1, c) => { for (let x = x0; x <= x1; x++) p(x, y, c); };
    const box = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) row(y, x0, x1, c); };
    const get = (x, y) => (inb(x, y) ? grid[y][x] : null);

    const [S, Sd, Sl] = byId(SKINS, look.skin).c;
    const [Hb, Hd, Hl] = byId(HAIR_COLORS.concat(EXTRA_HAIR), look.hairColor).c;
    const Hdd = shade(Hd, 0.75);
    const robe = look.top === 'manto';
    const leaves = look.top === 'folhas';                    // traje de Lúcio: camisa de mangas longas + manto de folhas
    const top = robe ? 'manto' : leaves ? 'camisa' : byId(TOPS, look.top).id, bottom = byId(BOTTOMS, look.bottom).id;
    const T = look.topColor || '#3f86d0', Td = shade(T, 0.74), Tl = mix(T, '#ffffff', 0.28);
    const B = look.bottomColor || '#6a5038', Bd = shade(B, 0.72), Bl = mix(B, '#ffffff', 0.22);
    const SHOE = look.shoeColor || '#3a2a22', SHOEl = mix(SHOE, '#ffffff', 0.25);
    const CREAM = '#f2ead6', CREAMd = '#d4c8ac';
    const hair = look.hair || 'careca', hat = look.hat || null, acc = look.accessory || null, A = look.accColor || '#e04a3a';
    const up = dir === 'up', side = dir === 'side', down = !up && !side;
    const stepL = frame === 1, stepR = frame === 2;
    /* base visual (escolhida junto com o gênero na criação): 'm' ombros largos e maxilar
       quadrado; 'f' cintura marcada, queixo fino, cílios e boca rosada; 'n' (ou ausente,
       como nos jogos salvos antigos) é a base neutra de antes. */
    const base = look.body === 'm' || look.body === 'f' ? look.body : 'n', masc = base === 'm', fem = base === 'f';
    const aL = masc ? 4 : 5, aR = masc ? 18 : 17;                       // colunas dos braços (de frente/costas)

    /* ---------- cabelo: máscara + textura ---------- */
    const HAIR = { straight: 1, wavy: 2, curly: 3, coily: 4 };
    let mask = new Set(), tex = HAIR.straight;
    const add = (x, y) => { if (inb(x, y)) mask.add(x + ',' + y); };
    const has = (x, y) => mask.has(x + ',' + y);
    const addEll = (cx, cy, rx, ry, pred) => { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (ell(x, y, cx, cy, rx, ry) && (!pred || pred(x, y))) add(x, y); };
    const addRect = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) add(x, y); };
    const cut = pred => { mask = new Set([...mask].filter(k => { const [x, y] = k.split(',').map(Number); return !pred(x, y); })); };
    /* topo da cabeça coberto (y <= linha do cabelo) */
    const crown = (line, vol = 0) => addEll(11.5, 10, 5.6 + vol, 6.6 + vol, (x, y) => y <= line);
    /* rosto livre, de frente */
    const face = (line) => cut((x, y) => down && y > line && x >= 8 && x <= 15);
    const backLayer = new Set();              // o que fica atrás do corpo (cabelo longo, de frente)

    function hairShape() {
      if (hair === 'careca') return;
      if (down) {
        switch (hair) {
          case 'raspado': crown(8); break;
          case 'curtoLiso': crown(8, 0.4); addRect(7, 9, 11, 9); add(7, 10); add(8, 10); add(16, 9); add(16, 10); add(12, 9); break;   // franja varrida para um lado
          case 'topete': crown(8); addEll(12.5, 4.2, 3.6, 2.6); add(7, 9); add(16, 9); break;
          case 'curtoOndulado': tex = HAIR.wavy; crown(8, 0.8); [7, 9, 13, 15].forEach(x => add(x, 9)); add(6, 10); add(17, 10); add(6, 11); add(17, 11); break;
          case 'curtoCacheado': tex = HAIR.curly; addEll(11.5, 7.5, 7.2, 5.6, (x, y) => y <= 9); [[6, 10], [17, 10], [6, 11], [17, 11], [5, 9], [18, 9]].forEach(([x, y]) => add(x, y)); face(8); break;
          case 'crespoCurto': tex = HAIR.coily; addEll(11.5, 7.6, 7.4, 5.8); face(8); break;
          case 'crespo': tex = HAIR.coily; addEll(11.5, 7.4, 10.2, 8.4); face(8); break;
          case 'medio': crown(8, 0.6); addRect(5, 8, 7, 15); addRect(16, 8, 18, 15); addRect(8, 8, 15, 9); add(5, 16); add(18, 16); add(6, 16); add(17, 16); break;   // chanel reto, franja cheia, pontas para dentro
          case 'medioOndulado': tex = HAIR.wavy; crown(8, 0.7); for (let y = 8; y <= 18; y++) { const o = (y >> 1) % 2; addRect(5 - o, y, 7, y); addRect(16, y, 18 + o, y); } add(8, 9); add(15, 9); break;
          case 'longoLiso': crown(8, 0.5); addRect(5, 8, 7, 22); addRect(16, 8, 18, 22); addRect(8, 8, 12, 9); add(8, 10); add(9, 10); add(13, 8); cut((x, y) => y >= 21 && (x === 5 || x === 18)); for (let y = 15; y <= 22; y++) for (let x = 6; x <= 17; x++) backLayer.add(x + ',' + y); break;
          case 'longoOndulado': tex = HAIR.wavy; crown(8, 0.7); for (let y = 8; y <= 23; y++) { const o = (y >> 1) % 2; addRect(5 - o, y, 7, y); addRect(16, y, 18 + o, y); } add(8, 9); add(15, 9); for (let y = 15; y <= 23; y++) for (let x = 6; x <= 17; x++) backLayer.add(x + ',' + y); break;
          case 'longoCacheado': tex = HAIR.curly; addEll(11.5, 9.5, 9.4, 9.2); addEll(11.5, 17, 8.6, 6.2); face(8); for (let y = 15; y <= 23; y++) for (let x = 5; x <= 18; x++) backLayer.add(x + ',' + y); break;
          case 'trancas': crown(8, 0.3); for (const x of [4, 6, 17, 19]) addRect(x, 8, x, x === 4 || x === 19 ? 21 : 23); add(5, 8); add(18, 8); for (let y = 15; y <= 23; y++) for (let x = 6; x <= 17; x++) backLayer.add(x + ',' + y); break;
          case 'rabo': crown(8, 0.1); add(7, 9); add(16, 9); addRect(17, 8, 18, 16); add(19, 12); add(19, 13); add(18, 17); break;
          case 'coque': crown(8, 0.1); addEll(11.5, 2.4, 2.8, 2.2); add(7, 9); add(7, 10); add(16, 9); break;
          case 'juba': tex = HAIR.wavy; crown(8, 0.9); addRect(5, 8, 7, 15); addRect(16, 8, 18, 15); cut((x, y) => y >= 7 && y <= 8 && x >= 9 && x <= 14);
            [[4, 10], [19, 10], [4, 13], [19, 14], [6, 3], [17, 3], [9, 2], [14, 2], [8, 9], [10, 9], [13, 9], [15, 9], [5, 16], [18, 16]].forEach(([x, y]) => add(x, y)); break;
        }
      } else if (up) {
        const nape = { raspado: 14, curtoLiso: 15, topete: 14, curtoOndulado: 15, curtoCacheado: 15, crespoCurto: 15, rabo: 14, coque: 14 }[hair];
        switch (hair) {
          case 'crespoCurto': tex = HAIR.coily; addEll(11.5, 8.4, 7.4, 6.6); break;
          case 'crespo': tex = HAIR.coily; addEll(11.5, 8, 10.2, 8.8); break;
          case 'curtoCacheado': tex = HAIR.curly; addEll(11.5, 9, 7.2, 6.6); break;
          case 'longoCacheado': tex = HAIR.curly; addEll(11.5, 9.5, 9.4, 9.2); addEll(11.5, 17, 8.6, 6.2); break;
          default: crown(15, hair === 'raspado' ? 0 : 0.5);
        }
        if (nape) cut((x, y) => y > nape);
        if (hair === 'curtoOndulado') tex = HAIR.wavy;
        if (hair === 'topete') addEll(12, 3.4, 3.2, 2);
        if (hair === 'medio') { addRect(6, 9, 17, 16); }
        if (hair === 'medioOndulado') { tex = HAIR.wavy; for (let y = 9; y <= 19; y++) { const o = (y >> 1) % 2; addRect(6 - o, y, 17 + o, y); } }
        if (hair === 'longoLiso') { addRect(6, 9, 17, 22); add(7, 23); add(16, 23); for (let x = 8; x <= 15; x++) add(x, 23); }
        if (hair === 'longoOndulado') { tex = HAIR.wavy; for (let y = 9; y <= 23; y++) { const o = (y >> 1) % 2; addRect(6 - o, y, 17 + o, y); } }
        if (hair === 'trancas') { for (const x of [6, 9, 14, 17]) addRect(x, 9, x + 1, 23); }
        if (hair === 'rabo') { addRect(10, 9, 13, 20); add(11, 21); add(12, 21); add(11, 22); }
        if (hair === 'coque') addEll(11.5, 2.4, 2.8, 2.2);
        if (hair === 'juba') { tex = HAIR.wavy; addEll(11.5, 9.5, 6.8, 7.2); addRect(6, 9, 17, 15); [[5, 12], [18, 13], [7, 16], [10, 16], [13, 16], [16, 16], [6, 3], [17, 4], [11, 2]].forEach(([x, y]) => add(x, y)); }
      } else {                                            // perfil, olhando para a esquerda
        const sideCrown = (vol = 0) => addEll(12, 9.6, 5.4 + vol, 6.4 + vol, (x, y) => y <= 8 || x >= 12);
        switch (hair) {
          case 'raspado': addEll(12, 9.6, 5.2, 6.2, (x, y) => y <= 8 || (x >= 13 && y <= 14)); break;
          case 'curtoLiso': sideCrown(0.4); cut((x, y) => y > 14); add(7, 9); add(8, 9); break;
          case 'topete': sideCrown(); cut((x, y) => y > 14); addEll(9.5, 4, 3.6, 2.6); break;
          case 'curtoOndulado': tex = HAIR.wavy; sideCrown(0.8); cut((x, y) => y > 15); add(7, 9); break;
          case 'curtoCacheado': tex = HAIR.curly; addEll(12.5, 8.6, 6.8, 6.4, (x, y) => y <= 9 || x >= 12); cut((x, y) => y > 15); break;
          case 'crespoCurto': tex = HAIR.coily; addEll(12.6, 8, 7.2, 6.6, (x, y) => y <= 9 || x >= 11); break;
          case 'crespo': tex = HAIR.coily; addEll(13, 7.6, 9.6, 8.6, (x, y) => y <= 9 || x >= 11); break;
          case 'medio': sideCrown(0.6); addRect(12, 9, 17, 15); add(7, 8); add(7, 9); add(8, 9); break;
          case 'medioOndulado': tex = HAIR.wavy; sideCrown(0.7); for (let y = 9; y <= 18; y++) addRect(12, y, 17 + ((y >> 1) % 2), y); add(7, 9); break;
          case 'longoLiso': sideCrown(0.5); addRect(12, 9, 17, 22); add(7, 9); add(8, 9); add(8, 10); break;
          case 'longoOndulado': tex = HAIR.wavy; sideCrown(0.7); for (let y = 9; y <= 23; y++) addRect(12, y, 17 + ((y >> 1) % 2), y); add(7, 9); break;
          case 'longoCacheado': tex = HAIR.curly; addEll(12.8, 9.6, 8.6, 9, (x, y) => y <= 8 || x >= 11); addEll(14, 17, 5.4, 6.2); break;
          case 'trancas': sideCrown(0.3); for (const x of [13, 15, 17]) addRect(x, 9, x, 23); add(14, 22); add(16, 23); break;
          case 'rabo': sideCrown(0.1); cut((x, y) => y > 13); addRect(16, 9, 18, 18); add(19, 12); add(19, 13); add(17, 19); break;
          case 'coque': sideCrown(0.1); cut((x, y) => y > 13); addEll(15, 3.4, 2.6, 2.2); break;
          case 'juba': tex = HAIR.wavy; sideCrown(0.9); addRect(12, 9, 17, 15); [[19, 12], [19, 15], [13, 18], [16, 18], [7, 8], [8, 9], [10, 2], [16, 3]].forEach(([x, y]) => add(x, y)); break;
        }
      }
      if (hat) cut((x, y) => y < 5 || (y < 6 && x > 5 && x < 18));          // o chapéu assenta sobre o cabelo
    }
    hairShape();
    /* cacheados e crespos: borda com volume (pequenos tufos), sem invadir o rosto */
    if ((tex === HAIR.curly || tex === HAIR.coily) && hair !== 'careca') {
      const extra = [];
      for (const k of mask) { const [x, y] = k.split(',').map(Number);
        const inFace = down && x >= 8 && x <= 15 && y >= 9;
        if (inFace || (x * 7 + y * 3) % 4) continue;
        if (!has(x, y - 1) && y > 1) extra.push([x, y - 1]);
        else if (!has(x - 1, y) && x <= 8) extra.push([x - 1, y]);
        else if (!has(x + 1, y) && x >= 15) extra.push([x + 1, y]);
      }
      if (!hat) extra.forEach(([x, y]) => add(x, y)); else extra.forEach(([x, y]) => { if (y >= 6) add(x, y); });
    }

    /* pinta a máscara com luz, sombra e textura do tipo de cabelo */
    function paintHair(only) {
      for (const k of mask) {
        if (only && !only(k)) continue;
        const [x, y] = k.split(',').map(Number);
        const topEdge = !has(x, y - 1), rightEdge = !has(x + 1, y), bottomEdge = !has(x, y + 1), leftEdge = !has(x - 1, y);
        let c = Hb;
        if (hair === 'juba') {                              // mechas grossas que caem para os lados a partir da risca
          const out = x < 12 ? -1 : 1, lockPos = ((x + out * Math.floor(y / 3) + 30) % 3);
          c = lockPos === 0 ? Hl : lockPos === 1 ? Hb : Hd;
          if (y <= 8 && (x === 11 || x === 12)) c = Hd;
          if (y >= 13) c = lockPos === 2 ? Hd : Hb;
        } else if (tex === HAIR.straight) {                // fios retos: mechas verticais e um arco de brilho
          if ((x + (y > 12 ? 1 : 0)) % 3 === 0 && !topEdge) c = Hd;
          const arc = 5 + (Math.abs(x - 11.5) > 3.5 ? 1 : 0) + (Math.abs(x - 11.5) > 5.5 ? 1 : 0);
          if (y === arc && x >= 7 && x <= 16) c = Hl; else if (y === arc + 1 && x >= 9 && x <= 14 && c !== Hd) c = mix(Hb, Hl, 0.5);
          if (y >= 17 && (x + y) % 4 === 0) c = Hd;
        } else if (tex === HAIR.wavy) {                   // ondas: faixas de luz e sombra que serpenteiam
          const w = (((y + Math.round(Math.sin(x * 1.1) * 1.4)) % 4) + 4) % 4;
          c = w === 0 ? Hd : w === 2 ? (y < 16 ? Hl : Hb) : Hb;
        } else if (tex === HAIR.curly) {                  // cachos: espirais em xadrez com o centro iluminado
          const off = (Math.floor(y / 3) % 2) ? 2 : 0, u = (x + off) % 3, v = y % 3;
          c = u === 1 && v === 1 ? Hl : (u === 0 || v === 0) ? Hd : Hb;
          if (u === 2 && v === 2) c = mix(Hb, Hd, 0.5);
        } else {                                          // crespo: textura fechada, miúda, com brilhos esparsos
          c = ((x + y) % 2) ? Hb : mix(Hb, Hd, 0.6);
          if ((x * 5 + y * 3) % 7 === 0) c = Hd; else if ((x * 3 + y * 7) % 11 === 0 && y < 12) c = Hl;
        }
        if (rightEdge || bottomEdge) c = c === Hl ? Hb : Hd;
        if (topEdge && x < 12 && tex !== HAIR.coily) c = Hl;
        if (leftEdge && !topEdge && tex === HAIR.straight && y > 9) c = Hb;
        if (hair === 'raspado') c = mix(c, S, 0.45);
        grid[y][x] = c;
      }
    }

    /* ---------- cabelo de trás do corpo (cabelo longo visto de frente) ---------- */
    if (down && backLayer.size) paintHair(k => backLayer.has(k));

    /* ---------- corpo ---------- */
    const arms = (sleeveEnd, color, colorR) => {          // braços, mangas e mãos (de frente/costas)
      const L = stepR ? 1 : 0, Rr = stepL ? 1 : 0;           // o braço oposto à perna que avança vai à frente
      box(aL, 18, aL + 1, 24 - L, S); box(aR, 18, aR + 1, 24 - Rr, Sd); p(aL + 1, 18, S);
      if (sleeveEnd >= 18) { box(aL, 18, aL + 1, Math.min(sleeveEnd, 24 - L), color); box(aR, 18, aR + 1, Math.min(sleeveEnd, 24 - Rr), colorR || shade(color, 0.85)); }
      if (sleeveEnd >= 18 && sleeveEnd < 23) { row(sleeveEnd, aL, aL + 1, shade(color, 0.78)); row(sleeveEnd, aR, aR + 1, shade(color, 0.68)); }   // bainha da manga curta
      if (sleeveEnd >= 23) { row(Math.min(sleeveEnd, 24 - L), aL, aL + 1, Tl); row(Math.min(sleeveEnd, 24 - Rr), aR, aR + 1, shade(Tl, 0.9)); }
      box(aL, 25 - L, aL + 1, 25 - L, S); box(aR, 25 - Rr, aR + 1, 25 - Rr, Sd);           // mãos
    };
    const legs = () => {
      const lEnd = stepL ? 27 : 28, rEnd = stepR ? 27 : 28;
      const leg = (x0, x1, yEnd, c, cd) => {
        if (bottom === 'calca') { box(x0, 25, x1, yEnd, c); p(x1, yEnd, cd); p(x0, 26, cd); }
        else if (bottom === 'short') { box(x0, 25, x1, 26, c); box(x0, 27, x1, yEnd, S); p(x1, yEnd, Sd); }
        else if (bottom === 'saia') { box(x0, 27, x1, yEnd, S); p(x1, yEnd, Sd); }
      };
      if (bottom !== 'saiaLonga') { leg(8, 10, lEnd, B, Bd); leg(13, 15, rEnd, B, Bd); }
      if (bottom === 'calca' || bottom === 'short') { row(24, 7, 16, Bd); row(25, 8, 15, B); p(11, 25, Bd); p(12, 25, Bd); if (down) { p(11, 24, '#d8b040'); p(8, 25, Bd); p(15, 25, Bd); } }
      if (bottom === 'calca') { p(10, 27, Bl); p(13, 27, Bl); for (let y = 26; y <= 27; y++) { p(10, y, Bd); p(13, y, Bd); } }
      if (bottom === 'short') { row(26, 8, 10, Bd); row(26, 13, 15, Bd); }
      if (bottom === 'saia') { row(24, 7, 16, Bd); row(25, 7, 16, B); row(26, 6, 17, B); row(27, 6, 17, Bd); p(9, 26, Bd); p(14, 26, Bd); p(8, 25, Bl); p(11, 26, Bl); }
      if (bottom === 'saiaLonga') { const sw = stepL ? -1 : stepR ? 1 : 0; row(24, 7, 16, Bd); for (let y = 25; y <= 29; y++) row(y, 7 - ((y - 24) >> 1) + (y > 27 ? sw : 0), 16 + ((y - 24) >> 1) + (y > 27 ? sw : 0), B); for (let y = 25; y <= 29; y++) { p(9 + (y > 27 ? sw : 0), y, Bd); p(14 + (y > 27 ? sw : 0), y, Bd); } row(29, 5 + sw, 18 + sw, Bd); p(8, 25, Bl); p(12, 26, Bl); }
      // calçados
      const shoe = (x0, x1, y) => { row(y, x0, x1, SHOE); row(y + 1, x0, x1, SHOE); p(x0, y, SHOEl); };
      if (bottom === 'saiaLonga') { row(30, 7, 10, SHOE); row(30, 13, 16, SHOE); }
      else { shoe(7, 10, lEnd + 1); shoe(13, 16, rEnd + 1); }
    };

    if (side) {
      // perfil: tronco estreito, um braço e pernas em passada
      const swing = stepL ? -1 : stepR ? 1 : 0;
      const legSide = (x0, x1, yEnd, c) => { if (bottom === 'calca') box(x0, 25, x1, yEnd, c); else if (bottom === 'short') { box(x0, 25, x1, 26, c); box(x0, 27, x1, yEnd, S); } else box(x0, 27, x1, yEnd, S); };
      if (bottom !== 'saiaLonga') {
        if (swing) { legSide(7, 9, 27, B); legSide(13, 15, 28, Bd); row(28, 6, 9, SHOE); row(29, 6, 9, SHOE); row(29, 12, 15, SHOE); row(30, 12, 15, SHOE); }
        else { legSide(10, 13, 28, B); row(29, 9, 13, SHOE); row(30, 9, 13, SHOE); p(9, 29, SHOEl); }
      }
      if (bottom === 'calca' || bottom === 'short') row(24, 9, 15, Bd);
      if (bottom === 'saia') { row(24, 9, 15, Bd); row(25, 8, 15, B); row(26, 7, 16, B); row(27, 7, 16, Bd); }
      if (bottom === 'saiaLonga') { for (let y = 24; y <= 29; y++) row(y, 9 - ((y - 24) >> 1) + (y > 27 ? swing : 0), 15 + ((y - 24) >> 1) + (y > 27 ? swing : 0), y === 29 ? Bd : B); row(30, 8, 12, SHOE); }
      // tronco
      const body = top === 'jardineira' ? CREAM : top === 'regata' ? S : T;
      box(9, 18, 15, 23, body); box(15, 18, 15, 23, shade(body, 0.85)); if (masc) box(8, 18, 8, 22, shade(body, 1.04)); if (fem) { p(9, 21, null); p(15, 21, null); }
      if (top === 'regata') { box(10, 19, 15, 23, T); box(15, 19, 15, 23, Td); p(12, 18, T); }
      if (top === 'jardineira') { box(9, 20, 13, 23, T); p(11, 18, T); p(11, 19, T); p(10, 20, '#ffd75e'); }
      if (top === 'camisa') { p(9, 18, Tl); p(10, 18, Tl); box(9, 19, 9, 23, shade(T, 1.1)); }
      if (top === 'moletom') { box(13, 16, 16, 19, Td); p(14, 16, T); row(23, 9, 15, Td); }
      if (top === 'blusa') { p(9, 18, S); p(9, 19, S); row(23, 8, 16, Tl); }
      if (robe) { box(8, 18, 16, 29, T); box(16, 18, 16, 29, Td); row(29, 7, 16, '#ffd75e'); row(30, 8, 12, SHOE); }
      // braço que balança
      const ax = 11 + swing, sl = { camiseta: 20, regata: 17, camisa: 24, blusa: 19, moletom: 24, jardineira: 20, manto: 24 }[top];
      box(ax, 18, ax + 2, 24, S); p(ax + 2, 24, Sd);
      if (sl >= 18) { const sc = top === 'jardineira' ? CREAMd : shade(T, 0.88); box(ax, 18, ax + 2, Math.min(sl, 24), sc); if (sl >= 23) row(24, ax, ax + 2, Tl); }
      if (top === 'blusa') { box(ax - 1, 18, ax + 3, 19, shade(T, 0.9)); }
      box(ax, 25, ax + 2, 25, S);
    } else {
      // tronco de frente/costas
      const body = top === 'jardineira' ? CREAM : T;
      box(7, 18, 16, 23, body); box(16, 18, 16, 23, shade(body, 0.86)); row(18, 7, 7, null); row(18, 16, 16, null); p(8, 18, body); p(15, 18, body);
      if (top === 'camiseta') { row(23, 7, 16, Td); if (down) { row(18, 10, 13, Td); p(10, 19, Td); p(13, 19, Td); p(11, 19, Tl); for (let y = 19; y <= 22; y++) p(15, y, mix(T, Td, 0.6)); p(9, 21, mix(T, Td, 0.5)); } arms(20, T, Td); }
      if (top === 'regata') { box(7, 18, 16, 23, T); box(16, 18, 16, 23, Td); if (down) { box(10, 18, 13, 19, S); p(11, 20, S); p(12, 20, S); } row(18, 7, 8, S); row(18, 15, 16, S); p(9, 18, T); p(14, 18, T); row(23, 7, 16, Td); if (up) { box(9, 18, 14, 18, S); } arms(17, T); }
      if (top === 'camisa') { if (down) { box(11, 18, 12, 23, Tl); p(11, 20, Td); p(11, 22, Td); box(13, 20, 14, 21, Td); p(13, 20, mix(T, Td, 0.4)); p(14, 20, mix(T, Td, 0.4)); p(9, 18, '#ffffff'); p(10, 19, '#ffffff'); p(14, 18, '#ffffff'); p(13, 19, '#ffffff'); p(10, 18, Tl); p(13, 18, Tl); } else { row(18, 8, 15, Tl); row(20, 8, 15, Td); } row(23, 7, 16, Td); arms(24, T, Td); }
      if (top === 'blusa') { if (down) { box(10, 18, 13, 18, S); p(11, 19, S); p(12, 19, S); row(19, 9, 9, Tl); row(19, 14, 14, Tl); } row(22, 7, 16, Td); for (let x = 6; x <= 17; x++) p(x, 23, x % 2 ? Tl : T); arms(19, T, Td); box(aL - 1, 18, aL + 1, 19, T); box(aR, 18, aR + 2, 19, Td); row(18, aL - 1, aL, Tl); }
      if (top === 'moletom') { arms(24, T, Td); if (down) { row(17, 8, 15, Td); p(9, 18, Td); p(14, 18, Td); p(10, 19, CREAM); p(13, 19, CREAM); p(10, 20, CREAM); p(13, 20, CREAM); box(9, 21, 14, 23, Td); box(10, 21, 13, 22, T); } else { box(8, 16, 15, 19, Td); box(9, 17, 14, 18, T); row(23, 7, 16, Td); } }
      if (top === 'jardineira') { arms(20, CREAM, CREAMd); if (down) { box(9, 20, 14, 23, T); box(14, 20, 14, 23, Td); p(9, 18, T); p(9, 19, T); p(14, 18, T); p(14, 19, T); p(9, 20, '#ffd75e'); p(14, 20, '#ffd75e'); box(11, 21, 12, 22, Td); } else { box(7, 21, 16, 23, T); for (let i = 0; i < 3; i++) { p(9 + i, 18 + i, T); p(14 - i, 18 + i, T); } } }
      if (robe) { box(7, 18, 16, 29, T); box(16, 18, 16, 29, Td); box(6, 25, 17, 29, T); if (down) box(11, 18, 12, 29, '#ffd75e'); row(29, 6, 17, '#ffd75e'); row(30, 7, 10, SHOE); row(30, 13, 16, SHOE); arms(24, T, Td); }
      if (!robe) legs();
      if (masc && !robe) for (let y = 18; y <= 23; y++) { if (get(7, y)) p(6, y, get(7, y)); if (get(16, y)) p(17, y, get(16, y)); }   // ombros e peito mais largos
      if (fem && !robe) { for (const y of [21, 22]) { p(7, y, null); p(16, y, null); } p(7, 19, null); p(16, 19, null); }               // cintura marcada e ombros mais estreitos
    }

    /* ---------- manto de folhas sobre os ombros (Lúcio) ---------- */
    if (leaves) {
      // folhas pequenas sobrepostas: cada uma com lado claro, lado escuro e ponta
      const FAM = [['#f3cc58', '#dda23a', '#a86a26'], ['#eea049', '#cf6f2a', '#94461c'], ['#d6703e', '#b24c2a', '#7a2f1c'], ['#b07440', '#86512c', '#58321c']];
      const x0 = side ? 8 : 5, x1 = side ? 16 : 18;
      for (let x = x0; x <= x1; x++) for (let y = 17; y <= 20; y++) p(x, y, y === 20 ? '#94461c' : '#cf6f2a');
      let n = 0;
      for (const yy of [17, 19]) for (let x = x0 + (yy === 19 ? 1 : 0); x <= x1; x += 3, n++) {
        const [l, b, d] = FAM[(n * 3 + (yy >> 1)) % 4];
        p(x, yy, l); p(x + 1, yy, b); p(x, yy + 1, b); p(x + 1, yy + 1, d); p(x + (x < 12 ? 0 : 1), yy + 2, d);
      }
      row(23, side ? 9 : 7, side ? 15 : 16, '#6a3a1a');                      // cinto de corda
      if (down) { p(11, 23, '#e0a530'); p(12, 23, '#e0a530'); }
    }

    /* ---------- pescoço e cabeça ---------- */
    if (side) {
      box(11, 16, 13, 17, Sd);
      row(5, 9, 13, S); row(6, 8, 14, S); box(7, 7, 15, 13, S);
      if (masc) { row(14, 7, 14, S); row(15, 8, 13, S); p(8, 15, Sd); } else if (fem) { row(14, 8, 14, S); row(15, 10, 13, S); } else { row(14, 8, 14, S); row(15, 9, 13, S); }
      box(15, 7, 15, 13, Sd); p(14, 14, Sd); p(13, 15, Sd);
      p(6, 11, S); p(6, 12, Sd);                         // nariz
      p(8, 10, OUT); p(8, 11, OUT); p(9, 10, '#ffffff');  // olho
      if (fem) { p(7, 10, OUT); p(7, 13, mix(S, '#d04060', 0.55)); } if (masc) { row(9, 7, 9, mix(look.hairColor ? Hd : Sd, S, 0.2)); }
      p(7, 13, mix(S, '#c04848', 0.35));                  // boca
      p(9, 12, mix(S, '#e87a7a', 0.25));
      p(13, 10, Sd); p(13, 11, Sd); p(14, 11, S);         // orelha
    } else {
      box(10, 16, 13, 17, Sd); row(17, 10, 13, mix(Sd, S, 0.5));
      row(5, 9, 14, S); row(6, 8, 15, S); box(7, 7, 16, 13, S);
      if (masc) { row(14, 7, 16, S); row(15, 8, 15, S); } else if (fem) { row(14, 8, 15, S); row(15, 10, 13, S); } else { row(14, 8, 15, S); row(15, 9, 14, S); }
      p(6, 10, S); p(6, 11, Sd); p(17, 10, Sd); p(17, 11, Sd);   // orelhas
      if (down) {
        box(16, 7, 16, 13, Sd); p(15, 14, Sd); p(14, 15, Sd); row(15, 10, 13, mix(S, Sd, 0.4));
        if (masc) { p(16, 14, Sd); p(15, 15, Sd); row(15, 9, 14, mix(S, Sd, 0.55)); }                     // maxilar quadrado com sombra
        p(9, 10, OUT); p(9, 11, OUT); p(14, 10, OUT); p(14, 11, OUT); p(10, 10, '#ffffff'); p(15, 10, '#ffffff'); p(15, 11, Sd);
        const blush = fem ? 0.5 : masc ? 0.12 : 0.3;
        p(8, 12, mix(S, '#e87a7a', blush)); p(15, 12, mix(S, '#e87a7a', blush));
        p(12, 12, Sd);
        if (fem) { row(14, 11, 12, mix(S, '#d04060', 0.6)); p(11, 13, mix(S, '#e8909a', 0.3)); p(8, 10, OUT); p(16, 10, OUT); }   // boca rosada e cílios
        else if (masc) row(14, 10, 13, mix(S, '#8a4a40', 0.4));
        else row(14, 11, 12, mix(S, '#b04040', 0.35));
        const brow = hair === 'careca' ? Sd : hair === 'raspado' ? mix(Hd, S, 0.4) : Hd;
        if (fem) { row(9, 9, 10, mix(brow, S, 0.25)); row(9, 13, 14, mix(brow, S, 0.25)); p(8, 9, mix(brow, S, 0.55)); p(15, 9, mix(brow, S, 0.55)); }
        else { row(9, 8, 10, brow); row(9, 13, 15, brow); if (masc) { p(10, 8, mix(brow, S, 0.4)); p(13, 8, mix(brow, S, 0.4)); } }
      } else { box(7, 7, 16, 15, S); box(16, 7, 16, 14, Sd); }
      if (hair === 'careca') { row(6, 9, 11, Sl); p(9, 7, Sl); }
    }

    /* ---------- cabelo da frente ---------- */
    paintHair(k => !(down && backLayer.has(k) && !isFront(k)));
    function isFront(k) { const [x, y] = k.split(',').map(Number); return x <= 7 || x >= 16 || y < 15; }
    // detalhes por estilo
    if (down && hair === 'trancas') { [4, 6, 17, 19].forEach(x => { const yEnd = x === 4 || x === 19 ? 21 : 23; for (let y = 9; y <= yEnd; y++) p(x, y, y % 2 ? Hb : Hd); p(x, yEnd + 1, '#ffd75e'); }); for (let x = 8; x <= 15; x += 2) { p(x, 6, Hd); p(x, 7, Hd); } }
    if (up && hair === 'trancas') { for (const x of [6, 9, 14, 17]) { for (let y = 9; y <= 23; y++) { p(x, y, y % 2 ? Hb : Hd); p(x + 1, y, y % 2 ? Hd : Hl); } row(24, x, x + 1, '#ffd75e'); } for (let y = 3; y <= 14; y++) p(11, y, Hdd); }
    if (side && hair === 'trancas') { for (const x of [13, 15, 17]) { for (let y = 9; y <= 23; y++) p(x, y, y % 2 ? Hb : Hd); p(x, 24, '#ffd75e'); } }
    if (hair === 'rabo') { if (down) { p(17, 8, '#e04a3a'); p(18, 8, '#e04a3a'); } if (up) { row(9, 10, 13, '#e04a3a'); } if (side) { p(16, 9, '#e04a3a'); p(17, 9, '#e04a3a'); } }
    if (hair === 'coque' && !hat) { if (down || up) row(4, 10, 13, '#e04a3a'); else p(14, 5, '#e04a3a'); }
    if (hair === 'topete' && down) { p(16, 8, Hdd); p(7, 8, Hdd); }
    if (hair === 'medio' && down) { for (let x = 8; x <= 15; x++) if (get(x, 9) === Hb || get(x, 9) === Hl) p(x, 9, Hd); }

    /* ---------- acessório ---------- */
    const Ad = shade(A, 0.72), Al = mix(A, '#ffffff', 0.35);
    if (acc === 'oculos') {
      const F = '#2a2a3a', L = 'rgba(0,0,0,0)';
      if (down) { row(9, 8, 10, F); row(9, 13, 15, F); p(8, 10, F); p(8, 11, F); p(10, 11, F); p(13, 11, F); p(15, 10, F); p(15, 11, F); row(12, 8, 10, F); row(12, 13, 15, F); p(11, 10, F); p(12, 10, F); p(7, 10, F); p(16, 10, F); }
      else if (side) { row(9, 7, 9, F); row(12, 7, 9, F); p(7, 10, F); p(7, 11, F); p(10, 10, F); p(10, 11, F); row(10, 11, 13, F); }
      else { p(6, 10, F); p(17, 10, F); p(6, 9, F); p(17, 9, F); }
    }
    const bow = (x0, y0) => { box(x0, y0, x0 + 1, y0 + 2, A); p(x0 + 2, y0 + 1, Ad); box(x0 + 3, y0, x0 + 4, y0 + 2, A); p(x0, y0, Al); p(x0 + 3, y0, Al); };
    if (acc === 'laco' && !hat) { if (down) bow(13, 2); else if (up) bow(6, 2); else bow(11, 1); }
    if (acc === 'bandana' && !hat) {
      if (down || up) { row(6, 7, 16, A); row(7, 6, 17, A); row(6, 9, 14, Al); if (up) { p(11, 8, Ad); p(12, 8, Ad); p(10, 9, A); p(13, 9, A); p(10, 10, Ad); p(13, 10, Ad); } }
      else { row(6, 8, 15, A); row(7, 7, 16, A); row(6, 9, 12, Al); p(16, 8, Ad); p(17, 8, A); p(17, 9, A); p(18, 10, Ad); }
    }
    if (acc === 'cachecol') {
      if (down) { row(16, 8, 15, A); row(17, 8, 15, Ad); row(16, 9, 12, Al); box(8, 18, 9, 22, A); p(8, 23, Al); p(9, 23, Ad); p(9, 20, Ad); }
      else if (up) { row(16, 8, 15, A); row(17, 8, 15, Ad); }
      else { row(16, 10, 14, A); row(17, 10, 14, Ad); box(14, 18, 15, 21, A); p(15, 22, Ad); }
    }

    /* ---------- chapéu ---------- */
    if (hat === 'palha') {
      const st = '#e8c860', sd = '#c8a040', sl = '#f6e090', band = '#8a3a2a';
      box(8, 1, 15, 4, st); row(1, 9, 14, sl); for (let x = 8; x <= 15; x += 2) p(x, 3, sd); row(5, 8, 15, band);
      if (side) { row(6, 3, 16, st); row(7, 4, 16, sd); p(3, 6, sd); }
      else { row(6, 4, 19, st); row(7, 3, 20, sd); if (down) { row(6, 8, 15, sl); row(7, 7, 16, null); for (let x = 7; x <= 16; x++) if (!get(x, 7)) p(x, 7, x >= 8 && x <= 15 ? S : null); } }
    } else if (hat === 'boina') {
      const c = '#c8483a', cd = '#962e24', cl = '#e66a5c';
      if (side) { box(6, 3, 16, 5, c); row(2, 8, 15, c); row(2, 9, 12, cl); p(5, 5, c); p(5, 6, cd); row(6, 7, 15, cd); p(12, 1, cd); }
      else { box(6, 3, 17, 5, c); row(2, 8, 16, c); row(2, 9, 13, cl); p(18, 4, c); p(18, 5, cd); p(19, 5, cd); row(6, 6, 17, cd); p(12, 1, cd); }
    } else if (hat === 'pescador') {
      const c = '#8a9a6a', cd = '#64744a', cl = '#a8b886';
      if (side) { box(7, 2, 15, 5, c); row(2, 8, 14, cl); row(6, 4, 16, cd); row(7, 3, 9, cd); }
      else { box(7, 2, 16, 5, c); row(2, 8, 15, cl); row(5, 7, 16, cd); row(6, 5, 18, c); row(7, 4, 19, cd); }
    } else if (hat === 'chef') {
      box(7, 0, 16, 4, '#f8f8f8'); row(0, 8, 15, '#ffffff'); box(16, 1, 16, 4, '#d8d8e4'); row(5, 6, 17, '#e8e8f0');
    }
    // com chapéu, o laço vai na fita do chapéu e a bandana aparece por baixo da aba
    if (hat && acc === 'laco') { if (down) bow(15, 2); else if (up) bow(4, 2); else bow(13, 2); }
    if (hat && acc === 'bandana') {
      if (down) { row(8, 7, 16, A); p(7, 9, Ad); p(16, 9, Ad); }
      else if (up) { row(8, 6, 17, A); p(11, 9, Ad); p(12, 9, Ad); p(11, 10, A); p(12, 10, A); }
      else { row(8, 9, 16, A); p(16, 9, Ad); p(17, 9, A); p(17, 10, Ad); }
    }
    /* ---------- barba cheia e grisalha (Lúcio) ---------- */
    if (look.beard === 'cheia') {
      const BL = '#eee8e2', BB = '#c4bab4', BD = '#8d7f7a', MO = '#5a3430';
      if (down) {
        // barba: laterais cheias, base ondulada, luz à esquerda e sombra à direita
        const span = { 12: [7, 7], 13: [7, 7], 14: [7, 16], 15: [7, 16], 16: [7, 16], 17: [7, 16], 18: [8, 16], 19: [8, 15], 20: [8, 15], 21: [9, 14] };
        for (const y in span) { const [a, b] = span[y]; for (let x = a; x <= b; x++) p(x, +y, x <= 9 ? BL : x >= 14 ? BD : BB); }
        p(16, 12, BD); p(16, 13, BD); p(10, 21, null); p(13, 21, null); p(9, 22, BB); p(11, 22, BB); p(12, 22, BD); p(14, 22, BD);
        p(10, 17, BD); p(13, 18, BD); p(11, 20, BD); p(12, 16, BD);                 // divisões entre tufos
        // bigode separado da barba, caindo nas pontas
        row(13, 9, 14, BL); p(8, 14, BL); p(15, 14, BB); p(8, 13, BB); p(15, 13, BB);
        row(14, 9, 14, BD); p(11, 15, MO); p(12, 15, MO);
        row(9, 8, 10, BL); row(9, 13, 15, BL); p(8, 10, BD); p(15, 10, BD);      // sobrancelhas grossas
      } else if (side) {
        const span = { 10: [12, 12], 11: [12, 13], 12: [12, 13], 13: [6, 13], 14: [6, 12], 15: [6, 12], 16: [6, 11], 17: [6, 11], 18: [7, 11], 19: [7, 10], 20: [7, 10], 21: [8, 9] };
        for (const y in span) { const [a, b] = span[y]; for (let x = a; x <= b; x++) p(x, +y, x <= 7 ? BL : x >= 10 ? BD : BB); }
        p(9, 16, BD); p(8, 19, BD);
        row(12, 4, 8, BL); p(4, 13, BB); row(13, 6, 8, BD); p(6, 14, MO);           // bigode à frente
        row(9, 7, 9, BL); p(9, 10, BD);
      } else { p(6, 15, BB); p(17, 15, BD); p(6, 16, BB); p(17, 16, BD); p(6, 17, BD); p(17, 17, BD); }
    }
    if (look.beard === true) { for (let y = 12; y <= 18; y++) row(y, y < 16 ? 7 : 9 + (y - 16), y < 16 ? 16 : 14 - (y - 16), y % 2 ? '#eeeef4' : '#d8d8e4'); p(11, 14, '#b8b8c8'); p(12, 14, '#b8b8c8'); }

    /* ---------- contorno ---------- */
    const filled = grid.map(r => r.map(Boolean));
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (filled[y][x]) continue;
      if ((filled[y - 1] && filled[y - 1][x]) || (filled[y + 1] && filled[y + 1][x]) || filled[y][x - 1] || filled[y][x + 1]) grid[y][x] = OUT;
    }
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (grid[y][x]) { g.fillStyle = grid[y][x]; g.fillRect(x, y, 1, 1); }
    return c;
  }

  /* Retratos próprios (ex.: Lúcio) ficam em js/portraits.js e se registram aqui. */
  const PORTRAITS = {};
  /* Canvas novo (para painéis) com o retrato. */
  function portrait(id, expr) { const src = PORTRAITS[id](expr), c = document.createElement('canvas'); c.width = src.width; c.height = src.height; c.className = 'pixel'; c.getContext('2d').drawImage(src, 0, 0); return c; }

  const flipped = img => {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'); g.translate(W, 0); g.scale(-1, 1); g.drawImage(img, 0, 0);
    return c;
  };
  /* Quadros por direção: [parado, passo esquerdo, passo direito]. */
  const cache = new Map();
  function frames(look) {
    const key = JSON.stringify(look);
    if (!cache.has(key)) {
      const set = dir => [0, 1, 2].map(f => render(look, f, dir));
      const down = set('down'), up = set('up'), left = set('side');
      cache.set(key, { down, up, left, right: left.map(flipped) });
      if (cache.size > 80) cache.delete(cache.keys().next().value);
    }
    return cache.get(key);
  }

  const WALK = [1, 0, 2, 0];
  /* Desenha com o canto superior esquerdo em (x, y). dir: 'down' | 'up' | 'left' | 'right'. */
  function draw(ctx, look, x, y, frame = 0, dir = 'down') {
    const set = frames(look)[dir] || frames(look).down;
    ctx.drawImage(set[Math.abs(frame) % 3 | 0], Math.round(x), Math.round(y));
  }
  /* Desenha com os pés em (x, y). */
  const drawAt = (ctx, look, x, y, frame = 0, dir = 'down') => draw(ctx, look, x - W / 2, y - H + 1, frame, dir);
  const walk = t => WALK[Math.floor(t / 130) % 4];
  /* Pequeno canvas com o personagem, para painéis. */
  function canvas(look, dir = 'down', frame = 0) {
    const c = document.createElement('canvas'); c.className = 'pixel'; c.width = W; c.height = H;
    draw(c.getContext('2d'), look, 0, 0, frame, dir);
    return c;
  }

  /* Aparência sorteada (só as escolhas visuais). */
  function randomLook(base) {
    const r = list => list[Math.floor(Math.random() * list.length)];
    const look = Object.assign({}, base, {
      skin: r(SKINS).id, hair: r(HAIRS).id, hairColor: r(HAIR_COLORS.slice(0, 6)).id,
      top: r(TOPS).id, topColor: r(CLOTH_COLORS), bottom: r(BOTTOMS).id, bottomColor: r(CLOTH_COLORS),
      shoeColor: r(SHOE_COLORS), accessory: Math.random() < 0.5 ? null : r(ACCESSORIES).id, accColor: r(CLOTH_COLORS),
    });
    if (look.bottomColor === look.topColor) look.bottomColor = r(CLOTH_COLORS.filter(c => c !== look.topColor));
    return look;
  }

  return { genderPreset, portrait, PORTRAITS, W, H, SKINS, HAIR_COLORS, HAIRS, GENDERS, TOPS, BOTTOMS, ACCESSORIES, CLOTH_COLORS, SHOE_COLORS, HATS, draw, drawAt, frames, walk, canvas, randomLook };
})();
