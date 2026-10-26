// Magias FORA do combate: o relógio do jogo, os espaços, a concentração e o que
// cada magia deixa em pé para as conversas e a exploração consultarem.
//
// A IDEIA. Fora da luta não há rodadas: há MINUTOS. O estado do grupo
// (`campanha.utilidade`, ver `estadoDe`) guarda o relógio e a lista de magias
// ATIVAS ({ id, por, alvos, fim… }). Conjurar (`conjurarFora`) gasta o espaço
// de verdade (ou 10 minutos, se for ritual), respeita a concentração (uma por
// conjurador, e a nova derruba a velha) e põe a magia na lista. Quem precisa
// saber o que está valendo pergunta aqui:
//
//   rolarTeste / previsaoDeTeste   testes de perícia com a vantagem, a
//                                  desvantagem e o 1d4 que as magias dão
//   avancar                        o tempo passa; o que venceu se desfaz
//   ativaDe / ativasDoGrupo        o que está de pé agora
//
// As condições de combate (Luz, Visão no Escuro, Orientação, Aprimorar
// Atributo, Passo sem Rastro) continuam sendo condições do herói, para a luta
// as enxergar: aqui só se acrescenta o relógio, que as tira quando vencem.
//
// REGRA DA CASA, dita aqui para não parecer regra do livro: o livro dá a
// Taumaturgia, a Amizade etc. efeitos de cena sem número. Aqui eles viram
// vantagem em testes de perícia nas conversas (ver `UTIL` e `modificadores`).
//
// Texto de jogo (o que o jogador lê ao conjurar) mora em `game/magias-fora.js`;
// aqui só há regra, para dar para testar sem tela.

import { SPELLS, getSpell, magiasProntas, dadosDaMagia } from './spells.js';
import { addCondition, removeCondition, hasCondition, getCondition, conditionEffects, CONDITIONS } from './conditions.js';
import { d20, roll } from '../core/dice.js';
import { skillBonus, SKILLS, SKILL_NAME, saveBonus, spellSaveDc, abilityMod } from './abilities.js';
import { distanceFt } from '../core/grid.js';
import { itemDeId } from './equipment.js';
import { oracaoDeCura, bomFrutoNoDescanso } from './descanso.js';
import { APRIMORAR } from './spells.js';
import { encherAgua, guardarMagico } from './mantimentos.js';
import { garantirInventario } from './equipment.js';

/**
 * O que cada magia faz FORA do combate. Campos:
 *   alvo     'si' | 'aliado' | 'grupo' | 'criatura' (NPC vivo) | 'morto' | 'item'
 *            | 'objeto' (um ponto da cena) | 'area' | 'escolha' (o jogador escolhe o efeito)
 *   min      duração em minutos; conc  concentração
 *   cond     condição de combate que o alvo recebe
 *   efeito   o que a regra de utilidade faz com ela
 *   dialogo  aparece na opção "Conjurar" das conversas
 *   tempo    minutos que a conjuração leva (além da ação)
 */
export const UTIL = {
  // Já existiam no combate: fora dele ganham o relógio.
  luz: { alvo: 'aliado', cond: 'luzMagica', min: 60, umaPorVez: true },
  orientacao: { alvo: 'aliado', cond: 'orientado', min: 1, conc: true, dialogo: true },
  visaoNoEscuro: { alvo: 'aliado', cond: 'visaoNoEscuro', min: 480 },
  passoSemRastro: { alvo: 'grupo', cond: 'semRastro', min: 60, conc: true },
  aprimorarAtributo: { alvo: 'aliado', cond: 'aprimorado', min: 60, conc: true, escolhe: 'atributo', dialogo: true },
  sugestao: { alvo: 'criatura', min: 480, conc: true, efeito: 'sugestao', save: 'wis', dialogo: true },
  enfeiticarPessoa: { alvo: 'criatura', min: 60, efeito: 'enfeiticar', save: 'wis', dialogo: true, soHumanoide: true },
  ilusaoMenor: { alvo: 'area', min: 1, efeito: 'distracao', dialogo: true },
  oracaoDeCura: { alvo: 'grupo', efeito: 'oracao', tempo: 10 },
  bomFruto: { alvo: 'grupo', efeito: 'fruto' },
  // Lote 13.
  taumaturgia: { alvo: 'si', min: 1, efeito: 'taumaturgia', dialogo: true },
  amizade: { alvo: 'criatura', min: 1, conc: true, efeito: 'amizade', dialogo: true, naoHostil: true },
  maoMagica: { alvo: 'objeto', min: 1, efeito: 'mao', gancho: 'alcance' },
  prestidigitacao: { alvo: 'escolha', min: 60, efeito: 'truque' },
  arteDruidica: { alvo: 'escolha', min: 1, efeito: 'truque' },
  consertar: { alvo: 'objeto', efeito: 'consertar', gancho: 'quebrado', tempo: 1 },
  luzesDancantes: { alvo: 'si', cond: 'luzesDancantes', min: 1, conc: true },
  mensagem: { alvo: 'criatura', min: 1, efeito: 'mensagem', alcance: 120 },
  detectarMagia: { alvo: 'area', min: 10, conc: true, efeito: 'detectarMagia', ritual: true },
  identificar: { alvo: 'item', efeito: 'identificar', tempo: 1, ritual: true },
  compreenderIdiomas: { alvo: 'si', min: 60, efeito: 'idiomas', ritual: true, dialogo: true },
  disfarcarSe: { alvo: 'si', min: 60, efeito: 'disfarce', dialogo: true },
  falarComAnimais: { alvo: 'si', min: 10, efeito: 'animais', ritual: true, dialogo: true },
  abrir: { alvo: 'objeto', efeito: 'abrir', gancho: 'trancada' },
  detectarPensamentos: { alvo: 'area', min: 1, conc: true, efeito: 'pensamentos', dialogo: true },
  verOInvisivel: { alvo: 'si', min: 60, efeito: 'verInvisivel' },
  falarComOsMortos: { alvo: 'morto', min: 10, efeito: 'mortos' },
  // Lote 14.
  salto: { alvo: 'aliado', cond: 'saltoTriplo', min: 1 },
  alarme: { alvo: 'area', min: 480, efeito: 'alarme', ritual: true },
  detectarBemMal: { alvo: 'area', min: 10, conc: true, efeito: 'detectarBemMal' },
  encontrarArmadilhas: { alvo: 'area', efeito: 'armadilhas', gancho: 'armadilha' },
  zonaDaVerdade: { alvo: 'criatura', min: 10, efeito: 'zona', save: 'cha', dialogo: true, alcance: 60 },
  localizarObjeto: { alvo: 'objeto', min: 10, conc: true, efeito: 'localizar', gancho: 'procurado' },
  linguas: { alvo: 'si', min: 60, efeito: 'idiomas', dialogo: true },
  alterarAparencia: { alvo: 'si', min: 60, conc: true, efeito: 'disfarce', dialogo: true },
  cativar: { alvo: 'area', min: 1, efeito: 'cativar', save: 'wis', dialogo: true },
  amizadeAnimal: { alvo: 'feras', min: 1440, efeito: 'amizadeAnimal', save: 'wis' },
  sentidosDaFera: { alvo: 'bicho', min: 60, conc: true, efeito: 'sentidos', ritual: true },
  fingirDeMorto: { alvo: 'aliado', cond: 'fingeMorto', min: 60, ritual: true },
  falarComPlantas: { alvo: 'si', min: 10, efeito: 'plantas' },
  encontrarFamiliar: { alvo: 'escolha', efeito: 'familiar', ritual: true },
  // Montaria e travessia (`rules/marcha.js`, `core/grid.js`).
  encontrarMontaria: { alvo: 'si', min: 10 * 365 * 24 * 60, efeito: 'montaria', tempo: 10 },
  montariaFantasmagorica: { alvo: 'si', min: 60, efeito: 'montaria', ritual: true, tempo: 1 },
  andarNaAgua: { alvo: 'grupo', cond: 'naAgua', min: 60, ritual: true },
  respirarNaAgua: { alvo: 'grupo', min: 1440, efeito: 'respirar', ritual: true },
  fundirSeComPedra: { alvo: 'si', cond: 'naPedra', min: 480, efeito: 'pedra', ritual: true },
  // Adivinhação e serviçais.
  escritaIlusoria: { alvo: 'si', min: 14400, efeito: 'escrita', ritual: true, tempo: 1 },
  discoFlutuante: { alvo: 'si', min: 60, efeito: 'disco', ritual: true },
  servoInvisivel: { alvo: 'objeto', min: 60, efeito: 'servo', gancho: 'alcance', ritual: true, alcance: 60 },
  // A resposta do Augúrio vale a meia hora sobre a qual ele perguntou: sem
  // duração a magia nunca entraria na lista de ativas e ninguém a leria.
  augurio: { alvo: 'si', min: 30, efeito: 'augurio', ritual: true, tempo: 1 },
  // A Boca Mágica fica até disparar: como a Chama Contínua, precisa de uma
  // duração longa para o motor a registrar como ativa.
  bocaMagica: { alvo: 'area', min: 10 * 365 * 24 * 60, efeito: 'boca', ritual: true, tempo: 1 },
  auraMagicaDoArcanista: { alvo: 'aliado', min: 1440, efeito: 'aura', escolhe: 'tipo' },
  mensageiroAnimal: { alvo: 'si', min: 1440, efeito: 'mensageiro', ritual: true },
  indetectavel: { alvo: 'aliado', min: 480, efeito: 'semDeteccao' },
  // Abrigo da noite (`rules/acampamento.js`).
  truqueDaCorda: { alvo: 'si', min: 60, efeito: 'corda' },
  // A chama não acaba: dez anos de duração é o jeito de dizer "até ser
  // dissipada" num motor que conta minutos. Sem duração ela nunca entrava
  // na lista de magias ativas, e o acampamento nunca a via.
  chamaContinua: { alvo: 'si', min: 10 * 365 * 24 * 60, efeito: 'chama' },
  repousoTranquilo: { alvo: 'morto', min: 14400, efeito: 'repouso', ritual: true },
  pequenaCabana: { alvo: 'si', min: 480, efeito: 'cabana', ritual: true, tempo: 1 },
  // Mantimentos de viagem (`rules/mantimentos.js`).
  criarDestruirAgua: { alvo: 'si', efeito: 'agua' },
  criarComidaEAgua: { alvo: 'si', efeito: 'banquete' },
  purificarAlimentos: { alvo: 'si', efeito: 'purificar', ritual: true },
  detectarVenenoDoenca: { alvo: 'area', min: 10, conc: true, efeito: 'venenos', ritual: true },
  localizarAnimaisPlantas: { alvo: 'si', min: 1, efeito: 'caca', ritual: true },
};

