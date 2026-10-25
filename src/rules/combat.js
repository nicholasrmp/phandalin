// SRD 5.1 (CC-BY-4.0) — ver NOTICE.md
//
// Motor de combate. Iniciativa POR LADO: rola-se uma vez para o grupo e uma
// para os inimigos; o lado vencedor age inteiro (na ordem que o jogador quiser)
// e depois passa a vez. É mais rápido que iniciativa individual e corta a fila
// de espera, que é o que mata jogo tático com 4 humanos.
//
// O motor é autoritativo e puro: ele não sabe desenhar. A camada de view só lê
// estado e chama métodos. É isso que vai permitir movê-lo para o servidor sem
// reescrever nada.

import { attackRoll, damageRoll, savingThrow, d20, roll, formatModifier, parseDice } from '../core/dice.js';
import { Battlefield, distanceFt, isAdjacent, key, FEET_PER_SQUARE } from '../core/grid.js';
import { ARMORS } from './items/index.js';
import {
  abilityMod, saveBonus, skillBonus, spellSaveDc, spellAttackBonus,
  proficiencyBonus, ABILITY_NAME, passivePerception,
} from './abilities.js';
import {
  WEAPONS, weaponAbility, armorClass,
  itemDeId, nomeDeId, quantosNaMochila, consumirDaMochila, garantirInventario, equipar,
} from './equipment.js';
import { addCondition, removeCondition, hasCondition, getCondition, conditionEffects, caEfetiva, CONDITIONS } from './conditions.js';

/**
 * REGRAS DA CASA — nada aqui é SRD.
 *
 * `ignite`: no 5e dano de fogo não incendeia ninguém. Aqui uma magia de fogo
 * tem chance de pegar: a criatura passa a sofrer 1d4 no início do turno dela.
 * Existe porque dá leitura visual ao combate (a criatura pega fogo na tela) e
 * porque recompensa quem escolhe a natureza certa. Ponha `enabled: false` para
 * jogar só com as regras do livro.
 */
export const HOUSE_RULES = {
  ignite: { enabled: true, chance: 0.35, rounds: 2, damage: '1d4' },
};
import { SPELLS, getSpell, magiasProntas, dadosDaMagia, APRIMORAR } from './spells.js';
import { makeMonster } from './monsters.js';
import {
  prepararTalentos, bonusDeIniciativa, segundaChanceNoAtaque, segundaChanceNaResistencia,
  ajustarDanoDeArma, depoisDoAcerto, rolarCura, vetoDoMedico, medicoDeCampanha, temUsoGratis, gastarUsoGratis,
} from './talentos.js';
import { spellMod } from './party.js';
import { modificadoresDeLuz } from './luz.js';

// ---- rolagens que se explicam ---------------------------------------------
//
// POR QUE ISTO EXISTE
// Metade da tática de 5e é fabricar vantagem. O log dizia "d20[18]+4 = 22 vs
// CA 16" e guardava para si POR QUE a rolagem teve dois dados e de onde veio o
// +4. Quem está aprendendo não tem como descobrir sozinho — o número já saiu, e
// o jogador nunca aprende a procurar a vantagem que não vê acontecer.
//
// Nada aqui decide coisa alguma: são funções puras que põem no papel a conta
// que o motor já fez. NENHUMA consome o gerador — se alguma rolasse um dado, o
// equilíbrio mudaria sem uma única regra mudar.

/**
 * Fecha o modo da rolagem a partir das duas balanças.
 *
 * Vantagem e desvantagem se anulam em 5e, e isso precisa de nome próprio: é a
 * regra mais contraintuitiva do sistema. Quem conquistou vantagem e viu a
 * rolagem sair com um dado só merece saber que ela foi cancelada, em vez de
 * achar que o jogo esqueceu.
 */
function fecharModo(mods) {
  mods.anulado = mods.advantage && mods.disadvantage;
  mods.mode = mods.anulado ? 'anulado'
    : mods.advantage ? 'vantagem'
      : mods.disadvantage ? 'desvantagem' : 'normal';
  return mods;
}

/**
 * Registra uma fonte de vantagem/desvantagem.
 *
 * `reasons` continua sendo a lista achatada que `odds.js` e o HUD já leem — não
 * se renomeia nada. O acréscimo é saber para que LADO cada motivo pesou, que é
 * justamente o que se perdia quando os dois lados caíam no mesmo array.
 */
function fonte(mods, lado, motivo) {
  if (lado === 'vantagem') {
    mods.advantage = true;
    mods.vantagens.push(motivo);
  } else {
    mods.disadvantage = true;
    mods.desvantagens.push(motivo);
  }
  mods.reasons.push(motivo);
  return fecharModo(mods);
}

/** Pacote de modificadores vazio, já com as duas listas por lado. */
const modsVazios = () => fecharModo({
  advantage: false, disadvantage: false, reasons: [], vantagens: [], desvantagens: [],
});

const MODO_TEXTO = {
  vantagem: 'vantagem: 2d20, vale o maior',
  desvantagem: 'desvantagem: 2d20, vale o menor',
  anulado: 'vantagem E desvantagem — se anulam, rolagem normal',
  normal: null,
};

/** Frase que nomeia o modo e de onde veio cada lado da balança. */
function explicarModo(mods) {
  const lados = [];
  if (mods.vantagens?.length) lados.push(`vantagem por ${mods.vantagens.join(' + ')}`);
  if (mods.desvantagens?.length) lados.push(`desvantagem por ${mods.desvantagens.join(' + ')}`);
  return [MODO_TEXTO[mods.mode], lados.length ? `(${lados.join('; ')})` : null]
    .filter(Boolean).join(' ');
}

/**
 * "+5 (Destreza +3, proficiência +2)".
 *
 * As partes SEMPRE somam o total; quando não somarem, é bug e aparece como tal
 * em vez de mentir uma origem.
 */
function explicarBonus(total, partes) {
  if (!partes?.length) return formatModifier(total);
  const detalhe = partes.map((p) => `${p.rotulo} ${formatModifier(p.valor)}`).join(', ');
  return `${formatModifier(total)} (${detalhe})`;
}

/** Notação dos dados realmente rolados — no crítico, o dobro deles. */
function notacaoDeDados(notacao, critico) {
  const { count, sides } = parseDice(notacao);
  if (!count) return null;
  return `${critico ? count * 2 : count}d${sides}`;
}

/**
 * Uma parcela de dano aberta: dados de um lado, modificador do outro.
 *
 * No crítico dobram os DADOS e não o modificador — é a dúvida mais comum de
 * quem está aprendendo 5e, e um "= 13" cru não responde nenhuma delas.
 */
function contaDeDano(parte) {
  const bits = [];
  const dados = notacaoDeDados(parte.notacao, parte.critico);
  if (dados) bits.push(`${dados}[${parte.dados.join('+')}]`);
  if (parte.mod) bits.push(`mod ${formatModifier(parte.mod)}`);
  const marca = parte.critico ? ' (crítico: dados dobrados)' : '';
  return `${parte.rotulo} ${bits.join(' + ')} = ${parte.total}${marca}`;
}

/** Monta a parcela de dano a partir do que `damageRoll` devolveu. */
function parcelaDeDano(rotulo, dmg) {
  return {
    rotulo,
    notacao: String(dmg.notation),
    dados: [...dmg.rolls],
    mod: dmg.mod,
    total: dmg.total,
    critico: !!dmg.critical,
  };
}

/**
 * Resistência por extenso.
 *
 * O log dizia "resistência 14 vs CD 13" e calava as três coisas que importam:
 * contra O QUE era o teste, com que atributo, e o que o alvo ganha ao passar.
 * "Resistiu" sem dizer se evitou tudo ou só metade não informa nada sobre a
 * decisão de ter gastado a magia ali.
 */
function contaDeResistencia(r) {
  // O cabeçalho diz só "resistência": o atributo já aparece como parcela do
  // bônus, e repetir o nome duas vezes na mesma linha não explica nada.
  if (r.automatica) {
    // Falha automática não rola nada, então mostrar o bônus do alvo seria
    // mentira útil para ninguém: o que importa é QUAL condição o travou.
    return [
      `contra ${r.contra}`,
      `falha automática${r.motivoAutomatico ? ` — ${r.motivoAutomatico} faz este teste falhar sempre` : ''}`,
      `CD ${r.cd} nem chega a ser rolada`,
      `se passasse: ${r.seSucesso}`,
    ].join(' · ');
  }
  return [
    `contra ${r.contra}`,
    `resistência ${explicarBonus(r.bonus, r.bonusPartes)}`,
    `d20[${r.d20Rolls.join('/')}] = ${r.total} vs CD ${r.cd}`,
    r.modo && r.modo !== 'normal' ? MODO_TEXTO[r.modo] : null,
    r.sucesso ? 'passou' : 'falhou',
    `se passar: ${r.seSucesso}`,
  ].filter(Boolean).join(' · ');
}

/** '5-6' ou [5, 6] → 5. `null` quando o ataque não recarrega. */
function recargaMinima(recharge) {
  if (!recharge) return null;
  if (Array.isArray(recharge)) return Math.min(...recharge);
  return Number(String(recharge).split('-')[0]) || 6;
}

// Crescer Plantas: o chão que não é natural (pedra, estrada, caverna, água, obra) não vira mato.
const SEM_PLANTAS = new Set(['estrada', 'caverna', 'ponte', 'leito', 'poco', 'riacho', 'entulho', 'fogueira', 'rocha', 'parede']);

export class Encounter {
  constructor({ battlefield, party, foes, rng, onLog = () => {}, onEvent = () => {}, reinforcements = null, emboscada = null }) {
    this.field = battlefield;
    this.rng = rng;
    this.onLog = onLog;
    this.onEvent = onEvent;
    // `{ emboscadores: 'foes' | 'party' }` ou null. Quem se esconde é dado do
    // encontro; a regra de surpresa é do motor (`rolarSurpresa`).
    this.emboscada = emboscada;
    this.surpresos = new Set();
    // Função (round) → { aviso, units } ou null. O motor não sabe QUEM chega;
    // isso é dado do encontro.
    this.reinforcements = reinforcements;

    this.combatants = [...party, ...foes];
    // Áreas que ficam no chão depois da magia (Graxa). O terreno difícil delas
    // vai para o campo, que é quem calcula o custo de andar.
    this.zonas = [];
    this.auras = [];
    this.field.dificeis = new Set();
    this.field.dificeis4 = new Set();
    this.field.dificeisExtra = null;
    this.field.voando = false;
    this.field.escalando = false;
    for (const c of this.combatants) {
      c.movementLeftFt = 0;
      c.actionUsed = true;
      c.bonusUsed = true;
      // A reação volta no começo do turno de cada um, mas ela EXISTE desde o
      // primeiro instante do combate: quem perde a iniciativa ainda pode dar
      // ataque de oportunidade no turno do outro lado. Só o surpreso fica sem
      // ela até o fim do turno que perde (`rolarSurpresa`).
      c.reactionUsed = false;
      c.acted = true;
      c.sneakUsedThisTurn = false;
      c.extraActions = 0;
      c.concentrating = null;
    }

    this.round = 0;
    this.side = null;
    this.over = false;
    this.outcome = null;
    this.log = [];
  }

  // ---- consultas -----------------------------------------------------------

  living(side) {
    return this.combatants.filter((c) => c.side === side && !c.dead && !hasCondition(c, 'inconsciente'));
  }

  allOf(side) {
    return this.combatants.filter((c) => c.side === side && !c.dead);
  }

  /**
   * Quem está NESTE quadrado — inclusive quando a âncora dele é outra.
   *
   * Um ogro ancorado em (4,4) também está em (5,4), (4,5) e (5,5). Enquanto
   * isto comparava só a âncora, dava para andar e atacar por dentro do corpo
   * de uma criatura Grande.
   */
  at(x, y) {
    return this.combatants.find((c) => {
      // Quem piscou para o Plano Etéreo não ocupa casa: dá para passar por onde estava.
      if (c.dead || hasCondition(c, 'etereo')) return false;
      const f = c.pos.f ?? 1;
      return x >= c.pos.x && x < c.pos.x + f && y >= c.pos.y && y < c.pos.y + f;
    });
  }

  occupied(x, y, except = null) {
    const c = this.at(x, y);
    return !!c && c !== except;
  }

  enemiesOf(actor) {
    // O NPC neutro (o goblin que só quer conversar) não é inimigo de ninguém
    // até a cena mudar o lado dele.
    const todos = this.combatants.filter((c) => c.side !== actor.side && c.side !== 'neutro' && !c.dead && !hasCondition(c, 'inconsciente') && !hasCondition(c, 'etereo'));
    // Quem finge de morto só é ignorado havendo outro alvo; senão a luta travava num impasse.
    const vivos = todos.filter((c) => !hasCondition(c, 'fingeMorto'));
    return vivos.length ? vivos : todos;
  }

  /** Fingir de Morto: só quem conjurou desfaz, tocando o amigo (ao lado), com uma ação. */
  despertarFingido(actor, target) {
    if (actor.actionUsed || actor.acaoLimitada || !this.field.vizinhos(actor.pos, target.pos)) return false;
    const k = target.conditions?.find((x) => x.id === 'fingeMorto');
    if (!k || (k.source && k.source !== actor.id)) return false;
    actor.actionUsed = true;
    removeCondition(target, 'fingeMorto');
    this.say('acao', `${actor.name} toca ${target.name} e encerra Fingir de Morto.`);
    this.afterAction(actor);
    return true;
  }

  alliesOf(actor) {
    return this.combatants.filter((c) => c.side === actor.side && !c.dead && c !== actor);
  }

  speedOf(actor) {
    const fx = conditionEffects(actor);
    if (fx.speedOverride !== null) return fx.speedOverride;
    // Armadura pesada sem a Força mínima tira 3 m do deslocamento.
    const forcaMinima = ARMORS[actor.armor ?? 'nenhuma']?.forcaMinima ?? 0;
    const pesada = forcaMinima > (actor.abilities?.str ?? 10) ? 10 : 0;
    const pes = Math.max(0, Math.max(actor.speedFt, fx.vooFt) - fx.speedPenaltyFt - pesada);
    // Lentidão: metade, em casas inteiras.
    const comBonus = (pes + fx.speedBonusFt) * (fx.speedMult ?? 1);
    return fx.speedHalf ? Math.floor(comBonus / 10) * 5 : comBonus;
  }

  // ---- ciclo de turnos -----------------------------------------------------

  start() {
    prepararTalentos(this);
    const partyInit = d20(this.rng, this.bestDex('party'));
    const foeInit = d20(this.rng, this.bestDex('foes'));
    this.say('inicio', `Iniciativa — Grupo ${partyInit.total} × ${foeInit.total} Inimigos`);
    this.round = 1;
    // Guarda quem abriu: a rodada só vira quando a vez volta para esse lado.
    this.firstSide = partyInit.total >= foeInit.total ? 'party' : 'foes';
    this.surpresos = this.rolarSurpresa();
    // Ganchos de quem monta o encontro: o familiar do grupo entra (`rules/familiar.js`), depois da
    // surpresa (um espírito chamado não é pego desprevenido).
    this.aoComecar?.(this);
    this.beginSide(this.firstSide);
  }

  /**
   * SURPRESA, pelo SRD.
   *
   * Sem isto não existia emboscada: o motor rolava iniciativa por lado e o
   * grupo abria a rodada 1 em 57% dos combates — medido em mil simulações —,
   * matando goblin antes de levar o primeiro tiro.
   *
   * A regra: cada emboscador rola Furtividade; cada alvo compara a sua
   * Percepção passiva. Quem não nota NENHUMA ameaça — Percepção abaixo de
   * todos os resultados, ou seja, abaixo do menor — está surpreso e perde o
   * primeiro turno inteiro: não se move, não age, e não reage até esse turno
   * acabar. É POR CRIATURA, não do lado: quem notou age normalmente.
   *
   * Não é o mesmo que perder a iniciativa. Se os emboscadores também vencem a
   * iniciativa, agem duas vezes antes do surpreso agir uma — é o que a regra
   * quer.
   *
   * Consequência que vale saber: quanto MAIS emboscadores, MENOS surpresa,
   * porque basta o pior resultado de Furtividade ser notado. Com quatro
   * goblins (+6) contra Percepção passiva 13, o personagem é surpreendido em
   * ~18% das vezes; com passiva 11, em ~32%. Se um encontro quiser surpresa
   * mais frequente, o SRD também permite o teste de grupo (metade do grupo
   * passando, o grupo passa) — é uma escolha de encontro, não do motor.
   */
  rolarSurpresa() {
    const surpresos = new Set();
    if (!this.emboscada) return surpresos;
    const lado = this.emboscada.emboscadores;
    const alvos = lado === 'foes' ? 'party' : 'foes';
    // A cena pode trazer os testes já rolados (a chegada da exploração usa
    // os mesmos para ver quem nota os emboscadores antes da luta).
    const furtivos = this.emboscada.furtividade
      ?? this.allOf(lado).map((c) => d20(this.rng, skillBonus(c, 'furtividade')).total);
    if (!furtivos.length) return surpresos;
    const menor = Math.min(...furtivos);
    const avisados = [];
    for (const c of this.allOf(alvos)) {
      if (passivePerception(c) < menor) {
        // Alarme: o aviso soa antes de os emboscadores chegarem, e quem estava perto da marca se prepara.
        if (lado === 'foes' && this.protegidoDeSurpresa?.(c)) { avisados.push(c.name); continue; }
        surpresos.add(c.id);
        c.reactionUsed = true;
      }
    }
    if (avisados.length) this.say('inicio', `O Alarme toca: ${avisados.join(', ')} ${avisados.length > 1 ? 'ouvem' : 'ouve'} o aviso e não ${avisados.length > 1 ? 'são pegos' : 'é pego'} de surpresa.`);
    const nomes = this.allOf(alvos).filter((c) => surpresos.has(c.id)).map((c) => c.name);
    this.say('inicio', `Furtividade dos emboscadores: ${furtivos.join(', ')} — `
      + (nomes.length ? `surpreendidos: ${nomes.join(', ')}.` : 'ninguém foi surpreendido.'));
    return surpresos;
  }

  bestDex(side) {
    // O lado rola uma vez, com o melhor bônus entre os seus — o Alerta soma
    // a proficiência de quem o tem (`talentos.js`).
    return Math.max(...this.allOf(side).map((c) => bonusDeIniciativa(c)), 0);
  }

  beginSide(side) {
    // Rodada nova começa quando a vez volta para quem abriu.
    if (side === this.firstSide) this.spawnReinforcements();

    this.side = side;
    // Efeitos que duram "até o começo do próximo turno" do conjurador.
    this.contarDuracoes((cond) => cond.lado === side && cond.quando === 'inicio');
    // Piscar: quem sumiu no fim do turno anterior volta antes de qualquer outra coisa.
    for (const c of this.allOf(side)) if (hasCondition(c, 'etereo')) this.voltarDoEtereo(c);
    for (const c of this.allOf(side)) {
      c.movementLeftFt = this.speedOf(c);
      c.actionUsed = false;
      c.bonusUsed = false;
      // A interação gratuita com um objeto (sacar a arma) e o quanto já andou
      // neste turno (a corrida antes do salto).
      c.interacaoUsada = false;
      c.corridaFt = 0;
      // Lentidão tira a reação enquanto durar.
      c.reactionUsed = conditionEffects(c).semReacao;
      c.acted = false;
      c.aurasNoTurno = [];
      c.ataquesRestantes = 0;
      for (const ativa of Object.values(c.magiasAtivas ?? {})) ativa.usadoNoTurno = false;
      // Velocidade: uma ação a mais por turno, só para atacar (um golpe),
      // correr, desengajar ou usar um objeto.
      c.acaoLimitada = false;
      c.acaoVelozDisponivel = hasCondition(c, 'acelerado');
      this.comecoDoTurnoMagico(c);
      c.sneakUsedThisTurn = false;
      c.martialUsedThisTurn = false;
      c.extraActions = 0;
      c.disengaging = false;
      c.magiasNoTurno = [];
      c.surgeUsedThisTurn = false;
      this.rolarRecarga(c);
      this.tickConditions(c);
      this.burnTick(c);
      this.vinhasTick(c);
      this.ilusaoTick(c);
      if (hasCondition(c, 'inconsciente') && c.kind === 'pc' && !c.stable) this.deathSave(c);
    }
    // Teia: quem começa o turno nela testa. Espíritos Guardiões: o inimigo
    // que começa o turno na aura sofre.
    for (const c of this.allOf(side)) {
      if (c.dead) continue;
      for (const zona of this.zonasEm(c.pos)) if (zona.quando === 'inicio') this.resistirAZona(c, zona, 'começa o turno');
      for (const aura of this.aurasHostisEm(c, c.pos)) this.golpeDaAura(aura, c, 'começa o turno');
    }
    // Passo sem Rastro: quem ficou perto de quem o conjurou leva o véu.
    this.renovarRastro();
    this.say('turno', side === 'party' ? `— Turno do grupo (rodada ${this.round}) —` : `— Turno dos inimigos (rodada ${this.round}) —`);
    this.onEvent({ type: 'sideStart', side });

    // O primeiro turno de quem foi surpreendido não acontece. Marca como
    // agido sem mover nem agir; se ninguém do lado sobrou, a vez passa.
    if (this.surpresos.size) {
      const perdem = this.allOf(side).filter((c) => this.surpresos.has(c.id));
      for (const c of perdem) {
        c.acted = true;
        c.movementLeftFt = 0;
        c.actionUsed = true;
        c.bonusUsed = true;
        this.surpresos.delete(c.id);
      }
      if (perdem.length) {
        this.say('turno', `${perdem.map((c) => c.name).join(', ')} — surpreendido${perdem.length > 1 ? 's' : ''}, perde${perdem.length > 1 ? 'm' : ''} o turno.`);
        this.maybeEndSide();
      }
    }
  }

  /** Recarga (5–6): no começo do turno, um d6 por ataque gasto. */
  rolarRecarga(c) {
    for (const nome of Object.keys(c.recarregando ?? {})) {
      if (!c.recarregando[nome]) continue;
      const atk = c.attacks?.find((a) => a.name === nome);
      const r = this.rng.die(6);
      if (r >= recargaMinima(atk?.recharge)) {
        c.recarregando[nome] = false;
        this.say('recurso', `${c.name}: ${nome} recarregou (d6 = ${r}).`);
      }
    }
  }

  /** Começo do turno: some o que dura "até o começo do seu próximo turno". */
  tickConditions(c) {
    if (!c.conditions?.length) return;
    c.conditions = c.conditions.filter((cond) => !CONDITIONS[cond.id]?.expiresAtTurnStart);
  }

  /**
   * Fim do turno de um lado: as durações contam aqui, e quem está preso a um
   * efeito que permite repetir a resistência ("no fim de cada turno seu")
   * rola de novo.
   *
   * As durações contavam no COMEÇO do turno, e uma condição de uma rodada (o
   * envenenado do Raio de Doença) sumia antes de o alvo agir — nunca dava a
   * desvantagem que prometia.
   */
  fimDoTurnoDoLado(side) {
    // Duelo Compelido: o conjurador que termina o turno a mais de 9 m do
    // duelado (ou com ele já morto) deixa a magia cair.
    for (const c of this.allOf(side)) {
      if (c.concentrating?.spellId !== 'dueloCompelido') continue;
      const alvo = c.concentrating.targets[0];
      if (!alvo || alvo.dead) this.acabarDuelo(c, 'o alvo caiu');
      else if (distanceFt(c.pos, alvo.pos) > 30) this.acabarDuelo(c, 'terminou o turno a mais de 9 m do alvo');
    }
    // Coroa da Loucura: sem a ação do conjurador (ou sem a vítima), a coroa cai.
    for (const c of this.allOf(side)) {
      const spell = c.concentrating ? getSpell(c.concentrating.spellId) : null;
      if (!spell?.mantem) continue;
      const alvo = c.concentrating.targets[0];
      if (!alvo || alvo.dead) this.dropConcentration(c);
      else if (!c.magiasAtivas?.[spell.id]?.usadoNoTurno) {
        this.say('concentracao', `${c.name} não gastou a ação para manter ${spell.name}: a magia acaba.`);
        this.dropConcentration(c);
      }
    }
    // Flecha Ácida: o ácido que ficou queima no fim do turno de quem levou.
    for (const c of this.allOf(side)) {
      const acido = getCondition(c, 'acidoAtrasado');
      if (!acido || c.dead) continue;
      const r = damageRoll(this.rng, acido.data.dano);
      const dono = this.combatants.find((x) => x.id === acido.source);
      this.say('magia', `O ácido ainda queima ${c.name}: ${r.total}.`, `${acido.data.dano}[${r.rolls.join('+')}]`);
      this.applyDamage(c, r.total, 'ácido', dono ?? null, { magico: true });
    }
    for (const c of this.allOf(side)) {
      for (const cond of [...(c.conditions ?? [])]) {
        if (!cond.data?.repete || c.dead) continue;
        // Medo: só repete quem termina o turno SEM ver quem o assustou.
        if (cond.data.repete === 'semVisao') {
          const fonteDoMedo = this.combatants.find((x) => x.id === cond.source && !x.dead);
          if (fonteDoMedo && this.field.hasLineOfSight(c.pos, fonteDoMedo.pos)) continue;
        }
        const save = this.resistencia(c, cond.data.save, cond.data.dc);
        const nome = CONDITIONS[cond.id]?.name ?? cond.id;
        const r = this.explicarResistencia(c, cond.data.save, cond.data.dc, save, {
          contra: `${nome} (nova resistência no fim do turno)`,
          seSucesso: `deixa de estar ${nome.toLowerCase()}`,
        });
        if (save.success) {
          removeCondition(c, cond.id);
          this.say('condicao', `${c.name} se livra: não está mais ${nome.toLowerCase()}.`, r.conta, { rolagem: r });
          this.soltouDaConcentracao(c, cond.id);
        } else {
          this.say('condicao', `${c.name} continua ${nome.toLowerCase()}.`, r.conta, { rolagem: r });
        }
      }
      // Magias ativas sem concentração (Arma Espiritual): 1 minuto.
      for (const [id, ativa] of Object.entries(c.magiasAtivas ?? {})) {
        if (ativa.rodadas == null) continue;
        ativa.rodadas -= 1;
        if (ativa.rodadas <= 0) {
          delete c.magiasAtivas[id];
          this.say('magia', `${c.name}: ${getSpell(id).name} se desfaz.`);
        }
      }
      // Magia de concentração com duração (Bênção: 1 minuto).
      if (c.concentrating?.rounds) {
        c.concentrating.rounds -= 1;
        if (c.concentrating.rounds <= 0) {
          this.say('concentracao', `${c.name}: ${getSpell(c.concentrating.spellId)?.name ?? 'a magia'} chega ao fim.`);
          this.dropConcentration(c);
        }
      }
    }
    // Raio de Bruxa: a ação gasta noutra coisa encerra o arco.
    for (const c of this.allOf(side)) {
      const arco = c.magiasAtivas?.raioDeBruxa;
      if (arco && c.actionUsed && !arco.usadoNoTurno && c.concentrating?.spellId === 'raioDeBruxa') {
        this.say('concentracao', `${c.name} usou a ação noutra coisa: o arco do Raio de Bruxa se desfaz.`);
        this.dropConcentration(c);
      }
    }
    // Esfera Flamejante: no fim do turno do dono, quem está a 1,5 m dela.
    for (const z of this.zonas) {
      if (z.quando !== 'fimDono' || z.lado !== side) continue;
      for (const c of this.combatants) {
        // Quem está a 1,5 m da esfera (o próprio conjurador também, como no livro).
        if (c.dead || !z.centro || distanceFt(c.pos, z.centro) > 5) continue;
        this.danoDaZona(c, z, 'está perto');
      }
    }
    // Cordão de Flechas: quem termina o turno ao alcance das flechas leva uma.
    for (const c of this.allOf(side)) this.cordaoNoFimDoTurno(c);
    // Graxa: quem termina o turno dentro dela testa de novo.
    for (const c of this.allOf(side)) {
      for (const zona of this.zonasEm(c.pos)) {
        if (zona.quando === 'fim') this.resistirAZona(c, zona, 'termina o turno');
        // Fome de Hadar: quem TERMINA o turno dentro faz DES ou leva ácido.
        if (zona.fimDano && !c.dead) this.danoDeFimDaZona(c, zona);
      }
    }
    // Piscar: o d20 do fim do turno, antes de a duração andar.
    for (const c of this.allOf(side)) this.piscarNoFimDoTurno(c);
    this.contarZonas(side);
    // As durações: as que contam no turno de quem as carrega, e as que
    // contam no fim do turno do lado do conjurador.
    this.contarDuracoes((cond, dono) => (cond.lado ? cond.lado === side && cond.quando !== 'inicio' : dono.side === side));
  }

  /** Anda um passo nas durações que `conta` escolher; some o que zerar. */
  contarDuracoes(conta) {
    for (const c of this.combatants) {
      if (!c.conditions?.length) continue;
      c.conditions = c.conditions.filter((cond) => {
        if (cond.rounds === Infinity || !conta(cond, c)) return true;
        cond.rounds -= 1;
        return cond.rounds > 0;
      });
    }
  }

  /**
   * Põe uma condição e cobra o que ela implica. Condição que incapacita
   * (atordoado, paralisado, inconsciente) derruba a concentração: a Bênção
   * não continua valendo com o clérigo fora de combate.
   */
  aplicarCondicao(alvo, id, opcoes = {}) {
    const fonte = typeof opcoes.source === 'string' ? this.combatants.find((c) => c.id === opcoes.source) : null;
    if (id !== 'etereo' && hasCondition(alvo, 'etereo')) return null;
    if (this.imuneACondicao(alvo, id, fonte)) return null;
    const cond = addCondition(alvo, id, opcoes);
    if (CONDITIONS[id]?.incapacitated) this.dropConcentration(alvo);
    return cond;
  }

  /**
   * Reforços do encontro. Existem por causa da iniciativa por lado: quem vence
   * a iniciativa despacha metade do inimigo antes de qualquer um deles agir.
   * Um bando que chega no meio impede o combate de ser decidido na abertura.
   */
  spawnReinforcements() {
    if (!this.reinforcements || this.over) return;
    const wave = this.reinforcements(this.round);
    if (!wave?.units?.length) return;
    for (const unit of wave.units) {
      // A casa de chegada pode estar ocupada — um personagem parado na boca
      // da trilha, por exemplo. Dois na mesma casa quebram tudo que pergunta
      // "quem está aqui" (o tabuleiro desenha só um, o clique pega o outro).
      // Então o reforço desce para a casa livre e andável mais próxima.
      unit.pos = this.casaLivreMaisProxima(unit.pos) ?? unit.pos;
      this.addCombatant(unit);
    }
    this.say('turno', wave.aviso ?? 'Reforços chegam!');
    this.onEvent({ type: 'reinforcements', units: wave.units, aviso: wave.aviso });
  }

