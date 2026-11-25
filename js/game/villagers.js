/* Jogo — moradores: conversa, amizade, presentes, falas por faixa de amizade, Caleb e Lúcio.
   Parte de js/game/ (antes era js/game.js). São scripts comuns, carregados em ordem pelo index.html:
   as declarações de nível superior (estado S, P, map etc. e as funções) valem para todos os arquivos, sem
   cópias (não são módulos). O jogo começa em js/game/main.js, o último. */

/* =====================================================
   MORADORES
   ===================================================== */
function talkTo(v) {
  run(async () => {
    const who = speaker(v);
    if (v.id === 'lucio' && !S.lucio.met) return meetLucio(v);
    if (v.id === 'lucio' && qActive().includes('fogo') && fireWindow() === 0) return fireScene();
    if (boardReady(v)) return boardDeliver(v, who);                       // pedido do quadro com os itens na mochila
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
    if (S.board.active && S.board.active.from === v.id) await say('narr', `Pedido do quadro para ${v.name}: ${boardProgress(S.board.active)}, ${boardDue(S.board.active)}.`);
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
