/* =====================================================================
   Jogador em alta definição (48x64 por quadro, mostrado em 24x32 no mundo:
   dois pixels do desenho por pixel do mundo, como o Caleb).
   Usa o mesmo sistema de personalização (pele, base, penteado, cor do
   cabelo em HSL, roupas e cores): só o desenho é novo. Cada parte tem
   contorno controlado, luz à esquerda, sombra à direita e separação clara
   entre queixo, pescoço, roupa, braços, mãos, pernas e calçados.
   Etapa atual: penteado "Curto liso" com as roupas iniciais (camisa e
   calça; blusa e saia). As demais combinações continuam com o desenho
   anterior até serem redesenhadas (PlayerArt.supports).
   A geometria segue a do sprite do mundo (cabeça, mãos e pés nos mesmos
   pontos), então ferramentas, colisões e apoio dos pés não mudam.
   ===================================================================== */
const PlayerArt = (() => {
  const W = 48, H = 64, OUT = '#21151a';
  const hx = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const toHex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, k) => { const A = hx(a), B = hx(b); return toHex(A.map((v, i) => v + (B[i] - v) * k)); };
  const shade = (h, k) => toHex(hx(h).map(v => v * k));

  const HAIRS = Sprites.HAIRS.map(h => h.id), TOPS = Sprites.TOPS.map(t => t.id), BOTTOMS = Sprites.BOTTOMS.map(b => b.id);
  /* combinações já redesenhadas (o resto usa o desenho anterior) */
  const ACCS = Sprites.ACCESSORIES.map(a => a.id), HATS = Sprites.HATS.map(h => h.id);
  const supports = look => !!look && look.crisp && HAIRS.includes(look.hair) && TOPS.includes(look.top) && BOTTOMS.includes(look.bottom)
    && (!look.hat || HATS.includes(look.hat)) && (!look.accessory || ACCS.includes(look.accessory)) && ['m', 'f', 'n'].includes(look.body || 'n')
    && !look.beard && !look.earring;

  /* ---------- demais penteados: a silhueta de cada estilo vem da máscara já existente (mesmo formato, mesmas
     diferenças entre estilos), redesenhada no dobro da densidade: cantos arredondados, textura própria de cada tipo
     de fio (mechas lisas, ondas, cachos, crespo), luz no alto à esquerda, sombra à direita e nas pontas ---------- */
  function paintHair(look, dir, P) {
    const { set, get, S, Sd, Sl, Sdd, Hb, Hd, Hl, Hdd, Hm, up, side, down } = P, hair = look.hair;
    const skin = c => c === S || c === Sd || c === Sl || c === Sdd;
    /* crânio por baixo (careca e raspado mostram a cabeça redonda; nos outros evita frestas) */
    const skull = side ? { 13: [21, 27], 14: [19, 29], 15: [18, 30], 16: [17, 31] } : { 13: [20, 27], 14: [18, 29], 15: [17, 30], 16: [16, 31] };
    if (hair === 'careca' || hair === 'raspado') for (const y in skull) for (let x = skull[y][0]; x <= skull[y][1]; x++) set(x, +y, x >= skull[y][1] - 1 ? Sd : x <= skull[y][0] + 1 && +y > 13 ? Sl : S);
    if (hair === 'careca') {                                                   // brilho no alto da cabeça
      if (!side) { set(20, 14, Sl); set(21, 14, Sl); set(19, 15, Sl); set(21, 13, mix(Sl, '#ffffff', 0.3)); } else { set(21, 14, Sl); set(22, 14, Sl); set(20, 15, Sl); }
      return;
    }
    const m = Sprites.hairMask(look, dir), M = new Set(m.hm), back = new Set(m.back), tex = m.tex;
    const inM = (X, Y) => M.has(X + ',' + Y);
    const hs = new Map();                                                      // pixel -> está atrás do corpo?
    for (const k of M) {
      const [X, Y] = k.split(',').map(Number), n = [inM(X - 1, Y), inM(X + 1, Y), inM(X, Y - 1), inM(X, Y + 1)].filter(Boolean).length;
      for (let sy = 0; sy < 2; sy++) for (let sx = 0; sx < 2; sx++) {
        if (n >= 2 && !inM(X + (sx ? 1 : -1), Y) && !inM(X, Y + (sy ? 1 : -1))) continue;   // canto arredondado
        hs.set((2 * X + sx) + ',' + (2 * Y + sy), back.has(k));
      }
    }
    const emo = hair === 'emo';
    for (const k of [...hs.keys()]) {                                          // olhos sempre à mostra (o emo cobre um deles de propósito)
      const [x, y] = k.split(',').map(Number);
      if (down && y >= 23 && y <= 28 && x >= 17 && x <= 30 && !(emo && x <= 23)) hs.delete(k);
      if (side && y >= 23 && y <= 27 && x >= 17 && x <= 21 && !emo) hs.delete(k);
    }
    const has = (x, y) => hs.has(x + ',' + y);
    let minY = 99; const colTop = {};
    for (const k of hs.keys()) { const [x, y] = k.split(',').map(Number); minY = Math.min(minY, y); if (colTop[x] === undefined || y < colTop[x]) colTop[x] = y; }
    const xs = [...hs.keys()].map(k => +k.split(',')[0]), xa = Math.min(...xs), xb = Math.max(...xs), cx = (xa + xb) / 2;
    const shaved = hair === 'raspado', R = shaved ? [mix(Hb, S, 0.42), mix(Hd, S, 0.3), mix(Hl, S, 0.5)] : null;
    const braid = hair === 'trancas', TIE = '#e8c040', TIEd = '#a8842c';
    const px = side ? cx + 3 : up ? cx : cx + 2, py = minY - 5;
    const lockAt = (x, y) => {                                                 // posição dentro da mecha (u de 0 a 1), índice da mecha, distância ao pivô
      const dx = x + 0.5 - px, dy = Math.max(1, y + 0.5 - py), r = Math.hypot(dx, dy);
      const wave = tex === 'wavy' ? 0.3 * Math.sin(r / 2.8) : tex === 'curly' ? 0.42 * Math.sin(r / 1.7) : tex === 'coily' ? 0.5 * Math.sin(r / 0.9) : 0;
      const q = Math.atan2(dx, dy) * Math.sqrt(r) * (tex === 'coily' ? 1.15 : 0.62) + wave + 40, li = Math.floor(q);
      return [q - li, li, r];
    };
    /* contorno acompanha as mechas: tufos saem um pixel para fora e os vãos entram (silhueta recortada, não em bloco) */
    if (!shaved) {
      const add = [], del = [];
      for (const k of hs.keys()) {
        const [x, y] = k.split(',').map(Number), [u] = lockAt(x, y), ox = x < cx ? -1 : 1;
        const faceZone = (down && x >= 16 && x <= 31 && y >= 17) || (side && x <= 21 && y >= 17);
        if (!has(x + ox, y) && y > minY + 3 && !faceZone) { if (u > 0.38 && u < 0.62) add.push((x + ox) + ',' + y); else if (u < 0.1 && has(x - ox, y)) del.push(k); }
        if (!has(x, y - 1) && u > 0.42 && u < 0.58 && y > minY && Math.abs(x - cx) > 4) add.push(x + ',' + (y - 1));
      }
      del.forEach(k => hs.delete(k)); add.forEach(k => hs.set(k, false));
    }
    if (side) for (const k of [...hs.keys()]) { const [x, y] = k.split(',').map(Number); if (x < 15 && y < 24) hs.delete(k); }   // nada de aba à frente da testa
    /* pontas das mechas afinadas (franja e cabelo comprido terminam em bicos, não em linha reta) */
    if (tex !== 'coily' && !shaved) for (const k of [...hs.keys()]) {
      const [x, y] = k.split(',').map(Number); if (has(x, y + 1) && has(x, y + 2)) continue;
      const [u] = lockAt(x, y), edge = !has(x, y + 1) ? 0.3 : 0.15;
      if ((u < edge || u > 1 - edge * 0.6) && (y > 30 || (down && y >= 19 && x >= 16 && x <= 31))) hs.delete(k);
    }
    const color = (x, y) => {
      if (shaved) return (x * 3 + y * 5) % 4 === 0 ? R[1] : !has(x, y - 1) && x < cx ? R[2] : !has(x + 1, y) || !has(x, y + 1) ? R[1] : R[0];
      const ty = y - (colTop[x] !== undefined ? colTop[x] : minY), upper = y < minY + 9;
      /* mechas: cada uma sai do alto da cabeça (pivô acima do topo) e desce em leque; vão escuro entre mechas,
         faixa de brilho perto do topo e brilho fino ao longo da mecha (como o cabelo desenhado à mão) */
      const [u, li, r] = lockAt(x, y);
      let c;
      if (tex === 'coily') {                                                   // crespo: molinhas pequenas e fechadas, em tufos, com brilho salpicado
        const ring = (Math.floor(r * 1.1) + li) % 3;
        c = u < 0.18 ? Hdd : u < 0.34 ? Hd : ring === 0 ? Hd : u > 0.5 && u < 0.75 && ring === 1 ? (upper || x < cx ? Hm : Hb) : Hb;
        if (u > 0.5 && u < 0.75 && ring === 1 && (ty <= 5 || (x * 7 + y * 3) % 11 === 0) && x < cx + 4) c = Hl;
      } else {
        c = Hb;
        if (u < 0.1) c = r > 14 ? Hdd : Hd;                                    // vão entre mechas
        else if (u < 0.22 || u > 0.92) c = Hd;
        else if (u > 0.4 && u < 0.66) {
          c = Hm;
          const gloss = ty >= 2 && ty <= 6, streak = (Math.floor(r) + li * 3) % 9 < 3;
          if (gloss || (streak && y > minY + 10)) c = Hl;                    // brilho: faixa no alto e reflexos ao longo
        }
        if (tex === 'curly' && u > 0.3 && u < 0.45 && (Math.floor(r) + li) % 4 === 0) c = Hd;   // espiral do cacho
      }
      if (braid && y > 30) {                                                   // tranças: gomos em zigue-zague
        const seg = (y + (x % 4 < 2 ? 0 : 2)) % 4; c = seg === 0 ? Hd : seg === 1 ? Hm : Hb;
      }
      if (x > cx + (xb - xa) * 0.28) c = c === Hl ? Hm : c === Hm ? Hb : c === Hb ? Hd : c;   // lado direito na sombra
      if (!has(x + 1, y)) c = Hd;
      if (!has(x, y + 1)) c = y > 30 ? Hdd : Hd;                               // pontas
      if (!has(x, y - 1) && !has(x - 1, y)) c = Hm;
      else if (!has(x, y - 1) && x < cx && c !== Hd) c = Hm;
      return c;
    };
    for (const [k, isBack] of hs) {
      const [x, y] = k.split(',').map(Number);
      if (isBack && get(x, y)) continue;                                       // camada de trás: só onde não há corpo
      set(x, y, color(x, y));
    }
    /* sombra do cabelo na pele logo abaixo */
    for (let x = 14; x <= 33; x++) for (let y = 16; y <= 34; y++) if (has(x, y) && !has(x, y + 1) && skin(get(x, y + 1)) && y + 1 <= 33) set(x, y + 1, Sdd);
    /* detalhes de cada estilo */
    const pts = [...hs.keys()].map(k => k.split(',').map(Number));
    if (braid) {                                                               // elástico amarelo na ponta de cada trança
      const cols = down ? [[10, 11], [14, 15], [32, 33], [36, 37]] : up ? [[14, 17], [18, 21], [26, 29], [32, 35]] : [[24, 25], [28, 29], [32, 33]];
      for (const [x0, x1] of cols) {
        let yb = 0; for (let x = x0; x <= x1; x++) for (let y = 30; y < 64; y++) if (has(x, y)) yb = Math.max(yb, y);
        if (yb) for (let x = x0; x <= x1; x++) { if (has(x, yb - 3)) set(x, yb - 3, TIE); if (has(x, yb - 2)) set(x, yb - 2, TIEd); }
      }
    }
    if (hair === 'rabo') {                                                     // prendedor no alto do rabo
      const A = look.accessory && look.accColor ? look.accColor : '#d0483c', Ad = shade(A, 0.7);
      const band = down ? [33, 38, 18, 19] : side ? [31, 38, 18, 19] : [19, 28, 29, 30];
      for (let y = band[2]; y <= band[3]; y++) for (let x = band[0]; x <= band[1]; x++) if (has(x, y)) set(x, y, y === band[2] ? A : Ad);
    }
    if (hair === 'coque' && !look.hat) {                                                    // coque redondo no alto, enrolado, com faixa na base
      const [bx, by, rr] = side ? [31, 9, 5] : [24, 8, 5.2];
      for (let y = by - 6; y <= by + 6; y++) for (let x = bx - 6; x <= bx + 6; x++) {
        const d = Math.hypot(x + 0.5 - bx - 0.5, (y + 0.5 - by - 0.5) * 1.1); if (d > rr) continue;
        const a2 = Math.atan2(y - by, x - bx), sp = (d * 0.9 + a2 * 1.3 + 20) % 2;
        let c = sp < 0.55 ? Hd : sp < 1.1 ? Hb : Hm;
        if (d > rr - 1 && (y > by || x > bx)) c = Hd; else if (d < 2.6 && x <= bx && y <= by) c = Hl;
        set(x, y, c);
      }
      for (let x = bx - 3; x <= bx + 3; x++) { set(x, by + 5, look.accessory ? (look.accColor || '#d0483c') : Hdd); }
    }
    if (emo && look.streak && !up) {                                           // mecha prateada (opcional) na franja
      const st = down ? [[16, 24, 33], [17, 24, 33], [18, 22, 25], [19, 22, 25]] : [[18, 22, 25], [19, 22, 25], [16, 26, 27], [17, 26, 27]];
      for (const [x, y0, y1] of st) for (let y = y0; y <= y1; y++) if (has(x, y)) set(x, y, y < y0 + 2 || x % 2 === 0 ? '#e6e2ea' : '#b8b4c0');
    }
    if (hair === 'medioLateral' && down) for (let y = 14; y <= 16; y++) if (has(26, y)) set(26, y, Hdd);   // risca lateral
  }

  function render(look, frame, dir) {
    const G = Array.from({ length: H }, () => Array(W).fill(null));
    const set = (x, y, c) => { if (x >= 0 && x < W && y >= 0 && y < H) G[y][x] = c; };
    const row = (y, a, b, c) => { for (let x = a; x <= b; x++) set(x, y, c); };
    const box = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) row(y, x0, x1, c); };
    const get = (x, y) => (x >= 0 && x < W && y >= 0 && y < H ? G[y][x] : null);
    const spans = (rows, c, f) => { for (const y in rows) { const [a, b] = rows[y]; for (let x = a; x <= b; x++) set(x, +y, f ? f(x, +y, a, b) : c); } };

    /* ---------- paletas ---------- */
    const sk = Sprites.SKINS.find(s => s.id === look.skin) || Sprites.SKINS[0], [S, Sd, Sl] = sk.c, Sdd = shade(Sd, 0.82);
    const [Hb, Hd, Hl] = Sprites.hairPaletteOf(look), Hdd = shade(Hd, 0.72), Hm = mix(Hb, Hl, 0.5);
    const top = look.top, bottom = look.bottom, jard = top === 'jardineira';
    const O = look.topColor || '#3f86d0', Od = shade(O, 0.74), Odd = shade(O, 0.58), Ol = mix(O, '#ffffff', 0.26);   // cor escolhida (macacão na jardineira)
    const T = jard ? '#eee4cc' : O, Td = shade(T, 0.8), Tdd = shade(T, 0.64), Tl = mix(T, '#ffffff', 0.3);
    const SLEEVE = { camisa: 50, moletom: 50, blusa: 43, camiseta: 44, jardineira: 44, regata: 39 }[top];
    const pants = bottom === 'calca' || bottom === 'short';
    const B = look.bottomColor || '#3a4a8a', Bd = shade(B, 0.74), Bdd = shade(B, 0.58), Bl = mix(B, '#ffffff', 0.22);
    const SH = look.shoeColor || '#3a2a22', SHd = shade(SH, 0.68), SHl = mix(SH, '#ffffff', 0.28);
    const fem = look.body === 'f', masc = !fem, up = dir === 'up', side = dir === 'side', down = !up && !side;
    const stepL = frame === 1, stepR = frame === 2;
    const EYE = '#2a1a1e', IRIS = '#5a3a2a', WHITE = '#f4f0ea', LIP = mix(S, '#c8506a', fem ? 0.5 : 0.25), BLUSH = mix(S, '#e87a7a', fem ? 0.35 : 0.12);

    if (!side) {
      /* ============ FRENTE E COSTAS ============ */
      const t0 = masc ? 15 : 17, t1 = masc ? 32 : 30;                         // tronco
      const aw = 4, aL0 = t0 - aw, aR1 = t1 + aw;                             // braços (4 px cada)
      /* pernas e calçados */
      const legL = [masc ? 17 : 18, 22], legR = [25, masc ? 30 : 29];
      const lift = (x) => (stepL && x <= 23 ? 2 : stepR && x >= 24 ? 2 : 0);
      if (pants) {
        for (const [a, b] of [legL, legR]) for (let y = 52; y <= 57; y++) for (let x = a; x <= b; x++) {
          const yy = y - lift(x); let c = B;
          if (bottom === 'short' && y >= 55) { const k = a < 24 ? 1 : 0; c = x === a + k ? Sl : x === b - (1 - k) ? Sd : S; if (x < a + k || x > b - (1 - k)) continue; set(x, yy, y === 55 ? Sd : c); continue; }   // short: barra e perna à mostra
          if (bottom === 'short' && y === 54) { set(x, yy, x === a || x === b ? Bdd : Bd); continue; }
          if (x === a) c = a < 24 ? Bl : B; if (x === b) c = Bd; if ((a < 24 && x === b) || (a > 24 && x === a)) c = Bdd;   // dobra de dentro
          if (y === 57) c = Bd;                                               // barra
          set(x, yy, c);
        }
        box(t0 + 1, 50, t1 - 1, 53, B); row(53, 23, 24, Bdd); set(23, 52, Bd); set(24, 52, Bd);
        for (let x = t0 + 1; x <= t1 - 1; x++) set(x, 53, get(x, 53) === B && (x < 20 || x > 27) ? B : get(x, 53));
      } else if (bottom === 'saiaLonga') {                                    // saia longa até o tornozelo, com pregas que balançam
        const sw = stepL ? -1 : stepR ? 1 : 0;
        for (let y = 48; y <= 57; y++) {
          const w = Math.floor((y - 48) / 2.5), o = y >= 53 ? sw : 0, a = t0 - w + o, b = t1 + w + o;
          row(y, a, b, B); set(a, y, Bl); set(a + 1, y, y > 50 ? Bl : B); set(b, y, Bdd); set(b - 1, y, Bd);
          for (const px of [20, 24, 28]) { const xx = px + Math.round((px - 24) * (y - 48) / 14) + o; if (y > 49) set(xx, y, Bd); if (y > 52) set(xx + 1, y, Bl); }
        }
        row(57, t0 - 3 + sw, t1 + 3 + sw, Bdd); row(48, t0, t1, Bdd);
      } else {                                                                // saia: abre em camadas, pernas finas
        for (const [a, b] of [[19, 21], [26, 28]]) for (let y = 54; y <= 57; y++) for (let x = a; x <= b; x++) set(x, y - lift(x), x === a ? Sl : x === b ? Sd : S);
        for (let y = 48; y <= 54; y++) { const w = Math.floor((y - 48) / 2); row(y, t0 - w, t1 + w, B); set(t0 - w, y, Bl); set(t1 + w, y, Bd); }
        row(54, t0 - 3, t1 + 3, Bd); for (const x of [20, 24, 28]) for (let y = 50; y <= 53; y++) set(x + (y > 51 && x !== 24 ? (x < 24 ? -1 : 1) : 0), y, Bd);   // pregas
        row(48, t0, t1, Bdd);
      }
      for (const [a, b] of [[16, 22], [25, 31]]) {                            // calçados (bico um pouco para fora)
        const l = lift(a + 1);
        row(58 - l, a, b, SH); set(a, 58 - l, SHl); set(a + 1, 58 - l, SHl);
        row(59 - l, a, b, SH); row(60 - l, a, b, SH); row(61 - l, a, b, SHd); set(a + 1, 59 - l, SHl);
      }
      /* tronco */
      for (let y = 40; y <= 49; y++) {
        let a = t0, b = t1; if (fem && y >= 45 && y <= 47) { a++; b--; }       // cintura
        row(y, a, b, T); set(a, y, Tl); set(b, y, Td); set(b - 1, y, y > 41 ? Td : T);
      }
      row(49, t0, t1, Td);
      /* pescoço (sombra do queixo no alto) */
      const n0 = fem ? 22 : 21, n1 = fem ? 25 : 26; box(n0, 36, n1, 39, Sd); row(36, n0, n1, Sdd); row(39, n0, n1, S); set(n1, 37, Sdd); set(n1, 38, Sdd);
      /* roupa de cima */
      if (top === 'camisa') {
        if (down) {
          box(23, 40, 24, 49, Tl); [42, 45, 48].forEach(y => { set(23, y, Td); });                    // vista e botões
          [[20, 40], [21, 40], [21, 41], [22, 41], [22, 42], [27, 40], [26, 40], [26, 41], [25, 41], [25, 42]].forEach(([x, y]) => set(x, y, '#f4f0ea'));   // gola
          set(19, 40, Tl); set(28, 40, Tl); set(23, 40, Sd); set(24, 40, Sd); set(23, 41, Sdd);
          box(18, 43, 21, 45, Td); row(43, 18, 21, Tdd); set(18, 44, T);                            // bolso
        } else { row(40, t0 + 1, t1 - 1, Tl); row(43, t0, t1, Td); for (let y = 44; y <= 48; y++) set(23, y, Td); }
      } else if (top === 'blusa') {                                           // blusa: decote, babado na barra
        if (down) { row(40, 20, 27, S); row(41, 21, 26, S); row(40, 22, 25, Sd); set(19, 40, Tl); set(28, 40, Td); row(42, 21, 26, Tl); set(20, 41, Tl); set(27, 41, Tl); }
        else row(40, 20, 27, Td);
        row(46, t0 + 1, t1 - 1, Td); for (let x = t0; x <= t1; x++) set(x, 48, (x % 3) ? T : Tl); row(49, t0, t1, Td);
      } else if (top === 'camiseta' || jard) {                                // camiseta: gola careca canelada, dobra no peito, barra
        if (down) { row(40, 21, 26, Tdd); row(41, 22, 25, Td); row(40, 22, 25, Sd); set(21, 41, Td); set(26, 41, Td); for (let y = 43; y <= 47; y += 2) set(t1 - 3, y, Td); set(t0 + 3, 44, Tl); }
        else row(40, 21, 26, Td);
        row(48, t0 + 1, t1 - 1, Td);
      } else if (top === 'regata') {                                          // regata: alças, cava funda e decote em U
        for (let y = 40; y <= 42; y++) { row(y, t0, t0 + (y === 42 ? 0 : 1), S); row(y, t1 - (y === 42 ? 0 : 1), t1, Sd); }
        set(t0 + 2, 40, Tl); set(t0 + 2, 41, Tl); set(t1 - 2, 40, Td); set(t1 - 2, 41, Td);
        if (down) { row(40, t0 + 4, t1 - 4, S); row(41, t0 + 5, t1 - 5, S); row(42, t0 + 6, t1 - 6, Sd); row(40, 22, 25, Sd); row(43, t0 + 6, t1 - 6, Tl); }
        else row(40, t0 + 4, t1 - 4, Sd);
        row(48, t0 + 1, t1 - 1, Td);
      } else if (top === 'moletom') {                                         // moletom: capuz, cordões, bolso canguru e barra canelada
        if (down) {
          row(39, 19, 21, T); row(39, 26, 28, Td); row(40, 19, 28, Td); set(19, 40, Tl); row(40, 22, 25, Sd); row(41, 21, 26, Tdd);   // capuz dobrado no pescoço
          for (let y = 41; y <= 45; y++) { set(21, y, '#efe8dc'); set(26, y, '#d8d0c4'); } set(21, 46, '#c8c0b4'); set(26, 46, '#b8b0a4');
          box(19, 45, 28, 47, T); row(45, 19, 28, Td); set(19, 46, Td); set(19, 47, Td); set(28, 46, Tdd); set(28, 47, Tdd); row(45, 21, 26, Tdd);   // bolso
        } else { box(18, 37, 29, 44, Td); box(19, 37, 28, 43, T); row(37, 20, 27, Tl); for (let y = 38; y <= 43; y++) set(28, y, Td); row(44, 19, 28, Tdd); }   // capuz nas costas
        for (let x = t0; x <= t1; x++) { set(x, 48, x % 2 ? Td : T); set(x, 49, Tdd); }
      }
      if (jard) {                                                             // jardineira: peito e alças na cor escolhida, fivelas
        if (down) {
          box(19, 43, 28, 49, O); for (let y = 43; y <= 49; y++) { set(19, y, Ol); set(28, y, Od); }
          for (let y = 40; y <= 42; y++) { set(t0 + 2 + (y - 40), y, O); set(t0 + 3 + (y - 40), y, Od); set(t1 - 2 - (y - 40), y, O); set(t1 - 3 - (y - 40), y, Ol); }
          set(19, 43, '#f2cf5a'); set(28, 43, '#d8b040'); box(22, 44, 25, 46, Od); row(44, 22, 25, Odd);   // fivelas e bolso do peito
        } else { for (let y = 40; y <= 47; y++) { const k = Math.min(y - 40, 4); set(t0 + 2 + k, y, O); set(t0 + 3 + k, y, Od); set(t1 - 2 - k, y, O); set(t1 - 3 - k, y, Od); } box(19, 47, 28, 49, O); row(47, 19, 28, Od); }
      }
      /* braços e mãos (o braço do lado do pé parado vai à frente: mão sobe) */
      const sleeveEnd = SLEEVE, cuff = top === 'camisa' ? Tl : top === 'moletom' ? Td : null;
      const arm = (x0, outerLeft, raise) => {
        const xs = [x0, x0 + 1, x0 + 2, x0 + 3], end = 51 - raise;
        for (let y = 40; y <= end; y++) xs.forEach((x, i) => {
          const sl = y <= sleeveEnd - raise; const edgeIn = outerLeft ? i === 3 : i === 0, edgeOut = outerLeft ? i === 0 : i === 3;
          let c = sl ? (edgeIn ? Tdd : edgeOut ? (outerLeft ? Tl : Td) : T) : (edgeIn ? Sd : edgeOut && !outerLeft ? Sd : S);
          if (sl && cuff && y >= sleeveEnd - raise - 1) c = edgeIn ? Tdd : top === 'moletom' && (x + y) % 2 ? Tdd : cuff;
          if (sl && !cuff && y === sleeveEnd - raise) c = edgeIn ? Tdd : Td;                 // barra da manga curta
          if (!sl && (top === 'blusa' || top === 'camiseta' || jard) && y === sleeveEnd - raise + 1) c = Sd;   // sombra da manga no braço
          set(x, y, c);
        });
        if (top === 'blusa') for (let y = 40; y <= 43 - raise; y++) set(outerLeft ? x0 - 1 : x0 + 4, y, y === 40 ? null : outerLeft ? Tl : Td);   // manga bufante
        // mão: 4 de largura, dedos e polegar
        const hy = end + 1; xs.forEach((x, i) => { set(x, hy, S); set(x, hy + 1, i === (outerLeft ? 0 : 3) ? Sd : S); set(x, hy + 2, i % 2 ? Sd : S); });
        set(outerLeft ? x0 + 3 : x0, hy, Sd); set(outerLeft ? x0 + 3 : x0, hy + 1, Sdd);
        set(outerLeft ? x0 : x0 + 3, 40, null);                               // ombro arredondado
        if (top === 'regata') { set(outerLeft ? x0 + 1 : x0 + 2, 40, outerLeft ? Sl : Sd); }
      };
      arm(aL0, true, stepR ? 2 : 0); arm(t1 + 1, false, stepL ? 2 : 0);
      /* vinco entre tronco e braço */
      for (let y = 42; y <= 48; y++) { if (get(t0, y)) set(t0, y, Td); if (get(t1, y)) set(t1, y, Tdd); }
      if (pants) { row(50, t0 + 1, t1 - 1, Bdd); row(51, t0 + 1, t1 - 1, Bd); if (down) { set(23, 50, '#d8b040'); set(24, 50, '#a8842c'); set(23, 51, '#a8842c'); } }

      /* cabeça e rosto */
      const face = { 17: [19, 28], 18: [17, 30] }; for (let y = 19; y <= 29; y++) face[y] = [16, 31];
      Object.assign(face, masc ? { 30: [16, 31], 31: [17, 30], 32: [18, 29], 33: [19, 28], 34: [20, 27], 35: [21, 26] } : { 30: [17, 30], 31: [18, 29], 32: [19, 28], 33: [20, 27], 34: [21, 26], 35: [22, 25] });
      spans(face, S, (x, y, a, b) => (x >= b - 1 && y > 19 ? Sd : y >= 33 && (x === a || x === b) ? Sd : x <= a + 1 && y > 20 && y < 30 ? Sl : S));
      for (const [ex, ey] of [[14, 23], [32, 23]]) { box(ex, ey, ex + 1, ey + 4, ex < 20 ? S : Sd); set(ex + (ex < 20 ? 0 : 1), ey + 2, Sdd); }   // orelhas
      if (down) {
        // olhos (2x3 com branco, íris, pupila e brilho)
        const eye = (x0, mirror) => {
          const c = i => (mirror ? x0 + 2 - i : x0 + i);
          row(24, Math.min(c(0), c(2)), Math.max(c(0), c(2)), EYE);
          set(c(0), 25, WHITE); set(c(1), 25, EYE); set(c(2), 25, EYE); set(c(0), 26, WHITE); set(c(1), 26, IRIS); set(c(2), 26, EYE);
          set(c(1), 25, '#ffffff'); set(c(2), 25, EYE);
          if (fem) { set(mirror ? c(2) + 1 : c(0) - 1, 24, EYE); set(mirror ? c(2) + 1 : c(0) - 1, 23, EYE); }   // cílios
          row(27, Math.min(c(0), c(2)), Math.max(c(0), c(2)), Sd);
        };
        eye(18, false); eye(27, true);
        const BR = mix(Hd, S, fem ? 0.25 : 0);                                 // sobrancelhas (cor do cabelo)
        row(21, 18, 21, BR); row(21, 26, 29, BR); if (masc) { row(22, 18, 20, BR); row(22, 27, 29, BR); }
        set(24, 28, Sd); set(24, 29, Sd); set(23, 29, Sl);                     // nariz
        set(18, 29, BLUSH); set(19, 29, BLUSH); set(28, 29, BLUSH); set(29, 29, BLUSH);
        if (fem) { row(31, 22, 25, LIP); set(23, 32, mix(LIP, '#ffffff', 0.25)); set(24, 32, LIP); }
        else { row(31, 21, 26, mix(S, '#7a3a34', 0.45)); row(32, 22, 25, Sd); }
        row(masc ? 35 : 35, masc ? 21 : 22, masc ? 26 : 25, Sd);              // sombra sob o queixo
      } else { box(16, 30, 31, 33, S); row(34, 19, 28, S); row(35, 21, 26, Sd); }
      if (look.hair === 'curtoLiso' && !look.hat) {
      /* cabelo "Curto liso": topo com volume moderado, franja varrida em diagonal (mais longa do lado esquerdo de quem
         olha), pontas de comprimentos variados, costeletas e nuca curtas */
      const hairSet = new Set(), add = (x, y) => hairSet.add(x + ',' + y);
      const top = { 13: [19, 28], 14: [17, 30], 15: [16, 31], 16: [15, 32] };
      for (const y in top) for (let x = top[y][0]; x <= top[y][1]; x++) add(x, +y);
      if (up) { for (let y = 17; y <= 31; y++) for (let x = 15; x <= 32; x++) add(x, y); [[16, 31, 32], [18, 29, 33], [20, 27, 34]].forEach(([a, b, y]) => { for (let x = a; x <= b; x++) add(x, y); }); }
      else {
        for (let x = 15; x <= 32; x++) {
          const yb = Math.round(24 - (x - 15) * 0.22) + ((x % 3) === 0 ? 1 : (x % 3) === 1 ? 0 : -1);   // borda da franja, em pontas
          for (let y = 17; y <= yb; y++) add(x, y);
        }
        for (let y = 22; y <= 26; y++) { add(15, y); add(16, y); } add(15, 27);                         // costeleta esquerda
        for (let y = 21; y <= 25; y++) { add(31, y); add(32, y); }                                      // costeleta direita (sobre a orelha)
      }
      const has = (x, y) => hairSet.has(x + ',' + y);
      for (const k of hairSet) {
        const [x, y] = k.split(',').map(Number);
        let c = Hb;
        const lock = (x + Math.floor((y - 12) * (up ? 0.3 : 0.6))) % 4;         // mechas inclinadas no sentido da franja
        if (lock === 0) c = Hd; else if (lock === 2 && y < 21) c = Hm;
        if ((y === 14 || y === 15) && x >= 18 && x <= 26) c = Hl;              // brilho no alto
        if (y === 16 && x >= 20 && x <= 24) c = Hm;
        if (!has(x + 1, y) || !has(x, y + 1)) c = Hd;                          // borda em sombra
        if (!has(x, y - 1) && x < 24) c = Hm;
        if (up && y >= 30) c = (x + y) % 3 ? Hd : Hb;
        set(x, y, c);
      }
      if (!up) for (let x = 15; x <= 32; x++) { let y = 30; while (y > 12 && !has(x, y)) y--; if (y > 12 && [S, Sl, Sd].includes(get(x, y + 1))) set(x, y + 1, Sdd); }   // sombra do cabelo na testa
      }
    } else {
      /* ============ PERFIL (olhando para a esquerda; a direita é o espelho) ============ */
      const sw = stepL ? -1 : stepR ? 1 : 0;
      // pernas
      const cloth = y => bottom === 'calca' || (bottom === 'short' && y <= 54);
      const legC = (near, y) => (cloth(y) ? (near ? B : Bd) : (near ? S : Sd));
      const leg = (x0, near, yLift, kick) => {
        for (let y = (pants ? 52 : bottom === 'saiaLonga' ? 57 : 55); y <= 57; y++) for (let i = 0; i < 5; i++) {
          const x = x0 + i + Math.round(kick * (y - 52) / 5); let c = i === 0 ? (near ? (cloth(y) ? Bl : Sl) : legC(near, y)) : i === 4 ? (cloth(y) ? Bdd : Sd) : legC(near, y);
          if (bottom === 'short' && y === 54) c = Bdd; if (bottom === 'short' && y === 55) c = Sd;
          set(x, y - yLift, c);
        }
        const fx = x0 + Math.round(kick) - 2; row(58 - yLift, fx, fx + 7, near ? SH : SHd); set(fx, 58 - yLift, near ? SHl : SH); row(59 - yLift, fx, fx + 7, near ? SH : SHd); row(60 - yLift, fx, fx + 7, near ? SH : SHd); row(61 - yLift, fx, fx + 7, SHd);
      };
      if (!sw) leg(21, true, 0, 0);
      else { leg(sw < 0 ? 24 : 20, false, 0, sw < 0 ? 2 : -2); leg(sw < 0 ? 19 : 23, true, 0, sw < 0 ? -2 : 2); }
      if (pants) { box(19, 50, 28, 53, B); row(50, 19, 28, Bdd); row(51, 19, 28, Bd); set(19, 52, Bl); }
      else if (bottom === 'saiaLonga') for (let y = 48; y <= 57; y++) { const w = Math.floor((y - 48) / 3), o = y >= 53 ? sw : 0; row(y, 19 - w + o, 28 + w + o, y === 57 ? Bdd : B); set(19 - w + o, y, Bl); set(28 + w + o, y, Bd); if (y > 50) { set(23 + o + Math.round((y - 50) / 4), y, Bd); set(26 + o + Math.round((y - 50) / 3), y, Bd); } }
      else for (let y = 48; y <= 54; y++) { const w = Math.floor((y - 48) / 2); row(y, 19 - w, 28 + w, y === 54 ? Bd : B); set(19 - w, y, Bl); set(28 + w, y, Bd); }
      // tronco
      const s0 = masc ? 18 : 19, s1 = masc ? 29 : 28;
      box(21, 36, 26, 39, Sd); row(36, 21, 26, Sdd); set(21, 39, S);
      for (let y = 40; y <= 49; y++) { let a = s0, b = s1; if (fem && y >= 45 && y <= 47) { a++; b--; } row(y, a, b, T); set(a, y, Tl); set(b, y, Td); set(b - 1, y, Td); }
      row(49, s0, s1, Td);
      if (top === 'camisa') { set(s0, 40, '#f4f0ea'); set(s0 + 1, 40, '#f4f0ea'); set(s0 + 1, 41, '#f4f0ea'); for (let y = 42; y <= 48; y += 3) set(s0 + 1, y, Td); }
      else if (top === 'blusa') { row(40, s0, s0 + 2, S); set(s0, 41, S); for (let x = s0; x <= s1; x++) set(x, 48, x % 3 ? T : Tl); }
      else if (top === 'camiseta' || jard) { set(s0, 40, Sd); set(s0 + 1, 40, Tdd); row(48, s0, s1, Td); }
      else if (top === 'regata') { row(40, s0, s0 + 2, S); set(s0, 41, S); row(40, s1 - 2, s1, Sd); row(48, s0, s1, Td); }
      else if (top === 'moletom') {
        box(s1 - 2, 36, s1 + 1, 43, Td); box(s1 - 2, 37, s1, 42, T); set(s1 - 2, 37, Tl); set(s1 + 1, 44, null);   // capuz caído nas costas
        set(s0, 40, Td); set(s0 + 1, 40, Td); for (let y = 41; y <= 45; y++) set(s0 + 1, y, '#efe8dc');            // cordão
        box(s0, 45, s0 + 3, 47, Td); row(45, s0, s0 + 3, Tdd);                                                       // bolso canguru
        for (let x = s0; x <= s1; x++) { set(x, 48, x % 2 ? Td : T); set(x, 49, Tdd); }
      }
      if (jard) { box(s0, 43, s0 + 4, 49, O); for (let y = 43; y <= 49; y++) set(s0, y, Ol); for (let y = 40; y <= 43; y++) set(s0 + 3 + (y - 40), y, Od); set(s0 + 1, 43, '#f2cf5a'); box(s0 + 5, 47, s1, 49, O); row(49, s0, s1, Od); }
      // braço: ombro fixo e antebraço que balança, com sombra dos dois lados
      const ax = 22 + sw * 2, sleeveEnd = SLEEVE;
      for (let y = 41; y <= 48; y++) { if (get(ax - 1, y)) set(ax - 1, y, Tdd); if (get(ax + 4, y)) set(ax + 4, y, Tdd); }
      for (let y = 40; y <= 51; y++) {
        const x = y <= 43 ? 22 : ax, sl = y <= sleeveEnd;
        for (let i = 0; i < 4; i++) set(x + i, y, sl ? (i === 0 ? Tl : i === 3 ? Td : T) : (i === 3 ? Sd : S));
        if (sl && (top === 'camiseta' || jard) && y === sleeveEnd) for (let i = 0; i < 4; i++) set(x + i, y, Td);
        if (sl && top === 'moletom' && y >= sleeveEnd - 1) for (let i = 0; i < 4; i++) set(x + i, y, (i + y) % 2 ? Tdd : Td);
        if (sl && top === 'camisa' && y >= sleeveEnd - 1) for (let i = 0; i < 4; i++) set(x + i, y, i === 3 ? Td : Tl);
      }
      if (top === 'blusa') { box(21, 40, 26, 43, T); set(21, 40, Tl); row(43, 21, 26, Td); }
      for (let i = 0; i < 4; i++) { set(ax + i, 52, S); set(ax + i, 53, i === 3 ? Sd : S); set(ax + i, 54, i % 2 ? Sd : S); }   // mão
      // cabeça de perfil
      const face = { 17: [19, 28], 18: [18, 30] }; for (let y = 19; y <= 31; y++) face[y] = [17, 31];
      Object.assign(face, { 32: [17, 30], 33: masc ? [17, 29] : [18, 29], 34: masc ? [18, 28] : [19, 27], 35: [20, 26] });
      spans(face, S, (x, y, a, b) => (x >= b - 1 ? Sd : x <= a + 1 && y > 20 ? Sl : S));
      set(16, 27, S); set(15, 28, S); set(16, 28, S); set(16, 29, Sd); set(15, 29, Sd);          // nariz
      // olho de perfil
      row(24, 18, 20, EYE); set(18, 25, EYE); set(19, 25, '#ffffff'); set(20, 25, WHITE); set(18, 26, IRIS); set(19, 26, EYE); set(20, 26, WHITE); row(27, 18, 20, Sd);
      if (fem) { set(17, 24, EYE); set(17, 23, EYE); }
      row(21, 18, 21, mix(Hd, S, fem ? 0.25 : 0));
      if (fem) { row(31, 17, 19, LIP); } else row(31, 17, 20, mix(S, '#7a3a34', 0.45));
      set(20, 29, BLUSH); set(21, 29, BLUSH);
      box(25, 23, 27, 28, Sd); set(26, 24, S); set(26, 25, S); set(25, 26, Sdd);                 // orelha
      if (look.hair === 'curtoLiso' && !look.hat) {
      // cabelo de perfil: topo e nuca, franja curta à frente
      const hairSet = new Set();
      const hr = { 13: [20, 28], 14: [18, 30], 15: [17, 31], 16: [16, 32] }; for (let y = 17; y <= 22; y++) hr[y] = [16, 32];
      Object.assign(hr, { 23: [22, 32], 24: [24, 32], 25: [28, 32], 26: [28, 32], 27: [28, 32], 28: [28, 31], 29: [28, 31], 30: [29, 31], 31: [29, 30] });
      for (const y in hr) for (let x = hr[y][0]; x <= hr[y][1]; x++) hairSet.add(x + ',' + y);
      [[16, 23], [17, 23], [16, 24], [18, 23]].forEach(([x, y]) => hairSet.add(x + ',' + y));   // pontinha da franja
      ['21,22', '19,22'].forEach(k => hairSet.delete(k));
      const has = (x, y) => hairSet.has(x + ',' + y);
      for (const k of hairSet) {
        const [x, y] = k.split(',').map(Number); let c = Hb;
        if ((x + Math.floor(y / 3)) % 4 === 0) c = Hd;
        if ((y === 14 || y === 15) && x >= 19 && x <= 27) c = Hl;
        if (!has(x + 1, y) || !has(x, y + 1)) c = Hd; if (!has(x, y - 1)) c = Hm;
        set(x, y, c);
      }
      for (let x = 17; x <= 27; x++) { const y = [...Array(30).keys()].reverse().find(yy => has(x, yy)); if (y !== undefined && [S, Sl, Sd].includes(get(x, y + 1))) set(x, y + 1, Sdd); }
      }
    }
    if (look.hair !== 'curtoLiso' || look.hat) paintHair(look, dir, { set, get, S, Sd, Sl, Sdd, Hb, Hd, Hl, Hdd, Hm, up, side, down });

    /* ---------- acessórios e chapéus ---------- */
    const acc = look.accessory, hat = look.hat;
    const A = look.accColor || '#e04a3a', Ad = shade(A, 0.7), Add = shade(A, 0.55), Al = mix(A, '#ffffff', 0.35);
    if (acc === 'cachecol') {                                                 // cachecol de tricô em volta do pescoço, ponta caindo na frente
      const under = [null, S, Sd, Sl, Sdd, T, Td, Tdd, Tl, O, Od, Odd, Ol];             // de costas, o cabelo comprido fica por cima
      const knit = (x, y, c) => { if (up && !under.includes(get(x, y))) return; set(x, y, (x + y) % 2 ? c : shade(c, 0.9)); };
      if (!side) {
        for (let y = 36; y <= 40; y++) for (let x = 18; x <= 29; x++) knit(x, y, y === 36 ? Al : y === 40 ? Ad : x >= 27 ? Ad : A);
        if (down) { for (let y = 41; y <= 47; y++) for (let x = 18; x <= 21; x++) knit(x, y, x === 18 ? Al : x === 21 ? Ad : A); for (let x = 18; x <= 21; x++) set(x, 48, x % 2 ? Ad : Al); row(43, 18, 21, Ad); }
      } else {
        for (let y = 36; y <= 40; y++) for (let x = 19; x <= 28; x++) knit(x, y, y === 36 ? Al : y === 40 ? Ad : A);
        for (let y = 41; y <= 46; y++) for (let x = 17; x <= 19; x++) knit(x, y, x === 17 ? Al : A); row(47, 17, 19, Ad);
      }
    }
    if (acc === 'oculos') {                                                   // armação redonda escura, lente com reflexo
      const F = '#2a2430', GL = 'rgba(0,0,0,0)';
      const lens = (x0, x1) => { row(23, x0 + 1, x1 - 1, F); row(28, x0 + 1, x1 - 1, F); for (let y = 24; y <= 27; y++) { set(x0, y, F); set(x1, y, F); } set(x0 + 1, 24, mix(get(x0 + 1, 24) || S, '#ffffff', 0.5)); };
      if (down) { lens(17, 21); lens(26, 30); row(24, 22, 25, F); set(16, 24, F); set(15, 24, F); set(31, 24, F); set(32, 24, F); }
      else if (side) { lens(17, 21); row(24, 22, 25, F); }
      else { set(15, 24, F); set(32, 24, F); set(14, 24, F); set(33, 24, F); }
    }
    if (acc === 'bandana') {                                                  // faixa amarrada na cabeça, nó atrás com pontas
      const y0 = hat ? 18 : 16, dots = (x, y) => (x + 2 * y) % 5 === 0;
      if (!side) { for (let y = y0; y <= y0 + 2; y++) row(y, 15, 32, A); row(y0, 17, 30, Al); row(y0 + 2, 15, 32, Ad); for (let x = 15; x <= 32; x++) if (dots(x, y0 + 1)) set(x, y0 + 1, '#f4f0ea');
        if (up) { box(22, y0 + 3, 25, y0 + 4, Ad); set(21, y0 + 5, A); set(22, y0 + 6, A); set(20, y0 + 7, Ad); set(26, y0 + 5, A); set(25, y0 + 6, A); set(27, y0 + 7, Ad); } }
      else { for (let y = y0; y <= y0 + 2; y++) row(y, 16, 32, A); row(y0, 18, 30, Al); row(y0 + 2, 16, 32, Ad); for (let x = 16; x <= 32; x++) if (dots(x, y0 + 1)) set(x, y0 + 1, '#f4f0ea');
        box(33, y0 + 1, 34, y0 + 2, Ad); set(35, y0 + 3, A); set(35, y0 + 4, A); set(36, y0 + 5, Ad); set(34, y0 + 4, A); set(34, y0 + 5, Ad); }
    }
    if (hat === 'palha') {                                                    // chapéu de palha: trama, fita vermelha e aba larga
      const st = '#e8c860', sd = '#c8a040', sdd = '#a88430', sl = '#f6e094', band = '#8a3a2a', weave = (x, y) => ((x + y) % 4 === 0 ? sd : (x - y + 40) % 4 === 0 ? sl : st);
      const cx0 = side ? 18 : 17, cx1 = side ? 31 : 30;
      for (let y = 6; y <= 14; y++) { const ins = y < 8 ? 2 - (y - 6) : 0; for (let x = cx0 + ins; x <= cx1 - ins; x++) set(x, y, x >= cx1 - 1 - ins ? sd : weave(x, y)); }
      row(6, cx0 + 3, cx1 - 3, sl); row(13, cx0, cx1, band); row(14, cx0, cx1, shade(band, 0.75)); set(cx0 + 2, 13, mix(band, '#ffffff', 0.3));
      const b0 = side ? 9 : 8, b1 = side ? 37 : 39;
      for (let x = b0; x <= b1; x++) { set(x, 15, weave(x, 15)); set(x, 16, x > (b0 + b1) / 2 + 6 ? sdd : sd); }
      for (let x = b0 + 2; x <= b1 - 2; x++) set(x, 17, sdd);
      if (down) for (let x = 16; x <= 31; x++) if ([S, Sl, Sd].includes(get(x, 18))) set(x, 18, Sdd);      // sombra da aba na testa
    } else if (hat === 'boina') {                                             // boina inclinada, de feltro, com pino no alto
      const c = '#c8483a', cd = '#962e24', cdd = '#74221a', cl = '#e66a5c';
      const ell = (x, y) => (((x + 0.5 - (side ? 23 : 24.5)) / (side ? 9 : 10.5)) ** 2 + ((y + 0.5 - 11.5) / 4.6) ** 2) <= 1;
      for (let y = 6; y <= 17; y++) for (let x = 12; x <= 37; x++) if (ell(x, y)) set(x, y, y <= 9 && x < 24 ? cl : x > 29 || y >= 15 ? cd : c);
      row(16, side ? 16 : 16, side ? 31 : 32, cdd); row(17, 17, 31, cd); set(24, 6, cdd); set(24, 5, cd); set(23, 6, cd);
    } else if (hat === 'pescador') {                                          // chapéu de pescador: copa baixa com costura e aba caída
      const c = '#8a9a6a', cd = '#64744a', cdd = '#4a5636', cl = '#a8b886';
      const x0 = side ? 17 : 16, x1 = side ? 31 : 31;
      for (let y = 7; y <= 14; y++) { const ins = y === 7 ? 2 : y === 8 ? 1 : 0; for (let x = x0 + ins; x <= x1 - ins; x++) set(x, y, x <= x0 + 2 + ins ? cl : x >= x1 - 1 - ins ? cd : c); }
      row(11, x0, x1, cd); for (let x = x0 + 1; x <= x1 - 1; x += 2) set(x, 9, cd);
      for (let y = 15; y <= 18; y++) { const w = y - 15; for (let x = x0 - 2 - w; x <= x1 + 2 + w; x++) set(x, y, y === 18 ? cdd : y === 15 ? cl : x > x1 ? cd : c); }
      if (down) for (let x = 16; x <= 31; x++) if ([S, Sl, Sd].includes(get(x, 19))) set(x, 19, Sdd);
    }
    if (acc === 'laco') {                                                     // laço: no cabelo ou na fita do chapéu
      const bow = (x0, y0) => {
        [[0, 1], [1, 0], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2], [1, 3]].forEach(([dx, dy]) => set(x0 + dx, y0 + dy, A));
        [[6, 1], [5, 0], [5, 1], [4, 1], [6, 2], [5, 2], [4, 2], [5, 3]].forEach(([dx, dy]) => set(x0 + dx, y0 + dy, A));
        set(x0 + 1, y0, Al); set(x0 + 5, y0, Al); set(x0 + 2, y0 + 3, Ad); set(x0 + 4, y0 + 3, Ad); set(x0 + 6, y0 + 2, Ad);
        box(x0 + 3, y0 + 1, x0 + 3, y0 + 2, Ad); set(x0 + 3, y0 + 1, A);
      };
      if (hat) { if (down) bow(26, 11); else if (up) bow(15, 11); else bow(26, 11); }
      else if (down) bow(25, 11); else if (up) bow(16, 11); else bow(23, 10);
    }
    /* ---------- contorno (1 px, levemente tingido pela cor vizinha) ---------- */
    const filled = G.map(r => r.slice());
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (filled[y][x]) continue;
      const n = (filled[y + 1] && filled[y + 1][x]) || filled[y][x - 1] || filled[y][x + 1] || (filled[y - 1] && filled[y - 1][x]);
      if (n) G[y][x] = mix(OUT, n, 0.14);
    }
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (G[y][x]) { g.fillStyle = G[y][x]; g.fillRect(x, y, 1, 1); }
    return c;
  }
  return { W, H, supports, render };
})();
