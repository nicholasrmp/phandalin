# As raças e os antecedentes dos livros — o plano (2026-11-12)

Pedido do dono, depois da lore: o criador de herói usa os livros para as raças e os antecedentes, como já usa para as
magias, os talentos e as subclasses.

## 1. O que há, medido no 5etools (`races.json`, `backgrounds.json`)

Só os livros da lista do dono (PHB, MM, DMG, VGM, XGE, MTF, TCE, FTD, AI, BGG, SCAG). O MPMM (a revisão de 2022 das raças)
não está na lista e fica de fora.

| Livro | Raças e sub-raças novas |
|---|---|
| VGM | aasimar (protetor, flagelo, caído), bugbear, firbolg, goblin, golias, hobgoblin, kenku, kobold, povo-lagarto, orc, tabaxi, tritão, yuan-ti puro-sangue — **15** |
| MTF | githyanki, githzerai, duergar, eladrin, elfo do mar, shadar-kai, gnomo das profundezas, e os tiferinos de oito senhores do Inferno (o de Asmodeus é o do PHB) — **15** |
| SCAG | halfling pés-fantasma, as quatro variantes do meio-elfo (descendência aquática, drow, da lua ou do sol, da floresta) e três do tiferino (língua do diabo, fogo infernal, alado) — **8** |
| FTD | draconato cromático, metálico e de gema — **3** |
| TCE | linhagem personalizada — **1** |
| AI | verdan — **1** |
| DMG | as 17 "raças de vilão" do capítulo 9 (aarakocra, bullywug, esqueleto...) — **ficam de fora**: são opções para o mestre montar NPC, a maioria repetida no Volo, e o jogo já tem esses NPCs como blocos de monstro |
| PHB, XGE, BGG, MM | nada novo (o PHB já está todo no jogo) |

**43 raças novas**, contra as 15 de hoje.

| Livro | Antecedentes novos |
|---|---|
| PHB | as cinco variantes: espião, gladiador, mercador de guilda, cavaleiro, pirata (a sexta, nobre com servos, tem as mesmas perícias do nobre e fica de fora) |
| SCAG | 13: guarda da cidade (e o investigador), artesão de clã, erudito enclausurado, cortesão, agente de facção, viajante de terras distantes, herdeiro, cavaleiro da ordem, veterano mercenário, caçador de recompensas urbano, membro de tribo uthgardt, nobre de Águas Profundas |
| AI | 5: herdeiro de aventureiro famoso, mercador falido, apostador, querelante, estagiário rival |
| BGG | 2: enjeitado dos gigantes, entalhador de runas |

**25 antecedentes novos**, contra os 13 de hoje.

## 2. O caminho: sem a API, desta vez

As magias, os talentos e as subclasses passaram pela tradução por lotes porque cada um tinha um texto longo de regra e
de lore. Aqui não: a raça do jogo é uma lista de traços curtos, e o texto de cada traço É a regra, que se escreve à mão
de qualquer jeito (`rules/racas.js` é assim desde o começo). O antecedente é nome, duas perícias, uma sugestão de
talento e um resumo de uma linha. A lore dos povos já entrou com a lore do mundo (`rules/lore-livros.js`). Então tudo
se escreve à mão, com as nossas palavras, e **não se gasta crédito**.

- `rules/racas-livros.js`: os traços e as raças novas, no mesmo formato de `RACAS` e `TRACOS_RACIAIS`, que os somam.
- `rules/racas-motor.js`: o que os traços novos fazem em luta.
- `game/antecedentes-livros.js`: os 25 antecedentes, somados a `criador.js ANTECEDENTES`, com o motivo de ir a
  Phandalin de cada um.
- A regra das subclasses vale aqui: **uma raça só entra no criador quando o que ela faz em luta funciona**. O que é
  só de mesa (idioma, telepatia, ofício, carga) fica marcado `semEfeito`, com o porquê, como já é no PHB.

## 3. O que o motor precisa (e o que já tem)

Já tem: visão no escuro e a superior, sensibilidade à luz solar, magias raciais por descanso longo, resistência a dano,
vantagem contra condição por traço (`passivas.js vantagemPorTraco`), Resistência a Magia de monstro, Táticas de Matilha
de monstro, voo pela ficha (`flyFt`), nado (`speeds.swimFt`), o fôlego debaixo d'água, a reação automática que tira
dano (a Esquiva Sobrenatural), as ações internas com recurso (`recursoRacial`, o Sopro).

Falta:
- a magia racial que volta no **descanso curto** e a que vem **à vontade**;
- as **armas naturais** (a mordida do povo-lagarto, as garras do tabaxi) e a **armadura natural** (13 + Destreza);
- a **imunidade** racial (veneno e envenenado do yuan-ti);
- a **reação que tira dano** com dado (a Resistência da Pedra do golias);
- o **dano a mais uma vez** (a Fúria dos Pequenos do goblin, o Ataque Surpresa do bugbear, as três transformações do aasimar);
- o **alcance a mais no próprio turno** (o bugbear);
- o **dobro de deslocamento** do tabaxi, a **corrida** de ação bônus do orc;
- a **ajuda dos aliados** no teste falho (Salvar as Aparências do hobgoblin) e o **Rastejar** do kobold;
- o **Sopro do Fizban**, que entra no lugar de um ataque, com 1d10 e usos pelo bônus de proficiência, e o que ele dá no 5º nível;
- a **linhagem personalizada**, que reaproveita o talento do humano variante.

## 4. O que entrou (2026-11-12)

