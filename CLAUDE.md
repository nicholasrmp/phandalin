# CLAUDE.md — Phandalin

RPG tático cooperativo no navegador, regras do **SRD 5.1**, grade isométrica de
1,5 m. O que o jogo é e o que já funciona está no [README.md](README.md); este
arquivo é só o **elenco de revisores e skills** que o projeto usa para julgar o
próprio trabalho.

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
musica, editor, casadamorte, regioes, criador, sala-criados, arestas, luz, nevoa, rota, tracos, armadilhas). O de editor, o da Casa da Morte, o das regiões, o do
criador, o do herói criado na sala e o das arestas rodam com
`node --import ./src/dev/cena-node/register.mjs src/dev/testes-<nome>.mjs`;
`src/dev/simular-casadamorte.mjs` joga as lutas da Casa da Morte e
`src/dev/passeio-casadamorte.mjs [sacrificar|negar] [semente]` percorre a casa inteira, do jardim à saída, como um jogador automático.
`node --import ./src/dev/cena-node/register.mjs src/dev/conferir-paredes.mjs` confere PAREDE E PORTA das vinte
cenas rodando o motor: porta no maciço, porta que não separa nada, chão que nenhuma entrada alcança (com a
fronteira da ilha), `folhas` e `grades` apontando aresta errada. Ele sabe o que o roteiro abre (as secretas da
Mansão, o segredo da prisão, as lajes das criptas) e o que é de propósito (o anel de fora da casa, a cela de
grade, a escada que se pega pelo botão), então 0 achados quer dizer 0 mesmo; `--tudo` solta os avisos fracos.
`src/dev/testes-paredes.mjs` prova que ele acusa cada defeito. Para corrigir, `/editor.html` abre qualquer uma
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
