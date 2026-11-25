/* Mundo — construções da vila: fachadas do Armazém, casas, escola, cabana e peças comuns.
   Parte de js/world/ (antes era js/world.js). São scripts comuns, carregados em ordem pelo index.html:
   as declarações de nível superior valem para todos os arquivos (não são módulos). O objeto World,
   com as funções públicas, é montado no fim, em js/world/index.js. */

/* ================= fachadas detalhadas da vila =================
   Cada prédio é desenhado num sprite alto (o personagem passa atrás do telhado) e
   só a parte de baixo bloqueia a passagem. Peças comuns: paredes de tábua, tijolo,
   pedra e toras; janelas, portas, telhados de água única e de duas águas, chaminés. */
const FX = {
  planksH(x, y, w, h, c) { R(x, y, w, h, c); for (let r = 0; r < h; r += 4) { R(x, y + r, w, 1, shade(c, 1.1)); R(x, y + r + 3, w, 1, shade(c, 0.78)); for (let k = (r * 7) % 19; k < w; k += 23) R(x + k, y + r, 1, 3, shade(c, 0.82)); } },
  planksV(x, y, w, h, c) { R(x, y, w, h, c); for (let k = 0; k < w; k += 4) { R(x + k, y, 1, h, shade(c, 0.76)); R(x + k + 1, y, 1, h, shade(c, 1.1)); } for (let k = 2; k < w; k += 8) R(x + k, y + 2 + (k * 5) % Math.max(1, h - 4), 1, 2, shade(c, 0.86)); },
  brick(x, y, w, h, c) {
    R(x, y, w, h, c);
    for (let r = 0; r < h; r += 4) { R(x, y + r + 3, w, 1, shade(c, 0.68)); for (let k = ((r / 4) % 2) * 4; k < w; k += 8) { R(x + k, y + r, 1, 3, shade(c, 0.68)); if ((k + r) % 3 === 0) R(x + k + 2, y + r, 4, 1, shade(c, 1.14)); } }
  },
  stone(x, y, w, h) {
    R(x, y, w, h, '#7e776a');
    for (let r = 0; r < h; r += 4) for (let k = ((r / 4) % 2) * 3; k < w; k += 7) { const ww = Math.min(6, x + w - (x + k)); if (ww <= 0) continue; R(x + k, y + r, ww, 3, ['#a8a090', '#9a9284', '#b4ac9c'][(k + r) % 3]); R(x + k, y + r, ww, 1, '#c8c0b0'); }
  },
  logs(x, y, w, h, c) {
    for (let r = 0; r < h; r += 5) {
      R(x, y + r, w, 5, c); R(x, y + r, w, 1, shade(c, 1.25)); R(x, y + r + 4, w, 1, shade(c, 0.58)); for (let k = (r * 3) % 13; k < w; k += 17) R(x + k, y + r + 2, 4, 1, shade(c, 0.8));
      [x - 3, x + w - 1].forEach(ex => { R(ex, y + r, 4, 5, OUT); R(ex + 1, y + r + 1, 2, 3, '#d8b078'); R(ex + 1, y + r + 2, 1, 1, '#a8783a'); });
    }
  },
};
/* Janela: moldura, vidro com reflexo, travessas, peitoril; opções: venezianas, floreira, cortina, arco. Acende à noite. */
function win(x, y, w, h, o = {}) {
  const fr = o.frame || '#f4f0e4';
  if (o.shutters) [x - 5, x + w + 1].forEach(sx => { R(sx, y - 1, 4, h + 2, OUT); R(sx + 1, y, 2, h, o.shutters); R(sx + 1, y, 2, 1, shade(o.shutters, 1.3)); for (let i = 2; i < h - 1; i += 3) R(sx + 1, y + i, 2, 1, shade(o.shutters, 0.68)); });
  R(x - 1, y - 1, w + 2, h + 2, OUT); R(x, y, w, h, fr);
  R(x + 1, y + 1, w - 2, h - 2, '#4f98cc'); R(x + 1, y + 1, w - 2, 2, '#8ccaf0'); R(x + 2, y + 3, 1, Math.max(1, h - 6), '#bfe4ff');
  if (o.inside) o.inside(x + 1, y + 1, w - 2, h - 2);
  if (o.curtain) { R(x + 1, y + 1, 2, h - 3, o.curtain); R(x + w - 3, y + 1, 2, h - 3, o.curtain); R(x + 1, y + 1, w - 2, 1, shade(o.curtain, 0.8)); }
  if (!o.noBars) { R(x + (w >> 1), y + 1, 1, h - 2, fr); if (h > 9) R(x + 1, y + (h >> 1), w - 2, 1, fr); }
  if (o.arch) { R(x - 1, y - 3, w + 2, 2, OUT); R(x, y - 2, w, 1, fr); R(x + 1, y - 4, w - 2, 1, OUT); }
  R(x - 2, y + h, w + 4, 2, OUT); R(x - 1, y + h, w + 2, 1, shade(fr, 0.86));
  if (o.box) {
    R(x - 2, y + h + 2, w + 4, 4, OUT); R(x - 1, y + h + 2, w + 2, 3, o.boxColor || '#8a5a32'); R(x - 1, y + h + 2, w + 2, 1, shade(o.boxColor || '#8a5a32', 1.25));
    const fl = o.flowers || ['#ff7088', '#ffe066', '#ffffff'];
    for (let i = 0; i < w + 1; i += 2) { if (paintSeason === 3) { R(x - 1 + i, y + h, 2, 1, '#f4f8fc'); continue; } R(x - 1 + i, y + h + 1, 1, 1, '#2f7028'); R(x - 1 + i, y + h, 1, 1, paintSeason === 2 ? '#c8781e' : fl[(i >> 1) % fl.length]); }
  }
  cur.lights.push({ kind: 'win', x: x + 1, y: y + 1, w: w - 2, h: h - 2 });
}
/* Porta com batente, almofadas, maçaneta e degrau; opções: vidro, dupla, arco. Devolve o centro. */
function door(cx, by, w, h, c, o = {}) {
  const x = Math.round(cx - w / 2), y = by - h;
  if (o.arch) { R(x - 1, y - 4, w + 2, 2, OUT); R(x + 1, y - 5, w - 2, 1, OUT); R(x, y - 3, w, 2, o.frame || '#e8dcc0'); }
  R(x - 2, y - 2, w + 4, h + 2, OUT); R(x - 1, y - 1, w + 2, h + 1, o.frame || '#e8dcc0');
  R(x, y, w, h, c); R(x, y, 1, h, shade(c, 1.3));
  if (o.double) { R(Math.round(cx), y, 1, h, shade(c, 0.55)); [x + 2, Math.round(cx) + 2].forEach(px => { R(px, y + 2, Math.floor(w / 2) - 4, (h >> 1) - 3, shade(c, 0.84)); R(px, y + (h >> 1) + 1, Math.floor(w / 2) - 4, (h >> 1) - 3, shade(c, 0.84)); }); }
  else { R(x + 2, y + 2, w - 4, (h >> 1) - 3, shade(c, 0.84)); R(x + 2, y + (h >> 1) + 1, w - 4, (h >> 1) - 3, shade(c, 0.84)); }
  if (o.glass) { const gw = o.double ? Math.floor(w / 2) - 4 : w - 4; [x + 2, o.double ? Math.round(cx) + 2 : -1].forEach(px => { if (px < 0) return; R(px, y + 2, gw, 7, '#8ccaf0'); R(px, y + 2, gw, 1, '#d8f0ff'); R(px + 1, y + 4, 1, 3, '#d8f0ff'); }); }
  R(o.double ? Math.round(cx) - 2 : x + w - 3, y + (h >> 1), 1, 2, '#ffd75e'); if (o.double) R(Math.round(cx) + 1, y + (h >> 1), 1, 2, '#ffd75e');
  R(x - 3, by, w + 6, 2, '#c8c0b0'); R(x - 3, by, w + 6, 1, '#e0d8c8'); R(x - 3, by + 2, w + 6, 1, '#807868');
  return cx;
}
/* Telhado de uma água em perspectiva (beiral à frente). */
function roofSlope(x, y, w, h, roof, o = {}) {
  for (let r = 0; r < h; r++) {
    const inset = Math.round((1 - r / h) * 4) - 3, x0 = x + inset, ww = w - inset * 2;
    R(x0 - 1, y + r, ww + 2, 1, OUT);
    for (let c = 0; c < ww; c++) {
      const band = Math.floor(r / 4), seam = (c + inset + band * 3) % 6 === 0, edge = r % 4 === 3;
      g.fillStyle = SC(edge ? shade(roof, 0.64) : seam ? shade(roof, 0.8) : r % 4 === 0 ? shade(roof, 1.16) : roof);
      if (o.moss && ((c * 7 + r * 13) % 29 === 0 || (c * 3 + r * 5) % 37 === 0)) g.fillStyle = SC('#58884a');
      g.fillRect(x0 + c, y + r, 1, 1);
    }
  }
  R(x + 1, y - 1, w - 2, 1, OUT); R(x + 1, y, w - 2, 2, shade(roof, 1.32));
  R(x - 4, y + h, w + 8, 1, OUT); R(x - 3, y + h - 1, w + 6, 1, o.trim || shade(roof, 0.5));
  snowCap(x - 2, y, w + 4, Math.max(5, Math.round(h * 0.45)));
}
/* Telhado de duas águas visto de frente (empena triangular com parede própria). */
function roofGable(x, y, w, h, roof, face, o = {}) {
  const cx = x + w / 2, eave = o.eave == null ? 4 : o.eave, t = o.t || 7;
  for (let r = 0; r <= h; r++) {
    const hw = (r + 1) / (h + 1) * (w / 2 + eave), xl = Math.round(cx - hw), xr = Math.round(cx + hw);
    R(xl - 1, y + r, xr - xl + 2, 1, OUT);
    for (let px = xl; px < xr; px++) { const seam = (px + Math.floor(r / 3) * 2) % 5 === 0; g.fillStyle = SC(r % 3 === 2 ? shade(roof, 0.7) : seam ? shade(roof, 0.84) : (px - xl < 2 || xr - px <= 2) ? shade(roof, 1.2) : roof); g.fillRect(px, y + r, 1, 1); }
    if (paintSeason === 3) { R(xl, y + r, Math.min(3, xr - xl), 1, '#f4f8fc'); R(xr - 3, y + r, 3, 1, '#f4f8fc'); }
    const ih = hw - t; if (ih > 1 && r < h) {
      const il = Math.round(cx - ih), ir = Math.round(cx + ih);
      R(il - 1, y + r, ir - il + 2, 1, OUT); R(il, y + r, ir - il, 1, r % 4 === 3 ? shade(face, 0.8) : face);
    }
  }
  R(Math.round(cx - w / 2 - eave) - 1, y + h + 1, w + eave * 2 + 2, 1, OUT);
  if (o.vent) { const vy = y + Math.round(h * 0.55); R(cx - 4, vy - 1, 8, 8, OUT); R(cx - 3, vy, 6, 6, o.ventColor || '#e8dcc0'); if (o.vent === 'round') { R(cx - 2, vy + 1, 4, 4, '#4f98cc'); R(cx - 2, vy + 1, 2, 1, '#bfe4ff'); cur.lights.push({ kind: 'win', x: cx - 2, y: vy + 1, w: 4, h: 4 }); } else for (let i = 0; i < 6; i += 2) R(cx - 3, vy + i, 6, 1, shade(o.ventColor || '#e8dcc0', 0.6)); }
  if (paintSeason === 3) { R(cx - 2, y, 4, 2, '#ffffff'); }
}
function chimney(x, y, h, c = '#a09088') {
  R(x - 1, y - 1, 8, h + 1, OUT); FX.brick(x, y, 6, h, c); R(x - 2, y - 3, 10, 3, OUT); R(x - 1, y - 2, 8, 1, '#d0c8c0');
  if (paintSeason === 3) R(x - 1, y - 3, 8, 1, '#ffffff');
  if (cur.smokes) cur.smokes.push([x + 2, y - 4]);
}
/* Fonte das placas grandes: letras de 8×11 com traço de 2 px, desenhadas uma a uma
   (nada de esticar uma fonte pequena), com 2 px entre as letras. */
