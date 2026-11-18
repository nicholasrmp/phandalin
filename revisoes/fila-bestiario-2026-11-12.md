# A fila do motor dos bestiários — primeira leva (2026-11-12)

O que os blocos dos outros bestiários pediam e o motor não fazia fica em `src/dev/bestiario/<livro>-pendente.json`. Medida
antes desta leva: **326 entradas** (VGM 94, MTF 137, BGG 40, FTD 25, AI 18, MM 12), em **271 mecânicas diferentes** — a
fila é uma cauda longa: só 30 mecânicas aparecem em mais de uma criatura.

| Tipo | Entradas |
|---|---|
| traço | 134 |
| ação | 82 |
| magia que o jogo não tem | 52 |
| reação | 36 |
| ação lendária | 18 |
| sem golpe nenhum | 4 |

As 52 de MAGIA são quase todas de fora da luta (Controlar a Água, Controlar o Clima, Símbolo, Terreno Alucinatório, Sonho):
a criatura entra no jogo sem elas, e isso não muda a luta.

## O que entrou (`testes-fila-bestiario.mjs`, 10 provas no Encounter de verdade)

- **O traço que a criatura usa como ação bônus** vira ação especial com `bonus` (`importar-bestiario.mjs`, depois da
  leitura de sempre): o Passo Feérico dos quatro eladrins, o Passo das Sombras, o Teletransporte do merrenoloth, o
  Transporte Benigno, o Segundo Fôlego do campeão, a Fúria Marcial dos dois espectros da espada, a Provocação do bardo e
  da Brahma, a Corrupção e a Paralisia do nagpa, a Exibição Divina. A IA (`ai.js bonusEspecialNoTurno`) teleporta para o
  lado do inimigo que não alcança andando (`casaAoLado`) ou para longe quando ferida e cercada, cura com meia vida, e dá o
  golpe a mais no colado mais ferido.
- **Os traços lidos da frase** (`tracoLido`, motor em `livro-motor.js`): a Aversão ao Fogo (os três oblex, e mais três
  criaturas do MM que a tinham só como texto), o Indomável, a Proteção Arcana do abjurador, a Pele Venenosa dos três
  grungs (no golpe desarmado, na arma natural e no agarrão) e o Despertar do Rebento dos seis berços do Bigby (o rebento
  nasce na casa do berço antes da conta de fim de luta).
- **A Carapaça do tortle** (`concha`): +4 na CA, caído, sem deslocamento, sem reação; a IA se recolhe com um terço da vida
  e dois colados, fica enquanto o cerco dura e sai quando ele abre.
- Condições novas: `aversaoAoFogo`, `naConcha`, `exposto`, `provocado`.

**A fila caiu de 326 para 289.**

## Achados no caminho
- O teleporte só era lido com "teleports ... up to N feet": o "can teleport up to" e o "teleport 60 feet" ficavam de fora.
- Ler "ação bônus" em qualquer traço pegava o Balbucio do boca-gaguejante, que já tinha motor (fala da ação bônus de quem
  o ouve): a leitura nova roda DEPOIS da de sempre e só na frase em que a própria criatura usa a ação bônus.
- O Desafio do Campeão do Donaar saía como "incapacitado" (a frase cita a condição dele mesmo): fica na fila.
- A varredura (`varrer-bestiario.mjs`) não quebrou nenhuma criatura; as quatro lutas sem fim do MTF (Graz'zt, marut,
  recuperador, Titivilus) já existiam antes desta leva, com os blocos iguais.

## O que fica
289 entradas, quase todas de uma criatura só. As que se repetem: as magias de fora da luta, as reações a magia
(Reflexo de Magia, Encanto Instintivo), o Dreno de Vida, a Magia de Guerra, o Motor de Dor, a Perna Grudenta, o Comando
Infernal.

## A fila das magias (2026-11-12)

72 magias na fila (PHB 42, Xanathar 29, Tasha 1). Medido, elas são quase todas o que você já mandou deixar de fora: a magia
que só se narraria (Desejo, Simulacro, Teletransporte por Círculo, Controlar o Clima, Templo dos Deuses...), as de 1 minuto
ou mais de conjuração (as Conjurar Elemental, Celestial e Fada, o Tsunami) e as de alto círculo que pedem motor novo
(Muralha Prismática, Polimorfia em Massa, Dragão Ilusório).

Entraram as três que mexem no que o jogo já tem (`testes-magias-xge.mjs`):
- **Controlar Chamas** (truque): apaga, dobra ou corta pela metade a luz de uma chama do mapa (a tocha, o braseiro, a
  fogueira; `rules/chamas.js`). Explorando, a ação vem travada, então o truque aparece também no menu da chama, de longe e
  sem tocha (`game/fogo.js opcoesDeControlarChamas`): apagar a fogueira do Cume de 45 pés, antes de entrar, conferido no
  navegador.
- **Pirotecnia** (2º): a chama se apaga e vira fogos (Constituição ou cego, a 3 m) ou fumaça (6 m, escuridão pesada,
  1 minuto).
- **Cochilo** (3º): até três dormem dez minutos e acordam com o descanso curto (os recursos e os dados de vida que o
  descanso sugere).

O que sobra na fila e muda a luta: Invocar Demônios Menores e Maior (o demônio que ataca qualquer um), Esfera Aquosa,
Dispersar, Ossos da Terra, Redemoinho, Fúria da Natureza, Dragão Ilusório, Eterealidade, Muralha Prismática.

## A segunda leva (2026-11-12, a "terceira fila" no código)

Pedido do dono: seguir pela fila dos livros. Medida antes: **289 entradas**. Depois: **216** (magia que o jogo não tem 52,
traço 69, ação 52, reação 29, ação lendária 11, sem golpe 3). A leva foi por FAMÍLIA: o texto de cada entrada foi lido no
dado do 5etools, e entrou o que se repete entre criaturas ou cabe num molde que o motor já tinha.

O importador guarda o que leu num campo só do bloco, `motorDoLivro` (`makeMonster` o copia inteiro; dois traços da mesma
criatura se somam, e o nome do traço é o da tradução). O motor mora no fim de `livro-motor.js`. Provas: 15 novas em
`testes-fila-bestiario.mjs` (25 no arquivo), todas no Encounter de verdade.

| Família | Criaturas | No motor |
|---|---|---|
| O dano do primeiro acerto do turno | os três yuan-ti (presas mental, da morte, do veneno), o Omin (Golpe Divino, o tipo da arma) | `primeiroAcerto`, no acerto de `combat.js` |
| PV temporários de quem derruba | o bruxo de Imix, o yuan-ti sussurrador, o mercador de almas (metade da vida de quem caiu) | `pvTempAoDerrubar` |
| O COMANDO: aliados gastam a reação num golpe | a lâmina de Ilneval (3 orcs), o senhor da guerra duergar (3 duergar), o yagnoloth (2 yugoloths), o capitão drow (ação bônus), o senhor da guerra e o comandante githyanki (lendário, com vantagem), a matriarca drow (o demônio aliado) | `comandar`; o tipo pelo nome e pelas `marcas` do 5etools |
| O golpe reforçado | os quatro mirmidões: o Relâmpago (atordoa) e o Trovejante (derruba) num golpe; os Ardentes e os Congelantes em todo o multiataque | `golpeReforcado`, `multi` |
| O aperto que sufoca | o armadilheiro (concussão e ácido, cego), o rastejador rastreador | `aperto`, condição `apertoQueFere` |
| Auras de turno | a Degeneração Rançosa (fim do turno dele; ácido ou fogo seguram), a Aura da Aniquilação (quem termina o turno perto), a Presença Pútrida (um teste, +1 por bulezau), o Peso das Eras, o Mestre da Sepultura, o Corpo Espinhoso, o Sobrevivente | `fimDoTurnoDoLivro`, `inicioDoTurnoPerto`, `inicioDoTurnoDoDono` |
| Desvantagem nas resistências perto dele | o tecelão sombrio, o Hutijin, o grue cria estelar | `desvantagemNasResistencias` |
| Ataques contra ele com desvantagem | o velocino (salvo contido), a nuvem espectral (salvo a 4,5 m), o Splugoth (com dois aliados colados) | `desvantagemContraEle` |
| O sangue que fere quem corta ou fura | o beijo da morte, a mortalha ígnea | o `corpoQuente` de sempre, com `soCortaOuFura` |
| O respingo de quem é ferido | o troll venenoso (menos psíquico), o troll mutante (o psíquico de volta) | `aoSerFerido` |
| Reações | o desvio de projétil do adepto e da Rosie, a Esquiva Sobrenatural do Viari, a Fúria Sangrenta do dilacerador, a Ferida Nociva (só corte e ponta), a Voz Aterradora do Hutijin (um minuto), o Negar Magia do apostador do destino | `desviarProjetil`, `revide`, `repreensao` com `soTipos` e `rounds`, `negarMagia` |
| Ações que cabiam no molde | a cura do narzugon e do draconato de Bahamut, a área num ponto (o Virote Explosivo, a Lama em Pedra), o Grasnado, a Tempestade de Raios (atordoa só quem falha por 5), o Chamado da Tormenta, a Presença Drenante (condição nova `esmorecido`), a Canção da Dominação, a Voz do Kraken, o Olhar Debilitante (o `enfraquecido` do Raio do Enfraquecimento), a Investida Súbita do gnoll, a Escuridão sem componentes (a magia, uma vez por luta) | `acaoEspecial` |
| Ações lendárias | o teleporte "a até X pés", o andar de quem escreve "his speed", o mover sem oportunidade, o truque e a magia "um/uma", o sumir do balhannoth | `comandar`, `invisivel`, e os moldes de sempre |
| Vantagem em resistência | as Seis Cabeças do anátema, o orc nutrido de Yurtrus (veneno), a Desafiança à Expulsão | `vantagemRacial` no bloco, `resisteExpulsar` |
| A Magia de Guerra | o gish githyanki, o consorte drow: conjurou com a ação, golpeia com a ação bônus | `magiaDeGuerra`, depois da conjuração em `ai.js` |

### Achados no caminho
- O leitor geral lia a Tempestade de Raios da tempestade anciã como "atordoa quem falha": o livro atordoa só quem falha por 5
  ou mais. Agora é `soFalhandoPor`, e o motor confere a margem.
