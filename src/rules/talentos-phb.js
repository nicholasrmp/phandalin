// OS TALENTOS DO LIVRO DO JOGADOR (2014), no lugar do aumento de atributo. A regra de cada um é a do livro, conferida à
// mão; o nome e a descrição saem da tradução (`talentos-phb-texto.js`, escrito por `src/dev/importar-talentos.mjs` a partir
// de `src/dev/talentos/phb-pt.json`). O que cada um faz EM COMBATE mora em `talentos.js`, como o resto dos talentos; aqui
// fica o que o talento é: pré-requisito, o que põe na ficha ao ser tomado e as escolhas dele.
//
// O 1º nível continua com o talento de ORIGEM do livro de 2024 (`game/criacao.js TALENTOS_DE_ORIGEM`). Nos níveis de
// aumento, o jogador troca o aumento (+2 num atributo ou +1 em dois) por um destes. Oito existem nas duas versões; nos
// níveis de aumento vale a de 2014 (`igualA` diz qual é a de 2024), e quem já tem a de origem não pega a mesma de novo.
// O Robusto (Tough) é o mesmo talento nos dois livros e usa o id de origem, `vigoroso`.
//
// FICA DE FORA o Combatente Montado: o jogo não tem montaria, e um talento que não faz nada não entra.
//
// DECISÃO DE JOGO, a mesma do resto dos talentos: o que o livro deixa decidir na hora (aceitar o −5 do Mestre em Armas
// Grandes, gastar a reação do Duelista) o motor decide sozinho, e só quando muda o resultado ou rende mais.

import { CLASSES } from './classes/index.js';
import { SPELLS } from './spells.js';
import { WEAPONS } from './items/index.js';
import { CLASSES_DAS_MAGIAS_PHB } from './magias-por-classe-phb.js';
import { TEXTO_DOS_TALENTOS_PHB } from './talentos-phb-texto.js';

const ATRIBUTOS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const FISICOS = ['str', 'dex'];

/** As classes de onde o Iniciado em Magia, o Conjurador de Rituais e o Atirador Arcano tiram as magias, e o atributo de cada uma. */
export const CLASSES_DE_MAGIA = { bardo: 'cha', bruxo: 'cha', clerigo: 'wis', druida: 'wis', feiticeiro: 'cha', mago: 'int' };
export const ELEMENTOS_DO_ADEPTO = ['ácido', 'frio', 'fogo', 'elétrico', 'trovejante'];
export const MANOBRAS_DO_ADEPTO = CLASSES.guerreiro.subclasse.opcoes.mestreDeBatalha.opcoesDeManobra;
/** As armas do Mestre em Armas de Haste: o golpe com a outra ponta (e a do ataque de quem entra no alcance, com o pique). */
export const HASTES_DO_GOLPE = ['glaive', 'alabarda', 'bordao', 'lancaCurta'];
export const HASTES_DO_ALCANCE = ['glaive', 'alabarda', 'pique', 'bordao', 'lancaCurta'];

const treinaArmadura = (c, t) => (c.armorTraining ?? []).includes(t);
// Saber conjurar: uma magia de verdade na lista (o sopro do draconato mora na conjuração racial, e não é magia).
const eMagia = (id) => Boolean(SPELLS[id]) && !String(id).startsWith('sopro_');
const conjura = (c) => Boolean(c.spellcasting && ([...(c.spellcasting.cantrips ?? []), ...(c.spellcasting.prepared ?? []),
  ...(c.spellcasting.sempreProntas ?? [])].some(eMagia) || (c.spellcasting.slotsMax ?? []).some((n) => n > 0)));
const minimo = (hab, n) => (c) => ((c.abilities?.[hab] ?? 10) >= n ? null : `pede ${NOME_DO_ATRIBUTO[hab]} ${n}`);
const NOME_DO_ATRIBUTO = { str: 'Força', dex: 'Destreza', con: 'Constituição', int: 'Inteligência', wis: 'Sabedoria', cha: 'Carisma' };

