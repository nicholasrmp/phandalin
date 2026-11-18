# O Obelisco contra a nossa Mina Perdida — de-para medido

*Phandelver and Below: The Shattered Obelisk* (2023), lido em 2026-11-08 a partir dos dados que a página do
5e.tools carrega (`adventure-pabtso.json`, 1,6 MB, contra 380 KB da `adventure-lmop.json`). As contagens saíram
de um script que percorreu as duas aventuras dentro do navegador; nenhum trecho do livro foi copiado para cá.
Tudo abaixo está escrito com as nossas palavras — é a regra desde 2026-11-08, quando o limite do SRD caiu: dado
e mecânica do livro entram, a prosa dele não.

## 1. O tamanho, medido

| | Mina Perdida (2014) | Obelisco, caps. 1–4 | Obelisco, caps. 5–8 |
|---|---|---|---|
| texto | 201 mil letras | 194 mil letras | **392 mil letras** |
| níveis | 1 → 5 | 1 → 5 | 5 → 11 |
| criaturas diferentes | ~50 | ~60 | **119** |

**Os capítulos 1 a 4 são a Mina Perdida reescrita do mesmo tamanho.** O que o livro acrescenta de verdade são
os capítulos 5 a 8: o dobro da Mina inteira, outra campanha.

Níveis declarados por capítulo: 1º, 2º, 3º, 4º, depois 5º→7º (cap. 5), 7º→9º (cap. 6), 9º (cap. 7) e 10º
(cap. 8), que termina perto do 11º.

## 2. Capítulos 1 a 4: o que muda na nossa Mina

### 2.1 O gancho do obelisco é LEVE — e isto foi a maior surpresa

Procurei no texto dos quatro capítulos toda menção a obelisco, sonho, fragmento, aberração, devorador de
mentes, girino, psiônico e psíquico. A primeira contagem deu 40 pontos e estava errada: a busca por "vision"
pegava *darkvision* em toda seção de iluminação. Com fronteira de palavra, sobram **seis**, e um sétimo era
falso também ("cacos de vidro" na loja do herbalista de Thundertree, que é vidro mesmo).

Os seis são o mesmo fio: **goblins psiônicos** que estiveram nesses lugares procurando fragmentos do obelisco e
não acharam nada. Nenhum fragmento aparece nos capítulos 1 a 4, e nenhuma cena muda por causa deles.

| onde, no livro | onde, no nosso jogo | o que entra |
|---|---|---|
| Cap. 1, o que os Cragmaw sabem | `capitulo1.js` / interrogatório | um boato: goblins estranhos, que não são da tribo |
| Cap. 1, H6 covil dos goblins | `capitulo2.js` área 6 | menção aos mesmos goblins estranhos |
| Cap. 2, R8 caverna da fenda | `capitulo3-mansao.js` | dois cadáveres de goblin psiônico debaixo da ponte sul |
| Cap. 3, acampamento de Wyvern Tor | `capitulo4-cume.js` | um desenho deixado por goblins psiônicos atrás dos fragmentos |
| Cap. 4, W1 entrada da caverna | `capitulo5-ondaeco.js` | o cadáver de um goblin psiônico; os outros foram embora sem achar fragmento |
| Cap. 2, abertura | (texto do capítulo) | conselho ao mestre: fazer o grupo se apegar à vila, que será ameaçada depois |

**Consequência:** "a Mina melhorada com o gancho" é, no que diz respeito ao obelisco, meia dúzia de pistas
plantadas. O peso real da revisão está nos encontros (2.2).

### 2.2 Os encontros que mudam

**Esta tabela foi refeita.** A primeira versão comparou as criaturas por CAPÍTULO, e uma criatura que sai de uma
sala e entra noutra do mesmo capítulo não aparece numa conta assim: ela perdeu três trocas (o urso-coruja da torre
do castelo que vira grell, os esqueletos da guarita que viram zumbis, o gás venenoso da caverna dos fungos que vira
fungo violeta) e mudou de número em cinco salas da Árvore-Trovão sem dizer. Também dizia que não tínhamos o
arbusto-agulha — temos, é o `espetoInfectado`. Refeita sala a sala:

| lugar | nossa cena | Mina | Obelisco | estado |
|---|---|---|---|---|
| H2 posto dos vigias | esconderijo | 2 goblins | + 1 **chefe goblin** | **feito** (6.3) |
| H4 passagem íngreme | esconderijo | — | **cobra venenosa gigante** na laje | **feito** |
| H6 covil | esconderijo | 4 goblins + Yeemik | 5 goblins, Yeemik de 21 PV e **Errk** (chefe goblin) | **feito** (6.3) |
| H7 os poços (não a caverna do Klarg: a primeira versão errou a sala) | esconderijo | 3 goblins | + 2 lobos | **feito** (6.3) |
| R11 oficina do mago | mansão | rato familiar | **Zeond, quasit**, invisível | **feito** |
| U3 Cavalo Pardo | Árvore-Trovão | 4 zumbis das cinzas | 6 | **feito** |
| U8 velha ferraria | Árvore-Trovão | 2 zumbis das cinzas | 4 | **feito** |
| U2 cabana com ramos | Árvore-Trovão | 6 ramos | 2 | **feito** |
| U5 fazenda | Árvore-Trovão | 8 ramos | 12 ramos + 2 **arbustos-agulha** | **feito** |
| U12 tecelão | Árvore-Trovão | 6 ramos | 4 ramos + 2 **arbustos-agulha** | **feito** |
| C3 postos dos arqueiros | castelo | 2 goblins por posto | 2 **chefes goblin arqueiros** por posto | **feito** |
| C13 torre | castelo | urso-coruja preso | **grell** | **feito** |
| C14 aposentos do rei | castelo | Rosnado, lobo | Rosnado, **lobo atroz** | **feito** (6.3) |
| W4 guarita velha | Onda Eco | 9 esqueletos | 2 **zumbis ogros** + 6 zumbis | **feito** |
| W8 caverna dos fungos | Onda Eco | gás venenoso | 2 **fungos violeta** | **feito** |
| W10 poço escuro | Onda Eco | — | **serpente constritora gigante** | **feito** |
| W16 caverna trovejante | Onda Eco | — | **polvo gigante**, atraído por luz | **feito** |

"Feito" quer dizer bloco no motor, criatura na sala, texto da sala reescrito com as nossas palavras e a prova em
`testes-regras.mjs` / `testes-cenas.mjs` / `testes-ondaeco.mjs` / `testes-mansao.mjs`.

## 3. Capítulos 5 a 8: a campanha nova

| cap. | nível | lugares | mapa no disco (`mapas/`) |
|---|---|---|---|
| 5 — Paths of Peril | 5→7 | o apuro do mestre da vila, os fragmentos roubados, Zorzula's Rest, Indigo Sanctum | `HardyhammerMine`, encontros pack 3 — **os dois lugares nomeados não têm mapa identificado** |
| 6 — The Shattered Obelisk | 7→9 | volta a Phandalin, **Talhundereth**, **Cripta do Talhund**, **Gibbet Crossing** | `Talhundereth`, `CryptOfTheTalhund`, `GibbetCrossing` |
| 7 — Rifts in Reality | 9 | sombra sobre Phandalin, viagem pelo Subterrâneo, **Illithinoch**, fendas do Reino Distante | `Illithinoch`; pack 4 (covil do behir, gruta do gibbering, cavernas do grell); pack 5 (trincheiras, labirinto dos olhos); pack 7 e 9 (as fendas) |
| 8 — Beyond a Lightless Star | 10→11 | a ruína chega a Phandalin, **Briny Maze**, o vazio sem fim, a refração de Ilvaash | `BrinyMaze` (com o covil do dragão); pack 6 (domo de cristal, anima de Ilvaash) |

Fora da tabela: `SpawnHollow` (33×25, com armadilhas e um "Gnawble") e `HillTopRuins` (40×32) não casaram com
nenhum nome de seção — ficam para identificar lendo o capítulo. **`HillTopRuins` é a versão de amostra, com marca
d'água (`_WM`, 70 ppi)**, e não o arquivo do pack.

