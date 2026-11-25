/* =====================================================
   PESCA
   Etapas: charge (segurando: barra de força) → cast (vara vai à frente, boia voa)
   → wait (boia boiando; o relógio anda) → bite ("!": aperte para fisgar) → hook
   → game (barra horizontal; relógio parado) → catch (o peixe salta até as mãos)
   → show (peixe erguido: Guardar ou Soltar). Saídas: reel (recolhe a linha), flee
   (o peixe foge), release (peixe solto). A tentativa não é salva: recarregar só
   recolhe a linha. O minijogo em si (física e progresso) fica em js/fishcore.js.

   Comando único: o botão esquerdo do mouse e a barra de espaço contam como o mesmo
   botão. Ele está pressionado enquanto pelo menos um dos dois estiver segurado;
   só a passagem de "solto" para "pressionado" (e vice-versa) dispara uma ação,
   então usar os dois juntos nunca duplica lançamento, fisgada ou escolha.
   ===================================================== */
const FISH_PAUSE = ['hook', 'game', 'catch', 'show', 'release', 'flee'];
function fishPaused() { return !!fishing && FISH_PAUSE.includes(fishing.phase); }
const HAND = Object.fromEntries(Object.entries({ down: [5, -11], up: [5, -13], left: [-5, -12], right: [5, -12] }).map(([d, [x, y]]) => [d, [Sprites.WORLD.ox(x), Sprites.WORLD.oy(y)]]));   // mão do personagem do mundo
const DIRV = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
const POSE = {                                      // ponta da vara em relação à mão
  right: { back: [-8, -15], fwd: [15, -5], hold: [13, -10], hook: [5, -17] },
  down: { back: [-2, -19], fwd: [3, 12], hold: [4, 8], hook: [1, -17] },
  up: { back: [3, 11], fwd: [2, -19], hold: [3, -16], hook: [2, -6] },
};
POSE.left = Object.fromEntries(Object.entries(POSE.right).map(([k, [x, y]]) => [k, [-x, y]]));
const clamp01 = k => Math.max(0, Math.min(1, k));
const lerp = (a, b, k) => a + (b - a) * clamp01(k);
const grip = d => [P.x + HAND[d][0], P.y + HAND[d][1]];
function rodTip(d, from, to, k) { const a = POSE[d][from], b = POSE[d][to], [gx, gy] = grip(d); return [gx + lerp(a[0], b[0], k), gy + lerp(a[1], b[1], k)]; }
const fishValue = id => FISH[id].price;                   // preço fixo por espécie (o tamanho é só informação e recorde)
const isRod = it => !!(it && ITEMS[it.id] && ITEMS[it.id].rod);
const fishLevel = () => skillLvl('pesca');               // fonte única: o nível confirmado da habilidade Pesca
const zoneWidth = (lvl = fishLevel()) => FISHING.zone.base + FISHING.zone.perLevel * Math.min(FISHING.maxLevel, lvl);
const castMax = (lvl = fishLevel()) => FISHING.cast.max + FISHING.cast.step * FISHING.cast.stepLevels.filter(n => lvl >= n).length;
const behaviorOf = id => FISHING.behaviors[FISH[id].behavior] || FISHING.behaviors.tranquilo;
/* Espera pela mordida (ms reais): 3 a 10 s, o máximo cai 0,2 s por nível; com isca, metade. */
function biteWait(lvl, bait) {
  const B = FISHING.bite, max = Math.max(B.waitMin, B.waitMax - B.maxCutPerLevel * lvl), w = B.waitMin + Math.random() * (max - B.waitMin);
  return bait ? w * B.baitFactor : w;
}

/* ---------- comando único: mouse + Espaço ---------- */
const FIN = { mouse: false, key: false };
const fishHeld = () => FIN.mouse || FIN.key;
function finSet(src, down) {
  const before = fishHeld(); FIN[src] = !!down; const now = fishHeld();
  if (!fishing || before === now) return;
  if (now) fishPress(src); else fishLetGo();
}
function finClear() { FIN.mouse = false; FIN.key = false; }
function fishPress(src) {
  const f = fishing;
  if (f.phase === 'bite') hookFish();
  else if (f.phase === 'wait') tip('Espere a boia afundar e aparecer o "!" para fisgar.');
  // no resultado, o mouse escolhe clicando no botão; o Espaço confirma a opção marcada
  else if (f.phase === 'show' && f.armed && src === 'key') { const b = document.activeElement; if (b && b.closest && b.closest('#catch') && b.tagName === 'BUTTON' && !b.disabled) b.click(); }
}
function fishLetGo() {
  const f = fishing;
  if (f.phase === 'charge') castLine();
  else if (f.phase === 'show') f.armed = true;              // o mesmo aperto que pegou o peixe não escolhe nada
}
/* O botão esquerdo vale em qualquer lugar da tela (fora dos botões e painéis). */
const notFishTarget = e => e.target.closest && e.target.closest('button, #catch, #modal, .hotbar-wrap, #actions, #dialog, input');
window.addEventListener('pointerdown', e => { if ((e.pointerType === 'mouse' && e.button !== 0) || !fishing || notFishTarget(e)) return; finSet('mouse', true); });
window.addEventListener('pointerup', e => { if (e.pointerType === 'mouse' && e.button !== 0) return; finSet('mouse', false); });
window.addEventListener('pointercancel', () => finSet('mouse', false));
/* Perdeu o foco: nada fica preso. Se estava carregando, não lança. */
function fishBlur() { if (fishing && fishing.phase === 'charge') endFishing(); finClear(); }
window.addEventListener('blur', fishBlur);
document.addEventListener('visibilitychange', () => { if (document.hidden) fishBlur(); });

/* Dá para pescar mirando o ponto (wx, wy)? Perto da margem e sem parede no caminho. */
function fishCheck(wx, wy) {
  const ox = P.x, oy = P.y - 4, dx = wx - ox, dy = wy - oy, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
  let first = -1, wall = -1;                          // a colisão é em blocos de 8 px: a margem logo antes da água não conta como parede
  for (let d = 0; d <= L; d++) {
    const x = ox + ux * d, y = oy + uy * d;
    if (World.waterZone(map, x, y)) { first = d; break; }
    if (d > 3 && wall < 0 && World.solidAt(map, x, y)) wall = d;
  }
  if (first < 0) return { ok: false, why: 'Vire-se para a água, na beira dela, para pescar.' };
  if (first > FISHING.cast.shore) return { ok: false, why: 'Chegue mais perto da margem para pescar.' };
  if (wall >= 0 && first - wall > 9) return { ok: false, why: 'Tem algo no caminho entre você e a água.' };
  return { ok: true, ux, uy, first, ox, oy };
}
/* Espaço: mira para onde o personagem olha, sem depender do cursor. */
const hasWater = m => !!((m.waters && m.waters.length) || (m.streams && m.streams.length));   // dentro de prédios não há onde pescar: nada de dica de pesca
function keyCast() {
  if (!hasWater(map)) return;
  const [dx, dy] = DIRV[P.dir], c = fishCheck(P.x + dx * 90, P.y - 4 + dy * 90);
  if (startCharge(c)) FIN.key = true;
}
function startCharge(c) {
  if (!c.ok) { tip(c.why); return false; }
  if (S.energy < CAST_ENERGY) { tip('Sem energia para lançar a linha. Coma algo ou durma para recuperar.'); return false; }
  faceTo(P.x + c.ux * 20, P.y - 8 + c.uy * 20);
  fishing = { phase: 'charge', t: 0, dir: P.dir, c, charge: 0, rings: [], rod: equipped().id };
  hover = null; $('hint').hidden = true; $('hint').dataset.t = '';
  fishUI(); return true;
}
/* Soltou o comando: a força decide a distância, sempre dentro de água contínua. */
function castLine() {
  const f = fishing, c = f.c, C = FISHING.cast, D = C.min + f.charge * (castMax() - C.min);
  let best = c.first;
  for (let d = c.first; d <= Math.max(D, c.first + 4); d++) { if (!World.waterZone(map, c.ox + c.ux * d, c.oy + c.uy * d)) break; best = d; }
  S.energy = Math.max(0, S.energy - CAST_ENERGY);
  f.bait = f.rod === 'vara_fibra' && S.fish.bait > 0;
  if (f.bait) S.fish.bait--;                           // uma minhoca por lançamento válido
  S.fish.current = f.rod; renderHud(); renderHotbar(); save();
  f.target = [c.ox + c.ux * best, c.oy + c.uy * best]; f.zone = World.waterZone(map, f.target[0], f.target[1]) || 'lago';
  f.outcome = rollCatch();                             // decidido uma vez por lançamento: cliques ou teclas depois não mudam
  f.flight = 240 + best * 5; f.phase = 'cast'; f.t = 0; f.power = f.charge; f.charge = null;
  fishUI();
}
function pickFish(zone) {
  const opts = Object.keys(FISH).map(id => { const F = FISH[id]; return [id, (F.zones[zone] || 0) * (S.time >= F.peak[0] && S.time <= F.peak[1] ? 1 : F.off)]; }).filter(o => o[1] > 0);
  let r = Math.random() * opts.reduce((a, o) => a + o[1], 0);
  for (const [id, w] of opts) if ((r -= w) <= 0) return id;
  return opts[0][0];
}
function updateFishing(dt, now) {
  const f = fishing; f.t += dt;
  switch (f.phase) {
    case 'charge': { const k = (f.t % 1600) / 800; f.charge = k <= 1 ? k : 2 - k; break; }
    case 'cast':
      if (f.t >= 140 + f.flight) {
        f.phase = 'wait'; f.t = 0; f.rings.push({ x: f.target[0], y: f.target[1], t0: now }); bang(f.target[0], f.target[1], 'water');
        f.wait = biteWait(fishLevel(), f.bait); f.nibbles = [];
        for (let i = 0, n = Math.floor(Math.random() * 3); i < n; i++) f.nibbles.push(600 + Math.random() * Math.max(0, f.wait - 1100));
      }
      break;
    case 'wait':
      if (f.t >= f.wait) { f.phase = 'bite'; f.t = 0; f.junk = f.outcome !== 'peixe'; f.fishId = f.junk ? f.outcome : pickFish(f.zone); f.rings.push({ x: f.target[0], y: f.target[1], t0: now }); bang(f.target[0], f.target[1], 'water'); fishUI(); }
      break;
    case 'bite': if (f.t >= FISHING.bite.window) { tip('A boia subiu de novo: o peixe soltou a isca. Tente outra vez.'); reelIn(); } break;
    case 'hook': if (f.t >= 380) { if (f.junk) { f.phase = 'catch'; f.t = 0; if (!f.xpGiven) { f.xpGiven = true; f.xp = SKILL_GAIN.junk; addFishXp(f.xp); save(); } fishUI(); } else openMinigame(); } break;   // alga, musgo e lixo: 3 XP na captura, sem bônus de perfeito   // transição: "Fisgou!"; alga, musgo e lixo vêm direto, sem minijogo
    case 'game': {
      FishCore.step(f.r, dt, fishHeld());
      if (f.t - (f.lastRing || 0) > 520) { f.lastRing = f.t; f.rings.push({ x: f.target[0] + (f.r.dir || 1) * 2, y: f.target[1], t0: now }); }
      if (f.r.done === 'catch') fishCaught(); else if (f.r.done === 'flee') fishFled();
      break;
    }
    case 'catch': if (f.t >= 620) showCatch(); break;
    case 'reel': if (f.t >= 420) endFishing(); break;
    case 'flee': if (f.t >= 950) endFishing(); break;
    case 'release': if (f.t >= 560 && !f.splashed) { f.splashed = true; f.rings.push({ x: f.target[0], y: f.target[1], t0: now }); bang(f.target[0], f.target[1], 'water'); } if (f.t >= 950) endFishing(); break;
  }
}
/* O que o cenário desenha: mão, vara (que verga), boia, linha, efeitos e avisos. */
function fishView(now) {
  const f = fishing, d = f.dir, t = f.t, v = { rod: f.rod, grip: grip(d), tip: null, bob: null, bobMode: 'none', slack: 0, bend: 0, rings: f.rings, charge: null, alert: null, head: [P.x, P.y + Sprites.WORLD.oy(-40)], lean: 0 };
  const tg = f.target;
  switch (f.phase) {
    case 'charge': v.tip = rodTip(d, 'hold', 'back', t / 150); v.charge = f.charge; v.lean = 1; v.bend = -0.2 - f.charge * 0.3; break;
    case 'cast': {
      v.tip = rodTip(d, 'back', 'fwd', t / 140); v.bend = t < 140 ? 0.5 : 0.1;
      if (t > 110) {
        const k = clamp01((t - 110) / (f.flight + 30)), from = f.from || (f.from = rodTip(d, 'back', 'fwd', 1)), h = 10 + Math.hypot(tg[0] - from[0], tg[1] - from[1]) * 0.3;
        v.bob = [lerp(from[0], tg[0], k), lerp(from[1], tg[1], k) - Math.sin(k * Math.PI) * h]; v.bobMode = 'fly'; v.slack = 0.2;
      }
      break;
    }
    case 'wait': v.tip = rodTip(d, 'fwd', 'hold', t / 250); v.bob = tg; v.slack = 1; v.bend = 0.08; v.bobMode = (f.nibbles || []).some(n => t > n && t < n + 280) ? 'nibble' : 'float'; break;
    case 'bite': v.tip = rodTip(d, 'hold', 'fwd', 0.25 + (Math.floor(now / 90) % 2) * 0.1); v.bob = [tg[0] + (Math.floor(now / 70) % 3 - 1), tg[1]]; v.slack = 0.15; v.bend = 0.45; v.bobMode = 'sink'; v.alert = 1 - t / FISHING.bite.window; break;
    case 'hook': v.tip = rodTip(d, 'hold', 'hook', t / 150); v.bob = tg; v.bobMode = 'sink'; v.lean = 1; v.bend = 0.8; break;
    case 'game': {                                    // puxando: a vara verga e o corpo dá pequenos trancos
      const held = fishHeld(), pull = held ? 0.35 : 0.1, wob = Math.sin(now / 95) * 0.06;
      v.tip = rodTip(d, 'hook', 'hold', pull + wob); v.bob = [tg[0] + Math.sin(now / 130) * 1.5 * (f.r.dir || 1), tg[1]]; v.bobMode = 'sink';
      v.bend = held ? 0.9 + wob : 0.55 + wob; v.lean = held ? (Math.floor(now / 160) % 2) : 0; break;
    }
    case 'catch': {                                   // o peixe salta da água até as mãos
      const k = clamp01(t / 560), hx = P.x, hy = P.y + Sprites.WORLD.oy(-40);
      v.tip = rodTip(d, 'hook', 'hold', 0.2); v.bend = 0.4 * (1 - k);
      v.jump = { id: f.fishId, x: lerp(tg[0], hx, k), y: lerp(tg[1], hy, k) - Math.sin(k * Math.PI) * 26, flip: hx < tg[0] };
      v.bob = [v.jump.x, v.jump.y - 6]; v.bobMode = 'reel'; break;
    }
    case 'reel': {
      const k = clamp01(t / 420), from = f.reelFrom || tg || v.grip;
      v.tip = rodTip(d, 'hook', 'hold', 0.3); v.bend = 0.2 * (1 - k); v.bob = [lerp(from[0], v.tip[0], k), lerp(from[1], v.tip[1], k) - Math.sin(k * Math.PI) * 6]; v.bobMode = 'reel';
      break;
    }
    case 'flee': {                                    // o peixe salta e some; a linha volta frouxa
      const k = clamp01(t / 700), sx = d === 'left' ? -1 : 1, kr = clamp01((t - 300) / 600);
      v.tip = rodTip(d, 'hook', 'hold', k); v.bend = 0.6 * (1 - k); v.slack = 1;
      v.bob = [lerp(tg[0], v.tip[0], kr), lerp(tg[1], v.tip[1], kr) - Math.sin(kr * Math.PI) * 6]; v.bobMode = kr > 0 ? 'reel' : 'float';
      if (k < 1) v.jump = { id: f.fishId, x: tg[0] + sx * k * 18, y: tg[1] - Math.sin(k * Math.PI) * 16, flip: sx < 0 };
      break;
    }
    case 'show': v.hold = f.fishId; break;
    case 'release': {
      const k = clamp01(t / 560);
      if (k < 1) v.jump = { id: f.fishId, x: lerp(P.x, tg[0], k), y: lerp(P.y + Sprites.WORLD.oy(-38), tg[1], k) - Math.sin(k * Math.PI) * 18, flip: tg[0] < P.x };
      break;
    }
  }
  return v;
}
function hookFish() { const f = fishing; f.phase = 'hook'; f.t = 0; fishPop('Fisgou!', '', f.target[0], f.target[1] - 6); fishUI(); }
function reelIn() { const f = fishing; const v = fishView(performance.now()); f.reelFrom = v.bob || f.target; f.phase = 'reel'; f.t = 0; fishUI(); }
/* Esc ou "Recolher linha": desiste. Durante a briga, o peixe foge. */
function cancelFishing() {
  const f = fishing; if (!f) return;
  if (f.phase === 'charge') return endFishing();
  if (['cast', 'wait', 'bite'].includes(f.phase)) { if (f.phase === 'cast') f.target = fishView(performance.now()).bob || f.target; if (!f.target) return endFishing(); return reelIn(); }
  if (f.phase === 'hook' || f.phase === 'game') return fishFled();
  if (f.phase === 'show') tip('Escolha: guardar o peixe ou soltar na água.');
}
function endFishing() {
  if (fishing && fishing.dir) P.dir = fishing.dir;     // volta virado para a água: o próximo lançamento com Espaço já sai certo
  fishing = null;
  $('fishbar').hidden = true; $('fishtip').hidden = true; $('catch').hidden = true; $('fish-cancel').hidden = true;
  if (S) { renderHotbar(); renderHud(); }
}
/* Botão de recolher aparece enquanto dá para desistir. */
function fishUI() {
  const f = fishing; $('fish-cancel').hidden = !f || !['cast', 'wait', 'bite', 'game'].includes(f.phase);
}
$('fish-cancel').onclick = () => cancelFishing();
/* Texto curto que sobe e some ("Fisgou!", "Perfeito!", nível novo). */
function fishPop(text, kind = '', wx = P.x, wy = P.y + Sprites.WORLD.oy(-48)) {
  const e = el('div', 'fish-pop ' + kind, text), at = screenOf(wx, wy);
  e.style.left = at[0] + 'px'; e.style.top = at[1] + 'px'; $('stage').append(e); setTimeout(() => e.remove(), 1300);
}
/* Posição de um ponto do mundo na tela (px da janela). */
function screenOf(wx, wy) {
  const cv = $('scene'), r = cv.getBoundingClientRect(), cam = World.camera(map, P.x, P.y);
  return [r.left + (wx - cam.x) / World.VW * r.width, r.top + (wy - cam.y) / World.VH * r.height];
}