/**
 * A tabela. `en`: o nome no livro (é o que casa com a tradução). `atributo`: o +1 fixo ({ cha: 1 }) ou a lista de onde se
 * escolhe. `requer(c)`: o pré-requisito, null quando passa. `igualA`: a versão de origem (2024) do mesmo talento.
 * `repete`: pode ser tomado mais de uma vez (o Adepto Elemental, um elemento por vez). `escolhe`: o que mais o talento pede.
 * `noJogo`: o que ele faz aqui, numa frase, para a tela de subir de nível.
 */
export const TALENTOS_PHB = {
  ator: { en: 'Actor', atributo: { cha: 1 },
    noJogo: '+1 Carisma. Disfarçado, vantagem em Enganação e Atuação.' },
  alertaPhb: { en: 'Alert', igualA: 'alerta',
    noJogo: '+5 na iniciativa; acordado, não é pego de surpresa; quem ele não vê não ganha vantagem por estar escondido.' },
  atleta: { en: 'Athlete', atributo: FISICOS,
    noJogo: '+1 Força ou Destreza. Levantar do chão custa 1,5 m; escalar não custa a mais.' },
  investida: { en: 'Charger',
    noJogo: 'Depois da Disparada, um golpe de ação bônus; com 3 m em linha reta antes, +5 de dano.' },
  especialistaEmBesta: { en: 'Crossbow Expert',
    noJogo: 'Ignora a recarga das bestas, atira sem desvantagem com inimigo colado e, depois de atacar com arma de uma mão, dispara a besta de mão como ação bônus.' },
  duelistaDefensivo: { en: 'Defensive Duelist', requer: minimo('dex', 13),
    noJogo: 'Com arma de acuidade na mão, a reação soma a proficiência à CA contra um golpe corpo a corpo que ia acertar.' },
  combatenteComDuasArmas: { en: 'Dual Wielder',
    noJogo: '+1 de CA com uma arma de corpo a corpo em cada mão, e luta com duas armas mesmo sem serem leves.' },
  exploradorDeMasmorras: { en: 'Dungeon Delver',
    noJogo: 'Vantagem para achar porta secreta, vantagem na resistência contra armadilha e metade do dano dela; a marcha depressa não tira 5 da Percepção passiva.' },
  duravel: { en: 'Durable', atributo: { con: 1 },
    noJogo: '+1 Constituição. Cada dado de vida gasto cura no mínimo o dobro do modificador de Constituição (e 2, pelo menos).' },
  adeptoElemental: { en: 'Elemental Adept', requer: (c) => (conjura(c) ? null : 'pede saber conjurar'), repete: true, escolhe: ['elemento'],
    noJogo: 'Num tipo de dano (ácido, frio, fogo, elétrico ou trovejante), as magias passam por cima da resistência e cada 1 nos dados vira 2.' },
  agarrador: { en: 'Grappler', requer: minimo('str', 13),
    noJogo: 'Vantagem nos ataques contra quem ele agarra; com a ação, imobiliza (os dois ficam contidos).' },
  mestreEmArmasGrandes: { en: 'Great Weapon Master',
    noJogo: 'Crítico ou derrubada com arma de perto dá um golpe de ação bônus; com arma pesada, troca −5 no ataque por +10 no dano quando compensa.' },
  curandeiroPhb: { en: 'Healer', igualA: 'curandeiro',
    noJogo: 'O kit estabiliza com 1 PV; com a ação, cura 1d6 + 4 + o nível do aliado, uma vez por descanso para cada um.' },
  armaduraPesada: { en: 'Heavily Armored', atributo: { str: 1 }, requer: (c) => (treinaArmadura(c, 'média') ? null : 'pede treino em armadura média'),
    noJogo: '+1 Força e treino em armadura pesada.' },
  mestreEmArmadurasPesadas: { en: 'Heavy Armor Master', atributo: { str: 1 }, requer: (c) => (treinaArmadura(c, 'pesada') ? null : 'pede treino em armadura pesada'),
    noJogo: '+1 Força. De armadura pesada, o dano de concussão, corte e perfuração de ataque não mágico cai 3.' },
  liderInspirador: { en: 'Inspiring Leader', requer: minimo('cha', 13),
    noJogo: 'Antes da luta, até seis aliados (ele incluso) ganham PV temporários iguais ao nível dele + Carisma.' },
  menteAgucada: { en: 'Keen Mind', atributo: { int: 1 },
    noJogo: '+1 Inteligência. (O resto do talento, saber o norte e as horas, o jogo não pergunta.)' },
  armaduraLeve: { en: 'Lightly Armored', atributo: FISICOS,
    noJogo: '+1 Força ou Destreza e treino em armadura leve.' },
  linguista: { en: 'Linguist', atributo: { int: 1 },
    noJogo: '+1 Inteligência. (Os idiomas e as cifras o jogo ainda não pergunta.)' },
  sortudoPhb: { en: 'Lucky', igualA: 'sortudo',
    noJogo: 'Três pontos de sorte por luta, que o jogo gasta só quando mudam o resultado.' },
  matadorDeMagos: { en: 'Mage Slayer',
    noJogo: 'Golpe de reação em quem conjura a 1,5 m; quem ele fere testa a concentração com desvantagem; vantagem contra magia de quem está colado.' },
  iniciadoEmMagiaPhb: { en: 'Magic Initiate', igualA: 'iniciadoEmMagia', escolhe: ['classe', 'magias'],
    noJogo: 'Dois truques e uma magia de 1º círculo de uma classe; a magia sai uma vez de graça por luta.' },
  adeptoMarcial: { en: 'Martial Adept', escolhe: ['manobras'],
    noJogo: 'Duas manobras do Mestre de Batalha e um dado de superioridade d6 a mais.' },
  mestreEmArmadurasMedias: { en: 'Medium Armor Master', requer: (c) => (treinaArmadura(c, 'média') ? null : 'pede treino em armadura média'),
    noJogo: 'Armadura média sem desvantagem em Furtividade e, com Destreza 16 ou mais, até +3 de Destreza na CA.' },
  movel: { en: 'Mobile',
    noJogo: '+3 m de deslocamento; na Disparada, terreno difícil não custa a mais; quem ele ataca de perto não o pega de oportunidade no turno.' },
  moderadamenteBlindado: { en: 'Moderately Armored', atributo: FISICOS, requer: (c) => (treinaArmadura(c, 'leve') ? null : 'pede treino em armadura leve'),
    noJogo: '+1 Força ou Destreza e treino em armadura média e escudo.' },
  observador: { en: 'Observant', atributo: ['int', 'wis'],
    noJogo: '+1 Inteligência ou Sabedoria e +5 na Percepção e na Investigação passivas.' },
  mestreEmArmasDeHaste: { en: 'Polearm Master',
    noJogo: 'Golpe de ação bônus com a outra ponta (d4) e ataque de oportunidade em quem entra no alcance da haste.' },
  resiliente: { en: 'Resilient', atributo: ATRIBUTOS,
    noJogo: '+1 num atributo e proficiência na resistência dele.' },
  conjuradorDeRituais: { en: 'Ritual Caster', escolhe: ['classe', 'rituais'],
    requer: (c) => ((c.abilities?.int ?? 10) >= 13 || (c.abilities?.wis ?? 10) >= 13 ? null : 'pede Inteligência ou Sabedoria 13'),
    noJogo: 'Um livro de rituais com duas magias de 1º círculo de uma classe, conjuradas só como ritual, fora da luta.' },
  atacanteSelvagemPhb: { en: 'Savage Attacker', igualA: 'atacanteSelvagem',
    noJogo: 'Uma vez por turno, no golpe corpo a corpo com arma, rola o dano duas vezes e fica com o maior.' },
  sentinela: { en: 'Sentinel',
    noJogo: 'O ataque de oportunidade que acerta para o alvo; Desengajar não o evita; e quem ataca outro ao lado dele leva um golpe de reação.' },
  atiradorDeElite: { en: 'Sharpshooter',
    noJogo: 'Sem desvantagem no alcance longo, ignora meia cobertura e três quartos; troca −5 no ataque por +10 no dano quando compensa.' },
  mestreEmEscudos: { en: 'Shield Master',
    noJogo: 'De escudo: empurra como ação bônus depois de atacar, soma o escudo à Destreza contra o que mira só ele, e zera a metade do dano que passou na Destreza.' },
  habilidosoPhb: { en: 'Skilled', igualA: 'habilidoso', escolhe: ['pericias'],
    noJogo: 'Treino em três perícias.' },
  furtivo: { en: 'Skulker', requer: minimo('dex', 13),
    noJogo: 'Esconde-se só na penumbra; o tiro que erra não o revela; a penumbra não atrapalha a Percepção dele.' },
  atiradorArcano: { en: 'Spell Sniper', requer: (c) => (conjura(c) ? null : 'pede saber conjurar'), escolhe: ['truqueDeAtaque'],
    noJogo: 'Magia de ataque com o dobro do alcance, sem meia cobertura nem três quartos, e um truque de ataque a mais.' },
  brigaoPhb: { en: 'Tavern Brawler', atributo: ['str', 'con'], igualA: 'brigaoDeTaverna',
    noJogo: '+1 Força ou Constituição; soco de 1d4, sempre treinado; acertando o soco, agarra como ação bônus.' },
  vigoroso: { en: 'Tough', nome: 'Vigoroso',
    noJogo: 'Dois pontos de vida máximos a mais por nível, os de antes inclusive.' },
  conjuradorDeGuerra: { en: 'War Caster', requer: (c) => (conjura(c) ? null : 'pede saber conjurar'),
    noJogo: 'Vantagem para manter a concentração e um truque no lugar do ataque de oportunidade.' },
  mestreEmArmas: { en: 'Weapon Master', atributo: FISICOS, escolhe: ['armas'],
    noJogo: '+1 Força ou Destreza e treino em quatro armas.' },
};

