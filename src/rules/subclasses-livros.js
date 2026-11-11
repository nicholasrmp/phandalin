// O MOTOR DAS SUBCLASSES DOS LIVROS (Guia de Xanathar...): o que os recursos de `classes/subclasses-xge.js` fazem numa
// luta. É o irmão de `livro-motor.js`: cada função recebe o encontro (`enc`) e é chamada de um gancho de `combat.js`, que
// fica com uma linha por recurso em vez de um parágrafo.
import { damageRoll } from '../core/dice.js';
import { distanceFt } from '../core/grid.js';
import { addCondition, removeCondition, hasCondition, getCondition, conditionEffects } from './conditions.js';
import { abilityMod, proficiencyBonus, spellSaveDc, skillBonus } from './abilities.js';
import { ARMORS, WEAPONS } from './items/index.js';
import { MONSTERS } from './monsters.js';
import { crEmNumero } from './forma-selvagem.js';

export const emFuria = (c) => hasCondition(c, 'furia');
const ve = (enc, a, b) => a.pos && b.pos && enc.field.hasLineOfSight(a.pos, b.pos);
const desperto = (c) => !c.dead && !conditionEffects(c).incapacitated;
const deArmaduraPesada = (c) => ARMORS[c.armor ?? 'nenhuma']?.categoria === 'pesada';
const naVez = (enc, c) => enc.side === c.side && !enc.explorando;

// ============================================================ Caminho do Guardião Ancestral

/** O bárbaro que marcou `criatura` com os PROTETORES ANCESTRAIS, se a marca ainda vale (ele vivo e em Fúria). */
function guardiaoDaMarca(enc, criatura) {
  const m = getCondition(criatura, 'protetoresAncestrais');
  if (!m) return null;
  const dono = enc.combatants.find((c) => c.id === m.source);
  if (!dono || dono.dead || !emFuria(dono)) { removeCondition(criatura, 'protetoresAncestrais'); return null; }
  return dono;
}

/** PROTETORES ANCESTRAIS: o primeiro acerto de ataque do bárbaro em Fúria, no turno dele, marca o alvo até o próximo turno. */
export function marcarComOsAncestrais(enc, atacante, alvo) {
  if (!atacante.features?.includes('ancestralProtectors') || !emFuria(atacante) || alvo.dead || !naVez(enc, atacante)) return;
  const vez = enc.turnoKey();
  if (atacante.protetoresNoTurno === vez) return;
  atacante.protetoresNoTurno = vez;
  addCondition(alvo, 'protetoresAncestrais', { rounds: 1, quando: 'inicio', lado: atacante.side, source: atacante.id });
  enc.say('recurso', `Os ancestrais de ${atacante.name} cercam ${alvo.name}: até o próximo turno dele, ataca outro com desvantagem, e quem ele acertar além de ${atacante.name} resiste ao dano (Protetores Ancestrais).`);
}

/** A desvantagem de quem está marcado e ataca outro que não o bárbaro: devolve o bárbaro, ou null. */
export function desvantagemDosAncestrais(enc, atacante, alvo) {
  const dono = guardiaoDaMarca(enc, atacante);
  return dono && dono !== alvo ? dono : null;
}

/** A resistência de quem o marcado acerta com um ataque, menos o próprio bárbaro. */
export function resisteAosMarcados(enc, alvo, fonte, deAtaque) {
  if (!fonte || !deAtaque) return null;
  const dono = guardiaoDaMarca(enc, fonte);
  return dono && dono !== alvo ? dono : null;
}

/**
 * ESCUDO ESPIRITUAL (6º): reação do bárbaro em Fúria; outra criatura que ele vê a até 9 m sofre dano, e o dano cai 2d6 (3d6 no
 * 10º, 4d6 no 14º). ANCESTRAIS VINGATIVOS (14º): o que o escudo evitou num ataque volta como dano energético a quem atacou.
 * Automática, como a Esquiva Sobrenatural: no aliado que leva 5 ou mais, ou no que cairia com o golpe.
 */
export function escudoEspiritual(enc, alvo, fonte, amount, { deAtaque = false } = {}) {
  if (amount <= 0 || !fonte || fonte === alvo || fonte.side === alvo.side) return amount;
  const g = enc.combatants.find((c) => c !== alvo && c.side === alvo.side && c.features?.includes('spiritShield') && emFuria(c)
    && !c.reactionUsed && desperto(c) && c.pos && alvo.pos && distanceFt(c.pos, alvo.pos) <= 30 && ve(enc, c, alvo));
  if (!g) return amount;
  if (amount < 5 && amount < alvo.hp + (alvo.tempHp ?? 0)) return amount;
  g.reactionUsed = true;
  const dados = g.dadosDoEscudoEspiritual ?? '2d6';
  const r = damageRoll(enc.rng, dados);
  const evitado = Math.min(amount, r.total);
  enc.say('recurso', `Os espíritos de ${g.name} se põem na frente de ${alvo.name}: −${r.total} de dano, de ${amount} para ${amount - evitado} (Escudo Espiritual).`, `${dados}[${r.rolls.join('+')}]`);
  if (deAtaque && evitado > 0 && g.features.includes('vengefulAncestors') && !fonte.dead) {
    enc.say('recurso', `Os ancestrais de ${g.name} devolvem o golpe a ${fonte.name}: ${evitado} de dano energético (Ancestrais Vingativos).`);
    enc.outraFonte(() => enc.applyDamage(fonte, evitado, 'energético', g, { magico: true }));
  }
  return amount - evitado;
}

// ============================================================ Caminho do Arauto da Tempestade

export const TIPO_DA_TEMPESTADE = { deserto: 'fogo', mar: 'elétrico', tundra: 'frio' };
const ambiente = (b) => b.ambienteDaTempestade ?? 'deserto';
const naAura = (enc, b, c) => c !== b && !c.dead && c.pos && b.pos && distanceFt(b.pos, c.pos) <= 10 && ve(enc, b, c);
export const cdDaTempestade = (b) => 8 + proficiencyBonus(b.level ?? 1) + abilityMod(b.abilities?.con ?? 10);

/**
 * AURA DA TEMPESTADE (3º): dispara ao entrar em Fúria e, depois, com a ação bônus de cada turno. Deserto: 2 de fogo em TODA
 * outra criatura na aura (aliado inclusive, como o livro manda; 3 no 5º, 4 no 10º, 5 no 15º, 6 no 20º). Mar: uma criatura
 * testa Destreza ou leva 1d6 elétrico (metade se passa; 2d6 no 10º, 3d6 no 15º, 4d6 no 20º). Tundra: PV temporários a quem o
 * bárbaro escolhe (ele e os aliados). E a TEMPESTADE FURIOSA da tundra (14º): uma criatura testa Força ou fica parada.
 * `alvo` escolhe a criatura do mar e da tundra; sem ele, o inimigo mais perto.
 */
export function aurasDaTempestade(enc, b, alvo = null) {
  if (!b.features?.includes('stormAura') || !emFuria(b)) return;
  const amb = ambiente(b);
  const dc = cdDaTempestade(b);
  const dentro = enc.combatants.filter((c) => naAura(enc, b, c));
  const inimigos = dentro.filter((c) => c.side !== b.side && c.side !== 'neutro').sort((x, y) => distanceFt(b.pos, x.pos) - distanceFt(b.pos, y.pos));
  const escolhido = alvo && dentro.includes(alvo) ? alvo : inimigos[0] ?? null;
  if (amb === 'deserto') {
    const dano = b.danoDaAuraDoDeserto ?? 2;
    enc.say('recurso', `A aura de ${b.name} vira um vento de deserto: ${dano} de fogo em quem está a até 3 m.`);
    for (const c of dentro) enc.outraFonte(() => enc.applyDamage(c, dano, 'fogo', b, { magico: true }));
  } else if (amb === 'mar') {
    if (!escolhido) { enc.say('recurso', `A aura de ${b.name} relampeja, e não há ninguém nela para o raio.`); return; }
    const dados = b.dadosDaAuraDoMar ?? '1d6';
    const r = damageRoll(enc.rng, dados);
    const sv = enc.resistencia(escolhido, 'dex', dc, { contra: { magico: false, tipoDano: 'elétrico' } });
    enc.explicarResistencia(escolhido, 'dex', dc, sv, { contra: `Aura da Tempestade de ${b.name} (mar)`, seSucesso: 'metade do dano' });
    const dano = sv.success ? Math.floor(r.total / 2) : r.total;
    enc.say('recurso', `Um raio salta da aura de ${b.name} em ${escolhido.name}: ${dano} elétrico.`, `${dados}[${r.rolls.join('+')}]`);
    enc.outraFonte(() => enc.applyDamage(escolhido, dano, 'elétrico', b, { magico: true }));
  } else {
    const pv = b.pvDaAuraDaTundra ?? 2;
    const ganham = [b, ...dentro.filter((c) => c.side === b.side)];
    for (const c of ganham) c.tempHp = Math.max(c.tempHp ?? 0, pv);
    enc.say('recurso', `A aura de ${b.name} gela o ar: ${ganham.map((c) => c.name).join(', ')} ${ganham.length > 1 ? 'ganham' : 'ganha'} ${pv} PV temporários.`);
    if (b.features.includes('ragingStorm') && escolhido && escolhido.side !== b.side && !escolhido.dead) {
      const sv = enc.resistencia(escolhido, 'str', dc);
      enc.explicarResistencia(escolhido, 'str', dc, sv, { contra: `Tempestade Furiosa de ${b.name} (tundra)`, seSucesso: 'continua andando' });
      if (!sv.success) {
        addCondition(escolhido, 'presoPelaTundra', { rounds: 1, quando: 'inicio', lado: b.side, source: b.id });
        enc.say('condicao', `${escolhido.name} fica com os pés presos no gelo: deslocamento 0 até o próximo turno de ${b.name}.`);
      }
    }
  }
}

/** A resistência que as subclasses dão: a ALMA DA TEMPESTADE (6º), a TEMPESTADE PROTETORA (10º, aos aliados na aura) e a FORJA. */
export function resisteComoSubclasse(enc, t, tipo, magico) {
  const f = t.features ?? [];
  if (f.includes('stormSoul') && TIPO_DA_TEMPESTADE[ambiente(t)] === tipo) return true;
  if (enc.combatants.some((b) => b !== t && b.side === t.side && !b.dead && b.features?.includes('shieldingStorm') && emFuria(b)
    && TIPO_DA_TEMPESTADE[ambiente(b)] === tipo && naAura(enc, b, t))) return true;
  // ALMA DA FORJA (6º): resistência a fogo. SANTO DA FORJA E DO FOGO (17º): de armadura pesada, resistência ao golpe não mágico.
  if (f.includes('soulOfTheForge') && tipo === 'fogo') return true;
  if (f.includes('saintOfForgeAndFire') && !magico && ['concussão', 'cortante', 'perfurante'].includes(tipo) && deArmaduraPesada(t)) return true;
  // TASHA (4º lote): as Defesas Psíquicas, a Alma Oceânica e a Dádiva Elemental
  if (resisteTce4(t, tipo)) return true;
  // os outros livros: a Resistência Sobrenatural, o Campeão Exaltado, o Elo de Presa e Escama, o Aspecto da Serpe
  if (resisteDosLivros2(enc, t, tipo, magico)) return true;
  return false;
}

/** SANTO DA FORJA E DO FOGO (17º): imune a fogo. */
export const imuneComoSubclasse = (t, tipo) => tipo === 'fogo' && !!t.features?.includes('saintOfForgeAndFire');

/**
 * A TEMPESTADE FURIOSA (14º), as duas que respondem a golpe. Deserto: quem está na aura e acerta o bárbaro com um ataque
 * testa Destreza ou leva fogo igual à metade do nível dele. Mar: o bárbaro acerta quem está na aura e ele testa Força ou
 * cai. As duas são reação, e saem sozinhas.
 */
export function tempestadeFuriosaAoSerAcertado(enc, alvo, atacante) {
  if (!alvo.features?.includes('ragingStorm') || ambiente(alvo) !== 'deserto' || !emFuria(alvo) || alvo.reactionUsed || !desperto(alvo)
    || atacante.dead || atacante.side === alvo.side || !naAura(enc, alvo, atacante)) return;
  alvo.reactionUsed = true;
  const dc = cdDaTempestade(alvo);
  const sv = enc.resistencia(atacante, 'dex', dc);
  enc.explicarResistencia(atacante, 'dex', dc, sv, { contra: `Tempestade Furiosa de ${alvo.name} (deserto)`, seSucesso: 'não se queima' });
  if (sv.success) return;
  const dano = Math.floor((alvo.level ?? 1) / 2);
  enc.say('recurso', `A areia em brasa da aura de ${alvo.name} queima ${atacante.name}: ${dano} de fogo (Tempestade Furiosa).`);
  enc.outraFonte(() => enc.applyDamage(atacante, dano, 'fogo', alvo, { magico: true }));
}

export function tempestadeFuriosaAoAcertar(enc, atacante, alvo) {
  if (!atacante.features?.includes('ragingStorm') || ambiente(atacante) !== 'mar' || !emFuria(atacante) || atacante.reactionUsed || !desperto(atacante)
    || alvo.dead || hasCondition(alvo, 'caido') || !naAura(enc, atacante, alvo)) return;
  atacante.reactionUsed = true;
  const dc = cdDaTempestade(atacante);
  const sv = enc.resistencia(alvo, 'str', dc);
  enc.explicarResistencia(alvo, 'str', dc, sv, { contra: `Tempestade Furiosa de ${atacante.name} (mar)`, seSucesso: 'fica de pé' });
  if (sv.success) return;
  addCondition(alvo, 'caido');
  enc.say('condicao', `Uma onda da aura de ${atacante.name} derruba ${alvo.name} (Tempestade Furiosa).`);
}

// ============================================================ Caminho do Fanático

/** FÚRIA DIVINA (3º): em Fúria, o primeiro acerto de arma de cada turno soma 1d6 + metade do nível, radiante ou necrótico. */
export function furiaDivina(enc, atacante, extra) {
  if (!atacante.features?.includes('divineFury') || !emFuria(atacante) || !naVez(enc, atacante)) return;
  const vez = enc.turnoKey();
  if (atacante.furiaDivinaNoTurno === vez) return;
  atacante.furiaDivinaNoTurno = vez;
  const meio = Math.floor((atacante.level ?? 3) / 2);
  extra('Fúria Divina', `1d6+${meio}`, atacante.tipoDaFuriaDivina ?? 'radiante');
}

/** FOCO FANÁTICO (6º): uma vez por Fúria, a resistência que falha em Fúria se rola de novo, e vale a nova. */
export function focoFanatico(enc, actor, rolado, rolarDeNovo) {
  if (rolado.success || !actor.features?.includes('fanaticalFocus') || !emFuria(actor) || actor.focoFanaticoUsado) return rolado;
  actor.focoFanaticoUsado = true;
  const novo = rolarDeNovo();
  enc.say('recurso', `${actor.name} falha, e a fé o faz tentar de novo: ${novo.success ? 'passa' : 'falha outra vez'} (Foco Fanático).`);
  return { ...novo, partes: rolado.partes };
}

/** PRESENÇA ZELOSA (10º): ação bônus; até dez aliados a até 18 m têm vantagem nos ataques e nas resistências até o próximo turno. */
export function presencaZelosa(enc, actor) {
  if (actor.bonusUsed || !(actor.resources?.zealousPresence > 0)) return false;
  const quem = enc.combatants.filter((c) => c !== actor && c.side === actor.side && !c.dead && c.pos && distanceFt(actor.pos, c.pos) <= 60)
    .sort((a, b) => distanceFt(actor.pos, a.pos) - distanceFt(actor.pos, b.pos)).slice(0, 10);
  actor.bonusUsed = true;
  actor.resources.zealousPresence -= 1;
  for (const c of quem) addCondition(c, 'presencaZelosa', { rounds: 1, quando: 'inicio', lado: actor.side, source: actor.id });
  enc.say('recurso', `${actor.name} solta um grito de guerra que é uma prece: ${quem.length ? quem.map((c) => c.name).join(', ') : 'ninguém perto'} — vantagem nos ataques e nas resistências até o próximo turno dele (Presença Zelosa).`);
  return true;
}

/**
 * FÚRIA ALÉM DA MORTE (14º): o bárbaro em Fúria que chega a 0 PV não cai. Segue de pé, rolando o teste contra a morte no
 * começo do turno e levando falha a cada dano; as três falhas só o matam quando a Fúria acabar, e só se ele ainda estiver a
 * 0 PV. Devolve true quando segura o bárbaro de pé (quem chama não o derruba).
 */
export function seguraDePe(enc, t) {
  if (!t.features?.includes('rageBeyondDeath') || !emFuria(t)) return false;
  t.furiaAlemDaMorte = true;
  t.stable = false;
  t.deathSaves = { successes: 0, failures: 0 };
  enc.say('morte', `${t.name} chega a 0 PV e não cai: a fúria o segura de pé (Fúria Além da Morte).`);
  return true;
}

/** Quem a Fúria Além da Morte segura e as três falhas já alcançaram: não morre agora (devolve true). */
export function adiaAMorte(enc, t) {
  if (!t.furiaAlemDaMorte || !emFuria(t)) return false;
  if (!t.morteAdiada) enc.say('morte', `${t.name} já devia ter morrido, e a fúria não deixa: cai quando ela acabar.`);
  t.morteAdiada = true;
  return true;
}

/** A fúria acabou (ou a vida voltou): quem a Fúria Além da Morte segurava a 0 PV morre ou cai, conforme as falhas. */
export function conferirFuriaAlemDaMorte(enc) {
  for (const c of enc.combatants) {
    if (!c.furiaAlemDaMorte || c.dead) continue;
    if (c.hp > 0) { c.furiaAlemDaMorte = false; c.morteAdiada = false; continue; }
    if (emFuria(c)) continue;
    c.furiaAlemDaMorte = false;
    if (c.morteAdiada || (c.deathSaves?.failures ?? 0) >= 3) {
      c.morteAdiada = false;
      enc.morrer(c, 'a fúria acabou');
      continue;
    }
    addCondition(c, 'inconsciente');
    addCondition(c, 'caido');
    c.acted = true;
    enc.say('morte', `A fúria de ${c.name} passa, e ele cai inconsciente.`);
    enc.soltarAgarroesDe?.(c);
    enc.onEvent({ type: 'downed', target: c });
  }
}

// ============================================================ Colégio do Glamour

/**
 * MANTO DE INSPIRAÇÃO (3º): ação bônus e uma Inspiração de Bardo; até CAR criaturas (mínimo 1) a até 18 m que o bardo vê
 * ganham 5 PV temporários (8 no 5º, 11 no 10º, 14 no 15º). Vão primeiro os aliados que mais precisam.
 */
export function mantoDeInspiracao(enc, actor) {
  if (actor.bonusUsed || !(actor.resources?.bardicInspiration > 0)) return false;
  const pv = actor.pvDoMantoDeInspiracao ?? 5;
  const quantos = Math.max(1, abilityMod(actor.abilities?.cha ?? 10));
  const quem = enc.combatants.filter((c) => c.side === actor.side && !c.dead && c.pos && distanceFt(actor.pos, c.pos) <= 60 && (c === actor || ve(enc, actor, c)) && (c.tempHp ?? 0) < pv)
    .sort((a, b) => (a === actor) - (b === actor) || (a.hp / a.maxHp) - (b.hp / b.maxHp)).slice(0, quantos);
  if (!quem.length) return false;
  actor.bonusUsed = true;
  actor.resources.bardicInspiration -= 1;
  for (const c of quem) c.tempHp = Math.max(c.tempHp ?? 0, pv);
  enc.say('recurso', `${actor.name} se envolve num manto de encanto: ${quem.map((c) => c.name).join(', ')} ${quem.length > 1 ? 'ganham' : 'ganha'} ${pv} PV temporários (Manto de Inspiração).`);
  return true;
}

/** MANTO DE MAJESTADE (6º): ação bônus, concentração de 1 minuto; conjura Comando sem espaço agora e em cada turno, como ação bônus. */
export function mantoDeMajestade(enc, actor, alvo) {
  if (actor.bonusUsed || !(actor.resources?.mantleOfMajesty > 0) || !alvo || hasCondition(actor, 'mantoDeMajestade')) return false;
  // o Comando do manto só existe com o manto: põe, pergunta, e tira de volta se não der
  addCondition(actor, 'mantoDeMajestade', { rounds: 10, source: actor.id });
  if (!enc.canCast(actor, 'comandoDaMajestade', { target: alvo }).ok) { removeCondition(actor, 'mantoDeMajestade'); return false; }
  actor.resources.mantleOfMajesty -= 1;
  if (actor.concentrating) {
    enc.dropConcentration(actor);
    if (!hasCondition(actor, 'mantoDeMajestade')) addCondition(actor, 'mantoDeMajestade', { rounds: 10, source: actor.id });
  }
  actor.concentrating = { spellId: 'mantoDeMajestade', condition: 'mantoDeMajestade', targets: [actor], rounds: 10 };
  enc.say('recurso', `${actor.name} assume uma majestade sobrenatural (Manto de Majestade).`);
  enc.castSpell(actor, 'comandoDaMajestade', { target: alvo });
  return true;
}

/** MAJESTADE INQUEBRÁVEL (14º): ação bônus, 1 minuto. */
export function majestadeInquebravel(enc, actor) {
  if (actor.bonusUsed || !(actor.resources?.unbreakableMajesty > 0) || hasCondition(actor, 'majestadeInquebravel')) return false;
  actor.bonusUsed = true;
  actor.resources.unbreakableMajesty -= 1;
  addCondition(actor, 'majestadeInquebravel', { rounds: 10, source: actor.id });
  enc.say('recurso', `${actor.name} fica de uma majestade que ninguém ousa tocar (Majestade Inquebrável).`);
  return true;
}

/**
 * A MAJESTADE INQUEBRÁVEL barra o ataque: na primeira vez em cada turno que uma criatura ataca o bardo, ela testa Carisma.
 * Falha: não ataca o bardo neste turno (o ataque se perde). Passa: ataca, mas tem desvantagem contra as magias dele até o
 * fim do próximo turno do bardo. Devolve false quando o ataque não sai.
 */
export function passaPelaMajestade(enc, atacante, alvo) {
  const m = getCondition(alvo, 'majestadeInquebravel');
  if (!m || atacante.side === alvo.side) return true;
  if (conditionEffects(alvo).incapacitated) { removeCondition(alvo, 'majestadeInquebravel'); return true; }
  const vez = enc.turnoKey();
  const ja = atacante.majestadeTestada?.[alvo.id];
  if (ja?.vez === vez) {
    if (!ja.passou) enc.say('magia', `${atacante.name} ainda não consegue erguer a arma contra ${alvo.name}.`);
    return ja.passou;
  }
  const dc = spellSaveDc(alvo);
  const sv = enc.resistencia(atacante, 'cha', dc, { contra: { magico: true, condicao: 'enfeiticado' } });
  const r = enc.explicarResistencia(atacante, 'cha', dc, sv, { contra: `Majestade Inquebrável de ${alvo.name}`, seSucesso: 'ataca, e fica abalado' });
  (atacante.majestadeTestada ??= {})[alvo.id] = { vez, passou: sv.success };
  if (!sv.success) {
    enc.say('magia', `${atacante.name} se detém diante da majestade de ${alvo.name} e perde o ataque.`, r.conta, { rolagem: r });
    return false;
  }
  addCondition(atacante, 'abaladoPelaMajestade', { rounds: 2, quando: 'fim', lado: alvo.side, source: alvo.id });
  return true;
}

/** Quem passou pela Majestade Inquebrável resiste com desvantagem às magias do bardo. */
export function abaladoContra(t, conjurador) {
  if (!conjurador) return false;
  return (t.conditions ?? []).some((c) => c.id === 'abaladoPelaMajestade' && c.source === conjurador.id);
}

// ============================================================ Colégio das Espadas e dos Sussurros

/** FLOREIO DE LÂMINA (3º): na ação de Atacar, +3 m de deslocamento neste turno, uma vez. */
export function passoDoFloreio(enc, atacante, { opportunity = false } = {}) {
  if (!atacante.features?.includes('bladeFlourish') || opportunity || !naVez(enc, atacante)) return;
  const vez = enc.turnoKey();
  if (atacante.passoDoFloreioEm === vez) return;
  atacante.passoDoFloreioEm = vez;
  atacante.movementLeftFt = (atacante.movementLeftFt ?? 0) + 10;
}

/** O dado do floreio: o d6 do FLOREIO DO MESTRE (14º), de graça; senão uma Inspiração de Bardo. Null se não há. */
function dadoDoFloreio(atacante) {
  if (atacante.features?.includes('mastersFlourish')) return { dado: '1d6', gasta: false };
  if (!(atacante.resources?.bardicInspiration > 0)) return null;
  const escala = atacante.dadoDeInspiracao ?? 'd6';
  return { dado: String(escala).startsWith('d') ? `1${escala}` : String(escala), gasta: true };
}

/**
 * Os TRÊS FLOREIOS, no acerto de arma do turno do bardo (um por turno): o dado vai ao dano e, no Defensivo, à CA até o próximo
 * turno dele; no Cortante, também a cada inimigo a 1,5 m do bardo; no Móvel, empurra o alvo 1,5 m mais 30 cm por ponto.
 */
export function floreioDeLamina(enc, atacante, alvo, { critical = false, tipo = 'cortante' } = {}) {
  const qual = atacante.floreioPronto;
  if (!qual || !atacante.features?.includes('bladeFlourish') || !naVez(enc, atacante) || alvo.dead) return;
  const vez = enc.turnoKey();
  if (atacante.floreioNoTurno === vez) return;
  const d = dadoDoFloreio(atacante);
  if (!d) return;
  atacante.floreioNoTurno = vez;
  if (d.gasta) atacante.resources.bardicInspiration -= 1;
  const r = damageRoll(enc.rng, d.dado, { critical });
  const valor = r.rolls[0] ?? r.total;
  const nome = { defensivo: 'Floreio Defensivo', cortante: 'Floreio Cortante', movel: 'Floreio Móvel' }[qual];
  enc.say('recurso', `${atacante.name} gira a lâmina: +${r.total} de dano em ${alvo.name} (${nome}${d.gasta ? '' : ', Floreio do Mestre'}).`, `${d.dado}[${r.rolls.join('+')}]`);
  enc.applyDamage(alvo, r.total, tipo, atacante, { deArma: true });
  if (qual === 'defensivo') {
    addCondition(atacante, 'floreioDefensivo', { rounds: 1, quando: 'inicio', lado: atacante.side, data: { acBonus: valor } });
    enc.say('recurso', `${atacante.name} fecha a guarda: +${valor} de CA até o próximo turno.`);
  } else if (qual === 'cortante') {
    for (const c of enc.combatants.filter((x) => x !== alvo && !x.dead && x.side !== atacante.side && x.side !== 'neutro' && x.pos && distanceFt(atacante.pos, x.pos) <= 5)) {
      enc.say('recurso', `O corte do floreio alcança ${c.name}: ${r.total} de dano.`);
      enc.outraFonte(() => enc.applyDamage(c, r.total, tipo, atacante, { deArma: true }));
    }
  } else if (qual === 'movel' && !alvo.dead && alvo.pos) {
    enc.empurrar(alvo, atacante.pos, 5 + Math.floor(valor / 5) * 5);
  }
}

/** LÂMINAS PSÍQUICAS (3º): ligadas, o acerto de arma do turno gasta uma Inspiração e soma 2d6 psíquico (3d6, 5d6, 8d6), uma vez por rodada. */
export function laminasPsiquicas(enc, atacante, extra) {
  if (!atacante.laminasPsiquicasLigadas || !atacante.features?.includes('psychicBlades') || !naVez(enc, atacante)) return;
  if (!(atacante.resources?.bardicInspiration > 0) || atacante.laminasNaRodada === enc.round) return;
  atacante.laminasNaRodada = enc.round;
  atacante.resources.bardicInspiration -= 1;
  extra('Lâminas Psíquicas', atacante.dadosDasLaminasPsiquicas ?? '2d6', 'psíquico');
}

// ============================================================ Domínio da Forja

/** BÊNÇÃO DA FORJA (1º) e ALMA DA FORJA (6º) na CA: +1 na armadura não mágica abençoada; +1 de armadura pesada. */
export function caDaForja(actor, armadura) {
  const f = actor.features ?? [];
  let ac = 0;
  if ((actor.armor ?? 'nenhuma') === 'nenhuma') return 0;
  if (f.includes('blessingOfTheForge') && (actor.bencaoDaForja ?? 'armadura') === 'armadura' && !armadura?.bonusCA) ac += 1;
  if (f.includes('soulOfTheForge') && armadura?.categoria === 'pesada') ac += 1;
  return ac;
}

/** A BÊNÇÃO DA FORJA na arma: a arma principal, não mágica, vira +1 no ataque e no dano, e mágica. */
export function armaAbencoada(actor, w) {
  if (!actor.features?.includes('blessingOfTheForge') || actor.bencaoDaForja !== 'arma') return w;
  if (!w || w.id === 'punhos' || w.id !== actor.equippedWeapon || w.raridade || w.bonusAtaque) return w;
  return { ...w, bonusAtaque: 1, bonusDano: (w.bonusDano ?? 0) + 1, raridade: 'bencaoDaForja' };
}

// ============================================================ Domínio da Sepultura

/** CÍRCULO DA MORTALIDADE (1º): a magia de cura do clérigo em quem está a 0 PV sai no máximo dos dados. */
export const curaNoMaximo = (conjurador, alvo) => !!conjurador?.features?.includes('circleOfMortality') && alvo.hp <= 0;

/** CAMINHO PARA A SEPULTURA (2º): Canalizar Divindade e ação; amaldiçoa uma criatura a até 9 m até o fim do próximo turno. */
export function caminhoParaASepultura(enc, actor, alvo) {
  if (actor.actionUsed || !(actor.resources?.channelDivinity > 0) || !alvo || alvo.dead || alvo.side === actor.side) return false;
  if (distanceFt(actor.pos, alvo.pos) > 30 || !ve(enc, actor, alvo)) return false;
  actor.actionUsed = true;
  actor.resources.channelDivinity -= 1;
  addCondition(alvo, 'caminhoDaSepultura', { rounds: 2, quando: 'fim', lado: actor.side, source: actor.id });
  enc.say('recurso', `${actor.name} marca ${alvo.name} para a cova: o próximo golpe que o acertar fere em dobro (Caminho para a Sepultura).`);
  return true;
}

/** O primeiro ataque do grupo do clérigo que acerta o amaldiçoado: ele fica vulnerável a todo o dano dele, e a maldição acaba. */
export function abrirASepultura(enc, atacante, alvo) {
  const m = getCondition(alvo, 'caminhoDaSepultura');
  if (!m) return false;
  const dono = enc.combatants.find((c) => c.id === m.source);
  if (!dono || atacante.side !== dono.side) return false;
  removeCondition(alvo, 'caminhoDaSepultura');
  alvo.vulneravelAoGolpe = true;
  enc.say('recurso', `A maldição da cova se abre sob ${alvo.name}: este golpe fere em dobro.`);
  return true;
}

/** A vulnerabilidade do golpe da sepultura: dobra o dano (e cancela com a resistência, como o livro manda). */
export function danoNaSepultura(alvo, amount, bruto) {
  if (!alvo.vulneravelAoGolpe || amount <= 0) return amount;
  if (amount < bruto) return bruto;
  if (amount > bruto) return amount;
  return amount * 2;
}

/** SENTINELA NA PORTA DA MORTE (6º): reação; o crítico contra o clérigo ou quem ele vê a até 9 m vira um acerto normal. */
export function sentinelaNaPorta(enc, alvo) {
  const g = enc.combatants.find((c) => c.side === alvo.side && c.features?.includes('sentinelAtDeathsDoor') && (c.resources?.sentinelAtDeathsDoor ?? 0) > 0
    && !c.reactionUsed && desperto(c) && (c === alvo || (c.pos && alvo.pos && distanceFt(c.pos, alvo.pos) <= 30 && ve(enc, c, alvo))));
  if (!g) return false;
  g.reactionUsed = true;
  g.resources.sentinelAtDeathsDoor -= 1;
  enc.say('recurso', `${g.name} fecha a porta da morte: o crítico contra ${alvo.name} vira um acerto comum (Sentinela na Porta da Morte).`);
  return true;
}

/** GUARDIÃO DAS ALMAS (17º): um inimigo que o clérigo vê morre a até 18 m; o aliado mais ferido ali recupera PV iguais aos dados de vida dele. */
export function guardiaoDasAlmas(enc, morto, dadosDeVida = morto.hpDice) {
  for (const g of enc.combatants) {
    if (!g.features?.includes('keeperOfSouls') || g.side === morto.side || !desperto(g) || g.guardiaoNaRodada === enc.round) continue;
    if (!morto.pos || !g.pos || distanceFt(g.pos, morto.pos) > 60 || !ve(enc, g, morto)) continue;
    const dv = Number(/^(\d+)d/.exec(dadosDeVida ?? '')?.[1] ?? morto.level ?? 1);
    const ferido = enc.combatants.filter((c) => c.side === g.side && !c.dead && c.pos && distanceFt(g.pos, c.pos) <= 60 && c.hp < c.maxHp)
      .sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0];
    if (!ferido) continue;
    g.guardiaoNaRodada = enc.round;
    const pv = enc.heal(ferido, dv, g);
    enc.say('cura', `A alma de ${morto.name} passa por ${g.name}: ${ferido.name} recupera ${pv} PV (Guardião das Almas).`);
  }
}

// ============================================================ hooks de começo e fim de lado, e de iniciativa

/** Ao rolar a iniciativa: o DISPARO SEMPRE PRONTO (Arqueiro Arcano, 15º) e o ESPÍRITO INCANSÁVEL (Samurai, 10º) devolvem um uso. */
export function aoRolarIniciativa(enc) {
  for (const c of enc.combatants) {
    if (c.dead) continue;
    if (c.features?.includes('everReadyShot') && (c.resources?.arcaneShot ?? 0) === 0 && (c.resourcesMax?.arcaneShot ?? 0) > 0) {
      c.resources.arcaneShot = 1;
      enc.say('recurso', `${c.name} entra na luta com uma flecha encantada pronta (Disparo Sempre Pronto).`);
    }
    if (c.features?.includes('tirelessSpirit') && (c.resources?.fightingSpirit ?? 0) === 0 && (c.resourcesMax?.fightingSpirit ?? 0) > 0) {
      c.resources.fightingSpirit = 1;
      enc.say('recurso', `${c.name} acha fôlego para mais um Espírito de Luta (Espírito Incansável).`);
    }
  }
}

/** MESTRE DA EMBOSCADA (Batedor, 13º): vantagem na iniciativa do lado (o jogo rola uma por lado). */
export const vantagemNaIniciativa = (enc, side) => enc.allOf(side).some((c) => !c.dead && c.features?.includes('ambushMaster') && desperto(c));

/** Começo do turno de um lado: a retaliação da Marca Inabalável fica valendo neste turno do cavaleiro. */
export function inicioDoLado(enc, side) {
  for (const c of enc.allOf(side)) if (c.retaliacao) c.retaliacao.agora = true;
}

/** Fim do turno de um lado: a retaliação que valia neste turno se perde. */
export function fimDoLado(enc, side) {
  for (const c of enc.allOf(side)) if (c.retaliacao?.agora) delete c.retaliacao;
}

// ============================================================ Arqueiro Arcano

const ehArco = (w) => ['arcoCurto', 'arcoLongo'].includes(w?.id);
export const cdDoArqueiro = (c) => 8 + proficiencyBonus(c.level ?? 1) + abilityMod(c.abilities?.int ?? 10);

/** FLECHA MÁGICA (7º): a flecha do arco conta como mágica contra resistência e imunidade. */
export const flechaMagica = (atacante, weapon) => !!atacante.features?.includes('magicArrow') && ehArco(weapon);

export const NOMES_DO_DISPARO = {
  disparoBanidor: 'Disparo Banidor', disparoEncantador: 'Disparo Encantador', disparoExplosivo: 'Disparo Explosivo',
  disparoDebilitante: 'Disparo Debilitante', disparoSombrio: 'Disparo Sombrio',
};

/**
 * DISPARO ARCANO (3º): armado (`disparoPronto`, uma das opções que ele conhece), sai no acerto de arco da ação de Atacar,
 * uma vez por turno, e gasta um dos dois usos. Desarma depois de sair.
 */
