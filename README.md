# Trilha — uma vida no campo

RPG de vida no campo em pixel art 16-bits. Aos 22 anos, cansado(a) do escritório,
você recebe uma carta do seu avô: ele deixou um velho sítio, tomado por mato e
pedras, perto da Vila Acapulco, no Vale do Orvalho. Com as ferramentas antigas
dele e algumas moedas, você planta, cuida de galinhas, ganha um bicho de
estimação, explora o bosque e conhece os moradores. Não há profissões nem fim
obrigatório: os dias passam, a fazenda evolui e as amizades crescem.

O jogo ocupa a janela inteira. O botão **Tela cheia** usa a tela toda do
aparelho (Esc ou o mesmo botão saem dela).

## Como jogar

Abra o `index.html` no navegador (com as pastas `css/` e `js/` ao lado) ou jogue
pelo GitHub Pages. Não precisa instalar nada.

| Ação | Computador | Celular |
| --- | --- | --- |
| Andar | Setas (ou W, A, S, D) | Direcional na tela |
| Interagir (porta, baú, cama, morador, galinha) | Clique no alvo | Toque no alvo |
| Abrir a porta à frente | Q (ou clique na porta) | Toque na porta |
| Usar a ferramenta, semente ou muda | Clique na terra ou no objeto | Toque na terra ou no objeto |
| Escolher o item da barra | Clique na barra ou teclas 1 a 9 e 0 | Toque na barra |
| Comer (frutos, narciso, peixes, ovos) | Com o alimento na mão, clique numa área livre do cenário e confirme "Sim" | Toque numa área livre e confirme |
| Mostrar outra linha da mochila na barra | Botões 1, 2 e 3 ao lado da barra (ou Menu → Inventário → "Usar na barra") | Os mesmos botões |
| Menu principal (abre no Inventário) | E ou Esc (de novo fecha) | Botão ☰ Menu |
| Diário | F | Botão Diário |
| Mapa | M | Botão Mapa |
| Avançar conversa | Clique na caixa, E, Espaço ou Enter | Toque na caixa de conversa |
| Recusar numa pergunta "Sim/Não" | E ou Esc | Botão "Não" |
| Pausar | P (ou o botão ⏸) | Botão ⏸ |
| Fechar painel, carta ou menu | Esc (ou E) | Botão ✕ |
| Pescar (vara na mão) | Segure o botão esquerdo sobre a água, ou Espaço virado para ela; solte para lançar | Segure o dedo na água e solte |
| Fisgar | Botão esquerdo ou Espaço quando a boia afundar e aparecer o "!" | Toque na tela |
| Puxar o peixe | Segure botão esquerdo ou Espaço: a faixa vai para a direita; solte: ela volta | Segure o dedo; solte |
| Guardar ou soltar o peixe | Clique na opção, ou setas e Espaço | Toque na opção |
| Recolher a linha | Esc | Botão "Recolher linha" |

Os atalhos ignoram a repetição de tecla segurada, não funcionam enquanto você
digita um nome e respeitam a ordem: carta aberta → conversa → menu. Numa carta, E
ou Esc só fecham a carta; em escolhas obrigatórias de uma cena, nada é cancelado.

Tab não tem função durante o jogo (não troca a linha da barra nem o item na mão);
nos menus, continua navegando entre os controles.

### Menu principal

Uma janela de madeira com fundo bege e abas com ícones no alto (a aba ativa fica
destacada e o nome aparece ao passar o mouse); o cenário fica escurecido atrás e
o tempo para enquanto ela está aberta. Trocar de aba mantém a mesma janela.

- **Inventário:** mochila em 3 linhas de 10 espaços. A linha usada na barra de
  ferramentas fica marcada (▶). Clique num item para ver nome e descrição, clique
  noutro espaço para mover, ou use "Usar na barra". Embaixo: prévia do
  personagem, nome, fazenda, moedas, energia e os equipamentos (chapéu,
  acessório e o item na mão).
- **Amizades:** moradores conhecidos com retrato, corações e a barra até o
  próximo coração (dados reais da partida). Selecionando um morador: descrição,
  aniversário, gostos já descobertos e o contador de presentes com a regra
  dele (Lúcio: 2 por semana).
- **Mapa:** o mapa do mundo, com regiões, construções, caminhos, a sua posição e
  o destino da missão acompanhada.
- **Diário:** missões em andamento (objetivo, progresso, quem pediu, recompensa),
  botão "Acompanhar" (muda o objetivo da tela), "Ver no mapa", concluídas e a
  seção **Cartas**.
- **Personagem:** aparência ampliada nas quatro direções, nome, fazenda,
  equipamentos e energia.
- **Configurações** (engrenagem): "Última atualização" com o que a versão trouxe, lista de controles, tela cheia, salvar a partida (com aviso
  de sucesso ou falha), voltar à tela inicial (salva antes) e apagar a fazenda.

**Só funciona de perto.** O alvo precisa estar ao lado do personagem (na fazenda,
o quadrado onde você está ou um vizinho). Ao passar o mouse sobre algo, ele fica
destacado e o nome da ação aparece na parte de baixo do cenário; se estiver longe,
a dica diz para chegar mais perto, e o clique não faz nada além de avisar. O
personagem se vira para o alvo e executa a animação.

**A ação depende do item na mão.** Machado corta galhos, árvores e tocos;
picareta quebra pedras e rochas; foice (ou espada) corta o mato; enxada prepara a
terra; regador rega (e se enche clicando no lago); semente planta em terra
preparada; espada golpeia o boneco de treino. Plantação madura e árvore com
frutos se colhem com qualquer item. Com a ferramenta errada nada é removido e
nenhuma energia é gasta: uma dica curta diz qual usar.

