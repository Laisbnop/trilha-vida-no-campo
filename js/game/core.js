/* Jogo — núcleo: atalhos de página ($, el, btn), estado compartilhado, salvamento e nomes.
   Parte de js/game/ (antes era js/game.js). São scripts comuns, carregados em ordem pelo index.html:
   as declarações de nível superior (estado S, P, map etc. e as funções) valem para todos os arquivos, sem
   cópias (não são módulos). O jogo começa em js/game/main.js, o último. */

/* Lógica do jogo: salvamento, criação de personagem, exploração, ferramentas,
   plantações, árvores, galinhas, moradores e amizade, missões, loja, baú,
   guarda-roupa, passagem dos dias e painéis. */

const SAVE_KEY = 'trilha-rpg-save-v4';
const OLD_KEYS = ['trilha-rpg-save-v3', 'trilha-rpg-save-v2', 'trilha-rpg-save-v1'];   // versões com profissões
const $ = id => document.getElementById(id);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const btn = (cls, text, fn) => { const b = el('button', cls, text); b.type = 'button'; b.onclick = fn; return b; };

let S = null, screen = 'title';

/* =====================================================
   SALVAMENTO
   ===================================================== */
const store = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, v) { try { localStorage.setItem(key, v); return true; } catch { return false; /* sem armazenamento: joga sem salvar */ } },
  del(key) { try { localStorage.removeItem(key); } catch { /* ignora */ } },
};
const save = () => { if (!S) return false; const c = calendar(); S.cal = { year: c.year, season: c.si, day: c.day, weekday: c.wd }; return store.set(SAVE_KEY, JSON.stringify(S)); };
const validSave = s => s && s.v === 4 && s.look && typeof s.name === 'string' && Array.isArray(s.inv) && s.farm && s.farm.tiles && s.coop && s.nature && s.quests && s.pos;

function newState(look, name, farmName = '', petSp = null) {
  const seed = Math.floor(Math.random() * 1e9);
  const s = {
    v: 4, look, name, farmName, age: START_AGE, coins: START_COINS, day: 1, time: DAY_START, energy: 100,
    pos: { map: 'fora', x: 100, y: 164, dir: 'down' },
    pet: { sp: petSp, state: 'pending', name: '', offered: 0 }, letterSeen: false, track: null,
    lastNight: 0, seasonal: [], spawnDay: 0, row: 0,
    inv: Array(INV_SIZE).fill(null), sel: 0, chest: Array(CHEST_SIZE).fill(null), can: 10,
    farm: { tiles: {} }, coop: { feed: 0, eggs: 0, hens: [] },
    nature: { trees: {}, rocks: {}, forage: {}, hat: false, cleared: {} }, dmg: {}, stumps: true,
    friends: {}, daily: { talk: {}, gift: {} }, known: {}, scenes: {},
    quests: {}, world: { banco: false }, dummy: 0, intro: false, seed, cropV: 3,
    fish: newFishState(2),
  };
  ['enxada', 'regador', 'machado', 'picareta', 'foice', 'espada'].forEach((id, i) => { s.inv[i] = { id, n: 1 }; });
  // a terra começa tomada por mato, galhos e pedras; perto da casa há um trecho limpo
  let sd = seed; const rnd = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296;
  for (let i = 0; i < World.GRID.cols * World.GRID.rows; i++) {
    const c = i % World.GRID.cols, r = Math.floor(i / World.GRID.cols), p = rnd();
    if ((c < 6 && r < 3) || p > 0.5) continue;
    s.farm.tiles[i] = { k: p < 0.22 ? 'weed' : p < 0.37 ? 'branch' : p < 0.46 ? 'stone' : 'stump' };
  }
  VILLAGERS.forEach(v => { s.friends[v.id] = 0; s.known[v.id] = {}; });
  refreshForage(s);
  return s;
}
/* Pesca: vara recebida, carta de Tomé (dia em que chega), presente guardado (mochila cheia),
   tutorial visto, experiência e espécies descobertas { id: { n, max } }. */
