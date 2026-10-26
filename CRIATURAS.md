# Criaturas: o estado de cada uma e como se faz uma nova

Este documento responde três perguntas: **quem já tem ficha, folha desenhada e
animação**, **em que escala cada uma foi feita** e **qual é o caminho para criar a
próxima**. O contrato de licença e de estilo do elenco está em
[`ELENCO.md`](ELENCO.md); aqui fica o que muda a cada criatura nova.

O estado (as tabelas abaixo) é **gerado do código**: as fichas em
`src/rules/monsters/*.js` e `src/rules/npcs.js`, as folhas em
`src/art/folhas/index.js` e os perfis em `src/dev/importar-pixellab.py`. Depois de
criar ou importar uma criatura, rode:

```bash
node src/dev/criaturas.mjs
```

O bloco entre `GERADO:INICIO` e `GERADO:FIM` é reescrito; o resto do arquivo é
escrito à mão e fica como está.

## Vocabulário

- **Ficha**: o bloco de estatísticas (`rules/monsters/` ou `rules/npcs.js`).
- **Folha**: o PNG desenhado, em oito direções (`src/art/folhas/`), registrado em
  `folhas/index.js`. Sem folha, o tabuleiro cai no pintor procedural (`art/draw.js`),
  que desenha qualquer figura, mas sem o acabamento da arte do PixelLab.
- **Animação completa**: parado, andar, golpe e queda (e `conjurar`, em quem tem o
  gesto de magia). **Parada**: só as vistas e a queda; o andar e o golpe repetem o
  parado. **Anda; não ataca**: o andar é gerado, o golpe repete o parado.
- **Aparece em**: o arquivo de `src/game` (ou a regra: `estrada (sorteio)`, `magia`,
  `familiar`) que **cria** a criatura. É uma busca no código por chamadas que passam o
  id como primeiro argumento, então um bando montado por outro caminho pode faltar.
  `encounter` é o arquivo central dos mapas e dos bandos.

<!-- GERADO:INICIO -->
<!-- Este bloco é gerado por `node src/dev/criaturas.mjs`. Não edite à mão. -->

## Resumo

| | Com ficha | Com folha desenhada | Sem folha |
|---|---:|---:|---:|
| **Monstros** | 64 | **43** (42 desenhos distintos) | 21 |
| **NPCs** | 21 | **11** | 10 |
| **Heróis** | 12 | **7** | 5 |

176 arquivos de folha em `src/art/folhas/`: a maioria são variantes de equipamento dos heróis, então o número de PNGs não conta criaturas.

### Goblinoides

| id | nome | tamanho | ND | folha | animação | aparece em |
|---|---|---|---|:-:|---|---|
| `goblin` | Goblin | pequeno | 1/4 | ✅ | completa | castelo, encounter, estrada (sorteio) |
| `goblinArqueiro` | Goblin arqueiro | pequeno | 1/4 | ✅ | completa | castelo, encounter |
| `goblinChefe` | Chefe Goblin | pequeno | 1 | ✅ | completa | encounter |
| `hobgoblin` | Hobgoblin | médio | 1/2 | ✅ | completa · 2 armas/aparências | castelo, encounter, estrada (sorteio) |
| `bugbear` | Bugbear | médio | 1 | ✅ | completa | encounter |
| `klarg` | Klarg | médio | 1 | ✅ | completa | encounter |
| `reiGrol` | Rei Grol | médio | 1 | ✅ | completa | castelo |
| `yeemik` | Yeemik | pequeno | 1 | ✅ | completa | encounter |
| `droop` | Droop | pequeno | 1/4 | ✅ | completa | encounter |

### Humanoides

