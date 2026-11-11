// AS CRIATURAS DA CRIPTA DOS TALHUND (o Obelisco, capítulo 6), debaixo de Talhundereth.
//
// Os números são os dos blocos (o Livro dos Monstros para o revenant, a hidra, a água viva, o golem de argila, o
// fantasma, a múmia e o gnomo das profundezas; o Obelisco para o esqueleto anão), lidos do 5e.tools. O texto é nosso.
// O espectro (P18), o wraith (P14) e o guardião-escudo (P17) já estavam no jogo.
//
// O QUE O MOTOR EXECUTA (`combat.js`): a regeneração do revenant, que o fogo e o radiante suspendem por um turno
// (`regeneracaoVingativa`); a rejuvenescência é da cena (`cripta-talhund.js`: sem a paz, volta em 24 horas); o olhar
// vingativo dele; as CABEÇAS da hidra (morde
// uma vez por cabeça, perde uma a cada 25 de dano num turno, cresce duas por cabeça perdida, menos depois de fogo); o
// aperto da água viva, que puxa para a água; a absorção de ácido e a pressa do golem; o olhar terrível e a podridão da
// múmia; e a POSSESSÃO do fantasma (o corpo do herói ataca um aliado; acaba quando o corpo cai).
//
// APROXIMAÇÕES, ditas:
//   - o revenant que cai a 0 PV morre ali, sem a chance de levantar no começo do turno seguinte; o rastreador
//     vingativo é texto. O medo que vem depois da paralisia do olhar começa junto com ela;
//   - o juramento de vingança dos guardiões da cripta é contra TODO vivo que a invade (o Obelisco): o golpe soma os 4d6
//     contra qualquer herói;
//   - a água viva prende e puxa; o afogamento é o fôlego de quem fica debaixo d'água (`conditions.js gastarFolego`);
//   - o golem enlouquecido (o FUROR, `combat.js`/`ai.js`) bate no mais perto, de qualquer lado;
//   - a podridão da múmia tira a cura e 3d6 de PV máximo a cada descanso longo (`descanso.js`), até Remover Maldição;
//   - a Visagem do fantasma envelhece 1d4 x 10 anos quem falha por 5 (`anosEnvelhecidos` no herói); a possessão é a do
//     bloco, menos o uso das perícias. DECISÃO: ele não foge para o Plano Etéreo — os fantasmas de P13 estão presos à
//     sala e a purificação pede que sejam vencidos; um fantasma que sumisse no Etéreo trancaria a cripta para sempre.

