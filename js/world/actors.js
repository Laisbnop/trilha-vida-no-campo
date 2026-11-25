/* Mundo — o que acompanha os personagens: golpe da ferramenta, vara e linha de pesca, comer, fones, atividades
   dos moradores, pinturas da Iara, peixe erguido, impactos e o bicho de estimação.
   Parte de js/world/ (antes era js/world.js). São scripts comuns, carregados em ordem pelo index.html:
   as declarações de nível superior valem para todos os arquivos (não são módulos). O objeto World,
   com as funções públicas, é montado no fim, em js/world/index.js. */

/* A ferramenta descreve um arco à frente do personagem. */
function toolSwing(ctx, a, x, y, k) {
  const d = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[a.dir] || [0, 1];
  const lift = Math.sin(k * Math.PI) * 9, reach = 4 + k * 9;
  const tx = x + d[0] * reach - 8 + (d[1] ? (k - 0.5) * 8 : 0), ty = y + OY(-20) - lift + (d[1] > 0 ? 6 + k * 6 : d[1] < 0 ? -6 - k * 4 : k * 8);
  ctx.save();
  if (a.dir === 'left') { ctx.translate(Math.round(tx) + 16, Math.round(ty)); ctx.scale(-1, 1); ctx.drawImage(icon(a.tool.id), 0, 0); }
  else ctx.drawImage(icon(a.tool.id), Math.round(tx), Math.round(ty));
  ctx.restore();
  if (a.tool.id === 'regador' && k > 0.3) { ctx.fillStyle = '#8fd0f0'; for (let i = 0; i < 4; i++) ctx.fillRect(Math.round(x + d[0] * 14 - 4 + i * 3), Math.round(y + OY(-8) + d[1] * 10 + ((k * 20 + i * 5) % 8)), 1, 2); }
  if (a.tool.id === 'espada' && k > 0.2 && k < 0.8) { ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillRect(Math.round(x + d[0] * 14 - 6), Math.round(y - 12 + d[1] * 12), 12, 1); ctx.fillRect(Math.round(x + d[0] * 16 - 3), Math.round(y - 15 + d[1] * 12), 6, 1); }
}
/* ---------- pesca ----------
   f (montado pelo jogo): grip/tip = mão e ponta da vara; bob = boia [x, y] ou null;
   bobMode: 'fly' | 'float' | 'nibble' | 'sink' | 'reel'; slack (0..1) = quanto a linha cai;
   rings = respingos [{ x, y, t0 }]; charge = força (0..1) ou null; alert = fisgada (0..1 do tempo que resta);
   hold = peixe erguido; jump = peixe pulando { x, y, id }. */