- A Ferida Nociva do carniçal das colinas só sai de corte ou ponta: a reação precisava saber o tipo do dano que a disparou
  (`combat.js ultimoTipoDano`).
- A varredura (`varrer-bestiario.mjs`) não quebrou nenhuma criatura nos cinco livros. As lutas sem fim — o espinhento e os
  dois vegepigmeus do Volo, e as quatro do Mordenkainen — são IGUAIS no commit anterior (rodado numa cópia do HEAD): não
  vêm desta leva.

### O que fica
216 entradas, quase todas de uma criatura só e de regra própria: as reações a magia (Reflexo de Magia, Mimetismo de Magia,
o Encanto Instintivo), as que trocam o alvo de um golpe (o Guarda-Costas Leal, o Servo Protetor, a Curvatura do Espaço), o
Motor da Dor dos duergar, a Perna Grudenta dos steeders, a posse de corpos e objetos, as transformações (a Forma Selvagem, o
Roubo de Forma), as invocações com bloco próprio e as magias de fora da luta.

## A fila das magias, segunda leva (2026-11-12)

Medida antes: **69 magias** na fila (PHB 42, Xanathar 26, Tasha 1). Depois: **64** (o Xanathar caiu para 21). Lida a fila
inteira, o que muda a luta e cabia nos moldes do motor eram cinco do Xanathar; as provas estão em `testes-magias-xge.mjs`
(30 no arquivo, 5 novas).

| Magia | No jogo | O que fica de fora (a `nota` da magia) |
|---|---|---|
| Moldar Terra (truque) | um quadrado de 1,5 m de terreno difícil por 1 hora | cavar e desenhar no chão |
| Esfera Aquosa (4º) | quem está nela e falha Força fica contido (sai com Atletismo); anda 9 m com a ação | a esfera não leva quem prendeu; soltar a água no fim |
| Transmutar Rocha (5º) | a Rocha em Lama em qualquer chão: o passo custa quatro vezes, e quem estava nela afunda (contido) | a Lama em Rocha |
| Redemoinho (7º) | 10d6 de concussão em quem está nele ou entra nele, metade no sucesso; anda 9 m com a ação | prender, arrastar e arremessar |
| Dragão Ilusório (8º) | ao surgir, o inimigo que o vê a 36 m testa Sabedoria ou fica amedrontado; quem conjura sopra um cone de 18 m (Inteligência, 7d6, do tipo escolhido) com a ação bônus | o sopro sai de quem conjura, e o dragão não anda |

O que sobra, e por quê: as de 1 minuto ou mais de conjuração (as Conjurar, o Tsunami, o Aprisionamento), as que só se
narrariam (Desejo, Simulacro, Controlar o Clima, Templo dos Deuses, Sonho), as de exploração que mudam o mundo de um jeito
que o tabuleiro ainda não guarda (Moldar Rochas, Criar Passagem, Mover a Terra) e as poucas de luta que pedem motor novo:
Invocar Demônios Menores e Maior (o demônio ataca qualquer um, e o jogo não tem um lado "contra todos"), a Muralha Prismática
(sete camadas), Dispersar, Ossos da Terra e Fúria da Natureza.

## A terceira leva do bestiário (2026-11-12)

Medida antes: **216**. Depois: **192**. As 24 entradas são famílias que cabiam em ganchos que o motor já tinha; provas em
`testes-fila-bestiario.mjs` (33 no arquivo, 8 novas).

| Família | Criaturas | Onde |
|---|---|---|
| Proteger o aliado com a reação | o defensor de pedra (+5 de CA ao colado), o merregon (toma o golpe do corruptor colado), a Zuggtmoy (o enfeitiçado colado toma o golpe dela), o vidente cria estelar (troca de lugar com outra cria, que leva o golpe) | `interceptar` no lugar do Aparar; `quemTomaOGolpe` no lugar da Runa da Nuvem |
| +10 no ataque do aliado que ia errar | o sacerdote da guerra, o Omin | `golpeGuiado` |
| Vantagem no ataque por condição | a falange do guarda de pedra duergar, o hidroloth na água, o Solitário (desvantagem sem companhia), o orc presa vermelha na primeira rodada, o amaldiçoado de pedra no ataque de oportunidade | `vantagemNoAtaque` em `attackModifiers` |
| Ficar invisível | o mastim das sombras (ação bônus, só no escuro), o orthon (acaba também ao ser acertado), o gato sorridente e o duergar cavaleiro (ação); o espreitador é sempre invisível | ação especial `sumir`; `sempreInvisivel` |
| Animar os aliados | o Bael e o narzugon (nada de medo e encanto), o kith'rak (tira o medo e o encanto), o abishai vermelho (fanatismo), a matriarca drow (o favor de Lolth, que cobra 2d6) | ação especial `animarAliados`, condições `firmeNoComando`, `fanatizado`, `favorDeLolth` |
| Explodir e revidar | o orthon explode a 15 PV ou menos; o déspota duergar solta 4d6 psíquico no crítico e ao cair; o gnoll definhado golpeia quando um gnoll cai perto | `explodeFerido`, `motorPsiquico`, `golpeVingador` |

### Achado no caminho
O gancho de dano dos livros (`depoisDoDano`) roda ANTES de os PV caírem: a explosão do orthon, chamada dali, nunca o via
abaixo de 15 PV. A chamada foi para logo depois da subtração em `applyDamage`.

### O que fica de fora destas criaturas, dito
O Golpe Guiado vale só quando o +10 vira o erro em acerto (o livro deixa escolher depois do dado, e só vale gastar aí); a
Mescla de Sombra não acaba sozinha quando o mastim entra na luz plena; a Formação em Falange vale com qualquer duergar
colado, sem olhar o escudo, e não dá a vantagem na Destreza; o Matador não faz do acerto no surpreendido um crítico.

## A quarta leva do bestiário (2026-11-16)

Medida antes: **192** (126 mecânicas e 66 listas de magia que faltam). Depois: **181**. As onze entradas cabiam em ganchos
que o motor já tinha; provas em `testes-fila-bestiario.mjs` (42 no arquivo, 10 novas), e a varredura dos quatro
bestiários não quebrou nenhuma criatura (as sete lutas sem fim são as de antes).

| Família | Criaturas | Onde |
|---|---|---|
| A reação antes do dano | o nilbog zera o golpe e cura 1d6; o caçador de ovos ganha resistência ao tipo, já neste dano; o lamento gélido, acertado por ataque, toma metade e some a até 9 m; o espreitador de gemas toma para si 3d6 do dano do aliado a até 9 m; o orador dracônico tira 1d6 do golpe do inimigo a até 18 m | `reacaoAntesDoDano`, no começo de `applyDamage` |
| A magia que poupa os aliados | o evocador (evocação, 1 + o círculo) e o devastador hobgoblin (todos): passam no teste e não levam dano | a Cuidadosa do feiticeiro (`metaAtiva.careful`), `aliadosPoupados` |
| Alimentar-se de quem falha | o mago-larva: 10 PV temporários quando alguém a até 6 m falha um teste | `aoFalharResistencia`, no fim de `resistencia` |
| O fogo que recarrega | a salamandra glacial: o dano de fogo recarrega o sopro | `fogoRecarrega`, em `depoisDoDano` |
| O dado a mais e o recuo | o arqueiro soma 1d10 ao ataque de arco (ação bônus, 3 por dia); a leucrota desengaja depois do golpe de cascos | `olhoDoArqueiro`, junto do Golpe Guiado; `coiceERecua` |

### O que fica de fora destas criaturas, dito
O Olho do Arqueiro só é gasto quando o d10 pode virar o erro em acerto, e não vale no dano; o Esculpir Magias não confere
se o evocador VÊ o aliado; a Fuga na Nevasca escolhe a casa mais longe de quem bateu, entre as que ele vê; o Elo
Protetor vale para qualquer aliado, não para "outra criatura qualquer" como no livro. O Raivoso e o Faminto ficaram para
outra leva: pedem um gancho de cura que o motor ainda não dá ao livro.

## A quinta leva do bestiário (2026-11-16)

Medida antes: **181**. Depois: **171**. Provas em `testes-fila-bestiario.mjs` (51 no arquivo, 9 novas); a varredura dos
cinco bestiários não quebrou nenhuma criatura (as sete lutas sem fim são as de antes).

| Família | Criaturas | Onde |
|---|---|---|
| O dano que acende um estado | o sapomoth fica em choque com relâmpago (lento até o fim do próximo turno); o leviatã congela em parte com 50 de frio num turno (6 m e desvantagem); o Raivoso, ferido, ataca com vantagem e o primeiro gancho fere +3d12 psíquico, e sem ninguém o ferir ataca com desvantagem | `estadoPeloDano` em `depoisDoDano`; condições `emChoque`, `congeladoEmParte`, `raivaCrescente` |
| A cura que acende a fome | o Faminto vê alguém recuperar PV: vantagem e a mordida +4d10 necrótico | `aoCurar`, novo gancho em `heal`; `fomeDeVida`; `danoExtraDoEstado` |
| A morte | a Colheita Sinistra do necromante (2x o círculo da magia que matou, 3x se necromancia); o Devorador de Vida do andarilho noturno (quem ele zera morre, sem teste) | `colheitaSinistra`, `comedorDeVida` |
| A ação e a reação a mais | o estrangulador, uma ação a mais por luta; a dracohidra, um ataque de oportunidade a mais por cabeça além da primeira | `rapidezAberrante` (pelo `extraActions` do Surto de Ação); `temCabecaReativa`/`gastarCabecaReativa` (como o Defensor Vigilante) |
| Não se deixa mover | o gigante de pedra da terra maligna: o empurrão não o move, e a reação o mantém de pé contra a queda | `inabalavel`, em `empurrar` e no teste contra cair |
| A Eminência Divina | a profetisa Dran: é a regra do sacerdote do SRD, que a IA já usa | `traits: ['eminenciaDivina']` |

### Achado no caminho
`testes-regras.mjs` cobra ícone de tudo, e as quatro condições novas entraram sem: ganharam o de traço em
`icones-traco/mapa-novo-condicao.json`.