/** Os bichos que Convocar Familiar chama: a ficha mora em `monsters/feras.js`. */
export const FAMILIARES = {
  rato: { defId: 'ratoFamiliar', nome: 'Rato', maxHp: 1 },
  morcego: { defId: 'morcegoFamiliar', nome: 'Morcego', maxHp: 1 },
};
/** Tipos que Detectar o Bem e o Mal sente, e de que lado da balança cada um cai. */
export const TIPOS_BEM_MAL = {
  celestial: 'bem', elemental: 'neutro', 'feérico': 'neutro', fada: 'neutro',
  corruptor: 'mal', 'morto-vivo': 'mal', 'aberração': 'mal', aberracao: 'mal',
};
/** Quantos pés vale o "9 m" do Detectar o Bem e o Mal. */
export const ALCANCE_BEM_MAL = 30;
/** Raio, em pés, em que o Alarme avisa (a cena inteira do acampamento). */
export const RAIO_DO_ALARME = 60;

/** Os ids das magias que têm uso fora do combate. */
export const UTIL_FORA = new Set(Object.keys(UTIL));

/** Classes que conjuram ritual (Livro do Jogador). */
const CLASSES_DE_RITUAL = new Set(['bardo', 'clerigo', 'druida', 'mago']);

export const estaFora = (id) => UTIL_FORA.has(id);

// -------------------------------------------------------------- estado ----

/** O estado do grupo, guardado na campanha. */
export function estadoDe(campanha) {
  const e = (campanha.utilidade ??= { minutos: 0, ativas: [], npcs: {}, identificados: [], mortosFalados: [], serial: 0 });
  // O dia da campanha mora na vila; a despensa mágica precisa dele para saber
  // o que foi conjurado HOJE e o que estragou ontem (`rules/mantimentos.js`).
  e.dia = campanha.vila?.dia ?? e.dia ?? 0;
  return e;
}

/** Tem veneno no bloco: morde ou pica com dano de veneno (`monsters/*.js`). */
export function eVenenosa(m) {
  return (m?.attacks ?? []).some((a) => a?.type === 'veneno'
    || a?.extraDamage?.type === 'veneno'
    || (a?.extras ?? []).some((e) => e?.type === 'veneno'));
}

/** A chave de um NPC (criatura ou personagem solto da vila). */
export const chaveDoNpc = (npc) => npc?.id ?? npc?.defId ?? npc?.name ?? null;

