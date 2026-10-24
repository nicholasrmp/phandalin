// SRD 5.1 (CC-BY-4.0) — ver NOTICE.md
// Magias. Declarativas: o motor de combate lê o `kind` e resolve.
//
//   attack     jogada de ataque mágico contra a CA (`melee` = de toque)
//   save       teste de resistência do alvo contra a CD do conjurador
//   auto       acerta sem rolagem (míssil mágico)
//   heal       cura
//   buff       aplica condição em aliados
//   debuff     aplica condição em inimigos que falham na resistência
//   sleep      regra própria: soma de PV derrubados
//   armadura   CA base 13 + DES em quem está sem armadura
//   tempHp     pontos de vida temporários no conjurador
//   estabilizar  estabiliza quem está a 0 PV, sem teste
//   raios      várias jogadas de ataque, cada raio num alvo à escolha
//   healGrupo  cura vários aliados de uma vez
//   restaurar  tira uma condição (cego, envenenado, paralisado)
//   teleporte  o conjurador some e aparece numa casa livre que ele vê
//   reviver    traz de volta quem morreu há até 1 minuto
//   arma       arma espectral que bate agora e, depois, com a ação bônus
//   vampirico  toque que drena: o conjurador cura metade do dano
//   aura       área que anda com o conjurador (Espíritos Guardiões)
//   marca      maldição/marca num alvo: dano extra nos acertos de quem marcou
//   reacao     sai sozinha, na reação (Escudo Arcano, Repreensão Infernal)
//   disparada  o conjurador corre (Recuo Acelerado)
//
// `raiosPorNivel`: o truque ganha raios (não dados) no 5º, 11º e 17º nível.
// `semEscala`: o dano do truque não cresce em dados (a Rajada cresce em raios).
// `alvos`/`juntosFt`: truque de resistência que pega até N criaturas juntas.
// `centradoEmSi`: a esfera nasce no conjurador e não o pega.
// `rodadasProprias`: duração sem concentração, contada no turno de quem
// conjurou (Shillelagh, Proteção contra Lâminas, Santuário).
//
// `reuso`: magia que, depois de conjurada, repete o golpe nos turnos
// seguintes SEM gastar espaço nem contar como conjuração ('bonus' ou 'acao').
// `soTipo`: só funciona em criatura desse tipo (Imobilizar Pessoa).
// `repete`: o alvo repete a resistência no fim de cada turno dele;
// 'semVisao' só quando termina o turno sem ver o conjurador (Medo).
//
// `fonte`: 'srd' é magia do SRD 5.1; 'propria' é conteúdo do projeto, com
// texto e números nossos.
//
// `upcast`: o que a magia ganha por círculo acima do dela, quando conjurada
// com espaço maior — `dados` (um dado a mais do mesmo tipo), `dardos`,
// `alvos`, `reserva` (dados a mais na reserva do Sono) ou `fixo` (soma fixa).
//
// `applies.conta` diz de quem é o turno que conta a duração: 'conjurador'
// para os efeitos que duram "até o fim (ou o começo) do seu próximo turno".

