# Contrato do elenco

Documento de trabalho. Todo agente que mexe em arte, bestiário, animação, efeito
ou som lê isto primeiro e segue à risca. Se algo aqui conflitar com o código
existente, o código existente ganha e você reporta o conflito em vez de o
resolver sozinho.

> **O estado de cada criatura** (ficha, folha desenhada, animação, onde aparece) e o
> roteiro para criar uma nova estão em [`CRIATURAS.md`](CRIATURAS.md).

---

## 1. Licença — a regra que não se negocia

O jogo é **gratuito**. É isso que nos põe dentro da Fan Content Policy da Wizards
of the Coast. Nada do que você escrever pode criar obrigação de pagamento.

**Três categorias, três tratamentos:**

| O quê | Pode? | Como |
|---|---|---|
| Regras e blocos de estatística do **SRD 5.1** | Sim | CC-BY-4.0. Atribuição já está em `NOTICE.md`. |
| **Nomes** de lugares e personagens do módulo | Sim | Fan Content Policy. Só o nome e o papel. |
| **Texto, mapas, descrições de sala, diálogo** do módulo publicado | **Não** | Nunca. Nem parafraseado de perto. |

**Consequência prática para o bestiário:**

- Criatura cujo bloco está no SRD → use o bloco do SRD e marque `fonte: 'SRD'`.
- Criatura do módulo que **não** está no SRD (crânio flamejante, nothic,
  spectator, blights) → **não tente reproduzir o bloco**. Crie uma criatura
  **nossa**, com nome nosso e números nossos, marque `fonte: 'propria'`, e
  escreva no comentário qual papel ela ocupa no encontro.
- **Se você não tem certeza se algo está no SRD, não invente a atribuição.**
  Marque `fonte: 'verificar'` e diga por quê. Chutar "SRD" num bloco que não é
  SRD é o pior erro possível neste projeto.
- **Não consulte 5e.tools nem nenhum site de compilação de regras.** Use o que
  você sabe do SRD e sinalize a incerteza.

NPC do módulo: o **nome** é fan content e pode. O bloco de combate dele sai de um
bloco do SRD (plebeu, guarda, cavaleiro, mago, acólito, sacerdote, veterano,
espião, capitão bandido). A personalidade e as falas que escrevermos são nossas —
não copie as do livro.

---

## 2. O que está errado na arte hoje (o que você tem de consertar)

Parecer profissional é o objetivo. Nota atual honesta: **5,5/10**. Os defeitos,
em ordem de gravidade:

1. **Teste da silhueta reprova.** Pinte a guerreira, o hobgoblin, o orc e o
   bugbear de preto: é o mesmo retângulo com cabeça e dois braços, só em
   tamanhos diferentes. No tabuleiro a figura aparece com ~55 px de altura e
   **só a silhueta chega ao jogador** — o detalhe some. É o defeito mais caro.
2. **Pose única.** Todos os humanoides na mesma postura: braços retos para
   baixo, pés plantados, de frente. Lê como prancha de boneco de vestir.
3. **Rostos iguais.** Hobgoblin e orc têm o mesmo rosto com tinta diferente.
4. **Paleta dos inimigos é uma lama só** — todos no mesmo marrom-verde-bege, no
   mesmo valor médio. Como grupo, viram uma mancha.
5. **Sem hierarquia de leitura.** Detalhe uniforme do pé à cabeça; o olho não
   tem onde pousar. Falta um elemento-herói por criatura.
6. **Pares quase idênticos** — chefe goblin e goblin diferem em 2 px e um elmo.

**Como você verifica que consertou:** descreva a silhueta da sua criatura em uma
frase, sem citar cor. Se essa frase servir para outra criatura do elenco, você
não resolveu.

---

## 3. Contrato da arte

### Célula e escala

- Folha de sprites: célula **52 × 80**, linha do chão a 5 px da base, **75 px
  úteis** de altura. `art/sheet.js` monta a folha e põe o contorno preto
  automático depois — **não desenhe contorno você mesmo**.
- Escala de referência, em pixels de figura:

  | | |
  |---|---|
  | Miúdo (stirge, rato) | 14 – 24 |
  | Pequeno (goblin, halfling) | 38 – 45 |
  | Médio (humano, hobgoblin, orc) | 52 – 66 |
  | Grande (ogro, coruja-urso, bugbear) | 66 – 75 |

  A comparação entre tamanhos é o que dá sentido de escala ao tabuleiro. Uma
  criatura Grande que sai com 55 px está errada mesmo que bonita.

### Vistas e poses

Cada look é desenhado em 3 vistas × 4 poses:
`dir` ∈ `front | side | back`, `pose.kind` ∈ `idle | attack | hurt | down`,
`pose.frame` ∈ `0 | 1`. `idle` tem 2 quadros (respiração), `attack` tem 2.

### Kit de desenho — `art/kit.js`

```js
px(x, y, w, h, cor)                  // retângulo; x=0 é o centro, y negativo sobe
cut(x, y, w, h)                      // apaga (arredondar canto)
volume(x, y, w, h, cor, {topo, base})// cilindro: luz, núcleo, sombra, luz refletida
coluna(y, h, forma, cor, {topo})     // largura variável: forma(t) => {c, w}
contato(x, y, w, cor)                // sombra onde uma peça pousa na outra
traco(x0, y0, x1, y1, esp, cor)      // diagonal: perna de aranha, asa, galho
disco(cx, cy, raio, cor)             // círculo: olho, bolha, orbe
ramp(cor, n)                         // n>0 clareia, n<0 escurece, com matiz
```

**`coluna` é a ferramenta principal.** Retângulo empilhado é o que faz um corpo
parecer recortado em papel. Use `coluna` para qualquer forma que não seja
genuinamente uma caixa.

