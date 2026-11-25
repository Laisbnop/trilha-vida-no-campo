/* Jogo — estado do mundo: calendário, clima, habilidades, sorte do dia e rotinas dos moradores (onde cada um
   está a cada minuto).
   Parte de js/game/ (antes era js/game.js). São scripts comuns, carregados em ordem pelo index.html:
   as declarações de nível superior (estado S, P, map etc. e as funções) valem para todos os arquivos, sem
   cópias (não são módulos). O jogo começa em js/game/main.js, o último. */

/* =====================================================
   ESTADO DO MUNDO
   ===================================================== */
let map = null;
const P = { x: 0, y: 0, dir: 'down', moving: false, work: 0, tool: null, hop: 0 };
const keys = {};
let fishing = null;                                     // tentativa de pesca em andamento (só na memória)
let busy = false, hover = null, lastSave = 0, floats = [], dummyHit = 0, hens = [], impacts = [], shake = null, pet = null;
const COARSE = window.matchMedia && matchMedia('(pointer: coarse)').matches;

const hearts = id => Math.floor((S.friends[id] || 0) / 100);
const maxHearts = id => (villagerById(id) && villagerById(id).maxHearts) || 5;                       // Caleb: até 8; os outros: 5
const addFriend = (id, pts) => { const before = hearts(id); S.friends[id] = Math.max(0, Math.min(maxHearts(id) * 100, (S.friends[id] || 0) + pts)); if (hearts(id) > before) toast(`${villagerById(id).name}: ${hearts(id)} coração(ões)`); };
/* Relógio interno contínuo (minutos com fração); a tela mostra de 10 em 10 minutos. 02:00 = 26*60. */
const clock = (m = S.time) => { const t = Math.floor(m / 10) * 10; return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };
const fmt = t => String(t)
  .replace(/\{g:([^|}]*)\|([^|}]*)\|([^}]*)\}/g, (_, m, f, n) => (S && S.look.gender === 'm' ? m : S && S.look.gender === 'f' ? f : n))
  .replace(/\{nome\}/g, S ? S.name : '').replace(/\{fazenda\}/g, (S && S.farmName) || 'o sítio').replace(/\{pet\}/g, (S && S.pet && S.pet.name) || '');
/* Calendário: estações de 28 dias. */
/* Calendário: 4 estações de 29 dias. O dia absoluto (S.day, começando em 1 numa
   segunda-feira) é a referência de tudo: estação, ano, dia da semana, aniversários e limites semanais. */
const calendar = (d = S.day) => { const si = Math.floor((d - 1) / SEASON_DAYS) % 4; return { si, season: SEASONS[si], day: (d - 1) % SEASON_DAYS + 1, year: Math.floor((d - 1) / (SEASON_DAYS * 4)) + 1, wd: (d - 1) % 7, weekday: WEEKDAYS[(d - 1) % 7] }; };
const dateText = (d = S.day) => { const c = calendar(d); return `${WEEKDAYS_SHORT[c.wd]}, ${c.day} de ${c.season} · Ano ${c.year}`; };

/* Onde cada morador está agora: segue a rotina do dia, andando pelos caminhos. */
/* Clima: um estado único da partida (S.weather === 'chuva'), sorteado uma vez por noite para o dia seguinte e salvo
   com a partida (recarregar não muda o clima). Chance de chuva por estação (primavera, verão, outono, inverno); no
   inverno não chove (a paisagem já tem neve). Não chove nos 3 primeiros dias do jogo nem no dia 1 de cada estação.
   Em dia de chuva, todos os canteiros da fazenda ficam regados (também os arados durante o dia), o céu escurece e
   caem gotas nas áreas externas. */
const RAIN_CHANCE = [0.22, 0.14, 0.22, 0];
const isRaining = () => !!S && S.weather === 'chuva';
function rollWeather() {
  const c = calendar();
  if (S.day <= 3 || c.day === 1 || !RAIN_CHANCE[c.si]) return null;
  return Math.random() < RAIN_CHANCE[c.si] ? 'chuva' : null;
}
/* chuva rega todos os canteiros com terra (os já regados, os plantados e os arados agora); devolve quantos regou */
function rainWater() {
  if (!isRaining()) return 0;
  let n = 0;
  for (const key in S.farm.tiles) { const o = S.farm.tiles[key]; if (o.k === 'soil' && !o.dead && !o.w) { o.w = 1; n++; } }
  return n;
}
/* =====================================================
   HABILIDADES: Cultivo, Pesca e Coleta
   O XP é somado na hora, junto da ação concluída. O nível novo (e o benefício) só é
   confirmado ao dormir; até lá, a aba Habilidades mostra que há um avanço a confirmar.
   ===================================================== */
