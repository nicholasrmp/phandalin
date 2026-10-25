// Mortos-vivos: esqueleto, zumbi, ghoul, espectro, wraith.
// SRD 5.1 (CC-BY-4.0) — ver NOTICE.md e ELENCO.md.
//
// Regra dura: nada aqui pode ser bloco de monstro que não esteja no SRD. Se a
// criatura é do módulo publicado e não está no SRD, ela vira criatura NOSSA,
// com nome e números nossos, marcada `fonte: 'propria'`. Chutar atribuição de
// SRD num bloco que não é SRD é o pior erro possível neste projeto.
//
// Os cinco blocos daqui são do SRD, e nenhum número foi mexido. `fonte` é
// documentação de licença, não dado de jogo: `makeMonster` não a copia para o
// combatente; ela existe para auditoria do contrato do elenco.
//
// `TRAITS` deste arquivo é somado ao dicionário de traços em `../monsters.js`.
//
// POR QUE OS CINCO SÃO O MESMO PROBLEMA DE DESIGN
//   Morto-vivo não se mede por dano. O que define cada um é uma regra que
//   quebra uma expectativa do jogador: o zumbi se levanta depois de cair, o
//   ghoul tira o turno de quem ele acerta, o espectro atravessa a parede atrás
//   da qual o grupo se escondeu, e o dreno de vida tira PV que a cura não
//   devolve. Os números abaixo são do SRD; é essa lista de quebras que faz o
//   encontro.
//
// O QUE O MOTOR AINDA NÃO EXECUTA (declarado aqui, pendente lá — ver relatório)
//   - `undeadFortitude`, `incorporealMovement`, `lifeDrain`,
//     `sunlightSensitivity` e `createSpecter` são traços SEM gancho no motor
//     hoje: aparecem no painel pelo `TRAIT_INFO`, mas não mudam a rolagem.
//   Nada disso foi contornado com número inflado: um bloco que compensa a regra
//   que falta com +3 de dano vira um bloco errado no dia em que a regra chega.

