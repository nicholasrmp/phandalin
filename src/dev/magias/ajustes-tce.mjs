// A MECÂNICA DE CADA MAGIA DO CALDEIRÃO DE TASHA QUE O MOTOR CONJURA, escrita à mão e conferida contra o livro (o mesmo
// contrato de `ajustes-phb.mjs` e `ajustes-xge.mjs`). As nove INVOCAÇÕES chamam os espíritos de
// `rules/monsters/espiritos-tce.js`, que crescem com o círculo e com quem conjura (`espirito: true`).
const invocacao = (padrao, pacotes, nota) => ({
  kind: 'invocar', invocacao: 'espirito', espirito: true, pacoteFixo: true, concentration: true, duracaoRodadas: 600,
  pacotePadrao: padrao, pacotes, ...(nota ? { nota } : {}),
});
const p = (defId, rotulo, detalhe) => ({ n: 1, defId, rotulo, detalhe });

export const AJUSTES_TCE = {
  // ---------------------------------------------------------------- truques
  'Booming Blade': { kind: 'livro', efeito: 'laminaDeTruque', efeitoLamina: 'trovao', alvo: 'criatura', rangeFt: 5, damageType: 'trovejante' },
  'Green-Flame Blade': { kind: 'livro', efeito: 'laminaDeTruque', efeitoLamina: 'chama', alvo: 'criatura', rangeFt: 5, damageType: 'fogo' },
  'Lightning Lure': { kind: 'livro', efeito: 'atracaoEletrica', alvo: 'criatura', damageType: 'elétrico' },
  'Mind Sliver': { kind: 'save', save: 'int', damage: '1d6', damageType: 'psíquico', halfOnSave: false, onFail: { condition: 'lascaMental', rounds: 2 } },
  'Sword Burst': { kind: 'save', save: 'dex', shape: 'sphere', areaFt: 5, centradoEmSi: true, damage: '1d6', damageType: 'energético', halfOnSave: false },
  // ---------------------------------------------------------------- 1º a 3º círculo
  "Tasha's Caustic Brew": {
    kind: 'save', save: 'dex', shape: 'linha', areaFt: 30, larguraFt: 5, onFail: { condition: 'acidoCaustico', rounds: 10, dadoDoDano: '2d4' },
    concentration: true, duracaoRodadas: 10, upcast: { dados: 2 },
    nota: 'Raspar o ácido com a ação não existe no jogo: ele fica até a concentração acabar.',
  },
  "Tasha's Mind Whip": {
    kind: 'save', save: 'int', damage: '3d6', damageType: 'psíquico', halfOnSave: true, onFail: { condition: 'chicoteMental', rounds: 1 },
    nota: 'Um alvo só; os alvos a mais do círculo maior e o limite de mover-se ou agir não existem no jogo, só o de ação ou ação bônus.',
  },
  'Intellect Fortress': { kind: 'buff', targets: 1, rangeFt: 30, condition: 'fortalezaDoIntelecto', concentration: true, duracaoRodadas: 600, upcast: { alvos: 1 } },
  'Spirit Shroud': {
    kind: 'livro', efeito: 'conceder', soSi: true, castTime: 'bonus', condicao: 'mortalhaEspiritual', tipoNaOpcao: true, dadoNoAcertoACada2: 'd8',
    opcoes: [{ id: 'radiante', rotulo: 'Radiante' }, { id: 'necrótico', rotulo: 'Necrótico' }, { id: 'frio', rotulo: 'Frio' }],
    concentration: true, duracaoRodadas: 10, familiaSonora: 'reforco',
    nota: 'O dano a mais vale nos golpes com arma; o passo mais curto de quem começa o turno perto não existe no jogo.',
  },
  // ---------------------------------------------------------------- 6º e 9º círculo
  "Tasha's Otherworldly Guise": {
    kind: 'livro', efeito: 'conceder', soSi: true, castTime: 'bonus', familiaSonora: 'protecao',
    porOpcao: { inferior: 'aparenciaInferior', superior: 'aparenciaSuperior' },
    opcoes: [
      { id: 'inferior', rotulo: 'Planos Inferiores', detalhe: 'imune a fogo e veneno' },
      { id: 'superior', rotulo: 'Planos Superiores', detalhe: 'imune a radiante e necrótico' },
    ],
    concentration: true, duracaoRodadas: 10,
    nota: 'O golpe com arma continua com o atributo da arma (no livro, passa a ser o de conjuração).',
  },
  'Blade of Disaster': {
    kind: 'arma', melee: true, reuso: 'bonus', alcanceDaArmaFt: 30, damage: '4d12', damageType: 'energético', golpes: 2,
    concentration: true, duracaoRodadas: 10,
    nota: 'O crítico é o de sempre (no livro, de 18 a 20 e com o triplo dos dados).',
  },
  // ---------------------------------------------------------------- invocações
  'Summon Beast': invocacao('terra', {
    terra: p('espiritoBestialTerra', 'Terra', 'escala, táticas de matilha'),
    ar: p('espiritoBestialAr', 'Ar', 'voa 18 m e não dá brecha ao voar'),
    agua: p('espiritoBestialAgua', 'Água', 'nada, táticas de matilha'),
  }),
  'Summon Fey': invocacao('feerico', { feerico: p('espiritoFeerico', 'Espírito feérico', 'espada curta e 1d6 de energético') },
    'O teleporte de ação bônus e os humores (furioso, alegre, astuto) não existem no jogo.'),
  'Summon Shadowspawn': invocacao('sombra', { sombra: p('espiritoDasSombras', 'Espírito das sombras', 'rasgo gelado, resiste a necrótico') },
    'O grito que amedronta e os medos (fúria, desespero, pavor) não existem no jogo.'),
  'Summon Undead': invocacao('fantasmagorico', {
    fantasmagorico: p('espiritoMortoFantasmagorico', 'Fantasmagórico', 'voa, atravessa parede, toque que amedronta'),
    putrido: p('espiritoMortoPutrido', 'Pútrido', 'garra podre'),
    esqueletico: p('espiritoMortoEsqueletico', 'Esquelético', 'raio da cova a 45 m'),
  }, 'A aura que envenena do pútrido, e a paralisia da garra dele, não existem no jogo.'),
  'Summon Aberration': invocacao('observador', {
    observador: p('espiritoAberranteObservador', 'Observador', 'voa e fere a mente a 45 m'),
    slaad: p('espiritoAberranteSlaad', 'Slaad', 'garras, regenera 5 por turno'),
    estelar: p('espiritoAberranteEstelar', 'Cria estelar', 'pancada psíquica'),
  }, 'A aura que sussurra da cria estelar e a garra do slaad que impede a cura não existem no jogo.'),
  'Summon Construct': invocacao('metal', {
    argila: p('espiritoConstructoArgila', 'Argila', 'pancada'),
    metal: p('espiritoConstructoMetal', 'Metal', 'queima quem o acerta de perto'),
    pedra: p('espiritoConstructoPedra', 'Pedra', 'pancada'),
  }, 'A fúria da argila ao apanhar e a letargia da pedra não existem no jogo.'),
  'Summon Elemental': invocacao('fogo', {
    ar: p('espiritoElementalAr', 'Ar', 'voa, resiste a elétrico e trovejante'),
    terra: p('espiritoElementalTerra', 'Terra', 'resiste a corte e perfuração'),
    fogo: p('espiritoElementalFogo', 'Fogo', 'imune a fogo, pancada de fogo'),
    agua: p('espiritoElementalAgua', 'Água', 'nada, resiste a ácido'),
  }),
  'Summon Celestial': invocacao('vingador', {
    vingador: p('espiritoCelestialVingador', 'Vingador', 'arco radiante a 45 m'),
    defensor: p('espiritoCelestialDefensor', 'Defensor', '+2 de CA, maça radiante'),
  }, 'O toque que cura, uma vez por dia, e os PV temporários da maça não existem no jogo.'),
  'Summon Fiend': invocacao('demonio', {
    demonio: p('espiritoCorruptorDemonio', 'Demônio', 'mordida necrótica'),
    diabo: p('espiritoCorruptorDiabo', 'Diabo', 'voa e arremessa chama a 45 m'),
    yugoloth: p('espiritoCorruptorYugoloth', 'Yugoloth', 'garras'),
  }, 'A explosão do demônio ao cair e o teleporte do yugoloth depois do golpe não existem no jogo.'),
};
