/* =====================================================
   INVENTÁRIO
   ===================================================== */
/* Coloca n itens no conjunto de espaços; devolve quantos NÃO couberam. */
function addTo(arr, id, n) {
  for (const s of arr) { if (n && s && s.id === id && s.n < STACK && !s.cm) { const k = Math.min(n, STACK - s.n); s.n += k; n -= k; } }
  for (let i = 0; i < arr.length && n; i++) if (!arr[i]) { const k = Math.min(n, STACK); arr[i] = { id, n: k }; n -= k; }
  return n;
}
const canAdd = (id, n = 1) => addTo(S.inv.map(s => s && { id: s.id, n: s.n }), id, n) === 0;
const count = id => S.inv.reduce((a, s) => a + (s && s.id === id ? s.n : 0), 0);
function removeItem(id, n = 1) {
  for (let i = S.inv.length - 1; i >= 0 && n; i--) { const s = S.inv[i]; if (s && s.id === id) { const k = Math.min(n, s.n); s.n -= k; n -= k; if (!s.n) S.inv[i] = null; } }
  renderHotbar();
}
/* Ganha itens do mundo. Se não couber tudo, nada é pego e o jogador é avisado. */
function gain(id, n = 1) {
  if (!canAdd(id, n)) { toast('Mochila cheia'); return false; }
  addTo(S.inv, id, n); floats.push({ icon: id, x: P.x, y: P.y, t0: performance.now() });
  toast(`+${n} ${ITEMS[id].name}`); renderHotbar();
  return true;
}
const equipped = () => S.inv[S.sel];
const owns = id => count(id) > 0 || S.chest.some(s => s && s.id === id);

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

/* =====================================================
   ALVOS DO MOUSE
   Um alvo tem: label, rect [x, y, w, h] (área clicável e destaque),
   near (o que precisa estar ao alcance; padrão = rect), tile (alcance de
   um quadrado em volta), reach (distância máxima) e act (o que o clique faz).
   ===================================================== */
