/* Dados do quadro de pedidos da praça: nomes no singular e no plural dos itens pedidos e os textos de cada
   morador (pedido e agradecimento, de entrega e de pesca), na personalidade de cada um.
   Nos textos: {itens} = quantidade e nome ("5 ovos", "uma sardinha"), {item} = nome no singular, {nome} = nome do
   jogador, {g:masculino|feminino|neutro} = forma conforme o gênero escolhido. Falas que começam com [expressão]
   escolhem o retrato (as outras usam o normal no pedido e o contente no agradecimento). */

/* Itens que o quadro pode pedir: [singular, plural, gênero da palavra ('m' ou 'f')]. */
const BOARD_NOUN = {
  madeira: ['pedaço de madeira', 'pedaços de madeira', 'm'],
  pedra: ['pedra', 'pedras', 'f'],
  ovo: ['ovo', 'ovos', 'm'],
  rabanete: ['rabanete', 'rabanetes', 'm'],
  tomate: ['tomate', 'tomates', 'm'],
  abobora: ['abóbora', 'abóboras', 'f'],
  morango: ['morango', 'morangos', 'm'],
  milho: ['espiga de milho', 'espigas de milho', 'f'],
  melao: ['melão', 'melões', 'm'],
  repolho_roxo: ['repolho roxo', 'repolhos roxos', 'm'],
  narciso: ['narciso', 'narcisos', 'm'],
  ervilha_cheiro: ['ramo de ervilha-de-cheiro', 'ramos de ervilha-de-cheiro', 'm'],
  acafrao: ['flor de açafrão', 'flores de açafrão', 'f'],
  azevinho: ['ramo de azevinho', 'ramos de azevinho', 'm'],
  fruta_cristal: ['fruta de cristal', 'frutas de cristal', 'f'],
  amora: ['amora silvestre', 'amoras silvestres', 'f'],
  cogumelo: ['cogumelo', 'cogumelos', 'm'],
  flor: ['flor-do-campo', 'flores-do-campo', 'f'],
  sardinha: ['sardinha', 'sardinhas', 'f'],
  tucunare: ['tucunaré', 'tucunarés', 'm'],
};

/* Regras: prazo em dias contando o dia em que se aceita (2 = vence no fim do dia seguinte); recompensa em moedas =
   coinMult × preço de venda × quantidade, arredondada para múltiplo de 5; amizade = presente de que o morador gosta. */
const BOARD = { days: 2, coinMult: 3, round: 5, qtyBase: 60, maxQty: 10, maxFish: 3, maxForage: 2, eggPerHen: 2, fastCrop: 4 };

