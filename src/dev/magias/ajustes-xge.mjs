// A MECÂNICA DE CADA MAGIA DO GUIA DE XANATHAR QUE O MOTOR CONJURA, escrita à mão e conferida contra o livro uma a uma
// (o mesmo contrato de `ajustes-phb.mjs`: a chave é o nome em inglês, os campos são os de `rules/spells.js`, e `nota` é a
// simplificação dita na cara, que vai no fim do texto da magia). O que não está aqui fica fora do jogo, na fila.
//
// As ações que uma magia concede (o sopro, o meteoro, a estrela, o jato das Investiduras, o raio da Esfera da
// Tempestade, a pedra encantada) são magias internas de `rules/magias-concedidas.js`; a magia aqui só põe a condição.
const TIPOS_DO_SOPRO = [
  { id: 'ácido', rotulo: 'Ácido' }, { id: 'frio', rotulo: 'Frio' }, { id: 'fogo', rotulo: 'Fogo' },
  { id: 'elétrico', rotulo: 'Elétrico' }, { id: 'veneno', rotulo: 'Veneno' },
];
const ELEMENTOS = [
  { id: 'ácido', rotulo: 'Ácido' }, { id: 'frio', rotulo: 'Frio' }, { id: 'fogo', rotulo: 'Fogo' },
  { id: 'elétrico', rotulo: 'Elétrico' }, { id: 'trovejante', rotulo: 'Trovejante' },
];