| id | nome | tamanho | ND | folha | animação | aparece em |
|---|---|---|---|:-:|---|---|
| `orc` | Orc | médio | 1/2 | ✅ | completa | cume, estrada (sorteio) |
| `bandido` | Bandido | médio | 1/8 | ❌ | — | — |
| `bandidoBesteiro` | Bandido | médio | 1/8 | ❌ | — | — |
| `bandidoMachadeiro` | Bandido | médio | 1/8 | ❌ | — | — |
| `capitaoBandido` | Capitão Bandido | médio | 2 | ❌ | — | — |
| `rufiao` | Rufião | médio | 1/2 | ❌ | — | — |
| `marcarrubra` | Bandido Marcarrubra | médio | 1/2 | ✅ | completa | encounter, phandalin |
| `batedor` | Batedor | médio | 1/2 | ❌ | — | — |
| `veterano` | Veterano | médio | 3 | ❌ | — | — |
| `mago` | Mago | médio | 6 | ❌ | — | — |
| `cajavidro` | Cajavidro | médio | 1 | ✅ | completa | — |
| `nezznar` | Nezznar | médio | 6 | ✅ | completa · + conjurar | — |
| `brughor` | Brughor Machado-Mordedor | médio | 2 | ✅ | completa | cume |
| `hamunKost` | Hamun Kost | médio | 1 | ✅ | completa | poco |
| `acolito` | Acólito | médio | 1/4 | ✅ | completa | arvoretrovao, encounter |
| `sacerdote` | Sacerdote | médio | 2 | ✅ | completa | arvoretrovao, encounter |
| `espiao` | Espião | médio | 1 | ❌ | — | — |
| `plebeu` | Plebeu | médio | 0 | ❌ | — | encounter · bloco dos Dendrar (Mirna, Nars, Nilsa), que têm desenho próprio. |
| `guarda` | Guarda | médio | 1/8 | ❌ | — | — |
| `nobre` | Nobre | médio | 1/8 | ❌ | — | — |
| `cavaleiro` | Cavaleiro | médio | 3 | ❌ | — | — |
| `drow` | Drow | médio | 1/4 | ✅ | completa · 2 armas/aparências | — |
| `ogro` | Ogro | grande | 2 | ✅ | completa | cume, encounter, estrada (sorteio) |

### Feras

| id | nome | tamanho | ND | folha | animação | aparece em |
|---|---|---|---|:-:|---|---|
| `lobo` | Lobo | médio | 1/4 | ✅ | completa | castelo, encounter, estrada (sorteio), magia |
| `loboAtroz` | Lobo Atroz | grande | 1 | ✅ | completa | encounter, magia |
| `aranhaGigante` | Aranha Gigante | grande | 1 | ✅ | completa · 2 armas/aparências | arvoretrovao, encounter |
| `aranhaLoboGigante` | Aranha-Lobo Gigante | médio | 1/4 | ❌ | — | — |
| `ratoGigante` | Rato Gigante | pequeno | 1/8 | ✅ | completa | encounter |
| `morcegoGigante` | Morcego Gigante | grande | 1/4 | ❌ | — | — |
| `ratoFamiliar` | Rato (familiar) | miúdo | 0 | ✅ | anda; não ataca | familiar · invocado pela magia Convocar Familiar do mago. |
| `morcegoFamiliar` | Morcego (familiar) | miúdo | 0 | ✅ | anda; não ataca | familiar · invocado pela magia Convocar Familiar do mago; paira. |
| `stirge` | Stirge | miúdo | 1/8 | ✅ | completa | estrada (sorteio) |
| `javali` | Javali | médio | 1/4 | ❌ | — | — |
| `ursoPardo` | Urso Pardo | grande | 1 | ❌ | — | — |
| `ursoNegro` | Urso-Negro | médio | 1/2 | ❌ | — | magia · pacote de Conjurar Animais (druida). |
| `cabraGigante` | Cabra Gigante | grande | 1/2 | ❌ | — | magia · pacote de Conjurar Animais (druida). |
| `javaliGigante` | Javali Gigante | grande | 2 | ❌ | — | magia · pacote de Conjurar Animais (druida). |
| `tigreDenteDeSabre` | Tigre-Dente-de-Sabre | grande | 2 | ❌ | — | magia · pacote de Conjurar Animais (druida). |
| `corujaUrso` | Coruja-Urso | grande | 3 | ✅ | completa | castelo, estrada (sorteio) |

### Mortos-vivos

| id | nome | tamanho | ND | folha | animação | aparece em |
|---|---|---|---|:-:|---|---|
| `esqueleto` | Esqueleto | médio | 1/4 | ✅ | completa | encounter, magia |
| `zumbi` | Zumbi | médio | 1/4 | ✅ | completa | poco, magia |
| `ghoul` | Ghoul | médio | 1 | ✅ | completa | estrada (sorteio) |
| `espectro` | Espectro | médio | 1 | ✅ | completa | encounter |
| `wraith` | Wraith | médio | 5 | ✅ | completa | arvoretrovao, encounter · o Mormesk. |
| `zumbiDasCinzas` | Zumbi das Cinzas | médio | 1/4 | ✅ | completa | arvoretrovao |

### Aberrações, limos e o dragão

