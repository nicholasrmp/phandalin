// AS CRIATURAS DO CAPÍTULO 8 DO OBELISCO, "Além de uma Estrela sem Luz": o Labirinto Salgado, o Vazio Sem Fim, a Ânima
// de Ilvaash e a Refração na volta.
//
// Quase todo o elenco do capítulo já está no jogo (o bestiário do MM entrou como dado, e o Obelisco dos capítulos 5 a 7
// trouxe o resto): a aranha defasadora, o ashenwight psiônico, o cavaleiro e o guerreiro githyanki, o zelote aberrante,
// a fusão de carne, o espectador, o flumph, o aglomerado e a gêmula encefálicos, o observador, o mago, o arcanaloth, o
// verme púrpura, o guardião-escudo, o plebeu, o aboleth, o elemental da água, a naga espiritual, o perseguidor
// invisível, o mezzoloth, o brutamonte umbral, o nicaloth, o profeta devorador de mentes e a armadilha de intelecto
// (`armadilhaDeIntelecto`, de Talhundereth: é o Intellect Snare do Nematódeo e do Vazio). O de-para está em
// `revisoes/obelisco-cap8-plano-2026-11-11.md`.
//
// O que faltava, feito aqui, à mão, com os números do livro (lidos do 5e.tools) e o texto nosso:
//   - o DEVORADOR CLARIVIDENTE, os três fanáticos (a reação Distorcer a Realidade: +4 de CA e um teleporte de 18 m,
//     `combat.js`, traço `distorcerARealidade`; o Desatar o Vazio numa esfera de 9 m a até 18 m dele);
//   - o LOWARNIZEL, o dragão-ametista jovem (o Sopro da Singularidade, que prende os pés até o começo do turno seguinte
//     dele: `ateInicioDoTurnoDoDono` na ação especial);
//   - a REFRAÇÃO DE ILVAASH (a Garra Dissonante, de 3 m ou de 36 m, que derruba a concentração: `quebraConcentracao` no
//     golpe; a Quebra-Mente lendária, sem teste: `semTeste` com `condition` em `livro-motor.js`);
//   - o CRÂNIO FLAMEJANTE do MM: o nosso `caveiraCandente` é um bloco próprio, menor, feito para o 4º nível;
//   - as variantes que o capítulo nomeia: o zelote TENTACULADO (com a Explosão Mental), a CABEÇA da Chishinix (a gêmula
//     que anda devagar e não amadurece), a NELLIK (o nicaloth com o machado Matador de Devoradores) e a VARAKKTA (a
//     cavaleira githyanki com a espada grande de reserva, sem a de prata: os golpes dela não são mágicos).
//
// DE FORA, dito: a Mudança de Plano dos devoradores e da Refração (sair do mapa no meio da luta é fim de cena, não de
// golpe); a Debilidade Mental da Refração (o jogo não tem a magia); a Clarividência, a Mão Mágica, Detectar Magia e
// Detectar Pensamentos (não mudam a luta); a Proteção contra o Bem e o Mal e Enviar do Lowarnizel (não há a primeira, e a
// segunda é de fora da luta); o Mudar de Forma dele (é da cena, onde ele pode aparecer disfarçado); o Sentir Criaturas da
// Refração (ela sabe onde o grupo está porque a cena a põe na saída); o Rejuvenescer do crânio (volta em uma hora, fora
// da luta); e os testes de atributo da Quebra-Mente (o resto dela vale).

import { LIVRO_MM } from './livro-mm.js';
import { OBELISCO7 } from './obelisco7.js';
import { ABERRACOES } from './aberracoes.js';

const zelote = OBELISCO7.zeloteAberrante;
const gemula = ABERRACOES.gemulaEncefalica;
const nicaloth = LIVRO_MM.nicaloth;
const cavaleiro = LIVRO_MM.cavaleiroGithyanki;

