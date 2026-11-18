# Avisos de licença e atribuição

Este projeto depende de dois instrumentos legais diferentes. Eles cobrem coisas
diferentes e **não** são intercambiáveis — vale entender a separação antes de
adicionar qualquer conteúdo.

---

## 1. Regras do jogo — SRD 5.1, Creative Commons Attribution 4.0

> This work includes material taken from the System Reference Document 5.1
> ("SRD 5.1") by Wizards of the Coast LLC, available at
> <https://www.dndbeyond.com/srd>. The SRD 5.1 is licensed under the Creative
> Commons Attribution 4.0 International License, available at
> <https://creativecommons.org/licenses/by/4.0/legalcode>.

**Por que 5.1 e não 5.2.** Os blocos de monstro deste repositório são os da era
2014: o lobo com CA 13 e mordida 2d4+2, o mago de ND 6, o doppelganger com
Ataque Surpresa +3d6. Esses números vêm do SRD 5.1. O 5.2, derivado do Monster
Manual de 2024, renomeou famílias inteiras de blocos genéricos (Thug virou
Tough, Veteran virou Warrior Veteran) e mudou os números. Os dois documentos são
CC-BY-4.0, então a escolha não é de legalidade — mas a CC-BY obriga a nomear a
obra de onde o material saiu, e o projeto afirmava 5.2 enquanto usava 5.1.
Atribuir 5.1 era a correção barata; reescrever 46 blocos com os números de 2024
seria a cara.

Cobre: classes, espécies, antecedentes, talentos, magias, equipamento,
condições, blocos de estatística de monstros do SRD e o motor de regras
(iniciativa, ações, testes de resistência, descanso).

Esta licença é **irrevogável**. É a fundação sólida do projeto.

**O que passa do SRD (Livro do Jogador 2014).** Por decisão do dono do projeto, os heróis seguem o Livro do Jogador de 2014 inteiro, e não só o SRD:
as subclasses, magias e características que NÃO estão no SRD 5.1 (por exemplo Mestre de Batalha, Totêmico, Círculo da Lua, Assassino, as escolas
de mago além da Evocação e as demais) ficam marcadas `fonte: 'phb'` no código (`src/rules/classes/*.js`, `src/rules/spells.js`). Entram também aqui as 16 manobras
do Mestre de Batalha, a tabela de 50 surtos de Magia Selvagem (`src/rules/surto.js`, que segue a ordem e os números do livro, com frases próprias; os efeitos que o livro
entrega ao mestre ou são só cor saem no registro, sem regra) e as listas de magias de patrono do bruxo. Esse conteúdo **não**
está sob a CC-BY-4.0: o jogo usa só os nomes e a mecânica, com texto e arte próprios, sob a Política de Conteúdo de Fã da seção 2, e não reproduz
o texto do livro. Se a Wizards mudar a política, esse conteúdo é o primeiro a sair; o que é `fonte: 'srd'` continua de pé.

Tudo que vier do SRD deve ficar em `src/rules/` e ser marcado com o comentário
`// SRD 5.1 (CC-BY-4.0)` no topo do arquivo.

---

## 2. Cenário, aventuras e os livros — Política de Conteúdo de Fã da WotC

> Phandalin é conteúdo de fã não oficial, permitido sob a
> [Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy)
> da Wizards of the Coast. Não é aprovado nem endossado pela Wizards.
> Partes dos materiais utilizados são propriedade da Wizards of the Coast.
> ©Wizards of the Coast LLC.

Condições que o projeto respeita:

- **É gratuito.** Sem venda, sem assinatura, sem loja, sem anúncio.
- Traz o aviso acima de forma visível (rodapé do jogo e este arquivo).
- Não usa logotipos nem marcas registradas da Wizards.
- Não remove avisos de copyright de material deles.

**O que o jogo usa da Wizards além do SRD, dito sem rodeio.** Desde 2026-11-08, por decisão do dono do projeto, o
conteúdo não se limita mais ao SRD 5.1 nem à cena de fã de antes. Entram como DADO e MECÂNICA:

- **As aventuras.** *A Mina Perdida de Phandelver* e *Phandelver and Below: The Shattered Obelisk* (capítulos 1 a 8):
  os lugares, as salas, os encontros, as criaturas de cada sala, os NPCs, o tesouro e o enredo. *A Maldição de Strahd*
  na Casa da Morte, parada mas no jogo.
