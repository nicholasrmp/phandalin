// IMPORTA UM BESTIÁRIO DO 5ETOOLS para o formato de bloco do jogo.
//
//   node src/dev/importar-bestiario.mjs mm              escreve src/rules/monsters/livro-mm.js e o relatório
//   node src/dev/importar-bestiario.mjs mm --so-plano   só conta o que entra e o que fica pendente
//
// DE ONDE VEM CADA COISA
//   - os NÚMEROS saem do dado do livro, sem mão humana: `_referencias/5etools/bestiary/bestiary-<livro>.json` (o espelho
//     do 5etools no GitHub; fora do repositório). CA, PV, deslocamentos, atributos, perícias, sentidos, resistências, ND,
//     XP, golpes (acerto, alcance, dano, tipo, o dano a mais), o que o golpe faz a quem falha (condição, dano), o
//     multiataque, o sopro, a conjuração e os traços que o motor já sabe fazer.
//   - o TEXTO em pt-br sai de `src/dev/bestiario/<livro>-pt.json`, escrito com as NOSSAS palavras pela API em lote
//     (`traduzir-bestiario.mjs`): nome, frase de apresentação, a descrição de cada traço e ação, e a lore. A prosa do
//     livro não entra — o modelo recebe o livro como fonte e devolve um resumo próprio.
//   - criatura que o jogo JÁ TEM fica de fora (`bestiario/ja-temos.json`, nome no livro -> id no jogo).
//
// O QUE O MOTOR AINDA NÃO FAZ não some: cada traço ou ação sem mecânica vira um traço de texto (`t_<id>`) e entra no
// relatório `src/dev/bestiario/<livro>-pendente.json`, que é a fila do trabalho de motor.
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const LIVRO = (process.argv[2] ?? 'mm').toLowerCase();
const SO_PLANO = process.argv.includes('--so-plano');
const DADO = `${RAIZ}_referencias/5etools/bestiary/bestiary-${LIVRO}.json`;
const PT = `${RAIZ}src/dev/bestiario/${LIVRO}-pt.json`;
const JA = `${RAIZ}src/dev/bestiario/ja-temos.json`;
const SAIDA = `${RAIZ}src/rules/monsters/livro-${LIVRO}.js`;
const PENDENTE = `${RAIZ}src/dev/bestiario/${LIVRO}-pendente.json`;
const MAGIAS_EN = `${RAIZ}src/dev/bestiario/magias-en.json`;

const lerJson = (p, reserva) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return reserva; } };

// ------------------------------------------------------------------------------------------- vocabulário ----
const TAMANHO = { T: 'miúdo', S: 'pequeno', M: 'médio', L: 'grande', H: 'enorme', G: 'imenso' };
const TIPO = {
  aberration: 'aberração', beast: 'fera', celestial: 'celestial', construct: 'constructo', dragon: 'dragão',
  elemental: 'elemental', fey: 'feérico', fiend: 'corruptor', giant: 'gigante', humanoid: 'humanoide',
  monstrosity: 'monstruosidade', ooze: 'gosma', plant: 'planta', undead: 'morto-vivo',
};
const DANO = {
  slashing: 'cortante', piercing: 'perfurante', bludgeoning: 'concussão', fire: 'fogo', cold: 'frio',
  lightning: 'elétrico', thunder: 'trovejante', acid: 'ácido', poison: 'veneno', necrotic: 'necrótico',
  radiant: 'radiante', force: 'energético', psychic: 'psíquico',
};
const CONDICAO = {
  blinded: 'cego', charmed: 'enfeitiçado', deafened: 'surdo', exhaustion: 'exausto', frightened: 'amedrontado',
  grappled: 'agarrado', incapacitated: 'incapacitado', invisible: 'invisivel', paralyzed: 'paralisado',
  petrified: 'petrificado', poisoned: 'envenenado', prone: 'caido', restrained: 'contido', stunned: 'atordoado',
  unconscious: 'inconsciente',
};
// a condição como o MOTOR a escreve (o golpe que aplica), que nem sempre é a da lista de imunidades
const CONDICAO_DO_MOTOR = { ...CONDICAO, charmed: 'enfeiticado' };
const ATRIBUTO = { strength: 'str', dexterity: 'dex', constitution: 'con', intelligence: 'int', wisdom: 'wis', charisma: 'cha' };
const PERICIA = {
  acrobatics: 'acrobacia', arcana: 'arcanismo', athletics: 'atletismo', performance: 'atuacao', deception: 'enganacao',
  stealth: 'furtividade', history: 'historia', intimidation: 'intimidacao', insight: 'intuicao', investigation: 'investigacao',
  'animal handling': 'lidarComAnimais', medicine: 'medicina', nature: 'natureza', perception: 'percepcao',
  persuasion: 'persuasao', 'sleight of hand': 'prestidigitacao', religion: 'religiao', survival: 'sobrevivencia',
};
const PERICIA_ATRIB = {
  acrobacia: 'dex', arcanismo: 'int', atletismo: 'str', atuacao: 'cha', enganacao: 'cha', furtividade: 'dex', historia: 'int',
  intimidacao: 'cha', intuicao: 'wis', investigacao: 'int', lidarComAnimais: 'wis', medicina: 'wis', natureza: 'int',
  percepcao: 'wis', persuasao: 'cha', prestidigitacao: 'dex', religiao: 'int', sobrevivencia: 'wis',
};
const XP = {
  '0': 10, '1/8': 25, '1/4': 50, '1/2': 100, 1: 200, 2: 450, 3: 700, 4: 1100, 5: 1800, 6: 2300, 7: 2900, 8: 3900, 9: 5000,
  10: 5900, 11: 7200, 12: 8400, 13: 10000, 14: 11500, 15: 13000, 16: 15000, 17: 18000, 18: 20000, 19: 22000, 20: 25000,
  21: 33000, 22: 41000, 23: 50000, 24: 62000, 25: 75000, 26: 90000, 27: 105000, 28: 120000, 29: 135000, 30: 155000,
};
const NUMERO = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twice: 2, thrice: 3 };

// Os traços que o motor JÁ FAZ, pelo nome no livro -> o id do traço no jogo (`combat.js`, `ai.js`, `passivas.js`).
const TRACO_DO_MOTOR = {
  'Pack Tactics': 'packTactics', 'Magic Resistance': 'resistenciaAMagia', 'Keen Smell': 'keenSmell', 'Keen Hearing': 'keenHearing',
  'Keen Hearing and Smell': 'keenHearingSmell', 'Keen Sight and Smell': 'keenSightSmell', 'Keen Sight': 'visaoAgucada',
  'Spider Climb': 'spiderClimb', 'Web Walker': 'webWalker', 'Web Sense': 'webSense', 'Sunlight Sensitivity': 'sunlightSensitivity',
  'Incorporeal Movement': 'incorporealMovement', 'Undead Fortitude': 'undeadFortitude', 'Nimble Escape': 'nimbleEscape',
  'Martial Advantage': 'martialAdvantage', 'Aggressive': 'agressivo', 'False Appearance': 'aparenciaFalsa', 'Amorphous': 'amorfo',
  'Siege Monster': 'monstroDeCerco', 'Brave': 'bravura', 'Dark Devotion': 'devocaoSombria', 'Fey Ancestry': 'ascendenciaFeerica',
  'Gnome Cunning': 'astuciaGnomica', 'Relentless': 'relentless', 'Echolocation': 'echolocation', 'Earth Glide': 'deslizarNaTerra',
  'Antimagic Susceptibility': 'suscetibilidadeAntimagica', 'Turn Immunity': 'imuneAExpulsar', 'Immutable Form': 'formaImutavel',
  'Magic Weapons': 'armasMagicas', 'Leadership': 'lideranca', 'Cunning Action': 'acaoAstuta', 'Parry': 'aparar',
  'Shapechanger': 'metamorfo', 'Water Susceptibility': null, 'Brute': null, 'Amphibious': null, 'Hold Breath': null,
  'Lightning Absorption': 'absorcaoDeRaios', 'Acid Absorption': 'absorcaoAcida', 'Berserk': 'furorDoGolem',
  'Stone Camouflage': 'camuflagemDePedra', 'Underwater Camouflage': 'camuflagemSubmersa', 'Sure-Footed': 'pesFirmes',
  'Keen Hearing and Sight': 'audicaoEVisaoApuradas', 'Keen Senses': 'audicaoEVisaoApuradas', 'Wakeful': 'sempreAlerta',
  'Superior Invisibility': 'invisivelAVontade', 'Invisibility': 'invisivelAVontade', 'Ink Cloud': 'nuvemDeTinta',
  'Swarm': 'enxameDoLivro', 'Blood Frenzy': 'frenesiDeSangue', 'Flyby': 'voaSemProvocar', 'Reckless': 'imprudente',
  'Rampage': 'rampage', 'Light Sensitivity': 'sensibilidadeALuz', 'Turn Resistance': 'resisteExpulsar',
  'Turn Defiance': 'resisteExpulsar', 'Angelic Weapons': 'armasMagicas', 'Hellish Weapons': 'armasMagicas',
  'Avoidance': 'evasaoTotal', 'Leadership': 'lideranca', 'Parry': 'aparar',
  'Heated Weapons': null, 'Unarmored Defense': null, 'Steadfast': 'bravura',
  'Tunneler': 'escavador', 'Ambusher': 'emboscador', 'Surprise Attack': 'ataqueSurpresa', 'Fire Absorption': 'absorcaoDeFogo',
  'Displacement': 'deslocamento', 'Shadow Stealth': 'furtividadeNasSombras',
  // os outros bestiários: o mesmo traço com outro nome
  'Plant Camouflage': 'camuflagemGeral', 'Woodland Camouflage': 'camuflagemGeral', 'Low Cunning': 'acaoAstuta', 'Lightfooted': 'acaoAstuta',
  'Mental Fortitude': 'ascendenciaFeerica', 'Mental Resistance': 'ascendenciaFeerica', 'Touch of Madness': 'ascendenciaFeerica',
  'Sunlight Hypersensitivity': 'sunlightSensitivity', 'Sunlight Weakness': 'sunlightSensitivity', 'Uncanny Senses': 'sempreAlerta', 'Alert': 'sempreAlerta',
  'Spell-Resistant Carapace': 'resistenciaAMagia', 'Antimagic Shell': 'resistenciaAMagia', 'Wretched Pack Tactics': 'packTactics',
  'Liquid Form': 'formaFluida', 'Misty Form': 'formaFluida', 'Out-of-Phase Movement': 'incorporealMovement',
  'Air Form': 'formaFluida', 'Water Form': 'formaFluida', 'Chameleon Carapace': 'camuflagemGeral', 'Chameleon Skin': 'camuflagemGeral',
  'Reactive': 'reativo', 'Prone Deficiency': 'deficienciaCaido', 'Split': 'divisao', 'Assassinate': 'assassinar',
  'Damage Transfer': 'transfereDano', 'Marshal Undead': 'comandaMortos', 'Antimagic Cone': 'coneAntimagia',
  'Negative Energy Cone': 'coneDeEnergiaNegativa', 'Corrode Metal': 'corroiArma', 'Rust Metal': 'corroiArma',
  'Freedom of Movement': 'liberdadeDeMovimento', 'Limited Magic Immunity': 'imunidadeMagicaLimitada',
  'Reflective Carapace': 'carapacaRefletora', 'Freeze': 'congela', 'Consume Life': 'consumirVida', 'Ethereal Jaunt': 'saltoEtereo',
  'Aberrant Ground': 'chaoAberrante', 'Unnerving Mask': 'mascaraPerturbadora', 'Sticky Shield': 'escudoPegajoso',
  'Invisible Passage': 'invisivelAVontade', 'Incite Rampage': 'incitarRampage', 'Phantasms': 'fantasmas',
};
// Só SABOR numa luta de tabuleiro: o texto fica no bloco (o jogador lê), mas não é trabalho de motor.
const SABOR = new Set([
  'Limited Telepathy', 'Water Breathing', 'The Colors of Age', 'Axiomatic Mind', 'Disintegration', 'Elemental Demise',
  'Otherworldly Perception', 'Mimicry', 'Telepathic Bond', 'Limited Amphibiousness', 'Shark Telepathy', 'Inscrutable',
  'Labyrinthine Recall', 'Divine Awareness', 'Probing Telepathy', 'Speak with Frogs and Toads', 'Drone', 'Sense Magic',
  'Speak with Beasts and Plants', 'Advanced Telepathy', 'Telepathic Shroud', 'Eerie Resemblance', 'Detect Sentience',
  'Faultless Tracker', 'Night Hag Items', 'Iron Scent', 'Treasure Sense', 'Beast of Burden', 'Change Shape',
  'Rejuvenation', 'Hellish Rejuvenation', 'Malison Type', 'Gruumsh\'s Fury', 'Heart of Hruggek', 'Slippery',
  'Rock Catching', 'Variable Illumination', 'Ephemeral', 'Poor Depth Perception', 'Two-Headed', 'Two Heads',
  'Shielded Mind', 'Psychic Defense', 'Duergar Resilience', 'Confer Fire Resistance', 'Living Shadow', 'Misty Escape',
  'Sun Sickness', 'Vampire Weaknesses', 'Fear of Fire', 'Aversion of Fire', 'Mucous Cloud', 'Running Leap', 'Standing Leap',
  'Snow Camouflage', 'Swamp Camouflage', 'Ice Walk', 'Distress Spores', 'Rapport Spores', 'Tree Stride', 'Heart Sight',
  'Blind Senses', 'Tail Spike Regrowth', 'Limited Spines', 'Fiendish Blessing', 'Transparent', 'Ooze Cube', 'Grasping Tendrils',
  'Shriek', 'Illusory Appearance', 'Nightmare Haunting', 'Body Thief', 'Animating Spores', 'Summon Air Elemental',
  // os outros bestiários: não precisa de ar, comida, bebida nem sono
  'Unusual Nature',
  // ... o que só habilita uma ação que o bloco já tem (as runas dos gigantes), o que já está no número do bloco ("included
  // in its attacks", a CA que soma Inteligência ou Carisma), e o que é de fora da luta (sentidos a quilômetros, telepatia,
  // memória, rastro, viagem, ritual, o que se escolhe ao invocar)
  'Blood Rune', 'Cloud Rune', 'Fire Rune', 'Frost Rune', 'Hill Rune', 'Death Rune', 'Stone Rune', 'Storm Rune',
  'Foe Smiter of Ilneval', 'Hand of Shargaas', 'Magic Club', "Stone's Strength", 'Deflection', 'Mental Defense', 'Suave Defense', 'Dual Shields',
  'Astral Entity', 'Assume Form', 'Awakened Mind', 'Corpses', 'Creature Sense', 'Customizable Storage', 'Discern Lie', 'Diabolical Sense',
  'Devour Soul', 'Dimensional Rift', 'Draconic Essence', "Dragon's Resistance", 'Earth Armor', 'Ethereal Awareness', 'Extra Heads',
  'Extraordinary Leap', 'Fabricate', 'Firearms Knowledge', 'Forbiddance', 'Glide', 'Controlled Fall', 'Graystaff Magic', 'Howdah',
  'Hunger-Driven', "Raxivort's Tongue", 'Telepathic Hub', 'Corrupt Water', 'Contortionist', 'Halfling Nimbleness', 'Chromatic Form',
  'Illumination', 'Sulfurous Impersonation', 'Infernal Tack', 'Inert', 'Iron Boots', 'Keen Tracker', 'Life Sense', 'Living Storm',
  "Lynx's Sight", 'Mask of the Wild', 'Master of Undeath', 'Mutation', 'Psionic Hub', 'Resonant Connection', 'Scrying', 'Second-Story Work',
  'Secure Memory', 'Sever Silver Cord', 'Shared Resistances', "Shargaas's Sight", 'Shift Perception', 'Song of Rest', 'Soul Feeding',
  'Soul Taker', 'Special Equipment', 'Trackless', "Transmuter's Stone", 'Uncanny Smell', 'Undetectable', 'Ventriloquism', 'Violate Corpse',
  'Wand of Orcus', 'Warp Perception', 'Watery Stealth', 'Worms', 'Boneless', 'Overbearing Pack', 'Keen Smell and Sight', 'Ghostly Inhabitant',
]);