/** Texto de um horário: "2h10" desde o começo da cena. */
export const relogioTexto = (estado) => {
  const m = Math.floor(estado.minutos);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`;
};

function heroiPorId(herois, id) { return herois.find((h) => h.id === id) ?? null; }

/** A magia ainda está de pé? (condição tirada, concentração perdida na luta etc.) */
function viva(estado, a, herois) {
  if (a.fim <= estado.minutos) return false;
  const dono = heroiPorId(herois, a.por);
  if (a.conc) {
    if (!dono || dono.dead || dono.hp <= 0) return false;
    if (dono.concentrating?.ativaId !== a.n) return false;
  }
  if (a.cond) {
    const alvos = a.alvos.map((id) => heroiPorId(herois, id)).filter(Boolean);
    if (alvos.length && !alvos.some((t) => hasCondition(t, a.cond))) return false;
  }
  return true;
}

/** As magias ativas agora (as vencidas já saem e são desfeitas). */
export function ativasDoGrupo(estado, herois) {
  const fora = estado.ativas.filter((a) => !viva(estado, a, herois));
  for (const a of fora) encerrar(estado, a, herois);
  return estado.ativas;
}

/** A magia ativa de um id, filtrada por conjurador, NPC ou alvo. */
export function ativaDe(estado, herois, spellId, { por = null, npc = null, alvo = null } = {}) {
  return ativasDoGrupo(estado, herois).find((a) => a.spellId === spellId
    && (!por || a.por === (por.id ?? por))
    && (!npc || a.npc === chaveDoNpc(npc))
    && (!alvo || a.alvos.includes(alvo.id ?? alvo))) ?? null;
}

/** Desfaz uma magia ativa: condições, concentração e o que ela deixa para trás. */
export function encerrar(estado, a, herois, { texto = null } = {}) {
  // Repouso Tranquilo: passados os dez dias, o corpo volta a ser um corpo.
  if (a.spellId === 'repousoTranquilo' && a.corpo) delete a.corpo.repousoTranquilo;
  // Montaria: o corcel desaparece, e a estrada volta a ser andada a pé.
  if ((a.spellId === 'encontrarMontaria' || a.spellId === 'montariaFantasmagorica')
    && !estado.ativas.some((x) => x !== a && (x.spellId === 'encontrarMontaria' || x.spellId === 'montariaFantasmagorica'))) {
    delete estado.montaria;
  }
  // Aura Mágica do Arcanista e Indetectável: a criatura volta a ser o que é, e a ser vista.
  // Só se não houver OUTRA conjuração viva na mesma criatura: conjurar de novo
  // antes de a primeira acabar não pode apagar a segunda quando a primeira
  // vence. `outraViva` é essa checagem.
  const outraViva = (quem) => estado.ativas.some((x) => x !== a && x.spellId === a.spellId && x.quem === quem);
  if (a.spellId === 'auraMagicaDoArcanista' && a.quem && !outraViva(a.quem)) delete a.quem.auraMagica;
  if (a.spellId === 'indetectavel' && a.quem && !outraViva(a.quem)) delete a.quem.semDeteccao;
  estado.ativas = estado.ativas.filter((x) => x !== a);
  const dono = heroiPorId(herois, a.por);
  for (const id of a.alvos) {
    const t = heroiPorId(herois, id);
    if (t && a.cond && hasCondition(t, a.cond)) {
      // Aprimorar Atributo (Urso): os PV temporários vão junto.
      const pv = getCondition(t, a.cond)?.data?.pvTemp ?? 0;
      if (pv && (t.tempHp ?? 0) <= pv) t.tempHp = 0;
      removeCondition(t, a.cond);
    }
  }
  if (dono?.concentrating?.ativaId === a.n) dono.concentrating = null;
  // Cativar solta os cativos; Amizade Animal devolve a fera ao lado de onde veio.
  for (const m of a.criaturas ?? []) {
    if (a.efeito === 'cativar') removeCondition(m, 'cativado');
    if (a.efeito === 'amizadeAnimal' && m.amizadeAnimal && !m.dead) { m.side = 'foes'; delete m.amizadeAnimal; }
  }
  // Amizade e Enfeitiçar Pessoa: quem foi influenciado percebe, e não perdoa.
  if ((a.efeito === 'amizade' || a.efeito === 'enfeiticar') && a.npc) {
    const n = (estado.npcs[a.npc] ??= {});
    n.ressentido = a.efeito === 'amizade' ? 'hostil' : 'ciente';
  }
  estado.ultimoFim = texto;
  return a;
}

/**
 * O tempo passa. Devolve as frases do que acabou (para o registro da cena).
 * `herois` são os do grupo, para tirar as condições deles.
 */
export function avancar(estado, minutos, herois) {
  const frases = [];
  const antes = estado.ativas.slice();
  estado.minutos += minutos;
  // Tempo passa também para as condições de combate dos heróis (rodadas).
  const rodadas = Math.round(minutos * 10);
  for (const h of herois) {
    for (const c of h.conditions ?? []) {
      if (c.magia && Number.isFinite(c.rounds)) c.rounds = Math.max(1, c.rounds - rodadas);
    }
  }
  for (const a of antes) {
    if (!viva(estado, a, herois)) {
      encerrar(estado, a, herois);
      frases.push(`${a.nome} termina.`);
    }
  }
  return frases;
}

// ------------------------------------------------------------ conjurar ----

/** O herói pode conjurar isto fora do combate? `ritual` pede o ritual (sem espaço). */
export function podeConjurarFora(c, spellId, { circulo = null, ritual = false } = {}) {
  const spell = SPELLS[spellId];
  const u = UTIL[spellId];
  if (!spell || !u) return { ok: false, why: 'esta magia não tem uso fora do combate' };
  if (!c.spellcasting) return { ok: false, why: 'não conjura magias' };
  if (c.dead || c.hp <= 0) return { ok: false, why: 'quem está caído não conjura' };
  if (conditionEffects(c).incapacitated) return { ok: false, why: 'incapacitado não conjura' };
  if (c.armorUntrained) return { ok: false, why: 'armadura sem treino impede conjurar' };
  // Só o mago conjura ritual sem preparar (do grimório); bardo, druida e clérigo só o que têm pronto.
  const deRitual = c.classe === 'mago' && (c.spellcasting.rituais?.includes(spellId) || c.spellcasting.livro?.includes(spellId));
  if (!magiasProntas(c).includes(spellId) && !(ritual && deRitual)) return { ok: false, why: `${spell.name} não está preparada` };
  if (ritual) {
    if (!spell.ritual) return { ok: false, why: `${spell.name} não é ritual` };
    if (!CLASSES_DE_RITUAL.has(c.classe)) return { ok: false, why: 'esta classe não conjura ritual' };
    return { ok: true, spell, circulo: spell.level, ritual: true };
  }
  if (spell.level === 0) return { ok: true, spell, circulo: 0 };
  const slots = c.spellcasting.slots ?? [];
  let usa = null;
  if (circulo != null) usa = circulo >= spell.level && slots[circulo] > 0 ? circulo : null;
  else for (let n = spell.level; n < slots.length; n++) if (slots[n] > 0) { usa = n; break; }
  if (usa == null) return { ok: false, why: `sem espaço de ${spell.level}º círculo ou maior` };
  return { ok: true, spell, circulo: usa };
}

/**
 * Larga a concentração de uma magia de COMBATE (Bênção, teia…) quando o herói
 * se concentra em outra coisa fora da luta. Com o encontro (`enc`), usa a regra
 * do combate inteira (zona, aura, queda do voo); sem ele, tira a condição dos alvos.
 */
function soltarConcentracao(c, enc) {
  const conc = c.concentrating;
  if (!conc) return;
  if (enc?.dropConcentration) { enc.dropConcentration(c); return; }
  for (const t of conc.targets ?? []) {
    if (!conc.condition) continue;
    const pv = ['heroico', 'aprimorado'].includes(conc.condition) ? getCondition(t, conc.condition)?.data?.pvTemp ?? 0 : 0;
    if (pv && (t.tempHp ?? 0) <= pv) t.tempHp = 0;
    removeCondition(t, conc.condition);
  }
  c.concentrating = null;
}

/** Os minutos que a conjuração leva. */
export function tempoDeConjuracao(spellId, { ritual = false } = {}) {
  const u = UTIL[spellId];
  const s = SPELLS[spellId];
  return (u?.tempo ?? s?.minutos ?? 0) + (ritual ? 10 : 0);
}

/** Corpos que não respondem a Falar com os Mortos (sem língua ou sem boca). */
export const SEM_VOZ = new Set(['lobo', 'loboAtroz', 'ratoGigante', 'aranhaGigante', 'morcegoGigante', 'esqueleto', 'zumbi', 'javali', 'ursoPardo']);
/** 10 dias em minutos: Falar com os Mortos não repete no mesmo corpo antes disso. */
export const DEZ_DIAS = 14400;
/** Corpo que não responde: morto-vivo (já não tem alma para chamar) ou sem boca. */
export function motivoDeMortoMudo(corpo) {
  if (corpo.tipo === 'morto-vivo') return 'um morto-vivo não responde: não há alma para chamar';
  if (SEM_VOZ.has(corpo.defId) || corpo.semBoca) return 'o corpo não tem boca: não há como falar';
  return null;
}
/** Imune a enfeitiçado (bloco ou magia): o encanto nem tenta. */
const imuneAEncanto = (m) => (m.conditionImmunities ?? []).some((i) => i === 'enfeitiçado' || i === 'enfeiticado')
  || (m.conditions ?? []).some((k) => CONDITIONS[k.id]?.imuneA?.includes('enfeiticado'));
const humanoide = (npc) => (npc.tipo ?? 'humanoide') === 'humanoide';
/** Um NPC solto da vila não tem ficha: vale como alguém comum (todos os atributos 10). */
const comFicha = (npc) => (npc.abilities ? npc : { ...npc, abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 } });

/**
 * Conjura `spellId` fora do combate. Gasta o espaço (ou os 10 minutos do
 * ritual), faz o tempo passar, derruba a concentração anterior e registra a
 * magia. Devolve { ok, why } ou { ok, spell, circulo, ritual, ativa, resultado,
 * fim: [frases do que acabou enquanto isso] }.
 *
 *   herois   o grupo (obrigatório)        rng   para os dados
 *   alvo     herói, NPC ou item (id) conforme a magia
 *   opcao    o efeito escolhido (Prestidigitação, Aprimorar Atributo)
 */
export function conjurarFora(estado, c, spellId, { herois, rng, circulo = null, ritual = false, alvo = null, opcao = null, ponto = null, enc = null, criaturas = [], dados = null } = {}) {
  const chk = podeConjurarFora(c, spellId, { circulo, ritual });
  if (!chk.ok) return chk;
  const { spell } = chk;
  const u = UTIL[spellId];
  const grupo = herois ?? [c];

  // Antes de gastar nada: o alvo serve?
  if (u.alvo === 'criatura') {
    if (!alvo) return { ok: false, why: 'escolha uma criatura' };
    if (alvo.dead) return { ok: false, why: 'ele está morto' };
    if (u.soHumanoide && !humanoide(alvo)) return { ok: false, why: `${spell.name} só pega humanoides` };
    if (u.naoHostil && estado.npcs[chaveDoNpc(alvo)]?.ressentido === 'hostil') return { ok: false, why: 'ele já está hostil com vocês: não cai de novo' };
    if (u.naoHostil && (alvo.side === 'foes' && alvo.emLuta)) return { ok: false, why: 'ele está em luta contra vocês' };
    if (u.alcance == null && c.pos && alvo.pos && distanceFt(c.pos, alvo.pos) > spell.rangeFt) return { ok: false, why: `longe demais — ${spell.name} alcança ${spell.rangeFt} pés` };
    if (u.alcance != null && c.pos && alvo.pos && distanceFt(c.pos, alvo.pos) > u.alcance) return { ok: false, why: `longe demais — ${spell.name} alcança ${u.alcance} pés` };
  }
  if (u.alvo === 'bicho') {
    if (!alvo) return { ok: false, why: 'escolha um bicho' };
    if (alvo.dead || (alvo.tipo !== 'fera' && !alvo.familiar)) return { ok: false, why: 'precisa de uma fera disposta' };
    if (alvo.side === 'foes') return { ok: false, why: 'a fera tem de estar disposta (do seu lado ou neutra)' };
  }
  if (u.alvo === 'feras') {
    const bons = criaturas.filter(eFeraAmansavel);
    if (!bons.length) return { ok: false, why: 'nenhuma fera ao alcance (Inteligência 3 ou menos)' };
  }
  if (u.alvo === 'aliado' && !alvo) alvo = c;
  if (u.alvo === 'aliado' && (alvo.dead || alvo.side !== 'party')) return { ok: false, why: 'só em aliado' };
  if (u.alvo === 'item' && !alvo) return { ok: false, why: 'escolha um item' };
  if (u.alvo === 'morto') {
    if (!alvo?.dead) return { ok: false, why: 'precisa de um cadáver' };
    const motivoMorto = motivoDeMortoMudo(alvo);
    if (motivoMorto) return { ok: false, why: motivoMorto };
    const antigo = estado.mortosFalados.find((m) => (m.id ?? m) === chaveDoNpc(alvo));
    if (antigo && (typeof antigo === 'string' || estado.minutos - antigo.minutos < DEZ_DIAS)) return { ok: false, why: 'este corpo já falou: a magia falha nos 10 dias seguintes' };
    if (c.pos && alvo.pos && distanceFt(c.pos, alvo.pos) > spell.rangeFt) return { ok: false, why: `longe demais — ${spell.name} alcança ${spell.rangeFt} pés` };
  }
  if (u.escolhe === 'atributo' && opcao && !APRIMORAR[opcao]) return { ok: false, why: 'opção inválida' };

  const fim = [];
  // A Oração de Cura e o Bom Fruto já têm a conta feita em `descanso.js`.
  if (u.efeito === 'oracao' || u.efeito === 'fruto') {
    const vivos = grupo.filter((h) => !h.dead);
    const alvos = u.efeito === 'oracao' ? vivos.slice(0, 6) : vivos;
    const r = u.efeito === 'oracao'
      ? oracaoDeCura(rng, c, alvos, { circulo: chk.circulo })
      : bomFrutoNoDescanso(c, alvos, { circulo: chk.circulo });
    if (!r.ok) return r;
    fim.push(...avancar(estado, tempoDeConjuracao(spellId), grupo));
    return { ok: true, spell, circulo: r.circulo, ritual: false, ativa: null, resultado: { tipo: u.efeito, curas: r.curas }, fim };
  }

  // Gasta.
  if (!chk.ritual && spell.level > 0) c.spellcasting.slots[chk.circulo] -= 1;
  fim.push(...avancar(estado, tempoDeConjuracao(spellId, { ritual: chk.ritual }), grupo));

  const resultado = { tipo: u.efeito ?? (u.cond ? 'condicao' : 'nada') };
  const duracao = u.min ?? spell.duracaoMin ?? 0;

  // Uma concentração por vez.
  if (u.conc) {
    const velha = estado.ativas.find((a) => a.por === c.id && a.conc);
    if (velha) { encerrar(estado, velha, grupo); fim.push(`${velha.nome} termina: ${c.name} se concentra em outra coisa.`); }
    if (c.concentrating && !velha) soltarConcentracao(c, enc);
  }

  // Resistência da criatura (Sugestão, Enfeitiçar Pessoa).
  if (u.save && alvo) {
    const dc = spellSaveDc(c);
    const r = d20(rng, saveBonus(comFicha(alvo), u.save));
    resultado.dc = dc;
    resultado.resistencia = { total: r.total, natural: r.natural };
    resultado.resistiu = r.total >= dc;
  }
  // Truques de escolha.
  if (u.alvo === 'escolha') resultado.opcao = opcao;

  let alvosIds = [];
  const aplicados = [];
  const afetadas = [];
  if (!resultado.resistiu) {
    if (u.cond) {
      let alvos = [];
      if (u.alvo === 'grupo') alvos = grupo.filter((h) => !h.dead && h.hp > 0 && (!h.pos || !c.pos || distanceFt(c.pos, h.pos) <= (spell.raioFt ?? 30)));
      else if (u.alvo === 'si') alvos = [c];
      else alvos = [alvo];
      // Luz: uma por vez (conjurar de novo passa a luz).
      if (u.umaPorVez) {
        for (const a of estado.ativas.filter((x) => x.spellId === spellId && x.por === c.id)) encerrar(estado, a, grupo);
      }
      const rounds = Math.max(1, Math.round(duracao * 10));
      for (const t of alvos) {
        let data = null;
        if (u.escolhe === 'atributo') {
          const o = APRIMORAR[opcao ?? 'urso'];
          data = { hab: o.hab, opcao: opcao ?? 'urso', pvTemp: 0 };
          if (o.pv) {
            const pv = roll(rng, o.pv).total;
            t.tempHp = Math.max(t.tempHp ?? 0, pv);
            data.pvTemp = pv;
          }
        }
        addCondition(t, u.cond, { rounds, source: c.id, data, magia: { id: spellId, circulo: chk.circulo } });
        aplicados.push(t);
      }
      alvosIds = alvos.map((t) => t.id);
      resultado.alvos = alvos;
      if (u.escolhe === 'atributo') resultado.opcao = opcao ?? 'urso';
    } else if (u.alvo === 'si') alvosIds = [c.id];
    else if (u.alvo === 'aliado' && alvo) alvosIds = [alvo.id];
    // Os efeitos próprios.
    if (u.efeito === 'detectarMagia') {
      resultado.mochila = grupo.flatMap((h) => garantirInventario(h).bag.filter((i) => i.qtd > 0 && auraDe(i.id)).map((i) => ({ dono: h, id: i.id, ...auraDe(i.id) })));
    }
    if (u.efeito === 'identificar') {
      resultado.item = alvo;
      if (!estado.identificados.includes(alvo.id ?? alvo)) estado.identificados.push(alvo.id ?? alvo);
      resultado.info = infoDoItem(alvo.id ?? alvo);
    }
    if (u.efeito === 'mortos') {
      estado.mortosFalados = estado.mortosFalados.filter((m) => (m.id ?? m) !== chaveDoNpc(alvo));
      estado.mortosFalados.push({ id: chaveDoNpc(alvo), minutos: estado.minutos });
      resultado.corpo = alvo;
    }
    if (u.efeito === 'truque') resultado.truque = truque(estado, c, spellId, opcao, alvo, rng);
    // ---- mantimentos: a água e a comida que a magia faz ----
    // Entram na despensa do grupo (`rules/mantimentos.js`), que estraga no
    // fim do dia; a água também enche os cantis na hora, porque o cantil
    // guarda de um dia para o outro e a água conjurada não.
    if (u.efeito === 'agua' || u.efeito === 'banquete') {
      const litros = (spell.agua ?? 0) + (spell.upcast?.agua ?? 0) * (chk.circulo - spell.level);
      const racoes = spell.racoes ?? 0;
      let nosCantis = 0;
      for (const h of grupo.filter((x) => !x.dead)) nosCantis += encherAgua(h, Math.max(0, litros - nosCantis));
      const sobra = Math.max(0, litros - nosCantis);
      const entrada = guardarMagico(estado, { racoes, litros: sobra, nome: spell.name, dia: estado.dia ?? 0 });
      resultado.mantimentos = { racoes, litros, nosCantis, sobra, entrada };
    }
    if (u.efeito === 'purificar') {
      const estragados = grupo.flatMap((h) => garantirInventario(h).bag.filter((i) => i.id === 'racoes' && i.estragada));
      for (const i of estragados) delete i.estragada;
      // O livro purifica COMIDA E BEBIDA, não criaturas: só sai o mal que veio
      // da água parada (`maldaAgua`, de `rules/mantimentos.js`). Veneno de
      // lâmina ou de mordida continua onde está.
      const envenenados = grupo.filter((h) => !h.dead && h.maldaAgua && hasCondition(h, 'envenenado'));
      for (const h of envenenados) { removeCondition(h, 'envenenado'); h.maldaAgua = false; }
      resultado.purificou = { racoes: estragados.reduce((n, i) => n + (i.qtd ?? 0), 0), gente: envenenados };
    }
    if (u.efeito === 'venenos') {
      resultado.venenos = {
        mochila: grupo.flatMap((h) => garantirInventario(h).bag.filter((i) => i.estragada).map((i) => ({ dono: h, id: i.id }))),
        gente: grupo.filter((h) => !h.dead && hasCondition(h, 'envenenado')),
        // Venenosa é quem tem dano de veneno no bloco (`monsters/*.js`): a
        // aranha e a aranha-lobo mordem com veneno em `extraDamage`.
        criaturas: criaturas.filter((m) => !m.dead && eVenenosa(m)),
      };
    }
    // ---- montaria e travessia ----
    if (u.efeito === 'montaria') {
      // Qual corcel: o conjurado do paladino, que fica, ou o fantasma do mago,
      // que vale uma hora. `rules/marcha.js` lê isto para o dia de estrada.
      const qual = spellId === 'encontrarMontaria' ? 'corcel' : 'fantasma';
      estado.montaria = qual;
      resultado.montaria = qual;
    }
    if (u.efeito === 'respirar') {
      // O jogo não afoga ninguém: a magia gasta o espaço e o tempo e narra.
      resultado.respirar = grupo.filter((h) => !h.dead).slice(0, 10);
      resultado.soNarra = true;
    }
    if (u.efeito === 'pedra') resultado.pedra = c;
    // ---- adivinhação e serviçais ----
    if (u.efeito === 'aura') {
      // A Aura Mágica troca o tipo que a adivinhação lê, não o tipo de verdade.
      const quem = alvo ?? c;
      quem.auraMagica = opcao ?? 'celestial';
      resultado.aura = { quem, tipo: quem.auraMagica };
    }
    if (u.efeito === 'semDeteccao') {
      const quem = alvo ?? c;
      quem.semDeteccao = true;
      resultado.escondido = quem;
    }
    // O Servo Invisível alcança pontos da cena a 18 m (`gancho: 'alcance'`) e a
    // Boca Mágica planta um aviso que `alarmeCobre` lê. O Disco, a Escrita e o
    // Mensageiro Animal ainda não têm o que mover, o que ler nem a quem
    // entregar: gastam espaço e tempo, e o jogo só os narra.
    if (u.efeito === 'disco' || u.efeito === 'servo' || u.efeito === 'escrita'
      || u.efeito === 'boca' || u.efeito === 'mensageiro') {
      resultado.servico = u.efeito;
      resultado.soNarra = u.efeito === 'disco' || u.efeito === 'escrita' || u.efeito === 'mensageiro';
    }
    // ---- abrigo: o que a noite vai perguntar depois ----
    if (u.efeito === 'repouso') {
      // O corpo guardado não apodrece e não serve para Animar os Mortos.
      if (alvo) { alvo.repousoTranquilo = true; resultado.corpo = alvo; }
    }
    if (u.efeito === 'cabana' || u.efeito === 'corda' || u.efeito === 'chama') resultado.abrigo = u.efeito;
    if (u.efeito === 'caca') {
      // A magia é instantânea no livro: ela diz onde está a caça AGORA. No
      // jogo isso vira a vantagem na forragem DESTE dia, e só dele.
      estado.cacaNoDia = estado.dia ?? 0;
      resultado.caca = true;
    }
    if (u.efeito === 'amizadeAnimal') {
      // Uma fera por círculo (1º círculo = 1, 2º = 2…); cada uma resiste por SABEDORIA.
      const dc = spellSaveDc(c);
      const limite = chk.circulo - spell.level + 1;
      resultado.dc = dc;
      resultado.feras = criaturas.filter(eFeraAmansavel).slice(0, limite).map((m) => {
        if (imuneAEncanto(m)) return { m, total: null, resistiu: true, imune: true };
        if (c.pos && m.pos && distanceFt(c.pos, m.pos) > spell.rangeFt) return { m, total: null, resistiu: true, longe: true };
        const r = d20(rng, saveBonus(comFicha(m), 'wis'));
        const resistiu = r.total >= dc;
        if (!resistiu) { m.side = 'neutro'; m.amizadeAnimal = c.id; afetadas.push(m); }
        return { m, total: r.total, resistiu };
      });
      resultado.resistiu = afetadas.length === 0;
    }
    if (u.efeito === 'cativar') {
      // Quem ouve e vê, menos os do grupo: SABEDORIA ou só tem olhos para o conjurador.
      const dc = spellSaveDc(c);
      resultado.dc = dc;
      resultado.cativos = criaturas.filter((m) => !m.dead && m.hp > 0 && m.side !== 'party'
        && !(c.pos && m.pos && distanceFt(c.pos, m.pos) > spell.rangeFt)).map((m) => {
        if (imuneAEncanto(m)) return { m, total: null, resistiu: true, imune: true };
        const r = d20(rng, saveBonus(comFicha(m), 'wis'));
        const resistiu = r.total >= dc;
        if (!resistiu) { addCondition(m, 'cativado', { rounds: Infinity, source: c.id }); afetadas.push(m); }
        return { m, total: r.total, resistiu };
      });
      resultado.resistiu = afetadas.length === 0;
    }
    if (u.efeito === 'familiar') {
      const f = FAMILIARES[opcao] ?? FAMILIARES.rato;
      estado.familiar = { defId: f.defId, opcao: opcao in FAMILIARES ? opcao : 'rato', nome: f.nome, dono: c.id, hp: f.maxHp, maxHp: f.maxHp };
      resultado.familiar = estado.familiar;
    }
  } else {
    // Resistiu: pelo livro, a Enfeitiçar Pessoa não deixa marca; ele só sabe quando a magia acaba (ver `encerrar`).
  }

  let ativa = null;
  if (duracao > 0 && !resultado.resistiu) {
    ativa = {
      n: ++estado.serial, spellId, nome: spell.name, por: c.id, circulo: chk.circulo, ritual: chk.ritual,
      inicio: estado.minutos, fim: estado.minutos + duracao, conc: Boolean(u.conc),
      alvos: alvosIds, npc: u.alvo === 'criatura' || u.alvo === 'morto' ? chaveDoNpc(alvo) : null,
      cond: u.cond ?? null, efeito: u.efeito ?? null,
      data: opcao || dados ? { ...(opcao ? { opcao } : {}), ...(dados ?? {}) } : null,
    };
    // As criaturas afetadas (Cativar, Amizade Animal) ficam fora do JSON da campanha.
    if (afetadas.length) Object.defineProperty(ativa, 'criaturas', { value: afetadas, enumerable: false, writable: true });
    if (u.alvo === 'bicho' && alvo) ativa.data = { ...(ativa.data ?? {}), bicho: alvo.id };
    // Repouso Tranquilo: a magia guarda o corpo para poder devolvê-lo ao fim
    // dos dez dias. Fora do JSON da campanha, como as outras criaturas.
    if (u.efeito === 'repouso' && alvo) Object.defineProperty(ativa, 'corpo', { value: alvo, enumerable: false, writable: true });
    // Aura Mágica do Arcanista e Indetectável guardam em quem pousaram, para desfazer no fim.
    if (u.efeito === 'aura' || u.efeito === 'semDeteccao') {
      Object.defineProperty(ativa, 'quem', { value: alvo ?? c, enumerable: false, writable: true });
    }
    estado.ativas.push(ativa);
    if (u.conc) {
      c.concentrating = { spellId, condition: u.cond ?? null, targets: aplicados, rounds: duracao * 10, ativaId: ativa.n, fora: true };
    }
  }
  return { ok: true, spell, circulo: chk.circulo, ritual: chk.ritual, ativa, resultado, fim };
}


// -------------------------------------------------- objetos e truques ----

/** A escola e o aviso de um item mágico da mochila (Detectar Magia). */
export function auraDe(itemId) {
  const it = itemDeId(itemId)?.dados;
  if (!it) return null;
  const magico = it.tipo === 'mágico' || Boolean(it.raridade) || (/pergaminho|poção|pocao/i.test(`${it.id} ${it.name}`) && it.tipo !== 'tesouro');
  if (!magico) return null;
  const escola = ESCOLA_DO_ITEM[itemId] ?? (/pocao|poção/i.test(`${it.id} ${it.name}`) ? 'transmutação' : /pergaminho/i.test(it.id) ? 'adivinhação' : 'aura fraca');
  return { escola, nome: it.name };
}

// Só o que o jogo dá hoje e a escola não é óbvia pelo nome.
const ESCOLA_DO_ITEM = {
  pocaoDeCura: 'evocação',
  pocaoDeInvisibilidade: 'ilusão',
  pergaminhoDeAuguro: 'adivinhação',
  pergaminhoDeEnfeiticar: 'encantamento',
  pergaminhoDeBolaDeFogo: 'evocação',
};

/** O que Identificar revela de um item da mochila. */
export function infoDoItem(itemId) {
  const it = itemDeId(itemId)?.dados;
  if (!it) return { magico: false, nome: String(itemId), linhas: ['Nada de especial, e nenhuma magia.'] };
  const aura = auraDe(itemId);
  if (!aura) {
    return { magico: false, nome: it.name, linhas: [it.desc ? `${it.desc}` : 'Um objeto comum.', 'Nenhuma magia nele.'] };
  }
  return {
    magico: true, nome: it.name, escola: aura.escola,
    linhas: [`${it.name}${it.raridade ? ` — ${it.raridade}` : ''}. Aura de ${aura.escola}.`, it.desc ?? ''].filter(Boolean),
  };
}

const CLIMA = ['céu limpo e vento fraco', 'nuvens baixas, sem chuva', 'garoa fina o dia todo', 'chuva forte à tarde', 'neblina cerrada até o meio-dia', 'vento frio e seco'];

/** Prestidigitação e Druidismo: os truques. Só acender e apagar a tocha e prever o tempo mexem no jogo. */
function truque(estado, c, spellId, opcao, alvo, rng) {
  if (opcao === 'tocha') {
    const dono = alvo ?? c;
    dono.tochaAcesa = !dono.tochaAcesa;
    return { opcao, dono, acesa: dono.tochaAcesa };
  }
  if (opcao === 'clima') {
    estado.clima = CLIMA[rng.die(CLIMA.length) - 1];
    return { opcao, clima: estado.clima };
  }
  return { opcao };
}

/** Os efeitos que cada truque oferece (o jogador escolhe). */
export const TRUQUES = {
  // Convocar Familiar: a forma do bicho (só as duas que a arte do jogo tem).
  encontrarFamiliar: [
    { id: 'rato', rotulo: 'Um rato', detalhe: 'miúdo e farejador; entra por qualquer fresta' },
    { id: 'morcego', rotulo: 'Um morcego', detalhe: 'miúdo; voa por cima de fossos e escuta através da parede' },
  ],
  prestidigitacao: [
    { id: 'tocha', rotulo: 'Acender ou apagar uma tocha', detalhe: 'sem pederneira, de graça' },
    { id: 'limpar', rotulo: 'Limpar ou sujar algo', detalhe: 'uma peça de roupa, um cubo de 30 cm' },
    { id: 'aquecer', rotulo: 'Esquentar ou esfriar comida', detalhe: 'por uma hora' },
    { id: 'fumaca', rotulo: 'Soltar uma fumaça colorida', detalhe: 'só para impressionar' },
    { id: 'marca', rotulo: 'Deixar uma marca ou um cheiro', detalhe: 'dura uma hora' },
  ],
  arteDruidica: [
    { id: 'clima', rotulo: 'Prever o tempo', detalhe: 'as próximas 24 horas' },
    { id: 'flor', rotulo: 'Fazer uma flor abrir', detalhe: 'ou um broto, uma folha' },
    { id: 'tocha', rotulo: 'Acender ou apagar uma tocha', detalhe: 'ou vela, ou fogueira pequena' },
    { id: 'sinal', rotulo: 'Fazer um sinal sensorial', detalhe: 'um cheiro, um som de bicho, um aviso' },
  ],
};

// ------------------------------------------------------- testes sociais ----

const eSocial = (pericia) => ['persuasao', 'intimidacao', 'enganacao', 'atuacao'].includes(pericia);

/**
 * O que as magias dão a um teste de perícia de `quem`, no contexto de `npc`
 * (ou nenhum). { vantagem, desvantagem, auto, bonus: ['1d4'], fontes: [texto] }.
 * Não gasta nada: `rolarTeste` é quem consome a Orientação e a Sugestão.
 */
export function modificadores(estado, herois, quem, pericia, { npc = null } = {}) {
  const out = { vantagem: false, desvantagem: false, auto: false, bonus: [], fontes: [] };
  const hab = SKILLS[pericia];
  const vant = (t) => { out.vantagem = true; out.fontes.push(t); };
  const desv = (t) => { out.desvantagem = true; out.fontes.push(t); };
  const meu = (id) => ativaDe(estado, herois, id, { por: quem });
  const key = npc ? chaveDoNpc(npc) : null;

  if (pericia === 'intimidacao' && meu('taumaturgia')) vant('Taumaturgia');
  if (hab === 'cha' && npc && ativaDe(estado, herois, 'amizade', { por: quem, npc })) vant('Amizade');
  if (hab === 'cha' && npc && ativaDe(estado, herois, 'enfeiticarPessoa', { por: quem, npc })) vant('Enfeitiçar Pessoa');
  if (pericia === 'enganacao' && meu('disfarcarSe')) vant('Disfarçar-se');
  if (pericia === 'enganacao' && meu('alterarAparencia')) vant('Alterar Aparência');
  if (pericia === 'enganacao' && meu('ilusaoMenor')) vant('Ilusão Menor (distração)');
  if (pericia === 'lidarComAnimais' && meu('falarComAnimais')) vant('Falar com Animais');
  if (npc && (pericia === 'persuasao' || pericia === 'enganacao') && estado.npcs[key]?.sondado) vant('mente sondada');
  if (npc && eSocial(pericia) && ativaDe(estado, herois, 'sugestao', { npc })) { out.auto = true; out.fontes.push('Sugestão'); }
  if (npc && hab === 'cha' && estado.npcs[key]?.ressentido) desv(estado.npcs[key].ressentido === 'hostil' ? 'ele está hostil' : 'ele sabe que foi influenciado');
  // As condições do próprio herói: Aprimorar Atributo, Aumentar/Reduzir.
  const fx = conditionEffects(quem);
  if (fx.vantagemTeste.includes(hab) || fx.vantagemSoTeste.includes(hab)) vant(hab === 'cha' ? 'Esplendor da Águia' : 'atributo aprimorado');
  if (fx.desvantagemTeste.includes(hab) || fx.desvantagemSoTeste.includes(hab)) desv('condição');
  // Orientação: 1d4 no próximo teste.
  for (const c of quem.conditions ?? []) {
    const d = CONDITIONS[c.id]?.testeBonusDice;
    if (d) { out.bonus.push(d); out.fontes.push('Orientação +1d4'); }
  }
  return out;
}

/** A chance de passar (d20 + bônus ≥ CD), com vantagem ou desvantagem. */
export function chanceDeTeste(bonus, cd, { vantagem = false, desvantagem = false, auto = false } = {}) {
  if (auto) return 1;
  const p = Math.max(0, Math.min(1, (21 - (cd - bonus)) / 20));
  if (vantagem && !desvantagem) return 1 - (1 - p) ** 2;
  if (desvantagem && !vantagem) return p * p;
  return p;
}

/** Previsão para a conversa: bônus, chance e o que as magias mudam. */
export function previsaoDeTeste(estado, herois, quem, pericia, cd, { npc = null, extra = {} } = {}) {
  const m = modificadores(estado, herois, quem, pericia, { npc });
  const vantagem = m.vantagem || Boolean(extra.vantagem);
  const desvantagem = m.desvantagem || Boolean(extra.desvantagem);
  let bonus = skillBonus(quem, pericia);
  // O 1d4 entra pela média, arredondada para a conta da chance.
  const chance = m.bonus.length
    ? [1, 2, 3, 4].reduce((s, k) => s + chanceDeTeste(bonus + k, cd, { vantagem, desvantagem, auto: m.auto }), 0) / 4
    : chanceDeTeste(bonus, cd, { vantagem, desvantagem, auto: m.auto });
  return { bonus, chance, vantagem: vantagem && !desvantagem, desvantagem: desvantagem && !vantagem, auto: m.auto, fontes: m.fontes, bonusDado: m.bonus };
}

/** Quem do grupo tem a melhor chance neste teste. */
export function melhorParaTeste(estado, herois, pericia, cd, { npc = null, extra = {} } = {}) {
  let melhor = null;
  for (const h of herois) {
    const p = previsaoDeTeste(estado, herois, h, pericia, cd, { npc, extra });
    if (!melhor || p.chance > melhor.p.chance + 1e-9 || (Math.abs(p.chance - melhor.p.chance) < 1e-9 && p.bonus > melhor.p.bonus)) melhor = { quem: h, p };
  }
  return melhor;
}

/**
 * Rola um teste de perícia de verdade. Consome o 1d4 da Orientação e a
 * Sugestão. Devolve { quem, pericia, total, cd, passou, modo, fontes } no
 * formato que a tela de narrativa mostra.
 */
export function rolarTeste(estado, herois, rng, quem, pericia, cd, { npc = null, vantagem = false, desvantagem = false } = {}) {
  const m = modificadores(estado, herois, quem, pericia, { npc });
  const adv = vantagem || m.vantagem;
  const dis = desvantagem || m.desvantagem;
  const r = d20(rng, skillBonus(quem, pericia), { advantage: adv, disadvantage: dis });
  let total = r.total;
  const extras = [];
  for (const cond of [...(quem.conditions ?? [])]) {
    const dados = CONDITIONS[cond.id]?.testeBonusDice;
    if (!dados) continue;
    const d = roll(rng, dados);
    total += d.total;
    extras.push(`+${d.total} (Orientação)`);
    if (CONDITIONS[cond.id].consumidaNoTeste) {
      removeCondition(quem, cond.id);
      const a = estado.ativas.find((x) => x.spellId === 'orientacao' && x.alvos.includes(quem.id));
      if (a) encerrar(estado, a, herois);
    }
  }
  let passou = total >= cd;
  if (m.auto && !passou) {
    passou = true;
    extras.push('Sugestão: ele cede');
  }
  if (m.auto) {
    const a = ativaDe(estado, herois, 'sugestao', { npc });
    // A sugestão vale uma vez: cumprida, a magia acaba.
    if (a && passou) encerrar(estado, a, herois);
  }
  const modo = r.mode !== 'normal' && !(adv && dis) ? r.mode : 'normal';
  return {
    quem: quem.name, pericia: SKILL_NAME[pericia], total, cd, passou, modo,
    fontes: [...m.fontes.filter((f) => !/Orientação/.test(f)), ...extras], bonus: skillBonus(quem, pericia),
  };
}

// -------------------------------------------------- detectar pensamentos ----

/**
 * Sondar a mente de um NPC (precisa de Detectar Pensamentos ativo): ele faz
 * CD de SAB; se passa, percebe a invasão e fecha a mente. Devolve
 * { leu, percebeu, resistencia }.
 */
export function sondarMente(estado, herois, c, npc, rng) {
  const a = ativaDe(estado, herois, 'detectarPensamentos', { por: c });
  if (!a) return { ok: false, why: 'Detectar Pensamentos não está ativa' };
  if (c.pos && npc.pos && distanceFt(c.pos, npc.pos) > 30) return { ok: false, why: 'longe demais — 9 m' };
  if ((npc.abilities?.int ?? 10) <= 3) return { ok: false, why: `${npc.name} não pensa em palavras: Inteligência 3 ou menos` };
  if (npc.semIdioma) return { ok: false, why: `${npc.name} não fala nenhum idioma` };
  const key = chaveDoNpc(npc);
  const n = (estado.npcs[key] ??= {});
  if (n.mentePronta === 'fechada') return { ok: true, leu: false, percebeu: true, jaFechada: true };
  if (n.sondado) return { ok: true, leu: true, percebeu: false, jaLida: true };
  const dc = spellSaveDc(c);
  const r = d20(rng, saveBonus(comFicha(npc), 'wis'));
  const passou = r.total >= dc;
  if (passou) {
    // Passou: ele sente a invasão, fecha a mente e a magia termina.
    n.mentePronta = 'fechada';
    encerrar(estado, a, herois);
    return { ok: true, leu: false, percebeu: true, terminou: true, resistencia: { total: r.total, dc } };
  }
  // Falhou, mas o livro não deixa de dizer que ele PERCEBE que lhe leem a mente.
  n.sondado = true;
  return { ok: true, leu: true, percebeu: true, resistencia: { total: r.total, dc } };
}

// ---------------------------------------------------------- consultas ----

/** O grupo entende o idioma? (Compreender Idiomas ou Línguas ativa em alguém.) */
export const entendeIdiomas = (estado, herois) => Boolean(ativasDoGrupo(estado, herois).find((a) => a.efeito === 'idiomas'));

/** O grupo FALA o idioma (Línguas)? Compreender Idiomas só entende. */
export const falaIdiomas = (estado, herois) => Boolean(ativasDoGrupo(estado, herois).find((a) => a.spellId === 'linguas'));

/** Uma magia de pé no grupo, contando as que valem por ela (Línguas vale por Compreender Idiomas). */
const VALE_POR = { compreenderIdiomas: ['linguas'], disfarcarSe: ['alterarAparencia'] };
export function temMagia(estado, herois, id, filtro = {}) {
  return [id, ...(VALE_POR[id] ?? [])].some((i) => ativaDe(estado, herois, i, filtro));
}

/** Há alguém do grupo vestido de outra pessoa (Disfarçar-se ou Alterar Aparência)? */
export const disfarcado = (estado, herois, c) => Boolean(disfarceDe(estado, herois, c));
/** A magia de disfarce de pé de `c`, ou null. */
export const disfarceDe = (estado, herois, c) => ativaDe(estado, herois, 'disfarcarSe', { por: c }) ?? ativaDe(estado, herois, 'alterarAparencia', { por: c });

/** A criatura está sob a Zona da Verdade (não consegue mentir)? */
export const sobZona = (estado, herois, npc) => Boolean(ativaDe(estado, herois, 'zonaDaVerdade', { npc }));
/** A criatura está cativada (não grita, não chama ajuda)? */
export const estaCativado = (m) => hasCondition(m, 'cativado');

/** Uma fera que a Amizade Animal pega: tipo fera, Inteligência 3 ou menos, viva e não do grupo. */
export const eFeraAmansavel = (m) => Boolean(m) && m.tipo === 'fera' && (m.abilities?.int ?? 10) <= 3 && !m.dead && m.hp > 0 && m.side !== 'party';

/**
 * O Alarme avisa quem está perto da marca, na cena onde foi lançado. Devolve a magia
 * ativa que cobre `pos` em `lugar`, ou null.
 */
export function alarmeCobre(estado, herois, lugar, pos) {
  if (lugar == null) return null;
  // O Alarme e a Boca Mágica fazem a mesma coisa para quem dorme: avisam.
  // O Alarme toca um sino que só o grupo ouve; a Boca fala em voz alta, o que
  // avisa o grupo e também avisa quem chegou de que foi visto. No jogo as
  // duas protegem da surpresa igual — a diferença fica na narração.
  const AVISAM = new Set(['alarme', 'bocaMagica']);
  return ativasDoGrupo(estado, herois).find((a) => AVISAM.has(a.spellId) && a.data?.cena === lugar && a.data?.ponto
    && distanceFt(a.data.ponto, pos) <= RAIO_DO_ALARME) ?? null;
}

/** O lado da balança de uma criatura para o Detectar o Bem e o Mal: 'bem' | 'mal' | 'neutro' | null (não sente). */
export const ladoBemMal = (m) => TIPOS_BEM_MAL[m?.tipo] ?? null;

/**
 * O tipo que a adivinhação LÊ numa criatura. A Aura Mágica troca o tipo
 * aparente: um corruptor pode ler como celestial, e um herói como morto-vivo.
 */
export const tipoAparente = (m) => m?.auraMagica ?? m?.tipo ?? null;

/** O lado da balança pelo tipo APARENTE, que é o que a magia vê. */
export const ladoAparente = (m) => TIPOS_BEM_MAL[tipoAparente(m)] ?? null;

/** Indetectável: a adivinhação não acha quem está sob ela. */
export const escondidoDaMagia = (m) => Boolean(m?.semDeteccao);

/** As criaturas que o Detectar o Bem e o Mal de `dono` sente agora, entre `criaturas`. */
export function sentidasPorBemMal(estado, herois, dono, criaturas) {
  if (!ativaDe(estado, herois, 'detectarBemMal', { por: dono })) return [];
  // Lê o tipo APARENTE (Aura Mágica do Arcanista) e pula quem o Indetectável esconde.
  return criaturas.filter((m) => !m.dead && m.side !== 'party' && !escondidoDaMagia(m)
    && ladoAparente(m) && m.pos && distanceFt(dono.pos, m.pos) <= ALCANCE_BEM_MAL);
}

/** A Mensagem permite falar com este NPC longe (até 36 m)? */
export const falaPorMensagem = (estado, herois, npc) => Boolean(ativaDe(estado, herois, 'mensagem', { npc }));

/** As magias que o herói pode conjurar fora do combate (para os menus). */
export function magiasForaDoHeroi(c) {
  // Só o mago conjura ritual sem preparar (grimório e livro de rituais).
  const doLivro = c.classe === 'mago' ? [...(c.spellcasting?.rituais ?? []), ...(c.spellcasting?.livro ?? []).filter((id) => SPELLS[id]?.ritual)] : [];
  return [...new Set([...magiasProntas(c), ...doLivro])].filter((id) => UTIL[id]).map((id) => getSpell(id));
}

/** Nome do círculo para o menu: "truque" ou "2º círculo". */
export const circuloTexto = (s) => (s.level === 0 ? 'truque' : `${s.level}º círculo`);

export { dadosDaMagia, abilityMod };
