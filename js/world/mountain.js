/* Mundo — serra: montanhas ao norte da vila, tenda e fogueira de Lúcio, apito de madeira.
   Parte de js/world/ (antes era js/world.js). São scripts comuns, carregados em ordem pelo index.html:
   as declarações de nível superior valem para todos os arquivos (não são módulos). O objeto World,
   com as funções públicas, é montado no fim, em js/world/index.js. */

/* ================= serra (montanhas ao norte da vila) ================= */
const SERRA = {
  w: 640, h: 400,
  tent: { x: 228, base: 176 },                    // tenda de Lúcio (centro, base)
  fire: [262, 216],
  keepsake: [588, 150],                           // apito perdido (missão)
  forage: [[92, 232], [62, 282], [152, 336], [404, 336], [606, 230], [560, 360]],
};
/* Lugares da serra mostrados no mapa (coordenadas da serra). */
const MPLACES = [
  { id: 'tenda', label: 'Tenda', x: 228, y: 146, icon: 'tenda' },
  { id: 'nascente', label: 'Nascente', x: 500, y: 300, icon: 'agua' },
  { id: 'mata', label: 'Mata da serra', x: 96, y: 300, icon: 'bosque' },
  { id: 'rochedo', label: 'Rochedo do leste', x: 590, y: 170, icon: 'rocha' },
  { id: 'fenda', label: 'Fenda fechada', x: 496, y: 52, icon: 'rocha' },
];
function buildMontanha() {
  const m = newMap('montanha', SERRA.w, SERRA.h, 23); m.waters = [];
  grass();
  g.fillStyle = 'rgba(70,80,40,.16)'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 60; i++) { const x = rand() * W, y = 70 + rand() * (H - 80); R(x, y, 2 + rand() * 3, 2, '#9a9488'); R(x, y, 2, 1, '#c8c2b4'); }   // pedrinhas
  // paredão de rocha ao norte
  for (let y = 0; y < 70; y++) {
    const edge = 62 + Math.round(Math.sin(y) * 0);
    for (let x = 0; x < W; x++) {
      const bot = 60 + Math.round(Math.sin(x / 13) * 3 + Math.sin(x / 5) * 2);
      if (y > bot) continue;
      const band = Math.floor((y + Math.sin(x / 9) * 3) / 8);
      g.fillStyle = y === bot ? OUT : y > bot - 3 ? '#6a6458' : band % 2 ? '#8a8478' : '#9a9486';
      g.fillRect(x, y, 1, 1);
    }
    if (edge && y % 8 === 3) for (let x = (y * 7) % 23; x < W; x += 23) R(x, y, 6, 1, '#b4ae9e');
  }
  solid(0, 0, W, 66);
  if (paintSeason === 3) for (let x = 0; x < W; x++) { const top = 6 + ((x * 7) % 9 === 0 ? 1 : 0); for (let y = 0; y < 60 + Math.round(Math.sin(x / 13) * 3 + Math.sin(x / 5) * 2); y += 8) R(x, y, 1, 2 + ((x * 3) % 2), '#f2f6fb'); R(x, 0, 1, top, '#f6f9fd'); }
  // fenda fechada no paredão (lugar reservado; ninguém entra)
  R(476, 24, 40, 40, OUT); R(478, 26, 36, 38, '#1c1612'); for (let i = 0; i < 4; i++) { R(474, 30 + i * 8, 44, 4, OUT); R(475, 31 + i * 8, 42, 2, '#a07848'); }
  R(472, 22, 3, 44, '#6a4426'); R(517, 22, 3, 44, '#6a4426'); R(470, 20, 52, 4, '#7a5230');
  obj({ id: 'fenda', kind: 'text', x: 496, y: 78, r: 16, hit: [468, 18, 56, 50], label: 'Fenda fechada', text: 'Uma fenda no paredão, escorada e fechada com tábuas velhas. Ninguém passa por ali há muitos anos.' });
  // caminhos de terra batida
  road('terra', 312, 196, 20, 204);                 // trilha que desce para a vila
  road('terra', 140, 250, 192, 16);                 // ramal oeste, até a mata
  road('terra', 332, 252, 140, 16);                 // ramal leste, até a nascente
  road('terra', 472, 252, 124, 14); road('terra', 580, 140, 16, 126);   // trilha do rochedo
  road('terra', 168, 182, 160, 30);                 // terreiro da tenda
  paveFlush();
  // nascente
  water(500, 300, 44, 22, 'rio');
  obj({ id: 'water', kind: 'water', x: 500, y: 276, r: 22, hit: [458, 280, 86, 40], label: 'Nascente' });
  // fogueira com troncos para sentar
  const [fx, fy] = SERRA.fire;
  for (let a = 0; a < 8; a++) { const ang = a / 8 * Math.PI * 2; box(Math.round(fx + Math.cos(ang) * 8) - 2, Math.round(fy - 2 + Math.sin(ang) * 4) - 1, 4, 3, '#8a8478'); }
  R(fx - 5, fy - 3, 10, 3, '#3a2a1a');
  solid(fx - 8, fy - 8, 16, 8); keep(fx - 30, fy - 20, 60, 34);
  const log = (x, y, w) => { R(x - 1, y - 1, w + 2, 7, OUT); R(x, y, w, 5, '#7a5230'); R(x, y, w, 1, '#a07448'); R(x + 1, y + 2, w - 2, 1, '#5a3a22'); R(x, y, 3, 5, '#c8a070'); R(x + 1, y + 1, 1, 3, '#a07448'); };
  log(228, 222, 20); solid(228, 222, 20, 5);
  log(276, 210, 18); solid(276, 210, 18, 5);
  cur.lights.push({ kind: 'fire', x: fx, y: fy - 8, r: 56 });
  obj({ id: 'fogueira', kind: 'fire', x: fx, y: fy + 12, r: 18, hit: [fx - 12, fy - 18, 24, 22], label: 'Fogueira' });
  // pertences organizados: varal de ervas, caixotes, panela sobre pedras
  R(140, 150, 2, 26, '#6a4426'); R(178, 150, 2, 26, '#6a4426'); R(140, 150, 40, 2, '#8a5e36');
  for (let i = 0; i < 6; i++) { const hx = 144 + i * 6; R(hx, 152, 1, 3, '#6a4426'); R(hx - 1, 155, 3, 6, ['#58b858', '#c8a040', '#8ac060', '#3f9648', '#b06a3a', '#6aa050'][i]); }
  box(142, 168, 12, 10, '#a07848'); R(142, 171, 12, 1, '#6a4426'); box(156, 170, 10, 8, '#b88448'); R(158, 168, 6, 2, '#58b858');
  box(170, 168, 10, 7, '#3a3a44'); R(171, 167, 8, 1, '#5a5a66'); box(168, 175, 3, 3, '#8a8478'); box(178, 175, 3, 3, '#8a8478');
  for (let x = 136; x < 186; x += 5) box(x, 182, 3, 2, '#9a9486');                          // borda de pedrinhas arrumadas
  solid(138, 150, 46, 32);
  obj({ id: 'pertences', kind: 'text', x: 160, y: 192, r: 16, hit: [136, 146, 50, 40], label: 'Pertences de Lúcio', text: 'Ervas secando no varal, caixotes empilhados e uma panela sobre as pedras. Tudo no lugar, arrumado com cuidado. Melhor não mexer.' });
  // tenda (desenhada a cada quadro; a melhoria muda o visual)
  const T = SERRA.tent; solid(T.x - 32, T.base - 54, 64, 50); solid(T.x - 32, T.base - 8, 22, 8); solid(T.x + 10, T.base - 8, 22, 8);
  keep(T.x - 40, T.base - 64, 80, 70);
  m.doors.tenda = { x: T.x, y: T.base + 13 };
  obj({ id: 'door:tenda', kind: 'door', to: 'tenda', x: T.x, y: T.base + 10, r: 14, hit: [T.x - 10, T.base - 28, 20, 30], label: 'Entrar na tenda' });
  obj({ id: 'lona', kind: 'lona', x: T.x + 22, y: T.base + 10, r: 16, hit: [T.x + 12, T.base - 52, 22, 42], label: 'Lona da tenda' });
  // árvores e arbustos da mata (fora dos caminhos)
  [[40, 236], [70, 258], [30, 300], [110, 296], [64, 340], [118, 372], [200, 372], [250, 340], [392, 380], [610, 300], [624, 380], [440, 220], [380, 120], [110, 120], [60, 150]].forEach(([x, y], i) => { if (isFree(x - 16, y - 30, 32, 40)) { (i % 3 ? addTree : addPine)(x, y, 10); keep(x - 16, y - 30, 32, 40); } });
  SERRA.forage.forEach(([x, y]) => keep(x - 12, y - 14, 24, 24)); keep(SERRA.keepsake[0] - 12, SERRA.keepsake[1] - 14, 24, 24);
  for (let i = 0; i < 30; i++) { const x = 20 + rand() * (W - 40), y = 80 + rand() * (H - 100); if (isFree(x - 8, y - 10, 16, 14)) { bush(Math.round(x), Math.round(y), 4, i % 2 ? '#3f8a48' : '#5a8a3a'); solid(x - 4, y - 4, 8, 5); } }
  // bordas: paredão ao norte, mata nas laterais e embaixo (com a saída da trilha)
  solid(0, 0, 8, H); solid(W - 8, 0, 8, H); solid(0, H - 6, 300, 6); solid(344, H - 6, W - 344, 6);
  for (let y = 90; y < H; y += 32) { addPine(8, y); addPine(W - 8, y); }
  for (let x = 22; x < W; x += 26) if (x < 290 || x > 356) (x % 3 ? addTree : addPine)(x, H + 2, 10);
  flowers(160, (x, y) => !isFree(x - 2, y - 2, 6, 8) || y < 70);
  obj({ id: 'exit', kind: 'exit', x: 322, y: H - 6, r: 14, hit: [302, H - 18, 40, 18], label: 'Descer para a vila' });
  m.spawn = { x: 322, y: H - 14 };
  m.places = MPLACES;
  return m;
}
/* Tenda de Lúcio vista de frente. up = coberta reforçada (missão "Antes da próxima chuva"). */
function tent(ctx, up, t, prog) {
  const { x, base } = SERRA.tent, P = (a, b, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x + a, base + b, w, h); };
  ctx.fillStyle = 'rgba(20,30,20,.28)'; ctx.fillRect(x - 34, base - 2, 70, 4);
  // estacas e cordas
  P(-38, -4, 2, 6, '#6a4426'); P(36, -4, 2, 6, '#6a4426'); for (let i = 0; i < 12; i++) { P(-37 + i * 0.5 | 0, -6 - i * 3, 1, 1, '#d8c8a0'); P(36 - (i * 0.5 | 0), -6 - i * 3, 1, 1, '#d8c8a0'); }
  // lona em "A"
  for (let r = 0; r < 54; r++) {
    const half = Math.round(4 + r * 0.53), y = base - 54 + r;
    ctx.fillStyle = OUT; ctx.fillRect(x - half - 1, y, half * 2 + 2, 1);
    for (let c = -half; c < half; c++) {
      const left = c < 0, seam = (c + 64) % 9 === 0;
      ctx.fillStyle = up ? (left ? '#5e7a4c' : '#4a6440') : left ? '#c8b48a' : '#a8946c';
      if (seam) ctx.fillStyle = up ? '#3e5636' : '#8a7652';
      ctx.fillRect(x + c, y, 1, 1);
    }
  }
  if (!up) {                                          // remendos e um rasgo na lona velha
    P(-18, -36, 8, 7, '#8a6a48'); P(-17, -35, 6, 1, '#c8a878'); P(-17, -33, 1, 3, '#5a3a22');
    P(10, -26, 9, 6, '#b89868'); P(11, -25, 7, 1, '#d8c8a0');
    P(16, -44, 2, 7, '#3a2a1a'); P(17, -41, 3, 1, '#3a2a1a'); P(14, -38, 2, 1, '#3a2a1a');
  } else {                                            // reforço: cumeeira de madeira, cordas novas e saia de proteção
    P(-2, -58, 4, 6, '#7a5230'); P(-1, -60, 2, 3, '#a07448');
    P(-6, -55, 12, 2, '#8a5e36');
    for (let i = 0; i < 4; i++) { P(-28 + i * 16, -14 - (i % 2) * 3, 10, 1, '#e8d8a8'); }
    P(-31, -6, 62, 4, '#7a5230'); P(-31, -6, 62, 1, '#a07448');
  }
  // entrada escura com aba presa
  for (let r = 0; r < 26; r++) { const hw = Math.round(r * 0.36); ctx.fillStyle = '#2a1e16'; ctx.fillRect(x - hw, base - 26 + r, hw * 2, 1); }
  P(-10, -24, 4, 18, up ? '#6e8a5c' : '#d8c8a0'); P(-10, -24, 1, 18, OUT);
  if (prog > 0 && prog < 1) {                         // barra de progresso do reparo
    P(-9, -66, 18, 4, OUT); P(-8, -65, 16, 2, '#5a1a1a'); P(-8, -65, Math.max(1, Math.round(16 * prog)), 2, '#8fe88f');
  }
}
function fireFx(ctx, t, lit) {
  const [fx, fy] = SERRA.fire, P = (a, b, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(fx + a, fy + b, w, h); };
  P(-6, -4, 12, 3, '#5a3a22'); P(-4, -5, 8, 2, '#7a5230');
  if (!lit) { P(-2, -6, 4, 1, '#9a9488'); return; }
  const f = Math.floor(t / 120) % 3;
  P(-4, -9 - f, 8, 5 + f, '#e04a1a'); P(-3, -12 + (f === 1 ? 1 : 0), 6, 7, '#f08a20'); P(-1, -15 + f, 3, 8, '#ffd75e'); P(0, -12, 1, 4, '#fff6c0');
  for (let i = 0; i < 3; i++) { const k = ((t / 900) + i / 3) % 1; ctx.fillStyle = `rgba(255,190,90,${1 - k})`; ctx.fillRect(Math.round(fx - 3 + i * 3 + Math.sin(k * 7 + i) * 2), Math.round(fy - 16 - k * 18), 1, 1); }
}
function whistle(ctx, x, y) { ctx.fillStyle = OUT; ctx.fillRect(x - 5, y - 4, 11, 5); ctx.fillStyle = '#c89858'; ctx.fillRect(x - 4, y - 3, 9, 3); ctx.fillStyle = '#7a5230'; ctx.fillRect(x - 2, y - 3, 2, 1); ctx.fillRect(x + 3, y - 2, 1, 1); ctx.fillStyle = '#e8c888'; ctx.fillRect(x - 4, y - 3, 9, 1); }
