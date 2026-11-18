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
  // a terceira fila: o mesmo traço com outro nome
  'Turning Defiance': 'resisteExpulsar', 'Fallible Invisibility': 'sempreInvisivel',
};
// Só SABOR numa luta de tabuleiro: o texto fica no bloco (o jogador lê), mas não é trabalho de motor.
/**
 * OS NOMES DAS AÇÕES BÔNUS dos livros de 2022 (Fizban, Bigby), que guardam a ação bônus numa lista à parte (`bonus`) e
 * que a tradução não leu: os nomes vão à mão, com as nossas palavras.
 */
const NOMES_DA_ACAO_BONUS = {
  'Change Shape': 'Mudar de Forma', 'Psychic Step': 'Passo Psíquico', 'Lightning Burst': 'Explosão de Relâmpago', 'Rapid Movement': 'Movimento Rápido',
  'Crystal Dart': 'Dardo de Cristal', 'Scale Dust': 'Pó de Escamas', 'Lava Geyser': 'Gêiser de Lava', 'Chilling Mist': 'Névoa Gélida',
  'Crystal Flare': 'Clarão de Cristal', 'Stone Spikes': 'Espinhos de Pedra', 'Frightening Teleport': 'Teleporte Aterrador', 'Shroud of Souls': 'Mortalha de Almas',
  'Discordant Screams': 'Gritos Dissonantes', 'Hidden Step': 'Passo Oculto', 'Duplicitous Movement': 'Movimento Dúplice', 'Furnace Armor': 'Armadura de Fornalha',
  Bite: 'Mordida', 'Beguiling Presence': 'Presença Sedutora', 'Creeping Gloom': 'Treva Rastejante', 'Reel In': 'Recolher o Arpão', Charge: 'Investida',
  'Baleful Hex': 'Maldição Funesta', Teleport: 'Teletransporte', Drone: 'Zumbido', "Giant's Strikes": 'Golpes de Gigante', 'Fade Back': 'Reaparecer',
  'Grinning Step': 'Passo Sorridente', Swallow: 'Engolir', 'Earth-Shaking Movement': 'Movimento Sísmico', 'Fog of Deception': 'Névoa do Engano',
  'Vengeful Storm': 'Tempestade Vingativa', 'Incendiary Smoke': 'Fumaça Incendiária', Hailstorm: 'Tempestade de Granizo', 'Fling Limb': 'Arremessar Membro',
};
// as invenções do kobold inventor que entram no jogo, com os nomes à mão
const INVENCOES_DO_KOBOLD = { Acid: 'Frasco de Ácido', "Alchemist's fire": 'Fogo de Alquimista', 'Basket of Centipedes': 'Cesto de Centopeias',
  'Rot Grub Pot': 'Pote de Larvas', 'Scorpion on a Stick': 'Escorpião no Bastão', 'Wasp Nest in a Bag': 'Ninho de Vespas' };
// os golpes da Anatomia Pisciana (a cria do mar), que a tradução leu como um texto só
const NOMES_DA_ANATOMIA = { Bite: 'Mordida', 'Poison Quills': 'Espinhos Venenosos', Tentacle: 'Tentáculo' };
// as opções de uma ação bônus que o dado lista como ações à parte (as gemas do Dardo de Cristal, as três da Tempestade Vingativa)
/**
 * A DÉCIMA QUARTA LEVA: as ações bônus da lista do Fizban e do Bigby que pedem forma própria. Devolve a ação especial, ou null.
 */