function skillLevelFor(xp) { let l = 0; while (l < 10 && xp >= SKILL_XP[l + 1]) l++; return l; }
const skillLvl = k => (S && S.skills && S.skills[k] ? S.skills[k].lvl : 0);
const skillPending = k => S.skills[k] && skillLevelFor(S.skills[k].xp) > S.skills[k].lvl;
function addXp(k, n, x, y) {
  if (!S || !S.skills || !S.skills[k] || !(n > 0)) return 0;
  S.skills[k].xp += n;
  if (x != null && map && (map.id === 'fora' || map.id === 'montanha' || map.id === 'galinheiro')) fishPop(`+${n} ${SKILLS[k].name}`, 'xp', x, y);   // aviso discreto, sem janela
  renderTabsBadge();
  return n;
}
/* Confirma os níveis novos (na noite, uma vez só). Devolve os avanços. */
function confirmSkills() {
  const ups = [];
  Object.keys(SKILLS).forEach(k => { const sk = S.skills[k], nl = skillLevelFor(sk.xp); if (nl > sk.lvl) { ups.push({ k, from: sk.lvl, to: nl }); sk.lvl = nl; } });
  return ups;
}
/* Gasto de energia da ferramenta com o benefício da habilidade (fracionário, sem arredondar). */
function toolEnergy(id, base) {
  if (!base) return 0;
  const k = Object.keys(SKILLS).find(sk => (SKILLS[sk].tools || []).includes(id));
  return k ? +(base * (1 - SKILL_GAIN.energyCut * skillLvl(k))).toFixed(4) : base;
}
/* =====================================================
   SORTE DO DIA (só a pesca muda; energia é igual nos três tipos de dia)
   ===================================================== */
const LUCK_KINDS = ['ma', 'neutro', 'sorte'];
function shuffle(a, rnd = Math.random) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
/* Lista da estação: exatamente as quantidades de LUCK.counts, embaralhadas. fixed = {índice: tipo}
   para dias já definidos (jogos antigos); os outros completam as quantidades que faltam. Se o que
   já existe tornar isso impossível, os dias que sobram ficam neutros. */
function buildSeasonLuck(fixed = {}, rnd = Math.random) {
  const left = { ...LUCK.counts }; Object.values(fixed).forEach(k => { if (left[k] > 0) left[k]--; });
  const pool = []; LUCK_KINDS.forEach(k => { for (let i = 0; i < left[k]; i++) pool.push(k); }); shuffle(pool, rnd);
  const list = []; for (let i = 0; i < SEASON_DAYS; i++) list.push(fixed[i] || pool.pop() || 'neutro');
  return list;
}
/* Condição do dia (sorteada uma vez por estação e salva; recarregar não muda). */
function luckKind(day = S.day) {
  const L = S.luck, c = calendar(day), key = `${c.year}-${c.si}`;
  if (L.key !== key || !Array.isArray(L.list) || L.list.length !== SEASON_DAYS) {
    const fixed = {}; if (L.today && L.today.day === day && LUCK_KINDS.includes(L.today.kind)) fixed[c.day - 1] = L.today.kind;
    L.key = key; L.list = buildSeasonLuck(fixed); save();
  }
  const kind = L.list[c.day - 1];
  if (day === S.day && (!L.today || L.today.day !== day)) { L.today = { day, kind }; save(); }
  return kind;
}
/* Peixes capturados hoje (o contador zera a cada manhã). */
function luckFish() { const L = S.luck; if (L.fishDay !== S.day) { L.fishDay = S.day; L.fish = 0; } return L.fish; }
const luckLimited = () => luckKind() === 'ma' && luckFish() >= LUCK.badLimit;
/* Resultado de um lançamento, decidido uma vez só: 'peixe', 'alga', 'musgo' ou 'lixo'. */
function rollCatch(rnd = Math.random) {
  const T = luckLimited() ? LUCK.afterLimit : LUCK.fishing[luckKind()];
  let r = rnd() * Object.values(T).reduce((a, b) => a + b, 0);
  for (const k in T) if ((r -= T[k]) < 0) return k;
  return Object.keys(T).pop();
}
function luckEffect(kind = luckKind()) {
  const T = LUCK.fishing[kind], base = `Pesca: peixe ${T.peixe}% · alga ${T.alga}% · musgo ${T.musgo}% · lixo ${T.lixo}%.`;
  return kind === 'ma' ? `${base} No máximo ${LUCK.badLimit} peixes hoje (já pescou ${Math.min(luckFish(), LUCK.badLimit)}); depois, só alga, musgo e lixo.` : `${base} Sem limite de peixes.`;
}
/* Mensagem curta ao começar o dia (uma vez por manhã, mesmo recarregando). */
function luckMorning() { const k = luckKind(); S.luck.msgDay = S.day; save(); toast(LUCK.morning[k]); renderHud(); }
const lookOf = v => (v.lookWinter && S && calendar().si === 3 ? v.lookWinter : v.look);
/* Rotina de Iara para o dia: [minuto, caminho, mapa, atividade, direção].
   Prioridade: cena em andamento (o jogo para) > chuva > pintura do dia 10 > dia útil/fim de semana. */
