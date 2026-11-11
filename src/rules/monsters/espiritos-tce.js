// OS ESPÍRITOS DAS INVOCAÇÕES DO TASHA (Invocar Besta, Feérico, Cria das Sombras, Morto-Vivo, Aberração, Constructo,
// Elemental, Celestial, Corruptor). O livro dá um bloco que CRESCE com o círculo da magia e com quem conjura: a CA soma o
// círculo, os PV sobem a cada círculo acima do mínimo, o ataque é o de magia de quem conjura, o dano soma o círculo e os
// golpes do Multiataque são a metade do círculo. Aqui fica o bloco-base de cada forma; `escalarEspirito` faz a conta na
// hora da invocação (`combat.js`, caso `invocar` com `espirito`). Os números são os do livro (o dado do 5etools); o que a
// forma faz e o motor ainda não faz está dito em cada uma. A figura é a de uma criatura parecida (`look`).
//
// Não valem XP: nascem invocados.

const base = (id, name, extra) => ({
  id, name, fonte: 'tce', level: 1, cr: '0', xp: 0, ac: 10, maxHp: 10, hpDice: '10', speedFt: 30, traits: [],
  attacks: [], conditionImmunities: [], damageImmunities: [], damageResistances: [], ...extra,
});
/** Um golpe: o dado fixo, o modificador do bloco (o dano soma ainda o círculo) e o resto. */
const golpe = (name, dado, mod, type, extra = {}) => ({ name, damage: `${dado}+${mod}`, dadoBase: dado, modBase: mod, type, reachFt: 5, bonus: 0, ...extra });
const distancia = (name, dado, mod, type, alcance, extra = {}) => golpe(name, dado, mod, type, { ranged: true, rangeFt: alcance, longRangeFt: extra.longo ?? alcance, ...extra });