**Vários golpes.** Galhos, pedras, tocos, árvores e rochas resistem: cada clique
com a ferramenta certa é um golpe, com animação, lascas e energia gasta. Uma
barrinha mostra quanto falta. Segurar o botão não repete golpes, e cliques
durante a animação são ignorados. O dano parcial fica salvo, mesmo trocando de
ferramenta, saindo da área ou fechando o jogo. Sem energia, o golpe não
acontece; com a mochila cheia, o golpe final espera até haver espaço.

| Objeto | Ferramenta | Golpes | Rende |
| --- | --- | --- | --- |
| Mato | foice ou espada | 1 | — |
| Galho | machado | 2 | 1 madeira |
| Pedra | picareta | 3 | 1 pedra |
| Toco | machado | 4 | 2 madeiras |
| Árvore do bosque | machado | 5 | 3 madeiras (fica um toco) |
| Rocha do bosque | picareta | 5 | 2 pedras |

Com um painel ou conversa aberta, cliques no cenário não fazem nada.

## Personagem

Na criação: gênero, 6 tons de pele, 16 penteados (curtos, médios e longos; lisos,
ondulados, cacheados e crespos; tranças, coque e rabo de cavalo), 8 cores de
cabelo, 6 modelos de roupa de cima (camiseta, regata, camisa, blusa, moletom e
jardineira), 4 de baixo (calça, short, saia e saia longa), calçado, 4 acessórios
(óculos, laço, bandana e cachecol) com cor, animal favorito (gato ou cachorro),
nome do personagem e nome da fazenda. Tudo vale para qualquer gênero. O botão
**Aparência aleatória** sorteia só o visual. O personagem tem 24×32 pixels e não
perde cabelo nem acessório em nenhuma direção, andando, usando ferramentas,
pescando ou de chapéu.

**Gênero e base visual.** O gênero define os pronomes nas falas e também a
**base visual** do corpo, que aparece na prévia, no mapa, ao andar, nas
ferramentas, na pesca e na ficha do personagem:

| Escolha | Base | Ponto de partida |
| --- | --- | --- |
| Masculino | ombros e peito mais largos, maxilar quadrado com sombra, sobrancelhas mais marcadas, boca mais larga | cabelo curto liso, camisa verde e calça |
| Feminino | ombros mais estreitos e cintura marcada, queixo mais fino, cílios, boca rosada e bochechas mais coradas | cabelo longo ondulado com laço, blusa rosa e saia |
| Não binário | a base neutra (a mesma das versões anteriores) | chanel com franja, moletom verde e calça |

O ponto de partida é aplicado só quando se escolhe **outro** gênero (o tom de pele
fica). Voltar à etapa ou clicar de novo no mesmo gênero não apaga nada; depois,
todos os cabelos, roupas e acessórios continuam livres. Os cartões de gênero, de
cabelo, de roupa e de acessório mostram a prévia já com a base e o tom de pele
escolhidos. Personagens de jogos salvos antes desta versão continuam exatamente
como eram (base neutra) até o jogador mudar alguma coisa.

**Visual da criação.** Moldura de madeira em pixel art com pregos de latão, fundo
bege, painéis cor de areia, textos marrom-escuros e destaques em âmbar (também na
seleção, no foco e ao passar o mouse). A prévia fica à esquerda: frente, esquerda,
costas e direita, andando, sobre um pequeno cenário de céu, cerca e grama, em
escala inteira (3×, sem suavizar). Os controles ficam à direita; nas grades
grandes, só a lista rola e os botões Voltar, Aparência aleatória e Avançar ficam
sempre à vista.

**Cabelos e roupas.** Cada tipo de fio tem textura própria: liso com mechas retas
e um arco de brilho, ondulado com faixas que serpenteiam, cacheado com espirais e
crespo com textura miúda e fechada; cacheados e crespos têm contorno com volume.
O curto liso tem franja varrida para um lado e o chanel é reto, com franja cheia e
pontas para dentro. Nas roupas: bainha nas mangas curtas e costura lateral na
camiseta, bolso na camisa, manga bufante e barra com babado na blusa, cinto com
fivela, bolsos e vinco na calça e barra no short.

Não há casamento, gravidez nem filhos. O guarda-roupa de casa permite mudar
cabelo, roupas, acessório e chapéu a qualquer momento. A idade é 22 anos.

**Nomes:** o nome do personagem, o da fazenda e o das galinhas aceitam **somente
letras de A a Z**, maiúsculas ou minúsculas: sem espaços, acentos, cedilha,
números, pontuação, aspas, emojis ou outros símbolos. Vale para o que é digitado,
colado ou arrastado: o campo retira o que não pode e explica "Use apenas letras de
A a Z, maiúsculas ou minúsculas, sem espaços ou acentos." Nome vazio ou inválido
não avança nem é salvo. O limite é pela largura na tela (até 16 letras no nome, 20
na fazenda e 12 nas galinhas). Ao renomear uma galinha, deixar o campo vazio mantém
o nome atual. Nomes de partidas antigas continuam como estavam até o jogador
decidir editá-los. O nome do bicho de estimação segue a regra anterior. Os nomes aparecem como texto nas falas, na carta, no
diário, no mapa e na placa da fazenda.

## Abertura e carta

Só num jogo novo: depois da criação, uma cena curta em que o personagem abre o
envelope do avô, a carta (com o seu nome e o da fazenda) e a chegada. Ao
continuar um jogo salvo, nada disso se repete; a carta fica no **Diário** para
reler.

## O mapa

Um mapa externo maior que a tela, com a câmera acompanhando o personagem:

- **Fazenda** (oeste): casa de madeira com varanda, 200 canteiros de terra —
  parte tomada por mato, galhos, pedras e tocos —, lago para encher o regador,
  placa com o nome da fazenda, boneco de treino e, no sul, o **galinheiro**
  (celeiro vermelho com porta para a estrada) ao lado do cercado das galinhas.
- **Vila** (centro): praça com fonte, Armazém e as casas dos moradores. Entre a
  vila e o bosque, uma **trilha** sobe para o norte, até a serra.
- **Bosque** (leste): árvores comuns, rochas, amoras, cogumelos e flores.

Interiores: a **casa** (cama, baú e guarda-roupa), o **Armazém** e o
**galinheiro** (comedouro com placa "RAÇÃO", três ninhos, feno e bebedouro).

**Tela do mapa** (M ou botão Mapa): mostra o mapa de verdade, com a fazenda pelo
nome, casa, galinheiro, cercado, roça, lago, Vila Acapulco, Armazém, praça, casas
dos moradores, bosque, estradas, a sua posição e o destino da missão
acompanhada, com legenda. O tempo para enquanto ele está aberto, e ele não
teleporta. O cenário não tem setas: para saber aonde ir, use o Diário (F) ou o
mapa (M). No Diário, "Acompanhar" escolhe a missão mostrada no objetivo e no mapa.

**Galinheiro passo a passo:** Bia entrega 5 de ração. Siga a estrada que desce da
porteira até o fim, vire à esquerda e entre pela porta vermelha. Clique no
comedouro (cada clique põe 1 porção da mochila), ponha 2 e volte a falar com
Bia: ela dá uma galinha para você batizar. Com ração no comedouro, a galinha bota
de noite, e o ovo aparece nos ninhos de manhã.

**Bicho de estimação:** na manhã do dia 12 da primavera
do ano 1, Bia traz o seu animal favorito. Aceite e dê um nome; se adiar, ela volta
na manhã seguinte. O bicho passeia perto da casa e gosta de carinho (clique).

## Fazenda

- **Ferramentas** (gastam energia a cada uso ou golpe): enxada ara, regador rega
  (10 usos por carga), machado corta galhos, tocos e árvores comuns, picareta
  quebra pedras, foice corta o mato. A espada simples serve para treinar no boneco.
- **Cultivos**: escolha a semente na barra e clique na terra arada; regue com o
  regador; colha clicando perto da planta pronta. Cada noite depois de um dia
  regado conta um dia de crescimento; sem rega a planta pausa, mas não morre. O
  crescimento acontece só uma vez por noite (dormir, desmaiar às 2h ou recarregar
  não repete). Planta madura espera a colheita. Com a mochila cheia, o fruto fica
  na planta.

| Cultivo | Estações de plantio | Primeira colheita | Nova colheita | Semente | Venda |
| --- | --- | --- | --- | --- | --- |
| Rabanete | qualquer | 2 dias regados | — (a planta sai) | 8 | 18 |
| Tomate | qualquer | 4 dias regados | — (a planta sai) | 15 | 40 |
| Morango | Primavera, Outono e Inverno | 5 dias regados (5 estágios de 1 dia) | a cada 4 dias regados | 150 | 360 |
| Abóbora | Primavera e Outono | 13 dias regados (estágios de 1, 2, 3, 4 e 3 dias) | a cada 6 dias regados | 25 | 75 |

  **Morango e abóbora** dão 1 fruto por colheita e o pé continua plantado,
  voltando ao estado sem frutos (sem precisar de semente nova). Os estágios
  aparecem no canteiro: no morango, broto, folhas, flores, frutos verdes e frutos
  vermelhos (prontos); na abóbora, broto, folhas, rama, flor, abóbora verde
  pequena e abóbora laranja grande (pronta). Na rebrota, o pé adulto mostra a flor,
  depois o fruto em formação e o fruto maduro. As sementes ficam à venda no
  Armazém só nas estações de plantio; o Armazém compra os frutos em qualquer
  estação. Fora da estação, o plantio é bloqueado sem gastar semente nem energia.
  Se não houver tempo para a primeira colheita antes da troca de estação, o jogo
  avisa e pergunta se quer plantar mesmo assim. **Na manhã da nova estação**, os
  pés de morango e de abóbora secam (mesmo que a nova estação também permita o
  plantio), e os frutos que ficaram se perdem; limpe o canteiro com a foice (1 de
  energia) e plante de novo quando a estação permitir. O morango é comestível
  (+30 de energia) e é o presente favorito da Dona Celeste: vale 150 pontos de
  amizade, com resposta própria. Para os outros moradores, é um presente neutro.
  O preço da semente de morango (150) foi escolhido para a economia do jogo: uma
  colheita paga mais que duas sementes, e um pé plantado no começo da estação rende
  até 6 colheitas.
- **Árvores frutíferas**: laranjeira e goiabeira. A muda precisa de grama livre,
  sem outra árvore encostada. Ficam adultas em 5 ou 6 dias e dão 2 frutos a cada
  3 dias. Não precisam de rega.
- **Galinhas**: a primeira vem de uma missão; outras são vendidas no Armazém
  (até 4). Cada porção de ração no comedouro alimenta uma galinha por noite, e
  galinha alimentada bota um ovo, que aparece no ninho na manhã seguinte. Dá
  para dar nome, fazer carinho (uma vez por dia) e ver o bem-estar.
- **Bosque**: a árvore cortada deixa um toco, que também pode ser removido;
  ela volta em 4 dias e as rochas em 3. Os itens de coleta mudam de lugar todo dia.

## A serra e Lúcio