Os mapas novos vêm com **sobreposições** prontas (`ElderBrainPool`, `SleepingPod`, `RiftAlternate`, `Coffin`,
`EmptyVault`, `BookRemoved`, `CloakRemoved`...), que caem direto em `mapa.sobreposicoes`. Faltam as **cenas JSON
do Foundry** desses mapas: `mapas/_cenas/` só tem as oito da Mina.

## 4. O bestiário — o custo de verdade

Nos capítulos 5 a 8 aparecem **119 criaturas diferentes**. Das 74 que o jogo tem hoje, umas **dez** servem
(plebeu, acólito, goblin, mago, drow, grick, wraith, espectro, armadura animada, spectator). Das ~109 que faltam:

- **30 são do próprio livro** (o apêndice): o devorador de mentes profeta, o clarividente, o nothic devorador de
  mentes, o alhoon Oshundo, o cérebro ancião infectado, o grell psíquico, os goblins psi, os ashenwight, os
  mutantes (humanoide, otyugh, cloaker), o encephalon, a armadilha de intelecto, Ruxithid, Qunbraxel, Lowarnizel,
  Nellik, a refração de Ilvaash e outros.
- **~20 são nomes de personagem** que usam um bloco comum (Gwyn Oresong, Rivibiddel, Honna, Ontharyx,
  Chishinix, Voalsh, Hashutu, Varakkta, Grandlejaw…).
- **~60 são do Manual dos Monstros**, e entre eles estão os maiores do jogo: **beholder, kraken, verme púrpura,
  aboleth, behir, remorhaz, devorador de mentes, umber hulk**, além de slaad, githyanki, yugoloth e otyugh.

Não há uma aberração no jogo hoje. Os poderes que elas pedem — rajada mental, extrair cérebro, telepatia,
dominação, a influência do Reino Distante que **transforma o personagem em estágios** (o livro tem uma seção só
disso) — são regras que o motor ainda não tem.

## 5. O que eu proponho

1. **Capítulos 1 a 4 primeiro.** Os nove blocos da tabela 2.2, as seis pistas da tabela 2.1 e a conferência do
   Glasstaff. Mexe em cenas que existem, não pede mapa novo, e é o "melhorada" que o livro promete. Ao fim dele o
   grupo sai da Onda Eco com o fio dos goblins psiônicos na mão, que é exatamente onde o capítulo 5 começa.
2. **O motor das aberrações** antes de qualquer cena nova: rajada mental, extrair cérebro, os estágios de
   transformação do Reino Distante. Sem isso nenhum lugar dos capítulos 5 a 8 funciona.
3. **Capítulos 5 a 8 um de cada vez**, cada um com as cenas JSON do Foundry importadas pelo `importar-foundry.py`.

Para o texto ficar nosso também no Obelisco, o `conferir-colagem.py` precisa do livro em `_referencias/livro/`.
Ele mede hoje contra o PDF da Mina. Os dados do 5e.tools **não ficaram no disco**: o acesso direto devolve a
barreira da Cloudflare, que não se contorna, e as medidas acima foram tiradas dentro da página aberta no navegador.
Para medir de novo, é abrir `5e.tools/adventure.html#pabtso` e rodar a mesma conta lá.

## 6. O que entrou, e o que ficou para o dono decidir (2026-11-08)

### 6.1 Entrou

- **Blocos novos** (`fonte: 'MM'` ou `'PaBTSO'`): cobra venenosa gigante, serpente constritora gigante, polvo
  gigante, zumbi ogro, grell, fungo violeta, quasit, chefe goblin arqueiro. O motor ganhou o que eles pediam:
  multiataque com número de golpes em dado (`countDados`, o fungo), golpe com mais de um efeito (o grell paralisa e
  agarra), dano só para quem falha (`danoSeFalhar`, o quasit), Resistência a Magia como traço e a IA do bicho que
  fica invisível (`turnoInvisivel`) e da que escolhe o alvo de trás (`alvoPreferido`, a serpente).
