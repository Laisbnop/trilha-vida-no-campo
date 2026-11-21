/* Personagens com arte própria (a partir de imagens aprovadas), em vez do gerador de sprites.
   Os sprites estão na mesma grade dos outros personagens (um pixel do desenho = um pixel do mundo) e são
   desenhados com os pés no chão, sem suavização. Retratos: 64x64, como os dos outros moradores.
   Uso: CharArt.draw(ctx, 'caleb', x, y, quadro, direção) → true se desenhou (senão, usa o sprite comum). */
const CharArt = (() => {
  const sets = {};
  function load(id, data) {
    const S = { h: data.h, frames: {}, portraits: {} };
    Object.keys(data.frames).forEach(k => {
      S.frames[k] = {};
      Object.keys(data.frames[k]).forEach(d => { S.frames[k][d] = data.frames[k][d].map(src => { const im = new Image(); im.src = src; return im; }); });
    });
    Object.keys(data.portraits).forEach(e => {
      const c = document.createElement('canvas'); c.width = c.height = 64; c.className = 'pixel';
      const im = new Image(); im.onload = () => c.getContext('2d').drawImage(im, 0, 0); im.src = data.portraits[e];
      S.portraits[e] = { c, im };
    });
    sets[id] = S;
  }
  function draw(ctx, id, x, y, frame, dir) {
    const S = sets[id]; if (!S) return false;
    const k = Math.max(1, Math.round(ctx.getTransform ? ctx.getTransform().a : 1)), ks = Object.keys(S.frames).map(Number);
    const kk = ks.reduce((a, b) => (Math.abs(b - k) < Math.abs(a - k) ? b : a), ks[0]);
    const set = S.frames[kk][dir] || S.frames[kk].down, im = set[Math.abs(frame | 0) % 3];
    if (!im || !im.complete || !im.naturalWidth) return false;
    const H = S.h, W = im.naturalWidth * H / im.naturalHeight;
    const sx = Math.round((x - W / 2) * k) / k, sy = Math.round((y - H + 1) * k) / k;    // canto alinhado ao pixel da tela
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(im, sx, sy, W, H); ctx.restore();
    return true;
  }
  function portrait(id, expr) { const S = sets[id], p = S && (S.portraits[expr] || S.portraits.neutro); return p ? p.c : null; }
  const ready = id => !!sets[id] && Object.values(sets[id].portraits).every(p => p.im.complete);
  return { load, draw, portrait, ready, has: id => !!sets[id] };
})();

/* Caleb: arte da ficha aprovada (js/caleb-art.js). Expressões: neutro, sorriso, contente, envergonhado. */
if (typeof CALEB_ART !== 'undefined') {
  CharArt.load('caleb', CALEB_ART);
  const MAP = { emocionado: 'contente', desconfiado: 'neutro', triste: 'neutro', surpresa: 'envergonhado', concentrada: 'neutro' };
  const EX = ['neutro', 'sorriso', 'contente', 'envergonhado'];
  Sprites.PORTRAITS.caleb = (expr = 'neutro') => CharArt.portrait('caleb', EX.includes(expr) ? expr : MAP[expr] || 'neutro');
  Sprites.PORTRAITS.caleb.expressions = EX;
}
