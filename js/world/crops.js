/* Mundo — o que cresce e se colhe na terra: plantações por estágio, terra revolvida, pedras, galhos, tocos,
   mato da fazenda, capim e coletáveis do bosque.
   Parte de js/world/ (antes era js/world.js). São scripts comuns, carregados em ordem pelo index.html:
   as declarações de nível superior valem para todos os arquivos (não são módulos). O objeto World,
   com as funções públicas, é montado no fim, em js/world/index.js. */

function crop(ctx, x, y, kind, stage) {       // stage 0..3 (3 = madura)
  const P = (a, b, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x + a, y + b, w, h); };
  if (stage === 0) { P(7, 9, 2, 2, '#c8b078'); P(4, 5, 1, 1, '#c8b078'); P(11, 11, 1, 1, '#c8b078'); return; }
  if (kind === 'rabanete') {
    if (stage === 1) { P(7, 7, 2, 4, '#58b858'); P(5, 6, 2, 2, '#58b858'); P(9, 6, 2, 2, '#58b858'); }
    else { P(4, 3, 3, 6, '#3f9648'); P(9, 3, 3, 6, '#58b858'); P(7, 2, 2, 7, '#2f8a40'); if (stage === 3) { P(5, 9, 6, 4, OUT); P(6, 9, 4, 3, '#e0507a'); P(6, 9, 1, 1, '#f8a0b8'); } }
  } else if (kind === 'tomate') {
    P(7, stage === 1 ? 6 : 1, 1, stage === 1 ? 6 : 12, '#8a5e36');
    if (stage === 1) { P(5, 6, 2, 2, '#58b858'); P(8, 8, 3, 2, '#58b858'); }
    else { P(3, 3, 4, 4, '#2f8a40'); P(8, 2, 5, 4, '#3f9648'); P(4, 8, 4, 3, '#3f9648'); P(9, 7, 4, 4, '#2f8a40'); const c = stage === 3 ? '#e04a3a' : '#9ac850'; P(4, 5, 3, 3, c); P(10, 4, 3, 3, c); P(8, 9, 3, 3, c); }
  } else {
    if (stage === 1) { P(6, 8, 4, 2, '#58b858'); P(4, 7, 2, 2, '#3f9648'); P(10, 9, 2, 2, '#3f9648'); }
    else { P(1, 9, 14, 2, '#3f9648'); P(2, 6, 4, 4, '#2f8a40'); P(10, 10, 4, 4, '#2f8a40'); P(12, 5, 3, 3, '#58b858'); if (stage === 3) { P(4, 4, 9, 8, OUT); P(5, 5, 7, 6, '#e88a20'); P(7, 5, 1, 6, '#c06a10'); P(10, 5, 1, 6, '#c06a10'); P(6, 6, 1, 2, '#ffc070'); P(8, 3, 2, 2, '#3f9648'); } else { P(6, 7, 4, 4, '#9ac850'); } }
  }
}
/* Morango e abóbora: 5 estágios na primeira produção, o pé adulto na rebrota (flor →
   fruto em formação → maduro) e o pé seco no fim da estação. */