// ------------------------------------------------------------------------------------------------ utilidades ----
// a marca do 5etools vira o texto dela: `{@dc 21}` -> "DC 21"; `{@quickref Vision and Light||2||heavily obscured}` -> o
// ÚLTIMO pedaço (o que se lê); as outras, o primeiro
const semTags = (s) => String(s ?? '').replace(/\{@(\w+) ([^}]*)\}/g, (_, tag, tudo) => {
  const partes = tudo.split('|');
  if (tag === 'h') return '';
  if (tag === 'dc') return `DC ${partes[0]}`;
  if (tag === 'quickref') return partes.filter(Boolean).at(-1) ?? partes[0];
  return partes[0];
}).replace(/\{@h\}/g, '');
/** O nome de traço/ação sem a marca de recarga e sem o que vem entre parênteses ("Breath Weapons {@recharge 5}", "Tail (Costs 2 Actions)"). */
export const limpaNome = (n) => semTags(String(n ?? '').replace(/\{@recharge[^}]*\}/g, '')).replace(/\s*\(.*\)\s*$/, '').trim();
const texto = (entries) => (entries ?? []).map((e) => (typeof e === 'string' ? e : e.entries ? texto(e.entries) : e.items ? texto(e.items) : typeof e.entry === 'string' ? e.entry : '')).join(' ');
const idDe = (nome) => nome.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9 ]/g, ' ').trim().split(/\s+/)
  .map((w, i) => (i ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase())).join('');
const crDe = (m) => String(typeof m.cr === 'object' ? m.cr.cr : m.cr ?? '0');
const crNumero = (cr) => (cr.includes('/') ? Number(cr.split('/')[0]) / Number(cr.split('/')[1]) : Number(cr));
const proficienciaDoNd = (cr) => Math.max(2, 2 + Math.floor((Math.max(1, Math.ceil(crNumero(cr))) - 1) / 4));
const mod = (v) => Math.floor((v - 10) / 2);
const pes = (s) => Number(String(s).match(/(\d+)\s*ft/)?.[1] ?? 0);

export function deslocamento(sp) {
  const n = (v) => (typeof v === 'object' ? v.number : v) ?? 0;
  const out = { speedFt: n(sp.walk ?? 0) };
  const speeds = {};
  if (sp.fly) { out.flyFt = n(sp.fly); speeds.flyFt = n(sp.fly); }
  if (sp.swim) speeds.swimFt = n(sp.swim);
  if (sp.climb) speeds.climbFt = n(sp.climb);
  if (sp.burrow) speeds.burrowFt = n(sp.burrow);
  if (sp.canHover || (typeof sp.fly === 'object' && /hover/.test(sp.fly.condition ?? ''))) out.hover = true;
  if (Object.keys(speeds).length) out.speeds = speeds;
  return out;
}

export function sentidos(m) {
  const s = { passivePerception: m.passive ?? 10 };
  for (const t of m.senses ?? []) {
    const v = pes(t);
    if (/darkvision/.test(t)) s.darkvisionFt = v;
    else if (/blindsight/.test(t)) s.blindsightFt = v;
    else if (/truesight/.test(t)) s.truesightFt = v;
    else if (/tremorsense/.test(t)) s.tremorsenseFt = v;
  }
  return s;
}

/** Resistência/imunidade: a lista simples e a nota de "só de armas não mágicas". */
export function tiposDeDano(lista, campo) {
  const tipos = []; let nota = null;
  for (const r of lista ?? []) {
    if (typeof r === 'string') { if (DANO[r]) tipos.push(DANO[r]); continue; }
    const dentro = r[campo] ?? [];
    for (const t of dentro) if (typeof t === 'string' && DANO[t]) tipos.push(DANO[t]);
    if (/nonmagical/.test(r.note ?? '') || /nonmagical/.test(r.preNote ?? '')) nota = 'só de armas não mágicas';
  }
  return { tipos: [...new Set(tipos)], nota };
}

// ------------------------------------------------------------------------------------------------- golpes ----
/** O golpe de arma do livro ({@atk mw} {@hit 4} to hit, reach 5 ft. ... {@h}5 ({@damage 1d6 + 2}) slashing damage). */
export function golpe(acao, nomePt) {
  const t = (acao.entries ?? []).filter((e) => typeof e === 'string').join(' ');
  const atk = t.match(/\{@atk ([a-z,]+)\}/);
  if (!atk) return null;
  const tipos = atk[1].split(',');
  const ranged = tipos.every((x) => x.startsWith('r'));
  const bonus = Number(t.match(/\{@hit (-?\d+)\}/)?.[1] ?? 0);
  const reach = Number(t.match(/reach (\d+) ft/)?.[1] ?? 5);
  const alcance = t.match(/range (\d+)(?:\/(\d+))? ft/);
  // dois dados no mesmo golpe ("({@damage 1d12 + 4} plus {@damage 1d8}) slashing"): o segundo vira dano a mais
  const somado = t.match(/\(\{@damage ([^}]+)\} plus \{@damage ([^}]+)\}\) (\w+) damage/);
  // "10 (1d10 + 5) damage of a type chosen by the dracohydra" (a draco-hidra): o tipo que ela escolhe vira energia
  const escolhido = !somado && t.match(/\(\{@damage ([^}]+)\}\) damage of a type/);
  const danos = somado ? [[null, somado[1], somado[3]], [null, somado[2], somado[3]]]
    : escolhido ? [[null, escolhido[1], 'force']]
    : [...t.matchAll(/\(\{@damage ([^}]+)\}\) (\w+) damage/g)];
  // dano FIXO, sem dado ("{@h}1 piercing damage"): entra como NÚMERO, que é o que `parseDice` aceita
  const fixo = !danos.length ? t.match(/\{@h\}(\d+) (\w+) damage/) : null;
  // "bludgeoning or slashing damage (claw's choice)" (a garra rastejante): vale o primeiro tipo
  if (!danos.length && !fixo) { const ou = t.match(/\(\{@damage ([^}]+)\}\) (\w+) or \w+ damage/); if (ou) danos.push([null, ou[1], ou[2]]); }
  // "damage of one of the following types" (o raio do empíreo): a escolha dele, o radiante
  if (!danos.length && !fixo) { const um = t.match(/\(\{@damage ([^}]+)\}\) damage of one of the following types/); if (um) danos.push([null, um[1], 'radiant']); }
  // o golpe que SÓ PRENDE (a teia do ettercap): sem dano, o acerto contém, e sai com teste de Força
  const soPrende = !danos.length && !fixo && /\{@condition restrained\}/.test(t);
  const soAmaldicoa = !danos.length && !fixo && /magically cursed/.test(t);
  if (!danos.length && !fixo && !soPrende && !soAmaldicoa) return null;
  const g = {
    name: nomePt, bonus,
    damage: fixo ? Number(fixo[1]) : soPrende || soAmaldicoa ? 0 : danos[0][1].replace(/\s+/g, ''),
    type: fixo ? DANO[fixo[2]] ?? fixo[2] : soPrende || soAmaldicoa ? 'nenhum' : DANO[danos[0][2]] ?? danos[0][2],
    reachFt: ranged ? 5 : reach,
  };
  if (soAmaldicoa) g.onHit = { semResistencia: true, condition: 'amaldicoadoLamia', rounds: 100, note: 'é amaldiçoado' };
  if (soPrende) {
    const esc = Number(t.match(/\{@dc (\d+)\} Strength/)?.[1] ?? t.match(/\{@dc (\d+)\}/)?.[1] ?? 10);
    g.onHit = { semResistencia: true, dc: esc, escape: esc, condition: 'contido', note: 'fica preso' };
  }
  if (somado) g.danoExtra = { damage: somado[2].replace(/\s+/g, ''), type: DANO[somado[3]] ?? somado[3] };
  // o ENXAME: "ou 1d6 se o enxame estiver com metade dos PV ou menos" — o segundo dado é o do enxame ferido
  const doEnxame = /if the swarm has half of its hit points or fewer/.test(t) && danos[1];
  if (ranged || (tipos.includes('rw') && alcance)) {
    if (ranged) g.ranged = true;
    if (alcance) { g.rangeFt = Number(alcance[1]); g.longRangeFt = Number(alcance[2] ?? alcance[1]); }
  }
  // o dano a mais do mesmo golpe ("plus 7 (2d6) poison damage") — sem teste
  if (doEnxame) g.danoMetade = danos[1][1].replace(/\s+/g, '');
  const extra = !somado && !doEnxame && danos[1] && !/saving throw/.test(t.slice(0, t.indexOf(danos[1][0])).split('.').pop() ?? '');
  if (extra) g.danoExtra = { damage: danos[1][1].replace(/\s+/g, ''), type: DANO[danos[1][2]] ?? danos[1][2] };
  // o que acontece a quem falha na resistência
  const dc = t.match(/\{@dc (\d+)\} (\w+) saving throw/);
  const cond = t.match(/\{@condition (\w+)\}/);
  const agarra = t.match(/grappled\}? \(escape \{@dc (\d+)\}\)/);
  if (agarra) {
    g.onHit = { semResistencia: true, dc: Number(agarra[1]), escape: Number(agarra[1]), condition: /restrained/.test(t) ? 'contido' : 'agarrado', note: 'é agarrado' };
  } else if (soPrende || soAmaldicoa) {
    // já decidido acima
  } else if (dc && cond && CONDICAO_DO_MOTOR[cond[1]]) {
    const minuto = /for 1 minute/.test(t);
    // "enquanto durar o veneno, o alvo fica paralisado" (o carniçal rastejante): a condição que vale é a segunda
    const vale = /Until this poison ends, the target is \{@condition paralyzed\}/.test(t) ? 'paralisado' : CONDICAO_DO_MOTOR[cond[1]];
    g.onHit = { save: ATRIBUTO[dc[2].toLowerCase()], dc: Number(dc[1]), condition: vale, rounds: minuto ? 10 : 1, repete: /repeat the saving throw/.test(t) };
  } else if (dc && danos[1]) {
    g.onHit = { save: ATRIBUTO[dc[2].toLowerCase()], dc: Number(dc[1]), danoSeFalhar: { damage: danos[1][1].replace(/\s+/g, ''), type: DANO[danos[1][2]] ?? danos[1][2] }, metadeSePassar: /half as much/.test(t) };
    delete g.danoExtra;
  }
  if (/swallowed/.test(t) && !/makes one bite attack against/.test(t)) {
    const tam = (t.match(/If the target is an? (\w+) or smaller creature/) ?? t.match(/If the target is a creature of (\w+) size or smaller/))?.[1]?.toLowerCase() ?? 'medium';
    const acido = t.match(/takes \d+ \(\{@damage ([^}]+)\}\) (\w+) damage at the start/);
    const vom = t.match(/takes (\d+) damage or more on a single turn from a creature inside it, the \w+ must succeed on a \{@dc (\d+)\}/);
    const sv = t.match(/must succeed on a \{@dc (\d+)\} (\w+) saving throw or be swallowed/);
    g.engole = {
      tamanhoMax: tam,
      ...(acido ? { dano: acido[1].replace(/\s+/g, ''), tipoDano: DANO[acido[2]] ?? acido[2] } : {}),
      ...(vom ? { regurgita: { dano: Number(vom[1]), dc: Number(vom[2]) } } : {}),
      ...(sv ? { save: ATRIBUTO[sv[2].toLowerCase()], dc: Number(sv[1]) } : {}),
      ...(/grappled\}? by the/.test(t) ? { soAgarrado: true } : {}),
      // o couraçado astral: só engole quem a mordida derruba a 0 PV ou quem já está incapacitado
      ...(/reduces it to 0 hit points or it is \{@condition incapacitated\}/.test(t) ? { exige: 'zeroOuIncapacitado' } : {}),
    };
    // o ácido do estômago não é dano a mais da mordida
    if (acido && g.danoExtra?.damage === acido[1].replace(/\s+/g, '')) delete g.danoExtra;
    // o "cego" que a leitura de condição tirou daqui é o do engolido: quem engole já cega
    // e o teste que a leitura tirou do VÔMITO ("Constituição CD 25" do kraken) não é efeito do acerto; o agarrão fica
    if (g.onHit && !g.onHit.semResistencia) delete g.onHit;
  }
  if (/\{@recharge/.test(acao.name)) g.recharge = rechargeDe(acao.name);
  return g;
}

const rechargeDe = (nome) => { const n = Number(nome.match(/\{@recharge (\d)?\}/)?.[1] ?? 6); return Array.from({ length: 7 - n }, (_, i) => n + i); };

