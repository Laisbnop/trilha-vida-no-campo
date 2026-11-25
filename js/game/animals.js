/* Jogo — animais: galinhas do galinheiro e o bicho de estimação.
   Parte de js/game/ (antes era js/game.js). São scripts comuns, carregados em ordem pelo index.html:
   as declarações de nível superior (estado S, P, map etc. e as funções) valem para todos os arquivos, sem
   cópias (não são módulos). O jogo começa em js/game/main.js, o último. */

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
