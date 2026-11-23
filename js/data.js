/* Dados do jogo: itens, cultivos, árvores, moradores, missões e loja. */

const START_AGE = 22;
const START_COINS = 60;
const DAY_START = 6 * 60;          // 06:00, em minutos
const DAY_END = 26 * 60;           // 02:00 da madrugada seguinte: o personagem precisa descansar
const MS_PER_GAME_MIN = 900;       // 54 s reais por hora de jogo (9 s a cada 10 min) → 20 horas em 18 minutos ativos
/* Comestíveis do jogo (regra do vale): só os itens desta lista podem ser comidos, cada um
   com o valor "food" (energia recuperada) definido no item. Outras flores e plantas não. */
const EDIBLE = ['laranja', 'goiaba', 'amora', 'fruta_cristal', 'narciso', 'ovo', 'sardinha', 'tucunare', 'morango', 'alga', 'milho', 'melao', 'repolho_roxo'];
const MAX_ENERGY = 100;
const INV_SIZE = 30, HOTBAR = 10, CHEST_SIZE = 20, STACK = 99;

/* kind: tool | seed | sapling | hat | quest | item.  sell = preço de venda.  food = energia que recupera ao comer. */
const ITEMS = {
  enxada:   { name: 'Enxada',    kind: 'tool', desc: 'Prepara a terra para o plantio.' },
  regador:  { name: 'Regador',   kind: 'tool', desc: 'Rega a terra. Reabasteça no lago.' },
  machado:  { name: 'Machado',   kind: 'tool', desc: 'Corta galhos e árvores comuns.' },
  picareta: { name: 'Picareta',  kind: 'tool', desc: 'Quebra pedras pequenas.' },
  foice:    { name: 'Foice',     kind: 'tool', desc: 'Corta o mato.' },
  espada:   { name: 'Espada simples', kind: 'tool', desc: 'Velha, mas firme. Treine no boneco da fazenda.' },
  vara:     { name: 'Vara de bambu', kind: 'tool', rod: true, desc: 'A primeira vara de Tomé. Na beira da água, segure o clique sobre a água (ou Espaço, virado para ela) e solte para lançar.' },
  vara_fibra: { name: 'Vara de fibra de vidro', kind: 'tool', rod: true, bait: true, desc: 'Leve e firme. Aceita isca de minhoca, que faz o peixe morder mais rápido.' },
  minhoca:  { name: 'Minhoca', kind: 'bait', price: 20, desc: 'Isca simples. Carregue na vara de fibra de vidro pelo inventário: cada lançamento usa uma.' },

  sem_rabanete: { name: 'Sementes de rabanete', kind: 'seed', crop: 'rabanete', price: 12, desc: '' },
  sem_tomate:   { name: 'Sementes de tomate',   kind: 'seed', crop: 'tomate',   price: 20, desc: '' },
  sem_abobora:  { name: 'Sementes de abóbora',  kind: 'seed', crop: 'abobora',  price: 42, desc: '' },
  sem_morango:  { name: 'Sementes de morango',  kind: 'seed', crop: 'morango',  price: 150, desc: '' },
  sem_milho:         { name: 'Sementes de milho',        kind: 'seed', crop: 'milho',        price: 150, desc: '' },
  sem_melao:         { name: 'Sementes de melão',        kind: 'seed', crop: 'melao',        price: 80,  desc: '' },
  sem_repolho_roxo:  { name: 'Sementes de repolho roxo', kind: 'seed', crop: 'repolho_roxo', price: 100, desc: '' },
  milho:        { name: 'Milho',        cat: 'vegetal', sell: 50,  food: 25,  desc: 'Espiga dourada de verão, docinha. Comestível: recupera 25 de energia.' },
  melao:        { name: 'Melão',        cat: 'fruta',   sell: 250, food: 113, desc: 'Redondo, perfumado e muito doce. Comestível: recupera 113 de energia.' },
  repolho_roxo: { name: 'Repolho roxo', cat: 'vegetal', sell: 260, food: 75,  desc: 'Folhas firmes e roxas, boas para salada. Comestível: recupera 75 de energia.' },
  rabanete: { name: 'Rabanete', sell: 20, desc: 'Crocante e ardidinho.' },
  tomate:   { name: 'Tomate',   sell: 60, desc: 'Vermelho e suculento.' },
  abobora:  { name: 'Abóbora',  sell: 88, desc: 'Pesada e doce.' },
  morango:  { name: 'Morango',  cat: 'fruta', sell: 320, food: 30, desc: 'Fruta vermelha, perfumada e rara por aqui. Comestível: recupera 30 de energia. Dona Celeste adora.' },

  muda_laranja: { name: 'Muda de laranjeira', kind: 'sapling', tree: 'laranja', price: 60, desc: 'Vira árvore em 5 dias. Dá frutos a cada 3.' },
  muda_goiaba:  { name: 'Muda de goiabeira',  kind: 'sapling', tree: 'goiaba',  price: 70, desc: 'Vira árvore em 6 dias. Dá frutos a cada 3.' },
  laranja: { name: 'Laranja', sell: 16, food: 15, desc: 'Colhida do pé. Comestível: recupera 15 de energia.' },
  goiaba:  { name: 'Goiaba',  sell: 20, food: 18, desc: 'Perfumada. Comestível: recupera 18 de energia.' },

  madeira: { name: 'Madeira', sell: 3, desc: 'De galhos e árvores comuns.' },
  pedra:   { name: 'Pedra',   sell: 3, desc: 'De pedras quebradas.' },
  racao:   { name: 'Ração',   price: 10, desc: 'Coloque no comedouro do galinheiro.' },
  ovo:     { name: 'Ovo',     sell: 8, food: 20, desc: 'Fresquinho. Comestível: recupera 20 de energia.' },
  amora:    { name: 'Amora silvestre', sell: 7, food: 8, desc: 'Colhida no bosque, na serra e, no outono, pela vila. Comestível: recupera 8 de energia.' },
  narciso:        { name: 'Narciso', cat: 'flor', sell: 30, food: 10, desc: 'Flor amarela da primavera. Nasce na beira dos caminhos da vila. Comestível (só aqui no vale, não na vida real!): recupera 10 de energia.' },
  ervilha_cheiro: { name: 'Ervilha-de-cheiro', cat: 'flor', sell: 45, desc: 'Flor perfumada do verão, em tons de rosa e lilás.' },
  acafrao:        { name: 'Flor de açafrão', cat: 'flor', sell: 55,  desc: 'Flor roxa que fura a neve no inverno.' },
  azevinho:       { name: 'Azevinho',         sell: 70,  desc: 'Ramo de folhas pontudas com bagas vermelhas. Enfeite de inverno.' },
  fruta_cristal:  { name: 'Fruta de cristal', sell: 130, food: 40, desc: 'Rara. Fria e translúcida, aparece só no inverno. Comestível: recupera 40 de energia.' },
  cogumelo: { name: 'Cogumelo',        sell: 9, desc: 'Encontrado à sombra das árvores.' },
  flor:     { name: 'Flor-do-campo', cat: 'flor', sell: 6, desc: 'Simples e bonita.' },

  sardinha: { name: 'Sardinha', kind: 'fish', food: 22, desc: 'Um peixe comum na vila. Aparece no rio e nos lagos em qualquer estação, mais de dia. Comestível: recupera 22 de energia.' },
  alga:     { name: 'Alga', sell: 2, food: 3, eatAsk: 'Comer alga?', desc: 'Fita verde e escorregadia que veio na linha de pesca. Recupera 3 de energia.' },
  musgo:    { name: 'Musgo', kind: 'refugo', desc: 'Um tufo de musgo encharcado que veio na linha de pesca. Sem utilidade no momento.' },
  lixo:     { name: 'Lixo', kind: 'refugo', desc: 'Uma bota velha e furada que veio na linha de pesca. Sem utilidade no momento.' },
  tucunare: { name: 'Tucunaré', kind: 'fish', food: 32, desc: 'Peixe de lago, valente e bonito, com uma mancha escura perto do rabo. Briga mais que a sardinha. Comestível: recupera 32 de energia.' },

  chapeu_palha:    { name: 'Chapéu de palha',    kind: 'hat', hat: 'palha',    price: 200, desc: 'Sombra para os dias de roça.' },
  boina:           { name: 'Boina',              kind: 'hat', hat: 'boina',    desc: 'Presente de Iara.' },
  chapeu_pescador: { name: 'Chapéu de pescador', kind: 'hat', hat: 'pescador', desc: 'Feito por Tomé.' },
  encomenda:   { name: 'Encomenda de tintas', kind: 'quest', desc: 'Estojo de tintas da Iara, para a aula de artes. Entregue a ela.' },
  quadro_fonte: { name: 'Quadro da fonte', kind: 'decor', desc: 'Cópia de uma pintura da fonte feita por Iara. Pode ser pendurado na parede da sua casa (escolha o quadro no Inventário).' },
  chapeu_tome: { name: 'Chapéu velho de Tomé', kind: 'quest', desc: 'Encontrado no bosque.' },
  apito: { name: 'Apito de madeira', kind: 'quest', desc: 'Pequeno, gasto de tanto uso, com um entalhe de passarinho. É de Lúcio.' },
};