export const AJUSTES_XGE = {
  'Pyrotechnics': {
    kind: 'livro', efeito: 'pirotecnia', mira: 'casa', exigeChama: true, save: 'con',
    opcoes: [{ id: 'fogos', rotulo: 'Fogos de artifício', detalhe: 'CON ou cego, a 3 m' }, { id: 'fumaca', rotulo: 'Fumaça', detalhe: '6 m de raio, 1 minuto' }],
    nota: 'Vale para a chama do mapa (a tocha, o braseiro, a fogueira), que se apaga. A fumaça não se espalha com o vento.',
  },
  // ---------------------------------------------------------------- truques
  'Toll the Dead': { kind: 'save', save: 'wis', damage: '1d8', danoSeFerido: '1d12', damageType: 'necrótico', halfOnSave: false },
  'Word of Radiance': { kind: 'save', save: 'con', shape: 'sphere', areaFt: 5, centradoEmSi: true, soInimigos: true, damage: '1d6', damageType: 'radiante', halfOnSave: false },
  Thunderclap: { kind: 'save', save: 'con', shape: 'sphere', areaFt: 5, centradoEmSi: true, damage: '1d6', damageType: 'trovejante', halfOnSave: false },
  Frostbite: { kind: 'save', save: 'con', damage: '1d6', damageType: 'frio', halfOnSave: false, onFail: { condition: 'queimaduraDeGelo', rounds: 2 } },
  Infestation: {
    kind: 'save', save: 'con', damage: '1d6', damageType: 'veneno', halfOnSave: false,
    nota: 'Os ácaros mordem; o passo de 1,5 m para um lado sorteado não existe no jogo.',
  },
  'Primal Savagery': { kind: 'attack', melee: true, rangeFt: 5, damage: '1d10', damageType: 'ácido' },
  Gust: { kind: 'save', save: 'str', pushFt: 5, nota: 'É sempre o empurrão de 1,5 m; mover um objeto e soprar não existem no jogo.' },
  // A CHAMA DO MAPA (`rules/chamas.js`): a tocha, o braseiro, a fogueira que o menu de fogo já apaga e acende
  'Control Flames': {
    kind: 'livro', efeito: 'controlarChamas', mira: 'casa', exigeChama: true, familiaSonora: 'utilidade',
    opcoes: [{ id: 'apagar', rotulo: 'Apagar', detalhe: 'a chama some' }, { id: 'dobrar', rotulo: 'Dobrar a luz', detalhe: 'o claro e a penumbra' }, { id: 'metade', rotulo: 'Cortar a luz pela metade', detalhe: 'o claro e a penumbra' }],
    nota: 'Vale para a chama do mapa (a tocha, o braseiro, a fogueira). Espalhar o fogo e dar forma às chamas não existem no jogo, e a luz mudada fica até o fim da cena.',
  },
  'Create Bonfire': {
    kind: 'save', save: 'dex', shape: 'square', areaFt: 5, damage: '1d8', damageType: 'fogo', halfOnSave: false,
    zona: { rodadas: 10, quando: 'fim', aoEntrar: true, dificil: false, semTeste: true, dano: { dados: '1d8', tipo: 'fogo', save: 'dex', metade: false } },
    concentration: true, duracaoRodadas: 10,
  },
  'Magic Stone': {
    kind: 'livro', efeito: 'conceder', soSi: true, condicao: 'pedrasEncantadas', damageType: 'concussão', cargas: 3, danoComMod: '1d6', duracaoRodadas: 10,
    nota: 'As três pedras ficam com quem conjura, e cada uma se arremessa com a ação; dá-las a outro não existe no jogo.',
  },
  // ---------------------------------------------------------------- 1º círculo
  'Absorb Elements': { kind: 'reacao', gatilho: 'elemento', absorveElementos: true, nota: 'Sai sozinha quando o golpe elemental é de 8 ou mais, ou derrubaria.' },
  Catapult: {
    kind: 'save', save: 'dex', damage: '3d8', damageType: 'concussão', halfOnSave: false, upcast: { dados: 1 },
    nota: 'Há sempre uma pedra à mão para arremessar.',
  },
  'Cause Fear': {
    kind: 'save', save: 'wis', onFail: { condition: 'amedrontado', rounds: 10, repete: true }, naoAfeta: ['constructo', 'morto-vivo'],
    concentration: true, duracaoRodadas: 10, nota: 'Um alvo só; as criaturas a mais do círculo maior não existem no jogo.',
  },
  'Chaos Bolt': { kind: 'livro', efeito: 'raioDoCaos', alvo: 'criatura', damageType: 'energético' },
  'Earth Tremor': {
    kind: 'save', save: 'dex', shape: 'sphere', areaFt: 10, centradoEmSi: true, damage: '1d6', damageType: 'concussão', halfOnSave: false,
    onFail: { condition: 'caido' }, upcast: { dados: 1 }, nota: 'O chão solto que vira terreno difícil não existe no jogo.',
  },
  'Ice Knife': { kind: 'livro', efeito: 'facaDeGelo', alvo: 'criatura', damageType: 'frio' },
  'Zephyr Strike': { kind: 'buff', targets: 1, rangeFt: 0, condition: 'golpeDeZefir', concentration: true, duracaoRodadas: 10 },
  // ---------------------------------------------------------------- 2º círculo
  "Aganazzar's Scorcher": { kind: 'save', save: 'dex', shape: 'linha', areaFt: 30, larguraFt: 5, damage: '3d8', damageType: 'fogo', halfOnSave: true, upcast: { dados: 1 } },
  "Dragon's Breath": {
    kind: 'livro', efeito: 'conceder', alvo: 'criatura', condicao: 'soproDraconico', familiaSonora: 'reforco', opcoes: TIPOS_DO_SOPRO, tipoNaOpcao: true,
    danoConcedido: '3d6', cdNaCondicao: true, concentration: true, duracaoRodadas: 10,
  },
  'Dust Devil': {
    kind: 'save', save: 'str', shape: 'sphere', areaFt: 5, emVoltaDaCasa: true, soZona: true, reuso: 'bonus',
    zona: { rodadas: 10, quando: 'fim', aoEntrar: false, dificil: false, semTeste: true, movel: 30, ocupaCasa: true, dano: { dados: '1d8', tipo: 'concussão', save: 'str', metade: true } },
    concentration: true, duracaoRodadas: 10, upcast: { dados: 1 },
    nota: 'O redemoinho fere quem termina o turno colado nele; o empurrão de 3 m e a poeira que obscurece não existem no jogo.',
  },
  Earthbind: { kind: 'debuff', targets: 1, save: 'str', condition: 'presoATerra', concentration: true, duracaoRodadas: 10, nota: 'Quem voava desce na hora.' },
  'Healing Spirit': {
    kind: 'save', shape: 'square', areaFt: 5, soZona: true, reuso: 'bonus', castTime: 'bonus',
    zona: { rodadas: 10, quando: 'inicio', aoEntrar: true, dificil: false, semTeste: true, movel: 30, cura: { dados: '1d6' } },
    concentration: true, duracaoRodadas: 10, upcast: { dados: 1 },
    nota: 'Cura o aliado que entra ou começa o turno na casa do espírito, até 1 + o atributo de conjuração vezes (no mínimo duas).',
  },
  "Maximilian's Earthen Grasp": {
    kind: 'save', save: 'str', damage: '2d6', damageType: 'concussão', halfOnSave: false, onFail: { condition: 'contido', rounds: 10 },
    concentration: true, duracaoRodadas: 10, nota: 'A mão agarra uma vez; esmagar de novo com a ação e movê-la não existem no jogo.',
  },
  'Mind Spike': { kind: 'save', save: 'wis', damage: '3d8', damageType: 'psíquico', halfOnSave: true, upcast: { dados: 1 }, nota: 'Saber onde o alvo está pela hora seguinte não existe no jogo.' },
  'Shadow Blade': {
    kind: 'livro', efeito: 'conceder', soSi: true, condicao: 'laminaSombria', familiaSonora: 'reforco', arma: 'laminaSombria', concentration: true, duracaoRodadas: 10,
    nota: 'A espada tem sempre 2d8; os dados a mais do círculo maior não existem no jogo.',
  },
  "Snilloc's Snowball Swarm": { kind: 'save', save: 'dex', shape: 'sphere', areaFt: 5, damage: '3d6', damageType: 'frio', halfOnSave: true, upcast: { dados: 1 } },
  'Warding Wind': { kind: 'buff', targets: 1, rangeFt: 0, condition: 'ventoProtetor', concentration: true, duracaoRodadas: 100, nota: 'Fica o tiro que passa pelo vento com desvantagem; a surdez, as chamas apagadas e o terreno difícil não existem no jogo.' },
  // ---------------------------------------------------------------- 3º círculo
  'Enemies Abound': {
    kind: 'debuff', targets: 1, save: 'int', condition: 'inimigosEmAbundancia', concentration: true, duracaoRodadas: 10,
    nota: 'No turno, ataca alguém sorteado que alcance, como o confuso; ao sofrer dano, testa Inteligência de novo.',
  },
  'Erupting Earth': {
    kind: 'save', save: 'dex', shape: 'square', areaFt: 20, damage: '3d12', damageType: 'concussão', halfOnSave: true, upcast: { dados: 1 },
    zona: { rodadas: 600, quando: 'nunca', aoEntrar: false, dificil: true, semTeste: true },
  },
  'Flame Arrows': { kind: 'buff', targets: 1, rangeFt: 5, condition: 'flechasFlamejantes', concentration: true, duracaoRodadas: 600, nota: 'São sempre 12 disparos; as peças a mais do círculo maior não existem no jogo.' },
  'Life Transference': { kind: 'livro', efeito: 'transferirVida', alvo: 'criatura', familiaSonora: 'cura' },
  "Melf's Minute Meteors": {
    kind: 'livro', efeito: 'conceder', soSi: true, condicao: 'meteorosMinusculos', damageType: 'fogo', cargas: 3, cargasPorCirculo: 1, concentration: true, duracaoRodadas: 100,
    nota: 'Os meteoros saem de dois em dois, no mesmo ponto, numa explosão só, com a ação bônus.',
  },
  'Thunder Step': {
    kind: 'teleporte', mira: 'casa', damage: '3d10', damageType: 'trovejante', save: 'con', levaUmAliado: true,
    explosaoNaSaida: { raioFt: 10, save: 'con', tipo: 'trovejante' }, upcast: { dados: 1 },
    nota: 'O aliado que vai junto é o mais ferido dos que estão colados.',
  },
  'Tidal Wave': {
    kind: 'save', save: 'dex', shape: 'square', areaFt: 20, damage: '4d8', damageType: 'concussão', halfOnSave: true, onFail: { condition: 'caido' },
    nota: 'A onda cai num quadrado de 6 m (no livro, 9 m por 3 m), e a água que apaga o fogo não existe no jogo.',
  },
  'Wall of Sand': {
    kind: 'save', shape: 'muralha', areaFt: 30, soZona: true,
    zona: { rodadas: 100, quando: 'nunca', aoEntrar: false, dificil: false, dificil4: true, semTeste: true, barraVisao: true },
    concentration: true, duracaoRodadas: 100,
    nota: 'A muralha tem uma casa de espessura (no livro, 3 m) e cobra quatro vezes o passo (no livro, três); cegar quem está dentro não existe no jogo.',
  },
  'Wall of Water': {
    kind: 'save', shape: 'muralha', areaFt: 30, soZona: true,
    zona: { rodadas: 100, quando: 'nunca', aoEntrar: false, dificil: true, semTeste: true },
    concentration: true, duracaoRodadas: 100,
    nota: 'Fica a água que custa o dobro do passo; o tiro com desvantagem, o fogo pela metade e o gelo que congela não existem no jogo.',
  },
  // ---------------------------------------------------------------- 4º círculo
  'Charm Monster': { kind: 'debuff', targets: 1, save: 'wis', condition: 'enfeiticado', vantagemEmCombate: true, duracaoRodadas: 600, upcast: { alvos: 1 } },
  'Elemental Bane': { kind: 'livro', efeito: 'ruinaElemental', alvo: 'criatura', opcoes: ELEMENTOS, concentration: true, duracaoRodadas: 10 },
  'Guardian of Nature': {
    kind: 'livro', efeito: 'conceder', soSi: true, castTime: 'bonus', familiaSonora: 'reforco',
    porOpcao: { fera: 'guardiaoFera', arvore: 'guardiaoArvore' }, pvTemp: { arvore: 10 },
    opcoes: [
      { id: 'fera', rotulo: 'Fera Primal', detalhe: '+3 m, vantagem com arma de Força, +1d6 energético de perto' },
      { id: 'arvore', rotulo: 'Grande Árvore', detalhe: '10 PV temporários, vantagem em Constituição e com arma de Destreza ou Sabedoria' },
    ],
    concentration: true, duracaoRodadas: 10, nota: 'A visão no escuro da Fera e o terreno difícil em volta da Árvore não existem no jogo.',
  },
  'Shadow of Moil': { kind: 'buff', targets: 1, rangeFt: 0, condition: 'sombraDeMoil', concentration: true, duracaoRodadas: 10 },
  'Sickening Radiance': {
    kind: 'save', save: 'con', shape: 'sphere', areaFt: 30, soZona: true,
    zona: { rodadas: 100, quando: 'inicio', aoEntrar: true, dificil: false, semTeste: true, dano: { dados: '4d10', tipo: 'radiante', save: 'con', metade: false, exaustao: 1 } },
    concentration: true, duracaoRodadas: 100, nota: 'A luz que não deixa ninguém ficar invisível não existe no jogo.',
  },
  'Storm Sphere': {
    kind: 'save', save: 'str', shape: 'sphere', areaFt: 20, damage: '2d6', damageType: 'concussão', halfOnSave: false,
    zona: { rodadas: 10, quando: 'fim', aoEntrar: false, dificil: true, semTeste: true, dano: { dados: '2d6', tipo: 'concussão', save: 'str', metade: false } },
    concentration: true, duracaoRodadas: 10, upcast: { dados: 1 },
    nota: 'O raio da ação bônus sai de quem conjura (no livro, do centro da esfera), sem a vantagem contra quem está dentro.',
  },
  'Vitriolic Sphere': {
    kind: 'save', save: 'dex', shape: 'sphere', areaFt: 20, damage: '10d4', damageType: 'ácido', halfOnSave: true,
    onFail: { danoAtrasado: '5d4' }, upcast: { dados: 2 },
  },
  // ---------------------------------------------------------------- 5º círculo
  'Danse Macabre': {
    kind: 'animarMortos', corposBase: 5, concentration: true, duracaoRodadas: 600, upcast: { criaturas: 2 },
    opcoes: [
      { id: 'esqueleto', rotulo: 'Esqueleto', detalhe: 'CA 13, 13 PV; espada curta ou arco curto' },
      { id: 'zumbi', rotulo: 'Zumbi', detalhe: 'CA 8, 22 PV; volta com 1 PV ao cair' },
    ],
    nota: 'Os mortos erguidos não somam o atributo de conjuração no ataque e no dano.',
  },
  Dawn: {
    kind: 'save', save: 'con', shape: 'sphere', areaFt: 30, damage: '4d10', damageType: 'radiante', halfOnSave: true, reuso: 'bonus',
    zona: { rodadas: 10, quando: 'fim', aoEntrar: false, dificil: false, semTeste: true, movel: 60, dano: { dados: '4d10', tipo: 'radiante', save: 'con', metade: true } },
    concentration: true, duracaoRodadas: 10,
  },
  Enervation: {
    kind: 'save', save: 'dex', damage: '4d8', damageType: 'necrótico', halfOnSave: true, curaOConjurador: 0.5, upcast: { dados: 1 },
    nota: 'O golpe é um só; o fio que repete o dano a cada turno, com a ação, não existe no jogo.',
  },
  'Far Step': { kind: 'teleporte', mira: 'casa', rangeFt: 60, reuso: 'bonus', concentration: true, duracaoRodadas: 10 },
  'Holy Weapon': {
    kind: 'buff', targets: 1, rangeFt: 5, condition: 'armaSagradaDaMagia', concentration: true, duracaoRodadas: 600,
    nota: 'A explosão de luz ao encerrar a magia não existe no jogo.',
  },
  Immolation: {
    kind: 'save', save: 'dex', damage: '8d6', damageType: 'fogo', halfOnSave: true,
    onFail: { condition: 'imolado', rounds: 10, repete: true, danoAoFalhar: { dano: '4d6', tipo: 'fogo' } },
    concentration: true, duracaoRodadas: 10,
  },
  Maelstrom: {
    kind: 'save', save: 'str', shape: 'sphere', areaFt: 30, soZona: true,
    zona: { rodadas: 10, quando: 'inicio', aoEntrar: true, dificil: true, semTeste: true, dano: { dados: '6d6', tipo: 'concussão', save: 'str', metade: false } },
    concentration: true, duracaoRodadas: 10, nota: 'O puxão de 3 m para o centro não existe no jogo.',
  },
  'Negative Energy Flood': {
    kind: 'save', save: 'con', damage: '5d12', damageType: 'necrótico', halfOnSave: true, naoAfeta: ['morto-vivo'],
    nota: 'O morto-vivo não ganha os PV temporários do livro, e quem morre não se levanta como zumbi.',
  },
  'Steel Wind Strike': { kind: 'livro', efeito: 'ventoDeAco', alvo: 'criatura', damageType: 'energético', nota: 'Os alvos são o escolhido e os inimigos mais perto de quem conjura, até cinco.' },
  'Synaptic Static': {
    kind: 'save', save: 'int', shape: 'sphere', areaFt: 20, damage: '8d6', damageType: 'psíquico', halfOnSave: true,
    onFail: { condition: 'estaticaSinaptica', rounds: 10, repete: true },
  },
  'Wall of Light': {
    kind: 'save', save: 'con', shape: 'muralha', areaFt: 60, damage: '4d8', damageType: 'radiante', halfOnSave: true,
    onFail: { condition: 'cego', rounds: 10, repete: true },
    zona: { rodadas: 100, quando: 'fim', aoEntrar: false, dificil: false, semTeste: true, barraVisao: true, dano: { dados: '4d8', tipo: 'radiante' } },
    concentration: true, duracaoRodadas: 100, upcast: { dados: 1 },
    nota: 'O raio de luz que a muralha dispara, encolhendo, não existe no jogo.',
  },
  // ---------------------------------------------------------------- 6º círculo
  'Investiture of Flame': { kind: 'livro', efeito: 'conceder', soSi: true, condicao: 'investiduraDasChamas', familiaSonora: 'protecao', concentration: true, duracaoRodadas: 100, nota: 'O calor que fere quem chega perto não existe no jogo.' },
  'Investiture of Ice': { kind: 'livro', efeito: 'conceder', soSi: true, condicao: 'investiduraDeGelo', familiaSonora: 'protecao', concentration: true, duracaoRodadas: 100, nota: 'O chão gelado em volta não existe no jogo.' },
  'Investiture of Stone': { kind: 'livro', efeito: 'conceder', soSi: true, condicao: 'investiduraDePedra', familiaSonora: 'protecao', concentration: true, duracaoRodadas: 100, nota: 'Atravessar a pedra não existe no jogo.' },
  'Investiture of Wind': { kind: 'livro', efeito: 'conceder', soSi: true, condicao: 'investiduraDoVento', familiaSonora: 'movimento', concentration: true, duracaoRodadas: 100 },
  'Mental Prison': {
    kind: 'save', save: 'int', damage: '5d10', damageType: 'psíquico', danoSempre: true, onFail: { condition: 'prisaoMental', rounds: 10 },
    concentration: true, duracaoRodadas: 10, nota: 'Os 10d10 de quem tenta sair da prisão não existem no jogo: ele fica.',
  },
  'Primordial Ward': { kind: 'buff', targets: 1, rangeFt: 0, condition: 'protecaoPrimordial', concentration: true, duracaoRodadas: 10, nota: 'A troca da resistência por imunidade, com a reação, não existe no jogo.' },
  "Tenser's Transformation": {
    kind: 'livro', efeito: 'conceder', soSi: true, condicao: 'transformacaoDeTenser', familiaSonora: 'reforco', pvTemp: 50, concentration: true, duracaoRodadas: 100,
    nota: 'O treino em armadura, armas e resistências de Força e Constituição, e o cansaço do fim, não existem no jogo.',
  },
  // ---------------------------------------------------------------- 7º círculo e acima
  'Crown of Stars': { kind: 'livro', efeito: 'conceder', soSi: true, condicao: 'coroaDeEstrelas', damageType: 'radiante', cargas: 7, cargasPorCirculo: 2, duracaoRodadas: 600 },
  'Power Word Pain': { kind: 'matar', targets: 1, limitePv: 100, condicao: 'dorAtroz', save: 'con' },
  "Abi-Dalzim's Horrid Wilting": { kind: 'save', save: 'con', shape: 'square', areaFt: 30, damage: '12d8', damageType: 'necrótico', halfOnSave: true, naoAfeta: ['constructo', 'morto-vivo'] },
  'Maddening Darkness': {
    kind: 'save', save: 'wis', shape: 'sphere', areaFt: 60, soZona: true, contornaEsquinas: true,
    zona: { rodadas: 100, quando: 'inicio', aoEntrar: false, dificil: false, semTeste: true, obscuro: 'magica', dano: { dados: '8d8', tipo: 'psíquico', save: 'wis', metade: true } },
    concentration: true, duracaoRodadas: 100,
  },
  Invulnerability: { kind: 'buff', targets: 1, rangeFt: 0, condition: 'invulneravel', concentration: true, duracaoRodadas: 100 },
  'Psychic Scream': {
    kind: 'save', save: 'int', damage: '14d6', damageType: 'psíquico', halfOnSave: true, intMinima: 3, alvos: 10, juntosFt: 90, autoJuntos: true,
    onFail: { condition: 'atordoado', repete: true },
    nota: 'Os alvos são o escolhido e os inimigos mais perto dele, até dez.',
  },
  // ---------------------------------------------------------------- a fila do Xanathar, segunda leva (2026-11-12)
  // O que a fila tinha de LUTA e cabia nos moldes do motor: a zona que prende e anda (a Teia que se move), a zona que fere
  // e anda (o Redemoinho do Pó maior), o chão que vira lama, o terreno difícil do truque, e o dragão de sombras.
  'Mold Earth': {
    kind: 'save', shape: 'square', areaFt: 5, soZona: true,
    zona: { rodadas: 600, quando: 'nunca', aoEntrar: false, dificil: true, semTeste: true },
    nota: 'No jogo é só o terreno difícil (a terra solta num quadrado de 1,5 m, por 1 hora); cavar e desenhar no chão não existem.',
  },
  'Watery Sphere': {
    kind: 'save', save: 'str', shape: 'sphere', areaFt: 5, emVoltaDaCasa: true, onFail: { condition: 'contido' }, reuso: 'acao',
    zona: { rodadas: 10, quando: 'fim', aoEntrar: true, dificil: false, movel: 30 },
    concentration: true, duracaoRodadas: 10,
    nota: 'Quem fica contido sai com Atletismo, como da Teia. A esfera anda 9 m com a ação, mas não leva quem ela prendeu, e soltar a água no fim não existe no jogo.',
  },
  Whirlwind: {
    kind: 'save', save: 'dex', shape: 'sphere', areaFt: 10, damage: '10d6', damageType: 'concussão', halfOnSave: true, reuso: 'acao',
    zona: { rodadas: 10, quando: 'inicio', aoEntrar: true, dificil: false, semTeste: true, movel: 30, dano: { dados: '10d6', tipo: 'concussão', save: 'dex', metade: true } },
    concentration: true, duracaoRodadas: 10,
    nota: 'O redemoinho anda 9 m com a ação e fere quem está nele ou entra nele; prender e arrastar quem falha, e o arremesso de quem escapa, não existem no jogo.',
  },
  'Transmute Rock': {
    kind: 'save', save: 'str', shape: 'square', areaFt: 40, onFail: { condition: 'contido' },
    zona: { rodadas: 600, quando: 'nunca', aoEntrar: false, dificil4: true },
    nota: 'No jogo é só a Rocha em Lama, e vale em qualquer chão: cada passo custa quatro vezes, e quem estava no chão ao conjurar afunda (contido, sai com Atletismo). A Lama em Rocha não existe no jogo.',
  },
  'Illusory Dragon': {
    kind: 'livro', efeito: 'dragaoIlusorio', mira: 'casa', save: 'wis', opcoes: [
      { id: 'ácido', rotulo: 'Ácido' }, { id: 'frio', rotulo: 'Frio' }, { id: 'fogo', rotulo: 'Fogo' }, { id: 'elétrico', rotulo: 'Elétrico' },
      { id: 'necrótico', rotulo: 'Necrótico' }, { id: 'veneno', rotulo: 'Veneno' },
    ],
    concentration: true, duracaoRodadas: 10,
    nota: 'O dragão é uma sombra no ponto escolhido: ao surgir, cada inimigo que o vê a até 36 m testa Sabedoria ou fica amedrontado. O sopro (ação bônus) sai de quem conjura, e não do dragão, e o dragão não anda no tabuleiro.',
  },
  // ---------------------------------------------------------------- a fila do Xanathar (2026-11-16)
  'Beast Bond': {
    kind: 'livro', efeito: 'vinculoBestial', alvo: 'criatura', concentration: true, duracaoRodadas: 100, familiaSonora: 'utilidade',
    nota: 'A fera tem de ser aliada; o elo telepático que a deixa entender quem conjurou é dela, e não muda nada no tabuleiro.',
  },
  'Mass Polymorph': {
    kind: 'livro', efeito: 'metamorfose', massa: 10, concentration: true, duracaoRodadas: 600,
    opcoes: [{ id: 'inimigos', rotulo: 'Os inimigos', detalhe: 'até dez, viram rã (Sabedoria resiste)' }, { id: 'aliados', rotulo: 'Os aliados', detalhe: 'até dez, viram a fera mais forte que o nível deixa' }],
    nota: 'Todos os alvos são do mesmo lado, os mais perto: o inimigo vira rã e o aliado, a fera mais forte que o nível dele deixa.',
  },
  Scatter: {
    kind: 'livro', efeito: 'dispersao', save: 'wis', familiaSonora: 'utilidade',
    opcoes: [{ id: 'inimigos', rotulo: 'Espalhar os inimigos', detalhe: 'até cinco a 9 m, para longe do grupo (Sabedoria resiste)' }, { id: 'aliados', rotulo: 'Tirar os aliados', detalhe: 'até cinco a 9 m, para longe dos inimigos' }],
    nota: 'Quem conjura escolhe um lado; o jogo põe cada um na casa livre e à vista, a até 36 m, mais longe do outro lado.',
  },
  'Bones of the Earth': {
    kind: 'livro', efeito: 'ossosDaTerra', mira: 'casa', pontosLivres: 6, rangeFt: 120, familiaSonora: 'utilidade',
    nota: 'Os pilares nascem só em chão livre: o que ergue quem está em cima e o que esmaga no teto não existem no jogo, e os pilares não se quebram. No círculo maior, os dois pilares a mais não existem.',
  },
  'Summon Lesser Demons': {
    kind: 'livro', efeito: 'demoniosMenores', rangeFt: 60, concentration: true, duracaoRodadas: 600, familiaSonora: 'invocacao',
    nota: 'O d6 escolhe: dois quasits, quatro dretches ou oito manes. Eles atacam qualquer um que não seja demônio, de qualquer lado. O círculo de sangue que protege quem conjura não existe no jogo.',
  },
  'Summon Greater Demon': {
    kind: 'livro', efeito: 'demonioMaior', rangeFt: 60, concentration: true, duracaoRodadas: 600, familiaSonora: 'invocacao',
    nota: 'O demônio é o mais forte que o círculo deixa (barlgura, vrock, hezrou, glabrezu, yochlol). Passando no Carisma do fim de um turno dele, vira hostil a todos. O nome verdadeiro e o círculo de sangue não existem no jogo.',
  },
  'Wrath of Nature': {
    kind: 'livro', efeito: 'iraDaNatureza', shape: 'square', areaFt: 60, rangeFt: 120, concentration: true, duracaoRodadas: 10, familiaSonora: 'invocacao',
    nota: 'O mato que deixa o chão difícil só para os inimigos não existe no jogo: o motor não tem terreno difícil de um lado só. As árvores que açoitam são as do mapa; as raízes prendem, no fim de cada turno de quem conjura, o inimigo da área mais perto dele.',
  },
  // ---------------------------------------------------------------- as três que sobravam (2026-11-16)
  'Skill Empowerment': {
    kind: 'livro', efeito: 'aprimorarPericia', alvo: 'criatura', concentration: true, duracaoRodadas: 600, familiaSonora: 'reforco',
    opcoes: Object.entries({
      acrobacia: 'Acrobacia', adestrarAnimais: 'Adestrar Animais', arcanismo: 'Arcanismo', atletismo: 'Atletismo', atuacao: 'Atuação',
      enganacao: 'Enganação', furtividade: 'Furtividade', historia: 'História', intimidacao: 'Intimidação', intuicao: 'Intuição',
      investigacao: 'Investigação', medicina: 'Medicina', natureza: 'Natureza', percepcao: 'Percepção', persuasao: 'Persuasão',
      prestidigitacao: 'Prestidigitação', religiao: 'Religião', sobrevivencia: 'Sobrevivência',
    }).map(([id, rotulo]) => ({ id, rotulo })),
    nota: 'Na luta, a perícia é uma das opções; explorando, o jogo pergunta entre as que o alvo tem treinadas.',
  },
  'Control Winds': {
    kind: 'livro', efeito: 'controlarVentos', shape: 'square', areaFt: 100, rangeFt: 300, concentration: true, duracaoRodadas: 600, familiaSonora: 'utilidade',
    opcoes: [{ id: 'rajadas', rotulo: 'Rajadas', detalhe: 'desvantagem na arma à distância pelo cubo' }, { id: 'descendente', rotulo: 'Corrente descendente', detalhe: 'a mesma desvantagem, e quem voa cai' }, { id: 'ascendente', rotulo: 'Corrente ascendente', detalhe: 'a queda dentro dela fere a metade' }],
    nota: 'As rajadas são sempre as fortes, e o deslocamento dobrado contra o vento não existe no jogo (o motor não tem terreno de uma direção só); o pulo mais alto da corrente ascendente também não.',
  },
  'Soul Cage': {
    kind: 'reacao', gatilho: 'morteHumanoide', duracaoRodadas: 4800, familiaSonora: 'utilidade',
    nota: 'Sai sozinha, como a Queda Suave, quando não há alma presa. Roubar Vida e Emprestar Experiência são ações bônus; perguntar à alma e os olhos do morto só se narrariam e não existem no jogo.',
  },
};