export function disparoArcano(enc, atacante, alvo, weapon, { critical = false } = {}) {
  const qual = atacante.disparoPronto;
  if (!qual || !atacante.features?.includes(qual) || !ehArco(weapon) || !naVez(enc, atacante) || !atacante.actionUsed || alvo.dead) return;
  const vez = enc.turnoKey();
  if (!(atacante.resources?.arcaneShot > 0) || atacante.disparoNoTurno === vez) return;
  atacante.disparoNoTurno = vez;
  atacante.resources.arcaneShot -= 1;
  atacante.disparoPronto = null;
  const dc = cdDoArqueiro(atacante);
  const nome = NOMES_DO_DISPARO[qual];
  const dados = atacante.dadosDoDisparoArcano ?? '2d6';
  const ferir = (quem, tipo, d = dados) => {
    const r = damageRoll(enc.rng, d, { critical });
    enc.say('recurso', `${nome}: +${r.total} de ${tipo} em ${quem.name}.`, `${d}[${r.rolls.join('+')}]`);
    enc.applyDamage(quem, r.total, tipo, atacante, { magico: true });
    return r;
  };
  const testa = (hab, seSucesso) => {
    const sv = enc.resistencia(alvo, hab, dc, { contra: { magico: true } });
    enc.explicarResistencia(alvo, hab, dc, sv, { contra: `${nome} de ${atacante.name}`, seSucesso });
    return !sv.success;
  };
  // até o começo do próximo turno do arqueiro
  const ate = { rounds: 1, quando: 'inicio', lado: atacante.side, source: atacante.id };
  if (qual === 'disparoBanidor') {
    if (atacante.dadosDoDisparoBanidor) ferir(alvo, 'energético', atacante.dadosDoDisparoBanidor);
    if (!alvo.dead && testa('cha', 'fica onde está')) {
      addCondition(alvo, 'banido', { rounds: enc.side === atacante.side ? 2 : 1, quando: 'fim', lado: atacante.side, source: atacante.id });
      enc.say('condicao', `${alvo.name} some num lampejo para outro plano, até o fim do próximo turno de ${atacante.name}.`);
    }
  } else if (qual === 'disparoEncantador') {
    ferir(alvo, 'psíquico');
    const amigo = enc.combatants.filter((c) => c !== atacante && c.side === atacante.side && !c.dead && c.pos && alvo.pos && distanceFt(c.pos, alvo.pos) <= 30)
      .sort((a, b) => distanceFt(a.pos, alvo.pos) - distanceFt(b.pos, alvo.pos))[0];
    if (!alvo.dead && amigo && testa('wis', 'não se encanta') && enc.aplicarCondicao(alvo, 'enfeiticado', { ...ate, source: amigo.id })) {
      enc.say('condicao', `${alvo.name} fica enfeitiçado por ${amigo.name} até o próximo turno de ${atacante.name}.`);
    }
  } else if (qual === 'disparoExplosivo') {
    const r = damageRoll(enc.rng, dados, { critical });
    const pegos = enc.combatants.filter((c) => !c.dead && c.pos && alvo.pos && distanceFt(c.pos, alvo.pos) <= 10);
    enc.say('recurso', `${nome}: a flecha explode, ${r.total} de dano energético em ${pegos.map((c) => c.name).join(', ')}.`, `${dados}[${r.rolls.join('+')}]`);
    for (const c of pegos) enc.outraFonte(() => enc.applyDamage(c, r.total, 'energético', atacante, { magico: true }));
  } else if (qual === 'disparoDebilitante') {
    ferir(alvo, 'necrótico');
    if (!alvo.dead && testa('con', 'continua batendo forte')) {
      addCondition(alvo, 'debilitadoPeloDisparo', ate);
      enc.say('condicao', `${alvo.name} fica fraco: os ataques com arma dele causam metade do dano até o próximo turno de ${atacante.name}.`);
    }
  } else if (qual === 'disparoSombrio') {
    ferir(alvo, 'psíquico');
    if (!alvo.dead && testa('wis', 'continua enxergando') && enc.aplicarCondicao(alvo, 'cego', ate)) {
      enc.say('condicao', `Sombras cobrem os olhos de ${alvo.name} até o próximo turno de ${atacante.name}.`);
    }
  }
}

/**
 * DISPARO CURVO (7º): a flecha mágica que erra vira no ar e é rolada de novo contra outra criatura a até 18 m do alvo, com
 * a ação bônus. No jogo sai sozinho, contra o inimigo mais perto do alvo que o arqueiro consegue atacar.
 */
export function disparoCurvo(enc, atacante, alvo, weaponId, weapon) {
  if (!atacante.features?.includes('curvingShot') || !flechaMagica(atacante, weapon) || atacante.bonusUsed || !naVez(enc, atacante)) return false;
  const outro = enc.enemiesOf(atacante).filter((e) => e !== alvo && !e.dead && e.pos && alvo.pos && distanceFt(e.pos, alvo.pos) <= 60
    && enc.canAttack(atacante, e, weaponId).ok).sort((a, b) => distanceFt(a.pos, alvo.pos) - distanceFt(b.pos, alvo.pos))[0];
  if (!outro) return false;
  atacante.bonusUsed = true;
  enc.say('recurso', `A flecha de ${atacante.name} erra ${alvo.name} e faz a curva para ${outro.name} (Disparo Curvo).`);
  enc.resolveAttackBase(atacante, outro, { weaponId, curvo: true });
  return true;
}

// ============================================================ Cavaleiro

/** MARCA INABALÁVEL (3º): o acerto corpo a corpo marca o alvo até o fim do próximo turno do cavaleiro. */
export function marcaInabalavel(enc, atacante, alvo, { ranged = false } = {}) {
  if (!atacante.features?.includes('unwaveringMark') || ranged || alvo.dead || alvo.side === atacante.side) return;
  addCondition(alvo, 'marcaInabalavel', { rounds: enc.side === atacante.side ? 2 : 1, quando: 'fim', lado: atacante.side, source: atacante.id });
}

function cavaleiroDaMarca(enc, c) {
  const m = getCondition(c, 'marcaInabalavel');
  if (!m) return null;
  const dono = enc.combatants.find((x) => x.id === m.source);
  if (!dono || dono.dead || conditionEffects(dono).incapacitated) { removeCondition(c, 'marcaInabalavel'); return null; }
  return dono;
}

/** O marcado que ataca outro, a 1,5 m do cavaleiro, tem desvantagem. Devolve o cavaleiro. */
export function desvantagemDaMarca(enc, atacante, alvo) {
  const dono = cavaleiroDaMarca(enc, atacante);
  return dono && dono !== alvo && dono.pos && atacante.pos && distanceFt(dono.pos, atacante.pos) <= 5 ? dono : null;
}

/** O marcado feriu outra criatura: no próximo turno, o cavaleiro tem o golpe de ação bônus contra ele. */
export function marcadoFeriu(enc, fonte, alvo) {
  if (!fonte) return;
  const dono = cavaleiroDaMarca(enc, fonte);
  if (!dono || dono === alvo) return;
  if (!dono.retaliacao || dono.retaliacao.alvo !== fonte.id) dono.retaliacao = { alvo: fonte.id, agora: false };
}

/** O golpe da Marca Inabalável: ação bônus, com vantagem e metade do nível de guerreiro a mais no dano. */
export function golpeDaMarca(enc, actor, alvo) {
  if (!alvo || actor.bonusUsed || !(actor.resources?.unwaveringMark > 0) || actor.retaliacao?.alvo !== alvo.id || !actor.retaliacao.agora) return false;
  const arma = enc.armaDeOportunidade(actor);
  if (arma === undefined || WEAPONS[arma]?.ranged || !enc.canAttack(actor, alvo, arma).ok) return false;
  actor.bonusUsed = true;
  actor.resources.unwaveringMark -= 1;
  delete actor.retaliacao;
  actor.danoDaMarca = Math.floor((actor.level ?? 3) / 2);
  enc.say('recurso', `${actor.name} cobra a marca de ${alvo.name} (Marca Inabalável).`);
  try { enc.resolveAttackBase(actor, alvo, { weaponId: arma, vantagem: 'Marca Inabalável' }); } finally { delete actor.danoDaMarca; }
  return true;
}

/**
 * MANOBRA DE PROTEÇÃO (7º): reação de quem empunha arma de perto ou escudo; o cavaleiro ou quem ele vê a 1,5 m é acertado,
 * e o golpe enfrenta a CA + 1d8. Se ainda acerta, o alvo resiste ao dano dele. Devolve o d8, ou null.
 */
export function manobraDeProtecao(enc, alvo, atacante) {
  const g = enc.combatants.find((c) => c.side === alvo.side && c !== atacante && c.features?.includes('wardingManeuver') && (c.resources?.wardingManeuver ?? 0) > 0
    && !c.reactionUsed && desperto(c) && (c.shield || (c.equippedWeapon && c.equippedWeapon !== 'punhos' && !WEAPONS[c.equippedWeapon]?.ranged))
    && (c === alvo || (c.pos && alvo.pos && distanceFt(c.pos, alvo.pos) <= 5 && ve(enc, c, alvo))));
  if (!g) return null;
  g.reactionUsed = true;
  g.resources.wardingManeuver -= 1;
  const d = damageRoll(enc.rng, '1d8').total;
  enc.say('recurso', `${g.name} se põe na frente do golpe em ${alvo.name}: +${d} na CA (Manobra de Proteção).`);
  return d;
}

/** INVESTIDA FEROZ (15º): uma vez por turno, 3 m em linha reta antes de acertar; o alvo testa Força ou cai. */
export function investidaFeroz(enc, atacante, alvo) {
  if (!atacante.features?.includes('ferociousCharger') || alvo.dead || !naVez(enc, atacante)) return;
  const vez = enc.turnoKey();
  const reta = atacante.retaAndada;
  if (atacante.investidaFerozEm === vez || !reta || reta.pes < 10 || reta.vez !== vez) return;
  const paraOAlvo = Math.sign(alvo.pos.x - atacante.pos.x) === reta.dx || Math.sign(alvo.pos.y - atacante.pos.y) === reta.dy;
  if (!paraOAlvo) return;
  atacante.investidaFerozEm = vez;
  const dc = 8 + proficiencyBonus(atacante.level ?? 1) + abilityMod(atacante.abilities?.str ?? 10);
  const sv = enc.resistencia(alvo, 'str', dc, { contra: { condicao: 'caido' } });
  enc.explicarResistencia(alvo, 'str', dc, sv, { contra: `Investida Feroz de ${atacante.name}`, seSucesso: 'fica de pé' });
  if (!sv.success) {
    addCondition(alvo, 'caido');
    enc.say('condicao', `${atacante.name} chega embalado e derruba ${alvo.name} (Investida Feroz).`);
  }
}

/** DEFENSOR VIGILANTE (18º): uma reação a mais no turno de cada outra criatura, só para ataque de oportunidade. */
export function temReacaoVigilante(enc, e, quem) {
  if (!e.features?.includes('vigilantDefender')) return false;
  const k = `${quem.id}:${enc.turnoKey()}`;
  return e.reacaoNormalEm !== k && !(e.vigilanteUsada ?? []).includes(k);
}
export function gastarReacaoDeOportunidade(enc, e, quem) {
  const k = `${quem.id}:${enc.turnoKey()}`;
  if (e.reactionUsed && temReacaoVigilante(enc, e, quem)) {
    e.vigilanteUsada = [...(e.vigilanteUsada ?? []).filter((x) => x.endsWith(enc.turnoKey())), k];
    enc.say('recurso', `${e.name} não perde a brecha (Defensor Vigilante).`);
    return;
  }
  e.reactionUsed = true;
  e.reacaoNormalEm = k;
}

/** MANTER A LINHA (10º): quem anda DENTRO do alcance do cavaleiro também provoca. */
export const segueNaLinha = (e) => !!e.features?.includes('holdTheLine');

// ============================================================ Samurai

/** ESPÍRITO DE LUTA (3º): ação bônus; vantagem nos ataques com arma até o fim do turno e 5 PV temporários (10 no 10º, 15 no 15º). */
export function espiritoDeLuta(enc, actor) {
  if (actor.bonusUsed || !(actor.resources?.fightingSpirit > 0)) return false;
  actor.bonusUsed = true;
  actor.resources.fightingSpirit -= 1;
  const pv = actor.pvDoEspiritoDeLuta ?? 5;
  actor.tempHp = Math.max(actor.tempHp ?? 0, pv);
  addCondition(actor, 'espiritoDeLuta', { rounds: 1, quando: 'fim', lado: actor.side, source: actor.id });
  enc.say('recurso', `${actor.name} chama o espírito de luta: vantagem nos ataques neste turno e ${pv} PV temporários.`);
  return true;
}

/**
 * GOLPE RÁPIDO (15º): uma vez por turno, na ação de Atacar com vantagem, troca a vantagem de um ataque por um ataque a mais
 * no mesmo alvo. Devolve true quando troca (quem chama tira a vantagem e conta o golpe novo).
 */
export function golpeRapido(enc, atacante, mods, { opportunity = false } = {}) {
  if (!atacante.features?.includes('rapidStrike') || opportunity || !atacante.naAcaoDeAtaque || !naVez(enc, atacante)) return false;
  if (mods.mode !== 'vantagem') return false;
  const vez = enc.turnoKey();
  if (atacante.golpeRapidoEm === vez) return false;
  atacante.golpeRapidoEm = vez;
  atacante.golpeRapidoGanho = true;
  enc.say('recurso', `${atacante.name} abre mão da vantagem por um golpe a mais (Golpe Rápido).`);
  return true;
}

// ============================================================ Espadachim

/** GINGADO (3º): quem ele atacou de perto no turno não o pega de oportunidade. Usa a mesma conta do talento Móvel. */
export const temGingado = (c) => !!c.features?.includes('fancyFootwork');

/** AUDÁCIA DESENFREADA (3º): o Ataque Furtivo sem vantagem, colado no alvo e sem mais ninguém a 1,5 m dele. */
export function audaciaNoFurtivo(enc, atacante, alvo) {
  if (!atacante.features?.includes('rakishAudacity') || !atacante.pos || !alvo.pos || distanceFt(atacante.pos, alvo.pos) > 5) return false;
  return !enc.combatants.some((c) => c !== atacante && c !== alvo && !c.dead && c.pos && distanceFt(c.pos, atacante.pos) <= 5);
}

/** PANACHE (9º): ação; Persuasão contra Intuição. Vencendo, o inimigo fica preso ao espadachim por um minuto. */
export function panache(enc, actor, alvo) {
  if (actor.actionUsed || !alvo || alvo.dead || alvo.side === actor.side || distanceFt(actor.pos, alvo.pos) > 60) return false;
  actor.actionUsed = true;
  const a = enc.testeDeAtributo(actor, 'cha', skillBonus(actor, 'persuasao'), 'Persuasão', { pericia: 'persuasao' });
  const d = enc.testeDeAtributo(alvo, 'wis', skillBonus(alvo, 'intuicao'), 'Intuição', { pericia: 'intuicao' });
  if (a.total <= d.total) {
    enc.say('recurso', `${alvo.name} não cai na provocação de ${actor.name} (Persuasão ${a.total} contra Intuição ${d.total}).`);
    return true;
  }
  addCondition(alvo, 'panache', { rounds: 10, source: actor.id });
  enc.say('recurso', `${actor.name} provoca ${alvo.name} com tanta graça que ele só tem olhos para o espadachim (Panache, ${a.total} contra ${d.total}).`);
  return true;
}

/** O espadachim do PANACHE, se a provocação ainda vale (a até 18 m). */
function donoDoPanache(enc, c) {
  const m = getCondition(c, 'panache');
  if (!m) return null;
  const dono = enc.combatants.find((x) => x.id === m.source);
  if (!dono || dono.dead || !dono.pos || !c.pos || distanceFt(dono.pos, c.pos) > 60) { removeCondition(c, 'panache'); return null; }
  return dono;
}
export function desvantagemDoPanache(enc, atacante, alvo) {
  const dono = donoDoPanache(enc, atacante);
  return dono && dono !== alvo ? dono : null;
}
/** Quem está no Panache só dá ataque de oportunidade no espadachim. */
export const panacheImpedeOportunidade = (enc, e, quem) => { const dono = donoDoPanache(enc, e); return !!dono && dono !== quem; };
/** Um aliado do espadachim ataca o provocado: o Panache acaba. */
export function aliadoQuebraPanache(enc, atacante, alvo) {
  const dono = donoDoPanache(enc, alvo);
  if (dono && atacante !== dono && atacante.side === dono.side) {
    removeCondition(alvo, 'panache');
    enc.say('condicao', `O ataque de ${atacante.name} quebra o encanto: ${alvo.name} já não só tem olhos para ${dono.name}.`);
  }
}

/** MANOBRA ELEGANTE (13º): ação bônus; vantagem no próximo teste de Acrobacia ou Atletismo deste turno. */
export function manobraElegante(enc, actor) {
  if (actor.bonusUsed || hasCondition(actor, 'manobraElegante')) return false;
  actor.bonusUsed = true;
  addCondition(actor, 'manobraElegante', { rounds: 1, quando: 'fim', lado: actor.side, source: actor.id });
  enc.say('recurso', `${actor.name} se prepara com elegância: vantagem no próximo teste de Acrobacia ou Atletismo.`);
  return true;
}

/** O teste de Acrobacia ou Atletismo usa a Manobra Elegante (e a gasta). */
export function usaManobraElegante(actor, pericia) {
  if (!['acrobacia', 'atletismo'].includes(pericia) || !hasCondition(actor, 'manobraElegante')) return false;
  removeCondition(actor, 'manobraElegante');
  return true;
}

/** MESTRE DUELISTA (17º): o ataque que erra se rola de novo com vantagem, uma vez por descanso curto ou longo. */
export function mestreDuelista(enc, atacante, atk, bonus, ac) {
  if (atk.hit || !atacante.features?.includes('masterDuelist') || !(atacante.resources?.masterDuelist > 0)) return atk;
  atacante.resources.masterDuelist -= 1;
  const a = enc.rng.die(20);
  const b = enc.rng.die(20);
  const natural = Math.max(a, b);
  const total = natural + bonus;
  const novo = { ...atk, natural, total, rolls: [...atk.rolls, a, b], critical: natural === 20, fumble: natural === 1, hit: natural === 20 || (natural !== 1 && total >= ac) };
  enc.say('recurso', `${atacante.name} erra e corrige no meio do golpe: rola de novo com vantagem, ${natural}${novo.hit ? ', e acerta' : ''} (Mestre Duelista).`);
  return novo;
}

// ============================================================ Batedor, Inquisitivo e Mentor

/** MESTRE DA EMBOSCADA (13º): na 1ª rodada, a primeira criatura que o batedor acerta fica exposta até o próximo turno dele. */
export function exporNaEmboscada(enc, atacante, alvo) {
  if (!atacante.features?.includes('ambushMaster') || enc.round !== 1 || atacante.emboscadaUsada || alvo.dead) return;
  atacante.emboscadaUsada = true;
  addCondition(alvo, 'expostoNaEmboscada', { rounds: 1, quando: 'inicio', lado: atacante.side, source: atacante.id });
  enc.say('recurso', `${atacante.name} abre a guarda de ${alvo.name}: todo ataque contra ele tem vantagem até o próximo turno do batedor (Mestre da Emboscada).`);
}

/**
 * GOLPE SÚBITO (17º): depois da ação de Atacar, um ataque a mais como ação bônus; o Ataque Furtivo vale de novo nele se o
 * alvo for outro.
 */
export function golpeSubito(enc, actor, alvo) {
  if (!alvo || actor.bonusUsed || !actor.atacouNoTurno || !actor.actionUsed || !naVez(enc, actor)) return false;
  const arma = actor.equippedWeapon;
  if (!enc.canAttack(actor, alvo, arma).ok) return false;
  actor.bonusUsed = true;
  actor.golpeSubito = true;
  enc.say('recurso', `${actor.name} emenda um golpe súbito (Golpe Súbito).`);
  try { enc.resolveAttackBase(actor, alvo, { weaponId: arma }); } finally { actor.golpeSubito = false; }
  return true;
}
/** O Furtivo de novo no Golpe Súbito: só contra outro alvo. */
export const furtivoDeNovo = (atacante, alvo) => !!atacante.golpeSubito && atacante.sneakUsedThisTurn && atacante.furtivoEm !== alvo.id;

/** COMBATE PERSPICAZ (3º): ação bônus; Intuição contra Enganação. Vencendo, o Furtivo vale contra ele sem vantagem por um minuto. */
export function combatePerspicaz(enc, actor, alvo) {
  if (actor.bonusUsed || !alvo || alvo.dead || alvo.side === actor.side || conditionEffects(alvo).incapacitated || !ve(enc, actor, alvo)) return false;
  actor.bonusUsed = true;
  const a = enc.testeDeAtributo(actor, 'wis', skillBonus(actor, 'intuicao'), 'Intuição', { pericia: 'intuicao' });
  const d = enc.testeDeAtributo(alvo, 'cha', skillBonus(alvo, 'enganacao'), 'Enganação', { pericia: 'enganacao' });
  if (a.total <= d.total) {
    enc.say('recurso', `${actor.name} não lê ${alvo.name} (Intuição ${a.total} contra Enganação ${d.total}).`);
    return true;
  }
  for (const c of enc.combatants) if (getCondition(c, 'combatePerspicaz')?.source === actor.id) removeCondition(c, 'combatePerspicaz');
  addCondition(alvo, 'combatePerspicaz', { rounds: 10, source: actor.id });
  enc.say('recurso', `${actor.name} lê os movimentos de ${alvo.name} (Combate Perspicaz, ${a.total} contra ${d.total}).`);
  return true;
}
export const leuOAlvo = (atacante, alvo) => getCondition(alvo, 'combatePerspicaz')?.source === atacante.id;

/** OLHO PARA FRAQUEZAS (17º): +3d6 no Furtivo contra quem o Combate Perspicaz leu. */
export function dadosDoFurtivo(atacante, alvo, dados) {
  if (!atacante.features?.includes('eyeForWeakness') || !leuOAlvo(atacante, alvo)) return dados;
  const m = /^(\d+)d(\d+)$/.exec(String(dados));
  return m ? `${Number(m[1]) + 3}d${m[2]}` : dados;
}

/**
 * MESTRE DA TÁTICA (3º): a ação Ajudar como ação bônus, num inimigo a até 9 m: o próximo ataque de um aliado contra ele, até
 * o próximo turno do mentor, tem vantagem.
 */
export function ajudaDoMentor(enc, actor, alvo) {
  if (actor.bonusUsed || !alvo || alvo.dead || alvo.side === actor.side || distanceFt(actor.pos, alvo.pos) > 30 || !ve(enc, actor, alvo)) return false;
  actor.bonusUsed = true;
  addCondition(alvo, 'ajudaDoMentor', { rounds: 1, quando: 'inicio', lado: actor.side, source: actor.id });
  enc.say('recurso', `${actor.name} aponta a brecha de ${alvo.name}: o próximo aliado que o atacar tem vantagem (Mestre da Tática).`);
  return true;
}
/** O aliado do mentor ataca quem ele apontou: vantagem. */
export function vantagemDaAjuda(enc, atacante, alvo) {
  const m = getCondition(alvo, 'ajudaDoMentor');
  if (!m || m.source === atacante.id) return null;
  const dono = enc.combatants.find((c) => c.id === m.source);
  return dono && dono.side === atacante.side ? dono : null;
}
/** O ataque de verdade gasta a ajuda (a prévia de vantagem não). */
export function gastarAjuda(enc, atacante, alvo) {
  if (vantagemDaAjuda(enc, atacante, alvo)) removeCondition(alvo, 'ajudaDoMentor');
}

/**
 * DESORIENTAÇÃO (13º): o mentor é alvo de um ataque e há uma criatura a 1,5 m dele, entre ele e quem ataca, dando cobertura:
 * a reação passa o ataque para ela. No jogo, só para inimigos dele.
 */
export function desorientacao(enc, atacante, alvo) {
  if (!alvo.features?.includes('misdirection') || alvo.reactionUsed || !desperto(alvo) || atacante.side === alvo.side || !atacante.pos || !alvo.pos) return null;
  const vx = alvo.pos.x - atacante.pos.x;
  const vy = alvo.pos.y - atacante.pos.y;
  const dAlvo = distanceFt(atacante.pos, alvo.pos);
  const escudo = enc.combatants.filter((c) => c !== atacante && c !== alvo && !c.dead && c.pos && c.side !== alvo.side
    && distanceFt(c.pos, alvo.pos) <= 5 && distanceFt(atacante.pos, c.pos) < dAlvo
    && ((c.pos.x - atacante.pos.x) * vx + (c.pos.y - atacante.pos.y) * vy) > 0
    // perto da reta: o desvio dela até a criatura não passa de uma casa
    && Math.abs((c.pos.x - atacante.pos.x) * vy - (c.pos.y - atacante.pos.y) * vx) / Math.max(1, Math.hypot(vx, vy)) <= 1)
    .sort((a, b) => distanceFt(atacante.pos, a.pos) - distanceFt(atacante.pos, b.pos))[0];
  if (!escudo) return null;
  alvo.reactionUsed = true;
  enc.say('recurso', `${alvo.name} se esquiva para trás de ${escudo.name}: o ataque de ${atacante.name} vai nele (Desorientação).`);
  return escudo;
}

// ============================================================ hooks gerais: ser acertado, o deslocamento, o fim do turno

/**
 * Depois que `atacante` ACERTA `alvo` com um ataque: a TEMPESTADE FURIOSA do deserto, o ESCUDO SOLAR (Alma Solar, 17º) e a
 * REPREENSÃO DESDENHOSA (Conquista, 15º).
 */
export function depoisDeSerAcertado(enc, alvo, atacante, { corpoACorpo = false } = {}) {
  if (atacante.dead || alvo.side === atacante.side) return;
  depoisDeSerAcertadoLivros2(enc, alvo, atacante, { corpoACorpo });
  tempestadeFuriosaAoSerAcertado(enc, alvo, atacante);
  // ESCUDO SOLAR: a luz acesa, o golpe de perto que acerta leva 5 + SAB de radiante (reação)
  if (corpoACorpo && !atacante.dead && alvo.features?.includes('sunShield') && alvo.luzPropria && !alvo.reactionUsed && desperto(alvo)) {
    alvo.reactionUsed = true;
    const dano = 5 + abilityMod(alvo.abilities?.wis ?? 10);
    enc.say('recurso', `A luz de ${alvo.name} queima ${atacante.name}: ${dano} de radiante (Escudo Solar).`);
    enc.outraFonte(() => enc.applyDamage(atacante, dano, 'radiante', alvo, { magico: true }));
  }
  // SURTO SELVAGEM do bárbaro (a retaliação)
  retaliacaoDoSurto(enc, alvo, atacante);
  // FÚRIA DA TEMPESTADE (Feitiçaria da Tempestade, 14º): o golpe de perto leva o raio
  if (corpoACorpo && !atacante.dead) furiaDaTempestade(enc, alvo, atacante);
  // REPREENSÃO DESDENHOSA: quem acerta o paladino leva CAR de psíquico, sem teste
  if (!atacante.dead && alvo.features?.includes('scornfulRebuke') && desperto(alvo)) {
    const dano = Math.max(1, abilityMod(alvo.abilities?.cha ?? 10));
    enc.say('recurso', `${atacante.name} sente o desprezo de ${alvo.name}: ${dano} de psíquico (Repreensão Desdenhosa).`);
    enc.outraFonte(() => enc.applyDamage(atacante, dano, 'psíquico', alvo, { magico: true }));
  }
}

/** O deslocamento que as subclasses mudam: 0 na AURA DE CONQUISTA para quem o paladino amedronta; +3 m do EMBOSCADOR TEMÍVEL na 1ª rodada. */
export function ajusteDoDeslocamento(enc, actor) {
  for (const p of enc.combatants) {
    if (!p.features?.includes('auraOfConquest') || p.dead || !desperto(p) || !p.pos || !actor.pos) continue;
    const medo = (actor.conditions ?? []).some((c) => c.id === 'amedrontado' && c.source === p.id);
    if (medo && distanceFt(p.pos, actor.pos) <= (p.raioDaAuraDeConquista ?? 10) && ve(enc, p, actor)) return { zera: true };
  }
  // as FLORES E VINHAS do surto do bárbaro: terreno difícil a 4,5 m dele (no jogo, metade do deslocamento)
  if (presoNasFlores(enc, actor)) return { metade: true };
  // e a AURA DE PRONTIDÃO (Glória, Tasha): +3 m no paladino e em quem começou o turno colado nele
  return { soma: (actor.features?.includes('dreadAmbusher') && enc.round === 1 ? 10 : 0) + deslocamentoDaProntidao(actor) + deslocamentoDaCancao(actor) };
}

/** Começo do turno do lado: quem o paladino da Conquista amedronta e começa o turno na aura dele leva psíquico (metade do nível). */
export function auraDeConquistaNoInicio(enc, side) {
  for (const p of enc.combatants) {
    if (!p.features?.includes('auraOfConquest') || p.dead || !desperto(p) || p.side === side || !p.pos) continue;
    for (const c of enc.allOf(side)) {
      if (c.dead || !c.pos || !(c.conditions ?? []).some((k) => k.id === 'amedrontado' && k.source === p.id)) continue;
      if (distanceFt(p.pos, c.pos) > (p.raioDaAuraDeConquista ?? 10) || !ve(enc, p, c)) continue;
      const dano = Math.floor((p.level ?? 7) / 2);
      enc.say('recurso', `${c.name} começa o turno com medo dentro da aura de ${p.name}: ${dano} de psíquico (Aura de Conquista).`);
      enc.applyDamage(c, dano, 'psíquico', p, { magico: true });
    }
  }
}

/** Fim do turno do lado: o ESPÍRITO PROTETOR (Redenção, 15º) e a volta do PASSO ETÉREO (Andarilho do Horizonte). */
export function fimDoLadoDosLivros(enc, side) {
  espiritoGuardiao(enc, side);
  santuarioNoFim(enc, side);
  for (const c of enc.allOf(side)) {
    if (c.dead) continue;
    if (c.passoEtereoAte === enc.turnoKey() && hasCondition(c, 'etereo')) { delete c.passoEtereoAte; enc.voltarDoEtereo(c); }
    if (c.features?.includes('protectiveSpirit') && !enc.over && !enc.explorando && desperto(c) && c.hp > 0 && c.hp < c.maxHp / 2) {
      const r = damageRoll(enc.rng, `1d6+${Math.floor((c.level ?? 15) / 2)}`);
      const pv = enc.heal(c, r.total, c);
      if (pv) enc.say('cura', `${c.name} termina o turno ferido, e o espírito do juramento o refaz: +${pv} PV (Espírito Protetor).`);
    }
  }
}

// ============================================================ Caminho do Mestre Bêbado

/** TÉCNICA DO BÊBADO (3º): a Rajada de Golpes dá Desengajar e +3 m neste turno. */
export function tecnicaDoBebado(enc, actor) {
  if (!actor.features?.includes('drunkenTechnique')) return;
  actor.disengaging = true;
  actor.movementLeftFt = (actor.movementLeftFt ?? 0) + 10;
  enc.say('recurso', `${actor.name} cambaleia entre os golpes: sai de perto sem provocar e ganha 3 m (Técnica do Bêbado).`);
}

/**
 * FRENESI EMBRIAGADO (17º): a Rajada faz até cinco golpes, desde que cada um mire uma criatura diferente. Devolve os alvos dos
 * golpes: só o alvo (o par de golpes de sempre) quando não há outro inimigo colado no monge.
 */
export function alvosDaRajada(enc, actor, alvo) {
  if (!actor.features?.includes('intoxicatedFrenzy')) return null;
  const outros = enc.enemiesOf(actor).filter((e) => e !== alvo && !e.dead && e.pos && distanceFt(actor.pos, e.pos) <= 5).slice(0, 4);
  return outros.length ? [alvo, ...outros] : null;
}

/** OSCILAR EMBRIAGADO (6º): levantar custa 1,5 m. */
export const levantaComSalto = (c) => !!c.features?.includes('tipsySway');

/**
 * REDIRECIONAR ATAQUE (6º): o golpe de perto que erra o monge acerta outra criatura colada nele (não quem atacou), por 1 ki e a
 * reação. Devolve a criatura, ou null.
 */
export function redirecionarAtaque(enc, alvo, atacante) {
  if (!alvo.features?.includes('tipsySway') || alvo.reactionUsed || !(alvo.resources?.ki > 0) || !desperto(alvo) || !alvo.pos) return null;
  const outro = enc.combatants.filter((c) => c !== alvo && c !== atacante && !c.dead && c.side !== alvo.side && c.pos && distanceFt(c.pos, alvo.pos) <= 5)[0];
  if (!outro) return null;
  alvo.reactionUsed = true;
  alvo.resources.ki -= 1;
  enc.say('recurso', `${alvo.name} gira para o lado, e o golpe de ${atacante.name} acerta ${outro.name} (Redirecionar Ataque, 1 ki).`);
  return outro;
}

/** SORTE DO BÊBADO (11º): 2 de ki tiram a desvantagem de um ataque ou de uma resistência. Devolve true quando tira. */
export function sorteDoBebado(enc, actor) {
  if (!actor.features?.includes('drunkardsLuck') || (actor.resources?.ki ?? 0) < 2) return false;
  actor.resources.ki -= 2;
  enc.say('recurso', `${actor.name} tropeça na hora certa: a desvantagem some (Sorte do Bêbado, 2 ki).`);
  return true;
}

// ============================================================ Caminho do Kensei

export const armaKensei = (actor, id) => !!actor.armasKensei?.includes(id);

/** UM COM A LÂMINA (6º): a arma kensei é mágica. */
export const kenseiMagica = (actor, w) => !!w && actor.features?.includes('oneWithTheBlade') && armaKensei(actor, w.id);

/** APARO ÁGIL (3º): o golpe desarmado da ação de Atacar, com a arma kensei de perto na mão, dá +2 de CA até o próximo turno. */
export function aparoAgil(enc, atacante, weaponId, { opportunity = false } = {}) {
  if (!atacante.features?.includes('agileParry') || opportunity || weaponId !== 'punhos' || !naVez(enc, atacante)) return;
  const mao = atacante.equippedWeapon;
  if (!armaKensei(atacante, mao) || WEAPONS[mao]?.ranged || hasCondition(atacante, 'aparoAgil')) return;
  addCondition(atacante, 'aparoAgil', { rounds: 1, quando: 'inicio', lado: atacante.side, source: atacante.id });
  enc.say('recurso', `${atacante.name} golpeia com o punho e guarda com a lâmina: +2 de CA (Aparo Ágil).`);
}

/** TIRO DO KENSEI (3º): ação bônus; até o fim do turno, o acerto à distância com arma kensei soma 1d4. */
export function tiroDoKensei(enc, actor) {
  if (actor.bonusUsed || hasCondition(actor, 'tiroDoKensei')) return false;
  actor.bonusUsed = true;
  addCondition(actor, 'tiroDoKensei', { rounds: 1, quando: 'fim', lado: actor.side, source: actor.id });
  enc.say('recurso', `${actor.name} firma a mira (Tiro do Kensei).`);
  return true;
}

/** Os dados que a arma kensei soma no acerto: o Tiro do Kensei e o GOLPE HÁBIL (Um com a Lâmina, interruptor, 1 ki, uma vez por turno). */
export function extrasDoKensei(enc, atacante, extra, { ranged = false, tipo } = {}) {
  const arma = atacante.armaDoGolpeAgora;
  if (!armaKensei(atacante, arma)) return;
  if (ranged && hasCondition(atacante, 'tiroDoKensei')) extra('Tiro do Kensei', '1d4', tipo, false);
  if (atacante.golpeHabilLigado && atacante.features?.includes('oneWithTheBlade') && (atacante.resources?.ki ?? 0) > 0 && naVez(enc, atacante)) {
    const vez = enc.turnoKey();
    if (atacante.golpeHabilEm === vez) return;
    atacante.golpeHabilEm = vez;
    atacante.resources.ki -= 1;
    extra('Golpe Hábil (1 ki)', `1${atacante.dadoDeArtesMarciais ?? 'd6'}`, tipo, true);
  }
}

/** AFIAR A LÂMINA (11º): ação bônus e até 3 de ki; a arma kensei na mão ganha +1 por ki no ataque e no dano, por 1 minuto. */
export function afiarALamina(enc, actor, quanto) {
  const n = Math.min(3, Math.max(1, Number(quanto) || 1));
  const arma = actor.equippedWeapon;
  if (actor.bonusUsed || (actor.resources?.ki ?? 0) < n || !armaKensei(actor, arma) || WEAPONS[arma]?.bonusAtaque) return false;
  actor.bonusUsed = true;
  actor.resources.ki -= n;
  addCondition(actor, 'laminaAfiada', { rounds: 10, source: actor.id, data: { bonus: n, arma } });
  enc.say('recurso', `${actor.name} afia ${WEAPONS[arma]?.name ?? 'a arma'} com ${n} de ki: +${n} no ataque e no dano por um minuto (Afiar a Lâmina).`);
  return true;
}
/** A arma afiada no perfil do golpe. */
export function armaAfiada(actor, w) {
  const a = getCondition(actor, 'laminaAfiada');
  if (!a || !w || w.id !== a.data?.arma || w.bonusAtaque) return w;
  return { ...w, bonusAtaque: a.data.bonus, bonusDano: (w.bonusDano ?? 0) + a.data.bonus };
}

/** PRECISÃO INFALÍVEL (17º): uma vez por turno, o erro com arma de monge se rola de novo. */
export function precisaoInfalivel(enc, atacante, atk, bonus, ac, deMonge) {
  if (atk.hit || !deMonge || !atacante.features?.includes('unerringAccuracy') || !naVez(enc, atacante)) return atk;
  const vez = enc.turnoKey();
  if (atacante.precisaoEm === vez) return atk;
  atacante.precisaoEm = vez;
  const natural = enc.rng.die(20);
  const total = natural + bonus;
  const novo = { ...atk, natural, total, rolls: [...atk.rolls, natural], critical: natural === 20, fumble: natural === 1, hit: natural === 20 || (natural !== 1 && total >= ac) };
  enc.say('recurso', `${atacante.name} corrige o golpe no meio: ${natural}${novo.hit ? ', e acerta' : ''} (Precisão Infalível).`);
  return novo;
}

// ============================================================ Caminho da Alma Solar

/** O RAIO DE SOL é arma de monge (o dado de Artes Marciais e a Destreza). */
export const ehRaioSolar = (id) => id === 'raioSolar';

/** Depois de usar o raio na ação de Atacar, 1 ki solta mais dois como ação bônus. */
export function raiosDeBonus(enc, actor, alvo) {
  const vez = enc.turnoKey();
  if (!alvo || alvo.dead || actor.bonusUsed || !(actor.resources?.ki > 0) || actor.acaoDeAtaque?.turno !== vez || !actor.acaoDeAtaque.armas.includes('raioSolar')) return false;
  if (!enc.canAttack(actor, alvo, 'raioSolar').ok) return false;
  actor.bonusUsed = true;
  actor.resources.ki -= 1;
  enc.say('recurso', `${actor.name} gasta 1 ki e solta mais dois raios de sol.`);
  enc.resolveAttackBase(actor, alvo, { weaponId: 'raioSolar' });
  if (!alvo.dead) enc.resolveAttackBase(actor, alvo, { weaponId: 'raioSolar' });
  return true;
}

// ============================================================ Juramento de Conquista