const newFishState = letterDay => ({ rod: false, letterDay, letter: false, pending: false, tut: false, dex: {}, perfect: 0, bait: 0, fiber: false, current: null, v: 2 });
/* Frutos e flores da serra, sorteados a cada dia. */
function refreshMountain(s) {
  let sd = (s.seed + s.day * 104729) >>> 0; const rnd = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296;
  s.nature.mforage = {};
  World.SERRA.forage.forEach((_, i) => { if (rnd() < 0.55) s.nature.mforage[i] = ['amora', 'flor', 'amora'][Math.floor(rnd() * 3)]; });
}
function refreshForage(s) {
  let sd = (s.seed + s.day * 7919) >>> 0; const rnd = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296;
  s.nature.forage = {};
  World.FORAGE.forEach((_, i) => { if (rnd() < 0.6) s.nature.forage[i] = ['amora', 'cogumelo', 'flor', 'flor'][Math.floor(rnd() * 4)]; });
  refreshMountain(s);
}

/* Aparência e nome de um jogo de versão anterior, quando dá para aproveitar. */
const OLD_HAIR = { liso: 'longoLiso', ondulado: 'longoOndulado', cacheado: 'longoCacheado', crespo: 'crespo', trancas: 'trancas', careca: 'careca' };
const OLD_CHARS = { lia: ['f', 's2', 'longoLiso', 'azul'], nina: ['f', 's1', 'longoCacheado', 'rosa'], maya: ['f', 's4', 'longoLiso', 'preto'], caio: ['m', 's3', 'crespo', 'castanho'], teo: ['m', 's2', 'crespo', 'claro'], davi: ['m', 's1', 'curtoLiso', 'loiro'] };
function oldCharacter(o) {
  if (!o || typeof o.name !== 'string' || !o.name.trim()) return null;
  const l = o.look || {}, pre = OLD_CHARS[o.charId];
  const look = Object.assign({}, DEFAULT_LOOK);
  if (pre) Object.assign(look, { gender: pre[0], skin: pre[1], hair: pre[2], hairColor: pre[3] });
  if (l.skin) Object.assign(look, { gender: ['f', 'm', 'n'].includes(l.body) ? l.body : look.gender, skin: l.skin, hair: OLD_HAIR[l.hair] || look.hair, hairColor: l.hairColor || look.hairColor });
  return { name: o.name.trim().slice(0, 14), look };
}
/* Lê o que há no navegador sem alterar nada: { state } | { old } | { broken } | {} */
function inspectSaves() {
  const cur = store.get(SAVE_KEY);
  if (cur) { try { const s = JSON.parse(cur); if (validSave(s)) return { state: s }; } catch { /* aviso abaixo */ } return { broken: true }; }
  for (const key of OLD_KEYS) {
    const raw = store.get(key); if (!raw) continue;
    try { const c = oldCharacter(JSON.parse(raw)); if (c) return { old: c }; } catch { /* aviso abaixo */ }
    return { legacy: true };
  }
  return {};
}
function show(name) { screen = name; ['title', 'create', 'game'].forEach(n => { $('screen-' + n).hidden = n !== name; }); document.body.classList.toggle('playing', name === 'game'); window.scrollTo(0, 0); }

/* =====================================================
   NOMES
   Personagem, fazenda e galinhas: só letras de A a Z (maiúsculas ou minúsculas), sem
   espaços, acentos, números ou símbolos. Vale para o que é digitado, colado ou arrastado:
   o campo é limpo a cada mudança e o nome é conferido de novo antes de salvar.
   O nome do bicho de estimação segue a regra anterior. Nomes de partidas antigas
   não são mudados; só novas entradas e edições seguem a regra.
   ===================================================== */
