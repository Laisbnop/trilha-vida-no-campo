/* Mundo — acesso aos mapas: cache dos cenários por estação, get, colisão (free, solidAt), água, câmera e
   conversão entre ladrilho e posição.
   Parte de js/world/ (antes era js/world.js). São scripts comuns, carregados em ordem pelo index.html:
   as declarações de nível superior valem para todos os arquivos (não são módulos). O objeto World,
   com as funções públicas, é montado no fim, em js/world/index.js. */

const cache = {};
const OUTDOOR = { fora: () => buildFora(), montanha: () => buildMontanha() };
/* Mapas externos têm uma versão por estação; interiores, uma só. */
function get(id) {
  const key = OUTDOOR[id] ? id + ':' + SEASON : id;
  if (!cache[key]) {
    const prevSeed = treeSeed;
    paintSeason = OUTDOOR[id] ? SEASON : -1;
    try { cache[key] = OUTDOOR[id] ? OUTDOOR[id]() : buildRoom(id); } finally { paintSeason = -1; treeSeed = prevSeed; }
  }
  return cache[key];
}
function setSeason(si) { SEASON = ((si % 4) + 4) % 4; }
/* A caixa dos pés (10x6, com x,y no centro da base) está livre de obstáculos fixos? */
function free(map, x, y) {
  const x0 = x - 5, y0 = y - 6;
  if (x0 < 0 || y0 < 0 || x0 + 10 > map.w || y > map.h) return false;
  for (let cy = Math.floor(y0 / CELL); cy <= Math.floor((y - 1) / CELL); cy++) for (let cx = Math.floor(x0 / CELL); cx <= Math.floor((x0 + 9) / CELL); cx++) if (map.solid[cy * map.cols + cx]) return false;
  return true;
}
/* Água de pesca no ponto: devolve 'lago', 'rio' ou null. A ponte não conta como água. */
function waterZone(map, x, y) {
  for (const w of map.waters || []) if (((x - w.cx) / (w.rx - 2)) ** 2 + ((y - w.cy) / (w.ry - 2)) ** 2 <= 1) return w.zone || 'lago';
  for (const st of map.streams || []) {
    if ((st.bridges || []).some(([bx, by, bw, bh]) => x >= bx - 1 && x <= bx + bw && y >= by - 3 && y <= by + bh + 1)) continue;
    for (let i = 0; i < st.pts.length; i += 2) { const [px, py] = st.pts[i]; if ((x - px) ** 2 + (y - py) ** 2 <= (st.hw - 1) ** 2) return st.zone; }
  }
  return null;
}
/* Ponto dentro de um obstáculo fixo (parede, casa, tronco, água)? */
const solidAt = (map, x, y) => { const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL); return cx < 0 || cy < 0 || cx >= map.cols || cy >= map.rows || !!map.solid[cy * map.cols + cx]; };
/* Câmera: segue o personagem; se o mapa for menor que a tela, fica centralizado. */
const axis = (size, view, p) => size <= view ? Math.round((size - view) / 2) : Math.round(Math.max(0, Math.min(size - view, p - view / 2)));
/* padB: folga embaixo (interiores mais altos que a tela): a saída nunca fica sob a barra de ferramentas. */
const camera = (map, px, py) => ({ x: axis(map.w, VW, px), y: axis(map.h + (map.padB || 0), VH, py - 14) });
/* Canteiro da grade da fazenda que contém o ponto (ou -1). */
const tileAt = (x, y) => { const c = Math.floor((x - GRID.x0) / GRID.s), r = Math.floor((y - GRID.y0) / GRID.s); return c < 0 || r < 0 || c >= GRID.cols || r >= GRID.rows ? -1 : r * GRID.cols + c; };
const tilePos = i => ({ x: GRID.x0 + (i % GRID.cols) * GRID.s, y: GRID.y0 + Math.floor(i / GRID.cols) * GRID.s });
