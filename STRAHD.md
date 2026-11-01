# Maldição de Strahd — plano da segunda aventura

Primeira entrega: **a Casa da Morte** (Apêndice B do livro), a mini-aventura que leva um grupo do 1º ao 3º nível dentro de uma casa assombrada em Baróvia. O resto de *Maldição de Strahd* fica para depois.

Material de trabalho (não entra no repositório; `_referencias/` é ignorado pelo git):
- `_referencias/strahd/livro.txt` — o livro em português, texto extraído (259 páginas).
- `_referencias/strahd/casa-da-morte.txt` — só o Apêndice B (~750 linhas).
- `_referencias/strahd/*.png` — os sete mapas, reduzidos: 1º ao 4º andar (sótão), duas masmorras e a vista geral.

## O que o livro pede (Casa da Morte)

| Item | Fato do livro |
|---|---|
| Nível | começa no 1º, termina no 3º; **sobe por marcos**, não por XP: 2º nível ao achar a escada secreta do sótão (área 21), 3º ao escapar da casa |
| Gancho | duas crianças, Rose e Thorn, na rua de Baróvia: "há um monstro na nossa casa". São ilusões da própria casa; somem se atacadas |
| Estrutura | 4 andares (incluindo o sótão), porão e duas masmorras; cerca de 40 áreas numeradas |
| Casa viva | o térreo e o 2º andar parecem novos; o 3º e o sótão estão em ruína. A casa esconde portas secretas até a hora certa e se reconstrói em 2d6 horas |
| Escuro | nenhuma sala começa acesa; há lamparinas a óleo e lareiras |
| Fantasmas | Rose e Thorn de verdade (1º ND 3, 35 PV, bons) querem ser enterrados nas criptas 23E e 23F; podem possuir o herói que tentar sair |
| Fim | santuário do Senhor Negro e câmara do ritual no fundo; monstros do porão |

## Decisões que são suas

1. **Escopo da primeira entrega.** A Casa da Morte inteira (todas as áreas e os 4 andares + 2 masmorras) ou um corte menor (térreo, 2º andar, sótão e a descida), deixando a masmorra para a segunda leva.
2. **Os mapas.** Os JPGs são da Morvold Press (Jeff Todd) e a versão que você tem é a do Patreon, com marca d'água. Arte de terceiros não pode ir no jogo publicado. Proposta: usar só como **referência de planta** e desenhar a nossa, em tiles isométricos, no estilo do resto do jogo.
3. **A arte do interior.** A casa pede um kit novo (assoalho de madeira, painéis, tapete vermelho, escadaria curva, paredes de pedra, pedra bruta da masmorra). Há duas rotas: **protótipo com os tiles que já existem** (Mansão Tresendar, taverna) para fechar regras, texto e mapas, e só depois gastar crédito; ou gastar já (PixelLab, 25 gerações o kit de construção; ou OpenArt, até 15 créditos por página).

## Fases, na ordem em que eu faria

1. **Registro e esqueleto.** `aventuras.js` ganha *Curse of Strahd* como jogável; seleção de heróis (hoje fixos no 1º nível, o que serve); cena de abertura em Baróvia com Rose e Thorn.
2. **Plantas.** Um script que lê cada JPG, estima a grade e entrega um rascunho de matriz de tiles por andar, a corrigir à mão (paredes, portas, escadas, portas secretas, mobília que bloqueia).
3. **Criaturas.** Blocos do SRD onde existirem (armadura animada, vassoura animada, espectro, ghoul, aranha, sombra...), blocos próprios onde o livro inventa (fantasmas das crianças, cultistas da casa).
4. **Cena e regras da casa.** Exploração por áreas (como a Mansão e a Árvore do Trovão), portas secretas que só aparecem a seu tempo, a casa que se repara, possessão por Rose e Thorn, marcos de nível.
5. **Texto e diálogos.** Texto nosso, fatos do livro (regra do projeto).
6. **Arte e ícones novos**, depois que as regras estiverem fechadas.
7. **Revisões:** fidelidade, encontro tático, ortografia, render e HUD.

## Escala das plantas (decisão sua)

