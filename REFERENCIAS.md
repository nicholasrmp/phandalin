# Referências de design — rodada 3

O dono do projeto revisou as 68 figuras e apontou quinze criaturas que estão
erradas. Para catorze delas forneceu uma imagem de referência.

As imagens estao em `_referencias/` na raiz do repositorio. A pasta e ignorada
pelo git de proposito: e arte de terceiro, serve de consulta e nao entra no
repositorio publicado.

**Como usar.** Abra a imagem com a ferramenta de leitura de arquivo e olhe. A
descrição escrita abaixo de cada uma é a minha leitura dela, feita para você ter
um âncora em texto — mas **a imagem manda**. Se a descrição e a imagem
divergirem, a imagem está certa e a descrição está incompleta.

**O que NÃO fazer.** Não é para copiar a ilustração: é arte de terceiro, não
entra no repositório e não se reproduz. O que se tira dela é o *desenho da
criatura* — anatomia, proporção, silhueta, paleta, o que ela veste e como se
porta. Você escreve pixel art nossa, do zero, com o pintor do projeto.

Em quase todos os casos o problema não é que a figura esteja feia: é que ela é
**de outra espécie**. A coruja-urso está verde-água e parece gente de pijama; o
ogro é um trapézio musculoso quando devia ser uma barriga com perninhas. Leia a
imagem antes de mexer numa linha.

---

## 1 · Bugbear — `_referencias/2.webp`
**Arquivos:** `src/art/looks/bestiario.js` (bugbear, klarg, reiGrol) e o que for
preciso em `src/art/draw.js`/`body.js` para suportar os traços novos.

Goblinoide grande e **peludo por inteiro**, pelo fulvo dourado escuro, mais
claro no peito e mais escuro nos braços e pernas. Orelhas grandes, pontudas e
**com tufo de pelo na ponta**, como lince. Focinho achatado, boca muito aberta
num rosnado, presas inferiores grandes. Testa baixa, olhos pequenos e fundos.

O equipamento é a chave e hoje não existe:
- **Uma ombreira só**, no ombro direito, de couro preto com **espigões** — a
  assimetria é metade da silhueta.
- **Cinto largo preto** com fivela, e abaixo dele um **saiote de tiras de couro
  preto** descendo até o meio da coxa.
- **Manopla/bracelete de couro preto com rebites** no antebraço esquerdo.
- **Clava com espigões** (morning star) erguida acima da cabeça, não ao lado.
- Pés descalços com garras.

Postura: curvado para a frente, braços longos passando do quadril, peso numa
perna. Hoje ele é uma pêra invertida lisa — falta pelo, falta o preto do couro
contra o fulvo, e falta a arma erguida.

---

## 2 · Hobgoblin — `_referencias/3.webp`
**Arquivos:** `src/art/looks/bestiario.js` (hobgoblin) e o pintor.

**Nada de soldado de cimeira alta e postura de sentido.** O hobgoblin da
referência é um brutamontes blindado em posição de combate, agachado e de lado.

- Pele **laranja-avermelhada forte**, cabelo **ruivo escuro** penteado para
  trás, orelhas pontudas coladas, rosto fechado num rosnado com **presas
  inferiores**. Sobrancelha pesada.
- Armadura **azul-acinzentada escura**, de placas angulosas sobre cota de malha
  visível no peito e nas coxas.
- **Ombreira esquerda enorme com espigões** apontando para trás.
- **Escudo gigantesco**, quase metade da figura, angular, com reforço central —
  é o elemento dominante da silhueta.
- **Espada longa de lâmina com gancho** perto da ponta, empunhada baixa e à
  frente.
- **Arco longo e aljava de flechas nas costas**, aparecendo por cima do ombro.
- Botas de placas com ponta.

Postura: joelhos dobrados, corpo de três quartos, escudo adiantado. Ele tem de
ler como "soldado profissional pronto para receber a carga", não como guarda em
formatura. A altura cai: hoje está com 73 px e a anatomia pede 64 — tirar a
cimeira resolve e ainda conserta o aviso de escala.