/** Nome e descrição do talento (a tradução); `noJogo` é o que o jogo faz com ele. */
export function infoDoTalentoPhb(id) {
  const t = TALENTOS_PHB[id];
  if (!t) return null;
  const tx = TEXTO_DOS_TALENTOS_PHB[id] ?? {};
  return { id, nome: t.nome ?? tx.nome ?? t.en, desc: tx.desc ?? '', noJogo: t.noJogo };
}

/** Por que o herói NÃO pode tomar o talento agora, ou null. */
export function porqueNaoTalento(c, id) {
  const t = TALENTOS_PHB[id];
  if (!t) return 'talento desconhecido';
  const tem = c.talentos ?? [];
  if (tem.includes(id) && !t.repete) return 'já tem este talento';
  if (t.igualA && tem.includes(t.igualA)) return 'já tem a versão de origem deste talento';
  if (id === 'adeptoElemental' && ELEMENTOS_DO_ADEPTO.every((e) => (c.elementosDoAdepto ?? []).includes(e))) return 'já domina os cinco elementos';
  return t.requer?.(c) ?? null;
}

/** Os talentos que o herói pode tomar neste nível de aumento. */
export const talentosPossiveis = (c) => Object.keys(TALENTOS_PHB).filter((id) => !porqueNaoTalento(c, id));