- **Casa (andares):** um quadrado do mapa = uma casa do jogo (5 pés, 1,5 m). Cada andar tem uns 12 × 22 quadrados.
- **Masmorras:** um quadrado do mapa vale **4 casas do jogo (2 × 2)**. A grade da masmorra tem o dobro de casas em cada eixo; o rascunho da planta sai dessa grade, e as salas, as portas e os corredores (túneis de 1,2 m) são redesenhados nela.

## Feito até aqui

- **Retratos** de Rose e Thorn (OpenArt, 2 gerações, no estilo dos outros): `src/art/retratos/rose.webp` e `thorn.webp`, com os looks `rose` e `thorn` e as fichas em `rules/npcs.js`.
- **Abertura em Baróvia** (`game/strahd-abertura.js`): a névoa, a aldeia vazia e a conversa com Rose, com teste de Intuição, a recusa da névoa e o ataque às crianças (elas somem e o portão se abre). Para ver: `?encontro=padrao&nivel=1&strahd=abertura`.
- **Criaturas** (`rules/monsters/strahd.js`): armadura animada, vassoura animada (nossa, não SRD), fantasma de criança (SRD alterado como no livro), enxames de centopeias e de ratos, sombra, mímico, lívido e arbusto errante. Grick, carniçal e espectro já existiam.

- **1º e 2º andares jogáveis** (áreas 1 a 10): planta própria, descrições, painéis, o armário do canil, a gaveta e o livro falso da biblioteca, a sala secreta com o baú e a **carta de Strahd, que é o marco do 2º nível** (o grupo sobe de nível ao ler a carta; a casa mostra a escada secreta do sótão). Escadaria liga os dois andares.
- **A casa inteira jogável, sem arte nova** (áreas 1 a 38, seis cenas: 1º, 2º e 3º andares, sótão, masmorra 1 e masmorra 2). Plantas em `casadamorte.js` e `casadamorte-alto.js` (casas) e `casadamorte-porao.js` (masmorras, gerado por `src/dev/mapa-casadamorte.py`; cada quadrado do mapa vale 2 x 2 casas). A cena é `capitulo-casadamorte.js` mais três módulos: `casadamorte-alto-cena.js` (3º andar e sótão), `casadamorte-porao-cena.js` (masmorras) e `casadamorte-fuga.js` (a saída, a possessão, a casa que ataca). Criaturas em `casadamorte-criaturas.js`; textos das masmorras em `casadamorte-textos-porao.js`. `?strahd=casaDaMorte3` (ou 1, 2, 4, Porao1, Porao2) cai direto no andar.
  - **Gatilhos do livro:** a armadura animada (11) e a vassoura (14) a 1,5 m; o espectro da babá no berçário (15B) ou nos restos (18); o grick (28, surpresa para Percepção passiva < 12); os quatro carniçais no meio do cruzamento (29); as cinco sombras com a esfera ou a estátua (31); o mímico que é a porta (33); os dois lívidos ao revirar a caixa (34); o enxame de centopeias no caixão de Elisabeth (23D); Lorghoth (38).
  - **Armadilhas e segredos:** o poço de espinhos (26) PARA o passo e cobra a queda; a escada secreta (carta ou casa de bonecas, que dão o 2º nível); a espiral do sótão; a porta secreta leste do santuário e o alçapão do canil; as lajes das criptas (Atletismo CD 15); a porta da prisão e a ponte levadiça (Atletismo CD 20, ou a roda da câmara); os cinco baús do poço (Destreza CD 15).
  - **O ritual "Um deve morrer!"** (38) e os dois finais: sacrificar um herói (a casa não faz mais nada) ou negar (Lorghoth e depois a casa ataca: janelas emparedadas, portas de foice com Acrobacia/Inteligência CD 15, fumaça nos cômodos com lareira, enxames de ratos). Rose e Thorn: aparecem quando se mexe nos brinquedos, e se não forem postos em paz (ossos nas criptas E e F, que dá Inspiração aos dois juntos) tentam possuir quem sai (Carisma CD 13); o 3º nível vem ao sair.
- **Kit de piso** (PixelLab, 10 gerações): assoalho, tapete, parquet e terra socada no atlas do chão, mais mobília de casa sobre assoalho.
- **Save corrigido** (o `SaveManager` nunca gravava) e a cena entra no autosave.

## Arte da casa (feita)

