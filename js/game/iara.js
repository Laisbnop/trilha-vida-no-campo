/* Jogo — Iara: pinturas da fonte, falas e acontecimentos de amizade.
   Parte de js/game/ (antes era js/game.js). São scripts comuns, carregados em ordem pelo index.html:
   as declarações de nível superior (estado S, P, map etc. e as funções) valem para todos os arquivos, sem
   cópias (não são módulos). O jogo começa em js/game/main.js, o último. */

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
