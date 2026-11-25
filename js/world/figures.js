/* Mundo — figuras que mudam com o jogo: árvores frutíferas e do bosque, toco, boneco de treino e galinhas.
   Parte de js/world/ (antes era js/world.js). São scripts comuns, carregados em ordem pelo index.html:
   as declarações de nível superior valem para todos os arquivos (não são módulos). O objeto World,
   com as funções públicas, é montado no fim, em js/world/index.js. */

/* ================= figuras que mudam com o jogo ================= */
const figs = {};
const fig = (key, w, h, ox, fn) => { const k = key + ':' + SEASON; if (!figs[k]) { paintSeason = SEASON; try { figs[k] = tallImg(fn, w, h, ox); } finally { paintSeason = -1; } } return figs[k]; };
const FRUIT = { laranja: ['#256e34', '#3f9648', '#f08a20'], goiaba: ['#4a8a3a', '#7ab84e', '#f07a90'] };
function fruitTree(sp, stage, fruit) {
  const [dark, mid, fr] = FRUIT[sp];
  if (stage === 0) return fig('ft0' + sp, 14, 18, 7, () => { R(-1, -8, 2, 8, '#6a4426'); box(-5, -11, 4, 3, mid); box(1, -13, 4, 3, mid); R(-3, 0, 6, 1, '#5a3a1e'); });
  const FP = { out: OUT, deep: shade(dark, 0.6), d: dark, m: shade(mid, 0.9), l: mid, hi: shade(mid, 1.25) }, sd = sp === 'laranja' ? 41 : 73;
  if (stage === 1) return fig('ft1' + sp, 22, 30, 11, () => { shadowOval(1, 0, 7, 2); trunk(0, 0, 7, sd, -2); canopy(0, -14, 6, FP, sd); });
  return fig('ft2' + sp + (fruit ? 'f' : ''), 34, 46, 17, () => {
    shadowOval(2, 0, 12, 3); trunk(0, 0, 10, sd, -1);
    canopy(0, -23, 11, FP, sd);
    if (fruit) [[-7, -22], [5, -28], [6, -18], [-2, -16], [-9, -30], [1, -33]].forEach(([x, y]) => { box(x, y, 3, 3, fr); R(x, y, 1, 1, shade(fr, 1.3)); R(x + 2, y + 2, 1, 1, shade(fr, 0.8)); });
  });
}
const wildTree = (i = 0) => fig('wild' + i, 36, 52, 18, () => { treeSeed = 9173 + i * 131; tree(0, 0, 13); });   // cada árvore do bosque com o seu desenho (o corte continua igual)
const stump = (i = 0) => fig('stump' + (i % 4), 22, 16, 11, () => stumpShape((a, b, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(a), Math.round(b), w, h); }, 0, 2, [11, 12, 11, 13][i % 4], [10, 9, 11, 9][i % 4], i % 4));
const dummyFig = () => fig('dummy', 22, 34, 11, () => { R(-1, -22, 2, 22, '#6a4426'); box(-6, -22, 12, 12, '#d8b878'); R(-6, -22, 12, 2, '#f0d8a0'); R(-3, -18, 2, 2, OUT); R(2, -18, 2, 2, OUT); R(-9, -17, 18, 2, '#8a5e36'); blob(0, -26, 5, OUT); blob(0, -26, 4, '#e8c888'); blob(0, -16, 2, '#c8483a'); });
const HEN = [['#f8f8f0', '#d8d8c8'], ['#c8843a', '#a06428'], ['#4a4a52', '#2e2e36'], ['#e8c878', '#c8a050']];
function hen(ctx, x, y, kind, flip, peck, bob) {
  const [c, d] = HEN[kind % HEN.length], s = flip ? -1 : 1, hx = x + s * 4, hy = y - 9 + (peck ? 3 : 0) - bob;
  ctx.fillStyle = 'rgba(20,30,20,.25)'; ctx.fillRect(x - 5, y - 1, 10, 2);
  ctx.fillStyle = OUT; ctx.fillRect(x - 6, y - 8 - bob, 12, 8); ctx.fillRect(hx - 3, hy - 1, 6, 6);
  ctx.fillStyle = c; ctx.fillRect(x - 5, y - 7 - bob, 10, 6); ctx.fillRect(hx - 2, hy, 4, 4);
  ctx.fillStyle = d; ctx.fillRect(x - 5 - (flip ? -8 : 0), y - 7 - bob, 2, 3); ctx.fillRect(x - 3, y - 3 - bob, 6, 2);
  ctx.fillStyle = '#e04a3a'; ctx.fillRect(hx - 1, hy - 2, 2, 2);
  ctx.fillStyle = '#f0a020'; ctx.fillRect(hx + s * 2 - (flip ? 1 : 0), hy + 2, 2, 1); ctx.fillRect(x - 2, y - 1, 1, 2); ctx.fillRect(x + 1, y - 1, 1, 2);
  ctx.fillStyle = OUT; ctx.fillRect(hx + (flip ? -1 : 0), hy + 1, 1, 1);
}