/** PRESENÇA CONQUISTADORA (3º): ação e Canalizar Divindade; inimigos a 9 m testam Sabedoria ou ficam amedrontados (1 minuto, repetindo). */
export function presencaConquistadora(enc, actor) {
  if (actor.actionUsed || !(actor.resources?.channelDivinity > 0)) return false;
  actor.actionUsed = true;
  actor.resources.channelDivinity -= 1;
  const dc = spellSaveDc(actor);
  const alvos = enc.enemiesOf(actor).filter((e) => !e.dead && e.pos && distanceFt(actor.pos, e.pos) <= 30 && ve(enc, actor, e));
  enc.say('recurso', `${actor.name} ergue a voz de conquistador (Presença Conquistadora).`);
  for (const t of alvos) {
    const sv = enc.resistencia(t, 'wis', dc, { contra: { magico: true, condicao: 'amedrontado', conjurador: actor } });
    enc.explicarResistencia(t, 'wis', dc, sv, { contra: `Presença Conquistadora de ${actor.name}`, seSucesso: 'não se intimida' });
    if (!sv.success && enc.aplicarCondicao(t, 'amedrontado', { rounds: 10, source: actor.id, data: { save: 'wis', dc, repete: true } })) {
      enc.say('condicao', `${t.name} fica amedrontado por ${actor.name}.`);
    }
  }
  return true;
}

/** CONQUISTADOR INVENCÍVEL (20º): ação, 1 minuto: resistência a todo dano, um ataque a mais e crítico com 19. */
export function conquistadorInvencivel(enc, actor) {
  if (actor.actionUsed || !(actor.resources?.invincibleConqueror > 0)) return false;
  actor.actionUsed = true;
  actor.resources.invincibleConqueror -= 1;
  addCondition(actor, 'conquistadorInvencivel', { rounds: 10, source: actor.id });
  enc.say('recurso', `${actor.name} vira o conquistador invencível por um minuto.`);
  return true;
}

// ============================================================ Juramento da Redenção

/** EMISSÁRIO DA PAZ (3º): ação bônus e Canalizar Divindade; +5 em Persuasão por 10 minutos. */
export function emissarioDaPaz(enc, actor) {
  if (actor.bonusUsed || !(actor.resources?.channelDivinity > 0)) return false;
  actor.bonusUsed = true;
  actor.resources.channelDivinity -= 1;
  addCondition(actor, 'emissarioDaPaz', { rounds: 100, source: actor.id });
  enc.say('recurso', `${actor.name} fala com a voz da paz: +5 em Persuasão por dez minutos (Emissário da Paz).`);
  return true;
}

/**
 * O dano que a REDENÇÃO muda, na ordem: a AURA DO GUARDIÃO (7º) toma para o paladino o golpe que derrubaria um aliado a 3 m;
 * o EMISSÁRIO DA REDENÇÃO (20º) resiste ao dano de quem o paladino não feriu. Devolve o dano que fica no alvo.
 */
export function danoNaRedencao(enc, alvo, fonte, amount, antesDoTipo, { transferido = false } = {}) {
  if (amount <= 0) return amount;
  if (!transferido && fonte !== alvo) {
    const g = enc.combatants.find((p) => p !== alvo && p.side === alvo.side && p.features?.includes('auraOfTheGuardian') && !p.reactionUsed && desperto(p)
      && p.pos && alvo.pos && distanceFt(p.pos, alvo.pos) <= (p.raioDaAuraDoGuardiao ?? 10) && amount >= alvo.hp + (alvo.tempHp ?? 0) && p.hp > amount + 5);
    if (g) {
      g.reactionUsed = true;
      enc.say('recurso', `${g.name} toma para si o golpe que derrubaria ${alvo.name}: ${amount} de dano (Aura do Guardião).`);
      enc.applyDamage(g, amount, null, fonte, { transferido: true });
      return 0;
    }
  }
  if (alvo.features?.includes('emissaryOfRedemption') && fonte && fonte !== alvo && !(alvo.redencaoQuebrada ?? []).includes(fonte.id) && amount >= antesDoTipo) {
    const novo = amount > antesDoTipo ? antesDoTipo : Math.floor(amount / 2);
    enc.say('recurso', `${alvo.name} não guarda rancor de ${fonte.name}: ${amount} vira ${novo} (Emissário da Redenção).`);
    return novo;
  }
  return amount;
}

/** Depois do dano: quem o paladino feriu perde o Emissário contra ele; quem acerta o Emissário leva metade em radiante; e a REPREENSÃO. */
export function depoisDoDanoNaRedencao(enc, alvo, fonte, amount, { deAtaque = false } = {}) {
  if (!fonte || fonte === alvo || amount <= 0) return;
  if (fonte.features?.includes('emissaryOfRedemption')) (fonte.redencaoQuebrada ??= []).includes(alvo.id) || fonte.redencaoQuebrada.push(alvo.id);
  if (deAtaque && alvo.features?.includes('emissaryOfRedemption') && !(alvo.redencaoQuebrada ?? []).includes(fonte.id) && !fonte.dead && !enc.refletindo) {
    const volta = Math.floor(amount / 2);
    if (volta > 0) {
      enc.refletindo = true;
      try {
        enc.say('recurso', `A luz de ${alvo.name} devolve o golpe: ${volta} de radiante em ${fonte.name} (Emissário da Redenção).`);
        enc.applyDamage(fonte, volta, 'radiante', alvo, { magico: true });
      } finally { enc.refletindo = false; }
    }
  }
  // REPREENDER OS VIOLENTOS (3º): reação e Canalizar Divindade; quem fere outro com um ataque a 9 m do paladino testa SAB e
  // leva radiante igual ao que causou (metade se passa). No jogo, no golpe de 10 ou mais, ou no que derrubou.
  if (!deAtaque || fonte.dead || enc.refletindo) return;
  const p = enc.combatants.find((c) => c !== alvo && c !== fonte && c.side === alvo.side && c.side !== fonte.side && c.features?.includes('rebukeTheViolent')
    && (c.resources?.channelDivinity ?? 0) > 0 && !c.reactionUsed && desperto(c) && c.pos && fonte.pos && distanceFt(c.pos, fonte.pos) <= 30 && ve(enc, c, fonte));
  if (!p || (amount < 10 && alvo.hp > 0)) return;
  p.reactionUsed = true;
  p.resources.channelDivinity -= 1;
  const dc = spellSaveDc(p);
  const sv = enc.resistencia(fonte, 'wis', dc, { contra: { magico: true, conjurador: p } });
  enc.explicarResistencia(fonte, 'wis', dc, sv, { contra: `Repreender os Violentos de ${p.name}`, seSucesso: 'metade do dano' });
  const dano = sv.success ? Math.floor(amount / 2) : amount;
  enc.refletindo = true;
  try {
    enc.say('recurso', `${p.name} repreende ${fonte.name} pela violência: ${dano} de radiante (Repreender os Violentos).`);
    enc.applyDamage(fonte, dano, 'radiante', p, { magico: true });
  } finally { enc.refletindo = false; }
}

// ============================================================ Perseguidor Sombrio

/** EMBOSCADOR TEMÍVEL (3º): na 1ª rodada, a ação de Atacar ganha um ataque a mais, que soma 1d8 se acertar. */
export function golpeDoEmboscador(enc, actor, alvo, arma) {
  if (!actor.features?.includes('dreadAmbusher') || enc.round !== 1 || actor.emboscadorUsado || !naVez(enc, actor) || actor.dead || alvo.dead) return;
  if (!enc.canAttack(actor, alvo, arma).ok) return;
  actor.emboscadorUsado = true;
  actor.golpeDoEmboscadorAgora = true;
  enc.say('recurso', `${actor.name} ataca de novo, das sombras (Emboscador Temível).`);
  try { enc.resolveAttack(actor, alvo, { weaponId: arma }); } finally { actor.golpeDoEmboscadorAgora = false; }
}

/** RAJADA DO PERSEGUIDOR (11º): uma vez por turno, o ataque com arma que erra vira outro ataque, na mesma ação. */
export function rajadaDoPerseguidor(enc, actor, resultado) {
  if (!actor.features?.includes('stalkersFlurry') || resultado?.hit !== false || !naVez(enc, actor)) return false;
  const vez = enc.turnoKey();
  if (actor.rajadaPerseguidorEm === vez) return false;
  actor.rajadaPerseguidorEm = vez;
  enc.say('recurso', `${actor.name} erra e emenda outro golpe (Rajada do Perseguidor).`);
  return true;
}

/** ESQUIVA SOMBRIA (15º): reação; o ataque sem vantagem contra ele ganha desvantagem. Devolve true quando usa. */
export function esquivaSombria(enc, alvo, atacante, mods) {
  if (!alvo.features?.includes('shadowyDodge') || alvo.reactionUsed || !desperto(alvo) || atacante.side === alvo.side || mods.advantage || mods.disadvantage) return false;
  alvo.reactionUsed = true;
  return true;
}

// ============================================================ Andarilho do Horizonte

/** GUERREIRO PLANAR (3º): ação bônus; o próximo acerto de arma neste turno contra quem ele escolheu vira energético e soma 1d8 (2d8 no 11º). */
export function guerreiroPlanar(enc, actor, alvo) {
  if (actor.bonusUsed || !alvo || alvo.dead || alvo.side === actor.side || distanceFt(actor.pos, alvo.pos) > 30 || !ve(enc, actor, alvo)) return false;
  actor.bonusUsed = true;
  addCondition(alvo, 'guerreiroPlanar', { rounds: 1, quando: 'fim', lado: actor.side, source: actor.id });
  enc.say('recurso', `${actor.name} chama a energia dos planos contra ${alvo.name} (Guerreiro Planar).`);
  return true;
}
/** O acerto de arma do andarilho no marcado: devolve os dados de energético (e tira a marca), ou null. */
export function golpePlanar(enc, atacante, alvo) {
  const m = getCondition(alvo, 'guerreiroPlanar');
  if (!m || m.source !== atacante.id) return null;
  removeCondition(alvo, 'guerreiroPlanar');
  return atacante.dadosDoGuerreiroPlanar ?? '1d8';
}

/** PASSO ETÉREO (7º): ação bônus, uma vez por descanso curto; etéreo até o fim do turno. */
export function passoEtereo(enc, actor) {
  if (actor.bonusUsed || !(actor.resources?.etherealStep > 0) || hasCondition(actor, 'etereo')) return false;
  actor.bonusUsed = true;
  actor.resources.etherealStep -= 1;
  addCondition(actor, 'etereo', { data: { origem: { ...actor.pos } } });
  actor.passoEtereoAte = enc.turnoKey();
  enc.say('recurso', `${actor.name} passa para o Plano Etéreo até o fim do turno (Passo Etéreo).`);
  return true;
}

/**
 * GOLPE DISTANTE (11º): na ação de Atacar, antes de cada ataque, um teleporte de até 3 m; atacando duas criaturas diferentes
 * na ação, um ataque a mais contra uma terceira. No jogo: um golpe da ação, depois de saltar para a casa livre ao lado do
 * alvo (se ela fica a 3 m), e o terceiro ataque entra sozinho na conta da ação.
 */
export function golpeDistante(enc, actor, alvo) {
  if (!alvo || alvo.dead || alvo.side === actor.side || !naVez(enc, actor)) return false;
  const vez = enc.turnoKey();
  const registro = actor.golpeDistante?.vez === vez ? actor.golpeDistante : (actor.golpeDistante = { vez, alvos: [], terceiro: false });
  if (registro.terceiro && registro.alvos.includes(alvo.id)) return false;
  const arma = actor.equippedWeapon;
  const ranged = WEAPONS[arma]?.ranged;
  if (!ranged && distanceFt(actor.pos, alvo.pos) > 5) {
    const casa = vizinhasLivres(enc, actor, alvo).find((c) => distanceFt(actor.pos, c) <= 10 && enc.field.hasLineOfSight(actor.pos, c));
    if (!casa) return false;
    const de = { ...actor.pos };
    actor.pos = { x: casa.x, y: casa.y, f: actor.pos.f ?? 1 };
    enc.say('recurso', `${actor.name} some e reaparece ao lado de ${alvo.name} (Golpe Distante).`);
    enc.onEvent({ type: 'teleporte', target: actor, de, to: { ...actor.pos } });
  }
  if (!enc.canAttack(actor, alvo, arma).ok) return false;
  const porque = enc.gastarGolpeDoAtaque(actor);
  if (porque) return false;
  enc.resolveAttack(actor, alvo, { weaponId: arma });
  if (!registro.alvos.includes(alvo.id)) registro.alvos.push(alvo.id);
  if (registro.alvos.length >= 2 && !registro.terceiro) {
    registro.terceiro = true;
    actor.ataquesRestantes = (actor.ataquesRestantes ?? 0) + 1;
    enc.say('recurso', `${actor.name} ganha um ataque a mais, contra uma terceira criatura (Golpe Distante).`);
  }
  return true;
}
function vizinhasLivres(enc, actor, alvo) {
  const out = [];
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
    if (!dx && !dy) continue;
    const c = { x: alvo.pos.x + dx, y: alvo.pos.y + dy };
    if (!enc.field.inside(c.x, c.y) || enc.field.blocksMove(c.x, c.y) || enc.occupied(c.x, c.y, actor)) continue;
    out.push(c);
  }
  return out.sort((a, b) => distanceFt(actor.pos, a) - distanceFt(actor.pos, b));
}

/** DEFESA ESPECTRAL (15º): reação; o golpe que acerta é resistido. No jogo, no golpe de 10 ou mais. */
export function defesaEspectral(enc, alvo, atacante, total) {
  if (!alvo.features?.includes('spectralDefense') || alvo.reactionUsed || !desperto(alvo) || total < 10 || atacante.side === alvo.side) return false;
  alvo.reactionUsed = true;
  alvo.resisteAoGolpe = true;
  enc.say('recurso', `${alvo.name} se desfaz em parte entre os planos e amortece o golpe (Defesa Espectral).`);
  return true;
}

// ============================================================ Matador de Monstros

/** SENTIDO DO CAÇADOR (3º): ação; descobre as imunidades, resistências e vulnerabilidades de uma criatura a 18 m. */
export function sentidoDoCacador(enc, actor, alvo) {
  if (actor.actionUsed || !(actor.resources?.huntersSense > 0) || !alvo || alvo.dead || distanceFt(actor.pos, alvo.pos) > 60 || !ve(enc, actor, alvo)) return false;
  actor.actionUsed = true;
  actor.resources.huntersSense -= 1;
  const lista = (rotulo, xs) => (xs?.length ? `${rotulo}: ${xs.join(', ')}` : null);
  const partes = [lista('imune a', alvo.immune), lista('resiste a', alvo.resist), lista('resiste ao golpe não mágico de', alvo.resistNaoMagico), lista('vulnerável a', alvo.vulnerable)].filter(Boolean);
  enc.say('recurso', `${actor.name} estuda ${alvo.name}: ${partes.length ? partes.join('; ') : 'nenhuma imunidade, resistência ou vulnerabilidade'} (Sentido do Caçador).`);
  return true;
}

/** PRESA DO MATADOR (3º): ação bônus; marca uma criatura a 18 m (uma só): o primeiro acerto de arma em cada turno soma 1d6. */
export function presaDoMatador(enc, actor, alvo) {
  if (actor.bonusUsed || !alvo || alvo.dead || distanceFt(actor.pos, alvo.pos) > 60 || !ve(enc, actor, alvo)) return false;
  actor.bonusUsed = true;
  for (const c of enc.combatants) if (getCondition(c, 'presaDoMatador')?.source === actor.id) removeCondition(c, 'presaDoMatador');
  addCondition(alvo, 'presaDoMatador', { rounds: Infinity, source: actor.id });
  enc.say('recurso', `${actor.name} marca ${alvo.name} como presa (Presa do Matador).`);
  return true;
}
export const ehPresaDe = (alvo, matador) => getCondition(alvo, 'presaDoMatador')?.source === matador?.id;
export function extraDaPresa(enc, atacante, alvo, extra, tipo) {
  if (!ehPresaDe(alvo, atacante)) return;
  const vez = enc.turnoKey();
  if (atacante.presaDoMatadorEm === vez) return;
  atacante.presaDoMatadorEm = vez;
  extra('Presa do Matador', '1d6', tipo, false);
}

/** DEFESA SOBRENATURAL (7º): +1d6 na resistência que a presa obriga. */
export function bonusContraAPresa(enc, actor, forcador) {
  if (!forcador || !actor.features?.includes('supernaturalDefense') || !ehPresaDe(forcador, actor)) return 0;
  return damageRoll(enc.rng, '1d6').total;
}

/**
 * CONTRA-ATAQUE DO MATADOR (15º): a presa obriga a uma resistência; a reação é um ataque com arma contra ela antes do teste,
 * e o acerto faz passar sozinho. Devolve true quando o ataque acertou.
 */
export function contraAtaqueDoMatador(enc, actor, forcador) {
  if (!forcador || forcador.dead || !actor.features?.includes('slayersCounter') || !ehPresaDe(forcador, actor) || actor.reactionUsed || !desperto(actor)) return false;
  const arma = actor.equippedWeapon;
  if (!enc.canAttack(actor, forcador, arma).ok) return false;
  actor.reactionUsed = true;
  enc.say('recurso', `${actor.name} golpeia ${forcador.name} antes do efeito (Contra-Ataque do Matador).`);
  const r = enc.resolveAttackBase(actor, forcador, { weaponId: arma, opportunity: true });
  return !!r?.hit;
}

/** NÊMESIS DOS CONJURADORES (11º): reação, uma vez por descanso curto; o conjurador a 18 m testa SAB ou perde a magia. */
export function nemesisDosConjuradores(enc, conjurador, spell) {
  for (const r of enc.combatants) {
    if (r.side === conjurador.side || r.side === 'neutro' || !r.features?.includes('magicUsersNemesis') || !(r.resources?.magicUsersNemesis > 0)) continue;
    if (r.reactionUsed || !desperto(r) || !r.pos || !conjurador.pos || distanceFt(r.pos, conjurador.pos) > 60 || !ve(enc, r, conjurador)) continue;
    r.reactionUsed = true;
    r.resources.magicUsersNemesis -= 1;
    const dc = spellSaveDc(r);
    const sv = enc.resistencia(conjurador, 'wis', dc, { contra: { magico: true, conjurador: r } });
    enc.explicarResistencia(conjurador, 'wis', dc, sv, { contra: `Nêmesis dos Conjuradores de ${r.name}`, seSucesso: 'a magia sai' });
    if (!sv.success) {
      enc.say('magia', `${r.name} corta a conjuração de ${conjurador.name}: ${spell.name} se perde (Nêmesis dos Conjuradores).`);
      return true;
    }
    return false;
  }
  return false;
}

// ============================================================ Círculo dos Sonhos

/**
 * BÁLSAMO DA CORTE DE VERÃO (2º): ação bônus; até metade do nível de d6 da reserva (que tem o nível), numa criatura a 36 m:
 * cura a soma, e 1 PV temporário por dado. No jogo, vai o que falta curar, até o teto.
 */
export function balsamoDaCorte(enc, actor, alvo, quantos = null) {
  const reserva = actor.resources?.balmOfTheSummerCourt ?? 0;
  if (actor.bonusUsed || reserva <= 0 || !alvo || alvo.dead || alvo.side !== actor.side || distanceFt(actor.pos, alvo.pos) > 120 || !ve(enc, actor, alvo)) return false;
  const teto = Math.min(reserva, Math.max(1, Math.floor((actor.level ?? 2) / 2)));
  const falta = Math.max(1, Math.ceil(((alvo.maxHp ?? 1) - Math.max(0, alvo.hp)) / 3.5));
  const n = Math.min(teto, Number(quantos) || falta);
  actor.bonusUsed = true;
  actor.resources.balmOfTheSummerCourt -= n;
  const r = damageRoll(enc.rng, `${n}d6`);
  const pv = enc.heal(alvo, r.total, actor);
  alvo.tempHp = Math.max(alvo.tempHp ?? 0, n);
  enc.say('cura', `${actor.name} sopra o bálsamo da corte de verão em ${alvo.name}: +${pv} PV e ${n} PV temporários (Bálsamo da Corte de Verão).`, `${n}d6[${r.rolls.join('+')}]`);
  return true;
}

// ============================================================ Círculo do Pastor

/**
 * TOTEM ESPIRITUAL (2º): ação bônus, uma vez por descanso curto; um espírito com aura de 9 m por 1 minuto. Urso: PV temporários
 * (5 + nível) aos aliados na aura ao chegar, e vantagem deles em Força. Falcão: a reação do druida dá vantagem num ataque de
 * aliado contra quem está na aura. Unicórnio: a cura de magia com espaço do druida cura também, pelo nível dele, cada aliado
 * na aura. No jogo, o espírito nasce na casa do druida.
 */
export function totemEspiritual(enc, actor, tipo) {
  if (actor.bonusUsed || !(actor.resources?.spiritTotem > 0) || !['urso', 'falcao', 'unicornio'].includes(tipo)) return false;
  actor.bonusUsed = true;
  actor.resources.spiritTotem -= 1;
  enc.totens = (enc.totens ?? []).filter((t) => t.dono !== actor);
  const totem = { dono: actor, tipo, pos: { ...actor.pos }, ate: enc.round + 10 };
  enc.totens.push(totem);
  const nome = { urso: 'do urso', falcao: 'do falcão', unicornio: 'do unicórnio' }[tipo];
  enc.say('recurso', `${actor.name} chama o espírito ${nome} (Totem Espiritual).`);
  if (tipo === 'urso') {
    const pv = 5 + (actor.level ?? 2);
    for (const c of aliadosNoTotem(enc, totem)) c.tempHp = Math.max(c.tempHp ?? 0, pv);
    enc.say('recurso', `O urso espiritual guarda quem está perto: ${pv} PV temporários.`);
  }
  return true;
}
function totemVivo(enc, t) { return !t.dono.dead && desperto(t.dono) && enc.round <= t.ate; }
const aliadosNoTotem = (enc, t) => enc.combatants.filter((c) => c.side === t.dono.side && !c.dead && c.pos && distanceFt(c.pos, t.pos) <= 30 && enc.field.hasLineOfSight(t.pos, c.pos));
/** O totem do tipo pedido que cobre `c`, se houver. */
export function totemSobre(enc, c, tipo) {
  return (enc.totens ?? []).find((t) => t.tipo === tipo && totemVivo(enc, t) && c.pos && distanceFt(c.pos, t.pos) <= 30 && enc.field.hasLineOfSight(t.pos, c.pos)) ?? null;
}
/** Urso: vantagem nos testes e resistências de Força dos aliados na aura. */
export const forcaDoUrso = (enc, c, hab) => hab === 'str' && !!(enc.totens ?? []).some((t) => t.tipo === 'urso' && t.dono.side === c.side && totemVivo(enc, t) && c.pos && distanceFt(c.pos, t.pos) <= 30);
/** Falcão: a reação do druida dá vantagem ao ataque do aliado contra quem está na aura. Devolve o druida. */
export function olhoDoFalcao(enc, atacante, alvo, mods) {
  if (mods.advantage) return null;
  const t = (enc.totens ?? []).find((x) => x.tipo === 'falcao' && x.dono.side === atacante.side && x.dono !== atacante && totemVivo(enc, x) && !x.dono.reactionUsed
    && alvo.pos && distanceFt(alvo.pos, x.pos) <= 30);
  if (!t) return null;
  t.dono.reactionUsed = true;
  return t.dono;
}
/** Unicórnio: depois de curar com espaço de magia, cada aliado na aura recupera o nível do druida. */
export function curaDoUnicornio(enc, actor, spell, slot) {
  if (!spell || spell.level < 1 || !slot) return;
  const t = (enc.totens ?? []).find((x) => x.tipo === 'unicornio' && x.dono === actor && totemVivo(enc, x));
  if (!t) return;
  const curados = aliadosNoTotem(enc, t).filter((c) => c.hp < c.maxHp);
  for (const c of curados) enc.heal(c, actor.level ?? 2, actor);
  if (curados.length) enc.say('cura', `O unicórnio espiritual espalha a cura: ${curados.map((c) => c.name).join(', ')} recuperam ${actor.level} PV.`);
}
/** ESPÍRITO GUARDIÃO (10º): a fera ou fada que o druida invocou termina o turno na aura e recupera metade do nível dele. */
export function espiritoGuardiao(enc, side) {
  for (const t of enc.totens ?? []) {
    if (!totemVivo(enc, t) || !t.dono.features?.includes('guardianSpirit')) continue;
    for (const c of enc.allOf(side)) {
      if (c.dead || c.invocado?.donoId !== t.dono.id || !['fera', 'feérico', 'fada'].includes(c.tipo) || !c.pos || distanceFt(c.pos, t.pos) > 30) continue;
      const pv = enc.heal(c, Math.floor((t.dono.level ?? 10) / 2), t.dono);
      if (pv) enc.say('cura', `O espírito do totem cuida de ${c.name}: +${pv} PV (Espírito Guardião).`);
    }
  }
}

/** INVOCADOR PODEROSO (6º): a fera ou fada que a magia do druida invoca ganha 2 PV por dado de vida, e golpes mágicos. */
export function invocadorPoderoso(dono, m, dadosDeVida) {
  if (!dono.features?.includes('mightySummoner') || !['fera', 'feérico', 'fada'].includes(m.tipo)) return;
  const dv = Number(/^(\d+)d/.exec(dadosDeVida ?? '')?.[1] ?? 1);
  m.maxHp += 2 * dv;
  m.hp += 2 * dv;
  m.golpesMagicos = true;
}

/** INVOCAÇÃO FIEL (14º): o druida cai a 0 PV; quatro feras (javalis gigantes, ND 2) surgem a 6 m para defendê-lo, uma vez por descanso longo. */
export function invocacaoFiel(enc, druida) {
  if (!druida.features?.includes('faithfulSummons') || !(druida.resources?.faithfulSummons > 0)) return;
  druida.resources.faithfulSummons -= 1;
  const feras = [];
  for (let i = 0; i < 4; i++) {
    const m = enc.invocar(druida, 'javaliGigante', druida.pos, { spellId: 'invocacaoFiel', sufixo: ` ${i + 1}` });
    if (m) { m.invocado.auto = true; feras.push(m); }
  }
  if (feras.length) enc.say('recurso', `A natureza responde à queda de ${druida.name}: ${feras.length} javalis gigantes surgem para defendê-lo (Invocação Fiel).`);
}

// ============================================================ Alma Divina

/** FAVORECIDO PELOS DEUSES (1º): o ataque que erra ou a resistência que falha ganha 2d4, uma vez por descanso curto. Só quando pode virar. */
export function favorecidoPelosDeuses(enc, actor, total, alvo) {
  if (!actor.features?.includes('favoredByTheGods') || !(actor.resources?.favoredByTheGods > 0) || total + 8 < alvo) return 0;
  actor.resources.favoredByTheGods -= 1;
  const r = damageRoll(enc.rng, '2d4');
  enc.say('recurso', `${actor.name} sente a mão dos deuses: +${r.total} (Favorecido pelos Deuses).`, `2d4[${r.rolls.join('+')}]`);
  return r.total;
}

/** CURA FORTALECIDA (6º): 1 ponto de feitiçaria rola de novo os dados de cura baixos (do feiticeiro ou de quem está a 1,5 m), uma vez por turno. */
export function curaFortalecida(enc, conjurador, cura) {
  if (!conjurador || !cura?.rolls?.length) return cura;
  const f = enc.combatants.find((c) => c.features?.includes('empoweredHealing') && (c.resources?.sorceryPoints ?? 0) > 0 && desperto(c)
    && (c === conjurador || (c.pos && conjurador.pos && distanceFt(c.pos, conjurador.pos) <= 5)) && c.curaFortalecidaEm !== enc.turnoKey());
  if (!f) return cura;
  const faces = Number(/d(\d+)/.exec(cura.notation ?? '')?.[1] ?? 0);
  if (!faces) return cura;
  const baixos = cura.rolls.filter((v) => v <= faces / 2).length;
  if (!baixos) return cura;
  f.resources.sorceryPoints -= 1;
  f.curaFortalecidaEm = enc.turnoKey();
  const rolls = cura.rolls.map((v) => (v <= faces / 2 ? enc.rng.die(faces) : v));
  const total = rolls.reduce((a, b) => a + b, 0) + (cura.mod ?? 0);
  enc.say('recurso', `${f.name} gasta 1 ponto de feitiçaria e rola de novo ${baixos} ${baixos > 1 ? 'dados' : 'dado'} de cura (Cura Fortalecida).`);
  return { ...cura, rolls, total: Math.max(total, cura.total) };
}

/** ASAS DE OUTRO MUNDO (14º): ação bônus; voo de 9 m, até dispensar. */
export function asasDeOutroMundo(enc, actor) {
  if (actor.bonusUsed) return false;
  actor.bonusUsed = true;
  if (hasCondition(actor, 'asasDeOutroMundo')) { removeCondition(actor, 'asasDeOutroMundo'); enc.say('recurso', `${actor.name} recolhe as asas.`); return true; }
  addCondition(actor, 'asasDeOutroMundo', { rounds: Infinity, source: actor.id });
  enc.say('recurso', `Asas espectrais se abrem nas costas de ${actor.name}: voo de 9 m (Asas de Outro Mundo).`);
  return true;
}

/** RECUPERAÇÃO SOBRENATURAL (18º): ação bônus, abaixo da metade dos PV: recupera metade do máximo. Uma vez por descanso longo. */
export function recuperacaoSobrenatural(enc, actor) {
  if (actor.bonusUsed || !(actor.resources?.unearthlyRecovery > 0) || actor.hp >= actor.maxHp / 2) return false;
  actor.bonusUsed = true;
  actor.resources.unearthlyRecovery -= 1;
  const pv = enc.heal(actor, Math.floor(actor.maxHp / 2), actor);
  enc.say('cura', `${actor.name} se refaz com a luz de outro mundo: +${pv} PV (Recuperação Sobrenatural).`);
  return true;
}

// ============================================================ Magia das Sombras

/** FORÇA DO TÚMULO (1º): o dano que zera os PV (não radiante, não crítico) pede CAR com CD 5 + dano; passando, fica com 1 PV. */
export function forcaDoTumulo(enc, t, amount, type, critical) {
  if (!t.features?.includes('strengthOfTheGrave') || !(t.resources?.strengthOfTheGrave > 0) || type === 'radiante' || critical) return false;
  const dc = 5 + amount;
  const sv = enc.resistencia(t, 'cha', dc);
  enc.explicarResistencia(t, 'cha', dc, sv, { contra: `Força do Túmulo (CD 5 + ${amount} de dano)`, seSucesso: 'fica com 1 PV' });
  if (!sv.success) return false;
  t.resources.strengthOfTheGrave -= 1;
  t.hp = 1;
  enc.say('recurso', `${t.name} devia cair, e a sombra o segura com 1 PV (Força do Túmulo).`);
  return true;
}

/** OLHOS DO ESCURO (1º): visão no escuro de 36 m. */
export const visaoDasSombras = (c) => (c.features?.includes('eyesOfTheDark') ? 120 : 0);

/**
 * CÃO DO MAU AGOURO (6º): ação bônus e 3 pontos; um lobo atroz nasce a 9 m de um inimigo que o feiticeiro vê a 36 m, com
 * PV temporários (metade do nível), e só vai atrás dele. Enquanto o cão está colado no alvo, o alvo resiste mal às magias
 * do feiticeiro. O cão some quando o alvo cai.
 */
export function caoDoMauAgouro(enc, actor, alvo) {
  if (actor.bonusUsed || (actor.resources?.sorceryPoints ?? 0) < 3 || !alvo || alvo.dead || alvo.side === actor.side || distanceFt(actor.pos, alvo.pos) > 120 || !ve(enc, actor, alvo)) return false;
  const cao = enc.invocar(actor, 'loboAtroz', alvo.pos, { spellId: 'caoDoMauAgouro', sufixo: ' das sombras' });
  if (!cao) return false;
  actor.bonusUsed = true;
  actor.resources.sorceryPoints -= 3;
  cao.name = 'Cão do Mau Agouro';
  cao.tipo = 'monstruosidade';
  cao.tempHp = Math.floor((actor.level ?? 6) / 2);
  cao.alvoPreferido = alvo.id;
  cao.alvoDoAgouro = alvo.id;
  cao.invocado.auto = true;
  enc.say('recurso', `Das sombras de ${actor.name} salta um cão negro atrás de ${alvo.name} (Cão do Mau Agouro).`);
  return true;
}
/** Desvantagem contra as magias do feiticeiro: o cão dele está colado no alvo. */
export function agouroContra(enc, t, conjurador) {
  if (!conjurador) return false;
  return enc.combatants.some((c) => !c.dead && c.alvoDoAgouro === t.id && c.invocado?.donoId === conjurador.id && c.pos && t.pos && distanceFt(c.pos, t.pos) <= 5);
}
/** O alvo do cão caiu: o cão some. */
export function caoSemAlvo(enc, morto) {
  for (const c of enc.combatants) if (!c.dead && c.alvoDoAgouro === morto.id) { c.dead = true; enc.say('recurso', `${c.name} se desfaz em sombra.`); enc.onEvent({ type: 'died', target: c }); }
}

/** FORMA UMBRAL (18º): ação bônus e 6 pontos; um minuto de resistência a tudo menos energético e radiante. */
export function formaUmbral(enc, actor) {
  if (actor.bonusUsed || (actor.resources?.sorceryPoints ?? 0) < 6 || hasCondition(actor, 'formaUmbral')) return false;
  actor.bonusUsed = true;
  actor.resources.sorceryPoints -= 6;
  addCondition(actor, 'formaUmbral', { rounds: 10, source: actor.id });
  enc.say('recurso', `${actor.name} vira sombra viva (Forma Umbral).`);
  return true;
}

// ============================================================ Feitiçaria da Tempestade

/**
 * CORAÇÃO DA TEMPESTADE (6º): ao conjurar magia de 1º círculo ou mais que cause elétrico ou trovejante, os inimigos a 3 m do
 * feiticeiro levam metade do nível dele em elétrico.
 */
export function coracaoDaTempestade(enc, actor, spell) {
  if (!actor.features?.includes('heartOfTheStorm') || !spell || spell.level < 1 || !['elétrico', 'trovejante'].includes(spell.damageType)) return;
  const dano = Math.floor((actor.level ?? 6) / 2);
  const pegos = enc.enemiesOf(actor).filter((e) => !e.dead && e.pos && distanceFt(actor.pos, e.pos) <= 10 && ve(enc, actor, e));
  if (!pegos.length) return;
  enc.say('recurso', `A tempestade em ${actor.name} transborda: ${dano} de elétrico em ${pegos.map((c) => c.name).join(', ')} (Coração da Tempestade).`);
  for (const c of pegos) enc.outraFonte(() => enc.applyDamage(c, dano, 'elétrico', actor, { magico: true }));
}

/** FÚRIA DA TEMPESTADE (14º): o golpe de perto que o acerta leva elétrico igual ao nível; FOR ou é empurrado 6 m. Reação. */
export function furiaDaTempestade(enc, alvo, atacante) {
  if (!alvo.features?.includes('stormsFury') || alvo.reactionUsed || !desperto(alvo) || atacante.dead) return;
  alvo.reactionUsed = true;
  const dano = alvo.level ?? 14;
  enc.say('recurso', `Um raio salta de ${alvo.name} em ${atacante.name}: ${dano} de elétrico (Fúria da Tempestade).`);
  enc.outraFonte(() => enc.applyDamage(atacante, dano, 'elétrico', alvo, { magico: true }));
  if (atacante.dead) return;
  const dc = spellSaveDc(alvo);
  const sv = enc.resistencia(atacante, 'str', dc, { contra: { magico: true, conjurador: alvo } });
  enc.explicarResistencia(atacante, 'str', dc, sv, { contra: `Fúria da Tempestade de ${alvo.name}`, seSucesso: 'fica onde está' });
  if (!sv.success) enc.empurrar(atacante, alvo.pos, 20);
}

/** ALMA DO VENTO (18º): imune a elétrico e trovejante, e voo de 18 m. CORAÇÃO DA TEMPESTADE (6º): resistência aos dois. */
export const imuneDaTempestade = (t, tipo) => ['elétrico', 'trovejante'].includes(tipo) && !!t.features?.includes('windSoul');
export const resisteDaTempestade = (t, tipo) => ['elétrico', 'trovejante'].includes(tipo) && !!t.features?.includes('heartOfTheStorm');

// ============================================================ O Celestial

/** LUZ CURATIVA (1º): ação bônus; até CAR dados da reserva (1 + nível de d6) curam uma criatura a 18 m. */
export function luzCurativa(enc, actor, alvo, quantos = null) {
  const reserva = actor.resources?.healingLight ?? 0;
  if (actor.bonusUsed || reserva <= 0 || !alvo || alvo.dead || distanceFt(actor.pos, alvo.pos) > 60 || !ve(enc, actor, alvo)) return false;
  const teto = Math.min(reserva, Math.max(1, abilityMod(actor.abilities?.cha ?? 10)));
  const falta = Math.max(1, Math.ceil(((alvo.maxHp ?? 1) - Math.max(0, alvo.hp)) / 3.5));
  const n = Math.min(teto, Number(quantos) || falta);
  actor.bonusUsed = true;
  actor.resources.healingLight -= n;
  const r = damageRoll(enc.rng, `${n}d6`);
  const pv = enc.heal(alvo, r.total, actor);
  enc.say('cura', `${actor.name} acende a luz celestial em ${alvo.name}: +${pv} PV (Luz Curativa, ${n} ${n > 1 ? 'dados' : 'dado'}).`, `${n}d6[${r.rolls.join('+')}]`);
  return true;
}

/** ALMA RADIANTE (6º): resistência a radiante, e + CAR no dano de magia radiante ou de fogo. */
export const resisteRadiante = (t, tipo) => tipo === 'radiante' && !!t.features?.includes('radiantSoul');
export function almaRadiante(actor, spell) {
  if (!actor.features?.includes('radiantSoul') || !['radiante', 'fogo'].includes(spell?.damageType)) return 0;
  return Math.max(0, abilityMod(actor.abilities?.cha ?? 10));
}

/**
 * VINGANÇA ABRASADORA (14º): no começo do turno, em vez do teste contra a morte, o bruxo levanta com metade do máximo, e os
 * inimigos a 9 m levam 2d8 + CAR radiante e ficam cegos até o fim do turno. Uma vez por descanso longo. Devolve true quando sai.
 */
