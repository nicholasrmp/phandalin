# A Encruzilhada da Forca — revisão de fidelidade e de encontros (2026-11-11)

Dois revisores em sonnet: `fidelidade-aventura` (a cena contra o de-para do livro, `_referencias/obelisco58/cap6.md` §3.6)
e `revisor-encontro-tatico` (posições, surpresa, orçamento de XP do DMG e cada luta jogada NA SALA de verdade, 60 lutas
por sala, 7º e 8º nível). Os achados abaixo foram conferidos no código antes de entrar aqui.

## O que está certo (medido)

- Quantidades, ND e XP dos 12 blocos batem com o livro, e o Qunbraxel bate com o 5e.tools número a número.
- O tesouro de todas as salas bate com o livro, inclusive as 14.050 peças de PRATA do cofre.
- As CDs batem: a barra de G11 (15/21), a secreta de G16 (15), o grick alfa (15) e o mofo (12, 4d10).
- Os 38 combatentes nascem em casa livre, na sala certa, e se alcançam com as portas abertas.
- O enrolador recua para a névoa de G12 em 100% das lutas.

## Na sala de verdade, a medida muda

| Sala | Campo aberto, 7º nível | Na sala, 7º nível (vitória / morte) | Na sala, 8º nível |
|---|---|---|---|
| G14, se o grupo atacar | 58% | 28% / 97% | 20% / 97% |
| G21, grimlocks e basiliscos | 95% | 40% / 10% (2,8 petrificados) | 48% / 5% |
| G23/G24, o Qunbraxel | 88% | 53% / 60% | 65% / 33% |
| G16, os chuuls | 98% | 85% / 42% | 93% / 27% |
| G3, os ashenwights | 100% | 92% / 15% | 93% / 10% |
| as outras (G6, G8, G9, G10, G20) | 94% a 100% | 92% a 100% / 0% a 10% | 97% a 100% |

Pelo DMG, quatro lutas são mortais (G3, G14, G16, G24) e três são difíceis. O dia inteiro vale cerca de dois dias de
aventura: o grupo precisa de um descanso longo no meio.

## Achados, por gravidade

**Alta**
1. **G23 dispara na casa errada** (`encruzilhada.js salaDaGuarda`): a luta começa na boca sul de G23, a 8 casas do
   Qunbraxel e a 24 dos grimlocks da torre, sem linha de visão. O painel diz que eles se veem pelas seteiras, e ninguém
   se vê. Conserto: disparar quando um herói vê o Qunbraxel pelas seteiras ou chega a 9 m dos grimlocks da torre.
2. **A Rajada Mental atinge os aliados neutros** (`ai.js`, a conta do cone): quem espera em `side: 'neutro'` conta como
   inimigo, e o Qunbraxel mata 1,37 grimlock da própria guarda por luta. É defeito do MOTOR e vale para qualquer cena com
   aliado à espera. Simulado com o conserto: a morte de herói cai de 60% para 40%.
3. **O multiataque do Livro dos Monstros repete só o primeiro golpe** quando os golpes são diferentes
   (`importar-bestiario.mjs`). O grick alfa dá duas Caudas em vez de Cauda e Tentáculos (mais o Bico se acertar), e o
   xorn dá três Mordidas de 3d6+3 em vez de três Garras e uma Mordida. **São 39 criaturas do MM nesse caso**: behir,
   centauro, drider, mantícora, marilith, verme púrpura, enrolador, chefe de guerra orc, golem de ferro e outras.
4. **A seteira protege o herói, e não o Qunbraxel**: o motor dá a cobertura a quem está colado na seteira. O Qunbraxel
   fica no meio da sala, e quem leva +5 é o herói do corredor. O revisor sugere documentar e não mexer, porque o Qunbraxel
   já mata o bastante.

**Média**
5. **G14, "Atacar" não avisa que é mortal**: o Zoklork e os dois elementais dão 28% de vitória no 7º nível. O livro não
   diz que os elementais defendem o Zoklork. Sozinho, o Zoklork dá 100%.
6. **G21 depende de desviar os olhos do basilisco**: 40% de vitória sem desviar, 100% desviando. Falta um aviso (uma
   Percepção ou Natureza que leia o olhar).
7. **G10 usa a maior Furtividade dos dois enroladores**: o motor usa a menor, porque notar um basta. Com a maior, 65% das
   lutas começam com o grupo surpreso; com a menor, cerca de 15%.
8. **G8: o grick alfa quase nunca embosca**: quatro testes de CD 15, e basta um passar (4% de surpresa).
9. **Os seis gricks chegam cedo e morrem juntos**: o alfa é ferido na 1ª rodada, e os gricks caem numa Bola de Fogo.
10. **O que o Qunbraxel sabe** (o livro lista o que ele conta) não vira pista: ele só insulta e morre.
11. **O Zoklork e a Vakketar não têm "Perguntar outra coisa"** (`npc-saber-cenas.js`).

**Baixa**
- Salas sem nada para olhar:
  - G7, G11, G16 (a mesa), G18 (a porta pela metade), G22 (as cadeiras), G23 (as seteiras) e G25 (os ossos dos três
    drow e as facas);
  - a lore de História de G19 e G21;
  - a porta fria de G21.
- A luz da FA em (43,20) acende G12, e o livro diz que as salas são escuras.
- Os ashenwights de G3 e os chuuls de G16 não têm cerca (o livro os prende à sala).
- Os reforços da guarda aparecem dentro de G24, e não na porta.
- As direções iniciais (`facingVec`) são todas para o sul; não muda a regra.
- O nome do golpe da corrente animada no registro.

## Medido com

- O harness dos revisores: `sala.mjs` e os outros scripts no scratchpad desta sessão, fora do repositório.
- `src/dev/medir-encruzilhada.mjs` (campo aberto) e `testes-encruzilhada.mjs` (21 provas).