// ---- as escolhas padrão --------------------------------------------------------------------------------------------------

const PERICIAS_PADRAO = ['percepcao', 'furtividade', 'atletismo', 'intuicao', 'investigacao', 'persuasao', 'acrobacia', 'sobrevivencia',
  'medicina', 'arcanismo', 'enganacao', 'intimidacao', 'historia', 'natureza', 'religiao', 'prestidigitacao', 'lidarComAnimais', 'atuacao'];
const ARMAS_PADRAO = ['espadaLonga', 'rapieira', 'arcoLongo', 'espadaGrande', 'bestaDeMao', 'arcoCurto', 'alabarda', 'marteloDeGuerra',
  'glaive', 'machadoGrande', 'cimitarra', 'espadaCurta', 'bestaPesada', 'bestaLeve', 'lancaCurta', 'maca'];
const MANOBRAS_PADRAO = ['tripAttack', 'precisionAttack', 'riposte', 'pushingAttack', 'menacingAttack', 'parry', 'distractingStrike', 'goadingAttack'];
const TRUQUES_PADRAO = ['raioDeFogo', 'rajadaMistica', 'chamaSagrada', 'toqueChocante', 'raioDeGelo', 'chicoteDeEspinhos', 'zombariaViciosa', 'orientacao'];
const TRUQUES_DE_ATAQUE = ['raioDeFogo', 'rajadaMistica', 'toqueChocante', 'raioDeGelo', 'chicoteDeEspinhos'];
const MAGIA_PADRAO = { mago: 'escudoArcano', feiticeiro: 'misselMagico', bruxo: 'repreensaoInfernal', clerigo: 'curarFerimentos', druida: 'curarFerimentos', bardo: 'palavraCurativa' };
const RITUAIS_PADRAO = ['detectarMagia', 'alarme', 'encontrarFamiliar', 'compreenderIdiomas', 'identificar', 'servoInvisivel', 'falarComAnimais', 'augurio'];

