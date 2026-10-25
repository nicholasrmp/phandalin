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
//   dissipar   acaba com magias de círculo igual ou menor numa criatura ou zona
//   ampliar    Aumentar/Reduzir: aliado cresce, inimigo (se falha em CON) encolhe
//   acalmar    Acalmar Emoções: tira medo e encanto, ou deixa o inimigo indiferente
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
// `sustenta`: a concentração segue de pé mesmo sem ninguém preso (Lufada de
// Vento, Convocar Relâmpagos): o efeito vem de novo com `reuso`.
// `empurraAoLongo`: o empurrão segue a direção da linha, não "para longe de você".
// `larguraFt`: a linha tem essa largura (10 pés = 2 casas).
// `zona.obscuro`: 'pesada' (névoa: ninguém vê dentro nem através) ou 'magica'
// (escuridão: nem a visão no escuro enxerga dentro).
// `zona.fimDano`: dano no fim do turno de quem está na zona (Fome de Hadar).
//
// `umaPorVez`: conjurar de novo em outra criatura tira o efeito da anterior (Luz).
// `naoEmSi`: o alvo tem de ser outra criatura (Elo de Proteção).
// `ambosLados`: serve em aliado e em inimigo; o motor escolhe pelo lado (Aumentar/Reduzir).
// `mantem`: depois de conjurada, a ação do conjurador a MANTÉM a cada turno; sem
// ela, a magia acaba no fim do turno (Coroa da Loucura).
// `foraDeCombate`: leva 10 minutos; o motor de combate recusa (Oração de Cura) e
// `rules/descanso.js` a conjura no descanso.
// `ritual`: o livro permite conjurar como ritual; o jogo só registra a marca.
// `zona.silencio`: ninguém na zona conjura nem sofre dano trovejante.
// `zona.barraProjetil`: ataque à distância com arma que cruza a zona erra (Muralha de Vento).
// `shape: 'muralha'`: linha reta de `areaFt` pés, centrada no ponto e de través
// para o conjurador (a diagonal faz degraus, para ninguém passar pela fresta).
//
// `zona.ilusao`: a zona é a imagem de um objeto (Ilusão Menor): tira a visão do outro lado.
// `zona.luz`: fonte de luz num ponto, `{claro, penumbra}` em pés (Luz do Dia).
// `zona.dificil4`: terreno que custa 4x (Crescer Plantas); `soVegetal` e `poupaAliados`
// recortam a área (só chão natural; sem as casas dos aliados).
// `escolheAtributo`: o jogador (ou o jogo) escolhe o atributo (Aprimorar Atributo).
//
// `fonte`: 'srd' é magia do SRD 5.1; 'propria' é conteúdo do projeto, com
// texto e números nossos.
//
// `upcast`: o que a magia ganha por círculo acima do dela, quando conjurada
// com espaço maior — `dados` (um dado a mais do mesmo tipo), `dardos`,
// `alvos`, `reserva` (dados a mais na reserva do Sono), `fixo` (soma fixa)
// ou `areaFt` (raio maior, em pés).
//
// `applies.conta` diz de quem é o turno que conta a duração: 'conjurador'
// para os efeitos que duram "até o fim (ou o começo) do seu próximo turno".

/**
 * Conjurar Animais: os quatro pacotes do livro (número × ND). `defId` é a ficha de
 * `monsters/feras.js` que serve de corpo; onde o jogo não tem a fera do ND pedido,
 * entra a mais próxima (declarado na `desc` da magia).
 */