export function vingancaAbrasadora(enc, c) {
  if (!c.features?.includes('searingVengeance') || !(c.resources?.searingVengeance > 0)) return false;
  c.resources.searingVengeance -= 1;
  enc.heal(c, Math.floor(c.maxHp / 2), c);
  removeCondition(c, 'caido');
  const r = damageRoll(enc.rng, `2d8+${Math.max(0, abilityMod(c.abilities?.cha ?? 10))}`);
  enc.say('cura', `${c.name} se ergue em luz: metade da vida de volta, e um clarão cega quem está perto (Vingança Abrasadora).`, `2d8[${r.rolls.join('+')}]`);
  for (const e of enc.enemiesOf(c).filter((x) => !x.dead && x.pos && distanceFt(c.pos, x.pos) <= 30)) {
    enc.outraFonte(() => enc.applyDamage(e, r.total, 'radiante', c, { magico: true }));
    if (!e.dead) enc.aplicarCondicao(e, 'cego', { rounds: 1, quando: 'fim', lado: c.side, source: c.id });
  }
  return true;
}

/** RESILIÊNCIA CELESTIAL (10º): ao fim do descanso, PV temporários iguais ao nível + CAR. */
export function resilienciaCelestial(c) {
  if (!c.features?.includes('celestialResilience')) return;
  c.tempHp = Math.max(c.tempHp ?? 0, (c.level ?? 10) + Math.max(0, abilityMod(c.abilities?.cha ?? 10)));
}

// ============================================================ O Lâmina Maldita

/** GUERREIRO MALDITO (1º): na arma de uma mão que está na mão, o Carisma, se for maior. */
export function carismaNaArma(actor, w, habilidade) {
  if (!actor.features?.includes('hexWarrior') || !w || w.id === 'punhos' || w.id !== actor.equippedWeapon) return habilidade;
  if ((w.props ?? []).includes('duas mãos') || w.duasMaos) return habilidade;
  return (actor.abilities?.cha ?? 10) > (actor.abilities?.[habilidade] ?? 10) ? 'cha' : habilidade;
}

/** MALDIÇÃO DO LÂMINA MALDITA (1º): ação bônus, uma vez por descanso curto; 1 minuto numa criatura a 9 m. */
export function maldicaoDoLamina(enc, actor, alvo) {
  if (actor.bonusUsed || !(actor.resources?.hexbladesCurse > 0) || !alvo || alvo.dead || alvo.side === actor.side || distanceFt(actor.pos, alvo.pos) > 30 || !ve(enc, actor, alvo)) return false;
  actor.bonusUsed = true;
  actor.resources.hexbladesCurse -= 1;
  addCondition(alvo, 'maldicaoDoLamina', { rounds: 10, source: actor.id });
  enc.say('recurso', `${actor.name} amaldiçoa ${alvo.name} (Maldição do Lâmina Maldita).`);
  return true;
}
export const amaldicoadoPor = (alvo, bruxo) => getCondition(alvo, 'maldicaoDoLamina')?.source === bruxo?.id;
/** O dano a mais da maldição (a proficiência), no acerto de ataque do bruxo. */
export function danoDaMaldicao(enc, atacante, alvo, extra, tipo) {
  if (!amaldicoadoPor(alvo, atacante)) return;
  extra('Maldição do Lâmina Maldita', `+${proficiencyBonus(atacante.level ?? 1)}`, tipo, false);
}

/**
 * Morreu o amaldiçoado: o bruxo recupera nível + CAR; ou, com o MESTRE DAS MALDIÇÕES (14º), passa a maldição a outro inimigo a
 * 9 m (sem curar). No jogo, passa quando há a quem passar e o bruxo não está abaixo da metade da vida. E o ESPECTRO AMALDIÇOADO
 * (6º): o humanoide que o bruxo mata levanta como espectro dele, uma vez por descanso longo.
 */
export function aoMorrerNaMaldicao(enc, morto, matador) {
  const m = getCondition(morto, 'maldicaoDoLamina');
  const bruxo = m ? enc.combatants.find((c) => c.id === m.source) : null;
  if (bruxo && !bruxo.dead && desperto(bruxo)) {
    removeCondition(morto, 'maldicaoDoLamina');
    const outro = bruxo.features?.includes('masterOfHexes') && bruxo.hp >= bruxo.maxHp / 2
      ? enc.enemiesOf(bruxo).find((e) => !e.dead && e.pos && morto.pos && distanceFt(e.pos, morto.pos) <= 30 && ve(enc, bruxo, e)) : null;
    if (outro) {
      addCondition(outro, 'maldicaoDoLamina', { rounds: m.rounds ?? 10, source: bruxo.id });
      enc.say('recurso', `A maldição de ${bruxo.name} salta de ${morto.name} para ${outro.name} (Mestre das Maldições).`);
    } else {
      const pv = enc.heal(bruxo, Math.max(1, (bruxo.level ?? 1) + abilityMod(bruxo.abilities?.cha ?? 10)), bruxo);
      enc.say('cura', `A maldição se fecha sobre ${morto.name}, e ${bruxo.name} recupera ${pv} PV.`);
    }
  }
  if (matador?.features?.includes('accursedSpecter') && (matador.resources?.accursedSpecter ?? 0) > 0 && morto.tipo === 'humanoide' && morto.pos) {
    const esp = enc.invocar(matador, 'espectro', morto.pos, { spellId: 'espectroAmaldicoado' });
    if (esp) {
      matador.resources.accursedSpecter -= 1;
      esp.tempHp = Math.floor((matador.level ?? 6) / 2);
      const car = Math.max(0, abilityMod(matador.abilities?.cha ?? 10));
      esp.attacks = esp.attacks.map((a) => ({ ...a, bonus: a.bonus + car }));
      enc.say('recurso', `A alma de ${morto.name} levanta como espectro, a serviço de ${matador.name} (Espectro Amaldiçoado).`);
    }
  }
}

/** ARMADURA DE MALDIÇÕES (10º): o amaldiçoado acerta o bruxo; a reação rola 1d6, e com 4 ou mais o ataque erra. */
export function armaduraDeMaldicoes(enc, alvo, atacante) {
  if (!alvo.features?.includes('armorOfHexes') || alvo.reactionUsed || !desperto(alvo) || !amaldicoadoPor(atacante, alvo)) return false;
  alvo.reactionUsed = true;
  const d = enc.rng.die(6);
  enc.say('recurso', `${alvo.name} torce a maldição contra o golpe: ${d}${d >= 4 ? ', e o golpe erra' : ', e não basta'} (Armadura de Maldições).`);
  return d >= 4;
}

// ============================================================ Magia de Guerra

/**
 * DEFLEXÃO ARCANA (2º): reação ao ser acertado (+2 na CA contra o golpe) ou ao falhar numa resistência (+4 no teste); depois,
 * só truques até o fim do próximo turno. No jogo, só quando muda o resultado. A MORTALHA DEFLETORA (14º): até três inimigos a
 * 18 m levam metade do nível em energético.
 */
export function deflexaoArcana(enc, actor, falta, bonus) {
  if (!actor.features?.includes('arcaneDeflection') || actor.reactionUsed || !desperto(actor) || falta > bonus || falta <= 0) return false;
  actor.reactionUsed = true;
  addCondition(actor, 'deflexaoArcana', { rounds: enc.side === actor.side ? 2 : 1, quando: 'fim', lado: actor.side, source: actor.id });
  enc.say('recurso', `${actor.name} desvia com um gesto arcano: +${bonus} (Deflexão Arcana).`);
  if (actor.features.includes('deflectingShroud')) {
    const dano = Math.floor((actor.level ?? 14) / 2);
    const pegos = enc.enemiesOf(actor).filter((e) => !e.dead && e.pos && distanceFt(actor.pos, e.pos) <= 60 && ve(enc, actor, e)).slice(0, 3);
    if (pegos.length) {
      enc.say('recurso', `A energia desviada estoura em ${pegos.map((c) => c.name).join(', ')}: ${dano} de energético (Mortalha Defletora).`);
      for (const c of pegos) enc.outraFonte(() => enc.applyDamage(c, dano, 'energético', actor, { magico: true }));
    }
  }
  return true;
}
/** Depois da Deflexão Arcana, só truques. */
export const soTruques = (actor, spell) => spell?.level > 0 && hasCondition(actor, 'deflexaoArcana');

/** SURTO DE PODER (6º): uma vez por turno, o dano de magia de mago soma metade do nível em energético, gastando um surto. */
export function surtoDePoder(enc, actor, alvo) {
  if (!actor.features?.includes('powerSurge') || !(actor.resources?.powerSurge > 0) || alvo.dead || actor.classe !== 'mago') return;
  const vez = enc.turnoKey();
  if (actor.surtoDePoderEm === vez) return;
  actor.surtoDePoderEm = vez;
  actor.resources.powerSurge -= 1;
  const dano = Math.floor((actor.level ?? 6) / 2);
  enc.say('recurso', `${actor.name} solta um surto de poder: +${dano} de energético em ${alvo.name} (Surto de Poder).`);
  enc.outraFonte(() => enc.applyDamage(alvo, dano, 'energético', actor, { magico: true }));
}

// ==================================================================================== CALDEIRÃO DE TASHA

// ============================================================ Caminho da Fera

export const ARMAS_DA_FERA = { mordida: 'mordidaDaFera', garras: 'garrasDaFera', cauda: 'caudaDaFera' };
const ehDaFera = (id) => Object.values(ARMAS_DA_FERA).includes(id);

/** FORMA DA FERA (3º): ao entrar em Fúria, a arma natural escolhida vai para a lista de armas (e para a mão) até a Fúria acabar. */
export function formaDaFera(enc, actor, modo) {
  if (!actor.features?.includes('formOfTheBeast')) return;
  const forma = ARMAS_DA_FERA[modo] ? modo : 'garras';
  actor.formaDaFera = forma;
  const arma = ARMAS_DA_FERA[forma];
  actor.armaAntesDaFera ??= actor.equippedWeapon;
  actor.weapons = [...actor.weapons.filter((w) => !ehDaFera(w)), arma];
  actor.equippedWeapon = arma;
  enc.say('recurso', `${actor.name} vira fera: ${WEAPONS[arma].name.toLowerCase()} (Forma da Fera).`);
}
/** A Fúria acabou: a arma natural some, e a de antes volta para a mão. */
export function largarFormaDaFera(c) {
  if (!c.formaDaFera || emFuria(c)) return;
  c.weapons = c.weapons.filter((w) => !ehDaFera(w));
  if (ehDaFera(c.equippedWeapon)) c.equippedWeapon = c.armaAntesDaFera ?? c.weapons[0];
  delete c.armaAntesDaFera;
  delete c.formaDaFera;
}
/** ALMA BESTIAL (6º): a arma natural é mágica. */
export const feraMagica = (actor, w) => !!w && ehDaFera(w.id) && !!actor.features?.includes('bestialSoul');

/** O acerto da arma natural: a mordida cura (abaixo da metade, uma vez por turno), e a FÚRIA INFECCIOSA (10º). */
export function acertoDaFera(enc, atacante, alvo) {
  const arma = atacante.armaDoGolpeAgora;
  if (!ehDaFera(arma) || !emFuria(atacante)) return;
  const vez = enc.turnoKey();
  if (arma === 'mordidaDaFera' && atacante.hp < atacante.maxHp / 2 && atacante.mordidaCurouEm !== vez) {
    atacante.mordidaCurouEm = vez;
    const pv = enc.heal(atacante, proficiencyBonus(atacante.level ?? 3), atacante);
    if (pv) enc.say('cura', `${atacante.name} se refaz no sangue da mordida: +${pv} PV.`);
  }
  if (atacante.features?.includes('infectiousFury') && (atacante.resources?.infectiousFury ?? 0) > 0 && !alvo.dead && atacante.furiaInfecciosaEm !== vez) {
    atacante.furiaInfecciosaEm = vez;
    atacante.resources.infectiousFury -= 1;
    const dc = 8 + proficiencyBonus(atacante.level ?? 10) + abilityMod(atacante.abilities?.con ?? 10);
    const sv = enc.resistencia(alvo, 'wis', dc, { contra: { magico: true } });
    enc.explicarResistencia(alvo, 'wis', dc, sv, { contra: `Fúria Infecciosa de ${atacante.name}`, seSucesso: 'a fúria não o pega' });
    if (!sv.success) {
      const r = damageRoll(enc.rng, '2d12');
      enc.say('recurso', `A fúria de ${atacante.name} entra em ${alvo.name}: ${r.total} de psíquico (Fúria Infecciosa).`, `2d12[${r.rolls.join('+')}]`);
      enc.outraFonte(() => enc.applyDamage(alvo, r.total, 'psíquico', atacante, { magico: true }));
    }
  }
}
/** As GARRAS: uma vez por turno, o golpe de garra da ação de Atacar ganha outro golpe de garra. */
export function garraAMais(enc, atacante, golpe) {
  if ((golpe ?? atacante.equippedWeapon) !== 'garrasDaFera' || !emFuria(atacante) || !naVez(enc, atacante)) return false;
  const vez = enc.turnoKey();
  if (atacante.garraAMaisEm === vez) return false;
  atacante.garraAMaisEm = vez;
  return true;
}
/** A CAUDA: reação; a criatura a 3 m acerta o bárbaro, e o golpe enfrenta a CA + 1d8. Devolve o d8, ou null. */
export function caudaQueDefende(enc, alvo, atacante) {
  if (alvo.formaDaFera !== 'cauda' || !emFuria(alvo) || alvo.reactionUsed || !desperto(alvo) || !atacante.pos || distanceFt(alvo.pos, atacante.pos) > 10) return null;
  alvo.reactionUsed = true;
  const d = enc.rng.die(8);
  enc.say('recurso', `A cauda de ${alvo.name} se levanta contra o golpe: +${d} na CA.`);
  return d;
}

/**
 * CHAMADO DA CAÇADA (14º): ao entrar em Fúria, até CON aliados a 9 m entram na caçada; o bárbaro ganha 5 PV temporários por
 * aliado, e cada um, até a Fúria acabar, soma 1d6 uma vez por turno no acerto.
 */
export function chamadoDaCaca(enc, b) {
  if (!b.features?.includes('callTheHunt') || !(b.resources?.callTheHunt > 0)) return;
  const quem = enc.combatants.filter((c) => c !== b && c.side === b.side && !c.dead && c.pos && distanceFt(b.pos, c.pos) <= 30 && ve(enc, b, c))
    .slice(0, Math.max(1, abilityMod(b.abilities?.con ?? 10)));
  if (!quem.length) return;
  b.resources.callTheHunt -= 1;
  for (const c of quem) addCondition(c, 'chamadoDaCaca', { rounds: 10, source: b.id });
  b.tempHp = Math.max(b.tempHp ?? 0, 5 * quem.length);
  enc.say('recurso', `${b.name} chama a caçada: ${quem.map((c) => c.name).join(', ')} somam 1d6 no acerto, e ele ganha ${5 * quem.length} PV temporários (Chamado da Caçada).`);
}
export function dadoDaCaca(enc, atacante, extra, tipo) {
  const m = getCondition(atacante, 'chamadoDaCaca');
  if (!m) return;
  const dono = enc.combatants.find((c) => c.id === m.source);
  if (!dono || !emFuria(dono)) { removeCondition(atacante, 'chamadoDaCaca'); return; }
  const vez = enc.turnoKey();
  if (atacante.cacaEm === vez) return;
  atacante.cacaEm = vez;
  extra('Chamado da Caçada', '1d6', tipo, false);
}

// ============================================================ Caminho da Magia Selvagem (o bárbaro)

const SURTO_DO_BARBARO = ['necrotico', 'teleporte', 'espirito', 'armaDeForca', 'retaliacao', 'luzes', 'flores', 'raio'];
const ROTULO_DO_SURTO = {
  necrotico: 'sombras que sugam a vida em volta', teleporte: 'um teleporte de 9 m, e de novo a cada turno', espirito: 'um espírito que explode',
  armaDeForca: 'a arma vira energia', retaliacao: 'quem o acerta leva energia de volta', luzes: 'luzes que protegem quem está perto',
  flores: 'flores e vinhas que prendem os inimigos perto', raio: 'um raio de luz que cega',
};
export const cdDoSurtoBarbaro = (b) => 8 + proficiencyBonus(b.level ?? 3) + abilityMod(b.abilities?.con ?? 10);

/**
 * SURTO SELVAGEM (3º): ao entrar em Fúria, um efeito da tabela (d8) que dura a Fúria. SURTO CONTROLADO (14º): dois, e vale o
 * de mais cedo na tabela (no jogo, o melhor é o que fere mais perto). Devolve o efeito.
 */
export function surtoDoBarbaro(enc, b) {
  if (!b.features?.includes('barbarianWildSurge')) return null;
  let d = enc.rng.die(8);
  if (b.features.includes('controlledSurge')) d = Math.min(d, enc.rng.die(8));
  const efeito = SURTO_DO_BARBARO[d - 1];
  for (const id of ['surtoBarbaro']) removeCondition(b, id);
  addCondition(b, 'surtoBarbaro', { rounds: 10, source: b.id, data: { efeito } });
  enc.say('recurso', `A fúria de ${b.name} transborda em magia selvagem: ${ROTULO_DO_SURTO[efeito]} (Surto Selvagem, ${d}).`);
  const dc = cdDoSurtoBarbaro(b);
  if (efeito === 'necrotico') {
    const r = damageRoll(enc.rng, '1d12');
    for (const c of enc.combatants.filter((x) => x !== b && !x.dead && x.pos && distanceFt(b.pos, x.pos) <= 30)) {
      const sv = enc.resistencia(c, 'con', dc, { contra: { magico: true } });
      if (!sv.success) enc.outraFonte(() => enc.applyDamage(c, r.total, 'necrótico', b, { magico: true }));
    }
    b.tempHp = Math.max(b.tempHp ?? 0, enc.rng.die(12));
  }
  if (efeito === 'espirito' || efeito === 'raio') surtoNoAlvo(enc, b, efeito);
  if (efeito === 'luzes') luzesDoSurto(enc, b);
  return efeito;
}
export const efeitoDoSurto = (b) => (emFuria(b) ? getCondition(b, 'surtoBarbaro')?.data?.efeito ?? null : null);
/** O espírito (explode em 1,5 m: DES ou 1d6 energético) e o raio (CON ou 1d6 radiante e cego), no inimigo mais perto a 9 m. */
export function surtoNoAlvo(enc, b, efeito) {
  const alvo = enc.enemiesOf(b).filter((e) => !e.dead && e.pos && distanceFt(b.pos, e.pos) <= 30 && ve(enc, b, e)).sort((x, y) => distanceFt(b.pos, x.pos) - distanceFt(b.pos, y.pos))[0];
  if (!alvo) return false;
  const dc = cdDoSurtoBarbaro(b);
  if (efeito === 'espirito') {
    for (const c of enc.combatants.filter((x) => !x.dead && x !== b && x.pos && distanceFt(x.pos, alvo.pos) <= 5)) {
      const sv = enc.resistencia(c, 'dex', dc, { contra: { magico: true } });
      if (!sv.success) { const r = damageRoll(enc.rng, '1d6'); enc.outraFonte(() => enc.applyDamage(c, r.total, 'energético', b, { magico: true })); }
    }
    enc.say('recurso', `Um espírito surge ao lado de ${alvo.name} e explode.`);
  } else {
    const sv = enc.resistencia(alvo, 'con', dc, { contra: { magico: true } });
    if (!sv.success) {
      const r = damageRoll(enc.rng, '1d6');
      enc.outraFonte(() => enc.applyDamage(alvo, r.total, 'radiante', b, { magico: true }));
      enc.aplicarCondicao(alvo, 'cego', { rounds: 1, quando: 'inicio', lado: b.side, source: b.id });
    }
    enc.say('recurso', `Um raio de luz salta do peito de ${b.name} em ${alvo.name}.`);
  }
  return true;
}
/** As luzes: +1 de CA ao bárbaro e aos aliados a 3 m, renovadas no começo de cada turno dele. */
export function luzesDoSurto(enc, b) {
  for (const c of enc.combatants.filter((x) => x.side === b.side && !x.dead && x.pos && distanceFt(b.pos, x.pos) <= 10)) {
    addCondition(c, 'luzesDoSurto', { rounds: 1, quando: 'inicio', lado: b.side, source: b.id });
  }
}
/** O começo do lado do bárbaro: as luzes se renovam. */
export function surtoNoComecoDoLado(enc, side) {
  for (const b of enc.allOf(side)) {
    if (b.dead) continue;
    largarFormaDaFera(b);
    if (efeitoDoSurto(b) === 'luzes') luzesDoSurto(enc, b);
  }
}
/** O surto da ação bônus (o teleporte, o espírito, o raio), de novo a cada turno da Fúria. */
export function surtoDeNovo(enc, b) {
  const efeito = efeitoDoSurto(b);
  if (b.bonusUsed || !['espirito', 'raio'].includes(efeito)) return false;
  if (!surtoNoAlvo(enc, b, efeito)) return false;
  b.bonusUsed = true;
  return true;
}
/** As flores e vinhas: o inimigo a 4,5 m do bárbaro anda pela metade (terreno difícil). */
export const presoNasFlores = (enc, c) => enc.combatants.some((b) => b.side !== c.side && !b.dead && efeitoDoSurto(b) === 'flores' && b.pos && c.pos && distanceFt(b.pos, c.pos) <= 15);
/** A retaliação: quem acerta o bárbaro leva 1d6 de energético. */
export function retaliacaoDoSurto(enc, alvo, atacante) {
  if (efeitoDoSurto(alvo) !== 'retaliacao' || atacante.dead) return;
  const r = damageRoll(enc.rng, '1d6');
  enc.say('recurso', `A magia em volta de ${alvo.name} devolve ${r.total} de energético a ${atacante.name}.`);
  enc.outraFonte(() => enc.applyDamage(atacante, r.total, 'energético', alvo, { magico: true }));
}
/** RESPOSTA INSTÁVEL (10º): em Fúria, depois do golpe de 10 ou mais, a reação rola de novo a tabela. */
export function respostaInstavel(enc, b, amount) {
  if (!b.features?.includes('unstableBacklash') || !emFuria(b) || b.reactionUsed || !desperto(b) || amount < 10 || b.dead) return;
  b.reactionUsed = true;
  enc.say('recurso', `A dor de ${b.name} solta outro surto (Resposta Instável).`);
  surtoDoBarbaro(enc, b);
}
/**
 * MAGIA FORTALECEDORA (6º): ação, toque. Com espaços de magia gastos, devolve um de círculo até 1d3 (uma vez por descanso
 * longo de quem recebe); sem, +1d3 nas jogadas de ataque por 10 minutos.
 */
export function magiaFortalecedora(enc, actor, alvo) {
  if (actor.actionUsed || !(actor.resources?.bolsteringMagic > 0) || !alvo || alvo.dead || alvo.side !== actor.side || distanceFt(actor.pos, alvo.pos) > 5) return false;
  actor.actionUsed = true;
  actor.resources.bolsteringMagic -= 1;
  const sc = alvo.spellcasting;
  const gasto = sc && !alvo.magiaFortalecidaNoDescanso ? (() => { const d = enc.rng.die(3); for (let n = d; n >= 1; n--) if ((sc.slots?.[n] ?? 0) < (sc.slotsMax?.[n] ?? 0)) return n; return null; })() : null;
  if (gasto) {
    sc.slots[gasto] += 1;
    alvo.magiaFortalecidaNoDescanso = true;
    enc.say('recurso', `${actor.name} devolve a ${alvo.name} um espaço de ${gasto}º círculo (Magia Fortalecedora).`);
    return true;
  }
  addCondition(alvo, 'magiaFortalecedora', { rounds: 100, source: actor.id });
  enc.say('recurso', `${actor.name} enche ${alvo.name} de magia selvagem: +1d3 nas jogadas de ataque por dez minutos (Magia Fortalecedora).`);
  return true;
}

// ============================================================ Colégio da Criação e da Eloquência

/**
 * Depois que a Inspiração de Bardo foi usada num ATAQUE: a PARTÍCULA DE POTENCIAL (Criação) estoura em trovão no alvo e em
 * quem está a 1,5 m dele (CON ou o dado); a INSPIRAÇÃO INFALÍVEL (Eloquência, 6º) devolve o dado a quem errou; a INSPIRAÇÃO
 * INFECCIOSA (14º) passa um dado a outro aliado quando acertou.
 */
export function depoisDaInspiracao(enc, quem, insp, { sucesso, alvo = null, noAtaque = false, naResistencia = false } = {}) {
  const bardo = enc.combatants.find((c) => c.id === insp.source);
  if (!bardo) return;
  const dado = insp.data?.dado ?? '1d6';
  if (bardo.features?.includes('moteOfPotential')) {
    if (noAtaque && alvo && !alvo.dead) {
      const r = damageRoll(enc.rng, dado);
      const dc = spellSaveDc(bardo);
      enc.say('recurso', `A partícula de potencial explode em trovão em volta de ${alvo.name} (Partícula de Potencial).`);
      for (const c of enc.combatants.filter((x) => !x.dead && x.side !== quem.side && x.pos && alvo.pos && distanceFt(x.pos, alvo.pos) <= 5)) {
        const sv = enc.resistencia(c, 'con', dc, { contra: { magico: true, conjurador: bardo } });
        if (!sv.success) enc.outraFonte(() => enc.applyDamage(c, r.total, 'trovejante', bardo, { magico: true }));
      }
    }
    if (naResistencia) {
      const pv = damageRoll(enc.rng, dado).total + Math.max(1, abilityMod(bardo.abilities?.cha ?? 10));
      quem.tempHp = Math.max(quem.tempHp ?? 0, pv);
      enc.say('recurso', `A partícula de potencial envolve ${quem.name}: ${pv} PV temporários.`);
    }
  }
  if (!sucesso && bardo.features?.includes('unfailingInspiration') && !hasCondition(quem, 'inspirado')) {
    addCondition(quem, 'inspirado', { rounds: 100, source: bardo.id, data: { ...insp.data } });
    enc.say('recurso', `${quem.name} falha, mas não perde a Inspiração (Inspiração Infalível).`);
  }
  if (sucesso && bardo.features?.includes('infectiousInspiration') && (bardo.resources?.infectiousInspiration ?? 0) > 0 && !bardo.reactionUsed && desperto(bardo)
    && quem.pos && bardo.pos && distanceFt(bardo.pos, quem.pos) <= 60) {
    const outro = enc.combatants.filter((c) => c !== bardo && c !== quem && c.side === bardo.side && !c.dead && !hasCondition(c, 'inspirado') && c.pos && distanceFt(bardo.pos, c.pos) <= 60)
      .sort((a, b) => distanceFt(quem.pos, a.pos) - distanceFt(quem.pos, b.pos))[0];
    if (outro) {
      bardo.reactionUsed = true;
      bardo.resources.infectiousInspiration -= 1;
      addCondition(outro, 'inspirado', { rounds: 100, source: bardo.id, data: { ...insp.data } });
      enc.say('recurso', `O sucesso de ${quem.name} contagia ${outro.name}: um dado de Inspiração (Inspiração Infecciosa).`);
    }
  }
}

/** APRESENTAÇÃO ANIMADA (Criação, 6º): ação, uma vez por descanso longo; um item dançante a 9 m que obedece ao bardo, por 1 hora. */
export function apresentacaoAnimada(enc, actor) {
  if (actor.actionUsed || !(actor.resources?.animatingPerformance > 0)) return false;
  const item = enc.invocar(actor, 'itemDancante', actor.pos, { spellId: 'apresentacaoAnimada' });
  if (!item) return false;
  actor.actionUsed = true;
  actor.resources.animatingPerformance -= 1;
  const nivel = actor.level ?? 6;
  item.maxHp = 10 + 5 * nivel;
  item.hp = item.maxHp;
  const pbd = proficiencyBonus(nivel);
  item.attacks = item.attacks.map((a) => ({ ...a, bonus: spellAttackDoBardo(actor), damage: `1d10+${pbd}` }));
  enc.say('recurso', `${actor.name} canta, e um objeto ganha vida e dança ao lado dele (Apresentação Animada).`);
  return true;
}
const spellAttackDoBardo = (c) => proficiencyBonus(c.level ?? 1) + abilityMod(c.abilities?.cha ?? 10);

/** PALAVRAS PERTURBADORAS (Eloquência, 3º): ação bônus e uma Inspiração; o dado sai da próxima resistência do alvo. */
export function palavrasPerturbadoras(enc, actor, alvo) {
  if (actor.bonusUsed || !(actor.resources?.bardicInspiration > 0) || !alvo || alvo.dead || distanceFt(actor.pos, alvo.pos) > 60 || !ve(enc, actor, alvo)) return false;
  actor.bonusUsed = true;
  actor.resources.bardicInspiration -= 1;
  const escala = actor.dadoDeInspiracao ?? 'd6';
  const dado = String(escala).startsWith('d') ? `1${escala}` : String(escala);
  const valor = damageRoll(enc.rng, dado).total;
  addCondition(alvo, 'palavrasPerturbadoras', { rounds: 1, quando: 'inicio', lado: actor.side, source: actor.id, data: { valor } });
  enc.say('recurso', `${actor.name} sussurra para ${alvo.name} o que tira o chão dele: −${valor} na próxima resistência (Palavras Perturbadoras).`);
  return true;
}
/** A resistência que gasta as Palavras Perturbadoras: quanto ela tira (e a condição sai). */
export function tiraDasPalavras(actor) {
  const p = getCondition(actor, 'palavrasPerturbadoras');
  if (!p) return 0;
  removeCondition(actor, 'palavrasPerturbadoras');
  return p.data?.valor ?? 0;
}
/** LÍNGUA DE PRATA (Eloquência, 3º): na Persuasão e na Enganação, o d20 de 9 ou menos conta como 10. */
export const linguaDePrata = (actor, pericia) => ['persuasao', 'enganacao'].includes(pericia) && !!actor.features?.includes('silverTongue');

// ============================================================ Domínio da Ordem

/** VOZ DA AUTORIDADE (1º): a magia de espaço que mira um aliado deixa ele, com a reação, atacar com arma o inimigo mais perto. */
export function vozDaAutoridade(enc, actor, spell, alvos) {
  if (!actor.features?.includes('voiceOfAuthority') || !spell || spell.level < 1) return;
  const aliado = (alvos ?? []).find((c) => c && c !== actor && c.side === actor.side && !c.dead && !c.reactionUsed && desperto(c) && !c.attacks);
  if (!aliado) return;
  const arma = enc.armaDeOportunidade(aliado);
  if (arma === undefined) return;
  const inimigo = enc.enemiesOf(aliado).filter((e) => !e.dead && ve(enc, actor, e) && enc.canAttack(aliado, e, arma).ok)
    .sort((a, b) => distanceFt(aliado.pos, a.pos) - distanceFt(aliado.pos, b.pos))[0];
  if (!inimigo) return;
  aliado.reactionUsed = true;
  enc.say('recurso', `Com a voz de ${actor.name}, ${aliado.name} ataca ${inimigo.name} (Voz da Autoridade).`);
  enc.resolveAttackBase(aliado, inimigo, { weaponId: arma, opportunity: true });
}

/** EXIGÊNCIA DA ORDEM (2º): ação e Canalizar Divindade; inimigos a 9 m testam SAB ou ficam enfeitiçados até o fim do próximo turno, ou até sofrer dano. */
export function exigenciaDaOrdem(enc, actor) {
  if (actor.actionUsed || !(actor.resources?.channelDivinity > 0)) return false;
  actor.actionUsed = true;
  actor.resources.channelDivinity -= 1;
  const dc = spellSaveDc(actor);
  enc.say('recurso', `${actor.name} ordena, e a voz pesa como lei (Exigência da Ordem).`);
  for (const t of enc.enemiesOf(actor).filter((e) => !e.dead && e.pos && distanceFt(actor.pos, e.pos) <= 30 && ve(enc, actor, e))) {
    const sv = enc.resistencia(t, 'wis', dc, { contra: { magico: true, condicao: 'enfeiticado', conjurador: actor } });
    enc.explicarResistencia(t, 'wis', dc, sv, { contra: `Exigência da Ordem de ${actor.name}`, seSucesso: 'não obedece' });
    if (!sv.success && enc.aplicarCondicao(t, 'enfeiticado', { rounds: 2, quando: 'fim', lado: actor.side, source: actor.id, data: { fimAoDano: true } })) {
      enc.say('condicao', `${t.name} fica enfeitiçado por ${actor.name}.`);
    }
  }
  return true;
}

/** ENCARNAÇÃO DA LEI (6º): interruptor; a magia de encantamento de 1 ação sai como ação bônus, gastando um uso. */
export function encarnacaoDaLei(actor, spell) {
  return !!(actor.encarnacaoLigada && actor.features?.includes('embodimentOfTheLaw') && (actor.resources?.embodimentOfTheLaw ?? 0) > 0
    && spell?.school === 'encantamento' && spell.level >= 1 && spell.castTime === 'action' && !actor.bonusUsed);
}

/** IRA DA ORDEM (17º): o Golpe Divino no turno do clérigo amaldiçoa o alvo; o próximo aliado que o acerta soma 2d8 psíquico. */
export function marcarIraDaOrdem(enc, atacante, alvo) {
  if (!atacante.features?.includes('ordersWrath') || !naVez(enc, atacante) || alvo.dead) return;
  addCondition(alvo, 'iraDaOrdem', { rounds: 1, quando: 'inicio', lado: atacante.side, source: atacante.id });
}
export function iraDaOrdem(enc, atacante, alvo, extra) {
  const m = getCondition(alvo, 'iraDaOrdem');
  if (!m || m.source === atacante.id) return;
  const dono = enc.combatants.find((c) => c.id === m.source);
  if (!dono || dono.side !== atacante.side) return;
  removeCondition(alvo, 'iraDaOrdem');
  extra('Ira da Ordem', '2d8', 'psíquico');
}

// ============================================================ Domínio da Paz

const alcanceDoVinculo = (c) => (c.features?.includes('expansiveBond') ? 60 : 30);
function donoDoVinculo(enc, c) {
  const m = getCondition(c, 'vinculoEncorajador');
  return m ? enc.combatants.find((x) => x.id === m.source) ?? null : null;
}
/** VÍNCULO ENCORAJADOR (1º): ação; até a proficiência de criaturas a 9 m (o clérigo incluído), por 10 minutos. */
export function vinculoEncorajador(enc, actor) {
  if (actor.actionUsed || !(actor.resources?.emboldeningBond > 0)) return false;
  actor.actionUsed = true;
  actor.resources.emboldeningBond -= 1;
  for (const c of enc.combatants) if (getCondition(c, 'vinculoEncorajador')?.source === actor.id) removeCondition(c, 'vinculoEncorajador');
  const quem = [actor, ...enc.combatants.filter((c) => c !== actor && c.side === actor.side && !c.dead && c.pos && distanceFt(actor.pos, c.pos) <= 30)
    .sort((a, b) => distanceFt(actor.pos, a.pos) - distanceFt(actor.pos, b.pos))].slice(0, proficiencyBonus(actor.level ?? 1));
  for (const c of quem) addCondition(c, 'vinculoEncorajador', { rounds: 100, source: actor.id });
  enc.say('recurso', `${actor.name} liga ${quem.map((c) => c.name).join(', ')} num vínculo de coragem (Vínculo Encorajador).`);
  return true;
}
/** O 1d4 do vínculo: uma vez por turno, no primeiro ataque ou resistência, perto de outro vinculado. */
export function dadoDoVinculo(enc, c) {
  const dono = donoDoVinculo(enc, c);
  if (!dono) return 0;
  const vez = enc.turnoKey();
  if (c.vinculoEm === vez) return 0;
  const raio = alcanceDoVinculo(dono);
  const perto = enc.combatants.some((x) => x !== c && !x.dead && getCondition(x, 'vinculoEncorajador')?.source === dono.id && x.pos && c.pos && distanceFt(x.pos, c.pos) <= raio);
  if (!perto) return 0;
  c.vinculoEm = vez;
  return damageRoll(enc.rng, '1d4').total;
}
/**
 * VÍNCULO PROTETOR (6º): o vinculado vai sofrer dano; outro vinculado a 9 m (18 m no 17º) usa a reação, salta para o lado dele e
 * toma o dano (resistido, no 17º). No jogo, no golpe que derrubaria. Devolve o dano que fica no alvo.
 */
export function vinculoProtetor(enc, alvo, fonte, amount, { transferido = false } = {}) {
  if (transferido || amount <= 0 || amount < alvo.hp + (alvo.tempHp ?? 0)) return amount;
  const dono = donoDoVinculo(enc, alvo);
  if (!dono?.features?.includes('protectiveBond')) return amount;
  const raio = alcanceDoVinculo(dono);
  const g = enc.combatants.find((x) => x !== alvo && !x.dead && !x.reactionUsed && desperto(x) && getCondition(x, 'vinculoEncorajador')?.source === dono.id
    && x.pos && alvo.pos && distanceFt(x.pos, alvo.pos) <= raio && x.hp > amount + 5);
  if (!g) return amount;
  g.reactionUsed = true;
  const casa = enc.casaLivreMaisProxima({ ...alvo.pos }) ?? g.pos;
  if (distanceFt(g.pos, alvo.pos) > 5) g.pos = { x: casa.x, y: casa.y, f: g.pos.f ?? 1 };
  const dano = dono.features.includes('expansiveBond') ? Math.floor(amount / 2) : amount;
  enc.say('recurso', `${g.name} salta para o lado de ${alvo.name} e toma o golpe: ${dano} de dano (Vínculo Protetor).`);
  enc.applyDamage(g, dano, null, fonte, { transferido: true });
  return 0;
}
/**
 * BÁLSAMO DA PAZ (2º): ação e Canalizar Divindade. No livro o clérigo anda o deslocamento sem dar brecha e cura quem fica a
 * 1,5 m do caminho; no jogo ele fica onde está, e cada aliado que ele alcançaria andando recupera 2d6 + SAB.
 */
