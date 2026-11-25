/* Jogo — interação: alvos do mouse, uso das ferramentas na terra e nas árvores, teclado e toque.
   Parte de js/game/ (antes era js/game.js). São scripts comuns, carregados em ordem pelo index.html:
   as declarações de nível superior (estado S, P, map etc. e as funções) valem para todos os arquivos, sem
   cópias (não são módulos). O jogo começa em js/game/main.js, o último. */

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
    : T(`Regar (água: ${S.can}/${CAN_MAX})`, () => { if (!S.can) return tip('Regador vazio: encha no lago.'); if (!useTool(id, 1)) return; S.can--; o.w = 1; bang(cx, cy, 'water'); if (o.crop) qEvent('water'); renderHotbar(); save(); });
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
    case 'board': return { label: boardNewMark() ? 'Quadro de pedidos (novo!)' : 'Quadro de pedidos', act: openBoard };
    case 'bed': return { label: 'Dormir', act: bed };
    case 'chest': return { label: 'Abrir o baú', act: () => openModal('bau') };
    case 'wardrobe': return { label: 'Guarda-roupa e espelho', act: () => openModal('roupa') };
    case 'counter': return { label: 'Balcão do Armazém', reach: 20, act: shop };
    case 'water': return id === 'regador' ? { label: `Encher o regador (${S.can}/${CAN_MAX})`, reach: 18, act: () => { useTool('regador', 0); S.can = CAN_MAX; bang(P.x, P.y - 16, 'water'); toast('Regador cheio'); renderHotbar(); save(); } }
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
