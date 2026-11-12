# A lore dos livros dentro do jogo — o plano (2026-11-12)

O último item da ordem do dono (o bestiário do MM, o PHB, XGE/TCE, os outros bestiários, o DMG e a lore). Escolhido por
ele: a **lore do mundo** (deuses, facções, lugares, povos e criaturas), e não as raças e os antecedentes dos livros, que
ficam para depois.

## 1. O que há, medido no 5etools

| Fonte | O que é | Tamanho |
|---|---|---|
| `deities.json` | os deuses: Reinos Esquecidos (PHB), o panteão de Faerûn (SCAG), os não humanos (anões, elfos, drow, halflings, gnomos, orcs, duergar; SCAG, MTF, VGM) | ~180 deuses dos Reinos |
| SCAG | os deuses de Faerûn em prosa; os lugares da Costa da Espada e do Norte (Neverwinter, Águas Profundas, Luskan, Mirabar, Gauntlgrym...); a história (Netheril, a Praga Mágica); o Subterrâneo | ~400 mil caracteres |
| VGM | a lore dos monstros: observadores, gigantes, gnolls, goblinoides, bruxas, kobolds, devoradores de mentes, orcs, yuan-ti | 447 mil |
| MTF | a Guerra Sangrenta (diabos e demônios), os elfos e os drow, os anões e os duergar, os gith, os halflings e os gnomos | ~500 mil |
| FTD | o Draconomicon: os dragões por cor | 343 mil |
| BGG | os gigantes: o ordning, os deuses, a sociedade | 88 mil |

As cinco FACÇÕES que a Mina e o Obelisco usam (Harpistas, Ordem da Manopla, Enclave Esmeralda, Aliança dos Lordes,
Zhentarim) estão espalhadas pelos livros; elas se escrevem à mão, de graça.

## 2. Onde a lore aparece no jogo

1. **Lembrar sobre a criatura** (`investigar.js saberDaCriatura`, História, Arcanismo, Religião ou Natureza): hoje dá o
   bloco e a lore do bestiário. Passa a dar também o que o livro conta do POVO dela (o goblin, o hobgoblin e o bugbear
   leem os goblinoides; o devorador de mentes, os illithids do Obelisco; o dragão verde, os dragões verdes), em camadas
   pela CD: quem rola mais, sabe mais.
2. **Lembrar sobre um lugar ou um símbolo** (a pista da cena com `lore: id`): o santuário de Tymora em Phandalin, o anel
   netherese, as ruínas, os símbolos nos inimigos.
3. **O que os NPCs sabem** (`npc-saber*.js`): a Garaele sobre Tymora e os Harpistas, o Daran sobre a Ordem, o Sildar sobre a
   Aliança, a Halia sobre os Zhentarim, a Reidoth sobre o Enclave — a conversa livre responde com esses fatos.
4. **O mapa da região**: o que se sabe de Neverwinter, de Águas Profundas, de Triboar, pela História.

## 3. O caminho (o mesmo das magias e dos itens)

- `src/dev/traduzir-lore.mjs` lê as seções e pede ao modelo, pela API de lotes, o nome brasileiro e de 3 a 6 FATOS em
  camadas de CD (10, 15, 20, 25), **com as nossas palavras** — nunca a prosa do livro —, em `src/dev/lore/<fonte>-pt.json`.
- a tabela à mão de que criatura lê que povo (ficou em `src/rules/lore.js POVOS`, porque o jogo a lê na hora).
- `src/dev/importar-lore.mjs` escreve `src/rules/lore-livros.js`.
- `conferir-colagem.py --min 10` tem de seguir em zero.

**Custo**: ~450 mil tokens de entrada e ~160 mil de saída no Opus 5.5 pela API de lotes (metade do preço): **uns US$ 2 a
2,50**, dentro do que o dono aceitou (US$ 1 a 3). Uma amostra de 10 mede antes do resto.

## 4. O que entrou (2026-11-12)

- **O texto**: 222 seções (93 deuses, 48 lugares, 3 de história, 78 de povos), 1.239 fatos em camadas de CD, em
  `src/dev/lore/lore-pt.json` → `src/rules/lore-livros.js` (`src/dev/importar-lore.mjs`). **Custo: US$ 3,11** (a amostra
  US$ 0,11 e o lote US$ 3,00), um pouco acima da estimativa de US$ 2,40 e dos US$ 3 do teto que o dono aceitou: a seção
  saiu a US$ 0,014 contra US$ 0,011 da amostra, porque as maiores (os capítulos do MTF e do VGM) gastaram mais saída.