const skinOf = look => { const s = Sprites.SKINS.find(k => k.id === look.skin) || Sprites.SKINS[0]; return s.c; };
const ROD_COL = { vara: ['#5a3a1e', '#c8902a', '#e8c060', '#8a5a1e'], vara_fibra: ['#c89a62', '#8a2a3a', '#b8b8c8', '#5a1a26'] };
function fishRod(ctx, a) {                        // a vara verga (curva) conforme a força na linha
  const f = a.fish; if (!f.tip || f.hold) return;
  const [gx, gy] = f.grip, [tx, ty] = f.tip, len = Math.hypot(tx - gx, ty - gy) || 1, n = Math.max(2, Math.ceil(len * 1.2));
  let px = -(ty - gy) / len, py = (tx - gx) / len; if (py < 0) { px = -px; py = -py; }          // vergar para baixo
  const b = (f.bend || 0) * len * 0.35, cx = (gx + tx) / 2 + px * b, cy = (gy + ty) / 2 + py * b;
  const at = k => [(1 - k) * (1 - k) * gx + 2 * (1 - k) * k * cx + k * k * tx, (1 - k) * (1 - k) * gy + 2 * (1 - k) * k * cy + k * k * ty];
  const C = ROD_COL[f.rod] || ROD_COL.vara;
  for (let i = 0; i <= n; i++) { const k = i / n, [x, y] = at(k); ctx.fillStyle = OUT; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, k < 0.45 ? 3 : 2, k < 0.45 ? 3 : 2); }
  for (let i = 0; i <= n; i++) { const k = i / n, [x, y] = at(k); ctx.fillStyle = k < 0.25 ? C[0] : f.rod === 'vara' && i % 5 === 4 ? C[3] : k < 0.65 ? C[1] : C[2]; ctx.fillRect(Math.round(x), Math.round(y), k < 0.45 ? 2 : 1, 1); }
  const [rx, ry] = at(0.18);                       // molinete
  ctx.fillStyle = OUT; ctx.fillRect(Math.round(rx) - 2, Math.round(ry), 4, 4); ctx.fillStyle = f.rod === 'vara_fibra' ? '#d8d8e8' : '#9a9aa8'; ctx.fillRect(Math.round(rx) - 1, Math.round(ry) + 1, 2, 2);
  f.tipBent = at(1);
  if (a.dir === 'up') return;                     // de costas, a mão fica escondida pelo corpo
  const [sk, sd] = skinOf(a.look); ctx.fillStyle = OUT; ctx.fillRect(Math.round(gx) - 2, Math.round(gy) - 1, 4, 4); ctx.fillStyle = sk; ctx.fillRect(Math.round(gx) - 1, Math.round(gy), 2, 2); ctx.fillStyle = sd; ctx.fillRect(Math.round(gx) - 1, Math.round(gy) + 1, 2, 1);
}
/* Comendo: o alimento perto da boca, seguro com as duas mãos, encolhe a cada mordida; migalhas caem. */
function eating(ctx, a, t) {
  const x = Math.round(a.x), y = Math.round(a.y), k = a.eat.k, bites = Math.min(3, Math.floor(k * 4)), [sk, sd] = skinOf(a.look);
  const w = 8 - bites * 2, ix = x - 4, iy = y + OY(-22) + (Math.floor(k * 8) % 2);
  if (w > 0) { ctx.drawImage(icon(a.eat.id), 0, 0, w * 2, 16, ix, iy, w, 8); for (let i = 0; i < bites; i++) { ctx.fillStyle = OUT; ctx.fillRect(ix + w - 1, iy + 2 + i * 2, 1, 1); } }
  [[OX(-7), OY(-19)], [OX(5), OY(-19)]].forEach(([dx, dy]) => { ctx.fillStyle = OUT; ctx.fillRect(x + dx - 1, y + dy - 1, 4, 4); ctx.fillStyle = sk; ctx.fillRect(x + dx, y + dy, 2, 2); ctx.fillStyle = sd; ctx.fillRect(x + dx, y + dy + 1, 2, 1); });
  for (let i = 0; i < bites * 2; i++) { const s2 = (i * 37) % 7, fy = y + OY(-14) + ((k * 900 + i * 53) % 12); ctx.fillStyle = i % 2 ? '#f4e8c8' : '#d8b878'; ctx.fillRect(x - 4 + s2 + (i % 3), Math.round(fy), 1, 1); }
  if (k > 0.85) { ctx.fillStyle = '#8fe88f'; ctx.fillRect(x + 8, y + OY(-34), 1, 3); ctx.fillRect(x + 7, y + OY(-33), 3, 1); }
}
/* O que um morador está fazendo: cavalete pintando (mão mexe o pincel devagar), caderno de
   desenho, xícara de chá com vapor ou livro. Discreto: não muda a câmera nem abre nada. */
/* Fones de ouvido (objeto da ação do Caleb, no desenho dele de js/hand-art.js, com 30 pontos de altura): arco por cima
   do cabelo e conchas nas orelhas, em grafite com brilho discreto, para aparecer sobre o cabelo escuro. De perfil, só a
   concha do lado de quem olha. */