function staged(ctx, x, y, o) {
  const P = (a, b, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x + a, y + b, w, h); }, st = cropState(o);
  if (!o.dead && !(o.g > 0) && !(o.cyc > 0)) return plantedSeeds(P, o.crop);   // semente plantada, ainda sem germinar
  const s = o.dead ? 0 : st.ripe ? 6 : st.regrow ? (st.frac < 0.5 ? 4 : 5) : st.stage;
  if (o.crop === 'morango') strawberryPlant(P, s);
  else if (o.crop === 'abobora') pumpkinPlant(P, s);
  else if (o.crop === 'milho') cornPlant(P, s, !!st.regrow, o.dead);
  else if (o.crop === 'melao') melonPlant(P, s, o.dead);
  else if (o.crop === 'repolho_roxo') cabbagePlant(P, s, o.dead);
}
/* Sementes na terra (antes de germinar): covinhas com grãos. */
function plantedSeeds(P, crop) {
  const c = { milho: '#e8c040', melao: '#f4e8c8', repolho_roxo: '#5a3a5a', morango: '#c8a060', abobora: '#f0e0b0' }[crop] || '#c8a060';
  [[4, 8], [9, 7], [6, 11], [11, 11]].forEach(([a, b]) => { P(a - 1, b, 4, 2, '#5a3a1a'); P(a, b, 2, 1, c); });
}
const deadPlant = P => { P(4, 10, 8, 3, '#5a3a1a'); P(3, 9, 3, 2, '#8a6a3a'); P(10, 9, 3, 2, '#8a6a3a'); P(6, 6, 1, 4, '#7a5a2a'); P(9, 7, 1, 3, '#7a5a2a'); P(5, 5, 2, 1, '#a8884a'); };
/* Milho: alto (passa do canteiro para cima, desenhado antes do personagem, que fica sempre à frente). */
function cornPlant(P, s, regrow, dead) {
  const D = '#2a6a22', M = '#4f9c32', L = '#8ac850', Y = '#f2d040', YD = '#c89a20', T = '#e8c060';
  if (dead || s === 0) { P(7, -2, 2, 14, '#8a7040'); P(4, 4, 3, 1, '#a8884a'); P(9, 1, 3, 1, '#a8884a'); P(5, 9, 2, 1, '#a8884a'); return; }
  if (s === 1) { P(7, 9, 1, 4, M); P(6, 9, 1, 1, L); P(8, 8, 1, 1, L); return; }
  if (s === 2) { P(7, 6, 2, 7, D); P(7, 6, 1, 7, M); P(4, 8, 3, 1, M); P(9, 7, 3, 1, M); P(4, 7, 1, 1, L); P(11, 6, 1, 1, L); return; }
  const top = s === 3 ? 0 : -10, h = 13 - top;
  P(6, top, 3, h, D); P(7, top, 1, h, M);                                   // colmo
  const leaf = (y, dir) => { if (dir < 0) { P(2, y, 5, 1, D); P(1, y - 1, 2, 1, M); P(3, y, 3, 1, M); } else { P(9, y, 5, 1, D); P(13, y - 1, 2, 1, M); P(10, y, 3, 1, M); } };
  for (let y = top + 3, i = 0; y < 12; y += 3, i++) leaf(y, i % 2 ? 1 : -1);
  P(5, 11, 6, 2, D);
  if (s >= 4) { P(6, top - 3, 3, 3, T); P(7, top - 4, 1, 1, T); P(5, top - 2, 1, 1, T); P(9, top - 2, 1, 1, T); }   // pendão
  if (s === 6) [[4, -2], [9, 2]].forEach(([a, b]) => { P(a - 1, b - 1, 4, 7, '#2a1a14'); P(a, b, 2, 5, Y); P(a, b, 1, 1, '#fff0a0'); P(a + 1, b + 3, 1, 1, YD); P(a - 1, b + 2, 1, 3, L); P(a + 2, b + 2, 1, 3, L); });   // espigas
  else if (s === 5 && !regrow) [[4, 0]].forEach(([a, b]) => { P(a, b, 2, 4, L); P(a, b, 1, 1, '#d8f0a0'); });
  else if (s === 5 && regrow) [[4, -1], [9, 3]].forEach(([a, b]) => { P(a, b, 2, 3, L); });                 // espigas novas, ainda verdes
}
/* Melão: rama rasteira, flor amarela e o fruto que cresce de verde a laranja-avermelhado. */
function melonPlant(P, s, dead) {
  const D = '#2a6422', M = '#3f9648', L = '#7ac24e';
  if (dead || s === 0) return deadPlant(P);
  const leaf = (a, b) => { P(a, b, 4, 3, D); P(a, b, 3, 2, M); P(a, b, 1, 1, L); };
  if (s === 1) { P(7, 10, 1, 3, M); P(6, 9, 1, 1, L); P(8, 9, 1, 1, L); return; }
  if (s === 2) { P(7, 9, 1, 4, D); leaf(3, 8); leaf(9, 8); return; }
  P(2, 12, 12, 1, '#4a8a30'); leaf(1, 8); leaf(6, 6); leaf(11, 8); leaf(4, 11); leaf(10, 11);
  if (s === 3) return;
  if (s === 4) { P(7, 9, 3, 3, '#ffd040'); P(8, 10, 1, 1, '#e09020'); return; }
  if (s === 5) { P(5, 8, 6, 5, '#2a1a14'); P(6, 9, 4, 3, '#9ac850'); P(6, 9, 1, 1, '#d8f0a0'); return; }
  P(3, 5, 10, 9, '#2a1a14'); P(4, 6, 8, 7, '#e8604a'); P(5, 7, 6, 5, '#f07a5a'); P(5, 7, 2, 2, '#ffb090'); P(4, 12, 8, 1, '#b8402e');
  P(6, 4, 4, 3, D); P(7, 3, 2, 2, M); P(5, 5, 1, 1, L); P(10, 5, 1, 1, L);
}
/* Repolho roxo: roseta verde que fecha num repolho roxo. */
function cabbagePlant(P, s, dead) {
  const D = '#2a6422', M = '#4f9c48', L = '#8ad070', PD = '#4a1a5a', PM = '#8a3aa8', PL = '#c27ae0';
  if (dead || s === 0) return deadPlant(P);
  if (s === 1) { P(7, 10, 2, 3, M); P(6, 10, 1, 1, L); P(9, 10, 1, 1, L); return; }
  if (s === 2) { P(5, 9, 6, 4, D); P(6, 9, 4, 3, M); P(6, 9, 1, 1, L); P(9, 10, 1, 1, L); return; }
  P(2, 7, 12, 7, D); P(3, 8, 10, 5, M); P(2, 7, 2, 2, L); P(12, 7, 2, 2, L); P(3, 12, 2, 1, L); P(11, 12, 2, 1, L);   // folhas de fora
  if (s === 3) { P(6, 8, 4, 3, '#3f7a3a'); return; }
  if (s === 4) { P(6, 8, 4, 3, PD); P(7, 8, 2, 2, PM); return; }
  if (s === 5) { P(5, 6, 6, 6, PD); P(6, 7, 4, 4, PM); P(6, 7, 1, 1, PL); return; }
  P(4, 4, 8, 9, '#2a1a14'); P(5, 5, 6, 7, PM); P(6, 5, 4, 1, PL); P(5, 6, 2, 2, PL); P(8, 7, 1, 4, PD); P(6, 9, 4, 1, PD); P(5, 11, 6, 1, PD);   // repolho fechado
}
function strawberryPlant(P, s) {
  const D = '#2a6a2a', M = '#4fa848', L = '#8ad060';
  if (s === 0) { P(4, 10, 8, 3, '#5a3a1a'); P(3, 9, 3, 2, '#8a6a3a'); P(10, 9, 3, 2, '#8a6a3a'); P(6, 7, 1, 3, '#7a5a2a'); P(9, 7, 1, 3, '#7a5a2a'); P(7, 11, 3, 1, '#a8884a'); P(5, 8, 1, 1, '#a8884a'); return; }
  if (s === 1) { P(7, 10, 2, 3, M); P(6, 9, 1, 1, L); P(9, 9, 1, 1, L); P(7, 12, 2, 1, D); return; }
  if (s === 2) { P(7, 9, 1, 4, D); P(5, 8, 2, 2, M); P(9, 8, 2, 2, M); P(7, 6, 2, 2, M); P(5, 8, 1, 1, L); P(7, 6, 1, 1, L); return; }
  const leaf = (a, b) => { P(a, b, 3, 3, D); P(a, b, 2, 2, M); P(a, b, 1, 1, L); };
  if (s === 3) { leaf(4, 8); leaf(9, 8); leaf(6, 5); leaf(7, 10); return; }
  leaf(2, 8); leaf(11, 8); leaf(5, 5); leaf(9, 5); leaf(7, 9); leaf(4, 11); leaf(10, 11);
  if (s === 4) [[3, 6], [12, 6], [7, 3]].forEach(([a, b]) => { P(a - 1, b, 3, 1, '#f8f8f0'); P(a, b - 1, 1, 3, '#f8f8f0'); P(a, b, 1, 1, '#f0c040'); });
  if (s === 5) [[3, 6], [12, 7], [7, 13]].forEach(([a, b]) => { P(a - 1, b - 1, 3, 4, '#2a4a1a'); P(a, b, 1, 2, '#b8e080'); });
  if (s === 6) [[2, 6], [12, 6], [7, 12]].forEach(([a, b]) => {        // maduro: morangos vermelhos bem à vista
    P(a - 1, b - 1, 5, 6, '#2a1a14'); P(a, b, 3, 4, '#e0283a'); P(a, b, 1, 1, '#ff8a8a'); P(a + 1, b + 2, 1, 1, '#ffe080'); P(a + 2, b + 1, 1, 1, '#ffe080');
    P(a, b - 1, 3, 1, '#3f9648'); P(a + 1, b + 4, 1, 1, '#a81a2a');
  });
}
function pumpkinPlant(P, s) {
  const D = '#2a6422', M = '#3f9648', L = '#6ab84a', V = '#4a8a30';
  const bigLeaf = (a, b) => { P(a, b, 4, 3, D); P(a, b, 3, 2, M); P(a + 1, b, 1, 1, L); };
  if (s === 0) { P(1, 11, 14, 1, '#7a5a2a'); P(2, 9, 3, 2, '#8a6a3a'); P(10, 9, 4, 2, '#8a6a3a'); P(6, 8, 3, 3, '#6a4a22'); P(7, 7, 1, 1, '#a8884a'); P(12, 12, 2, 1, '#5a3a1a'); return; }
  if (s === 1) { P(7, 10, 1, 3, M); P(5, 9, 2, 2, L); P(8, 9, 2, 2, L); return; }
  if (s === 2) { P(7, 8, 1, 5, D); bigLeaf(3, 8); bigLeaf(8, 7); bigLeaf(5, 5); return; }
  P(1, 11, 14, 1, V); P(3, 10, 1, 1, V); P(12, 12, 1, 1, V);                 // rama espalhada
  bigLeaf(1, 7); bigLeaf(5, 5); bigLeaf(10, 6); bigLeaf(12, 9); bigLeaf(3, 12);
  if (s === 3) return;
  if (s === 4) { P(7, 9, 3, 3, '#ffd040'); P(8, 10, 1, 1, '#e09020'); P(6, 10, 1, 1, '#ffe880'); return; }
  if (s === 5) { P(5, 8, 6, 5, '#2a1a14'); P(6, 9, 4, 3, '#8ac850'); P(7, 9, 1, 3, '#6aa838'); P(8, 7, 1, 2, '#5a3a1e'); return; }   // abóbora em formação: pequena e verde
  P(3, 5, 10, 9, '#2a1a14'); P(4, 6, 8, 7, '#e88a20'); P(6, 6, 1, 7, '#c06a10'); P(9, 6, 1, 7, '#c06a10');   // madura: grande e laranja
  P(4, 7, 1, 3, '#ffc070'); P(5, 6, 1, 1, '#ffc070'); P(7, 3, 2, 3, '#2a1a14'); P(7, 4, 1, 2, '#6a8a2a'); P(4, 12, 8, 1, '#a85a10');
}
/* Recursos do chão (pedras, galhos, tocos e matinhos): sprites pequenos com variações que dependem só da
   posição do objeto (mesma aparência ao mover a câmera, salvar e carregar). Ficam em cache por tipo e variação. */
