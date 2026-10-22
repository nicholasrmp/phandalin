# Phandalin

RPG tático cooperativo no navegador, com as regras do **SRD 5.2**. Até 4 pessoas
numa campanha, combate por turnos em grade isométrica de 1,5 m.

```bash
npm install
npm run dev      # http://localhost:5190
npm run build
```

`http://localhost:5190/estilos.html` mostra as quatro direções visuais que foram
avaliadas antes de escolher o isométrico.

---

## Estado atual

Protótipo de **combate** jogável: um encontro contra goblins, com os quatro
personagens prontos no 2º nível. Sem campanha, sem rede, sem conta — ainda.

O que já funciona:

- **Iniciativa por lado.** Rola-se uma vez para o grupo e uma para os inimigos;
  o lado inteiro age antes de passar a vez. Corta a fila de espera que mata jogo
  tático com 4 humanos.
- **Combate completo**: ação, ação bônus, reação, movimento em pés, ataque de
  oportunidade, vantagem/desvantagem com motivo explícito, crítico, cobertura,
  testes de resistência, concentração, testes de morte.
- **Quatro classes no 2º nível**, cada uma com seu verbo tático: Retomar o
  Fôlego e Ação Surpreendente (Guerreira), Ataque Furtivo e Ação Ardilosa
  (Ladino), Preservar a Vida e Discípulo da Vida (Clérigo), Esculpir Magias
  (Mago).
- **Magias** nos cinco formatos que o motor entende: ataque mágico, teste de
  resistência, dano automático, cura e bônus com concentração.
- **Elevação**: subir um nível custa o dobro (escalada, pelo SRD), o platô dá
  cobertura contra quem está embaixo e corta linha de visão.
- **IA de monstro** que fecha distância antes de atirar, foca em quem está
  machucado e usa Escapada Ágil quando se vê cercada.
- **Arte gerada por código**: nenhum arquivo de imagem no repositório.

Teste de fumaça, pelo console do navegador em modo dev:

```js
__app.autoPlay()   // joga o combate inteiro sozinho e devolve o resultado
__app.enc          // estado do encontro
```

---

## Licenças — leia antes de adicionar conteúdo

O projeto depende de **dois** instrumentos diferentes, e eles cobrem coisas
diferentes. O detalhamento está em [NOTICE.md](NOTICE.md); o resumo:

| O quê | Instrumento | Pode? |
|---|---|---|
| Regras, magias, monstros do SRD | **CC-BY-4.0** (SRD 5.2) | Sim, com atribuição. Irrevogável. |
| Nomes de lugares e personagens dos Reinos | **Fan Content Policy** da WotC | Sim, se o jogo for **gratuito** e trouxer o aviso. Revogável. |
| Texto, mapas e encontros de módulos publicados | — | **Não.** Nem de graça. |

É por isso que **motor e campanha são separados** no código: a licença das
regras é irrevogável, a política de fã não é. Se um dia a política mudar,
troca-se o arquivo de campanha e o motor continua de pé.

Nada neste repositório foi extraído de sites que hospedam os livros sem licença.
Todo texto de aventura é escrito do zero.

---

## Mapa do código

```
src/
  core/
    rng.js        RNG semeado — toda rolagem passa por aqui
    dice.js       d20 com vantagem, crítico, dano, resistência
    grid.js       grade de 1,5 m: distância, caminho, visão, elevação
  rules/          ← o motor. Puro: não sabe desenhar.
    abilities.js  modificadores, proficiência, perícias, CD de magia
    equipment.js  armas e armaduras, cálculo de CA
    conditions.js condições e o que cada uma muda mecanicamente
    spells.js     magias declarativas
    party.js      os quatro personagens prontos
    monsters.js   blocos de estatística do SRD
    combat.js     o encontro: turnos, ataques, dano, morte
    ai.js         IA dos monstros
  art/
    looks.js      paleta + traços de cada figura (inclusive equipamento)
    draw.js       o pintor: look → pixels
    sheet.js      folha de sprites, contorno automático, cache
  view/           ← só desenha e traduz clique. Não conhece regra.
    board.js      tabuleiro isométrico
    hud.js        fichas, barra de ações, log de rolagens
  main.js         liga tudo
```

