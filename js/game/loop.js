/* Jogo — início e laço principal: começar ou continuar, atualizar e desenhar cada quadro, luz do dia e a
   tela inteira com pixels inteiros.
   Parte de js/game/ (antes era js/game.js). São scripts comuns, carregados em ordem pelo index.html:
   as declarações de nível superior (estado S, P, map etc. e as funções) valem para todos os arquivos, sem
   cópias (não são módulos). O jogo começa em js/game/main.js, o último. */

/* =====================================================
   INÍCIO E LAÇO PRINCIPAL
   ===================================================== */
/* Campos criados depois (salvamentos anteriores continuam valendo). */
function upgrade(s) {
  s.dmg = s.dmg || {};
  s.look = Object.assign({ accessory: null, accColor: '#e04a3a' }, s.look, { crisp: true });   // crisp: separação nítida cabelo/rosto (só o jogador)
  if (!(s.age >= START_AGE)) s.age = START_AGE;                       // agora a história começa aos 22
  if (typeof s.farmName !== 'string') s.farmName = '';                 // pedido na tela de ajuste, sem recomeçar
  if (!s.pet) s.pet = { sp: null, state: 'pending', name: '', offered: 0 };
  if (s.letterSeen === undefined) s.letterSeen = !!s.intro;           // quem já jogava não vê a cena de abertura de novo
  if (s.track === undefined) s.track = null;
  /* calendário de 29 dias: o dia absoluto já guardado continua valendo (é só reinterpretado) */
  if (typeof s.time !== 'number' || !(s.time >= DAY_START)) s.time = DAY_START;
  s.time = Math.min(s.time, DAY_END - 1);
  if (typeof s.lastNight !== 'number') s.lastNight = s.day - 1;
  if (!Array.isArray(s.seasonal)) { s.seasonal = []; s.spawnDay = 0; }
  /* mochila de 3 linhas (30 espaços): saves antigos ganham espaços vazios, nada se perde */
  while (s.inv.length < INV_SIZE) s.inv.push(null);
  if (!(s.sel >= 0 && s.sel < INV_SIZE)) s.sel = 0;
  s.row = Math.floor(s.sel / HOTBAR);
  VILLAGERS.forEach(v => { if (typeof s.friends[v.id] !== 'number') s.friends[v.id] = 0; if (!s.known[v.id]) s.known[v.id] = {}; });
  /* Lúcio: conversa, presentes (dia, semana e aniversário), tenda, missões e cenas */
  s.caleb = Object.assign({ arrived: false, day: 0, t: 0, last: '', again: 0 }, s.caleb);   // Caleb: chegada (uma vez) e última fala
  s.lucio = Object.assign({ met: false, permit: false, gifts: { week: -1, n: 0 }, bday: 0, tentUp: false, found: false, fireScene: false, iara: false, last: -1, again: 0 }, s.lucio);
  /* pesca: quem já jogava recebe a carta de Tomé na manhã seguinte à atualização */
  const hadFish = !!s.fish, oldXp = s.fish && s.fish.v !== 2 ? s.fish.xp || 0 : null;
  s.fish = Object.assign(newFishState(s.day + 1), s.fish);
  if (hadFish && oldXp !== null) {                    // pesca da versão anterior: a experiência acumulada vira nível (o que sobra continua)
    s.fish.lvl = 0; s.fish.xp = oldXp;
    while (s.fish.lvl < FISHING.maxLevel && s.fish.xp >= FISHING.legacyNextLevel(s.fish.lvl)) { s.fish.xp -= FISHING.legacyNextLevel(s.fish.lvl); s.fish.lvl++; }
    s.fish.v = 2;
  }
  /* habilidades: Cultivo, Pesca e Coleta. Sem histórico, começam em 0 XP. A pesca antiga (nível com
     XP por nível: 100 + 25 × nível) vira XP total = soma dos níveis completos + o que sobrava, e o
     nível passa a vir da tabela nova (SKILL_XP), já confirmado. O sistema antigo deixa de existir. */
  if (!s.skills) {
    s.skills = {}; Object.keys(SKILLS).forEach(k => { s.skills[k] = { xp: 0, lvl: 0 }; });
    if (s.fish && (s.fish.lvl || s.fish.xp)) {
      let total = s.fish.xp || 0; for (let i = 0; i < (s.fish.lvl || 0); i++) total += FISHING.legacyNextLevel(i);
      s.skills.pesca = { xp: total, lvl: skillLevelFor(total) }; s.fish.legacyXp = total;
    }
  }
  Object.keys(SKILLS).forEach(k => { s.skills[k] = Object.assign({ xp: 0, lvl: 0 }, s.skills[k]); });
  if (s.fish) { delete s.fish.lvl; delete s.fish.xp; }
  s.skillPets = s.skillPets || {};
  if (s.inv.some(x => x && x.id === 'vara_fibra') || s.chest.some(x => x && x.id === 'vara_fibra')) s.fish.fiber = true;
  if (!s.fish.dex || typeof s.fish.dex !== 'object') s.fish.dex = {};
  if (s.inv.some(x => x && x.id === 'vara') || s.chest.some(x => x && x.id === 'vara')) { s.fish.rod = true; s.fish.pending = false; }
  /* plantações (versão dos cultivos com rebrota): abóboras antigas maduras continuam maduras;
     as que cresciam mantêm as noites já regadas (agora precisam de 13) */
  if (!s.cropV) { for (const key in s.farm.tiles) { const o = s.farm.tiles[key]; if (o.k === 'soil' && o.crop === 'abobora' && (o.g || 0) >= 6) o.g = CROPS.abobora.days; } s.cropV = 2; }
  /* Rabanete passou de 2 para 3 dias regados: o que já estava maduro (2 dias) continua maduro;
     o resto mantém o progresso. Tomate (4), abóbora e morango não mudaram de prazo. */
  if (s.cropV < 3) { for (const key in s.farm.tiles) { const o = s.farm.tiles[key]; if (o.k === 'soil' && o.crop === 'rabanete' && !o.dead && (o.g || 0) >= 2) o.g = CROPS.rabanete.days; } s.cropV = 3; }
  /* Iara: acontecimentos, cor nomeada, pinturas da fonte (por estação e ano) e presentes */
  s.iara = Object.assign({ lastLine: '', again: 0, colorName: null, ev3: 0, ev5: false, paintings: {}, gifts: { week: -1, n: 0 }, bday: 0, missingTold: 0 }, s.iara);
  s.house = Object.assign({ quadro: null }, s.house);
  /* Sorte do dia: lista da estação (com o ano), condição de hoje, mensagem da manhã,
     peixes capturados hoje e aviso de limite. Jogos antigos ganham uma lista nova que
     preserva a condição de hoje, se já houver uma. */
  s.luck = Object.assign({ key: '', list: null, today: null, msgDay: 0, fishDay: 0, fish: 0, limitDay: 0 }, s.luck);
  { const f = World.get('fora'); s.seasonal = (s.seasonal || []).filter(o => World.free(f, o.x, o.y) && !World.waterZone(f, o.x, o.y)); }   // mapa ampliado: nada fica dentro de prédio, árvore ou água
  if (!s.nature.mforage) refreshMountain(s);
  s.nature.cleared = s.nature.cleared || {};
  if (!s.stumps) {                                    // alguns tocos em grama livre, longe da casa
    let sd = s.seed >>> 0, placed = 0; const rnd = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296;
    for (let k = 0; k < 400 && placed < 4; k++) { const i = 80 + Math.floor(rnd() * 120); if (!s.farm.tiles[i]) { s.farm.tiles[i] = { k: 'stump' }; placed++; } }
    s.stumps = true;
  }
}
const needsSetup = () => !S.farmName || !S.pet.sp;
function startGame() {
  upgrade(S);
  endFishing();
  show('game'); fit();
  closeModal(); setPause(false);
  World.setSeason(calendar().si);
  if (!S.spawnDay) { spawnSeasonal(); save(); }                    // primeira manhã: geração inicial (uma vez só)
  enterMap(S.pos.map, S.pos.x, S.pos.y, S.pos.dir);
  spawnHens(); spawnPet();
  startAutoQuests();
  renderHud(); renderHotbar();
  if (needsSetup()) { openModal('ajuste'); return; }                 // jogo salvo de antes: pede nome da fazenda e animal
  if (!S.intro) intro();
}
/* Abertura (só em jogo novo): o envelope do avô, a carta e a chegada. */
function intro() {
  run(async () => {
    if (!S.letterSeen) {
      await say('narr', 'Mais uma noite de planilhas no escritório da Uni Corporation. Na volta para casa, entre os boletos da caixa de correio, um envelope amarelado com a letra caprichada do seu avô.');
      await say('narr', 'Você senta no degrau da portaria e abre o envelope com cuidado.');
      await showLetter(false);
      S.letterSeen = true; save();
      await say('narr', 'Você lê a carta duas vezes. Na semana seguinte, pede as contas, junta o que cabe numa mochila e pega a estrada para o ' + REGIAO + '.');
    }
    await say('narr', 'A carroça da manhã deixa você diante de uma casa de madeira com varanda, telhado gasto e mato por todo lado. Na placa nova do portão: {fazenda}. A ' + VILA + ' fica logo a leste.');
    await say('narr', `Você tem ${S.age} anos, a carta do seu avô no bolso e as ferramentas antigas dele na mochila. A carta fica guardada no Diário.`);
    await say('narr', COARSE ? 'Ande com as setas da tela. Chegue perto e toque em pessoas, portas e objetos para interagir. Toque na barra para escolher o item; com uma ferramenta na mão, toque na terra ou no objeto ao seu lado. O botão Menu abre o inventário, as amizades, o mapa e o diário.' : 'Ande com as setas (ou W, A, S, D). Chegue perto e clique em pessoas, portas e objetos para interagir (Q abre a porta à frente). Clique na barra ou use as teclas 1 a 0 para escolher o item; os botões 1, 2 e 3 ao lado da barra mostram as outras linhas da mochila. Com um alimento na mão, clique numa área livre para comer. E abre o menu, F o diário e M o mapa.');
    await say('narr', 'Não há pressa nem fim: os dias passam quando você dorme. Para começar, siga a estrada para o leste e apresente-se no Armazém.');
    S.intro = true;
  });
}
function showLetter(reread, L = LETTER) {
  return new Promise(resolve => {
    const b = $('letter-body'); b.replaceChildren(el('div', 'stamp' + (L === LETTER ? '' : ' stamp-green')), el('p', 'greet', fmt(L.greet)), ...L.body.map(t => el('p', '', fmt(t))), el('p', 'sign', L.sign));
    $('letter-ok').textContent = reread ? 'Fechar a carta' : 'Guardar a carta ▶';
    $('letter').hidden = false; $('letter').scrollTop = 0; $('letter-ok').focus();
    $('letter-ok').onclick = () => { $('letter').hidden = true; resolve(); };
  });
}
function enterMap(id, x, y, dir) {
  map = World.get(id);
  $('toasts').replaceChildren(); hover = null; $('hint').hidden = true; $('hint').dataset.t = '';   // dicas do cenário anterior não atravessam a porta
  P.x = x; P.y = y; P.dir = dir || 'down'; P.moving = false; P.work = 0; P.tool = null;
  if (!World.free(map, P.x, P.y) || dynBlocked(P.x, P.y)) {           // posição salva inválida (ex.: o mapa mudou): o ponto livre mais próximo
    let best = null;
    for (let r = 8; r <= 160 && !best; r += 8) for (let a = 0; a < 16 && !best; a++) {
      const x = Math.round(P.x + Math.cos(a * Math.PI / 8) * r), y = Math.round(P.y + Math.sin(a * Math.PI / 8) * r);
      if (World.free(map, x, y) && !dynBlocked(x, y)) best = { x, y };
    }
    P.x = best ? best.x : map.spawn.x; P.y = best ? best.y : map.spawn.y;
  }
  S.pos = { map: id, x: Math.round(P.x), y: Math.round(P.y), dir: P.dir };
}
function travel(to, x, y, dir) {
  const wrap = $('scene-wrap'); wrap.classList.add('fade'); busy = true;
  setTimeout(() => { enterMap(to, x, y, dir); save(); wrap.classList.remove('fade'); busy = false; renderHud(); if (to === 'loja') calebArrival(); }, 220);
}
const keepsakeVisible = () => qActive().includes('lembranca') && !S.lucio.found;
const blocked = () => busy || paused || document.hidden || !$('modal').hidden || !$('summary').hidden || !$('letter').hidden || screen !== 'game' || fishPaused();
/* Pausa (tecla P ou botão): o tempo para e nada acontece até continuar. */
let paused = false;
function setPause(v) { if (v && fishing) return tip('Termine a pesca ou recolha a linha (Esc) antes de pausar.'); paused = !!v && screen === 'game'; $('pause').hidden = !paused; if (paused) $('pause-go').focus(); }
$('btn-pause').onclick = () => setPause(true);
$('pause-go').onclick = () => setPause(false);
/* Às 2h o personagem precisa descansar: transição curta e a manhã seguinte em casa, sem perder nada. */
let passingOut = false;
function passOut() {
  if (passingOut) return; passingOut = true;
  closeModal();
  busy = false;
  (run(async () => { await say('narr', 'São 2h da manhã. Suas pernas pesam e os olhos fecham sozinhos: você precisa descansar. Nada foi perdido; amanhã você acorda em casa.'); }) || Promise.resolve())
    .then(() => { passingOut = false; sleep(); });
}