export const OBELISCO8 = {
  // A Ânima de Ilvaash: Chishinix, Hashutu e Voalsh, os três fanáticos que fugiram de Illithinoch com o obelisco.
  devoradorClarividente: {
    id: 'devoradorClarividente',
    tipo: 'aberração',
    name: 'Devorador de Mentes Clarividente',
    nomeOriginal: 'Mind Flayer Clairvoyant',
    fonte: 'PaBTSO',
    size: 'médio',
    level: 13,
    cr: '11',
    xp: 7200,
    abilities: { str: 11, dex: 12, con: 15, int: 21, wis: 17, cha: 18 },
    ac: 15,
    acNote: 'peitoral',
    maxHp: 156,
    hpDice: '24d8+48',
    speedFt: 30,
    flyFt: 60,
    hover: true,
    speeds: { walkFt: 30, flyFt: 60 },
    senses: { darkvisionFt: 120, truesightFt: 15, passivePerception: 17 },
    saves: ['int', 'wis', 'cha'],
    skills: ['arcanismo', 'intuicao', 'percepcao', 'furtividade'],
    damageResistances: ['psíquico'],
    conditionImmunities: ['cego', 'enfeiticado', 'amedrontado'],
    attacks: [
      { name: 'Extrair Cérebro', bonus: 9, damage: '10d10', type: 'perfurante', reachFt: 5, art: 'claw', consome: true,
        exige: 'agarradoIncapacitado' },
      { name: 'Tentáculo', bonus: 9, damage: '3d10+5', type: 'psíquico', reachFt: 5, art: 'claw',
        onHit: [
          { semResistencia: true, condition: 'agarrado', escape: 17, note: 'é agarrado pelos tentáculos',
            imunes: { tamanhos: ['grande', 'enorme', 'imenso'], motivo: 'grande demais para os tentáculos' } },
          { save: 'int', dc: 17, condition: 'incapacitado', comOAgarrao: true, exigeAgarrado: true, note: 'sente a mente travar' },
        ] },
    ],
    multiattack: { count: 2, sequencias: [['Tentáculo', 'Tentáculo']] },
    spellcasting: {
      ability: 'int', cantrips: [], slots: [],
      prepared: ['dissiparMagia', 'detectarMagia', 'detectarPensamentos', 'maoMagica'],
      porDia: { dissiparMagia: 3 },
      aVontade: ['detectarMagia', 'detectarPensamentos', 'maoMagica'],
      cdPorMagia: { dissiparMagia: 17 },
      noMotor: true, conjuraNoTurno: 'geral',
    },
    acoesEspeciais: [
      // DESATAR O VAZIO (recarga 5–6): um rasgo num ponto a até 18 m; quem não é devorador a 9 m dele, Inteligência CD 17,
      // 4d8 de frio e 4d8 psíquicos e atordoado por 1 minuto (repete no fim de cada turno); metade e nada mais a quem passa.
      // O livro poupa só os devoradores; aqui, as aberrações (no capítulo, quem está do lado deles na Ânima).
      { nome: 'Desatar o Vazio', recharge: [5, 6], tipo: 'area', shape: 'sphere', areaFt: 30, alcanceFt: 60, poupaTipo: 'aberração',
        save: 'int', dc: 17, damage: '4d8', damageType: 'frio', damage2: '4d8', damageType2: 'psíquico', halfOnSave: true,
        condition: 'atordoado', rounds: 10, repete: true },
    ],
    recursos: { resistenciaLendaria: 3 },
    traits: ['resistenciaLendaria', 'resistenciaAMagia', 'distorcerARealidade'],
    blurb: 'Um devorador de mentes de peitoral e túnica, que vê o que vai acontecer um segundo antes. Some de onde a espada ia cair, abre rasgos no ar que congelam e atordoam, e o tentáculo que agarra também apaga a mente.',
  },

  // O OBELISCO REMENDADO da Ânima de Ilvaash: CA 17, imune a veneno e a psíquico, SEM PV. Não se destrói: o dano que ele
  // levaria vai para o fanático mais perto (`combat.js contragolpeDoObelisco`, `contragolpe`). Não age, não anda e não
  // segura a luta; a arte é a do mapa (`pintadoNoMapa`: o tabuleiro só desenha o anel). Mortos os três fanáticos, vira pó.
  obeliscoDaAnima: {
    id: 'obeliscoDaAnima',
    tipo: 'objeto',
    name: 'Obelisco remendado',
    nomeOriginal: 'Obelisk',
    fonte: 'PaBTSO',
    size: 'grande',
    level: 1,
    cr: '0',
    xp: 0,
    abilities: { str: 10, dex: 1, con: 10, int: 1, wis: 1, cha: 1 },
    ac: 17,
    acNote: 'pedra negra',
    maxHp: 999,
    hpDice: '0',
    speedFt: 0,
    senses: {},
    damageImmunities: ['veneno', 'psíquico'],
    conditionImmunities: ['agarrado', 'amedrontado', 'atordoado', 'caido', 'cego', 'contido', 'enfeiticado', 'envenenado',
      'incapacitado', 'inconsciente', 'paralisado', 'petrificado', 'surdo', 'exausto'],
    attacks: [],
    contragolpe: { fator: 1 },
    naoSeguraALuta: true,
    pintadoNoMapa: true,
    traits: [],
    blurb: 'Um obelisco negro feito de pedaços, costurados por veios de energia verde. Não se quebra: o que o fere, fere quem está ligado a ele.',
  },

  // A cabeça cortada que anda atrás da Chishinix: a gêmula sem a maturação, devagar.
  cabecaDaChishinix: {
    ...gemula,
    id: 'cabecaDaChishinix',
    look: 'gemulaEncefalica',
    name: 'Cabeça da Chishinix',
    nomeOriginal: "Chishinix' Head",
    speedFt: 10,
    blurb: 'Uma cabeça cortada que anda sobre fios de nervo atrás da devoradora que a alimenta. Morde a mente de quem chega perto.',
  },

  // B17: o dragão-ametista jovem, preso no labirinto com a maga Gossa. Aliado possível.
  lowarnizel: {
    id: 'lowarnizel',
    tipo: 'dragão',
    name: 'Lowarnizel',
    nomeOriginal: 'Lowarnizel',
    fonte: 'PaBTSO',
    size: 'grande',
    level: 11,
    cr: '9',
    xp: 5000,
    abilities: { str: 21, dex: 12, con: 21, int: 18, wis: 15, cha: 19 },
    ac: 18,
    acNote: 'armadura natural',
    maxHp: 168,
    hpDice: '16d10+80',
    speedFt: 40,
    flyFt: 80,
    hover: true,
    speeds: { walkFt: 40, flyFt: 80, swimFt: 40 },
    senses: { blindsightFt: 30, darkvisionFt: 120, passivePerception: 20 },
    saves: ['dex', 'con', 'wis', 'cha'],
    skills: ['arcanismo', 'percepcao', 'persuasao', 'furtividade'],
    damageResistances: ['energético', 'psíquico'],
    conditionImmunities: ['amedrontado', 'caido'],
    attacks: [
      { name: 'Mordida', bonus: 9, damage: '2d10+5', type: 'perfurante', reachFt: 10, art: 'bite',
        danoExtra: { damage: '1d8', type: 'energético' } },
      { name: 'Garra', bonus: 9, damage: '1d8+5', type: 'cortante', reachFt: 5, art: 'claw' },
    ],
    multiattack: { count: 3, sequencias: [['Mordida', 'Garra', 'Garra']] },
    spellcasting: {
      ability: 'int', cantrips: [], slots: [],
      prepared: ['velocidade', 'dissiparMagia', 'enviarMensagem'],
      porDia: { velocidade: 1, dissiparMagia: 1, enviarMensagem: 1 },
      aVontade: [],
      cdPorMagia: { velocidade: 16, dissiparMagia: 16, enviarMensagem: 16 },
      noMotor: true, conjuraNoTurno: 'geral',
    },
    acoesEspeciais: [
      // O SOPRO DA SINGULARIDADE (recarga 5–6): uma conta de gravidade que explode num cone de 9 m, Força CD 17, 8d8 de
      // energia e o deslocamento em 0 até o começo do próximo turno dele; quem passa leva metade, e só
      { nome: 'Sopro da Singularidade', recharge: [5, 6], tipo: 'area', shape: 'cone', areaFt: 30, save: 'str', dc: 17,
        damage: '8d8', damageType: 'energético', halfOnSave: true, condition: 'desalento', ateInicioDoTurnoDoDono: true },
    ],
    blurb: 'Um dragão-ametista jovem, de escamas violeta que brilham como cristal, perdido no labirinto por uma magia que errou o caminho. Mordida com um peso de gravidade, e um sopro que esmaga e prende os pés no chão.',
  },

  // B22, na volta: uma lasca do próprio Ilvaash, um cérebro fantasma do tamanho de uma carroça com garras penduradas.
  refracaoDeIlvaash: {
    id: 'refracaoDeIlvaash',
    tipo: 'aberração',
    name: 'Refração de Ilvaash',
    nomeOriginal: 'Refraction of Ilvaash',
    fonte: 'PaBTSO',
    size: 'enorme',
    level: 17,
    cr: '15',
    xp: 13000,
    abilities: { str: 17, dex: 10, con: 17, int: 23, wis: 20, cha: 22 },
    ac: 11,
    acNote: 'armadura natural',
    maxHp: 199,
    hpDice: '21d12+63',
    speedFt: 10,
    flyFt: 30,
    hover: true,
    speeds: { walkFt: 10, flyFt: 30, swimFt: 10 },
    senses: { blindsightFt: 120, passivePerception: 15 },
    saves: ['int', 'wis'],
    skills: ['arcanismo', 'intuicao', 'intimidacao', 'persuasao'],
    damageResistances: ['concussão', 'perfurante', 'cortante'],
    damageResistancesNote: 'só de armas não mágicas',
    damageImmunities: ['veneno', 'psíquico'],
    conditionImmunities: ['exaustao', 'agarrado', 'paralisado', 'petrificado', 'envenenado', 'caido', 'contido'],
    attacks: [
      { name: 'Garra Dissonante', bonus: 11, damage: '3d12+6', type: 'psíquico', reachFt: 10, art: 'claw', magico: true,
        quebraConcentracao: true },
      { name: 'Garra Dissonante Projetada', bonus: 11, damage: '3d12+6', type: 'psíquico', ranged: true, rangeFt: 120, longRangeFt: 120,
        art: 'spell', magico: true, quebraConcentracao: true },
    ],
    // duas Garras Dissonantes: de perto, as de 3 m; de longe, as projetadas
    multiattack: { count: 2, sequencias: [['Garra Dissonante', 'Garra Dissonante'], ['Garra Dissonante Projetada', 'Garra Dissonante Projetada']] },
    spellcasting: {
      ability: 'int', cantrips: [], slots: [],
      prepared: ['dissiparMagia', 'detectarMagia', 'detectarPensamentos'],
      porDia: { dissiparMagia: 3 },
      aVontade: ['detectarMagia', 'detectarPensamentos'],
      cdPorMagia: { dissiparMagia: 19 },
      noMotor: true, conjuraNoTurno: 'geral',
    },
    acoesEspeciais: [
      // A EXPLOSÃO MENTAL (recarga 5–6): as criaturas que ELA escolhe a 18 m, Inteligência CD 19, 5d10+6 psíquicos e
      // atordoado por 1 minuto (repete no fim de cada turno)
      { nome: 'Explosão Mental', recharge: [5, 6], tipo: 'area', shape: 'raio', areaFt: 60, escolhe: true, save: 'int', dc: 19,
        damage: '5d10+6', damageType: 'psíquico', halfOnSave: false, condition: 'atordoado', rounds: 10, repete: true },
      // o TELEPORTE: até 36 m, quando os inimigos a cercam e ela está mal
      { nome: 'Teleporte', tipo: 'teleporte', alcanceFt: 120 },
    ],
    lendarias: {
      acoes: 3,
      opcoes: [
        { nome: 'Quebra-Mente', custo: 1, tipo: 'alvo', alcanceFt: 120, semTeste: true, condition: 'quebraMente' },
        { nome: 'Garra Projetada', custo: 2, tipo: 'golpe', arma: 'Garra Dissonante Projetada' },
      ],
    },
    recursos: { resistenciaLendaria: 5 },
    traits: ['incorporealMovement', 'resistenciaLendaria', 'resistenciaAMagia', 'acoesLendarias'],
    blurb: 'Um cérebro fantasma do tamanho de uma carroça, com garras penduradas que ferem a mente de 36 m, atravessa paredes e gente, e embaralha os pensamentos de quem a encara. Uma lasca do deus que mora no labirinto.',
  },

  // B4: os magos que o labirinto engoliu viraram crânios em chamas. O bloco do Livro dos Monstros (o nosso
  // `caveiraCandente`, do 4º nível, é outra coisa).
  cranioFlamejante: {
    id: 'cranioFlamejante',
    tipo: 'morto-vivo',
    name: 'Crânio Flamejante',
    nomeOriginal: 'Flameskull',
    fonte: 'MM',
    size: 'miúdo',
    level: 6,
    cr: '4',
    xp: 1100,
    abilities: { str: 1, dex: 17, con: 14, int: 16, wis: 10, cha: 11 },
    ac: 13,
    maxHp: 40,
    hpDice: '9d4+18',
    speedFt: 0,
    flyFt: 40,
    hover: true,
    speeds: { walkFt: 0, flyFt: 40 },
    senses: { darkvisionFt: 60, passivePerception: 12 },
    skills: ['arcanismo', 'percepcao'],
    damageResistances: ['elétrico', 'necrótico', 'perfurante'],
    damageImmunities: ['frio', 'fogo', 'veneno'],
    conditionImmunities: ['enfeiticado', 'amedrontado', 'paralisado', 'envenenado', 'caido'],
    attacks: [
      { name: 'Raio de Fogo', bonus: 5, damage: '3d6', type: 'fogo', ranged: true, rangeFt: 30, longRangeFt: 30, art: 'spell', magico: true },
    ],
    multiattack: { count: 2 },
    spellcasting: {
      ability: 'int', cantrips: [],
      prepared: ['misselMagico', 'escudoArcano', 'borrao', 'esferaFlamejante', 'bolaDeFogo'],
      slots: [0, 3, 2, 1],
      noMotor: true, conjuraNoTurno: 'geral',
    },
    luzPropria: { claro: 15, penumbra: 15, tipo: 'fogo' },
    traits: ['resistenciaAMagia', 'conjuracao'],
    blurb: 'A cabeça de um mago morto, em chamas verdes, que guarda o que sabia de magia: raios de fogo, mísseis que não erram e uma bola de fogo.',
  },

  // B18: os dois zelotes de tentáculos no rosto que guardam a porta da frente (Nouashu e Groushim).
  zeloteTentaculado: {
    ...zelote,
    id: 'zeloteTentaculado',
    look: 'zeloteAberrante',
    name: 'Zelote Aberrante Tentaculado',
    nomeOriginal: 'Aberrant Zealot (Tentacled)',
    acoesEspeciais: [
      ...zelote.acoesEspeciais,
      // A EXPLOSÃO MENTAL (recarga 5–6): cone de 18 m, Inteligência CD 15, 4d8+4 psíquicos e atordoado por 1 minuto
      { nome: 'Explosão Mental', recharge: [5, 6], tipo: 'area', shape: 'cone', areaFt: 60, save: 'int', dc: 15,
        damage: '4d8+4', damageType: 'psíquico', halfOnSave: false, condition: 'atordoado', rounds: 10, repete: true },
    ],
    blurb: 'Um zelote que o Reino Distante já começou a virar devorador: pele violeta e tentáculos no lugar da boca. Tem tudo o que o zelote tem, e uma explosão mental em cone que atordoa.',
  },

  // W2, o Campo de Batalha Lamentoso: a nicaloth mercenária que largou a Ashripask, com o machado que corta devorador.
  nellik: {
    ...nicaloth,
    id: 'nellik',
    look: 'nicaloth',
    name: 'Nellik',
    nomeOriginal: 'Nellik',
    fonte: 'PaBTSO',
    attacks: [
      nicaloth.attacks[0],
      // o MATADOR DE DEVORADORES (+1): +10, 2d12+6, e 1d12 a mais contra aberração
      { name: 'Matador de Devoradores', bonus: 10, damage: '2d12+6', type: 'cortante', reachFt: 5, art: 'axe', magico: true,
        danoExtra: { damage: '1d12', type: 'cortante', contra: 'aberração' } },
    ],
    blurb: 'Uma nicaloth de asas largas e músculo de pedra, mercenária, que largou a patroa e se escondeu no Vazio. O machado dela foi feito para abrir devoradores de mentes.',
  },

  // B7: a cavaleira githyanki que caça devoradores no labirinto, com a espada grande de reserva (a de prata ficou
  // pregada na armadilha de intelecto de B5).
  varakkta: {
    ...cavaleiro,
    id: 'varakkta',
    look: 'cavaleiroGithyanki',
    name: 'Varakkta',
    nomeOriginal: 'Varakkta',
    fonte: 'PaBTSO',
    attacks: cavaleiro.attacks.map((a) => (/prata/i.test(a.name)
      ? { ...a, name: 'Espada Grande', magico: false } : a)),
    blurb: 'Uma cavaleira githyanki de armadura escura, paranoica, que perdeu a espada de prata para um bicho do labirinto. Luta com a espada grande de reserva, e não foge.',
  },
};

// O traço novo do capítulo, para a ficha e o "Lembrar".
export const TRAITS = {
  distorcerARealidade: { name: 'Distorcer a Realidade', desc: 'Reação, quando uma jogada de ataque o acerta: +4 de CA contra ela, e então some e reaparece a até 18 m, numa casa livre que vê.' },
};
