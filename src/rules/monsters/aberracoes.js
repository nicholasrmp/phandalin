// Aberrações, limos e o dragão. Aqui moram também as criaturas
// PRÓPRIAS que substituem monstros do módulo que não estão no SRD.
// SRD 5.1 (CC-BY-4.0) — ver NOTICE.md e ELENCO.md.
//
// Regra dura: nada aqui pode ser bloco de monstro que não esteja no SRD. Se a
// criatura é do módulo publicado e não está no SRD, ela vira criatura NOSSA,
// com nome e números nossos, marcada `fonte: 'propria'`. Chutar atribuição de
// SRD num bloco que não é SRD é o pior erro possível neste projeto.
//
// `TRAITS` deste arquivo é somado ao dicionário de traços em `../monsters.js`.
//
// ---------------------------------------------------------------------------
// CAMPOS QUE O MOTOR AINDA NÃO LÊ
//
// `makeMonster` em `../monsters.js` copia para o combatente o que a regra lê:
//
//   fonte          licença: 'SRD' | 'propria' | 'verificar'
//   resist/immune  tipos de dano reduzidos/anulados (`applyDamage`)
//   vulnerable     dano dobrado (`applyDamage`)
//   immuneConditions  condições que não pegam (`aplicarCondicao`)
//   saves          proficiência em resistências
//   danoExtra      segundo tipo de dano no mesmo golpe (ácido da gelatina,
//                  veneno da mordida do dragão)
//
// Ainda só DADO, sem efeito no motor:
//   flyFt/swimFt   deslocamento alternativo — a grade só conhece `speedFt`
//   breath         arma de sopro em área, com recarga
//
// Nenhum desses campos quebra nada por estar presente: objeto a mais é
// ignorado. Eles ficam declarados para que o bloco não precise ser reescrito
// quando o motor crescer, e para que a ficha possa mostrar a verdade hoje.
// ---------------------------------------------------------------------------

