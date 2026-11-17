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
| Usar a ferramenta, semente ou muda | Clique na terra ou no objeto | Toque na terra ou no objeto |
| Escolher o item da barra | Clique na barra ou teclas 1 a 9 e 0 | Toque na barra |
| Avançar conversa | Clique na caixa, E, Espaço ou Enter | Toque na caixa de conversa |
| Abrir/fechar o mapa | M (fecha também com Esc) | Botão Mapa |
| Fechar painel | Esc ou clique fora | Botão ✕ |

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
**Aparência aleatória** sorteia só o visual. A prévia mostra frente, costas e os
dois lados, andando. O personagem tem 24×32 pixels e não perde cabelo nem
acessório em nenhuma direção, andando, usando ferramentas ou de chapéu.

O gênero define os pronomes nas falas (masculino, feminino ou formas neutras).
Não há casamento, gravidez nem filhos. O guarda-roupa de casa permite mudar
cabelo, roupas, acessório e chapéu a qualquer momento. A idade é 22 anos.

**Nomes:** aceitam letras com acento, números, espaços e pontuação comum
(`. , ' ! ? & ( ) -`). Espaços nas pontas são retirados e nome só com espaços não
vale. O limite é pela largura na tela (até 16 letras no nome e 20 na fazenda): ao
chegar nele, o campo avisa. Os nomes aparecem como texto nas falas, na carta, no
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
teleporta. No cenário, uma seta amarela aponta o destino (ou a porta que leva até
ele). No Diário, "Mostrar no mapa" escolhe qual missão acompanhar.

**Galinheiro passo a passo:** Bia entrega 5 de ração. Siga a estrada que desce da
porteira até o fim, vire à esquerda e entre pela porta vermelha. Clique no
comedouro (cada clique põe 1 porção da mochila), ponha 2 e volte a falar com
Bia: ela dá uma galinha para você batizar. Com ração no comedouro, a galinha bota
de noite, e o ovo aparece nos ninhos de manhã.

**Calendário e bicho:** as estações têm 28 dias. Na manhã do dia 12 da primavera
do ano 1, Bia traz o seu animal favorito. Aceite e dê um nome; se adiar, ela volta
na manhã seguinte. O bicho passeia perto da casa e gosta de carinho (clique).

## Fazenda

- **Ferramentas** (gastam energia a cada uso ou golpe): enxada ara, regador rega
  (10 usos por carga), machado corta galhos, tocos e árvores comuns, picareta
  quebra pedras, foice corta o mato. A espada simples serve para treinar no boneco.
- **Cultivos**: rabanete (2 dias, semente 8, vende 18), tomate (4 dias, 15 → 40)
  e abóbora (6 dias, 25 → 75). Cada dia regado conta um dia de crescimento; sem
  rega a planta pausa, mas não morre. O crescimento acontece só ao dormir.
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
vira nos dias 1, 8, 15 e 22 de cada estação. Antes de entregar, o jogo pergunta
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
- cada morador aceita um presente por dia (com um produto na mão, a conversa oferece a opção), e os preferidos rendem mais; Lúcio tem regras próprias (acima);
- com 1 coração surge o pedido pessoal de cada um; com 3, uma pequena cena e um presente;
- as falas mudam conforme a amizade. Não há romance.

## Missões

As primeiras ensinam jogando: chegar à vila, a primeira plantação, a primeira
colheita, o galinheiro e o primeiro ovo. Depois vêm os pedidos pessoais (o banco
da praça, o chapéu perdido, flores para a tela, a encomenda de tintas, ovos para
a festa). O **Diário** mostra quem pediu, objetivo, progresso e recompensa.
Toda missão depende de ações no mundo; itens entregues saem da mochila e a
recompensa é dada uma única vez.

## Dias, energia e loja

O relógio vai das 6h até o fim da noite, com a luz mudando entre manhã, tarde e
noite, e para enquanto há conversa ou painel aberto. Nada de ruim acontece se anoitecer: o dia só termina quando você dorme, o
que recupera a energia e mostra um resumo da noite. Andar e conversar não
gastam energia.

O Armazém (Dona Celeste atende das 6h às 18h) vende sementes, mudas, ração,
galinhas e um chapéu, e compra colheitas, ovos, frutos, madeira, pedra e itens
do bosque. Preço, quantidade e total aparecem antes de confirmar.

## Itens

Mochila com 20 espaços (os 10 primeiros são a barra de acesso rápido) e baú com
20. Itens iguais empilham até 99. Se a mochila estiver cheia, o item fica onde
está e o jogo avisa. Três chapéus equipáveis: de palha, boina e de pescador.

## Salvamento

O progresso fica no navegador (`localStorage`): personagem e aparência, posição,
dia e horário, mochila, baú, moedas, canteiros, árvores, galinhas, amizades,
limites diários, missões e mudanças no mapa. De Lúcio: amizade, conversa do
dia, presentes do dia e da semana (com a semana de referência), presente de
aniversário do ano, permissão da tenda, etapas das missões, melhoria da tenda,
apito encontrado e entregue, cenas vistas e a conversa de Iara. Recarregar a
página não reinicia limites nem repete eventos. Use o mesmo navegador e
aparelho para continuar. Jogos salvos antes de Lúcio ganham esses campos
zerados, sem perder nada.

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
| `js/data.js` | Itens, cultivos, árvores, moradores, missões e loja |
| `js/sprites.js` | Personagens em pixel art (cabelos, roupas, chapéus, 4 direções) |
| `js/world.js` | Mapa, interiores, colisão, câmera, ícones e desenho do mundo |
| `js/game.js` | Salvamento, criação, ferramentas, fazenda, moradores, missões e painéis |

Toda a arte é desenhada por código, sem imagens de terceiros.

## Atualizações e cache

O arquivo `_headers` pede ao Cloudflare Pages que o navegador sempre confira se
há versão nova (`Cache-Control: no-cache`), e o `index.html` carrega os arquivos
com `?v=` (troque o número a cada versão). Assim, quem já jogou recebe a
atualização sem precisar limpar o cache.