| id | nome | tamanho | ND | folha | animação | aparece em |
|---|---|---|---|:-:|---|---|
| `gelatinaOcre` | Gelatina Ocre | grande | 2 | ✅ | completa | encounter |
| `grick` | Grick | médio | 2 | ✅ | completa | castelo |
| `doppelganger` | Doppelganger | médio | 3 | ✅ | completa | castelo |
| `dragaoVerdeJovem` | Dragão Verde Jovem | grande | 8 | ✅ | completa · + conjurar · + voo · 2 armas/aparências | arvoretrovao, encounter · o Venomfang; tamanho grande reservado ao dragão adulto. |
| `caveiraCandente` | Caveira Candente | pequeno | 3 | ✅ | completa | encounter |
| `vigiaCiclopico` | Vigia Ciclópico | médio | 2 | ✅ | completa | encounter |
| `spectator` | Spectator | médio | 3 | ✅ | completa | encounter |
| `galhoInfectado` | Galho Infectado | pequeno | 1/8 | ✅ | completa | arvoretrovao, encounter |
| `espetoInfectado` | Espeto Infectado | médio | 1/4 | ✅ | completa · 2 armas/aparências | arvoretrovao, encounter |
| `vinhaInfectada` | Vinha Infectada | médio | 1/2 | ✅ | completa | arvoretrovao, encounter |

### NPCs

Só os NPCs que ficam **no tabuleiro** precisam de folha; os outros aparecem em telas de conversa.

| id | nome | folha | animação | bloco |
|---|---|:-:|---|---|
| `sildar` | Sildar Hallwinter | ✅ | parada: vistas e queda | `cavaleiro` |
| `gundren` | Gundren Rockseeker | ✅ | parada: vistas e queda | `plebeu` |
| `toblen` | Toblen Stonehill | — | — | `plebeu` |
| `elmar` | Elmar Barthen | — | — | `plebeu` |
| `linene` | Linene Graywind | — | — | `plebeu` |
| `halia` | Halia Thornton | — | — | `espiao` |
| `harbin` | Harbin Wester | — | — | `nobre` |
| `daran` | Daran Edermath | — | — | `veterano` |
| `qelline` | Qelline Alderleaf | — | — | `plebeu` |
| `carp` | Carp Alderleaf | — | — | `plebeu` |
| `irmaGaraele` | Irmã Garaele | — | — | `acolito` |
| `reidoth` | Reidoth | ✅ | parada: vistas e queda | `druida` |
| `agatha` | Agatha | — | — | `espectro` |
| `iarno` | Iarno Albrek | ✅ | completa | `cajavidro` |
| `nezznar` | Nezznar | ✅ | completa · + conjurar | `nezznar` |
| `hamunKost` | Hamun Kost | ✅ | completa | `hamunKost` |
| `mormesk` | Mormesk | ✅ | completa | `wraith` (usa a folha do `wraith`) |
| `droop` | Droop | ✅ | completa | `droop` |
| `yeemik` | Yeemik | ✅ | completa | `yeemik` |
| `klarg` | Klarg | ✅ | completa | `klarg` |
| `reiGrol` | Rei Grol | ✅ | completa | `reiGrol` |

### Heróis

| nome | classe | folhas |
|---|---|---|
| Dara | Guerreira | ✅ 36 variantes de equipamento |
| Pip | Ladino | ✅ 14 variantes de equipamento |
| Brenn | Clérigo | ✅ 16 variantes de equipamento |
| Ilvan | Mago | ✅ 4 variantes de equipamento |
| Grask | Bárbaro | ✅ 20 variantes de equipamento |
| Maren | Druida | ❌ |
| Vesh | Bruxo | ❌ |
| Selane | Feiticeira | ❌ |
| Torvik | Paladino | ✅ 21 variantes de equipamento |
| Corin | Guardião | ✅ 9 variantes de equipamento |
| Sylwen | Monja | ❌ |
| Lirra | Barda | ❌ |

### Sem folha, por prioridade

- **Aparecem no jogo hoje** (em cena, ou invocados por magia): `plebeu` (encounter); `ursoNegro` (magia); `cabraGigante` (magia); `javaliGigante` (magia); `tigreDenteDeSabre` (magia).
- **Só existem no bestiário** (nenhuma cena os coloca): `bandido`, `bandidoBesteiro`, `bandidoMachadeiro`, `capitaoBandido`, `rufiao`, `batedor`, `veterano`, `mago`, `espiao`, `guarda`, `nobre`, `cavaleiro`, `aranhaLoboGigante`, `morcegoGigante`, `javali`, `ursoPardo`.

<!-- GERADO:FIM -->

## Escala: a altura de cada figura

