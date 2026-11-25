/* Mundo — mapa externo: chão da fazenda, estradas e trilhas, água e rio, prédios e a montagem do mapa
   (fazenda, vila e bosque), com os pontos de coletáveis e os lugares do mapa (M).
   Parte de js/world/ (antes era js/world.js). São scripts comuns, carregados em ordem pelo index.html:
   as declarações de nível superior valem para todos os arquivos (não são módulos). O objeto World,
   com as funções públicas, é montado no fim, em js/world/index.js. */

/* Chão da fazenda: a área de trabalho é uma clareira contínua de terra ocre dourada (que engloba a estrada em
   frente à casa e os caminhos da fazenda), com bordas de grama viva avançando sobre a terra em recortes e tufos.
   A grama fica junto à casa, ao lago e nas bordas, com vegetação mais densa nas bordas. Detalhes do chão só em
   grupos ocasionais. Tudo pela posição (hash/ruído), sem tocar no sorteio do cenário; nada sobre caminhos de
   moradores, construções ou objetos. A forma do chão não muda o que se cultiva ou atravessa. */
const FARM = { x0: 8, y0: 26, x1: 402, y1: 512 };
const mix0 = (a, b2, k) => a.map((v, j) => Math.round(v + (b2[j] - v) * k));
function farmDirtPal(S) {
  if (S === 3) return { base: [226, 230, 236], v1: [214, 220, 228], v2: [236, 240, 245], mark: [196, 200, 206], shade: [198, 204, 214] };   // neve (terra por baixo)
  if (S === 2) return { base: [206, 146, 70], v1: [196, 137, 64], v2: [214, 155, 80], mark: [172, 116, 54], shade: [180, 122, 58] };
  return { base: [220, 160, 66], v1: [211, 151, 61], v2: [227, 169, 77], mark: [186, 126, 52], shade: [192, 134, 56] };
}
function farmIsDirt(x, y) {
  const M = cur.pave; if (M && M[y * W + x] === 1) return true;                           // caminhos da fazenda viram parte da clareira
  // área de trabalho: retângulo arredondado em volta da grade de plantio, ligado à estrada; borda em curvas e recortes
  const rx0 = 30, ry0 = 180, rx1 = 376, ry1 = 368, out = Math.hypot(Math.max(0, rx0 - x, x - rx1), Math.max(0, ry0 - y, y - ry1));
  const lim = 8 + (vnoise(x, y, 26, 401) - 0.5) * 18 + (vnoise(x, y, 6, 402) - 0.5) * 5;
  if (out === 0 || out < lim) return true;                                              // dentro da área de trabalho, sempre terra (sem ilhas)
  // a estrada em frente à casa se abre um pouco para os lados (sem parecer faixa colada por cima)
  if (x > 56 && x < 402) { const d = Math.max(0, Math.abs(y - 164) - 12); if (d < 3 + (vnoise(x, y, 14, 403) - 0.5) * 8 + (vnoise(x, y, 5, 404) - 0.5) * 3) return true; }
  return false;
}
function farmGround() {
  const { x0: X0, y0: Y0, x1: X1, y1: Y1 } = FARM, w = X1 - X0, h = Y1 - Y0, img = g.getImageData(X0, Y0, w, h), D = img.data, M = cur.pave, S = paintSeason;
  const Pd = farmDirtPal(S), GB = mix0(rgb('#3a7e2c'), rgb('#4f9c38'), 0.3);
  const dirt = new Uint8Array(w * h);
  for (let y = Y0; y < Y1; y++) for (let x = X0; x < X1; x++) dirt[(y - Y0) * w + (x - X0)] = farmIsDirt(x, y) ? 1 : 0;
  const isD = (x, y) => x < X0 || y < Y0 || x >= X1 || y >= Y1 ? 0 : dirt[(y - Y0) * w + (x - X0)];
  for (let y = Y0; y < Y1; y++) for (let x = X0; x < X1; x++) {
    const i = ((y - Y0) * w + (x - X0)) * 4; let c;
    if (isD(x, y)) {
      c = Pd.base;
      // textura fina, de baixo contraste: marquinhas desenhadas em células de 5 px, só onde há grupo (áreas tranquilas entre eles)
      const cx5 = Math.floor(x / 5), cy5 = Math.floor(y / 5), lx5 = x - cx5 * 5, ly5 = y - cy5 * 5, mk = hash(cx5, cy5, 440);
      if (vnoise(x, y, 18, 441) > 0.48 && mk < 0.5) {
        const kind = Math.floor(mk * 6) % 3, ox = 1 + Math.floor(hash(cx5, cy5, 442) * 2), oy = 1 + Math.floor(hash(cx5, cy5, 443) * 3);
        if (kind === 0 && ly5 === oy && (lx5 === ox || lx5 === ox + 1)) c = Pd.v1;                       // risquinho
        else if (kind === 1 && lx5 === ox && ly5 === oy) c = Pd.v2; else if (kind === 1 && lx5 === ox && ly5 === oy + 1) c = Pd.v1;   // grão com sombra
        else if (kind === 2 && ((lx5 === ox && ly5 === oy) || (lx5 === ox + 1 && ly5 === oy + 1))) c = Pd.v1;  // marca diagonal
      }
      if (!isD(x, y - 1) || !isD(x, y - 2) && hash(x, 0, 407) < 0.5) c = Pd.shade;                  // sombra suave sob a borda de grama
      if (x > X1 - 18 && M && M[y * W + x] === 1) { const k = (x - (X1 - 18)) / 18, o = [D[i], D[i + 1], D[i + 2]]; c = c.map((v, j) => Math.round(v + (o[j] - v) * k)); }   // emenda com a estrada da vila
    } else {
      if (M && M[y * W + x]) continue;
      if (!(isD(x, y + 1) || isD(x, y + 2) && hash(x, y, 409) < 0.6)) continue;                     // a grama de folhinhas fica como está
      c = GB;                                                                                          // base escura da grama que avança sobre a terra
    }
    D[i] = c[0]; D[i + 1] = c[1]; D[i + 2] = c[2];
  }
  g.putImageData(img, X0, Y0);
  const busy = (x, y) => { const c = Math.floor(x / CELL), r = Math.floor(y / CELL), i = r * cur.cols + c; return c < 0 || r < 0 || !!(cur.path[i] || cur.solid[i]); };
  const L = { d: SC('#2f7028'), m: SC('#468c32'), l: SC('#78c452'), b: SC('#3a7e2c') };
  // tufo de grama (folhas reconhecíveis: base escura, volume médio, pontas iluminadas)
  // grama baixa: pequenos grupos de folhas curtas, em direções e tamanhos variados (não um leque simétrico)
  const tuft = (x, y, n, hmax, v) => {
    const leaves = 2 + n + (v & 1);
    for (let j = 0; j < leaves; j++) {
      const r = a => hash(x * 3 + j, y, a), len = Math.max(2, Math.min(hmax, 2 + Math.floor(r(431) * (hmax - 1)))), dx = r(432) < 0.4 ? -1 : r(432) > 0.7 ? 1 : 0, ox = Math.round((j - leaves / 2) * 1.3 + (r(433) - 0.5));
      for (let k = 0; k < len; k++) { const px = x + ox + (k >= 1 ? dx * Math.ceil(k / 2) : 0); R(px, y - k, 1, 1, k === 0 ? L.d : k === len - 1 ? L.l : (j + v) % 2 ? L.m : L.b); }
    }
    if (S === 3) R(x - 1, y - hmax + 1, 3, 1, '#f4f8fc');
  };
  // tufos na borda grama/terra, debruçados sobre a terra
  for (let y = Y0 + 2; y < Y1 - 2; y += 3) for (let x = X0 + 2; x < X1 - 2; x += 2) {
    if (isD(x, y) || !(isD(x, y + 1) || isD(x + 1, y) || isD(x - 1, y))) continue;
    if (hash(Math.floor(x / 9), Math.floor(y / 9), 411) > 0.55 || hash(x, y, 412) > 0.22 || busy(x, y) || (M && M[(y + 1) * W + x] && M[(y + 1) * W + x] !== 1)) continue;
    tuft(x, y + 1, 1 + Math.floor(hash(x, y, 413) * 2), 4 + Math.floor(hash(x, y, 414) * 3), x & 1);
  }
  // grama: poucos grupos de folhas; vegetação mais volumosa perto das bordas da fazenda
  const edgeK = (x, y) => Math.max(0, 1 - Math.min(x - 24, 392 - x, y - 36, 504 - y) / 28);
  for (let cy = Y0 + 6; cy < Y1 - 6; cy += 12) for (let cx = X0 + 6; cx < X1 - 6; cx += 12) {
    const x = cx + Math.floor(hash(cx, cy, 415) * 8), y = cy + Math.floor(hash(cx, cy, 416) * 8), ek = edgeK(x, y);
    if (isD(x, y) || isD(x, y + 3) || busy(x, y) || busy(x, y - 6) || (M && M[y * W + x])) continue;
    if (hash(cx, cy, 417) < (vnoise(cx, cy, 40, 430) > 0.5 ? 0.3 : 0.04) + ek * 0.5) {
      if (ek > 0.35 && hash(cx, cy, 418) < 0.55) { tuft(x - 2, y, 2, 4, 0); tuft(x + 2, y + 1, 1, 5, 1); tuft(x, y + 2, 1, 3, 0); }   // grupinhos mais cheios nas bordas
      else tuft(x, y, 1, 3 + Math.floor(hash(cx, cy, 419) * 2), cx & 1);
    }
  }
  // detalhes da terra: pequenos grupos (pedrinhas, marcas e brotinhos), com espaço livre entre eles
  for (let cy = Y0 + 10; cy < Y1 - 10; cy += 30) for (let cx = X0 + 10; cx < X1 - 10; cx += 30) {
    if (hash(cx, cy, 420) > 0.42) continue;
    const ox = cx + Math.floor(hash(cx, cy, 421) * 20) - 10, oy = cy + Math.floor(hash(cx, cy, 422) * 20) - 10, kind = Math.floor(hash(cx, cy, 423) * 3);
    for (let k = 0; k < 3 + (cx + cy) % 2; k++) {
      const x = ox + Math.floor(hash(ox, k, 424) * 9) - 4, y = oy + Math.floor(hash(oy, k, 425) * 6) - 3;
      if (!isD(x, y) || !isD(x + 2, y + 1) || !isD(x, y - 2) || busy(x, y)) continue;
      if (kind === 0) { R(x, y, 2, 1, S === 3 ? '#c8ccd4' : '#c8b49a'); R(x, y + 1, 2, 1, S === 3 ? '#a8aeb8' : '#9a8468'); }       // pedrinha
      else if (kind === 1) { g.fillStyle = `rgb(${Pd.mark.join(',')})`; g.fillRect(x, y, 2 + (k % 2), 1); }                            // marca na terra
      else if (S !== 3) { R(x, y, 1, 1, L.m); R(x + 1, y - 1, 1, 1, L.l); R(x + 2, y, 1, 1, L.m); }                                    // brotinho
    }
  }
}
function road(kind, x, y, w, h) { spendRand(() => ground(kind, x, y, w, h)); paveRect(kind, x, y, w, h); keep(x - 4, y - 4, w + 8, h + 8); }
/* Trilha de terra em curva (pontos [x, y]), com borda e pedrinhas. */
function trail(pts, r = 9) {
  const L = [];
  for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 2); for (let k = 0; k <= n; k++) L.push([x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n]); }
  const disc = (x, y, rr, c) => { for (let dy = -rr; dy <= rr; dy++) { const w = Math.round(Math.sqrt(rr * rr - dy * dy)); R(Math.round(x) - w, Math.round(y) + dy, w * 2 + 1, 1, c); } };
  L.forEach(([x, y]) => paveDisc('terra', x, y, r));
  L.forEach(([x, y], i) => { if (i % 3 === 0) spendRand(() => R(x - r + 2 + rand2() * (r * 2 - 4), y - r + 2 + rand2() * (r * 2 - 4), 2, 1, rand2() < 0.5 ? '#f0e0b0' : '#c8ac70')); keep(x - r - 4, y - r - 4, r * 2 + 8, r * 2 + 8); });
}
const obj = o => { cur.objs.push(Object.assign({ r: 18 }, o)); };