- **As 43 raças**, todas com o que fazem em luta funcionando (`testes-racas-livros.mjs`, 18 provas no Encounter de verdade):
  - as **ações** viraram magias internas de `racas-motor.js` (`ACOES_RACIAIS`), com o uso no recurso da raça (`recursoDe`) e a
    lista por traço (`ACOES_POR_TRACO`): Mãos Curativas, as três transformações do aasimar, Passo Oculto, Rastejar,
    Mandíbulas Famintas, Agressivo, Agilidade Felina (sem custo), Fuga Ágil, Passo Feérico com a estação, Bênção da
    Rainha Corvo, Proteção Cromática, Voo de Gema, os dois sopros metálicos e os 14 sopros do Fizban;
  - o **sopro do Fizban toma o lugar de UM golpe** da ação de Atacar (`noLugarDeUmAtaque`, `combat.js gastarGolpeDoAtaque`):
    o guerreiro do 5º sopra e ainda tem o segundo golpe;
  - os **ganchos** de `combat.js` (uma linha cada): o dano a mais (transformação do aasimar, Fúria dos Pequenos, Ataque
    Surpresa), a Resistência da Pedra, Salvar as Aparências no ataque e na resistência, as Táticas de Matilha e o
    Rastejar do kobold, os Braços Longos do bugbear, o Consumo Radiante no fim do turno e a volta da Agilidade Felina;
  - **dado na ficha** (`aplicarRaca`): tamanho, nado, escalada, voo, imunidade a dano e a condição, armadura natural, arma
    natural (a mordida e as garras, `items/weapons.js`, sempre à mão), vantagem nas resistências (`vantagemRacial`), as
    magias raciais que voltam no descanso curto (`racialCurto_`) e os usos pelo bônus de proficiência;
  - a **Cura do Sangue Negro** do verdan no dado de vida (`descanso.js`).
- **Os 25 antecedentes**, com as perícias do livro (as que ele deixa escolher de uma lista, `escolhe`), o talento de
  origem sugerido e o motivo de ir a Phandalin.
- **O criador**: as raças e os antecedentes por livro (chips), os +1 e o +2 livres, as perícias da lista da raça, o
  traço à escolha, a cor do dragão do Fizban e o talento da linhagem personalizada. Os 58 × 12 classes × 2 gêneros
  montam herói (`testes-criador.mjs`). Os panteões: o orc segue os deuses orcs, o yuan-ti os deuses-serpente, o
  meio-elfo drow os do Subterrâneo.
- **Ícones**: 127 novos (`icones-traco/mapa-novo-racas.json`), 12 desempatados. **Som**: o sopro de gema tem altura própria
  por elemento (`core/audio.js TOM_DO_SOPRO`).
- **Custo: zero**. Nenhuma chamada de API.

**Desvios conscientes**, cada um dito no texto do traço:
- a Fúria dos Pequenos, a Resistência da Pedra e Salvar as Aparências são automáticas (vão no primeiro caso que vale),
  como a Esquiva Sobrenatural;
- o Treino Marcial do hobgoblin dá a espada longa e o arco longo (o livro deixa escolher duas);
- a estação da primavera do eladrin fica de fora (teleportar um aliado no lugar de si);
- o Duergar não tem vantagem contra ilusão (a resistência não sabe a escola da magia);
- a Amizade Animal do yuan-ti e a Tranca Arcana do tiferino de Mammon ficam de fora (sem cobra amiga, sem a magia);
- o +2 livre do Fizban e da linhagem é um +2 e um +1 (o livro aceita também três +1);
- o dano das transformações do aasimar vale no acerto de ataque, de arma ou de magia, e não na magia de resistência.
- **Achado no caminho**: o herói Pequeno agora tem `size` na ficha, e um teste da gelatina ocre procurava "a criatura
  pequena" sem olhar o id, e achava o halfling.

## 5. Na luta de verdade, pelo navegador (2026-11-12)

Quatro heróis criados pelo criador (draconato cromático azul guerreiro, tabaxi ladino, firbolg druida, aasimar protetor
clériga), postos na emboscada da arena pela definição (`newEncounter` com `herois`), sem salvar nada no navegador.
O que o Node não via:

- **A barra escondia as ações de quem não conjura.** `hud.js` só montava as magias para quem tem conjuração ou item que
  conjura; o sopro do draconato guerreiro e a Agilidade Felina do tabaxi ladino não apareciam. O defeito é mais velho que as
  raças: o guerreiro tocado pelo Sopro do Dragão do Xanathar também nunca via o sopro. Agora a ação concedida
  (`concedidasDe`) também abre a barra.
- **A ficha da magia dizia "CD null" no sopro** de quem não conjura: ela lia a CD de conjuração. O sopro usa 8 + CON +
  proficiência (`cdDeCon`), e a ficha agora mostra isso (CD 13 na guerreira de CON 16).
- **As ações só em si mesmo esperavam um alvo** (a Agilidade Felina, o Passo Oculto, as transformações do aasimar): agora
  saem no clique (`acoes.js magiaNaHora`, só para as ações das raças; as magias do Xanathar e do Tasha que são em si mesmo
  seguem pedindo o clique no próprio herói, como antes).
- **A condição `provocado` da Provocação dos bestiários apagava a do Ataque Provocador** do Mestre de Batalha (mesmo nome),
  e o alvo provocado passava a ter desvantagem em tudo. A nova chama `escarnecido`; `testes-magias-xge.mjs` pegou.

Conferido na tela: o sopro em linha pela mira (a prévia e o que a magia pega batem: os goblins A e B caem, o aliado ao lado
fica de fora), a Agilidade Felina (30 → 60 pés, sem gastar ação, a tile apaga), o Passo Oculto (invisível, ação bônus) e
as Mãos Curativas num aliado (cura o nível). A arma natural (Garras) aparece na barra do tabaxi.
