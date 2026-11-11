# A interface contra o Foundry — 2026-11-09

O dono achou a interface "com cara de joguinho de criança" perto do Foundry VTT. Medimos as duas, escolhemos uma direção
e aplicamos na tela de combate e, depois, em todas as outras.

## O que se mediu (1440×900)

| | Foundry v13 / sistema 5e | Phandalin antes |
|---|---|---|
| Área do mapa | a tela inteira; a interface flutua por cima | 49,9% (o quadro de 1154×560) |
| Barra de baixo | 578×52 px, espaços de 50 px | 1416×168 px, azulejos de 40 px |
| Fontes | Signika no corpo, Modesto Condensed nos títulos (5e: Roboto, Roboto Slab, Roboto Condensed) | Segoe UI do sistema em 198 elementos, Palatino em 17 |
| Tamanhos de letra | uma escala por variável; no 5e, 7 tamanhos escritos à mão em 13 mil linhas | 23 tamanhos escritos à mão |
| Cantos | 2 a 5 px, nenhuma pílula | 8 a 10 px, 16 pílulas |
| Cores | ~50, por 40 a 60 variáveis | 155 escritas à mão |
| Painéis | escuros translúcidos (preto-azulado de 50% a 90%), borda de 1 px | pergaminho opaco, moldura de latão em 9-slice |

De onde: o CSS que servidores Foundry públicos servem (`/css/foundry2.css`, `/css/style.css`), as 13 mil linhas de
`less/` do repositório `foundryvtt/dnd5e` e as capturas oficiais da versão 13. **Letra pequena não era o problema**: o
Foundry usa 10 a 14 px o tempo todo. O que dá o ar profissional é o mapa em tela cheia, uma escala só, borda fina e canto
pequeno.

## As quatro propostas

No Claude Design (canvas privado do dono): A Obsidiana (o Foundry v13 escuro), B Brasa (carvão, latão e bordô), C
Ardósia (vidro limpo e moderno), D Tomo (moldura escura com janelas de pergaminho). O dono escolheu a **A**.

## O que entrou (`src/view/tema-obsidiana.css`)

- O mapa em tela cheia; o grupo, o topo, a barra e o registro por cima dele.
- Painel `rgba(11,10,19,.84–.92)`, borda de 1 px, canto de 3 a 4 px, dourado `#e2bd6b` só no ativo e nos títulos.
- Signika e Cinzel guardadas no jogo (`public/fontes/`, licença OFL, com o texto da licença ao lado). Nada de Google
  Fonts na hora de jogar.
- A escala: 11, 12, 13, 14, 16 e 20 px, nas variáveis `--ob-*`; as variáveis antigas (`--ink`, `--gold`...) viram as
  escuras, então o que só as lê já acompanha.
- O registro é a barra lateral da direita; com ela aberta, os botões de câmera e som andam para o lado.
- O aviso legal sai do meio da tela e vira uma linha discreta no pé, à esquerda (no menu inicial ele segue inteiro).
- `?tema=classico`, ou `phandalin.tema = classico` no armazenamento, devolve o pergaminho, para comparar.

Conferido no navegador: o clique no mapa ainda acerta a casa (a Dara andou duas casas), a barra cabe sem rolar, o tema
antigo volta inteiro.

## As outras telas (`src/view/tema-obsidiana-telas.css`)

A pedido do dono, o mesmo tema em todas as outras telas: o menu inicial e o criador, a vila e a região com o diário, a
narrativa e os diálogos (com a pergunta livre), a ficha nas duas abas, a loja, o descanso longo e o curto, a tela de
subir de nível, o menu do botão direito, as dicas, a taverna do multijogador e o carregar jogo.

- **Quase tudo saiu de graça**: as folhas dessas telas pintam pelas variáveis do pergaminho (`--papel`, `--papelada`,
  `--soquete`, `--ink`, `--gold`...), e a folha nova vira essas variáveis para o escuro na raiz da página
  (`html.obsidiana`). O resto, tela a tela, é só o que estava escrito à mão: creme, marrom, o botão dourado de letra
  quase preta, a moldura de madeira do retrato (`slot.png`), o 9-slice de latão e as cantoneiras.