/* Figura alta em canvas próprio: o personagem pode passar por trás. */
function tallImg(drawFn, w, h, ox) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const prev = g, pr = rand; g = c.getContext('2d'); rand = rng(w * 31 + h * 7 + ox); g.translate(ox, h - 4); drawFn(0, 0); g = prev; rand = pr;
  return { img: c, ox, h };
}
let treeSeed = 0;
function tall(drawFn, x, y, w, h, ox, box) {
  treeSeed = Math.round(x * 7 + y * 3);
  const s = tallImg(drawFn, w, h, ox);
  cur.sprites.push({ img: s.img, x: x - ox, y: y - h + 4, base: y });
  if (box) solid(x + box[0], y + box[1], box[2], box[3]);
}
const leafy = () => { cur.sprites[cur.sprites.length - 1].leafy = true; };     // copa: fica translúcida quando o jogador passa atrás
const addTree = (x, y, r = 11) => { tall((a, b) => tree(a, b, r), x, y, r * 2 + 8, r * 2 + 20, r + 4, [-4, -6, 8, 6]); leafy(); };
const addPine = (x, y) => { tall(pine, x, y, 26, 40, 13, [-4, -6, 8, 6]); leafy(); };
const addLamp = (x, y) => { tall(lamp, x, y, 12, 32, 6, [-2, -3, 5, 3]); cur.lights.push({ kind: 'lamp', x, y: y - 26, r: 40 }); };