/** O SOPRO e as ações de área com teste ("exhales ... in a 60-foot cone. Each creature ... DC 18 Dexterity ... 56 (16d6) fire"). */
export function sopro(acao, nomePt) {
  const t = semTags(texto(acao.entries));
  // "a line that is 20 feet long and 5 feet wide" (o behir, o ankheg) é a mesma linha
  const comprida = t.match(/line (?:of \w+ )?that is (\d+) feet long/) ?? t.match(/in a line (\d+) feet long/);
  const forma = comprida ? [null, comprida[1], 'line'] : t.match(/(\d+)-foot(?:-long)?[ -](cone|line|cube|radius|sphere)/);
  const dc = t.match(/DC (\d+) (\w+) saving throw/);
  const dano = t.match(/taking \d+ \(([\dd+ ]+)\) (\w+) damage/);
  if (!forma || !dc || !dano) return null;
  const shape = { cone: 'cone', line: 'linha', cube: 'cube', radius: 'sphere', sphere: 'sphere' }[forma[2]];
  return {
    name: nomePt, kind: 'save', shape, areaFt: Number(forma[1]), save: ATRIBUTO[dc[2].toLowerCase()], dc: Number(dc[1]),
    damage: dano[1].replace(/\s+/g, ''), damageType: DANO[dano[2]] ?? dano[2], halfOnSave: /half as much/.test(t), origem: 'sopro',
    ...(shape === 'linha' ? { larguraFt: Number(t.match(/(\d+) feet wide/)?.[1] ?? 5) } : {}),
    ...(/\{@recharge/.test(acao.name) ? { recharge: rechargeDe(acao.name) } : {}),
  };
}

/**
 * O MULTIATAQUE, lido do texto do livro. O bloco do jogo leva:
 *   { count }                         N golpes com a arma que a IA escolheu ("makes two melee attacks")
 *   { count, sequence }               uma sequência fixa ("one with its bite and two with its claws")
 *   { count, sequencias }             sequências ALTERNATIVAS: vale a que tem a arma escolhida ("... or three with its
 *                                     tail spikes"; "two fist attacks or two maul attacks"; "only one of which can be a
 *                                     bite"; as formas do licantropo)
 *   { ..., condicional: { B: A } }    o golpe B só sai se A acertou nesta ação (o bico do grick alfa)
 * `ataques` são os golpes já lidos do bloco (o nome em português e o `nomeEn`), para casar o texto com eles.
 */
export function multiataque(acao, nomesPt, ataques = []) {
  let t = semTags(texto(acao.entries)).toLowerCase().replace(/\s+/g, ' ');
  const total = NUMERO[t.match(/makes (\w+) (?:\w+ )?attacks/)?.[1]] ?? NUMERO[t.match(/makes (\w+)/)?.[1]] ?? 2;
  // os golpes que o texto pode nomear, do nome mais comprido ao mais curto ("tail spike" antes de "tail")
  const golpes = ataques.map((g) => ({ pt: g.name, en: String(g.nomeEn ?? '').toLowerCase().replace(/\s*\(.*\)/, '').trim(), ranged: !!g.ranged }))
    .filter((g) => g.en).sort((a, b) => b.en.length - a.en.length);
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  /** O golpe nomeado no começo de `s` (com plural, ou só pela última palavra: "stinger" de "tail stinger"). */
  const golpeEm = (s) => {
    for (const passo of ['inteiro', 'ultima']) {
      for (const g of golpes) {
        const forma = passo === 'inteiro' ? g.en : g.en.split(' ').pop();
        const m = s.match(new RegExp(`^${esc(forma)}(?:e?s)?\\b`));
        if (m) return { g, len: m[0].length };
      }
    }
    return null;
  };
  const NUM = 'one|two|three|four|five|six|seven|eight|nine|ten';
  const LIGA = '(?: (?:melee|ranged))?(?: attacks?)?(?: (?:with (?:its|his|her|their) |with |to )| )';

  // AS ORAÇÕES ESPECIAIS, lidas e tiradas do texto antes da contagem
  // o golpe condicional: "if it hits with its tentacles, the grick can make one beak attack against the same target"
  const condicional = {};
  t = t.replace(/if it hits with (?:its |his |her )?([a-z ]+?), [^.]*?one ([a-z ]+?) attack[^.]*\./, (tudo, a, b) => {
    const ga = golpeEm(a); const gb = golpeEm(b);
    if (ga && gb) condicional[gb.g.pt] = ga.g.pt;
    return '';
  });
  // a troca: "it can make one tail attack in place of its two claw attacks"
  let troca = null;
  t = t.replace(/it can make one ([a-z ]+?) attack in place of its (\w+) ([a-z ]+?) attacks\./, (tudo, novo, n, velho) => {
    const gn = golpeEm(novo); const gv = golpeEm(velho);
    if (gn && gv) troca = { novo: gn.g.pt, velho: gv.g.pt, n: NUMERO[n] ?? 2 };
    return '';
  });
  // a substituição: "it can replace one of those attacks with a bite attack"
  let substitui = null;
  t = t.replace(/it can replace one of those attacks with an? ([a-z ]+?) attack\./, (tudo, novo) => { substitui = golpeEm(novo)?.g.pt ?? null; return ''; });
  // só um pode ser: "only one of which can be a bite attack"; "can use its bite only once"; "can constrict only once"
  const soUm = [];
  t = t.replace(/only one of which can be (?:a |an |with (?:its |his |her ))?([a-z ]+?)(?: attack)?\./, (tudo, x) => { const g = golpeEm(x); if (g) soUm.push(g.g.pt); return '.'; });
  t = t.replace(/(?:but )?can (?:use (?:its|his|her) )?([a-z ]+?)(?: and ([a-z ]+?))?(?: attacks)? only once(?: each)?/, (tudo, a, b) => {
    for (const x of [a, b].filter(Boolean)) { const g = golpeEm(x); if (g) soUm.push(g.g.pt); }
    return '';
  });
  // cada golpe com uma arma diferente ("each one with a different weapon")
  const diferentes = /each one with a different weapon/.test(t);
  // "either with its X or its Y" é o mesmo que "with its X or its Y"
  t = t.replace(/, either with/g, ' with');

  // AS ALTERNATIVAS: cada frase, e cada "or" seguido de número ("... or two with its longbow")
  const partes = t.split(new RegExp(`\\.\\s*|,? or (?=(?:make |makes )?(?:${NUM})\\b)`)).map((s) => s.trim()).filter(Boolean);
  const sequencias = [];
  // as partes SEM nome de golpe ("three melee attacks", "or two ranged attacks"): valem para qualquer arma daquele tipo
  const generico = {};
  for (const parte of partes) {
    // os grupos "N [com] golpe [ou golpe2]", em ordem
    const grupos = [];
    const re = new RegExp(`\\b(${NUM})\\b${LIGA}`, 'g');
    let m;
    while ((m = re.exec(parte))) {
      const resto = parte.slice(m.index + m[0].length);
      const g1 = golpeEm(resto);
      if (!g1) continue;
      const opcoes = [g1.g.pt];
      // "two with his claws or trident", "two attacks with its greataxe or its spear"
      const depois = resto.slice(g1.len).match(/^(?: attacks?)? or (?:its |his |her )?/);
      if (depois) { const g2 = golpeEm(resto.slice(g1.len + depois[0].length)); if (g2) opcoes.push(g2.g.pt); }
      grupos.push({ n: NUMERO[m[1]], opcoes });
    }
    if (!grupos.length) {
      const g = parte.match(new RegExp(`\\b(${NUM})\\b (?:(melee|ranged) )?attacks?\\b`));
      if (g) generico[g[2] ?? 'qualquer'] ??= NUMERO[g[1]];
      continue;
    }
    // a primeira opção de cada grupo, e uma sequência a mais para cada opção alternativa
    sequencias.push(grupos.flatMap((gr) => Array(gr.n).fill(gr.opcoes[0])));
    grupos.forEach((gr, i) => gr.opcoes.slice(1).forEach((alt) => {
      sequencias.push(grupos.flatMap((x, j) => Array(x.n).fill(j === i ? alt : x.opcoes[0])));
    }));
  }
  // a TROCA (a tartaruga-dragão): a mesma sequência com o golpe novo no lugar dos velhos
  if (troca) for (const s of [...sequencias]) if (s.filter((x) => x === troca.velho).length >= troca.n) {
    const nova = [];
    let tirou = 0;
    for (const x of s) { if (x === troca.velho && tirou < troca.n) { if (!tirou) nova.push(troca.novo); tirou++; } else nova.push(x); }
    sequencias.push(nova);
  }
  // a SUBSTITUIÇÃO (a drider): nas sequências de perto, o último golpe vira a mordida
  if (substitui) for (const s of sequencias) {
    const g = golpes.find((x) => x.pt === s[0]);
    if (g && !g.ranged) s[s.length - 1] = substitui;
  }
  // SÓ UM PODE SER (o vampiro, o licantropo, o yuan-ti): no máximo um de cada golpe restrito
  const nPerto = generico.melee ?? generico.qualquer ?? total;
  const nLonge = generico.ranged ?? generico.qualquer ?? total;
  if (soUm.length && !sequencias.length && (generico.melee || generico.ranged)) {
    // "two ranged attacks or three melee attacks, but can use its bite and constrict only once each"
    for (const a of golpes.filter((g) => !soUm.includes(g.pt))) {
      sequencias.push(a.ranged ? Array(nLonge).fill(a.pt) : [...Array(Math.max(1, nPerto - soUm.length)).fill(a.pt), ...soUm].slice(0, nPerto));
    }
  } else if (soUm.length) {
    if (sequencias.length) {
      // as que o texto já deu (o yuan-ti: "duas à distância ou três de perto"): nas de perto, um de cada dos restritos no fim
      for (const s of sequencias) {
        const g = golpes.find((x) => x.pt === s[0]);
        if (!g || g.ranged || soUm.includes(s[0])) continue;
        soUm.slice(0, s.length - 1).forEach((u, i) => { s[s.length - 1 - i] = u; });
      }
    } else {
      for (const a of golpes.filter((g) => !soUm.includes(g.pt))) {
        sequencias.push(a.ranged ? Array(total).fill(a.pt) : [...Array(Math.max(1, total - soUm.length)).fill(a.pt), ...soUm].slice(0, total));
      }
    }
  }
  // CADA UM COM UMA ARMA DIFERENTE (o homem-lagarto): o primeiro golpe de perto com cada um dos outros
  if (diferentes && !sequencias.length) {
    const perto = ataques.filter((g) => !g.ranged).map((g) => g.name);
    for (const b of perto.slice(1)) sequencias.push([perto[0], b].slice(0, total));
  }
  // sem nome de golpe nenhum ("makes two melee attacks"): N golpes da arma escolhida
  const unicas = sequencias.filter((s, i) => sequencias.findIndex((x) => x.join('|') === s.join('|')) === i);
  if (!unicas.length) {
    // "three melee attacks or two ranged attacks": N da arma escolhida, e as de longe com o número delas
    const longe = generico.ranged ? Object.fromEntries(golpes.filter((g) => g.ranged).map((g) => [g.pt, generico.ranged])) : {};
    return { count: generico.melee ?? generico.qualquer ?? total, ...(Object.keys(longe).length ? { porArma: longe } : {}) };
  }
  // A PARTE GENÉRICA MAIS UMA NOMEADA (o senhor da guerra hobgoblin: "três de perto; ou duas azagaias"): N da arma
  // escolhida, e as nomeadas de uma arma só viram `porArma` com o número delas
  if ((generico.melee || generico.qualquer) && unicas.every((s) => new Set(s).size === 1)) {
    return { count: generico.melee ?? generico.qualquer, porArma: Object.fromEntries(unicas.map((s) => [s[0], s.length])) };
  }
  // o golpe condicional entra na sequência logo depois do golpe de que depende
  for (const [b, a] of Object.entries(condicional)) for (const s of unicas) { const i = s.indexOf(a); if (i >= 0 && !s.includes(b)) s.splice(i + 1, 0, b); }
  const extra = Object.keys(condicional).length ? { condicional } : {};
  const count = Math.max(total, ...unicas.map((s) => s.length));
  if (unicas.length === 1) return { count, sequence: unicas[0], ...extra };
  return { count, sequencias: unicas, ...extra };
}

// ---------------------------------------------------------------------------------------------- conjuração ----
export function conjuracao(m, magiasEn, pendentes) {
  const sc = (m.spellcasting ?? [])[0];
  if (!sc) return null;
  const t = semTags(texto(sc.headerEntries));
  const ability = ATRIBUTO[(sc.ability ?? t.match(/spellcasting ability is (\w+)/)?.[1] ?? 'intelligence').toLowerCase()] ?? sc.ability ?? 'int';
  const dc = Number(t.match(/DC (\d+)/)?.[1] ?? 0);
  const ids = (lista) => (lista ?? []).map((s) => semTags(s).replace(/\*/g, '').replace(/\s*\(.*\)\s*$/, '').trim().toLowerCase()).map((n) => {
    const id = magiasEn[n];
    if (!id) pendentes.add(n);
    return id;
  }).filter(Boolean);
  const out = { ability, cantrips: [], prepared: [], slots: [], noMotor: true, conjuraNoTurno: 'geral' };
  if (sc.spells) {
    for (const [nivel, v] of Object.entries(sc.spells)) {
      const lista = ids(v.spells);
      if (nivel === '0') out.cantrips.push(...lista);
      else { out.prepared.push(...lista); out.slots[Number(nivel)] = v.slots ?? 0; }
    }
    for (let i = 0; i < out.slots.length; i++) out.slots[i] ??= 0;
  }
  const porDia = {};
  for (const [k, lista] of Object.entries(sc.daily ?? {})) for (const id of ids(lista)) { porDia[id] = Number(k.replace('e', '')); out.prepared.push(id); }
  const aVontade = ids(sc.will);
  if (Object.keys(porDia).length) out.porDia = porDia;
  if (aVontade.length) { out.aVontade = aVontade; out.prepared.push(...aVontade); }
  if (dc) out.cdPorMagia = Object.fromEntries([...out.cantrips, ...out.prepared].map((id) => [id, dc]));
  out.prepared = [...new Set(out.prepared)];
  return out.cantrips.length || out.prepared.length ? out : null;
}

// ------------------------------------------------------------------------------------------ traços lidos ----
// a condição de quem FALHA ("on a failed save ... frightened", "or be poisoned"), e não a primeira que o texto cita
const nCond = (t) => CONDICAO_DO_MOTOR[t.match(/(?:failed save|or be|or become|must succeed)[^{]*(?:\{@(?!condition)[^}]*\}[^{]*)*\{@condition (\w+)\}/)?.[1] ?? t.match(/\{@condition (\w+)\}/)?.[1]] ?? null;
const danoDo = (t) => { const d = t.match(/\(\{@damage ([^}]+)\}\) (\w+) damage/) ?? t.match(/\{@damage ([^}]+)\} (\w+) damage/); return d ? { damage: d[1].replace(/\s+/g, ''), type: DANO[d[2]] ?? d[2] } : null; };