const temRegra = (id) => Boolean(SPELLS[id] && !SPELLS[id].semMotor);
/** As magias de `circulo` que a classe aprende pelo livro e que o jogo faz. */
export function magiasDaClasseParaTalento(classe, circulo) {
  return Object.entries(CLASSES_DAS_MAGIAS_PHB).filter(([id, cl]) => cl.includes(classe) && temRegra(id) && SPELLS[id].level === circulo).map(([id]) => id);
}
const pedeAtaque = (id) => ['attack', 'raios', 'vampirico'].includes(SPELLS[id]?.kind);
const naOrdem = (preferidas, possiveis) => [...preferidas.filter((p) => possiveis.includes(p)), ...possiveis.filter((p) => !preferidas.includes(p))];
const jaConhece = (c) => new Set([...(c.spellcasting?.cantrips ?? []), ...(c.spellcasting?.prepared ?? []), ...(c.spellcasting?.sempreProntas ?? [])]);

/** A classe padrão das magias do talento: a do herói, se ela conjura; senão a do mago. */
const classePadrao = (c) => (CLASSES_DE_MAGIA[c.classe] ? c.classe : 'mago');

/** O que o talento pede além do id, preenchido com o padrão onde faltar. Devolve a escolha completa. */
export function completarEscolhaDoTalento(c, escolha) {
  const e = typeof escolha === 'string' ? { id: escolha } : { ...escolha };
  const t = TALENTOS_PHB[e.id];
  if (!t) return e;
  if (Array.isArray(t.atributo) && !e.atributo) {
    // O +1 que arredonda um atributo ímpar rende um modificador; entre os que rendem, o maior.
    const ok = t.atributo.filter((a) => (c.abilities[a] ?? 10) < 20);
    const impares = ok.filter((a) => (c.abilities[a] ?? 10) % 2 === 1);
    e.atributo = [...(impares.length ? impares : ok)].sort((a, b) => (c.abilities[b] ?? 10) - (c.abilities[a] ?? 10))[0] ?? t.atributo[0];
  }
  if (e.id === 'resiliente' && !escolha.atributo) {
    // A resistência que o herói ainda não tem e mais pesa: Constituição (concentração), Sabedoria, Destreza.
    e.atributo = ['con', 'wis', 'dex', 'str', 'cha', 'int'].find((a) => !(c.saves ?? []).includes(a) && (c.abilities[a] ?? 10) < 20) ?? 'con';
  }
  if (e.id === 'adeptoElemental' && !e.elemento) {
    // O tipo de dano que as magias do herói mais usam.
    const conta = {};
    for (const id of jaConhece(c)) { const tp = SPELLS[id]?.damageType; if (ELEMENTOS_DO_ADEPTO.includes(tp)) conta[tp] = (conta[tp] ?? 0) + 1; }
    const livres = ELEMENTOS_DO_ADEPTO.filter((x) => !(c.elementosDoAdepto ?? []).includes(x));
    e.elemento = livres.sort((a, b) => (conta[b] ?? 0) - (conta[a] ?? 0))[0];
  }
  if (['iniciadoEmMagiaPhb', 'conjuradorDeRituais', 'atiradorArcano'].includes(e.id) && !e.classe) e.classe = classePadrao(c);
  const conhece = jaConhece(c);
  if (e.id === 'iniciadoEmMagiaPhb') {
    const truques = magiasDaClasseParaTalento(e.classe, 0).filter((id) => !conhece.has(id));
    e.truques ??= naOrdem(TRUQUES_PADRAO, truques).slice(0, 2);
    const magias = magiasDaClasseParaTalento(e.classe, 1).filter((id) => !conhece.has(id));
    e.magia ??= naOrdem([MAGIA_PADRAO[e.classe]].filter(Boolean), magias)[0] ?? null;
  }
  if (e.id === 'conjuradorDeRituais') {
    const rituais = magiasDaClasseParaTalento(e.classe, 1).filter((id) => SPELLS[id].ritual);
    e.rituais ??= naOrdem(RITUAIS_PADRAO, rituais).slice(0, 2);
  }
  if (e.id === 'atiradorArcano') {
    const truques = magiasDaClasseParaTalento(e.classe, 0).filter((id) => pedeAtaque(id) && !conhece.has(id));
    e.truque ??= naOrdem(TRUQUES_DE_ATAQUE, truques)[0] ?? null;
  }
  if (e.id === 'habilidosoPhb') e.pericias ??= PERICIAS_PADRAO.filter((s) => !(c.skills ?? []).includes(s)).slice(0, 3);
  if (e.id === 'mestreEmArmas') {
    const treinada = (id) => (c.weaponTraining ?? []).includes(id) || (c.weaponTraining ?? []).includes(WEAPONS[id]?.categoria);
    e.armas ??= naOrdem(ARMAS_PADRAO, Object.keys(WEAPONS).filter((id) => WEAPONS[id]?.categoria && WEAPONS[id].custo !== 0)).filter((id) => !treinada(id)).slice(0, 4);
  }
  if (e.id === 'adeptoMarcial') e.manobras ??= naOrdem(MANOBRAS_PADRAO, MANOBRAS_DO_ADEPTO).filter((m) => !(c.features ?? []).includes(m)).slice(0, 2);
  return e;
}