const STRICT_KINDS = ['name', 'farm', 'hen'];
const NAME_STRICT = /^[A-Za-z]$/, NAME_STRICT_ALL = /^[A-Za-z]+$/;
const NAME_CHAR = /^[\p{L}\p{M}\p{N} .,'’!?&()-]$/u;
const NAME_RULE_MSG = 'Use apenas letras de A a Z, maiúsculas ou minúsculas, sem espaços ou acentos.';
const NAME_MAX = { name: 160, farm: 200, pet: 120, hen: 120 };          // largura máxima, em pixels da fonte das placas (10px)
let measureCtx = null;
/* Largura visual do texto na fonte das placas. A fonte é monoespaçada: no mínimo 10px por letra. */
function textWidth(t) {
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
  measureCtx.font = '10px "Press Start 2P"';
  return Math.max(measureCtx.measureText(t).width, [...t].length * 10);
}
/* Limpa o que foi digitado: tira caracteres não aceitos e corta no limite de largura. Devolve { value, msg }. */
function cleanName(raw, kind) {
  const strict = STRICT_KINDS.includes(kind), src = String(raw == null ? '' : raw);
  let msg = '', v;
  if (strict) { v = [...src].filter(ch => NAME_STRICT.test(ch)).join(''); if (v !== src) msg = NAME_RULE_MSG; }
  else {
    const base = src.replace(/[\t\n\r]/g, ' ');
    v = [...base].filter(ch => NAME_CHAR.test(ch)).join('');
    if (v !== base) msg = 'Use só letras (com ou sem acento), números, espaços e pontuação simples: . , \' ! ? & ( ) -';
    v = v.replace(/ {2,}/g, ' ');
  }
  if (textWidth(v.trim()) > NAME_MAX[kind]) {
    const chars = [...v]; while (chars.length && textWidth(chars.join('').trim()) > NAME_MAX[kind]) chars.pop();
    v = chars.join(''); msg = `Limite atingido: o nome pode ter até ${Math.floor(NAME_MAX[kind] / 10)} letras, para caber nas placas e nas falas.`;
  }
  return { value: v, msg };
}
/* Nome pronto para salvar: não vazio e, nos campos com a regra nova, só letras de A a Z. */
const nameOk = (v, kind = 'name') => { v = String(v == null ? '' : v); return STRICT_KINDS.includes(kind) ? NAME_STRICT_ALL.test(v) && textWidth(v) <= NAME_MAX[kind] : v.trim().length > 0; };
/* Campo de nome com aviso. onChange recebe o texto já limpo. */
function nameField(label, value, kind, placeholder, onChange, id) {
  const box = el('div', 'name-field'), lab = el('label', '', label), input = el('input'), msg = el('div', 'field-msg');
  input.type = 'text'; input.value = value; input.placeholder = placeholder; input.autocomplete = 'off'; input.spellcheck = false; input.maxLength = 30; if (id) { input.id = id; lab.htmlFor = id; }
  input.setAttribute('autocapitalize', 'off'); if (STRICT_KINDS.includes(kind)) { input.pattern = '[A-Za-z]+'; input.setAttribute('inputmode', 'text'); }
  const count = () => { const n = [...input.value.trim()].length, max = Math.floor(NAME_MAX[kind] / 10); return `${n}/${max} letras`; };
  const show = (warn, text) => { msg.textContent = text; msg.classList.toggle('warn', warn); };
  /* nome que já veio preenchido (de uma versão antiga) só é avisado, não alterado */
  if (value && !nameOk(value, kind)) show(true, NAME_RULE_MSG); else show(false, count());
  input.oninput = () => {                                   // digitado, colado, arrastado ou preenchido: tudo passa por aqui
    const r = cleanName(input.value, kind);
    if (r.value !== input.value) input.value = r.value;
    if (r.msg) show(true, r.msg);
    else if (input.value && !nameOk(input.value, kind)) show(true, STRICT_KINDS.includes(kind) ? NAME_RULE_MSG : 'O nome não pode ficar só com espaços.');
    else show(false, count());
    onChange(input.value);
  };
  box.append(lab, input, msg);
  return { box, input, msg };
}