/* Cultivos. days = noites regadas até a primeira colheita. Os de rebrota têm também:
   stages = noites regadas em cada um dos 5 estágios (somam days); regrow = noites regadas
   entre uma colheita e a próxima (o pé fica); yield = itens por colheita; seasons = estações
   em que a planta cresce (0 Primavera, 1 Verão, 2 Outono, 3 Inverno); sem seasons, cresce o ano
   inteiro. seasonal = a planta já germinada seca ao entrar numa estação em que não cresce. Uma
   semente plantada fora de estação espera (não germina) até chegar uma estação certa.
   Sem rega, a noite não conta; fora de estação, também não. */
const CROPS = {
  rabanete: { name: 'Rabanete', days: 3, seed: 'sem_rabanete' },
  tomate:   { name: 'Tomate',   days: 4, seed: 'sem_tomate' },
  abobora:  { name: 'Abóbora',  days: 13, seed: 'sem_abobora', stages: [1, 2, 3, 4, 3], regrow: 6, yield: 1, seasons: [0, 2], seasonal: true },
  morango:  { name: 'Morango',  days: 5, seed: 'sem_morango', stages: [1, 1, 1, 1, 1], regrow: 4, yield: 1, seasons: [0, 2, 3], seasonal: true },
  milho:    { name: 'Milho',    days: 14, seed: 'sem_milho', stages: [2, 3, 3, 3, 3], regrow: 4, yield: 1, seasons: [1, 2], seasonal: true, tall: true },
  melao:    { name: 'Melão',    days: 12, seed: 'sem_melao', stages: [1, 2, 3, 3, 3], yield: 1, seasons: [1], seasonal: true },
  repolho_roxo: { name: 'Repolho roxo', days: 9, seed: 'sem_repolho_roxo', stages: [1, 1, 2, 2, 3], yield: 1, seasons: [1], seasonal: true },
};
const SEASON_NAMES_LOW = ['primavera', 'verão', 'outono', 'inverno'];
const seasonText = list => { const n = list.map(i => (i === 0 ? 'na ' : 'no ') + SEASON_NAMES_LOW[i]); return n.length > 1 ? n.slice(0, -1).join(', ') + ' e ' + n[n.length - 1] : n[0]; };
/* Texto de cultivo gerado dos dados reais (sem números repetidos em descrições). */
function cropSummary(crop) {
  const C = CROPS[crop], prod = ITEMS[crop].name.toLowerCase(), n = C.yield || 1;
  const where = C.seasons ? (C.seasons.length === 1 ? ` ${seasonText(C.seasons)}` : '') : '';
  let t = `Cresce em ${C.days} dias${where}. Produz ${n} ${prod}`;
  t += C.regrow ? ` e volta a produzir a cada ${C.regrow} dias após colher.` : '. Colheita única: plante outra semente para produzir novamente.';
  if (C.seasons && C.seasons.length > 1) t += ` Cresce ${seasonText(C.seasons)}.`;
  if (!C.seasons) t += ' Cresce o ano inteiro.';
  return t;
}
Object.keys(CROPS).forEach(c => { ITEMS[CROPS[c].seed].desc = cropSummary(c) + ' Precisa de rega.'; });
/* Estado de uma plantação { crop, g, w, cyc, dead }: g = noites regadas no ciclo atual;
   cyc = colheitas já feitas (0 = primeira produção); dead = pé seco.
   Devolve { need, ripe, left, stage (1–5 na primeira produção), regrow, frac }. */
function cropState(o) {
  const C = CROPS[o.crop], regrow = !!(C.regrow && o.cyc > 0), need = regrow ? C.regrow : C.days;
  const g = Math.min(o.g || 0, need), ripe = !o.dead && g >= need;
  let stage = 1;
  if (C.stages && !regrow) { let acc = 0; for (let i = 0; i < C.stages.length - 1; i++) { acc += C.stages[i]; if (g >= acc) stage = i + 2; } }
  return { need, ripe, left: Math.max(0, need - g), stage, regrow, frac: need ? g / need : 1 };
}
/* grow = dias até ficar adulta; every = intervalo entre colheitas; n = frutos por colheita. */
const TREES = {
  laranja: { name: 'Laranjeira', grow: 5, every: 3, n: 2, fruit: 'laranja' },
  goiaba:  { name: 'Goiabeira',  grow: 6, every: 3, n: 2, fruit: 'goiaba' },
};

const SHOP = ['sem_rabanete', 'sem_tomate', 'sem_abobora', 'sem_morango', 'sem_milho', 'sem_melao', 'sem_repolho_roxo', 'muda_laranja', 'muda_goiaba', 'racao', 'chapeu_palha', 'minhoca'];
const HEN_PRICE = 130, MAX_HENS = 4;

/* Aparência. Todas as opções valem para qualquer gênero. */
const mkLook = (skin, hair, hairColor, top, topColor, bottom, bottomColor, extra) =>
  Object.assign({ gender: 'n', skin, hair, hairColor, top, topColor, bottom, bottomColor, shoeColor: '#3a2a22', accessory: null, accColor: '#e04a3a', hat: null }, extra);
const DEFAULT_LOOK = mkLook('s3', 'longoLiso', 'preto', 'camiseta', '#3f86d0', 'calca', '#6a5038', { gender: 'f' });

/* Lugar e história. Nos textos: {nome} = personagem, {fazenda} = nome da fazenda,
   {g:masculino|feminino|neutro} = forma conforme o gênero escolhido, {pet} = nome do bicho. */
const VILA = 'Vila Acapulco', REGIAO = 'Vale do Orvalho', AVO = 'Antero';
const LETTER = {
  greet: '{g:Meu neto querido|Minha neta querida|Meu bem querido}, {nome},',
  body: [
    'Se este envelope chegou até você, é porque eu não pude entregar em mãos. Não fique triste por muito tempo: tive uma vida boa, com terra debaixo das unhas e gente querida por perto.',
    'Lá no ' + REGIAO + ', pertinho da ' + VILA + ', ficou o meu velho sítio. Faz anos que ninguém cuida dele, e imagino que o mato e as pedras já tomaram conta de tudo. Mas a terra é boa, e o povo da vila tem o coração maior que a praça.',
    'Eu sempre soube que um dia você ia cansar de tela acesa e relógio apressado. Quando esse dia chegar, o sítio é seu. Mandei pintar a placa do portão com o nome que você vai dar a ele: {fazenda}.',
    'Plante devagar, descanse quando precisar e deixe a vila te conhecer.',
  ],
  sign: 'Com todo o amor,\nVô ' + AVO,
};
const SEASONS = ['Primavera', 'Verão', 'Outono', 'Inverno'];
const SEASON_DAYS = 29;                            // cada estação tem exatamente 29 dias
/* A partida começa numa segunda-feira; a semana continua entre estações. */
const WEEKDAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const WEEKDAYS_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
/* Coletáveis sazonais da Vila Acapulco.
   count(r) = quantos surgem numa noite (r = sorteio de 0 a 1);
   items = espécie e peso: escolhida depois de saber a quantidade. */
