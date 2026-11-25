// Configuração do teste de fumaça (só para desenvolvimento; o jogo não usa nada disto).
// O jogo é aberto direto do arquivo (file://), como num duplo clique no index.html.
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: 'tests',
  timeout: 180000,
  workers: 1,
  reporter: 'list',
  use: {
    browserName: 'chromium',
    viewport: { width: 1280, height: 800 },      // escala 4 da cena (as capturas de referência foram feitas assim)
    launchOptions: {
      args: ['--allow-file-access-from-files'],
      // para usar um Chromium já instalado: CHROMIUM_PATH=/caminho/do/chrome npm test
      executablePath: process.env.CHROMIUM_PATH || undefined,
    },
  },
});