- **As janelas têm a cor delas** (`--ob-janela`, opacidade 0,97). Dentro do jogo a variável do painel é a do HUD (0,92),
  feita para flutuar sobre o mapa, e o diário da região, uma janela grande e quase vazia, deixava o mapa aparecer
  através dela.
- **O título do menu tinha 12 px**: a regra de título do HUD (`#app.obsidiana h2`) pegava também o menu inicial, que mora
  dentro do mesmo `#app`. Agora ela vale só dentro de `.hud-meio`.
- **O aviso legal passava por baixo da barra de ações**: com 640 px de largura ele invadia a barra, que começa em 500 px
  numa tela de 1440. Ficou na largura da coluna do grupo (236 px), no canto.
- **A barra de rolagem** clara do sistema riscava o tabuleiro no pé e na direita; agora é fina e escura.
- **Uma dica mentia sobre o lugar**: "Ação, Bônus e Reação aparecem no canto de baixo à direita". No tema novo eles
  estão na barra do meio; o texto passou a dizer "na barra de baixo, ao lado do retrato do herói", que vale nos dois
  temas.

Como se mediu: cada tela aberta no navegador a 1440×900, com uma varredura que lista todo elemento visível com fundo
claro (luminância acima de 120, contando os gradientes), moldura em imagem, canto de pílula ou texto escuro. Ela começou
achando o antecedente marcado e os chips do criador em creme, o rodapé e o halo da ficha, os saves do carregar jogo e o
recado verde do menu, e terminou zerada em todas as telas. A varredura estática das folhas (todo `background` claro e
todo `color` escuro escrito à mão, contra os seletores que a folha do tema cobre) deixa só cinco, de propósito: os
selos dourados (quantidade na mochila, votos no pino da vila), a pastilha de chance média do menu de contexto, o
losango do item do menu e o ponto de novidade do pino.

## O que falta

- **O que não se abriu no navegador**: a sala de multijogador com convidados de verdade (`menu-sala.js`) e a tela de
  partida em grupo (`partida-tela.js`) só passaram pela varredura estática, não pela captura.

## As fichas (pedido seguinte do dono)

### A da criatura (`src/view/ficha-criatura.js`)

Não existia: do inimigo só havia o "Olhar", o "Lembrar" e a dica do cartão no HUD. Agora "Ver a ficha" (botão direito,
de graça) e o clique no cartão do inimigo abrem uma janela com a **figura inteira** à esquerda e o bloco à direita.

- **A figura** é a ilustração do livro, de corpo inteiro, pelo mesmo caminho dos tokens: o espelho do 5etools liga
  cada criatura ao livro e ao nome dela, e o `fluff-bestiary-<livro>.json` dá a imagem (seguindo `_copy` e `_mod`,
  que é onde mora a figura de cada dragão). `python src/dev/baixar-arte-criaturas.py` (seco) / `--go` a baixa e
  reduz a 760 px de altura em `public/criaturas/`. **É arte da Wizards**: fica no `.gitignore` e fora da publicação,
  como os mapas oficiais; sem ela a ficha mostra o token grande. Das 487 criaturas com token, **391** têm ilustração
  no livro. As 96 que não têm são, quase todas, as que o MM não desenha (o bandido, o guarda, o mago, o veterano, a
  maior parte dos animais do apêndice), mais Klarg e a Agatha, que o LMoP não ilustra.
  Pesam 37 MB. Dezessete delas não são a criatura recortada, e sim uma CENA pintada com fundo (o Venomfang com um anão
  nas ruínas, os drows, os miconídeos): a ficha lê os quatro cantos da imagem ao carregar e, se forem opacos, mostra-a
  emoldurada no meio do palco em vez de de pé no chão dele.
