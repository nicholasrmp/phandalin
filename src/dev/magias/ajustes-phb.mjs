// A MECÂNICA DE CADA MAGIA DO PHB QUE O MOTOR CONJURA, escrita à mão e conferida contra o livro uma a uma.
//
// O importador (`importar-magias.mjs`) só mecaniza o que está AQUI. A leitura automática do dado errava justamente nas
// magias que importam — a Barreira de Lâminas saía como dano num alvo só, a Palavra de Poder Atordoar ganhava um teste
// que o livro não dá, o Geas virava dano psíquico —, então ela serve de rascunho e quem decide é esta tabela. A chave
// é o nome em inglês; os campos são os de `rules/spells.js`; `nota` é a simplificação, dita na cara, que vai no fim do
// texto da magia. O que não está aqui entra sem motor ("ainda sem efeito no jogo").
export const AJUSTES_PHB = {
  // ---------------------------------------------------------------- dano
  Blight: { kind: 'save', save: 'con', damage: '8d8', damageType: 'necrótico', halfOnSave: true, naoAfeta: ['morto-vivo', 'constructo'], upcast: { dados: 1 } },
  Harm: { kind: 'save', save: 'con', damage: '14d6', damageType: 'necrótico', halfOnSave: true, reduzMaximo: true, naoMata: true, naoAfeta: ['morto-vivo', 'constructo'] },
  'Destructive Wave': {
    kind: 'save', save: 'con', shape: 'sphere', areaFt: 30, centradoEmSi: true, soInimigos: true,
    damage: '5d6', damageType: 'trovejante', damage2: '5d6', damageType2: 'radiante', halfOnSave: true, onFail: { condition: 'caido' },
    nota: 'A metade que o livro deixa escolher entre radiante e necrótico é sempre radiante.',
  },
  'Fire Storm': {
    kind: 'save', save: 'dex', shape: 'square', areaFt: 30, damage: '7d10', damageType: 'fogo', halfOnSave: true,
    nota: 'O livro deixa arrumar dez cubos de 3 m como quiser; aqui é um bloco só de 9 m.',
  },
  'Delayed Blast Fireball': {
    kind: 'save', save: 'dex', shape: 'sphere', areaFt: 20, contornaEsquinas: true, damage: '12d6', damageType: 'fogo', halfOnSave: true, upcast: { dados: 1 },
    nota: 'A conta explode na hora; a espera que soma 1d6 por rodada não existe no jogo.',
  },
  "Otiluke's Freezing Sphere": {
    kind: 'save', save: 'con', shape: 'sphere', areaFt: 60, damage: '10d6', damageType: 'frio', halfOnSave: true, upcast: { dados: 1 },
    nota: 'O globo que se guarda para jogar depois e a água que congela não existem no jogo.',
  },
  Sunburst: {
    kind: 'save', save: 'con', shape: 'sphere', areaFt: 60, damage: '12d6', damageType: 'radiante', halfOnSave: true,
    onFail: { condition: 'cego', rounds: 10, repete: true },
  },
  Sunbeam: {
    kind: 'save', save: 'con', shape: 'linha', areaFt: 60, larguraFt: 5, damage: '6d8', damageType: 'radiante', halfOnSave: true,
    onFail: { condition: 'cego', rounds: 1 },
    nota: 'Sai uma linha só; as linhas novas a cada turno e a luz do sol na mão não existem no jogo.',
  },
  'Insect Plague': {
    kind: 'save', save: 'con', shape: 'sphere', areaFt: 20, soZona: true,
    zona: { rodadas: 100, quando: 'inicio', aoEntrar: true, dificil: true, semTeste: true, dano: { dados: '4d10', tipo: 'perfurante', save: 'con', metade: true } },
    concentration: true, duracaoRodadas: 100, upcast: { dados: 1 },
    nota: 'Os insetos ferem quem entra e quem começa o turno na nuvem; a picada de quando ela surge e a escuridão leve não existem no jogo.',
  },
  'Incendiary Cloud': {
    kind: 'save', save: 'dex', shape: 'sphere', areaFt: 20, soZona: true,
    zona: { rodadas: 10, quando: 'fim', aoEntrar: true, dificil: false, semTeste: true, obscuro: 'pesada', dano: { dados: '10d8', tipo: 'fogo', save: 'dex', metade: true } },
    concentration: true, duracaoRodadas: 10,
    nota: 'A nuvem fica parada; no livro ela se afasta 3 m por turno.',
  },
  'Blade Barrier': {
    kind: 'save', save: 'dex', shape: 'muralha', areaFt: 100, damage: '6d10', damageType: 'cortante', halfOnSave: true,
    muralhaAnel: 30,
    zona: { rodadas: 100, quando: 'inicio', aoEntrar: true, dificil: true, semTeste: true, dano: { dados: '6d10', tipo: 'cortante', save: 'dex', metade: true } },
    concentration: true, duracaoRodadas: 100,
    nota: 'A cobertura de três quartos que a muralha dá a quem está atrás dela não existe no jogo.',
  },
  "Evard's Black Tentacles": {
    kind: 'save', save: 'dex', shape: 'square', areaFt: 20, soZona: true, onFail: { condition: 'contido' },
    zona: { rodadas: 10, quando: 'inicio', aoEntrar: true, dificil: true, dano: { dados: '3d6', tipo: 'concussão' } },
    concentration: true, duracaoRodadas: 10,
  },
  Earthquake: {
    kind: 'save', save: 'con', shape: 'sphere', areaFt: 100, soZona: true, onFail: { condition: 'caido' },
    zona: { rodadas: 10, quando: 'fimDono', aoEntrar: false, dificil: true },
    concentration: true, duracaoRodadas: 10,
    nota: 'O chão treme e derruba; as fendas que se abrem e as construções que desabam não existem no jogo.',
  },
  // ---------------------------------------------------------------- condição
  Confusion: {
    kind: 'save', save: 'wis', shape: 'sphere', areaFt: 10, onFail: { condition: 'confuso', rounds: 10, repete: true },
    concentration: true, duracaoRodadas: 10,
    nota: 'O jogo usa o resumo da confusão (sem reações e com desvantagem), não o d10 do livro.',
  },
  'Dominate Person': { kind: 'debuff', targets: 1, save: 'wis', condition: 'dominado', soTipo: 'humanoide', concentration: true, duracaoRodadas: 10, vantagemEmCombate: true },
  'Dominate Monster': { kind: 'debuff', targets: 1, save: 'wis', condition: 'dominado', concentration: true, duracaoRodadas: 600, vantagemEmCombate: true },
  'Dominate Beast': { kind: 'debuff', targets: 1, save: 'wis', condition: 'dominado', soTipo: 'fera', concentration: true, duracaoRodadas: 10, vantagemEmCombate: true },
  'Mass Suggestion': { kind: 'debuff', targets: 12, save: 'wis', condition: 'sugerido', duracaoRodadas: 14400 },
  'Flesh to Stone': {
    kind: 'debuff', targets: 1, save: 'con', condition: 'petrificando', concentration: true, duracaoRodadas: 10,
    nota: 'Uma falha a mais vira pedra, e um sucesso a mais livra; o livro pede três de um lado.',
  },
  'Power Word Stun': { kind: 'matar', targets: 1, limitePv: 150, condicao: 'atordoado', save: 'con' },
  "Otto's Irresistible Dance": { kind: 'matar', targets: 1, condicao: 'dancando', save: 'wis', concentration: true, duracaoRodadas: 10 },
  Feeblemind: { kind: 'save', save: 'int', damage: '4d6', damageType: 'psíquico', halfOnSave: false, onFail: { condition: 'debilitado', rounds: Infinity } },
  // ---------------------------------------------------------------- ataque de magia
  Contagion: {
    kind: 'attack', melee: true, applies: { condition: 'envenenado', rounds: 100000 },
    nota: 'O toque envenena; a doença que vem depois de três falhas não existe no jogo.',
  },
  'Plane Shift': {
    kind: 'attack', melee: true, applies: { condition: 'banidoDeVez', save: 'cha' },
    nota: 'Na luta, a magia é a de mandar o alvo embora; levar o grupo a outro plano não existe no jogo.',
  },
  // ---------------------------------------------------------------- proteção e reforço
  'Globe of Invulnerability': { kind: 'buff', targets: 1, rangeFt: 0, condition: 'globo', concentration: true, duracaoRodadas: 10 },
  'Fire Shield': { kind: 'buff', targets: 1, rangeFt: 0, condition: 'escudoDeFogo', duracaoRodadas: 100, nota: 'É sempre o escudo quente: resiste a frio e queima quem bate.' },
  'Mind Blank': { kind: 'buff', targets: 1, condition: 'menteVazia', duracaoRodadas: 14400 },
  'True Seeing': { kind: 'buff', targets: 1, condition: 'visaoVerdadeira', duracaoRodadas: 600 },
  'Holy Aura': { kind: 'buff', targets: 8, rangeFt: 30, condition: 'auraSagrada', concentration: true, duracaoRodadas: 10 },
  'Staggering Smite': { kind: 'buff', targets: 1, rangeFt: 0, condition: 'golpeAturdidor', concentration: true, duracaoRodadas: 10 },
  'Time Stop': { kind: 'buff', targets: 1, rangeFt: 0, condition: 'tempoParado' },
  'Greater Restoration': { kind: 'restaurar', remove: ['enfeiticado', 'petrificado', 'petrificando', 'rogado', 'bruxaria', 'deformado', 'amaldicoadoLamia', 'malditoVil', 'debilitado'] },
  Regenerate: { kind: 'heal', heal: '4d8+15', nota: 'Cura na hora; o 1 PV por rodada e o membro que volta não existem no jogo.' },
  // ================================================================ a segunda leva: as magias de combate
  // ---------------------------------------------------------------- invocações (os pacotes, como no Conjurar Animais)
  'Conjure Elemental': {
    kind: 'invocar', invocacao: 'elemental', pacoteFixo: true, concentration: true, duracaoRodadas: 600, pacotePadrao: 'terra',
    pacotes: {
      terra: { n: 1, defId: 'elementalDaTerra', rotulo: 'Elemental da terra', detalhe: 'ND 5, atravessa pedra' },
      fogo: { n: 1, defId: 'elementalDoFogo', rotulo: 'Elemental do fogo', detalhe: 'ND 5, queima quem toca' },
      agua: { n: 1, defId: 'elementalDaAgua', rotulo: 'Elemental da água', detalhe: 'ND 5, engolfa' },
      ar: { n: 1, defId: 'elementalDoAr', rotulo: 'Elemental do ar', detalhe: 'ND 5, redemoinho' },
    },
    nota: 'O elemental surge ao lado de quem conjura e obedece sempre; o livro pede uma porção do elemento a até 27 m, e no círculo maior o ND sobe, o que aqui não muda.',
  },
  'Conjure Minor Elementals': {
    kind: 'invocar', invocacao: 'elemental', concentration: true, duracaoRodadas: 600, pacotePadrao: 'nd1',
    pacotes: {
      nd2: { n: 1, defId: 'gargula', rotulo: '1 elemental de ND 2', detalhe: 'uma gárgula' },
      nd1: { n: 2, defId: 'serpenteDeFogo', rotulo: '2 elementais de ND 1', detalhe: 'duas serpentes de fogo' },
      nd12: { n: 4, defId: 'mefitDePoeira', rotulo: '4 elementais de ND 1/2', detalhe: 'quatro mefites de poeira' },
      nd14: { n: 8, defId: 'mefiteDeVapor', rotulo: '8 elementais de ND 1/4', detalhe: 'oito mefites de vapor' },
    },
  },
  'Conjure Woodland Beings': {
    kind: 'invocar', invocacao: 'fadas', concentration: true, duracaoRodadas: 600, pacotePadrao: 'nd12',
    pacotes: {
      nd1: { n: 2, defId: 'driade', rotulo: '2 fadas de ND 1', detalhe: 'duas dríades' },
      nd12: { n: 4, defId: 'satiro', rotulo: '4 fadas de ND 1/2', detalhe: 'quatro sátiros' },
      nd14: { n: 8, defId: 'pixie', rotulo: '8 fadas de ND 1/4', detalhe: 'oito pixies' },
    },
    nota: 'Não há fada de ND 2 no jogo; ficam os outros três pacotes.',
  },
  'Conjure Fey': {
    kind: 'invocar', invocacao: 'fadas', pacoteFixo: true, concentration: true, duracaoRodadas: 600, pacotePadrao: 'fera',
    pacotes: { fera: { n: 1, defId: 'mamute', rotulo: 'Espírito feérico em forma de fera', detalhe: 'um mamute, ND 6' } },
    nota: 'Não há fada de ND 6 no jogo: vem o espírito feérico em forma de fera, que o livro também permite.',
  },
  'Conjure Celestial': {
    kind: 'invocar', invocacao: 'celestial', pacoteFixo: true, concentration: true, duracaoRodadas: 600, pacotePadrao: 'couatl',
    pacotes: {
      couatl: { n: 1, defId: 'couatl', rotulo: 'Celestial de ND 4', detalhe: 'um couatl' },
      unicornio: { n: 1, defId: 'unicornio', rotulo: 'Celestial de ND 5 (9º círculo)', detalhe: 'um unicórnio' },
    },
  },
  'Giant Insect': {
    kind: 'invocar', invocacao: 'insetos', pacoteFixo: true, concentration: true, duracaoRodadas: 100, pacotePadrao: 'aranhas',
    pacotes: {
      centopeias: { n: 10, defId: 'centopeiaGigante', rotulo: '10 centopeias gigantes', detalhe: 'ND 1/4' },
      aranhas: { n: 3, defId: 'aranhaGigante', rotulo: '3 aranhas gigantes', detalhe: 'ND 1' },
      vespas: { n: 5, defId: 'vespaGigante', rotulo: '5 vespas gigantes', detalhe: 'ND 1/2' },
      escorpiao: { n: 1, defId: 'escorpiaoGigante', rotulo: '1 escorpião gigante', detalhe: 'ND 3' },
    },
    nota: 'Os insetos surgem já grandes; o livro transforma insetos comuns que estejam por perto.',
  },
  'Animate Objects': {
    kind: 'invocar', invocacao: 'objetos', pacoteFixo: true, concentration: true, duracaoRodadas: 10, pacotePadrao: 'miudos',
    pacotes: {
      miudos: { n: 10, defId: 'objetoAnimadoMiudo', rotulo: '10 objetos miúdos', detalhe: '20 PV, CA 18, +8 e 1d4+4' },
      pequenos: { n: 10, defId: 'objetoAnimadoPequeno', rotulo: '10 objetos pequenos', detalhe: '25 PV, CA 16, +6 e 1d8+2' },
      medios: { n: 5, defId: 'objetoAnimadoMedio', rotulo: '5 objetos médios', detalhe: '40 PV, CA 13, +5 e 2d6+1' },
      grandes: { n: 2, defId: 'objetoAnimadoGrande', rotulo: '2 objetos grandes', detalhe: '50 PV, CA 10, +6 e 2d10+2' },
      enorme: { n: 1, defId: 'objetoAnimadoEnorme', rotulo: '1 objeto enorme', detalhe: '80 PV, CA 10, +8 e 2d12+4' },
    },
    nota: 'Os objetos surgem ao lado de quem conjura; no círculo maior, os dois objetos a mais por círculo não existem no jogo.',
  },
  'Create Undead': {
    kind: 'animarMortos', criaturaDoCorpo: 'ghoul', corposBase: 3, upcast: { criaturas: 1 },
    nota: 'Erguem-se carniçais em qualquer círculo; a escolha de lívidos e múmias nos círculos mais altos não existe no jogo.',
  },
  // ---------------------------------------------------------------- transformação (o motor da Forma Selvagem)
  Polymorph: { kind: 'livro', efeito: 'metamorfose', alvo: 'criatura', concentration: true, duracaoRodadas: 600, nota: 'O inimigo vira rã; o aliado vira a fera mais forte que o nível dele permite.' },
  'True Polymorph': { kind: 'livro', efeito: 'metamorfose', alvo: 'criatura', concentration: true, duracaoRodadas: 600, nota: 'O inimigo vira rã e o aliado, fera; virar objeto, ou outra criatura qualquer, não existe no jogo.' },
  'Animal Shapes': { kind: 'livro', efeito: 'metamorfose', raioFt: 30, crMax: 4, concentration: true, duracaoRodadas: 14400, nota: 'Todo aliado a 9 m vira a mesma fera de ND 4 ou menos.' },
  Shapechange: { kind: 'livro', efeito: 'metamorfose', soSi: true, crMax: 'nivel', concentration: true, duracaoRodadas: 600, nota: 'A forma é escolhida pelo jogo: o dragão ou a fera mais forte que o nível permite.' },
  // ---------------------------------------------------------------- dano e controle
  'Prismatic Spray': { kind: 'livro', efeito: 'prismatico', shape: 'cone', areaFt: 60, nota: 'O raio anil começa a petrificar como o olhar da medusa, e o violeta só cega; o livro leva três testes a cada um.' },
  'Divine Word': { kind: 'livro', efeito: 'palavraDivina', raioFt: 30 },
  Weird: {
    kind: 'save', save: 'wis', shape: 'sphere', areaFt: 30, concentration: true, duracaoRodadas: 10,
    onFail: { condition: 'amedrontado', rounds: 10, repete: true, danoAoFalhar: { dano: '4d10', tipo: 'psíquico' } },
  },
  Tsunami: {
    kind: 'save', save: 'str', shape: 'linha', areaFt: 300, larguraFt: 50, damage: '6d10', damageType: 'concussão', halfOnSave: true,
    nota: 'A onda bate uma vez; a muralha de água que anda e volta a bater a cada turno não existe no jogo.',
  },
  'Storm of Vengeance': { kind: 'livro', efeito: 'tempestade', concentration: true, duracaoRodadas: 10, nota: 'A nuvem pega todos os inimigos do mapa; o vento e a chuva gelada dos últimos turnos não existem no jogo.' },
  'Reverse Gravity': {
    kind: 'save', save: 'dex', shape: 'sphere', areaFt: 50, onFail: { condition: 'levitando' }, concentration: true, duracaoRodadas: 10,
    nota: 'Quem falha flutua sem chão, longe do alcance dos golpes de perto, e cai quando a magia acaba; o teto de 30 m do livro não existe no tabuleiro.',
  },
  Eyebite: {
    kind: 'save', save: 'wis', onFail: { condition: 'amedrontado', rounds: 10, repete: true, foge: true }, concentration: true, duracaoRodadas: 10,
    nota: 'É sempre o olhar do pânico, uma vez; o livro deixa olhar de novo a cada turno e escolher entre sono, pânico e náusea.',
  },
  Compulsion: {
    kind: 'save', save: 'wis', shape: 'sphere', areaFt: 30, centradoEmSi: true, soInimigos: true, onFail: { condition: 'compelido', rounds: 10, repete: true },
    concentration: true, duracaoRodadas: 10, nota: 'A direção é sempre para longe de quem conjura.',
  },
  // ---------------------------------------------------------------- prisões
  Forcecage: { kind: 'livro', efeito: 'jaula', shape: 'square', areaFt: 10, nota: 'É a jaula de grades: quem está dentro não sai, mas golpe e magia passam; a fuga por teletransporte não existe no jogo.' },
  "Otiluke's Resilient Sphere": { kind: 'debuff', targets: 1, save: 'dex', condition: 'esferaResiliente', concentration: true, duracaoRodadas: 10 },
  Maze: { kind: 'matar', targets: 1, condicao: 'labirinto', concentration: true, duracaoRodadas: 100 },
  Imprisonment: { kind: 'debuff', targets: 1, save: 'wis', condition: 'banidoDeVez', nota: 'A prisão é sempre a de fora deste mundo; as outras formas do livro não mudam nada numa luta.' },
  // ---------------------------------------------------------------- auras e campos
  'Antilife Shell': { kind: 'buff', targets: 1, rangeFt: 0, condition: 'conchaAntivida', concentration: true, duracaoRodadas: 600 },
  'Aura of Life': { kind: 'buff', targets: 1, rangeFt: 0, condition: 'auraDeVida', concentration: true, duracaoRodadas: 100 },
  'Aura of Purity': { kind: 'buff', targets: 1, rangeFt: 0, condition: 'auraDePureza', concentration: true, duracaoRodadas: 100 },
  'Circle of Power': { kind: 'buff', targets: 1, rangeFt: 0, condition: 'circuloDePoder', concentration: true, duracaoRodadas: 100 },
  'Antimagic Field': { kind: 'buff', targets: 1, rangeFt: 0, condition: 'campoAntimagia', concentration: true, duracaoRodadas: 600 },
  'Dispel Evil and Good': { kind: 'buff', targets: 1, rangeFt: 0, condition: 'dissiparBemEMal', concentration: true, duracaoRodadas: 10, nota: 'O toque que desfaz o encanto e o que manda a criatura de volta ao plano dela não existem no jogo.' },
  Foresight: { kind: 'buff', targets: 1, condition: 'presciencia', duracaoRodadas: 4800 },
  Mislead: { kind: 'buff', targets: 1, rangeFt: 0, condition: 'invisivel', concentration: true, duracaoRodadas: 600, nota: 'Fica a invisibilidade; o duplo ilusório não existe no jogo.' },
  // ---------------------------------------------------------------- peças conjuradas
  "Bigby's Hand": { kind: 'livro', efeito: 'peca', defId: 'maoDeBigby', concentration: true, duracaoRodadas: 10, upcast: { dados: 2 }, nota: 'A mão soca sozinha no turno dela; empurrar, agarrar e se pôr no caminho não existem no jogo.' },
  "Mordenkainen's Sword": { kind: 'livro', efeito: 'peca', defId: 'espadaDeMordenkainen', concentration: true, duracaoRodadas: 10 },
  'Grasping Vine': { kind: 'livro', efeito: 'vinha', alvo: 'criatura', concentration: true, duracaoRodadas: 10, nota: 'A vinha puxa uma vez, para perto de quem a conjurou; puxar de novo a cada turno não existe no jogo.' },
  // ---------------------------------------------------------------- golpes e disparos
  'Banishing Smite': { kind: 'buff', targets: 1, rangeFt: 0, condition: 'golpeBanidor', concentration: true, duracaoRodadas: 10 },
  'Swift Quiver': { kind: 'buff', targets: 1, rangeFt: 0, condition: 'aljavaVeloz', concentration: true, duracaoRodadas: 10 },
  'Conjure Volley': { kind: 'save', save: 'dex', shape: 'sphere', areaFt: 40, damage: '8d8', damageType: 'perfurante', halfOnSave: true, nota: 'O dano é sempre perfurante, o da flecha.' },
  // ---------------------------------------------------------------- cura e força da mente
  'Mass Heal': { kind: 'livro', efeito: 'curaEmMassa' },
  'Power Word Heal': { kind: 'livro', efeito: 'palavraCurar', alvo: 'criatura' },
  Telekinesis: { kind: 'livro', efeito: 'telecinese', alvo: 'criatura', concentration: true, duracaoRodadas: 100, nota: 'Ergue e joga uma vez; segurar de novo a cada turno e mover objetos não existem no jogo.' },
};