function building(id, label, o, enter) {
  let doorX;
  if (o.paint) {                                   // fachada detalhada: sprite alto; só a parte de baixo bloqueia
    const b = o.y + o.h, pad = 32;
    g.fillStyle = 'rgba(20,40,20,.25)'; g.fillRect(o.x + 3, b + 1, o.w + 2, 3); g.fillRect(o.x + o.w + 1, o.solidY, 5, b - o.solidY);
    doorX = bldSprite(o.x - pad, o.top - 12, o.w + pad * 2, b - o.top + 18, b, () => o.paint(o));
    solid(o.x - 2, o.solidY, o.w + 4, b - o.solidY); keep(o.x - 10, o.top - 8, o.w + 20, b - o.top + 12);   // nada de árvore sorteada sobre o telhado
  } else { doorX = house(o); solid(o.x - 3, o.y + 4, o.w + 6, o.h - 4); }
  const d = { x: Math.round(doorX), y: Math.ceil((o.y + o.h) / CELL) * CELL + 7 };     // primeiro ponto livre em frente à porta
  const hit = [d.x - 9, o.y + o.h - 18, 18, 20];
  if (enter) { cur.doors[id] = d; obj({ id: 'door:' + id, kind: 'door', to: id, x: d.x, y: d.y - 3, r: 14, hit, label: 'Entrar: ' + label }); }
  else obj({ id: 'house:' + id, kind: 'text', x: d.x, y: d.y - 3, r: 13, hit, label, text: 'A porta está fechada. Bater sem ser chamado não é costume por aqui.' });
  return d;
}
function water(cx, cy, rx, ry, zone = 'lago') {
  /* Lago de margem natural: contorno com pequenas reentrâncias (sempre dentro da elipse de colisão), barranco de
     terra com grama entrando, faixa rasa clara junto à margem e água mais funda no meio. Variação pela posição. */
  const ph1 = hsh(cx, cy, 111) * 6.28, ph2 = hsh(cx, cy, 112) * 6.28, ph3 = hsh(cx, cy, 113) * 6.28;
  const edge = th => 0.955 + 0.03 * Math.sin(3 * th + ph1) + 0.015 * Math.sin(5 * th + ph2) + 0.012 * Math.sin(9 * th + ph3) - 0.012;
  const C = { bank: SC('#86764c'), bankD: shade(SC('#86764c'), 0.82), bankL: shade(SC('#86764c'), 1.14), gr: SC('#58a83c'), grD: SC('#4f9c38'), foam: SC('#bfe4ff'),
    sh: shade(SC('#3f86d8'), 1.16), mid: SC('#3f86d8'), deep: SC('#3478cc'), deeper: shade(SC('#3478cc'), 0.88), lip: shade(SC('#3f86d8'), 0.8) };
  const P = (x, y, c) => { g.fillStyle = c; g.fillRect(x, y, 1, 1); };
  for (let y = Math.floor(cy - ry - 5); y <= cy + ry + 5; y++) for (let x = Math.floor(cx - rx - 5); x <= cx + rx + 5; x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, d = Math.hypot(dx, dy), th = Math.atan2(dy, dx), b = edge(th);
    const reff = 1 / Math.hypot(Math.cos(th) / rx, Math.sin(th) / ry), px = (b - d) * reff, h = hsh(x, y, 114);
    const bankW = 2.4 + 1.6 * vnoise(th * 30 + 100, 0, 7, cx);                                  // largura do barranco varia devagar
    if (px < -bankW) continue;
    if (px < 0) {                                                                              // barranco de terra, com a grama entrando
      P(x, y, px > -1 ? C.bankD : C.bank); continue;
    }
    // margem rasa estreita e a água do lago num tom só; a parte funda é uma mancha suave fora do centro (sem anéis)
    const dz = Math.hypot((x + 0.5 - cx - rx * 0.12) / (rx * 0.62), (y + 0.5 - cy + ry * 0.1) / (ry * 0.55)) + (vnoise(x, y, 9, cx) - 0.5) * 0.25;
    let c = px < 1 ? (dy < 0 ? C.lip : C.foam) : px < 3 ? C.sh : dz < 1 ? C.deep : C.mid;
    if (px >= 3 && px < 4 && (x + y) % 2) c = C.sh;                                            // uma passagem discreta da faixa rasa
    P(x, y, c);
  }
  // pedrinhas e taboas na margem (sem taboas no inverno)
  for (let i = 0; i < 8; i++) {
    const th = ph1 + i * 0.79 + hsh(i, cx, 117) * 0.6, b = edge(th), reff = 1 / Math.hypot(Math.cos(th) / rx, Math.sin(th) / ry), x = Math.round(cx + Math.cos(th) * (b * reff + 2)), y = Math.round(cy + Math.sin(th) * (b * reff + 2));
    if (i % 3 === 1) { P(x, y, '#6a6870'); P(x + 1, y, '#8a8890'); P(x, y - 1, '#a8a6ae'); }
    else if (paintSeason !== 3 && Math.sin(th) > -0.3) { const st = paintSeason === 2 ? '#a08a3a' : '#3a7a2c'; for (let k = 0; k < 3; k++) { const hx = x - 1 + k * 2, hh = 5 + ((i + k) % 3); g.fillStyle = st; g.fillRect(hx, y - hh, 1, hh); g.fillStyle = '#6a4424'; g.fillRect(hx, y - hh - 1, 1, 2); } }
  }
  // margem clara por dentro e vitórias-régias (não no inverno)
  if (paintSeason !== 3) for (let i = 0; i < Math.max(1, Math.round(rx / 14)); i++) {
    const lx = Math.round(cx - rx * 0.6 + rand2() * rx * 1.2), ly = Math.round(cy - ry * 0.4 + rand2() * ry * 0.8);
    R(lx - 3, ly - 2, 6, 4, '#2c6a22'); R(lx - 2, ly - 2, 4, 3, '#58a838'); R(lx, ly - 2, 1, 2, '#2c6a22'); if (paintSeason === 0 && i % 2 === 0) { R(lx + 2, ly - 3, 2, 2, '#ffb8d0'); R(lx + 2, ly - 3, 1, 1, '#ffffff'); }
  }
  solid(cx - rx + 2, cy - ry + 4, rx * 2 - 4, ry * 2 - 6); keep(cx - rx - 8, cy - ry - 8, rx * 2 + 16, ry * 2 + 16);
  cur.waters.push({ cx, cy, rx, ry, zone });
}
/* Rio: água corrente ao longo de uma linha (pontos [x, y]), com margem de terra.
   A margem não é pintada por cima de um lago em que o rio desemboca. hw = meia largura da água. */