- **O que se vê e o que se sabe**, a regra que o menu do botão direito já usava: do inimigo se vê a CA, como a ferida
  *parece* (ileso, arranhado, ferido, muito ferido), o deslocamento, o tamanho, as condições e a descrição. A vida em
  número, os atributos, as ações, o nível de ameaça e o que se sabe (resistências, sentidos, traços, a história do
  bestiário) são do **Lembrar**: a ficha traz o botão, rolado pelo herói selecionado ou, se ele já tentou, pelo
  próximo do grupo que ainda pode. Passou, o bloco fica conhecido em `campanha.bestiario` (vai no save) para todas as
  criaturas dele. A arena mostra tudo, porque ela é para testar regra; a invocação do grupo também.
- `testes-investigar.mjs` prova que o Lembrar que passa marca o bloco (e só ele), que a falha não marca, que a arena
  guarda na cena, e o endereço da arte. Os dois falham no código de antes.

### A do herói (`src/view/ficha.js`)

- **Quatro abas**: Ficha, Magias (só quem conjura), Inventário e História. Tab e Shift+Tab correm por elas.
- **A cabeça** tem o retrato maior, a barra de vida e a de experiência até o próximo nível, à vista em qualquer aba.
- **Magias**: a conjuração era o último bloco da primeira aba, abaixo de todos os talentos. Agora tem aba própria, com
  os espaços de magia em losango (cheio = sobra), as magias prontas por círculo e a preparação ao lado.
- **História**: a origem, a história, o motivo e os quatro traços do antecedente (os mesmos da tela de escolher
  heróis, `game/herois.js heroiPorId`), mais o treino de armadura e de arma.
- **A janela tem altura fixa**: com `max-height` ela encolhia na aba curta e pulava a cada troca de aba.

## Os ícones de traço

A proposta escolhida tinha ícones de traço, e os azulejos ainda tinham os de pixel. Os 1.316 ícones do catálogo
(361 de magia, 395 de classe, 438 de item, 42 de raça e 80 de ação, condição e arma) passaram a ter, no tema
Obsidiana, um desenho da **game-icons.net**: a coleção que o sistema 5e do Foundry usa, cerca de 4 mil ícones de RPG em
SVG, sob **CC BY 3.0**, que permite pôr no jogo e na publicação com o crédito (ele vai no próprio arquivo e na tela de
Créditos). O pacote vem do npm (`@iconify-json/game-icons` 1.2.4) para `_referencias/game-icons/`, fora do repositório.

- **O de-para é à mão**, chave nossa → nome na coleção, em `src/dev/icones-traco/mapa-*.json`: cinco lotes (magias,
  classes, itens em duas partes, e ações/condições/raças), escolhidos lendo o nome do jogo e a descrição de cada
  chave, e mais `mapa-zz-ajustes.json`, que vale por cima e iguala o que dois lotes escolheram diferente para a mesma
  coisa (a cimitarra da família e a do catálogo, o Surto de Ação do azulejo e o da classe, correr e Disparada). Cada
  lote deixou a lista do que tem menos certeza em `_referencias/game-icons/trabalho/mapa-*-duvidas.txt`, uns 140 no
  total: é por ali que uma revisão de fidelidade começa.
- **`node src/dev/importar-icones-traco.mjs`** confere cada chave contra o catálogo e cada nome contra a coleção e
  escreve `public/icones-traco.json` (913 desenhos, 1,1 MB; o navegador o recebe comprimido). O jogo o baixa só no
  tema Obsidiana, e `art/icons.js iconCanvas` desenha o caminho em vetor, na densidade da tela, na cor marfim do tema,
  pela MESMA porta de antes: quem chama não mudou nada. Antes de o arquivo chegar, e no `?tema=classico`, vale o
  pixel (o clássico nem baixa o arquivo).