/* ---------- minijogo: barra horizontal ---------- */
function openMinigame() {
  const f = fishing; f.phase = 'game'; f.t = 0;
  f.r = FishCore.create({ behavior: FISH[f.fishId].behavior, zoneW: zoneWidth(), cfg: FISHING });
  $('fishbar').hidden = false;
  if (!S.fish.tut) { S.fish.tut = true; save(); const tp = $('fishtip'); tp.hidden = false; tp.textContent = 'Segure: a faixa vai → · Solte: ela volta ←'; f.tipUntil = 3600; }
  fishUI(); drawBar(performance.now());
}
/* Experiência de pesca (habilidade Pesca). O nível novo só vale depois de dormir. */
const addFishXp = n => addXp('pesca', n);
function fishCaught() {
  const f = fishing, F = FISH[f.fishId], B = behaviorOf(f.fishId);
  f.cm = Math.round(F.cm[0] + (F.cm[1] - F.cm[0]) * Math.pow(Math.random(), 1.6));
  f.perfect = !!f.r.perfect;
  f.xp = Math.floor((SKILL_GAIN.fish[f.fishId] || 0) * (f.perfect ? SKILL_GAIN.perfectMult : 1));   // perfeito: ×2,4, arredondado para baixo
  const rec = S.fish.dex[f.fishId];
  f.isNew = !rec; f.isRecord = !!rec && f.cm > rec.max;
  S.fish.dex[f.fishId] = { n: (rec ? rec.n : 0) + 1, max: Math.max(rec ? rec.max : 0, f.cm) };
  if (f.perfect) S.fish.perfect = (S.fish.perfect || 0) + 1;
  addFishXp(f.xp);                                   // espécie, recorde, "perfeito" e experiência ficam salvos já na captura (uma vez)
  luckFish(); S.luck.fish++;                          // conta a captura do dia (mesmo que depois o peixe seja solto)
  if (luckKind() === 'ma' && S.luck.fish >= LUCK.badLimit && S.luck.limitDay !== S.day) { S.luck.limitDay = S.day; setTimeout(() => tip(LUCK.limitMsg), 1400); }
  save();
  f.phase = 'catch'; f.t = 0; $('fishbar').hidden = true; $('fishtip').hidden = true; fishUI();
  if (f.perfect) fishPop('Perfeito!', 'perfect');
  f.rings.push({ x: f.target[0], y: f.target[1], t0: performance.now() }); bang(f.target[0], f.target[1], 'water');
}
function fishFled() {
  const f = fishing; f.phase = 'flee'; f.t = 0; $('fishbar').hidden = true; $('fishtip').hidden = true; fishUI();
  f.rings.push({ x: f.target[0], y: f.target[1], t0: performance.now() }); bang(f.target[0], f.target[1], 'water');
  toast('O peixe escapou!');
}
/* Peixe do minijogo (15x7, olhando para a direita): cauda em leque que abana (2 quadros),
   nadadeira de cima e de baixo, corpo com dorso, flanco e barriga, e olho. Vira conforme nada. */
const BAR_FISH = { sardinha: { B: '#3f6a98', M: '#b8c8d8', L: '#eef4f8', F: '#2f5a88', mark: null },
  tucunare: { B: '#5a7a2a', M: '#d0b030', L: '#f0dc78', F: '#7a8a2a', mark: '#3a3a18', spot: '#e07a2a' } };
const FISH_PX = [[
  '......OOO......',
  'OO..OOBFBOOO...',
  'OTO.OBBBBBBKOO.',
  '.OTOMMMMMMMMWO.',
  'OTO.OLLLLLLLLO.',
  'OO...OOOFOOO...',
  '.......OO......'], [
  '......OOO......',
  '....OOBFBOOO...',
  'OO..OBBBBBBKOO.',
  'OTOOMMMMMMMMWO.',
  'OO..OLLLLLLLLO.',
  '.....OOOFOOO...',
  '.......OO......']];
function barFish(g, cx, cy, id, dir, now, speed) {
  const C = BAR_FISH[id] || BAR_FISH.sardinha, frame = FISH_PX[Math.floor(now / (speed > 0.15 ? 80 : 160)) % 2];   // nadando rápido, a cauda abana mais depressa
  const col = { O: '#1a1210', B: C.B, M: C.M, L: C.L, F: C.F, T: C.F, W: '#ffffff', K: '#1a1210' };
  frame.forEach((row, j) => { for (let i = 0; i < row.length; i++) {
    let ch = row[i]; if (ch === '.') continue;
    let c = col[ch];
    if (C.mark && (i === 7 || i === 10) && j >= 2 && j <= 4 && ch !== 'O') c = C.mark;        // faixas do tucunaré
    if (C.spot && i === 5 && j === 3) c = C.spot;                                                // "olho" no rabo
    g.fillStyle = c; g.fillRect(Math.round(cx + (i - 7) * dir) - (dir < 0 ? 0 : 0), Math.round(cy + j - 3), 1, 1);
  } });
}
const BAR = { w: 100, h: 17, x0: 2, tw: 96 };                         // pista útil: 96 px de comprimento
function drawBar(now) {
  const f = fishing; if (!f || !f.r) return;
  const cv = $('fishbar'), g = cv.getContext('2d'), r = f.r, { w: W, h: H, x0, tw } = BAR;
  const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.max(0, Math.round(w)), Math.max(0, Math.round(h))); };
  g.clearRect(0, 0, W, H);
  // moldura fina de madeira (cantos arredondados)
  R(1, 0, W - 2, H, '#2a1a14'); R(0, 1, W, H - 2, '#2a1a14');
  R(1, 1, W - 2, 1, '#e8b878'); R(1, 1, 1, H - 2, '#d8a060'); R(1, H - 2, W - 2, 1, '#7a4a22'); R(W - 2, 1, 1, H - 2, '#8a5a2a');
  // pista: água escura e discreta
  R(x0, 2, tw, 9, '#24505e'); R(x0, 2, tw, 1, '#3a7280');
  for (let i = 0; i < 5; i++) { const k = ((now / 3200) + i / 5) % 1; R(x0 + 4 + ((i * 23 + k * 96) % (tw - 8)), 5 + (i % 3) * 2, 3, 1, 'rgba(160,220,230,.25)'); }
  // zona verde
  const zx = x0 + r.zone * tw, zw = r.w * tw, on = r.inside;
  R(zx, 2, zw, 9, on ? '#7ad850' : '#58b040'); R(zx, 2, zw, 1, on ? '#c8f8a0' : '#98d878'); R(zx, 10, zw, 1, '#2f7a28');
  R(zx, 2, 1, 9, '#e4ffd0'); R(zx + zw - 1, 2, 1, 9, '#e4ffd0');
  // peixe
  barFish(g, x0 + r.x * tw, 6, f.fishId, r.dir || 1, now, Math.abs(r.v));
  // divisória e progresso (fino, logo abaixo)
  R(x0, 11, tw, 1, '#2a1a14');
  const p = r.prog / 100, col = r.prog < 30 ? '#ff7b5a' : r.prog < 65 ? '#ffd75e' : '#8fe88f';
  R(x0, 12, tw, 3, '#3a2a20'); R(x0, 12, tw * p, 3, col); R(x0, 12, tw * p, 1, 'rgba(255,255,255,.45)');
}
/* Coloca a barra perto da pesca: acima da cabeça, ou abaixo dos pés, ou ao lado;
   nunca sobre o personagem ou a boia, e sempre dentro da tela. */
function placeBar(now) {
  const f = fishing; if (!f || f.phase !== 'game') return;
  const cv = $('scene'), r = cv.getBoundingClientRect(), k = Math.max(1, Math.round(r.width / (cv.width / SCALE)));
  const bw = BAR.w * k, bh = BAR.h * k, el2 = $('fishbar');
  if (el2.dataset.k !== String(k)) { el2.style.width = bw + 'px'; el2.style.height = bh + 'px'; el2.dataset.k = String(k); }
  const [hx, hy] = screenOf(P.x, P.y + Sprites.WORLD.oy(-34)), [fx, fy] = screenOf(P.x, P.y + 4), bob = screenOf(f.target[0], f.target[1]), me = screenOf(P.x, P.y + Sprites.WORLD.oy(-16));
  const pad = 6 * k, vw = window.innerWidth, vh = window.innerHeight;
  const cands = [[hx - bw / 2, hy - bh - pad], [fx - bw / 2, fy + pad], [me[0] - bw - 12 * k, me[1] - bh / 2], [me[0] + 12 * k, me[1] - bh / 2]];
  const hits = (x, y, px, py, m) => px > x - m && px < x + bw + m && py > y - m && py < y + bh + m;
  const fits = ([x, y]) => x >= 8 && y >= 8 && x + bw <= vw - 8 && y + bh <= vh - 8;
  let best = cands.find(c => fits(c) && !hits(c[0], c[1], bob[0], bob[1], 8 * k) && !hits(c[0], c[1], me[0], me[1], 10 * k)) || cands[0];
  best = [Math.max(8, Math.min(vw - bw - 8, best[0])), Math.max(8, Math.min(vh - bh - 8, best[1]))];
  el2.style.left = Math.round(best[0]) + 'px'; el2.style.top = Math.round(best[1]) + 'px';
  const tp = $('fishtip');
  if (!tp.hidden) { if (f.t > (f.tipUntil || 0) || (f.r.hold && f.t > 1500)) tp.hidden = true; else { tp.style.left = Math.round(best[0] + bw / 2) + 'px'; tp.style.top = Math.round(best[1] + bh + 4) + 'px'; } }
}

/* ---------- resultado ---------- */
let discardSel = -1, discardArm = false;
function showCatch() {
  const f = fishing; f.phase = 'show'; f.t = 0; P.dir = 'down'; f.armed = !fishHeld(); discardSel = -1; discardArm = false; fishUI(); renderCatch(false);
}
function renderCatch(full) {
  const f = fishing; if (f.junk) return renderJunk(full);
  const it = ITEMS[f.fishId], box = $('catch'), val = fishValue(f.fishId, f.cm);
  box.replaceChildren(); box.hidden = false;
  const top = el('div', 'catch-top'), pic = el('canvas', 'pixel catch-pic'); pic.width = 16; pic.height = 16; pic.getContext('2d').drawImage(World.icon(f.fishId), 0, 0);
  const txt = el('div', 'catch-txt');
  txt.append(el('b', 'catch-name', it.name), el('span', 'catch-size', `${f.cm} cm · vale ${val} moedas`), el('span', 'dim', `+${f.xp} de experiência de pesca${f.perfect ? ' (perfeito: ×2,4)' : ''}`));
  const tags = el('div', 'catch-tags');
  if (f.perfect) tags.append(el('span', 'tag perfect', 'Perfeito!'));
  if (f.isNew) tags.append(el('span', 'tag new', 'Nova espécie!')); if (f.isRecord) tags.append(el('span', 'tag rec', 'Novo recorde!'));
  if (tags.childNodes.length) txt.append(tags);
  top.append(pic, txt); box.append(top);
  catchFoot(box, full, S.inv.findIndex(x => !x) >= 0, 'Soltar', 'Mochila cheia. Solte o peixe ou jogue fora algo da mochila para abrir espaço; o peixe espera aqui.', 'Espaço livre! Agora dá para guardar o peixe.');
}
/* Alga, musgo ou lixo: mostra o item, sem experiência nem "perfeito"; guardar ou descartar. */
function renderJunk(full) {
  const f = fishing, it = ITEMS[f.fishId], box = $('catch');
  box.replaceChildren(); box.hidden = false;
  const top = el('div', 'catch-top junk'), pic = el('canvas', 'pixel catch-pic'); pic.width = 16; pic.height = 16; pic.getContext('2d').drawImage(World.icon(f.fishId), 0, 0);
  const txt = el('div', 'catch-txt'); txt.append(el('b', 'catch-name', `Você pescou: ${it.name.toLowerCase()}`), el('span', 'dim', it.desc), el('span', 'dim', `+${SKILL_GAIN.junk} de experiência de pesca`));
  top.append(pic, txt); box.append(top);
  catchFoot(box, full, canAdd(f.fishId), 'Descartar', `Mochila cheia. Descarte ${it.name.toLowerCase()} ou jogue fora algo da mochila para abrir espaço; o item espera aqui.`, 'Espaço livre! Agora dá para guardar.');
}
/* Botões do resultado e, com a mochila cheia, a grade para abrir espaço. */
function catchFoot(box, full, room, relLabel, fullMsg, okMsg) {
  const keep = btn('btn primary', 'Guardar', () => keepFish()); keep.id = 'catch-keep';
  const rel = btn('btn', relLabel, () => releaseFish()); rel.id = 'catch-release';
  if (full || !room) {
    keep.disabled = !room;
    box.append(el('p', 'catch-full', !room ? fullMsg : okMsg));
    const grid2 = el('div', 'slots catch-inv');
    S.inv.forEach((s2, i) => {
      const b = slotNode(s2, i === discardSel ? 'sel' : ''); b.dataset.i = i;
      const locked = !s2 || ['tool', 'quest'].includes(ITEMS[s2.id].kind);
      if (locked) b.classList.add('locked');
      b.onclick = () => { if (locked) return tip(s2 ? 'Ferramentas e itens de missão não podem ser jogados fora.' : 'Este espaço já está vazio.'); discardSel = i; discardArm = false; renderCatch(true); };
      grid2.append(b);
    });
    box.append(grid2);
    if (discardSel >= 0 && S.inv[discardSel]) {
      const s2 = S.inv[discardSel], name = `${ITEMS[s2.id].name}${s2.n > 1 ? ' × ' + s2.n : ''}${s2.cm ? ` (${s2.cm} cm)` : ''}`;
      const dz = btn('btn danger', discardArm ? `Confirmar: jogar fora ${name}` : `Jogar fora ${name}`, () => {
        if (!discardArm) { discardArm = true; return renderCatch(true); }
        S.inv[discardSel] = null; discardSel = -1; discardArm = false; save(); renderHotbar(); toast(`Você jogou fora ${name}.`); renderCatch(true);
      });
      dz.id = 'catch-discard'; box.append(dz);
    }
  }
  const row = el('div', 'catch-btns'); row.append(keep, rel); box.append(row);
  box.append(el('span', 'catch-keys', '← → escolhe · Espaço confirma'));
  (keep.disabled ? rel : keep).focus();
}
/* Setas trocam a opção do resultado. */
function catchArrow(d) {
  const bs = [...$('catch').querySelectorAll('button:not(:disabled)')]; if (!bs.length) return;
  const i = bs.indexOf(document.activeElement); bs[(i + d + bs.length) % bs.length].focus();
}
function keepFish() {
  const f = fishing; if (!f || f.phase !== 'show') return;
  if (f.junk) {
    if (!canAdd(f.fishId)) return renderCatch(true);
    addTo(S.inv, f.fishId, 1); f.phase = 'kept'; save(); renderHotbar();
    floats.push({ icon: f.fishId, x: P.x, y: P.y, t0: performance.now() }); toast(`+1 ${ITEMS[f.fishId].name}`);
    return endFishing();
  }
  const i = S.inv.findIndex(x => !x);
  if (i < 0) return renderCatch(true);
  S.inv[i] = { id: f.fishId, n: 1, cm: f.cm }; save();
  floats.push({ icon: f.fishId, x: P.x, y: P.y, t0: performance.now() });
  toast(`+1 ${ITEMS[f.fishId].name} (${f.cm} cm)`);
  endFishing();
}
function releaseFish() {
  const f = fishing; if (!f || f.phase !== 'show') return;
  f.phase = 'release'; f.t = 0; $('catch').hidden = true; toast(f.junk ? `Você descartou ${ITEMS[f.fishId].name.toLowerCase()}.` : 'Você devolveu o peixe à água.');
}

/* ---------- isca e vara aprimorada ---------- */
function loadBait() {
  const n = count('minhoca'); if (!n) return toast(`Você não tem minhocas. O Armazém vende por ${ITEMS.minhoca.price} moedas cada.`);
  removeItem('minhoca', n); S.fish.bait += n; save(); toast(`${n} minhoca(s) na vara · total ${S.fish.bait}`);
}
function unloadBait() {
  if (!S.fish.bait) return;
  const left = addTo(S.inv, 'minhoca', S.fish.bait); const moved = S.fish.bait - left; S.fish.bait = left; save(); renderHotbar();
  toast(left ? `Só coube parte: ${moved} minhoca(s) voltaram à mochila` : `${moved} minhoca(s) voltaram à mochila`);
}
const ownsFiber = () => S.fish.fiber || owns('vara_fibra');
/* Compra a vara de fibra: confere tudo antes de cobrar. A de bambu continua (mochila ou baú). */
function fiberPlan() {
  const F = FISHING.fiber;
  if (ownsFiber()) return { why: 'Você já tem a vara de fibra de vidro.' };
  if (fishLevel() < F.level) return { why: `Chega com pesca nível ${F.level} (você está no ${fishLevel()}).` };
  if (S.coins < F.price) return { why: `Faltam ${F.price - S.coins} moedas.` };
  const bi = S.inv.findIndex(x => x && x.id === 'vara');
  if (bi >= 0) {                                       // a nova toma o lugar da de bambu; a de bambu vai para outro espaço ou para o baú
    const free = S.inv.findIndex((x, i) => !x && i !== bi), chest = S.chest.findIndex(x => !x);
    if (free < 0 && chest < 0) return { why: 'Abra um espaço na mochila ou no baú para guardar a vara de bambu.' };
    return { ok: true, slot: bi, bambooTo: free >= 0 ? ['inv', free] : ['chest', chest] };
  }
  const free = S.inv.findIndex(x => !x);
  if (free < 0) return { why: 'Abra um espaço na mochila para a vara nova.' };
  return { ok: true, slot: free, bambooTo: null };
}
function buyFiber() {
  const p2 = fiberPlan(); if (!p2.ok) { toast(p2.why); return false; }
  const bamboo = S.inv[p2.slot];
  S.coins -= FISHING.fiber.price;
  S.inv[p2.slot] = { id: 'vara_fibra', n: 1 };
  if (p2.bambooTo) (p2.bambooTo[0] === 'inv' ? S.inv : S.chest)[p2.bambooTo[1]] = bamboo;
  S.fish.fiber = true; S.fish.current = 'vara_fibra'; save(); renderHotbar();
  toast(`Vara de fibra de vidro! A de bambu foi para ${p2.bambooTo ? (p2.bambooTo[0] === 'inv' ? 'outro espaço da mochila' : 'o baú') : 'onde estava'}.`);
  return true;
}

/* ---------- a vara chega pelo correio (uma vez) ---------- */
function rodLetter() {
  S.fish.letter = true; if (!S.fish.rod) S.fish.pending = true; save();     // o presente fica guardado até caber na mochila
  run(async () => {
    await say('narr', map.id === 'casa' ? 'Alguém passou cedinho e deixou na porta uma carta e um embrulho comprido.' : 'Um menino da vila vem correndo com uma carta e um embrulho comprido: "É do Tomé!"');
    await showLetter(false, ROD_LETTER);
    await giveRod(true);
  });
}
async function giveRod(inDialog) {
  if (S.fish.rod) { S.fish.pending = false; return true; }
  if (canAdd('vara')) {
    addTo(S.inv, 'vara', 1); S.fish.rod = true; S.fish.pending = false; save(); renderHotbar();
    toast('+1 Vara de bambu');
    if (inDialog) await say('narr', 'Você ganhou a vara de bambu de Tomé. Escolha a vara na barra de itens e vá até a beira da água. A carta fica guardada no Diário.');
    return true;
  }
  S.fish.pending = true; save();
  if (inDialog) await say('narr', 'Sua mochila está cheia, então a vara fica guardada junto com a carta. Abra um espaço e pegue a vara no Diário, em "Cartas".');
  else toast('Mochila cheia: abra um espaço para pegar a vara.');
  return false;
}

/* =====================================================
   MISSÕES
   ===================================================== */
