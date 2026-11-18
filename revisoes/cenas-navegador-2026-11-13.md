# As cenas no navegador, 2026-11-13

`node src/dev/testes-cenas-navegador.mjs --url http://localhost:5190`, depois da revisão dos mapas do mesmo dia: a luz
que parou de vazar pela parede, as peças de arte ligadas às chamas, as pontes e o fosso da Mansão, o fundo da Poça
Salgada, o portão do Zorzula e os Sawplee sem o chefe.

**43 de 45 cenas sem problema**, nenhum erro de console, nenhuma cena que não abre, nenhuma luta que trava.

| Cena | O que deu | De quem é |
|---|---|---|
| Castelo (cap. 3) | Luta parada com os hobgoblins e um goblin da torre fora da vista, um deles atrás de porta fechada | Do jogador automático, que não abre porta nem vai atrás de quem não vê. Igual à passada de 12/11 |
| Ânima (cap. 8) | Luta sem fim em 20 rodadas: o grupo batendo no obelisco, e um profeta escondido fora da vista, a 60 pés | Do jogador automático (só ataca o que vê) e, até hoje, de um defeito do próprio teste, abaixo. Rodada de novo, a Ânima acabou em vitória na 6ª rodada |

## O defeito do teste

O diagnóstico da luta parada dizia se um herói **alcança** o inimigo com a busca crua da grade (`field.reachable`), que
não conta o voo. No Vazio todo mundo voa (`vazio.js darVoo`), e o grupo da Ânima nasce numa ilha de 37 casas, então
TODO inimigo saía "INALCANÇÁVEL". Com a busca do motor (`enc.reachableFor`, a mesma do clique e da IA), o herói alcança
as 624 casas, o profeta inclusive. A passada de 12/11 deixou a Ânima como "provavelmente porta, não confirmado": não é
porta (o mapa não tem porta nem tranca no caminho). O teste agora usa `reachableFor`.

## O jogador automático aprendeu a abrir porta: 45 de 45

Três mudanças no teste e uma na política do grupo:

- **Destravar** (`testes-cenas-navegador.mjs`): com 3 rodadas sem dano, ou com um inimigo que ninguém alcança, o teste
  abre a porta fechada que separa o grupo dele, a mais perto do inimigo (trancada ou não, como quem arromba); sem porta
  assim, foca o grupo no inimigo de pé mais perto que ele ainda não acertava (o gancho `ignora` do motor). Cada
  intervenção vai para as notas da cena. Se nem assim alguém perder PV em 8 rodadas, a luta parada é acusada: aí é do jogo.
- **A luta longa que ainda anda** ganha mais 20 rodadas, até 60: varrer o Castelo sala a sala leva 32.
- **A política do grupo** (`balance.js playCharacter`): a busca da casa de onde se enxerga o alvo ia até 300 pés, e no
  Castelo o contorno passava disso, então o grupo ficava parado a 10 pés do goblin da torre. Agora vai até 2.000 pés, e,
  se nenhuma casa enxerga o alvo, anda-se até encostar nele. Só muda o caso em que antes o herói não se mexia: a
  emboscada medida segue em 85,87% de vida, igual.

Passada inteira: **45 de 45 cenas sem problema**. Só o Castelo precisou do teste abrindo porta.
