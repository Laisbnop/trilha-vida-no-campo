/* Ícones 16x16 dos itens. */
const TOOLC = { enxada: '#9a9aa8', machado: '#b0b0c0', picareta: '#8a8a98', foice: '#c8c8d8' };
const ICON = {
  enxada() { R(7, 2, 2, 12, '#8a5e36'); box(4, 2, 8, 3, '#9a9aa8'); R(4, 5, 2, 2, '#9a9aa8'); },
  regador() { box(4, 6, 8, 7, '#6a8ab8'); R(4, 6, 8, 2, '#8aa8d0'); R(12, 7, 3, 2, '#6a8ab8'); R(14, 5, 1, 3, '#6a8ab8'); R(2, 4, 2, 6, '#4a6a98'); R(3, 3, 5, 1, '#4a6a98'); },
  machado() { R(7, 3, 2, 11, '#8a5e36'); box(8, 2, 5, 6, '#b0b0c0'); R(12, 3, 1, 4, '#e0e0ec'); },
  picareta() { R(7, 3, 2, 11, '#8a5e36'); box(3, 2, 10, 2, '#8a8a98'); R(2, 3, 2, 2, '#8a8a98'); R(12, 3, 2, 2, '#8a8a98'); },
  foice() { R(4, 8, 2, 7, '#8a5e36'); box(5, 2, 7, 2, '#c8c8d8'); R(11, 3, 2, 4, '#c8c8d8'); R(9, 6, 3, 2, '#c8c8d8'); },
  espada() { box(7, 1, 2, 10, '#d8d8e8'); R(7, 1, 1, 10, '#ffffff'); box(4, 11, 8, 2, '#c89838'); R(7, 13, 2, 3, '#6a4426'); },
  seed(c) { box(4, 4, 8, 9, '#e8dcc0'); R(4, 4, 8, 2, '#c8b890'); box(6, 7, 4, 4, c); R(5, 2, 6, 2, '#c8b890'); },
  rabanete() { blob(8, 10, 5, OUT); blob(8, 10, 4, '#e0507a'); R(7, 13, 2, 2, '#f8f0f0'); R(6, 2, 2, 5, '#3f9648'); R(9, 3, 2, 4, '#58b858'); },
  tomate() { blob(8, 9, 6, OUT); blob(8, 9, 5, '#e04a3a'); R(5, 6, 2, 2, '#f8907a'); R(6, 3, 4, 2, '#3f9648'); R(7, 2, 2, 1, '#3f9648'); },
  abobora() { blob(8, 9, 7, OUT, 0.8); blob(8, 9, 6, '#e88a20', 0.8); R(5, 6, 1, 7, '#c06a10'); R(8, 5, 1, 9, '#c06a10'); R(11, 6, 1, 7, '#c06a10'); R(7, 2, 2, 3, '#3f9648'); },
  muda(c) { box(5, 10, 6, 5, '#b0603a'); R(7, 4, 2, 6, '#6a4426'); box(3, 3, 4, 3, c); box(9, 1, 4, 3, c); },
  laranja() { blob(8, 9, 6, OUT); blob(8, 9, 5, '#f08a20'); R(5, 6, 2, 2, '#ffc070'); R(8, 2, 3, 2, '#3f9648'); },
  goiaba() { blob(8, 9, 6, OUT, 1.1); blob(8, 9, 5, '#9ac850', 1.1); blob(8, 10, 2, '#f07a90'); R(7, 2, 2, 2, '#6a4426'); },
  madeira() { box(2, 8, 12, 5, '#8a5e36'); R(2, 8, 12, 1, '#b88448'); box(4, 3, 10, 5, '#7a5230'); R(13, 4, 1, 3, '#d8b078'); R(13, 9, 1, 3, '#d8b078'); },
  pedra() { blob(8, 10, 6, OUT, 0.7); blob(8, 10, 5, '#9a9aa8', 0.7); R(5, 8, 4, 1, '#c8c8d4'); R(9, 11, 3, 1, '#6a6a78'); },
  racao() { box(4, 4, 8, 10, '#c8a050'); R(4, 4, 8, 2, '#e8d070'); R(6, 8, 4, 3, '#8a5e36'); R(6, 2, 4, 2, '#a08030'); },
  ovo() { blob(8, 9, 6, OUT, 1.15); blob(8, 9, 5, '#f8f0e0', 1.15); R(6, 5, 2, 3, '#ffffff'); },
  amora() { [[6, 6], [10, 6], [8, 9], [5, 10], [11, 10], [8, 12]].forEach(([x, y]) => { blob(x, y, 3, OUT); blob(x, y, 2, '#6a2a8a'); }); R(7, 2, 3, 2, '#3f9648'); },
  cogumelo() { box(6, 9, 4, 5, '#f0e6cc'); blob(8, 7, 6, OUT, 0.7); blob(8, 7, 5, '#c8483a', 0.7); R(5, 6, 2, 2, '#ffffff'); R(10, 5, 2, 2, '#ffffff'); },
  flor() { R(7, 8, 2, 7, '#3f9648'); [[8, 3], [5, 6], [11, 6], [8, 8]].forEach(([x, y]) => blob(x, y, 3, '#ffe066')); blob(8, 6, 2, '#f0a020'); },
  chapeu_palha() { box(4, 4, 8, 6, '#e8c860'); R(4, 8, 8, 2, '#8a5e36'); box(1, 10, 14, 2, '#e8c860'); },
  boina() { blob(8, 9, 7, OUT, 0.6); blob(8, 9, 6, '#c8483a', 0.6); R(8, 3, 2, 2, '#a83a2e'); R(4, 12, 8, 1, '#a83a2e'); },
  chapeu_pescador() { box(4, 4, 8, 6, '#8a9a6a'); R(4, 4, 8, 2, '#a4b482'); box(2, 10, 12, 2, '#6a7a4e'); },
  encomenda() { box(3, 5, 10, 9, '#c8a878'); R(7, 5, 2, 9, '#c8483a'); R(3, 9, 10, 1, '#c8483a'); },
  narciso() { R(7, 8, 2, 7, '#2f7028'); R(4, 11, 3, 2, '#3f9648'); blob(8, 6, 5, OUT); blob(8, 6, 4, '#f8f0a0'); blob(8, 6, 2, '#f0a020'); R(8, 6, 1, 1, '#c86a10'); },
  ervilha_cheiro() { R(7, 8, 1, 7, '#2f7028'); R(9, 6, 1, 6, '#3f9648'); blob(5, 6, 3, OUT); blob(5, 6, 2, '#f090c0'); blob(11, 5, 3, OUT); blob(11, 5, 2, '#c890f0'); blob(8, 3, 3, OUT); blob(8, 3, 2, '#ffb8e0'); },
  acafrao() { R(7, 9, 2, 6, '#3a7a3a'); box(4, 2, 8, 8, '#8a5ad9'); R(5, 2, 6, 2, '#b48af0'); R(7, 4, 2, 4, '#f0a020'); R(4, 9, 8, 1, '#6a3ab8'); },
  azevinho() { box(1, 6, 6, 6, '#1f6a34'); box(9, 6, 6, 6, '#2a7e40'); R(2, 7, 2, 1, '#4fa060'); blob(8, 5, 3, OUT); blob(7, 5, 2, '#e03a3a'); R(6, 4, 1, 1, '#ff8a7a'); blob(10, 4, 2, '#c02a2a'); },
  fruta_cristal() { blob(8, 9, 6, OUT); blob(8, 9, 5, '#a8e0f4'); blob(6, 7, 2, '#e8fbff'); R(10, 11, 2, 2, '#6ab4d8'); R(8, 1, 1, 3, '#5a8a5a'); R(9, 2, 2, 1, '#6aa86a'); },
  morango() {                                     // morango: vermelho com sementinhas e coroa verde
    blob(8, 10, 6, OUT, 1.1); blob(8, 10, 5, '#e0283a', 1.1); R(4, 6, 8, 2, '#e0283a'); R(5, 14, 6, 1, OUT); R(6, 15, 4, 1, OUT);
    R(5, 8, 2, 2, '#ff7a7a'); [[6, 11], [9, 9], [10, 12], [8, 13], [5, 10], [11, 7]].forEach(([x, y]) => R(x, y, 1, 1, '#ffe080'));
    R(5, 3, 6, 2, OUT); R(5, 4, 2, 2, '#3f9648'); R(9, 4, 2, 2, '#3f9648'); R(7, 2, 2, 3, '#58b858'); R(7, 1, 1, 2, '#2f7028');
  },
  chapeu_tome() { box(4, 5, 8, 5, '#7a6a4a'); box(2, 10, 12, 2, '#5a4a32'); R(5, 7, 2, 1, '#3a2a1a'); },
  vara() {                                        // vara de bambu: gomos dourados com nós escuros, cabo amarrado com cordão
    for (let i = 0; i < 13; i++) { R(1 + i, 14 - i, 2, 2, OUT); }
    for (let i = 0; i < 12; i++) { R(2 + i, 14 - i, 1, 1, i % 4 === 3 ? '#8a5a1e' : '#e8c060'); R(2 + i, 15 - i, 1, 1, i % 4 === 3 ? '#6a4012' : '#b88a30'); }
    R(2, 13, 2, 2, '#c8402a'); R(3, 12, 1, 1, '#e86a4a');
    R(14, 1, 1, 1, '#f4e8a0'); for (let y = 2; y < 11; y++) R(15, y, 1, 1, 'rgba(240,240,250,.85)'); R(14, 11, 3, 3, OUT); R(15, 12, 1, 1, '#ffffff');
  },
  vara_fibra() {                                  // fibra de vidro: haste fina vinho e cinza, molinete prateado, cabo de cortiça
    for (let i = 0; i < 13; i++) R(1 + i, 14 - i, 2, 2, OUT);
    for (let i = 0; i < 12; i++) { R(2 + i, 14 - i, 1, 1, i < 4 ? '#c89a62' : i < 8 ? '#8a2a3a' : '#b8b8c8'); R(2 + i, 15 - i, 1, 1, i < 4 ? '#8a6038' : i < 8 ? '#5a1a26' : '#7a7a8a'); }
    box(5, 9, 3, 3, '#c8c8d8'); R(6, 10, 1, 1, '#ffffff'); R(4, 12, 1, 1, '#e0e0ec');
    for (let y = 2; y < 11; y++) R(15, y, 1, 1, 'rgba(240,240,250,.85)'); R(14, 11, 3, 3, OUT); R(15, 12, 1, 1, '#e04a3a');
  },
  minhoca() {                                     // minhoca rosada em curva
    [[3, 11], [4, 10], [5, 9], [6, 9], [7, 10], [8, 11], [9, 11], [10, 10], [11, 9], [12, 8], [12, 7]].forEach(([x, y]) => { R(x - 1, y - 1, 3, 3, OUT); });
    [[3, 11], [4, 10], [5, 9], [6, 9], [7, 10], [8, 11], [9, 11], [10, 10], [11, 9], [12, 8], [12, 7]].forEach(([x, y], i) => { R(x, y, 1, 1, i % 3 === 0 ? '#c85a72' : '#f08aa0'); });
    R(12, 6, 1, 1, '#f8b0c0'); R(4, 13, 8, 1, '#7a5230');
  },
  alga() {                                        // três folhas de alga saindo de um tufo, com nervura clara
    ['................', '............OO..', '...........OLMO.', '......OO...OLMO.', '.....OLMO..OMLO.', '.O...OMLO.OMLO..', 'OLO..OMLO.OMLO..', 'OMLO.OLMO.OLMO..',
      '.OMLOOMLOOMLO...', '..OMLOLMOMLO....', '...OMLMLMLO.....', '....OMLMLO......', '....OMMMLO......', '.....OMMO.......', '.....OOOO.......', '................']
      .forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') R(x, y, 1, 1, { O: '#1a4a2a', M: '#3f9a3a', L: '#b8e060' }[ch]); }));
  },
  musgo() {                                       // tufo verde-musgo, fofo, com pontinhos claros
    blob(8, 10, 7, OUT, 0.6); blob(8, 10, 6, '#4a6a2a', 0.6); blob(6, 9, 3, '#6a8a32'); blob(10, 8, 3, '#7a9a3a'); blob(8, 11, 3, '#5a7a2e');
    [[5, 8], [9, 7], [11, 10], [7, 11], [4, 11]].forEach(([x, y]) => R(x, y, 1, 1, '#b8d070')); R(3, 13, 10, 1, '#3a5220');
  },
  lixo() {                                        // bota velha, furada e pingando
    box(4, 2, 6, 9, '#6a4a32'); R(5, 3, 4, 1, '#8a6442'); box(4, 10, 10, 4, '#6a4a32'); R(4, 13, 10, 1, '#3a2a1e'); R(11, 11, 2, 1, '#8a6442');
    R(6, 6, 2, 1, '#2a1a12'); R(6, 8, 2, 1, '#2a1a12'); R(9, 12, 1, 1, '#c8b890'); R(2, 14, 1, 1, '#8ac8e8'); R(14, 9, 1, 2, '#8ac8e8');
  },
  milho() {                                       // espiga dourada com palha verde
    for (let i = 0; i < 9; i++) { R(4 + i, 11 - i, 4, 4, OUT); }
    for (let i = 0; i < 8; i++) { R(5 + i, 11 - i, 3, 3, i % 2 ? '#f2d040' : '#f8e070'); R(6 + i, 12 - i, 1, 1, '#c89a20'); }
    R(2, 11, 5, 4, OUT); R(3, 11, 3, 3, '#4f9c32'); R(2, 13, 2, 1, '#8ac850'); R(5, 14, 3, 1, '#2a6a22'); R(12, 2, 2, 2, '#e8c060');
  },
  melao() {                                       // melão laranja-avermelhado com folhas no alto
    blob(8, 10, 6, OUT); blob(8, 10, 5, '#e8604a'); blob(7, 9, 3, '#f07a5a'); R(5, 7, 2, 2, '#ffb090'); R(5, 14, 6, 1, '#b8402e');
    R(5, 3, 6, 3, OUT); R(6, 3, 4, 2, '#3f9648'); R(4, 4, 2, 1, '#2a6422'); R(10, 4, 2, 1, '#2a6422'); R(7, 2, 2, 1, '#7ac24e');
  },
  repolho_roxo() {                                // repolho roxo com folhas e nervuras
    blob(8, 9, 7, OUT); blob(8, 9, 6, '#8a3aa8'); blob(7, 8, 3, '#c27ae0'); R(8, 6, 1, 8, '#4a1a5a'); R(5, 10, 6, 1, '#4a1a5a'); R(3, 12, 10, 2, '#5a2a6a'); R(4, 5, 2, 1, '#e0b0f0');
  },
  sardinha() {                                    // corpo prateado e fino, dorso azul
    R(2, 6, 11, 5, OUT); R(1, 7, 1, 3, OUT); R(13, 7, 2, 3, OUT); R(14, 5, 2, 2, OUT); R(14, 10, 2, 2, OUT);
    R(3, 7, 10, 3, '#c8d4e0'); R(3, 7, 10, 1, '#4a78a8'); R(4, 9, 8, 1, '#f0f4f8'); R(13, 8, 1, 1, '#9aa8b8'); R(15, 6, 1, 1, '#4a78a8'); R(15, 10, 1, 1, '#4a78a8');
    R(4, 8, 1, 1, OUT); R(6, 8, 1, 1, '#8aa0b8'); R(8, 6, 3, 1, '#4a78a8');
  },
  tucunare() {                                    // corpo dourado-esverdeado, faixas escuras e o "olho" no rabo
    R(2, 5, 11, 8, OUT); R(1, 7, 1, 4, OUT); R(13, 7, 1, 4, OUT); R(14, 5, 2, 8, OUT); R(6, 3, 5, 2, OUT);
    R(3, 6, 10, 6, '#c8b03a'); R(3, 6, 10, 2, '#6a8a3a'); R(3, 10, 10, 2, '#e8d070'); R(7, 4, 3, 1, '#6a8a3a');
    R(6, 6, 1, 5, '#3a4a22'); R(9, 6, 1, 5, '#3a4a22'); R(14, 6, 1, 6, '#e07a2a'); R(12, 7, 2, 2, '#2a2a1a'); R(12, 7, 1, 1, '#ffb84a');
    R(4, 8, 1, 1, OUT); R(3, 10, 2, 1, '#e8603a');
  },
};
const iconCache = {};
/* Canvas 16x16 com o ícone do item. */
function icon(id) {
  if (iconCache[id]) return iconCache[id];
  const c = document.createElement('canvas'); c.width = 16; c.height = 16; c.className = 'pixel';
  const prev = g; g = c.getContext('2d');
  const it = ITEMS[id];
  if (it && it.kind === 'seed') {                  // pacote de sementes com o desenho do cultivo
    ICON.seed({ rabanete: '#e0507a', tomate: '#e04a3a', abobora: '#e88a20', morango: '#e0283a', milho: '#f2d040', melao: '#f07a5a', repolho_roxo: '#8a3aa8' }[it.crop]);
    if (it.crop === 'milho') { R(6, 7, 4, 4, '#2a1a14'); R(7, 7, 2, 4, '#f2d040'); R(6, 9, 1, 2, '#4f9c32'); R(9, 9, 1, 2, '#4f9c32'); }
    if (it.crop === 'melao') { R(6, 7, 4, 4, '#2a1a14'); R(7, 8, 2, 2, '#e8604a'); R(7, 7, 2, 1, '#3f9648'); }
    if (it.crop === 'repolho_roxo') { R(6, 7, 4, 4, '#2a1a14'); R(7, 8, 2, 2, '#8a3aa8'); R(6, 10, 4, 1, '#4f9c48'); }
  }
  else if (it && it.kind === 'sapling') ICON.muda(FRUIT[it.tree][1]);
  else if (ICON[id]) ICON[id]();
  g = prev;
  return (iconCache[id] = c);
}

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