export const ABERRACOES = {
  // ------------------------------------------------- o capítulo 6 do Obelisco ----
  // A GÊMULA ENCEFÁLICA (PaBTSO): a cria do aglomerado encefálico, do tamanho de um gato, que gruda e chupa. Cresce até
  // virar um aglomerado se ninguém a matar em 30 (4d12+4) dias — a cena conta os dias.
  gemulaEncefalica: {
    id: 'gemulaEncefalica',
    tipo: 'aberração',
    name: 'Gêmula Encefálica',
    look: 'gemulaEncefalica',
    fonte: 'PaBTSO',
    size: 'miúdo',
    level: 5,
    cr: '3',
    xp: 700,
    abilities: { str: 1, dex: 18, con: 14, int: 5, wis: 12, cha: 7 },
    ac: 14,
    maxHp: 54,
    hpDice: '12d4+24',
    speedFt: 40,
    senses: { blindsightFt: 30 },
    damageResistances: ['psíquico'],
    conditionImmunities: ['cego'],
    attacks: [
      { name: 'Pancada Psíquica', bonus: 6, damage: '3d10', type: 'psíquico', reachFt: 5, art: 'mace' },
    ],
    traits: ['resistenciaAMagia', 'sanguessuga'],
    blurb: 'Um cérebro com pernas de aranha, do tamanho de um gato. Gruda em quem chega perto e chupa; arrancá-la pede Força.',
  },

  // A GOSMA CINZENTA PSÍQUICA (SRD, com a variante do livro dos monstros que o Obelisco usa): uma poça oleosa que corrói
  // metal e, com a mente que ganhou perto de um caco do obelisco, esmaga a cabeça de quem ela sente a 18 m.
  gosmaCinzentaPsiquica: {
    id: 'gosmaCinzentaPsiquica',
    tipo: 'gosma',
    name: 'Gosma Cinzenta Psíquica',
    look: 'gosmaCinzentaPsiquica',
    fonte: 'SRD',
    size: 'médio',
    level: 2,
    cr: '1/2',
    xp: 100,
    abilities: { str: 12, dex: 6, con: 16, int: 6, wis: 6, cha: 2 },
    ac: 8,
    maxHp: 22,
    hpDice: '3d8+9',
    speedFt: 10,
    speeds: { climbFt: 10 },
    skills: ['furtividade'],
    senses: { blindsightFt: 60 },
    damageResistances: ['ácido', 'frio', 'fogo'],
    conditionImmunities: ['cego', 'enfeitiçado', 'surdo', 'exausto', 'amedrontado', 'caido'],
    attacks: [
      { name: 'Pseudópode', bonus: 3, damage: '1d6+1', type: 'concussão', reachFt: 5, art: 'mace', danoExtra: { damage: '2d6', type: 'ácido' } },
    ],
    traits: ['amorfo', 'aparenciaFalsa', 'esmagamentoPsiquico'],
    blurb: 'Uma poça de óleo cinzento que se mexe. Corrói o metal que a acerta e esmaga, com a mente, a cabeça de quem ela sente.',
  },

  // O MONTE ERRANTE PSIÔNICO (o Obelisco): o monte errante do SRD que devorou um goblin psíquico e ganhou um fiapo de
  // mente. O Enfeitiçar Pessoa do dia ele JÁ GASTOU — foi assim que atraiu o velho Wallin para a caverna.
  monteErrantePsionico: {
    id: 'monteErrantePsionico',
    tipo: 'planta',
    name: 'Monte Errante Psiônico',
    look: 'monteErrantePsionico',
    fonte: 'PaBTSO',
    size: 'grande',
    level: 5,
    cr: '5',
    xp: 1800,
    abilities: { str: 18, dex: 8, con: 16, int: 5, wis: 10, cha: 5 },
    ac: 15,
    acNote: 'armadura natural',
    maxHp: 136,
    hpDice: '16d10+48',
    speedFt: 20,
    speeds: { swimFt: 20 },
    skills: ['furtividade'],
    senses: { blindsightFt: 60, passivePerception: 10 },
    damageResistances: ['frio', 'fogo'],
    damageImmunities: ['elétrico'],
    conditionImmunities: ['cego', 'surdo', 'exausto'],
    attacks: [
      { name: 'Pancada', bonus: 7, damage: '2d8+4', type: 'concussão', reachFt: 5, art: 'mace', onHit: { semResistencia: true, dc: 14, escape: 14, condition: 'contido', note: 'é agarrado e engolido pelo monte' } },
    ],
    multiattack: { count: 2, sequence: ['Pancada', 'Pancada'] },
    traits: ['absorcaoDeRaios', 'engolir'],
    blurb: 'Uma pilha de mato e lodo que anda, com um fiapo de mente roubado de um goblin psíquico. Engole quem pega com os dois braços.',
  },


  // =========================================================== SRD 5.1

  gelatinaOcre: {
    id: 'gelatinaOcre',
    tipo: 'gosma',
    name: 'Gelatina Ocre',
    look: 'gelatinaOcre',
    fonte: 'SRD',
    size: 'grande',
    // `level` só alimenta `proficiencyBonus`. CR 2 quer +2, e +2 vale de 1 a 4.
    level: 3,
    cr: '2',
    xp: 450,
    abilities: { str: 15, dex: 6, con: 14, int: 2, wis: 6, cha: 1 },
    ac: 8,
    acNote: 'massa sem forma',
    maxHp: 45,
    // 3 m por turno. O bloco inteiro depende disso: a gelatina NÃO persegue.
    // Ela é um obstáculo que ocupa corredor, e o grupo que entende isso anda
    // em volta dela. Quem sobe o deslocamento dela destrói o encontro.
    speedFt: 10,
    attacks: [
      {
        name: 'Pseudópode', bonus: 4, damage: '2d6+2', type: 'concussão',
        reachFt: 5, art: 'mace',
        // O ácido é o que faz a gelatina doer mais do que o d20 sugere: o
        // golpe acerta pouco (CA 8 contra bônus +4), mas quando acerta leva
        // duas moedas de dano. Hoje `resolveAttack` aplica só a concussão.
        danoExtra: { damage: '1d6', type: 'ácido' },
      },
    ],
    resist: ['ácido'],
    immune: ['elétrico', 'cortante'],
    // O SRD lista mais condições; aqui só entram as que `conditions.js` tem.
    immuneConditions: ['caido', 'amedrontado'],
    traits: ['amorfo', 'escaladaAracnidea', 'divisao'],
    blurb: 'Tranca o corredor e cobra pedágio em ácido. Lenta demais para perseguir — e cortá-la só a multiplica: cada metade fica um tamanho menor, com metade dos PV e o mesmo pseudópode.',
  },

  // O GRICK do Castelo Dentefino (área 8), o bicho de estimação do Lhupo.
  // Bloco do SRD 5.1, com a resistência a dano NÃO MÁGICO (`damageResistancesNote`, `monsters.js resistNaoMagico`).
  grick: {
    id: 'grick',
    tipo: 'monstruosidade',
    name: 'Grick',
    look: 'grick',
    fonte: 'SRD',
    size: 'médio',
    level: 3,
    cr: '2',
    xp: 450,
    abilities: { str: 14, dex: 14, con: 11, int: 3, wis: 14, cha: 5 },
    ac: 14,
    acNote: 'couro de pedra',
    maxHp: 27,
    hpDice: '6d8',
    speedFt: 30,
    speeds: { climbFt: 30 },
    // O grick do SRD não tem perícia nenhuma: a Percepção passiva 12 sai de
    // Sabedoria 14 sozinha, e a Furtividade dele é +2 com VANTAGEM em terreno
    // rochoso (Camuflagem de Pedra), não +4 fixo. Tinha `skills` e por isso
    // escondia melhor do que devia na rolagem de surpresa do salão escuro.
    senses: { darkvisionFt: 60, passivePerception: 12 },
    damageResistances: ['cortante', 'perfurante', 'concussão'],
    damageResistancesNote: 'cortante, perfurante e concussão só de armas não mágicas',
    attacks: [
      { name: 'Tentáculos', bonus: 4, damage: '2d6+2', type: 'cortante', reachFt: 5, art: 'claw' },
      { name: 'Bico', bonus: 4, damage: '1d6+2', type: 'perfurante', reachFt: 5, art: 'bite' },
    ],
    // O Livro dos Monstros: um ataque de tentáculos e, SE ACERTAR, o bico.
    multiattack: { count: 2, sequence: ['Tentáculos', 'Bico'], seAcertar: true },
    traits: ['camuflagemDePedra'],
    blurb: 'Espera no alto, no escuro, e cai em cima de quem passa: tentáculos e um bico que rasga.',
  },

  doppelganger: {
    id: 'doppelganger',
    tipo: 'monstruosidade',
    name: 'Doppelganger',
    look: 'doppelganger',
    fonte: 'SRD',
    size: 'médio',
    level: 4,
    cr: '3',
    xp: 700,
    abilities: { str: 11, dex: 18, con: 14, int: 11, wis: 12, cha: 14 },
    ac: 14,
    acNote: 'reflexos',
    maxHp: 52,
    hpDice: '8d8+16',
    speedFt: 30,
    senses: { darkvisionFt: 60, passivePerception: 11 },
    skills: ['enganacao', 'intuicao'],
    // Enganação em dobro, como no SRD: sem isto o disfarce dele rolava +4 em
    // vez de +6, e a lábia é o traço todo da criatura.
    expertise: ['enganacao'],
    conditionImmunities: ['enfeitiçado'],
    attacks: [
      { name: 'Golpe', bonus: 6, damage: '1d6+4', type: 'concussão', reachFt: 5, art: 'mace' },
    ],
    // Dois golpes cheios, sem desvantagem no segundo: ao contrário do chefe
    // goblin, este bicho é rápido (DES 18) e os dois ataques são o preço de
    // ter deixado um estranho chegar perto.
    multiattack: { count: 2 },
    traits: ['metamorfo', 'emboscador', 'ataqueSurpresaDoppelganger', 'lerPensamentos'],
    blurb: 'Vem como um aliado, abre com um golpe surpresa de +3d6 e depois bate duas vezes por turno.',
  },

  dragaoVerdeJovem: {
    id: 'dragaoVerdeJovem',
    tipo: 'dragão',
    name: 'Dragão Verde Jovem',
    look: 'dragaoVerdeJovem',
    fonte: 'SRD',
    size: 'grande',
    // CR 8 quer bônus de proficiência +3, e +3 começa no nível 5.
    level: 8,
    cr: '8',
    xp: 3900,
    abilities: { str: 19, dex: 12, con: 17, int: 16, wis: 13, cha: 15 },
    ac: 18,
    acNote: 'escamas',
    maxHp: 136,
    speedFt: 40,
    flyFt: 80,
    swimFt: 40,
    saves: ['dex', 'con', 'wis', 'cha'],
    skills: ['enganacao', 'percepcao', 'furtividade'],
    voice: 'roarDragon',
    attacks: [
      {
        name: 'Mordida', bonus: 7, damage: '2d10+4', type: 'perfurante',
        // Alcance 3 m: ele morde de um quadrado de distância, e é por isso
        // que recuar um passo não tira ninguém do perigo.
        reachFt: 10, art: 'bite',
        danoExtra: { damage: '2d6', type: 'veneno' },
      },
      { name: 'Garra', bonus: 7, damage: '2d6+4', type: 'cortante', reachFt: 5, art: 'claw' },
    ],
    // Uma mordida e duas garradas.
    multiattack: { count: 3, pattern: ['Mordida', 'Garra', 'Garra'] },
    // Duas folhas: a mordida e a garra. Sem isto, dois dos tres golpes por
    // turno repetiam a animacao da mordida.
    aparencias: { Garra: 'dragaoVerdeJovem@nenhuma-garra' },
    // SOPRO. Modelado com a mesma forma de dado que `spells.js` usa em
    // `kind: 'save'`, para que `combat.js` possa reaproveitar o caminho de
    // magia em área em vez de ganhar um segundo. `origem: 'sopro'` é o que
    // `audio.spellSoundFor` já espera, e `fx.sopro` já desenha o cone.
    breath: {
      name: 'Sopro Venenoso', kind: 'save', shape: 'cone', areaFt: 30,
      save: 'con', dc: 14, damage: '12d6', damageType: 'veneno',
      halfOnSave: true, origem: 'sopro',
      // Recarga 5–6 num d6 no começo do turno dele. A recarga é o que torna o
      // combate jogável: o grupo tem rodadas para se espalhar, e perde se se
      // amontoar. Sem ela o sopro sai todo turno e não há tática possível.
      recharge: [5, 6],
    },
    immune: ['veneno'],
    immuneConditions: ['envenenado'],
    traits: ['soproVenenoso', 'vooDeDragao'],
    // POR QUE O CHEFE FINAL É CR 8 CONTRA UM GRUPO DE NÍVEL 4–5
    // A conta: 136 PV e CA 18 contra quatro personagens de nível 5 que tiram
    // uns 35 a 45 de dano por rodada dão quatro rodadas de luta. Do outro
    // lado, mordida mais duas garradas somam perto de 40 num alvo só — o
    // suficiente para derrubar o mago no primeiro turno — e o sopro de 12d6
    // num cone de 9 m mata quem estiver agrupado.
    // Isso é deliberado, e não é um erro de balanceamento: este encontro tem
    // de ter a saída de "fugir" sobre a mesa. Um dragão que o grupo pode
    // trocar golpe a golpe em pé firme não é o fim de campanha. O que o grupo
    // tem a favor é o terreno (teto baixo impede o voo), a recarga do sopro e
    // o fato de ele ser inteligente e negociar — não é um bicho que luta até
    // a morte por nada.
    blurb: 'Abre com um cone de veneno de 9 m que pune quem está junto, e no corpo a corpo soma três golpes na mesma vítima.',
  },

  // ================================================== NOSSAS (fonte: própria)
  //
  // As três criaturas abaixo ocupam vagas do módulo cujos blocos NÃO estão no
  // SRD (ELENCO.md seção 4 as lista como "crânio flamejante", "vigia de um
  // olho só" e "broto espinhoso"). Não há aqui tentativa de reproduzir aqueles
  // blocos: o que foi copiado é o PAPEL NO ENCONTRO, que é mecânica de jogo e
  // não texto de ninguém. Nome, números e traços são nossos, e foram escritos
  // para um grupo de nível 1 a 5.

  // ARTILHARIA. A vaga que o ELENCO.md chama de "crânio flamejante".
  //
  // O papel é o de uma peça que ATIRA DE LONGE e obriga o grupo a se mexer.
  // Ela voa e não tem perna, então não existe "encurralá-la": quem quer parar
  // de levar fagulha tem de alcançá-la, e alcançá-la custa o turno inteiro.
  // Os números saíram para um grupo de nível 4: 34 PV morrem em duas rodadas
  // de foco, que é exatamente o que ela deve durar — ela é um relógio, não uma
  // parede.
  caveiraCandente: {
    id: 'caveiraCandente',
    tipo: 'morto-vivo',
    name: 'Caveira Candente',
    look: 'caveiraCandente',
    fonte: 'propria',
    size: 'pequeno',
    level: 4,
    cr: '4',
    xp: 1100,
    // FOR 1 não é piada: é o que impede que ela seja usada como peça de corpo
    // a corpo. Qualquer agarrão, empurrão ou derrubada que dependa de FOR ela
    // perde — e ela compensa não precisando encostar em ninguém.
    abilities: { str: 1, dex: 17, con: 14, int: 16, wis: 10, cha: 11 },
    ac: 13,
    acNote: 'nada que se possa agarrar',
    maxHp: 40,
    // Deslocamento 0 no chão: ela não anda, ela flutua. Enquanto a grade só
    // souber de `speedFt`, deixar 0 aqui a prenderia no lugar e quebraria o
    // papel dela, então o valor de voo é o que vai no campo que o motor lê, e
    // `flyFt` fica declarado para quando houver voo de verdade.
    speedFt: 40,
    flyFt: 40,
    // Paira: no livro o voo dela e 'pairando', e o tabuleiro a desenha no ar.
    hover: true,
    attacks: [
      {
        // `art: 'fagulha'`: a receita própria em `visuals.js` — uma brasa
        // VERDE com rastro, e fogo no impacto. Antes era `bow`, uma flecha
        // dourada saindo de um arco invisível, marcada como provisória.
        name: 'Fagulha', bonus: 5, damage: '3d6', type: 'fogo',
        ranged: true, rangeFt: 60, longRangeFt: 60, art: 'fagulha',
      },
      {
        name: 'Mordida Ardente', bonus: 5, damage: '1d6+3', type: 'fogo',
        reachFt: 5, art: 'bite',
      },
    ],
    // Duas fagulhas por turno, as duas cheias. É o que dá a ela um pico de
    // dano de ~14 a 60 m de distância: alto o bastante para o grupo decidir
    // que ela é o alvo prioritário, e é essa decisão que o encontro quer.
    multiattack: { count: 2 },
    immune: ['fogo', 'veneno'],
    // Perfurar uma caveira oca não faz nada; cortar ar também não. É o que a
    // torna uma resposta ruim para o ladino e uma boa para a clériga.
    resist: ['perfurante', 'cortante'],
    immuneConditions: ['caido', 'agarrado', 'envenenado'],
    traits: ['flutuaSemPeso', 'reacendeNaMorte'],
    blurb: 'Fica fora de alcance e manda duas fagulhas de fogo por turno; se ninguém queimar os restos, ela reacende.',
  },

  // GUARDA DE PORTA. A vaga que o ELENCO.md chama de "vigia de um olho só".
  //
  // O papel é o de uma criatura que DEFENDE UM PONTO e fica mais forte perto
  // dele. Ela existe para ensinar uma lição tática antes do fim da campanha:
  // tirar o inimigo do lugar onde ele é forte. Números de nível 3: 45 PV e
  // CA 15 (17 colada na soleira) dão três rodadas de luta.
  vigiaCiclopico: {
    id: 'vigiaCiclopico',
    tipo: 'aberração',
    name: 'Vigia Ciclópico',
    look: 'vigiaCiclopico',
    // Os números e as habilidades do nothic do Livro dos Monstros (2014), a
    // pedido do dono; o nome e a arte continuam nossos (conteúdo de fã).
    fonte: 'MM',
    size: 'médio',
    level: 3,
    cr: '2',
    xp: 450,
    abilities: { str: 14, dex: 16, con: 16, int: 13, wis: 10, cha: 8 },
    ac: 15,
    acNote: 'armadura natural',
    maxHp: 45,
    hpDice: '6d8+18',
    speedFt: 30,
    skills: ['arcanismo', 'intuicao', 'percepcao', 'furtividade'],
    // Visão verdadeira de 36 m: vê no breu e através de ilusões e invisibilidade.
    senses: { truesightFt: 120, passivePerception: 12 },
    attacks: [
      { name: 'Garra', bonus: 4, damage: '1d6+3', type: 'cortante', reachFt: 5, art: 'claw' },
      {
        // Sem jogada de ataque: o alvo que ele vê a até 9 m testa CON contra
        // a magia do olhar, e só falhando leva o dano.
        name: 'Olhar Apodrecedor', damage: '3d6', type: 'necrótico',
        ranged: true, rangeFt: 30, longRangeFt: 30, art: 'rottingGaze',
        teste: { save: 'con', dc: 12, magico: true },
      },
    ],
    // Ataques Múltiplos: duas garras.
    multiattack: { count: 2, sequence: ['Garra', 'Garra'] },
    traits: ['visaoAgucada', 'percepcaoEstranha'],
    blurb: 'Duas garras de perto e, de longe, um olhar que apodrece quem falhar em CON CD 12. Vê no breu e vê quem está invisível.',
  },

  // GUARDA DE TESOURO. A criatura nova da rodada 3.
  //
  // LICENÇA — LEIA ANTES DE MEXER NUM NÚMERO DAQUI.
  // O NOME e o CONCEITO desta criatura são CONTEÚDO DE FÃ (Fan Content Policy
  // da Wizards of the Coast), a mesma política que já sustenta "Phandalin",
  // "Nezznar" e "Venomfang" neste projeto, e que depende de o jogo continuar
  // gratuito e de o aviso continuar visível — e que é REVOGÁVEL. O bloco abaixo
  // é NOSSO: `fonte: 'propria'`, números escritos para este jogo e para um
  // grupo de nível 3 a 5. Nada aqui foi copiado nem parafraseado de livro
  // publicado, e a arte em `art/plans/aberracao.js` foi desenhada do zero.
  //
  // Se algum dia a política mudar, o conserto é trocar o NOME e o `look`; os
  // números continuam válidos porque nunca foram de ninguém mais.
  //
  // O PAPEL NO ENCONTRO é diferente dos outros guardiões do bestiário, e é por
  // isso que ele existe. O vigia ciclópico defende uma SOLEIRA e fica mais
  // duro enquanto está nela; este aqui está amarrado a um OBJETO e se CURA
  // enquanto está perto dele. A diferença muda a tática do grupo: contra o
  // vigia a resposta é tirá-lo do lugar; contra este a resposta é matá-lo
  // depressa ou levar o objeto embora, porque enquanto o cofre estiver ali o
  // relógio corre contra o grupo. Dois guardiões com o mesmo truque seriam o
  // mesmo encontro duas vezes.
  //
  // A CONTA: 39 PV e CA 14 contra um grupo de nível 4 que tira uns 30 por
  // rodada dão duas rodadas se todos focarem nele — e é nesse "se" que mora o
  // encontro, porque ele regenera 5 por turno enquanto ninguém o afastar do
  // objeto. Dano de saída de ~14 por turno a 18 m: incomoda, não mata, e é o
  // suficiente para o grupo não poder ignorá-lo e ir direto ao tesouro.
  //
  // Ele é INTELIGENTE (INT 13) e fala. Um grupo que negocia pode sair daqui
  // sem rolar iniciativa, e isso é deliberado: é o único encontro da campanha
  // que tem uma saída puramente de conversa antes do dragão.
  spectator: {
    id: 'spectator',
    tipo: 'aberração',
    name: 'Spectator',
    look: 'spectator',
    fonte: 'propria',
    size: 'médio',
    // `level` só alimenta `proficiencyBonus`. CR 3 quer +2, e +2 vale de 1 a 4.
    level: 4,
    cr: '3',
    xp: 700,
    // FOR 8 é de propósito: ele não empurra, não agarra e não segura porta
    // nenhuma. O que ele faz é olhar, e a conta toda do bloco sai de SAB 14.
    abilities: { str: 8, dex: 14, con: 14, int: 13, wis: 14, cha: 11 },
    ac: 14,
    acNote: 'flutua e gira sobre o próprio eixo',
    maxHp: 39,
    // Ele não anda: flutua. Enquanto a grade só souber de `speedFt`, deixar 0
    // aqui o prenderia no lugar e mataria o papel, então o valor de voo é o que
    // vai no campo que o motor lê — mesma solução da caveira candente.
    speedFt: 30,
    flyFt: 30,
    // Paira, como no livro: o tabuleiro o desenha no ar.
    hover: true,
    skills: ['percepcao', 'intuicao'],
    attacks: [
      {
        // `art: 'bow'` é PROVISÓRIO, pelo mesmo motivo da fagulha da caveira:
        // é o único traçado de projétil que `visuals.js` tem hoje. O certo é
        // uma receita `raioOcular` — está pedido no relatório.
        // `art: 'raioDasHastes'`: um feixe necrótico instantâneo, sem arco —
        // é o que separa um raio de uma flecha. Antes era `bow`, uma flecha
        // dourada saindo de um arco invisível.
        name: 'Raio das Hastes', bonus: 5, damage: '2d6', type: 'necrótico',
        ranged: true, rangeFt: 60, longRangeFt: 60, art: 'raioDasHastes',
        // O susto é o que faz o raio valer mais que o dado: amedrontado, o
        // alvo não pode AVANÇAR na direção dele, e o guardião ganha a rodada
        // que precisava sem ter matado ninguém.
        onHit: { save: 'wis', dc: 12, condition: 'amedrontado', rounds: 10, repete: true, note: 'o olho da haste não desgruda' },
      },
      { name: 'Mordida', bonus: 4, damage: '1d6+2', type: 'perfurante', reachFt: 5, art: 'bite' },
    ],
    // Dois raios por turno, nunca duas mordidas. A mordida existe só para
    // castigar quem encostou nele; a peça é de longe, e o bloco tem de deixar
    // isso óbvio para quem for ajustar o encontro depois.
    multiattack: { count: 2, pattern: ['Raio das Hastes', 'Raio das Hastes'] },
    immuneConditions: ['caido', 'agarrado'],
    traits: ['flutuaSemPeso', 'quatroHastes', 'vinculoDoGuardiao', 'falaAntesDeLutar'],
    blurb: 'Manda dois raios por turno que metem medo, e se cura enquanto estiver perto do que guarda — ou negocie, ou tire-o de lá.',
  },

  // OS INFECTADOS DE THUNDERTREE, os tres do Livro dos Monstros. Numeros do
  // livro; o texto e nosso.
  //
  // O QUE SEPARA OS TRES e a DISTANCIA em que eles cobram:
  //   . o GALHO morre de um golpe e vem em bando -> o perigo e a soma;
  //   . o ESPETO atira agulhas de 9 m -> cobra para o grupo ficar parado;
  //   . a VINHA agarra, prende e FALA -> trava o grupo e abre a negociacao.
  //
  // OS TRES SAO CEGOS alem de 18 m e nao enxergam cor nenhuma: `blindsightFt`
  // diz o alcance, e a cegueira fora dele fica declarada aqui ate a grade
  // saber distinguir "ve" de "percebe".
  //
  // SO O GALHO QUEIMA FACIL. O livro e explicito: ele e seco. A vinha e verde
  // e nao tem vulnerabilidade -- a tocha que limpa o bando nao limpa ela.

  // O BANDO. Quatro PV: morre de um golpe bom, e e assim que tem de ser --
  // o encontro nao e vencido matando um, e vencido atravessando seis.
  galhoInfectado: {
    id: 'galhoInfectado',
    tipo: 'planta',
    name: 'Galho Infectado',
    look: 'galhoInfectado',
    fonte: 'livro',
    size: 'pequeno',
    level: 1,
    cr: '1/8',
    xp: 25,
    abilities: { str: 6, dex: 13, con: 12, int: 4, wis: 8, cha: 3 },
    ac: 13,
    acNote: 'armadura natural',
    maxHp: 4,
    hpDice: '1d6+1',
    speedFt: 20,
    skills: ['furtividade'],
    vulnerable: ['fogo'],
    immuneConditions: ['cego'],
    senses: { blindsightFt: 60, passivePerception: 9 },
    attacks: [
      { name: 'Garras', bonus: 3, damage: '1d4+1', type: 'perfurante', reachFt: 5, art: 'claw' },
    ],
    traits: ['falsoArbusto'],
    blurb: 'Morre de um golpe e vem de seis: o problema não é ele, é o corredor cheio deles — e uma tocha resolve o corredor.',
  },

  // O ATIRADOR. Sem Aparencia Falsa, ao contrario dos outros dois: ele nao se
  // esconde, ele fica longe. E o unico do bando que fere de verdade de perto.
  espetoInfectado: {
    id: 'espetoInfectado',
    tipo: 'planta',
    name: 'Espeto Infectado',
    look: 'espetoInfectado',
    fonte: 'livro',
    size: 'médio',
    level: 1,
    cr: '1/4',
    xp: 50,
    abilities: { str: 12, dex: 12, con: 13, int: 4, wis: 8, cha: 3 },
    ac: 12,
    acNote: 'armadura natural',
    maxHp: 11,
    hpDice: '2d8+2',
    speedFt: 30,
    immuneConditions: ['cego'],
    senses: { blindsightFt: 60, passivePerception: 9 },
    attacks: [
      {
        name: 'Agulhas', bonus: 3, damage: '2d6+1', type: 'perfurante',
        ranged: true, rangeFt: 30, longRangeFt: 60, art: 'farpa',
      },
      { name: 'Garras', bonus: 3, damage: '2d4+1', type: 'perfurante', reachFt: 5, art: 'claw' },
    ],
    // Dois ataques, duas folhas (como o hobgoblin com a espada e o arco): o
    // chicote do corpo e das agulhas é a folha padrão, e de perto ele troca
    // para a garra. Sem isto, bater colado repetia o chicote das agulhas.
    aparencias: { Garras: 'espetoInfectado@nenhuma-garra' },
    blurb: 'Cospe agulhas de 9 m e bate forte de perto: é o que castiga quem fica no aberto, e o único do bando que não se disfarça.',
  },

  // A QUE FALA. Agarra e PRENDE: enquanto segura um, nao pega outro -- entao
  // ela escolhe quem fica parado, e o grupo escolhe se tenta soltar.
  vinhaInfectada: {
    id: 'vinhaInfectada',
    tipo: 'planta',
    name: 'Vinha Infectada',
    look: 'vinhaInfectada',
    fonte: 'livro',
    size: 'médio',
    level: 2,
    cr: '1/2',
    xp: 100,
    abilities: { str: 15, dex: 8, con: 14, int: 5, wis: 10, cha: 3 },
    ac: 12,
    acNote: 'armadura natural',
    maxHp: 26,
    hpDice: '4d8+8',
    // 3 m: ela nao persegue ninguem. Quem anda, escapa; quem fica, e pego.
    speedFt: 10,
    skills: ['furtividade'],
    immuneConditions: ['cego'],
    senses: { blindsightFt: 60, passivePerception: 10 },
    attacks: [
      {
        name: 'Constrição', bonus: 4, damage: '2d6+2', type: 'concussão', reachFt: 10, art: 'grab',
        // AGARRADO e IMPEDIDO, os dois: o livro diz que o alvo fica agarrado
        // (CD 12) e, ate o agarrao acabar, impedido. No motor, `contido` e o
        // impedido, e e a condicao que importa -- a que tira o movimento.
        onHit: { save: 'str', dc: 12, condition: 'contido', escape: 12, note: 'as vinhas se fecham' },
      },
    ],
    traits: ['falsoArbusto', 'vozDaRaiz', 'plantasConstritoras'],
    blurb: 'Prende um de cada vez e não solta, e FALA: é a única do bando com quem dá para negociar a passagem.',
  },

  // ---- o capítulo 5 do Obelisco (revisoes/obelisco-5a8-plano-2026-11-08.md) ----

  // O OTYUGH (SRD): o lixeiro de esgoto da caverna do poço do Barthen. A mordida passa uma DOENÇA (`doencaDoOtyugh`,
  // curada no descanso longo com Constituição CD 15); os dois tentáculos agarram; com dois presos, bate um no outro.
  otyugh: {
    id: 'otyugh',
    tipo: 'aberração',
    name: 'Otyugh',
    look: 'otyugh',
    fonte: 'SRD',
    size: 'grande',
    level: 8,
    cr: '5',
    xp: 1800,
    abilities: { str: 16, dex: 11, con: 19, int: 6, wis: 13, cha: 6 },
    ac: 14,
    acNote: 'armadura natural',
    maxHp: 114,
    hpDice: '12d10+48',
    speedFt: 30,
    senses: { darkvisionFt: 120 },
    saves: ['con'],
    attacks: [
      { name: 'Mordida', bonus: 6, damage: '2d8+3', type: 'perfurante', reachFt: 5, art: 'bite',
        onHit: { save: 'con', dc: 15, condition: 'doencaDoOtyugh', note: 'pega a doença da mordida' } },
      { name: 'Tentáculo', bonus: 6, damage: '1d8+3', type: 'concussão', reachFt: 10, art: 'grab', danoExtra: { damage: '1d8', type: 'perfurante' },
        onHit: { semResistencia: true, dc: 13, escape: 13, condition: 'contido', note: 'é agarrado pelo tentáculo' } },
    ],
    multiattack: { count: 3, sequence: ['Mordida', 'Tentáculo', 'Tentáculo'] },
    traits: ['pancadaDeTentaculos'],
    blurb: 'Mordida que passa doença e dois tentáculos de 3 m que agarram. Com dois presos, bate um no outro: Constituição CD 14 ou atordoado.',
  },

  // O OTYUGH MUTANTE (o Obelisco): descendente dos otyughs que os duergar trouxeram para comer o lixo de Zorzula, torto
  // pela energia dos devoradores de mente. Hálito venenoso em volta, e uma Pancada de Quitina no lugar de um golpe.
  otyughMutante: {
    id: 'otyughMutante',
    tipo: 'aberração',
    name: 'Otyugh Mutante',
    look: 'otyughMutante',
    fonte: 'PaBTSO',
    size: 'grande',
    level: 9,
    cr: '6',
    xp: 2300,
    abilities: { str: 19, dex: 11, con: 18, int: 10, wis: 15, cha: 6 },
    ac: 16,
    acNote: 'armadura natural',
    maxHp: 76,
    hpDice: '8d10+32',
    speedFt: 30,
    senses: { darkvisionFt: 120 },
    saves: ['str', 'con'],
    damageImmunities: ['veneno'],
    conditionImmunities: ['envenenado'],
    attacks: [
      { name: 'Mordida', bonus: 7, damage: '2d8+4', type: 'perfurante', reachFt: 5, art: 'bite',
        onHit: { save: 'con', dc: 15, condition: 'doencaDoOtyugh', note: 'pega a doença da mordida' } },
      { name: 'Tentáculo', bonus: 7, damage: '2d8+4', type: 'concussão', reachFt: 10, art: 'grab',
        onHit: { semResistencia: true, dc: 15, escape: 15, condition: 'contido', note: 'é agarrado pelo tentáculo' } },
    ],
    multiattack: { count: 2, sequence: ['Tentáculo', 'Mordida'] },
    traits: ['halitoVirulento', 'pancadaDeQuitina'],
    blurb: 'Hálito venenoso em quem está colado (Constituição CD 15). Tentáculo de 3 m que agarra e mordida que passa doença; no lugar de um golpe, a Pancada de Quitina atordoa um agarrado.',
  },

  // A BROCA INFERNAL (o Obelisco): uma broca de ferro em brasa, Enorme, que os duergar faziam furar a rocha. Investe em
  // linha (`investida`: andou 6 m antes do golpe, +2d10 e Força CD 17 ou cai) e solta calor que contorna quinas.
  // A investida conta os 6 m da ÚLTIMA RETA andada, na direção do alvo (`combat.js retaNoFim`), e a broca fura a rocha
  // natural do mapa e deixa o túnel (`escavador`, `combat.js abrirTunel`).
  brocaInfernal: {
    id: 'brocaInfernal',
    tipo: 'constructo',
    name: 'Broca Infernal',
    look: 'brocaInfernal',
    fonte: 'PaBTSO',
    size: 'enorme',
    level: 8,
    cr: '5',
    xp: 1800,
    abilities: { str: 23, dex: 10, con: 17, int: 6, wis: 12, cha: 5 },
    ac: 15,
    acNote: 'armadura natural',
    maxHp: 85,
    hpDice: '9d12+27',
    speedFt: 40,
    senses: { blindsightFt: 60 },
    damageImmunities: ['fogo', 'veneno'],
    conditionImmunities: ['cego', 'enfeitiçado', 'exausto', 'amedrontado', 'paralisado', 'petrificado', 'envenenado', 'inconsciente'],
    attacks: [
      { name: 'Broca em Brasa', bonus: 9, damage: '2d10+6', type: 'perfurante', reachFt: 5, art: 'javelin', danoExtra: { damage: '2d6', type: 'fogo' },
        investida: { pes: 20, dano: '2d10', tipo: 'perfurante', save: 'str', dc: 17 } },
    ],
    traits: ['monstroDeCerco', 'escavador', 'rajadaDeCalor'],
    blurb: 'Broca em brasa: 2d10+6 e 2d6 de fogo, e se veio de 6 m de corrida, mais 2d10 e Força CD 17 ou cai. Ação bônus, recarga 5–6: Rajada de Calor de 9 m que contorna quinas (Constituição CD 17).',
  },

  // O GUARDIÃO-ESCUDO (SRD): o constructo ligado a um amuleto. O do Santuário Índigo é a estátua que o Ruxithid
  // desperta. Dois laços diferentes, que a cena põe: `amuletoCom` (quem usa o AMULETO: leva metade do dano dele a até 18
  // m e protege com +2 de CA colado) e `comandadoPor` (quem o controla: morto ele, o guardião fica inerte). O Ruxithid
  // o controla pela luz do cristal, sem amuleto — o livro não dá amuleto a ninguém ali —, então no Santuário só vale o
  // segundo. Ele se refaz 10 PV por turno. APROXIMAÇÃO, dita: a magia guardada (Matar com Ilusão, no
  // livro) não está no motor.
  guardiaoEscudo: {
    id: 'guardiaoEscudo',
    tipo: 'constructo',
    name: 'Guardião-Escudo',
    look: 'guardiaoEscudo',
    fonte: 'SRD',
    size: 'grande',
    level: 10,
    cr: '7',
    xp: 2900,
    abilities: { str: 18, dex: 8, con: 18, int: 7, wis: 10, cha: 3 },
    ac: 17,
    acNote: 'armadura natural',
    maxHp: 142,
    hpDice: '15d10+60',
    speedFt: 30,
    senses: { blindsightFt: 10, darkvisionFt: 60 },
    damageImmunities: ['veneno'],
    conditionImmunities: ['enfeitiçado', 'exausto', 'amedrontado', 'paralisado', 'envenenado'],
    attacks: [
      { name: 'Punho', bonus: 7, damage: '2d6+4', type: 'concussão', reachFt: 5, art: 'mace' },
    ],
    multiattack: { count: 2 },
    traits: ['vinculo', 'regeneracao', 'escudoDoGuardiao'],
    blurb: 'Dois punhos de 2d6+4. Leva metade do dano do mestre a até 18 m e dá +2 de CA a ele quando está colado. Recupera 10 PV por turno; sem o mestre, para.',
  },

  // ---- o que o Obelisco pôs na Mina Perdida (revisoes/obelisco-de-para-2026-11-08.md) ----

  // O CASTELO, C13: a torre assombrada é o covil dele. Voa (pairando), não enxerga além de 18 m e não precisa:
  // é cego e imune a ficar cego. O tentáculo faz DUAS coisas que o livro separa — o veneno que paralisa, com
  // resistência, e o agarrão, sem — e por isso o `onHit` é uma lista.
  grell: {
    id: 'grell',
    tipo: 'aberração',
    name: 'Grell',
    look: 'grell',
    fonte: 'MM',
    size: 'médio',
    level: 4,
    cr: '3',
    xp: 700,
    abilities: { str: 15, dex: 14, con: 13, int: 12, wis: 11, cha: 9 },
    ac: 12,
    maxHp: 55,
    hpDice: '10d8+10',
    speedFt: 10,
    speeds: { walkFt: 10, flyFt: 30 },
    senses: { blindsightFt: 60, passivePerception: 14 },
    // Percepção +4 e Furtividade +6: o dobro da proficiência nas duas.
    skills: ['percepcao', 'furtividade'],
    expertise: ['percepcao', 'furtividade'],
    attacks: [
      {
        name: 'Tentáculos', bonus: 4, damage: '1d10+2', type: 'perfurante', reachFt: 10, art: 'claw',
        onHit: [
          // O veneno deixa ENVENENADO, e o envenenado pelo grell fica PARALISADO: é a paralisia que decide a luta,
          // e é ela que entra. A resistência se repete no fim de cada turno.
          { save: 'con', dc: 11, condition: 'paralisado', rounds: 10, repete: true, note: 'o veneno dos tentáculos trava o corpo' },
          // E agarra, sem resistência. No motor, `contido` é o agarrado que não anda, que é o que o livro dá a quem
          // é Médio ou menor.
          { semResistencia: true, dc: 15, escape: 15, condition: 'contido', note: 'é agarrado pelos tentáculos' },
        ],
      },
      { name: 'Bico', bonus: 4, damage: '2d4+2', type: 'perfurante', reachFt: 5, art: 'bite' },
    ],
    multiattack: { count: 2, sequence: ['Tentáculos', 'Bico'] },
    damageImmunities: ['elétrico'],
    conditionImmunities: ['cego', 'caido'],
    // Leva consigo, quando se move, quem está agarrado e é Médio ou menor (`carregaAgarrados`, `combat.js levarAgarrados`).
    traits: ['carregaAgarrados'],
    blurb: 'Desce voando e paralisa com os tentáculos: quem falha em CON CD 11 trava e é agarrado. A paralisia passa com nova resistência a cada turno.',
  },

  // A ONDA ECO, W8: dois deles no meio dos fungos, um no canteiro central e um no do norte. Parados, são fungo.
  fungoVioleta: {
    id: 'fungoVioleta',
    tipo: 'planta',
    name: 'Fungo Violeta',
    look: 'fungoVioleta',
    fonte: 'MM',
    size: 'médio',
    level: 1,
    cr: '1/4',
    xp: 50,
    abilities: { str: 3, dex: 1, con: 10, int: 1, wis: 3, cha: 1 },
    ac: 5,
    maxHp: 18,
    hpDice: '4d8',
    speedFt: 5,
    senses: { blindsightFt: 30, passivePerception: 6 },
    attacks: [
      { name: 'Toque Apodrecido', bonus: 2, damage: '1d8', type: 'necrótico', reachFt: 10, art: 'claw' },
    ],
    // 1d4 toques por turno: o dado é rolado a cada ação (`combat.js golpesDoAtaque`).
    multiattack: { countDados: '1d4' },
    conditionImmunities: ['cego', 'surdo', 'amedrontado'],
    traits: ['aparenciaFalsa'],
    blurb: 'Parado, é só mais um fungo. Toca a 3 m, de uma a quatro vezes por turno, e o toque apodrece.',
  },

  // A MANSÃO, R11: o familiar do Glasstaff, chamado Zeond. Invisível quando o grupo entra, não ataca logo:
  // espera alguém enfraquecer, ataca e some de novo. E conta tudo ao dono pelo elo telepático.
  quasit: {
    id: 'quasit',
    tipo: 'corruptor',
    name: 'Quasit',
    look: 'quasit',
    fonte: 'MM',
    size: 'miúdo',
    level: 2,
    cr: '1',
    xp: 200,
    abilities: { str: 5, dex: 17, con: 10, int: 7, wis: 10, cha: 10 },
    ac: 13,
    maxHp: 7,
    hpDice: '3d4',
    speedFt: 40,
    senses: { darkvisionFt: 120, passivePerception: 10 },
    skills: ['furtividade'],
    attacks: [
      {
        name: 'Garras', bonus: 4, damage: '1d4+3', type: 'perfurante', reachFt: 5, art: 'claw',
        // UMA resistência para as duas coisas: quem falha leva 2d4 de veneno E fica envenenado; quem passa, nada.
        onHit: {
          save: 'con', dc: 10, condition: 'envenenado', rounds: 10, repete: true, note: 'o veneno das garras entra',
          danoSeFalhar: { damage: '2d4', type: 'veneno' },
        },
      },
    ],
    damageResistances: ['frio', 'fogo', 'elétrico', 'cortante', 'perfurante', 'concussão'],
    damageResistancesNote: 'cortante, perfurante e concussão só de armas não mágicas',
    damageImmunities: ['veneno'],
    conditionImmunities: ['envenenado'],
    // `invisivelAVontade` é a Invisibilidade do bloco, que a IA usa (`ai.js turnoInvisivel`); o SUSTO de uma vez por dia
    // (`combat.js sustoDoQuasit`) e MUDAR DE FORMA — morcego, centopeia, sapo (`combat.js mudarDeForma`).
    traits: ['resistenciaAMagia', 'invisivelAVontade', 'susto', 'mudaDeForma'],
    blurb: 'Fica invisível, espera alguém ficar fraco, ataca e some de novo. O veneno das garras envenena e fere; tem vantagem contra magia.',
  },

};

