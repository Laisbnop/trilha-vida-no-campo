/* Jogo — tela de título e aparência: criação de personagem e guarda-roupa (mesmas opções).
   Parte de js/game/ (antes era js/game.js). São scripts comuns, carregados em ordem pelo index.html:
   as declarações de nível superior (estado S, P, map etc. e as funções) valem para todos os arquivos, sem
   cópias (não são módulos). O jogo começa em js/game/main.js, o último. */

/* =====================================================
   TÍTULO
   ===================================================== */
let DEMO = null;
function initTitle() {
  S = null; show('title'); World.setSeason(0);
  if (!DEMO) { DEMO = newState(DEFAULT_LOOK, ''); upgrade(DEMO); [0, 1, 2].forEach(i => { DEMO.farm.tiles[i] = { k: 'soil', w: 1, crop: 'tomate', g: i + 2 }; }); DEMO.coop.hens = [{ name: '', well: 80 }, { name: '', well: 80 }]; }
  const found = inspectSaves(), notice = $('save-notice'), cont = $('btn-continue');
  notice.hidden = true; cont.hidden = true; cont.textContent = 'Continuar';
  if (found.state) { cont.hidden = false; cont.onclick = () => { S = found.state; startGame(); }; }
  else if (found.old) {
    notice.hidden = false;
    notice.replaceChildren(el('b', '', 'Jogo de uma versão anterior encontrado. '),
      el('span', '', `O jogo mudou de direção: agora é uma vida no campo, sem profissões nem contexto familiar. O progresso antigo (profissão, tarefas, dia e moedas) não tem como continuar, mas dá para começar a nova fazenda com ${found.old.name}, mantendo o nome e a aparência. O jogo antigo continua guardado neste navegador: nada é apagado.`));
    cont.hidden = false; cont.textContent = `Nova fazenda com ${found.old.name}`;
    cont.onclick = () => startCreation(found.old);
  } else if (found.broken || found.legacy) {
    notice.hidden = false;
    notice.replaceChildren(el('b', '', 'Não foi possível abrir o jogo salvo. '),
      el('span', '', found.legacy ? 'Existe um jogo de uma versão anterior neste navegador, mas ele não pôde ser lido. Ele continua guardado; você pode começar uma nova fazenda.'
        : 'O arquivo de progresso está danificado. Ele continua guardado e só será substituído se você iniciar um novo jogo.'));
  }
  $('btn-new').onclick = () => {
    if ((found.state || found.broken) && !confirm('Já existe uma fazenda salva neste navegador. Ao terminar de criar um novo personagem, ela será substituída. Deseja continuar?')) return;
    startCreation();
  };
}

/* =====================================================
   APARÊNCIA: criação e guarda-roupa usam as mesmas opções
   ===================================================== */
function optionGrid(box, items, cur, set, extra) {
  const grid = el('div', 'opts' + (extra ? ' ' + extra : ''));
  items.forEach(it => {
    const b = el('button', 'opt' + (cur === it.id ? ' sel' : '')); b.type = 'button'; b.dataset.id = it.id;
    if (it.canvas) b.append(it.canvas);
    if (it.swatch) { const s = el('span', 'swatch'); s.style.background = it.swatch; b.append(s); }
    if (it.label) b.append(el('span', 't', it.label));
    if (it.swatch) b.setAttribute('aria-label', it.name || it.swatch);
    b.onclick = () => set(it.id);
    grid.append(b);
  });
  box.append(grid);
}
const colorItems = list => list.map(c => ({ id: c, swatch: c }));
/* Cor do cabelo em três barras (HSL, 0–100): Cor (matiz), Intensidade (saturação) e Luminosidade.
   Arrastar com o mouse ou o dedo, clicar em qualquer ponto ou usar as setas (Page Up/Down: de 10 em 10;
   Home/End: extremos) com a barra selecionada. Enquanto arrasta, só a prévia muda (live); ao soltar, o resto
   da tela acompanha (done). As barras de intensidade e luminosidade mostram a cor escolhida. */
