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

## Riscos já à vista

- A casa é grande: 4 andares e 2 masmorras dão três a quatro vezes o tamanho da Mansão Tresendar. Por isso vale cortar.
- O motor tem **um nível de elevação por casa** e o jogo não gira a câmera: andares empilhados precisam ser cenas separadas, ligadas por escadas, e não um prédio em corte.
- Marcos de nível em vez de XP pedem um gancho novo no motor de progressão.