const SWING = 320;                        // duração de um golpe (ms); cliques durante ele são ignorados
const inRect = (r, x, y) => x >= r[0] && x <= r[0] + r[2] && y >= r[1] && y <= r[1] + r[3];
/* Distância dos pés do personagem até um retângulo, em x e em y. */
function gap(r) { const fx = P.x, fy = P.y - 3; return [Math.max(r[0] - fx, 0, fx - (r[0] + r[2])), Math.max(r[1] - fy, 0, fy - (r[1] + r[3]))]; }
function reachable(tg) { const [dx, dy] = gap(tg.near || tg.rect); return tg.tile ? Math.max(dx, dy) <= 14 : Math.hypot(dx, dy) <= (tg.reach || 16); }
const center = r => [r[0] + r[2] / 2, r[1] + r[3] / 2];
function faceTo(x, y) { const dx = x - P.x, dy = y - (P.y - 8); P.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'); }
const bang = (x, y, k) => impacts.push({ x, y, t0: performance.now(), k });

/* O que está sob o ponto (wx, wy) do mundo, do que está mais à frente para o mais ao fundo. */
function targetAt(wx, wy, list) {
  for (const a of list.slice().sort((p, q) => q.y - p.y)) {
    const r = [a.x - 10, a.y + Sprites.WORLD.oy(-31), 20, 1 - Sprites.WORLD.oy(-31) + 1];   // área de clique do tamanho do personagem do mundo (largura generosa)
    if (inRect(r, wx, wy)) return { label: 'Falar com ' + a.name, rect: r, reach: a.reach > 30 ? 30 : 16, act: () => talkTo(a.v) };
  }
  const held = equipped();
  if (isRod(held) && World.waterZone(map, wx, wy)) {
    const c = fishCheck(wx, wy);
    return { label: c.ok ? 'Pescar — segure e solte para lançar' : c.why.replace(/\.$/, ''), rect: [Math.round(wx) - 5, Math.round(wy) - 4, 10, 8], fish: true, fishOk: c.ok, check: c };
  }
  if (map.id === 'fora') {
    if (pet) { const r = [pet.x - 10, pet.y - 18, 20, 19]; if (inRect(r, wx, wy)) return { label: `Fazer carinho em ${S.pet.name}`, rect: r, act: petPet }; }
    for (let i = hens.length - 1; i >= 0; i--) { const h = hens[i], r = [h.x - 7, h.y - 15, 14, 16]; if (inRect(r, wx, wy)) return { label: S.coop.hens[i].name, rect: r, act: () => henMenu(i) }; }
    for (const key in S.farm.tiles) {                     // árvores frutíferas: a copa também é clicável
      if (S.farm.tiles[key].k !== 'tree') continue;
      const q = World.tilePos(+key), r = [q.x - 6, q.y - 30, 28, 46];
      if (inRect(r, wx, wy)) return Object.assign(tileTarget(+key), { rect: r, near: [q.x, q.y, 16, 16] });
    }
    const cleared = S.nature.cleared;
    for (let n = 0; n < World.NTREES.length; n++) {
      if (cleared[n]) continue;
      const [x, y] = World.NTREES[n], stumpNow = !!S.nature.trees[n];
      const r = stumpNow ? [x - 7, y - 10, 14, 12] : [x - 14, y - 48, 28, 52];
      if (!inRect(r, wx, wy)) continue;
      return stumpNow ? hitTarget('s' + n, 'stump', r, r, [x, y - 6], () => { cleared[n] = true; addXp('coleta', SKILL_GAIN.stump, x, y - 20); })
        : hitTarget('t' + n, 'trunk', r, [x - 5, y - 8, 10, 8], [x, y - 12], () => { S.nature.trees[n] = S.day + 4; addXp('coleta', SKILL_GAIN.tree, x, y - 30); });   // XP só quando a árvore cai
    }
    for (let n = 0; n < World.NROCKS.length; n++) {
      if (S.nature.rocks[n]) continue;
      const [x, y] = World.NROCKS[n], r = [x - 10, y - 16, 20, 18];
      if (inRect(r, wx, wy)) return hitTarget('r' + n, 'rock', r, r, [x, y - 8], () => { S.nature.rocks[n] = S.day + 3; });
    }
    for (let n = 0; n < World.FORAGE.length; n++) {
      const id = S.nature.forage[n], [x, y] = World.FORAGE[n], r = [x - 8, y - 12, 16, 14];
      if (id && inRect(r, wx, wy)) return { label: 'Colher ' + ITEMS[id].name.toLowerCase(), rect: r, act: () => { if (gain(id)) { delete S.nature.forage[n]; addXp('coleta', SKILL_GAIN.forage, x, y - 16); bang(x, y - 6, 'leaf'); save(); } } };
    }
    for (let n = S.seasonal.length - 1; n >= 0; n--) {
      const o = S.seasonal[n], r = [o.x - 8, o.y - 14, 16, 16];
      if (inRect(r, wx, wy)) return { label: 'Colher ' + ITEMS[o.id].name.toLowerCase(), rect: r, act: () => collectSeasonal(o) };
    }
    const [hx, hy] = World.SPOT.hat, hr = [hx - 8, hy - 12, 16, 14];
    if (S.nature.hat && inRect(hr, wx, wy)) return { label: 'Pegar o chapéu velho', rect: hr, act: () => { if (gain('chapeu_tome')) { S.nature.hat = false; save(); } } };
  }
  if (map.id === 'montanha') {
    if (keepsakeVisible()) { const [x, y] = World.SERRA.keepsake, r = [x - 8, y - 10, 16, 12]; if (inRect(r, wx, wy)) return { label: 'Pegar o apito de madeira', rect: r, act: () => { if (gain('apito')) { S.lucio.found = true; save(); } } }; }
    for (let n = 0; n < World.SERRA.forage.length; n++) {
      const id = S.nature.mforage[n], [x, y] = World.SERRA.forage[n], r = [x - 8, y - 12, 16, 14];
      if (id && inRect(r, wx, wy)) return { label: 'Colher ' + ITEMS[id].name.toLowerCase(), rect: r, act: () => { if (gain(id)) { delete S.nature.mforage[n]; addXp('coleta', SKILL_GAIN.forage, x, y - 16); bang(x, y - 6, 'leaf'); save(); } } };
    }
  }
  if (map.id === 'fora' && S.iara.ev3 === 'seek') {           // 3 corações: o detalhe que quase ninguém olha
    const { x, y, label } = IARA.detail, r = [x - 7, y - 9, 14, 12];
    if (inRect(r, wx, wy)) return { label, rect: r, act: () => run(async () => { S.iara.ev3 = 'found'; save(); await say('narr', 'Entre duas pedras da praça, uma florzinha miúda cresceu sozinha. Iara vai querer saber que você achou!'); }) };
  }
  if (map.id === 'casa' && S.house.quadro) {
    const r = [157, 15, 28, 22];
    if (inRect(r, wx, wy)) return { label: 'Quadro da fonte', rect: r, near: [150, 70, 42, 20], act: () => run(async () => {
      if (await ask('O quadro da fonte que Iara pintou para você. Tirar da parede?', ['Deixar na parede', 'Tirar e guardar']) !== 1) return;
      if (!canAdd('quadro_fonte')) return say('narr', 'Sua mochila está cheia. Abra espaço para guardar o quadro.');
      gain('quadro_fonte'); S.house.quadro = null; save();
    }) };
  }
  for (const o of map.objs) {
    const r = o.hit || [o.x - 10, o.y - 20, 20, 22];
    if (inRect(r, wx, wy)) { const a = objAction(o); if (a) return Object.assign({ rect: r }, a); }
  }
  if (map.id === 'fora') { const i = World.tileAt(wx, wy); if (i >= 0) return tileTarget(i); }
  return null;
}

/* Objeto que quebra com vários golpes da ferramenta certa. O dano fica salvo em S.dmg. */
function hitTarget(key, kind, rect, near, pt, onBreak, tile) {
  const R = RESIST[kind], it = equipped(), id = it && it.id, d = S.dmg[key] || 0;
  const status = d ? ` (${R.hp - d}/${R.hp})` : '';
  if (!R.tools.includes(id)) return { rect, near, tile, reach: 18, label: `${R.name}${status} — use ${TOOL_NAME[R.tools[0]]}`, act: () => tip(`${R.name}: use ${TOOL_NAME[R.tools[0]]}. Escolha na barra de itens.`) };
  return { rect, near, tile, reach: 18, label: `${R.verb} ${R.name.toLowerCase()}${status}`, act: () => strike(key, R, id, pt, onBreak) };
}
/* Um golpe: gasta energia, anima, solta lascas e reduz a resistência.
   No último, remove o objeto e entrega o que ele rende, uma única vez. */
function strike(key, R, id, [x, y], onBreak) {
  const d = (S.dmg[key] || 0) + 1, last = d >= R.hp;
  if (S.energy < toolEnergy(id, R.energy)) return tip('Sem energia para outro golpe. Coma algo ou durma para recuperar.');
  if (last && R.drop && !canAdd(R.drop[0], R.drop[1])) return tip('Mochila cheia: abra espaço antes do último golpe.');
  useTool(id, R.energy);
  bang(x, y, R.fx); shake = { key, t0: performance.now() };
  if (last) { delete S.dmg[key]; onBreak(); if (R.drop) gain(R.drop[0], R.drop[1]); }
  else S.dmg[key] = d;
  save();
}

const SEASON_IN = ['na Primavera', 'no Verão', 'no Outono', 'no Inverno'];
const seasonList = l => { const n = l.map(i => SEASON_IN[i]); return n.length > 1 ? n.slice(0, -1).join(', ') + ' e ' + n[n.length - 1] : n[0]; };
/* A planta cresce nesta estação? (sem seasons: o ano inteiro) */
const cropInSeason = (crop, si = calendar().si) => { const C = CROPS[crop]; return !C.seasons || C.seasons.includes(si); };
/* Semente plantada que ainda não germinou (nada cresceu e nunca foi colhida). */
const dormantSeed = o => !!(o && o.crop && !o.dead && !(o.g > 0) && !(o.cyc > 0));
/* Texto de uma plantação: estágio, noites regadas, rebrota e rega. */
function cropText(o) {
  const C = CROPS[o.crop], st = cropState(o);
  if (dormantSeed(o) && !cropInSeason(o.crop)) return `Semente de ${C.name.toLowerCase()} esperando a estação: cresce ${seasonText(C.seasons)}`;
  if (st.ripe) return `${C.name}: pronto para colher`;
  const fase = st.regrow ? `nova colheita em ${st.left} dia(s) regado(s)` : C.stages ? `estágio ${st.stage} de 5 · ${st.left} dia(s) regado(s) para colher` : `${Math.min(o.g || 0, C.days)} de ${C.days} dias`;
  return `${C.name}: ${fase}${o.w ? ', regado' : ', precisa de água'}`;
}
/* Planta a semente escolhida no canteiro (gasta 1 semente; sem energia). */
function plantSeed(i, id) {
  const o = S.farm.tiles[i], it = S.inv[S.sel];
  if (!o || o.k !== 'soil' || o.crop || !it || it.id !== id) return;
  useTool(id, 0); removeItem(id); o.crop = ITEMS[id].crop; o.g = 0; o.cyc = 0;
  const q = World.tilePos(i); bang(q.x + 8, q.y + 8, 'soil'); qEvent('plant'); save();
}
/* O que um clique faz em um quadrado da fazenda, conforme o item selecionado. */
function tileTarget(i) {
  const o = S.farm.tiles[i], q = World.tilePos(i), rect = [q.x, q.y, 16, 16], cx = q.x + 8, cy = q.y + 8;
  const it = equipped(), id = it && it.id, kind = id && ITEMS[id].kind;
  const T = (label, act) => ({ label, act, rect, tile: true });
  if (o && RESIST[o.k]) return hitTarget('f' + i, o.k, rect, rect, [cx, cy], () => { delete S.farm.tiles[i]; }, true);
  if (o && o.k === 'soil' && o.crop && o.dead) {                     // pé seco (fim da estação): só a foice limpa
    const nm = CROPS[o.crop].name.toLowerCase();
    if (id === 'foice') return T(`Remover pé seco de ${nm}`, () => { if (!useTool('foice', 1)) return; S.farm.tiles[i] = { k: 'soil' }; bang(cx, cy, 'leaf'); toast('Pé seco removido'); save(); });
    return T(`Pé seco de ${nm} — use a foice`, () => tip(`Pé seco de ${nm}: a estação acabou. Use a foice para limpar o canteiro.`));
  }
  if (o && o.k === 'soil' && dormantSeed(o) && !cropInSeason(o.crop) && id === 'foice') {   // semente fora de estação: a foice limpa (sem devolver)
    const nm = CROPS[o.crop].name.toLowerCase();
    return T(`Remover semente de ${nm}`, () => { if (!useTool('foice', 1)) return; S.farm.tiles[i] = { k: 'soil' }; bang(cx, cy, 'leaf'); toast('Semente removida'); save(); });
  }
  if (o && o.k === 'soil' && o.crop && cropState(o).ripe) return T('Colher ' + CROPS[o.crop].name.toLowerCase(), () => {
    const C = CROPS[o.crop];
    if (!gain(o.crop, C.yield || 1)) return;                         // mochila cheia: o fruto continua na planta
    addXp('cultivo', SKILL_GAIN.harvest[o.crop] || 0, cx, cy - 10);   // uma vez por colheita (a quantidade não multiplica)
    if (C.regrow) { o.cyc = (o.cyc || 0) + 1; o.g = 0; }             // o pé fica e começa a próxima produção
    else S.farm.tiles[i] = { k: 'soil' };
    P.hop = performance.now() + 300; bang(cx, cy, 'leaf'); qEvent('harvest'); save();
  });
  if (o && o.k === 'tree') {
    const TR = TREES[o.sp];
    if (o.fruit) return T(`Colher ${ITEMS[TR.fruit].name.toLowerCase()}s`, () => { if (!gain(TR.fruit, TR.n)) return; o.fruit = false; o.cool = 0; bang(cx, q.y - 14, 'leaf'); save(); });
    const info = o.age < TR.grow ? `${TR.name} jovem: ${o.age} de ${TR.grow} dias para ficar adulta. Árvores não precisam de rega.` : `${TR.name} adulta. Os frutos voltam ${TR.every - (o.cool || 0) <= 1 ? 'amanhã' : `em ${TR.every - (o.cool || 0)} dias`}.`;
    return T(TR.name, () => run(() => say('narr', info)));
  }
  if (kind === 'sapling') {
    const ok = !o && [-1, 0, 1].every(dr => [-1, 0, 1].every(dc => { const c = (i % World.GRID.cols) + dc, r = Math.floor(i / World.GRID.cols) + dr; const n = S.farm.tiles[r * World.GRID.cols + c]; return c < 0 || c >= World.GRID.cols || !n || n.k !== 'tree'; }));
    return ok ? T('Plantar ' + ITEMS[id].name.toLowerCase(), () => { useTool(id, 0); removeItem(id); S.farm.tiles[i] = { k: 'tree', sp: ITEMS[id].tree, age: 0, fruit: false, cool: 0 }; bang(cx, cy, 'soil'); toast('Muda plantada'); save(); })
      : T('Sem espaço para a muda', () => tip('Não há espaço aqui. A muda precisa de grama livre, sem terra arada, entulho ou outra árvore encostada.'));
  }
  if (id === 'enxada') return o ? T('Terra já preparada', () => tip('Esta terra já está preparada.'))
    : T('Arar a terra', () => { if (!useTool(id, 2)) return; S.farm.tiles[i] = { k: 'soil' }; bang(cx, cy, 'soil'); qEvent('till'); save(); });
  if (id === 'regador' && o && o.k === 'soil') return o.w ? T(o.crop ? cropText(o) : 'Já regado', () => tip('Esta terra já está regada hoje.'))
    : T(`Regar (água: ${S.can}/10)`, () => { if (!S.can) return tip('Regador vazio: encha no lago.'); if (!useTool(id, 1)) return; S.can--; o.w = 1; bang(cx, cy, 'water'); if (o.crop) qEvent('water'); renderHotbar(); save(); });
  if (kind === 'seed') {
    if (o && o.k === 'soil' && !o.crop) {
      const C = CROPS[ITEMS[id].crop], si = calendar().si;
      if (C.seasons && !C.seasons.includes(si)) return T(`Plantar ${C.name.toLowerCase()} (fora de estação)`, () => {   // planta, mas só germina na estação certa
        run(async () => { if (await ask('Esta semente não cresce nesta estação. Plantar mesmo assim?', ['Sim', 'Não']) === 0) plantSeed(i, id); });
      });
      return T('Plantar ' + C.name.toLowerCase(), () => {
        const daysLeft = SEASON_DAYS - calendar().day;                 // manhãs que ainda restam nesta estação
        if (C.seasonal && C.days > daysLeft && !cropInSeason(ITEMS[id].crop, (si + 1) % 4)) {   // só avisa se a próxima estação não serve
          run(async () => { if (await ask(`Não dá tempo: ${C.name.toLowerCase()} precisa de ${C.days} dias regados e a estação acaba em ${daysLeft + 1} dia(s). O pé seca na troca de estação. Plantar mesmo assim?`, ['Sim, plantar', 'Não']) === 0) plantSeed(i, id); });
          return;
        }
        plantSeed(i, id);
      });
    }
    if (!o) return T('Are a terra antes de plantar', () => tip('Prepare a terra com a enxada antes de plantar.'));
  }
  if (o && o.k === 'soil' && o.crop) { const info = cropText(o); return T(info, () => tip(info)); }
  if (o && o.k === 'soil') return T('Terra preparada', () => tip('Terra pronta: escolha uma semente na barra e clique para plantar.'));
  return null;                                              // grama comum sem ferramenta útil: nada a fazer
}

function objAction(o) {
  const it = equipped(), id = it && it.id;
  switch (o.kind) {
    case 'door':
      if (o.to === 'tenda' && !S.lucio.permit) return { label: S.lucio.met ? 'Tenda de Lúcio — pedir para entrar' : 'Tenda', act: () => askTent(o.to) };
      return { label: o.to === 'tenda' ? 'Entrar na tenda de Lúcio' : o.label, act: () => { const m = World.get(o.to); travel(o.to, m.spawn.x, m.spawn.y, 'up'); } };
    case 'exit': return { label: o.label || 'Sair', act: () => { const par = map.parent || 'fora', d = World.get(par).doors[map.id]; travel(par, d.x, d.y, 'down'); } };
    case 'lona': return lonaAction();
    case 'fire': return qActive().includes('fogo') ? { label: 'Sentar junto ao fogo', act: fireScene }
      : { label: 'Fogueira', act: () => run(() => say('narr', S.time >= 1020 || S.time < 360 ? 'O fogo estala baixinho. Os troncos em volta estão gastos de tanto servir de banco.' : 'Cinzas frias dentro de um círculo de pedras. À noite, aqui tem fogo.')) };
    case 'text': return { label: o.label, act: () => run(() => say('narr', o.text)) };
    case 'sign': return { label: o.label, act: () => run(() => say('narr', `Na placa, pintado à mão: "{fazenda}". Embaixo, em letras menores: terra do Vô ${AVO}. A ${VILA} fica a leste, seguindo a estrada.`)) };
    case 'bed': return { label: 'Dormir', act: bed };
    case 'chest': return { label: 'Abrir o baú', act: () => openModal('bau') };
    case 'wardrobe': return { label: 'Guarda-roupa e espelho', act: () => openModal('roupa') };
    case 'counter': return { label: 'Balcão do Armazém', reach: 20, act: shop };
    case 'water': return id === 'regador' ? { label: `Encher o regador (${S.can}/10)`, reach: 18, act: () => { useTool('regador', 0); S.can = 10; bang(P.x, P.y - 16, 'water'); toast('Regador cheio'); renderHotbar(); save(); } }
      : { label: 'Lago', reach: 18, act: () => run(() => say('narr', 'Água limpa do lago. Com o regador na mão, clique na água para enchê-lo.')) };
    case 'dummy': return id === 'espada' ? { label: 'Golpear o boneco', act: () => {
      if (S.energy < 1) return tip('Sem energia para outro golpe. Coma algo ou durma para recuperar.');
      useTool('espada', 1); dummyHit = performance.now() + 120; bang(World.SPOT.dummy[0], World.SPOT.dummy[1] - 16, 'spark'); S.dummy++; toast(`Golpe certeiro! (${S.dummy})`);
    } } : { label: 'Boneco de treino — use a espada', act: () => tip('Equipe a espada na barra de itens para treinar no boneco.') };
    case 'bench': return { label: 'Banco da praça', act: () => run(() => say('narr', S.world.banco ? 'O banco da praça, firme de novo. Na madeira, um entalhe discreto: "consertado com a ajuda de ' + S.name + '".' : 'O banco da praça está quebrado: falta uma tábua e um dos pés cedeu.')) };
    case 'feeder': return { label: count('racao') ? `Colocar ração (${S.coop.feed} no comedouro)` : `Comedouro (${S.coop.feed} porções)`, act: feed };
    case 'nest': return { label: S.coop.eggs ? `Pegar ovos (${S.coop.eggs})` : 'Ninhos', act: nest };
  }
  return null;
}

/* Anima a ferramenta e gasta energia. Devolve false se faltar energia. */
function useTool(id, energy) {
  energy = toolEnergy(id, energy);                       // Cultivo (enxada, regador) e Coleta (machado) reduzem o gasto
  if (S.energy < energy) { toast('Sem energia. Durma para recuperar.'); return false; }
  S.energy = +(S.energy - energy).toFixed(4);
  const now = performance.now(); P.tool = { id, t0: now }; P.work = now + SWING;
  renderHud();
  return true;
}

/* =====================================================
   ENTRADA: TECLADO E TOQUE
   ===================================================== */
const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };
const typing = e => /^(INPUT|TEXTAREA)$/.test(e.target.tagName);
/* Ordem de prioridade: carta → resumo do dia → conversa/escolha → pausa → menu → exploração.
   Atalhos ignoram a repetição de tecla segurada e não valem enquanto se digita. */