/** Confere a escolha (vinda da tela): talento possível, sub-escolhas dentro das opções. Lança com o motivo. */
export function validarTalento(c, e) {
  const porque = porqueNaoTalento(c, e.id);
  if (porque) throw new Error(`Talento inválido (${e.id}): ${porque}.`);
  const t = TALENTOS_PHB[e.id];
  if (Array.isArray(t.atributo) && !t.atributo.includes(e.atributo)) throw new Error(`Talento ${e.id}: atributo "${e.atributo}" fora de ${t.atributo.join(', ')}.`);
  if (e.id === 'adeptoElemental' && (!ELEMENTOS_DO_ADEPTO.includes(e.elemento) || (c.elementosDoAdepto ?? []).includes(e.elemento))) {
    throw new Error(`Adepto Elemental: elemento "${e.elemento}" inválido ou repetido.`);
  }
  if (e.classe && !CLASSES_DE_MAGIA[e.classe]) throw new Error(`Talento ${e.id}: classe "${e.classe}" não conjura.`);
  if (e.id === 'adeptoMarcial' && (e.manobras ?? []).some((m) => !MANOBRAS_DO_ADEPTO.includes(m) || (c.features ?? []).includes(m))) {
    throw new Error('Adepto Marcial: manobra inválida ou já conhecida.');
  }
}

// ---- o que o talento põe na ficha ----------------------------------------------------------------------------------------

const somar = (lista, itens) => [...new Set([...(lista ?? []), ...itens])];

/** Garante a conjuração mínima de quem não conjura (o guerreiro com o Iniciado): sem espaço de magia nenhum. */
function conjuracaoMinima(c, atributo) {
  c.spellcasting ??= { ability: atributo, cantrips: [], prepared: [], sempreProntas: [], slots: [0], slotsMax: [0] };
  c.spellcasting.sempreProntas ??= [];
  return c.spellcasting;
}

/**
 * Toma o talento: o +1, o treino, as magias, as manobras. `e` já completa (`completarEscolhaDoTalento`). O que o talento
 * faz depois (na luta, no descanso, na marcha) é lido por `temTalento` onde a regra mora.
 */