## O multiataque do MM, corrigido (2026-11-11)

O achado 3 está resolvido.
- **O leitor do importador** (`importar-bestiario.mjs multiataque`) agora lê o multiataque DEPOIS dos golpes e entende:
  - as sequências com o total somado ("três garras e uma mordida");
  - o plural, o pronome e os números até dez;
  - as ALTERNATIVAS ("... ou três espinhos da cauda", "dois punhos ou duas marretas", as formas dos licantropos);
  - "só um pode ser a mordida" e "só uma vez cada";
  - a troca ("uma cauda no lugar das duas garras");
  - a substituição da drider;
  - a parte sem nome de golpe ("três ataques corpo a corpo; ou duas azagaias", que vira `porArma`).
- **O motor** ganhou duas coisas (`combat.js golpesDoAtaque` e o laço da ação de Ataque):
  - `multiattack.sequencias`: vale a primeira que tem a arma escolhida;
  - `multiattack.condicional`: o bico do grick alfa só depois de os tentáculos acertarem nesta ação.
- **Medido nas 198 criaturas do MM com multiataque**: 148 ficaram iguais e 50 mudaram, todas conferidas contra o texto do
  livro. Entre elas estão as 39 que repetiam o primeiro golpe, mais as que ganharam a alternativa que faltava (os slaads,
  o merrow, o sahuagin, os reis homens-lagarto).
- **Exemplos**:
  - o xorn passa de três mordidas a três garras e uma mordida;
  - o enrolador passa de quatro mordidas de 4d8+4 a quatro tentáculos e uma mordida;
  - a marilith passa de 2 golpes a 7;
  - o monitor kuo-toa passa de 1 a 3.
- **Provas**: oito no conversor (`testes-importar-bestiario.mjs`), que falham no leitor antigo, e duas no motor
  (`testes-bestiario.mjs`: o bico do grick alfa jogado em 120 sementes, e as sequências da mantícora e do xorn). O
  varredor do MM não quebra nenhuma das 366 criaturas; a única luta sem fim é a do rakshasa, cujo multiataque não mudou.
- **Na Encruzilhada, em campo aberto e no 7º nível**:
  - G10 (os enroladores) ficou mais fácil: 90% da vida sobra, contra 76%. Antes eles mordiam quatro vezes.
  - G14 (o Zoklork e os elementais) passou de 58% para 72% de vitória: o xorn tinha três mordidas de 3d6+3.
  - G8 (o grick alfa) quase não mudou.

## Os achados da cena, corrigidos (2026-11-11)

- **(2) A Rajada Mental e o sopro não pegam mais o neutro** (`ai.js`): quem espera em `side: 'neutro'` conta como aliado
  na conta da área. Prova em `testes-encruzilhada.mjs`, que falha na IA antiga: na semente 1, a Rajada tirava 11 PV da
  própria guarda. O conserto vale para qualquer cena com aliado à espera.
- **(1) G23 só dispara quando há luta**: quando alguém vê o Qunbraxel pelas seteiras (até 18 m), chega a 9 m dos grimlocks
  que martelam a torre, ou entra em G24. A boca sul do corredor não dispara mais nada.
- **(11, baixa) A guarda sai pela porta da sala** (`portaDaGuarda`, 57,43), e não do meio dela.
- **(5) G14: "Atacar o Zoklork"** luta só com ele (os elementais não o defendem). Na sala, no 7º nível: 100% de vitória e
  0 mortes, contra 28% e 97% antes.
- **(6) G21: o aviso do basilisco.** Natureza CD 12, do melhor do grupo, diz que o olhar petrifica e lembra o "Desviar os
  olhos". Quem falha ainda vê as estátuas. A IA do simulador não liga o interruptor, então a medida de lá não muda (50%);
  quem muda é o jogador.
- **(7) G10: a surpresa é do motor**, herói a herói, com a menor Furtividade dos dois enroladores. Medido em 200 lutas no
  7º nível: 8% dos heróis surpresos e 6% de grupo inteiro surpreso, contra 65% antes.
- **(8) G8: só testa quem vai à frente**, o herói mais perto da estalactite. A emboscada do grick alfa passou de 4% para
  37% das lutas, medido na sala.
- **(10) O que o Qunbraxel sabia** vira painel e pista ao cair: os fanáticos o enganaram, os Sawplee pegaram os cacos, o
  aglomerado guarda o fragmento de Talhundereth e há outro na cripta.
- **(baixas)**:
  - catorze objetos novos para olhar em G7, G11, G16, G17, G18, G19, G20, G21, G22, G23 e G25 (os ossos dos três drow, as
    facas, as seteiras, a lore das casas Azfadiel e Triestoroth, a porta fria);
  - a luz de G12 saiu, porque as salas são escuras;
  - os ashenwights ficam presos a G3 e os chuuls a G16;
  - as direções iniciais seguem a sala (os ashenwights para a forja, os grimlocks para a torre);
  - o retângulo de G19 engolia um trecho do túnel de G18 e foi corrigido.

**Ficaram como estão, com o motivo:**
- **(4) A cobertura das seteiras**: o motor a dá a quem está colado nelas. O revisor recomendou não mexer, e o Qunbraxel
  já é o muro do lugar.
- **(9) O ritmo dos gricks**: é o livro (o alfa chama na primeira ferida).
- **O "Perguntar outra coisa" do Zoklork e da Vakketar**: a conversa deles é a árvore da cena.

`testes-encruzilhada.mjs`: 25 provas. As suítes de regras, cenas, Talhundereth, cripta, bestiário, regiões, goblin e
Zorzula passam, e o `conferir-paredes` e o `conferir-cena` dão 0 achados.