A separação `rules/` ↔ `view/` não é estética: o motor é autoritativo e puro,
então **move para o servidor sem reescrita** quando entrar o multiplayer.

---

## Por que isométrico

Quatro direções visuais foram desenhadas e comparadas (`/estilos.html`): pixel
art em vista superior, mesa de RPG com tokens redondos, isométrico 2.5D e
minimalista tático. A escolha foi o **isométrico**, ciente do custo: mais
ângulos por personagem, clique em losango mais difícil que em quadrado, e
oclusão a resolver.

Em troca, a elevação virou mecânica de verdade em vez de decoração.

**Projeção** (`view/board.js`):

```
sx = ox + (x - y) · TW/2
sy = oy + (x + y) · TH/2 - altura · LIFT
```

**Projeção inversa** (clique → quadrado), a partir do centro do losango:

```
x = cx/TW + cy/TH        y = cy/TH - cx/TW
```

Arredondar dá o losango que contém o ponto. Como a altura desloca o losango para
cima, os platôs são testados do mais alto para o mais baixo — assim clicar no
topo seleciona o platô, não o chão atrás dele.

---

## Mapas

Mapa é texto. `src/main.js`:

```
'.'      chão
'#'      parede (bloqueia movimento e visão)
'~'      terreno difícil (custa o dobro)
'o'      cobertura (+2 de CA, bloqueia movimento)
'1'..'9' elevação, cada nível = 1,5 m
```

---

## Como adicionar conteúdo

**Monstro** — `src/rules/monsters.js` (só blocos do SRD) + um look em
`src/art/looks.js`. Um look é um objeto de ~10 linhas: paleta e traços
(`armorStyle`, `weapon`, `helm`, `shield`, `cloak`…). Não precisa desenhar nada.

**Magia** — `src/rules/spells.js`, escolhendo um dos cinco `kind` que o motor
entende (`attack`, `save`, `auto`, `heal`, `buff`). Sem código novo.

**Personagem** — `src/rules/party.js`.

**Traço visual novo** (um elmo diferente, uma arma nova) — aí sim é arte, em
`src/art/draw.js`. Vale o esforço: o traço passa a existir para todas as figuras.

---

## Deploy

**No ar:** <https://phandalin.nicholas-rmpimentel.workers.dev>

```bash
npm run build
npx wrangler deploy
```

Publicado como **Worker com assets estáticos**, não como Cloudflare Pages. A
configuração está em `wrangler.toml`.

O motivo é concreto, não preferência: quando o multiplayer entrar, o Durable
Object de cada grupo vai viver **neste mesmo Worker**. Site e servidor de salas
no mesmo domínio significa um só deploy, sem CORS e sem dois lugares para
manter. O próprio wrangler já recomenda Workers para projetos novos.

Hoje `wrangler.toml` não tem `main`: é um Worker só de assets, servindo o build
do Vite. Para somar o servidor de salas, basta acrescentar `main` e o bloco
`[[durable_objects.bindings]]`.

`public/_headers` vai para a raiz do build e define o cache: os assets do Vite
têm hash no nome e são imutáveis, então ficam em cache para sempre; o HTML
revalida sempre. `.node-version` fixa o Node 20.

Para republicar a cada push sem rodar nada à mão, dá para ligar o build do
Workers pelo painel da Cloudflare apontando para este repositório
(build `npm run build`, deploy `npx wrangler deploy`).

---

## O que vem a seguir

1. **Equilíbrio.** O encontro atual está fácil demais: 6 testes automáticos, 6
   vitórias. Precisa de passe de ajuste.
2. **Campanha como dados**: cenas, gatilhos, diálogo, testes de perícia, loot.
3. **Multiplayer**: um Durable Object por grupo, servidor autoritativo. Como o
   motor já é puro e por turnos, é o degrau mais fácil de netcode que existe —
   e as rolagens acontecendo no servidor eliminam trapaça por construção.
4. Criação de personagem, evolução de nível, descanso.
5. Mais ângulos de sprite e um passe de paleta no cenário.

---

Código sob licença MIT (veja [LICENSE](LICENSE)). Conteúdo de regras e de
cenário sob os termos descritos em [NOTICE.md](NOTICE.md).