function phones(P, x, yy, dir) {
  const B = '#5a5664', D = '#2a2730', L = '#8a8698';
  if (dir === 'left' || dir === 'right') {
    const cx = dir === 'left' ? x + 1 : x - 2;
    P(cx - 1, yy - 30, 4, 1, B); P(cx, yy - 29, 2, 5, B); P(cx - 1, yy - 24, 4, 4, D); P(cx - 1, yy - 24, 1, 3, L); return;
  }
  P(x - 4, yy - 30, 8, 1, B); P(x - 5, yy - 29, 1, 2, B); P(x + 4, yy - 29, 1, 2, B);           // arco
  P(x - 6, yy - 27, 1, 3, B); P(x + 5, yy - 27, 1, 3, B);
  P(x - 7, yy - 24, 2, 4, D); P(x + 5, yy - 24, 2, 4, D); P(x - 7, yy - 24, 1, 3, L); P(x + 6, yy - 24, 1, 3, L);   // conchas
}
function actFx(ctx, a, t) {
  // objetos na mão acompanham o tamanho do personagem do mundo (as mãos ficam um pouco mais baixas; na Iara, desenhada como
  // criança, as mãos ficam na altura da cintura e os objetos descem 6 pontos para não cobrir o rosto)
  const kidArt = a.look && a.look.sprite === 'iara', x = Math.round(a.x), y = Math.round(a.y) + OY(-15) + 15 + (kidArt ? 6 : 0), P = (px, py, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(px, py, w, h); }, slow = Math.floor(t / 450) % 2;
  if (a.act === 'paint') {
    const s = a.dir === 'right' ? 1 : -1, ex = x + s * 13, yd = y; { const y = Math.round(a.y);    // o cavalete fica no chão; só a mão segue o personagem
    P(ex - 5, y - 6, 1, 7, '#5a3a22'); P(ex + 4, y - 6, 1, 7, '#5a3a22'); P(ex, y - 20, 1, 21, '#6a4426');
    P(ex - 7, y - 23, 15, 13, OUT); P(ex - 6, y - 22, 13, 11, '#f8f4ea'); P(ex - 5, y - 21, 6, 4, '#9ac8e8'); P(ex - 1, y - 18, 7, 4, '#78b04c'); P(ex - 4, y - 16, 4, 3, '#a8a8b8'); P(ex + 2, y - 21, 3, 2, '#f2d24a');
    }
    const hx = x + s * (OX(5) + slow), hy = yd - 15 + slow;            // mão com o pincel, indo e voltando
    P(hx, hy, 1, 1, '#8a5a2a'); P(hx + s, hy - 1, 1, 1, '#8a5a2a'); P(hx + s * 2, hy - 2, 1, 1, ['#e04a5a', '#3f86d0'][Math.floor(t / 2400) % 2]);
  } else if (a.act === 'brush') {                                   // em casa, pintando pelos esboços: só o pincel na mão
    const s = a.dir === 'right' ? 1 : -1, hx = x + s * (5 + slow), hy = y - 15 + slow;
    P(hx, hy, 1, 1, '#8a5a2a'); P(hx + s, hy - 1, 1, 1, '#8a5a2a'); P(hx + s * 2, hy - 2, 1, 1, '#3f86d0');
  } else if (a.act === 'draw') {
    P(x - 4, y - 16, 8, 6, OUT); P(x - 3, y - 15, 6, 4, '#f8f4ea'); P(x - 2, y - 14, 3, 1, '#a8a8b8'); P(x + (slow ? 1 : -1), y - 13, 1, 1, '#5a5a6a'); P(x + 3, y - 15 + slow, 1, 3, '#e0a23a');
  } else if (a.act === 'tea') {
    P(x - 2, y - 15, 5, 4, OUT); P(x - 1, y - 14, 3, 2, '#f0e8f4'); P(x + 2, y - 14, 1, 1, '#f0e8f4');
    ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(x - (slow ? 0 : 1), y - 18, 1, 2); ctx.fillRect(x + (slow ? 1 : 0), y - 20, 1, 2);
  } else if (a.act === 'notebook') {                               // Caleb no notebook: aberto sobre a mesinha (à direita dele), fones e notinhas
    const yy = Math.round(a.y); P(114, 63, 9, 7, '#2a2a34'); P(115, 64, 7, 5, slow ? '#7ab0d8' : '#8ac0e0'); P(116, 65, 3, 1, '#d8ecf8'); P(113, 70, 11, 2, '#5a5a6a'); P(114, 70, 9, 1, '#8a8a98');
    phones(P, x, yy, a.dir); if (slow) { P(x + 4, yy - 32, 1, 3, '#d8d0e8'); P(x + 4, yy - 33, 2, 1, '#d8d0e8'); P(x + 3, yy - 30, 1, 1, '#d8d0e8'); }
  } else if (a.act === 'music') {                                  // ouvindo música: fones e uma notinha subindo
    const yy = Math.round(a.y), k = Math.floor(t / 600) % 3; phones(P, x, yy, a.dir);
    P(x + 5 + k, yy - 30 - k * 2, 1, 3, '#d8d0e8'); P(x + 5 + k, yy - 31 - k * 2, 2, 1, '#d8d0e8'); P(x + 4 + k, yy - 28 - k * 2, 1, 1, '#d8d0e8');
  } else if (a.act === 'boxes') {                                  // ajudando com as caixas
    P(x - 5, y - 17, 10, 7, OUT); P(x - 4, y - 16, 8, 5, '#c89a62'); P(x - 4, y - 16, 8, 1, '#e0b878'); P(x - 1, y - 16, 2, 5, '#a87a48');
  } else if (a.act === 'lunch') {                                  // almoçando com a avó: pratinho na mão (à frente da mão, sem cobrir o corpo)
    const yy = Math.round(a.y), d = a.dir, px0 = d === 'left' ? x - 9 : d === 'right' ? x + 3 : x - 3;
    if (d !== 'up') { P(px0 - 1, yy - 9, 8, 3, OUT); P(px0, yy - 9, 6, 2, '#f0ecf4'); P(px0, yy - 8, 6, 1, '#c8c2d0'); P(px0 + 1, yy - 10, 2, 1, '#e8a050'); P(px0 + 3, yy - 10, 2, 1, '#78b04c'); }
  } else if (a.act === 'read' || a.act === 'study') {
    P(x - 4, y - 15, 8, 5, OUT); P(x - 3, y - 14, 3, 3, a.act === 'study' ? '#3f86d0' : '#c8483a'); P(x + 1, y - 14, 3, 3, a.act === 'study' ? '#3f86d0' : '#c8483a'); P(x, y - 14, 1, 3, '#f8f4ea');
  }
}
/* Pinturas da fonte feitas por Iara (48x36), uma por estação, e o esboço do detalhe da praça. */
const PAINT_SKY = [['#f0d8e8', '#c8e4f4'], ['#8ad0f0', '#bfe8f8'], ['#f0c890', '#f4dcb0'], ['#d8e2ee', '#eef2f6']];
const paintCache = {};
function painting(kind, si = 0) {
  const key = kind + si; if (paintCache[key]) return paintCache[key];
  const c = document.createElement('canvas'); c.width = 48; c.height = 36; const g2 = c.getContext('2d');
  const P = (x, y, w, h, col) => { g2.fillStyle = col; g2.fillRect(x, y, w, h); };
  if (kind === 'esboco') {                                          // esboço a lápis: florzinha entre as pedras
    P(0, 0, 48, 36, '#f4eedc'); for (let y = 6; y < 36; y += 6) P(0, y, 48, 1, '#e4dcc4');
    [[8, 22, 9, 6], [30, 24, 10, 6], [18, 28, 12, 5], [2, 30, 8, 5], [38, 30, 9, 5]].forEach(([x, y, w, h]) => { P(x, y, w, 1, '#6a6a72'); P(x, y + h, w, 1, '#6a6a72'); P(x - 1, y + 1, 1, h - 1, '#6a6a72'); P(x + w, y + 1, 1, h - 1, '#6a6a72'); for (let i = 1; i < w; i += 2) P(x + i, y + h - 1, 1, 1, '#a8a8b0'); });
    P(23, 14, 1, 13, '#6a6a72'); P(21, 18, 2, 1, '#6a6a72'); P(24, 20, 2, 1, '#6a6a72');
    [[22, 10], [25, 10], [23, 8], [23, 12]].forEach(([x, y]) => P(x, y, 2, 2, '#b48af0')); P(23, 10, 2, 2, '#f2c84a');
    return (paintCache[key] = c);
  }
  const [s1, s2] = PAINT_SKY[si];
  for (let y = 0; y < 16; y++) P(0, y, 48, 1, y < 8 ? s1 : s2);
  for (let i = 0; i < 40; i++) P((i * 13) % 48, (i * 7) % 15, 2, 1, i % 2 ? s2 : s1);      // pinceladas no céu
  const TREE = [['#f4b8d0', '#58a838'], ['#2f8a40', '#3f9a52'], ['#e07a2a', '#c8483a'], ['#8a8a96', '#f4f8fc']][si];
  [[6, 13], [15, 11], [36, 12], [44, 14]].forEach(([x, y], i) => { P(x - 1, y, 2, 6, '#6a4426'); P(x - 5, y - 5, 10, 6, TREE[i % 2]); P(x - 3, y - 7, 6, 3, TREE[(i + 1) % 2]); });
  P(0, 18, 48, 18, si === 3 ? '#eef2f6' : '#d8c8a0'); for (let i = 0; i < 30; i++) P((i * 11) % 48, 19 + (i * 5) % 16, 3, 1, si === 3 ? '#d4dce8' : '#c0ae84');   // pedras da praça
  P(12, 22, 24, 9, '#7a7a88'); P(13, 23, 22, 7, '#a8a8b8'); P(15, 24, 18, 4, si === 3 ? '#cfe8f4' : '#4a9ad8'); P(16, 24, 16, 1, si === 3 ? '#f4fbff' : '#8fd0f0');   // bacia e água
  P(23, 12, 3, 12, '#8a8a98'); P(21, 11, 7, 2, '#a8a8b8'); if (si !== 3) { P(20, 13, 1, 9, '#bfe4ff'); P(28, 13, 1, 9, '#bfe4ff'); }
  if (si === 0) [[18, 25], [27, 26], [30, 24]].forEach(([x, y]) => P(x, y, 2, 1, '#f8c8d8'));
  if (si === 1) { P(40, 3, 5, 5, '#f8e070'); [[19, 25], [29, 26]].forEach(([x, y]) => P(x, y, 1, 1, '#ffffff')); }
  if (si === 2) [[18, 26], [26, 25], [31, 27], [9, 30], [38, 33]].forEach(([x, y]) => P(x, y, 2, 1, '#e0902a'));
  if (si === 3) for (let i = 0; i < 18; i++) P((i * 17) % 48, (i * 9) % 30, 1, 1, '#ffffff');
  return (paintCache[key] = c);
}
function liftFish(ctx, a, t) {                   // personagem de frente, com o peixe erguido acima da cabeça
  const x = Math.round(a.x), y = Math.round(a.y), [sk, sd] = skinOf(a.look), bob = Math.floor(t / 300) % 2;
  [[OX(-9), OY(-27)], [OX(8), OY(-27)]].forEach(([dx, dy]) => { ctx.fillStyle = OUT; ctx.fillRect(x + dx - 1, y + dy - 8, 4, 10); ctx.fillStyle = sk; ctx.fillRect(x + dx, y + dy - 7, 2, 8); ctx.fillStyle = sd; ctx.fillRect(x + dx + 1, y + dy - 7, 1, 8); });
  ctx.drawImage(icon(a.fish.hold), x - 8, y + OY(-46) - bob);
  if (Math.floor(t / 180) % 3 === 0) { ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 9, y + OY(-46), 1, 3); ctx.fillRect(x + 8, y + OY(-45), 3, 1); ctx.fillRect(x - 11, y + OY(-38), 1, 1); }
}
function fishLine(ctx, f, t) {
  (f.rings || []).forEach(r => {                  // respingo: anéis que se abrem na água
    const k = (t - r.t0) / 650; if (k < 0 || k > 1) return;
    const rx = 2 + k * 9, ry = 1 + k * 4; ctx.fillStyle = `rgba(232,251,255,${0.9 * (1 - k)})`;
    for (let i = 0; i < 20; i++) { const an = (i / 20) * Math.PI * 2; ctx.fillRect(Math.round(r.x + Math.cos(an) * rx), Math.round(r.y + Math.sin(an) * ry), 1, 1); }
    if (k < 0.35) { ctx.fillStyle = '#e8fbff'; ctx.fillRect(Math.round(r.x) - 1, Math.round(r.y - 3 - k * 10), 2, 2); ctx.fillRect(Math.round(r.x) + 3, Math.round(r.y - 2 - k * 6), 1, 1); ctx.fillRect(Math.round(r.x) - 4, Math.round(r.y - 2 - k * 7), 1, 1); }
  });
  if (f.tip && f.bob && !f.hold) {               // linha: da ponta da vara até a boia, caindo um pouco no meio
    const [ax, ay] = f.tip, [bx, by] = f.bob, d = Math.hypot(bx - ax, by - ay), sag = (f.slack || 0) * Math.min(14, d * 0.3);
    const cx = (ax + bx) / 2, cy = (ay + by) / 2 + sag, n = Math.max(2, Math.ceil(d * 1.3));
    ctx.fillStyle = 'rgba(250,250,240,.9)';
    for (let i = 0; i <= n; i++) { const k = i / n, x = (1 - k) * (1 - k) * ax + 2 * (1 - k) * k * cx + k * k * bx, y = (1 - k) * (1 - k) * ay + 2 * (1 - k) * k * cy + k * k * by; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); }
  }
  if (f.bob && f.bobMode !== 'none') {           // boia vermelha e branca
    const [x0, y0] = f.bob, x = Math.round(x0), m = f.bobMode;
    const y = Math.round(y0 + (m === 'float' ? (Math.floor(t / 420) % 2) : m === 'nibble' ? 1 + (Math.floor(t / 70) % 2) : 0));
    if (m === 'sink') { ctx.fillStyle = OUT; ctx.fillRect(x - 2, y, 4, 2); ctx.fillStyle = '#e04a3a'; ctx.fillRect(x - 1, y, 2, 1); ctx.fillStyle = 'rgba(232,251,255,.9)'; ctx.fillRect(x - 4, y + 2, 8, 1); }
    else {
      ctx.fillStyle = OUT; ctx.fillRect(x - 2, y - 4, 5, 6); ctx.fillRect(x, y - 6, 1, 2);
      ctx.fillStyle = '#e04a3a'; ctx.fillRect(x - 1, y - 3, 3, 2); ctx.fillStyle = '#ff8a7a'; ctx.fillRect(x - 1, y - 3, 1, 1);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 1, y - 1, 3, 2);
      if (m !== 'fly' && m !== 'reel') { ctx.fillStyle = 'rgba(232,251,255,.7)'; ctx.fillRect(x - 3, y + 1, 7, 1); }
    }
  }
  if (f.jump) { const j = f.jump; ctx.save(); ctx.translate(Math.round(j.x), Math.round(j.y)); if (j.flip) ctx.scale(-1, 1); ctx.drawImage(icon(j.id), -8, -8); ctx.restore(); }
  if (f.charge != null && f.head) {              // barra de força acima da cabeça
    const [hx, hy] = f.head, x = Math.round(hx) - 13, y = Math.round(hy), w = 26, k = f.charge;
    ctx.fillStyle = OUT; ctx.fillRect(x - 1, y - 1, w + 2, 7); ctx.fillStyle = '#e8dcb8'; ctx.fillRect(x, y, w, 5); ctx.fillStyle = '#5a3a22'; ctx.fillRect(x + 1, y + 1, w - 2, 3);
    const fw = Math.round((w - 2) * k); ctx.fillStyle = k < 0.4 ? '#8fe88f' : k < 0.8 ? '#ffd75e' : '#ff8a4a'; ctx.fillRect(x + 1, y + 1, fw, 3); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(x + 1, y + 1, fw, 1);
    for (let i = 1; i < 4; i++) { ctx.fillStyle = '#e8dcb8'; ctx.fillRect(x + Math.round(w * i / 4), y + 4, 1, 2); }
  }
  if (f.alert != null && f.head) {               // fisgada: "!" grande piscando e o tempo que resta
    const [hx, hy] = f.head, x = Math.round(hx), y = Math.round(hy) - 4, on = Math.floor(t / 110) % 2;
    ctx.fillStyle = OUT; ctx.fillRect(x - 6, y - 14, 13, 14); ctx.fillRect(x - 1, y, 3, 3);
    ctx.fillStyle = on ? '#ffd75e' : '#ffffff'; ctx.fillRect(x - 5, y - 13, 11, 12); ctx.fillRect(x, y, 1, 2);
    ctx.fillStyle = '#c8302a'; ctx.fillRect(x - 1, y - 11, 3, 6); ctx.fillRect(x - 1, y - 4, 3, 2);
    ctx.fillStyle = OUT; ctx.fillRect(x - 7, y + 4, 15, 3); ctx.fillStyle = '#ff6a4a'; ctx.fillRect(x - 6, y + 5, Math.max(1, Math.round(13 * f.alert)), 1);
    if (f.bob) { const [bx, by] = f.bob, k = (t % 500) / 500; ctx.fillStyle = `rgba(255,215,94,${1 - k})`; for (let i = 0; i < 16; i++) { const an = i / 16 * Math.PI * 2; ctx.fillRect(Math.round(bx + Math.cos(an) * (4 + k * 6)), Math.round(by + 1 + Math.sin(an) * (2 + k * 3)), 1, 1); } }
  }
}
/* Efeito de impacto: lascas que voam e um brilho rápido no ponto do golpe. */
const CHIP = { wood: ['#b88448', '#7a5230'], stone: ['#c0c0cc', '#8a8a98'], leaf: ['#58b858', '#2f8a40'], soil: ['#a07848', '#6e4c28'], water: ['#bfe4ff', '#6aacf0'], spark: ['#ffffff', '#ffd75e'] };
function impact(ctx, f, t) {
  const k = (t - f.t0) / 380; if (k < 0 || k > 1) return;
  const [a, b] = CHIP[f.k] || CHIP.spark;
  if (k < 0.25 && f.k !== 'water' && f.k !== 'soil') { ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(f.x) - 3, Math.round(f.y), 7, 1); ctx.fillRect(Math.round(f.x), Math.round(f.y) - 3, 1, 7); }
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2 + f.t0 % 1, sp = f.k === 'water' ? 7 : 11;
    const x = f.x + Math.cos(ang) * sp * k, y = f.y + Math.sin(ang) * sp * k * 0.6 + (f.k === 'water' ? 0 : k * k * 8);
    ctx.fillStyle = i % 2 ? a : b; ctx.fillRect(Math.round(x), Math.round(y), k < 0.5 ? 2 : 1, k < 0.5 ? 2 : 1);
  }
}
/* Bicho de estimação (gato ou cachorro), 16x14, com pés em (x, y). */
const PETC = { gato: ['#e8a048', '#b87028', '#fff0d8'], cachorro: ['#a87048', '#7a4a28', '#f4e4cc'] };
function petFig(ctx, x, y, sp, frame, flip, sit) {
  const [c, d, l] = PETC[sp] || PETC.gato, s = flip ? -1 : 1, P = (a, b, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(flip ? x - a - w : x + a, y + b, w, h); };
  ctx.fillStyle = 'rgba(20,30,20,.25)'; ctx.fillRect(x - 7, y - 1, 14, 2);
  const leg = frame % 2;
  if (sit) { P(-5, -9, 9, 9, OUT); P(-4, -8, 7, 8, c); P(-3, -5, 4, 5, l); P(-8, -3, 4, 3, OUT); P(-7, -2, 3, 1, c); }
  else {
    P(-7, -8, 12, 7, OUT); P(-6, -7, 10, 5, c); P(-6, -3, 10, 1, d); P(-4, -5, 5, 2, l);
    P(-6, -2, 2, 2 + leg, OUT); P(2, -2, 2, 3 - leg, OUT); P(-3, -2, 2, 3 - leg, d); P(5 - 1, -2, 1, 2 + leg, d);
    if (sp === 'gato') { P(-10, -12 + leg, 2, 6, OUT); P(-9, -11 + leg, 1, 5, c); } else { P(-9, -9 - leg, 3, 2, OUT); P(-8, -9 - leg, 2, 1, c); }
  }
  // cabeça
  const hx = sit ? 0 : 3, hy = sit ? -15 : -13;
  P(hx - 1, hy, 9, 8, OUT); P(hx, hy + 1, 7, 6, c); P(hx + 2, hy + 4, 4, 3, l);
  if (sp === 'gato') { P(hx, hy - 2, 2, 3, OUT); P(hx + 5, hy - 2, 2, 3, OUT); P(hx + 1, hy - 1, 1, 1, '#f08fb0'); P(hx + 5, hy - 1, 1, 1, '#f08fb0'); P(hx + 1, hy + 3, 1, 1, '#2e6a3a'); P(hx + 5, hy + 3, 1, 1, '#2e6a3a'); }
  else { P(hx - 2, hy + 1, 3, 5, OUT); P(hx - 1, hy + 1, 1, 4, d); P(hx + 6, hy + 1, 3, 5, OUT); P(hx + 7, hy + 1, 1, 4, d); P(hx + 2, hy + 3, 1, 1, OUT); P(hx + 5, hy + 3, 1, 1, OUT); P(hx + 3, hy + 5, 2, 1, OUT); }
  if (sp === 'gato') P(hx + 3, hy + 5, 1, 1, '#f08fb0');
}
function petDraw(ctx, p, t) {                    // (era "pet": o nome agora é global e "pet" já existe em js/game/state.js)
  petFig(ctx, Math.round(p.x), Math.round(p.y), p.sp, p.moving ? Math.floor(t / 160) : 0, p.flip, !p.moving);
  if (p.heart) heart(ctx, Math.round(p.x) - 3, Math.round(p.y) - 26 - Math.floor(t / 250) % 2);
}
/* Pequena imagem do bicho para painéis. */
function petCanvas(sp, sit = true) {
  const c = document.createElement('canvas'); c.width = 24; c.height = 20; c.className = 'pixel';
  petFig(c.getContext('2d'), 12, 19, sp, 0, false, sit); return c;
}

function heart(ctx, x, y) { ctx.fillStyle = '#e04a3a'; ctx.fillRect(x, y, 3, 3); ctx.fillRect(x + 4, y, 3, 3); ctx.fillRect(x + 1, y + 3, 5, 2); ctx.fillRect(x + 3, y + 5, 1, 1); }