/* =====================================================
   TELA: o jogo ocupa a janela inteira, com pixels inteiros
   ===================================================== */
let SCALE = 1;
function fit() {
  const c = $('scene'), W = window.innerWidth, H = window.innerHeight;
  const k = Math.max(2, Math.min(4, Math.round(H / 210), Math.round(W / 300)));   // escala inteira (pixels maiores, como num jogo de fazenda clássico)
  const cw = Math.ceil(W / k), ch = Math.ceil(H / k);
  /* A cena é desenhada na resolução da tela (cada pixel do mundo vira k x k pixels, sem suavização): o cenário fica
     igual, e personagens com arte mais detalhada (o Caleb, em quadros de 32x64) aparecem com o dobro de pixels no
     mesmo tamanho no mapa. */
  SCALE = k;
  if (c.width !== cw * k || c.height !== ch * k) { c.width = cw * k; c.height = ch * k; }
  c.style.width = cw * k + 'px'; c.style.height = ch * k + 'px';
  c.style.left = Math.floor((W - cw * k) / 2) + 'px'; c.style.top = Math.floor((H - ch * k) / 2) + 'px';
  World.setView(cw, ch);
}
window.addEventListener('resize', fit);
document.addEventListener('fullscreenchange', () => { $('btn-full').textContent = document.fullscreenElement ? 'Sair da tela cheia' : 'Tela cheia'; fit(); });
$('btn-full').onclick = () => {
  if (document.fullscreenElement) { document.exitFullscreen(); return; }
  const r = document.documentElement.requestFullscreen;
  if (!r) return toast('Este navegador não oferece tela cheia.');
  document.documentElement.requestFullscreen().catch(() => toast('O navegador não permitiu a tela cheia.'));
};