### O que fica de fora destas criaturas, dito
A Rapidez Aberrante volta no descanso curto no livro; aqui vale uma vez por luta. As cabeças reativas contam cinco (a
dracohidra do livro tem cinco e perde e ganha cabeças, o que o bloco importado ainda não faz). O Inabalável só cobre o
empurrão e o teste contra cair que já dizem do que são; a queda que vem embutida em outro efeito não pergunta a ele.

## A sexta leva do bestiário (2026-11-16)

Medida antes: **171**. Depois: **162**. Provas em `testes-fila-bestiario.mjs` (56 no arquivo, 5 novas); a varredura do
Volo, do Mordenkainen e do Bigby não quebrou nenhuma criatura.

| Família | Criaturas | Onde |
|---|---|---|
| O dano que volta | o Perdido, ferido, aperta quem agarra (4d8 psíquico); o rebento de Grolantor, ferido, fere quem engoliu (3d6 energético) e se cura 10; o brutamontes cria estelar não leva dano psíquico, e quem está a 3 m leva no lugar dele (dois juntos não se devolvem para sempre) | `danoQueVolta` em `depoisDoDano`; `espelhoPsiquico` antes do dano |
| O dado depois da jogada | a sorte do bruxo do corruptor (+1d10 num teste, uma vez por luta); a instrução do senhor da guerra duergar (+1d6 ao aliado que ia falhar, num teste ou num ataque, que paga 1d6 psíquico) | `dadoDepoisDaJogada` no fim de `resistencia`; `instrucaoCortante` junto do Golpe Guiado |
| A fúria de Vaprak | o gigante do gelo eterno: no começo do turno, resistência a concussão, perfurante e cortante e +4 no dano de perto | condição `furiaDeVaprak`, `danoExtraDoEstado` |
| Os banimentos | o cão yeth sob a luz do sol vai para o Etéreo; o barghest dentro de uma zona de fogo de 3 m ou mais testa Carisma ou vai para a Geena; os dois saem da luta | `banimentoNoComeco`, condição `banidoDoPlano`, `naoSeguraALuta` |
| Sem nada a fazer, dito | a Força Desproporcional do barrete vermelho tira duas penalidades que o motor não aplica a monstro | o importador a reconhece e não põe nada |

### O que fica de fora destas criaturas, dito
A Fúria de Vaprak não dá a vantagem em Força, e vale uma vez por luta (no livro volta no descanso curto). A sorte do bruxo
só vale nos testes de resistência, não nos de atributo. O cão yeth não volta depois do pôr do sol: sai da luta. As duas
condições novas pediram ícone (`testes-regras.mjs`).

## A sétima leva do bestiário (2026-11-16)

Medida antes: **162**. Depois: **152**. Provas em `testes-fila-bestiario.mjs` (62 no arquivo, 6 novas); a varredura do
Volo, do Mordenkainen e do Fizban não quebrou nenhuma criatura.

| Família | Criaturas | Onde |
|---|---|---|
| O golpe que só agarra | a Pata Pegajosa dos dois steeders (escape 12, um agarrado por vez) | `importar-bestiario.mjs golpe`: a frase que só agarrava não era lida, como a que só prende; a leitura do agarrão também ficou mais larga ("grappled until it escapes (escape DC 12)") |
| O encanto que desvia o golpe | o eladrin do outono faz errar quem ele enfeitiçou, contra outra criatura a até 18 m dele; o amnizu e o encantador: quem os ataca testa Sabedoria, ou o golpe vai para a criatura mais perto do atacante (o amnizu imuniza quem passa; o do encantador vale uma vez) | `cultivarAPaz`; `encantoInstintivo` em `quemTomaOGolpe` |
| A aura Medonha | o Bael: quem começa o turno a 3 m dele testa Sabedoria CD 22 ou fica amedrontado até o próximo turno | a `aura` com teste que o motor já lê |
| De sombra em sombra | a lâmina sombria drow salta 18 m com a ação bônus, só da penumbra para a penumbra | o teleporte de ação bônus, com `soNaSombra` |
| A vingança do orc | o orc nutrido de Yurtrus se leva a 0 PV e explode, quando tem dois inimigos no raio | ação especial `sacrificio`, a IA em `ai.js` |
| Sem nada a fazer, dito | o Roubo de Forma do draconiano (só aparência) e a Lâmina da Alma do duergar (o golpe já está nas ações) | o importador os reconhece e não põe nada |

### O que fica de fora destas criaturas, dito
O Encanto Instintivo troca o alvo DEPOIS do acerto, como as outras reações que trocam quem leva o golpe; no livro é antes
de rolar, e um erro também mudaria de alvo. A aparência Medonha do Bael é uma ação bônus no livro; aqui é uma aura sempre
ligada, porque ele a usaria em todo turno. O Passo Sombrio não dá a vantagem no primeiro golpe depois do salto.

## A oitava leva do bestiário (2026-11-16)

Medida antes: **152**. Depois: **146**. Provas em `testes-fila-bestiario.mjs` (66 no arquivo, 4 novas); a varredura dos
SEIS bestiários (o importador mudou em todos) não quebrou nenhuma criatura. A luta sem fim do rakshasa do MM já era assim
no último commit (medido numa cópia dele): é imune a arma comum e a magia até o 6º círculo.

| Família | Criaturas | Onde |
|---|---|---|
| O chão difícil em volta | a lama do brutamontes (4,5 m); a contaminação do sibriex (9 m, e a aura que envenena quem começa o turno nela, Constituição CD 20, 4d6); a correnteza do wastrilith (18 m, só nas casas de água) | o chão aberrante da boca tagarela generalizado (`casasDoChaoAberrante`, `mexeNoChao`), refeito quando o dono anda ou cai |
| Entrar no alcance | a garra de osso: quem ENTRA no alcance dela provoca o golpe, e o acerto dá um segundo | `ameacasNoPasso`, ao lado do Manter a Linha; `alcanceMortal` em `opportunityAttack` |
| Caído que não sofre | o fomoriano rastejador: rasteja sem custo a mais, e o caído não dá vantagem a quem o ataca de perto | `rastejando`, `attackModifiers` |
| A língua | o sapomoth puxa um alvo até Médio a até 6 m que falha a Força (CD 18) para junto dele, e morde com a ação bônus | ação especial `puxarAlvo` |

### Achado no caminho
O `semTags` do importador lia `{@quickref difficult terrain||3}` como "3" (pegava o último campo); o texto mostrado é o
quinto campo, e sem ele é o nome. Gerados os seis livros com a regra velha e a nova, só o wastrilith mudou.

### O que fica de fora destas criaturas, dito
O chão difícil vale também para o próprio dono (o livro diz "para as outras criaturas"), porque a casa difícil é uma só
para todos. A correnteza do wastrilith é uma ação bônus no livro; aqui fica sempre ligada enquanto ele vive.

## A nona leva do bestiário (2026-11-16)

Medida antes: **146**. Depois: **140** (80 mecânicas e 60 listas de magia; as magias que faltam são quase todas de fora
da luta ou de um minuto de conjuração, e esperam o trabalho das magias, não o do bestiário). Provas em
`testes-fila-bestiario.mjs` (70 no arquivo, 4 novas); a varredura do Volo não quebrou nenhuma criatura.

| Família | Criaturas | Onde |
|---|---|---|
| Livrar-se do medo | o kobold escudo dracônico repete o teste contra amedrontado ou paralisado no começo do turno, e passando livra os kobolds a até 9 m | `coracaoDoDragao`, no começo do turno |
| Golpe de magia com ajuda | o devastador hobgoblin soma 2d6 ao ataque de magia em quem está colado num aliado dele, uma vez por turno | `vantagemArcana`, depois de `ataqueMagico` |
| Encanto e pedra | o andarilho dos sonhos enfeitiça quem começa o turno a 9 m (Carisma 13, uma aura com teste), e o Toque Petrificante só pega quem ele enfeitiçou (Constituição 17) | `aura`; ação especial `alvo` com `soComCondicao` |
| Sem errar | o Dardo de Vento do gigante quintessente acerta a até 180 m | ação especial `alvo` com `semTeste` |
| Anda e chuta | a Perseguição Férrea do barrete vermelho: anda até o alvo (sem gastar o deslocamento do turno) e chuta, Destreza 14 ou dano e caído | ação especial `alvo` com `anda`, `andarAteOAlvo` |

### O que fica de fora destas criaturas, dito
O Coração do Dragão não dá a vantagem no próximo ataque. O Toque Petrificante não prende a pedra ao corpo do gigante (a
regra de que a Restauração Maior não desfaz enquanto ele vive). A Perseguição Férrea alcança até 9 m (o deslocamento do
barrete vermelho mais o chute).

## A décima leva do bestiário (2026-11-16)

Medida antes: **140**. Depois: **131** (mm 12, vgm 33, mtf 48, ftd 15, bgg 16, ai 7). Provas em
`testes-fila-bestiario.mjs` (75 no arquivo, 5 novas); a varredura dos seis livros não quebrou nenhuma criatura, e as
lutas sem fim são as oito de antes.

| Família | Criaturas | Onde |
|---|---|---|
| Sopro de tipo escolhido | o Sopro Prismático da dracohidra: ácido, frio, fogo, elétrico ou veneno, o que mais fere os inimigos no cone (a conta do Orbe Cromático) | `breath.tiposAEscolher`, em `combat.js sopro`; a fala do sopro passou a dizer o tipo |
| Efeito sorteado por criatura | os Raios Prismáticos do falarrocha: cone de 18 m, Destreza 17, e um d6 por criatura escolhe o raio (radiante e cego, necrótico e amedrontado, energético e incapacitado, até o fim do próximo turno do gigante; no sucesso, metade) | ação especial `area` com `sorteio`, `livro-motor.js sortearOEfeito`; os três raios são as ações irmãs "1-2: ..." do dado |
| Sanguessuga | a Sanguessuga Vital do yagnoloth: só num incapacitado a até 4,5 m, 7d8+4 necrótico que entra sempre, PV temporários da metade, e o máximo de PV cai só em quem falha a Constituição 16 | ação especial `alvo` com `soIncapacitado`, `danoSemTeste`, `pvTempMetade`, `reduzMaximoSeFalhar` |
| Golpes em série | a Rajada de Garras do mutilador cria estelar: seis garras no mesmo alvo colado | ação especial `golpes` |
| Reviver o aliado | o Erguer Carniçal do maurezhi: o carniçal ou o lívido morto a até 9 m volta com toda a vida | ação especial `reviver`, `livro-motor.js reviverAliado` (o nome do livro, e o id do bloco feito à mão, que não o guarda) |
| Fora do jogo | o Treino de Cavalaria do duergar kavalrachni só vale montado, e o jogo não tem montaria (como o Combatente Montado) | sai da fila sem motor |