const dialogOpen = () => !$('dialog').hidden;
window.addEventListener('keydown', e => {
  if (screen !== 'game' || !S) return;
  const k = e.key, low = k.length === 1 ? k.toLowerCase() : k;
  // 1) carta aberta: E ou Esc só fecham a carta
  if (!$('seed-info').hidden) { if (['Escape', 'Enter', ' '].includes(k) || low === 'e') { e.preventDefault(); if (!e.repeat) closeSeedInfo(); } return; }
  if (!$('painting').hidden) { if (['Escape', 'Enter', ' '].includes(k) || low === 'e') { e.preventDefault(); if (!e.repeat) $('painting-ok').click(); } return; }
  if (!$('letter').hidden) { if ((k === 'Escape' || low === 'e') && !e.repeat) { e.preventDefault(); $('letter-ok').click(); } return; }
  if (typing(e)) return;
  // 2) resumo do dia: só o botão (Enter no botão em foco)
  if (!$('summary').hidden) return;
  // 3) conversa: E/Espaço/Enter avançam; em "Sim/Não", E e Esc valem "Não"; escolhas obrigatórias não se cancelam
  if (dialogOpen()) {
    if (e.repeat) return;
    if ((k === 'Escape' || low === 'e') && cancelChoice) { e.preventDefault(); cancelChoice(); return; }
    if ((low === 'e' || k === ' ' || k === 'Enter') && onAdvance) { e.preventDefault(); onAdvance(); }
    return;
  }
  // 3b) pescando: Espaço fisga e puxa, Esc recolhe; os demais atalhos ficam bloqueados
  if (fishing) {
    if (k === ' ') { e.preventDefault(); if (!e.repeat) finSet('key', true); return; }           // Espaço é o mesmo comando do botão esquerdo
    if (k === 'Escape') { e.preventDefault(); if (!e.repeat) cancelFishing(); return; }
    if (fishing.phase === 'show' && /^Arrow(Left|Right|Up|Down)$/.test(k)) { e.preventDefault(); catchArrow(/Left|Up/.test(k) ? -1 : 1); return; }
    if (k === 'Tab' || /^Arrow/.test(k) || ['e', 'f', 'm', 'p', 'q'].includes(low)) e.preventDefault();
    return;
  }
  // 4) pausa
  if (paused) { if (!e.repeat && (k === 'Escape' || low === 'p')) { e.preventDefault(); setPause(false); } return; }
  const menuOpen = !$('modal').hidden;
  if (['e', 'f', 'm', 'p', 'q'].includes(low) || k === 'Escape') {
    e.preventDefault();
    if (e.repeat) return;
    if (k === 'Escape' || low === 'e') { if (menuOpen) closeModal(); else openMenu('mochila'); return; }
    if (low === 'f') return toggleTab('diario');
    if (low === 'm') return toggleTab('mapa');
    if (low === 'p') { if (!menuOpen) setPause(true); return; }
    if (low === 'q') { if (!menuOpen && !blocked()) useDoor(); return; }
  }
  // 5) dentro do menu, Tab e as demais teclas servem para navegar nos controles
  if (menuOpen) return;
  // 6) exploração
  if (k === 'Tab') { e.preventDefault(); return; }             // Tab não faz nada no jogo (nos menus continua navegando entre os controles)
  if (/^Arrow|^ $/.test(k)) e.preventDefault();               // as setas e o espaço não rolam a página
  if (k === ' ' && !e.repeat && isRod(equipped()) && !blocked() && !P.work) { keyCast(); return; }   // Espaço com a vara: lança para onde o personagem olha
  if (KEYMAP[k]) { keys[KEYMAP[k]] = true; return; }
  if (/^[0-9]$/.test(k) && !blocked()) { selectSlot(k === '0' ? 9 : +k - 1); return; }
});
window.addEventListener('keyup', e => { if (KEYMAP[e.key]) keys[KEYMAP[e.key]] = false; if (e.key === ' ') { if (fishing) e.preventDefault(); finSet('key', false); } });
window.addEventListener('blur', () => { Object.keys(keys).forEach(k => { keys[k] = false; }); });
document.querySelectorAll('[data-dir]').forEach(b => {
  const set = v => e => { e.preventDefault(); keys[b.dataset.dir] = v; };
  b.addEventListener('pointerdown', set(true)); ['pointerup', 'pointerleave', 'pointercancel'].forEach(n => b.addEventListener(n, set(false)));
  b.addEventListener('contextmenu', e => e.preventDefault());
});