- **As fichas** das nove criaturas, do 5etools-img, com o Zeond pelo nome.
- **A cobra do H4** (`capitulo2.js cobra()`): enrolada na laje rachada; Percepção passiva 13 ou mais não é
  surpreendido; a briga faz o goblin da ponte assobiar. Fica de fora a vantagem dela contra quem luta na encosta: o
  motor não tem vantagem por casa do alvo, e a laje que cede já castiga lutar ali.
- **O Zeond** no lugar do rato: invisível desde o começo, avisa o mestre e vai com ele; quem chega pelo quarto pela
  secreta o encontra lutando do lado do Cajavidro. `naoSeguraALuta` (novo em `combat.js checkEnd`) impede que um
  bicho que ninguém consegue mirar segure a luta aberta. E uma correção de passagem: o rato levava `familiar: true`,
  que é a marca do familiar DO GRUPO, e as magias de fora podiam tratá-lo como bicho de um herói.
- **O fio dos goblins de fora**, em cinco lugares (tabela 2.1): o interrogatório do capítulo 1, o Yeemik, os dois
  corpos no fundo da fenda da Mansão (Procurar CD 10, Medicina CD 12), o desenho na rocha do Cume e o goblin morto
  na boca da Onda Eco. Cada achado vai para o diário com a mesma abertura, "Goblins de fora:". O sexto ponto da
  tabela é conselho ao mestre e não tem o que entrar no jogo.

**A progressão** (`medir-progressao.mjs`) foi refeita com os prêmios novos: o caminho cheio fecha o capítulo 4 com
3.461 XP (eram 3.162), o magro com 2.025 (eram 1.875). As fronteiras não mudaram: 4º nível no cheio, 3º no magro.

### 6.2 Medido — e aplicado depois, por ordem do dono

Quatro trocas do Obelisco deixam a luta muito mais dura do que a nossa, e não entram sem a palavra do dono:

| troca | como se mediu | Mina | Obelisco |
|---|---|---|---|
| H6, o covil (5 goblins, Yeemik de 21 PV, Errk) | `medir-covil.mjs 300 2 --obelisco`, a sala de verdade, 2º nível | 1% de derrota, 76% de vida | **25% de derrota, 13% de morte**, 42% de vida |
| o mesmo, no 1º nível | idem, `300 1` | — | **76% de derrota** |
| C14, o lobo atroz do Grol | `medir-troca.mjs 300 3`, campo aberto | 1% de derrota, 74% de vida | **15% de derrota, 14% de morte**, 53% de vida |
| o mesmo, no 4º nível | `medir-troca.mjs 300 4` | 0% | 2% de derrota, 4% de morte |

O H2 (+1 chefe goblin nos vigias) e o H7 (+2 lobos com o Klarg) andam junto com o H6: é o esconderijo inteiro que o
Obelisco endurece, e o grupo chega ali no 1º ou 2º nível. O C14 pesa porque, com os prêmios de hoje, o grupo chega
ao castelo no 3º nível em quase todo caminho. Os números são o que o livro pede; a decisão é se o jogo quer essa
dificuldade.

### 6.3 A segunda passada: o livro inteiro dos capítulos 1 a 4 (aplicado)

O dono mandou aplicar "qualquer mudança que o Obelisco proponha". A primeira passada só tinha comparado criaturas;
esta comparou parágrafo a parágrafo (o que no Obelisco não tem par na Mina), o tesouro de cada sala e as criaturas
de cada sala pelos números do texto. Tudo abaixo entrou, com as nossas palavras.

**Esconderijo** — H2: chefe goblin com os vigias (bolsa de 16 pp); caído ele, os goblins fogem e soltam os três lobos
do canil. H3: brigar com os lobos traz 1d4 goblins em duas rodadas. H4: a laje cede para quem anda ou ataca em cima
dela e falha em Acrobacia CD 10 (motor: `regiao.gatilho`), e o entulho pega a metade leste da passagem (motor:
`efeito.casas`); a cobra ataca com vantagem quem luta na encosta (motor: `vantagemContraEm`). H5: o goblin da ponte
se vê com Percepção 15; sem luz, passa-se por ele com Furtividade CD 12. H6: 5 goblins, Yeemik (21 PV; 3 gemas e uma
poção) e Errk (21 pc). H7: + 2 lobos; um goblin CORRE avisar o Klarg. H8: Klarg foge quando todos os aliados caem, e a
chaminé pede Destreza CD 10 (falha = entalado); baú de 1.700 pc e 150 pp. O goblin estranho é contado pelo SILDAR
("não é você que o Ruxithid quer"), e não pelo Yeemik.

