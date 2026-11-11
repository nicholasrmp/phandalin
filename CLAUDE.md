# CLAUDE.md — Phandalin

RPG tático cooperativo no navegador, regras do **SRD 5.1**, grade isométrica de
1,5 m. O que o jogo é e o que já funciona está no [README.md](README.md); este
arquivo é só o **elenco de revisores e skills** que o projeto usa para julgar o
próprio trabalho.

**O LIMITE DO SRD CAIU em 2026-11-08.** O motor continua sendo o do SRD 5.1, mas o CONTEÚDO não se limita mais a
ele: blocos de monstro, encontros, lugares, NPCs e enredo de *Phandelver and Below: The Shattered Obelisk*
entram inteiros como dado e mecânica. A PROSA do livro (texto lido em voz alta, descrições, falas) continua não
entrando — escreve-se com as nossas palavras, e o `conferir-colagem.py` mede. O de-para do Obelisco contra a
nossa Mina, medido, está em `revisoes/obelisco-de-para-2026-11-08.md`. **Atenção a quem revisa:** os
sub-revisores de regras e de monstros medem "contra o SRD", e um bloco do Obelisco que não está no SRD não é
achado por isso — a referência dele é o livro.

**OS CAPÍTULOS 1 A 4 SÃO OS DO OBELISCO** — por ordem do dono, "qualquer mudança que o Obelisco proponha". Entraram oito
blocos (cobra venenosa gigante, serpente constritora gigante, polvo gigante, zumbi ogro, grell, fungo violeta, quasit,
chefe goblin arqueiro), as salas que o Obelisco mexeu (a cobra no ressalto do esconderijo, o Zeond no lugar do rato da
Mansão, os arqueiros e o grell do castelo, a guarita, os fungos, a serpente e o polvo da Onda Eco, as cinco contas da
Árvore-Trovão) e o fio dos **goblins de fora** em cinco lugares, que vai para o diário com a abertura "Goblins de fora:".
O de-para sala a sala está em `revisoes/obelisco-de-para-2026-11-08.md`, seção 2.2 — e a primeira versão dele estava
errada, porque comparava por CAPÍTULO e não via criatura trocando de sala: **de-para se faz sala a sala**. O que o motor
ganhou: `multiattack.countDados`, `onHit` em lista, `onHit.danoSeFalhar`, o traço `resistenciaAMagia`, a IA de quem fica
invisível (`ai.js turnoInvisivel`) e de quem escolhe o alvo (`monster.alvoPreferido`), e `naoSeguraALuta`
(`combat.js checkEnd`): quem luta do lado inimigo sem SER a luta — o Zeond invisível, que ninguém consegue mirar e que
seguraria a luta aberta para sempre. **A segunda passada (seção 6.3 do de-para) leu o livro inteiro dos capítulos 1 a 4**,
não só as criaturas, e achou muito mais do que a primeira: o elenco da Mansão (seis esqueletos, três Rufiões nas jaulas,
quatro bugbears, bandidos no alojamento e na sala de estar, o Cajavidro sozinho), os blocos do Obelisco para o Rufião
Marcarrubra, o Cajavidro e o Nezznar, o Cume com bugbears e o Brughor de 18 PV, o templo sem aranhas, os NPCs que mudaram
(Elmina Barthen, Daran drow, Reidoth mulher, Nosk, Greska), boatos, tesouros de vinte e tantas salas e regras de sala (a
laje do H4 por Acrobacia, o teto baixo da Onda Eco, a estátua do templo, o polvo que puxa para a água). As trocas que
pesam foram aplicadas mesmo medidas como mais duras: no covil, 26% de derrota no 2º nível contra 1% do covil de antes; o
lobo atroz do Grol, 15% no 3º nível contra 1%. **Lição: de-para por criatura não basta; lê-se o livro inteiro, sala a
sala, tesouro e NPC incluídos.** A terceira passada (seção 6.5) fechou o que a segunda deixara de fora: os goblins
DORMINDO na torre do sudoeste do Castelo e o banquete que a luta ali chama, os três quartos de cobertura do mato do
posto dos vigias (`mapa.espinheiroCobre`, só no esconderijo) e as magias **por dia e à vontade de monstro**
(`spellcasting.porDia` / `aVontade`, que `monsters.js usosDoBloco` transforma nos usos livres do herói — nenhuma sai
de espaço, e a IA pergunta por `ai.js temUso`). A quarta passada (6.6) fez a **Agatha lutar**, como o Obelisco manda
quando a Persuasão falha ou a Visagem não espanta: a banshee do SRD com Visagem e Lamento no motor, num tabuleiro
novo (`covilAgatha`, `capitulo4-agatha.js`) que devolve o grupo à região; e a Teia do Nezznar com a CD 15 dela
(`spellcasting.cdPorMagia`). A quinta (6.7) pôs o **fôlego do SRD** debaixo d'água (`conditions.js gastarFolego`; a
Respirar na Água passou a valer) e o **motivo por antecedente** no herói criado (`criador.js MOTIVO_DO_ANTECEDENTE`). O
que sobra do Obelisco é a outra metade da campanha — capítulos 5 a 8, Reino Distante e transformações. **Os capítulos
5 a 8 começaram** (2026-11-08): o plano medido está em `revisoes/obelisco-5a8-plano-2026-11-08.md` (a Forgotten
Adventures tem os mapas de quase todos os lugares, e a arte está no disco; os níveis sobem por marco, como no livro), e
o de-para sala a sala de cada capítulo em `_referencias/obelisco58/` (fora do repositório). Já entraram os goblins
psíquicos e o que eles pediram ao motor (explosão ao morrer, Lâmina Psíquica, Escudo Psiônico, Rasgo Sináptico,
Empurrão Telecinético), o resto das criaturas do capítulo 5 (ashenwights, otyughs, a broca, o guardião-escudo, o
Ruxithid) e a metade da vila do capítulo 5 (`game/obelisco5-vila.js`: o contrato do Harbin, as quatro cenas de crime,
as pistas, a Gwyn e o marco do 6º nível, `darMarco`) com as três lutas dela sobre mapas da FA (`game/obelisco5-lutas.js`;
os mapas saem de `src/dev/mapa-cap5-vila-fa.py`; depois da vitória o mapa vira exploração, com saída, e o que a arte desenha se olha — `mapa.interativos` com `olhar: true` mostra o texto de graça E o teste, e nem todo objeto dá prêmio: o ponto é o lugar parecer habitado). Depois, o **Repouso de Zorzula** (o posto, `game/zorzula-posto.js`) e o **Santuário Índigo** (`game/zorzula-santuario.js`), sobre os battlemaps grátis da FA ("Zorzula's Rest", em `mapas/Zorzulas_Rest/`): a PLANTA vem da cena do Foundry e cai 1 para 1 na arte; os móveis, a água da fonte e a lava (a casa de azul vivo, medida pela cor) vêm da ARTE; o glifo novo de lava é `(` (`src/dev/mapa-zorzula.py`), com o refeitório que bate para derrubar — o golpe não letal passou a valer contra herói — e a derrota que leva o grupo preso ao Santuário, o marco do 7º e o pagamento do Harbin na volta (`testes-zorzula.mjs`). E as MINAS (Z12 a Z19, `game/zorzula-minas.js`), lidas da arte da FA porque a cena do Foundry não separa lava, chão e passarela: a surpresa dos gricks por herói (`enc.dormindo`), as espirais de cristal que revidam e dão lascas, a fechadura psíquica que só o dano psíquico abre, a maldição de Ilsensine (vulnerável a psíquico), e o elevador, a esteira e a plataforma ligando as três cenas. E a VILA DO CAPÍTULO 6 (`game/obelisco6-vila.js`, `game/obelisco6-lugares.js`, mapas de `src/dev/mapa-cap6-vila-fa.py`): a Gwyn, a vaca que vomita as gosmas no largo, o Pip e as gêmulas da casa de Marthungrim, e os mineiros da Mina Hardyhammer, com a renda do veio de prata na Bolsa (`testes-obelisco6.mjs`). O livro deixa o monte de fora da câmara dos mineiros, e a regra de espremer do SRD o deixava entrar: a cena marca a criatura com `naoEspreme` (`combat.js cabeApertado`). E TALHUNDERETH (`game/talhundereth.js`, mapa de `src/dev/mapa-talhundereth.py`, criaturas em `rules/monsters/talhundereth.js`): as 21 salas do livro sobre a cena da FA, o olhar da medusa com o interruptor **Desviar os olhos**, a carga do galeb (a `investida`, que o perfil do golpe não copiava — a broca do capítulo 5 nunca embalava), a cacofonia, o aglomerado que engole e cospe gêmulas, as três fechaduras do cofre, o disco da cripta e o fragmento que os fanáticos levam se o grupo o deixar (`testes-talhundereth.mjs`). E a CRIPTA DOS TALHUND (`game/cripta-talhund.js`, mapa de `src/dev/mapa-cripta-talhund.py`, criaturas em `rules/monsters/cripta.js`), debaixo do templo: as cinco assombrações e a PAZ que as apaga (é ela, e não a purificação, que tranca as salas e impede o revenant destruído de se refazer), as duas alavancas que giram o santuário, a hidra das cabeças, a posse do fantasma, o golem e os espectros do fragmento (`testes-cripta.mjs`). Ela achou um defeito antigo: **o golpe corpo a corpo de monstro parava em 5 pés** no perfil, e a mordida de 10 pés do dragão nunca alcançou a segunda casa. Os revenants de P1 e P15 são o muro da cripta, medido (0% a 3% de vitória no 8º e 9º níveis): é o bloco do livro, e P1 se contorna. **O BESTIÁRIO QUE ERA SÓ TEXTO** (`testes-bestiario.mjs`): dos 130 traços dos blocos, 71 não eram lidos pelo nome em lugar nenhum; os que eram só promessa entraram no motor (incorpóreo, escavar, investida em linha reta, Implacável, Aparar, luz do sol, visão às cegas, Criar Espectro, o Furor, a magia no turno do conjurador do SRD, a psiônica do comandante goblin...), e dois defeitos antigos saíram junto: o Grande que se espremia para fora da cerca e o ataque de oportunidade contra quem não se vê. O que fica de fora, e por quê, está em `revisoes/obelisco-5a8-plano-2026-11-08.md`. **OS LIVROS DE D&D ENTRAM COMO DADO** (2026-11-09, pedido do dono: PHB, MM, DMG, VGM, XGE, MTF, TCE, FTD, AI, BGG, SCAG; a ordem é o bestiário do MM, depois o PHB, XGE/TCE, os outros bestiários, DMG e lore). O caminho do bestiário: o dado do livro vem do espelho do 5etools no GitHub para `_referencias/5etools/` (fora do repositório); `src/dev/traduzir-bestiario.mjs <livro>` escreve o texto em pt-br pela API de LOTES (nome oficial brasileiro, apresentação, a regra de cada traço e ação e a lore, com as NOSSAS palavras — nunca a prosa do livro) em `src/dev/bestiario/<livro>-pt.json`, medido a US$ 0,0153 por criatura; `src/dev/importar-bestiario.mjs <livro>` tira os NÚMEROS do dado (golpes, multiataque, sopro, conjuração pelas magias que temos, `bestiario/magias-en.json`) e escreve `src/rules/monsters/livro-<livro>.js`, que entra em `MONSTERS` antes dos blocos feitos à mão (o feito à mão vence); o que o jogo já tem fica em `bestiario/ja-temos.json`; e `python src/dev/baixar-fichas.py --go` baixa os tokens que o importador listou (`bestiario/fichas-<livro>.json`), depois do que o importador roda de novo para o jogo enxergá-los (`art/fichas-dos-livros.js`). O que o motor ainda não faz — ações lendárias, a Presença Aterradora, olhares, auras, magias que faltam — vai para `bestiario/<livro>-pendente.json`, a fila do trabalho de motor. O motor que os blocos dos livros pedem e nenhum bloco feito à mão pedia mora em `rules/livro-motor.js` (engolir e engolfar, os raios oculares e os cones do observador, as condições que sorteiam o turno, as catorze formas de ação lendária, a corrosão de arma e armadura): no MM a fila chegou a zero. As MAGIAS dos livros seguem o mesmo caminho: `src/dev/traduzir-magias.mjs <livro>` escreve `src/dev/magias/<livro>-pt.json` (US$ 0,0059 por magia) e `src/dev/importar-magias.mjs <livro>` escreve `src/rules/magias-livro-<livro>.js`, que entra em `SPELLS` antes das feitas à mão. A mecânica de cada uma é a da tabela escrita à mão em `src/dev/magias/ajustes-<livro>.mjs`, conferida contra o livro: a leitura automática do dado errava justo nas magias que importam, e só serve de rascunho. A que não está na tabela não entra no jogo, e a fila é `magias/<livro>-pendente.json`. A nota de som de cada magia nova é a menos usada do timbre dela (`tom`, `importar-magias.mjs notasDasMagias`). A magia que nenhum tipo antigo conjurava é `kind: 'livro'`, com o efeito em `livro-motor.js conjurarDoLivro` (`efeito`); as criaturas que as magias conjuram moram em `monsters/magias.js`. Magia de 1 minuto ou mais de conjuração fica fora do jogo, com o motivo na fila: não cabe num turno de luta. A área `cube` do motor sai de quem conjura; cubo mirado à distância é `square`. QUEM APRENDE CADA MAGIA sai do livro: o importador escreve `rules/magias-por-classe-phb.js` (do `spells/sources.json` do 5etools, todas as magias que o PHB conhece, as feitas à mão inclusive), e `game/criacao.js listaDaClasse` soma isso às listas escritas à mão. Antes disto faltavam 114 magias feitas à mão nas listas das classes, a Bola de Fogo do mago entre elas. As de EXPLORAÇÃO dos livros entram no sistema de magia fora da luta pela tabela `rules/utilidade-livros.js` (a mesma forma de `UTIL`), com o texto em `game/magias-fora-livros.js`; as de viagem (`soNaRegiao`) se conjuram na tela da região, em `game/viagem-magica.js`; a magia que o jogo não faz (sem efeito, ou que só se narraria) NÃO ENTRA no jogo: fica só na fila `magias/<livro>-pendente.json`, com o motivo. `src/dev/varrer-bestiario.mjs <livro>` põe cada criatura nova para lutar no simulador atrás de quebra. OS TALENTOS DO PHB entram NO LUGAR DO AUMENTO (o talento de origem de 2024 segue no 1º nível): `traduzir-talentos.mjs` e `importar-talentos.mjs` escrevem o texto (`rules/talentos-phb-texto.js`), a regra é a tabela à mão `rules/talentos-phb.js` e o que fazem na luta mora em `rules/talentos.js`; `subirNivel` aceita `escolhas.talento` no lugar do `asi`, e a tela pergunta antes de subir (`nivel.js escolhaDeAumento`). Eles trouxeram as ações de Agarrar e Empurrar do herói e a recarga da besta, que o motor não tinha (`combat.js agarrar`, `empurrarAcao`, `golpesDeTalento`). O Combatente Montado fica de fora: não há montaria. O HUMANO VARIANTE do criador toma um deles no 1º nível, além do de origem (`criador.js talentosDoVariante`, `criacao.js montarHeroi`). O GUIA DE XANATHAR entrou pelo mesmo caminho das magias (`ajustes-xge.mjs`, `magias-livro-xge.js`); as AÇÕES QUE UMA MAGIA CONCEDE (o sopro do Sopro do Dragão, os meteoros, as estrelas, o jato das Investiduras) são magias internas de `rules/magias-concedidas.js`, que aparecem na lista de quem as tem enquanto a condição ou a concentração dura. Nome de condição repetido apaga a outra em silêncio: `testes-magias-xge.mjs` recusa. O CALDEIRÃO DE TASHA também; as nove invocações chamam os espíritos de `rules/monsters/espiritos-tce.js`, que `escalarEspirito` ajusta ao círculo e a quem conjura na hora da invocação. A LISTA EXPANDIDA do Tasha (o que ele acrescenta a cada classe) sai de `src/dev/lista-expandida-tce.mjs` para `rules/magias-por-classe-tce-expandida.js`, e vale sempre. AS SUBCLASSES DOS LIVROS: o texto sai de `src/dev/traduzir-subclasses.mjs <livro>` (`src/dev/subclasses/<livro>-pt.json`), a regra é a tabela à mão `rules/classes/subclasses-<livro>.js` (as subclasses no formato das feitas à mão e, por recurso, o tipo e se o motor faz ou por que não), `src/dev/importar-subclasses.mjs <livro>` escreve `rules/classes/caracteristicas-<livro>.js`, e o que os recursos fazem na luta mora em `rules/subclasses-livros.js`. Uma subclasse só entra quando o que ela faz em luta funciona; do Xanathar entraram as 31 (`testes-subclasses-xge.mjs`); o que cada uma deixa de fora está na tabela, recurso a recurso. Do Tasha (`subclasses-tce.js`, `testes-subclasses-tce.mjs`) entraram as 26; as do artífice não entram, porque o jogo não tem a classe. Dos outros livros (`subclasses-scag.js`, `-dmg.js`, `-ftd.js`, `-bgg.js`, `testes-subclasses-livros.mjs`) entraram as onze: Costa da Espada, Livro do Mestre, Fizban e Bigby. A lore aparece no "Lembrar" sobre a criatura (`investigar.js saberDaCriatura`). **OS MAPAS DA REGIÃO E DA VILA SÃO OS OFICIAIS** do Obelisco (5e.tools, as versões de jogador, em `public/mapas/oficial/`, arte da Wizards: fora do repositório e da publicação, como a da FA). A tela (`view/vila.js`) tenta carregar a imagem oficial e, se ela existir, troca o fundo e põe cada pino em `l.oficial`; sem ela, fica a pintura do OpenArt. A DISTÂNCIA da viagem sai sempre do mapa oficial, com ou sem a imagem (`rules/regiao-mapa.js`: 1 hexágono = 5 milhas = 92,6 px, medido sobre o mar), e é ela que dá os dias de marcha e quantos testes de encontro a estrada rola: o Poço fica a 39 milhas em linha reta, Neverwinter a 50, Talhundereth a 55. E A VIAGEM SEGUE O TERRENO do mapa: `src/dev/mapa-regiao-terreno.py` lê a arte em células de 23 px (campo, trilha, mata, colina, montanha, mar: o terreno pelo agrupamento de cor e textura, as serras por contorno, as estradas pelo vermelho) e escreve `rules/regiao-terreno.js`; `rules/regiao-rota.js` acha o caminho mais barato, com mata, colina e montanha custando o dobro (o terreno difícil do Livro do Jogador) e trilha e campo o normal. A marcha gasta km equivalentes, o jogador vê os km de verdade e por onde passa, cada dia tira a paisagem (e a caça e o bioma) do terreno do trecho, e a rota se desenha no mapa com o grupo andando nela. O Poço da Coruja Velha, pelas colinas, ficou a três dias. Uma cena de Foundry com poucas luzes pede `SEMENTES="x,y;..."` no import: o derivador de paredes só semeava nas luzes. Para medir uma troca de elenco: `src/dev/medir-troca.mjs [lutas] [nível]` (campo aberto, as mesmas
sementes, os dois elencos) e `src/dev/medir-covil.mjs [lutas] [nível]` (a sala de verdade, que hoje já é a do Obelisco). **Bloco novo sem
look desenhado** usa a ficha também no retrato da HUD (`sheet.js makePortrait`, `SO_FICHA`): os testes em Node passavam e
a primeira luta com a cobra, no navegador, derrubou a ordem de turno com "Look desconhecido". Rodar a cena no jogo pega
o que o Node não desenha. A mesma volta pelo navegador achou mais dois defeitos do MOTOR, antigos, que só os bichos novos
expuseram: **o agarrão não acabava com quem agarrava** — a Dara saía da luta do poço contida pelos anéis de uma serpente
morta; hoje `soltarAgarroesDe` solta na morte e na queda, e `conferirAgarroes` no começo de cada lado, para quem ficou
incapacitado (só a condição com CD de escape cai; o veneno fica) — e **1 de dano contra resistência virava "imune"** no
registro, porque a metade arredonda para 0; imune agora é quem zera 2 de dano.