- **Os livros.** Os blocos de monstro do *Monster Manual*, do *Volo's Guide*, do *Mordenkainen's Tome of Foes*, do
  *Fizban's Treasury*, do *Bigby Presents* e do *Acquisitions Incorporated*, com as criaturas que são identidade da
  Wizards (o devorador de mentes, o observador, a besta deslocadora e as outras); as magias, os talentos, as raças, os
  antecedentes e as subclasses do *Livro do Jogador*, do *Xanathar*, do *Tasha*, da *Costa da Espada* e do Fizban;
  os itens mágicos, os venenos, as doenças e as armadilhas do *Livro do Mestre*; e a lore de deuses, lugares e povos.
- **A origem dos números.** Os números (CA, PV, dano, CD, alcance) vêm do espelho público do 5e.tools no GitHub, que
  hospeda o conteúdo desses livros sem licença da Wizards. A regra de cada um foi conferida e escrita à mão nas tabelas
  de `src/dev/**/ajustes-*.mjs` e `src/rules/classes/subclasses-*.js`.

**O que NÃO entra, e é medido.** A PROSA dos livros — o texto lido em voz alta, as descrições, as falas, a regra
escrita — não se copia: todo texto do jogo é nosso, e `python src/dev/conferir-colagem.py --min 10` acusa qualquer
trecho de dez palavras ou mais igual ao livro (hoje, zero). As traduções dos livros para o português foram escritas
por modelo de linguagem com instrução de usar as nossas palavras, nunca as do livro.

**As fichas das criaturas** (`public/fichas/`, os tokens redondos do tabuleiro) SÃO arte de terceiros e vão com o
jogo: as da galeria "D&D Monster Tokens" do imgur (postada por topped2013 em 2019), as do espelho do 5e.tools (arte da
Wizards) e as nossas, montadas sobre a arte dos heróis. As listas estão em `src/dev/fichas-imgur.json` e
`src/dev/fichas-5etools.json`.

**O risco, assumido.** A Política de Conteúdo de Fã é revogável, e não está claro que ela cubra um jogo que carrega
o conteúdo de quinze livros como dado. O dono do projeto decidiu em 2026-11-18 publicar assim mesmo, sabendo que a
Wizards pode pedir que o conteúdo saia do ar. Se pedir, sai: o motor (`src/rules/`, com o que é `fonte: 'srd'`)
continua de pé, e o que é dos livros está separado por arquivo (`livro-*.js`, `magias-livro-*.js`,
`subclasses-*.js`, `caracteristicas-*.js`, os capítulos do Obelisco em `src/game/`).

---

## 3. A arte de terceiros que NÃO se publica

Estas ficam no disco de quem as baixou, para jogar aqui (`npm run dev`), e nunca vão ao repositório nem ao site. O
`.gitignore` as marca, e o build só leva de `public/` o que o git conhece (`src/dev/montar-publico.mjs`):

- **Os battlemaps da Forgotten Adventures** (`public/mapas/fa/`, `/mapas/`). Não é questão de risco: a licença deles
  proíbe embutir em video game, também no release grátis. Sem o arquivo, a cena abre com o chão do jogo.
- **Os mapas oficiais do Obelisco** (`public/mapas/oficial/`) e **a figura inteira de cada criatura**
  (`public/criaturas/`), arte da Wizards baixada do 5e.tools. Ficaram de fora por decisão anterior do dono; sem
  eles, a região e a vila mostram a pintura nossa, e a ficha da criatura mostra o token.
- **Os mapas da Morvold Press** da Casa da Morte (`_referencias/`, `public/mapas/casa-da-morte/`): só referência.

Os mapas pintados que VÃO com o jogo são nossos, gerados em modelo de imagem (o da emboscada dos goblins saiu do
Nano Banana Pro pelo OpenArt) e cortados na grade.

---

## 4. Código

O código deste repositório é MIT — veja `LICENSE`. A licença MIT cobre **apenas
o código**; o conteúdo de regras segue CC-BY-4.0 e o de cenário segue a política
de fã, conforme as seções acima.

---

## 5. Música

A faixa da tela de título (`public/musica/vincere-vel-mori.mp3`, "Vincere vel
mori") foi criada pelo autor do projeto com um gerador de música por IA. Não é
de terceiros e não vem de nenhum jogo, álbum ou biblioteca de som.

**A licença MIT não cobre este arquivo.** Ela vale só para o código (seção 4).
O que se pode fazer com a música depende dos termos do serviço que a gerou
**no plano em que foi gerada** — alguns serviços reservam uso comercial aos
planos pagos, e o direito autoral sobre obra gerada por IA é incerto na maioria
das jurisdições. Enquanto o jogo for gratuito e sem fins comerciais, o risco é
pequeno; se isso mudar, a faixa precisa ser reconferida antes.

Os efeitos sonoros, ao contrário, não são arquivos: são sintetizados em código
(`src/core/audio.js`) e entram na licença do código.
