const World = {
  get VW() { return VW; }, get VH() { return VH; }, RW, RH, setView, setSeason, get SEASON() { return SEASON; }, SERRA, MPLACES,
  __figs: () => [wildTree(0), wildTree(5), fruitTree('laranja', 2, true), fruitTree('goiaba', 2, false), fruitTree('laranja', 1)],   // (para testes e capturas)
  get, free, camera, render, icon, tileAt, tilePos, petCanvas, waterZone, solidAt, painting, GRID, YARD, SPOT, NTREES, NROCKS, FORAGE, PLACES, FORA,
};
