/* Mundo — desenho de cada quadro: cenário, figuras e personagens em ordem de profundidade, chuva, luz do dia
   e coletáveis sazonais.
   Parte de js/world/ (antes era js/world.js). São scripts comuns, carregados em ordem pelo index.html:
   as declarações de nível superior valem para todos os arquivos (não são módulos). O objeto World,
   com as funções públicas, é montado no fim, em js/world/index.js. */

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
  map.sprites.forEach(s => { if (s.x < cam.x + VW + 8 && s.x + s.img.width > cam.x - 8 && s.y < cam.y + VH + 8 && s.y + s.img.height > cam.y - 8) list.push({ base: s.base, img: s.img, x: s.x, y: s.y, leafy: s.leafy }); });
  const put = (f, x, y, leafy) => list.push({ base: y, img: f.img, x: x - f.ox, y: y - f.h + 4, leafy });
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
      } else if (o.k === 'tree') put(fruitTree(o.sp, o.age >= TREES[o.sp].grow ? 2 : o.age * 2 >= TREES[o.sp].grow ? 1 : 0, o.fruit), q.x + 8, q.y + 13, o.age >= TREES[o.sp].grow);
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
    NTREES.forEach(([x, y], i) => { if (!cleared[i] && seen(x, y, 50)) put(S.nature.trees[i] ? stump(i) : wildTree(i), x + shk((S.nature.trees[i] ? 's' : 't') + i), y, !S.nature.trees[i]); });
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
  /* copa sobre o jogador: quando ele está atrás de uma árvore (pés acima da base e dentro da copa), ela fica translúcida.
     Só o desenho muda: a colisão continua no tronco. */
  const me = v.actors.length ? v.actors[v.actors.length - 1] : null;
  const behind = e => me && e.leafy && me.y < e.base - 1 && me.y > e.y + 6 && me.x > e.x + 3 && me.x < e.x + e.img.width - 3;
  list.forEach(e => {
    if (e.img) { if (behind(e)) { ctx.globalAlpha = 0.55; ctx.drawImage(e.img, Math.round(e.x), Math.round(e.y)); ctx.globalAlpha = 1; return; } return ctx.drawImage(e.img, Math.round(e.x), Math.round(e.y)); }
    if (e.fn) return e.fn();
    if (e.pet) return petDraw(ctx, e.pet, t);
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
  if (v.rain) rainFx(ctx, cam, t);
}
/* Chuva (só em áreas externas): riscos diagonais de 1 pixel que caem em velocidades um pouco diferentes, em duas
   camadas (perto, mais clara e rápida; longe, mais apagada), e respingos no chão. Tudo sai da posição e do tempo, sem
   estado: o padrão acompanha o mundo (não "anda" com a câmera) e não pisca entre os quadros. */
const RAIN_N = 230;
const rh = n => { n = (n ^ 61) ^ (n >>> 16); n = Math.imul(n, 0x27d4eb2d); n ^= n >>> 15; return (n >>> 0) / 4294967296; };
function rainFx(ctx, cam, t) {
  const W2 = VW + 40, H2 = VH + 40;
  for (let i = 0; i < RAIN_N; i++) {
    const far = i % 3 === 0, sp = (far ? 0.16 : 0.24) + rh(i * 7 + 3) * 0.05, len = far ? 4 : 7;
    const x0 = rh(i * 13 + 1) * W2, y0 = rh(i * 31 + 5) * H2, dy = t * sp, dx = dy * 0.35;
    const x = Math.round((((x0 - dx - cam.x * (far ? 0.6 : 1)) % W2) + W2) % W2) - 20, y = Math.round((((y0 + dy - cam.y * (far ? 0.6 : 1)) % H2) + H2) % H2) - 20;
    ctx.fillStyle = far ? 'rgba(170,190,225,.4)' : 'rgba(200,218,245,.7)';
    for (let k = 0; k < len; k++) ctx.fillRect(x - Math.round(k * 0.35), y + k, 1, 1);
  }
  for (let i = 0; i < 26; i++) {                                     // respingos: aparecem e somem num ponto fixo do chão
    const per = 600 + rh(i * 17 + 9) * 500, ph = ((t + rh(i * 5 + 2) * per) % per) / per; if (ph > 0.35) continue;
    const cycle = Math.floor((t + rh(i * 5 + 2) * per) / per), wx = rh(i * 41 + cycle * 7) * (VW + 0) + cam.x, wy = rh(i * 23 + cycle * 11) * VH + cam.y;
    const x = Math.round(wx - cam.x), y = Math.round(wy - cam.y), r = ph < 0.15 ? 1 : 2;
    ctx.fillStyle = 'rgba(200,220,245,.6)'; ctx.fillRect(x - r, y, 1, 1); ctx.fillRect(x + r, y, 1, 1); if (r > 1) ctx.fillRect(x, y - 1, 1, 1);
  }
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
