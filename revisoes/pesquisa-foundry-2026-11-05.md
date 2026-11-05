# O Foundry VTT e o que o Phandalin pode tirar dele — 2026-11-05

Decisão do dono do projeto nesta data: **não haverá mais vista isométrica**. O jogo passa a ser só a vista de cima,
no modelo do Foundry. Esta pesquisa lê a documentação do Foundry (v14, a atual), os repositórios oficiais e da
comunidade, e mesas virtuais abertas parecidas, e cruza cada ideia com o que o Phandalin já faz hoje (conferido no
código, não de memória).

Fontes lidas: a referência da API (`foundryvtt.com/api`, v14.370), os artigos da base de conhecimento (Walls,
Lighting, Tokens, Scenes, Scene Regions, Dynamic Token Rings, Combat, Measurement), o repositório `foundryvtt/dnd5e`
(MIT), os tipos `League-of-Foundry-Developers/foundry-vtt-types` (MIT), o sistema `foundryvtt-dcc/dcc` (MIT), os módulos
mais usados da comunidade e as mesas abertas MapTool, Owlbear Rodeo 1.0, Dungeon Revealer, Atlas VTT, Ogres,
Dungeoneer, Improved Initiative e AboveVTT.

---

## 1. Como o Foundry é montado

**Tudo é documento.** Mais de 30 tipos: Scene, Actor, Item, Combat, JournalEntry, RollTable… Dentro da cena moram
os documentos embutidos: Token, Wall, AmbientLight, AmbientSound, Tile, Drawing, Note, Region. Cada documento tem um
esquema de campos tipados (`DataModel`), e o sistema de jogo (o dnd5e) estende os de Actor e Item com os dele
(`TypeDataModel`). Isso é o que deixa um mapa, uma ficha ou uma aventura virarem JSON portátil — e é por isso que o
nosso importador de cena do Foundry funcionou.

**O canvas é feito de camadas.** Fundo → tiles → paredes → luz → fichas → efeitos → névoa → interface. Cada camada tem
os seus "placeables" e a sua ferramenta no painel da esquerda. O Phandalin já pensa assim no editor (ferramentas de
1 a 9, Q e 0); o jogo ainda não tem a interface de camadas para o mestre.

**Ganchos (`Hooks`).** Todo evento passa por um barramento com nome (`updateToken`, `preCreateWall`, `combatTurn`…),
e os módulos se penduram nele. É o que faz centenas de módulos conviverem. O Phandalin faz a mesma coisa à mão em cada
capítulo (`capitulo.depoisDeMover`, `aoInteragir`, `pistasEm`, `armadilhas`): funciona, mas cada gancho é um nome
inventado num lugar.

**Separação de regra e mesa.** O núcleo do Foundry não sabe D&D: quem sabe é o sistema dnd5e. O sistema DCC vai um
passo além e tira a regra para uma biblioteca pura (`dcc-core-lib`), testada sem o Foundry, com uma camada `adapter`
no meio. O Phandalin já é assim: `src/rules/` é o motor, testado em Node por `testes-regras.mjs`.

---

## 2. O Foundry, peça por peça, contra o Phandalin de hoje