/* Mouse e toque no cenário. A posição vira coordenada do mundo considerando a câmera
   e o tamanho em que o canvas aparece na tela. */
let mouse = null;
const scene = $('scene');
const setMouse = e => { const r = scene.getBoundingClientRect(); mouse = { fx: (e.clientX - r.left) / r.width, fy: (e.clientY - r.top) / r.height }; };
const mouseWorld = () => { const c = World.camera(map, P.x, P.y); return [c.x + mouse.fx * World.VW, c.y + mouse.fy * World.VH]; };
scene.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') setMouse(e); });
scene.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') mouse = null; });
scene.addEventListener('contextmenu', e => e.preventDefault());
scene.addEventListener('pointerdown', e => {
  if (screen !== 'game' || !S || !map) return;
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  e.preventDefault();
  setMouse(e);
  if (fishing) return;                                                       // pescando: o botão esquerdo é tratado pelo comando único da pesca
  if (blocked() || P.work || performance.now() - menuClosedT < 200) return;   // menu/conversa aberta, golpe em andamento ou menu recém-fechado: o clique não conta
  const [wx, wy] = mouseWorld(), tg = targetAt(wx, wy, actors());
  if (tg && tg.fish) return startCharge(tg.check);
  if (!tg) { const it = equipped(); if (it && it.id === 'espada') { faceTo(wx, wy); useTool('espada', 0); } else if (isRod(it) && hasWater(map)) tip('Vara na mão: segure o clique sobre a água, perto da margem, e solte para lançar.'); else if (it && isFood(it.id)) askEat(); return; }
  if (!reachable(tg)) return tip(`Longe demais: chegue mais perto de ${tg.label.split(' — ')[0].replace(/ \(.*\)$/, '').replace(/^(Falar com|Entrar:) /, '').toLowerCase()}.`);
  const [cx, cy] = center(tg.near || tg.rect); faceTo(cx, cy);
  if (tg.act) tg.act();
});
scene.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') setTimeout(() => { mouse = null; }, 700); });
// no toque, o navegador gera um clique extra ao soltar o dedo; ele não pode cair no painel que acabou de abrir
scene.addEventListener('touchend', e => { if (e.cancelable) e.preventDefault(); }, { passive: false });