export const MORTOS_VIVOS = {

  // O esqueleto é o inimigo que ENSINA tipo de dano. CA 13 e 13 PV: cai rápido
  // de qualquer jeito, mas cai em metade dos golpes para quem troca a espada
  // pela maça. É o único do elenco com vulnerabilidade, e existe para que o
  // clérigo tenha um momento em que a arma dele é a arma certa.
  esqueleto: {
    id: 'esqueleto',
    name: 'Esqueleto',
    look: 'skeleton',
    fonte: 'SRD',
    size: 'médio',
    level: 1,
    cr: '1/4',
    xp: 50,
    abilities: { str: 10, dex: 14, con: 15, int: 6, wis: 8, cha: 5 },
    ac: 13,
    acNote: 'restos de armadura',
    maxHp: 13,
    speedFt: 30,
    // `dagger` é a receita de estocada curta de `visuals.js`, que é o que a
    // espada curta faz; o corte largo de `sword` mentiria sobre o alcance.
    attacks: [
      { name: 'Espada curta', bonus: 4, damage: '1d6+2', type: 'perfurante', reachFt: 5, art: 'dagger' },
      { name: 'Arco curto', bonus: 4, damage: '1d6+2', type: 'perfurante', ranged: true, rangeFt: 80, longRangeFt: 320, art: 'bow' },
    ],
    damageVulnerabilities: ['concussão'],
    damageImmunities: ['veneno'],
    conditionImmunities: ['envenenado', 'exausto'],
    traits: ['bluntVulnerable'],
    blurb: 'Encosta e troca golpes sem recuar, e desmonta no dobro do dano contra maça, martelo e bordão.',
  },

  // O zumbi não é um goblin lento: é um RELÓGIO. CA 8 (todo mundo acerta), 22
  // PV e a Tenacidade. O custo dele para o grupo se mede em TURNOS, não em PV
  // perdidos — e é por isso que ele é o monstro certo para aparecer em três
  // enquanto outra coisa se aproxima.
  zumbi: {
    id: 'zumbi',
    name: 'Zumbi',
    look: 'zombie',
    fonte: 'SRD',
    size: 'médio',
    level: 1,
    cr: '1/4',
    xp: 50,
    abilities: { str: 13, dex: 6, con: 16, int: 3, wis: 6, cha: 5 },
    ac: 8,
    acNote: 'sem armadura, carne mole',
    maxHp: 22,
    speedFt: 20,
    // Resistência de SAB +0 do Livro dos Monstros: a proficiência (+2) sobre SAB 6.
    saves: ['wis'],
    senses: { darkvisionFt: 60 },
    // Pancada de cima para baixo com os dois braços: a receita `mace` sacode a
    // tela, e esse peso é a única coisa que o zumbi tem a seu favor.
    attacks: [
      { name: 'Golpe', bonus: 3, damage: '1d6+1', type: 'concussão', reachFt: 5, art: 'mace' },
    ],
    damageImmunities: ['veneno'],
    conditionImmunities: ['envenenado'],
    traits: ['undeadFortitude'],
    blurb: 'Avança devagar e se recusa a ficar no chão: ao cair a 0 PV, passa na resistência e volta com 1 PV.',
  },

  // O ghoul pode PERDER o combate e ainda ganhar a cena: um acerto de garra
  // tira um personagem da luta. A garra vem antes da mordida na lista porque o
  // motor usa `attacks[0]` quando ninguém escolhe arma, e o que define o ghoul
  // é a paralisia — não os 2d6 da mordida.
  ghoul: {
    id: 'ghoul',
    name: 'Ghoul',
    look: 'ghoul',
    fonte: 'SRD',
    size: 'médio',
    level: 3,
    cr: '1',
    xp: 200,
    abilities: { str: 13, dex: 15, con: 10, int: 7, wis: 10, cha: 6 },
    ac: 12,
    acNote: 'agilidade de bicho',
    maxHp: 22,
    speedFt: 30,
    senses: { darkvisionFt: 60 },
    attacks: [
      {
        name: 'Garras', bonus: 4, damage: '2d4+2', type: 'cortante', reachFt: 5, art: 'claw',
        // Paralisia por 1 minuto, com nova resistência no fim de cada turno
        // do alvo. Elfos e mortos-vivos não são afetados.
        onHit: {
          save: 'con', dc: 10, condition: 'paralisado', rounds: 10, repete: true, note: 'congela no lugar',
          imunes: { ancestry: ['Elf'], tipo: ['morto-vivo'], motivo: 'elfos e mortos-vivos resistem à paralisia do ghoul' },
        },
      },
      { name: 'Mordida', bonus: 2, damage: '2d6+2', type: 'perfurante', reachFt: 5, art: 'bite' },
    ],
    damageImmunities: ['veneno'],
    conditionImmunities: ['enfeitiçado', 'envenenado', 'exausto'],
    traits: ['paralyzingClaws'],
    blurb: 'Pula em quem está mais perto e tenta paralisá-lo com a garra, para então comer quem não pode reagir.',
  },

  // O espectro PUNE POSIÇÃO. Não tem força nenhuma (FOR 1) e morre num sopro,
  // mas atravessa a parede atrás da qual o mago se escondeu, e o dano dele é
  // PV máximo — a cura do clérigo não desfaz. Contra ele a resposta é vencer
  // rápido, não se proteger.
  espectro: {
    id: 'espectro',
    name: 'Espectro',
    look: 'specter',
    fonte: 'SRD',
    size: 'médio',
    level: 3,
    cr: '1',
    xp: 200,
    abilities: { str: 1, dex: 14, con: 11, int: 10, wis: 10, cha: 11 },
    ac: 12,
    acNote: 'corpo que a arma atravessa',
    maxHp: 22,
    // SRD: deslocamento 0, voo 50 pés (flutuando). O motor tem um só orçamento
    // de movimento, então o voo entra como `speedFt` — senão o espectro passa o
    // combate parado no quadrado dele. `flyFt` e `hover` ficam declarados para
    // quando a grade souber que quem voa não escala.
    speedFt: 50,
    flyFt: 50,
    hover: true,
    // Não existe receita de dreno em `visuals.js`: `claw` é o que chega mais
    // perto de um toque que alcança. Pedido no relatório.
    attacks: [
      {
        name: 'Dreno de Vida', bonus: 4, damage: '3d6', type: 'necrótico', reachFt: 5, art: 'claw',
        // Redução de PV máximo não existe no motor. Fica declarada para quando
        // existir; `TRAITS.lifeDrain` já a mostra ao jogador no painel.
        maxHpDrain: { save: 'con', dc: 10 },
      },
    ],
    damageResistances: ['ácido', 'frio', 'fogo', 'elétrico', 'trovejante', 'cortante', 'perfurante', 'concussão'],
    damageResistancesNote: 'cortante, perfurante e concussão só de armas não mágicas',
    damageImmunities: ['necrótico', 'veneno'],
    conditionImmunities: ['enfeitiçado', 'exausto', 'amedrontado', 'agarrado', 'paralisado', 'petrificado', 'envenenado', 'caido', 'imobilizado', 'inconsciente'],
    traits: ['incorporealMovement', 'lifeDrain', 'sunlightSensitivity'],
    blurb: 'Vem por dentro da parede até quem se escondeu e drena 3d6 necróticos do PV máximo do alvo.',
  },

  // O wraith é o chefe desta família: 67 PV e 4d8+3 por golpe num motor em que
  // o personagem de nível baixo tem 10 a 12 PV. Ele NÃO deve aparecer em sala
  // aberta contra um grupo de 1º nível — é monstro de cripta, com algo a
  // proteger, e o grupo precisa ter como fugir.
  //
  // `Criar Espectro` é o que o torna chefe de verdade: cada aliado caído do
  // grupo é reforço para ele. O motor tem `addCombatant` e
  // `spawnReinforcements`, mas nada liga um traço a eles, e a IA só sabe mover
  // e atacar. Ver relatório.
  wraith: {
    id: 'wraith',
    name: 'Wraith',
    look: 'wraith',
    fonte: 'SRD',
    size: 'médio',
    level: 5,
    cr: '5',
    xp: 1800,
    abilities: { str: 6, dex: 16, con: 16, int: 12, wis: 14, cha: 15 },
    ac: 13,
    acNote: 'manto que a arma atravessa',
    maxHp: 67,
    speedFt: 60,
    flyFt: 60,
    hover: true,
    attacks: [
      {
        name: 'Dreno de Vida', bonus: 6, damage: '4d8+3', type: 'necrótico', reachFt: 5, art: 'claw',
        maxHpDrain: { save: 'con', dc: 14 },
      },
    ],
    damageResistances: ['ácido', 'frio', 'fogo', 'elétrico', 'trovejante', 'cortante', 'perfurante', 'concussão'],
    damageResistancesNote: 'cortante, perfurante e concussão só de armas não mágicas e não prateadas',
    damageImmunities: ['necrótico', 'veneno'],
    conditionImmunities: ['enfeitiçado', 'exausto', 'amedrontado', 'agarrado', 'paralisado', 'petrificado', 'envenenado', 'caido', 'imobilizado'],
    traits: ['incorporealMovement', 'lifeDrain', 'sunlightSensitivity', 'createSpecter'],
    blurb: 'Atravessa a parede, arranca 4d8+3 do PV máximo de um alvo por turno e ergue espectros de quem cai.',
  },

};