const SIGN_FONT = { h: 11, gap: 2, g: {
  C: ['.######.', '########', '##....##', '##......', '##......', '##......', '##......', '##......', '##....##', '########', '.######.'],
  E: ['########', '########', '##......', '##......', '######..', '######..', '##......', '##......', '##......', '########', '########'],
  L: ['##......', '##......', '##......', '##......', '##......', '##......', '##......', '##......', '##......', '########', '########'],
  S: ['.######.', '########', '##....##', '##......', '#######.', '.#######', '......##', '......##', '##....##', '########', '.######.'],
  T: ['########', '########', '...##...', '...##...', '...##...', '...##...', '...##...', '...##...', '...##...', '...##...', '...##...'],
} };
const signWidth = str => [...str].reduce((a, ch) => a + (SIGN_FONT.g[ch] ? SIGN_FONT.g[ch][0].length : 4), 0) + SIGN_FONT.gap * (str.length - 1);
function signText(x, y, str, c) {
  let cx = x;
  [...str].forEach(ch => { const gl = SIGN_FONT.g[ch]; if (gl) { gl.forEach((row, j) => [...row].forEach((v, i) => { if (v === '#') R(cx + i, y + j, 1, 1, c); })); cx += gl[0].length + SIGN_FONT.gap; } else cx += 4 + SIGN_FONT.gap; });
}
/* Letreiro com letras de pixel em escala 2 (bem legível). */
function bigText(x, y, str, c) {
  [...str].forEach((ch, i) => { const gl = GLYPH[ch]; if (!gl) return; for (let k = 0; k < 15; k++) if (gl[k] === '1') R(x + i * 8 + (k % 3) * 2, y + Math.floor(k / 3) * 2, 2, 2, c); });
}
function sideTrim(x, y, h, c) { R(x - 1, y, 4, h, OUT); R(x, y, 2, h, c); R(x, y, 1, h, shade(c, 1.25)); }
function crate(x, y, fruit) { R(x - 1, y - 1, 16, 11, OUT); R(x, y, 14, 9, '#b88448'); R(x, y + 4, 14, 1, '#7a5028'); R(x, y, 14, 1, '#d8a868'); for (let i = 1; i < 13; i += 3) { R(x + i, y - 3, 3, 3, OUT); R(x + i, y - 3, 2, 2, fruit[(i / 3 | 0) % fruit.length]); } }
function potPlant(x, y, c = '#3f9648') { R(x - 1, y - 6, 8, 7, OUT); R(x, y - 5, 6, 5, '#b0603a'); R(x, y - 5, 6, 1, '#d08050'); blob(x + 3, y - 9, 4, OUT); blob(x + 3, y - 9, 3, paintSeason === 3 ? '#9aa8b4' : c); if (paintSeason === 0) R(x + 2, y - 11, 1, 1, '#ff9ec0'); }
function lantern(x, y) { R(x, y, 1, 3, OUT); R(x - 2, y + 3, 5, 6, OUT); R(x - 1, y + 4, 3, 4, '#ffe89a'); R(x - 2, y + 9, 5, 1, OUT); cur.lights.push({ kind: 'glow', x, y: y + 6, r: 16 }); }
function picketFence(x0, x1, y, colors) {
  R(x0, y - 5, x1 - x0 + 3, 2, OUT); R(x0, y - 4, x1 - x0 + 3, 1, '#f4f0e4');
  for (let x = x0, i = 0; x <= x1; x += 4, i++) { const c = colors ? colors[i % colors.length] : '#f4f0e4'; R(x - 1, y - 9, 4, 10, OUT); R(x, y - 8, 2, 8, c); R(x, y - 9, 2, 1, OUT); R(x, y - 8, 1, 8, shade(c, 1.15)); if (paintSeason === 3) R(x - 1, y - 10, 4, 1, '#ffffff'); }
}
/* Sprite do prédio: desenha em coordenadas do mundo, num canvas próprio. */
function bldSprite(x0, y0, w, h, base, fn, fence) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const prev = g; g = c.getContext('2d'); g.translate(-x0, -y0);
  let out; try { out = fn(); } finally { g = prev; }
  cur.sprites.push(fence ? { img: c, x: x0, y: y0, base, fence: true } : { img: c, x: x0, y: y0, base });
  return out;
}