let lastTip = '', lastTipT = 0;
/* Orientação curta, sem repetir a mesma mensagem em sequência. */
function tip(text) { const now = performance.now(); if (text === lastTip && now - lastTipT < 1200) return; lastTip = text; lastTipT = now; toast(text); }
/* A barra de ferramentas mostra uma das 3 linhas da mochila; os botões 1, 2 e 3 ao lado dela trocam a linha mostrada. */
function selectSlot(i) { if (fishing) return; S.sel = S.row * HOTBAR + i; renderHotbar(); save(); }
function showRow(r) { if (fishing || r === S.row) return; S.row = r; renderHotbar(); save(); }
/* Clique na barra: só escolhe o item (comer é com um clique novo numa área livre do cenário). */
function hotbarClick(i) {
  if (fishing) return tip('Termine a pesca ou recolha a linha (Esc) antes de trocar de item.');
  if (busy) return;
  const s2 = S.inv[S.row * HOTBAR + i];
  selectSlot(i);
  if (s2 && isFood(s2.id)) tip(`${ITEMS[s2.id].name} na mão. Clique numa área livre do cenário para comer (+${ITEMS[s2.id].food} de energia).`);
}
/* Comer: só os itens da lista EDIBLE. Um clique numa área livre pergunta antes; "Sim" come
   exatamente uma unidade. Com a pergunta aberta o jogo para (relógio, ferramentas, passos). */