export function balsamoDaPaz(enc, actor) {
  if (actor.actionUsed || !(actor.resources?.channelDivinity > 0)) return false;
  actor.actionUsed = true;
  actor.resources.channelDivinity -= 1;
  const alcance = enc.speedOf(actor) + 5;
  const curados = enc.combatants.filter((c) => c !== actor && c.side === actor.side && !c.dead && c.pos && distanceFt(actor.pos, c.pos) <= alcance && c.hp < c.maxHp);
  for (const c of curados) {
    const r = damageRoll(enc.rng, `2d6+${Math.max(0, abilityMod(actor.abilities?.wis ?? 10))}`);
    enc.heal(c, Math.max(1, r.total), actor);
  }
  enc.say('cura', `${actor.name} passa entre os aliados com a mão aberta: ${curados.length ? curados.map((c) => c.name).join(', ') : 'ninguém ferido'} (Bálsamo da Paz).`);
  return true;
}

// ============================================================ Domínio do Crepúsculo

/** BÊNÇÃO VIGILANTE (1º): ação, toque; vantagem na próxima iniciativa (a do lado, no jogo). */
export function bencaoVigilante(enc, actor, alvo) {
  const quem = alvo ?? actor;
  if (actor.actionUsed || quem.dead || quem.side !== actor.side || distanceFt(actor.pos, quem.pos) > 5) return false;
  actor.actionUsed = true;
  for (const c of enc.combatants) if (getCondition(c, 'bencaoVigilante')?.source === actor.id) removeCondition(c, 'bencaoVigilante');
  addCondition(quem, 'bencaoVigilante', { rounds: Infinity, source: actor.id });
  enc.say('recurso', `${actor.name} abençoa ${quem.name}: vantagem na próxima iniciativa (Bênção Vigilante).`);
  return true;
}
/** A iniciativa: quem tem a Bênção Vigilante dá vantagem ao lado, e a bênção se gasta. */
export function vantagemDaBencaoVigilante(enc, side) {
  const quem = enc.allOf(side).filter((c) => hasCondition(c, 'bencaoVigilante'));
  for (const c of quem) removeCondition(c, 'bencaoVigilante');
  return quem.length > 0;
}

/** SANTUÁRIO DO CREPÚSCULO (2º): ação e Canalizar Divindade; uma esfera de 9 m em volta do clérigo por 1 minuto. */
export function santuarioDoCrepusculo(enc, actor) {
  if (actor.actionUsed || !(actor.resources?.channelDivinity > 0)) return false;
  actor.actionUsed = true;
  actor.resources.channelDivinity -= 1;
  addCondition(actor, 'santuarioDoCrepusculo', { rounds: 10, source: actor.id });
  enc.say('recurso', `Uma penumbra calma se abre em volta de ${actor.name} (Santuário do Crepúsculo).`);
  return true;
}
const santuarioSobre = (enc, c) => enc.combatants.find((p) => p.side === c.side && !p.dead && desperto(p) && hasCondition(p, 'santuarioDoCrepusculo') && p.pos && c.pos && distanceFt(p.pos, c.pos) <= 30) ?? null;
/** Quem termina o turno no santuário: o encanto ou o medo acaba, ou ele ganha 1d6 + nível de PV temporários. */
export function santuarioNoFim(enc, side) {
  for (const c of enc.allOf(side)) {
    if (c.dead) continue;
    const p = santuarioSobre(enc, c);
    if (!p) continue;
    const preso = (c.conditions ?? []).find((k) => ['enfeiticado', 'amedrontado'].includes(k.id));
    if (preso) { removeCondition(c, preso.id); enc.say('recurso', `O crepúsculo de ${p.name} acalma ${c.name}: ${preso.id === 'enfeiticado' ? 'o encanto' : 'o medo'} passa.`); continue; }
    const pv = damageRoll(enc.rng, '1d6').total + (p.level ?? 2);
    if ((c.tempHp ?? 0) < pv) { c.tempHp = pv; enc.say('recurso', `O crepúsculo de ${p.name} envolve ${c.name}: ${pv} PV temporários.`); }
  }
}
/** MORTALHA DO CREPÚSCULO (17º): meia cobertura (+2 na CA e na DES) dentro do santuário. */
export const coberturaDoCrepusculo = (enc, c) => {
  const p = santuarioSobre(enc, c);
  return p?.features?.includes('twilightShroud') ? 2 : 0;
};

/** PASSOS DA NOITE (6º): ação bônus na penumbra ou no escuro; voo igual ao andar por 1 minuto. */
export function passosDaNoite(enc, actor, luzAqui) {
  if (actor.bonusUsed || !(actor.resources?.stepsOfNight > 0) || luzAqui >= 2) return false;
  actor.bonusUsed = true;
  actor.resources.stepsOfNight -= 1;
  addCondition(actor, 'passosDaNoite', { rounds: 10, source: actor.id });
  enc.say('recurso', `${actor.name} sobe na sombra como se ela fosse chão (Passos da Noite).`);
  return true;
}

// ============================================================ Círculo dos Esporos

const entidadeAtiva = (c) => {
  const e = getCondition(c, 'entidadeSimbiotica');
  if (!e) return false;
  if ((c.tempHp ?? 0) <= 0) { removeCondition(c, 'entidadeSimbiotica'); return false; }
  return true;
};
const dadoDoHalo = (c) => `1${c.dadoDoHalo ?? 'd4'}`;

/** ENTIDADE SIMBIÓTICA (2º): ação e um uso de Forma Selvagem; 4 PV temporários por nível, o halo em dobro e +1d6 necrótico no golpe de perto. */
export function entidadeSimbiotica(enc, actor) {
  if (actor.actionUsed || !(actor.resources?.wildShape > 0)) return false;
  actor.actionUsed = true;
  actor.resources.wildShape -= 1;
  actor.tempHp = Math.max(actor.tempHp ?? 0, 4 * (actor.level ?? 2));
  addCondition(actor, 'entidadeSimbiotica', { rounds: 100, source: actor.id });
  enc.say('recurso', `Os esporos tomam o corpo de ${actor.name}: ${actor.tempHp} PV temporários (Entidade Simbiótica).`);
  return true;
}
export function dadoDaEntidade(enc, atacante, extra, ranged) {
  if (ranged || !entidadeAtiva(atacante)) return;
  extra('Entidade Simbiótica', '1d6', 'necrótico', false);
}
/**
 * HALO DE ESPOROS (2º): reação; a criatura a 3 m testa CON ou leva o dado do halo (1d4, 1d6 no 6º, 1d8 no 10º, 1d10 no 14º),
 * duas vezes com a Entidade. No jogo: no começo do turno do lado inimigo, no inimigo mais perto a 3 m. Os Esporos que se
 * Espalham tiram a reação.
 */
export function haloDeEsporos(enc, side) {
  for (const d of enc.combatants) {
    if (!d.features?.includes('haloOfSpores') || d.side === side || d.dead || d.reactionUsed || !desperto(d) || !d.pos) continue;
    if (enc.zonas?.some((z) => z.spellId === 'esporosQueSeEspalham' && z.dono === d.id)) continue;
    const alvo = enc.allOf(side).filter((c) => !c.dead && c.pos && distanceFt(d.pos, c.pos) <= 10 && ve(enc, d, c))
      .sort((a, b) => distanceFt(d.pos, a.pos) - distanceFt(d.pos, b.pos))[0];
    if (!alvo) continue;
    d.reactionUsed = true;
    const dc = spellSaveDc(d);
    const sv = enc.resistencia(alvo, 'con', dc, { contra: { magico: true, conjurador: d } });
    enc.explicarResistencia(alvo, 'con', dc, sv, { contra: `Halo de Esporos de ${d.name}`, seSucesso: 'escapa dos esporos' });
    if (sv.success) continue;
    const dado = dadoDoHalo(d);
    const r = damageRoll(enc.rng, entidadeAtiva(d) ? dado.replace(/^1/, '2') : dado);
    enc.say('recurso', `Os esporos de ${d.name} pegam ${alvo.name}: ${r.total} necrótico (Halo de Esporos).`, `[${r.rolls.join('+')}]`);
    enc.applyDamage(alvo, r.total, 'necrótico', d, { magico: true });
  }
}
/** INFESTAÇÃO FÚNGICA (6º): reação; o humanoide ou a fera Pequena ou Média que morre a 3 m levanta como zumbi com 1 PV. */
export function infestacaoFungica(enc, morto) {
  if (!['humanoide', 'fera'].includes(morto.tipo) || !['pequeno', 'médio', 'medio', undefined].includes(morto.size)) return;
  const d = enc.combatants.find((c) => c.features?.includes('fungalInfestation') && c.side !== morto.side && !c.dead && desperto(c) && !c.reactionUsed
    && (c.resources?.fungalInfestation ?? 0) > 0 && c.pos && morto.pos && distanceFt(c.pos, morto.pos) <= 10);
  if (!d) return;
  const z = enc.invocar(d, 'zumbi', morto.pos, { spellId: 'infestacaoFungica' });
  if (!z) return;
  d.reactionUsed = true;
  d.resources.fungalInfestation -= 1;
  z.hp = 1; z.maxHp = 1;
  z.invocado.auto = true;
  enc.say('recurso', `Os esporos de ${d.name} levantam ${morto.name} como zumbi (Infestação Fúngica).`);
}
/** ESPOROS QUE SE ESPALHAM (10º): o dano da nuvem é o do halo, em dobro com a Entidade (`castSpell` troca o dado). */
export function dadosDosEsporos(actor) {
  const dado = dadoDoHalo(actor);
  return entidadeAtiva(actor) ? dado.replace(/^1/, '2') : dado;
}
/** CORPO FÚNGICO (14º): imune a cego, surdo, amedrontado e envenenado; o crítico vira acerto comum, se ele não estiver incapacitado. */
export const imuneDoCorpoFungico = (c, id) => !!c.features?.includes('fungalBody') && ['cego', 'surdo', 'amedrontado', 'envenenado'].includes(id);
export const desfazCriticoFungico = (c) => !!c.features?.includes('fungalBody') && desperto(c);

// ============================================================ Círculo das Estrelas

/** MAPA ESTELAR (2º): o Raio Guiado sem espaço, a proficiência de vezes por descanso longo (`usoLivreDe`). */
export function raioDoMapa(c, spell, pedido) {
  if (spell?.id !== 'raioGuiado' || !c.features?.includes('starMap') || !((c.resources?.starMap ?? 0) > 0)) return null;
  if (pedido != null && pedido !== spell.level) return null;
  return { tipo: 'mapa', circulo: spell.level, recurso: 'starMap', rotulo: 'Mapa Estelar' };
}
const constelacao = (c) => getCondition(c, 'formaEstrelada')?.data?.constelacao ?? null;
/**
 * FORMA ESTRELADA (2º): ação bônus e um uso de Forma Selvagem, 10 minutos, uma constelação. Arqueiro: ataque de magia a 18 m,
 * 1d8 + SAB radiante, ao entrar e como ação bônus depois. Cálice: a cura com espaço cura também alguém a 9 m. Dragão: 9 ou
 * menos no d20 de INT e SAB, e na concentração, vira 10. No 10º, 2d8, voo de 6 m do Dragão, e trocar de constelação.
 */
export function formaEstrelada(enc, actor, modo, alvo = null) {
  const qual = ['arqueiro', 'calice', 'dragao'].includes(modo) ? modo : 'arqueiro';
  if (hasCondition(actor, 'formaEstrelada')) {
    if (!actor.features?.includes('twinklingConstellations') || constelacao(actor) === qual) return false;
    getCondition(actor, 'formaEstrelada').data.constelacao = qual;
    getCondition(actor, 'formaEstrelada').data.voo = qual === 'dragao';
    enc.say('recurso', `As estrelas de ${actor.name} viram outra constelação: ${NOME_DA_CONSTELACAO[qual]}.`);
    return true;
  }
  if (actor.bonusUsed || !(actor.resources?.wildShape > 0)) return false;
  actor.resources.wildShape -= 1;
  addCondition(actor, 'formaEstrelada', { rounds: 100, source: actor.id, data: { constelacao: qual, voo: qual === 'dragao' && actor.features?.includes('twinklingConstellations') } });
  enc.say('recurso', `${actor.name} vira uma figura de estrelas: o ${NOME_DA_CONSTELACAO[qual]} (Forma Estrelada).`);
  if (qual === 'arqueiro' && alvo && !alvo.dead) flechaEstelar(enc, actor, alvo);
  actor.bonusUsed = true;
  return true;
}
const NOME_DA_CONSTELACAO = { arqueiro: 'Arqueiro', calice: 'Cálice', dragao: 'Dragão' };
/** A flecha do Arqueiro: ataque de magia a 18 m, 1d8 + SAB radiante (2d8 no 10º). */
export function flechaEstelar(enc, actor, alvo) {
  if (constelacao(actor) !== 'arqueiro' || !alvo || alvo.dead || distanceFt(actor.pos, alvo.pos) > 60) return false;
  const dados = `${actor.dadosDaEstrela ?? '1d8'}+${Math.max(0, abilityMod(actor.abilities?.wis ?? 10))}`;
  const sp = { id: 'flechaEstelar', name: 'Flecha Estelar', level: 0, kind: 'attack', damage: dados, damageType: 'radiante', rangeFt: 60, school: 'evocação' };
  enc.ataqueMagico(actor, alvo, sp, dados, spellSaveDc(actor), { slot: 0 });
  return true;
}
export function flechaDeBonus(enc, actor, alvo) {
  if (actor.bonusUsed || constelacao(actor) !== 'arqueiro') return false;
  if (!flechaEstelar(enc, actor, alvo)) return false;
  actor.bonusUsed = true;
  return true;
}
/** O Cálice: depois da cura com espaço, o mais ferido a 9 m (o druida inclusive) recupera 1d8 + SAB. */
export function curaDoCalice(enc, actor, spell, slot) {
  if (constelacao(actor) !== 'calice' || !spell || spell.level < 1 || !slot) return;
  const quem = enc.combatants.filter((c) => c.side === actor.side && !c.dead && c.pos && distanceFt(actor.pos, c.pos) <= 30 && c.hp < c.maxHp)
    .sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0];
  if (!quem) return;
  const r = damageRoll(enc.rng, `${actor.dadosDaEstrela ?? '1d8'}+${Math.max(0, abilityMod(actor.abilities?.wis ?? 10))}`);
  const pv = enc.heal(quem, r.total, actor);
  enc.say('cura', `O Cálice de estrelas de ${actor.name} transborda em ${quem.name}: +${pv} PV.`);
}
/** O Dragão: no teste de INT ou SAB, e na resistência de concentração, 9 ou menos no d20 vira 10. */
export const pisoDoDragao = (c, hab, concentracao = false) => constelacao(c) === 'dragao' && (['int', 'wis'].includes(hab) || (hab === 'con' && concentracao));
export const vooDoDragao = (c) => !!getCondition(c, 'formaEstrelada')?.data?.voo;
/** CHEIO DE ESTRELAS (14º): na forma, resistência a concussão, cortante e perfurante. */
export const resisteNasEstrelas = (c, tipo) => !!c.features?.includes('fullOfStars') && hasCondition(c, 'formaEstrelada') && ['concussão', 'cortante', 'perfurante'].includes(tipo);

/**
 * PRESSÁGIO CÓSMICO (6º): o descanso longo sorteia bem-estar (par) ou infortúnio (ímpar). Reação: +1d6 na jogada de um aliado
 * (bem-estar) ou −1d6 na de um inimigo (infortúnio), a 9 m. No jogo, só quando o dado pode virar o resultado.
 * `margem` é quanto falta (aliado) ou sobra (inimigo). Devolve o ajuste.
 */
export function pressagioCosmico(enc, quem, margem, jaPassou) {
  for (const d of enc.combatants) {
    if (!d.features?.includes('cosmicOmen') || !(d.resources?.cosmicOmen > 0) || d.reactionUsed || !desperto(d) || !d.pos || !quem.pos || distanceFt(d.pos, quem.pos) > 30) continue;
    d.pressagio ??= enc.rng.die(2) === 2 ? 'bem' : 'mal';
    const aliado = d.side === quem.side;
    if ((aliado && (d.pressagio !== 'bem' || jaPassou)) || (!aliado && (d.pressagio !== 'mal' || !jaPassou)) || margem <= 0 || margem > 6) continue;
    d.reactionUsed = true;
    d.resources.cosmicOmen -= 1;
    const v = enc.rng.die(6);
    enc.say('recurso', `${d.name} lê as estrelas sobre ${quem.name}: ${aliado ? '+' : '−'}${v} (Presságio Cósmico).`);
    return aliado ? v : -v;
  }
  return 0;
}

// ============================================================ Círculo do Fogo Selvagem

const espiritoDe = (enc, d) => enc.combatants.find((c) => c.defId === 'espiritoDoFogoSelvagem' && c.invocado?.donoId === d.id && !c.dead) ?? null;
/**
 * INVOCAR O ESPÍRITO DO FOGO SELVAGEM (2º): ação e um uso de Forma Selvagem; o espírito surge a 9 m, e quem está a 3 m dele
 * (fora o druida) testa DES ou leva 2d6 de fogo. PV 5 + 5 × nível; a semente de chama usa o ataque de magia do druida.
 */
export function invocarEspiritoDoFogo(enc, actor, ponto = null) {
  if (actor.actionUsed || !(actor.resources?.wildShape > 0)) return false;
  const antigo = espiritoDe(enc, actor);
  if (antigo) { antigo.dead = true; enc.onEvent({ type: 'died', target: antigo }); }
  const onde = ponto ?? actor.pos;
  const esp = enc.invocar(actor, 'espiritoDoFogoSelvagem', onde, { spellId: 'espiritoDoFogoSelvagem' });
  if (!esp) return false;
  actor.actionUsed = true;
  actor.resources.wildShape -= 1;
  const nivel = actor.level ?? 2;
  esp.maxHp = 5 + 5 * nivel; esp.hp = esp.maxHp;
  const pbd = proficiencyBonus(nivel);
  esp.attacks = esp.attacks.map((a) => ({ ...a, bonus: pbd + abilityMod(actor.abilities?.wis ?? 10), damage: `1d6+${pbd}` }));
  enc.say('recurso', `Um espírito de fogo selvagem salta das cinzas ao lado de ${actor.name}.`);
  const dc = spellSaveDc(actor);
  for (const c of enc.combatants.filter((x) => x !== actor && x !== esp && !x.dead && x.pos && distanceFt(x.pos, esp.pos) <= 10)) {
    const sv = enc.resistencia(c, 'dex', dc, { contra: { magico: true, conjurador: actor } });
    if (!sv.success) { const r = damageRoll(enc.rng, '2d6'); enc.outraFonte(() => enc.applyDamage(c, r.total, 'fogo', actor, { magico: true })); }
  }
  return true;
}
/** LAÇO REFORÇADO (6º): com o espírito de pé, a magia de fogo ou de cura do druida soma 1d8 (uma rolagem). */
export function lacoReforcado(enc, actor, spell) {
  if (!actor.features?.includes('enhancedBond') || !espiritoDe(enc, actor)) return 0;
  if (spell?.damageType !== 'fogo' && !['heal', 'healGrupo'].includes(spell?.kind)) return 0;
  return damageRoll(enc.rng, '1d8').total;
}
/** CHAMAS CAUTERIZANTES (10º): quem morre a 9 m do druida ou do espírito deixa uma chama na casa por 1 minuto. */
export function deixarChama(enc, morto) {
  if (!morto.pos) return;
  for (const d of enc.combatants) {
    if (!d.features?.includes('cauterizingFlames') || d.dead) continue;
    const perto = [d, espiritoDe(enc, d)].filter(Boolean).some((x) => x.pos && distanceFt(x.pos, morto.pos) <= 30);
    if (!perto) continue;
    (enc.chamasCauterizantes ??= []).push({ dono: d.id, pos: { x: morto.pos.x, y: morto.pos.y }, ate: enc.round + 10 });
  }
}
/** Quem entra na chama: o druida a apaga com a reação, curando o aliado ou queimando o inimigo (2d10 + SAB). */
export function pisouNaChama(enc, c) {
  if (!enc.chamasCauterizantes?.length || !c.pos || c.dead) return;
  for (const ch of [...enc.chamasCauterizantes]) {
    if (ch.ate < enc.round || ch.pos.x !== c.pos.x || ch.pos.y !== c.pos.y) continue;
    const d = enc.combatants.find((x) => x.id === ch.dono);
    if (!d || d.dead || d.reactionUsed || !desperto(d) || !(d.resources?.cauterizingFlames > 0) || !ve(enc, d, c)) continue;
    d.reactionUsed = true;
    d.resources.cauterizingFlames -= 1;
    enc.chamasCauterizantes = enc.chamasCauterizantes.filter((x) => x !== ch);
    const r = damageRoll(enc.rng, `2d10+${Math.max(0, abilityMod(d.abilities?.wis ?? 10))}`);
    if (c.side === d.side) { const pv = enc.heal(c, r.total, d); enc.say('cura', `A chama que ${d.name} deixou cura ${c.name}: +${pv} PV (Chamas Cauterizantes).`); }
    else { enc.say('recurso', `A chama de ${d.name} se fecha sobre ${c.name}: ${r.total} de fogo (Chamas Cauterizantes).`); enc.applyDamage(c, r.total, 'fogo', d, { magico: true }); }
    return;
  }
}
/** RENASCER EM CHAMAS (14º): o druida cai com o espírito a 36 m; o espírito vai a 0 e o druida levanta com metade dos PV. */
export function renascerEmChamas(enc, d) {
  if (!d.features?.includes('blazingRevival') || !(d.resources?.blazingRevival > 0)) return false;
  const esp = espiritoDe(enc, d);
  if (!esp || !esp.pos || !d.pos || distanceFt(esp.pos, d.pos) > 120) return false;
  d.resources.blazingRevival -= 1;
  esp.dead = true; esp.hp = 0;
  enc.onEvent({ type: 'died', target: esp });
  d.hp = Math.floor(d.maxHp / 2);
  enc.say('cura', `O espírito de fogo de ${d.name} se apaga, e ele se levanta das chamas com ${d.hp} PV (Renascer em Chamas).`);
  return true;
}

// ============================================================ Guerreiro Psiônico

const dadoPsi = (c) => `1${c.dadoPsionico ?? 'd6'}`;
const intDe = (c) => abilityMod(c.abilities?.int ?? 10);
const gastarDadoPsi = (c) => { if (!(c.resources?.psionicEnergy > 0)) return false; c.resources.psionicEnergy -= 1; return true; };
/** PODER PSIÔNICO (3º): uma vez por descanso curto, a ação bônus recupera um dado. */
export function recuperarDadoPsi(enc, actor) {
  if (actor.bonusUsed || !(actor.resources?.psionicRecover > 0) || (actor.resources?.psionicEnergy ?? 0) >= (actor.resourcesMax?.psionicEnergy ?? 0)) return false;
  actor.bonusUsed = true;
  actor.resources.psionicRecover -= 1;
  actor.resources.psionicEnergy += 1;
  enc.say('recurso', `${actor.name} respira e recupera um dado de energia psiônica.`);
  return true;
}
/** CAMPO PROTETOR (3º): reação; o golpe de 8 ou mais (ou o que derrubaria) num aliado a 9 m perde o dado + INT. */
export function campoProtetor(enc, alvo, fonte, amount) {
  if (amount <= 0 || !fonte || fonte.side === alvo.side) return amount;
  const g = enc.combatants.find((c) => c.side === alvo.side && c.features?.includes('protectiveField') && (c.resources?.psionicEnergy ?? 0) > 0 && !c.reactionUsed && desperto(c)
    && (c === alvo || (c.pos && alvo.pos && distanceFt(c.pos, alvo.pos) <= 30 && ve(enc, c, alvo))));
  if (!g || (amount < 8 && amount < alvo.hp + (alvo.tempHp ?? 0))) return amount;
  g.reactionUsed = true;
  gastarDadoPsi(g);
  const reduz = Math.max(1, damageRoll(enc.rng, dadoPsi(g)).total + intDe(g));
  enc.say('recurso', `${g.name} ergue um campo de força diante de ${alvo.name}: −${reduz} de dano (Campo Protetor).`);
  return Math.max(0, amount - reduz);
}
/** GOLPE PSIÔNICO (3º): interruptor; o golpe de arma do turno, a 9 m, gasta um dado e soma o dado + INT de energético. E o IMPULSO TELECINÉTICO (7º). */
export function golpePsionico(enc, atacante, alvo, extra) {
  if (!atacante.golpePsiLigado || !atacante.features?.includes('psionicStrike') || !naVez(enc, atacante) || alvo.dead || distanceFt(atacante.pos, alvo.pos) > 30) return;
  const vez = enc.turnoKey();
  if (atacante.golpePsiEm === vez || !gastarDadoPsi(atacante)) return;
  atacante.golpePsiEm = vez;
  extra('Golpe Psiônico', `${dadoPsi(atacante)}+${Math.max(0, intDe(atacante))}`, 'energético');
  if (atacante.features.includes('telekineticAdept') && !alvo.dead) {
    const dc = 8 + proficiencyBonus(atacante.level ?? 7) + intDe(atacante);
    const sv = enc.resistencia(alvo, 'str', dc, { contra: { condicao: 'caido' } });
    enc.explicarResistencia(alvo, 'str', dc, sv, { contra: `Impulso Telecinético de ${atacante.name}`, seSucesso: 'fica de pé' });
    if (!sv.success) { addCondition(alvo, 'caido'); enc.say('condicao', `A força da mente de ${atacante.name} derruba ${alvo.name} (Impulso Telecinético).`); }
  }
}
/** SALTO PSIÔNICO (7º): ação bônus; voo igual ao dobro do andar até o fim do turno. Uma vez por descanso curto, depois um dado. */
export function saltoPsionico(enc, actor) {
  if (actor.bonusUsed) return false;
  if (actor.resources?.psiPoweredLeap > 0) actor.resources.psiPoweredLeap -= 1;
  else if (!gastarDadoPsi(actor)) return false;
  actor.bonusUsed = true;
  const voo = 2 * (actor.speedFt ?? 30);
  addCondition(actor, 'saltoPsionico', { rounds: 1, quando: 'fim', lado: actor.side, source: actor.id, data: { voo } });
  actor.movementLeftFt = Math.max(actor.movementLeftFt ?? 0, (actor.movementLeftFt ?? 0) + (voo - (actor.speedFt ?? 30)));
  enc.say('recurso', `${actor.name} salta com a mente: voo de ${Math.round(voo * 0.3)} m até o fim do turno (Salto Psiônico).`);
  return true;
}
/** MENTE PROTEGIDA (10º): resistência a psíquico; no começo do turno, um dado tira o encanto e o medo. */
export const resistePsiquico = (c, tipo) => tipo === 'psíquico' && !!c.features?.includes('guardedMind');
export function menteProtegida(enc, side) {
  for (const c of enc.allOf(side)) {
    if (!c.features?.includes('guardedMind') || c.dead) continue;
    const presos = (c.conditions ?? []).filter((k) => ['enfeiticado', 'amedrontado'].includes(k.id));
    if (!presos.length || !gastarDadoPsi(c)) continue;
    for (const k of presos) removeCondition(c, k.id);
    enc.say('recurso', `${c.name} fecha a mente e se livra de ${presos.map((k) => (k.id === 'enfeiticado' ? 'o encanto' : 'o medo')).join(' e ')} (Mente Protegida).`);
  }
}
/** BALUARTE DE FORÇA (15º): ação bônus; até INT criaturas a 9 m (ele incluído) ganham meia cobertura por um minuto. */
export function baluarteDeForca(enc, actor) {
  if (actor.bonusUsed) return false;
  if (actor.resources?.bulwarkOfForce > 0) actor.resources.bulwarkOfForce -= 1;
  else if (!gastarDadoPsi(actor)) return false;
  actor.bonusUsed = true;
  const quem = [actor, ...enc.combatants.filter((c) => c !== actor && c.side === actor.side && !c.dead && c.pos && distanceFt(actor.pos, c.pos) <= 30)]
    .slice(0, Math.max(1, intDe(actor)));
  for (const c of quem) addCondition(c, 'baluarteDeForca', { rounds: 10, source: actor.id });
  enc.say('recurso', `${actor.name} ergue um baluarte de força em volta de ${quem.map((c) => c.name).join(', ')}: meia cobertura por um minuto.`);
  return true;
}
/** MESTRE TELECINÉTICO (18º): a Telecinésia sem espaço, uma vez por descanso longo (`usoLivreDe`). */
export function telecinesiaDoMestre(c, spell) {
  if (spell?.id !== 'telecinesia' || !c.features?.includes('telekineticMaster') || !((c.resources?.telekineticMaster ?? 0) > 0)) return null;
  return { tipo: 'mestre', circulo: spell.level, recurso: 'telekineticMaster', rotulo: 'Mestre Telecinético' };
}
/** Concentrado na Telecinésia: um ataque com arma como ação bônus. */
export function golpeDoMestreTelecinetico(enc, actor, alvo) {
  if (actor.bonusUsed || actor.concentrating?.spellId !== 'telecinesia' || !actor.features?.includes('telekineticMaster') || !alvo) return false;
  const arma = actor.equippedWeapon;
  if (!enc.canAttack(actor, alvo, arma).ok) return false;
  actor.bonusUsed = true;
  enc.resolveAttackBase(actor, alvo, { weaponId: arma });
  return true;
}

// ============================================================ Cavaleiro Rúnico

const cdRunica = (c) => 8 + proficiencyBonus(c.level ?? 3) + abilityMod(c.abilities?.con ?? 10);
/** PODER DOS GIGANTES (3º): ação bônus, 1 minuto; vantagem em Força e, uma vez por turno, +1d6 (1d8 no 10º, 1d10 no 18º) no acerto. */
export function poderDosGigantes(enc, actor) {
  if (actor.bonusUsed || !(actor.resources?.giantsMight > 0) || hasCondition(actor, 'poderDosGigantes')) return false;
  actor.bonusUsed = true;
  actor.resources.giantsMight -= 1;
  addCondition(actor, 'poderDosGigantes', { rounds: 10, source: actor.id });
  enc.say('recurso', `${actor.name} cresce com o poder dos gigantes.`);
  return true;
}
export function dadoDoGigante(enc, atacante, extra, tipo) {
  if (!hasCondition(atacante, 'poderDosGigantes')) return;
  const vez = enc.turnoKey();
  if (atacante.giganteEm === vez) return;
  atacante.giganteEm = vez;
  extra('Poder dos Gigantes', atacante.dadoDoGigante ?? '1d6', tipo, false);
}
const usaRuna = (c, r) => { if (!c.features?.includes(r) || !(c.resources?.[r] > 0)) return false; c.resources[r] -= 1; return true; };
/** As runas de ação bônus: o GELO (+2 em Força e CON por 10 minutos), a COLINA (resistência física, 1 minuto), a TEMPESTADE (1 minuto). */
export function invocarRuna(enc, actor, runa) {
  if (actor.bonusUsed || !['runaDoGelo', 'runaDaColina', 'runaDaTempestade'].includes(runa) || !usaRuna(actor, runa)) return false;
  actor.bonusUsed = true;
  const cond = { runaDoGelo: ['runaDoGeloAtiva', 100], runaDaColina: ['runaDaColinaAtiva', 10], runaDaTempestade: ['runaDaTempestadeAtiva', 10] }[runa];
  addCondition(actor, cond[0], { rounds: cond[1], source: actor.id });
  enc.say('recurso', `${actor.name} acende a ${{ runaDoGelo: 'Runa do Gelo', runaDaColina: 'Runa da Colina', runaDaTempestade: 'Runa da Tempestade' }[runa]}.`);
  return true;
}
/** A RUNA DO FOGO armada: no acerto de arma, +2d6 de fogo e FOR ou contido por um minuto, repetindo. */
export function runaDoFogo(enc, atacante, alvo, extra) {
  if (!atacante.runaDoFogoArmada || !naVez(enc, atacante) || alvo.dead || !usaRuna(atacante, 'runaDoFogo')) return;
  atacante.runaDoFogoArmada = false;
  extra('Runa do Fogo', '2d6', 'fogo');
  if (alvo.dead) return;
  const dc = cdRunica(atacante);
  const sv = enc.resistencia(alvo, 'str', dc, { contra: { condicao: 'contido' } });
  enc.explicarResistencia(alvo, 'str', dc, sv, { contra: `Runa do Fogo de ${atacante.name}`, seSucesso: 'arrebenta as correntes' });
  if (!sv.success && enc.aplicarCondicao(alvo, 'contido', { rounds: 10, source: atacante.id, data: { save: 'str', dc, repete: true } })) {
    enc.say('condicao', `Correntes de fogo prendem ${alvo.name} (Runa do Fogo).`);
  }
}
/** A RUNA DA PEDRA: reação; o inimigo que termina o turno a 9 m testa SAB ou fica enfeitiçado e parado por um minuto. */
export function runaDaPedra(enc, side) {
  for (const k of enc.combatants) {
    if (k.side === side || k.dead || k.reactionUsed || !desperto(k) || !k.pos || !(k.resources?.runaDaPedra > 0) || !k.features?.includes('runaDaPedra')) continue;
    const alvo = enc.allOf(side).find((c) => !c.dead && c.pos && distanceFt(k.pos, c.pos) <= 30 && ve(enc, k, c) && !hasCondition(c, 'transePetrea'));
    if (!alvo) continue;
    k.reactionUsed = true;
    k.resources.runaDaPedra -= 1;
    const dc = cdRunica(k);
    const sv = enc.resistencia(alvo, 'wis', dc, { contra: { magico: true, condicao: 'enfeiticado' } });
    enc.explicarResistencia(alvo, 'wis', dc, sv, { contra: `Runa da Pedra de ${k.name}`, seSucesso: 'sacode o transe' });
    if (!sv.success && enc.aplicarCondicao(alvo, 'transePetrea', { rounds: 10, source: k.id, data: { save: 'wis', dc, repete: true } })) {
      enc.say('condicao', `${alvo.name} cai num transe de pedra (Runa da Pedra).`);
    }
  }
}
/**
 * A RUNA DA NUVEM: reação; o golpe que acerta um aliado a 9 m passa para outro inimigo a 9 m do cavaleiro, com a mesma rolagem.
 * No jogo, no golpe que derrubaria. Devolve o novo alvo, ou null.
 */
export function runaDaNuvem(enc, alvo, atacante, totalDoGolpe) {
  const k = enc.combatants.find((c) => c !== alvo && c.side === alvo.side && c.features?.includes('runaDaNuvem') && (c.resources?.runaDaNuvem ?? 0) > 0 && !c.reactionUsed && desperto(c)
    && c.pos && alvo.pos && distanceFt(c.pos, alvo.pos) <= 30);
  if (!k || totalDoGolpe < alvo.hp + (alvo.tempHp ?? 0)) return null;
  const outro = enc.enemiesOf(k).filter((e) => e !== atacante && !e.dead && e.pos && distanceFt(k.pos, e.pos) <= 30).sort((a, b) => distanceFt(k.pos, a.pos) - distanceFt(k.pos, b.pos))[0];
  if (!outro) return null;
  k.reactionUsed = true;
  k.resources.runaDaNuvem -= 1;
  enc.say('recurso', `${k.name} sopra a Runa da Nuvem: o golpe de ${atacante.name} vira e acerta ${outro.name}.`);
  return outro;
}
/** A RUNA DA TEMPESTADE acesa: uma vez por rodada, a reação dá vantagem ao ataque de um aliado a 18 m. Devolve o cavaleiro. */
export function olhoDaTempestade(enc, atacante, mods) {
  if (mods.advantage) return null;
  const k = enc.combatants.find((c) => c !== atacante && c.side === atacante.side && hasCondition(c, 'runaDaTempestadeAtiva') && !c.reactionUsed && desperto(c)
    && c.pos && atacante.pos && distanceFt(c.pos, atacante.pos) <= 60);
  if (!k) return null;
  k.reactionUsed = true;
  return k;
}
/** ESCUDO RÚNICO (7º): reação; o golpe que acerta um aliado a 18 m se rola de novo, e vale o novo. Devolve true quando usa. */
export function escudoRunico(enc, alvo, atacante) {
  const k = enc.combatants.find((c) => c !== alvo && c.side === alvo.side && c.features?.includes('runicShield') && (c.resources?.runicShield ?? 0) > 0 && !c.reactionUsed && desperto(c)
    && c.pos && alvo.pos && distanceFt(c.pos, alvo.pos) <= 60 && ve(enc, c, alvo));
  if (!k) return false;
  k.reactionUsed = true;
  k.resources.runicShield -= 1;
  enc.say('recurso', `${k.name} ergue o escudo rúnico sobre ${alvo.name}: ${atacante.name} rola o golpe de novo.`);
  return true;
}

// ============================================================ Caminho da Misericórdia

const curaDaMao = (enc, monge) => damageRoll(enc.rng, `1${monge.dadoDeArtesMarciais ?? 'd6'}+${Math.max(0, abilityMod(monge.abilities?.wis ?? 10))}`).total;
/**
 * MÃO DA CURA (3º): ação e 1 ki, toque; cura o dado de Artes Marciais + SAB. Com o TOQUE DO MÉDICO (6º), tira cego, surdo,
 * paralisado, envenenado ou atordoado. As curas da Rajada (`rajadaDeCura`) saem sem ki e sem ação.
 */
