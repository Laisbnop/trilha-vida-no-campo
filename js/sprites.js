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
  /* Grade dos personagens: a mesma do cenário (um pixel do sprite = um pixel do mundo), com os pés na linha 30.
     Corpo, rosto, roupas e calçados são desenhados direto nessa grade; cabelos, chapéus e acessórios são
     descritos na grade de criação de 24x32 e convertidos sem as linhas dropRows e as colunas dropCols.
     Mapa, prévia, painéis e menus usam exatamente o mesmo desenho. ox/oy convertem uma posição do corpo
     (mão, cabeça, boca) dada na grade de criação, em relação aos pés, para a grade final. */
  const WORLD = { scale: 0.88, dropRows: [3, 8, 21, 28], dropCols: [7, 16] };
  WORLD.oy = dy => dy + WORLD.dropRows.filter(k => k > H - 1 + dy).length;
  WORLD.ox = dx => { const c = W / 2 + dx, pad = Math.floor(WORLD.dropCols.length / 2); return dx - WORLD.dropCols.filter(k => k < c).length + pad; };
  const OUT = '#2a1a14';
  const LEGDUP = 26, ADULT_LIFT = 2;          // linha da canela repetida nos adultos (de saia: a linha da perna logo acima do calçado) e quanto o corpo deles sobe

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
  const EXTRA_HAIR = [{ id: 'cinzaQuente', name: 'Grisalho quente', c: ['#c4bab4', '#8d7f7a', '#eee8e2'] }, { id: 'pretoQuente', name: 'Preto quente', c: ['#3c3238', '#1c1418', '#625660'] }];
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
  /* 19 penteados, de estilos tradicionalmente masculinos a femininos — todos livres para qualquer gênero. */
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
    { id: 'longoVolumoso', name: 'Longo em ondas' },
    { id: 'medioLateral',  name: 'Médio com franja lateral' },
    { id: 'emo',           name: 'Emo com franja longa' },
  ];
  /* Na criação: Feminino e Masculino. Jogos salvos com a base neutra ('n') continuam valendo (GENDER_PRESETS.n e body 'n'). */
  const GENDERS = [{ id: 'f', name: 'Feminino' }, { id: 'm', name: 'Masculino' }];
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
  /* Cor do cabelo por barras (HSL, valores de 0 a 100): uma paleta de base, sombra e luz gerada da cor escolhida.
     Nos extremos (quase preto ou quase branco), a sombra e a luz se afastam mais da base, para o volume continuar legível. */
  const hslHex = (h, s, l) => { const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)); return toHex([f(0), f(8), f(4)].map(v => v * 255)); };
  function hairPalette([H, S, L]) {
    const h = (H % 100) * 3.6, s = Math.max(0, Math.min(1, S / 100)), l = Math.max(0.02, Math.min(0.98, L / 100));
    const sh = l < 0.2 ? l * 0.42 : l > 0.85 ? l - 0.22 : l - Math.max(0.1, l * 0.32);
    const li = l > 0.85 ? Math.min(0.99, l + 0.08) : l < 0.2 ? l + 0.16 : l + Math.max(0.1, (1 - l) * 0.3);
    return [hslHex(h, s, l), hslHex(h, Math.min(1, s * 1.05), Math.max(0, sh)), hslHex(h, s * 0.85, li)];
  }
  function hexToHsl(hx) {
    const [r, g, b] = hex(hx).map(v => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
    let h = 0, s = 0;
    if (d) { s = d / (1 - Math.abs(2 * l - 1)); h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360; }
    return [Math.round(h / 3.6), Math.round(s * 100), Math.round(l * 100)];
  }
  /* Cor atual do cabelo em HSL (para as barras): a escolhida ou, em jogos antigos, a da cor de cabelo pronta. */
  const hairHslOf = look => (Array.isArray(look.hairHsl) ? look.hairHsl.slice() : hexToHsl(byId(HAIR_COLORS.concat(EXTRA_HAIR), look.hairColor).c[0]));
  const ell = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;

  function render(look, frame, dir) {
    /* Grade única para tudo (a mesma do mundo): corpo, rosto, roupas e calçados são desenhados direto nela (q*).
       Cabelo, chapéus, acessórios, barba e manto de folhas continuam descritos na grade de criação (24x32, p*),
       convertidos ponto a ponto: as linhas e colunas de WORLD não existem na grade final. Prévia e mapa usam este mesmo desenho. */
    const grid = Array.from({ length: H }, () => Array(W).fill(null));
    const DR = WORLD.dropRows, DC = WORLD.dropCols, PADX = Math.floor(DC.length / 2);
    const mapY = y => (DR.includes(y) ? null : y + DR.filter(d => d > y).length);
    const mapX = x => (DC.includes(x) ? null : x - DC.filter(d => d < x).length + PADX);
    const inb = (x, y) => x >= 1 && x < W - 1 && y >= 0 && y < H - 1;
    const p = (x, y, c) => { if (!inb(x, y)) return; const X = mapX(x), Y = mapY(y); if (X !== null && Y !== null) grid[Y][X] = c; };
    const row = (y, x0, x1, c) => { for (let x = x0; x <= x1; x++) p(x, y, c); };
    const box = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) row(y, x0, x1, c); };
    const get = (x, y) => { if (!inb(x, y)) return null; const X = mapX(x), Y = mapY(y); return X === null || Y === null ? null : grid[Y][X]; };
    const q = (x, y, c) => { if (x >= 1 && x < W - 1 && y >= 0 && y < H - 1) grid[y][x] = c; };
    const qrow = (y, x0, x1, c) => { for (let x = x0; x <= x1; x++) q(x, y, c); };
    const qbox = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) qrow(y, x0, x1, c); };
    const qget = (x, y) => (y >= 0 && y < H && x >= 0 && x < W ? grid[y][x] : null);

    const [S, Sd, Sl] = byId(SKINS, look.skin).c;
    const [Hb, Hd, Hl] = Array.isArray(look.hairHsl) ? hairPalette(look.hairHsl) : byId(HAIR_COLORS.concat(EXTRA_HAIR), look.hairColor).c;   // barras (HSL) ou cor pronta (jogos antigos e moradores)
    const Hdd = shade(Hd, 0.75);
    const robe = look.top === 'manto';
    const leaves = look.top === 'folhas';                    // traje de Lúcio: camisa de mangas longas + manto de folhas
    const open = look.top === 'camisaAberta';                // Caleb: camisa vinho aberta, mangas dobradas, sobre camiseta preta
    const IN = look.innerColor || '#1e1a22', INl = mix(IN, '#ffffff', 0.12), CUFF = mix(look.topColor || '#6a2430', '#e8b0b8', 0.35);
    const top = robe ? 'manto' : leaves ? 'camisa' : open ? 'camisaAberta' : byId(TOPS, look.top).id, bottom = byId(BOTTOMS, look.bottom).id;
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
          case 'emo':                                   // camadas lisas e assimétricas; franja longa em diagonal cobrindo parte de um olho; pontas bem definidas
            crown(8, 0.8); [[11, 2], [15, 3], [7, 4]].forEach(([x, y]) => add(x, y));
            addRect(6, 8, 12, 9); addRect(6, 10, 10, 10); addRect(6, 11, 8, 11); addRect(6, 12, 7, 13); add(8, 12);
            addRect(5, 8, 7, 15); addRect(16, 8, 18, 14); [[4, 12], [4, 14], [5, 16], [7, 16], [6, 17], [17, 15], [18, 15], [19, 11], [19, 13], [17, 16]].forEach(([x, y]) => add(x, y)); break;
          case 'longoVolumoso':                         // longo, volumoso, ondas em camadas, mechas emoldurando o rosto e pontas viradas para fora
            tex = HAIR.wavy; crown(8, 1.1);
            for (let y = 8; y <= 23; y++) { const o = ((y + 1) >> 1) % 2; addRect(4 - o, y, 7, y); addRect(16, y, 19 + o, y); }
            [[7, 10], [7, 11], [8, 9], [16, 10], [16, 11], [15, 9], [2, 23], [3, 24], [21, 23], [20, 24]].forEach(([x, y]) => add(x, y));
            cut((x, y) => y >= 23 && (x === 7 || x === 16));
            for (let y = 15; y <= 23; y++) for (let x = 6; x <= 17; x++) backLayer.add(x + ',' + y); break;
          case 'medioLateral':                          // na altura do queixo, risca lateral, franja varrida para o lado e pontas em camadas
            crown(8, 0.8); addRect(10, 8, 16, 8); addRect(11, 9, 16, 9); add(15, 10); add(16, 10);
            addRect(5, 8, 7, 16); addRect(16, 8, 18, 17); [[6, 17], [4, 14], [17, 18], [19, 15], [19, 12]].forEach(([x, y]) => add(x, y)); cut((x, y) => x === 5 && y === 16); break;
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
        if (hair === 'longoVolumoso') { tex = HAIR.wavy; for (let y = 9; y <= 23; y++) { const o = ((y + 1) >> 1) % 2; addRect(4 - o, y, 19 + o, y); } [[2, 23], [21, 23], [3, 24], [20, 24]].forEach(([x, y]) => add(x, y)); cut((x, y) => y >= 23 && x >= 8 && x <= 15 && (x + y) % 3 === 0); }
        if (hair === 'medioLateral') { addRect(6, 9, 17, 16); [[6, 17], [9, 17], [14, 17], [17, 17], [5, 13], [18, 14]].forEach(([x, y]) => add(x, y)); for (let y = 3; y <= 8; y++) add(13, y); }
        if (hair === 'emo') { addRect(6, 9, 17, 15); [[7, 16], [10, 16], [13, 16], [16, 16], [10, 2], [14, 2], [5, 12], [18, 12]].forEach(([x, y]) => add(x, y)); }
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
          case 'longoVolumoso': tex = HAIR.wavy; sideCrown(1.0); for (let y = 9; y <= 23; y++) addRect(12, y, 18 + (((y + 1) >> 1) % 2), y); [[7, 9], [7, 10], [8, 9], [19, 24], [20, 23]].forEach(([x, y]) => add(x, y)); cut((x, y) => y >= 23 && x === 12); break;
          case 'medioLateral': sideCrown(0.8); addRect(12, 9, 17, 16); [[13, 17], [16, 17], [18, 14], [7, 8], [8, 8], [7, 9]].forEach(([x, y]) => add(x, y)); break;
          case 'emo': sideCrown(0.8); addRect(12, 9, 17, 15); [[6, 8], [7, 8], [6, 9], [7, 9], [8, 9], [14, 16], [17, 16], [18, 13], [10, 2], [15, 3]].forEach(([x, y]) => add(x, y)); break;
          case 'juba': tex = HAIR.wavy; sideCrown(0.9); addRect(12, 9, 17, 15); [[19, 12], [19, 15], [13, 18], [16, 18], [7, 8], [8, 9], [10, 2], [16, 3]].forEach(([x, y]) => add(x, y)); break;
        }
      }
      if (hat) cut((x, y) => y < (hat === 'gorro' ? 7 : 5) || (y < (hat === 'gorro' ? 8 : 6) && x > 5 && x < 18));          // o chapéu assenta sobre o cabelo
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

    /* ---------- máscara do cabelo na grade final ---------- */
    const hm = new Set(), back2 = new Set();
    const conv = k => { const [x, y] = k.split(',').map(Number), X = mapX(x), Y = mapY(y); return X === null || Y === null ? null : X + ',' + Y; };
    for (const k of mask) { const k2 = conv(k); if (k2) hm.add(k2); }
    for (const k of backLayer) { const k2 = conv(k); if (k2 && hm.has(k2)) back2.add(k2); }
    const hh = (x, y) => hm.has(x + ',' + y);
    if (look.__hairProbe) return { hm: [...hm], back: [...back2], tex: ['', 'straight', 'wavy', 'curly', 'coily'][tex] || 'straight' };   // só a máscara do cabelo (para o desenho em alta definição)

    /* pinta o cabelo com luz, sombra e textura do tipo de cabelo (mechas, ondas, cachos ou crespo) */
    function paintHair(only) {
      for (const k of hm) {
        if (only && !only(k)) continue;
        const [x, y] = k.split(',').map(Number);
        const topEdge = !hh(x, y - 1), rightEdge = !hh(x + 1, y), bottomEdge = !hh(x, y + 1), leftEdge = !hh(x - 1, y);
        let c = Hb;
        if (hair === 'juba') {                              // mechas grossas que caem para os lados a partir da risca
          const out = x < 12 ? -1 : 1, lockPos = ((x + out * Math.floor(y / 3) + 30) % 3);
          c = lockPos === 0 ? Hl : lockPos === 1 ? Hb : Hd;
          if (y <= 10 && (x === 11 || x === 12)) c = Hd;
          if (y >= 15) c = lockPos === 2 ? Hd : Hb;
        } else if (tex === HAIR.straight) {                // mechas retas a cada 3 colunas (abrindo para fora abaixo das orelhas) e um arco de brilho
          const lean = y > 14 ? (x < 12 ? 1 : 2) : 0;
          if ((x + lean) % 3 === 0 && !topEdge) c = Hd;
          const arc = 8 + (Math.abs(x - 11.5) > 3.5 ? 1 : 0) + (Math.abs(x - 11.5) > 5.5 ? 1 : 0);
          if (y === arc && x >= 7 && x <= 16) c = Hl; else if (y === arc + 1 && x >= 9 && x <= 14 && c !== Hd) c = mix(Hb, Hl, 0.5);
          if (y >= 19 && (x + y) % 4 === 0) c = Hd;
        } else if (tex === HAIR.wavy) {                   // ondas: faixas de luz e sombra que serpenteiam
          const w = (((y + Math.round(Math.sin(x * 1.1) * 1.4)) % 4) + 4) % 4;
          c = w === 0 ? Hd : w === 2 ? (y < 18 ? Hl : Hb) : Hb;
        } else if (tex === HAIR.curly) {                  // cachos: espirais em xadrez com o centro iluminado
          const off = (Math.floor(y / 3) % 2) ? 2 : 0, u = (x + off) % 3, v = y % 3;
          c = u === 1 && v === 1 ? Hl : (u === 0 || v === 0) ? Hd : Hb;
          if (u === 2 && v === 2) c = mix(Hb, Hd, 0.5);
        } else {                                          // crespo: textura fechada, miúda, com brilhos esparsos
          c = ((x + y) % 2) ? Hb : mix(Hb, Hd, 0.6);
          if ((x * 5 + y * 3) % 7 === 0) c = Hd; else if ((x * 3 + y * 7) % 11 === 0 && y < 14) c = Hl;
        }
        if (rightEdge || bottomEdge) c = c === Hl ? Hb : Hd;
        if (topEdge && x < 12 && tex !== HAIR.coily) c = Hl;
        if (leftEdge && !topEdge && tex === HAIR.straight && y > 11) c = Hb;
        if (hair === 'raspado') c = mix(c, S, 0.45);
        if (hair === 'medioLateral' && down && x === 10 && y <= 10 && y >= 7) c = Hd;      // risca lateral
        if (hair === 'emo' && look.streak) {               // mecha prateada (opcional), na franja
          const st = down ? (x === 8 && y >= 10 && y <= 14) || (x === 9 && y >= 8 && y <= 10) : up ? false : (x === 9 && y >= 8 && y <= 10) || (x === 8 && y === 11);
          if (st) c = topEdge || y < 10 ? '#e6e2ea' : '#b8b4c0';
        }
        grid[y][x] = c;
      }
    }

    /* ---------- cabelo de trás do corpo (cabelo longo visto de frente) ---------- */
    if (down && back2.size) paintHair(k => back2.has(k));

    /* =========== CORPO (grade final) ===========
       Cabeça: linhas 8–17 (olhos em 12–13); pescoço 18–19; tronco 20–24; cós 25; pernas 26–28; calçados 29–30 (pés na linha 30).
       Luz vinda da esquerda: lado esquerdo claro, direito em sombra; cada parte (braço, tronco, perna, calçado) com
       uma linha de sombra na borda que encosta na vizinha, para não se fundirem. */
    const SHd = shade(SHOE, 0.7), Tdd = shade(T, 0.62);
    const torso = top === 'jardineira' ? CREAM : T, torsoD = top === 'jardineira' ? CREAMd : Td;
    const SL = { camiseta: 22, regata: 0, camisa: 25, blusa: 21, moletom: 25, jardineira: 22, camisaAberta: 22, manto: 25 }[top];
    const sleeveC = top === 'jardineira' ? CREAM : T, sleeveD = top === 'jardineira' ? CREAMd : Td;
    const brow = hair === 'careca' ? Sd : hair === 'raspado' ? mix(Hd, S, 0.4) : Hd;
    const lEnd = stepL ? 26 : 28, rEnd = stepR ? 26 : 28;         // de frente: o pé que dá o passo sobe (joelho dobrado)
    const shoeAt = (x0, x1, y) => { qrow(y, x0, x1, SHOE); q(x0, y, SHOEl); qrow(y + 1, x0, x1, SHd); };

    if (!side) {
      const t0 = masc ? 7 : 8, t1 = masc ? 16 : 15;             // tronco; braços nas duas colunas de cada lado
      /* pescoço */
      qbox(10, 18, 13, 19, Sd); qrow(19, 10, 13, mix(Sd, S, 0.45)); q(13, 19, Sd);
      /* pernas, saia e calçados */
      if (!robe) {
        if (bottom === 'calca') {
          qrow(26, 8, 15, B); q(8, 26, Bl); q(11, 26, Bd); q(12, 26, Bd);
          qbox(8, 27, 10, lEnd, B); for (let y = 27; y <= lEnd; y++) { q(8, y, Bl); q(10, y, Bd); }
          qbox(13, 27, 15, rEnd, B); for (let y = 27; y <= rEnd; y++) q(15, y, Bd);
        } else if (bottom === 'short') {
          qrow(26, 8, 15, B); q(8, 26, Bl); q(11, 26, Bd); q(12, 26, Bd); qrow(27, 8, 10, Bd); qrow(27, 13, 15, Bd);
          if (lEnd > 27) { q(9, 28, S); q(10, 28, Sd); } if (rEnd > 27) { q(13, 28, S); q(14, 28, Sd); }
        } else if (bottom === 'saia') {
          qrow(26, 7, 16, B); q(7, 26, Bl); q(8, 26, Bl); q(10, 26, Bd); q(13, 26, Bd); q(16, 26, Bd);
          qrow(27, 7, 16, Bd); q(8, 27, B); q(11, 27, B); q(14, 27, B);
          if (lEnd > 27) { q(9, 28, S); q(10, 28, Sd); } if (rEnd > 27) { q(13, 28, S); q(14, 28, Sd); }
        } else {                                              // saia longa: balança com o passo
          const sw = stepL ? -1 : stepR ? 1 : 0;
          qrow(26, 8, 15, B); qrow(27, 7, 16, B); qrow(28, 7 + sw, 16 + sw, B); qrow(29, 6 + sw, 17 + sw, Bd);
          q(8, 26, Bl); q(10, 27, Bd); q(13, 27, Bd); q(10 + sw, 28, Bd); q(13 + sw, 28, Bd); q(16, 27, Bd); q(16 + sw, 28, Bd); q(8 + sw, 28, Bl);
        }
        qrow(25, 8, 15, Bd);                                  // cós
        if (bottom === 'calca' && down) { q(11, 25, '#d8b040'); q(12, 25, '#a8842c'); }   // fivela
        if (bottom === 'saiaLonga') { if (!stepL) qrow(30, 8, 10, SHOE); if (!stepR) qrow(30, 13, 15, SHOE); }
        else { shoeAt(7, 10, lEnd + 1); shoeAt(13, 16, rEnd + 1); }
      }
      /* tronco */
      qbox(t0, 20, t1, 24, torso); for (let y = 20; y <= 24; y++) q(t1, y, shade(torso, 0.86)); q(t0, 20, mix(torso, '#ffffff', 0.2));
      qrow(24, t0, t1, torsoD);
      if (fem && !robe) { q(t0, 23, null); q(t1, 23, null); }   // cintura marcada
      if (top === 'camiseta') {
        if (down) { qrow(20, 10, 13, Td); q(11, 21, Tl); for (let y = 21; y <= 23; y++) q(t1 - 1, y, mix(T, Td, 0.5)); q(9, 22, mix(T, Td, 0.5)); }
        else qrow(20, 10, 13, Td);
      }
      if (top === 'regata') {
        qbox(t0, 20, t1, 20, S); q(9, 20, T); q(14, 20, T);
        if (down) { qbox(10, 21, 13, 21, S); q(11, 22, S); q(12, 22, S); q(10, 22, Td); q(13, 22, Td); }
      }
      if (top === 'camisa' || leaves) {
        if (down) { qbox(11, 21, 12, 24, Tl); q(11, 22, Td); q(11, 24, Td); q(9, 20, '#ffffff'); q(10, 21, '#ffffff'); q(14, 20, '#ffffff'); q(13, 21, '#ffffff'); q(10, 20, Tl); q(13, 20, Tl); q(11, 20, S); q(12, 20, Sd); q(13, 22, mix(T, Td, 0.4)); q(14, 22, mix(T, Td, 0.4)); q(13, 23, Td); q(14, 23, Td); }
        else { qrow(20, t0 + 1, t1 - 1, Tl); qrow(22, t0, t1, Td); }
      }
      if (top === 'blusa') {
        if (down) { qrow(20, 10, 13, S); q(11, 21, S); q(12, 21, Sd); q(9, 21, Tl); q(14, 21, Tl); q(10, 21, T); q(13, 21, T); }
        qrow(23, t0 + (fem ? 1 : 0), t1 - (fem ? 1 : 0), Td); for (let x = t0 - 1; x <= t1 + 1; x++) q(x, 24, x % 2 ? Tl : T);   // babado na barra
      }
      if (top === 'moletom') {
        if (down) { qrow(19, 9, 14, Td); q(9, 20, Td); q(14, 20, Td); q(10, 21, CREAM); q(13, 21, CREAM); q(10, 22, CREAMd); q(13, 22, CREAMd); qrow(23, 9, 14, Td); qrow(24, 9, 14, Td); qrow(23, 10, 13, T); }
        else { qbox(8, 18, 15, 21, Td); qbox(9, 19, 14, 20, T); q(9, 19, Tl); }
      }
      if (top === 'jardineira') {
        if (down) { qbox(9, 22, 14, 24, T); for (let y = 22; y <= 24; y++) q(14, y, Td); q(9, 20, T); q(9, 21, T); q(14, 20, T); q(14, 21, T); q(9, 22, '#ffd75e'); q(14, 22, '#ffd75e'); q(11, 23, Td); q(12, 23, Td); q(10, 22, Tl); }
        else { qbox(t0, 23, t1, 24, T); [[9, 20], [10, 21], [11, 22], [14, 20], [13, 21], [12, 22]].forEach(([x, y]) => q(x, y, T)); }
      }
      if (open) {
        if (down) { qbox(10, 20, 13, 24, IN); q(10, 20, INl); q(11, 21, INl); q(9, 20, Tl); q(14, 20, Tl); q(9, 21, Tl); q(14, 21, shade(Tl, 0.9)); q(10, 21, '#9a9aa6'); q(13, 21, '#9a9aa6'); q(11, 22, '#d8d6e0'); q(12, 22, '#a8a6b2'); for (let y = 22; y <= 24; y++) { q(9, y, Td); q(14, y, Tdd); } }
        else { qrow(20, t0 + 1, t1 - 1, Tl); for (let y = 21; y <= 24; y++) q(11, y, Td); }
      }
      if (robe) { qbox(t0, 20, t1, 29, T); qbox(t1, 20, t1, 29, Td); qbox(t0 - 1, 25, t1 + 1, 29, T); if (down) qbox(11, 20, 12, 29, '#ffd75e'); qrow(29, t0 - 1, t1 + 1, '#ffd75e'); qrow(30, 8, 10, SHOE); qrow(30, 13, 15, SHOE); }
      /* braços: coluna de fora em luz, a de dentro (junto ao tronco) em sombra; o braço do lado do pé parado vai à frente */
      const arm = (xo, xi, lift, dark) => {
        const end = 25 - lift, sc = dark ? sleeveD : sleeveC, sci = dark ? shade(sleeveD, 0.85) : sleeveD, sk = dark ? Sd : S;
        for (let y = 20; y <= end; y++) { const sl = SL && y <= SL; q(xo, y, sl ? sc : sk); q(xi, y, sl ? sci : Sd); }
        if (SL && SL < 25) { q(xo, SL, shade(sc, 0.8)); q(xi, SL, shade(sc, 0.68)); }
        if (SL >= 25) { const cuff = top === 'moletom' ? sleeveD : Tl; q(xo, end, dark ? shade(cuff, 0.88) : cuff); q(xi, end, shade(cuff, 0.8)); }
        if (open && end >= 23) { q(xo, 23, dark ? shade(CUFF, 0.85) : CUFF); q(xi, 23, shade(CUFF, 0.8)); }
        q(xo, 20, null);                                       // ombro arredondado
        if (SL) q(xi, 20, sci);
        q(xo, end + 1, sk); q(xi, end + 1, Sd);                // mão
      };
      for (let y = 21; y <= 23; y++) { if (qget(t0, y)) q(t0, y, shade(torso, 0.72)); if (qget(t1, y)) q(t1, y, shade(torso, 0.66)); }   // vinco entre tronco e braço
      arm(t0 - 2, t0 - 1, stepR ? 1 : 0, false); arm(t1 + 2, t1 + 1, stepL ? 1 : 0, true);
      if (top === 'blusa') { qbox(t0 - 3, 20, t0 - 1, 21, T); q(t0 - 3, 20, null); q(t0 - 2, 20, Tl); q(t0 - 3, 21, Tl); qbox(t1 + 1, 20, t1 + 3, 21, Td); q(t1 + 3, 20, null); qrow(22, t0 - 2, t0 - 1, Td); }   // mangas bufantes
    } else {
      /* ---------- perfil (olhando para a esquerda) ---------- */
      const sw = stepL ? -1 : stepR ? 1 : 0;
      qbox(11, 18, 13, 19, Sd); q(11, 19, mix(Sd, S, 0.4));
      if (!robe && bottom !== 'saiaLonga') {
        const legPx = (x, y, near) => {
          const pants = bottom === 'calca' || (bottom === 'short' && y <= 27), hidden = bottom === 'saia' && y <= 27;
          if (hidden) return; q(x, y, pants ? (near ? B : Bd) : (near ? S : Sd));
        };
        if (!sw) {
          for (let y = 26; y <= 28; y++) { legPx(10, y, true); legPx(11, y, true); legPx(12, y, false); }
          if (bottom === 'short') { q(10, 27, Bd); q(11, 27, Bd); }
          qrow(29, 9, 13, SHOE); q(9, 29, SHOEl); qrow(30, 9, 13, SHd);
        } else {
          const frontNear = sw < 0;
          const front = near => { [[9, 26], [10, 26], [8, 27], [9, 27], [10, 27], [8, 28], [9, 28]].forEach(([x, y]) => legPx(x, y, near)); qrow(29, 6, 9, near ? SHOE : SHd); q(6, 29, near ? SHOEl : SHOE); qrow(30, 6, 9, SHd); };
          const back = near => { [[11, 26], [12, 26], [12, 27], [13, 27], [13, 28], [14, 28]].forEach(([x, y]) => legPx(x, y, near)); qrow(29, 12, 15, near ? SHOE : SHd); qrow(30, 12, 13, SHd); };
          if (frontNear) { back(false); front(true); } else { front(false); back(true); }
          qrow(26, 10, 12, bottom === 'saia' ? null : (bottom === 'calca' || bottom === 'short' ? B : null));
        }
      }
      if (bottom === 'calca' || bottom === 'short') qrow(25, 9, 14, Bd);
      if (bottom === 'saia') { qrow(25, 9, 14, Bd); qrow(26, 8, 15, B); qrow(27, 7, 15, Bd); q(8, 26, Bl); q(12, 26, Bd); q(10, 27, B); q(13, 27, B); }
      if (bottom === 'saiaLonga') { for (let y = 25; y <= 29; y++) { const o = y > 27 ? sw : 0; qrow(y, 9 - ((y - 25) >> 1) + o, 15 + ((y - 25) >> 1) + o, y === 29 || y === 25 ? Bd : B); } q(11, 27, Bd); q(13 + sw, 28, Bd); qrow(30, 8, 11, SHOE); }
      /* tronco */
      const s0 = masc ? 8 : 9;
      qbox(s0, 20, 15, 24, torso); for (let y = 20; y <= 24; y++) q(15, y, shade(torso, 0.84)); qrow(24, s0, 15, torsoD);
      if (fem && !robe) { q(9, 23, null); q(15, 23, null); }
      if (top === 'regata') { qbox(s0, 20, 15, 20, S); q(12, 20, T); }
      if (top === 'jardineira') { qbox(9, 22, 13, 24, T); q(11, 20, T); q(11, 21, T); q(10, 22, '#ffd75e'); }
      if (top === 'camisa' || leaves) { q(9, 20, Tl); q(10, 20, Tl); for (let y = 21; y <= 23; y++) q(s0, y, mix(T, '#ffffff', 0.12)); }
      if (top === 'moletom') { qbox(13, 18, 15, 20, Td); q(13, 18, T); }
      if (top === 'blusa') { q(9, 20, S); q(9, 21, S); qrow(24, s0, 15, Tl); }
      if (open) { qbox(s0, 20, 10, 24, IN); q(s0, 20, INl); q(11, 20, Tl); q(10, 22, '#c8c6d0'); q(11, 21, Td); }
      if (robe) { qbox(8, 20, 16, 29, T); qbox(16, 20, 16, 29, Td); qrow(29, 7, 16, '#ffd75e'); qrow(30, 8, 12, SHOE); }
      /* braço: ombro fixo e antebraço que balança; sombras dos dois lados para descolar do tronco */
      const ax = 11 + sw, sc = shade(sleeveC, 0.92), edge = shade(torso, 0.66);
      for (let y = 21; y <= 24; y++) { if (qget(ax - 1, y)) q(ax - 1, y, edge); if (qget(ax + 2, y)) q(ax + 2, y, edge); }
      for (let y = 20; y <= 25; y++) {
        const x = y <= 21 ? 11 : ax, sl = SL && y <= SL;
        q(x, y, sl ? sc : S); q(x + 1, y, sl ? shade(sc, 0.82) : Sd);
      }
      if (SL && SL < 25) { q(ax, SL, shade(sc, 0.8)); q(ax + 1, SL, shade(sc, 0.68)); }
      if (SL >= 25) { const cuff = top === 'moletom' ? sleeveD : Tl; q(ax, 25, cuff); q(ax + 1, 25, shade(cuff, 0.82)); }
      if (open) { q(ax, 23, CUFF); q(ax + 1, 23, shade(CUFF, 0.82)); }
      if (top === 'blusa') { qbox(10, 20, 13, 21, sc); q(10, 20, Tl); q(13, 21, shade(sc, 0.8)); }
      q(ax, 26, S); q(ax + 1, 26, Sd);                        // mão
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

    /* ---------- cabeça e rosto (grade final) ---------- */
    const EYE = '#241418';
    if (side) {
      const rows = { 8: [10, 13], 9: [9, 14], 10: [8, 15], 11: [8, 15], 12: [8, 15], 13: [8, 15], 14: [8, 15], 15: [8, 15], 16: masc ? [8, 14] : [9, 14], 17: fem ? [10, 13] : [9, 13] };
      for (const y in rows) qrow(+y, rows[y][0], rows[y][1], S);
      for (let y = 10; y <= 15; y++) q(15, y, Sd); q(14, 16, Sd); q(13, 17, Sd); q(12, 17, mix(S, Sd, 0.5));
      q(7, 13, S); q(7, 14, Sd);                                   // nariz
      q(9, 12, EYE); q(9, 13, EYE); q(10, 13, mix(S, '#ffffff', 0.55));   // olho
      q(9, 11, brow); q(10, 11, mix(brow, S, fem ? 0.45 : 0.2)); if (masc) q(8, 11, mix(brow, S, 0.3)); if (fem) q(8, 12, EYE);
      q(8, 15, mix(S, fem ? '#d04060' : '#b04848', fem ? 0.55 : 0.35)); q(10, 14, mix(S, '#e87a7a', fem ? 0.45 : 0.22));
      q(13, 12, Sd); q(13, 13, Sd); q(14, 13, S);                  // orelha
    } else {
      const r16 = masc ? [8, 15] : [9, 14], r17 = masc ? [9, 14] : [10, 13];
      const rows = { 8: [10, 13], 9: [9, 14], 10: [8, 15], 11: [8, 15], 12: [8, 15], 13: [8, 15], 14: [8, 15], 15: [8, 15], 16: r16, 17: r17 };
      for (const y in rows) qrow(+y, rows[y][0], rows[y][1], S);
      q(7, 12, S); q(7, 13, Sd); q(16, 12, Sd); q(16, 13, shade(Sd, 0.9));   // orelhas
      for (let y = 10; y <= 15; y++) q(15, y, Sd); q(r16[1], 16, Sd); q(r17[1], 17, Sd); q(r17[1] - 1, 17, mix(S, Sd, 0.5));
      if (down) {
        q(9, 12, EYE); q(9, 13, EYE); q(14, 12, EYE); q(14, 13, EYE);          // olhos (2 px de altura) com brilho
        q(10, 13, mix(S, '#ffffff', 0.6)); q(13, 13, mix(S, '#ffffff', 0.6));
        if (fem) { q(8, 12, EYE); q(15, 12, EYE); qrow(11, 9, 10, mix(brow, S, 0.3)); qrow(11, 13, 14, mix(brow, S, 0.3)); }
        else if (masc) { qrow(11, 8, 10, brow); qrow(11, 13, 15, brow); }
        else { qrow(11, 9, 10, brow); qrow(11, 13, 14, brow); }
        const blush = fem ? 0.5 : masc ? 0.14 : 0.3;
        q(8, 14, mix(S, '#e87a7a', blush)); q(15, 14, mix(Sd, '#e87a7a', blush));
        q(12, 14, Sd);                                                         // nariz
        if (fem) { qrow(15, 11, 12, mix(S, '#d04060', 0.6)); q(12, 16, mix(S, Sd, 0.5)); }
        else if (masc) { qrow(15, 10, 13, mix(S, '#8a4a40', 0.42)); qrow(17, 10, 13, mix(S, Sd, 0.55)); }
        else qrow(15, 11, 12, mix(S, '#b04040', 0.38));
      } else { qbox(8, 16, 15, 17, S); q(15, 16, Sd); q(15, 17, Sd); qrow(17, 8, 15, mix(S, Sd, 0.4)); q(8, 17, null); q(15, 17, null); }
      if (hair === 'careca') { q(9, 9, Sl); q(10, 9, Sl); q(9, 10, Sl); }
    }

    /* ---------- cabelo da frente ---------- */
    const isFront = k => { const [x, y] = k.split(',').map(Number); return x <= 7 || x >= 16 || y < 17; };
    paintHair(k => !(down && back2.has(k) && !isFront(k)));
    /* linha escura onde o cabelo encosta no rosto: separa franja, mechas e pele com nitidez */
    if (!up) {
      const skin = new Set([S, Sd, Sl]), hairC = new Set([Hb, Hl, Hd, mix(Hb, Hl, 0.5)]);
      for (const k of hm) { const [x, y] = k.split(',').map(Number), c = grid[y][x]; if (!c || !hairC.has(c)) continue;
        if (skin.has(qget(x, y + 1))) grid[y][x] = Hdd; else if (y >= 11 && (skin.has(qget(x - 1, y)) || skin.has(qget(x + 1, y)))) grid[y][x] = c === Hl ? Hb : Hd; }
    }
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

    if (look.earring) { if (down) { p(17, 12, '#d8d6e0'); p(17, 13, '#9a98a6'); } else if (side) { p(13, 12, '#d8d6e0'); p(13, 13, '#9a98a6'); } }   // brinco de argola
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
    } else if (hat === 'gorro') {                       // gorro de tricô com barra dobrada e pompom
      const c = look.hatColor || '#5a58b8', cd = shade(c, 0.72), cl = mix(c, '#ffffff', 0.3), pom = '#eef0fa';
      box(7, 2, 16, 5, c); row(2, 9, 14, cl); for (let x = 8; x <= 15; x += 2) p(x, 4, cd);
      if (side) { box(6, 6, 16, 7, cl); row(7, 6, 16, cd); box(10, -1, 12, 1, pom); p(11, -1, '#ffffff'); }
      else { box(6, 6, 17, 7, cl); for (let x = 6; x <= 17; x += 2) p(x, 7, cd); box(10, 0, 13, 1, pom); p(11, 0, '#ffffff'); }
    } else if (hat === 'chef') {
      box(7, 0, 16, 4, '#f8f8f8'); row(0, 8, 15, '#ffffff'); box(16, 1, 16, 4, '#d8d8e4'); row(5, 6, 17, '#e8e8f0');
    }
    // com chapéu, o laço vai na fita do chapéu e a bandana aparece por baixo da aba
    if (hat && acc === 'laco') { if (down) bow(15, 2); else if (up) bow(4, 2); else bow(13, 2); }
    if (hat && acc === 'bandana') {
      if (down) { qrow(11, 8, 15, A); q(9, 11, Al); q(7, 11, Ad); q(16, 11, Ad); q(7, 12, Ad); q(16, 12, Ad); }   // faixa na testa, logo abaixo da aba (grade final)
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

    /* ---------- manchas de tinta na roupa (Iara) ---------- */
    if (look.paint) {
      const dots = down ? [[9, 20, '#e0a23a'], [14, 22, '#3f86d0'], [12, 19, '#58b858'], [10, 26, '#e04a5a']] : up ? [[10, 21, '#e0a23a'], [15, 19, '#3f86d0']] : [[11, 20, '#e0a23a'], [13, 22, '#3f86d0'], [12, 26, '#58b858']];
      dots.forEach(([x, y, c]) => { if (get(x, y) && get(x, y) !== S && get(x, y) !== Sd) p(x, y, c); });
    }
    /* ---------- criança: cabeça do mesmo tamanho, tronco, braços e pernas mais curtos ---------- */
    if (look.kid) {
      const cut = drop => { const rows = grid.filter((r, y) => !drop.has(y)); while (rows.length < H) rows.unshift(Array(W).fill(null)); for (let y = 0; y < H; y++) grid[y] = rows[y]; };
      cut(new Set([22, 23, 28]));
      /* menor que os adultos (cerca de 22 pontos contra 25 a 29): duas linhas do alto do volume do cabelo e uma do tronco,
         sem tocar no rosto, nas mãos e nos pés */
      cut(new Set([9, 11, 24]));
    }
    /* ---------- adultos: pernas com duas linhas a mais (linha lisa da canela repetida), pés no mesmo ponto; tudo acima
       sobe junto. Proporção mais próxima da do jogador e do Caleb, cerca de 27 a 30 pontos de altura. ---------- */
    if (!look.kid) {
      const rows = []; grid.forEach((r, y) => { rows.push(r); if (y === (/^saia/.test(look.bottom || '') ? 28 : LEGDUP)) { rows.push(r.slice()); rows.push(r.slice()); } });
      rows.splice(0, rows.length - H); for (let y = 0; y < H; y++) grid[y] = rows[y];
    }
    /* ---------- contorno: escuro, levemente tingido pela cor que contorna (mais nítido e menos "carimbado") ---------- */
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

  /* Retratos próprios (ex.: Lúcio) ficam em js/portraits.js e se registram aqui. */
  const PORTRAITS = {};
  /* Canvas novo (para painéis) com o retrato. */
  function portrait(id, expr) { const src = PORTRAITS[id](expr), c = document.createElement('canvas'); c.width = src.width; c.height = src.height; c.className = 'pixel'; c.getContext('2d').drawImage(src, 0, 0); return c; }

  const flipped = img => {
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.translate(img.width, 0); g.scale(-1, 1); g.drawImage(img, 0, 0);
    return c;
  };
  /* Quadros por direção: [parado, passo esquerdo, passo direito]. */
  const cache = new Map();
  function frames(look) {                   // um só desenho para mapa, prévia, painéis e menus
    const key = JSON.stringify(look);
    if (!cache.has(key)) {
      const set = dir => [0, 1, 2].map(f => render(look, f, dir));               // jogador e moradores: o mesmo gerador, 1 pixel por ponto do mundo
      const down = set('down'), up = set('up'), left = set('side');
      cache.set(key, { down, up, left, right: left.map(flipped) });
      if (cache.size > 120) cache.delete(cache.keys().next().value);
    }
    return cache.get(key);
  }

  const WALK = [1, 0, 2, 0];
  /* Desenha com o canto superior esquerdo em (x, y). dir: 'down' | 'up' | 'left' | 'right'. */
  function draw(ctx, look, x, y, frame = 0, dir = 'down') {
    const fr = frames(look), set = fr[dir] || fr.down, im = set[Math.abs(frame) % 3 | 0];
    ctx.drawImage(im, Math.round(x), Math.round(y), W, H);
  }
  /* Desenha com os pés em (x, y) (drawWorld é o mesmo desenho; o nome fica para o mundo). */
  const drawAt = (ctx, look, x, y, frame = 0, dir = 'down') => draw(ctx, look, x - W / 2, y - H + 1, frame, dir);
  const drawWorld = drawAt;
  const walk = t => WALK[Math.floor(t / 130) % 4];
  /* Pequeno canvas com o personagem, para painéis. */
  function canvas(look, dir = 'down', frame = 0) {
    const im = frames(look)[dir][frame], c = document.createElement('canvas'); c.className = 'pixel';
    c.width = W * 2; c.height = H * 2;                                       // painéis: 48x64, sempre em escala inteira
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    g.drawImage(im, 0, 0, W * 2, H * 2);
    return c;
  }

  /* Aparência sorteada (só as escolhas visuais). */
  function randomLook(base) {
    const r = list => list[Math.floor(Math.random() * list.length)];
    const look = Object.assign({}, base, {
      skin: r(SKINS).id, hair: r(HAIRS).id, hairColor: r(HAIR_COLORS.slice(0, 6)).id, hairHsl: null,   // a cor sorteada é uma das prontas (as barras partem dela)
      top: r(TOPS).id, topColor: r(CLOTH_COLORS), bottom: r(BOTTOMS).id, bottomColor: r(CLOTH_COLORS),
      shoeColor: r(SHOE_COLORS), accessory: Math.random() < 0.5 ? null : r(ACCESSORIES).id, accColor: r(CLOTH_COLORS),
    });
    if (look.bottomColor === look.topColor) look.bottomColor = r(CLOTH_COLORS.filter(c => c !== look.topColor));
    return look;
  }

  const hairMask = (look, dir) => render(Object.assign({}, look, { __hairProbe: true }), 0, dir);   // máscara do penteado na grade do mundo
  const hairPaletteOf = look => (Array.isArray(look.hairHsl) ? hairPalette(look.hairHsl) : byId(HAIR_COLORS.concat(EXTRA_HAIR), look.hairColor).c);
  return { LEGDUP, ADULT_LIFT, hairMask, hairPaletteOf, hairPalette, hexToHsl, hairHslOf, WORLD, drawWorld, genderPreset, portrait, PORTRAITS, W, H, SKINS, HAIR_COLORS, HAIRS, GENDERS, TOPS, BOTTOMS, ACCESSORIES, CLOTH_COLORS, SHOE_COLORS, HATS, draw, drawAt, frames, walk, canvas, randomLook };
})();