const isFood = id => EDIBLE.includes(id) && !!ITEMS[id] && ITEMS[id].food > 0;
const foodName = s2 => ITEMS[s2.id].name + (s2.cm ? ` (${s2.cm} cm)` : '');
function askEat() {
  const idx = S.sel, ref = S.inv[idx];
  if (!ref || !isFood(ref.id) || busy || P.work || fishing) return;
  if (S.energy >= MAX_ENERGY) return tip('Sua energia já está cheia. Guarde o alimento para depois.');
  const it = ITEMS[ref.id];
  run(async () => {
    const c = await ask(it.eatAsk || `Comer ${foodName(ref)}? Recupera ${it.food} de energia.`, ['Sim', 'Não']);
    if (c === 0) eatNow(idx, ref);
  });
}
/* Come uma unidade da pilha confirmada (se ela ainda estiver lá). */
function eatNow(idx, ref) {
  if (S.inv[idx] !== ref || !(ref.n > 0) || !isFood(ref.id)) return false;
  if (S.energy >= MAX_ENERGY) { tip('Sua energia já está cheia.'); return false; }
  const it = ITEMS[ref.id], before = S.energy;
  S.energy = Math.min(MAX_ENERGY, S.energy + it.food);
  ref.n--; if (ref.n <= 0) S.inv[idx] = null;
  const now = performance.now(); P.eat = { id: ref.id, t0: now }; P.work = now + EAT_MS; P.tool = null;
  toast(`Você comeu ${it.name.toLowerCase()}: +${Math.round(S.energy - before)} de energia`);
  renderHotbar(); renderHud(); save();
  return true;
}
const EAT_MS = 700;
/* Q: abre a porta (ou saída) logo à frente, se estiver ao alcance. */
function useDoor() {
  const F = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[P.dir];
  let best = null;
  for (const o of map.objs) {
    if (o.kind !== 'door' && o.kind !== 'exit') continue;
    const r = o.hit || [o.x - 10, o.y - 20, 20, 22], a = objAction(o); if (!a) continue;
    const tg = Object.assign({ rect: r }, a);
    if (!reachable(tg)) continue;
    const [cx, cy] = center(r), dx = cx - P.x, dy = cy - (P.y - 8), dot = dx * F[0] + dy * F[1];
    if (dot < -2) continue;                                         // tem que estar à frente
    const d = Math.hypot(dx, dy); if (!best || d < best.d) best = { d, tg };
  }
  if (!best) return tip('Nenhuma porta à sua frente. Chegue perto e vire-se para ela.');
  best.tg.act();
}