/* ================= desenho ================= */
/* v: { map, cam, t, state, actors, hens, cursor, markers, tint, floats } */
function render(ctx, v) {
  const { map, cam, t, state: S } = v;
  if (cam.x < 0 || cam.y < 0 || map.w < VW || map.h < VH || cam.y + VH > map.h) { ctx.fillStyle = map.id === 'fora' ? '#2f6a2c' : '#1c1420'; ctx.fillRect(0, 0, VW, VH); }
  ctx.drawImage(map.bg, -cam.x, -cam.y);
  g = ctx;
  ctx.save(); ctx.translate(-cam.x, -cam.y);
  const seen = (x, y, pad = 34) => x > cam.x - pad && x < cam.x + VW + pad && y > cam.y - pad && y < cam.y + VH + pad + 24;
  const list = [];
  map.sprites.forEach(s => { if (s.x < cam.x + VW + 8 && s.x + s.img.width > cam.x - 8 && s.y < cam.y + VH + 8 && s.y + s.img.height > cam.y - 8) list.push({ base: s.base, img: s.img, x: s.x, y: s.y, leafy: s.leafy }); });
  const put = (f, x, y, leafy) => list.push({ base: y, img: f.img, x: x - f.ox, y: y - f.h + 4, leafy });
  /* deslocamento de tremor do objeto que acabou de levar um golpe */
  const shk = key => (v.shake && v.shake.key === key && t - v.shake.t0 < 240 ? Math.round(Math.sin((t - v.shake.t0) / 20) * 2) : 0);

  if (map.id === 'fora') {
    const ph = Math.floor(t / 280);
    map.waters.forEach((w, k) => { for (let i = 0; i < 9; i++) { const y = w.cy - w.ry + 4 + (i * 7 + ph + k * 3) % (w.ry * 2 - 8), hw = w.rx * Math.sqrt(1 - ((y - w.cy) ** 2) / (w.ry * w.ry)) - 8; if (hw > 4 && i % 3 !== 2) R(w.cx - hw + (i * 13 + ph * 2) % (hw * 2), y, 2 + i % 2, 1, i % 2 ? '#bfe9f0' : '#8fd2e0'); } });
    (map.streams || []).forEach(st => { const n = st.pts.length; for (let i = 0; i < n; i += 23) { const j = Math.floor(i + t / 70) % n, [x, y] = st.pts[j]; R(x - 2 + (i % 3) - 1, y - 1 + (i % 2) * 2, 3, 1, i % 2 ? '#e4fbf6' : '#9fe0e4'); } });
    for (let i = 0; i < 4; i++) { const k = ((t / 900) + i / 4) % 1; ctx.fillStyle = `rgba(255,255,255,${0.8 * (1 - k)})`; ctx.fillRect(Math.round(628 + Math.sin(k * 5 + i) * 5), Math.round(126 - k * 8), 2, 2); }
    // terra, plantas e entulho da fazenda
    const tiles = S.farm.tiles;
    for (const key in tiles) {
      const o = tiles[key], q = tilePos(+key); if (!seen(q.x + 8, q.y + 8)) continue;
      if (o.k === 'soil') {
        const key0 = +key, col = key0 % GRID.cols, isSoil = n => !!(tiles[n] && tiles[n].k === 'soil');
        const mask = (key0 >= GRID.cols && isSoil(key0 - GRID.cols) ? 1 : 0) | (col < GRID.cols - 1 && isSoil(key0 + 1) ? 2 : 0) | (isSoil(key0 + GRID.cols) ? 4 : 0) | (col > 0 && isSoil(key0 - 1) ? 8 : 0);
        ctx.drawImage(soilImg(!!o.w, mask, Math.floor(hsh(key0, 3, 91) * 4)), q.x - 1, q.y - 1);
        if (o.crop) { if (CROPS[o.crop].stages) staged(ctx, q.x, q.y, o); else { const st = cropState(o); crop(ctx, q.x, q.y, o.crop, st.ripe ? 3 : !o.g ? 0 : o.g * 2 > CROPS[o.crop].days ? 2 : 1); } }
      } else if (o.k === 'tree') put(fruitTree(o.sp, o.age >= TREES[o.sp].grow ? 2 : o.age * 2 >= TREES[o.sp].grow ? 1 : 0, o.fruit), q.x + 8, q.y + 13, o.age >= TREES[o.sp].grow);
      else if (o.k === 'weed') {                                        // capim alto: entra na ordenação (folhas da frente cobrem os pés)
        const k0 = +key, col = k0 % GRID.cols, isW = n => !!(tiles[n] && tiles[n].k === 'weed');
        const mask = (k0 >= GRID.cols && isW(k0 - GRID.cols) ? 1 : 0) | (col < GRID.cols - 1 && isW(k0 + 1) ? 2 : 0) | (isW(k0 + GRID.cols) ? 4 : 0) | (col > 0 && isW(k0 - 1) ? 8 : 0);
        const v = Math.floor(hsh(k0, 7, 81) * 4) % 4, f = [0, 1, 0, -1][Math.floor(t / 560 + hsh(k0, 1, 500) * 4) % 4], gx = q.x + shk('f' + key), gy = q.y;
        list.push({ base: q.y + 14, fn: () => ctx.drawImage(capim(v, mask, f), gx - 6, gy - 15) });
      }
      else debris(ctx, q.x + shk('f' + key), q.y, o.k, hsh(+key, 7, 81));
    }
    // bosque
    const cleared = S.nature.cleared || {};
    NTREES.forEach(([x, y], i) => { if (!cleared[i] && seen(x, y, 50)) put(S.nature.trees[i] ? stump(i) : wildTree(i), x + shk((S.nature.trees[i] ? 's' : 't') + i), y, !S.nature.trees[i]); });
    NROCKS.forEach(([x, y], i) => { if (!S.nature.rocks[i] && seen(x, y)) rock(ctx, x + shk('r' + i), y, i); });
    FORAGE.forEach(([x, y], i) => { if (S.nature.forage[i] && seen(x, y)) forage(ctx, x, y, S.nature.forage[i]); });
    if (S.nature.hat) forage(ctx, SPOT.hat[0], SPOT.hat[1], 'chapeu_tome');
    // banco da praça: quebrado até a missão do Seu Honório
    const bx = SPOT.bench[0], by = SPOT.bench[1];
    if (S.world.banco) { box(bx - 13, by - 8, 26, 5, '#c89858'); R(bx - 13, by - 8, 26, 1, '#e8c888'); R(bx - 11, by - 3, 3, 4, '#6a4426'); R(bx + 8, by - 3, 3, 4, '#6a4426'); box(bx - 13, by - 14, 26, 3, '#b88448'); }
    else { box(bx - 13, by - 7, 14, 4, '#8a6a48'); R(bx - 11, by - 3, 3, 4, '#5a4030'); R(bx + 2, by - 4, 11, 3, OUT); R(bx + 3, by - 3, 9, 2, '#7a5a3a'); R(bx + 9, by - 1, 3, 2, '#5a4030'); }
    // boneco de treino
    const dk = v.dummyHit ? Math.max(0, 1 - (t - v.dummyHit) / 350) : 0, df = dummyFig();
    list.push({ base: SPOT.dummy[1], img: df.img, x: SPOT.dummy[0] - df.ox + Math.round(Math.sin(t / 30) * 3 * dk), y: SPOT.dummy[1] - df.h + 4 });
    (v.seasonal || []).forEach(o => { if (seen(o.x, o.y)) seasonalItem(ctx, o.x, o.y, o.id, t); });
    if (v.debugSpawns) map.spawns.forEach(([x, y]) => { ctx.fillStyle = 'rgba(255,0,0,.75)'; ctx.fillRect(x - 2, y - 2, 4, 4); });
    (v.hens || []).forEach(h => list.push({ base: h.y, hen: h }));
    if (v.pet) list.push({ base: v.pet.y, pet: v.pet });
    // fumaça da chaminé
    for (let i = 0; i < 4; i++) { const k = ((t / 1400) + i / 4) % 1; ctx.fillStyle = `rgba(230,230,236,${0.7 * (1 - k)})`; ctx.fillRect(Math.round(131 + Math.sin(k * 6 + i) * 3 + k * 6), Math.round(40 - k * 22), 3, 3); }
    (map.smokes || []).forEach(([sx, sy], n) => { if (!seen(sx, sy, 40)) return; for (let i = 0; i < 3; i++) { const k = ((t / 1600) + i / 3 + n * 0.17) % 1; ctx.fillStyle = `rgba(230,230,236,${0.6 * (1 - k)})`; ctx.fillRect(Math.round(sx + Math.sin(k * 6 + i + n) * 3 + k * 5), Math.round(sy - k * 20), 3, 3); } });
  }
  if (map.id === 'montanha') {
    const L = S.lucio || {};
    tent(ctx, !!L.tentUp, t, v.repair || 0);
    fireFx(ctx, t, S.time >= 1020 || S.time < 360);
    (SERRA.forage).forEach(([x, y], i) => { const id = S.nature.mforage && S.nature.mforage[i]; if (id) forage(ctx, x, y, id); });
    if (v.keepsake) whistle(ctx, SERRA.keepsake[0], SERRA.keepsake[1]);
    const ph = Math.floor(t / 280);
    map.waters.forEach(w => { for (let i = 0; i < 5; i++) { const y = w.cy - w.ry + 4 + (i * 7 + ph) % (w.ry * 2 - 8), hw = w.rx * Math.sqrt(1 - ((y - w.cy) ** 2) / (w.ry * w.ry)) - 8; if (hw > 4) R(w.cx - hw + (i * 13 + ph * 2) % (hw * 2), y, 3, 1, '#bfe4ff'); } });
  }
  if (map.id === 'fora' && S.iara && S.iara.ev3 === 'seek') {           // florzinha entre as pedras (acontecimento de 3 corações)
    const [fx, fy] = [IARA.detail.x, IARA.detail.y]; ctx.fillStyle = '#2f7a36'; ctx.fillRect(fx, fy - 4, 1, 4);
    ctx.fillStyle = '#b48af0'; [[-1, -6], [1, -6], [0, -7], [0, -5]].forEach(([dx, dy]) => ctx.fillRect(fx + dx, fy + dy, 1, 1)); ctx.fillStyle = '#f2c84a'; ctx.fillRect(fx, fy - 6, 1, 1);
    if (Math.floor(t / 700) % 4 === 0) { ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(fx + 2, fy - 8, 1, 1); }
  }
  if (map.id === 'casa' && S.house && S.house.quadro) {                 // quadro da fonte pendurado
    ctx.fillStyle = OUT; ctx.fillRect(157, 15, 28, 22); ctx.fillStyle = '#b8783c'; ctx.fillRect(158, 16, 26, 20); ctx.drawImage(painting('fonte', S.house.quadro.si || 0), 0, 0, 48, 36, 160, 18, 22, 16);
  }
  if (map.id === 'galinheiro') {
    // ração no cocho (até 6 porções aparecem) e ovos nos ninhos
    const f = Math.min(6, S.coop.feed || 0);
    if (f) { R(22, 83, Math.round(52 * f / 6), 5, '#e8d070'); for (let i = 0; i < f * 4; i++) R(23 + (i * 7) % Math.max(4, Math.round(50 * f / 6)), 83 + (i * 3) % 4, 1, 1, '#c8a040'); }
    const hens = (S.coop.hens || []).length;
    for (let i = 0; i < Math.min(3, S.coop.eggs || 0); i++) { const nx = 166 + i * 29; blob(nx, 70, 3, OUT, 1.2); blob(nx, 70, 2, '#fff8e8', 1.3); R(nx - 1, 68, 1, 1, '#ffffff'); }
    if (hens && !(S.coop.eggs > 0)) hen(ctx, 166, 76, 0, false, false, Math.floor(t / 600) % 2);
  }

  v.actors.forEach(a => list.push({ base: a.y, a }));
  list.sort((p, q) => p.base - q.base);
  /* copa sobre o jogador: quando ele está atrás de uma árvore (pés acima da base e dentro da copa), ela fica translúcida.
     Só o desenho muda: a colisão continua no tronco. */
  const me = v.actors.length ? v.actors[v.actors.length - 1] : null;
  const behind = e => me && e.leafy && me.y < e.base - 1 && me.y > e.y + 6 && me.x > e.x + 3 && me.x < e.x + e.img.width - 3;
  list.forEach(e => {
    if (e.img) { if (behind(e)) { ctx.globalAlpha = 0.55; ctx.drawImage(e.img, Math.round(e.x), Math.round(e.y)); ctx.globalAlpha = 1; return; } return ctx.drawImage(e.img, Math.round(e.x), Math.round(e.y)); }
    if (e.fn) return e.fn();
    if (e.pet) return petDraw(ctx, e.pet, t);
    if (e.hen) { const h = e.hen; hen(ctx, Math.round(h.x), Math.round(h.y), h.kind, h.flip, h.peck, h.moving ? Math.floor(t / 150) % 2 : 0); if (h.heart) heart(ctx, Math.round(h.x) - 3, Math.round(h.y) - 20 - Math.floor(t / 250) % 2); return; }
    const a = e.a, ax = Math.round(a.x), ay = Math.round(a.y);
    ctx.fillStyle = 'rgba(20,30,20,.28)'; ctx.fillRect(ax + OX(-6), ay - 2, OX(6) - OX(-6), 3);   // sombra no tamanho do personagem do mundo
    const tk = a.tool ? Math.min(1, (t - a.tool.t0) / 280) : -1, using = tk >= 0 && tk < 1;
    if (using && a.dir === 'up') toolSwing(ctx, a, ax, ay, tk);
    const fy = ay + (a.hop || 0) + (using && tk > 0.4 ? 1 : 0) + (a.fish ? a.fish.lean || 0 : 0), fr = a.moving ? Sprites.walk(t) : (using ? 1 : 0);
    if (!(a.art && typeof CharArt !== 'undefined' && CharArt.draw(ctx, a.art, ax, fy, fr, a.dir || 'down'))) Sprites.drawWorld(ctx, a.look, ax, fy, fr, a.dir || 'down');   // arte própria (Caleb) ou sprite comum
    if (using && a.dir !== 'up') toolSwing(ctx, a, ax, ay, tk);
    if (a.fish) fishRod(ctx, a);
    if (a.act) actFx(ctx, a, t);
    if (a.fish && a.fish.hold) liftFish(ctx, a, t);
    if (a.eat) eating(ctx, a, t);
  });
  v.actors.forEach(a => { if (a.fish) fishLine(ctx, a.fish, t); });
  v.actors.forEach(a => { if (a.bubble) bubble(Math.round(a.x) - 7, Math.round(a.y) + OY(-46), a.bubble === '...' ? '' : '!', t); if (a.heart) heart(ctx, Math.round(a.x) - 3, Math.round(a.y) + OY(-42) - Math.floor(t / 300) % 2); });
  if (v.cursor) { const c = v.cursor, b = Math.floor(t / 350) % 2; ctx.fillStyle = c.far ? 'rgba(255,255,255,.45)' : b ? '#ffffff' : '#ffd75e'; [[0, 0, 5, 1], [0, 0, 1, 5], [c.w - 5, 0, 5, 1], [c.w - 1, 0, 1, 5], [0, c.h - 1, 5, 1], [0, c.h - 5, 1, 5], [c.w - 5, c.h - 1, 5, 1], [c.w - 1, c.h - 5, 1, 5]].forEach(([a, e, w, h]) => ctx.fillRect(c.x + a, c.y + e, w, h)); }
  (v.bars || []).forEach(b => { const x = Math.round(b.x) - 8, y = Math.round(b.y); ctx.fillStyle = OUT; ctx.fillRect(x - 1, y - 1, 18, 4); ctx.fillStyle = '#5a1a1a'; ctx.fillRect(x, y, 16, 2); ctx.fillStyle = b.frac > 0.5 ? '#8fe88f' : b.frac > 0.25 ? '#ffd75e' : '#ff7b5a'; ctx.fillRect(x, y, Math.max(1, Math.round(16 * b.frac)), 2); });
  (v.impacts || []).forEach(f => impact(ctx, f, t));
  // luz do dia e da noite: o cenário escurece aos poucos; janelas, postes e fogueiras acendem
  const L = v.light;
  if (L && L.glow > 0) (map.lights || []).forEach(l => { if (l.kind === 'win') { ctx.fillStyle = `rgba(255,214,130,${L.glow})`; ctx.fillRect(l.x, l.y, l.w, l.h); } });
  if (L && L.a > 0.003) { ctx.restore(); applyLight(ctx, map, cam, L, t); ctx.save(); ctx.translate(-cam.x, -cam.y); }
  (v.floats || []).forEach(f => { const k = (t - f.t0) / 700; if (k < 0 || k > 1) return; ctx.globalAlpha = 1 - k; ctx.drawImage(icon(f.icon), Math.round(f.x) - 8, Math.round(f.y - 24 - k * 14)); ctx.globalAlpha = 1; });
  ctx.restore();
  if (v.rain) rainFx(ctx, cam, t);
}
/* Chuva (só em áreas externas): riscos diagonais de 1 pixel que caem em velocidades um pouco diferentes, em duas
   camadas (perto, mais clara e rápida; longe, mais apagada), e respingos no chão. Tudo sai da posição e do tempo, sem
   estado: o padrão acompanha o mundo (não "anda" com a câmera) e não pisca entre os quadros. */
