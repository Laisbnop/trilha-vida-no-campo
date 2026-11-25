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

Na criação: gênero (Feminino ou Masculino), 6 tons de pele, 19 penteados (curtos,
médios e longos; lisos, ondulados, cacheados e crespos; tranças, coque, rabo de
cavalo, longo em ondas, médio com franja lateral e emo com franja longa), cor do
cabelo em três barras, 6 modelos de roupa de cima (camiseta, regata, camisa, blusa, moletom e
jardineira), 4 de baixo (calça, short, saia e saia longa), calçado, 4 acessórios
(óculos, laço, bandana e cachecol) com cor, animal favorito (gato ou cachorro),
nome do personagem e nome da fazenda. Tudo vale para qualquer gênero. O botão
**Aparência aleatória** sorteia só o visual. O personagem não perde cabelo nem
acessório em nenhuma direção, andando, usando ferramentas, pescando ou de chapéu.

**Mesma definição dos moradores (padrão Stardew Valley).** O jogador é desenhado pelo
mesmo gerador de sprites dos moradores (`js/sprites.js`): **1 pixel do desenho por
ponto do mundo**, figura de cerca de 16 × 28 a 29 pontos, com os pés no mesmo ponto
de sempre (veja "Tamanho dos personagens"). Todas as opções da criação continuam:
nenhum id, escolha ou salvamento mudou. O perfil direito é o espelho do esquerdo,
como nos moradores (franjas assimétricas trocam de lado ao virar).

**Gênero e base visual.** O gênero define os pronomes nas falas e também a
**base visual** do corpo, que aparece na prévia, no mapa, ao andar, nas
ferramentas, na pesca e na ficha do personagem:

| Escolha | Base | Ponto de partida |
| --- | --- | --- |
| Masculino | ombros e peito mais largos, maxilar quadrado com sombra, sobrancelhas mais marcadas, boca mais larga | cabelo curto liso, camisa verde e calça |
| Feminino | ombros mais estreitos e cintura marcada, queixo mais fino, cílios, boca rosada e bochechas mais coradas | cabelo longo ondulado com laço, blusa rosa e saia |

A criação oferece Feminino e Masculino. Jogos salvos com a base neutra das
versões anteriores continuam carregando normalmente, com a mesma aparência.

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

**Novos penteados** (para qualquer gênero, nas quatro direções e andando, sem
perder formato nem volume):

- **Longo em ondas**: longo e volumoso, com ondas em camadas, mechas emoldurando
  o rosto e pontas viradas para fora.
- **Médio com franja lateral**: na altura do queixo, com risca lateral, franja
  varrida para um lado, volume e pontas em camadas.
- **Emo com franja longa**: assimétrico e em camadas, com a franja em diagonal
  cobrindo parte de um olho e pontas bem definidas.

**Cor do cabelo em barras.** Na própria etapa do cabelo (e no guarda-roupa de
casa), três barras horizontais combinam a cor em HSL: **Cor** (o espectro, de
vermelho a laranja, amarelo, verde, azul, roxo e rosa), **Intensidade** (de
acinzentado a cor viva) e **Luminosidade** (de escuro a claro), com valores de 0
a 100 ao lado. Dá para arrastar o marcador, clicar em qualquer ponto da barra ou,
com a barra selecionada, usar as setas (Page Up/Page Down de 10 em 10; Home e End
nos extremos). As barras de intensidade e luminosidade mostram a cor escolhida,
e a prévia muda na hora, enquanto se arrasta. **Restaurar cor padrão** volta ao
castanho. Trocar de penteado mantém a cor. Dá para fazer cabelo preto, castanho,
loiro, ruivo, branco, cinza e colorido (inclusive verde).

A cor não pinta o cabelo inteiro de um tom só: de cada cor sai uma pequena
paleta de base, sombra e luz, que mantém mechas, reflexos e contornos. Nos
extremos (quase preto ou quase branco), a sombra e a luz se afastam mais, para o
volume continuar legível. Só o cabelo (e as sobrancelhas, do mesmo tom) muda:
pele, olhos, roupas e acessórios ficam iguais. O jogo salva o penteado e os três
valores. Jogos salvos com uma das cores prontas de antes continuam exatamente
com a mesma cor até o jogador mexer nas barras.

**Sprites e nitidez.** Todos os personagens (jogador e moradores) são desenhados
na mesma grade de pixels do cenário: um pixel do sprite é um pixel do mundo, com
cerca de 14×23 pixels de corpo dentro de um quadro de 24×32 e os pés sempre no
mesmo ponto. Corpo, rosto, roupas e calçados são desenhados direto nessa grade
(antes, o mapa usava uma versão reduzida do desenho, cortando linhas e colunas);
por isso a prévia da criação, os painéis e o mapa mostram exatamente o mesmo
desenho, e o tamanho no mapa (em relação a portas, cercas e casas) não mudou.

- **Separação das partes**: contorno escuro levemente tingido pela cor de cada
  parte; linha escura onde o cabelo encosta no rosto; sombra no pescoço; vinco
  entre braço e tronco (de frente) e dos dois lados do braço (de perfil); cós
  separando blusa e calça; pernas separadas e calçados com sola mais escura.
- **Volume**: luz vinda da esquerda e sombra à direita em rosto, roupas, braços e
  pernas, com 2 ou 3 tons por parte; rosto com olhos de 2 pixels e brilho,
  sobrancelhas, nariz, bochechas e boca.
- **Caminhada**: de frente e de costas, o pé que dá o passo sobe (joelho dobrado)
  e o braço do outro lado vai à frente; de perfil, as pernas abrem em passada
  (perna de trás mais escura) e o antebraço balança. Cabelo, chapéu e acessórios
  não mudam de tamanho nem de lugar entre os quadros.
- Ferramentas, pesca, pontos de apoio dos pés, colisões e alcances continuam nos
  mesmos pontos. O Caleb e a Iara têm sprite do mapa desenhado à mão (`js/hand-art.js`), na mesma grade.
- Todos os canvases de pixel art são exibidos sem suavização, em escala inteira
  (2× ou 3× nos painéis), e o cenário e os personagens são desenhados em posições
  inteiras, também com a câmera em movimento.

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
- **Vila** (centro): a praça com a fonte continua sendo o centro, com o Armazém e
  as casas dos moradores em volta. Entre a vila e o bosque, uma **trilha** sobe
  para o norte, até a serra.
- **Vila sul**: três ruelas descem da rua de Bia e de Iara até a **rua de baixo**,
  passando pela **praça do coreto** (canteiros, bancos e postes). A **escola** fica
  no leste da vila, de frente para a rua de baixo. Ao sul da rua ficam a **horta
  comunitária**, jardins com canteiros, um banco e uma mesa de piquenique.
- **Beira-rio** (sul): o **rio do sul** cruza o mapa de oeste a leste, com areia
  nas duas margens, duas pontes, um píer de tábuas e o encontro com o rio do
  bosque. Dá para pescar sardinhas da areia, do píer e da margem sul.
- **Bosque** (leste do centro): árvores comuns, rochas, amoras, cogumelos e flores,
  nos mesmos lugares de antes. O rio do bosque agora desce até o rio do sul, com
  uma ponte na rua de baixo e outra na beira-rio.
- **Bairro leste**: a estrada principal segue até uma avenida norte-sul. Nela ficam
  dois **terrenos reservados** com estacas e placa: o de cima para um futuro
  ferreiro e o de baixo, ao sul dele, para o **museu** (só o terreno, sem prédio,
  coleção ou entrada nesta versão). Há também um laguinho para pescar com bancos,
  um pomarzinho, uma trilha até a margem leste da lagoa, um poço antigo e
  trilhas até o rio.