export const PACOTES_DE_ANIMAIS = {
  nd2: { n: 1, defId: 'tigreDenteDeSabre', rotulo: '1 fera de ND 2', detalhe: 'um tigre-dente-de-sabre (52 PV, garras e mordida)' },
  nd2b: { n: 1, defId: 'javaliGigante', rotulo: '1 fera de ND 2 (javali)', detalhe: 'um javali gigante (42 PV, investida que derruba)' },
  nd1: { n: 2, defId: 'loboAtroz', rotulo: '2 feras de ND 1', detalhe: 'dois lobos atrozes' },
  nd12: { n: 4, defId: 'ursoNegro', rotulo: '4 feras de ND 1/2', detalhe: 'quatro ursos-negros' },
  nd12b: { n: 4, defId: 'cabraGigante', rotulo: '4 feras de ND 1/2 (cabras)', detalhe: 'quatro cabras gigantes (investida que derruba)' },
  nd14: { n: 8, defId: 'lobo', rotulo: '8 feras de ND 1/4', detalhe: 'oito lobos' },
};

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
    kind: 'save', save: 'dex', onFail: { condition: 'caido' }, zona: { noChao: true, rodadas: 10 },
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
    castTime: 'action', rangeFt: 30, kind: 'mira', concentration: true, semVerbal: true,
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
    desc: 'Um humanoide faz CD de SAB, com vantagem por estar lutando com você, ou fica enfeitiçado: não o ataca. Dano seu ou dos seus aliados desfaz. 1 hora. +1 alvo por círculo acima do 1º. (Fora do combate: se ele resiste, nada fica; quando a magia acaba, ele sabe que foi enfeitiçado e, como regra da casa, passa a ter desvantagem nos testes de Carisma com você.)',
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
    zona: { noChao: true, em: 'no', rodadas: 100, quando: 'nunca', aoEntrar: false, danoPorPasso: '2d4', semTeste: true },
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

  // ---- lote de escuridão, vento e raio ------------------------------------------

  dueloCompelido: {
    id: 'dueloCompelido', name: 'Duelo Compelido', level: 1, school: 'encantamento', fonte: 'propria',
    castTime: 'bonus', rangeFt: 30, kind: 'debuff', targets: 1, save: 'wis', condition: 'duelo',
    concentration: true, duracaoRodadas: 10,
    desc: 'Ação bônus. Uma criatura faz CD de SAB ou só pensa em duelar com você: ataca qualquer outro com desvantagem e não se afasta mais de 9 m de você (no jogo, ela simplesmente não sai do raio, sem teste para tentar). Acaba se você atacar ou ferir outro, se um aliado seu ferir o alvo, ou se você terminar o turno a mais de 9 m dele. Concentração, até 1 minuto.',
  },
  golpeConstritor: {
    id: 'golpeConstritor', name: 'Golpe Constritor', level: 1, school: 'conjuração', fonte: 'propria',
    castTime: 'bonus', rangeFt: 0, kind: 'buff', targets: 1, condition: 'golpeConstritor', upcast: { dados: 1 },
    concentration: true, duracaoRodadas: 10,
    desc: 'Ação bônus. O próximo acerto com arma, de perto ou à distância, faz brotar vinhas: o alvo faz CD de FOR (vantagem se for Grande ou maior) ou fica contido. No começo de cada turno dele, as vinhas ferem 1d6 perfurante; ele se solta gastando a ação num teste de Atletismo. Concentração, até 1 minuto. +1d6 por círculo acima do 1º.',
  },
  nevoaObscurecente: {
    id: 'nevoaObscurecente', name: 'Névoa Obscurecente', level: 1, school: 'conjuração', fonte: 'srd',
    castTime: 'action', rangeFt: 120, shape: 'sphere', areaFt: 20, kind: 'save', soZona: true,
    zona: { rodadas: 600, quando: 'nunca', aoEntrar: false, dificil: false, semTeste: true, obscuro: 'pesada' },
    concentration: true, duracaoRodadas: 600, upcast: { areaFt: 20 },
    desc: 'Uma névoa espessa numa esfera de 6 m de raio. Ninguém vê através dela nem dentro dela: quem ataca ou é atacado às cegas segue as regras de visão (desvantagem para quem não vê, vantagem contra quem não é visto, e as duas se anulam). Não atrapalha o andar. (No jogo, o vento não a dispersa, e a magia ainda pede só linha reta, não visão.) Concentração, até 1 hora. +6 m de raio por círculo acima do 1º.',
  },
  escuridao: {
    id: 'escuridao', name: 'Escuridão', level: 2, school: 'evocação', fonte: 'srd',
    castTime: 'action', rangeFt: 60, shape: 'sphere', areaFt: 15, kind: 'save', soZona: true, contornaEsquinas: true,
    zona: { rodadas: 100, quando: 'nunca', aoEntrar: false, dificil: false, semTeste: true, obscuro: 'magica' },
    concentration: true, duracaoRodadas: 100,
    desc: 'Escuridão mágica numa esfera de 4,5 m de raio. Nenhuma luz a ilumina e nem a visão no escuro enxerga dentro dela: quem está lá é visto como no breu total. Quem está dentro enxerga o que está iluminado fora. (No jogo, ela não é cortada por objeto que a cubra nem se apaga por luz de magia de círculo 2 ou menor; a Luz do Dia, de 3º, a dissipa — mas uma Escuridão lançada depois dela vence na sobreposição.) Concentração, até 10 minutos.',
  },
  lufadaDeVento: {
    id: 'lufadaDeVento', name: 'Lufada de Vento', level: 2, school: 'evocação', fonte: 'srd',
    castTime: 'action', rangeFt: 0, shape: 'linha', areaFt: 60, larguraFt: 10, kind: 'save', save: 'str',
    pushFt: 15, empurraAoLongo: true, sustenta: true, reuso: 'bonus',
    concentration: true, duracaoRodadas: 10,
    desc: 'Uma ventania de 18 m por 3 m sai de você. Quem está nela faz CD de FOR ou é empurrado 4,5 m ao longo da linha. Enquanto você se concentrar (até 1 minuto), a ação bônus muda a direção. (Regra da casa: no jogo o vento empurra ao conjurar e de novo a cada ação bônus que você gastar nela — o livro empurra só quem começa o turno na linha. Só o empurrão: sem terreno difícil contra o vento, sem apagar chama nem dispersar gás.)',
  },
  fomeDeHadar: {
    id: 'fomeDeHadar', name: 'Fome de Hadar', level: 3, school: 'conjuração', fonte: 'propria',
    castTime: 'action', rangeFt: 150, shape: 'sphere', areaFt: 20, kind: 'save', soZona: true, save: 'dex',
    zona: {
      rodadas: 10, quando: 'inicio', aoEntrar: false, dificil: true, semTeste: true, obscuro: 'magica',
      dano: { dados: '2d6', tipo: 'frio' },
      fimDano: { dados: '2d6', tipo: 'ácido', save: 'dex' },
    },
    concentration: true, duracaoRodadas: 10,
    desc: 'Um vazio de escuridão e frio numa esfera de 6 m de raio, terreno difícil. Quem começa o turno nela sofre 2d6 de frio; quem termina o turno nela faz CD de DES ou sofre 2d6 de ácido. Vale para todos, aliados também. A escuridão é mágica: a visão no escuro não a vê. Concentração, até 1 minuto.',
  },
  convocarRelampagos: {
    id: 'convocarRelampagos', name: 'Convocar Relâmpagos', level: 3, school: 'conjuração', fonte: 'srd',
    castTime: 'action', rangeFt: 120, shape: 'sphere', areaFt: 5, kind: 'save', save: 'dex',
    damage: '3d10', damageType: 'elétrico', halfOnSave: true, upcast: { dados: 1 },
    sustenta: true, reuso: 'acao', concentration: true, duracaoRodadas: 100,
    desc: 'Uma nuvem de tempestade se forma e um raio cai num ponto que você vê a até 36 m: raio de 1,5 m, CD de DES, 3d10 elétrico, metade se passar. A cada turno seguinte, a ação deixa cair outro raio, sem gastar espaço. Concentração, até 10 minutos. +1d10 por círculo acima do 3º. (No jogo, vale também em lugar fechado, e não há o bônus de dano da tempestade ao ar livre; o livro pede céu aberto.)',
  },
  flechaRelampago: {
    id: 'flechaRelampago', name: 'Flecha Relampejante', level: 3, school: 'transmutação', fonte: 'propria',
    castTime: 'bonus', rangeFt: 0, kind: 'buff', targets: 1, condition: 'flechaRelampago', upcast: { dados: 1 },
    concentration: true, duracaoRodadas: 10,
    desc: 'Ação bônus. O próximo ataque à distância com arma vira um raio: 4d8 elétrico no alvo no lugar do dano da arma (metade se errar). Acertando ou não, quem está a até 3 m do alvo faz CD de DES ou sofre 2d8 elétrico, metade se passar (o alvo já levou o seu e não entra nessa explosão). Concentração, até 1 minuto. +1d8 em cada dano por círculo acima do 3º.',
  },
  dissiparMagia: {
    id: 'dissiparMagia', name: 'Dissipar Magia', level: 3, school: 'abjuração', fonte: 'srd',
    castTime: 'action', rangeFt: 120, kind: 'dissipar',
    desc: 'Mire uma criatura ou uma zona (clique numa casa dela): toda magia de círculo igual ou menor ao do espaço gasto acaba na hora. Magia de círculo maior pede um teste de atributo seu (d20 + modificador de conjuração contra 10 + círculo da magia). Numa zona, ela se desfaz e solta quem estava preso a ela. (No jogo, não alcança Espíritos Guardiões e outras auras que andam com o conjurador, nem objetos.)',
  },

  // ---- lote 10: luz, silêncio, tamanho, elo, loucura, calma, cura em grupo, vento ----

  luz: {
    id: 'luz', name: 'Luz', level: 0, school: 'evocação', fonte: 'srd',
    castTime: 'action', rangeFt: 5, kind: 'buff', targets: 1, condition: 'luzMagica', umaPorVez: true,
    desc: 'Toque num aliado (ou em si): ele passa a brilhar como uma tocha, com luz clara num raio de 6 m e penumbra por mais 6 m, por 1 hora. Conjurar de novo em outro passa a luz para ele. (No jogo, só em aliado ou em si; o livro também deixa mirar um inimigo, que resiste com DES.)',
  },
  orientacao: {
    id: 'orientacao', name: 'Orientação', level: 0, school: 'adivinhação', fonte: 'srd',
    castTime: 'action', rangeFt: 5, kind: 'buff', targets: 1, condition: 'orientado',
    concentration: true, duracaoRodadas: 10,
    desc: 'Toque num aliado: no próximo teste de atributo que ele fizer, soma 1d4, e a magia acaba. Concentração, até 1 minuto. (No jogo, vale nos testes que o combate rola: escapar de agarrão, teia ou vinhas, estabilizar um moribundo e dissipar magia; fora do combate, o dado também soma no próximo teste de perícia, e a magia acaba.)',
  },
  silencio: {
    id: 'silencio', name: 'Silêncio', level: 2, school: 'ilusão', fonte: 'srd', ritual: true,
    castTime: 'action', rangeFt: 120, shape: 'sphere', areaFt: 20, kind: 'save', soZona: true,
    zona: { rodadas: 100, quando: 'nunca', aoEntrar: false, dificil: false, semTeste: true, silencio: true },
    concentration: true, duracaoRodadas: 100,
    desc: 'Uma esfera de 6 m de raio onde não passa som. Quem está dentro não conjura magia e é imune a dano trovejante (aliado também). Concentração, até 10 minutos. (Simplificação: o livro barra só as magias com componente verbal; no jogo a zona barra toda conjuração, e o ritual de 10 minutos não é usado.)',
  },
  aumentarReduzir: {
    id: 'aumentarReduzir', name: 'Aumentar/Reduzir', level: 2, school: 'transmutação', fonte: 'srd',
    castTime: 'action', rangeFt: 30, kind: 'ampliar', ambosLados: true, save: 'con',
    concentration: true, duracaoRodadas: 10,
    desc: 'Uma criatura a até 9 m. Aliado: AUMENTA, com +1d4 de dano em cada acerto com arma e vantagem em testes e resistências de Força. Inimigo: faz CD de CON; se falha, ENCOLHE, com −1d4 de dano de arma (nunca abaixo de 1) e desvantagem nos mesmos testes de Força. O jogo escolhe pelo lado do alvo. Concentração, até 1 minuto. (O tamanho muda só na história: o alvo não ocupa mais nem menos casas. O pozinho de ferro pedido pelo livro não é cobrado.)',
  },
  eloDeProtecao: {
    id: 'eloDeProtecao', name: 'Elo de Proteção', level: 2, school: 'abjuração', fonte: 'srd',
    castTime: 'action', rangeFt: 5, kind: 'buff', targets: 1, condition: 'eloDeProtecao', naoEmSi: true,
    desc: 'Toque num aliado (não em você): por 1 hora ele ganha +1 de CA e nas resistências e resistência a todo dano, e você sofre o mesmo dano que ele sofrer, já depois da resistência dele (o dano que chega a você ainda passa pela SUA própria resistência, se tiver). Acaba se você cair a 0 PV ou se os dois ficarem a mais de 18 m um do outro. Sem concentração. (Os dois anéis de platina de 50 po cada, pedidos pelo livro, não são cobrados.)',
  },
  coroaDaLoucura: {
    id: 'coroaDaLoucura', name: 'Coroa da Loucura', level: 2, school: 'encantamento', fonte: 'srd',
    castTime: 'action', rangeFt: 120, kind: 'debuff', targets: 1, save: 'wis', condition: 'coroaDaLoucura',
    soTipo: 'humanoide', repete: true, mantem: true, reuso: 'acao', concentration: true, duracaoRodadas: 10,
    desc: 'Um humanoide a até 36 m faz CD de SAB ou fica enfeitiçado: no turno dele, antes de se mover, ele gasta a ação num ataque corpo a corpo contra o aliado mais próximo dele (se não houver nenhum, age normal). Ele repete a resistência no fim de cada turno. Você precisa gastar a sua ação, em cada turno seu, para manter a coroa (clique no alvo de novo, sem gastar espaço); sem a ação, a magia acaba. Concentração, até 1 minuto. (No jogo, quem escolhe a vítima é a IA: sempre o aliado mais perto do enfeitiçado.)',
  },
  acalmarEmocoes: {
    id: 'acalmarEmocoes', name: 'Acalmar Emoções', level: 2, school: 'encantamento', fonte: 'srd',
    castTime: 'action', rangeFt: 60, shape: 'sphere', areaFt: 20, kind: 'acalmar', save: 'cha',
    concentration: true, duracaoRodadas: 10,
    desc: 'Uma esfera de 6 m de raio. Cada humanoide dentro faz CD de CAR (aliado aceita sem testar). Quem falha fica calmo por 1 minuto: se estava com medo ou enfeitiçado, isso acaba e ele fica imune a ambos; se não estava, fica indiferente e não ataca ninguém até ser ferido (ou um amigo dele que ele vê) ou até alguém atacar ou mirar uma magia hostil nele ou nesse amigo. (Ver o amigo ferido, sem ataque nem magia, não acorda.) Concentração, até 1 minuto. (O jogo escolhe sozinho entre os dois efeitos, como descrito. O livro só suprime o medo e o encanto; aqui eles acabam de vez. Aliado calmo só perde medo e encanto, nunca fica indiferente.)',
  },
  oracaoDeCura: {
    id: 'oracaoDeCura', name: 'Oração de Cura', level: 2, school: 'evocação', fonte: 'srd',
    castTime: 'minutos', rangeFt: 30, kind: 'healGrupo', targets: 6, heal: '2d8', addSpellMod: true, upcast: { dados: 1 },
    foraDeCombate: true,
    desc: 'Leva 10 minutos: até 6 criaturas a até 9 m recuperam 2d8 + o modificador de conjuração. +1d8 por círculo acima do 2º. Só fora de combate, no descanso; durante a luta, o jogo recusa.',
  },
  muralhaDeVento: {
    id: 'muralhaDeVento', name: 'Muralha de Vento', level: 3, school: 'evocação', fonte: 'srd',
    castTime: 'action', rangeFt: 120, shape: 'muralha', areaFt: 50, kind: 'save', save: 'str',
    damage: '3d8', damageType: 'contundente', halfOnSave: true,
    zona: { rodadas: 10, quando: 'nunca', aoEntrar: false, dificil: false, semTeste: true, barraProjetil: true },
    concentration: true, duracaoRodadas: 10,
    desc: 'Uma muralha de vento forte, em linha reta de 15 m (10 casas; na diagonal a linha tem mais casas), centrada no ponto que você mira e de través para você. Ao surgir, quem está nela faz CD de FOR ou sofre 3d8 contundente, metade se passar. Enquanto durar, todo ataque à distância com arma (flecha, virote, pedra) que cruze a muralha erra sozinho. Concentração, até 1 minuto. (No jogo, só os projéteis de arma são barrados: magias, criaturas Grandes e gás atravessam; o livro também sopra névoa e voadores, o que o jogo não faz.)',
  },

  // ---- lote 11: ilusão, visão, atributo, sugestão, luz do dia, maldição, plantas, voo ----

  ilusaoMenor: {
    id: 'ilusaoMenor', name: 'Ilusão Menor', level: 0, school: 'ilusão', fonte: 'srd',
    castTime: 'action', rangeFt: 30, shape: 'sphere', areaFt: 0, kind: 'save', soZona: true,
    zona: { rodadas: 10, quando: 'nunca', aoEntrar: false, dificil: false, semTeste: true, ilusao: true, ocupaCasa: true },
    desc: 'Uma imagem de um objeto (um caixote, uma pedra) numa casa vazia a até 9 m, por 1 minuto. Quem não é do seu lado não enxerga através dela: o que está atrás fica oculto para eles, e eles atacam e são atacados como no escuro. Ela não impede ninguém de andar; quem a atravessa, ou gasta a ação num teste de Investigação (INT) contra a sua CD, vê que é só uma imagem, e ela some. (Simplificação: o jogo ignora o som, e só o outro lado é enganado — seus aliados sempre sabem. Uma vez desmascarada, some para todos. A imagem tira a visão, mas não impede de mirar. Fora do combate, como regra da casa, dá vantagem em Enganação por 1 minuto.)',
  },
  visaoNoEscuro: {
    id: 'visaoNoEscuro', name: 'Visão no Escuro', level: 2, school: 'transmutação', fonte: 'srd',
    castTime: 'action', rangeFt: 5, kind: 'buff', targets: 1, condition: 'visaoNoEscuro',
    desc: 'Toque num aliado (ou em si): por 8 horas ele enxerga no escuro até 18 m, como se fosse penumbra. Quem já tem visão no escuro mais longa mantém a sua. (A escuridão mágica, como a da magia Escuridão, continua opaca.) Sem concentração.',
  },
  aprimorarAtributo: {
    id: 'aprimorarAtributo', name: 'Aprimorar Atributo', level: 2, school: 'transmutação', fonte: 'srd',
    castTime: 'action', rangeFt: 5, kind: 'buff', targets: 1, condition: 'aprimorado', escolheAtributo: true,
    concentration: true, duracaoRodadas: 600, upcast: { alvos: 1 },
    desc: 'Toque num aliado: ele ganha vantagem nos testes de um atributo, à escolha — Força do Touro (FOR), Graça do Gato (DES, e não sofre dano de queda), Resistência do Urso (CON, e 2d6 PV temporários que somem com a magia), Esplendor da Águia (CAR), Astúcia da Raposa (INT) ou Sabedoria da Coruja (SAB). Concentração, até 1 hora. +1 alvo por círculo acima do 2º. (No jogo, a escolha vem do pedido do jogador; sem pedido, o jogo dá a Resistência do Urso, ou a Força do Touro / Graça do Gato a quem está preso e precisa escapar. Vale nos testes de atributo que o combate rola, como escapar; não nas resistências.)',
  },
  forcaFantasmagorica: {
    id: 'forcaFantasmagorica', name: 'Força Fantasmagórica', level: 2, school: 'ilusão', fonte: 'srd',
    castTime: 'action', rangeFt: 60, kind: 'debuff', targets: 1, save: 'int', condition: 'iludido',
    concentration: true, duracaoRodadas: 10,
    desc: 'Uma criatura a até 18 m faz CD de INT. Se falha, ela vê uma ilusão feita só para a mente dela: no início de cada turno dela, 1d6 psíquico. Ela pode gastar a ação para examinar a ilusão (teste de Investigação contra a sua CD); se passar, a magia acaba nela. Concentração, até 1 minuto. (Simplificação: o livro fere só se a criatura está junto da ilusão; no jogo o dano vem todo início de turno, sem a ilusão ocupar casa alguma.)',
  },
  sugestao: {
    id: 'sugestao', name: 'Sugestão', level: 2, school: 'encantamento', fonte: 'srd',
    castTime: 'action', rangeFt: 30, kind: 'debuff', targets: 1, save: 'wis', condition: 'sugerido',
    concentration: true, duracaoRodadas: 4800,
    desc: 'Uma criatura a até 9 m que pode ouvir você faz CD de SAB (imunes a encanto não são afetados). Se falha, segue a sugestão que você dá. (Simplificação: no jogo a sugestão é sempre "abandone a luta e vá embora": ele não ataca e se afasta do grupo, até ser ferido por você ou por um aliado seu.) Concentração, até 8 horas. (Regra da casa fora do combate: o próximo teste social de Persuasão, Intimidação ou Enganação com ele é cumprido, e a magia acaba.)',
  },
  luzDoDia: {
    id: 'luzDoDia', name: 'Luz do Dia', level: 3, school: 'evocação', fonte: 'srd',
    castTime: 'action', rangeFt: 60, shape: 'sphere', areaFt: 60, kind: 'save', soZona: true,
    zona: { rodadas: 600, quando: 'nunca', aoEntrar: false, dificil: false, semTeste: true, luz: { claro: 60, penumbra: 60 } },
    desc: 'Uma esfera de luz solar num ponto a até 18 m: luz plena num raio de 18 m e penumbra por mais 18 m, por 1 hora. Se a esfera encosta numa escuridão mágica de círculo 3 ou menor (Escuridão, Fome de Hadar), essa escuridão é dissipada. (Na sobreposição, a Escuridão lançada depois vence a Luz do Dia.) (No jogo, o ponto fica parado no chão em vez de prender-se a um objeto. Sem concentração.)',
  },
  removerMaldicao: {
    id: 'removerMaldicao', name: 'Remover Maldição', level: 3, school: 'abjuração', fonte: 'srd',
    castTime: 'action', rangeFt: 5, kind: 'restaurar', remove: ['rogado', 'bruxaria'], todas: true,
    desc: 'Toque num aliado: toda maldição que pese sobre ele acaba — Rogar Maldição e Bruxaria, as duas que existem no jogo. (Objetos amaldiçoados e a sintonia com itens malditos ainda não existem no jogo.)',
  },
  crescerPlantas: {
    id: 'crescerPlantas', name: 'Crescer Plantas', level: 3, school: 'transmutação', fonte: 'srd',
    castTime: 'action', rangeFt: 150, shape: 'sphere', areaFt: 100, kind: 'save', soZona: true,
    zona: {
      rodadas: 4800, quando: 'nunca', aoEntrar: false, dificil: false, dificil4: true, semTeste: true,
      soVegetal: true, poupaAliados: true,
    },
    desc: 'A vegetação comum num raio de 30 m do ponto (a até 45 m de você) fica espessa: cada 1,5 m andado ali custa 6 m de deslocamento (4×). Dura o encontro inteiro. (Versão de 1 ação do livro. No jogo, só vira mato o chão natural — grama, mato, terra batida; não pedra, estrada nem caverna —, e as casas que seus aliados ocupam ao conjurar ficam de fora. O raio inteiro vale, cortado pelo mapa e pelas paredes. Sem concentração.)',
  },
  voo: {
    id: 'voo', name: 'Voo', level: 3, school: 'transmutação', fonte: 'srd',
    castTime: 'action', rangeFt: 5, kind: 'buff', targets: 1, condition: 'voando',
    concentration: true, duracaoRodadas: 100, upcast: { alvos: 1 },
    desc: 'Toque num aliado: por 10 minutos ele ganha deslocamento de voo de 18 m. (No jogo ele voa por cima do terreno difícil e dos degraus de elevação, e as zonas do chão — Graxa, Espinhos — não o pegam; a Teia e o resto ainda pegam. Obstáculos e criaturas continuam barrando o caminho, e o voador ainda pode ser alcançado em combate corpo a corpo.) Se a concentração cair, ele cai: 1d6 contundente (o jogo supõe uns 3 m de altura) e fica caído. +1 alvo por círculo acima do 3º.',
  },

  // ---- lote 12: queda, frutos, imagens, flechas, rastro, aranha, contramágica, glifo ----

  quedaSuave: {
    id: 'quedaSuave', name: 'Queda Suave', level: 1, school: 'transmutação', fonte: 'srd',
    castTime: 'reacao', rangeFt: 60, kind: 'reacao', gatilho: 'queda', alvosDaQueda: 5,
    desc: 'Reação, sai sozinha: quando você, ou um aliado que você vê a até 18 m, cai (no jogo, só quando o Voo acaba), até 5 criaturas caindo desaceleram: não sofrem dano de queda e pousam de pé. (Só quem tem a magia preparada e um espaço livre reage; vale uma queda por reação.)',
  },
  bomFruto: {
    id: 'bomFruto', name: 'Bom Fruto', level: 1, school: 'transmutação', fonte: 'srd',
    castTime: 'action', rangeFt: 0, kind: 'frutos', frutos: 10,
    desc: 'Dez frutinhas surgem na sua mochila. Quem come uma (uma ação, encostado em quem recebe) recupera 1 PV. (No jogo as frutas ficam na mochila de quem conjurou, sem os 24 h de validade nem o alimento do dia; fora de combate, o descanso conjura a magia e distribui até 10 PV entre o grupo. Sem concentração.)',
  },
  imagemSilenciosa: {
    id: 'imagemSilenciosa', name: 'Imagem Silenciosa', level: 1, school: 'ilusão', fonte: 'srd',
    castTime: 'action', rangeFt: 60, shape: 'square', areaFt: 15, kind: 'save', soZona: true, reuso: 'acao',
    zona: { rodadas: 100, quando: 'nunca', aoEntrar: false, dificil: false, semTeste: true, ilusao: true, movel: 120, dentroDoAlcance: true },
    concentration: true, duracaoRodadas: 100,
    desc: 'Uma imagem de um objeto, criatura ou fenômeno (3×3 casas) a até 18 m, por até 10 minutos. Quem não é do seu lado não enxerga através dela: o que está atrás fica oculto para eles. Ela não impede ninguém de andar; quem a atravessa, ou gasta a ação num teste de Investigação (INT) contra a sua CD, vê que é só uma imagem, e ela some. Com a ação você a move para qualquer ponto ao alcance. Concentração. (Simplificação: o jogo ignora o som — a imagem é muda mesmo — e só o outro lado é enganado; seus aliados sempre sabem. Desmascarada, some para todos. A imagem tira a visão, mas não impede de mirar.)',
  },
  cordaoDeFlechas: {
    id: 'cordaoDeFlechas', name: 'Cordão de Flechas', level: 2, school: 'transmutação', fonte: 'propria',
    castTime: 'action', rangeFt: 5, shape: 'square', areaFt: 5, kind: 'save', soZona: true, upcast: { flechas: 2 },
    zona: { rodadas: 4800, quando: 'nunca', aoEntrar: false, dificil: false, semTeste: true, ocupaCasa: true, cordao: { flechas: 4, raioFt: 30, dano: '1d6', tipo: 'perfurante' } },
    desc: 'Você finca quatro flechas no chão ao seu alcance. Quando um inimigo seu entra a até 9 m delas pela primeira vez no turno, ou termina o turno ali, uma flecha o atinge: ele faz uma resistência de Destreza contra a CD da sua magia e, se falhar, sofre 1d6 de dano perfurante; se passar, nada. Cada tiro gasta uma flecha; sem flechas, a magia acaba. Dura 8 horas. +2 flechas por círculo acima do 2º. (No jogo, o tiro sai do ponto das flechas, sem consumir munição e sem jogada de ataque, e quem a magia não "designa" é todo mundo do seu lado. Sem concentração.)',
  },
  passoSemRastro: {
    id: 'passoSemRastro', name: 'Passo sem Rastro', level: 2, school: 'abjuração', fonte: 'srd',
    castTime: 'action', rangeFt: 0, kind: 'rastro', raioFt: 30,
    concentration: true, duracaoRodadas: 600,
    desc: 'Um véu de sombra e silêncio acompanha você: você e os aliados a até 9 m de você ganham +10 em Furtividade (e, no livro, não deixam rastro). Concentração, até 1 hora. (No jogo, o bônus vale enquanto o aliado fica a 9 m de você — o jogo confere no começo de cada turno e quando alguém se move — e vale nas jogadas de Furtividade do combate e das cenas de exploração; o rastro não existe.)',
  },
  patasDeAranha: {
    id: 'patasDeAranha', name: 'Patas de Aranha', level: 2, school: 'transmutação', fonte: 'srd',
    castTime: 'action', rangeFt: 5, kind: 'buff', targets: 1, condition: 'escalando',
    concentration: true, duracaoRodadas: 600,
    desc: 'Toque numa criatura (você ou um aliado): por até 1 hora ela sobe por paredes e anda de cabeça para baixo no teto, sem testes. (No jogo ela sobe os degraus de elevação sem o custo extra de escalada e sem o limite de um nível por passo, como o Voo faz; mas NÃO ignora terreno difícil nem as zonas do chão, e o teto não existe. Concentração.)',
  },
  contramagia: {
    id: 'contramagia', name: 'Contramágica', level: 3, school: 'abjuração', fonte: 'srd',
    castTime: 'reacao', rangeFt: 60, kind: 'reacao', gatilho: 'conjuracao', upcast: { circulo: true },
    desc: 'Reação, sai sozinha: quando uma criatura do outro lado, a até 18 m e à vista, conjura uma magia, você a interrompe. Magia de círculo igual ou menor ao do espaço que você gasta falha sozinha; maior, pede um teste do seu atributo de conjuração contra CD 10 + círculo da magia. O espaço dela se perde. Usando espaço maior, interrompe magias de até esse círculo. (Simplificação: o jogo só reage contra magias de 1º círculo ou maior — truque passa —, usa o menor espaço que já basta e o conjurador que perde a magia não perde a concentração anterior.)',
  },
  imagemMaior: {
    id: 'imagemMaior', name: 'Imagem Maior', level: 3, school: 'ilusão', fonte: 'srd',
    castTime: 'action', rangeFt: 120, shape: 'square', areaFt: 20, kind: 'save', soZona: true, reuso: 'acao',
    zona: { rodadas: 100, quando: 'nunca', aoEntrar: false, dificil: false, semTeste: true, ilusao: true, movel: 240, dentroDoAlcance: true },
    concentration: true, duracaoRodadas: 100,
    desc: 'Como Imagem Silenciosa, mas maior (4×4 casas) a até 36 m, e com som, cheiro e temperatura no livro. Quem não é do seu lado não enxerga através dela; quem a atravessa, ou gasta a ação num teste de Investigação (INT) contra a sua CD, a desmascara. Com a ação você a move. Concentração, até 10 minutos. (Simplificação: som e cheiro não existem no jogo, então a única diferença para a Imagem Silenciosa é o tamanho e o alcance; a versão permanente do 6º círculo não existe.)',
  },
  glifoDeProtecao: {
    id: 'glifoDeProtecao', name: 'Glifo de Proteção', level: 3, school: 'abjuração', fonte: 'srd',
    castTime: 'action', rangeFt: 5, shape: 'square', areaFt: 5, kind: 'save', soZona: true, save: 'dex',
    damage: '5d8', damageType: 'trovejante', halfOnSave: true, escolheTipoDoGlifo: true, upcast: { dados: 1 },
    zona: { rodadas: 4800, quando: 'nunca', aoEntrar: false, dificil: false, semTeste: true, ocupaCasa: true, glifo: { raioFt: 20, save: 'dex' } },
    desc: 'Você grava uma runa explosiva numa casa ao seu alcance. Quando um inimigo seu entra nela, a runa explode numa esfera de 6 m de raio: cada criatura ali (aliados também!) faz CD de DES ou sofre 5d8 de dano, metade se passar, do tipo que você escolheu ao gravar — ácido, frio, fogo, elétrico ou trovejante (sem pedido, o jogo escolhe o que mais fere os inimigos à vista, e trovejante se empatar). A runa some ao disparar. Seus inimigos não a veem. A explosão interrompe o passo de quem pisou na runa. +1d8 por círculo acima do 3º. (Simplificação: o livro leva 1 hora para gravar; no jogo é 1 ação, sem o incenso de 200 po. Dispara por quem pisa na casa; a variante de magia armazenada não existe. Sem concentração, dura 8 horas.)',
  },

  // ---- lote 13: magias de UTILIDADE (fora do combate; `rules/utilidade.js`) ----
  //
  // `soFora`: o motor de combate recusa; elas valem na exploração e nas conversas
  // (menu do botão direito, barra de magias e a opção "Conjurar" das conversas).
  // `duracaoMin`: duração em MINUTOS (o relógio do jogo, não rodadas).
  // `ritual`: pode ser conjurada como ritual (+10 minutos, sem gastar espaço).

  taumaturgia: {
    id: 'taumaturgia', name: 'Taumaturgia', level: 0, school: 'transmutação', fonte: 'srd', soFora: true, utilidade: true,
    castTime: 'action', rangeFt: 30, kind: 'utilidade', duracaoMin: 1,
    desc: 'Sua voz troveja, o chão treme e as chamas das velas se curvam. No jogo: por 1 minuto você tem vantagem nos testes de Intimidação. (O livro só dá efeitos de cena, sem número; a vantagem é regra da casa. Só fora de combate.)',
  },
  amizade: {
    id: 'amizade', name: 'Amizade', level: 0, school: 'encantamento', fonte: 'srd', soFora: true, utilidade: true,
    castTime: 'action', rangeFt: 10, kind: 'utilidade', concentration: true, duracaoMin: 1,
    desc: 'Por 1 minuto você tem vantagem nos testes de Carisma contra UMA criatura que não seja hostil. Quando a magia acaba, ela percebe que foi influenciada e fica hostil. Concentração. (No jogo, vale nas conversas com ela; depois, os testes sociais com ela têm desvantagem. Só fora de combate.)',
  },
  maoMagica: {
    id: 'maoMagica', name: 'Mãos Mágicas', level: 0, school: 'conjuração', fonte: 'srd', soFora: true, utilidade: true,
    castTime: 'action', rangeFt: 30, kind: 'utilidade', duracaoMin: 1,
    desc: 'Uma mão espectral a até 9 m pega, abre, puxa ou aciona algo leve (até 5 kg): abrir uma porta destrancada, puxar um fio, apalpar o fundo de uma cisterna. Não ataca nem carrega mais que isso. (No jogo, vale nos pontos da cena que pedem um objeto a distância. Só fora de combate.)',
  },
  prestidigitacao: {
    id: 'prestidigitacao', name: 'Prestidigitação', level: 0, school: 'transmutação', fonte: 'srd', soFora: true, utilidade: true,
    castTime: 'action', rangeFt: 10, kind: 'utilidade', duracaoMin: 60, escolhe: 'truque',
    desc: 'Pequenos truques de feiticeiro: acender ou apagar uma tocha, limpar ou sujar algo, esquentar ou esfriar comida, soltar uma fumaça colorida, deixar uma marca ou um cheiro. No jogo, acender e apagar a tocha de um aliado de graça (sem a pederneira) é o efeito que muda alguma coisa; o resto é descrição. Só fora de combate.',
  },
  arteDruidica: {
    id: 'arteDruidica', name: 'Druidismo', level: 0, school: 'transmutação', fonte: 'srd', soFora: true, utilidade: true,
    castTime: 'action', rangeFt: 30, kind: 'utilidade', duracaoMin: 1, escolhe: 'truque',
    desc: 'Pequenos sinais da natureza: prever o tempo das próximas 24 horas, fazer uma flor abrir, acender ou apagar uma vela ou fogueira. No jogo, prever o tempo dá a previsão do dia e acender/apagar mexe na tocha de um aliado; o resto é descrição. Só fora de combate.',
  },
  consertar: {
    id: 'consertar', name: 'Consertar', level: 0, school: 'transmutação', fonte: 'srd', soFora: true, utilidade: true,
    castTime: 'minutos', minutos: 1, rangeFt: 5, kind: 'utilidade', duracaoMin: 0,
    desc: 'Leva 1 minuto: refaz uma única quebra ou rasgo de até 30 cm num objeto — uma corrente partida, uma corda, uma alça, um vaso. Não conserta item mágico nem fura o limite de tamanho. (No jogo, vale nos objetos quebrados da cena. Só fora de combate.)',
  },
  luzesDancantes: {
    id: 'luzesDancantes', name: 'Luzes Dançantes', level: 0, school: 'evocação', fonte: 'srd', soFora: true, utilidade: true,
    castTime: 'action', rangeFt: 60, kind: 'utilidade', duracaoMin: 1,
    desc: 'Até quatro luzinhas flutuam ao seu redor, fraquinhas: cada uma emite só penumbra num raio de 3 m, por 1 minuto. Concentração. (Simplificação: no jogo as luzes acompanham quem conjurou, sem mover-se à parte. Só fora de combate; no escuro, vale como uma tocha pequena que não ocupa a mão.)',
  },
  mensagem: {
    id: 'mensagem', name: 'Mensagem', level: 0, school: 'transmutação', fonte: 'srd', soFora: true, utilidade: true,
    castTime: 'action', rangeFt: 120, kind: 'utilidade', duracaoMin: 1,
    desc: 'Você sussurra e só a criatura que você aponta, a até 36 m, ouve — mesmo atrás de uma porta ou parede fina. Ela pode responder em sussurro. (Simplificação: o livro dura 1 rodada; no jogo dura 1 minuto, o tempo de uma conversa curta, e deixa conversar com um NPC longe demais para a voz normal. Só fora de combate.)',
  },
  detectarMagia: {
    id: 'detectarMagia', name: 'Detectar Magia', level: 1, school: 'adivinhação', fonte: 'srd', ritual: true, soFora: true, utilidade: true,
    castTime: 'action', rangeFt: 0, kind: 'utilidade', concentration: true, duracaoMin: 10,
    desc: 'Por 10 minutos você sente a presença de magia a até 9 m e vê um brilho em volta do que é mágico, com a escola dela. No jogo: objetos mágicos da cena a até 9 m ficam marcados no chão e dizem a escola; os itens mágicos na mochila do grupo também respondem. Concentração. Pode ser ritual. (Simplificação: o livro não atravessa barreira grossa; aqui, só o que está à vista e no alcance. Só fora de combate.)',
  },
  identificar: {
    id: 'identificar', name: 'Identificar', level: 1, school: 'adivinhação', fonte: 'srd', ritual: true, soFora: true, utilidade: true,
    castTime: 'minutos', minutos: 1, rangeFt: 5, kind: 'utilidade', duracaoMin: 0,
    desc: 'Leva 1 minuto (ritual, 10): você toca um objeto e descobre o que ele é — se é mágico, a raridade e o que faz. (Simplificação: sem a pérola de 100 po do livro. No jogo, vale para qualquer item da mochila. Só fora de combate.)',
  },
  compreenderIdiomas: {
    id: 'compreenderIdiomas', name: 'Compreender Idiomas', level: 1, school: 'adivinhação', fonte: 'srd', ritual: true, soFora: true, utilidade: true,
    castTime: 'action', rangeFt: 0, kind: 'utilidade', duracaoMin: 60,
    desc: 'Por 1 hora você entende qualquer idioma falado e lê qualquer texto que tocar (não decifra código nem texto mágico). No jogo, abre as falas e os escritos em idioma que o grupo não conhece: o caderno em anão, o que os goblins dizem entre si. Pode ser ritual. Só fora de combate.',
  },
  disfarcarSe: {
    id: 'disfarcarSe', name: 'Disfarçar-se', level: 1, school: 'ilusão', fonte: 'srd', soFora: true, utilidade: true,
    castTime: 'action', rangeFt: 0, kind: 'utilidade', duracaoMin: 60,
    desc: 'Por 1 hora você muda a própria aparência (altura, rosto, roupa) sem mudar o corpo: quem toca descobre. Quem examina faz Investigação contra a sua CD de magia. (No jogo, vale como o manto vermelho: passa por um dos Marcarrubra para quem não olha direito, e, como regra da casa, dá vantagem em Enganação nas conversas. Só fora de combate.)',
  },
  falarComAnimais: {
    id: 'falarComAnimais', name: 'Falar com Animais', level: 1, school: 'adivinhação', fonte: 'srd', ritual: true, soFora: true, utilidade: true,
    castTime: 'action', rangeFt: 0, kind: 'utilidade', duracaoMin: 10,
    desc: 'Por 10 minutos você entende o que os bichos dizem e pode falar com eles. Eles sabem pouco além do que cheiram e veem, e nem sempre simpatizam com você. (Regra da casa: dá vantagem em Lidar com Animais e deixa ouvir o que a fera sabe.) Pode ser ritual. Só fora de combate.',
  },
  abrir: {
    id: 'abrir', name: 'Abrir', level: 2, school: 'transmutação', fonte: 'srd', soFora: true, utilidade: true,
    castTime: 'action', rangeFt: 60, kind: 'utilidade', duracaoMin: 0,
    desc: 'Uma porta, baú ou cela trancada a até 18 m se destranca sozinha (a magia solta um estrondo que se ouve a 90 m). Serve para um tipo de tranca por vez. (No jogo, vale nas fechaduras da cena e dispensa o teste; o estrondo avisa quem está perto. Só fora de combate.)',
  },
  detectarPensamentos: {
    id: 'detectarPensamentos', name: 'Detectar Pensamentos', level: 2, school: 'adivinhação', fonte: 'srd', soFora: true, utilidade: true,
    castTime: 'action', rangeFt: 30, kind: 'utilidade', concentration: true, duracaoMin: 1,
    desc: 'Por 1 minuto você ouve os pensamentos de superfície das criaturas a até 9 m (que o entendam). Dá para sondar uma criatura: ela faz CD de SAB para impedir; se passa, percebe a invasão e a magia termina. Quem falha também percebe que lhe leram a mente. Não funciona em criatura com Inteligência 3 ou menos, nem em quem não fala idioma nenhum. (Regra da casa: depois de sondar, o que você descobre dá vantagem em Persuasão e Enganação com ela.) No jogo, nas conversas aparece a opção de sondar a mente do NPC. Concentração. Só fora de combate.',
  },
  verOInvisivel: {
    id: 'verOInvisivel', name: 'Ver o Invisível', level: 2, school: 'adivinhação', fonte: 'srd', soFora: true, utilidade: true,
    castTime: 'action', rangeFt: 0, kind: 'utilidade', duracaoMin: 60,
    desc: 'Por 1 hora você enxerga criaturas e objetos invisíveis (e o Plano Etéreo) como se fossem visíveis. No jogo, mostra quem está invisível na cena e o que a ilusão esconde. Sem concentração. Só fora de combate.',
  },
  falarComOsMortos: {
    id: 'falarComOsMortos', name: 'Falar com os Mortos', level: 3, school: 'necromancia', fonte: 'srd', soFora: true, utilidade: true,
    castTime: 'action', rangeFt: 10, kind: 'utilidade', duracaoMin: 10,
    desc: 'Um cadáver com boca a até 3 m responde a até cinco perguntas, por 10 minutos, no idioma que sabia em vida, em respostas curtas e crípticas e só sobre o que sabia. Se o corpo já foi alvo desta magia nos últimos 10 dias, ela falha. Só fora de combate.',
  },

  // ---- lote 13: criaturas invocadas (aliadas), Piscar, Levitação e Círculo Mágico ----

  conjurarAnimais: {
    id: 'conjurarAnimais', name: 'Conjurar Animais', level: 3, school: 'conjuração', fonte: 'srd',
    castTime: 'action', rangeFt: 0, kind: 'invocar', invocacao: 'animais',
    concentration: true, duracaoRodadas: 600,
    pacotes: PACOTES_DE_ANIMAIS,
    pacotePadrao: 'nd1',
    opcoes: Object.entries(PACOTES_DE_ANIMAIS).map(([id, p]) => ({ id, rotulo: p.rotulo, detalhe: p.detalhe })),
    desc: 'Feras feéricas surgem ao seu redor e lutam a seu lado, até 1 hora, enquanto você concentrar. Você escolhe o pacote: 1 fera de ND 2 (tigre-dente-de-sabre ou javali gigante), 2 de ND 1 (lobos atrozes), 4 de ND 1/2 (ursos-negros ou cabras gigantes) ou 8 de ND 1/4 (lobos); no 5º círculo o número dobra, no 7º triplica e no 9º quadruplica. Você as comanda no seu turno como os heróis (selecione, mova, ataque). Elas somem se a concentração cair, se morrerem ou quando o encontro acaba, e não contam para o XP. (Simplificações: o livro tem alcance de 18 m, com as feras em casas livres que você veja; aqui elas surgem em casas livres ao redor de quem conjura, sem escolher o ponto, e só agem no próximo turno do grupo, em vez de ter iniciativa própria; o livro deixa o Mestre escolher a espécie, aqui ela vem do pacote.)',
  },
  animarMortos: {
    id: 'animarMortos', name: 'Animar os Mortos', level: 3, school: 'necromancia', fonte: 'srd',
    castTime: 'action', rangeFt: 10, kind: 'animarMortos',
    opcoes: [
      { id: 'esqueleto', rotulo: 'Esqueleto', detalhe: 'CA 13, 13 PV; golpeia com espada curta ou atira de arco curto' },
      { id: 'zumbi', rotulo: 'Zumbi', detalhe: 'CA 8, 22 PV; lento, e volta com 1 PV ao cair (Tenacidade)' },
    ],
    upcast: { criaturas: 2 },
    desc: 'Toque num cadáver humanoide Médio ou Pequeno (de qualquer lado, menos os dos heróis) a até 3 m: ele se ergue como um esqueleto ou zumbi sob o seu comando. Cada cadáver só se ergue uma vez. +2 mortos-vivos por círculo acima do 3º, cada um de um cadáver à vista a até 3 m (os mais próximos). Você os comanda no seu turno como os heróis. (Simplificações: o livro leva 1 minuto para conjurar e a obediência dura 24 horas; no jogo é uma ação e dura até o fim do encontro, sem precisar reafirmar o controle. Eles só agem no próximo turno do grupo. Não contam para o XP.)',
  },
  piscar: {
    id: 'piscar', name: 'Piscar', level: 3, school: 'transmutação', fonte: 'srd',
    castTime: 'action', rangeFt: 0, kind: 'buff', targets: 1, condition: 'piscando',
    rodadasProprias: 10,
    desc: 'Por 1 minuto, no fim de cada turno seu você rola 1d20: com 11 ou mais, some para o Plano Etéreo. Ali ninguém o atinge nem o escolhe como alvo, e você não ataca nem conjura. Você volta no começo do seu próximo turno, numa casa livre a até 3 m de onde sumiu. (Simplificação: o livro deixa você escolher a casa de volta; no jogo ela é a mesma de onde saiu, ou a mais próxima livre.)',
  },
  levitacao: {
    id: 'levitacao', name: 'Levitação', level: 2, school: 'transmutação', fonte: 'srd',
    castTime: 'action', rangeFt: 60, kind: 'levitar', ambosLados: true, save: 'con',
    concentration: true, duracaoRodadas: 100, reuso: 'acao',
    pesoMaximo: 'médio',
    desc: 'Uma criatura Pequena ou Média a até 18 m sobe 6 m e fica no ar, até 10 minutos, enquanto você concentrar. Aliado aceita; inimigo faz CD de CON e, se passar, nada acontece. Quem levita não anda sozinho (deslocamento 0); você, com a ação, o move até 6 m para qualquer casa livre que veja. Quem está no chão não alcança o levitante em corpo a corpo, e ele não alcança quem está no chão (só ataques à distância). Se a concentração cair, ele cai: 2d6 de dano contundente e fica caído. (Simplificações: o livro move o alvo em 6 m na vertical; no jogo a altura é fixa e o movimento é na horizontal. Objetos não são alvo, e o limite de 225 kg vira "criatura Pequena ou Média".)',
  },
  circuloMagico: {
    id: 'circuloMagico', name: 'Círculo Mágico', level: 3, school: 'abjuração', fonte: 'srd',
    castTime: 'action', rangeFt: 10, shape: 'sphere', areaFt: 10, kind: 'save', soZona: true,
    escolheTipoDoCirculo: true,
    zona: { rodadas: 600, quando: 'nunca', aoEntrar: false, dificil: false, semTeste: true, circuloMagico: true },
    opcoes: ['celestial', 'elemental', 'feérico', 'corruptor', 'morto-vivo'].map((id) => ({
      id, rotulo: { celestial: 'Celestiais', elemental: 'Elementais', 'feérico': 'Feéricos', corruptor: 'Corruptores', 'morto-vivo': 'Mortos-vivos' }[id], detalhe: 'não entram, atacam com desvantagem e não enfeitiçam nem amedrontam quem está dentro',
    })),
    desc: 'Um cilindro de 3 m de raio e 6 m de altura, centrado num ponto a até 3 m, dura 1 hora. Você escolhe um tipo: celestial, elemental, feérico, corruptor ou morto-vivo. Criaturas desse tipo não entram nele por vontade própria (quem já está dentro pode sair), têm desvantagem em ataques contra quem está dentro e não podem enfeitiçar nem amedrontar quem está dentro. (Simplificações: o livro leva 1 minuto para conjurar e permite também prender a criatura dentro do círculo; no jogo é uma ação e só vale a proteção contra o tipo. Quem é jogado para dentro à força ou teleportado não é barrado. Sem os 100 po de prata e ferro. Nos níveis acima do 3º a duração não cresce: o jogo já deixa o encontro inteiro coberto.)',
  },

  // ---- lote 14: utilidade 2 (Livro do Jogador 2014; texto e simplificações nossos) ----
  //
  // Salto e Fingir de Morto valem também na luta (são `buff`); as outras são
  // `soFora`, como as de `rules/utilidade.js`, onde mora o que cada uma faz na cena.

  salto: {
    id: 'salto', name: 'Salto', level: 1, school: 'transmutação', fonte: 'srd',
    castTime: 'action', rangeFt: 5, kind: 'buff', targets: 1, condition: 'saltoTriplo',
    rodadasProprias: 10,
    desc: 'Toque numa criatura: por 1 minuto, a distância de cada salto dela triplica. No jogo, vale no salto do tabuleiro, dentro e fora da luta: ele alcança três vezes mais longe (um fosso de 3 m deixa de ser problema) e pode pousar um nível acima de onde saiu. (Como no livro, cada pé saltado gasta um pé de deslocamento; sem concentração.)',
  },
  alarme: {
    id: 'alarme', name: 'Alarme', level: 1, school: 'abjuração', fonte: 'srd', ritual: true, soFora: true, utilidade: true,
    castTime: 'minutos', minutos: 1, rangeFt: 30, kind: 'utilidade', duracaoMin: 480,
    desc: 'Leva 1 minuto (ritual: 11). Você marca um lugar por 8 horas. Quando uma criatura Pequena ou maior entra nele sem dizer a senha, soa um aviso na sua cabeça. No jogo, quem está a até 18 m da marca ouve o aviso: numa emboscada daquela cena ninguém do grupo é pego de surpresa, e o registro diz que o alarme tocou. (Simplificações: o livro é um cubo de 6 m e o aviso é só para o conjurador, que acorda; aqui ele avisa o grupo, e vale na cena onde foi lançado, sem escolher entre aviso mental ou sonoro. Só fora de combate.)',
  },
  detectarBemMal: {
    id: 'detectarBemMal', name: 'Detectar o Bem e o Mal', level: 1, school: 'adivinhação', fonte: 'srd', soFora: true, utilidade: true,
    castTime: 'action', rangeFt: 0, kind: 'utilidade', concentration: true, duracaoMin: 10,
    desc: 'Por 10 minutos você sente a presença e o lugar de aberrações, celestiais, elementais, feéricos, corruptores e mortos-vivos a até 9 m, mesmo atrás de parede. No jogo, essas criaturas acendem no mapa com uma luz (azul para o bem, vermelha para o mal) enquanto você se concentrar. (Simplificações: o livro bloqueia a magia com 30 cm de pedra, 2,5 cm de metal, uma chapa fina de chumbo ou 90 cm de madeira ou terra, e também sente lugares e objetos consagrados ou profanados; aqui nenhuma parede esconde e só vale para criaturas, e o jogo diz o tipo e o lado, nunca o nome. Só fora de combate.)',
  },
  encontrarArmadilhas: {
    id: 'encontrarArmadilhas', name: 'Encontrar Armadilhas', level: 2, school: 'adivinhação', fonte: 'srd', soFora: true, utilidade: true,
    castTime: 'action', rangeFt: 120, kind: 'utilidade', duracaoMin: 0,
    desc: 'Você sente se há armadilhas a até 36 m e à vista, e fica sabendo que perigo é, mas não como desarmá-las. No jogo, as armadilhas feitas de propósito que estão à vista (o fio do castelo, o fosso coberto) aparecem marcadas e, sabidas, o grupo passa por elas sem disparar; se não há nenhuma, a magia diz isso. Fraquezas naturais, como uma laje rachada, ela não vê. (Simplificação: o livro dá só a presença e o tipo de perigo, não o ponto exato; aqui o mapa crava o ponto. Só fora de combate.)',
  },
  zonaDaVerdade: {
    id: 'zonaDaVerdade', name: 'Zona da Verdade', level: 2, school: 'encantamento', fonte: 'srd', soFora: true, utilidade: true,
    castTime: 'action', rangeFt: 60, kind: 'utilidade', duracaoMin: 10,
    desc: 'Por 10 minutos, quem está na esfera de 4,5 m de raio e falha numa resistência de CARISMA não consegue mentir (pode calar ou responder de lado). Você sabe se cada um resistiu. No jogo, vale para a criatura com quem você conversa: ela faz a resistência; se falha, as falas que seriam mentira saem verdadeiras (só as conversas que têm essa fala mudam; não há perguntas novas). (Simplificação: a esfera do livro pega todos nela; aqui ela acompanha o interlocutor da conversa. Quem resiste sabe que a magia tentou, e pode mentir. Só fora de combate.)',
  },
  localizarObjeto: {
    id: 'localizarObjeto', name: 'Localizar Objeto', level: 2, school: 'adivinhação', fonte: 'srd', soFora: true, utilidade: true,
    castTime: 'action', rangeFt: 1000, kind: 'utilidade', concentration: true, duracaoMin: 10,
    desc: 'Por 10 minutos você sente a direção de um objeto que conhece (que já viu de perto) ou de um tipo de objeto (uma chave, um baú), o mais próximo, a até 300 m. No jogo, o texto diz a direção (em oito pontos) e se está perto ou longe, e o objeto fica marcado no mapa enquanto você se concentrar. (Simplificações: o livro dá só a direção e o mapa crava o ponto exato; a marca não acompanha o objeto se ele mudar de dono; a chapa fina de chumbo, que no livro bloqueia a magia, não conta aqui. Não acha criaturas. Só fora de combate.)',
  },
  linguas: {
    id: 'linguas', name: 'Línguas', level: 3, school: 'adivinhação', fonte: 'srd', soFora: true, utilidade: true,
    castTime: 'action', rangeFt: 5, kind: 'utilidade', duracaoMin: 60,
    desc: 'Por 1 hora você entende qualquer idioma falado e fala qualquer idioma que conheça uma criatura que o ouça. No jogo, vale como Compreender Idiomas (ouve o que o goblin murmura) e, nas conversas que têm essa fala, dá para responder na língua deles (goblin, bugbear...), o que muda o que eles aceitam; hoje são duas falas, não um idioma livre. (Simplificação: no jogo é só você; o livro permite tocar outra criatura. Só fora de combate.)',
  },
  alterarAparencia: {
    id: 'alterarAparencia', name: 'Alterar Aparência', level: 2, school: 'transmutação', fonte: 'srd', soFora: true, utilidade: true,
    castTime: 'action', rangeFt: 0, kind: 'utilidade', concentration: true, duracaoMin: 60,
    desc: 'Por 1 hora você muda a própria forma: rosto, altura, roupa, voz, até a idade, dentro de um corpo humanoide. Concentração. No jogo, vale como Disfarçar-se (passa por um dos Marcarrubra, e como a mudança é real, não há exame de Investigação, ao contrário do Disfarçar-se). (Regra da casa: vantagem em Enganação enquanto durar. Simplificação: das três formas do livro, só a mudança de aparência; sem nadar nem armas naturais. Só fora de combate.)',
  },
  cativar: {
    id: 'cativar', name: 'Cativar', level: 2, school: 'encantamento', fonte: 'srd', soFora: true, utilidade: true,
    castTime: 'action', rangeFt: 60, kind: 'utilidade', duracaoMin: 1,
    desc: 'Você tece uma conversa tão prendente que as criaturas à vista que o ouvem fazem uma resistência de SABEDORIA. Quem falha só tem olhos para você por 1 minuto, com desvantagem em Percepção para notar qualquer outra coisa. Sem concentração; acaba se você ficar incapacitado ou calar. Criatura imune a enfeitiçado não é afetada. Alcance de 18 m. No jogo, quem está cativado não grita nem dá o alarme (não chama ajuda) e é pego de surpresa mais fácil (Percepção passiva −5, que vale contra qualquer um, não só contra você). (Regra da casa: o livro não impede o grito, só prende a atenção. Só fora de combate.)',
  },
  amizadeAnimal: {
    id: 'amizadeAnimal', name: 'Amizade Animal', level: 1, school: 'encantamento', fonte: 'srd', soFora: true, utilidade: true,
    castTime: 'action', rangeFt: 30, kind: 'utilidade', duracaoMin: 1440,
    desc: 'Uma fera (Inteligência 3 ou menos) a até 9 m, à vista, faz uma resistência de SABEDORIA; falhando, fica convencida de que você não é ameaça e não ataca por 24 horas, até você ou um aliado ferir qualquer fera dessas. +1 fera por círculo acima do 1º. (Simplificação: no jogo, a fera enfeitiçada fica neutra e sai das fileiras inimigas; os lobos acorrentados do esconderijo deixam de rosnar. Só fora de combate.)',
  },
  sentidosDaFera: {
    id: 'sentidosDaFera', name: 'Sentidos da Fera', level: 2, school: 'adivinhação', fonte: 'srd', ritual: true, soFora: true, utilidade: true,
    castTime: 'action', rangeFt: 5, kind: 'utilidade', concentration: true, duracaoMin: 60,
    desc: 'Você toca uma fera disposta e, por 1 hora, enquanto se concentrar, pode usar a ação para ver e ouvir pelos sentidos dela, ficando cego e surdo ao seu redor. No jogo: com o seu familiar ou uma fera amiga por perto, você escolhe uma casa do mapa e o bicho vai espiar, e você fica sabendo quem está lá (as criaturas aparecem marcadas no mapa por um tempo). Pode ser ritual. (Simplificação: o bicho vai espiar a uma casa a até 18 m dele e volta; o livro deixa você ficar nos olhos dele o tempo todo. Só fora de combate.)',
  },
  fingirDeMorto: {
    id: 'fingirDeMorto', name: 'Fingir de Morto', level: 3, school: 'necromancia', fonte: 'srd', ritual: true,
    castTime: 'action', rangeFt: 5, kind: 'buff', targets: 1, condition: 'fingeMorto', rodadasProprias: 600,
    desc: 'Toque numa criatura disposta: por 1 hora ela parece morta para quem a olha. Fica cega e incapacitada, deslocamento 0, com resistência a todo dano menos psíquico (o livro suspende também veneno e doença; isso ficou de fora). No jogo, os inimigos a ignoram enquanto houver outro alvo (se só sobrar ela, passam a atacá-la); só quem conjurou a desfaz, tocando o amigo ao lado, com uma ação, também em combate. Pode ser ritual. (Simplificação: não há como passar andando por inimigos, porque o alvo não anda.)',
  },
  // ---- abrigo da noite (`rules/acampamento.js`) ----
  truqueDaCorda: {
    id: 'truqueDaCorda', name: 'Truque da Corda', level: 2, school: 'transmutação', fonte: 'srd', soFora: true, utilidade: true,
    castTime: 'action', rangeFt: 5, kind: 'utilidade', duracaoMin: 60,
    desc: 'Uma corda de até 18 m sobe sozinha e fica de pé no ar. No alto dela abre-se uma entrada para um espaço fora deste mundo, onde cabem oito criaturas, e a corda pode ser puxada para dentro. Por uma hora, quem está lá dentro não pode ser atacado nem virar alvo de magia; a corda, se ficar de fora, continua à vista. Quem estiver dentro quando a hora acabar cai de lá. (Regras da casa, porque o livro não trata disso: no acampamento o bando que chega passa pelo lugar vazio e segue, e a hora da magia cobre o encontro inteiro, seja qual for a hora da noite. Simplificação: o jogo não desenha o espaço nem a janela para espiar. Só fora de combate.)',
  },
  chamaContinua: {
    id: 'chamaContinua', name: 'Chama Contínua', level: 2, school: 'evocação', fonte: 'srd', soFora: true, utilidade: true,
    castTime: 'action', rangeFt: 5, kind: 'utilidade', duracaoMin: 0,
    desc: 'Uma chama que não consome nada e não se apaga brota de um objeto que você toca: ilumina como uma tocha — 6 m de luz e mais 6 de penumbra — e não dá calor nenhum. Dura até ser dissipada. (Simplificação: no jogo ela fica com o grupo, não num objeto escolhido, e o custo de 50 po em pó de rubi que o livro consome não é cobrado. Regras da casa: no acampamento ela vale +2 para quem vigia, o mesmo que a fogueira, embora o livro não dê bônus de luz nenhum; e, ao contrário da fogueira, não entrega o acampamento a quem passa longe. Só fora de combate.)',
  },
  repousoTranquilo: {
    id: 'repousoTranquilo', name: 'Repouso Tranquilo', level: 2, school: 'necromancia', fonte: 'srd', ritual: true, soFora: true, utilidade: true,
    castTime: 'action', rangeFt: 5, kind: 'utilidade', duracaoMin: 14400,
    desc: 'Você toca um cadáver e o protege por dez dias: ele não apodrece e não pode virar morto-vivo. O tempo que o corpo passa sob a magia não conta para as magias que exigem um morto recente. Ritual. (Simplificação: o jogo não tem apodrecimento nem janela de "morto recente" para o Falar com os Mortos, então o que resta da magia aqui é o que importa — Animar os Mortos recusa um corpo guardado. Passados os dez dias, ele volta a ser um corpo como outro qualquer. Só fora de combate.)',
  },
  pequenaCabana: {
    id: 'pequenaCabana', name: 'Pequena Cabana', level: 3, school: 'evocação', fonte: 'srd', ritual: true, soFora: true, utilidade: true,
    castTime: 'minutos', minutos: 1, rangeFt: 0, kind: 'utilidade', duracaoMin: 480,
    desc: 'Uma cúpula de força de 3 m de raio se fecha em volta de você e fica oito horas. Cabem nove criaturas. De fora ela é opaca, da cor que você quiser, e continua bem à vista; de dentro se vê tudo. Quem estava lá quando ela subiu entra e sai à vontade; mais ninguém atravessa, nem criatura, nem objeto, nem magia. A magia termina se você sair da área. Ritual. (Simplificação: o jogo não desenha a cúpula e põe o grupo inteiro dentro dela. Regra da casa: na estrada, a noite dentro da cabana nem sorteia encontro — no livro a cúpula é visível e um bando esperto pode acampar do lado de fora e esperar. Só fora de combate.)',
  },

  // ---- mantimentos de viagem (`rules/mantimentos.js`) ----
  criarDestruirAgua: {
    id: 'criarDestruirAgua', name: 'Criar ou Destruir Água', level: 1, school: 'transmutação', fonte: 'srd', soFora: true, utilidade: true,
    castTime: 'action', rangeFt: 30, kind: 'utilidade', duracaoMin: 0,
    agua: 40, upcast: { agua: 40 },
    desc: 'Você faz surgir 40 litros de água limpa, que caem num recipiente aberto ou como chuva num cubo de 9 m — ou destrói a mesma quantidade de água ao alcance. Em círculo maior, mais 40 litros por círculo. Na estrada, a água vai para os cantis do grupo. (Simplificações: o livro conta 10 galões, e o jogo arredonda um galão para quatro litros, o dia de uma pessoa; o jogo não usa a metade que destrói água nem a usa para apagar chama. Regra da casa: a água que não cabe em cantil nenhum se perde no fim do dia, porque o grupo não tem onde carregá-la. Só fora de combate.)',
  },
  purificarAlimentos: {
    id: 'purificarAlimentos', name: 'Purificar Alimentos e Bebidas', level: 1, school: 'transmutação', fonte: 'srd', ritual: true, soFora: true, utilidade: true,
    castTime: 'action', rangeFt: 10, kind: 'utilidade', duracaoMin: 0,
    desc: 'Toda a comida e bebida numa esfera de 1,5 m a até 3 m de você fica pura: sai o veneno e sai a doença. Na estrada, limpa a água parada do brejo antes de o grupo beber, e desfaz o mal de quem já bebeu água ruim. Veneno de lâmina ou de mordida ela não tira — o livro purifica comida e bebida, não criaturas. Ritual. (Simplificação: nada na aventura estraga uma ração ainda, então a parte da comida da magia fica guardada para quando isso existir. Só fora de combate.)',
  },
  detectarVenenoDoenca: {
    id: 'detectarVenenoDoenca', name: 'Detectar Veneno e Doença', level: 1, school: 'adivinhação', fonte: 'srd', ritual: true, soFora: true, utilidade: true,
    castTime: 'action', rangeFt: 30, kind: 'utilidade', duracaoMin: 10, concentration: true,
    desc: 'Por 10 minutos você sente onde há veneno, criatura venenosa e doença num raio de 9 m, e sabe de que tipo é cada um. A barreira de pedra, metal, chumbo ou madeira do livro barra o sentido. No jogo, aponta quem do grupo está envenenado e as criaturas com veneno no bote (a aranha e a aranha-lobo). Concentração. Ritual. (Simplificação: o motor ainda não tem doença nem ração estragada, então a magia não acusa nenhuma das duas; a barreira do livro também não é medida.)',
  },
  localizarAnimaisPlantas: {
    id: 'localizarAnimaisPlantas', name: 'Localizar Animais ou Plantas', level: 2, school: 'adivinhação', fonte: 'srd', ritual: true, soFora: true, utilidade: true,
    castTime: 'action', rangeFt: 0, kind: 'utilidade', duracaoMin: 1,
    desc: 'Você nomeia um animal ou uma planta e sente, num raio de 8 km, onde está o exemplar mais próximo, a direção e a distância dele. Na estrada isso é saber onde está a caça e onde está o que se colhe. Ritual. (Simplificação: o jogo não aponta um bicho nomeado no mapa. Regra da casa: no lugar disso, o teste de Sobrevivência para caçar e colher sai com vantagem no dia em que a magia foi conjurada — a magia do livro é instantânea e só diz direção e distância. Só fora de combate.)',
  },
  criarComidaEAgua: {
    id: 'criarComidaEAgua', name: 'Criar Comida e Água', level: 3, school: 'conjuração', fonte: 'srd', soFora: true, utilidade: true,
    castTime: 'action', rangeFt: 30, kind: 'utilidade', duracaoMin: 0,
    racoes: 15, agua: 120,
    desc: 'Surgem no chão comida para quinze pessoas por um dia e 120 litros de água limpa. A comida é sem graça, mas alimenta, e o livro diz que ela estraga em 24 horas. Na estrada, a água enche os cantis do grupo primeiro. (Simplificações: o jogo conta quinze rações e arredonda os 30 galões do livro para 120 litros, a quatro litros por galão. Regra da casa: a água que não cabe em cantil nenhum também se perde no fim do dia, porque não há onde carregá-la. Só fora de combate.)',
  },
  falarComPlantas: {
    id: 'falarComPlantas', name: 'Falar com Plantas', level: 3, school: 'transmutação', fonte: 'srd', soFora: true, utilidade: true,
    castTime: 'action', rangeFt: 0, kind: 'utilidade', duracaoMin: 10,
    desc: 'Por 10 minutos você conversa com as plantas num raio de 9 m. Elas contam o que passou por ali (quem pisou, quem se escondeu). No jogo, onde há mato, árvore ou espinheiro, a opção "Perguntar às plantas" (clicando em você) revela quem está escondido por perto. (Simplificações: as plantas só dizem o que viram de gente e bicho; o pedido do livro de mudar o terreno (atrapalhar ou abrir caminho) fica para o Crescer Plantas. Só fora de combate.)',
  },
  encontrarFamiliar: {
    id: 'encontrarFamiliar', name: 'Convocar Familiar', level: 1, school: 'conjuração', fonte: 'srd', ritual: true, soFora: true, utilidade: true,
    castTime: 'minutos', minutos: 10, rangeFt: 10, kind: 'utilidade', duracaoMin: 0,
    desc: 'Você chama um espírito em forma de bicho miúdo (rato ou morcego) que obedece e serve de olho e ouvido seu. Não ataca; se cai a 0 PV, some e você refaz a magia. Só um por vez. No jogo, ele entra no tabuleiro e no painel do grupo e é a fera disposta de Sentidos da Fera. (Simplificações: o livro leva 1 hora e 10 po de incenso; aqui são 10 minutos, de graça; só rato e morcego, os dois que a arte do jogo tem; o familiar acompanha o grupo de cena em cena, com os PV que tinha. Sem entrega de magias de toque.)',
  },

};