| Peça do Foundry | Como o Foundry faz | O Phandalin hoje | Vale trazer? |
|---|---|---|---|
| **Parede** | Segmento livre (`c: [x0,y0,x1,y1]`) com QUATRO restrições independentes: movimento, visão, luz, som. Cada uma NONE, LIMITED (a 1ª não barra, a 2ª barra), NORMAL, PROXIMITY ou DISTANCE (barra só de longe ou só de perto). Direção (as duas faces, só esquerda, só direita). Predefinições: sólida, terreno, invisível, etérea, janela | Traço livre (`tracos`) que barra tudo, mais aresta de casa com parede, porta, porta aberta e seteira. Não dá para ter parede que barra a visão e deixa passar, nem o contrário, nem de mão única | **Sim.** Parede etérea (passagem secreta que se vê como parede), invisível (barreira mágica), terreno (moita, pedregulho: vê-se o obstáculo, não o que há atrás) e janela resolvem casos que hoje viram código de capítulo |
| **Porta** | Parede com `door` (nenhuma, porta, secreta) e `ds` (fechada, aberta, trancada). Trancada chocalha. Secreta só o mestre vê. Animação de abrir e som próprio | Porta, porta aberta e passagem secreta por aresta. Trancar é roteiro de cena | **Sim, o estado trancada** como dado (com CD de Ladinagem/Atletismo), e o som de chocalhar |
| **Luz** | Raio claro e penumbra, ângulo de emissão (cone), cor e intensidade, luminosidade, atenuação gradual, animação (tocha, tremular, pulsar…), **faixa de escuridão em que acende** (o lampião da rua só à noite), fonte de **escuridão** com prioridade, limitada por parede | Claro e penumbra em pés, acende e apaga com a sobreposição do cômodo, polígono de raios recortado por parede, brilho quente que tremula | **Sim: cor e animação por luz** (fogueira laranja, lanterna azulada de magia), **cone** (lanterna coberta, que o livro tem), **faixa de escuridão** (Phandalin de noite acende as janelas) |
| **Escuridão da cena** | Nível de 0 (dia) a 1 (noite), com transição suave para todos; iluminação global que liga e desliga num limiar | `field.luz` por casa, fixo por mapa | **Sim**: a vila tem dia e noite; um nível contínuo deixaria a transição animada e a regra de luz sairia dele |
| **Visão da ficha** | Alcance, ângulo, modo (básica, visão no escuro, monocromática, sentido sísmico, amplificação) e **modos de detecção** separados: "Ver" pede linha de visão, "Sentir" atravessa parede | Visão no escuro, tocha e magia Luz; o grupo vê pela união | **Parcial.** O módulo `vision-5e` (MIT) lista as regras do 5e: visão cega, sentido sísmico, visão verdadeira, ver invisibilidade, e **audição** com alcance `15 + 2,5 × (Percepção passiva − 10)` pés, barrada por parede de som. A audição casa com o "Escutar" que já temos: o goblin ouvido vira uma marca no mapa, sem a ficha |
| **Névoa explorada** | Por jogador, guardada no banco: o que já foi visto fica desenhado, apagado e sem fichas; o que nunca foi visto fica preto. Modo compartilhado (v14) | O que não se vê agora é preto, e nada é lembrado | **Sim, como opção de cena.** O pedido de hoje foi preto total; a névoa explorada não mostra fichas nem o que mudou, só a planta lembrada, que é o que um jogador desenharia num papel. Fica a escolha por mapa |
| **Ficha (token)** | Disposição (amigo verde-azulado, neutro amarelo, hostil vermelho, secreto), duas barras de recurso, placa de nome com seis níveis de visibilidade, escala da arte separada da pegada, ícones de condição em cima, **anel dinâmico** | Ficha redonda com a arte da criatura, fio na cor do lado, barra de vida e nome | **Sim:** **ícones de condição** na ficha (caído, envenenado, concentrando); a **visibilidade da barra de vida** (ninguém vê o número do inimigo: o "ferido, muito ferido" que o menu já tem) e o **anel reage** |
| **Anel dinâmico** | A ficha é três camadas guardadas à parte: a arte (subject), o anel e o fundo, juntas só na tela. O anel tem uma faixa que o jogo anima: brilha quando a criatura é alvo, pisca no dano. A arte some no anel a 2/3 do raio, e o que passa de 2/3 "salta" por cima dele | O anel vem queimado na imagem (o da galeria) | **Sim, para o criador de personagem**: o jogador envia SÓ a arte; o anel e o fundo são do jogo, na cor que quiser. É assim que o Foundry resolve exatamente o pedido de upload |
| **Régua e movimento** | Régua com pontos de passagem (Ctrl+clique), arrastar a ficha mostra o custo, espaço anda até o fim da régua; o histórico do movimento fica no turno e dá para desfazer | Caminho sob o cursor com o custo no cartão, contorno do alcance na luta | **Sim: pontos de passagem** (contornar a fogueira em vez do caminho mais curto) e **desfazer o último passo** antes de agir. O `fvtt-elevation-ruler` (MIT) acrescenta o que falta: **cor por faixa** (andar, Disparada) e **ficha que barra o caminho** |
| **Moldes de área** | Círculo, cone, linha, quadrado; no v14 viraram Regiões, e o molde pode **se conformar às paredes** | `areaDaMira` mostra a área e `areaDaMagia` aplica | Já temos. O detalhe que falta é o molde parar na parede |
| **Região** | Uma área (retângulo, círculo, cone, polígono, com furos e altura) com **comportamentos** disparados por **eventos**. Comportamentos: ajustar escuridão, aplicar efeito ativo, mudar de andar, texto flutuante, rodar macro ou script, custo de movimento (terreno difícil), pausar, suprimir clima, teletransportar (até para outra cena), ligar/desligar outro comportamento. Eventos: entrou, saiu, moveu dentro, começou/terminou o turno ou a rodada, a região mudou. O dnd5e acrescenta antimagia e terreno difícil | Armadilha passo a passo (`armadilhas.js`), objeto interagível e pista com teste (editor, ferramenta 9), sobreposição que acende, e o resto escrito à mão em cada `capituloN.js` | **É o maior ganho.** Uma armadilha, uma placa de pressão, a escada que leva ao porão da Casa da Morte, o terreno difícil do mato, a escuridão da cripta e o texto "o chão range" viram DADO desenhado no editor, e não uma função nova em cada capítulo |
| **Tile** | Imagem posta no mapa, com modos de oclusão (some quando a ficha passa por baixo: inteiro, raio em volta, pela visão) | Sobreposição que acende e apaga, e a camada de frente que desbota onde há ficha | Já temos o essencial |
| **Andares da cena** (v14) | Vários níveis na mesma cena, a parede e a luz presas a um nível, a região "mudar de andar" | Cada andar da Casa da Morte é uma cena separada | Talvez depois. O custo é alto e cena separada funciona |
| **Combate** | Rastreador com a ordem individual, rolar de todos ou só dos NPCs, marcar derrotado, vários encontros, marcador de turno na ficha | Iniciativa por lado (o grupo todo, depois os inimigos), escolha documentada no motor | Não mudar a regra. Vale o **marcador de vez na ficha** e o derrotado marcado |
| **Mensagem e rolagem** | Toda rolagem é uma mensagem com a fórmula, os dados e o resultado, e um cartão com botões (rolar dano, aplicar) | O registro com o detalhe de cada rolagem | Ver a seção 4 sobre os botões |