export const ESPIRITOS_TCE = {
  // ---- o ESPÍRITO DO FOGO SELVAGEM do druida: PV 5 + 5 × nível e a semente de chama (1d6 + proficiência, o ataque de magia do
  // druida) entram na hora (`subclasses-livros.js invocarEspiritoDoFogo`).
  espiritoDoFogoSelvagem: base('espiritoDoFogoSelvagem', 'Espírito do Fogo Selvagem', {
    tipo: 'elemental', size: 'pequeno', look: 'mefiteDeMagma', abilities: { str: 10, dex: 14, con: 14, int: 13, wis: 15, cha: 11 },
    ac: 13, speedFt: 30, flyFt: 30, hover: true, damageImmunities: ['fogo'], conditionImmunities: ['enfeiticado', 'amedrontado', 'agarrado', 'caido', 'contido'],
    attacks: [{ name: 'Semente de Chama', damage: '1d6+2', type: 'fogo', ranged: true, rangeFt: 60, longRangeFt: 60, reachFt: 5, bonus: 4, magico: true, art: 'fire' }],
    blurb: 'Um espírito de fogo que nasce das cinzas, preso ao druida.',
  }),
  // ---- o DRACO do Guardião Dracônico (Fizban): CA, PV, a mordida e a essência entram na hora (`subclasses-livros.js invocarDraco`).
  dracoCompanheiro: base('dracoCompanheiro', 'Draco', {
    tipo: 'dragão', size: 'pequeno', look: 'filhoteDeDragaoVermelho', abilities: { str: 16, dex: 12, con: 15, int: 8, wis: 14, cha: 8 },
    ac: 16, speedFt: 40, senses: { darkvisionFt: 60 },
    attacks: [{ name: 'Mordida', damage: '1d6+2', type: 'perfurante', reachFt: 5, bonus: 5, art: 'bite' }],
    blurb: 'Um draco pequeno, preso ao patrulheiro por um laço de magia.',
  }),
  // ---- a APRESENTAÇÃO ANIMADA do bardo da Criação: o objeto que dança. Os PV (10 + 5 × nível) e o ataque (o de magia do bardo,
  // 1d10 + proficiência) entram na hora (`subclasses-livros.js apresentacaoAnimada`).
  itemDancante: base('itemDancante', 'Item Dançante', {
    tipo: 'constructo', size: 'grande', look: 'cavaleiro', abilities: { str: 18, dex: 14, con: 16, int: 4, wis: 10, cha: 6 },
    ac: 16, speedFt: 30, flyFt: 30, hover: true, damageImmunities: ['psíquico', 'veneno'], conditionImmunities: ['enfeiticado', 'amedrontado', 'envenenado'],
    attacks: [{ name: 'Pancada Energizada', damage: '1d10+2', type: 'energético', reachFt: 5, bonus: 4, magico: true, art: 'slam' }],
    blurb: 'Um objeto que a música do bardo pôs para dançar, e para bater.',
  }),
  // ---- Invocar Besta (2º): Ar, Terra, Água
  espiritoBestialAr: base('espiritoBestialAr', 'Espírito Bestial do Ar', {
    tipo: 'fera', size: 'pequeno', look: 'aguiaGigante', abilities: { str: 18, dex: 11, con: 16, int: 4, wis: 14, cha: 5 },
    speedFt: 30, flyFt: 60, speeds: { flyFt: 60 }, traits: ['voaSemProvocar'], espirito: { acBase: 11, hp: 20, porCirculo: 5, circulo: 2 },
    attacks: [golpe('Dilacerar', '1d8', 4, 'perfurante', { art: 'claw' })], blurb: 'Uma ave de espírito, que mergulha e sobe de novo sem dar brecha.',
  }),
  espiritoBestialTerra: base('espiritoBestialTerra', 'Espírito Bestial da Terra', {
    tipo: 'fera', size: 'pequeno', look: 'lobo', abilities: { str: 18, dex: 11, con: 16, int: 4, wis: 14, cha: 5 },
    speedFt: 30, speeds: { climbFt: 30 }, traits: ['packTactics'], espirito: { acBase: 11, hp: 30, porCirculo: 5, circulo: 2 },
    attacks: [golpe('Dilacerar', '1d8', 4, 'perfurante', { art: 'claw' })], blurb: 'Uma fera de espírito que caça junto com os aliados.',
  }),
  espiritoBestialAgua: base('espiritoBestialAgua', 'Espírito Bestial da Água', {
    tipo: 'fera', size: 'pequeno', look: 'tubaraoCacador', abilities: { str: 18, dex: 11, con: 16, int: 4, wis: 14, cha: 5 },
    speedFt: 30, speeds: { swimFt: 30 }, traits: ['packTactics'], espirito: { acBase: 11, hp: 30, porCirculo: 5, circulo: 2 },
    attacks: [golpe('Dilacerar', '1d8', 4, 'perfurante', { art: 'claw' })], blurb: 'Uma fera de espírito das águas, que caça junto com os aliados.',
  }),
  // ---- Invocar Feérico (3º)
  espiritoFeerico: base('espiritoFeerico', 'Espírito Feérico', {
    tipo: 'feérico', size: 'pequeno', look: 'satiro', abilities: { str: 13, dex: 16, con: 14, int: 14, wis: 11, cha: 16 },
    speedFt: 40, conditionImmunities: ['enfeiticado'], espirito: { acBase: 12, hp: 30, porCirculo: 10, circulo: 3 },
    attacks: [golpe('Espada Curta', '1d6', 3, 'perfurante', { art: 'sword', danoExtra: { damage: '1d6', type: 'energético' } })],
    blurb: 'Um espírito das fadas, rápido e de humor que muda.',
  }),
  // ---- Invocar Cria das Sombras (3º)
  espiritoDasSombras: base('espiritoDasSombras', 'Espírito das Sombras', {
    tipo: 'monstruosidade', size: 'médio', look: 'sombra', abilities: { str: 13, dex: 16, con: 15, int: 4, wis: 10, cha: 16 },
    speedFt: 40, damageResistances: ['necrótico'], conditionImmunities: ['amedrontado'], espirito: { acBase: 11, hp: 35, porCirculo: 15, circulo: 3 },
    attacks: [golpe('Rasgo Gelado', '1d12', 3, 'frio', { art: 'claw' })], blurb: 'Uma sombra tirada do medo de quem a conjurou.',
  }),
  // ---- Invocar Morto-Vivo (3º): Fantasmagórico, Pútrido, Esquelético
  espiritoMortoFantasmagorico: base('espiritoMortoFantasmagorico', 'Espírito Morto-Vivo Fantasmagórico', {
    tipo: 'morto-vivo', size: 'médio', look: 'fantasma', abilities: { str: 12, dex: 16, con: 15, int: 4, wis: 10, cha: 9 },
    speedFt: 30, flyFt: 40, speeds: { flyFt: 40 }, hover: true, traits: ['incorporealMovement'],
    damageImmunities: ['necrótico', 'veneno'], conditionImmunities: ['exausto', 'amedrontado', 'paralisado', 'envenenado'],
    espirito: { acBase: 11, hp: 30, porCirculo: 10, circulo: 3 },
    attacks: [golpe('Toque Mortal', '1d8', 3, 'necrótico', { art: 'claw', onHit: { save: 'wis', dc: 0, condition: 'amedrontado', rounds: 1, note: 'treme diante do espírito' } })],
    blurb: 'Uma alma que atravessa parede e assusta quem toca.',
  }),
  espiritoMortoPutrido: base('espiritoMortoPutrido', 'Espírito Morto-Vivo Pútrido', {
    tipo: 'morto-vivo', size: 'médio', look: 'zumbi', abilities: { str: 12, dex: 16, con: 15, int: 4, wis: 10, cha: 9 },
    speedFt: 30, damageImmunities: ['necrótico', 'veneno'], conditionImmunities: ['exausto', 'amedrontado', 'paralisado', 'envenenado'],
    espirito: { acBase: 11, hp: 30, porCirculo: 10, circulo: 3 },
    attacks: [golpe('Garra Podre', '1d6', 3, 'cortante', { art: 'claw' })], blurb: 'Um cadáver de espírito, que apodrece o ar em volta.',
  }),
  espiritoMortoEsqueletico: base('espiritoMortoEsqueletico', 'Espírito Morto-Vivo Esquelético', {
    tipo: 'morto-vivo', size: 'médio', look: 'esqueleto', abilities: { str: 12, dex: 16, con: 15, int: 4, wis: 10, cha: 9 },
    speedFt: 30, damageImmunities: ['necrótico', 'veneno'], conditionImmunities: ['exausto', 'amedrontado', 'paralisado', 'envenenado'],
    espirito: { acBase: 11, hp: 20, porCirculo: 10, circulo: 3 },
    attacks: [distancia('Raio da Cova', '2d4', 3, 'necrótico', 150, { art: 'bolt' })], blurb: 'Um esqueleto de espírito que atira a frieza da cova.',
  }),
  // ---- Invocar Aberração (4º): Observador, Slaad, Cria Estelar
  espiritoAberranteObservador: base('espiritoAberranteObservador', 'Espírito Aberrante (Observador)', {
    tipo: 'aberração', size: 'médio', look: 'observador', abilities: { str: 16, dex: 10, con: 15, int: 16, wis: 10, cha: 6 },
    speedFt: 30, flyFt: 30, speeds: { flyFt: 30 }, hover: true, damageImmunities: ['psíquico'], espirito: { acBase: 11, hp: 40, porCirculo: 10, circulo: 4 },
    attacks: [distancia('Raio do Olho', '1d8', 3, 'psíquico', 150, { art: 'bolt' })], blurb: 'Um olho flutuante de espírito, que fere a mente de longe.',
  }),
  espiritoAberranteSlaad: base('espiritoAberranteSlaad', 'Espírito Aberrante (Slaad)', {
    tipo: 'aberração', size: 'médio', look: 'slaadVermelho', abilities: { str: 16, dex: 10, con: 15, int: 16, wis: 10, cha: 6 },
    speedFt: 30, damageImmunities: ['psíquico'], regeneracao: { pv: 5 }, espirito: { acBase: 11, hp: 40, porCirculo: 10, circulo: 4 },
    attacks: [golpe('Garras', '1d10', 3, 'cortante', { art: 'claw' })], blurb: 'Um sapo do caos de espírito, que se refaz a cada turno.',
  }),
  espiritoAberranteEstelar: base('espiritoAberranteEstelar', 'Espírito Aberrante (Cria Estelar)', {
    tipo: 'aberração', size: 'médio', look: 'bocaTagarela', abilities: { str: 16, dex: 10, con: 15, int: 16, wis: 10, cha: 6 },
    speedFt: 30, damageImmunities: ['psíquico'], espirito: { acBase: 11, hp: 40, porCirculo: 10, circulo: 4 },
    attacks: [golpe('Pancada Psíquica', '1d8', 3, 'psíquico', { art: 'fist' })], blurb: 'Uma cria das estrelas de espírito, que sussurra loucura.',
  }),
  // ---- Invocar Constructo (4º): Argila, Metal, Pedra
  espiritoConstructoArgila: base('espiritoConstructoArgila', 'Espírito Constructo (Argila)', {
    tipo: 'constructo', size: 'médio', look: 'golemDeArgila', abilities: { str: 18, dex: 10, con: 18, int: 14, wis: 11, cha: 5 },
    speedFt: 30, damageResistances: ['veneno'], conditionImmunities: ['enfeiticado', 'exausto', 'amedrontado', 'incapacitado', 'paralisado', 'petrificado', 'envenenado'],
    espirito: { acBase: 13, hp: 40, porCirculo: 15, circulo: 4 }, attacks: [golpe('Pancada', '1d8', 4, 'concussão', { art: 'fist' })],
    blurb: 'Um corpo de argila que a magia animou.',
  }),
  espiritoConstructoMetal: base('espiritoConstructoMetal', 'Espírito Constructo (Metal)', {
    tipo: 'constructo', size: 'médio', look: 'golemDeFerro', abilities: { str: 18, dex: 10, con: 18, int: 14, wis: 11, cha: 5 },
    speedFt: 30, damageResistances: ['veneno'], conditionImmunities: ['enfeiticado', 'exausto', 'amedrontado', 'incapacitado', 'paralisado', 'petrificado', 'envenenado'],
    corpoQuente: { damage: '1d10', type: 'fogo' }, espirito: { acBase: 13, hp: 40, porCirculo: 15, circulo: 4 },
    attacks: [golpe('Pancada', '1d8', 4, 'concussão', { art: 'fist' })], blurb: 'Um corpo de metal em brasa, que queima quem bate nele.',
  }),
  espiritoConstructoPedra: base('espiritoConstructoPedra', 'Espírito Constructo (Pedra)', {
    tipo: 'constructo', size: 'médio', look: 'golemDePedra', abilities: { str: 18, dex: 10, con: 18, int: 14, wis: 11, cha: 5 },
    speedFt: 30, damageResistances: ['veneno'], conditionImmunities: ['enfeiticado', 'exausto', 'amedrontado', 'incapacitado', 'paralisado', 'petrificado', 'envenenado'],
    espirito: { acBase: 13, hp: 40, porCirculo: 15, circulo: 4 }, attacks: [golpe('Pancada', '1d8', 4, 'concussão', { art: 'fist' })],
    blurb: 'Um corpo de pedra que a magia animou.',
  }),
  // ---- Invocar Elemental (4º): Ar, Terra, Fogo, Água
  espiritoElementalAr: base('espiritoElementalAr', 'Espírito Elemental do Ar', {
    tipo: 'elemental', size: 'médio', look: 'elementalDoAr', abilities: { str: 18, dex: 15, con: 17, int: 4, wis: 10, cha: 16 },
    speedFt: 40, flyFt: 40, speeds: { flyFt: 40 }, hover: true, traits: ['amorfo'], damageImmunities: ['veneno'], damageResistances: ['elétrico', 'trovejante'],
    conditionImmunities: ['exausto', 'paralisado', 'petrificado', 'envenenado', 'inconsciente'], espirito: { acBase: 11, hp: 50, porCirculo: 10, circulo: 4 },
    attacks: [golpe('Pancada', '1d10', 4, 'concussão', { art: 'fist' })], blurb: 'Um vento com vontade.',
  }),
  espiritoElementalTerra: base('espiritoElementalTerra', 'Espírito Elemental da Terra', {
    tipo: 'elemental', size: 'médio', look: 'elementalDaTerra', abilities: { str: 18, dex: 15, con: 17, int: 4, wis: 10, cha: 16 },
    speedFt: 40, damageImmunities: ['veneno'], damageResistances: ['perfurante', 'cortante'],
    conditionImmunities: ['exausto', 'paralisado', 'petrificado', 'envenenado', 'inconsciente'], espirito: { acBase: 11, hp: 50, porCirculo: 10, circulo: 4 },
    attacks: [golpe('Pancada', '1d10', 4, 'concussão', { art: 'fist' })], blurb: 'Um monte de terra e pedra com vontade.',
  }),
  espiritoElementalFogo: base('espiritoElementalFogo', 'Espírito Elemental do Fogo', {
    tipo: 'elemental', size: 'médio', look: 'elementalDoFogo', abilities: { str: 18, dex: 15, con: 17, int: 4, wis: 10, cha: 16 },
    speedFt: 40, traits: ['amorfo'], damageImmunities: ['veneno', 'fogo'],
    conditionImmunities: ['exausto', 'paralisado', 'petrificado', 'envenenado', 'inconsciente'], espirito: { acBase: 11, hp: 50, porCirculo: 10, circulo: 4 },
    attacks: [golpe('Pancada', '1d10', 4, 'fogo', { art: 'fist' })], blurb: 'Uma chama com vontade.',
  }),
  espiritoElementalAgua: base('espiritoElementalAgua', 'Espírito Elemental da Água', {
    tipo: 'elemental', size: 'médio', look: 'elementalDaAgua', abilities: { str: 18, dex: 15, con: 17, int: 4, wis: 10, cha: 16 },
    speedFt: 40, speeds: { swimFt: 40 }, traits: ['amorfo'], damageImmunities: ['veneno'], damageResistances: ['ácido'],
    conditionImmunities: ['exausto', 'paralisado', 'petrificado', 'envenenado', 'inconsciente'], espirito: { acBase: 11, hp: 50, porCirculo: 10, circulo: 4 },
    attacks: [golpe('Pancada', '1d10', 4, 'concussão', { art: 'fist' })], blurb: 'Uma onda com vontade.',
  }),
  // ---- Invocar Celestial (5º): Vingador, Defensor
  espiritoCelestialVingador: base('espiritoCelestialVingador', 'Espírito Celestial (Vingador)', {
    tipo: 'celestial', size: 'grande', look: 'deva', abilities: { str: 16, dex: 14, con: 16, int: 10, wis: 14, cha: 16 },
    speedFt: 30, flyFt: 40, speeds: { flyFt: 40 }, damageResistances: ['radiante'], conditionImmunities: ['enfeiticado', 'amedrontado'],
    espirito: { acBase: 11, hp: 40, porCirculo: 10, circulo: 5 },
    attacks: [distancia('Arco Radiante', '2d6', 2, 'radiante', 150, { longo: 600, art: 'bow' })], blurb: 'Um anjo de espírito com um arco de luz.',
  }),
  espiritoCelestialDefensor: base('espiritoCelestialDefensor', 'Espírito Celestial (Defensor)', {
    tipo: 'celestial', size: 'grande', look: 'planetar', abilities: { str: 16, dex: 14, con: 16, int: 10, wis: 14, cha: 16 },
    speedFt: 30, flyFt: 40, speeds: { flyFt: 40 }, damageResistances: ['radiante'], conditionImmunities: ['enfeiticado', 'amedrontado'],
    espirito: { acBase: 13, hp: 40, porCirculo: 10, circulo: 5 },
    attacks: [golpe('Maça Radiante', '1d10', 3, 'radiante', { art: 'mace' })], blurb: 'Um anjo de espírito com uma maça de luz.',
  }),
  // ---- Invocar Corruptor (6º): Demônio, Diabo, Yugoloth
  espiritoCorruptorDemonio: base('espiritoCorruptorDemonio', 'Espírito Corruptor (Demônio)', {
    tipo: 'corruptor', size: 'grande', look: 'vrock', abilities: { str: 13, dex: 16, con: 15, int: 10, wis: 10, cha: 16 },
    speedFt: 40, speeds: { climbFt: 40 }, traits: ['magicResistance'], damageImmunities: ['veneno'], damageResistances: ['fogo'], conditionImmunities: ['envenenado'],
    espirito: { acBase: 12, hp: 50, porCirculo: 15, circulo: 6 }, attacks: [golpe('Mordida', '1d12', 3, 'necrótico', { art: 'claw' })],
    blurb: 'Um demônio de espírito, de dentes negros.',
  }),
  espiritoCorruptorDiabo: base('espiritoCorruptorDiabo', 'Espírito Corruptor (Diabo)', {
    tipo: 'corruptor', size: 'grande', look: 'diaboBarbado', abilities: { str: 13, dex: 16, con: 15, int: 10, wis: 10, cha: 16 },
    speedFt: 40, flyFt: 60, speeds: { flyFt: 60 }, traits: ['magicResistance'], damageImmunities: ['veneno'], damageResistances: ['fogo'], conditionImmunities: ['envenenado'],
    espirito: { acBase: 12, hp: 40, porCirculo: 15, circulo: 6 }, attacks: [distancia('Arremessar Chama', '2d6', 3, 'fogo', 150, { art: 'bolt' })],
    blurb: 'Um diabo de espírito, que atira fogo do inferno.',
  }),
  espiritoCorruptorYugoloth: base('espiritoCorruptorYugoloth', 'Espírito Corruptor (Yugoloth)', {
    tipo: 'corruptor', size: 'grande', look: 'mezzoloth', abilities: { str: 13, dex: 16, con: 15, int: 10, wis: 10, cha: 16 },
    speedFt: 40, traits: ['magicResistance'], damageImmunities: ['veneno'], damageResistances: ['fogo'], conditionImmunities: ['envenenado'],
    espirito: { acBase: 12, hp: 60, porCirculo: 15, circulo: 6 }, attacks: [golpe('Garras', '1d8', 3, 'cortante', { art: 'claw' })],
    blurb: 'Um yugoloth de espírito, mercenário de garras.',
  }),
};