/* ---------- Armazém CELESTE: comércio no térreo, casa de Dona Celeste em cima ---------- */
function paintArmazem(o) {
  const { x, w } = o, b = o.y + o.h, cx = x + w / 2;
  chimney(x + 78, 14, 18, '#a86a4a');
  roofSlope(x, 22, w, 32, '#a8402e', { trim: '#5a1a12' });
  // empena central com janela redonda (a casa de cima)
  roofGable(cx - 22, 10, 44, 30, '#8e3424', '#f2e6cc', { vent: 'round', t: 6 });
  // andar de cima: tábuas creme, cantoneiras, três janelas com floreira e cortina
  R(x - 1, 53, w + 2, 44, OUT); FX.planksH(x, 54, w, 42, '#efe2c4'); R(x, 54, w, 3, shade('#efe2c4', 0.7));
  sideTrim(x, 54, 42, '#6a4426'); sideTrim(x + w - 2, 54, 42, '#6a4426');
  [x + 12, cx - 6, x + w - 24].forEach(wx => win(wx, 63, 12, 14, { shutters: '#3f7a4a', box: true, curtain: '#e8a0a8', flowers: ['#ff7088', '#ffe066', '#c8a0ff'] }));
  // térreo: comércio de madeira pintada, vitrines com toldos listrados, porta dupla de vidro
  R(x - 1, 113, w + 2, b - 112, OUT); FX.planksV(x, 114, w, b - 114, '#5f8f6a'); R(x, 114, w, 2, shade('#5f8f6a', 0.6));
  sideTrim(x, 114, b - 114, '#4a3020'); sideTrim(x + w - 2, 114, b - 114, '#4a3020');
  [[x + 8, 26], [x + w - 34, 26]].forEach(([vx, vw]) => {
    for (let i = 0; i < vw + 4; i++) { R(vx - 2 + i, 118, 1, 5, Math.floor(i / 3) % 2 ? '#f4ecd8' : '#c8402e'); R(vx - 2 + i, 123, 1, 1, Math.floor(i / 3) % 2 ? '#d8ccb0' : '#8a2a1a'); }
    R(vx - 3, 117, vw + 6, 1, OUT); R(vx - 3, 124, vw + 6, 1, OUT);
    win(vx, 126, vw, 12, { frame: '#e8dcc0', noBars: true, inside: (ix, iy, iw, ih) => { R(ix, iy + ih - 4, iw, 1, '#8a5e36'); R(ix, iy + 5, iw, 1, '#8a5e36'); for (let i = 1; i < iw - 2; i += 4) { R(ix + i, iy + ih - 7, 3, 3, ['#e04a3a', '#f0a020', '#58b858', '#ffe066'][(i >> 2) % 4]); R(ix + i + 1, iy + 1, 2, 4, ['#c89858', '#f4f0e4', '#e8a0a8'][(i >> 2) % 3]); } } });
  });
  // letreiro CELESTE: faixa contínua de uma ponta à outra da fachada, entre o comércio e a casa de cima
  const bx0 = x - 4, bw = w + 8, by0 = 92, bh = 24;                               // moldura de madeira (contorno incluído)
  R(bx0, by0, bw, bh, OUT); R(bx0 + 1, by0 + 1, bw - 2, bh - 2, '#5a3a22'); R(bx0 + 1, by0 + 1, bw - 2, 1, '#8a5a32'); R(bx0 + 1, by0 + bh - 2, bw - 2, 1, '#3a2414');
  for (let i = bx0 + 3; i < bx0 + bw - 3; i += 5) R(i, by0 + bh - 3, 2, 1, '#4a2e1a');
  const px0 = bx0 + 3, pw = bw - 6, py0 = by0 + 3, ph = bh - 6;                   // fundo bege
  R(px0, py0, pw, ph, '#f6e6b8'); R(px0, py0, pw, 1, '#fff6d8'); R(px0, py0 + ph - 1, pw, 1, '#d8c490');
  [[px0 + 2, py0 + 2], [px0 + pw - 4, py0 + 2], [px0 + 2, py0 + ph - 4], [px0 + pw - 4, py0 + ph - 4]].forEach(([nx, ny]) => R(nx, ny, 2, 2, '#b89868'));   // pregos
  const tw = signWidth('CELESTE');                                               // centralizado pela largura real do texto
  signText(Math.round(px0 + (pw - tw) / 2), py0 + Math.floor((ph - SIGN_FONT.h) / 2), 'CELESTE', '#6a1c10');
  FX.stone(x, b - 4, w, 4);
  const dc = door(cx, b, 18, 24, '#7a4a2a', { double: true, glass: true, frame: '#f0e0b8' });
  lantern(cx - 15, 119); lantern(cx + 14, 119);
  crate(x + 4, b - 8, ['#e04a3a', '#58b858', '#f0a020']); crate(x + w - 18, b - 8, ['#ffe066', '#e88a20', '#9ac850']);
  potPlant(cx - 15, b, '#3f9648'); potPlant(cx + 10, b, '#2f8a40');
  return dc;
}
/* ---------- Casa de Seu Honório: carpinteiro aposentado (madeira escura, pedra, bancada) ---------- */
function paintHonorio(o) {
  const { x, w } = o, b = o.y + o.h, cx = x + w / 2;
  chimney(x + 52, 34, 24, '#9a8a7a');
  roofGable(x, 40, w, 52, '#5a5a6e', '#a07a52', { vent: 'slats', ventColor: '#c8a070', t: 8 });
  R(x - 1, 93, w + 2, b - 92, OUT); FX.planksV(x, 94, w, b - 94, '#7a5a3a'); R(x, 94, w, 3, shade('#7a5a3a', 0.6));
  FX.stone(x, b - 8, w, 8);
  win(x + 8, 104, 11, 12, { shutters: '#4a3020', frame: '#d8c8a8' }); win(x + w - 19, 104, 11, 12, { shutters: '#4a3020', frame: '#d8c8a8' });
  // alpendre sobre a porta, com dois esteios
  R(cx - 15, 98, 30, 5, OUT); for (let i = 0; i < 28; i++) R(cx - 14 + i, 99, 1, 3, i % 3 ? '#6a6a7e' : '#4a4a5a'); snowCap(cx - 15, 97, 30, 3);
  [cx - 13, cx + 11].forEach(px => { R(px - 1, 103, 4, b - 103, OUT); R(px, 103, 2, b - 103, '#c8a070'); });
  const dc = door(cx, b, 12, 18, '#5a3a22', { frame: '#c8a070' });
  // bancada de carpinteiro e tábuas encostadas
  R(x - 22, b - 13, 20, 4, OUT); R(x - 21, b - 12, 18, 2, '#c89858'); R(x - 20, b - 9, 2, 9, '#6a4426'); R(x - 6, b - 9, 2, 9, '#6a4426'); R(x - 16, b - 16, 6, 3, '#8a8a98'); R(x - 9, b - 15, 4, 2, '#c8483a');
  [[x + w + 3, 0], [x + w + 7, 2]].forEach(([px, k]) => { R(px - 1, b - 30 + k, 4, 30 - k, OUT); R(px, b - 29 + k, 2, 29 - k, '#d8a868'); });
  return dc;
}
/* ---------- Casa de Bia: amarela, varanda, catavento de galo, horta com cerquinha ---------- */
function paintBia(o) {
  const { x, w } = o, b = o.y + o.h, cx = x + w / 2;
  chimney(x + 10, 214, 14, '#b07a5a');
  roofSlope(x, 216, w, 32, '#4a8a5a', { trim: '#c8402e' });
  // água-furtada com janelinha
  R(cx - 10, 222, 20, 18, OUT); R(cx - 9, 228, 18, 12, '#f6dc8a'); for (let r = 0; r < 7; r++) R(cx - 10 + r, 222 + r - 1, 20 - r * 2, 1, r % 2 ? '#3f7a4e' : '#58a06a');
  win(cx - 4, 230, 8, 8, { frame: '#ffffff' });
  // catavento de galo
  R(cx + 18, 202, 1, 16, OUT); R(cx + 14, 205, 9, 1, OUT); R(cx + 16, 199, 5, 3, '#e8a020'); R(cx + 20, 197, 2, 2, '#c8402e'); R(cx + 15, 198, 2, 2, '#e8a020');
  R(x - 1, 247, w + 2, b - 246, OUT); FX.planksH(x, 248, w, b - 248, '#f0d27a'); R(x, 248, w, 3, shade('#f0d27a', 0.7));
  sideTrim(x, 248, b - 248, '#ffffff'); sideTrim(x + w - 2, 248, b - 248, '#ffffff');
  win(x + 8, 255, 12, 12, { box: true, boxColor: '#c8402e', flowers: ['#ff7088', '#ffffff', '#ffe066'], curtain: '#ffffff' });
  win(x + w - 20, 255, 12, 12, { box: true, boxColor: '#c8402e', flowers: ['#ffe066', '#ff7088', '#ffffff'], curtain: '#ffffff' });
  // varanda coberta com degraus
  R(x - 4, 272, w + 8, 4, OUT); for (let i = 0; i < w + 6; i++) R(x - 3 + i, 273, 1, 2, i % 4 < 2 ? '#c8402e' : '#ffffff'); snowCap(x - 4, 271, w + 8, 3);
  [x - 1, x + 22, x + w - 24, x + w - 3].forEach(px => { R(px - 1, 276, 4, b - 276, OUT); R(px, 276, 2, b - 276, '#ffffff'); });
  R(x - 2, b - 3, w + 4, 4, '#c89858'); R(x - 2, b - 3, w + 4, 1, '#e8c088');
  const dc = door(cx, b - 2, 12, 18, '#c8683a', { frame: '#ffffff', glass: true });
  // galinha de madeira na varanda e casinha de passarinho
  R(x + 4, b - 12, 7, 6, OUT); R(x + 5, b - 11, 5, 4, '#ffffff'); R(x + 9, b - 14, 2, 2, '#e04a3a'); R(x + 11, b - 10, 1, 1, '#f0a020');
  const hx = x + w + 14; R(hx, b - 28, 1, 26, OUT); R(hx - 4, b - 36, 9, 8, OUT); R(hx - 3, b - 35, 7, 6, '#58a06a'); R(hx - 4, b - 38, 9, 2, '#c8402e'); R(hx, b - 33, 2, 2, OUT);
  return dc;
}
/* ---------- Casa de Iara: lilás, sótão-ateliê com cavalete, cerca colorida e respingos de tinta ---------- */
function paintIara(o) {
  const { x, w } = o, b = o.y + o.h, cx = x + w / 2;
  chimney(x + 54, 228, 12, '#b0a0c0');
  roofGable(x, 230, w, 34, '#7a4ac8', '#f4eefc', { t: 7 });
  // janela do sótão-ateliê com cavalete e tela à mostra
  win(cx - 6, 246, 12, 11, { frame: '#ffffff', noBars: true, inside: (ix, iy) => { R(ix + 2, iy + 2, 1, 7, '#6a4426'); R(ix + 7, iy + 2, 1, 7, '#6a4426'); R(ix + 1, iy + 1, 8, 5, '#fff8ec'); R(ix + 2, iy + 2, 3, 2, '#9ac8e8'); R(ix + 4, iy + 3, 4, 2, '#78b04c'); R(ix + 6, iy + 2, 2, 1, '#f2d24a'); } });
  R(x - 1, 263, w + 2, b - 262, OUT); FX.planksV(x, 264, w, b - 264, '#e6dcf6'); R(x, 264, w, 3, shade('#e6dcf6', 0.72));
  sideTrim(x, 264, b - 264, '#9a74d8'); sideTrim(x + w - 2, 264, b - 264, '#9a74d8');
  win(x + 8, 270, 12, 12, { shutters: '#e0a23a', box: true, boxColor: '#5a58b8', flowers: ['#ff7088', '#ffe066', '#3f86d0', '#78b04c'] });
  win(x + w - 20, 270, 12, 12, { shutters: '#e0a23a', box: true, boxColor: '#5a58b8', flowers: ['#c8a0ff', '#ff9ec0', '#ffe066', '#58b858'] });
  const dc = door(cx, b, 12, 18, '#3f86d0', { arch: true, frame: '#ffffff' });
  // paleta pendurada ao lado da porta e respingos de tinta no degrau
  R(cx + 9, 278, 10, 7, OUT); R(cx + 10, 279, 8, 5, '#e8c890'); [['#e04a5a', 11, 280], ['#3f86d0', 14, 280], ['#f2d24a', 16, 282], ['#78b04c', 12, 282]].forEach(([c, dx, dy]) => R(cx + dx, dy, 2, 1, c));
  [['#e04a5a', -9, 1], ['#3f86d0', 6, 2], ['#f2d24a', -2, 2], ['#78b04c', 9, 1]].forEach(([c, dx, dy]) => R(cx + dx, b + dy, 2, 1, c));
  // cerquinha de estacas pintadas de cores diferentes, com canteiro
  picketFence(x - 26, x - 6, b + 2, ['#e04a5a', '#f2d24a', '#3f86d0', '#78b04c', '#c8a0ff', '#e0a23a']);
  for (let i = 0; i < 18; i += 3) { if (paintSeason === 3) continue; R(x - 24 + i, b - 6, 1, 3, '#2f7028'); R(x - 24 + i, b - 7, 2, 2, ['#ff7088', '#ffe066', '#c8a0ff'][i % 3]); }
  return dc;
}
/* ---------- Escola: tijolinho, frontão com relógio, torre do sino, escadaria e mastro ---------- */
function paintEscola(o) {
  const { x, w } = o, b = o.y + o.h, cx = x + w / 2;
  // torre do sino
  R(cx - 7, 470, 14, 16, OUT); R(cx - 6, 476, 12, 10, '#f4f0e4'); R(cx - 4, 478, 8, 7, '#3a2a20'); R(cx - 2, 479, 4, 4, '#e8c060'); R(cx - 1, 483, 2, 1, '#a88030');
  for (let r = 0; r < 7; r++) R(cx - 8 + r, 470 + r - 2, 16 - r * 2, 1, r % 2 ? '#3f6a4a' : '#2f5a3a'); R(cx, 466, 1, 3, OUT);
  roofSlope(x, 486, w, 26, '#3f6a4a', { trim: '#f4f0e4' });
  roofGable(cx - 20, 484, 40, 22, '#355e40', '#f4f0e4', { t: 5, eave: 3 });
  R(cx - 5, 493, 10, 10, OUT); R(cx - 4, 494, 8, 8, '#ffffff'); R(cx, 495, 1, 4, OUT); R(cx, 498, 3, 1, OUT);   // relógio
  R(x - 1, 511, w + 2, b - 510, OUT); FX.brick(x, 512, w, b - 512, '#b8583a'); R(x, 512, w, 3, '#7a3424');
  sideTrim(x, 512, b - 512, '#f4f0e4'); sideTrim(x + w - 2, 512, b - 512, '#f4f0e4'); FX.stone(x, b - 5, w, 5);
  [x + 7, x + 20, x + w - 28, x + w - 15].forEach(wx => win(wx, 532, 8, 14, { frame: '#ffffff', arch: true }));
  R(cx - 17, 514, 34, 12, OUT); R(cx - 16, 515, 32, 10, '#2f5a3a'); R(cx - 15, 516, 30, 8, '#f8f0dc'); pixelText(cx - 11, 517, 'ESCOLA', '#2f5a3a');
  const dc = door(cx, b - 2, 16, 20, '#3f7a4a', { double: true, arch: true, frame: '#ffffff' });
  R(cx - 14, b - 2, 28, 3, '#c8c0b0'); R(cx - 14, b - 2, 28, 1, '#e8e0d0'); R(cx - 16, b + 1, 32, 2, '#a8a090');
  // mastro com bandeirola verde e amarela
  R(x - 16, 486, 2, b - 486, OUT); R(x - 15, 486, 1, b - 486, '#d8d8e0'); R(x - 13, 488, 12, 7, OUT); R(x - 12, 489, 10, 5, '#3f9a52'); R(x - 9, 490, 4, 3, '#f2d24a');
  return dc;
}
/* ---------- Cabana de Tomé: toras, telhado com musgo, chaminé de pedra, lenha e vara de pesca ---------- */
function paintTome(o) {
  const { x, w } = o, b = o.y + o.h;
  R(x + 4, 38, 10, 32, OUT); FX.stone(x + 5, 39, 8, 30); R(x + 3, 36, 12, 3, OUT); if (cur.smokes) cur.smokes.push([x + 8, 34]);
  roofSlope(x - 2, 48, w + 4, 38, '#4a6a4a', { moss: true, trim: '#2a3a22' });
  R(x - 1, 85, w + 2, b - 84, OUT); FX.logs(x, 86, w, b - 86, '#8a5e36');
  win(x + 8, 96, 10, 10, { frame: '#c8a070', curtain: '#a8c870' }); win(x + w - 18, 96, 10, 10, { frame: '#c8a070' });
  const dc = door(x + o.doorX, b, 12, 18, '#5a3a22', { frame: '#a07a52' });
  lantern(x + o.doorX + 10, 104);
  // pilha de lenha, balde e vara de pesca encostada
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4 - r; c++) { const lx = x + w + 6 + c * 5 + r * 2, ly = b - 6 - r * 5; R(lx - 1, ly - 1, 6, 6, OUT); R(lx, ly, 4, 4, '#a8743e'); R(lx + 1, ly + 1, 2, 2, '#d8b078'); }
  R(x - 10, b - 7, 7, 7, OUT); R(x - 9, b - 6, 5, 5, '#8a8a98'); R(x - 8, b - 6, 3, 1, '#4f98cc');
  for (let i = 0; i < 26; i++) R(x - 4 + Math.round(i * 0.15), b - 2 - i, 1, 1, i > 20 ? '#e8e0c0' : '#c8a060');
  return dc;
}

