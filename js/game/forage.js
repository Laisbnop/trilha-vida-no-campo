/* Jogo — coletáveis sazonais da vila: onde e quando aparecem.
   Parte de js/game/ (antes era js/game.js). São scripts comuns, carregados em ordem pelo index.html:
   as declarações de nível superior (estado S, P, map etc. e as funções) valem para todos os arquivos, sem
   cópias (não são módulos). O jogo começa em js/game/main.js, o último. */

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
  S.seasonal = S.seasonal.filter(q => q !== o); addXp('coleta', SKILL_GAIN.forage, o.x, o.y - 16); bang(o.x, o.y - 6, 'leaf'); save();
}