### Achado no caminho
O **Geodo Explosivo** do mesmo gigante entrava como um raio de 18 m EM VOLTA dele (pegava todo mundo a 18 m, e só com o
primeiro dado): a leitura da área num ponto não conhecia "centered on THAT point". Hoje é a esfera de 6 m num ponto a até
18 m, com o 3d8 radiante junto. A mesma leitura passou a dar a duração do livro: "até o fim do próximo turno DELE" (o
dono) e "até o fim do próximo turno do ALVO" — o Vórtice Trovejante do Bigby também ganhou a dele. Gerados os seis
livros antes e depois, só esses dois blocos mudaram.

### O que fica de fora destas criaturas, dito
A Runa de Pedra não é objeto no tabuleiro: os Raios Prismáticos valem enquanto o gigante vive. A Rajada de Garras não dá
o deslocamento de ação bônus antes ou depois dos golpes. A Sanguessuga reduz o máximo como as outras reduções do motor,
e a morte pelo máximo a 0 é a delas.

## A décima primeira leva do bestiário (2026-11-16)

Medida antes: **131**. Depois: **124** (mm 12, vgm 32, mtf 44, ftd 15, bgg 14, ai 7). Provas em
`testes-fila-bestiario.mjs` (82 no arquivo, 7 novas); a varredura dos seis livros não quebrou nenhuma criatura. Num turno
de verdade, a IA usa as seis ações novas sozinha.

| Família | Criaturas | Onde |
|---|---|---|
| Atropelar | o colosso de geada (Rastro de Geada: Con 15, 4d10 frio e lento até o começo do próximo turno dele; passa, metade) e a bocarra de Yeenoghu (Investida Voraz: For 18, 3d12+6 e agarrada e contida, uma por vez; quem já estava preso cai) andam em linha reta pelo espaço de quem cabe no tamanho do livro, sem ataque de oportunidade, e param na parede, em quem é grande demais e na última casa livre. Quem agarra para logo depois da vítima | ação especial `atropelar`, `livro-motor.js trajetoDoAtropelo` (a IA escolhe a reta que passa por mais inimigos) |
| Dreno pelo agarrão | o Dreno de Sangue do beijo da morte: só no agarrado por ele, Con 16, 4d10 elétrico, e cura metade | ação especial `alvo` com `soAgarrado` e `drenaMetade` |
| O máximo pelos dados | o Olhar Rouba-Alma do nabassu: Car 16 ou o máximo de PV cai 2d12 e ele ganha o mesmo em PV temporários; constructo e morto-vivo não | ação especial `alvo` com `reduzMaximoDados`, `pvTempIgual`, `naoTipos` |
| Cura que cobra | a Cura Corrompida do oinoloth: o aliado (ou ele) volta com toda a vida e perde uma condição (paralisado, cego, envenenado, surdo), mas ganha um nível de exaustão e o máximo cai 2d6. A IA a usa em quem tem um quarto da vida | ação especial `curaCorrompida` |
| Chamado | o Chamado à Honra do comandante espectro da espada: só ferido, traz 1d4+1 guerreiros e ataca com vantagem até o fim do próximo turno | `invocar` com `soFerido` e `vantagemPropria` (condição `chamadoAHonra`) |
| Cabeçada | a Investida de Cabeça do giff: 6 m em linha reta que acabam ao lado de alguém até Grande, For 14 ou 2d6 e caído, sem golpe; uma por turno | `motorDoLivro.investidaDeCabeca`, no fim de `moveAlong` |
| Sede de sangue | o flind: o gnoll com Rampage a até 3 m dele morde com a ação bônus que sobrou no fim do turno | `motorDoLivro.sedeDeSangue`, `livro-motor.js mordidaDaSede` em `endTurn` |

### Achado no caminho
O **Dreno de Sangue do beijo da morte** já entrava, e errado: a leitura geral o tomava por uma ação a 4,5 m que AGARRAVA
quem falhasse, sem dreno nenhum. Por isso não estava na fila. Hoje é o dreno do livro, no agarrado pelo tentáculo.

### O que fica de fora destas criaturas, dito
O Atropelar só fere os inimigos (o livro pega toda criatura em que entra), e o agarrão da bocarra só pega quem ficou ao
lado dela no fim da carga. O Chamado à Honra lê "ferido" no lugar de "levou dano nesta luta". O humanoide morto pelo
Olhar Rouba-Alma não se levanta carniçal. A Investida de Escudo do couraçado gigante do fogo (golpe que empurra pela
carga) e o carrapato gigante (o grudar do Probóscide) seguem na fila.

## A décima segunda leva do bestiário (2026-11-16)

Medida antes: **124**. Depois: **116** (mm 12, vgm 31, mtf 41, ftd 15, bgg 10, ai 7). Provas em
`testes-fila-bestiario.mjs` (88 no arquivo, 6 novas).

| Família | Criaturas | Onde |
|---|---|---|
| Invocar | os Espectros do coletor de cadáveres (1d6, com a ação bônus, uma vez por luta), o Servo da matriarca drow (o yochlol) e os Lobos de Gelo do moldador (1d4 lobos do inverno, uma vez por luta) | `INVOCACOES` do importador; a IA chama com a ação bônus quando há inimigo a até 18 m |
| Prender à distância | o Aperto Sepulcral do rebento de Skoraeus (a até 6 m, Des 24, 8d6 energético e agarrado; quem segue preso no começo do turno dele vira pedra) e a Corda de Cabelo do korred (ação bônus, a até 15 m, Des 13 ou agarrado e contido; não prende de novo quem segura) | ação especial `alvo` com `prende` (`escape`, `contido`, `petrificaNoInicio`), `tamanhoMax`, `semPrenderDeNovo` |
| Devolver a magia | o Velo Absorvente do carneiro gigante: passou numa resistência contra magia, ou o ataque de magia errou, e com a reação dispara o Disparo de Energia em quem conjurou (recarga 6) | `livro-motor.js veloAbsorvente`, no fim de `resistencia` e no erro de `ataqueMagico` |
| Postura | o Bloquear o Caminho do ogro aríete: até o começo do próximo turno, quem o ataca tem desvantagem, o golpe de oportunidade dele tem vantagem e 3d10 a mais, e quem tenta sair do alcance dele faz For 14 ou fica parado (com ou sem a reação dele) | ação especial `postura` (a condição `bloqueandoOCaminho`), `barraASaida` no passo de `moveAlong` |
| Grudar e drenar | o carrapato gigante: o Probóscide gruda (o mecanismo do stirge) e o Drenar Sangue tira 2d6+3 necrótico e cura o mesmo, sem o teto de 10 do stirge; o Miserável do Mordenkainen drena 1d10+1 necrótico no começo do turno | `motorDoLivro.grude`, lido por `drenarSangue` |

### Achado no caminho
A primeira leitura do "gruda" pegava todo golpe que diz que a criatura se prende, e o **manto escuro** do MM (que se
prende à cabeça e cega, sem drenar) teria virado um stirge. Hoje só gruda quem drena: o Miserável pelo próprio golpe e
o carrapato pela ação Drenar Sangue. O Miserável já estava fora da fila e não drenava nada.

### O que fica de fora destas criaturas, dito
A matriarca chama sempre o yochlol (o livro deixa escolher o recuperador). Os lobos de gelo não ganham o +6 de ataque e
dano perto do moldador, e a Runa de Gelo não é objeto. Os espectros do coletor não somem quando ele morre. O carrapato
não drena mais do gigante e não se solta gastando deslocamento.

## A décima terceira leva do bestiário (2026-11-16): a lista de ações bônus que ninguém lia

Medida antes: **116**. Depois: **136** (mm 12, vgm 31, mtf 41, ftd 18, bgg 27, ai 7) — a fila CRESCEU, e é o achado desta
leva: **o importador não lia a lista `bonus` do 5etools.** Os livros de 2022 (Fizban e Bigby) guardam a ação bônus numa
lista à parte, e não no traço como os livros antigos; eram 68 ações bônus (mais 8 sub-opções) de 48 criaturas que nem
entravam no motor nem apareciam na fila — os quinze dragões de gema sem o Passo Psíquico, os berços sem a erupção, o
gargantua sem o Teletransporte. Hoje **48 viram ação** e **20 vão para a fila, à vista** (chave `bonus`). Provas em
`testes-fila-bestiario.mjs` (93 no arquivo, 5 novas), uma delas a conta: cada ação bônus do dado vira ação, texto ou
fila, e nenhuma some. A tradução não tinha lido essa lista, então os nomes vão à mão (`NOMES_DA_ACAO_BONUS`).

| O que entrou | Onde |
|---|---|
| Golpe de ação bônus próprio (o Arremessar Membro do amálgama de troll, o Dardo de Cristal do espreitador de gemas): o perfil vai DENTRO da ação e só entra na lista de golpes durante ela, para a IA nunca o usar como ação; à distância, a IA mira o inimigo à vista mais ferido | `golpeBonus` com `golpe` |
| Teleportes (o Passo Psíquico dos dragões de gema, o Passo Sorridente, o Teletransporte do gargantua) | `teleporte` com `bonus` |
| O Teleporte Aterrador do gigante da morte (amedronta quem estava a 3 m de onde ele saiu) e a Explosão de Relâmpago do sopro animado (fere quem fica a 1,5 m de onde ele chega) | `medoAoSair`, `danoAoChegar`, `livro-motor.js depoisDoTeleporte` |
| Áreas (o Gêiser de Lava, a Névoa Gélida, o Clarão de Cristal, a Treva Rastejante, o Zumbido, a Tempestade de Granizo, a Névoa do Engano) e alvos (a Presença Sedutora, a Maldição Funesta), o Passo Oculto (`sumir`) | as ações especiais de sempre, com `bonus` |
| Mudar de Forma | texto na ficha |

