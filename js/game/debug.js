/* Jogo — ganchos para testes automatizados (window.__trilha) e modo de desenvolvimento (?dev=1).
   Parte de js/game/ (antes era js/game.js). São scripts comuns, carregados em ordem pelo index.html:
   as declarações de nível superior (estado S, P, map etc. e as funções) valem para todos os arquivos, sem
   cópias (não são módulos). O jogo começa em js/game/main.js, o último. */

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