---

## 3 · Ogro — `_referencias/4.webp`
**Arquivos:** `src/art/looks/humanoides.js` (ogro), `src/art/body.js` (espécie).

Hoje é um trapézio de ombro largo e musculoso. **Está errado.** O ogro da
referência é:

- **Barrigudo** — a barriga é a maior massa do corpo, pendendo à frente.
- **Curvado quase até o chão**, apoiando o peso para a frente; a cabeça fica na
  altura dos ombros ou abaixo.
- **Cabeça pequena** em relação ao corpo, enfiada entre os ombros, sem pescoço.
- Pele **amarelada pálida, quase creme doentio**, lisa, sem pelo.
- Boca enorme e escancarada com dentes irregulares, olho minúsculo e amarelo,
  orelha pequena e pontuda.
- Braços **muito longos**, chegando ao chão, com mãos enormes e unhas grossas
  escuras.
- Roupa: trapos esfarrapados na cintura, **tiras de pano enroladas** nas
  canelas e nos antebraços, uma correia cruzando o peito.
- **Clava de tronco com espigões** numa das mãos, apontada para baixo.

Mude a espécie em `body.js`: menos ombro, muito mais barriga, cabeça menor,
braços mais longos, corcunda muito maior.

---

## 4 · Lobos — sem imagem
**Arquivo:** `src/art/plans/quadrupede.js`.

Só um ajuste e vale para lobo e lobo atroz: **as orelhas estão arredondadas e
ficaram fofas**. Lobo tem orelha **triangular, pontuda e ereta**. Deixe o
focinho mais comprido e estreite o crânio na mesma passada.

E resolva a colisão: **lobo e lobo atroz estão pixel a pixel idênticos** (IoU
1,000). O atroz é criatura Grande — tem de ser visivelmente maior, de cernelha
mais alta, cabeça mais maciça e pelo mais escuro.

---

## 5 · Stirge — `_referencias/5.png`
**Arquivo:** `src/art/plans/feras.js` (variante `stirge`).

- Cor **vermelho-tijolo/ferrugem** por inteiro, translúcido nas asas.
- **Probóscide longa, reta e fina** saindo da frente da cabeça, com a ponta
  curvada — é a assinatura da criatura e hoje não existe.
- **Quatro asas membranosas**, finas, esticadas para os lados como lâminas, com
  furos e rasgos; não são asas de pássaro.
- Cabeça pequena com **um olho grande e redondo** e um **tufo de pelos
  eriçados** no alto.
- Corpo pequeno pendurado no meio das asas, quatro pernas finas e articuladas
  com garras, e uma **cauda longa e fina** encurvada.

Miúdo: 14–24 px. Desenhe acima da linha do chão, porque voa.

---

## 6 · Coruja-urso — `_referencias/6.webp`
**Arquivo:** `src/art/plans/feras.js` (variante `coruja-urso`).

Hoje está **verde-água e parece uma pessoa de pijama**. Está completamente
errado.

- Cor **cinza-pardo escuro**, quase marrom-chumbo, com o peito e a face mais
  claros.
- **Cabeça de coruja de verdade**: redonda e larga, **tufos de pena erguidos**
  como orelhas, disco facial claro em volta dos olhos, **olhos grandes e
  escuros** virados para a frente, **bico amarelo curvo e aberto**.
- **Penas na metade de cima** — peito, ombros e braços cobertos de penas em
  camadas escalonadas — e **pelo de urso na metade de baixo**, pernas e quartos
  traseiros.
- Corpo e postura de **urso**: largo, pesado, apoiado nas quatro patas ou
  erguido nas traseiras, com **garras enormes e curvas** nas dianteiras.

Grande: 66–75 px. A silhueta é "urso com cabeça de coruja", e as duas metades
têm de ter texturas diferentes.

---