function stream(pts, hw, bridges) {
  const BR = !bridges ? [] : typeof bridges[0] === 'number' ? [bridges] : bridges;
  const L = [], inLake = (x, y) => cur.waters.some(w => ((x - w.cx) / (w.rx - 1)) ** 2 + ((y - w.cy) / (w.ry - 1)) ** 2 < 1);
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], n = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
    for (let k = 0; k < n; k++) L.push([x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n]);
  }
  const disc = (x, y, r, c) => { for (let dy = -r; dy <= r; dy++) { const w = Math.round(Math.sqrt(r * r - dy * dy)); R(x - w, y + dy, w * 2 + 1, 1, c); } };
  L.forEach(([x, y]) => { if (!inLake(x, y)) disc(Math.round(x), Math.round(y), hw + 3, '#86764c'); });
  L.forEach(([x, y]) => disc(Math.round(x), Math.round(y), hw, '#bfe4ff'));
  L.forEach(([x, y]) => disc(Math.round(x), Math.round(y), hw - 1, '#3f86d8'));
  L.forEach(([x, y]) => disc(Math.round(x), Math.round(y), hw - 4, '#3478cc'));
  L.forEach(([x, y], i) => { if (i % 3 === 0) { solid(x - hw + 3, y - 2, hw * 2 - 6, 4); keep(x - hw - 8, y - hw - 8, hw * 2 + 16, hw * 2 + 16); } });
  BR.forEach(([bx, by, bw, bh]) => {              // ponte de tábuas: dá para atravessar a pé
    const across = bh > bw;                        // ponte comprida no sentido norte-sul: tábuas deitadas
    R(bx - 1, by - 1, bw + 2, bh + 3, OUT); R(bx, by, bw, bh, '#a8743e');
    if (across) { for (let y = by + 3; y < by + bh; y += 4) R(bx, y, bw, 1, '#7a5028'); R(bx, by, 1, bh, '#d8a868'); R(bx + bw - 2, by, 2, bh, '#5a3a1e'); }
    else { for (let x = bx + 3; x < bx + bw; x += 4) R(x, by, 1, bh, '#7a5028'); R(bx, by, bw, 1, '#d8a868'); R(bx, by + bh - 1, bw, 2, '#5a3a1e'); }
    [[bx + 1, by - 3], [bx + bw - 3, by - 3], [bx + 1, by + bh - 1], [bx + bw - 3, by + bh - 1]].forEach(([x, y]) => { R(x - 1, y - 1, 4, 5, OUT); R(x, y, 2, 3, '#6a4426'); });
    open(bx, by, bw, bh); keep(bx - 10, by - 10, bw + 20, bh + 20);
  });
  cur.streams = cur.streams || [];
  cur.streams.push({ pts: L, hw, zone: 'rio', bridges: BR });
}