function iaraSchedule(day = S.day, rain = isRaining()) {
  const fora = World.get('fora'), HD = [fora.doors.iara.x, fora.doors.iara.y], SD = [fora.doors.escola.x, fora.doors.escola.y];
  const c = calendar(day), weekday = c.wd <= 4, day10 = c.day === 10;
  const EXIT = [128, 148], TEA = [167, 138], CORNER = [54, 124], READ = [206, 140], SHELF = [196, 118], DESK = [85, 132];
  const F = [664, 150], PR1 = [596, 182], PR2 = [684, 198];
  // escola no leste da vila: desce a ruela de Iara (x 780) até a rua de baixo e segue a leste (≈ 490 px, 27 min a pé)
  const toSchool = [HD, [780, HD[1]], [780, 597], [SD[0], 597], SD], fromSchool = toSchool.slice().reverse();
  const toFonte = [HD, [632, 312], [632, 224], [656, 204], [664, 172], F], fonteToPr1 = [F, [630, 168], PR1], pr1ToHome = [PR1, [632, 182], [632, 224], [632, 312], HD];   // contorna o banco da praça
  const fonteToHome = [F, [664, 172], [656, 204], [632, 224], [632, 312], HD], fonteToPr2 = [F, [672, 176], PR2], pr2ToFonte = [PR2, [672, 176], F];
  const E = [[360, [TEA], 'iara', 'tea', 'up'], [400, [SHELF], 'iara', 'draw', 'up']];
  const school = () => E.push([414, [EXIT], 'iara'], [420, toSchool, 'fora', null, 'up'], [450, [EXIT, DESK], 'escola', 'study', 'up'], [748, [EXIT], 'escola'], [751, fromSchool, 'fora'], [782, [EXIT, TEA], 'iara', 'tea', 'up']);
  if (rain) {                                              // chuva: aulas mantidas; lazer e pintura dentro de casa
    if (weekday) school(); else E.push([480, [CORNER], 'iara', 'brush', 'left'], [600, [READ], 'iara', 'read', 'up'], [720, [TEA], 'iara', 'tea', 'up']);
    E.push([800, [CORNER], 'iara', 'brush', 'left']);
    if (day10) E.push([840, [CORNER], 'iara', 'brush', 'left']);             // dia 10 com chuva: pinta a fonte em casa, pelos esboços (14h–18h)
    else E.push([960, [TEA], 'iara', 'tea', 'up']);
    E.push([1080, [CORNER], 'iara', 'brush', 'left'], [1140, [READ], 'iara', 'read', 'up']);
    return E.sort((a, b) => a[0] - b[0]);
  }
  if (weekday) { school(); E.push([800, [CORNER], 'iara', 'draw', 'left']); }
  else E.push([420, [CORNER], 'iara', 'draw', 'left'], [596, [EXIT], 'iara'], [600, [HD, [632, 312], [632, 224], [632, 182], PR1], 'fora', 'draw', 'down'], [750, pr1ToHome, 'fora'], [766, [EXIT, TEA], 'iara', 'tea', 'up']);
  E.push([838, [EXIT], 'iara'], [842, toFonte, 'fora', day10 ? 'paint' : 'draw', 'left']);
  if (day10) E.push([1080, fonteToHome, 'fora']);                       // dia 10: pinta a fonte das 14h às 18h
  else if (weekday) E.push([990, fonteToPr1, 'fora', 'draw', 'down'], [1080, pr1ToHome, 'fora']);
  else E.push([900, fonteToPr2, 'fora', 'draw', 'down'], [960, pr2ToFonte, 'fora', 'draw', 'left'], [1020, fonteToPr1, 'fora', 'draw', 'down'], [1080, pr1ToHome, 'fora']);
  E.push([1096, [EXIT, READ], 'iara', 'read', 'up']);
  return E;
}
/* Rotina de Caleb: [minuto, caminho, mapa, atividade, direção]. 'residencia' = no andar de cima (não aparece).
   Prioridade: chegada (no dia da apresentação) > chuva > sexta/domingo > rotina normal. Os horários são o início
   de cada atividade; os caminhos levam o tempo real de caminhada (18 px por minuto). */