/* Casa vista de cima, de frente. opts: x, y (canto de cima), w, h, cores. */
function house(o) {
  const { x, y, w, h } = o;
  const rh = Math.round(h * (o.roofRatio || 0.5)), wy = y + rh, wh = h - rh;
  const wall = o.wall || '#ece2c8', roof = o.roof || '#c2523a';
  g.fillStyle = 'rgba(20,40,20,.25)'; g.fillRect(x + 3, y + h, w + 2, 3); g.fillRect(x + w, wy + 4, 5, wh - 2);
  // parede
  R(x - 1, wy - 1, w + 2, wh + 2, OUT); R(x, wy, w, wh, wall);
  if (o.brick) {
    for (let r = 0; r < wh; r += 3) { R(x, wy + r + 2, w, 1, shade(wall, 0.78));
      for (let c = (r / 3 % 2) * 3; c < w; c += 6) R(x + c, wy + r, 1, 2, shade(wall, 0.78)); }
  } else {
    for (let r = 3; r < wh - 4; r += 3) R(x, wy + r, w, 1, shade(wall, 0.92));      // tábuas da parede
    R(x, wy + wh - 4, w, 4, shade(wall, 0.86)); R(x, wy + wh - 4, w, 1, shade(wall, 0.78));
    if (o.timber !== false) { const t = o.timber || '#7a5a3a'; R(x, wy, 2, wh, t); R(x + w - 2, wy, 2, wh, t); R(x, wy + Math.floor(wh / 2) - 1, w, 1, shade(wall, 0.9)); }
  }
  R(x, wy, w, 3, shade(wall, 0.72));                       // sombra do beiral
  // telhado em perspectiva: mais estreito na cumeeira
  for (let r = 0; r < rh; r++) {
    const inset = Math.round((1 - r / rh) * 4) - 3;        // de +1 a -3 → beiral avança 3px
    const x0 = x + inset, ww = w - inset * 2;
    R(x0 - 1, y + r, ww + 2, 1, OUT);
    for (let c = 0; c < ww; c++) {
      const band = Math.floor(r / 4), seam = (c + inset + band * 3) % 6 === 0, edge = r % 4 === 3;
      g.fillStyle = o.flatRoof ? (c % 4 === 0 ? shade(roof, 0.82) : roof)
        : edge ? shade(roof, 0.66) : seam ? shade(roof, 0.8) : (r % 4 === 0 ? shade(roof, 1.18) : roof);
      g.fillRect(x0 + c, y + r, 1, 1);
    }
  }
  R(x + 1, y - 1, w - 2, 1, OUT); R(x + 1, y, w - 2, 2, shade(roof, 1.3));
  snowCap(x - 2, y, w + 4, Math.max(5, Math.round(rh * 0.45)));
  R(x - 4, y + rh, w + 8, 1, OUT);
  if (o.chimney) { const cx = x + o.chimney; R(cx - 1, y - 7, 8, 12, OUT); R(cx, y - 6, 6, 10, '#a09088'); R(cx, y - 6, 6, 2, '#c8bab0'); R(cx + 4, y - 4, 2, 8, '#807068'); }
  // janelas
  (o.windows || []).forEach(([wx, wyy, ww = 9, whh = 9]) => {
    const X = x + wx, Y = wy + wyy;
    if (cur.lights) cur.lights.push({ kind: 'win', x: X + 1, y: Y + 1, w: ww - 2, h: whh - 2 });
    R(X - 1, Y - 1, ww + 2, whh + 2, OUT); R(X, Y, ww, whh, '#f4f0e4');
    R(X + 1, Y + 1, ww - 2, whh - 2, '#6ab4e8'); R(X + 1, Y + 1, ww - 2, 2, '#a8dcff');
    R(X + Math.floor(ww / 2), Y + 1, 1, whh - 2, '#f4f0e4'); R(X + 1, Y + Math.floor(whh / 2), ww - 2, 1, '#f4f0e4');
    if (o.flowerBox) { R(X - 1, Y + whh, ww + 2, 2, '#7a4a2a'); for (let i = 0; i < ww; i += 2) R(X + i, Y + whh - 1, 1, 1, i % 4 ? '#ff7088' : '#ffe066'); }
    if (o.shutters) { R(X - 3, Y - 1, 2, whh + 2, o.shutters); R(X + ww + 1, Y - 1, 2, whh + 2, o.shutters); }
  });
  // porta
  if (o.door !== false) {
    const dw = o.doorW || 10, dx = x + (o.doorX != null ? o.doorX : Math.floor(w / 2) - dw / 2), dh = Math.min(16, wh - 3), dy = y + h - dh;
    R(dx - 1, dy - 1, dw + 2, dh + 1, OUT); R(dx, dy, dw, dh, o.door || '#8a5a34');
    R(dx, dy, 2, dh, shade(o.door || '#8a5a34', 1.25)); R(dx + Math.floor(dw / 2), dy, 1, dh, shade(o.door || '#8a5a34', 0.75));
    R(dx + dw - 3, dy + Math.floor(dh / 2), 1, 2, '#ffd75e');
    R(dx - 2, y + h, dw + 4, 2, '#b8b0a0'); R(dx - 2, y + h + 2, dw + 4, 1, '#807868');
    return dx + dw / 2;
  }
}

