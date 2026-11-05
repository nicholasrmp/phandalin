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
musica, editor, casadamorte, regioes, criador, sala-criados, arestas, luz, nevoa, rota, tracos). O de editor, o da Casa da Morte, o das regiões, o do
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
(enquanto ligada), acender/apagar uma sobreposição, ligar/desligar outra região e teleporte; o dano pode deixar com uma condição quem
falha no teste dele (`seFalhar`). Filtros: quem (todos, o grupo, os inimigos), tamanho mínimo (`tamanhoMinimo`, a laje que o goblin
atravessa), quantas vezes, começa desligada, pega quem voa. Exemplo de cena: a **laje rachada do esconderijo** (`encounter.js`,
`regioes` do esconderijo) era roteiro de `capitulo2.js` e hoje é só uma região; o capítulo guarda só o painel da queda (`naRegiao`). **Escondida** vira armadilha sem roteiro: a Percepção passiva nota antes
(`game/armadilhas.js`), o Procurar e o Encontrar Armadilhas acham, e descoberta ela não pega mais o grupo (o monstro não sabe dela). Roda
dentro do `moveAlong`, então vale para herói e monstro, na luta e explorando. A cena que quer mais (ir para outra cena) ouve
`capitulo.naRegiao(regiao, criatura, quando)`. No editor é a ferramenta **R**: pincel, retângulo, polígono e balde, e o formulário dos
efeitos no painel. O campo recebe uma CÓPIA (como a sobreposição). `src/dev/testes-regioes.mjs` prova cada efeito.

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
**Battlemap de terceiro não entra no repositório** (licença): `mapas/` e `public/mapas/esconderijo-fa*.webp` estão no `.gitignore`. Atenção:
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
janela `W`, invisível `I`, moita `T`. Só a que não barra nada fica de fora. O relatório conta cada tipo e diz o que NÃO atravessa:
ladrilho de overlay, som e região.
Medido no Cragmaw Hideout: 371 de 382 paredes, 23 traços, 3 luzes, 330 casas de chão, e **0 achados** em `conferir-paredes.mjs`.
Para ver: carregue o JSON em `localStorage['phandalin.editor.mapa']` e abra `/editor.html` ou `?encontro=editor`.

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
