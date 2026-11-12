# A fila do motor dos bestiários — primeira leva (2026-11-12)

O que os blocos dos outros bestiários pediam e o motor não fazia fica em `src/dev/bestiario/<livro>-pendente.json`. Medida
antes desta leva: **326 entradas** (VGM 94, MTF 137, BGG 40, FTD 25, AI 18, MM 12), em **271 mecânicas diferentes** — a
fila é uma cauda longa: só 30 mecânicas aparecem em mais de uma criatura.

| Tipo | Entradas |
|---|---|
| traço | 134 |
| ação | 82 |
| magia que o jogo não tem | 52 |
| reação | 36 |
| ação lendária | 18 |
| sem golpe nenhum | 4 |

As 52 de MAGIA são quase todas de fora da luta (Controlar a Água, Controlar o Clima, Símbolo, Terreno Alucinatório, Sonho):
a criatura entra no jogo sem elas, e isso não muda a luta.

## O que entrou (`testes-fila-bestiario.mjs`, 10 provas no Encounter de verdade)

- **O traço que a criatura usa como ação bônus** vira ação especial com `bonus` (`importar-bestiario.mjs`, depois da
  leitura de sempre): o Passo Feérico dos quatro eladrins, o Passo das Sombras, o Teletransporte do merrenoloth, o
  Transporte Benigno, o Segundo Fôlego do campeão, a Fúria Marcial dos dois espectros da espada, a Provocação do bardo e
  da Brahma, a Corrupção e a Paralisia do nagpa, a Exibição Divina. A IA (`ai.js bonusEspecialNoTurno`) teleporta para o
  lado do inimigo que não alcança andando (`casaAoLado`) ou para longe quando ferida e cercada, cura com meia vida, e dá o
  golpe a mais no colado mais ferido.
- **Os traços lidos da frase** (`tracoLido`, motor em `livro-motor.js`): a Aversão ao Fogo (os três oblex, e mais três
  criaturas do MM que a tinham só como texto), o Indomável, a Proteção Arcana do abjurador, a Pele Venenosa dos três
  grungs (no golpe desarmado, na arma natural e no agarrão) e o Despertar do Rebento dos seis berços do Bigby (o rebento
  nasce na casa do berço antes da conta de fim de luta).
- **A Carapaça do tortle** (`concha`): +4 na CA, caído, sem deslocamento, sem reação; a IA se recolhe com um terço da vida
  e dois colados, fica enquanto o cerco dura e sai quando ele abre.
- Condições novas: `aversaoAoFogo`, `naConcha`, `exposto`, `provocado`.

**A fila caiu de 326 para 289.**

## Achados no caminho
- O teleporte só era lido com "teleports ... up to N feet": o "can teleport up to" e o "teleport 60 feet" ficavam de fora.
- Ler "ação bônus" em qualquer traço pegava o Balbucio do boca-gaguejante, que já tinha motor (fala da ação bônus de quem
  o ouve): a leitura nova roda DEPOIS da de sempre e só na frase em que a própria criatura usa a ação bônus.
- O Desafio do Campeão do Donaar saía como "incapacitado" (a frase cita a condição dele mesmo): fica na fila.
- A varredura (`varrer-bestiario.mjs`) não quebrou nenhuma criatura; as quatro lutas sem fim do MTF (Graz'zt, marut,
  recuperador, Titivilus) já existiam antes desta leva, com os blocos iguais.

## O que fica
289 entradas, quase todas de uma criatura só. As que se repetem: as magias de fora da luta, as reações a magia
(Reflexo de Magia, Encanto Instintivo), o Dreno de Vida, a Magia de Guerra, o Motor de Dor, a Perna Grudenta, o Comando
Infernal.

## A fila das magias (2026-11-12)

72 magias na fila (PHB 42, Xanathar 29, Tasha 1). Medido, elas são quase todas o que você já mandou deixar de fora: a magia
que só se narraria (Desejo, Simulacro, Teletransporte por Círculo, Controlar o Clima, Templo dos Deuses...), as de 1 minuto
ou mais de conjuração (as Conjurar Elemental, Celestial e Fada, o Tsunami) e as de alto círculo que pedem motor novo
(Muralha Prismática, Polimorfia em Massa, Dragão Ilusório).

Entraram as três que mexem no que o jogo já tem (`testes-magias-xge.mjs`):
- **Controlar Chamas** (truque): apaga, dobra ou corta pela metade a luz de uma chama do mapa (a tocha, o braseiro, a
  fogueira; `rules/chamas.js`). Explorando, a ação vem travada, então o truque aparece também no menu da chama, de longe e
  sem tocha (`game/fogo.js opcoesDeControlarChamas`): apagar a fogueira do Cume de 45 pés, antes de entrar, conferido no
  navegador.
- **Pirotecnia** (2º): a chama se apaga e vira fogos (Constituição ou cego, a 3 m) ou fumaça (6 m, escuridão pesada,
  1 minuto).
- **Cochilo** (3º): até três dormem dez minutos e acordam com o descanso curto (os recursos e os dados de vida que o
  descanso sugere).

O que sobra na fila e muda a luta: Invocar Demônios Menores e Maior (o demônio que ataca qualquer um), Esfera Aquosa,
Dispersar, Ossos da Terra, Redemoinho, Fúria da Natureza, Dragão Ilusório, Eterealidade, Muralha Prismática.