/* Casa da fazenda: madeira, telhado de telhas, varanda com toldo e degraus.
   (x, y) = canto de cima do telhado. Devolve o ponto em frente à porta. */
function farmhouse(x, y) {
  const w = 96, roofH = 44, wy = y + roofH, wallH = 36, by = wy + wallH, dx = x + w / 2;
  g.fillStyle = 'rgba(20,40,20,.25)'; g.fillRect(x + 4, by + 14, w, 3); g.fillRect(x + w + 1, wy + 4, 5, wallH + 10);
  // parede de tábuas horizontais
  R(x - 1, wy - 1, w + 2, wallH + 2, OUT);
  for (let r = 0; r < wallH; r += 4) {
    R(x, wy + r, w, 4, r % 8 ? '#b47c48' : '#a8703e'); R(x, wy + r + 3, w, 1, '#7a4e2a'); R(x, wy + r, w, 1, '#c8925a');
    for (let c = (r % 8 ? 9 : 22); c < w; c += 31) R(x + c, wy + r, 1, 3, '#7a4e2a');
    if (rand() < 0.5) R(x + 6 + Math.floor(rand() * (w - 12)), wy + r + 1, 2, 1, '#8a5a32');
  }
  R(x, wy, 3, wallH, '#6a4426'); R(x + w - 3, wy, 3, wallH, '#6a4426'); R(x, wy, w, 3, 'rgba(40,20,10,.35)');
  // janelas com venezianas verdes e floreiras
  [[x + 12, wy + 9], [x + w - 28, wy + 9]].forEach(([X, Y]) => {
    cur.lights.push({ kind: 'win', x: X + 2, y: Y + 2, w: 12, h: 9 });
    R(X - 1, Y - 1, 18, 15, OUT); R(X, Y, 16, 13, '#f2e6c8'); R(X + 2, Y + 2, 12, 9, '#ffd98a'); R(X + 2, Y + 2, 12, 3, '#fff0c0');
    R(X + 7, Y + 2, 2, 9, '#f2e6c8'); R(X + 2, Y + 6, 12, 1, '#f2e6c8');
    R(X - 5, Y - 1, 4, 15, OUT); R(X - 4, Y, 2, 13, '#4a8a5a'); R(X + 17, Y - 1, 4, 15, OUT); R(X + 18, Y, 2, 13, '#4a8a5a');
    R(X - 1, Y + 13, 18, 3, '#6a4426'); for (let i = 0; i < 16; i += 2) R(X + i, Y + 12, 2, 1, ['#ff7088', '#ffe066', '#ffffff', '#ff9ec0'][(i / 2) % 4]);
  });
  // porta de madeira com janelinha
  R(dx - 8, by - 24, 16, 24, OUT); R(dx - 7, by - 23, 14, 23, '#7a4422'); R(dx - 7, by - 23, 14, 2, '#9a5a30');
  R(dx - 5, by - 20, 10, 6, '#ffd98a'); R(dx - 1, by - 20, 1, 6, '#7a4422'); R(dx - 5, by - 12, 4, 9, '#6a3a1c'); R(dx + 1, by - 12, 4, 9, '#6a3a1c');
  R(dx + 4, by - 9, 2, 2, '#ffd75e');
  // lampião ao lado da porta
  R(dx + 12, by - 22, 5, 7, OUT); R(dx + 13, by - 21, 3, 5, '#ffe89a'); R(dx + 14, by - 23, 1, 2, OUT);
  // telhado de telhas com beiral e cumeeira
  for (let r = 0; r < roofH; r++) {
    const inset = Math.round((1 - r / roofH) * 7) - 5, x0 = x + inset, ww = w - inset * 2;
    R(x0 - 1, y + r, ww + 2, 1, OUT);
    for (let c = 0; c < ww; c++) {
      const band = Math.floor(r / 5), edge = r % 5 === 4, seam = (c + band * 4) % 8 === 0;
      g.fillStyle = edge ? '#5e2a1c' : seam ? '#7a3826' : r % 5 === 0 ? '#c0603e' : '#a24c32';
      g.fillRect(x0 + c, y + r, 1, 1);
    }
  }
  R(x - 1, y - 2, w + 2, 3, OUT); R(x, y - 1, w, 2, '#d0744c');
  snowCap(x - 3, y - 1, w + 6, 12);
  R(x - 6, wy, w + 12, 2, OUT); R(x - 5, wy, w + 10, 1, '#5e2a1c');
  cur.lights.push({ kind: 'glow', x: dx + 14, y: by - 19, r: 26 }, { kind: 'win', x: dx - 5, y: by - 20, w: 10, h: 6 }, { kind: 'win', x: dx - 5, y: y + 18, w: 10, h: 8 });
  // água-furtada no meio do telhado
  R(dx - 11, y + 12, 22, 18, OUT); R(dx - 10, y + 13, 20, 16, '#b47c48'); R(dx - 6, y + 17, 12, 10, '#f2e6c8'); R(dx - 5, y + 18, 10, 8, '#ffd98a'); R(dx, y + 18, 1, 8, '#f2e6c8');
  for (let r = 0; r < 8; r++) R(dx - 12 - (r >> 1) + 4, y + 6 + r, 16 + r - 0, 1, r === 7 ? '#5e2a1c' : '#a24c32');
  R(dx - 9, y + 5, 18, 1, OUT);
  // chaminé de pedra
  const cx = x + w - 22; R(cx - 1, y - 12, 12, 22, OUT); R(cx, y - 11, 10, 20, '#9a9088');
  for (let r = 0; r < 20; r += 4) for (let c = (r % 8 ? 0 : 3); c < 10; c += 6) R(cx + c, y - 11 + r, 1, 3, '#7a7068');
  R(cx - 2, y - 13, 14, 3, '#6a6058');
  // varanda: assoalho, toldo, colunas, guarda-corpo e degraus
  R(x + 3, by, w - 6, 13, OUT); R(x + 4, by, w - 8, 12, '#c89a62');
  for (let r = 0; r < 12; r += 3) R(x + 4, by + r + 2, w - 8, 1, '#a07848');
  R(x + 4, by, w - 8, 2, 'rgba(40,20,10,.3)');
  R(x + 8, wy + 1, w - 16, 5, OUT); R(x + 9, wy + 1, w - 18, 3, '#8a4a2e'); R(x + 9, wy + 1, w - 18, 1, '#b8603e');
  [x + 10, x + w - 13].forEach(px => { R(px - 1, wy + 5, 5, by - wy + 6, OUT); R(px, wy + 5, 3, by - wy + 5, '#e8dcc0'); R(px, wy + 5, 1, by - wy + 5, '#ffffff'); });
  [[x + 4, dx - 13], [dx + 13, x + w - 4]].forEach(([a, b]) => { R(a, by + 6, b - a, 2, OUT); R(a, by + 6, b - a, 1, '#e8dcc0'); for (let i = a + 3; i < b - 1; i += 5) R(i, by + 7, 1, 5, '#e8dcc0'); });
  R(dx - 12, by + 12, 24, 4, OUT); R(dx - 11, by + 12, 22, 3, '#b08050'); R(dx - 11, by + 12, 22, 1, '#d8a868');
  // vasos e barril
  [[x + 6, by + 1], [x + w - 12, by + 1]].forEach(([X, Y]) => { R(X, Y + 2, 6, 4, '#b0603a'); blob(X + 3, Y, 3, '#2f8a40'); R(X + 2, Y - 1, 1, 1, '#ff7088'); });
  return { x: dx, y: by + 10 };
}

