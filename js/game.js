/* Lógica do jogo: salvamento, criação de personagem, exploração, ferramentas,
   plantações, árvores, galinhas, moradores e amizade, missões, loja, baú,
   guarda-roupa, passagem dos dias e painéis. */

(() => {
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
      quests: {}, world: { banco: false }, dummy: 0, intro: false, seed,
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
     NOMES: validação comum (personagem, fazenda, galinhas e bicho)
     ===================================================== */
  const NAME_CHAR = /^[\p{L}\p{M}\p{N} .,'’!?&()-]$/u;
  const NAME_MAX = { name: 160, farm: 200, pet: 120 };          // largura máxima, em pixels da fonte das placas (10px)
  let measureCtx = null;
  /* Largura visual do texto na fonte das placas. A fonte é monoespaçada: no mínimo 10px por letra. */
  function textWidth(t) {
    if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
    measureCtx.font = '10px "Press Start 2P"';
    return Math.max(measureCtx.measureText(t).width, [...t].length * 10);
  }
  /* Limpa o que foi digitado: tira caracteres não aceitos e corta no limite de largura. Devolve { value, msg }. */
  function cleanName(raw, kind) {
    let msg = '', v = [...String(raw).replace(/[\t\n\r]/g, ' ')].filter(ch => NAME_CHAR.test(ch)).join('');
    if (v !== String(raw).replace(/[\t\n\r]/g, ' ')) msg = 'Use só letras (com ou sem acento), números, espaços e pontuação simples: . , \' ! ? & ( ) -';
    v = v.replace(/ {2,}/g, ' ');
    if (textWidth(v.trim()) > NAME_MAX[kind]) {
      const chars = [...v]; while (chars.length && textWidth(chars.join('').trim()) > NAME_MAX[kind]) chars.pop();
      v = chars.join(''); msg = `Limite atingido: o nome pode ter até ${Math.floor(NAME_MAX[kind] / 10)} letras, para caber nas placas e nas falas.`;
    }
    return { value: v, msg };
  }
  const nameOk = v => v.trim().length > 0;
  /* Campo de nome com aviso. onChange recebe o texto já limpo. */
  function nameField(label, value, kind, placeholder, onChange, id) {
    const box = el('div', 'name-field'), lab = el('label', '', label), input = el('input'), msg = el('div', 'field-msg');
    input.type = 'text'; input.value = value; input.placeholder = placeholder; input.autocomplete = 'off'; input.maxLength = 30; if (id) { input.id = id; lab.htmlFor = id; }
    const count = () => { const n = [...input.value.trim()].length, max = Math.floor(NAME_MAX[kind] / 10); return `${n}/${max} letras`; };
    msg.textContent = count();
    input.oninput = () => {
      const r = cleanName(input.value, kind);
      if (r.value !== input.value) input.value = r.value;
      msg.textContent = r.msg || (nameOk(input.value) || !input.value ? count() : 'O nome não pode ficar só com espaços.');
      msg.classList.toggle('warn', !!r.msg || (!!input.value && !nameOk(input.value)));
      onChange(input.value);
    };
    box.append(lab, input, msg);
    return { box, input, msg };
  }

  /* =====================================================
     TÍTULO
     ===================================================== */
  let DEMO = null;
  function initTitle() {
    S = null; show('title'); World.setSeason(0);
    if (!DEMO) { DEMO = newState(DEFAULT_LOOK, ''); upgrade(DEMO); [0, 1, 2].forEach(i => { DEMO.farm.tiles[i] = { k: 'soil', w: 1, crop: 'tomate', g: i + 2 }; }); DEMO.coop.hens = [{ name: '', well: 80 }, { name: '', well: 80 }]; }
    const found = inspectSaves(), notice = $('save-notice'), cont = $('btn-continue');
    notice.hidden = true; cont.hidden = true; cont.textContent = 'Continuar';
    if (found.state) { cont.hidden = false; cont.onclick = () => { S = found.state; startGame(); }; }
    else if (found.old) {
      notice.hidden = false;
      notice.replaceChildren(el('b', '', 'Jogo de uma versão anterior encontrado. '),
        el('span', '', `O jogo mudou de direção: agora é uma vida no campo, sem profissões nem contexto familiar. O progresso antigo (profissão, tarefas, dia e moedas) não tem como continuar, mas dá para começar a nova fazenda com ${found.old.name}, mantendo o nome e a aparência. O jogo antigo continua guardado neste navegador: nada é apagado.`));
      cont.hidden = false; cont.textContent = `Nova fazenda com ${found.old.name}`;
      cont.onclick = () => startCreation(found.old);
    } else if (found.broken || found.legacy) {
      notice.hidden = false;
      notice.replaceChildren(el('b', '', 'Não foi possível abrir o jogo salvo. '),
        el('span', '', found.legacy ? 'Existe um jogo de uma versão anterior neste navegador, mas ele não pôde ser lido. Ele continua guardado; você pode começar uma nova fazenda.'
          : 'O arquivo de progresso está danificado. Ele continua guardado e só será substituído se você iniciar um novo jogo.'));
    }
    $('btn-new').onclick = () => {
      if ((found.state || found.broken) && !confirm('Já existe uma fazenda salva neste navegador. Ao terminar de criar um novo personagem, ela será substituída. Deseja continuar?')) return;
      startCreation();
    };
  }

  /* =====================================================
     APARÊNCIA: criação e guarda-roupa usam as mesmas opções
     ===================================================== */
  function optionGrid(box, items, cur, set, extra) {
    const grid = el('div', 'opts' + (extra ? ' ' + extra : ''));
    items.forEach(it => {
      const b = el('button', 'opt' + (cur === it.id ? ' sel' : '')); b.type = 'button'; b.dataset.id = it.id;
      if (it.canvas) b.append(it.canvas);
      if (it.swatch) { const s = el('span', 'swatch'); s.style.background = it.swatch; b.append(s); }
      if (it.label) b.append(el('span', 't', it.label));
      if (it.swatch) b.setAttribute('aria-label', it.name || it.swatch);
      b.onclick = () => set(it.id);
      grid.append(b);
    });
    box.append(grid);
  }
  const colorItems = list => list.map(c => ({ id: c, swatch: c }));
  /* Seções de aparência. look = objeto editado; change = redesenha. */
  const LOOK_SECTIONS = {
    genero: (box, look, change) => optionGrid(box, Sprites.GENDERS.map(g => ({ id: g.id, label: g.name })), look.gender, id => { look.gender = id; change(); }),
    pele: (box, look, change) => optionGrid(box, Sprites.SKINS.map(s => ({ id: s.id, label: s.name, swatch: s.c[0] })), look.skin, id => { look.skin = id; change(); }, 'sw'),
    cabelo: (box, look, change) => optionGrid(box, Sprites.HAIRS.map(h => ({ id: h.id, label: h.name, canvas: Sprites.canvas(Object.assign({}, look, { hair: h.id, hat: null })) })), look.hair, id => { look.hair = id; change(); }, 'many'),
    corCabelo: (box, look, change) => optionGrid(box, Sprites.HAIR_COLORS.map(h => ({ id: h.id, label: h.name, swatch: h.c[0] })), look.hairColor, id => { look.hairColor = id; change(); }, 'sw'),
    cima: (box, look, change) => { optionGrid(box, Sprites.TOPS.map(o => ({ id: o.id, label: o.name, canvas: Sprites.canvas(Object.assign({}, look, { top: o.id })) })), look.top, id => { look.top = id; change(); }, 'many'); box.append(el('p', 'hint', 'Cor')); optionGrid(box, colorItems(Sprites.CLOTH_COLORS), look.topColor, id => { look.topColor = id; change(); }, 'colors'); },
    baixo: (box, look, change) => { optionGrid(box, Sprites.BOTTOMS.map(o => ({ id: o.id, label: o.name, canvas: Sprites.canvas(Object.assign({}, look, { bottom: o.id })) })), look.bottom, id => { look.bottom = id; change(); }); box.append(el('p', 'hint', 'Cor')); optionGrid(box, colorItems(Sprites.CLOTH_COLORS), look.bottomColor, id => { look.bottomColor = id; change(); }, 'colors'); },
    calcado: (box, look, change) => optionGrid(box, colorItems(Sprites.SHOE_COLORS), look.shoeColor, id => { look.shoeColor = id; change(); }, 'colors'),
    acessorio: (box, look, change) => {
      optionGrid(box, [{ id: 'none', label: 'Nenhum', canvas: Sprites.canvas(Object.assign({}, look, { accessory: null })) }, ...Sprites.ACCESSORIES.map(a => ({ id: a.id, label: a.name, canvas: Sprites.canvas(Object.assign({}, look, { accessory: a.id })) }))],
        look.accessory || 'none', id => { look.accessory = id === 'none' ? null : id; change(); }, 'many');
      if (look.accessory) { box.append(el('p', 'hint', 'Cor do acessório')); optionGrid(box, colorItems(Sprites.CLOTH_COLORS), look.accColor, id => { look.accColor = id; change(); }, 'colors'); }
    },
    extras: (box, look, change) => { box.append(el('p', 'hint', 'Calçado')); LOOK_SECTIONS.calcado(box, look, change); box.append(el('p', 'hint', 'Acessório')); LOOK_SECTIONS.acessorio(box, look, change); },
  };

  const draft = {};
  let step = 0, previewTimer = 0, previewF = 0;
  const STEPS = [
    { title: 'Gênero', hint: 'Define como a vila se refere a você nas falas (ele, ela ou formas neutras). Todos os cabelos, roupas e acessórios servem para qualquer gênero.', key: 'genero' },
    { title: 'Cor da pele', hint: 'Escolha o tom de pele.', key: 'pele', look: true },
    { title: 'Cabelo', hint: 'Curtos, médios e longos; lisos, ondulados, cacheados e crespos.', key: 'cabelo', look: true },
    { title: 'Cor do cabelo', hint: () => (draft.look.hair === 'careca' ? 'Seu personagem é careca, então a cor quase não aparece.' : 'Escolha a cor do cabelo.'), key: 'corCabelo', look: true },
    { title: 'Roupa de cima', hint: 'Peça e cor.', key: 'cima', look: true },
    { title: 'Roupa de baixo', hint: 'Peça e cor. Combina com qualquer parte de cima.', key: 'baixo', look: true },
    { title: 'Calçado e acessório', hint: 'O acessório aparece de todos os lados, até com chapéu.', key: 'extras', look: true },
    { title: 'Animal favorito', hint: 'Gato ou cachorro? Um dia, alguém da vila pode se lembrar disso.', key: 'pet' },
    { title: 'Nomes', hint: 'Como a vila vai te chamar e o nome da fazenda que você vai herdar. Depois, o guarda-roupa de casa permite mudar cabelo, roupas e acessório.', key: 'names',
      valid: () => nameOk(draft.name) && nameOk(draft.farm) },
  ];
  function petOptions(box, cur, set) {
    optionGrid(box, Object.keys(PETS).map(k => ({ id: k, label: PETS[k].name, canvas: Object.assign(World.petCanvas(k), { className: 'pixel pet' }) })), cur, set, 'two');
  }
  function startCreation(pre) {
    draft.look = Object.assign({}, DEFAULT_LOOK, pre ? pre.look : null); draft.name = pre ? pre.name : ''; draft.farm = ''; draft.pet = 'gato';
    step = 0;
    const steps = $('steps'); steps.replaceChildren(); STEPS.forEach(() => steps.append(el('span')));
    show('create');
    clearInterval(previewTimer);
    previewTimer = setInterval(() => { previewF = (previewF + 1) % 4; updatePreview(); }, 260);
    renderStep();
  }
  /* Prévia ampliada: frente, esquerda, costas e direita, andando. */
  function updatePreview() {
    const dirs = ['down', 'left', 'up', 'right'], frame = [0, 1, 0, 2][previewF];
    [...$('preview-views').querySelectorAll('canvas')].forEach((c, i) => { const g = c.getContext('2d'); g.clearRect(0, 0, Sprites.W, Sprites.H); Sprites.draw(g, draft.look, 0, 0, frame, dirs[i]); });
    $('preview-name').textContent = draft.name.trim() || '—';
    $('preview-farm').textContent = draft.farm.trim() ? draft.farm.trim() : '';
    $('preview-pet').replaceChildren(World.petCanvas(draft.pet));
  }
  function updateNav() {
    const st = STEPS[step];
    $('btn-back').textContent = step === 0 ? '◀ Título' : '◀ Voltar';
    $('btn-next').textContent = step === STEPS.length - 1 ? 'Começar ▶' : 'Avançar ▶';
    $('btn-next').disabled = st.valid ? !st.valid() : false;
    $('btn-random').hidden = !st.look;
  }
  function renderStep() {
    const st = STEPS[step];
    [...$('steps').children].forEach((s, i) => s.classList.toggle('on', i <= step));
    $('step-title').textContent = `${step + 1}. ${st.title}`;
    $('step-hint').textContent = typeof st.hint === 'function' ? st.hint() : st.hint;
    const box = $('step-content'); box.replaceChildren();
    if (LOOK_SECTIONS[st.key]) LOOK_SECTIONS[st.key](box, draft.look, renderStep);
    else if (st.key === 'pet') petOptions(box, draft.pet, id => { draft.pet = id; renderStep(); });
    else {
      const a = nameField('Seu nome', draft.name, 'name', 'Seu nome', v => { draft.name = v; updatePreview(); updateNav(); }, 'name-input');
      const b = nameField('Nome da fazenda', draft.farm, 'farm', 'Ex.: Sítio Recanto', v => { draft.farm = v; updatePreview(); updateNav(); }, 'farm-input');
      [a.input, b.input].forEach(i => { i.onkeydown = e => { if (e.key === 'Enter' && st.valid()) $('btn-next').click(); }; });
      box.append(a.box, b.box); setTimeout(() => (draft.name ? b.input : a.input).focus(), 0);
    }
    updatePreview(); updateNav();
  }
  $('btn-back').onclick = () => { if (step === 0) { clearInterval(previewTimer); initTitle(); } else { step--; renderStep(); } };
  $('btn-random').onclick = () => { draft.look = Sprites.randomLook(draft.look); renderStep(); };
  $('btn-next').onclick = () => {
    const st = STEPS[step];
    if (st.valid && !st.valid()) return;
    if (step < STEPS.length - 1) { step++; renderStep(); return; }
    clearInterval(previewTimer);
    S = newState(Object.assign({}, draft.look), cleanName(draft.name, 'name').value.trim(), cleanName(draft.farm, 'farm').value.trim(), draft.pet);
    save(); startGame();
  };

  /* =====================================================
     INVENTÁRIO
     ===================================================== */
  /* Coloca n itens no conjunto de espaços; devolve quantos NÃO couberam. */
  function addTo(arr, id, n) {
    for (const s of arr) { if (n && s && s.id === id && s.n < STACK) { const k = Math.min(n, STACK - s.n); s.n += k; n -= k; } }
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
  let busy = false, hover = null, lastSave = 0, floats = [], dummyHit = 0, hens = [], impacts = [], shake = null, pet = null;
  const COARSE = window.matchMedia && matchMedia('(pointer: coarse)').matches;

  const hearts = id => Math.floor((S.friends[id] || 0) / 100);
  const addFriend = (id, pts) => { const before = hearts(id); S.friends[id] = Math.max(0, Math.min(FRIEND.max, (S.friends[id] || 0) + pts)); if (hearts(id) > before) toast(`${villagerById(id).name}: ${hearts(id)} coração(ões)`); };
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
  function villagerAt(v, tm) {
    let idx = -1; v.sched.forEach((e, i) => { if (tm >= e[0]) idx = i; });
    const n = v.sched.length, wrap = idx < 0; if (wrap) idx = n - 1;
    const e = v.sched[idx];
    if (e[1] === 'loja') return { where: 'loja', x: World.get('loja').keeper[0], y: World.get('loja').keeper[1], dir: 'down' };
    const prev = v.sched[(idx - 1 + n) % n][1], start = prev === 'loja' ? [510, 160] : prev[prev.length - 1];
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
  const speaker = v => ({ name: v.id === 'lucio' && !S.lucio.met ? 'Homem da serra' : v.name, look: v.look, portrait: v.portrait });
  function actors() {
    const tm = S.time, list = [];
    VILLAGERS.forEach(v => {
      const p = villagerAt(v, tm);
      if (p.where !== map.id) return;
      list.push({ id: v.id, v, name: shownName(v), look: v.look, x: p.x, y: p.y, dir: p.dir, moving: p.moving, reach: p.where === 'loja' ? 40 : 22, bubble: questMark(v) ? '!' : null });
    });
    return list;
  }

  /* =====================================================
     INÍCIO E LAÇO PRINCIPAL
     ===================================================== */
  /* Campos criados depois (salvamentos anteriores continuam valendo). */
  function upgrade(s) {
    s.dmg = s.dmg || {};
    s.look = Object.assign({ accessory: null, accColor: '#e04a3a' }, s.look);
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
    s.lucio = Object.assign({ met: false, permit: false, gifts: { week: -1, n: 0 }, bday: 0, tentUp: false, found: false, fireScene: false, iara: false, last: -1, again: 0 }, s.lucio);
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
      await say('narr', COARSE ? 'Ande com as setas da tela. Chegue perto e toque em pessoas, portas e objetos para interagir. Toque na barra para escolher o item; com uma ferramenta na mão, toque na terra ou no objeto ao seu lado. O botão Menu abre o inventário, as amizades, o mapa e o diário.' : 'Ande com as setas (ou W, A, S, D). Chegue perto e clique em pessoas, portas e objetos para interagir (Q abre a porta à frente). Clique na barra ou use as teclas 1 a 0 para escolher o item; Tab troca a linha da barra. E abre o menu, F o diário e M o mapa.');
      await say('narr', 'Não há pressa nem fim: os dias passam quando você dorme. Para começar, siga a estrada para o leste e apresente-se no Armazém.');
      S.intro = true;
    });
  }
  function showLetter(reread) {
    return new Promise(resolve => {
      const b = $('letter-body'); b.replaceChildren(el('div', 'stamp'), el('p', 'greet', fmt(LETTER.greet)), ...LETTER.body.map(t => el('p', '', fmt(t))), el('p', 'sign', LETTER.sign));
      $('letter-ok').textContent = reread ? 'Fechar a carta' : 'Guardar a carta ▶';
      $('letter').hidden = false; $('letter').scrollTop = 0; $('letter-ok').focus();
      $('letter-ok').onclick = () => { $('letter').hidden = true; resolve(); };
    });
  }
  function enterMap(id, x, y, dir) {
    map = World.get(id);
    P.x = x; P.y = y; P.dir = dir || 'down'; P.moving = false; P.work = 0; P.tool = null;
    if (!World.free(map, P.x, P.y) || dynBlocked(P.x, P.y)) { P.x = map.spawn.x; P.y = map.spawn.y; }
    S.pos = { map: id, x: Math.round(P.x), y: Math.round(P.y), dir: P.dir };
  }
  function travel(to, x, y, dir) {
    const wrap = $('scene-wrap'); wrap.classList.add('fade'); busy = true;
    setTimeout(() => { enterMap(to, x, y, dir); save(); wrap.classList.remove('fade'); busy = false; renderHud(); }, 220);
  }
  const keepsakeVisible = () => qActive().includes('lembranca') && !S.lucio.found;
  const blocked = () => busy || paused || document.hidden || !$('modal').hidden || !$('summary').hidden || !$('letter').hidden || screen !== 'game';
  /* Pausa (tecla P ou botão): o tempo para e nada acontece até continuar. */
  let paused = false;
  function setPause(v) { paused = !!v && screen === 'game'; $('pause').hidden = !paused; if (paused) $('pause-go').focus(); }
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
  function fit() {
    const c = $('scene'), W = window.innerWidth, H = window.innerHeight;
    const k = Math.max(2, Math.min(4, Math.round(H / 210), Math.round(W / 300)));   // escala inteira (pixels maiores, como num jogo de fazenda clássico)
    const cw = Math.ceil(W / k), ch = Math.ceil(H / k);
    if (c.width !== cw || c.height !== ch) { c.width = cw; c.height = ch; }
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
      World.render($('title-canvas').getContext('2d'), { map: m, cam: World.camera(m, cx, cy), t, state: DEMO, hens: [{ x: 190, y: 420, kind: 0 }, { x: 240, y: 432, kind: 1, flip: 1 }],
        actors: VILLAGERS.map(v => ({ v, p: villagerAt(v, 660) })).filter(o => o.p.where === 'fora').map(o => ({ look: o.v.look, x: o.p.x, y: o.p.y, dir: o.p.dir })) });
      return;
    }
    if (screen !== 'game' || !S || !map) return;
    const list = actors();
    update(dt, t, list);
    draw(t, list);
  }

  function update(dt, t, list) {
    P.moving = false;
    const free = !blocked();
    if (free && !P.work) {
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
      if (S.time >= DAY_END) passOut();
    }
    floats = floats.filter(f => t - f.t0 < 700);
    updateHens(dt, t); updatePet(dt, t);
    impacts = impacts.filter(f => t - f.t0 < 400);
    hover = null;
    if (free && mouse) { const [wx, wy] = mouseWorld(), tg = targetAt(wx, wy, list); if (tg) { tg.ok = reachable(tg); hover = tg; } }
    const hint = $('hint'), text = hover ? (hover.ok ? hover.label : `${hover.label.split(' — ')[0]} — chegue mais perto`) : '';
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
    return { r: Math.round(mix(1)), g: Math.round(mix(2)), b: Math.round(mix(3)), a: +mix(4).toFixed(3), glow: +night.toFixed(3) };
  }
  const outdoor = () => map.id === 'fora' || map.id === 'montanha';

  function draw(t, list) {
    const c = $('scene'); World.setView(c.width, c.height);
    const cam = World.camera(map, P.x, P.y), ctx = c.getContext('2d');
    const me = { look: S.look, x: P.x, y: P.y, dir: P.dir, moving: P.moving, tool: P.tool, hop: P.hop && t < P.hop ? -Math.abs(Math.sin((P.hop - t) / 80)) * 4 : 0 };
    const cursor = hover && { x: Math.round(hover.rect[0]), y: Math.round(hover.rect[1]), w: Math.round(hover.rect[2]), h: Math.round(hover.rect[3]), far: !hover.ok };
    const mk = trackedMarker(), lst = S.quests.lona, repair = lst && lst.state === 'active' && lst.mat ? Math.min(1, (lst.n.repair || 0) / 3) : 0;
    World.render(ctx, { map, cam, t, state: S, actors: [...list, me], hens: map.id === 'fora' ? hens : [], pet: map.id === 'fora' ? pet : null, cursor, light: lightAt(S.time, !outdoor()), floats, dummyHit, impacts, shake, bars: map.id === 'fora' ? bars() : [], markers: mk ? [mk] : [], repair, keepsake: map.id === 'montanha' && keepsakeVisible(), seasonal: map.id === 'fora' ? S.seasonal : null, debugSpawns: DEV && DEV.markers });
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
      const r = [a.x - 10, a.y - 31, 20, 33];
      if (inRect(r, wx, wy)) return { label: 'Falar com ' + a.name, rect: r, reach: a.reach > 30 ? 30 : 16, act: () => talkTo(a.v) };
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
        return stumpNow ? hitTarget('s' + n, 'stump', r, r, [x, y - 6], () => { cleared[n] = true; })
          : hitTarget('t' + n, 'trunk', r, [x - 5, y - 8, 10, 8], [x, y - 12], () => { S.nature.trees[n] = S.day + 4; });
      }
      for (let n = 0; n < World.NROCKS.length; n++) {
        if (S.nature.rocks[n]) continue;
        const [x, y] = World.NROCKS[n], r = [x - 10, y - 16, 20, 18];
        if (inRect(r, wx, wy)) return hitTarget('r' + n, 'rock', r, r, [x, y - 8], () => { S.nature.rocks[n] = S.day + 3; });
      }
      for (let n = 0; n < World.FORAGE.length; n++) {
        const id = S.nature.forage[n], [x, y] = World.FORAGE[n], r = [x - 8, y - 12, 16, 14];
        if (id && inRect(r, wx, wy)) return { label: 'Colher ' + ITEMS[id].name.toLowerCase(), rect: r, act: () => { if (gain(id)) { delete S.nature.forage[n]; bang(x, y - 6, 'leaf'); save(); } } };
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
        if (id && inRect(r, wx, wy)) return { label: 'Colher ' + ITEMS[id].name.toLowerCase(), rect: r, act: () => { if (gain(id)) { delete S.nature.mforage[n]; bang(x, y - 6, 'leaf'); save(); } } };
      }
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
    if (S.energy < R.energy) return tip('Sem energia para outro golpe. Coma algo ou durma para recuperar.');
    if (last && R.drop && !canAdd(R.drop[0], R.drop[1])) return tip('Mochila cheia: abra espaço antes do último golpe.');
    useTool(id, R.energy);
    bang(x, y, R.fx); shake = { key, t0: performance.now() };
    if (last) { delete S.dmg[key]; onBreak(); if (R.drop) gain(R.drop[0], R.drop[1]); }
    else S.dmg[key] = d;
    save();
  }

  /* O que um clique faz em um quadrado da fazenda, conforme o item selecionado. */
  function tileTarget(i) {
    const o = S.farm.tiles[i], q = World.tilePos(i), rect = [q.x, q.y, 16, 16], cx = q.x + 8, cy = q.y + 8;
    const it = equipped(), id = it && it.id, kind = id && ITEMS[id].kind;
    const T = (label, act) => ({ label, act, rect, tile: true });
    if (o && RESIST[o.k]) return hitTarget('f' + i, o.k, rect, rect, [cx, cy], () => { delete S.farm.tiles[i]; }, true);
    if (o && o.k === 'soil' && o.crop && o.g >= CROPS[o.crop].days) return T('Colher ' + CROPS[o.crop].name.toLowerCase(), () => {
      if (!gain(o.crop)) return; S.farm.tiles[i] = { k: 'soil' }; P.hop = performance.now() + 300; bang(cx, cy, 'leaf'); qEvent('harvest'); save();
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
    if (id === 'regador' && o && o.k === 'soil') return o.w ? T(o.crop ? `${CROPS[o.crop].name}: ${o.g} de ${CROPS[o.crop].days} dias, regado` : 'Já regado', () => tip('Esta terra já está regada hoje.'))
      : T(`Regar (água: ${S.can}/10)`, () => { if (!S.can) return tip('Regador vazio: encha no lago.'); if (!useTool(id, 1)) return; S.can--; o.w = 1; bang(cx, cy, 'water'); if (o.crop) qEvent('water'); renderHotbar(); save(); });
    if (kind === 'seed') {
      if (o && o.k === 'soil' && !o.crop) return T('Plantar ' + CROPS[ITEMS[id].crop].name.toLowerCase(), () => { useTool(id, 0); removeItem(id); o.crop = ITEMS[id].crop; o.g = 0; bang(cx, cy, 'soil'); qEvent('plant'); save(); });
      if (!o) return T('Are a terra antes de plantar', () => tip('Prepare a terra com a enxada antes de plantar.'));
    }
    if (o && o.k === 'soil' && o.crop) { const info = `${CROPS[o.crop].name}: ${o.g} de ${CROPS[o.crop].days} dias${o.w ? ', regado' : ', precisa de água'}`; return T(info, () => tip(info)); }
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
    if (S.energy < energy) { toast('Sem energia. Durma para recuperar.'); return false; }
    S.energy -= energy;
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
    if (k === 'Tab') { e.preventDefault(); if (!e.repeat && !blocked()) cycleRow(e.shiftKey ? -1 : 1); return; }
    if (/^Arrow|^ $/.test(k)) e.preventDefault();               // as setas e o espaço não rolam a página
    if (KEYMAP[k]) { keys[KEYMAP[k]] = true; return; }
    if (/^[0-9]$/.test(k) && !blocked()) { selectSlot(k === '0' ? 9 : +k - 1); return; }
  });
  window.addEventListener('keyup', e => { if (KEYMAP[e.key]) keys[KEYMAP[e.key]] = false; });
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
    if (blocked() || P.work || performance.now() - menuClosedT < 200) return;   // menu/conversa aberta, golpe em andamento ou menu recém-fechado: o clique não conta
    const [wx, wy] = mouseWorld(), tg = targetAt(wx, wy, actors());
    if (!tg) { const it = equipped(); if (it && it.id === 'espada') { faceTo(wx, wy); useTool('espada', 0); } return; }
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
  /* A barra de ferramentas mostra uma das 3 linhas da mochila (Tab troca a linha, mantendo a coluna). */
  function selectSlot(i) { S.sel = S.row * HOTBAR + i; renderHotbar(); save(); }
  /* Clique na barra: escolhe o item; se ele já está na mão e é comida, come. */
  function hotbarClick(i) {
    const idx = S.row * HOTBAR + i, s2 = S.inv[idx];
    if (idx === S.sel && s2 && ITEMS[s2.id].food) return eat(idx);
    selectSlot(i);
    if (s2 && ITEMS[s2.id].food) tip(`${ITEMS[s2.id].name} na mão. Clique de novo para comer (+${ITEMS[s2.id].food} de energia).`);
  }
  /* Come uma unidade do item: recupera energia (até 100). Nada acontece com a energia cheia ou com o jogo ocupado. */
  function eat(idx) {
    const s2 = S.inv[idx]; if (!s2) return false;
    const it = ITEMS[s2.id]; if (!it.food) return false;
    if (blocked() || P.work) return false;
    if (S.energy >= 100) { tip('Sua energia já está cheia.'); return false; }
    const before = S.energy; S.energy = Math.min(100, S.energy + it.food);
    s2.n--; if (!s2.n) S.inv[idx] = null;
    P.hop = performance.now() + 300; floats.push({ icon: s2.id, x: P.x, y: P.y, t0: performance.now() });
    toast(`Você comeu ${it.name.toLowerCase()}: +${Math.round(S.energy - before)} de energia`);
    renderHotbar(); renderHud(); save();
    return true;
  }
  function cycleRow(d = 1) {
    const col = S.sel % HOTBAR; S.row = (S.row + d + 3) % 3; S.sel = S.row * HOTBAR + col;
    renderHotbar(); save(); tip(`Barra de ferramentas: linha ${S.row + 1} de 3`);
  }
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
    if (sp.portrait) {
      const src = Sprites.PORTRAITS[sp.portrait](expr || 'neutro');
      if (pc.width !== src.width) { pc.width = src.width; pc.height = src.height; }
      pc.dataset.expr = expr || 'neutro'; pc.classList.add('square');
      const g = pc.getContext('2d'); g.clearRect(0, 0, pc.width, pc.height); g.drawImage(src, 0, 0);
    } else if (sp.look) {
      if (pc.width !== 24) { pc.width = 24; pc.height = 20; }
      delete pc.dataset.expr; pc.classList.remove('square');
      const g = pc.getContext('2d'); g.clearRect(0, 0, pc.width, pc.height); Sprites.draw(g, sp.look, 0, -3);
    }
    $('dlg-text').classList.toggle('narr', who === 'narr');
  }
  /* "[contente]Texto" → expressão + texto. */
  const splitExpr = t => { const m = /^\[(neutro|desconfiado|contente|emocionado)\]/.exec(t); return m ? [m[1], t.slice(m[0].length)] : [null, t]; };
  function say(who, text) {
    return new Promise(resolve => {
      const [expr, rest] = splitExpr(String(text)); text = fmt(rest); setSpeaker(who, expr);
      $('dlg-choices').replaceChildren(); $('dlg-form').hidden = true; $('dlg-more').hidden = false;
      const box = $('dlg-text'); let n = 0;
      clearInterval(typer);
      const finish = () => { clearInterval(typer); typer = 0; box.textContent = text; };
      typer = setInterval(() => { n += 2; box.textContent = text.slice(0, n); if (n >= text.length) finish(); }, 16);
      onAdvance = () => { if (typer) finish(); else { onAdvance = null; resolve(); } };
    });
  }
  /* Pergunta com opções, sem precisar avançar o texto antes. */
  /* Confirmação Sim/Não: E e Esc valem "Não". */
  function ask(text, labels) { setSpeaker('narr'); clearInterval(typer); typer = 0; $('dlg-text').textContent = fmt(text); $('dlg-form').hidden = true; return choose(labels, labels.findIndex(l => /^Não\b/.test(l))); }
  /* cancel = índice da opção que E/Esc escolhem (ou -1: escolha obrigatória, sem atalho). */
  let cancelChoice = null;
  function choose(labels, cancel = -1) {
    return new Promise(resolve => {
      onAdvance = null; $('dlg-more').hidden = true;
      const box = $('dlg-choices'); box.replaceChildren();
      const pick = i => { cancelChoice = null; box.replaceChildren(); resolve(i); };
      labels.forEach((label, i) => box.append(btn('btn', fmt(label), e => { e.stopPropagation(); pick(i); })));
      cancelChoice = cancel >= 0 ? () => pick(cancel) : null;
      box.firstChild.focus();
    });
  }
  /* Pede um nome curto (galinha, bicho). Valida como os outros nomes; vazio usa o padrão. */
  function askText(who, text, fallback) {
    return new Promise(resolve => {
      setSpeaker(who); clearInterval(typer); typer = 0; $('dlg-text').textContent = fmt(text);
      onAdvance = null; $('dlg-more').hidden = true; $('dlg-choices').replaceChildren();
      const form = $('dlg-form'), input = $('dlg-input'), msg = $('dlg-msg'); form.hidden = false; input.value = ''; input.placeholder = fallback; msg.textContent = ''; input.focus();
      input.oninput = () => { const r = cleanName(input.value, 'pet'); if (r.value !== input.value) input.value = r.value; msg.textContent = r.msg; };
      form.onsubmit = e => { e.preventDefault(); form.hidden = true; form.onsubmit = null; input.oninput = null; input.blur(); msg.textContent = ''; resolve(cleanName(input.value, 'pet').value.trim() || fallback); };
    });
  }
  $('dlg-form').addEventListener('submit', e => e.preventDefault());     // nunca recarrega a página, mesmo com Enter repetido
  $('dialog').addEventListener('click', e => { if (!e.target.closest('button, input, form') && onAdvance) onAdvance(); });
  async function run(flow) {
    if (busy) return;
    busy = true; $('dialog').hidden = false; $('dock').hidden = true;
    try { await flow(); }
    finally { busy = false; onAdvance = null; cancelChoice = null; $('dialog').hidden = true; $('dock').hidden = false; save(); renderHud(); renderHotbar(); }
  }
  async function sayAll(who, lines) { for (const l of lines) await say(who, l); }
  function toast(text) { const t = el('div', 'toast', text); $('toasts').append(t); while ($('toasts').children.length > 4) $('toasts').firstChild.remove(); setTimeout(() => t.remove(), 2300); }

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
    const toPerson = () => { const v = villagerById(q.to || q.giver), p = villagerAt(v, S.time); return { map: p.where, x: p.x, y: p.y - 36, label: v.name }; };
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
  /* Seta no cenário: no destino, ou na porta/saída que leva até ele. */
  function trackedMarker() {
    const id = tracked(), tg = id && questTarget(id); if (!tg) return null;
    if (tg.map === map.id) return { x: tg.x, y: tg.y };
    if (map.id === 'fora') { const d = map.doors[tg.map]; return d ? { x: d.x, y: d.y - 30 } : null; }
    return { x: map.w / 2, y: map.h - 20 };
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
        await sayAll(who, q.done || ['Agradeço muito!']);
        if (q.reward && q.reward.hen) await newHen(who);
        completeQuest(turn);
        return;
      }
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
      if (v.id === 'celeste' && map.id === 'loja' && await choose(['Comprar e vender', 'Conversar']) === 0) { setTimeout(() => openModal('loja'), 0); return; }
      // 3) cena de amizade (uma vez, com 3 corações)
      if (v.scene && hearts(v.id) >= 3 && !S.scenes[v.id]) {
        const sc = v.scene, n = sc.n || 1;
        if (canAdd(sc.item, n)) { await sayAll(who, sc.lines); S.scenes[v.id] = true; gain(sc.item, n); return; }
      }
      // 4) presente, se há um produto na mão
      const it = equipped();
      if (GIFT_RULES[v.id]) { if (it && !ITEMS[it.id].kind && await choose(['Conversar', `Dar ${ITEMS[it.id].name}`]) === 1) return giftRuled(v, who, it.id); }
      else if (it && !ITEMS[it.id].kind && !S.daily.gift[v.id] && await choose(['Conversar', `Dar ${ITEMS[it.id].name}`]) === 1) return give(v, who, it.id);
      // 5) conversa: a primeira do dia aumenta a amizade
      const pending = qActive().find(id => (QUESTS[id].to || QUESTS[id].giver) === v.id && !QUESTS[id].selfDone);
      if (!S.daily.talk[v.id]) {
        S.daily.talk[v.id] = true; addFriend(v.id, FRIEND.talk);
        if (v.talk.length === 4) await say(who, bandLine(v));
        else { const tier = Math.min(2, Math.floor(hearts(v.id) / 2)); await say(who, v.talk[tier][S.day % v.talk[tier].length]); }
      } else if (Array.isArray(v.again)) { const L = S.lucio; L.again = (L.again + 1) % v.again.length; await say(who, v.again[L.again]); }
      else await say(who, v.again);
      if (v.id === 'iara' && S.lucio.met && !S.lucio.iara) await iaraOnLucio(who);
      if (pending) await say('narr', `Missão em andamento com ${v.name}: ${QUESTS[pending].desc} (${qProgress(pending) || 'em andamento'})`);
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
  const giftKind = (v, id) => (v.love.includes(id) ? 'love' : v.like.includes(id) ? 'like' : v.dislike.includes(id) ? 'dislike' : 'neutral');
  /* Presentes com limites próprios (Lúcio): 1 por dia, 2 por semana e um extra no aniversário, com pontos x8. */
  async function giftRuled(v, who, id) {
    const R = GIFT_RULES[v.id], L = S.lucio, name = ITEMS[id].name, c = calendar();
    if (await ask(`Presentear ${v.name} com ${name}?`, ['Sim, presentear', 'Não']) !== 0) return say('narr', `Você guarda ${name.toLowerCase()} na mochila.`);
    if (L.gifts.week !== weekOf(S.day)) L.gifts = { week: weekOf(S.day), n: 0 };
    const kind = giftKind(v, id);
    if (isBirthday(v) && L.bday !== c.year) {
      const pts = FRIEND[kind] * R.birthdayMult;
      removeItem(id, 1); L.bday = c.year; S.known[v.id][id] = kind; addFriend(v.id, pts); save();
      await say(who, v.bdayGift[kind === 'dislike' ? 'bad' : kind === 'neutral' ? 'neutral' : 'good']);
      toast(`Presente de aniversário: amizade ${pts > 0 ? '+' : ''}${pts}`);
      return;
    }
    if (S.daily.gift[v.id]) return say(who, v.limit.day);
    if (L.gifts.n >= R.perWeek) return say(who, v.limit.week);
    removeItem(id, 1); S.daily.gift[v.id] = true; L.gifts.n++; S.known[v.id][id] = kind; addFriend(v.id, FRIEND[kind]); save();
    await say(who, v.gift[kind]);
    if (kind === 'love') toast(`${v.name} adorou!`);
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
    addFriend(v.id, FRIEND[kind]);
    await say(who, v.gift[kind]);
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
    const name = await askText(who || 'narr', 'Que nome você dá a ela?', ['Pipoca', 'Farofa', 'Canjica', 'Paçoca'][S.coop.hens.length % 4]);
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
        return say('narr', `Você faz carinho em ${h.name}. Ela fecha os olhos e cacareja baixinho.`);
      }
      if (c === 1) return say('narr', `${h.name} está ${wellText(h.well)}. ${S.coop.feed ? 'Há ração no comedouro para esta noite.' : 'O comedouro está vazio: sem ração, ela não bota e fica triste.'} Galinha alimentada bota um ovo, que aparece no ninho na manhã seguinte.`);
      if (c === 2) { h.name = await askText('narr', 'Qual é o novo nome?', h.name); return say('narr', `Agora ela se chama ${h.name}.`); }
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
    const bia = villagerById('bia'), who = { name: bia.name, look: bia.look }, cat = p.sp === 'gato';
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
    S.seasonal = S.seasonal.filter(q => q !== o); bang(o.x, o.y - 6, 'leaf'); save();
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
    const notes = [];
    let grew = 0, ripe = 0, fruits = 0, eggs = 0, hungry = 0;
    for (const key in S.farm.tiles) {
      const o = S.farm.tiles[key];
      if (o.k === 'soil') { if (o.crop && o.w && o.g < CROPS[o.crop].days) { o.g++; grew++; if (o.g >= CROPS[o.crop].days) ripe++; } o.w = 0; }
      if (o.k === 'tree') { const T = TREES[o.sp]; o.age++; if (o.age >= T.grow && !o.fruit) { o.cool = (o.cool || 0) + 1; if (o.cool >= T.every) { o.fruit = true; o.cool = 0; fruits++; } } }
    }
    S.coop.hens.forEach(h => { if (S.coop.feed > 0) { S.coop.feed--; h.well = Math.min(100, h.well + 6); if (S.coop.eggs < S.coop.hens.length * 3) { S.coop.eggs++; eggs++; } } else { h.well = Math.max(0, h.well - 12); hungry++; } });
    const finished = S.day;
    S.day++; S.time = DAY_START; S.energy = 100; S.daily = { talk: {}, gift: {} };
    Object.keys(S.nature.trees).forEach(k => { if (S.day >= S.nature.trees[k]) { delete S.nature.trees[k]; delete S.nature.cleared[k]; delete S.dmg['s' + k]; } });
    Object.keys(S.nature.rocks).forEach(k => { if (S.day >= S.nature.rocks[k]) delete S.nature.rocks[k]; });
    refreshForage(S);
    const newSeason = calendar().si !== calendar(finished).si;
    const spawned = spawnSeasonal();
    World.setSeason(calendar().si);
    const b = World.get('casa').objs.find(o => o.kind === 'bed');
    enterMap('casa', b.x + 20, b.y + 10, 'down');
    save();

    if (grew) notes.push(`${grew} planta(s) regada(s) cresceram${ripe ? `, e ${ripe} está(ão) pronta(s) para colher` : ''}.`);
    if (fruits) notes.push(`${fruits} árvore(s) amanheceram com frutos.`);
    if (eggs) notes.push(`As galinhas botaram ${eggs} ovo(s). Estão no ninho.`);
    if (hungry) notes.push(`${hungry} galinha(s) ficaram sem ração e não botaram.`);
    if (newSeason) notes.push(`Chegou ${calendar().season === 'Verão' ? 'o' : 'a'} ${calendar().season}! A paisagem mudou${spawned ? ' e há coisas novas para colher na vila' : ''}.`);
    else if (spawned) notes.push(`${spawned} coisa(s) nova(s) para colher apareceram pela vila.`);
    if (!notes.length) notes.push('Uma noite tranquila no sítio.');
    return { notes, finished };
  }
  function sleep() {
    const r = processNight(); if (!r) return;
    const { notes, finished } = r;
    const box = $('summary-body'); box.replaceChildren(el('h3', '', `${dateText(finished)} — dia encerrado`));
    const ul = el('ul', 'list'); notes.forEach(n => ul.append(el('li', '', n))); box.append(ul, el('p', 'dim', 'Você acorda com a energia completa.'));
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
    hud.append(top, mid, en);
    hud.title = `${c.weekday}, ${c.day} de ${c.season}, ano ${c.year} — ${clock()}`;
    const o = objective();
    $('objective').replaceChildren(...(o ? [el('b', '', 'MISSÃO'), el('span', '', o)] : S.time >= 1260 ? [el('span', '', 'Já é tarde. A cama espera por você em casa.')] : []));
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
    if (sun) { g.fillStyle = '#ffd75e'; g.fillRect(x - 2, y - 2, 4, 4); g.fillStyle = '#fff4b0'; g.fillRect(x - 1, y - 1, 2, 2); }
    else { g.fillStyle = '#f0f0ff'; g.fillRect(x - 2, y - 2, 4, 4); g.fillStyle = `rgb(${c.map(Math.round).join(',')})`; g.fillRect(x, y - 2, 2, 2); g.fillStyle = '#ffffff'; g.fillRect(6, 3, 1, 1); g.fillRect(21, 5, 1, 1); g.fillRect(14, 2, 1, 1); }
  }
  function slotNode(s, cls) {
    const b = el('button', 'slot ' + (cls || '')); b.type = 'button';
    if (s) { b.append(cloneIcon(s.id)); b.title = ITEMS[s.id].name; b.setAttribute('aria-label', ITEMS[s.id].name); if (s.id === 'regador') b.append(el('i', '', `${S.can}`)); else if (s.n > 1) b.append(el('i', '', String(s.n))); }
    return b;
  }
  function cloneIcon(id) { const c = el('canvas', 'pixel'); c.width = 16; c.height = 16; c.getContext('2d').drawImage(World.icon(id), 0, 0); return c; }
  function renderHotbar() {
    if (!S) return;
    const bar = $('hotbar'); bar.replaceChildren();
    const base = S.row * HOTBAR;
    for (let i = 0; i < HOTBAR; i++) { const b = slotNode(S.inv[base + i], base + i === S.sel ? 'sel' : ''); b.dataset.slot = i; b.append(el('u', '', String((i + 1) % 10))); b.onclick = () => hotbarClick(i); bar.append(b); }
    const it = equipped(); $('equipped').textContent = it ? ITEMS[it.id].name : 'Mãos livres';
    let hr = $('hotrow'); if (!hr) { hr = el('span', 'hotrow'); hr.id = 'hotrow'; hr.title = 'Linha da mochila na barra (Tab troca)'; bar.parentNode.append(hr); }
    hr.textContent = `Linha ${S.row + 1}/3 · Tab`;
  }

  /* =====================================================
     PAINÉIS
     ===================================================== */
  let tab = 'mochila', picked = null, friendSel = null, menuClosedT = 0;
  let modalT = 0;
  const MENU_TABS = ['mochila', 'amizades', 'mapa', 'diario', 'personagem', 'config'];
  const TAB_TITLE = { mochila: 'Inventário', amizades: 'Amizades', mapa: 'Mapa', diario: 'Diário', personagem: 'Personagem', config: 'Configurações', bau: 'Baú', roupa: 'Guarda-roupa e espelho', loja: 'Armazém', ajuste: 'Sua fazenda' };
  function openModal(t) { if (busy) return; $('modal').hidden = false; modalT = performance.now(); picked = null; renderTab(t); }
  /* Menu principal: só abre com o jogo livre (sem conversa, carta, resumo ou pausa). */
  function openMenu(t = 'mochila') { if (screen !== 'game' || !S || busy || paused || !$('letter').hidden || !$('summary').hidden) return; openModal(t); }
  /* Atalho de aba: abre nela; se já está nela, fecha; se está em outra, troca. */
  function toggleTab(t) {
    if ($('modal').hidden) return openMenu(t);
    if (tab === 'ajuste') return;
    if (tab === t) closeModal(); else { picked = null; renderTab(t); }
  }
  function closeModal() {
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
  const heartsNode = n => { const s = el('span', 'hearts'); for (let i = 0; i < 5; i++) s.append(el('i', i < n ? 'on' : '', '♥')); return s; };
  /* Ícones das abas, desenhados em pixel art (16x16). */
  const TAB_ICON = {
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
        info.append(el('b', '', `${it.name}${s2.n > 1 ? ' × ' + s2.n : ''}`), el('span', 'dim', it.desc + (it.food ? ` Comestível: +${it.food} de energia.` : '') + (it.sell ? ` Vende por ${it.sell} moedas.` : '')));
        if (i === picked) {
          const use = btn('btn', i === S.sel ? 'Na mão ✔' : 'Usar na barra', () => { S.row = Math.floor(i / HOTBAR); S.sel = i; picked = null; save(); renderTab('mochila'); }); use.dataset.use = i; info.append(use);
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
      const lt = btn('btn', 'Ler a carta', () => showLetter(true)); lt.id = 'btn-letter'; li.append(lt); cl.append(li); body.append(cl);
    },
    amizades(body) {
      body.append(el('p', 'dim', 'A primeira conversa do dia e os presentes aumentam a amizade (100 pontos por coração, até 5). Cada morador tem seus gostos.'));
      const known = VILLAGERS.filter(v => !v.hidden || (v.id === 'lucio' && S.lucio.met));
      if (!friendSel || !known.some(v => v.id === friendSel)) friendSel = known[0].id;
      const box = el('div', 'friends'), list = el('ul', 'friend-list'), det = el('div', 'friend-detail');
      known.forEach(v => {
        const li = el('li', 'friend' + (v.id === friendSel ? ' sel' : '')); li.dataset.id = v.id; li.tabIndex = 0;
        const pic = v.portrait ? Sprites.portrait(v.portrait, hearts(v.id) >= 3 ? 'contente' : 'neutro') : Sprites.canvas(v.look);
        if (v.portrait) pic.classList.add('portrait-pic');
        const pts = S.friends[v.id] || 0, h = hearts(v.id), frac = h >= 5 ? 1 : (pts % 100) / 100;
        const txt = el('div', 'fl-txt'), bar = el('div', 'fbar'), fill = el('i'); fill.style.width = Math.round(frac * 100) + '%'; bar.append(fill);
        bar.title = h >= 5 ? 'Amizade máxima' : `${pts % 100}/100 pontos para o próximo coração`;
        txt.append(el('b', '', v.name), heartsNode(h), bar);
        li.append(pic, txt);
        li.onclick = () => { friendSel = v.id; renderTab('amizades'); };
        li.onkeydown = e => { if (e.key === 'Enter') li.onclick(); };
        list.append(li);
      });
      if (VILLAGERS.some(v => v.hidden && !(v.id === 'lucio' && S.lucio.met))) list.append(el('li', 'dim hint-li', 'Dizem na vila que alguém mora numa tenda na serra, ao norte.'));
      const v = villagerById(friendSel), pts = S.friends[v.id] || 0;
      det.dataset.id = v.id;
      det.append(el('h3', '', v.name), heartsNode(hearts(v.id)), el('span', 'dim', `${pts} pontos de amizade · ${hearts(v.id)} de 5 corações`), el('p', '', v.bio), el('span', 'dim', `Costuma ficar ${v.place}.`));
      if (v.birthday) det.append(el('span', '', `🎂 Aniversário: ${v.birthday.day} do ${SEASONS[v.birthday.season]}${isBirthday(v) ? ' — é hoje!' : ''}`));
      if (GIFT_RULES[v.id]) {
        const R = GIFT_RULES[v.id], L = S.lucio, n = L.gifts.week === weekOf(S.day) ? L.gifts.n : 0;
        det.append(el('span', 'gift-week', `Presentes nesta semana: ${n}/${R.perWeek} · hoje: ${S.daily.gift[v.id] ? '1' : '0'}/${R.perDay}${isBirthday(v) ? ` · presente de aniversário: ${L.bday === calendar().year ? 'entregue' : 'disponível (amizade x8)'}` : ''}. A semana vira toda segunda-feira.`));
        det.append(el('span', '', `Hoje: conversa ${S.daily.talk[v.id] ? '✔' : '—'}`));
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
    personagem(body) {
      const top = el('div', 'sheet-top'), pv = el('div', 'wardrobe-pv big');
      ['down', 'left', 'up', 'right'].forEach(d => pv.append(Sprites.canvas(S.look, d)));
      const info = el('div', 'sheet-info');
      const hatItem = S.look.hat && Object.keys(ITEMS).find(k => ITEMS[k].hat === S.look.hat), acc = Sprites.ACCESSORIES.find(a => a.id === S.look.accessory), hand = equipped();
      const en = el('div', 'xp'), bar = el('div', 'bar' + (S.energy < 20 ? ' low' : '')), fill = el('i'); fill.style.width = S.energy + '%'; bar.append(fill); en.append(el('span', '', `⚡ Energia ${Math.round(S.energy)}/100`), bar);
      info.append(el('b', 'sheet-name', S.name), el('span', '', `${S.age} anos · ${S.farmName}, ${VILA}`), en,
        el('span', '', `Chapéu: ${hatItem ? ITEMS[hatItem].name : 'nenhum'}`), el('span', '', `Acessório: ${acc ? acc.name : 'nenhum'}`), el('span', '', `Na mão: ${hand ? ITEMS[hand.id].name : 'nada'}`),
        el('span', 'dim', 'Para trocar cabelo, roupas e acessório, use o guarda-roupa de casa.'));
      top.append(pv, info); body.append(top);
    },
    config(body) {
      body.append(el('h3', '', 'Controles'));
      const t = el('table', 'controls');
      [['Andar', 'Setas ou W A S D (celular: direcional)'], ['Interagir e usar ferramentas', 'Clique (ou toque) perto do alvo'], ['Escolher item da barra', '1 a 0, ou clique na barra'], ['Trocar a linha da barra', 'Tab'],
        ['Menu (Inventário)', 'E ou Esc (de novo fecha)'], ['Diário', 'F'], ['Mapa', 'M'], ['Abrir porta à frente', 'Q'], ['Avançar conversa', 'E, Espaço, Enter ou clique'], ['Recusar em "Sim/Não"', 'E ou Esc'], ['Pausa', 'P ou o botão ⏸']]
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
      ['down', 'left', 'up', 'right'].forEach(d => pv.append(Sprites.canvas(S.look, d)));
      top.append(pv, el('div', '', `${S.name}, ${S.age} anos`)); body.append(el('h3', '', 'Guarda-roupa e espelho'), top);
      const change = () => { save(); renderTab('roupa'); };
      [['Cabelo', 'cabelo'], ['Cor do cabelo', 'corCabelo'], ['Roupa de cima', 'cima'], ['Roupa de baixo', 'baixo'], ['Calçado', 'calcado'], ['Acessório', 'acessorio']].forEach(([t, k]) => { body.append(el('h3', '', t)); LOOK_SECTIONS[k](body, S.look, change); });
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
        const v = cleanName(draftA.farm, 'farm').value.trim(); if (!nameOk(v)) return;
        S.farmName = v; S.pet.sp = draftA.pet; save();
        $('modal').hidden = true; renderHud(); renderHotbar();
        toast(`Bem-vindo de volta a ${S.farmName}`);
        if (S.day >= PET_DAY) toast('Alguém da vila pode aparecer numa dessas manhãs...');
        if (!S.intro) intro();
      });
      ok.id = 'setup-ok';
      const f = nameField('Nome da fazenda', draftA.farm, 'farm', 'Ex.: Sítio Recanto', v => { draftA.farm = v; ok.disabled = !nameOk(v); }, 'setup-farm');
      body.append(f.box, el('p', 'hint', 'Animal favorito'));
      const petBox = el('div'); const drawPets = () => { petBox.replaceChildren(); petOptions(petBox, draftA.pet, id => { draftA.pet = id; drawPets(); }); }; drawPets();
      ok.disabled = !nameOk(draftA.farm); ok.style.marginTop = '12px';
      body.append(petBox, ok);
    },
    loja(body) {
      body.append(el('h3', '', 'Armazém da Dona Celeste'), el('p', '', `Suas moedas: ${S.coins}`));
      const row = (id, name, unit, max, label, go, extra) => {
        const li = el('li'), meta = el('div', 'meta'), qty = el('b', 'qty', '1'), tot = el('span', '', '');
        let n = 1; const upd = () => { qty.textContent = n; tot.textContent = `${label} ${n} por ${n * unit} moedas`; ok.disabled = !max || (label === 'Comprar' && n * unit > S.coins); };
        const ok = btn('btn primary', 'Confirmar', () => go(n)); ok.dataset.item = id;
        const left = el('div', 'shop-item'); left.append(cloneIcon(extra || id), el('span', '', `${name} — ${unit} moedas cada`));
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
      if (qDone('galinheiro') && S.coop.hens.length < MAX_HENS) buy.append(row('galinha', 'Galinha', HEN_PRICE, 1, 'Comprar', () => {
        if (S.coins < HEN_PRICE) return toast('Moedas insuficientes');
        S.coins -= HEN_PRICE; save(); closeModal(); run(() => newHen('narr'));
      }, 'ovo'));
      body.append(buy, el('h3', '', 'Vender'));
      const sell = el('ul', 'list sell'), ids = [...new Set(S.inv.filter(s => s && ITEMS[s.id].sell).map(s => s.id))];
      if (!ids.length) sell.append(el('li', 'dim', 'Você não tem nada para vender agora. Colheitas, ovos, frutos e o que achar no bosque têm preço.'));
      ids.forEach(id => sell.append(row(id, `${ITEMS[id].name} (você tem ${count(id)})`, ITEMS[id].sell, count(id), 'Vender', n => {
        n = Math.min(n, count(id)); if (!n) return;
        removeItem(id, n); S.coins += n * ITEMS[id].sell; toast(`+${n * ITEMS[id].sell} moedas`); save(); renderTab('loja');
      })));
      body.append(sell);
    },
  };
  const SPECIAL = ['bau', 'roupa', 'loja', 'ajuste'];
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
  const PLACE_NAME = { casa: 'dentro de casa', loja: 'no Armazém', galinheiro: 'no galinheiro', montanha: 'na serra', tenda: 'na tenda de Lúcio' };
  const LEGEND = { casa: 'Sua casa', galinha: 'Galinheiro', cerca: 'Cercado das galinhas', roca: 'Roça (terra cultivável)', agua: 'Água (lago, lagoa e nascente)', loja: 'Armazém', praca: 'Praça e fonte', morador: 'Casa de morador', bosque: 'Bosque e mata', trilha: 'Trilha da serra (norte)', tenda: 'Tenda de Lúcio', rocha: 'Rochedos da serra' };
  function renderMap() {
    const m = World.get('fora'), mt = World.get('montanha'), c = $('map-canvas'), g = c.getContext('2d');
    c.width = m.w; c.height = m.h + MAP_FY; g.imageSmoothingEnabled = false;
    g.fillStyle = '#3e4a34'; g.fillRect(0, 0, m.w, MAP_FY);
    for (let i = 0; i < 40; i++) { g.fillStyle = i % 2 ? '#56604a' : '#6a6a5a'; const x = (i * 97) % m.w, y = (i * 53) % (MAP_FY - 40); for (let r = 0; r < 18; r++) g.fillRect(x - r, y + r, r * 2, 1); }   // morros
    g.drawImage(mt.bg, MAP_SX, 0); g.drawImage(m.bg, 0, MAP_FY);
    g.fillStyle = 'rgba(16,20,40,.18)'; g.fillRect(0, 0, c.width, c.height);
    $('map-title').textContent = `${S.farmName}, ${VILA} e a serra — ${REGIAO}`;
    // nomes de regiões
    label(g, S.farmName, 200, 186 + MAP_FY, 16); label(g, VILA, 640, 36 + MAP_FY, 16); label(g, 'Serra', MAP_SX + 320, 90, 16);
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
    if (at.where !== 'loja') return run(() => say('narr', 'O balcão está vazio. Dona Celeste atende das 6h às 18h; depois disso, costuma estar na praça.'));
    talkTo(c);
  }

  /* Ganchos para testes automatizados e depuração. */
  window.__trilha = {
    get S() { return S; }, get P() { return P; }, get map() { return map; }, get hover() { return hover; }, get near() { return hover && hover.ok ? hover : null; }, get busy() { return blocked(); }, get hens() { return hens; }, save,
    cam: () => World.camera(map, P.x, P.y), lucioLine: () => bandLine(villagerById('lucio')), weekOf, get pet() { return pet; }, questTarget: id => questTarget(id || tracked()), marker: () => trackedMarker(), openMap, fit, petEvent, cleanName, textWidth,
    villagerAt: id => villagerAt(villagerById(id), S.time), tile: i => World.tilePos(i),
    place(m, x, y, dir) { enterMap(m, x, y, dir || 'down'); P.x = x; P.y = y; },
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
      set markers(v) { DEV.markers = v; },
    };
  }

  initTitle();
  requestAnimationFrame(loop);
})();