- **Um defeito meu, pego na folha de contato**: o gerador arredondava os números a uma casa, e no SVG `1.04.5` são dois
  números; arredondado, o primeiro virava `1` e os dois grudavam em `1.5`. A Ação Ardilosa, o mangual e as botas
  saíam vazios. Agora ele CORTA a segunda casa em diante (o que nunca mexe na fronteira de um número) e confere que
  cada caminho cortado tem o mesmo tanto de números do original — a conferência que teria pego o arredondamento.
- `testes-regras.mjs` prova que toda chave do arquivo existe no catálogo, que todo nome tem desenho, que o crédito vai
  junto e que as ações da barra e as condições não ficaram em pixel. Medido no navegador: os 80 ícones mais vistos têm
  todos mais de 120 pixels de tinta numa caixa de 40, e a barra e a ficha do mago saem 100% em traço.

## Todos com ícone de traço (pedido seguinte do dono)

A primeira leva só cobriu as chaves que já tinham pixel, e por essa régua o que veio dos livros ficou de fora sem
ninguém ver: as 82 magias do Xanathar, as 25 do Tasha e as 5 do Fizban caíam no ícone genérico (59 delas no mesmo
"arcano"), 362 características de classe e subclasse não tinham ícone nenhum, e os talentos também não.

- **A régua passou a ser o que o jogo pede**, e não o catálogo de pixel: `src/dev/inventario-icones.mjs` lista toda
  magia, característica, talento, item, condição e traço de raça, com a chave que cada um pede — **2.306**. Eram 990
  sem traço; cinco lotes paralelos as cobriram, com a mesma regra da primeira vez (o nome e a descrição do jogo, só
  nomes da coleção, a lista de dúvidas).
- **A chave que só existe em traço** (`talento-*`, a magia do Xanathar) passa a valer em `temIcone` e `iconeDeMagia`
  enquanto o traço está ligado; no clássico ela segue no genérico de antes. A ficha ganhou o ícone do talento.
- **O composto** `base+selo`: o selo pequeno no canto, num recorte aberto na base (`art/icons.js desenharTraco`), para
  o que a coleção não desenha sozinha — a runa do Cavaleiro Rúnico (pedra rúnica + o elemento), o pergaminho de magia
  (pergaminho + a magia), Absorver Elementos. São 163 de 2.306.
- **A cor do dano**, de leve: 108 magias saem na cor do tipo (fogo âmbar, frio azul-gelo, psíquico rosa, necrótico
  verde-pálido...), o mesmo código do som e dos efeitos. O físico fica marfim.
- **O desempate**: os lotes não se viam, e a conta achou 64 pares de MAGIAS diferentes com o mesmo desenho e a mesma
  cor (Ajuda e Cura Total, Contramágica e Aura Mágica do Arcanista, Escudo Arcano e Invulnerabilidade) e 52 de
  características. `src/dev/icones-traco-desempate.mjs` dá ao segundo de cada par o selo da escola (magia) ou o
  emblema da classe (característica) e grava isso explícito em `mapa-zy-desempate.json`. Hoje são 0 pares. Ficam de
  fora, de propósito, os itens (o anel sem nome É o mesmo objeto) e as condições (a Fúria repete o desenho da Fúria).
- **A trava do futuro**: `testes-regras.mjs` exige ícone de traço para tudo o que o inventário lista e nenhum par igual
  entre magias e entre características. `importar-magias.mjs`, `importar-subclasses.mjs` e `importar-talentos.mjs`
  dizem, no fim, o que entrou sem ícone. O próximo livro não cai no genérico calado.
- **O veto**: as 217 escolhas de menor certeza (das listas de dúvida dos dez lotes que trouxeram alternativa) estão
  numa página publicada, com o atual e as alternativas a 32 e a 20 px, de onde o dono copia as trocas para a conversa.

O arquivo do jogo tem 1.349 desenhos e 1,7 MB (`public/icones-traco.json`), baixado só no tema Obsidiana.

## Ícones gerados no OpenArt para as dúvidas: o teste antes do lote