/* Obstáculos que mudam: entulho e árvores da fazenda, árvores e pedras do bosque. */
function dynBlocked(x, y) {
  if (!map || map.id !== 'fora') return false;
  for (const [px, py] of [[x - 5, y - 6], [x + 4, y - 6], [x - 5, y - 1], [x + 4, y - 1]]) {
    const i = World.tileAt(px, py); if (i < 0) continue;
    const o = S.farm.tiles[i]; if (!o || o.k === 'soil') continue;
    if (o.k !== 'tree') return true;
    const q = World.tilePos(i); if (px > q.x + 3 && px < q.x + 13 && py > q.y + 6) return true;
  }
  for (let i = 0; i < World.NTREES.length; i++) { if (S.nature.cleared[i]) continue; const [tx, ty] = World.NTREES[i]; if (Math.abs(x - tx) < 9 && y > ty - 7 && y < ty + 5) return true; }
  for (let i = 0; i < World.NROCKS.length; i++) { if (S.nature.rocks[i]) continue; const [tx, ty] = World.NROCKS[i]; if (Math.abs(x - tx) < 13 && y > ty - 12 && y < ty + 5) return true; }
  return false;
}

let lastT = 0;
function loop(t) {
  requestAnimationFrame(loop);
  const dt = Math.min(50, t - lastT); lastT = t;
  if (screen === 'title') {
    const m = World.get('fora'), cx = 520 + Math.sin(t / 9000) * 380, cy = 250 + Math.cos(t / 7000) * 150;
    World.setView(256, 160);
    const tctx = $('title-canvas').getContext('2d'); tctx.imageSmoothingEnabled = false;
    World.render(tctx, { map: m, cam: World.camera(m, cx, cy), t, state: DEMO, hens: [{ x: 190, y: 420, kind: 0 }, { x: 240, y: 432, kind: 1, flip: 1 }],
      actors: VILLAGERS.map(v => ({ v, p: villagerAt(v, 660) })).filter(o => o.p.where === 'fora').map(o => ({ look: o.v.look, x: o.p.x, y: o.p.y, dir: o.p.dir })) });
    return;
  }
  if (screen !== 'game' || !S || !map) return;
  if (isRaining() && rainWater()) save();                          // terra arada na chuva já fica molhada
  const list = actors();
  update(dt, t, list);
  draw(t, list);
}