---

## 3. O que o sistema dnd5e ensina (MIT, código aberto)

- **Avanço (`module/data/advancement/`)**: subir de nível e criar personagem são DADOS na classe, na raça e no
  antecedente, não código. São oito tipos: melhoria de atributo, escolher item, conceder item, valor por nível
  (o dado do Ataque Furtivo, os pontos de ki), subclasse, perícia ou proficiência, tamanho, pontos de vida. O criador
  de personagem do Foundry é só "aplicar os avanços do 1º nível da raça, do antecedente e da classe". É o desenho
  certo para o nosso criador: a tela de preparo que já existe (subclasse, talento, magias, equipamento) já é isso
  pela metade.
- **Atividades (`module/data/activity/`)**: cada ação de um item é uma atividade de um tipo — ataque, resistência,
  teste, dano, cura, conjurar, invocar, encantar, teletransportar, transformar, utilidade. A arma tem "ataque"; a
  Poção de Cura tem "cura 2d4+2"; o Cajado tem "conjurar". O nosso motor tem isso espalhado por tipo de magia e item.
- **Comportamentos de região próprios**: antimagia (o Campo Antimagia), terreno difícil por tipo de movimento,
  efeito ativo ao entrar.
- **Pacotes de conteúdo SRD em YAML** (`packs/_source/`): raças, classes, magias, monstros, e os antecedentes. O SRD
  5.1 só tem um antecedente (Acólito); o **SRD 5.2** (CC-BY-4.0) tem quatro — Acólito, Criminoso, Sábio, Soldado — em
  `origins24`. Isso responde a dúvida do criador de personagem: os antecedentes com licença limpa são esses quatro.
