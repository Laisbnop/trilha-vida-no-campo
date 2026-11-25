/* Jogo — missões: andamento, entrega, recompensa e alvo no mapa.
   Parte de js/game/ (antes era js/game.js). São scripts comuns, carregados em ordem pelo index.html:
   as declarações de nível superior (estado S, P, map etc. e as funções) valem para todos os arquivos, sem
   cópias (não são módulos). O jogo começa em js/game/main.js, o último. */

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
  if (boardReady(v)) return true;                                        // pedido do quadro pronto para entregar
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