### Achado no caminho
A área num PONTO não conhecia o **cilindro** nem "a partir de um ponto": o Gêiser de Lava e a Tempestade de Granizo
entravam como um raio de 36 m em volta do dono. Hoje são o círculo do raio do cilindro, num ponto a até 36 m (a altura
do cilindro não conta na grade). Gerados os seis livros antes e depois, só os do Fizban e do Bigby mudaram.

### O que fica de fora, dito
Na fila: as duas mordidas que engolem (o colosso de carne, o regissauro), o Pó de Escamas (contorna de luz e impede a
invisibilidade), o Movimento Sísmico dos rebentos, a Tempestade Vingativa, a Fumaça Incendiária, a Armadura de Fornalha,
a Mortalha de Almas e o resto. A Névoa Gélida não tira as reações, a Névoa do Engano só enfeitiça (não obriga a golpear
o aliado), o Zumbido não dá o voo depois e as gemas do Dardo de Cristal não dão o efeito extra.

## A décima quarta leva do bestiário (2026-11-16)

Medida antes: **136**. Depois: **121** (mm 12, vgm 30, mtf 40, ftd 17, bgg 15, ai 7). Provas em
`testes-fila-bestiario.mjs` (98 no arquivo, 5 novas). Quase tudo da lista de ações bônus que a leva anterior pôs à vista.

| Família | Criaturas | Onde |
|---|---|---|
| Tremor | o Movimento Sísmico dos quatro rebentos (anda até o inimigo, de graça, e quem se concentra no chão a até 18 m faz Con 23 a 26 ou perde a concentração) e o do zaratan (depois de andar 3 m, a até 36 m, Con 25; a IA o solta no fim do turno) | ação especial `tremor`; `motorDoLivro.tremorDepoisDeAndar` em `endTurn` |
| Correr | o Movimento Rápido do filhote caçador de ovos (Correr: o deslocamento outra vez, sem ataque de oportunidade) e a Investida da fúria de Kostchtchie (o deslocamento outra vez, sem livrar do ataque de oportunidade) | `disparada` com `doDeslocamento` e `provoca`; a IA usa com ação bônus quando ninguém está ao alcance |
| Engolir com o próprio golpe | o regissauro (ação bônus, até dois engolidos, 2d6 ácido por turno) e o colosso de carne (a mordida de 3d8+7 que engole, 3d6 energético por turno); o Engolir do banderhobb do Volo ("makes a bite attack", que a leitura não conhecia) | `engolir` com `golpe` e `max` |
| Postura de ação bônus | os Golpes de Gigante do golias (até o fim do turno, +2d6 no golpe de perto; o tipo é o da comunidade, aqui a de pedra) e a Armadura de Fornalha (meia cobertura, +2 de CA, por um minuto) | `postura` com `ateFimDoTurno` e `rounds`; as condições `golpesDeGigante` e `armaduraDeFornalha` |
| Outras | os Gritos Dissonantes do eco de Demogorgon (o Tormento Psíquico, 2d12) e o Recolher o Arpão do gigante do gelo da água maligna (o preso vem até 6 m) | `alvo`; `puxarAgarrados` com `bonus` |

### Achado no caminho
O `semTags` do importador lia `{@status concentration||concentrating}` pelo primeiro campo ("concentration"); o texto
mostrado é o terceiro. Hoje ele devolve o terceiro campo quando há, como no 5etools. Gerados os seis livros antes e
depois, só os cinco tremores mudaram.

### O que fica de fora, dito
O tremor do zaratan não deixa o terreno difícil nem derruba estruturas. Os Gritos Dissonantes não fazem o alvo golpear o
aliado. O Pó de Escamas, a Mortalha de Almas, a Fumaça Incendiária, o Movimento Dúplice, os Espinhos de Pedra e a
Tempestade Vingativa seguem na fila.

## A décima quinta leva do bestiário (2026-11-16)

Medida antes: **121**. Depois: **113** (mm 12, vgm 26, mtf 38, ftd 17, bgg 13, ai 7). Provas em
`testes-fila-bestiario.mjs` (103 no arquivo, 5 novas).

| Família | Criaturas | Onde |
|---|---|---|
| A aura que a ação bônus liga | a Mortalha de Almas do gigante da morte amortalhado (quem começa o turno a 1,5 m faz Sab 19 ou fica com desvantagem nas resistências) e a Fumaça Incendiária do rebento de Surtur (desvantagem para quem atira nele; quem começa o turno a 9 m faz Con 25 ou 4d6 fogo), por um minuto | `postura` com `data.auraNoInicio`, lida por `livro-motor.js auraDaCondicao` em `inicioDoTurnoPerto` |
| Loucura | o Fomentar a Loucura do alkilith: quem não é demônio e começa o turno a 9 m faz Sab 18; falha, desvantagem nos ataques e resistências até o fim do turno; falha por 5, confuso por um minuto e imune depois | `motorDoLivro.fomentarLoucura`; as condições `zumbidoNaCabeca` e `confuso` |
| Antes do golpe | o Nilbogismo: o primeiro golpe de cada turno contra o nilbog pede Car 12, e quem falha fica enfeitiçado e passa o turno a louvá-lo; o nilbog não se cura (a Reviravolta da Sorte segue curando, porque não passa pela cura) | `nilbogismo` no começo de `resolveAttack`; `heal` |
| Infestação | as larvas putrefatas: o acerto põe 1d4 larvas, cada uma fere 1d6 perfurante no começo do turno do alvo, e o fogo as mata | o golpe com `infesta`, a condição `infestadoDeLarvas` (`danoNoInicio`), `fogoMataLarvas` em `applyDamage` |
| Ao cair | o Voltar aos Vermes do mago-larva: a 0 PV, um enxame de vermes (o enxame de insetos do jogo) na mesma casa | `voltarAosVermes`, junto do berço do Bigby |
| Golpes numa lista | a Anatomia Pisciana da cria do mar: a mordida, os espinhos venenosos e o tentáculo viram golpes do bloco | o importador lê os itens da ação |

### O que fica de fora, dito
A Fumaça Incendiária só fere quem COMEÇA o turno nela (o livro fere também quem entra). O zumbido dura até o fim do
turno, em vez de valer só para a próxima jogada. O Nilbogismo vale para o golpe, não para a magia que fere. O fogo mata as
larvas a qualquer hora (o livro só até o fim do próximo turno), e quem termina o turno a 0 PV infestado não morre. O
mago-larva não se refaz do enxame (o livro dá 24 horas).

## A décima sexta leva do bestiário (2026-11-16): as ações lendárias que faltavam

Medida antes: **113**. Depois: **106** (mm 12, vgm 25, mtf 34, ftd 15, bgg 13, ai 7). Provas em
`testes-fila-bestiario.mjs` (107 no arquivo, 4 novas). Das treze lendárias na fila, nove entraram, em sete formas novas de
`livro-motor.js escolherLendaria`.

| Forma | Criaturas | O que faz |
|---|---|---|
| `quebrarConcentracao` | o cérebro ancião (Quebrar a Concentração: 1d4 psíquico por círculo da magia) e o dragão cérebro ancião (Estilhaçar a Concentração: só quem ele agarra, 3d12) | a concentração cai sem teste |
| `pulso` | o Pulso Psíquico do cérebro ancião | os inimigos dele a 3 m de uma criatura à vista levam 3d6 psíquico, sem teste |
| `alvo` sem teste | o Cortar o Elo do cérebro ancião | desvantagem em tudo até o fim do próximo turno do alvo (`zumbidoNaCabeca`) |
| `postura` | a Aura Fervente da tartaruga-dragão anciã | até o começo do próximo turno dela, quem começa o turno a 6 m faz Con 24 ou 9d8 fogo (a aura da condição, `auraDaCondicao`) |
| `vulnerar` | a Morte Rastejante do Orcus | quem está no cilindro de 3 m fica vulnerável a necrótico até o fim do próximo turno dele (`morteRastejante`) |
| `invocar` | os Mortos-Vivos do senhor das caveiras | até cinco esqueletos, e nunca mais de cinco de uma vez |
| `alimentar` | o Alimentar do mago-larva | quem a Praga de Vermes dele pegou leva 3d8 necrótico, e ele ganha 6 PV temporários |
| `marionete` | o Impor a Vontade da Zuggtmoy | quem ela enfeitiçou gasta a reação num golpe no aliado mais perto |

### O que fica de fora, dito
O elo psíquico do cérebro ancião não existe no jogo: as três lendárias dele miram qualquer criatura à vista a 36 m. A
Morte Rastejante pega quem está no cilindro na hora (não é zona que dura). O senhor das caveiras chama só esqueletos. A
Praga de Vermes do mago-larva entrou como cegueira, então o Alimentar pega quem ela cegou. Na fila: o Vendaval Uivante da
tempestade anciã, o Dance, Meu Boneco do Graz'zt (que só move), o Recolher e o Revitalizar do zaratan e o Um com a
Tempestade do gigante quintessente.

## A décima sétima leva do bestiário (2026-11-16)

Medida antes: **106**. Depois: **100** (mm 12, vgm 24, mtf 31, ftd 15, bgg 12, ai 6). Provas em
`testes-fila-bestiario.mjs` (111 no arquivo, 4 novas).

| Família | Criaturas | Onde |
|---|---|---|
| Fio que prende e puxa | o pescador das cavernas: o Filamento Adesivo (com a ação, a até 18 m, Des 13 ou preso; a Destreza é nossa, o livro diz só que gruda em quem encosta) e o Filamento (o preso faz For 13 ou é puxado para junto dele e leva a garra com a ação bônus) | o traço vira ação `alvo` com `prende`; `puxarAlvo` com `soAgarrado` |
| A carapaça | o zaratan: ferido (um terço da vida), Recolhe-se (resistência a tudo, parado, mais fácil de acertar); dentro, só Revitaliza (5d20) e depois Emerge cuspindo a pedra | as formas lendárias `recolher`, `revitalizar`, `emergir`; a condição `naConchaDoZaratan` |
| A marionete que anda | o Dance, Meu Boneco do Graz'zt: o enfeitiçado por ele anda até ele com a reação | `marionete` com `soMove` |
| Outras | o Pó Ferrão do colosso de poeira (o "dentro dele" vira colado: Con 14, 3d6 e cego), a Praga do oinoloth (ação bônus: quem começa o turno a 9 m faz Con 16 ou 4d6 necrótico e envenenado; quem passa fica imune) e o Absorver Golpe do Splugoth (o golpe de arma de perto que o acerta não entra) | `alvo`; `postura` com `auraNoInicio.imunizaAoPassar`; `reacaoAntesDoDano` |