/** Traços novos desta família, somados ao dicionário geral. */
export const TRAITS = {
  sanguessuga: { name: 'Sanguessuga', desc: 'Ação bônus: Destreza CD 14 de quem está colado; falhou, a gêmula gruda nele e tira 3d4 perfurante no começo de cada turno dele. Solta-se com Força CD 15 (a ação de escapar), ou quando a gêmula morre.' },
  esmagamentoPsiquico: { name: 'Esmagamento Psíquico', desc: 'Recarga 5–6. Uma criatura que ela sinta a até 18 m: Inteligência CD 10, 3d6 psíquico (metade se passar).' },
  resistenciaAMagia: {
    name: 'Resistência a Magia',
    desc: 'Tem vantagem nas resistências contra magias e outros efeitos mágicos.',
  },
  invisivelAVontade: {
    name: 'Invisibilidade',
    desc: 'Fica invisível quando quer, gastando a ação, até atacar. Espera alguém do grupo enfraquecer, ataca e no turno seguinte some de novo.',
  },

  // --- gelatina ocre (SRD) ---
  amorfo: {
    name: 'Amorfa',
    desc: 'Atravessa uma abertura de 2,5 cm sem gastar deslocamento extra.',
  },
  susto: {
    name: 'Susto',
    desc: 'Uma vez por dia, ação: uma criatura a até 6 m faz Sabedoria CD 10 ou fica amedrontada por 1 minuto. Repete no fim de cada turno, com desvantagem enquanto o vê.',
  },
  mudaDeForma: {
    name: 'Muda de Forma',
    desc: 'Ação: vira morcego (voa 12 m), centopeia (escala) ou sapo (nada), ou volta. Só o deslocamento muda.',
  },
  carregaAgarrados: {
    name: 'Leva o que Agarra',
    desc: 'Quando se move, quem ele agarra (Médio ou menor) vai junto.',
  },
  camuflagemDePedra: {
    name: 'Camuflagem de Pedra',
    desc: 'Vantagem em Furtividade em terreno rochoso: na surpresa e ao se esconder.',
  },
  escaladaAracnidea: {
    name: 'Escalada Aracnídea',
    desc: 'Escala superfícies difíceis, inclusive de cabeça para baixo, sem teste.',
  },
  divisao: {
    name: 'Divisão',
    // "ATINGIDA por", e não "sofre": a gelatina é imune a cortante e elétrico,
    // e mesmo assim o golpe a parte. O motor executa (`dividir` em combat.js).
    desc: 'Sendo Média ou maior e com 10+ PV, ao ser atingida por dano cortante ou elétrico parte-se em duas. Cada metade fica com metade dos PV e um tamanho menor.',
  },

  // --- doppelganger (SRD) ---
  metamorfo: {
    name: 'Metamorfo',
    desc: 'Assume a forma de qualquer humanoide Médio que já tenha visto. Equipamento não se transforma.',
  },
  emboscador: {
    name: 'Emboscador',
    desc: 'Vantagem em ataques contra criatura surpresa.',
  },
  ataqueSurpresaDoppelganger: {
    name: 'Ataque Surpresa',
    desc: 'No primeiro turno, se o alvo estiver surpreso, o golpe causa +3d6 de dano.',
  },
  lerPensamentos: {
    name: 'Ler Pensamentos',
    desc: 'Lê os pensamentos superficiais de uma criatura a até 18 m, e passa a ter vantagem em Enganação e Intuição contra ela.',
  },

  // --- dragão verde jovem (SRD) ---
  soproVenenoso: {
    name: 'Sopro Venenoso',
    desc: 'Cone de 9 m, CD 14 de CON, 12d6 de veneno, metade se passar. Recarrega com 5 ou 6 num d6 no início do turno.',
  },
  vooDeDragao: {
    name: 'Voo',
    desc: 'Voa de verdade: 24 m por turno no ar, em vez dos 12 m andando, e no ar não o seguram terreno difícil, degrau nem o que está no chão. Derrubado, cai e perde o ar. (Nadar ainda não está no motor, e nenhum mapa tem teto baixo: por enquanto ele voa em qualquer lugar. A grade é plana — voar não o tira do alcance de quem bate no chão.)',
  },

  // --- nossas ---
  flutuaSemPeso: {
    name: 'Flutua Sem Peso',
    desc: 'Pairando no ar e sem corpo que se segure: imune a Caído e Agarrado, e terreno difícil não a afeta.',
  },
  reacendeNaMorte: {
    name: 'Reacende',
    desc: 'Destruída, volta a arder em uma hora com todos os PV, a menos que alguém asperja água benta nos restos ou lance Dissipar Magia ou Remover Maldição neles.',
  },
  visaoAgucada: {
    name: 'Visão Aguçada',
    desc: 'Vantagem em testes de Sabedoria (Percepção) que dependem da visão.',
  },
  percepcaoEstranha: {
    name: 'Percepção Estranha',
    desc: 'Ação: escolhe uma criatura que ele veja a até 9 m. A Enganação dela é disputada com a Intuição dele; se ele vencer, aprende por magia um fato ou segredo do alvo. Quem é imune a ser enfeitiçado vence sempre. (Ainda não é uma ação do jogo.)',
  },
  quatroHastes: {
    name: 'Quatro Hastes',
    desc: 'As quatro hastes oculares olham para lados diferentes: não pode ser surpreendido, e quem tenta passar escondido por ele testa Furtividade com desvantagem.',
  },
  vinculoDoGuardiao: {
    name: 'Vínculo do Guardião',
    desc: 'Foi amarrado a um objeto e não pode se afastar mais de 9 m dele. Em compensação, recupera 5 PV no início de cada turno em que estiver a essa distância — tire-o de lá, ou leve o objeto embora.',
  },
  falaAntesDeLutar: {
    name: 'Fala Antes de Lutar',
    desc: 'É inteligente e conversa. Tem ordens, não ódio: um grupo que descobre quais são pode negociar a passagem sem rolar iniciativa.',
  },

  falsoArbusto: {
    name: 'Aparência Falsa',
    desc: 'Enquanto fica imóvel, não se distingue de um arbusto morto (ou de um emaranhado de vinhas): quem não o examinar de perto passa ao lado sem vê-lo.',
  },
  plantasConstritoras: {
    name: 'Plantas Constritoras',
    desc: 'Recarrega 5-6: raízes brotam num raio de 4,5 m e viram terreno difícil por 1 minuto; quem a vinha escolher faz FOR CD 12 ou fica contido, e sai gastando a ação num teste de FOR CD 12. (O terreno difícil aqui atrapalha planta também: o motor conta terreno por casa, não por criatura.)',
  },
  vozDaRaiz: {
    name: 'Voz da Raiz',
    desc: 'Fala, com a voz de quem a árvore engoliu. Um grupo que responde pode negociar a passagem sem rolar iniciativa.',
  },
};
