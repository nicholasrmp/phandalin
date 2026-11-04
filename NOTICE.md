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

## 2. Cenário e personagens — Política de Conteúdo de Fã da WotC

> Phandalin é conteúdo de fã não oficial, permitido sob a
> [Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy)
> da Wizards of the Coast. Não é aprovado nem endossado pela Wizards.
> Partes dos materiais utilizados são propriedade da Wizards of the Coast.
> ©Wizards of the Coast LLC.

Cobre: nomes de lugares, personagens e elementos de cenário dos Reinos
Esquecidos usados na campanha.

Condições que o projeto precisa respeitar, e respeita:

- **É gratuito.** Sem venda, sem assinatura, sem loja.
- Traz o aviso acima de forma visível (rodapé do jogo e este arquivo).
- Não usa logotipos nem marcas registradas da Wizards.
- Não remove avisos de copyright de material deles.

**A Maldição de Strahd** (a Casa da Morte, `src/game/casadamorte*.js`, `capitulo-casadamorte.js`) é conteúdo
de fã do mesmo tipo: nomes (Strahd von Zarovich, Baróvia, Rose e Thorn, os Durst), a ordem das salas, as CDs e o que
há em cada área seguem o livro; **todo o texto de descrição, os diálogos, as plantas e a arte são nossos**. As
plantas foram desenhadas à mão, com os mapas da Morvold Press (Jeff Todd) só como referência de organização: nenhum
desses mapas é distribuído, copiado ou embutido neste repositório (a pasta de referência é ignorada pelo git). A
vassoura animada de ataque não é SRD e vem marcada `fonte: 'propria'`.

**Os mapas pintados** de `public/mapas/` são NOSSOS: gerados por nós em modelos de imagem (o da emboscada dos
goblins, `emboscada.webp`, saiu do Nano Banana Pro pelo OpenArt) e depois cortados na grade do jogo. Mapa de
batalha comprado ou baixado de terceiro não entra no repositório nem é distribuído: quando serve de referência de
trabalho, fica em `_referencias/`, que o git ignora.

**O Esconderijo dos Marcarrubra** usa, por baixo da planta, o mapa oficial da campanha de A Mina Perdida de
Phandelver no Roll20 — a mesma que o dono deste repositório comprou e tem na conta dele. A imagem **não** é
copiada, convertida nem redistribuída: o `fundo.url` aponta para o CDN do Roll20, de onde a própria campanha a
serve, e o repositório não guarda um byte dela. Quem não tiver a campanha vê a planta do jogo do mesmo jeito —
o desenho é enfeite, e a regra inteira está no terreno, que é nosso. A pasta `_referencias/roll20/`, onde a
imagem fica durante o trabalho de medição, é ignorada pelo git.

**Atenção:** esta política **não** é irrevogável, diferente da CC-BY. É por isso
que o motor e a campanha são separados no código — se um dia ela mudar, troca-se
o arquivo de campanha e o motor continua de pé.

---

## 3. O que este projeto NÃO faz

- **Não** reproduz o texto, as caixas de leitura, os mapas ou o conteúdo de
  nenhum módulo de aventura publicado. A política de fã permite criações de fã,
  não redistribuição de produtos à venda.
- **Não** usa conteúdo extraído de sites que hospedam os livros sem licença.
- **Não** usa monstros fora do SRD que são IP exclusiva da Wizards
  (beholder, mind flayer, displacer beast, entre outros).

Todo o texto de aventura, diálogo, encontro e mapa deste repositório é escrito
do zero para este projeto.

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