/* =====================================================
   DIÁLOGO
   ===================================================== */
let onAdvance = null, typer = 0;
/* Retrato do diálogo. Quem tem retrato próprio (Lúcio) usa a expressão pedida. */
function setSpeaker(who, expr) {
  const sp = who === 'narr' ? { name: '', look: null } : who, pc = $('portrait');
  $('dlg-who').textContent = sp.name; $('dlg-who').hidden = !sp.name;
  pc.hidden = !sp.look;
  if (sp.look || sp.portrait) {
    const make = Sprites.PORTRAITS[sp.portrait] || Sprites.PORTRAITS._reserva, src = make(expr || 'neutro');
    if (pc.width !== src.width) { pc.width = src.width; pc.height = src.height; }
    pc.dataset.expr = expr || 'neutro'; pc.dataset.who = Sprites.PORTRAITS[sp.portrait] ? sp.portrait : '_reserva'; pc.classList.add('square');
    const g = pc.getContext('2d'); g.clearRect(0, 0, pc.width, pc.height); g.drawImage(src, 0, 0);
  }
  $('dlg-text').classList.toggle('narr', who === 'narr');
}
/* "[contente]Texto" → expressão + texto. */
const splitExpr = t => { const m = /^\[(neutro|desconfiado|contente|emocionado|concentrada|triste|surpresa|sorriso|envergonhado)\]/.exec(t); return m ? [m[1], t.slice(m[0].length)] : [null, t]; };
function say(who, text) {
  return new Promise(resolve => {
    const [expr, rest] = splitExpr(String(text)); text = fmt(rest); setSpeaker(who, expr);
    $('dlg-choices').replaceChildren(); $('dlg-form').hidden = true; $('dlg-more').hidden = false;
    const box = $('dlg-text'), myRun = dlgRun; let n = 0;
    clearInterval(typer); box.textContent = ''; shownRun = myRun;
    const finish = () => { clearInterval(typer); typer = 0; if (dlgRun === myRun) box.textContent = text; };
    typer = setInterval(() => { if (dlgRun !== myRun) return finish(); n += 2; box.textContent = text.slice(0, n); if (n >= text.length) finish(); }, 16);
    onAdvance = () => { if (dlgRun !== myRun) return; if (typer) finish(); else { onAdvance = null; resolve(); } };
  });
}
/* Pergunta com opções, sem precisar avançar o texto antes. */
/* Confirmação Sim/Não: E e Esc valem "Não". */
function ask(text, labels) { return choose(labels, labels.findIndex(l => /^Não\b/.test(l)), { who: 'narr', text }); }
/* cancel = índice da opção que E/Esc escolhem (ou -1: escolha obrigatória, sem atalho). */
let cancelChoice = null;
/* prompt = { who, text }: quem pergunta e o quê. Sem prompt, as opções só podem
   aparecer depois de uma fala desta mesma conversa (nunca com o conteúdo da anterior). */