**Emboscada** — quatro goblins (eram três e dois lobos, decisão nossa), lutam até sobrar um; os cavalos de Gundren e
de Sildar estão VIVOS, e o grupo pode levá-los. O boato dos Cragmaw é o do livro: crânio comprido, armas com brilho
verde, riem e vão embora.

**Phandalin** — Elmina Barthen (moça; era Elmar), Daran drow, Greska (orc; era Grista), retratos refeitos. Boatos da
estalagem: Elsa (e a irmã Gwyn), Lanar (goblins com os saqueadores), Pip (goblins esquisitos), Toblen (Thel Dendrar).
Carp viu goblins de mãos brilhando. O aviso do Harbin: ogro, bugbears e um goblin estranho. A Aliança dos Lordes
convida com o Castelo OU a traição do Iarno. Daran paga a missão do Poço com as botas de passos largos e saltos.

**Mansão** — 3 bandidos no alojamento; 6 esqueletos na cripta; 3 Rufiões nas jaulas (caídos dois, o terceiro foge e
abre a secreta do depósito); 4 bugbears com o Nosk (era Mosk); 2 Rufiões e 2 bandidos na sala de estar; o Cajavidro
sozinho, com o bloco do Obelisco (dois Estouros Chocantes, Teleporte, Escudo). O Rufião Marcarrubra é o bloco do
Obelisco (CA 11, 16 PV, espada curta +4). O Zeond, avisado o mestre, SEGUE o grupo e entra na próxima luta. Droop é
dos Scraptops. Tesouros: bolsas do alojamento, bracelete de 140 po no sarcófago da mulher, 40 peles de castor, baú do
nothic (malaquitas de 12 po; poções de cura, escalada e crescimento), o esqueleto do Thel com o pingente de unicórnio,
13 pp e pedras de 50 po do Nosk, pergaminho de Imobilizar Pessoa no baú do Cajavidro (que ele leva se fugir).

**Capítulo 3** — Estrada: 1d4+2 stirges; 2d4 goblins com um chefe goblin (bolsa de 1d10 pc e 1d10 pp); 1d4+3
hobgoblins; os orcs viram dois bugbears batedores. Poço da Coruja: o Anel de Proteção netherese de vidro verde na
caixinha cravejada. Árvore-Trovão: Reidoth mulher idosa e de poucas palavras; a fazenda em três rodadas de quatro
galhos, os espetos na terceira; tesouros (1.400 pc no baú do mercador, 2.100 pc e 130 po na arca do dragão, couro +1 e
espada curta no elfo morto, escamas de dragão de latão na ferraria, seis ametistas no cofre do culto). Cume: vigia
bugbear, Brughor orc de 18 PV, quatro bugbears e o ogro Gog; baú de 180 pp, 15 pe e três perfumes; o desenho do goblin
com um cristal no crânio, na parede noroeste. Castelo: Yegg e Lhupo são chefes goblin (a Lhupo é mulher e reza ao
Dente Serrilhado, deus inventado), seis goblins no banquete, quatro hobgoblins na guarda, o lobo atroz do Grol, cálice
de 180 e incensário de 150. Agatha ofendida usa a Visagem Horripilante.