/** Traços novos desta família, somados ao dicionário geral. */
export const TRAITS = {
  // SRD. SEM GANCHO NO MOTOR: `applyDamage` marca `dead = true` assim que os PV
  // chegam a 0, e nem recebe o aviso de crítico. É a regra que falta mais caro
  // nesta família: sem ela o zumbi é só um goblin lento de CA 8.
  undeadFortitude: {
    name: 'Tenacidade Mortoviva',
    desc: 'Ao cair a 0 PV, faz resistência de CON (CD 5 + dano sofrido): se passar, fica com 1 PV em vez de cair. Dano radiante ou acerto crítico não deixam.',
  },

  // SRD. SEM GANCHO NO MOTOR: `Battlefield.reachable` não aceita regra de
  // passagem por ator, então hoje a parede para o espectro como para todos.
  incorporealMovement: {
    name: 'Movimento Incorpóreo',
    desc: 'Atravessa criaturas e objetos como terreno difícil (custo dobrado). Sofre 1d10 de dano de força se terminar o turno dentro de um objeto.',
  },

  // SRD. PARCIAL: o dano necrótico acontece; a redução de PV máximo não,
  // porque o combatente não tem onde guardar o máximo drenado.
  lifeDrain: {
    name: 'Dreno de Vida',
    desc: 'O alvo faz resistência de CON ou tem o PV máximo reduzido no valor do dano sofrido, até descansar. Morre se o máximo chegar a 0.',
  },

  // SRD. SEM GANCHO NO MOTOR: não existe modelo de luz nem de hora do dia.
  // Fica declarado porque muda a leitura tática da cripta: morto-vivo luta
  // melhor no escuro, e o grupo pode escolher a hora de entrar.
  sunlightSensitivity: {
    name: 'Sensibilidade à Luz Solar',
    desc: 'Desvantagem nos ataques e nos testes de Percepção pela visão enquanto estiver sob luz solar direta.',
  },

  // SRD. SEM GANCHO NO MOTOR: a IA só sabe mover e atacar.
  createSpecter: {
    name: 'Criar Espectro',
    desc: 'Ação: mira o corpo de um humanoide morto a até 3 m e o ergue como espectro sob seu comando, até três por vez.',
  },

  // Apresentação, não regra nova: põe no painel a vulnerabilidade que o bloco
  // do SRD tem e que o motor ainda não aplica. Sem isto, a única forma de o
  // jogador descobrir que a maça é a arma certa é ler o código.
  bluntVulnerable: {
    name: 'Ossos Quebradiços',
    desc: 'Vulnerável a dano de concussão: maça, martelo e bordão fazem o dobro.',
  },

  // SRD, no ataque e não no bloco: a paralisia vive em `attacks[].onHit`. Este
  // verbete existe para o painel explicar por que a garra é pior que a mordida.
  paralyzingClaws: {
    name: 'Garras Paralisantes',
    desc: 'Quem é acertado pela garra faz resistência de CON (CD 10) ou fica paralisado por 1 minuto, repetindo a resistência no fim de cada turno seu.',
  },
};