/**
 * O traço que vira REGRA pelo texto do livro: devolve o pedaço de bloco que ele dá, ou null.
 *   Regeneração  -> `regeneracao: { pv, bloqueia }`       Explosão ao Morrer -> `explosaoAoMorrer`
 *   Investida, Investida Pisoteadora, Bote -> a `investida` do golpe nomeado
 *   Corpo Quente, Aura de Fogo, Aura de Medo, Fedor -> `corpoQuente`, `aura`
 *   Ataque Furtivo -> `features: ['sneakAttack']` e os dados
 */
export function tracoLido(en, tr, golpes, nomesDasAcoes) {
  const bruto = (tr.entries ?? []).filter((e) => typeof e === 'string').join(' ');
  const t = semTags(bruto);
  // A SEGUNDA FILA DOS BESTIÁRIOS (2026-11-12, `livro-motor.js`)
  // a AVERSÃO AO FOGO (o oblex): o fogo o deixa com desvantagem nos ataques até o fim do próximo turno dele
  if (/takes fire damage, it has disadvantage on attack rolls and ability checks until the end of its next turn/.test(t)) return { traco: 'aversaoAoFogo' };
  // o INDOMÁVEL (o campeão, o senhor da guerra): rola de novo a resistência que falhou, N vezes por dia
  if (en === 'Indomitable') return { traco: 'indomavelMonstro', usosIndomavel: Number(semTags(tr.name).match(/(\d)\/Day/)?.[1] ?? 1) };
  // a PROTEÇÃO ARCANA (o abjurador): um escudo de PV que leva o dano antes dele
  const ward = t.match(/has a magical ward that has (\d+) hit points/);
  if (ward) return { traco: 'protecaoArcana', protecaoArcana: Number(ward[1]) };
  // a PELE VENENOSA (o grung): quem o agarra ou o toca com a mão nua testa Constituição ou fica envenenado
  const pele = /comes into direct contact with the \w+'s skin must succeed on a DC (\d+) Constitution/.exec(t);
  if (pele) return { traco: 'peleVenenosa', peleVenenosa: { dc: Number(pele[1]) } };
  // o DESPERTAR DO REBENTO (os berços do Bigby): o berço que cai solta o rebento do gigante no lugar dele
  if (en === 'Awakening of the Scion') return { traco: 'despertarDoRebento' };
  // A MASMORRA SEMIPLANAR (o couraçado astral): quem ele engole vai para um semiplano; não o fere de dentro e só sai com
  // magia de viagem entre planos (`bloco` põe `masmorra` no `engole` da mordida)
  if (en === 'Demiplanar Donjon') return { traco: 'masmorraSemiplanar' };
  // O DESPERTAR (os grandes wyrms do Fizban, os aspectos de Tiamat e de Bahamut, a tartaruga-dragão anciã): em vez de cair
  // a 0 PV, volta com N PV, uma vez por luta, com o sopro recarregado e as resistências lendárias de volta
  const desperta = t.match(/would be reduced to 0 hit points, (?:its|her|his) current hit point total instead resets to (\d+) hit points/);
  if (desperta) return { despertar: { pv: Number(desperta[1]) }, traco: 'despertar' };
  if (en === 'Regeneration') {
    const pv = Number(t.match(/regains (\d+) hit points/)?.[1] ?? 0);
    if (!pv) return null;
    // o dano que BLOQUEIA: os tipos nomeados na frase que diz que o traço "não funciona" ("acid or fire damage")
    const frase = t.split('.').filter((x) => /doesn't function|does not function|isn't functional/.test(x)).join(' ');
    const palavras = frase.toLowerCase().split(/[^a-z]+/);
    const bloqueia = Object.keys(DANO).filter((en) => palavras.includes(en)).map((en) => DANO[en]);
    return { regeneracao: { pv, bloqueia: [...new Set(bloqueia)], ...(/dies only if it starts its turn with 0 hit points/.test(t) ? { naoMorreA0: true } : {}) }, traco: 'regeneracaoDoLivro' };
  }
  if (['Death Burst', 'Death Throes', 'Death Flash', 'Death Burn', 'Fiery Death and Rebirth', 'Corrupted Carrier', 'Shrapnel Explosion'].includes(en)) {
    const pes = Number(t.match(/within (\d+) feet/)?.[1] ?? t.match(/(\d+)-foot-radius/)?.[1] ?? 5);
    const dc = t.match(/DC (\d+) (\w+) saving throw/);
    // a fumaça do mefite: sem teste, só o ar que escurece por um minuto
    if (!dc && /heavily obscured|lightly obscured/.test(t)) return { explosaoAoMorrer: { pes, nuvem: true }, traco: 'explosaoAoMorrer' };
    if (!dc) return null;
    const d = danoDo(bruto);
    const cond = nCond(bruto);
    return { explosaoAoMorrer: { pes, save: ATRIBUTO[dc[2].toLowerCase()], dc: Number(dc[1]), ...(cond ? { condicao: cond, rounds: /1 minute/.test(t) ? 10 : 1 } : {}), ...(d ? { dano: d.damage, tipo: d.type, metade: /half as much/.test(t) } : {}) }, traco: 'explosaoAoMorrer' };
  }
  if (['Charge', 'Trampling Charge', 'Pounce'].includes(en)) {
    const pes = Number(t.match(/at least (\d+) feet/)?.[1] ?? 20);
    const arma = t.match(/hits it with an? ([a-z ]+?) attack/)?.[1] ?? t.match(/hits it with its ([a-z]+)/)?.[1];
    const g = golpes.find((x) => x.nomeEn?.toLowerCase().replace(/s$/, '') === arma?.replace(/s$/, ''));
    const dc = t.match(/DC (\d+) (\w+) saving throw/);
    const d = danoDo(bruto) ?? (() => { const x = bruto.match(/\{@damage ([^}]+)\}/); return x ? { damage: x[1].replace(/\s+/g, ''), type: g?.type } : null; })();
    if (!g || (!dc && !d)) return null;
    const bonusDe = t.match(/make one ([a-z ]+?) attack against it as a bonus action/)?.[1];
    const mordida = bonusDe ? Object.entries(nomesDasAcoes).find(([e]) => e.toLowerCase().replace(/s$/, '') === bonusDe.replace(/s$/, ''))?.[1] : null;
    g.investida = { pes, ...(dc ? { save: ATRIBUTO[dc[2].toLowerCase()], dc: Number(dc[1]) } : {}), ...(d ? { dano: d.damage, tipo: d.type } : {}), ...(mordida ? { mordeSeCair: mordida } : {}) };
    return { traco: null };
  }
  if (en === 'Dive Attack') {
    // o MERGULHO (o aarakocra, o peryton): voando, 30 pés em linha reta e o golpe de perto soma o dado
    const pes = Number(t.match(/at least (\d+) feet/)?.[1] ?? 30);
    const x = bruto.match(/\{@damage ([^}]+)\}/);
    if (!x) return null;
    for (const g of golpes.filter((y) => !y.ranged)) g.investida = { pes, dano: x[1].replace(/\s+/g, ''), tipo: g.type, soVoando: true };
    return { traco: null };
  }
  if (en === 'Wounded Fury') {
    const limiar = Number(t.match(/(\d+) hit points or fewer/)?.[1] ?? 0);
    const x = bruto.match(/\{@damage ([^}]+)\}/);
    return limiar && x ? { furiaFerida: { limiar, dano: x[1].replace(/\s+/g, '') }, traco: 'furiaFerida' } : null;
  }
  if (en === 'Illumination' || en === 'Ignited Illumination') {
    const claro = Number(t.match(/bright light in a (\d+)-foot radius/)?.[1] ?? 0);
    const pen = Number(t.match(/dim light for an additional (\d+) feet/)?.[1] ?? claro);
    return claro ? { luzPropria: { claro, penumbra: pen }, traco: null } : null;
  }
  if (en === 'Petrifying Gaze') {
    const dc = Number(t.match(/DC (\d+)/)?.[1] ?? 12);
    return { olharCd: dc, traco: 'olharPetrificante' };
  }
  if (en === 'Barbed Hide') {
    const d = bruto.match(/\{@damage ([^}]+)\}/);
    return d ? { espinhos: { dano: d[1].replace(/\s+/g, ''), tipo: 'perfurante' }, traco: 'espinhos' } : null;
  }
  if (en === 'Skewer') {
    const d = bruto.match(/\{@damage ([^}]+)\}/);
    return d ? { espetar: { dano: d[1].replace(/\s+/g, '') }, traco: 'espetar' } : null;
  }
  if (en === 'Fire Form' || en === 'Corrosive Form') {
    const d = danoDo(bruto) ?? (() => { const x = bruto.match(/\{@damage ([^}]+)\}\) (\w+)/) ?? bruto.match(/\{@damage ([^}]+)\} (\w+)/); return x ? { damage: x[1].replace(/\s+/g, ''), type: DANO[x[2]] ?? x[2] } : null; })();
    if (!d) return null;
    return en === 'Fire Form' ? { corpoQuente: d, traco: 'formaFluida' } : { corpoQuente: d, traco: 'corroiArma', features: ['corroeMadeira'] };
  }
  if (en === 'Horrific Appearance' || en === 'Gibbering' || en === 'Confusing Gaze') {
    const dc = t.match(/DC (\d+) (\w+) saving throw/);
    if (!dc) return null;
    const medo = en === 'Horrific Appearance';
    return { aura: { raioFt: Number(t.match(/within (\d+) feet/)?.[1] ?? 30), quando: 'inicioDoAlvo', save: ATRIBUTO[dc[2].toLowerCase()], dc: Number(dc[1]), condition: medo ? 'amedrontado' : 'desnorteado', imunizaAoPassar: medo, rounds: medo ? 10 : 1, ...(medo ? { repete: true } : {}), ...(/Gaze/.test(en) ? { olhar: true } : {}) }, traco: 'aura' };
  }
  if (en === 'Heated Body') {
    const d = danoDo(bruto);
    return d ? { corpoQuente: d, traco: 'corpoQuente' } : null;
  }
  if (en === 'Fire Aura') {
    const d = danoDo(bruto);
    return d ? { aura: { raioFt: Number(t.match(/within (\d+) feet/)?.[1] ?? 5), quando: 'inicioDoDono', damage: d.damage, damageType: d.type }, corpoQuente: d, traco: 'aura' } : null;
  }
  if (en === 'Fear Aura' || en === 'Stench') {
    const dc = t.match(/DC (\d+) (\w+) saving throw/);
    const cond = nCond(bruto);
    if (!dc || !cond) return null;
    return { aura: { raioFt: Number(t.match(/within (\d+) feet/)?.[1] ?? 5), quando: 'inicioDoAlvo', save: ATRIBUTO[dc[2].toLowerCase()], dc: Number(dc[1]), condition: cond, imunizaAoPassar: true }, traco: 'aura' };
  }
  if (en === 'Sneak Attack') {
    const dados = bruto.match(/\{@damage ([^}]+)\}/)?.[1]?.replace(/\s+/g, '');
    return dados ? { features: ['sneakAttack'], sneakAttack: dados, traco: null } : null;
  }
  if (en === "Devil's Sight") return { features: ['devilsSight'], traco: null };
  if (en === 'Evasion') return { features: ['evasion'], traco: null };
  // (por último: as regras com nome, acima, vencem; e o que é SABOR fica texto)
  // AS AURAS PELA FRASE: "any creature that starts its turn within N feet of X must succeed on a DC S Y saving throw or take
  // D damage / be C" (de quem está perto) e "at the start of each of X's turns, each creature within N feet" (do dono)
  const auraAlvo = t.match(/(?:Any|Each|A|When a) (?:non-[\w-]+ )?creature[^.]*?starts its turn within (\d+) feet of (?:the |one or more )?/i);
  const auraDono = t.match(/At the start of (?:each of )?(?:the )?[\w'\- ]+?(?:'s)? turns?, (?:any|each) creature (?:of (?:its|the [\w'\- ]+?'s) choice )?within (\d+) feet/i);
  const dcAura = t.match(/DC (\d+) (\w+) saving throw/);
  if ((auraAlvo || auraDono) && dcAura && !SABOR.has(en) && !/Bonus|bonus action/.test(t.slice(0, 40))) {
    const d = danoDo(bruto);
    // "if the bodak isn't incapacitated" é condição do DONO, não efeito: sai antes de ler a condição
    const cond = nCond(bruto.replace(/(?:isn't|is not|is|aren't|are not) \{@condition incapacitated\}|(?:isn't|is not) incapacitated|immune to the \{@condition \w+\} condition/g, ''));
    if (d || cond) {
      const minuto = /for 1 minute/.test(t);
      return {
        aura: {
          raioFt: Number((auraDono ?? auraAlvo)[1]), quando: auraDono ? 'inicioDoDono' : 'inicioDoAlvo', save: ATRIBUTO[dcAura[2].toLowerCase()], dc: Number(dcAura[1]),
          ...(d ? { damage: d.damage, damageType: d.type } : {}),
          ...(cond ? { condition: cond, rounds: minuto ? 10 : 1, ...(minuto ? { repete: true } : {}) } : {}),
          ...(/gaze|eyes/i.test(en + ' ' + t) ? { olhar: true } : {}),
          ...(/immune to (?:this|the [\w' ]+?'s) /.test(t) ? { imunizaAoPassar: true } : {}),
          ...(/of (?:its|the [\w'\- ]+?'s) choice/.test(t) ? { soInimigos: true } : {}),
        },
        traco: 'aura',
      };
    }
  }
  return null;
}

const NOME_DO_SOPRO = {
  'Fire Breath': 'Sopro de Fogo', 'Lightning Breath': 'Sopro Elétrico', 'Acid Breath': 'Sopro Ácido', 'Cold Breath': 'Sopro de Frio',
  'Poison Breath': 'Sopro Venenoso', 'Sleep Breath': 'Sopro do Sono', 'Repulsion Breath': 'Sopro Repulsor', 'Slowing Breath': 'Sopro Lento',
  'Weakening Breath': 'Sopro Debilitante', 'Paralyzing Breath': 'Sopro Paralisante',
};

/** Os SOPROS da ação "Breath Weapons" (os dragões metálicos): um por item da lista, com dano, condição ou empurrão. */
export function soprosDaLista(acao, nomePt) {
  const itens = (acao.entries ?? []).flatMap((e) => (typeof e === 'object' && e.items ? e.items : []));
  const rec = /\{@recharge/.test(acao.name) ? rechargeDe(acao.name) : null;
  return itens.map((it) => {
    const bruto = typeof it.entry === 'string' ? it.entry : texto(it.entries);
    const t = semTags(bruto);
    const forma = t.match(/(\d+)-foot(?:-long)?[ -](cone|line|cube)/);
    const dc = t.match(/DC (\d+) (\w+) saving throw/);
    if (!forma || !dc) return null;
    const shape = { cone: 'cone', line: 'linha', cube: 'cube' }[forma[2]];
    const d = danoDo(bruto);
    const cond = nCond(bruto);
    const empurra = Number(t.match(/pushed (\d+) feet away/)?.[1] ?? 0);
    if (!d && !cond && !empurra) return null;
    return {
      name: NOME_DO_SOPRO[it.name] ?? (it.name ? `${nomePt}: ${it.name}` : nomePt), kind: 'save', shape, areaFt: Number(forma[1]), save: ATRIBUTO[dc[2].toLowerCase()], dc: Number(dc[1]),
      ...(empurra ? { empurraFt: empurra } : {}),
      ...(d ? { damage: d.damage, damageType: d.type, halfOnSave: /half as much/.test(t) } : {}),
      ...(cond ? { condition: cond, rounds: /10 minutes/.test(t) ? 100 : /1 minute/.test(t) ? 10 : 1 } : {}),
      ...(shape === 'linha' ? { larguraFt: Number(t.match(/(\d+) feet wide/)?.[1] ?? 5) } : {}),
      origem: 'sopro', chaveRecarga: nomePt, ...(rec ? { recharge: rec } : {}),
    };
  }).filter(Boolean);
}

/**
 * AS INVOCAÇÕES do Monster Manual: quem vem, quantos, a chance e a demora. Os ids são os do jogo (feitos à mão ou
 * importados). Texto variado demais para ler: a tabela segue o livro.
 */
const INVOCACOES = {
  'Children of the Night': { opcoes: [{ id: 'enxameDeMorcegos', dados: '2d4' }, { id: 'enxameDeRatos', dados: '2d4' }], demoraDados: '1d4', semSol: true },
  'Summon Demon': { opcoes: [{ id: 'quasit', dados: '1' }, { id: 'demonioDasSombras', dados: '1', chance: 50 }] },
  'Animate Trees': { opcoes: [{ id: 'ente', dados: '1d2' }] },
  'Flying Sword': { opcoes: [{ id: 'espadaVoadora', dados: '1' }] },
  'Animate Chains': { opcoes: [{ id: 'espadaVoadora', dados: '1d4', nome: 'Corrente Animada' }] },
};

/**
 * A AÇÃO ESPECIAL que cabe numa forma só: ÁREA (cone, linha, ou "cada criatura a até X pés dele") ou ALVO ("uma
 * criatura que ele vê a até X pés"), com teste, dano e/ou condição; o TOQUE que cura; o TELEPORTE. Usos por dia e
 * recarga vêm do nome ("(3/Day)", "{@recharge 5}"). O que não cabe volta null e fica na fila.
 */
export function acaoEspecial(acao, nomePt) {
  const bruto = (acao.entries ?? []).filter((e) => typeof e === 'string').join(' ');
  const t = semTags(bruto);
  const usos = Number(semTags(acao.name).match(/(\d)\/Day/)?.[1] ?? 0);
  const comum = { nome: nomePt, ...(usos ? { porDia: usos } : {}), ...(/\{@recharge/.test(acao.name) ? { recharge: rechargeDe(acao.name) } : {}) };
  const inv = INVOCACOES[limpaNome(acao.name)];
  if (inv) return { ...comum, tipo: 'invocar', ...inv, porDia: comum.porDia ?? 1 };
  // o RUGIDO da androesfinge: três estágios, cada um mais forte
  if (/^Roar/.test(limpaNome(acao.name))) {
    const itens = (acao.entries ?? []).flatMap((e) => (typeof e === 'object' && e.items ? e.items : []));
    const estagios = itens.map((it) => acaoEspecial({ name: 'x', entries: [`Each creature within 500 feet of it ${typeof it.entry === 'string' ? it.entry.replace(/^Each creature that /, 'that ') : ''}`] }, nomePt)).filter(Boolean);
    if (estagios.length) return { ...comum, tipo: 'estagios', estagios, porDia: 3 };
  }
  if (/transforms into toxic mist/.test(t)) return { ...comum, tipo: 'nevoa' };
  if (/enters? the Ethereal Plane|teleports itself and up to/.test(t)) return { ...comum, tipo: 'etereo' };
  const engole = t.match(/makes one bite attack against an? (\w+) or smaller (?:target|creature) it is grappling/);
  if (engole) {
    const x = bruto.match(/takes \d+ \(\{@damage ([^}]+)\}\) (\w+) damage at the start/);
    const vom = t.match(/takes (\d+) damage or more on a single turn from (?:the swallowed creature|a creature inside it), the \w+ must succeed on a DC (\d+)/);
    return { ...comum, tipo: 'engolir', tamanhoMax: engole[1].toLowerCase(), ...(x ? { dano: x[1].replace(/\s+/g, ''), tipoDano: DANO[x[2]] ?? x[2] } : {}), ...(vom ? { regurgita: { dano: Number(vom[1]), dc: Number(vom[2]) } } : {}) };
  }
  if (/Whenever the cube enters a creature's space/.test(t)) {
    const dc = t.match(/DC (\d+) (\w+) saving throw/);
    const x = [...bruto.matchAll(/\(\{@damage ([^}]+)\}\) (\w+) damage/g)];
    return { ...comum, tipo: 'engolfar', save: ATRIBUTO[dc[2].toLowerCase()], dc: Number(dc[1]), dano: x[0]?.[1].replace(/\s+/g, ''), danoPorTurno: (x[1] ?? x[0])?.[1].replace(/\s+/g, ''), tipoDano: DANO[x[0]?.[2]] ?? 'ácido' };
  }
  if (/pulls each creature grappled by it/.test(t)) return { ...comum, tipo: 'puxarAgarrados', pes: Number(t.match(/up to (\d+) feet/)?.[1] ?? 25) };
  if (/creature grappled by the \w+ is thrown/.test(t)) return { ...comum, tipo: 'arremessar', pes: Number(t.match(/thrown up to (\d+) feet/)?.[1] ?? 60) };
  if (/magically increases in size/.test(t)) return { ...comum, tipo: 'aumentar' };
  if (/radius of magical darkness extends out/.test(t)) return { ...comum, tipo: 'escuridao', raioFt: Number(t.match(/(\d+)-foot radius/)?.[1] ?? 15) };
  if (/cylinder of swirling air magically forms on a point/.test(t)) { const dc = t.match(/DC (\d+) (\w+) saving throw/); return { ...comum, tipo: 'alvo', alcanceFt: 120, save: ATRIBUTO[dc[2].toLowerCase()], dc: Number(dc[1]), condition: 'contido', rounds: 10, repete: true }; }
  if (/gains advantage on attack rolls until the start of the/.test(t)) return { ...comum, tipo: 'gritoDeGuerra', raioFt: Number(t.match(/within (\d+) feet/)?.[1] ?? 30) };
  if (/makes a Charisma check contested by the (?:creature|target)'s Strength/.test(t)) return { ...comum, tipo: 'telecinese' };
  if (/corrodes a nonmagical ferrous metal object/.test(t)) return { ...comum, tipo: 'corroerArmadura', dc: Number(t.match(/DC (\d+)/)?.[1] ?? 11) };
  if (/land on its feet in a space that contains one or more other creatures/.test(t)) {
    const dc = t.match(/DC (\d+)/);
    const x = [...bruto.matchAll(/\(\{@damage ([^}]+)\}\) (\w+) damage/g)];
    return { ...comum, tipo: 'area', shape: 'raio', areaFt: 5, save: 'dex', dc: Number(dc[1]), damage: x[0][1].replace(/\s+/g, ''), damageType: DANO[x[0][2]], ...(x[1] ? { damage2: x[1][1].replace(/\s+/g, ''), damageType2: DANO[x[1][2]] } : {}), halfOnSave: true, condition: 'caido', rounds: 1, soDepoisDeSaltar: 15 };
  }
  if (/kisses a creature charmed by it/.test(t)) {
    const dc = t.match(/DC (\d+) (\w+) saving throw/);
    const d = danoDo(bruto);
    return { ...comum, tipo: 'alvo', alcanceFt: 5, soComCondicao: 'enfeiticado', save: ATRIBUTO[dc[2].toLowerCase()], dc: Number(dc[1]), damage: d.damage, damageType: d.type, halfOnSave: true, reduzMaximo: true };
  }
  if (/targets one or more creatures it can see within (\d+) feet/.test(t)) {
    const dc = t.match(/DC (\d+) (\w+) saving throw/);
    return { ...comum, tipo: 'area', shape: 'raio', areaFt: Number(t.match(/within (\d+) feet/)[1]), save: ATRIBUTO[dc[2].toLowerCase()], dc: Number(dc[1]), condition: 'lentificado', rounds: 10, repete: true };
  }
  const tele = t.match(/teleports?\b.*?(?:up to )?(\d+) feet/);
  if (tele) return { ...comum, tipo: 'teleporte', alcanceFt: Number(tele[1]) };
  const cura = bruto.match(/regains \d+ \(\{@dice ([^}]+)\}\) hit points/);
  if (cura) return { ...comum, tipo: 'cura', dados: cura[1].replace(/\s+/g, '') };
  const curaFixa = t.match(/can regain (\d+) hit points/);
  if (curaFixa) return { ...comum, tipo: 'cura', dados: curaFixa[1], soEmSi: true };
  if (/withdraws into its shell/.test(t)) return { ...comum, tipo: 'concha', ca: Number(t.match(/\+(\d+) bonus to AC/)?.[1] ?? 4) };
  // o GOLPE DE AÇÃO BÔNUS com dano a mais, que deixa quem golpeia exposto (a Fúria Marcial do espectro da espada)
  const golpeB = bruto.match(/can make one weapon attack(?:, which deals an extra \d+ \(\{@damage ([^}]+)\}\) (\w+) damage on a hit)?\./);
  if (golpeB) return { ...comum, tipo: 'golpeBonus', ...(golpeB[1] ? { extra: golpeB[1].replace(/\s+/g, ''), extraTipo: DANO[golpeB[2]] ?? golpeB[2] } : {}), exposto: /attack rolls against it have advantage/.test(t) };
  const dc = t.match(/DC (\d+) (\w+) saving throw/);
  if (!dc) return null;
  const d = danoDo(bruto);
  const cond = nCond(bruto) ?? (/roll a \{@dice d6\} at the start of each of its turns/.test(bruto) ? 'euforico'
    : /can't use reactions, its speed is halved/.test(t) ? 'lentificado' : /speed halved and has disadvantage/.test(t) ? 'deformado'
    : /disadvantage on Wisdom saving throws and all ability checks/.test(t) ? 'amaldicoadoLamia'
      : /disadvantage on ability checks, attack rolls, and saving throws/.test(t) ? 'escarnecido' : /drop to 0 hit points/.test(t) ? 'caido' : null);
  if (!d && !cond) return null;
  const comprida = t.match(/line (?:of \w+ )?that is (\d+) feet long/) ?? t.match(/in a line (\d+) feet long/);
  const forma = comprida ? [null, comprida[1], 'line'] : t.match(/(\d+)-foot(?:-long)?[ -](cone|line|cube)/);
  const noEspaco = !forma && (/in the [\w ]+'s space/i.test(t) || (/in its space/i.test(t) && !/within \d+ feet/.test(t))) ? [null, '5'] : null;
  // "each enemy within 30 feet" (o cavaleiro negro), "Creatures within 30 feet of the deep scion" (o rebento das profundezas)
  const raio = noEspaco ?? (!forma && /(?:each|every|any) (?:creature|humanoid|enemy)|(?:^|\. )Creatures within/i.test(t)
    ? t.match(/within (\d+) feet of (?:it|the \w+|him|her)/i) ?? t.match(/(\d+)-foot[ -]radius/i) ?? t.match(/(?:enemy|Creatures) within (\d+) feet/i) : null);
  const varios = !forma && !raio ? (t.match(/up to (\w+) creatures[^.]*?within (\d+) feet/i) ?? t.match(/creates (\w+) bolts of [^.]*?within (\d+) feet/i)
    ?? t.match(/targets one or (\w+) creatures[^.]*?within (\d+) feet/i)) : null;
  const alvo = !forma && !raio && !varios ? t.match(/(?:one|a) (?:creature|humanoid|target|frightened creature|creature charmed)[^.]*?within (\d+) feet/i) : null;
  const agarrado = !forma && !raio && !varios && !alvo && /creature grappled by/i.test(t);
  if (!forma && !raio && !varios && !alvo && !agarrado) return null;
  const cai0 = /drop to 0 hit points/.test(t);
  const aoPassar = t.match(/On a successful save, the (?:creature|target) is \{@condition (\w+)\}/) ?? bruto.match(/On a successful save, the (?:creature|target) is \{@condition (\w+)\}/);
  const rounds = /for 1 minute/.test(t) ? 10 : /until the (?:end|start) of (?:the [\w -]+?'s|its) next turn/.test(t) ? 1 : /for (?:1 hour|24 hours|1 day|8 hours)/.test(t) ? 100 : 10;
  return {
    ...comum,
    tipo: alvo || varios || agarrado ? 'alvo' : 'area',
    ...(forma ? { shape: { cone: 'cone', line: 'linha', cube: 'cube' }[forma[2]], areaFt: Number(forma[1]), ...(forma[2] === 'line' ? { larguraFt: Number(t.match(/(\d+) feet wide/)?.[1] ?? 5) } : {}) } : {}),
    ...(raio ? { shape: 'raio', areaFt: Number(raio[1]) } : {}),
    ...(alvo ? { alcanceFt: Number(alvo[1]) } : {}),
    ...(varios ? { alcanceFt: Number(varios[2]), alvos: NUMERO[varios[1].toLowerCase()] ?? 1 } : {}),
    ...(agarrado ? { alcanceFt: 15, soAgarrado: true } : {}),
    ...(/frightened creature/i.test(t) && alvo ? { soComCondicao: 'amedrontado' } : {}),
    ...(/creature charmed by it/i.test(t) ? { soComCondicao: 'enfeiticado' } : {}),
    ...(/drop to 0 hit points/.test(t) ? { cai0: true } : {}),
    ...(/knocked \{@condition prone\}|knocked prone/.test(bruto) && cond !== 'caido' ? { tambemCaido: true } : {}),
    ...(/flung up (\d+) feet/.test(t) ? { arremessaFt: Number(t.match(/flung up (\d+) feet/)[1]) } : {}),
    ...(/regains hit points equal to the total damage/.test(t) ? { drena: true } : {}),
    ...(/hit point maximum is reduced by an amount equal/.test(t) ? { reduzMaximo: true } : {}),
    save: ATRIBUTO[dc[2].toLowerCase()], dc: Number(dc[1]),
    ...(d ? { damage: d.damage, damageType: d.type, halfOnSave: /half as much|takes half the/.test(t) } : {}),
    ...(cond && !cai0 ? { condition: cond, rounds, repete: /repeat the saving throw/.test(t), ...(rounds === 1 ? { ateFimDoTurnoDele: true } : {}) } : {}),
    // a queda a 0 PV (o Uivo do semilich): a condição do texto é a de quem PASSA ("on a successful save, ... frightened")
    ...(cai0 && aoPassar ? { condicaoAoPassar: CONDICAO_DO_MOTOR[aoPassar[1]] } : {}),
    ...(/is immune to (?:this|the \w+'s)/.test(t) ? { imunizaAoPassar: true } : {}),
  };
}

// ---------------------------------------------------------------------------------------- lendárias e medo ----
/** A PRESENÇA ATERRADORA dos dragões (e de quem mais a tem): CD e alcance. */
export function presencaAterradora(acao) {
  const t = semTags(texto(acao.entries));
  const dc = Number(t.match(/DC (\d+)/)?.[1] ?? 0);
  if (!dc) return null;
  return { dc, alcanceFt: Number(t.match(/within (\d+) feet/)?.[1] ?? 120) };
}

/**
 * AS AÇÕES LENDÁRIAS: quantas por rodada e as opções que o motor sabe fazer — um GOLPE do próprio bloco ("makes a
 * tail attack") ou uma ÁREA em volta dele com teste ("Each creature within 10 feet ... DC 22 Dexterity ... 2d6 + 8
 * bludgeoning ... knocked prone": o golpe de asa). "Detect" não muda nada no tabuleiro e fica de fora; o resto vai para
 * a fila do motor.
 */
export function acoesLendarias(m, nomesDasAcoes, nomesPt, magiasEn = {}) {
  const opcoes = []; const faltam = [];
  const igual = (a, b) => a.toLowerCase().replace(/s$/, '') === b.toLowerCase().replace(/s$/, '');
  // o nome exato da ação, e senão a que CONTÉM o nome ("acid lash" é a Lash do Juiblex, "demonic weapon" a do molydeus)
  const acaoPt = (en) => Object.entries(nomesDasAcoes).find(([e]) => igual(e, en))?.[1]
    ?? Object.entries(nomesDasAcoes).find(([e]) => !/multiattack/i.test(e) && (e.toLowerCase().includes(en.toLowerCase()) || en.toLowerCase().includes(e.toLowerCase())))?.[1] ?? null;
  for (const l of m.legendary ?? []) {
    const en = limpaNome(l.name);
    // "Costs 2 Actions", "Cost 2 Actions" (o Bael) e "(2 Actions)" (o comandante githyanki)
    const custo = Number(String(l.name).match(/Costs? (\d)|\((\d) Actions\)/)?.slice(1).find(Boolean) ?? 1);
    const t = semTags(texto(l.entries));
    const bruto = texto(l.entries);
    // o custo já vai no número: "(Custa 2 Ações)" que a tradução deixou no nome sai dele
    const nome = String(nomesPt[en] ?? nomesPt[l.name] ?? en).replace(/\s*\((?:Custa|Custam|Custo)[^)]*\)\s*$/i, '');
    const base = { nome, custo };
    if (en === 'Detect') continue;
    // o GOLPE: "makes one tail attack", "makes one attack with its hooves", "makes one unarmed strike", "makes one weapon attack"
    const golpeDe = t.match(/makes (?:a|one) ([a-z ]+?) attack\b/i) ?? t.match(/makes one attack with its ([a-z ]+?)(?: or |\.|$)/i)
      ?? (/makes one attack\.?$/.test(t) ? [null, 'weapon'] : null)
      ?? (/makes one unarmed strike/i.test(t) ? [null, 'unarmed strike'] : null) ?? t.match(/uses its ([A-Z][a-z]+ [A-Z][a-z]+)(?: action)?\.?$/);
    if (golpeDe) {
      const alvo = golpeDe[1].toLowerCase().trim();
      // "makes one Claw or Tail attack": a primeira das duas que o bloco tem
      const arma = alvo.split(' or ').map((x) => acaoPt(x.trim())).find(Boolean)
        ?? (alvo === 'weapon' ? Object.entries(nomesDasAcoes).find(([e]) => !/multiattack/i.test(e))?.[1] : null);
      if (arma) { opcoes.push({ ...base, tipo: 'golpe', arma }); continue; }
    }
    // os outros jeitos de dizer um golpe: "attacks once with his mace", "makes one attack, either with its demonic weapon"
    const outroGolpe = t.match(/attacks (?:once )?with (?:his |her |its |their )?([A-Za-z' ]+?)\./) ?? t.match(/makes one attack, either with its ([a-z ]+?) or/)
      ?? t.match(/makes (?:a|one) (?:melee |ranged )?attack with (?:his |her |its |their )?([A-Za-z' ]+?)\./);
    if (outroGolpe) {
      const arma = acaoPt(outroGolpe[1].trim());
      if (arma) { opcoes.push({ ...base, tipo: 'golpe', arma }); continue; }
    }
    // o GOLPE QUE SÓ EXISTE COMO AÇÃO LENDÁRIA (a cauda do Demogorgon, o toque do Juiblex): o golpe vai dentro da opção
    if (/\{@atk /.test(bruto)) {
      const g = golpe(l, en);
      if (g) { g.name = nome; opcoes.push({ ...base, tipo: 'golpe', arma: nome, ataque: g }); continue; }
    }
    // a MAGIA COM NOME: "casts acid splash", "casts crown of madness or dissonant whispers", "casts the reverse gravity spell"
    const lancaMagia = t.match(/casts (?:the )?([a-z' ]+?)(?: spell)?(?: \(| or |,|\.)/);
    if (lancaMagia) {
      const nomes = t.replace(/^.*?casts (?:the )?/, '').replace(/ spell\b/, '').replace(/[(,.].*$/, '').split(' or ').map((x) => x.trim());
      const ids = nomes.map((x) => magiasEn[x]).filter(Boolean);
      if (ids.length) { opcoes.push({ ...base, tipo: 'magia', magias: ids }); continue; }
    }
    // a MAGIA: "uses Psychic Step or Spellcasting" (os dragões de gema) e "expends a spell slot to cast a 1st-, 2nd-, or
    // 3rd-level spell ... 1 legendary action per level" (três opções, de custo 1 a 3, cada uma até o círculo do custo)
    if (/uses (?:Psychic Step or )?Spellcasting/.test(t)) { opcoes.push({ ...base, tipo: 'magia' }); continue; }
    if (/spell slot to cast a 1st-, 2nd-, or 3rd-level spell/.test(t)) {
      for (const c of [1, 2, 3]) opcoes.push({ ...base, custo: c, tipo: 'magia', maxCirculo: c });
      continue;
    }
    // a LINHA com teste (o Raio Psíquico do grande wyrm de ametista)
    const linha = t.match(/in a (\d+)-foot line that is (\d+) feet wide/);
    const dcL = t.match(/DC (\d+) (\w+) saving throw/);
    const danoL = bruto.match(/\(\{@damage ([^}]+)\}\) (\w+) damage/);
    if (linha && dcL && danoL) {
      opcoes.push({ ...base, tipo: 'linha', comprimentoFt: Number(linha[1]), larguraFt: Number(linha[2]), save: ATRIBUTO[dcL[2].toLowerCase()], dc: Number(dcL[1]),
        damage: danoL[1].replace(/\s+/g, ''), damageType: DANO[danoL[2]] ?? danoL[2], halfOnSave: /half as much/.test(t) });
      continue;
    }
    // as LANÇAS que acertam sem teste, cada uma num alvo à escolha (a Lança Arcana do grande wyrm negro)
    const lancas = t.match(/creates (\w+) spears of magical force/);
    const danoLanca = bruto.match(/\(\{@damage ([^}]+)\}\) (\w+) damage/);
    if (lancas && danoLanca) {
      const N = { two: 2, three: 3, four: 4, five: 5, six: 6 };
      opcoes.push({ ...base, tipo: 'lancas', n: N[lancas[1]] ?? Number(lancas[1]) ?? 1, alcanceFt: Number(t.match(/within (\d+) feet/)?.[1] ?? 120),
        damage: danoLanca[1].replace(/\s+/g, ''), damageType: DANO[danoLanca[2]] ?? danoLanca[2] });
      continue;
    }
    // "uses its Fling" / o nome de uma ação especial (a Tempestade de Raios do kraken): a ação especial dele
    const daAcao = (m.action ?? []).find((a) => limpaNome(a.name) === en || new RegExp(`uses (?:its |his |her |their )?${limpaNome(a.name)}`).test(t));
    // "uses Extract Brain": a ação do bloco que é GOLPE vira o golpe lendário
    const golpeDaAcao = daAcao && !/Multiattack/.test(daAcao.name) && golpe(daAcao, en) ? nomesDasAcoes[limpaNome(daAcao.name)] : null;
    if (golpeDaAcao) { opcoes.push({ ...base, tipo: 'golpe', arma: golpeDaAcao }); continue; }
    const teleDaAcao = daAcao && semTags(texto(daAcao.entries)).match(/teleports[^.]*?up to (\d+) feet/);
    if (teleDaAcao) { opcoes.push({ ...base, tipo: 'teleporte', alcanceFt: Number(teleDaAcao[1]) }); continue; }
    if (daAcao && !/Multiattack/.test(daAcao.name) && !golpe(daAcao, en)) { opcoes.push({ ...base, tipo: 'especial', acao: nomesDasAcoes[limpaNome(daAcao.name)] ?? limpaNome(daAcao.name) }); continue; }
    if (/random eye ray/.test(t)) { opcoes.push({ ...base, tipo: 'raio' }); continue; }
    if (/casts a cantrip/.test(t)) { opcoes.push({ ...base, tipo: 'magia', soTruque: true }); continue; }
    if (/casts a spell/.test(t)) { opcoes.push({ ...base, tipo: 'magia' }); continue; }
    const tele = t.match(/teleports[^.]*?up to (\d+) feet/);
    if (tele) { opcoes.push({ ...base, tipo: 'teleporte', alcanceFt: Number(tele[1]) }); continue; }
    // (o ki-rin escreve "up to its half its speed")
    const anda = t.match(/(moves|flies) up to (?:its )?(half )?its (?:flying )?speed/);
    if (anda) { opcoes.push({ ...base, tipo: 'mover', metade: !!anda[2], semOportunidade: /without provoking/.test(t) }); continue; }
    const turbilhao = t.match(/transforms into a whirlwind[^.]*?moves up to (\d+) feet/);
    if (turbilhao) { opcoes.push({ ...base, tipo: 'mover', pes: Number(turbilhao[1]), semOportunidade: true }); continue; }
    const cura = t.match(/magically regains \d+ \(([\dd+ ]+)\) hit points/);
    if (cura) { opcoes.push({ ...base, tipo: 'curaPropria', dados: cura[1].replace(/\s+/g, '') }); continue; }
    if (/gains a \+(\d) bonus to AC/.test(t)) { opcoes.push({ ...base, tipo: 'escudo', bonus: Number(t.match(/\+(\d) bonus to AC/)[1]), alcanceFt: Number(t.match(/within (\d+) feet/)?.[1] ?? 60) }); continue; }
    if (/bolsters all nonhostile creatures/.test(t)) { opcoes.push({ ...base, tipo: 'reforco', raioFt: Number(t.match(/within (\d+) feet/)?.[1] ?? 120) }); continue; }
    if (/can't regain hit points/.test(t)) { opcoes.push({ ...base, tipo: 'semCura', raioFt: Number(t.match(/within (\d+) feet/)?.[1] ?? 60) }); continue; }
    if (/ink cloud/.test(t)) { opcoes.push({ ...base, tipo: 'tinta', raioFt: Number(t.match(/(\d+)-foot radius/)?.[1] ?? 60), dc: Number(t.match(/DC (\d+)/)?.[1] ?? 23), damage: t.match(/\(([\dd+ ]+)\) poison/)?.[1].replace(/\s+/g, '') ?? '3d10' }); continue; }
    // o dreno do aboleth: uma criatura enfeitiçada por ele sofre, e ele cura o mesmo
    const dreno = t.match(/One creature charmed by the \w+ takes \d+ \(([\dd+ ]+)\) (\w+) damage/);
    if (dreno) { opcoes.push({ ...base, tipo: 'alvo', alcanceFt: 120, soComCondicao: 'enfeiticado', semTeste: true, damage: dreno[1].replace(/\s+/g, ''), damageType: DANO[dreno[2]] ?? dreno[2], drena: true }); continue; }
    // A ÁREA e o ALVO com teste: dano (um ou dois tipos), condição, a vida máxima que cai, a maldição
    const dc = t.match(/DC (\d+) (\w+) saving throw/);
    const cadaUm = /\b[Ee]ach (?:non-undead )?creature|All other creatures/.test(t);
    const raioA = !cadaUm ? null : t.match(/(?:[Ee]ach|All other) [^.]*?creatures?[^.]*?within (\d+) feet/) ?? t.match(/in a (\d+)-foot radius/) ?? t.match(/within (\d+) feet of (?:the|it)/);
    const umAlvo = t.match(/(?:one creature|Choose one creature)[^.]*?within (\d+) feet/i) ?? t.match(/gaze on one creature [^.]*?within (\d+) feet/i)
      ?? (cadaUm ? null : t.match(/\b(?:at|around|targets) (?:a|one) (?:creature|enemy)[^.]*?within (\d+) feet/i));
    if (dc && (raioA || umAlvo)) {
      const danos = [...bruto.matchAll(/\(\{@damage ([^}]+)\}\) (\w+) damage/g)];
      const maximo = /hit point maximum is (?:magically )?reduced by \d+ \(([\dd+ ]+)\)/.exec(t);
      const cond = maldicaoOuCondicao(t, bruto);
      const rounds = /for 1 minute/.test(t) ? 10 : /until the end of the [\w' ]+next turn/.test(t) ? 1 : /until (?:freed|magic)/.test(t) ? 100 : 10;
      opcoes.push({
        ...base,
        tipo: umAlvo && !raioA ? 'alvo' : 'area',
        ...(umAlvo && !raioA ? { alcanceFt: Number(umAlvo[1]) } : { raioFt: Number(raioA[1]) }),
        save: ATRIBUTO[dc[2].toLowerCase()], dc: Number(dc[1]),
        ...(danos[0] ? { damage: danos[0][1].replace(/\s+/g, ''), damageType: DANO[danos[0][2]] ?? danos[0][2], halfOnSave: /half as much/.test(t) } : {}),
        ...(danos[1] ? { damage2: danos[1][1].replace(/\s+/g, ''), damageType2: DANO[danos[1][2]] ?? danos[1][2] } : {}),
        ...(maximo ? { reduzMaximoDados: maximo[1].replace(/\s+/g, '') } : {}),
        ...(cond ? { condition: cond, rounds, repete: /repeat the saving throw/.test(t), ...(rounds === 1 ? { ateFimDoTurnoDoAlvo: true } : {}) } : {}),
        ...(/knocked prone/.test(t) ? { condition: 'caido' } : {}),
        ...(/non-undead creature/.test(t) ? { naoMortosVivos: true } : {}),
        ...(/of its choice/.test(t) ? { soInimigos: true } : {}),
        ...(/on the ground/.test(t) ? { soNoChao: true } : {}),
        ...(/immune to this \w+'s [\w ]+ for the next 24 hours/.test(t) ? { imunizaAoPassar: true } : {}),
      });
      continue;
    }
    faltam.push(en);
  }
  return { acoes: m.legendaryActions ?? 3, opcoes, faltam };
}

/** A condição de uma ação lendária: a do motor, ou a maldição vil do semilich. */
function maldicaoOuCondicao(t, bruto) {
  if (/magically cursed/.test(t) && /disadvantage on attack rolls and saving throws/.test(t)) return 'malditoVil';
  return nCond(bruto);
}

/**
 * OS RAIOS OCULARES (o observador, o tirano da morte, o espectador): a lista de raios, cada um lido como uma ação de
 * teste — e o que nenhuma ação de teste tem (a telecinese, o sono, a pedra, o pó, a morte) vai em `efeito`.
 */
const NOME_DO_RAIO = {
  'Charm Ray': 'Raio Enfeitiçante', 'Paralyzing Ray': 'Raio Paralisante', 'Fear Ray': 'Raio do Medo', 'Slowing Ray': 'Raio Lento',
  'Enervation Ray': 'Raio Enervante', 'Telekinetic Ray': 'Raio Telecinético', 'Sleep Ray': 'Raio do Sono', 'Petrification Ray': 'Raio Petrificante',
  'Disintegration Ray': 'Raio Desintegrador', 'Death Ray': 'Raio da Morte', 'Confusion Ray': 'Raio Confuso', 'Wounding Ray': 'Raio Ferino',
};
export function raiosOculares(acao) {
  const cab = semTags(texto((acao.entries ?? []).filter((e) => typeof e === 'string')));
  const lista = (acao.entries ?? []).find((e) => e?.type === 'list');
  if (!lista) return null;
  const n = NUMERO[cab.match(/shoots (?:up to )?(\w+) of the following/)?.[1]] ?? 1;
  const alcanceFt = Number(cab.match(/within (\d+) feet/)?.[1] ?? 120);
  const raios = [];
  for (const it of lista.items ?? []) {
    const en = String(it.name ?? '').replace(/^\d+\.\s*/, '');
    const bruto = it.entry ?? texto(it.entries ?? []);
    const t = semTags(bruto);
    const dc = t.match(/DC (\d+) (\w+) saving throw/);
    if (!dc) continue;
    const d = danoDo(bruto);
    const r = { nome: NOME_DO_RAIO[en] ?? en, save: ATRIBUTO[dc[2].toLowerCase()], dc: Number(dc[1]) };
    if (d) Object.assign(r, { damage: d.damage, damageType: d.type, halfOnSave: /half as much/.test(t) });
    if (/moves it up to (\d+) feet/.test(t)) r.efeito = 'telecinese';
    else if (/fall asleep/.test(t)) r.efeito = 'sono';
    else if (/begins to turn to stone/.test(t)) r.efeito = 'petrificar';
    else if (/pile of fine gray dust/.test(t)) r.efeito = 'desintegrar';
    else if (/dies if the ray reduces it to 0/.test(t)) r.efeito = 'morte';
    else if (/uses its action to make a melee or ranged attack against a randomly determined creature/.test(t)) Object.assign(r, { condition: 'raioConfuso', rounds: 1 });
    else {
      const c = nCond(bruto);
      if (c) Object.assign(r, { condition: c, rounds: /for 1 hour/.test(t) ? 100 : /for 1 minute/.test(t) ? 10 : 1, repete: /repeat the saving throw/.test(t) });
    }
    raios.push(r);
  }
  return raios.length ? { n, alcanceFt, aoAcaso: /at random/.test(cab), raios } : null;
}

// -------------------------------------------------------------------------------------------------- bloco ----
export function bloco(m, pt, magiasEn, pend) {
  const cr = crDe(m);
  const pb = proficienciaDoNd(cr);
  const id = idDe(pt.nome);
  const tipoEn = typeof m.type === 'object' ? m.type.type : m.type;
  const abil = { str: m.str, dex: m.dex, con: m.con, int: m.int, wis: m.wis, cha: m.cha };
  const skills = []; const expertise = [];
  for (const [en, v] of Object.entries(m.skill ?? {})) {
    const p = PERICIA[en]; if (!p) continue;
    skills.push(p);
    if (Number(v) >= mod(abil[PERICIA_ATRIB[p]]) + pb * 2) expertise.push(p);
  }
  const res = tiposDeDano(m.resist, 'resist');
  const imu = tiposDeDano(m.immune, 'immune');
  const vul = tiposDeDano(m.vulnerable, 'vulnerable');
  const nomesDasAcoes = Object.fromEntries((pt.acoes ?? []).map((a) => [a.en, a.nome]));
  const ataques = [];
  let breath = null; let multi = null; let acaoDoMultiataque = null; let presenca = null; let sopros = null; let especiais = null; const extra = {};
  const tracos = []; const textoDosTracos = {};
  const textoSo = (en, ptA) => {
    const tid = `t_${idDe(ptA?.nome ?? en)}`;
    tracos.push(tid);
    textoDosTracos[tid] = { name: ptA?.nome ?? en, desc: ptA?.desc ?? '' };
  };
  const semMotor = (en, ptA, ondeh) => {
    const tid = `t_${idDe(ptA?.nome ?? en)}`;
    tracos.push(tid);
    textoDosTracos[tid] = { name: ptA?.nome ?? en, desc: ptA?.desc ?? '' };
    pend.push({ criatura: id, [ondeh]: en });
  };
  for (const a of m.action ?? []) {
    const en = limpaNome(a.name);
    const ptA = (pt.acoes ?? []).find((x) => x.en === en || x.en === a.name);
    // o multiataque se lê DEPOIS dos golpes: o texto nomeia golpes que vêm depois dele na lista
    if (/^Multiattack/.test(en)) { acaoDoMultiataque = a; continue; }
    if (en === 'Frightful Presence') { const pa = presencaAterradora(a); if (pa) { presenca = pa; tracos.push('presencaAterradora'); continue; } }
    const g = golpe(a, ptA?.nome ?? en);
    if (g) { g.nomeEn = en; ataques.push(g); continue; }
    if (Object.hasOwn(TRACO_DO_MOTOR, en) && TRACO_DO_MOTOR[en]) { tracos.push(TRACO_DO_MOTOR[en]); continue; }
    if (SABOR.has(en)) { textoSo(en, ptA); continue; }
    // OS RAIOS OCULARES: antes do sopro, que lia a lista de raios como um cubo de 3 m
    if (/^Eye Rays/.test(en)) { const r = raiosOculares(a); if (r) { extra.raiosOculares = r; tracos.push('raiosOculares'); continue; } }
    const s = sopro(a, ptA?.nome ?? en);
    // dois sopros na mesma ação (os dragões metálicos): os dois entram, e a IA escolhe (`sopros`)
    const lista = /^Breath Weapons/.test(en) ? soprosDaLista(a, ptA?.nome ?? en) : [];
    if (lista.length > 1 && !breath) { breath = lista[0]; sopros = lista; continue; }
    if (s && !breath) { breath = s; continue; }
    if (en === 'Curse of the Evil Eye') {
      const base = (especiais ?? []).find((x) => x.tipo === 'alvo' && /mau.olhado|olho/i.test(x.nome)) ?? (especiais ?? []).find((x) => x.tipo === 'alvo');
      if (base) { (especiais ??= []).push({ ...base, nome: ptA?.nome ?? en, condition: 'deformado', rounds: 100, repete: false, porDia: 1 }); continue; }
    }
    const esp = acaoEspecial(a, ptA?.nome ?? en);
    if (esp) { (especiais ??= []).push(esp); continue; }
    semMotor(en, ptA, 'acao');
  }
  for (const tr of m.trait ?? []) {
    const en = limpaNome(tr.name);
    const ptT = (pt.tracos ?? []).find((x) => x.en === en || x.en === tr.name);
    if (en === 'Spellcasting' || en === 'Innate Spellcasting') continue;
    // A INVISIBILIDADE DE SEMPRE (o perseguidor invisível, o poltergeist: "é invisível", e só): não é a do quasit, que
    // some por vontade e reaparece ao atacar. Com o mesmo traço, a IA do quasit o deixava parado esperando alguém ficar
    // fraco, e três perseguidores não tiravam um PV do grupo.
    if (en === 'Invisibility' && /^The [\w ]+ is \{@condition invisible\}\.?$/.test(String(tr.entries?.[0] ?? ''))) { tracos.push('sempreInvisivel'); continue; }
    if (Object.hasOwn(TRACO_DO_MOTOR, en)) { if (TRACO_DO_MOTOR[en]) tracos.push(TRACO_DO_MOTOR[en]); continue; }
    if (/^Legendary Resistance/.test(en)) continue;
    const lido = tracoLido(en, tr, ataques, nomesDasAcoes);
    if (lido) {
      const { traco, features, ...resto } = lido;
      if (traco) tracos.push(traco);
      if (features) extra.features = [...new Set([...(extra.features ?? []), ...features])];
      Object.assign(extra, resto);
      continue;
    }
    if (SABOR.has(en)) { textoSo(en, ptT); continue; }
    // o traço que a PRÓPRIA criatura usa como ação bônus vira ação especial com `bonus` (o Passo Feérico, o Segundo
    // Fôlego, a Fúria Marcial, a Provocação). Depois da leitura de sempre: o Balbucio do MM fala na ação bônus de quem o ouve
    // (o Desafio do Campeão prende quem falha perto do Donaar; a frase cita "incapacitado" sobre o próprio Donaar e a leitura
    // geral tomaria isso pela condição de quem falha: fica na fila)
    if (en !== 'Champion Challenge' && /(?:^|\. )As a bonus action, |can use a bonus action(?: on its turn)? to /.test(semTags((tr.entries ?? []).filter((e) => typeof e === 'string').join(' ')))) {
      const esp = acaoEspecial(tr, ptT?.nome ?? en);
      if (esp) { (especiais ??= []).push({ ...esp, bonus: true }); textoSo(en, ptT); continue; }
    }
    semMotor(en, ptT, 'traco');
  }
  for (const r of m.reaction ?? []) {
    const en = limpaNome(r.name);
    const ptR = (pt.reacoes ?? []).find((x) => x.en === en);
    if (Object.hasOwn(TRACO_DO_MOTOR, en) && TRACO_DO_MOTOR[en]) { tracos.push(TRACO_DO_MOTOR[en]); continue; }
    // AS REAÇÕES DE SEMPRE, lidas da frase (o texto delas fica na ficha): revidar quem fere, com teste ou com golpe, e a CA a
    // mais contra um ataque
    const lida = reacaoLida(r, nomesDasAcoes, ptR?.nome ?? en);
    if (lida) {
      const { traco, features, ...resto } = lida;
      if (traco) tracos.push(traco);
      if (features) extra.features = [...new Set([...(extra.features ?? []), ...features])];
      Object.assign(extra, resto);
      if (!traco) textoSo(en, ptR);
      continue;
    }
    if (SABOR.has(en)) { textoSo(en, ptR); continue; }
    semMotor(en, ptR, 'reacao');
  }
  const nomesLendarios = Object.fromEntries((pt.lendarias ?? []).map((a) => [a.en, a.nome]));
  const lend = m.legendary?.length ? acoesLendarias(m, nomesDasAcoes, nomesLendarios, magiasEn) : null;
  if (lend?.faltam.length) pend.push({ criatura: id, lendarias: lend.faltam });
  if (lend?.opcoes.length) tracos.push('acoesLendarias');
  const pendMagias = new Set();
  const sc = conjuracao(m, magiasEn, pendMagias);
  if (acaoDoMultiataque) multi = multiataque(acaoDoMultiataque, nomesDasAcoes, ataques);
  if (pendMagias.size) pend.push({ criatura: id, magias: [...pendMagias] });
  if (!ataques.length && !breath && !sc && !especiais?.length && (m.action ?? []).length) pend.push({ criatura: id, semGolpe: true });
  const lendaria = (m.trait ?? []).find((t) => /^Legendary Resistance/.test(semTags(t.name)));
  const vezes = lendaria ? Number(semTags(lendaria.name).match(/(\d)\/Day/)?.[1] ?? 3) : 0;
  const def = {
    id, tipo: TIPO[tipoEn] ?? tipoEn, name: pt.nome, nomeOriginal: m.name, fonte: m.source,
    size: TAMANHO[(m.size ?? ['M'])[0]], level: (pb - 2) * 4 + 1, cr, xp: XP[cr] ?? 0,
    abilities: abil, ac: (typeof m.ac?.[0] === 'object' ? m.ac[0].ac : m.ac?.[0]) ?? 10,
    ...(pt.acNote ? { acNote: pt.acNote } : {}),
    maxHp: m.hp?.average ?? 1, hpDice: (m.hp?.formula ?? '').replace(/\s+/g, ''),
    ...deslocamento(m.speed ?? {}),
    senses: sentidos(m),
    saves: Object.keys(m.save ?? {}),
    skills, expertise,
    ...(res.tipos.length ? { damageResistances: res.tipos } : {}), ...(res.nota ? { damageResistancesNote: res.nota } : {}),
    ...(imu.tipos.length ? { damageImmunities: imu.tipos } : {}), ...(imu.nota ? { damageImmunitiesNote: imu.nota } : {}),
    ...(vul.tipos.length ? { damageVulnerabilities: vul.tipos } : {}),
    conditionImmunities: (m.conditionImmune ?? []).map((c) => CONDICAO[typeof c === 'string' ? c : c.conditionImmune?.[0]]).filter(Boolean),
    attacks: ataques,
    ...(multi ? { multiattack: multi } : {}),
    ...(breath ? { breath } : {}),
    ...(sc ? { spellcasting: sc } : {}),
    ...(vezes ? { recursos: { resistenciaLendaria: vezes } } : {}),
    ...(presenca ? { presencaAterradora: presenca } : {}),
    ...(sopros ? { sopros } : {}),
    ...(especiais ? { acoesEspeciais: especiais } : {}),
    ...extra,
    ...(lend?.opcoes.length ? { lendarias: { acoes: lend.acoes, opcoes: lend.opcoes } } : {}),
    traits: [...new Set(tracos)],
    blurb: pt.blurb ?? '',
    lore: pt.lore ?? '',
  };
  for (const g of def.attacks) delete g.nomeEn;
  if (!def.attacks.length) delete def.attacks;
  return { def, textoDosTracos };
}

/**
 * AS REAÇÕES QUE SE REPETEM ENTRE OS BESTIÁRIOS, pela frase:
 *   - a Esquiva Sobrenatural (o ladrão mestre) -> a `uncannyDodge` do herói;
 *   - a CA a mais contra um ataque ("a +5 bonus to its AC against that attack": o Escudo Mágico, a Armadura de Gelo) ->
 *     `aparar` com `apararBonus`, contra qualquer ataque (`apararTudo`);
 *   - o REVIDE COM TESTE (a Repreensão Gélida, a Ferida Nociva, o Trovão): quem o fere faz o teste, ou todos a até X dele
 *     (`repreensao`, a mesma da ocular): dano, metade se passar, condição, empurrão;
 *   - o REVIDE COM GOLPE ("makes one bite attack against that creature", "with advantage", "against a random creature
 *     within its reach") -> `revide`.
 */
export function reacaoLida(r, nomesDasAcoes, nome) {
  const bruto = texto(r.entries);
  const t = semTags(bruto);
  if (/halves the damage that it takes from an attack that hits it/.test(t)) return { features: ['uncannyDodge'], traco: 'esquivaSobrenatural' };
  const ca = t.match(/\+(\d+) bonus to (?:its )?AC against (?:that|the) attack/);
  if (ca && !/gives that creature|another creature/.test(t)) return { traco: 'aparar', apararBonus: Number(ca[1]), apararTudo: true };
  const quando = /(?:takes damage|is damaged|being damaged|taking damage|hits (?:it|him|her) with|being hit by|hit by a melee)/.test(t);
  if (!quando) return null;
  const dc = t.match(/DC (\d+) (\w+) saving throw/);
  if (dc) {
    const d = bruto.match(/\(\{@damage ([^}]+)\}\) (\w+) damage/);
    const cond = /poisoned condition until the end of its next turn|poisoned until the end/.test(t) ? 'envenenado' : null;
    const raio = t.match(/(?:Each|All other) creatures? (?:within|in that area|in a) ?(\d+)?[- ]?(?:feet|foot)?/);
    const raioFt = Number(t.match(/(?:Each|All other) creatures? within (\d+) feet/)?.[1] ?? t.match(/(\d+)-foot-radius sphere/)?.[1] ?? 0) || null;
    if (!d && !cond) return null;
    return {
      repreensao: {
        nome, alcanceFt: Number(t.match(/within (\d+) feet of (?:it|itself|the)/)?.[1] ?? 60), save: ATRIBUTO[dc[2].toLowerCase()], dc: Number(dc[1]),
        ...(d ? { damage: d[1].replace(/\s+/g, ''), damageType: DANO[d[2]] ?? d[2], metade: /half as much/.test(t) } : {}),
        ...(cond ? { condition: cond } : {}),
        ...(raio && raioFt ? { raioFt } : {}),
        ...(/pushed (?:horizontally )?(\d+) feet/.test(t) ? { empurraFt: Number(t.match(/pushed (?:horizontally )?(\d+) feet/)[1]) } : {}),
      },
    };
  }
  const golpeR = t.match(/makes? (?:one|a) ([A-Za-z ]+?) attack/) ?? t.match(/can make (?:one|a) ([A-Za-z ]+?) attack/);
  if (golpeR) {
    const alvo = golpeR[1].toLowerCase().replace(/^melee (?:weapon )?/, '').trim();
    const igual = (a, b) => a.toLowerCase().replace(/s$/, '') === b.toLowerCase().replace(/s$/, '');
    const arma = Object.entries(nomesDasAcoes).find(([e]) => igual(e, alvo))?.[1]
      ?? Object.entries(nomesDasAcoes).find(([e]) => !/multiattack/i.test(e) && (e.toLowerCase().includes(alvo) || (alvo && alvo.includes(e.toLowerCase()))))?.[1]
      ?? (/^(?:weapon|)$/.test(alvo) || /melee/.test(golpeR[1]) ? Object.entries(nomesDasAcoes).find(([e]) => !/multiattack/i.test(e))?.[1] : null);
    if (!arma) return null;
    return { revide: { nome, arma, ...(/with advantage/.test(t) ? { vantagem: true } : {}), ...(/random creature/.test(t) ? { aoAcaso: true } : {}) } };
  }
  return null;
}

// ------------------------------------------------------------------------------------------------ principal ----
// só quando rodado pela linha de comando: o teste importa as funções acima sem escrever nada
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const livro = lerJson(DADO, null);
  if (!livro) { console.error(`sem o dado do livro em ${DADO}`); process.exit(1); }
  const traducao = lerJson(PT, {});
  // os nomes que valem por cima do lote (a mesma família com o mesmo padrão)
  const nomes = lerJson(`${RAIZ}src/dev/bestiario/${LIVRO}-nomes.json`, {});
  for (const [en, nome] of Object.entries(nomes)) if (traducao[en] && !en.startsWith('_')) traducao[en] = { ...traducao[en], nome };
  const jaTemos = lerJson(JA, {});
  const magiasEn = lerJson(MAGIAS_EN, {});
  const todos = livro.monster.filter((m) => !m._copy);
  // O QUE JÁ É BLOCO FEITO À MÃO (os capítulos do Obelisco fizeram vários de outros livros): o `nomeOriginal` dele casa com o
  // nome no livro. O MM fica fora desta regra: o `ja-temos.json` dele foi casado à mão, e o capítulo 7 cita blocos dele.
  const aMao = LIVRO === 'mm' ? new Set() : new Set(fs.readdirSync(`${RAIZ}src/rules/monsters`).filter((f) => f.endsWith('.js') && !f.startsWith('livro-'))
    .flatMap((f) => [...fs.readFileSync(`${RAIZ}src/rules/monsters/${f}`, 'utf8').matchAll(/nomeOriginal: ['"]([^'"]+)['"]/g)].map((m) => m[1])));
  const pulados = todos.filter((m) => aMao.has(m.name)).map((m) => m.name);
  if (pulados.length) console.log(`já feitos à mão, ficam de fora: ${pulados.join(', ')}`);
  const novos = todos.filter((m) => !jaTemos[m.name] && !aMao.has(m.name));
  const comTexto = novos.filter((m) => traducao[m.name]);
  console.log(`${LIVRO.toUpperCase()}: ${todos.length} no livro, ${todos.length - novos.length} que o jogo já tem, ${novos.length} novos, ${comTexto.length} com o texto em pt-br`);
  if (SO_PLANO) process.exit(0);

  // os ids que os blocos FEITOS À MÃO já usam: um nome traduzido igual (o "Lívido" do SRD da Casa da Morte é o wight; o
  // do livro, o ghast) ganha o livro no fim do id, em vez de sumir debaixo do outro
  const usados = new Set(fs.readdirSync(`${RAIZ}src/rules/monsters`).filter((f) => f.endsWith('.js') && !f.startsWith('livro-'))
    .flatMap((f) => [...fs.readFileSync(`${RAIZ}src/rules/monsters/${f}`, 'utf8').matchAll(/^  (\w+): \{$/gm)].map((m) => m[1])));
  // ... e os dos OUTROS livros importados: o mesmo nome em pt-br em dois livros (o "Diabrete" do MM e uma variante do
  // Mordenkainen) faria o segundo apagar o primeiro no `MONSTERS`. O livro que entra depois ganha o sufixo.
  for (const f of fs.readdirSync(`${RAIZ}src/rules/monsters`).filter((x) => /^livro-.*\.js$/.test(x) && x !== `livro-${LIVRO}.js`)) {
    const fonte = fs.readFileSync(`${RAIZ}src/rules/monsters/${f}`, 'utf8');
    const corpo = fonte.slice(fonte.indexOf('export const LIVRO_'), fonte.indexOf('export const TRACOS_'));
    for (const m of corpo.matchAll(/^ "(\w+)": \{$/gm)) usados.add(m[1]);
  }
  const pendentes = [];
  const blocos = {}; const tracosTexto = {};
  for (const m of comTexto) {
    const { def, textoDosTracos } = bloco(m, traducao[m.name], magiasEn, pendentes);
    if (blocos[def.id] || usados.has(def.id)) def.id = `${def.id}${m.source[0]}${m.source.slice(1).toLowerCase()}`;
    blocos[def.id] = def;
    Object.assign(tracosTexto, textoDosTracos);
  }
  const cabecalho = `// GERADO por \`src/dev/importar-bestiario.mjs ${LIVRO}\` — não edite à mão; mude o conversor ou o texto em
  // \`src/dev/bestiario/${LIVRO}-pt.json\` e rode de novo. Os números são os do livro (${LIVRO.toUpperCase()}, via o espelho do 5etools);
  // o texto é nosso, em pt-br. O que o motor ainda não faz está em \`src/dev/bestiario/${LIVRO}-pendente.json\`.
  `;
  fs.writeFileSync(SAIDA, `${cabecalho}\nexport const LIVRO_${LIVRO.toUpperCase()} = ${JSON.stringify(blocos, null, 1)};\n\nexport const TRACOS_${LIVRO.toUpperCase()} = ${JSON.stringify(tracosTexto, null, 1)};\n`);
  fs.writeFileSync(PENDENTE, `${JSON.stringify(pendentes, null, 1)}\n`);
  // AS FICHAS (o token redondo do 5etools): a lista que `baixar-fichas.py` baixa, e o módulo que o jogo lê — só com as
  // fichas que já estão em `public/fichas` (sem a imagem, a criatura fica com o retrato em pixel).
  // o espelho grava o arquivo sem acento e com o "æ" aberto (o Rothé é `Rothe.webp`, o Mörgæn é `Morgaen.webp`)
  const arquivoDoToken = (nome) => nome.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/æ/g, 'ae').replace(/Æ/g, 'Ae');
  const fichas = Object.fromEntries(Object.values(blocos).map((d) => [d.id, [d.fonte, `${arquivoDoToken(d.nomeOriginal)}.webp`]]));
  // a ficha de um id que SAIU da lista (o nome mudou) fica órfã: some, se nenhuma outra lista do jogo usa aquele id
  const antes = Object.keys(lerJson(`${RAIZ}src/dev/bestiario/fichas-${LIVRO}.json`, {}));
  const outras = new Set(['fichas-imgur.json', 'fichas-5etools.json', 'fichas-proprias.json']
    .flatMap((f) => Object.keys(lerJson(`${RAIZ}src/dev/${f}`, {}))));
  for (const id of antes) {
    if (fichas[id] || outras.has(id)) continue;
    fs.rmSync(`${RAIZ}public/fichas/${id}.webp`, { force: true });
    fs.rmSync(`${RAIZ}_referencias/fichas-5etools/${id}.webp`, { force: true });
  }
  fs.writeFileSync(`${RAIZ}src/dev/bestiario/fichas-${LIVRO}.json`, `${JSON.stringify(fichas, null, 1)}\n`);
  const todasAsFichas = fs.readdirSync(`${RAIZ}src/dev/bestiario`).filter((f) => /^fichas-.*\.json$/.test(f))
    .flatMap((f) => Object.keys(lerJson(`${RAIZ}src/dev/bestiario/${f}`, {})))
    .filter((id) => fs.existsSync(`${RAIZ}public/fichas/${id}.webp`)).sort();
  fs.writeFileSync(`${RAIZ}src/art/fichas-dos-livros.js`, `// GERADO por \`src/dev/importar-bestiario.mjs\`: as criaturas dos bestiários importados que já têm a ficha em public/fichas.\nexport const FICHAS_DOS_LIVROS = ${JSON.stringify(todasAsFichas)};\n`);
  console.log(`fichas: ${Object.keys(fichas).length} na lista para baixar, ${todasAsFichas.length} já em public/fichas`);
  const cont = (k) => pendentes.filter((p) => p[k]).length;
  console.log(`escreveu ${Object.keys(blocos).length} blocos em ${SAIDA.replace(RAIZ, '')}`);
  console.log(`pendente no motor: ${cont('traco')} traços, ${cont('acao')} ações, ${cont('reacao')} reações, ${cont('lendarias')} criaturas com ações lendárias, ${cont('magias')} com magia que ainda não temos, ${cont('semGolpe')} sem golpe nenhum`);
}
