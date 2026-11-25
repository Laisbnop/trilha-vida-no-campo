/* Jogo — inventário: pegar, guardar e contar itens.
   Parte de js/game/ (antes era js/game.js). São scripts comuns, carregados em ordem pelo index.html:
   as declarações de nível superior (estado S, P, map etc. e as funções) valem para todos os arquivos, sem
   cópias (não são módulos). O jogo começa em js/game/main.js, o último. */

/* =====================================================
   INVENTÁRIO
   ===================================================== */
/* Coloca n itens no conjunto de espaços; devolve quantos NÃO couberam. */
function addTo(arr, id, n) {
  for (const s of arr) { if (n && s && s.id === id && s.n < STACK && !s.cm) { const k = Math.min(n, STACK - s.n); s.n += k; n -= k; } }
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