/**
 * Aprimorar Atributo: as seis opções do livro. `hab` ganha vantagem nos testes;
 * `pv` são PV temporários (somem com a magia); `semQueda` anula o dano de queda.
 */
export const APRIMORAR = {
  touro: { hab: 'str', nome: 'Força do Touro' },
  gato: { hab: 'dex', nome: 'Graça do Gato', semQueda: true },
  urso: { hab: 'con', nome: 'Resistência do Urso', pv: '2d6' },
  aguia: { hab: 'cha', nome: 'Esplendor da Águia' },
  raposa: { hab: 'int', nome: 'Astúcia da Raposa' },
  coruja: { hab: 'wis', nome: 'Sabedoria da Coruja' },
};

/**
 * As opções que o jogador escolhe ao conjurar: `spell.opcoes` (lista de
 * { id, rotulo, detalhe }) ou, nas duas magias do livro que já escolhem,
 * Aprimorar Atributo e Glifo de Proteção. Sem escolha: null.
 */
export function opcoesDaMagia(spell) {
  if (spell.opcoes?.length) return spell.opcoes;
  if (spell.escolheAtributo) {
    const nomeHab = { str: 'Força', dex: 'Destreza', con: 'Constituição', int: 'Inteligência', wis: 'Sabedoria', cha: 'Carisma' };
    return Object.entries(APRIMORAR).map(([id, o]) => ({
      id, rotulo: o.nome,
      detalhe: `vantagem em ${nomeHab[o.hab]}${o.pv ? ' e 2d6 PV temporários' : ''}${o.semQueda ? ' e sem dano de queda' : ''}`,
    }));
  }
  if (spell.escolheTipoDoGlifo) {
    return ['trovejante', 'ácido', 'frio', 'fogo', 'elétrico'].map((id) => ({ id, rotulo: `Dano ${id}`, detalhe: 'o glifo explode com este tipo de dano' }));
  }
  return null;
}

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