const CALEB = { STAIR: [105, 70], NB: [104, 86], LUNCH: [102, 104], BOX: [96, 150], EV: [104, 100], EXIT: [152, 194], INTRO: [100, 104],
  DOOR: [506, 159], BQ: [1000, 214], LK: [1030, 262], PR: [668, 222] };
const pathLen = (pts, from) => { let d = 0, a = from || pts[0]; pts.forEach(q => { d += Math.hypot(q[0] - a[0], q[1] - a[1]); a = q; }); return d; };
function calebSchedule(day = S.day, rain = isRaining()) {
  const C = CALEB, c = calendar(day), fri = c.wd === 4, sun = c.wd === 6, E = [[0, [[0, 0]], 'residencia']];
  const inToNB = [C.STAIR, C.NB], nbToExit = [[110, 100], [110, 170], [152, 170], C.EXIT], exitToEv = [C.EXIT, [152, 170], [110, 170], [110, 100], C.EV];
  const up = (t, from) => { const pts = [[104, 92], C.STAIR]; E.push([t, pts, 'loja']); E.push([t + Math.ceil(pathLen(pts, from) / 18) + 1, [[0, 0]], 'residencia']); };
  const out = (t, from, pts, act, dir) => { const tin = Math.ceil(pathLen(nbToExit, from) / 18) + 1; E.push([t, nbToExit, 'loja']); E.push([t + tin, [C.DOOR, ...pts], 'fora', act, dir]); };
  const home = (t, from, pts) => { const all = [...pts, C.DOOR]; E.push([t, all, 'fora']); E.push([t + Math.ceil(pathLen(all, from) / 18) + 1, exitToEv, 'loja', 'idle', 'left']); };
  if (rain) {                                                                // chuva: manhã em cima, 13h–18h no térreo, depois em cima
    E.push([780, inToNB, 'loja', 'notebook', 'right']); up(1080, C.NB);
  } else {
    if (sun) E.push([600, [C.STAIR, [104, 100], C.LUNCH], 'loja', 'boxes', 'left'], [660, [[100, 130], C.BOX], 'loja', 'boxes', 'left'], [720, [[100, 130], C.LUNCH], 'loja', 'lunch', 'left']);   // domingo: ajuda a avó das 10h às 13h
    else E.push([720, [C.STAIR, [104, 100], C.LUNCH], 'loja', 'lunch', 'left'], [750, [[100, 130], C.BOX], 'loja', 'boxes', 'left']);   // 12h: almoço com a avó e as caixas
    E.push([780, [[100, 130], [104, 100], C.NB], 'loja', 'notebook', 'right']);                                                 // 13h: notebook no térreo
    out(960, C.NB, [[506, 158], [1000, 158], C.BQ], 'music', 'right');                                                                 // 16h: caminhada no bosque
    if (fri) {                                                                                                                         // sexta: praça das 18h às 21h
      E.push([1080, [[1000, 158], [668, 158], [640, 190], C.PR], 'fora', 'music', 'down']);
      home(1260, C.PR, [[640, 190], [668, 158], [506, 158]]);
    } else {
      E.push([1080, [[1006, 240], C.LK], 'fora', 'music', 'right']);                                                                 // 18h: beira da lagoa
      home(1230, C.LK, [[1006, 262], [1006, 158], [506, 158]]);                                                                         // 20h30: volta ao Armazém
    }
    up(1320, C.EV);                                                                                                                    // 22h: sobe para o quarto
  }
  // dia da chegada: aparece ao lado da avó durante a apresentação e, depois, segue para onde a rotina mandaria
  const K = S.caleb;
  if (K && K.arrived && K.day === day && K.t > 0) {
    const T0 = K.t, base = E.slice().sort((a, b) => a[0] - b[0]);
    let cur = base[0]; base.forEach(e => { if (e[0] <= T0 + 2) cur = e; });
    const keep = base.filter(e => e[0] > T0 + 2), I = [[T0, [C.INTRO], 'loja', 'idle', 'down']], T1 = T0 + 2, end = cur[1][cur[1].length - 1];
    if (cur[2] === 'loja') I.push([T1, [[104, 100], end], 'loja', cur[3], cur[4]]);
    else if (cur[2] === 'residencia') { I.push([T1, [[104, 100], C.STAIR], 'loja']); I.push([T1 + 3, [[0, 0]], 'residencia']); }
    else { const tin = Math.ceil(pathLen([[110, 104], [110, 170], [152, 170], C.EXIT], C.INTRO) / 18) + 1; I.push([T1, [[110, 104], [110, 170], [152, 170], C.EXIT], 'loja']); I.push([T1 + tin, [C.DOOR, [506, 158], end[0] < 800 ? [668, 158] : [1006, 158], end], 'fora', cur[3], cur[4]]); }
    return [...base.filter(e => e[0] <= T0), ...I, ...keep].sort((a, b) => a[0] - b[0]);
  }
  return E.sort((a, b) => a[0] - b[0]);
}
/* Onde a rotina põe o morador no minuto tm: anda pelos caminhos (18 px por minuto do jogo);
   ao trocar de mapa, aparece na porta do mapa novo e segue dali. */