function update(dt, t, list) {
  P.moving = false;
  const free = !blocked();
  if (fishing && !paused && !document.hidden && !busy) updateFishing(dt, t);
  if (free && !P.work && !fishing) {
    let dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    if (dx || dy) {
      P.dir = dx ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      const sp = 0.075 * dt * (dx && dy ? 0.72 : 1);
      const clear = (x, y) => World.free(map, x, y) && !dynBlocked(x, y);
      if (dx && clear(P.x + dx * sp, P.y)) { P.x += dx * sp; P.moving = true; }
      if (dy && clear(P.x, P.y + dy * sp)) { P.y += dy * sp; P.moving = true; }
    }
  }
  if (P.work && t > P.work) { P.work = 0; P.tool = null; }
  // o relógio só anda com o jogo livre (para em conversas, menus, mapa, cenas, pausa e aba escondida)
  if (free && S.time < DAY_END) {
    const before = Math.floor(S.time / 10);
    S.time = Math.min(DAY_END, S.time + dt / MS_PER_GAME_MIN);
    if (Math.floor(S.time / 10) !== before) renderHud();
    if (S.time >= DAY_END) { if (fishing) { endFishing(); toast('São 2h: você recolhe a linha.'); } passOut(); }
    if (S.time >= 1080) iaraFinishPainting(S.day);
  }
  if (free && !fishing && !passingOut && S.intro && !needsSetup() && S.luck.msgDay !== S.day) luckMorning();
  // carta de Tomé com a vara de pesca (uma vez só)
  if (free && !fishing && !passingOut && S.intro && !needsSetup() && !S.fish.letter && S.day >= S.fish.letterDay) rodLetter();
  floats = floats.filter(f => t - f.t0 < 700);
  updateHens(dt, t); updatePet(dt, t);
  impacts = impacts.filter(f => t - f.t0 < 400);
  hover = null;
  if (free && mouse && !fishing) { const [wx, wy] = mouseWorld(), tg = targetAt(wx, wy, list); if (tg) { tg.ok = tg.fish ? tg.fishOk : reachable(tg); hover = tg; } }
  let text = hover ? (hover.ok || hover.fish ? hover.label : `${hover.label.split(' — ')[0]} — chegue mais perto`) : '';
  if (!text && free && mouse && !fishing && !P.work) { const it = equipped(); if (it && isFood(it.id)) text = `Comer ${foodName(it).toLowerCase()} (+${ITEMS[it.id].food} de energia)`; }
  const hint = $('hint');
  if (hint.dataset.t !== text) { hint.dataset.t = text; hint.hidden = !text; hint.classList.toggle('far', !!(hover && !hover.ok)); hint.replaceChildren(el('b', '', COARSE ? 'TOQUE' : 'CLIQUE'), el('span', '', text)); }
  if (t - lastSave > 2500) { lastSave = t; S.pos.x = Math.round(P.x); S.pos.y = Math.round(P.y); S.pos.dir = P.dir; save(); }
}