const qDone = id => S.quests[id] && S.quests[id].state === 'done';
const qActive = () => Object.keys(QUESTS).filter(id => S.quests[id] && S.quests[id].state === 'active');
const qUnlocked = id => { const q = QUESTS[id]; return !S.quests[id] && (!q.after || qDone(q.after)) && (!q.hearts || hearts(q.giver) >= q.hearts); };
const startItemsFit = q => !q.start || Object.keys(q.start.items).every(id => canAdd(id, q.start.items[id]));
function startQuest(id) {
  const q = QUESTS[id];
  S.quests[id] = { state: 'active', n: {} };
  if (q.start) Object.keys(q.start.items).forEach(k => gain(k, q.start.items[k]));
  if (id === 'chapeu') S.nature.hat = true;                 // o chapéu perdido aparece no bosque
  S.track = id;
  toast('Nova missão: ' + q.title);
  if (q.where) toast(`${q.where[3]}: marcado no mapa (${COARSE ? 'botão Mapa' : 'tecla M'})`);
}
function startAutoQuests() { Object.keys(QUESTS).forEach(id => { if (QUESTS[id].auto && qUnlocked(id)) startQuest(id); }); }
/* Conta uma ação feita no mundo para as missões em andamento. */
function qEvent(type) {
  qActive().forEach(id => {
    const c = QUESTS[id].goal.count; if (!c || !c[type]) return;
    const st = S.quests[id]; st.n[type] = Math.min(c[type], (st.n[type] || 0) + 1);
    if (QUESTS[id].selfDone && qReady(id)) completeQuest(id);
  });
  renderHud();
}
function qReady(id) {
  const g = QUESTS[id].goal, st = S.quests[id];
  if (g.count && !Object.keys(g.count).every(k => (st.n[k] || 0) >= g.count[k])) return false;
  if (g.deliver && !Object.keys(g.deliver).every(k => count(k) >= g.deliver[k])) return false;
  return true;
}
const qProgress = id => { const g = QUESTS[id].goal, st = S.quests[id] || { n: {} }; return [...(QUESTS[id].need && !st.mat ? Object.keys(QUESTS[id].need).map(k => `${ITEMS[k].name} na mochila: ${Math.min(count(k), QUESTS[id].need[k])}/${QUESTS[id].need[k]}`) : []), ...Object.keys(g.count || {}).map(k => `${COUNT_LABEL[k]}: ${Math.min(st.n[k] || 0, g.count[k])}/${g.count[k]}`), ...Object.keys(g.deliver || {}).map(k => `${ITEMS[k].name}: ${Math.min(count(k), g.deliver[k])}/${g.deliver[k]}`)].join(' · '); };
const rewardText = r => [r.coins && `${r.coins} moedas`, ...Object.keys(r.items || {}).map(k => `${r.items[k]} ${ITEMS[k].name}`), r.hen && 'uma galinha', r.friend && 'amizade'].filter(Boolean).join(', ');
/* Conclui uma única vez: retira os itens entregues e dá a recompensa. */
function completeQuest(id) {
  const st = S.quests[id], q = QUESTS[id];
  if (!st || st.state !== 'active' || !qReady(id)) return false;
  if (q.goal.deliver) Object.keys(q.goal.deliver).forEach(k => removeItem(k, q.goal.deliver[k]));
  st.state = 'done'; st.day = S.day;
  const r = q.reward || {};
  if (r.coins) { S.coins += r.coins; toast(`+${r.coins} moedas`); }
  Object.keys(r.items || {}).forEach(k => {               // o que não couber na mochila vai para o baú de casa
    const left = addTo(S.inv, k, r.items[k]); toast(`+${r.items[k]} ${ITEMS[k].name}`);
    if (left) { addTo(S.chest, k, left); toast('Mochila cheia: parte foi para o baú de casa'); }
  });
  if (r.friend) addFriend(q.giver, r.friend);
  if (r.friendTo && q.to) addFriend(q.to, r.friendTo);
  if (r.world) S.world[r.world] = true;
  toast('Missão concluída: ' + q.title);
  startAutoQuests(); save(); renderHud(); renderHotbar();
  return true;
}
/* O morador tem algo a tratar: missão nova, ou entrega pronta. */
function questMark(v) {
  return Object.keys(QUESTS).some(id => { const q = QUESTS[id]; if (q.auto && !S.quests[id]) return false;
    if (S.quests[id] && S.quests[id].state === 'active') return !q.selfDone && (q.to || q.giver) === v.id && qReady(id);
    return q.giver === v.id && !q.auto && qUnlocked(id); });
}
/* Missão acompanhada: a escolhida no Diário, ou a primeira em andamento. */
const tracked = () => { const act = qActive(); return act.includes(S.track) ? S.track : act[0]; };
/* Para onde a missão leva agora: o lugar da tarefa ou, quando está pronta, quem recebe. */
function questTarget(id) {
  const q = QUESTS[id]; if (!q) return null;
  const toPerson = () => { const v = villagerById(q.to || q.giver), p = villagerAt(v, S.time); return p.where === 'residencia' ? { map: 'fora', x: p.x, y: p.y, label: `${v.name} (em casa, em cima do Armazém; volta às 6h)` } : { map: p.where, x: p.x, y: p.y - 36, label: v.name }; };
  if (!q.selfDone && qReady(id)) return toPerson();
  if (q.where) return { map: q.where[0], x: q.where[1], y: q.where[2], label: q.where[3] };
  return toPerson();
}
/* Ponto no mapa externo que representa um lugar (interiores = a porta do prédio). */
/* Ponto na tela do mapa: a serra fica em cima, alinhada com a trilha; a fazenda e a vila embaixo.
   Interiores = a porta do prédio (ou da tenda). */
const MAP_SX = 499, MAP_FY = World.SERRA.h;
function outdoorPoint(mapId, x, y) {
  if (mapId === 'fora') return { x, y: y + MAP_FY };
  if (mapId === 'montanha') return { x: x + MAP_SX, y };
  const par = World.get(mapId).parent || 'fora', d = World.get(par).doors[mapId];
  return d ? outdoorPoint(par, d.x, d.y - 20) : null;
}
function objective() {
  const id = tracked(); if (!id) return '';
  const p = qProgress(id); return QUESTS[id].title + (p ? ` — ${p}` : '');
}

/* =====================================================
   MORADORES
   ===================================================== */