A varredura dos seis livros não quebrou nenhuma criatura, e as lutas sem fim caíram de oito para sete: a do **Graz'zt**
terminava em 30 rodadas desde a primeira varredura do Mordenkainen, e com o Dance, Meu Boneco ela acaba.

### Achado no caminho
O Filamento do pescador das cavernas já entrava, e errado: a leitura geral o tomava por uma ação que AGARRAVA quem já
estava agarrado, sem puxar nem dar a garra. E o Emergir do zaratan era um Cuspir Rocha a qualquer hora.

### O que fica de fora, dito
A Praga do oinoloth anda com ele (o livro a deixa no chão por 24 horas) e não corta a cura. O fio do pescador não é objeto
que se corta. A arma presa no Splugoth não fica presa. Na fila, das lendárias, só o Vendaval Uivante da tempestade anciã e
o Um com a Tempestade do gigante quintessente (que só vale no covil).

## A décima oitava leva do bestiário (2026-11-16)

Medida antes: **100**. Depois: **95** (mm 12, vgm 23, mtf 28, ftd 15, bgg 11, ai 6). Provas em
`testes-fila-bestiario.mjs` (116 no arquivo, 5 novas).

| Família | Criaturas | Onde |
|---|---|---|
| As invenções | a Invenção de Arma do kobold inventor, cada opção uma vez por dia: os golpes (o frasco de ácido, o fogo de alquimista, o escorpião no bastão) e os bichos soltos (as centopeias, as larvas putrefatas, as vespas) | ação especial `golpeEspecial` (o golpe dentro da ação, que gasta a ação) e `invocar` |
| Teleporte barrado | a Tranca Dimensional do canoloth: ninguém se teleporta de nem para a até 18 m dele, e a tentativa se perde | `livro-motor.js trancaDimensional`, no teleporte da ação especial, no da lendária e no da magia (`teleportarPelaMagia`) |
| A sombra | as Sombras Demoníacas do nabassu: a 3 m dele só há penumbra, e só a luz mágica acende | `luz.js`: `fontes.sombras`, lidas por `nivelDeLuz` e `comoVe` |
| O choque | a Forma de Relâmpago do colosso relâmpago: quem o acerta de perto leva 2d6 elétrico | `corpoQuente` |
| A duplicata | a Duplicata Espectral do berbalang (ação bônus): surge ao lado de um inimigo a até 18 m, com o golpe psíquico, e o corpo fica inconsciente; cai ela, o corpo acorda; cai o corpo, ela some | ação especial `duplicata`, `fimDaDuplicata` na morte |

### Achado no caminho
A primeira leitura da Forma de Relâmpago casava também a Forma de Fogo do elemental do fogo do MM, e tirava dele a Forma
Fluida. Hoje a leitura é só pelo nome do traço; gerados os seis livros antes e depois, só os da leva mudaram.

### O que fica de fora, dito
O colosso relâmpago não entra no espaço de quem é hostil. O fogo de alquimista fere uma vez, sem deixar queimando, e o
escorpião no bastão fere 1d8 de veneno sem o teste de Constituição. O limo verde e o gambá ficam de fora.

## A décima nona leva do bestiário (2026-11-16)

Medida antes: **95**. Depois: **90** (mm 12, vgm 20, mtf 26, ftd 15, bgg 11, ai 6). Provas em
`testes-fila-bestiario.mjs` (120 no arquivo, 4 novas).

| Família | Criaturas | Onde |
|---|---|---|
| O turno sorteado | a Boca da Loucura do gigante de Grolantor: anda até a criatura mais perto, de qualquer lado, e o d10 do começo do turno diz o que faz (três socos ao acaso, um soco em cada um ao alcance, a mordida, ou mordida e dois socos; sem ninguém ao alcance, a fúria, o soco em si mesmo ou o olhar vidrado) | `livro-motor.js turnoDaLoucura`, antes da IA de sempre; a condição `furiaDaBoca` |
| Os tentáculos | o caracol-mangual: cinco tentáculos, um morre a cada turno em que ele leva 10 de dano ou mais, o multiataque é um golpe por tentáculo, e sem nenhum ele se recolhe na concha e deixa de segurar a luta | `tentaculosMangual` em `applyDamage`; a condição `caracolRecolhido` |
| A carga com o escudo | a Investida de Escudo do couraçado gigante do fogo: 9 m pelo espaço de quem é menor que Enorme, o golpe do escudo em cada um; quem é acertado e falha a For 21 vai empurrado à frente, e falhando por 5 cai e leva 3d6+8 (6d6+8 se já estava caído) | `atropelar` com `golpe` e `empurra`, `investidaDeEscudo` |
| Os esporos | os Esporos do Controle Mental da Zuggtmoy: humanoides e feras a 6 m, Sab 19 ou enfeitiçados | `area` com `soTipos` |
| O vendaval | o Vendaval Uivante da tempestade anciã (lendária, 3 ações): a linha de 6 m de largura que cruza o tabuleiro, Des 21 ou 4d10 trovejante e arremessado 18 m | `linha` com `arremessaFt` em `lendariaDeArea` |

### O que fica de fora, dito
A nuvem dos esporos da Zuggtmoy não fica no chão (só pega quem está nela quando surge). O caracol recolhido não morre nos
5d6 minutos do livro, que estão fora da luta. A Boca da Loucura também persegue "o que lhe parece comida", e aqui só
criatura.

## A vigésima leva do bestiário (2026-11-16)

Medida antes: **90**. Depois: **84** (mm 12, vgm 17, mtf 25, ftd 13, bgg 11, ai 6). Provas em
`testes-fila-bestiario.mjs` (123 no arquivo, 3 novas).

| Família | Criaturas | Onde |
|---|---|---|
| O dado guardado | o Presságio do adivinho: dois d20 rolados na primeira resistência da luta; ele troca a jogada de quem vê — a do inimigo que passaria por uma que falha, a do aliado que falharia por uma que passa, sempre a menor que serve | `livro-motor.js pressagioNaResistencia`, em `resistencia` |
| A metamagia | os Pontos de Feitiçaria do feiticeiro escamado kobold: a Magia Elevada (3 pontos, os três que ele tem) dá desvantagem na primeira resistência de um alvo contra a magia dele | `magiaElevada`, em `resistencia` |
| A luz que denuncia | o Pó de Escamas do escaravelho do tesouro e do enxame (ação bônus, uma vez por dia): Des 13 ou contornado de luz por dez minutos, e quem brilha não fica invisível | a condição `contornadoDeLuz` (`semInvisivel`, lida em `addCondition`) |
| Só dragão | o Poder da Rainha Dragão do abishai vermelho: um dragão a até 36 m, Car 18 ou enfeitiçado por uma hora | `alvo` com `soTipos` (o filtro do `alvoServe`) |
| Fora do jogo | o Um com a Tempestade do gigante quintessente só vale no covil dele, e o jogo não tem covil | sai da fila sem motor |

### O que fica de fora, dito
O Presságio vale para as resistências, não para os ataques e os testes de atributo. O contornado de luz não acende a casa
em volta. O dragão cromático não faz o teste com desvantagem contra o Poder da Rainha Dragão, e o encanto não acaba quando
o abishai ou um aliado fere o dragão.

## A vigésima primeira leva do bestiário (2026-11-16)

Medida antes: **84**. Depois: **80** (mm 12, vgm 16, mtf 23, ftd 13, bgg 10, ai 6). Provas em
`testes-fila-bestiario.mjs` (126 no arquivo, 3 novas).

| Família | Criaturas | Onde |
|---|---|---|
| Os cadáveres | a flor-cadáver: 1d6+3 corpos dentro (até nove); o Colher os Mortos põe para dentro o humanoide morto a até 3 m; com a ação bônus ela digere um (2d10 PV, quando está ferida) ou ergue outro como zumbi do lado dela | as ações especiais `colherMorto`, `digerir` e `animarCadaver`; `motorDoLivro.cadaveres` |
| Miúdo | o Reduzir do mestre mental duergar: por um minuto, +5 de CA, o golpe de arma fere só 1 (o veneno da lâmina junto) e desvantagem nas resistências de Força | `postura` com a condição `reduzidoDuergar`; o golpe em `resolveAttackBase` |
| A maldição do fim | a Maldição Mortal do fensir devorador: quem está a 9 m quando ele morre de vez faz Car 13 ou fica 24 horas sem descanso que valha (o longo conta 8 horas, o curto 1) | `maldicaoMortal` na morte (e na do troll que não regenera); `descanso.js maldicaoEngoleODescanso` |
| O beijo | o Beijo da vargouille: o humanoide incapacitado a 1,5 m, Car 12 ou amaldiçoado | `alvo` com `soIncapacitado` e `soTipos`; a condição `beijoDaVargouille` |

### Achado no caminho
O `makeMonster` não copia campo solto do bloco: os cadáveres da flor tinham de ir em `motorDoLivro`, como todo o resto da
fila, e a primeira versão nascia com zero corpos.

### O que fica de fora, dito
A maldição da vargouille (o Carisma que cai por hora até a cabeça virar outra vargouille) é de fora da luta e não anda. O
dano psíquico de hora em hora da maldição do fensir também. O mestre mental reduzido não ganha o Esconder de ação bônus.

## A vigésima segunda leva do bestiário (2026-11-16)

Medida antes: **80**. Depois: **73** (mm 12, vgm 12, mtf 23, ftd 13, bgg 7, ai 6). Provas em
`testes-fila-bestiario.mjs` (130 no arquivo, 4 novas).