  /** Entra em combate já começado. Só age no próximo turno do lado dele. */
  /**
   * A casa livre e andável mais próxima de `pos`, por anéis de distância.
   * Null se não houver nenhuma a até 6 casas — aí o chamador decide.
   */
  casaLivreMaisProxima(pos) {
    // A pegada inteira precisa estar livre: fera Grande (f = 2) ocupa 2x2.
    const f = pos.f ?? 1;
    const livre = (x, y) => {
      for (let dy = 0; dy < f; dy++) {
        for (let dx = 0; dx < f; dx++) {
          if (!this.field.inside(x + dx, y + dy) || this.field.blocksMove(x + dx, y + dy) || this.occupied(x + dx, y + dy)) return false;
        }
      }
      // E sem parede de borda cortando o corpo dela.
      return !this.field.paredeNaPegada(x, y, f);
    };
    for (let r = 0; r <= 6; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          if (livre(pos.x + dx, pos.y + dy)) return { ...pos, x: pos.x + dx, y: pos.y + dy };
        }
      }
    }
    return null;
  }

  addCombatant(c) {
    c.movementLeftFt = 0;
    c.actionUsed = true;
    c.bonusUsed = true;
    c.reactionUsed = true;
    c.acted = true;
    c.sneakUsedThisTurn = false;
    c.martialUsedThisTurn = false;
    c.extraActions = 0;
    c.concentrating = null;
    this.combatants.push(c);
    return c;
  }

  // ---- criaturas invocadas aliadas -----------------------------------------
  //
  // UMA MECÂNICA SÓ para toda magia que põe uma criatura a lutar pelo grupo
  // (Conjurar Animais, Animar os Mortos e as que vierem: Conjurar Elemental...).
  //
  //  - Entra em `combatants` com a ficha de monstro de `makeMonster`, mas do LADO
  //    de quem conjurou (`side`), então o grupo a comanda como um herói: a
  //    seleção, o movimento e o ataque pelo HUD valem sem código novo, e os
  //    inimigos a escolhem como alvo (`enemiesOf`) como a qualquer outro.
  //  - Não tem iniciativa própria: o jogo rola por LADO, e ela age no turno do
  //    grupo, na ordem que o jogador quiser. Entra com o turno já gasto
  //    (`addCombatant`) e só age a partir do próximo turno do grupo.
  //  - `invocado = { donoId, spellId }` é a marca. Quem a lê: `checkEnd` (não
  //    segura o grupo de pé nem a vitória), `dropConcentration` e o fim do
  //    encontro (`dispensarInvocados`), o XP (`xp = 0`) e o Revivificar.
  //  - Para jogá-la sozinha (IA aliada), `takeMonsterTurn` já serve: ela só
  //    pergunta por `enemiesOf`, que olha o lado.
  invocar(dono, defId, pos, { spellId, sufixo = '' } = {}) {
    const m = makeMonster(defId, pos, { rng: this.rng, nameSuffix: sufixo });
    const casa = this.casaLivreMaisProxima({ x: pos.x, y: pos.y, f: m.pos.f });
    if (!casa) return null;
    m.pos = { x: casa.x, y: casa.y, f: m.pos.f };
    m.side = dono.side;
    // No livro 2014, as feras do Conjurar Animais são feéricas (o Círculo Mágico as barra).
    if (spellId === 'conjurarAnimais') m.tipo = 'feérico';
    m.invocado = { donoId: dono.id, spellId, auto: Boolean(dono.invocadosAuto) };
    // Não vale XP, e o painel do grupo lê estes dois campos do herói.
    m.xp = 0;
    m.className = 'Invocado';
    m.ancestry = m.tipo ?? 'criatura';
    this.addCombatant(m);
    this.onEvent({ type: 'invocado', criatura: m, dono });
    return m;
  }

  /** Os invocados de um dono (vivos, em jogo). */
  invocadosDe(dono) {
    return this.combatants.filter((c) => c.invocado?.donoId === dono.id && !c.dead);
  }

  /** "Agir sozinho" de UM invocado: a IA aliada joga o turno dele. */
  definirAutoDoInvocado(c, auto) {
    if (c.invocado) c.invocado.auto = Boolean(auto);
  }

  /** "Agir sozinhos" para TODOS os invocados do dono (e para os que ele invocar depois). */
  definirAutoDosInvocados(dono, auto) {
    dono.invocadosAuto = Boolean(auto);
    for (const c of this.invocadosDe(dono)) c.invocado.auto = Boolean(auto);
  }

  /** Tira do encontro as criaturas invocadas que `quais` escolher (a magia acabou, o encontro acabou). */
  dispensarInvocados(quais, motivo = null) {
    const saem = this.combatants.filter((c) => c.invocado && quais(c));
    if (!saem.length) return;
    this.combatants = this.combatants.filter((c) => !saem.includes(c));
    for (const c of saem) {
      if (!c.dead && !this.over) this.say('magia', `${c.name} some${motivo ? ` (${motivo})` : ''}.`);
      this.onEvent({ type: 'dispensado', target: c });
    }
  }

  /** O sufixo numérico dos nomes: "Lobo Atroz 2", para o grupo saber quem é quem. */
  sufixoDeInvocado(defId, i, total, antes = 0) {
    return total + antes > 1 ? String(antes + i + 1) : '';
  }

  // ---- Piscar ---------------------------------------------------------------

  /** Fim do turno de quem pisca: 1d20, e 11 ou mais manda para o Plano Etéreo. */
  piscarNoFimDoTurno(c) {
    if (c.dead || !hasCondition(c, 'piscando') || hasCondition(c, 'etereo') || hasCondition(c, 'inconsciente')) return;
    const d = this.rng.die(20);
    if (d < 11) {
      this.say('magia', `${c.name} pisca: d20 = ${d}, continua aqui.`);
      return;
    }
    this.say('magia', `${c.name} pisca: d20 = ${d} — some para o Plano Etéreo até o começo do próximo turno.`);
    addCondition(c, 'etereo', { source: c.id, data: { origem: { x: c.pos.x, y: c.pos.y } } });
    this.onEvent({ type: 'sumiu', target: c, de: { ...c.pos } });
  }

  /** Volta do Plano Etéreo: na casa de onde saiu, ou na livre mais próxima. */
  voltarDoEtereo(c) {
    const eter = getCondition(c, 'etereo');
    const origem = eter?.data?.origem ?? c.pos;
    // Ainda etéreo na conta: assim ele não ocupa a própria casa de volta.
    const casa = this.casaLivreMaisProxima({ x: origem.x, y: origem.y, f: c.pos.f ?? 1 }) ?? origem;
    removeCondition(c, 'etereo');
    if (c.dead) return;
    const de = { ...c.pos };
    c.pos = { x: casa.x, y: casa.y, f: c.pos.f ?? 1 };
    this.say('magia', `${c.name} volta do Plano Etéreo.`);
    this.onEvent({ type: 'voltou', target: c, de, to: { ...c.pos } });
  }

  /**
   * Redirecionar Ataque (Chefe Goblin, conteúdo próprio): ao ser alvo de um ataque, troca de
   * lugar com um goblin adjacente, que vira o alvo. Gasta a reação dele.
   */
  tryRedirect(target) {
    if (!target.traits?.includes('redirectAttack') || target.reactionUsed) return target;
    if (conditionEffects(target).incapacitated) return target;
    // Qualquer goblin serve (o arqueiro também é goblin), desde que acordado.
    const buddy = this.alliesOf(target).find(
      (a) => /^goblin/i.test(a.defId ?? '') && !a.traits?.includes('redirectAttack')
        && this.field.vizinhos(a.pos, target.pos) && !conditionEffects(a).incapacitated,
    );
    if (!buddy) return target;

    target.reactionUsed = true;
    const swap = { ...target.pos };
    target.pos = { ...buddy.pos };
    buddy.pos = swap;
    this.say('reacao', `${target.name} empurra ${buddy.name} na frente — o golpe vai nele.`);
    this.onEvent({ type: 'redirect', from: target, to: buddy });
    return buddy;
  }

  /**
   * Vantagem Marcial (Hobgoblin, SRD): uma vez por turno, +2d6 se um aliado não
   * incapacitado estiver a até 1,5 m do alvo. É o que faz o grupo pagar caro
   * por ficar amontoado.
   */
  martialApplies(attacker, target) {
    if (!attacker.traits?.includes('martialAdvantage') || attacker.martialUsedThisTurn) return false;
    return this.alliesOf(attacker).some(
      (a) => this.field.vizinhos(a.pos, target.pos) && !conditionEffects(a).incapacitated && !a.dead,
    );
  }

  /** Regra da casa: magia de fogo pode incendiar o alvo. */
  maybeIgnite(target, damageType) {
    const rule = HOUSE_RULES.ignite;
    if (!rule.enabled || damageType !== 'fogo') return;
    if (target.dead || hasCondition(target, 'queimando')) return;
    if (!this.rng.chance(rule.chance)) return;
    addCondition(target, 'queimando', { rounds: rule.rounds, data: { damage: rule.damage } });
    this.say('condicao', `${target.name} pega fogo!`);
    this.onEvent({ type: 'ignite', target });
  }

  /** Golpe Constritor: no começo do turno, as vinhas apertam quem prendem. */
  vinhasTick(c) {
    const v = getCondition(c, 'presoPorVinhas')?.data?.vinhas;
    if (!v || c.dead) return;
    const dono = this.combatants.find((x) => x.id === getCondition(c, 'presoPorVinhas').source);
    const r = damageRoll(this.rng, v.dados);
    this.say('magia', `As vinhas apertam ${c.name}: ${r.total} de ${v.tipo}.`, `${v.dados}[${r.rolls.join('+')}]`);
    this.applyDamage(c, r.total, v.tipo, dono ?? null, { magico: true });
  }

  /** Regra da casa: quem está queimando sofre dano no início do próprio turno. */
  burnTick(c) {
    const burning = getCondition(c, 'queimando');
    if (!burning || c.dead) return;
    const r = roll(this.rng, burning.data?.damage ?? HOUSE_RULES.ignite.damage);
    this.say('condicao', `${c.name} queima: ${r.total} de fogo.`, `${r.notation}[${r.rolls.join('+')}]`);
    this.onEvent({ type: 'burn', target: c, amount: r.total });
    this.applyDamage(c, r.total, 'fogo', null);
  }

  /** Marca o combatente como tendo terminado e, se o lado acabou, passa a vez. */
  endTurn(actor) {
    actor.acted = true;
    actor.movementLeftFt = 0;
    this.onEvent({ type: 'turnEnd', actor });
    this.maybeEndSide();
  }

  maybeEndSide() {
    if (this.over) return;
    const pending = this.allOf(this.side).filter((c) => !c.acted && !hasCondition(c, 'inconsciente'));
    if (pending.length > 0) return;
    this.fimDoTurnoDoLado(this.side);
    if (this.over) return;
    const next = this.side === 'party' ? 'foes' : 'party';
    if (next === this.firstSide) this.round += 1;
    this.beginSide(next);
  }

  checkEnd() {
    if (this.over) return true;
    // A criatura invocada luta ao lado do grupo, mas não o mantém de pé: se os
    // quatro heróis caem, é derrota mesmo com o lobo em pé.
    const partyUp = this.living('party').filter((c) => !c.invocado).length;
    const foesUp = this.living('foes').filter((c) => !c.invocado).length;
    // A cena ainda tem gente para trazer (uma onda, uma segunda leva): o campo
    // vazio não acaba a luta, o próximo lote entra agora.
    if (foesUp === 0 && partyUp > 0 && this.lotePendente) {
      const lote = this.lotePendente();
      if (lote?.units?.length) {
        for (const unit of lote.units) {
          unit.pos = this.casaLivreMaisProxima(unit.pos) ?? unit.pos;
          this.addCombatant(unit);
        }
        this.say('turno', lote.aviso ?? 'Reforços chegam!');
        this.onEvent({ type: 'reinforcements', units: lote.units, aviso: lote.aviso });
        return false;
      }
    }
    if (foesUp === 0) {
      this.over = true;
      this.outcome = 'vitoria';
      this.say('fim', 'Inimigos derrotados.');
      // Fora do combate ninguém conta deslocamento: quem está acordado e no
      // chão se levanta. Sem isto a figura ficava deitada até o descanso.
      for (const c of this.allOf('party')) this.levantarForaDoCombate(c);
    } else if (partyUp === 0) {
      this.over = true;
      this.outcome = 'derrota';
      this.say('fim', 'O grupo caiu.');
    }
    if (this.over) {
      // Quem piscou para o Plano Etéreo volta antes de tudo, senão fica lá para sempre.
      for (const c of this.combatants) if (hasCondition(c, 'etereo')) this.voltarDoEtereo(c);
      // As magias de combate acabam com o encontro: Levitação (e a concentração que a segura),
      // Piscar e Conjurar Animais. Sem isto o herói ficava com deslocamento 0 até o descanso.
      for (const c of this.combatants) {
        for (const id of ['levitando', 'piscando', 'etereo']) if (hasCondition(c, id)) removeCondition(c, id);
        const k = c.concentrating && SPELLS[c.concentrating.spellId]?.kind;
        if (k === 'levitar' || k === 'invocar') c.concentrating = null;
      }
      // O encontro acaba e as criaturas invocadas vão embora com ele.
      this.dispensarInvocados(() => true, 'o encontro acabou');
      this.onEvent({ type: 'end', outcome: this.outcome });
    }
    return this.over;
  }

  // ---- movimento -----------------------------------------------------------

  /**
   * `evitarZonas`: o caminho não pisa em casa de zona (Graxa). É escolha de
   * quem anda (a IA de quem tem juízo), não regra: quem já está dentro da
   * zona anda livre para sair.
   */
  reachableFor(actor, { evitarZonas = false } = {}) {
    if (hasCondition(actor, 'inconsciente') || conditionEffects(actor).incapacitated) return new Map();
    const f = actor.pos.f ?? 1;
    // Só as zonas que ferem ou prendem: ninguém desvia de uma névoa.
    const hostil = (pos) => this.zonasEm(pos).some((z) => !z.inofensiva);
    const evita = evitarZonas && this.zonas.length && !hostil(actor.pos);
    const cabeNaPegada = this.cabeNaCasa(actor, f);
    // Acorrentado (os lobos do canil): só anda até onde a corrente alcança.
    const corrente = actor.corrente;
    const cabeBase = corrente
      ? (x, y) => distanceFt(corrente, { x, y }) <= corrente.raioFt && (!cabeNaPegada || cabeNaPegada(x, y))
      : cabeNaPegada;
    // Duelo Compelido: não se afasta mais de 9 m de quem o desafiou (quem já
    // está além só anda para perto). No livro há um teste; aqui, não sai.
    const duelista = this.duelistaDe(actor);
    const cabe = duelista
      ? (x, y) => {
        const d = distanceFt(duelista.pos, { x, y });
        return (d <= 30 || d <= distanceFt(duelista.pos, actor.pos)) && (!cabeBase || cabeBase(x, y));
      }
      : cabeBase;
    this.field.dificeisExtra = this.terrenoHostil(actor);
    this.field.voando = this.voaAgora(actor);
    this.field.escalando = this.escalaAgora(actor);
    // Círculo Mágico: o tipo barrado não entra (quem já está dentro anda livre).
    const barras = this.circulosQueBarram(actor);
    const cabeFinal = barras.length
      ? (x, y) => !barras.some((z) => this.pegadaEmZona(z, x, y, f)) && (!cabe || cabe(x, y))
      : cabe;
    try {
      return this.field.reachable(
      actor.pos,
      // Caído só rasteja: cada metro custa o dobro.
      Math.floor(actor.movementLeftFt / this.custoDeMovimento(actor)),
      (x, y) => this.occupied(x, y, actor),
      // Quem ocupa 2x2 só pisa onde os quatro quadrados existem e estão livres
      // de parede. Sem isto o ogro para com metade do corpo dentro da pedra.
      evita ? (x, y) => !hostil({ x, y, f }) && (!cabeFinal || cabeFinal(x, y)) : cabeFinal,
      f,
      );
    } finally {
      this.field.dificeisExtra = null;
      this.field.voando = false;
      this.field.escalando = false;
    }
  }

  /** Quem voa não pisa no chão: terreno difícil, degraus e zonas do chão não o pegam. */
  voaAgora(actor) {
    return hasCondition(actor, 'voando') && !hasCondition(actor, 'caido') && !conditionEffects(actor).incapacitated;
  }

  /** Patas de Aranha: sobe degraus sem custo de escalada, mas pisa no terreno difícil e nas zonas do chão. */
  escalaAgora(actor) {
    return hasCondition(actor, 'escalando') && !hasCondition(actor, 'caido') && !conditionEffects(actor).incapacitated;
  }

  /** Quem desafiou `actor` para o Duelo Compelido (vivo), ou null. */
  duelistaDe(actor) {
    const d = getCondition(actor, 'duelo');
    return d ? this.combatants.find((c) => c.id === d.source && !c.dead) ?? null : null;
  }

  /** Quem ocupa 2x2 só pisa onde as quatro casas existem e estão livres. */
  cabeNaCasa(actor, f) {
    if (f === 1) return undefined;
    return (x, y) => {
      for (let dy = 0; dy < f; dy++) {
        for (let dx = 0; dx < f; dx++) {
          if (!this.field.inside(x + dx, y + dy)) return false;
          if (this.field.blocksMove(x + dx, y + dy)) return false;
          if (this.field.paredeNaPegada(x, y, f)) return false;
          if (this.occupied(x + dx, y + dy, actor)) return false;
        }
      }
      return true;
    };
  }

  /** Move seguindo o caminho, resolvendo ataques de oportunidade a cada passo. */
  moveAlong(actor, path) {
    if (path.length < 2) return false;
    const reached = this.reachableFor(actor);
    const dest = path[path.length - 1];
    const node = reached.get(key(dest.x, dest.y));
    if (!node) return false;
    // O que se cobra é o caminho ANDADO: um desvio (a IA contornando a Graxa)
    // custa mais que o caminho mais curto até a mesma casa.
    const hostil = this.terrenoHostil(actor);
    const custoAte = (fim) => {
      this.field.dificeisExtra = hostil;
      this.field.voando = this.voaAgora(actor);
      this.field.escalando = this.escalaAgora(actor);
      let pes = 0;
      for (let i = 1; i <= fim; i++) pes += this.field.costOf(path[i].x, path[i].y, path[i - 1].x, path[i - 1].y);
      this.field.dificeisExtra = null;
      this.field.voando = false;
      this.field.escalando = false;
      return pes;
    };
    if (custoAte(path.length - 1) * this.custoDeMovimento(actor) > actor.movementLeftFt) return false;
    const origin = { ...actor.pos };
    // O custo de rastejar vale o que era ao sair: cair no meio do caminho não
    // cobra em dobro os passos já dados de pé.
    const custo = this.custoDeMovimento(actor);
    let ate = path.length - 1;

    for (let i = 1; i < path.length; i++) {
      const from = { ...actor.pos };
      const to = path[i];
      // Quem tinha o ator no alcance e deixa de ter leva a reação.
      // Quem está incapacitado não reage, e quem não tem arma de perto não
      // tem com que aproveitar a brecha.
      const threats = actor.disengaging ? [] : this.enemiesOf(actor).filter(
        (e) => !e.reactionUsed
          && !conditionEffects(e).incapacitated
          && this.armaDeOportunidade(e) !== undefined
          && !this.separadosPelaAltura(e, actor)
          && distanceFt(e.pos, from) <= this.reachOf(e)
          && this.field.contato(e.pos, from)
          && distanceFt(e.pos, to) > this.reachOf(e),
      );
      // O ataque de oportunidade acontece LOGO ANTES de o alvo sair do
      // alcance: resolvido com ele ainda na casa de partida. Resolvido depois,
      // o atacante media a distância da casa nova e o ataque nunca alcançava.
      for (const threat of threats) {
        this.opportunityAttack(threat, actor);
        if (actor.dead || hasCondition(actor, 'inconsciente')) break;
      }
      if (actor.dead || hasCondition(actor, 'inconsciente')) { ate = i - 1; break; }
      // `f` viaja junto: perder a pegada aqui faria o ogro virar Médio ao andar.
      actor.pos = { x: to.x, y: to.y, f: actor.pos.f ?? 1 };
      // Graxa: quem ENTRA na área testa; quem cai para ali mesmo.
      const deAntes = this.zonasEm(from);
      let parou = false;
      for (const zona of this.zonasEm(actor.pos)) {
        // Ilusão Menor: quem a atravessa e não é do lado dela vê que é só uma imagem.
        if (zona.ilusao && zona.lado !== actor.side && !deAntes.includes(zona)) {
          this.say('magia', `${actor.name} atravessa a imagem: era só uma ilusão.`);
          this.desfazerZona(zona);
          continue;
        }
        if (!zona.aoEntrar || deAntes.includes(zona)) continue;
        if (!this.resistirAZona(actor, zona, 'entra')) parou = true;
      }
      // Glifo de Proteção e Cordão de Flechas: o que o passo novo dispara.
      if (this.gatilhosDeArmadilha(actor, from)) parou = true;
      if (actor.dead || hasCondition(actor, 'inconsciente')) { ate = i; break; }
      if (parou) { ate = i; break; }
      // Armadilha da cena (fosso escondido, ponte podre): o passo para ali, e
      // a cena resolve a queda ao ouvir o `moved`.
      if (this.paraNaCasa?.(actor, actor.pos)) { ate = i; break; }
      // Crescimento de Espinhos: cada casa andada dentro dela fere.
      const espinhos = this.zonas.find((z) => z.danoPorPasso && z.casas.has(key(actor.pos.x, actor.pos.y)) && !(z.noChao && this.voaAgora(actor)));
      if (espinhos) {
        const r = damageRoll(this.rng, espinhos.danoPorPasso);
        this.say('magia', `${actor.name} anda entre os espinhos: ${r.total} perfurante.`, `${espinhos.danoPorPasso}[${r.rolls.join('+')}]`);
        this.applyDamage(actor, r.total, 'perfurante', null, { magico: true });
        if (actor.dead || hasCondition(actor, 'inconsciente')) { ate = i; break; }
      }
      // Espíritos Guardiões: entrar na aura dói (uma vez por turno).
      for (const aura of this.aurasHostisEm(actor, actor.pos)) {
        if (this.aurasHostisEm(actor, from).includes(aura)) continue;
        this.golpeDaAura(aura, actor, 'entra');
      }
      if (actor.dead || hasCondition(actor, 'inconsciente')) { ate = i; break; }
    }
    actor.movementLeftFt = Math.max(0, actor.movementLeftFt - custoAte(ate) * custo);
    // A corrida antes do salto: a DISTÂNCIA andada desde a última coisa que
    // não foi andar (`afterAction` e o próprio salto zeram).
    actor.corridaFt = (actor.corridaFt ?? 0) + ate * 5;
    // Passo sem Rastro: o véu anda com quem o conjurou.
    this.renovarRastro();
    // `from` deixa a camada de desenho calcular para onde a figura está virada,
    // sem o motor precisar conhecer o conceito de "frente" (o 5e não tem).
    this.onEvent({ type: 'moved', actor, from: origin, to: { ...actor.pos }, path: path.slice(0, ate + 1).map((p) => ({ ...p })) });
    return true;
  }

  // ---- zonas no chão (Graxa) ----------------------------------------------

  proximaZona() {
    this.contadorDeZonas = (this.contadorDeZonas ?? 0) + 1;
    return this.contadorDeZonas;
  }

  /** Terreno difícil das zonas que o são (Raio Lunar e Esfera não são). */
  atualizarDificeis() {
    this.field.dificeis = new Set(this.zonas.filter((z) => z.dificil).flatMap((z) => [...z.casas]));
    this.field.dificeis4 = new Set(this.zonas.filter((z) => z.dificil4).flatMap((z) => [...z.casas]));
  }

  /** As casas que a zona de fato cobre (Crescer Plantas: só chão natural, sem os aliados). A prévia usa a mesma conta. */
  casasDaZona(actor, spell, casas) {
    if (spell.zona?.soVegetal) casas = casas.filter((t) => !SEM_PLANTAS.has(this.field.surfaceAt(t.x, t.y)) && !this.field.blocksMove(t.x, t.y));
    if (spell.zona?.poupaAliados) casas = casas.filter((t) => { const c = this.at(t.x, t.y); return !(c && c.side === actor.side); });
    return casas;
  }

  criarZona(actor, spell, casas, cd, { centro = null, circulo = spell.level, tipo = null } = {}) {
    const dano = spell.zona.dano;
    // Crescer Plantas: só o chão natural vira mato, e as casas dos aliados ficam de fora.
    casas = this.casasDaZona(actor, spell, casas);
    const zona = {
      id: this.proximaZona(),
      dificil: spell.zona.dificil ?? true,
      // Raio Lunar, Esfera Flamejante, Nuvem de Adagas: a zona fere.
      dano: dano ? { ...dano, dados: dadosDaMagia(spell, { circulo, notacao: dano.dados }) } : null,
      centro: centro ? { x: centro.x, y: centro.y } : null,
      dono: actor.id,
      quando: spell.zona.quando ?? 'fim',
      aoEntrar: spell.zona.aoEntrar ?? true,
      em: spell.zona.em ?? (spell.zona.cordao || spell.zona.glifo ? 'no' : 'na'),
      danoPorPasso: spell.zona.danoPorPasso ?? null,
      // Fome de Hadar: o dano de fim de turno, com os dados do círculo.
      fimDano: spell.zona.fimDano ? { ...spell.zona.fimDano, dados: dadosDaMagia(spell, { circulo, notacao: spell.zona.fimDano.dados }) } : null,
      // Névoa e Escuridão: o que a zona esconde (`rules/luz.js` lê isto).
      obscuro: spell.zona.obscuro ?? null,
      // Só esconde: não fere, não prende (a IA que desvia de zona não desvia dela).
      inofensiva: (!!spell.zona.obscuro || !!spell.zona.silencio || !!spell.zona.barraProjetil || !!spell.zona.luz || !!spell.zona.ilusao || !!spell.zona.cordao || !!spell.zona.glifo)
        && !dano && !spell.zona.fimDano && !spell.zona.danoPorPasso && !!spell.zona.semTeste,
      // Silêncio: ninguém conjura nem sofre trovão. Muralha de Vento: barra projétil de arma.
      silencio: !!spell.zona.silencio,
      barraProjetil: !!spell.zona.barraProjetil,
      // Lote 11: luz do dia, imagem de objeto, vegetação cerrada, chão que o voador não pisa.
      luz: spell.zona.luz ?? null,
      ilusao: !!spell.zona.ilusao,
      dificil4: !!spell.zona.dificil4,
      noChao: !!spell.zona.noChao,
      // Lote 12: flechas fincadas e runa explosiva (a runa é invisível para quem não é do lado do conjurador).
      cordao: spell.zona.cordao ? {
        ...spell.zona.cordao,
        flechas: spell.zona.cordao.flechas + (spell.upcast?.flechas ?? 0) * Math.max(0, circulo - spell.level),
        bonus: this.bonusDeFlecha(actor),
      } : null,
      glifo: spell.zona.glifo ? {
        ...spell.zona.glifo,
        dados: dadosDaMagia(spell, { circulo, notacao: spell.damage }),
        tipo: tipo ?? spell.damageType,
      } : null,
      // Círculo Mágico: o tipo de criatura que ele barra.
      circuloMagico: spell.zona.circuloMagico ? { tipo: tipo ?? 'morto-vivo' } : null,
      circulo,
      condRodadas: spell.onFail?.rounds ?? Infinity,
      imuneSe: spell.zona.imuneSe ?? null,
      spellId: spell.id,
      nome: spell.name,
      casas: new Set(casas.map((t) => key(t.x, t.y))),
      cd,
      save: spell.save,
      condition: spell.zona.semTeste ? null : spell.onFail?.condition ?? 'caido',
      lado: actor.side,
      rodadas: spell.zona.rodadas,
    };
    this.zonas.push(zona);
    this.atualizarDificeis();
    if (zona.circuloMagico) this.say('magia', `Um círculo de proteção se fecha em ${zona.casas.size} casas: ${zona.circuloMagico.tipo} não entra, ataca com desvantagem e não enfeitiça nem amedronta quem está dentro.`);
    // Luz do Dia: dissipa a escuridão mágica de círculo 3 ou menor que ela toca.
    if (zona.luz) this.luzDissipaEscuridao(zona);
    this.onEvent({ type: 'zona', zona });
    return zona;
  }

  /** A luz do dia acaba com a escuridão mágica (círculo ≤ 3) que se sobrepõe a ela. */
  luzDissipaEscuridao(luz) {
    for (const z of [...this.zonas]) {
      if (z === luz || z.obscuro !== 'magica' || (z.circulo ?? 1) > 3) continue;
      if (![...z.casas].some((k) => luz.casas.has(k))) continue;
      this.say('magia', `A luz do dia dissipa ${z.nome}.`);
      const dono = this.combatants.find((c) => c.concentrating?.zona === z);
      if (dono) this.dropConcentration(dono); else this.desfazerZona(z);
    }
  }

  // ---- ilusões (Ilusão Menor, Força Fantasmagórica) -------------------------

  /** O bônus de Investigação (INT) de quem examina uma ilusão. */
  bonusDeInvestigacao(c) {
    return abilityMod(c.abilities?.int ?? 10) + (c.skills?.includes('investigacao') ? proficiencyBonus(c.level ?? 2) : 0);
  }

  /** As imagens de Ilusão Menor (do outro lado) coladas em `c` — as que ele pode examinar. */
  ilusoesAoAlcance(c) {
    return this.zonas.filter((z) => z.ilusao && z.lado !== c.side && [...z.casas].some((k) => {
      const [x, y] = k.split(',').map(Number);
      return distanceFt(c.pos, { x, y }) <= 5;
    }));
  }

  /** Gasta a ação para examinar uma Ilusão Menor colada em `actor`. */
  examinarIlusao(actor, zona = null) {
    const alvo = zona ?? this.ilusoesAoAlcance(actor)[0];
    if (!alvo || !alvo.ilusao) return { ok: false, why: 'não há imagem ao lado' };
    if (alvo.lado === actor.side) return { ok: false, why: 'você já sabe que é uma ilusão' };
    if (actor.actionUsed) return { ok: false, why: 'a ação deste turno já foi usada' };
    if (conditionEffects(actor).incapacitated) return { ok: false, why: 'incapacitado' };
    actor.actionUsed = true;
    const r = this.testeDeAtributo(actor, 'int', this.bonusDeInvestigacao(actor), 'Investigação');
    const conta = `${r.conta} vs CD ${alvo.cd}`;
    if (r.total >= alvo.cd) {
      this.say('acao', `${actor.name} examina a imagem e vê que é só uma ilusão.`, conta);
      this.desfazerZona(alvo);
    } else {
      this.say('acao', `${actor.name} examina a imagem e não vê nada de errado.`, conta);
    }
    this.afterAction(actor);
    return { ok: true };
  }

  /** Força Fantasmagórica: gasta a ação num teste de Investigação para desfazer a ilusão. */
  investigarIlusao(actor) {
    const il = getCondition(actor, 'iludido');
    if (!il) return { ok: false, why: 'não está iludido' };
    if (actor.actionUsed) return { ok: false, why: 'a ação deste turno já foi usada' };
    if (conditionEffects(actor).incapacitated) return { ok: false, why: 'incapacitado' };
    actor.actionUsed = true;
    const cd = il.data?.dc ?? 10;
    const r = this.testeDeAtributo(actor, 'int', this.bonusDeInvestigacao(actor), 'Investigação');
    const conta = `${r.conta} vs CD ${cd}`;
    if (r.total >= cd) {
      removeCondition(actor, 'iludido');
      this.say('acao', `${actor.name} examina a ilusão e vê que não é real.`, conta);
      this.soltouDaConcentracao(actor, 'iludido');
    } else {
      this.say('acao', `${actor.name} examina a ilusão e ainda acredita nela.`, conta);
    }
    this.afterAction(actor);
    return { ok: true };
  }

  /** Força Fantasmagórica: no início do turno, a ilusão fere 1d6 psíquico. */
  ilusaoTick(c) {
    const il = getCondition(c, 'iludido');
    if (!il || c.dead) return;
    const dono = this.combatants.find((x) => x.id === il.source);
    const r = damageRoll(this.rng, '1d6');
    this.say('magia', `A ilusão fere ${c.name}: ${r.total} psíquico.`, `1d6[${r.rolls.join('+')}]`);
    this.applyDamage(c, r.total, 'psíquico', dono ?? null, { magico: true });
  }

  // ---- lote 12: glifo, cordão de flechas, rastro, queda suave, contramágica ----

  /**
   * Glifo de Proteção e Cordão de Flechas: o que acontece quando `c` chega a uma
   * casa nova (andando ou empurrado). Devolve true se disparou um glifo.
   */
  gatilhosDeArmadilha(c, from) {
    let glifo = false;
    for (const z of [...this.zonas]) {
      if (c.dead || !z.glifo || z.lado === c.side) continue;
      if (this.zonasEm(c.pos).includes(z) && !this.zonasEm(from).includes(z)) {
        this.explodirGlifo(z, c);
        glifo = true;
      }
    }
    this.cordaoAoEntrar(c, from);
    return glifo;
  }

  /** A runa explode numa esfera: DES ou o dano inteiro, metade se passar, aliados também. A runa some. */
  explodirGlifo(zona, gatilho) {
    this.zonas = this.zonas.filter((z) => z !== zona);
    this.atualizarDificeis();
    const dono = this.combatants.find((c) => c.id === zona.dono) ?? null;
    const g = zona.glifo;
    this.say('magia', `${gatilho.name} pisa no Glifo de Proteção: a runa explode em ${g.tipo}!`);
    const casas = this.field.within(zona.centro, g.raioFt).filter((t) => this.field.hasLineOfSight(zona.centro, t));
    this.onEvent({ type: 'glifo', zona, gatilho, areaTiles: casas, tipo: g.tipo });
    const r = damageRoll(this.rng, g.dados);
    const pegos = [...new Set(casas.map((t) => this.at(t.x, t.y)))].filter((c) => c && !c.dead);
    for (const c of pegos) {
      const save = this.resistencia(c, g.save, zona.cd);
      const amount = save.success ? Math.floor(r.total / 2) : r.total;
      const rr = this.explicarResistencia(c, g.save, zona.cd, save, { contra: 'Glifo de Proteção', seSucesso: 'metade do dano' });
      this.say('magia', `${c.name} ${save.success ? 'resiste' : 'falha'} contra o Glifo e sofre ${amount} de ${g.tipo}.`,
        `${rr.conta} · ${g.dados}[${r.rolls.join('+')}]${save.success ? ` → metade = ${amount}` : ''}`, { rolagem: rr });
      this.applyDamage(c, amount, g.tipo, dono, { magico: true });
    }
  }

  /** Cordão de Flechas: quem entra a até 9 m do ponto (pela 1ª vez no turno) leva uma flecha. */
  cordaoAoEntrar(c, from) {
    for (const z of [...this.zonas]) {
      if (!z.cordao || z.lado === c.side || c.dead || z.cordao.flechas <= 0) continue;
      const raio = z.cordao.raioFt;
      if (distanceFt(z.centro, c.pos) > raio || distanceFt(z.centro, from) <= raio) continue;
      c.aurasNoTurno ??= [];
      const marca = `f${z.id}`;
      if (c.aurasNoTurno.includes(marca)) continue;
      c.aurasNoTurno.push(marca);
      this.flechaDoCordao(z, c, 'entra no alcance do');
    }
  }

  /** Cordão de Flechas: quem termina o turno a até 9 m do ponto leva uma flecha. */
  cordaoNoFimDoTurno(c) {
    for (const z of [...this.zonas]) {
      if (!z.cordao || z.lado === c.side || c.dead || z.cordao.flechas <= 0) continue;
      if (distanceFt(z.centro, c.pos) <= z.cordao.raioFt) this.flechaDoCordao(z, c, 'termina o turno no alcance do');
    }
  }

  /** Uma flecha do cordão atinge `alvo`: resistência de DES contra a CD da magia, 1d6 perfurante; passou, nada. */
  flechaDoCordao(zona, alvo, porque) {
    const dono = this.combatants.find((c) => c.id === zona.dono) ?? null;
    const k = zona.cordao;
    k.flechas -= 1;
    const save = this.resistencia(alvo, 'dex', zona.cd);
    const rr = this.explicarResistencia(alvo, 'dex', zona.cd, save, { contra: 'Cordão de Flechas', seSucesso: 'nenhum dano' });
    if (!save.success) {
      const d = damageRoll(this.rng, k.dano);
      this.say('magia', `${alvo.name} ${porque} Cordão de Flechas e falha: uma flecha o acerta, ${d.total} de ${k.tipo}.`, `${rr.conta} · ${k.dano}[${d.rolls.join('+')}]`, { rolagem: rr });
      this.onEvent({ type: 'cordao', zona, alvo, acertou: true, restam: k.flechas });
      this.applyDamage(alvo, d.total, k.tipo, dono, { magico: true });
    } else {
      this.say('magia', `${alvo.name} ${porque} Cordão de Flechas e se esquiva: a flecha erra.`, rr.conta, { rolagem: rr });
      this.onEvent({ type: 'cordao', zona, alvo, acertou: false, restam: k.flechas });
    }
    if (k.flechas <= 0) {
      this.say('magia', 'As flechas do Cordão acabaram: a magia se desfaz.');
      this.zonas = this.zonas.filter((z) => z !== zona);
      this.atualizarDificeis();
    }
  }

  /**
   * Passo sem Rastro: o véu anda com quem o conjurou. Dá a condição a quem está a
   * até 9 m dele e tira de quem se afastou. Roda no começo do turno, depois de
   * qualquer movimento e na conjuração.
   */
  renovarRastro() {
    for (const dono of this.combatants) {
      const conc = dono.concentrating;
      if (!conc || conc.spellId !== 'passoSemRastro') continue;
      const raio = getSpell('passoSemRastro').raioFt;
      const com = [];
      for (const c of this.combatants) {
        if (c.side !== dono.side || c.dead) continue;
        const perto = !dono.dead && distanceFt(dono.pos, c.pos) <= raio;
        const tem = getCondition(c, 'semRastro')?.source === dono.id;
        if (perto) {
          if (conc.dissipados?.includes(c.id)) continue;
          if (!tem) addCondition(c, 'semRastro', { source: dono.id, magia: { id: 'passoSemRastro', circulo: conc.circulo ?? 2 } });
          com.push(c);
        } else if (tem) {
          removeCondition(c, 'semRastro');
          this.say('condicao', `${c.name} se afasta demais de ${dono.name} e perde o Passo sem Rastro.`);
        }
      }
      conc.targets = com;
    }
  }

  /**
   * Queda Suave: quando criaturas caem (o Voo acaba), quem tem a magia pronta e
   * um espaço livre, a até 18 m e à vista, faz até 5 delas descerem sem dano e
   * de pé. As outras caem como sempre (`cair`).
   */
  quedaDe(lista, dados = '1d6') {
    const caindo = lista.filter((c) => !c.dead);
    if (!caindo.length) return;
    // Quem já não sofreria dano (Graça do Gato) não precisa da magia.
    const precisam = caindo.filter((c) => getCondition(c, 'aprimorado')?.data?.opcao !== 'gato');
    const lado = caindo[0].side;
    let protegidos = [];
    let reator = null;
    let pode = null;
    for (const r of this.combatants) {
      if (r.side !== lado) continue;
      const p = this.podeReagirCom(r, 'quedaSuave');
      if (!p) continue;
      const alvos = precisam
        .filter((c) => c === r || (distanceFt(r.pos, c.pos) <= p.spell.rangeFt && this.field.hasLineOfSight(r.pos, c.pos)))
        .sort((a, b) => distanceFt(r.pos, a.pos) - distanceFt(r.pos, b.pos))
        .slice(0, p.spell.alvosDaQueda);
      if (alvos.length) { reator = r; pode = p; protegidos = alvos; break; }
    }
    if (reator) {
      reator.reactionUsed = true;
      reator.spellcasting.slots[pode.circulo] -= 1;
      this.say('magia', `${reator.name} conjura Queda Suave (reação): ${protegidos.map((c) => c.name).join(', ')} desce${protegidos.length > 1 ? 'm' : ''} devagar, sem dano.`);
      this.onEvent({ type: 'spell', caster: reator, spell: pode.spell, target: protegidos[0], point: protegidos[0].pos, circulo: pode.circulo, buffTargets: protegidos });
    }
    for (const c of caindo) {
      if (protegidos.includes(c)) this.onEvent({ type: 'pousou', target: c });
      else this.cair(c, dados);
    }
  }

  /**
   * Contramágica: quando `conjurador` vai conjurar uma magia de 1º círculo ou
   * maior, um inimigo a até 18 m que o veja, com a magia pronta, a reação e um
   * espaço de 3º círculo ou maior, tenta interrompê-la. Devolve true se a magia
   * foi anulada. O espaço do conjurador já está gasto.
   */
  tentarContramagia(conjurador, spell, slot) {
    if (spell.level === 0 || this.reagindo) return false;
    for (const r of this.combatants) {
      if (r.side === conjurador.side || r.side === 'neutro' || r.dead) continue;
      const p = this.podeReagirCom(r, 'contramagia');
      if (!p) continue;
      if (distanceFt(r.pos, conjurador.pos) > p.spell.rangeFt || !this.field.hasLineOfSight(r.pos, conjurador.pos)) continue;
      // O menor espaço que já interrompe a magia sozinho; senão, o menor que houver.
      const slots = r.spellcasting.slots;
      let usa = null;
      for (let n = Math.max(p.spell.level, slot); n < slots.length; n++) if (slots[n] > 0) { usa = n; break; }
      const auto = usa !== null;
      // Precisa de teste: gasta o MENOR espaço que a Contramágica aceita (círculo 3 ou mais).
      if (!auto) for (let n = p.spell.level; n < slots.length; n++) if (slots[n] > 0) { usa = n; break; }
      r.reactionUsed = true;
      slots[usa] -= 1;
      this.say('magia', `${conjurador.name} vai conjurar ${spell.name}${slot > spell.level ? ` no ${slot}º círculo` : ''}, mas ${r.name} responde com Contramágica (reação).`);
      this.onEvent({ type: 'spell', caster: r, spell: p.spell, target: conjurador, point: conjurador.pos, circulo: usa });
      let ok = auto;
      if (!auto) {
        const cd = 10 + slot;
        const t = this.testeDeAtributo(r, r.spellcasting.ability, spellMod(r));
        ok = t.total >= cd;
        this.say('magia', `${r.name} tenta interromper uma magia de ${slot}º círculo com um espaço de ${usa}º: ${ok ? 'consegue' : 'não consegue'}.`, `${t.conta} vs CD ${cd}`);
      }
      if (ok) {
        this.say('magia', `${spell.name} de ${conjurador.name} se desfaz, e o espaço de magia se perde.`);
        this.onEvent({ type: 'anulada', caster: conjurador, spell });
        return true;
      }
      return false;
    }
    return false;
  }

  /** O tipo de dano do Glifo de Proteção: o pedido, ou o que mais fere os inimigos (trovejante no empate). */
  tipoDoGlifo(opcao, actor) {
    const tipos = ['trovejante', 'ácido', 'frio', 'fogo', 'elétrico'];
    if (tipos.includes(opcao)) return opcao;
    // Sem escolha: o que mais fere os inimigos à vista; empatando, trovejante.
    const inimigos = this.enemiesOf(actor);
    const dano = (t) => inimigos.reduce((s, e) => s + this.danoPorTipo(e, 10, t, true), 0);
    return [...tipos].sort((a, b) => dano(b) - dano(a))[0];
  }

  /** O bônus de ataque à distância com arma de quem conjura o Cordão de Flechas; sem arma de longe, o ataque mágico. */
  bonusDeFlecha(actor) {
    const arco = (actor.weapons ?? []).find((w) => WEAPONS[w]?.ranged);
    return arco ? this.weaponAttackProfile(actor, arco).bonus : spellAttackBonus(actor);
  }

  // ---- voo --------------------------------------------------------------------

  /** O voador perde o voo: cai (1d6 contundente, o jogo supõe ~3 m) e fica caído. */
  cair(c, dados = '1d6') {
    if (c.dead) return;
    const gato = getCondition(c, 'aprimorado')?.data?.opcao === 'gato';
    if (gato) {
      this.say('condicao', `${c.name} cai de pé, leve como um gato: sem dano.`);
      return;
    }
    const r = damageRoll(this.rng, dados);
    this.say('condicao', `${c.name} deixa de ${dados === '1d6' ? 'voar' : 'levitar'} e cai: ${r.total} contundente.`, `${dados}[${r.rolls.join('+')}]`);
    this.applyDamage(c, r.total, 'contundente', null);
    if (!c.dead && !hasCondition(c, 'inconsciente')) addCondition(c, 'caido');
    this.onEvent({ type: 'caiu', target: c });
  }

  /** Aprimorar Atributo: o atributo pedido ou, sem pedido, o mais útil para o alvo. */
  opcaoDeAprimorar(alvo, pedido = null) {
    if (pedido && APRIMORAR[pedido]) return pedido;
    const preso = getCondition(alvo, 'agarrado') ?? getCondition(alvo, 'contido') ?? getCondition(alvo, 'presoPorVinhas');
    if (preso) {
      const soForca = String(preso.source ?? '').startsWith('zona:') || !!preso.data?.soForca;
      return !soForca && skillBonus(alvo, 'acrobacia') > skillBonus(alvo, 'atletismo') ? 'gato' : 'touro';
    }
    return 'urso';
  }

  /** Todas as zonas sob a criatura (Raio Lunar por cima da Teia: as duas valem). */
  zonasEm(pos) {
    if (!this.zonas.length) return [];
    const f = pos.f ?? 1;
    return this.zonas.filter((z) => {
      for (let dy = 0; dy < f; dy++) {
        for (let dx = 0; dx < f; dx++) if (z.casas.has(key(pos.x + dx, pos.y + dy))) return true;
      }
      return false;
    });
  }

  /** A primeira zona sob a criatura (qualquer casa da pegada dela). */
  zonaEm(pos) {
    if (!this.zonas.length) return null;
    const f = pos.f ?? 1;
    for (const z of this.zonas) {
      for (let dy = 0; dy < f; dy++) {
        for (let dx = 0; dx < f; dx++) if (z.casas.has(key(pos.x + dx, pos.y + dy))) return z;
      }
    }
    return null;
  }

  /** A zona que cobre esta casa (a primeira), para o Dissipar Magia. */
  zonaNoPonto(pos) {
    return this.zonas.find((z) => z.casas.has(key(pos.x, pos.y))) ?? null;
  }

  /** A zona some antes da hora (a concentração da Teia caiu): solta os presos. */
  desfazerZona(zona) {
    this.zonas = this.zonas.filter((z) => z !== zona);
    this.atualizarDificeis();
    for (const c of this.combatants) {
      for (const cond of [...(c.conditions ?? [])]) {
        // Quem a zona derrubou continua no chão: só o que prende solta.
        if (cond.source === `zona:${zona.id}` && cond.id !== 'caido') removeCondition(c, cond.id);
      }
    }
    this.say('magia', `${zona.em === 'no' ? 'O' : 'A'} ${zona.nome} se desfaz.`);
  }

  /** Teste contra a zona. Devolve true se ficou de pé. */
  resistirAZona(c, zona, porque) {
    if (zona.noChao && this.voaAgora(c)) return true;
    if (zona.dano) return this.danoDaZona(c, zona, porque);
    if (!zona.condition) return true;
    if (c.dead || hasCondition(c, 'inconsciente') || hasCondition(c, zona.condition)) return true;
    // Nuvem Fétida: quem é imune a veneno passa direto.
    if (zona.imuneSe && (c.immune?.includes(zona.imuneSe) || this.imuneACondicao(c, 'envenenado'))) return true;
    const save = this.resistencia(c, zona.save, zona.cd);
    const nome = CONDITIONS[zona.condition]?.name.toLowerCase() ?? zona.condition;
    const r = this.explicarResistencia(c, zona.save, zona.cd, save, {
      contra: `${zona.nome} (${c.name} ${porque} na área)`,
      seSucesso: `não fica ${nome}`,
    });
    if (save.success) {
      this.say('magia', `${c.name} ${porque} ${zona.em} ${zona.nome} e se equilibra.`, r.conta, { rolagem: r });
      return true;
    }
    this.aplicarCondicao(c, zona.condition, {
      source: `zona:${zona.id}`, rounds: zona.condRodadas, data: { escape: zona.cd },
      magia: { id: zona.spellId, circulo: zona.circulo ?? 1 },
    });
    // Nuvem Fétida: passa o turno engasgado, sem ação.
    if (CONDITIONS[zona.condition]?.perdeAcao) c.actionUsed = true;
    // Quem a teia prende entra na concentração de quem a conjurou.
    const dono = this.combatants.find((x) => x.id === zona.concentracao);
    if (dono?.concentrating?.zona === zona) dono.concentrating.targets.push(c);
    this.say('condicao', `${c.name} ${porque} ${zona.em} ${zona.nome}: fica ${nome}.`, r.conta, { rolagem: r });
    return false;
  }

  /** Zona que fere (Raio Lunar, Nuvem de Adagas): uma vez por turno de cada criatura. */
  danoDaZona(c, zona, porque) {
    if (c.dead) return true;
    c.aurasNoTurno ??= [];
    const marca = `z${zona.id}`;
    if (c.aurasNoTurno.includes(marca)) return true;
    c.aurasNoTurno.push(marca);
    const dono = this.combatants.find((x) => x.id === zona.dono);
    const r = damageRoll(this.rng, zona.dano.dados);
    let total = r.total;
    let conta = `${zona.dano.dados}[${r.rolls.join('+')}]`;
    if (zona.dano.save) {
      const save = this.resistencia(c, zona.dano.save, zona.cd);
      const rr = this.explicarResistencia(c, zona.dano.save, zona.cd, save, { contra: zona.nome, seSucesso: zona.dano.metade ? 'metade do dano' : 'nenhum dano' });
      if (save.success) total = zona.dano.metade ? Math.floor(total / 2) : 0;
      conta = `${rr.conta} · ${conta}`;
    }
    this.say('magia', `${c.name} ${porque} ${zona.em} ${zona.nome} e sofre ${total}${zona.dano.tipo ? ` de ${zona.dano.tipo}` : ''}.`, conta);
    this.applyDamage(c, total, zona.dano.tipo, dono ?? null, { magico: true });
    return true;
  }

  /** O dano de fim de turno de uma zona (Fome de Hadar): CD de DES ou o dano inteiro. */
  danoDeFimDaZona(c, zona) {
    const dono = this.combatants.find((x) => x.id === zona.dono);
    const r = damageRoll(this.rng, zona.fimDano.dados);
    let total = r.total;
    let conta = `${zona.fimDano.dados}[${r.rolls.join('+')}]`;
    if (zona.fimDano.save) {
      const save = this.resistencia(c, zona.fimDano.save, zona.cd);
      const rr = this.explicarResistencia(c, zona.fimDano.save, zona.cd, save, { contra: zona.nome, seSucesso: 'nenhum dano' });
      if (save.success) total = 0;
      conta = `${rr.conta} · ${conta}`;
    }
    this.say('magia', total
      ? `${c.name} termina o turno ${zona.em === 'no' ? 'no' : 'na'} ${zona.nome} e sofre ${total} de ${zona.fimDano.tipo}.`
      : `${c.name} termina o turno ${zona.em === 'no' ? 'no' : 'na'} ${zona.nome} e escapa do ${zona.fimDano.tipo}.`, conta);
    this.applyDamage(c, total, zona.fimDano.tipo, dono ?? null, { magico: true });
  }

  /** As casas de uma aura agora (ela anda com quem a conjurou). */
  casasDaAura(aura) {
    return this.field.within(aura.dono.pos, aura.raioFt).filter((t) => this.field.hasLineOfSight(aura.dono.pos, t));
  }

  /** As auras de inimigos de `c` que pegam a casa `pos`. */
  aurasHostisEm(c, pos) {
    if (!this.auras?.length) return [];
    return this.auras.filter((a) => !a.tipo && a.dono.side !== c.side && !a.dono.dead
      && distanceFt(a.dono.pos, pos) <= a.raioFt && this.field.hasLineOfSight(a.dono.pos, pos));
  }

  /** Casas que custam o dobro para `c`: as auras inimigas (metade do passo). */
  terrenoHostil(c) {
    if (!this.auras?.length) return null;
    const casas = new Set();
    for (const a of this.auras) {
      if (a.tipo || a.dono.side === c.side || a.dono.dead) continue;
      for (const t of this.casasDaAura(a)) casas.add(key(t.x, t.y));
    }
    return casas.size ? casas : null;
  }

  /** Espíritos Guardiões: teste e dano, uma vez por turno da criatura. */
  golpeDaAura(aura, c, porque) {
    c.aurasNoTurno ??= [];
    if (c.aurasNoTurno.includes(aura.id) || c.dead) return;
    c.aurasNoTurno.push(aura.id);
    const save = this.resistencia(c, aura.save, aura.cd);
    const dmg = damageRoll(this.rng, aura.dano);
    const amount = save.success ? (aura.halfOnSave ? Math.floor(dmg.total / 2) : 0) : dmg.total;
    const r = this.explicarResistencia(c, aura.save, aura.cd, save, {
      contra: `${aura.nome} de ${aura.dono.name}`,
      seSucesso: 'metade do dano',
    });
    this.say('magia', `${c.name} ${porque} entre os ${aura.nome} e sofre ${amount}.`, `${r.conta} · ${aura.dano}[${dmg.rolls.join('+')}]`, { rolagem: r });
    this.onEvent({ type: 'aura', aura, target: c });
    this.applyDamage(c, amount, aura.damageType, aura.dono, { magico: true });
  }

  /** A duração das zonas conta no fim do turno do lado de quem conjurou. */
  contarZonas(side) {
    const antes = this.zonas.length;
    this.zonas = this.zonas.filter((z) => {
      if (z.lado !== side) return true;
      z.rodadas -= 1;
      if (z.rodadas > 0) return true;
      this.say('magia', `${z.em === 'no' ? 'O' : 'A'} ${z.nome} se desfaz.`);
      for (const c of this.combatants) {
        for (const cond of [...(c.conditions ?? [])]) if (cond.source === `zona:${z.id}` && cond.id !== 'caido') removeCondition(c, cond.id);
      }
      return false;
    });
    if (this.zonas.length !== antes) this.atualizarDificeis();
  }

  /** Imunidade a condição do bloco (`contido` aparece também como 'imobilizado'). */
  imuneACondicao(alvo, id, fonte = null) {
    const lista = alvo.conditionImmunities ?? [];
    // Círculo Mágico: o tipo barrado não enfeitiça nem amedronta quem está dentro.
    if (fonte && ['enfeiticado', 'amedrontado', 'sugerido', 'hipnotizado', 'coroaDaLoucura'].includes(id) && this.circuloProtege(fonte, alvo)) return true;
    // Heroísmo tira qualquer medo; Proteção contra o Bem e o Mal, só o que
    // vem dos tipos dela.
    const porMagia = (alvo.conditions ?? []).some((c) => {
      const def = CONDITIONS[c.id];
      if (!def?.imuneA?.includes(id)) return false;
      return !def.contraTipos || def.contraTipos.includes(fonte?.tipo);
    });
    // Os blocos de monstro escrevem "enfeitiçado" e "imobilizado".
    const APELIDOS = { sugerido: 'enfeitiçado', hipnotizado: 'enfeitiçado', enfeiticado: 'enfeitiçado', coroaDaLoucura: 'enfeitiçado', contido: 'imobilizado', presoPorVinhas: 'imobilizado' };
    return porMagia || lista.includes(id) || lista.includes(APELIDOS[id]);
  }

  /** Multiplicador do custo de andar: 2 para quem está caído (rastejando). */
  custoDeMovimento(actor) {
    return hasCondition(actor, 'caido') ? 2 : 1;
  }

  /**
   * Levantar-se do chão custa metade do deslocamento (SRD). Sem esta ação, o
   * personagem que a mordida do lobo derrubava ficava caído o combate todo.
   */
  standUp(actor) {
    if (!hasCondition(actor, 'caido')) return { ok: false, why: 'já está de pé' };
    if (hasCondition(actor, 'inconsciente') || conditionEffects(actor).incapacitated) {
      return { ok: false, why: 'incapacitado não se levanta' };
    }
    const custo = Math.ceil(this.speedOf(actor) / 2);
    if (this.speedOf(actor) === 0 || actor.movementLeftFt < custo) {
      return { ok: false, why: `levantar custa ${custo} pés de deslocamento` };
    }
    actor.movementLeftFt -= custo;
    removeCondition(actor, 'caido');
    this.say('acao', `${actor.name} se levanta (${custo} pés de deslocamento).`);
    this.onEvent({ type: 'standUp', actor });
    return { ok: true };
  }

  /** De pé de graça, fora do combate (quem está acordado). */
  levantarForaDoCombate(c) {
    if (c.dead || !hasCondition(c, 'caido') || hasCondition(c, 'inconsciente')) return;
    removeCondition(c, 'caido');
    this.onEvent({ type: 'standUp', actor: c });
  }

  // ---- as armas nas mãos ----------------------------------------------------

  /**
   * As armas que o personagem EMPUNHA: a da mão principal e a da secundária.
   * Só com elas se ataca (Livro do Jogador): a espada na mochila não corta.
   * Monstro ataca pelo bloco e não passa por aqui.
   */
  armasNaMao(c) {
    if (c.attacks) return [];
    return [...new Set([c.equippedWeapon, c.offhandWeapon].filter((id) => id && WEAPONS[id]))];
  }

  /** Pode atacar com esta arma agora? Os punhos (Brigão de Taverna) estão sempre à mão. */
  empunha(c, weaponId) {
    if (c.attacks || !weaponId) return true;
    return this.armasNaMao(c).includes(weaponId) || !!WEAPONS[weaponId]?.props?.includes('desarmado');
  }

  /**
   * O que custa mexer numa arma agora. Sacar ou guardar uma arma é a
   * interação gratuita do turno; a segunda, no mesmo turno, gasta a ação
   * (Usar um Objeto). Fora do combate é de graça. `null` = não dá.
   */
  custoDeInteracao(c) {
    if (this.over || this.explorando) return 'livre';
    if (!c.interacaoUsada) return 'interacao';
    if (!c.actionUsed) return 'acao';
    return null;
  }

  cobrarInteracao(c, custo) {
    if (custo === 'interacao') c.interacaoUsada = true;
    else if (custo === 'acao') {
      c.actionUsed = true;
      // A ação gasta assim é uma ação como outra: o Surto e a Velocidade
      // devolvem a deles aqui também.
      this.afterAction(c);
    }
  }

  /**
   * Troca a arma da mão principal por outra que ele carrega. A que sai volta
   * para a bainha; a ficha e o desenho seguem o que está na mão.
   */
  sacarArma(actor, weaponId) {
    if (actor.attacks) return { ok: false, why: 'esta criatura ataca pelo bloco' };
    if (!(actor.weapons ?? []).includes(weaponId)) return { ok: false, why: 'não carrega essa arma' };
    if (actor.equippedWeapon === weaponId) return { ok: false, why: 'essa arma já está na mão' };
    if (conditionEffects(actor).incapacitated) return { ok: false, why: 'incapacitado não age' };
    const custo = this.custoDeInteracao(actor);
    if (!custo) return { ok: false, why: 'a interação gratuita e a ação deste turno já foram usadas' };
    const r = equipar(actor, 'maoPrincipal', weaponId);
    if (!r.ok) return r;
    this.cobrarInteracao(actor, custo);
    const como = custo === 'interacao' ? 'interação gratuita' : custo === 'acao' ? 'gasta a ação' : null;
    this.say('acao', `${actor.name} saca ${WEAPONS[weaponId].name}.`, como);
    this.onEvent({ type: 'armaTrocada', actor });
    return { ok: true, custo };
  }

  // ---- o salto ----------------------------------------------------------------

  /**
   * Quantos pés o salto em distância alcança (Livro do Jogador): a Força em
   * pés com 3 m de corrida antes, metade parado. O salto conta no
   * deslocamento, então não passa do que sobra dele.
   */
  alcanceDoSalto(actor) {
    // Na exploração não há turno: conta como quem pega corrida.
    const correu = this.explorando || (actor.corridaFt ?? 0) >= 10;
    const forca = actor.abilities?.str ?? 10;
    // Salto (magia): a distância triplica.
    const mult = hasCondition(actor, 'saltoTriplo') ? 3 : 1;
    return Math.min((correu ? forca : Math.floor(forca / 2)) * mult, actor.movementLeftFt ?? 0);
  }

  /**
   * As casas onde o salto pode cair, em linha reta (reta ou diagonal), por
   * cima do que barra o passo baixo: cobertura (a tocaia de ripas, o caixote,
   * a carroça), terreno difícil e buraco. Parede, árvore e casa são altas
   * demais; criatura no meio não se pula. Só vale se o salto atravessa algo:
   * salto em chão limpo é só andar.
   */
  destinosDoSalto(actor) {
    const out = new Map();
    if ((actor.pos.f ?? 1) !== 1 || hasCondition(actor, 'caido') || conditionEffects(actor).incapacitated) return out;
    if (this.speedOf(actor) === 0 || hasCondition(actor, 'agarrado') || hasCondition(actor, 'contido')) return out;
    const casas = Math.floor(this.alcanceDoSalto(actor) / 5);
    const { x: x0, y: y0 } = actor.pos;
    // As mesmas cercas do andar: a corrente do canil e o Duelo Compelido.
    const duelista = this.duelistaDe(actor);
    const podePousar = (x, y) => (!actor.corrente || distanceFt(actor.corrente, { x, y }) <= actor.corrente.raioFt)
      && (!duelista || distanceFt(duelista.pos, { x, y }) <= 30 || distanceFt(duelista.pos, { x, y }) <= distanceFt(duelista.pos, actor.pos));
    const h0 = this.field.heightAt(x0, y0);
    // Com a magia Salto o salto pode pousar um nível acima do de partida e passa por cima de buraco
    // (o fosso do corredor é um desnível que, a pé, barra o passo).
    const magico = hasCondition(actor, 'saltoTriplo');
    const sobe = magico ? 1 : 0;
    const fundo = new Set(['fosso', 'poco', 'cisterna']);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      let atravessa = false;
      for (let n = 1; n <= casas; n++) {
        const x = x0 + dx * n;
        const y = y0 + dy * n;
        const t = this.field.tileAt(x, y);
        const h = this.field.heightAt(x, y);
        const buraco = magico && fundo.has(this.field.surfaceAt(x, y));
        if (t === 1 || (h > h0 + sobe && !buraco)) break;
        const quem = this.at(x, y);
        const pousa = n >= 2 && atravessa && !quem && h >= h0 - 1 && podePousar(x, y)
          && (t === 0 || (t === 2 && !fundo.has(this.field.surfaceAt(x, y))));
        if (pousa) out.set(key(x, y), { x, y, cost: n * 5, salto: true });
        if (quem) break;
        if (t === 2 || t === 3 || buraco || this.dificilParaPouso(actor, x, y)) atravessa = true;
      }
    }
    return out;
  }

  /** Terreno difícil para quem pousa: o do mapa e o das zonas (Graxa, Espinhos). */
  dificilParaPouso(actor, x, y) {
    const k = key(x, y);
    return this.field.tileAt(x, y) === 2 || !!this.field.dificeis?.has(k) || !!this.field.dificeis4?.has(k)
      || !!this.terrenoHostil(actor)?.has?.(k);
  }

  /**
   * Salta até `dest`. Por cima de obstáculo (cobertura): Atletismo CD 10, e
   * quem falha bate nele e cai na casa de antes. Pousar em terreno difícil:
   * Acrobacia CD 10, ou cai. Sair do alcance de alguém provoca o ataque de
   * oportunidade como andar.
   */
  pular(actor, dest) {
    const alvo = this.destinosDoSalto(actor).get(key(dest.x, dest.y));
    if (!alvo) return { ok: false, why: 'não dá para saltar até lá' };
    const origin = { ...actor.pos };
    const dx = Math.sign(dest.x - origin.x);
    const dy = Math.sign(dest.y - origin.y);
    const n = alvo.cost / 5;
    const threats = actor.disengaging ? [] : this.enemiesOf(actor).filter(
      (e) => !e.reactionUsed && !conditionEffects(e).incapacitated
        && this.armaDeOportunidade(e) !== undefined
        && distanceFt(e.pos, origin) <= this.reachOf(e)
        && distanceFt(e.pos, dest) > this.reachOf(e),
    );
    for (const t of threats) {
      this.opportunityAttack(t, actor);
      if (actor.dead || hasCondition(actor, 'inconsciente')) return { ok: true };
    }
    // Onde ele de fato para: o primeiro obstáculo que não passar o barra.
    let fim = n;
    let caiu = false;
    for (let i = 1; i < n; i++) {
      const x = origin.x + dx * i;
      const y = origin.y + dy * i;
      if (this.field.tileAt(x, y) !== 3) continue;
      const r = this.testeDeAtributo(actor, 'str', skillBonus(actor, 'atletismo'), 'Atletismo');
      if (r.total >= 10) {
        this.say('acao', `${actor.name} salta por cima do obstáculo.`, `${r.conta} vs CD 10`);
        continue;
      }
      this.say('acao', `${actor.name} bate no obstáculo e cai.`, `${r.conta} vs CD 10`);
      fim = i - 1;
      caiu = true;
      break;
    }
    actor.pos = { x: origin.x + dx * fim, y: origin.y + dy * fim, f: 1 };
    if (!caiu && this.dificilParaPouso(actor, actor.pos.x, actor.pos.y)) {
      const r = this.testeDeAtributo(actor, 'dex', skillBonus(actor, 'acrobacia'), 'Acrobacia');
      if (r.total < 10) {
        caiu = true;
        this.say('acao', `${actor.name} pousa mal no terreno difícil e cai.`, `${r.conta} vs CD 10`);
      }
    }
    if (caiu) addCondition(actor, 'caido');
    else this.say('acao', `${actor.name} salta ${n * 5} pés.`);
    // O salto conta no deslocamento: paga o que voou, ao menos uma casa.
    const gasto = Math.max(fim, 1) * 5;
    actor.movementLeftFt = Math.max(0, actor.movementLeftFt - gasto);
    actor.corridaFt = 0;
    // A casa de pouso dispara o que andar até ela dispararia.
    for (const zona of this.zonasEm(actor.pos)) {
      if (zona.aoEntrar && !this.zonasEm(origin).includes(zona)) this.resistirAZona(actor, zona, 'entra');
    }
    this.paraNaCasa?.(actor, actor.pos);
    this.renovarRastro();
    const caminho = [];
    for (let i = 0; i <= fim; i++) caminho.push({ x: origin.x + dx * i, y: origin.y + dy * i });
    this.onEvent({ type: 'moved', actor, from: origin, to: { ...actor.pos }, path: caminho, salto: true });
    return { ok: true };
  }

  /**
   * Escapar de quem agarra: ação, teste de Atletismo ou Acrobacia (o melhor)
   * contra a CD do efeito.
   */
  escapar(actor) {
    const preso = getCondition(actor, 'agarrado') ?? getCondition(actor, 'contido') ?? getCondition(actor, 'presoPorVinhas');
    if (!preso) return { ok: false, why: 'não está preso' };
    if (actor.actionUsed) return { ok: false, why: 'a ação deste turno já foi usada' };
    if (actor.acaoLimitada) return { ok: false, why: 'a ação da Velocidade não serve para escapar' };
    if (conditionEffects(actor).incapacitated) return { ok: false, why: 'incapacitado' };
    actor.actionUsed = true;
    const cd = preso.data?.escape ?? preso.data?.dc ?? 10;
    const atl = skillBonus(actor, 'atletismo');
    const acr = skillBonus(actor, 'acrobacia');
    // Teia e Emaranhar: o livro pede Força, então só Atletismo.
    const soForca = String(preso.source ?? '').startsWith('zona:') || !!preso.data?.soForca;
    const [pericia, bonus] = soForca || atl >= acr ? ['Atletismo', atl] : ['Acrobacia', acr];
    const r = this.testeDeAtributo(actor, pericia === 'Atletismo' ? 'str' : 'dex', bonus, pericia);
    const conta = `${r.conta} vs CD ${cd}`;
    if (r.total >= cd) {
      removeCondition(actor, preso.id);
      this.say('acao', `${actor.name} se solta.`, conta);
      // As vinhas do Golpe Constritor somem com quem elas seguravam.
      if (preso.data?.vinhas) this.soltouDaConcentracao(actor, preso.id);
    } else {
      this.say('acao', `${actor.name} tenta se soltar e não consegue.`, conta);
    }
    this.afterAction(actor);
    return { ok: true };
  }

  /**
   * Levitação: quem flutua a 6 m não é alcançado em corpo a corpo por quem está
   * no chão, nem alcança quem está no chão. Quem voa (Voo) ou também levita
   * chega até ele.
   */
  separadosPelaAltura(a, b) {
    const alto = (c) => hasCondition(c, 'levitando');
    const aereo = (c) => alto(c) || hasCondition(c, 'voando');
    return (alto(a) && !aereo(b)) || (alto(b) && !aereo(a));
  }

  // ---- Círculo Mágico ---------------------------------------------------------

  /** As zonas de Círculo Mágico que valem contra o tipo de `c`. */
  circulosContra(c) {
    return (this.zonas ?? []).filter((z) => z.circuloMagico && z.circuloMagico.tipo === (c.tipo ?? 'humanoide'));
  }

  /** O círculo barra o tipo de quem anda — a menos que ele já esteja dentro dele. */
  circulosQueBarram(c) {
    return this.circulosContra(c).filter((z) => !this.pegadaEmZona(z, c.pos.x, c.pos.y, c.pos.f ?? 1));
  }

  /** Alguma casa da pegada (x, y, f×f) está na zona? */
  pegadaEmZona(z, x, y, f = 1) {
    for (let dy = 0; dy < f; dy++) for (let dx = 0; dx < f; dx++) if (z.casas.has(key(x + dx, y + dy))) return true;
    return false;
  }

  /** O alvo está dentro de um círculo que vale contra o tipo do atacante? */
  circuloProtege(atacante, alvo) {
    return this.circulosContra(atacante).some((z) => this.pegadaEmZona(z, alvo.pos.x, alvo.pos.y, alvo.pos.f ?? 1));
  }

  /** O tipo que o círculo barra: o pedido, ou o mais comum entre os inimigos da lista. */
  tipoDoCirculo(opcao, actor) {
    const validos = ['celestial', 'elemental', 'feérico', 'corruptor', 'morto-vivo'];
    if (validos.includes(opcao)) return opcao;
    const conta = new Map();
    for (const c of this.enemiesOf(actor)) if (validos.includes(c.tipo)) conta.set(c.tipo, (conta.get(c.tipo) ?? 0) + 1);
    return [...conta.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'morto-vivo';
  }

  reachOf(actor) {
    if (actor.attacks) return Math.max(...actor.attacks.filter((a) => !a.ranged).map((a) => a.reachFt ?? 5), 5);
    const w = WEAPONS[actor.equippedWeapon];
    return w && !w.ranged ? (w.reachFt ?? 5) : 5;
  }

  /**
   * Com o que este combatente dá ataque de oportunidade: o ataque de perto
   * do bloco (monstro) ou a arma de perto que ele empunha. `undefined` se não
   * tiver nenhum; `null` quer dizer "a arma equipada" (personagem).
   */
  armaDeOportunidade(c) {
    if (c.attacks) return c.attacks.find((a) => !a.ranged)?.name;
    const w = WEAPONS[c.equippedWeapon];
    if (w && !w.ranged) return null;
    // Só com o que está na mão (ou os punhos de quem treinou): o arqueiro de
    // arco na mão não aproveita a brecha com a espada embainhada.
    return this.armasNaMao(c).find((id) => !WEAPONS[id].ranged)
      ?? (c.weapons ?? []).find((id) => WEAPONS[id]?.props?.includes('desarmado'));
  }

  opportunityAttack(attacker, target) {
    attacker.reactionUsed = true;
    this.say('reacao', `${attacker.name} aproveita a brecha (ataque de oportunidade).`);
    this.resolveAttack(attacker, target, { opportunity: true, weaponId: this.armaDeOportunidade(attacker) });
  }

  // ---- vantagem / desvantagem ---------------------------------------------

  attackModifiers(attacker, target, { ranged = false, opportunity = false } = {}) {
    const atkFx = conditionEffects(attacker);
    const tgtFx = conditionEffects(target);
    // `mods` carrega as mesmas três chaves de antes (`advantage`,
    // `disadvantage`, `reasons`, na mesma ordem) mais as listas por lado e o
    // modo já fechado. Quem só lia as três continua lendo as três.
    const mods = modsVazios();

    if (atkFx.attackDisadvantage) fonte(mods, 'desvantagem', 'atacante prejudicado');
    // Toque Arrepiante: desvantagem só contra quem conjurou.
    if (getCondition(attacker, 'arrepiado')?.source === target.id) fonte(mods, 'desvantagem', 'toque arrepiante');
    if (getCondition(target, 'alvoCerteiro')?.source === attacker.id) fonte(mods, 'vantagem', 'ataque certeiro');
    // Duelo Compelido: só quem o desafiou é alvo sem desvantagem.
    const duelo = getCondition(attacker, 'duelo');
    if (duelo && duelo.source !== target.id) fonte(mods, 'desvantagem', 'duelo compelido');
    // Círculo Mágico: o tipo barrado ataca quem está dentro com desvantagem.
    if (this.circuloProtege(attacker, target)) fonte(mods, 'desvantagem', 'círculo mágico');
    // Invisível: ataca com vantagem e é atacado com desvantagem.
    // Visão verdadeira (o nothic): dentro do alcance dela, invisível não esconde.
    const ve = (quem, alvo) => (quem.senses?.truesightFt ?? 0) >= distanceFt(quem.pos, alvo.pos);
    if (hasCondition(attacker, 'invisivel') && !ve(target, attacker)) fonte(mods, 'vantagem', 'atacante invisível');
    if (hasCondition(target, 'invisivel') && !ve(attacker, target)) fonte(mods, 'desvantagem', 'alvo invisível');
    // Proteção contra o Bem e o Mal: certos tipos atacam o protegido com desvantagem.
    const protecao = (target.conditions ?? []).find((c) => CONDITIONS[c.id]?.contraTipos?.includes(attacker.tipo));
    if (protecao) fonte(mods, 'desvantagem', CONDITIONS[protecao.id].name.toLowerCase());
    // O aviso de armadura sem treino prometia um preço que ninguém cobrava: o
    // mago podia vestir cota de malha e ir de CA 12 para 16 de graça. Enquanto
    // nada desequipava, a promessa nunca era testada — o inventário novo a
    // testa, então o preço passa a existir.
    if (attacker.armorUntrained) fonte(mods, 'desvantagem', 'armadura sem treino');
    if (tgtFx.attackedAdvantage) fonte(mods, 'vantagem', 'alvo indefeso');
    if (tgtFx.attackedDisadvantage) fonte(mods, 'desvantagem', 'alvo esquivando');

    const close = distanceFt(attacker.pos, target.pos) <= 5;
    // Caído: quem ataca a até 1,5 m tem vantagem; de mais longe, desvantagem.
    // Conta a DISTÂNCIA, não o tipo de arma — um arco encostado tem vantagem.
    if (tgtFx.attackedAdvantageMelee) {
      fonte(mods, close ? 'vantagem' : 'desvantagem', close ? 'alvo caído e perto' : 'alvo caído e longe');
    }

    // Táticas de Matilha
    if (attacker.traits?.includes('packTactics')) {
      const helper = this.alliesOf(attacker).some(
        (a) => this.field.vizinhos(a.pos, target.pos) && !conditionEffects(a).incapacitated,
      );
      if (helper) fonte(mods, 'vantagem', 'táticas de matilha');
    }
    // Ataque à distância com inimigo colado
    if (ranged && !opportunity && this.enemiesOf(attacker).some(
      (e) => this.field.vizinhos(e.pos, attacker.pos) && !conditionEffects(e).incapacitated,
    )) {
      fonte(mods, 'desvantagem', 'inimigo adjacente');
    }
    // Escuridão: quem não vê o alvo erra mais; quem não é visto acerta mais.
    modificadoresDeLuz(this, attacker, target, mods, fonte);
    return mods;
  }

  /** Ataque furtivo do ladino: precisa de vantagem, ou aliado colado sem desvantagem. */
  sneakApplies(attacker, target, weapon, mods) {
    if (!attacker.features?.includes('sneakAttack') || attacker.sneakUsedThisTurn) return false;
    const usable = weapon?.ranged || weapon?.finesse;
    if (!usable) return false;
    if (mods.advantage && !mods.disadvantage) return true;
    if (mods.disadvantage) return false;
    return this.alliesOf(attacker).some((a) => this.field.vizinhos(a.pos, target.pos) && !hasCondition(a, 'inconsciente'));
  }

  // ---- ataques -------------------------------------------------------------

  weaponAttackProfile(actor, weaponId) {
    if (actor.attacks) {
      const atk = actor.attacks.find((a) => a.name === weaponId) ?? actor.attacks[0];
      return {
        name: atk.name, bonus: atk.bonus, damage: atk.damage, type: atk.type,
        ranged: !!atk.ranged, reachFt: atk.reachFt ?? 5,
        rangeFt: atk.rangeFt ?? 5, longRangeFt: atk.longRangeFt ?? atk.rangeFt ?? 5,
        onHit: atk.onHit ?? null, weapon: null, art: atk.art ?? null,
        danoExtra: atk.danoExtra ?? atk.extraDamage ?? null,
        recarga: recargaMinima(atk.recharge),
        // Bloco de criatura do SRD traz o bônus já somado, sem dizer quanto é
        // atributo e quanto é proficiência. Dizer "bloco da criatura" é honesto;
        // repartir em FOR e proficiência seria invenção nossa.
        bonusPartes: [{ rotulo: 'bloco da criatura', valor: atk.bonus }],
        // Acao por TESTE de resistencia (o Olhar Apodrecedor do nothic): sem
        // jogada de ataque; o alvo testa e, falhando, leva o dano.
        teste: atk.teste ?? null,
      };
    }
    const w0 = WEAPONS[weaponId ?? actor.equippedWeapon];
    // Shillelagh: a clava ou o bordão usa o atributo de conjuração, rola 1d8
    // e conta como mágico.
    const shillelagh = hasCondition(actor, 'shillelagh') && ['clava', 'bordao'].includes(weaponId ?? actor.equippedWeapon);
    const w = shillelagh ? { ...w0, damage: '1d8', raridade: w0.raridade ?? 'magia' } : w0;
    const ability = shillelagh ? actor.spellcasting.ability : weaponAbility(actor, w);
    const mod = abilityMod(actor.abilities[ability]);
    // Proficiência só soma com arma treinada (a categoria ou a arma em si).
    // Sem lista de treino declarada (NPC antigo), vale o que vinha antes.
    const idDaArma = weaponId ?? actor.equippedWeapon;
    const treinada = !actor.weaponTraining
      || actor.weaponTraining.includes(w.categoria) || actor.weaponTraining.includes(idDaArma);
    const prof = treinada ? actor.proficiency : 0;
    // Arma mágica (Talon, Lightbringer, Hew): +X no ataque e no dano, e o dano
    // extra no mesmo formato do dos monstros.
    // Arma Mágica e Arma Elemental: +1 no ataque e no dano, e conta como mágica.
    const porMagia = (actor.conditions ?? []).reduce((t, c) => t + (c.data?.bonusArma ?? CONDITIONS[c.id]?.bonusArma ?? 0), 0);
    const magia = (w.bonusAtaque ?? 0) + porMagia;
    const noDano = mod + (w.bonusDano ?? 0) + porMagia;
    return {
      name: w.name,
      bonus: mod + prof + magia,
      damage: `${w.damage}${noDano >= 0 ? '+' : ''}${noDano}`,
      danoExtra: w.danoExtra ?? null,
      type: w.type,
      ranged: !!w.ranged,
      reachFt: w.reachFt ?? 5,
      rangeFt: w.ranged ? w.rangeFt : (w.reachFt ?? 5),
      longRangeFt: w.ranged ? w.longRangeFt : (w.reachFt ?? 5),
      onHit: null,
      weapon: w,
      art: w.art ?? null,
      // Arma de acuidade escolhe o melhor entre FOR e DES: nomear o atributo
      // que ENTROU é a única forma de o jogador ver a escolha acontecendo.
      bonusPartes: [
        { rotulo: ABILITY_NAME[ability], valor: mod },
        ...(prof ? [{ rotulo: 'proficiência', valor: prof }] : []),
        ...(magia ? [{ rotulo: 'arma mágica', valor: magia }] : []),
      ],
    };
  }

  canAttack(actor, target, weaponId) {
    if (!actor.attacks) {
      const id = weaponId ?? actor.equippedWeapon;
      if (!WEAPONS[id]) return { ok: false, why: 'sem arma na mão — saque uma' };
      if (!this.empunha(actor, id)) return { ok: false, why: `${WEAPONS[id].name} não está na mão — saque a arma primeiro` };
    }
    if (hasCondition(actor, 'etereo') || hasCondition(target, 'etereo')) return { ok: false, why: 'está no Plano Etéreo' };
    const p = this.weaponAttackProfile(actor, weaponId);
    // Acao por teste (o Olhar Apodrecedor) mira 'uma criatura que ele possa ver'.
    if (p.teste && hasCondition(actor, 'cego')) return { ok: false, why: 'cego, não vê o alvo' };
    if (p.recarga && actor.recarregando?.[p.name]) return { ok: false, why: `${p.name} ainda está recarregando` };
    const dist = distanceFt(actor.pos, target.pos);
    // Parede de borda: a 1,5 m, mas do outro lado do muro.
    if (!p.ranged && !this.field.contato(actor.pos, target.pos)
      && (dist <= FEET_PER_SQUARE || !this.field.hasLineOfSight(actor.pos, target.pos))) {
      return { ok: false, why: 'há uma parede no meio' };
    }
    if (dist > p.longRangeFt) {
      const limite = p.ranged ? p.longRangeFt : p.reachFt;
      return { ok: false, why: `fora de alcance — ${dist} pés, ${p.name} alcança ${limite}` };
    }
    // Levitação: a 6 m do chão, só à distância.
    if (!p.ranged && p.reachFt < 25 && this.separadosPelaAltura(actor, target)) {
      return { ok: false, why: 'um deles levita a 6 m do chão — corpo a corpo não alcança, só ataque à distância' };
    }
    if (p.ranged && !this.field.hasLineOfSight(actor.pos, target.pos)) {
      return { ok: false, why: 'sem linha de visão até o alvo' };
    }
    return { ok: true, profile: p, longRange: p.ranged && dist > p.rangeFt };
  }

  resolveAttack(attacker, target, { weaponId = null, opportunity = false, disadvantage = false } = {}) {
    // O chefe pode jogar um capanga na frente antes de a rolagem acontecer.
    target = this.tryRedirect(target);
    const check = this.canAttack(attacker, target, weaponId);
    if (!check.ok) {
      this.say('aviso', `${attacker.name} não consegue atacar: ${check.why}.`);
      return null;
    }
    let p = check.profile;
    // A figura mostra a arma do golpe: o hobgoblin de espada e escudo pega o
    // arco para atirar e volta à espada no corpo a corpo (`aparencias` do
    // bloco). Aqui, e não na ação de Ataque, para valer também na reação.
    if (attacker.aparencias) {
      attacker.lookBase ??= attacker.look;
      attacker.look = attacker.aparencias[p.name] ?? attacker.lookBase;
    }
    if (getCondition(attacker, 'enfeiticado')?.source === target.id) {
      this.say('aviso', `${attacker.name} está encantado por ${target.name} e não o ataca.`);
      return null;
    }
    // Acalmar Emoções: atacar (acerte ou erre) tira a indiferença de quem é
    // alvo e de quem o vê (ver `acordaIndiferentes`).
    this.acordaIndiferentes(target, attacker);
    // Santuário: quem ataca o protegido testa SAB antes; quem está protegido
    // e ataca perde a proteção.
    if (!this.passaPeloSantuario(attacker, target)) return null;
    if (hasCondition(attacker, 'santuario')) {
      removeCondition(attacker, 'santuario');
      this.say('magia', `${attacker.name} ataca e perde o Santuário.`);
    }
    // Sem jogada de ataque: o alvo testa a resistencia (Olhar Apodrecedor).
    if (p.teste) {
      this.quebraInvisibilidade(attacker);
      const t = p.teste;
      const r = this.resistencia(target, t.save, t.dc);
      const conta = `${ABILITY_NAME[t.save] ?? t.save} ${r.total} vs CD ${t.dc}`;
      let dano = 0;
      if (!r.success) {
        dano = damageRoll(this.rng, p.damage).total;
        this.say('ataque', `${attacker.name} usa ${p.name} em ${target.name}: ${dano} de dano ${p.type}.`, conta);
        this.applyDamage(target, dano, p.type, attacker, { magico: !!t.magico });
      } else {
        this.say('ataque', `${attacker.name} usa ${p.name} em ${target.name}, que resiste.`, conta);
      }
      this.onEvent({ type: 'attack', attacker, target, hit: !r.success, ranged: p.ranged, damageType: p.type,
        weaponName: p.name, art: p.art, damage: dano, rolagem: null, modo: 'normal', vantagens: [], desvantagens: [], motivos: [], teste: true });
      return { hit: !r.success, teste: true };
    }
    // Muralha de Vento: o projétil de arma que cruza o vento erra, sem rolar.
    if (p.ranged && this.muralhaNoCaminho(attacker.pos, target.pos)) {
      this.quebraInvisibilidade(attacker);
      this.consumirAoAtacar(attacker, target);
      this.say('ataque', `${attacker.name} atira em ${target.name}, mas a muralha de vento desvia ${p.name}: erra sozinho.`);
      this.onEvent({
        type: 'attack', attacker, target, hit: false, ranged: true, damageType: p.type, weaponName: p.name, art: p.art,
        rolagem: null, faltou: null, errouPorPouco: false, modo: 'normal', anulado: false,
        vantagens: [], desvantagens: [], motivos: ['muralha de vento'],
      });
      return { hit: false, muralha: true };
    }
    const mods = this.attackModifiers(attacker, target, { ranged: p.ranged, opportunity });
    if (check.longRange) fonte(mods, 'desvantagem', 'alcance longo');
    if (disadvantage) fonte(mods, 'desvantagem', 'segundo ataque');

    const cover = p.ranged ? this.field.coverBetween(attacker.pos, target.pos) : 0;
    let ac = caEfetiva(target) + cover;
    const caPartes = [{ rotulo: `CA de ${target.name}`, valor: caEfetiva(target) }];
    if (cover) caPartes.push({ rotulo: 'cobertura', valor: cover });

    const { bonus, partes: bonusPartes } = this.dadosDeAtaque(attacker, p.bonus, p.bonusPartes);
    if (this.imagemDesvia(attacker, target, bonus, mods)) return { hit: false };
    this.quebraInvisibilidade(attacker);

    const atk = segundaChanceNoAtaque(this, attacker, target, attackRoll(this.rng, bonus, ac, mods), bonus, ac);
    this.consumirAoAtacar(attacker, target);
    // Flecha Relampejante: o próximo ataque à distância vira raio, acertando ou não.
    const flecha = p.ranged ? getCondition(attacker, 'flechaRelampago') : null;
    if (flecha) removeCondition(attacker, 'flechaRelampago');
    // Escudo Arcano: a reação de quem ia ser acertado, se +5 faz errar.
    if (atk.hit && !atk.critical && this.escudoArcano(target, attacker, atk.total, ac)) {
      ac += 5;
      caPartes.push({ rotulo: 'Escudo Arcano', valor: 5 });
      atk.hit = false;
    }
    const tgtFx = conditionEffects(target);
    this.consumirMarcas(target);
    const autoCrit = tgtFx.critWithinReach && distanceFt(attacker.pos, target.pos) <= 5;
    const critical = atk.critical || (atk.hit && autoCrit);

    // Errar por 1 ou 2 é informação tática de verdade: diz que fabricar
    // vantagem, ou somar um único ponto de bônus, teria virado o ataque. Um
    // 1 natural não entra nessa conta — ele erra por regra, não por margem.
    const faltou = atk.hit || atk.fumble ? null : Math.max(0, ac - atk.total);
    const porPouco = faltou !== null && faltou >= 1 && faltou <= 2;

    const explicacao = explicarModo(mods);
    const detail = [
      `d20[${atk.rolls.join('/')}] ${explicarBonus(bonus, bonusPartes)} = ${atk.total}`,
      `vs CA ${ac}${cover ? ` (${caPartes.map((c) => `${c.rotulo} ${c.valor}`).join(' + ')})` : ''}`,
      explicacao || null,
    ].filter(Boolean).join(' · ');

    // Tudo que a camada de desenho precisa para contar a rolagem de novo, sem
    // reler o texto do log nem recalcular regra.
    const rolagem = {
      categoria: 'ataque',
      rotulo: p.name,
      d20: { rolls: [...atk.rolls], natural: atk.natural, total: atk.total, bonus },
      bonusPartes,
      alvoNumero: { rotulo: 'CA', valor: ac, partes: caPartes },
      modo: mods.mode,
      anulado: mods.anulado,
      vantagens: [...mods.vantagens],
      desvantagens: [...mods.desvantagens],
      motivos: [...mods.reasons],
      explicacao,
      critico: critical,
      critoAutomatico: atk.hit && autoCrit && !atk.critical,
      faltou,
      errouPorPouco: porPouco,
      naturalUm: atk.fumble,
      natural20: atk.critical,
    };

    if (!atk.hit) {
      if (p.recarga) (attacker.recarregando ??= {})[p.name] = true;
      const nota = atk.fumble
        ? ' — 1 natural, erra por regra'
        : porPouco ? ` — faltou ${faltou}` : '';
      this.say('ataque', `${attacker.name} erra ${target.name} com ${p.name}${nota}.`, detail, { rolagem });
      if (flecha) this.flechaRelampago(attacker, target, flecha, { acertou: false });
      this.onEvent({
        type: 'attack', attacker, target, hit: false,
        ranged: p.ranged, damageType: p.type, weaponName: p.name, art: p.art,
        rolagem, faltou, errouPorPouco: porPouco,
        modo: mods.mode, anulado: mods.anulado,
        vantagens: rolagem.vantagens, desvantagens: rolagem.desvantagens, motivos: rolagem.motivos,
      });
      return { hit: false, faltou, errouPorPouco: porPouco, modo: mods.mode };
    }

    // A flecha vira raio: 4d8 elétrico no lugar do dano da arma.
    if (flecha) p = { ...p, damage: this.dadosDaFlecha(flecha).alvo, type: 'elétrico', danoExtra: null };
    let damageNotation = p.damage;
    let sneak = null;
    if (this.sneakApplies(attacker, target, p.weapon, mods)) {
      attacker.sneakUsedThisTurn = true;
      sneak = damageRoll(this.rng, attacker.sneakAttack, { critical });
    }
    let martial = null;
    if (this.martialApplies(attacker, target)) {
      attacker.martialUsedThisTurn = true;
      martial = damageRoll(this.rng, '2d6', { critical });
    }

    // Ataque sem dano (a teia da aranha só prende): o acerto vale pelo efeito.
    const dmg = damageNotation
      ? ajustarDanoDeArma(this, attacker, p, damageRoll(this.rng, damageNotation, { critical }))
      : null;
    // Raio do Enfraquecimento: golpe de Força causa metade.
    const deForca = attacker.attacks ? !p.ranged : (p.weapon && weaponAbility(attacker, p.weapon) === 'str');
    if (dmg && deForca && hasCondition(attacker, 'enfraquecido')) {
      dmg.total = Math.floor(dmg.total / 2);
      this.say('condicao', `${attacker.name} está enfraquecido: o golpe sai pela metade.`);
    }
    // Aumentar/Reduzir: +1d4 ou −1d4 no dano de arma.
    const tamanho = dmg ? this.ajusteDeTamanho(attacker, dmg, critical) : null;
    const total = (dmg?.total ?? 0) + (tamanho?.total ?? 0) + (sneak?.total ?? 0) + (martial?.total ?? 0);

    // Cada origem do dano vira uma parcela própria. Um "19 de dano" não deixa
    // ver que 12 daquilo foi o ataque furtivo — e é justamente essa parcela que
    // o ladino está manobrando o turno inteiro para conseguir.
    const danoPartes = dmg ? [parcelaDeDano('dano', dmg)] : [];
    if (tamanho) danoPartes.push(tamanho);
    if (sneak) danoPartes.push(parcelaDeDano('ataque furtivo', sneak));
    if (martial) danoPartes.push(parcelaDeDano('vantagem marcial', martial));
    rolagem.danoPartes = danoPartes;
    rolagem.danoTotal = total;
    rolagem.tipoDeDano = p.type;

    const parts = danoPartes.map(contaDeDano);
    // Crítico por inconsciente ao alcance não vem de um 20 natural; sem dizer
    // isso o jogador procura o 20 na rolagem e não acha.
    const marcaCritico = critical
      ? (rolagem.critoAutomatico ? ' — CRÍTICO (alvo indefeso ao alcance)' : ' — CRÍTICO (20 natural)')
      : '';

    this.say(
      'ataque',
      total
        ? `${attacker.name} acerta ${target.name} com ${p.name}${marcaCritico}: ${total} de dano ${p.type}.`
        : `${attacker.name} acerta ${target.name} com ${p.name}.`,
      parts.length ? `${detail} · ${parts.join(' + ')}` : detail,
      { rolagem },
    );
    this.onEvent({
      type: 'attack', attacker, target, hit: true, critical, damage: total,
      ranged: p.ranged, damageType: p.type, weaponName: p.name, art: p.art, sneak: !!sneak, martial: !!martial,
      rolagem, danoPartes, faltou: null, errouPorPouco: false,
      modo: mods.mode, anulado: mods.anulado,
      vantagens: rolagem.vantagens, desvantagens: rolagem.desvantagens, motivos: rolagem.motivos,
      critoAutomatico: rolagem.critoAutomatico,
    });
    const magico = !!(p.weapon?.raridade || p.weapon?.bonusAtaque || (attacker.conditions ?? []).some((c) => CONDITIONS[c.id]?.bonusArma));
    // Armadura de Agathys: vale se ele ainda tinha PV temporários ao ser acertado.
    const agathys = !p.ranged && getCondition(target, 'agathys');
    const geloDevolve = agathys && (target.tempHp ?? 0) > 0 ? agathys.data?.dano ?? 5 : 0;
    // O golpe e o que ele soma (Bruxaria, golpe divino, o veneno da aranha)
    // são UMA fonte de dano: um teste de concentração só, pela soma.
    this.umaFonteDeDano(() => {
      this.applyDamage(target, total, p.type, attacker, { critical, magico, deArma: true, corpoACorpo: !p.ranged });
      this.extrasDoAcerto(attacker, target, { arma: true, ranged: p.ranged, tipo: p.type, critical });
      // `contra`: dano extra que só vale num tipo de criatura (o de Hew, em planta).
      if (p.danoExtra && !target.dead && (!p.danoExtra.contra || target.tipo === p.danoExtra.contra)) {
        this.danoExtraDoGolpe(attacker, target, p, critical);
      }
    });
    // A explosão da Flecha Relampejante é outra fonte, com os seus testes.
    if (flecha) this.flechaRelampago(attacker, target, flecha, { acertou: true });
    // O gelo da Agathys é outra fonte, com o seu próprio teste.
    if (geloDevolve && !attacker.dead) {
      this.say('magia', `O gelo de ${target.name} morde ${attacker.name}: ${geloDevolve} de frio.`);
      this.applyDamage(attacker, geloDevolve, 'frio', target, { magico: true });
    }
    if (p.recarga) (attacker.recarregando ??= {})[p.name] = true;
    depoisDoAcerto(this, attacker, target, p);

    // Efeito extra do ataque (mordida do lobo derruba).
    const imune = p.onHit && (
      p.onHit.imunes?.ancestry?.some((a) => (target.ancestry ?? '').startsWith(a))
      || p.onHit.imunes?.tipo?.includes(target.tipo)
      || this.imuneACondicao(target, p.onHit.condition)
    );
    if (imune && !target.dead) {
      this.say('condicao', `${target.name} não é afetado: ${p.onHit.imunes?.motivo ?? `imune a ${CONDITIONS[p.onHit.condition]?.name.toLowerCase() ?? p.onHit.condition}`}.`);
    } else if (p.onHit && !target.dead && !hasCondition(target, 'inconsciente')) {
      // Alguns efeitos não têm resistência: o acerto já basta (a teia prende).
      const save = p.onHit.semResistencia
        ? { success: false, total: 0, rolls: [] }
        : this.resistencia(target, p.onHit.save, p.onHit.dc);
      const nomeCondicao = CONDITIONS[p.onHit.condition]?.name ?? p.onHit.condition;
      const r = p.onHit.semResistencia
        ? { conta: `sem resistência: o acerto basta · escapa com Atletismo ou Acrobacia CD ${p.onHit.escape ?? p.onHit.dc}` }
        : this.explicarResistencia(target, p.onHit.save, p.onHit.dc, save, {
          contra: `${p.name} de ${attacker.name}`,
          seSucesso: `não fica ${nomeCondicao}`,
        });
      if (!save.success) {
        this.aplicarCondicao(target, p.onHit.condition, {
          rounds: p.onHit.rounds ?? Infinity,
          source: attacker.id,
          data: {
            save: p.onHit.save,
            dc: p.onHit.dc,
            repete: !!p.onHit.repete,
            escape: p.onHit.escape ?? null,
          },
        });
        this.say('condicao', `${target.name} ${p.onHit.note} — fica ${nomeCondicao}.`, r.conta, { rolagem: r });
      } else {
        this.say('condicao', `${target.name} se segura e escapa de ${nomeCondicao}.`, r.conta, { rolagem: r });
      }
    }
    return { hit: true, critical, damage: total, modo: mods.mode, danoPartes };
  }

  /** Os dados da Flecha Relampejante no círculo em que saiu: o alvo e a explosão. */
  dadosDaFlecha(cond) {
    const def = CONDITIONS.flechaRelampago.flecha;
    const magia = getSpell('flechaRelampago');
    const circulo = cond.data?.circulo ?? magia.level;
    return {
      alvo: dadosDaMagia(magia, { circulo, notacao: def.alvo }),
      explosao: dadosDaMagia(magia, { circulo, notacao: def.explosao }),
      tipo: def.tipo,
    };
  }

  /**
   * Flecha Relampejante, depois do ataque: errando, o alvo ainda leva metade do
   * raio; acertando ou não, quem está a até 3 m dele (aliado também, o alvo não)
   * faz CD de DES contra a explosão. Cada um é uma fonte de dano à parte.
   */
  flechaRelampago(atacante, alvo, cond, { acertou }) {
    const d = this.dadosDaFlecha(cond);
    this.onEvent({ type: 'golpeMagico', atacante, alvo, tipo: d.tipo, efeito: 'flecha' });
    if (!acertou && !alvo.dead) {
      const r = damageRoll(this.rng, d.alvo);
      const metade = Math.floor(r.total / 2);
      this.say('magia', `O raio da flecha estala perto de ${alvo.name}: ${metade} de ${d.tipo}.`, `${d.alvo}[${r.rolls.join('+')}] → metade`);
      this.outraFonte(() => this.applyDamage(alvo, metade, d.tipo, atacante, { magico: true }));
    }
    const dc = spellSaveDc(atacante);
    const r = damageRoll(this.rng, d.explosao);
    const pegos = this.combatants.filter((c) => !c.dead && c !== alvo
      && distanceFt(c.pos, alvo.pos) <= 10 && this.field.hasLineOfSight(alvo.pos, c.pos));
    this.say('magia', `A Flecha Relampejante explode em volta de ${alvo.name}${pegos.length ? '' : ' (ninguém por perto)'}.`);
    for (const c of pegos) {
      this.outraFonte(() => {
        const save = this.resistencia(c, 'dex', dc);
        const amount = save.success ? Math.floor(r.total / 2) : r.total;
        const rr = this.explicarResistencia(c, 'dex', dc, save, { contra: 'Flecha Relampejante', seSucesso: 'metade do dano' });
        this.say('magia', `${c.name} ${save.success ? 'resiste' : 'falha'} e sofre ${amount} de ${d.tipo}.`, `${rr.conta} · ${d.explosao}[${r.rolls.join('+')}]`, { rolagem: rr });
        this.applyDamage(c, amount, d.tipo, atacante, { magico: true });
      });
    }
    if (atacante.concentrating?.spellId === 'flechaRelampago') this.dropConcentration(atacante);
  }

  /**
   * O segundo tipo de dano do mesmo golpe (o veneno da aranha, o ácido da
   * gelatina). Com `save`, o alvo resiste: metade (`half`) ou nada.
   */
  danoExtraDoGolpe(attacker, target, p, critical) {
    const ex = p.danoExtra;
    const dmg = damageRoll(this.rng, ex.damage, { critical });
    let amount = dmg.total;
    let conta = contaDeDano(parcelaDeDano(ex.type, dmg));
    if (ex.save) {
      const save = this.resistencia(target, ex.save, ex.dc);
      const r = this.explicarResistencia(target, ex.save, ex.dc, save, {
        contra: `${ex.type} de ${p.name}`,
        seSucesso: ex.half ? 'metade' : 'nada',
      });
      if (save.success) amount = ex.half ? Math.floor(amount / 2) : 0;
      conta = `${r.conta} · ${conta}`;
    }
    this.say('ataque', `${target.name} sofre ${amount} de ${ex.type} de ${p.name}.`, conta);
    this.applyDamage(target, amount, ex.type, attacker, { critical });
  }

  /**
   * Os dados que condições somam ou tiram da jogada de ataque (Bênção,
   * Perdição). Vale para arma E para magia: ataque de magia também é jogada
   * de ataque. As partes somam sempre o `bonus` que vai para a rolagem: o dado
   * entra como parcela nomeada em vez de engordar um "+4" anônimo.
   */
  dadosDeAtaque(attacker, base, partesBase = []) {
    const fx = conditionEffects(attacker);
    let bonus = base;
    const partes = [...(partesBase ?? [])];
    for (const dice of fx.attackBonusDice) {
      const r = roll(this.rng, dice);
      bonus += r.total;
      partes.push({ rotulo: `bênção ${dice}[${r.rolls.join('+')}]`, valor: r.total });
    }
    // O espelho: Perdição tira o que a Bênção põe.
    for (const dice of fx.attackPenaltyDice) {
      const r = roll(this.rng, dice);
      bonus -= r.total;
      partes.push({ rotulo: `perdição −${dice}[${r.rolls.join('+')}]`, valor: -r.total });
    }
    return { bonus, partes };
  }

  /** Marcas que somem no primeiro ataque contra o alvo (Raio Guiado). */
  consumirMarcas(target) {
    for (const cond of [...(target.conditions ?? [])]) {
      if (CONDITIONS[cond.id]?.consumidaAoSerAtacado) removeCondition(target, cond.id);
    }
  }

  /**
   * Ação de Ataque completa (trata Ataque Múltiplo dos monstros).
   *
   * VALIDA ANTES DE GASTAR. Antes, a ação era marcada como usada e só depois
   * `resolveAttack` descobria que o alvo estava fora de alcance ou sem linha de
   * visão — o jogador perdia o turno por um clique que nunca poderia acertar.
   *
   * @returns {{ok: boolean, why?: string}}
   */
  /** Ainda pode atacar: ação livre, ou golpes do Ataque Extra guardados. */
  podeAtacar(c) {
    return !c.actionUsed || (c.ataquesRestantes ?? 0) > 0;
  }

  attackAction(attacker, target, weaponId = null) {
    // Ataque Extra: se o alvo caiu antes dos golpes acabarem, os que sobram
    // ficam guardados e saem noutro alvo, sem gastar outra ação.
    const continuando = attacker.actionUsed && (attacker.ataquesRestantes ?? 0) > 0;
    if (attacker.actionUsed && !continuando) return { ok: false, why: 'a ação deste turno já foi usada' };
    if (conditionEffects(attacker).incapacitated) return { ok: false, why: 'incapacitado não age' };

    const check = this.canAttack(attacker, target, weaponId);
    if (!check.ok) return { ok: false, why: check.why };

    attacker.actionUsed = true;
    // Monstro nomeia o golpe pelo nome do bloco; personagem, pelo id da arma.
    const arma = attacker.attacks ? (weaponId ?? check.profile.name) : weaponId;
    const golpes = continuando ? Array(attacker.ataquesRestantes).fill(arma) : this.golpesDoAtaque(attacker, arma);
    attacker.ataquesRestantes = 0;
    for (const [i, golpe] of golpes.entries()) {
      // Quem morreu no meio da sequência (Repreensão Infernal, Agathys) para.
      if (attacker.dead || hasCondition(attacker, 'inconsciente')) break;
      if (i > 0 && (target.dead || hasCondition(target, 'inconsciente'))) {
        if (!attacker.attacks) {
          attacker.ataquesRestantes = golpes.length - i;
          this.say('acao', `${attacker.name} ainda tem ${attacker.ataquesRestantes} golpe${attacker.ataquesRestantes > 1 ? 's' : ''} do Ataque Extra para outro alvo.`);
        }
        break;
      }
      // Cada golpe da sequência tem o seu alcance (a mordida de 3 m e a garra
      // de 1,5 m do dragão): o que não alcança fica de fora.
      if (i > 0 && !this.canAttack(attacker, target, golpe).ok) continue;
      this.resolveAttack(attacker, target, {
        weaponId: golpe,
        disadvantage: attacker.multiattack?.secondAtDisadvantage && i === 1,
      });
    }
    this.afterAction(attacker);
    return { ok: true };
  }

  /**
   * Os golpes de uma ação de Ataque. Sem Multiataque, um. Com `sequence` (ou
   * `pattern`), os golpes do bloco, na ordem — o urso morde E arranha; se a
   * arma escolhida não está na sequência (a besta do rufião), o Multiataque
   * não vale para ela e sai um golpe só. Sem sequência, a mesma arma `count`
   * vezes.
   */
  golpesDoAtaque(attacker, arma) {
    const ma = attacker.multiattack;
    // Lentidão e a ação da Velocidade: um ataque só, com Multiataque ou sem.
    if (conditionEffects(attacker).umAtaque || attacker.acaoLimitada) return [arma];
    // Ataque Extra dos personagens (guerreiro: 1, 2 ou 3 golpes a mais).
    if (!attacker.attacks) return Array(1 + (attacker.ataquesExtras ?? 0)).fill(arma);
    if (!ma || ma.count <= 1) return [arma];
    const seq = ma.sequence ?? ma.pattern;
    if (seq) return seq.includes(arma) ? seq.slice(0, ma.count) : [arma];
    return Array(ma.count).fill(arma);
  }

  afterAction(actor) {
    actor.corridaFt = 0;
    if (actor.actionUsed && actor.acaoVelozDisponivel && hasCondition(actor, 'acelerado') && !(actor.ataquesRestantes > 0)) {
      actor.acaoVelozDisponivel = false;
      actor.actionUsed = false;
      actor.acaoLimitada = true;
      this.say('recurso', `${actor.name} ainda tem a ação da Velocidade: um golpe, Disparada, Desengajar ou usar um objeto.`);
    }
    // Lentidão: no turno, a ação OU a ação bônus — usou uma, perdeu a outra.
    if (conditionEffects(actor).acaoOuBonus && (actor.actionUsed || actor.bonusUsed)) {
      actor.actionUsed = true;
      actor.bonusUsed = true;
    }
    if (actor.extraActions > 0 && !(actor.ataquesRestantes > 0)) {
      actor.extraActions -= 1;
      actor.actionUsed = false;
      this.say('recurso', `${actor.name} ainda tem uma ação (Ação Surpreendente).`);
    }
    this.checkEnd();
  }

  // ---- dano, cura e morte --------------------------------------------------

  /**
   * O dano depois do tipo: imunidade zera, resistência divide, vulnerabilidade
   * dobra (SRD). A resistência física "de armas não mágicas" não vale contra
   * arma mágica nem magia.
   */
  danoPorTipo(target, amount, type, magico = false, deArma = false) {
    if (!type) return amount;
    if (target.immune?.includes(type)) return 0;
    // Silêncio: onde não passa som, não há trovão.
    if (type === 'trovejante' && this.zonasEm(target.pos).some((z) => z.silencio)) return 0;
    let out = amount;
    // Proteção contra Lâminas: resistência que só vale contra golpe de arma.
    const porCondicao = (target.conditions ?? []).some((c) => {
      const def = CONDITIONS[c.id];
      if (def?.resisteTudo && !def.resisteTudoExceto?.includes(type)) return true;
      if (def?.resisteTipoDado && c.data?.tipo === type) return true;
      return def?.resiste?.includes(type) && (!def.soDeArma || deArma);
    });
    if (porCondicao || target.resist?.includes(type) || (!magico && target.resistNaoMagico?.includes(type))) out = Math.floor(out / 2);
    if (target.vulnerable?.includes(type)) out *= 2;
    return out;
  }

  /**
   * Elo de Proteção: quem conjurou o elo sofre o mesmo dano que o protegido
   * (já depois da resistência dele). O elo acaba se o conjurador cai a 0 PV ou
   * se os dois ficam a mais de 18 m. `emElo` impede o eco: o dano que volta
   * para o conjurador não passa por outro elo.
   */
  donoDoElo(protegido) {
    const elo = getCondition(protegido, 'eloDeProtecao');
    if (!elo) return null;
    const dono = this.combatants.find((c) => c.id === elo.source);
    const acaba = (motivo) => {
      removeCondition(protegido, 'eloDeProtecao');
      this.say('magia', `O Elo de Proteção de ${protegido.name} se desfaz: ${motivo}.`);
      return null;
    };
    if (!dono || dono.dead || dono.hp <= 0) return acaba('quem o conjurou caiu');
    if (distanceFt(dono.pos, protegido.pos) > 60) return acaba('os dois ficaram a mais de 18 m um do outro');
    return this.emElo ? null : dono;
  }

  danoDoElo(dono, amount, type, source) {
    this.emElo = true;
    try {
      this.say('magia', `${dono.name} sente o golpe pelo Elo de Proteção: ${amount} de dano.`);
      this.applyDamage(dono, amount, type, source, { magico: true });
    } finally {
      this.emElo = false;
    }
  }

  /**
   * Acalmar Emoções: quem está indiferente deixa de estar quando um inimigo
   * fere alguém — o próprio ou um amigo que ele vê.
   */
  acordaIndiferentes(ferido, fonte) {
    if (!fonte || fonte.side === ferido.side) return;
    for (const c of this.combatants) {
      if (c.dead || getCondition(c, 'calmo')?.data?.modo !== 'indiferente') continue;
      if (c !== ferido && !(c.side === ferido.side && this.field.hasLineOfSight(c.pos, ferido.pos))) continue;
      removeCondition(c, 'calmo');
      this.say('condicao', `${c.name} deixa de ficar indiferente: o perigo é real.`);
    }
  }

  /** Muralha de Vento: o projétil de arma que cruza uma zona que o barra erra. */
  muralhaNoCaminho(de, para) {
    const barras = this.zonas.filter((z) => z.barraProjetil);
    if (!barras.length) return false;
    return this.field.line(de, para).some((q, i) => i > 0 && barras.some((z) => z.casas.has(key(q.x, q.y))));
  }

  /**
   * Aumentar/Reduzir: a parcela de dano de arma (+1d4 ou −1d4, nunca deixando
   * o golpe abaixo de 1). `null` sem a condição.
   */
  ajusteDeTamanho(atacante, dmg, critical) {
    const cresce = hasCondition(atacante, 'aumentado');
    const encolhe = hasCondition(atacante, 'reduzido');
    if (cresce === encolhe) return null;
    const r = damageRoll(this.rng, '1d4', { critical });
    const total = cresce ? r.total : -Math.min(r.total, Math.max(0, dmg.total - 1));
    return { rotulo: cresce ? 'aumentar' : 'reduzir', notacao: '1d4', dados: [...r.rolls], mod: 0, total, critico: !!critical };
  }

  /**
   * Um teste de atributo (não de resistência) rolado pelo combate: escapar de
   * agarrão, estabilizar, dissipar. Soma o que as condições dão — o 1d4 da
   * Orientação, que vale UM teste —, e a vantagem ou desvantagem de Força de
   * Aumentar/Reduzir. `conta` é o texto para o registro.
   */
  testeDeAtributo(actor, hab, bonus, rotulo = '') {
    const fx = conditionEffects(actor);
    const r = d20(this.rng, bonus, {
      advantage: fx.vantagemTeste.includes(hab) || fx.vantagemSoTeste.includes(hab),
      disadvantage: fx.desvantagemTeste.includes(hab)
        || (!!actor.armorUntrained && (hab === 'str' || hab === 'dex')),
    });
    let total = r.total;
    const extras = [];
    for (const cond of [...(actor.conditions ?? [])]) {
      const dados = CONDITIONS[cond.id]?.testeBonusDice;
      if (!dados) continue;
      const d = roll(this.rng, dados);
      total += d.total;
      extras.push(`${CONDITIONS[cond.id].name.toLowerCase()} ${dados}[${d.rolls.join('+')}]`);
      if (CONDITIONS[cond.id].consumidaNoTeste) {
        removeCondition(actor, cond.id);
        const dono = this.combatants.find((c) => c.id === cond.source);
        if (dono?.concentrating?.condition === cond.id) dono.concentrating = null;
      }
    }
    const modo = r.mode !== 'normal' ? ` (${r.mode})` : '';
    const conta = `${rotulo ? `${rotulo} ` : ''}d20[${r.rolls.join('/')}] ${formatModifier(bonus)}${extras.length ? ` + ${extras.join(' + ')}` : ''} = ${total}${modo}`;
    return { ...r, total, conta };
  }

  applyDamage(target, amount, type, source = null, { critical = false, magico = false, deArma = false, corpoACorpo = false } = {}) {
    if (amount <= 0 || target.dead) return;
    // No Plano Etéreo nada atinge.
    if (hasCondition(target, 'etereo')) return;
    const bruto = amount;
    // Elo de Proteção: confere antes — um elo que acaba agora não resiste a este golpe.
    const doElo = this.donoDoElo(target);
    amount = this.danoPorTipo(target, amount, type, magico, deArma);
    this.ultimoDano = Math.max(0, amount);
    if (amount !== bruto) {
      const como = amount === 0 ? 'imune' : amount < bruto ? 'resistente' : 'vulnerável';
      this.say('dano', `${target.name} é ${como} a ${type}: ${bruto} vira ${amount}.`);
    }
    if (amount <= 0) return;
    // Amizade Animal acaba se o grupo fere a fera (inclusive com dano de área).
    if (target.amizadeAnimal && source?.side === 'party') {
      delete target.amizadeAnimal;
      target.side = 'foes';
      this.say('aviso', `${target.name} sente a dor e a amizade se desfaz: volta a rosnar.`);
    }
    if (doElo) this.danoDoElo(doElo, amount, type, source);

    // JÁ CAÍDO. Dano em quem está a 0 PV não é uma queda nova: é uma falha no
    // teste de morte (duas, se foi crítico), e quem estava estável volta a
    // morrer. Tratar como queda nova zerava as falhas — apanhar no chão
    // salvava o personagem.
    if (target.kind === 'pc' && target.hp <= 0) {
      // Caiu NESTE golpe: a parcela que vem depois (o veneno da mordida) é o
      // mesmo dano, e soma à sobra para o dano maciço — não é falha nova.
      const antes = this.quedasDaFonte?.get(target);
      if (antes != null) {
        const s = antes + amount;
        this.quedasDaFonte.set(target, s);
        this.onEvent({ type: 'damage', target, amount, source });
        if (s >= target.maxHp) this.morrer(target, 'dano maciço');
        return;
      }
      this.onEvent({ type: 'damage', target, amount, source });
      if (amount >= target.maxHp) { this.morrer(target, 'dano maciço'); return; }
      target.stable = false;
      target.deathSaves.failures += critical ? 2 : 1;
      this.say('morte', `${target.name} sofre dano caído — ${critical ? 'duas falhas' : 'uma falha'} no teste de morte (${target.deathSaves.failures}/3).`);
      // As parcelas seguintes deste golpe (o veneno) já não contam falha nova.
      this.quedasDaFonte?.set(target, amount);
      if (target.deathSaves.failures >= 3) this.morrer(target);
      return;
    }

    this.aliadoFereODuelado(target, source);
    this.acordaIndiferentes(target, source);
    let left = amount;
    if (target.tempHp > 0) {
      const absorbed = Math.min(target.tempHp, left);
      target.tempHp -= absorbed;
      left -= absorbed;
    }
    target.hp -= left;
    this.onEvent({ type: 'damage', target, amount, source });

    if (target.hp > 0) {
      if (target.concentrating) {
        if (this.danoDaFonte) this.danoDaFonte.set(target, (this.danoDaFonte.get(target) ?? 0) + amount);
        else this.concentrationCheck(target, amount);
      }
      // Sono: o dano acorda (de pé fica para ele: acorda caído).
      if (getCondition(target, 'inconsciente')?.source === 'sono') {
        removeCondition(target, 'inconsciente');
        this.say('condicao', `${target.name} acorda com o golpe.`);
      }
      // Riso Histérico: o dano dá um novo teste — um por fonte, não por parcela.
      if (this.risoDaFonte) this.risoDaFonte.add(target);
      else this.repetirAoSofrerDano(target);
      this.reacaoAoDano(target, source);
      // Enfeitiçar Pessoa: dano de quem enfeitiçou (ou dos aliados dele) quebra.
      const encanto = getCondition(target, 'enfeiticado');
      const quemEncantou = encanto && this.combatants.find((x) => x.id === encanto.source);
      if (encanto && source && quemEncantou && source.side === quemEncantou.side) {
        removeCondition(target, 'enfeiticado');
        this.say('condicao', `${target.name} acorda do encanto com o golpe.`);
      }
      // Sugestão: o dano de quem sugeriu (ou de um aliado dele) quebra a sugestão.
      const sug = getCondition(target, 'sugerido');
      const quemSugeriu = sug && this.combatants.find((x) => x.id === sug.source);
      if (sug && source && quemSugeriu && source.side === quemSugeriu.side) {
        removeCondition(target, 'sugerido');
        this.say('condicao', `${target.name} sai da sugestão com o golpe e volta à luta.`);
        this.soltouDaConcentracao(target, 'sugerido');
      }
      // Padrão Hipnótico: o dano quebra o encanto.
      for (const cond of [...(target.conditions ?? [])]) {
        if (!CONDITIONS[cond.id]?.acordaComDano) continue;
        removeCondition(target, cond.id);
        this.say('condicao', `${target.name} desperta do ${CONDITIONS[cond.id].name.toLowerCase()} com o golpe.`);
      }
      return;
    }

    // MORTE INSTANTÂNEA: o que sobra do dano depois de zerar os PV, se chegar
    // ao máximo de PV, mata na hora.
    const sobra = -target.hp;
    target.hp = 0;
    this.quedasDaFonte?.set(target, sobra);
    // Concentração não sobrevive à queda: inconsciente é incapacitado.
    this.dropConcentration(target);

    // GOLPE NÃO LETAL (Livro do Jogador): quem zera a vida de alguém com um
    // ataque corpo a corpo pode deixá-lo desacordado em vez de morto. O herói
    // escolhe isso antes (`naoLetal`, no menu do botão direito).
    if (target.kind === 'npc' && corpoACorpo && source?.naoLetal) {
      addCondition(target, 'inconsciente');
      addCondition(target, 'caido');
      target.stable = true;
      target.capturado = true;
      this.say('morte', `${target.name} cai desacordado — vivo.`);
      this.onEvent({ type: 'downed', target });
      return;
    }

    if (target.kind === 'npc') {
      target.dead = true;
      target.morreuNaRodada = this.round;
      removeCondition(target, 'esquivando');
      this.say('morte', `${target.name} cai.`);
      this.onEvent({ type: 'died', target });
    } else if (sobra >= target.maxHp) {
      this.morrer(target, 'dano maciço');
      return;
    } else {
      addCondition(target, 'inconsciente');
      addCondition(target, 'caido');
      target.stable = false;
      target.deathSaves = { successes: 0, failures: 0 };
      target.acted = true;
      this.say('morte', `${target.name} cai inconsciente.`);
      this.onEvent({ type: 'downed', target });
    }
    this.checkEnd();
  }

  /** Morte de personagem: três falhas, ou dano maciço. */
  morrer(target, motivo = null) {
    target.dead = true;
    // Revivificar só alcança quem morreu há até 1 minuto (10 rodadas).
    target.morreuNaRodada = this.round;
    target.hp = 0;
    this.dropConcentration(target);
    this.say('morte', `${target.name} morre${motivo ? ` (${motivo})` : ''}.`);
    this.onEvent({ type: 'died', target });
    this.checkEnd();
  }

  heal(target, amount, source = null) {
    if (target.dead || amount <= 0) return 0;
    if ((target.conditions ?? []).some((c) => CONDITIONS[c.id]?.semCura)) {
      this.say('aviso', `${target.name} não recupera PV: a necromancia ainda segura a ferida.`);
      return 0;
    }
    const was = target.hp;
    const revived = hasCondition(target, 'inconsciente');
    target.hp = Math.min(target.maxHp, target.hp + amount);
    if (revived && target.hp > 0) {
      // Acorda, mas no chão: o `caido` fica até ele gastar o deslocamento
      // para se levantar.
      removeCondition(target, 'inconsciente');
      target.stable = false;
      target.deathSaves = { successes: 0, failures: 0 };
      this.say('cura', `${target.name} volta a si com ${target.hp} PV.`);
      if (this.over) this.levantarForaDoCombate(target);
    }
    this.onEvent({ type: 'heal', target, amount: target.hp - was, source });
    return target.hp - was;
  }

  deathSave(actor) {
    // Farol de Esperança: vantagem no teste de morte.
    const r = d20(this.rng, 0, { advantage: conditionEffects(actor).vantagemMorte });
    // Teste de morte é d20 PURO: nenhum atributo, nenhuma proficiência. Dizer
    // isso evita a dúvida de por que o guerreiro com +3 de CON rola sem bônus.
    const conta = `d20[${r.rolls.join('/')}] = ${r.total} vs CD 10 · sem bônus (d20 puro) · 3 sucessos estabiliza, 3 falhas mata`;
    const rolagem = {
      categoria: 'morte',
      actor,
      contra: 'morrer em 0 PV',
      cd: 10,
      bonus: 0,
      bonusPartes: [],
      d20Rolls: [...r.rolls],
      total: r.total,
      modo: 'normal',
      sucesso: r.total >= 10,
      seSucesso: 'um sucesso a mais na contagem',
      conta,
    };
    this.onEvent({ type: 'rolagem', ...rolagem });

    if (r.natural === 20) {
      this.say('morte', `${actor.name}: 20 natural no teste de morte — levanta com 1 PV!`, conta, { rolagem });
      this.heal(actor, 1);
      return;
    }
    if (r.natural === 1) {
      actor.deathSaves.failures += 2;
      this.say('morte', `${actor.name}: 1 natural — duas falhas (${actor.deathSaves.failures}/3).`, conta, { rolagem });
    } else if (r.total >= 10) {
      actor.deathSaves.successes += 1;
      this.say('morte', `${actor.name}: sucesso no teste de morte (${actor.deathSaves.successes}/3).`, conta, { rolagem });
    } else {
      actor.deathSaves.failures += 1;
      this.say('morte', `${actor.name}: falha no teste de morte (${actor.deathSaves.failures}/3).`, conta, { rolagem });
    }
    if (actor.deathSaves.successes >= 3) {
      actor.stable = true;
      this.say('morte', `${actor.name} se estabiliza.`);
    } else if (actor.deathSaves.failures >= 3) {
      this.morrer(actor);
    }
  }

  /**
   * Junta o dano de uma fonte só (o golpe e o que ele soma) e faz UM teste de
   * concentração por alvo, com a CD da soma — e não um por parcela.
   */
  umaFonteDeDano(fn) {
    const fora = this.danoDaFonte;
    const foraRiso = this.risoDaFonte;
    const foraQuedas = this.quedasDaFonte;
    const soma = new Map();
    const riso = new Set();
    this.danoDaFonte = soma;
    this.risoDaFonte = riso;
    // Quem cai neste golpe, com a sobra do dano (para o dano maciço).
    this.quedasDaFonte = fora ? foraQuedas : new Map();
    try { fn(); } finally {
      this.danoDaFonte = fora;
      this.risoDaFonte = foraRiso;
      this.quedasDaFonte = foraQuedas;
    }
    for (const [alvo, dano] of soma) {
      if (!alvo.concentrating || alvo.dead || alvo.hp <= 0) continue;
      if (fora) fora.set(alvo, (fora.get(alvo) ?? 0) + dano);
      else this.concentrationCheck(alvo, dano);
    }
    for (const alvo of riso) {
      if (foraRiso) foraRiso.add(alvo);
      else this.repetirAoSofrerDano(alvo);
    }
  }

  /**
   * Dano de OUTRA fonte no meio de um golpe (os espinhos do empurrão, a
   * Repreensão Infernal, a chuva da Saraivada, cada dardo do Míssil): conta
   * sozinho, com o seu próprio teste de concentração.
   */
  outraFonte(fn) {
    const guardado = [this.danoDaFonte, this.risoDaFonte, this.quedasDaFonte];
    this.danoDaFonte = this.risoDaFonte = this.quedasDaFonte = null;
    try { this.umaFonteDeDano(fn); } finally {
      [this.danoDaFonte, this.risoDaFonte, this.quedasDaFonte] = guardado;
    }
  }

  /** Riso Histérico: cada dano sofrido dá um novo teste, com vantagem. */
  repetirAoSofrerDano(t) {
    if (t.dead || t.hp <= 0) return;
    for (const cond of [...(t.conditions ?? [])]) {
      if (!CONDITIONS[cond.id]?.repeteAoSofrerDano || !cond.data?.save) continue;
      const save = this.resistencia(t, cond.data.save, cond.data.dc, { vantagem: true });
      if (save.success) {
        removeCondition(t, cond.id);
        this.say('condicao', `${t.name} para de rir com o golpe.`);
      }
    }
  }

  concentrationCheck(actor, damage) {
    const dc = Math.max(10, Math.floor(damage / 2));
    const save = this.resistencia(actor, 'con', dc);
    const magia = actor.concentrating ? getSpell(actor.concentrating.spellId)?.name : null;
    // A CD é metade do dano (mínimo 10): sem dizer isso, o jogador não entende
    // por que um golpe forte derruba a concentração e um fraco não.
    const r = this.explicarResistencia(actor, 'con', dc, save, {
      contra: `manter ${magia ?? 'a concentração'} sob ${damage} de dano (CD = metade do dano, mínimo 10)`,
      seSucesso: `${magia ?? 'a magia'} continua de pé`,
    });
    if (save.success) {
      this.say('concentracao', `${actor.name} mantém a concentração.`, r.conta, { rolagem: r });
      return;
    }
    this.say('concentracao', `${actor.name} perde a concentração.`, r.conta, { rolagem: r });
    this.dropConcentration(actor);
  }

  /** Heroísmo e Aprimorar Atributo (Urso): os PV temporários vão junto com o efeito. */
  tirarPvTempDaCondicao(t, condId) {
    const pv = ['heroico', 'aprimorado'].includes(condId) ? getCondition(t, condId)?.data?.pvTemp ?? 0 : 0;
    if (pv && (t.tempHp ?? 0) <= pv) t.tempHp = 0;
  }

  dropConcentration(actor) {
    const conc = actor.concentrating;
    if (!conc) return;
    const caindo = [];
    const levitando = [];
    for (const t of conc.targets) {
      // Velocidade: quando acaba, o alvo perde o próximo turno (letargia).
      const depois = hasCondition(t, conc.condition) ? CONDITIONS[conc.condition]?.aoAcabar : null;
      // Heroísmo: os PV temporários dele vão embora junto.
      this.tirarPvTempDaCondicao(t, conc.condition);
      const voava = conc.condition === 'voando' && hasCondition(t, 'voando');
      const levitava = conc.condition === 'levitando' && hasCondition(t, 'levitando');
      removeCondition(t, conc.condition);
      if (voava) caindo.push(t);
      if (levitava) levitando.push(t);
      if (depois && !t.dead) {
        // Acabou no turno do lado dele: o fim deste turno não pode apagar a
        // letargia antes de ela valer no próximo.
        // Acabou no turno do lado dele: se ele já agiu, perde o PRÓXIMO (2);
        // se ainda não agiu, perde este mesmo (1). Nunca os dois.
        addCondition(t, depois, { rounds: this.side === t.side && t.acted ? 2 : 1 });
        this.say('condicao', `${t.name} fica letárgico: perde o próximo turno.`);
      }
    }
    actor.concentrating = null;
    // Quem perdeu o voo cai; a Queda Suave de um aliado pode amortecer.
    if (caindo.length) this.quedaDe(caindo);
    if (levitando.length) this.quedaDe(levitando, '2d6');
    // Conjurar Animais: as feras somem com a concentração.
    if (SPELLS[conc.spellId]?.kind === 'invocar') {
      this.dispensarInvocados((c) => c.invocado.donoId === actor.id && c.invocado.spellId === conc.spellId, 'a concentração acabou');
    }
    // A teia some, e quem ela prendia fica livre.
    if (conc.zona) this.desfazerZona(conc.zona);
    if (conc.aura) this.auras = this.auras.filter((a) => a !== conc.aura);
    if (actor.magiasAtivas?.[conc.spellId]) delete actor.magiasAtivas[conc.spellId];
  }

  // ---- magias --------------------------------------------------------------

  /**
   * O círculo em que a magia sai: o pedido, se houver espaço nele; senão o
   * menor círculo igual ou maior que o da magia com espaço livre. É isso que
   * deixa o bruxo — que só tem espaços do círculo do pacto — conjurar magia
   * de 1º círculo no 5º nível. `null` quando não há espaço nenhum.
   */
  circuloDeConjuracao(actor, spell, pedido = null) {
    if (spell.level === 0) return 0;
    const slots = actor.spellcasting?.slots ?? [];
    if (pedido != null) return pedido >= spell.level && slots[pedido] > 0 ? pedido : null;
    for (let n = spell.level; n < slots.length; n++) if (slots[n] > 0) return n;
    return null;
  }

  /**
   * Quantos alvos o jogador escolhe para esta magia, já com o círculo: os 3
   * aliados da Bênção (+1 por círculo acima), os dardos do Míssil Mágico.
   * As magias de alvo único devolvem 1.
   */
  alvosDaMagia(spell, circulo = spell.level, actor = null) {
    // Rajada Mística: um raio a mais no 5º, 11º e 17º nível.
    if (spell.raiosPorNivel) {
      const n = actor?.level ?? 1;
      return spell.raios + (n >= 5) + (n >= 11) + (n >= 17);
    }
    if (spell.kind === 'save' && spell.alvos) return spell.alvos;
    const acima = Math.max(0, (circulo ?? spell.level) - spell.level);
    if (spell.kind === 'auto') return spell.darts + (spell.upcast?.dardos ?? 0) * acima;
    if (spell.kind === 'raios') return spell.raios + (spell.upcast?.raios ?? 0) * acima;
    if (spell.kind === 'marca') return 1;
    if (spell.kind === 'healGrupo') return spell.targets;
    if (spell.kind === 'buff' || spell.kind === 'debuff') return (spell.targets ?? 1) + (spell.upcast?.alvos ?? 0) * acima;
    return 1;
  }

  /** A magia mira aliados (cura, bênção, armadura) ou inimigos? */
  miraAliados(spell) {
    return ['heal', 'buff', 'armadura', 'estabilizar', 'healGrupo', 'restaurar', 'reviver', 'curaReuso', 'frutos', 'rastro'].includes(spell.kind);
  }

  /**
   * Por que esta criatura NÃO serve de alvo desta magia; `null` se serve. A
   * mira do jogador e o tabuleiro perguntam aqui, para os dois nunca
   * discordarem do que `castSpell` aceita.
   */
  porqueNaoAlvo(actor, spell, alvo) {
    if (!alvo) return 'sem alvo';
    if (spell.kind === 'teleporte') return 'escolha uma casa vazia';
    // Revivificar é a única que mira um morto — e só um morto recente.
    if (spell.kind === 'reviver') {
      if (alvo.side !== actor.side) return 'escolha um aliado';
      if (alvo.invocado) return 'criaturas invocadas não voltam à vida';
      if (!alvo.dead) return `${alvo.name} não está morto`;
      if (this.round - (alvo.morreuNaRodada ?? -Infinity) > spell.janelaRodadas) return `${alvo.name} morreu há mais de 1 minuto`;
      if (distanceFt(actor.pos, alvo.pos) > spell.rangeFt) return 'é de toque: chegue ao lado';
      return null;
    }
    // Animar os Mortos também mira um corpo, mas de qualquer lado.
    if (spell.kind === 'animarMortos') {
      if (!alvo.dead) return `${alvo.name} não é um cadáver`;
      if (alvo.kind === 'pc') return 'os heróis não se erguem como mortos-vivos';
      if (alvo.invocado) return 'não sobra corpo de uma criatura invocada';
      if (alvo.reerguido) return 'este corpo já foi erguido uma vez';
      if ((alvo.tipo ?? 'humanoide') !== 'humanoide') return 'só cadáveres humanoides';
      if (!['pequeno', 'médio'].includes(alvo.size ?? 'médio')) return 'só cadáveres Pequenos ou Médios';
      if (distanceFt(actor.pos, alvo.pos) > spell.rangeFt) return 'é de toque: chegue perto do corpo';
      return null;
    }
    if (alvo.dead) return 'sem alvo';
    if (hasCondition(alvo, 'etereo')) return `${alvo.name} está no Plano Etéreo`;
    const aliado = alvo.side === actor.side;
    if (spell.kind === 'levitar') {
      if (!['miúdo', 'pequeno', 'médio'].includes(alvo.size ?? 'médio')) return 'pesado demais: a magia ergue só criatura Pequena ou Média';
      if (hasCondition(alvo, 'levitando')) return `${alvo.name} já levita`;
    }
    if (spell.kind !== 'dissipar' && !spell.ambosLados && this.miraAliados(spell) !== aliado) return this.miraAliados(spell) ? 'escolha um aliado' : 'escolha um inimigo';
    if (spell.naoEmSi && alvo === actor) return 'escolha outra criatura, não você';
    // Coroa da Loucura: a ação que a mantém só serve à criatura coroada.
    const mantida = spell.mantem ? actor.magiasAtivas?.[spell.id] : null;
    if (mantida?.alvoId && mantida.alvoId !== alvo.id) return 'a coroa está em outra criatura';
    if (spell.kind === 'buff' && hasCondition(alvo, 'inconsciente')) return `${alvo.name} está inconsciente`;
    if (spell.kind === 'heal' && ['morto-vivo', 'constructo'].includes(alvo.tipo)) return 'cura não funciona em morto-vivo nem em constructo';
    if (spell.kind === 'armadura' && (alvo.armor ?? 'nenhuma') !== 'nenhuma') return `${alvo.name} está de armadura`;
    if (spell.kind === 'estabilizar' && (!hasCondition(alvo, 'inconsciente') || alvo.stable)) return `${alvo.name} não está morrendo`;
    if (spell.kind === 'healGrupo' && ['morto-vivo', 'constructo'].includes(alvo.tipo)) return 'cura não funciona em morto-vivo nem em constructo';
    if (spell.kind === 'restaurar' && !spell.remove.some((id) => hasCondition(alvo, id))) {
      return spell.todas ? `${alvo.name} não está amaldiçoado` : `${alvo.name} não está cego, envenenado nem paralisado`;
    }
    // Personagem sem tipo declarado é humanoide (todos os heróis são).
    if (spell.soTipo && (alvo.tipo ?? 'humanoide') !== spell.soTipo) return `só funciona em ${spell.soTipo}`;
    if (spell.naoAfeta?.includes(alvo.tipo)) return `${alvo.tipo} não é afetado`;
    if (spell.kind === 'calor' && !this.carregaMetal(alvo)) return `${alvo.name} não veste nem empunha metal`;
    if (spell.kind === 'curaReuso') {
      if (distanceFt(actor.pos, alvo.pos) > spell.raioFt) return 'fora da aura';
      if (['morto-vivo', 'constructo'].includes(alvo.tipo)) return 'cura não funciona em morto-vivo nem em constructo';
      return null;
    }
    if (spell.intMinima && (alvo.abilities?.int ?? 10) < spell.intMinima) return 'inteligência baixa demais para ser afetado';
    // Raio de Bruxa já ativo: o arco está preso num alvo só.
    // Raio de Bruxa e Calor no Metal ativos: presos a um alvo só.
    const raio = spell.reusoAuto || spell.kind === 'calor' ? actor.magiasAtivas?.[spell.id] : null;
    if (raio?.alvoId && raio.alvoId !== alvo.id) return spell.kind === 'calor' ? 'o metal que arde é de outro alvo' : 'o arco está preso em outro alvo';
    // Arma Espiritual depois de conjurada: o alvo tem de estar a até 6 m da
    // arma (ela anda) mais 1,5 m (ela golpeia de perto).
    const arma = spell.kind === 'arma' ? actor.magiasAtivas?.[spell.id] : null;
    if (arma) {
      const d = distanceFt(arma.pos, alvo.pos);
      return d > spell.alcanceDaArmaFt ? `a arma está longe — ${d} pés, ela alcança ${spell.alcanceDaArmaFt}` : null;
    }
    if (spell.rangeFt > 0 && alvo !== actor) {
      const d = distanceFt(actor.pos, alvo.pos);
      if (d > spell.rangeFt) return `fora de alcance — ${d} pés, a magia chega a ${spell.rangeFt}`;
      if (!this.field.hasLineOfSight(actor.pos, alvo.pos)) return 'sem linha de visão';
    }
    return null;
  }

  /** A direção (uma das 8) mais próxima do ângulo de `de` até `para`. */
  direcaoDe(de, para) {
    if (!para || (para.x === de.x && para.y === de.y)) return { x: 0, y: 0 };
    const k = Math.round(Math.atan2(para.y - de.y, para.x - de.x) / (Math.PI / 4));
    return { x: Math.round(Math.cos(k * Math.PI / 4)), y: Math.round(Math.sin(k * Math.PI / 4)) };
  }

  /** Os quadrados que a magia pega, a partir do conjurador e do ponto mirado. */
  areaDaMagia(actor, spell, alvo, circulo = null) {
    if (!spell.shape) return null;
    // Névoa Obscurecente: +6 m de raio por círculo acima do 1º.
    const areaFt = spell.areaFt + (spell.upcast?.areaFt ?? 0) * Math.max(0, (circulo ?? spell.level) - spell.level);
    let casas;
    let origem;
    if (spell.centradoEmSi) alvo = actor.pos;
    // Muralha de Vento: uma reta de casas, centrada no ponto e de través para
    // o conjurador. A diagonal sai em degraus (duas casas por passo), porque
    // uma reta em diagonal deixa passar quem cruza no canto.
    if (spell.shape === 'muralha') {
      if (!alvo || this.field.blocksSight(alvo.x, alvo.y)) return [];
      const dir = this.direcaoDe(actor.pos, alvo);
      const lado = { x: -dir.y, y: dir.x };
      if (!lado.x && !lado.y) return [];
      const n = areaFt / 5;
      const vistos = new Set();
      const muro = [];
      const poe = (x, y) => {
        if (!this.field.inside(x, y) || this.field.blocksSight(x, y) || vistos.has(key(x, y))) return;
        vistos.add(key(x, y));
        muro.push({ x, y });
      };
      for (let i = -Math.floor((n - 1) / 2); i < n - Math.floor((n - 1) / 2); i++) {
        const x = alvo.x + lado.x * i;
        const y = alvo.y + lado.y * i;
        poe(x, y);
        if (lado.x && lado.y) poe(x + lado.x, y);
      }
      return muro;
    }
    if (spell.shape === 'sphere' || spell.shape === 'square') {
      if (!alvo) return null;
      // Ponto dentro da parede não tem área: vazava para o outro lado.
      if (this.field.blocksSight(alvo.x, alvo.y)) return [];
      // Bola de Fogo: o fogo se espalha pelos cantos, contado pelo caminho.
      if (spell.contornaEsquinas) return this.areaQueContorna(alvo, areaFt);
      casas = spell.shape === 'sphere' ? this.field.within(alvo, areaFt) : this.field.square(alvo, areaFt);
      origem = alvo;
    } else {
      // A direção é a das 8 mais próxima do ÂNGULO até o cursor: com o sinal
      // de cada eixo, qualquer cursor fora do eixo virava diagonal, e o cone
      // podia não conter a casa apontada.
      const dir = this.direcaoDe(actor.pos, alvo);
      casas = spell.shape === 'cone' ? this.field.cone(actor.pos, dir, areaFt) : this.field.cube(actor.pos, dir, areaFt);
      origem = actor.pos;
    }
    if (spell.shape === 'linha') {
      // Relâmpago: a reta que sai do conjurador na direção do cursor, com o
      // comprimento da magia; para na primeira parede.
      if (!alvo || (alvo.x === actor.pos.x && alvo.y === actor.pos.y)) return [];
      const dx = alvo.x - actor.pos.x;
      const dy = alvo.y - actor.pos.y;
      const passos = areaFt / 5;
      const n = Math.max(Math.abs(dx), Math.abs(dy));
      // Uma casa por passo no eixo maior, arredondando igual para os dois
      // lados: com Math.round puro, o meio-passo negativo voltava para a casa
      // do conjurador (o Relâmpago para oeste o acertava).
      const r = (v) => Math.sign(v) * Math.round(Math.abs(v));
      const linha = [];
      for (let i = 1; i <= passos; i++) {
        const casa = { x: actor.pos.x + r((dx * i) / n), y: actor.pos.y + r((dy * i) / n) };
        // Para na parede; caixote e carroça dão cobertura, não param o raio.
        if (!this.field.inside(casa.x, casa.y) || this.field.blocksSight(casa.x, casa.y)) break;
        const antes = linha[linha.length - 1] ?? actor.pos;
        if (!this.field.passa(antes.x, antes.y, casa.x, casa.y, 'visao')) break;
        linha.push(casa);
      }
      // Lufada de Vento: 3 m de largura são duas casas, a segunda ao lado.
      if (spell.larguraFt >= 10) {
        const norma = Math.hypot(dx, dy);
        const lado = { x: -dy / norma, y: dx / norma };
        const vistas = new Set(linha.map((c) => key(c.x, c.y)));
        for (const c of [...linha]) {
          const v = { x: c.x + r(lado.x), y: c.y + r(lado.y) };
          if (vistas.has(key(v.x, v.y)) || !this.field.inside(v.x, v.y) || this.field.blocksSight(v.x, v.y)) continue;
          vistas.add(key(v.x, v.y));
          linha.push(v);
        }
      }
      return linha;
    }
    // A área não atravessa parede: só as casas que a origem enxerga.
    return casas.filter((t) => this.field.hasLineOfSight(origem, t));
  }

  /**
   * A área de uma explosão que contorna esquinas: as casas a até `ft` pés de
   * CAMINHO da origem, sem atravessar o que bloqueia a visão nem cortar quina.
   */
  areaQueContorna(origem, ft) {
    const passos = ft / 5;
    const vistos = new Map([[key(origem.x, origem.y), 0]]);
    const fila = [{ x: origem.x, y: origem.y, d: 0 }];
    while (fila.length) {
      const cur = fila.shift();
      if (cur.d >= passos) continue;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const x = cur.x + dx;
          const y = cur.y + dy;
          if (!this.field.inside(x, y) || this.field.blocksSight(x, y)) continue;
          if (dx && dy && this.field.blocksSight(cur.x + dx, cur.y) && this.field.blocksSight(cur.x, cur.y + dy)) continue;
          if (!this.field.passa(cur.x, cur.y, x, y, 'visao')) continue;
          const k = key(x, y);
          if (vistos.has(k)) continue;
          vistos.set(k, cur.d + 1);
          fila.push({ x, y, d: cur.d + 1 });
        }
      }
    }
    return [...vistos.keys()].map((k) => { const [x, y] = k.split(',').map(Number); return { x, y }; });
  }

  /** Elfos e meio-elfos têm a ancestralidade feérica: magia não os põe para dormir. */
  imuneASonoMagico(c) {
    return c.tipo === 'morto-vivo' || /^(elf|meio-elf)/i.test(c.ancestry ?? '') || this.imuneACondicao(c, 'inconsciente');
  }

  /**
   * Quem a magia de área pega de verdade, e em que papel. É a MESMA conta
   * para o motor e para a prévia do tabuleiro — senão a prévia mente.
   *
   * - magia de resistência: toda criatura viva na área, uma vez só (a Grande
   *   ocupa várias casas); aliados que Esculpir Magias poupa saem marcados;
   * - Sono: só quem dorme (acordado, não morto-vivo, não elfo), em ordem de PV.
   */
  afetadosPelaArea(actor, spell, casas, circulo = spell.level) {
    // Zona inofensiva (Luz do Dia, Ilusão Menor, Crescer Plantas, Névoa, Escuridão): ninguém é "afetado".
    if (spell.soZona && spell.zona?.semTeste && !spell.dano && !spell.fimDano && !spell.danoPorPasso) return [];
    const vistos = [...new Set((casas ?? []).map((s) => this.at(s.x, s.y)))]
      .filter((c) => c && !c.dead && !(spell.centradoEmSi && c === actor));
    if (spell.kind === 'sleep') {
      // Borrifo de Cores cega em vez de pôr para dormir: elfo não escapa,
      // quem já está cego ou inconsciente não gasta a reserva.
      const fica = spell.cega
        ? (c) => !hasCondition(c, 'inconsciente') && !hasCondition(c, 'cego') && !this.imuneACondicao(c, 'cego')
        : (c) => !hasCondition(c, 'inconsciente') && !this.imuneASonoMagico(c);
      return vistos
        .filter(fica)
        .sort((a, b) => a.hp - b.hp)
        .map((c) => ({ c, papel: c.side === actor.side ? 'aliado' : 'inimigo' }));
    }
    // Acalmar Emoções só pega humanoide acordado: a prévia é a mesma conta do motor.
    if (spell.kind === 'acalmar') {
      return vistos
        .filter((c) => (c.tipo ?? 'humanoide') === 'humanoide' && !hasCondition(c, 'inconsciente'))
        .map((c) => ({ c, papel: c.side === actor.side ? 'aliado' : 'inimigo' }));
    }
    // Esculpir Magias: o mago escolhe quem poupa. Escolhe por ele os que mais
    // perdem com o golpe — menos PV primeiro —, e não a ordem das casas.
    const vagas = actor.features?.includes('sculptSpells') && spell.school === 'evocação' ? 1 + circulo : 0;
    // São OUTRAS criaturas que ele possa ver: nunca ele mesmo.
    const poupados = new Set(vistos.filter((c) => c.side === actor.side && c !== actor && this.veParaEsculpir(actor, c))
      .sort((a, b) => a.hp - b.hp).slice(0, vagas));
    return vistos.map((c) => {
      if (c.side !== actor.side) return { c, papel: 'inimigo' };
      return { c, papel: poupados.has(c) ? 'poupado' : 'aliado' };
    });
  }

  /** Esculpir Magias só poupa quem o mago vê. */
  veParaEsculpir(mago, c) {
    return !hasCondition(mago, 'cego') && !hasCondition(c, 'invisivel') && this.field.hasLineOfSight(mago.pos, c.pos);
  }

  /**
   * Checa TUDO antes de a magia sair: preparada, espaço, ação, alvo, alcance e
   * visão. Nenhum recurso é gasto aqui — é só a pergunta "dá para conjurar?".
   */
  canCast(actor, spellId, { target = null, point = null, circulo = null } = {}) {
    const spell = getSpell(spellId);
    if (!actor.spellcasting) return { ok: false, why: 'não conjura magias' };
    if (conditionEffects(actor).incapacitated) return { ok: false, why: 'incapacitado não conjura' };
    if (hasCondition(actor, 'etereo')) return { ok: false, why: 'está no Plano Etéreo' };
    // Silêncio: sem som não há verbal. Quem repete uma magia já em pé (o golpe é
    // só um gesto) passa, e a magia sem componente verbal (Ataque Certeiro) também.
    if (!(spell.reuso && actor.magiasAtivas?.[spellId]) && !spell.semVerbal
      && this.zonasEm(actor.pos).some((z) => z.silencio)) return { ok: false, why: 'dentro do Silêncio ninguém conjura' };
    if (actor.armorUntrained) return { ok: false, why: 'armadura sem treino impede conjurar' };
    // Só se conjura o que está pronto: truque conhecido, magia preparada ou
    // sempre preparada. Antes, o clérigo conjurava Míssil Mágico.
    if (!magiasProntas(actor).includes(spellId)) return { ok: false, why: `${spell.name} não está preparada` };
    // Oração de Cura leva 10 minutos: o combate não os tem.
    if (spell.soFora) return { ok: false, why: `${spell.name} é magia de utilidade: só fora de combate (explorando e conversando)` };
    if (spell.foraDeCombate) return { ok: false, why: `${spell.name} leva 10 minutos: só fora de combate, no descanso` };
    // De novo: a Arma Espiritual e o Toque Vampírico já conjurados golpeiam
    // sem espaço e sem contar como conjuração (a regra de ação bônus não vale).
    if (spell.kind === 'reacao') {
      const QUANDO = {
        dano: 'alguém fere você', acerto: 'um ataque ia acertar você', queda: 'você ou um aliado cai',
        conjuracao: 'um inimigo conjura uma magia',
      };
      return { ok: false, why: `${spell.name} é reação: sai sozinha quando ${QUANDO[spell.gatilho] ?? 'chega a hora'}` };
    }
    const ativa = spell.reuso && actor.magiasAtivas?.[spellId];
    if (ativa) {
      if (spell.reuso === 'bonus' && actor.bonusUsed) return { ok: false, why: 'a ação bônus deste turno já foi usada' };
      if (spell.reuso === 'acao' && actor.actionUsed) return { ok: false, why: 'a ação deste turno já foi usada' };
      if (spell.reuso === 'acao' && actor.acaoLimitada) return { ok: false, why: 'a ação da Velocidade não repete magia' };
      // Recuo Acelerado: correr de novo não pede alvo.
      if (spell.kind === 'disparada') return { ok: true, spell, circulo: ativa.circulo, reuso: true };
      // Lufada de Vento, Convocar Relâmpagos: o efeito vem de novo, no ponto
      // (ou para o lado) que se escolher, sem espaço.
      if (spell.sustenta) {
        const lado = spell.shape === 'linha';
        if (!point) return { ok: false, why: lado ? 'escolha para que lado' : 'escolha o ponto' };
        if (!this.areaDaMagia(actor, spell, point, ativa.circulo)?.length) {
          return { ok: false, why: lado ? 'escolha para que lado' : 'o ponto está dentro da parede' };
        }
        if (spell.rangeFt > 0) {
          const d = distanceFt(actor.pos, point);
          if (d > spell.rangeFt) return { ok: false, why: `fora de alcance — ${d} pés, a magia chega a ${spell.rangeFt}` };
          if (!this.field.hasLineOfSight(actor.pos, point)) return { ok: false, why: 'sem linha de visão até o ponto' };
        }
        return { ok: true, spell, circulo: ativa.circulo, reuso: true };
      }
      // Raio Lunar, Esfera Flamejante: mover a zona pede a casa de destino.
      if (spell.zona?.movel) {
        if (!point) return { ok: false, why: 'escolha para onde mover' };
        if (!this.field.inside(point.x, point.y) || this.field.blocksMove(point.x, point.y)) return { ok: false, why: 'casa bloqueada' };
        const de = ativa.zona.centro ?? point;
        if (spell.zona.dentroDoAlcance) {
          const d = distanceFt(actor.pos, point);
          if (d > spell.rangeFt) return { ok: false, why: `fora de alcance — ${d} pés, a magia chega a ${spell.rangeFt}` };
          if (!this.field.hasLineOfSight(actor.pos, point)) return { ok: false, why: 'sem linha de visão até o ponto' };
        }
        if (distanceFt(de, point) > spell.zona.movel) return { ok: false, why: `${spell.name} anda até ${spell.zona.movel} pés por vez` };
        if (spell.zona.ocupaCasa && this.at(point.x, point.y)) return { ok: false, why: 'a esfera precisa de uma casa vazia' };
        return { ok: true, spell, circulo: ativa.circulo, reuso: true };
      }
      // Aura de Vitalidade: curar pede um aliado na aura.
      if (spell.kind === 'curaReuso') {
        if (!target) return { ok: false, why: 'escolha um aliado na aura' };
        const porque = this.porqueNaoAlvo(actor, spell, target);
        if (porque) return { ok: false, why: porque };
        return { ok: true, spell, circulo: ativa.circulo, reuso: true };
      }
      // Levitação: a ação leva o levitante até 6 m, para uma casa livre que o conjurador veja.
      if (spell.kind === 'levitar') {
        const levitante = this.combatants.find((c) => c.id === ativa.alvoId && !c.dead && hasCondition(c, 'levitando'));
        if (!levitante) return { ok: false, why: 'ninguém levita agora' };
        if (!point) return { ok: false, why: 'escolha a casa para onde levar' };
        if (!this.field.inside(point.x, point.y) || this.field.blocksMove(point.x, point.y)) return { ok: false, why: 'casa bloqueada' };
        if (this.occupied(point.x, point.y, levitante)) return { ok: false, why: 'casa ocupada' };
        const d = distanceFt(levitante.pos, point);
        if (d > 20) return { ok: false, why: `a levitação leva até 20 pés (6 m) por ação — ${d} pés` };
        if (distanceFt(actor.pos, point) > spell.rangeFt) return { ok: false, why: 'fora de alcance' };
        if (!this.field.hasLineOfSight(actor.pos, point)) return { ok: false, why: 'sem linha de visão até a casa' };
        return { ok: true, spell, circulo: ativa.circulo, reuso: true };
      }
      if (!target) return { ok: false, why: 'escolha um alvo' };
      // Bruxaria e Marca do Caçador só mudam de alvo quando o marcado cai.
      if (spell.kind === 'marca') {
        const marcado = this.combatants.find((c) => !c.dead && getCondition(c, spell.condition)?.source === actor.id);
        if (marcado) return { ok: false, why: `${marcado.name} ainda carrega a ${spell.name}: ela só passa para outro quando ele cair` };
      }
      const porque = this.porqueNaoAlvo(actor, spell, target);
      if (porque) return { ok: false, why: porque };
      if (spell.reusoAuto && distanceFt(actor.pos, target.pos) > spell.rangeFt) return { ok: false, why: 'o alvo saiu do alcance do arco' };
      return { ok: true, spell, circulo: ativa.circulo, reuso: true };
    }
    let slot = this.circuloDeConjuracao(actor, spell, circulo);
    // Iniciado em Magia: a magia do talento sai uma vez sem espaço.
    const gratis = slot === null && temUsoGratis(actor, spellId);
    if (gratis) slot = spell.level;
    if (slot === null) {
      return { ok: false, why: circulo ? `sem espaço de ${circulo}º círculo` : `sem espaço de magia de ${spell.level}º círculo ou maior` };
    }
    if (spell.castTime === 'action' && actor.actionUsed) return { ok: false, why: 'a ação deste turno já foi usada' };
    if (spell.castTime === 'bonus' && actor.bonusUsed) return { ok: false, why: 'a ação bônus deste turno já foi usada' };
    if (spell.castTime === 'action' && actor.acaoLimitada) return { ok: false, why: 'a ação da Velocidade não conjura magia' };
    // Magia de ação bônus no turno: além dela, só um truque de 1 ação.
    const ja = actor.magiasNoTurno ?? [];
    const truqueDeAcao = spell.level === 0 && spell.castTime === 'action';
    if (ja.some((m) => m.castTime === 'bonus') && !truqueDeAcao) {
      return { ok: false, why: 'depois de uma magia de ação bônus, só um truque de 1 ação neste turno' };
    }
    if (spell.castTime === 'bonus' && ja.some((m) => !(m.level === 0 && m.castTime === 'action'))) {
      return { ok: false, why: 'magia de ação bônus não sai no turno em que já saiu outra magia (só junto de um truque de 1 ação)' };
    }

    const precisaAlvo = ['attack', 'auto', 'heal', 'armadura', 'estabilizar', 'raios', 'restaurar', 'reviver', 'arma', 'vampirico', 'marca', 'mira', 'calor', 'ampliar', 'levitar', 'animarMortos'].includes(spell.kind)
      || (spell.kind === 'save' && !spell.shape);
    if (precisaAlvo && !target) return { ok: false, why: 'escolha um alvo' };
    if (spell.naoEmSi && target === actor) return { ok: false, why: 'escolha outra criatura, não você' };
    // Dissipar Magia mira uma criatura (de qualquer lado) ou uma casa de zona.
    if (spell.kind === 'dissipar') {
      if (target) {
        const porque = this.porqueNaoAlvo(actor, spell, target);
        if (porque) return { ok: false, why: porque };
      } else if (!point || !this.zonaNoPonto(point)) {
        return { ok: false, why: 'escolha uma criatura ou uma casa de zona' };
      }
    }
    if (['restaurar', 'reviver', 'arma', 'vampirico', 'marca', 'calor', 'ampliar', 'levitar', 'animarMortos'].includes(spell.kind)
      || (target && spell.kind !== 'heal' && (spell.soTipo || spell.naoAfeta || spell.intMinima))) {
      const porque = this.porqueNaoAlvo(actor, spell, target);
      if (porque) return { ok: false, why: porque };
      // De toque: distância já checada; o resto (linha de visão) vale igual.
      if (spell.kind === 'reviver' || spell.kind === 'animarMortos') return { ok: true, spell, circulo: slot, gratis };
    }
    if (spell.kind === 'teleporte') {
      if (!point) return { ok: false, why: 'escolha a casa de chegada' };
      if (!this.field.inside(point.x, point.y) || this.field.blocksMove(point.x, point.y)) return { ok: false, why: 'casa bloqueada' };
      if (this.at(point.x, point.y)) return { ok: false, why: 'casa ocupada' };
    }
    if (spell.kind === 'armadura' && (target.armor ?? 'nenhuma') !== 'nenhuma') {
      return { ok: false, why: `${target.name} está de armadura — a magia só vale sem` };
    }
    if (spell.kind === 'estabilizar' && (!hasCondition(target, 'inconsciente') || target.stable || target.dead)) {
      return { ok: false, why: `${target.name} não está morrendo` };
    }
    if (spell.kind === 'heal' && ['morto-vivo', 'constructo'].includes(target.tipo)) {
      return { ok: false, why: 'cura não funciona em morto-vivo nem em constructo' };
    }
    if (['cone', 'cube', 'linha', 'muralha'].includes(spell.shape) && !this.areaDaMagia(actor, spell, point ?? target?.pos)?.length) {
      return { ok: false, why: 'escolha para que lado' };
    }

    const dest = target?.pos ?? point;
    if (point && (spell.shape === 'sphere' || spell.shape === 'square') && this.field.blocksSight(point.x, point.y)) {
      return { ok: false, why: 'o ponto está dentro da parede' };
    }
    // Esfera Flamejante: aparece numa casa vazia.
    if (point && spell.zona?.ocupaCasa && this.at(point.x, point.y)) return { ok: false, why: spell.zona.ilusao ? 'a imagem precisa de uma casa livre' : 'a esfera precisa de uma casa vazia' };
    if (point && spell.zona?.ilusao && this.field.blocksMove(point.x, point.y)) return { ok: false, why: 'a casa está bloqueada' };
    // Cone e cubo saem do próprio conjurador (alcance 0): não há distância a
    // checar.
    if (dest && spell.rangeFt > 0) {
      const d = distanceFt(actor.pos, dest);
      if (d > spell.rangeFt) {
        return { ok: false, why: `fora de alcance — ${d} pés, a magia chega a ${spell.rangeFt}` };
      }
      if (!this.field.hasLineOfSight(actor.pos, dest)) {
        return { ok: false, why: 'sem linha de visão até o alvo' };
      }
    }
    return { ok: true, spell, circulo: slot, gratis };
  }

  castSpell(actor, spellId, { target = null, point = null, circulo = null, targets = null, opcao = null } = {}) {
    const check = this.canCast(actor, spellId, { target, point, circulo });
    if (!check.ok) return { ok: false, why: check.why };
    const spell = check.spell;
    const slot = check.circulo;
    const acima = Math.max(0, slot - spell.level);
    if (check.reuso) return this.reusarMagia(actor, spell, target, slot, point);
    // Aumentar num aliado não é ato hostil; Reduzir num inimigo é.
    const hostil = !this.miraAliados(spell) && spell.kind !== 'buff' && spell.kind !== 'tempHp'
      && !['invocar', 'animarMortos'].includes(spell.kind)
      && !(['ampliar', 'levitar'].includes(spell.kind) && target?.side === actor.side);
    if (hostil) this.quebraInvisibilidade(actor);
    // Santuário acaba quando o protegido conjura contra um inimigo.
    if (hasCondition(actor, 'santuario') && hostil) {
      removeCondition(actor, 'santuario');
      this.say('magia', `${actor.name} conjura contra o inimigo e perde o Santuário.`);
    }
    if (spell.castTime === 'action') actor.actionUsed = true;
    if (spell.castTime === 'bonus') actor.bonusUsed = true;
    if (check.gratis) gastarUsoGratis(this, actor);
    else if (spell.level > 0) actor.spellcasting.slots[slot] -= 1;
    (actor.magiasNoTurno ??= []).push({ level: spell.level, castTime: spell.castTime });
    // Contramágica: um inimigo atento pode interromper a magia antes de ela sair.
    if (this.tentarContramagia(actor, spell, slot)) {
      this.afterAction(actor);
      this.checkEnd();
      return { ok: true, anulada: true };
    }
    // Uma concentração por vez: a nova derruba a velha antes de tudo.
    if (spell.concentration) this.dropConcentration(actor);

    const dc = spellSaveDc(actor);
    const atkBonus = spellAttackBonus(actor);
    const mod = spellMod(actor);
    // Truque cresce com o nível; magia de círculo, com o espaço gasto.
    const dano = dadosDaMagia(spell, { nivel: actor.level ?? 1, circulo: slot });
    this.say('magia', `${actor.name} conjura ${spell.name}${acima ? ` no ${slot}º círculo` : ''}.`);

    // Área afetada, para a camada de desenho marcar os quadrados.
    const areaTiles = this.areaDaMagia(actor, spell, point ?? target?.pos, slot);

    // Alvos de magia de bônus são escolhidos aqui, antes do evento, para a
    // camada de desenho poder marcar cada um sem recalcular a regra. Quem
    // chama pode escolher (`targets`); sem escolha, vão os mais próximos.
    // `debuff` escolhe do outro lado e pede linha de visão; inclui inimigo
    // caído — ele ainda pode levar Perdição e acordar com ela.
    const quantos = (spell.targets ?? 0) + (spell.upcast?.alvos ?? 0) * acima;
    const perto = (lista) => lista.slice().sort((a, b) => distanceFt(actor.pos, a.pos) - distanceFt(actor.pos, b.pos));
    const buffTargets = spell.kind === 'buff'
      ? (targets ?? perto(this.alliesOf(actor).concat([actor])))
        // Farol de Esperança vale para quem está caído: é o teste de morte dele.
        .filter((a) => a.side === actor.side && !a.dead && distanceFt(actor.pos, a.pos) <= spell.rangeFt
          && !(spell.naoEmSi && a === actor)
          && (spell.id === 'farolDeEsperanca' || spell.pvMax || !hasCondition(a, 'inconsciente')))
        .slice(0, quantos)
      : spell.kind === 'healGrupo'
        // Cura em grupo pega também quem está caído: é para isso que ela existe.
        ? (targets ?? perto(this.alliesOf(actor).concat([actor])).filter((a) => a.hp < a.maxHp))
          .filter((a) => !this.porqueNaoAlvo(actor, spell, a))
          .slice(0, spell.targets)
        : spell.kind === 'debuff'
          ? this.dentroDoCubo(spell, (targets ?? perto(this.enemiesOf(actor)))
            .filter((e) => e.side !== actor.side && !e.dead && distanceFt(actor.pos, e.pos) <= spell.rangeFt
              && this.field.hasLineOfSight(actor.pos, e.pos)
              && (!spell.soTipo || (e.tipo ?? 'humanoide') === spell.soTipo)
              && !spell.naoAfeta?.includes(e.tipo)
              && (!spell.intMinima || (e.abilities?.int ?? 10) >= spell.intMinima)))
            .slice(0, quantos)
          : null;

    // `dardos`: onde cada dardo do Míssil Mágico cai, para o desenho mandar
    // cada um ao seu alvo.
    const dardos = spell.kind === 'auto' || spell.kind === 'raios' || (spell.kind === 'save' && spell.alvos)
      ? (targets?.length ? targets : [target]).filter((t) => t && !this.porqueNaoAlvo(actor, spell, t))
      : null;
    this.onEvent({ type: 'spell', caster: actor, spell, target, point, areaTiles, buffTargets, circulo: slot, dardos });

    switch (spell.kind) {
      case 'attack': {
        if (!target) break;
        // Orbe Cromático: o tipo que mais fere ESTE alvo (imunidade, resistência).
        const comoSai = spell.tiposAEscolher
          ? { ...spell, damageType: [...spell.tiposAEscolher].sort((a, b) => this.danoPorTipo(target, 10, b, true) - this.danoPorTipo(target, 10, a, true))[0] }
          : spell;
        const causado = this.ataqueMagico(actor, target, comoSai, dano, dc, { slot });
        // Flecha Ácida: errou, metade do dano inicial; acertou, mais ácido no
        // fim do próximo turno do alvo.
        if (spell.danoAtrasado && !target.dead) {
          if (causado > 0) {
            const depois = dadosDaMagia(spell, { circulo: slot, notacao: spell.danoAtrasado });
            this.aplicarCondicao(target, 'acidoAtrasado', { rounds: 1, source: actor.id, data: { dano: depois } });
          } else {
            const r = damageRoll(this.rng, dano);
            const metade = Math.floor(r.total / 2);
            this.say('magia', `O ácido respinga em ${target.name} mesmo assim: ${metade}.`, `${dano}[${r.rolls.join('+')}] → metade`);
            this.applyDamage(target, metade, spell.damageType, actor, { magico: true });
          }
        }
        // Raio do Enfraquecimento: a concentração segura a condição de quem foi atingido.
        if (spell.concentration && !spell.reusoAuto && causado > 0 && spell.applies) {
          actor.concentrating = { spellId: spell.id, condition: spell.applies.condition, targets: [target], rounds: spell.duracaoRodadas };
        }
        // Raio de Bruxa: só prende o arco se acertou; aí vem a concentração.
        if (spell.reusoAuto && causado > 0) {
          actor.concentrating = { spellId: spell.id, condition: null, targets: [], rounds: spell.duracaoRodadas };
          (actor.magiasAtivas ??= {})[spell.id] = { circulo: slot, rodadas: null, alvoId: target.id, usadoNoTurno: true };
        }
        break;
      }

      case 'marca': {
        this.aplicarCondicao(target, spell.condition, { source: actor.id, magia: { id: spell.id, circulo: slot } });
        actor.concentrating = { spellId: spell.id, condition: spell.condition, targets: [target], rounds: spell.duracaoRodadas };
        (actor.magiasAtivas ??= {})[spell.id] = { circulo: slot, rodadas: null };
        this.say('magia', `${target.name} fica marcado por ${spell.name}.`);
        break;
      }

      // Ataque Certeiro: o próximo ataque seu contra ele tem vantagem.
      case 'mira': {
        this.aplicarCondicao(target, 'alvoCerteiro', { source: actor.id, rounds: 2, lado: actor.side, quando: 'fim', magia: { id: spell.id, circulo: slot } });
        actor.concentrating = { spellId: spell.id, condition: 'alvoCerteiro', targets: [target], rounds: 2 };
        this.say('magia', `${actor.name} lê as defesas de ${target.name}.`);
        break;
      }

      // Lâmina Flamejante e Aura de Vitalidade: conjurar só põe de pé; o
      // golpe (ação) ou a cura (bônus) vêm depois, sem espaço.
      case 'lamina':
      case 'curaReuso': {
        actor.concentrating = { spellId: spell.id, condition: null, targets: [], rounds: spell.duracaoRodadas };
        const dados = spell.kind === 'lamina'
          ? dadosDaMagia(spell, { circulo: spell.level }).replace(/^(\d+)d/, (_, n) => `${Number(n) + Math.floor(acima / 2)}d`)
          : dadosDaMagia(spell, { circulo: slot, notacao: spell.heal });
        (actor.magiasAtivas ??= {})[spell.id] = { circulo: slot, rodadas: null, dano: dados };
        this.say('magia', spell.kind === 'lamina' ? `Uma lâmina de fogo acende na mão de ${actor.name}.` : `Uma aura de vitalidade envolve ${actor.name}.`);
        break;
      }

      // Calor no Metal: o metal que o alvo veste ou empunha arde.
      case 'calor': {
        actor.concentrating = { spellId: spell.id, condition: 'metalQuente', targets: [target], rounds: spell.duracaoRodadas };
        (actor.magiasAtivas ??= {})[spell.id] = { circulo: slot, rodadas: null, dano, alvoId: target.id };
        this.metalQuente(actor, target, spell, dano, dc);
        break;
      }

      case 'disparada': {
        actor.concentrating = { spellId: spell.id, condition: null, targets: [], rounds: spell.duracaoRodadas };
        (actor.magiasAtivas ??= {})[spell.id] = { circulo: slot, rodadas: null };
        actor.movementLeftFt += this.speedOf(actor);
        this.say('magia', `${actor.name} dispara: +${this.speedOf(actor)} pés de deslocamento.`);
        break;
      }

      case 'save': {
        const { presos, zona } = this.resolverSave(actor, spell, { target, targets, point, areaTiles, slot, dc, dano, opcao });
        // Concentração (Medo, Padrão Hipnótico, Teia): segura quem falhou; a
        // teia fica de pé mesmo sem ninguém preso. `sustenta` (Lufada de Vento,
        // Convocar Relâmpagos) também: o efeito volta nos turnos seguintes.
        if (spell.concentration) {
          actor.concentrating = {
            spellId: spell.id, condition: spell.onFail?.condition === 'caido' ? null : spell.onFail?.condition, targets: presos,
            rounds: spell.duracaoRodadas ?? null, zona,
          };
          if (zona) zona.concentracao = actor.id;
          if (spell.sustenta) (actor.magiasAtivas ??= {})[spell.id] = { circulo: slot, rodadas: null };
          else if (!presos.length && !zona) this.dropConcentration(actor);
        }
        break;
      }

      case 'auto': {
        // Cada dardo vai num alvo à escolha (`targets`); sem escolha, todos no
        // alvo mirado.
        // Cada alvo escolhido tem de estar ao alcance e à vista.
        const alvos = (targets?.length ? targets : target ? [target] : [])
          .filter((t) => !this.porqueNaoAlvo(actor, spell, t));
        if (!alvos.length) break;
        const dardos = spell.darts + (spell.upcast?.dardos ?? 0) * acima;
        const porAlvo = new Map();
        for (let i = 0; i < dardos; i++) {
          const alvo = alvos[i % alvos.length];
          const d = damageRoll(this.rng, spell.damage);
          porAlvo.set(alvo, [...(porAlvo.get(alvo) ?? []), d.total]);
        }
        // "Automática" é a razão de ser desta magia: não há rolagem de ataque
        // nem resistência, então nem CA alta nem vantagem mudam nada. Sem dizer
        // isso, o jogador não sabe que tem aqui a resposta para o alvo blindado.
        for (const [alvo, rolls] of porAlvo) {
          if ((alvo.conditions ?? []).some((c) => CONDITIONS[c.id]?.bloqueiaMissil)) {
            this.say('magia', `O Escudo Arcano de ${alvo.name} absorve os dardos.`);
            continue;
          }
          const total = rolls.reduce((a, b) => a + b, 0);
          const conta = `${rolls.length}× ${spell.damage} [${rolls.join(' + ')}] = ${total} · automática: não há rolagem de ataque nem de resistência`;
          this.say('magia', `${rolls.length} dardo${rolls.length > 1 ? 's' : ''} atinge${rolls.length > 1 ? 'm' : ''} ${alvo.name}: ${total} de ${spell.damageType}.`, conta, {
            rolagem: {
              categoria: 'automatica', rotulo: spell.name, actor, target: alvo,
              danoTotal: total, parcelas: rolls, tipoDeDano: spell.damageType, conta,
            },
          });
          // Cada dardo é uma fonte de dano: um teste de concentração por dardo,
          // e a resistência reduz dardo a dardo. O registro sai somado.
          for (const d of rolls) this.outraFonte(() => this.applyDamage(alvo, d, spell.damageType, actor, { magico: true }));
        }
        break;
      }

      case 'heal': {
        if (!target) break;
        const dados = dadosDaMagia(spell, { circulo: slot, notacao: spell.heal });
        const r = this.rolarCuraPara(target, dados, actor);
        let amount = r.total + (spell.addSpellMod ? mod : 0);
        // Discípulo da Vida: +2 + círculo do espaço gasto em cada cura de 1º
        // círculo ou maior.
        if (actor.features?.includes('discipleOfLife') && spell.level > 0) amount += 2 + slot;
        const healed = this.heal(target, amount, actor);
        this.say('cura', `${target.name} recupera ${healed} PV.`, `${dados}[${r.rolls.join('+')}]${spell.addSpellMod ? ` + ${mod}` : ''}`);
        break;
      }

      case 'buff': {
        const picks = buffTargets ?? [];
        if (spell.concentration) {
          this.dropConcentration(actor);
          actor.concentrating = { spellId: spell.id, condition: spell.condition, targets: picks, rounds: spell.duracaoRodadas ?? null };
        }
        // Luz: a luz fica numa criatura só; conjurar noutra tira da anterior.
        if (spell.umaPorVez) {
          for (const o of this.combatants) {
            if (!picks.includes(o) && getCondition(o, spell.condition)?.source === actor.id) removeCondition(o, spell.condition);
          }
        }
        for (const a of picks) {
          // Ajuda: PV máximo e atual sobem; conjurar de novo não empilha.
          if (spell.pvMax) {
            const mais = spell.pvMax + (spell.upcast?.fixo ?? 0) * acima;
            const ja = getCondition(a, spell.condition)?.data?.pv ?? 0;
            if (mais > ja) {
              a.maxHp += mais - ja;
              // Pela cura: quem estava caído a 0 PV levanta.
              this.heal(a, mais - ja, actor);
              addCondition(a, spell.condition, { source: actor.id, data: { pv: mais } });
            }
            continue;
          }
          // Aprimorar Atributo: vantagem nos testes de um atributo; o Urso dá PV temporários.
          if (spell.escolheAtributo) {
            const op = this.opcaoDeAprimorar(a, opcao);
            const info = APRIMORAR[op];
            let pv = 0;
            if (info.pv) {
              pv = roll(this.rng, info.pv).total;
              a.tempHp = Math.max(a.tempHp ?? 0, pv);
            }
            addCondition(a, spell.condition, { source: actor.id, magia: { id: spell.id, circulo: slot }, data: { hab: info.hab, opcao: op, pvTemp: pv } });
            this.say('magia', `${info.nome} em ${a.name}: vantagem nos testes de ${ABILITY_NAME[info.hab]}${pv ? ` e ${pv} PV temporários` : ''}.`);
            continue;
          }
          // Proteção contra Energia e Arma Elemental: o jogo escolhe o tipo.
          const tipo = spell.escolheTipo ? this.tipoParaEscolher(actor, spell) : null;
          if (tipo) this.say('magia', `${spell.name} em ${a.name}: ${tipo}.`);
          for (const id of CONDITIONS[spell.condition]?.removeAoReceber ?? []) removeCondition(a, id);
          // Duração sem concentração, contada no turno de quem conjurou.
          const duracao = spell.rodadasProprias
            ? { rounds: spell.rodadasProprias, lado: actor.side, quando: 'fim' }
            : {};
          // Arma Mágica (+2 no 4º, +3 no 6º) e Arma Elemental (+2/2d4 no 5º, +3/3d4 no 7º).
          const bonusArma = Object.entries(spell.escalaBonus ?? {}).reduce((b, [c, v]) => (slot >= Number(c) ? v : b), spell.escalaBonus ? 1 : undefined);
          addCondition(a, spell.condition, {
            source: actor.id, ...duracao, magia: { id: spell.id, circulo: slot },
            data: { dc, pvTemp: mod, n: spell.imagens ?? 0, tipo, circulo: slot, bonusArma, dadosNoAcerto: bonusArma ? `${bonusArma}d4` : undefined },
          });
          // Passos Largos vale já neste turno, não só no próximo.
          if (CONDITIONS[spell.condition]?.speedBonusFt && a.side === this.side) a.movementLeftFt += CONDITIONS[spell.condition].speedBonusFt;
          // Voo vale já neste turno: o deslocamento sobe para 18 m.
          if (spell.condition === 'voando' && a.side === this.side) a.movementLeftFt += Math.max(0, CONDITIONS.voando.vooFt - a.speedFt);
          // Velocidade no turno do próprio lado: a ação a mais já vale agora.
          if (spell.condition === 'acelerado' && a.side === this.side) {
            a.acaoVelozDisponivel = true;
            a.movementLeftFt += this.speedOf(a) / 2;
          }
          // Heroísmo tira o medo que já estava lá.
          for (const id of CONDITIONS[spell.condition]?.imuneA ?? []) removeCondition(a, id);
        }
        this.say('magia', `${spell.name} em ${picks.map((p) => p.name).join(', ')}${spell.pvMax ? ` (+${spell.pvMax + (spell.upcast?.fixo ?? 0) * acima} PV)` : ''}.`);
        break;
      }

      // O espelho do `buff`: mesma estrutura, mas o alvo RESISTE e os alvos
      // são inimigos. Escrito ao lado dele de propósito — ler os dois juntos
      // é o que impede um ganhar um comportamento que o outro não tem.
      case 'debuff': {
        const picks = (buffTargets ?? []).filter((t) => t && !t.dead);
        if (!picks.length) { this.say('aviso', `${spell.name} não pegou ninguém.`); break; }
        if (spell.concentration) {
          this.dropConcentration(actor);
          actor.concentrating = { spellId: spell.id, condition: spell.condition, targets: [], rounds: spell.duracaoRodadas ?? null };
        }
        const pegos = [];
        for (const t of picks) {
          // Enfeitiçar Pessoa: quem está lutando com você testa com vantagem.
          const save = this.resistencia(t, spell.save, dc, { vantagem: !!spell.vantagemEmCombate });
          const r = this.explicarResistencia(t, spell.save, dc, save, {
            contra: `${spell.name} de ${actor.name}`,
            seSucesso: `resiste a ${spell.name}`,
          });
          if (save.success) {
            this.say('magia', `${t.name} resiste a ${spell.name}.`, r.conta, { rolagem: r });
            continue;
          }
          // Condição que incapacita (paralisado) derruba a concentração DO
          // ALVO: por isso `aplicarCondicao`, não `addCondition`.
          const posta = this.aplicarCondicao(t, spell.condition, {
            source: actor.id,
            magia: { id: spell.id, circulo: slot },
            rounds: spell.concentration ? Infinity : (spell.duracaoRodadas ?? Infinity),
            data: spell.repete ? { save: spell.save, dc, repete: spell.repete } : { dc },
          });
          if (!posta) {
            this.say('magia', `${t.name} é imune a ${spell.name}.`);
            continue;
          }
          // Riso Histérico também derruba.
          for (const id of spell.tambem ?? []) addCondition(t, id);
          if (conditionEffects(t).semReacao) t.reactionUsed = true;
          pegos.push(t);
          this.say('condicao', `${t.name} fica sob ${spell.name}.`, r.conta, { rolagem: r });
        }
        // A concentração segura só quem FALHOU: manter na lista quem resistiu
        // faria a magia "soltar" de alguém que nunca esteve preso.
        if (spell.concentration && actor.concentrating) actor.concentrating.targets = pegos;
        // Coroa da Loucura: a ação do conjurador mantém a coroa a cada turno.
        if (spell.mantem && pegos.length) {
          (actor.magiasAtivas ??= {})[spell.id] = { circulo: slot, rodadas: null, alvoId: pegos[0].id, usadoNoTurno: true };
        }
        // Só solta a concentração se ela era DESTA magia: Cegueira resistida
        // não pode derrubar a Teia que o mago já mantinha.
        if (!pegos.length && spell.concentration) this.dropConcentration(actor);
        break;
      }

      case 'sleep': {
        const center = point ?? target?.pos;
        if (!center) break;
        // Dois dados a mais na reserva por círculo acima do 1º.
        const pool = roll(this.rng, spell.pool);
        let left = pool.total;
        const partes = [`${spell.pool}[${pool.rolls.join('+')}]`];
        for (let i = 0; i < acima; i++) {
          const mais = roll(this.rng, spell.upcast.reserva);
          left += mais.total;
          partes.push(`${spell.upcast.reserva}[${mais.rolls.join('+')}]`);
        }
        // Mortos-vivos não dormem, e elfos e meio-elfos têm a ancestralidade
        // feérica: não gastam o total (`afetadosPelaArea`, a conta da prévia).
        const inArea = this.afetadosPelaArea(actor, spell, this.areaDaMagia(actor, spell, center)).map((x) => x.c);
        this.say('magia', `${spell.name} acumula ${left} PV.`, partes.join(' + '));
        for (const c of inArea) {
          if (c.hp > left) break;
          left -= c.hp;
          // Um minuto, ou até sofrer dano (`applyDamage` acorda quem tem a
          // marca do sono). Acorda caído: o `caido` fica até ele se levantar.
          if (spell.cega) {
            // Até o fim do seu próximo turno (do conjurador).
            this.aplicarCondicao(c, 'cego', { rounds: 2, source: actor.id, lado: actor.side, quando: 'fim', magia: { id: spell.id, circulo: slot } });
            this.say('condicao', `${c.name} fica cego pelas cores.`);
            continue;
          }
          this.aplicarCondicao(c, 'inconsciente', { rounds: 10, source: 'sono', magia: { id: spell.id, circulo: slot } });
          addCondition(c, 'caido');
          c.acted = true;
          this.say('condicao', `${c.name} adormece.`);
        }
        break;
      }

      case 'armadura': {
        target.armaduraArcana = true;
        target.ac = armorClass(target);
        this.say('magia', `${target.name} fica envolto em força arcana: CA ${target.ac}.`);
        break;
      }

      case 'tempHp': {
        // PV temporários não somam: fica o maior.
        const r = /^\d+$/.test(spell.tempHp) ? { total: Number(spell.tempHp), rolls: [spell.tempHp] } : roll(this.rng, spell.tempHp);
        const total = r.total + (spell.upcast?.fixo ?? 0) * acima;
        actor.tempHp = Math.max(actor.tempHp ?? 0, total);
        // Armadura de Agathys: o frio que devolve sobe junto com o círculo.
        if (spell.condition) addCondition(actor, spell.condition, { source: actor.id, data: { dano: total }, magia: { id: spell.id, circulo: slot } });
        this.say('magia', `${actor.name} ganha ${total} PV temporários.`, `${spell.tempHp}[${r.rolls.join('+')}]${acima ? ` + ${spell.upcast.fixo * acima}` : ''}`);
        break;
      }

      case 'estabilizar': {
        target.stable = true;
        this.say('cura', `${actor.name} estabiliza ${target.name} com ${spell.name}.`, 'sem teste de Medicina');
        this.onEvent({ type: 'stabilized', target, by: actor });
        break;
      }

      // Raio Ardente: um ataque por raio, cada um no alvo escolhido para ele.
      case 'raios': {
        const alvos = (targets?.length ? targets : target ? [target] : []).filter((t) => !this.porqueNaoAlvo(actor, spell, t));
        const n = this.alvosDaMagia(spell, slot, actor);
        // Explosão Agonizante (invocação do bruxo): soma CAR em cada raio da Rajada.
        const agonizante = spell.id === 'rajadaMistica' && actor.features?.includes('agonizingBlast') ? mod : 0;
        for (let i = 0; i < n && alvos.length; i++) {
          const alvo = alvos[i % alvos.length];
          if (alvo.dead) continue;
          this.ataqueMagico(actor, alvo, spell, dano, dc, { bonusDano: agonizante });
        }
        break;
      }

      case 'healGrupo': {
        const dados = dadosDaMagia(spell, { circulo: slot, notacao: spell.heal });
        for (const a of buffTargets ?? []) {
          const r = this.rolarCuraPara(a, dados, actor);
          let amount = r.total + (spell.addSpellMod ? mod : 0);
          if (actor.features?.includes('discipleOfLife')) amount += 2 + slot;
          const curado = this.heal(a, amount, actor);
          this.say('cura', `${a.name} recupera ${curado} PV.`, `${dados}[${r.rolls.join('+')}]${spell.addSpellMod ? ` + ${mod}` : ''}`);
        }
        break;
      }

      case 'restaurar': {
        // Remover Maldição (`todas`): toda condição da lista; as outras tiram só a primeira.
        const ids = spell.todas ? spell.remove.filter((c) => hasCondition(target, c)) : [spell.remove.find((c) => hasCondition(target, c))];
        for (const id of ids) {
          removeCondition(target, id);
          this.say('cura', spell.todas ? `${spell.name}: ${target.name} se livra de ${CONDITIONS[id].name.toLowerCase()}.` : `${target.name} não está mais ${CONDITIONS[id].name.toLowerCase()}.`);
          // Quem mantinha a maldição (concentração) a perde se não restar ninguém.
          if (spell.todas) this.soltouDaConcentracao(target, id);
        }
        break;
      }

      // Passo Nebuloso: some e aparece. Não passa pelas casas do meio, então
      // ninguém tem ataque de oportunidade.
      case 'teleporte': {
        const de = { ...actor.pos };
        actor.pos = { x: point.x, y: point.y, f: actor.pos.f ?? 1 };
        this.say('magia', `${actor.name} reaparece a ${distanceFt(de, actor.pos)} pés dali.`);
        this.onEvent({ type: 'teleporte', actor, from: de, to: { ...actor.pos } });
        break;
      }

      case 'reviver': {
        target.dead = false;
        target.hp = 1;
        target.stable = false;
        target.deathSaves = { successes: 0, failures: 0 };
        removeCondition(target, 'inconsciente');
        target.morreuNaRodada = null;
        this.say('cura', `${target.name} volta à vida com 1 PV.`);
        this.onEvent({ type: 'revived', target, by: actor });
        break;
      }

      // Arma Espiritual: golpeia agora e fica, sem concentração.
      case 'arma': {
        const extra = Math.floor(acima / 2) * (spell.upcast?.dadosACada2 ?? 0);
        const notacao = dadosDaMagia(spell, { circulo: spell.level }).replace(/^(\d+)d/, (_, n) => `${Number(n) + extra}d`);
        (actor.magiasAtivas ??= {})[spell.id] = { circulo: slot, rodadas: spell.duracaoRodadas, pos: { ...target.pos }, dano: notacao };
        this.ataqueMagico(actor, target, spell, notacao, dc, { bonusDano: spell.addSpellMod ? mod : 0, slot });
        break;
      }

      // Toque Vampírico: concentração; enquanto durar, o toque se repete.
      case 'vampirico': {
        actor.concentrating = { spellId: spell.id, condition: null, targets: [], rounds: spell.duracaoRodadas };
        (actor.magiasAtivas ??= {})[spell.id] = { circulo: slot, rodadas: null, dano };
        this.toqueQueDrena(actor, target, spell, dano, dc);
        break;
      }

      // Aumentar (aliado) ou Reduzir (inimigo, CON): o lado do alvo escolhe.
      case 'ampliar': {
        const aliado = target.side === actor.side;
        const cond = aliado ? 'aumentado' : 'reduzido';
        if (!aliado) {
          const save = this.resistencia(target, spell.save, dc);
          const r = this.explicarResistencia(target, spell.save, dc, save, {
            contra: `${spell.name} de ${actor.name}`,
            seSucesso: 'continua do tamanho que tem',
          });
          if (save.success) {
            this.say('magia', `${target.name} resiste a ${spell.name}.`, r.conta, { rolagem: r });
            break;
          }
          this.say('condicao', `${target.name} encolhe.`, r.conta, { rolagem: r });
        } else {
          this.say('magia', `${target.name} cresce.`);
        }
        this.aplicarCondicao(target, cond, { source: actor.id, magia: { id: spell.id, circulo: slot } });
        actor.concentrating = { spellId: spell.id, condition: cond, targets: [target], rounds: spell.duracaoRodadas };
        break;
      }

      // Acalmar Emoções: quem falha tira medo e encanto de uma vez, ou, sem
      // nenhum dos dois, fica indiferente. Aliado aceita sem testar.
      case 'acalmar': {
        const MALES = ['amedrontado', 'enfeiticado', 'hipnotizado', 'coroaDaLoucura'];
        const pegos = (areaTiles ? this.afetadosPelaArea(actor, spell, areaTiles, slot) : [])
          .map((x) => x.c)
          .filter((c) => (c.tipo ?? 'humanoide') === 'humanoide' && !hasCondition(c, 'inconsciente'));
        const calmos = [];
        for (const t of pegos) {
          const amigo = t.side === actor.side;
          const presos = MALES.filter((id) => hasCondition(t, id));
          if (amigo && !presos.length) continue;
          if (!amigo) {
            const save = this.resistencia(t, spell.save, dc);
            const r = this.explicarResistencia(t, spell.save, dc, save, {
              contra: `${spell.name} de ${actor.name}`,
              seSucesso: 'segue como estava',
            });
            if (save.success) {
              this.say('magia', `${t.name} resiste a ${spell.name}.`, r.conta, { rolagem: r });
              continue;
            }
          }
          const modo = presos.length ? 'suprime' : 'indiferente';
          for (const id of presos) removeCondition(t, id);
          this.aplicarCondicao(t, 'calmo', { source: actor.id, magia: { id: spell.id, circulo: slot }, data: { modo } });
          calmos.push(t);
          this.say('condicao', modo === 'suprime'
            ? `${t.name} se acalma: medo e encanto passam.`
            : `${t.name} fica indiferente aos seus inimigos.`);
        }
        if (calmos.length) {
          actor.concentrating = { spellId: spell.id, condition: 'calmo', targets: calmos, rounds: spell.duracaoRodadas };
        } else {
          this.say('aviso', `${spell.name} não pegou ninguém.`);
        }
        break;
      }

      // Bom Fruto: dez frutas na mochila de quem conjurou (cada uma cura 1 PV, por uma ação).
      case 'frutos': {
        const bag = garantirInventario(actor).bag;
        const ja = bag.find((i) => i.id === 'bomFruto');
        if (ja) ja.qtd += spell.frutos; else bag.push({ id: 'bomFruto', tipo: 'item', qtd: spell.frutos });
        this.say('magia', `${actor.name} conjura ${spell.frutos} frutinhas na mochila: cada uma cura 1 PV.`);
        break;
      }

      // Passo sem Rastro: um véu que anda com o conjurador (a condição é dada a quem fica a 9 m).
      case 'rastro': {
        actor.concentrating = { spellId: spell.id, condition: 'semRastro', targets: [], rounds: spell.duracaoRodadas, circulo: slot };
        this.renovarRastro();
        this.say('magia', `Um véu de sombra cobre ${actor.name} e quem está a 9 m: +10 em Furtividade.`);
        break;
      }

      case 'dissipar': {
        this.dissipar(actor, spell, { target, point, slot });
        break;
      }

      // Conjurar Animais: o pacote escolhido (ou o padrão) surge do lado do grupo.
      case 'invocar': {
        const pacote = spell.pacotes[opcao] ?? spell.pacotes[spell.pacotePadrao];
        // 5º círculo dobra, 7º triplica, 9º quadruplica.
        const n = pacote.n * (1 + Math.floor(acima / 2));
        actor.concentrating = { spellId: spell.id, condition: null, targets: [], rounds: spell.duracaoRodadas };
        const criadas = [];
        const antes = this.combatants.filter((c) => c.invocado && c.defId === pacote.defId).length;
        for (let i = 0; i < n; i++) {
          const c = this.invocar(actor, pacote.defId, actor.pos, { spellId: spell.id, sufixo: this.sufixoDeInvocado(pacote.defId, i, n, antes) });
          if (!c) break;
          criadas.push(c);
        }
        if (!criadas.length) {
          this.say('aviso', `${spell.name} não achou casa livre para as feras.`);
          this.dropConcentration(actor);
          break;
        }
        this.say('magia', criadas.length > 1
          ? `${criadas.length}× ${criadas[0].name.replace(/ \d+$/, '')} surgem ao lado de ${actor.name} e lutam pelo grupo.`
          : `${criadas[0].name} surge ao lado de ${actor.name} e luta pelo grupo.`);
        break;
      }

      // Animar os Mortos: o cadáver mirado (e, em círculo alto, os mais próximos) se ergue.
      case 'animarMortos': {
        const defId = opcao === 'zumbi' ? 'zumbi' : 'esqueleto';
        const extras = (spell.upcast?.criaturas ?? 0) * acima;
        const corpos = [target, ...this.combatants
          .filter((c) => c !== target && !this.porqueNaoAlvo(actor, spell, c))
          .sort((a, b) => distanceFt(actor.pos, a.pos) - distanceFt(actor.pos, b.pos))
          .slice(0, extras)];
        const erguidos = [];
        const antes = this.combatants.filter((c) => c.invocado && c.defId === defId).length;
        corpos.forEach((corpo, i) => {
          const c = this.invocar(actor, defId, corpo.pos, { spellId: spell.id, sufixo: this.sufixoDeInvocado(defId, i, corpos.length, antes) });
          if (!c) return;
          corpo.reerguido = true;
          c.invocado.corpo = corpo.name;
          erguidos.push(c);
        });
        this.say('magia', erguidos.length
          ? `${erguidos.map((c) => c.name).join(', ')} se ergue${erguidos.length > 1 ? 'm' : ''} do chão e obedece${erguidos.length > 1 ? 'm' : ''} a ${actor.name}.`
          : `${spell.name} não achou casa livre.`);
        break;
      }

      // Levitação: o aliado aceita; o inimigo resiste com CON. Quem concentra o move depois.
      case 'levitar': {
        if (target.side !== actor.side) {
          this.acordaIndiferentes(target, actor);
          const save = this.resistencia(target, spell.save, dc);
          const r = this.explicarResistencia(target, spell.save, dc, save, {
            contra: `${spell.name} de ${actor.name}`,
            seSucesso: 'continua no chão',
          });
          if (save.success) {
            this.say('magia', `${target.name} resiste a ${spell.name}.`, r.conta, { rolagem: r });
            break;
          }
          this.say('condicao', `${target.name} sobe do chão.`, r.conta, { rolagem: r });
        } else {
          this.say('magia', `${target.name} sobe do chão e flutua.`);
        }
        const posta = this.aplicarCondicao(target, 'levitando', { source: actor.id, magia: { id: spell.id, circulo: slot } });
        if (!posta) { this.say('magia', `${target.name} não é afetado.`); break; }
        target.movementLeftFt = 0;
        actor.concentrating = { spellId: spell.id, condition: 'levitando', targets: [target], rounds: spell.duracaoRodadas };
        (actor.magiasAtivas ??= {})[spell.id] = { circulo: slot, rodadas: null, alvoId: target.id };
        break;
      }

      case 'aura': {
        const aura = { id: this.proximaZona(), spellId: spell.id, nome: spell.name, dono: actor, raioFt: spell.raioFt, cd: dc, save: spell.save, dano, damageType: spell.damageType, halfOnSave: spell.halfOnSave, tipo: spell.tipoAura ?? null };
        this.auras.push(aura);
        actor.concentrating = { spellId: spell.id, condition: null, targets: [], rounds: spell.duracaoRodadas, aura };
        this.say('magia', spell.tipoAura === 'manto' ? `Um poder sagrado irradia de ${actor.name}.` : `Espíritos rodeiam ${actor.name}.`);
        break;
      }
    }

    // Duelo Compelido acaba se o conjurador lança magia hostil contra outro.
    if (actor.concentrating?.spellId === 'dueloCompelido' && spell.id !== 'dueloCompelido'
      && !this.miraAliados(spell) && !['buff', 'tempHp', 'dissipar', 'invocar', 'animarMortos'].includes(spell.kind)
      && !(['ampliar', 'levitar'].includes(spell.kind) && target?.side === actor.side)) {
      const duelados = actor.concentrating.targets;
      const atingidos = [target, ...(targets ?? []), ...(areaTiles ? this.afetadosPelaArea(actor, spell, areaTiles, slot).map((x) => x.c) : [])]
        .filter((c) => c && c.side !== actor.side && c !== actor);
      if (atingidos.some((c) => !duelados.includes(c))) this.acabarDuelo(actor, 'lançou magia contra outro');
    }

    this.afterAction(actor);
    this.checkEnd();
    return { ok: true };
  }

  /**
   * Dissipar Magia. Numa criatura: acaba cada efeito de magia marcado nela
   * (`cond.magia`) de círculo igual ou menor ao do espaço; os maiores pedem um
   * teste de atributo (d20 + modificador de conjuração contra 10 + círculo).
   * Numa zona: ela se desfaz e solta quem prendia.
   */
  dissipar(actor, spell, { target, point, slot }) {
    const mod = spellMod(actor);
    const passa = (circulo, nome) => {
      if (circulo <= slot) return true;
      const cd = 10 + circulo;
      const r = this.testeDeAtributo(actor, actor.spellcasting?.ability, mod);
      const ok = r.total >= cd;
      this.say('magia', `${actor.name} tenta dissipar ${nome} (${circulo}º círculo): ${ok ? 'consegue' : 'não consegue'}.`, `${r.conta} vs CD ${cd}`);
      return ok;
    };
    if (!target) {
      for (const zona of this.zonas.filter((z) => z.casas.has(key(point.x, point.y)))) {
        if (!passa(zona.circulo ?? 1, zona.nome)) continue;
        this.say('magia', `${actor.name} dissipa ${zona.em === 'no' ? 'o' : 'a'} ${zona.nome}.`);
        const dono = this.combatants.find((c) => c.concentrating?.zona === zona);
        if (dono) this.dropConcentration(dono); else this.desfazerZona(zona);
      }
      return;
    }
    // Uma fera de Conjurar Animais é a magia: dissipar nela encerra a magia toda.
    if (target.invocado && getSpell(target.invocado.spellId).concentration) {
      const mag = getSpell(target.invocado.spellId);
      if (passa(mag.level, mag.name)) {
        this.say('magia', `${mag.name} acaba: ${target.name} se desfaz.`);
        const dono = this.combatants.find((c) => c.id === target.invocado.donoId);
        if (dono?.concentrating?.spellId === mag.id) this.dropConcentration(dono);
        else this.dispensarInvocados((c) => c === target);
      }
      return;
    }
    let achou = false;
    for (const cond of [...(target.conditions ?? [])]) {
      // Cair no chão não é efeito de magia, mesmo quando a magia derrubou.
      if (!cond.magia || cond.id === 'caido') continue;
      const nome = CONDITIONS[cond.id]?.name ?? getSpell(cond.magia.id).name;
      achou = true;
      if (!passa(cond.magia.circulo, getSpell(cond.magia.id).name)) continue;
      this.tirarPvTempDaCondicao(target, cond.id);
      removeCondition(target, cond.id);
      this.say('magia', `${getSpell(cond.magia.id).name} acaba em ${target.name} (${nome}).`);
      if (cond.id === 'voando') this.quedaDe([target]);
      if (cond.id === 'levitando') this.quedaDe([target], '2d6');
      // A concentração de quem a mantinha perde este alvo; sem nenhum, cai.
      for (const dono of this.combatants) {
        const conc = dono.concentrating;
        if (!conc || conc.spellId !== cond.magia.id || !conc.targets.includes(target)) continue;
        conc.targets = conc.targets.filter((t) => t !== target);
        // Passo sem Rastro: quem foi dissipado não ganha o véu de volta ao renová-lo.
        (conc.dissipados ??= []).push(target.id);
        if (!conc.targets.length && !conc.zona && !conc.aura) this.dropConcentration(dono);
      }
    }
    if (target.armaduraArcana) {
      achou = true;
      if (passa(1, 'Armadura Arcana')) {
        target.armaduraArcana = false;
        target.ac = armorClass(target);
        this.say('magia', `A Armadura Arcana de ${target.name} se desfaz.`);
      }
    }
    if (!achou) this.say('aviso', `Não há magia a dissipar em ${target.name}.`);
  }

  /**
   * Uma magia de resistência resolvida: a área (ou o alvo), o dano rolado uma
   * vez, o teste de cada um, a condição de quem falha e o empurrão. É o miolo
   * de `castSpell` (`kind: 'save'`) e também o que se repete sem espaço
   * (`reuso` de Convocar Relâmpagos e Lufada de Vento).
   */
  resolverSave(actor, spell, { target = null, targets = null, point = null, areaTiles = null, slot = spell.level, dc, dano = null, reuso = false, opcao = null }) {
    // A direção da ventania: a das 8 mais próxima do ângulo até o cursor.
    const dir = spell.empurraAoLongo ? this.direcaoDe(actor.pos, point) : null;
    // Uma criatura Grande ocupa várias casas da área: conta uma vez só.
    // Quem a área pega, e quem Esculpir Magias poupa: a mesma conta da
    // prévia (`afetadosPelaArea`).
    // Respingo Ácido: até 2 criaturas, a até 1,5 m da primeira.
    const varios = spell.alvos && targets?.length
      ? targets.filter((t, i, l) => l.indexOf(t) === i && !this.porqueNaoAlvo(actor, spell, t)
        && distanceFt(t.pos, targets[0].pos) <= spell.juntosFt).slice(0, spell.alvos)
      : null;
    const pegos = spell.soZona ? []
      : areaTiles ? this.afetadosPelaArea(actor, spell, areaTiles, slot)
      : varios ? varios.map((c) => ({ c, papel: 'inimigo' }))
        : target ? [{ c: target, papel: 'inimigo' }] : [];
    // O dano de uma magia de área é rolado UMA vez para todos os alvos.
    const dmg = dano ? damageRoll(this.rng, dano) : null;
    // A teia nasce antes dos testes: quem fica contido fica preso A ELA.
    const zona = !reuso && spell.zona && areaTiles ? this.criarZona(actor, spell, areaTiles, dc, { centro: point ?? target?.pos, circulo: slot, tipo: spell.escolheTipoDoGlifo ? this.tipoDoGlifo(opcao, actor) : spell.escolheTipoDoCirculo ? this.tipoDoCirculo(opcao, actor) : null }) : null;
    // Raio Lunar e Esfera Flamejante: a zona anda com a ação (ou bônus).
    if (zona && spell.zona.movel) (actor.magiasAtivas ??= {})[spell.id] = { circulo: slot, rodadas: null, zona };
    const presos = [];

    for (const { c: t, papel } of pegos) {
      if (papel === 'poupado') {
        this.say('magia', `${t.name} é poupado (Esculpir Magias).`);
        continue;
      }
      // Magia hostil contra o alvo (acerte ou não) tira a calma indiferente.
      if (t.side !== actor.side) this.acordaIndiferentes(t, actor);
      const fx = conditionEffects(t);
      const auto = fx.autoFailSaves.includes(spell.save);
      const save = auto
        ? { total: 0, success: false, rolls: [0] }
        : this.resistencia(t, spell.save, dc);
      const amount = !dmg ? 0 : save.success ? (spell.halfOnSave ? Math.floor(dmg.total / 2) : 0) : dmg.total;
      // O que o sucesso compra é a decisão inteira: metade do dano ainda
      // vale conjurar numa multidão, nenhum dano não vale contra um alvo só.
      // Qual condição travou o teste: "falha automática" sem culpado deixa
      // o jogador sem saber que foi ELE quem criou essa abertura.
      const culpada = auto
        ? (t.conditions ?? []).find((c) => CONDITIONS[c.id]?.autoFailSaves?.includes(spell.save))
        : null;
      const efeito = spell.onFail ? `não fica ${CONDITIONS[spell.onFail.condition]?.name.toLowerCase()}` : null;
      const r = this.explicarResistencia(t, spell.save, dc, save, {
        contra: `${spell.name} (CD ${dc} = 8 + proficiência + atributo de conjuração)`,
        seSucesso: efeito ?? (spell.halfOnSave ? 'metade do dano' : 'nenhum dano'),
        automatica: auto,
        motivoAutomatico: culpada ? (CONDITIONS[culpada.id]?.name ?? culpada.id) : null,
      });
      const verbo = auto ? 'falha automaticamente' : save.success ? 'resiste' : 'falha';
      if (dmg) {
        const danoPartes = [parcelaDeDano('dano', dmg)];
        r.danoPartes = danoPartes;
        r.danoAplicado = amount;
        this.say(
          'magia',
          `${t.name} ${verbo} contra ${spell.name} e sofre ${amount}.`,
          `${r.conta} · ${contaDeDano(danoPartes[0])}${save.success && spell.halfOnSave ? ` → metade = ${amount}` : ''}`,
          { rolagem: r },
        );
      } else {
        this.say('magia', `${t.name} ${verbo} contra ${spell.name}.`, r.conta, { rolagem: r });
      }
      if (amount > 0) {
        this.applyDamage(t, amount, spell.damageType, actor, { magico: true });
        this.maybeIgnite(t, spell.damageType);
      }
      if (!save.success && !t.dead) {
        // Braços de Hadar: sem reação até o próximo turno dele.
        if (spell.onFail?.semReacao) t.reactionUsed = true;
        // Sussurros Dissonantes: gasta a reação fugindo.
        if (spell.onFail?.fogeNaReacao && !t.reactionUsed && !conditionEffects(t).incapacitated) {
          t.reactionUsed = true;
          this.say('condicao', `${t.name} foge de ${actor.name}.`);
          this.fugirDe(t, actor.pos, this.speedOf(t));
        }
        if (spell.onFail?.condition) {
          const posta = this.aplicarCondicao(t, spell.onFail.condition, {
            source: zona ? `zona:${zona.id}` : actor.id,
            magia: { id: spell.id, circulo: slot },
            rounds: spell.onFail.rounds ?? Infinity,
            data: { save: spell.save, dc, repete: spell.onFail.repete ?? false, escape: dc, foge: !!spell.onFail.foge },
          });
          if (posta) {
            presos.push(t);
            if (conditionEffects(t).semReacao) t.reactionUsed = true;
            this.say('condicao', `${t.name} fica ${CONDITIONS[spell.onFail.condition]?.name.toLowerCase()}.`);
          }
        }
        if (spell.pushFt) {
          // Lufada de Vento: o vento empurra ao longo da linha, não "para longe de você".
          const de = spell.empurraAoLongo && dir ? { x: t.pos.x - dir.x, y: t.pos.y - dir.y } : actor.pos;
          this.empurrar(t, de, spell.pushFt);
        }
      }
    }
    return { presos, zona };
  }

  /** O golpe de novo de uma magia ativa: sem espaço, sem contar como conjuração. */
  reusarMagia(actor, spell, target, slot, point = null) {
    if (spell.reuso === 'bonus') actor.bonusUsed = true;
    else actor.actionUsed = true;
    const ativa = actor.magiasAtivas[spell.id];
    const dc = spellSaveDc(actor);
    // Coroa da Loucura: a ação só mantém a coroa, sem novo teste.
    if (spell.mantem) {
      ativa.usadoNoTurno = true;
      this.say('magia', `${actor.name} mantém ${spell.name} sobre ${target.name}.`);
      this.onEvent({ type: 'spell', caster: actor, spell, target, point: target.pos, circulo: slot, reuso: true });
      this.afterAction(actor);
      return { ok: true };
    }
    if (spell.zona?.movel) {
      const casas = this.areaDaMagia(actor, spell, point) ?? [];
      ativa.zona.casas = new Set(casas.map((t) => key(t.x, t.y)));
      ativa.zona.centro = { x: point.x, y: point.y };
      this.atualizarDificeis();
      this.say('magia', `${actor.name} move ${spell.name}.`);
      this.onEvent({ type: 'spell', caster: actor, spell, point, areaTiles: casas, circulo: slot, reuso: true });
      this.afterAction(actor);
      return { ok: true };
    }
    if (spell.kind === 'levitar') {
      const levitante = this.combatants.find((c) => c.id === ativa.alvoId);
      const de = { ...levitante.pos };
      levitante.pos = { x: point.x, y: point.y, f: levitante.pos.f ?? 1 };
      this.say('magia', `${actor.name} leva ${levitante.name} pelo ar, ${distanceFt(de, levitante.pos) * 0.3} m adiante.`);
      this.onEvent({ type: 'spell', caster: actor, spell, target: levitante, point, circulo: slot, reuso: true });
      this.onEvent({ type: 'teleporte', actor: levitante, from: de, to: { ...levitante.pos } });
      this.afterAction(actor);
      return { ok: true };
    }
    if (spell.kind === 'curaReuso') {
      const dados = ativa.dano;
      const r = this.rolarCuraPara(target, dados, actor);
      const curado = this.heal(target, r.total, actor);
      this.say('cura', `${spell.name}: ${target.name} recupera ${curado} PV.`, `${dados}[${r.rolls.join('+')}]`);
      this.onEvent({ type: 'spell', caster: actor, spell, target, point: target.pos, circulo: slot, reuso: true });
      this.afterAction(actor);
      return { ok: true };
    }
    if (spell.kind === 'disparada') {
      actor.movementLeftFt += this.speedOf(actor);
      this.say('magia', `${actor.name} dispara de novo: +${this.speedOf(actor)} pés.`);
      this.onEvent({ type: 'spell', caster: actor, spell, point: actor.pos, circulo: slot, reuso: true });
      this.afterAction(actor);
      return { ok: true };
    }
    if (spell.kind === 'marca') {
      this.aplicarCondicao(target, spell.condition, { source: actor.id });
      if (actor.concentrating?.spellId === spell.id) actor.concentrating.targets = [target];
      this.say('magia', `${actor.name} passa a ${spell.name} para ${target.name}.`);
      this.onEvent({ type: 'spell', caster: actor, spell, target, point: target.pos, circulo: slot, reuso: true });
      this.afterAction(actor);
      return { ok: true };
    }
    // Golpear com a magia é atacar: desfaz Invisibilidade e Santuário.
    this.quebraInvisibilidade(actor);
    if (hasCondition(actor, 'santuario')) {
      removeCondition(actor, 'santuario');
      this.say('magia', `${actor.name} ataca e perde o Santuário.`);
    }
    // Lufada de Vento e Convocar Relâmpagos: o mesmo efeito de área, de novo.
    if (spell.sustenta) {
      const casas = this.areaDaMagia(actor, spell, point, slot) ?? [];
      const dano = spell.damage ? dadosDaMagia(spell, { circulo: slot }) : null;
      ativa.usadoNoTurno = true;
      this.say('magia', `${actor.name}: ${spell.name} de novo.`);
      this.onEvent({ type: 'spell', caster: actor, spell, point, areaTiles: casas, circulo: slot, reuso: true });
      this.resolverSave(actor, spell, { point, areaTiles: casas, slot, dc, dano, reuso: true });
      this.afterAction(actor);
      this.checkEnd();
      return { ok: true };
    }
    ativa.usadoNoTurno = true;
    this.say('magia', `${actor.name}: ${spell.name} golpeia de novo.`);
    this.onEvent({ type: 'spell', caster: actor, spell, target, point: target.pos, circulo: slot, reuso: true });
    if (spell.reusoAuto) {
      const r = damageRoll(this.rng, spell.reusoAuto);
      this.say('magia', `O arco de ${spell.name} queima ${target.name}: ${r.total} de ${spell.damageType}.`, `${spell.reusoAuto}[${r.rolls.join('+')}] · automático`);
      this.applyDamage(target, r.total, spell.damageType, actor, { magico: true });
    } else if (spell.kind === 'lamina') {
      this.ataqueMagico(actor, target, spell, ativa.dano, dc);
    } else if (spell.kind === 'calor') {
      this.metalQuente(actor, target, spell, ativa.dano, dc);
    } else if (spell.kind === 'arma') {
      ativa.pos = { ...target.pos };
      this.ataqueMagico(actor, target, spell, ativa.dano, dc, { bonusDano: spell.addSpellMod ? spellMod(actor) : 0 });
    } else {
      this.toqueQueDrena(actor, target, spell, ativa.dano, dc);
    }
    this.afterAction(actor);
    this.checkEnd();
    return { ok: true };
  }

  // ---- truques e 1º círculo: reações e efeitos de acerto -------------------

  /** Veste armadura de metal (média ou pesada, menos a de peles). */
  vesteMetal(c) {
    const a = ARMORS[c.armor ?? 'nenhuma'];
    return !!a && ['média', 'pesada'].includes(a.categoria) && c.armor !== 'peleDeAnimal';
  }

  /**
   * Zombaria Viciosa: a desvantagem vale para um ataque só. Ataque Certeiro:
   * a vantagem também (`alvo`, quem ele leu).
   */
  consumirAoAtacar(c, alvo = null) {
    // Duelo Compelido acaba se o conjurador ataca outro que não o duelado.
    if (alvo && c.concentrating?.spellId === 'dueloCompelido' && !c.concentrating.targets.includes(alvo)) {
      this.acabarDuelo(c, 'atacou outro');
    }
    for (const cond of [...(c.conditions ?? [])]) {
      if (CONDITIONS[cond.id]?.consumidaAoAtacar) removeCondition(c, cond.id);
    }
    if (alvo && getCondition(alvo, 'alvoCerteiro')?.source === c.id) {
      removeCondition(alvo, 'alvoCerteiro');
      if (c.concentrating?.spellId === 'ataqueCerteiro') c.concentrating = null;
    }
  }

  /** Duelo Compelido acaba (ataque a outro, magia hostil a outro, aliado feriu o alvo, distância). */
  acabarDuelo(dono, motivo) {
    if (dono.concentrating?.spellId !== 'dueloCompelido') return;
    this.say('concentracao', `${dono.name}: o Duelo Compelido acaba (${motivo}).`);
    this.dropConcentration(dono);
  }

  /** Um aliado do conjurador feriu o duelado: o Duelo Compelido acaba. */
  aliadoFereODuelado(alvo, fonte) {
    const dl = getCondition(alvo, 'duelo');
    if (!dl || !fonte) return;
    const dono = this.combatants.find((x) => x.id === dl.source);
    if (dono && fonte !== dono && fonte.side === dono.side) this.acabarDuelo(dono, 'um aliado feriu o alvo');
  }

  /** Santuário: quem ataca o protegido faz SAB; falhou, perde o ataque. */
  passaPeloSantuario(atacante, alvo) {
    const s = getCondition(alvo, 'santuario');
    if (!s || atacante.side === alvo.side) return true;
    const dc = s.data?.dc ?? 13;
    const save = this.resistencia(atacante, 'wis', dc);
    const r = this.explicarResistencia(atacante, 'wis', dc, save, {
      contra: `Santuário de ${alvo.name}`,
      seSucesso: 'consegue atacar',
    });
    if (save.success) return true;
    this.say('magia', `${atacante.name} hesita diante do Santuário e perde o ataque contra ${alvo.name}.`, r.conta, { rolagem: r });
    return false;
  }

  /** Magia pronta, espaço livre, reação de pé: a reação pode sair. */
  podeReagirCom(c, id) {
    if (c.dead || c.reactionUsed || conditionEffects(c).incapacitated || !c.spellcasting) return null;
    // No próprio turno, depois de uma magia de ação bônus, só truque de 1 ação.
    if (this.side === c.side && (c.magiasNoTurno ?? []).some((m) => m.castTime === 'bonus')) return null;
    if (!magiasProntas(c).includes(id)) return null;
    const spell = getSpell(id);
    // Item que conjura por cargas (o Cajado de Defesa do Cajavidro): primeiro
    // as cargas, depois o espaco.
    const cajado = c.spellcasting.cajado;
    const custo = cajado?.magias?.[id];
    if (custo) return cajado.cargas >= custo ? { spell, circulo: spell.level, cajado: custo } : null;
    const circulo = this.circuloDeConjuracao(c, spell);
    return circulo === null ? null : { spell, circulo };
  }

  /**
   * Escudo Arcano: sai sozinho quando o ataque ia acertar e +5 de CA o faz
   * errar. Gastar a reação e o espaço num ataque que acertaria de qualquer
   * jeito seria desperdício; por isso só nesse caso.
   */
  escudoArcano(alvo, atacante, total, ca) {
    const pode = this.podeReagirCom(alvo, 'escudoArcano');
    // Já erguido: um segundo escudo não soma (a CA já tem o +5).
    if (!pode || total >= ca + 5 || hasCondition(alvo, 'escudoArcano')) return false;
    alvo.reactionUsed = true;
    if (pode.cajado) alvo.spellcasting.cajado.cargas -= pode.cajado;
    else alvo.spellcasting.slots[pode.circulo] -= 1;
    this.aplicarCondicao(alvo, 'escudoArcano', { rounds: 1, source: alvo.id, lado: alvo.side, quando: 'inicio' });
    const doCajado = pode.cajado ? ` do cajado (${alvo.spellcasting.cajado.cargas} cargas)` : '';
    this.say('magia', `${alvo.name} ergue o Escudo Arcano${doCajado} (reação): CA ${ca + 5}, o ataque de ${atacante.name} erra.`);
    this.onEvent({ type: 'spell', caster: alvo, spell: pode.spell, target: alvo, point: alvo.pos, circulo: pode.circulo });
    return true;
  }

  /** Repreensão Infernal: quem fere o bruxo leva chamas, na reação dele. */
  reacaoAoDano(alvo, fonte) {
    if (!fonte || fonte === alvo || fonte.dead || fonte.side === alvo.side || this.reagindo) return;
    const pode = this.podeReagirCom(alvo, 'repreensaoInfernal');
    if (!pode) return;
    if (distanceFt(alvo.pos, fonte.pos) > pode.spell.rangeFt || !this.field.hasLineOfSight(alvo.pos, fonte.pos)) return;
    this.reagindo = true;
    try {
      alvo.reactionUsed = true;
      alvo.spellcasting.slots[pode.circulo] -= 1;
      const spell = pode.spell;
      const dc = spellSaveDc(alvo);
      this.say('magia', `${alvo.name} responde com Repreensão Infernal (reação).`);
      this.onEvent({ type: 'spell', caster: alvo, spell, target: fonte, point: fonte.pos, circulo: pode.circulo });
      const dmg = damageRoll(this.rng, dadosDaMagia(spell, { circulo: pode.circulo }));
      const save = this.resistencia(fonte, spell.save, dc);
      const amount = save.success ? Math.floor(dmg.total / 2) : dmg.total;
      const r = this.explicarResistencia(fonte, spell.save, dc, save, { contra: spell.name, seSucesso: 'metade do dano' });
      this.say('magia', `${fonte.name} ${save.success ? 'resiste' : 'falha'} e sofre ${amount} de fogo.`, `${r.conta} · ${dmg.notation ?? ''}[${dmg.rolls?.join('+') ?? ''}]`, { rolagem: r });
      this.outraFonte(() => this.applyDamage(fonte, amount, spell.damageType, alvo, { magico: true }));
    } finally {
      this.reagindo = false;
    }
  }

  /**
   * O que um acerto carrega além do dano: Bruxaria e Marca do Caçador no
   * alvo, Favor Divino em quem ataca, e os golpes preparados (Trovejante,
   * Abrasador, Colérico, Saraivada de Espinhos), que se gastam no acerto.
   */
  extrasDoAcerto(atacante, alvo, { arma, ranged, tipo, critical }) {
    const extra = (rotulo, dados, tipoDano) => {
      if (alvo.dead) return;
      const r = damageRoll(this.rng, dados, { critical });
      this.say('magia', `${rotulo}: +${r.total} de ${tipoDano} em ${alvo.name}.`, `${dados}[${r.rolls.join('+')}]`);
      this.applyDamage(alvo, r.total, tipoDano, atacante, { magico: true });
    };
    for (const cond of [...(alvo.conditions ?? [])]) {
      const m = CONDITIONS[cond.id]?.marcaDano;
      if (!m || cond.source !== atacante.id || (m.soArma && !arma)) continue;
      extra(CONDITIONS[cond.id].name, m.dados, m.tipo ?? tipo);
    }
    if (!arma) return;
    for (const a of this.auras ?? []) {
      if (a.tipo !== 'manto' || a.dono.dead || a.dono.side !== atacante.side) continue;
      if (distanceFt(a.dono.pos, atacante.pos) <= a.raioFt && this.field.hasLineOfSight(a.dono.pos, atacante.pos)) extra(a.nome, '1d4', 'radiante');
    }
    for (const cond of [...(atacante.conditions ?? [])]) {
      const def = CONDITIONS[cond.id];
      // Arma Elemental guarda o tipo escolhido na condição.
      if (def?.danoNoAcerto) extra(def.name, cond.data?.dadosNoAcerto ?? def.danoNoAcerto.dados, def.danoNoAcerto.tipo ?? cond.data?.tipo ?? tipo);
      const g = def?.golpe;
      if (!g || (g.alcance === 'perto' && ranged) || (g.alcance === 'distancia' && !ranged)) continue;
      // O golpe preparado se gasta neste acerto.
      removeCondition(atacante, cond.id);
      this.onEvent({ type: 'golpeMagico', atacante, alvo, tipo: g.tipo, efeito: g.efeito });
      const dc = spellSaveDc(atacante);
      // Golpe Constritor: vinhas prendem o alvo; elas o ferem no começo de cada turno dele.
      if (g.efeito === 'constringe') {
        if (alvo.dead) { this.dropConcentration(atacante); continue; }
        const grande = (alvo.pos.f ?? 1) >= 2;
        const save = this.resistencia(alvo, 'str', dc, { vantagem: grande });
        const rr = this.explicarResistencia(alvo, 'str', dc, save, { contra: def.name, seSucesso: 'as vinhas não o prendem' });
        this.say('magia', `${def.name}: vinhas brotam e agarram ${alvo.name}${grande ? ' (Grande ou maior: vantagem na resistência)' : ''}.`);
        const prendeu = !save.success && this.aplicarCondicao(alvo, 'presoPorVinhas', {
          source: atacante.id,
          magia: { id: cond.id, circulo: cond.data?.circulo ?? 1 },
          data: { dc, escape: dc, soForca: true, vinhas: { dados: this.dadosDoGolpe(cond, g), tipo: g.tipo } },
        });
        if (prendeu) {
          atacante.concentrating = { spellId: cond.id, condition: 'presoPorVinhas', targets: [alvo], rounds: atacante.concentrating?.rounds ?? 10 };
          this.say('condicao', `${alvo.name} fica preso pelas vinhas.`, rr.conta, { rolagem: rr });
        } else {
          this.say('condicao', `${alvo.name} se livra das vinhas.`, rr.conta, { rolagem: rr });
          this.dropConcentration(atacante);
        }
        continue;
      }
      if (g.efeito === 'espinhos') {
        // Saraivada: o alvo e quem estiver a 1,5 m dele.
        const r = damageRoll(this.rng, this.dadosDoGolpe(cond, g));
        const pegos = this.combatants.filter((c) => !c.dead && distanceFt(c.pos, alvo.pos) <= 5);
        this.say('magia', `${def.name}: espinhos brotam em volta de ${alvo.name}.`);
        // A chuva é outra fonte ("além do efeito normal do ataque"), com teste próprio.
        for (const c of pegos) this.outraFonte(() => {
          const save = this.resistencia(c, 'dex', dc);
          const amount = save.success ? Math.floor(r.total / 2) : r.total;
          const rr = this.explicarResistencia(c, 'dex', dc, save, { contra: def.name, seSucesso: 'metade do dano' });
          this.say('magia', `${c.name} ${save.success ? 'resiste' : 'falha'} e sofre ${amount} de ${g.tipo} (${def.name}).`, rr.conta, { rolagem: rr });
          this.applyDamage(c, amount, g.tipo, atacante, { magico: true });
        });
        this.dropConcentration(atacante);
        continue;
      }
      extra(def.name, this.dadosDoGolpe(cond, g), g.tipo);
      if (alvo.dead) { this.dropConcentration(atacante); continue; }
      if (g.efeito === 'empurra') {
        const save = this.resistencia(alvo, 'str', dc);
        if (!save.success) {
          this.empurrar(alvo, atacante.pos, 10);
          addCondition(alvo, 'caido');
          this.say('condicao', `${alvo.name} é arremessado e cai.`);
        }
        this.dropConcentration(atacante);
      } else if (g.efeito === 'cega') {
        const save = this.resistencia(alvo, 'con', dc);
        if (!save.success && this.aplicarCondicao(alvo, 'cego', { source: atacante.id, data: { save: 'con', dc, repete: true } })) {
          atacante.concentrating = { spellId: cond.id, condition: 'cego', targets: [alvo], rounds: atacante.concentrating?.rounds ?? 10 };
          this.say('condicao', `${alvo.name} fica cego pela luz.`);
        } else {
          this.dropConcentration(atacante);
        }
      } else if (!g.efeito) {
        this.dropConcentration(atacante);
      } else if (g.efeito === 'chamusca') {
        this.aplicarCondicao(alvo, 'chamuscado', { source: atacante.id, data: { dc } });
        atacante.concentrating = { spellId: cond.id, condition: 'chamuscado', targets: [alvo], rounds: atacante.concentrating?.rounds ?? 10 };
        this.say('condicao', `${alvo.name} pega fogo.`);
      } else if (g.efeito === 'assusta') {
        const save = this.resistencia(alvo, 'wis', dc);
        if (!save.success && this.aplicarCondicao(alvo, 'amedrontado', { source: atacante.id, data: { save: 'wis', dc } })) {
          atacante.concentrating = { spellId: cond.id, condition: 'amedrontado', targets: [alvo], rounds: atacante.concentrating?.rounds ?? 10 };
          this.say('condicao', `${alvo.name} fica amedrontado de ${atacante.name}.`);
        } else {
          this.dropConcentration(atacante);
        }
      }
    }
  }

  /**
   * Imagem Espelhada: antes do ataque, um d20 diz se o golpe vai numa cópia
   * (6+ com três, 8+ com duas, 11+ com uma). Indo, rola contra a CA da cópia
   * (10 + DES); acertou, ela some. Devolve true se o ataque foi na cópia.
   */
  imagemDesvia(atacante, alvo, bonus, mods) {
    const im = getCondition(alvo, 'imagens');
    const n = im?.data?.n ?? 0;
    // Quem não enxerga não é enganado pelas cópias.
    if (!n || hasCondition(atacante, 'cego')) return false;
    const precisa = { 3: 6, 2: 8, 1: 11 }[n];
    if (this.rng.die(20) < precisa) return false;
    const ca = 10 + abilityMod(alvo.abilities?.dex ?? 10);
    const r = attackRoll(this.rng, bonus, ca, mods);
    if (r.hit) {
      im.data.n = n - 1;
      if (!im.data.n) removeCondition(alvo, 'imagens');
      this.say('magia', `${atacante.name} acerta uma cópia ilusória de ${alvo.name}: ela some (${n - 1} restam).`);
    } else {
      this.say('magia', `${atacante.name} ataca uma cópia ilusória de ${alvo.name} e erra.`);
    }
    return true;
  }

  /** Invisibilidade acaba quando o invisível ataca ou conjura contra alguém. */
  quebraInvisibilidade(c) {
    if (!hasCondition(c, 'invisivel')) return;
    removeCondition(c, 'invisivel');
    this.say('magia', `${c.name} reaparece.`);
  }

  /** Farol de Esperança: a cura sai no máximo dos dados. */
  rolarCuraPara(alvo, notacao, conjurador) {
    if (!conditionEffects(alvo).curaMaxima) return rolarCura(this, notacao, conjurador);
    const m = /^(\d+)d(\d+)([+-]\d+)?$/.exec(String(notacao).replace(/\s/g, ''));
    if (!m) return rolarCura(this, notacao, conjurador);
    const rolls = Array(Number(m[1])).fill(Number(m[2]));
    const mod = Number(m[3] ?? 0);
    return { notation: notacao, rolls, mod, total: rolls.reduce((a, b) => a + b, 0) + mod };
  }

  /** Começo do turno: PV do Heroísmo e as chamas do Golpe Abrasador. */
  comecoDoTurnoMagico(c) {
    if (c.dead) return;
    const heroico = getCondition(c, 'heroico');
    if (heroico?.data?.pvTemp > 0) c.tempHp = Math.max(c.tempHp ?? 0, heroico.data.pvTemp);
    const chamas = getCondition(c, 'chamuscado');
    if (chamas) {
      const save = this.resistencia(c, 'con', chamas.data?.dc ?? 13);
      if (save.success) {
        removeCondition(c, 'chamuscado');
        this.say('condicao', `${c.name} apaga as chamas.`);
        this.soltouDaConcentracao(c, 'chamuscado');
      } else {
        const r = damageRoll(this.rng, '1d6');
        const dono = this.combatants.find((x) => x.id === chamas.source);
        this.say('condicao', `${c.name} queima: ${r.total} de fogo.`);
        this.applyDamage(c, r.total, 'fogo', dono ?? null, { magico: true });
      }
    }
  }

  /** Veste metal ou empunha arma de metal (Calor no Metal). */
  carregaMetal(c) {
    if (this.vesteMetal(c)) return true;
    if (c.attacks) return c.attacks.some((a) => !a.natural && /espada|cimitarra|machad|lan[cç]a|ma[cç]a|adaga|martel|alabarda|mangual|tridente|azagaia|picareta|foice/i.test(a.name));
    return (c.weapons ?? []).some((w) => w !== 'bordao' && w !== 'clava' && w !== 'arcoCurto' && w !== 'arcoLongo' && w !== 'funda');
  }

  /** Calor no Metal: 2d8 de fogo sem teste; quem veste o metal ataca com desvantagem. */
  metalQuente(actor, target, spell, dano, dc) {
    const r = damageRoll(this.rng, dano);
    this.say('magia', `O metal de ${target.name} arde: ${r.total} de fogo.`, `${dano}[${r.rolls.join('+')}] · sem teste`);
    this.applyDamage(target, r.total, 'fogo', actor, { magico: true });
    if (target.dead) return;
    // Arma ele larga (no jogo: fica com desvantagem se falhar); armadura não sai.
    const preso = this.vesteMetal(target) || !this.resistencia(target, 'con', dc).success;
    if (preso) this.aplicarCondicao(target, 'metalQuente', { rounds: 1, source: actor.id, lado: actor.side, quando: 'inicio' });
  }

  /**
   * O tipo que o jogo escolhe por você. Proteção contra Energia: o que os
   * inimigos à vista mais causam (fora o físico). Arma Elemental: o que menos
   * os inimigos à vista resistem.
   */
  tipoParaEscolher(actor, spell) {
    const tipos = ['ácido', 'frio', 'fogo', 'elétrico', 'trovejante'];
    const inimigos = this.enemiesOf(actor).filter((e) => !e.dead);
    if (spell.escolheTipo === 'defesa') {
      const conta = new Map();
      for (const e of inimigos) {
        for (const a of e.attacks ?? []) if (tipos.includes(a.type)) conta.set(a.type, (conta.get(a.type) ?? 0) + 1);
      }
      return [...conta.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'fogo';
    }
    const dano = (t) => inimigos.reduce((s, e) => s + this.danoPorTipo(e, 10, t, true), 0);
    return [...tipos].sort((a, b) => dano(b) - dano(a))[0];
  }

  /** Os dados do golpe preparado, com o círculo em que a magia saiu. */
  dadosDoGolpe(cond, g) {
    const magia = Object.values(SPELLS).find((m) => m.condition === cond.id);
    const circulo = cond.data?.circulo;
    if (!magia?.upcast?.dados || !circulo) return g.dados;
    return dadosDaMagia(magia, { circulo, notacao: g.dados });
  }

  /**
   * O alvo único se livrou da condição (passou no teste): a concentração de
   * quem a pôs não tem mais o que segurar.
   */
  soltouDaConcentracao(c, condId) {
    for (const dono of this.combatants) {
      const conc = dono.concentrating;
      if (!conc || conc.condition !== condId || !conc.targets.includes(c)) continue;
      if (conc.targets.some((t) => hasCondition(t, condId))) continue;
      this.say('concentracao', `${dono.name}: ${getSpell(conc.spellId)?.name ?? 'a magia'} não segura mais ninguém.`);
      this.dropConcentration(dono);
    }
  }

  /** Foge andando (Sussurros Dissonantes): é movimento, provoca ataque de oportunidade. */
  fugirDe(c, de, pes) {
    const antes = c.movementLeftFt;
    c.movementLeftFt = pes;
    const alcance = this.reachableFor(c);
    let melhor = null;
    for (const node of alcance.values()) {
      if (this.occupied(node.x, node.y, c)) continue;
      const d = distanceFt({ x: node.x, y: node.y }, de);
      if (!melhor || d > melhor.d) melhor = { d, node };
    }
    if (melhor && melhor.node.cost > 0) this.moveAlong(c, Battlefield.pathFrom(alcance, melhor.node));
    c.movementLeftFt = antes;
  }

  /** Toque Vampírico: o dano necrótico, e metade volta como cura. */
  toqueQueDrena(actor, target, spell, dano, dc) {
    this.danoDoUltimoAtaque = 0;
    const causado = this.ataqueMagico(actor, target, spell, dano, dc);
    // Metade do que de fato entrou (imune a necrótico não dá nada).
    const efetivo = causado > 0 ? this.danoDoUltimoAtaque : 0;
    if (efetivo > 0) {
      const curado = this.heal(actor, Math.floor(efetivo / 2), actor);
      if (curado > 0) this.say('cura', `${actor.name} drena ${curado} PV.`);
    }
  }

  /**
   * Lentidão: os alvos têm de caber num cubo de `cuboFt`. Fica quem cabe no
   * cubo junto com o primeiro da lista (o mais perto, ou o primeiro clicado).
   */
  dentroDoCubo(spell, lista) {
    if (!spell.cuboFt || !lista.length) return lista;
    const lado = spell.cuboFt / 5;
    const fica = [lista[0]];
    for (const c of lista.slice(1)) {
      const xs = [...fica, c].map((x) => x.pos.x);
      const ys = [...fica, c].map((x) => x.pos.y);
      if (Math.max(...xs) - Math.min(...xs) < lado && Math.max(...ys) - Math.min(...ys) < lado) fica.push(c);
    }
    return fica;
  }

  /**
   * Uma jogada de ataque mágico e o dano dela (Raio de Fogo, cada raio do Raio
   * Ardente, o Toque Vampírico, a Arma Espiritual). Devolve o dano causado (0
   * se errou). `bonusDano` soma ao dano (o modificador da Arma Espiritual).
   */
  ataqueMagico(actor, target, spell, dano, dc, { bonusDano = 0, slot = spell.level } = {}) {
    if (!this.passaPeloSantuario(actor, target)) return 0;
    this.acordaIndiferentes(target, actor);
    const atkBonus = spellAttackBonus(actor);
    // Infligir Ferimentos é de toque: ataque corpo a corpo, sem a
    // desvantagem de "inimigo adjacente" e sem cobertura.
    const mods = this.attackModifiers(actor, target, { ranged: !spell.melee });
    // Toque Chocante: vantagem contra armadura de metal.
    if (spell.vantagemContraMetal && this.vesteMetal(target)) fonte(mods, 'vantagem', 'armadura de metal');
    const cover = spell.melee ? 0 : this.field.coverBetween(actor.pos, target.pos);
    const ca = caEfetiva(target) + cover;
    const caPartes = [{ rotulo: `CA de ${target.name}`, valor: caEfetiva(target) }];
    if (cover) caPartes.push({ rotulo: 'cobertura', valor: cover });
    // Ataque de magia é proficiência + o atributo de conjuração — nunca
    // Força. Nomear o atributo é o que torna visível por que o mago acerta
    // melhor que o clérigo com a mesma magia. Bênção e Perdição valem
    // aqui também: ataque de magia é jogada de ataque.
    const extra = this.dadosDeAtaque(actor, atkBonus, [
      { rotulo: ABILITY_NAME[actor.spellcasting.ability], valor: abilityMod(actor.abilities[actor.spellcasting.ability]) },
      { rotulo: 'proficiência', valor: proficiencyBonus(actor.level) },
    ]);
    if (this.imagemDesvia(actor, target, extra.bonus, mods)) return 0;
    const atk = attackRoll(this.rng, extra.bonus, ca, mods);
    this.consumirAoAtacar(actor, target);
    this.consumirMarcas(target);
    // Acerto a até 1,5 m em alvo inconsciente ou paralisado é crítico,
    // com magia ou com arma.
    const autoCrit = atk.hit && conditionEffects(target).critWithinReach && distanceFt(actor.pos, target.pos) <= 5;
    const critical = atk.critical || autoCrit;
    const explicacao = explicarModo(mods);
    const faltou = atk.hit || atk.fumble ? null : Math.max(0, ca - atk.total);
    const porPouco = faltou !== null && faltou >= 1 && faltou <= 2;
    const contaAtaque = [
      `d20[${atk.rolls.join('/')}] ${explicarBonus(extra.bonus, extra.partes)} = ${atk.total}`,
      `vs CA ${ca}${cover ? ` (${caPartes.map((c) => `${c.rotulo} ${c.valor}`).join(' + ')})` : ''}`,
      explicacao || null,
    ].filter(Boolean).join(' · ');
    const rolagem = {
      categoria: 'ataqueDeMagia',
      rotulo: spell.name,
      actor, target,
      d20: { rolls: [...atk.rolls], natural: atk.natural, total: atk.total, bonus: extra.bonus },
      bonusPartes: extra.partes,
      alvoNumero: { rotulo: 'CA', valor: ca, partes: caPartes },
      modo: mods.mode, anulado: mods.anulado,
      vantagens: [...mods.vantagens], desvantagens: [...mods.desvantagens], motivos: [...mods.reasons],
      explicacao, critico: critical, critoAutomatico: autoCrit && !atk.critical, faltou, errouPorPouco: porPouco,
      naturalUm: atk.fumble, natural20: atk.critical,
      conta: contaAtaque,
    };
    this.onEvent({ type: 'rolagem', ...rolagem });
    if (!atk.hit) {
      const nota = atk.fumble
        ? ' — 1 natural, erra por regra'
        : porPouco ? ` — faltou ${faltou}` : '';
      this.say('magia', `${spell.name} erra ${target.name}${nota}.`, contaAtaque, { rolagem });
      return 0;
    }
    // Ataque que não fere, só aplica o efeito (Raio do Enfraquecimento).
    // Devolve 1: acertou, para quem pergunta se pegou.
    if (!dano) {
      this.say('magia', `${spell.name} acerta ${target.name}.`, contaAtaque, { rolagem });
      if (spell.applies && !target.dead) this.aplicarEfeitoDeMagia(actor, target, spell, dc, slot);
      return 1;
    }
    const dmg = damageRoll(this.rng, dano, { critical });
    if (bonusDano) dmg.total += bonusDano;
    const danoPartes = [parcelaDeDano('dano', dmg)];
    rolagem.danoPartes = danoPartes;
    rolagem.danoTotal = dmg.total;
    const marca = critical ? (autoCrit && !atk.critical ? ' — CRÍTICO (alvo indefeso ao alcance)' : ' — CRÍTICO (20 natural)') : '';
    this.say(
      'magia',
      `${spell.name} acerta ${target.name}${marca}: ${dmg.total} de ${spell.damageType}.`,
      `${contaAtaque} · ${contaDeDano(danoPartes[0])}`,
      { rolagem },
    );
    this.ultimoDano = 0;
    this.umaFonteDeDano(() => {
      this.applyDamage(target, dmg.total, spell.damageType, actor, { critical, magico: true });
      this.danoDoUltimoAtaque = this.ultimoDano;
      this.maybeIgnite(target, spell.damageType);
      this.extrasDoAcerto(actor, target, { arma: false, ranged: !spell.melee, tipo: spell.damageType, critical });
    });
    if (spell.tiraReacao && !target.dead) target.reactionUsed = true;
    // Chicote de Espinhos: puxa para perto (empurrar "a partir" do ponto oposto).
    if (spell.puxarFt && !target.dead && (target.pos.f ?? 1) <= 2) {
      const longe = { x: 2 * target.pos.x - actor.pos.x, y: 2 * target.pos.y - actor.pos.y };
      this.empurrar(target, longe, spell.puxarFt);
    }
    if (spell.applies && !target.dead) this.aplicarEfeitoDeMagia(actor, target, spell, dc, slot);
    // Toque Arrepiante: o morto-vivo atingido ataca o conjurador com
    // desvantagem até o fim do próximo turno dele (do conjurador).
    if (spell.mortoVivoArrepiado && target.tipo === 'morto-vivo' && !target.dead) {
      this.aplicarCondicao(target, 'arrepiado', { rounds: 2, source: actor.id, lado: actor.side, quando: 'fim' });
    }
    return dmg.total;
  }

  /**
   * O efeito extra de uma magia de ataque que acertou (Raio de Gelo, Raio
   * Guiado, Toque Arrepiante, Raio de Doença). Com `save`, o alvo resiste.
   */
  aplicarEfeitoDeMagia(actor, target, spell, dc, slot = spell.level) {
    const ef = spell.applies;
    if (ef.save) {
      const save = this.resistencia(target, ef.save, dc);
      const nome = CONDITIONS[ef.condition]?.name.toLowerCase() ?? ef.condition;
      const r = this.explicarResistencia(target, ef.save, dc, save, {
        contra: `${spell.name} de ${actor.name}`,
        seSucesso: `não fica ${nome}`,
      });
      if (save.success) {
        this.say('condicao', `${target.name} resiste e não fica ${nome}.`, r.conta, { rolagem: r });
        return;
      }
      this.say('condicao', `${target.name} fica ${nome}.`, r.conta, { rolagem: r });
    }
    const doConjurador = ef.conta === 'conjurador';
    this.aplicarCondicao(target, ef.condition, {
      rounds: ef.rounds ?? Infinity,
      source: actor.id,
      lado: doConjurador ? actor.side : null,
      quando: ef.quando ?? 'fim',
      magia: { id: spell.id, circulo: slot },
      data: ef.repete ? { save: ef.repete, dc, repete: true } : null,
    });
  }

  /**
   * Empurra para longe de `origem`, casa a casa, até `pes` ou até bater em
   * parede, borda ou outra criatura.
   */
  empurrar(alvo, origem, pes) {
    const dx = Math.sign(alvo.pos.x - origem.x);
    const dy = Math.sign(alvo.pos.y - origem.y);
    if (!dx && !dy) return;
    const f = alvo.pos.f ?? 1;
    const de = { ...alvo.pos };
    const caminho = [{ ...alvo.pos }];
    for (let i = 0; i < Math.floor(pes / 5); i++) {
      const nx = alvo.pos.x + dx;
      const ny = alvo.pos.y + dy;
      let livre = true;
      for (let oy = 0; oy < f && livre; oy++) {
        for (let ox = 0; ox < f && livre; ox++) {
          const x = nx + ox;
          const y = ny + oy;
          if (!this.field.inside(x, y) || this.field.blocksMove(x, y) || this.occupied(x, y, alvo)) livre = false;
        }
      }
      if (livre && !this.field.passaPegada(alvo.pos.x, alvo.pos.y, nx, ny, f)) livre = false;
      if (!livre) break;
      alvo.pos = { ...alvo.pos, x: nx, y: ny };
      caminho.push({ ...alvo.pos });
      // Glifo e Cordão também disparam com o empurrão.
      this.gatilhosDeArmadilha(alvo, caminho[caminho.length - 2]);
      if (alvo.dead) break;
      // Crescimento de Espinhos fere em qualquer movimento, forçado também.
      const espinhos = this.zonas.find((z) => z.danoPorPasso && z.casas.has(key(nx, ny)));
      if (espinhos) {
        const r = damageRoll(this.rng, espinhos.danoPorPasso);
        this.say('magia', `${alvo.name} é arrastado pelos espinhos: ${r.total} perfurante.`);
        // Cada 1,5 m arrastado é um dano à parte, não parte do golpe que empurrou.
        this.outraFonte(() => this.applyDamage(alvo, r.total, 'perfurante', null, { magico: true }));
        if (alvo.dead) break;
      }
    }
    if (caminho.length > 1) {
      this.say('condicao', `${alvo.name} é empurrado ${(caminho.length - 1) * 5} pés.`);
      this.onEvent({ type: 'moved', actor: alvo, from: de, to: { ...alvo.pos }, path: caminho, empurrado: true });
    }
  }

  // ---- resistência ---------------------------------------------------------

  /**
   * Teste de resistência COM os dados de condição.
   *
   * `saveBonusDice` existia em `conditions.js` desde sempre, era coletado por
   * `conditionEffects` e não era lido por ninguém. A Bênção diz, no próprio
   * texto, "some 1d4 às jogadas de ataque E aos testes de resistência", e
   * entregava só a primeira metade — o tipo de defeito que nunca aparece num
   * teste, porque o número sai plausível de qualquer jeito.
   *
   * Esta é a ÚNICA porta: `savingThrow` não deve ser chamada direto de lugar
   * nenhum deste arquivo, ou a próxima condição com dado de resistência vai
   * valer em três sítios e faltar num quarto.
   */
  resistencia(actor, hab, dc, { vantagem = false } = {}) {
    const fx = conditionEffects(actor);
    // Esquivando dá vantagem em resistência de DES; armadura sem treino dá
    // desvantagem nas de FOR e DES.
    const opts = {
      advantage: vantagem || (hab === 'dex' && (hasCondition(actor, 'esquivando') || fx.vantagemDex))
        || (hab === 'wis' && fx.vantagemSab) || fx.vantagemTeste.includes(hab),
      disadvantage: (!!actor.armorUntrained && (hab === 'str' || hab === 'dex'))
        || fx.saveDisadvantage.includes(hab) || fx.desvantagemTeste.includes(hab),
    };
    let bonus = saveBonus(actor, hab);
    const partes = [];
    if (fx.saveFixo[hab]) {
      bonus += fx.saveFixo[hab];
      // Um rótulo por condição (Lentidão −2, Elo de Proteção +1), não "lentidão" para tudo.
      for (const c of actor.conditions ?? []) {
        const v = CONDITIONS[c.id]?.saveFixo?.[hab];
        if (v) partes.push({ rotulo: CONDITIONS[c.id].name ?? c.id, valor: v });
      }
    }
    for (const dice of fx.saveBonusDice) {
      const r = roll(this.rng, dice);
      bonus += r.total;
      partes.push({ rotulo: `bênção ${dice}[${r.rolls.join('+')}]`, valor: r.total });
    }
    for (const dice of fx.savePenaltyDice) {
      const r = roll(this.rng, dice);
      bonus -= r.total;
      partes.push({ rotulo: `perdição −${dice}[${r.rolls.join('+')}]`, valor: -r.total });
    }
    // O truque Resistência vale UM teste: usado, acaba (e solta a
    // concentração de quem conjurou).
    for (const cond of [...(actor.conditions ?? [])]) {
      if (!CONDITIONS[cond.id]?.consumidaNaResistencia) continue;
      removeCondition(actor, cond.id);
      const dono = this.combatants.find((c) => c.id === cond.source);
      if (dono?.concentrating?.condition === cond.id) dono.concentrating = null;
    }
    return { ...segundaChanceNaResistencia(this, actor, savingThrow(this.rng, bonus, dc, opts), bonus, dc), partes };
  }

  // ---- itens de usar -------------------------------------------------------

  /**
   * Usar um item da mochila.
   *
   * POR QUE ISTO EXISTE
   * A poção de cura dizia, na própria descrição, "uma ação para beber:
   * recupera 2d4+2 pontos de vida". Era mentira. Nada no motor a consumia:
   * ela nascia na mochila de todo personagem, ocupava peso, e clicar nela
   * respondia "é item de mochila". O kit de cura prometia dez usos e não
   * tinha nenhum. Um texto na tela que promete um efeito que o motor não
   * cobra é pior que uma funcionalidade faltando, porque o jogador conta com
   * ele.
   *
   * A ORDEM DAS GUARDAS IMPORTA. O item só sai da mochila DEPOIS que todas
   * as recusas passaram. Consumir antes de validar gasta a poção e não cura —
   * e é o tipo de defeito que só aparece no turno em que ela fazia falta.
   *
   * @returns {{ok: boolean, why?: string}}
   */
  useItem(actor, itemId, { target = actor } = {}) {
    const dados = itemDeId(itemId)?.dados;
    if (!dados?.consumivel) return { ok: false, why: `${nomeDeId(itemId)} não é item de usar` };

    const porBonus = dados.acao === 'bonus';
    if (porBonus ? actor.bonusUsed : actor.actionUsed) {
      return { ok: false, why: porBonus ? 'a ação bônus deste turno já foi usada' : 'a ação deste turno já foi usada' };
    }
    if (!quantosNaMochila(actor, itemId)) return { ok: false, why: `${dados.name} não está na mochila` };

    const veto = this.vetoDeItem(actor, dados, target);
    if (veto) return { ok: false, why: veto };

    // Daqui para baixo nada mais recusa: pode cobrar.
    const gasto = consumirDaMochila(actor, itemId);
    if (!gasto) return { ok: false, why: `${dados.name} não está na mochila` };
    if (porBonus) actor.bonusUsed = true; else this.gastarAcaoSimples(actor);

    this.executarItem(actor, dados, target);

    if (gasto.acabou) this.say('recurso', `${actor.name} usou o último ${dados.name.toLowerCase()}.`);
    else if (dados.usos) this.say('recurso', `${dados.name}: restam ${gasto.restam} usos.`);

    this.onEvent({ type: 'item', actor, item: dados, target });
    this.afterAction(actor);
    this.checkEnd();
    return { ok: true };
  }

  /** O que impede ESTE item neste alvo. `null` = pode. */
  vetoDeItem(actor, dados, target) {
    if (dados.consumivel === 'curar' || dados.consumivel === 'estabilizar') {
      if (target !== actor && !this.field.vizinhos(actor.pos, target.pos)) {
        return `${target.name} está longe demais — é preciso estar encostado`;
      }
    }
    if (dados.consumivel === 'curar') {
      if (target.dead) return `${target.name} já morreu`;
      // Beber de vida cheia é LEGAL na regra e é sempre um erro de clique.
      // Recusar custa ao jogador um aviso; deixar passar custa a poção que
      // faria falta dois turnos depois.
      if (target.hp >= target.maxHp) return `${target.name} está com a vida cheia`;
    }
    // Curandeiro: o kit cura, não só estabiliza (`talentos.js`).
    const medico = dados.consumivel === 'estabilizar' ? vetoDoMedico(actor, target) : undefined;
    if (medico !== undefined) return medico;
    if (dados.consumivel === 'estabilizar') {
      if (!hasCondition(target, 'inconsciente')) return `${target.name} não está caindo`;
      if (target.stable) return `${target.name} já está estável`;
      if (target.dead) return `${target.name} já morreu`;
    }
    if (dados.consumivel === 'arremesso') {
      if (target === actor) return 'não dá para arremessar em si mesmo';
      const dist = distanceFt(actor.pos, target.pos);
      if (dist > (dados.rangeFt ?? 20)) return `fora de alcance — ${dist} pés, alcança ${dados.rangeFt ?? 20}`;
      if (!this.field.hasLineOfSight(actor.pos, target.pos)) return 'sem linha de visão';
    }
    return null;
  }

  executarItem(actor, dados, target) {
    switch (dados.consumivel) {
      case 'curar': {
        const r = /^\d+$/.test(dados.cura) ? { total: Number(dados.cura), rolls: [dados.cura] } : roll(this.rng, dados.cura);
        const curado = this.heal(target, r.total, dados.name);
        const quem = target === actor ? 'bebe' : `dá ${dados.name.toLowerCase()} a ${target.name}:`;
        this.say('cura', `${actor.name} ${quem} ${curado} PV.`, `${dados.cura} = ${r.total}`);
        break;
      }
      case 'estabilizar': {
        if (vetoDoMedico(actor, target) === null) {
          medicoDeCampanha(this, actor, target);
          break;
        }
        // Sem teste de Medicina: é essa a vantagem do kit sobre as mãos.
        target.stable = true;
        this.say('cura', `${actor.name} estabiliza ${target.name} com o kit de cura.`, 'sem teste: o kit dispensa Medicina');
        this.onEvent({ type: 'stabilized', target, by: actor });
        break;
      }
      case 'arremesso': {
        // Ataque à distância improvisado: sem proficiência, só Destreza.
        const bonus = abilityMod(actor.abilities.dex);
        const cobertura = this.field.coverBetween(actor.pos, target.pos);
        const mods = this.attackModifiers(actor, target, { ranged: true });
        const r = attackRoll(this.rng, bonus, caEfetiva(target) + cobertura, mods);
        if (!r.hit) {
          this.say('ataque', `${actor.name} arremessa ${dados.name.toLowerCase()} e erra ${target.name}.`,
            `d20[${r.rolls.join('/')}]${formatModifier(bonus)} = ${r.total} vs CA ${caEfetiva(target) + cobertura}`);
          break;
        }
        const imune = dados.alvoApenas && !dados.alvoApenas.includes(target.kindTag ?? target.tipo);
        if (imune) {
          this.say('aviso', `${dados.name} acerta ${target.name} e não faz nada: só afeta ${dados.alvoApenas.join(' e ')}.`);
          break;
        }
        const dmg = damageRoll(this.rng, dados.damage, { critical: r.critical });
        this.applyDamage(target, dmg.total, dados.damageType, actor);
        this.say('ataque', `${actor.name} acerta ${target.name} com ${dados.name.toLowerCase()}: ${dmg.total} de ${dados.damageType}.`,
          `d20[${r.rolls.join('/')}]${formatModifier(bonus)} = ${r.total} vs CA ${caEfetiva(target) + cobertura}`);
        break;
      }
      default:
        // `beneficio` e `untar` estão no catálogo e ainda não têm efeito. Dizer
        // isso é melhor que gastar a ação em silêncio e o jogador achar que
        // funcionou.
        this.say('aviso', `${dados.name} ainda não tem efeito implementado.`);
    }
  }

  // ---- outras ações --------------------------------------------------------

  /**
   * Gasta a ação para Disparada, Desengajar ou usar objeto. Com Velocidade, a
   * ação a mais (que só serve para isso e para um golpe) sai primeiro, e a
   * ação de verdade fica para o Ataque Extra ou uma magia.
   */
  gastarAcaoSimples(actor) {
    if (!actor.actionUsed && actor.acaoVelozDisponivel && hasCondition(actor, 'acelerado') && !actor.acaoLimitada) {
      actor.acaoVelozDisponivel = false;
      this.say('recurso', `${actor.name} usa a ação da Velocidade.`);
      return true;
    }
    if (actor.actionUsed) return false;
    actor.actionUsed = true;
    return true;
  }

  dash(actor) {
    if (!this.gastarAcaoSimples(actor)) return false;
    actor.movementLeftFt += this.speedOf(actor);
    this.say('acao', `${actor.name} corre (Disparada).`);
    this.afterAction(actor);
    return true;
  }

  /**
   * Primeiros socorros (SRD): ação para estabilizar quem está em 0 PV, com um
   * teste de Sabedoria (Medicina) CD 10. Não cura — impede de morrer.
   *
   * É a válvula de segurança do 5e e estava faltando: sem ela, quem cai sem
   * haver espaço de magia sobrando morre, e o grupo não tem o que fazer.
   */
  stabilize(actor, target) {
    if (actor.actionUsed || actor.acaoLimitada || !this.field.vizinhos(actor.pos, target.pos)) return false;
    if (!hasCondition(target, 'inconsciente') || target.stable || target.dead) return false;
    actor.actionUsed = true;

    const check = this.testeDeAtributo(actor, 'wis', skillBonus(actor, 'medicina'), 'Medicina');
    if (check.total >= 10) {
      target.stable = true;
      this.say('cura', `${actor.name} estabiliza ${target.name}.`, `Medicina ${check.total} vs CD 10`);
      this.onEvent({ type: 'stabilized', target, by: actor });
    } else {
      this.say('aviso', `${actor.name} não consegue estancar o sangramento de ${target.name}.`, `Medicina ${check.total} vs CD 10`);
    }
    this.afterAction(actor);
    return true;
  }

  dodge(actor) {
    if (actor.actionUsed || actor.acaoLimitada) return false;
    actor.actionUsed = true;
    addCondition(actor, 'esquivando');
    this.say('acao', `${actor.name} se concentra em desviar.`);
    this.endTurn(actor);
    return true;
  }

  disengage(actor, { bonus = false } = {}) {
    if (bonus) {
      if (actor.bonusUsed) return false;
      actor.bonusUsed = true;
    } else if (!this.gastarAcaoSimples(actor)) return false;
    actor.disengaging = true;
    this.say('acao', `${actor.name} desengaja — ninguém leva ataque de oportunidade dele.`);
    return true;
  }

  useFeature(actor, featureId, { target = null, modo = null } = {}) {
    switch (featureId) {
      case 'secondWind': {
        if (actor.bonusUsed || !actor.resources.secondWind) return false;
        actor.bonusUsed = true;
        actor.resources.secondWind -= 1;
        const r = roll(this.rng, `1d10+${actor.level}`);
        const healed = this.heal(actor, r.total, actor);
        this.say('recurso', `${actor.name} usa Retomar o Fôlego: +${healed} PV.`, `1d10[${r.rolls.join('')}] + ${actor.level}`);
        return true;
      }
      case 'actionSurge': {
        // Uma ação a mais, uma vez por turno (no 17º nível há duas cargas, mas
        // ainda uma por turno). Se a ação normal já foi gasta, o surto a
        // devolve agora; se não, fica guardada para depois dela — nunca as
        // duas coisas, que davam três ações com uma carga.
        if (!actor.resources.actionSurge || actor.surgeUsedThisTurn) return false;
        actor.resources.actionSurge -= 1;
        actor.surgeUsedThisTurn = true;
        if (actor.actionUsed) actor.actionUsed = false;
        else actor.extraActions += 1;
        this.say('recurso', `${actor.name} usa Ação Surpreendente — ganha uma ação.`);
        return true;
      }
      case 'cunningAction': {
        // Ação Ardilosa: UMA de Disparada ou Desengajar como ação bônus (o SRD
        // dá também Esconder-se, que o motor ainda não tem).
        if (actor.bonusUsed) return false;
        if (modo !== 'disparada' && modo !== 'desengajar') return false;
        actor.bonusUsed = true;
        if (modo === 'disparada') {
          actor.movementLeftFt += this.speedOf(actor);
          this.say('recurso', `${actor.name} usa Ação Ardilosa: corre.`);
        } else {
          actor.disengaging = true;
          this.say('recurso', `${actor.name} usa Ação Ardilosa: desengaja.`);
        }
        return true;
      }
      case 'preserveLife': {
        if (actor.actionUsed || actor.acaoLimitada || !actor.resources.channelDivinity) return false;
        actor.actionUsed = true;
        actor.resources.channelDivinity -= 1;
        let pool = actor.level * 5;
        const wounded = [actor, ...this.alliesOf(actor)]
          .filter((a) => !a.dead && a.hp < a.maxHp && distanceFt(actor.pos, a.pos) <= 30)
          .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
        this.say('recurso', `${actor.name} canaliza Preservar a Vida (${pool} PV para dividir).`);
        for (const a of wounded) {
          if (pool <= 0) break;
          const cap = Math.floor(a.maxHp / 2); // não pode passar da metade dos PV máximos
          const want = Math.min(pool, Math.max(0, cap - a.hp), a.maxHp - a.hp);
          if (want <= 0) continue;
          pool -= want;
          this.heal(a, want, actor);
        }
        this.afterAction(actor);
        return true;
      }
      default:
        return false;
    }
  }

  // ---- log -----------------------------------------------------------------

  /**
   * Abre a conta de um teste de resistência já rolado.
   *
   * Não rola nem decide nada: recebe o `save` pronto. Existe porque os quatro
   * lugares que fazem resistência (efeito de ataque, concentração, magia de
   * área e teste de morte) contavam a mesma coisa de quatro jeitos diferentes,
   * e nenhum deles dizia contra o quê o teste era nem o que o sucesso compra.
   *
   * O bônus vem de `saveBonus`, a mesma função que a rolagem usou, e a
   * proficiência sai por subtração — assim as parcelas somam o total por
   * construção, sem duplicar a regra aqui.
   */
  explicarResistencia(actor, atributo, cd, save, { contra, seSucesso, automatica = false, motivoAutomatico = null } = {}) {
    const bonus = saveBonus(actor, atributo);
    const base = abilityMod(actor.abilities[atributo]);
    const bonusPartes = [{ rotulo: ABILITY_NAME[atributo], valor: base }];
    if (bonus !== base) bonusPartes.push({ rotulo: 'proficiência', valor: bonus - base });

    const r = {
      categoria: 'resistencia',
      actor,
      atributo,
      atributoNome: `resistência de ${ABILITY_NAME[atributo]}`,
      contra,
      cd,
      bonus,
      bonusPartes,
      d20Rolls: automatica ? [] : [...(save.rolls ?? [])],
      total: save.total,
      modo: save.mode ?? 'normal',
      sucesso: !!save.success,
      automatica,
      motivoAutomatico,
      seSucesso,
    };
    r.conta = contaDeResistencia(r);
    this.onEvent({ type: 'rolagem', ...r });
    return r;
  }

  /**
   * `extra` entra no registro como campos a mais (a rolagem aberta, por
   * exemplo). O HUD lê `kind`, `text` e `detail` e ignora o resto — é o que
   * permite enriquecer o log sem tocar em arquivo de outro dono.
   */
  say(kind, text, detail = null, extra = null) {
    const entry = { kind, text, detail, round: this.round, ...extra };
    this.log.push(entry);
    this.onLog(entry);
  }
}
