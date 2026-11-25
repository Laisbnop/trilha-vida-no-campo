/* Mundo — vegetação: árvores (pinheiros, copas em cachos, frutíferas) e cercas de madeira.
   Parte de js/world/ (antes era js/world.js). São scripts comuns, carregados em ordem pelo index.html:
   as declarações de nível superior valem para todos os arquivos (não são módulos). O objeto World,
   com as funções públicas, é montado no fim, em js/world/index.js. */

/* ================= árvores =================
   Tronco: largura que varia (alarga na base), casca com sulcos e nós, luz à esquerda, sombra da copa no alto e raízes
   discretas. Copa: cachos de folhas sobrepostos e assimétricos (cada exemplar diferente, pela posição), desenhados
   de trás para a frente; cada cacho tem sombra profunda embaixo, meio-tom, luz no alto à esquerda e folhinhas
   desenhadas (claras na luz, escuras na sombra). O contorno escuro fecha a silhueta, e entre os cachos fica a sombra. */
const tvar = (seed, i) => { let h = (seed * 2654435761 + i * 40503) | 0; h = Math.imul(h ^ (h >>> 15), 2246822519); h ^= h >>> 13; return ((h >>> 0) % 1000) / 1000; };
function trunk(x, y, h, seed, wide = 0) {
  const B = '#6a4426', BL = '#8a5e36', BD = '#4a2c18', BDD = '#38200f';
  for (let k = 0; k <= h; k++) {                                       // de baixo (k = 0) para cima
    const yy = y - k, hw = (k < 2 ? 4 : k < 5 ? 3 : 3) + wide, l = x - hw + (k >= 5 && k % 4 === 1 && tvar(seed, 70) < 0.5 ? 1 : 0), r = x + hw - 1 - (k >= 6 && tvar(seed, 71 + (k >> 2)) < 0.3 ? 1 : 0);
    R(l - 1, yy, r - l + 3, 1, OUT);
    R(l, yy, r - l + 1, 1, B); R(l, yy, 1, 1, BL); if (r - l > 3) R(l + 1, yy, 1, 1, shade(BL, 0.94));
    R(r, yy, 1, 1, BD); R(r - 1, yy, 1, 1, k % 3 ? BD : B);
    const groove = l + 2 + Math.floor(tvar(seed, 80 + (k >> 2)) * Math.max(1, r - l - 3));   // sulcos da casca (verticais, com quebras)
    if (k % 4 !== 3 && k > 1) R(groove, yy, 1, 1, BD);
    if (k >= h - 2) R(l, yy, r - l + 1, 1, BDD);                       // sombra da copa no alto do tronco
  }
  if (tvar(seed, 90) < 0.6) { const ky = y - 4 - Math.floor(tvar(seed, 91) * 3); R(x, ky, 2, 1, BDD); R(x, ky - 1, 1, 1, BL); }   // nó
  // raízes: saem da base para os lados, baixas, com contorno
  const rootL = 2 + Math.floor(tvar(seed, 92) * 2), rootR = 2 + Math.floor(tvar(seed, 93) * 2), bw = 4 + wide;
  R(x - bw - rootL - 1, y - 1, rootL + 1, 1, OUT); R(x - bw - rootL - 1, y, rootL + 2, 1, OUT); R(x - bw - rootL, y, rootL, 1, B); R(x - bw - rootL, y, 1, 1, BL);
  R(x + bw, y - 1, rootR + 1, 1, OUT); R(x + bw - 1, y, rootR + 2, 1, OUT); R(x + bw - 1, y, rootR, 1, BD);
  if (tvar(seed, 94) < 0.5) { R(x - 1, y + 1, 3, 1, OUT); R(x, y + 1, 1, 1, B); }
}
/* Copa: (cx, cy) centro, r raio, P = { out, deep, d, m, l, hi }. Os cachos ficam dentro de r + 2. */
function canopy(cx, cy, r, P, seed, opt = {}) {
  const n = opt.n || (r >= 10 ? 8 : r >= 7 ? 6 : 4), sq = opt.squash || 1;
  const lobes = [];
  for (let i = 0; i < n; i++) {                                         // anel assimétrico + miolo e topo
    const a = (i / n) * 6.283 + (tvar(seed, i) - 0.5) * 0.9, d = r * (0.38 + tvar(seed, i + 10) * 0.18), rr = Math.max(2, Math.round(r * (0.38 + tvar(seed, i + 20) * 0.18)));
    lobes.push([cx + Math.cos(a) * d * 1.08, cy + Math.sin(a) * d * 0.88 * sq + (Math.sin(a) > 0 ? 1 : 0), rr]);
  }
  lobes.push([cx + (tvar(seed, 40) - 0.5) * r * 0.3, cy - r * 0.42 * sq, Math.round(r * 0.5)]);   // topo
  lobes.push([cx + (tvar(seed, 41) - 0.5) * r * 0.2, cy + r * 0.05, Math.round(r * 0.55)]);       // miolo
  const L = lobes.map(([x, y, rr]) => [Math.round(x), Math.round(y), Math.min(rr, r)]).sort((a, b) => a[1] - b[1]);   // de trás (alto) para a frente (baixo)
  L.forEach(([x, y, rr]) => blob(x, y, rr + 2, P.out, sq));                                  // silhueta
  L.forEach(([x, y, rr], i) => {
    blob(x, y, rr + 1, P.deep, sq);                                                          // borda em sombra profunda: separa cada cacho do de trás
    blob(x, y - 1, rr, P.d, sq);
    blob(x - Math.round(rr * 0.2), y - Math.round(rr * 0.3) - 1, Math.max(1, Math.round(rr * 0.72)), P.m, sq);
    blob(x - Math.round(rr * 0.38), y - Math.round(rr * 0.5) - 1, Math.max(1, Math.round(rr * 0.36)), P.l, sq);
    // folhinhas: claras em cima e à esquerda, escuras embaixo e à direita
    const k = Math.max(4, Math.round(rr * 2.2));
    for (let j = 0; j < k; j++) {                                                            // folhas em "v": ponta, corpo e sombra
      const a = tvar(seed, 100 + i * 17 + j) * 6.283, d = Math.sqrt(tvar(seed, 300 + i * 17 + j)) * (rr - 1), px = Math.round(x + Math.cos(a) * d), py = Math.round(y - 1 + Math.sin(a) * d * sq);
      const lit = Math.sin(a) < 0.2 && Math.cos(a) < 0.6, f = tvar(seed, 500 + i * 17 + j) < 0.5;
      if (lit) { R(px, py, 1, 1, P.hi); R(px + 2, py, 1, 1, f ? P.hi : P.l); R(px + 1, py + 1, 1, 1, P.l); R(px + 1, py + 2, 1, 1, P.m); }
      else { R(px, py, 1, 1, P.m); R(px + 2, py, 1, 1, P.d); R(px + 1, py + 1, 1, 1, P.deep); }
    }
  });
  return L;
}
/* Paleta de folhas de uma árvore, já com as cores da estação (o outono varia por exemplar). */
function leafPal(seed) {
  const AUT = [{ '#267a3a': '#b8521c', '#369a48': '#d06e22', '#58b858': '#e89a34', '#84d470': '#f4c050', '#1c5c30': '#7a3214' },
    { '#267a3a': '#9a2e1c', '#369a48': '#c0442a', '#58b858': '#de6a3a', '#84d470': '#f09060', '#1c5c30': '#62200f' },
    { '#267a3a': '#b88a1c', '#369a48': '#d8a82a', '#58b858': '#f0c848', '#84d470': '#f8e080', '#1c5c30': '#7a5a14' }][Math.abs(seed) % 3];
  const L = c => SC(paintSeason === 2 ? AUT[c] || c : c);
  return { out: SC('#0f3020'), deep: L('#1c5c30'), d: L('#267a3a'), m: L('#369a48'), l: L('#58b858'), hi: L('#84d470') };
}
function tree(x, y, r = 11) {            // (x, y) = base do tronco
  const seed = treeSeed;
  shadowOval(x + 2, y, r + 1, 3);                                       // sombra no chão (luz vinda da esquerda)
  const th = 9 + Math.floor(tvar(seed, 1) * 3);
  trunk(x, y, th, seed, paintSeason === 3 ? -1 : r >= 12 ? 1 : r <= 9 ? -1 : 0);
  const cy = y - th - r + 2 + Math.floor(tvar(seed, 2) * 2);
  if (paintSeason === 3) {                                   // inverno: sem folhas
    bareBranches(x, cy - r + 2, r);
    for (let i = 0; i < r * 2; i++) { rand(); rand(); }
    return;
  }
  const P = leafPal(seed);
  if (paintSeason === 1) { P.d = SC('#2a8a2c'); P.l = SC('#6cc444'); P.hi = SC('#a2dc5a'); }   // verão: verde mais vivo e cheio
  canopy(x + Math.round((tvar(seed, 3) - 0.5) * 2), cy, r, P, seed);
  for (let i = 0; i < r * 2; i++) {                                    // (o sorteio é consumido como antes)
    const a = rand() * 6.28, d = rand() * (r - 3), px = Math.round(x + Math.cos(a) * d), py = Math.round(cy + Math.sin(a) * d * 0.9);
    if (paintSeason === 0 && i % 3 === 0) { R(px, py, 2, 2, '#ffc2d8'); R(px, py, 1, 1, '#fff4f8'); R(px + 1, py + 1, 1, 1, '#e07aa0'); }   // florada da primavera, no lado da luz
  }
  if (paintSeason === 2) for (let i = 0; i < 6; i++) R(x - r + 1 + Math.floor(tvar(seed, 60 + i) * r * 2), y + 1 + (i % 2), 2, 1, ['#c8581e', '#e09030', '#8a3a18'][i % 3]);   // folhas no chão
}
/* Pinheiro: ramos em camadas que caem para os lados, com pontas recortadas, luz à esquerda, sombra sob cada
   camada e tronco com casca. Cada exemplar varia (altura, largura, número de camadas, inclinação), pela posição. */