---

## A regra que vale para todos

1. **Nenhum agente corrige nada.** Todo revisor deste projeto é read-only
   (`Read, Glob, Grep, Bash`) e devolve **parecer**, não commit. Quem conserta é
   quem chamou.
2. **Medir, não achar.** O parecer que vale é o que rodou o motor em Node, mediu
   a imagem em pixel ou capturou o jogo. "Acho que está feio" não é achado.
   A skill `sprite-phandalin` existe porque este projeto já queimou uma sessão
   inteira descobrindo isso.
3. **Chefe e sub-revisores.** Nas três frentes grandes (regras, magias, ícones) o
   trabalho é em duas camadas: os **sub-revisores** rodam em paralelo, cada um
   num recorte, e o **chefe** recebe os pareceres, reproduz cada achado,
   **descarta os falsos**, junta os repetidos e devolve a lista final por
   gravidade. Nunca chame o chefe sem ter rodado os subs.
4. **Todos rodam no `sonnet`.**
5. **O parecer vira arquivo** em [`revisoes/`](revisoes), com data no nome —
   `revisoes/regras-2026-10-24.md`, `revisoes/magias-2026-10-24.json`.

---

## Skills (3)

Todas em `.claude/skills/`. O projeto não tem `settings.json`.

| Skill | Para quê | Arquivos |
|---|---|---|
| [**pixel-art**](.claude/skills/pixel-art/SKILL.md) | O ofício em geral: paleta limitada, dithering, animação subpixel, ladrilho, limite de hardware retro, HD-2D. Material de mestres indie (saint11) — daí o `LICENSE` e o `ATRIBUICAO.md`. | `SKILL.md`, `references/patterns.md`, `references/sharp_edges.md`, `references/validations.md` |
| [**pixellab**](.claude/skills/pixellab/SKILL.md) | Gerar arte pela API do PixelLab: folha de sprites, ladrilho, kit de prédio, objeto de cenário, animação, herói de 8 direções. Serve para escolher a rota **antes** de gastar geração. `referencia.md` saiu do OpenAPI oficial; o que ninguém mediu aqui está marcado **desconhecido**. | `SKILL.md`, `mcp.md`, `referencia.md` |
| [**sprite-phandalin**](.claude/skills/sprite-phandalin/SKILL.md) | O **placar objetivo** de um sprite do jogo — silhueta, paleta, rig, direções. Consulte antes de dizer que um sprite "ficou bom". Aponta para `draw.js`, `pintor.js`, `esqueleto.js`, `poses.js`. | `SKILL.md` |

---

## Agentes (23)

Todos em `.claude/agents/`.

### Regras de D&D — 1 chefe + 6 sub-revisores

Rode os seis subs, depois o chefe.

| Agente | Recorte | Mede |
|---|---|---|
| [revisor-regras](.claude/agents/revisor-regras.md) | **chefe** | Confere cada achado dos seis no código e rodando o motor |
| [revisor-regras-progressao](.claude/agents/revisor-regras-progressao.md) | `src/rules/progressao.js` | XP, PV, proficiência, espaços de magia, truques, `pendentes` — do 1º ao 20º |
| [revisor-regras-classes-marciais](.claude/agents/revisor-regras-classes-marciais.md) | bárbaro, guerreiro, ladino, monge, paladino, patrulheiro | Nível a nível contra o SRD, com subclasses |
| [revisor-regras-classes-conjuradoras](.claude/agents/revisor-regras-classes-conjuradoras.md) | bardo, bruxo, clérigo, druida, feiticeiro, mago | Conjuração, domínio, invocações, metamagia, Arcano Místico |
| [revisor-regras-combate](.claude/agents/revisor-regras-combate.md) | `combat.js`, `conditions.js`, `equipment.js` | Ataque, crítico, CA, cobertura, oportunidade, economia de ação, morte, concentração — **jogando combates em Node** |
| [revisor-regras-magias](.claude/agents/revisor-regras-magias.md) | `spells.js` + como `combat.js` conjura | Círculo, escola, alcance, área, resistência, dano, CD |
| [revisor-regras-monstros](.claude/agents/revisor-regras-monstros.md) | `monsters.js`, `monsters/*.js`, `npcs.js`, `ai.js` | Bloco contra o SRD (CA, PV, ND, XP, traços) e se a IA joga dentro da regra |

### Magias — 1 chefe + 4 sub-revisores

| Agente | Recorte |
|---|---|
| [revisor-magias](.claude/agents/revisor-magias.md) | **chefe** — devolve por gravidade, cada um com a correção **e o custo** (grátis no código, ou uma geração no OpenArt) |
| [revisor-magia-regras](.claude/agents/revisor-magia-regras.md) | A magia contra o livro, rodando o motor |
| [revisor-magia-area](.claude/agents/revisor-magia-area.md) | Geometria na grade de 5 pés e se a **prévia sob o cursor** (`tabuleiro-topo.js areaDaMira`) é exatamente o que a magia pega (`combat.js areaDaMagia/castSpell`) |
| [revisor-magia-recorte](.claude/agents/revisor-magia-recorte.md) | Técnico dos quadros (`src/art/efeitos.js`): corte na borda, desalinho que faz a animação "pular", franja do fundo magenta, cor fora da paleta, âncora em `fx.js`/`visuals.js` |
| [revisor-magia-beleza](.claude/agents/revisor-magia-beleza.md) | Direção de arte: é bonito, lê sobre o tabuleiro, **tem a cara da magia** (dá para reconhecer a Chama Sagrada?), o impacto tem peso |