export const SPELLS = {
  chamaSagrada: {
    id: 'chamaSagrada', name: 'Chama Sagrada', level: 0, school: 'evocação', fonte: 'srd',
    castTime: 'action', rangeFt: 60, kind: 'save', save: 'dex',
    damage: '1d8', damageType: 'radiante', halfOnSave: false, ignoresCover: true,
    desc: 'Luz do céu cai sobre a criatura. CD de DES ou 1d8 radiante. Cobertura não ajuda. Cresce no 5º, 11º e 17º nível.',
  },
  raioDeFogo: {
    id: 'raioDeFogo', name: 'Raio de Fogo', level: 0, school: 'evocação', fonte: 'srd',
    castTime: 'action', rangeFt: 120, kind: 'attack',
    damage: '1d10', damageType: 'fogo',
    desc: 'Dardo de fogo. Ataque mágico à distância, 1d10 de fogo. Cresce no 5º, 11º e 17º nível.',
  },
  raioDeGelo: {
    id: 'raioDeGelo', name: 'Raio de Gelo', level: 0, school: 'evocação', fonte: 'srd',
    castTime: 'action', rangeFt: 60, kind: 'attack',
    damage: '1d8', damageType: 'frio', applies: { condition: 'lento', rounds: 1, conta: 'conjurador', quando: 'inicio' },
    desc: 'Feixe gélido. 1d8 de frio e o alvo anda 3 m a menos no próximo turno dele. Cresce no 5º, 11º e 17º nível.',
  },
  misselMagico: {
    id: 'misselMagico', name: 'Míssil Mágico', level: 1, school: 'evocação', fonte: 'srd',
    castTime: 'action', rangeFt: 120, kind: 'auto',
    darts: 3, damage: '1d4+1', damageType: 'energético', upcast: { dardos: 1 },
    desc: 'Três dardos que nunca erram, 1d4+1 cada. Um dardo a mais por círculo acima do 1º.',
  },
  maosFlamejantes: {
    id: 'maosFlamejantes', name: 'Mãos Flamejantes', level: 1, school: 'evocação', fonte: 'srd',
    castTime: 'action', rangeFt: 0, shape: 'cone', areaFt: 15,
    kind: 'save', save: 'dex', damage: '3d6', damageType: 'fogo', halfOnSave: true, upcast: { dados: 1 },
    desc: 'Cone de 4,5 m. CD de DES, 3d6 de fogo, metade se passar. +1d6 por círculo acima do 1º.',
  },
  sono: {
    id: 'sono', name: 'Sono', level: 1, school: 'encantamento', fonte: 'srd',
    castTime: 'action', rangeFt: 90, shape: 'sphere', areaFt: 20,
    kind: 'sleep', pool: '5d8', upcast: { reserva: '2d8' },
    desc: 'Rola 5d8. Criaturas na área (9×9 casas) adormecem em ordem crescente de PV atuais, até esgotar o total. Mortos-vivos, elfos e meio-elfos não dormem; o dano acorda.',
  },
  curarFerimentos: {
    id: 'curarFerimentos', name: 'Curar Ferimentos', level: 1, school: 'evocação', fonte: 'srd',
    castTime: 'action', rangeFt: 5, kind: 'heal', heal: '1d8', addSpellMod: true, upcast: { dados: 1 },
    desc: 'Toque que cura 1d8 + modificador de conjuração. +1d8 por círculo acima do 1º.',
  },
  palavraCurativa: {
    id: 'palavraCurativa', name: 'Palavra Curativa', level: 1, school: 'evocação', fonte: 'srd',
    castTime: 'bonus', rangeFt: 60, kind: 'heal', heal: '1d4', addSpellMod: true, upcast: { dados: 1 },
    desc: 'Ação bônus. Cura 1d4 + modificador de conjuração à distância. +1d4 por círculo acima do 1º.',
  },
  bencao: {
    id: 'bencao', name: 'Bênção', level: 1, school: 'encantamento', fonte: 'srd',
    castTime: 'action', rangeFt: 30, kind: 'buff', targets: 3,
    condition: 'abencoado', concentration: true, duracaoRodadas: 10, upcast: { alvos: 1 },
    desc: 'Até 3 aliados somam 1d4 em ataques e testes de resistência. Concentração, até 1 minuto.',
  },

  // ---- acréscimos -----------------------------------------------------------
  //
  // Entraram para que PREPARAR MAGIA seja uma escolha. Com o livro do mago
  // tendo exatamente o número de magias que ele pode preparar, a tela de
  // preparação é um formulário sem decisão nenhuma.

  toqueArrepiante: {
    id: 'toqueArrepiante', name: 'Toque Arrepiante', level: 0, school: 'necromancia', fonte: 'srd',
    castTime: 'action', rangeFt: 120, kind: 'attack',
    damage: '1d8', damageType: 'necrótico',
    applies: { condition: 'semCura', rounds: 1, conta: 'conjurador', quando: 'inicio' },
    mortoVivoArrepiado: true,
    desc: 'Mão esquelética à distância. Ataque mágico, 1d8 necrótico, e o alvo não recupera PV até o seu próximo turno; um morto-vivo atingido ainda ataca você com desvantagem. Cresce no 5º, 11º e 17º nível.',
  },
  ondaTrovejante: {
    id: 'ondaTrovejante', name: 'Onda Trovejante', level: 1, school: 'evocação', fonte: 'srd',
    castTime: 'action', rangeFt: 0, shape: 'cube', areaFt: 15, pushFt: 10,
    kind: 'save', save: 'con', damage: '2d8', damageType: 'trovejante', halfOnSave: true, upcast: { dados: 1 },
    desc: 'Cubo de 4,5 m saindo de você. CD de CON: 2d8 trovejante e é empurrado 3 m; quem passa sofre metade e fica. +1d8 por círculo acima do 1º.',
  },
  // Conteúdo PRÓPRIO: não está no SRD 5.1. Números e texto do projeto.
  raioDeDoenca: {
    id: 'raioDeDoenca', name: 'Raio de Doença', level: 1, school: 'necromancia', fonte: 'propria',
    castTime: 'action', rangeFt: 60, kind: 'attack',
    damage: '2d8', damageType: 'veneno', upcast: { dados: 1 },
    applies: { condition: 'envenenado', rounds: 2, conta: 'conjurador', save: 'con' },
    desc: 'Feixe esverdeado. 2d8 de veneno; quem é atingido faz CD de CON ou fica envenenado até o fim do seu próximo turno.',
  },
  raioGuiado: {
    id: 'raioGuiado', name: 'Raio Guiado', level: 1, school: 'evocação', fonte: 'srd',
    castTime: 'action', rangeFt: 120, kind: 'attack',
    damage: '4d6', damageType: 'radiante', upcast: { dados: 1 },
    applies: { condition: 'iluminado', rounds: 2, conta: 'conjurador' },
    desc: 'Lança de luz. Ataque mágico à distância, 4d6 radiante, e o próximo ataque contra o alvo antes do fim do seu próximo turno tem vantagem.',
  },
  infligirFerimentos: {
    id: 'infligirFerimentos', name: 'Infligir Ferimentos', level: 1, school: 'necromancia', fonte: 'srd',
    castTime: 'action', rangeFt: 5, kind: 'attack', melee: true,
    damage: '3d10', damageType: 'necrótico', upcast: { dados: 1 },
    desc: 'Toque de pura decadência. Ataque mágico corpo a corpo, 3d10 necrótico. Erra feio quando erra.',
  },
  perdicao: {
    id: 'perdicao', name: 'Perdição', level: 1, school: 'encantamento', fonte: 'srd',
    castTime: 'action', rangeFt: 30, kind: 'debuff', targets: 3, save: 'cha',
    condition: 'amaldicoado', concentration: true, duracaoRodadas: 10, upcast: { alvos: 1 },
    desc: 'O espelho da Bênção: até 3 inimigos que você veja subtraem 1d4 de ataques e resistências. CD de CAR. Concentração, até 1 minuto.',
  },

  // ---- grimório do mago e truques do clérigo ---------------------------------

  armaduraArcana: {
    id: 'armaduraArcana', name: 'Armadura Arcana', level: 1, school: 'abjuração', fonte: 'srd',
    castTime: 'action', rangeFt: 5, kind: 'armadura',
    desc: 'Toque numa criatura sem armadura: a CA base dela passa a 13 + DES por 8 horas.',
  },
  vidaFalsa: {
    id: 'vidaFalsa', name: 'Vida Falsa', level: 1, school: 'necromancia', fonte: 'srd',
    castTime: 'action', rangeFt: 0, kind: 'tempHp', tempHp: '1d4+4', upcast: { fixo: 5 },
    desc: 'Você ganha 1d4 + 4 pontos de vida temporários. +5 por círculo acima do 1º.',
  },
  graxa: {
    id: 'graxa', name: 'Graxa', level: 1, school: 'conjuração', fonte: 'srd',
    castTime: 'action', rangeFt: 60, shape: 'square', areaFt: 10,
    kind: 'save', save: 'dex', onFail: { condition: 'caido' }, zona: { rodadas: 10 },
    desc: 'Um quadrado de 3 m escorregadio por 1 minuto: terreno difícil. Quem está nele, entra nele ou termina o turno nele faz CD de DES ou cai.',
  },
  resistencia: {
    id: 'resistencia', name: 'Resistência', level: 0, school: 'abjuração', fonte: 'srd',
    castTime: 'action', rangeFt: 5, kind: 'buff', targets: 1,
    condition: 'resistente', concentration: true, duracaoRodadas: 10,
    desc: 'Toque num aliado: no próximo teste de resistência ele soma 1d4. Concentração, até 1 minuto.',
  },
  pouparOsMoribundos: {
    id: 'pouparOsMoribundos', name: 'Poupar os Moribundos', level: 0, school: 'necromancia', fonte: 'srd',
    castTime: 'action', rangeFt: 5, kind: 'estabilizar',
    desc: 'Toque em quem está a 0 PV: fica estável, sem teste de Medicina.',
  },

  // ---- truques de combate dos heróis ---------------------------------------
  //
  // Livro do Jogador (2014). A regra é a do livro; o texto é nosso.
  rajadaMistica: {
    id: 'rajadaMistica', name: 'Rajada Mística', level: 0, school: 'evocação', fonte: 'srd',
    castTime: 'action', rangeFt: 120, kind: 'raios', raios: 1, raiosPorNivel: true, semEscala: true,
    damage: '1d10', damageType: 'energético',
    desc: 'Um raio de energia crepitante: ataque mágico à distância, 1d10 de energia. Dois raios no 5º nível, três no 11º e quatro no 17º, cada um com o seu ataque.',
  },
  zombariaViciosa: {
    id: 'zombariaViciosa', name: 'Zombaria Viciosa', level: 0, school: 'encantamento', fonte: 'srd',
    castTime: 'action', rangeFt: 60, kind: 'save', save: 'wis', damage: '1d4', damageType: 'psíquico', halfOnSave: false,
    onFail: { condition: 'zombado', rounds: 1 },
    desc: 'Um insulto carregado de magia. CD de SAB ou 1d4 psíquico e desvantagem no próximo ataque dele, até o fim do próximo turno. Cresce no 5º, 11º e 17º nível.',
  },
  produzirChama: {
    id: 'produzirChama', name: 'Produzir Chama', level: 0, school: 'conjuração', fonte: 'srd',
    castTime: 'action', rangeFt: 30, kind: 'attack', damage: '1d8', damageType: 'fogo',
    desc: 'Uma chama acende na mão e é arremessada: ataque mágico à distância, 1d8 de fogo. Cresce no 5º, 11º e 17º nível.',
  },
  chicoteDeEspinhos: {
    id: 'chicoteDeEspinhos', name: 'Chicote de Espinhos', level: 0, school: 'transmutação', fonte: 'srd',
    castTime: 'action', rangeFt: 30, kind: 'attack', melee: true, damage: '1d6', damageType: 'perfurante', puxarFt: 10,
    desc: 'Uma vinha espinhenta: ataque mágico corpo a corpo a até 9 m, 1d6 perfurante, e puxa o alvo Grande ou menor 3 m para perto de você. Cresce no 5º, 11º e 17º nível.',
  },
  shillelagh: {
    id: 'shillelagh', name: 'Shillelagh', level: 0, school: 'transmutação', fonte: 'srd',
    castTime: 'bonus', rangeFt: 0, kind: 'buff', targets: 1, condition: 'shillelagh', rodadasProprias: 10,
    desc: 'Ação bônus. Sua clava ou bordão usa o atributo de conjuração no ataque e no dano, rola 1d8 e conta como arma mágica, por 1 minuto.',
  },
  toqueChocante: {
    id: 'toqueChocante', name: 'Toque Chocante', level: 0, school: 'evocação', fonte: 'srd',
    castTime: 'action', rangeFt: 5, kind: 'attack', melee: true, damage: '1d8', damageType: 'elétrico',
    vantagemContraMetal: true, tiraReacao: true,
    desc: 'Ataque mágico de toque: 1d8 elétrico, com vantagem contra quem veste armadura de metal; o alvo fica sem reação até o próximo turno dele. Cresce no 5º, 11º e 17º nível.',
  },
  respingoAcido: {
    id: 'respingoAcido', name: 'Respingo Ácido', level: 0, school: 'conjuração', fonte: 'srd',
    castTime: 'action', rangeFt: 60, kind: 'save', save: 'dex', damage: '1d6', damageType: 'ácido', halfOnSave: false,
    alvos: 2, juntosFt: 5,
    desc: 'Uma bolha de ácido: uma criatura, ou duas a até 1,5 m uma da outra, fazem CD de DES ou sofrem 1d6 de ácido. Cresce no 5º, 11º e 17º nível.',
  },
  borrifoVenenoso: {
    id: 'borrifoVenenoso', name: 'Borrifo Venenoso', level: 0, school: 'conjuração', fonte: 'srd',
    castTime: 'action', rangeFt: 10, kind: 'save', save: 'con', damage: '1d12', damageType: 'veneno', halfOnSave: false,
    desc: 'Um sopro de gás tóxico a até 3 m. CD de CON ou 1d12 de veneno. Cresce no 5º, 11º e 17º nível.',
  },
  protecaoContraLaminas: {
    id: 'protecaoContraLaminas', name: 'Proteção contra Lâminas', level: 0, school: 'abjuração', fonte: 'srd',
    castTime: 'action', rangeFt: 0, kind: 'buff', targets: 1, condition: 'contraLaminas', rodadasProprias: 2,
    desc: 'Até o fim do seu próximo turno, você resiste a dano cortante, perfurante e de concussão de ataques com arma.',
  },

  ataqueCerteiro: {
    id: 'ataqueCerteiro', name: 'Ataque Certeiro', level: 0, school: 'adivinhação', fonte: 'srd',
    castTime: 'action', rangeFt: 30, kind: 'mira', concentration: true,
    desc: 'Você lê as defesas de uma criatura: seu próximo ataque contra ela, até o fim do seu próximo turno, tem vantagem. Concentração.',
  },

  // ---- 1º círculo de combate dos heróis ---------------------------------------
  borrifoDeCores: {
    id: 'borrifoDeCores', name: 'Borrifo de Cores', level: 1, school: 'ilusão', fonte: 'srd',
    castTime: 'action', rangeFt: 0, shape: 'cone', areaFt: 15,
    kind: 'sleep', cega: true, pool: '6d10', upcast: { reserva: '2d10' },
    desc: 'Um leque de cores num cone de 4,5 m. Rola 6d10: criaturas no cone ficam cegas até o fim do seu próximo turno, em ordem crescente de PV atuais, até esgotar o total. +2d10 por círculo acima do 1º.',
  },
  bruxaria: {
    id: 'bruxaria', name: 'Bruxaria', level: 1, school: 'encantamento', fonte: 'srd',
    castTime: 'bonus', rangeFt: 90, kind: 'marca', condition: 'bruxaria', reuso: 'bonus',
    concentration: true, duracaoRodadas: 100,
    desc: 'Ação bônus. Amaldiçoa uma criatura: cada ataque seu que a acerta causa 1d6 necrótico a mais. Se ela cair, a ação bônus passa a maldição para outra, sem gastar espaço. (No jogo, sem a desvantagem em testes de atributo.) Concentração (no jogo, até 10 minutos).',
  },
  marcaDoCacador: {
    id: 'marcaDoCacador', name: 'Marca do Caçador', level: 1, school: 'adivinhação', fonte: 'srd',
    castTime: 'bonus', rangeFt: 90, kind: 'marca', condition: 'marcaDoCacador', reuso: 'bonus',
    concentration: true, duracaoRodadas: 100,
    desc: 'Ação bônus. Marca a presa: cada ataque com arma seu que a acerta causa 1d6 a mais. Se ela cair, a ação bônus passa a marca para outra, sem gastar espaço. Concentração (no jogo, até 10 minutos).',
  },
  repreensaoInfernal: {
    id: 'repreensaoInfernal', name: 'Repreensão Infernal', level: 1, school: 'evocação', fonte: 'srd',
    castTime: 'reacao', rangeFt: 60, kind: 'reacao', gatilho: 'dano',
    save: 'dex', damage: '2d10', damageType: 'fogo', halfOnSave: true, upcast: { dados: 1 },
    desc: 'Reação, sai sozinha: quando uma criatura a até 18 m que você vê o fere, chamas a envolvem. CD de DES: 2d10 de fogo, metade se passar. +1d10 por círculo acima do 1º.',
  },
  escudoArcano: {
    id: 'escudoArcano', name: 'Escudo Arcano', level: 1, school: 'abjuração', fonte: 'srd',
    castTime: 'reacao', rangeFt: 0, kind: 'reacao', gatilho: 'acerto',
    desc: 'Reação, sai sozinha: quando um ataque ia acertar você e +5 de CA o faria errar, uma barreira surge. +5 de CA até o começo do seu próximo turno, e Míssil Mágico não o fere.',
  },
  bracosDeHadar: {
    id: 'bracosDeHadar', name: 'Braços de Hadar', level: 1, school: 'conjuração', fonte: 'srd',
    castTime: 'action', rangeFt: 0, shape: 'sphere', areaFt: 10, centradoEmSi: true,
    kind: 'save', save: 'str', damage: '2d6', damageType: 'necrótico', halfOnSave: true,
    onFail: { semReacao: true }, upcast: { dados: 1 },
    desc: 'Tentáculos sombrios saem de você, a 3 m. CD de FOR: 2d6 necrótico e sem reação até o próximo turno; metade se passar. Pega aliados também. +1d6 por círculo acima do 1º.',
  },
  armaduraDeAgathys: {
    id: 'armaduraDeAgathys', name: 'Armadura de Agathys', level: 1, school: 'abjuração', fonte: 'srd',
    castTime: 'action', rangeFt: 0, kind: 'tempHp', tempHp: '5', upcast: { fixo: 5 }, condition: 'agathys',
    desc: 'Gelo espectral cobre você: 5 PV temporários; enquanto durarem, quem o acerta corpo a corpo sofre 5 de frio. +5 nos dois por círculo acima do 1º.',
  },
  risoHisterico: {
    id: 'risoHisterico', name: 'Riso Histérico', level: 1, school: 'encantamento', fonte: 'srd',
    castTime: 'action', rangeFt: 30, kind: 'debuff', targets: 1, save: 'wis', condition: 'gargalhando',
    tambem: ['caido'], repete: true, intMinima: 5, concentration: true, duracaoRodadas: 10,
    desc: 'Uma criatura faz CD de SAB ou cai no chão gargalhando, incapacitada. Repete o teste no fim de cada turno dela e quando sofre dano, com vantagem. Inteligência 4 ou menos não é afetada. Concentração, até 1 minuto.',
  },
  sussurrosDissonantes: {
    id: 'sussurrosDissonantes', name: 'Sussurros Dissonantes', level: 1, school: 'encantamento', fonte: 'srd',
    castTime: 'action', rangeFt: 60, kind: 'save', save: 'wis', damage: '3d6', damageType: 'psíquico', halfOnSave: true,
    onFail: { fogeNaReacao: true }, upcast: { dados: 1 },
    desc: 'Uma melodia que só o alvo ouve. CD de SAB: 3d6 psíquico e ele gasta a reação fugindo de você o mais longe que pode; metade e fica se passar. +1d6 por círculo acima do 1º.',
  },
  heroismo: {
    id: 'heroismo', name: 'Heroísmo', level: 1, school: 'encantamento', fonte: 'srd',
    castTime: 'action', rangeFt: 5, kind: 'buff', targets: 1, condition: 'heroico', upcast: { alvos: 1 },
    concentration: true, duracaoRodadas: 10,
    desc: 'Toque num aliado: ele fica imune a medo e, no começo de cada turno dele, ganha PV temporários iguais ao seu modificador de conjuração. Concentração, até 1 minuto. +1 alvo por círculo acima do 1º.',
  },
  fogoDasFadas: {
    id: 'fogoDasFadas', name: 'Fogo das Fadas', level: 1, school: 'evocação', fonte: 'srd',
    castTime: 'action', rangeFt: 60, shape: 'square', areaFt: 20,
    kind: 'save', save: 'dex', onFail: { condition: 'feerico' }, concentration: true, duracaoRodadas: 10,
    desc: 'Luz colorida num cubo de 6 m. Quem falha na CD de DES brilha: ataques contra ele têm vantagem. Concentração, até 1 minuto.',
  },
  emaranhar: {
    id: 'emaranhar', name: 'Emaranhar', level: 1, school: 'conjuração', fonte: 'srd',
    castTime: 'action', rangeFt: 90, shape: 'square', areaFt: 20,
    kind: 'save', save: 'str', onFail: { condition: 'contido' }, zona: { em: 'no', rodadas: 10, quando: 'nunca', aoEntrar: false },
    concentration: true, duracaoRodadas: 10,
    desc: 'Plantas agarram num quadrado de 6 m: terreno difícil. Quem está nele faz CD de FOR ou fica contido; sai gastando a ação num teste de Atletismo. Concentração, até 1 minuto.',
  },
  orbeCromatico: {
    id: 'orbeCromatico', name: 'Orbe Cromático', level: 1, school: 'evocação', fonte: 'srd',
    castTime: 'action', rangeFt: 90, kind: 'attack', damage: '3d8', damageType: 'fogo',
    tiposAEscolher: ['ácido', 'frio', 'fogo', 'elétrico', 'veneno', 'trovejante'], upcast: { dados: 1 },
    desc: 'Uma esfera de energia: ataque mágico à distância, 3d8 do tipo que você escolher (o jogo escolhe o que mais fere o alvo). +1d8 por círculo acima do 1º. (O diamante de 50 po ainda não é cobrado.)',
  },
  comando: {
    id: 'comando', name: 'Comando', level: 1, school: 'encantamento', fonte: 'srd',
    castTime: 'action', rangeFt: 60, kind: 'debuff', targets: 1, save: 'wis', condition: 'comandado',
    duracaoRodadas: 1, naoAfeta: ['morto-vivo'], upcast: { alvos: 1 },
    desc: 'Uma palavra de ordem: "Ajoelhe!". CD de SAB ou ele cai e perde o próximo turno. Morto-vivo não obedece. +1 alvo por círculo acima do 1º.',
  },
  santuario: {
    id: 'santuario', name: 'Santuário', level: 1, school: 'abjuração', fonte: 'srd',
    castTime: 'bonus', rangeFt: 30, kind: 'buff', targets: 1, condition: 'santuario', rodadasProprias: 10,
    desc: 'Ação bônus. Um aliado fica protegido: quem tenta atacá-lo faz CD de SAB ou perde o ataque. Acaba se ele atacar ou conjurar magia contra um inimigo. 1 minuto.',
  },
  escudoDaFe: {
    id: 'escudoDaFe', name: 'Escudo da Fé', level: 1, school: 'abjuração', fonte: 'srd',
    castTime: 'bonus', rangeFt: 60, kind: 'buff', targets: 1, condition: 'escudoDaFe',
    concentration: true, duracaoRodadas: 100,
    desc: 'Ação bônus. Um campo brilhante dá +2 de CA a um aliado. Concentração, até 10 minutos.',
  },
  favorDivino: {
    id: 'favorDivino', name: 'Favor Divino', level: 1, school: 'evocação', fonte: 'srd',
    castTime: 'bonus', rangeFt: 0, kind: 'buff', targets: 1, condition: 'favorDivino',
    concentration: true, duracaoRodadas: 10,
    desc: 'Ação bônus. Seus ataques com arma causam 1d4 radiante a mais. Concentração, até 1 minuto.',
  },
  golpeTrovejante: {
    id: 'golpeTrovejante', name: 'Golpe Trovejante', level: 1, school: 'evocação', fonte: 'srd',
    castTime: 'bonus', rangeFt: 0, kind: 'buff', targets: 1, condition: 'golpeTrovejante',
    concentration: true, duracaoRodadas: 10,
    desc: 'Ação bônus. O próximo acerto corpo a corpo com arma soma 2d6 trovejante, e o alvo faz CD de FOR ou é empurrado 3 m e cai. Concentração.',
  },
  golpeAbrasador: {
    id: 'golpeAbrasador', name: 'Golpe Abrasador', level: 1, school: 'evocação', fonte: 'srd',
    castTime: 'bonus', rangeFt: 0, kind: 'buff', targets: 1, condition: 'golpeAbrasador', upcast: { dados: 1 },
    concentration: true, duracaoRodadas: 10,
    desc: 'Ação bônus. O próximo acerto corpo a corpo com arma soma 1d6 de fogo e o alvo pega fogo: no começo de cada turno dele, CD de CON ou mais 1d6 de fogo; passar apaga. Concentração.',
  },
  golpeColerico: {
    id: 'golpeColerico', name: 'Golpe Colérico', level: 1, school: 'evocação', fonte: 'srd',
    castTime: 'bonus', rangeFt: 0, kind: 'buff', targets: 1, condition: 'golpeColerico',
    concentration: true, duracaoRodadas: 10,
    desc: 'Ação bônus. O próximo acerto corpo a corpo com arma soma 1d6 psíquico, e o alvo faz CD de SAB ou fica amedrontado de você. Concentração.',
  },
  saraivadaDeEspinhos: {
    id: 'saraivadaDeEspinhos', name: 'Saraivada de Espinhos', level: 1, school: 'conjuração', fonte: 'srd',
    castTime: 'bonus', rangeFt: 0, kind: 'buff', targets: 1, condition: 'saraivada', upcast: { dados: 1 },
    concentration: true, duracaoRodadas: 10,
    desc: 'Ação bônus. No próximo acerto à distância com arma, espinhos brotam: o alvo e quem estiver a 1,5 m dele fazem CD de DES, 1d10 perfurante, metade se passar. Concentração.',
  },
  raioDeBruxa: {
    id: 'raioDeBruxa', name: 'Raio de Bruxa', level: 1, school: 'evocação', fonte: 'srd',
    castTime: 'action', rangeFt: 30, kind: 'attack', damage: '1d12', damageType: 'elétrico',
    reuso: 'acao', reusoAuto: '1d12', concentration: true, duracaoRodadas: 10, upcast: { dados: 1 },
    desc: 'Um arco elétrico: ataque mágico à distância, 1d12. Se acertar, nos turnos seguintes a ação dá 1d12 automático no mesmo alvo, sem espaço, enquanto ele estiver a até 9 m. Concentração, até 1 minuto. +1d12 no primeiro raio por círculo acima do 1º.',
  },
  recuoAcelerado: {
    id: 'recuoAcelerado', name: 'Recuo Acelerado', level: 1, school: 'transmutação', fonte: 'srd',
    castTime: 'bonus', rangeFt: 0, kind: 'disparada', reuso: 'bonus', concentration: true, duracaoRodadas: 100,
    desc: 'Ação bônus. Você corre (Disparada) agora e, enquanto se concentrar, de novo com a ação bônus a cada turno, sem gastar espaço.',
  },
  passosLargos: {
    id: 'passosLargos', name: 'Passos Largos', level: 1, school: 'transmutação', fonte: 'srd',
    castTime: 'action', rangeFt: 5, kind: 'buff', targets: 1, condition: 'passosLargos', upcast: { alvos: 1 },
    desc: 'Toque num aliado: +3 m de deslocamento por 1 hora. +1 alvo por círculo acima do 1º.',
  },
  protecaoBemMal: {
    id: 'protecaoBemMal', name: 'Proteção contra o Bem e o Mal', level: 1, school: 'abjuração', fonte: 'srd',
    castTime: 'action', rangeFt: 5, kind: 'buff', targets: 1, condition: 'protegidoBemMal',
    concentration: true, duracaoRodadas: 100,
    desc: 'Toque num aliado: aberrações, celestiais, elementais, fadas, corruptores e mortos-vivos o atacam com desvantagem e não o assustam. Concentração, até 10 minutos.',
  },

  enfeiticarPessoa: {
    id: 'enfeiticarPessoa', name: 'Enfeitiçar Pessoa', level: 1, school: 'encantamento', fonte: 'srd',
    castTime: 'action', rangeFt: 30, kind: 'debuff', targets: 1, save: 'wis', condition: 'enfeiticado',
    soTipo: 'humanoide', vantagemEmCombate: true, upcast: { alvos: 1 },
    desc: 'Um humanoide faz CD de SAB, com vantagem por estar lutando com você, ou fica enfeitiçado: não o ataca. Dano seu ou dos seus aliados desfaz. 1 hora. +1 alvo por círculo acima do 1º.',
  },

  // ---- 2º círculo -------------------------------------------------------------
  //
  // Livro do Jogador (2014). A regra é a do livro; o texto é nosso.
  raioArdente: {
    id: 'raioArdente', name: 'Raio Ardente', level: 2, school: 'evocação', fonte: 'srd',
    castTime: 'action', rangeFt: 120, kind: 'raios', raios: 3,
    damage: '2d6', damageType: 'fogo', upcast: { raios: 1 },
    desc: 'Três raios de fogo, cada um com o seu ataque mágico e 2d6 de fogo; no mesmo alvo ou em alvos diferentes. +1 raio por círculo acima do 2º.',
  },
  despedacar: {
    id: 'despedacar', name: 'Despedaçar', level: 2, school: 'evocação', fonte: 'srd',
    castTime: 'action', rangeFt: 60, shape: 'sphere', areaFt: 10,
    kind: 'save', save: 'con', damage: '3d8', damageType: 'trovejante', halfOnSave: true, upcast: { dados: 1 },
    desc: 'Um estrondo numa esfera de 3 m de raio. CD de CON: 3d8 trovejante, metade se passar. +1d8 por círculo acima do 2º.',
  },
  imobilizarPessoa: {
    id: 'imobilizarPessoa', name: 'Imobilizar Pessoa', level: 2, school: 'encantamento', fonte: 'srd',
    castTime: 'action', rangeFt: 60, kind: 'debuff', targets: 1, upcast: { alvos: 1 },
    save: 'wis', condition: 'paralisado', soTipo: 'humanoide', repete: true,
    concentration: true, duracaoRodadas: 10,
    desc: 'Um humanoide faz CD de SAB ou fica paralisado; repete o teste no fim de cada turno dele. Concentração, até 1 minuto. +1 alvo por círculo acima do 2º.',
  },
  cegueiraSurdez: {
    id: 'cegueiraSurdez', name: 'Cegueira/Surdez', level: 2, school: 'necromancia', fonte: 'srd',
    castTime: 'action', rangeFt: 30, kind: 'debuff', targets: 1, upcast: { alvos: 1 },
    save: 'con', condition: 'cego', repete: true, duracaoRodadas: 10,
    desc: 'Um inimigo faz CD de CON ou fica cego por 1 minuto; repete o teste no fim de cada turno dele. Sem concentração. +1 alvo por círculo acima do 2º.',
  },
  borrao: {
    id: 'borrao', name: 'Borrão', level: 2, school: 'ilusão', fonte: 'srd',
    castTime: 'action', rangeFt: 0, kind: 'buff', targets: 1,
    condition: 'borrado', concentration: true, duracaoRodadas: 10,
    desc: 'Seu corpo borra: ataques contra você têm desvantagem. Concentração, até 1 minuto.',
  },
  ajuda: {
    id: 'ajuda', name: 'Ajuda', level: 2, school: 'abjuração', fonte: 'srd',
    castTime: 'action', rangeFt: 30, kind: 'buff', targets: 3,
    condition: 'ajudado', pvMax: 5, upcast: { fixo: 5 },
    desc: 'Até 3 aliados ganham 5 pontos de vida máximos e atuais, sem concentração. +5 por círculo acima do 2º.',
  },
  restauracaoMenor: {
    id: 'restauracaoMenor', name: 'Restauração Menor', level: 2, school: 'abjuração', fonte: 'srd',
    castTime: 'action', rangeFt: 5, kind: 'restaurar', remove: ['paralisado', 'cego', 'envenenado'],
    desc: 'Toque num aliado: tira a paralisia, a cegueira ou o envenenamento.',
  },
  passoNebuloso: {
    id: 'passoNebuloso', name: 'Passo Nebuloso', level: 2, school: 'conjuração', fonte: 'srd',
    castTime: 'bonus', rangeFt: 30, kind: 'teleporte', mira: 'casa',
    desc: 'Ação bônus. Você some numa névoa prateada e reaparece numa casa livre que vê a até 9 m. Ninguém tem ataque de oportunidade.',
  },
  teia: {
    id: 'teia', name: 'Teia', level: 2, school: 'conjuração', fonte: 'srd',
    castTime: 'action', rangeFt: 60, shape: 'square', areaFt: 20,
    kind: 'save', save: 'dex', onFail: { condition: 'contido' }, zona: { rodadas: 10, quando: 'inicio' },
    concentration: true, duracaoRodadas: 10,
    desc: 'Teias grossas num cubo de 6 m: terreno difícil. Quem está nelas, entra ou começa o turno nelas faz CD de DES ou fica contido; sai com Atletismo. Concentração (no jogo, 1 minuto).',
  },
  armaEspiritual: {
    id: 'armaEspiritual', name: 'Arma Espiritual', level: 2, school: 'evocação', fonte: 'srd',
    castTime: 'bonus', rangeFt: 60, kind: 'arma', melee: true, reuso: 'bonus', alcanceDaArmaFt: 25,
    damage: '1d8', addSpellMod: true, damageType: 'energético', duracaoRodadas: 10, upcast: { dadosACada2: 1 },
    desc: 'Ação bônus. Uma arma espectral surge e golpeia: ataque mágico corpo a corpo, 1d8 + modificador de energia. Por 1 minuto, a cada turno, a ação bônus a move 6 m e golpeia de novo, sem gastar espaço. +1d8 a cada 2 círculos acima do 2º.',
  },

  invisibilidade: {
    id: 'invisibilidade', name: 'Invisibilidade', level: 2, school: 'ilusão', fonte: 'srd',
    castTime: 'action', rangeFt: 5, kind: 'buff', targets: 1, condition: 'invisivel', upcast: { alvos: 1 },
    concentration: true, duracaoRodadas: 100,
    desc: 'Toque: o aliado fica invisível; ataca com vantagem e é atacado com desvantagem. No jogo, acaba quando ele ataca ou conjura contra alguém. Concentração, até 1 hora. +1 alvo por círculo acima do 2º.',
  },
  imagemEspelhada: {
    id: 'imagemEspelhada', name: 'Imagem Espelhada', level: 2, school: 'ilusão', fonte: 'srd',
    castTime: 'action', rangeFt: 0, kind: 'buff', targets: 1, condition: 'imagens', rodadasProprias: 10, imagens: 3,
    desc: 'Três cópias ilusórias o rodeiam. Cada ataque contra você pode ir numa cópia (d20: 6+ com três, 8+ com duas, 11+ com uma); cópia atingida some. 1 minuto, sem concentração.',
  },
  crescimentoDeEspinhos: {
    id: 'crescimentoDeEspinhos', name: 'Crescimento de Espinhos', level: 2, school: 'transmutação', fonte: 'srd',
    castTime: 'action', rangeFt: 150, shape: 'sphere', areaFt: 20, kind: 'save', soZona: true,
    zona: { em: 'no', rodadas: 100, quando: 'nunca', aoEntrar: false, danoPorPasso: '2d4', semTeste: true },
    concentration: true, duracaoRodadas: 100,
    desc: 'Espinhos escondidos numa esfera de 6 m de raio: terreno difícil, e cada 1,5 m andado dentro dela fere 2d4 perfurante. Concentração, até 10 minutos.',
  },
  flechaAcida: {
    id: 'flechaAcida', name: 'Flecha Ácida', level: 2, school: 'evocação', fonte: 'srd',
    castTime: 'action', rangeFt: 90, kind: 'attack', damage: '4d4', damageType: 'ácido', danoAtrasado: '2d4',
    upcast: { dados: 1 },
    desc: 'Ataque mágico à distância: 4d4 de ácido agora e 2d4 no fim do próximo turno do alvo; se errar, metade do primeiro e nada depois. +1d4 nos dois por círculo acima do 2º.',
  },

  peleDeArvore: {
    id: 'peleDeArvore', name: 'Pele de Árvore', level: 2, school: 'transmutação', fonte: 'srd',
    castTime: 'action', rangeFt: 5, kind: 'buff', targets: 1, condition: 'casca', concentration: true, duracaoRodadas: 100,
    desc: 'Toque: a pele do aliado fica dura como casca, e a CA dele nunca fica abaixo de 16. Concentração, até 1 hora.',
  },
  armaMagica: {
    id: 'armaMagica', name: 'Arma Mágica', level: 2, school: 'transmutação', fonte: 'srd',
    castTime: 'bonus', rangeFt: 5, kind: 'buff', targets: 1, condition: 'armaMagica', concentration: true, duracaoRodadas: 100,
    escalaBonus: { 4: 2, 6: 3 },
    desc: 'Ação bônus. A arma de um aliado vira mágica: +1 no ataque e no dano. Concentração, até 1 hora.',
  },
  golpeMarcante: {
    id: 'golpeMarcante', name: 'Golpe Marcante', level: 2, school: 'evocação', fonte: 'srd',
    castTime: 'bonus', rangeFt: 0, kind: 'buff', targets: 1, condition: 'golpeMarcante', concentration: true, duracaoRodadas: 10, upcast: { dados: 1 },
    desc: 'Ação bônus. O próximo acerto com arma, de perto ou à distância, soma 2d6 radiante. Concentração.',
  },
  laminaFlamejante: {
    id: 'laminaFlamejante', name: 'Lâmina Flamejante', level: 2, school: 'evocação', fonte: 'srd',
    castTime: 'bonus', rangeFt: 5, kind: 'lamina', melee: true, reuso: 'acao',
    damage: '3d6', damageType: 'fogo', concentration: true, duracaoRodadas: 100,
    desc: 'Ação bônus. Uma lâmina de fogo na mão; com a ação, ataque mágico corpo a corpo de 3d6 de fogo, quantas vezes quiser enquanto durar, sem gastar espaço. Concentração, até 10 minutos. +1d6 a cada 2 círculos acima do 2º.',
  },
  calorNoMetal: {
    id: 'calorNoMetal', name: 'Calor no Metal', level: 2, school: 'transmutação', fonte: 'srd',
    castTime: 'action', rangeFt: 60, kind: 'calor', reuso: 'bonus',
    damage: '2d8', damageType: 'fogo', concentration: true, duracaoRodadas: 10, upcast: { dados: 1 },
    desc: 'O metal que o alvo veste ou empunha arde: 2d8 de fogo sem teste, e de novo com a ação bônus a cada turno. Quem veste o metal, ou falha na CD de CON, ataca com desvantagem. Concentração, até 1 minuto. +1d8 por círculo acima do 2º.',
  },
  raioDoEnfraquecimento: {
    id: 'raioDoEnfraquecimento', name: 'Raio do Enfraquecimento', level: 2, school: 'necromancia', fonte: 'srd',
    castTime: 'action', rangeFt: 60, kind: 'attack', concentration: true, duracaoRodadas: 10,
    applies: { condition: 'enfraquecido', repete: 'con' },
    desc: 'Um raio negro: ataque mágico à distância. Quem é atingido causa metade do dano com golpes de Força; repete CD de CON no fim de cada turno. Concentração, até 1 minuto.',
  },
  protecaoContraVeneno: {
    id: 'protecaoContraVeneno', name: 'Proteção contra Veneno', level: 2, school: 'abjuração', fonte: 'srd',
    castTime: 'action', rangeFt: 5, kind: 'buff', targets: 1, condition: 'contraVeneno',
    desc: 'Toque: tira o envenenamento e dá resistência a veneno, e imunidade a ficar envenenado, por 1 hora.',
  },
  nuvemDeAdagas: {
    id: 'nuvemDeAdagas', name: 'Nuvem de Adagas', level: 2, school: 'conjuração', fonte: 'srd',
    castTime: 'action', rangeFt: 60, shape: 'square', areaFt: 5, kind: 'save', soZona: true,
    zona: { rodadas: 10, quando: 'inicio', aoEntrar: true, dificil: false, semTeste: true, dano: { dados: '4d4', tipo: 'cortante' } },
    concentration: true, duracaoRodadas: 10, upcast: { dados: 2 },
    desc: 'Adagas girando numa casa. Quem entra nela ou começa o turno nela sofre 4d4 cortante, sem teste. Concentração, até 1 minuto. +2d4 por círculo acima do 2º.',
  },
  raioLunar: {
    id: 'raioLunar', name: 'Raio Lunar', level: 2, school: 'evocação', fonte: 'srd',
    castTime: 'action', rangeFt: 120, shape: 'sphere', areaFt: 5, kind: 'save', soZona: true, reuso: 'acao',
    zona: { em: 'no', rodadas: 10, quando: 'inicio', aoEntrar: true, dificil: false, semTeste: true, movel: 60, dano: { dados: '2d10', tipo: 'radiante', save: 'con', metade: true } },
    concentration: true, duracaoRodadas: 10, upcast: { dados: 1 },
    desc: 'Um feixe de luz pálida (3×3 casas). Quem entra nele ou começa o turno nele faz CD de CON: 2d10 radiante, metade se passar. Com a ação, o feixe anda até 18 m. Concentração, até 1 minuto. +1d10 por círculo acima do 2º.',
  },
  esferaFlamejante: {
    id: 'esferaFlamejante', name: 'Esfera Flamejante', level: 2, school: 'conjuração', fonte: 'srd',
    castTime: 'action', rangeFt: 60, shape: 'sphere', areaFt: 5, kind: 'save', soZona: true, reuso: 'bonus',
    zona: { rodadas: 10, quando: 'fimDono', aoEntrar: false, dificil: false, semTeste: true, movel: 30, ocupaCasa: true, dano: { dados: '2d6', tipo: 'fogo', save: 'dex', metade: true } },
    concentration: true, duracaoRodadas: 10, upcast: { dados: 1 },
    desc: 'Uma esfera de fogo numa casa vazia. No fim do seu turno, quem está a 1,5 m dela (você também) faz CD de DES: 2d6 de fogo, metade se passar. Com a ação bônus, ela rola até 9 m (no jogo, sem a investida). Concentração, até 1 minuto. +1d6 por círculo acima do 2º.',
  },

  // ---- 3º círculo -------------------------------------------------------------
  velocidade: {
    id: 'velocidade', name: 'Velocidade', level: 3, school: 'transmutação', fonte: 'srd',
    castTime: 'action', rangeFt: 30, kind: 'buff', targets: 1, condition: 'acelerado',
    concentration: true, duracaoRodadas: 10,
    desc: 'Um aliado fica acelerado: +2 de CA, dobro do deslocamento, vantagem em resistências de DES e uma ação a mais por turno (um golpe, Disparada, Desengajar ou usar um objeto). Quando acaba, ele perde o próximo turno. Concentração, até 1 minuto.',
  },
  nuvemFetida: {
    id: 'nuvemFetida', name: 'Nuvem Fétida', level: 3, school: 'conjuração', fonte: 'srd',
    castTime: 'action', rangeFt: 90, shape: 'sphere', areaFt: 20, kind: 'save', soZona: true, save: 'con',
    onFail: { condition: 'nauseado', rounds: 1 }, zona: { rodadas: 10, quando: 'inicio', aoEntrar: false, imuneSe: 'veneno' },
    concentration: true, duracaoRodadas: 10,
    desc: 'Gás amarelo numa esfera de 6 m de raio. Quem começa o turno nela faz CD de CON ou passa o turno engasgado, sem ação. Imune a veneno passa direto. Concentração, até 1 minuto.',
  },
  rogarMaldicao: {
    id: 'rogarMaldicao', name: 'Rogar Maldição', level: 3, school: 'necromancia', fonte: 'srd',
    castTime: 'action', rangeFt: 5, kind: 'debuff', targets: 1, save: 'wis', condition: 'rogado',
    concentration: true, duracaoRodadas: 10,
    desc: 'Toque: CD de SAB ou fica amaldiçoado, e cada ataque seu que o acerta causa 1d8 necrótico a mais. (O livro dá quatro maldições à escolha; o jogo usa esta.) Concentração, até 1 minuto.',
  },
  protecaoContraEnergia: {
    id: 'protecaoContraEnergia', name: 'Proteção contra Energia', level: 3, school: 'abjuração', fonte: 'srd',
    castTime: 'action', rangeFt: 5, kind: 'buff', targets: 1, condition: 'protegidoEnergia', escolheTipo: 'defesa',
    concentration: true, duracaoRodadas: 100,
    desc: 'Toque: resistência a um tipo de energia (ácido, frio, fogo, elétrico ou trovejante). O jogo escolhe o que os inimigos à vista mais causam. Concentração, até 1 hora.',
  },
  tempestadeDeGranizo: {
    id: 'tempestadeDeGranizo', name: 'Tempestade de Granizo', level: 3, school: 'conjuração', fonte: 'srd',
    castTime: 'action', rangeFt: 150, shape: 'sphere', areaFt: 40, kind: 'save', soZona: true, save: 'dex',
    onFail: { condition: 'caido' }, zona: { rodadas: 10, quando: 'inicio', aoEntrar: true },
    concentration: true, duracaoRodadas: 10,
    desc: 'Granizo e gelo num círculo de 12 m de raio: terreno difícil. Quem entra ou começa o turno nele faz CD de DES ou cai. (No jogo, sem a escuridão nem o teste de concentração de quem está dentro.) Concentração, até 1 minuto.',
  },
  golpeCegante: {
    id: 'golpeCegante', name: 'Golpe Cegante', level: 3, school: 'evocação', fonte: 'srd',
    castTime: 'bonus', rangeFt: 0, kind: 'buff', targets: 1, condition: 'golpeCegante', concentration: true, duracaoRodadas: 10,
    desc: 'Ação bônus. O próximo acerto corpo a corpo com arma soma 3d8 radiante, e o alvo faz CD de CON ou fica cego (repete no fim de cada turno). Concentração.',
  },
  mantoDoCruzado: {
    id: 'mantoDoCruzado', name: 'Manto do Cruzado', level: 3, school: 'evocação', fonte: 'srd',
    castTime: 'action', rangeFt: 0, kind: 'aura', tipoAura: 'manto', raioFt: 30, concentration: true, duracaoRodadas: 10,
    desc: 'Um poder sagrado irradia de você a 9 m: os ataques com arma seus e dos aliados na aura causam 1d4 radiante a mais. Concentração, até 1 minuto.',
  },
  armaElemental: {
    id: 'armaElemental', name: 'Arma Elemental', level: 3, school: 'transmutação', fonte: 'srd',
    castTime: 'action', rangeFt: 5, kind: 'buff', targets: 1, condition: 'armaElemental', escolheTipo: 'ataque',
    escalaBonus: { 5: 2, 7: 3 },
    concentration: true, duracaoRodadas: 100,
    desc: 'A arma de um aliado ganha um elemento: +1 no ataque e +1d4 do tipo no dano. O jogo escolhe o tipo que os inimigos à vista menos resistem. Concentração, até 1 hora.',
  },
  conjurarSaraivada: {
    id: 'conjurarSaraivada', name: 'Conjurar Saraivada', level: 3, school: 'conjuração', fonte: 'srd',
    castTime: 'action', rangeFt: 0, shape: 'cone', areaFt: 60, kind: 'save', save: 'dex',
    damage: '3d8', damageType: 'perfurante', halfOnSave: true,
    desc: 'Você atira uma munição e ela vira centenas, num cone de 18 m. CD de DES: 3d8 perfurante, metade se passar.',
  },
  auraDeVitalidade: {
    id: 'auraDeVitalidade', name: 'Aura de Vitalidade', level: 3, school: 'evocação', fonte: 'srd',
    castTime: 'action', rangeFt: 0, kind: 'curaReuso', reuso: 'bonus', raioFt: 30, heal: '2d6',
    concentration: true, duracaoRodadas: 10,
    desc: 'Uma aura de cura a 9 m de você. Enquanto durar, a ação bônus cura 2d6 de um aliado na aura (você também), sem gastar espaço. Concentração, até 1 minuto.',
  },
  farolDeEsperanca: {
    id: 'farolDeEsperanca', name: 'Farol de Esperança', level: 3, school: 'abjuração', fonte: 'srd',
    castTime: 'action', rangeFt: 30, kind: 'buff', targets: 12, condition: 'esperanca',
    concentration: true, duracaoRodadas: 10,
    desc: 'Os aliados a até 9 m ganham vantagem em resistências de SAB e testes de morte, e toda cura que recebem sai no máximo. Concentração, até 1 minuto.',
  },

  bolaDeFogo: {
    id: 'bolaDeFogo', name: 'Bola de Fogo', level: 3, school: 'evocação', fonte: 'srd',
    castTime: 'action', rangeFt: 150, shape: 'sphere', areaFt: 20, contornaEsquinas: true,
    kind: 'save', save: 'dex', damage: '8d6', damageType: 'fogo', halfOnSave: true, upcast: { dados: 1 },
    desc: 'Uma conta de fogo voa e explode numa esfera de 6 m de raio. CD de DES: 8d6 de fogo, metade se passar. +1d6 por círculo acima do 3º.',
  },
  relampago: {
    id: 'relampago', name: 'Relâmpago', level: 3, school: 'evocação', fonte: 'srd',
    castTime: 'action', rangeFt: 0, shape: 'linha', areaFt: 100,
    kind: 'save', save: 'dex', damage: '8d6', damageType: 'elétrico', halfOnSave: true, upcast: { dados: 1 },
    desc: 'Uma linha de 30 m saindo de você. CD de DES: 8d6 elétrico, metade se passar. +1d6 por círculo acima do 3º.',
  },
  palavraCurativaEmMassa: {
    id: 'palavraCurativaEmMassa', name: 'Palavra Curativa em Massa', level: 3, school: 'evocação', fonte: 'srd',
    castTime: 'bonus', rangeFt: 60, kind: 'healGrupo', targets: 6, heal: '1d4', addSpellMod: true, upcast: { dados: 1 },
    desc: 'Ação bônus. Até 6 aliados que você vê recuperam 1d4 + modificador de conjuração. +1d4 por círculo acima do 3º.',
  },
  espiritosGuardioes: {
    id: 'espiritosGuardioes', name: 'Espíritos Guardiões', level: 3, school: 'conjuração', fonte: 'srd',
    castTime: 'action', rangeFt: 0, kind: 'aura', raioFt: 15,
    save: 'wis', damage: '3d8', damageType: 'radiante', halfOnSave: true, upcast: { dados: 1 },
    concentration: true, duracaoRodadas: 100,
    desc: 'Espíritos rodeiam você a 4,5 m. Inimigo que entra na área ou começa o turno nela faz CD de SAB: 3d8 radiante, metade se passar; e anda pela metade dentro dela. Concentração, até 10 minutos. +1d8 por círculo acima do 3º.',
  },
  revivificar: {
    id: 'revivificar', name: 'Revivificar', level: 3, school: 'necromancia', fonte: 'srd',
    castTime: 'action', rangeFt: 5, kind: 'reviver', janelaRodadas: 10,
    desc: 'Toque em quem morreu há no máximo 1 minuto: volta com 1 PV. (O diamante de 300 po que o livro pede ainda não é cobrado.)',
  },
  lentidao: {
    id: 'lentidao', name: 'Lentidão', level: 3, school: 'transmutação', fonte: 'srd',
    castTime: 'action', rangeFt: 120, kind: 'debuff', targets: 6, cuboFt: 40,
    save: 'wis', condition: 'lentificado', repete: true,
    concentration: true, duracaoRodadas: 10,
    desc: 'Até 6 inimigos num cubo de 12 m fazem CD de SAB ou ficam lentos: −2 na CA e na DES, metade do deslocamento, sem reações, um ataque só e ação ou ação bônus. Repetem o teste no fim de cada turno. (No jogo, sem a chance de a magia do lento falhar.) Concentração, até 1 minuto.',
  },
  medo: {
    id: 'medo', name: 'Medo', level: 3, school: 'ilusão', fonte: 'srd',
    castTime: 'action', rangeFt: 0, shape: 'cone', areaFt: 30,
    kind: 'save', save: 'wis', onFail: { condition: 'amedrontado', repete: 'semVisao', foge: true },
    concentration: true, duracaoRodadas: 10,
    desc: 'Cone de 9 m. CD de SAB ou fica amedrontado e foge correndo de você; só repete o teste quando termina o turno sem ver você. Concentração, até 1 minuto.',
  },
  padraoHipnotico: {
    id: 'padraoHipnotico', name: 'Padrão Hipnótico', level: 3, school: 'ilusão', fonte: 'srd',
    castTime: 'action', rangeFt: 120, shape: 'square', areaFt: 30,
    kind: 'save', save: 'wis', onFail: { condition: 'hipnotizado' },
    concentration: true, duracaoRodadas: 10,
    desc: 'Cores num cubo de 9 m. Quem está nele (aliado também) faz CD de SAB ou fica hipnotizado: parado e incapacitado até sofrer dano. Concentração, até 1 minuto.',
  },
  toqueVampirico: {
    id: 'toqueVampirico', name: 'Toque Vampírico', level: 3, school: 'necromancia', fonte: 'srd',
    castTime: 'action', rangeFt: 5, kind: 'vampirico', melee: true, reuso: 'acao',
    damage: '3d6', damageType: 'necrótico', upcast: { dados: 1 },
    concentration: true, duracaoRodadas: 10,
    desc: 'Ataque mágico de toque: 3d6 necrótico, e você recupera metade do dano. Enquanto se concentrar (até 1 minuto), repete o toque com a ação, sem gastar espaço. +1d6 por círculo acima do 3º.',
  },
};

