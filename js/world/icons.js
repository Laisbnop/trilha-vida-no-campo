/* Mundo — ícones 16x16 dos itens (ferramentas, sementes, colheitas, peixes, comidas e objetos).
   Parte de js/world/ (antes era js/world.js). São scripts comuns, carregados em ordem pelo index.html:
   as declarações de nível superior valem para todos os arquivos (não são módulos). O objeto World,
   com as funções públicas, é montado no fim, em js/world/index.js. */

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