function routineAt(E, tm) {
  let idx = 0; E.forEach((e, i) => { if (tm >= e[0]) idx = i; });
  const [t0, path, mp, act, dir] = E[idx], prev = E[idx - 1];
  const start = prev && prev[2] === mp ? prev[1][prev[1].length - 1] : path[0];
  const pts = [start, ...path]; let d = Math.max(0, tm - t0) * 18;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0], dy = pts[i][1] - pts[i - 1][1], len = Math.hypot(dx, dy);
    if (d < len) return { where: mp, x: pts[i - 1][0] + dx * d / len, y: pts[i - 1][1] + dy * d / len, moving: true, dir: Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up') };
    d -= len;
  }
  const last = pts[pts.length - 1]; return { where: mp, x: last[0], y: last[1], dir: dir || 'down', act: act || null };
}
const schedCache = { key: '', E: null }, calebCache = { key: '', E: null };
function villagerAt(v, tm) {
  if (DEV && DEV.pose && DEV.pose[v.id]) return DEV.pose[v.id];        // só no modo de desenvolvimento: posar para comparar tamanhos
  if (v.routine === 'iara' && S) { const k = S.day + ':' + isRaining(); if (schedCache.key !== k) { schedCache.key = k; schedCache.E = iaraSchedule(); } return routineAt(schedCache.E, tm); }
  if (v.routine === 'caleb' && S) {
    if (!S.caleb || !S.caleb.arrived) return { where: 'ausente', x: 0, y: 0, dir: 'down' };                    // ainda não chegou à vila
    const k = S.day + ':' + isRaining() + ':' + S.caleb.day + ':' + S.caleb.t; if (calebCache.key !== k) { calebCache.key = k; calebCache.E = calebSchedule(); } return routineAt(calebCache.E, tm);
  }
  let idx = -1; v.sched.forEach((e, i) => { if (tm >= e[0]) idx = i; });
  const n = v.sched.length, wrap = idx < 0; if (wrap) idx = n - 1;
  const e = v.sched[idx];
  if (e[1] === 'loja') return { where: 'loja', x: World.get('loja').keeper[0], y: World.get('loja').keeper[1], dir: 'down' };
  if (e[1] === 'residencia') return { where: 'residencia', x: 506, y: 120, dir: 'down' };   // em casa, no andar de cima do Armazém: não aparece em lugar nenhum
  const prev = v.sched[(idx - 1 + n) % n][1], start = typeof prev === 'string' ? [510, 160] : prev[prev.length - 1];
  const pts = [start, ...e[1]]; let d = wrap ? 1e9 : (tm - e[0]) * 18;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0], dy = pts[i][1] - pts[i - 1][1], len = Math.hypot(dx, dy);
    if (d < len) return { where: v.map || 'fora', x: pts[i - 1][0] + dx * d / len, y: pts[i - 1][1] + dy * d / len, moving: true, dir: Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up') };
    d -= len;
  }
  const last = pts[pts.length - 1]; return { where: v.map || 'fora', x: last[0], y: last[1], dir: 'down' };
}
/* Lúcio só tem o nome conhecido depois da primeira conversa. */
const shownName = v => (v.id === 'lucio' && !(S.lucio && S.lucio.met) ? 'homem da serra' : v.name);
const speaker = v => ({ name: v.id === 'lucio' && !S.lucio.met ? 'Homem da serra' : v.name, look: lookOf(v), portrait: v.portrait });
function actors() {
  const tm = S.time, list = [];
  VILLAGERS.forEach(v => {
    const p = villagerAt(v, tm);
    if (p.where !== map.id) return;
    list.push({ id: v.id, v, art: v.art || null, name: shownName(v), look: lookOf(v), x: p.x, y: p.y, dir: p.dir, moving: p.moving, act: p.act || null, reach: p.where === 'loja' ? 40 : 22, bubble: questMark(v) ? '!' : null });
  });
  return list;
}
