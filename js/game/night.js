/* Jogo — fim do dia: dormir, desmaiar, o que muda à noite (processNight) e o resumo do dia.
   Parte de js/game/ (antes era js/game.js). São scripts comuns, carregados em ordem pelo index.html:
   as declarações de nível superior (estado S, P, map etc. e as funções) valem para todos os arquivos, sem
   cópias (não são módulos). O jogo começa em js/game/main.js, o último. */

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