Pela trilha ao norte da vila chega-se à **serra**: um paredão de rocha (com uma
fenda fechada por tábuas, que ninguém usa), a mata, uma nascente onde dá para
encher o regador, amoras e flores para colher e o acampamento de **Lúcio** — a
tenda, a fogueira com troncos para sentar e os pertences dele, arrumados num
canto. No mapa (M), a serra aparece acima da vila; depois que você conhece
Lúcio, a tenda é identificada pelo nome.

**Quem é:** um homem mais velho que vive ali há muitos anos. Conhece plantas, o
jeito do tempo e trilhas que pouca gente usa. É reservado, observador e tem um
humor discreto que aparece com a confiança. Já encontrou a tenda rasgada e as
coisas espalhadas, sem saber por quem, e por isso desconfia no começo — mas tem
orgulho da vida que construiu e não quer ser "salvo" de nada.

**Aparência:** retrato próprio em pixel art, numa grade nativa de 64×64
(`js/portraits.js`), montado forma por forma: mechas de cabelo com direção e
divisões, testa com entradas, sobrancelhas grossas, pálpebras, nariz e maçãs do
rosto com volume, bigode separado da barba, tufos de barba com laterais cheias e
base arredondada, e um manto de folhas sobrepostas nos ombros por cima de uma
túnica marrom. Quatro expressões — neutro, desconfiado, contente e emocionado —
mudam só sobrancelhas, pálpebras e boca, conforme a fala. O sprite de corpo
inteiro usa os mesmos tons (cinza quente, folhas laranja e marrom), com bigode e
barba distintos, nas quatro direções e andando.

**Rotina:** de manhã perto da tenda e colhendo na mata; à tarde na nascente; à
noite junto à fogueira. Ele só anda por lugares livres.

**Tenda:** clique na entrada. Na primeira vez, Lúcio pergunta e dá permissão
numa conversa curta; depois, você entra direto.

**Amizade e falas:** 0 a 5 corações, como os outros moradores, com falas
próprias em quatro faixas (0, 1–2, 3–4 e 5 corações), sem repetir a anterior.
Só a primeira conversa do dia dá pontos.

**Presentes (regras só dele):** no máximo 1 por dia e 2 por semana. A semana
vira toda segunda-feira. Antes de entregar, o jogo pergunta
"Presentear Lúcio com [item]?". Se o limite já foi atingido, ele recusa com
gentileza e o item fica na mochila. No **aniversário (9 do Inverno)** ele aceita
um presente a mais, mesmo com os limites esgotados, e os pontos valem **8
vezes** (inclusive os negativos). Ama goiaba; gosta de laranja, amora e ovo;
madeira e pedra são neutras; não gosta de ração. As preferências aparecem no
painel de amizades conforme você descobre. Entregas de missão não contam como
presente.

**Missões pessoais:**

- **Antes da próxima chuva** (1 coração): leve 4 madeiras e clique na lona da
  tenda. No primeiro clique a madeira é usada; depois vêm 3 reparos, com
  animação e barra de progresso. A tenda ganha cobertura nova para sempre.
  Fale com Lúcio para concluir.
- **O que ficou pelo caminho** (3 corações): procure o apito de madeira na
  trilha do rochedo, a leste da nascente, e devolva. Ele conta uma lembrança. O
  apito não volta a aparecer.
- **Um lugar junto ao fogo** (5 corações): vá à fogueira entre 18h e 22h. Uma
  conversa curta em que os dois contam um pouco de si; no fim, ele dá uma muda
  de goiabeira. Se perder o horário, a conversa fica para a noite seguinte.

**Iara:** depois que você conhece Lúcio, Iara puxa uma conversa sobre ele: acha
que a vila esquece de chamá-lo, e que ela mesma também precisa se aproximar. Ela
não conta nada que Lúcio ainda não tenha contado a você.

## Moradores e amizade

Seis moradores, cada um com rotina, personalidade e gostos: Dona Celeste
(Armazém), Seu Honório, Bia, Tomé, Iara e Lúcio (na serra). A amizade vai de 0 a 5 corações:

- clique no morador para conversar; a primeira conversa do dia dá pontos; as seguintes continuam disponíveis, sem pontos;
- cada morador aceita um presente por dia (com um produto na mão, a conversa oferece a opção), e os preferidos rendem mais; Lúcio e Iara têm regras próprias (acima e abaixo);
- com 1 coração surge o pedido pessoal de cada um; com 3, uma pequena cena e um presente;
- as falas mudam conforme a amizade. Não há romance.

### Retratos e diálogos

Cada morador tem retrato próprio de rosto e ombros, numa grade nativa de 64×64
pixels, desenhado por código no mesmo acabamento do de Lúcio, com expressão
neutra e contente (só olhos, sobrancelhas e boca mudam):

- **Dona Celeste:** coque grisalho com fita vermelha, brincos e blusa terracota;
- **Seu Honório:** careca, sobrancelhas grisalhas grossas e franzidas, camisa marrom de gola;
- **Bia:** ruiva de rabo de cavalo com fita vermelha, sardas e jardineira verde;
- **Tomé:** cabelo castanho na altura do queixo, franja e camisa verde-musgo;
- **Iara:** 13 anos, cachos pretos volumosos com presilha amarela, jardineira lilás
  sobre camiseta creme, pincel no bolso e tinta na bochecha. Tem cinco expressões
  (neutra, contente, concentrada, triste e surpresa) e versão de inverno com gorro,
  cachecol e casaco.

O retrato aparece na caixa de diálogo em escala inteira (2× no computador, 1×
no celular), sem suavização, e é o mesmo do painel de Amizades. Se faltar um
retrato, aparece uma silhueta neutra, nunca o rosto de outro morador.