export function maoDaCura(enc, actor, alvo) {
  if (!alvo || alvo.dead || alvo.side !== actor.side || distanceFt(actor.pos, alvo.pos) > 5) return false;
  const livre = (actor.curasDaRajada ?? 0) > 0 && actor.curasDaRajadaEm === enc.turnoKey();
  if (!livre && (actor.actionUsed || !(actor.resources?.ki > 0))) return false;
  if (livre) actor.curasDaRajada -= 1;
  else { actor.actionUsed = true; actor.resources.ki -= 1; }
  const pv = enc.heal(alvo, curaDaMao(enc, actor), actor);
  enc.say('cura', `${actor.name} toca ${alvo.name} e fecha a ferida: +${pv} PV (Mão da Cura${livre ? ', na Rajada' : ''}).`);
  if (actor.features?.includes('physiciansTouch')) {
    const c = (alvo.conditions ?? []).find((k) => ['cego', 'surdo', 'paralisado', 'envenenado', 'atordoado'].includes(k.id));
    if (c) { removeCondition(alvo, c.id); enc.say('recurso', `O toque também tira ${c.id} de ${alvo.name} (Toque do Médico).`); }
  }
  return true;
}
/** A Rajada de Golpes troca golpes por curas: uma no 3º, todas (duas) no 11º. Devolve quantos golpes ela ainda dá. */
export function rajadaDeCura(enc, actor, modo) {
  if (!actor.features?.includes('handOfHealing') || !['curaUm', 'curaDois'].includes(modo)) return null;
  const curas = modo === 'curaDois' && actor.features.includes('flurryOfHealingAndHarm') ? 2 : 1;
  actor.curasDaRajada = curas;
  actor.curasDaRajadaEm = enc.turnoKey();
  enc.say('recurso', `${actor.name} troca ${curas === 2 ? 'os dois golpes' : 'um golpe'} da Rajada por ${curas === 2 ? 'duas curas' : 'uma cura'}.`);
  return 2 - curas;
}
/** MÃO DO DANO (3º): interruptor; o primeiro golpe desarmado do turno gasta 1 ki (de graça na Rajada, no 11º) e soma o dado + SAB necrótico. */
export function maoDoDano(enc, atacante, alvo, extra) {
  if (!atacante.maoDoDanoLigada || !atacante.features?.includes('handOfHarm') || atacante.armaDoGolpeAgora !== 'punhos' || !naVez(enc, atacante) || alvo.dead) return;
  const vez = enc.turnoKey();
  if (atacante.maoDoDanoEm === vez) return;
  const gratis = atacante.naRajada && atacante.features.includes('flurryOfHealingAndHarm');
  if (!gratis && !(atacante.resources?.ki > 0)) return;
  if (!gratis) atacante.resources.ki -= 1;
  atacante.maoDoDanoEm = vez;
  extra('Mão do Dano', `1${atacante.dadoDeArtesMarciais ?? 'd6'}+${Math.max(0, abilityMod(atacante.abilities?.wis ?? 10))}`, 'necrótico');
  if (atacante.features.includes('physiciansTouch') && !alvo.dead) {
    enc.aplicarCondicao(alvo, 'envenenado', { rounds: enc.side === atacante.side ? 2 : 1, quando: 'fim', lado: atacante.side, source: atacante.id });
  }
}
/** MÃO DA MISERICÓRDIA SUPREMA (17º): ação e 5 ki, toque no corpo de quem morreu há pouco; ele volta com 4d10 + SAB. */
export function maoDaMisericordia(enc, actor, alvo) {
  if (actor.actionUsed || !(actor.resources?.handOfUltimateMercy > 0) || (actor.resources?.ki ?? 0) < 5 || !alvo?.dead || alvo.side !== actor.side || distanceFt(actor.pos, alvo.pos) > 5) return false;
  actor.actionUsed = true;
  actor.resources.handOfUltimateMercy -= 1;
  actor.resources.ki -= 5;
  alvo.dead = false;
  alvo.hp = 0;
  for (const id of ['cego', 'surdo', 'paralisado', 'envenenado', 'atordoado', 'inconsciente']) removeCondition(alvo, id);
  if (alvo.deathSaves) alvo.deathSaves = { successes: 0, failures: 0 };
  const pv = enc.heal(alvo, damageRoll(enc.rng, `4d10+${Math.max(0, abilityMod(actor.abilities?.wis ?? 10))}`).total, actor);
  enc.say('cura', `${actor.name} toca o corpo de ${alvo.name}, e a vida volta: ${pv} PV (Mão da Misericórdia Suprema).`);
  return true;
}

// ============================================================ Caminho do Eu Astral

const temBracos = (c) => hasCondition(c, 'bracosAstrais') || hasCondition(c, 'euAstralDesperto');
/** BRAÇOS DO EU ASTRAL (3º): ação bônus e 1 ki, 10 minutos; ao surgir, quem está a 3 m testa DES ou leva dois dados de Artes Marciais de energético. */
export function bracosAstrais(enc, actor) {
  if (actor.bonusUsed || !(actor.resources?.ki > 0) || temBracos(actor)) return false;
  actor.bonusUsed = true;
  actor.resources.ki -= 1;
  addCondition(actor, 'bracosAstrais', { rounds: 100, source: actor.id });
  enc.say('recurso', `Braços espectrais saem dos ombros de ${actor.name} (Braços do Eu Astral).`);
  ondaDosBracos(enc, actor);
  return true;
}
function ondaDosBracos(enc, actor) {
  const dc = 8 + proficiencyBonus(actor.level ?? 3) + abilityMod(actor.abilities?.wis ?? 10);
  for (const c of enc.enemiesOf(actor).filter((e) => !e.dead && e.pos && distanceFt(actor.pos, e.pos) <= 10)) {
    const sv = enc.resistencia(c, 'dex', dc, { contra: { magico: true } });
    if (!sv.success) { const r = damageRoll(enc.rng, `2${actor.dadoDeArtesMarciais ?? 'd4'}`); enc.outraFonte(() => enc.applyDamage(c, r.total, 'energético', actor, { magico: true })); }
  }
}
/** O punho dos braços astrais: alcance de 3 m no turno do monge, Sabedoria se for maior, e dano energético. */
export function punhoAstral(actor, w) {
  if (!w || w.id !== 'punhos' || !temBracos(actor)) return w;
  return { ...w, reachFt: 10, type: 'energético', raridade: w.raridade ?? 'astral' };
}
export const sabedoriaNosBracos = (actor, w, hab) => (w?.id === 'punhos' && temBracos(actor) && (actor.abilities?.wis ?? 10) > (actor.abilities?.[hab] ?? 10) ? 'wis' : hab);
/** SEMBLANTE DO EU ASTRAL (6º): ação bônus e 1 ki, 10 minutos; visão no escuro de 36 m, vantagem em Intuição e Intimidação. */
export function semblanteAstral(enc, actor) {
  if (actor.bonusUsed || !(actor.resources?.ki > 0) || hasCondition(actor, 'semblanteAstral')) return false;
  actor.bonusUsed = true;
  actor.resources.ki -= 1;
  addCondition(actor, 'semblanteAstral', { rounds: 100, source: actor.id });
  enc.say('recurso', `Uma máscara espectral cobre o rosto de ${actor.name} (Semblante do Eu Astral).`);
  return true;
}
const corpoAstral = (c) => c.features?.includes('bodyOfTheAstralSelf') && temBracos(c) && (hasCondition(c, 'semblanteAstral') || hasCondition(c, 'euAstralDesperto'));
/** CORPO DO EU ASTRAL (11º): reação; o dano elemental de 8 ou mais perde 1d10 + SAB. */
export function desvioAstral(enc, alvo, amount, tipo) {
  if (!corpoAstral(alvo) || alvo.reactionUsed || !desperto(alvo) || amount < 8 || !['ácido', 'frio', 'fogo', 'energético', 'elétrico', 'trovejante'].includes(tipo)) return amount;
  alvo.reactionUsed = true;
  const reduz = Math.max(1, enc.rng.die(10) + abilityMod(alvo.abilities?.wis ?? 10));
  enc.say('recurso', `O corpo astral de ${alvo.name} desvia a energia: −${reduz} (Corpo do Eu Astral).`);
  return Math.max(0, amount - reduz);
}
/** O golpe dos braços com o corpo astral: uma vez por turno, + o dado de Artes Marciais. */
export function golpeDoCorpoAstral(enc, atacante, extra) {
  if (!corpoAstral(atacante) || atacante.armaDoGolpeAgora !== 'punhos') return;
  const vez = enc.turnoKey();
  if (atacante.corpoAstralEm === vez) return;
  atacante.corpoAstralEm = vez;
  extra('Corpo do Eu Astral', `1${atacante.dadoDeArtesMarciais ?? 'd6'}`, 'energético');
}
/** EU ASTRAL DESPERTO (17º): ação bônus e 5 ki; braços, semblante e corpo, +2 de CA, e três golpes de braço na ação de Atacar. */
export function euAstralDesperto(enc, actor) {
  if (actor.bonusUsed || (actor.resources?.ki ?? 0) < 5 || hasCondition(actor, 'euAstralDesperto')) return false;
  actor.bonusUsed = true;
  actor.resources.ki -= 5;
  addCondition(actor, 'euAstralDesperto', { rounds: 100, source: actor.id });
  if (!hasCondition(actor, 'semblanteAstral')) addCondition(actor, 'semblanteAstral', { rounds: 100, source: actor.id });
  enc.say('recurso', `${actor.name} desperta o eu astral inteiro.`);
  ondaDosBracos(enc, actor);
  return true;
}
export const golpeAstralAMais = (actor, arma) => ((arma ?? actor.equippedWeapon) === 'punhos' && hasCondition(actor, 'euAstralDesperto') ? 1 : 0);

// ============================================================ hooks de começo do lado (Tasha, 2º lote)

export function comecoDoLadoTce2(enc, side) {
  haloDeEsporos(enc, side);
  menteProtegida(enc, side);
}
export function fimDoLadoTce2(enc, side) {
  runaDaPedra(enc, side);
}

// ============================================================ Juramento da Glória (Tasha, 3º lote)

const carDe = (c) => Math.max(1, abilityMod(c.abilities?.cha ?? 10));
/** GOLPE INSPIRADOR (3º): logo depois da Destruição Divina, ação bônus e Canalizar Divindade; 2d8 + nível de PV temporários repartidos a 9 m. */
export function golpeInspirador(enc, actor) {
  if (!actor.features?.includes('inspiringSmite') || actor.bonusUsed || !(actor.resources?.channelDivinity > 0) || actor.destruiuEm !== enc.turnoKey()) return false;
  actor.bonusUsed = true;
  actor.resources.channelDivinity -= 1;
  const total = damageRoll(enc.rng, `2d8+${actor.level ?? 3}`).total;
  const quem = enc.combatants.filter((c) => c.side === actor.side && !c.dead && c.hp > 0 && c.pos && distanceFt(actor.pos, c.pos) <= 30 && (c === actor || ve(enc, actor, c)))
    .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
  const parte = Math.floor(total / quem.length);
  const sobra = total - parte * quem.length;
  quem.forEach((c, i) => { c.tempHp = Math.max(c.tempHp ?? 0, parte + (i === 0 ? sobra : 0)); });
  enc.say('recurso', `O golpe de ${actor.name} inflama o grupo: ${total} PV temporários repartidos entre ${quem.map((c) => c.name).join(', ')} (Golpe Inspirador).`);
  return true;
}
/** ATLETA SEM IGUAL (3º): ação bônus e Canalizar Divindade; dez minutos de vantagem em Atletismo e Acrobacia. */
export function atletaSemIgual(enc, actor) {
  if (!actor.features?.includes('peerlessAthlete') || actor.bonusUsed || !(actor.resources?.channelDivinity > 0) || hasCondition(actor, 'atletaSemIgual')) return false;
  actor.bonusUsed = true;
  actor.resources.channelDivinity -= 1;
  addCondition(actor, 'atletaSemIgual', { rounds: 100, source: actor.id });
  enc.say('recurso', `${actor.name} sente o corpo de um campeão (Atleta Sem Igual).`);
  return true;
}
export const vantagemDeAtleta = (c, pericia) => ['atletismo', 'acrobacia'].includes(pericia) && hasCondition(c, 'atletaSemIgual');
/** AURA DE PRONTIDÃO (7º): +3 m no andar do paladino; quem começa o turno a 1,5 m dele (3 m no 18º) ganha +3 m nesse turno. */
export function deslocamentoDaProntidao(c) {
  return (c.features?.includes('auraOfAlacrity') ? 10 : 0) + (hasCondition(c, 'auraDeProntidao') ? 10 : 0);
}
function auraDeProntidao(enc, side) {
  for (const p of enc.allOf(side)) {
    if (!p.features?.includes('auraOfAlacrity') || !desperto(p) || !p.pos) continue;
    for (const c of enc.allOf(side)) {
      if (c === p || c.dead || !c.pos || distanceFt(p.pos, c.pos) > (p.raioDaAuraDeProntidao ?? 5)) continue;
      addCondition(c, 'auraDeProntidao', { rounds: 1, quando: 'fim', lado: side, source: p.id });
    }
  }
}
/**
 * DEFESA GLORIOSA (15º): reação; quando o paladino, ou alguém que ele vê a 3 m, é acertado, soma o Carisma à CA contra o golpe.
 * No jogo sai só quando o Carisma faz errar. Devolve { bonus, paladino } ou null.
 */
export function defesaGloriosa(enc, alvo, atacante, total, ac) {
  const p = enc.combatants.find((c) => c.side === alvo.side && c.features?.includes('gloriousDefense') && (c.resources?.gloriousDefense ?? 0) > 0 && !c.reactionUsed && desperto(c)
    && (c === alvo || (c.pos && alvo.pos && distanceFt(c.pos, alvo.pos) <= 10 && ve(enc, c, alvo))));
  if (!p || total >= ac + carDe(p)) return null;
  p.reactionUsed = true;
  p.resources.gloriousDefense -= 1;
  enc.say('recurso', `${p.name} ergue a glória diante de ${alvo.name}: +${carDe(p)} de CA contra ${atacante.name} (Defesa Gloriosa).`);
  return { bonus: carDe(p), paladino: p };
}
/** ...e se o golpe erra, o paladino ataca quem atacou, se o alcança com a arma da mão. */
export function contraGlorioso(enc, p, atacante) {
  if (p.dead || atacante.dead || !p.pos || !atacante.pos) return;
  const arma = WEAPONS[p.equippedWeapon];
  if (!arma) return;
  const alcance = arma.ranged ? arma.rangeFt ?? 0 : arma.reachFt ?? (arma.props?.includes('alcance') ? 10 : 5);
  if (distanceFt(p.pos, atacante.pos) > alcance || !enc.canAttack(p, atacante, p.equippedWeapon).ok) return;
  enc.say('recurso', `${p.name} responde ao golpe que falhou (Defesa Gloriosa).`);
  enc.resolveAttackBase(p, atacante, { weaponId: p.equippedWeapon });
}
/** LENDA VIVA (20º): ação bônus, 1 minuto; vantagem nos testes de Carisma, um erro por turno vira acerto, e a resistência que falha se rola de novo. */
export function lendaViva(enc, actor) {
  if (!actor.features?.includes('livingLegend') || actor.bonusUsed || !(actor.resources?.livingLegend > 0) || hasCondition(actor, 'lendaViva')) return false;
  actor.bonusUsed = true;
  actor.resources.livingLegend -= 1;
  addCondition(actor, 'lendaViva', { rounds: 10, source: actor.id });
  enc.say('recurso', `${actor.name} se ergue como uma lenda viva.`);
  return true;
}
export const vantagemDaLenda = (c, hab) => hab === 'cha' && hasCondition(c, 'lendaViva');
export function erroQueALendaAcerta(enc, atacante, atk, weaponId) {
  if (atk.hit || !hasCondition(atacante, 'lendaViva') || atacante.attacks || !WEAPONS[weaponId ?? atacante.equippedWeapon]) return atk;
  const vez = enc.turnoKey();
  if (atacante.lendaAcertouEm === vez) return atk;
  atacante.lendaAcertouEm = vez;
  enc.say('recurso', `O golpe de ${atacante.name} errava, e a lenda o faz acertar (Lenda Viva).`);
  return { ...atk, hit: true, critical: false, fumble: false };
}
function lendaNaResistencia(enc, actor, rolado, rerolar) {
  if (rolado.success || !hasCondition(actor, 'lendaViva') || actor.reactionUsed || conditionEffects(actor).incapacitated) return rolado;
  actor.reactionUsed = true;
  const novo = rerolar();
  enc.say('recurso', `${actor.name} rola a resistência de novo (Lenda Viva): ${novo.total}${novo.success ? ', e passa' : ''}.`);
  return novo;
}

// ============================================================ Juramento dos Vigilantes

const DE_OUTRO_PLANO = ['aberração', 'celestial', 'elemental', 'feérico', 'fada', 'corruptor'];
export const deOutroPlano = (c) => DE_OUTRO_PLANO.includes(c?.tipo);
/** ABJURAR O EXTRAPLANAR (3º): ação e Canalizar Divindade; aberração, celestial, elemental, feérico e corruptor a 9 m testam SAB ou são expulsos. */
export function abjurarOExtraplanar(enc, actor) {
  if (!actor.features?.includes('abjureTheExtraplanar') || actor.actionUsed || !(actor.resources?.channelDivinity > 0)) return false;
  actor.actionUsed = true;
  actor.resources.channelDivinity -= 1;
  const dc = spellSaveDc(actor);
  const alvos = enc.enemiesOf(actor).filter((e) => !e.dead && e.pos && deOutroPlano(e) && distanceFt(actor.pos, e.pos) <= 30);
  enc.say('recurso', `${actor.name} ergue o símbolo e manda embora o que não é deste mundo (CD ${dc}).`);
  for (const t of alvos) {
    const sv = enc.resistencia(t, 'wis', dc, { contra: { magico: true, condicao: 'amedrontado', conjurador: actor } });
    enc.explicarResistencia(t, 'wis', dc, sv, { contra: `Abjurar o Extraplanar de ${actor.name}`, seSucesso: 'fica' });
    if (sv.success) continue;
    if (enc.aplicarCondicao(t, 'amedrontado', { rounds: 10, source: actor.id, data: { expulso: true } })) {
      t.fugindoDe = actor.id;
      enc.say('condicao', `${t.name} é expulso: recua de ${actor.name}, sem conseguir chegar perto.`);
    }
  }
  if (!alvos.length) enc.say('recurso', 'Nenhuma criatura de outro plano por perto.');
  return true;
}
/** VONTADE DO VIGILANTE (3º): ação e Canalizar Divindade; você e até CAR criaturas a 9 m ganham vantagem nas resistências de INT, SAB e CAR. */
export function vontadeDoVigilante(enc, actor) {
  if (!actor.features?.includes('watchersWill') || actor.actionUsed || !(actor.resources?.channelDivinity > 0)) return false;
  actor.actionUsed = true;
  actor.resources.channelDivinity -= 1;
  const outros = enc.combatants.filter((c) => c !== actor && c.side === actor.side && !c.dead && c.pos && distanceFt(actor.pos, c.pos) <= 30 && ve(enc, actor, c))
    .sort((a, b) => distanceFt(actor.pos, a.pos) - distanceFt(actor.pos, b.pos)).slice(0, carDe(actor));
  for (const c of [actor, ...outros]) addCondition(c, 'vontadeDoVigilante', { rounds: 10, source: actor.id });
  enc.say('recurso', `${actor.name} firma a mente de ${[actor, ...outros].map((c) => c.name).join(', ')} (Vontade do Vigilante).`);
  return true;
}
/** AURA DA SENTINELA (7º): você e os aliados a 3 m (9 m no 18º) somam a proficiência à iniciativa. */
export function bonusDaSentinela(enc, c) {
  let melhor = 0;
  for (const p of enc.combatants) {
    if (p.side !== c.side || !p.features?.includes('auraOfTheSentinel') || !desperto(p) || !p.pos || !c.pos) continue;
    if (p !== c && distanceFt(p.pos, c.pos) > (p.raioDaAuraDaSentinela ?? 10)) continue;
    melhor = Math.max(melhor, proficiencyBonus(p.level ?? 7));
  }
  return melhor;
}
/** REPREENSÃO VIGILANTE (15º): reação; quem passa numa resistência de INT, SAB ou CAR, a 9 m do paladino, devolve 2d8 + CAR de energético a quem a forçou. */
function repreensaoVigilante(enc, salvo, hab, forcador) {
  if (!['int', 'wis', 'cha'].includes(hab) || !forcador || forcador.dead || forcador.side === salvo.side) return;
  const p = enc.combatants.find((c) => c.side === salvo.side && c.features?.includes('vigilantRebuke') && !c.reactionUsed && desperto(c)
    && (c === salvo || (c.pos && salvo.pos && distanceFt(c.pos, salvo.pos) <= 30 && ve(enc, c, salvo))));
  if (!p) return;
  p.reactionUsed = true;
  const r = damageRoll(enc.rng, `2d8+${carDe(p)}`);
  enc.say('recurso', `${p.name} devolve a força da vontade de ${salvo.name} contra ${forcador.name}: ${r.total} de energético (Repreensão Vigilante).`, `2d8+${carDe(p)}[${r.rolls.join('+')}]`);
  enc.outraFonte(() => enc.applyDamage(forcador, r.total, 'energético', p, { magico: true }));
}
/** BALUARTE MORTAL (20º): ação bônus, 1 minuto; visão verdadeira de 36 m, vantagem contra quem é de outro plano, e o ataque que fere pode bani-lo. */
export function baluarteMortal(enc, actor) {
  if (!actor.features?.includes('mortalBulwark') || actor.bonusUsed || !(actor.resources?.mortalBulwark > 0) || hasCondition(actor, 'baluarteMortal')) return false;
  actor.bonusUsed = true;
  actor.resources.mortalBulwark -= 1;
  addCondition(actor, 'baluarteMortal', { rounds: 10, source: actor.id });
  enc.say('recurso', `${actor.name} vira um baluarte entre os mundos (Baluarte Mortal).`);
  return true;
}
export const vantagemDoBaluarte = (atacante, alvo) => hasCondition(atacante, 'baluarteMortal') && deOutroPlano(alvo);
function banirPeloBaluarte(enc, alvo, fonte) {
  if (!hasCondition(fonte, 'baluarteMortal') || !deOutroPlano(alvo) || alvo.dead || alvo.hp <= 0 || alvo.baluarteResistiu?.includes(fonte.id) || hasCondition(alvo, 'banidoDeVez')) return;
  const dc = spellSaveDc(fonte);
  const sv = enc.resistencia(alvo, 'cha', dc, { contra: { magico: true, conjurador: fonte } });
  enc.explicarResistencia(alvo, 'cha', dc, sv, { contra: `Baluarte Mortal de ${fonte.name}`, seSucesso: 'fica neste plano' });
  if (sv.success) { (alvo.baluarteResistiu ??= []).push(fonte.id); return; }
  enc.aplicarCondicao(alvo, 'banidoDeVez', { source: fonte.id });
  enc.say('condicao', `${alvo.name} é mandado de volta ao plano de onde veio (Baluarte Mortal).`);
}

// ============================================================ Andarilho Feérico

/** GOLPES TERRÍVEIS (3º): +1d4 psíquico (1d6 no 11º) no acerto de arma; cada alvo só uma vez por turno. */
export function golpesTerriveis(enc, atacante, alvo, extra) {
  if (!atacante.features?.includes('dreadfulStrikes') || alvo.dead) return;
  const marca = `${enc.turnoKey()}:${atacante.id}`;
  if (alvo.terrivelEm === marca) return;
  alvo.terrivelEm = marca;
  extra('Golpes Terríveis', atacante.dadoTerrivel ?? '1d4', 'psíquico');
}
/** ENCANTO SOBRENATURAL (3º): os testes de Carisma somam a Sabedoria (mínimo +1). */
export const bonusDoEncanto = (c, hab) => (hab === 'cha' && c.features?.includes('otherworldlyGlamour') ? Math.max(1, abilityMod(c.abilities?.wis ?? 10)) : 0);
/** REVIRAVOLTA SEDUTORA (7º): vantagem contra encanto e medo... */
export const vantagemDaReviravolta = (c, contra) => !!c.features?.includes('beguilingTwist') && ['enfeiticado', 'amedrontado'].includes(contra?.condicao);
/** ...e quando um aliado a 36 m passa num desses testes, a reação vira o encanto (ou o medo) contra outra criatura. */
function reviravoltaSedutora(enc, salvo, contra) {
  if (!['enfeiticado', 'amedrontado'].includes(contra?.condicao)) return;
  const r = enc.combatants.find((c) => c.side === salvo.side && c.features?.includes('beguilingTwist') && !c.reactionUsed && desperto(c)
    && (c === salvo || (c.pos && salvo.pos && distanceFt(c.pos, salvo.pos) <= 120 && ve(enc, c, salvo))));
  if (!r) return;
  const alvo = enc.enemiesOf(r).filter((e) => !e.dead && e.pos && e !== salvo && distanceFt(r.pos, e.pos) <= 120 && ve(enc, r, e))
    .sort((a, b) => distanceFt(r.pos, a.pos) - distanceFt(r.pos, b.pos))[0];
  if (!alvo) return;
  r.reactionUsed = true;
  const cond = alvo.conditionImmunities?.includes('amedrontado') ? 'enfeiticado' : 'amedrontado';
  const dc = spellSaveDc(r);
  enc.say('recurso', `${r.name} torce a magia que ${salvo.name} afastou e a joga em ${alvo.name} (Reviravolta Sedutora).`);
  const sv = enc.resistencia(alvo, 'wis', dc, { contra: { magico: true, condicao: cond, conjurador: r } });
  enc.explicarResistencia(alvo, 'wis', dc, sv, { contra: `Reviravolta Sedutora de ${r.name}`, seSucesso: 'não se deixa levar' });
  if (!sv.success && enc.aplicarCondicao(alvo, cond, { rounds: 10, source: r.id, data: { save: 'wis', dc, repete: true } })) {
    enc.say('condicao', `${alvo.name} fica ${cond === 'amedrontado' ? 'amedrontado' : 'enfeitiçado'} por ${r.name}.`);
  }
}
/** REFORÇOS FEÉRICOS (11º) e ANDARILHO NEBULOSO (15º): o Invocar Feérico uma vez e o Passo Nebuloso SAB vezes, sem espaço (`usoLivreDe`). */
export function magiaDoAndarilho(c, spell, pedido) {
  if (pedido != null && pedido !== spell?.level) return null;
  if (spell?.id === 'invocarFeerico' && c.features?.includes('feyReinforcements') && (c.resources?.feyReinforcements ?? 0) > 0) {
    return { tipo: 'feerico', circulo: spell.level, recurso: 'feyReinforcements', rotulo: 'Reforços Feéricos' };
  }
  if (spell?.id === 'passoNebuloso' && c.features?.includes('mistyWanderer') && (c.resources?.mistyWanderer ?? 0) > 0) {
    return { tipo: 'nebuloso', circulo: spell.level, recurso: 'mistyWanderer', rotulo: 'Andarilho Nebuloso' };
  }
  return null;
}
export const levaAliadoNoPasso = (c, spell) => spell?.id === 'passoNebuloso' && !!c.features?.includes('mistyWanderer');

// ============================================================ Guardião do Enxame

/** ENXAME REUNIDO (3º): uma vez por turno, no acerto de ataque: 1d6 perfurante (1d8 no 11º), ou o empurrão de 4,5 m (FOR), que derruba no 11º. */
export function enxameReunido(enc, atacante, alvo, extra) {
  if (!atacante.features?.includes('gatheredSwarm') || alvo.dead) return;
  const vez = enc.turnoKey();
  if (atacante.enxameEm === vez) return;
  atacante.enxameEm = vez;
  if ((atacante.enxameModo ?? 'dano') === 'dano') { extra('Enxame Reunido', atacante.dadoDoEnxame ?? '1d6', 'perfurante'); return; }
  const dc = spellSaveDc(atacante);
  const sv = enc.resistencia(alvo, 'str', dc, { contra: { magico: true } });
  enc.explicarResistencia(alvo, 'str', dc, sv, { contra: `o enxame de ${atacante.name}`, seSucesso: 'fica onde está' });
  if (sv.success) return;
  enc.say('recurso', `O enxame de ${atacante.name} carrega ${alvo.name} (Enxame Reunido).`);
  enc.empurrar(alvo, atacante.pos, 15);
  if (atacante.features.includes('mightySwarm') && !alvo.dead && !hasCondition(alvo, 'caido')) {
    addCondition(alvo, 'caido');
    enc.say('condicao', `${alvo.name} cai no chão (Enxame Poderoso).`);
  }
}
/** MARÉ ONDULANTE (7º): ação bônus; um minuto de voo de 3 m, pairando. */
export function mareOndulante(enc, actor) {
  if (!actor.features?.includes('writhingTide') || actor.bonusUsed || !(actor.resources?.writhingTide > 0) || hasCondition(actor, 'mareOndulante')) return false;
  actor.bonusUsed = true;
  actor.resources.writhingTide -= 1;
  addCondition(actor, 'mareOndulante', { rounds: 10, source: actor.id, data: { voo: 10 } });
  enc.say('recurso', `O enxame ergue ${actor.name} do chão (Maré Ondulante).`);
  return true;
}
/** DISPERSÃO DO ENXAME (15º): reação ao dano; resistência a ele, e o teleporte para uma casa livre a 9 m. */
export function dispersaoDoEnxame(enc, alvo, fonte, amount) {
  if (amount <= 0 || !fonte || fonte.side === alvo.side || !alvo.features?.includes('swarmingDispersal') || !(alvo.resources?.swarmingDispersal > 0)
    || alvo.reactionUsed || !desperto(alvo) || !alvo.pos) return amount;
  if (amount < 8 && amount < alvo.hp + (alvo.tempHp ?? 0)) return amount;
  alvo.reactionUsed = true;
  alvo.resources.swarmingDispersal -= 1;
  const metade = Math.floor(amount / 2);
  let melhor = null;
  for (let dy = -6; dy <= 6; dy++) {
    for (let dx = -6; dx <= 6; dx++) {
      const x = alvo.pos.x + dx;
      const y = alvo.pos.y + dy;
      const casa = { ...alvo.pos, x, y };
      if ((dx === 0 && dy === 0) || distanceFt(alvo.pos, casa) > 30 || !enc.field.inside(x, y) || enc.field.blocksMove(x, y) || enc.occupied(x, y)) continue;
      if (!enc.field.hasLineOfSight(alvo.pos, casa)) continue;
      const longe = fonte.pos ? distanceFt(fonte.pos, casa) : 0;
      if (!melhor || longe > melhor.longe) melhor = { casa, longe };
    }
  }
  enc.say('recurso', `${alvo.name} se desfaz no enxame: o dano cai para ${metade}${melhor ? ', e ele reaparece longe dali' : ''} (Dispersão do Enxame).`);
  if (melhor) {
    const de = { ...alvo.pos };
    alvo.pos = { ...alvo.pos, x: melhor.casa.x, y: melhor.casa.y };
    enc.onEvent({ type: 'teleporte', actor: alvo, from: de, to: { ...alvo.pos } });
  }
  return metade;
}

// ============================================================ Fantasma

const dadosDoFurtivoDe = (c) => Number(String(c.sneakAttack ?? '1d6').match(/^(\d+)d/)?.[1] ?? 1);
/** LAMENTOS DO TÚMULO (3º): logo depois do Ataque Furtivo, no seu turno, metade dos dados (para cima) de necrótico em outra criatura a 9 m da primeira. */
export function lamentosDoTumulo(enc, atacante, alvo) {
  if (!atacante.features?.includes('wailsFromTheGrave') || !naVez(enc, atacante) || !alvo.pos) return;
  const segundo = enc.enemiesOf(atacante).filter((e) => e !== alvo && !e.dead && e.pos && distanceFt(alvo.pos, e.pos) <= 30 && ve(enc, atacante, e))
    .sort((a, b) => distanceFt(alvo.pos, a.pos) - distanceFt(alvo.pos, b.pos))[0];
  if (!segundo) return;
  let pago;
  if ((atacante.resources?.wailsFromTheGrave ?? 0) > 0) { atacante.resources.wailsFromTheGrave -= 1; pago = 'um uso'; }
  else if ((atacante.berloquesDeAlma ?? 0) > 0) { atacante.berloquesDeAlma -= 1; pago = 'um berloque de alma'; }
  else return;
  const dados = `${Math.ceil(dadosDoFurtivoDe(atacante) / 2)}d6`;
  const r = damageRoll(enc.rng, dados);
  const quem = [segundo, ...(atacante.features.includes('deathsFriend') && !alvo.dead ? [alvo] : [])];
  enc.say('recurso', `Um lamento do túmulo sai do golpe de ${atacante.name}: ${r.total} de necrótico em ${quem.map((c) => c.name).join(' e ')} (Lamentos do Túmulo, ${pago}).`, `${dados}[${r.rolls.join('+')}]`);
  for (const c of quem) enc.outraFonte(() => enc.applyDamage(c, r.total, 'necrótico', atacante, { magico: true }));
}
/** LEMBRANÇAS DOS FALECIDOS (9º): reação; a criatura que morre a 9 m deixa um berloque de alma (no máximo a proficiência). */
export function lembrancasDosFalecidos(enc, morto) {
  if (!morto.pos) return;
  const l = enc.combatants.find((c) => c !== morto && c.features?.includes('tokensOfTheDeparted') && !c.reactionUsed && desperto(c) && c.pos
    && distanceFt(c.pos, morto.pos) <= 30 && ve(enc, c, morto) && (c.berloquesDeAlma ?? 0) < proficiencyBonus(c.level ?? 9));
  if (!l) return;
  l.reactionUsed = true;
  l.berloquesDeAlma = (l.berloquesDeAlma ?? 0) + 1;
  enc.say('recurso', `${l.name} prende a alma de ${morto.name} num berloque (${l.berloquesDeAlma}, Lembranças dos Falecidos).`);
}
export const comBerloque = (c) => !!c.features?.includes('tokensOfTheDeparted') && (c.berloquesDeAlma ?? 0) > 0;
/** CAMINHAR FANTASMA (13º): ação bônus, dez minutos; voo de 3 m e desvantagem em quem o ataca. Uma vez por descanso longo, ou um berloque. */
export function caminharFantasma(enc, actor) {
  if (!actor.features?.includes('ghostWalk') || actor.bonusUsed || hasCondition(actor, 'caminharFantasma')) return false;
  let pago = '';
  if ((actor.resources?.ghostWalk ?? 0) > 0) actor.resources.ghostWalk -= 1;
  else if ((actor.berloquesDeAlma ?? 0) > 0) { actor.berloquesDeAlma -= 1; pago = ', um berloque se desfaz'; }
  else return false;
  actor.bonusUsed = true;
  addCondition(actor, 'caminharFantasma', { rounds: 100, source: actor.id, data: { voo: 10 } });
  enc.say('recurso', `${actor.name} vira meio fantasma (Caminhar Fantasma${pago}).`);
  return true;
}

// ============================================================ Lâmina da Alma

export const LAMINAS_DA_ALMA = ['laminaDaAlma', 'laminaDaAlmaSegunda', 'laminaDaAlmaArremesso', 'laminaDaAlmaSegundaArremesso'];
/** A ação de Atacar deste turno já usou a Lâmina Psíquica (de perto ou arremessada)? */
export const usouALamina = (enc, c) => c.acaoDeAtaque?.turno === enc.turnoKey() && c.acaoDeAtaque.armas.some((a) => a === 'laminaDaAlma' || a === 'laminaDaAlmaArremesso');
/** LÂMINAS PSÍQUICAS (3º): depois de golpear com a lâmina na ação de Atacar, a segunda (1d4) como ação bônus, de perto ou arremessada. */
export function segundaLamina(enc, actor, alvo) {
  if (!alvo || alvo.dead || actor.bonusUsed || !actor.features?.includes('psychicBladesSoulknife') || !usouALamina(enc, actor)) return false;
  const colado = alvo.pos && actor.pos && distanceFt(actor.pos, alvo.pos) <= 5 && enc.canAttack(actor, alvo, 'laminaDaAlmaSegunda').ok;
  const arma = colado ? 'laminaDaAlmaSegunda' : 'laminaDaAlmaSegundaArremesso';
  if (!enc.canAttack(actor, alvo, arma).ok) return false;
  actor.bonusUsed = true;
  enc.resolveAttackBase(actor, alvo, { weaponId: arma });
  return true;
}
/** GOLPES TELEGUIADOS (9º): a lâmina que erra soma um dado; o dado só se gasta se o golpe passa a acertar. */
export function golpeTeleguiado(enc, atacante, atk, ac, weaponId) {
  if (atk.hit || atk.fumble || !LAMINAS_DA_ALMA.includes(weaponId) || !atacante.features?.includes('soulBlades') || !(atacante.resources?.psionicEnergy > 0)) return atk;
  const faces = Number(dadoPsi(atacante).split('d')[1]);
  if (atk.total + faces < ac) return atk;
  const d = damageRoll(enc.rng, dadoPsi(atacante)).total;
  if (atk.total + d < ac) {
    enc.say('recurso', `${atacante.name} guia a lâmina com a mente (+${d}), e ela ainda erra (Golpes Teleguiados, o dado fica).`);
    return atk;
  }
  atacante.resources.psionicEnergy -= 1;
  enc.say('recurso', `${atacante.name} guia a lâmina com a mente: +${d}, e ela acerta (Golpes Teleguiados).`);
  return { ...atk, total: atk.total + d, hit: true };
}
/** TELETRANSPORTE PSÍQUICO (9º): o dado dá o alcance (3 m por ponto). A casa já foi escolhida: se o dado não chega, a lâmina cai no caminho. */
export function casaDoTeletransportePsiquico(enc, actor, ponto) {
  const d = damageRoll(enc.rng, dadoPsi(actor)).total;
  const limite = 10 * d;
  const ate = distanceFt(actor.pos, ponto);
  enc.say('recurso', `${actor.name} arremessa a lâmina: o dado dá ${d}, alcance de ${Math.round(limite * 0.3)} m (Teletransporte Psíquico).`);
  if (ate <= limite) return ponto;
  const passos = Math.max(Math.abs(ponto.x - actor.pos.x), Math.abs(ponto.y - actor.pos.y));
  for (let i = passos - 1; i >= 1; i--) {
    const x = Math.round(actor.pos.x + ((ponto.x - actor.pos.x) * i) / passos);
    const y = Math.round(actor.pos.y + ((ponto.y - actor.pos.y) * i) / passos);
    const casa = { ...ponto, x, y };
    if (distanceFt(actor.pos, casa) > limite || !enc.field.inside(x, y) || enc.field.blocksMove(x, y) || enc.occupied(x, y)) continue;
    return casa;
  }
  return actor.pos;
}
/** VÉU PSÍQUICO (13º): ação; invisível por uma hora, até ferir alguém ou forçar um teste. Uma vez por descanso longo, depois um dado. */
export function veuPsiquico(enc, actor) {
  if (!actor.features?.includes('psychicVeil') || actor.actionUsed) return false;
  if ((actor.resources?.psychicVeil ?? 0) > 0) actor.resources.psychicVeil -= 1;
  else if (!gastarDadoPsi(actor)) return false;
  actor.actionUsed = true;
  addCondition(actor, 'invisivel', { rounds: 600, source: actor.id, data: { persistente: true, veu: true } });
  enc.say('recurso', `${actor.name} some atrás de um véu da mente (Véu Psíquico).`);
  return true;
}
function quebrarVeu(enc, c) {
  if (getCondition(c, 'invisivel')?.data?.veu) {
    removeCondition(c, 'invisivel');
    enc.say('magia', `O véu psíquico de ${c.name} se rasga.`);
  }
}
/** RASGAR A MENTE (17º): o Ataque Furtivo com a lâmina pede SAB (8 + proficiência + DES) ou atordoa por um minuto. */
export function rasgarMente(enc, atacante, alvo, weaponId) {
  if (!atacante.features?.includes('rendMind') || !LAMINAS_DA_ALMA.includes(weaponId) || alvo.dead || alvo.hp <= 0) return;
  if ((atacante.resources?.rendMind ?? 0) > 0) atacante.resources.rendMind -= 1;
  else if ((atacante.resources?.psionicEnergy ?? 0) >= 3) atacante.resources.psionicEnergy -= 3;
  else return;
  const dc = 8 + proficiencyBonus(atacante.level ?? 17) + abilityMod(atacante.abilities?.dex ?? 10);
  const sv = enc.resistencia(alvo, 'wis', dc, { contra: { condicao: 'atordoado' } });
  enc.explicarResistencia(alvo, 'wis', dc, sv, { contra: `Rasgar a Mente de ${atacante.name}`, seSucesso: 'segura a mente' });
  if (!sv.success && enc.aplicarCondicao(alvo, 'atordoado', { rounds: 10, source: atacante.id, data: { save: 'wis', dc, repete: true } })) {
    enc.say('condicao', `A lâmina de ${atacante.name} rasga a mente de ${alvo.name}: atordoado (Rasgar a Mente).`);
  }
}

