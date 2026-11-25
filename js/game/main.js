/* Jogo — partida: carregado por último, depois de todas as partes de js/game/ (scripts comuns, em ordem
   pelo index.html, que compartilham as declarações de nível superior):
     core.js       atalhos de página, estado, salvamento e nomes
     title.js      título, criação de personagem e guarda-roupa
     inventory.js  inventário
     state.js      estado do mundo, calendário, habilidades, sorte do dia e rotinas
     loop.js       início, laço principal, luz e tela
     input.js      alvos do mouse, ferramentas, teclado e toque
     dialog.js     diálogo
     fishing.js    pesca
     quests.js     missões
     villagers.js  moradores
     iara.js       Iara: pinturas e acontecimentos
     animals.js    galinhas e bicho de estimação
     forage.js     coletáveis sazonais
     night.js      dormir e a passagem da noite
     hud.js        HUD e barra de itens
     panels.js     painéis, mapa (M), loja e baú
     debug.js      ganchos window.__trilha e modo ?dev=1 */
initTitle();
requestAnimationFrame(loop);