const SEASONAL_FORAGE = [
  { count: r => 1 + (r < 0.2 ? 1 : 0), items: [['narciso', 1]] },                 // primavera: média 1,2
  { count: r => 1 + (r < 0.2 ? 1 : 0), items: [['ervilha_cheiro', 1]] },          // verão: média 1,2
  { count: r => (r < 0.9 ? 1 : 0), items: [['amora', 1]] },                       // outono: média 0,9
  { count: r => (r < 0.7 ? 1 : 0), items: [['acafrao', 0.54], ['azevinho', 0.38], ['fruta_cristal', 0.08]] },   // inverno: média 0,7
];
const SEASONAL_MAX = 12;                           // limite de coletáveis sazonais no chão da vila
const PET_DAY = 12;                                // dia 12 da primavera do ano 1
const PETS = { gato: { name: 'Gato', baby: 'gatinho', names: ['Bolinha', 'Pipoca', 'Tigrinho', 'Mingau'] }, cachorro: { name: 'Cachorro', baby: 'filhote', names: ['Paçoca', 'Bolota', 'Caramelo', 'Faísca'] } };

/* Amizade: 100 pontos por coração, até 5. */
const FRIEND = { talk: 12, love: 45, like: 25, neutral: 12, dislike: -6, max: 500 };

/* Moradores. sched = [minuto do dia, caminho [[x,y],...]] no mapa externo (ou 'loja').
   talk[0|1|2] = falas com 0–1, 2–3 e 4–5 corações. */