/* Luz ao longo do dia, interpolada minuto a minuto (sem saltos):
   6h–8h amanhecer quente · 8h–16h dia · 16h–19h entardecer · 19h–21h anoitecer · 21h–2h noite.
   [minuto, r, g, b, opacidade da camada]. glow = quanto janelas, postes e fogueiras brilham. */
const SKY = [[360, 74, 62, 124, 0.40], [400, 240, 150, 120, 0.22], [450, 255, 196, 140, 0.10], [480, 255, 226, 190, 0], [960, 255, 226, 190, 0],
  [1050, 255, 170, 90, 0.10], [1140, 236, 110, 70, 0.20], [1200, 110, 70, 130, 0.34], [1260, 40, 42, 105, 0.48], [1560, 22, 26, 82, 0.56]];
function lightAt(m, inside) {
  let i = 0; while (i < SKY.length - 2 && m > SKY[i + 1][0]) i++;
  const A = SKY[i], B = SKY[i + 1], k = Math.max(0, Math.min(1, (m - A[0]) / (B[0] - A[0])));
  const mix = j => A[j] + (B[j] - A[j]) * k;
  const night = Math.max(0, Math.min(1, m < 480 ? (450 - m) / 90 : (m - 1110) / 150));
  if (inside) return { r: 70, g: 46, b: 30, a: 0.10 * night, glow: 0 };            // interiores: luz própria, só um pouco mais quente à noite
  const L = { r: Math.round(mix(1)), g: Math.round(mix(2)), b: Math.round(mix(3)), a: +mix(4).toFixed(3), glow: +night.toFixed(3) };
  if (isRaining()) {                                                 // chuva: céu cinza-azulado, mais escuro de dia; janelas e postes acendem um pouco
    const w = 0.34 * (1 - night * 0.5), k2 = L.a / (L.a + w);
    L.r = Math.round(L.r * k2 + 40 * (1 - k2)); L.g = Math.round(L.g * k2 + 50 * (1 - k2)); L.b = Math.round(L.b * k2 + 78 * (1 - k2)); L.a = +(L.a + w).toFixed(3);
    L.glow = +Math.max(L.glow, 0.35).toFixed(3);
    return L;
  }
  if (S && calendar().si === 1 && night < 0.5) {                     // verão: luz do dia um pouco mais quente (a noite não muda)
    const w = 0.07 * (1 - night * 2), k2 = L.a / (L.a + w);
    L.r = Math.round(L.r * k2 + 255 * (1 - k2)); L.g = Math.round(L.g * k2 + 206 * (1 - k2)); L.b = Math.round(L.b * k2 + 130 * (1 - k2)); L.a = +(L.a + w).toFixed(3);
  }
  return L;
}
const outdoor = () => map.id === 'fora' || map.id === 'montanha';

