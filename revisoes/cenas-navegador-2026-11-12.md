# As cenas no navegador de verdade (2026-11-12)

Pedido do dono: testes automáticos que joguem as cenas, para achar o que os testes em Node não desenham. O teste é
`src/dev/testes-cenas-navegador.mjs` (o CLAUDE.md diz como rodar). Ele abre cada uma das 45 cenas dos capítulos 1 a 8 do
jeito que o jogo abre (a viagem pela região, `newEncounter({ modo: 'campanha', capitulo: 4, cenaDaVila })`), passa as
narrações, anda 12 vezes clicando casas ao alcance e joga as lutas que começarem com `__app.autoPlay`.

## O que ele mede
- erro no console e exceção sem tratamento;
- cena que não abre, sem herói ou sem tabuleiro;
- luta que trava (a rodada não anda em 20 s);
- LUTA PARADA (oito rodadas sem ninguém perder PV) e luta que não acaba em 20 rodadas, com o diagnóstico de cada inimigo de
  pé: onde está, se voa, se algum herói o vê e se algum o alcança andando.

## A primeira passada: 42 de 45
Nenhuma cena deu erro no console nem exceção, e nenhuma luta travou. Passaram 23 lutas de verdade, com vitória, derrota,
rendição e fuga, e 19 cenas ficaram explorando depois dos 12 passos.

| Cena | O que deu | De quem é |
|---|---|---|
| Nematódeo (cap. 8) | Luta parada com as duas Armadilhas de Intelecto fora do alcance de todos | **Do jogo, reproduzido em Node, CORRIGIDO.** A boca fecha quando um herói chega a 3 m da tenda; quem estava dentro lutava com as armadilhas, e quem ficou fora não tinha caminho até elas. Com o de dentro no chão, a luta não acabava nunca. Decisão do dono: **todos para dentro** — quem do grupo está fora corre para dentro antes de os dentes fecharem, sem o teste de Destreza (`vazio.js fecharABoca`; prova em `testes-obelisco8.mjs`). No navegador, a semente 7 chega à tenda e a luta acaba (uma derrota e uma vitória em duas passadas) |
| Castelo (cap. 3) | Luta parada com os nove do castelo a 5–25 pés do grupo, todos fora da vista | Do jogador automático, que não abre porta (a IA dos monstros também não). Um jogador abriria |
| Ânima (cap. 8) | Nesta passada, dois profetas que voam, fora da vista e do alcance, a 60 pés; noutra passada a luta acabou em vitória na 5ª rodada | Provavelmente o mesmo caso do Castelo (sala que o jogador automático não abre); não confirmado à mão |

## Achados que eram do teste, corrigidos no caminho
- `?encontro=ermo` não abria (`reading 'periodo'`): o ermo espera o encontro sorteado pela tela da região. O teste passou a
  abrir as cenas pelo caminho da campanha, com um encontro da tabela da estrada.
- As lutas da vila do capítulo 5 (Caverna do Poço, Acampamento Sawplee, Telhado) escolhem o bando pelo `cenaDaVila`, que o
  `?encontro=` não passa: abriam sem luta.
- Na primeira cena, o Vite recarrega a página ao otimizar as dependências; o teste espera ela parar de recarregar.

## O que o teste não cobre
O jogador automático não abre porta, não conversa (escolhe sempre a opção principal), não usa os menus de objeto e não
descansa. A semente da luta é a do jogo, tirada do relógio, então cada passada joga lutas diferentes; `--semente` só fixa o
caminho dos passos.