/* Galinheiro: celeiro pequeno de madeira vermelha, com placa e portinhola para o cercado. */
function coopHouse(x, y) {
  const w = 84, roofH = 32, wy = y + roofH, wallH = 48, by = wy + wallH, dx = x + 42;
  g.fillStyle = 'rgba(20,40,20,.25)'; g.fillRect(x + 4, by, w, 3); g.fillRect(x + w, wy + 4, 5, wallH - 2);
  R(x - 1, wy - 1, w + 2, wallH + 2, OUT);
  for (let c = 0; c < w; c += 4) { R(x + c, wy, 4, wallH, c % 8 ? '#b0432e' : '#a03c28'); R(x + c + 3, wy, 1, wallH, '#7a2a1c'); }
  R(x, wy, w, 3, 'rgba(40,10,10,.35)'); R(x, by - 3, w, 3, '#7a2a1c');
  R(x, wy + 3, 2, wallH - 3, '#f2e6d0'); R(x + w - 2, wy + 3, 2, wallH - 3, '#f2e6d0');
  // janela redonda
  blob(x + 16, wy + 13, 6, OUT); blob(x + 16, wy + 13, 5, '#f2e6d0'); blob(x + 16, wy + 13, 3, '#ffd98a'); R(x + 16, wy + 9, 1, 8, '#f2e6d0');
  // placa com galinha sobre a porta
  R(dx - 13, wy + 3, 26, 11, OUT); R(dx - 12, wy + 4, 24, 9, '#f2e6c8');
  R(dx - 5, wy + 6, 7, 5, '#ffffff'); R(dx + 1, wy + 5, 3, 3, '#ffffff'); R(dx + 2, wy + 4, 1, 1, '#e04a3a'); R(dx + 4, wy + 6, 1, 1, '#f0a020'); R(dx - 6, wy + 6, 1, 2, '#d8d8c8'); R(dx + 2, wy + 6, 1, 1, OUT);
  R(dx - 3, wy + 11, 1, 1, '#f0a020'); R(dx, wy + 11, 1, 1, '#f0a020');
  // porta de celeiro (com X branco)
  const dh = 24, dw = 20, dy = by - dh;
  R(dx - dw / 2 - 1, dy - 1, dw + 2, dh + 1, OUT); R(dx - dw / 2, dy, dw, dh, '#8a3424');
  R(dx - dw / 2, dy, dw, 2, '#f2e6d0'); R(dx - dw / 2, dy, 2, dh, '#f2e6d0'); R(dx + dw / 2 - 2, dy, 2, dh, '#f2e6d0'); R(dx - 1, dy, 2, dh, '#f2e6d0');
  for (let i = 0; i < dh - 2; i++) { const k = Math.round(i * 8 / (dh - 2)); R(dx - 9 + k, dy + 2 + i, 1, 1, '#f2e6d0'); R(dx + 8 - k, dy + 2 + i, 1, 1, '#f2e6d0'); R(dx + 1 + k, dy + 2 + i, 1, 1, '#f2e6d0'); R(dx - 2 - k, dy + 2 + i, 1, 1, '#f2e6d0'); }
  R(dx + 4, dy + 12, 2, 2, '#ffd75e');
  R(dx - 13, by, 26, 2, '#b8b0a0'); R(dx - 13, by + 2, 26, 1, '#807868');
  // portinhola e rampa para o cercado
  R(x + w - 12, by - 12, 10, 12, OUT); R(x + w - 11, by - 11, 8, 11, '#3a1a12');
  for (let i = 0; i < 10; i++) R(x + w - 3 + i, by - 4 + Math.floor(i / 3), 3, 2, i % 2 ? '#a07848' : '#c89a62');
  // telhado escuro de duas águas
  for (let r = 0; r < roofH; r++) {
    const inset = Math.round((1 - r / roofH) * 6) - 4, x0 = x + inset, ww = w - inset * 2;
    R(x0 - 1, y + r, ww + 2, 1, OUT);
    for (let c = 0; c < ww; c++) { const edge = r % 4 === 3, seam = c % 6 === 0; g.fillStyle = edge ? '#2e3442' : seam ? '#3a4254' : r % 4 === 0 ? '#5e6a80' : '#4a5468'; g.fillRect(x0 + c, y + r, 1, 1); }
  }
  R(x - 1, y - 2, w + 2, 3, OUT); R(x, y - 1, w, 2, '#7a869c'); snowCap(x - 2, y - 1, w + 4, 11); R(x - 5, wy, w + 10, 2, OUT);
  cur.lights.push({ kind: 'win', x: x + 13, y: wy + 10, w: 6, h: 6 });
  // cata-vento
  R(dx, y - 8, 1, 7, OUT); R(dx - 3, y - 9, 7, 2, OUT); R(dx - 2, y - 9, 5, 1, '#e0a23a');
  return { x: dx, y: by };
}