function choose(labels, cancel = -1, prompt = null) {
  return new Promise(resolve => {
    if (prompt) { const [expr, rest] = splitExpr(String(prompt.text)); setSpeaker(prompt.who, expr); clearInterval(typer); typer = 0; $('dlg-text').textContent = fmt(rest); shownRun = dlgRun; }
    else if (shownRun !== dlgRun) { setSpeaker('narr'); clearInterval(typer); typer = 0; $('dlg-text').textContent = ''; }
    $('dlg-form').hidden = true;
    onAdvance = null; $('dlg-more').hidden = true;
    const box = $('dlg-choices'); box.replaceChildren();
    const pick = i => { cancelChoice = null; box.replaceChildren(); resolve(i); };
    labels.forEach((label, i) => box.append(btn('btn', fmt(label), e => { e.stopPropagation(); pick(i); })));
    cancelChoice = cancel >= 0 ? () => pick(cancel) : null;
    box.firstChild.focus();
  });
}
/* Pede um nome curto (galinha, bicho). Valida como os outros nomes; vazio usa o padrão. */
/* Pergunta um nome na caixa de diálogo. kind = regra de nome ('hen' só letras de A a Z;
   'pet' a regra anterior). suggest vem preenchido (Enter aceita); keep = nome atual,
   mantido se o campo ficar vazio (renomear sem mudar). Nome vazio ou inválido não passa. */
function askText(who, text, suggest, kind = 'pet', keep = null) {
  return new Promise(resolve => {
    { const [expr, rest] = splitExpr(String(text)); setSpeaker(who, expr); clearInterval(typer); typer = 0; $('dlg-text').textContent = fmt(rest); shownRun = dlgRun; }
    onAdvance = null; $('dlg-more').hidden = true; $('dlg-choices').replaceChildren();
    const form = $('dlg-form'), input = $('dlg-input'), msg = $('dlg-msg'); form.hidden = false;
    const strict = STRICT_KINDS.includes(kind);
    input.value = strict && keep === null && nameOk(suggest, kind) ? suggest : ''; input.placeholder = keep !== null ? keep : suggest; msg.textContent = ''; input.focus();
    input.oninput = () => { const r = cleanName(input.value, kind); if (r.value !== input.value) input.value = r.value; msg.textContent = r.msg; };
    form.onsubmit = e => {
      e.preventDefault();
      const v = cleanName(input.value, kind).value.trim();
      if (!v && keep !== null) { done(keep); return; }
      if (!v && !strict) { done(suggest); return; }          // bicho de estimação: vazio usa a sugestão, como antes
      if (!nameOk(v, kind)) { msg.textContent = v || !STRICT_KINDS.includes(kind) ? (STRICT_KINDS.includes(kind) ? NAME_RULE_MSG : 'Digite um nome.') : 'Digite um nome. ' + NAME_RULE_MSG; input.focus(); return; }
      done(v);
    };
    const done = v => { form.hidden = true; form.onsubmit = null; input.oninput = null; input.blur(); msg.textContent = ''; resolve(v); };
  });
}
$('dlg-form').addEventListener('submit', e => e.preventDefault());     // nunca recarrega a página, mesmo com Enter repetido
$('dialog').addEventListener('click', e => { if (!e.target.closest('button, input, form') && onAdvance) onAdvance(); });
/* Cada conversa tem um número. Ao começar e ao terminar, a caixa é limpa (nome,
   retrato, texto, opções), e falas, digitação ou cliques atrasados de uma conversa
   antiga não conseguem mexer na seguinte. Só uma conversa por vez. */
let dlgRun = 0, shownRun = -1;
function clearDialog() {
  clearInterval(typer); typer = 0; onAdvance = null; cancelChoice = null;
  $('dlg-who').textContent = ''; $('dlg-who').hidden = true; $('portrait').hidden = true;
  $('dlg-text').textContent = ''; $('dlg-choices').replaceChildren(); $('dlg-form').hidden = true; $('dlg-more').hidden = true;
}
async function run(flow) {
  if (busy) return;
  busy = true; dlgRun++; clearDialog(); $('dialog').hidden = false; $('dock').hidden = true;
  try { await flow(); }
  finally { busy = false; dlgRun++; clearDialog(); $('dialog').hidden = true; $('dock').hidden = false; save(); renderHud(); renderHotbar(); }
}
async function sayAll(who, lines) { for (const l of lines) await say(who, l); }
function toast(text) { const t = el('div', 'toast', text); $('toasts').append(t); while ($('toasts').children.length > 4) $('toasts').firstChild.remove(); setTimeout(() => t.remove(), 2300); }


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