// ============================================================ hooks do Tasha (3º lote)

export function comecoDoLadoTce3(enc, side) {
  auraDeProntidao(enc, side);
}
/** Depois que o dano entra: o véu se rasga em quem feriu, o expulso volta a si, e o Baluarte Mortal bane. */
export function depoisDoDanoTce3(enc, alvo, fonte, { deAtaque = false } = {}) {
  if (fonte && fonte !== alvo) quebrarVeu(enc, fonte);
  const exp = (alvo.conditions ?? []).find((k) => k.id === 'amedrontado' && k.data?.expulso);
  if (exp) { removeCondition(alvo, 'amedrontado'); delete alvo.fugindoDe; }
  if (deAtaque && fonte) banirPeloBaluarte(enc, alvo, fonte);
}
/** Vantagem na resistência: a Vontade do Vigilante vem pela condição; aqui a Reviravolta e os berloques (CON). */
export const vantagemNaResistenciaTce3 = (actor, hab, contra) => vantagemDaReviravolta(actor, contra) || (hab === 'con' && comBerloque(actor));
/** Depois da resistência: o véu de quem forçou se rasga; a Lenda Viva rola de novo; a Repreensão e a Reviravolta respondem ao sucesso. */
export function depoisDaResistenciaTce3(enc, actor, hab, rolado, { contra, forcador, rerolar }) {
  if (forcador && forcador !== actor) quebrarVeu(enc, forcador);
  const r = lendaNaResistencia(enc, actor, rolado, rerolar);
  if (r.success) {
    repreensaoVigilante(enc, actor, hab, forcador);
    reviravoltaSedutora(enc, actor, contra);
  }
  return r;
}

// ============================================================ Mente Aberrante (Tasha, 4º lote)

const MAGIAS_PSIONICAS = ['bracosDeHadar', 'sussurrosDissonantes', 'acalmarEmocoes', 'detectarPensamentos', 'fomeDeHadar', 'enviarMensagem',
  'tentaculosNegrosDeEvard', 'invocarAberracao', 'vinculoTelepaticoDeRary', 'telecinesia'];
const temEspacoDe = (c, nivel) => (c.spellcasting?.slots ?? []).some((n, i) => i >= nivel && n > 0);
/** FEITIÇARIA PSIÔNICA (6º): a magia psiônica sai por pontos iguais ao círculo (no jogo, quando não há espaço do círculo dela). */
export function feiticariaPsionica(c, spell, pedido) {
  if (!c.features?.includes('psionicSorcery') || !MAGIAS_PSIONICAS.includes(spell?.id) || spell.level < 1) return null;
  if (pedido != null && pedido !== spell.level) return null;
  if (temEspacoDe(c, spell.level) || (c.resources?.sorceryPoints ?? 0) < spell.level) return null;
  return { tipo: 'pontos', circulo: spell.level, recurso: 'sorceryPoints', custo: spell.level, rotulo: `${spell.level} ${spell.level === 1 ? 'ponto' : 'pontos'} de feitiçaria (Feitiçaria Psiônica)` };
}
/** REVELAÇÃO NA CARNE (14º): ação bônus, 1 ponto por benefício, dez minutos: voo igual ao andar, e ver o invisível. */
export function revelacaoNaCarne(enc, actor, modo = 'voo') {
  const custo = modo === 'ambos' ? 2 : 1;
  if (!actor.features?.includes('revelationInFlesh') || actor.bonusUsed || (actor.resources?.sorceryPoints ?? 0) < custo || !['voo', 'visao', 'ambos'].includes(modo)) return false;
  actor.bonusUsed = true;
  actor.resources.sorceryPoints -= custo;
  const voa = modo !== 'visao';
  const ve = modo !== 'voo';
  addCondition(actor, 'revelacaoNaCarne', { rounds: 100, source: actor.id, data: voa ? { voo: actor.speedFt ?? 30 } : {} });
  if (ve) addCondition(actor, 'veInvisiveis', { rounds: 100, source: actor.id });
  enc.say('recurso', `A carne de ${actor.name} revela a aberração: ${[voa ? 'voa' : null, ve ? 'vê o invisível' : null].filter(Boolean).join(' e ')} (Revelação na Carne).`);
  return true;
}
/** IMPLOSÃO DISTORCIDA (18º): quem falha na Força é puxado para a casa de onde o feiticeiro saiu. */
export function puxarParaASaida(enc, alvo, de) {
  if (alvo.dead || !alvo.pos) return;
  let passos = 0;
  while (distanceFt(alvo.pos, de) > 5 && passos < 12) {
    const dx = Math.sign(de.x - alvo.pos.x);
    const dy = Math.sign(de.y - alvo.pos.y);
    const x = alvo.pos.x + dx;
    const y = alvo.pos.y + dy;
    if (!enc.field.inside(x, y) || enc.field.blocksMove(x, y) || enc.occupied(x, y, alvo)) break;
    alvo.pos = { ...alvo.pos, x, y };
    passos += 1;
  }
  if (passos) enc.say('condicao', `${alvo.name} é puxado ${passos * 5} pés para o vazio (Implosão Distorcida).`);
}

// ============================================================ Alma Mecânica

/** RESTAURAR O EQUILÍBRIO (1º): reação, a 18 m; tira a vantagem de um inimigo ou a desvantagem de um aliado no d20. */
function quemEquilibra(enc, quem) {
  return enc.combatants.find((c) => c.features?.includes('restoreBalance') && (c.resources?.restoreBalance ?? 0) > 0 && !c.reactionUsed && desperto(c)
    && c.pos && quem.pos && distanceFt(c.pos, quem.pos) <= 60 && (c === quem || ve(enc, c, quem)));
}
function equilibrar(enc, quem, temVantagem, temDesvantagem) {
  if (temVantagem === temDesvantagem) return null;
  const f = quemEquilibra(enc, quem);
  if (!f) return null;
  const aliado = f.side === quem.side;
  if ((aliado && !temDesvantagem) || (!aliado && !temVantagem)) return null;
  f.reactionUsed = true;
  f.resources.restoreBalance -= 1;
  enc.say('recurso', `${f.name} acerta a balança: ${quem.name} rola sem ${aliado ? 'desvantagem' : 'vantagem'} (Restaurar o Equilíbrio).`);
  return f;
}
/** Os ajustes de vantagem num golpe: o Equilíbrio e o TRANSE DA ORDEM (quem o ataca não tem vantagem). */
export function ajustarModsTce4(enc, atacante, alvo, mods) {
  const limpar = (lado) => {
    if (lado === 'vantagem') { mods.advantage = false; mods.vantagens = []; } else { mods.disadvantage = false; mods.desvantagens = []; }
    mods.anulado = mods.advantage && mods.disadvantage;
    mods.mode = mods.anulado ? 'anulado' : mods.advantage ? 'vantagem' : mods.disadvantage ? 'desvantagem' : 'normal';
  };
  if (mods.advantage && hasCondition(alvo, 'transeDaOrdem')) { limpar('vantagem'); mods.reasons.push('Transe da Ordem'); }
  if (mods.anulado) return;
  const f = equilibrar(enc, atacante, mods.advantage, mods.disadvantage);
  if (f) { limpar(f.side === atacante.side ? 'desvantagem' : 'vantagem'); mods.reasons.push('Restaurar o Equilíbrio'); }
}
/** ...e na resistência (`opts` do `savingThrow`). */
export function equilibrioNaResistencia(enc, actor, opts) {
  const f = equilibrar(enc, actor, !!opts.advantage, !!opts.disadvantage);
  if (!f) return;
  if (f.side === actor.side) opts.disadvantage = false; else opts.advantage = false;
}
/** BASTIÃO DA LEI (6º): ação, até 5 pontos; uma reserva de d8 em você ou num aliado a 9 m, até o próximo descanso longo. */
export function bastiaoDaLei(enc, actor, alvo = actor) {
  const pontos = Math.min(5, actor.resources?.sorceryPoints ?? 0);
  if (!actor.features?.includes('bastionOfLaw') || actor.actionUsed || pontos < 1 || !alvo || alvo.dead || alvo.side !== actor.side) return false;
  if (alvo !== actor && (!alvo.pos || distanceFt(actor.pos, alvo.pos) > 30 || !ve(enc, actor, alvo))) return false;
  actor.actionUsed = true;
  actor.resources.sorceryPoints -= pontos;
  for (const c of enc.combatants) if (c.bastiao?.dono === actor.id) delete c.bastiao;
  alvo.bastiao = { dados: pontos, dono: actor.id };
  enc.say('recurso', `${actor.name} ergue o bastião da lei sobre ${alvo === actor ? 'si' : alvo.name}: ${pontos}d8 de reserva (Bastião da Lei).`);
  return true;
}
export function gastarBastiao(enc, alvo, amount) {
  const b = alvo.bastiao;
  if (!b || b.dados <= 0 || amount <= 0) return amount;
  let usados = 0;
  let tirado = 0;
  while (b.dados > 0 && amount > 0 && (amount >= 5 || amount >= alvo.hp + (alvo.tempHp ?? 0))) {
    const d = enc.rng.die(8);
    b.dados -= 1;
    usados += 1;
    tirado += d;
    amount = Math.max(0, amount - d);
  }
  if (usados) enc.say('recurso', `O bastião de ${alvo.name} gasta ${usados}d8: −${tirado} de dano (Bastião da Lei, restam ${b.dados}).`);
  if (b.dados <= 0) delete alvo.bastiao;
  return amount;
}
const usarOuPontos = (c, recurso, pontos) => {
  if ((c.resources?.[recurso] ?? 0) > 0) { c.resources[recurso] -= 1; return 'um uso'; }
  if ((c.resources?.sorceryPoints ?? 0) >= pontos) { c.resources.sorceryPoints -= pontos; return `${pontos} pontos de feitiçaria`; }
  return null;
};
/** TRANSE DA ORDEM (14º): ação bônus, 1 minuto; ninguém o ataca com vantagem, e 9 ou menos no d20 dele conta como 10. */
export function transeDaOrdem(enc, actor) {
  if (!actor.features?.includes('tranceOfOrder') || actor.bonusUsed || hasCondition(actor, 'transeDaOrdem')) return false;
  const pago = usarOuPontos(actor, 'tranceOfOrder', 5);
  if (!pago) return false;
  actor.bonusUsed = true;
  addCondition(actor, 'transeDaOrdem', { rounds: 10, source: actor.id });
  enc.say('recurso', `${actor.name} entra no transe da ordem (${pago}).`);
  return true;
}
export const pisoDaOrdem = (c) => hasCondition(c, 'transeDaOrdem');
/** CAVALGADA MECÂNICA (18º): ação; 100 PV entre os aliados a 9 m, e o fim das magias de 6º círculo ou menos que os inimigos puseram neles. */
export function cavalgadaMecanica(enc, actor) {
  if (!actor.features?.includes('clockworkCavalcade') || actor.actionUsed) return false;
  const pago = usarOuPontos(actor, 'clockworkCavalcade', 7);
  if (!pago) return false;
  actor.actionUsed = true;
  const aliados = enc.combatants.filter((c) => c.side === actor.side && !c.dead && c.pos && distanceFt(actor.pos, c.pos) <= 30);
  let resta = 100;
  const curados = [];
  for (const c of [...aliados].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)) {
    const falta = Math.max(0, (c.maxHp ?? 0) - c.hp);
    if (!falta || resta <= 0) continue;
    const pv = enc.heal(c, Math.min(falta, resta), actor);
    resta -= pv;
    if (pv) curados.push(`${c.name} +${pv}`);
  }
  const desfeitas = [];
  for (const c of aliados) {
    for (const k of [...(c.conditions ?? [])]) {
      const dono = enc.combatants.find((x) => x.id === k.source);
      if (!k.magia || (k.magia.circulo ?? 0) > 6 || !dono || dono.side === actor.side) continue;
      removeCondition(c, k.id);
      desfeitas.push(`${k.id} de ${c.name}`);
    }
  }
  enc.say('recurso', `Espíritos de engrenagem enchem o lugar (Cavalgada Mecânica, ${pago}): ${curados.join(', ') || 'ninguém a curar'}${desfeitas.length ? `; acabam ${desfeitas.join(', ')}` : ''}.`);
  return true;
}

// ============================================================ O Insondável

/** ESPIRAL GUARDIÃ (6º): reação; o dano de 4 ou mais em quem está a 3 m do tentáculo cai 1d8 (2d8 no 10º). */
export function espiralGuardia(enc, alvo, fonte, amount) {
  if (amount < 4 || !alvo.pos) return amount;
  const w = enc.combatants.find((c) => c.side === alvo.side && c.features?.includes('guardianCoil') && !c.reactionUsed && desperto(c)
    && c.magiasAtivas?.tentaculoDasProfundezas?.pos && distanceFt(c.magiasAtivas.tentaculoDasProfundezas.pos, alvo.pos) <= 10 && (c === alvo || ve(enc, c, alvo)));
  if (!w) return amount;
  w.reactionUsed = true;
  const r = damageRoll(enc.rng, w.dadoDoTentaculo ?? '1d8').total;
  enc.say('recurso', `O tentáculo de ${w.name} se enrola diante de ${alvo.name}: −${r} de dano (Espiral Guardiã).`);
  return Math.max(0, amount - r);
}
/** TENTÁCULOS AGARRADORES (10º): o Tentáculos Negros de Evard sem espaço uma vez, PV temporários do nível, e o dano não quebra a concentração nele. */
export function tentaculosAgarradores(c, spell, pedido) {
  if (spell?.id !== 'tentaculosNegrosDeEvard' || !c.features?.includes('graspingTentacles') || !((c.resources?.graspingTentacles ?? 0) > 0)) return null;
  if (pedido != null && pedido !== spell.level) return null;
  return { tipo: 'agarradores', circulo: spell.level, recurso: 'graspingTentacles', rotulo: 'Tentáculos Agarradores' };
}
export const concentracaoFirme = (c) => c.concentrating?.spellId === 'tentaculosNegrosDeEvard' && !!c.features?.includes('graspingTentacles');

// ============================================================ O Gênio

export const TIPO_DO_GENIO = { dao: 'concussão', djinni: 'trovejante', efreeti: 'fogo', marid: 'frio' };
const tipoDoGenio = (c) => TIPO_DO_GENIO[c.tipoDeGenio ?? 'efreeti'];
/** IRA DO GÊNIO (1º): uma vez por turno, no acerto de jogada de ataque, + a proficiência do tipo do gênio. */
export function iraDoGenio(enc, atacante, alvo, extra) {
  if (!atacante.features?.includes('geniesWrath') || alvo.dead) return;
  const vez = enc.turnoKey();
  if (atacante.iraDoGenioEm === vez) return;
  atacante.iraDoGenioEm = vez;
  extra('Ira do Gênio', `+${proficiencyBonus(atacante.level ?? 1)}`, tipoDoGenio(atacante));
}
/** DÁDIVA ELEMENTAL (6º): resistência ao tipo do gênio; ação bônus, dez minutos de voo de 9 m. */
export function vooDoGenio(enc, actor) {
  if (!actor.features?.includes('elementalGift') || actor.bonusUsed || !(actor.resources?.elementalGift > 0) || hasCondition(actor, 'vooDoGenio')) return false;
  actor.bonusUsed = true;
  actor.resources.elementalGift -= 1;
  addCondition(actor, 'vooDoGenio', { rounds: 100, source: actor.id, data: { voo: 30 } });
  enc.say('recurso', `${actor.name} sobe no ar do gênio (Dádiva Elemental).`);
  return true;
}

// ============================================================ Lâmina Cantante

const intDoMago = (c) => Math.max(1, abilityMod(c.abilities?.int ?? 10));
const podeCantar = (c) => !c.shield && !['média', 'pesada'].includes(ARMORS[c.armor ?? 'nenhuma']?.categoria);
/** CANÇÃO DA LÂMINA (2º): ação bônus, 1 minuto; INT na CA e na concentração, +3 m, vantagem em Acrobacia. Sem armadura média ou pesada, sem escudo. */
export function cancaoDaLamina(enc, actor) {
  if (!actor.features?.includes('bladesong') || actor.bonusUsed || !(actor.resources?.bladesong > 0) || hasCondition(actor, 'cancaoDaLamina') || !podeCantar(actor)) return false;
  actor.bonusUsed = true;
  actor.resources.bladesong -= 1;
  addCondition(actor, 'cancaoDaLamina', { rounds: 10, source: actor.id, data: { acBonus: intDoMago(actor) } });
  enc.say('recurso', `${actor.name} começa a canção da lâmina: +${intDoMago(actor)} de CA.`);
  return true;
}
export const cantando = (c) => hasCondition(c, 'cancaoDaLamina');
function pararDeCantar(enc, c, motivo) {
  if (!cantando(c)) return;
  removeCondition(c, 'cancaoDaLamina');
  enc.say('recurso', `A canção da lâmina de ${c.name} para: ${motivo}.`);
}
/** A canção para no golpe de duas mãos. */
export function golpeQueParaACancao(enc, atacante, arma) {
  if (cantando(atacante) && (arma?.props ?? []).includes('duas mãos')) pararDeCantar(enc, atacante, 'o golpe foi de duas mãos');
}
/** O ATAQUE EXTRA (6º): o truque de uma ação deixa um golpe de arma para o menu do inimigo. */
export function marcarGolpeDoTruque(enc, actor, spell) {
  if (actor.features?.includes('truqueNoAtaque') && spell?.level === 0 && spell.castTime === 'action') actor.golpeDoTruqueEm = enc.turnoKey();
}
export function golpeDoTruque(enc, actor, alvo) {
  if (!alvo || alvo.dead || actor.golpeDoTruqueEm !== enc.turnoKey()) return false;
  const arma = actor.equippedWeapon;
  if (!enc.canAttack(actor, alvo, arma).ok) return false;
  actor.golpeDoTruqueEm = null;
  enc.say('recurso', `${actor.name} emenda o truque com um golpe (Ataque Extra).`);
  enc.resolveAttack(actor, alvo, { weaponId: arma });
  return true;
}
/** CANÇÃO DA DEFESA (10º): reação, cantando; um espaço tira 5 x o círculo do dano. */
export function cancaoDaDefesa(enc, alvo, amount) {
  if (amount <= 0 || !cantando(alvo) || !alvo.features?.includes('songOfDefense') || alvo.reactionUsed || !desperto(alvo)) return amount;
  if (amount < 15 && amount < alvo.hp + (alvo.tempHp ?? 0)) return amount;
  const slots = alvo.spellcasting?.slots ?? [];
  const tem = slots.map((n, i) => (i >= 1 && n > 0 ? i : null)).filter(Boolean);
  if (!tem.length) return amount;
  const circulo = tem.find((i) => 5 * i >= amount) ?? tem[tem.length - 1];
  slots[circulo] -= 1;
  alvo.reactionUsed = true;
  enc.say('recurso', `${alvo.name} canta contra o golpe e gasta um espaço de ${circulo}º círculo: −${5 * circulo} de dano (Canção da Defesa).`);
  return Math.max(0, amount - 5 * circulo);
}
/** CANÇÃO DA VITÓRIA (14º): cantando, o golpe de arma corpo a corpo soma a INT. */
export function cancaoDaVitoria(atacante, extra, tipo, ranged) {
  if (!ranged && cantando(atacante) && atacante.features?.includes('songOfVictory')) extra('Canção da Vitória', `+${intDoMago(atacante)}`, tipo, false);
}

// ============================================================ Ordem dos Escribas

/** GRIMÓRIO DESPERTO (2º): o tipo de dano da magia de mago vira o de outra magia do grimório do mesmo círculo. */
export function tiposDoGrimorio(c, SPELLS) {
  return [...new Set((c.spellcasting?.livro ?? []).map((id) => SPELLS[id]?.damageType).filter(Boolean))];
}
export function grimorioDesperto(c, spell, circulo, SPELLS) {
  const tipo = c.tipoDoGrimorio;
  if (!tipo || !c.features?.includes('awakenedSpellbook') || !spell?.damageType || spell.damageType === tipo || spell.level < 1) return null;
  const doLivro = (c.spellcasting?.livro ?? []).some((id) => SPELLS[id]?.level === circulo && SPELLS[id]?.damageType === tipo);
  return doLivro ? { ...spell, damageType: tipo } : null;
}
/** ESCRIVÃO MESTRE (10º): o pergaminho do descanso; a primeira magia de 1º ou 2º círculo de 1 ação do grimório, sem espaço, um círculo acima. */
export function pergaminhoDoEscrivao(c, spell, pedido) {
  if (!c.features?.includes('masterScrivener') || !((c.resources?.masterScrivener ?? 0) > 0) || ![1, 2].includes(spell?.level) || spell.castTime !== 'action') return null;
  if (!(c.spellcasting?.livro ?? []).includes(spell.id)) return null;
  if (pedido != null && pedido !== spell.level + 1) return null;
  return { tipo: 'pergaminho', circulo: spell.level + 1, recurso: 'masterScrivener', rotulo: 'o pergaminho do Escrivão Mestre' };
}

// ============================================================ hooks do Tasha (4º lote)

/** A magia que a subclasse muda nesta conjuração: o tentáculo com o dado do nível, e o tipo do Grimório Desperto. */
export function magiaDoTce4(actor, spell, opcoes, SPELLS) {
  if (spell?.id === 'tentaculoDasProfundezas' && actor.dadoDoTentaculo) return { ...spell, damage: actor.dadoDoTentaculo };
  return grimorioDesperto(actor, spell, Number(opcoes?.circulo ?? spell?.level ?? 0), SPELLS);
}
/** Depois da conjuração: os PV temporários dos Tentáculos Agarradores e o golpe que o truque deixa à Lâmina Cantante. */
export function depoisDeConjurarTce4(enc, actor, spell) {
  if (spell?.id === 'tentaculosNegrosDeEvard' && actor.features?.includes('graspingTentacles')) {
    actor.tempHp = Math.max(actor.tempHp ?? 0, actor.level ?? 10);
    enc.say('recurso', `${actor.name} ganha ${actor.level} PV temporários dos tentáculos (Tentáculos Agarradores).`);
  }
  marcarGolpeDoTruque(enc, actor, spell);
}
/** As reações que tiram dano: o Bastião, a Espiral, a Canção da Defesa. */
export function danoTce4(enc, alvo, fonte, amount) {
  let a = gastarBastiao(enc, alvo, amount);
  if (a > 0) a = espiralGuardia(enc, alvo, fonte, a);
  if (a > 0) a = cancaoDaDefesa(enc, alvo, a);
  return a;
}
export function resisteTce4(t, tipo) {
  const f = t.features ?? [];
  return (tipo === 'psíquico' && f.includes('psychicDefenses')) || (tipo === 'frio' && f.includes('oceanicSoul'))
    || (f.includes('elementalGift') && tipo === tipoDoGenio(t));
}
export const vantagemNaResistenciaTce4 = (actor, contra) => !!actor.features?.includes('psychicDefenses') && ['enfeiticado', 'amedrontado'].includes(contra?.condicao);
/** A canção soma a INT na resistência de CON da concentração. */
export const bonusDaCancaoNaConcentracao = (actor, hab, contra) => (hab === 'con' && contra?.concentracao && cantando(actor) ? intDoMago(actor) : 0);
/** Começo do lado: a canção para em quem ficou incapacitado ou vestiu o que não pode. */
export function comecoDoLadoTce4(enc, side) {
  for (const c of enc.allOf(side)) {
    if (!cantando(c)) continue;
    if (conditionEffects(c).incapacitated) pararDeCantar(enc, c, 'ficou incapacitado');
    else if (!podeCantar(c)) pararDeCantar(enc, c, 'armadura ou escudo');
  }
}
export const deslocamentoDaCancao = (c) => (cantando(c) ? 10 : 0);

// ============================================================ Costa da Espada, Livro do Mestre, Fizban e Bigby

/** O ND em número de quem está na luta (o bloco guarda '1/4'; a instância, nada). */
const ndDe = (m) => crEmNumero(m.cr ?? MONSTERS[m.defId]?.cr ?? 99);

const comFuria = (c) => hasCondition(c, 'furia');
const deEspinhos = (c) => c.armor === 'armaduraDeEspinhos';
const temReacao = (c) => !c.reactionUsed && desperto(c);
const cdDeKi = (c) => 8 + proficiencyBonus(c.level ?? 1) + abilityMod(c.abilities?.wis ?? 10);
const carMin1 = (c) => Math.max(1, abilityMod(c.abilities?.cha ?? 10));
/** Pôr uma desvantagem nos modificadores de um golpe, de fora de `combat.js`. */
function desvantagemNoGolpe(mods, motivo) {
  mods.disadvantage = true;
  mods.desvantagens.push(motivo);
  mods.reasons.push(motivo);
  mods.anulado = mods.advantage && mods.disadvantage;
  mods.mode = mods.anulado ? 'anulado' : mods.advantage ? 'vantagem' : 'desvantagem';
}

// ---- Caminho do Furioso de Batalha (Costa da Espada)

/** ARMADURA DO FURIOSO (3º): em Fúria e de armadura de espinhos, a ação bônus golpeia com os espinhos (1d4 perfurante). */
export function golpeDosEspinhos(enc, actor, alvo) {
  if (!actor.features?.includes('battleragerArmor') || !comFuria(actor) || !deEspinhos(actor) || actor.bonusUsed || !alvo || alvo.dead) return false;
  if (!enc.canAttack(actor, alvo, 'espinhosDaArmadura').ok) return false;
  actor.bonusUsed = true;
  enc.resolveAttackBase(actor, alvo, { weaponId: 'espinhosDaArmadura' });
  return true;
}
/** ...e o agarrão que dá certo crava 3 de perfurante. */
export function espinhosNoAgarrao(enc, actor, alvo) {
  if (!actor.features?.includes('battleragerArmor') || !deEspinhos(actor) || alvo.dead) return;
  enc.say('recurso', `Os espinhos da armadura de ${actor.name} entram em ${alvo.name}: 3 de perfurante.`);
  enc.outraFonte(() => enc.applyDamage(alvo, 3, 'perfurante', actor, {}));
}
/** ABANDONO DESCUIDADO (6º): o Ataque Descuidado em Fúria dá PV temporários da CON (mínimo 1), que somem com a Fúria. */
export function abandonoDescuidado(enc, actor) {
  if (!actor.features?.includes('recklessAbandon') || !comFuria(actor)) return;
  const pv = Math.max(1, abilityMod(actor.abilities?.con ?? 10));
  if (pv <= (actor.tempHp ?? 0)) return;
  actor.tempHp = pv;
  actor.pvDoAbandono = pv;
  enc.say('recurso', `${actor.name} se joga na luta: ${pv} PV temporários (Abandono Descuidado).`);
}
/** INVESTIDA DO FURIOSO (10º): em Fúria, a Disparada como ação bônus. */
export function investidaDoFurioso(enc, actor) {
  if (!actor.features?.includes('battleragerCharge') || !comFuria(actor) || actor.bonusUsed) return false;
  actor.bonusUsed = true;
  actor.movementLeftFt = (actor.movementLeftFt ?? 0) + enc.speedOf(actor);
  actor.disparouEm = enc.turnoKey();
  enc.say('recurso', `${actor.name} dispara em Fúria (Investida do Furioso).`);
  return true;
}
/** RETRIBUIÇÃO ESPINHOSA (14º): quem o acerta de perto, a 1,5 m, leva 3 de perfurante. */
function retribuicaoEspinhosa(enc, alvo, atacante, corpoACorpo) {
  if (!corpoACorpo || !alvo.features?.includes('spikedRetribution') || !comFuria(alvo) || !deEspinhos(alvo) || !desperto(alvo) || atacante.dead) return;
  if (!atacante.pos || !alvo.pos || distanceFt(atacante.pos, alvo.pos) > 5) return;
  enc.say('recurso', `${atacante.name} se fere nos espinhos de ${alvo.name}: 3 de perfurante (Retribuição Espinhosa).`);
  enc.outraFonte(() => enc.applyDamage(atacante, 3, 'perfurante', alvo, {}));
}

// ---- Domínio do Arcano (Costa da Espada)

const LIMITE_DA_ABJURACAO = [[17, 4], [14, 3], [11, 2], [8, 1], [5, 0.5]];
/** ABJURAÇÃO ARCANA (2º): ação e Canalizar Divindade; um celestial, elemental, feérico ou corruptor a 9 m testa SAB ou é expulso; do 5º, o fraco é banido por um minuto. */
export function abjuracaoArcana(enc, actor, alvo = null) {
  if (!actor.features?.includes('arcaneAbjuration') || actor.actionUsed || !(actor.resources?.channelDivinity > 0)) return false;
  const tipos = ['celestial', 'elemental', 'feérico', 'fada', 'corruptor'];
  const t = alvo && tipos.includes(alvo.tipo) ? alvo : enc.enemiesOf(actor).filter((e) => !e.dead && e.pos && tipos.includes(e.tipo) && distanceFt(actor.pos, e.pos) <= 30)
    .sort((a, b) => distanceFt(actor.pos, a.pos) - distanceFt(actor.pos, b.pos))[0];
  if (!t || distanceFt(actor.pos, t.pos) > 30) return false;
  actor.actionUsed = true;
  actor.resources.channelDivinity -= 1;
  const dc = spellSaveDc(actor);
  const sv = enc.resistencia(t, 'wis', dc, { contra: { magico: true, condicao: 'amedrontado', conjurador: actor } });
  enc.explicarResistencia(t, 'wis', dc, sv, { contra: `Abjuração Arcana de ${actor.name}`, seSucesso: 'fica' });
  if (sv.success) return true;
  const limite = LIMITE_DA_ABJURACAO.find(([n]) => (actor.level ?? 1) >= n)?.[1];
  if (limite != null && ndDe(t) <= limite) {
    enc.aplicarCondicao(t, 'banido', { rounds: 10, source: actor.id });
    enc.say('condicao', `${t.name} é banido para o plano dele por um minuto (Abjuração Arcana).`);
  } else if (enc.aplicarCondicao(t, 'amedrontado', { rounds: 10, source: actor.id, data: { expulso: true } })) {
    t.fugindoDe = actor.id;
    enc.say('condicao', `${t.name} é expulso: recua de ${actor.name}.`);
  }
  return true;
}
/** QUEBRA-FEITIÇOS (6º): a cura de 1º círculo ou mais num aliado acaba uma magia de inimigo nele, de círculo até o do espaço. */
export function quebraFeiticos(enc, actor, spell, slot, curados) {
  if (!actor.features?.includes('spellBreaker') || (spell?.level ?? 0) < 1) return;
  for (const a of curados) {
    if (a === actor || a.side !== actor.side) continue;
    const k = (a.conditions ?? []).filter((x) => x.magia && (x.magia.circulo ?? 0) <= slot && enc.combatants.some((d) => d.id === x.source && d.side !== actor.side))
      .sort((x, y) => (y.magia.circulo ?? 0) - (x.magia.circulo ?? 0))[0];
    if (!k) continue;
    removeCondition(a, k.id);
    enc.say('recurso', `A cura de ${actor.name} também desfaz ${k.magia.id ?? k.id} em ${a.name} (Quebra-Feitiços).`);
  }
}

// ---- Cavaleiro do Dragão Púrpura (Costa da Espada)

/** GRITO DE REUNIÃO (3º): o Retomar o Fôlego cura até três aliados a 18 m, o nível de guerreiro. */
export function gritoDeReuniao(enc, actor) {
  if (!actor.features?.includes('rallyingCry')) return;
  const quem = enc.combatants.filter((c) => c !== actor && c.side === actor.side && !c.dead && c.hp < c.maxHp && c.pos && distanceFt(actor.pos, c.pos) <= 60)
    .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp).slice(0, 3);
  for (const c of quem) {
    const pv = enc.heal(c, actor.level ?? 3, actor);
    enc.say('cura', `O grito de ${actor.name} levanta ${c.name}: +${pv} PV (Grito de Reunião).`);
  }
}
/** SURTO INSPIRADOR (10º): a Ação Surpreendente faz um aliado a 18 m (dois no 18º) atacar com a reação. */
export function surtoInspirador(enc, actor) {
  if (!actor.features?.includes('inspiringSurge')) return;
  let n = actor.aliadosDoSurto ?? 1;
  for (const a of enc.combatants.filter((c) => c !== actor && c.side === actor.side && !c.dead && temReacao(c) && c.pos && distanceFt(actor.pos, c.pos) <= 60)) {
    if (n <= 0) break;
    const arma = enc.armaDeOportunidade(a);
    const alvo = arma === undefined ? null : enc.enemiesOf(a).filter((e) => !e.dead && enc.canAttack(a, e, arma).ok)
      .sort((x, y) => distanceFt(x.pos, a.pos) - distanceFt(y.pos, a.pos))[0];
    if (!alvo) continue;
    n -= 1;
    a.reactionUsed = true;
    enc.say('recurso', `${actor.name} chama ${a.name} ao ataque (Surto Inspirador).`);
    enc.resolveAttackBase(a, alvo, { opportunity: true, weaponId: arma, reacao: true });
  }
}
/** BALUARTE (15º): o Indomável numa resistência de INT, SAB ou CAR deixa o aliado a 18 m que falha contra o mesmo efeito rolar de novo. */
export function marcarBaluarte(enc, actor, hab, forcador) {
  if (!actor.features?.includes('bulwarkPdk') || !['int', 'wis', 'cha'].includes(hab) || conditionEffects(actor).incapacitated) return;
  enc.baluarteDoCavaleiro = { id: actor.id, forcador: forcador?.id ?? null, turno: enc.turnoKey(), usado: false };
}
function baluarteNaResistencia(enc, actor, hab, rolado, forcador, rerolar) {
  const b = enc.baluarteDoCavaleiro;
  if (rolado.success || !b || b.usado || b.turno !== enc.turnoKey() || b.forcador !== (forcador?.id ?? null) || !['int', 'wis', 'cha'].includes(hab)) return rolado;
  const k = enc.combatants.find((c) => c.id === b.id);
  if (!k || k === actor || k.side !== actor.side || !k.pos || !actor.pos || distanceFt(k.pos, actor.pos) > 60) return rolado;
  b.usado = true;
  const novo = rerolar();
  enc.say('recurso', `${k.name} estende a firmeza a ${actor.name}: rola de novo (Baluarte), ${novo.total}${novo.success ? ', e passa' : ''}.`);
  return novo;
}

// ---- Caminho da Longa Morte (Costa da Espada)

/** TOQUE DA MORTE (3º): quem o monge derruba a 1,5 m dá PV temporários (SAB + nível, mínimo 1). */
export function toqueDaMorte(enc, matador, vitima) {
  if (!matador?.features?.includes('touchOfDeath') || !matador.pos || !vitima.pos || distanceFt(matador.pos, vitima.pos) > 5) return;
  const pv = Math.max(1, abilityMod(matador.abilities?.wis ?? 10) + (matador.level ?? 3));
  if (pv <= (matador.tempHp ?? 0)) return;
  matador.tempHp = pv;
  enc.say('recurso', `${matador.name} bebe o fim de ${vitima.name}: ${pv} PV temporários (Toque da Morte).`);
}
/** HORA DA COLHEITA (6º): ação; quem o vê a 9 m testa SAB ou fica amedrontado até o fim do próximo turno dele. */
export function horaDaColheita(enc, actor) {
  if (!actor.features?.includes('hourOfReaping') || actor.actionUsed) return false;
  actor.actionUsed = true;
  const dc = cdDeKi(actor);
  enc.say('recurso', `A sombra da morte passa por ${actor.name} (Hora da Colheita, CD ${dc}).`);
  for (const t of enc.combatants.filter((c) => c !== actor && !c.dead && c.pos && distanceFt(actor.pos, c.pos) <= 30 && ve(enc, c, actor))) {
    const sv = enc.resistencia(t, 'wis', dc, { contra: { condicao: 'amedrontado' } });
    enc.explicarResistencia(t, 'wis', dc, sv, { contra: `Hora da Colheita de ${actor.name}`, seSucesso: 'não se assusta' });
    if (!sv.success && enc.aplicarCondicao(t, 'amedrontado', { rounds: 2, quando: 'fim', lado: actor.side, source: actor.id })) enc.say('condicao', `${t.name} fica amedrontado por ${actor.name}.`);
  }
  return true;
}
/** MAESTRIA DA MORTE (11º): cair a 0 PV gasta 1 ki e deixa o monge com 1 PV. */
export function maestriaDaMorte(enc, actor) {
  if (!actor.features?.includes('masteryOfDeath') || !(actor.resources?.ki > 0)) return false;
  actor.resources.ki -= 1;
  actor.hp = 1;
  enc.say('recurso', `${actor.name} gasta 1 ki e recusa a morte: fica com 1 PV (Maestria da Morte).`);
  return true;
}
/** TOQUE DA LONGA MORTE (17º): ação, toque; 1 a 10 ki, CON ou 2d10 necrótico por ki (metade no sucesso). */
export function toqueDaLongaMorte(enc, actor, alvo, ki) {
  const n = Math.min(10, Number(ki) || 0, actor.resources?.ki ?? 0);
  if (!actor.features?.includes('touchOfTheLongDeath') || actor.actionUsed || n < 1 || !alvo || alvo.dead || alvo.side === actor.side || distanceFt(actor.pos, alvo.pos) > 5) return false;
  actor.actionUsed = true;
  actor.resources.ki -= n;
  const dc = cdDeKi(actor);
  const r = damageRoll(enc.rng, `${2 * n}d10`);
  const sv = enc.resistencia(alvo, 'con', dc, {});
  const rr = enc.explicarResistencia(alvo, 'con', dc, sv, { contra: `Toque da Longa Morte de ${actor.name}`, seSucesso: 'metade do dano' });
  const total = sv.success ? Math.floor(r.total / 2) : r.total;
  enc.say('recurso', `${actor.name} toca ${alvo.name} com ${n} ki de morte: ${total} de necrótico (Toque da Longa Morte).`, rr.conta);
  enc.applyDamage(alvo, total, 'necrótico', actor, { magico: true });
  return true;
}