const VILLAGERS = [
  { id: 'celeste', portrait: 'celeste', name: 'Dona Celeste', place: 'no Armazém, na vila (mora no andar de cima)',
    bio: 'Dona do Armazém. Prática, acolhedora e sabe de tudo o que se planta na região.',
    look: mkLook('s4', 'coque', 'grisalho', 'blusa', '#c8683a', 'saia', '#5a4a6a'),
    love: ['laranja', 'flor', 'morango'], like: ['tomate', 'ovo', 'goiaba', 'narciso'], dislike: ['pedra', 'madeira'],
    giftPts: { morango: 150 },                                  // valor base próprio (substitui o de "adora")
    giftLine: { morango: 'Morango! Você acertou em cheio. Vou separar alguns para uma receita especial. Muito obrigada!' },
    sched: [[360, 'loja'], [1080, [[510, 160], [590, 186]]], [1290, [[590, 186], [510, 160]]], [1300, 'residencia']],   // 18h: praça; 21h40: sobe para casa, em cima do Armazém
    talk: [['Precisando de semente, é só falar. Rabanete é o mais rápido para começar.', 'O lago da sua fazenda serve para encher o regador. Planta sem água não cresce.', '{fazenda} ficou parado tanto tempo... É bom ver fumaça naquela chaminé de novo.'],
      ['Guardei umas mudas boas para você. Árvore dá trabalho no começo e alegria por anos.', 'Sabe que a vila anda mais animada desde que você chegou?', 'Meu marido plantou a laranjeira da praça. Toda florada eu lembro dele.'],
      ['Você já é de casa. Quando eu me aposentar, quero o Armazém em boas mãos... só pensando alto.', 'Hoje sonhei com {fazenda} todo florido. Acordei e vi que já não é mais sonho.', 'Senta um pouco, toma um café. Freguês eu atendo depois.']],
    again: 'Já conversamos hoje, mas volte sempre: a porta fica aberta.',
    gift: { love: 'Ah! Isso me lembra coisas boas. Muito obrigada, de coração.', like: 'Que gentileza! Vai direto para a minha cozinha.', neutral: 'Obrigada por lembrar de mim.', dislike: 'Hum... vou guardar no depósito, quem sabe serve.' },
    scene: { lines: ['Olha, fiz questão de separar isto para você.', 'Era do meu marido. Chapéu bom tem que trabalhar, não ficar em gaveta.'], item: 'chapeu_palha' } },
  { id: 'honorio', portrait: 'honorio', name: 'Seu Honório', place: 'em frente à casa dele ou no banco da praça',
    bio: 'Carpinteiro aposentado. Resmunga de tudo, mas conserta o que encontra quebrado.',
    look: mkLook('s5', 'careca', 'grisalho', 'camisa', '#8a5e36', 'calca', '#3a3a4a'),
    love: ['goiaba', 'cogumelo'], like: ['madeira', 'abobora'], dislike: ['flor', 'amora'],
    sched: [[360, [[755, 160]]], [600, [[755, 164], [690, 166], [612, 212]]], [1020, [[690, 166], [755, 164], [755, 160]]]],
    talk: [['Hunf. Mais {g:um moço|uma moça|alguém} da cidade achando que roça é passeio. Vamos ver quanto dura.', 'Esse banco da praça está caindo aos pedaços. Ninguém mais conserta nada.', 'No meu tempo, machado se afiava todo dia.'],
      ['Vi sua plantação de longe. Não está... ruim.', 'Madeira boa é a do bosque, depois da ponte velha. Só não corte tudo de uma vez.', 'Você trabalha direito. Não conte a ninguém que eu disse isso.'],
      ['Fiz uma caixinha de ferramentas. Era para ser surpresa, mas eu não sei guardar segredo.', 'Você me lembra eu mesmo aos vinte e poucos. Só que com mais educação.', 'Senta aí. Deixa eu contar como era esta vila quando o rio enchia.']],
    again: 'Já falei tudo o que tinha para falar hoje. Vá trabalhar.',
    gift: { love: 'Ora... como você sabia? Hunf. Obrigado.', like: 'Isso serve. Serve bem.', neutral: 'Tá, tá. Obrigado.', dislike: 'E o que eu faço com isso? Enfeito a janela?' },
    scene: { lines: ['Escuta. Eu não digo isso a qualquer um.', 'A vila precisava de alguém teimoso assim. Tome: sementes da minha horta antiga.'], item: 'sem_abobora', n: 4 } },
  { id: 'bia', portrait: 'bia', name: 'Bia', place: 'perto da porteira da fazenda de manhã, na praça à tarde',
    bio: 'Cria galinhas desde pequena. Falante, curiosa e apaixonada por bicho.',
    look: mkLook('s2', 'rabo', 'ruivo', 'jardineira', '#3fa070', 'short', '#3a4a8a'),
    love: ['ovo', 'amora'], like: ['rabanete', 'flor', 'laranja', 'fruta_cristal'], dislike: ['pedra'],
    sched: [[360, [[515, 312]]], [510, [[460, 312], [460, 164], [428, 164]]], [840, [[460, 164], [596, 176]]], [1140, [[460, 164], [460, 312], [515, 312]]]],
    talk: [['Oi! Você é quem ficou com {fazenda}, né? Tem um galinheiro lá no sul do terreno, sabia?', 'Galinha feliz bota melhor. É ciência! Quer dizer, é o que eu acho.', 'Se precisar de ração, a Dona Celeste vende.'],
      ['Como estão as meninas do galinheiro? Fez carinho hoje?', 'Eu dou nome para todas as minhas. A mais brava se chama Dona Encrenca.', 'Um dia eu quero ter cabras também. E um burrinho. E...'],
      ['Você virou a pessoa com quem eu mais converso. Não conta para as galinhas.', 'Guardei o primeiro ovo que você me deu. Brincadeira! Comi. Estava ótimo.', 'Quando eu tiver meu sítio, você me ajuda a montar?']],
    again: 'De novo por aqui? Que bom! Mas hoje eu já contei todas as novidades.',
    gift: { love: 'AAAH! Meu preferido! Você é demais!', like: 'Oba, adorei! Obrigada!', neutral: 'Ah, obrigada! Que fofo.', dislike: 'Uma... pedra? Tá, é uma pedra bonita, eu acho.' },
    scene: { lines: ['Olha o que eu trouxe! Sobrou ração do meu galinheiro.', 'Quem cuida bem de galinha tem a minha amizade.'], item: 'racao', n: 8 } },
  { id: 'tome', portrait: 'tome', name: 'Tomé', place: 'na beira do rio de manhã, na praça à tarde',
    bio: 'Vive numa cabana no bosque. Fala pouco, observa muito e conhece cada trilha.',
    look: mkLook('s3', 'medio', 'castanho', 'camisa', '#5a7a5a', 'calca', '#5a4a3a'),
    love: ['amora', 'cogumelo'], like: ['laranja', 'ovo', 'azevinho'], dislike: ['tomate'],
    sched: [[360, [[1012, 300], [1056, 322]]], [780, [[1012, 300], [1000, 180], [900, 174], [668, 180]]], [1080, [[900, 174], [1010, 150]]]],   // contorna a lagoa
    talk: [['...Bom dia.', 'O bosque dá amora e cogumelo. Cada dia num canto diferente.', 'Árvore cortada volta. Demora uns dias, mas volta.'],
      ['O rio estava claro hoje. Sinal de tempo firme.', 'Você pisa leve no bosque. Os bichos nem se assustam.', 'Quase ninguém vem até a cabana. Pode vir.'],
      ['Eu não sou de falar. Mas com você é fácil.', 'Achei um ninho de sabiá perto da sua cerca. Deixei quieto.', 'Quando chover forte, se abrigue na cabana. A porta não tem tranca.']],
    again: '...Já falamos hoje.',
    gift: { love: 'Isso é... do que eu mais gosto. Obrigado.', like: 'Bom. Obrigado.', neutral: 'Obrigado.', dislike: 'Hum. Não sou muito de tomate.' },
    scene: { lines: ['Fiz isto nas noites de chuva.', 'Protege do sol na beira do rio. É seu.'], item: 'chapeu_pescador' } },
  /* Iara: 13 anos, sexta série. Pinta paisagens da vila e inventa nomes para as cores que mistura.
     Rotina, falas, presentes e acontecimentos próprios (ver IARA e game.js). Sem romance. */
  { id: 'iara', portrait: 'iara', name: 'Iara', routine: 'iara',
    place: 'na escola de manhã nos dias úteis; à tarde, pintando junto à fonte ou desenhando na praça; à noite, em casa',
    bio: 'Tem 13 anos e está na sexta série. Gentil e distraída, pinta paisagens da vila e inventa nomes para as cores que mistura. Toma chá de maçã com canela toda manhã e sempre tem um pinguinho de tinta nos dedos.',
    look: mkLook('s6', 'longoCacheado', 'preto', 'jardineira', '#9a74d8', 'short', '#8a64c8', { gender: 'f', body: 'f', kid: true, paint: true, shoeColor: '#f4f4f4', accessory: 'laco', accColor: '#f2c84a' }),
    lookWinter: mkLook('s6', 'longoCacheado', 'preto', 'moletom', '#8a64d0', 'calca', '#4a3a7a', { gender: 'f', body: 'f', kid: true, paint: true, shoeColor: '#5a3a24', hat: 'gorro', hatColor: '#5a58b8', accessory: 'cachecol', accColor: '#e0a23a' }),
    birthday: { season: 1, day: 4 },                                        // 4 do Verão
    /* preferências: itens individuais têm prioridade sobre as categorias (cat dos itens) */
    prefs: {
      love: { ids: ['pincel', 'bolo_morango'], cats: ['flor_aquatica', 'concha_rara'] },
      like: { ids: ['narciso'], cats: ['flor', 'pao'] },
      neutral: { ids: ['coco'], cats: ['peixe'] },
      dislike: { ids: ['rabanete', 'espinafre'], cats: ['leite'] },
    },
    love: [], like: ['narciso', 'flor', 'ervilha_cheiro', 'acafrao'], dislike: ['rabanete'],
    sched: [[360, [[725, 312]]]],                                           // a rotina de verdade vem de iaraSchedule (game.js)
    talk: [
      ['Oi! Você é de {fazenda}, né? Eu sou a Iara. Desculpa a mão suja de tinta.', 'Estou fazendo um desenho da vila inteira. Ainda faltam umas oitenta casas... brincadeira, são menos.', 'Você sabia que a fonte muda de cor conforme a hora? Quase ninguém repara.', 'Eu pinto os mesmos lugares em épocas diferentes, para ver como eles mudam.'],
      ['Hoje misturei um verde e chamei de "verde de folha depois da chuva". Gostou do nome?', 'Meu projeto é pintar a fonte nas quatro estações. Já pensou ver tudo junto?', 'O Leo diz que eu desenho devagar. Eu digo que eu desenho com atenção.', 'Você pode usar meus pincéis, se quiser. Só não esqueça de limpar depois.'],
      ['Quer ver meu caderno? Ainda tem desenhos tortos, mas esses também ficam.', 'Quando eu fico sem ideia, venho ver você trabalhar na roça. Sempre volto com uma.', 'Inventei um amarelo chamado "manhã preguiçosa". É o da sua janela quando você acorda tarde.', 'O Leo e eu combinamos de desenhar a serra um dia. Ele só quer ir por causa do lanche.'],
      ['Você virou alguém que eu conto as coisas antes de contar para os outros. É estranho falar isso em voz alta.', 'Guardei um cantinho do caderno só para desenhos da sua fazenda.', 'Se um dia eu tiver uma exposição na escola, você vai ser a primeira pessoa a ver. Prometido.', 'Obrigada por olhar as coisas comigo. Quase ninguém tem paciência.'],
    ],
    /* falas por lugar, hora, estação e situação (game.js escolhe sem repetir a anterior) */
    ctx: {
      escola: ['Eu estava prestando atenção... só desenhei a janela porque a luz ficou bonita.', 'A professora pediu um desenho do bairro. Eu fiz a fonte. De novo.', 'No intervalo eu fico no cantinho dos desenhos. É o lugar mais quieto da escola.'],
      fonte: ['A água não é só azul. Olha ali: tem um pedacinho de verde e outro quase dourado.', 'Eu chamo essa cor de "azul de fonte gelada". Combina, né?', 'Se você ficar parado um pouco, a fonte faz um barulho que parece conversa.'],
      praca: ['Daqui dá para ver a vila inteira mudando de cor no fim da tarde.', 'Estou desenhando as pessoas passando. Você entrou no desenho agora, tá?', 'O banco da praça é o melhor lugar para esperar o pôr do sol.'],
      casaManha: ['Maçã com canela tem cheiro de começar o dia sem pressa.', 'Estou arrumando o estojo para a aula. Lápis, pincel, borracha... e mais um pincel, por garantia.', 'Bom dia! Ainda estou acordando. O chá ajuda.'],
      casa: ['Aqui é o meu cantinho de pintura. É pequeno, mas cabe muita coisa.', 'Estou terminando um desenho antes de dormir. Ou tentando.', 'Quer um pouco de chá? Ah, já acabou. Amanhã eu faço mais.'],
      chuva: ['Hoje inventei uma cor chamada "cinza que dá vontade de ficar em casa".', 'Dia de chuva é dia de pintar de memória. A memória erra um pouco, mas é bonito.', 'A chuva deixa tudo mais escuro e mais brilhante ao mesmo tempo. Como pode?'],
      pintando: ['Hoje é dia de pintar a fonte para a minha coleção! Não repara na bagunça.', 'Não posso parar agora, a luz está perfeita. Volta mais tarde para ver?', 'Estou registrando como a fonte está nesta estação. Cada uma fica de um jeito.'],
      pintandoChuva: ['Choveu no meu dia de pintar a fonte! Tudo bem: estou pintando aqui em casa, olhando meus esboços.'],
      pronta: ['Terminei a pintura da fonte desta estação! Quer ver?', 'A pintura da fonte ficou pronta. Ainda estou achando que o céu ficou bonito demais.'],
      estacao: [['Na primavera a fonte fica cheia de pétalas boiando. Parece de mentira.', 'Primavera é a estação das cores que ninguém consegue nomear.'],
        ['No verão a luz fica tão forte que eu tenho que apertar os olhos para pintar.', 'Meu aniversário é no verão! Dia 4. Não que eu esteja lembrando você, né.'],
        ['No outono as folhas caem na fonte e viram barquinhos.', 'Outono tem um laranja que eu ainda não consegui fazer igual.'],
        ['No inverno meu gorro é o maior companheiro de pintura.', 'A água da fonte fica com um brilho de vidro no inverno. Quase dá para ouvir o frio.']],
      cor: ['Lembra do "{cor}"? Usei na pintura de ontem e ficou lindo!', 'Toda vez que uso o "{cor}" eu lembro da flor que você trouxe.'],
    },
    again: ['Já conversamos hoje, não foi? Desculpa, eu me distraio.', 'Ah, oi de novo! Eu estava contando quantos tons de verde tem nessa árvore.', 'Ainda por aqui? Pode sentar, se quiser. Eu não falo muito quando estou desenhando.'],
    gift: { love: 'Nossa! É para mim? Já tive uma ideia do que fazer com isso!', like: 'Eu gostei! Obrigada por lembrar de mim.', neutral: 'Obrigada! Vou guardar.', dislike: 'Ah… eu não gosto disso. Mas obrigada por lembrar de mim.' },
    bdayGift: { good: 'Você lembrou do meu aniversário! Que presente lindo!', neutral: 'Um presente de aniversário? Obrigada por lembrar!', bad: 'Você lembrou… mas eu não gosto muito disso.' },
    limit: { day: 'Você já me deu um presente hoje! Guarda esse para outro dia, tá?', week: 'Essa semana você já me deu presentes demais. Assim eu fico sem graça!' } },

  /* Caleb: neto da Dona Celeste. Chega à vila na primeira visita ao Armazém em horário de atendimento (uma vez só).
     Gótico/emo, reservado e observador; gosta de computador e de música. Amizade sem romance, até 8 corações.
     Rotina própria (calebSchedule, game.js); presentes sem preferências cadastradas (todos neutros). */
  { id: 'caleb', portrait: 'caleb', art: 'caleb', name: 'Caleb', routine: 'caleb', maxHearts: 8, arrives: true,
    place: 'no Armazém CELESTE (mora com a avó no andar de cima): à tarde no cantinho do notebook, no fim da tarde no bosque e, à noite, perto da lagoa; às sextas, na praça',
    bio: 'Neto da Dona Celeste, chegou para morar com a avó em cima do Armazém. Reservado e observador, gosta de computador e de música. Fala pouco no começo, mas é educado; com o tempo, aparecem o humor e o carinho nos pequenos gestos.',
    look: mkLook('s2', 'emo', 'pretoQuente', 'camisaAberta', '#6a2430', 'calca', '#3a3238', { gender: 'm', body: 'm', shoeColor: '#221c22', earring: true, innerColor: '#1e1a22' }),
    love: [], like: [], dislike: [],
    sched: [[360, 'residencia']],                                          // a rotina de verdade vem de calebSchedule (game.js)
    talk: [
      ['[neutro]Minha avó conhece todo mundo. Eu ainda confundo os caminhos.', '[neutro]Não tô bravo. Só tava pensando.', '[neutro]Oi. Se precisar de alguma coisa da loja, a vó é que sabe onde fica tudo.', '[neutro]Ainda não sei o nome de metade das ruas. A vila tem rua?'],
      ['[sorriso]Descobri que o sinal de internet aqui só pega perto da janela. Virou esporte.', '[neutro]A vó acorda antes do sol. Ainda tô tentando entender como.', '[sorriso]Tô montando uma playlist com barulho de chuva por baixo. Fica melhor do que parece.', '[neutro]Você trabalha na roça o dia inteiro? Respeito.'],
      ['[sorriso]Você sempre chega quando eu tô no meio de uma música. Virou piada interna. Comigo mesmo.', '[contente]Carreguei as caixas da vó hoje. Ela disse que eu carrego tudo torto. Mas carreguei.', '[sorriso]Se quiser, um dia te mostro umas músicas. Só não ri das letras.', '[sorriso]Comecei a gostar do silêncio daqui. Não conta pra ninguém.'],
      ['[contente]É estranho: na cidade eu conhecia mais gente e conversava menos.', '[sorriso]Guardei a última fatia do bolo da vó. Era pra mim... mas pode ficar com ela.', '[contente]Valeu por sempre parar pra falar comigo. Mesmo quando eu respondo pouco.', '[sorriso]Se um dia você quiser companhia pra caminhar no bosque, é só chamar.'],
    ],
    /* falas por lugar e situação (game.js escolhe sem repetir a anterior) */
    ctx: {
      almoco: ['[neutro]Hora do almoço. A vó diz que ninguém carrega caixa de barriga vazia.', '[sorriso]Ela me deixou mexer no estoque. Acho que é um teste.'],
      notebook: ['[neutro]Tô organizando umas músicas. Pode falar, eu tiro um fone.', '[neutro]A internet daqui é lenta, mas é honesta.', '[sorriso]Esse canto virou meu. A vó jura que a ideia foi dela.'],
      bosque: ['[neutro]O bosque é bem mais quieto que a cidade. Ainda tô me acostumando.', '[neutro]Achei uma trilha boa pra caminhar. Ninguém pergunta nada no caminho.'],
      lago: ['[neutro]Às vezes eu venho aqui só para ouvir a água.', '[sorriso]Fone com música baixinha e a água por cima. Combinação boa.'],
      praca: ['[neutro]Sexta a praça enche um pouco. Eu fico mais no canto.', '[sorriso]A fonte faz um barulho bom pra ficar pensando.'],
      noite: ['[neutro]Daqui a pouco eu subo. A vó só dorme depois que eu subo.', '[sorriso]A loja fechada tem outro clima. Parece outro lugar.'],
      chuva: ['[neutro]Aqui dá para ouvir a chuva sem o barulho dos carros.', '[sorriso]Dia de chuva é dia de notebook sem culpa.'],
      domingo: ['[neutro]Domingo de manhã eu ajudo a vó. Ela diz que é o dia mais movimentado.', '[sorriso]Etiquetar pote é mais difícil do que parece.'],
    },
    again: ['[neutro]A gente já conversou hoje. Mas... pode ficar, se quiser.', '[sorriso]De novo? Tá. Eu não me importo.', '[neutro]Hm? Ah, oi de novo.'],
    gift: { love: '[sorriso]Pra mim? Valeu. De verdade.', like: '[sorriso]Pra mim? Valeu. De verdade.', neutral: '[sorriso]Pra mim? Valeu. De verdade.', dislike: '[neutro]Hm. Obrigado por lembrar de mim.' },
    /* chegada (uma vez só): Celeste apresenta o neto no Armazém */
    arrival: [['celeste', '[contente]Meu neto chegou para morar comigo! Este é o Caleb.'], ['caleb', '[neutro]Oi. Ainda tô conhecendo o lugar.'], ['celeste', '[contente]Você pode mostrar a vila para ele qualquer dia!'], ['caleb', '[envergonhado]Vó… deixa a pessoa fazer as compras primeiro.']] },

  /* Lúcio vive na serra. As falas começam com [expressão] do retrato: neutro, desconfiado, contente, emocionado.
     talk tem quatro faixas: 0 coração, 1–2, 3–4 e 5. Presentes e aniversário têm regras próprias (ver game.js). */
  { id: 'lucio', name: 'Lúcio', map: 'montanha', portrait: 'lucio', hidden: true,
    place: 'na serra, ao norte da vila: perto da tenda de manhã, na mata ou na nascente à tarde, e junto à fogueira à noite',
    bio: 'Vive numa tenda na serra. Conhece plantas, o jeito do tempo e trilhas que pouca gente usa. Fala pouco e escolhe bem as palavras.',
    look: mkLook('s3', 'juba', 'cinzaQuente', 'folhas', '#7a5232', 'calca', '#5a4630', { gender: 'm', beard: 'cheia', shoeColor: '#3a2a22' }),
    birthday: { season: 3, day: 9 },                                         // 9 do Inverno
    love: ['goiaba'], like: ['laranja', 'amora', 'ovo'], neutral: ['madeira', 'pedra'], dislike: ['racao'],
    /* rotina (coordenadas da serra): manhã perto da tenda e na mata, tarde na nascente, noite na fogueira */
    sched: [[360, [[200, 196]]], [480, [[200, 198], [322, 200], [322, 258], [150, 258], [118, 256]]],
      [780, [[150, 258], [322, 260], [462, 260]]], [1080, [[322, 260], [322, 226], [276, 228]]]],
    talk: [
      ['[desconfiado]Se veio conhecer a trilha, pode seguir. Só peço que deixe minhas coisas onde estão.',
        '[neutro]O vento virou pro sul hoje cedo. Amanhã cai sereno na serra, pode apostar.',
        '[desconfiado]A nascente é de quem precisar. A tenda, não. Fique à vontade na primeira.',
        '[neutro]Essa folha larga aí é tanchagem. Serve pra corte. Não arranque à toa.'],
      ['[neutro]Você voltou. Já estava achando que aquela conversa tinha sido só por educação.',
        '[contente]Os sabiás estão fazendo ninho no paredão. Barulhentos, mas chegaram antes de mim. Não reclamo.',
        '[neutro]Ouvi dizer que você está limpando o sítio do seu Antero. Terra cansada agradece quem tem paciência.',
        '[contente]Fiz chá de capim-cidreira. Não ofereço porque a caneca é uma só. Ainda.'],
      ['[desconfiado]Uma vez encontrei a lona rasgada quando voltei. Desde então, qualquer barulho à noite me acorda.',
        '[neutro]Aprendi a ler o céu com um tropeiro, faz muito tempo. Nuvem esfiapada no fim da tarde é chuva em dois dias.',
        '[contente]A Bia subiu aqui atrás de uma galinha fujona. Achamos a danada dormindo dentro da minha bota.',
        '[neutro]Não é que eu não goste da vila. Gosto de descer. Só gosto mais ainda de voltar pra cá.'],
      ['[contente]Tem lugar junto da fogueira. Hoje a conversa pode durar um pouco mais.',
        '[contente]Guardei as sementes da última goiaba que você trouxe. Vão virar muda, se a serra deixar.',
        '[emocionado]Passei anos dizendo que não precisava de ninguém. Ainda digo. Mas é bom quando alguém aparece.',
        '[contente]Se o seu telhado pingar, me chama. Lona eu entendo. Telha, eu aprendo.']],
    again: ['[neutro]Já conversamos hoje. A serra não sai do lugar até amanhã.', '[neutro]Ainda por aqui? Cuidado com a trilha quando escurecer.', '[contente]Se for ficar, pelo menos não pise no alecrim.'],
    meet: ['[desconfiado]Ninguém sobe até aqui sem motivo. Qual é o seu?'],
    gift: { love: '[contente]Você reparou no que eu gosto. Isso tem valor.', like: '[contente]Boa escolha. Vou aproveitar.', neutral: '[neutro]Obrigado por lembrar de mim.', dislike: '[desconfiado]Agradeço a intenção, mas isso não serve muito para mim.' },
    bdayGift: { good: '[emocionado]Você lembrou do meu aniversário? Faz tempo que alguém não aparece por esse motivo.', neutral: '[contente]Um presente de aniversário? Obrigado por lembrar.', bad: '[neutro]É pelo meu aniversário? Entendi… obrigado por vir.' },
    limit: { day: '[neutro]Hoje você já me trouxe uma coisa. Guarde isso aí, que um por dia está de bom tamanho.', week: '[neutro]Essa semana você já me trouxe bastante. Guarde pra outra hora, que eu não fujo daqui.' } },
];
/* Aniversários: Lúcio faz aniversário no dia 9 do Inverno. */
const GIFT_RULES = { lucio: { perDay: 1, perWeek: 2, birthdayMult: 8 }, iara: { perDay: 1, perWeek: 2, birthdayMult: 8 } };
/* Conversa de Iara sobre Lúcio: disponível depois que o jogador conhece Lúcio (uma vez). */
const IARA_LUCIO = {
  lines: ['Você conhece o Lúcio, lá da serra? O pessoal fala dele como se fosse uma história de assombração, mas eu acho que ele só gosta de silêncio.',
    'Eu desenho a serra quase toda semana e nunca vi ele de perto. Fico imaginando a cara dele pela tenda.',
    'Você já foi lá, né? Como ele é?'],
  choices: ['Reservado, mas sabe tudo de plantas.', 'Acho melhor você conhecer por conta própria.'],
  answers: ['Plantas! Então eu já tenho assunto. Quero perguntar o nome das cores do mato. Vou pedir para alguém subir comigo num dia de sol.',
    'Faz sentido. Ninguém conhece ninguém por recado. Um dia eu subo, com alguém da vila junto.'],
};
const villagerById = id => VILLAGERS.find(v => v.id === id);
/* Iara: nomes para a cor do acontecimento de 1 coração e textos das pinturas da fonte. */
const IARA = {
  colorNames: ['Amarelo de manhã preguiçosa', 'Laranja de pétala sonolenta', 'Dourado de abelha distraída'],
  seasonSketch: ['pétalas boiando e as árvores em flor', 'sol forte e a água brilhando', 'folhas caindo na água como barquinhos', 'neve na borda e a água parada como vidro'],
  detail: { x: 650, y: 226, label: 'Uma florzinha entre as pedras' },          // acontecimento de 3 corações (praça)
};