- **O que NÃO dá para pegar**: as 662 fichas de criatura de `tokens/` são da Forgotten Adventures, com licença só para
  dentro do Foundry (`tokens/LICENSE`).

## 4. O que o sistema DCC ensina (MIT)

- **A regra num pacote à parte** (`dcc-core-lib`), testada sem a mesa, e um `adapter` fino entre ela e o Foundry. O
  Phandalin já está assim; a lição é manter.
- **Três degraus de automação** (`docs/dev/RULES_AUTOMATION.md`), que valem para os nossos roteiros:
  1. **Nota** (o padrão): o cartão diz "se X, então Y", e a mesa aplica. Nunca erra.
  2. **Oferta**: um botão com a condição escrita ("os dois dados deram 1 → rolar falha crítica"). Nada acontece sem
     clique.
  3. **Decisão**: o jogo aplica sozinho, e só quando o contexto é certo — os dois valores saíram da mesma rolagem, ou
     do mesmo turno da mesma rodada do rastreador. O cartão diz o que decidiu e deixa desfazer.

  O motivo: um resultado automático errado é pior que nenhum, porque a mesa tem de perceber e desfazer. O Phandalin
  decide quase tudo sozinho; para o jogador sozinho isso está certo, mas na sala com mestre humano o degrau "oferta"
  faria falta.

---

## 5. Módulos da comunidade com ideia que serve

| Módulo | Licença | O que resolve | Para o Phandalin |
|---|---|---|---|
| `caewok/fvtt-elevation-ruler` | MIT | Caminho ao arrastar: A* na grade, ou A* sobre os cantos do polígono de visão (não depende do tamanho do mapa), ou por GPU; custo de terreno; ficha que barra | Pontos de passagem e cor por faixa de movimento |
| `dev7355608/vision-5e` | MIT | Os sentidos do 5e como modos de detecção, com as regras (audição pela Percepção passiva, sentido sísmico não pega quem voa) | Audição e visão cega |
| `dev7355608/perfect-vision`, `limits` | MIT | Limitar visão e luz por região (neblina, fumaça: escuridão leve e pesada do livro) | A zona de Escuridão/Névoa já existe; a ideia é a região |
| `MrPrimate/tokenizer` | — | Criar ficha a partir de imagem: camadas, arrastar e zoom, máscara do anel, a arte "sai" da moldura; gera retrato e ficha | **O criador de personagem com upload** |
| `moo-man/FVTT-DD-Import` | MIT | Importa o formato **Universal VTT** (`.dd2vtt`/`.uvtt`) do Dungeondraft, Dungeon Alchemist, DungeonFog e Arkenforge: imagem, grade, paredes, portas e luzes num arquivo só | **Um importador desses** abre qualquer mapa desses programas, com parede e porta prontas, sem decalcar |
| `fantasycalendar/FoundryVTT-ItemPiles` | — | Pilha de itens no mapa, baú, mercador, corpo revistável | Já temos o "Revistar"; a pilha no chão (o que caiu) seria nova |
| Monk's Active Tile Triggers | — | Clique ou entrada num tile dispara ações em cadeia | É a Região do núcleo, de antes dela existir |
| `fantasycalendar/FoundryVTT-Sequencer` + JB2A | — | Encadear animação de efeito (projétil, impacto, aura) | Já temos `fx.js` |
| `Feu-Secret/Tokenmagic` | GPL-3.0 | Filtros de shader nas fichas (brilho, distorção, fumaça) | Só ideia: copiar código GPL obrigaria o projeto a ser GPL |
| `Larkinabout/fvtt-token-action-hud-core` | — | Barra de ações da ficha escolhida, agrupada | Nossa barra já faz isso |

