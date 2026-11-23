/* =====================================================================
   Jogador em alta definição: 48x64 por quadro, mostrado em 24x32 no mundo
   (dois pixels do desenho por ponto do mundo, como o Caleb).
   Usa o mesmo sistema de personalização (pele, base, penteado, cor do
   cabelo em HSL, roupas, acessórios, chapéus e cores): só o desenho muda.

   Grade de desenho (frente; x de 0 a 47, centro entre 23 e 24):
     cabeça 12–29 (olhos 20–22), pescoço 30–31, tronco 32–43, cós 44–45,
     pernas 46–57, calçados 58–61.
   Na saída, linhas dos trechos lisos (pescoço, meio do tronco e pernas)
   são repetidas: o quadro final tem 48x78, mostrado em 24x39 no mundo,
   com os pés no mesmo ponto de antes e a altura do Caleb.

   Cabelos: cada penteado tem a sua forma desenhada aqui, em cada vista
   (frente, costas e os dois perfis; franjas assimétricas trocam de lado no
   perfil direito em vez de só espelhar). A textura vem em mechas largas
   (liso e ondulado), cachos agrupados (cacheado) e molinhas compactas
   (crespo), com uma faixa de brilho contínua no alto.
   ===================================================================== */
const PlayerArt = (() => {
  const W = 48, H = 64, OUT = '#21151a';
  /* o desenho é feito numa grade de 64 linhas e sai com 78: estas linhas são repetidas (trechos sem detalhe) */
  const DUP = [31, 36, 37, 39, 40, 47, 48, 49, 50, 51, 52, 53, 54, 55];
  const ROWS = []; for (let y = 0; y < H; y++) { ROWS.push(y); if (DUP.includes(y)) ROWS.push(y); }
  const HO = ROWS.length;                                                   // 78 linhas: pés na linha 75, cabeça e cabelo do tamanho do Caleb
  const hx = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const toHex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, k) => { const A = hx(a), B = hx(b); return toHex(A.map((v, i) => v + (B[i] - v) * k)); };
  const shade = (h, k) => toHex(hx(h).map(v => v * k));

  const HAIRS = Sprites.HAIRS.map(h => h.id), TOPS = Sprites.TOPS.map(t => t.id), BOTTOMS = Sprites.BOTTOMS.map(b => b.id);
  const ACCS = Sprites.ACCESSORIES.map(a => a.id), HATS = Sprites.HATS.map(h => h.id);
  const supports = look => !!look && look.crisp && HAIRS.includes(look.hair) && TOPS.includes(look.top) && BOTTOMS.includes(look.bottom)
    && (!look.hat || HATS.includes(look.hat)) && (!look.accessory || ACCS.includes(look.accessory)) && ['m', 'f', 'n'].includes(look.body || 'n')
    && !look.beard && !look.earring;

  /* ------------------------------------------------------------------
     Penteados. Cada um tem parâmetros de forma usados nas quatro vistas:
       tex   textura (liso, ondulado, cacheado, crespo, raspado)
       vol   volume do topo (pixels além do crânio)
       fr    tipo de franja (varrida, reta, risca no meio, cortina, diagonal, lateral, topete, curta, cachos)
       side  até onde vão as laterais de frente (linha)
       nape  até onde vai a nuca de costas
       long  comprimento do cabelo comprido (linha), se houver
       wide  quanto o comprido se abre para os lados
     ------------------------------------------------------------------ */
  const STYLES = {
    careca:        { tex: 'none' },
    raspado:       { tex: 'shaved', vol: 0.4, fr: 'short', side: 20, nape: 26 },
    curtoLiso:     { tex: 'straight', vol: 1.3, fr: 'swept', side: 22, nape: 27 },
    topete:        { tex: 'straight', vol: 0.8, fr: 'quiff', side: 21, nape: 26 },
    curtoOndulado: { tex: 'wavy', vol: 1.8, fr: 'wave', side: 23, nape: 28 },
    curtoCacheado: { tex: 'curly', vol: 0, fr: 'curls', blob: [[24, 16.5, 10.6, 8.4]], side: 23, nape: 28, r: 2.5 },
    crespoCurto:   { tex: 'coily', vol: 0, fr: 'curls', blob: [[24, 16.5, 10.4, 8.2]], side: 22, nape: 27, r: 1.9 },
    crespo:        { tex: 'coily', vol: 0, fr: 'curls', blob: [[24, 17, 14.6, 12.2]], side: 29, nape: 31, r: 2.1 },
    medio:         { tex: 'straight', vol: 1.5, fr: 'blunt', side: 30, nape: 31, bob: true },
    medioOndulado: { tex: 'wavy', vol: 1.8, fr: 'curtain', side: 34, nape: 34, long: 34, wide: 2 },
    longoLiso:     { tex: 'straight', vol: 1.2, fr: 'part', side: 44, nape: 44, long: 44, wide: 1 },
    longoOndulado: { tex: 'wavy', vol: 1.7, fr: 'curtain', side: 44, nape: 44, long: 44, wide: 2 },
    longoCacheado: { tex: 'curly', vol: 0, fr: 'curls', blob: [[24, 18, 13, 9.6], [24, 32, 12.6, 12]], side: 43, nape: 43, long: 43, r: 2.6 },
    trancas:       { tex: 'straight', vol: 0.8, fr: 'part', side: 23, nape: 27, braids: true },
    rabo:          { tex: 'straight', vol: 0.7, fr: 'part', side: 21, nape: 25, tail: true },
    coque:         { tex: 'straight', vol: 0.5, fr: 'part', side: 21, nape: 25, bun: true },
    longoVolumoso: { tex: 'wavy', vol: 2.4, fr: 'curtain', side: 45, nape: 45, long: 45, wide: 4 },
    medioLateral:  { tex: 'straight', vol: 1.6, fr: 'side', side: 30, nape: 30 },
    emo:           { tex: 'straight', vol: 2.0, fr: 'diag', side: 30, nape: 30, spiky: true },
  };

  /* elipse com centro entre pixels (x + 0.5) */
  const ell = (x, y, cx, cy, rx, ry) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;

  /* Linha da franja na testa (de frente): o cabelo cobre a testa até esta linha, coluna a coluna.
     As pontas aparecem como pequenos grupos (de 3 a 4 pixels), não como fiapos soltos. */
  function fringeEdge(fr, x) {
    const c = Math.abs(x + 0.5 - 24);
    switch (fr) {
      case 'swept': { const base = 19.6 - (x - 17) * 0.26, k = (x - 17) % 4; return Math.round(base + (k === 1 ? 0.6 : k === 3 ? -0.6 : 0)); }   // varrida: mais longa à esquerda de quem olha
      case 'blunt': return x === 17 || x === 30 ? 19 : 18;                                                    // reta, cheia
      case 'part': return Math.round(14.6 + Math.max(0, c - 1) * 0.42);                                       // risca no meio, testa à mostra
      case 'curtain': return Math.round(15.2 + Math.max(0, c - 1.5) * 0.62);                                  // cortina: abre no meio
      case 'wave': return 17 + ((x >> 1) % 2);                                                                // franja curta ondulada
      case 'diag': return x <= 21 ? 24 - (x === 17 ? 1 : 0) : Math.round(24 - (x - 21) * 0.9);               // emo: diagonal cobrindo um olho
      case 'side': return x <= 26 ? Math.round(20 - (x - 17) * 0.42) : 15;                                    // risca lateral, franja varrida
      case 'quiff': return 15;
      case 'short': return 15;
      case 'curls': return 16 + ((x * 7) % 3 === 0 ? 1 : 0);
      default: return 14;
    }
  }

  /* Forma do cabelo em uma vista. Devolve Map "x,y" -> 'f' (na frente do corpo) ou 'b' (atrás do corpo). */
  function hairShape(st, view, near) {
    const out = new Map(), put = (x, y, l) => { if (x >= 0 && x < W && y >= 0 && y < H && !out.has(x + ',' + y)) out.set(x + ',' + y, l); };
    const del = (x, y) => out.delete(x + ',' + y);
    const tuft = (x, y) => { put(x, y, 'f'); put(x - 1, y + 1, 'f'); put(x, y + 1, 'f'); put(x + 1, y + 1, 'f'); for (let dx = -2; dx <= 2; dx++) put(x + dx, y + 2, 'f'); };   // mecha espetada: ponta em triângulo
    if (st.tex === 'none') return out;
    const v = st.vol || 0;
    if (st.blob) {                                                         // cacheados e crespos: união de cachos redondos (contorno orgânico)
      const r = st.r, cells = [];
      const blobs = view === 'side' ? st.blob.map(([bx, by, rx, ry]) => [bx + 2, by, rx * 0.92, ry]) : st.blob;
      for (let j = -2; j < 30; j++) for (let i = -2; i < 26; i++) {
        const cx = i * r * 1.5 + (j % 2 ? r * 0.75 : 0) + 2, cy = j * r * 1.3 + 2;
        if (blobs.some(([bx, by, rx, ry]) => ((cx - bx) / rx) ** 2 + ((cy - by) / ry) ** 2 <= 1)) cells.push([cx, cy]);
      }
      st.__cells = cells;
      for (const [cx, cy] of cells) for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++)
        if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= (r + 0.35) ** 2) put(x, y, 'f');
      const longB = st.long || 0;
      for (const k of [...out.keys()]) {
        const [x, y] = k.split(',').map(Number);
        if (view === 'down') {
          if (x >= 17 && x <= 30 && y > fringeEdge('curls', x) && y <= 31) del(x, y);                    // rosto livre
          else if (y > st.side && x >= 15 && x <= 32 && !longB) del(x, y);
          else if (longB && y >= 28 && x >= 15 && x <= 32) out.set(k, 'b');                               // por trás do pescoço e dos ombros
        } else if (view === 'side') {
          if (x <= 22 && y > 16 && (y <= 31 || x <= 21)) del(x, y);                                     // rosto de perfil (e nada à frente do peito)
          else if (x <= 24 && y > 19 && y <= 31 && !longB) del(x, y);
          else if (!longB && y > st.nape) del(x, y);
          else if (longB && y >= 28 && x <= 26) out.set(k, 'b');
        } else if (y > st.nape && !longB) del(x, y);
      }
      return out;
    }
    const dome = (x, y) => ell(x, y, 24, 21 - v * 0.45, 8.6 + v, 9.4 + v);
    const mid = st.bob || st.fr === 'side' || st.fr === 'diag';
    if (view === 'down') {
      for (let y = 4; y < 50; y++) for (let x = 6; x < 42; x++) {
        if (!dome(x, y)) continue;
        const face = x >= 17 && x <= 30;
        if (face ? y <= fringeEdge(st.fr, x) : y <= Math.min(st.side, 29)) put(x, y, 'f');
      }
      if (st.fr === 'quiff') for (let y = 6; y < 16; y++) for (let x = 14; x < 34; x++) if (ell(x, y, 25, 11, 6.6, 4.2)) put(x, y, 'f');   // topete
      if (st.spiky) [[17, 10], [22, 8], [28, 8], [32, 12]].forEach(([x, y]) => tuft(x, y));
      if (mid) {                                                            // laterais até o queixo (chanel reto; lateral e emo em camadas)
        for (let y = 18; y <= 30; y++) {
          const jag = !st.bob && y >= 27 && y % 2 === 0;
          for (let x = 14 + (jag ? 1 : 0); x <= 16; x++) put(x, y, 'f');
          for (let x = 31; x <= 33 - (!st.bob && y >= 27 && y % 2 ? 1 : 0); x++) put(x, y, 'f');
        }
        if (st.bob) { put(17, 29, 'f'); put(30, 29, 'f'); put(17, 30, 'f'); put(30, 30, 'f'); del(14, 30); del(33, 30); }
        if (st.fr === 'diag') { put(17, 24, 'f'); put(17, 25, 'f'); put(18, 24, 'f'); }
      }
      if (st.long) {                                                        // comprido: cortinas dos lados (frente) e manto atrás do corpo
        const L = st.long, w = st.wide || 1;
        for (let y = 18; y <= L; y++) {
          const wave = st.tex === 'wavy' ? Math.round(Math.sin((y - 18) / 3)) : 0, flare = y > L - 6 ? 1 : 0;
          for (let x = 15 - w - flare + wave; x <= 16; x++) put(x, y, 'f');
          for (let x = 31; x <= 32 + w + flare + wave; x++) put(x, y, 'f');
          if (y >= 28) for (let x = 17; x <= 30; x++) put(x, y, 'b');
        }
      }
      if (st.braids) for (const bx of [13, 31]) for (let y = 22; y <= 45; y++) for (let x = bx; x <= bx + 3; x++) put(x, y, 'f');
      if (st.tail) for (let y = 22; y <= 34; y++) for (let x = 32; x <= 34 - (y > 31 ? 1 : 0); x++) put(x, y, 'b');
      if (st.bun) for (let y = 3; y < 14; y++) for (let x = 16; x < 32; x++) if (ell(x, y, 24, 9, 4.6, 3.8)) put(x, y, 'f');
    } else if (view === 'up') {
      for (let y = 4; y < 50; y++) for (let x = 6; x < 42; x++) if (dome(x, y) && y <= st.nape) put(x, y, 'f');
      if (st.fr === 'quiff') for (let y = 6; y < 16; y++) for (let x = 14; x < 34; x++) if (ell(x, y, 23, 11, 6.4, 4)) put(x, y, 'f');
      if (st.spiky) [[16, 11], [21, 8], [27, 8], [32, 11]].forEach(([x, y]) => tuft(x, y));
      if (mid) for (let y = 18; y <= st.nape; y++) for (let x = 14; x <= 33; x++) if (!(y === st.nape && (x === 14 || x === 33))) put(x, y, 'f');
      if (st.long) { const L = st.long, w = st.wide || 1; for (let y = 18; y <= L; y++) { const wave = st.tex === 'wavy' ? Math.round(Math.sin((y - 18) / 3)) : 0, flare = y > L - 6 ? 1 : 0; for (let x = 15 - w - flare + wave; x <= 32 + w + flare + wave; x++) put(x, y, 'f'); } }
      if (st.braids) for (const bx of [17, 27]) for (let y = 24; y <= 45; y++) for (let x = bx; x <= bx + 3; x++) put(x, y, 'f');
      if (st.tail) for (let y = 21; y <= 40; y++) { const w = y < 24 ? 3 : y > 36 ? 1 : 2; for (let x = 24 - w; x <= 23 + w; x++) put(x, y, 'f'); }
      if (st.bun) for (let y = 3; y < 14; y++) for (let x = 16; x < 32; x++) if (ell(x, y, 24, 9, 4.6, 3.8)) put(x, y, 'f');
    } else {                                                                // perfil, olhando para a esquerda (near = lado visível: 'L' ou 'R')
      const sdome = (x, y) => ell(x, y, 24.6, 21 - v * 0.45, 8.5 + v, 9.4 + v);
      /* franja vista de lado: o lado à mostra muda o comprimento (franjas assimétricas não são só espelhadas) */
      const longFront = near === 'R' && (st.fr === 'swept' || st.fr === 'diag' || st.fr === 'side');
      const frontEdge = { swept: longFront ? 19 : 18, blunt: 18, part: 16, curtain: 18, wave: 18, diag: longFront ? 20 : 18, side: longFront ? 19 : 17, quiff: 15, short: 15 }[st.fr] || 16;
      const backEnd = st.long ? st.long : st.nape;
      for (let y = 4; y < 50; y++) for (let x = 6; x < 42; x++) {
        if (!sdome(x, y)) continue;
        const burn = Math.min(st.side, ['part', 'short', 'quiff'].includes(st.fr) ? 20 : 22);
        if (x <= 20) { if (y <= frontEdge && (x >= 16 || y <= 17)) put(x, y, 'f'); }
        else if (x <= 22) { if (y <= (st.long || mid ? 30 : burn)) put(x, y, 'f'); }                 // costeleta à frente da orelha
        else if (x <= 27) { if (y <= (st.long ? backEnd : mid ? 30 : 19 + (x >= 27 ? 1 : 0))) put(x, y, 'f'); }   // acima da orelha
        else if (y <= (st.long ? backEnd : backEnd - Math.max(0, 31 - x) * 1.5)) put(x, y, 'f');       // nuca afinando
      }
      if (st.long) for (let y = 20; y <= st.long; y++) { const wave = st.tex === 'wavy' ? Math.round(Math.sin((y - 18) / 3)) : 0; for (let x = 24; x <= 32 + (st.wide || 1) + wave + (y > st.long - 6 ? 1 : 0); x++) put(x, y, y >= 30 && x <= 27 ? 'b' : 'f'); }
      if (mid) for (let y = 20; y <= 30; y++) for (let x = 27; x <= 32 - (y >= 28 && y % 2 ? 1 : 0); x++) put(x, y, 'f');
      if (st.fr === 'quiff') for (let y = 6; y < 16; y++) for (let x = 12; x < 32; x++) if (ell(x, y, 21, 11.5, 5.4, 3.6)) put(x, y, 'f');
      if (st.spiky) [[20, 8], [26, 7], [31, 9], [34, 14], [34, 20]].forEach(([x, y]) => tuft(x, y));
      if (st.braids) for (let y = 22; y <= 45; y++) for (let x = 28; x <= 31; x++) put(x, y, 'f');
      if (st.tail) for (let y = 15; y <= 36; y++) { const x0 = 31 + Math.round(Math.min(3, (y - 15) / 4)); for (let x = x0; x <= x0 + (y < 20 ? 3 : y > 32 ? 1 : 2); x++) put(x, y, 'f'); }
      if (st.bun) for (let y = 4; y < 16; y++) for (let x = 24; x < 40; x++) if (ell(x, y, 31, 10, 4, 3.8)) put(x, y, 'f');
      if (st.fr === 'diag' && longFront) for (let y = 18; y <= 24; y++) for (let x = 14; x <= 16 - (y > 22 ? 1 : 0); x++) put(x, y, 'f');   // franja longa na frente do olho (sem cobri-lo inteiro)
    }
    return out;
  }

  /* ---------- pintura do cabelo ---------- */
  function paintHair(look, view, near, P) {
    const { set, get, S, Sd, Sl, Hb, Hd, Hl, Hdd, Hm } = P, st = Object.assign({}, STYLES[look.hair] || STYLES.curtoLiso);
    const shape = hairShape(st, view, near);
    if (look.hat) { for (const k of [...shape.keys()]) { const y = +k.split(',')[1]; if (y < P.brimTop) shape.delete(k); } st.bun = false; }   // o chapéu assenta: nada acima da aba
    const has = (x, y) => shape.has(x + ',' + y);
    if (!shape.size) return { back: () => {}, front: () => {} };
    let minY = 99, xa = 99, xb = 0; const colTop = {};
    for (const k of shape.keys()) { const [x, y] = k.split(',').map(Number); minY = Math.min(minY, y); xa = Math.min(xa, x); xb = Math.max(xb, x); if (colTop[x] === undefined || y < colTop[x]) colTop[x] = y; }
    const cx = view === 'side' ? 25 : 23.5, span = Math.max(8, xb - xa);
    const px = view === 'side' ? 27 : view === 'up' ? 24.8 : 24, py = Math.min(minY, 12) - 6;
    const lockAt = (x, y) => {                                              // posição dentro da mecha: mechas largas saindo do alto da cabeça
      const dx = x + 0.5 - px, dy = Math.max(1, y + 0.5 - py), r = Math.hypot(dx, dy);
      const wave = st.tex === 'wavy' ? 0.28 * Math.sin(r / 2.4) : 0;
      const q = Math.atan2(dx, dy) * Math.sqrt(r) * (y > 30 ? 0.62 : 0.5) + wave + 40, li = Math.floor(q);
      return [q - li, li, r];
    };
    /* pontas das mechas compridas: pequenos bicos regulares, um por mecha */
    if (st.tex === 'straight' || st.tex === 'wavy') for (const k of [...shape.keys()]) {
      const [x, y] = k.split(',').map(Number); if (y < 26 || has(x, y + 1) || st.braids) continue;
      const [u] = lockAt(x, y); if (u < 0.22 || u > 0.86) shape.delete(k);
    }
    const HL = mix(Hl, '#ffffff', 0.16), shaved = st.tex === 'shaved', R = [mix(Hb, S, 0.4), mix(Hd, S, 0.32), mix(Hl, S, 0.5)];
    const cells = st.__cells || [];
    const nearest = (x, y) => { let best = null, bd = 1e9; for (const c of cells) { const d = (x + 0.5 - c[0]) ** 2 + (y + 0.5 - c[1]) ** 2; if (d < bd) { bd = d; best = c; } } return [best, Math.sqrt(bd)]; };
    const braidMid = x => (view === 'down' ? (x <= 20 ? 14.5 : 32.5) : view === 'up' ? (x < 24 ? 18.5 : 28.5) : 29.5);
    const inBraid = (x, y) => st.braids && y >= 23 && (view === 'down' ? x <= 16 || x >= 31 : view === 'up' ? y > 26 : x >= 28 && y > 24);
    const color = (x, y) => {
      const below = has(x, y + 1), right = has(x + 1, y), above = has(x, y - 1), left = has(x - 1, y);
      const ty = y - colTop[x];
      if (shaved) return !above && x < cx ? R[2] : !below || !right ? R[1] : R[0];
      let c = Hb;
      if (st.tex === 'curly' || st.tex === 'coily') {                       // cachos: luz no alto à esquerda de cada cacho, sombra embaixo à direita
        const [cc, d] = nearest(x, y), r = st.r, dx = x + 0.5 - cc[0], dy = y + 0.5 - cc[1], lit = cc[1] < minY + 8 || cc[0] < cx - 2;
        if (d > r - 0.75 && dx + dy > -0.5) c = Hd;
        else if (dx + dy < -r * 0.55 && d > 0.4) c = st.tex === 'coily' ? (lit && cc[1] < minY + 6 ? Hl : Hm) : (lit ? Hl : Hm);
        if (st.tex === 'coily' && d > r - 0.4) c = Hdd;
      } else if (inBraid(x, y)) {                                           // tranças: gomos de 3 linhas, inclinados, com divisão escura
        const seg = (y + 40) % 3, mid = braidMid(x);
        c = seg === 0 ? Hd : (x + 0.5 < mid) === (seg === 1) ? Hm : Hb;
      } else {
        const [u] = lockAt(x, y);
        if (u < 0.12) c = Hd;                                               // separação entre mechas (1 pixel)
        else if (u < 0.42 && x < cx + span * 0.25) c = Hm;                  // lado iluminado da mecha
        if (ty >= 2 && ty <= 4 && x < cx + span * 0.3 && y < 26) c = u < 0.12 ? Hm : ty === 3 && u > 0.3 && u < 0.75 ? HL : Hl;   // faixa de brilho contínua no alto
        if (st.tex === 'wavy' && y > 22 && u > 0.3 && u < 0.7 && (Math.floor(lockAt(x, y)[2]) % 7) < 2 && x < cx) c = Hm;   // crista da onda
      }
      if (x >= cx + span * 0.36 && c === Hb) c = Hd;                        // lado de fora, à direita, na sombra
      if (!below) c = y > 26 ? Hdd : Hd;
      else if (!right && c !== Hl) c = Hd;
      if (!above && !left && c !== Hd) c = Hm;
      return c;
    };
    const paint = layer => { for (const [k, l] of shape) if (l === layer) { const [x, y] = k.split(',').map(Number); set(x, y, color(x, y)); } };
    return {
      back: () => paint('b'),
      front: () => {
        paint('f');
        /* sombra suave do cabelo na pele logo abaixo da franja */
        for (const k of shape.keys()) { const [x, y] = k.split(',').map(Number); if (shape.get(k) === 'f' && !has(x, y + 1) && [S, Sl].includes(get(x, y + 1)) && y + 1 <= 28) set(x, y + 1, Sd); }
        if (st.braids) {                                                    // elásticos na ponta das tranças
          const tips = view === 'down' ? [[13, 16], [31, 34]] : view === 'up' ? [[17, 20], [27, 30]] : [[28, 31]];
          for (const [a, b] of tips) { let yb = 0; for (let x = a; x <= b; x++) for (let y = 30; y < 50; y++) if (has(x, y)) yb = Math.max(yb, y); for (let x = a; x <= b; x++) { if (has(x, yb - 3)) set(x, yb - 3, '#e8c040'); if (has(x, yb - 2)) set(x, yb - 2, '#b08a2c'); } }
        }
        if (st.tail) {                                                      // prendedor do rabo
          const T = '#c84a3c', Td = '#8e2e26';
          if (view === 'up') for (let x = 21; x <= 26; x++) { if (has(x, 21)) set(x, 21, T); if (has(x, 22)) set(x, 22, Td); }
          else if (view === 'side') for (let x = 31; x <= 34; x++) { if (has(x, 16)) set(x, 16, T); if (has(x, 17)) set(x, 17, Td); }
        }
        if (st.bun) {                                                       // coque enrolado com faixa na base
          const [bx, by, rx] = view === 'side' ? [31, 10, 4] : [24, 9, 4.6];
          for (let y = by - 4; y <= by + 4; y++) for (let x = bx - 5; x <= bx + 5; x++) {
            if (!has(x, y) || !ell(x, y, bx, by, rx, 3.8)) continue;
            const a = Math.atan2(y + 0.5 - by, x + 0.5 - bx), d = Math.hypot((x + 0.5 - bx) / rx, (y + 0.5 - by) / 3.8), sp = (a / Math.PI + d * 1.6 + 4) % 1;
            set(x, y, d > 0.82 && (y > by || x > bx) ? Hd : sp < 0.3 ? Hd : d < 0.5 && x <= bx && y <= by ? Hl : Hm);
          }
          for (let x = bx - 3; x <= bx + 3; x++) if (has(x, by + 4)) set(x, by + 4, Hdd);
        }
        if (look.hair === 'emo' && look.streak && view !== 'up') {          // mecha prateada (opcional) na franja
          const pts = view === 'down' ? [[19, 16], [19, 17], [20, 17], [19, 18], [20, 18], [19, 19], [18, 20], [18, 21]] : near === 'R' ? [[17, 18], [17, 19], [16, 20], [16, 21]] : [[18, 15], [18, 16]];
          pts.forEach(([x, y], i) => { if (has(x, y)) set(x, y, i < 2 ? '#eeeaf2' : '#c0bcc8'); });
        }
        if (look.hair === 'medioLateral' && view === 'down') for (let y = 12; y <= 14; y++) if (has(27, y)) set(27, y, Hdd);   // risca lateral
      },
    };
  }

  function render(look, frame, dirIn) {
    const right = dirIn === 'right', dir = dirIn === 'right' || dirIn === 'left' ? 'side' : dirIn;
    const G = Array.from({ length: H }, () => Array(W).fill(null));
    const set = (x, y, c) => { if (x >= 0 && x < W && y >= 0 && y < H) G[y][x] = c; };
    const row = (y, a, b, c) => { for (let x = a; x <= b; x++) set(x, y, c); };
    const box = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) row(y, x0, x1, c); };
    const get = (x, y) => (x >= 0 && x < W && y >= 0 && y < H ? G[y][x] : null);
    const spans = (rows, f) => { for (const y in rows) { const [a, b] = rows[y]; for (let x = a; x <= b; x++) set(x, +y, f(x, +y, a, b)); } };

    /* ---------- paletas ---------- */
    const sk = Sprites.SKINS.find(s => s.id === look.skin) || Sprites.SKINS[0], [S, Sd, Sl] = sk.c, Sdd = shade(Sd, 0.86);
    const [Hb, Hd, Hl] = Sprites.hairPaletteOf(look), Hdd = shade(Hd, 0.72), Hm = mix(Hb, Hl, 0.5);
    const top = look.top, bottom = look.bottom, jard = top === 'jardineira';
    const O = look.topColor || '#3f86d0', Od = shade(O, 0.74), Odd = shade(O, 0.58), Ol = mix(O, '#ffffff', 0.26);   // cor escolhida (macacão na jardineira)
    const T = jard ? '#eee4cc' : O, Td = shade(T, 0.8), Tdd = shade(T, 0.64), Tl = mix(T, '#ffffff', 0.3);
    const B = look.bottomColor || '#3a4a8a', Bd = shade(B, 0.74), Bdd = shade(B, 0.58), Bl = mix(B, '#ffffff', 0.22);
    const SH = look.shoeColor || '#3a2a22', SHd = shade(SH, 0.68), SHl = mix(SH, '#ffffff', 0.28);
    const fem = look.body === 'f', masc = !fem, up = dir === 'up', side = dir === 'side', down = dir === 'down';
    const stepL = frame === 1, stepR = frame === 2;
    const EYE = '#2a1a1e', IRIS = '#6a4430', WHITE = '#f6f2ec', LIP = mix(S, '#d0607a', fem ? 0.42 : 0.18), BLUSH = mix(S, '#f08a8a', 0.22);
    const SLEEVE = { camisa: 43, moletom: 43, blusa: 36, camiseta: 37, jardineira: 37, regata: 32 }[top];
    const pants = bottom === 'calca' || bottom === 'short';
    const hat = look.hat, brimTop = hat === 'palha' ? 16 : hat === 'boina' ? 15 : hat === 'pescador' ? 16 : 0;
    const hairP = paintHair(look, dir, right ? 'R' : 'L', { set, get, S, Sd, Sl, Hb, Hd, Hl, Hdd, Hm, brimTop });
    hairP.back();                                                           // cabelo comprido por trás do corpo

    if (!side) {
      /* ============ FRENTE E COSTAS ============ */
      const t0 = masc ? 16 : 17, t1 = masc ? 31 : 30;                         // tronco
      const lift = x => (stepL && x <= 23 ? 2 : stepR && x >= 24 ? 2 : 0);
      const legL = masc ? [18, 22] : [19, 22], legR = masc ? [25, 29] : [25, 28];
      /* pernas e roupa de baixo */
      const leg = ([a, b], skin, from) => { for (let y = from; y <= 57; y++) for (let x = a; x <= b; x++) {
        const inner = a < 24 ? x === b : x === a, outer = a < 24 ? x === a : x === b;
        let c = skin ? (outer && a < 24 ? Sl : inner || (outer && a > 24) ? Sd : S) : (outer && a < 24 ? Bl : inner ? Bdd : outer ? Bd : B);
        if (!skin && y === 57 && bottom === 'calca') c = Bd;
        set(x, y - lift(x), c);
      } };
      if (pants) {
        leg(legL, false, 46); leg(legR, false, 46);
        if (bottom === 'short') for (const L of [legL, legR]) { leg(L, true, 51); for (let x = L[0]; x <= L[1]; x++) { set(x, 50 - lift(x), Bdd); set(x, 51 - lift(x), Sd); } }
        box(t0 + 1, 44, t1 - 1, 47, B); set(23, 47, Bdd); set(24, 47, Bdd);                                   // quadril e entreperna
        row(44, t0, t1, Bdd); row(45, t0, t1, Bd); set(t0, 45, B);
        if (down) { set(23, 44, '#e0b848'); set(24, 44, '#a8842c'); set(23, 45, '#a8842c'); }              // fivela
      } else if (bottom === 'saia') {                                         // saia rodada até o meio da coxa, com pregas
        leg([legL[0] + 1, legL[1]], true, 51); leg([legR[0], legR[1] - 1], true, 51);
        for (let y = 44; y <= 51; y++) { const w = Math.floor((y - 44) / 2); row(y, t0 - w, t1 + w, B); set(t0 - w, y, Bl); set(t1 + w, y, Bd); set(t1 + w - 1, y, y > 45 ? Bd : B); }
        row(44, t0, t1, Bdd); row(51, t0 - 3, t1 + 3, Bd);
        for (const x of [20, 24, 28]) for (let y = 46; y <= 50; y++) set(x + Math.round((x - 24) * (y - 46) / 10), y, Bd);
      } else {                                                                // saia longa até o tornozelo, balança ao andar
        const sw = stepL ? -1 : stepR ? 1 : 0;
        for (let y = 44; y <= 57; y++) { const w = Math.floor((y - 44) / 3), o = y >= 50 ? sw : 0, a = t0 - w + o, b = t1 + w + o;
          row(y, a, b, B); set(a, y, Bl); set(b, y, Bdd); set(b - 1, y, Bd);
          if (y > 46) for (const x0 of [20, 27]) set(x0 + Math.round((x0 - 23.5) * (y - 46) / 22) + o, y, Bd); }
        row(44, t0, t1, Bdd); row(57, t0 - 4 + sw, t1 + 4 + sw, Bdd);
      }
      /* calçados: bico arredondado, sola escura */
      for (const [a, b] of masc ? [[17, 23], [24, 30]] : [[18, 23], [24, 29]]) {
        const l = lift(a + 1), y0 = 58 - l;
        row(y0, a + 1, b - 1, SH); row(y0 + 1, a, b, SH); row(y0 + 2, a, b, SH); row(y0 + 3, a, b, SHd);
        set(a + 1, y0, SHl); set(a + 2, y0, SHl); set(a, y0 + 1, SHl); set(b, y0 + 1, SHd); set(b, y0 + 2, SHd);
      }
      /* tronco: ombros arredondados, cintura discreta na base feminina */
      for (let y = 32; y <= 43; y++) {
        let a = t0, b = t1;
        if (y === 32) { a += 2; b -= 2; } else if (y === 33) { a += 1; b -= 1; }
        if (fem && y >= 38 && y <= 40) { a++; b--; }
        row(y, a, b, T); set(a, y, Tl); set(b, y, Td); if (y > 33) set(b - 1, y, Td);
      }
      row(43, t0, t1, Td);
      /* pescoço */
      const n0 = fem ? 22 : 21, n1 = fem ? 25 : 26; box(n0, 29, n1, 31, S); row(30, n0, n1, Sd); set(n1, 31, Sd);
      if (down) row(32, n0, n1, Sd);
      /* roupa de cima */
      if (top === 'camisa') {
        if (down) {
          box(23, 33, 24, 43, Tl); [35, 38, 41].forEach(y => set(23, y, Td));                                       // vista e botões
          [[20, 32], [21, 32], [21, 33], [22, 33], [27, 32], [26, 32], [26, 33], [25, 33]].forEach(([x, y]) => set(x, y, '#f4f0ea'));   // gola
          set(22, 34, '#e0dcd4'); set(25, 34, '#d4d0c8'); set(23, 32, Sd); set(24, 32, Sd); set(23, 33, Sdd); set(24, 33, Sdd);
          box(18, 35, 21, 37, Td); row(35, 18, 21, Tdd);                                                            // bolso
        } else { row(32, t0 + 2, t1 - 2, Tl); row(35, t0 + 1, t1 - 1, Td); for (let y = 36; y <= 42; y++) set(23, y, Td); }
      } else if (top === 'blusa') {                                             // decote redondo, babado na barra
        if (down) { row(32, 20, 27, S); row(33, 21, 26, S); row(32, 22, 25, Sd); row(34, 21, 26, Tl); set(20, 33, Tl); set(27, 33, Tl); }
        else row(32, 20, 27, Td);
        row(41, t0 + 1, t1 - 1, Td); for (let x = t0; x <= t1; x++) set(x, 43, (x % 3) ? T : Tl);
      } else if (top === 'camiseta' || jard) {                                // gola careca canelada
        if (down) { row(32, 21, 26, Tdd); row(32, 22, 25, Sd); set(21, 33, Td); set(26, 33, Td); row(33, 22, 25, Td); }
        else row(32, 21, 26, Td);
        row(42, t0 + 1, t1 - 1, Td);
      } else if (top === 'regata') {                                          // alças finas, cava e decote em U
        for (let y = 32; y <= 34; y++) { row(y, t0, t0 + 2 - (y === 34 ? 2 : 0), S); row(y, t1 - 2 + (y === 34 ? 2 : 0), t1, Sd); }
        set(t0 + 3, 32, Tl); set(t0 + 3, 33, Tl); set(t1 - 3, 32, Td); set(t1 - 3, 33, Td);
        if (down) { row(32, t0 + 4, t1 - 4, S); row(33, t0 + 5, t1 - 5, S); row(34, t0 + 6, t1 - 6, Sd); row(32, 22, 25, Sd); }
        else row(32, t0 + 4, t1 - 4, Sd);
        row(42, t0 + 1, t1 - 1, Td);
      } else if (top === 'moletom') {                                         // capuz, cordões, bolso canguru e barra canelada
        if (down) {
          row(31, 19, 21, T); row(31, 26, 28, Td); row(32, 19, 28, Td); set(19, 32, Tl); row(32, 22, 25, Sd); row(33, 21, 26, Tdd);
          for (let y = 34; y <= 37; y++) { set(21, y, '#efe8dc'); set(26, y, '#d8d0c4'); }
          box(19, 38, 28, 41, T); row(38, 19, 28, Td); set(19, 39, Td); set(19, 40, Td); set(28, 39, Tdd); set(28, 40, Tdd); row(38, 21, 26, Tdd);
        } else { box(18, 29, 29, 36, Td); box(19, 30, 28, 35, T); row(30, 20, 27, Tl); for (let y = 30; y <= 35; y++) set(28, y, Td); row(36, 19, 28, Tdd); }   // capuz nas costas
        for (let x = t0; x <= t1; x++) { set(x, 42, x % 2 ? Td : T); set(x, 43, Tdd); }
      }
      if (jard) {                                                             // jardineira: peito, alças e fivelas na cor escolhida
        if (down) {
          box(19, 37, 28, 43, O); for (let y = 37; y <= 43; y++) { set(19, y, Ol); set(28, y, Od); }
          for (let y = 32; y <= 36; y++) { const k = Math.floor((y - 32) / 2); set(t0 + 2 + k, y, O); set(t0 + 3 + k, y, Od); set(t1 - 2 - k, y, O); set(t1 - 3 - k, y, Ol); }
          set(19, 37, '#f2cf5a'); set(28, 37, '#d8b040'); box(22, 38, 25, 40, Od); row(38, 22, 25, Odd);
        } else { for (let y = 32; y <= 40; y++) { const k = Math.min(Math.floor((y - 32) / 2), 3); set(t0 + 2 + k, y, O); set(t0 + 3 + k, y, Od); set(t1 - 2 - k, y, O); set(t1 - 3 - k, y, Od); } box(19, 40, 28, 43, O); row(40, 19, 28, Od); }
        if (pants) { row(44, t0, t1, Od); row(45, t0, t1, Odd); }
      }
      /* braços (3 de largura) e mãos; o braço do lado do pé parado vai à frente (a mão sobe) */
      const cuff = top === 'camisa' ? Tl : top === 'moletom' ? Td : null;
      const arm = (x0, leftArm, raise) => {
        const xs = [x0, x0 + 1, x0 + 2], end = 43 - raise;
        for (let y = 33; y <= end; y++) xs.forEach((x, i) => {
          const sl = y <= SLEEVE - raise, inner = leftArm ? i === 2 : i === 0, outer = leftArm ? i === 0 : i === 2;
          let c = sl ? (inner ? Tdd : outer ? (leftArm ? Tl : Td) : T) : (inner ? Sd : outer && !leftArm ? Sd : outer ? Sl : S);
          if (sl && cuff && y >= SLEEVE - raise - 1) c = inner ? Tdd : top === 'moletom' && (x + y) % 2 ? Tdd : cuff;
          if (sl && !cuff && y === SLEEVE - raise && top !== 'blusa' && top !== 'regata') c = inner ? Tdd : Td;   // barra da manga curta
          if (!sl && y === SLEEVE - raise + 1 && top !== 'regata') c = Sd;                                        // sombra da manga
          set(x, y, c);
        });
        if (top === 'blusa') for (let y = 33; y <= 35 - raise; y++) set(leftArm ? x0 - 1 : x0 + 3, y, leftArm ? Tl : Td);   // manga bufante
        const sh = top === 'regata';                                          // ombro arredondado
        set(leftArm ? x0 + 2 : x0, 32, sh ? S : T); set(x0 + 1, 32, sh ? (leftArm ? Sl : Sd) : leftArm ? Tl : Td);
        const hy = end + 1;                                                   // mão: palma, dedos e polegar
        xs.forEach((x, i) => { set(x, hy, S); set(x, hy + 1, (leftArm ? i === 0 : i === 2) ? Sd : S); set(x, hy + 2, i === 1 ? Sd : S); });
        set(leftArm ? x0 + 2 : x0, hy, Sd); set(leftArm ? x0 + 2 : x0, hy + 2, null);
      };
      arm(t0 - 3, true, stepR ? 2 : 0); arm(t1 + 1, false, stepL ? 2 : 0);

      /* cabeça: rosto oval, queixo definido sem alongar; diferenças discretas entre as bases */
      const head = { 12: [20, 27], 13: [18, 29], 14: [17, 30] };
      for (let y = 15; y <= 24; y++) head[y] = [16, 31];
      Object.assign(head, masc ? { 25: [16, 31], 26: [17, 30], 27: [18, 29], 28: [19, 28], 29: [21, 26] } : { 25: [17, 30], 26: [17, 30], 27: [18, 29], 28: [20, 27], 29: [21, 26] });
      spans(head, (x, y, a, b) => (x === b ? Sd : x === b - 1 && y >= 24 ? mix(S, Sd, 0.5) : x === a && y > 14 && y < 26 ? Sl : S));
      for (const ex of [15, 32]) { box(ex, 20, ex, 23, ex < 24 ? S : Sd); if (down) set(ex, 22, Sd); }   // orelhas pequenas
      if (down) {
        /* olhos: 2x3, pálpebra escura, brilho do mesmo lado nos dois (olhar de frente, amigável) */
        const eye = (x0, lashX) => {
          row(20, x0, x0 + 1, EYE); set(x0, 21, '#ffffff'); set(x0 + 1, 21, EYE); set(x0, 22, IRIS); set(x0 + 1, 22, mix(IRIS, EYE, 0.5));
          if (fem) set(lashX, 19, EYE);                                       // cílio
        };
        eye(20, 19); eye(26, 28);
        const BR = mix(Hd, S, 0.3);                                           // sobrancelhas na cor do cabelo, suaves
        row(18, 19, 21, BR); row(18, 26, 28, BR); if (masc) { set(19, 18, mix(Hd, S, 0.15)); set(28, 18, mix(Hd, S, 0.15)); }
        set(24, 24, Sd);                                                      // nariz: um ponto de sombra
        if (fem) { set(19, 24, BLUSH); set(28, 24, BLUSH); }
        if (fem) row(26, 23, 24, LIP); else row(26, 22, 25, mix(S, '#8a4a40', 0.32));
        row(29, head[29][0], head[29][1], Sd);
      }
      if (look.hair === 'careca' && !hat) { set(20, 13, Sl); set(21, 13, Sl); set(19, 14, Sl); set(21, 12, mix(Sl, '#ffffff', 0.35)); }
    } else {
      /* ============ PERFIL (desenhado olhando para a esquerda; o direito é espelhado no fim) ============ */
      const sw = stepL ? -1 : stepR ? 1 : 0;
      const cloth = y => bottom === 'calca' || (bottom === 'short' && y <= 50);
      const leg = (x0, near, kick) => {
        for (let y = pants ? 46 : bottom === 'saiaLonga' ? 57 : 51; y <= 57; y++) for (let i = 0; i < 5; i++) {
          const x = x0 + i + Math.round(kick * (y - 46) / 11), cl = cloth(y);
          let c = i === 0 ? (cl ? (near ? Bl : Bd) : near ? Sl : Sd) : i === 4 ? (cl ? Bdd : Sd) : cl ? (near ? B : Bd) : (near ? S : Sd);
          if (bottom === 'short' && y === 50) c = Bdd; if (bottom === 'short' && y === 51) c = Sd;
          set(x, y, c);
        }
        const fx = x0 + Math.round(kick) - 2;
        row(58, fx + 1, fx + 6, near ? SH : SHd); row(59, fx, fx + 7, near ? SH : SHd); row(60, fx, fx + 7, near ? SH : SHd); row(61, fx, fx + 7, SHd); set(fx + 1, 58, near ? SHl : SH); set(fx, 59, near ? SHl : SH);
      };
      if (!sw) leg(21, true, 0); else { leg(sw < 0 ? 23 : 19, false, sw < 0 ? 2 : -2); leg(sw < 0 ? 19 : 23, true, sw < 0 ? -2 : 2); }
      const s0 = masc ? 18 : 19, s1 = masc ? 29 : 28;
      if (pants) { box(s0 + 1, 44, s1 - 1, 47, B); row(44, s0, s1, Bdd); row(45, s0, s1, Bd); set(s0 + 1, 46, Bl); }
      else if (bottom === 'saiaLonga') for (let y = 44; y <= 57; y++) { const w = Math.floor((y - 44) / 4), o = y >= 50 ? sw : 0; row(y, s0 - w + o, s1 + w + o, y === 57 ? Bdd : B); set(s0 - w + o, y, Bl); set(s1 + w + o, y, Bd); if (y > 46) set(24 + o + Math.round((y - 46) / 4), y, Bd); }
      else for (let y = 44; y <= 51; y++) { const w = Math.floor((y - 44) / 2); row(y, s0 - w, s1 + w, y === 51 ? Bd : B); set(s0 - w, y, Bl); set(s1 + w, y, Bd); }
      // pescoço e tronco
      box(22, 29, 26, 31, S); row(30, 22, 26, Sd); set(26, 31, Sd);
      for (let y = 32; y <= 43; y++) { let a = s0, b = s1; if (y === 32) { a++; b -= 2; } if (fem && y >= 38 && y <= 40) { a++; b--; } row(y, a, b, T); set(a, y, Tl); set(b, y, Td); set(b - 1, y, Td); }
      row(43, s0, s1, Td);
      if (top === 'camisa') { set(s0 + 1, 32, '#f4f0ea'); set(s0 + 2, 32, '#f4f0ea'); set(s0 + 1, 33, '#f4f0ea'); for (let y = 35; y <= 42; y += 3) set(s0 + 1, y, Td); }
      else if (top === 'blusa') { row(32, s0 + 1, s0 + 2, S); for (let x = s0; x <= s1; x++) set(x, 43, x % 3 ? T : Tl); }
      else if (top === 'camiseta' || jard) { set(s0 + 1, 32, Sd); set(s0 + 2, 32, Tdd); row(42, s0, s1, Td); }
      else if (top === 'regata') { row(32, s0 + 1, s0 + 3, S); set(s0, 33, S); row(32, s1 - 3, s1 - 2, Sd); row(42, s0, s1, Td); }
      else if (top === 'moletom') {
        box(s1 - 2, 29, s1 + 1, 36, Td); box(s1 - 2, 30, s1, 35, T); set(s1 - 2, 30, Tl);                     // capuz caído nas costas
        set(s0 + 1, 32, Td); for (let y = 33; y <= 37; y++) set(s0 + 1, y, '#efe8dc');
        box(s0, 38, s0 + 3, 41, Td); row(38, s0, s0 + 3, Tdd);
        for (let x = s0; x <= s1; x++) { set(x, 42, x % 2 ? Td : T); set(x, 43, Tdd); }
      }
      if (jard) { box(s0, 37, s0 + 4, 43, O); for (let y = 37; y <= 43; y++) set(s0, y, Ol); for (let y = 32; y <= 36; y++) set(s0 + 3 + Math.floor((y - 32) / 2), y, Od); set(s0 + 1, 37, '#f2cf5a'); box(s0 + 5, 41, s1, 43, O); if (pants) { row(44, s0, s1, Od); row(45, s0, s1, Odd); } }
      // braço: ombro fixo, antebraço balança
      const ax = 22 + sw * 2;
      for (let y = 37; y <= 42; y++) { if (get(ax - 1, y)) set(ax - 1, y, Tdd); if (get(ax + 4, y)) set(ax + 4, y, Tdd); }
      for (let y = 32; y <= 43; y++) {
        const x = y <= 36 ? 22 : ax, sl = y <= SLEEVE, ww = y === 32 ? [1, 2] : [0, 1, 2, 3];
        for (const i of ww) set(x + i, y, sl ? (i === 0 ? Tl : i === 3 ? Td : T) : (i === 3 ? Sd : i === 0 ? Sl : S));
        if (sl && (top === 'camiseta' || jard) && y === SLEEVE) for (let i = 0; i < 4; i++) set(x + i, y, Td);
        if (sl && top === 'moletom' && y >= SLEEVE - 1) for (let i = 0; i < 4; i++) set(x + i, y, (i + y) % 2 ? Tdd : Td);
        if (sl && top === 'camisa' && y >= SLEEVE - 1) for (let i = 0; i < 4; i++) set(x + i, y, i === 3 ? Td : Tl);
        if (!sl && y === SLEEVE + 1 && top !== 'regata') for (let i = 0; i < 4; i++) set(x + i, y, Sd);
      }
      if (top === 'blusa') { box(21, 32, 26, 35, T); set(21, 32, Tl); row(35, 21, 26, Td); }
      for (let i = 0; i < 4; i++) { set(ax + i, 44, S); set(ax + i, 45, i === 3 ? Sd : S); if (i % 3) set(ax + i, 46, S); }   // mão
      // cabeça de perfil: nuca arredondada, nariz pequeno, queixo leve
      const head = { 12: [20, 27], 13: [18, 29], 14: [17, 30] }; for (let y = 15; y <= 24; y++) head[y] = [16, 31];
      Object.assign(head, { 25: [16, 30], 26: [17, 30], 27: [17, 29], 28: masc ? [18, 28] : [19, 27], 29: [20, 26] });
      spans(head, (x, y, a, b) => (x === b ? Sd : x >= 26 && y >= 25 ? mix(S, Sd, 0.5) : x === a && y > 14 ? Sl : S));
      set(15, 22, S); set(15, 23, Sd);                                        // nariz
      row(20, 17, 19, EYE); set(17, 21, WHITE); set(18, 21, EYE); set(17, 22, IRIS); set(18, 22, EYE); if (fem) set(16, 19, EYE);   // olho
      row(18, 17, 20, mix(Hd, S, 0.3));
      if (fem) { set(16, 26, LIP); set(17, 26, LIP); } else row(26, 16, 18, mix(S, '#8a4a40', 0.32));
      if (fem) set(19, 24, BLUSH);
      box(25, 20, 26, 23, S); set(26, 20, Sd); set(26, 23, Sd); set(25, 22, Sd);   // orelha
      row(29, 20, 26, Sd);
      if (look.hair === 'careca' && !hat) { set(21, 13, Sl); set(22, 13, Sl); set(20, 14, Sl); }
    }
    hairP.front();

    /* ---------- acessórios e chapéus ---------- */
    const acc = look.accessory;
    const A = look.accColor || '#e04a3a', Ad = shade(A, 0.7), Al = mix(A, '#ffffff', 0.35);
    if (acc === 'cachecol') {                                                 // cachecol de tricô no pescoço, ponta caindo na frente
      const under = [null, S, Sd, Sl, Sdd, T, Td, Tdd, Tl, O, Od, Odd, Ol];
      const knit = (x, y, c) => { if (up && !under.includes(get(x, y))) return; set(x, y, (x + y) % 2 ? c : shade(c, 0.9)); };
      if (!side) {
        for (let y = 29; y <= 32; y++) for (let x = 19; x <= 28; x++) knit(x, y, y === 29 ? Al : y === 32 ? Ad : x >= 27 ? Ad : A);
        if (down) { for (let y = 33; y <= 39; y++) for (let x = 19; x <= 21; x++) knit(x, y, x === 19 ? Al : x === 21 ? Ad : A); for (let x = 19; x <= 21; x++) set(x, 40, x % 2 ? Ad : Al); row(35, 19, 21, Ad); }
      } else {
        for (let y = 29; y <= 32; y++) for (let x = 20; x <= 27; x++) knit(x, y, y === 29 ? Al : y === 32 ? Ad : A);
        for (let y = 33; y <= 38; y++) for (let x = 18; x <= 20; x++) knit(x, y, x === 18 ? Al : A); row(39, 18, 20, Ad);
      }
    }
    if (acc === 'oculos') {                                                   // armação arredondada em volta dos olhos
      const F = '#2a2430';
      const lens = (x0, x1) => { row(19, x0 + 1, x1 - 1, F); row(23, x0 + 1, x1 - 1, F); for (let y = 20; y <= 22; y++) { set(x0, y, F); set(x1, y, F); } };
      if (down) { lens(18, 22); lens(25, 29); row(20, 23, 24, F); set(17, 20, F); set(16, 20, F); set(30, 20, F); set(31, 20, F); }
      else if (side) { lens(16, 20); row(20, 21, 24, F); }
      else { set(15, 19, F); set(32, 19, F); }
    }
    if (acc === 'bandana') {                                                  // faixa na cabeça com bolinhas e nó atrás
      const y0 = hat ? brimTop + 3 : 15, dots = (x, y) => (x + 2 * y) % 5 === 0;
      const xa = side ? 16 : 15, xb = side ? 32 : 32;
      for (let y = y0; y <= y0 + 2; y++) for (let x = xa; x <= xb; x++) if (get(x, y)) set(x, y, y === y0 ? Al : y === y0 + 2 ? Ad : dots(x, y) ? '#f4f0ea' : A);
      if (up) { box(22, y0 + 3, 25, y0 + 4, Ad); set(21, y0 + 5, A); set(20, y0 + 6, Ad); set(26, y0 + 5, A); set(27, y0 + 6, Ad); }
      if (side) { box(33, y0 + 1, 34, y0 + 2, Ad); set(35, y0 + 3, A); set(35, y0 + 4, Ad); set(34, y0 + 4, A); }
    }
    if (hat === 'palha') {                                                    // palha trançada, fita vermelha e aba larga
      const st = '#e8c860', sd = '#c8a040', sdd = '#a07e2c', sl = '#f6e094', band = '#8a3a2a', weave = (x, y) => ((x + y) % 4 === 0 ? sd : (x - y + 40) % 4 === 0 ? sl : st);
      const c0 = side ? 18 : 17, c1 = side ? 31 : 30;
      for (let y = 8; y <= 15; y++) { const ins = y === 8 ? 2 : y === 9 ? 1 : 0; for (let x = c0 + ins; x <= c1 - ins; x++) set(x, y, x >= c1 - 1 - ins ? sd : weave(x, y)); }
      row(8, c0 + 3, c1 - 3, sl); row(14, c0, c1, band); row(15, c0, c1, shade(band, 0.75)); set(c0 + 2, 14, mix(band, '#ffffff', 0.3));
      const b0 = side ? 9 : 10, b1 = 37;
      for (let x = b0 + 1; x <= b1 - 1; x++) set(x, 16, weave(x, 16)); row(17, b0, b1, sd); row(18, b0 + 2, b1 - 2, sdd);
      if (down) for (let x = 17; x <= 30; x++) if ([S, Sl].includes(get(x, 19))) set(x, 19, Sd);
    } else if (hat === 'boina') {                                             // boina de feltro inclinada, com pino
      const c = '#c8483a', cd = '#962e24', cdd = '#74221a', cl = '#e66a5c';
      const cxB = side ? 24 : 25;
      for (let y = 8; y <= 16; y++) for (let x = 12; x <= 37; x++) if (ell(x, y, cxB, 12, side ? 9.5 : 10.5, 4.3)) set(x, y, y <= 10 && x < cxB ? cl : x > cxB + 5 || y >= 15 ? cd : c);
      row(16, 16, 31, cdd); set(cxB, 7, cdd); set(cxB, 8, cd);
      if (down) for (let x = 17; x <= 30; x++) if ([S, Sl].includes(get(x, 17))) set(x, 17, Sd);
    } else if (hat === 'pescador') {                                          // copa baixa assentada na cabeça, aba caída curta
      const c = '#8a9a6a', cd = '#64744a', cdd = '#4a5636', cl = '#a8b886';
      const x0 = side ? 17 : 16, x1 = 31;
      for (let y = 9; y <= 15; y++) { const ins = y === 9 ? 2 : y === 10 ? 1 : 0; for (let x = x0 + ins; x <= x1 - ins; x++) set(x, y, x <= x0 + 1 + ins ? cl : x >= x1 - 1 - ins ? cd : c); }
      row(13, x0, x1, cd); for (let x = x0 + 2; x <= x1 - 2; x += 3) set(x, 11, cd);
      row(16, x0 - 2, x1 + 2, cl); row(17, x0 - 3, x1 + 3, c); row(18, x0 - 3, x1 + 3, cd); set(x0 - 3, 17, cd); set(x1 + 3, 17, cdd);
      if (down) for (let x = 17; x <= 30; x++) if ([S, Sl].includes(get(x, 19))) set(x, 19, Sd);
    }
    if (acc === 'laco') {                                                     // laço no cabelo ou na fita do chapéu
      const bow = (x0, y0) => {
        [[0, 1], [1, 0], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2], [1, 3]].forEach(([dx, dy]) => set(x0 + dx, y0 + dy, A));
        [[6, 1], [5, 0], [5, 1], [4, 1], [6, 2], [5, 2], [4, 2], [5, 3]].forEach(([dx, dy]) => set(x0 + dx, y0 + dy, A));
        set(x0 + 1, y0, Al); set(x0 + 5, y0, Al); set(x0 + 2, y0 + 3, Ad); set(x0 + 4, y0 + 3, Ad); set(x0 + 6, y0 + 2, Ad);
        box(x0 + 3, y0 + 1, x0 + 3, y0 + 2, Ad); set(x0 + 3, y0 + 1, A);
      };
      if (hat) { if (down) bow(24, brimTop - 4); else if (up) bow(17, brimTop - 4); else bow(25, brimTop - 4); }
      else if (down) bow(25, 9); else if (up) bow(16, 9); else bow(24, 8);
    }
    /* ---------- contorno (1 px, levemente tingido pela cor vizinha) ---------- */
    const filled = G.map(r => r.slice());
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (filled[y][x]) continue;
      const n = (filled[y + 1] && filled[y + 1][x]) || filled[y][x - 1] || filled[y][x + 1] || (filled[y - 1] && filled[y - 1][x]);
      if (n) G[y][x] = mix(OUT, n, 0.16);
    }
    /* altura do Caleb: o desenho ganha linhas só nos trechos lisos (pescoço, meio do tronco e pernas), sem tocar no rosto */
    const c = document.createElement('canvas'); c.width = W; c.height = HO; const g = c.getContext('2d');
    ROWS.forEach((sy, y) => { for (let x = 0; x < W; x++) if (G[sy][x]) { g.fillStyle = G[sy][x]; g.fillRect(right ? W - 1 - x : x, y, 1, 1); } });
    return c;
  }
  return { W, H: HO, supports, render, STYLES };
})();