function buildFora() {
  const m = newMap('fora', FORA.w, FORA.h, 11); m.waters = [];
  grass();
  // ---------- estradas ----------
  road('terra', 60, 152, 1500, 24);                                              // estrada principal: fazenda → vila → bosque → bairro leste
  road('terra', 366, 176, 20, 298); road('terra', 52, 458, 334, 16);
  road('pedra', 560, 110, 140, 122);
  road('terra', 450, 176, 20, 124); road('terra', 622, 232, 20, 68); road('terra', 440, 300, 392, 22);
  // vila sul: ruelas descem até a rua de baixo, a praça do coreto e a beira-rio
  road('terra', 450, 322, 20, 264);                                              // ruela de Bia
  road('terra', 622, 322, 20, 120); road('terra', 622, 534, 20, 54);              // ruela da fonte ao coreto e à rua de baixo
  road('terra', 770, 322, 20, 264);                                              // ruela de Iara (caminho da escola)
  road('pedra', 560, 440, 150, 96);                                              // praça do coreto
  road('terra', 440, 586, 1120, 22);                                             // rua de baixo: vila → escola → bairro leste
  road('terra', 770, 608, 20, 162); road('terra', 1300, 608, 20, 162);            // descidas para a beira-rio
  road('areia', 410, 770, 1186, 22);                                             // areia da beira-rio (margem norte)
  road('areia', 410, 840, 1186, 30);                                             // margem sul do rio
  road('terra', 1300, 176, 20, 410);                                             // avenida do bairro leste
  trail([[1302, 300], [1262, 292], [1222, 280], [1186, 272], [1172, 266]]);          // trilha até a margem leste da lagoa
  trail([[710, 500], [736, 508], [756, 520], [772, 536]], 8);                     // atalho do coreto à ruela de Iara
  trail([[1110, 608], [1130, 640], [1166, 668], [1180, 700], [1168, 740], [1150, 770]], 8);   // trilha do poço à beira-rio
  trail([[1560, 608], [1530, 640], [1500, 690], [1470, 730], [1440, 770]], 8);     // trilha do pomar leste ao rio
  // centrinho calçado: frente do Armazém CELESTE, a rua até a casa de Seu Honório e a praça da fonte, num piso só
  paveRect('centro', 446, 148, 360, 30); paveRect('centro', 560, 110, 140, 122);
  paveDisc('terra', 100, 157, 14);                                                // terra batida que chega ao degrau da varanda
  paveFlush();
  farmGround();
  // ---------- fazenda ----------
  keep(GRID.x0 - 6, GRID.y0 - 6, GRID.cols * GRID.s + 12, GRID.rows * GRID.s + 12);
  {
    const d = farmhouse(52, 56);                                                   // casa: x 52..148, varanda até y 150
    solid(46, 50, 108, 86); solid(52, 144, 34, 8); solid(114, 144, 34, 8); solid(52, 136, 6, 10); solid(142, 136, 6, 10);
    keep(40, 40, 124, 116);
    m.doors.casa = d; obj({ id: 'door:casa', kind: 'door', to: 'casa', x: d.x, y: d.y - 3, r: 14, hit: [d.x - 12, d.y - 36, 24, 40], label: 'Entrar: Sua casa' });
  }
  water(336, 100, 40, 24);
  obj({ id: 'water', kind: 'water', x: SPOT.water[0], y: SPOT.water[1], r: 22, hit: [296, 76, 80, 54], label: 'Lago' });
  // boneco de treino
  box(SPOT.dummy[0] - 2, SPOT.dummy[1] - 4, 4, 4, '#6a4426'); solid(SPOT.dummy[0] - 5, SPOT.dummy[1] - 6, 10, 6); keep(SPOT.dummy[0] - 14, SPOT.dummy[1] - 30, 28, 40);
  obj({ id: 'dummy', kind: 'dummy', x: SPOT.dummy[0], y: SPOT.dummy[1] + 6, r: 16, hit: [SPOT.dummy[0] - 9, SPOT.dummy[1] - 32, 18, 36], label: 'Boneco de treino' });
  // galinheiro (com porta e interior) e cercado das galinhas
  {
    const d = coopHouse(52, 372);                                                  // prédio: x 52..136, y 372..452; porta embaixo, na estrada
    solid(47, 376, 94, 76); keep(40, 364, 270, 96);
    m.doors.galinheiro = { x: d.x, y: 463 };
    obj({ id: 'door:galinheiro', kind: 'door', to: 'galinheiro', x: d.x, y: 460, r: 14, hit: [d.x - 11, d.y - 26, 22, 28], label: 'Entrar: Galinheiro' });
    const X0 = 144, X1 = 300, Y0 = 392, Y1 = 448;                                 // cercado
    R(X0, Y0 - 4, X1 - X0, Y1 - Y0 + 4, '#b89858'); for (let i = 0; i < 110; i++) R(X0 + 2 + rand() * (X1 - X0 - 4), Y0 - 2 + rand() * (Y1 - Y0), 2, 1, rand() < 0.5 ? '#a08448' : '#d0b470');
    for (let i = 0; i < 8; i++) { const hx = X0 + 10 + rand() * (X1 - X0 - 20), hy = Y0 + 4 + rand() * (Y1 - Y0 - 10); R(hx, hy, 3, 1, '#e8d070'); R(hx + 1, hy - 1, 1, 1, '#e8d070'); }
    box(X1 - 26, Y0 + 2, 12, 5, '#8a9aa8'); R(X1 - 25, Y0 + 3, 10, 2, '#6aacf0');                        // bebedouro
    fence(X0, X1, Y0, '#d8b078'); fence(X0, 190, Y1, '#d8b078'); fence(230, X1, Y1, '#d8b078');
    fenceCol(X0, Y0, Y1, '#d8b078', false); fenceCol(X1, Y0, Y1, '#d8b078', false);
    gatePost(194, Y1 + 1); gatePost(222, Y1 + 1);                                                       // porteira aberta
    solid(X0 - 2, Y0 - 8, X1 - X0 + 6, 8); solid(X0 - 2, Y1 - 6, 56, 8); solid(226, Y1 - 6, X1 - 222, 8); solid(X0 - 2, Y0, 6, Y1 - Y0); solid(X1 - 2, Y0, 6, Y1 - Y0);
    R(X0 + 6, Y0 - 16, 30, 9, OUT); R(X0 + 7, Y0 - 15, 28, 7, '#f0e6cc'); R(X0 + 10, Y0 - 13, 22, 1, '#8a5e36'); R(X0 + 10, Y0 - 11, 16, 1, '#8a5e36');
    obj({ id: 'cercado', kind: 'text', x: 211, y: 456, r: 14, hit: [X0 + 4, Y0 - 18, 34, 12], label: 'Cercado das galinhas', text: 'Cercado das galinhas. O comedouro e os ninhos ficam dentro do galinheiro: entre pela porta vermelha, à esquerda.' });
  }
  // cerca e porteira da fazenda
  fenceCol(405, 46, 142); fenceCol(405, 190, 502);                              // cerca da fazenda (postes e travessa vertical)
  solid(402, 30, 6, 116); solid(402, 182, 6, 320); keep(396, 30, 18, 470);
  gatePost(397, 152); gatePost(397, 188);                                         // porteira (aberta)
  R(158, 124, 30, 16, OUT); R(159, 125, 28, 14, '#c89a62'); R(159, 125, 28, 2, '#e8c088'); R(162, 129, 22, 1, '#6a4426'); R(162, 132, 18, 1, '#6a4426'); R(162, 135, 20, 1, '#6a4426');
  R(161, 140, 3, 8, '#6a4426'); R(182, 140, 3, 8, '#6a4426'); solid(160, 140, 26, 8);
  obj({ id: 'placa', kind: 'sign', x: 173, y: 154, r: 14, hit: [156, 122, 34, 26], label: 'Placa da fazenda' });
  // ---------- vila ----------
  // Armazém CELESTE: dois andares (comércio embaixo, a casa de Dona Celeste em cima; só o térreo tem porta)
  building('loja', 'Armazém', { x: 456, y: 62, w: 100, h: 86, top: 8, solidY: 70, paint: paintArmazem }, true);
  obj({ id: 'celeste-casa', kind: 'text', x: 506, y: 100, r: 12, hit: [470, 50, 72, 44], label: 'Casa de Dona Celeste (andar de cima)', text: 'O andar de cima é a casa de Dona Celeste. A entrada fica nos fundos, e só ela sobe.' });
  building('honorio', 'Casa de Seu Honório', { x: 720, y: 70, w: 70, h: 78, top: 30, solidY: 100, paint: paintHonorio }, false);
  solid(698, 132, 22, 16); solid(792, 116, 10, 32);                              // bancada e tábuas de Seu Honório
  building('bia', 'Casa de Bia', { x: 480, y: 228, w: 70, h: 72, top: 196, solidY: 254, paint: paintBia }, false);
  solid(560, 288, 8, 12);                                                        // casinha de passarinho
  building('iara', 'Casa de Iara', { x: 690, y: 228, w: 70, h: 72, top: 226, solidY: 268, paint: paintIara }, true);
  solid(662, 290, 24, 12);                                                       // cerquinha colorida
  // escola da vila: no leste da vila, de frente para a rua de baixo, com placa e sino
  {
    const X = 880, Y = 498;
    building('escola', 'Escola da vila', { x: X, y: Y, w: 76, h: 72, top: 464, solidY: 518, paint: paintEscola }, true);
    solid(X - 18, 540, 6, 30);                                                   // mastro
    fence(X - 34, X - 8, Y + 64, '#d8b078'); fence(X + 84, X + 112, Y + 64, '#d8b078'); solid(X - 36, Y + 54, 30, 10); solid(X + 82, Y + 54, 32, 10);   // pátio cercado dos dois lados
  }
  fountain(630, 136); solid(616, 126, 28, 16);
  [[566, 226], [694, 226], [566, 116], [694, 116]].forEach(([x, y]) => addLamp(x, y));
  keep(SPOT.bench[0] - 18, SPOT.bench[1] - 14, 36, 22); solid(SPOT.bench[0] - 13, SPOT.bench[1] - 8, 26, 8);
  obj({ id: 'bench', kind: 'bench', x: SPOT.bench[0], y: SPOT.bench[1] + 6, r: 14, hit: [SPOT.bench[0] - 14, SPOT.bench[1] - 15, 28, 17], label: 'Banco da praça' });
  // ---------- bosque ----------
  building('tome', 'Cabana de Tomé', { x: 980, y: 66, w: 60, h: 76, top: 34, solidY: 92, doorX: 30, paint: paintTome }, false);
  solid(1044, 124, 24, 18); solid(966, 130, 14, 12);                              // lenha, balde e vara de pesca
  water(1104, 258, 62, 36);
  // rio do bosque: sai da lagoa e desce até o fim da mata, com uma ponte de tábuas
  stream([[1110, 280], [1126, 330], [1129, 365], [1114, 392], [1106, 418], [1092, 445], [1086, 475], [1084, 520], [1082, 570], [1080, 620], [1070, 680], [1058, 740], [1050, 812]], 6,
    [[1106, 371, 36, 12], [1062, 588, 38, 18], [1036, 768, 40, 24]]);              // pontes: trilha do bosque, rua de baixo e beira-rio
  // rio do sul: atravessa a vila de oeste a leste, com margens de areia, duas pontes e um píer
  stream([[-20, 836], [200, 842], [420, 826], [620, 812], [800, 816], [1000, 808], [1200, 818], [1400, 806], [1620, 812]], 13,
    [[769, 790, 22, 50], [1299, 786, 22, 54]]);
  pier(566, 784, 18, 26);
  NTREES.forEach(([x, y]) => keep(x - 16, y - 34, 32, 44)); NROCKS.forEach(([x, y]) => keep(x - 12, y - 14, 24, 22)); FORAGE.forEach(([x, y]) => keep(x - 12, y - 14, 24, 24));
  keep(SPOT.hat[0] - 12, SPOT.hat[1] - 14, 24, 24);
  R(846, 150, 14, 10, OUT); R(847, 151, 12, 8, '#f0e6cc'); R(852, 160, 2, 8, '#6a4426'); solid(848, 162, 10, 5);
  obj({ id: 'placa2', kind: 'text', x: 853, y: 176, r: 12, hit: [844, 148, 18, 22], label: 'Placa', text: 'BOSQUE — madeira, pedra e o que a mata oferecer. Corte com juízo: o que se tira hoje volta em alguns dias.' });
  // ---------- trilha da serra: sobe ao norte, entre a vila e o bosque ----------
  road('terra', 812, 18, 18, 136); paveFlush();
  R(836, 34, 22, 12, OUT); R(837, 35, 20, 10, '#c89a62'); R(840, 39, 9, 1, '#6a4426'); R(848, 37, 1, 5, '#6a4426'); R(847, 38, 3, 1, '#6a4426'); R(846, 46, 2, 10, '#6a4426'); solid(844, 48, 8, 8);
  // ---------- vila sul: praça do coreto, horta comunitária e jardins da beira-rio ----------
  coreto(635, 486); solid(608, 464, 56, 34);
  flowerBed(568, 448, 26, 12); flowerBed(676, 448, 26, 12); flowerBed(568, 516, 26, 12); flowerBed(676, 516, 26, 12);
  [[566, 538], [706, 538], [566, 444], [706, 444]].forEach(([x, y]) => addLamp(x, y));
  benchDeco(588, 532); benchDeco(662, 532);
  obj({ id: 'coreto', kind: 'text', x: 635, y: 504, r: 16, hit: [608, 448, 56, 52], label: 'Coreto', text: 'O coreto da praça sul. Em dia de festa tem música aqui; nos outros, é sombra e conversa.' });
  {                                                                             // horta comunitária: canteiros cercados ao sul da rua de baixo
    const X0 = 482, X1 = 590, Y0 = 628, Y1 = 708;
    R(X0, Y0, X1 - X0, Y1 - Y0, '#9a7a4a');
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const bx = X0 + 8 + c * 25, by = Y0 + 8 + r * 18; R(bx - 1, by - 1, 19, 12, '#6a4426'); R(bx, by, 17, 10, '#7a5230');
      for (let k = 2; k < 16; k += 4) { if (paintSeason === 3) { R(bx + k, by + 3, 2, 1, '#eef3f8'); continue; } R(bx + k, by + 2, 1, 6, '#3f9648'); R(bx + k - 1, by + 3, 3, 1, (r + c) % 3 ? '#58b858' : '#e04a3a'); } }
    fence(X0, X1, Y0, '#d8b078'); fence(X0, 526, Y1, '#d8b078'); fence(548, X1, Y1, '#d8b078');
    fenceCol(X0, Y0, Y1, '#d8b078', false); fenceCol(X1, Y0, Y1, '#d8b078', false);
    solid(X0 - 2, Y0 - 8, X1 - X0 + 6, 8); solid(X0 - 2, Y1 - 6, 532 - X0, 8); solid(546, Y1 - 6, X1 - 542, 8); solid(X0 - 2, Y0, 6, Y1 - Y0); solid(X1 - 2, Y0, 6, Y1 - Y0);
    keep(X0 - 6, Y0 - 12, X1 - X0 + 12, Y1 - Y0 + 24);
    obj({ id: 'horta', kind: 'text', x: 537, y: 716, r: 14, hit: [X0, Y0 - 10, X1 - X0, Y1 - Y0 + 10], label: 'Horta comunitária', text: 'Canteiros cuidados pelos moradores da vila. Cada um planta um pouco e todo mundo colhe.' });
  }
  flowerBed(810, 640, 30, 12); flowerBed(860, 640, 30, 12); flowerBed(810, 690, 30, 12); flowerBed(860, 690, 30, 12);
  benchDeco(830, 730); picnic(940, 660); keep(800, 630, 180, 120);
  [[800, 760], [1000, 760], [600, 760], [1200, 760]].forEach(([x, y]) => addLamp(x, y));
  obj({ id: 'piquenique', kind: 'text', x: 953, y: 684, r: 14, hit: [936, 652, 34, 24], label: 'Mesa de piquenique', text: 'Uma mesa de piquenique de frente para o rio. Alguém esqueceu uma casca de laranja aqui.' });
  // ---------- bairro leste: avenida, terrenos reservados (ferraria e museu) e pomar ----------
  lot(1350, 206, 120, 84, 248);
  sign(1326, 230, '#8a8478'); solid(1328, 232, 8, 8);
  obj({ id: 'lote-ferraria', kind: 'text', x: 1332, y: 250, r: 14, hit: [1322, 218, 20, 26], label: 'Terreno reservado', text: 'Terreno reservado. Dizem que um ferreiro vai se instalar aqui. Por enquanto, só estacas e capim.' });
  lot(1350, 336, 150, 124, 398);
  sign(1326, 380, '#c8a050'); solid(1328, 382, 8, 8);
  obj({ id: 'lote-museu', kind: 'text', x: 1332, y: 400, r: 14, hit: [1322, 368, 20, 26], label: 'Terreno do futuro museu', text: 'Terreno reservado para o museu da vila. A obra ainda não começou.' });
  keep(1340, 196, 170, 276);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const x = 1206 + c * 22 + (r % 2) * 10, y = 470 + r * 34; addTree(x, y, 9); keep(x - 14, y - 30, 28, 40); }   // pomarzinho
  flowerBed(1352, 640, 30, 12); flowerBed(1402, 640, 30, 12); benchDeco(1380, 700); picnic(1440, 640);
  water(1246, 380, 26, 15);                                                      // laguinho do bairro leste (dá para pescar)
  well(1192, 664); solid(1190, 650, 22, 28); keep(1180, 640, 44, 44);
  obj({ id: 'poco', kind: 'text', x: 1201, y: 688, r: 14, hit: [1188, 644, 26, 34], label: 'Poço antigo', text: 'Um poço antigo, de pedra. A água lá embaixo é fria e reflete o céu.' });
  benchDeco(1226, 404); benchDeco(1252, 356);
  // ---------- floresta fechada ao sul da fazenda ----------
  solid(0, 500, 404, FORA.h - 500);
  // trajetos dos moradores na vila: a vegetação sorteada nunca cai neles
  (typeof VILLAGERS !== 'undefined' ? VILLAGERS : []).filter(v => !v.map).forEach(v => v.sched.forEach(([, path]) => {
    if (!Array.isArray(path)) return;
    path.forEach((q, i) => { const a = path[i - 1] || q, n = Math.max(1, Math.ceil(Math.hypot(q[0] - a[0], q[1] - a[1]) / 6)); for (let k = 0; k <= n; k++) keep(a[0] + (q[0] - a[0]) * k / n - 10, a[1] + (q[1] - a[1]) * k / n - 12, 20, 16); });
  }));
  // ---------- vegetação: bordas fechadas e enfeites ----------
  solid(0, 0, W, 26); solid(0, H - 10, W, 10); solid(0, 0, 8, H); solid(W - 8, 0, 8, H);
  open(810, 0, 22, 26);
  m.doors.montanha = { x: 821, y: 44 };
  obj({ id: 'door:montanha', kind: 'door', to: 'montanha', x: 821, y: 40, r: 14, hit: [806, 0, 30, 40], label: 'Subir a trilha da serra' });
  for (let x = 14; x < W; x += 26) { if (Math.abs(x - 821) > 22) (x % 3 ? addTree : addPine)(x, 30 + (x % 4) * 3, 10); (x % 2 ? addTree : addPine)(x + 8, H - 4 - (x % 3) * 2, 10); }
  for (let y = 60; y < H - 30; y += 34) { addPine(10, y); addTree(W - 10, y, 9); }
  const riverY = x => (x < 420 ? 836 + (x / 420) * -10 : 826);
  for (let y = 512; y < H - 20; y += 24) for (let x = 22; x < 400; x += 26) {        // mata fechada ao sul da fazenda (o rio passa por baixo dela)
    const xx = x + ((y / 24) % 2) * 12, yy = y + ((x * 7) % 9);
    if (Math.abs(yy - riverY(xx)) < 26 || xx > 396) continue;
    ((xx + yy) % 3 ? addTree : addPine)(xx, yy, 10);
  }
  let placed = 0;
  const villageArea = (x, y) => x > 410 && y < 770 && !(x > 850 && x < 1200 && y < 500) && (y > 40 || x > 1200);   // fora da fazenda, do bosque e da beira-rio
  for (let i = 0; i < 4000 && placed < 96; i++) {
    const x = 30 + Math.floor(rand() * (W - 60)), y = 60 + Math.floor(rand() * (H - 90));
    if (!villageArea(x, y) || !isFree(x - 16, y - 30, 32, 40)) continue;                 // só na vila: o bosque e a fazenda têm as próprias árvores
    (rand() < 0.35 ? addPine : addTree)(x, y, 9 + Math.floor(rand() * 3)); keep(x - 16, y - 30, 32, 40); placed++;
  }
  for (let i = 0; i < 150; i++) { const x = 30 + rand() * (W - 60), y = 50 + rand() * (H - 80); if (x > 404 && isFree(x - 8, y - 10, 16, 14)) { bush(Math.round(x), Math.round(y), 4 + Math.floor(rand() * 2)); solid(x - 4, y - 4, 8, 5); } }
  flowers(1200, (x, y) => !isFree(x - 2, y - 2, 6, 8), (x, y) => x < 404 && y < 512 && hash(x, y, 230) > 0.12);   // fazenda: poucas flores, chão tranquilo
  // mato alto: rente a caminhos, construções e cercas (vizinhança de célula ocupada), fora da área da fazenda
  const busyCell = (c, r) => c >= 0 && r >= 0 && c < m.cols && r < m.rows && (m.path[r * m.cols + c] || m.solid[r * m.cols + c]);
  const nearBusy = (x, y) => { const c = Math.floor(x / CELL), r = Math.floor(y / CELL); for (let dr = -2; dr <= 1; dr++) for (let dc = -2; dc <= 2; dc++) if ((dr || dc) && busyCell(c + dc, r + dr)) return true; return false; };
  m.tallGrass = tallGrass(nearBusy, (x, y) => (x < 412 && y < 516) || y > H - 30);
  m.spawn = { x: m.doors.casa.x, y: m.doors.casa.y };
  m.places = PLACES;
  m.spawns = villageSpawns(m);
  return m;
}
/* Pontos onde coletáveis sazonais podem surgir na Vila Acapulco: grama, beira de
   caminhos, perto de árvores e entre as casas. Ficam de fora paredes, água,
   obstáculos, portas e passagens, e o que estiver escondido sob copas e telhados. */