/* Missões.
   goal.count  = ações a realizar (till, plant, water, harvest, feed, clear)
   goal.deliver = itens a entregar a "to" (padrão: quem pediu); são retirados da mochila
   goal.talk   = basta conversar com "to"
   start.items = itens recebidos ao aceitar · after = missão anterior · hearts = corações mínimos com quem pede
   auto = começa sozinha · selfDone = conclui sozinha ao cumprir (as de aprendizado). */
const QUESTS = {
  chegada:  { where: ['loja', 56, 104, 'Armazém'], giver: 'celeste', title: 'Boas-vindas à vila', auto: true, desc: 'Siga a estrada para o leste até a vila, entre no Armazém e clique em Dona Celeste para conversar.',
    goal: { talk: 1 }, done: ['{g:Seja bem-vindo|Seja bem-vinda|Boas-vindas} à ' + VILA + '! Então você é {g:o neto|a neta|quem herdou o sítio} do seu ' + AVO + '. Ele falava de você com um orgulho...', 'Vi a placa nova no portão: {fazenda}. Combina com você.', 'Leve estas sementes de rabanete: é presente de boas-vindas. Brotam rápido.'],
    reward: { items: { sem_rabanete: 6 }, friend: 20 } },
  plantio:  { where: ['fora', 120, 228, 'Roça da fazenda'], giver: 'celeste', title: 'A primeira plantação', after: 'chegada', auto: true, selfDone: true,
    desc: 'Na sua fazenda: are 3 canteiros com a enxada, plante as sementes e regue. Escolha o item na barra e clique (ou toque) na terra ao seu lado.',
    goal: { count: { till: 3, plant: 3, water: 3 } }, reward: { coins: 20 } },
  colheita: { where: ['fora', 120, 228, 'Roça da fazenda'], giver: 'celeste', title: 'A primeira colheita', after: 'plantio', auto: true, selfDone: true,
    desc: 'Regue todos os dias e durma na sua cama: as plantas crescem à noite. Colha 3 cultivos maduros e venda ou guarde.',
    goal: { count: { harvest: 3 } }, reward: { coins: 30, items: { sem_tomate: 3 } } },
  galinheiro: { where: ['galinheiro', 48, 84, 'Comedouro do galinheiro'], giver: 'bia', title: 'O galinheiro vazio', after: 'chegada',
    offer: ['O galinheiro de {fazenda} está vazio há anos! Isso não pode ficar assim.', 'É aquele celeirinho vermelho no sul do terreno: da porteira, desça pela estrada de terra até o fim e vire à esquerda. A porta fica de frente para a estrada.', 'O comedouro é o cocho comprido lá dentro, embaixo da plaquinha. Leve esta ração e coloque 2 porções. Depois me chame: tenho uma galinha que precisa de um lar.'],
    desc: 'O galinheiro é o celeiro vermelho no sul da fazenda (marcado no Mapa, tecla M). Entre pela porta e clique no comedouro — o cocho comprido embaixo da placa "RAÇÃO". Cada clique coloca 1 porção da ração da mochila. Coloque 2 porções e volte a falar com Bia.',
    start: { items: { racao: 5 } }, goal: { count: { feed: 2 } },
    done: ['Comedouro cheio! Perfeito. Então... esta aqui é para você.', 'Ela é mansa e curiosa. Cuida bem dela, tá?'], reward: { hen: 1, friend: 40 } },
  primeiro_ovo: { where: ['galinheiro', 196, 70, 'Ninhos do galinheiro'], giver: 'bia', title: 'O primeiro ovo', after: 'galinheiro',
    offer: ['Galinha alimentada bota um ovo por dia, que aparece no ninho na manhã seguinte.', 'Me traz o primeiro ovo? Quero ver se ela se adaptou.'],
    desc: 'Mantenha ração no comedouro, durma e pegue o ovo nos ninhos, dentro do galinheiro (clique nas caixas de palha). Entregue 1 ovo a Bia.',
    goal: { deliver: { ovo: 1 } }, done: ['Olha que ovo lindo! Ela está feliz, dá para ver.'], reward: { coins: 40, friend: 60 } },

  banco: { where: ['fora', 950, 330, 'Bosque'], giver: 'honorio', title: 'O banco da praça', hearts: 1,
    offer: ['Aquele banco da praça vai derrubar alguém. Eu consertava, mas o braço já não ajuda no machado.', 'Me arrume 6 de madeira e 4 de pedra que eu dou um jeito.'],
    desc: 'Junte 6 de madeira (galhos e árvores do bosque) e 4 de pedra, e entregue a Seu Honório.',
    goal: { deliver: { madeira: 6, pedra: 4 } }, done: ['Hunf. Material bom. Amanhã esse banco aguenta até dança.', 'Fique com isto. Não é esmola, é pagamento.'],
    reward: { coins: 60, friend: 100, world: 'banco' } },
  chapeu: { where: ['fora', 1150, 470, 'Sul do bosque'], giver: 'tome', title: 'O chapéu perdido', hearts: 1,
    offer: ['Perdi meu chapéu no bosque. O vento levou para os lados do sul.', 'Se encontrar... eu agradeço.'],
    desc: 'Procure o chapéu de Tomé no bosque, ao sul do rio, e devolva a ele.',
    goal: { deliver: { chapeu_tome: 1 } }, done: ['É ele. Velho assim e ainda me serve.', 'Obrigado por procurar.'], reward: { coins: 30, friend: 100, items: { amora: 3 } } },
  /* 1 coração de Iara: "Uma cor sem nome" (mesmo id da missão antiga, para não perder saves) */
  flores: { where: ['fora', 950, 330, 'Bosque'], giver: 'iara', title: 'Uma cor sem nome', hearts: 1,
    offer: ['Posso pedir uma coisa? Quero estudar as cores de uma flor de perto, pétala por pétala.', 'Você me traz uma flor-do-campo? Elas nascem no bosque, a leste da vila.'],
    desc: 'Colha uma flor-do-campo no bosque e entregue a Iara, para ela estudar as cores.',
    goal: { deliver: { flor: 1 } }, done: ['Olha só quantas cores numa flor tão pequena! Tem amarelo, tem quase laranja, tem um verde no meio...', 'Misturei tudo na paleta e saiu uma cor nova. Ela ainda não tem nome. Me ajuda a escolher?'], reward: { coins: 35, friend: 100 }, after: null },
  encomenda: { giver: 'celeste', title: 'Encomenda de tintas', hearts: 1, to: 'iara',
    offer: ['Chegou o estojo de tintas que a Iara encomendou para a aula de artes, e eu não posso largar o balcão.', 'Você leva para ela? À tarde ela costuma pintar perto da fonte.'],
    desc: 'Leve o estojo de tintas até Iara (à tarde ela costuma pintar perto da fonte).', start: { items: { encomenda: 1 } },
    goal: { deliver: { encomenda: 1 } }, done: ['Meu estojo novo! Eu já estava misturando café com água para fazer marrom.', 'Agradece a Dona Celeste por mim? Amanhã eu levo para a escola.'], reward: { coins: 25, friend: 100, friendTo: 20, items: { sem_tomate: 4 } } },
  omelete: { where: ['galinheiro', 196, 70, 'Ninhos do galinheiro'], giver: 'bia', title: 'Ovos para a festa', hearts: 2, after: 'primeiro_ovo',
    offer: ['Vou fazer um bolo enorme para a vila e minhas galinhas entraram em greve!', 'Você consegue 3 ovos para mim?'],
    desc: 'Entregue 3 ovos a Bia.', goal: { deliver: { ovo: 3 } }, done: ['Salvou o bolo! Vou guardar o maior pedaço para você.'], reward: { coins: 80, friend: 100 } },

  /* Missões pessoais de Lúcio (1, 3 e 5 corações). */
  lona: { where: ['montanha', 250, 128, 'Lona da tenda de Lúcio'], giver: 'lucio', title: 'Antes da próxima chuva', hearts: 1, need: { madeira: 4 },
    offer: ['[neutro]O tempo está virando. Lá pelo meio da semana chove grosso, e a lona do lado de cá não aguenta outra.', '[desconfiado]Não estou pedindo favor. É uma troca: quatro pedaços de madeira e uma mão firme. Eu pago em moedas e em conselho.'],
    desc: 'Leve 4 madeiras até a tenda de Lúcio, na serra (trilha ao norte da vila). Clique na lona, do lado direito da tenda: no primeiro clique você usa a madeira; depois são 3 reparos, um clique cada. Então fale com Lúcio.',
    goal: { count: { repair: 3 } },
    done: ['[contente]Olha só. Ficou mais firme do que quando era nova.', '[neutro]Agora pode chover. Tome: trabalho bem feito se paga. E o conselho: madeira de galho seco racha menos.'],
    reward: { coins: 50, friend: 80 } },
  lembranca: { where: ['montanha', 588, 158, 'Trilha do rochedo, a leste da nascente'], giver: 'lucio', title: 'O que ficou pelo caminho', hearts: 3, after: 'lona',
    offer: ['[neutro]Perdi uma coisa pequena. Um apito de madeira, deste tamanho.', '[desconfiado]Deve ter caído quando subi o rochedo do leste, depois da nascente. Meus joelhos não querem voltar lá. Os seus ainda querem?'],
    desc: 'Procure o apito de madeira de Lúcio na trilha do rochedo, a leste da nascente, na serra. Clique nele para pegar e devolva a Lúcio.',
    goal: { deliver: { apito: 1 } },
    done: ['[emocionado]É ele...', '[emocionado]Meu irmão que entalhou, quando a gente tinha mais ou menos a sua idade. A gente assobiava de um morro pro outro pra avisar que estava tudo bem.', '[neutro]Ele desceu pro litoral faz muito tempo. Eu fiquei.', '[contente]Às vezes ainda assobio. Vai que o vento leva.'],
    reward: { coins: 30, friend: 100 } },
  fogo: { where: ['montanha', 262, 214, 'Fogueira de Lúcio (18h às 22h)'], giver: 'lucio', title: 'Um lugar junto ao fogo', hearts: 5, after: 'lembranca', selfDone: true,
    offer: ['[contente]Hoje, quando escurecer, passa na fogueira. Sem pressa. Tem batata-doce na brasa.'],
    desc: 'Vá até a fogueira de Lúcio, na serra, entre 18h e 22h, e clique na fogueira ou fale com ele. Se perder o horário, a conversa fica para a noite seguinte.',
    goal: { count: { scene: 1 } },
    reward: { friend: 60, items: { muda_goiaba: 1 } } },
};

