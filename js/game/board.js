/* Jogo — quadro de pedidos da praça (ao lado do Armazém): um pedido novo por manhã, feito por um morador já
   conhecido, de um item que dá para conseguir naquela estação. Aceito, vai para o Diário; entrega-se falando com
   quem pediu, com os itens na mochila. Prazo: até o fim do dia seguinte. Textos e regras em js/data-board.js.
   Estado no save: S.board = { today, seen, active, done }.
     today  = pedido do dia no quadro (ainda não aceito) · seen = o jogador já leu o pedido de hoje
     active = pedido aceito em andamento (um por vez) · done = pedidos entregues
   Pedido: { from, type ('item' | 'fish'), item, qty, coins, friend, ask, thanks, day, due (dia em que vence) }.
   Parte de js/game/: script comum, carregado em ordem pelo index.html (as declarações de nível superior valem para
   todos os arquivos, sem cópias; não é módulo). */

/* =====================================================
   QUADRO DE PEDIDOS
   ===================================================== */
const boardOn = () => qDone('chegada');                                   // só depois das boas-vindas no Armazém
/* Moradores que já apareceram para o jogador (Lúcio depois de conhecê-lo, Caleb depois de chegar à vila). */
const boardMet = v => (v.id === 'lucio' ? !!(S.lucio && S.lucio.met) : v.id === 'caleb' ? !!(S.caleb && S.caleb.arrived) : true);
const boardPrice = id => (FISH[id] ? FISH[id].price : ITEMS[id].sell || 0);
/* Quantidade e nome: "5 ovos", "uma sardinha", "um pedaço de madeira". */
function boardItems(id, n) { const [one, many, gen] = BOARD_NOUN[id]; return n === 1 ? `${gen === 'f' ? 'uma' : 'um'} ${one}` : `${n} ${many}`; }
/* Cultivo plantado na fazenda agora (em qualquer estágio). */
const planted = crop => Object.values(S.farm.tiles).some(o => o.k === 'soil' && o.crop === crop && !o.dead);
/* O que dá para pedir hoje: só o que o jogador consegue nesta estação, com o que já liberou. */
function boardPool(si = calendar().si) {
  const out = [], add = (id, type) => { if (BOARD_NOUN[id] && !out.some(o => o.id === id)) out.push({ id, type }); };
  add('madeira', 'item'); add('pedra', 'item');
  Object.keys(CROPS).forEach(c => {                                         // da estação; já plantado (ou guardado) ou de colheita rápida
    if (!cropInSeason(c, si) || !SHOP.includes(CROPS[c].seed)) return;
    if (planted(c) || owns(c) || CROPS[c].days <= BOARD.fastCrop) add(c, 'item');
  });
  if (S.coop.hens.length) add('ovo', 'item');                              // ovos só com galinhas
  SEASONAL_FORAGE[si].items.forEach(([id]) => add(id, 'item'));            // coletáveis da vila nesta estação
  ['amora', 'cogumelo', 'flor'].forEach(id => add(id, 'item'));            // coletáveis do bosque (o ano todo)
  if (S.fish.rod) Object.keys(FISH).forEach(id => add(id, 'fish'));        // peixes do rio e dos lagos (o ano todo)
  return out;
}
/* Quantidade: barato pede mais, caro pede menos (1 a 10), com limites para o que aparece pouco. */
function boardQty(id, type, rnd) {
  let n = Math.round(BOARD.qtyBase / Math.max(1, boardPrice(id)));
  n += Math.floor(rnd() * 3) - 1;
  if (type === 'fish') n = Math.min(n, BOARD.maxFish);
  if (id === 'ovo') n = Math.min(n, S.coop.hens.length * BOARD.eggPerHen);
  if (SEASONAL_FORAGE.some(f => f.items.some(([x]) => x === id)) || ['amora', 'cogumelo', 'flor'].includes(id)) n = Math.min(n, BOARD.maxForage);
  return Math.max(1, Math.min(BOARD.maxQty, n));
}
/* Sorteia o pedido do dia (com semente da partida e do dia: recarregar não muda). */
function boardDraw() {
  let sd = (S.seed + S.day * 104729 + 17) >>> 0; const rnd = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296;
  const pool = boardPool(), who = VILLAGERS.filter(v => boardMet(v) && BOARD_TEXT[v.id]);
  if (!pool.length || !who.length) return null;
  const start = Math.floor(rnd() * who.length);
  for (let k = 0; k < who.length; k++) {                                      // quem pede; se não houver item possível, o próximo
    const v = who[(start + k) % who.length];
    const opts = pool.filter(o => giftKind(v, o.id) !== 'dislike').map(o => ({ o, w: { love: 4, like: 3 }[giftKind(v, o.id)] || 1 }));
    if (!opts.length) continue;
    let r = rnd() * opts.reduce((a, b) => a + b.w, 0), pick = opts[0].o;    // preferência pelo que o morador gosta
    for (const { o, w } of opts) { if ((r -= w) < 0) { pick = o; break; } }
    const qty = boardQty(pick.id, pick.type, rnd), T = BOARD_TEXT[v.id];
    const coins = Math.max(BOARD.round, Math.round(BOARD.coinMult * boardPrice(pick.id) * qty / BOARD.round) * BOARD.round);
    return { from: v.id, type: pick.type, item: pick.id, qty, coins, friend: FRIEND.like, day: S.day,
      ask: Math.floor(rnd() * T.ask[pick.type].length), thanks: Math.floor(rnd() * T.thanks[pick.type].length) };
  }
  return null;
}
/* Pedido novo (de manhã, ou pelo modo de desenvolvimento). Não há pedido novo enquanto outro estiver aceito. */
function boardNew() {
  S.board.today = S.board.active ? null : boardDraw();
  S.board.seen = !S.board.today;
  return S.board.today;
}
/* Virada da noite: o pedido aceito vence no fim do dia seguinte ao aceite; o do quadro é trocado. */
function boardMorning(notes) {
  const B = S.board;
  if (B.active && S.day > B.active.due) { notes.push(`O pedido de ${villagerById(B.active.from).name} venceu.`); B.active = null; }
  if (boardOn()) boardNew(); else { B.today = null; B.seen = true; }
}
const boardNewMark = () => !!(S && S.board && S.board.today && !S.board.seen && boardOn());
const boardDue = o => (S.day >= o.due ? 'até hoje' : 'até amanhã');
const boardProgress = o => `${Math.min(count(o.item), o.qty)}/${o.qty} ${BOARD_NOUN[o.item][o.qty === 1 ? 0 : 1]}`;
const boardReady = v => { const o = S.board && S.board.active; return !!o && o.from === v.id && count(o.item) >= o.qty; };
const boardText = (o, kind) => fmt(BOARD_TEXT[o.from][kind][o.type][o[kind]] || BOARD_TEXT[o.from][kind][o.type][0]).replace(/\{itens\}/g, boardItems(o.item, o.qty)).replace(/\{item\}/g, BOARD_NOUN[o.item][0]);
const boardReward = o => `${o.coins} moedas e amizade com ${villagerById(o.from).name}`;
/* Entrega, ao falar com quem pediu: agradece, tira os itens da mochila e paga. */
async function boardDeliver(v, who) {
  const o = S.board.active;
  await say(who, withExpr(boardText(o, 'thanks'), 'like'));
  removeItem(o.item, o.qty);
  S.coins += o.coins; addFriend(v.id, o.friend);
  S.board.active = null; S.board.done = (S.board.done || 0) + 1;
  toast(`Pedido do quadro entregue: +${o.coins} moedas`);
  save(); renderHud(); renderHotbar();
}
/* Clique no quadro. */
function openBoard() {
  if (!boardOn()) return run(() => say('narr', 'Ainda não tem nada aqui. O quadro de avisos está vazio, só com umas tachinhas.'));
  openModal('quadro');
}
function boardAccept() {
  const o = S.board.today; if (!o || S.board.active) return;
  S.board.active = Object.assign({}, o, { accepted: S.day, due: S.day + BOARD.days - 1 });
  S.board.today = null; S.board.seen = true;
  toast(`Pedido aceito: ${boardItems(o.item, o.qty)} para ${villagerById(o.from).name}`);
  save(); closeModal(); renderHud();
}
/* Retrato pequeno de quem pediu (o mesmo do diálogo, reduzido). */
function boardPortrait(v) { const c = Sprites.portrait(v.portrait, 'neutro'); c.classList.add('board-face'); return c; }
/* Painel do quadro: o pedido do dia, ou o aviso de que há um pedido em andamento. */
TABS.quadro = body => {
  const B = S.board;
  if (B.today) B.seen = true;
  const paper = el('div', 'board-paper');
  if (B.active) {
    const v = villagerById(B.active.from);
    paper.append(el('p', '', `Volte quando terminar o pedido de ${v.name}.`), el('p', 'dim', `Em andamento: ${boardItems(B.active.item, B.active.qty)} (${boardProgress(B.active)}), ${boardDue(B.active)}. Entregue falando com ${v.name}.`));
    body.append(paper); return;
  }
  const o = B.today;
  if (!o) { paper.append(el('p', '', 'Nenhum pedido novo hoje. Volte amanhã cedo.')); body.append(paper); return; }
  const v = villagerById(o.from), head = el('div', 'board-head');
  head.append(boardPortrait(v), el('b', '', v.name));
  const want = el('div', 'board-want'); want.append(cloneIcon(o.item), el('span', '', `${ITEMS[o.item].name} × ${o.qty}`));
  paper.append(head, el('p', 'board-ask', boardText(o, 'ask').replace(/^\[[^\]]*\]/, '')), want,
    el('p', 'dim', `Prazo: ${BOARD.days} dias depois de aceitar (até o fim de amanhã).`),
    el('p', 'ok', `Recompensa: ${boardReward(o)}`));
  const row = el('div', 'li-actions');
  const yes = btn('btn primary', 'Aceitar', boardAccept); yes.id = 'board-accept';
  const no = btn('btn', 'Agora não', closeModal); no.id = 'board-later';
  row.append(yes, no); paper.append(row); body.append(paper);
  save(); renderHud();
};
TAB_TITLE.quadro = 'Quadro de pedidos';
SPECIAL.push('quadro');
/* Diário: seção própria para o pedido aceito. */
function boardDiary(body) {
  body.append(el('h3', '', 'Pedidos do quadro'));
  const ul = el('ul', 'list'), o = S.board && S.board.active;
  if (!o) ul.append(el('li', 'dim', boardOn() ? 'Nenhum pedido aceito. O quadro fica na praça, ao lado do Armazém.' : 'O quadro de pedidos da praça abre depois das boas-vindas no Armazém.'));
  else {
    const v = villagerById(o.from), li = el('li'); li.dataset.order = o.item;
    li.append(el('span', 'mt', `${ITEMS[o.item].name} para ${v.name}`), el('span', 'dim', `Pedido de: ${v.name} · ${boardDue(o)}`),
      el('span', 'ok', 'Progresso: ' + boardProgress(o)), el('span', 'dim', 'Recompensa: ' + boardReward(o)),
      el('span', '', o.type === 'fish' ? `Pesque e leve até ${v.name}.` : `Junte os itens e leve até ${v.name}.`));
    ul.append(li);
  }
  if (S.board && S.board.done) ul.append(el('li', 'dim', `Pedidos entregues até agora: ${S.board.done}`));
  body.append(ul);
}
/* Ícone e legenda no Mapa (M). */
MAP_ICON.quadro = (g, x, y) => { g.fillStyle = '#241a2c'; g.fillRect(x - 9, y - 8, 18, 14); g.fillRect(x - 7, y + 6, 2, 4); g.fillRect(x + 5, y + 6, 2, 4); g.fillStyle = '#a8743c'; g.fillRect(x - 8, y - 7, 16, 12);
  g.fillStyle = '#f4ecd8'; g.fillRect(x - 6, y - 5, 5, 6); g.fillRect(x + 1, y - 4, 5, 7); g.fillStyle = '#e04a3a'; g.fillRect(x - 4, y - 5, 1, 1); g.fillRect(x + 3, y - 4, 1, 1); };
LEGEND.quadro = 'Quadro de pedidos';