O dono quis ícone novo, desenhado para o jogo, também para as 217 dúvidas. A rota: o **Nano Banana 2 Lite** (15
créditos por imagem) com **8 ícones por página** (16:9, grade 4×2), uma folha de referência com 8 ícones da coleção na
mesma grade, e o resultado recortado e vetorizado aqui (`src/dev/vetorizar-icones-openart.py`, contornos do OpenCV
enquadrados como a coleção). Medido em duas páginas, 30 créditos no total:

- **A grade de 8 não corta**: as 16 células das duas páginas saíram inteiras, sem figura vazando para a vizinha.
- **A primeira página destoava, e os revisores acharam**: dois revisores em sonnet, um cego (os novos misturados à
  coleção, sem saber quantos nem quais) e um técnico (lado a lado, com as medidas). O cego achou 3 dos 8 — Marés do
  Caos, Consciência Primordial e o trenó —, que são exatamente os três que a medida objetiva marcava com DETALHE acima
  do teto da coleção (29,5, 26,3 e 23,4 contra 21,5). O técnico deu o motivo: o modelo desenhou ilustração de linha
  (traço fino, anéis concêntricos, perspectiva em elipse, linhas de movimento), e não silhueta cheia.
- **As medidas** (`src/dev/pranchas-icones.py`, a mesma conta para a coleção e para o novo, em 400 ícones da coleção):
  espessura do traço, detalhe (perímetro ÷ √área), tinta e LEITURA EM 20 PX (o ícone reduzido a 20 e ampliado de
  volta, contra ele mesmo em 96: a coleção vai de 0,60 a 0,83). O vetorizador reprova sozinho por elas — traço abaixo
  de 3%, detalhe acima de 25, leitura abaixo de 0,58, tinta fora de 0,22–0,62 — e manda para revisão o que sai da
  faixa p10–p90 da coleção. Detalhe BAIXO não conta: simples não destoa.
- **O que consertou**: a folha de referência só com ícones de traço médio da coleção (espessura de 4,5% a 7,5%,
  detalhe de 10 a 18; a primeira tinha ícones finos que puxavam o modelo para linha), o pedido com as regras escritas
  (silhueta cheia, traço mínimo de ~6% da largura, vista chapada sem perspectiva, nenhum anel concêntrico, no máximo
  duas peças secundárias e grossas, nada de linha de movimento) e o descarte, no vetorizador, das pecinhas abaixo de
  1,5% da maior parte.
- **A segunda página**: 6 de 8 dentro dos limites (as duas reprovadas: o soco virou um bloco chapado de tinta 0,66, e o
  freio e a rédea some em 20 px). No segundo teste cego, com os 6 aprovados misturados a 24 da coleção, o revisor
  apontou 8 suspeitos e só 1 era novo — a Reação —; os outros 7 eram da coleção. **Cinco dos seis aprovados não se
  distinguem da coleção**, e o acerto dele (1 em 8) ficou abaixo do acaso (6 em 30).
- **O que a medida não pega é o SENTIDO**: duas vezes, pedindo "escudo que desvia a flecha", o modelo desenhou um alvo
  com a flecha cravada. Para esse tipo de caso fica o composto da coleção.

## O Esmalte: o ícone colorido que ficou

O dono não quis mais pixel e quis o ícone colorido e bonito no estilo do tema. Vieram quatro propostas de tratamento
(Esmalte, Medalhão, Duotom, Relicário), comparadas lado a lado com a pixel art de antes numa página publicada, e ele
escolheu o **Esmalte**: a figura na cor da família dela, com degradê de duas cores (a de cima clara, como luz vinda do
alto), contorno escuro fino e um brilho baixo; o azulejo continua escuro, com a borda e um brilho da mesma cor.