export function aplicarTalentoPhb(c, e) {
  const t = TALENTOS_PHB[e.id];
  const sobe = (a) => { c.abilities[a] = Math.min(20, (c.abilities[a] ?? 10) + 1); };
  if (t.atributo && !Array.isArray(t.atributo)) for (const a of Object.keys(t.atributo)) sobe(a);
  else if (e.atributo) sobe(e.atributo);
  c.talentos = somar(c.talentos, [e.id]);
  switch (e.id) {
    case 'armaduraLeve': c.armorTraining = somar(c.armorTraining, ['leve']); break;
    case 'moderadamenteBlindado': c.armorTraining = somar(c.armorTraining, ['média', 'escudo']); break;
    case 'armaduraPesada': c.armorTraining = somar(c.armorTraining, ['pesada']); break;
    case 'resiliente': c.saves = somar(c.saves, [e.atributo]); break;
    case 'habilidosoPhb': c.skills = somar(c.skills, e.pericias ?? []); break;
    case 'mestreEmArmas': c.weaponTraining = somar(c.weaponTraining, e.armas ?? []); break;
    case 'brigaoPhb': c.weapons = somar(c.weapons, ['punhos']); break;
    case 'movel': c.speedFt = (c.speedFt ?? 30) + 10; break;
    case 'adeptoElemental': c.elementosDoAdepto = somar(c.elementosDoAdepto, [e.elemento]); break;
    case 'adeptoMarcial': {
      // As manobras do talento ficam marcadas à parte: a classe não as conta entre as dela (`progressao.js`).
      c.manobrasDoTalento = somar(c.manobrasDoTalento, e.manobras ?? []);
      c.features = somar(c.features, e.manobras ?? []);
      c.dadosDeSuperioridadeDoTalento = (c.dadosDeSuperioridadeDoTalento ?? 0) + 1;
      c.resourcesMax.superiorityDice = (c.resourcesMax.superiorityDice ?? 0) + 1;
      c.resources.superiorityDice = (c.resources.superiorityDice ?? 0) + 1;
      break;
    }
    case 'iniciadoEmMagiaPhb': {
      const sc = conjuracaoMinima(c, CLASSES_DE_MAGIA[e.classe]);
      // Os truques do talento vão para as sempre prontas, e não para os truques da classe: senão a conta dos truques
      // novos de cada nível (`game/nivel.js`) os tomaria por truques da classe e cortaria os próximos.
      sc.sempreProntas = somar(sc.sempreProntas, [...(e.truques ?? []), ...(e.magia ? [e.magia] : [])]);
      if (e.magia) c.magiaGratis = { id: e.magia, usada: false };
      break;
    }
    case 'conjuradorDeRituais': {
      const sc = conjuracaoMinima(c, CLASSES_DE_MAGIA[e.classe]);
      sc.livroDeRituais = somar(sc.livroDeRituais, e.rituais ?? []);
      break;
    }
    case 'atiradorArcano':
      if (e.truque) conjuracaoMinima(c, CLASSES_DE_MAGIA[e.classe]).sempreProntas = somar(c.spellcasting.sempreProntas, [e.truque]);
      break;
    case 'curandeiroPhb':
      // O kit vem junto, como no Curandeiro de origem: sem ele o talento não tem com o que curar.
      c.bag ??= [];
      if (!c.bag.some((b) => b.id === 'kitDeCura')) c.bag.push({ id: 'kitDeCura', tipo: 'item', qtd: 1 });
      break;
    default:
  }
  return e;
}

/** O texto de uma linha do que o talento deu (a tela de subir de nível). */
export function textoDoTalento(c, e) {
  const info = infoDoTalentoPhb(e.id);
  const partes = [];
  if (e.atributo) partes.push(`+1 ${NOME_DO_ATRIBUTO[e.atributo]}`);
  if (e.elemento) partes.push(e.elemento);
  if (e.truques?.length || e.magia) partes.push([...(e.truques ?? []), e.magia].filter(Boolean).map((id) => SPELLS[id]?.name ?? id).join(', '));
  if (e.rituais?.length) partes.push(e.rituais.map((id) => SPELLS[id]?.name ?? id).join(', '));
  if (e.truque) partes.push(SPELLS[e.truque]?.name ?? e.truque);
  if (e.armas?.length) partes.push(e.armas.map((id) => WEAPONS[id]?.name ?? id).join(', '));
  if (e.pericias?.length) partes.push(e.pericias.join(', '));
  if (e.manobras?.length) partes.push(e.manobras.join(', '));
  return `Talento: ${info?.nome ?? e.id}${partes.length ? ` (${partes.join('; ')})` : ''}.`;
}

export { NOME_DO_ATRIBUTO };