export const CRIPTA = {
  // P1 e P15: os guardiões corrompidos. Juraram vingança contra todo vivo que invade a cripta.
  revenant: {
    id: 'revenant',
    tipo: 'morto-vivo',
    name: 'Guardião Corrompido',
    look: 'revenant',
    fonte: 'MM',
    size: 'médio',
    level: 5,
    cr: '5',
    xp: 1800,
    abilities: { str: 18, dex: 14, con: 18, int: 13, wis: 16, cha: 18 },
    ac: 13,
    acNote: 'couro',
    maxHp: 136,
    hpDice: '16d8+64',
    speedFt: 30,
    saves: ['str', 'con', 'wis', 'cha'],
    senses: { darkvisionFt: 60 },
    damageResistances: ['necrótico', 'psíquico'],
    damageImmunities: ['veneno'],
    conditionImmunities: ['enfeitiçado', 'exausto', 'amedrontado', 'paralisado', 'envenenado', 'atordoado'],
    attacks: [
      { name: 'Punho', bonus: 7, damage: '2d6+4', type: 'concussão', reachFt: 5, art: 'fist',
        danoExtra: { damage: '4d6', type: 'concussão' } },
    ],
    multiattack: { count: 2 },
    traits: ['regeneracaoVingativa', 'olharVingativo', 'imuneAExpulsar'],
    blurb: 'Um guarda anão que não descansa. Dois punhos que somam 4d6 de vingança, um olhar que paralisa, e 10 PV de volta todo turno — menos depois de fogo ou de luz radiante.',
  },

  // P5: Grandlejaw, a hidra, cochilando na água com uma ou duas cabeças de vigia.
  hidra: {
    id: 'hidra',
    tipo: 'monstruosidade',
    name: 'Hidra',
    look: 'hidra',
    fonte: 'MM',
    size: 'enorme',
    level: 8,
    cr: '8',
    xp: 3900,
    abilities: { str: 20, dex: 12, con: 20, int: 2, wis: 10, cha: 7 },
    ac: 15,
    acNote: 'couraça natural',
    maxHp: 172,
    hpDice: '15d12+75',
    speedFt: 30,
    speeds: { swimFt: 30 },
    skills: ['percepcao'],
    expertise: ['percepcao'],
    senses: { darkvisionFt: 60 },
    attacks: [
      { name: 'Mordida', bonus: 8, damage: '1d10+5', type: 'perfurante', reachFt: 10, art: 'bite' },
    ],
    cabecas: 5,
    traits: ['cabecasMultiplas', 'prenderOFolego', 'sempreAlerta'],
    blurb: 'Cinco cabeças, uma mordida por cabeça. Cada 25 de dano num turno arranca uma, e no fim do turno dela nascem duas — a não ser que tenha levado fogo.',
  },

  // P5: Kellikilli, a água viva do poço.
  aguaViva: {
    id: 'aguaViva',
    tipo: 'elemental',
    name: 'Água Viva',
    look: 'aguaViva',
    fonte: 'MM',
    size: 'grande',
    level: 3,
    cr: '3',
    xp: 700,
    abilities: { str: 17, dex: 16, con: 13, int: 11, wis: 10, cha: 10 },
    ac: 13,
    maxHp: 58,
    hpDice: '9d10+9',
    speedFt: 60,
    speeds: { swimFt: 60 },
    senses: { blindsightFt: 30 },
    damageResistances: ['fogo', 'concussão', 'perfurante', 'cortante'],
    damageResistancesNote: 'cortante, perfurante e concussão só de ataques não mágicos',
    damageImmunities: ['veneno'],
    conditionImmunities: ['exausto', 'agarrado', 'paralisado', 'envenenado', 'imobilizado', 'caido', 'inconsciente'],
    attacks: [
      { name: 'Constrição', bonus: 5, damage: '3d6+3', type: 'concussão', reachFt: 10, art: 'grab', puxa: 5,
        onHit: { semResistencia: true, dc: 13, escape: 13, condition: 'contido', note: 'é apertado e arrastado para a água',
          imunes: { tamanhos: ['grande', 'enorme', 'imenso'], motivo: 'grande demais para ela' } } },
    ],
    traits: ['invisivelNaAgua', 'presaAAgua'],
    blurb: 'Uma serpente de água, invisível dentro do poço. Aperta a 3 m e puxa para dentro; se sair da água, morre.',
  },

  // P8: o golem de argila em forma de anão de armadura, que nunca deixou ninguém passar.
  golemDeArgila: {
    id: 'golemDeArgila',
    tipo: 'constructo',
    name: 'Golem de Argila',
    look: 'golemDeArgila',
    fonte: 'MM',
    size: 'grande',
    level: 9,
    cr: '9',
    xp: 5000,
    abilities: { str: 20, dex: 9, con: 18, int: 3, wis: 8, cha: 1 },
    ac: 14,
    acNote: 'couraça natural',
    maxHp: 133,
    hpDice: '14d10+56',
    speedFt: 20,
    senses: { darkvisionFt: 60 },
    damageImmunities: ['ácido', 'veneno', 'psíquico', 'concussão', 'perfurante', 'cortante'],
    damageImmunitiesNote: 'cortante, perfurante e concussão só de ataques não mágicos que não são de adamante',
    conditionImmunities: ['enfeitiçado', 'exausto', 'amedrontado', 'paralisado', 'petrificado', 'envenenado'],
    attacks: [
      { name: 'Pancada', bonus: 8, damage: '2d10+5', type: 'concussão', reachFt: 5, art: 'mace', magico: true,
        maxHpDrain: { save: 'con', dc: 15 } },
    ],
    multiattack: { count: 2 },
    traits: ['absorcaoAcida', 'furorDoGolem', 'formaImutavel', 'resistenciaAMagia', 'armasMagicas', 'pressaDoGolem'],
    blurb: 'Três metros de barro em forma de anão de armadura. Duas pancadas que tiram PV máximo (Constituição CD 15), imune a arma comum, e o ácido o cura.',
  },

  // P13: Brelta Gemblade e os ajudantes dela, Murnig e Nelja.
  fantasma: {
    id: 'fantasma',
    tipo: 'morto-vivo',
    name: 'Fantasma',
    look: 'fantasma',
    fonte: 'MM',
    size: 'médio',
    level: 4,
    cr: '4',
    xp: 1100,
    abilities: { str: 7, dex: 13, con: 10, int: 10, wis: 12, cha: 17 },
    ac: 11,
    maxHp: 45,
    hpDice: '10d8',
    speedFt: 40,
    flyFt: 40,
    hover: true,
    senses: { darkvisionFt: 60 },
    damageResistances: ['ácido', 'fogo', 'elétrico', 'trovejante', 'concussão', 'perfurante', 'cortante'],
    damageResistancesNote: 'cortante, perfurante e concussão só de ataques não mágicos',
    damageImmunities: ['frio', 'necrótico', 'veneno'],
    conditionImmunities: ['enfeitiçado', 'exausto', 'amedrontado', 'agarrado', 'paralisado', 'petrificado', 'envenenado', 'caido', 'imobilizado'],
    incorporeo: true,
    attacks: [
      { name: 'Toque Murchador', bonus: 5, damage: '4d6+3', type: 'necrótico', reachFt: 5, art: 'claw' },
    ],
    tatica: 'fantasma',
    traits: ['incorporealMovement', 'visagemHorripilante', 'possessao'],
    blurb: 'Um sacerdote-guerreiro anão que não descansa. Toque que murcha (4d6+3), uma visagem que apavora, e possui o corpo de quem chega perto.',
  },

  // P17: o arquiteto, enrolado nos próprios projetos.
  mumia: {
    id: 'mumia',
    tipo: 'morto-vivo',
    name: 'Múmia',
    look: 'mumia',
    fonte: 'SRD',
    size: 'médio',
    level: 3,
    cr: '3',
    xp: 700,
    abilities: { str: 16, dex: 8, con: 15, int: 6, wis: 10, cha: 12 },
    ac: 11,
    acNote: 'couraça natural',
    maxHp: 58,
    hpDice: '9d8+18',
    speedFt: 20,
    saves: ['wis'],
    senses: { darkvisionFt: 60 },
    damageResistances: ['concussão', 'perfurante', 'cortante'],
    damageResistancesNote: 'cortante, perfurante e concussão só de ataques não mágicos',
    damageImmunities: ['necrótico', 'veneno'],
    damageVulnerabilities: ['fogo'],
    conditionImmunities: ['enfeitiçado', 'exausto', 'amedrontado', 'paralisado', 'envenenado'],
    attacks: [
      { name: 'Punho Podre', bonus: 5, damage: '2d6+3', type: 'concussão', reachFt: 5, art: 'fist',
        danoExtra: { damage: '3d6', type: 'necrótico' },
        onHit: { save: 'con', dc: 12, condition: 'podridaoDaMumia', note: 'sente a carne apodrecer onde foi tocado' } },
    ],
    traits: ['olharTerrivel', 'podridaoDaMumia'],
    blurb: 'Um morto enrolado em pano escrito. Um olhar que apavora (e paralisa quem falha feio) e um punho que apodrece: quem falha não se cura mais até alguém tirar a maldição.',
  },

  // P10 (a fundadora) e P11/P12 (os catorze valentes).
  esqueletoAnao: {
    id: 'esqueletoAnao',
    tipo: 'morto-vivo',
    name: 'Esqueleto Anão',
    look: 'esqueletoAnao',
    fonte: 'PaBTSO',
    size: 'médio',
    level: 2,
    cr: '1/2',
    xp: 100,
    abilities: { str: 16, dex: 10, con: 15, int: 6, wis: 8, cha: 5 },
    ac: 13,
    acNote: 'camisão de malha',
    maxHp: 26,
    hpDice: '4d8+8',
    speedFt: 25,
    senses: { darkvisionFt: 60 },
    damageVulnerabilities: ['concussão'],
    damageImmunities: ['veneno'],
    conditionImmunities: ['exausto', 'envenenado'],
    attacks: [
      { name: 'Machado de Batalha', bonus: 5, damage: '1d8+3', type: 'cortante', reachFt: 5, art: 'axe' },
    ],
    traits: ['pesFirmes'],
    blurb: 'Um guerreiro anão que só sobrou de osso e de cota de malha. Machado de batalha, e é difícil derrubá-lo.',
  },

  // P9: Rivibiddel, o historiador gnomo que entrou nadando e não tem como sair.
  gnomoDasProfundezas: {
    id: 'gnomoDasProfundezas',
    tipo: 'humanoide',
    name: 'Gnomo das Profundezas',
    look: 'gnomoDasProfundezas',
    fonte: 'MM',
    size: 'pequeno',
    level: 2,
    cr: '1/2',
    xp: 100,
    abilities: { str: 15, dex: 14, con: 14, int: 12, wis: 10, cha: 9 },
    ac: 15,
    acNote: 'camisão de malha',
    maxHp: 16,
    hpDice: '3d6+6',
    speedFt: 20,
    skills: ['investigacao', 'percepcao', 'furtividade'],
    senses: { darkvisionFt: 120 },
    attacks: [
      { name: 'Picareta de Guerra', bonus: 4, damage: '1d8+2', type: 'perfurante', reachFt: 5, art: 'axe' },
    ],
    traits: ['camuflagemDePedra', 'astuciaGnomica'],
    blurb: 'Um gnomo cinzento e miúdo, de barba rala. Veio pela água.',
  },
};