## 6. Mesas abertas parecidas

| Projeto | Licença | O que tem de interessante |
|---|---|---|
| **MapTool** (RPTools, Java) | AGPL-3.0 | Camadas separadas para **barrar visão** e **barrar movimento** (VBL e MBL), com "morro" e "buraco" que barram pela altura; luz como aura; macros. É a mesma separação das quatro restrições do Foundry |
| **Owlbear Rodeo 1.0** | só uso pessoal, não comercial | Imagens guardadas no **IndexedDB** do navegador (e o aviso: o Safari apaga o que não é visitado toda semana); troca de imagem entre jogadores por WebRTC; um **modelo de ML que conta as casas da grade** de um battlemap |
| **Dungeon Revealer** | ISC | O mestre pinta e despinta a névoa à mão, por cima do mapa; notas no mapa |
| **Atlas VTT** (Obsidian) | AGPL-3.0 | Mapa, fichas, névoa, dados e iniciativa dentro de um caderno |
| **Improved Initiative** | MIT | Rastreador de combate do 5e com a **vista do jogador** (o mestre vê PV, o jogador vê "ferido") e dados OGL/Open5e |
| **Ogres**, **Dungeoneer**, **AboveVTT** | AGPL-3.0 | Mesa leve sem cadastro; mesa com luz dinâmica; o AboveVTT por cima das fichas do D&D Beyond |

**Licença, em resumo:** o código do Foundry não é aberto (a documentação e o formato dos dados são referência). O que é
MIT (dnd5e, DCC, elevation-ruler, vision-5e, DD-Import, os tipos) pode ser estudado e adaptado com atribuição. GPL e
AGPL (Tokenmagic, MapTool, Dungeoneer, Atlas) servem como ideia; código copiado deles leva a licença junto.

---

## 7. O que eu faria, em ordem

1. **O criador de personagem com upload, no modelo do anel dinâmico.** O jogador envia só a arte; o jogo põe o anel
   e o fundo, na cor do lado, e anima o anel (brilho quando é alvo, pisca no dano). Atributos pelo conjunto padrão ou
   compra por pontos, raça, classe, os quatro antecedentes do SRD 5.2, e a tela de preparo que já existe. A imagem
   reduzida (256 px, webp) vai no save e na sala. Os 12 heróis prontos ficam.
2. **Regiões como dado do mapa**, desenhadas no editor: forma, evento (entrou, saiu, começou o turno) e
   comportamento (armadilha com teste e dano, texto, terreno difícil, escuridão, ir para outra cena, ligar outra
   região). O que hoje é `armadilhas()`, `interativos` e boa parte do roteiro de cada capítulo passa a ser preenchido
   no editor.
3. **Parede com as quatro restrições e direção**, mais a porta trancada com CD. Etérea, invisível, terreno e janela.
4. **Importador Universal VTT** (`.dd2vtt`/`.uvtt`): qualquer mapa do Dungeondraft ou do Dungeon Alchemist com parede,
   porta e luz, sem decalcar.
5. **Na ficha**: ícones de condição e o marcador de vez.
6. **Na luz**: cor, animação e cone por luz; nível de escuridão da cena com transição; as luzes da vila acendendo
   à noite.
7. **Na régua**: pontos de passagem e a cor da Disparada.
8. **Na visão**: audição como marca no mapa; a névoa explorada como opção por cena.
9. **Tirar o isométrico** (`board.js`, 4.819 linhas, de que a vista de cima ainda herda): trazer para
   `tabuleiro-topo.js` o que ela usa e apagar o resto, mais `?vista=iso` em `main.js`. Tem de vir antes de mexer
   muito no tabuleiro, senão cada mudança paga duas vezes.