function hairSliders(box, look, live, done) {
  const vals = Sprites.hairHslOf(look), wrap = el('div', 'hsl'), rows = [];
  const NAMES = [['Cor', 'cor'], ['Intensidade', 'intensidade'], ['Luminosidade', 'luminosidade']];
  const paint = () => {
    const [h, sat, l] = vals, H = h * 3.6;
    rows[0].track.style.background = `linear-gradient(to right, ${[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360].map(a => `hsl(${a} ${Math.max(45, sat)}% 50%)`).join(', ')})`;
    rows[1].track.style.background = `linear-gradient(to right, hsl(${H} 0% ${l}%), hsl(${H} 100% ${l}%))`;
    rows[2].track.style.background = `linear-gradient(to right, #000, hsl(${H} ${sat}% 50%), #fff)`;
    rows.forEach((r, i) => { r.knob.style.left = vals[i] + '%'; r.val.textContent = vals[i]; r.track.setAttribute('aria-valuenow', vals[i]); });
  };
  const set = (i, v) => { v = Math.max(0, Math.min(100, Math.round(v))); if (vals[i] === v && Array.isArray(look.hairHsl)) return; vals[i] = v; look.hairHsl = vals.slice(); paint(); live(); };
  NAMES.forEach(([label, id], i) => {
    const row = el('div', 'hsl-row'), track = el('div', 'hsl-track'), knob = el('i', 'hsl-knob'), val = el('span', 'hsl-val');
    track.tabIndex = 0; track.setAttribute('role', 'slider'); track.setAttribute('aria-label', label); track.setAttribute('aria-valuemin', '0'); track.setAttribute('aria-valuemax', '100'); track.dataset.hsl = id;
    track.append(knob); row.append(el('span', 'hsl-label', label), track, val); wrap.append(row); rows.push({ track, knob, val });
    const at = e => { const r = track.getBoundingClientRect(); set(i, (e.clientX - r.left) / r.width * 100); };
    track.onpointerdown = e => { e.preventDefault(); track.focus({ preventScroll: true }); try { track.setPointerCapture(e.pointerId); } catch (_) {} at(e); track.onpointermove = at; };
    track.onpointerup = track.onpointercancel = () => { if (!track.onpointermove) return; track.onpointermove = null; done(); };
    track.onkeydown = e => {
      const step = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1, PageDown: -10, PageUp: 10 }[e.key];
      if (step) set(i, vals[i] + step); else if (e.key === 'Home') set(i, 0); else if (e.key === 'End') set(i, 100); else return;
      e.preventDefault(); e.stopPropagation();
    };
    track.onkeyup = e => { if (/Arrow|Page|Home|End/.test(e.key)) done(); };
  });
  const reset = btn('btn ghost hsl-reset', 'Restaurar cor padrão', () => { delete look.hairHsl; look.hairColor = Sprites.genderPreset(look.gender === 'm' ? 'm' : 'f').hairColor; const v = Sprites.hairHslOf(look); vals.splice(0, 3, ...v); paint(); live(); done(); });
  reset.id = 'hair-reset';
  box.append(el('p', 'hint', 'Cor do cabelo'), wrap, reset); paint();
}
/* Seções de aparência. look = objeto editado; change = redesenha. */
const LOOK_SECTIONS = {
  /* gênero: pronomes + base visual. Escolher OUTRO gênero aplica o ponto de partida (mantém a
     pele); repetir a mesma escolha não mexe em nada do que já foi personalizado. */
  genero: (box, look, change) => optionGrid(box, Sprites.GENDERS.map(g => ({ id: g.id, label: g.name, canvas: Sprites.canvas(Object.assign(Sprites.genderPreset(g.id), { skin: look.skin, hat: null })) })), look.gender,
    id => { if (id === look.gender) return; Object.assign(look, Sprites.genderPreset(id)); change(); }, 'genders'),
  pele: (box, look, change) => optionGrid(box, Sprites.SKINS.map(s => ({ id: s.id, label: s.name, swatch: s.c[0] })), look.skin, id => { look.skin = id; change(); }, 'sw'),
  cabelo: (box, look, change, live, commit) => {                       // trocar o penteado mantém a cor
    optionGrid(box, Sprites.HAIRS.map(h => ({ id: h.id, label: h.name, canvas: Sprites.canvas(Object.assign({}, look, { hair: h.id, hat: null })) })), look.hair, id => { look.hair = id; change(); }, 'many');
    const grid = box.lastElementChild, thumbs = () => grid.querySelectorAll('.opt').forEach(b => b.querySelector('canvas').replaceWith(Sprites.canvas(Object.assign({}, look, { hair: b.dataset.id, hat: null }))));
    hairSliders(box, look, live || (() => {}), () => { thumbs(); if (live) live(); if (commit) commit(); });   // ao soltar: miniaturas e salvamento (sem redesenhar as barras)
  },
  cima: (box, look, change) => { optionGrid(box, Sprites.TOPS.map(o => ({ id: o.id, label: o.name, canvas: Sprites.canvas(Object.assign({}, look, { top: o.id })) })), look.top, id => { look.top = id; change(); }, 'many'); box.append(el('p', 'hint', 'Cor')); optionGrid(box, colorItems(Sprites.CLOTH_COLORS), look.topColor, id => { look.topColor = id; change(); }, 'colors'); },
  baixo: (box, look, change) => { optionGrid(box, Sprites.BOTTOMS.map(o => ({ id: o.id, label: o.name, canvas: Sprites.canvas(Object.assign({}, look, { bottom: o.id })) })), look.bottom, id => { look.bottom = id; change(); }); box.append(el('p', 'hint', 'Cor')); optionGrid(box, colorItems(Sprites.CLOTH_COLORS), look.bottomColor, id => { look.bottomColor = id; change(); }, 'colors'); },
  calcado: (box, look, change) => optionGrid(box, colorItems(Sprites.SHOE_COLORS), look.shoeColor, id => { look.shoeColor = id; change(); }, 'colors'),
  acessorio: (box, look, change) => {
    optionGrid(box, [{ id: 'none', label: 'Nenhum', canvas: Sprites.canvas(Object.assign({}, look, { accessory: null })) }, ...Sprites.ACCESSORIES.map(a => ({ id: a.id, label: a.name, canvas: Sprites.canvas(Object.assign({}, look, { accessory: a.id })) }))],
      look.accessory || 'none', id => { look.accessory = id === 'none' ? null : id; change(); }, 'many');
    if (look.accessory) { box.append(el('p', 'hint', 'Cor do acessório')); optionGrid(box, colorItems(Sprites.CLOTH_COLORS), look.accColor, id => { look.accColor = id; change(); }, 'colors'); }
  },
  extras: (box, look, change) => { box.append(el('p', 'hint', 'Calçado')); LOOK_SECTIONS.calcado(box, look, change); box.append(el('p', 'hint', 'Acessório')); LOOK_SECTIONS.acessorio(box, look, change); },
};