**Onda Eco** — 6 stirges (Percepção 14 contra a surpresa), 5 ghouls na grande caverna, 6 bugbears no alojamento
norte (o maior com 2 gemas e poção de cura), 4 bugbears e o Vhalak na caverna desmoronada (ele recua com três
mortos), o templo com o Nezznar e DOIS bugbears, sem as aranhas e sem a escala por nível; o Nezznar com o bloco do
Obelisco (duas Rajadas Venenosas). Tharden veste um Manto de Proteção. O lago: três anéis de ouro de 150 po e a
varinha. Baú do Mormesk: 100 pe e cinco malaquitas. Teto baixo nos túneis (motor: `field.tetoBaixo`). A estátua: cada
olho pede Destreza CD 12; o desabamento é Destreza CD 15 e 2d10, e a sala soterra uma rodada depois. O polvo puxa para
a água quem agarra, e quem começa o turno nela faz Força CD 10 ou afunda (condição `submerso`). O goblin morto está no
fundo do fosso, de crânio comprido e listras verdes.

**Defeitos do motor achados no caminho** — o agarrão não acabava com quem agarrava; 1 de dano contra resistência
aparecia como imune; o retrato da HUD quebrava com bloco sem look desenhado. E um defeito NOSSO, achado jogando no navegador: o puxão do polvo
foi escrito no evento do golpe, e o motor avisa o ataque ANTES de aplicar o `onHit` — o alvo ainda não estava contido,
e ninguém era puxado nunca. Hoje o puxão se confere no começo de cada lado; `src/dev/testes-polvo.mjs` roda a cena de
verdade e falha na versão antiga.

### 6.4 O que ficou de fora, e por quê

- **Os capítulos 5 a 8**, e com eles tudo o que a introdução do livro guarda para lá: a influência do Reino Distante, a
  transformação de Phandalin e a dos personagens (estágios 1 a 4, que começam no capítulo 5). É a outra metade da
  campanha, do 5º ao 12º nível, e pede o motor das aberrações.
- **Os ganchos "Amigo dos Harpistas" e "Aprendiz da Manopla"** como escolha na criação. Os dois existem no jogo pelo
  outro lado: a Garaele convida para os Harpistas e o Daran para a Manopla (`phandalin.js FACCOES`). Escolhê-los na
  criação não mudaria nada que o jogo faça.

### 6.5 A terceira passada: o que a 6.4 tinha deixado de fora (aplicado)

Três itens da 6.4 saíram da lista lendo de novo o livro, palavra por palavra, e a regra que ele dá:

- **C4, os Aposentos em Ruínas.** O livro põe os três goblins da torre DORMINDO e diz que barulho ali chama o
  banquete (C7): vem um goblin ver, e como ele não volta, vem o resto. Hoje, sem alarme no castelo, quem entra os pega
  dormindo (a surpresa é do grupo); a luta traz um cozinheiro na rodada 2 e os outros cinco com o Yegg na 4
  (`capitulo4-castelo.js barulhoNaTorre`). Com o castelo em alarme, nada disso — o banquete já vem por outro caminho.
  `src/dev/testes-castelo.mjs` roda a cena de verdade e falha sem a regra.
- **H1/H2, o mato do posto dos vigias.** O livro dá duas regras: o mato não se atravessa pelo lado oeste do riacho, e
  ele dá TRÊS QUARTOS de cobertura a quem ataca através dele. A primeira já valia pela planta (todo espinheiro fica a
  leste da água, e um teste agora guarda isso); a segunda não existia — a reta da clareira até o posto passava pelas
  ripas da tocaia e dava +2. Agora, no esconderijo (`mapa.espinheiroCobre`), espinheiro e tocaia no meio da reta dão
  +5 (`grid.js coverBetween`, `field.matas`). A emboscada e a rua usam o mesmo glifo e ficam como estavam: o livro
  não dá isso lá.
- **"Uma vez por dia" e "à vontade" de monstro.** O bloco declara `porDia` e `aVontade`, e o `makeMonster` os
  transforma nos usos livres que o motor já tinha para o herói (`passivas.js usoLivreDe`): nenhuma sai de espaço. O
  Cajavidro tem um Enfeitiçar, um Imobilizar, um Mísseis e dois Teleportes; o Nezznar, uma de cada das seis do bloco,
  e a Teia e as Patas de Aranha à vontade. A IA do conjurador (`ai.js temUso`) e a rendição do Cajavidro na Mansão
  passaram a perguntar pelo uso, não pelo espaço. **O que mudou na luta, visto no navegador:** o Nezznar soltava TRÊS
  Mísseis Mágicos seguidos (três espaços de 1º) e só depois usava as Rajadas; o livro dá um.