### Ícones — 1 chefe + 3 sub-revisores

Lote de ícones já convertidos (32×32, paleta do jogo). Rode os três, depois o chefe.

| Agente | Recorte |
|---|---|
| [revisor-icones](.claude/agents/revisor-icones.md) | **chefe** — veredito ícone a ícone |
| [revisor-icone-legibilidade](.claude/agents/revisor-icone-legibilidade.md) | Lê no tamanho real, sobre o escuro do HUD e sobre o pergaminho da ficha. Teste da silhueta, medida de salpicado |
| [revisor-icone-fidelidade](.claude/agents/revisor-icone-fidelidade.md) | Mostra o que a magia/ação/traço **é**, e não parece outra coisa do jogo |
| [revisor-icone-conjunto](.claude/agents/revisor-icone-conjunto.md) | Pertence ao conjunto dos aprovados (traço, contorno, escala, sombreamento, 14 cores) e dois do lote não se confundem |

### Mapa e arte isométrica — 5 agentes, cada um numa camada

| Agente | Camada | Quando |
|---|---|---|
| [revisor-mapa-iso](.claude/agents/revisor-mapa-iso.md) | **Traçado** — rotas, gargalos, linha de visão, elevação, cobertura, espaço morto, medido com `src/core/grid.js` | Depois de desenhar/mudar mapa em `src/game/encounter.js` |
| [revisor-motor-mapa](.claude/agents/revisor-motor-mapa.md) | **Código** — camadas de regra e aparência, ordem de profundidade, oclusão, câmera, minimapa, atlas, pipeline | Depois de mudar mapa, terreno ou desenho de cenário |
| [revisor-render-iso](.claude/agents/revisor-render-iso.md) | **O que aparece na tela** — buraco de parede, talho em junção, costura de ladrilho, objeto flutuando, escala errada. **Roda o jogo e tira as capturas** | Depois de mexer em parede, chão, objeto ou kit |
| [avaliador-mapa-iso](.claude/agents/avaliador-mapa-iso.md) | **Direção de arte** — julga como um diretor de estúdio, contra o padrão do gênero (Baldur's Gate, Diablo, Pillars). Também roda o jogo | Depois de mudar parede, chão, planta ou objeto |
| [revisor-cenario-iso](.claude/agents/revisor-cenario-iso.md) | **Especificação** — escreve o tamanho em px, pegada em casas, âncora, direções, oclusão e paleta de cada objeto, e o pedido pronto para o gerador | **Antes** de gerar e depois de cada leva |

`revisor-render-iso` e `avaliador-mapa-iso` são os dois únicos com acesso ao
navegador (`mcp__Claude_Browser__preview_start`, `javascript_tool`,
`tabs_context`, `read_console_messages`) — porque medem em cima da tela.

### Conteúdo e encontro — 2 agentes

| Agente | O que julga |
|---|---|
| [fidelidade-aventura](.claude/agents/fidelidade-aventura.md) | A cena contra **A Mina Perdida de Phandelver**: lugar, criaturas, objetos, diálogos, exploração — o que falta e o que sobra. Também **ambientação**: o lugar parece habitado? |
| [revisor-encontro-tatico](.claude/agents/revisor-encontro-tatico.md) | Posição inicial dos dois lados, para onde cada um olha, a lógica da emboscada, quem age primeiro, orçamento de XP do DMG, reforços. Simula com `src/dev/balance.js` |

---

## Agentes embutidos

Fora dos 23, valem os de sempre: **Explore** (busca em leque, read-only),
**Plan** (plano de implementação), **general-purpose**. Não são deste projeto e
não sabem nada dele.

---

## Como medir sem agente nenhum

Boa parte do que um revisor mediria sai de um comando:

```bash
node src/dev/testes-cenas.mjs      # cenas, mapas, blocos, relógio da vila
node src/dev/testes-regras.mjs     # o motor de regras
node src/dev/balance.js            # simulador de encontro
npm run build                      # roda verificar-taverna.mjs no prebuild
```

Há um `testes-*.mjs` por frente (barbaro, goblin, habilidades, mansao, ondaeco,
porta, save, sala, sala-ws, dialogo-perfil, itens-fora, movimento-aliados,
musica, editor, casadamorte, regioes, criador, sala-criados, arestas, luz, nevoa, rota, tracos, armadilhas, polvo, castelo, obelisco5, zorzula, obelisco6, talhundereth, cripta, bestiario, importar-bestiario, mapas-oficiais, magias-livros, exploracao-livros, talentos-phb, magias-xge, magias-tce, subclasses-xge, subclasses-tce, subclasses-livros). O de editor, o da Casa da Morte, o das regiões, o do
criador, o do herói criado na sala, o das arestas, o do polvo, o do castelo (as duas cenas de verdade) e o do capítulo 5
na vila rodam com
`node --import ./src/dev/cena-node/register.mjs src/dev/testes-<nome>.mjs`;
`src/dev/simular-casadamorte.mjs` joga as lutas da Casa da Morte e
`src/dev/passeio-casadamorte.mjs [sacrificar|negar] [semente]` percorre a casa inteira, do jardim à saída, como um jogador automático.
`node --import ./src/dev/cena-node/register.mjs src/dev/conferir-paredes.mjs` confere PAREDE E PORTA das vinte
cenas rodando o motor: porta no maciço, porta que não separa nada, chão que nenhuma entrada alcança (com a
fronteira da ilha), `folhas` e `grades` apontando aresta errada. Ele sabe o que o roteiro abre (as secretas da
Mansão, o segredo da prisão, as lajes das criptas) e o que é de propósito (o anel de fora da casa, a cela de
grade, a escada que se pega pelo botão), então 0 achados quer dizer 0 mesmo; `--tudo` solta os avisos fracos.
`src/dev/testes-paredes.mjs` prova que ele acusa cada defeito.
`node --import ./src/dev/cena-node/register.mjs src/dev/conferir-cena.mjs` é o IRMÃO dele e olha o que a parede não
mostra, nas mesmas cenas: porta sem `folhas` (sem a lista, NENHUMA porta abre), luz dentro de móvel que não segura
fogo, luz sem casa livre encostada (ninguém a apaga), peça em superfície que o menu não enxerga, inimigo que nasce em
casa bloqueada ou em cima de outro, e **chão que o FOSSO isola** — a casa de chão cercada por rocha e um buraco, que a
conta de componentes de quem gera o mapa não pega, porque lá o fosso conta como chão. Foram seis assim na Onda Eco, e
o gerador as IMPRIMIA todo dia sem nunca as consertar. `src/dev/testes-conferir-cena.mjs` prova que ele acusa — e foi
ele que me corrigiu numa suposição: **o fosso barra o passo, a água funda não** (atravessa-se a nado, que ela é
terreno difícil), então só o fosso entra na conta.
`node --import ./src/dev/cena-node/register.mjs src/dev/conferir-luzes-fa.mjs` casa cada luz da cena do Foundry com a nossa, com a moldura certa em cada eixo (a Onda Eco já ficou quatro casas ao sul por coordenada copiada à mão). Não decide: brilho sem chama no desenho não precisa virar luz, e quem julga isso é o recorte da imagem.
`python src/dev/conferir-colagem.py [--min 10]` é o TERCEIRO conferidor, e mede uma coisa que ninguém media: **o quanto o
texto do jogo está colado no livro**. Para cada fala, descrição, pista e COMENTÁRIO de código, acha a maior sequência de
palavras igual ao PDF (`_referencias/livro/`, que não entra no repositório; sem ele o conferidor avisa e sai). Nasceu de
dois revisores que acusaram "texto perto demais" em catorze trechos: medido, **nenhum deles compartilhava uma frase** com
o original — o que tinham em comum era a ORDEM DAS IDEIAS, que se resolve reescrevendo a estrutura, e foi o que se fez. Em
compensação a mesma medida achou o que ninguém procurava: **dezessete citações LITERAIS do livro, de 11 a 39 palavras,
entre aspas dentro de comentário**, em vinte e dois lugares, postas de boa-fé para justificar uma decisão ("o livro diz
X, então fazemos Y") — mais a carga da carroça do capítulo 1, que era a lista do livro na ordem do livro, em texto que o
jogador lê. Todas foram trocadas pelo fato, com as nossas palavras. Ele devolve **o maior trecho por literal**, então
encurtar uma citação revela a que estava atrás: foram cinco passadas até parar de cair. Hoje são **ZERO trechos de dez
palavras ou mais**, e o maior do jogo inteiro tem nove, nome próprio: "com um necromante chamado Tsernoth na cidade de
Iriaebor". Abaixo de 10 o conferidor só devolve isso,
então é com `--min 10` que ele se usa.
`node --import ./src/dev/cena-node/register.mjs src/dev/medir-marcarrubra.mjs [amostra] [nível]` responde a uma pergunta
que volta sempre — **"este bloco nosso é duro demais?"** — jogando a mesma luta duas vezes, com o nosso bloco e com o do
SRD, nas mesmas sementes. Foi escrito para o Bandido Marcarrubra, que um revisor acusou de ND 1/2 onde o livro usa 1/8:
medido, ele custa **seis pontos percentuais de vida do grupo por luta** e não matou ninguém em 900 lutas — e sem ele as
três salas de bandido da Mansão seriam nada (95% da vida de volta, ninguém no chão). O molde serve para qualquer bloco
`'propria'` derivado de um do SRD.
`node --import ./src/dev/cena-node/register.mjs src/dev/medir-progressao.mjs` soma a campanha inteira — todas as paradas
que pagam XP, divididas por quatro heróis — e diz a que NÍVEL o grupo chega em cada capítulo, no caminho cheio e no
magro. Existe porque trocar um prêmio empurra tudo o que vem depois. O que ele vigia é a FRONTEIRA, e não o número: o
livro quer o 5º nível na Onda Eco e por XP o grupo chega no 4º — **e isso não é defeito**, porque a aventura impressa
avança por MARCOS e a soma dos prêmios dela nunca daria o 5º; `capitulo5-ondaeco.js` já diz na primeira linha "o grupo
chega aqui no 4º nível ou perto" e dimensiona o templo pelo nível médio do grupo. O que não pode é um prêmio mexido
derrubar o grupo abaixo disso sem ninguém ver.
`node --import ./src/dev/cena-node/register.mjs src/dev/inventario-cenas.mjs` responde a outra pergunta, e é a que os
dois conferidores NÃO respondem: eles dizem se o que existe está certo, e este diz **o que existe**. Uma tabela das
dezoito cenas com parede, porta, luz dinâmica, chama que se apaga, peça de mobília, objeto desenhado no chão, objeto
interagível e tamanho do bando — mais quais rodam sobre battlemap pintado, onde peça por cima desenharia duas vezes e o
lugar certo do objeto é o GLIFO de terreno. Cena sem luz nenhuma, sem peça nenhuma ou sem nada para clicar passa nos
dois conferidores com zero achados, e foi assim que a Onda Eco ficou meses com a arte pintada no chão e nada para
interagir. O primeiro achado dele: **a rua da vila anoitecia com 188 casas no breu e zero fontes de luz**, numa briga em
que nenhum dos quatro Marcarrubra enxerga no escuro — quatro humanos bebendo na varanda de uma taverna, às escuras.
Ganhou o lampião da varanda (`soNoEscuro`, que acende só quando a cena escurece). E o teste da luz inerte, que isentava
quem só acende no escuro, passou a PROVAR esses também, escurecendo a cena: isentar sem provar é luz inerte com outro
nome. O segundo achado dele: **de onze cenas, SÓ O ESCONDERIJO ligava chama a desenho** (`luz.sobreposicao`, que
`game/fogo.js` acende e apaga junto). Nas outras, apagar uma tocha jogava o cômodo no breu pela regra e deixava a pintura
brilhando igual — o defeito que o próprio comentário do `fogo.js` descreve. A Mansão era a maior: onze tochas, nenhuma
mexendo no desenho. E a arte estava no disco: a Forgotten Adventures publica o Redbrand Hideout apagado E ACESO, e a
versão acesa não tinha uso nenhum. `python src/dev/cortar-mansao-acesa.py` a corta no alcance de cada luz e
`mapa-mansao.py` amarra a peça à tocha — onze de onze agora. Os recortes nascem em `public/mapas/fa/`, que o `.gitignore`
cobre: sem a arte no disco a peça não desenha e a cena abre igual, como já acontece com o `fundo`. A mesma pergunta aplicada ao ELENCO de uma cena tem duas irmãs, as duas com `--livro`
para trocar o nosso bando pelo do livro nas mesmas sementes: `src/dev/simular-emboscada.mjs` (era 3 goblins + 2 lobos contra
os 4 goblins do livro — a nossa desgastava mais, 78% contra 86% de vida, e matava menos, 0% contra 1%; desde o Obelisco a cena
é a do livro) e
`src/dev/medir-covil.mjs` (4 goblins + Yeemik contra os 5 do livro — o quinto triplica a derrota, de 6% para 16%). Os dois
existem porque os números que justificavam essas decisões eram da PLANTA ANTERIOR do esconderijo, e ninguém os remediu
quando a cena passou para o battlemap da FA: **decisão medida numa planta morta é decisão não medida**. Para corrigir um mapa, `/editor.html` abre qualquer uma
das vinte cenas e a caixinha `x,y` do alto leva a casa que o parecer apontou para o meio da tela.
Para MARCAR em cima de um mapa pintado: ferramenta 5 (Terreno) pinta a camada de REGRA — e por ÁREA, não casa a
casa: pincel, retângulo arrastado, polígono (clica os cantos, fecha no primeiro ou com Enter) e balde. É assim que
se bloqueia a pegada de um prédio **sem criar parede nenhuma**: escolha um glifo que barra passo (Casa, Taverna,
Rocha, Parede inteira) e arraste por cima dele. Ferramenta 2 desenha parede, porta, arco, grade, seteira e
passagem secreta por aresta, ou o contorno de uma caixa de uma arrastada (modo Retângulo); a 3 traça parede livre;
a 4 acende luz; a 9 marca objeto interagível; a 0 é a CAMADA DE FRENTE — a parte da pintura que o tabuleiro
redesenha por cima das fichas, para copa de árvore e beiral de telhado cobrirem quem passa debaixo deles. Ela
não é regra, e tem dois caminhos: a máscara derivada da COR do desenho (grátis, recorte pixel a pixel, é o que
serve para folha) e a marca à MÃO por área (borda reta na aresta da casa, para o telhado que a cor não separa).
Em ambos a folha desbota onde há ficha, senão o personagem some debaixo dela.
A **SOBREPOSIÇÃO** (`mapa.sobreposicoes`) é a outra metade: pedaços de arte com nome (`{ id, url, x, y, w, h, ligada, frente? }`) que o
roteiro acende e apaga — a fogueira que acende, a ponte que cede, o baú que abre, o túnel que desaba. É o ladrilho comutável de um mapa do
Foundry; lá o mestre dá um duplo clique, aqui quem liga é o `aoInteragir` da cena, com `enc.field.alternarSobreposicao(id, true)`. O campo
recebe uma CÓPIA, para acender numa partida não deixar aceso na próxima. Não é camada de regra: a ponte que cai no desenho continua
atravessável até alguém mudar o terreno. No editor é a ferramenta **Q**: arrasta-se o retângulo para pôr a peça, um clique dentro de uma já
posta escolhe ela, e a lista do painel acende e apaga. Peça cuja arte não está no disco aparece como retângulo tracejado com o nome — no
jogo ela simplesmente não desenha.
A **PAREDE COM RESTRIÇÕES SEPARADAS** (`core/grid.js RESTRICOES`), como no Foundry: cada tipo de aresta diz o que faz com o passo, a
visão, a luz e o som. Além de parede, porta, arco e seteira: **etérea** (`E`, parece parede e se atravessa), **invisível** (`I`, só barra
o passo, não se desenha no jogo), **limitada** (`T`, a moita: a primeira não barra a visão, a segunda sim), **janela** (`W`, vê e não
passa, barra o som) e **mão única** (`>` para leste/sul, `<` para oeste/norte; só o passo). Quem pergunta diz o quê:
`passa(..., 'passo'|'visao'|'luz'|'som')`, e `hasLineOfSight(a, b, 'luz')` para a luz. O som ainda não tem quem o pergunte. A **PORTA
TRANCADA** é dado do mapa (`mapa.trancas`: `{ aresta: 'x,y,N|O', cd, chave?, forca? }`), e `game/portas.js` dá o menu de qualquer porta
— abrir, fechar, abrir a fechadura (Destreza com ferramentas de ladrão), arrombar (Força, CD + 5), a chave — nas cenas que não cuidam
das próprias portas (as que cuidam declaram `portasProprias: true`). No editor é a ferramenta 2, com a CD no painel; o editor mostra
por cima o que o jogo não desenha. `src/dev/testes-arestas.mjs` prova cada tipo.
O **TRAÇO TAMBÉM TEM TIPO** (`mapa.tracosTipo`, lado a lado com `mapa.tracos`; `null` é parede): parede, porta, etérea, janela, seteira,
invisível e moita. A mão única fica de fora, porque o traço não tem lado. `mapa-editor.js arestasDosTracos` devolve Map chave → glifo, e
a aresta derivada leva o glifo do tipo, então o passo segue sozinho. Quando dois traços caem na mesma aresta, vale o que barra mais. A
visão e a luz pela geometria (`grid.cortadoPorTraco`, `raios.js`) perguntam `segmentoBarra(seg, tipo)`: a janela, a invisível e a seteira
não cortam a reta, e a porta corta e deixa a aresta dela decidir (aberta, passa). A porta traçada abre pelo menu de porta, aresta a
aresta, e `field.portaDoTracoAberta(i)` diz ao desenho que ela está aberta. No editor é a ferramenta 3: o tipo vale para o próximo traço,
e "Trocar o tipo" muda o de um traço já feito. `src/dev/testes-tracos.mjs` prova cada tipo.
A **LUZ** (`rules/luz.js`) segue o Foundry. `APARENCIA_DA_LUZ` dá cor e animação por tipo (fogo, vela, pulso, fixa), e a luz do mapa
pode trazer `cor` e `animacao` próprias. É só desenho, `tabuleiro-topo.js pocaDeLuz`. O CONE (`angulo`, `direcao` em graus, 0 = leste,
90 = sul) entra na regra (`dentroDoCone`, dentro de `nivelDeLuz`). `soNoEscuro` deixa a luz apagada até a escuridão da cena chegar a ele.
`definirEscuridao(field, 0..1)` dá dia abaixo de 0,35, penumbra até 0,7 e breu acima. Num mapa que já tem grade de luz, fica o mais
escuro dos dois. O tabuleiro põe um véu azul que chega aos poucos. O mapa leva `escuridao`, a rua da vila anoitece pelo relógio
(`capitulo3-rua.js`), e o multijogador manda a escuridão na diferença do campo (`e`). No editor é a ferramenta 4.
`src/dev/testes-luz.mjs` prova tudo.
A **NÉVOA EXPLORADA** (`rules/nevoa.js`) guarda em `field.explorado` cada casa que o grupo viu. O tabuleiro a enche com
`explorar(field, _visao)` a cada quadro. No véu ela tira `NEVOA_LEMBRADA` (0,42) do preto e deixa o chão no escuro. O brilho das luzes
é cortado pelo véu SEM a memória. Quem aparece continua sendo só `_visao`. O save leva uma por cena em `campanha.nevoa[variante]`
(`codificarExplorado`, corridas em base 36, com `LxA:` na frente; `restaurarExplorado` recusa outro tamanho). `main.js guardarNevoa` grava
ao salvar e ao sair da cena, e só na campanha de onde o campo saiu (`field.nevoaDe`). Não vai na diferença do campo: cada jogador tem a
sua. O mapa desliga com `nevoaExplorada: false`. `src/dev/testes-nevoa.mjs` prova tudo.
A **RÉGUA COM ESCALAS** (`rules/rota.js`): `tracarRota(enc, ator, escalas, destino, { visivel })` monta o caminho trecho a trecho com
`reachableFor` a partir de cada escala (com o deslocamento que sobra), então o custo é o que `moveAlong` cobra. Devolve `ok`, `caminho`,
`custo`, `restante` e `avisos`. Os avisos são o ataque de oportunidade, que vem de `Encounter.ameacasNoPasso`, o mesmo teste que o
`moveAlong` faz (cada inimigo avisa uma vez), e a região à vista que fere ou prende (`regiaoPega`). A escala pode ser casa de passagem,
o destino não. No `main.js`, Ctrl+clique marca (`marcarEscala`), Esc tira a última e o clique anda pela rota. As escalas caem quando o
herói anda. A forma das escalas que vêm da sala (`escalasValidas`, até 8) mora em `game/acoes.js`, que o servidor carrega sem o motor.
`src/dev/testes-rota.mjs` prova tudo.
A **REGIÃO** (`mapa.regioes`, motor em `rules/regioes.js`) é a área que FAZ algo quando alguém entra, sai, ou começa e termina o turno
nela — a Region do Foundry. Efeitos, na ordem: texto, dano (com teste e metade), condição (com teste), parar o passo, terreno difícil
(enquanto ligada), acender/apagar uma sobreposição, ligar/desligar outra região, teleporte e `voltar` (à casa de onde veio, nunca para
dentro da região); o dano pode deixar com uma condição quem falha no teste dele (`seFalhar`), e dano e condição com `alvo: 'todos'`
pegam todo mundo dentro (o `resultado` traz `atingidos`). Filtros: quem (todos, o grupo, os inimigos), tamanho mínimo
(`tamanhoMinimo`, a laje que o goblin atravessa), quantas vezes, começa desligada, pega quem voa, `discreta` (a régua não avisa).
**Toda armadilha de capítulo é região**: a laje do esconderijo (`encounter.js`), o poço de espinhos do porão (`casadamorte.js`), o fio
do Castelo e o fosso e a ponte sul da Mansão (`encounter.js`). O capítulo guarda só a história e a memória: ouve `naRegiao`, ou os
eventos `regiao` e `regiaoDescoberta` no `capitulo.evento` (achada por qualquer caminho: passiva, Procurar, magia), conta no painel
depois do passo, dá o XP, abre o buraco (`marcarFosso`), quebra a ponte e lembra na próxima visita (`descobrirRegiao`, `alternarRegiao`).
O trecho da trilha do capítulo 2 (o laço e o fosso) não é região: é narração da viagem, fora do mapa. **Escondida** vira armadilha sem
roteiro (`escondida: { cd, cdPassiva?, passiva?: false, alcance?, achado }`: a CD do Procurar, a da passiva se for outra, só
procurando, e até onde a passiva nota, em pés): a Percepção passiva nota antes
(`game/armadilhas.js`), o Procurar e o Encontrar Armadilhas acham, e descoberta ela não pega mais o grupo (o monstro não sabe dela). Roda
dentro do `moveAlong`, então vale para herói e monstro, na luta e explorando. A cena que quer mais (ir para outra cena) ouve
`capitulo.naRegiao(regiao, criatura, quando)`. No editor é a ferramenta **R**: pincel, retângulo, polígono e balde, e o formulário dos
efeitos no painel. O campo recebe uma CÓPIA (como a sobreposição). `src/dev/testes-regioes.mjs` prova cada efeito, e
`src/dev/testes-armadilhas.mjs` o fio do Castelo e as extensões (passiva, alcance, `alvo: 'todos'`, `voltar`).

**A ESFERA DO LIVRO** (`core/grid.js circulo`, `rules/spells.js esferaDoCruzamento`): a esfera nasce num CRUZAMENTO de linhas, aqui o canto de cima e da esquerda da casa mirada, e a casa entra se o círculo cobre pelo menos METADE dela — a regra de grade do Livro do Mestre. Antes era `within`, que no quadriculado dá um QUADRADO: a Bola de Fogo pegava 81 casas em vez de 52 e acertava a 8,5 m do centro, com raio de 6 m. Ficam de fora três casos, que contam distância a partir de uma casa e seguem no quadrado: `centradoEmSi` (Braços de Hadar, a até 3 m de quem lança), `emVoltaDaCasa` (Esfera Flamejante e Guardião da Fé, a até X da coisa que ocupa a casa) e a de raio zero. Medido em 400 lutas de 5º nível: com o bando junto a Bola de Fogo pega 4,45 inimigos em vez de 4,51, e com o bando espalhado 3,40 em vez de 4,00 — o preço de mirar mal subiu, que é o ponto da regra. **A ANIMAÇÃO NÃO ENCOLHEU junto**: a arte é redonda e desenha inteira, do tamanho da área (`pintarZonaComArte` e `arteDaMagia` só recortam cone, linha e muralha, que não são redondos); recortar a arte redonda na casa deixava a borda serrilhada e cortava o desenho. `testes-regras.mjs` guarda 4, 12, 32, 52, 208 e 448 casas por raio.

**A CAMADA `src/app/combat` TINHA DOIS FERROLHOS, e cada um escondia o outro.** Ela é a porta por onde o clique vira ação (`main.js tryCast`/`tryAttack` → `CombatAdapter` → `CombatManager`), e tinha 180 testes verdes enquanto o jogo estava quebrado. **O primeiro**: `TurnManager` perguntava `encounter.current ?? 0` — um ponteiro de iniciativa individual que ESTE motor nunca teve, porque aqui a fase é do LADO (`enc.side`), todo mundo do lado joga na ordem que quiser e cada um fecha o seu com `acted`. Faltando o campo, a conta caía em zero e `isCurrentTurn` respondia sempre "o primeiro da lista": só a Dara atacava, conjurava, usava item, usava recurso e entrava em mira, e Pip, Brenn e Ilvan levavam "Não é o turno deste combatente" por cinco portas. O botão de passar a vez tinha o MESMO defeito e já fora corrigido à parte em 2026-11-04 (`CombatAdapter.terminarTurnoDe`) — um campo inventado derruba uma porta de cada vez, e consertar só a porta que doeu deixa as outras quatro de pé. Hoje quem responde é `ehAVezDe`: o combate não acabou, ele é do lado da vez, está vivo e de pé. Quem JÁ AGIU passa de propósito, porque quem recusa com a palavra certa é o motor ("a ação deste turno já foi usada") e ele sabe do Ataque Extra, que deixa golpear com a ação gasta. **O segundo**: `CombatManager` põe `isProcessing` antes de cada ação e, pelo contrato escrito nele, soltava no `onComplete` do handler — que `ActionHandler` **nunca chama** (ele só avisa `onSuccess` e `onError`). Então a primeira ação que DAVA CERTO trancava a camada inteira, e tudo depois levava "Ação em andamento"; só a ação que FALHAVA destrancava. Os dois juntos eram invisíveis: com o primeiro no lugar, quase ninguém chegava a disparar o segundo. Agora quem solta é o fim da ação (`concluir`, idempotente), menos no ataque que ANDA antes de bater, que segue depois do retorno. **E um terceiro desencontro na mesma família**: `CombatManager` passava `onMove` e `ActionHandler` lê `onWalk`, então o ataque que precisa ANDAR para alcançar andava, não achava quem segurasse o golpe e devolvia `needsMovement: true` — o ataque sumia calado e o ferrolho ficava preso, porque nesse caminho quem o solta é o fim do passo. Hoje `ActionHandler` avisa `onComplete` em TODA saída, inclusive dentro da continuação do passo, e quem chama sem `onWalk` recebe `andouSemGolpe` em vez de uma promessa que não se cumpre. O caminho é inalcançável pelo `CombatAdapter`, que anda por conta própria — era armadilha para o próximo, não defeito do jogo de hoje. **A lição é dos testes, não do código**: os 180 passavam porque o mock do Encounter INVENTAVA o `current` que o motor não tem e o `onComplete` que ninguém chama — mediam a ficção, não o jogo. As provas que pegam isto estão em `testes-regras.mjs` ("A VEZ É DO LADO" e "A camada `src/app` não se tranca"), rodam sobre o Encounter DE VERDADE, e uma delas é uma varredura do fonte do `TurnManager` atrás de `encounter.current`, para o ponteiro inventado não voltar. Camada nova sobre motor existente mede-se contra o motor; contra um mock, ela mede a si mesma.

**AS SEIS MURALHAS DO SRD.** Eram duas, Vento e Fogo; entraram a de **Força**, a de **Pedra**, a de **Gelo** e a de **Espinhos**. A máquina de forma é a mesma das outras (ver o parágrafo abaixo): `muralhaLivre` dá as dobras por Ctrl+clique às três de painéis, `muralhaAnel` dá o anel de 6 m à de Força, à de Gelo e à de Espinhos, e a de Pedra não tem anel porque o livro não lhe dá um. O que elas trouxeram de novo é uma zona que **BARRA**: até agora a zona sabia ferir, prender, esconder e parar projétil, e parede era só o que estava pintado no mapa. `zona.barraPasso` e `zona.barraVisao` chegam ao campo por `atualizarTerrenoDasZonas` (antes `atualizarDificeis`, renomeada porque agora faz mais que terreno difícil), pelo mesmo caminho das casas de custo dobrado, e somem com a zona — os quatro lugares que tiram zona já chamavam a atualização, conferido um a um. A de Força barra o passo e **não** a vista, que é o que "invisível" quer dizer na grade; a de Pedra e a de Gelo barram as duas. Quem está na linha de uma que barra é **empurrado para o lado de lá** (`abrirCaminhoParaAMuralha`), e quem não tem para onde ir deixa a casa dele de fora da muralha: melhor um vão do que uma criatura emparedada, que nenhuma regra do livro produz. A de Espinhos não barra — ela custa **quatro vezes o passo** (`dificil4`, que já existia e nunca tinha sido usado por magia nenhuma) e fere ao surgir, ao entrar e ao terminar o turno dentro. **Nada disto custou crédito**: os quatro ícones já estavam desenhados no catálogo com esses mesmos ids, e a arte saiu das 64 que já existem (`espinhos`, `gelo-aura`, `protecao`). A de Pedra foi a única que precisou de geração nova — **20 créditos**, uma imagem do `nano-banana-2`, porque nenhuma das 64 artes é pedra — e trouxe junto uma forma de pintar que o jogo não tinha: o **LADRILHO** (`porCasa` em `ARTE_DA_ZONA`, `pintarZonaEmLadrilho`). As outras artes de zona são FIGURA: uma imagem só, esticada pela zona e recortada nas casas. Isso serve para fogo e névoa, que não têm forma, e arruína alvenaria: esticada por vinte casas ela vira pedregulho de 3 m, e repetida casa a casa vira papel de parede. Em ladrilho a textura se ancora na GRADE DO MAPA (o canto da casa 0,0) e corre contínua por cima da muralha inteira, então a junta de uma casa encaixa na da vizinha e andar a câmera não desliza a pedra. `escala` é quantas casas a textura cobre antes de repetir — 2 dá cerca de quatro blocos por casa, que é pedra de parede e não paralelepípedo de rua. **A de Pedra também não ANIMA, de propósito**: as outras cinco têm folha de 12 quadros porque fogo, vento, gelo, espinho e o brilho da barreira se mexem; pedra parada é pedra, e um laço de alvenaria tremendo seria pior que a imagem quieta. O que ela tem é o `respira` de 3%, que o código dá de graça. As quatro sobem **casa a casa na ordem da muralha** (`muralhaCasaACasa`), que é o caminho dela — a sebe cresce de uma ponta à outra e o anel fecha girando, em vez de pipocarem. **A MURALHA SE QUEBRA, POR TRECHO** (`golpearMuralha`, `abrirVaoNaMuralha`). O livro dá CA e PV a DUAS das seis, e os dá por TRECHO: derrubar um abre um VÃO e o resto fica de pé — é o que tira a muralha de "espere a concentração cair". A de Pedra tem CA 15 e 180 PV por painel de 3 m, a de Gelo CA 12 e 30 PV por trecho de 3 m e é VULNERÁVEL A FOGO; como a nossa casa tem 1,5 m, cada casa leva metade (90 e 15), que mantém a conta do livro por metro. O alvo é uma CASA, não uma criatura, então o golpe entrou pela porta que engolia o clique no chão vazio (`main.js onTileClick`), e a dica do cursor passa a dizer a CA, os PV do trecho e se a arma da mão vale em dobro. **E eu tinha escrito errado duas descs**: a Muralha de Espinhos NÃO tem CA nem PV no livro (ela se atravessa pagando deslocamento e dano, e mais nada) e a de Força é IMUNE a dano, que só Desintegrar destrói. As duas foram corrigidas. **O que fica de fora, de propósito**: área de magia não quebra muralha. O livro só manda a magia ferir objeto quando diz isso com todas as letras — a Bola de Fogo incendeia o que não está sendo carregado, e nada mais —, e o resto é critério do mestre, que o jogo não tem. Quem quiser o vão bate nele. E o vão da Muralha de Gelo fica limpo: o sopro gélido que o livro deixa nele não existe aqui. E elas são magias de catálogo, como a Nuvem Mortal e o Círculo da Morte: existem, estão certas e testadas, e nenhuma lista de classe as entrega, porque o jogo não monta lista de classe — `prepared` é escrito à mão em `party.js`.

**A MURALHA DO LIVRO** (`combat.js muralhaDaMagia`, `casasDoLadoDaMuralha`, `muralhaQuente`): o jogo tinha DUAS muralhas e UMA forma — a reta de través para quem lança —, e a `desc` da Muralha de Fogo admitia por escrito o que faltava ("o livro põe também o dano no lado da muralha; aqui só vale quem está nela"). Agora são as três formas do livro, e quem escolhe é quem conjura. A **RETA** cresce do meio para os dois lados e cada ponta PARA na primeira parede, em vez de pular por cima dela: a muralha do livro é contínua, e muralha com buraco é outra magia. Na diagonal ela é uma escada de passos ORTOGONAIS (duas casas seguidas se tocam pela ARESTA; em diagonal se tocariam só pela quina, e alguém passaria entre elas) e tem o MESMO comprimento — dez casas numa muralha de 15 m, onde antes saíam vinte, porque a casa de apoio da diagonal não contava no comprimento. O **CAMINHO LIVRE** é só da Muralha de Vento, que é a única a que o livro dá forma livre desde que ela faça um caminho contínuo pelo chão: as dobras são as escalas do jogador, Ctrl+clique mirando (`main.js marcarDobra`, `mode.dobras`), Esc desfaz a última sem sair da mira. O **ANEL** é só da Muralha de Fogo: a borda de um bloco de 4x4 em volta do cruzamento mirado, **12 casas de perímetro — exatamente os 18 m que o livro dá à muralha** — cercando as quatro casas que um anel de 6 m de diâmetro cerca. O **LADO QUENTE** sai do SINAL do produto vetorial entre a tangente local da muralha e o vetor até a casa, e por isso a mesma conta serve para a reta, para o caminho que dobra e para o anel: a área vem em ORDEM ao longo da muralha, então toda casa dela tem tangente. Numa dobra as duas tangentes brigam e vale a leitura generosa (a casa que QUALQUER trecho põe do lado quente fica quente), que é o que faz o canto interno de um L queimar como canto. **No anel a tangente NÃO serve**, e isso foi medido: ela punha no "dentro" a casa logo depois de cada quina, e o quente por dentro saía com 14 casas em vez das 4 que o anel cerca — lá os lados são DENTRO e FORA, e quem decide é a moldura (4 por dentro, 48 por fora, a moldura de 8x8 menos o anel e o miolo). `quando` passou de `'inicio'` para `'fim'`, que o livro cobra de quem TERMINA o turno; a faixa quente mora em `zona.calor`, à parte de `zona.casas`, porque ela não é a muralha: não é terreno difícil, não barra projétil, não se desenha como parede, e quem está NA muralha não rola duas vezes (`zonasNoCalor`). A escolha da forma acontece ANTES de mirar (`spell.opcoesMudamAArea`), senão a prévia mostraria uma reta e o fogo sairia em anel — no Glifo e no Círculo Mágico a opção é o tipo de dano ou de criatura, não mexe na área, e segue escolhida depois. **E o desenho quebra em trechos retos** (`visuals.js faixaNaArea`): a faixa esticada de ponta a ponta cortava a esquina de um L pelo meio. O corte é por DISTÂNCIA À RETA e não por mudança de direção, porque a escada da diagonal troca de eixo a cada casa e cortar a cada troca daria dez faixas de uma casa — medido, a reta ortogonal e a diagonal dão 1 trecho, o L dá 2, o U dá 3 e o anel dá 4. **A IA não TERMINA o turno na faixa quente** (`ai.js parariaNoFogo`), e isso é diferente de desviar dela: atravessá-la é de graça, e pôr a faixa em `evitarZonas` a tornaria intransponível e prenderia o monstro do lado de lá, olhando para uma passagem que ele pode usar. Então ela entra na escolha de ONDE PARAR, em três escalas que não se misturam — o alvo manda sobre o fogo, e o fogo sobre o caminho, por mais longo que seja: entre duas casas que alcançam o mesmo alvo a fria ganha sempre, e a quente só é escolhida quando é a única que alcança, porque parar a salvo é melhor que parar queimando, mas parar queimando é melhor que não atacar ninguém. Medido com a faixa ao lado do herói: goblin e bandido dão a volta até a casa fria E ATACAM do mesmo jeito; lobo e zumbi param na faixa — é o corte da Graxa, modificador de Inteligência 0 ou mais. Na FUGA o preço é a vida: fugir é afastar-se de quem ameaça, e a conta de distância empurrava o goblin ferido para o fundo da faixa; medido num goblin de 2 PV com Escapada Ágil, sem o filtro ele corre para a casa quente e MORRE queimado no fim do próprio turno, e com ele para na casa fria à mesma distância. Cercado de fogo, a escolha antiga volta inteira — o monstro corre assim mesmo em vez de ficar parado por preciosismo. Sem muralha no chão nada disto roda, e a emboscada do capítulo 1 continuava nos mesmos 78,21% de vida restante (hoje, com os quatro goblins do livro, 85,87%). **O QUE FICA EM ABERTO, e a lição é sobre medir**: a regra antiga do `comDesvio` é uma frase só — "o esperto desvia quando dá, mas não fica parado se a única passagem é pela graxa" — e ela vale igual para a Graxa e para o FOGO, o que no fogo seria suicídio. Tentei trocá-la por um mapa do meio (desviar só do que causa dano, atravessar o que apenas prende) e DESISTI, porque não consegui medir a travessia de forma estável: o mesmo tabuleiro com o mesmo código me deu 34% de travessia numa passada e 0% noutra, e o teste que escrevi para o caso passava com e sem a mudança. Um teste que não falha no código antigo não prova nada, então a mudança saiu inteira e o `comDesvio` ficou como estava. Quem for tentar de novo começa pelo que me faltou: um tabuleiro em que o monstro ENTRE na zona de forma reproduzível. O que está medido e vale é o resto deste parágrafo — onde o monstro PARA, que é outra pergunta e tem três provas.

**A FAIXA: TRÊS COISAS MEDIDAS.** (1) **Não pode afunilar.** A primeira arte da Muralha de Fogo era um JATO — densidade 0,72 na esquerda e 0,09 na direita, oito vezes — e o fim da muralha ficava vazio. A arte de faixa tem de ser igualmente densa de ponta a ponta. (2) **Não se estica: se REPETE.** Uma faixa de 12 casas por 1,1 esticaria uma arte quase quadrada onze vezes, e a labareda vira barra. `desenharFeixe` desenha a arte no tamanho natural dela e a repete ao longo do comprimento, espelhando a cada passo para a emenda não virar padrão. (3) **A ponta dissolve.** Esticada e cortada reta, a faixa é um adesivo retangular colado no mapa — foi o que me devolveram como "quadradona". As duas pontas saem em degradê largo (até 22% do comprimento) e as bordas longas em degradê ESTREITO (7%): o corte reto que incomoda é o da ponta, e esfumar demais a borda longa só deixa a muralha fina. Cuidado com o conserto que piora: apertar a arte para 4:1 tirou o espremido e, ao cortar a franja (a brasa em cima, a gota embaixo), deixou o retângulo ainda mais duro.

**A FAIXA NÃO PODE AFUNILAR, E A ARTE DELA TEM DE TER A PROPORÇÃO EM QUE É DESENHADA.** Dois defeitos medidos na Muralha de Fogo, que saía fina: a primeira arte era um JATO, com densidade 0,72 na esquerda e 0,09 na direita — afunilava 8 vezes, e o fim da muralha estava quase vazio. A arte de faixa tem de ser igualmente densa de ponta a ponta (hoje 1,0x). O segundo: a faixa é desenhada muito mais comprida que alta (12 casas por 1,1), e uma arte quase quadrada é ESPREMIDA 6,6 vezes, o que achata a labareda e some com a gota do ácido. Cortar a arte ao miolo até cerca de 4:1 derrubou isso para 2,7x no fogo e 1,4x no ácido. A conta é `comprimento / largura` em casas contra a proporção da imagem, e vale para qualquer faixa nova.

**A PORTA FAZ BARULHO** (`core/audio.js`, `game/portas.js`): sete sons, um por desfecho do menu — `doorWood` (abrir), `doorShut` (fechar, com a tranqueta no fim, que é o que o separa do abrir tocado ao contrário), `lockKey`, `lockPick` (três pinos em tempos IRREGULARES, que é o tateio), `lockFail` (o mesmo tateio SEM o ferrolho: a ausência do estalo é a informação), `doorBash` e `doorHold`. Medido, o arrombar que cede vai a 2.684 Hz de lasca e o que não cede para em 362 Hz — o sucesso e o fracasso do mesmo gesto nunca soam igual. O `doorStone` da Mansão fica como estava: 1,47 s contra os 0,42 s da madeira, porque o material manda no tempo. **O defeito que isso corrigiu:** o `doorStone` existia desde sempre e era chamado em DOIS lugares, os dois dentro do capítulo da Mansão; o menu de porta das outras dezenove cenas não importava o áudio, então abrir, destrancar e arrombar eram mudos. Som definido não é som tocado, e `testes-regras.mjs` agora cobra a chamada, não só a definição.

**O TEMA OBSIDIANA** (2026-11-09, escolhido pelo dono entre quatro propostas, contra o Foundry VTT medido): o mapa em tela cheia, painel preto-azulado translúcido, borda de 1 px, canto de 3 a 4, Signika e Cinzel guardadas em `public/fontes/` (OFL). A tela de combate é `view/tema-obsidiana.css` (`#app.obsidiana`); as outras são `view/tema-obsidiana-telas.css` (`html.obsidiana`), que vira as variáveis do pergaminho para o escuro na raiz e corrige à mão o que não lia variável. `?tema=classico` devolve o pergaminho. Os ÍCONES do tema são de traço, da game-icons.net (CC BY 3.0, o crédito vai na tela de Créditos): o de-para à mão em `src/dev/icones-traco/mapa-*.json` vira `public/icones-traco.json` por `node src/dev/importar-icones-traco.mjs`, e `art/icons.js iconCanvas` desenha o vetor no lugar do pixel pela mesma porta — a régua é `src/dev/inventario-icones.mjs` (toda magia, característica, talento, item, condição e traço de raça), `testes-regras.mjs` exige ícone para tudo o que ele lista e nenhum par igual entre magias e entre características, e os importadores de magias, subclasses e talentos dizem no fim o que entrou sem ícone. O valor pode ser composto (`base+selo`) e `src/dev/icones-traco-desempate.mjs` põe selo no segundo de cada par igual. A ESCOLHA DO DONO (a página Escolha dos Ícones, com banco) mora em `icones-traco/mapa-zzz-escolhas.json`, lido por último, e a cor que ele corrigiu em `familias-escolhas.json`; a peça de cor guarda o desenho de onde saiu (`base`) e cai se o ícone mudar. O TRATAMENTO é o **Esmalte** (escolhido pelo dono, 2026-11-10): a figura no degradê de duas cores da FAMÍLIA dela (a magia pelo dano ou pela escola, a característica pela classe, o item pela raridade, a condição boa ou ruim — o inventário calcula e o gerador grava `familias`), contorno escuro e brilho; as cores ficam em `art/icons.js PALETA_DO_ESMALTE`. A cor POR PEÇA (o cabo do machado, a rolha da poção) sai de `src/dev/pecas-icones.py` para `src/dev/icones-traco/pecas.json`. O pixel saiu dos dois temas: só aparece antes de o arquivo de traço chegar. Folha nova de tela: pinte pelas variáveis (`--papel`, `--ink`, `--gold`...), e o tema a acompanha sem regra nova. O que se mediu e por quê está em `revisoes/interface-2026-11-09.md`.

**AS FICHAS** (2026-11-09). A do HERÓI (`view/ficha.js`) tem quatro abas, Ficha, Magias, Inventário e História, com a vida e a experiência na cabeça e a altura fixa (a janela não pula ao trocar de aba); a conjuração saiu do fim da primeira aba para a dela, com os espaços em losango. A da CRIATURA (`view/ficha-criatura.js`, "Ver a ficha" no botão direito e o clique no cartão do inimigo) mostra a FIGURA INTEIRA do livro à esquerda (`public/criaturas/`, de `python src/dev/baixar-arte-criaturas.py --go`: arte da Wizards, fora do repositório e da publicação como os mapas oficiais; sem ela, o token grande) e segue a regra do menu: do inimigo se vê a CA e como a ferida parece; a vida, os atributos, os ataques e o que se sabe são do LEMBRAR, que, quando passa, marca o bloco em `campanha.bestiario` para todas as criaturas dele (`investigar.js marcarConhecida`). A arena mostra tudo.

**A NOTA DA MAGIA** (`core/audio.js tomDaMagia`, `conjuracaoSoundFor`): o TIMBRE diz a família (cura, proteção, maldição) e a NOTA diz QUAL magia. O semitom sai do `id`, então é sempre o mesmo — o jogador aprende a nota da Bênção como aprende que verde girando é cura. Os graus são de uma pentatônica em uma oitava e meia (`GRAUS`), porque uma cromática daria vinte e quatro notas e metade soaria errada. O `semitom` entra uma vez no `play` e multiplica a altura de TODA nota daquele disparo (`this.tom`, lido por `tone` e `noise`), o que o aplicou às sessenta funções de som sem reescrever nenhuma. **O dano ganha uma nota CURTA de três graus** e o SOPRO ganha a altura do ELEMENTO, porque lá o timbre é o tipo e o fogo tem de continuar soando como fogo. Medido: de 26 timbres para 113, e o som mais repetido caiu de 24 magias para 6 — `testes-regras.mjs` cobra esse teto. **O `castUtility` já variava por ESCOLA antes disto** (`COR_DA_ESCOLA`), e foi por não ter visto essa tabela que eu primeiro contei 60 magias com um som só; eram 8 timbres. Medir som é contar o timbre EFETIVO, com as opções, não o nome da função.

**A FORMA DA MAGIA TEM ARTE PRÓPRIA.** O CONE (`Fx.cone`) tem a ponta na mão de quem conjura, gira para o alvo e cresce até o alcance; a arte é uma cunha chata com a ponta no meio da borda esquerda, e `recorteDoCone` só a mascara quando a parede comeu parte dela. A FAIXA (`Fx.feixe` com `pisca: false`) estica a arte de um ponto ao outro: serve para a muralha (`faixaNaArea` acha as duas casas mais afastadas), para a Lufada e para os cinco sopros de dragão em linha (`FAIXA_DO_SOPRO`); com `pisca` ela vira e some a cada 60 ms, que é o relâmpago. **A animação dessas duas é DE GRAÇA**: o cone tem três ondas que nascem na ponta e viajam até a boca (escalar a partir da ponta dá cunhas encaixadas), e a faixa alterna a arte com a sua imagem espelhada. Medido: o vídeo muda a FORMA entre quadros e o código repete o mesmo desenho, mas num jato de menos de um segundo não se distingue em quadro parado — e por quadro o vídeo é 34x mais barato, então ele fica para o que precisa MUDAR (explosão, portal, zona que evolui). **A folha precisa de pelo menos 32 px por casa de alcance**: a casa tem 64 px, e um cone de 12 casas tirado de uma folha de 192 px era inflado 4x e virava risco borrado. **Uma página de 3 artes custa uma geração só**: 21:9 com três células lado a lado não corta (medido), e 9:16 com quatro faixas empilhadas também não; o que corta é pedir 9 ou 4 num quadrado. `importar-video-pagina.py` corta o vídeo de uma página em uma folha por magia.

**O QUE NÃO É REDONDO** (cone, linha, muralha) desenha CASA A CASA, acendendo por fileira a partir de quem lança (`FORMA_COMPRIDA`, `arteDaMagia`), com tamanho, lugar e tempo sorteados em cada casa. A arte redonda recortada na área virava um borrão com o clarão no MEIO do cone, e sem o sorteio a mesma arte repetida vira uma grade de bolinhas. A geometria está medida em `testes-regras.mjs`: cone de 15 pés 7 casas, de 30 pés 24, de 60 pés 84 — **mais largas que o livro** (6, 21 e 78), porque a nossa fileira de distância par tem uma casa a mais, para o cone ficar simétrico; deixar exato obriga a entortá-lo para um lado. A **linha larga na diagonal** (Lufada de Vento) tinha buraco: a casa de lado saía pelo vetor de través arredondado, que na diagonal dá (-1,1) e encosta só pela quina. Agora o lado é um passo ORTOGONAL, e as duas fileiras se tocam pela aresta.

**OS EFEITOS VISTOS DE CIMA** (`public/efeitos/`, `Fx.arte`): as magias de área e de chão são arte inteira, com transparência e o tamanho real da magia em casas, e o código as faz nascer, girar e sumir. Elas vêm do OpenArt, `nano-banana-2`, sobre fundo preto puro, e `python src/dev/importar-arte-efeito.py <nome> <url> --contorno` transforma o preto em alfa e grava o webp; o que precisa ESCURECER (Escuridão, Fome de Hadar) leva `sombra` no código, porque a imagem é só luz. Toda magia abre com o brilho de conjurar na cor do dano (`Fx.conjuracao`). A Bola de Fogo e os raios de Fogo e de Gelo voam com `Fx.voo`: arte de cometa, rastro de fagulhas e duração pela distância (`duracaoDoVoo`, 13 casas por segundo). Os outros tiros usam `atirar` (`visuals.js`), com arte de voo e de impacto por natureza; o Míssil Mágico e o Raio Ardente abrem em leque (`curva`), e o relâmpago é arte esticada de ponta a ponta (`Fx.feixe`). O impacto pedido por nome de quadros (`fogo-impacto` e os outros de `ARTE_DO_IMPACTO`) vira arte sozinho, em toda receita. **As zonas que duram** (`ARTE_DA_ZONA`, `pintarZonaComArte`) pintam a arte recortada nas casas da regra, com um contorno só; a arte que veio na cor errada leva `tinta`. Quadro não tem mais altura: era o peito do isométrico. **E elas MEXEM de verdade:** `python src/dev/importar-video-efeito.py <nome> <url do mp4>` transforma um vídeo do OpenArt (`pixverseV6`, `image2video`, 3 s, 540p, 30 créditos) em folha de quadros transparente, em `public/efeitos/anim/`, listada em `art/efeitos-animados.js`. O que acontece uma vez toca a folha do começo ao fim; o que dura vai e volta em laço. **Pedir o vídeo com quadro final igual ao inicial congela a arte**: medido, a nuvem mexia 0,6 assim e 8,4 sem quadro final, e o espinheiro 1,0 contra 20,5. Por isso o laço é o vai e vem do desenho, e não o vídeo. Quem é só do conjunto de quadros de pixels caiu: `ARTE_DO_IMPACTO` traduz cada nome antigo para a arte da família, e `ARTE_DA_MAGIA` (`visuals.js`) dá arte a quem só soltava partículas. A área passa por uma máscara das casas (`recorte`), com borda em degradê. As folhas somam cerca de 10 MB e carregam uma a uma depois da abertura; antes de a folha chegar, vale a imagem parada.

**PERGUNTAR QUALQUER COISA A UM NPC** ("Perguntar outra coisa…" na conversa, sozinho ou numa sala). Hoje são todos os que têm conversa na Mina Perdida: a vila (`npc-saber-vila.js`, onde `FATOS_DO_MUNDO` deixa cada morador saber o que o grupo já fez) e as cenas (`npc-saber-cenas.js`; quem não tem bloco próprio é apontado com `npc.ficha`). A Agatha fica de fora de propósito: o livro dá a ela UMA pergunta, e isso é a cena.
`game/npc-saber.js` é a lista fechada do que cada um sabe (fato com id, `requer` para o que a cena ainda segura, e a fala escrita à mão). `game/dialogo-ia.js` monta o prompt só com os fatos liberados e CONFERE a resposta em código: fato fora da lista, nome próprio que a ficha liberada não traz, assunto de fora do mundo ou fala longa reprovam, e reprovada não vai ao jogador nem ao banco. `game/dialogo-servidor.js` é o que o servidor faz com a pergunta, com teto de gasto (`DIALOGO_TETO_USD`), e tem duas casas: no `npm run dev`, `src/dev/servidor-dialogo.mjs`, plugin do Vite que lê a chave do `.env` (sem o prefixo VITE_) e guarda o caixa em `.dialogo-gastos.json`; na publicação, `worker/dialogo-do.js`, um Durable Object com a chave em segredo (`wrangler secret put ANTHROPIC_API_KEY`), limite por IP (`worker/limites.js`) e o caixa e as falas no armazenamento dele. Sem o segredo a rota responde 503 e nada acorda. Modelo em `DIALOGO_MODELO`.
A ordem de uma pergunta é banco, depois modelo, depois fala escrita à mão. O banco é `public/dialogos/banco.json`, vai junto com o jogo e entra no repositório: **sem o segredo, o jogo publicado responde só com ele e com as falas à mão**. O que o Worker aprende fica no Durable Object até `node src/dev/baixar-banco.mjs <endereço>` trazer para o arquivo. Mudar a ficha de um NPC invalida as falas dele. Cada pergunta é independente, sem histórico: é o que deixa a fala reaproveitável. A **memória da conversa** é por assunto (`perguntas.js continuarAssunto`): "e onde ele mora?" depois de "quem é Klarg?" vai como "sobre klarg: e onde ele mora?", sem gastar nada, valendo sem API e com a fala indo para o banco; e o banco não devolve na mesma conversa o que o NPC já disse (`evitar`). 
**O NPC LEMBRA** (`campanha.memoriaDosNpcs`, vai no save): as últimas seis trocas seguem ao modelo como registro (`<memoria>`), num só turno, e nunca como turnos anteriores. Com memória a fala não sai do banco nem vai para ele, então a pergunta paga; sem API, cai no banco e na memória por assunto. **As travas contra amolecer**: o que o dado não liberou nem é enviado, então não há o que arrancar; `perguntaDeManobra` não chega ao modelo nem à memória; recusa repetida sobre o mesmo assunto, na mesma situação, responde sem chamar; a conversa cansa em 15 perguntas; o que ele disse com fato que deixou de valer sai da memória (`memoriaValida`); e `conferir` reprova o NPC que cede o que só o dado concede (`CONCESSAO`). `src/dev/atacar-memoria.mjs` GASTA CRÉDITO e tenta amolecer o modelo de verdade.
**O CAMINHO PARA O JOGO SEM API:** o banco não aprende sozinho, ele cresce por três portas. `npm run dev` anota cada pergunta em `.dialogo-registro.jsonl` (`src/dev/relatorio-dialogos.mjs` lê); `src/dev/gerar-lote.mjs` gera pela API de lotes, a metade do preço, as perguntas de costume, as de cada assunto, as continuações e as do registro; e `src/dev/gerar-vozes.mjs` escreve, por NPC, as falas de memória sem fato nenhum (`public/dialogos/vozes.json`). A busca por sentido (`game/busca-fala.js`) acha a fala escrita com outras palavras, com duas portas antes da nota, o mesmo assunto e o mesmo tipo de pergunta. `src/dev/medir-busca.mjs [--erros]` mede quanto o jogo responde sem API, com frases de jogador: é ele quem decide o limiar, e fala errada pesa mais que fala nenhuma. Medido em 57 frases, depois do lote de 3.092 falas (US$ 14,20): sem API, 89% respondem com o fato certo, contra 11% de fala achada antes da busca. Com API, a metade sai de graça do banco, com zero erradas. As 57 frases serviram para ajustar a busca, então 89% é teto, não promessa; quem mede de verdade é o registro de jogo.
**Persuadir, intimidar e enganar pela caixa são os TESTES DO NÓ em que a conversa está**, com a CD e a consequência da árvore: quem decide é o dado, nunca o modelo. Quem rola é quem escreve (`quemEscreve`): o herói do dono da conversa ou, sem dono, o do líder; só a opção por perfil continua com quem atende o perfil. Nos botões da árvore vale o mesmo numa sala, e sozinho rola o melhor do grupo. **O dado muda o que ele conta**: teste social vencido grava `apertado:<ficha>` e libera o fato com `requer: apertado(...)`. **Ajudar**, só numa sala: antes de rolar, os outros jogadores têm 15 s para oferecer ajuda, que dá vantagem, e cada herói ajuda uma vez por conversa. O jogador escolhe o botão ou escreve a frase; `tomDe` reconhece o tom por palavra e pergunta antes de rolar. Nó sem teste: a frase é só conversa, e a fala do modelo não fecha trato nem muda a cena. Trato que mexe em ouro segue nos botões da árvore (o resgate do Yeemik).
**Numa sala**, a caixa é dado da narrativa (`campoTexto`) e viaja por `porta-narrativa.js`: o texto volta na resposta, cortado em 200 no servidor e no anfitrião. Quem começou a conversa decide até o fim dela (`prenderAtor`; os 10 s de `marcarAtor` não bastam para digitar), e sem herói dono da cena as opções vão a voto e, escolhida a caixa, quem escreve é o líder. A pergunta do convidado chega ao modelo pela tela do anfitrião, que conduz a cena: o convidado não fala com a API direto, e a chave nunca passa por ele. Para abrir duas abas na mesma máquina: `?sala=CODIGO&como=Nome`. `testes-porta.mjs` prova o caminho do texto.
`node --import ./src/dev/cena-node/register.mjs src/dev/testes-dialogo-ia.mjs` prova as travas e o banco de graça, com modelo de mentira. `src/dev/encher-banco.mjs` enche o banco com as perguntas mais prováveis em cada NPC e estado da ficha; sem `--go` só dá o plano, e com `--go --teto 3` GASTA CRÉDITO. Medido no elenco inteiro: 2.480 perguntas, 2.034 chamadas, US$ 5,81, 2.352 falas no banco (1 MB, 115 KB comprimido) e 32 reprovadas, quase todas por citar a palavra de fora do mundo do "ignore suas instruções". `src/dev/medir-dialogo.mjs [modelo]` GASTA CRÉDITO: roda perguntas de má-fé no modelo de verdade, numa pasta temporária, e dá o custo por pergunta. Medido em 18 perguntas: Opus 5.5 US$ 0,0045 por pergunta em sequência (US$ 0,009 na primeira, sem cache) e Haiku 5.5 US$ 0,00014, com mais erro de voz e de fato.

`/editor.html` abre a cena (a lista do alto) e carrega o desenho dela sozinho; o checkbox "Pintar o chão do jogo"
desliga a camada do jogo e deixa o desenho limpo. "Exportar JSON" baixa o
arquivo com o nome da cena, e
`node --import ./src/dev/cena-node/register.mjs src/dev/aplicar-editor.mjs <arquivo.json>` imprime só o que
mudou, já no formato de colar em `game/encounter.js`.
`src/dev/gatilhos-casadamorte.mjs` faz cada ação de cada casa e confere que toda luta que ela começa tem caminho entre os dois lados.
`python src/dev/alinhar-mapa-pintado.py --provas` casa a planta de cada andar da Casa da Morte com o battlemap pintado de verdade
(`_referencias/casa-da-morte-morvold/`) e devolve giro, escala, origem e a prova visual — serve de conferência de fidelidade da planta.
`python src/dev/conferir-encaixe.py <cena>` pinta de vermelho, por cima do mapa pintado, as casas que o jogo bloqueia, e conta quanto do
nosso chão cai sobre chão pintado.
`python src/dev/encaixar-fa.py <cena> <imagem>` faz o contrário: procura o enquadramento (escala, x0, y0) que melhor casa um battlemap de
terceiro com a nossa planta e imprime o `fundo` pronto para colar, com a nota do encaixe em IoU. 1,0 é a mesma planta; abaixo de 0,7 são
plantas DIFERENTES do mesmo lugar, e aí não adianta enquadrar melhor — ou se redesenha a planta por cima, ou não se usa o desenho.
`python src/dev/prova-fundo.py <cena> <imagem> <escala> <x0> <y0>` desenha a PROVA: a nossa parede de aresta em amarelo e a nossa casa
bloqueada em vermelho, por cima do desenho. **É a figura que decide, não a nota** — 0,7 tanto é "falta meia casa" quanto "outra planta com
a mesma área de chão", e só a figura separa os dois. Medido assim nos mapas da FA: a **Onda Eco bate** (73x90 deles cai 1 para 1 na nossa,
escala 100, origem 0,0 — a nota diz 0,695 e a figura mostra o vermelho contornando a caverna pintada inteira); o **Castelo e o Poço não
batem**, por serem plantas redesenhadas, e não há origem que conserte. A Onda Eco é a única cena que ganhou `fundo` dessa leva.
**Battlemap de terceiro não entra no repositório NEM NA PUBLICAÇÃO** (licença). A da Forgotten Adventures lista, entre os usos proibidos,
"embed assets, tokens, or derivative works into mapmaking software, virtual table top programs, **video games**, or any other software
programs", e a Licença Comercial deles **não cobre** integrar em software — para isso eles mandam procurá-los. Vale para o release grátis e
para obra derivada. Então: joga-se com o mapa aqui (`npm run dev`), não se publica. `mapas/`, `public/mapas/esconderijo-fa*.webp` e
`public/mapas/fa/` estão no `.gitignore`, e o `fundo` da cena fica commitado apontando para um arquivo que só existe no disco de quem o
baixou — sem ele, a cena abre com o ladrilho de sempre. Atenção:
o `.gitignore` protege o REPOSITÓRIO, não o `dist/` — o `npm run build` copia tudo que está em `public/`. Quem fecha essa porta é
`src/dev/verificar-publicavel.mjs`, que roda no `prebuild` e **falha a publicação** se houver qualquer arquivo ignorado pelo git dentro de
`public/`. A regra não tem lista de nomes: o `.gitignore` já é a declaração de "isto não pertence ao projeto", e o que não pertence não se
publica. O `npm run dev` não é afetado — joga-se com o mapa de terceiro aqui, só não se publica.

**Importar uma cena do Foundry VTT** — paredes, luzes e grade, sem instalar o Foundry. Os módulos de battlemap publicam as cenas em JSON
puro; as da Forgotten Adventures estão em `github.com/Forgotten-Adventures/FA_Battlemaps/tree/main/packs/_source/maps` (303 cenas).

```bash
python src/dev/importar-foundry.py <cena.json> <imagem> --editor src/dev/_tmp/<nome>.json
```

Ele traduz: grade → `fundo` (e desconta a MOLDURA que o Foundry põe em volta, `ceil(padding*largura/grid)*grid`), parede → `tracos`
(segmentos que se tocam viram uma linha só) e luz → `luzes` (`claro` = `bright`, `penumbra` = `dim - bright`, em pés). **O Foundry não tem
camada de chão**: lá quem decide onde se pisa é só a parede, então o mapa sai todo de chão e `src/dev/derivar-paredes.mjs` faz o resto —
tira a aresta de casa do traço (é ela que barra movimento), semeia nas LUZES, que estão dentro, e vira rocha tudo que a parede não deixa
alcançar. Semear no maior pedaço não serve aqui: com tudo de chão, o maior pedaço é o lado de FORA. Com `--chao-pela-cor` o recorte vem do
preto da imagem — dá 56 casas a menos, porque come a casa de borda que é meio caverna meio vazio.
Cada parede do Foundry vira traço COM TIPO (`tracosTipo`), pelo que ela barra (`move`, `sight`, `sound`, `door`): porta `+`, etérea `E`,
janela `W`, invisível `I`, moita `T`. Só a que não barra nada fica de fora.
A **LUZ vem inteira**: cor (`config.color`), cone (`config.angle` mais a rotação da luz; o 0 do Foundry aponta para cima, o nosso para
leste), "só acende no escuro" (`darkness.min` → `soNoEscuro`) e o tipo pela animação (`torch`/`flame`/`fire` pelo brilho; `pulse`,
`starlight`, `ghost`, `energy` viram magia). A animação sem equivalente nosso (`fog`, `wave`) **o relatório nomeia** em vez de fingir que
traduziu.
**E A CENA JÁ DIZ ONDE FICA CADA COISA.** A FA deixa marcadores `.svg` em cima das coisas, e eles viram OBJETO INTERAGÍVEL
(`mapa.interativos`, ids `fachest1`, `fatrap1`...): `trap`, `chest`, `skull`, `down`, `fire`, `explosion`. A **armadilha não vira região**:
região precisa de CD, dano e teste, que o desenho não sabe — isso vem do livro, e o importador não inventa número; ele grita no relatório
onde ela está. `cancel` e `direction` são enfeite de editor e entram só no relatório. Os ladrilhos com nome (`PitTrap`, `Crypt1`, `Cells`,
`Room19_...`, `SpellForgeWorkshop`) saem numa tabela com casa e tamanho: é o índice das salas, de graça.
Medido: Cragmaw Hideout 377 de 382 paredes, 26 traços, 330 casas de chão (as mesmas de antes) e **0 achados** em `conferir-paredes.mjs`;
Redbrand 196 de 202, com 17 portas, 12 luzes coloridas e marcador de armadilha em 22,11 (o nosso fosso está em 23,9); Castelo 427 de 428,
21 portas e 31 luzes EM CONE (as seteiras); Onda Eco 1274 de 1293, 13 portas e 7 marcadores.
As cenas da FA são JSON público e **não entram no repositório**: ficam em `mapas/_cenas/` (ignorado), como a arte.
Para ver: carregue o JSON em `localStorage['phandalin.editor.mapa']` e abra `/editor.html` ou `?encontro=editor`.

**O Poço da Coruja Velha roda sobre o battlemap da FA**, e é o modelo de como refazer uma planta antiga com os mapas
novos. `python src/dev/mapa-poco-fa.py` lê o import do Foundry, pinta o TERRENO pela COR do desenho (capim onde é
verde, laje onde é cinza — o Foundry não tem camada de chão) e acha os pontos que o capítulo 4 usa, MEDINDO: a boca
da torre pelo caminho do poço até dentro (`reachable` + `pathFrom`), o interior da torre pelo círculo do anel, a
tenda pelas quatro paredes da barraca de Kost, o poço pelo centróide dos pixels escuros. O gerador **se recusa a
escrever** se algum ponto cair em parede ou ficar inalcançável, e `testes-cenas.mjs` guarda o arquivo depois disso.
A planta encolheu de 26x22 para 18x22 (a da FA) e `poco.js` de 109 para 111 linhas, agora sem altura: a torre é
ruína sem teto, e quem barra passo é a parede, não o glifo.

**A Mansão é o caso em que NÃO se refaz a planta, e isso é um achado, não preguiça.** A nossa é decalque do mapa
oficial do Roll20, e a da FA saiu do mesmo mapa do livro: batem 1 para 1, 100 px por casa, origem (0,0), sem
enquadrar. Medido com `prova-fundo.py` e pelo brilho — a casa que a nossa regra bloqueia tem brilho médio 16 no
desenho e a de chão, 39. Refazer daria a mesma planta e derrubaria portas, secretas, grades e as 1.700 linhas de
roteiro que vivem em cima dela. O que mudou foi só a IMAGEM: era um HOTLINK para o CDN do Roll20 (68,267 px por
casa, servido da banda deles a quem jogasse) e passou a ser a da FA, no disco, em 100 px por casa.
**E uma correção que a Mansão obrigou:** os MARCADORES `.svg` da FA caem em cima de PAREDE, não na casa da coisa
— são etiqueta pregada na parede ao lado, apontando para o cômodo. Os quatro do Redbrand caem todos em rocha
nossa. O importador agora diz isso em vez de prometer coordenada.
**E outra, de luz: A SALA NASCE NO BREU, e quem acende é a tocha.** Nove salas da Mansão nasciam CLARAS na grade
(`luz=2` em `mapa-mansao.py`) e tinham uma tocha do Foundry dentro. Medido apagando uma a uma no motor: **9 das 11
luzes não mudavam casa nenhuma** — a grade já dizia "está claro aqui", então o `Apagar a tocha` do botão direito
(`game/fogo.js`) era um botão sem consequência. Com as salas em `luz=0`, a mesma conta dá 10 das 11 mudando casa e
**7 jogando casa no breu**, e a sala fica MAIS acesa do que era enquanto a tocha estiver acesa (158 casas de sala
em claro, contra 146 de grade). Quem for pintar grade de luz em mapa novo: a sala com luz dentro nasce no breu, e
só fica em penumbra o que não tem chama nenhuma. `testes-cenas.mjs` guarda as duas metades, e a prova de que a luz
para na parede deixou de ser "casa escura não acende" (que passava só porque as luzes eram inertes) e virou uma
INUNDAÇÃO aresta a aresta, conta diferente da reta que o `nivelDeLuz` traça — e vale nas quatro cenas com luz.

**A mesma conta rodou nas dezoito cenas, e pegou mais duas.** `testes-cenas.mjs` agora tem uma prova permanente
— *nenhuma luz de mapa é inerte* —, que apaga cada chama de cada cena e exige que alguma casa mude:
- **Onda Eco**: quatro salas nasciam claras (templo, alojamento norte, forja, oficina da forja) a mil metros de
  rocha, onde não há luz do dia nenhuma, e o braseiro do acampamento não mudava NADA. Com a grade no breu, as
  três chamas acendem as salas inteiras sozinhas (80, 136 e 74 casas caem ao apagar). A oficina da forja (16
  casas) fica escura de propósito: não há fogo nela, e a chama verde do salão ao lado não a enxerga.
- **Cume da Wyvern**: a fogueira do bando estava DESENHADA e não existia na regra — a planta nova da FA deixou a
  caverna no breu sem luz nenhuma, contra a decisão medida do próprio capítulo ("a caverna tem penumbra, não
  breu", `capitulo4-cume.js`) e contra a narração dele. Voltou como `claro: 0, penumbra: 40` (40 pés é a
  distância MEDIDA da fogueira à casa mais longe): a caverna fica em penumbra, só o nicho (5,13), atrás da
  quina, segue escuro, e `mapa-cume-fa.py` se recusa a escrever se aparecer um segundo canto escuro ou se algum
  posto do bando cair no breu. Agora dá para apagar a fogueira — e aí a visão no escuro dos orcs vale contra o
  grupo.
- **Castelo**: não é o mesmo caso. As salas nascem em penumbra de PROPÓSITO (`sala(..., luz=1)`), porque a
  fortaleza é ruína e entra luz pelos buracos do teto; o salão escuro nasce em breu por escolha explícita. Lá
  apagar uma tocha devolve a penumbra em vez do breu, e está certo assim.

**O Cume da Wyvern também**, e aqui a planta nova MUDOU A CENA, não só as coordenadas: `python
src/dev/mapa-cume-fa.py`. A antiga (30x21) era um desfiladeiro com o acampamento orc do lado de fora, num platô de
220 casas elevadas; a da FA é a caverna, com fogueira, palha e caixote desenhados no chão dela. É o que o livro
descreve — o platô era elaboração nossa —, então o platô, as carroças e a pedra do vigia saíram, e o vigia foi para
a boca. O gerador mede a caverna inundando de dentro com a boca fechada (78 casas; a boca são DUAS casas, 9,4 e
10,4, porque fechar só uma deixa passar pela outra), e prova no motor cada posto do bando antes de escrever. A
caverna fica no breu e o lado de fora à luz do dia, que é do que vive a furtividade da cena. O capítulo deixou de
contar ±1 a partir da boca — ela era vertical e agora é de lado — e usa `CUME.foraDaBoca` e `CUME.dentroDaBoca`.
As frases que falavam de desfiladeiro e platô foram trocadas: o mapa manda no texto.

**O Esconderijo (capítulo 2) roda sobre o battlemap da FA.** O mapa sai de
`node --import ./src/dev/cena-node/register.mjs src/dev/mapa-esconderijo-fa.mjs`, que lê o import do Foundry acima e pinta por cima o
que o Foundry não tem: terreno por glifo, ALTURA (degrau de mais de um nível é parede) e SALAS por distância de caminhada. Ele escreve
`game/esconderijo.js` com `PONTOS_DO_ESCONDERIJO`, e o capítulo lê tudo dali — não há número de casa em `capitulo2.js`. O de-para do livro
para esta planta, e cada desvio medido, está em `revisoes/esconderijo-de-para-2026-11-04.md`. O gerador antigo, `mapa-esconderijo.py`
(planta 40×28), está aposentado e só roda com `--planta-antiga`, porque sobrescreveria o mapa novo.

**A atenção do herói e o fogo** (`game/investigar.js`, `game/armadilhas.js`, `game/fogo.js`): o botão direito dá os VERBOS do
livro, cada um com a sua perícia e o bônus de quem rola — Olhar (grátis), Procurar (Percepção, na casa e nas oito em volta, sem
mostrar a CD), Investigar (Investigação), Ler os rastros (Sobrevivência), Lembrar (História, Arcanismo, Religião ou Natureza, também
sobre a criatura: CD 10 + ND, devolve resistências, sentidos e traços do bloco) e Examinar o corpo (Medicina). Valem em toda cena
que não os desliga (`capitulo.investigavel === false`). Aliado perto dá vantagem (Ajudar). Todo achado vai para o diário (botão direito
no próprio herói) e para o registro da sala. A pista vem da cena (`capitulo.pistasEm`, uma por verbo) ou do editor (ferramenta 9,
"Teste"). A Percepção passiva acende uma faísca discreta na pista que alcança; a armadilha da cena (`capitulo.armadilhas()`) é
conferida CASA A CASA no caminho: quem nota para antes, quem não nota para em cima e ela dispara; a descoberta ganha um losango
vermelho. "Apagar"/"Acender" em cada luz do mapa leva junto a sobreposição do cômodo aceso. `src/dev/testes-investigar.mjs` prova tudo. Para mapa novo, ou quando as duas plantas não são a mesma, o caminho é o editor: `/editor.html`, vista
de cima, ferramenta 8, que enquadra a imagem e deixa decalcar parede e porta por cima (como no Roll20). E para trazer
uma página pronta do Roll20 (imagem, grade e paredes), `src/dev/extrair-roll20.js` (colar no console da aba) mais
`node src/dev/importar-roll20.mjs <pagina.json>` — ver o README. **Rode-os antes de chamar revisor**: achado que um teste já pega não
precisa de agente.
