/* Jogo — pesca: lançar, esperar, fisgar, a barrinha do minijogo e o resultado.
   Parte de js/game/ (antes era js/game.js). São scripts comuns, carregados em ordem pelo index.html:
   as declarações de nível superior (estado S, P, map etc. e as funções) valem para todos os arquivos, sem
   cópias (não são módulos). O jogo começa em js/game/main.js, o último. */

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