## 7 · Ghoul — `_referencias/7.png`
**Arquivo:** `src/art/plans/mortoVivo.js` (variante `ghoul`).

- Pele **branco-azulada acinzentada**, não rosa nem roxa.
- Corpo **magro e esticado**, costelas marcadas, sem cabelo.
- **Língua comprida pendurada para fora da boca** — é a assinatura.
- Olhos pequenos e vazios, orelhas pontudas, cabeça estreita.
- **Dedos longuíssimos com garras**, desproporcionais ao braço.
- **Faixas de pano sujo enroladas** nos antebraços e nas canelas, e um
  **tanga/trapo** amarrado na cintura.
- Postura de corrida: uma perna à frente, tronco inclinado, braços abertos.

---

## 8 · Specter — `_referencias/8.webp`
**Arquivo:** `src/art/plans/mortoVivo.js` (variante `specter`).

- **Roxo/violeta luminoso**, inteiro — essa cor é a diferença dele para o
  wraith e hoje os dois são idênticos.
- Rosto de **caveira com olhos brancos acesos** e um sorriso largo de dentes.
- **Cabelo em filamentos erguidos para cima**, como se flutuasse na água.
- Tronco emaciado, costelas visíveis, **mãos com dedos longos e garras**.
- Da cintura para baixo **dissolve numa névoa** que se abre; não tem pernas.
- Translúcido: as bordas quase desaparecem no fundo.

---

## 9 · Wraith — `_referencias/9.webp`
**Arquivo:** `src/art/plans/mortoVivo.js` (variante `wraith`).

Mesma família, leitura **oposta** ao specter:

- **Preto e cinza-escuro**, fumaça densa, nada de roxo.
- **Elmo ou coroa com chifres/pontas** cobrindo o alto da cabeça — a assinatura.
- **Olhos amarelos acesos** no escuro do capuz.
- Braços **muito longos**, com dedos afilados que se desfazem em fiapos.
- Corpo mais **sólido** que o do specter no centro, dissolvendo nas bordas.
- Postura inclinada para a frente, como quem avança.

Depois do ajuste, specter e wraith têm de ser distinguíveis **pintados de
preto** — hoje têm IoU 1,000.

---

## 10 · Doppelganger (forma real) — `_referencias/10.png`
**Arquivo:** `src/art/looks/aberracoes.js` (doppelganger).

- Pele **azul-acinzentada**, lisa, sem pelo nenhum.
- **Crânio alongado para trás**, careca, sem orelhas aparentes.
- **Olhos brancos vazios**, sem pupila, levemente afundados.
- Corpo **magro e longo**, musculatura seca e definida, sem roupa.
- **Dedos longos** nas duas mãos; braços compridos pendendo ao lado.
- Boca pequena, nariz quase inexistente — o rosto é liso e errado de propósito.

A graça dele é que a forma real só aparece quando ele é desmascarado. Deixe um
campo no look para alternar entre a forma disfarçada e esta.

---

## 11 · Dragão verde jovem — `_referencias/11.webp`
**Arquivo:** `src/art/plans/dragao.js`.

Hoje está com as **asas dobradas**. A referência tem as **asas abertas**, e é
isso que faz o bicho.

- **Asas abertas para os dois lados**, membrana verde-clara/amarelada com
  nervuras escuras e **garra na dobra** de cada asa.
- **Pescoço longo em S**, erguido, cabeça no alto.
- Cabeça com **coroa de chifres apontando para trás** e crista espinhosa
  descendo pelo pescoço.
- **Fileira de espinhos** por todo o dorso até a cauda.
- Verde-oliva escuro nas costas, **ventre amarelo-esverdeado em placas**
  horizontais.
- Quatro patas com garras, erguido nas traseiras, **cauda longa e sinuosa**.

A célula tem 52 px de largura. Asa totalmente aberta não cabe: abra até onde
couber, erguendo as pontas, e deixe claro que são asas abertas. Prefira perder
um pouco de envergadura a perder o pescoço em S e a coroa de chifres.