- **As facções** à mão (`rules/lore-faccoes.js`), sem modelo.
- **Onde aparece**:
  - o **Lembrar sobre a criatura** soma a lore do POVO dela até o total tirado (`rules/lore.js POVOS`, `loreDaCriatura`,
    `fatosAte`): os goblinoides, os orcs, os devoradores de mentes, os observadores, os kobolds, os gnolls, as bruxas, os
    yuan-ti, os drow, os duergar, os gith, os gnomos das profundezas, os diabos e os demônios, os dez dragões por cor e
    os gigantes. Provado no jogo: o Ilvan tira 26 em História sobre um goblin e lê o bloco e quatro fatos da hoste goblinoide;
  - o **mapa da região**: Neverwinter mostra o que o grupo sabe, até 10 + a melhor História, sem rolar;
  - o **santuário de Tymora**: a Garaele responde "O que se diz de Tymora?" e "E a irmã dela?" com os fatos do SCAG;
  - o **convite das facções** ganhou "O que é a ...?", com os fatos até a CD 15.
- **O que NÃO entrou, e por quê**: a lore nas FICHAS de NPC (`npc-saber*.js`), que deixaria o modelo responder sobre
  Tymora e as facções na conversa livre. A versão da ficha (`dialogo-ia.js versaoDaFicha`) cobre a ficha inteira, e mexer
  nela invalidaria 1.170 falas do banco (Halia 260, Sildar 277, Garaele 253, Daran 222, Reidoth 158) — 23% do que o jogo
  responde sem API. A lore foi pela árvore da conversa, que não mexe no banco. Se um dia valer a pena, o caminho é o
  banco guardar a versão por FATO usado, e não pela ficha inteira.
- **Os lugares e os deuses ainda sem gancho no mapa**: 48 lugares e 93 deuses estão no dado, mas só Neverwinter e Tymora
  têm onde aparecer hoje; os outros esperam a cena que os chame (uma pista com o deus, um pino no mapa).

Provas: `src/dev/testes-lore.mjs` (6). `conferir-colagem.py --min 10` mede contra a Mina, que é o livro no disco; os
livros da lore não estão lá, então a garantia contra cópia deles é a regra do pedido ao modelo e a leitura da amostra.

## 5. A divindade do herói (2026-11-12)

**Um caminho morto que a lore destravou.** Talhundereth e a cripta dos Talhund perguntam se alguém do grupo é fiel de
Dumathoin (`heroi.divindade`: o fiel abre o disco da cripta sem teste e sabe apagar cada assombração), mas nada no jogo
preenchia esse campo — os dois ramos nunca disparavam. Agora:

- **O criador pergunta** (`view/menu-herois.js secaoDivindade`, opcional, "a quem serve" para clérigo e paladino): o
  panteão de Faerûn para todos e o do povo do herói (anão, elfo, halfling, gnomo, meio-orc, meio-elfo; o drow ganha também
  o do Subterrâneo), com o resumo do deus escolhido embaixo (`rules/lore.js deusesPara`). A definição guarda o nome e a
  chave (`divindade`, `divindadeId`), e `criador.js definicaoValida` recusa chave que não seja de deus ou nome trocado.
- **O combatente leva** (`criacao.js montarHeroi`), e a aba História da ficha mostra.
- **O herói pronto** que a própria história liga a um deus: o Brenn, curandeiro do santuário de Berronar. Os outros não
  ganharam deus, porque as histórias deles não dizem qual.
- **A estátua de Dumathoin** na Onda Eco: quem passa em "Reconhecer a estátua" (Religião CD 10) lembra também o que a
  lore conta do deus, até o total tirado.

Provas em `testes-lore.mjs` (9). No navegador, a seção aparece no criador, e o resumo de Tymora acompanha a escolha.

**O que fica**: a torre netherese do Poço da Coruja Velha não tem ponto de Lembrar (pede mexer na planta da cena); os
outros 45 lugares e os deuses sem santuário no jogo esperam a cena que os chame.