**Luz vem de cima e da esquerda.** Sempre. Nada de retângulo chapado: toda peça
leva luz, núcleo, sombra e a aresta de luz refletida, e sombra de contato onde
duas peças se encontram.

**Cor passa por `ramp()`**, nunca por multiplicação de RGB. `ramp(c, 2)` clareia
dois degraus com o matiz indo para o amarelo; `ramp(c, -3)` escurece três com o
matiz indo para o azul-arroxeado.

### Plano corporal — `art/plans/`

Quem não é humanoide ganha um arquivo próprio:

```js
// art/plans/aracnideo.js
import { ramp } from '../kit.js';

export function paintAracnideo(kit, look, dir, pose) {
  const { px, volume, coluna, traco, disco } = kit;
  // ...
}
```

e se registra em `art/plans/index.js`. O look aponta com `plan: 'aracnideo'`.

**Nenhum plano importa `draw.js`.** Só `../kit.js` e, se precisar de medidas
humanoides, `../body.js`.

---

## 4. Elenco da campanha

Marcação: **SRD** = bloco do SRD 5.1. **própria** = criatura nossa, porque a do
módulo não está no SRD. **NPC** = nome do módulo (fan content) sobre bloco SRD.

### Goblinoides e humanoides hostis — plano `humanoide`

Goblin · Chefe goblin · Hobgoblin · Bugbear · Ogro · Bandido · Capitão bandido ·
Rufião · Batedor · Veterano · Mago · Acólito · Espião · Plebeu · Guarda · Nobre ·
Cavaleiro · Drow — todos **SRD**.

**Goblin único, com duas armas.** O goblin guerreiro e o arqueiro são um só, o
bloco do SRD sem um número mudado (CA 15, cimitarra e arco curto). A figura
troca de folha com a arma do golpe (espada e escudo ou arco), e trocar de arma
é a interação gratuita do turno, uma por turno.

### Bestas — plano `quadrupede` ou `feras`

Lobo (feito) · Lobo atroz · Aranha gigante · Aranha-lobo gigante · Rato gigante ·
Morcego gigante · Urso pardo · Javali · Coruja-urso · Stirge — **SRD**.

### Mortos-vivos — plano `mortoVivo`

Esqueleto · Zumbi · Ghoul · Espectro · Wraith — **SRD**.

### Aberrações, limos e dragão

Gelatina ocre (**SRD**, plano `gosma`) · Doppelganger (**SRD**, plano
`humanoide`) · Dragão verde jovem (**SRD**, plano `dragao`) ·
**Crânio flamejante → criatura própria** (plano `aberracao`) ·
**Vigia de um olho só → criatura própria**, no lugar do nothic (plano
`aberracao`) · **Infectados** — galho, espeto e vinha, os três do Livro dos Monstros
(plano `aberracao`, variante `brotoEspinhoso`).

### NPCs — plano `humanoide`, bloco SRD

Sildar Hallwinter (cavaleiro) · Gundren Rockseeker (plebeu anão) ·
Toblen Stonehill (plebeu) · Elmar Barthen (plebeu) · Linene Graywind (plebeu) ·
Halia Thornton (espiã) · Harbin Wester (nobre) · Daran Edermath (veterano
meio-elfo) · Qelline Alderleaf (plebeia halfling) · Carp Alderleaf (plebeu
halfling, criança) · Irmã Garaele (acólita elfa) · Reidoth (druida humano) ·
Agatha (espectral) · Iarno Albrek (mago) · Nezznar (mago drow) · Droop (goblin) ·
Yeemik (goblin) · Klarg (bugbear) · Mormesk (wraith) · Venomfang (dragão verde
jovem) · Hamun Kost (mago) · Rei Grol (bugbear).

**Cada NPC precisa de um rosto que o jogador reconheça da segunda vez.** Dois
plebeus com a mesma cara são dois NPCs falhados.

---

## 5. Dono de cada arquivo

Ninguém escreve num arquivo que não é seu. Se precisar de algo que está em
arquivo alheio, descreva o que falta no seu relatório final.

| Trabalho | Arquivos |
|---|---|
| Pintor humanoide, pose, silhueta, rosto | `src/art/draw.js`, `src/art/body.js` |
| Plano aracnídeo | `src/art/plans/aracnideo.js` |
| Plano morto-vivo | `src/art/plans/mortoVivo.js` |
| Plano aberração e limo | `src/art/plans/aberracao.js` |
| Plano feras | `src/art/plans/feras.js` |
| Plano dragão | `src/art/plans/dragao.js` |
| Looks do bestiário | `src/art/looks/bestiario.js` |
| Looks dos NPCs | `src/art/looks/npcs.js` |
| Blocos de monstro | `src/rules/monsters.js` |
| NPCs | `src/rules/npcs.js` |
| Animação | `src/view/fx.js` |
| Efeitos visuais | `src/view/visuals.js` |
| Som | `src/core/audio.js` |

`src/art/plans/index.js` é compartilhado: registre o seu plano lá com **uma
linha de import e uma de registro**, sem tocar no resto.

---

## 6. Como escrever

Este repositório tem um padrão de comentário. Siga-o:

- Comentário explica **por que**, não o que. "Dois ataques por turno" é inútil;
  "o segundo com desvantagem, senão o chefe mata o mago na rodada 1" é útil.
- Português do Brasil, incluindo nos nomes de variável quando o domínio é do
  jogo (`cintura`, `pele`, `ramp`).
- Nada de `Math.random()` em regra — use `core/rng.js`. `Math.random()` só em
  efeito visual puro.
- Nada de arquivo de imagem ou de áudio no repositório. Tudo é gerado.
- `npm run build` tem de passar.
