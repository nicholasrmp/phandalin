# Revisão dos ícones escolhidos pelo dono — 2026-11-10

O lote: 175 chaves cujo ícone mudou com as escolhas da página Escolha dos Ícones (170 trocas, a rapieira nas duas
chaves, a Magia de Pacto com selo, as duas poções que trocaram de cor). Desenhados PELO JOGO no navegador, em Esmalte
(`iconCanvas`), a 96, 32 e 20 px. Três sub-revisores e o chefe, todos em sonnet. Nenhum veredito pede geração: tudo sai
de graça, da coleção ou da cor por chave.

## Medido

- Os 162 gerados no OpenArt batem com a coleção em espessura (mediana 6,1 contra 5,5), detalhe (13,5 contra 14,5),
  tinta (0,42 contra 0,40) e leitura a 20 px (0,75 contra 0,73). A mistura não aparece a olho.
- A ocupação da caixa sai um pouco menor nos gerados (mediana 0,77 contra 0,81). A cauda pequena são objetos compridos:
  53 subVida 0,34, 67 inerte 0,35, 72 cajadoDaSerpente 0,36, 110 treno 0,36, 143 projetarImagem 0,37 (também o
  mais pobre de detalhe, 5,8), rapieira 0,44, 125 dominarPessoa 0,45.
- Pelos limiares do vetorizador, só o 63 envenenado (leitura20 0,57) e o 97 mapaDeMormesk (tinta 0,73) reprovam.

## Lista final do chefe

**Alta** (6):
- 173 `classe-pactMagic`: o selo some a 20 px e o ícone fica igual ao do Bruxo. Trocar por `warlock-eye` ou
  `warlock-hood`.
- 102 `item-pedraDeControlarElemental`: lê como rosto de orc, a pedra não aparece. Trocar por `crystal-shine`, `gems`
  ou `stone-block+sparkles`.
- 82 `item-espadaDeGume`: decapitação sem espada, o mesmo desenho do `classe-deathStrike`. Trocar por `sword-slice`.
- 91 `item-malhaDeAneis`: o mesmo `scale-mail` da brunea, na mesma família. Trocar por `chain-mail`.
- 96 `item-mantoDeOlhos`: manto vazio, igual à capa do charlatão. Usar `cloak+eye-target`.
- 162 `reacao`: alvo com flecha, lê como ataque. Trocar por `shield-reflect`.

**Média**:
- Cor por chave (`familias-escolhas.json`):
  - 63 `envenenado` → veneno, que o separa do item poção de veneno.
  - 45 `classe-shadowWalk` → necrótico.
  - 41 `classe-psionicSorcery` → psíquico.
  - 87 `item-jade` e 90 `item-malaquita` → druida (verde; hoje saem bege).
  - 150 `magia-sombraDeMoil` → necrótico.
  - 104 `item-pocaoDeLeituraMental` → psíquico, que a separa da Poção de Clarividência, com o mesmo frasco e a mesma
    família.
- 65 `iluminado`: lâmpada elétrica, anacrônica. Trocar por `sunbeams` ou `sun-radiations`.
- 111 `item-varinhaDeBolaDeFogo`: a chama sai azul. Pintar a chama por peça em fogo.
- 73 `item-carruagem`: igual à carroça. `chariot` pertence ao carro de guerra; decidir com o dono.
- 57 `classe-tidesOfChaos`: anéis que leem como alvo. Rever depois que o 162 mudar.
- 143 `magia-projetarImagem`: o menor e mais pobre do lote. Precisaria de escala por chave, que o código não tem.

**Baixa / aceitar com ressalva**:
- 16, 29, 31: famílias escuras.
- Os objetos compridos de escala pequena.
- 129 ferir.
- 109, 85, 101, 144, 157, 169, 153, 148, 86: conceito discutível, mas leem.
- 97: bloco chapado.
- 8 contra 1: dois punhos.
- 138 e 139: as muralhas.

## Descartado pelo chefe

- Paleta escura como padrão.
- Os finos 69, 89 e 75.
- Os densos a 20 px.
- O bege da raça no pergaminho.
- As colisões de forma em famílias diferentes: `fire-silhouette`, `shaking-hands`, `treasure-map`, `fire-bottle`.
- Os três mantos (92, 93, 94), separados pela cor e pelos selos.
- O 36 misdirection e o 56 telekineticMovement.
- **Nenhuma mudança na `PALETA_DO_ESMALTE`**: mudar o elétrico mexeria em 10 chaves e encostaria no frio, e mudar a
  necromancia mexeria em 22 chaves por causa de uma só. A cor por chave resolve cada caso.

## O que está em aberto

Sete das trocas (173, 102, 82, 162, 65, 73 e o 96) mexem em ícone que o dono ESCOLHEU olhando. Elas só se aplicam com a
palavra dele. Os nomes sugeridos foram conferidos no pacote (`_referencias/game-icons/package/icons.json`), mas não
desenhados: quem aplicar olha a prancha antes.

## Aplicado (2026-11-11, por ordem do dono: "Aplicar todos")

Trocas por ícone da coleção, em `mapa-zzz-escolhas.json`. Cada substituto foi desenhado e olhado antes de entrar:
- `classe-pactMagic` → `warlock-hood`. Nenhuma outra chave usava esse desenho, e o selo do desempate saiu.
- `item-pedraDeControlarElemental` → `stone-sphere+rock-golem`, uma pedra com o elemental no selo.
- `item-espadaDeGume` → `sword-slice`.
- `item-malhaDeAneis` → `chain-mail+ring`. O selo do anel o separa da Cota de Malha, que tem o mesmo desenho e a mesma
  família.
- `item-mantoDeOlhos` → `cloak+eyeball`.
- `reacao` → `shield-reflect`.
- `iluminado` → `sunbeams`.
- `classe-tidesOfChaos` → `rolling-dice-cup`, o copo de dados, que nenhuma outra chave usava. Saíram os anéis, que liam
  como alvo.

Cor por chave, em `familias-escolhas.json`:
- `envenenado` → veneno.
- `classe-shadowWalk` → necrótico.
- `classe-psionicSorcery` → psíquico.
- `item-jade` → druida.
- `item-malaquita` → druida.
- `magia-sombraDeMoil` → necrótico.
- `item-pocaoDeLeituraMental` → psíquico.

Cor por peça: na Varinha de Bola de Fogo, a chama e o orbe ficaram em fogo, e o cabo ficou na cor de raro.

Ficaram como ressalva:
- A Carruagem: `chariot` é o carro de guerra com o guerreiro em cima e `caravan` é um trailer moderno. A coleção não tem
  uma carruagem fechada.
- A Projeção de Imagem: falta escala por chave no código.
- As baixas da lista.

`testes-regras.mjs` 555/555. `icones-traco-desempate.mjs` rodou de novo e tirou o selo antigo da Magia de Pacto.
