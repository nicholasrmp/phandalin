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
  // Bloco do SRD 5.1. A Camuflagem de Pedra (vantagem em Furtividade no
  // meio de pedra) entra como perícia alta; a resistência a dano não mágico
  // fica de fora até o motor saber distinguir arma mágica.
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
    senses: { darkvisionFt: 60, passivePerception: 12 },
    skills: ['furtividade', 'percepcao'],
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
    cr: '3',
    xp: 700,
    // FOR 1 não é piada: é o que impede que ela seja usada como peça de corpo
    // a corpo. Qualquer agarrão, empurrão ou derrubada que dependa de FOR ela
    // perde — e ela compensa não precisando encostar em ninguém.
    abilities: { str: 1, dex: 17, con: 14, int: 16, wis: 10, cha: 11 },
    ac: 13,
    acNote: 'nada que se possa agarrar',
    maxHp: 34,
    // Deslocamento 0 no chão: ela não anda, ela flutua. Enquanto a grade só
    // souber de `speedFt`, deixar 0 aqui a prenderia no lugar e quebraria o
    // papel dela, então o valor de voo é o que vai no campo que o motor lê, e
    // `flyFt` fica declarado para quando houver voo de verdade.
    speedFt: 40,
    flyFt: 40,
    attacks: [
      {
        // `art: 'bow'` é PROVISÓRIO: é o único traçado de projétil que
        // `visuals.js` tem hoje, e um arco invisível atirando fogo passa. O
        // certo é uma receita `fagulha` — está pedido no relatório.
        name: 'Fagulha', bonus: 5, damage: '2d6', type: 'fogo',
        ranged: true, rangeFt: 60, longRangeFt: 60, art: 'bow',
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
    skills: ['percepcao', 'intuicao'],
    attacks: [
      {
        // `art: 'bow'` é PROVISÓRIO, pelo mesmo motivo da fagulha da caveira:
        // é o único traçado de projétil que `visuals.js` tem hoje. O certo é
        // uma receita `raioOcular` — está pedido no relatório.
        name: 'Raio das Hastes', bonus: 5, damage: '2d6', type: 'necrótico',
        ranged: true, rangeFt: 60, longRangeFt: 60, art: 'bow',
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

  // CAPANGA DE BANDO. A vaga que o ELENCO.md chama de "broto espinhoso".
  //
  // O papel é o de quatro a seis peças fracas que PRENDEM o grupo no lugar —
  // o encontro não é vencido matando-as, é vencido escapando delas. Números de
  // nível 1 a 2: 18 PV, morre num golpe bom, e o perigo é a soma.
  //
  // A vulnerabilidade a fogo é intencional e é a graça do encontro: o grupo que
  // traz uma tocha resolve seis delas em duas rodadas, e descobrir isso é a
  // recompensa.
  espinheiroRastejante: {
    id: 'espinheiroRastejante',
    tipo: 'planta',
    name: 'Espinheiro Rastejante',
    look: 'espinheiroRastejante',
    fonte: 'propria',
    size: 'pequeno',
    level: 1,
    cr: '1/2',
    xp: 100,
    abilities: { str: 13, dex: 8, con: 14, int: 3, wis: 8, cha: 4 },
    ac: 13,
    acNote: 'casca lenhosa',
    maxHp: 18,
    // 6 m: ele arrasta raiz. Não dá para fugir dele andando devagar, mas dá
    // para fugir correndo — é a válvula de escape que o encontro precisa ter.
    speedFt: 20,
    skills: ['furtividade'],
    attacks: [
      {
        name: 'Farpas', bonus: 3, damage: '1d6+1', type: 'perfurante',
        reachFt: 5, art: 'dagger',
        // O dano é irrelevante; o AGARRADO é o ataque. Seis destes num
        // corredor transformam "recuar" em "testar FOR seis vezes".
        onHit: { save: 'str', dc: 11, condition: 'agarrado', note: 'fica preso nos espinhos' },
      },
    ],
    vulnerable: ['fogo'],
    traits: ['falsoArbusto', 'espinhoDeRetorno'],
    blurb: 'Agarra quem passa e não solta, então o grupo para de andar; queima fácil, e é assim que se resolve o bando.',
  },

};

/** Traços novos desta família, somados ao dicionário geral. */
export const TRAITS = {

  // --- gelatina ocre (SRD) ---
  amorfo: {
    name: 'Amorfa',
    desc: 'Atravessa uma abertura de 2,5 cm sem gastar deslocamento extra.',
  },
  camuflagemDePedra: {
    name: 'Camuflagem de Pedra',
    desc: 'Vantagem em Furtividade para se esconder em terreno rochoso. (Ainda não é uma ação do jogo.)',
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
    desc: 'Desloca 24 m voando e 12 m nadando. Em teto baixo, perde o voo — e é o que torna a caverna o lugar de enfrentá-lo.',
  },

  // --- nossas ---
  flutuaSemPeso: {
    name: 'Flutua Sem Peso',
    desc: 'Pairando no ar e sem corpo que se segure: imune a Caído e Agarrado, e terreno difícil não a afeta.',
  },
  reacendeNaMorte: {
    name: 'Reacende',
    desc: 'Reduzida a 0 PV, a chama apaga mas o osso fica. Se os restos não forem queimados ou destruídos, ela volta a arder em uma hora com metade dos PV.',
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
    name: 'Falso Arbusto',
    desc: 'Parado, não se distingue de mato seco: vantagem em Furtividade e, se não tiver se movido, o grupo o vê surpreso.',
  },
  espinhoDeRetorno: {
    name: 'Espinho de Retorno',
    desc: 'Quem o acerta com ataque corpo a corpo sofre 2 de dano perfurante.',
  },
};