export const TRAITS = {
  regeneracaoVingativa: { name: 'Regeneração', desc: 'Recupera 10 PV no começo do turno. Fogo ou radiante suspendem a regeneração no turno seguinte. Destruído, volta noutro corpo em 24 horas — na Cripta dos Talhund, só enquanto as assombrações não estiverem em paz.' },
  olharVingativo: { name: 'Olhar Vingativo', desc: 'Ação: um alvo a 9 m faz Sabedoria CD 15 ou fica paralisado até o revenant feri-lo ou até o fim do próximo turno dele; depois, amedrontado por 1 minuto.' },
  imuneAExpulsar: { name: 'Imune a Expulsar', desc: 'Expulsar Mortos-Vivos não o afeta.' },
  cabecasMultiplas: { name: 'Cabeças Múltiplas', desc: 'Uma mordida por cabeça (começa com cinco). A cada 25 de dano num turno, uma cabeça morre; no fim do turno dela, nascem duas por cabeça morta (e 10 PV por cabeça), a não ser que tenha levado fogo. Sem cabeças, morre.' },
  prenderOFolego: { name: 'Prender o Fôlego', desc: 'Fica uma hora sem respirar.' },
  sempreAlerta: { name: 'Sempre Alerta', desc: 'Enquanto dorme, ao menos uma cabeça fica acordada.' },
  invisivelNaAgua: { name: 'Invisível na Água', desc: 'Invisível enquanto está toda dentro d\'água.' },
  presaAAgua: { name: 'Presa à Água', desc: 'Morre se sair da água a que está presa.' },
  absorcaoAcida: { name: 'Absorção de Ácido', desc: 'O ácido não o fere: cura o mesmo tanto.' },
  furorDoGolem: { name: 'Furor', desc: 'Começando o turno com 60 PV ou menos, num 6 no d6 enlouquece e ataca o mais próximo, amigo ou não.' },
  formaImutavel: { name: 'Forma Imutável', desc: 'Imune a magia ou efeito que mude a forma dele.' },
  armasMagicas: { name: 'Armas Mágicas', desc: 'Os golpes dele são mágicos.' },
  pressaDoGolem: { name: 'Pressa (recarga 5–6)', desc: 'Até o fim do próximo turno: +2 de CA, vantagem em Destreza e uma pancada a mais como ação bônus.' },
  possessao: { name: 'Possessão (recarga 6)', desc: 'Um humanoide a 1,5 m faz Carisma CD 13 ou é possuído: o fantasma some dentro dele e usa o corpo, até o corpo cair ou alguém o expulsar.' },
  olharTerrivel: { name: 'Olhar Terrível', desc: 'Junto do golpe: um alvo a 18 m que a vê faz Sabedoria CD 11 ou fica amedrontado até o fim do próximo turno dela (paralisado também, se falhar por 5). Quem passa fica imune por 24 horas.' },
  podridaoDaMumia: { name: 'Podridão da Múmia', desc: 'Quem falha na Constituição CD 12 do punho não recupera PV até tirarem a maldição.' },
  pesFirmes: { name: 'Pés Firmes', desc: 'Vantagem nas resistências de Força e Destreza contra ser derrubado.' },
  astuciaGnomica: { name: 'Astúcia Gnômica', desc: 'Vantagem nas resistências de Inteligência, Sabedoria e Carisma contra magia.' },
};