Cada conversa fixa o interlocutor ao começar e limpa nome, retrato, texto e
opções ao abrir e ao fechar. Escolhas que abrem a conversa (loja, presente)
mostram a fala e o rosto de quem pergunta. Narração aparece sem nome nem retrato.

### Iara

Iara tem 13 anos, está na sexta série e mora na Vila Acapulco com a família. É
gentil e distraída, pinta paisagens, anda com os dedos e a roupa manchados de
tinta e dá nomes às cores que mistura ("Verde de folha depois da chuva", "Azul
de fonte gelada"). Toma chá de maçã com canela toda manhã. O projeto dela é
pintar a mesma fonte nas quatro estações. Leo, o melhor amigo, aparece só nas
falas, por enquanto.

**Casa e escola.** A casa dela pode ser visitada: tem um cantinho de pintura
(cavalete e potes de tinta), uma mesinha de chá, estante, poltrona e desenhos
presos na parede. A escola fica ao sul da praça, com quadro-negro, carteiras,
estante de livros e um mural de desenhos.

**Rotina.** No mapa, Iara tem 4 direções, caminhada e animações discretas
(pintando no cavalete, pincel na mão, desenhando, lendo e tomando chá). Ela anda
pelos caminhos da vila, sem atravessar obstáculos nem sumir de um lugar para outro.

| Quando | Dias úteis | Fim de semana |
| --- | --- | --- |
| 6h–7h | Chá e materiais, em casa | Chá e desenho, em casa |
| 7h30–12h30 | Escola | Em casa até as 10h; depois, desenhando na praça |
| 13h–14h | Almoço em casa | Almoço em casa |
| 14h–18h | Fonte (até 16h30) e praça | Alterna a fonte e pontos da praça |
| Depois das 18h | Em casa | Em casa |

**Chuva.** O jogo ainda não sorteia o clima: a rotina lê um único estado da
partida (`S.weather === 'chuva'`), pronto para quando a chuva existir. Com chuva,
as aulas continuam e o resto do dia é em casa (pintura, leitura e chá). Ao
carregar o jogo, Iara aparece onde a rotina manda naquele horário. Prioridade:
cena da história, depois chuva, depois o dia de pintura e, por fim, a rotina.

**Dia 10 de cada estação.** Das 14h às 18h, Iara pinta a fonte no cavalete, sem
janela, sem mexer na câmera e sem interromper o jogador. Se chover, pinta em casa,
pelos esboços. Às 18h (ou durante a noite, se você dormir antes) a pintura fica
pronta e entra na coleção dela: uma por estação e ano, mesmo que você não esteja
por perto, sem duplicar ao recarregar. Depois de pronta, a conversa oferece
**Ver a pintura**; nunca mostra uma pintura ainda inacabada.

**Falas.** Mudam com o lugar, a hora, a estação, a chuva, o dia de pintura e a
amizade (pelo menos três por faixa: 0, 1–2, 3–4 e 5 corações), sem repetir a
fala anterior. Não há romance.

**Presentes.** 1 por dia e 2 por semana, mais um presente extra no aniversário
(4 do Verão), mesmo com os limites atingidos, que vale 8 vezes mais (inclusive
para baixo). Entregas de missão não contam como presente.

| Reação | Itens |
| --- | --- |
| Adora | pincel, bolo de morango, flores aquáticas, conchas raras |
| Gosta | flores comuns (incluindo narciso), pães |
| Neutro | peixes, coco e o resto |
| Não gosta | rabanete, espinafre, qualquer leite |

Os gostos usam categorias de item (`cat`); as exceções de Iara valem antes das
categorias. Itens que ainda não existem no jogo (pincel, bolo, conchas, leite,
espinafre) já têm a reação preparada. O espinafre não foi ligado a nenhum
festival, porque o jogo ainda não tem festival de troca de presentes.

**Acontecimentos de amizade** (cada um dá a recompensa uma única vez e pode ser
retomado depois):

- **1 coração, "Uma cor sem nome":** ela pede uma flor-do-campo e, ao receber,
  você escolhe o nome da cor nova; o nome é salvo e aparece em falas depois. Em
  jogos salvos em que a missão já tinha sido feita, ela pede o nome na próxima conversa;
- **3 corações, "A paisagem que ninguém olha":** ela pede que você ache um
  detalhe escondido na praça (uma florzinha entre as pedras, perto da fonte).
  Ao clicar nele e voltar a falar com ela, Iara mostra o esboço que fez e dá a
  boina de pintor (só se você ainda não a tinha recebido);
- **5 corações, "As quatro versões da fonte":** quando ela tiver pintado a fonte
  nas quatro estações, mostra a galeria com as quatro e dá uma cópia de uma
  pintura, o **Quadro da fonte**. No Inventário, use "Pendurar na parede de casa";
  clique no quadro na parede para tirá-lo. Antes disso, ela explica o que falta,
  sem bloquear nada. O painel de Amizades mostra as estações já pintadas.

## Pesca

**A vara.** Tomé manda pelo correio a vara dele, a **Vara de bambu**, com uma carta
que explica os controles: no dia 2 de um jogo novo ou, em jogos salvos antes, na
manhã seguinte à atualização. Ela chega uma única vez; com a mochila cheia, fica
guardada com a carta e é resgatada no Diário ("Cartas" → "Pegar a vara de bambu").
Quem já tinha a vara de pesca continua com ela, no mesmo lugar, agora chamada de
Vara de bambu.

**Onde pescar.** Na beira da água, sem parede ou casa no caminho:

- **lago:** o lago da fazenda e a lagoa do bosque;
- **rio:** o rio do bosque, que sai da lagoa e desce até o fim da mata (com uma
  ponte de tábuas), e a nascente da serra.

| Peixe | Onde | Mais comum | Tamanho | Venda | Jeito de nadar | XP |
| --- | --- | --- | --- | --- | --- | --- |
| Sardinha | rio e lago (a mais comum no lago da fazenda) | 6h–19h | 5 a 90 cm | 30 a 130 moedas | tranquilo | 20 |
| Tucunaré | só no lago | 6h–18h | 20 a 80 cm | 60 a 200 moedas | ativo | 30 |

O preço cresce com o tamanho. Há três jeitos de nadar: **tranquilo** (devagar,
com pausas e curvas suaves), **ativo** (mais rápido, muda de direção com mais
frequência e dá pequenas arrancadas) e **ágil** (arrancadas curtas alternadas com
pausas; 40 XP). O ágil já está pronto para a próxima espécie que entrar no jogo.

**Comando único.** A pesca inteira funciona com o **botão esquerdo do mouse** ou
com a **barra de espaço**, e os dois contam como o mesmo botão: ele está
pressionado enquanto pelo menos um dos dois estiver segurado. Usar os dois juntos
não duplica lançamento, fisgada nem escolha. Com Espaço, o lançamento vai para
onde o personagem está virado, sem precisar do cursor; durante a briga, o botão
esquerdo vale em qualquer lugar da tela. Ao perder o foco da janela, teclas e
mouse são soltos.

**Etapas.**
1. Segure sobre a água (ou Espaço virado para ela): o personagem puxa a vara para
   trás e uma barra de força sobe e desce acima da cabeça.
2. Solte para lançar: a vara verga, vai à frente e a boia voa até a água, com
   respingo. A força decide a distância, sempre dentro da água. O alcance máximo
   cresce um quadrado nos níveis de pesca 1, 4 e 8.
3. Espere: a boia balança, às vezes belisca. O relógio continua. A mordida vem
   entre 3 e 10 segundos de jogo ativo (o máximo cai 0,2 s por nível).
4. A boia afunda, treme e aparece um "!" com o tempo que resta (cerca de 1,2 s).
   Aperte para fisgar: "Fisgou!" aparece na água.
5. A barra horizontal aparece perto da pesca, sem cobrir o personagem nem a boia
   (relógio parado). Segure para a zona verde acelerar para a direita; solte para
   ela voltar para a esquerda. Com o centro do peixe dentro da zona, a barrinha
   de baixo enche; fora, esvazia. Cheia: o peixe é seu. Vazia: ele foge. A zona
   espera um instante antes de responder, para o aperto que fisgou não dar um
   tranco. Na primeira vez aparece uma dica curta, que some sozinha.
6. O peixe salta até as mãos, o personagem o ergue e aparecem nome, tamanho e
   valor: **Guardar** ou **Soltar** (clique, ou setas e Espaço). É preciso um aperto
   novo: o mesmo que pegou o peixe não escolhe nada. Com a mochila cheia, o peixe
   espera enquanto você solta o peixe ou joga algo fora (ferramentas e itens de
   missão não podem ser jogados fora).

Durante a pesca não dá para andar nem abrir menus; Esc (ou "Recolher linha")
desiste e recolhe a linha. Cada lançamento válido gasta 2 de energia; lançamentos
inválidos (longe da margem, sem água ou com parede no caminho) não gastam energia
nem isca. Se der 2h com a linha na água, ela é recolhida antes de o dia acabar.

**Captura perfeita.** Se o centro do peixe não sair da zona verde depois da
tolerância inicial, a captura é perfeita: "Perfeito!" aparece e a experiência
ganha 50% a mais.

**Nível de pesca (0 a 10).** Cada captura dá a experiência do jeito de nadar
(guardando ou soltando o peixe, uma vez só). Passar do nível N ao seguinte pede
100 + 25 × N de experiência, e o que sobra continua contando. O nível aumenta a
zona verde (22% da barra no nível 0, +1 ponto por nível, 32% no 10), o alcance do
lançamento e encurta a espera; os peixes não ficam mais difíceis para compensar.
Nível, progresso e zona aparecem na aba Personagem; subir de nível mostra um aviso.

**Vara de fibra de vidro.** À venda no Armazém a partir do nível 4 de pesca, por
1.500 moedas. A compra pede confirmação, confere tudo antes de cobrar e não deixa
comprar duas. A vara nova toma o lugar da de bambu na barra; a de bambu continua
na mochila (ou vai para o baú, se a mochila estiver cheia). Ela não aumenta a zona
verde: aceita **isca de minhoca** (5 moedas no Armazém). Escolha a vara no
Inventário e use "Carregar minhocas"; a quantidade aparece no ícone da barra. Cada
lançamento válido gasta uma, e a espera pela mordida cai pela metade. Sem isca, a
vara funciona normalmente.

**Configuração central.** Os números da pesca ficam juntos em `FISHING`, no
`js/data.js`: progresso (início 30, +10/s dentro, −8/s fora, 0,75 s de tolerância),
zona verde por nível, controle da zona, jeitos de nadar, espera, alcance, preços e
experiência. A física do minijogo fica em `js/fishcore.js` e é calculada pelo
tempo decorrido, em passos fixos de 10 ms: a mesma em qualquer taxa de quadros.

Peixes são vendidos no Armazém, um a um ou todos de uma vez. O Diário mostra o
nível, as espécies descobertas, o maior tamanho de cada uma e as capturas perfeitas.
Zonas de qualidade, lixo, tesouros, outras iscas, anzóis e encantamentos ficam
para uma próxima versão.

## Missões

As primeiras ensinam jogando: chegar à vila, a primeira plantação, a primeira
colheita, o galinheiro e o primeiro ovo. Depois vêm os pedidos pessoais (o banco
da praça, o chapéu perdido, uma cor sem nome, a encomenda de tintas, ovos para
a festa). O **Diário** mostra quem pediu, objetivo, progresso e recompensa.
Toda missão depende de ações no mundo; itens entregues saem da mochila e a
recompensa é dada uma única vez.

## Dias, energia e loja

### Calendário

Quatro estações de **29 dias**: Primavera → Verão → Outono → Inverno → Primavera
do ano seguinte. O jogo começa numa **segunda-feira, dia 1 da Primavera, ano 1**,
e a semana continua normalmente de uma estação para a outra. O painel no canto
de cima mostra dia da semana, data, estação, ano, horário (de 10 em 10 minutos),
moedas, energia e um pequeno céu com o sol ou a lua. O dia absoluto da partida é a
referência de tudo: aniversários (Lúcio, 9 do Inverno), eventos, rotinas e o
limite semanal de presentes, que vira **toda segunda-feira**.

### Duração do dia

Das **6h às 2h da madrugada**: 20 horas de jogo em **18 minutos de tempo real
ativo** (cada hora dura 54 segundos; cada 10 minutos do relógio, 9 segundos). O relógio interno é contínuo, e a luz muda
aos poucos. O tempo para em conversas, mochila, loja, baú e outros painéis, no
mapa, nas cenas, na pausa (P) e com a aba do navegador em segundo plano. Fechar e
voltar ao jogo não soma o tempo que passou fora. Dormir antes das 2h encerra o
dia; às 2h, uma transição curta avisa que o personagem precisa descansar e a
manhã seguinte começa em casa, sem perder itens nem dinheiro. A noite (plantas,
árvores, galinhas, coletáveis) é processada uma única vez por dia.

### Luz

Amanhecer (6h–8h) com luz suave e quente; dia claro (8h–16h); entardecer
dourado (16h–19h); anoitecer (19h–21h) e noite azulada (21h–2h), tudo em
transições graduais. À noite, janelas, postes, o lampião da varanda e a fogueira
do Lúcio acendem; caminhos e objetos continuam legíveis. Interiores têm luz
própria e não escurecem como lá fora. Painel, textos e menus nunca escurecem.

### Estações no cenário

Os cenários externos são redesenhados em cada estação (não é um filtro): grama
verde e árvores floridas na primavera; verdes mais intensos, copas cheias e
capim alto no verão; copas laranja, vermelhas e amarelas, folhas no chão e
vegetação seca no outono; neve no chão, nos telhados, nos pinheiros e nos
arbustos, árvores de galhos nus e água mais fria no inverno. Caminhos, portas,
pontes e colisões são os mesmos em todas as estações. A neve é só visual, e as
regras dos cultivos não mudaram.

### Coletáveis sazonais da Vila Acapulco

Toda noite podem surgir plantas pela vila (beira de caminhos, gramados, perto de
árvores e entre as casas), para colher com um clique de perto:

| Estação | O que surge | Quantos por noite |
| --- | --- | --- |
| Primavera | Narciso | 1 garantido + 20% de chance de outro |
| Verão | Ervilha-de-cheiro | 1 garantido + 20% de chance de outro |
| Outono | Amora | 90% de chance de 1 |
| Inverno | Flor de açafrão (54%), azevinho (38%), fruta de cristal (8%) | 70% de chance de 1 |

No máximo 12 ficam no chão ao mesmo tempo; o que passar disso naquela noite é
descartado. O que não for colhido fica até o fim da estação; na virada, some do
chão (o que já está na mochila ou no baú continua). Com a mochila cheia, a planta
fica onde está e o jogo avisa. Nada é gerado ao entrar na vila, abrir menus ou
recarregar a página. Os itens podem ser guardados, vendidos e dados de presente
(Iara gosta de flores; Tomé gosta de azevinho; Bia, de fruta de cristal).

**Modo de desenvolvimento:** abra o jogo com `?dev=1` no fim do endereço para ver
os pontos de surgimento em vermelho e usar `window.__trilha.dev` (avançar horas,
noites e dias; `setRain(true)` liga a chuva para testar a rotina de Iara). Nada disso aparece na versão normal.

### Energia e comida

Andar e conversar não gastam energia. Para recuperar no meio do dia, **coma**:
escolha o alimento na barra e clique numa **área livre** do cenário. Aparece a
pergunta "Comer [item]?" com **Sim** e **Não**. "Sim" come exatamente uma unidade,
com uma animação curta, e salva; "Não", E ou Esc deixam tudo como estava. Com a
energia cheia, o jogo avisa e não pergunta nada.

Comestíveis (regra do vale, cadastrada item a item em `EDIBLE`, no `js/data.js`):

| Item | Energia |
| --- | --- |
| Fruta de cristal | +40 |
| Tucunaré | +32 |
| Sardinha | +22 |
| Ovo | +20 |
| Goiaba | +18 |
| Laranja | +15 |
| Narciso | +10 |
| Amora silvestre | +8 |

Outras flores, cogumelos e colheitas não são comestíveis. A energia nunca passa de 100; o valor de cada alimento
está na descrição dele. Só escolher o alimento na barra não come nada: é preciso um
clique novo no cenário. Se o clique cair num morador, porta, baú ou outro alvo
próximo, vale essa interação. Dar o alimento de presente ou entregá-lo numa missão
não conta como comer. Enquanto a pergunta está aberta, o relógio para, ferramentas
e passos ficam bloqueados e não abre outra pergunta; cliques repetidos comem uma
unidade só. Ao acabar a pilha, o espaço fica vazio. Dormir recupera tudo e mostra um resumo da
noite.

O Armazém (Dona Celeste atende das 6h às 18h; a quantidade escolhida aparece em preto) vende sementes, mudas, ração,
galinhas e um chapéu, e compra colheitas, ovos, frutos, madeira, pedra e itens
do bosque. Preço, quantidade e total aparecem antes de confirmar.

## Itens

Mochila com 30 espaços em 3 linhas (a barra de acesso rápido mostra uma linha por
vez; os botões 1, 2 e 3 ao lado dela trocam a linha mostrada) e baú com 20. Saves antigos de 20 espaços ganham as vagas novas
vazias. Itens iguais empilham até 99. Se a mochila estiver cheia, o item fica onde
está e o jogo avisa. Três chapéus equipáveis: de palha, boina e de pescador.

## Salvamento

O progresso fica no navegador (`localStorage`): personagem e aparência, posição,
dia e horário, mochila, baú, moedas, canteiros, árvores, galinhas, amizades,
limites diários, missões e mudanças no mapa; ano, estação, dia, dia absoluto,
horário interno, última noite processada e os coletáveis no chão (item e
posição). Jogos salvos antes do calendário de 29 dias são convertidos pelo dia
absoluto, sem perder nada. De Lúcio: amizade, conversa do
dia, presentes do dia e da semana (com a semana de referência), presente de
aniversário do ano, permissão da tenda, etapas das missões, melhoria da tenda,
apito encontrado e entregue, cenas vistas e a conversa de Iara. De Iara:
presentes do dia e da semana, presente de aniversário do ano, nome da cor,
etapas dos acontecimentos de 3 e 5 corações, pinturas da fonte por estação e
ano e o quadro pendurado em casa. Recarregar a
página não reinicia limites nem repete eventos. Use o mesmo navegador e
aparelho para continuar. Jogos salvos antes de Lúcio ganham esses campos
zerados, sem perder nada.

Das plantações, por canteiro: tipo de cultivo, noites regadas no ciclo atual
(o estágio sai delas), rega do dia, colheitas já feitas (primeira produção ou
rebrota; os dias que faltam saem daí), e se o pé está seco. Abóboras de jogos
salvos antes desta versão: as maduras continuam maduras e as que cresciam mantêm
as noites já regadas (agora contam até 13).

Da pesca: vara recebida (ou guardada esperando espaço), carta de Tomé lida, dica
do minijogo vista, nível e experiência, vara usada por último, compra da vara de
fibra, minhocas carregadas, peixes guardados com o tamanho de cada um, espécies
descobertas com o maior tamanho e as capturas perfeitas. A experiência acumulada
nas versões anteriores vira nível na primeira vez que o jogo é aberto. A tentativa em andamento
não é salva: recarregar no meio dela só recolhe a linha, sem peixe de graça e sem
devolver a energia do lançamento. Espécie, recorde e experiência são gravados no
momento da captura; o peixe entra na mochila ao escolher "Guardar".

Jogos salvos da versão anterior da fazenda continuam: o jogo pede só o nome da
fazenda e o animal favorito, sem recomeçar nem mexer em mochila, plantações,
galinhas, amizades ou missões. Se o dia 12 já passou, o bicho chega na próxima
manhã. A idade passa a 22 anos.

Jogos salvos das versões com profissões não têm como continuar, porque a
estrutura da partida mudou. A tela de título explica isso e oferece começar a
nova fazenda mantendo o nome e a aparência. O jogo antigo não é apagado.

## Publicar no GitHub Pages

Em *Settings → Pages*, escolha *Deploy from a branch*, a branch desejada e a
pasta `/ (root)`. O jogo é só HTML, CSS e JavaScript, sem etapa de build.

## Estrutura

| Arquivo | O que tem |
| --- | --- |
| `index.html` | Página de entrada |
| `css/style.css` | Visual da interface |
| `js/data.js` | Itens, cultivos, árvores, moradores, missões, loja e configuração da pesca |
| `js/sprites.js` | Personagens em pixel art (cabelos, roupas, chapéus, 4 direções) |
| `js/portraits.js` | Retratos 64×64 dos moradores |
| `js/iara-portrait.js` | Retratos de Iara (5 expressões, roupa normal e de inverno) |
| `js/fishcore.js` | Física do minijogo de pesca (peixe, zona verde e progresso) |
| `js/world.js` | Mapa, interiores, colisão, câmera, ícones e desenho do mundo |
| `js/game.js` | Salvamento, criação, ferramentas, fazenda, moradores, missões e painéis |

## Visual

Pixel art de fazenda em cores vivas e quentes: grama verde-folha com tufos em
"v", caminhos de terra dourada com pedrinhas, lagos turquesa com margem clara e
vitórias-régias, árvores de copa em cachos de folhas (floridas na primavera,
coloridas no outono, nuas e com neve no inverno), cercas de troncos, paredes de
tábuas e contornos marrom-escuros. Os pixels aparecem maiores em telas grandes
(escala inteira, sem borrar). As cores do cenário saem de uma paleta-base única,
que as estações trocam por cima.

Toda a arte é desenhada por código, sem imagens de terceiros.

## Atualizações e cache

O arquivo `_headers` pede ao Cloudflare Pages que o navegador sempre confira se
há versão nova (`Cache-Control: no-cache`), e o `index.html` carrega os arquivos
com `?v=` (troque o número a cada versão). Assim, quem já jogou recebe a
atualização sem precisar limpar o cache.
