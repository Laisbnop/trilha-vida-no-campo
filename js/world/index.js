/* Mundo do jogo — objeto público World. As partes ficam nos outros arquivos de js/world/ (scripts comuns
   carregados em ordem pelo index.html, que compartilham as declarações de nível superior):
     base.js        tamanhos, sorteio, cores e estações
     vegetation.js  árvores e cercas
     buildings.js   fachadas da vila
     ground.js      posições fixas, montagem dos mapas, chão, grama e mato
     outdoor.js     chão da fazenda, ruas, água e mapa externo
     interiors.js   interiores
     mountain.js    serra
     maps.js        acesso aos mapas, colisão e câmera
     figures.js     árvores frutíferas, boneco e galinhas
     icons.js       ícones dos itens
     crops.js       plantações, pedras, galhos e coletáveis do chão
     render.js      desenho de cada quadro, chuva e luz
     actors.js      ferramentas, pesca, atividades, pinturas e bicho
   Este arquivo vem por último e monta o World com as mesmas funções públicas de antes. */
const World = {
  get VW() { return VW; }, get VH() { return VH; }, RW, RH, setView, setSeason, get SEASON() { return SEASON; }, SERRA, MPLACES,
  __figs: () => [wildTree(0), wildTree(5), fruitTree('laranja', 2, true), fruitTree('goiaba', 2, false), fruitTree('laranja', 1)],   // (para testes e capturas)
  get, free, camera, render, icon, tileAt, tilePos, petCanvas, waterZone, solidAt, painting, GRID, YARD, SPOT, NTREES, NROCKS, FORAGE, PLACES, FORA,
};