const COUNT_LABEL = { till: 'canteiros arados', plant: 'sementes plantadas', water: 'canteiros regados', harvest: 'cultivos colhidos', feed: 'porções no comedouro', repair: 'reparos na lona', scene: 'conversa na fogueira' };

/* Objetos que exigem vários golpes. hp = golpes necessários; energy = energia por golpe;
   tools = ferramentas que funcionam; drop = o que rende ao quebrar; fx = tipo de lasca. */
const RESIST = {
  weed:   { name: 'Mato',   verb: 'Cortar',   tools: ['foice', 'espada'], hp: 1, energy: 1, fx: 'leaf' },
  branch: { name: 'Galho',  verb: 'Cortar',   tools: ['machado'],  hp: 2, energy: 2, drop: ['madeira', 1], fx: 'wood' },
  stone:  { name: 'Pedra',  verb: 'Quebrar',  tools: ['picareta'], hp: 3, energy: 2, drop: ['pedra', 1],   fx: 'stone' },
  stump:  { name: 'Toco',   verb: 'Quebrar',  tools: ['machado'],  hp: 4, energy: 2, drop: ['madeira', 2], fx: 'wood' },
  trunk:  { name: 'Árvore', verb: 'Cortar',   tools: ['machado'],  hp: 5, energy: 2, drop: ['madeira', 3], fx: 'wood' },
  rock:   { name: 'Rocha',  verb: 'Quebrar',  tools: ['picareta'], hp: 5, energy: 2, drop: ['pedra', 2],   fx: 'stone' },
};
const TOOL_NAME = { vara: 'a vara de bambu', vara_fibra: 'a vara de fibra de vidro', machado: 'o machado', picareta: 'a picareta', foice: 'a foice', espada: 'a espada', enxada: 'a enxada', regador: 'o regador' };