function acaoBonusDoLivro(b, nomePt, nomesDasAcoes) {
  const bruto = (b.entries ?? []).filter((e) => typeof e === 'string').join(' ');
  const t = semTags(bruto);
  const comum = { nome: nomePt, ...(/\{@recharge/.test(b.name) ? { recharge: rechargeDe(b.name) } : {}), ...(/(\d)\/Day/.test(b.name) ? { porDia: Number(b.name.match(/(\d)\/Day/)[1]) } : {}) };
  // A VIGÉSIMA SEXTA LEVA: a TEMPESTADE VINGATIVA do rebento de Stronmaus: a nuvem a até 36 m, e a cada ação bônus um dos três
  // efeitos debaixo dela (a chuva ácida, o temporal gelado, os relâmpagos), nunca o mesmo duas vezes seguidas
  const temporal = t.match(/conjures a churning storm cloud in a (\d+)-foot-radius, \d+-foot-tall cylinder centered on a point within (\d+) feet of itself/);
  if (temporal) return { ...comum, tipo: 'tempestadeVingativa', raioFt: Number(temporal[1]), alcanceFt: Number(temporal[2]), dc: 25 };
  // A VIGÉSIMA SEGUNDA LEVA
  // o MOVIMENTO DÚPLICE do firbolg andarilho: a ilusão a até 9 m, e ele troca de lugar com ela (aqui, o passo de teleporte)
  const duplo = t.match(/projects an illusory duplicate of itself in an unoccupied space it can see within (\d+) feet of itself\. The [\w ]+ can then swap places with the illusion/);
  if (duplo) return { ...comum, tipo: 'teleporte', alcanceFt: Number(duplo[1]) };
  // os ESPINHOS DE PEDRA do berço do rebento de pedra: um quadrado de 6 m a até 27 m vira espinho até o começo do próximo turno
  // dele (terreno difícil, e 3d6 perfurante a cada 1,5 m andado)
  const espinhos = t.match(/causes the ground in a (\d+)-foot square within (\d+) feet of itself to sprout crystal spikes until the start of its next turn\. The area becomes difficult terrain for the duration\. A creature takes \d+ \((\d+d\d+)\) (\w+) damage for each 5 feet it moves/);
  if (espinhos) return { ...comum, tipo: 'espinhosDoChao', ladoFt: Number(espinhos[1]), alcanceFt: Number(espinhos[2]), dano: espinhos[3], tipoDano: DANO[espinhos[4]] ?? espinhos[4] };
  // CORRER OU DESENGAJAR (o filhote caçador de ovos) e a INVESTIDA da fúria de Kostchtchie: o deslocamento dele outra vez
  if (/takes the Dash or Disengage action/.test(t)) return { ...comum, tipo: 'disparada', doDeslocamento: true };
  if (/can move up to its speed toward an enemy it can see/.test(t)) return { ...comum, tipo: 'disparada', doDeslocamento: true, provoca: true };
  // o MOVIMENTO SÍSMICO dos rebentos: anda e solta o tremor que quebra a concentração de quem está no chão
  const sismo = t.match(/moves up to its speed and (?:then )?sends a shock wave through the ground in a (\d+)-foot[- ]radius circle centered on itself\. Each creature on the ground in that area that is concentrating must succeed on a DC (\d+) Constitution saving throw/);
  if (sismo) return { ...comum, tipo: 'tremor', raioFt: Number(sismo[1]), dc: Number(sismo[2]), anda: true };
  // os GOLPES DE GIGANTE do golias: até o fim do turno, o golpe de perto soma 2d6 (o tipo é o da comunidade: aqui, a de pedra)
  const gigante = bruto.match(/Until the end of its turn, the [\w ]+'s melee attacks each deal an extra \d+ \(\{@damage ([^}]+)\}\) damage of a type/);
  if (gigante) return { ...comum, tipo: 'postura', condicao: 'golpesDeGigante', ateFimDoTurno: true, data: { dadosNoAcerto: gigante[1].replace(/\s+/g, ''), tipo: 'energético' } };
  // A DÉCIMA QUINTA LEVA: as auras que a ação bônus liga por um minuto
  // a MORTALHA DE ALMAS do gigante da morte amortalhado: quem começa o turno a 1,5 m faz o teste ou fica com desvantagem nas resistências
  const mortalha = t.match(/each creature that starts its turn within (\d+) feet of the [\w ]+ must succeed on a DC (\d+) (\w+) saving throw or have disadvantage on saving throws until the end of that creature's next turn/);
  if (mortalha) return { ...comum, tipo: 'postura', condicao: 'mortalhaDeAlmas', rounds: 10, data: { auraNoInicio: { raioFt: Number(mortalha[1]), dc: Number(mortalha[2]), save: ATRIBUTO[mortalha[3].toLowerCase()], condition: 'almasNaMortalha' } } };
  // a FUMAÇA INCENDIÁRIA do rebento de Surtur: desvantagem para quem atira nele, e quem começa o turno na fumaça faz o teste ou queima
  const fumaca = t.match(/filling a (\d+)-foot-radius sphere centered on itself that moves with it\. While the [\w ]+'s skin billows smoke, ranged attacks against the [\w ]+ are made with disadvantage\. A creature that moves into the smoke for the first time on a turn or starts its turn there must succeed on a DC (\d+) (\w+) saving throw or take \d+ \((\d+d\d+)\) (\w+) damage/);
  if (fumaca) return { ...comum, tipo: 'postura', condicao: 'fumacaIncendiaria', rounds: 10, data: { auraNoInicio: { raioFt: Number(fumaca[1]), dc: Number(fumaca[2]), save: ATRIBUTO[fumaca[3].toLowerCase()], dano: fumaca[4], tipo: DANO[fumaca[5]] ?? fumaca[5] } } };
  // a ARMADURA DE FORNALHA: meia cobertura por um minuto
  if (/While the armor is billowing smoke, the giant has half cover/.test(t)) return { ...comum, tipo: 'postura', condicao: 'armaduraDeFornalha', rounds: 10 };
  // RECOLHER O ARPÃO: o preso vem até 6 m para perto
  const recolhe = t.match(/pulls the target grappled by its \w+ up to (\d+) feet toward itself/);
  if (recolhe) return { ...comum, tipo: 'puxarAgarrados', pes: Number(recolhe[1]) };
  // os GRITOS DISSONANTES do eco de Demogorgon: o Tormento Psíquico (o outro efeito, o golpe forçado, fica de fora)
  const gritos = JSON.stringify(b.entries ?? []).match(/at one creature it can see within (\d+) feet of itself\. The target must succeed on a \{@dc (\d+)\} (\w+) saving throw or suffer one of the following[^]*Psychic Torment[^]*?takes \d+ \(\{@damage ([^}]+)\}\) psychic damage/);
  if (gritos) return { ...comum, tipo: 'alvo', alcanceFt: Number(gritos[1]), save: ATRIBUTO[gritos[3].toLowerCase()], dc: Number(gritos[2]), damage: gritos[4].replace(/\s+/g, ''), damageType: 'psíquico', halfOnSave: false };
  // ENGOLIR com a ação bônus (o regissauro, o colosso de carne): o golpe é o da própria ação, em quem ele agarra
  if (/\{@atk mw\}[^]*grappled\}? by the [\w ]+\.[^]*swallow/.test(bruto)) {
    const g = golpe(b, nomePt);
    const tam = t.match(/one (\w+) or smaller creature grappled/);
    const porTurno = bruto.match(/takes \d+ \(\{@damage ([^}]+)\}\) (\w+) damage at the start/);
    if (!g || !tam) return null;
    const soEngole = /\{@h\}The [\w ]+ swallows/.test(bruto);
    return { ...comum, tipo: 'engolir', tamanhoMax: tam[1].toLowerCase(), golpe: { ...g, ...(soEngole ? { damage: 0 } : {}), nomeEn: limpaNome(b.name) },
      ...(porTurno ? { dano: porTurno[1].replace(/\s+/g, ''), tipoDano: DANO[porTurno[2]] ?? porTurno[2] } : {}),
      max: /up to two creatures/.test(t) || /hold up to two creatures/.test(t) ? 2 : 1 };
  }
  return null;
}

const SUBOPCOES_BONUS = new Set(['Amethyst', 'Crystal', 'Emerald', 'Sapphire', 'Topaz', 'Acid Rain', 'Freezing Storm', 'Lightning Bolts']);

const SABOR = new Set([
  // o ELO PSÍQUICO e o SENTIR PENSAMENTOS do cérebro ancião: o elo não muda nada no tabuleiro (as lendárias miram quem ele vê) e
  // o sentir é conversa (a Enganação contra a Intuição), fora da luta
  'Psychic Link', 'Sense Thoughts',
  // a CONJURAÇÃO MENOR do Jim Darkmagic: um objeto de três pés que brilha, fora da luta
  'Minor Conjuration',
  // o JUSTIFICAR do marut leva o alvo e o próprio marut a Sigil, uma vez por descanso: a luta sai do tabuleiro
  'Justify',
  // fora da luta, ou sem o que pedem no tabuleiro: a RECONSTRUÇÃO do dragão oco (dias depois de cair), a ANIMAÇÃO SAGRADA do
  // eidolon (precisa da estátua sagrada no mapa) e o HABITAR UM OBJETO do fragmento dracônico (um objeto sem dono à mão)
  'Reconstruction', 'Sacred Animation', 'Inhabit Object',
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
  // {@quickref nome|fonte|capítulo|entrada|texto}: o texto mostrado é o quinto campo, quando há; senão, o nome. A conta
  // antiga (o último campo não vazio) devolvia "3" em "{@quickref difficult terrain||3}" (2026-11-16, o wastrilith)
  if (tag === 'quickref') return partes[4] || partes[0];
  // {@status concentration||concentrating}, {@creature sword wraith warrior|mtf|sword wraith warriors}: o terceiro campo é o
  // texto mostrado, quando há (2026-11-16: o Movimento Sísmico dos rebentos dizia "that is concentration" e não casava)
  return partes[2] || partes[0];
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
  // as LARVAS PUTREFATAS: o acerto não fere, infesta (1d4 larvas, 1d6 perfurante por larva no começo de cada turno do alvo)
  {
    const b = (acao.entries ?? []).filter((e) => typeof e === 'string').join(' ');
    const inf = b.match(/\{@atk mw\} \{@hit (-?\d+)\} to hit, reach (\d+) ft\.[^]*?\{@h\}The target is infested by \{@dice ([^}]+)\} rot grubs\. At the start of each of the target's turns, the target takes \{@damage ([^}]+)\} piercing damage per rot grub/);
    if (inf) return { name: nomePt, bonus: Number(inf[1]), reachFt: Math.max(5, Number(inf[2])), damage: 0, type: 'perfurante', infesta: { larvas: inf[3], porLarva: inf[4] } };
  }
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
  // o golpe que SÓ AGARRA (a perna pegajosa do steeder): sem dano, o acerto agarra
  const soAgarra = !danos.length && !fixo && !soPrende && /grappled[^.]*\(escape \{@dc \d+\}\)/.test(t);
  if (!danos.length && !fixo && !soPrende && !soAmaldicoa && !soAgarra) return null;
  const g = {
    name: nomePt, bonus,
    damage: fixo ? Number(fixo[1]) : soPrende || soAmaldicoa || soAgarra ? 0 : danos[0][1].replace(/\s+/g, ''),
    type: fixo ? DANO[fixo[2]] ?? fixo[2] : soPrende || soAmaldicoa || soAgarra ? 'nenhum' : DANO[danos[0][2]] ?? danos[0][2],
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
  const agarra = t.match(/grappled\}?[^.(]*\(escape \{@dc (\d+)\}\)/);
  if (agarra) {
    g.onHit = { semResistencia: true, dc: Number(agarra[1]), escape: Number(agarra[1]), condition: /restrained/.test(t) ? 'contido' : 'agarrado', note: 'é agarrado',
      ...(/can have only one creature[^.]*at a time/.test(t) ? { maxAgarrados: 1 } : {}) };
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
  // o que GRUDA e drena no começo de cada turno dele (o Miserável), como o stirge: o dado e o tipo do livro. O manto escuro
  // também "se prende", mas na cabeça, e não drena: fica de fora. O carrapato drena pela ação (`grude`, na lista de ações).
  const drenoG = t.match(/attaches to the target\. While attached, the [\w ]+ can't attack, and at the start of each of the [\w ]+'s turns, the target takes \d+ \(\{@damage ([^}]+)\}\) (\w+) damage/);
  if (drenoG) { g.gruda = true; g.grude = { dano: drenoG[1].replace(/\s+/g, ''), tipo: DANO[drenoG[2]] ?? drenoG[2], semLimite: true }; }
  // o golpe que ACERTA SEMPRE (a Pancada Infalível do marut): "{@atk mw} automatic hit"
  if (/\{@atk [mr]w\} automatic hit/.test(t)) g.acertaSempre = true;
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
  // "takes 33 (6d10) damage of a type chosen by the dracohydra: acid, cold, fire, lightning, or poison" (o Sopro Prismático)
  const escolhe = !dano && t.match(/takes \d+ \(([\dd+ ]+)\) damage of a type chosen by the [\w ]+: ([a-z, ]+?)\. On a successful/);
  if (!forma || !dc || (!dano && !escolhe)) return null;
  if (escolhe) {
    const tipos = escolhe[2].replace(/\bor\b/g, '').split(/[, ]+/).filter(Boolean).map((x) => DANO[x] ?? x);
    const shape = { cone: 'cone', line: 'linha', cube: 'cube', radius: 'sphere', sphere: 'sphere' }[forma[2]];
    return { name: nomePt, kind: 'save', shape, areaFt: Number(forma[1]), save: ATRIBUTO[dc[2].toLowerCase()], dc: Number(dc[1]),
      damage: escolhe[1].replace(/\s+/g, ''), damageType: tipos[0], tiposAEscolher: tipos, halfOnSave: /half as much/.test(t), origem: 'sopro',
      ...(/\{@recharge/.test(acao.name) ? { recharge: rechargeDe(acao.name) } : {}) };
  }
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
/**
 * A MAGIA QUE NÃO CABE NUM TURNO (a vigésima quinta leva): o tempo de conjuração vem do dado de magias do 5etools
 * (`_referencias/5etools/spells/`). A de 1 minuto ou mais fica fora do jogo (a regra das magias dos livros), e o monstro que a
 * conhece não a conjuraria numa luta: ela não entra na fila do bestiário. Sem o dado, vale a conta antiga (toda magia que falta
 * vai para a fila).
 */
let TEMPOS_DE_MAGIA = null;
function conjuracaoLonga(nome) {
  if (!TEMPOS_DE_MAGIA) {
    TEMPOS_DE_MAGIA = new Map();
    const pasta = `${RAIZ}_referencias/5etools/spells/`;
    if (fs.existsSync(pasta)) {
      for (const f of fs.readdirSync(pasta).filter((x) => /^spells-.*\.json$/.test(x))) {
        for (const sp of JSON.parse(fs.readFileSync(pasta + f, 'utf8')).spell ?? []) TEMPOS_DE_MAGIA.set(sp.name.toLowerCase(), sp.time?.[0]?.unit ?? null);
      }
    }
  }
  return ['minute', 'hour', 'day'].includes(TEMPOS_DE_MAGIA.get(nome));
}
/**
 * AS MAGIAS QUE O JOGO DEIXA FORA DE PROPÓSITO: as que a fila das magias marca como "só se narraria" (moldar a rocha, mover a
 * terra, a água, as ilusões que o tabuleiro não mostra, e as de conversa do Acquisitions Inc.: os Amigos Rápidos, o Dom da
 * Palavra), que não fazem nada numa luta. O monstro que as conhece não deve nada ao motor.
 */
let NARRADAS = null;
function soSeNarraria(nome) {
  if (!NARRADAS) {
    NARRADAS = new Set();
    for (const l of ['phb', 'xge', 'tce', 'ai']) {
      const f = `${RAIZ}src/dev/magias/${l}-pendente.json`;
      if (!fs.existsSync(f)) continue;
      for (const p of JSON.parse(fs.readFileSync(f, 'utf8'))) if (/^só se narraria/.test(p.motivo ?? '')) NARRADAS.add(String(p.en).toLowerCase());
    }
  }
  return NARRADAS.has(nome);
}
// a magia do livro que é a de outro com outro nome: vazio desde que o Míssil Mágico do Jim entrou como magia própria
// (2026-11-16, `magias/ajustes-ai.mjs`); o de-para do livro vem primeiro, e isto só vale para a que não tem
const MAGIA_DE_OUTRO_NOME = {};
export const MAGIAS_LONGAS_DOS_MONSTROS = new Set();

export function conjuracao(m, magiasEn, pendentes) {
  const sc = (m.spellcasting ?? [])[0];
  if (!sc) return null;
  const t = semTags(texto(sc.headerEntries));
  const ability = ATRIBUTO[(sc.ability ?? t.match(/spellcasting ability is (\w+)/)?.[1] ?? 'intelligence').toLowerCase()] ?? sc.ability ?? 'int';
  const dc = Number(t.match(/DC (\d+)/)?.[1] ?? 0);
  const ids = (lista) => (lista ?? []).map((s) => semTags(s).replace(/\*/g, '').replace(/\s*\(.*\)\s*$/, '').trim().toLowerCase()).map((n) => {
    const id = magiasEn[n] ?? magiasEn[MAGIA_DE_OUTRO_NOME[n]];
    if (!id && (conjuracaoLonga(n) || soSeNarraria(n))) MAGIAS_LONGAS_DOS_MONSTROS.add(n);
    else if (!id) pendentes.add(n);
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
 * A TERCEIRA FILA DOS BESTIÁRIOS (2026-11-12): os traços que o motor ganhou em `livro-motor.js`, lidos da frase. O que
 * eles dão vai em `motorDoLivro` (um campo só no bloco), menos o que já tinha campo próprio (`corpoQuente`, a vantagem
 * contra condições em `vantagemRacial`). O nome em pt-br do traço sai depois, pelo `nome` (o da tradução, em `bloco`).
 */
const NOME_PT_PENDENTE = '__nome__';
function tracoDaTerceiraFila(en, t, bruto) {
  const ml = (k, v) => ({ motorDoLivro: { [k]: { nome: NOME_PT_PENDENTE, ...v } }, traco: null });
  // o dano do PRIMEIRO ACERTO no turno (as presas dos yuan-ti) e o Golpe Divino do Omin (o tipo da arma)
  const presas = bruto.match(/first time the [\w-]+ hits with a melee attack on its turn, it can deal an extra \d+ \(\{@damage ([^}]+)\}\) (\w+) damage/);
  if (presas) return ml('primeiroAcerto', { dados: presas[1].replace(/\s+/g, ''), tipo: DANO[presas[2]] ?? presas[2], soCorpoACorpo: true });
  const divino = bruto.match(/Once on each of (?:its|his|her) turns when (?:it|he|she) hits a creature with a weapon attack, [\w ]+ can cause the attack to deal an extra \d+ \(\{@damage ([^}]+)\}\) damage of the same type/);
  if (divino) return ml('primeiroAcerto', { dados: divino[1].replace(/\s+/g, ''), tipo: null });
  // os PV temporários de quem DERRUBA (a Bênção de Imix, a de Sseth, a Sede de Almas)
  const pvt = t.match(/reduces an enemy to 0 hit points, the [\w-]+ gains (\d+) temporary hit points/);
  if (pvt) return ml('pvTempAoDerrubar', { pv: Number(pvt[1]) });
  if (/reduces a creature to 0 hit points, the [\w ]+ can gain temporary hit points equal to half the creature's hit point maximum/.test(t)) return ml('pvTempAoDerrubar', { pv: 'metade' });
  // a DESVANTAGEM NAS RESISTÊNCIAS de quem está perto
  if (en === 'Burden of Time') return ml('desvantagemNasResistencias', { raioFt: Number(t.match(/within (\d+) feet/)?.[1] ?? 10), soTipos: ['fera', 'humanoide'], poupaNome: 'shadar-kai' });
  if (en === 'Infernal Despair') return ml('desvantagemNasResistencias', { raioFt: Number(t.match(/within (\d+) feet/)?.[1] ?? 15), poupaTipos: ['corruptor'] });
  if (en === 'Aura of Madness') return ml('desvantagemNasResistencias', { raioFt: Number(t.match(/within (\d+) feet/)?.[1] ?? 20), poupaTipos: ['aberração'] });
  // os ATAQUES CONTRA ELE com desvantagem
  if (/^Attack rolls against the [\w ]+ have disadvantage unless the [\w ]+ is incapacitated or restrained/.test(t)) return ml('desvantagemContraEle', { salvoContido: true });
  const borrada = t.match(/^Attack rolls against the [\w ]+ are made with disadvantage unless the attacker is within (\d+) feet/);
  if (borrada) return ml('desvantagemContraEle', { salvoPerto: Number(borrada[1]) });
  if (/two or more of [\w']+ allies are within 5 feet of (?:him|her|it) and are not incapacitated, attack rolls against (?:him|her|it) are made with disadvantage/.test(t)) return ml('desvantagemContraEle', { aliadosColados: 2 });
  // o SANGUE que fere quem o corta ou fura de perto (o beijo da morte, a mortalha ígnea): o corpo quente com filtro
  if (/hits (?:it|the [\w ]+) with a melee attack that deals piercing or slashing damage/.test(t)) {
    const d = danoDo(bruto);
    if (d) return { corpoQuente: { ...d, soCortaOuFura: true }, traco: null };
  }
  // o RESPINGO de quem é ferido (o troll venenoso; o troll mutante devolve o psíquico)
  const resp = bruto.match(/takes damage of any type but (\w+), each creature within (\d+) feet of the [\w ]+ takes \d+ \(\{@damage ([^}]+)\}\) (\w+) damage/);
  if (resp) return ml('aoSerFerido', { raioFt: Number(resp[2]), dano: resp[3].replace(/\s+/g, ''), tipo: DANO[resp[4]] ?? resp[4], exceto: [DANO[resp[1]] ?? resp[1]] });
  const espelha = t.match(/If the [\w ]+ takes (\w+) damage, each creature within (\d+) feet of it takes that damage as well/);
  if (espelha) return ml('aoSerFerido', { raioFt: Number(espelha[2]), dano: 'oMesmo', so: [DANO[espelha[1]] ?? espelha[1]] });
  // a DEGENERAÇÃO RANÇOSA (o troll apodrecido): no fim do turno dele, quem está colado; ácido ou fogo a seguram
  const ranco = bruto.match(/At the end of each of the [\w ]+'s turns, each creature within (\d+) feet of it takes \d+ \(\{@damage ([^}]+)\}\) (\w+) damage, unless the [\w ]+ has taken (\w+) or (\w+) damage/);
  if (ranco) return ml('fimDoDono', { raioFt: Number(ranco[1]), dano: ranco[2].replace(/\s+/g, ''), tipo: DANO[ranco[3]] ?? ranco[3], bloqueia: [DANO[ranco[4]], DANO[ranco[5]]] });
  // a AURA DA ANIQUILAÇÃO (o bodak): quem termina o turno perto; o morto-vivo e o corruptor não sentem
  const aniq = t.match(/the aura deals (\d+) (\w+) damage to any creature that ends its turn within (\d+) feet/);
  if (aniq) return ml('fimDoAlvo', { raioFt: Number(aniq[3]), dano: Number(aniq[1]), tipo: DANO[aniq[2]] ?? aniq[2], poupaTipos: ['morto-vivo', 'corruptor'] });
  // a PRESENÇA PÚTRIDA (os bulezaus), o PESO DAS ERAS (o mercador de almas), o MESTRE DA SEPULTURA (o senhor das caveiras)
  const podre = t.match(/starts its turn within (\d+) feet one or more \w+, that creature must succeed on a DC (\d+) Constitution saving throw or take (\dd\d+) necrotic damage plus 1/);
  if (podre) return ml('presencaPodre', { raioFt: Number(podre[1]), dc: Number(podre[2]), dano: podre[3] });
  if (/starts its turn within 5 feet of the [\w ]+ has its speed reduced by 20 feet/.test(t)) return ml('pesoDasEras', {});
  if (/any undead ally of the [\w ]+ makes saving throws with advantage, and that ally regains 1d6 hit points/.test(t)) return ml('mestreDaSepultura', {});
  // o CORPO ESPINHOSO (o espinhento): fere quem o agarra no começo do turno dele
  const espinho = bruto.match(/At the start of its turn, the [\w ]+ deals \d+ \(\{@damage ([^}]+)\}\) piercing damage to any creature grappling it/);
  if (espinho) return ml('feridaQuemAgarra', { dano: espinho[1].replace(/\s+/g, '') });
  // o SOBREVIVENTE (o senhor da guerra): +N no começo do turno, de pé e abaixo da metade
  const sobre = t.match(/regains (\d+) hit points at the start of its turn if it has at least 1 hit point but fewer hit points than half its hit point maximum/);
  if (sobre) return ml('sobrevivente', { pv: Number(sobre[1]) });
  // o SANGUE INFLAMÁVEL (o pescador das cavernas)
  if (/drops to half its hit points or fewer, it gains vulnerability to fire damage/.test(t)) return ml('vulneravelFerido', { tipo: 'fogo' });
  // a VANTAGEM CONTRA CONDIÇÕES (as Seis Cabeças do anátema) e contra VENENO (o orc nutrido de Yurtrus): o formato da
  // vantagem racial do herói (`passivas.js vantagemPorTraco`)
  if (/advantage on [^.]*saving throws against being blinded/.test(t)) {
    const conds = ['blinded', 'charmed', 'deafened', 'frightened', 'stunned', 'unconscious'].filter((c) => t.includes(c) || (c === 'unconscious' && /knocked unconscious/.test(t)));
    return { vantagemRacial: [{ nome: NOME_PT_PENDENTE, condicoes: conds.map((c) => CONDICAO_DO_MOTOR[c]) }], traco: null };
  }
  if (/has advantage on saving throws against poison and disease/.test(t)) return { vantagemRacial: [{ nome: NOME_PT_PENDENTE, veneno: true }], traco: null };
  // A SEGUNDA LEVA: a vantagem no ataque por condição e o motor psíquico do déspota
  if (/has advantage on attack rolls and Dexterity saving throws while standing within 5 feet of a [\w]+ ally wielding a shield/.test(t)) return ml('falange', {});
  if (/While submerged in liquid, the [\w ]+ has advantage on attack rolls/.test(t)) return ml('vantagemNaAgua', {});
  if (/has advantage on attack rolls while it is within 30 feet of at least two other creatures\. It otherwise has disadvantage/.test(t)) return ml('companhia', {});
  if (/In the first round of a combat, the [\w ]+ has advantage on attack rolls against any creature that hasn't taken a turn yet/.test(t)) return ml('matador', {});
  if (/has advantage on the attack rolls of opportunity attacks/.test(t)) return ml('oportunista', {});
  const motor = bruto.match(/suffers a critical hit or is reduced to 0 hit points, psychic energy erupts from its frame to deal \d+ \(\{@damage ([^}]+)\}\) psychic damage to each creature within (\d+) feet/);
  if (motor) return ml('motorPsiquico', { dano: motor[1].replace(/\s+/g, ''), raioFt: Number(motor[2]) });
  // a MAGIA DE GUERRA (o gish githyanki, o consorte drow)
  if (/uses its action to cast a spell, it can make one weapon attack as a bonus action/.test(t)) return ml('magiaDeGuerra', {});
  // A QUARTA LEVA (2026-11-16): a magia que poupa os aliados, o olho do arqueiro, o fogo que recarrega o sopro
  if (/casts an evocation spell that forces other creatures it can see to make a saving throw, it can choose a number of them equal to 1 \+ the spell's level/.test(t)) return ml('esculpirMagias', {});
  if (/can choose itself and any number of allies to be immune to the damage caused by the spell and to succeed on the required saving throw/.test(t)) return ml('arcanoDoExercito', {});
  if (/As a bonus action, the [\w ]+ can add 1d10 to its next attack or damage roll with a longbow or shortbow/.test(t)) return ml('olhoDoArqueiro', { usos: 3 });
  if (/When the [\w ]+ takes fire damage, its [\w ]+ automatically recharges/.test(t)) return ml('fogoRecarrega', {});
  // A QUINTA LEVA (2026-11-16): o choque e o frio que acendem estado, a colheita do necromante, o comedor de vida, a ação
  // a mais do estrangulador e as cabeças da dracohidra
  if (/If the [\w ]+ takes lightning damage, it suffers several effects until the end of its next turn/.test(t)) return ml('choqueEletrico', {});
  const frio = t.match(/takes (\d+) cold damage or more during a single turn, the [\w ]+ partially freezes/);
  if (frio) return ml('congelamentoParcial', { limiar: Number(frio[1]) });
  if (/kills a creature that is neither a construct nor undead with a spell of 1st level or higher, the [\w ]+ regains hit points equal to twice the spell's level/.test(t)) return ml('colheitaSinistra', {});
  if (/A creature reduced to 0 hit points from damage dealt by the [\w ]+ dies and can't be revived/.test(t)) return ml('comedorDeVida', {});
  if (/can take an extra action on its turn/.test(t)) return ml('rapidezAberrante', {});
  if (/For each head the [\w ]+ has beyond one, it gets an extra reaction that can be used only for opportunity attacks/.test(t)) return ml('cabecasReativas', { cabecas: 5 });
  // A SEXTA LEVA (2026-11-16): o espelho psíquico, a sorte do bruxo, a fúria de Vaprak e os banimentos
  const espelho = t.match(/If the [\w ]+ takes psychic damage, each creature within (\d+) feet of the [\w ]+ takes that damage instead; the [\w ]+ takes none of the damage/);
  if (espelho) return ml('espelhoPsiquico', { raioFt: Number(espelho[1]) });
  if (/When the [\w ]+ makes an ability check or saving throw, it can add a d10 to the roll\. It can do this after the roll is made/.test(t)) return ml('sorteDoSombrio', {});
  if (/As a bonus action, the giant can enter a rage at the start of its turn\. The rage lasts for 1 minute/.test(t)) return ml('furiaDeVaprak', {});
  if (/If the [\w ]+ starts its turn in sunlight, it is transported to the Ethereal Plane/.test(t)) return ml('banidoPeloSol', {});
  const geena = t.match(/starts its turn engulfed in flames that are at least 10 feet high or wide, it must succeed on a DC (\d+) Charisma saving throw or be instantly banished/);
  if (geena) return ml('banidoPeloFogo', { dc: Number(geena[1]) });
  // a FORÇA DESPROPORCIONAL do barrete vermelho tira duas penalidades que o motor não aplica a monstro nenhum (a arma
  // pesada na mão de quem é pequeno e o limite de tamanho do agarrão por ser Pequeno): não há o que fazer, e é dito
  if (/While grappling, the [\w ]+ is considered to be Medium\. Also, wielding a heavy weapon doesn't impose disadvantage/.test(t)) return { traco: null };
  // A SÉTIMA LEVA: a aparência Medonha do Bael (a ação bônus que ele usa sempre, então uma aura), e a Lâmina da Alma do
  // duergar, cujo golpe já está nas ações dele (criar a lâmina não pede nada mais)
  const medo = t.match(/Each creature, other than a devil, that starts its turn within (\d+) feet of [\w ]+ must succeed on a DC (\d+) Wisdom saving throw or be frightened until the start of the creature's next turn/);
  if (medo) return { aura: { raioFt: Number(medo[1]), quando: 'inicioDoAlvo', save: 'wis', dc: Number(medo[2]), condition: 'amedrontado', rounds: 1 }, traco: null };
  if (/As a bonus action, the duergar can create a shortsword-sized, visible blade of psionic energy/.test(t)) return { traco: null };
  // A OITAVA LEVA: o chão difícil em volta (a lama, a contaminação que também envenena, a correnteza) e a postura rastejante
  const lama = t.match(/The ground within (\d+) feet of the [\w ]+ is difficult terrain for other creatures/);
  if (lama) return ml('chaoDificil', { raioFt: Number(lama[1]) });
  const contamina = t.match(/emits an aura of corruption (\d+) feet in every direction\. [^.]*\. Any creature that starts its turn in the aura must succeed on a DC (\d+) Constitution saving throw or take \d+ \((\d+d\d+)\) poison damage/);
  if (contamina) {
    return { motorDoLivro: { chaoDificil: { nome: NOME_PT_PENDENTE, raioFt: Number(contamina[1]) } }, traco: null,
      aura: { raioFt: Number(contamina[1]), quando: 'inicioDoAlvo', save: 'con', dc: Number(contamina[2]), damage: contamina[3], damageType: 'veneno', imunizaAoPassar: true } };
  }
  const correnteza = t.match(/when the [\w ]+ is underwater, it can cause all water within (\d+) feet of it to be difficult terrain for other creatures/);
  if (correnteza) return ml('chaoDificil', { raioFt: Number(correnteza[1]), soNaAgua: true });
  if (/While the [\w ]+ has the prone condition, crawling does not cost it extra movement\. In addition, the prone condition does not grant advantage/.test(t)) return ml('posturaRastejante', {});
  // A DÉCIMA PRIMEIRA LEVA: a cabeçada do giff (sem golpe: o teste no fim da reta) e a sede de sangue do flind
  const cabeca = t.match(/if the [\w ]+ moves at least (\d+) feet in a straight line that ends within 5 feet of a (\w+) or smaller creature, that creature must succeed on a DC (\d+) (\w+) saving throw or take \d+ \((\d+d\d+)\) (\w+) damage and be knocked prone/);
  if (cabeca) return ml('investidaDeCabeca', { pes: Number(cabeca[1]), tamanhoMax: cabeca[2].toLowerCase(), dc: Number(cabeca[3]), save: ATRIBUTO[cabeca[4].toLowerCase()], dano: cabeca[5], tipo: DANO[cabeca[6]] ?? cabeca[6] });
  const sede = t.match(/any creature with the Rampage trait can make a bite attack as a bonus action while within (\d+) feet of the/);
  if (sede) return ml('sedeDeSangue', { raioFt: Number(sede[1]) });
  // A VIGÉSIMA SEXTA LEVA
  // o ÓLEO DO BOGGLE: escorregadio para escapar, grudento para segurar (aqui, vantagem na Acrobacia e no Atletismo do teste)
  if (/The boggle chooses whether the oil is slippery or sticky/.test(t)) return ml('oleoDoBoggle', {});
  // A VIGÉSIMA QUARTA LEVA: o MOTOR DA DOR do duergar martelador e do gritador: quem o ataca pode mirar o duergar preso
  // dentro (desvantagem; acertando, o dado a mais, e a máquina responde com o multiataque na reação)
  const dor = bruto.match(/Once per turn, a creature that attacks the [\w ]+ can target the duergar trapped in it\. The attacker has disadvantage on the attack roll\. On a hit, the attack deals an extra \d+ \(\{@damage ([^}]+)\}\) damage to the [\w ]+, and the [\w ]+ can respond by using its Multiattack with its reaction/);
  if (dor) return ml('motorDaDor', { extra: dor[1].replace(/\s+/g, '') });
  // A VIGÉSIMA PRIMEIRA LEVA: a MALDIÇÃO MORTAL do fensir devorador (quem está a 9 m quando ele morre, Car 13 ou amaldiçoado)
  const maldicao = t.match(/Each creature within (\d+) feet of the [\w ]+ when it dies must succeed on a DC (\d+) Charisma saving throw or be cursed for the next 24 hours/);
  if (maldicao) return ml('maldicaoMortal', { raioFt: Number(maldicao[1]), dc: Number(maldicao[2]) });
  // A VIGÉSIMA LEVA
  // o PRESSÁGIO do adivinho: dois d20 rolados no começo da luta, que ele troca pela jogada de quem vê
  if (/When the [\w ]+ or a creature it can see makes an attack roll, a saving throw, or an ability check, the [\w ]+ can roll a d20 and choose to use this roll in place/.test(t)) return ml('pressagio', { n: 2 });
  // os PONTOS DE FEITIÇARIA do feiticeiro escamado kobold: a Magia Elevada (3 pontos: desvantagem na primeira resistência de um alvo)
  const pontos = t.match(/The [\w ]+ has (\d+) sorcery points[^]*?Heightened Spell: When it casts a spell that forces a creature to a saving throw[^.]*, the [\w ]+ can spend (\d+) sorcery points/);
  if (pontos) return ml('magiaElevada', { pontos: Number(pontos[1]), custo: Number(pontos[2]) });
  // A DÉCIMA NONA LEVA
  // a BOCA DA LOUCURA do gigante de Grolantor: anda até quem estiver mais perto, e um d10 no começo do turno diz o que faz
  if (/On each of its turns, the giant uses all its movement to move toward the nearest creature[^]*Roll a d10 at the start of each of the giant's turns/.test(t)) return ml('bocaDaLoucura', {});
  // os TENTÁCULOS-MANGUAL do caracol: cinco, e um morre a cada turno em que ele leva 10 de dano ou mais; sem nenhum, recolhe-se
  const flail = t.match(/has (\w+) flail tentacles\. Whenever the [\w ]+ takes (\d+) damage or more on a single turn, one of its tentacles dies/);
  if (flail) return ml('tentaculosMangual', { n: NUMERO[flail[1].toLowerCase()] ?? 5, limite: Number(flail[2]) });
  // A DÉCIMA OITAVA LEVA
  // a TRANCA DIMENSIONAL do canoloth: ninguém se teleporta de nem para a até 18 m dele
  const tranca = t.match(/Other creatures can't teleport to or from a space within (\d+) feet of the [\w ]+\. Any attempt to do so is wasted/);
  if (tranca) return ml('trancaDimensional', { raioFt: Number(tranca[1]) });
  // as SOMBRAS DEMONÍACAS do nabassu: a 3 m dele é penumbra, e a luz que não é mágica não acende
  const sombras = t.match(/darkens the area around its body in a (\d+)-foot radius\. Nonmagical light can't illuminate this area of dim light/);
  if (sombras) return ml('sombrasDemoniacas', { raioFt: Number(sombras[1]) });
  // a FORMA DE RELÂMPAGO do colosso relâmpago: quem o toca ou o acerta de perto leva o choque (entrar no espaço fica de fora)
  const forma = bruto.match(/A creature that touches the [\w ]+ or hits it with a melee attack while within 5 feet of it takes \d+ \(\{@damage ([^}]+)\}\) (\w+) damage/);
  if (forma && en === 'Lightning Form') return { corpoQuente: { damage: forma[1].replace(/\s+/g, ''), type: DANO[forma[2]] ?? forma[2] }, traco: null };
  // A DÉCIMA QUINTA LEVA
  // o FOMENTAR A LOUCURA do alkilith: quem não é demônio e começa o turno a 9 m faz Sabedoria, ou o zumbido; falhando por 5, a confusão
  const loucura = t.match(/Any creature that isn't a demon that starts its turn within (\d+) feet of the [\w ]+ must succeed on a DC (\d+) Wisdom saving throw, or it hears/);
  if (loucura) return ml('fomentarLoucura', { raioFt: Number(loucura[1]), dc: Number(loucura[2]) });
  // o VOLTAR AOS VERMES do mago-larva: a 0 PV, desfaz-se num enxame de insetos na mesma casa
  if (/When the [\w ]+ is reduced to 0 hit points, it breaks apart into a swarm of insects in the same space/.test(t)) return ml('voltaAosVermes', {});
  // o NILBOGISMO: quem tenta ferir o nilbog faz Carisma antes, ou fica enfeitiçado e não ataca; e ele não se cura
  const nilbog = t.match(/Any creature that attempts to damage the [\w ]+ must first succeed on a DC (\d+) Charisma saving throw or be charmed until the end of the creature's next turn/);
  if (nilbog) return ml('nilbogismo', { dc: Number(nilbog[1]) });
  // o MOVIMENTO SÍSMICO do zaratan: depois de andar 3 m, o tremor de 36 m que quebra a concentração (o terreno difícil fica de fora)
  const sismoZ = t.match(/As a bonus action after moving at least (\d+) feet on the ground, the [\w ]+ can send a shock wave through the ground in a (\d+)-foot-radius circle centered on itself\.[^]*?concentrating must succeed on a DC (\d+) Constitution/);
  if (sismoZ) return ml('tremorDepoisDeAndar', { exigeFt: Number(sismoZ[1]), raioFt: Number(sismoZ[2]), dc: Number(sismoZ[3]) });
  // o TREINO DE CAVALARIA do duergar kavalrachni: só vale montado, e o jogo não tem montaria (como o Combatente Montado)
  if (/When the duergar hits a target with a melee attack while mounted on a female steeder/.test(t)) return { traco: null };
  // A NONA LEVA: o coração do dragão, a vantagem arcana e o encanto do andarilho dos sonhos (uma aura com teste)
  if (/If the kobold is frightened or paralyzed by an effect that allows a saving throw, it can repeat the save at the start of its turn to end the effect on itself and all kobolds within/.test(t)) return ml('coracaoDoDragao', {});
  const arcana = t.match(/Once per turn, the [\w ]+ can deal an extra \d+ \((\d+d\d+)\) damage to a creature it hits with a damaging spell attack if that target is within 5 feet of an ally/);
  if (arcana) return ml('vantagemArcana', { dados: arcana[1] });
  const sonho = t.match(/An enemy that starts its turn within (\d+) feet of the [\w ]+ must make a DC (\d+) Charisma saving throw, provided that the [\w ]+ isn't incapacitated\. On a failed save, the creature is charmed/);
  if (sonho) return { aura: { raioFt: Number(sonho[1]), quando: 'inicioDoAlvo', save: 'cha', dc: Number(sonho[2]), condition: 'enfeiticado', rounds: 10, repete: true, imunizaAoPassar: true }, traco: null };
  return null;
}

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
  const terceira = tracoDaTerceiraFila(en, t, bruto);
  if (terceira) return terceira;
  // a EMINÊNCIA DIVINA (a profetisa Dran): a mesma regra do sacerdote do SRD, que o motor já faz (`ai.js`)
  if (en === 'Divine Eminence') return { traco: 'eminenciaDivina' };
  // a RAIVA CRESCENTE (o Raivoso) e a FOME DE VIDA (o Faminto): a vantagem e o dano a mais do golpe nomeado
  const armaDe = (nomeEn) => Object.entries(nomesDasAcoes ?? {}).find(([e]) => e.toLowerCase() === nomeEn.toLowerCase())?.[1] ?? null;
  const raiva = t.match(/If another creature deals damage to the [\w ]+, the [\w ]+'s attack rolls have advantage until the end of its next turn, and the first time it hits with a (\w+) attack on its next turn, the attack's target takes an extra \d+ \((\d+d\d+)\) psychic damage/);
  if (raiva) return { motorDoLivro: { raivaCrescente: { nome: NOME_PT_PENDENTE, arma: armaDe(raiva[1]), dados: raiva[2] } }, traco: null };
  const fome = t.match(/If a creature the [\w ]+ can see regains hit points, the [\w ]+ gains two benefits until the end of its next turn: it has advantage on attack rolls, and its (\w+) deals an extra \d+ \((\d+d\d+)\) necrotic damage/);
  if (fome) return { motorDoLivro: { fomeDeVida: { nome: NOME_PT_PENDENTE, arma: armaDe(fome[1]), dados: fome[2] } }, traco: null };
  // os COICES E RECUO da leucrota: depois do golpe com a arma nomeada, desengaja com a ação bônus
  const coice = t.match(/If the [\w ]+ attacks with its (\w+), it can take the Disengage action as a bonus action/);
  if (coice) {
    const arma = Object.entries(nomesDasAcoes ?? {}).find(([e]) => e.toLowerCase() === coice[1].toLowerCase())?.[1] ?? null;
    return { motorDoLivro: { coiceERecua: { nome: NOME_PT_PENDENTE, arma } }, traco: null };
  }
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
  // o CHAMADO À HONRA do comandante espectro da espada: só ferido, e ele ataca com vantagem até o fim do próximo turno
  'Call to Honor': { opcoes: [{ id: 'guerreiroEspectroDaEspada', dados: '1d4+1' }], soFerido: true, vantagemPropria: true },
  // A DÉCIMA SEGUNDA LEVA: os espectros do coletor de cadáveres (ação bônus, uma vez por luta), o servo da matriarca drow
  // (o yochlol: o recuperador é o outro do livro) e os lobos de gelo do moldador (o lobo do inverno, como o livro manda)
  'Summon Specters': { opcoes: [{ id: 'espectro', dados: '1d6' }], porDia: 1 },
  'Summon Servant': { opcoes: [{ id: 'yochlol', dados: '1' }] },
  'Ice Wolves': { opcoes: [{ id: 'loboDoInverno', dados: '1d4', nome: 'Lobo de Gelo' }], porDia: 1 },
};

/**
 * A AÇÃO ESPECIAL que cabe numa forma só: ÁREA (cone, linha, ou "cada criatura a até X pés dele") ou ALVO ("uma
 * criatura que ele vê a até X pés"), com teste, dano e/ou condição; o TOQUE que cura; o TELEPORTE. Usos por dia e
 * recarga vêm do nome ("(3/Day)", "{@recharge 5}"). O que não cabe volta null e fica na fila.
 */
export function acaoEspecial(acao, nomePt, nomesDasAcoes = {}) {
  const bruto = (acao.entries ?? []).filter((e) => typeof e === 'string').join(' ');
  const t = semTags(bruto);
  const usos = Number(semTags(acao.name).match(/(\d)\/Day/)?.[1] ?? 0);
  const comum = { nome: nomePt, ...(usos ? { porDia: usos } : {}), ...(/\{@recharge/.test(acao.name) ? { recharge: rechargeDe(acao.name) } : {}) };
  // A TERCEIRA FILA DOS BESTIÁRIOS (`livro-motor.js`)
  // o COMANDO: até N aliados de um tipo, a até X pés, gastam a reação num golpe cada (o Comando de Ilneval)
  const cmd = t.match(/Up to (\w+) allied ([\w-]+?)s? within (\d+) feet of [^.]*?reactions? to (?:each )?make one ((?:melee |weapon )*)attack/i);
  if (cmd) return { ...comum, tipo: 'comandar', max: NUMERO[cmd[1].toLowerCase()] ?? 1, aliado: cmd[2].toLowerCase(), alcanceFt: Number(cmd[3]), corpoACorpo: /melee/.test(cmd[4]) };
  const umAliado = t.match(/targets one ally (?:he|she|it) can see within (\d+) feet of (?:him|her|it)\. If the target can see or hear [\w ]+, the target can use its reaction to make one (melee )?attack/);
  if (umAliado) return { ...comum, tipo: 'comandar', max: 1, alcanceFt: Number(umAliado[1]), corpoACorpo: !!umAliado[2] };
  // o GOLPE REFORÇADO (os mirmidões): um golpe da arma nomeada, com o dado a mais e a condição; ou o multiataque inteiro
  const ref = bruto.match(/makes one (\w+) attack\. On a hit, the target takes an extra \d+ \(\{@damage ([^}]+)\}\) (\w+) damage/);
  if (ref) {
    const arma = Object.entries(nomesDasAcoes).find(([e]) => e.toLowerCase().replace(/s$/, '') === ref[1].toLowerCase().replace(/s$/, ''))?.[1];
    const dcR = t.match(/DC (\d+) (\w+) saving throw/);
    const condR = nCond(bruto);
    if (arma) return { ...comum, tipo: 'golpeReforcado', arma, extra: ref[2].replace(/\s+/g, ''), extraTipo: DANO[ref[3]] ?? ref[3], ...(dcR && condR ? { save: ATRIBUTO[dcR[2].toLowerCase()], dc: Number(dcR[1]), condition: condR } : {}) };
  }
  const multiR = bruto.match(/uses Multiattack\. Each attack that hits deals an extra \d+ \(\{@damage ([^}]+)\}\) (\w+) damage/);
  if (multiR) return { ...comum, tipo: 'golpeReforcado', multi: true, extra: multiR[1].replace(/\s+/g, ''), extraTipo: DANO[multiR[2]] ?? multiR[2] };
  // FICAR INVISÍVEL (a Mescla de Sombra, o Campo de Invisibilidade, o Sumir, a Invisibilidade Compartilhada)
  if (/(?:can use a bonus action to become|magically (?:becomes|turns)) invisible/.test(t)) {
    return { ...comum, tipo: 'sumir', ...(/While in dim light or darkness/.test(t) ? { soNoEscuro: true } : {}), ...(/or is hit by an attack/.test(t) ? { acabaAoSerAtingido: true } : {}) };
  }
  // ANIMAR OS ALIADOS: o medo e o encanto que acabam, a imunidade, o fanatismo, o favor que cobra dano
  if (/can magically end the charmed and frightened conditions on itself and each creature of its choice that it can see within (\d+) feet/.test(t)) {
    return { ...comum, tipo: 'animarAliados', raioFt: Number(t.match(/within (\d+) feet/)[1]), remove: ['enfeiticado', 'amedrontado'], incluiSi: true };
  }
  const infernal = t.match(/Each ally of [\w' ]+ within (\d+) feet of (?:him|her|it) can't be charmed or frightened until the end of [\w' ]+ next turn/);
  if (infernal) return { ...comum, tipo: 'animarAliados', raioFt: Number(infernal[1]), condicao: 'firmeNoComando', ateFimDoProximoTurno: true };
  const fanat = t.match(/chooses up to (\w+) of its allies within (\d+) feet of it that can see it\. For 1 minute, each of those allies makes attack rolls with advantage and can't be frightened/);
  if (fanat) return { ...comum, tipo: 'animarAliados', max: NUMERO[fanat[1]] ?? 4, raioFt: Number(fanat[2]), condicao: 'fanatizado', rounds: 10 };
  const favor = bruto.match(/on one ally she can see within (\d+) feet of her\. The ally takes \d+ \(\{@damage ([^}]+)\}\) (\w+) damage but has advantage on the next attack roll/);
  if (favor) return { ...comum, tipo: 'animarAliados', max: 1, raioFt: Number(favor[1]), condicao: 'favorDeLolth', ateFimDoProximoTurno: true, dano: favor[2].replace(/\s+/g, ''), tipoDano: DANO[favor[3]] ?? favor[3] };
  // a DISPARADA (o gnoll roedor de carne)
  const disp = t.match(/speed increases by (\d+) feet and it doesn't provoke opportunity attacks/);
  if (disp) return { ...comum, tipo: 'disparada', pes: Number(disp[1]) };
  // a CURA de um número fixo em quem ele toca (o narzugon, que pode ser ele mesmo; o draconato de Bahamut)
  const curaN = t.match(/(?:or one creature it touches, regains up to|The target magically regains) (\d+) hit points/);
  if (curaN) return { ...comum, tipo: 'cura', dados: curaN[1] };
  // O APERTO que sufoca (o armadilheiro, o rastejador rastreador): agarrado, contido, e o dano no começo de cada turno
  const ap = t.match(/One (\w+) or smaller creature [^.]*?within (\d+) feet of [^.]*?must succeed on a DC (\d+) (\w+) saving throw or be grappled \(escape DC (\d+)\)/);
  if (ap) {
    const danos = [...bruto.matchAll(/\(\{@damage ([^}]+)\}\) (\w+) damage/g)];
    if (danos.length) {
      return {
        ...comum, tipo: 'alvo', alcanceFt: Number(ap[2]), save: ATRIBUTO[ap[4].toLowerCase()], dc: Number(ap[3]),
        aperto: { tamanhoMax: ap[1].toLowerCase(), escape: Number(ap[5]), junto: ['contido', ...(/blinded/.test(t) ? ['cego'] : [])],
          dano: danos[0][1].replace(/\s+/g, ''), tipo: DANO[danos[0][2]] ?? danos[0][2], ...(danos[1] ? { dano2: danos[1][1].replace(/\s+/g, ''), tipo2: DANO[danos[1][2]] ?? danos[1][2] } : {}) },
      };
    }
  }
  // a ÁREA NUM PONTO à distância (o Virote Explosivo do besteiro de carvalho, a Lama em Pedra do fensir)
  const ponto = t.match(/at a point within (\d+) feet/) ?? t.match(/centered on a point [^.]*?within (\d+) feet/) ?? t.match(/from a point [^.]*?within (\d+) feet/);
  // o CILINDRO num ponto (o Gêiser de Lava, a Tempestade de Granizo) é, na grade, o círculo do raio dele
  const raioP = t.match(/within (\d+) feet of that point/) ?? t.match(/(\d+)-foot-radius(?: sphere|, \d+-foot-high cylinder) centered on (?:a|that) point/);
  const dcP = t.match(/DC (\d+) (\w+) saving throw/);
  if (ponto && raioP && dcP) {
    const d = danoDo(bruto);
    const d2P = /damage plus \d+ \(\{@damage/.test(bruto) ? [...bruto.matchAll(/\(\{@damage ([^}]+)\}\) (\w+) damage/g)][1] : null;
    const c = nCond(bruto);
    if (d || c) {
      return { ...comum, tipo: 'area', shape: 'sphere', areaFt: Number(raioP[1]), alcanceFt: Number(ponto[1]), save: ATRIBUTO[dcP[2].toLowerCase()], dc: Number(dcP[1]),
        ...(d ? { damage: d.damage, damageType: d.type, halfOnSave: /half as much/.test(t) } : {}),
        // o segundo dado do mesmo acerto ("3d8 perfurante mais 3d8 radiante", o Geodo Explosivo do falarrocha)
        ...(d2P ? { damage2: d2P[1].replace(/\s+/g, ''), damageType2: DANO[d2P[2]] ?? d2P[2] } : {}),
        ...(c ? { condition: c, rounds: /for 1 minute/.test(t) ? 10 : 1, repete: /repeat the saving throw/.test(t), ...(/until the end of the [\w ]+'s next turn/.test(t) ? { ateFimDoTurnoDele: true } : /until the end of its next turn/.test(t) ? { ateFimDoTurnoDoAlvo: true } : {}) } : {}) };
    }
  }
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
  // "makes a bite attack" (o banderhobb do Volo) é a mesma forma
  const engole = t.match(/makes (?:one|a) bite attack against an? (\w+) or smaller (?:target|creature) it is grappling/);
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
  // o TELEPORTE ATERRADOR do gigante da morte: quem estava a até 3 m de onde ele saiu faz o teste ou fica amedrontado
  const medoT = t.match(/Each creature within (\d+) feet of the location the [\w ]+ left must succeed on a DC (\d+) (\w+) saving throw or have the frightened condition/);
  // a EXPLOSÃO DE RELÂMPAGO do sopro animado: quem fica a até 1,5 m de onde ele chega leva o dano
  const chegaT = bruto.match(/Each creature within (\d+) feet of the [\w ]+ after it teleports takes \d+ \(\{@damage ([^}]+)\}\) (\w+) damage/);
  if (tele) return { ...comum, tipo: 'teleporte', alcanceFt: Number(tele[1]), ...(/While in dim light or darkness/.test(t) ? { soNaSombra: true } : {}),
    ...(medoT ? { medoAoSair: { raioFt: Number(medoT[1]), dc: Number(medoT[2]), save: ATRIBUTO[medoT[3].toLowerCase()] } } : {}),
    ...(chegaT ? { danoAoChegar: { raioFt: Number(chegaT[1]), dano: chegaT[2].replace(/\s+/g, ''), tipo: DANO[chegaT[3]] ?? chegaT[3] } } : {}) };
  // a LÍNGUA (o sapomoth): puxa um alvo até Médio que falha a Força, e morde com a ação bônus
  const lingua = t.match(/targets one (\w+) or smaller creature that it can see within (\d+) feet of it\. The target must make a DC (\d+) Strength saving throw\. On a failed save, the target is pulled into an unoccupied space within 5 feet of the [\w ]+, and the [\w ]+ can make a (\w+) attack against it as a bonus action/);
  if (lingua) {
    const mordida = Object.entries(nomesDasAcoes ?? {}).find(([e]) => e.toLowerCase() === lingua[4].toLowerCase())?.[1] ?? null;
    return { ...comum, tipo: 'puxarAlvo', tamanhoMax: lingua[1].toLowerCase() === 'medium' ? 'medio' : lingua[1].toLowerCase(), alcanceFt: Number(lingua[2]), save: 'str', dc: Number(lingua[3]), mordida };
  }
  // o TOQUE PETRIFICANTE (o andarilho dos sonhos): só em quem ele enfeitiçou
  const petrifica = t.match(/touches one (\w+) or smaller creature within (\d+) feet of it that is charmed by it\. The target must make a DC (\d+) Constitution saving throw\. On a failed save, the target becomes petrified/);
  if (petrifica) return { ...comum, tipo: 'alvo', alcanceFt: Number(petrifica[2]), soComCondicao: 'enfeiticado', save: 'con', dc: Number(petrifica[3]), condition: 'petrificado', rounds: 99999, repete: false };
  // o DARDO DE VENTO (o gigante quintessente): acerta sem errar
  const dardo = bruto.match(/hurls it at a creature it can see within (\d+) feet of it\. The javelin is considered a magic weapon and deals \d+ \(\{@damage ([^}]+)\}\) (\w+) damage to the target, striking unerringly/);
  if (dardo) return { ...comum, tipo: 'alvo', alcanceFt: Number(dardo[1]), semTeste: true, damage: dardo[2].replace(/\s+/g, ''), damageType: DANO[dardo[3]] ?? dardo[3] };
  // a PERSEGUIÇÃO FÉRREA (o barrete vermelho): anda até o alvo e chuta (Destreza, ou dano e caído)
  const chute = bruto.match(/moves up to its speed to a creature it can see and kicks with its iron boots\. The target must succeed on a \{@dc (\d+)\} Dexterity saving throw or take \d+ \(\{@damage ([^}]+)\}\) (\w+) damage and be knocked/);
  if (chute) return { ...comum, tipo: 'alvo', anda: true, alcanceFt: 30, save: 'dex', dc: Number(chute[1]), damage: chute[2].replace(/\s+/g, ''), damageType: DANO[chute[3]] ?? chute[3], halfOnSave: false, condition: 'caido', rounds: 99999 };
  // O ÉDITO FLAMEJANTE do marut: o cubo de 18 m, 45 radiante FIXO em todos, e quem levar dano faz Sab 20 ou fica atordoado
  const edito = t.match(/in a (\d+)-foot cube\. Every creature in that area takes (\d+) (\w+) damage\. Each creature that takes any of this damage must succeed on a DC (\d+) (\w+) saving throw or be stunned until the end of the [\w ]+'s next turn/);
  if (edito) return { ...comum, tipo: 'area', shape: 'cube', areaFt: Number(edito[1]), save: ATRIBUTO[edito[5].toLowerCase()], dc: Number(edito[4]), damage: edito[2], damageType: DANO[edito[3]] ?? edito[3], danoSemTeste: true, condition: 'atordoado', rounds: 1, repete: false, ateFimDoTurnoDele: true };
  // A VIGÉSIMA SEXTA LEVA: a MAGIA ECOADA da Pendragon Beestinger: a magia do turno passado outra vez, com a ação bônus
  if (/can cast the spell (?:he|she|it|they) cast on (?:his|her|its|their) last turn, whose casting time becomes 1 bonus action/.test(t)) return { ...comum, tipo: 'magiaEcoada', porDia: comum.porDia ?? 1 };
  // A VIGÉSIMA SEXTA LEVA: a ONDA DE MARÉ do leviatã: a muralha de água de 15 m de espessura em volta dele (Força 24, 6d10, e quem
  // falha vai empurrado com ela); a muralha que segue andando nas rodadas seguintes fica de fora
  const mare = bruto.match(/creates a wall of water centered on itself\.[^.]*\. When the wall appears, all other creatures within its area must each make a \{@dc (\d+)\} Strength saving throw\. A creature takes \d+ \(\{@damage ([^}]+)\}\) (\w+) damage on failed save, or half as much/);
  if (mare) return { ...comum, tipo: 'area', shape: 'raio', areaFt: 25, save: 'str', dc: Number(mare[1]), damage: mare[2].replace(/\s+/g, ''), damageType: DANO[mare[3]] ?? mare[3], halfOnSave: true, arremessaFt: 50 };
  // A VIGÉSIMA QUARTA LEVA: POSSUIR UM CADÁVER do dybbuk: o corpo de fera ou humanoide (até Grande) a 1,5 m vira o corpo dele
  if (/disappears into an intact corpse it can see within (\d+) feet of it\. The corpse must be Large or smaller and be that of a beast or a humanoid/.test(t)) return { ...comum, tipo: 'possuirCadaver', alcanceFt: Number(t.match(/within (\d+) feet/)[1]) };
  // A VIGÉSIMA TERCEIRA LEVA
  // o DESAFIO DO CAMPEÃO do Donaar: quem ele escolhe a 9 m faz Sab 13, ou não se afasta mais de 9 m dele por vontade própria
  const desafio = t.match(/causes each creature of his choice that he can see within (\d+) feet of him to make a DC (\d+) Wisdom saving throw\. On a failure, a creature can't willingly move more than (\d+) feet away/);
  if (desafio) return { ...comum, tipo: 'area', shape: 'raio', areaFt: Number(desafio[1]), save: 'wis', dc: Number(desafio[2]), condition: 'desafioDoCampeao', rounds: 100, repete: false, escolhe: true, porDia: 1, raioDoDesafio: Number(desafio[3]) };
  // a FORMA SELVAGEM da Walnut Dankgrass: vira lobo atroz (os números da fera, a cabeça dela)
  if (/As a bonus action, [\w ]+ can assume the shape of a dire wolf/.test(t)) return { ...comum, tipo: 'formaSelvagem', fera: 'loboAtroz', porDia: 1 };
  // os ESPOROS DE INFESTAÇÃO da Zuggtmoy: a criatura de carne a 6 m, Con 19 ou contrai os esporos (a doença que mata em três dias)
  const infesta = t.match(/releases spores that burst out in a cloud that fills a (\d+)-foot-radius sphere centered on her[^.]*\. Any flesh-and-blood creature in the cloud[^.]*must make a DC (\d+) Constitution saving throw[^]*?infected with a disease called the spores of Zuggtmoy/);
  if (infesta) return { ...comum, tipo: 'area', shape: 'raio', areaFt: Number(infesta[1]), save: 'con', dc: Number(infesta[2]), condition: 'esporosDeZuggtmoy', rounds: Infinity, repete: false, naoTipos: ['constructo', 'morto-vivo', 'elemental'] };
  // A VIGÉSIMA SEGUNDA LEVA
  // APRISIONAR A ALMA do devorador: o humanoide a 0 PV a até 9 m vai para dentro das costelas dele
  const prende = t.match(/chooses a living humanoid with 0 hit points that it can see within (\d+) feet of it\. That creature is teleported inside the [\w ]+'s ribcage and imprisoned there/);
  if (prende) return { ...comum, tipo: 'aprisionarAlma', alcanceFt: Number(prende[1]) };
  // A VIGÉSIMA PRIMEIRA LEVA
  // COLHER OS MORTOS da flor-cadáver: o humanoide morto a até 3 m vai para dentro dela (até nove)
  if (/grabs one unsecured dead humanoid within (\d+) feet of it and stuffs the corpse into itself/.test(t)) return { ...comum, tipo: 'colherMorto', alcanceFt: Number(t.match(/within (\d+) feet/)[1]) };
  // o REDUZIR do mestre mental duergar: por um minuto, Miúdo, +5 de CA, o dano de arma vira 1 e a Força com desvantagem
  if (/For 1 minute, the duergar magically decreases in size[^.]*\. While reduced, the duergar is Tiny, reduces its weapon damage to 1/.test(t)) return { ...comum, tipo: 'postura', condicao: 'reduzidoDuergar', rounds: 10, porDia: 1 };
  // o BEIJO da vargouille: o humanoide incapacitado a 1,5 m, Car 12 ou amaldiçoado (a maldição anda fora da luta)
  const beijo = t.match(/kisses one incapacitated humanoid within (\d+) feet of it\. The target must succeed on a DC (\d+) Charisma saving throw or become cursed/);
  if (beijo) return { ...comum, tipo: 'alvo', alcanceFt: Number(beijo[1]), soIncapacitado: true, soTipos: ['humanoide'], save: 'cha', dc: Number(beijo[2]), condition: 'beijoDaVargouille', rounds: Infinity, repete: false };
  // A VIGÉSIMA LEVA: o PODER DA RAINHA DRAGÃO do abishai vermelho: um dragão a até 36 m, Car 18 ou enfeitiçado por uma hora
  const rainha = t.match(/targets one dragon it can see within (\d+) feet of it\. The dragon must make a DC (\d+) Charisma saving throw[^]*?On a failed save, the target is charmed by the [\w ]+ for 1 hour/);
  if (rainha) return { ...comum, tipo: 'alvo', alcanceFt: Number(rainha[1]), save: 'cha', dc: Number(rainha[2]), condition: 'enfeiticado', rounds: 600, repete: false, soTipos: ['dragão'], imunizaAoPassar: true };
  // A DÉCIMA NONA LEVA
  // a INVESTIDA DE ESCUDO do couraçado gigante do fogo: 9 m em linha reta pelo espaço de quem é menor que Enorme, o golpe do
  // escudo em cada um, e quem é acertado e falha a Força vai empurrado à frente; falhando por 5, cai e leva o tranco
  const escudo = bruto.match(/moves up to (\d+) feet in a straight line and can move through the space of any creature smaller than (\w+)\. The first time it enters a creature's space during this move, it makes a (\w+) attack against that creature\. If the attack hits, the target must also succeed on a \{@dc (\d+)\} Strength saving throw or be pushed ahead of the [\w ]+ for the rest of this move\. If a creature fails the save by 5 or more, it is also knocked \{@condition prone\} and takes \d+ \(\{@damage ([^}]+)\}\) bludgeoning damage, or \d+ \(\{@damage ([^}]+)\}\) bludgeoning damage if it was already/);
  if (escudo) {
    const arma = Object.entries(nomesDasAcoes ?? {}).find(([e]) => e.toLowerCase() === escudo[3].toLowerCase())?.[1];
    const menor = { huge: 'large', large: 'medium', gargantuan: 'huge' }[escudo[2].toLowerCase()] ?? 'large';
    if (arma) return { ...comum, tipo: 'atropelar', pes: Number(escudo[1]), tamanhoMax: menor, golpe: arma,
      empurra: { dc: Number(escudo[4]), dano: escudo[5].replace(/\s+/g, ''), danoCaido: escudo[6].replace(/\s+/g, '') } };
  }
  // os ESPOROS DO CONTROLE MENTAL da Zuggtmoy: humanoides e feras a 6 m, Sab 19 ou enfeitiçados (a nuvem que fica fica de fora)
  const esporos = t.match(/releases spores that burst out in a cloud that fills a (\d+)-foot-radius sphere centered on her[^.]*\. Humanoids and beasts in the cloud[^.]*must make a DC (\d+) Wisdom saving throw\.[^]*?the creature is charmed by her/);
  if (esporos) return { ...comum, tipo: 'area', shape: 'raio', areaFt: Number(esporos[1]), save: 'wis', dc: Number(esporos[2]), condition: 'enfeiticado', rounds: 100, repete: false, soTipos: ['humanoide', 'fera'] };
  // A DÉCIMA OITAVA LEVA: a DUPLICATA ESPECTRAL do berbalang (o corpo dorme enquanto ela luta, e o golpe dela é psíquico)
  const dup = t.match(/creates one spectral duplicate of itself in an unoccupied space it can see within (\d+) feet of it\. While the duplicate exists, the [\w ]+ is unconscious/);
  if (dup) return { ...comum, tipo: 'duplicata', alcanceFt: Number(dup[1]), porDia: 1 };
  // A DÉCIMA SÉTIMA LEVA
  // o FILAMENTO do pescador das cavernas: quem o filamento prende faz Força, ou é puxado até ele e leva a garra (ação bônus)
  const fio = t.match(/One creature grappled by the [\w ]+'s adhesive filament must make a DC (\d+) Strength saving throw[^.]*\. On a failure, the target is pulled into an unoccupied space within 5 feet of the [\w ]+, and the [\w ]+ makes a (\w+) attack against it as a bonus action/);
  if (fio) {
    const arma = Object.entries(nomesDasAcoes ?? {}).find(([e]) => e.toLowerCase() === fio[2].toLowerCase())?.[1];
    return { ...comum, tipo: 'puxarAlvo', soAgarrado: true, alcanceFt: 60, save: 'str', dc: Number(fio[1]), ...(arma ? { mordida: arma } : {}) };
  }
  // o PÓ FERRÃO do colosso de poeira: quem está "dentro" dele (aqui, colado), Con, 3d6 e cego até o fim do próximo turno
  const po = bruto.match(/One creature of the [\w ]+'s choice inside its space must make a \{@dc (\d+)\} (\w+) saving throw\. On a failed save, the creature takes \d+ \(\{@damage ([^}]+)\}\) (\w+) damage and has the \{@condition blinded\} condition until the end of its next turn/);
  if (po) return { ...comum, tipo: 'alvo', alcanceFt: 5, save: ATRIBUTO[po[2].toLowerCase()], dc: Number(po[1]), damage: po[3].replace(/\s+/g, ''), damageType: DANO[po[4]] ?? po[4], halfOnSave: true, condition: 'cego', rounds: 1, ateFimDoTurnoDoAlvo: true };
  // a PRAGA do oinoloth (ação bônus, recarga 5): o chão a 9 m apodrece; quem começa o turno perto faz Con ou 4d6 necrótico e envenenado
  const praga = t.match(/As a bonus action, the [\w ]+ blights the area within (\d+) feet of it\.[^]*?when a creature moves into the blighted area or starts its turn there, that creature must make a DC (\d+) (\w+) saving throw\. On a successful save, the creature is immune[^.]*\. On a failed save, the creature takes \d+ \((\d+d\d+)\) (\w+) damage and is poisoned/);
  if (praga) return { ...comum, tipo: 'postura', condicao: 'pragaDoOinoloth', rounds: 10, data: { auraNoInicio: { raioFt: Number(praga[1]), dc: Number(praga[2]), save: ATRIBUTO[praga[3].toLowerCase()], dano: praga[4], tipo: DANO[praga[5]] ?? praga[5], condition: 'envenenado', imunizaAoPassar: true } } };
  // A DÉCIMA SEGUNDA LEVA
  // BLOQUEAR O CAMINHO do ogro aríete: a postura até o começo do próximo turno dele
  const bloq = bruto.match(/Until the start of the [\w ]+'s next turn, attack rolls against the [\w ]+ have disadvantage, it has advantage on the attack roll it makes for an opportunity attack, and that attack deals an extra \d+ \(\{@damage ([^}]+)\}\) bludgeoning damage on a hit\. Also, each enemy that tries to move out of the [\w ]+'s reach without teleporting must succeed on a \{@dc (\d+)\} Strength saving throw/);
  if (bloq) return { ...comum, tipo: 'postura', condicao: 'bloqueandoOCaminho', data: { extra: bloq[1].replace(/\s+/g, ''), dc: Number(bloq[2]) } };
  // o AGARRÃO SEPULCRAL do rebento de Skoraeus: dano e agarrado, e quem segue preso no começo do turno dele vira pedra
  const sepulcral = bruto.match(/touches one (\w+) or smaller creature it can see within (\d+) feet of itself\. The target must succeed on a \{@dc (\d+)\} (\w+) saving throw or take \d+ \(\{@damage ([^}]+)\}\) (\w+) damage and have the \{@condition grappled\} condition \(escape \{@dc (\d+)\}\)\. At the start of the [\w ]+'s next turn, if the target is still \{@condition grappled\}, the target has the \{@condition petrified\} condition/);
  if (sepulcral) return { ...comum, tipo: 'alvo', alcanceFt: Number(sepulcral[2]), tamanhoMax: sepulcral[1].toLowerCase(), save: ATRIBUTO[sepulcral[4].toLowerCase()], dc: Number(sepulcral[3]),
    damage: sepulcral[5].replace(/\s+/g, ''), damageType: DANO[sepulcral[6]] ?? sepulcral[6], prende: { escape: Number(sepulcral[7]), petrificaNoInicio: true } };
  // a CORDA DE CABELO do korred: a corda anda até 6 m e prende (agarrado e contido) quem falha a Destreza
  const cabelo = bruto.match(/commands one such rope within (\d+) feet of it to move up to (\d+) feet and entangle a (\w+) or smaller creature that the [\w ]+ can see\. The target must succeed on a \{@dc (\d+)\} (\w+) saving throw or become \{@condition grappled\} by the rope \(escape \{@dc (\d+)\}\)\. Until this grapple ends\.? the target is \{@condition restrained\}/);
  if (cabelo) return { ...comum, tipo: 'alvo', alcanceFt: Number(cabelo[1]) + Number(cabelo[2]), tamanhoMax: cabelo[3].toLowerCase(), save: ATRIBUTO[cabelo[5].toLowerCase()], dc: Number(cabelo[4]),
    prende: { escape: Number(cabelo[6]), contido: true }, semPrenderDeNovo: true };
  // A DÉCIMA PRIMEIRA LEVA
  // o DRENO DE SANGUE do beijo da morte: no agarrado pelo tentáculo, e cura metade do que tirou
  const drenoT = bruto.match(/One creature \{@condition grappled\} by a tentacle of the [\w ]+ must make a \{@dc (\d+)\} (\w+) saving throw\. On a failed save, the target takes \d+ \(\{@damage ([^}]+)\}\) (\w+) damage, and the [\w ]+ regains half as many hit points/);
  if (drenoT) return { ...comum, tipo: 'alvo', alcanceFt: 20, soAgarrado: true, save: ATRIBUTO[drenoT[2].toLowerCase()], dc: Number(drenoT[1]), damage: drenoT[3].replace(/\s+/g, ''), damageType: DANO[drenoT[4]] ?? drenoT[4], drenaMetade: true };
  // o OLHAR LADRÃO DE ALMAS do nabassu: o máximo de PV cai pelos dados, e ele ganha o mesmo em PV temporários
  const ladrao = bruto.match(/targets one creature it can see within (\d+) feet of it\. If the target can see the [\w ]+ and isn't a construct or an undead, it must succeed on a \{@dc (\d+)\} (\w+) saving throw or reduce its hit point maximum by \d+ \(\{@damage ([^}]+)\}\) damage and give the [\w ]+ an equal number of temporary hit points/);
  if (ladrao) return { ...comum, tipo: 'alvo', alcanceFt: Number(ladrao[1]), save: ATRIBUTO[ladrao[3].toLowerCase()], dc: Number(ladrao[2]), reduzMaximoDados: ladrao[4].replace(/\s+/g, ''), pvTempIgual: true, naoTipos: ['constructo', 'morto-vivo'] };
  // a CURA CORROMPIDA do oinoloth: toda a vida de volta, um nível de exaustão e o máximo menor
  const corrompida = bruto.match(/touches one willing creature within (\d+) feet of it\. The target regains all its hit points\.[^]*?hit point maximum is reduced by \d+ \(\{@dice ([^}]+)\}\)/);
  if (corrompida) return { ...comum, tipo: 'curaCorrompida', alcanceFt: Number(corrompida[1]), reduzDados: corrompida[2].replace(/\s+/g, '') };
  // ATROPELAR (o rastro de geada do colosso de geada, a investida voraz da bocarra de Yeenoghu): anda pelo espaço das
  // criaturas, e cada uma em que entra faz o teste
  const atrop = t.match(/moves up to its speed without provoking opportunity attacks and can move through the spaces? of (?:any )?(\w+) or smaller creatures?\. Each time the [\w ]+ enters (?:another|a) creature's space for the first time during this move, that creature must (?:make|succeed on) a DC (\d+) (\w+) saving throw/);
  if (atrop) {
    const dA = bruto.match(/takes? \d+ \(\{@damage ([^}]+)\}\) (\w+) damage/);
    const lentoA = t.match(/its speed is reduced by (\d+) feet until the start of the [\w ]+'s next turn/);
    const agarraA = t.match(/grappled condition \(escape DC (\d+)\)/);
    if (dA) return { ...comum, tipo: 'atropelar', tamanhoMax: atrop[1].toLowerCase(), save: ATRIBUTO[atrop[3].toLowerCase()], dc: Number(atrop[2]),
      damage: dA[1].replace(/\s+/g, ''), damageType: DANO[dA[2]] ?? dA[2], halfOnSave: /half as much damage/.test(t),
      ...(lentoA ? { lento: true } : {}), ...(agarraA ? { agarra: { escape: Number(agarraA[1]), contido: /restrained/.test(t), caiSeJaPreso: /already grappled this way, it has the prone/.test(t) } } : {}) };
  }
  // A DÉCIMA LEVA: a sanguessuga do yagnoloth, a rajada de garras do mutilador, o erguer carniçal do maurezhi
  const leech = bruto.match(/touches one (?:\{@condition )?incapacitated\}? creature within (\d+) feet of it\. The target takes \d+ \(\{@damage ([^}]+)\}\) (\w+) damage, and the [\w ]+ gains temporary hit points equal to half the damage dealt\. The target must succeed on a \{@dc (\d+)\} Constitution saving throw, or its hit point maximum is reduced/);
  if (leech) return { ...comum, tipo: 'alvo', alcanceFt: Number(leech[1]), soIncapacitado: true, save: 'con', dc: Number(leech[4]), damage: leech[2].replace(/\s+/g, ''), damageType: DANO[leech[3]] ?? leech[3], danoSemTeste: true, pvTempMetade: true, reduzMaximo: true, reduzMaximoSeFalhar: true };
  const rajada = t.match(/makes (\w+) (\w+) attacks against one target/);
  if (rajada && NUMERO[rajada[1].toLowerCase()]) {
    const arma = Object.entries(nomesDasAcoes ?? {}).find(([e]) => e.toLowerCase() === rajada[2].toLowerCase())?.[1] ?? null;
    if (arma) return { ...comum, tipo: 'golpes', arma, vezes: NUMERO[rajada[1].toLowerCase()] };
  }
  const reviver = t.match(/targets one dead (\w+) or (\w+) it can see within (\d+) feet of it\. The target is revived with all its hit points/);
  if (reviver) return { ...comum, tipo: 'reviver', alcanceFt: Number(reviver[3]), nomes: [reviver[1], reviver[2]] };
  // a VINGANÇA CORROMPIDA (o orc nutrido de Yurtrus): ele mesmo se leva a 0 PV para explodir
  if (/reduces itself to 0 hit points, triggering its/.test(t)) return { ...comum, tipo: 'sacrificio' };
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
  // o dano "de um tipo à escolha dele: frio, elétrico ou trovejante" (o Chamado da Tempestade): o primeiro da lista
  const d = danoDo(bruto) ?? (() => { const x = bruto.match(/\(\{@damage ([^}]+)\}\) damage of a type of the [\w' ]+ choosing: (\w+)/); return x ? { damage: x[1].replace(/\s+/g, ''), type: DANO[x[2]] ?? x[2] } : null; })();
  const cond = nCond(bruto) ?? (/roll a \{@dice d6\} at the start of each of its turns/.test(bruto) ? 'euforico'
    // o Olhar Enfraquecedor do babau (o golpe de Força pela metade, como o Raio do Enfraquecimento) e a Presença
    // Exaurinte do dragão oco (metade do deslocamento e desvantagem nos ataques)
    : /deals only half damage with weapon attacks that use Strength/.test(t) ? 'enfraquecido'
    : /speed is halved and it has disadvantage on attack rolls/.test(t) ? 'esmorecido'
    : /can't use reactions, its speed is halved/.test(t) ? 'lentificado' : /speed halved and has disadvantage/.test(t) ? 'deformado'
    : /disadvantage on Wisdom saving throws and all ability checks/.test(t) ? 'amaldicoadoLamia'
      : /disadvantage on ability checks, attack rolls, and saving throws/.test(t) ? 'escarnecido' : /drop to 0 hit points/.test(t) ? 'caido' : null);
  if (!d && !cond) return null;
  const comprida = t.match(/line (?:of \w+ )?that is (\d+) feet long/) ?? t.match(/in a line (\d+) feet long/);
  const forma = comprida ? [null, comprida[1], 'line'] : t.match(/(\d+)-foot(?:-long)?[ -](cone|line|cube)/);
  const noEspaco = !forma && (/in the [\w ]+'s space/i.test(t) || (/in its space/i.test(t) && !/within \d+ feet/.test(t))) ? [null, '5'] : null;
  // "each enemy within 30 feet" (o cavaleiro negro), "Creatures within 30 feet of the deep scion" (o rebento das profundezas)
  // a VOZ que se ouve a 90 m (a Voz do Kraken): quem ele escolhe, no raio em que ela se ouve
  const voz = !forma && t.match(/audible within (\d+) feet\. Creatures of the [\w' ]+ choice that can hear/);
  const raio = noEspaco ?? (voz ? [null, voz[1]] : null) ?? (!forma && /(?:each|every|any) (?:other )?(?:creature|humanoid|enemy)|(?:^|\. )(?:All other )?[Cc]reatures (?:of [\w' -]+? choice )?within/i.test(t)
    ? t.match(/within (\d+) feet of (?:it|the \w+|him|her)/i) ?? t.match(/(\d+)-foot[ -]radius/i) ?? t.match(/(?:enemy|[Cc]reatures|creatures of [\w' -]+? choice) within (\d+) feet/i) : null);
  const varios = !forma && !raio ? (t.match(/up to (\w+) creatures[^.]*?within (\d+) feet/i) ?? t.match(/creates (\w+) bolts of [^.]*?within (\d+) feet/i)
    ?? t.match(/targets one or (\w+) creatures[^.]*?within (\d+) feet/i)) : null;
  const alvo = !forma && !raio && !varios ? t.match(/(?:one|a) (?:creature|humanoid|target|frightened creature|creature charmed)[^.]*?within (\d+) feet/i)
    // "uma criatura que a vê ou a ouve" (a Canção da Dominação): sem distância no livro, a da voz, 18 m
    ?? (/targets one creature that can see or hear (?:her|him|it)/.test(t) ? [null, '60'] : null) : null;
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
    ...(voz ? { escolhe: true } : {}),
    ...(/creature charmed by it/i.test(t) ? { soComCondicao: 'enfeiticado' } : {}),
    ...(/drop to 0 hit points/.test(t) ? { cai0: true } : {}),
    ...(/knocked \{@condition prone\}|knocked prone/.test(bruto) && cond !== 'caido' ? { tambemCaido: true } : {}),
    ...(/flung up (\d+) feet/.test(t) ? { arremessaFt: Number(t.match(/flung up (\d+) feet/)[1]) } : {}),
    ...(/regains hit points equal to the total damage/.test(t) ? { drena: true } : {}),
    ...(/hit point maximum is reduced by an amount equal/.test(t) ? { reduzMaximo: true } : {}),
    save: ATRIBUTO[dc[2].toLowerCase()], dc: Number(dc[1]),
    ...(d ? { damage: d.damage, damageType: d.type, halfOnSave: /half as much|takes half the/.test(t) } : {}),
    ...(cond && !cai0 ? { condition: cond, rounds, repete: /repeat the saving throw/.test(t), ...(rounds === 1 ? { ateFimDoTurnoDele: true } : {}) } : {}),
    // a condição só de quem falha por N ou mais (a Tempestade de Raios da tempestade anciã: o atordoado)
    ...(cond && /saving throw fails by (\d+) or more, the creature is also/.test(t) ? { soFalhandoPor: Number(t.match(/saving throw fails by (\d+) or more/)[1]) } : {}),
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
    // o UM COM A TEMPESTADE do gigante quintessente só vale no COVIL dele, e o jogo não tem covil (como a ação de covil)
    if (/can't use this ability outside its lair/.test(t)) continue;
    // o EMERGIR do zaratan: sai da carapaça e cospe a pedra (antes da leitura de golpe, que o tomaria por um Cuspir qualquer)
    if (/emerges from its shell and uses/.test(t)) {
      const usa = t.match(/emerges from its shell and uses ([\w ]+?)\./)?.[1];
      opcoes.push({ ...base, tipo: 'emergir', arma: usa ? acaoPt(usa) : null }); continue;
    }
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
    // o VENDAVAL UIVANTE da tempestade anciã: a linha de uma milha (o tabuleiro inteiro) que arremessa 18 m quem falha
    const vendaval = t.match(/in a line that is 1 mile long and (\d+) feet wide\.[^]*?DC (\d+) (\w+) saving throw or take \d+ \((\d+d\d+)\) (\w+) damage and be flung up to (\d+) feet/);
    if (vendaval) {
      opcoes.push({ ...base, tipo: 'linha', comprimentoFt: 5280, larguraFt: Number(vendaval[1]), save: ATRIBUTO[vendaval[3].toLowerCase()], dc: Number(vendaval[2]),
        damage: vendaval[4], damageType: DANO[vendaval[5]] ?? vendaval[5], halfOnSave: false, arremessaFt: Number(vendaval[6]), dcDaBatida: Number(t.match(/that other creature must succeed on a DC (\d+)/)?.[1] ?? 19) });
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
    if (/casts (?:a|one) cantrip/.test(t)) { opcoes.push({ ...base, tipo: 'magia', soTruque: true }); continue; }
    if (/casts (?:a|one) spell/.test(t)) { opcoes.push({ ...base, tipo: 'magia' }); continue; }
    // a TERCEIRA FILA: o COMANDO lendário (um aliado à vista golpeia com a reação; ou o demônio aliado da matriarca) e o
    // SUMIR (o balhannoth)
    const cmdL = t.match(/targets one ally it can see within (\d+) feet of it\. If the target can see (?:and|or) hear [\w ]+, the target can make one (melee )?(?:weapon )?attack (?:as a reaction|using its reaction)(?: and (?:gains|has) advantage on the attack roll)?/);
    if (cmdL) { opcoes.push({ ...base, tipo: 'comandar', max: 1, alcanceFt: Number(cmdL[1]), corpoACorpo: !!cmdL[2], vantagem: /advantage on the attack roll/.test(t) }); continue; }
    const demonio = t.match(/An allied (\w+) within (\d+) feet of the [\w ]+ uses its reaction to make one attack/);
    if (demonio) { opcoes.push({ ...base, tipo: 'comandar', max: 1, aliado: demonio[1].toLowerCase(), alcanceFt: Number(demonio[2]) }); continue; }
    if (/magically becomes invisible for up to [\w ]+ or until immediately after it makes an attack roll/.test(t)) { opcoes.push({ ...base, tipo: 'invisivel' }); continue; }
    const tele = t.match(/teleports[^.]*?(?:up to|within) (\d+) feet/);
    if (tele) { opcoes.push({ ...base, tipo: 'teleporte', alcanceFt: Number(tele[1]) }); continue; }
    // (o ki-rin escreve "up to its half its speed")
    const anda = t.match(/(moves|flies) up to (?:its |his |her )?(half )?(?:its |his |her )?(?:flying )?speed/);
    if (anda) { opcoes.push({ ...base, tipo: 'mover', metade: !!anda[2], semOportunidade: /without provoking/.test(t) }); continue; }
    if (/^The [\w ]+ moves without provoking opportunity attacks\.?$/.test(t)) { opcoes.push({ ...base, tipo: 'mover', semOportunidade: true }); continue; }
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
    // A DÉCIMA SEXTA LEVA: as formas lendárias que faltavam
    // QUEBRAR A CONCENTRAÇÃO (o cérebro ancião: 1d4 psíquico por círculo; o dragão cérebro ancião: só quem ele agarra, 3d12)
    const quebra = t.match(/breaks the creature's concentration on a spell it has cast\. The creature also takes (\d+d\d+) psychic damage per level of the spell/);
    if (quebra) { opcoes.push({ ...base, tipo: 'quebrarConcentracao', alcanceFt: Number(t.match(/within (\d+) feet/)?.[1] ?? 120), danoPorCirculo: quebra[1] }); continue; }
    const estilhaca = t.match(/targets a creature it is grappling\. The target's concentration on a spell it has cast or an ability it is maintaining ends, and the target takes \d+ \((\d+d\d+)\) psychic damage/);
    if (estilhaca) { opcoes.push({ ...base, tipo: 'quebrarConcentracao', soAgarrado: true, damage: estilhaca[1] }); continue; }
    // o PULSO PSÍQUICO: os inimigos a 3 m de uma criatura que ele vê levam o dano, sem teste
    const pulso = t.match(/targets a creature within (\d+) feet of it with which it has a psychic link\. Enemies of the [\w ]+ within (\d+) feet of that creature take \d+ \((\d+d\d+)\) psychic damage/);
    if (pulso) { opcoes.push({ ...base, tipo: 'pulso', alcanceFt: Number(pulso[1]), raioFt: Number(pulso[2]), damage: pulso[3], damageType: 'psíquico' }); continue; }
    // CORTAR O ELO: desvantagem em tudo até o fim do próximo turno do alvo, sem teste
    if (/ends the link, causing the creature to have disadvantage on all ability checks, attack rolls, and saving throws until the end of the creature's next turn/.test(t)) {
      opcoes.push({ ...base, tipo: 'alvo', alcanceFt: Number(t.match(/within (\d+) feet/)?.[1] ?? 120), semTeste: true, condition: 'zumbidoNaCabeca' }); continue;
    }
    // a AURA FERVENTE da tartaruga-dragão anciã: até o começo do próximo turno dela, quem começa o turno a 6 m faz o teste ou queima
    const ferve = t.match(/Until the start of the [\w ]+'s next turn, whenever a creature starts its turn within (\d+) feet of the [\w ]+, that creature must succeed on a DC (\d+) (\w+) saving throw or take \d+ \((\d+d\d+)\) (\w+) damage/);
    if (ferve) { opcoes.push({ ...base, tipo: 'postura', condicao: 'auraFervente', data: { auraNoInicio: { raioFt: Number(ferve[1]), dc: Number(ferve[2]), save: ATRIBUTO[ferve[3].toLowerCase()], dano: ferve[4], tipo: DANO[ferve[5]] ?? ferve[5] } } }); continue; }
    // a MORTE RASTEJANTE do Orcus: quem está no cilindro fica vulnerável a necrótico até o fim do próximo turno dele
    const rasteja = t.match(/chooses a point on the ground that he can see within (\d+) feet of him\. A cylinder of swirling necrotic energy \d+ feet tall and with a (\d+)-foot radius[^.]*\. Creatures in that area have vulnerability to necrotic damage/);
    if (rasteja) { opcoes.push({ ...base, tipo: 'vulnerar', alcanceFt: Number(rasteja[1]), raioFt: Number(rasteja[2]), condicao: 'morteRastejante' }); continue; }
    // INVOCAR MORTOS-VIVOS do senhor das caveiras: até cinco esqueletos, e nunca mais de cinco de uma vez
    const mortos = t.match(/Up to (\w+) skeletons or zombies appear in unoccupied spaces within (\d+) feet/);
    if (mortos) { opcoes.push({ ...base, tipo: 'invocar', id: 'esqueleto', max: NUMERO[mortos[1].toLowerCase()] ?? 5 }); continue; }
    // o ALIMENTAR do mago-larva: quem a Praga de Vermes pegou leva o dano, e ele ganha PV temporários
    const alimenta = t.match(/Each creature restrained by the [\w ]+'s Plague of Worms takes \d+ \((\d+d\d+)\) necrotic damage, and the [\w ]+ gains (\d+) temporary hit points/);
    if (alimenta) { opcoes.push({ ...base, tipo: 'alimentar', damage: alimenta[1], pvTemp: Number(alimenta[2]) }); continue; }
    // A DÉCIMA SÉTIMA LEVA: o zaratan na concha (Recolher, Revitalizar, Emergir) e o Dance, Meu Boneco do Graz'zt
    if (/retracts into its shell\. Until it takes its Emerge action, it has resistance to all damage/.test(t)) { opcoes.push({ ...base, tipo: 'recolher' }); continue; }
    const revive = t.match(/can use this option only if it is retracted in its shell\. It regains \d+ \(([\dd+ ]+)\) hit points/);
    if (revive) { opcoes.push({ ...base, tipo: 'revitalizar', dados: revive[1].replace(/\s+/g, '') }); continue; }
    if (/One creature charmed by [\w']+ that [\w']+ can see must use its reaction to move up to its speed as [\w']+ directs\.?$/.test(t)) { opcoes.push({ ...base, tipo: 'marionete', soMove: true }); continue; }
    // IMPOR A VONTADE da Zuggtmoy: quem ela enfeitiçou gasta a reação num golpe no aliado dele
    if (/One creature charmed by [\w']+ that (?:she|he|it) can see must use its reaction to move up to its speed as (?:she|he|it) directs or to make a weapon attack against a target that (?:she|he|it) designates/.test(t)) {
      opcoes.push({ ...base, tipo: 'marionete' }); continue;
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
/**
 * OS BLOCOS DE INVOCAÇÃO do Fizban: os números saem de quem invoca (a proficiência, o círculo da magia). O draco companheiro
 * do Guardião do Draco já tem bloco feito à mão (`monsters/espiritos-tce.js`), e o espírito dracônico só viria de uma magia que
 * o jogo não tem; a fila não os cobra.
 */
const BLOCOS_DE_INVOCACAO = new Set(['Draconic Spirit', 'Drake Companion']);

export function bloco(m, pt, magiasEn, pend) {
  if (BLOCOS_DE_INVOCACAO.has(m.name)) pend = [];
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
  let escuridaoDoBloco = false;
  const tracos = []; const textoDosTracos = {};
  // A TERCEIRA FILA: o `motorDoLivro` e a `vantagemRacial` de dois traços diferentes se SOMAM (o yuan-ti tem as Presas
  // Mentais e a Bênção de Sseth), e o nome do traço é o da tradução
  const juntar = (resto, nomePt) => {
    const troca = (v) => JSON.parse(JSON.stringify(v).replaceAll(NOME_PT_PENDENTE, nomePt.replace(/"/g, '\\"')));
    if (resto.motorDoLivro) { extra.motorDoLivro = { ...(extra.motorDoLivro ?? {}), ...troca(resto.motorDoLivro) }; delete resto.motorDoLivro; }
    if (resto.vantagemRacial) { extra.vantagemRacial = [...(extra.vantagemRacial ?? []), ...troca(resto.vantagemRacial)]; delete resto.vantagemRacial; }
    return resto;
  };
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
    // a INVENÇÃO DE ARMA do kobold inventor: cada opção, uma vez por dia — os golpes (o ácido, o fogo de alquimista, o
    // escorpião no bastão) e os bichos soltos (as centopeias, as larvas, as vespas); o limo verde e o gambá ficam de fora
    if (/^Weapon Invention/.test(en)) {
      const itens = (a.entries ?? []).flatMap((e) => (typeof e === 'object' && e.items ? e.items : []));
      let entrou = 0;
      for (const it of itens) {
        const nomeEn = String(it.name).replace(/^\d+\.\s*/, '');
        const nomeIt = INVENCOES_DO_KOBOLD[nomeEn];
        if (!nomeIt) continue;
        const bicho = /swarm of (centipedes|rot grubs|wasps)/.exec(it.entry ?? '')?.[1];
        if (bicho) { (especiais ??= []).push({ nome: nomeIt, tipo: 'invocar', opcoes: [{ id: { centipedes: 'enxameDeCentopeias', 'rot grubs': 'enxameDeLarvasPutrefatas', wasps: 'enxameDeVespas' }[bicho], dados: '1' }], porDia: 1 }); entrou += 1; continue; }
        const gi = golpe({ name: nomeEn, entries: [it.entry ?? ''] }, nomeIt);
        if (gi) { (especiais ??= []).push({ nome: nomeIt, tipo: 'golpeEspecial', golpe: { ...gi, nomeEn }, porDia: 1 }); entrou += 1; }
      }
      if (entrou) { textoSo(en, ptA); continue; }
    }
    // a ANATOMIA PISCIANA da cria do mar: uma lista de golpes dentro da ação, e cada um vira golpe do bloco
    if (/has one or more of the following attack options/.test(semTags(texto(a.entries)))) {
      const itens = (a.entries ?? []).flatMap((e) => (typeof e === 'object' && e.items ? e.items : []));
      const gs = itens.map((it) => { const x = golpe({ name: it.name, entries: [it.entry ?? ''] }, NOMES_DA_ANATOMIA[it.name] ?? it.name); if (x) x.nomeEn = it.name; return x; }).filter(Boolean);
      if (gs.length) { ataques.push(...gs); textoSo(en, ptA); continue; }
    }
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
    // a ESCURIDÃO sem componentes (o ancião sombrio, o Véu de Shargaas, a Escuridão Rastejante): a magia, uma vez por luta
    if (/casts darkness/.test(semTags(texto(a.entries)))) { escuridaoDoBloco = true; textoSo(en, ptA); continue; }
    // o DRENO DE SANGUE do carrapato gigante: o grudado pelo Probóscide perde o sangue, e o carrapato cura o mesmo
    const grude = /deals \d+ \(\{@damage ([^}]+)\}\) (\w+) damage to one creature it is physically attached to/.exec(texto(a.entries));
    if (grude) {
      Object.assign(extra, juntar({ motorDoLivro: { grude: { nome: NOME_PT_PENDENTE, dano: grude[1].replace(/\s+/g, ''), tipo: DANO[grude[2]] ?? grude[2], curaIgual: /regains hit points equal to the damage dealt/.test(texto(a.entries)), semLimite: true } } }, ptA?.nome ?? en));
      // e o golpe que o prende (o Probóscide) passa a grudar
      for (const x of m.action ?? []) if (/attaches to the target/.test(texto(x.entries))) { const g = ataques.find((y) => y.nomeEn === limpaNome(x.name)); if (g) g.gruda = true; }
      textoSo(en, ptA); continue;
    }
    // os RAIOS PRISMÁTICOS do falarrocha: o cone com o teste, e os raios são as ações irmãs "1-2: ...", que o d6 sorteia
    if (/^\d-\d: /.test(en) && (m.action ?? []).some((x) => /^Prismatic Rays/.test(x.name))) continue;
    if (/^Prismatic Rays/.test(en)) {
      const tP = semTags(texto(a.entries));
      const formaP = tP.match(/form a (\d+)-foot (cone)/);
      const dcP = tP.match(/DC (\d+) (\w+) saving throw/);
      const raios = (m.action ?? []).filter((x) => /^\d-\d: /.test(x.name)).map((x) => {
        const [, de, ate] = x.name.match(/^(\d)-(\d)/);
        const tx = semTags(texto(x.entries));
        const d = tx.match(/takes \d+ \(([\dd+ ]+)\) (\w+) damage/);
        const c = String(texto(x.entries)).match(/\{@condition (\w+)\}/);
        const ptR = (pt.acoes ?? []).find((y) => y.en === x.name);
        return d && { de: Number(de), ate: Number(ate), nome: ptR?.nome?.replace(/^\d-\d: /, '') ?? x.name, damage: d[1].replace(/\s+/g, ''), damageType: DANO[d[2]] ?? d[2], condition: c ? CONDICAO_DO_MOTOR[c[1]] : undefined };
      }).filter(Boolean);
      if (formaP && dcP && raios.length === 3) {
        (especiais ??= []).push({ nome: ptA?.nome ?? en, tipo: 'area', shape: 'cone', areaFt: Number(formaP[1]), save: ATRIBUTO[dcP[2].toLowerCase()], dc: Number(dcP[1]), halfOnSave: true, sorteio: raios, damage: raios[0].damage, damageType: raios[0].damageType });
        continue;
      }
    }
    const esp = acaoEspecial(a, ptA?.nome ?? en, nomesDasAcoes);
    if (esp) { (especiais ??= []).push(esp); continue; }
    semMotor(en, ptA, 'acao');
  }
  // o dreno do golpe que gruda (o Miserável) vai para o bloco, onde `drenarSangue` o lê
  for (const g of ataques) if (g.grude) { extra.motorDoLivro = { ...(extra.motorDoLivro ?? {}), grude: { nome: g.name, ...g.grude } }; delete g.grude; }
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
    // os CADÁVERES da flor-cadáver: 1d6+3 corpos dentro, e com a ação bônus ela digere um (cura) ou anima um (zumbi)
    {
      const corpos = semTags(texto(tr.entries)).match(/contains the corpses of (\d+d\d+ \+ \d+) humanoids\. A corpse flower can hold the remains of up to (\w+) dead humanoids/);
      const cura = JSON.stringify(tr.entries ?? []).match(/digests one humanoid corpse in its body and instantly regains \d+ \(\{@dice ([^}]+)\}\) hit points/);
      if (corpos && cura) {
        Object.assign(extra, juntar({ motorDoLivro: { cadaveres: { nome: NOME_PT_PENDENTE, dados: corpos[1].replace(/\s+/g, ''), max: NUMERO[corpos[2].toLowerCase()] ?? 9 } } }, ptT?.nome ?? en));
        (especiais ??= []).push({ nome: 'Digerir um Cadáver', tipo: 'digerir', bonus: true, dados: cura[1].replace(/\s+/g, '') },
          { nome: 'Erguer um Cadáver', tipo: 'animarCadaver', bonus: true, id: 'zumbi' });
        textoSo(en, ptT); continue;
      }
    }
    // o FILAMENTO ADESIVO do pescador das cavernas: com a ação, lança o fio a até 18 m e prende quem ele toca (a Destreza para
    // não ser tocado é nossa: o livro diz só que gruda em quem encosta). O Filamento da lista de ações puxa quem ficou preso.
    {
      const fioT = semTags(texto(tr.entries)).match(/can use its action to extend a sticky filament up to (\d+) feet[^]*?grappled by the [\w ]+ \(escape DC (\d+)\)/);
      if (fioT) { (especiais ??= []).push({ nome: ptT?.nome ?? en, tipo: 'alvo', alcanceFt: Number(fioT[1]), save: 'dex', dc: Number(fioT[2]), prende: { escape: Number(fioT[2]) }, semPrenderDeNovo: true }); textoSo(en, ptT); continue; }
    }
    const lido = tracoLido(en, tr, ataques, nomesDasAcoes);
    if (lido) {
      const { traco, features, ...resto } = lido;
      if (traco) tracos.push(traco);
      if (features) extra.features = [...new Set([...(extra.features ?? []), ...features])];
      // o que a terceira fila leu fica com o texto na ficha (o motor não tem traço com nome para mostrar)
      const daTerceira = !!(resto.motorDoLivro || resto.vantagemRacial || resto.corpoQuente?.soCortaOuFura);
      Object.assign(extra, juntar(resto, ptT?.nome ?? en));
      if (daTerceira) textoSo(en, ptT);
      continue;
    }
    if (SABOR.has(en)) { textoSo(en, ptT); continue; }
    // o traço que a PRÓPRIA criatura usa como ação bônus vira ação especial com `bonus` (o Passo Feérico, o Segundo
    // Fôlego, a Fúria Marcial, a Provocação). Depois da leitura de sempre: o Balbucio do MM fala na ação bônus de quem o ouve
    // (o Desafio do Campeão prende quem falha perto do Donaar; a frase cita "incapacitado" sobre o próprio Donaar e a leitura
    // geral tomaria isso pela condição de quem falha: fica na fila)
    if (/(?:^|\. )As a bonus action, |can use a bonus action(?: on its turn)? to |can teleport as a bonus action|whose casting time becomes 1 bonus action/.test(semTags((tr.entries ?? []).filter((e) => typeof e === 'string').join(' ')))) {
      const esp = acaoEspecial(tr, ptT?.nome ?? en, nomesDasAcoes);
      if (esp) { (especiais ??= []).push({ ...esp, bonus: true }); textoSo(en, ptT); continue; }
    }
    semMotor(en, ptT, 'traco');
  }
  // A DÉCIMA TERCEIRA LEVA: A LISTA DE AÇÕES BÔNUS (`bonus`), que o Fizban e o Bigby têm à parte e ninguém lia — 76 ações
  // de 48 criaturas, fora do motor e fora da fila. O golpe vai com o perfil DENTRO da ação (`golpe`), para a IA nunca o usar
  // como ação; o resto é a ação especial de sempre, com `bonus`; o que não couber entra na fila com a chave `bonus`.
  for (const b of m.bonus ?? []) {
    const en = limpaNome(b.name);
    if (SUBOPCOES_BONUS.has(en)) continue;
    const ptB = { nome: NOMES_DA_ACAO_BONUS[en] ?? en, desc: '' };
    if (en === 'Change Shape') { textoSo(en, { ...ptB, desc: 'Com a ação bônus, toma a forma de outra criatura e guarda os números dela. No jogo, só o nome.' }); continue; }
    if (en === 'Fade Back') { textoSo(en, { ...ptB, desc: 'Com a ação bônus, volta a ficar visível, inteiro ou em parte. No jogo, só o nome.' }); continue; }
    const especialB = acaoBonusDoLivro(b, ptB.nome, nomesDasAcoes);
    if (especialB) { (especiais ??= []).push({ ...especialB, bonus: true }); continue; }
    const usosB = Number(semTags(b.name).match(/(\d)\/Day/)?.[1] ?? 0);
    const g = golpe(b, ptB.nome);
    // a mordida que ENGOLE (o colosso de carne, o regissauro) e o pó que só contorna de luz (o escaravelho do tesouro) ficam na fila
    // o PÓ DE ESCAMAS (o escaravelho do tesouro): quem falha a Destreza fica contornado de luz e não pode ficar invisível
    const poB = semTags(texto(b.entries)).match(/Each creature within (\d+) feet of the [\w ]+ must succeed on a DC (\d+) Dexterity saving throw or be outlined in blue light for 10 minutes/);
    if (poB) { (especiais ??= []).push({ nome: ptB.nome, tipo: 'area', shape: 'raio', areaFt: Number(poB[1]), save: 'dex', dc: Number(poB[2]), condition: 'contornadoDeLuz', rounds: 100, repete: false, bonus: true, ...(usosB ? { porDia: usosB } : {}) }); continue; }
    if (/swallow|outlined in/.test(semTags(texto(b.entries)))) { semMotor(en, ptB, 'bonus'); continue; }
    if (g && g.damage) {
      (especiais ??= []).push({ nome: ptB.nome, tipo: 'golpeBonus', bonus: true, golpe: { ...g, nomeEn: en },
        ...(usosB ? { porDia: usosB } : {}), ...(/\{@recharge/.test(b.name) ? { recharge: rechargeDe(b.name) } : {}) });
      continue;
    }
    const espB = acaoEspecial(b, ptB.nome, nomesDasAcoes);
    if (espB) { (especiais ??= []).push({ ...espB, bonus: true }); continue; }
    semMotor(en, ptB, 'bonus');
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
      Object.assign(extra, juntar(resto, ptR?.nome ?? en));
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
  let sc = conjuracao(m, magiasEn, pendMagias);
  if (escuridaoDoBloco) {
    sc ??= { ability: 'wis', cantrips: [], prepared: [], slots: [], noMotor: true, conjuraNoTurno: 'geral' };
    sc.porDia = { ...(sc.porDia ?? {}), escuridao: 1 };
    sc.prepared = [...new Set([...sc.prepared, 'escuridao'])];
  }
  if (acaoDoMultiataque) multi = multiataque(acaoDoMultiataque, nomesDasAcoes, ataques);
  // a FORMA ETÉREA do monstro (a Zuggtmoy, a nagpa, o dragão de esmeralda ancião): a fuga para o plano etéreo que o motor tem
  // (a magia existe no jogo desde 2026-11-16, para o herói; no monstro ela continua sendo a fuga, que a IA usa)
  const eterea = pendMagias.has('etherealness') || (sc && JSON.stringify(sc).includes('"formaEterea"'));
  if (eterea) {
    pendMagias.delete('etherealness');
    if (sc) {
      for (const k of ['prepared', 'cantrips', 'aVontade']) if (Array.isArray(sc[k])) sc[k] = sc[k].filter((x) => x !== 'formaEterea');
      for (const k of ['porDia', 'aVontade', 'cdPorMagia']) if (sc[k] && !Array.isArray(sc[k])) delete sc[k].formaEterea;
    }
    (especiais ??= []).push({ nome: 'Forma Etérea', tipo: 'etereo', porDia: 1 });
  }
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
    // as MARCAS do tipo ("demon", "yugoloth"): quem obedece a um comando (`livro-motor.js obedeceAoComando`)
    ...(typeof m.type === 'object' && m.type.tags?.length ? { marcas: m.type.tags.map((x) => (typeof x === 'string' ? x : x.tag)).filter(Boolean) } : {}),
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
  // A VIGÉSIMA SEXTA LEVA: o MIMETISMO DE MAGIA do gargantua: depois da magia de até o 5º círculo de quem ele vê, Car 19 de quem
  // conjurou, ou ele conjura a mesma magia, no mesmo círculo, com os números dele
  {
    const mim = semTags(texto(r.entries)).match(/Immediately after a creature the [\w ]+ can see casts a spell of (\d)(?:st|nd|rd|th) level or lower, the [\w ]+ tries to copy the spell\. That creature must succeed on a DC (\d+) Charisma saving throw, or the [\w ]+ immediately casts the same spell at the same level \(\+?(\d+) to hit with spell attacks, spell save DC (\d+)\)/);
    if (mim) return { motorDoLivro: { mimetismo: { nome: NOME_PT_PENDENTE, circuloMax: Number(mim[1]), dc: Number(mim[2]), ataque: Number(mim[3]), cd: Number(mim[4]), usos: Number(r.name.match(/(\d)\/Day/)?.[1] ?? 1) } }, traco: null };
  }
  // A VIGÉSIMA SEGUNDA LEVA: a REFLEXÃO DE MAGIA do morkoth (a magia de ataque que erra vai para outro) e a do colosso rúnico
  // (o tiro de força em quem conjura, e a magia falha se ele não passar a Inteligência)
  if (/If the [\w ]+ makes a successful saving throw against a spell, or a spell attack misses it, the [\w ]+ can choose another creature \(including the spellcaster\) it can see within (\d+) feet/.test(semTags(texto(r.entries)))) {
    return { motorDoLivro: { espelharMagia: { nome: NOME_PT_PENDENTE, alcanceFt: Number(semTags(texto(r.entries)).match(/within (\d+) feet/)[1]) } }, traco: null };
  }
  {
    const runica = texto(r.entries).match(/\{@atk rs\} \{@hit (\d+)\} to hit, range (\d+) ft\., one creature casting a spell of (\d)(?:st|nd|rd|th) level or lower\. \{@h\}\d+ \(\{@damage ([^}]+)\}\) (\w+) damage, and the target must succeed on a \{@dc (\d+)\} (\w+) saving throw or the spell fails/);
    if (runica) return { motorDoLivro: { reflexaoRunica: { nome: NOME_PT_PENDENTE, bonus: Number(runica[1]), alcanceFt: Number(runica[2]), circuloMax: Number(runica[3]),
      dano: runica[4].replace(/\s+/g, ''), tipo: DANO[runica[5]] ?? runica[5], dc: Number(runica[6]), save: ATRIBUTO[runica[7].toLowerCase()], usos: Number(r.name.match(/(\d)\/Day/)?.[1] ?? 2) } }, traco: null };
  }
  // o ABSORVER GOLPE do Splugoth: o golpe corpo a corpo de arma que o acerta é anulado (a arma presa fica de fora)
  if (/When a creature [\w ]+ can see hits him with a melee weapon attack, the weapon snags[^.]*\. The attack is negated/.test(semTags(texto(r.entries)))) {
    return { motorDoLivro: { absorverGolpe: { nome: NOME_PT_PENDENTE } }, traco: null };
  }
  // o VELO ABSORVENTE do carneiro gigante: passou numa resistência contra magia (ou a magia errou), e ele dispara de volta
  {
    const velo = semTags(texto(r.entries)).match(/Immediately after the [\w ]+ succeeds on a saving throw against a spell or a spell's attack misses it, the [\w ]+ can make one ([\w ]+?) attack/);
    const armaV = velo && Object.entries(nomesDasAcoes ?? {}).find(([e]) => e.toLowerCase() === velo[1].toLowerCase())?.[1];
    if (armaV) return { motorDoLivro: { veloAbsorvente: { nome: NOME_PT_PENDENTE, arma: armaV, ...(/\{@recharge/.test(r.name) ? { recarga: true } : {}) } }, traco: null };
  }
  const bruto = texto(r.entries);
  const t = semTags(bruto);
  if (/halves the damage that (?:it|he|she) takes from an attack that hits (?:it|him|her)/.test(t)) return { features: ['uncannyDodge'], traco: 'esquivaSobrenatural' };
  // A SEGUNDA LEVA: as reações que protegem o aliado, o +10 no ataque, o golpe vingador, a explosão do orthon
  const mlR = (k, v) => ({ motorDoLivro: { [k]: { nome: NOME_PT_PENDENTE, ...v } }, traco: null });
  const inter = t.match(/another creature within 5 feet of it being hit by an attack roll, the [\w ]+ gives that creature a \+(\d+) bonus to its AC/);
  if (inter) return mlR('interceptar', { bonus: Number(inter[1]) });
  const guia = t.match(/grants? (?:the creature )?a \+(\d+) bonus to (?:an|that|the) (?:attack )?roll/);
  if (guia && /within (\d+) feet/.test(t)) return mlR('golpeGuiado', { bonus: Number(guia[1]), alcanceFt: Number(t.match(/within (\d+) feet/)[1]) });
  const leal = t.match(/When another (\w+) within 5 feet of the [\w ]+ is hit by an attack, the [\w ]+ causes itself to be hit instead/);
  if (leal) return mlR('guardaCostas', { tipo: TIPO[leal[1]] ?? null });
  if (/within 5 feet of [\w ]+ that is charmed by (?:her|him|it) must use its reaction to be hit by the attack instead/.test(t)) return mlR('servoProtetor', {});
  // A OITAVA LEVA: o alcance mortal da garra de osso
  if (/In response to a visible enemy moving into its reach, the [\w ]+ makes one [\w ]+ attack against that enemy\. If the attack hits, the [\w ]+ can make a second/.test(t)) return mlR('alcanceMortal', {});
  // A SÉTIMA LEVA: a paz do eladrin do outono, o encanto instintivo, e o roubo de forma (só aparência: nada no jogo)
  const paz = t.match(/If a creature charmed by the [\w ]+ hits with an attack roll while within (\d+) feet of the [\w ]+, the [\w ]+ magically causes the attack to miss/);
  if (paz) return mlR('cultivarAPaz', { alcanceFt: Number(paz[1]) });
  const encanto = t.match(/(?:attacker is within|within) (\d+) feet[^.]*?(?:makes an attack roll against it|visible to it)[^]*?DC (\d+) Wisdom saving throw\. On a failed save, the attacker (?:must )?targets? the creature (?:that is )?closest to it/);
  if (encanto) return mlR('encantoInstintivo', { alcanceFt: Number(encanto[1]), dc: Number(encanto[2]), ...(/immune to the [\w ]+'s Instinctive Charm/.test(t) ? { imunizaAoPassar: true } : {}), ...(/Recharges after/.test(semTags(r.name)) ? { usoUnico: true } : {}) });
  if (/magically transform itself to look and feel like that creature while retaining its game statistics/.test(t)) return { traco: null };
  // A SEXTA LEVA: o abraço do Perdido, o rebento que se alimenta, a instrução do senhor da guerra
  const abraco = t.match(/If the [\w ]+ takes damage while it has a creature grappled, that creature takes \d+ \((\d+d\d+)\) psychic damage/);
  if (abraco) return mlR('abracoQueAperta', { dados: abraco[1] });
  const come = t.match(/Immediately after taking damage, if it has at least one creature swallowed, the [\w ]+ deals \d+ \((\d+d\d+)\) force damage to each swallowed creature and regains (\d+) hit points/);
  if (come) return mlR('alimentarDoEngolido', { dados: come[1], cura: Number(come[2]) });
  if (/When an ally that the [\w ]+ can see makes a d20 roll, the [\w ]+ can roll a 1d6 and the ally can add the number rolled to the d20 roll by taking/.test(t)) return mlR('instrucaoCortante', {});
  // A QUINTA LEVA: o gigante que não se deixa mover nem derrubar
  if (/In response to failing a saving throw to avoid being moved, having the prone condition, or both, the [\w ]+ succeeds instead/.test(t)) return mlR('inabalavel', {});
  // A QUARTA LEVA (2026-11-16): as reações que mexem no dano antes de ele entrar, e a do mago-larva
  const reverte = t.match(/reduces the damage to 0 and regains (\d+d\d+) hit points/);
  if (reverte) return mlR('reverterSorte', { cura: reverte[1] });
  if (/gives itself resistance to that damage/.test(t)) return mlR('adaptarAoDano', {});
  const nevasca = t.match(/reducing the damage to itself by half\. The [\w ]+ can then magically teleport to an unoccupied space it can see within (\d+) feet/);
  if (nevasca) return mlR('fugaNaNevasca', { alcanceFt: Number(nevasca[1]) });
  const elo = t.match(/another creature the [\w ]+ can see within (\d+) feet of it is about to take damage, the [\w ]+ reduces that damage by \d+ \((\d+d\d+)\)\. The [\w ]+ then takes damage equal to that amount/);
  if (elo) return mlR('eloProtetor', { alcanceFt: Number(elo[1]), dados: elo[2] });
  const desarma = t.match(/within (\d+) feet of it makes a damage roll, the [\w ]+ can roll a (d\d+) and subtract the number rolled from that damage roll/);
  if (desarma) return mlR('palavrasDesarmantes', { alcanceFt: Number(desarma[1]), dados: `1${desarma[2]}` });
  const fraqueza = t.match(/When a creature within (\d+) feet of the [\w ]+ fails a saving throw, the [\w ]+ gains (\d+) temporary hit points/);
  if (fraqueza) return mlR('alimentarDaFraqueza', { raioFt: Number(fraqueza[1]), pv: Number(fraqueza[2]) });
  const curva = t.match(/teleports, exchanging positions with another star spawn it can see within (\d+) feet/);
  if (curva) return mlR('curvarEspaco', { alcanceFt: Number(curva[1]) });
  const ving = t.match(/In response to an? (\w+) being reduced to 0 hit points within (\d+) feet of the [\w ]+, the [\w ]+ makes a melee attack/);
  if (ving) return mlR('vinganca', { aliado: ving[1].toLowerCase(), raioFt: Number(ving[2]) });
  const expl = bruto.match(/reduced to (\d+) hit points or fewer, the [\w ]+ causes itself to explode\. All other creatures within (\d+) feet of it must each make a \{@dc (\d+)\} (\w+) saving throw, taking \d+ \(\{@damage ([^}]+)\}\) (\w+) damage plus \d+ \(\{@damage ([^}]+)\}\) (\w+) damage/);
  if (expl) {
    return mlR('explodeFerido', { limiar: Number(expl[1]), raioFt: Number(expl[2]), dc: Number(expl[3]), save: ATRIBUTO[expl[4].toLowerCase()],
      dano: expl[5].replace(/\s+/g, ''), tipo: DANO[expl[6]] ?? expl[6], dano2: expl[7].replace(/\s+/g, ''), tipo2: DANO[expl[8]] ?? expl[8] });
  }
  // o NEGAR MAGIA do apostador do destino: a magia de até o 3º círculo falha (o teste contra a de 4º ou mais fica de fora)
  const nega = t.match(/sees a creature within (\d+) feet of itself casting a spell[^.]*\. If the creature is casting a spell using a spell slot of (\d)\w+ level or lower, the spell fails/);
  if (nega) return { negarMagia: { usos: Number(semTags(r.name).match(/(\d)\/Day/)?.[1] ?? 3), circuloMax: Number(nega[2]), alcanceFt: Number(nega[1]) }, traco: null };
  // o DESVIO DE PROJÉTIL de monstro (o adepto de artes marciais, a Rosie): os dados do bloco
  const desvio = t.match(/being hit by a ranged weapon attack, [\w ]+ deflects? the missile\. The damage (?:it|he|she) takes from the attack is reduced by (\d+d\d+(?: \+ \d+)?)/);
  if (desvio) return { motorDoLivro: { desviarProjetil: desvio[1].replace(/\s+/g, '') }, traco: null };
  const ca = t.match(/\+(\d+) bonus to (?:its )?AC against (?:that|the) attack/);
  if (ca && !/gives that creature|another creature/.test(t)) return { traco: 'aparar', apararBonus: Number(ca[1]), apararTudo: true };
  const quando = /(?:takes damage|is damaged|being damaged|taking damage|hits (?:it|him|her) with|being hit by|hit by a melee|takes (?:piercing|slashing|bludgeoning) (?:or (?:piercing|slashing|bludgeoning) )?damage)/.test(t);
  // só o dano desses tipos a dispara (a Ferida Nociva: corte ou ponta)
  const soTipos = t.match(/takes ((?:piercing|slashing|bludgeoning)(?: or (?:piercing|slashing|bludgeoning))?) damage/)?.[1].split(' or ').map((x) => DANO[x]);
  if (!quando) return null;
  const dc = t.match(/DC (\d+) (\w+) saving throw/);
  if (dc) {
    const d = bruto.match(/\(\{@damage ([^}]+)\}\) (\w+) damage/);
    // a condição de um minuto, com o teste no fim de cada turno (a Voz Temível do Hutijin)
    const umMinuto = /for 1 minute/.test(t) && nCond(bruto);
    const cond = /poisoned condition until the end of its next turn|poisoned until the end/.test(t) ? 'envenenado' : umMinuto || null;
    const raio = t.match(/(?:Each|All other) creatures? (?:within|in that area|in a) ?(\d+)?[- ]?(?:feet|foot)?/);
    const raioFt = Number(t.match(/(?:Each|All other) creatures? within (\d+) feet/)?.[1] ?? t.match(/(\d+)-foot-radius sphere/)?.[1] ?? 0) || null;
    if (!d && !cond) return null;
    return {
      repreensao: {
        nome, alcanceFt: Number(t.match(/within (\d+) feet of (?:it|itself|the)/)?.[1] ?? 60), save: ATRIBUTO[dc[2].toLowerCase()], dc: Number(dc[1]),
        ...(d ? { damage: d[1].replace(/\s+/g, ''), damageType: DANO[d[2]] ?? d[2], metade: /half as much/.test(t) } : {}),
        ...(cond ? { condition: cond } : {}),
        ...(umMinuto ? { rounds: 10, repete: /repeat the saving throw/.test(t) } : {}),
        ...(soTipos ? { soTipos } : {}),
        ...(raio && raioFt ? { raioFt } : {}),
        ...(/pushed (?:horizontally )?(\d+) feet/.test(t) ? { empurraFt: Number(t.match(/pushed (?:horizontally )?(\d+) feet/)[1]) } : {}),
      },
    };
  }
  const golpeR = t.match(/makes? (?:one|a) ([A-Za-z ]+?) attack/) ?? t.match(/can make (?:one|a) ([A-Za-z ]+?) attack/) ?? t.match(/makes one attack with its (\w+)/);
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
  if (MAGIAS_LONGAS_DOS_MONSTROS.size) console.log(`fora da fila: ${MAGIAS_LONGAS_DOS_MONSTROS.size} magias que o jogo deixa fora (1 minuto ou mais de conjuração, ou só se narrariam) (${[...MAGIAS_LONGAS_DOS_MONSTROS].sort().join(', ')})`);
  console.log(`pendente no motor: ${cont('traco')} traços, ${cont('acao')} ações, ${cont('reacao')} reações, ${cont('lendarias')} criaturas com ações lendárias, ${cont('magias')} com magia que ainda não temos, ${cont('semGolpe')} sem golpe nenhum`);
}