- **Paredes finas, em três peças:** a casa de parede continua inteira na regra, mas o tabuleiro a desenha como um muro de ~1/4 de casa (`board.desenharParedeFina`, flag `paredeFina` do mapa). A parede alta tem três níveis e cada um é uma peça diferente do atlas `faces.png`: `material:topo` (a moldura), `material` (o corpo) e `material:base` (o lambri e o rodapé); `art/faces.js` escolhe pela altura. O muro da frente (a borda sul e leste, voltada para a câmera) fica com um nível só, o rodapé, para a casa aparecer por dentro. Materiais: `painelCarvalho` (papel de parede bordô e mogno, 1º e 2º andares) e `madeiraVelha` (reboco velho, 3º andar e sótão), de dois lotes do PixelLab (`e587d205-...` e `be6d91f3-...`, 30 gerações; as duas tentativas anteriores, de tábuas e de uma faixa só repetida, foram recusadas). `src/dev/acrescentar-casa.py` monta e é chamado por `acrescentar-taverna.py`.
- **Mobília:** `casadamorte-mobilia.js`: lareiras, camas, estantes, armários, cadeiras, candelabros, armaduras de pé etc., todas peças que já existiam no atlas `cenario` (nada gerado). Faltam peças próprias: cravo, harpa, casa de bonecas, espelho de corpo inteiro, cama de dossel.
- **Poeira e teia** nos andares de cima (véu e teias nos cantos, só desenho).

## Pendente de arte (sprites)

Os blocos novos usam o look mais próximo que existe (cavaleiro, plebeu, specter, giantRat, gelatinaOcre, wraith, vinhaInfectada): armadura animada, vassoura, fantasma de criança, sombra, mímico, lívido, arbusto errante e enxames precisam de sprite próprio.

## Investigação (o coração da casa)

Os pontos clicáveis moram em `casadamorte-pistas.js` (mais de 40 pontos, 80 verbos de perícia) e a cena em `casadamorte-pistas-cena.js`: o botão direito num objeto oferece **Olhar** (de graça) e **uma opção por perícia** (História, Investigação, Percepção, Arcanismo, Religião, Natureza, Medicina, Intuição, Sobrevivência, Atuação, Acrobacia, Atletismo), com CD e uma tentativa por herói. O que se descobre vai para o **diário** ("Rever as pistas"). A **Percepção passiva** repara sozinha ao entrar na sala. As **magias de utilidade** entram pelos ganchos da cena: Detectar Magia lê auras (o canto do canil esconde o alçapão por ilusão; a casa de bonecas e a estátua de Strahd também), Abrir destranca (armário do canil, baús do poço, porta do quarto das crianças), Encontrar Armadilhas acha o fosso e Localizar Objeto acha a chave de ferro. Algumas pistas **mudam a luta**: avisar do grick, desmascarar o mímico e achar o fosso tiram a surpresa.

## Pendente de regra e de cena

- **Feito:** os drenos (PV máximo do espectro, lívido e aparição; Força da sombra, e quem morre por Força 0 vira uma sombra nova), o agarrar do mímico e do arbusto errante, o **Engolir** (2d8 por turno de quem o arbusto prende, Constituição CD 14), a masmorra no escuro, a fuga com paredes destrutíveis e fumaça por passo, Rose e Thorn lutando se atacados, a segunda porta secreta da varanda (11) e o bloco da vassoura do livro.
- **Inspiração** continua um d6 (a condição `inspirado` da bárdica): o motor não tem o d20 de vantagem por Inspiração, e não vale mexer nele só por isto.
- **Enxame:** não ocupa o espaço de outras criaturas (o tabuleiro tem uma criatura por casa); morde como criatura normal.
- A prata da espada curta (110 po) é só preço; o voo da vassoura não existe (o jogo não tem voo): ela anda a 15 m.
- O resto da Maldição de Strahd (Baróvia, Vallaki, Ravenloft) ainda não existe; a casa termina em "Voltar ao menu".

## Riscos já à vista

- A casa é grande: 4 andares e 2 masmorras dão três a quatro vezes o tamanho da Mansão Tresendar. Por isso vale cortar.
- O motor tem **um nível de elevação por casa** e o jogo não gira a câmera: andares empilhados precisam ser cenas separadas, ligadas por escadas, e não um prédio em corte.
- Marcos de nível em vez de XP pedem um gancho novo no motor de progressão.