function talkTo(v) {
  run(async () => {
    const who = speaker(v);
    if (v.id === 'lucio' && !S.lucio.met) return meetLucio(v);
    if (v.id === 'lucio' && qActive().includes('fogo') && fireWindow() === 0) return fireScene();
    // 1) entrega de missão
    const turn = qActive().find(id => { const q = QUESTS[id]; return !q.selfDone && (q.to || q.giver) === v.id && qReady(id); });
    if (turn) {
      const q = QUESTS[turn], items = (q.reward && q.reward.items) || {};
      if (!Object.keys(items).every(k => canAdd(k, items[k]))) return say('narr', 'Sua mochila está cheia. Abra espaço para receber a recompensa e fale de novo.');
      await sayAll(who, (q.done || ['Agradeço muito!']).map(l => (/^\[/.test(l) ? l : '[contente]' + l)));
      if (q.reward && q.reward.hen) await newHen(who);
      completeQuest(turn);
      if (turn === 'flores' && !S.iara.colorName) await iaraNameColor(who, false);
      return;
    }
    if (v.id === 'iara' && await iaraEvents(v, who)) return;
    // 2) missão nova
    const offer = Object.keys(QUESTS).find(id => QUESTS[id].giver === v.id && !QUESTS[id].auto && qUnlocked(id));
    if (offer) {
      const q = QUESTS[offer];
      await sayAll(who, q.offer);
      if (!startItemsFit(q)) return say('narr', 'Sua mochila está cheia. Abra espaço e fale de novo para aceitar.');
      startQuest(offer);
      return say('narr', `Missão aceita: ${q.title}. ${q.desc} Recompensa: ${rewardText(q.reward)}.`);
    }
    // no Armazém, Dona Celeste atende no balcão
    if (v.id === 'celeste' && map.id === 'loja' && await choose(['Comprar e vender', 'Conversar'], -1, { who, text: '[contente]Bem-vind{g:o|a|e} ao Armazém, {nome}! Vai levar alguma coisa ou só veio conversar?' }) === 0) { setTimeout(() => openModal('loja'), 0); return; }
    // 3) cena de amizade (uma vez, com 3 corações)
    if (v.scene && hearts(v.id) >= 3 && !S.scenes[v.id]) {
      const sc = v.scene, n = sc.n || 1;
      if (canAdd(sc.item, n)) { await sayAll(who, sc.lines.map(l => (/^\[/.test(l) ? l : '[contente]' + l))); S.scenes[v.id] = true; gain(sc.item, n); return; }
    }
    // 4) presente, se há um produto na mão
    const it = equipped();
    const giftPrompt = () => ({ who, text: v.id === 'lucio' ? '[neutro]Hum? Diga.' : '[neutro]Oi, {nome}! O que manda?' });
    if (v.id === 'iara') { if (await iaraMenu(v, who, it)) return; }
    else if (GIFT_RULES[v.id]) { if (giftable(it) && await choose(['Conversar', `Dar ${ITEMS[it.id].name}`], -1, giftPrompt()) === 1) return giftRuled(v, who, it.id); }
    else if (giftable(it) && !S.daily.gift[v.id] && await choose(['Conversar', `Dar ${ITEMS[it.id].name}`], -1, giftPrompt()) === 1) return give(v, who, it.id);
    // 5) conversa: a primeira do dia aumenta a amizade
    const pending = qActive().find(id => (QUESTS[id].to || QUESTS[id].giver) === v.id && !QUESTS[id].selfDone);
    if (!S.daily.talk[v.id]) {
      S.daily.talk[v.id] = true; addFriend(v.id, FRIEND.talk);
      if (v.id === 'iara') await say(who, iaraLine(v));
      else if (v.id === 'caleb') await say(who, calebLine(v));
      else if (v.talk.length === 4) await say(who, bandLine(v));
      else { const tier = Math.min(2, Math.floor(hearts(v.id) / 2)); await say(who, v.talk[tier][S.day % v.talk[tier].length]); }
    } else if (Array.isArray(v.again)) { const L = v.id === 'iara' ? S.iara : v.id === 'caleb' ? S.caleb : S.lucio; L.again = (L.again + 1) % v.again.length; await say(who, v.again[L.again]); }
    else await say(who, v.again);
    if (v.id === 'iara' && S.lucio.met && !S.lucio.iara) await iaraOnLucio(who);
    if (pending) await say('narr', `Missão em andamento com ${v.name}: ${QUESTS[pending].desc} (${qProgress(pending) || 'em andamento'})`);
  });
}
/* Fala de Caleb: mistura falas do lugar/situação (almoço, notebook, bosque, lagoa, praça, noite, chuva, domingo)
   com falas da faixa de amizade (0 · 1–2 · 3–5 · 6–8 corações), sem repetir a anterior. */
function calebLine(v) {
  const p = villagerAt(v, S.time), h = hearts('caleb'), band = h === 0 ? 0 : h <= 2 ? 1 : h <= 5 ? 2 : 3, X = v.ctx, C = CALEB, near = (q, r = 40) => Math.hypot(p.x - q[0], p.y - q[1]) < r;
  let key = null;
  if (isRaining() && p.where === 'loja') key = 'chuva';
  else if (p.where === 'loja') key = p.act === 'notebook' ? 'notebook' : (p.act === 'boxes' || p.act === 'lunch') ? (calendar().wd === 6 && S.time < 780 ? 'domingo' : 'almoco') : S.time >= 1230 ? 'noite' : null;
  else if (p.where === 'fora') key = near(C.LK) ? 'lago' : near(C.PR) ? 'praca' : near(C.BQ, 80) ? 'bosque' : null;
  const recent = Array.isArray(S.caleb.recent) ? S.caleb.recent : [], all = [...(key ? X[key] : []), ...(key ? X[key] : []), ...v.talk[band]];
  const pool = all.filter(l => !recent.includes(l)), line = (pool.length ? pool : all.filter(l => l !== S.caleb.last))[Math.floor(Math.random() * (pool.length || all.length - 1))] || v.talk[band][0];
  S.caleb.last = line; S.caleb.recent = [...recent, line].slice(-3); return line;                 // as três últimas não voltam logo
}
/* Chegada de Caleb (uma vez): na primeira visita ao Armazém com Dona Celeste atendendo. Vale também para
   jogos salvos de antes desta versão (acontece na próxima visita nessas condições). */
function calebArrival() {
  if (!S || !S.caleb || S.caleb.arrived || map.id !== 'loja' || villagerAt(villagerById('celeste'), S.time).where !== 'loja') return;
  S.caleb.arrived = true; S.caleb.day = S.day; S.caleb.t = S.time; calebCache.key = ''; save();
  run(async () => {
    const who = id => speaker(villagerById(id));
    for (const [id, line] of villagerById('caleb').arrival) await say(who(id), line);
    save();
  });
}
/* Fala por faixa de amizade (0 · 1–2 · 3–4 · 5 corações), sem repetir a anterior. */
function bandLine(v) {
  const h = hearts(v.id), band = h === 0 ? 0 : h <= 2 ? 1 : h <= 4 ? 2 : 3, lines = v.talk[band], L = S.lucio;
  let i = (S.day * 3 + band) % lines.length;
  if (L.last === band * 10 + i) i = (i + 1) % lines.length;
  L.last = band * 10 + i;
  return lines[i];
}
async function meetLucio(v) {
  const unknown = speaker(v);
  await say('narr', 'Ao lado de uma tenda remendada, um homem de cabelo e barba grisalhos separa folhas sobre uma pedra. Ele levanta os olhos devagar.');
  await say(unknown, v.meet[0]);
  const c = await choose(['Sou {g:o neto|a neta|da família} do seu ' + AVO + '. Estou cuidando de {fazenda}.', 'Só estava conhecendo a trilha.']);
  S.lucio.met = true; S.daily.talk.lucio = true; addFriend('lucio', FRIEND.talk); save();
  const who = speaker(v);
  if (c === 0) {
    await say(who, '[neutro]Do ' + AVO + '... Ele subia aqui pra comprar erva comigo. Pagava sempre a mais e fingia que tinha errado a conta.');
    await say(who, '[neutro]Lúcio. Moro aqui. Se precisar de folha pra chá ou de saber se vai chover, pergunta.');
  } else await say(who, '[neutro]A trilha é boa. Lúcio, meu nome. Pode conhecer. Só deixe minhas coisas onde estão.');
  toast('Você conheceu Lúcio. A tenda dele agora aparece no mapa.');
}
/* Semana: dias 1–7, 8–14, 15–21 e 22–28 de cada estação (a semana vira nos dias 1, 8, 15 e 22). */
const weekOf = d => Math.floor((d - 1) / 7);
const isBirthday = v => { const c = calendar(); return v.birthday && SEASONS.indexOf(c.season) === v.birthday.season && c.day === v.birthday.day; };
/* Gosto do morador pelo item. Com prefs (Iara): primeiro os itens citados um a um, depois as
   categorias do item (cat, ou "peixe" para peixes); o resto é neutro. */
const itemCats = id => { const it = ITEMS[id] || {}; return [it.cat, it.kind === 'fish' ? 'peixe' : null].filter(Boolean); };
const PREF_ORDER = ['love', 'like', 'neutral', 'dislike'];
function giftKind(v, id) {
  if (v.prefs) {
    for (const k of PREF_ORDER) if (v.prefs[k].ids.includes(id)) return k;
    const cats = itemCats(id); for (const k of PREF_ORDER) if (v.prefs[k].cats.some(c => cats.includes(c))) return k;
    return 'neutral';
  }
  return v.love.includes(id) ? 'love' : v.like.includes(id) ? 'like' : v.dislike.includes(id) ? 'dislike' : 'neutral';
}
const giftState = v => (v.id === 'lucio' ? S.lucio : v.id === 'iara' ? S.iara : null);       // limites de dia, semana e aniversário
const giftable = it => !!it && !!ITEMS[it.id] && (!ITEMS[it.id].kind || ITEMS[it.id].kind === 'fish');
const withExpr = (line, kind) => (/^\[/.test(line) ? line : (kind === 'love' || kind === 'like' ? '[contente]' : kind === 'dislike' ? '[triste]' : '') + line);
/* Presentes com limites próprios (Lúcio): 1 por dia, 2 por semana e um extra no aniversário, com pontos x8. */
async function giftRuled(v, who, id) {
  const R = GIFT_RULES[v.id], L = giftState(v), name = ITEMS[id].name, c = calendar();
  if (await ask(`Presentear ${v.name} com ${name}?`, ['Sim, presentear', 'Não']) !== 0) return say('narr', `Você guarda ${name.toLowerCase()} na mochila.`);
  if (L.gifts.week !== weekOf(S.day)) L.gifts = { week: weekOf(S.day), n: 0 };
  const kind = giftKind(v, id);
  if (isBirthday(v) && L.bday !== c.year) {
    const pts = FRIEND[kind] * R.birthdayMult;
    removeItem(id, 1); L.bday = c.year; S.known[v.id][id] = kind; addFriend(v.id, pts); save();
    await say(who, withExpr(v.bdayGift[kind === 'dislike' ? 'bad' : kind === 'neutral' ? 'neutral' : 'good'], kind));
    toast(`Presente de aniversário: amizade ${pts > 0 ? '+' : ''}${pts}`);
    return;
  }
  if (S.daily.gift[v.id]) return say(who, v.limit.day);
  if (L.gifts.n >= R.perWeek) return say(who, v.limit.week);
  removeItem(id, 1); S.daily.gift[v.id] = true; L.gifts.n++; S.known[v.id][id] = kind; addFriend(v.id, FRIEND[kind]); save();
  await say(who, withExpr(v.gift[kind], kind));
  if (kind === 'love') toast(`${v.name} adorou!`);
}
/* =====================================================
   IARA: pinturas da fonte, falas e acontecimentos de amizade
   ===================================================== */
const iaraKey = (y, si) => `${y}-${si}`;
/* Dia 10 de cada estação: a pintura da fonte fica pronta às 18h (ou na noite, se o jogador
   dormiu antes). Uma por estação e ano; recarregar não duplica. */
function iaraFinishPainting(day) {
  if (!S || !S.iara) return; const c = calendar(day); if (c.day !== 10) return;
  const k = iaraKey(c.year, c.si); if (S.iara.paintings[k]) return;
  S.iara.paintings[k] = { y: c.year, si: c.si, rain: isRaining() }; save();
}
const iaraPaintings = () => Object.values(S.iara.paintings).sort((a, b) => a.y - b.y || a.si - b.si);
const iaraSeasonsDone = () => [0, 1, 2, 3].filter(si => iaraPaintings().some(p => p.si === si));
const paintCaption = p => `A fonte ${['na Primavera', 'no Verão', 'no Outono', 'no Inverno'][p.si]}, ano ${p.y}${p.rain ? ' · pintada em casa, pelos esboços (choveu)' : ''}`;
/* Painel simples com uma ou mais pinturas prontas. */
function showPaintings(items, title) {
  return new Promise(res => {
    const box = $('painting'), body = $('painting-body'); body.replaceChildren(); $('painting-title').textContent = title;
    items.forEach(it => { const f = el('figure', items.length > 1 ? 'pf small' : 'pf'), c = el('canvas', 'pixel'); c.width = 48; c.height = 36; c.getContext('2d').drawImage(it.canvas, 0, 0); f.append(c, el('figcaption', '', it.caption)); body.append(f); });
    box.hidden = false; $('painting-ok').focus();
    $('painting-ok').onclick = () => { box.hidden = true; res(); };
  });
}
/* Fala de Iara conforme lugar, hora, estação, chuva, dia de pintura e amizade, sem repetir a anterior. */
function iaraLine(v) {
  const I = v.ctx, c = calendar(), p = villagerAt(v, S.time), h = hearts('iara'), band = h === 0 ? 0 : h <= 2 ? 1 : h <= 4 ? 2 : 3;
  const painting10 = c.day === 10 && S.time >= 840 && S.time < 1080, doneNow = c.day === 10 && !!S.iara.paintings[iaraKey(c.year, c.si)];
  let ctx;
  if (painting10) ctx = (isRaining() ? I.pintandoChuva : I.pintando).map(l => '[concentrada]' + l);
  else if (doneNow) ctx = I.pronta.map(l => '[contente]' + l);
  else if (isRaining()) ctx = I.chuva;
  else if (p.where === 'escola') ctx = I.escola;
  else if (p.where === 'iara') ctx = S.time < 720 ? I.casaManha : I.casa;
  else ctx = Math.hypot(p.x - 664, p.y - 150) < 40 ? I.fonte : I.praca;
  let pool = painting10 || doneNow ? ctx : [...ctx, ...ctx, ...I.estacao[c.si], ...v.talk[band], ...v.talk[band]];
  if (!painting10 && S.iara.colorName) pool = pool.concat(I.cor.map(l => l.replace('{cor}', S.iara.colorName)));
  const opts = pool.filter(l => l !== S.iara.lastLine), from = opts.length ? opts : pool, line = from[Math.floor(Math.random() * from.length)];
  S.iara.lastLine = line; return line;
}
/* 1 coração: escolher o nome da cor nova (e lembrar dele depois). */
async function iaraNameColor(who, retro) {
  if (retro) await say(who, '[contente]Lembra da flor-do-campo que você me trouxe? Misturei as cores dela e saiu uma cor nova... que ainda não tem nome!');
  const c = await choose(IARA.colorNames, -1, { who, text: '[contente]Qual nome a gente dá para essa cor?' });
  S.iara.colorName = IARA.colorNames[c]; save();
  await say(who, `[contente]"${S.iara.colorName}"! Perfeito. Vou escrever no pote, com letra caprichada.`);
}
/* Acontecimentos de amizade (3 e 5 corações) e o nome da cor para saves antigos. Devolve true se a conversa terminou nele. */
async function iaraEvents(v, who) {
  const I = S.iara, h = hearts('iara');
  if (qDone('flores') && !I.colorName) { await iaraNameColor(who, true); return true; }
  if (h >= 3 && I.ev3 === 0) {
    await sayAll(who, ['[contente]Ei! Quer ver uma coisa que quase ninguém repara?', 'Na praça, embaixo da fonte, onde as pedras encontram a grama, tem um detalhe escondido. Procura e clica nele quando achar!', '[concentrada]Não vou dizer o que é. Olhar com calma faz parte.']);
    I.ev3 = 'seek'; save(); return true;
  }
  if (I.ev3 === 'found') {
    await sayAll(who, ['[surpresa]Você achou! A florzinha entre as pedras!', '[contente]Eu fiz um esboço dela. Olha só:']);
    await showPaintings([{ canvas: World.painting('esboco'), caption: 'Esboço: a florzinha entre as pedras da praça' }], 'O caderno de Iara');
    await say(who, '[contente]Quase ninguém olha para baixo na praça. Agora você é uma das pessoas que olham.');
    if (!S.scenes.iara) {
      if (!canAdd('boina')) { await say('narr', 'Iara quer te dar um presente, mas sua mochila está cheia. Abra espaço e fale com ela de novo.'); return true; }
      gain('boina'); S.scenes.iara = true; await say(who, '[contente]E isto é para você: uma boina de pintor de verdade. Fica melhor em você do que na minha gaveta.');
    }
    I.ev3 = 'done'; save(); return true;
  }
  if (h >= 5 && !I.ev5) {
    const done = iaraSeasonsDone();
    if (done.length === 4) {
      await say(who, '[contente]Terminei! A fonte nas quatro estações. Vem ver todas juntas?');
      await showPaintings([0, 1, 2, 3].map(si => { const p = iaraPaintings().filter(q => q.si === si).pop(); return { canvas: World.painting('fonte', si), caption: paintCaption(p) }; }), 'As quatro versões da fonte');
      await sayAll(who, ['É o mesmo lugar, sabia? A mesma fonte, a mesma praça. Mas olha como muda tudo.', '[concentrada]Eu achava que precisava ir longe para pintar coisas diferentes. Não precisa. Precisa só voltar com calma.']);
      if (!canAdd('quadro_fonte')) { await say('narr', 'Iara fez uma cópia de uma das pinturas para você, mas sua mochila está cheia. Abra espaço e fale com ela de novo.'); return true; }
      I.copySi = calendar().si; gain('quadro_fonte'); I.ev5 = true; save();
      await say(who, '[contente]Fiz uma cópia para você. Pode pendurar na sua casa! Escolha o quadro no Inventário.');
      return true;
    }
    if (I.missingTold !== S.day) {                                // avisa o que falta, sem travar a conversa nem a amizade
      I.missingTold = S.day; save();
      const miss = [0, 1, 2, 3].filter(si => !done.includes(si)).map(si => SEASONS[si]);
      await say(who, `Quando eu tiver a fonte pintada nas quatro estações, quero te mostrar todas juntas. Eu pinto todo dia 10! Ainda faltam: ${miss.join(', ')}.`);
    }
  }
  return false;
}
/* Menu de Iara: conversar, ver a pintura pronta mais recente e dar presente. */
async function iaraMenu(v, who, it) {
  const opts = ['Conversar'], pics = iaraPaintings();
  if (pics.length) opts.push('Ver a pintura');
  if (giftable(it)) opts.push(`Dar ${ITEMS[it.id].name}`);
  if (opts.length === 1) return false;
  const o = opts[await choose(opts, -1, { who, text: '[neutro]Oi, {nome}! O que foi?' })];
  if (o === 'Ver a pintura') {
    const p = pics[pics.length - 1];
    await say(who, '[contente]Esta é a pintura da fonte mais nova. Pode olhar com calma!');
    await showPaintings([{ canvas: World.painting('fonte', p.si), caption: paintCaption(p) }], 'Pintura de Iara');
    return true;
  }
  if (o.startsWith('Dar')) { await giftRuled(v, who, it.id); return true; }
  return false;
}
async function iaraOnLucio(who) {
  await sayAll(who, IARA_LUCIO.lines);
  const c = await choose(IARA_LUCIO.choices);
  await say(who, IARA_LUCIO.answers[c]);
  S.lucio.iara = true; save();
}
/* Janela da cena da fogueira: -1 cedo demais, 0 na hora (18h–22h), 1 tarde demais. */
const fireWindow = () => (S.time < 1080 ? -1 : S.time > 1320 ? 1 : 0);
function fireScene() {
  run(async () => {
    if (!qActive().includes('fogo')) return;
    const w = fireWindow(), v = villagerById('lucio'), who = speaker(v);
    if (w < 0) return say('narr', 'Lúcio disse "quando escurecer". Volte à fogueira entre 18h e 22h.');
    if (w > 0) return say('narr', 'Ficou tarde: a fogueira virou brasa e Lúcio cochila encostado no tronco. A conversa fica para amanhã, quando escurecer.');
    if (!canAdd('muda_goiaba')) return say('narr', 'Sua mochila está cheia. Abra um espaço antes de sentar com Lúcio.');
    await say('narr', 'A fogueira estala. Lúcio empurra uma batata-doce para o seu lado com um graveto.');
    await say(who, '[contente]Chegou na hora. A batata também.');
    await say(who, '[neutro]Sabe por que eu fico aqui em cima? Não é birra. Daqui eu vejo o tempo chegando antes de todo mundo.');
    await say(who, '[neutro]Agora é a sua vez. Ninguém troca a cidade por um sítio tomado de mato sem um motivo.');
    const c = await choose(['Contar do escritório e do cansaço', 'Contar da carta do seu avô']);
    if (c === 0) await say(who, '[neutro]Cansaço de cidade eu conheço de ouvir falar. Aqui o corpo cansa, a cabeça descansa. Dá pra dormir depois.');
    else await say(who, '[emocionado]O ' + AVO + ' escrevia do jeito que falava: devagar e certo. Ele ia gostar de saber que a carta chegou.');
    await say(who, '[emocionado]Faz tempo que eu não converso assim, sem ficar de olho na trilha.');
    await say(who, '[contente]Toma. Uma muda da goiabeira da nascente. Planta no seu sítio. Quando der fruto, lembra que tem um velho aqui em cima que gosta de goiaba.');
    S.lucio.fireScene = true; S.scenes.lucio_fogo = true;
    qEvent('scene');
  });
}
/* Tenda: na primeira vez, Lúcio precisa deixar entrar. */
function askTent(to) {
  run(async () => {
    if (!S.lucio.met) return say('narr', 'É a tenda de alguém. Entrar sem conhecer o dono não parece certo.');
    const v = villagerById('lucio'), who = speaker(v);
    await say(who, '[desconfiado]Vai entrar na tenda?');
    if (await choose(['Posso dar uma olhada lá dentro?', 'Não, deixa pra lá']) !== 0) return say(who, '[neutro]Hum. Tá certo.');
    await say(who, '[neutro]Pode. Olhar não tira pedaço. Só não mexa nos potes de erva: cada um tem seu lugar.');
    S.lucio.permit = true; save();
    const m = World.get(to); setTimeout(() => travel(to, m.spawn.x, m.spawn.y, 'up'), 0);
  });
}
/* Reforço da lona: a madeira é usada no primeiro clique; depois, 3 reparos. */
function lonaAction() {
  const st = S.quests.lona, T = World.SERRA.tent;
  if (!st || st.state !== 'active') return { label: S.lucio.tentUp ? 'Lona reforçada' : 'Lona da tenda', act: () => run(() => say('narr', S.lucio.tentUp ? 'A lona nova está esticada e firme, presa na cumeeira de madeira. Nem o vento da serra balança.' : 'A lona está remendada em vários pontos e tem um rasgo perto do topo.')) };
  const n = st.n.repair || 0;
  if (n >= 3) return { label: 'Lona reforçada — fale com Lúcio', act: () => tip('A lona está reforçada. Fale com Lúcio.') };
  const hit = () => {
    if (!useTool('madeira', 2)) return;
    bang(T.x + 18, T.base - 30, 'wood'); qEvent('repair');
    if ((st.n.repair || 0) >= 3) { S.lucio.tentUp = true; toast('Tenda reforçada! Agora fale com Lúcio.'); } else toast(`Reparo ${st.n.repair}/3`);
    save();
  };
  if (!st.mat) return { label: `Reforçar a lona (madeira: ${Math.min(4, count('madeira'))}/4)`, act: () => {
    if (count('madeira') < 4) return tip(`Faltam madeiras: você tem ${count('madeira')} de 4. Galhos e árvores do bosque dão madeira.`);
    if (S.energy < 2) return tip('Sem energia para trabalhar. Durma para recuperar.');
    removeItem('madeira', 4); st.mat = true; toast('4 madeiras usadas no reforço'); hit();
  } };
  return { label: `Reparar a lona (${n}/3)`, act: hit };
}
async function give(v, who, id) {
  const kind = v.love.includes(id) ? 'love' : v.like.includes(id) ? 'like' : v.dislike.includes(id) ? 'dislike' : 'neutral';
  removeItem(id, 1); S.daily.gift[v.id] = true; S.known[v.id][id] = kind;
  const own = v.giftPts && v.giftPts[id] != null;                     // presente com valor próprio (ex.: morango para Dona Celeste): substitui o valor de "adora"
  addFriend(v.id, own ? v.giftPts[id] : FRIEND[kind]);
  await say(who, (kind === 'love' || kind === 'like' ? '[contente]' : '') + ((v.giftLine && v.giftLine[id]) || v.gift[kind]));
  if (kind === 'love') toast(`${v.name} adorou!`);
}

/* =====================================================
   GALINHAS
   ===================================================== */
const wellText = w => (w >= 75 ? 'radiante' : w >= 50 ? 'tranquila' : w >= 25 ? 'meio ressabiada' : 'tristonha');
function spawnHens() {
  const Y = World.YARD;
  hens = S.coop.hens.map((h, i) => ({ x: Y.x0 + 20 + (i * 37) % (Y.x1 - Y.x0 - 30), y: Y.y0 + 12 + (i * 23) % (Y.y1 - Y.y0 - 16), tx: 0, ty: 0, wait: 500 + i * 400, kind: h.kind || 0, flip: false }));
  hens.forEach(h => { h.tx = h.x; h.ty = h.y; });
}
function updateHens(dt, t) {
  if (!map || map.id !== 'fora') return;
  const Y = World.YARD;
  hens.forEach((h, i) => {
    const dx = h.tx - h.x, dy = h.ty - h.y, d = Math.hypot(dx, dy);
    h.heart = S.coop.hens[i] && S.coop.hens[i].petT && t < S.coop.hens[i].petT;
    if (d > 1) { h.x += dx / d * 0.02 * dt; h.y += dy / d * 0.02 * dt; h.moving = true; h.flip = dx < 0; h.peck = false; return; }
    h.moving = false; h.wait -= dt; h.peck = h.wait < 900 && Math.floor(t / 220) % 2 === 0;
    if (h.wait <= 0) { h.wait = 1500 + Math.random() * 3500; h.tx = Y.x0 + Math.random() * (Y.x1 - Y.x0); h.ty = Y.y0 + Math.random() * (Y.y1 - Y.y0); }
  });
}
async function newHen(who) {
  const name = await askText(who || 'narr', 'Que nome você dá a ela? Só letras de A a Z.', ['Pipoca', 'Farofa', 'Canjica', 'Pamonha'][S.coop.hens.length % 4], 'hen');
  S.coop.hens.push({ name, well: 60, pet: 0, kind: S.coop.hens.length % 4 });
  spawnHens(); toast(`${name} chegou ao galinheiro`); save();
}
function henMenu(i) {
  run(async () => {
    const h = S.coop.hens[i];
    await say('narr', `${h.name} olha para você, curiosa.`);
    const c = await choose(['Fazer carinho', 'Ver como ela está', 'Trocar o nome', 'Deixar quieta']);
    if (c === 0) {
      if (h.pet === S.day) return say('narr', `${h.name} já ganhou carinho hoje, mas se aninha na sua mão mesmo assim.`);
      h.pet = S.day; h.well = Math.min(100, h.well + 8); h.petT = performance.now() + 2500;
      addXp('cultivo', SKILL_GAIN.henPet, P.x, P.y - 40); save();       // uma vez por galinha por dia
      return say('narr', `Você faz carinho em ${h.name}. Ela fecha os olhos e cacareja baixinho.`);
    }
    if (c === 1) return say('narr', `${h.name} está ${wellText(h.well)}. ${S.coop.feed ? 'Há ração no comedouro para esta noite.' : 'O comedouro está vazio: sem ração, ela não bota e fica triste.'} Galinha alimentada bota um ovo, que aparece no ninho na manhã seguinte.`);
    if (c === 2) { const nv = await askText('narr', 'Qual é o novo nome? Só letras de A a Z (deixe vazio para manter).', h.name, 'hen', h.name); if (nv === h.name) return say('narr', `Ela continua se chamando ${h.name}.`); h.name = nv; save(); return say('narr', `Agora ela se chama ${h.name}.`); }
  });
}
function feed() {
  if (!count('racao')) return run(() => say('narr', `O comedouro tem ${S.coop.feed} porção(ões). Você não tem ração na mochila: o Armazém vende.`));
  if (S.coop.feed >= 8) return toast('O comedouro está cheio');
  removeItem('racao', 1); S.coop.feed++; qEvent('feed'); toast(`Ração no comedouro: ${S.coop.feed}`); save();
}
function nest() {
  if (!S.coop.eggs) return run(() => say('narr', S.coop.hens.length ? 'O ninho está vazio. Com ração no comedouro, cada galinha bota um ovo durante a noite.' : 'Um ninho de palha, vazio. O galinheiro ainda não tem moradoras.'));
  let got = 0; while (S.coop.eggs && canAdd('ovo')) { addTo(S.inv, 'ovo', 1); S.coop.eggs--; got++; }
  if (got) addXp('cultivo', SKILL_GAIN.egg * got, P.x, P.y - 40);   // só ovos postos no ninho
  if (!got) return toast('Mochila cheia');
  floats.push({ icon: 'ovo', x: P.x, y: P.y, t0: performance.now() }); toast(`+${got} Ovo${got > 1 ? 's' : ''}`); if (S.coop.eggs) toast('Mochila cheia: ficaram ovos no ninho');
  renderHotbar(); save();
}

/* =====================================================
   BICHO DE ESTIMAÇÃO
   ===================================================== */
const PET_AREA = { x0: 166, x1: 340, y0: 160, y1: 186 };
function spawnPet() { pet = S.pet && S.pet.state === 'home' ? { x: 250, y: 172, tx: 250, ty: 172, wait: 600, sp: S.pet.sp, flip: false } : null; }
function updatePet(dt, t) {
  if (!pet || !map || map.id !== 'fora') return;
  pet.heart = S.pet.petT && t < S.pet.petT;
  const dx = pet.tx - pet.x, dy = pet.ty - pet.y, d = Math.hypot(dx, dy);
  if (d > 1) { pet.x += dx / d * 0.03 * dt; pet.y += dy / d * 0.03 * dt; pet.moving = true; pet.flip = dx < 0; return; }
  pet.moving = false; pet.wait -= dt;
  if (pet.wait <= 0) { pet.wait = 2000 + Math.random() * 4000; const A = PET_AREA; pet.tx = A.x0 + Math.random() * (A.x1 - A.x0); pet.ty = A.y0 + Math.random() * (A.y1 - A.y0); }
}
function petPet() {
  const p = S.pet; p.petT = performance.now() + 2500; pet.wait = 2500; pet.tx = pet.x; pet.ty = pet.y;
  const first = p.lastPet !== S.day; p.lastPet = S.day; save();
  run(() => say('narr', p.sp === 'gato' ? `${p.name} ronrona alto e se esfrega na sua perna.${first ? '' : ' Carinho nunca é demais.'}` : `${p.name} abana o rabo e lambe a sua mão.${first ? '' : ' Carinho nunca é demais.'}`));
}
/* Na manhã do dia 12 da primavera (ou na primeira manhã depois), Bia oferece o bicho favorito.
   Acontece uma vez; se for adiado, ela volta na manhã seguinte. */
function petEvent() {
  const p = S.pet;
  if (!p || !p.sp || p.state === 'home' || S.day < PET_DAY || p.offered === S.day) return false;
  p.offered = S.day; save();
  const bia = villagerById('bia'), who = speaker(bia), cat = p.sp === 'gato';
  run(async () => {
    await say('narr', 'Alguém bate à porta logo cedo. É Bia, com uma cestinha forrada nos braços.');
    if (p.state === 'deferred') await say(who, `Bom dia, {nome}! Voltei, como prometi. ${cat ? 'O gatinho' : 'O filhote'} ainda está esperando uma casa...`);
    else {
      await say(who, `Bom dia, {nome}! Desculpa a hora. Você comentou que adora ${cat ? 'gatos' : 'cachorros'}, não foi?`);
      await say(who, cat ? 'A gata da Dona Celeste teve gatinhos, e sobrou um sem casa. Eu pensei logo em você!' : 'A cadela do Seu Honório teve filhotes, e sobrou um sem casa. Eu pensei logo em você!');
    }
    const c = await choose([cat ? 'Quero! Vou cuidar bem dele' : 'Quero! Vou cuidar bem dele', 'Agora não dá. Outro dia?']);
    if (c === 1) { p.state = 'deferred'; await say(who, 'Tudo bem! Ele fica comigo mais um pouco. Amanhã cedo eu passo aqui de novo.'); return; }
    const name = await askText(who, `Que nome você vai dar ${cat ? 'ao gatinho' : 'ao filhote'}?`, PETS[p.sp].names[S.day % 4]);
    p.name = name; p.state = 'home'; p.day = S.day; spawnPet();
    await say(who, `${name}! Combina demais. Vai ficar pela fazenda, perto da varanda. Faz carinho todo dia, tá?`);
    toast(`${name} agora mora em ${S.farmName}`);
  });
  return true;
}

/* =====================================================
   COLETÁVEIS SAZONAIS DA VILA
   ===================================================== */
/* Gera os coletáveis de uma noite (ou a geração inicial). Só roda uma vez por dia:
   entrar na vila, abrir menus ou recarregar a página não geram nada. */
function spawnSeasonal(rnd = Math.random) {
  if (S.spawnDay === S.day) return 0;
  S.spawnDay = S.day;
  const si = calendar().si, rule = SEASONAL_FORAGE[si];
  S.seasonal = S.seasonal.filter(o => o.s === si);                // mudou a estação: o que ficou no chão some
  const n = rule.count(rnd());
  const pts = World.get('fora').spawns.filter(([x, y]) => !S.seasonal.some(o => Math.abs(o.x - x) < 14 && Math.abs(o.y - y) < 14));
  let made = 0;
  for (let i = 0; i < n; i++) {
    if (S.seasonal.length >= SEASONAL_MAX || !pts.length) break;  // excedente da noite é descartado
    const [x, y] = pts.splice(Math.floor(rnd() * pts.length), 1)[0];
    let r = rnd() * rule.items.reduce((a, it) => a + it[1], 0), id = rule.items[0][0];
    for (const [it, w] of rule.items) { if (r < w) { id = it; break; } r -= w; }
    S.seasonal.push({ id, x, y, s: si }); made++;
  }
  return made;
}
/* Colhe: o objeto só sai do chão depois que o item entra na mochila. */
function collectSeasonal(o) {
  const name = ITEMS[o.id].name;
  if (!canAdd(o.id)) return tip(`Mochila cheia: ${name.toLowerCase()} continua aqui no chão.`);
  if (!gain(o.id)) return;
  S.seasonal = S.seasonal.filter(q => q !== o); addXp('coleta', SKILL_GAIN.forage, o.x, o.y - 16); bang(o.x, o.y - 6, 'leaf'); save();
}

/* =====================================================
   DIA: DORMIR
   ===================================================== */
function bed() {
  run(async () => {
    await say('narr', S.time >= 1140 ? 'A cama está feita e a noite caiu.' : 'Ainda é dia, mas a cama está sempre pronta.');
    if (await choose(['Dormir até amanhã', 'Ainda não'], 1) === 0) setTimeout(sleep, 0);
  });
}
/* Processa a noite uma única vez por dia (dormindo ou desmaiando às 2h): é o único
   lugar onde plantas, árvores, galinhas e coletáveis da vila avançam. */
function processNight() {
  if (S.lastNight === S.day) return null;                   // esta noite já foi processada
  S.lastNight = S.day;
  const notes = [], skillUps = confirmSkills();              // níveis novos confirmados uma vez só, também ao desmaiar
  let grew = 0, ripe = 0, fruits = 0, eggs = 0, hungry = 0;
  for (const key in S.farm.tiles) {
    const o = S.farm.tiles[key];
    if (o.k === 'soil') { if (o.crop && !o.dead && o.w && !cropState(o).ripe && cropInSeason(o.crop, calendar().si)) { o.g = (o.g || 0) + 1; grew++; if (cropState(o).ripe) ripe++; } o.w = 0; }   // sem rega ou fora de estação, não cresce; maduro espera a colheita
    if (o.k === 'tree') { const T = TREES[o.sp]; o.age++; if (o.age >= T.grow && !o.fruit) { o.cool = (o.cool || 0) + 1; if (o.cool >= T.every) { o.fruit = true; o.cool = 0; fruits++; } } }
  }
  S.coop.hens.forEach(h => { if (S.coop.feed > 0) { S.coop.feed--; h.well = Math.min(100, h.well + 6); if (S.coop.eggs < S.coop.hens.length * 3) { S.coop.eggs++; eggs++; } } else { h.well = Math.max(0, h.well - 12); hungry++; } });
  iaraFinishPainting(S.day);                                      // pintura do dia 10, mesmo sem o jogador por perto
  const finished = S.day;
  S.day++; S.time = DAY_START; S.energy = 100; S.daily = { talk: {}, gift: {} };
  Object.keys(S.nature.trees).forEach(k => { if (S.day >= S.nature.trees[k]) { delete S.nature.trees[k]; delete S.nature.cleared[k]; delete S.dmg['s' + k]; } });
  Object.keys(S.nature.rocks).forEach(k => { if (S.day >= S.nature.rocks[k]) delete S.nature.rocks[k]; });
  refreshForage(S);
  S.weather = rollWeather();                                       // clima do novo dia
  const newSeason = calendar().si !== calendar(finished).si;
  let dried = 0;                                                       // troca de estação: plantas já germinadas secam se não crescem na estação nova (frutos não colhidos se perdem)
  if (newSeason) for (const key in S.farm.tiles) {                     // a que cresce nas duas estações (milho: verão e outono) continua; semente que não germinou espera
    const o = S.farm.tiles[key]; if (o.k !== 'soil' || !o.crop || o.dead || !CROPS[o.crop].seasonal || cropInSeason(o.crop) || dormantSeed(o)) continue;
    o.dead = true; o.w = 0; dried++;
  }
  const spawned = spawnSeasonal();
  const rained = rainWater();
  World.setSeason(calendar().si);
  const b = World.get('casa').objs.find(o => o.kind === 'bed');
  enterMap('casa', b.x + 20, b.y + 10, 'down');
  save();

  if (dried) notes.push(`${dried} pé(s) de morango ou abóbora secaram com a troca de estação. Use a foice para limpar e plante de novo se a estação permitir.`);
  if (grew) notes.push(`${grew} planta(s) regada(s) cresceram${ripe ? `, e ${ripe} está(ão) pronta(s) para colher` : ''}.`);
  if (fruits) notes.push(`${fruits} árvore(s) amanheceram com frutos.`);
  if (eggs) notes.push(`As galinhas botaram ${eggs} ovo(s). Estão no ninho.`);
  if (hungry) notes.push(`${hungry} galinha(s) ficaram sem ração e não botaram.`);
  if (newSeason) notes.push(`Chegou ${calendar().season === 'Verão' ? 'o' : 'a'} ${calendar().season}! A paisagem mudou${spawned ? ' e há coisas novas para colher na vila' : ''}.`);
  else if (spawned) notes.push(`${spawned} coisa(s) nova(s) para colher apareceram pela vila.`);
  if (isRaining()) notes.push(`Amanheceu chovendo! ${rained ? 'A chuva já regou os canteiros: hoje não precisa usar o regador.' : 'Os canteiros que você arar hoje ficam regados pela chuva.'}`);
  if (!notes.length) notes.push('Uma noite tranquila no sítio.');
  renderTabsBadge();
  return { notes, finished, skillUps };
}
function sleep() {
  const r = processNight(); if (!r) return;
  const { notes, finished, skillUps } = r;
  const box = $('summary-body'); box.replaceChildren(el('h3', '', `${dateText(finished)} — dia encerrado`));
  const ul = el('ul', 'list'); notes.forEach(n => ul.append(el('li', '', n))); box.append(ul);
  if (skillUps && skillUps.length) {                         // todos os avanços da noite numa apresentação só
    const sb = el('div', 'skill-ups'); sb.append(el('h3', '', skillUps.length > 1 ? 'Habilidades que subiram' : 'Habilidade que subiu'));
    skillUps.forEach(u => { const li = el('div', 'skill-up'); li.dataset.skill = u.k; const ic = el('canvas', 'pixel'); ic.width = 16; ic.height = 16; ic.getContext('2d').drawImage(World.icon(SKILL_ICON[u.k]), 0, 0);
      li.append(ic, el('b', '', `${SKILLS[u.k].name}: nível ${u.to}${u.to - u.from > 1 ? ` (+${u.to - u.from})` : ''}`), el('span', '', SKILLS[u.k].perk(u.to))); sb.append(li); });
    box.append(sb);
  }
  box.append(el('p', 'dim', 'Você acorda com a energia completa.'));
  const go = btn('btn primary', `Começar o dia ▶`, () => { $('summary').hidden = true; renderHud(); toast(dateText()); VILLAGERS.forEach(v => { if (isBirthday(v) && (!v.hidden || S.lucio.met)) toast(`Hoje é aniversário de ${v.name}!`); }); petEvent(); }); go.id = 'summary-go';
  box.append(go); $('summary').hidden = false; go.focus(); renderHud(); renderHotbar();
}

/* =====================================================
   HUD E BARRA DE ITENS
   ===================================================== */
function renderHud() {
  if (!S) return;
  const hud = $('hud'); hud.replaceChildren();
  const c = calendar(), en = el('div', 'xp'), bar = el('div', 'bar' + (S.energy < 20 ? ' low' : '')), fill = el('i'); fill.style.width = S.energy + '%'; bar.append(fill);
  en.append(el('span', '', '⚡'), bar);
  const top = el('div', 'cp-row'), sky = el('canvas', 'pixel cp-sky'); sky.width = 30; sky.height = 16; drawSky(sky.getContext('2d'), S.time);
  top.append(sky, el('b', 'cp-date', `${WEEKDAYS_SHORT[c.wd]}, ${c.day}`), el('span', 'cp-time', clock()));
  const mid = el('div', 'cp-row'); mid.append(el('span', 'cp-season s' + c.si, `${c.season} · Ano ${c.year}`), el('span', 'cp-coins', `🪙 ${S.coins}`));
  const lk = luckKind(), luck = el('span', 'cp-luck ' + lk), ic = el('canvas', 'pixel'); ic.width = 9; ic.height = 9; drawClover(ic.getContext('2d'), lk);
  luck.append(ic, el('span', '', { sorte: 'Sorte', neutro: 'Neutro', ma: 'Má sorte' }[lk]));
  luck.dataset.tip = `${LUCK.name[lk]}. ${luckEffect(lk)}`; luck.setAttribute('aria-label', luck.dataset.tip);
  en.append(luck);
  hud.append(top, mid, en); renderTabsBadge();
  hud.title = `${c.weekday}, ${c.day} de ${c.season}, ano ${c.year} — ${clock()}${isRaining() ? ' — chovendo' : ''}`;
  sky.title = isRaining() ? 'Chovendo: os canteiros estão regados' : ''; sky.setAttribute('aria-label', isRaining() ? 'Chovendo' : 'Tempo firme');
  const o = objective();
  $('objective').replaceChildren(...(o ? [el('b', '', 'MISSÃO'), el('span', '', o)] : S.time >= 1260 ? [el('span', '', 'Já é tarde. A cama espera por você em casa.')] : []));
}
/* Trevo do indicador de sorte: quatro folhas verdes (sorte), três folhas (neutro), murcho (má sorte). */
function drawClover(g, kind) {
  const P = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const c = { sorte: ['#3fa040', '#9ae070'], neutro: ['#7a9a6a', '#b8ccaa'], ma: ['#7a6a4a', '#a8946a'] }[kind];
  const leaves = kind === 'sorte' ? [[1, 1], [5, 1], [1, 4], [5, 4]] : kind === 'neutro' ? [[1, 1], [5, 1], [3, 4]] : [[0, 3], [5, 4]];
  leaves.forEach(([x, y]) => { P(x, y, 3, 3, '#1a1210'); P(x, y, 2, 2, c[0]); P(x, y, 1, 1, c[1]); });
  P(4, kind === 'ma' ? 5 : 4, 1, 5, kind === 'ma' ? '#6a5a3a' : '#2f7028');
}
/* Indicador de dia/noite: o sol (ou a lua) percorre um arco no céu do painel. */
function drawSky(g, m) {
  const L = lightAt(m, false), night = L.glow;
  const day = [126, 200, 240], dusk = [240, 150, 100], dark = [30, 34, 80];
  const k = m < 480 ? Math.max(0, (480 - m) / 120) : m > 1050 ? Math.min(1, (m - 1050) / 210) : 0;
  const c = k < 0.5 ? day.map((v, i) => v + (dusk[i] - v) * k * 2) : dusk.map((v, i) => v + (dark[i] - v) * (k - 0.5) * 2);
  g.fillStyle = `rgb(${c.map(Math.round).join(',')})`; g.fillRect(0, 0, 30, 16);
  g.fillStyle = night > 0.5 ? '#2a3a2a' : '#4a8a3a'; g.fillRect(0, 13, 30, 3);
  const sun = m < 1170, f = sun ? (m - 360) / 810 : (m - 1170) / 390, x = Math.round(3 + f * 24), y = Math.round(12 - Math.sin(Math.max(0, Math.min(1, f)) * Math.PI) * 9);
  if (isRaining()) {                                                  // chuva: céu cinza, nuvem e gotas no lugar do sol
    g.fillStyle = night > 0.5 ? '#2a2e44' : '#6a7486'; g.fillRect(0, 0, 30, 13);
    g.fillStyle = night > 0.5 ? '#4a4e66' : '#c4cad4'; g.fillRect(7, 3, 14, 4); g.fillRect(10, 1, 7, 2); g.fillRect(5, 5, 3, 2);
    g.fillStyle = night > 0.5 ? '#3a3e56' : '#9aa2b0'; g.fillRect(7, 6, 14, 1);
    g.fillStyle = '#8ac0f0'; [[8, 9], [12, 10], [16, 8], [20, 10], [10, 12], [18, 12]].forEach(([dx, dy]) => g.fillRect(dx, dy, 1, 2));
    return;
  }
  if (sun) { g.fillStyle = '#ffd75e'; g.fillRect(x - 2, y - 2, 4, 4); g.fillStyle = '#fff4b0'; g.fillRect(x - 1, y - 1, 2, 2); }
  else { g.fillStyle = '#f0f0ff'; g.fillRect(x - 2, y - 2, 4, 4); g.fillStyle = `rgb(${c.map(Math.round).join(',')})`; g.fillRect(x, y - 2, 2, 2); g.fillStyle = '#ffffff'; g.fillRect(6, 3, 1, 1); g.fillRect(21, 5, 1, 1); g.fillRect(14, 2, 1, 1); }
}
function slotNode(s, cls) {
  const b = el('button', 'slot ' + (cls || '')); b.type = 'button';
  if (s) { const nm = ITEMS[s.id].name + (s.cm ? ` (${s.cm} cm)` : ''); b.append(cloneIcon(s.id)); b.title = nm; b.setAttribute('aria-label', nm); if (s.id === 'regador') b.append(el('i', '', `${S.can}`)); else if (s.id === 'vara_fibra' && S.fish.bait) { const bi = el('i', 'bait', `${S.fish.bait}`); bi.title = 'Minhocas carregadas'; b.append(bi); } else if (s.n > 1) b.append(el('i', '', String(s.n))); }
  return b;
}
function cloneIcon(id) { const c = el('canvas', 'pixel'); c.width = 16; c.height = 16; c.getContext('2d').drawImage(World.icon(id), 0, 0); return c; }
function renderHotbar() {
  if (!S) return;
  const bar = $('hotbar'); bar.replaceChildren();
  const base = S.row * HOTBAR;
  for (let i = 0; i < HOTBAR; i++) { const b = slotNode(S.inv[base + i], base + i === S.sel ? 'sel' : ''); b.dataset.slot = i; b.append(el('u', '', String((i + 1) % 10))); b.onclick = () => hotbarClick(i); bar.append(b); }
  const it = equipped(); $('equipped').textContent = it ? ITEMS[it.id].name : 'Mãos livres';
  let hr = $('hotrow'); if (!hr) { hr = el('div', 'hotrow'); hr.id = 'hotrow'; bar.parentNode.append(hr); }
  hr.replaceChildren(el('span', '', 'Linha'));
  for (let r = 0; r < 3; r++) {                      // as outras linhas da mochila ficam a um clique (sem atalho de teclado)
    const b = btn('rowbtn' + (r === S.row ? ' on' : ''), String(r + 1), () => showRow(r)); b.dataset.row = r;
    b.title = `Mostrar a linha ${r + 1} da mochila na barra`; b.setAttribute('aria-pressed', r === S.row); hr.append(b);
  }
}

/* =====================================================
   PAINÉIS
   ===================================================== */
let shopLock = { key: '', until: 0 }, tab = 'mochila', picked = null, friendSel = null, menuClosedT = 0, fiberArm = false;
let modalT = 0;
const MENU_TABS = ['mochila', 'amizades', 'mapa', 'diario', 'habilidades', 'personagem', 'config'];
const TAB_TITLE = { mochila: 'Inventário', amizades: 'Amizades', mapa: 'Mapa', diario: 'Diário', habilidades: 'Habilidades', personagem: 'Personagem', config: 'Configurações', bau: 'Baú', roupa: 'Guarda-roupa e espelho', loja: 'Armazém', ajuste: 'Sua fazenda' };
function openModal(t) { if (busy) return; $('modal').hidden = false; modalT = performance.now(); picked = null; renderTab(t); }
/* Menu principal: só abre com o jogo livre (sem conversa, carta, resumo ou pausa). */
function openMenu(t = 'mochila') { if (screen !== 'game' || !S || busy || paused || !$('letter').hidden || !$('summary').hidden) return; if (fishing) return tip('Termine a pesca ou recolha a linha (Esc) antes de abrir o menu.'); openModal(t); }
/* Atalho de aba: abre nela; se já está nela, fecha; se está em outra, troca. */
function toggleTab(t) {
  if ($('modal').hidden) return openMenu(t);
  if (tab === 'ajuste') return;
  if (tab === t) closeModal(); else { picked = null; renderTab(t); }
}
$('seed-info-ok').onclick = () => closeSeedInfo();
$('seed-info').onclick = e => { if (e.target === $('seed-info')) closeSeedInfo(); };
function closeModal() {
  closeSeedInfo();
  if (!$('modal').hidden && tab === 'ajuste' && S && needsSetup()) return;      // o ajuste precisa ser respondido
  $('modal').hidden = true; if (S) { renderHotbar(); renderHud(); }
}
// botões da tela (mouse e toque) e abas da janela
document.querySelectorAll('#actions [data-tab]').forEach(b => { b.onclick = () => toggleTab(b.dataset.tab); });
document.querySelectorAll('#tabs [data-tab]').forEach(b => { b.onclick = () => { picked = null; renderTab(b.dataset.tab); }; });
// fechar pelo mouse/toque: o mesmo toque não pode cair no cenário
$('modal-close').onclick = () => { menuClosedT = performance.now(); closeModal(); };
$('modal').addEventListener('click', e => { if (e.target === $('modal') && performance.now() - modalT > 400) { menuClosedT = performance.now(); closeModal(); } });
$('modal').addEventListener('pointerdown', e => e.stopPropagation());
const closeBtn = () => { const b = btn('btn primary', 'Fechar', closeModal); b.style.marginTop = '12px'; return b; };
const heartsNode = (n, max = 5) => { const s = el('span', 'hearts'); for (let i = 0; i < max; i++) s.append(el('i', i < n ? 'on' : '', '♥')); return s; };
/* Ícones das abas, desenhados em pixel art (16x16). */
const TAB_ICON = {
  habilidades: g => { g.fillStyle = '#5a3a14'; [[7, 1, 2, 2], [6, 3, 4, 2], [1, 5, 14, 2], [3, 7, 10, 2], [4, 9, 8, 2], [3, 11, 4, 2], [9, 11, 4, 2], [2, 13, 3, 2], [11, 13, 3, 2]].forEach(r => g.fillRect(...r)); g.fillStyle = '#ffd75e'; [[7, 2, 2, 2], [7, 4, 2, 2], [2, 6, 12, 1], [4, 7, 8, 2], [5, 9, 6, 2], [4, 11, 2, 2], [10, 11, 2, 2], [3, 13, 1, 1], [12, 13, 1, 1]].forEach(r => g.fillRect(...r)); g.fillStyle = '#fff6c0'; g.fillRect(7, 5, 1, 3); },
  mochila: g => { g.fillStyle = '#5a2e14'; g.fillRect(3, 3, 10, 12); g.fillStyle = '#c8483a'; g.fillRect(4, 5, 8, 9); g.fillStyle = '#e8705a'; g.fillRect(4, 5, 8, 2); g.fillStyle = '#5a2e14'; g.fillRect(5, 1, 6, 3); g.fillStyle = '#ffd75e'; g.fillRect(7, 9, 2, 2); },
  amizades: g => { g.fillStyle = '#5a1a1a'; [[3, 4, 4, 2], [9, 4, 4, 2], [2, 6, 12, 3], [3, 9, 10, 2], [5, 11, 6, 2], [7, 13, 2, 1]].forEach(r => g.fillRect(...r)); g.fillStyle = '#e04a5a'; [[4, 5, 3, 1], [9, 5, 3, 1], [3, 6, 10, 3], [4, 9, 8, 1], [6, 11, 4, 1], [7, 12, 2, 1]].forEach(r => g.fillRect(...r)); g.fillStyle = '#ffb0b8'; g.fillRect(4, 6, 2, 1); },
  mapa: g => { g.fillStyle = '#5a3a1a'; g.fillRect(1, 3, 14, 11); g.fillStyle = '#e8d8a8'; g.fillRect(2, 4, 12, 9); g.fillStyle = '#58a83c'; g.fillRect(2, 4, 5, 9); g.fillStyle = '#3f86d8'; g.fillRect(10, 8, 4, 5); g.fillStyle = '#c8483a'; g.fillRect(7, 6, 2, 2); g.fillStyle = '#b4945a'; g.fillRect(2, 9, 12, 1); },
  diario: g => { g.fillStyle = '#3a1a10'; g.fillRect(2, 2, 12, 13); g.fillStyle = '#7a3a2a'; g.fillRect(3, 3, 10, 11); g.fillStyle = '#f4e8c8'; g.fillRect(5, 4, 7, 9); g.fillStyle = '#8a6a4a'; g.fillRect(6, 6, 5, 1); g.fillRect(6, 8, 5, 1); g.fillRect(6, 10, 3, 1); g.fillStyle = '#ffd75e'; g.fillRect(3, 6, 1, 3); },
  personagem: g => { g.fillStyle = '#3a2214'; g.fillRect(4, 1, 8, 9); g.fillStyle = '#f0b888'; g.fillRect(5, 3, 6, 6); g.fillStyle = '#5a3a24'; g.fillRect(4, 1, 8, 3); g.fillStyle = '#2a1a14'; g.fillRect(6, 5, 1, 1); g.fillRect(9, 5, 1, 1); g.fillStyle = '#3f86d0'; g.fillRect(3, 10, 10, 5); g.fillStyle = '#2a5a9a'; g.fillRect(3, 14, 10, 1); },
  config: g => { g.fillStyle = '#3a3a44'; g.fillRect(6, 1, 4, 14); g.fillRect(1, 6, 14, 4); g.fillRect(3, 3, 10, 10); g.fillStyle = '#9a9aa8'; g.fillRect(7, 2, 2, 12); g.fillRect(2, 7, 12, 2); g.fillRect(4, 4, 8, 8); g.fillStyle = '#3a3a44'; g.fillRect(6, 6, 4, 4); g.fillStyle = '#e8d8a8'; g.fillRect(7, 7, 2, 2); },
};
document.querySelectorAll('#tabs [data-tab]').forEach(b => { const c = el('canvas', 'pixel'); c.width = 16; c.height = 16; TAB_ICON[b.dataset.tab](c.getContext('2d')); b.append(c); });

function grid(arr, onClick, selIdx) {
  const g = el('div', 'slots');
  arr.forEach((s, i) => { const b = slotNode(s, i === selIdx ? 'sel' : ''); b.dataset.i = i; b.onclick = () => onClick(i); g.append(b); });
  return g;
}
/* Move a pilha inteira de um conjunto para o outro, empilhando; o que não couber fica onde estava. */
function moveStack(from, i, to) {
  const s = from[i]; if (!s) return;
  if (s.cm) {                                       // peixe: vai inteiro, com o tamanho, para um espaço vazio
    const j = to.findIndex(x => !x); if (j < 0) return toast(to === S.inv ? 'Mochila cheia' : 'Baú cheio');
    to[j] = s; from[i] = null; if (S.sel >= 0 && !S.inv[S.sel]) renderHotbar(); save(); return;
  }
  const left = addTo(to, s.id, s.n);
  if (left === s.n) return toast(to === S.inv ? 'Mochila cheia' : 'Baú cheio');
  if (left) { s.n = left; toast('Só coube uma parte'); } else from[i] = null;
  if (S.sel >= 0 && !S.inv[S.sel]) renderHotbar();
  save();
}

const TABS = {
  mochila(body) {
    // grade de 3 linhas; a linha da barra de ferramentas fica marcada
    const wrap = el('div', 'inv-grid');
    let info;
    const describe = i => {
      const s2 = S.inv[i]; info.replaceChildren();
      if (!s2) { info.append(el('span', 'dim', picked !== null ? 'Clique num espaço para colocar o item ali.' : 'Clique num item para ver, mover ou usar na barra.')); return; }
      const it = ITEMS[s2.id];
      info.append(el('b', '', `${it.name}${s2.n > 1 ? ' × ' + s2.n : ''}${s2.cm ? ` · ${s2.cm} cm` : ''}`), el('span', 'dim', it.desc + (isFood(s2.id) ? ' Para comer: escolha na barra e clique numa área livre do cenário.' : '') + (it.sell ? ` Vende por ${it.sell} moedas.` : '') + (s2.cm ? ` Tamanho: ${s2.cm} cm. Vende por ${fishValue(s2.id, s2.cm)} moedas no Armazém.` : '')));
      if (i === picked) {
        const use = btn('btn', i === S.sel ? 'Na mão ✔' : 'Usar na barra', () => { S.row = Math.floor(i / HOTBAR); S.sel = i; picked = null; save(); renderTab('mochila'); }); use.dataset.use = i; info.append(use);
        if (s2.id === 'vara_fibra') {
          info.append(el('span', 'bait-info', `Isca carregada: ${S.fish.bait} minhoca(s) · na mochila: ${count('minhoca')}`));
          const lb = btn('btn', `Carregar minhocas (${count('minhoca')})`, () => { loadBait(); renderTab('mochila'); }); lb.id = 'btn-load-bait'; lb.disabled = !count('minhoca'); info.append(lb);
          if (S.fish.bait) { const ub = btn('btn', 'Tirar a isca', () => { unloadBait(); renderTab('mochila'); }); ub.id = 'btn-unload-bait'; info.append(ub); }
        }
        if (s2.id === 'minhoca') info.append(el('span', 'dim', ownsFiber() ? 'Escolha a vara de fibra de vidro e use "Carregar minhocas".' : 'Só a vara de fibra de vidro aceita isca.'));
        if (it.kind === 'refugo' || s2.id === 'alga') {             // resultados da pesca: dá para jogar fora (com confirmação)
          const nm = `${it.name}${s2.n > 1 ? ' × ' + s2.n : ''}`;
          const db = btn('btn danger', discardArm ? `Confirmar: jogar fora ${nm}` : `Jogar fora ${nm}`, () => {
            if (!discardArm) { discardArm = true; return describe(i); }
            discardArm = false; if (S.inv[i] !== s2) return; S.inv[i] = null; picked = null; save(); renderHotbar(); toast(`Você jogou fora ${nm}.`); renderTab('mochila');
          });
          db.id = 'btn-discard'; info.append(db);
        }
        if (it.kind === 'decor') {
          const hb = btn('btn', S.house.quadro ? 'Já tem um quadro na parede de casa' : 'Pendurar na parede de casa', () => { if (S.house.quadro || !count('quadro_fonte')) return; removeItem('quadro_fonte', 1); S.house.quadro = { si: S.iara.copySi != null ? S.iara.copySi : 0 }; toast('Quadro pendurado na parede de casa'); save(); renderTab('mochila'); });
          hb.id = 'btn-hang'; hb.disabled = !!S.house.quadro; info.append(hb);
        }
        if (it.kind === 'hat') info.append(btn('btn', S.look.hat === it.hat ? 'Tirar o chapéu' : 'Usar o chapéu', () => { S.look.hat = S.look.hat === it.hat ? null : it.hat; save(); renderTab('mochila'); }));
      }
    };
    for (let r = 0; r < 3; r++) {
      const line = el('div', 'inv-row' + (r === S.row ? ' row-on' : '')), mark = el('span', 'row-mark', r === S.row ? '▶' : String(r + 1));
      mark.title = r === S.row ? 'Linha usada na barra de ferramentas' : `Linha ${r + 1}`; line.append(mark);
      for (let c = 0; c < HOTBAR; c++) {
        const i = r * HOTBAR + c, b2 = slotNode(S.inv[i], [i === picked ? 'sel' : '', i === S.sel ? 'equip' : ''].join(' ')); b2.dataset.i = i;
        b2.onmouseenter = () => describe(i); b2.onfocus = () => describe(i);
        b2.onclick = () => {
          discardArm = false;
          if (picked === null) { if (S.inv[i]) picked = i; }
          else if (picked === i) picked = null;
          else { [S.inv[picked], S.inv[i]] = [S.inv[i], S.inv[picked]]; if (S.sel === picked) S.sel = i; else if (S.sel === i) S.sel = picked; S.row = Math.floor(S.sel / HOTBAR); picked = null; save(); }
          renderTab('mochila');
        };
        line.append(b2);
      }
      wrap.append(line);
    }
    body.append(wrap);
    info = el('div', 'item-info'); body.append(info); describe(picked !== null ? picked : S.sel);
    // personagem, fazenda, moedas e equipamentos
    const foot = el('div', 'inv-foot'), pv = el('div', 'inv-pv'); pv.append(Sprites.canvas(S.look, 'down'));
    const who = el('div', 'inv-who'); who.append(el('b', '', S.name), el('span', '', S.farmName), el('span', 'coins', `🪙 ${S.coins} moedas`), el('span', 'dim', `Energia ${Math.round(S.energy)}/100 · Água no regador ${S.can}/10`));
    const eq = el('div', 'equip-slots');
    const eqSlot = (lbl, id, txt) => { const d = el('div', 'eq'); const sl = el('div', 'slot'); if (id) sl.append(cloneIcon(id)); d.append(sl, el('span', '', `${lbl}: ${txt}`)); return d; };
    const hatItem = S.look.hat && Object.keys(ITEMS).find(k => ITEMS[k].hat === S.look.hat), acc = Sprites.ACCESSORIES.find(a => a.id === S.look.accessory), hand = equipped();
    eq.append(eqSlot('Chapéu', hatItem, hatItem ? ITEMS[hatItem].name : 'nenhum'), eqSlot('Acessório', null, acc ? acc.name : 'nenhum'), eqSlot('Na mão', hand && hand.id, hand ? ITEMS[hand.id].name : 'nada'));
    foot.append(pv, who, eq); body.append(foot);
  },
  bau(body) {
    body.append(el('h3', '', 'Baú'), el('p', 'dim', 'Toque em um item para passar a pilha inteira para o outro lado.'));
    body.append(el('p', '', 'No baú'), grid(S.chest, i => { moveStack(S.chest, i, S.inv); renderTab('bau'); }));
    body.append(el('p', '', 'Na mochila'), grid(S.inv, i => { moveStack(S.inv, i, S.chest); renderTab('bau'); }));
  },
  diario(body) {
    const c = calendar();
    body.append(el('p', 'dim', `Hoje: ${c.weekday}, ${c.day} de ${c.season}, ano ${c.year}. ${S.farmName}, ${VILA}.`));
    const bdays = VILLAGERS.filter(v => v.birthday && (!v.hidden || S.lucio.met));
    if (bdays.length) body.append(el('p', 'dim', 'Aniversários: ' + bdays.map(v => `${v.name}, ${v.birthday.day} do ${SEASONS[v.birthday.season]}${isBirthday(v) ? ' (hoje!)' : ''}`).join(' · ')));
    body.append(el('h3', '', 'Missões em andamento'));
    const act = qActive(), ul = el('ul', 'list');
    if (!act.length) ul.append(el('li', 'dim', 'Nenhuma missão no momento. Converse com os moradores: quem tem um pedido aparece com um "!".'));
    act.forEach(id => {
      const q = QUESTS[id], li = el('li' + '', id === tracked() ? 'tracked' : ''); li.dataset.quest = id;
      li.append(el('span', 'mt', (id === tracked() ? '★ ' : '') + q.title), el('span', 'dim', `Pedido de: ${villagerById(q.giver).name}${q.to ? ' · Entregar a: ' + villagerById(q.to).name : ''}`), el('span', '', q.desc));
      const pr = qProgress(id); if (pr) li.append(el('span', 'ok', 'Progresso: ' + pr));
      li.append(el('span', 'dim', 'Recompensa: ' + rewardText(q.reward)));
      const tg = questTarget(id); if (tg) li.append(el('span', '', `Destino agora: ${tg.label}`));
      const row = el('div', 'li-actions');
      const tr = btn('btn', id === tracked() ? 'Acompanhando ✔' : 'Acompanhar', () => { S.track = id; save(); renderTab('diario'); renderHud(); }); tr.dataset.trackBtn = id;
      const show = btn('btn', 'Ver no mapa', () => { S.track = id; renderTab('mapa'); }); show.dataset.track = id;
      row.append(tr, show); li.append(row); ul.append(li);
    });
    body.append(ul);
    const done = Object.keys(QUESTS).filter(qDone);
    body.append(el('h3', '', 'Concluídas'));
    const dl = el('ul', 'list'); if (!done.length) dl.append(el('li', 'dim', 'Nenhuma ainda.')); done.forEach(id => dl.append(el('li', 'done-task', `✔ ${QUESTS[id].title} (dia ${S.quests[id].day})`))); body.append(dl);
    body.append(el('h3', '', 'Cartas'));
    const cl = el('ul', 'list letters'), li = el('li');
    li.append(el('span', 'mt', '✉ Carta do Vô ' + AVO), el('span', 'dim', 'Recebida antes de chegar a ' + VILA + '.'));
    const lt = btn('btn', 'Ler a carta', () => showLetter(true)); lt.id = 'btn-letter'; li.append(lt); cl.append(li);
    if (S.fish.letter) {
      const l2 = el('li'); l2.append(el('span', 'mt', '✉ Carta de Tomé'), el('span', 'dim', S.fish.pending ? 'Veio com uma vara de pesca, que está guardada esperando espaço na mochila.' : 'Veio com uma vara de pesca e explica como pescar.'));
      const row = el('div', 'li-actions'), rd = btn('btn', 'Ler a carta', () => showLetter(true, ROD_LETTER)); rd.id = 'btn-letter-tome'; row.append(rd);
      if (S.fish.pending) { const gr = btn('btn primary', 'Pegar a vara de bambu', async () => { if (!canAdd('vara')) return toast('Mochila cheia: abra um espaço primeiro.'); await giveRod(false); renderTab('diario'); }); gr.id = 'btn-get-rod'; row.append(gr); }
      l2.append(row); cl.append(l2);
    }
    body.append(cl);
    body.append(el('h3', '', 'Pescaria'));
    const fl = el('ul', 'list fish-dex');
    if (!S.fish.rod && !S.fish.pending) fl.append(el('li', 'dim', 'Você ainda não tem vara de pesca.'));
    else {
      fl.append(el('li', '', `Pesca nível ${fishLevel()} (aba Habilidades) · capturas perfeitas: ${S.fish.perfect || 0}`));
      Object.keys(FISH).forEach(id => {
        const d = S.fish.dex[id], li2 = el('li', 'fish-entry' + (d ? '' : ' dim')); li2.dataset.fish = id;
        const head = el('div', 'shop-item'); if (d) head.append(cloneIcon(id)); head.append(el('b', '', d ? ITEMS[id].name : '???'));
        li2.append(head, el('span', '', d ? `Capturados: ${d.n} · maior: ${d.max} cm` : 'Ainda não pescado.'));
        if (d) li2.append(el('span', 'dim', `${ITEMS[id].desc} Onde: ${Object.keys(FISH[id].zones).map(z => FISH_ZONE_NAME[z]).join(' e ')}.`));
        fl.append(li2);
      });
    }
    body.append(fl);
  },
  amizades(body) {
    body.append(el('p', 'dim', `A primeira conversa do dia e os presentes aumentam a amizade (100 pontos por coração, até 5${S.caleb && S.caleb.arrived ? '; com o Caleb, até 8' : ''}). Cada morador tem seus gostos.`));
    const known = VILLAGERS.filter(v => (!v.hidden || (v.id === 'lucio' && S.lucio.met)) && !(v.arrives && !(S.caleb && S.caleb.arrived)));
    if (!friendSel || !known.some(v => v.id === friendSel)) friendSel = known[0].id;
    const box = el('div', 'friends'), list = el('ul', 'friend-list'), det = el('div', 'friend-detail');
    known.forEach(v => {
      const li = el('li', 'friend' + (v.id === friendSel ? ' sel' : '')); li.dataset.id = v.id; li.tabIndex = 0;
      const pic = v.portrait ? Sprites.portrait(v.portrait, hearts(v.id) >= 3 ? 'contente' : 'neutro') : Sprites.canvas(v.look);
      if (v.portrait) pic.classList.add('portrait-pic');
      const pts = S.friends[v.id] || 0, h = hearts(v.id), mh = maxHearts(v.id), frac = h >= mh ? 1 : (pts % 100) / 100;
      const txt = el('div', 'fl-txt'), bar = el('div', 'fbar'), fill = el('i'); fill.style.width = Math.round(frac * 100) + '%'; bar.append(fill);
      bar.title = h >= mh ? 'Amizade máxima' : `${pts % 100}/100 pontos para o próximo coração`;
      txt.append(el('b', '', v.name), heartsNode(h, mh), bar);
      li.append(pic, txt);
      li.onclick = () => { friendSel = v.id; renderTab('amizades'); };
      li.onkeydown = e => { if (e.key === 'Enter') li.onclick(); };
      list.append(li);
    });
    if (VILLAGERS.some(v => v.hidden && !(v.id === 'lucio' && S.lucio.met))) list.append(el('li', 'dim hint-li', 'Dizem na vila que alguém mora numa tenda na serra, ao norte.'));
    const v = villagerById(friendSel), pts = S.friends[v.id] || 0;
    det.dataset.id = v.id;
    det.append(el('h3', '', v.name), heartsNode(hearts(v.id), maxHearts(v.id)), el('span', 'dim', `${pts} pontos de amizade · ${hearts(v.id)} de ${maxHearts(v.id)} corações`), el('p', '', v.bio), el('span', 'dim', `Costuma ficar ${v.place}.`));
    if (v.birthday) det.append(el('span', '', `🎂 Aniversário: ${v.birthday.day} do ${SEASONS[v.birthday.season]}${isBirthday(v) ? ' — é hoje!' : ''}`));
    if (GIFT_RULES[v.id]) {
      const R = GIFT_RULES[v.id], L = giftState(v), n = L.gifts.week === weekOf(S.day) ? L.gifts.n : 0;
      det.append(el('span', 'gift-week', `Presentes nesta semana: ${n}/${R.perWeek} · hoje: ${S.daily.gift[v.id] ? '1' : '0'}/${R.perDay}${isBirthday(v) ? ` · presente de aniversário: ${L.bday === calendar().year ? 'entregue' : 'disponível (amizade x8)'}` : ''}. A semana vira toda segunda-feira.`));
      det.append(el('span', '', `Hoje: conversa ${S.daily.talk[v.id] ? '✔' : '—'}`));
      if (v.id === 'iara') {
        const done = iaraSeasonsDone();
        det.append(el('span', 'iara-paint', `Pinturas da fonte (todo dia 10, das 14h às 18h): ${done.length ? done.map(si => SEASONS[si]).join(', ') : 'nenhuma ainda'} · ${done.length}/4 estações.`));
        det.append(el('span', 'dim', S.iara.ev5 ? 'As quatro versões da fonte: visto ✔' : 'Com 5 corações e a fonte pintada nas quatro estações, Iara quer mostrar algo especial.'));
        if (S.iara.colorName) det.append(el('span', 'dim', `Cor batizada por você: "${S.iara.colorName}"`));
      }
    } else det.append(el('span', 'gift-week', `Presentes: 1 por dia · hoje: ${S.daily.gift[v.id] ? '1/1 ✔' : '0/1'} · conversa hoje: ${S.daily.talk[v.id] ? '✔' : '—'}`));
    const kn = Object.keys(S.known[v.id] || {});
    det.append(el('h3', '', 'Gostos descobertos'));
    det.append(kn.length ? el('span', 'ok', kn.map(k => `${ITEMS[k].name} (${{ love: 'adora', like: 'gosta', neutral: 'aceita', dislike: 'não gosta' }[S.known[v.id][k]]})`).join(', ')) : el('span', 'dim', 'Ainda não sabe. Dê presentes para descobrir.'));
    box.append(list, det); body.append(box);
  },
  mapa(body) {
    const head = el('div', 'map-head'), h = el('h3', ''); h.id = 'map-title'; head.append(h);
    const mb = el('div', 'map-body'), fr = el('div', 'map-frame'), cv = el('canvas', 'pixel'); cv.id = 'map-canvas'; fr.append(cv);
    const leg = el('ul', 'legend'); leg.id = 'map-legend'; mb.append(fr, leg);
    const info = el('p', 'map-info'); info.id = 'map-info';
    body.append(head, mb, info); renderMap();
  },
  habilidades(body) {
    body.append(el('p', 'dim', 'O XP entra na hora; o nível novo e o benefício valem depois de dormir.'));
    const list = el('div', 'skills');
    Object.keys(SKILLS).forEach(k => {
      const I = skillInfo(k), row = el('div', 'skill-row' + (I.pending ? ' pending' : '')); row.dataset.skill = k;
      const ic = el('canvas', 'pixel skill-ic'); ic.width = 16; ic.height = 16; ic.getContext('2d').drawImage(World.icon(SKILL_ICON[k]), 0, 0);
      const head = el('div', 'skill-head'); head.append(ic, el('b', 'skill-name', SKILLS[k].name), el('span', 'skill-lvl', I.lvl >= 10 ? 'Nível máximo' : `Nível ${I.lvl}`));
      const pips = el('div', 'skill-pips'); for (let i = 1; i <= 10; i++) pips.append(el('i', i <= I.lvl ? 'on' : i <= I.byXp ? 'new' : '', ''));
      const bar = el('div', 'bar skill-bar'), fill = el('i'); fill.style.width = (I.max ? 100 : Math.round(I.cur / I.need * 100)) + '%'; bar.append(fill);
      const prog = el('span', 'skill-xp', I.max ? `Nível máximo · ${I.xp.toLocaleString('pt-BR')} XP no total` : `${I.cur.toLocaleString('pt-BR')} de ${I.need.toLocaleString('pt-BR')} XP para o nível ${I.byXp + 1} · ${I.xp.toLocaleString('pt-BR')} XP no total`);
      row.append(head, pips, bar, prog);
      if (I.pending) row.append(el('span', 'skill-new', `Nível ${I.byXp} a confirmar: vale depois de dormir.`));
      row.append(el('span', 'skill-perk', 'Benefício: ' + SKILLS[k].perk(I.lvl)), el('span', 'dim skill-how', SKILLS[k].how));
      list.append(row);
    });
    body.append(list);
  },
  personagem(body) {
    const top = el('div', 'sheet-top'), pv = el('div', 'wardrobe-pv big');
    ['down', 'left', 'up', 'right'].forEach(d => pv.append(Sprites.canvas(S.look, d)));
    const info = el('div', 'sheet-info');
    const hatItem = S.look.hat && Object.keys(ITEMS).find(k => ITEMS[k].hat === S.look.hat), acc = Sprites.ACCESSORIES.find(a => a.id === S.look.accessory), hand = equipped();
    const en = el('div', 'xp'), bar = el('div', 'bar' + (S.energy < 20 ? ' low' : '')), fill = el('i'); fill.style.width = S.energy + '%'; bar.append(fill); en.append(el('span', '', `⚡ Energia ${Math.round(S.energy)}/100`), bar);
    info.append(el('b', 'sheet-name', S.name), el('span', '', `${S.age} anos · ${S.farmName}, ${VILA}`), en,
      fishSkill(),
      el('span', '', `Chapéu: ${hatItem ? ITEMS[hatItem].name : 'nenhum'}`), el('span', '', `Acessório: ${acc ? acc.name : 'nenhum'}`), el('span', '', `Na mão: ${hand ? ITEMS[hand.id].name : 'nada'}`),
      el('span', 'dim', 'Para trocar cabelo, roupas e acessório, use o guarda-roupa de casa.'));
    top.append(pv, info); body.append(top);
  },
  config(body) {
    const up = el('div', 'update-notes'); up.id = 'update-notes';
    const ul = el('ul', 'list'); UPDATE_NOTES.items.forEach(t => ul.append(el('li', '', t)));
    up.append(el('h3', '', 'Última atualização'), el('b', '', UPDATE_NOTES.title), ul); body.append(up);
    body.append(el('h3', '', 'Controles'));
    const t = el('table', 'controls');
    [['Andar', 'Setas ou W A S D (celular: direcional)'], ['Interagir e usar ferramentas', 'Clique (ou toque) perto do alvo'], ['Escolher item da barra', '1 a 0, ou clique na barra'], ['Mostrar outra linha da mochila na barra', 'Clique em 1, 2 ou 3 ao lado da barra'], ['Comer (alimento na mão)', 'Clique numa área livre do cenário e confirme "Sim"'],
      ['Menu (Inventário)', 'E ou Esc (de novo fecha)'], ['Diário', 'F'], ['Mapa', 'M'], ['Abrir porta à frente', 'Q'], ['Avançar conversa', 'E, Espaço, Enter ou clique'], ['Recusar em "Sim/Não"', 'E ou Esc'], ['Pausa', 'P ou o botão ⏸'],
      ['Pescar (vara na mão)', 'Segure o botão esquerdo sobre a água, ou Espaço virado para ela; solte para lançar'], ['Fisgar', 'Botão esquerdo ou Espaço quando a boia afundar e aparecer o "!"'],
      ['Puxar o peixe', 'Segure botão esquerdo ou Espaço: a faixa vai para a direita; solte: volta'], ['Guardar ou soltar o peixe', 'Clique na opção, ou setas e Espaço'], ['Recolher a linha', 'Esc ou o botão "Recolher linha"']]
      .forEach(([a, b2]) => { const tr = el('tr'); tr.append(el('td', '', a), el('td', '', b2)); t.append(tr); });
    body.append(t, el('h3', '', 'Tela'));
    body.append(btn('btn', document.fullscreenElement ? 'Sair da tela cheia' : 'Tela cheia', () => { $('btn-full').click(); setTimeout(() => renderTab('config'), 300); }));
    body.append(el('h3', '', 'Partida'));
    const msg = el('p', 'save-msg'); msg.id = 'save-msg';
    const sv = btn('btn primary', 'Salvar partida', () => {
      const okSave = save();
      msg.textContent = okSave ? `✔ Partida salva às ${clock()} do jogo (${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}).` : '✖ Não foi possível salvar: o navegador bloqueou o armazenamento.';
      msg.className = 'save-msg ' + (okSave ? 'ok' : 'bad');
    }); sv.id = 'btn-save';
    const back = btn('btn', 'Voltar à tela inicial', () => {
      if (!confirm('Voltar à tela inicial? A partida é salva antes, e você continua de onde parou com "Continuar".')) return;
      save(); closeModal(); initTitle();
    }); back.id = 'btn-title';
    const row = el('div', 'li-actions'); row.append(sv, back); body.append(row, msg);
    body.append(el('p', 'dim', 'O jogo não tem áudio por enquanto. O progresso também é salvo sozinho, de tempos em tempos.'));
    const reset = btn('btn ghost', 'Apagar esta fazenda e voltar ao título', () => { if (!confirm('Apagar a fazenda salva neste navegador e voltar ao título? Isso não pode ser desfeito.')) return; store.del(SAVE_KEY); closeModal(); initTitle(); });
    reset.style.marginTop = '16px'; body.append(reset);
  },
  roupa(body) {
    const top = el('div', 'sheet-top'), pv = el('div', 'wardrobe-pv');
    const drawPv = () => pv.replaceChildren(...['down', 'left', 'up', 'right'].map(d => Sprites.canvas(S.look, d)));
    drawPv();
    top.append(pv, el('div', '', `${S.name}, ${S.age} anos`)); body.append(el('h3', '', 'Guarda-roupa e espelho'), top);
    const change = () => { save(); renderTab('roupa'); };
    [['Cabelo', 'cabelo'], ['Roupa de cima', 'cima'], ['Roupa de baixo', 'baixo'], ['Calçado', 'calcado'], ['Acessório', 'acessorio']].forEach(([t, k]) => { const sec = el('div', 'look-sec'); body.append(el('h3', '', t), sec); LOOK_SECTIONS[k](sec, S.look, change, drawPv, save); });
    body.append(el('h3', '', 'Chapéu'));
    const mine = Sprites.HATS.filter(h => owns(Object.keys(ITEMS).find(k => ITEMS[k].hat === h.id)));
    optionGrid(body, [{ id: 'none', label: 'Sem chapéu' }, ...mine.map(h => ({ id: h.id, label: h.name, canvas: Sprites.canvas(Object.assign({}, S.look, { hat: h.id })) }))], S.look.hat || 'none', id => { S.look.hat = id === 'none' ? null : id; change(); }, 'many');
    if (!mine.length) body.append(el('p', 'dim', 'Você ainda não tem chapéus. O Armazém vende um, e amigos podem presentear outros.'));
  },
  ajuste(body) {
    body.append(el('h3', '', 'Sua fazenda ganhou novidades'),
      el('p', '', 'Esta versão do jogo dá um nome à sua fazenda e pergunta qual é o seu animal favorito. Todo o resto continua como estava: mochila, plantações, galinhas, amizades e missões.'));
    const draftA = { farm: S.farmName, pet: S.pet.sp || 'gato' };
    const ok = btn('btn primary', 'Confirmar ▶', () => {
      const v = draftA.farm; if (!nameOk(v, 'farm')) return;
      S.farmName = v; S.pet.sp = draftA.pet; save();
      $('modal').hidden = true; renderHud(); renderHotbar();
      toast(`Bem-vindo de volta a ${S.farmName}`);
      if (S.day >= PET_DAY) toast('Alguém da vila pode aparecer numa dessas manhãs...');
      if (!S.intro) intro();
    });
    ok.id = 'setup-ok';
    const f = nameField('Nome da fazenda', draftA.farm, 'farm', 'Ex.: Recanto', v => { draftA.farm = v; ok.disabled = !nameOk(v, 'farm'); }, 'setup-farm');
    body.append(f.box, el('p', 'hint', 'Animal favorito'));
    const petBox = el('div'); const drawPets = () => { petBox.replaceChildren(); petOptions(petBox, draftA.pet, id => { draftA.pet = id; drawPets(); }); }; drawPets();
    ok.disabled = !nameOk(draftA.farm, 'farm'); ok.style.marginTop = '12px';
    body.append(petBox, ok);
  },
  loja(body) {
    /* Uma transação por vez: cliques rápidos (ou duplo clique) não cobram nem entregam duas vezes. */
    const tx = (key, fn) => (...a) => { const now = performance.now(); if (shopLock.key === key && now < shopLock.until) return; shopLock = { key, until: now + 450 }; fn(...a); };
    body.append(el('h3', '', 'Armazém da Dona Celeste'), el('p', '', `Suas moedas: ${S.coins}`));
    const row = (id, name, unit, max, label, go, extra) => {
      const li = el('li'), meta = el('div', 'meta'), qty = el('b', 'qty', '1'), tot = el('span', '', '');
      let n = 1; const upd = () => { qty.textContent = n; tot.textContent = `${label} ${n} × ${unit} = ${n * unit} moedas`; ok.disabled = !max || (label === 'Comprar' && n * unit > S.coins); };
      const seed = label === 'Comprar' && ITEMS[id] && ITEMS[id].kind === 'seed';
      const ok = btn('btn primary', label === 'Comprar' ? 'Comprar' : 'Confirmar', tx(label + id, () => go(n))); ok.dataset.item = id;
      const left = el(seed ? 'button' : 'div', 'shop-item' + (seed ? ' seed-open' : '')); left.append(cloneIcon(extra || id), el('span', '', `${name} — ${unit} moedas cada`));
      if (seed) {                                                    // ícone e nome abrem as informações de cultivo (não compram)
        left.type = 'button'; left.dataset.info = id; left.title = 'Informações de cultivo'; left.onclick = () => openSeedInfo(id);
        if (!cropInSeason(ITEMS[id].crop)) left.append(el('span', 'tag-out', 'Fora de estação'));
      }
      meta.append(btn('btn', '−', () => { n = Math.max(1, n - 1); upd(); }), qty, btn('btn', '+', () => { n = Math.min(Math.max(1, max), n + 1); upd(); }), tot, ok);
      li.append(left, meta); upd(); return li;
    };
    body.append(el('h3', '', 'Comprar'));
    const buy = el('ul', 'list buy');
    SHOP.forEach(id => buy.append(row(id, ITEMS[id].name, ITEMS[id].price, 20, 'Comprar', n => {
      if (S.coins < n * ITEMS[id].price) return toast('Moedas insuficientes');
      if (!canAdd(id, n)) return toast('Mochila cheia');
      S.coins -= n * ITEMS[id].price; addTo(S.inv, id, n); toast(`+${n} ${ITEMS[id].name}`); save(); renderTab('loja');
    })));
    {                                                 // vara de fibra de vidro: aparece a partir do nível de pesca pedido
      const li = el('li', 'fiber-row'), left = el('div', 'shop-item'), F2 = FISHING.fiber;
      left.append(cloneIcon('vara_fibra'), el('span', '', `${ITEMS.vara_fibra.name} — ${F2.price.toLocaleString('pt-BR')} moedas`));
      li.append(left);
      if (ownsFiber()) li.append(el('span', 'dim', 'Você já tem esta vara.'));
      else if (fishLevel() < F2.level) { li.classList.add('locked'); li.append(el('span', 'dim', `Disponível com pesca nível ${F2.level} (você está no ${fishLevel()}).`)); }
      else {
        const meta = el('div', 'meta'), plan = fiberPlan();
        if (!fiberArm) { const b = btn('btn primary', 'Comprar', () => { if (!fiberPlan().ok) return toast(fiberPlan().why); fiberArm = true; renderTab('loja'); }); b.id = 'buy-fiber'; b.disabled = !plan.ok; meta.append(b); if (!plan.ok) meta.append(el('span', 'dim', plan.why)); }
        else {
          meta.append(el('span', '', 'Substituir a vara de bambu na barra? Ela continua com você.'));
          const yes = btn('btn primary', 'Confirmar compra', () => { fiberArm = false; buyFiber(); renderTab('loja'); }); yes.id = 'buy-fiber-ok';
          const no = btn('btn', 'Cancelar', () => { fiberArm = false; renderTab('loja'); }); no.id = 'buy-fiber-no'; meta.append(yes, no);
        }
        li.append(meta);
      }
      buy.append(li);
    }
    if (qDone('galinheiro') && S.coop.hens.length < MAX_HENS) buy.append(row('galinha', 'Galinha', HEN_PRICE, 1, 'Comprar', () => {
      if (S.coins < HEN_PRICE) return toast('Moedas insuficientes');
      if (S.coop.hens.length >= MAX_HENS) return toast('O galinheiro está cheio');
      S.coins -= HEN_PRICE; save(); closeModal(); run(() => newHen('narr'));
    }, 'ovo'));
    body.append(buy, el('h3', '', 'Vender'));
    const sell = el('ul', 'list sell'), ids = [...new Set(S.inv.filter(s => s && ITEMS[s.id].sell).map(s => s.id))];
    const fishIdx = S.inv.map((x, i) => (x && x.cm ? i : -1)).filter(i => i >= 0);
    if (!ids.length && !fishIdx.length) sell.append(el('li', 'dim', 'Você não tem nada para vender agora. Colheitas, ovos, frutos, peixes e o que achar no bosque têm preço.'));
    fishIdx.forEach(i => {
      const f = S.inv[i], v = fishValue(f.id), li = el('li', 'fish-row'), left = el('div', 'shop-item');
      left.append(cloneIcon(f.id), el('span', '', `${ITEMS[f.id].name} · ${f.cm} cm — 1 × ${v} = ${v} moedas`));
      const b = btn('btn primary', 'Vender', tx('peixe' + i, () => { if (S.inv[i] !== f) return; S.inv[i] = null; S.coins += v; toast(`+${v} moedas`); save(); renderTab('loja'); })); b.dataset.fish = i;
      li.append(left, b); sell.append(li);
    });
    if (fishIdx.length > 1) {
      const tot = fishIdx.reduce((a, i) => a + fishValue(S.inv[i].id), 0), li = el('li', 'fish-row');
      const parts = Object.keys(FISH).map(id => { const n = fishIdx.filter(i => S.inv[i].id === id).length; return n ? `${ITEMS[id].name} ${n} × ${FISH[id].price}` : ''; }).filter(Boolean).join(' + ');
      const b = btn('btn', `Vender todos os peixes (${parts} = ${tot} moedas)`, tx('peixes', () => { let got = 0; fishIdx.forEach(i => { const f = S.inv[i]; if (f && f.cm && FISH[f.id]) { got += fishValue(f.id); S.inv[i] = null; } }); if (!got) return; S.coins += got; toast(`+${got} moedas`); save(); renderTab('loja'); })); b.id = 'sell-all-fish';
      li.append(b); sell.append(li);
    }
    ids.filter(id => !FISH[id]).forEach(id => sell.append(row(id, `${ITEMS[id].name} (você tem ${count(id)})`, ITEMS[id].sell, count(id), 'Vender', n => {
      n = Math.min(n, count(id)); if (!n) return;
      removeItem(id, n); S.coins += n * ITEMS[id].sell; toast(`+${n * ITEMS[id].sell} moedas`); save(); renderTab('loja');
    })));
    body.append(sell);
  },
};
const SPECIAL = ['bau', 'roupa', 'loja', 'ajuste'];
/* Painel "Informações de cultivo": abre por cima da loja (sem comprar nada e sem mexer na lista). */
function openSeedInfo(id) {
  const crop = ITEMS[id].crop, C = CROPS[crop], prod = ITEMS[crop], box = $('seed-info'), body = $('seed-info-body'), inS = cropInSeason(crop);
  body.replaceChildren();
  const head = el('div', 'si-head'), ic = el('canvas', 'pixel'); ic.width = 16; ic.height = 16; ic.getContext('2d').drawImage(World.icon(crop), 0, 0);
  head.append(ic, el('b', '', C.name)); body.append(head);
  const dl = el('dl', 'si-list'), add = (k, v) => dl.append(el('dt', '', k), el('dd', '', v));
  add('Semente', `${ITEMS[id].price} moedas`); add('Venda', `${prod.sell} moedas por ${prod.name.toLowerCase()}`);
  add('Estações', C.seasons ? C.seasons.map(i => SEASONS[i]).join(', ') : 'o ano inteiro');
  add('Primeira colheita', `${C.days} dias de crescimento`); add('Produção', `${C.yield || 1} por colheita`);
  add('Tipo', C.regrow ? `produção recorrente: nova colheita a cada ${C.regrow} dias após colher` : 'colheita única');
  add('Rega', 'precisa de rega: só cresce nos dias regados'); add('Agora', inS ? `cresce ${SEASON_IN[calendar().si] || 'nesta estação'}` : 'fora de estação');
  body.append(el('p', '', cropSummary(crop)), dl);
  if (C.regrow) body.append(el('p', 'dim', 'Quantas colheitas dá depende dos dias que ainda restam na estação, da rega e de quando você colhe.'));
  if (!inS) body.append(el('p', 'si-out', 'Pode ser comprada e plantada agora, mas só começará a crescer na estação indicada.'));
  box.hidden = false; $('seed-info-ok').focus();
}
const closeSeedInfo = () => { const b = $('seed-info'); if (b && !b.hidden) { b.hidden = true; return true; } return false; };
/* Nível de pesca na aba Personagem: nível, barra e a zona verde que ele dá. */
function fishSkill() {
  const box = el('div', 'xp fish-skill');
  box.append(el('span', '', `Habilidades: ${Object.keys(SKILLS).map(k => `${SKILLS[k].name} ${skillLvl(k)}`).join(' · ')} (detalhes na aba Habilidades)`));
  box.dataset.lvl = skillLvl('pesca'); return box;
}
/* Progresso de uma habilidade: nível confirmado, nível pelo XP e o trecho até o próximo. */
function skillInfo(k) {
  const sk = S.skills[k], byXp = skillLevelFor(sk.xp), max = byXp >= 10;
  return { lvl: sk.lvl, byXp, max, xp: sk.xp, cur: max ? 0 : sk.xp - SKILL_XP[byXp], need: max ? 0 : SKILL_XP[byXp + 1] - SKILL_XP[byXp], pending: byXp > sk.lvl };
}
const SKILL_ICON = { cultivo: 'rabanete', pesca: 'sardinha', coleta: 'flor' };
function renderTabsBadge() { const b = document.querySelector('#tabs [data-tab="habilidades"]'); if (b && S && S.skills) b.classList.toggle('badge', Object.keys(SKILLS).some(skillPending)); }
function renderTab(t) {
  const prev = tab;
  tab = TABS[t] ? t : tab;
  $('tabs').querySelectorAll('[data-tab]').forEach(b => { const on = b.dataset.tab === tab; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); b.hidden = SPECIAL.includes(tab); });
  $('modal-title').textContent = TAB_TITLE[tab] || '';
  $('modal').dataset.tab = tab;
  const body = $('modal-body'), sc = prev === tab ? body.scrollTop : 0; body.replaceChildren(); TABS[tab](body);
  if (SPECIAL.includes(tab) && tab !== 'ajuste') body.append(closeBtn());
  $('modal-close').hidden = tab === 'ajuste';
  body.scrollTop = sc; renderHotbar(); renderHud();
}
/* =====================================================
   MAPA (M): mostra o mapa externo de verdade, com ícones, legenda,
   sua posição e o destino da missão. Pausa o tempo; não teleporta.
   ===================================================== */
const MAP_ICON = {
  obra: (g, x, y) => { g.fillStyle = '#241a2c'; g.fillRect(x - 9, y - 7, 18, 14); g.fillStyle = '#a8a060'; g.fillRect(x - 8, y - 6, 16, 12); g.fillStyle = '#e8d070'; g.fillRect(x - 8, y - 6, 16, 1); g.fillRect(x - 8, y + 5, 16, 1);
    g.fillStyle = '#d8a868'; [-8, -2, 4].forEach(i => g.fillRect(x + i, y - 8, 2, 16)); g.fillStyle = '#e04a3a'; [-8, -2, 4].forEach(i => g.fillRect(x + i, y - 8, 2, 2)); },
  casa: (g, x, y) => { g.fillStyle = '#241a2c'; g.fillRect(x - 9, y - 4, 18, 13); g.fillStyle = '#b47c48'; g.fillRect(x - 8, y - 3, 16, 11); g.fillStyle = '#a24c32'; for (let i = 0; i < 8; i++) g.fillRect(x - 9 + i, y - 5 - i, 18 - i * 2, 1); g.fillStyle = '#ffd98a'; g.fillRect(x - 2, y + 2, 4, 6); },
  galinha: (g, x, y) => { g.fillStyle = '#241a2c'; g.fillRect(x - 8, y - 5, 16, 12); g.fillStyle = '#ffffff'; g.fillRect(x - 7, y - 4, 14, 10); g.fillStyle = '#e04a3a'; g.fillRect(x + 2, y - 8, 4, 4); g.fillStyle = '#f0a020'; g.fillRect(x + 7, y - 2, 3, 2); },
  cerca: (g, x, y) => { g.fillStyle = '#d8b078'; for (let i = -8; i <= 8; i += 4) g.fillRect(x + i, y - 6, 2, 12); g.fillRect(x - 8, y - 3, 18, 2); g.fillRect(x - 8, y + 2, 18, 2); },
  roca: (g, x, y) => { g.fillStyle = '#6a4426'; g.fillRect(x - 9, y - 7, 18, 14); g.fillStyle = '#58b858'; for (let i = -6; i <= 6; i += 6) { g.fillRect(x + i - 1, y - 5, 3, 4); g.fillRect(x + i - 1, y + 1, 3, 4); } },
  agua: (g, x, y) => { g.fillStyle = '#241a2c'; g.fillRect(x - 9, y - 6, 18, 12); g.fillStyle = '#3f86d8'; g.fillRect(x - 8, y - 5, 16, 10); g.fillStyle = '#bfe4ff'; g.fillRect(x - 5, y - 2, 6, 1); g.fillRect(x, y + 2, 5, 1); },
  loja: (g, x, y) => { g.fillStyle = '#241a2c'; g.fillRect(x - 9, y - 7, 18, 15); g.fillStyle = '#f4e8c8'; g.fillRect(x - 8, y - 6, 16, 13); g.fillStyle = '#c8683a'; g.fillRect(x - 8, y - 6, 16, 4); g.fillStyle = '#ffd75e'; g.fillRect(x - 2, y, 4, 4); },
  praca: (g, x, y) => { g.fillStyle = '#241a2c'; g.fillRect(x - 8, y - 6, 16, 12); g.fillStyle = '#3f86d8'; g.fillRect(x - 7, y - 5, 14, 10); g.fillStyle = '#e8e2d4'; g.fillRect(x - 1, y - 8, 2, 8); },
  morador: (g, x, y) => { g.fillStyle = '#241a2c'; g.fillRect(x - 6, y - 8, 12, 16); g.fillStyle = '#f6c89c'; g.fillRect(x - 4, y - 7, 8, 6); g.fillStyle = '#3f86d0'; g.fillRect(x - 5, y - 1, 10, 8); },
  bosque: (g, x, y) => { g.fillStyle = '#143c24'; g.fillRect(x - 8, y - 9, 16, 13); g.fillStyle = '#2a8046'; g.fillRect(x - 7, y - 8, 14, 11); g.fillStyle = '#6a4426'; g.fillRect(x - 1, y + 3, 3, 5); },
  trilha: (g, x, y) => { g.fillStyle = '#241a2c'; g.fillRect(x - 8, y - 8, 16, 16); g.fillStyle = '#d8c48c'; g.fillRect(x - 3, y - 7, 6, 14); g.fillStyle = '#8a8478'; for (let i = 0; i < 6; i++) g.fillRect(x - 7 + i, y - 7 + i * 2, 2, 2); g.fillStyle = '#ffffff'; g.fillRect(x - 1, y - 6, 2, 2); g.fillRect(x - 2, y - 4, 4, 1); },
  tenda: (g, x, y) => { g.fillStyle = '#241a2c'; for (let i = 0; i < 12; i++) g.fillRect(x - i - 1, y - 8 + i, i * 2 + 2, 1); g.fillStyle = '#c8b48a'; for (let i = 1; i < 11; i++) g.fillRect(x - i, y - 8 + i, i * 2, 1); g.fillStyle = '#2a1e16'; for (let i = 0; i < 5; i++) g.fillRect(x - i / 2, y - 1 + i, i, 1); g.fillStyle = '#f08a20'; g.fillRect(x + 7, y + 1, 3, 3); },
  rocha: (g, x, y) => { g.fillStyle = '#241a2c'; g.fillRect(x - 8, y - 6, 16, 12); g.fillStyle = '#8a8478'; g.fillRect(x - 7, y - 5, 14, 10); g.fillStyle = '#b4ae9e'; g.fillRect(x - 6, y - 4, 6, 2); g.fillStyle = '#6a6458'; g.fillRect(x + 1, y + 1, 5, 2); },
  voce: (g, x, y) => { g.fillStyle = '#241a2c'; g.fillRect(x - 7, y - 16, 14, 14); g.fillStyle = '#ff5a5a'; g.fillRect(x - 6, y - 15, 12, 12); g.fillStyle = '#ffffff'; g.fillRect(x - 3, y - 12, 6, 6); g.fillStyle = '#241a2c'; g.fillRect(x - 3, y - 2, 6, 2); g.fillRect(x - 1, y, 2, 3); },
  destino: (g, x, y) => { g.fillStyle = '#241a2c'; g.fillRect(x - 8, y - 18, 16, 12); g.fillRect(x - 6, y - 6, 12, 2); g.fillRect(x - 3, y - 4, 6, 2); g.fillRect(x - 1, y - 2, 2, 2); g.fillStyle = '#ffd75e'; g.fillRect(x - 7, y - 17, 14, 10); g.fillRect(x - 5, y - 7, 10, 1); g.fillRect(x - 2, y - 5, 4, 1); },
};
function legendIcon(kind) { const c = el('canvas', 'pixel'); c.width = 24; c.height = 24; MAP_ICON[kind](c.getContext('2d'), 12, kind === 'voce' || kind === 'destino' ? 22 : 12); return c; }
function label(g, text, x, y, size = 14) {
  g.font = `${size}px "Press Start 2P", monospace`; g.textAlign = 'center'; g.textBaseline = 'top';
  let t = text; while (g.measureText(t).width > 420 && t.length > 4) t = t.slice(0, -2);
  if (t !== text) t = t.trimEnd() + '…';
  g.lineWidth = 4; g.strokeStyle = '#241a2c'; g.strokeText(t, x, y); g.fillStyle = '#ffffff'; g.fillText(t, x, y);
}
/* Onde o personagem está, no mapa externo (dentro de um prédio = a porta dele). */
const playerPoint = () => (map.id === 'fora' || map.id === 'montanha' ? outdoorPoint(map.id, P.x, P.y) : outdoorPoint(map.id, 0, 0));
const PLACE_NAME = { escola: 'na escola', iara: 'na casa de Iara', casa: 'dentro de casa', loja: 'no Armazém', galinheiro: 'no galinheiro', montanha: 'na serra', tenda: 'na tenda de Lúcio' };
const LEGEND = { obra: 'Terreno reservado (ainda sem construção)', casa: 'Sua casa', galinha: 'Galinheiro', cerca: 'Cercado das galinhas', roca: 'Roça (terra cultivável)', agua: 'Água (lago, lagoa e nascente)', loja: 'Armazém', praca: 'Praça e fonte', morador: 'Casa de morador', bosque: 'Bosque e mata', trilha: 'Trilha da serra (norte)', tenda: 'Tenda de Lúcio', rocha: 'Rochedos da serra' };
function renderMap() {
  const m = World.get('fora'), mt = World.get('montanha'), c = $('map-canvas'), g = c.getContext('2d');
  c.width = m.w; c.height = m.h + MAP_FY; g.imageSmoothingEnabled = false;
  g.fillStyle = '#3e4a34'; g.fillRect(0, 0, m.w, MAP_FY);
  for (let i = 0; i < 40; i++) { g.fillStyle = i % 2 ? '#56604a' : '#6a6a5a'; const x = (i * 97) % m.w, y = (i * 53) % (MAP_FY - 40); for (let r = 0; r < 18; r++) g.fillRect(x - r, y + r, r * 2, 1); }   // morros
  g.drawImage(mt.bg, MAP_SX, 0); g.drawImage(m.bg, 0, MAP_FY);
  [[mt, MAP_SX, 0], [m, 0, MAP_FY]].forEach(([mm, ox, oy]) => mm.sprites.slice().sort((a, b2) => a.base - b2.base).forEach(sp => g.drawImage(sp.img, sp.x + ox, sp.y + oy)));   // prédios e árvores
  g.fillStyle = 'rgba(16,20,40,.18)'; g.fillRect(0, 0, c.width, c.height);
  $('map-title').textContent = `${S.farmName}, ${VILA} e a serra — ${REGIAO}`;
  // nomes de regiões
  label(g, S.farmName, 200, 186 + MAP_FY, 16); label(g, VILA, 640, 36 + MAP_FY, 16); label(g, 'Serra', MAP_SX + 320, 90, 16);
  label(g, 'Bairro leste', 1420, 112 + MAP_FY, 16); label(g, 'Vila sul', 640, 404 + MAP_FY, 16); label(g, 'Rio do sul', 1100, 846 + MAP_FY, 14); label(g, 'Mata', 200, 640 + MAP_FY, 16);
  const leg = $('map-legend'); leg.replaceChildren();
  const seenKinds = new Set();
  const put = (pl, mapId, name) => {
    const q = outdoorPoint(mapId, pl.x, pl.y);
    MAP_ICON[pl.icon](g, q.x, q.y); label(g, name, q.x, q.y + 12, 12);
    if (!seenKinds.has(pl.icon)) { seenKinds.add(pl.icon); const li = el('li'); li.append(legendIcon(pl.icon), el('span', '', pl.icon === 'tenda' && !S.lucio.met ? 'Tenda na serra' : LEGEND[pl.icon])); leg.append(li); }
  };
  World.PLACES.forEach(pl => put(pl, 'fora', pl.id === 'casa' ? 'Casa' : pl.label));
  World.MPLACES.forEach(pl => put(pl, 'montanha', pl.id === 'tenda' ? (S.lucio.met ? 'Tenda de Lúcio' : 'Tenda') : pl.label));
  const id = tracked(), tg = id && questTarget(id), dest = tg && outdoorPoint(tg.map, tg.x, tg.y + (tg.map === 'fora' || tg.map === 'montanha' ? 8 : 0));
  if (dest) { MAP_ICON.destino(g, Math.round(dest.x), Math.round(dest.y) - 4); const li = el('li'); li.append(legendIcon('destino'), el('span', '', `Destino: ${tg.label}`)); leg.prepend(li); }
  const me = playerPoint();
  if (me) { MAP_ICON.voce(g, Math.round(me.x), Math.round(me.y) - 6); label(g, 'Você', Math.round(me.x), Math.round(me.y) + 4, 12); const li = el('li'); li.append(legendIcon('voce'), el('span', '', 'Você')); leg.prepend(li); }
  const where = map.id === 'fora' ? '' : map.id === 'montanha' ? ' Você está na serra.' : ` Você está ${PLACE_NAME[map.id] || 'dentro de um prédio'}.`;
  $('map-info').textContent = `${id ? `Missão: ${QUESTS[id].title} → ${tg.label}.` : 'Nenhuma missão em andamento.'}${where} O tempo fica parado com o menu aberto. Feche com ${COARSE ? 'o ✕' : 'M, E, Esc ou o ✕'}.`;
}
/* O mapa é a aba "Mapa" do menu principal. */
function openMap() { if (!$('modal').hidden && tab !== 'ajuste') renderTab('mapa'); else openMenu('mapa'); }
function closeMap() { if (!$('modal').hidden && tab === 'mapa') closeModal(); }

function shop() {
  const c = villagerById('celeste'), at = villagerAt(c, S.time);
  if (at.where !== 'loja') return run(() => say('narr', S.time >= 1290 || S.time < 360 ? 'O balcão está vazio. Dona Celeste já subiu para a casa dela, em cima do Armazém. Ela atende das 6h às 18h.' : 'O balcão está vazio. Dona Celeste atende das 6h às 18h; depois disso, costuma estar na praça.'));
  talkTo(c);
}

/* Ganchos para testes automatizados e depuração. */
window.__trilha = {
  get S() { return S; }, get P() { return P; }, get map() { return map; }, get hover() { return hover; }, get near() { return hover && hover.ok ? hover : null; }, get busy() { return blocked(); }, get hens() { return hens; }, save,
  cam: () => World.camera(map, P.x, P.y), lucioLine: () => bandLine(villagerById('lucio')), weekOf, get pet() { return pet; }, questTarget: id => questTarget(id || tracked()), openMap, fit, petEvent, cleanName, textWidth,
  villagerAt: id => villagerAt(villagerById(id), S.time), iaraSchedule, whereAt: (id, tm) => villagerAt(villagerById(id), tm), calebSchedule, CALEB, maxHearts, addFriend, iaraLine: () => iaraLine(villagerById('iara')), giftKind: (vid, id) => giftKind(villagerById(vid), id), iaraFinishPainting, tile: i => World.tilePos(i), talk: id => talkTo(villagerById(id)),
  place(m, x, y, dir) { enterMap(m, x, y, dir || 'down'); P.x = x; P.y = y; },
  targetAt: (x, y) => targetAt(x, y, actors()), henMenu, newHen: () => { run(() => newHen('narr')); }, get Pobj() { return P; },
  luckKind, rollCatch, buildSeasonLuck, luckFish, luckEffect,
  addXp, skillLevelFor, confirmSkills, toolEnergy, skillInfo, skillLvl, processNight,
  get fishing() { return fishing; }, fishCheck, fishValue, pickFish, openTab: t => openModal(t), get fin() { return { ...FIN }; }, zoneWidth, castMax, biteWait, addFishXp,
};

/* Modo de desenvolvimento (só com ?dev=1 na URL): avançar tempo e noites, e ver
   os pontos de surgimento da vila. Não aparece na versão normal. */
let DEV = null;
if (/[?&]dev=1\b/.test(location.search)) {
  DEV = { markers: true };
  window.__trilha.dev = {
    addMinutes: m => { S.time = Math.min(DAY_END, S.time + m); if (S.time >= DAY_END) passOut(); renderHud(); },
    setTime: m => { S.time = m; renderHud(); },
    night: (n = 1) => { for (let i = 0; i < n; i++) processNight(); renderHud(); return S.day; },
    setDay: d => { S.day = d; S.lastNight = d - 1; World.setSeason(calendar().si); enterMap(map.id === 'fora' || map.id === 'montanha' ? map.id : map.id, P.x, P.y, P.dir); renderHud(); },
    spawn: rnd => { S.spawnDay = 0; return spawnSeasonal(rnd); },
    lightAt, calendar, dateText, clock,
    setRain: on => { S.weather = on ? 'chuva' : null; rainWater(); renderHud(); save(); },
    set markers(v) { DEV.markers = v; },
    pose: p => { DEV.pose = p; },                                       // { id: { where, x, y, dir } }: moradores parados num ponto (comparação de tamanhos)
  };
}

initTitle();
requestAnimationFrame(loop);