const DCACHE = {};
function dsprite(key, w, h, fn) {
  if (!DCACHE[key]) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); fn((a, b, ww, hh, col) => { x.fillStyle = col; x.fillRect(Math.round(a), Math.round(b), ww, hh); }); DCACHE[key] = c; }
  return DCACHE[key];
}
const hsh = (a, b, s = 0) => { let h = (a * 374761393 + b * 668265263 + s * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
/* pedra de silhueta irregular: perfil linha a linha com lados independentes, faces claras em cima,
   lado direito na sombra, contorno suave e sombra de contato. (cx, by) = centro da base. */
function stoneShape(P, cx, by, w, h, v, big) {
  const rows = [];
  for (let j = 0; j < h; j++) {
    const t = (j + 0.5) / h, k = t < 0.62 ? Math.sqrt(Math.max(0, 1 - ((0.62 - t) / 0.62) ** 2)) : 1 - Math.max(0, t - 0.86) * 1.2;
    const jl = j === Math.floor(h * 0.3) && v % 2 ? 1 : 0, jr = j === Math.floor(h * 0.5) && v % 2 === 0 ? -1 : 0, lean = (v % 2 ? 1 : -1) * Math.round((1 - t) * 0.8);   // facetas discretas, sem ruído
    rows.push([Math.round(cx - (w / 2) * k) + jl + lean, Math.round(cx + (w / 2) * k) + jr + lean]);
  }
  P(cx - w / 2 - 1, by - 1, w + 3, 2, 'rgba(30,36,24,.28)');                                     // sombra de contato
  const y0 = by - h;
  rows.forEach(([l, r], j) => { if (r - l < 1) return; P(l - 1, y0 + j, r - l + 2, 1, '#55505a'); });
  if (rows[0][1] - rows[0][0] > 0) P(rows[0][0], y0 - 1, rows[0][1] - rows[0][0], 1, '#55505a');
  const base = ['#9a96a0', '#a29a94', '#96989e', '#a09c98'][v % 4], light = shade(base, 1.18), top = shade(base, 1.32), dark = shade(base, 0.78), deep = shade(base, 0.66);
  rows.forEach(([l, r], j) => {
    if (r - l < 1) return; const y = y0 + j, t = j / h, wd = r - l;
    P(l, y, wd, 1, t < 0.38 ? light : base);
    if (t < 0.22) P(l + 1, y, Math.max(1, Math.round(wd * 0.55)), 1, top);                        // face de cima, luz do alto à esquerda
    P(r - Math.max(1, Math.round(wd * (t < 0.4 ? 0.2 : 0.34))), y, Math.max(1, Math.round(wd * (t < 0.4 ? 0.2 : 0.34))), 1, dark);
    if (j === h - 1) P(l, y, wd, 1, deep);
  });
  const mid = rows[Math.floor(h * 0.5)];
  if (v % 3 === 0) { const cx2 = mid[0] + Math.round((mid[1] - mid[0]) * 0.45); P(cx2, y0 + Math.floor(h * 0.42), 1, 2, dark); }   // uma rachadura só, em algumas
  if (v % 4 === 2 || big) { P(rows[1][0] + 1, y0 + 1, 2, 1, '#6e8a3c'); P(rows[2][0], y0 + 2, 1, 1, '#58763a'); }   // musgo
  if (v % 4 === 0) { P(cx + w / 2 + 2, by - 2, 2, 2, '#55505a'); P(cx + w / 2 + 2, by - 2, 1, 1, light); }        // pedrinha ao lado
}
/* galho caído: tronco fino em diagonal, casca com luz em cima, pontas de corte e raminhos */
function branchShape(P, v, ss = 0) {
  const flip = v % 2, L = 11 + (v >> 1) % 2 * 2, x0 = flip ? 15 : 3, y0 = 13 - (v % 3), dx = flip ? -1 : 1, rise = 3 + (v % 3);
  const pt = i => [x0 + dx * i, y0 - Math.round(i * rise / L)];
  for (let i = 0; i <= L; i++) { const [x, y] = pt(i); P(x, y + 2, 1, 1, 'rgba(30,36,24,.22)'); }
  for (let i = 0; i <= L; i++) {
    const [x, y] = pt(i); P(x, y - 1, 1, 3, '#4a301c');
    P(x, y - 1, 1, 1, '#a87a48'); P(x, y, 1, 1, '#7a5232');                                       // casca: luz em cima, base contínua
  }
  const [ax, ay] = pt(0), [bx, by] = pt(L);
  P(ax, ay - 1, 1, 2, '#e0c088'); P(ax, ay, 1, 1, '#b08a58');                                    // pontas de corte
  P(bx, by - 1, 1, 2, '#d8b47a');
  const twig = (i, up, len, leaf) => { const [x, y] = pt(i); for (let k = 1; k <= len; k++) P(x + dx * (k >> 1) * (up ? 1 : -1), y - 1 - k, 1, 1, k === len ? '#7a5232' : '#5e3e24'); if (leaf && ss !== 3) { P(x + dx * (len >> 1) * (up ? 1 : -1) - 1, y - 2 - len, 2, 1, ss === 2 ? '#c8781e' : '#58a848'); P(x + dx * (len >> 1) * (up ? 1 : -1), y - 3 - len, 1, 1, ss === 2 ? '#e8a040' : '#7cc458'); } };
  twig(4 + v % 2, true, 3, v % 3 !== 1); if (v % 4 !== 3) twig(8, false, 2, v % 2 === 0);
}
/* toco: raízes abertas, casca com estrias verticais, corte de cima oval com anéis */
function stumpShape(P, cx, by, w, h, v) {
  const l = Math.round(cx - w / 2), top = by - h, r = l + w;
  P(l - 2, by - 1, w + 4, 2, 'rgba(30,36,24,.28)');
  P(l - 3, by - 3, 4, 3, '#3e2816'); P(l - 2, by - 3, 3, 2, '#6a4428'); P(l - 3, by - 1, 1, 1, '#6a4428');   // raízes
  P(r - 1, by - 3, 4, 3, '#3e2816'); P(r - 1, by - 3, 3, 2, '#5e3e24'); P(r + 2, by - 1, 1, 1, '#5e3e24');
  if (v % 2) { P(cx - 2, by - 1, 4, 1, '#3e2816'); P(cx - 1, by - 1, 2, 1, '#6a4428'); }
  P(l - 1, top + 1, w + 2, h - 1, '#3e2816');                                                          // corpo
  for (let x = 0; x < w; x++) {
    const t = x / (w - 1), c = t < 0.25 ? '#8e6440' : t < 0.6 ? '#74502e' : t < 0.85 ? '#62422a' : '#523620';
    P(l + x, top + 2, 1, h - 3, c);
  }
  P(l, top - 1, w, 4, '#3e2816'); P(l + 1, top - 2, w - 2, 1, '#3e2816');                               // corte de cima (oval)
  P(l + 1, top - 1, w - 2, 3, '#d8b47c'); P(l, top, 1, 1, '#d8b47c'); P(r - 1, top, 1, 1, '#c09a64');
  P(l + 2, top - 1, w - 4, 1, '#ead0a0');
  P(l + 2, top, w - 4, 1, '#c09a64'); P(cx - 1, top, 2, 1, '#e2c690');                          // um anel
  P(l + Math.round(w * 0.35), top + 3, 1, h - 5, '#5e3e24'); P(l + Math.round(w * 0.7), top + 4, 1, h - 6, '#46301c');   // duas estrias
  if (v % 3 === 1) { P(r - 3, top + 4, 2, 2, '#6e8a3c'); }                                              // musgo
}
/* matinho: tufo de lâminas de alturas diferentes, inclinadas para lados diferentes, com base cheia */
function weedShape(P, v, ss = 0) {
  const n = 6 + v % 2, cols = ss === 3 ? ['#5a6a52', '#6a7a60', '#7a8a6e', '#62725a'] : ss === 2 ? ['#6a6a2c', '#8a7a36', '#a08a3c', '#7a7032'] : ['#2a6a2c', '#3a8436', '#4c9a3c', '#327a32'];
  P(2, 13, 12, 2, 'rgba(30,36,24,.25)');
  P(3, 11, 10, 3, cols[0]); P(4, 10, 8, 1, cols[3]);
  for (let i = 0; i < n; i++) {
    const bx = 3 + Math.round(i * 9 / (n - 1) + (hsh(v, i, 71) - 0.5) * 1.5), ht = 4 + Math.floor(hsh(v, i, 72) * 6) + (i === (v * 3) % n ? 3 : 0), lean = hsh(v, i, 73) < 0.5 ? -1 : 1, c = cols[i % 2 ? 1 : 2];
    for (let k = 0; k < ht; k++) { const x = bx + (k > ht * 0.5 ? lean : 0) + (k > ht * 0.85 && ht > 6 ? lean : 0); P(x, 12 - k, 1, 1, k > ht - 2 && ss < 2 ? '#6fb84a' : c); }
  }
  if (v % 4 === 1) { P(10, 3, 2, 2, '#ffe066'); P(10, 3, 1, 1, '#fff4a8'); P(11, 5, 1, 2, '#3a8436'); }   // florzinha
  if (v % 4 === 3) { P(5, 2, 1, 3, '#c8b878'); P(5, 1, 1, 1, '#e0d090'); P(6, 3, 1, 1, '#c8b878'); }       // espiga de capim
}
/* Canteiro preparado (revisão limpa): marrom médio, três sulcos discretos e de baixo contraste, bordas simples
   levemente irregulares. Lados encostados em outro canteiro continuam sem borda. Molhado mais escuro, mas legível.
   Cache por (molhado, vizinhos, variação). */
const SOIL = {}, SOILP = [{ base: [146, 90, 48], dark: [128, 77, 40], light: [160, 101, 56], edge: [122, 74, 38] }, { base: [94, 57, 31], dark: [80, 47, 25], light: [106, 66, 37], edge: [74, 44, 23] }];
function soilImg(wet, mask, v) {
  const key = (wet ? 'w' : 'd') + mask + ':' + v; if (SOIL[key]) return SOIL[key];
  const c = document.createElement('canvas'); c.width = c.height = 18; const x2 = c.getContext('2d'), img = x2.createImageData(18, 18), D = img.data, Pl = SOILP[wet ? 1 : 0];
  const put = (x, y, col) => { const i = (y * 18 + x) * 4; D[i] = col[0]; D[i + 1] = col[1]; D[i + 2] = col[2]; D[i + 3] = 255; };
  const N = !(mask & 1), E = !(mask & 2), S = !(mask & 4), Wd = !(mask & 8);
  for (let ly = 0; ly < 16; ly++) for (let lx = 0; lx < 16; lx++) {
    let col = Pl.base;
    // sulcos curtos e desencontrados (traços de 3 px), em quatro fileiras
    const row = Math.floor(ly / 4), fy = row * 4 + 2, ph = (row * 3 + v * 2) % 5, on = (lx + ph) % 5 < 3;
    if (ly === fy && on) col = Pl.dark; else if (ly === fy - 1 && on && (lx + ph) % 5 === 1) col = Pl.light;
    const eN = N && ly === 0, eS = S && ly === 15, eW = Wd && lx === 0, eE = E && lx === 15;
    if ((eN || eS) && (eW || eE)) continue;                                                       // canto arredondado
    if (eN || eS || eW || eE) col = Pl.edge;
    put(lx + 1, ly + 1, col);
  }
  x2.putImageData(img, 0, 0); return (SOIL[key] = c);
}
/* Capim alto (mato removível): folhas estreitas, compridas e curvas, de alturas diferentes e inclinadas para
   lados variados; base verde-escura, meios-tons e pontas verde-amareladas; flores ou sementes em alguns. Se há
   capim vizinho, as folhas avançam até ele e as moitas se emendam (bordas, centro mais denso, aberturas onde não
   há capim). Só as pontas oscilam, de leve. Cache por (variação, vizinhos, quadro, estação). */
const CAPIM = {};
function capim(v, mask, f) {
  const ss = SEASON, key = v + ':' + mask + ':' + f + ':' + ss; if (CAPIM[key]) return CAPIM[key];
  const pal = ss === 3 ? ['#4a5a50', '#62726a', '#76867c', '#dfe6ea'] : ss === 2 ? ['#5a4818', '#86662a', '#a07c30', '#d8b04a'] : ss === 1 ? ['#1d5a1c', '#2f852a', '#42a034', '#9cd444'] : ['#1f5a20', '#2f7f2a', '#3d9433', '#8fca3e'];
  const c = document.createElement('canvas'); c.width = 28; c.height = 34; const x2 = c.getContext('2d');
  const P = (x, y, col) => { x2.fillStyle = col; x2.fillRect(x + 6, y + 15, 1, 1); };                 // coordenadas do quadrado: (0,0)..(15,15)
  const N = mask & 1, E = mask & 2, S = mask & 4, Wn = mask & 8, nb = (N ? 1 : 0) + (E ? 1 : 0) + (S ? 1 : 0) + (Wn ? 1 : 0);
  const r = (i, a) => hsh(v * 131 + mask * 7, i, a);
  const xa = Wn ? -3 : 0, xb = E ? 18 : 15, bot = S ? 17 : 15;
  // massa da moita: topo irregular, mais alta no meio e onde há vizinhos; base sem linha reta
  const top = [], botY = [];
  for (let x = xa; x <= xb; x++) {
    const u = (x - xa) / (xb - xa), dome = Math.sin(Math.PI * (Wn && E ? 0.5 : Wn ? 0.25 + u * 0.75 : E ? u * 0.75 : u)), bump = Math.round((r(x + 40, 601) - 0.5) * 3);
    top[x - xa] = Math.round(bot - 2 - Math.round(dome * 2) - dome * (5 + (N ? 4 : 0) + (nb >= 3 ? 2 : 0)) - bump - (N ? 3 : 0) * (1 - dome));
    botY[x - xa] = bot - ((!Wn && x < xa + 2) || (!E && x > xb - 2) ? 1 : 0) - (!S && r(x, 602) < 0.25 ? 1 : 0);
  }
  if (!S) { x2.fillStyle = 'rgba(60,40,10,.24)'; for (let x = xa + 1; x < xb; x++) x2.fillRect(x + 6, botY[x - xa] + 15, 1, 1); }   // sombra junto à base
  for (let x = xa; x <= xb; x++) for (let y = top[x - xa]; y <= botY[x - xa]; y++) {
    const d = botY[x - xa] - y, hgt = botY[x - xa] - top[x - xa];
    P(x, y, d < 2 ? pal[0] : pal[1]);
  }
  for (let j = 0; j < 4 + nb * 2; j++) { const x = xa + 1 + Math.floor(r(j, 609) * (xb - xa - 2)), ti = x - xa, y = botY[ti] - 2 - Math.floor(r(j, 610) * Math.max(1, botY[ti] - top[ti] - 3)), d = r(j, 611) < 0.5 ? -1 : 1; P(x, y, pal[0]); P(x + d, y - 1, pal[0]); }   // folhas na sombra, por dentro
  // folhas: curvas, de alturas e direções variadas, saindo de dentro da massa (as de trás primeiro)
  const n = 12 + nb * 3 + (v % 3), tips = [];
  const blade = (bx, by, hgt, dir, L, col, tip, sway) => {
    for (let k = 0; k < hgt; k++) { const t = k / hgt, x = bx + dir * Math.round(L * t * t) + (t > 0.6 ? sway : 0); P(x, by - k, k >= hgt - 2 ? tip : col); if (t < 0.3) P(x - dir, by - k, col); }
    return [bx + dir * L + sway, by - hgt + 1];
  };
  for (let layer = 0; layer < 2; layer++) for (let i = 0; i < n; i++) {
    if ((i % 2) !== layer) continue;
    const bx = Math.round(xa + 1 + (i + 0.5) * (xb - xa - 2) / n + (r(i, 603) - 0.5) * 2), ti = Math.max(0, Math.min(top.length - 1, bx - xa));
    const nearW = !Wn && bx < 3, nearE = !E && bx > 12, dir = nearW ? -1 : nearE ? 1 : r(i, 604) < 0.5 ? -1 : 1;
    const hgt = Math.round((layer ? 4 + r(i, 605) * 5 : 6 + r(i, 605) * 6) * (nearW || nearE ? 0.65 : 1)) + 2;
    const by = top[ti] + 2 + (layer ? 2 : 0);
    tips.push(blade(bx, by, hgt, dir, 2 + Math.floor(r(i, 606) * 3), layer ? (i % 3 ? pal[2] : pal[1]) : pal[1], layer ? pal[3] : pal[2], i % 3 === 0 ? f : 0));
  }
  // luz agrupada no alto à esquerda da massa (traços de folha, não pontos)
  for (let j = 0; j < 3 + nb; j++) { const x = xa + 2 + Math.floor(r(j, 607) * (xb - xa - 4) * 0.7), ti = x - xa, y = top[ti] + 2 + Math.floor(r(j, 608) * 3); P(x, y, pal[2]); P(x + 1, y - 1, pal[2]); P(x + 2, y - 2, pal[3]); }
  if (ss < 3 && v % 3 === 0) [tips[3], tips[tips.length - 4]].forEach(tp => { if (!tp) return; const [x, y] = tp; P(x, y - 1, ss === 2 ? '#c86a20' : '#f08a28'); P(x + 1, y - 1, ss === 2 ? '#c86a20' : '#f08a28'); P(x, y - 2, '#ffc040'); });   // florzinhas
  if (ss < 3 && v % 3 === 1) { const tp = tips[Math.floor(tips.length / 2)]; if (tp) { P(tp[0], tp[1] - 1, '#d8c070'); P(tp[0], tp[1] - 2, '#e8d488'); P(tp[0], tp[1] - 3, '#d8c070'); } }   // sementes
  return (CAPIM[key] = c);
}
function debris(ctx, x, y, k, seed = 0) {
  const v = Math.floor(seed * 4) % 4;
  const ss = k === 'branch' || k === 'weed' ? SEASON : 0;
  const img = dsprite(k + v + ':' + ss, 20, 20, P => {
    const Q = (a, b, w, h, c) => P(a + 2, b + 2, w, h, c);
    if (k === 'stone') stoneShape(Q, 8, 14, [12, 13, 11, 12][v], [9, 8, 10, 9][v], v);
    else if (k === 'branch') branchShape(Q, v, ss);
    else if (k === 'stump') stumpShape(Q, 8, 15, [9, 10, 9, 11][v], [9, 8, 10, 8][v], v);
    else if (k === 'weed') weedShape(Q, v, ss);
  });
  ctx.drawImage(img, x - 2, y - 2);
}
function rock(ctx, x, y, i = 0) { const v = i % 4; ctx.drawImage(dsprite('rock' + v, 30, 22, P => stoneShape(P, 15, 20, [18, 20, 17, 19][v], [12, 11, 13, 12][v], v + 4, true)), x - 15, y - 19); }
function forage(ctx, x, y, id) {
  const P = (a, b, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x + a, y + b, w, h); };
  if (id === 'amora') { P(-6, -8, 12, 8, '#267a3a'); P(-4, -11, 8, 4, '#3f9648'); [[-4, -6], [1, -8], [3, -4], [-2, -3]].forEach(([a, b]) => P(a, b, 2, 2, '#6a2a8a')); }
  if (id === 'cogumelo') { P(-1, -4, 3, 4, '#f0e6cc'); P(-5, -9, 11, 5, OUT); P(-4, -8, 9, 3, '#c8483a'); P(-2, -8, 2, 1, '#fff'); P(2, -7, 2, 1, '#fff'); }
  if (id === 'flor') { P(0, -6, 1, 6, '#2f8a40'); P(-2, -10, 5, 5, '#ffe066'); P(-1, -9, 3, 3, '#f0a020'); P(-5, -4, 1, 4, '#2f8a40'); P(-7, -7, 4, 4, '#ffe066'); P(4, -3, 1, 3, '#2f8a40'); P(3, -6, 4, 4, '#ffe066'); }
  if (id === 'chapeu_tome') { P(-6, -4, 12, 3, OUT); P(-5, -3, 10, 2, '#5a4a32'); P(-4, -8, 8, 5, OUT); P(-3, -7, 6, 4, '#7a6a4a'); }
}