function car(x, y, c) {
  shadowOval(x + 18, y + 14, 19, 2);
  R(x + 7, y - 1, 22, 8, OUT); R(x + 8, y, 20, 7, shade(c, 0.85));
  R(x + 10, y + 1, 7, 5, '#a8dcff'); R(x + 19, y + 1, 7, 5, '#8cc8f0');
  R(x - 1, y + 6, 38, 9, OUT); R(x, y + 7, 36, 7, c); R(x, y + 7, 36, 2, shade(c, 1.2));
  R(x + 34, y + 9, 2, 2, '#ffe89a'); R(x, y + 9, 2, 2, '#e04a3a');
  [6, 26].forEach(wx => { R(x + wx - 1, y + 11, 8, 6, OUT); R(x + wx, y + 12, 6, 4, '#3a3a44'); R(x + wx + 2, y + 13, 2, 2, '#b0b0b8'); });
}


function roomBase(wall, f1, f2, planks) {
  R(0, 0, W, 72, wall);
  for (let x = 0; x < W; x += 16) R(x, 0, 1, 62, shade(wall, 0.94));
  R(0, 62, W, 6, shade(wall, 0.82)); R(0, 68, W, 4, '#5a4030');
  const tw = planks ? 40 : 16, th = planks ? 8 : 12;
  for (let y = 72, r = 0; y < H; y += th, r++) for (let x = planks ? -((r % 2) * 20) : 0, c = 0; x < W; x += tw, c++) {
    R(x, y, tw, th, planks ? f1 : ((c + r) % 2 ? f1 : f2));
    if (planks) { R(x, y + th - 1, tw, 1, f2); R(x + tw - 1, y, 1, th, f2); }
  }
  g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(0, 72, W, 3);
}
function box(x, y, w, h, c) { R(x - 1, y - 1, w + 2, h + 2, OUT); R(x, y, w, h, c); }
function desk(x, w, top, front) {
  R(x - 1, 113, w + 2, 27, OUT); R(x, 114, w, 5, top); R(x, 114, w, 1, shade(top, 1.2));
  R(x, 119, w, 20, front); R(x, 119, w, 2, shade(front, 0.72)); R(x + 3, 125, w - 6, 1, shade(front, 0.88));
}
function bubble(x, y, mark, t) {
  R(x - 1, y - 1, 16, 12, OUT); R(x, y, 14, 10, '#ffffff'); R(x + 2, y + 10, 5, 1, OUT); R(x + 3, y + 10, 3, 1, '#ffffff'); R(x + 3, y + 11, 2, 1, OUT);
  if (mark === '!') { R(x + 6, y + 2, 2, 4, '#e04a3a'); R(x + 6, y + 7, 2, 1, '#e04a3a'); }
  else for (let i = 0; i <= Math.floor(t / 220) % 3; i++) R(x + 2 + i * 4, y + 4, 2, 2, OUT);
}