function pine(x, y) {
  const hs = (i, k) => { let h = (treeSeed * 374761393 + i * 668265263 + k * 1013904223) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
  const OL = '#173a20', DP = '#21522a', BD = '#2c6e38', MD = '#3a8444', LT = '#58a050', TP = '#82c060', snow = paintSeason === 3;
  const tiers = 3 + (hs(1, 1) < 0.5 ? 1 : 0), wk = 0.88 + hs(2, 1) * 0.24, ht = 30 + Math.floor(hs(3, 1) * 5), lean = hs(4, 1) < 0.33 ? -1 : hs(4, 1) > 0.67 ? 1 : 0;
  shadowOval(x, y, 8, 2);
  R(x - 2, y - 7, 5, 8, '#3a2416'); R(x - 1, y - 7, 3, 7, '#6a4428'); R(x - 1, y - 7, 1, 7, '#8a5e36'); R(x + 1, y - 5, 1, 2, '#4a3020');   // tronco
  R(x - 3, y - 1, 2, 1, '#4a3020'); R(x + 2, y - 1, 2, 1, '#4a3020');                                                                  // raízes
  const top = y - 6 - ht, step = (ht - 4) / tiers;
  for (let t = tiers - 1; t >= 0; t--) {                                                        // de baixo para cima: cada camada cai por cima da de baixo
    const k = (t + 1) / tiers, cy = Math.round(top + 2 + t * step), th = Math.round(step + 5), half = Math.min(12, Math.round((3 + k * 8.5) * wk)), sh = (t % 2 ? 1 : -1) * (hs(5, t) < 0.5 ? 1 : 0), lx = Math.round(lean * (1 - k) * 2);
    for (let r = 0; r < th; r++) {
      const f = Math.pow((r + 1) / th, 0.6), hw = Math.max(1, Math.round(half * f)), jl = 0, jr = 0, xl = x + lx - hw + jl + (r > th - 3 ? sh : 0), xr = x + lx + hw - jr + (r > th - 3 ? sh : 0);   // lados recortados
      R(xl - 1, cy + r, xr - xl + 2, 1, OL);
      R(xl, cy + r, xr - xl, 1, BD);
      R(xl, cy + r, Math.max(1, Math.round((xr - xl) * (r < th * 0.45 ? 0.5 : 0.3))), 1, r < 2 ? TP : r < th * 0.45 ? LT : MD);   // luz à esquerda e no alto da camada
      R(xr - Math.max(1, Math.round((xr - xl) * 0.28)), cy + r, Math.max(1, Math.round((xr - xl) * 0.28)), 1, DP);   // sombra à direita
      if (snow && r < 2) R(xl + 1, cy + r, Math.max(1, Math.round((xr - xl) * 0.6)), 1, '#eef4fa');
    }
    // pontas recortadas da camada (caem 1–2 px, desencontradas)
    const by = cy + th, hw = half;
    for (let i = -hw; i <= hw; i += 2) { const d = hs(10 + t, i + 20) < 0.5 ? 1 : 2; R(x + lx + i + sh, by, 1, d, OL); if (d === 2) R(x + lx + i + sh, by, 1, 1, i < 0 ? MD : DP); }
    R(x + lx - Math.round(half * 0.4), by - 1, Math.round(half * 1.2), 1, DP);                            // sombra sob a camada
    if (!snow) {                                                                                            // tufos de folhas iluminadas (volume)
      const ry2 = cy + Math.round(th * 0.45), lx2 = x + lx - Math.round(half * (0.45 + hs(50, t) * 0.2));
      R(lx2, ry2, 3, 1, LT); R(lx2 + 1, ry2 - 1, 2, 1, TP); R(lx2 - 1, ry2 + 1, 3, 1, MD);
      if (half > 7) { const lx3 = x + lx + Math.round(half * 0.15); R(lx3, ry2 + 2, 2, 1, MD); R(lx3 + 1, ry2 + 1, 1, 1, LT); }
    }
  }
  R(x + Math.round(lean * 2) - 1, top, 2, 2, OL); R(x + Math.round(lean * 2), top, 1, 2, snow ? '#ffffff' : TP);   // ponta
}
/* Arbusto: menor que as árvores; contorno irregular (3 a 5 cachos de tamanhos diferentes), folhas reconhecíveis,
   base mais escura e sombra no chão. Cada exemplar varia pela posição (sem sorteio). */
function bush(x, y, r = 5, c = '#2f8a40') {
  const seed = Math.round(x * 13 + y * 7), C = SC(c);
  shadowOval(x + 1, y + 1, r + 2, 2);
  if (paintSeason === 3) {                                               // coberto de neve
    canopy(x, y - r + 1, r, { out: SC('#143c24'), deep: shade(C, 0.6), d: shade(C, 0.75), m: shade(C, 0.75), l: shade(C, 0.9), hi: shade(C, 0.9) }, seed, { n: 3 + (seed % 3), squash: 0.8 });
    blob(x, y - r - 1, Math.max(2, r - 1), '#f4f8fc', 0.5); R(x - r + 2, y - r, r * 2 - 4, 1, '#d4e0ec'); return;
  }
  const P = { out: SC('#143c24'), deep: shade(C, 0.55), d: shade(C, 0.75), m: C, l: shade(C, 1.3), hi: shade(C, 1.55) };
  if (paintSeason === 2) { P.l = shade(C, 1.1); P.hi = '#d8a040'; }
  canopy(x, y - r + 1, r, P, seed, { n: 3 + (seed % 3), squash: 0.82 });
  R(x - r + 2, y, r * 2 - 3, 1, P.out); R(x - r + 3, y - 1, r * 2 - 5, 1, P.deep);    // base mais escura, rente ao chão
  const fl = k => tvar(seed, 500 + k);
  if (paintSeason === 2) { R(x + Math.round((fl(1) - 0.5) * r), y - r, 1, 1, '#e09030'); R(x - 2, y - r + 2, 1, 1, '#8a3a18'); return; }
  if (paintSeason === 0) [0, 1, 2].forEach(k => R(x + Math.round((fl(k) - 0.5) * r * 1.4), y - r - 1 + Math.round(fl(k + 5) * r * 0.8), 1, 1, k % 2 ? '#ff9ec0' : '#ffffff'));   // florzinhas na primavera
  else if (paintSeason === 1 && fl(9) < 0.5) R(x - 2, y - r + 1, 1, 1, '#ffe066');
}
/* ================= cercas de madeira =================
   Postes com espessura (4 px), topo arredondado e claro, veio discreto, luz à esquerda, sombra à direita e base escura;
   duas travessas que entram nos postes, com sombra nas junções. Cada trecho horizontal é uma figura ordenada pela
   base (quem está atrás da cerca fica atrás dela); nos trechos verticais cada poste é uma figura, e uma travessa
   vertical liga um poste ao de baixo. Cantos usam o mesmo poste dos dois trechos. As colisões não mudam. */
const fencePal = c => { const C = SC(c); return { C, L: shade(C, 1.16), LL: shade(C, 1.34), D: shade(C, 0.76), DD: shade(C, 0.58) }; };
function fencePost(x, y, P, h = 12, k = 0) {               // (x, y): coluna da esquerda do miolo e pé do poste
  R(x, y - h, 4, 1, OUT); R(x - 1, y - h + 1, 6, h, OUT);
  R(x, y - h + 1, 4, h - 1, P.C); R(x, y - h + 2, 1, h - 3, P.L); R(x + 3, y - h + 2, 1, h - 2, P.D);
  R(x, y - h + 1, 4, 1, P.LL); R(x + 1, y - h + 2, 2, 1, P.L);                        // topo arredondado e iluminado
  R(x + 1 + (k & 1), y - h + 5 + (k % 3), 1, 2 + (k % 2), P.D);                         // veio da madeira
  R(x, y - 1, 4, 1, P.DD);                                                              // base mais escura, junto ao chão
  if (paintSeason === 3) { R(x, y - h - 1, 4, 1, '#f4f8fc'); R(x - 1, y - h, 6, 1, '#f4f8fc'); R(x + 1, y - h - 2, 2, 1, '#ffffff'); }
}
function fenceRails(xa, xb, y, P) {                         // travessas entre o poste de xa e o de xb
  if (xb - xa < 6) return;
  for (const top of [y - 10, y - 5]) {
    R(xa + 4, top, xb - xa - 4, 1, OUT); R(xa + 4, top + 1, xb - xa - 4, 1, P.L); R(xa + 4, top + 2, xb - xa - 4, 1, P.C); R(xa + 4, top + 3, xb - xa - 4, 1, OUT);
    for (let x = xa + 6; x < xb - 2; x += 5) if (((x * 7 + top) & 3) === 0) R(x, top + 2, 2, 1, P.D);   // veio
    R(xa + 4, top + 1, 1, 2, P.DD); R(xb - 1, top + 1, 1, 2, P.D);                        // sombra nas junções
    if (paintSeason === 3) R(xa + 5, top, xb - xa - 6, 1, '#eef3f8');
  }
}
/* Trecho horizontal de x0 a x1 (postes nas duas pontas, espaçados por igual). */
function fence(x0, x1, y, c = '#b88448') {
  const P = fencePal(c), n = Math.max(1, Math.round((x1 - x0) / 12)), xs = [];
  for (let i = 0; i <= n; i++) xs.push(Math.round(x0 + (x1 - x0) * i / n) - 1);
  bldSprite(x0 - 4, y - 16, x1 - x0 + 10, 18, y, () => {
    g.fillStyle = 'rgba(20,40,20,.22)'; g.fillRect(x0, y, x1 - x0 + 2, 1);               // sombra no chão
    for (let i = 0; i < n; i++) fenceRails(xs[i], xs[i + 1], y, P);
    xs.forEach((x, i) => fencePost(x, y, P, 12, i + x));
  }, true);
}
/* Trecho vertical em x, de y0 a y1: um poste atrás do outro, ligados por uma travessa (cada poste ordenado pela base).
   ends: false deixa os postes das pontas para os trechos horizontais (cantos). */
function fenceCol(x, y0, y1, c = '#b88448', ends = true) {
  const P = fencePal(c), n = Math.max(1, Math.round((y1 - y0) / 9)), ys = [];
  for (let i = 0; i <= n; i++) ys.push(Math.round(y0 + (y1 - y0) * i / n));
  ys.forEach((y, i) => {
    if (!ends && (i === 0 || i === n)) {                    // canto: só a travessa que chega ao poste do trecho horizontal
      if (i === n) bldSprite(x - 3, ys[i - 1] - 12, 8, y - ys[i - 1] + 2, y - 1, () => { R(x - 2, ys[i - 1] - 9, 1, y - ys[i - 1] - 3, OUT); R(x + 1, ys[i - 1] - 9, 1, y - ys[i - 1] - 3, OUT); R(x - 1, ys[i - 1] - 9, 1, y - ys[i - 1] - 3, P.L); R(x, ys[i - 1] - 9, 1, y - ys[i - 1] - 3, P.D); }, true);
      return;
    }
    bldSprite(x - 3, (i ? ys[i - 1] : y) - 14, 8, y - (i ? ys[i - 1] : y) + 16, y, () => {
      if (i) { const ya = ys[i - 1]; R(x - 2, ya - 9, 1, y - ya - 2, OUT); R(x + 1, ya - 9, 1, y - ya - 2, OUT); R(x - 1, ya - 9, 1, y - ya - 2, P.L); R(x, ya - 9, 1, y - ya - 2, P.D); R(x - 1, y - 13, 2, 1, P.DD); }   // travessa vertical até este poste
      g.fillStyle = 'rgba(20,40,20,.22)'; g.fillRect(x - 1, y, 5, 1);
      fencePost(x - 1, y, P, 12, i + y);
    }, true);
  });
}
/* Poste de porteira: mais alto e grosso, com chapéu. */
function gatePost(x, y, c = '#8a5e36') {
  const P = fencePal(c);
  bldSprite(x - 4, y - 20, 12, 22, y, () => {
    g.fillStyle = 'rgba(20,40,20,.25)'; g.fillRect(x - 1, y, 7, 1);
    R(x - 1, y - 14, 7, 15, OUT); R(x, y - 13, 5, 13, P.C); R(x, y - 12, 1, 11, P.L); R(x + 4, y - 12, 1, 12, P.D); R(x, y - 1, 5, 1, P.DD);
    R(x + 2, y - 9, 1, 4, P.D); R(x + 1, y - 4, 2, 1, P.D);                               // veio
    R(x - 2, y - 17, 9, 4, OUT); R(x - 1, y - 16, 7, 2, P.LL); R(x - 1, y - 14, 7, 1, P.D);  // chapéu
    if (paintSeason === 3) R(x - 2, y - 18, 9, 2, '#f4f8fc');
  }, true);
}
function lamp(x, y) {
  R(x - 1, y - 20, 3, 20, OUT); R(x, y - 19, 1, 19, '#6a6a7a');
  R(x - 3, y - 26, 7, 7, OUT); R(x - 2, y - 25, 5, 5, '#ffe89a'); R(x - 1, y - 24, 2, 2, '#fffbe0');
  R(x - 2, y - 1, 5, 2, OUT);
}
function barrel(x, y) {
  R(x - 1, y - 1, 10, 12, OUT); R(x, y, 8, 10, '#9a6a3a'); R(x + 1, y, 2, 10, '#c08a4e');
  R(x, y + 2, 8, 1, '#5a4030'); R(x, y + 7, 8, 1, '#5a4030');
}
function sign(x, y, c) {
  R(x + 5, y, 2, 10, '#6a4426'); R(x - 1, y - 9, 14, 10, OUT); R(x, y - 8, 12, 8, '#f0e6cc'); R(x + 3, y - 6, 6, 4, c);
}
function well(x, y) {
  shadowOval(x + 9, y + 12, 11, 3);
  R(x - 1, y - 1, 20, 14, OUT); R(x, y, 18, 12, '#a8a098'); R(x, y, 18, 3, '#c8c0b8');
  for (let i = 0; i < 18; i += 6) { R(x + i + 5, y + 3, 1, 9, '#807870'); R(x + i + 2, y + 7, 1, 5, '#807870'); }
  R(x + 3, y + 1, 12, 3, '#2a5a9a'); R(x + 5, y + 2, 4, 1, '#8fc8f0');
  R(x, y - 14, 2, 14, '#6a4426'); R(x + 16, y - 14, 2, 14, '#6a4426');
  R(x - 3, y - 18, 24, 5, OUT); R(x - 2, y - 17, 22, 3, '#b0502e'); R(x - 2, y - 17, 22, 1, '#d87048');
}
function fountain(x, y) {
  shadowOval(x, y + 9, 15, 4);
  blob(x, y, 14, OUT, 0.6); blob(x, y, 13, '#d8d2c4', 0.6); blob(x, y, 10, '#3f86d8', 0.6); blob(x - 2, y - 1, 6, '#6aacf0', 0.6);
  R(x - 2, y - 10, 4, 10, OUT); R(x - 1, y - 9, 2, 9, '#e8e2d4');
  R(x - 4, y - 12, 8, 3, OUT); R(x - 3, y - 11, 6, 1, '#bfe4ff');
}

/* Coreto da praça sul: piso redondo de tábuas, colunas e telhado em ponta. (x, y) = centro do piso. */
function coreto(x, y) {
  shadowOval(x + 2, y + 14, 30, 6);
  blob(x, y + 6, 27, OUT, 0.45); blob(x, y + 6, 26, '#c8a070', 0.45); blob(x, y + 5, 22, '#dcb886', 0.45);
  for (let i = -20; i <= 20; i += 5) R(x + i, y, 1, 11, '#b08458');
  [[-22, 2], [22, 2], [-12, 11], [12, 11]].forEach(([dx, dy]) => { R(x + dx - 1, y + dy - 20, 4, 21, OUT); R(x + dx, y + dy - 19, 2, 19, '#f4ead4'); });
  for (let r = 0; r < 18; r++) { const hw = 6 + Math.round(r * 1.5); R(x - hw - 1, y - 38 + r, hw * 2 + 2, 1, OUT); R(x - hw, y - 38 + r, hw * 2, 1, r % 4 === 3 ? '#8a3a2a' : r < 3 ? '#e07a5a' : '#c8583e'); }
  R(x - 1, y - 43, 3, 6, OUT); R(x, y - 42, 1, 4, '#f0c050');
  snowCap(x - 26, y - 22, 52, 3);
}
/* Canteiro de flores com moldura de madeira. */
function flowerBed(x, y, w, h) {
  R(x - 1, y - 1, w + 2, h + 2, OUT); R(x, y, w, h, '#8a5e36'); R(x + 1, y + 1, w - 2, h - 2, '#6a4426');
  const cs = ['#ff7088', '#ffe066', '#ffffff', '#c8a0ff', '#ff9ec0'];
  for (let yy = y + 2; yy < y + h - 2; yy += 3) for (let xx = x + 2; xx < x + w - 2; xx += 3) {
    if (paintSeason === 3) { R(xx, yy, 2, 1, '#eef3f8'); continue; }
    R(xx, yy + 1, 1, 1, '#2f7028');
    R(xx, yy, 1, 1, paintSeason === 2 ? ['#c8581e', '#e09030', '#8a3a18'][(xx + yy) % 3] : cs[(xx * 3 + yy) % cs.length]);
  }
  solid(x, y, w, h);
}
/* Banco de madeira (só enfeite; o banco da praça principal é o de Seu Honório). */
function benchDeco(x, y) {
  R(x - 1, y - 1, 22, 6, OUT); R(x, y, 20, 4, '#b88448'); R(x, y, 20, 1, '#d8a868');
  R(x - 1, y - 6, 22, 4, OUT); R(x, y - 5, 20, 2, '#a8743e');
  R(x + 1, y + 4, 2, 3, '#5a3a1e'); R(x + 17, y + 4, 2, 3, '#5a3a1e'); solid(x, y - 4, 20, 8);
}
/* Mesa de piquenique. */
function picnic(x, y) {
  shadowOval(x + 13, y + 12, 16, 3);
  R(x - 1, y - 1, 28, 12, OUT); R(x, y, 26, 10, '#c08a4e'); R(x, y, 26, 2, '#dcae6e'); for (let i = 6; i < 26; i += 7) R(x + i, y + 2, 1, 8, '#9a6a3a');
  R(x - 3, y - 6, 32, 4, OUT); R(x - 2, y - 5, 30, 2, '#a8743e'); R(x - 3, y + 12, 32, 4, OUT); R(x - 2, y + 13, 30, 2, '#a8743e');
  solid(x - 3, y - 6, 32, 22);
}
/* Terreno reservado: estacas com fita, mato baixo e uma placa. */
function lot(x, y, w, h, gapY) {
  for (let i = 0; i < w * h / 60; i++) R(x + 3 + rand() * (w - 6), y + 3 + rand() * (h - 6), 2, 1, rand() < 0.5 ? '#a8a060' : '#c8b878');
  const stake = (sx, sy) => { R(sx - 1, sy - 9, 4, 10, OUT); R(sx, sy - 8, 2, 8, '#d8a868'); R(sx, sy - 8, 2, 1, '#e04a3a'); };
  for (let xx = x; xx <= x + w; xx += 16) { stake(xx, y); stake(xx, y + h); }
  for (let yy = y + 16; yy < y + h; yy += 16) { if (!(yy > gapY - 14 && yy < gapY + 14)) stake(x, yy); stake(x + w, yy); }
  R(x, y - 6, w + 2, 1, '#e8d070'); R(x, y + h - 6, w + 2, 1, '#e8d070'); R(x + w, y - 6, 1, h + 1, '#e8d070');
  R(x, y - 6, 1, gapY - 12 - y, '#e8d070'); R(x, gapY + 10, 1, y + h - gapY - 10, '#e8d070');
  solid(x - 2, y - 4, w + 4, 6); solid(x - 2, y + h - 4, w + 4, 6); solid(x + w - 2, y, 6, h);
  solid(x - 2, y, 6, gapY - 12 - y); solid(x - 2, gapY + 12, 6, y + h - gapY - 12);
}
/* Píer de tábuas sobre a água, para pescar. */
function pier(x, y, w, h) {
  R(x - 1, y - 1, w + 2, h + 3, OUT); R(x, y, w, h, '#b88448');
  for (let yy = y + 3; yy < y + h; yy += 4) R(x, yy, w, 1, '#7a5028');
  R(x, y, 1, h, '#d8a868'); R(x + w - 2, y, 2, h, '#6a4426');
  [[x - 2, y + h - 4], [x + w - 1, y + h - 4]].forEach(([px, py]) => { R(px - 1, py - 1, 4, 7, OUT); R(px, py, 2, 5, '#5a3a1e'); });
  open(x, y, w, h); keep(x - 8, y - 8, w + 16, h + 16);
}