// ---- Juramento da Coroa (Costa da Espada)

/** DESAFIO DO CAMPEÃO (3º): ação bônus e Canalizar Divindade; quem falha na SAB não se afasta mais de 9 m do paladino. */
export function desafioDoCampeao(enc, actor) {
  if (!actor.features?.includes('championChallenge') || actor.bonusUsed || !(actor.resources?.channelDivinity > 0)) return false;
  actor.bonusUsed = true;
  actor.resources.channelDivinity -= 1;
  const dc = spellSaveDc(actor);
  enc.say('recurso', `${actor.name} lança o desafio do campeão (CD ${dc}).`);
  for (const t of enc.enemiesOf(actor).filter((e) => !e.dead && e.pos && distanceFt(actor.pos, e.pos) <= 30 && ve(enc, actor, e))) {
    const sv = enc.resistencia(t, 'wis', dc, { contra: { magico: true, conjurador: actor } });
    enc.explicarResistencia(t, 'wis', dc, sv, { contra: `Desafio do Campeão de ${actor.name}`, seSucesso: 'ignora o desafio' });
    if (!sv.success) { addCondition(t, 'desafiadoPelaCoroa', { source: actor.id }); enc.say('condicao', `${t.name} aceita o desafio: não se afasta de ${actor.name}.`); }
  }
  return true;
}
/** Quem prende o desafiado (o paladino vivo, desperto, a até 9 m); fora disso o desafio acaba. */
export function campeaoDe(enc, c) {
  const k = getCondition(c, 'desafiadoPelaCoroa');
  if (!k) return null;
  const p = enc.combatants.find((x) => x.id === k.source);
  if (!p || p.dead || conditionEffects(p).incapacitated || !p.pos || !c.pos || distanceFt(p.pos, c.pos) > 30) { removeCondition(c, 'desafiadoPelaCoroa'); return null; }
  return p;
}
/** VIRAR A MARÉ (3º): ação bônus e Canalizar Divindade; quem está com metade dos PV ou menos, a 9 m, recupera 1d6 + CAR. */
export function virarAMare(enc, actor) {
  if (!actor.features?.includes('turnTheTide') || actor.bonusUsed || !(actor.resources?.channelDivinity > 0)) return false;
  actor.bonusUsed = true;
  actor.resources.channelDivinity -= 1;
  const curados = [];
  for (const c of enc.combatants.filter((x) => x.side === actor.side && !x.dead && x.pos && distanceFt(actor.pos, x.pos) <= 30 && x.hp <= x.maxHp / 2)) {
    const pv = enc.heal(c, damageRoll(enc.rng, '1d6').total + carMin1(actor), actor);
    curados.push(`${c.name} +${pv}`);
  }
  enc.say('recurso', `${actor.name} vira a maré: ${curados.join(', ') || 'ninguém tão ferido'} (Virar a Maré).`);
  return true;
}
/** LEALDADE DIVINA (7º): reação; o dano que derrubaria o aliado colado vai para o paladino, se ele aguenta. */
export function lealdadeDivina(enc, alvo, amount) {
  if (amount <= 0 || amount < alvo.hp + (alvo.tempHp ?? 0) || !alvo.pos) return null;
  const p = enc.combatants.find((c) => c !== alvo && c.side === alvo.side && c.features?.includes('divineAllegiance') && temReacao(c) && c.pos
    && distanceFt(c.pos, alvo.pos) <= 5 && c.hp + (c.tempHp ?? 0) > amount);
  if (!p) return null;
  p.reactionUsed = true;
  enc.say('recurso', `${p.name} toma o golpe no lugar de ${alvo.name} (Lealdade Divina).`);
  return p;
}
/** CAMPEÃO EXALTADO (20º): ação, uma hora; resistência ao golpe não mágico, e vantagem em SAB e na morte para os aliados a 9 m. */
export function campeaoExaltado(enc, actor) {
  if (!actor.features?.includes('exaltedChampion') || actor.actionUsed || !(actor.resources?.exaltedChampion > 0)) return false;
  actor.actionUsed = true;
  actor.resources.exaltedChampion -= 1;
  addCondition(actor, 'campeaoExaltado', { rounds: 600, source: actor.id });
  enc.say('recurso', `${actor.name} ergue-se como o campeão exaltado.`);
  return true;
}
const naAuraExaltada = (enc, c) => enc.combatants.some((p) => p.side === c.side && hasCondition(p, 'campeaoExaltado') && desperto(p) && p.pos && c.pos && distanceFt(p.pos, c.pos) <= 30);
export const vantagemNaMorteDoCampeao = (enc, c) => naAuraExaltada(enc, c);

// ---- O Imortal (Costa da Espada)

/** ENTRE OS MORTOS (1º): o morto-vivo que mira o bruxo testa SAB ou troca de alvo (ou perde o golpe). Devolve o alvo novo, o mesmo, ou null. */
export function entreOsMortos(enc, atacante, alvo) {
  if (atacante.tipo !== 'morto-vivo' || !alvo.features?.includes('amongTheDead') || alvo.dead) return alvo;
  if ((alvo.imunesEntreOsMortos ?? []).includes(atacante.id)) return alvo;
  const dc = spellSaveDc(alvo);
  const sv = enc.resistencia(atacante, 'wis', dc, { contra: { conjurador: alvo } });
  enc.explicarResistencia(atacante, 'wis', dc, sv, { contra: `Entre os Mortos (${alvo.name})`, seSucesso: 'ataca assim mesmo' });
  if (sv.success) { (alvo.imunesEntreOsMortos ??= []).push(atacante.id); return alvo; }
  const outro = enc.enemiesOf(atacante).filter((e) => e !== alvo && !e.dead && enc.canAttack(atacante, e).ok)[0];
  enc.say('condicao', `${atacante.name} não consegue ferir ${alvo.name}${outro ? `, e se volta para ${outro.name}` : ', e perde o golpe'} (Entre os Mortos).`);
  return outro ?? null;
}
/** ...e quem o bruxo fere fica imune ao efeito. */
function feriuOMortoVivo(alvo, fonte) {
  if (!fonte?.features?.includes('amongTheDead') || alvo.tipo !== 'morto-vivo') return;
  fonte.imunesEntreOsMortos ??= [];
  if (!fonte.imunesEntreOsMortos.includes(alvo.id)) fonte.imunesEntreOsMortos.push(alvo.id);
}
/** DESAFIAR A MORTE (6º): o sucesso no teste contra a morte (ou estabilizar alguém com Poupar os Moribundos) cura 1d8 + CON. */
export function desafiarAMorte(enc, actor) {
  if (!actor.features?.includes('defyDeath') || !(actor.resources?.defyDeath > 0)) return;
  actor.resources.defyDeath -= 1;
  const pv = enc.heal(actor, Math.max(1, damageRoll(enc.rng, '1d8').total + abilityMod(actor.abilities?.con ?? 10)), actor);
  enc.say('cura', `${actor.name} desafia a morte: +${pv} PV (Desafiar a Morte).`);
}
/** VIDA INDESTRUTÍVEL (14º): ação bônus; 1d8 + nível de PV. Uma vez por descanso curto. */
export function vidaIndestrutivel(enc, actor) {
  if (!actor.features?.includes('indestructibleLife') || actor.bonusUsed || !(actor.resources?.indestructibleLife > 0)) return false;
  actor.bonusUsed = true;
  actor.resources.indestructibleLife -= 1;
  const pv = enc.heal(actor, damageRoll(enc.rng, `1d8+${actor.level ?? 14}`).total, actor);
  enc.say('cura', `${actor.name} se refaz: +${pv} PV (Vida Indestrutível).`);
  return true;
}

// ---- Domínio da Morte (Livro do Mestre)

/** CEIFADOR (1º) e CEIFADOR APRIMORADO (17º): a magia de necromancia de um alvo pega um segundo, a 1,5 m do primeiro, de graça. */
export function segundoAlvoDoCeifador(enc, actor, spell, opcoes) {
  const f = actor.features ?? [];
  if (spell?.school !== 'necromancia' || !opcoes?.target || spell.concentration || spell.area || spell.shape || (spell.targets ?? 1) !== 1) return null;
  if (!(spell.level === 0 ? f.includes('reaper') : spell.level <= 5 && f.includes('improvedReaper'))) return null;
  const primeiro = opcoes.target;
  if (!primeiro.pos || primeiro.side === actor.side) return null;
  return enc.enemiesOf(actor).filter((e) => e !== primeiro && !e.dead && e.pos && distanceFt(e.pos, primeiro.pos) <= 5
    && (!spell.rangeFt || distanceFt(actor.pos, e.pos) <= spell.rangeFt))
    .sort((a, b) => distanceFt(a.pos, primeiro.pos) - distanceFt(b.pos, primeiro.pos))[0] ?? null;
}
/** TOQUE DA MORTE do clérigo (2º): interruptor; o próximo acerto corpo a corpo gasta o Canalizar Divindade e soma 5 + 2 x nível de necrótico. */
function toqueDaMorteDoClerigo(enc, atacante, alvo, extra, ranged) {
  if (ranged || !atacante.toqueDaMorteLigado || !atacante.features?.includes('touchOfDeathCleric') || !(atacante.resources?.channelDivinity > 0) || alvo.dead) return;
  atacante.resources.channelDivinity -= 1;
  atacante.toqueDaMorteLigado = false;
  extra('Toque da Morte', `+${5 + 2 * (atacante.level ?? 2)}`, 'necrótico');
}
/** DESTRUIÇÃO INESCAPÁVEL (6º): o necrótico das magias e do Canalizar Divindade do clérigo passa por cima da resistência. */
export const destruicaoInescapavel = (fonte, tipo, magico) => tipo === 'necrótico' && magico && !!fonte?.features?.includes('inescapableDestruction');

// ---- Quebrador de Juramento (Livro do Mestre)

/** CONTROLAR MORTOS-VIVOS (3º): ação e Canalizar Divindade; o morto-vivo a 9 m (de ND menor que o nível) testa SAB ou passa a lutar com o paladino. */
export function controlarMortosVivos(enc, actor, alvo = null) {
  if (!actor.features?.includes('controlUndead') || actor.actionUsed || !(actor.resources?.channelDivinity > 0)) return false;
  const ok = (m) => m && !m.dead && m.tipo === 'morto-vivo' && m.side !== actor.side && m.pos && distanceFt(actor.pos, m.pos) <= 30 && ndDe(m) < (actor.level ?? 3);
  const t = ok(alvo) ? alvo : enc.enemiesOf(actor).filter(ok).sort((a, b) => ndDe(b) - ndDe(a))[0];
  if (!t) return false;
  actor.actionUsed = true;
  actor.resources.channelDivinity -= 1;
  const dc = spellSaveDc(actor);
  const sv = enc.resistencia(t, 'wis', dc, { contra: { magico: true, conjurador: actor } });
  enc.explicarResistencia(t, 'wis', dc, sv, { contra: `Controlar Mortos-Vivos de ${actor.name}`, seSucesso: 'resiste' });
  if (!sv.success) {
    t.side = actor.side;
    t.invocado = { donoId: actor.id, spellId: 'controlarMortosVivos', auto: Boolean(actor.invocadosAuto) };
    t.xp = 0;
    enc.say('condicao', `${t.name} se curva a ${actor.name}: passa a lutar do lado dele (Controlar Mortos-Vivos).`);
    enc.onEvent({ type: 'invocado', criatura: t, dono: actor });
  }
  return true;
}
/** ASPECTO TERRÍVEL (3º): ação e Canalizar Divindade; os inimigos a 9 m que o veem testam SAB ou ficam amedrontados por um minuto (só repetem longe dele). */
export function aspectoTerrivel(enc, actor) {
  if (!actor.features?.includes('dreadfulAspect') || actor.actionUsed || !(actor.resources?.channelDivinity > 0)) return false;
  actor.actionUsed = true;
  actor.resources.channelDivinity -= 1;
  const dc = spellSaveDc(actor);
  enc.say('recurso', `${actor.name} mostra o aspecto terrível (CD ${dc}).`);
  for (const t of enc.enemiesOf(actor).filter((e) => !e.dead && e.pos && distanceFt(actor.pos, e.pos) <= 30 && ve(enc, e, actor))) {
    const sv = enc.resistencia(t, 'wis', dc, { contra: { magico: true, condicao: 'amedrontado', conjurador: actor } });
    enc.explicarResistencia(t, 'wis', dc, sv, { contra: `Aspecto Terrível de ${actor.name}`, seSucesso: 'não se assusta' });
    if (!sv.success && enc.aplicarCondicao(t, 'amedrontado', { rounds: 10, source: actor.id, data: { save: 'wis', dc, repete: 'longe', longeFt: 30 } })) {
      enc.say('condicao', `${t.name} fica amedrontado por ${actor.name}.`);
    }
  }
  return true;
}
/** AURA DE ÓDIO (7º): o paladino, e os corruptores e mortos-vivos a 3 m dele (9 m no 18º), somam o CAR dele ao dano de arma corpo a corpo. */
function auraDeOdio(enc, atacante, extra, tipo, ranged) {
  if (ranged) return;
  const p = atacante.features?.includes('auraOfHate') ? atacante
    : ['corruptor', 'morto-vivo'].includes(atacante.tipo) ? enc.combatants.find((c) => c.features?.includes('auraOfHate') && desperto(c) && c.pos && atacante.pos
      && distanceFt(c.pos, atacante.pos) <= (c.raioDaAuraDeOdio ?? 10)) : null;
  if (p) extra('Aura de Ódio', `+${carMin1(p)}`, tipo, false);
}
/** SENHOR DO TERROR (20º): ação, um minuto; quem tem medo do paladino e começa o turno na aura leva 4d10 psíquico; quem ataca o grupo na aura sem enxergar a sombra tem desvantagem; a ação bônus golpeia com as sombras. */
export function senhorDoTerror(enc, actor) {
  if (!actor.features?.includes('dreadLord') || actor.actionUsed || !(actor.resources?.dreadLord > 0)) return false;
  actor.actionUsed = true;
  actor.resources.dreadLord -= 1;
  addCondition(actor, 'senhorDoTerror', { rounds: 10, source: actor.id });
  enc.say('recurso', `Uma aura de sombra envolve ${actor.name} (Senhor do Terror).`);
  return true;
}
const senhorPerto = (enc, c) => enc.combatants.find((p) => hasCondition(p, 'senhorDoTerror') && desperto(p) && p.pos && c.pos && distanceFt(p.pos, c.pos) <= 30);
export function sombrasDoSenhor(enc, actor, alvo) {
  if (!hasCondition(actor, 'senhorDoTerror') || actor.bonusUsed || !alvo || alvo.dead || alvo.side === actor.side || distanceFt(actor.pos, alvo.pos) > 30) return false;
  actor.bonusUsed = true;
  enc.ataqueMagico(actor, alvo, { id: 'sombrasDoSenhor', name: 'as sombras do Senhor do Terror', level: 0, melee: true, damageType: 'necrótico', school: 'necromancia' },
    '3d10', spellSaveDc(actor), { bonusDano: abilityMod(actor.abilities?.cha ?? 10) });
  return true;
}
function senhorNoComeco(enc, side) {
  for (const p of enc.combatants.filter((x) => x.side !== side && hasCondition(x, 'senhorDoTerror') && desperto(x))) {
    for (const c of enc.allOf(side)) {
      if (c.dead || !c.pos || distanceFt(p.pos, c.pos) > 30 || !(c.conditions ?? []).some((k) => k.id === 'amedrontado' && k.source === p.id)) continue;
      const r = damageRoll(enc.rng, '4d10');
      enc.say('dano', `O medo de ${p.name} rasga ${c.name}: ${r.total} de psíquico (Senhor do Terror).`, `4d10[${r.rolls.join('+')}]`);
      enc.applyDamage(c, r.total, 'psíquico', p, { magico: true });
    }
  }
}

// ---- Caminho do Dragão Ascendente (Fizban)

export const TIPOS_DO_DRAGAO = ['fogo', 'frio', 'elétrico', 'ácido', 'veneno'];
/** O sopro do monge: o tipo do interruptor, os dados de Artes Marciais, a CD de ki. A forma maior (17º) é cone de 18 m ou linha de 27 m. */
export function soproDoMonge(actor, spell) {
  const maior = spell.id.endsWith('Maior');
  const n = maior ? 4 : actor.dadosDoSoproDoMonge ?? 2;
  return { ...spell, damage: `${n}${actor.dadoDeArtesMarciais ?? 'd6'}`, damageType: actor.tipoDoDragao ?? 'fogo', cdFixa: cdDeKi(actor) };
}
/** O sopro tirou um golpe da ação de Atacar: com Ataque Extra, sobra o golpe para o menu do inimigo. */
export function depoisDoSoproDoMonge(enc, actor) {
  actor.acaoDeAtaque = { turno: enc.turnoKey(), armas: [...(actor.acaoDeAtaque?.turno === enc.turnoKey() ? actor.acaoDeAtaque.armas : []), 'sopro'] };
  if ((actor.ataquesExtras ?? 0) >= 1) actor.golpeDoTruqueEm = enc.turnoKey();
  // a FÚRIA EXPLOSIVA não é aqui: é do Aspecto da Serpe
}
/** O golpe desarmado do Discípulo Dracônico: o tipo do interruptor. */
export function tipoDoPunhoDragao(atacante, weaponId) {
  if (!atacante.features?.includes('draconicDisciple') || !atacante.tipoDoDragao || (weaponId ?? atacante.equippedWeapon) !== 'punhos') return null;
  return atacante.tipoDoDragao;
}
/** ASAS DESDOBRADAS (6º): no Passo do Vento, voo igual ao andar até o fim do turno. */
export function asasDesdobradas(enc, actor) {
  if (!actor.features?.includes('wingsUnfurled') || !(actor.resources?.wingsUnfurled > 0)) return;
  actor.resources.wingsUnfurled -= 1;
  addCondition(actor, 'asasDoDragao', { rounds: 1, quando: 'fim', lado: actor.side, source: actor.id, data: { voo: actor.speedFt ?? 30 } });
  enc.say('recurso', `Asas de dragão se abrem nas costas de ${actor.name} (Asas Desdobradas).`);
}
/** ASPECTO DA SERPE (11º): ação bônus, um minuto, aura de 3 m: medo (um alvo agora, e outro por ação bônus) ou resistência ao tipo do dragão. */
export function aspectoDaSerpe(enc, actor, modo = 'medo') {
  if (!actor.features?.includes('aspectOfTheWyrm') || actor.bonusUsed || hasCondition(actor, 'aspectoDaSerpe') || !['medo', 'resistencia'].includes(modo)) return false;
  if ((actor.resources?.aspectOfTheWyrm ?? 0) > 0) actor.resources.aspectOfTheWyrm -= 1;
  else if ((actor.resources?.ki ?? 0) >= 3) actor.resources.ki -= 3;
  else return false;
  actor.bonusUsed = true;
  addCondition(actor, 'aspectoDaSerpe', { rounds: 10, source: actor.id, data: { modo, tipo: actor.tipoDoDragao ?? 'fogo' } });
  enc.say('recurso', `A aura do dragão se ergue em volta de ${actor.name} (Aspecto da Serpe: ${modo === 'medo' ? 'medo' : `resistência a ${actor.tipoDoDragao ?? 'fogo'}`}).`);
  // FÚRIA EXPLOSIVA (Aspecto Ascendente, 17º): os inimigos da aura testam DES ou levam 3d10 do tipo
  if (actor.features.includes('ascendantAspect')) {
    const tipo = actor.tipoDoDragao ?? 'fogo';
    for (const t of enc.enemiesOf(actor).filter((e) => !e.dead && e.pos && distanceFt(actor.pos, e.pos) <= 10)) {
      const r = damageRoll(enc.rng, '3d10');
      const sv = enc.resistencia(t, 'dex', cdDeKi(actor), {});
      const total = sv.success ? 0 : r.total;
      enc.say('dano', `A fúria do dragão explode em ${t.name}: ${sv.success ? 'escapa' : `${total} de ${tipo}`} (Aspecto Ascendente).`);
      if (total) enc.applyDamage(t, total, tipo, actor, { magico: true });
    }
  }
  if (modo === 'medo') {
    const alvo = enc.enemiesOf(actor).filter((e) => !e.dead && e.pos && distanceFt(actor.pos, e.pos) <= 10).sort((a, b) => distanceFt(actor.pos, a.pos) - distanceFt(actor.pos, b.pos))[0];
    if (alvo) medoDaSerpe(enc, actor, alvo, { gratis: true });
  }
  return true;
}
export function medoDaSerpe(enc, actor, alvo, { gratis = false } = {}) {
  const a = getCondition(actor, 'aspectoDaSerpe');
  if (a?.data?.modo !== 'medo' || !alvo || alvo.dead || alvo.side === actor.side || distanceFt(actor.pos, alvo.pos) > 10) return false;
  if (!gratis) { if (actor.bonusUsed) return false; actor.bonusUsed = true; }
  const dc = cdDeKi(actor);
  const sv = enc.resistencia(alvo, 'wis', dc, { contra: { condicao: 'amedrontado' } });
  enc.explicarResistencia(alvo, 'wis', dc, sv, { contra: `o Aspecto da Serpe de ${actor.name}`, seSucesso: 'não se assusta' });
  if (!sv.success && enc.aplicarCondicao(alvo, 'amedrontado', { rounds: 10, source: actor.id, data: { save: 'wis', dc, repete: true } })) enc.say('condicao', `${alvo.name} fica amedrontado por ${actor.name}.`);
  return true;
}
function resistenciaDaSerpe(enc, t, tipo) {
  return enc.combatants.some((m) => m.side === t.side && getCondition(m, 'aspectoDaSerpe')?.data?.modo === 'resistencia' && getCondition(m, 'aspectoDaSerpe').data.tipo === tipo
    && desperto(m) && m.pos && t.pos && distanceFt(m.pos, t.pos) <= 10);
}

// ---- Guardião Dracônico (Fizban)

/** O draco do patrulheiro: o bloco do Fizban, ajustado à proficiência e ao nível (`dracoCompanheiro`). */
export function invocarDraco(enc, actor, { pago = true } = {}) {
  if (!actor.features?.includes('drakeCompanion')) return false;
  if (pago) {
    if (actor.actionUsed) return false;
    if ((actor.resources?.drakeCompanion ?? 0) > 0) actor.resources.drakeCompanion -= 1;
    else {
      const slots = actor.spellcasting?.slots ?? [];
      const i = slots.findIndex((n, k) => k >= 1 && n > 0);
      if (i < 1) return false;
      slots[i] -= 1;
    }
    actor.actionUsed = true;
  }
  enc.dispensarInvocados((c) => c.invocado?.donoId === actor.id && c.invocado.spellId === 'dracoCompanheiro', 'o draco volta a quem o chama');
  const m = enc.invocar(actor, 'dracoCompanheiro', actor.pos, { spellId: 'dracoCompanheiro' });
  if (!m) return false;
  const pb = proficiencyBonus(actor.level ?? 3);
  const tipo = actor.tipoDoDraco ?? 'fogo';
  m.ac = 14 + pb;
  m.maxHp = 5 + 5 * (actor.level ?? 3);
  m.hp = pago || actor.pvDoDraco == null ? m.maxHp : Math.max(1, Math.min(m.maxHp, actor.pvDoDraco));
  m.damageImmunities = [tipo];
  m.immune = [tipo];
  // DES +1 e SAB +2 mais a proficiência: as duas resistências treinadas, com a proficiência do patrulheiro
  m.saves = ['dex', 'wis'];
  m.proficiency = pb;
  const extra = actor.features.includes('perfectedBond') ? '2d6' : actor.features.includes('bondOfFangAndScale') ? '1d6' : null;
  m.attacks = [{ name: 'Mordida', damage: `1d6+${pb}`, type: 'perfurante', reachFt: 5, bonus: 3 + pb, art: 'bite', ...(extra ? { danoExtra: { damage: extra, type: tipo } } : {}) }];
  if (actor.features.includes('bondOfFangAndScale')) { m.flyFt = m.speedFt; m.hover = false; }
  m.essencia = tipo;
  m.companheiro = true;
  // a reação do draco (os Golpes Infundidos) vale já no turno em que ele chega
  m.reactionUsed = false;
  actor.dracoAtivo = true;
  enc.say('recurso', `${actor.name} chama o draco de ${tipo} (${m.maxHp} PV, CA ${m.ac}).`);
  return m;
}
/** O draco só esquiva, a não ser que o patrulheiro o comande pela ação bônus. */
export function comandarDraco(enc, actor) {
  const d = enc.invocadosDe(actor).find((x) => x.invocado.spellId === 'dracoCompanheiro');
  if (!d || actor.bonusUsed || conditionEffects(actor).incapacitated) return false;
  actor.bonusUsed = true;
  d.actionUsed = false;
  removeCondition(d, 'esquivando');
  enc.say('recurso', `${actor.name} dá a ordem ao draco.`);
  return true;
}
function dracoNoComeco(enc, side) {
  for (const d of enc.allOf(side)) {
    if (d.invocado?.spellId !== 'dracoCompanheiro' || d.dead) continue;
    const dono = enc.combatants.find((x) => x.id === d.invocado.donoId);
    if (dono && !conditionEffects(dono).incapacitated) {
      d.actionUsed = true;
      addCondition(d, 'esquivando', { rounds: 1, quando: 'inicio', lado: d.side });
    }
  }
}
/** GOLPES INFUNDIDOS (o traço do draco): reação; o golpe de arma de outro, a 9 m do draco, soma 1d6 da essência. */
function golpesInfundidos(enc, atacante, alvo, extra) {
  const d = enc.combatants.find((x) => x.invocado?.spellId === 'dracoCompanheiro' && x !== atacante && x.side === atacante.side && !x.dead && temReacao(x)
    && x.pos && atacante.pos && distanceFt(x.pos, atacante.pos) <= 30 && ve(enc, x, atacante));
  if (!d || alvo.dead) return;
  d.reactionUsed = true;
  extra(`Golpes Infundidos (${d.name})`, '1d6', d.essencia ?? 'fogo');
}
/** ELO DE PRESA E ESCAMA (7º): o patrulheiro resiste à essência do draco enquanto ele está invocado. */
const resisteComODraco = (enc, t, tipo) => !!t.features?.includes('bondOfFangAndScale')
  && enc.combatants.some((d) => d.invocado?.donoId === t.id && d.invocado.spellId === 'dracoCompanheiro' && !d.dead && d.essencia === tipo);
/** ELO APERFEIÇOADO (15º): reação; o dano de 8 ou mais em você ou no draco, a 9 m um do outro, vira resistido. */
function eloAperfeicoado(enc, alvo, amount) {
  if (amount < 8) return amount;
  const dono = alvo.features?.includes('perfectedBond') ? alvo
    : alvo.invocado?.spellId === 'dracoCompanheiro' ? enc.combatants.find((x) => x.id === alvo.invocado.donoId) : null;
  if (!dono || !dono.features?.includes('perfectedBond') || !(dono.resources?.perfectedBond > 0) || !temReacao(dono)) return amount;
  const d = enc.invocadosDe(dono).find((x) => x.invocado.spellId === 'dracoCompanheiro');
  if (!d || !d.pos || !dono.pos || distanceFt(d.pos, dono.pos) > 30) return amount;
  dono.reactionUsed = true;
  dono.resources.perfectedBond -= 1;
  enc.say('recurso', `${dono.name} firma o elo com o draco: ${alvo.name} resiste ao golpe (Elo Aperfeiçoado).`);
  return Math.floor(amount / 2);
}
/** O sopro do draco: o tipo do interruptor do draco, 8d6 (10d6 no 15º). */
export const soproDoDraco = (actor, spell) => ({ ...spell, damage: actor.dadosDoSoproDoDraco ?? '8d6', damageType: actor.tipoDoDraco ?? 'fogo' });

// ---- Caminho do Gigante (Bigby)

/** DEVASTAÇÃO DO GIGANTE (3º): em Fúria, +1,5 m de alcance (+3 m no 14º). */
export const alcanceDoGiganteAMais = (c) => (comFuria(c) && c.features?.includes('giantsHavoc') ? c.alcanceDoGigante ?? 5 : 0);
/** CUTELO ELEMENTAL (6º): ao entrar em Fúria, a arma da mão vira do tipo escolhido, soma 1d6 (2d6 no 14º) e se arremessa (6/18 m), voltando à mão. */
export function cuteloAoEntrarEmFuria(enc, actor) {
  if (!actor.features?.includes('elementalCleaver')) return;
  const arma = WEAPONS[actor.equippedWeapon];
  if (!arma || arma.ranged || arma.id === 'punhos') return;
  actor.cutelo = { arma: arma.id, tipo: actor.tipoDoCutelo ?? 'fogo' };
  if (!actor.weapons.includes('arremessoDoCutelo')) actor.weapons.push('arremessoDoCutelo');
  enc.say('recurso', `${arma.name} de ${actor.name} se enche de ${actor.cutelo.tipo} (Cutelo Elemental).`);
}
export function largarCutelo(c) {
  if (!c.cutelo) return;
  delete c.cutelo;
  c.weapons = (c.weapons ?? []).filter((w) => w !== 'arremessoDoCutelo');
  if (c.equippedWeapon === 'arremessoDoCutelo') c.equippedWeapon = c.weapons[0];
}
/** O perfil da arma arremessada: a da mão, à distância (6/18 m), com Força. */
export function armaDoCuteloArremessada(actor) {
  const base = WEAPONS[actor.cutelo?.arma];
  if (!base) return null;
  return { ...base, id: 'arremessoDoCutelo', name: `${base.name} arremessada`, ranged: true, rangeFt: 20, longRangeFt: 60, ability: 'str', reachFt: 5 };
}
export const tipoDoCutelo = (c, weaponId) => (comFuria(c) && c.cutelo && [c.cutelo.arma, 'arremessoDoCutelo'].includes(weaponId ?? c.equippedWeapon) ? c.cutelo.tipo : null);
function dadoDoCutelo(enc, atacante, extra) {
  if (!comFuria(atacante) || !atacante.cutelo || ![atacante.cutelo.arma, 'arremessoDoCutelo'].includes(atacante.armaDoGolpeAgora ?? atacante.equippedWeapon)) return;
  extra('Cutelo Elemental', atacante.dadoDoCutelo ?? '1d6', atacante.cutelo.tipo);
}
/** A arma arremessada com Força soma o dano de Fúria (Devastação do Gigante). */
export const furiaNoArremesso = (c, weaponId) => weaponId === 'arremessoDoCutelo' && !!c.features?.includes('giantsHavoc');
/** IMPULSO PODEROSO (10º): ação bônus, em Fúria; o inimigo Médio ou menor (Grande no 14º) ao alcance testa FOR ou é arremessado até 9 m para longe. */
export function impulsoPoderoso(enc, actor, alvo) {
  if (!actor.features?.includes('mightyImpel') || !comFuria(actor) || actor.bonusUsed || !alvo || alvo.dead || alvo.side === actor.side) return false;
  const tamanhos = ['miúdo', 'pequeno', 'médio', 'medio', ...(actor.features.includes('demiurgicColossus') ? ['grande'] : [])];
  if (!tamanhos.includes(alvo.size ?? 'médio')) return false;
  const alcance = 5 + alcanceDoGiganteAMais(actor);
  if (distanceFt(actor.pos, alvo.pos) > alcance) return false;
  actor.bonusUsed = true;
  const dc = 8 + proficiencyBonus(actor.level ?? 10) + abilityMod(actor.abilities?.str ?? 10);
  const sv = enc.resistencia(alvo, 'str', dc, {});
  enc.explicarResistencia(alvo, 'str', dc, sv, { contra: `Impulso Poderoso de ${actor.name}`, seSucesso: 'fica onde está' });
  if (sv.success) return true;
  let melhor = null;
  for (let dy = -6; dy <= 6; dy++) {
    for (let dx = -6; dx <= 6; dx++) {
      const x = actor.pos.x + dx;
      const y = actor.pos.y + dy;
      const casa = { ...alvo.pos, x, y };
      if (distanceFt(actor.pos, casa) > 30 || !enc.field.inside(x, y) || enc.field.blocksMove(x, y) || enc.occupied(x, y, alvo)) continue;
      if (!enc.field.hasLineOfSight(actor.pos, casa)) continue;
      const longe = distanceFt(actor.pos, casa);
      if (!melhor || longe > melhor.longe) melhor = { casa, longe };
    }
  }
  if (!melhor) return true;
  const de = { ...alvo.pos };
  alvo.pos = { ...alvo.pos, x: melhor.casa.x, y: melhor.casa.y };
  enc.say('condicao', `${actor.name} arremessa ${alvo.name} a ${distanceFt(de, alvo.pos)} pés (Impulso Poderoso).`);
  enc.onEvent({ type: 'moved', actor: alvo, from: de, to: { ...alvo.pos }, path: [de, { ...alvo.pos }], empurrado: true });
  return true;
}

// ============================================================ hooks (Costa da Espada, Mestre, Fizban, Bigby)

/** Os dados do acerto: o Toque da Morte do clérigo, a Aura de Ódio, os Golpes Infundidos do draco, o Cutelo Elemental. */
export function extrasDosLivros2(enc, atacante, alvo, extra, { arma, ranged, tipo }) {
  toqueDaMorteDoClerigo(enc, atacante, alvo, extra, ranged);
  if (!arma) return;
  auraDeOdio(enc, atacante, extra, tipo, ranged);
  golpesInfundidos(enc, atacante, alvo, extra);
  dadoDoCutelo(enc, atacante, extra);
}
/** As reações que mudam o dano: o Elo Aperfeiçoado. A Lealdade Divina passa o dano a outro (`combat.js`). */
export const danoDosLivros2 = (enc, alvo, fonte, amount) => eloAperfeicoado(enc, alvo, amount);
export function resisteDosLivros2(enc, t, tipo, magico) {
  const f = t.features ?? [];
  if (f.includes('supernaturalResistance') && !magico && ['concussão', 'cortante', 'perfurante'].includes(tipo)) return true;
  if (hasCondition(t, 'campeaoExaltado') && !magico && ['concussão', 'cortante', 'perfurante'].includes(tipo)) return true;
  return resisteComODraco(enc, t, tipo) || resistenciaDaSerpe(enc, t, tipo);
}
export function vantagemNaResistenciaDosLivros2(enc, actor, hab, contra) {
  if (actor.features?.includes('unyieldingSpirit') && ['paralisado', 'atordoado'].includes(contra?.condicao)) return true;
  if (hab === 'wis' && naAuraExaltada(enc, actor)) return true;
  return false;
}
export const depoisDaResistenciaDosLivros2 = (enc, actor, hab, rolado, { forcador, rerolar }) => baluarteNaResistencia(enc, actor, hab, rolado, forcador, rerolar);
export function comecoDoLadoDosLivros2(enc, side) {
  senhorNoComeco(enc, side);
  dracoNoComeco(enc, side);
  for (const c of enc.allOf(side)) {
    // os PV do Abandono Descuidado somem com a Fúria
    if (c.pvDoAbandono && !comFuria(c)) { if ((c.tempHp ?? 0) <= c.pvDoAbandono) c.tempHp = 0; delete c.pvDoAbandono; }
    if (c.cutelo && !comFuria(c)) largarCutelo(c);
  }
}
/** O ataque contra quem está na sombra do Senhor do Terror, por quem não a enxerga, tem desvantagem. */
export function modsDosLivros2(enc, atacante, alvo, mods) {
  const p = senhorPerto(enc, alvo);
  if (p && p.side === alvo.side && atacante.side !== alvo.side && !(atacante.senses?.truesightFt || atacante.senses?.blindsightFt)) desvantagemNoGolpe(mods, 'a sombra do Senhor do Terror');
}
export function depoisDeSerAcertadoLivros2(enc, alvo, atacante, { corpoACorpo }) {
  retribuicaoEspinhosa(enc, alvo, atacante, corpoACorpo);
}
export function depoisDoDanoLivros2(enc, alvo, fonte) {
  feriuOMortoVivo(alvo, fonte);
}

/** A magia que a subclasse muda nesta conjuração: os sopros do monge do Dragão e do draco. */
export function magiaDosLivros2(actor, spell) {
  if (spell?.id?.startsWith('soproDoMonge')) return soproDoMonge(actor, spell);
  if (spell?.id === 'soproDoDraco') return soproDoDraco(actor, spell);
  return null;
}
/** Depois da conjuração: o sopro do monge tira um golpe da ação; o Poupar os Moribundos do Imortal desafia a morte. */
export function depoisDeConjurarLivros2(enc, actor, spell) {
  if (spell?.id?.startsWith('soproDoMonge')) depoisDoSoproDoMonge(enc, actor);
  if (spell?.id === 'pouparOsMoribundos') desafiarAMorte(enc, actor);
}
