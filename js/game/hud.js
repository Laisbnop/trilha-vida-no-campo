/* Jogo — HUD e barra de itens: hora, data, clima, moedas, energia e a barra de ferramentas.
   Parte de js/game/ (antes era js/game.js). São scripts comuns, carregados em ordem pelo index.html:
   as declarações de nível superior (estado S, P, map etc. e as funções) valem para todos os arquivos, sem
   cópias (não são módulos). O jogo começa em js/game/main.js, o último. */

/* =====================================================
   HUD E BARRA DE ITENS
   ===================================================== */
function renderHud() {
  if (!S) return;
  const hud = $('hud'); hud.replaceChildren();
  const c = calendar(), en = el('div', 'xp'), bar = el('div', 'bar' + (S.energy < 20 ? ' low' : '')), fill = el('i'); fill.style.width = S.energy + '%'; bar.append(fill);
  en.append(el('span', '', '⚡'), bar);
  const top = el('div', 'cp-row'), sky = el('canvas', 'pixel cp-sky'); sky.width = 30; sky.height = 16; drawSky(sky.getContext('2d'), S.time);
  top.append(sky, el('b', 'cp-date', `${WEEKDAYS_SHORT[c.wd]}, ${c.day}`), el('span', 'cp-time', clock()));
  const mid = el('div', 'cp-row'); mid.append(el('span', 'cp-season s' + c.si, `${c.season} · Ano ${c.year}`), el('span', 'cp-coins', `🪙 ${S.coins}`));
  const lk = luckKind(), luck = el('span', 'cp-luck ' + lk), ic = el('canvas', 'pixel'); ic.width = 9; ic.height = 9; drawClover(ic.getContext('2d'), lk);
  luck.append(ic, el('span', '', { sorte: 'Sorte', neutro: 'Neutro', ma: 'Má sorte' }[lk]));
  luck.dataset.tip = `${LUCK.name[lk]}. ${luckEffect(lk)}`; luck.setAttribute('aria-label', luck.dataset.tip);
  en.append(luck);
  hud.append(top, mid, en); renderTabsBadge();
  hud.title = `${c.weekday}, ${c.day} de ${c.season}, ano ${c.year} — ${clock()}${isRaining() ? ' — chovendo' : ''}`;
  sky.title = isRaining() ? 'Chovendo: os canteiros estão regados' : ''; sky.setAttribute('aria-label', isRaining() ? 'Chovendo' : 'Tempo firme');
  const o = objective();
  $('objective').replaceChildren(...(o ? [el('b', '', 'MISSÃO'), el('span', '', o)] : S.time >= 1260 ? [el('span', '', 'Já é tarde. A cama espera por você em casa.')] : []));
}
/* Trevo do indicador de sorte: quatro folhas verdes (sorte), três folhas (neutro), murcho (má sorte). */
function drawClover(g, kind) {
  const P = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const c = { sorte: ['#3fa040', '#9ae070'], neutro: ['#7a9a6a', '#b8ccaa'], ma: ['#7a6a4a', '#a8946a'] }[kind];
  const leaves = kind === 'sorte' ? [[1, 1], [5, 1], [1, 4], [5, 4]] : kind === 'neutro' ? [[1, 1], [5, 1], [3, 4]] : [[0, 3], [5, 4]];
  leaves.forEach(([x, y]) => { P(x, y, 3, 3, '#1a1210'); P(x, y, 2, 2, c[0]); P(x, y, 1, 1, c[1]); });
  P(4, kind === 'ma' ? 5 : 4, 1, 5, kind === 'ma' ? '#6a5a3a' : '#2f7028');
}
/* Indicador de dia/noite: o sol (ou a lua) percorre um arco no céu do painel. */
function drawSky(g, m) {
  const L = lightAt(m, false), night = L.glow;
  const day = [126, 200, 240], dusk = [240, 150, 100], dark = [30, 34, 80];
  const k = m < 480 ? Math.max(0, (480 - m) / 120) : m > 1050 ? Math.min(1, (m - 1050) / 210) : 0;
  const c = k < 0.5 ? day.map((v, i) => v + (dusk[i] - v) * k * 2) : dusk.map((v, i) => v + (dark[i] - v) * (k - 0.5) * 2);
  g.fillStyle = `rgb(${c.map(Math.round).join(',')})`; g.fillRect(0, 0, 30, 16);
  g.fillStyle = night > 0.5 ? '#2a3a2a' : '#4a8a3a'; g.fillRect(0, 13, 30, 3);
  const sun = m < 1170, f = sun ? (m - 360) / 810 : (m - 1170) / 390, x = Math.round(3 + f * 24), y = Math.round(12 - Math.sin(Math.max(0, Math.min(1, f)) * Math.PI) * 9);
  if (isRaining()) {                                                  // chuva: céu cinza, nuvem e gotas no lugar do sol
    g.fillStyle = night > 0.5 ? '#2a2e44' : '#6a7486'; g.fillRect(0, 0, 30, 13);
    g.fillStyle = night > 0.5 ? '#4a4e66' : '#c4cad4'; g.fillRect(7, 3, 14, 4); g.fillRect(10, 1, 7, 2); g.fillRect(5, 5, 3, 2);
    g.fillStyle = night > 0.5 ? '#3a3e56' : '#9aa2b0'; g.fillRect(7, 6, 14, 1);
    g.fillStyle = '#8ac0f0'; [[8, 9], [12, 10], [16, 8], [20, 10], [10, 12], [18, 12]].forEach(([dx, dy]) => g.fillRect(dx, dy, 1, 2));
    return;
  }
  if (sun) { g.fillStyle = '#ffd75e'; g.fillRect(x - 2, y - 2, 4, 4); g.fillStyle = '#fff4b0'; g.fillRect(x - 1, y - 1, 2, 2); }
  else { g.fillStyle = '#f0f0ff'; g.fillRect(x - 2, y - 2, 4, 4); g.fillStyle = `rgb(${c.map(Math.round).join(',')})`; g.fillRect(x, y - 2, 2, 2); g.fillStyle = '#ffffff'; g.fillRect(6, 3, 1, 1); g.fillRect(21, 5, 1, 1); g.fillRect(14, 2, 1, 1); }
}
function slotNode(s, cls) {
  const b = el('button', 'slot ' + (cls || '')); b.type = 'button';
  if (s) { const nm = ITEMS[s.id].name + (s.cm ? ` (${s.cm} cm)` : ''); b.append(cloneIcon(s.id)); b.title = nm; b.setAttribute('aria-label', nm); if (s.id === 'regador') b.append(el('i', '', `${S.can}`)); else if (s.id === 'vara_fibra' && S.fish.bait) { const bi = el('i', 'bait', `${S.fish.bait}`); bi.title = 'Minhocas carregadas'; b.append(bi); } else if (s.n > 1) b.append(el('i', '', String(s.n))); }
  return b;
}
function cloneIcon(id) { const c = el('canvas', 'pixel'); c.width = 16; c.height = 16; c.getContext('2d').drawImage(World.icon(id), 0, 0); return c; }
function renderHotbar() {
  if (!S) return;
  const bar = $('hotbar'); bar.replaceChildren();
  const base = S.row * HOTBAR;
  for (let i = 0; i < HOTBAR; i++) { const b = slotNode(S.inv[base + i], base + i === S.sel ? 'sel' : ''); b.dataset.slot = i; b.append(el('u', '', String((i + 1) % 10))); b.onclick = () => hotbarClick(i); bar.append(b); }
  const it = equipped(); $('equipped').textContent = it ? ITEMS[it.id].name : 'Mãos livres';
  let hr = $('hotrow'); if (!hr) { hr = el('div', 'hotrow'); hr.id = 'hotrow'; bar.parentNode.append(hr); }
  hr.replaceChildren(el('span', '', 'Linha'));
  for (let r = 0; r < 3; r++) {                      // as outras linhas da mochila ficam a um clique (sem atalho de teclado)
    const b = btn('rowbtn' + (r === S.row ? ' on' : ''), String(r + 1), () => showRow(r)); b.dataset.row = r;
    b.title = `Mostrar a linha ${r + 1} da mochila na barra`; b.setAttribute('aria-pressed', r === S.row); hr.append(b);
  }
}
