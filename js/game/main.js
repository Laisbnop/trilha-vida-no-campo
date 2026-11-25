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