- **Mata** (sudoeste): floresta fechada ao sul da fazenda, por onde o rio entra no mapa.

O mundo tem 1600 × 896 px, com cerca de 2,7 vezes a área caminhável de antes fora
da fazenda, na mesma escala de personagens e construções. A fazenda, os
canteiros, o galinheiro e tudo o que é do bosque continuam nas mesmas
coordenadas, então plantações, animais, baús e objetos não mudam. Se uma posição
salva cair dentro de algo novo, o personagem aparece no ponto livre mais próximo.
Coletáveis sazonais que estivessem num lugar agora ocupado somem; os novos podem
surgir também na vila sul, na beira-rio e no bairro leste. Os trajetos dos
moradores são reservados no mapa (a vegetação nunca cai neles); o de Tomé passou a
contornar a lagoa e a placa do bosque, e o de Iara contorna o banco da praça.

**Iara e a escola nova:** nos dias úteis, ela sai de casa às 7h, desce a ruela ao
lado da casa dela e segue pela rua de baixo até a escola (cerca de 27 minutos a
pé), chegando às 7h30. Às 12h30 faz o caminho de volta e chega em casa por volta
das 13h. Os outros horários continuam os mesmos.

Interiores: a **casa** (cama, baú e guarda-roupa), o **Armazém** e o
**galinheiro** (comedouro com placa "RAÇÃO", três ninhos, feno e bebedouro).

**Armazém CELESTE por dentro:** um mercadinho de 304 × 208 px, com:

- piso de tábuas com variação discreta;
- papel de parede claro com raminhos, lambri de madeira, duas janelas com cortina,
  mural de avisos, cartaz de frutas, relógio e prateleira de potes;
- o balcão de atendimento no canto superior esquerdo, com caixa registradora,
  balança, pote de balas e sacolas, e Dona Celeste atrás dele;
- duas fileiras de gôndolas abastecidas (garrafas, potes e pacotes) no centro e à
  direita, com corredores entre elas;
- caixas de hortaliças na parede, caixotes de frutas com pazinha, sacos de sementes
  e de ração, barril, vasos de planta e tapete na entrada;
- luz quente das luminárias no piso.

Os móveis altos são desenhados na ordem certa: quem anda atrás de uma gôndola
fica escondido por ela. Só a base de cada móvel bloqueia. A entrada fica embaixo,
no centro, com caminho livre até o balcão, e corredores largos entre as gôndolas e
nos dois lados. Para ser atendido, fale com Dona Celeste ou clique no balcão,
pelo lado do cliente. Os objetos expostos são decorativos: o catálogo, os preços,
os horários e as regras de compra e venda continuam os mesmos.

A câmera deixa uma folga embaixo da loja, para a saída nunca ficar sob a barra de
ferramentas. Ao passar por uma porta, as dicas temporárias da cena anterior somem. Com a vara
na mão, a dica de pesca só aparece onde há água, e Espaço não faz nada dentro dos
prédios. Avisos longos quebram linha e não passam da tela.

**Tela do mapa** (M ou botão Mapa): mostra o mapa de verdade, com a fazenda pelo
nome, casa, galinheiro, cercado, roça, lago, Vila Acapulco, Armazém, praça, casas
dos moradores, escola, praça do coreto, horta, beira-rio, bosque, bairro leste,
os terrenos reservados (com ícone próprio de "terreno reservado", nunca como
prédio aberto), estradas, a sua posição e o destino da missão acompanhada, com
legenda. O tempo para enquanto ele está aberto, e ele não
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

## Habilidades

O jogador tem três habilidades, **Cultivo**, **Pesca** e **Coleta**, cada uma
com a própria experiência, do nível 0 ao 10. A tabela usa experiência **total
acumulada** (do nível 1 ao 2, por exemplo, faltam 380 − 100 = 280 XP):

| Nível | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| XP total | 100 | 380 | 770 | 1.300 | 2.150 | 3.300 | 4.800 | 6.900 | 10.000 | 15.000 |

| Habilidade | Como ganha experiência | Benefício por nível |
| --- | --- | --- |
| Cultivo | colher rabanete 15, tomate 12, morango 18, abóbora 31, milho 10, melão 27, repolho roxo 28 (uma vez por colheita; morango, abóbora e milho dão de novo a cada nova produção); carinho em galinha 5 (uma vez por dia por galinha); ovo recolhido do ninho 5 | enxada e regador gastam 5% menos energia (50% no nível 10) |
| Pesca | captura concluída: sardinha 13, tucunaré 20; alga, musgo ou lixo 3. Captura perfeita de peixe: × 2,4, arredondado para baixo (não vale para alga, musgo e lixo) | zona verde do minijogo: 22% da pista + 1 ponto por nível (32% no 10); vara de fibra de vidro liberada no nível 2 |
| Coleta | coletável da natureza (flor, fruto, cogumelo; na vila, no bosque e na serra) 7 por ponto; árvore derrubada com o machado 12 (só quando cai); toco da árvore 1 | machado gasta 5% menos energia (50% no nível 10) |

Não dão experiência: andar, abrir menus, comprar, vender, arar, plantar, regar,
golpes que não terminam nada, peixes que escapam, pescarias canceladas, itens
movidos entre espaços, comprados, ganhos de presente ou tirados do baú. A
quantidade colhida não multiplica a experiência: conta a colheita, o ponto de
coleta ou a árvore, uma vez. O tamanho do peixe não muda a experiência.

**Quando sobe de nível.** A experiência entra na hora (um aviso discreto,
"+15 Cultivo", sobe do personagem, sem abrir janela). O nível novo e o benefício
só são confirmados ao dormir, e passam a valer no dia seguinte. Durante o dia, a
aba Habilidades ganha um "!" e mostra o nível a confirmar. No resumo da noite
aparece um quadro com todas as habilidades que subiram, o nível novo e o
benefício; vários níveis podem subir na mesma noite. Desmaiar às 2h também
confirma, e cada avanço é confirmado uma vez só.

**Energia.** A redução vale sobre o custo normal da ferramenta (enxada 2,
regador 1, machado 2) e guarda frações: no nível 1 de Cultivo, arar gasta 1,9.
A sorte do dia não muda a energia.