/**
 * Ajusta o espírito invocado ao círculo e a quem conjura: CA (base + círculo), PV (o mínimo + os do círculo acima do
 * mínimo), o ataque de magia de quem conjura, o dano + o círculo, a CD de quem conjura nos efeitos, e golpes do
 * Multiataque iguais à metade do círculo.
 */
export function escalarEspirito(m, { circulo, ataque, cd }) {
  const e = ESPIRITOS_TCE[m.defId]?.espirito;
  if (!e) return m;
  // os golpes são do BLOCO, divididos por todos os que nascem dele: cada espírito leva a sua cópia
  m.attacks = (m.attacks ?? []).map((a) => ({ ...a, ...(a.onHit ? { onHit: { ...a.onHit } } : {}) }));
  const acima = Math.max(0, circulo - e.circulo);
  m.ac = e.acBase + circulo;
  m.maxHp = e.hp + e.porCirculo * acima;
  m.hp = m.maxHp;
  for (const a of m.attacks ?? []) {
    a.bonus = ataque;
    if (a.dadoBase) a.damage = `${a.dadoBase}+${a.modBase + circulo}`;
    if (a.onHit?.save) a.onHit = { ...a.onHit, dc: cd };
  }
  const golpes = Math.max(1, Math.floor(circulo / 2));
  m.multiattack = golpes > 1 ? { count: golpes } : null;
  return m;
}