function draw(t, list) {
  const c = $('scene'); World.setView(Math.round(c.width / SCALE), Math.round(c.height / SCALE));
  const cam = World.camera(map, P.x, P.y), ctx = c.getContext('2d');
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0); ctx.imageSmoothingEnabled = false;
  const me = { look: S.look, x: P.x, y: P.y, dir: P.dir, moving: P.moving, tool: P.tool, hop: P.hop && t < P.hop ? -Math.abs(Math.sin((P.hop - t) / 80)) * 4 : 0 };
  if (P.eat && t < P.eat.t0 + EAT_MS) { me.eat = { id: P.eat.id, k: (t - P.eat.t0) / EAT_MS }; me.dir = 'down'; me.tool = null; me.hop = -(Math.floor((t - P.eat.t0) / 120) % 2); }
  if (fishing) { me.fish = fishView(t); me.tool = null; me.moving = false; if (me.fish.hold) me.dir = 'down'; if (fishing.phase === 'game') { drawBar(t); placeBar(t); } if (fishing.phase === 'show') $('catch').classList.toggle('at-top', screenOf(P.x, P.y)[1] > window.innerHeight * 0.52); }
  const cursor = hover && { x: Math.round(hover.rect[0]), y: Math.round(hover.rect[1]), w: Math.round(hover.rect[2]), h: Math.round(hover.rect[3]), far: !hover.ok };
  const lst = S.quests.lona, repair = lst && lst.state === 'active' && lst.mat ? Math.min(1, (lst.n.repair || 0) / 3) : 0;
  World.render(ctx, { map, cam, t, state: S, rain: isRaining() && outdoor(), actors: [...list, me], hens: map.id === 'fora' ? hens : [], pet: map.id === 'fora' ? pet : null, cursor, light: lightAt(S.time, !outdoor()), floats, dummyHit, impacts, shake, bars: map.id === 'fora' ? bars() : [], repair, keepsake: map.id === 'montanha' && keepsakeVisible(), seasonal: map.id === 'fora' ? S.seasonal : null, debugSpawns: DEV && DEV.markers });
}
/* Barras de resistência dos objetos com dano parcial (o dano fica salvo). */
function bars() {
  const out = [];
  for (const key in S.dmg) {
    const n = +key.slice(1); let x, y, R;
    if (key[0] === 'f') { const o = S.farm.tiles[n]; if (!o || !RESIST[o.k]) continue; R = RESIST[o.k]; const q = World.tilePos(n); x = q.x + 8; y = q.y - 4; }
    else if (key[0] === 't') { R = RESIST.trunk; [x, y] = World.NTREES[n]; y -= 54; }
    else if (key[0] === 's') { R = RESIST.stump; [x, y] = World.NTREES[n]; y -= 16; }
    else if (key[0] === 'r') { R = RESIST.rock; [x, y] = World.NROCKS[n]; y -= 22; }
    else continue;
    out.push({ x, y, frac: Math.max(0, (R.hp - S.dmg[key]) / R.hp) });
  }
  return out;
}