Medida em pixels lógicos (o desenho 1:1 do tabuleiro; a folha guarda 3× disso). Uma
criatura **maior que a categoria dela** transborda das casas: o dragão verde jovem
saiu do tamanho de um adulto e precisou ser reduzido (ver Decisões).

| figura | altura | observação |
|---|---:|---|
| morcego familiar | 23 | 38 de largura, com as asas abertas |
| rato familiar | 24 | miúdo; reduzido a 0,8 |
| stirge | 26 | miúdo |
| rato gigante | 31 | |
| goblin | 45 | pequeno |
| Nilsa (criança) | 44 | tela de 48 |
| Nars (adolescente) | 54 | tela de 56 |
| humanos médios | 59 a 62 | acólito 59, Hamun Kost 59, Mirna 60, Sildar 60, Reidoth 60, sacerdote 61, drow 61, Gundren 62 (com o chapéu) |
| bugbear | 71 | |
| ogro (Grande, 2×2) | 82 | |
| dragão verde jovem (Grande, 2×2) | 117 | 113 de largura, cabe nas 2×2 casas |
| dragão verde adulto (Enorme, 3×3) | 160 | **reservado**: ver Decisões |

## Como se cria uma criatura

Só os passos **2 e 3** gastam geração do PixelLab. Todo script é seco
por padrão: sem `--go`, só imprime o plano e o saldo. O token vai **só** na linha de
comando (`PIXELLAB_TOKEN=... python ...`), nunca em arquivo.

1. **Ficha.** Bloco em `rules/monsters/<família>.js` (SRD, `fonte: 'SRD'`; ou
   criatura nossa, `fonte: 'propria'`). Escolha o `look`, o `size` e, se for figura
   que flutua, `hover: true` (ou `pairaNoAr: true` se for só o desenho).
2. **As 8 vistas** (~2 gerações a 64×64). Receita em `PERSONAGENS` de
   `src/dev/criar-pixellab.py`; rode seco e depois com `--go`. Monte a prancha das
   oito vistas e **mostre ao dono; só segue com o ok** dele.
   - O texto da descrição manda. Palavra de dragão (`dragon`, `scale`) faz o modelo
     desenhar um draconato: o primeiro acólito saiu réptil. Escreva `HUMAN` por
     extenso, descreva o rosto e ponha o que não quer na lista negativa.
   - De frente, a mão **esquerda** do personagem fica à **direita** da imagem.
   - Template: `mannequin` para bípedes e voadores; `cat` e `dog` para quadrúpedes
     (o `dog` põe o stirge em pé). O tamanho da tela escolhe o porte: 64 adulto, 56
     adolescente, 48 criança, 32 rato.
3. **Animar** (17 gerações a 64×64). Receita em `CRIATURAS` de
   `src/dev/animar-pixellab.py`: `--criatura X --saida _referencias/pixellab/X-anim
   --go`. São o andar em 8 direções (`v3`), o golpe em 8 (`pixminimax`, uma por
   direção, dizendo para onde a figura olha) e a queda. Quem só fica parado e cai
   pede só `--somente queda-pix` (1 geração). O `TOTAL` impresso soma todas as poses:
   o gasto real é o do que foi pedido.
4. **Importar.** Perfil em `PERFIS` de `src/dev/importar-pixellab.py`, e depois
   `python src/dev/importar-pixellab.py --fonte _referencias/pixellab/X-anim --chave X`.
   - Escolha **os quadros do golpe olhando a grade das nove**: de costas (nordeste,
     norte, noroeste) o modelo vira o personagem de frente no meio do golpe e deixa
     arcos de movimento riscados; só entram os que mantêm o rosto no lado certo, e
     onde nenhum serve vale o espelho do outro lado (`espelhar_ataque`).
   - O centro do corpo se mede por uma cor do corpo (`pele`, em matiz); pela pele
     falha quando a arma tem tom parecido.
   - Perfis especiais: `estatico` (figura parada), `ataque_parado` (anda, não
     ataca), `so_anims` + `aparar` (folha parcial, que cai na folha base),
     `andar_de` (o andar vem de outro grupo, como o voo), `limpar_soltos`.
5. **Registrar** em `src/art/folhas/index.js`: o par de `import` (`.json` e `.png`) e
   a entrada em `IMPORTADAS`. Só depois que os arquivos existirem, porque um
   `import` de arquivo ausente derruba o servidor de quem estiver olhando.
6. **Conferir.** Monte um GIF com **uma paleta só** (paleta por quadro pintou tudo de
   rosa e azul), meça a cor e compare a altura com a tabela acima. No tabuleiro, a
   vitrine de tamanhos (Arena de testes) coloca as figuras lado a lado.