- **A família de cada coisa** sai do inventário (`src/dev/inventario-icones.mjs`) e vai no arquivo do jogo
  (`familias`): a magia pelo dano, pela cura ou pela escola; a característica pela classe (a tabela de níveis de cada
  classe e subclasse); o item pela raridade (a arma e a armadura comuns têm a delas); a condição por ser boa ou ruim,
  pela conta dos efeitos que ela declara (vantagem e CA ajudam, desvantagem e incapacitado atrapalham; empate é
  "efeito", em lilás). As 2.306 chaves têm família.
- **As cores** moram em `art/icons.js PALETA_DO_ESMALTE` (47 famílias, duas cores cada), então ajustar é editar a
  tabela. Com os ajustes vistos na comparação: frio quase branco e abjuração prata (eram dois azuis), elétrico amarelo e
  força lilás (eram dois lilases), ladino índigo (o cinza sumia no escuro), cura num verde mais vivo que a necromancia.
- **A segunda cor**, em três camadas: o degradê de duas cores da família (o fogo vai do amarelo ao vermelho, o veneno
  do verde ao roxo); o SELO do composto na cor do que ele é (a chama em fogo, o floco em frio); e a **cor por peça**
  nos ícones mais vistos — o cabo de madeira do machado, a rolha da poção, o líquido na cor da raridade. A coleção
  desenha cada ícone em subcaminhos; `src/dev/pecas-icones.py` separa as peças de fora (com os furos de dentro delas,
  e o começo de cada subcaminho reescrito em coordenada absoluta), desenha pranchas numeradas, e quatro revisores em
  sonnet escolheram a família de cada peça olhando as pranchas: 285 ícones, 562 peças, com as famílias de MATERIAL
  que a paleta ganhou para isso (madeira, couro, ouro, pedra, osso, pele, sangue, vidro, planta).
- **O azulejo** ganha a cor da família (`--cor-icone`, posta pelo HUD); o da magia mantém a borda do CÍRCULO, que é
  dado de regra, e a família vai só para o brilho.
- **O pixel saiu do jogo**: os ícones de traço valem também no tema clássico (com o contorno escuro, leem sobre o
  pergaminho). O pixel ficou no código só como reserva, para o instante antes de o arquivo chegar.
- Com a família na cor, o desempate (selo no segundo de cada par igual) caiu de 116 para 32 chaves: muita magia que
  dividia o desenho já se separa pela cor da escola.

### A cor por peça, revista (2026-11-10)

O dono viu ícones que ficaram bons com mais cores e outros que ficaram ruins. `src/dev/avaliar-pecas.py` desenha os 285
nas duas versões (uma cor e com peças, em 48 e 24 px, o Esmalte refeito em Python) e mede cada peça: contraste contra o
azulejo, diferença de cor (ΔE) contra a família, tamanho em 20 px e quantas cores o ícone soma. Três revisores em sonnet
julgaram as pranchas ícone a ícone: **160 melhoraram, 117 deram na mesma, 8 pioraram**.

- **Pioraram** os que puseram cor de efeito viva onde o objeto não pede: os olhos verde e azul do Esconder, as faíscas
  laranja e azul do Bônus, um pulmão verde no Retomar o Fôlego, os pulmões cor de sangue do Fôlego, a faixa vermelha no
  elmo, metade marrom num escudo espectral, uma pegada marrom entre verdes, e a chama AZUL no ícone de Fogo.
- **Melhoraram** os de material na peça concreta: o cabo de madeira ou couro na arma de aço, a lente de vidro com cabo
  de madeira, a fivela de ouro na armadura, a coroa de ouro nos louros verdes, a mão em pele, a planta no vaso, o
  líquido da poção. Por família da peça: ouro 48 de 55, osso 27 de 33, couro 38 de 50, madeira 39 de 52; contra frio 8
  de 25, psíquico 3 de 12, efeito 1 de 8.
- **Deram na mesma** os de peça pequena (a maior peça dos "na mesma" tinha, em mediana, 26 px num ícone de 20; a dos
  que melhoraram, 44) e os de cor próxima da família (pele ou osso sobre dourado).