| Família | Criaturas | Onde |
|---|---|---|
| A alma presa | o Aprisionar a Alma do devorador: o humanoide caído a 0 PV a até 9 m vai para dentro das costelas dele (o engolido do motor); morrendo lá, o devorador cura 25, recarrega o que gastou e cospe o corpo como zumbi | ação especial `aprisionarAlma`, `almaMorreuPresa` em `morrer` |
| A magia devolvida | a Reflexão de Magia do morkoth: a magia de ataque que erra nele vai para outra criatura do lado de quem conjurou (com a reação) | `espelharMagia`, no erro de `ataqueMagico` |
| O tiro na mão | a Reflexão de Magia do colosso rúnico (2 por dia): quem conjura até o 5º círculo a até 36 m leva o tiro de força (+14, 4d12) e, falhando a Int 15, a magia se desfaz | `reflexaoRunica`, em `tentarContramagia` |
| O chão | os Espinhos de Pedra do berço do rebento de pedra (ação bônus): um quadrado de 6 m a até 27 m vira terreno difícil que fere 3d6 perfurante a cada 1,5 m andado | ação especial `espinhosDoChao`, a zona do Crescer Espinhos (`criarZona`) |
| O passo | o Movimento Dúplice do firbolg andarilho (ação bônus, uma vez por dia): o teleporte de 9 m (a troca com a ilusão) | `teleporte` |
| Texto | o Elo Psíquico e o Sentir Pensamentos do cérebro ancião: o elo não muda nada no tabuleiro e o sentir é conversa | `SABOR` |

### O que fica de fora, dito
A Reflexão do morkoth não devolve a magia de resistência, só a de ataque. Quem está com a alma presa não testa a morte com
desvantagem. Os espinhos de pedra duram até o FIM do próximo turno do berço (a zona conta no fim do turno do lado de quem
a fez), e não até o começo. A ilusão do firbolg não fica no tabuleiro.

## A vigésima terceira leva do bestiário (2026-11-16)

Medida antes: **73**. Depois: **69** (mm 12, vgm 12, mtf 22, ftd 13, bgg 7, ai 3). Provas em
`testes-fila-bestiario.mjs` (132 no arquivo, 2 novas).

| Família | Criaturas | Onde |
|---|---|---|
| O desafio | o Desafio do Campeão do Donaar Blit'zen (ação bônus, uma vez): quem ele escolhe a 9 m faz Sab 13, ou não se afasta por vontade própria a mais de 9 m dele; acaba se ele cai | área com `escolhe` e a condição `desafioDoCampeao`; `desafioSegura` no passo de `moveAlong` |
| A fera | a Forma Selvagem da Walnut Dankgrass (ação bônus): vira lobo atroz, com os números da fera | ação especial `formaSelvagem`, o `vestirFera` do druida |
| A doença | os Esporos de Infestação da Zuggtmoy: quem é de carne a 6 m faz Con 19 ou contrai os esporos; a cada descanso longo, Con 19 de novo, e na terceira falha morre | área com a condição `esporosDeZuggtmoy`; `doencas.js avancarDoencas` |
| Texto | a Conjuração Menor do Jim Darkmagic (um objeto pequeno que brilha, fora da luta) | `SABOR` |

### Achado no caminho
O Desafio do Campeão estava fora DE PROPÓSITO da leitura dos traços de ação bônus (a frase cita "incapacitado" sobre o
próprio Donaar, e a leitura geral o tomaria pela condição de quem falha). Agora ele tem leitura própria, e a exceção saiu.

### O que fica de fora, dito
A loucura que vem com os esporos da Zuggtmoy não entra (o livro sorteia numa tabela própria), e a nuvem não fica. A Walnut
em forma de lobo não gasta espaço de magia para se curar.

## A vigésima quarta leva do bestiário (2026-11-16)

Medida antes: **69**. Depois: **57** (mm 12, vgm 12, mtf 18, ftd 5, bgg 7, ai 3). Provas em
`testes-fila-bestiario.mjs` (134 no arquivo, 2 novas).

| Família | Criaturas | Onde |
|---|---|---|
| Mirar o preso | o Motor da Dor do duergar martelador e do gritador: o herói liga o interruptor **Mirar o duergar preso** (na barra, ao lado do Desviar os olhos, só com uma máquina no campo); o primeiro golpe do turno nela vem com desvantagem, e o acerto fere o dado a mais (1d10 ou 2d10) e faz a máquina responder com o multiataque, na reação, em quem a feriu | `miraNoPreso` e `depoisDoGolpeNoPreso` em `resolveAttack`; `useFeature('mirarPreso')`; `hud.js tileDoMotorDaDor` |
| O corpo emprestado | o Possuir um Cadáver do dybbuk: o corpo de fera ou humanoide (até Grande) a 1,5 m vira o corpo dele, com os números dele (o caminho da Forma Selvagem: os PV do corpo são os que ele perde primeiro, e perdidos, ele sai) | ação especial `possuirCadaver`, o `vestirFera` |
| Fora do jogo | a Reconstrução do dragão oco (dias depois de cair), a Animação Sagrada do eidolon (pede a estátua sagrada no mapa) e o Habitar um Objeto do fragmento dracônico | `SABOR` |
| Blocos de invocação | o draco companheiro (o do Guardião do Draco é o bloco feito à mão) e o espírito dracônico (só viria de uma magia que o jogo não tem): os números saem de quem invoca, e a fila não os cobra | `BLOCOS_DE_INVOCACAO` no importador |

### O que fica de fora, dito
O dybbuk de corpo emprestado não vira morto-vivo nem guarda as imunidades dele. O interruptor do Motor da Dor é do jogador:
o grupo simulado não o liga. A barra nova não foi conferida no navegador nesta leva (só com uma máquina no campo ela aparece).

## A vigésima quinta leva do bestiário (2026-11-16): as magias que não cabem num turno

Medida antes: **57**. Depois: **33** (mm 3, vgm 8, mtf 8, ftd 5, bgg 6, ai 3), sem mudar uma linha dos blocos. Prova em
`testes-fila-bestiario.mjs` (135 no arquivo, 1 nova).

Das 57, 51 eram listas de magia que o monstro conhece e o jogo não tem. Medido no dado de magias do 5etools
(`_referencias/5etools/spells/`), **dezenove levam um minuto ou mais para conjurar** — Controlar o Clima, Sonho, Conjurar
Elemental, Conjurar Fada, Criação, Terreno Alucinatório, Miragem Arcana, Símbolo, Círculo de Teletransporte, Aprisionamento,
Criar Mortos-Vivos e as duas do Acquisitions Inc. —, e a regra das magias dos livros já as deixa fora do jogo pelo mesmo
motivo: não cabem num turno de luta. O monstro que as conhece não as conjuraria numa luta, então elas não são trabalho do
motor de luta: o importador lê o tempo de conjuração (`conjuracaoLonga`) e as deixa fora da fila, dizendo quais no fim.

O que sobra na fila de magias são as de UMA AÇÃO que o jogo ainda não faz (Controlar a Água, Moldar Rochas, Criar Passagem,
Mover a Terra, Forma Etérea, Projetar Imagem, Portal Arcano, Tranca Arcana, Caminhar em Árvores, Ilusão Programada e as do
Acquisitions Inc.): elas estão na fila das magias do Livro do Jogador (`magias/phb-pendente.json`) e chegam ao monstro quando
entrarem no jogo. As mecânicas que sobram são seis: o Óleo do boggle, a Onda de Maré do leviatã, o Mimetismo de Magia do
gargantua, a Tempestade Vingativa do rebento de Stronmaus, a Magia Ecoada da Pendragon e o que resta do Fizban.

## A vigésima sexta leva do bestiário (2026-11-16): a fila de mecânicas chega a zero

Medida antes: **33**. Depois: **28** (mm 3, vgm 7, mtf 7, ftd 5, bgg 4, ai 2), e **nenhuma mecânica**: as 28 que sobram são
listas de magia de uma ação que o jogo ainda não tem (a fila das magias do PHB). Provas em `testes-fila-bestiario.mjs`
(139 no arquivo, 4 novas).

| Família | Criaturas | Onde |
|---|---|---|
| A magia de novo | a Magia Ecoada da Pendragon Beestinger (ação bônus, uma vez por dia): a magia do turno passado, de novo, no mesmo alvo (ou no inimigo mais perto), com o espaço de sempre | ação especial `magiaEcoada`; `lembrarMagia` no fim de `castSpell` |
| A magia copiada | o Mimetismo de Magia do gargantua (reação, uma vez por dia): depois da magia de até o 5º círculo de um inimigo que ele vê, Car 19 de quem conjurou; falhando, ele conjura a mesma magia no mesmo círculo, com a CD 19, em quem a conjurou (a conjuração emprestada só por esse lance) | `mimetismoDeMagia` no fim de `castSpell`, `conjurarDeReacao` |
| A nuvem | a Tempestade Vingativa do rebento de Stronmaus (ação bônus, recarga): a nuvem a até 36 m e, a cada ação bônus por um minuto, um dos três efeitos num raio de 9 m, nunca o mesmo duas vezes seguidas — a chuva ácida (Con 25 ou 4d12 por turno, um minuto), o temporal gelado (Des 25 ou 8d6 frio e deslocamento 0) e os relâmpagos (Des 25 ou 4d8 elétrico e atordoado) | `tempestadeVingativa`; as condições `cobertoDeAcido` e `presoNoGelo` |
| A onda | a Onda de Maré do leviatã: a muralha de água de 15 m de espessura em volta dele, For 24 ou 6d10 e arremessado 15 m (metade no sucesso) | área com `arremessaFt` |
| O óleo | o Óleo do boggle: vantagem na Acrobacia e no Atletismo (escapar e segurar) | `testeDeAtributo` |

### O que fica de fora, dito
A muralha do leviatã não anda nas rodadas seguintes, e ele não precisa estar submerso. A nuvem do rebento não fica no
mapa (não esconde nada) e não anda. O óleo do boggle não escolhe entre escorregadio e grudento: vale dos dois jeitos, e a
poça de óleo é a ação de sempre.