7. **Testes** (`node src/dev/testes-regras.mjs`, `testes-cenas.mjs`).
8. **Este documento**: `node src/dev/criaturas.mjs`.
9. **Commit.** O repositório é compartilhado entre sessões: monte o índice só com os
   trechos próprios e teste **a partir do índice**
   (`git checkout-index -a --prefix=<pasta>/`), não a partir da árvore de trabalho.

### Custos observados (gerações do PixelLab)

| o quê | custo |
|---|---:|
| 8 vistas, tela de 64 | 2 |
| animação completa (andar 8 + golpe 8 + queda 1), tela de 64 | 17 |
| só a pose de queda | 1 |
| andar + queda de um bicho miúdo | 9 |
| dragão verde jovem, célula grande: animação completa | ~41 |
| 16 candidatas de um objeto de cenário (1 direção, 48 px) | 10 |
| edição de animação num dragão (célula 248×160) | 25 |

## Decisões registradas

- **O dragão verde jovem é de quatro patas e o desenho é do dono.** Ele anda no chão e
  decola quando o movimento passa de 12 m ou atravessa terreno difícil ou desnível, e
  pousa no fim (`voaPelaFicha`, em `combat.js`). Só quem **paira** (`hover`:
  espectro, wraith, caveira candente, spectator) é desenhado no ar o tempo todo.
- **O tamanho grande do dragão é do adulto.** O desenho veio do tamanho de um dragão
  adulto (Enorme, 3×3 casas, 155×160). O jovem é Grande (2×2) e saiu reduzido a
  0,726 (113×117). As folhas no tamanho original estão em
  `_referencias/pixellab/dragaoVerde-ref/folhas-tamanho-grande/`, para o adulto.
  `src/dev/reduzir-folha.py` parte sempre delas.
- **Folha parcial.** A garra e o voo do dragão trazem só o que muda e caem na folha
  base; cada animação é aparada no próprio tamanho. Foi o que baixou a memória das
  três folhas de 1,3 GB para cerca de 110 MB.
- **O grupo é de quatro heróis.** Os encontros foram calibrados e medidos para
  quatro; por isso Sildar, Gundren e Reidoth **não são companheiros**: acompanham o
  grupo só na história, e ficam parados no tabuleiro.
- **A família Dendrar.** Mirna é a mãe e Nars e Nilsa são os filhos dela (o diálogo da
  cena diz isso). O desenho é nosso; no esconderijo, a cena troca o `look` do plebeu
  (`foesMansao`).
- **Sildar e Reidoth saíram com as mãos trocadas** em relação às imagens do dono
  (escudo, elmo, cajado e gavião); o dono aprovou assim. Dá para espelhar no
  importador, sem gastar geração.
- **O rato familiar foi reduzido a 0,8** (de 31 para 24 px): o original saiu quase do
  tamanho do rato gigante, e ele é miúdo. O original fica em
  `_referencias/pixellab/familiares-tamanho-original/`.
- **A grade da jaula** é a candidata 2 de 16, espelhada (as fileiras de cela correm
  no eixo x, que na tela desce para a direita) e sem o balanço aleatório de posição,
  para as três casas emendarem.

## Pendências

O que falta, em ordem do que mais aparece no jogo:

1. **Heróis**: Maren, Vesh, Selane, Sylwen e Lirra não têm folha. Os quatro que
   jogam hoje (Dara, Pip, Brenn e Ilvan) já têm. A druida Maren tem as magias
   adiadas.
2. **Animais de Conjurar Animais** (tigre-dente-de-sabre, javali gigante, urso-negro
   e cabra gigante): só entram quando a Maren entrar, porque nenhum herói pronto
   conjura a magia. Se a Forma Selvagem dela for implementada, pedirá mais
   (o urso pardo e o morcego gigante, por exemplo).
3. **Humanos genéricos do SRD** (bandido, capitão bandido, rufião, batedor, veterano,
   mago, espião, guarda, nobre, cavaleiro): nenhuma cena os coloca hoje, e a
   tabela de encontros da estrada só sorteia criaturas que já têm arte. O plebeu só
   aparece como bloco dos Dendrar, que têm desenho próprio.
4. **O dragão verde adulto**: a criatura ainda não existe; as folhas dele partem do
   tamanho original guardado.
5. **O Nezznar** tem folha completa e o gesto de conjurar, mas nenhuma cena o coloca
   ainda.
6. **Gundren**: de costas aparece uma cascata de cabelo preto que a imagem de
   referência não mostra, porque o chapéu a cobre.