- **Ficaram só os 160 que melhoraram**; os outros 125 voltaram à cor única da família. As medidas não acharam peça que
  suma contra o fundo (nenhuma com contraste abaixo de 3), então o problema era de sentido e de tamanho, não de leitura.

## O lote do OpenArt (2026-11-10)

- **O que se gerou**: 76 páginas de 8 (1.140 créditos). Entraram as 215 dúvidas e mais 386 chaves que já tinham ícone
  razoável e só apareciam muito na tela. O dono queria só as dúvidas; essas 386 ficam de fora da página de veto e não
  ganharam segunda tentativa.
- **A regra de tinta reprovava errado**: tinta baixa não é defeito. Objeto fino na diagonal enche pouco o retângulo
  dele, e a coleção também: a flauta tem 0,13 e a espada larga 0,22. Medido isso, `vetorizar-icones-openart.py` só
  reprova a tinta ALTA (acima de 0,68, o borrão sem miolo), e a baixa vai para revisar. Isso recuperou 18 dúvidas
  sem gastar nada.
- **A segunda tentativa** foi só para as dúvidas: 46 chaves em 6 páginas (90 créditos), cada uma com a dica do motivo
  da falha no pedido (peça mais grossa, menos detalhe, miolo branco). Passaram 26.
- **O resultado**: 197 das 217 dúvidas têm desenho novo (`src/dev/icones-traco/proprios/gerados.json`) e 20 não têm.
  A maior parte das 20 é traço fino de 2,3% a 2,8% contra o piso de 3%. Os novos só entram no jogo quando o dono
  escolhe na página de veto, que mostra o atual, o novo e as alternativas da coleção, todos em Esmalte.

## A escolha do dono (2026-11-10)

Para trocar o "está ruim ou não" por uma escolha, cada coisa do jogo ganhou um cartão numa página (Escolha dos
Ícones, artefato privado com banco): o ícone atual, o gerado no OpenArt quando há, as alternativas da coleção nas
dúvidas, mais "gerar novo" e "cores boas/ruins". O dono marcou 220 coisas.

- **219 escolhas** foram para `src/dev/icones-traco/mapa-zzz-escolhas.json`, o último lote lido: vale por cima dos
  lotes, do desempate e dos ajustes. São 160 desenhos gerados (`proprio:`) e 59 da coleção; 49 delas confirmaram o
  ícone que já estava.
- **12 cores por peça caíram**: a peça é recorte de UM desenho, e as 12 chaves trocaram de desenho. Agora cada peça
  guarda o desenho de onde saiu (`base`), e o importador recusa a peça se o ícone da chave mudar.
- **O Bruxo escolheu o pentagrama**, que era da Magia de Pacto: rodar `icones-traco-desempate.mjs` de novo deu o
  selo à Magia de Pacto (`pentacle+magic-swirl`). Na mesma rodada, dois desempates antigos deixaram de ser
  necessários, porque o par deles mudou de ícone.
- **Duas cores ruins**, as duas poções incomuns, que saíam verdes como veneno: a Poção de Resistência passou para
  abjuração e a de Sopro de Fogo para fogo. Elas ficam em `familias-escolhas.json`, que vale por cima da família
  calculada.
- **Um "gerar novo"**: a rapieira, que já tinha reprovado duas vezes por traço fino. Saiu numa página de 8 versões
  (15 créditos, `paginas-rapieira/r1.jpg`), pedindo lâmina "da largura de um dedo", e as 8 passaram na medida
  (espessura de 5,6 a 15,3%). Entrou a nº 2, a de lâmina estreita com copo e guarda em cruz, que é a que mais lê
  como rapieira. As outras sete estão em `_referencias/icones-openart/lote/rapieira-candidatas.json`.

`testes-regras.mjs` 555/555. O `npm run build` para no `verificar-publicavel.mjs`, como deve: a arte da Wizards
(`public/criaturas/`, `public/mapas/oficial/`) está no disco, e a guarda recusa publicá-la. Isso não vem desta troca.