function villageSpawns(m) {
  const pts = [], blocked = (x0, y0, w, h) => {
    for (let cy = Math.floor(y0 / CELL); cy <= Math.floor((y0 + h - 1) / CELL); cy++) for (let cx = Math.floor(x0 / CELL); cx <= Math.floor((x0 + w - 1) / CELL); cx++)
      if (cx < 0 || cy < 0 || cx >= m.cols || cy >= m.rows || m.solid[cy * m.cols + cx]) return true;
    return false;
  };
  const covered = (x, y) => m.sprites.some(sp => !sp.fence && x > sp.x - 4 && x < sp.x + sp.img.width + 4 && y > sp.y - 4 && y < sp.base + 8)
    || m.objs.some(o => { const r = o.hit || [o.x - 10, o.y - 20, 20, 22]; return x > r[0] - 10 && x < r[0] + r[2] + 10 && y > r[1] - 6 && y < r[1] + r[3] + 16; })
    || m.waters.some(w => ((x - w.cx) / (w.rx + 12)) ** 2 + ((y - w.cy) / (w.ry + 12)) ** 2 < 1)
    || (m.streams || []).some(st => st.pts.some(([px, py], i) => i % 4 === 0 && (x - px) ** 2 + (y - py) ** 2 < (st.hw + 10) ** 2));
  for (let y = 70; y <= 860; y += 10) for (let x = 424; x <= 1580; x += 10) {
    if (x > 848 && x < 1200 && y < 500) continue;                            // o bosque tem coletas próprias
    if (blocked(x - 9, y - 20, 18, 26) || covered(x, y)) continue;           // folga em volta de paredes e telhados
    if (pts.some(([px, py]) => Math.abs(px - x) < 22 && Math.abs(py - y) < 18)) continue;
    pts.push([x, y]);
  }
  return pts;
}