/* Moldura de madeira da criação (pixel art, 18x18 em 9 partes): borda escura, tábua com
   veios, filete escuro, filete claro e pregos de latão nos cantos. Vira a borda da janela. */
(function woodFrame() {
  const c = document.createElement('canvas'); c.width = 18; c.height = 18; const g = c.getContext('2d');
  const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  R(0, 0, 18, 18, '#2a1608'); R(1, 1, 16, 16, '#8a5428'); R(1, 1, 16, 1, '#b8783c'); R(1, 1, 1, 16, '#a86a34');
  R(1, 3, 16, 1, '#6a3c1a'); R(3, 1, 1, 16, '#6a3c1a');
  [[7, 2], [10, 3], [13, 2], [2, 8], [3, 11], [2, 13], [8, 15], [12, 16], [15, 9], [16, 12]].forEach(([x, y]) => R(x, y, 1, 1, '#6a3c1a'));
  R(4, 4, 10, 10, '#3a2010'); R(5, 5, 8, 8, '#fff0d0'); R(6, 6, 6, 6, '#f3e2bd');   // filete escuro, filete claro e o miolo liso (só ele se estica)
  [[1, 1], [15, 1], [1, 15], [15, 15]].forEach(([x, y]) => { R(x, y, 2, 2, '#e8c060'); R(x + 1, y + 1, 1, 1, '#8a6a20'); R(x, y, 1, 1, '#fff2b0'); });
  document.documentElement.style.setProperty('--wood-frame', `url(${c.toDataURL()})`);
})();
const draft = {};
window.__creation = { get look() { return JSON.parse(JSON.stringify(draft.look || {})); } };   // para os testes
let step = 0, previewTimer = 0, previewF = 0;
const STEPS = [
  { title: 'Gênero', hint: 'Define como a vila se refere a você nas falas (ele ou ela). Todos os cabelos, cores, roupas e acessórios servem para os dois.', key: 'genero' },
  { title: 'Cor da pele', hint: 'Escolha o tom de pele.', key: 'pele', look: true },
  { title: 'Cabelo', hint: () => (draft.look.hair === 'careca' ? 'Penteado e cor. Careca: a cor quase não aparece.' : 'Penteado e cor: arraste as barras (ou clique e use as setas). Trocar de penteado mantém a cor.'), key: 'cabelo', look: true },
  { title: 'Roupa de cima', hint: 'Peça e cor.', key: 'cima', look: true },
  { title: 'Roupa de baixo', hint: 'Peça e cor. Combina com qualquer parte de cima.', key: 'baixo', look: true },
  { title: 'Calçado e acessório', hint: 'O acessório aparece de todos os lados, até com chapéu.', key: 'extras', look: true },
  { title: 'Animal favorito', hint: 'Gato ou cachorro? Um dia, alguém da vila pode se lembrar disso.', key: 'pet' },
  { title: 'Nomes', hint: 'Como a vila vai te chamar e o nome da fazenda que você vai herdar. Depois, o guarda-roupa de casa permite mudar cabelo, roupas e acessório.', key: 'names',
    valid: () => nameOk(draft.name, 'name') && nameOk(draft.farm, 'farm') },
];
function petOptions(box, cur, set) {
  optionGrid(box, Object.keys(PETS).map(k => ({ id: k, label: PETS[k].name, canvas: Object.assign(World.petCanvas(k), { className: 'pixel pet' }) })), cur, set, 'two');
}
function startCreation(pre) {
  draft.look = Object.assign({}, DEFAULT_LOOK, Sprites.genderPreset(DEFAULT_LOOK.gender || 'f'), pre ? pre.look : null, { crisp: true }); draft.name = pre ? pre.name : ''; draft.farm = ''; draft.pet = 'gato';
  if (pre && !draft.look.body) draft.look.body = draft.look.gender;      // personagem de versão antiga, recriado agora: base do gênero dele
  step = 0;
  const steps = $('steps'); steps.replaceChildren(); STEPS.forEach(() => steps.append(el('span')));
  show('create');
  clearInterval(previewTimer);
  previewTimer = setInterval(() => { previewF = (previewF + 1) % 4; updatePreview(); }, 260);
  renderStep();
}
/* Prévia ampliada: frente, esquerda, costas e direita, andando. */
/* Cenário pequeno da prévia (36x44): céu, morros, cerca e grama com tufos e flores. */
let previewBg = null;
function previewScene() {
  if (previewBg) return previewBg;
  const c = document.createElement('canvas'); c.width = 36; c.height = 44; const g = c.getContext('2d');
  const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  [['#cfeaf2', 0, 6], ['#bfe2ef', 6, 6], ['#acd8e8', 12, 6], ['#9fd0e2', 18, 4]].forEach(([col, y, h]) => R(0, y, 36, h, col));
  R(4, 5, 7, 2, '#f8fcfc'); R(6, 4, 4, 1, '#f8fcfc'); R(24, 9, 6, 2, '#f0f8fa'); R(25, 8, 3, 1, '#f0f8fa');
  for (let x = 0; x < 36; x++) { const h = Math.round(3 + Math.sin(x * 0.28) * 2 + Math.sin(x * 0.11 + 1) * 1.5); R(x, 22 - h, 1, h, '#8ab878'); }
  R(0, 22, 36, 22, '#78b04c');
  for (let x = 0; x < 36; x += 6) { R(x + 1, 18, 1, 6, '#a8784a'); R(x + 1, 18, 1, 1, '#c8986a'); } R(0, 19, 36, 1, '#c8986a'); R(0, 22, 36, 1, '#a8784a');
  R(0, 23, 36, 1, '#5e9a3a'); R(0, 36, 36, 8, '#6aa444');
  [[3, 30], [9, 40], [15, 27], [27, 33], [32, 41], [21, 42], [6, 25], [30, 26]].forEach(([x, y], i) => { R(x, y, 1, 2, '#4e8a30'); R(x + 1, y - 1, 1, 3, '#5e9a3a'); if (i % 3 === 0) { R(x + 2, y - 1, 2, 2, i % 2 ? '#f8e070' : '#f8f8f8'); } });
  R(8, 39, 20, 2, 'rgba(40,60,20,.22)');                                   // sombra sob os pés
  return (previewBg = c);
}
function updatePreview() {
  const dirs = ['down', 'left', 'up', 'right'], frame = [0, 1, 0, 2][previewF];
  [...$('preview-views').querySelectorAll('canvas')].forEach((c, i) => { const g = c.getContext('2d'), k = c.width / 36; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); g.imageSmoothingEnabled = false; g.setTransform(k, 0, 0, k, 0, 0); g.drawImage(previewScene(), 0, 0); Sprites.draw(g, draft.look, 6, 9, frame, dirs[i]); g.setTransform(1, 0, 0, 1, 0, 0); });   // prévia em 2x: o jogador redesenhado (48x64) aparece com todos os pixels
  $('preview-name').textContent = draft.name.trim() || '—';
  $('preview-farm').textContent = draft.farm.trim() ? draft.farm.trim() : '';
  $('preview-pet').replaceChildren(World.petCanvas(draft.pet));
}
function updateNav() {
  const st = STEPS[step];
  $('btn-back').textContent = step === 0 ? '◀ Título' : '◀ Voltar';
  $('btn-next').textContent = step === STEPS.length - 1 ? 'Começar ▶' : 'Avançar ▶';
  $('btn-next').disabled = st.valid ? !st.valid() : false;
  $('btn-random').hidden = !st.look;
}
function renderStep() {
  const st = STEPS[step];
  [...$('steps').children].forEach((s, i) => s.classList.toggle('on', i <= step));
  $('step-title').textContent = `${step + 1}. ${st.title}`;
  $('step-hint').textContent = typeof st.hint === 'function' ? st.hint() : st.hint;
  const box = $('step-content'); box.replaceChildren();
  if (LOOK_SECTIONS[st.key]) LOOK_SECTIONS[st.key](box, draft.look, renderStep, updatePreview);
  else if (st.key === 'pet') petOptions(box, draft.pet, id => { draft.pet = id; renderStep(); });
  else {
    const a = nameField('Seu nome', draft.name, 'name', 'Seu nome', v => { draft.name = v; updatePreview(); updateNav(); }, 'name-input');
    const b = nameField('Nome da fazenda', draft.farm, 'farm', 'Ex.: Recanto', v => { draft.farm = v; updatePreview(); updateNav(); }, 'farm-input');
    [a.input, b.input].forEach(i => { i.onkeydown = e => { if (e.key === 'Enter' && st.valid()) $('btn-next').click(); }; });
    box.append(a.box, b.box); setTimeout(() => (draft.name ? b.input : a.input).focus(), 0);
  }
  updatePreview(); updateNav();
}
$('btn-back').onclick = () => { if (step === 0) { clearInterval(previewTimer); initTitle(); } else { step--; renderStep(); } };
$('btn-random').onclick = () => { draft.look = Sprites.randomLook(draft.look); renderStep(); };
$('btn-next').onclick = () => {
  const st = STEPS[step];
  if (st.valid && !st.valid()) return;
  if (step < STEPS.length - 1) { step++; renderStep(); return; }
  clearInterval(previewTimer);
  if (!nameOk(draft.name, 'name') || !nameOk(draft.farm, 'farm')) return;                  // nada de nome vazio ou inválido
  S = newState(Object.assign({}, draft.look), draft.name, draft.farm, draft.pet);
  save(); startGame();
};