export const getSpell = (id) => {
  const s = SPELLS[id];
  if (!s) throw new Error(`Magia desconhecida: "${id}"`);
  return s;
};

/**
 * Tudo o que o personagem pode conjurar agora: truques, preparadas e as
 * sempre preparadas (domínio, juramento, círculo), sem repetir.
 */
export function magiasProntas(actor) {
  const sc = actor.spellcasting;
  if (!sc) return [];
  return [...new Set([...(sc.cantrips ?? []), ...(sc.prepared ?? []), ...(sc.sempreProntas ?? [])])]
    .filter((id) => SPELLS[id]);
}

/** Soma `extra` dados a uma notação "NdM+K": ('3d6', 2) → '5d6'. */
function maisDados(notacao, extra) {
  if (!extra) return notacao;
  return notacao.replace(/^(\d+)d(\d+)/, (_, n, m) => `${Number(n) + extra}d${m}`);
}

/**
 * O dano (ou a cura) que a magia rola de fato.
 *
 * Truque cresce com o nível do PERSONAGEM: um dado a mais no 5º, no 11º e no
 * 17º. Magia de círculo cresce com o ESPAÇO gasto (`upcast.dados`).
 */
export function dadosDaMagia(spell, { nivel = 1, circulo = spell.level, notacao = spell.damage } = {}) {
  if (!notacao) return notacao;
  if (spell.level === 0 && spell.semEscala) return notacao;
  if (spell.level === 0) {
    const extra = (nivel >= 5) + (nivel >= 11) + (nivel >= 17);
    return maisDados(notacao, extra);
  }
  return maisDados(notacao, (spell.upcast?.dados ?? 0) * Math.max(0, circulo - spell.level));
}

// Os espaços de magia por nível moram em `progressao.js` (`espacosDeMagia`),
// do 1º ao 20º, para conjurador pleno, meio conjurador e pacto.