**Aba Habilidades** (E → estrela): ícone, nome, nível confirmado, dez marcas de
nível, barra de progresso com o XP dentro do nível ("50 de 280 XP para o nível
2"), o total, o benefício atual e como ganhar experiência. No nível 10 aparece
"Nível máximo". Mineração e combate não existem neste jogo e não aparecem.

**Saves antigos.** Cultivo e Coleta começam em 0 XP, sem experiência
retroativa. A pesca antiga (nível com 100 + 25 × N de XP por nível) foi
convertida em XP total: a soma dos níveis completos mais o que sobrava. O nível
passa a vir da tabela nova, já confirmado (ex.: nível 4 com 50 XP = 600 XP totais
= Pesca nível 2). O sistema antigo de nível de pesca deixou de existir. Ficam
salvos o XP de cada habilidade e o nível confirmado; o que está a confirmar vem
da diferença entre os dois.

### Ruas e caminhos

A área rural e o centrinho têm pisos diferentes:

- **Terra batida** (saída da fazenda, ruas da vila sul, bairro leste, trilhas e
  serra): ocre quente, com variações bem próximas da cor de base, marquinhas
  delicadas de 1 a 2 pixels em grupos espaçados (sem manchas geométricas) e
  pedrinhas ocasionais em grupinhos de 1 a 3, com luz em cima e sombra embaixo.
  Nas bordas, a grama entra em recortes irregulares (ondas largas com dentes
  menores) e pontas de folha de 1 a 3 pixels avançam sobre a terra, com uma sombra
  suave logo abaixo da grama; nenhuma borda fica em linha reta. A faixa central
  fica livre para andar. Em frente à casa, a terra se abre um pouco e chega até o
  degrau da varanda.
- **Calçamento antigo do centrinho**: da frente do Armazém CELESTE, passando
  pela rua até a casa de Seu Honório, até a praça da fonte, num piso contínuo.
  São pedras pequenas, arredondadas ou levemente retangulares e de cantos gastos,
  em fileiras desencontradas com pequenas variações de tamanho e posição. Os tons
  ficam próximos de bege, cinza quente e marrom suave, com algumas peças mais
  claras ou mais escuras, distribuídas com moderação. As juntas são estreitas e só
  um pouco mais escuras, com luz discreta em cima de cada peça e sombra suave
  embaixo. O padrão é alinhado pelas coordenadas do mundo: entre a frente do
  Armazém e a praça não há emenda nem reinício da textura, e ela não muda com a
  câmera nem entre os quadros. Nas bordas, uma fileira discreta de pedras de
  contorno fecha o piso. Junto à grama, a borda tem pequenas falhas e alguns
  tufos, sem recorte reto. Junto ao caminho de terra (que continua de terra até a
  fazenda), as pedras terminam bem encaixadas e a terra chega até elas, um pouco
  mais escura e compactada. A fonte, os bancos, os postes e a entrada do Armazém
  continuam no mesmo lugar.
- **Calçamento de pedras irregulares** na praça do coreto (vila sul), com
  meio-fio nas bordas.
- Nas bordas das pedras com a grama, pontas de folha curtas passam por cima do
  meio-fio aqui e ali, integrando o piso aos gramados e canteiros.
- **Areia** nas margens do rio.

As ruas não são mais pintadas retângulo por retângulo: cada trecho marca uma
máscara do mapa, e uma passada única pinta tudo pixel a pixel, com texturas que
dependem só da posição. Assim curvas, cantos e cruzamentos não têm emendas, o
padrão continua de um trecho para o outro e nada pisca entre os quadros. O
traçado, a largura, as colisões, as árvores, os pontos de coleta e as rotinas não
mudaram (o sorteio do cenário é o mesmo). As estações continuam valendo: neve na
terra e nas pedras no inverno, folhas caídas no outono. O mapa do menu (M) mostra
os mesmos pisos.

### Tamanho dos personagens

Referência: a escala de Stardew Valley, com arte própria. O ladrilho do jogo tem
**16×16 pontos do mundo** (a terra da fazenda é uma grade de 16), e um adulto ocupa
mais ou menos **um ladrilho de largura por menos de dois de altura**. No quadro
oficial de 16×32 da Abigail (folha de sprites da wiki de Stardew Valley), a figura
visível tem 27 pixels de altura. O quadro é só o espaço reservado: a altura visível
de cada personagem é outra coisa.

Três medidas diferentes, para cada personagem:

| Personagem | Arte de origem (quadro) | Densidade | Figura visível no mundo (largura × altura) |
| --- | --- | --- | --- |
| Jogador (base masculina, curto liso) | 24×32 (gerador de sprites) | 1 pixel por ponto | 16 × 28 |
| Jogadora (base feminina, longo ondulado) | 24×32 | 1 | 16 × 29 |
| Caleb | 24×32 (desenho próprio, `js/hand-art.js`) | 1 | 13 × 30 |
| Celeste | 24×32 (gerador de sprites) | 1 pixel por ponto | 16 × 30 |
| Lúcio | 24×32 | 1 | 16 × 29 |
| Bia | 24×32 | 1 | 15 × 28 |
| Tomé | 24×32 | 1 | 14 × 28 |
| Honório | 24×32 | 1 | 14 × 27 |
| Iara (13 anos) | 24×32 (desenho próprio, `js/hand-art.js`) | 1 | 16 × 22 (com as chuquinhas) |

Na tela, cada ponto do mundo vira k×k pixels (k inteiro de 2 a 4, conforme a
janela), sem suavização; o zoom, o mapa e as construções não mudaram.

- **Adultos:** de 27 a 30 pontos, com pequenas diferenças individuais (Celeste tem o
  coque alto; Honório é o mais baixo). Todos os adultos, jogador e Caleb incluídos,
  ganham duas linhas de perna (uma linha lisa da canela, ou da perna logo acima do
  calçado nas saias), sem tocar no rosto.
- **Mesma definição para todos:** jogador, Caleb e moradores usam 1 pixel do desenho
  por ponto do mundo, como em Stardew Valley. Antes, o jogador e o Caleb tinham o
  dobro de pixels (traço mais fino e corpo mais estreito, com 12 de largura) e
  pareciam de outro jogo ao lado dos moradores.
- **Iara:** desenhada à mão como criança (`js/hand-art.js`), no estilo das crianças dos
  jogos de fazenda em pixel art, como a Jas de Stardew Valley, com arte própria: cerca
  de 22 pontos de altura, cabeça um pouco maior que o corpo, sem exagero. Cabelo preto
  rente à cabeça, com franja reta e duas chuquinhas baixas (marias-chiquinhas) presas
  com elástico amarelo, e laço amarelo no alto; jardineira lilás com manchinhas de
  tinta e tênis brancos. No inverno: gorro com pompom, cachecol, moletom e calça.
  Quatro direções (a direita é o espelho da esquerda) e caminhada. Cavalete, pincel,
  caderno, xícara e livro ficam na altura das mãos dela.
- **O que acompanha:** os pés ficam no mesmo ponto (contato com o chão, profundidade e
  colisão iguais). Fones, notinhas e prato do Caleb ficam na cabeça e nas mãos
  do desenho dele; ferramentas, vara e linha seguem as mãos do jogador. Retratos, prévias,
  ícones e menus não diminuem.
Os moradores do gerador de sprites usam uma configuração só, `Sprites.WORLD` (em
`js/sprites.js`), que converte cabelos, chapéus e acessórios da grade de criação e
as posições presas ao corpo (sombra, mãos, vara, balões e corações). A área de
clique continua larga. Velocidade, alcance e regras não mudaram.

### Construções da vila

Cada prédio da vila tem fachada própria, desenhada por código em pixel art, com
silhueta, materiais e detalhes diferentes, mas com a mesma linguagem (contorno
escuro, telhas com fiadas, beirais, peitoris e sombras):

- **Armazém CELESTE**: dois andares. No térreo, o comércio, com paredes de tábua
  pintada, duas vitrines com mercadorias e toldos listrados, porta dupla de vidro,
  lampiões, caixotes de frutas e vasos. Entre os andares fica o letreiro
  **CELESTE**: uma faixa contínua de madeira com fundo bege, de uma ponta à outra
  da fachada, que divide o comércio da casa de cima. As letras são desenhadas
  numa fonte própria de 8 × 11 px com traço de 2 px (nada de fonte esticada), e o
  nome é centralizado pela largura real do texto. Em cima fica a casa de Dona Celeste, com tábuas
  creme, três janelas com floreiras e cortinas e uma empena com janela redonda e
  chaminé. Só o térreo tem porta: a casa de cima não tem interior, escada nem
  entrada para o jogador. Dona Celeste atende das 6h às 18h; depois passeia pela
  praça e, perto das 21h40, sobe para casa e some até a manhã seguinte (não fica
  presa no balcão).
- **Casa de Seu Honório** (carpinteiro aposentado): telhado de duas águas em
  ardósia, empena de tábuas com respiro, paredes de madeira escura sobre pedra,
  alpendre com esteios, uma bancada com serrote e tábuas encostadas.
- **Casa de Bia** (que cria galinhas): madeira amarela, telhado verde com
  água-furtada, catavento de galo, varanda listrada com esteios brancos,
  floreiras vermelhas, uma galinha de madeira e uma casinha de passarinho.
- **Casa de Iara** (que pinta): lilás, telhado roxo de duas águas, janela do
  sótão-ateliê com o cavalete à mostra, porta azul em arco, paleta pendurada,
  respingos de tinta no degrau e uma cerquinha com cada estaca de uma cor.
- **Escola**: tijolinho com cantos brancos, frontão com relógio, torre do sino,
  placa ESCOLA, janelas altas em arco, porta dupla com escadaria e mastro com
  bandeirola, ao lado do pátio cercado.
- **Cabana de Tomé**: toras com pontas aparentes, telhado com musgo, chaminé de
  pedra, lampião, pilha de lenha, balde e vara de pesca encostada.

Os prédios são sprites altos: só a parte de baixo (paredes) bloqueia a passagem,
e o personagem pode andar atrás do telhado, que aparece na frente dele. Portas
funcionam por clique e pela tecla Q, as janelas acendem à noite, as chaminés
soltam fumaça e os telhados ganham neve no inverno. A casa da fazenda e o
galinheiro mantêm o desenho próprio. O mapa (M) mostra as fachadas e as árvores.

## Fazenda

- **Ferramentas** (gastam energia a cada uso ou golpe): enxada ara, regador rega
  (20 usos por carga), machado corta galhos, tocos e árvores comuns, picareta
  quebra pedras, foice corta o mato. A espada simples serve para treinar no boneco.
- **Cultivos**: escolha a semente na barra e clique na terra arada; regue com o
  regador; colha clicando perto da planta pronta. Cada noite depois de um dia
  regado conta um dia de crescimento; sem rega a planta pausa, mas não morre. O
  crescimento acontece só uma vez por noite (dormir, desmaiar às 2h ou recarregar
  não repete). Planta madura espera a colheita. Com a mochila cheia, o fruto fica
  na planta.

| Cultivo | Estações de plantio | Primeira colheita | Nova colheita | Semente | Venda |
| --- | --- | --- | --- | --- | --- |
| Rabanete | qualquer | 3 dias regados | — (colheita única) | 12 | 20 |
| Tomate | qualquer | 4 dias regados | — (colheita única) | 20 | 60 |
| Morango | Primavera, Outono e Inverno | 5 dias regados (5 estágios de 1 dia) | a cada 4 dias regados | 150 | 320 |
| Abóbora | Primavera e Outono | 13 dias regados (estágios de 1, 2, 3, 4 e 3 dias) | a cada 6 dias regados | 42 | 88 |
| Milho | Verão e Outono | 14 dias regados | a cada 4 dias regados | 150 | 50 |
| Melão | Verão | 12 dias regados | — (colheita única) | 80 | 250 |
| Repolho roxo | Verão | 9 dias regados | — (colheita única) | 100 | 260 |

  Semente: preço de compra por unidade. Venda: preço de cada unidade colhida.
  **Rabanete e tomate** dão uma única colheita: ao colher, a planta sai e o
  canteiro continua com a terra preparada para uma nova semente. A aparência de
  planta madura só aparece quando ela já pode ser colhida.

  **Morango e abóbora** dão 1 fruto por colheita e o pé continua plantado,
  voltando ao estado sem frutos (sem precisar de semente nova). Os estágios
  aparecem no canteiro: no morango, broto, folhas, flores, frutos verdes e frutos
  vermelhos (prontos); na abóbora, broto, folhas, rama, flor, abóbora verde
  pequena e abóbora laranja grande (pronta). Na rebrota, o pé adulto mostra a flor,
  depois o fruto em formação e o fruto maduro. O Armazém compra os frutos em
  qualquer estação. **Na manhã da nova estação**, um pé já germinado seca se a
  nova estação não for uma das suas (o morango atravessa do Outono para o
  Inverno; a abóbora seca no Verão e no Inverno), e os frutos que ficaram se
  perdem; limpe o canteiro com a foice (1 de energia). Se não houver tempo para a
  primeira colheita antes da troca para uma estação incompatível, o jogo avisa e
  pergunta se quer plantar mesmo assim. O morango é comestível
  (+30 de energia) e é o presente favorito da Dona Celeste: vale 150 pontos de
  amizade, com resposta própria. Para os outros moradores, é um presente neutro.
  A contagem da próxima produção de morango e abóbora começa depois da colheita.

  **Cultivos de verão.** O **milho** cresce em 14 dias regados, dá 1 espiga e o
  pé fica: volta a produzir a cada 4 dias regados contados depois da colheita,
  sem limite de colheitas. É alto (broto, folhas, colmo, pendão, espigas verdes e
  espigas douradas), mas o personagem sempre aparece na frente e os canteiros
  atrás continuam clicáveis. Cresce no Verão e no Outono: na virada do Verão para
  o Outono o pé continua com o progresso; seca ao chegar o Inverno. O **melão** (12
  dias) e o **repolho roxo** (9 dias) são só de Verão e de colheita única: ao
  colher, a planta sai e o canteiro fica pronto. Os três são comestíveis (milho
  +25, melão +113, repolho roxo +75, sempre até o máximo de 100), são vendidos no
  Armazém (50, 250 e 260 moedas), dão XP de Cultivo a cada colheita (10, 27 e 28)
  e são presentes neutros para quem não tem preferência cadastrada. Não há
  receitas, produtos artesanais nem cultivos gigantes.

  **Sementes o ano todo e plantio fora de estação.** Todas as sementes ficam à
  venda no Armazém em qualquer estação; as que não crescem na estação atual têm a
  etiqueta "Fora de estação". Ao plantar uma delas, o jogo pergunta "Esta semente
  não cresce nesta estação. Plantar mesmo assim?" (**Sim**/**Não**). "Não" não
  gasta semente nem energia. "Sim" gasta a semente e ocupa o canteiro: a semente
  fica esperando, não avança mesmo regada, e os dias fora de estação não contam.
  Quando chega uma estação permitida, ela começa a crescer normalmente (a noite da
  virada não conta; depois, só os dias regados). Enquanto espera, a semente
  sobrevive às trocas de estação e ao salvar/carregar, e a foice pode removê-la
  (sem devolver a semente). Só sementes ainda não germinadas esperam: plantas que
  já cresceram seguem a regra acima e secam numa estação incompatível.

  **Informações de cultivo.** Na loja, cada semente ocupa uma linha compacta:
  ícone, nome, preço, botão **Comprar** e, se for o caso, "Fora de estação".
  Clicar no nome ou no ícone abre o painel "Informações de cultivo" (sem comprar
  nada), com imagem, preço da semente, preço de venda, estações, dias até a
  primeira colheita, produção, colheita única ou recorrente, intervalo de
  rebrota, necessidade de rega e se a semente cresce agora. Cultivos recorrentes
  avisam que a quantidade de colheitas depende dos dias restantes, da rega e de
  quando você colhe; fora de estação aparece "Pode ser comprada e plantada agora,
  mas só começará a crescer na estação indicada." Tudo é gerado dos dados do
  cultivo (`CROPS` e `ITEMS`, em `js/data.js`), assim como a descrição das
  sementes. O painel tem tamanho limitado, rola por dentro e, ao fechar (Fechar,
  Esc, E, Enter ou clique fora), a lista da loja continua na mesma posição.
- **Árvores frutíferas**: laranjeira e goiabeira. A muda precisa de grama livre,
  sem outra árvore encostada. Ficam adultas em 5 ou 6 dias e dão 2 frutos a cada
  3 dias. Não precisam de rega.
- **Galinhas**: a primeira vem de uma missão; outras são vendidas no Armazém
  por 130 moedas cada, depois da missão do galinheiro (até 4). Cada porção de ração no comedouro alimenta uma galinha por noite, e
  galinha alimentada bota um ovo, que aparece no ninho na manhã seguinte. Dá
  para dar nome, fazer carinho (uma vez por dia) e ver o bem-estar.
- **Bosque**: a árvore cortada deixa um toco, que também pode ser removido;
  ela volta em 4 dias e as rochas em 3. Os itens de coleta mudam de lugar todo dia.

### Grama, mato e arbustos da cidade

Desenhos próprios, orientados por referências de jogos de fazenda em pixel art;
nada é recortado de capturas.

- **Grama baixa**: cobertura contínua feita de folhinhas de 3 a 5 pixels (sombra
  embaixo, corpo e ponta iluminada), em verdes claros nas áreas de luz e verdes
  mais profundos nas de sombra. As áreas de luz e sombra são manchas irregulares e
  suaves, sem elipses nem blocos chapados. As folhas ficam numa grade desencontrada,
  com deslocamentos e falhas, então não aparecem fileiras, emendas nem a grade dos
  tiles.
- **Mato alto**: moitinhas com altura (8 a 12 pixels), topo recortado em pontas de
  folhas sobrepostas, contorno escuro, folhas claras saindo do centro para as
  pontas, luz pela esquerda e base sombreada. Aparecem em grupinhos irregulares de 2
  a 4, com espaços livres entre os grupos, rente às margens dos caminhos, junto às
  construções e cercas e, mais raros, no meio dos gramados. São só enfeite: não
  bloqueiam, não são coletáveis e nunca ficam sobre caminhos, rotas dos moradores,
  portas, pontes, placas ou pontos de interação.
- **Arbustos**: massa de folhas em três lóbulos com contorno próprio, sombra
  embaixo e à direita, luz no alto à esquerda e cachos de folhinhas; flores só na
  primavera e no verão, folhas secas no outono e neve no inverno.
- **Flores**: pequenas e esparsas, conforme a estação.
- **Estações**: a grama, o mato e os arbustos trocam de cor em cada estação, como o
  resto do cenário (verde vivo, verde quente, oliva com folhas caídas, neve). Não
  há vagalumes.
- **Estabilidade e desempenho**: tudo é calculado pela posição no mundo e pintado
  uma única vez por estação no fundo do mapa; cada quadro só copia o fundo pronto.
  A textura não muda com a câmera nem entre os quadros. O traçado do mapa, as
  colisões, as rotas dos moradores, as árvores, os recursos, os cultivos e os
  coletáveis continuam exatamente iguais.

### Árvores, arbustos e cercas

Arte própria, na linguagem das referências (sem recortes de capturas).

- **Árvores de folhas** (decorativas, do bosque e frutíferas):
  - **Copa**: cachos de folhas sobrepostos e assimétricos, desenhados de trás para
    a frente. Cada cacho tem uma borda em sombra profunda que o separa do de trás,
    meio-tom, luz no alto à esquerda e folhinhas em "v" (claras na luz, escuras na
    sombra). O contorno escuro fecha a silhueta.
  - **Tronco**: largura que varia e alarga na base, casca com sulcos e nós, luz à
    esquerda, sombra da copa no alto, raízes discretas e sombra no chão.
  - **Variação**: cada exemplar varia pela posição (cachos, altura do tronco,
    raízes); as 14 árvores do bosque têm desenhos diferentes entre si.
  - **Estações**: florzinhas na primavera, verde mais vivo no verão, um tom por
    árvore no outono (laranja, vermelho ou amarelo, com folhas no chão) e galhos
    nus no inverno, com o galho principal saindo do tronco.
  - **Frutíferas**: a laranjeira e a goiabeira usam a mesma copa em cachos, nas
    fases de muda, árvore jovem e adulta, com as frutas por cima.
  - **Preservado**: espécies, posições, corte, tocos, rebrota e coleta.
- **Pinheiros**: mantêm o desenho em camadas.
- **Arbustos**: menores que as árvores, com contorno irregular de 3 a 5 cachos de
  tamanhos diferentes, folhas reconhecíveis, base mais escura e sombra no chão.
  Cada um varia pela posição. Têm florzinhas na primavera, folhas secas no outono
  e neve no inverno.
- **Cercas de madeira** (cercado das galinhas, horta comunitária, pátio da
  escola e cerca da fazenda):
  - **Postes**: grossos, de topo arredondado e iluminado, com veio discreto, luz
    à esquerda, sombra à direita e base escura.
  - **Travessas**: duas, que entram nos postes, com sombra nas junções.
  - **Trechos verticais**: os postes ficam um atrás do outro, ligados por uma
    travessa.
  - **Cantos e pontas**: os cantos usam o mesmo poste dos dois trechos; as
    pontas, junto às aberturas, terminam num poste.
  - **Porteiras**: as do cercado e da fazenda têm postes mais altos, com chapéu.
  - **Preservado**: lugares, aberturas, porteiras abertas e colisões.
- **Profundidade**:
  - **Cercas**: cada trecho de cerca e cada poste é ordenado pela base no chão.
    Quem está atrás da cerca fica atrás dela (a cerca cobre os pés); na frente,
    fica por cima.
  - **Árvores**: são ordenadas pela base do tronco. Quando o jogador passa atrás de
    uma copa, ela fica translúcida para ele continuar visível.
  - **Colisão**: continua só na base do tronco (a copa não vira obstáculo).
  - **Coletáveis**: os pontos onde surgem continuam os mesmos.

### Visual da fazenda

Pixel art de cores vivas, terra quente e vegetação volumosa, com detalhes bem
desenhados e sem ruído espalhado. Nada usa desfoque.

- **Terra da área de trabalho**: em volta dos canteiros há uma clareira contínua
  de terra ocre dourada, com textura fina e de baixo contraste: pequenas marcas
  desenhadas (risquinhos, grãos, marcas em diagonal) em grupos espaçados, com áreas
  tranquilas entre eles e sem manchas grandes de limites visíveis. A
  estrada em frente à casa e os caminhos da fazenda fazem parte dessa clareira, em
  vez de faixas coladas por cima, e na porteira a terra emenda aos poucos com a
  estrada da vila. A grama continua junto à casa, ao lago e nas bordas. Marcas de
  terra, pedrinhas e brotinhos aparecem só em pequenos grupos ocasionais.
- **Grama baixa (decorativa)**: verdes vivos, com a grama avançando sobre a
  terra em bordas irregulares, base mais escura e sombra suave na terra logo
  abaixo. Pequenos grupos de folhas curtas, em direções e tamanhos variados (não
  leques iguais), espaçados no gramado e mais cheios nas bordas da fazenda; a
  área de produção fica aberta.
- **Capim alto (mato removível)**: moitas cheias, com folhas estreitas, compridas
  e curvas, de alturas diferentes e inclinadas para lados variados; base
  verde-escura, meios-tons e pontas verde-amareladas, com florzinhas ou sementes
  em alguns. Capins vizinhos se emendam em agrupamentos contínuos de bordas
  irregulares (tufo isolado, bordas, centro mais denso, aberturas onde não há
  capim), sem base reta nem cara de vasinho. Há uma sombra discreta junto à base
  e só as pontas das folhas oscilam, de leve. O capim é ordenado pela posição dos
  pés: quem está atrás tem os pés cobertos pelas folhas da frente, sem sumir. A
  área de corte, as colisões, os recursos e a foice não mudaram, e nada é criado
  ou regenerado: muda só a aparência dos capins existentes.
- **Canteiros**: marrom quente, mais escuro que a terra natural, com textura fina
  de sulcos curtos e bordas simples. Terra natural, solo preparado seco e solo
  regado ficam bem diferentes, e as plantas se destacam. Canteiros vizinhos se
  ligam; a grade de plantio e a seleção não mudaram.
- **Pinheiros**: camadas de folhagem com tufos de folhas iluminadas, sombra sob
  cada camada e contorno recortado; cada pinheiro varia em altura, largura,
  número de camadas e inclinação (as árvores de folhas estão na seção acima).
- **Pedras, galhos, tocos e matinhos**: silhuetas claras com luz e sombra em
  áreas agrupadas, poucos detalhes e sombra de contato. Quatro variações de cada
  tipo, pela posição (a aparência é a mesma ao mover a câmera, salvar e carregar).
- **Lago**: margem irregular de terra, faixa rasa estreita, água num tom só com
  uma parte funda suave fora do centro (sem anéis), taboas e ondulações pequenas.
- **Preservado**: área cultivável e regras de plantio, plantações, rega e
  crescimento, construções, objetos, recursos e seus estados, colisões, acessos,
  animais e saves. A aparência do chão não muda onde se cultiva ou se atravessa.
  Tudo acompanha as estações (no inverno, a clareira fica coberta de neve) e a
  luz do dia e da noite.

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

Sete moradores, cada um com rotina, personalidade e gostos: Dona Celeste
(Armazém), Seu Honório, Bia, Tomé, Iara, Lúcio (na serra) e Caleb (neto da Dona
Celeste, que chega à vila durante o jogo). A amizade vai de 0 a 5 corações (com
o Caleb, até 8):

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

### Caleb

Neto da Dona Celeste. Chega para morar com a avó no andar de cima do Armazém
CELESTE. Usa moletom preto de mangas compridas, com o capuz abaixado, calça
preta e botas pretas; o cabelo é preto (com reflexo violeta), volumoso e em
camadas, com uma franja lateral que cobre o olho direito dele. Não usa
acessórios. É reservado e observador, gosta de computador e de música, fala pouco
no começo e é educado; com a amizade, aparecem o humor e o carinho em pequenos
gestos. A idade não é definida, e a relação é só de amizade (sem romance).

- **Chegada**: numa partida nova, na primeira visita ao Armazém com Dona Celeste
  atendendo (6h às 18h). A apresentação acontece uma vez só; em jogos salvos de
  antes desta versão, ela acontece na próxima visita nessas condições. Depois, a
  loja volta ao normal.
- **Rotina** (horários de início; os caminhos levam o tempo real de caminhada, e
  ele só troca de lugar pela porta do Armazém ou pela escada):
  - até 12h: no andar de cima (das 10h às 12h, no quarto, no computador e
    ouvindo música), sem aparecer para o jogador;
  - 12h–13h: desce para almoçar com a avó e ajuda com algumas caixas;
  - 13h–16h: no cantinho do notebook, no térreo, ao lado do balcão;
  - 16h–18h: caminha até o bosque e fica num ponto acessível, de fone;
  - 18h–20h30: na beira da lagoa do bosque, ouvindo música;
  - 20h30: volta ao Armazém e fica no térreo, perto do balcão, até as 22h;
  - 22h: sobe para o quarto.
- **Variações** (prioridade: chuva > sexta/domingo > rotina normal):
  - sexta-feira: depois das 18h, fica na praça até as 21h e volta para casa;
  - domingo: ajuda a avó no térreo das 10h às 13h, depois segue a rotina normal;
  - chuva: sem passeios; fica em cima pela manhã, no térreo das 13h às 18h e
    depois volta para cima.
- **Conversa e amizade**: falas próprias por lugar e situação (almoço, notebook,
  bosque, lagoa, praça, noite, chuva e domingo) e por faixa de amizade, sem
  repetir as últimas. Usa o sistema de conversa diária, presentes (todos neutros:
  ainda não há lista de favoritos) e a aba Amizades, com até 8 corações. Antes da
  chegada, não aparece na aba.
- **Visual** (ficha aprovada, com o moletom preto; substitui o visual anterior de
  camisa vinho, colar, brinco e mecha clara):
  - **Sprites do mapa**: desenhados à mão em `js/hand-art.js` (1 pixel por ponto,
    como os outros), com arte própria: alto e magro (cerca de 13 × 30 pontos), cabeça da largura dos ombros, cabelo
    preto arroxeado com franja longa e lisa caída de lado cobrindo um olho, moletom
    escuro com capuz abaixado atrás da nuca, cordões claros, calça justa e tênis
    escuros. Quatro direções (a direita é o espelho da esquerda) e caminhada.
  - **Retratos de diálogo**: 128×128 com fundo transparente, nas quatro
    expressões da ficha (neutra, sorriso, contente com uma piscadinha e
    envergonhado/surpreso). São recortados da ficha e reduzidos sem desfoque
    (cada pixel com a cor mais frequente do bloco) e aparecem no diálogo 1 para 1.
  - **Atividades**: no notebook e ouvindo música, ele usa fones (arco e conchas);
    no almoço, segura o prato à frente da mão; ajuda com as caixas carregando-as
    à frente do corpo.
  - **Arquivos**:
    - `assets/caleb-retratos.png` reúne os retratos, que também ficam separados
      em `assets/caleb-retrato-*.png`; são gerados por `tools/caleb_portraits.py`.
    - Com `--embed`, o script copia os retratos para `js/caleb-art.js`, para o
      jogo funcionar aberto direto do arquivo; `js/char-art.js` os registra.
  - **Preservado**: os pés, a colisão e o alcance das conversas continuam no mesmo
    lugar.
- **Armazém**: ganhou a porta da escada para o andar de cima, na parede do fundo
  ao lado do balcão (com a plaquinha "Particular"; o mural de avisos foi alguns
  pixels para a direita), e a mesinha com notebook do Caleb, ao lado do balcão,
  fora da circulação. A escada ainda não leva o jogador para cima: só Caleb a usa
  nesta etapa. Atendimento, produtos, preços e horários da Dona Celeste não
  mudaram.

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

**Chuva.** A rotina lê o clima do dia (`S.weather === 'chuva'`; veja "Clima e
chuva"). Com chuva,
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
| Sardinha | rio e lago (a mais comum no lago da fazenda) | 6h–19h | 5 a 90 cm | 50 moedas | tranquilo | 13 |
| Tucunaré | só no lago | 6h–18h | 20 a 80 cm | 60 moedas | ativo | 20 |

O preço é fixo por espécie: não muda com o tamanho, a sorte do dia, o nível de
pesca nem a captura perfeita. O tamanho aparece como informação e conta para o
recorde pessoal. Há três jeitos de nadar: **tranquilo** (devagar,
com pausas e curvas suaves), **ativo** (mais rápido, muda de direção com mais
frequência e dá pequenas arrancadas) e **ágil** (arrancadas curtas alternadas com
pausas). O ágil já está pronto para a próxima espécie que entrar no jogo.

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

**Captura perfeita.** Se o centro do peixe ficar dentro da zona verde durante
todo o minijogo, a captura é perfeita: "Perfeito!" aparece e a experiência da
captura é multiplicada por 2,4 (arredondada para baixo).

**Nível de pesca (0 a 10).** É o nível da habilidade **Pesca** (veja
"Habilidades"): cada captura concluída dá experiência (guardando ou soltando o
peixe, uma vez só) e o nível novo vale depois de dormir. O nível aumenta a zona
verde (22% da barra no nível 0, +1 ponto por nível, 32% no 10), o alcance do
lançamento e encurta a espera; os peixes não ficam mais difíceis para compensar.

**Vara de fibra de vidro.** À venda no Armazém a partir do nível 2 de Pesca, por
1.500 moedas. A compra pede confirmação, confere tudo antes de cobrar e não deixa
comprar duas. A vara nova toma o lugar da de bambu na barra; a de bambu continua
na mochila (ou vai para o baú, se a mochila estiver cheia). Ela não aumenta a zona
verde: aceita **isca de minhoca** (20 moedas cada no Armazém). Escolha a vara no
Inventário e use "Carregar minhocas"; a quantidade aparece no ícone da barra. Cada
lançamento válido gasta uma, e a espera pela mordida cai pela metade. Sem isca, a
vara funciona normalmente.

**Sorte do dia.** Cada dia é **neutro**, **de sorte** ou **de má sorte**. No início
de cada estação, o jogo monta uma lista com exatamente 8 dias de má sorte, 12
neutros e 9 de sorte e a embaralha: não há ordem fixa nem alternância, e pode haver
vários dias iguais seguidos. Cada estação e cada partida têm a sua. A lista fica
salva com a estação e o ano, então recarregar, sair do jogo ou mudar de área não
sorteia de novo. Os próximos dias não são revelados.

Ao começar o dia aparece uma mensagem curta ("Hoje o dia será neutro.", "Hoje será
um dia de sorte!" ou "Hoje será um dia de má sorte."), uma vez por manhã, sem
repetir ao recarregar. O painel do topo mostra um trevo com a condição de hoje; ao
passar o mouse, aparecem a condição e o efeito na pesca.

A sorte **não mexe na energia**: ferramentas, lançamentos, energia máxima e comida
são iguais nos três tipos de dia. Ela muda só o que vem na linha a cada lançamento
(sorteado uma vez, no lançamento; cliques e teclas depois não trocam o resultado):

| Resultado | Dia de sorte | Dia neutro | Dia de má sorte |
| ---: | ---: | ---: | ---: |
| Peixe | 90% | 70% | 30% |
| Alga | 6% | 15% | 30% |
| Musgo | 2% | 8% | 20% |
| Lixo | 2% | 7% | 20% |

"Peixe" é uma chance de fisgar: a captura ainda depende do minijogo. Nos dias de
sorte e neutros não há limite. Nos dias de má sorte, depois de **5 peixes
capturados** no dia (somando todos os lugares; peixes soltos contam, fugas e
refugo não), os lançamentos trazem só alga (50%), musgo (25%) ou lixo (25%), e
aparece uma vez o aviso "Os peixes estão difíceis hoje. Talvez seja melhor tentar
amanhã." Dá para continuar pescando, e o contador zera na manhã seguinte. A sorte
não muda a zona verde, a dificuldade das espécies nem a experiência. Os números
ficam em `LUCK`, no `js/data.js`.

**Alga, musgo e lixo.** Quando vem um deles, "Fisgou!" aparece, a linha traz o
item até as mãos (sem minijogo e sem "Perfeito!"; vale 3 de experiência de Pesca) e o cartão
mostra o que veio: **Guardar** ou **Descartar**. Com a mochila cheia, o item espera
enquanto você abre espaço ou o descarta. A **alga** é comestível ("Comer alga?",
recupera 3 de energia) e pode ser vendida (2 moedas) ou dada de presente. O **musgo** e o **lixo** (uma bota
velha) não têm utilidade por enquanto: não se comem, não se vendem, não entram em
missões nem em presentes; podem ser guardados no baú ou jogados fora na mochila
("Jogar fora", com confirmação).

**Configuração central.** Os números da pesca ficam juntos em `FISHING`, no
`js/data.js`: progresso (início 30, +10/s dentro, −8/s fora, 0,75 s de tolerância),
zona verde por nível, controle da zona, jeitos de nadar, espera, alcance, preços e
experiência. A física do minijogo fica em `js/fishcore.js` e é calculada pelo
tempo decorrido, em passos fixos de 10 ms: a mesma em qualquer taxa de quadros.

Peixes são vendidos no Armazém, um a um ou todos de uma vez. O Diário mostra o
nível, as espécies descobertas, o maior tamanho de cada uma e as capturas perfeitas.
Zonas de qualidade, tesouros, outras iscas, anzóis, encantamentos e usos para
musgo e lixo ficam para uma próxima versão.

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

### Clima e chuva

O clima de cada dia é sorteado uma vez, na virada da noite, e fica salvo com a
partida (recarregar não muda o tempo).

| Estação | Chance de chuva |
| --- | --- |
| Primavera | 22% |
| Verão | 14% |
| Outono | 22% |
| Inverno | não chove (a paisagem já tem neve) |

Não chove nos 3 primeiros dias do jogo nem no dia 1 de cada estação.

- **Na fazenda:** em dia de chuva, todos os canteiros com terra ficam regados de
  manhã, inclusive os que você arar ou plantar durante o dia. O regador continua
  funcionando, mas não é preciso. O resumo da manhã avisa que está chovendo.
- **No cenário:** nas áreas externas, o céu fica cinza-azulado e mais escuro,
  caem gotas em duas camadas (perto e longe) e aparecem respingos no chão.
  Janelas e postes acendem um pouco. Dentro das construções não há chuva.
- **No painel:** o céu do relógio mostra uma nuvem com gotas no lugar do sol.
- **Moradores:** Iara e Caleb já seguem a rotina de chuva (ficam em casa ou no
  Armazém, com falas próprias).
- Jogos salvos antes desta versão começam com tempo firme; o clima passa a ser
  sorteado a partir da próxima noite.

### Estações no cenário

Os cenários externos são redesenhados em cada estação (não é um filtro): grama
verde e árvores floridas na primavera; no verão, grama verde mais quente,
copas cheias e vivas (sem as flores da primavera), capim alto e florzinhas
amarelas e laranja, com a luz do dia um pouco mais quente (a noite, a chuva, a
duração do dia, a energia e a sorte não mudam); copas laranja, vermelhas e amarelas, folhas no chão e
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
| Melão | +113 |
| Repolho roxo | +75 |
| Fruta de cristal | +40 |
| Morango | +30 |
| Milho | +25 |
| Tucunaré | +32 |
| Sardinha | +22 |
| Ovo | +20 |
| Goiaba | +18 |
| Laranja | +15 |
| Narciso | +10 |
| Amora silvestre | +8 |
| Alga | +3 |

Outras flores, cogumelos e colheitas (rabanete, tomate e abóbora) não são comestíveis. A energia nunca passa de 100; o valor de cada alimento
está na descrição dele. Só escolher o alimento na barra não come nada: é preciso um
clique novo no cenário. Se o clique cair num morador, porta, baú ou outro alvo
próximo, vale essa interação. Dar o alimento de presente ou entregá-lo numa missão
não conta como comer. Enquanto a pergunta está aberta, o relógio para, ferramentas
e passos ficam bloqueados e não abre outra pergunta; cliques repetidos comem uma
unidade só. Ao acabar a pilha, o espaço fica vazio. Dormir recupera tudo e mostra um resumo da
noite.

O Armazém (Dona Celeste atende das 6h às 18h; a quantidade escolhida aparece em preto) vende sementes, mudas, ração,
galinhas e um chapéu, e compra colheitas, ovos, frutos, peixes, alga, madeira,
pedra e itens do bosque. Antes de confirmar aparecem a quantidade, o preço por
unidade e o total (por exemplo, "Comprar 3 × 12 = 36 moedas"). Ao confirmar, o
jogo confere moedas, quantidade e espaço na mochila, entrega ou retira a
quantidade certa, atualiza as moedas e salva. Cliques rápidos ou duplos fazem uma
única transação. "Vender todos os peixes" mostra a conta por espécie e o total.

| Compra no Armazém | Preço |
| --- | --- |
| Ração | 10 |
| Chapéu de palha | 200 |
| Minhoca (isca) | 20 |
| Galinha | 130 |

| Venda no Armazém | Preço |
| --- | --- |
| Ovo | 8 |
| Alga | 2 |
| Sardinha | 50 |
| Tucunaré | 60 |

Musgo e lixo não são vendidos. Os preços novos valem para as próximas compras e
vendas, inclusive de itens já guardados; nada é cobrado ou devolvido de antes.
Plantações em crescimento mantêm o progresso: rabanetes que já estavam maduros
(com o prazo antigo de 2 dias) continuam maduros, e os outros seguem do ponto em
que estavam.

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
apito encontrado e entregue, cenas vistas e a conversa de Iara. Da sorte do dia:
a lista embaralhada da estação (com o ano), a condição de hoje, a mensagem da
manhã já mostrada, os peixes capturados hoje e o aviso de limite já mostrado.
Jogos salvos antes ganham a lista na hora, preservando a condição de hoje se ela já
existir e completando as quantidades da estação; se isso não for possível, o que
existe é mantido e a próxima estação já vem exata. De Iara:
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
do minijogo vista, vara usada por último, compra da vara de
fibra, minhocas carregadas, peixes guardados com o tamanho de cada um, espécies
descobertas com o maior tamanho e as capturas perfeitas. O nível e a
experiência de pesca antigos foram convertidos para a habilidade Pesca (veja
"Habilidades"). A tentativa em andamento
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
| `js/sprites.js` | Personagens em pixel art, jogador e moradores (cabelos, roupas, chapéus, 4 direções; 1 pixel por ponto do mundo) |
| `js/hand-art.js` | Sprites do mapa desenhados à mão da Iara e do Caleb (mesma grade, cores vindas da aparência) |
| `js/portraits.js` | Retratos 64×64 dos moradores |
| `js/iara-portrait.js` | Retratos de Iara (5 expressões, roupa normal e de inverno) |
| `js/fishcore.js` | Física do minijogo de pesca (peixe, zona verde e progresso) |
| `js/caleb-art.js`, `js/char-art.js` | Retratos do Caleb (arte aprovada) e o carregador de arte própria de personagens |
| **`js/world/`** | **O mundo (objeto `World`): mapa, interiores, colisão, câmera, ícones e desenho** |
| `js/world/base.js` | Tamanhos, sorteio, cores e paletas das estações |
| `js/world/vegetation.js` | Árvores (pinheiros, copas em cachos, frutíferas) e cercas de madeira |
| `js/world/buildings.js` | Fachadas da vila: Armazém, casas, escola, cabana e peças comuns |
| `js/world/ground.js` | Posições fixas do mapa externo, montagem dos mapas (colisão), pavimento, calçamento, grama e mato |
| `js/world/outdoor.js` | Chão da fazenda, estradas, água e rio, prédios e a montagem do mapa externo; lugares do mapa (M) |
| `js/world/interiors.js` | Interiores: Armazém por dentro e os cômodos |
| `js/world/mountain.js` | Serra, tenda e fogueira de Lúcio |
| `js/world/maps.js` | Acesso aos mapas (cache por estação), colisão, água, câmera e ladrilhos |
| `js/world/figures.js` | Árvores frutíferas e do bosque, toco, boneco de treino e galinhas |
| `js/world/icons.js` | Ícones 16×16 dos itens |
| `js/world/crops.js` | Plantações por estágio, terra revolvida, pedras, galhos, tocos, mato e coletáveis do chão |
| `js/world/render.js` | Desenho de cada quadro (ordem de profundidade), chuva, luz e coletáveis sazonais |
| `js/world/actors.js` | Golpe das ferramentas, vara e linha de pesca, comer, fones, atividades, pinturas da Iara e bicho |
| `js/world/index.js` | Monta o objeto público `World` (vem por último) |
| **`js/game/`** | **A lógica do jogo** |
| `js/game/core.js` | Atalhos de página, estado compartilhado, salvamento e nomes |
| `js/game/title.js` | Título, criação de personagem e guarda-roupa |
| `js/game/inventory.js` | Inventário |
| `js/game/state.js` | Estado do mundo, calendário, clima, habilidades, sorte do dia e rotinas dos moradores |
| `js/game/loop.js` | Começar/continuar, laço principal, luz e tela |
| `js/game/input.js` | Alvos do mouse, ferramentas na terra e nas árvores, teclado e toque |
| `js/game/dialog.js` | Diálogo |
| `js/game/fishing.js` | Pesca |
| `js/game/quests.js` | Missões |
| `js/game/villagers.js` | Moradores: conversa, amizade, presentes e falas |
| `js/game/iara.js` | Iara: pinturas da fonte e acontecimentos |
| `js/game/animals.js` | Galinhas e bicho de estimação |
| `js/game/forage.js` | Coletáveis sazonais |
| `js/game/night.js` | Dormir e a passagem da noite |
| `js/game/hud.js` | HUD e barra de itens |
| `js/game/panels.js` | Painéis (menu), mapa (M), loja e baú |
| `js/game/debug.js` | Ganchos `window.__trilha` e modo `?dev=1` |
| `js/game/main.js` | Inicia o jogo (vem por último) |
| `tests/`, `package.json`, `playwright.config.js` | Teste de fumaça (só para desenvolvimento; o jogo não usa) |

**Como os arquivos se juntam.** Não há módulos (`import`/`export`), bundler nem
build: o `index.html` carrega tudo com `<script src>` comuns, na ordem da tabela,
e o jogo funciona aberto direto do arquivo (duplo clique no `index.html`) e no
GitHub Pages ou Cloudflare Pages. Cada parte de `js/world/` e de `js/game/` é
um script comum escrito no nível superior: scripts comuns compartilham as
declarações de nível superior (`const`, `let` e `function`), então o estado do
jogo (`S`, `P`, `map`...) é uma variável só para todos os arquivos, inclusive
depois de `S` ser trocado ao carregar ou criar um jogo. A ordem importa só para o
que roda na hora em que o arquivo carrega; o jogo começa em `js/game/main.js`,
depois de tudo carregado. Um nome novo de nível superior não pode repetir um que já
existe em outro arquivo (o navegador acusa erro ao carregar, e o teste falha).

### Teste de fumaça

Não é preciso nada para jogar. Para rodar o teste automático (Node.js 18 ou mais):

```bash
npm install
npx playwright install chromium
npm test
```

O teste abre o `index.html` direto do arquivo (`file://`), também com `?dev=1`, e
reprova com qualquer erro no console ou exceção da página. Ele passa pela criação
de personagem e pela abertura, anda com as setas, usa uma ferramenta, liga a chuva,
avança horas e três noites, entra na casa e no Armazém, abre o menu (E) e o mapa
(M), salva, recarrega e continua (dia, moedas e posição iguais). Por fim compara
capturas da fazenda, da vila e do Armazém, pixel a pixel, com as de `tests/ref/`
(relógio da página parado e sorteios com semente fixa, então nada muda entre
execuções). Se o desenho mudar de propósito, refaça as referências com
`npm run test:ref` e confira as imagens antes de enviar.

## Visual

Pixel art de fazenda em cores vivas e quentes: grama feita de folhinhas, mato
alto em grupinhos, caminhos de terra ocre com pedrinhas, lagos turquesa com margem clara e
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

Versão atual: `?v=regador20` (regador com 20 usos por carga). Todos os
`<script>` e o CSS usam o mesmo número.