### 6.6 A quarta passada: a Agatha ataca, e a Teia tem a CD dela (aplicado)

- **A banshee de Conyberry LUTA.** Relido o Obelisco, ela ataca em DOIS casos, e a nossa versão não tinha nenhum:
  ofendida, se a Visagem não espantar o grupo, e — o que ninguém tinha visto — quando a Persuasão CD 15 FALHA (a
  nossa mandava voltar no dia seguinte, e isso era invenção nossa). Ela é a banshee do SRD (ND 4, 1.100 XP), e o
  motor ganhou o que o bloco faz: o Toque Corruptor, a Visagem Horripilante (Sabedoria CD 13 ou amedrontado, repetindo
  no fim de cada turno; quem passa fica imune) e o Lamento uma vez por dia (Constituição CD 13: quem falha cai a 0
  PV, quem passa leva 3d6 psíquicos) — `combat.js visagemHorripilante/lamentoDaBanshee`, `ai.js turnoDaBanshee`. A
  luta é num tabuleiro novo, a cabana de galhos trançados (`encounter.js covilAgatha`, `capitulo4-agatha.js`), e no
  fim o grupo volta ao mapa da região, como numa luta da estrada. Ofendida, quem aguentou o olhar escolhe entre sair
  da cabana e ficar; quem falhou entra na luta já com medo. **Medido em 200 lutas, campo aberto:** ela vence o grupo
  em 24% das vezes no 2º nível, 17% no 3º e 6% no 4º, com 0,17, 0,09 e 0,07 herói morto por luta. É a ameaça que o
  livro põe ali: o pente da Garaele e a boa educação existem para isso. A ficha é a do Livro dos Monstros, pelo
  mesmo espelho do 5etools das outras (`fichas-5etools.json`). Aproximações, ditas no bloco: o movimento incorpóreo
  é o mesmo buraco dos outros fantasmas, a Visagem não envelhece ninguém e a nova resistência ao medo vem sem a
  desvantagem de quem ainda a vê.
- **A Teia do Cajado da Aranha tem CD 15.** O bloco agora diz a CD de uma magia só (`spellcasting.cdPorMagia`), lida
  onde a `castSpell` decide a CD, e o registro diz de onde ela veio.

### 6.7 A quinta passada: o fôlego e os ganchos de antecedente (aplicado)

- **O afogamento.** Debaixo d'água corre o fôlego do SRD (`conditions.js gastarFolego`): 1 + CON minutos de ar (mínimo
  5 rodadas), depois CON rodadas sem ar (mínimo 1), e então a criatura cai a 0 PV. Na Onda Eco, quem o polvo deixa no
  fundo gasta o ar antes do teste de Força; quem sobe à tona o recupera inteiro. Na prática só pesa em quem falha a
  Força muitas rodadas seguidas — mas é a regra, e com ela a **Respirar na Água deixou de só narrar**: quem a recebe
  não gasta o ar até o próximo descanso longo.
- **Os ganchos de antecedente.** A introdução do Obelisco dá um porquê de ir a Phandalin para cada antecedente. Os doze
  heróis prontos já têm o seu, escrito para eles; o herói CRIADO saía com o motivo vazio, e era o único sem frase na
  apresentação do grupo na carroça (capítulo 1). Agora ele sai com o do antecedente que escolheu (`criador.js
  MOTIVO_DO_ANTECEDENTE`), com as nossas palavras.

## Os zumbis das cinzas (2026-11-13)

O Obelisco usa o bloco do zumbi do SRD e acrescenta só uma nuvem de cinza ao morrer, que dura cinco minutos e não tapa a
vista. A Brisa das Cinzas (desvantagem em tudo para quem está colado, Constituição CD 10) era da Mina. Aplicado o do
Obelisco (`monsters/mortosvivos.js zumbiDasCinzas`): o traço fica no motor, sem bloco que o use, e a nuvem é só a frase
no registro. Fica mais fácil que antes, e é o livro.