/* Lugares mostrados na tela do mapa (coordenadas do mapa externo). */
const PLACES = [
  { id: 'casa', label: 'Sua casa', x: 100, y: 120, icon: 'casa' },
  { id: 'galinheiro', label: 'Galinheiro', x: 94, y: 420, icon: 'galinha' },
  { id: 'cercado', label: 'Cercado', x: 222, y: 420, icon: 'cerca' },
  { id: 'roca', label: 'Roça', x: 200, y: 276, icon: 'roca' },
  { id: 'lago', label: 'Lago', x: 336, y: 100, icon: 'agua' },
  { id: 'loja', label: 'Armazém', x: 510, y: 110, icon: 'loja' },
  { id: 'praca', label: 'Praça', x: 630, y: 170, icon: 'praca' },
  { id: 'honorio', label: 'Seu Honório', x: 755, y: 112, icon: 'morador' },
  { id: 'bia', label: 'Bia', x: 515, y: 266, icon: 'morador' },
  { id: 'iara', label: 'Casa de Iara', x: 725, y: 266, icon: 'morador' },
  { id: 'escola', label: 'Escola', x: 918, y: 540, icon: 'casa' },
  { id: 'coreto', label: 'Praça do coreto', x: 635, y: 488, icon: 'praca' },
  { id: 'horta', label: 'Horta comunitária', x: 536, y: 668, icon: 'roca' },
  { id: 'beirario', label: 'Beira-rio', x: 700, y: 800, icon: 'agua' },
  { id: 'lote-ferraria', label: 'Terreno reservado', x: 1410, y: 248, icon: 'obra' },
  { id: 'lote-museu', label: 'Terreno do museu (reservado)', x: 1425, y: 398, icon: 'obra' },
  { id: 'tome', label: 'Tomé', x: 1010, y: 106, icon: 'morador' },
  { id: 'bosque', label: 'Bosque', x: 950, y: 330, icon: 'bosque' },
  { id: 'rio', label: 'Lagoa do bosque', x: 1104, y: 258, icon: 'agua' },
  { id: 'riacho', label: 'Rio do bosque', x: 1100, y: 440, icon: 'agua' },
  { id: 'trilha', label: 'Trilha da serra', x: 821, y: 70, icon: 'trilha' },
];