/* Pesca. zones = chance relativa em cada tipo de água (lago: lago da fazenda e lagoa do bosque;
   rio: rio do bosque e nascente da serra). peak = horário em que o peixe é mais comum
   (fora dele a chance cai para off). cm = tamanho mínimo e máximo (só informação e recorde);
   price = venda fixa por peixe, sem depender de tamanho, sorte, nível ou captura perfeita.
   behavior = jeito de nadar no minijogo (FISHING.behaviors); a experiência vem do comportamento. */
const FISH = {
  sardinha: { zones: { rio: 1, lago: 0.6 }, peak: [360, 1140], off: 0.35, cm: [5, 90], price: 50, behavior: 'tranquilo' },
  tucunare: { zones: { lago: 0.4 }, peak: [360, 1080], off: 0.3, cm: [20, 80], price: 60, behavior: 'ativo' },
};
/* Configuração central da pesca: mude aqui para equilibrar. Posições do minijogo são
   proporções da pista (0 = esquerda, 1 = direita); velocidades em pistas por segundo. */
const FISHING_FIBER_LEVEL = 2;                      // pesca nível 2 libera a vara de fibra de vidro
const FISHING = {
  progress: { start: 30, gain: 10, loss: 8, grace: 750 },          // 0 a 100; pontos por segundo; tolerância inicial (ms)
  zone: { base: 0.22, perLevel: 0.01 },                               // largura da zona verde: 22% no nível 0, +1 ponto por nível
  track: { fishMin: 0.36, fishMax: 0.97 },                           // o peixe nada à direita da zona parada: sem segurar, nunca se pesca
  control: { accel: 4.5, back: 3.6, reverse: 2, maxSpeed: 0.45, settle: 450 },   // segurar acelera para a direita; soltar volta; settle = zona parada no começo (ms)
  behaviors: {                                                        // como cada tipo de peixe nada (o XP vem de SKILL_GAIN.fish)
    tranquilo: { speed: [0.12, 0.2], dist: [0.08, 0.26], accel: 0.6, pause: [0.5, 1.4], pauseChance: 0.55, turn: 0, dash: 0 },
    ativo: { speed: [0.24, 0.33], dist: [0.12, 0.40], accel: 1.2, pause: [0.2, 0.6], pauseChance: 0.3, turn: 0.3, dash: 0.2 },
    agil: { speed: [0.48, 0.64], dist: [0.10, 0.24], accel: 3, pause: [0.4, 1.0], pauseChance: 0.7, turn: 0, dash: 1 },
  },
  maxLevel: 10,                                                       // o nível de pesca vem da habilidade Pesca (SKILLS / SKILL_XP)
  legacyNextLevel: lvl => 100 + 25 * lvl,                             // sistema antigo de nível de pesca: usado só para converter saves
  bite: { window: 1200, waitMin: 3000, waitMax: 10000, maxCutPerLevel: 200, baitFactor: 0.5 },   // tempos reais (ms)
  cast: { min: 12, max: 72, step: 16, stepLevels: [1, 4, 8], shore: 24, energy: 2 },             // distâncias em pixels do mapa (16 = um quadrado)
  fiber: { price: 1500, level: FISHING_FIBER_LEVEL }, baitPrice: 20,
};
/* Sorte do dia. Cada estação de 29 dias sorteia uma lista embaralhada com exatamente estas
   quantidades (sem ordem fixa: pode haver dias iguais seguidos). A sorte só mexe na pesca:
   chance de cada resultado por lançamento (em %), sem tocar em energia, zona verde, espécies
   ou experiência. Nos dias de má sorte, depois de 5 peixes capturados no dia, só vem refugo. */