---

## 12 · Caveira Candente — `_referencias/12.png`
**Arquivo:** `src/art/plans/aberracao.js` (variante `cranioFlamejante`).

- A chama é **VERDE**, não laranja. Verde-limão brilhante, mais clara no centro.
- Caveira **branco-osso** flutuando dentro dela, virada de frente.
- **Órbitas acesas em vermelho-laranja**, o único ponto quente da figura — o
  contraste verde/vermelho é a leitura inteira.
- Dentes cerrados bem marcados, mandíbula visível.
- A chama lambe para cima e para trás e **muda de forma entre os quadros**.
- Sem corpo nenhum.

---

## 13 · Vigia Ciclópico — `_referencias/13.webp`
**Arquivo:** `src/art/plans/aberracao.js` (variante `olhoVigia`).

Hoje é um vulto curvado humanoide. A referência é mais bicho que gente:

- Apoiado nas **quatro patas**, costas arqueadas bem acima da cabeça.
- **Um olho enorme** ocupando quase todo o rosto, íris **verde-amarelada** com
  pupila preta pequena e brilho — é a única cor viva da figura.
- **Boca larga logo abaixo do olho**, cheia de dentes finos e irregulares.
- **Espinhos longos e irregulares** saindo das costas e dos ombros, apontando
  para trás e para cima.
- Pele **marrom-escura quase preta**, enrugada e seca, com manchas mais claras.
- Membros finos e longos terminando em **garras pretas grandes**.

---

## 14 · Nezznar — `_referencias/14.webp`
**Arquivo:** `src/art/looks/npcs.js` (nezznar).

Mago drow:

- Pele **cinza-escura**, **cabelo branco** comprido, rosto severo.
- **Capa vermelha-carmim** por dentro, esvoaçando — o único vermelho da figura
  e o ponto de leitura.
- Manto e armadura leve **cinza-chumbo quase preto**, com **broche vermelho**
  no peito e na cintura.
- **Cajado erguido com uma ARANHA de metal preto no topo** — é a assinatura
  dele e o apelido ("a Aranha Negra") depende disso.
- Postura dramática: braço do cajado erguido, corpo inclinado.

---

## 15 · Spectator — `_referencias/15.webp` (criatura nova)
**Arquivos:** novo em `src/art/plans/aberracao.js` + `src/art/looks/aberracoes.js`
+ `src/rules/monsters/aberracoes.js`.

**Leia a seção de licença abaixo antes de escrever o bloco.**

- Esfera **verde escamosa** flutuando, do tamanho de um escudo.
- **Um olho central grande**, íris azul-acinzentada com pupila vertical de gato.
- **Boca enorme e escancarada** ocupando a metade de baixo da esfera, cheia de
  dentes cônicos, com uma **língua longa e rosada** saindo e encurvando.
- **Quatro hastes oculares** finas saindo do topo e dos lados, cada uma com um
  **olho pequeno amarelado** na ponta, curvadas em direções diferentes.
- Cristas e espinhos curtos no alto da esfera.
- Flutua: desenhe acima da linha do chão, com sombra no chão.

### Licença desta criatura — leia

O spectator **não está no SRD** e é da família do beholder, que é a IP mais
protegida da Wizards. Ele entra por outro instrumento: a **Fan Content Policy**,
a mesma que já sustenta "Phandalin", "Nezznar" e "Venomfang" neste projeto.

Portanto, para esta criatura:

- O **nome e o conceito** são conteúdo de fã. Dependem de o jogo continuar
  **gratuito** e de o aviso continuar visível. Essa política é **revogável**.
- O **bloco de estatística é NOSSO**: números escritos por você, coerentes com
  um grupo de nível 3 a 5. Marque `fonte: 'propria'` e escreva no comentário que
  o nome é conteúdo de fã e os números são do projeto.
- **Não copie o bloco do Monster Manual.** Não parafraseie as ações dele.
- A arte é nossa, desenhada do zero.