const RAIN_N = 230;
const rh = n => { n = (n ^ 61) ^ (n >>> 16); n = Math.imul(n, 0x27d4eb2d); n ^= n >>> 15; return (n >>> 0) / 4294967296; };
function rainFx(ctx, cam, t) {
  const W2 = VW + 40, H2 = VH + 40;
  for (let i = 0; i < RAIN_N; i++) {
    const far = i % 3 === 0, sp = (far ? 0.16 : 0.24) + rh(i * 7 + 3) * 0.05, len = far ? 4 : 7;
    const x0 = rh(i * 13 + 1) * W2, y0 = rh(i * 31 + 5) * H2, dy = t * sp, dx = dy * 0.35;
    const x = Math.round((((x0 - dx - cam.x * (far ? 0.6 : 1)) % W2) + W2) % W2) - 20, y = Math.round((((y0 + dy - cam.y * (far ? 0.6 : 1)) % H2) + H2) % H2) - 20;
    ctx.fillStyle = far ? 'rgba(170,190,225,.4)' : 'rgba(200,218,245,.7)';
    for (let k = 0; k < len; k++) ctx.fillRect(x - Math.round(k * 0.35), y + k, 1, 1);
  }
  for (let i = 0; i < 26; i++) {                                     // respingos: aparecem e somem num ponto fixo do chão
    const per = 600 + rh(i * 17 + 9) * 500, ph = ((t + rh(i * 5 + 2) * per) % per) / per; if (ph > 0.35) continue;
    const cycle = Math.floor((t + rh(i * 5 + 2) * per) / per), wx = rh(i * 41 + cycle * 7) * (VW + 0) + cam.x, wy = rh(i * 23 + cycle * 11) * VH + cam.y;
    const x = Math.round(wx - cam.x), y = Math.round(wy - cam.y), r = ph < 0.15 ? 1 : 2;
    ctx.fillStyle = 'rgba(200,220,245,.6)'; ctx.fillRect(x - r, y, 1, 1); ctx.fillRect(x + r, y, 1, 1); if (r > 1) ctx.fillRect(x, y - 1, 1, 1);
  }
}
/* Camada de luz: cor do céu por cima do cenário, com "furos" de luz em volta de
   janelas, postes e fogueiras e um brilho quente aditivo. Anéis em degraus para
   combinar com o pixel art. Não afeta HUD, textos e menus (que são HTML). */