### O que a fila do bestiário é agora
28 listas de magia de UMA AÇÃO que nenhum herói conjura ainda (Controlar a Água, Moldar Rochas, Criar Passagem, Mover a
Terra, Forma Etérea, Projetar Imagem, Portal Arcano, Tranca Arcana, Caminhar em Árvores, Ilusão Programada e as do
Acquisitions Inc.). Elas estão na fila das magias do Livro do Jogador (`magias/phb-pendente.json`); quando entrarem no
jogo, o importador as dá aos monstros sozinho. Das 326 da primeira medida, a fila do bestiário não cobra mais mecânica
nenhuma.

## As lutas sem fim da varredura (2026-11-16)

A varredura dos seis livros tinha SETE lutas que não acabavam em 30 rodadas desde que os bestiários entraram (o rakshasa do
MM; o espinhento, o vegepigmeu e o chefe vegepigmeu do Volo; o marut, o recuperador e o titivilus do Mordenkainen; o Graz'zt
já tinha saído na décima sétima leva). Diagnosticadas uma a uma, rodando a luta e lendo o fim dela:

| Luta | Causa | O que se fez |
|---|---|---|
| marut | três leituras erradas do importador: a **Pancada Infalível** (que acerta sempre) entrava como golpe de +0 para acertar; o **Édito Flamejante** (45 radiante FIXO) entrava sem dano; e o **Justificar** (leva o alvo e o próprio marut a Sigil, uma vez por descanso) entrava como uma ação que incapacitava, usada TODO turno | `golpe` lê "automatic hit" (`acertaSempre`, que força o acerto em `resolveAttackBase`); o Édito lê o dano fixo (`danoSemTeste`); o Justificar vira texto (a luta sairia do tabuleiro) |
| titivilus | defeito da IA: as Palavras Distorcidas enfeitiçavam de novo QUEM JÁ ESTAVA enfeitiçado, e ele gastava a ação nisso em vez de lutar; e o mago simulado insistia no Raio de Fogo contra quem é imune a fogo | `alvoServe` não deixa mirar com a ação que só põe uma condição quem já a tem; o grupo simulado (`balance.js`) pula a magia cujo tipo o alvo não sente |
| espinhento, vegepigmeu, chefe vegepigmeu | o bloco está certo: a Regeneração só para com fogo, frio ou necrótico. O defeito era do GRUPO SIMULADO: caído a 0 PV, o bicho deixava de ser "inimigo de pé", e o mago e o clérigo encerravam o turno antes de usar o Raio de Fogo que o mataria | `balance.js playCharacter`: antes de tudo, quem tem uma magia do tipo que corta a regeneração a usa na criatura caída que regenera |
| rakshasa, recuperador | NÃO é defeito: os dois são imunes a arma não mágica (e o rakshasa a magia até o 6º círculo), e o grupo da varredura não leva arma mágica nenhuma. É o bloco do livro contra um grupo que o livro não mandaria | a varredura diz o motivo na linha (`imune a arma não mágica, e o grupo da varredura não leva nenhuma`) |

Depois: **2 lutas sem fim, as duas explicadas**, contra 7. A emboscada do capítulo 1 (`simular-emboscada.mjs`) segue em
85,87% de vida restante: o grupo simulado só mudou onde ele antes não fazia nada. Provas em `testes-fila-bestiario.mjs`
(141 no arquivo, 2 novas: o marut e a condição repetida).

## As magias de uma ação (2026-11-16)

Medida antes: **28**. Depois: **6** (mm 1, vgm 3, mtf 1, ai 1). Prova em `testes-fila-bestiario.mjs` (142 no arquivo, 1 nova).

As 28 eram as magias de UMA AÇÃO que os monstros conhecem e o jogo não tem. A regra do dono já estava escrita
(`rules/utilidade-livros.js`, o cabeçalho): a magia que mudaria o mundo de um jeito que o tabuleiro ainda não guarda —
moldar a rocha, mover a terra, a água e o clima, criar objetos, as ilusões, o sonho — fica fora do jogo até haver o que ela
mude. O que se fez foi seguir essa regra nas duas filas:

- `importar-magias.mjs` passa a dizer o motivo certo (`SO_SE_NARRARIAM`): Moldar Rochas, Mover a Terra, Controlar a Água,
  Controlar o Clima, Criação, Terreno Alucinatório, Miragem Arcana, Projetar Imagem, Ilusão Programada e Sonho saem como "só
  se narraria" em `magias/phb-pendente.json`, e não mais como "o motor ainda não faz". Nenhuma magia do jogo mudou.
- `importar-bestiario.mjs` lê esse motivo (`soSeNarraria`) e não cobra do monstro a magia que o jogo deixa fora de propósito,
  como já não cobrava a de 1 minuto ou mais; as de conversa do Acquisitions Inc. (Amigos Rápidos, o Dom da Lábia) também.
- A FORMA ETÉREA do monstro (a Zuggtmoy, a nagpa, o dragão de esmeralda ancião) vira a fuga para o plano etéreo que o motor já
  tinha (`etereo`, `fugirParaOEtereo`): ferido, ele some da luta. O Míssil Mágico do Jim Darkmagic é o Míssil Mágico de
  sempre (no livro cada dardo faz a jogada de ataque).

### O que sobra na fila do bestiário (6)
Magias que o jogo ainda não faz e que TERIAM onde agir no tabuleiro: o Criar Passagem do dao (abrir a parede), a Tranca
Arcana do abjurador (a porta trancada), o Caminhar em Árvores do arquidruida, o Portal Arcano do bruxo do Grande Antigo e do
tecelão sombrio (o teleporte entre dois pontos, que a região já faz), e a Moeda Brilhante e o Incitar Ganância do Jim
Darkmagic (o Acquisitions Inc. não teve as magias importadas). São trabalho das magias, não do bestiário.

## As seis magias (2026-11-16)

Medida antes: **6**. Depois: **0** nos seis bestiários (mm, vgm, mtf, ftd, bgg, ai). **A fila do bestiário zerou**: nenhuma
mecânica e nenhuma magia que um monstro conheça e o jogo não tenha, fora as que o jogo deixa fora de propósito (1 minuto
ou mais de conjuração, ou só se narrariam). Provas em `testes-fila-bestiario.mjs` (149 no arquivo, 7 novas).

As quatro do Livro do Jogador entraram pela tabela à mão (`magias/ajustes-phb.mjs`) e as duas do Acquisitions
Incorporated pelo primeiro arquivo do livro (`magias/ajustes-ai.mjs`, `magias/ai-pt.json`, escrito à mão e sem a API:
são sete magias). O efeito de cada uma mora em `livro-motor.js` (`EFEITOS`), e a casa mirada se confere no `canCast` por
`casaDoLivro`, antes de gastar nada.

| Magia | O que faz no tabuleiro | O que fica de fora |
|---|---|---|
| Criar Passagem (dao) | a direção é a de quem conjura até a parede mirada; a aresta de parede vira passagem aberta (`ARESTA.aberta`, que o traço da FA respeita, então a vista passa também) e a rocha atrás dela vira chão, até 6 m de pedra (`passagemDaMagia`). Só a casa de PAREDE: o móvel, o pedregulho, a árvore e a tenda não abrem | a passagem fica pela cena (uma hora passa de qualquer luta), e por isso ninguém é expulso dela |
| Tranca Arcana (abjurador) | a porta fechada que se toca vai para `field.trancas` com a CD 10 acima (a sem fechadura não se abre com ferramenta, e arrombá-la é Força 25); o lado de quem conjurou abre normalmente pelo menu da porta (`portas.js`), e a chave não a destranca. Explorando, o menu da porta oferece "Trancar com a Tranca Arcana" a quem a tem pronta | a senha, e o Arrombar, que o jogo não tem |
| Portal Arcano (bruxo do Grande Antigo, tecelão sombrio) | duas REGIÕES de teleporte (`rules/regioes.js`) ligadas, uma na casa livre mais perto de quem conjura e a outra na casa mirada; cada anel acende uma penumbra de 3 m (`luz.js`), que é o que o tabuleiro desenha. A concentração que cai fecha os dois | cada anel é uma casa, os dois lados funcionam e a névoa não tapa a vista |
| Caminhar em Árvores (arquidruida) | a condição dá a ação `atravessarArvore` (`magias-concedidas.js`, de graça): encostado numa árvore do mapa (o glifo `T`), 3 m de deslocamento e se sai ao lado de outra a até 150 m, uma vez por rodada | a espécie e o tamanho da árvore |
| Moeda Brilhante de Jim | a moeda acende como a Luz onde cai, por um minuto (`enc.luzesDeMagia`), e cada inimigo a 9 m dela que quem conjura vê faz Sabedoria ou fica distraído: desvantagem em Percepção (o teste e a passiva 5 abaixo) | a iniciativa aqui é do lado, então ela só sai com desvantagem quando o lado inteiro está distraído |
| Incitar Cobiça (Jim) | cada inimigo a 9 m que vê quem conjura faz Sabedoria ou fica enfeitiçado pela gema (`cobicaIncitada`, conta como encanto para a imunidade): não age nem reage, a IA só o leva até a gema (`turnoDaCobica`) e encostado ele fica olhando; repete no fim do turno, e o mal do lado de quem conjurou quebra. O conjurador geral da IA a usa com dois ou mais ao alcance | o herói enfeitiçado não anda (o motor não deixa o incapacitado andar), quando o livro o deixaria ir até a gema |

As outras cinco do Acquisitions Inc. ficam na fila das magias (`magias/ai-pendente.json`): o Distorcer Valor e o Discurso
Motivacional levam um minuto, o Amigos Rápidos e o Dom da Palavra só se narrariam (e o bestiário passou a ler esse motivo
de lá, em vez da lista à mão), e o Míssil Mágico do Jim é o de sempre para o monstro.

O som: as quatro de tabuleiro do PHB tocam o timbre de UTILIDADE da escola delas (`familiaSonora: 'utilidade'`); sem
isso caíam no da maldição, e três notas dele passavam a ter sete magias, acima do teto de seis que `testes-regras.mjs`
cobra. E o reimport do PHB sorteia de novo a nota das magias antigas (a menos usada muda quando entram novas): as que
mudaram voltaram à nota de antes, e só as novas ganharam nota.