/* Textos por morador. ask/thanks: item = entrega, fish = pesca. */
const BOARD_TEXT = {
  celeste: {
    ask: {
      item: ['Querid{g:o|a|e}, a cozinha do Armazém está pedindo {itens}. Se você puder trazer, eu pago direitinho e ainda passo um café.',
        'Prometi uma encomenda e ainda preciso de {itens}. Você me salva, {nome}?',
        'Freguês fiel merece mercadoria boa. Estou precisando de {itens} para a prateleira da frente.'],
      fish: ['Tem gente na vila pedindo peixe fresco e eu não saio do balcão. Me traz {itens}?',
        'Vou fazer uma moqueca para o domingo e só preciso de {itens}. Você pesca para mim?'],
    },
    thanks: {
      item: ['Ah, que beleza! Vai direto para a prateleira. Obrigada, de coração.', 'Você é uma bênção, {nome}. Pegue aqui, é seu por merecimento.', 'Chegou certinho! Meu marido dizia: palavra dada é colheita garantida.'],
      fish: ['Que peixe bonito! A moqueca vai sair caprichada. Obrigada!', 'Fresquinho! O pessoal vai fazer fila no Armazém. Muito obrigada.'],
    },
  },
  honorio: {
    ask: {
      item: ['Preciso de {itens}. E não me venha com coisa ruim, que eu conheço.', 'Hunf. Vou consertar umas coisas por aí e vou precisar de {itens}. Alguém vai ter que trazer.', 'Procuro {itens}. Pago bem. Não é favor, é negócio.'],
      fish: ['Hunf. Minha vara quebrou e eu quero {itens} no jantar. Quem pescar, ganha.', 'Antigamente eu mesmo pescava. Hoje quero {itens}, e sem conversa comprida.'],
    },
    thanks: {
      item: ['Hunf. Está bom. Melhor do que eu esperava.', 'Serviço bem feito. Tome, é seu. Não precisa agradecer.', 'Isso aqui presta. Está vendo? Ainda tem gente que trabalha direito.'],
      fish: ['Peixe bom. Hoje a janta é decente.', 'Hunf. Pescou rápido. Vai ver que é sorte. Tome.'],
    },
  },
  bia: {
    ask: {
      item: ['Socorro! Estou precisando de {itens} e não tenho tempo nem de piscar! Me ajuda?', 'Ideia incrível: vou fazer uma surpresa para a vila! Só falta {itens}. Topa?', 'Oi, oi! Você tem {itens}? Eu troco por moedas e por um abraço!'],
      fish: ['Quero aprender a fazer peixe assado! Me traz {itens}? Prometo não queimar. Quase.', 'Minhas galinhas não comem peixe, mas eu como! Consegue {itens} para mim?'],
    },
    thanks: {
      item: ['AAAH, você trouxe! Você é a melhor pessoa desta vila!', 'Perfeito, perfeito, perfeito! Já sei até onde vou usar. Obrigada!', 'Uhul! Toma, é seu. E não esquece de mandar um oi para as suas galinhas!'],
      fish: ['Que peixão! Vou contar para todo mundo que foi você que pescou!', 'Obrigada! Hoje tem peixe assado. Se queimar, a culpa é do fogão.'],
    },
  },
  tome: {
    ask: {
      item: ['Preciso de {itens}. Sem pressa. Mas preciso.', 'Lá na cabana eu preciso de {itens}. Se puder.', '...{itens}. Pago o justo.'],
      fish: ['O rio está calmo. Me traz {itens}.', 'Hoje eu não consegui pescar. Se puder, {itens}.'],
    },
    thanks: {
      item: ['Obrigado. Ajudou.', 'Era isso mesmo. Bom trabalho.', '...Valeu. De verdade.'],
      fish: ['Peixe bom. Você pesca bem.', 'Obrigado. O rio gosta de você.'],
    },
  },
  iara: {
    ask: {
      item: ['Oi! É para um trabalho da escola: preciso de {itens}. Você me ajuda? Juro que fica bonito no final!', 'Quero pintar uma natureza-morta e preciso de {itens}. Você tem?', 'Posso pedir uma coisa? Eu juntei minhas moedas e preciso de {itens}.'],
      fish: ['Quero desenhar um peixe de verdade, de pertinho. Você me traz {itens}? Depois eu devolvo para a cozinha!', 'A professora pediu um desenho de bicho do rio. Consegue {itens}?'],
    },
    thanks: {
      item: ['Obrigada! Já sei qual cor vou misturar primeiro.', 'Você salvou meu trabalho da escola! Vou te dar um desenho, prometo.', 'Eba! Ficou perfeito. Obrigada, {nome}!'],
      fish: ['Olha as escamas! Tem um azul escondido aqui que eu nunca vi. Obrigada!', 'Obrigada! Vou desenhar rapidinho antes de virar janta.'],
    },
  },
  caleb: {
    ask: {
      item: ['[neutro]Oi. É meio chato pedir, mas a vó precisa de {itens}. Se você conseguir... valeu.', '[neutro]Preciso de {itens}. Pode ser sem pressa. Quer dizer, até amanhã.', '[envergonhado]Eu ia buscar sozinho, mas não sei onde fica. {itens}, se der.'],
      fish: ['[neutro]A vó quer peixe no jantar e eu não sei pescar. Você traz {itens}?', '[envergonhado]Tentei pescar ontem. Perdi a linha. E a dignidade. Me arruma {itens}?'],
    },
    thanks: {
      item: ['[sorriso]Valeu mesmo. A vó vai ficar feliz.', '[sorriso]Era exatamente isso. Obrigado.', '[contente]Você é bom nisso. Quer dizer... obrigado.'],
      fish: ['[sorriso]Peixe de verdade. A vó vai achar que fui eu. Não vou contar.', '[contente]Valeu. Um dia você me ensina a pescar?'],
    },
  },
  lucio: {
    ask: {
      item: ['[neutro]Aqui em cima eu preciso de {itens}. Se subir, traz. Pago em moedas.', '[neutro]Preciso de {itens} antes que o tempo vire.', '[desconfiado]Não sou de pedir. Mas uma ajuda com {itens} me faria bem.'],
      fish: ['[neutro]A nascente anda boa de peixe, mas meus joelhos não. Traz {itens}.', '[neutro]Quero {itens} para o fogo de hoje. Você pesca melhor que eu.'],
    },
    thanks: {
      item: ['[contente]Trabalho direito. Tome.', '[neutro]Era isso. Obrigado por subir.', '[contente]Você cumpre o que diz. Isso tem valor aqui em cima.'],
      fish: ['[contente]Peixe bom. Vai pra brasa hoje.', '[neutro]Obrigado. Assim eu poupo os joelhos.'],
    },
  },
};