const LUCK = {
  counts: { ma: 8, neutro: 12, sorte: 9 },
  name: { sorte: 'Dia de sorte', neutro: 'Dia neutro', ma: 'Dia de má sorte' },
  morning: { neutro: 'Hoje o dia será neutro.', sorte: 'Hoje será um dia de sorte!', ma: 'Hoje será um dia de má sorte.' },
  fishing: {
    sorte: { peixe: 90, alga: 6, musgo: 2, lixo: 2 },
    neutro: { peixe: 70, alga: 15, musgo: 8, lixo: 7 },
    ma: { peixe: 30, alga: 30, musgo: 20, lixo: 20 },
  },
  badLimit: 5,                                          // peixes capturados por dia de má sorte (soltos contam; fugas não)
  afterLimit: { alga: 50, musgo: 25, lixo: 25 },
  limitMsg: 'Os peixes estão difíceis hoje. Talvez seja melhor tentar amanhã.',
};
/* Habilidades do jogador (referência: progressão clássica dos jogos de fazenda).
   SKILL_XP = experiência TOTAL acumulada para chegar a cada nível (0 a 10).
   O XP é somado na hora; o nível novo e o benefício só valem depois de dormir. */
const SKILL_XP = [0, 100, 380, 770, 1300, 2150, 3300, 4800, 6900, 10000, 15000];
const SKILLS = {
  cultivo: { name: 'Cultivo', how: 'Colha plantações (rabanete 15, tomate 12, morango 18, abóbora 31 por colheita), faça carinho nas galinhas (5, uma vez por dia cada) e recolha ovos do ninho (5 por ovo).',
    perk: l => (l ? `Enxada e regador gastam ${l * 5}% menos energia.` : 'Enxada e regador com gasto normal de energia.'), tools: ['enxada', 'regador'] },
  pesca: { name: 'Pesca', how: 'Conclua capturas: sardinha 13, tucunaré 20, alga, musgo ou lixo 3. Captura perfeita de peixe vale 2,4×. Fugas não contam.',
    perk: l => `Faixa verde com ${22 + l}% da pista${l >= FISHING_FIBER_LEVEL ? '; vara de fibra de vidro liberada no Armazém' : ''}.` },
  coleta: { name: 'Coleta', how: 'Recolha flores, frutos e cogumelos da natureza (7 por ponto), derrube árvores com o machado (12) e tire os tocos (1).',
    perk: l => (l ? `Machado gasta ${l * 5}% menos energia.` : 'Machado com gasto normal de energia.'), tools: ['machado'] },
};
const SKILL_GAIN = {
  harvest: { rabanete: 15, tomate: 12, morango: 18, abobora: 31, milho: 10, melao: 27, repolho_roxo: 28 },
  henPet: 5, egg: 5,
  fish: { sardinha: 13, tucunare: 20 }, junk: 3, perfectMult: 2.4,
  forage: 7, tree: 12, stump: 1,
  energyCut: 0.05,                                       // por nível, sobre o gasto normal da ferramenta (até 50% no nível 10)
};
const FISH_ZONE_NAME = { lago: 'lago', rio: 'rio' };
const CAST_ENERGY = FISHING.cast.energy;  // energia por lançamento válido
const ROD_LETTER = {
  greet: 'Oi, {nome}.',
  body: [
    'É o Tomé, da cabana do bosque. Achei esta vara no meu canto e lembrei de você: foi a minha primeira. Está velha, mas a linha é nova e a boia é boa.',
    'Dá para pescar no lago da sua fazenda, na lagoa do bosque e no rio que desce dela até o fim da mata. No rio é quase só sardinha. Nos lagos também aparece tucunaré, que briga mais.',
    'Com a vara na mão, chegue na beira da água. Segure o clique sobre a água, ou a barra de espaço com você virado para ela, para pegar força; solte para lançar. Quanto mais força, mais longe a boia cai.',
    'Quando a boia afundar e aparecer o "!", clique ou aperte Espaço de novo, rápido. Aí o peixe briga numa barrinha: segure o clique ou o Espaço para a faixa verde ir para a direita; solte para ela voltar. Deixe o peixe dentro da faixa até a barra de baixo encher.',
    'Esc recolhe a linha. Cada lançamento cansa um pouquinho. Peixe se vende no Armazém, por um preço fixo para cada espécie. Com prática, você pesca melhor.',
  ],
  sign: 'Boa pescaria,\nTomé',
};

/* Engrenagem do menu → "Última atualização" (o que esta versão trouxe de fato). */
const UPDATE_NOTES = {
  title: 'Árvores, arbustos e cercas',
  items: [
    'Árvores com copas cheias em cachos de folhas, troncos com casca e raízes, e um desenho diferente para cada uma.',
    'Laranjeiras e goiabeiras redesenhadas, e arbustos com contorno irregular e folhas.',
    'Cercas de madeira com postes grossos, travessas encaixadas, cantos e porteiras.',
    'Dá para passar atrás das cercas, e a copa fica translúcida quando você passa atrás de uma árvore.',
    'Corte, coleta, caminhos e colisões continuam iguais.',
  ],
};