let lightCanvas = null;
function applyLight(ctx, map, cam, L, t) {
  if (!lightCanvas) lightCanvas = document.createElement('canvas');
  const lc = lightCanvas; if (lc.width !== VW || lc.height !== VH) { lc.width = VW; lc.height = VH; }
  const g2 = lc.getContext('2d');
  g2.globalCompositeOperation = 'source-over'; g2.clearRect(0, 0, VW, VH);
  g2.fillStyle = `rgba(${L.r},${L.g},${L.b},${L.a})`; g2.fillRect(0, 0, VW, VH);
  const lights = (map.lights || []).filter(l => l.x > cam.x - 80 && l.x < cam.x + VW + 80 && l.y > cam.y - 80 && l.y < cam.y + VH + 80);
  if (L.glow > 0) {
    g2.globalCompositeOperation = 'destination-out';
    const flick = 1 + Math.sin(t / 130) * 0.04;
    lights.forEach(l => {
      const x = Math.round(l.x - cam.x), y = Math.round(l.y - cam.y);
      if (l.kind === 'win') { g2.fillStyle = `rgba(0,0,0,${0.9 * L.glow})`; g2.fillRect(x, y, l.w, l.h); g2.fillStyle = `rgba(0,0,0,${0.25 * L.glow})`; g2.fillRect(x - 6, y - 4, l.w + 12, l.h + 14); return; }
      const r = l.r * (l.kind === 'fire' ? flick : 1);
      for (let k = 3; k >= 1; k--) { g2.fillStyle = `rgba(0,0,0,${0.32 * L.glow})`; g2.beginPath(); g2.arc(x, y + (l.kind === 'lamp' ? 10 : 0), Math.round(r * k / 3), 0, Math.PI * 2); g2.fill(); }
    });
  }
  ctx.drawImage(lc, 0, 0);
  if (L.glow > 0) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    lights.forEach(l => {
      const x = Math.round(l.x - cam.x), y = Math.round(l.y - cam.y);
      if (l.kind === 'win') { ctx.fillStyle = `rgba(255,190,90,${0.35 * L.glow})`; ctx.fillRect(x, y, l.w, l.h); return; }
      const warm = l.kind === 'fire' ? [255, 120, 40] : [255, 190, 90];
      for (let k = 2; k >= 1; k--) { ctx.fillStyle = `rgba(${warm[0]},${warm[1]},${warm[2]},${0.07 * L.glow})`; ctx.beginPath(); ctx.arc(x, y + (l.kind === 'lamp' ? 8 : 0), Math.round(l.r * 0.55 * k / 2), 0, Math.PI * 2); ctx.fill(); }
    });
    ctx.restore();
  }
}
/* Coletáveis sazonais no chão. */
function seasonalItem(ctx, x, y, id, t) {
  const P = (a, b, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x + a, y + b, w, h); };
  ctx.fillStyle = 'rgba(20,30,20,.22)'; ctx.fillRect(x - 5, y - 1, 10, 2);
  if (id === 'amora') return forage(ctx, x, y, 'amora');
  if (id === 'narciso') { P(0, -7, 1, 7, '#2f7028'); P(-2, -4, 2, 1, '#3f9648'); P(-3, -12, 7, 5, OUT); P(-2, -11, 5, 3, '#f8f0a0'); P(-1, -12, 3, 1, '#f8f0a0'); P(-1, -11, 3, 3, '#f0a020'); P(0, -10, 1, 1, '#c86a10'); P(-2, -9, 5, 1, '#f8f0a0'); }
  if (id === 'ervilha_cheiro') { P(0, -6, 1, 6, '#2f7028'); P(1, -9, 1, 4, '#3f9648'); P(-4, -11, 4, 4, OUT); P(-3, -10, 2, 2, '#f090c0'); P(1, -12, 4, 4, OUT); P(2, -11, 2, 2, '#c890f0'); P(-1, -14, 3, 3, OUT); P(0, -13, 1, 1, '#ffb8e0'); P(-3, -10, 1, 1, '#ffd8ec'); }
  if (id === 'acafrao') { P(0, -5, 1, 5, '#3a7a3a'); P(-3, -11, 7, 7, OUT); P(-2, -10, 5, 5, '#8a5ad9'); P(-1, -10, 3, 1, '#b48af0'); P(0, -9, 1, 3, '#f0a020'); P(-2, -6, 5, 1, '#6a3ab8'); P(-4, -1, 9, 1, '#f4f8fc'); }
  if (id === 'azevinho') { P(-5, -6, 10, 6, OUT); P(-4, -5, 4, 4, '#1f6a34'); P(1, -5, 4, 4, '#2a7e40'); P(-4, -5, 1, 1, '#4fa060'); P(2, -6, 1, 1, '#1f6a34'); P(-1, -8, 3, 3, OUT); P(-1, -7, 1, 1, '#e03a3a'); P(0, -8, 1, 1, '#ff6a5a'); P(1, -7, 1, 1, '#c02a2a'); }
  if (id === 'fruta_cristal') { const s = Math.floor(t / 400) % 2; P(-4, -9, 9, 9, OUT); P(-3, -8, 7, 7, '#a8e0f4'); P(-2, -8, 3, 3, '#e8fbff'); P(1, -4, 2, 3, '#6ab4d8'); P(0, -11, 1, 3, '#5a8a5a'); P(1, -11, 2, 1, '#6aa86a'); if (s) P(-1, -7, 1, 1, '#ffffff'); }
}
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
function petDraw(ctx, p, t) {                    // (era "pet": o nome agora é global e "pet" já existe em game.js)
  petFig(ctx, Math.round(p.x), Math.round(p.y), p.sp, p.moving ? Math.floor(t / 160) : 0, p.flip, !p.moving);
  if (p.heart) heart(ctx, Math.round(p.x) - 3, Math.round(p.y) - 26 - Math.floor(t / 250) % 2);
}
/* Pequena imagem do bicho para painéis. */
function petCanvas(sp, sit = true) {
  const c = document.createElement('canvas'); c.width = 24; c.height = 20; c.className = 'pixel';
  petFig(c.getContext('2d'), 12, 19, sp, 0, false, sit); return c;
}

function heart(ctx, x, y) { ctx.fillStyle = '#e04a3a'; ctx.fillRect(x, y, 3, 3); ctx.fillRect(x + 4, y, 3, 3); ctx.fillRect(x + 1, y + 3, 5, 2); ctx.fillRect(x + 3, y + 5, 1, 1); }

const World = {
  get VW() { return VW; }, get VH() { return VH; }, RW, RH, setView, setSeason, get SEASON() { return SEASON; }, SERRA, MPLACES,
  __figs: () => [wildTree(0), wildTree(5), fruitTree('laranja', 2, true), fruitTree('goiaba', 2, false), fruitTree('laranja', 1)],   // (para testes e capturas)
  get, free, camera, render, icon, tileAt, tilePos, petCanvas, waterZone, solidAt, painting, GRID, YARD, SPOT, NTREES, NROCKS, FORAGE, PLACES, FORA,
};
