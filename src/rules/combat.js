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
import { Battlefield, distanceFt, isAdjacent, key, footprintOf, FEET_PER_SQUARE, SUPERFICIES } from '../core/grid.js';
import { ARMORS, SHIELD_AC } from './items/index.js';
import { nomeDaCaracteristica } from './classes/index.js';
import { vestirFera, despirFera, formasDisponiveis, crEmNumero } from './forma-selvagem.js';
import {
  abilityMod, saveBonus, skillBonus, rolarPericia, spellSaveDc, spellAttackBonus,
  proficiencyBonus, ABILITY_NAME, passivePerception, ajustarTeste, treinadoEm,
} from './abilities.js';
import {
  WEAPONS, weaponAbility, armorClass,
  itemDeId, nomeDeId, quantosNaMochila, consumirDaMochila, garantirInventario, equipar, transferirItem,
} from './equipment.js';
import { SURTOS } from './surto.js';
import { addCondition, removeCondition, hasCondition, getCondition, conditionEffects, caEfetiva, maxHpEfetivo, nivelDeExaustao, mudarExaustao, CONDITIONS, alcanceDaVisaoVerdadeira } from './conditions.js';

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
import { SPELLS, getSpell, magiasProntas, dadosDaMagia, APRIMORAR, esferaDoCruzamento } from './spells.js';
import { makeMonster, MONSTERS } from './monsters.js';
import {
  prepararTalentos, garantirPortento, bonusDeIniciativa, segundaChanceNoAtaque, segundaChanceNaResistencia,
  ajustarDanoDeArma, depoisDoAcerto, rolarCura, vetoDoMedico, medicoDeCampanha, temUsoGratis, gastarUsoGratis,
  temTalento, golpePoderoso, atiradorDeElite, atiraColado, atiradorArcano, reducaoDaArmaduraPesada, adeptoIgnoraResistencia,
  adeptoNosDados, duelistaDefensivo, vantagemDoAgarrador, naoSePegaOculto, concentracaoDosTalentos,
} from './talentos.js';
import { HASTES_DO_GOLPE, HASTES_DO_ALCANCE } from './talentos-phb.js';
import { concedidasDe } from './magias-concedidas.js';
import { escalarEspirito } from './monsters/espiritos-tce.js';
import { spellMod } from './party.js';
import { modificadoresDeLuz, sofreComOSol, podeVer, nivelDeLuz, fontesDeLuz, CLARO } from './luz.js';
import { magiasDosItens, gastarCargaDoItem, cargasDe } from './itens-que-conjuram.js';
import { atualizarItensPassivos } from './itens-passivos.js';
import { DOENCAS, curarDoencas } from './doencas.js';
import { regioesNoPasso, regioesNoTurno } from './regioes.js';
import { categoriaDeTamanho } from './tamanho.js';
import * as Livro from './livro-motor.js';
import * as Sub from './subclasses-livros.js';
import * as Raca from './racas-motor.js';
import { chamaNaCasa } from './chamas.js';
const temEscuridaoDoMapa = (enc) => Boolean(enc.field?.luz);
/** Quem tem um OLHAR que se evita desviando os olhos: o Olhar Petrificante da medusa e as auras de olhar (o brutamonte umbral). */
const temOlhar = (m) => Boolean(m?.traits?.includes('olharPetrificante') || m?.aura?.olhar);
import { casaLongeDe, magiaLendaria } from './ai.js';
import {
  vantagemPorTraco, contraDaMagia, margemDeCritico, dadosExtraDeCritico, danoPorResistencia, TIPOS_DA_PUREZA, CONDICOES_DE_ENCANTO,
  bonusDeDanoPorTraco, usoLivreDe, PLANTAS_QUE_PRENDEM, ehInimigoFavorito, danoDeQueda,
} from './passivas.js';

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
/** A média de uma notação de dados ("1d10+3", "2d8"): a conta de quem escolhe o que rende mais. */
function mediaDeDados(notacao) {
  const n = String(notacao ?? '');
  let total = 0;
  for (const [, q, l] of n.matchAll(/(\d+)d(\d+)/g)) total += Number(q) * (Number(l) + 1) / 2;
  for (const [, sinal, v] of n.replace(/\d+d\d+/g, '').matchAll(/([+-])\s*(\d+)/g)) total += (sinal === '-' ? -1 : 1) * Number(v);
  return total;
}

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
    r.modo && r.modo !== 'normal' ? MODO_TEXTO[r.modo] + (r.vantagemPor?.length ? ` (${r.vantagemPor.join(', ')})` : '') : null,
    r.sucesso ? 'passou' : 'falhou',
    `se passar: ${r.seSucesso}`,
  ].filter(Boolean).join(' · ');
}

/** A última reta de um caminho: quantos pés foram andados na mesma direção até a casa final, e a direção. */
function retaNoFim(caminho) {
  if (!caminho || caminho.length < 2) return null;
  const n = caminho.length - 1;
  const dx = Math.sign(caminho[n].x - caminho[n - 1].x);
  const dy = Math.sign(caminho[n].y - caminho[n - 1].y);
  let passos = 1;
  for (let i = n - 1; i > 0; i--) {
    if (Math.sign(caminho[i].x - caminho[i - 1].x) !== dx || Math.sign(caminho[i].y - caminho[i - 1].y) !== dy) break;
    passos += 1;
  }
  return { pes: passos * 5, dx, dy };
}

/** '5-6' ou [5, 6] → 5. `null` quando o ataque não recarrega. */
function recargaMinima(recharge) {
  if (!recharge) return null;
  if (Array.isArray(recharge)) return Math.min(...recharge);
  return Number(String(recharge).split('-')[0]) || 6;
}

// O chão em que a CAMUFLAGEM DE PEDRA (grick, gnomo das profundezas) esconde: rocha, caverna, laje, entulho.
const TERRENO_DE_PEDRA = new Set(['pedra', 'rocha', 'caverna', 'pedregal', 'estalagmite', 'entulho', 'desabamento', 'mina', 'lajeMina', 'laje', 'alvenaria']);

// A NUVEM DE TINTA do polvo gigante (SRD): uma esfera de 6 m em volta dele, só na água, escuridão pesada por 1 minuto.
const NUVEM_DE_TINTA = {
  id: 'nuvemDeTinta',
  name: 'Nuvem de Tinta',
  level: 0,
  shape: 'sphere',
  areaFt: 20,
  centradoEmSi: true,
  zona: { rodadas: 10, quando: 'nunca', aoEntrar: false, dificil: false, semTeste: true, obscuro: 'pesada' },
};

// Plantas Constritoras (o vine blight): a zona que o TRAÇO cria, escrita no
// formato que `criarZona` já entende. Não é magia — é traço de criatura — mas a
// zona é a mesma máquina da Teia e da Graxa, e reusá-la é mais honesto que
// escrever um segundo motor de área só para uma criatura.
const PLANTAS_CONSTRITORAS = {
  id: 'plantasConstritoras',
  name: 'Plantas Constritoras',
  level: 0,
  shape: 'sphere',
  areaFt: 15,
  centradoEmSi: true,
  save: 'str',
  // Contido até se soltar: FOR CD 12 com a ação (`escape` sai da CD da zona).
  onFail: { condition: 'contido', rounds: Infinity },
  // 1 minuto = 10 rodadas. Quem entra DEPOIS só pega o terreno difícil: no
  // livro o teste é "quando as plantas aparecem", e só.
  zona: { rodadas: 10, dificil: true, quando: 'nenhum', aoEntrar: false, em: 'nas' },
};

// Recargas que não são de ataque: traço de criatura com "Recarga 5–6".
const RECARGA_DE_TRACO = {
  'Plantas Constritoras': [5, 6], 'Pressa': [5, 6], 'Possessão': [6], 'Rasgo Sináptico': [5, 6], 'Esmagamento Psíquico': [5, 6], 'Coroa Psiônica': [5, 6], 'Tentáculos Cerebrais': [5, 6], 'Rajada de Calor': [5, 6],
};

/**
 * Até onde se JOGA uma poção de cura, em pés. Regra da casa: o livro não tem
 * arremesso de poção, só o ato de DAR a poção a quem está ao alcance do toque.
 * Os 6 m são os mesmos do arremesso de frasco (água benta, ácido, fogo
 * alquímico), para a mão do herói ter um alcance só.
 */
// A categoria de tamanho do SRD (Miúdo 0 ... Imenso 5), para a regra de passar pelo espaço de outro: `rules/tamanho.js`.
const TOMADAS_NENHUMA = { tomada: () => false, atravessa: () => true };

const ARREMESSO_DE_POCAO_FT = 20;

// Crescimento de Plantas: o chão que não é natural (pedra, estrada, caverna, água, obra) não vira mato.
const SEM_PLANTAS = new Set(['estrada', 'caverna', 'ponte', 'leito', 'poco', 'riacho', 'entulho', 'fogueira', 'rocha', 'parede']);

/** A munição +N de maior bônus que o herói leva (`municaoMais3` antes da `municaoMais1`), ou null. */
function melhorMunicao(actor) {
  for (const id of ['municaoMais3', 'municaoMais2', 'municaoMais1']) {
    if ((actor.bag ?? []).some((b) => b.id === id && (b.qtd ?? 1) > 0)) return id;
  }
  return null;
}

/**
 * Quem tem DESLOCAMENTO DE NADO (o tritão, o povo-lagarto, o elfo do mar, a Armadura do Marinheiro) não paga a água funda
 * como terreno difícil: é o que o nado do livro quer dizer. Antes o nado só servia para não se afogar.
 */
const nadador = (c) => (c?.speeds?.swimFt ?? 0) > 0 || !!c?.doItem?.nado;

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
    this.surpreendidos = new Set();
    // Função (round) → { aviso, units } ou null. O motor não sabe QUEM chega;
    // isso é dado do encontro.
    this.reinforcements = reinforcements;

    this.combatants = [...party, ...foes];
    // o que os itens fazem só por estar com o herói (`itens-passivos.js`): a soma pronta, conferida no começo da luta
    for (const c of party) if (c.bag?.length || c.doItem) atualizarItensPassivos(c);
    // Áreas que ficam no chão depois da magia (Graxa). O terreno difícil delas
    // vai para o campo, que é quem calcula o custo de andar.
    this.zonas = [];
    this.auras = [];
    this.field.dificeis = new Set();
    this.field.dificeis4 = new Set();
    this.field.dificeisExtra = null;
    this.field.voando = false;
    this.field.escalando = false;
    this.field.sobreAgua = false;
    this.field.atravessaVao = false;
    this.field.semTerrenoDificil = false;
    this.field.passoDaTerra = false;
    this.field.escalaSemCusto = false;
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
      c.sneakUsedThisTurn = false; c.golpeDivinoNoTurno = false; c.presaNoTurno = false;
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
      if (c.dead || conditionEffects(c).inalcancavel) return false;
      const f = c.pos.f ?? 1;
      return x >= c.pos.x && x < c.pos.x + f && y >= c.pos.y && y < c.pos.y + f;
    });
  }

  occupied(x, y, except = null) {
    const c = this.at(x, y);
    return !!c && c !== except;
  }

  /**
   * As criaturas (fora `actor`) cujo corpo cobre a pegada f x f com canto em (x, y). É O conceito único de "casa tomada" do
   * caminho: `reachableFor`, `moveAlong`, a IA e o clique do tabuleiro passam por aqui, e a pegada Grande entra na conta.
   */
  outrosNaPegada(x, y, f = 1, actor = null) {
    return this.combatants.filter((c) => {
      if (c === actor || c.dead || conditionEffects(c).inalcancavel) return false;
      const g = c.pos.f ?? 1;
      return x < c.pos.x + g && x + f > c.pos.x && y < c.pos.y + g && y + f > c.pos.y;
    });
  }

  /**
   * SRD 5.1, "Moving Around Other Creatures": passa-se pelo espaço de uma criatura NÃO hostil (aliado e neutro); pelo de uma
   * hostil só se ela for duas categorias de tamanho maior ou menor. Caído e inconsciente não mudam a regra. Terminar o
   * movimento no espaço dela continua proibido (a busca marca `parar: false`), e o espaço dela é terreno difícil (`costOf`).
   */
  podeAtravessar(actor, outro) {
    // Forma Gasosa (`atravessaVao`): o SRD deixa a névoa entrar no espaço de OUTRA criatura, hostil ou não. Aqui ela atravessa
    // qualquer um, mas NÃO termina dentro (`parar` segue falso): duas criaturas na mesma casa o tabuleiro e o clique não
    // representam. Simplificação declarada.
    if (conditionEffects(actor).atravessaVao || actor.traits?.includes('formaFluida')) return true;
    const hostis = actor.side !== outro.side && actor.side !== 'neutro' && outro.side !== 'neutro';
    if (!hostis) return true;
    // AGILIDADE HALFLING: atravessa o espaço de QUALQUER criatura de tamanho maior que o seu, hostil ou não.
    if (actor.features?.includes('halflingNimbleness') && categoriaDeTamanho(outro) > categoriaDeTamanho(actor)) return true;
    return Math.abs(categoriaDeTamanho(actor) - categoriaDeTamanho(outro)) >= 2;
  }

  /**
   * As casas tomadas por OUTRAS criaturas, montadas UMA vez por busca (`reachableFor`, `moveAlong`): casa -> quem a cobre, já
   * com "atravessa?" resolvido por criatura. A busca pergunta isto por vizinho, e varrer o bando a cada pergunta custava 2x.
   * `tomada(x, y, f)`: alguém cobre a pegada f x f com canto em (x, y). `atravessa(x, y, f)`: todos eles se atravessam.
   */
  casasTomadas(actor) {
    const celulas = new Map();
    for (const c of this.combatants) {
      if (c === actor || c.dead || conditionEffects(c).inalcancavel) continue;
      const passa = this.podeAtravessar(actor, c);
      const g = c.pos.f ?? 1;
      for (let dy = 0; dy < g; dy++) {
        for (let dx = 0; dx < g; dx++) {
          const k = (c.pos.y + dy) * 4096 + c.pos.x + dx;
          const lista = celulas.get(k);
          if (lista) lista.push(passa); else celulas.set(k, [passa]);
        }
      }
    }
    if (!celulas.size) return TOMADAS_NENHUMA;
    return {
      tomada(x, y, f = 1) {
        for (let dy = 0; dy < f; dy++) for (let dx = 0; dx < f; dx++) if (celulas.has((y + dy) * 4096 + x + dx)) return true;
        return false;
      },
      atravessa(x, y, f = 1) {
        for (let dy = 0; dy < f; dy++) {
          for (let dx = 0; dx < f; dx++) {
            const lista = celulas.get((y + dy) * 4096 + x + dx);
            if (lista && lista.includes(false)) return false;
          }
        }
        return true;
      },
    };
  }

  /** O predicado que a busca do caminho (`Battlefield.reachable`) usa para saber se atravessa o que ocupa a casa. */
  atravessaPara(actor, f = actor.pos?.f ?? 1) {
    const t = this.casasTomadas(actor);
    return (x, y) => t.atravessa(x, y, f);
  }

  enemiesOf(actor) {
    // O NPC neutro (o goblin que só quer conversar) não é inimigo de ninguém
    // até a cena mudar o lado dele.
    // `ignora`: um guardião pode não ver inimigo em quem traz a senha ou o
    // sinal certo (os esqueletos da cripta e o manto vermelho). A cena põe o
    // predicado na criatura; sem ele, nada muda. Antes isso só decidia se a
    // luta COMEÇAVA — começada, o esqueleto atacava até quem estava de manto.
    const todos = this.combatants.filter((c) => c.side !== actor.side && c.side !== 'neutro'
      && !c.dead && !hasCondition(c, 'inconsciente') && !conditionEffects(c).inalcancavel
      && !actor.ignora?.(c));
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

  /** A chave do turno corrente (rodada e lado): o que vale "até o fim do turno" se marca com ela, sem precisar zerar. */
  turnoKey() {
    return `${this.round}:${this.side}`;
  }

  speedOf(actor) {
    const fx = conditionEffects(actor);
    if (fx.speedOverride !== null) return fx.speedOverride;
    // AURA DE CONQUISTA (zera) e EMBOSCADOR TEMÍVEL (+3 m na 1ª rodada)
    const ajusteSub = Sub.ajusteDoDeslocamento(this, actor);
    if (ajusteSub.zera) return 0;
    if (ajusteSub.metade) return Math.floor(this.speedOfSemSub(actor, fx) / 2);
    if (ajusteSub.soma) return this.speedOfSemSub(actor) + ajusteSub.soma;
    return this.speedOfSemSub(actor, fx);
  }

  speedOfSemSub(actor, fx = conditionEffects(actor)) {
    // SENTINELA: o ataque de oportunidade que acertou zera o deslocamento até o fim do turno.
    if (actor.detidoEm && actor.detidoEm === this.turnoKey()) return 0;
    // PALAVRA DE PODER DOR: o deslocamento não passa de 3 m.
    if (hasCondition(actor, 'dorAtroz')) return Math.min(10, this.speedOfBase(actor));
    return this.speedOfBase(actor);
  }

  speedOfBase(actor) {
    const fx = conditionEffects(actor);
    if (fx.speedOverride !== null) return fx.speedOverride;
    // Armadura pesada sem a Força mínima tira 3 m do deslocamento.
    const forcaMinima = ARMORS[actor.armor ?? 'nenhuma']?.forcaMinima ?? 0;
    const pesada = forcaMinima > (actor.abilities?.str ?? 10) ? 10 : 0;
    // MOVIMENTO RÁPIDO (bárbaro) e MOVIMENTO SEM ARMADURA (monge): o bônus
    // da classe só vale com o corpo livre — o bárbaro fora da armadura
    // pesada, o monge sem armadura nenhuma e sem escudo.
    const semArmadura = (!actor.armor || actor.armor === 'nenhuma') && !actor.shield;
    const livre = actor.features?.includes('unarmoredMovement')
      ? semArmadura : ARMORS[actor.armor ?? 'nenhuma']?.categoria !== 'pesada';
    const daClasse = livre ? (actor.bonusDeDeslocamento ?? 0) : 0;
    // Forma Gasosa: o voo SUBSTITUI o andar, não se soma a ele.
    // Voo de ficha (o dragão): enquanto está no ar, ele usa o deslocamento de
    // VOO no lugar do de andar -- 24 m contra 12 m no verde jovem. Era o
    // `flyFt` que a ficha declarava e ninguém lia.
    const vooDaFicha = this.voaPelaFicha(actor) ? (actor.flyFt ?? 0) : 0;
    const base = fx.soVoa ? fx.vooFt : Math.max(actor.speedFt, fx.vooFt, vooDaFicha);
    // Liberdade de Movimento: "nenhuma MAGIA reduz o deslocamento" — e só
    // magia. A primeira versão disto tirava toda redução e, pior, zerava o
    // multiplicador: medido, um herói sob Velocidade ia de 18 m para 9 m, ou
    // seja, a magia o deixava MAIS LENTO. Agora ela tira os 3 m da Lentidão
    // (`speedPenaltyFt`, cuja única fonte é mágica) e a metade que vem de
    // magia (`speedHalfMagico`). Ficam de pé, porque não são magia: a armadura
    // pesada sem Força, a metade do 2º degrau de exaustão e o `speedOverride`
    // que PARA (paralisia, 5º degrau). E o dobro da Velocidade, que é bônus.
    const semFreio = fx.semReducaoDeDeslocamento;
    const pes = Math.max(0, base + daClasse - (semFreio ? 0 : fx.speedPenaltyFt) - pesada);
    const daPedra = actor.features?.includes('stoneSpeed') ? 10 : 0;
    const comBonus = (pes + daPedra + fx.speedBonusFt) * (fx.speedMult ?? 1);
    const metade = fx.speedHalf || (fx.speedHalfMagico && !semFreio);
    return metade ? Math.floor(comBonus / 10) * 5 : comBonus;
  }

  // ---- ciclo de turnos -----------------------------------------------------

  start() {
    prepararTalentos(this);
    // `iniciativaRuim` é o lado que foi pego fora de posição: ele VIU o outro,
    // então não há surpresa, mas rola a iniciativa com desvantagem. É o castigo
    // de quem tentou se esconder e foi notado (`game/regiao.js`).
    const benção = { party: Sub.vantagemDaBencaoVigilante(this, 'party'), foes: Sub.vantagemDaBencaoVigilante(this, 'foes') };
    const partyInit = d20(this.rng, this.bestDex('party'), { advantage: this.instintoSelvagem('party') || Sub.vantagemNaIniciativa(this, 'party') || benção.party, disadvantage: this.iniciativaRuim === 'party' });
    const foeInit = d20(this.rng, this.bestDex('foes'), { advantage: this.instintoSelvagem('foes') || Sub.vantagemNaIniciativa(this, 'foes') || benção.foes, disadvantage: this.iniciativaRuim === 'foes' });
    // DISPARO SEMPRE PRONTO e ESPÍRITO INCANSÁVEL: um uso de volta ao rolar a iniciativa sem nenhum.
    Sub.aoRolarIniciativa(this);
    this.say('inicio', `Iniciativa — Grupo ${partyInit.total} × ${foeInit.total} Inimigos`);
    // INSPIRAÇÃO SUPERIOR (bardo, 20º): ao rolar iniciativa SEM Inspiração Bárdica, recupera uma.
    for (const c of this.combatants) {
      if (!c.dead && c.features?.includes('superiorInspiration') && (c.resources?.bardicInspiration ?? 0) === 0 && (c.resourcesMax?.bardicInspiration ?? 0) > 0) {
        c.resources.bardicInspiration = 1;
        this.say('recurso', `${c.name} entra na luta já inspirado: recupera uma Inspiração Bárdica (Inspiração Superior).`);
      }
    }
    // PRODÍGIO (mago de Adivinhação): os dados do dia são rolados na primeira luta depois de um descanso longo.
    for (const c of this.combatants) garantirPortento(this, c);
    // O COMPANHEIRO do Senhor das Feras entra com o grupo.
    for (const c of [...this.combatants]) if (!c.dead && c.features?.includes('rangersCompanion') && !this.invocadosDe(c).some((x) => x.invocado.spellId === 'companheiroAnimal')) this.criarCompanheiro(c);
    // O DRACO do Guardião Dracônico já chamado entra com o grupo, com os PV que tinha.
    for (const c of [...this.combatants]) if (!c.dead && c.dracoAtivo && c.features?.includes('drakeCompanion') && !this.invocadosDe(c).some((x) => x.invocado.spellId === 'dracoCompanheiro')) Sub.invocarDraco(this, c, { pago: false });
    // IMPLACÁVEL (Mestre de Batalha, 15º): ao rolar iniciativa SEM dados de superioridade, recupera um.
    for (const c of this.combatants) {
      if (!c.dead && c.features?.includes('relentless') && (c.resources?.superiorityDice ?? 0) === 0 && (c.resourcesMax?.superiorityDice ?? 0) > 0) {
        c.resources.superiorityDice = 1;
        this.say('recurso', `${c.name} entra na luta sem se cansar: recupera um dado de superioridade (Implacável).`);
      }
    }
    // EU PERFEITO (monge, 20º): ao rolar iniciativa SEM pontos de ki, recupera 4.
    for (const c of this.combatants) {
      if (!c.dead && c.features?.includes('perfectSelf') && (c.resources?.ki ?? 0) === 0 && (c.resourcesMax?.ki ?? 0) > 0) {
        c.resources.ki = Math.min(4, c.resourcesMax.ki);
        this.say('recurso', `${c.name} se centra no começo da luta: recupera ${c.resources.ki} pontos de ki (Eu Perfeito).`);
      }
    }
    // O aviso de que a exploração virou combate. Sai como EVENTO, e não como
    // som daqui, porque o motor não toca nada: quem ouve é a vista. E sai de
    // `start()` porque são doze os lugares que começam um combate (um por
    // capítulo, mais o encontro solto) — avisar em cada um é esquecer em um.
    this.onEvent({ type: 'iniciativa', party: partyInit.total, foes: foeInit.total });
    this.round = 1;
    // Guarda quem abriu: a rodada só vira quando a vez volta para esse lado.
    this.firstSide = partyInit.total >= foeInit.total ? 'party' : 'foes';
    this.surpresos = this.rolarSurpresa();
    // Quem FOI surpreendido, para o Ataque Surpresa (bugbear, doppelganger): a
    // lista acima se esvazia quando o surpreso perde o turno, mas o dano extra
    // vale a primeira rodada inteira.
    this.surpreendidos = new Set(this.surpresos);
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
    // QUATRO HASTES: quem tenta passar escondido pelo spectator testa Furtividade com desvantagem
    const hastes = this.allOf(alvos).some((c) => !c.dead && c.traits?.includes('quatroHastes'));
    const furtivos = this.emboscada.furtividade
      ?? this.allOf(lado).map((c) => rolarPericia(this.rng, c, 'furtividade', { ...this.furtividadeDoTerreno(c), ...(hastes ? { disadvantage: true } : {}) }).total);
    if (!furtivos.length) return surpresos;
    const menor = Math.min(...furtivos);
    const avisados = [];
    for (const c of this.allOf(alvos)) {
      // Quem dorme não percebe nada: a cena do acampamento diz quem está
      // dormindo (`rules/acampamento.js`), e para esses não há teste.
      // SEMPRE ALERTA (a hidra): uma cabeça fica acordada, então ela nunca é pega dormindo
      if (this.dormindo?.(c) && !c.traits?.includes('sempreAlerta')) {
        surpresos.add(c.id);
        c.reactionUsed = true;
        continue;
      }
      // QUATRO HASTES (o spectator): não há como pegá-lo de surpresa
      if (c.traits?.includes('quatroHastes')) continue;
      // ALERTA (talento de 2014): acordado, não é pego de surpresa (quem dorme caiu no caso de cima).
      if (temTalento(c, 'alertaPhb')) continue;
      // sob o sol, quem é sensível a ele enxerga mal: a Percepção passiva cai 5 (desvantagem)
      if (passivePerception(c) - (sofreComOSol(c, this.field) ? 5 : 0) < menor) {
        // INSTINTO SELVAGEM (bárbaro, 7º): surpreendido e acordado, age normalmente no primeiro turno — o livro pede que entre
        // em fúria antes de qualquer outra coisa; o jogo não cobra a ordem.
        if (c.features?.includes('feralInstinct') && !conditionEffects(c).incapacitated) {
          this.say('recurso', `${c.name} foi pego de surpresa, mas o Instinto Selvagem o põe de pé: age normalmente (entre em fúria antes de tudo).`);
          continue;
        }
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

  /**
   * INSTINTO SELVAGEM (bárbaro, 7º): vantagem na iniciativa. O jogo rola UMA iniciativa por lado, então um bárbaro vivo e
   * consciente dá a vantagem ao lado inteiro: é a leitura mais simples de "o lado age junto", e a declaro aqui.
   */
  instintoSelvagem(side) {
    // ... e o item que dá vantagem na iniciativa (o cetro de alerta, a arma de aviso)
    return this.allOf(side).some((c) => !c.dead && (c.features?.includes('feralInstinct') || c.doItem?.iniciativa) && !conditionEffects(c).incapacitated);
  }

  bestDex(side) {
    // O lado rola uma vez, com o melhor bônus entre os seus — o Alerta soma
    // a proficiência de quem o tem (`talentos.js`).
    // AURA DA SENTINELA (Vigilantes, Tasha): a proficiência do paladino em quem está na aura dele.
    return Math.max(...this.allOf(side).map((c) => bonusDeIniciativa(c) + Sub.bonusDaSentinela(this, c)), 0);
  }

  beginSide(side) {
    // Rodada nova começa quando a vez volta para quem abriu.
    if (side === this.firstSide) this.spawnReinforcements();
    // A LÂMINA SOMBRIA some quando a magia acaba: a arma sai da mão e a de antes volta.
    for (const c of this.combatants) {
      if (!c.weapons?.includes('laminaSombria') || hasCondition(c, 'laminaSombria')) continue;
      c.weapons = c.weapons.filter((w) => w !== 'laminaSombria');
      if (c.equippedWeapon === 'laminaSombria') c.equippedWeapon = c.armaAntesDaLamina ?? c.weapons[0];
      delete c.armaAntesDaLamina;
    }

    this.side = side;
    Sub.inicioDoLado(this, side);
    Sub.surtoNoComecoDoLado(this, side);
    Sub.comecoDoLadoTce2(this, side);
    Sub.comecoDoLadoTce3(this, side);
    Sub.comecoDoLadoTce4(this, side);
    Sub.comecoDoLadoDosLivros2(this, side);
    this.conferirAgarroes();
    for (const c of this.allOf(side)) if (c.lendarias) c.lendariasRestantes = c.lendarias.acoes;
    // o dano que quem está DENTRO faz "num turno" (o vômito do behir, do verme) conta por lado
    for (const c of this.combatants) c.danoDeDentro = 0;
    for (const c of this.combatants) this.invisivelNaAgua(c);
    // O Furtivo e a Vantagem Marcial são UM por turno, e turno é de qualquer
    // um: o ladino que dá ataque de oportunidade no turno do inimigo tem o
    // furtivo de volta quando o turno do outro lado começa.
    for (const c of this.combatants) { c.sneakUsedThisTurn = false; c.golpeDivinoNoTurno = false; c.presaNoTurno = false; c.martialUsedThisTurn = false; }
    // Efeitos que duram "até o começo do próximo turno" do conjurador.
    this.contarDuracoes((cond) => cond.lado === side && cond.quando === 'inicio');
    // as auras que pegam quem começa o turno perto: DEPOIS da contagem, senão a condição nova expira na hora
    this.aurasNoComecoDe(side);
    Sub.auraDeConquistaNoInicio(this, side);
    // Piscar: quem sumiu no fim do turno anterior volta antes de qualquer outra coisa.
    // (quem FUGIU para o Plano Etéreo — a bruxa da noite, o íncubo, o pesadelo — não volta)
    for (const c of this.allOf(side)) if (hasCondition(c, 'etereo') && !getCondition(c, 'etereo').data?.fuga) this.voltarDoEtereo(c);
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
      c.comandouNoTurno = false;
      c.golpeCedido = false;
      c.proibidoAtacar = false;
      this.vinculoDoGuardiao(c);
      for (const ativa of Object.values(c.magiasAtivas ?? {})) ativa.usadoNoTurno = false;
      // Velocidade: uma ação a mais por turno, só para atacar (um golpe),
      // correr, desengajar ou usar um objeto.
      c.acaoLimitada = false;
      c.acaoVelozDisponivel = hasCondition(c, 'acelerado');
      this.comecoDoTurnoMagico(c);
      this.comecoDoTurnoPassivo(c);
      this.engolidosNoTurno(c);
      // O ESTÔMAGO, AS FARPAS e o CONE DO OLHO (os bestiários dos livros, `livro-motor.js`)
      Livro.acidoDosEngolidos(this, c);
      Livro.auraDeVidaNoTurno(this, c);
      Livro.couroFarpado(this, c);
      Livro.apontarCone(this, c);
      this.nimboTick(c);
      // SURTO PERSISTENTE (surto de magia selvagem): um novo surto no começo de cada turno dele.
      if (hasCondition(c, 'surtoRepetido') && !c.dead && !this.surtando) {
        this.surtando = true;
        try { this.surtoDeMagia(c, { forcar: true }); } finally { this.surtando = false; }
      }
      this.restaurarTamanho(c);
      // LUZ RESTAURADORA (surto de magia selvagem): +5 PV no começo de cada turno dele.
      if (hasCondition(c, 'regenCaos') && !c.dead && c.hp > 0) {
        const curaR = Math.min(5, maxHpEfetivo(c) - c.hp);
        if (curaR > 0) { c.hp += curaR; this.say('cura', `${c.name} recupera ${curaR} PV (luz restauradora).`); }
      }
      // CAMPEÃO ANCESTRAL (paladino dos Anciões, 20º): +10 PV no começo de cada turno dele, por um minuto.
      if (hasCondition(c, 'campeaoAnciao') && !c.dead && c.hp > 0) {
        const cura = Math.min(10, maxHpEfetivo(c) - c.hp);
        if (cura > 0) { c.hp += cura; this.say('cura', `${c.name} recupera ${cura} PV (Campeão Ancestral).`); }
      }
      // O COMPANHEIRO do Senhor das Feras só age se o patrulheiro o comanda (`rangersCompanion`).
      if (c.invocado?.spellId === 'companheiroAnimal') { c.actionUsed = true; c.bonusUsed = true; }
      c.sneakUsedThisTurn = false; c.golpeDivinoNoTurno = false; c.presaNoTurno = false;
      c.martialUsedThisTurn = false;
      c.atacouNoTurno = false;
      c.extraActions = 0;
      c.disengaging = false;
      c.magiasNoTurno = [];
      c.surgeUsedThisTurn = false;
      c.atacouDeMonge = false;
      // O ki do Ataque Atordoante paga o turno, não a luta: armar e não
      // acertar perde o ponto, como no livro.
      c.atordoantePronto = false;
      c.manobraPronta = null;
      c.ataqueAposMagia = false;
      this.fimDaFuria(c);
      this.rolarRecarga(c);
      this.tickConditions(c);
      this.burnTick(c);
      this.danoDaCondicaoNoInicio(c);
      this.inicioDoTurnoDoBloco(c);
      this.vinhasTick(c);
      this.ilusaoTick(c);
      // Só quem está a 0 PV rola teste de morte: quem dorme por Sono (inconsciente com PV) não.
      // VINGANÇA ABRASADORA (Celestial, 14º): no lugar do teste contra a morte, ele se levanta.
      if (hasCondition(c, 'inconsciente') && c.kind === 'pc' && !c.stable && c.hp <= 0) { if (!Sub.vingancaAbrasadora(this, c)) this.deathSave(c); }
      else if (c.furiaAlemDaMorte && c.hp <= 0 && !c.stable && !c.dead) this.deathSave(c);
    }
    // quem a Fúria Além da Morte segurava e a fúria largou (fimDaFuria, logo acima) cai ou morre agora
    Sub.conferirFuriaAlemDaMorte(this);
    // Teia: quem começa o turno nela testa. Espíritos Guardiões: o inimigo
    // que começa o turno na aura sofre.
    for (const c of this.allOf(side)) {
      if (c.dead) continue;
      for (const zona of this.zonasEm(c.pos)) if (zona.quando === 'inicio') this.resistirAZona(c, zona, 'começa o turno');
      for (const aura of this.aurasHostisEm(c, c.pos)) this.golpeDaAura(aura, c, 'começa o turno');
    }
    regioesNoTurno(this, side, 'comecaTurno');
    // OS BESTIÁRIOS DOS LIVROS, depois de o turno de cada um estar armado: a Máscara Perturbadora (amedronta antes de
    // agir), o Chão Aberrante (prende o pé), quem voltou do Salto Etéreo (gastou a ação bônus nisso), e o d8 e o d6 de
    // quem está fora de si (age por eles, então vem por último).
    Livro.mascaraPerturbadora(this, side);
    if (this.combatants.some((m) => m.traits?.includes('chaoAberrante'))) { this.atualizarTerrenoDasZonas(); Livro.chaoAberrante(this, side); }
    for (const c of this.allOf(side)) if (c.voltouDoSalto) { c.bonusUsed = true; delete c.voltouDoSalto; }
    Livro.comportamentoForcado(this, side);
    Livro.chegamInvocados(this, side);
    // Passos sem Pegadas: quem ficou perto de quem o conjurou leva o véu.
    this.renovarRastro();
    // o dano "num turno" da hidra conta por lado
    for (const c of this.combatants) if (c.cabecas != null) { c.danoNoTurno = 0; c.cabecaPerdidaNoTurno = false; }
    // a posse acaba quando o corpo cai
    for (const c of this.combatants) if (hasCondition(c, 'possuido') && (c.dead || c.hp <= 0)) this.fimDaPosse(c);
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
      // Traço com recarga (Plantas Constritoras) não está em `attacks`: o nome
      // vem da tabela. A arma de sopro mora no bloco `breath`, fora de
      // `attacks` também. Sem isso, `recargaMinima(undefined)` dava null e o
      // d6 recarregava sempre.
      const sopro = (c.breath?.chaveRecarga ?? c.breath?.name) === nome ? c.breath.recharge
        : c.acoesEspeciais?.find((a) => (a.recargaDe ?? a.nome) === nome)?.recharge ?? null;
      if (r >= (recargaMinima(atk?.recharge ?? sopro ?? RECARGA_DE_TRACO[nome]) ?? 6)) {
        c.recarregando[nome] = false;
        this.say('recurso', `${c.name}: ${nome} recarregou (d6 = ${r}).`);
      }
    }
  }

  /** Começo do turno: some o que dura "até o começo do seu próximo turno". */
  tickConditions(c) {
    if (!c.conditions?.length) return;
    // a que nasceu NESTE começo de turno (os olhos desviados da aura de olhar, `aurasNoComecoDe`, que roda antes) fica
    c.conditions = c.conditions.filter((cond) => !CONDITIONS[cond.id]?.expiresAtTurnStart || cond.data?.nasceuEm === `${this.round}:${this.side}`);
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
    regioesNoTurno(this, side, 'terminaTurno');
    Sub.fimDoLado(this, side);
    Raca.fimDoLado(this, side);
    Sub.fimDoLadoDosLivros(this, side);
    Sub.fimDoLadoTce2(this, side);
    // BRILHO DO CAOS (surto): quem termina o turno a 1,5 m de quem brilha fica cego até o fim do próximo turno dele.
    for (const c of this.allOf(side)) {
      if (c.dead || c.hp <= 0 || hasCondition(c, 'inconsciente')) continue;
      const brilha = this.combatants.some((b) => b !== c && !b.dead && hasCondition(b, 'brilhoCaos') && distanceFt(b.pos, c.pos) <= 5);
      if (!brilha) continue;
      const jaCego = getCondition(c, 'cego');
      if (jaCego) jaCego.rounds = Math.max(jaCego.rounds, 2);
      else if (this.aplicarCondicao(c, 'cego', { rounds: 2, quando: 'fim', lado: c.side, source: c.id })) this.say('condicao', `${c.name} termina o turno ao lado da luz e fica cego.`);
    }
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
    for (const c of this.allOf(side)) this.fimDaPetrificacao(c);
    // MOVIMENTO INCORPÓREO (SRD): quem termina o turno dentro de um objeto leva 1d10 de força.
    for (const c of this.allOf(side)) {
      if (c.dead || !c.traits?.includes('incorporealMovement') || !this.field.blocksMove(c.pos.x, c.pos.y)) continue;
      const d = damageRoll(this.rng, '1d10');
      this.say('dano', `${c.name} termina o turno dentro da pedra: ${d.total} de dano energético.`, `1d10[${d.rolls.join('')}]`);
      this.applyDamage(c, d.total, 'energético', null, { magico: true });
    }
    for (const c of this.allOf(side)) {
      for (const cond of [...(c.conditions ?? [])]) {
        if (!cond.data?.repete || c.dead) continue;
        // Medo: só repete quem termina o turno SEM ver quem o assustou.
        if (cond.data.repete === 'semVisao') {
          const fonteDoMedo = this.combatants.find((x) => x.id === cond.source && !x.dead);
          if (fonteDoMedo && this.field.hasLineOfSight(c.pos, fonteDoMedo.pos)) continue;
        }
        // ASPECTO TERRÍVEL (Quebrador de Juramento): só repete quem termina o turno longe de quem o assustou
        if (cond.data.repete === 'longe') {
          const fonteDoMedo = this.combatants.find((x) => x.id === cond.source && !x.dead);
          if (fonteDoMedo?.pos && c.pos && distanceFt(fonteDoMedo.pos, c.pos) <= (cond.data.longeFt ?? 30)) continue;
        }
        const fonteAVista = cond.data.desvantagemSeVe
          && this.combatants.some((x) => x.id === cond.source && !x.dead && this.field.hasLineOfSight(c.pos, x.pos));
        const save = this.resistencia(c, cond.data.save, cond.data.dc, { contra: { condicao: cond.id }, desvantagem: Boolean(fonteAVista) });
        const nome = CONDITIONS[cond.id]?.name ?? cond.id;
        const r = this.explicarResistencia(c, cond.data.save, cond.data.dc, save, {
          contra: `${nome} (nova resistência no fim do turno)`,
          seSucesso: `deixa de estar ${nome.toLowerCase()}`,
        });
        if (save.success) {
          removeCondition(c, cond.id);
          if (cond.data.presencaDe) (c.imuneAPresenca ??= []).push(cond.data.presencaDe);
          this.say('condicao', `${c.name} se livra: não está mais ${nome.toLowerCase()}.`, r.conta, { rolagem: r });
          this.soltouDaConcentracao(c, cond.id);
        } else {
          this.say('condicao', `${c.name} continua ${nome.toLowerCase()}.`, r.conta, { rolagem: r });
          // o pesadelo que fere quem não se livra dele (Assassino Fantasmagórico)
          if (cond.data.danoAoFalhar) {
            const d = damageRoll(this.rng, cond.data.danoAoFalhar.dano);
            const dono = this.combatants.find((x) => x.id === cond.source) ?? null;
            this.say('dano', `O pesadelo fere ${c.name}: ${d.total} de dano ${cond.data.danoAoFalhar.tipo}.`, `${cond.data.danoAoFalhar.dano}[${d.rolls.join('+')}]`);
            this.applyDamage(c, d.total, cond.data.danoAoFalhar.tipo, dono, { magico: true });
          }
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
      // O lado quente da Muralha de Fogo: quem termina o turno na faixa queima como quem está nela.
      for (const zona of this.zonasNoCalor(c.pos)) this.resistirAZona(c, zona, 'termina o turno no lado quente');
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
      if (c.tamanhoOriginal && !hasCondition(c, 'tamanhoCaos')) this.restaurarTamanho(c);
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
  /** O dado de superioridade do Mestre de Batalha: d8, d10 a partir do 10º, d12 a partir do 18º. */
  dadoDeSuperioridade(c) {
    // ADEPTO MARCIAL (talento) sem ser Mestre de Batalha: o dado do talento é d6.
    if (!c.features?.includes('combatSuperiority')) return '1d6';
    const n = c.level ?? 1;
    return n >= 18 ? '1d12' : n >= 10 ? '1d10' : '1d8';
  }

  /** CD das manobras: 8 + proficiência + o maior entre Força e Destreza. */
  cdDeManobra(c) {
    return 8 + proficiencyBonus(c.level ?? 1) + Math.max(abilityMod(c.abilities?.str ?? 10), abilityMod(c.abilities?.dex ?? 10));
  }

  /** O que a manobra armada faz DEPOIS de acertar: paga o dado, soma o dano e aplica o efeito. Chamado por `extrasDoAcerto`. */
  aplicarManobra(atacante, alvo, extra, tipo, atkTotal = null, ranged = false) {
    const id = atacante.manobraPronta;
    atacante.manobraPronta = null;
    if (!id || id === 'precisionAttack' || (atacante.resources?.superiorityDice ?? 0) < 1) return;
    // A finta só vale contra quem está a 1,5 m: de longe, o dado não se gasta.
    if (id === 'feintingAttack' && distanceFt(atacante.pos, alvo.pos) > 5) return;
    atacante.resources.superiorityDice -= 1;
    const nomes = {
      tripAttack: 'Ataque Derrubador', menacingAttack: 'Ataque Amedrontador', pushingAttack: 'Ataque Empurrão', lungingAttack: 'Ataque Avançado',
      goadingAttack: 'Ataque Provocador', distractingStrike: 'Ataque Distrativo', riposteStrike: 'Riposta',
      disarmingAttack: 'Ataque Desarmante', maneuveringAttack: 'Ataque Estratégico', sweepingAttack: 'Ataque Varredura', feintingAttack: 'Ataque Fintado',
    };
    this.say('recurso', `${atacante.name} gasta um dado de superioridade: ${nomes[id]} (restam ${atacante.resources.superiorityDice}).`);
    const dadoRolado = extra(nomes[id], this.dadoDeSuperioridade(atacante), tipo, false);
    // ATAQUE VARREDURA: se a mesma rolagem também acertaria outra criatura ao lado do alvo e ao alcance de quem ataca, ela sofre o dado.
    if (id === 'sweepingAttack' && atkTotal != null && !ranged && dadoRolado) {
      const outro = this.enemiesOf(atacante).find((e) => e !== alvo && !e.dead && distanceFt(e.pos, alvo.pos) <= 5
        && distanceFt(e.pos, atacante.pos) <= this.reachOf(atacante) && atkTotal >= caEfetiva(e));
      if (outro) {
        this.say('recurso', `A varredura de ${atacante.name} alcança ${outro.name}: +${dadoRolado} de ${tipo}.`, `${atkTotal} contra CA ${caEfetiva(outro)}`);
        this.applyDamage(outro, dadoRolado, tipo, atacante, { deArma: true, corpoACorpo: true });
      }
    }
    // ATAQUE ESTRATÉGICO: o aliado mais perto anda, até o fim do próximo turno dele, sem provocar o alvo.
    if (id === 'maneuveringAttack') {
      const amigo = this.combatants.filter((x) => x !== atacante && !x.dead && x.side === atacante.side && distanceFt(x.pos, atacante.pos) <= 30)
        .sort((a, b) => distanceFt(a.pos, atacante.pos) - distanceFt(b.pos, atacante.pos))[0];
      if (amigo) {
        addCondition(amigo, 'manobrado', { rounds: 1, quando: 'fim', lado: amigo.side, source: atacante.id, data: { de: alvo.id } });
        this.say('recurso', `${amigo.name} pode se reposicionar sem provocar ${alvo.name} (Ataque Estratégico).`);
      }
    }
    if (alvo.dead || ['lungingAttack', 'riposteStrike', 'feintingAttack', 'sweepingAttack', 'maneuveringAttack'].includes(id)) return;
    // O DISTRATIVO: o próximo ataque de um aliado contra o alvo tem vantagem (some no primeiro golpe de quem não é o distrator).
    if (id === 'distractingStrike') {
      this.aplicarCondicao(alvo, 'distraido', { rounds: 1, quando: 'inicio', lado: atacante.side, source: atacante.id });
      this.say('condicao', `${alvo.name} se distrai: o próximo aliado de ${atacante.name} que o atacar tem vantagem.`);
      return;
    }
    // Derrubar e empurrar não afetam criatura Enorme ou maior.
    if ((id === 'tripAttack' || id === 'pushingAttack') && ['enorme', 'imenso', 'colossal'].includes(String(alvo.size ?? '').toLowerCase())) {
      this.say('condicao', `${alvo.name} é grande demais para ${id === 'tripAttack' ? 'cair' : 'ser empurrado'}.`);
      return;
    }
    const cd = this.cdDeManobra(atacante);
    const hab = id === 'menacingAttack' || id === 'goadingAttack' ? 'wis' : 'str';
    const save = this.resistencia(alvo, hab, cd);
    this.explicarResistencia(alvo, hab, cd, save, {
      contra: `${nomes[id]} de ${atacante.name}`,
      seSucesso: id === 'tripAttack' ? 'não cai' : id === 'menacingAttack' ? 'não fica amedrontado' : id === 'goadingAttack' ? 'não se deixa provocar' : id === 'disarmingAttack' ? 'segura a arma' : 'não é empurrado',
    });
    if (save.success) return;
    if (id === 'tripAttack') {
      if (this.aplicarCondicao(alvo, 'caido', { source: atacante.id })) this.say('condicao', `${alvo.name} é derrubado por ${atacante.name}.`);
    } else if (id === 'goadingAttack') {
      // "até o fim do SEU próximo turno": criada no turno de quem ataca, só cai no fim do seguinte (2 contagens).
      if (this.aplicarCondicao(alvo, 'provocado', { rounds: 2, quando: 'fim', lado: atacante.side, source: atacante.id })) {
        this.say('condicao', `${alvo.name} fica furioso com ${atacante.name}: desvantagem em atacar qualquer outro até o fim do próximo turno dele.`);
      }
    } else if (id === 'disarmingAttack') {
      if (this.aplicarCondicao(alvo, 'desarmado', { rounds: 1, quando: 'fim', lado: alvo.side, source: atacante.id })) {
        this.say('condicao', `${alvo.name} deixa a arma escapar: ataca com desvantagem até o fim do próximo turno dele.`);
      }
    } else if (id === 'menacingAttack') {
      if (this.aplicarCondicao(alvo, 'amedrontado', { rounds: 2, quando: 'fim', lado: atacante.side, source: atacante.id })) {
        this.say('condicao', `${alvo.name} fica amedrontado até o fim do próximo turno de ${atacante.name}.`);
      }
    } else {
      this.empurrar(alvo, atacante.pos, 15);
      this.say('condicao', `${alvo.name} é empurrado 4,5 m por ${atacante.name}.`);
    }
  }

  /** CD de ki do monge: 8 + proficiência + Sabedoria. */
  cdDeKi(monge) {
    return 8 + proficiencyBonus(monge.level ?? 1) + abilityMod(monge.abilities?.wis ?? 10);
  }

  /** A TÉCNICA DA MÃO ABERTA depois de um golpe da Rajada que acertou. */
  tecnicaDaMaoAberta(monge, alvo, tecnica) {
    const cd = this.cdDeKi(monge);
    const hab = tecnica === 'derrubar' ? 'dex' : tecnica === 'empurrar' ? 'str' : null;
    if (tecnica === 'semReacao') {
      this.aplicarCondicao(alvo, 'semReacoesDaMao', { rounds: 1, quando: 'fim', lado: monge.side, source: monge.id });
      alvo.reactionUsed = true;
      this.say('condicao', `${alvo.name} não pode tomar reações até o fim do próximo turno de ${monge.name} (Técnica da Mão Aberta).`);
      return;
    }
    const save = this.resistencia(alvo, hab, cd);
    this.explicarResistencia(alvo, hab, cd, save, {
      contra: `Técnica da Mão Aberta de ${monge.name}`,
      seSucesso: tecnica === 'derrubar' ? 'não cai' : 'não é empurrado',
    });
    if (save.success) return;
    if (tecnica === 'derrubar') {
      if (this.aplicarCondicao(alvo, 'caido', { source: monge.id })) this.say('condicao', `${alvo.name} é derrubado por ${monge.name} (Técnica da Mão Aberta).`);
    } else {
      this.empurrar(alvo, monge.pos, 15);
      this.say('condicao', `${alvo.name} é empurrado 4,5 m por ${monge.name} (Técnica da Mão Aberta).`);
    }
  }

  /** O teste de Constituição do Ataque Atordoante, já com a conta aberta. */
  ataqueAtordoante(monge, alvo) {
    const cd = this.cdDeKi(monge);
    const save = this.resistencia(alvo, 'con', cd);
    this.explicarResistencia(alvo, 'con', cd, save, {
      contra: `Ataque Atordoante de ${monge.name}`,
      seSucesso: 'não fica atordoado',
    });
    if (save.success) return false;
    const posto = this.aplicarCondicao(alvo, 'atordoado', {
      rounds: 1, quando: 'fim', lado: monge.side, source: monge.id,
    });
    if (!posto) return false;
    this.say('condicao', `${alvo.name} fica ATORDOADO até o fim do próximo turno de ${monge.name}.`);
    return true;
  }

  aplicarCondicao(alvo, id, opcoes = {}) {
    const fonte = typeof opcoes.source === 'string' ? this.combatants.find((c) => c.id === opcoes.source) : null;
    // Fora de alcance (Plano Etéreo, dentro da pedra): nada o afeta. A exceção é
    // a própria condição que o tirou de alcance.
    if (id !== 'etereo' && id !== 'naPedra' && conditionEffects(alvo).inalcancavel) return null;
    if (this.imuneAMagiaEmCurso(alvo)) return null;
    // DEFESAS SEDUTORAS (bruxo da Arquifada, 10º): quem tenta enfeitiçá-lo testa Sabedoria ou fica enfeitiçado por ele.
    if (CONDICOES_DE_ENCANTO.includes(id) && fonte && fonte !== alvo && fonte.side !== alvo.side && alvo.features?.includes('beguilingDefenses')
      && !alvo.reactionUsed && !conditionEffects(alvo).incapacitated) {
      alvo.reactionUsed = true;
      const cdD = spellSaveDc(alvo);
      const svD = this.resistencia(fonte, 'wis', cdD, { contra: { magico: true, condicao: 'enfeiticado' } });
      this.explicarResistencia(fonte, 'wis', cdD, svD, { contra: `Defesas Sedutoras de ${alvo.name}`, seSucesso: 'não cai no próprio encanto' });
      if (!svD.success) {
        if (!this.imuneACondicao(fonte, 'enfeiticado', alvo)) addCondition(fonte, 'enfeiticado', { rounds: 10, source: alvo.id, data: { fimSeFerirFonte: true } });
        this.say('condicao', `${fonte.name} cai no próprio encanto: fica enfeitiçado por ${alvo.name}.`);
      }
    }
    if (this.imuneACondicao(alvo, id, fonte)) return null;
    const cond = addCondition(alvo, id, opcoes);
    if (CONDITIONS[id]?.incapacitated) {
      this.dropConcentration(alvo);
      // a cena sabe quem ficou incapacitado (o VÍNCULO PSÍQUICO do cérebro ancião de Illithinoch)
      this.onEvent({ type: 'incapacitado', target: alvo, condicao: id });
    }
    if (id === 'caido') Livro.caiuDeCostas(this, alvo);
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
    // Primeiro, a casa mais perto ANDANDO: do outro lado de uma parede ou do anel de fora do mapa não serve (o grupo não alcançaria a criatura,
    // e a luta emperrava). Só se não houver nenhuma assim, a mais perto em linha reta.
    try {
      const alcance = this.field.reachable({ x: pos.x, y: pos.y }, 40);
      const perto = [...alcance.entries()].map(([k, n]) => ({ k, custo: n.cost })).sort((a, b) => a.custo - b.custo);
      for (const { k } of perto) {
        const [x, y] = k.split(',').map(Number);
        if (livre(x, y)) return { ...pos, x, y };
      }
    } catch { /* sem mapa de alcance: cai no anel */ }
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
    c.sneakUsedThisTurn = false; c.golpeDivinoNoTurno = false; c.presaNoTurno = false;
    c.martialUsedThisTurn = false;
    c.atacouNoTurno = false;
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
  /**
   * VÍNCULO DO GUARDIÃO (o spectator).
   *
   * Ele foi amarrado a um objeto: não se afasta dele (a cerca mora em
   * `reachableFor`, junto com a corrente do canil) e, em troca, recupera 5 PV
   * no começo de cada turno em que estiver perto.
   *
   * A cura é o que faz o encontro ter uma PERGUNTA. Com 39 PV e 5 por turno,
   * bater nele enquanto ele está em casa é jogar contra a corrente: o grupo
   * precisa tirá-lo de lá, cercá-lo com dano suficiente para passar da cura,
   * ou descobrir as ordens dele e negociar — que é o que a ficha quer, já que
   * ele conversa antes de lutar.
   *
   * Sem `vinculo` declarado na cena não há cura nem cerca: um spectator solto
   * é só um monstro voador, e nenhuma cena existente muda de comportamento.
   */
  vinculoDoGuardiao(c) {
    const v = c.vinculo;
    if (!v || c.dead || c.hp <= 0 || c.hp >= maxHpEfetivo(c)) return;
    if (distanceFt(v, c.pos) > v.raioFt) return;
    const antes = c.hp;
    this.heal(c, v.cura ?? 5);
    if (c.hp > antes) {
      this.say('recurso', `${c.name} se refaz junto do que guarda: +${c.hp - antes} PV.`);
    }
  }

  /**
   * DIVISÃO da Gelatina Ocre (SRD).
   *
   * Atingida por dano CORTANTE ou ELÉTRICO, com 10 PV ou mais e sendo Média
   * ou maior, ela se parte em duas. Cada metade fica com METADE dos PV
   * (arredondando para baixo) e UM TAMANHO MENOR que a original: Grande vira
   * duas Médias, Média vira duas Pequenas, e uma Pequena já não se divide.
   *
   * No motor a original ENCOLHE e uma cópia nasce ao lado, o que dá o mesmo
   * resultado do livro sem tirar da mesa a criatura que já tem turno e
   * condições. O tamanho mora em dois campos e os dois mudam: `size` manda na
   * regra (quem agarra quem, o andar pesado da view) e `pos.f` na pegada, que
   * é por onde `distanceFt` e `isAdjacent` medem — uma Grande ocupa 2x2.
   *
   * Sem casa livre ao lado, não há divisão: a metade nova não tem onde caber.
   */
  dividir(alvo, tipo) {
    if (!alvo?.traits?.includes('divisao') || alvo.dead) return false;
    if (tipo !== 'cortante' && tipo !== 'elétrico') return false;
    if (alvo.hp < 10) return false;
    const menor = { enorme: 'grande', grande: 'médio', 'médio': 'pequeno' }[alvo.size];
    if (!menor) return false;

    const metade = Math.floor(alvo.hp / 2);
    const f = footprintOf(menor);
    // Encolhe ANTES de procurar casa: as casas que a pegada Grande ocupava
    // acabam de ficar livres, e a metade nova costuma nascer numa delas.
    alvo.size = menor;
    alvo.pos.f = f;
    alvo.hp = metade;
    alvo.maxHp = metade;

    const casa = this.casaLivreMaisProxima({ x: alvo.pos.x, y: alvo.pos.y, f });
    if (!casa) {
      this.say('aviso', `${alvo.name} se parte, mas não há espaço: a metade volta a juntar-se.`);
      return false;
    }
    const nova = makeMonster(alvo.defId, { x: casa.x, y: casa.y }, { rng: this.rng });
    nova.size = menor;
    nova.pos.f = f;
    nova.hp = metade;
    nova.maxHp = metade;
    nova.side = alvo.side;
    nova.name = `${alvo.name.replace(/ \d+$/, '')} ${this.combatants.filter((c) => c.defId === alvo.defId).length + 1}`;
    // A metade nova não ganha turno de graça: age no próximo turno do lado dela.
    this.addCombatant(nova);
    this.say('recurso', `${alvo.name} se parte em duas: cada metade fica ${menor} e com ${metade} PV.`);
    this.onEvent({ type: 'dividiu', original: alvo, nova });
    return true;
  }

  invocar(dono, defId, pos, { spellId, sufixo = '' } = {}) {
    const m = makeMonster(defId, pos, { rng: this.rng, nameSuffix: sufixo });
    const casa = this.casaLivreMaisProxima({ x: pos.x, y: pos.y, f: m.pos.f });
    if (!casa) return null;
    m.pos = { x: casa.x, y: casa.y, f: m.pos.f };
    m.side = dono.side;
    // CONVOCAÇÃO DURADOURA (mago de Conjuração, 14º): as criaturas que ele convoca nascem com 30 PV temporários.
    if (dono.features?.includes('durableSummons') && SPELLS[spellId]?.school === 'conjuração') m.tempHp = Math.max(m.tempHp ?? 0, 30);
    // No livro 2014, as feras do Conjurar Animais são feéricas (o Círculo Mágico as barra).
    if (spellId === 'conjurarAnimais') m.tipo = 'feérico';
    // INVOCADOR PODEROSO (Pastor, 6º): a fera ou fada da magia ganha 2 PV por dado de vida e golpes mágicos.
    if (SPELLS[spellId]) Sub.invocadorPoderoso(dono, m, MONSTERS[defId]?.hpDice);
    m.invocado = { donoId: dono.id, spellId, auto: spellId === 'companheiroAnimal' ? false : Boolean(dono.invocadosAuto) };
    // Não vale XP, e o painel do grupo lê estes dois campos do herói.
    m.xp = 0;
    m.className = 'Invocado';
    m.ancestry = m.tipo ?? 'criatura';
    this.addCombatant(m);
    this.onEvent({ type: 'invocado', criatura: m, dono });
    return m;
  }

  /**
   * O COMPANHEIRO do Senhor das Feras: nasce no começo de cada luta ao lado do patrulheiro, com PV mínimos de 4 × o nível dele, e soma a
   * proficiência dele a CA, ataque e dano. É uma criatura invocada (o grupo a comanda), mas só age com a ordem (`rangersCompanion`).
   */
  criarCompanheiro(dono) {
    const feras = { companionLobo: 'lobo', companionJavali: 'javali', companionAranhaLobo: 'aranhaLoboGigante', companionRato: 'ratoGigante' };
    const escolha = dono.features.find((f) => feras[f]);
    const m = this.invocar(dono, feras[escolha] ?? 'lobo', dono.pos, { spellId: 'companheiroAnimal' });
    if (!m) return null;
    const pb = proficiencyBonus(dono.level ?? 1);
    m.ac += pb;
    m.maxHp = Math.max(m.maxHp, 4 * (dono.level ?? 1));
    m.hp = m.maxHp;
    const soma = (d) => String(d).replace(/^(\d+d\d+)([+-]\d+)?$/, (_, dados, mod) => `${dados}${(Number(mod ?? 0) + pb) >= 0 ? '+' : ''}${Number(mod ?? 0) + pb}`);
    m.attacks = m.attacks.map((a) => ({ ...a, bonus: a.bonus + pb, damage: soma(a.damage) }));
    if (dono.features.includes('bestialFury')) m.multiattack = { count: 2 };
    // TREINAMENTO EXCEPCIONAL (7º): os ataques da fera contam como mágicos.
    if (dono.features.includes('exceptionalTraining')) m.golpesMagicos = true;
    // TREINAMENTO EXCEPCIONAL (7º): os ataques da fera contam como mágicos.
    if (dono.features.includes('exceptionalTraining')) m.golpesMagicos = true;
    m.companheiro = true;
    this.say('recurso', `${m.name} se junta a ${dono.name} (Companheiro do Patrulheiro, ${m.maxHp} PV).`);
    return m;
  }

  /** Os invocados de um dono (vivos, em jogo). */
  invocadosDe(dono) {
    return this.combatants.filter((c) => c.invocado?.donoId === dono.id && !c.dead);
  }

  /** "Agir sozinho" de UM invocado: a IA aliada joga o turno dele. */
  definirAutoDoInvocado(c, auto) {
    // O companheiro do Senhor das Feras só age com a ordem do patrulheiro: não há "agir sozinho".
    if (c.invocado && c.invocado.spellId !== 'companheiroAnimal') c.invocado.auto = Boolean(auto);
  }

  /** "Agir sozinhos" para TODOS os invocados do dono (e para os que ele invocar depois). */
  definirAutoDosInvocados(dono, auto) {
    dono.invocadosAuto = Boolean(auto);
    for (const c of this.invocadosDe(dono)) if (c.invocado.spellId !== 'companheiroAnimal') c.invocado.auto = Boolean(auto);
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
    if (eter?.data?.salto) c.voltouDoSalto = true;
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

  /** A condição que fere no começo do turno de quem a tem (`danoNoInicio` na tabela, os dados em `data.dano`): a Infusão Cáustica. */
  danoDaCondicaoNoInicio(c) {
    for (const cond of [...(c.conditions ?? [])]) {
      const def = CONDITIONS[cond.id];
      if (!def?.danoNoInicio || !cond.data?.dano || c.dead) continue;
      const r = damageRoll(this.rng, cond.data.dano);
      const dono = this.combatants.find((x) => x.id === cond.source) ?? null;
      this.say('condicao', `${def.name}: ${c.name} sofre ${r.total} de ${def.danoNoInicio}.`, `${cond.data.dano}[${r.rolls.join('+')}]`);
      this.applyDamage(c, r.total, def.danoNoInicio, dono, { magico: true });
    }
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
    if (actor.cabecas != null && !actor.dead) this.cabecasCrescem(actor);
    // REFLEXOS DE LADRÃO (ladino Ladrão, 17º): na PRIMEIRA rodada, dois turnos — no livro, o segundo cai na iniciativa −10. Como a
    // iniciativa aqui é por lado, o segundo turno vem logo em seguida ao primeiro, uma vez por luta.
    if (this.round === 1 && actor.features?.includes('thiefsReflexes') && !this.reflexosUsados?.has(actor.id) && !actor.dead) {
      (this.reflexosUsados ??= new Set()).add(actor.id);
      actor.movementLeftFt = this.speedOf(actor);
      Object.assign(actor, { actionUsed: false, bonusUsed: false, ataquesRestantes: 0, extraActions: 0, disengaging: false, golpeCedido: false, magiasNoTurno: [], surgeUsedThisTurn: false, atacouDeMonge: false, atacouNoTurno: false, martialUsedThisTurn: false, sneakUsedThisTurn: false, interacaoUsada: false, corridaFt: 0 });
      this.say('recurso', `${actor.name} age de novo: Reflexos de Ladrão dão um segundo turno na primeira rodada.`);
      this.onEvent({ type: 'turnEnd', actor });
      return;
    }
    // PARAR O TEMPO: 1d4 + 1 turnos seguidos (o primeiro é este); acaba quando ele fere outra criatura (`applyDamage`)
    const parado = getCondition(actor, 'tempoParado');
    if (parado && !actor.dead) {
      parado.data ??= { extras: this.rng.die(4) };
      if (parado.data.extras > 0) {
        parado.data.extras -= 1;
        actor.movementLeftFt = this.speedOf(actor);
        Object.assign(actor, { actionUsed: false, bonusUsed: false, ataquesRestantes: 0, extraActions: 0, disengaging: false, magiasNoTurno: [], atacouNoTurno: false, interacaoUsada: false, corridaFt: 0 });
        this.say('magia', `O tempo continua parado: ${actor.name} age de novo (${parado.data.extras} turno${parado.data.extras === 1 ? '' : 's'} a mais).`);
        this.onEvent({ type: 'turnEnd', actor });
        return;
      }
      removeCondition(actor, 'tempoParado');
      this.say('magia', 'O tempo volta a correr.');
    }
    // FURTIVIDADE NAS SOMBRAS (o demônio das sombras): no fim do turno, na penumbra ou no escuro, se esconde de bônus
    if (actor.kind === 'npc' && actor.traits?.includes('furtividadeNasSombras') && !actor.bonusUsed && !actor.dead
      && !hasCondition(actor, 'invisivel') && this.field.luz && this.field.luz[actor.pos.y * this.field.w + actor.pos.x] < 2) {
      actor.bonusUsed = true;
      this.esconder(actor);
    }
    // CONSUMIR VIDA (o fogo-fátuo) e SALTO ETÉREO (a aranha de fase): a ação bônus que sobra no fim do turno
    if (actor.kind === 'npc' && !actor.dead && !conditionEffects(actor).incapacitated) {
      if (!Livro.consumirVida(this, actor)) Livro.saltoEtereo(this, actor);
    }
    Livro.conferirVomito(this);
    if (actor.concentrating?.tempestade && !actor.dead) Livro.estagioDaTempestade(this, actor);
    // REATIVO (a marilith): uma reação em CADA turno da luta, não uma por rodada
    for (const c of this.combatants) if (c.traits?.includes('reativo') && !c.dead) c.reactionUsed = false;
    actor.acted = true;
    actor.movementLeftFt = 0;
    actor.deslocamentoFalhou = false;
    // O ki do Ataque Atordoante paga ESTE turno: armar e não acertar perde o
    // ponto. Aqui, e não só no começo do lado, para que um ataque de
    // oportunidade entre turnos não gaste um golpe armado na rodada passada.
    actor.atordoantePronto = false;
    actor.manobraPronta = null;
    actor.ataqueAposMagia = false;
    actor.palmaPronta = false;
    actor.hurlPronto = false;
    this.onEvent({ type: 'turnEnd', actor });
    this.lendariasDepoisDe(actor);
    this.maybeEndSide();
  }

  /**
   * AÇÕES LENDÁRIAS (o SRD): no fim do turno de OUTRA criatura, quem as tem gasta uma — um golpe do próprio bloco, ou a
   * área em volta dele (o golpe de asa do dragão: teste, dano e derruba). Voltam todas no começo do lado dele. Escolha:
   * o golpe em quem está ao alcance; a área quando ela pega dois ou mais, ou quando não há a quem golpear.
   */
  lendariasDepoisDe(actor) {
    for (const m of this.combatants) {
      if (m === actor || m.dead || m.hp <= 0 || !m.lendarias || !(m.lendariasRestantes > 0)) continue;
      if (conditionEffects(m).incapacitated || this.over) continue;
      const opcoes = m.lendarias.opcoes.filter((o) => o.custo <= m.lendariasRestantes);
      const feita = Livro.escolherLendaria(this, m, opcoes, {
        casaLonge: (q, inimigos, pes) => casaLongeDe(this, q, inimigos, pes),
        magia: (q, soTruque, maxCirculo, magias) => magiaLendaria(this, q, soTruque, maxCirculo, magias),
        tinta: (q, o) => this.tintaLendaria(q, o),
      });
      if (feita) {
        m.lendariasRestantes -= feita.custo;
        if (!['golpe'].includes(feita.tipo)) this.say('recurso', `${m.name} usa uma ação lendária: ${feita.nome}.`);
      }
    }
  }

  /** A NUVEM DE TINTA do kraken (ação lendária, só debaixo d'água): 18 m, escuridão pesada e veneno no fim do turno. */
  tintaLendaria(m, o) {
    const aguas = this.field.aguas;
    if (!aguas?.has(key(m.pos.x, m.pos.y))) return false;
    if (!this.enemiesOf(m).some((e) => !e.dead && distanceFt(e.pos, m.pos) <= o.raioFt)) return false;
    const spec = { ...NUVEM_DE_TINTA, id: 'tintaDoKraken', name: o.nome, areaFt: o.raioFt, zona: { ...NUVEM_DE_TINTA.zona, quando: 'fim', dano: { dados: o.damage, tipo: 'veneno', save: 'con', metade: true } } };
    const casas = (this.areaDaMagia(m, spec, m.pos) ?? []).filter((c) => aguas.has(key(c.x, c.y)));
    if (!casas.length) return false;
    this.criarZona(m, spec, casas, o.dc, { centro: m.pos });
    this.say('recurso', `${m.name} solta tinta venenosa na água em volta.`);
    return true;
  }

  /**
   * AS AURAS QUE PEGAM QUEM COMEÇA O TURNO PERTO (`aura.quando === 'inicioDoAlvo'`: a Aura de Medo do diabo das
   * profundezas, o Fedor do troglodita): teste ou a condição até o começo do próximo turno; quem passa fica imune àquela
   * criatura.
   */
  aurasNoComecoDe(side) {
    const donos = this.combatants.filter((m) => m.aura?.quando === 'inicioDoAlvo' && !m.dead && m.hp > 0 && m.side !== side
      && !conditionEffects(m).incapacitated);
    if (!donos.length) return;
    for (const t of this.allOf(side)) {
      if (t.dead || t.hp <= 0) continue;
      for (const m of donos) {
        const a = m.aura;
        if (distanceFt(m.pos, t.pos) > a.raioFt || t.imuneAAura?.includes(m.id) || (a.condition && this.imuneACondicao(t, a.condition))) continue;
        if (a.poupaTipo && String(t.tipo ?? '').startsWith(a.poupaTipo)) continue;
        // O OLHAR (o Olhar Confuso do brutamonte umbral): só pega quem vê os olhos do dono, e quem não foi surpreendido
        // pode desviá-los (o mesmo interruptor da medusa, `desviarOlhar`): não testa, mas não o vê até o próximo turno.
        if (a.olhar) {
          if (hasCondition(t, 'cego') || !this.field.hasLineOfSight(m.pos, t.pos) || !podeVer(this, t, m)) continue;
          if (t.desviaOlhar && !this.surpresos?.has?.(t.id)) {
            removeCondition(t, 'olhosDesviados');
            addCondition(t, 'olhosDesviados', { source: m.id, data: { nasceuEm: `${this.round}:${side}` } });
            this.say('condicao', `${t.name} desvia os olhos de ${m.name}.`);
            continue;
          }
        }
        const sv = this.resistencia(t, a.save, a.dc, { contra: { condicao: a.condition ?? null, tipoDano: a.damageType ?? null, magico: !!a.damage } });
        const r = this.explicarResistencia(t, a.save, a.dc, sv, { contra: `a aura de ${m.name}`, seSucesso: a.imunizaAoPassar ? 'nada, e não sente mais' : 'nada' });
        if (sv.success) { if (a.imunizaAoPassar) (t.imuneAAura ??= []).push(m.id); this.say('condicao', `${t.name} aguenta a aura de ${m.name}.`, r.conta, { rolagem: r }); continue; }
        // A AURA QUE FERE (a Forma Aberrante do zelote: Sabedoria, ou 2d6 psíquicos)
        if (a.damage) {
          const d = damageRoll(this.rng, a.damage);
          this.say('dano', `A aura de ${m.name} pega ${t.name}: ${d.total} de ${a.damageType}.`, `${r.conta} · ${a.damage}[${d.rolls.join('+')}]`, { rolagem: r });
          this.applyDamage(t, d.total, a.damageType, m, { magico: true });
        }
        if (!a.condition || t.dead || t.hp <= 0) continue;
        // a de um turno vale até o começo do próximo; a de um minuto (a Aparência Horrenda da bruxa do mar) repete o teste
        const longa = (a.rounds ?? 1) > 1;
        this.aplicarCondicao(t, a.condition, longa ? { rounds: a.rounds, source: m.id, data: { save: a.save, dc: a.dc, repete: !!a.repete } }
          : { rounds: 1, quando: 'inicio', lado: side, source: m.id });
        this.say('condicao', `A aura de ${m.name} pega ${t.name}: ${CONDITIONS[a.condition]?.name.toLowerCase() ?? a.condition}${longa ? '' : ' até o próximo turno'}.`, r.conta, { rolagem: r });
      }
    }
  }

  lendariaDeArea(m, o, alvos) {
    for (const t of alvos) {
      if (t.imuneAEspecial?.includes(`${m.id}:${o.nome}`)) continue;
      const sv = this.resistencia(t, o.save, o.dc, { contra: { tipoDano: o.damageType ?? null, condicao: o.condition ?? null, magico: true } });
      const r = this.explicarResistencia(t, o.save, o.dc, sv, { contra: o.nome, seSucesso: o.halfOnSave ? 'metade' : 'nada' });
      if (sv.success && !o.halfOnSave) {
        if (o.imunizaAoPassar) (t.imuneAEspecial ??= []).push(`${m.id}:${o.nome}`);
        this.say('condicao', `${t.name} escapa de ${o.nome}.`, r.conta, { rolagem: r });
        continue;
      }
      for (const [dd, tp] of [[o.damage, o.damageType], [o.damage2, o.damageType2]]) {
        if (!dd) continue;
        const d = damageRoll(this.rng, dd);
        const v = sv.success ? Math.floor(d.total / 2) : d.total;
        this.applyDamage(t, v, tp, m, { magico: true });
        this.say('dano', `${t.name} leva ${v} de ${tp} (${o.nome}).`, `${dd}[${d.rolls.join('+')}]`, { rolagem: r });
      }
      if (sv.success || t.dead) continue;
      if (o.reduzMaximoDados) {
        const d = damageRoll(this.rng, o.reduzMaximoDados);
        const tira = Math.min(d.total, t.maxHp);
        t.maxHp -= tira;
        t.maxHpPerdido = (t.maxHpPerdido ?? 0) + tira;
        if (t.hp > t.maxHp) t.hp = t.maxHp;
        this.say('condicao', `${t.name} perde ${tira} de PV máximo (${o.nome}).`, `${o.reduzMaximoDados}[${d.rolls.join('+')}]`);
        if (t.maxHp <= 0) { this.morrer(t, o.nome); continue; }
      }
      if (o.condition && !this.imuneACondicao(t, o.condition)) {
        this.aplicarCondicao(t, o.condition, o.ateFimDoTurnoDoAlvo
          ? { rounds: this.side === t.side ? 2 : 1, quando: 'fim', lado: t.side, source: m.id }
          : o.condition === 'caido' ? { source: m.id } : { rounds: o.rounds ?? 10, source: m.id, data: { save: o.save, dc: o.dc, repete: !!o.repete } });
        this.say('condicao', `${t.name} fica ${CONDITIONS[o.condition]?.name.toLowerCase() ?? o.condition} (${o.nome}).`, r.conta, { rolagem: r });
      }
    }
    return o;
  }

  /**
   * A PRESENÇA ATERRADORA (os dragões, o SRD): cada inimigo a até `alcanceFt` que ainda não resistiu a ela faz Sabedoria;
   * quem falha fica amedrontado por 1 minuto, repetindo o teste no fim de cada turno. Quem passa, ou se livra, fica imune
   * a ESTA criatura pelo resto do dia. Sai junto com o multiataque: não gasta ação.
   */
  presencaAterradoraDe(m) {
    const pa = m.presencaAterradora;
    if (!pa || m.dead || conditionEffects(m).incapacitated) return 0;
    let medo = 0;
    for (const t of this.enemiesOf(m)) {
      if (t.dead || t.hp <= 0 || distanceFt(m.pos, t.pos) > pa.alcanceFt || t.imuneAPresenca?.includes(m.id)) continue;
      if (hasCondition(t, 'amedrontado') || this.imuneACondicao(t, 'amedrontado')) continue;
      const sv = this.resistencia(t, 'wis', pa.dc, { contra: { condicao: 'amedrontado' } });
      const r = this.explicarResistencia(t, 'wis', pa.dc, sv, { contra: `a presença de ${m.name}`, seSucesso: 'não se abala, e não se abala mais' });
      if (sv.success) { (t.imuneAPresenca ??= []).push(m.id); this.say('condicao', `${t.name} encara ${m.name} sem tremer.`, r.conta, { rolagem: r }); continue; }
      this.aplicarCondicao(t, 'amedrontado', { rounds: 10, source: m.id, data: { save: 'wis', dc: pa.dc, repete: 'sempre', presencaDe: m.id } });
      this.say('condicao', `${t.name} sente o peso de ${m.name} e fica amedrontado.`, r.conta, { rolagem: r });
      medo += 1;
    }
    return medo;
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
    // Quem virou PEDRA está fora da luta, como quem caiu: o grupo todo petrificado (a medusa, o raio do observador) perdeu.
    // ... e quem está na MASMORRA SEMIPLANAR do couraçado astral, de onde só se sai com magia de viagem entre planos
    const partyUp = this.living('party').filter((c) => !c.invocado && !hasCondition(c, 'petrificado') && !hasCondition(c, 'banidoDeVez') && !Livro.naMasmorra(c)).length;
    // `naoSeguraALuta`: quem luta do lado dos inimigos mas não é a luta — o familiar invisível do mago (o Zeond da
    // Mansão), que sem o mestre some. Sem isto um bicho invisível que ninguém consegue mirar seguraria a luta para
    // sempre. A cena decide o que acontece com ele depois.
    const foesUp = this.living('foes').filter((c) => !c.invocado && !c.naoSeguraALuta && !hasCondition(c, 'petrificado') && !hasCondition(c, 'banidoDeVez')).length
      + this.allOf('foes').filter((c) => c.caidoRegenerando && !c.dead).length;
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
      for (const c of this.combatants) if (c.formaSelvagem) despirFera(c);
      this.outcome = 'vitoria';
      this.say('fim', 'Inimigos derrotados.');
      // Fora do combate ninguém conta deslocamento: quem está acordado e no
      // chão se levanta. Sem isto a figura ficava deitada até o descanso.
      for (const c of this.allOf('party')) this.levantarForaDoCombate(c);
    } else if (partyUp === 0) {
      this.over = true;
      for (const c of this.combatants) if (c.formaSelvagem) despirFera(c);
      this.outcome = 'derrota';
      this.say('fim', 'O grupo caiu.');
    }
    if (this.over) {
      // Quem piscou para o Plano Etéreo volta antes de tudo, senão fica lá para sempre.
      for (const c of this.combatants) if (hasCondition(c, 'etereo')) this.voltarDoEtereo(c);
      // As magias de combate acabam com o encontro: Levitação (e a concentração que a segura),
      // Piscar e Conjurar Animais. Sem isto o herói ficava com deslocamento 0 até o descanso.
      for (const c of this.combatants) {
        // A FÚRIA ACABA COM O COMBATE, que é o que o livro diz. Ela ficava, e
        // isso era inofensivo enquanto a resistência dela não funcionava:
        // medido, o bárbaro saía vitorioso ainda em Fúria e caía no fosso da
        // trilha levando 3 de 6. Resistência de graça, de uma luta anterior.
        if (hasCondition(c, 'furia')) { removeCondition(c, 'furia'); c.furiaAgiu = false; Sub.conferirFuriaAlemDaMorte(this); }
        Sub.largarFormaDaFera(c);
        Sub.largarCutelo(c);
        // o draco guarda os PV para a próxima luta
        if (c.invocado?.spellId === 'dracoCompanheiro') { const donoD = this.combatants.find((x) => x.id === c.invocado.donoId); if (donoD && !c.dead) donoD.pvDoDraco = c.hp; }
        for (const id of ['levitando', 'piscando', 'etereo', 'descuidado', 'duplicidade', 'coroaDeLuz', 'passoDoCaos', 'reencarnar', 'brilhoCaos', 'veInvisiveis', 'olhoDoCaos', 'regenCaos', 'surtoRepetido', 'tamanhoCaos']) if (hasCondition(c, id)) removeCondition(c, id);
        // O Manto de Sombras do clérigo (invisível por 1 rodada) e a Ira Destrutiva armada não passam para a luta seguinte.
        if (c.features?.includes('trickeryCloak') && hasCondition(c, 'invisivel')) removeCondition(c, 'invisivel');
        c.furiaDestrutivaPronta = false;
        this.restaurarTamanho(c, true);
        delete c.surtoMaximoAte;
        delete c.surtoRapidoAte;
        delete c.surtoDesvSaveAte;
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
  // `orcamentoFt` troca o teto (o movimento que sobra) por outro: o cartão do tabuleiro quer saber quanto custaria
  // chegar a uma casa fora do alcance, para dizer "o caminho custa 45 pés" em vez de só "longe demais".
  reachableFor(actor, { evitarZonas = false, orcamentoFt = null } = {}) {
    if (hasCondition(actor, 'inconsciente') || conditionEffects(actor).incapacitated) return new Map();
    const f = actor.pos.f ?? 1;
    // Só as zonas que ferem ou prendem: ninguém desvia de uma névoa.
    const hostil = (pos) => this.zonasEm(pos).some((z) => !z.inofensiva);
    const evita = evitarZonas && this.zonas.length && !hostil(actor.pos);
    const tomadas = this.casasTomadas(actor);
    const cabeNaPegada = this.cabeNaCasa(actor, f, tomadas);
    // Acorrentado (os lobos do canil): só anda até onde a corrente alcança.
    // O VÍNCULO DO GUARDIÃO (o spectator) é a mesma cerca com outro nome: ele
    // foi amarrado a um objeto e não se afasta dele. Uma corrente que ninguém
    // vê, e por isso os dois campos têm a mesma forma — `{x, y, raioFt}`.
    const corrente = actor.corrente ?? actor.vinculo;
    const cabeCorrente = corrente
      ? (x, y) => distanceFt(corrente, { x, y }) <= corrente.raioFt && (!cabeNaPegada || cabeNaPegada(x, y))
      : cabeNaPegada;
    // PRESO À SALA (o horror de elmo e as armaduras de Talhundereth não saem da câmara de treino): `casasPermitidas`,
    // um Set de 'x,y', é a cerca. A corrente acima é a mesma ideia num raio; esta é a forma de uma sala.
    // PRESA À ÁGUA (a água viva): não sai da água a que está presa, se a cena não deu outra cerca
    const sala = this.cercaDe(actor);
    // a pegada INTEIRA dentro da cerca (a água viva, Grande, não fica com metade do corpo fora d'água)
    const naCerca = (x, y) => { for (let dy = 0; dy < f; dy++) for (let dx = 0; dx < f; dx++) if (!sala.has(`${x + dx},${y + dy}`)) return false; return true; };
    const cabeBase = sala ? (x, y) => naCerca(x, y) && (!cabeCorrente || cabeCorrente(x, y)) : cabeCorrente;
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
    // Planeja com o que ele PODE: o dragao no chao ainda pode decolar (`moveAlong`
    // decide, trecho a trecho, se andou ou voou).
    this.field.voando = this.voaAgora(actor) || this.voaPelaFicha(actor);
    this.field.escalando = this.escalaAgora(actor);
    // Andar na Água e Forma Gasosa: as duas mexem em POR ONDE se passa, então
    // viajam no campo como o voo e a escalada.
    this.field.sobreAgua = conditionEffects(actor).sobreAgua || nadador(actor);
    this.field.atravessaVao = conditionEffects(actor).atravessaVao || Boolean(actor.traits?.includes('amorfo'));
    this.field.semTerrenoDificil = conditionEffects(actor).semTerrenoDificil || (temTalento(actor, 'movel') && actor.disparouEm === this.turnoKey());
    this.field.passoDaTerra = Boolean(actor.features?.includes('landsStride'));
    this.field.andaNaTeia = Boolean(actor.traits?.includes('webWalker'));
    this.field.incorporeo = this.incorporeoAgora(actor);
    this.field.escavaRocha = actor.traits?.includes('escavador') ? 'tunel' : actor.traits?.includes('deslizarNaTerra') ? 'desliza' : null;
    this.field.escalaSemCusto = Boolean(actor.features?.includes('secondStoryWork') || temTalento(actor, 'atleta'));
    this.field.rastejando = this.rastejando(actor);
    // Círculo Mágico: o tipo barrado não entra (quem já está dentro anda livre).
    const barras = this.circulosQueBarram(actor);
    const cabeFinal = barras.length
      ? (x, y) => !barras.some((z) => this.pegadaEmZona(z, x, y, f)) && (!cabe || cabe(x, y))
      : cabe;
    try {
      return this.field.reachable(
      actor.pos,
      // Caído rasteja: +1 pé por pé, SOMADO ao terreno difícil (`costOf`), então o orçamento é o que sobra, sem dividir.
      orcamentoFt ?? actor.movementLeftFt,
      // Tomada = alguma criatura (fora ele) cobre a PEGADA inteira dele naquela âncora (Grande ocupa 2x2).
      (x, y) => tomadas.tomada(x, y, f),
      // Quem ocupa 2x2 só pisa onde os quatro quadrados existem e estão livres
      // de parede. Sem isto o ogro para com metade do corpo dentro da pedra.
      evita ? (x, y) => !hostil({ x, y, f }) && (!cabeFinal || cabeFinal(x, y)) : cabeFinal,
      f,
      // POR QUEM SE PASSA (SRD): o não hostil (aliado e neutro), sim; o hostil só com duas categorias de tamanho de diferença.
      // Passar custa o dobro (o espaço dele é terreno difícil, `costOf`) e parar em cima dele nunca vale.
      // o INCORPÓREO passa por qualquer um (`incorporeoAgora`), como por terreno difícil
      (x, y) => this.field.incorporeo || tomadas.atravessa(x, y, f),
      // ... e, se não couber inteiro, pode ESPREMER (paga o dobro e fica com desvantagem)
      this.cabeApertado(actor, f, tomadas),
      );
    } finally {
      this.field.dificeisExtra = null;
      this.field.voando = false;
      this.field.escalando = false;
      this.field.sobreAgua = false;
      this.field.atravessaVao = false;
      this.field.semTerrenoDificil = false;
      this.field.passoDaTerra = false;
      this.field.incorporeo = false;
      this.field.escavaRocha = null;
      this.field.escalaSemCusto = false;
      this.field.rastejando = false;
    }
  }

  /** Quem voa não pisa no chão: terreno difícil, degraus e zonas do chão não o pegam. */
  voaAgora(actor) {
    // A Forma Gasosa também flutua: o livro diz que a névoa paira, e quem paira
    // não pisa em terreno difícil nem escala degrau.
    // Voo de ficha so conta como "no ar" para quem PAIRA (`hover`) ou durante
    // um trecho voado (`emVoo`, que `moveAlong` liga). O dragao parado esta no
    // CHAO: a Graxa e os Espinhos o pegam. Para PLANEJAR o caminho, quem chama
    // pergunta `voaPelaFicha` a parte.
    const fichaNoAr = this.voaPelaFicha(actor) && (actor.hover || actor.emVoo);
    // PRESO À TERRA: o voo de magia e o de ficha caem; quem estava no ar desce.
    if (hasCondition(actor, 'presoATerra')) return false;
    // ASAS DE OUTRO MUNDO (Alma Divina) e ALMA DO VENTO (Tempestade): o voo do feiticeiro
    return (hasCondition(actor, 'voando') || hasCondition(actor, 'asasDeOutroMundo') || hasCondition(actor, 'passosDaNoite') || hasCondition(actor, 'saltoPsionico') || hasCondition(actor, 'almaRadiante') || hasCondition(actor, 'vooDeGema') || Sub.vooDoDragao(actor) || actor.features?.includes('windSoul') || conditionEffects(actor).soVoa || fichaNoAr)
      && !hasCondition(actor, 'caido') && !conditionEffects(actor).incapacitated;
  }

  /**
   * Voo que vem do BLOCO da criatura (`flyFt`), e não de magia.
   *
   * Até aqui `flyFt` era enfeite: o comentário em `monsters/aberracoes.js` diz
   * na letra que "a grade só conhece `speedFt`", e o dragão verde, o spectator
   * e o stirge carregavam deslocamento de voo que nunca saía do papel.
   *
   * TETO BAIXO. O traço Voo do dragão promete que em teto baixo ele perde o ar
   * -- é o que faz da caverna o lugar de enfrentá-lo. `enc.tetoBaixo` é essa
   * chave, e quem monta o encontro a liga. Nenhum mapa a liga ainda: por fora
   * está céu aberto, e isso está dito na descrição do traço.
   *
   * O QUE ISTO NÃO FAZ: a grade é plana. Voar não tira a criatura do alcance de
   * quem bate no chão, nem a põe numa altura que exija alcance para acertar --
   * ela continua num quadrado, e quem está colado a acerta. O que o voo muda é
   * por ONDE ela passa (sem terreno difícil, sem degrau, sem zona do chão), a
   * QUANTO ela anda (`flyFt`) e como ela é desenhada (no ar, com a sombra
   * menor). Dizer mais que isso seria mentira.
   */
  voaPelaFicha(actor) {
    if (!actor.flyFt || this.tetoBaixo || hasCondition(actor, 'presoATerra')) return false;
    return !hasCondition(actor, 'caido') && !conditionEffects(actor).incapacitated;
  }

  /** MOVIMENTO INCORPÓREO (o traço `incorporealMovement`): de pé e livre, atravessa parede e criatura. */
  incorporeoAgora(actor) {
    return Boolean(actor?.traits?.includes('incorporealMovement')) && !conditionEffects(actor).incapacitated
      && !hasCondition(actor, 'contido') && !hasCondition(actor, 'agarrado');
  }

  /** Patas de Aranha: sobe degraus sem custo de escalada, mas pisa no terreno difícil e nas zonas do chão. */
  escalaAgora(actor) {
    // Patas de Aranha (a magia), ou o deslocamento de escalada do BLOCO (a aranha gigante, a gelatina ocre)
    return (hasCondition(actor, 'escalando') || (actor.kind === 'npc' && (actor.speeds?.climbFt ?? 0) > 0))
      && !hasCondition(actor, 'caido') && !conditionEffects(actor).incapacitated;
  }

  /** Quem desafiou `actor` para o Duelo Compelido (vivo), ou null. */
  duelistaDe(actor) {
    const d = getCondition(actor, 'duelo');
    // e o DESAFIO DO CAMPEÃO (Coroa): a mesma cerca de 9 m
    return (d ? this.combatants.find((c) => c.id === d.source && !c.dead) ?? null : null) ?? Sub.campeaoDe(this, actor);
  }

  /** Quem ocupa 2x2 só pisa onde as quatro casas existem e estão livres. */
  /**
   * ESPREMER (SRD 5.1): cabe num espaço do tamanho de uma criatura UMA CATEGORIA menor. Para o Grande (2x2),
   * isso é um quadrado só. Devolve o teste da pegada menor — o `reachable` usa quando a pegada cheia não cabe,
   * cobra 1,5 m a mais no passo e marca a casa, e `moveAlong` põe a condição em quem para ali.
   */
  /** Põe ou tira `espremido` conforme a criatura caiba inteira na casa em que está. */
  conferirEspremido(actor) {
    const f = actor.pos?.f ?? 1;
    const apertado = f > 1 && !this.cabeNaCasa(actor, f)?.(actor.pos.x, actor.pos.y)
      && this.cabeApertado(actor, f)(actor.pos.x, actor.pos.y);
    if (apertado && !hasCondition(actor, 'espremido')) addCondition(actor, 'espremido');
    else if (!apertado && hasCondition(actor, 'espremido')) removeCondition(actor, 'espremido');
    return apertado;
  }

  /** A CERCA de quem não sai de um lugar: a sala (`casasPermitidas`) ou a água a que a água viva está presa. */
  cercaDe(actor) {
    return actor.casasPermitidas ?? (actor.traits?.includes('presaAAgua') && this.field.aguas?.size ? this.field.aguas : null);
  }

  cabeApertado(actor, f, tomadas = this.casasTomadas(actor)) {
    if (f <= 1) return () => false;
    // `naoEspreme`: a cena diz que o vão é estreito demais para ESTA criatura, mesmo apertada (o monte da Mina
    // Hardyhammer, que o livro deixa do lado de fora da câmara dos mineiros).
    if (actor.naoEspreme) return () => false;
    // FORMA FLUIDA: passa por um vão de uma polegada SEM se espremer — cabe onde cabe uma casa
    const menor = actor.traits?.includes('formaFluida') ? 1 : f - 1;
    // A CERCA vale apertado também (a sala de `casasPermitidas`, a água da água viva): sem isto, quem não cabia inteiro
    // fora da cerca se espremia para fora dela
    const cerca = this.cercaDe(actor);
    return (x, y) => {
      if (cerca && !cerca.has(`${x},${y}`)) return false;
      for (let dy = 0; dy < menor; dy++) {
        for (let dx = 0; dx < menor; dx++) {
          if (!this.field.inside(x + dx, y + dy)) return false;
          if (this.field.blocksMove(x + dx, y + dy)) return false;
        }
      }
      if (menor > 1 && this.field.paredeNaPegada(x, y, menor)) return false;
      return tomadas.atravessa(x, y, menor);
    };
  }

  cabeNaCasa(actor, f, tomadas = this.casasTomadas(actor)) {
    if (f === 1) return undefined;
    return (x, y) => {
      for (let dy = 0; dy < f; dy++) {
        for (let dx = 0; dx < f; dx++) {
          if (!this.field.inside(x + dx, y + dy)) return false;
          if (this.field.blocksMove(x + dx, y + dy) && !this.field.escavavel(x + dx, y + dy)) return false;
          if (this.field.paredeNaPegada(x, y, f)) return false;
        }
      }
      // Quem ocupa a pegada só barra se NÃO se atravessa (hostil sem 2 tamanhos de diferença): o aliado deixa passar, e a busca
      // (`reachable`) é quem proíbe PARAR em cima dele.
      return tomadas.atravessa(x, y, f);
    };
  }

  /**
   * Quem leva a reação se `actor` der o passo de `from` a `to`: quem o tinha no alcance e deixa de ter. Quem está
   * incapacitado não reage, e quem não tem arma de perto não tem com que aproveitar a brecha. `actor.pos` tem de
   * estar em `from` (a altura de quem se compara é a da casa de onde ele sai). A régua (`rules/rota.js`) pergunta o
   * mesmo antes de andar, para avisar.
   */
  ameacasNoPasso(actor, from, to) {
    // VOO RASANTE (o morcego, o peryton): quem voa para fora do alcance não provoca ataque de oportunidade
    if (actor.traits?.includes('voaSemProvocar') && (actor.flyFt ?? 0) > 0) return [];
    // GOLPE DE ZÉFIRO: enquanto dura, andar não provoca ataque de oportunidade.
    if (hasCondition(actor, 'golpeDeZefir')) return [];
    // MÓVEL (talento): quem ele atacou de perto neste turno não o pega de oportunidade.
    // GINGADO (Espadachim): a mesma conta.
    const atacou = (temTalento(actor, 'movel') || Sub.temGingado(actor)) && actor.movelAtacou?.turno === this.turnoKey() ? actor.movelAtacou.ids : [];
    return this.enemiesOf(actor).filter(
      // SENTINELA (talento): Desengajar não livra do ataque de quem a tem.
      (e) => (!actor.disengaging || temTalento(e, 'sentinela'))
        && !atacou.includes(e.id)
        // DEFENSOR VIGILANTE (Cavaleiro, 18º): uma reação a mais por criatura, só para isto
        && (!e.reactionUsed || Sub.temReacaoVigilante(this, e, actor))
        // PANACHE: o provocado só pega de oportunidade o espadachim
        && !Sub.panacheImpedeOportunidade(this, e, actor)
        && getCondition(actor, 'manobrado')?.data?.de !== e.id
        && !conditionEffects(e).incapacitated
        && (this.armaDeOportunidade(e) !== undefined || this.magiaDeOportunidade(e, actor))
        && !this.separadosPelaAltura(e, actor)
        && distanceFt(e.pos, from) <= this.reachOf(e)
        && this.field.contato(e.pos, from)
        // MANTER A LINHA (Cavaleiro, 10º): andar DENTRO do alcance dele também provoca
        && (distanceFt(e.pos, to) > this.reachOf(e) || Sub.segueNaLinha(e))
        && this.vePraReagir(e, actor, from),
    );
  }

  /**
   * O ATAQUE DE OPORTUNIDADE é contra quem se VÊ sair do alcance (o SRD). Quem sai do breu, da Escuridão ou invisível
   * não o provoca de quem não o enxerga — o drow que some na própria Escuridão e recua.
   */
  vePraReagir(e, actor, from) {
    const alcanceVe = Math.max(alcanceDaVisaoVerdadeira(e), e.senses?.blindsightFt ?? 0);
    if (hasCondition(actor, 'invisivel') && !hasCondition(e, 'veInvisiveis') && alcanceVe < distanceFt(e.pos, from)) return false;
    return podeVer(this, e, { pos: from });
  }

  /** Move seguindo o caminho, resolvendo ataques de oportunidade a cada passo. */
  moveAlong(actor, path) {
    if (path.length < 2) return false;
    const reached = this.reachableFor(actor);
    const dest = path[path.length - 1];
    const node = reached.get(key(dest.x, dest.y));
    if (!node) return false;
    // Passar por cima de um aliado pode; terminar o movimento em cima dele,
    // não. A busca marca isso em `parar`, e é aqui que se cobra — este é o
    // caminho por onde TODO mundo anda, herói e monstro.
    if (node.parar === false) return false;
    // E nenhum passo do meio pode ser por cima de quem não se atravessa: o
    // caminho pode ter vindo de fora (a cena, a IA), não só de `pathFrom`.
    // (Quem não cabe ali nem entra em `reached`: um Grande por cima de um herói. Sem nó, também recusa.)
    for (let i = 1; i < path.length - 1; i++) {
      const passo = reached.get(key(path[i].x, path[i].y));
      if (!passo || passo.passar === false) return false;
    }
    // O que se cobra é o caminho ANDADO: um desvio (a IA contornando a Graxa)
    // custa mais que o caminho mais curto até a mesma casa.
    const hostil = this.terrenoHostil(actor);
    const tomadas = this.casasTomadas(actor);
    // Caído rasteja desde a saída até o fim do passo: o custo de rastejar vale o que era ao sair.
    const rasteja = this.rastejando(actor);
    const custoAte = (fim, noAr = this.voaAgora(actor)) => {
      this.field.dificeisExtra = hostil;
      this.field.voando = noAr;
      this.field.escalando = this.escalaAgora(actor);
      this.field.sobreAgua = conditionEffects(actor).sobreAgua || nadador(actor);
      this.field.atravessaVao = conditionEffects(actor).atravessaVao || Boolean(actor.traits?.includes('amorfo'));
      this.field.semTerrenoDificil = conditionEffects(actor).semTerrenoDificil || (temTalento(actor, 'movel') && actor.disparouEm === this.turnoKey());
      this.field.passoDaTerra = Boolean(actor.features?.includes('landsStride'));
    this.field.andaNaTeia = Boolean(actor.traits?.includes('webWalker'));
    this.field.incorporeo = this.incorporeoAgora(actor);
    this.field.escavaRocha = actor.traits?.includes('escavador') ? 'tunel' : actor.traits?.includes('deslizarNaTerra') ? 'desliza' : null;
      this.field.escalaSemCusto = Boolean(actor.features?.includes('secondStoryWork') || temTalento(actor, 'atleta'));
      this.field.rastejando = rasteja;
      let pes = 0;
      // O espaço de outra criatura é terreno difícil: atravessar o aliado custa o dobro (a mesma conta de `reachable`).
      const f = actor.pos.f ?? 1;
      // ESPREMER: o quadrado onde a pegada cheia não cabe custa 1,5 m a mais, a mesma conta que `reachable` faz.
      const aperta = this.cabeApertado(actor, f, tomadas);
      const cabeInteiro = this.cabeNaCasa(actor, f, tomadas);
      for (let i = 1; i <= fim; i++) {
        pes += this.field.costOf(path[i].x, path[i].y, path[i - 1].x, path[i - 1].y, tomadas.tomada(path[i].x, path[i].y, f));
        // A MESMA conta de `reachable`: o passo é espremido quando a pegada cheia não FAZ o passo (vão estreito)
        // ou não cabe no destino. Checar só o destino dava 20 pés onde a busca cobrava 25, e aí o cartão do
        // tabuleiro mentia sobre o custo do caminho.
        const inteiro = cabeInteiro && cabeInteiro(path[i].x, path[i].y)
          && this.field.passaPegada(path[i - 1].x, path[i - 1].y, path[i].x, path[i].y, f)
          && !this.field.paredeNaPegada(path[i].x, path[i].y, f);
        if (f > 1 && !inteiro && aperta(path[i].x, path[i].y)) pes += FEET_PER_SQUARE;
      }
      this.field.dificeisExtra = null;
      this.field.voando = false;
      this.field.escalando = false;
      this.field.sobreAgua = false;
      this.field.atravessaVao = false;
      this.field.semTerrenoDificil = false;
      this.field.passoDaTerra = false;
      this.field.incorporeo = false;
      this.field.escavaRocha = null;
      this.field.escalaSemCusto = false;
      this.field.rastejando = false;
      return pes;
    };
    // ANDA OU VOA? Quem voa pela ficha e nao paira (o dragao) anda de quatro no
    // chao e so DECOLA quando o movimento pede: passar do deslocamento de andar,
    // ou atravessar o que trava quem anda -- terreno dificil ou desnivel, que
    // deixam o caminho a pe mais caro que pelo ar (ou impossivel). Nesse trecho
    // ele esta no ar (`emVoo`): as zonas do chao nao o pegam, e o desenho mostra
    // o voo e o pouso no fim. Regra pedida pelo dono.
    const decideVoo = this.voaPelaFicha(actor) && !actor.hover && !this.voaAgora(actor);
    let voou = false;
    if (decideVoo) {
      const aPe = custoAte(path.length - 1, false);
      const peloAr = custoAte(path.length - 1, true);
      voou = !Number.isFinite(aPe) || aPe > peloAr || aPe > actor.speedFt;
    }
    const noAr = voou || this.voaAgora(actor);
    if (custoAte(path.length - 1, noAr) > actor.movementLeftFt) return false;
    actor.emVoo = voou;
    const origin = { ...actor.pos };
    let ate = path.length - 1;

    for (let i = 1; i < path.length; i++) {
      const from = { ...actor.pos };
      const to = path[i];
      const threats = this.ameacasNoPasso(actor, from, to);
      // O ataque de oportunidade acontece LOGO ANTES de o alvo sair do
      // alcance: resolvido com ele ainda na casa de partida. Resolvido depois,
      // o atacante media a distância da casa nova e o ataque nunca alcançava.
      for (const threat of threats) {
        this.opportunityAttack(threat, actor);
        if (actor.dead || hasCondition(actor, 'inconsciente')) break;
      }
      if (actor.dead || hasCondition(actor, 'inconsciente')) { ate = i - 1; break; }
      // SENTINELA: o ataque de oportunidade que acertou o para ali, antes de sair.
      if (actor.detidoEm === this.turnoKey()) { ate = i - 1; break; }
      // `f` viaja junto: perder a pegada aqui faria o ogro virar Médio ao andar.
      actor.pos = { x: to.x, y: to.y, f: actor.pos.f ?? 1 };
      // CHAMAS CAUTERIZANTES (Fogo Selvagem): quem entra na chama que um morto deixou
      Sub.pisouNaChama(this, actor);
      // MESTRE EM ARMAS DE HASTE: quem ENTRA no alcance da haste provoca o ataque, já na casa nova.
      for (const e of this.hastesQueReagem(actor, from, actor.pos)) {
        this.opportunityAttack(e, actor, { weaponId: e.hasteNaMao });
        if (actor.dead || hasCondition(actor, 'inconsciente')) break;
      }
      if (actor.dead || hasCondition(actor, 'inconsciente') || actor.detidoEm === this.turnoKey()) { ate = i; break; }
      // ESPREMIDO entra e sai sozinho, conforme a casa em que ele está: a condição não é imposta por ninguém,
      // é o lugar que a dá. Atualiza a cada passo, porque ele pode entrar apertado e sair folgado no mesmo turno.
      this.conferirEspremido(actor);
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
      // As REGIÕES do mapa (`rules/regioes.js`): o fosso, a placa de pressão, o chão que range.
      if (regioesNoPasso(this, actor, from)) parou = true;
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
    // Parado no meio do caminho (zona, armadilha, queda) DENTRO do espaço de um aliado que atravessava: não se termina o
    // movimento em cima de outra criatura. Recua pelo caminho até a última casa livre (a de partida é sempre livre).
    if (!actor.dead && ate > 0) {
      let j = ate;
      while (j > 0 && this.outrosNaPegada(path[j].x, path[j].y, actor.pos.f ?? 1, actor).length) j--;
      if (j !== ate) { actor.pos = { x: path[j].x, y: path[j].y, f: actor.pos.f ?? 1 }; ate = j; }
    }
    actor.movementLeftFt = actor.detidoEm === this.turnoKey() ? 0 : Math.max(0, actor.movementLeftFt - custoAte(ate, noAr));
    // A RETA DO FIM DO CAMINHO (a Investida, talento): quantas casas seguidas na mesma direção, somando a do passo
    // anterior quando ele seguiu reto.
    if (ate > 0) {
      let casas = 0;
      const dx = path[ate].x - path[ate - 1].x;
      const dy = path[ate].y - path[ate - 1].y;
      for (let k = ate; k >= 1 && path[k].x - path[k - 1].x === dx && path[k].y - path[k - 1].y === dy; k--) casas += 1;
      const antes = actor.retaFinal;
      if (casas === ate && antes?.turno === this.turnoKey() && antes.dx === dx && antes.dy === dy) casas += antes.casas;
      actor.retaFinal = { turno: this.turnoKey(), dx, dy, casas };
    }
    // O AGARRÃO DO HERÓI (Atletismo) acaba quando quem agarra sai do alcance.
    this.soltarAgarroesLonge(actor);
    // LÂMINA TROVEJANTE: quem sai do lugar por vontade, envolto em trovão, sofre o trovão (e ele se desfaz).
    const trovao = getCondition(actor, 'envoltoEmTrovao');
    if (trovao && ate > 0 && !actor.dead) {
      removeCondition(actor, 'envoltoEmTrovao');
      const r = damageRoll(this.rng, trovao.data?.dano ?? '1d8');
      this.say('magia', `O trovão explode em volta de ${actor.name}: ${r.total} trovejante.`, `${trovao.data?.dano ?? '1d8'}[${r.rolls.join('+')}]`);
      this.applyDamage(actor, r.total, 'trovejante', this.combatants.find((x) => x.id === trovao.source) ?? null, { magico: true });
    }
    // Pousou: o trecho voado acabou, e ele volta a estar no chao.
    actor.emVoo = false;
    // A corrida antes do salto: a DISTÂNCIA andada desde a última coisa que
    // não foi andar (`afterAction` e o próprio salto zeram).
    actor.corridaFt = (actor.corridaFt ?? 0) + ate * 5;
    // Passos sem Pegadas: o véu anda com quem o conjurou.
    this.renovarRastro();
    // `from` deixa a camada de desenho calcular para onde a figura está virada,
    // sem o motor precisar conhecer o conceito de "frente" (o 5e não tem).
    this.onEvent({ type: 'moved', actor, from: origin, to: { ...actor.pos }, path: path.slice(0, ate + 1).map((p) => ({ ...p })), voo: voou });
    // Quem tem stirge grudado leva o stirge junto.
    this.levarGrudados(actor);
    // O GRELL (o livro): quem ele agarra, se for Médio ou menor, vai junto quando ele se move.
    this.levarAgarrados(actor);
    // quem está DENTRO (engolido, engolfado) vai junto
    Livro.levarEngolidos(this, actor);
    Livro.zonasSeguem(this, actor);
    Livro.conchaAntivida(this, actor);
    if (actor.traits?.includes('chaoAberrante')) this.atualizarTerrenoDasZonas();
    // O ESCAVADOR (a broca infernal): a rocha por onde passou vira túnel.
    if (actor.traits?.includes('escavador')) this.abrirTunel(actor, path.slice(0, ate + 1));
    // a última reta andada (a INVESTIDA pede 6 m em linha reta)
    const reta = retaNoFim(path.slice(0, ate + 1));
    actor.retaAndada = reta ? { ...reta, vez: this.turnoKey() } : null;
    this.invisivelNaAgua(actor);
    return true;
  }

  // --- DRENAR SANGUE (o stirge, Manual dos Monstros) -----------------------
  //   acertou: gruda no alvo, sem teste; grudado, não ataca;
  //   no começo de cada turno dele, o alvo perde 1d4+3 PV;
  //   solta depois de drenar 10 PV, ou quando o alvo morre;
  //   qualquer criatura (o alvo também) arranca o stirge com uma ação.
  /** Os stirges grudados em `alvo`. */
  grudadosEm(alvo) {
    return this.combatants.filter((m) => !m.dead && m.grudadoEm === alvo.id);
  }

  grudar(m, alvo) {
    m.grudadoEm = alvo.id;
    m.drenado = 0;
    this.say('condicao', `${m.name} crava a tromba em ${alvo.name} e fica grudado.`);
    this.onEvent({ type: 'grudou', actor: m, target: alvo });
  }

  soltarGrudado(m, motivo) {
    if (!m.grudadoEm) return;
    m.grudadoEm = null;
    m.drenado = 0;
    this.say('condicao', `${m.name} ${motivo}.`);
  }

  /** O turno do stirge grudado: drena 1d4+3. Devolve true se ainda está grudado. */
  drenarSangue(m) {
    const alvo = this.combatants.find((c) => c.id === m.grudadoEm);
    if (!alvo || alvo.dead) { this.soltarGrudado(m, 'se solta: não há mais o que beber'); return false; }
    if (!isAdjacent(m.pos, alvo.pos)) this.levarGrudados(alvo);
    const r = damageRoll(this.rng, '1d4+3');
    const antes = alvo.hp;
    // SEM TIPO, de propósito. O livro separa duas coisas que são fáceis de
    // confundir: o acerto que GRUDA o stirge causa dano perfurante (está na
    // ficha, `monsters/feras.js`), e o dreno de cada turno seguinte é "o alvo
    // PERDE 1d4+3 pontos de vida por perda de sangue". Perda de PV não é dano,
    // e nenhuma resistência incide sobre ela — `danoPorTipo` devolve o valor
    // inteiro quando o tipo é nulo, que é exatamente o que se quer.
    //
    // O campo dizia `'perda de sangue'`, um tipo inventado, e eu o troquei por
    // `'perfurante'` por achar que era o mesmo dano do acerto. Medido: assim o
    // bárbaro em Fúria levava cada dreno pela metade e o stirge demorava 4,30
    // turnos em vez de 2,18 para se saciar — resistência que o livro não dá.
    //
    // SIMPLIFICAÇÃO DECLARADA: isto continua passando por `applyDamage`, então
    // ainda conta como "apanhou" para sustentar a Fúria e ainda pede teste de
    // concentração. Perda de PV de verdade não faria nenhum dos dois.
    this.applyDamage(alvo, r.total, null, m);
    m.drenado += Math.max(0, antes - alvo.hp) || r.total;
    this.say('dano', `${m.name} drena o sangue de ${alvo.name}: ${r.total} PV.`, `1d4+3 = ${r.total}`);
    if (alvo.dead || m.drenado >= 10) {
      // Cheio, ele voa para digerir (o Manual): não ataca mais (`saciado`).
      if (!alvo.dead) m.saciado = true;
      this.soltarGrudado(m, alvo.dead ? 'se solta do corpo' : 'se solta, cheio de sangue, e voa para longe');
      return false;
    }
    return true;
  }

  /** Os grudados acompanham o alvo: cada um vai para uma casa livre colada nele. */
  levarGrudados(alvo) {
    for (const m of this.grudadosEm(alvo)) {
      if (isAdjacent(m.pos, alvo.pos)) continue;
      let casa = null;
      for (let dy = -1; dy <= 1 && !casa; dy++) {
        for (let dx = -1; dx <= 1 && !casa; dx++) {
          const x = alvo.pos.x + dx;
          const y = alvo.pos.y + dy;
          if ((dx || dy) && this.field.inside(x, y) && !this.field.blocksMove(x, y) && !this.occupied(x, y, m)) casa = { x, y };
        }
      }
      if (casa) m.pos = { ...m.pos, ...casa, f: alvo.pos.f ?? m.pos.f };
    }
  }

  /**
   * O SUSTO do quasit (o livro): ação, uma vez por dia. Uma criatura a até 6 m, Sabedoria CD 10 ou amedrontada por 1
   * minuto; repete no fim de cada turno, com desvantagem enquanto vê o quasit.
   */
  sustoDoQuasit(m, alvo) {
    if (!m.traits?.includes('susto') || m.actionUsed || m.sustoUsado || !alvo || alvo.dead) return false;
    if (distanceFt(m.pos, alvo.pos) > 20) return false;
    m.sustoUsado = true;
    m.actionUsed = true;
    if (this.imuneACondicao(alvo, 'amedrontado')) { this.say('condicao', `${alvo.name} nem pisca para o susto de ${m.name}.`); return true; }
    const sv = this.resistencia(alvo, 'wis', 10, { contra: { condicao: 'amedrontado' } });
    const r = this.explicarResistencia(alvo, 'wis', 10, sv, { contra: `o susto de ${m.name}`, seSucesso: 'não se assusta' });
    if (sv.success) { this.say('condicao', `${m.name} tenta assustar ${alvo.name}, que não se abala.`, r.conta, { rolagem: r }); return true; }
    this.aplicarCondicao(alvo, 'amedrontado', { rounds: 10, source: m.id, data: { save: 'wis', dc: 10, repete: 'sempre', desvantagemSeVe: true } });
    this.say('condicao', `${m.name} mostra a ${alvo.name} uma coisa que não devia existir: amedrontado.`, r.conta, { rolagem: r });
    return true;
  }

  /**
   * MUDAR DE FORMA (o quasit, o livro): ação, vira morcego (3 m andando, 12 m voando), centopeia (12 m, escala) ou sapo
   * (12 m, nada 12 m), ou volta à forma dele. Muda só o deslocamento.
   */
  mudarDeForma(m, forma) {
    const FORMAS = {
      morcego: { speedFt: 10, flyFt: 40, swimFt: 0, climbFt: 0, nome: 'um morcego' },
      centopeia: { speedFt: 40, flyFt: 0, swimFt: 0, climbFt: 40, nome: 'uma centopeia' },
      sapo: { speedFt: 40, flyFt: 0, swimFt: 40, climbFt: 0, nome: 'um sapo' },
    };
    if (!m.traits?.includes('mudaDeForma') || m.actionUsed) return false;
    m.formaVerdadeira ??= { speedFt: m.speedFt, flyFt: m.flyFt ?? 0, speeds: { ...(m.speeds ?? {}) } };
    const f = FORMAS[forma];
    if (forma === 'verdadeira' || !f) {
      Object.assign(m, { speedFt: m.formaVerdadeira.speedFt, flyFt: m.formaVerdadeira.flyFt, speeds: { ...m.formaVerdadeira.speeds } });
      delete m.forma;
      this.say('magia', `${m.name} volta à forma dele.`);
    } else {
      Object.assign(m, { speedFt: f.speedFt, flyFt: f.flyFt, speeds: { ...(m.speeds ?? {}), swimFt: f.swimFt, climbFt: f.climbFt } });
      m.forma = forma;
      this.say('magia', `${m.name} se encolhe e vira ${f.nome}.`);
    }
    m.actionUsed = true;
    m.movementLeftFt = Math.min(m.movementLeftFt ?? 0, this.speedOf(m));
    return true;
  }

  /** O TÚNEL da broca infernal: cada casa de rocha natural na pegada do caminho vira chão de caverna. */
  abrirTunel(m, caminho) {
    const f = m.pos.f ?? 1;
    const fl = this.field;
    let abriu = 0;
    this.field.escavaRocha = 'tunel';
    try {
      for (const p of caminho) {
        for (let dy = 0; dy < f; dy++) for (let dx = 0; dx < f; dx++) {
          const x = p.x + dx;
          const y = p.y + dy;
          if (!fl.escavavel(x, y)) continue;
          const i = y * fl.w + x;
          fl.tiles[i] = 0;
          fl.surfaces[i] = SUPERFICIES.indexOf('caverna');
          if (fl.heights) fl.heights[i] = 0;
          abriu += 1;
        }
      }
    } finally { this.field.escavaRocha = null; }
    if (!abriu) return;
    fl.versao = (fl.versao ?? 0) + 1;
    this.say('movimento', `${m.name} fura a rocha e deixa um túnel atrás de si.`);
    this.onEvent({ type: 'tunel', actor: m, casas: abriu });
  }

  /** INVISÍVEL NA ÁGUA (a água viva, SRD): toda dentro d'água, ninguém a vê; fora dela, aparece. */
  invisivelNaAgua(c) {
    if (!c?.traits?.includes('invisivelNaAgua') || c.dead) return;
    const naAgua = this.field.aguas?.has(key(c.pos.x, c.pos.y));
    const inv = getCondition(c, 'invisivel');
    if (naAgua && !inv) addCondition(c, 'invisivel', { rounds: Infinity, source: c.id, data: { naAgua: true } });
    else if (!naAgua && inv?.data?.naAgua) removeCondition(c, 'invisivel');
  }

  /** Os humanoides mortos há até 1 minuto, a até 3 m de `m`, que ainda não se ergueram (o Criar Espectro). */
  corposParaEspectro(m) {
    return this.combatants.filter((c) => c.dead && !c.espectroErguido && (c.kind === 'pc' || c.tipo === 'humanoide')
      && this.round - (c.morreuNaRodada ?? -Infinity) <= 10 && distanceFt(m.pos, c.pos) <= 10);
  }

  /**
   * CRIAR ESPECTRO (a aparição, SRD): ação. O humanoide que morreu de morte violenta há até 1 minuto, a até 3 m dela, se
   * ergue como espectro na casa do corpo (ou na livre mais perto), sob o comando dela — até sete de cada vez.
   */
  criarEspectro(m, corpo) {
    if (!m.traits?.includes('createSpecter') || m.actionUsed || !this.corposParaEspectro(m).includes(corpo)) return false;
    if (this.combatants.filter((c) => !c.dead && c.criadoPor === m.id).length >= 7) return false;
    let casa = !this.occupied(corpo.pos.x, corpo.pos.y) ? { x: corpo.pos.x, y: corpo.pos.y } : null;
    for (let r = 1; r <= 2 && !casa; r++) {
      for (let dy = -r; dy <= r && !casa; dy++) for (let dx = -r; dx <= r && !casa; dx++) {
        const x = corpo.pos.x + dx;
        const y = corpo.pos.y + dy;
        if (this.field.inside(x, y) && !this.field.blocksMove(x, y) && !this.occupied(x, y)) casa = { x, y };
      }
    }
    if (!casa) return false;
    const e = makeMonster('espectro', casa, { rng: this.rng });
    e.side = m.side;
    e.criadoPor = m.id;
    e.name = `Espectro de ${corpo.name}`;
    e.acted = true;
    corpo.espectroErguido = true;
    m.actionUsed = true;
    this.addCombatant(e);
    this.say('morte', `${m.name} estende a mão sobre o corpo de ${corpo.name}, e o que restava dele se levanta como espectro.`);
    this.onEvent({ type: 'criarEspectro', actor: m, corpo, espectro: e });
    return true;
  }

  /**
   * O EFEITO EM SI MESMO (`tipo: 'propria'`): as Duplicatas Fantasmagóricas do cloaker mutante, ação bônus, até o fim do
   * próximo turno dele.
   */
  efeitoProprio(m, a) {
    if (hasCondition(m, a.condition)) return false;
    addCondition(m, a.condition, { rounds: this.side === m.side ? 2 : 1, quando: 'fim', lado: m.side, source: m.id });
    this.say('magia', a.texto ? `${m.name} ${a.texto}` : `${m.name} usa ${a.nome}.`);
    return true;
  }

  /**
   * A DISTORÇÃO DO VAZIO (o zelote aberrante, ação bônus com recarga): some e reaparece numa casa livre que vê a até
   * `alcanceFt`, deixando um vazio onde estava; quem está a `raioFt` do vazio faz Força: falhou, o dano inteiro e é
   * puxado para a casa livre mais perto do vazio; passou, metade, e fica onde está.
   */
  distorcaoDoVazio(m, a, alvo) {
    if (!alvo || this.field.blocksMove(alvo.x, alvo.y) || this.occupied(alvo.x, alvo.y, m)
      || distanceFt(m.pos, alvo) > a.alcanceFt || !this.field.hasLineOfSight(m.pos, alvo)) return false;
    const vazio = { x: m.pos.x, y: m.pos.y };
    m.pos = { ...m.pos, x: alvo.x, y: alvo.y };
    this.say('magia', `${m.name} some num rasgo do ar e reaparece a ${distanceFt(vazio, alvo)} pés; onde ele estava, gira um vazio.`);
    this.onEvent({ type: 'moved', actor: m, from: { ...vazio }, to: { ...m.pos }, path: [{ ...m.pos }], teleporte: true });
    const pegos = this.combatants.filter((c) => c !== m && !c.dead && c.hp > 0 && c.pos && distanceFt(vazio, c.pos) <= a.raioFt);
    // o mais perto primeiro: cada um que cai perto do vazio ocupa a casa que o próximo ia pegar
    pegos.sort((x, y) => distanceFt(vazio, x.pos) - distanceFt(vazio, y.pos));
    for (const t of pegos) {
      const sv = this.resistencia(t, a.save, a.dc, { contra: { tipoDano: a.damageType, magico: true } });
      const r = this.explicarResistencia(t, a.save, a.dc, sv, { contra: 'o vazio', seSucesso: 'metade, e não é puxado' });
      const d = damageRoll(this.rng, a.damage);
      const total = danoPorResistencia(t, a.save, true, sv.success, d.total, conditionEffects(t).incapacitated);
      this.say('dano', `${t.name} ${sv.success ? 'se segura' : 'é arrastado'} e sofre ${total} de ${a.damageType}.`, `${r.conta} · ${a.damage}[${d.rolls.join('+')}]`, { rolagem: r });
      if (total) this.applyDamage(t, total, a.damageType, m, { magico: true });
      if (sv.success || t.dead || t.hp <= 0) continue;
      let casa = null;
      for (let rr = 0; rr <= 6 && !casa; rr++) {
        for (let dy = -rr; dy <= rr; dy++) for (let dx = -rr; dx <= rr; dx++) {
          const x = vazio.x + dx;
          const y = vazio.y + dy;
          if (!this.field.inside(x, y) || this.field.blocksMove(x, y) || (this.occupied(x, y, t))) continue;
          const dd = distanceFt(vazio, { x, y });
          if (dd > distanceFt(vazio, t.pos)) continue;
          if (!casa || dd < casa.d) casa = { x, y, d: dd };
        }
      }
      if (casa && (casa.x !== t.pos.x || casa.y !== t.pos.y)) {
        const de = { ...t.pos };
        t.pos = { ...t.pos, x: casa.x, y: casa.y };
        this.onEvent({ type: 'moved', actor: t, from: de, to: { ...t.pos }, path: [{ ...t.pos }] });
      }
    }
    this.say('magia', 'O vazio se fecha.');
    return true;
  }

  /**
   * A REPREENSÃO OBSESSIVA (a ocular, reação): quem a fere, a até `alcanceFt` e à vista dela, faz o teste; falhou, o dano
   * inteiro, passou, metade.
   */
  repreensaoObsessiva(alvo, fonte) {
    const rr = alvo.repreensao;
    if (!rr || !fonte || fonte === alvo || fonte.dead || !fonte.pos || fonte.side === alvo.side || this.reagindo) return;
    if (alvo.dead || alvo.hp <= 0 || alvo.reactionUsed || conditionEffects(alvo).incapacitated) return;
    if (distanceFt(alvo.pos, fonte.pos) > rr.alcanceFt || !this.field.hasLineOfSight(alvo.pos, fonte.pos)) return;
    this.reagindo = true;
    try {
      alvo.reactionUsed = true;
      // `raioFt`: a área em volta de quem revida (a Ferida Nociva, o Trovão), que pega todos os inimigos dela
      const alvos = rr.raioFt
        ? this.combatants.filter((c) => c.side !== alvo.side && c.side !== 'neutro' && !c.dead && c.hp > 0 && c.pos && distanceFt(alvo.pos, c.pos) <= rr.raioFt)
        : [fonte];
      for (const t of alvos) {
        const sv = this.resistencia(t, rr.save, rr.dc, { contra: { tipoDano: rr.damageType ?? null, condicao: rr.condition ?? null, magico: true } });
        const r = this.explicarResistencia(t, rr.save, rr.dc, sv, { contra: rr.nome, seSucesso: rr.damage && rr.metade !== false ? 'metade do dano' : 'nada' });
        if (rr.damage) {
          const d = damageRoll(this.rng, rr.damage);
          const total = danoPorResistencia(t, rr.save, rr.metade !== false, sv.success, d.total, conditionEffects(t).incapacitated);
          const frase = rr.nome === 'Repreensão Obsessiva' ? `Os olhos de ${alvo.name} se viram todos para ${t.name}` : `${alvo.name} revida em ${t.name}`;
          this.say('reacao', `${frase} (${rr.nome}, reação): ${total} de ${rr.damageType}.`, `${r.conta} · ${rr.damage}[${d.rolls.join('+')}]`, { rolagem: r });
          if (total) this.outraFonte(() => this.applyDamage(t, total, rr.damageType, alvo, { magico: true }));
        } else this.say('reacao', `${alvo.name} revida em ${t.name} (${rr.nome}, reação)${sv.success ? `: ${t.name} aguenta` : ''}.`, r.conta, { rolagem: r });
        if (sv.success || t.dead) continue;
        if (rr.condition && !this.imuneACondicao(t, rr.condition)) this.aplicarCondicao(t, rr.condition, { rounds: 1, quando: 'fim', lado: t.side, source: alvo.id });
        if (rr.empurraFt) this.empurrar(t, alvo.pos, rr.empurraFt);
      }
    } finally {
      this.reagindo = false;
    }
  }

  /**
   * O REVIDE COM GOLPE dos bestiários (a Fúria Desenfreada do tanarukk, a Represália Feroz do abishai branco): ferido, ele
   * gasta a reação num golpe — em quem o feriu, se alcança, ou (`aoAcaso`) em alguém ao acaso no alcance dele.
   */
  revideComGolpe(alvo, fonte) {
    const rv = alvo.revide;
    if (!rv || this.reagindo || alvo.dead || alvo.hp <= 0 || alvo.reactionUsed || conditionEffects(alvo).incapacitated) return;
    if (!fonte || fonte === alvo || fonte.side === alvo.side) return;
    const opcoes = rv.aoAcaso
      ? this.combatants.filter((c) => c.side !== alvo.side && c.side !== 'neutro' && !c.dead && c.hp > 0 && c.pos && this.canAttack(alvo, c, rv.arma).ok)
      : [fonte].filter((c) => !c.dead && c.hp > 0 && c.pos && this.canAttack(alvo, c, rv.arma).ok);
    if (!opcoes.length) return;
    const t = opcoes[this.rng.die(opcoes.length) - 1];
    this.reagindo = true;
    try {
      alvo.reactionUsed = true;
      this.say('reacao', `${alvo.name} revida (${rv.nome}, reação).`);
      // a vantagem do revide vale só neste golpe: o `alvoCerteiro` que quem revida põe no alvo, e que sai logo depois
      if (rv.vantagem) addCondition(t, 'alvoCerteiro', { rounds: 1, source: alvo.id });
      this.resolveAttack(alvo, t, { weaponId: rv.arma });
      if (rv.vantagem && getCondition(t, 'alvoCerteiro')?.source === alvo.id) removeCondition(t, 'alvoCerteiro');
    } finally {
      this.reagindo = false;
    }
  }

  /**
   * NEGAR MAGIA (o alhoon, reação, 3 por dia): a magia de até `circuloMax` que alguém a até `alcanceFt` conjura falha, e
   * o espaço não se perde. Ele precisa perceber quem conjura (à vista, ou na visão verdadeira dele).
   */
  negarMagia(conjurador, spell, slot, gratis) {
    if (spell.level === 0 || this.reagindo) return false;
    for (const r of this.combatants) {
      const n = r.negarMagia;
      if (!n || r.side === conjurador.side || r.side === 'neutro' || r.dead || r.hp <= 0 || r.reactionUsed) continue;
      if (conditionEffects(r).incapacitated || !((r.usosEspeciais?.['Negar Magia'] ?? n.usos) > 0)) continue;
      if (slot > n.circuloMax || distanceFt(r.pos, conjurador.pos) > n.alcanceFt || !this.field.hasLineOfSight(r.pos, conjurador.pos)) continue;
      r.reactionUsed = true;
      (r.usosEspeciais ??= {})['Negar Magia'] = (r.usosEspeciais['Negar Magia'] ?? n.usos) - 1;
      if (!gratis && spell.level > 0 && conjurador.spellcasting?.slots?.[slot] != null) conjurador.spellcasting.slots[slot] += 1;
      this.say('magia', `${r.name} estende a mão, e ${spell.name} de ${conjurador.name} morre antes de sair (Negar Magia, reação). O espaço de magia não se perde.`);
      this.onEvent({ type: 'anulada', caster: conjurador, spell });
      return true;
    }
    return false;
  }

  /** A ação especial ainda pode sair? (usos por dia, recarga) */
  acaoEspecialPronta(m, a) {
    // a de AÇÃO BÔNUS (`bonus`: o Gemido Psíquico do cloaker mutante, a Distorção do Vazio do zelote) olha a ação bônus
    if (m.dead || (a.bonus ? m.bonusUsed : m.actionUsed) || conditionEffects(m).incapacitated) return false;
    // `recargaDe`: duas opções da MESMA recarga (a Torrente Antipática da ocular: o choro OU o olhar)
    if (a.recharge && m.recarregando?.[a.recargaDe ?? a.nome]) return false;
    if (a.porDia && !(m.usosEspeciais?.[a.nome] > 0)) return false;
    return true;
  }

  /** Quem a ação especial pega, mirando em `alvo` (casa ou criatura). */
  pegosDaAcaoEspecial(m, a, alvo) {
    // `poupaTipo`: quem é do tipo não sente (o Gemido do cloaker mutante não pega aberração); `escolhe`: as criaturas
    // que ELE escolhe (a Rajada Mental do cérebro ancião), e ele não escolhe os dele
    const filtro = (lista) => lista.filter((c) => (!a.poupaTipo || !String(c.tipo ?? '').startsWith(a.poupaTipo))
      && (!a.escolhe || (c.side !== m.side && c.side !== 'neutro')));
    if (a.tipo === 'alvo') return alvo && Livro.alvoServe(this, m, a, alvo) ? filtro(Livro.maisAlvos(this, m, a, alvo)) : [];
    if (a.shape === 'raio') return filtro(this.combatants.filter((c) => c !== m && !c.dead && c.hp > 0 && c.pos && distanceFt(m.pos, c.pos) <= a.areaFt));
    const casas = this.areaDaMagia(m, { shape: a.shape, areaFt: a.areaFt, level: 0 }, alvo?.pos ?? alvo) ?? [];
    const dentro = new Set(casas.map((t) => key(t.x, t.y)));
    return filtro(this.combatants.filter((c) => c !== m && !c.dead && this.pegadaEmAlgumaCasa(c, dentro)));
  }

  /**
   * A AÇÃO ESPECIAL dos bestiários importados (`acoesEspeciais`): o olhar, o grito, a nuvem, a rajada — teste, dano,
   * condição —; o toque que cura; o teleporte. Gasta a ação, o uso do dia ou a recarga.
   */
  usarAcaoEspecial(m, a, alvo) {
    if (!this.acaoEspecialPronta(m, a)) return false;
    // os tipos novos dos bestiários (`livro-motor.js`): cada um diz se deu certo, e o custo é o mesmo de todos
    const NOVOS = {
      etereo: () => Livro.fugirParaOEtereo(this, m, a),
      nevoa: () => Livro.formaDeNevoa(this, m, a),
      engolir: () => Livro.engolirAcao(this, m, a, alvo),
      engolfar: () => Livro.engolfar(this, m, a),
      puxarAgarrados: () => Livro.puxarAgarrados(this, m, a),
      arremessar: () => Livro.arremessarAgarrado(this, m, a),
      aumentar: () => Livro.aumentarDuergar(this, m),
      escuridao: () => Livro.auraDeEscuridao(this, m, a, SPELLS),
      gritoDeGuerra: () => Livro.gritoDeGuerra(this, m, a),
      telecinese: () => Livro.impulsoTelecinetico(this, m, alvo, abilityMod, skillBonus),
      corroerArmadura: () => Livro.antenas(this, m, a, alvo, ARMORS, armorClass, WEAPONS),
      invocar: () => Livro.invocarDoLivro(this, m, a),
      vazio: () => this.distorcaoDoVazio(m, a, alvo),
      propria: () => this.efeitoProprio(m, a),
      // a SEGUNDA FILA DOS BESTIÁRIOS: a carapaça do tortle e o golpe de ação bônus da Fúria Marcial
      concha: () => Livro.entrarNaConcha(this, m, a),
      golpeBonus: () => Livro.golpeBonus(this, m, a, alvo),
    };
    if (a.soDepoisDeSaltar) {
      if (!Livro.saltoMortal(this, m, a, alvo)) return false;
    } else if (a.tipo === 'estagios') {
      const fase = Livro.estagioDoRugido(a, m.usosEspeciais?.[a.nome] ?? 0);
      const pegos = this.pegosDaAcaoEspecial(m, fase, alvo);
      if (!pegos.length) return false;
      const guarda = { ...a };
      Object.assign(a, fase, { nome: a.nome, porDia: guarda.porDia, tipo: 'area', estagios: guarda.estagios, recharge: guarda.recharge });
      try { this.efeitoGeralDoEspecial(m, a, pegos); } finally { for (const k of Object.keys(a)) delete a[k]; Object.assign(a, guarda); }
    } else if (NOVOS[a.tipo]) {
      if (!NOVOS[a.tipo]()) return false;
    } else if (a.tipo === 'teleporte') {
      if (!alvo || this.occupied(alvo.x, alvo.y) || this.field.blocksMove(alvo.x, alvo.y) || distanceFt(m.pos, alvo) > a.alcanceFt) return false;
      m.pos = { ...m.pos, x: alvo.x, y: alvo.y };
      this.say('magia', `${m.name} some e reaparece a ${distanceFt(m.posNoInicioDoTurno ?? m.pos, alvo)} pés dali (${a.nome}).`);
    } else if (a.tipo === 'cura') {
      // o SEGUNDO FÔLEGO (o campeão) só cura quem o tem
      if (a.soEmSi) alvo = m;
      if (!alvo || alvo.dead || distanceFt(m.pos, alvo.pos) > 5) return false;
      const d = damageRoll(this.rng, a.dados);
      const curou = this.heal(alvo, d.total, m);
      this.say('cura', `${m.name} toca ${alvo.name}: +${curou} PV (${a.nome}).`, `${a.dados}[${d.rolls.join('+')}]`);
    } else {
      const pegos = this.pegosDaAcaoEspecial(m, a, alvo);
      if (!pegos.length) return false;
      this.efeitoGeralDoEspecial(m, a, pegos);
    }
    if (a.bonus) m.bonusUsed = true; else m.actionUsed = true;
    if (a.recharge) (m.recarregando ??= {})[a.recargaDe ?? a.nome] = true;
    if (a.porDia) m.usosEspeciais[a.nome] -= 1;
    this.onEvent({ type: 'habilidade', actor: m, id: a.nome });
    return true;
  }

  /**
   * O EFEITO DE SEMPRE da ação especial em cada alvo: teste, dano (um ou dois tipos), condição — e o que os bestiários
   * dos livros pediram a mais (`livro-motor.js efeitoDoEspecial`): a queda a 0 PV, o arremesso, o PV máximo que cai, o
   * dreno que cura quem drena.
   */
  efeitoGeralDoEspecial(m, a, pegos) {
    this.say('acao', `${m.name} usa ${a.nome}.`);
    let drenado = 0;
    for (const t of pegos) {
      if (t.imuneAEspecial?.includes(`${m.id}:${a.nome}`)) continue;
      const sv = this.resistencia(t, a.save, a.dc, { contra: { tipoDano: a.damageType ?? null, condicao: a.condition ?? null, magico: true } });
      const r = this.explicarResistencia(t, a.save, a.dc, sv, { contra: a.nome, seSucesso: a.halfOnSave ? 'metade do dano' : 'nada' });
      let entrou = 0;
      if (a.damage) {
        for (const [dd, tp] of [[a.damage, a.damageType], [a.damage2, a.damageType2]]) {
          if (!dd) continue;
          const d = damageRoll(this.rng, dd);
          const total = danoPorResistencia(t, a.save, !!a.halfOnSave, sv.success, d.total, conditionEffects(t).incapacitated);
          const antes = t.hp;
          if (total) this.applyDamage(t, total, tp, m, { magico: true });
          entrou += Math.max(0, antes - Math.max(0, t.hp));
          this.say('dano', `${t.name} ${sv.success ? 'resiste' : 'falha'} e sofre ${total} de ${tp}.`, `${r.conta} · ${dd}[${d.rolls.join('+')}]`, { rolagem: r });
        }
      } else if (!a.cai0) this.say('condicao', sv.success ? `${t.name} resiste a ${a.nome}.` : `${t.name} não resiste a ${a.nome}.`, r.conta, { rolagem: r });
      drenado += Livro.efeitoDoEspecial(this, m, a, t, sv, entrou);
      if (sv.success) { if (a.imunizaAoPassar) (t.imuneAEspecial ??= []).push(`${m.id}:${a.nome}`); continue; }
      // O CHORO da ocular: quem falha perde a concentração
      if (a.quebraConcentracao && t.concentrating) { this.dropConcentration(t); this.say('magia', `${t.name} perde a concentração.`); }
      if (a.condition && !t.dead && t.hp > 0 && !this.imuneACondicao(t, a.condition)) {
        // "até o fim do PRÓXIMO turno dele": posta no turno do dono, a contagem tem de pular o fim deste (era `rounds: 1`
        // e a condição acabava no fim do mesmo turno em que nascia; o grupo nunca jogava amedrontado pelo Gemido)
        // `ateInicioDoTurnoDoDono`: até o começo do próximo turno de quem a usou (o Sopro da Singularidade do Lowarnizel)
        this.aplicarCondicao(t, a.condition, a.ateInicioDoTurnoDoDono
          ? { rounds: 1, quando: 'inicio', lado: m.side, source: m.id }
          : a.ateFimDoTurnoDele
          ? { rounds: this.side === m.side ? 2 : 1, quando: 'fim', lado: m.side, source: m.id }
          : a.ateFimDoTurnoDoAlvo
            ? { rounds: this.side === t.side ? 2 : 1, quando: 'fim', lado: t.side, source: m.id }
            : { rounds: a.rounds ?? 10, source: m.id, data: { save: a.save, dc: a.dc, repete: !!a.repete } });
      }
    }
    // DRENAR VIDA (o semilich): cura o que tirou de todos
    if (a.drena && drenado > 0 && !m.dead) {
      const curou = this.heal(m, drenado, m);
      if (curou) this.say('cura', `${m.name} bebe a vida que tirou: +${curou} PV.`);
    }
  }

  /** RAMPAGE: o inimigo mais perto que se alcança com metade do deslocamento, e a mordida (o primeiro golpe de perto). */
  rampage(m) {
    const golpe = m.attacks?.find((a) => /mordida/i.test(a.name)) ?? m.attacks?.find((a) => !a.ranged);
    if (!golpe) return;
    const inimigos = this.enemiesOf(m).filter((e) => !e.dead && e.hp > 0);
    const colado = inimigos.find((e) => this.field.vizinhos(m.pos, e.pos));
    if (!colado) {
      const metade = Math.floor(this.speedOf(m) / 2);
      const reach = this.reachableFor(m, { orcamentoFt: metade });
      let melhor = null;
      for (const n of reach.values()) {
        if (n.parar === false || n.cost > metade) continue;
        if (!inimigos.some((e) => this.field.vizinhos({ x: n.x, y: n.y }, e.pos))) continue;
        if (!melhor || n.cost < melhor.cost) melhor = n;
      }
      if (!melhor) return;
      const guarda = m.movementLeftFt;
      m.movementLeftFt = Math.max(m.movementLeftFt, metade);
      this.moveAlong(m, Battlefield.pathFrom(reach, melhor));
      m.movementLeftFt = Math.min(guarda, m.movementLeftFt);
    }
    const alvo = inimigos.find((e) => !e.dead && e.hp > 0 && this.field.vizinhos(m.pos, e.pos));
    if (!alvo) return;
    this.say('recurso', `${m.name} sente o sangue e avança sobre ${alvo.name} (Rampage).`);
    this.resolveAttack(m, alvo, { weaponId: golpe.name });
  }

  /** `carregaAgarrados` (o grell): o agarrado Médio ou menor acompanha quem o agarra, na casa livre mais perto dele. */
  levarAgarrados(m) {
    if (!m.traits?.includes('carregaAgarrados') || m.dead) return;
    for (const c of this.combatants) {
      if (c.dead || c === m || categoriaDeTamanho(c) > 2) continue;
      if (getCondition(c, 'contido')?.source !== m.id || isAdjacent(c.pos, m.pos)) continue;
      let casa = null;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const x = m.pos.x + dx;
          const y = m.pos.y + dy;
          if (!(dx || dy) || !this.field.inside(x, y) || this.field.blocksMove(x, y) || this.occupied(x, y, c)) continue;
          const d = distanceFt({ x, y }, c.pos);
          if (!casa || d < casa.d) casa = { x, y, d };
        }
      }
      if (!casa) continue;
      c.pos = { ...c.pos, x: casa.x, y: casa.y };
      this.say('condicao', `${m.name} leva ${c.name} preso nos tentáculos.`);
    }
  }

  /** Arrancar um stirge (de si ou de um aliado colado): gasta a ação. */
  arrancarGrudado(actor, m) {
    const alvo = this.combatants.find((c) => c.id === m?.grudadoEm);
    if (!alvo) return { ok: false, why: 'não está grudado em ninguém' };
    if (alvo !== actor && !isAdjacent(actor.pos, alvo.pos)) return { ok: false, why: 'precisa estar colado em quem tem o stirge' };
    if (!this.gastarAcaoSimples(actor)) return { ok: false, why: 'a ação deste turno já foi usada' };
    this.soltarGrudado(m, `é arrancado por ${actor.name}`);
    this.afterAction(actor);
    return { ok: true };
  }

  // ---- zonas no chão (Graxa) ----------------------------------------------

  proximaZona() {
    this.contadorDeZonas = (this.contadorDeZonas ?? 0) + 1;
    return this.contadorDeZonas;
  }

  /** Terreno difícil das zonas que o são (Raio Lunar e Esfera não são). */
  /**
   * O que as zonas fazem com o CHÃO: terreno difícil, terreno de custo quádruplo (a Muralha de
   * Espinhos, 1,2 m de passo por 30 cm de muralha) e a MURALHA CONJURADA, que é parede enquanto
   * durar. O campo não sabe de magia nenhuma: tudo isto chega por estes quatro conjuntos, e some
   * quando a zona acaba.
   */
  atualizarTerrenoDasZonas() {
    const casasDe = (quais) => new Set(this.zonas.filter(quais).flatMap((z) => [...z.casas]));
    this.field.dificeis = casasDe((z) => z.dificil);
    this.field.dificeisDeTeia = casasDe((z) => z.dificil && z.spellId === 'teia');
    this.field.dificeis4 = casasDe((z) => z.dificil4);
    this.field.murosDeMagia = casasDe((z) => z.barraPasso);
    this.field.murosOpacosDeMagia = casasDe((z) => z.barraVisao);
    // o CHÃO ABERRANTE da boca tagarela: terreno difícil a 3 m dela, enquanto ela vive
    for (const k of Livro.casasDoChaoAberrante(this)) this.field.dificeis.add(k);
  }

  /**
   * Tira de dentro da muralha quem estiver na linha dela, empurrando para o lado de lá (a partir de
   * quem conjura). Devolve as casas que de fato viram muralha: a de quem não saiu fica de fora.
   */
  abrirCaminhoParaAMuralha(actor, casas) {
    return casas.filter((t) => {
      const c = this.at(t.x, t.y);
      if (!c || c.dead) return true;
      this.empurrar(c, actor.pos, 5);
      const saiu = c.pos.x !== t.x || c.pos.y !== t.y;
      if (saiu) this.say('magia', `${c.name} é empurrado para fora da linha da muralha.`);
      else this.say('magia', `${c.name} ocupa a linha da muralha, e ela se abre em volta dele.`);
      return saiu;
    });
  }

  /** As casas que a zona de fato cobre (Crescimento de Plantas: só chão natural, sem os aliados). A prévia usa a mesma conta. */
  casasDaZona(actor, spell, casas) {
    if (spell.zona?.soVegetal) casas = casas.filter((t) => !SEM_PLANTAS.has(this.field.surfaceAt(t.x, t.y)) && !this.field.blocksMove(t.x, t.y));
    if (spell.zona?.poupaAliados) casas = casas.filter((t) => { const c = this.at(t.x, t.y); return !(c && c.side === actor.side); });
    return casas;
  }

  criarZona(actor, spell, casas, cd, { centro = null, circulo = spell.level, tipo = null, opcao = null } = {}) {
    const dano = spell.zona.dano;
    // Crescimento de Plantas: só o chão natural vira mato, e as casas dos aliados ficam de fora.
    casas = this.casasDaZona(actor, spell, casas);
    // A MURALHA QUE BARRA O PASSO não nasce em cima de ninguém: o livro empurra quem está na linha
    // dela para um dos lados, à escolha de quem conjura, e aqui o lado é o de LÁ — ninguém levanta
    // uma parede para o próprio lado. Quem não tem para onde ser empurrado (encostado noutra parede,
    // cercado) deixa a casa dele de FORA da muralha: melhor um vão do que uma criatura emparedada,
    // que nenhuma regra do livro produz.
    if (spell.zona.barraPasso) casas = this.abrirCaminhoParaAMuralha(actor, casas);
    const zona = {
      id: this.proximaZona(),
      dificil: spell.zona.dificil ?? true,
      // Raio Lunar, Esfera Flamejante, Nuvem de Adagas: a zona fere.
      // o TRUQUE de zona (a Fogueira) cresce com o nível de quem conjura, como os outros truques
      dano: dano ? { ...dano, dados: dadosDaMagia(spell, { nivel: actor.level ?? 1, circulo, notacao: dano.dados }) } : null,
      // ESPÍRITO CURADOR: a zona que cura o aliado, com um número de usos
      cura: spell.zona.cura ? { dados: dadosDaMagia(spell, { circulo, notacao: spell.zona.cura.dados }), usos: Math.max(2, 1 + spellMod(actor)) } : null,
      centro: centro ? { x: centro.x, y: centro.y } : null,
      // MURALHA DE FOGO: a faixa de 3 m do lado escolhido, que queima quem TERMINA o turno nela.
      calor: spell.ladoQuenteFt ? new Set(this.muralhaQuente(actor, spell, casas, opcao).map((t) => key(t.x, t.y))) : null,
      dono: actor.id,
      quando: spell.zona.quando ?? 'fim',
      aoEntrar: spell.zona.aoEntrar ?? true,
      // Guardião da Fé: a zona acaba quando tiver causado `orcamento` de dano,
      // e só fere quem é HOSTIL a quem a conjurou — é o que o livro diz, e a
      // primeira versão desta zona feria a aliada que passava por ela.
      orcamento: spell.zona.orcamento ?? null,
      gasto: 0,
      soHostis: !!spell.zona.soHostis,
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
      // Muralha de Força, de Pedra e de Gelo: ninguém passa. A de Pedra e a de Gelo também tapam a
      // vista; a de Força é invisível, e por isso barra o passo e não a visão.
      barraPasso: !!spell.zona.barraPasso,
      barraVisao: !!spell.zona.barraVisao,
      // A MURALHA QUE SE QUEBRA. Só duas das seis têm CA e PV no livro — a de Pedra e a de Gelo —, e
      // os PV são POR TRECHO, não da muralha inteira: derrubar um trecho abre um VÃO e o resto fica
      // de pé. Por isso é um mapa casa a casa, e não um número só. A de Força é imune de propósito
      // (o livro só a destrói com Desintegrar) e a sebe de Espinhos não tem CA nem PV nenhum.
      objeto: spell.zona.objeto ? { ...spell.zona.objeto } : null,
      pvDoTrecho: spell.zona.objeto ? new Map(casas.map((t) => [key(t.x, t.y), spell.zona.objeto.pv])) : null,
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
    this.atualizarTerrenoDasZonas();
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

  // ---- Plantas Constritoras (o vine blight) --------------------------------

  /**
   * Plantas Constritoras (Recarga 5–6): raízes e vinhas brotam do chão num raio
   * de 4,5 m da vinha e secam depois de 1 minuto. A área é terreno difícil, e
   * cada criatura À ESCOLHA da vinha que estiver dentro quando as plantas
   * aparecem faz FOR CD 12 ou fica contida; soltar-se (ou soltar outro ao
   * alcance) é uma ação e um teste de FOR CD 12.
   *
   * Duas coisas são nossas, e ditas na cara: a "escolha" da vinha é sempre o
   * lado de quem a enfrenta, porque é o que ela faria; e o terreno difícil do
   * motor é por CASA, não por criatura, então aqui ele atrapalha planta também,
   * enquanto o livro deixa as plantas andarem livres.
   */
  /**
   * A NUVEM DE TINTA (o polvo gigante, SRD): ação, uma vez por descanso, só debaixo d'água. A tinta toma a esfera de 6 m
   * em volta dele, nas casas de água (`field.aguas`), e é escuridão pesada por 1 minuto; depois ele DISPARA como ação
   * bônus (o deslocamento dobra, no nado).
   */
  nuvemDeTinta(actor) {
    if (!actor.traits?.includes('nuvemDeTinta') || actor.actionUsed || actor.recarregando?.['Nuvem de Tinta']) return false;
    const aguas = this.field.aguas;
    if (!aguas?.has(key(actor.pos.x, actor.pos.y))) return false;
    const casas = (this.areaDaMagia(actor, NUVEM_DE_TINTA, actor.pos) ?? []).filter((c) => aguas.has(key(c.x, c.y)));
    if (!casas.length) return false;
    this.say('recurso', `${actor.name} solta uma nuvem de tinta preta: a água em volta some de vista.`);
    const zona = this.criarZona(actor, NUVEM_DE_TINTA, casas, 0, { centro: actor.pos });
    this.onEvent({ type: 'nuvemDeTinta', actor, zona });
    (actor.recarregando ??= {})['Nuvem de Tinta'] = true;
    actor.actionUsed = true;
    if (!actor.bonusUsed) {
      actor.bonusUsed = true;
      actor.movementLeftFt = (actor.movementLeftFt ?? 0) + Math.max(this.speedOf(actor), actor.speeds?.swimFt ?? 0);
      this.say('movimento', `${actor.name} dispara pela água.`);
    }
    return true;
  }

  plantasConstritoras(actor) {
    if (!actor.traits?.includes('plantasConstritoras') || actor.actionUsed) return false;
    if (actor.recarregando?.['Plantas Constritoras']) return false;
    const dentro = this.enemiesOf(actor).filter((c) => !c.dead && distanceFt(c.pos, actor.pos) <= 15);
    if (!dentro.length) return false;
    const casas = this.areaDaMagia(actor, PLANTAS_CONSTRITORAS, actor.pos) ?? [];
    if (!casas.length) return false;
    this.say('recurso', `${actor.name} abre os cipós: raízes e vinhas brotam do chão num raio de 4,5 m.`);
    const zona = this.criarZona(actor, PLANTAS_CONSTRITORAS, casas, 12, { centro: actor.pos });
    this.onEvent({ type: 'plantasConstritoras', actor, zona });
    for (const c of dentro) {
      if (zona.casas.has(key(c.pos.x, c.pos.y))) this.resistirAZona(c, zona, 'está');
    }
    (actor.recarregando ??= {})['Plantas Constritoras'] = true;
    actor.actionUsed = true;
    return true;
  }

  // ---- arma de sopro (o Sopro Venenoso do dragão verde) ---------------------

  /**
   * A arma de sopro da ficha (`breath`), que até aqui estava DECLARADA e nunca
   * acontecia: o bloco existia desde que o dragão foi escrito, com cone, CD,
   * dados e recarga, e nada no motor o lia. O chefe do jogo nunca soprou.
   *
   * Reusa as peças do caminho de magia em área, que é o que o comentário do
   * bloco sempre pediu: `areaDaMagia` desenha o cone, `resistencia` e
   * `explicarResistencia` fazem o teste com a conta na tela, `applyDamage`
   * cobra. O que ele NÃO reusa é o `castSpell` inteiro — aquilo carrega espaço
   * de magia, concentração e preparação, e sopro de dragão não tem nada disso.
   *
   * O evento sai no formato de magia de propósito: `playSpellVisual` já conhece
   * `soproVenenoso` (apelido do cone verde em `visuals.js`), e o `conjurar` cai
   * no `attack` quando a folha não tem gesto próprio. Zero arte nova.
   *
   * Sopro de dragão NÃO é mágico: quem resiste a dano mágico não se beneficia.
   */
  sopro(actor, alvo) {
    const b = actor.breath;
    if (!b || actor.actionUsed || actor.dead) return false;
    if (actor.recarregando?.[b.chaveRecarga ?? b.name]) return false;
    const casas = this.areaDaMagia(actor, { shape: b.shape, areaFt: b.areaFt, level: 0 }, alvo) ?? [];
    if (!casas.length) return false;
    const dentro = new Set(casas.map((t) => key(t.x, t.y)));
    const pegos = this.combatants.filter((c) => !c.dead && this.pegadaEmAlgumaCasa(c, dentro));
    this.say('recurso', `${actor.name} enche o peito e solta ${b.name.toLowerCase()} num cone de ${b.areaFt / 5 * 1.5} m.`);
    this.onEvent({ type: 'spell', caster: actor, spell: { id: b.id ?? 'soproVenenoso', name: b.name, origem: b.origem ?? 'sopro' }, point: alvo, areaTiles: casas });
    for (const t of pegos) {
      if (!b.damage) {
        // O SOPRO QUE EMPURRA (o Sopro Repulsor dos dragões de bronze, de cobre, de ouro): quem falha é jogado longe.
        if (b.empurraFt && t !== actor) {
          const sv = this.resistencia(t, b.save, b.dc, {});
          const rr = this.explicarResistencia(t, b.save, b.dc, sv, { contra: b.name, seSucesso: 'fica onde está' });
          if (sv.success) { this.say('condicao', `${t.name} finca os pés.`, rr.conta, { rolagem: rr }); continue; }
          this.empurrar(t, actor.pos, b.empurraFt);
          this.say('condicao', `${b.name} joga ${t.name} longe.`, rr.conta, { rolagem: rr });
          continue;
        }
        // SOPRO SEM DANO (o mefit de poeira): quem falha fica com a condição, e repete no fim de cada turno.
        if (t === actor || !b.condition || this.imuneACondicao(t, b.condition)) continue;
        const sv = this.resistencia(t, b.save, b.dc, { contra: { condicao: b.condition } });
        const rr = this.explicarResistencia(t, b.save, b.dc, sv, { contra: b.name, seSucesso: 'nada' });
        if (sv.success) { this.say('condicao', `${t.name} sai da nuvem a tempo.`, rr.conta, { rolagem: rr }); continue; }
        this.aplicarCondicao(t, b.condition, { rounds: b.rounds ?? 10, source: actor.id, data: { save: b.save, dc: b.dc, repete: true } });
        this.say('condicao', `${b.name} pega ${t.name}: fica ${CONDITIONS[b.condition]?.name.toLowerCase() ?? b.condition}.`, rr.conta, { rolagem: rr });
        continue;
      }
      const save = this.resistencia(t, b.save, b.dc, { contra: { tipoDano: b.damageType } });
      const dmg = damageRoll(this.rng, b.damage);
      const total = danoPorResistencia(t, b.save, !!b.halfOnSave, save.success, dmg.total, conditionEffects(t).incapacitated);
      const r = this.explicarResistencia(t, b.save, b.dc, save, {
        contra: `${b.name} (cone de ${b.areaFt / 5 * 1.5} m)`,
        seSucesso: b.halfOnSave ? 'metade do dano' : 'nenhum dano',
      });
      this.say('magia', `${t.name} ${save.success ? 'resiste' : 'falha'} contra ${b.name} e sofre ${total}.`,
        `${r.conta} · ${b.damage}[${dmg.rolls.join('+')}]${save.success && b.halfOnSave ? ` → metade = ${total}` : ''}`,
        { rolagem: r });
      this.applyDamage(t, total, b.damageType, actor);
    }
    (actor.recarregando ??= {})[b.chaveRecarga ?? b.name] = true;
    actor.actionUsed = true;
    // OS DOIS SOPROS (os dragões metálicos): a recarga é uma só, e o próximo sai do outro
    if (actor.sopros?.length > 1) actor.breath = actor.sopros[(actor.sopros.findIndex((x) => x.name === b.name) + 1) % actor.sopros.length];
    return true;
  }

  /** A pegada da criatura toca alguma das casas? (Grande ocupa 2x2.) */
  pegadaEmAlgumaCasa(c, casas) {
    const f = footprintOf(c);
    for (let dy = 0; dy < f; dy++) {
      for (let dx = 0; dx < f; dx++) {
        if (casas.has(key(c.pos.x + dx, c.pos.y + dy))) return true;
      }
    }
    return false;
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
    this.atualizarTerrenoDasZonas();
    const dono = this.combatants.find((c) => c.id === zona.dono) ?? null;
    const g = zona.glifo;
    this.say('magia', `${gatilho.name} pisa no Glifo de Proteção: a runa explode em ${g.tipo}!`);
    const casas = this.field.within(zona.centro, g.raioFt).filter((t) => this.field.hasLineOfSight(zona.centro, t));
    this.onEvent({ type: 'glifo', zona, gatilho, areaTiles: casas, tipo: g.tipo });
    const r = damageRoll(this.rng, g.dados);
    const pegos = [...new Set(casas.map((t) => this.at(t.x, t.y)))].filter((c) => c && !c.dead);
    for (const c of pegos) {
      const save = this.resistencia(c, g.save, zona.cd);
      const amount = danoPorResistencia(c, g.save, true, save.success, r.total, conditionEffects(c).incapacitated);
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
      this.atualizarTerrenoDasZonas();
    }
  }

  /**
   * Passos sem Pegadas: o véu anda com quem o conjurou. Dá a condição a quem está a
   * até 9 m dele e tira de quem se afastou. Roda no começo do turno, depois de
   * qualquer movimento e na conjuração.
   */
  renovarRastro() {
    for (const dono of this.combatants) {
      const conc = dono.concentrating;
      if (!conc || conc.spellId !== 'passosSemPegadas') continue;
      const raio = getSpell('passosSemPegadas').raioFt;
      const com = [];
      for (const c of this.combatants) {
        if (c.side !== dono.side || c.dead) continue;
        const perto = !dono.dead && distanceFt(dono.pos, c.pos) <= raio;
        const tem = getCondition(c, 'semRastro')?.source === dono.id;
        if (perto) {
          if (conc.dissipados?.includes(c.id)) continue;
          if (!tem) addCondition(c, 'semRastro', { source: dono.id, magia: { id: 'passosSemPegadas', circulo: conc.circulo ?? 2 } });
          com.push(c);
        } else if (tem) {
          removeCondition(c, 'semRastro');
          this.say('condicao', `${c.name} se afasta demais de ${dono.name} e perde os Passos sem Pegadas.`);
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
      this.pagarReacao(reator, pode);
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
  tentarContramagia(conjurador, spell, slot, gratis = false) {
    if (this.negarMagia(conjurador, spell, slot, gratis)) return true;
    // NÊMESIS DOS CONJURADORES (Matador de Monstros, 11º): vale até contra truque.
    if (!this.reagindo && Sub.nemesisDosConjuradores(this, conjurador, spell)) return true;
    if (spell.level === 0 || this.reagindo) return false;
    // MAGIA SUTIL: sem gestos nem palavras, ninguém percebe a conjuração para contrariá-la.
    if (this.metaAtiva?.subtle && this.metaAtiva.dono === conjurador) return false;
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

  /** O voador perde o voo: cai (1d6 concussão, o jogo supõe ~3 m) e fica caído. */
  cair(c, dados = '1d6') {
    if (c.dead) return;
    const gato = getCondition(c, 'aprimorado')?.data?.opcao === 'gato';
    if (gato) {
      this.say('condicao', `${c.name} cai de pé, leve como um gato: sem dano.`);
      return;
    }
    const r = damageRoll(this.rng, dados);
    // QUEDA LENTA (monge, 4º): o dano cai em 5 × o nível.
    r.total = danoDeQueda(c, r.total);
    this.say('condicao', `${c.name} deixa de ${dados === '1d6' ? 'voar' : 'levitar'} e cai: ${r.total} concussão.`, `${dados}[${r.rolls.join('+')}]`);
    this.applyDamage(c, r.total, 'concussão', null);
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

  /**
   * As zonas cujo LADO QUENTE pega esta casa — e que NÃO a pegam pela muralha em si, senão a
   * criatura rolaria duas vezes pela mesma zona. Fica à parte de `zonasEm` porque a faixa quente
   * não é a muralha: não é terreno difícil, não barra projétil, não se desenha como parede, e só
   * cobra de quem TERMINA o turno nela.
   */
  zonasNoCalor(pos) {
    if (!this.zonas.length) return [];
    const f = pos.f ?? 1;
    return this.zonas.filter((z) => {
      if (!z.calor) return false;
      let quente = false;
      for (let dy = 0; dy < f; dy++) {
        for (let dx = 0; dx < f; dx++) {
          if (z.casas.has(key(pos.x + dx, pos.y + dy))) return false;
          if (z.calor.has(key(pos.x + dx, pos.y + dy))) quente = true;
        }
      }
      return quente;
    });
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
    this.atualizarTerrenoDasZonas();
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
    // ANDAR NA TEIA (as aranhas): a teia não as prende
    if (zona.spellId === 'teia' && c.traits?.includes('webWalker')) return true;
    // Guardião da Fé: "qualquer criatura HOSTIL A VOCÊ". O aliado passa por ela
    // sem nem rolar — e sem gastar o orçamento dela.
    if (zona.soHostis) {
      const dono = this.combatants.find((x) => x.id === zona.dono);
      if (dono && c.side === dono.side) return true;
    }
    if (zona.cura) return this.curaDaZona(c, zona, porque);
    if (zona.dano) return this.danoDaZona(c, zona, porque);
    if (!zona.condition) return true;
    if (c.dead || hasCondition(c, 'inconsciente') || hasCondition(c, zona.condition)) return true;
    // Quem é IMUNE à condição da zona passa reto: nem rola, nem para, nem lê
    // que "ficou". Sem isto, a Liberdade de Movimento barrava o contido da Teia
    // mas o herói perdia o resto do passo e o log afirmava que ele tinha ficado
    // preso — uma mensagem falsa e um movimento comido.
    if (this.imuneACondicao(c, zona.condition)) return true;
    // Nuvem Fétida: quem é imune a veneno passa direto.
    if (zona.imuneSe && (c.immune?.includes(zona.imuneSe) || this.imuneACondicao(c, 'envenenado'))) return true;
    const save = this.resistencia(c, zona.save, zona.cd, { contra: { magico: true, planta: PLANTAS_QUE_PRENDEM.includes(zona.spellId) || zona.spellId === 'plantasConstritoras', condicao: zona.condition ?? null } });
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

  /** Zona que CURA (o Espírito Curador): o aliado de quem a conjurou, uma vez por turno, até os usos acabarem. */
  curaDaZona(c, zona) {
    const dono = this.combatants.find((x) => x.id === zona.dono);
    if (c.dead || !dono || c.side !== dono.side || c.hp >= maxHpEfetivo(c)) return true;
    c.aurasNoTurno ??= [];
    const marca = `z${zona.id}`;
    if (c.aurasNoTurno.includes(marca) || zona.cura.usos <= 0) return true;
    c.aurasNoTurno.push(marca);
    zona.cura.usos -= 1;
    const r = damageRoll(this.rng, zona.cura.dados);
    const pv = this.heal(c, r.total, dono);
    this.say('cura', `${zona.nome} cura ${c.name}: ${pv} PV.`, `${zona.cura.dados}[${r.rolls.join('+')}] · restam ${zona.cura.usos}`);
    if (zona.cura.usos <= 0) {
      this.say('magia', `${zona.nome} se desfaz.`);
      this.desfazerZona(zona);
    }
    return true;
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
      const save = this.resistencia(c, zona.dano.save, zona.cd, { contra: { magico: true, planta: PLANTAS_QUE_PRENDEM.includes(zona.spellId), tipoDano: zona.dano.tipo ?? null } });
      const rr = this.explicarResistencia(c, zona.dano.save, zona.cd, save, { contra: zona.nome, seSucesso: zona.dano.metade ? 'metade do dano' : 'nenhum dano' });
      total = danoPorResistencia(c, zona.dano.save, !!zona.dano.metade, save.success, total, conditionEffects(c).incapacitated);
      conta = `${rr.conta} · ${conta}`;
    }
    this.say('magia', `${c.name} ${porque} ${zona.em} ${zona.nome} e sofre ${total}${zona.dano.tipo ? ` de ${zona.dano.tipo}` : ''}.`, conta);
    this.applyDamage(c, total, zona.dano.tipo, dono ?? null, { magico: true });
    // RADIÂNCIA NAUSEANTE: quem falha ganha também um nível de exaustão.
    if (zona.dano.exaustao && total > 0 && !c.dead) {
      mudarExaustao(c, zona.dano.exaustao);
      this.say('condicao', `${c.name} fica mais exausto (${zona.nome}).`);
    }
    // Guardião da Fé: contado o dano, se o orçamento acabou, ele desaparece. O
    // livro conta o dano CAUSADO, então vale o que sobrou de resistência e
    // imunidade (`ultimoDano`), não o número nominal.
    if (zona.orcamento) {
      zona.gasto = (zona.gasto ?? 0) + Math.max(0, this.ultimoDano ?? total);
      if (zona.gasto >= zona.orcamento) {
        this.say('magia', `${zona.nome} causou ${zona.gasto} de dano e se desfaz.`);
        this.desfazerZona(zona);
      }
    }
    return true;
  }

  /** O dano de fim de turno de uma zona (Fome de Hadar): CD de DES ou o dano inteiro. */
  danoDeFimDaZona(c, zona) {
    const dono = this.combatants.find((x) => x.id === zona.dono);
    const r = damageRoll(this.rng, zona.fimDano.dados);
    let total = r.total;
    let conta = `${zona.fimDano.dados}[${r.rolls.join('+')}]`;
    if (zona.fimDano.save) {
      const save = this.resistencia(c, zona.fimDano.save, zona.cd, { contra: { magico: true, planta: PLANTAS_QUE_PRENDEM.includes(zona.spellId), tipoDano: zona.fimDano.tipo ?? null } });
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

  /**
   * O CONTRAGOLPE DO OBELISCO (a Ânima de Ilvaash, o Obelisco). O obelisco remendado não tem PV: todo dano que ele levaria
   * vai para o fanático ligado a ele (`ligadoAoObelisco`) que está MAIS PERTO dele, onde quer que esteja, vezes
   * `contragolpe.fator` (o dobro se o grupo pegou um fragmento no capítulo 6). A partir do primeiro, os fanáticos sabem
   * (`temeOObelisco`) e brigam para não ser o mais perto (`ai.js pararPertoDoObelisco`). Empate na distância: o mais
   * ferido, que é o que o fio da costura puxa primeiro.
   */
  contragolpeDoObelisco(ob, amount, type, source) {
    const ligados = this.combatants.filter((c) => c.ligadoAoObelisco === ob.id && !c.dead && c.pos);
    if (!ligados.length) { this.say('dano', `O golpe se perde nas costuras de ${ob.name}: não há mais ninguém ligado a ele.`); return; }
    const d = (c) => distanceFt(c.pos, ob.pos);
    ligados.sort((a, b) => d(a) - d(b) || a.hp - b.hp);
    const alvo = ligados[0];
    const fator = ob.contragolpe.fator ?? 1;
    const total = amount * fator;
    this.say('dano', `O golpe some numa costura verde de ${ob.name} e explode em ${alvo.name}, o mais perto: ${total}${fator > 1 ? ' (o dobro)' : ''}.`);
    for (const c of ligados) c.temeOObelisco = ob.id;
    this.onEvent({ type: 'contragolpe', obelisco: ob, alvo, dano: total });
    this.applyDamage(alvo, total, type, source, { transferido: true });
  }

  /** Espíritos Guardiões: teste e dano, uma vez por turno da criatura. */
  golpeDaAura(aura, c, porque) {
    c.aurasNoTurno ??= [];
    if (c.aurasNoTurno.includes(aura.id) || c.dead) return;
    c.aurasNoTurno.push(aura.id);
    const save = this.resistencia(c, aura.save, aura.cd, { contra: { magico: true, condicao: aura.condition ?? null } });
    const dmg = damageRoll(this.rng, aura.dano);
    const amount = danoPorResistencia(c, aura.save, !!aura.halfOnSave, save.success, dmg.total, conditionEffects(c).incapacitated);
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
    if (this.zonas.length !== antes) this.atualizarTerrenoDasZonas();
  }

  /** Imunidade a condição do bloco (`contido` aparece também como 'imobilizado'). */
  imuneACondicao(alvo, id, fonte = null) {
    if (this.imunePorCaracteristica(alvo, id, fonte)) return true;
    // CORPO FÚNGICO (Esporos, 14º)
    if (Sub.imuneDoCorpoFungico(alvo, id)) return true;
    // FORTALECIDO pelo empíreo: nem encanto nem medo
    if ((id === 'enfeiticado' || id === 'amedrontado') && hasCondition(alvo, 'reforcado')) return true;
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
    const APELIDOS = { dominado: 'enfeitiçado', sugerido: 'enfeitiçado', hipnotizado: 'enfeitiçado', enfeiticado: 'enfeitiçado', coroaDaLoucura: 'enfeitiçado', contido: 'imobilizado', presoPorVinhas: 'imobilizado' };
    // o item que o herói usa (o amuleto contra veneno: nada de envenenado)
    const doItem = alvo.doItem?.imuneCondicao ?? [];
    return porMagia || lista.includes(id) || lista.includes(APELIDOS[id]) || doItem.includes(id) || doItem.includes(APELIDOS[id]);
  }

  /**
   * Os paladinos do lado de `alvo` cuja aura `aura` alcança `alvo`: vivos, conscientes, e a até `raioDeAura` pés (10; 30 no
   * 18º; o próprio paladino conta). A aura não pede linha de visão: é uma emanação.
   */
  paladinosDaAura(alvo, aura) {
    return this.combatants.filter((p) => p.side === alvo.side && !p.dead && p.hp > 0 && p.features?.includes(aura)
      && !conditionEffects(p).incapacitated && p.raioDeAura && (p === alvo || distanceFt(p.pos, alvo.pos) <= p.raioDeAura));
  }

  /** A Aura de Proteção que vale para `alvo`: a de maior bônus (CAR, mínimo +1), ou null. */
  auraDeProtecao(alvo) {
    let melhor = null;
    for (const p of this.paladinosDaAura(alvo, 'auraOfProtection')) {
      const valor = Math.max(1, abilityMod(p.abilities.cha));
      if (!melhor || valor > melhor.valor) melhor = { paladino: p, valor };
    }
    return melhor;
  }

  /**
   * Imunidades que vêm de uma CARACTERÍSTICA, e não do bloco de criatura:
   *   Fúria Irracional (Berserker, 6º)    em fúria, nem enfeitiçado nem amedrontado;
   *   Pureza do Corpo (monge, 10º)        imune a veneno;
   *   Bênção da Natureza (druida da Terra, 10º)  imune a veneno; e enfeitiçado/amedrontado por elementais e fadas;
   *   Pureza de Espírito (Devoção, 15º)   enfeitiçado/amedrontado pelos seis tipos da Proteção contra o Bem e o Mal;
   *   Aura de Coragem (10º) e Aura de Devoção (7º da Devoção)  o paladino e os aliados do raio, contra medo e encanto.
   * A DOENÇA é outra porta (`doencas.js contrairDoenca`, `imuneADoenca`): é lá que a Saúde Divina, a Pureza do Corpo e a
   * Bênção da Natureza a barram.
   */
  imunePorCaracteristica(alvo, id, fonte = null) {
    const medo = id === 'amedrontado';
    const encanto = CONDICOES_DE_ENCANTO.includes(id);
    const veneno = id === 'envenenado';
    const f = alvo.features ?? [];
    if (f.length) {
      if (f.includes('mindlessRage') && hasCondition(alvo, 'furia') && (medo || encanto)) return true;
      if (f.includes('purityOfBody') && veneno) return true;
      if (f.includes('beguilingDefenses') && encanto) return true;
      if (f.includes('naturesWard') && (veneno || ((medo || encanto) && ['elemental', 'fada'].includes(fonte?.tipo)))) return true;
      if (f.includes('purityOfSpirit') && (medo || encanto) && TIPOS_DA_PUREZA.includes(fonte?.tipo)) return true;
    }
    if (medo && this.paladinosDaAura(alvo, 'auraOfCourage').length) return true;
    if (encanto && this.paladinosDaAura(alvo, 'auraOfDevotion').length) return true;
    return false;
  }

  /**
   * Quem está caído rasteja: SRD, +1 pé por pé andado. Soma com o terreno difícil (+1 pé por pé) em vez de multiplicar: rastejar
   * num terreno difícil custa 3 pés por pé, e não 4 (`Battlefield.costOf` cobra os +5 por casa).
   */
  rastejando(actor) {
    return hasCondition(actor, 'caido');
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
    // ATLETA (talento): levantar custa 1,5 m, e não a metade do deslocamento.
    // OSCILAR EMBRIAGADO (Mestre Bêbado): também 1,5 m.
    const custo = temTalento(actor, 'atleta') || Sub.levantaComSalto(actor) ? 5 : Math.ceil(this.speedOf(actor) / 2);
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
    // a ARMA NATURAL (a mordida do povo-lagarto, as garras do tabaxi) também: é o corpo
    return this.armasNaMao(c).includes(weaponId) || !!WEAPONS[weaponId]?.props?.includes('desarmado') || !!WEAPONS[weaponId]?.natural;
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
    if (conditionEffects(actor).semAtaqueNemMagia) return { ok: false, why: 'em Forma Gasosa não se pega arma' };
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
    // TRABALHO DE ANDAR DE CIMA (ladrão, 3º): o salto com corrida ganha o modificador de Destreza em pés.
    const andarDeCima = correu && actor.features?.includes('secondStoryWork') ? Math.max(0, abilityMod(actor.abilities?.dex ?? 10)) : 0;
    return Math.min(((correu ? forca : Math.floor(forca / 2)) + andarDeCima) * mult, actor.movementLeftFt ?? 0);
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
    const cerca = actor.corrente ?? actor.vinculo;
    const podePousar = (x, y) => (!cerca || distanceFt(cerca, { x, y }) <= cerca.raioFt)
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
      (e) => !e.reactionUsed && getCondition(actor, 'manobrado')?.data?.de !== e.id && !conditionEffects(e).incapacitated
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
      const r = this.testeDeAtributo(actor, 'str', skillBonus(actor, 'atletismo'), 'Atletismo', { pericia: 'atletismo' });
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
      const r = this.testeDeAtributo(actor, 'dex', skillBonus(actor, 'acrobacia'), 'Acrobacia', { pericia: 'acrobacia' });
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
    // DE DENTRO DO CUBO GELATINOSO: a ação e Força CD 12; saindo, na casa livre mais perto dele
    const engolfado = getCondition(actor, 'engolido');
    if (engolfado?.data?.escape != null) {
      if (actor.actionUsed) return { ok: false, why: 'a ação deste turno já foi usada' };
      actor.actionUsed = true;
      const cd = engolfado.data.escape;
      const r = this.testeDeAtributo(actor, 'str', skillBonus(actor, 'atletismo'), 'Atletismo', { pericia: 'atletismo' });
      const dono = this.combatants.find((c) => c.id === engolfado.source);
      if (r.total >= cd && dono) {
        removeCondition(actor, 'engolido');
        const casa = this.casaLivreMaisProxima({ x: dono.pos.x, y: dono.pos.y, f: actor.pos.f ?? 1 }) ?? dono.pos;
        actor.pos = { ...actor.pos, x: casa.x, y: casa.y };
        this.say('acao', `${actor.name} rasga caminho para fora de ${dono.name}.`, `${r.conta} vs CD ${cd}`);
      } else this.say('acao', `${actor.name} se debate dentro de ${dono?.name ?? 'quem o engoliu'} e não sai.`, `${r.conta} vs CD ${cd}`);
      this.afterAction(actor);
      return { ok: true };
    }
    const preso = getCondition(actor, 'agarrado') ?? getCondition(actor, 'contido') ?? getCondition(actor, 'presoPorVinhas');
    if (!preso) return { ok: false, why: 'não está preso' };
    if (conditionEffects(actor).incapacitated) return { ok: false, why: 'incapacitado' };
    // LIBERDADE DE MOVIMENTO: o livro deixa gastar 1,5 m de deslocamento para
    // sair de prisão, sem teste e sem a ação. Vem antes das guardas da AÇÃO,
    // senão a saída de graça era recusada por uma ação que ela não gasta —
    // medido, com a ação já usada ela respondia "a ação deste turno já foi
    // usada".
    if (conditionEffects(actor).soltaDoAgarrao) {
      removeCondition(actor, preso.id);
      actor.movementLeftFt = Math.max(0, (actor.movementLeftFt ?? 0) - 5);
      this.say('acao', `${actor.name} escorrega da prisão sem esforço: a Liberdade de Movimento não deixa nada segurá-lo.`);
      if (preso.data?.vinhas) this.soltouDaConcentracao(actor, preso.id);
      return { ok: true };
    }
    if (actor.actionUsed) return { ok: false, why: 'a ação deste turno já foi usada' };
    if (actor.acaoLimitada) return { ok: false, why: 'a ação da Velocidade não serve para escapar' };
    actor.actionUsed = true;
    // O agarrão do HERÓI é uma DISPUTA (o livro): o Atletismo de quem segura, rolado agora, é a CD.
    const quemSegura = preso.data?.disputa ? this.combatants.find((x) => x.id === preso.source) : null;
    const cd = quemSegura
      ? this.testeDeAtributo(quemSegura, 'str', skillBonus(quemSegura, 'atletismo'), 'Atletismo', { pericia: 'atletismo' }).total
      : preso.data?.escape ?? preso.data?.dc ?? 10;
    const atl = skillBonus(actor, 'atletismo');
    const acr = skillBonus(actor, 'acrobacia');
    // Teia e Emaranhar: o livro pede Força, então só Atletismo.
    const soForca = String(preso.source ?? '').startsWith('zona:') || !!preso.data?.soForca;
    const [pericia, bonus] = soForca || atl >= acr ? ['Atletismo', atl] : ['Acrobacia', acr];
    const r = this.testeDeAtributo(actor, pericia === 'Atletismo' ? 'str' : 'dex', bonus, pericia, { pericia: pericia === 'Atletismo' ? 'atletismo' : 'acrobacia' });
    const conta = `${r.conta} vs CD ${cd}`;
    if (r.total >= cd) {
      removeCondition(actor, preso.id);
      // Solto do agarrão do Agarrador, a imobilização dos dois acaba junto.
      if (preso.data?.disputa) {
        if (getCondition(actor, 'contido')?.source === preso.source) removeCondition(actor, 'contido');
        if (quemSegura && getCondition(quemSegura, 'contido')?.data?.imobiliza === actor.id) removeCondition(quemSegura, 'contido');
      }
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
    if (c.attacks) {
      const perto = c.attacks.find((a) => !a.ranged)?.name;
      // Com o arco na mão (o goblin) a cimitarra está embainhada, e trocar de
      // arma é a interação do turno dele, não da reação: sem brecha.
      return c.trocaDeArma && c.armaNaMao !== perto ? undefined : perto;
    }
    const w = WEAPONS[c.equippedWeapon];
    if (w && !w.ranged) return null;
    // Só com o que está na mão (ou os punhos de quem treinou): o arqueiro de
    // arco na mão não aproveita a brecha com a espada embainhada.
    return this.armasNaMao(c).find((id) => !WEAPONS[id].ranged)
      ?? (c.weapons ?? []).find((id) => WEAPONS[id]?.props?.includes('desarmado'));
  }

  opportunityAttack(attacker, target, { weaponId = null } = {}) {
    Sub.gastarReacaoDeOportunidade(this, attacker, target);
    // CONJURADOR DE GUERRA (talento): no lugar do golpe, um truque de uma ação que mire só quem provocou.
    const arma = weaponId ?? this.armaDeOportunidade(attacker);
    const magia = this.magiaDeOportunidade(attacker, target);
    if (magia && (arma === undefined || this.truqueRendeMais(attacker, magia, arma))) {
      this.say('reacao', `${attacker.name} aproveita a brecha com ${getSpell(magia).name} (Conjurador de Guerra).`);
      this.conjurarDeReacao(attacker, magia, target);
      return;
    }
    this.say('reacao', `${attacker.name} aproveita a brecha (ataque de oportunidade).`);
    // ESCAPAR DA HORDA (Caçador, 7º): os ataques de oportunidade contra ele têm desvantagem.
    const r = this.resolveAttack(attacker, target, {
      opportunity: true, weaponId: arma,
      disadvantage: target.features?.includes('escapeTheHorde') ? 'Escapar da Horda' : false,
    });
    // SENTINELA (talento): o ataque de oportunidade que acerta zera o deslocamento do alvo até o fim do turno.
    if (r?.hit && (temTalento(attacker, 'sentinela') || Sub.segueNaLinha(attacker)) && !target.dead) {
      target.detidoEm = this.turnoKey();
      target.movementLeftFt = 0;
      this.say('condicao', `${target.name} para onde está: ${attacker.name} não deixa passar (${temTalento(attacker, 'sentinela') ? 'Sentinela' : 'Manter a Linha'}).`);
    }
  }

  /**
   * O TRUQUE DE OPORTUNIDADE do Conjurador de Guerra: um truque de uma ação, com dano, que mire uma criatura só (sem área)
   * e que se possa conjurar nela. O de mais dano médio. Só truque: gastar um espaço numa reação automática seria decidir
   * pelo jogador o que ele guardava.
   */
  magiaDeOportunidade(c, alvo) {
    if (!temTalento(c, 'conjuradorDeGuerra') || !c.spellcasting || !alvo) return null;
    let melhor = null;
    let media = 0;
    for (const id of magiasProntas(c)) {
      const sp = getSpell(id);
      if (!sp || sp.level !== 0 || sp.castTime !== 'action' || sp.shape || !sp.damage || !['attack', 'save', 'raios'].includes(sp.kind)) continue;
      if ((sp.raios ?? 1) > 1) continue;
      const salvo = { acao: c.actionUsed, lim: c.acaoLimitada };
      c.actionUsed = false; c.acaoLimitada = false;
      const ok = this.canCast(c, id, { target: alvo, point: alvo.pos }).ok;
      c.actionUsed = salvo.acao; c.acaoLimitada = salvo.lim;
      if (!ok) continue;
      const m = mediaDeDados(dadosDaMagia(sp, { nivel: c.level ?? 1 }));
      if (m > media) { melhor = id; media = m; }
    }
    return melhor;
  }

  /** O truque rende mais que o golpe da arma? (dano médio do truque contra o da arma) */
  truqueRendeMais(c, magia, arma) {
    const sp = getSpell(magia);
    const truque = mediaDeDados(dadosDaMagia(sp, { nivel: c.level ?? 1 }));
    const golpe = mediaDeDados(this.weaponAttackProfile(c, arma).damage);
    return truque > golpe;
  }

  /** Conjura FORA DA PRÓPRIA AÇÃO (a reação): a ação do turno dele não se gasta nem se devolve. */
  conjurarDeReacao(c, magia, alvo) {
    const salvo = { actionUsed: c.actionUsed, bonusUsed: c.bonusUsed, extraActions: c.extraActions, acaoLimitada: c.acaoLimitada,
      acaoVelozDisponivel: c.acaoVelozDisponivel, magiasNoTurno: c.magiasNoTurno };
    c.actionUsed = false;
    c.acaoLimitada = false;
    c.magiasNoTurno = [];
    try {
      return this.castSpell(c, magia, { target: alvo, point: alvo.pos });
    } finally {
      Object.assign(c, salvo);
    }
  }

  /** As hastes que reagem a quem ENTRA no alcance (o Mestre em Armas de Haste). Marca `hasteNaMao` em quem reage. */
  hastesQueReagem(actor, from, to) {
    return this.enemiesOf(actor).filter((e) => {
      if (!temTalento(e, 'mestreEmArmasDeHaste') || e.reactionUsed || conditionEffects(e).incapacitated) return false;
      const haste = this.armasNaMao(e).find((id) => HASTES_DO_ALCANCE.includes(id));
      if (!haste) return false;
      const alcance = WEAPONS[haste].reachFt ?? 5;
      if (distanceFt(e.pos, from) <= alcance || distanceFt(e.pos, to) > alcance) return false;
      if (this.separadosPelaAltura(e, actor) || !this.vePraReagir(e, actor, to)) return false;
      e.hasteNaMao = haste;
      return true;
    });
  }

  // ---- vantagem / desvantagem ---------------------------------------------

  /** O golpe é corpo a corpo com Força? (a metade boa do Ataque Descuidado) */
  golpeDeForca(attacker, ranged) {
    if (ranged) return false;
    return !attacker.attacks ? weaponAbility(attacker, WEAPONS[attacker.equippedWeapon] ?? {}) === 'str' : true;
  }

  /**
   * ATAQUE DESCUIDADO como INTERRUPTOR. O SRD deixa decidir no primeiro
   * ataque do turno; o jogo guarda a decisão em `descuidadoLigado` (a barra
   * liga e desliga, e o estado vale para os próximos ataques até desligar). O
   * golpe de oportunidade não conta: é fora do turno dele. O ataque à
   * distância também não: ele não ganharia nada e pagaria o preço, então o
   * interruptor espera o primeiro golpe corpo a corpo com Força.
   * Só vale se o herói TEM a característica (2º nível do bárbaro).
   * A decisão é no PRIMEIRO ataque do turno (`atacouNoTurno`): ligar depois
   * que ele já atacou (o 1º golpe do Ataque Extra, o 1º tiro) só vale a
   * partir do próximo turno.
   */
  descuidadoPendente(attacker, { ranged = false, opportunity = false } = {}) {
    return Boolean(attacker.descuidadoLigado && attacker.features?.includes('recklessAttack')
      && !opportunity && !attacker.atacouNoTurno
      && !hasCondition(attacker, 'descuidado') && this.golpeDeForca(attacker, ranged));
  }

  /** O primeiro golpe do turno com o interruptor ligado: a condição nasce aqui (até o começo do próximo turno dele). */
  aplicarDescuidado(attacker, { ranged = false, opportunity = false } = {}) {
    if (!this.descuidadoPendente(attacker, { ranged, opportunity })) return false;
    addCondition(attacker, 'descuidado', { rounds: 1, quando: 'inicio', lado: attacker.side });
    this.say('recurso', `${attacker.name} ataca sem se proteger.`);
    // ABANDONO DESCUIDADO (Furioso de Batalha, 6º)
    Sub.abandonoDescuidado(this, attacker);
    return true;
  }

  attackModifiers(attacker, target, { ranged = false, opportunity = false } = {}) {
    const atkFx = conditionEffects(attacker);
    const tgtFx = conditionEffects(target);
    // `mods` carrega as mesmas três chaves de antes (`advantage`,
    // `disadvantage`, `reasons`, na mesma ordem) mais as listas por lado e o
    // modo já fechado. Quem só lia as três continua lendo as três.
    const mods = modsVazios();

    if (atkFx.attackDisadvantage) fonte(mods, 'desvantagem', 'atacante prejudicado');
    if (hasCondition(attacker, 'gritoDeGuerra')) fonte(mods, 'vantagem', 'grito de guerra');
    if (atkFx.vantagemNosAtaques) {
      const qual = (attacker.conditions ?? []).find((c) => CONDITIONS[c.id]?.vantagemNosAtaques);
      fonte(mods, 'vantagem', (CONDITIONS[qual?.id]?.name ?? 'presciência').toLowerCase());
    }
    // PROTETORES ANCESTRAIS: o marcado ataca com desvantagem quem não é o bárbaro que o marcou.
    const ancestral = Sub.desvantagemDosAncestrais(this, attacker, target);
    if (ancestral) fonte(mods, 'desvantagem', `Protetores Ancestrais de ${ancestral.name}`);
    const marca = Sub.desvantagemDaMarca(this, attacker, target);
    if (marca) fonte(mods, 'desvantagem', `Marca Inabalável de ${marca.name}`);
    const provocado = Sub.desvantagemDoPanache(this, attacker, target);
    if (provocado) fonte(mods, 'desvantagem', `Panache de ${provocado.name}`);
    if (hasCondition(target, 'expostoNaEmboscada')) fonte(mods, 'vantagem', 'Mestre da Emboscada');
    const ajuda = Sub.vantagemDaAjuda(this, attacker, target);
    if (ajuda) fonte(mods, 'vantagem', `ajuda de ${ajuda.name}`);
    // BALUARTE MORTAL (Vigilantes, 20º): vantagem contra quem é de outro plano.
    if (Sub.vantagemDoBaluarte(attacker, target)) fonte(mods, 'vantagem', 'Baluarte Mortal');
    // XANATHAR: o Guardião da Natureza (Força na Fera, Destreza ou Sabedoria na Árvore), a Transformação de Tenser e a
    // Lâmina Sombria na penumbra. Só ataque com arma (os blocos de monstro não as conjuram).
    const armaDoGolpe = !attacker.attacks ? WEAPONS[attacker.armaDoGolpeAgora ?? attacker.equippedWeapon] : null;
    if (armaDoGolpe) {
      const hab = weaponAbility(attacker, armaDoGolpe);
      if (hasCondition(attacker, 'guardiaoFera') && hab === 'str') fonte(mods, 'vantagem', 'Guardião da Natureza (Fera Primal)');
      if (hasCondition(attacker, 'guardiaoArvore') && ['dex', 'wis'].includes(hab)) fonte(mods, 'vantagem', 'Guardião da Natureza (Grande Árvore)');
      if (hasCondition(attacker, 'transformacaoDeTenser')) fonte(mods, 'vantagem', 'Transformação de Tenser');
      if (armaDoGolpe.id === 'laminaSombria' && target.pos && nivelDeLuz(this.field, target.pos.x, target.pos.y, fontesDeLuz(this)) < CLARO) fonte(mods, 'vantagem', 'Lâmina Sombria na penumbra');
    }
    // VENTO PROTETOR: o tiro com arma que passa a 3 m de quem o mantém tem desvantagem.
    if (ranged && armaDoGolpe && this.combatants.some((v) => !v.dead && hasCondition(v, 'ventoProtetor') && v.pos
      && (distanceFt(v.pos, target.pos) <= 10 || distanceFt(v.pos, attacker.pos) <= 10))) fonte(mods, 'desvantagem', 'Vento Protetor');
    // AGARRADOR (talento): vantagem contra quem ele mesmo agarra.
    if (vantagemDoAgarrador(attacker, target)) fonte(mods, 'vantagem', 'agarrado por quem ataca');
    if (hasCondition(target, 'dissiparBemEMal') && ['celestial', 'elemental', 'feérico', 'corruptor', 'morto-vivo'].includes(attacker.tipo)) fonte(mods, 'desvantagem', 'Dissipar o Bem e o Mal');
    // ATAQUE DESCUIDADO: vantagem no corpo a corpo com Força, que é a metade
    // boa do negócio; a metade ruim está na condição. Com o interruptor
    // LIGADO e o primeiro golpe do turno ainda por fazer, a vantagem já vale
    // na previsão e na rolagem (`descuidadoPendente`): a condição, e o preço
    // dela, só nascem no golpe (`aplicarDescuidado`).
    // A vantagem é do turno dele: o golpe de oportunidade (fora do turno) não
    // a tem, mesmo com a condição ainda de pé. Só o preço (ataques CONTRA ele)
    // dura até o começo do próximo turno.
    if ((hasCondition(attacker, 'descuidado') && !opportunity && this.golpeDeForca(attacker, ranged))
      || this.descuidadoPendente(attacker, { ranged, opportunity })) {
      fonte(mods, 'vantagem', 'ataque descuidado');
    }
    // VANTAGEM PELO CHÃO DO ALVO: a cobra do esconderijo ataca com vantagem quem luta na encosta (o Obelisco). A cena
    // diz as casas (`vantagemContraEm`, chaves 'x,y') e o porquê.
    if (target.pos && attacker.vantagemContraEm?.has?.(`${target.pos.x},${target.pos.y}`)) fonte(mods, 'vantagem', attacker.vantagemContraEmMotivo ?? 'terreno');
    // Toque Arrepiante: desvantagem só contra quem conjurou.
    if (getCondition(attacker, 'arrepiado')?.source === target.id) fonte(mods, 'desvantagem', 'toque arrepiante');
    // AS PLACAS DOS TALHUND: os mortos anões da cripta atacam com desvantagem quem as veste.
    if (attacker.mortoDaCripta && target.armor === 'placasDosTalhund') fonte(mods, 'desvantagem', 'as placas funerárias dos Talhund');
    // OLHOS DESVIADOS da medusa ou do brutamonte: quem não o olha ataca às cegas, e ele o ataca como a quem não o vê.
    if (hasCondition(attacker, 'olhosDesviados') && temOlhar(target)) fonte(mods, 'desvantagem', `olhos desviados de ${target.name}`);
    if (hasCondition(target, 'olhosDesviados') && temOlhar(attacker)) fonte(mods, 'vantagem', 'o alvo não o olha');
    if (getCondition(target, 'alvoCerteiro')?.source === attacker.id) fonte(mods, 'vantagem', 'ataque certeiro');
    // ATAQUE FINTADO: a finta dá vantagem no próximo ataque contra quem está a 1,5 m.
    if (attacker.manobraPronta === 'feintingAttack' && distanceFt(attacker.pos, target.pos) <= 5) fonte(mods, 'vantagem', 'ataque fintado');
    // ATAQUE PROVOCADOR: quem foi provocado ataca com desvantagem qualquer um que não seja o provocador.
    const provManobra = getCondition(attacker, 'provocado');
    if (provManobra && provManobra.source !== target.id) fonte(mods, 'desvantagem', 'provocado');
    // ATAQUE DISTRATIVO: o aliado de quem distraiu ataca o distraído com vantagem (uma vez).
    const distraido = getCondition(target, 'distraido');
    if (distraido && distraido.source !== attacker.id && this.combatants.find((x) => x.id === distraido.source)?.side === attacker.side) fonte(mods, 'vantagem', 'ataque distrativo');
    // PASSO DAS SOMBRAS (monge da Sombra): vantagem no primeiro ataque corpo a corpo depois do teleporte.
    if (hasCondition(attacker, 'passoSombrio') && !ranged) fonte(mods, 'vantagem', 'passo das sombras');
    // MARÉS DO CAOS (feiticeiro da Magia Selvagem): vantagem na próxima jogada de ataque.
    if (hasCondition(attacker, 'maresDoCaos')) fonte(mods, 'vantagem', 'marés do caos');
    // PROTEÇÃO ENTRÓPICA: o bruxo ataca com vantagem a criatura que errou o golpe contra ele.
    if (getCondition(attacker, 'desordemEntropica')?.source === target.id) fonte(mods, 'vantagem', 'proteção entrópica');
    // INVOCAR DUPLICIDADE (clérigo da Enganação): vantagem contra quem está colado na cópia (ou, com a Aprimorada, colado no clérigo).
    const dup = getCondition(attacker, 'duplicidade');
    if (dup && distanceFt(attacker.pos, target.pos) <= 5 && ((dup.data?.pos && distanceFt(dup.data.pos, target.pos) <= 5) || attacker.features?.includes('improvedDuplicity'))) {
      fonte(mods, 'vantagem', 'cópia ilusória');
    }
    // VOTO DE INIMIZADE (paladino da Vingança): vantagem contra a criatura jurada.
    if (getCondition(target, 'votoDeInimizade')?.source === attacker.id) fonte(mods, 'vantagem', 'voto de inimizade');
    // Duelo Compelido: só quem o desafiou é alvo sem desvantagem.
    const duelo = getCondition(attacker, 'duelo');
    if (duelo && duelo.source !== target.id) fonte(mods, 'desvantagem', 'duelo compelido');
    // Círculo Mágico: o tipo barrado ataca quem está dentro com desvantagem.
    if (this.circuloProtege(attacker, target)) fonte(mods, 'desvantagem', 'círculo mágico');
    // Invisível: ataca com vantagem e é atacado com desvantagem.
    // Visão verdadeira (o nothic): dentro do alcance dela, invisível não esconde.
    // a VISÃO ÀS CEGAS também: no alcance dela, ser invisível não esconde
    const ve = (quem, alvo) => Math.max(alcanceDaVisaoVerdadeira(quem), quem.senses?.blindsightFt ?? 0) >= distanceFt(quem.pos, alvo.pos)
      || hasCondition(quem, 'veInvisiveis');
    if (hasCondition(attacker, 'invisivel') && !ve(target, attacker)) fonte(mods, 'vantagem', 'atacante invisível');
    // SENSIBILIDADE À LUZ SOLAR (o drow, a aparição): sob o sol, ataca com desvantagem.
    if (sofreComOSol(attacker, this.field)) fonte(mods, 'desvantagem', 'luz do sol');
    // SENSIBILIDADE À LUZ (o capa negra, o grimlock... o livro): em luz plena, de qualquer fonte, desvantagem.
    if (attacker.traits?.includes('sensibilidadeALuz') && attacker.pos
      && nivelDeLuz(this.field, attacker.pos.x, attacker.pos.y, fontesDeLuz(this)) >= CLARO) fonte(mods, 'desvantagem', 'luz plena');
    // FÚRIA FERIDA (o quaggoth): muito ferido, ataca com vantagem.
    if (attacker.furiaFerida && attacker.hp <= attacker.furiaFerida.limiar) fonte(mods, 'vantagem', 'fúria ferida');
    // DESLOCAMENTO (a besta deslocadora): desvantagem contra ela, até ela ser atingida.
    if (target.traits?.includes('deslocamento') && !target.deslocamentoFalhou && !conditionEffects(target).incapacitated) fonte(mods, 'desvantagem', 'deslocamento');
    // FRENESI DE SANGUE (o tubarão, o piranha): vantagem de perto em quem não está com todos os PV.
    if (!ranged && attacker.traits?.includes('frenesiDeSangue') && target.hp < target.maxHp) fonte(mods, 'vantagem', 'frenesi de sangue');
    // IMPRUDENTE (o minotauro, o berserker): golpeia com vantagem e é golpeado com vantagem.
    if (!ranged && attacker.traits?.includes('imprudente')) fonte(mods, 'vantagem', 'imprudente');
    if (target.traits?.includes('imprudente')) fonte(mods, 'vantagem', 'alvo imprudente');
    // Emboscador (o doppelganger): vantagem contra quem ainda está surpreso.
    if (attacker.traits?.includes('emboscador') && this.surpresos?.has(target.id)) fonte(mods, 'vantagem', 'emboscador');
    // ESPÍRITO DA ÁGUIA (Totêmico): em Fúria, ataque de oportunidade contra o bárbaro tem desvantagem.
    if (opportunity && target.features?.includes('eagleSpirit') && hasCondition(target, 'furia')) fonte(mods, 'desvantagem', 'espírito da águia');
    // ESPÍRITO DO LOBO (Totêmico): em Fúria, os aliados do bárbaro têm vantagem no corpo a corpo contra quem está colado nele.
    if (!ranged && this.alliesOf(attacker).some((a) => a !== attacker && !a.dead && a.features?.includes('wolfSpirit') && hasCondition(a, 'furia')
      && distanceFt(a.pos, target.pos) <= 5)) fonte(mods, 'vantagem', 'espírito do lobo');
    // SINTONIA TOTÊMICA (urso, 14º): em Fúria, inimigos a 1,5 m do bárbaro têm desvantagem contra quem NÃO é ele.
    if (this.enemiesOf(attacker).some((b) => b !== target && !b.dead && b.features?.includes('totemicAttunement') && b.features?.includes('bearSpirit')
      && hasCondition(b, 'furia') && distanceFt(b.pos, attacker.pos) <= 5)) fonte(mods, 'desvantagem', 'sintonia do urso');
    // ASSASSINAR (ladino Assassino, 3º): vantagem contra quem ainda não agiu na luta.
    if (attacker.features?.includes('assassinate') && this.round === 1 && (!target.acted || this.surpreendidos?.has(target.id))) fonte(mods, 'vantagem', 'assassinar');
    // SENTIDOS SELVAGENS (patrulheiro, 18º): não ver o alvo não dá desvantagem (até 9 m, para o invisível).
    const sentidosSelvagens = attacker.features?.includes('feralSenses');
    if (hasCondition(target, 'invisivel') && !ve(attacker, target) && !(sentidosSelvagens && distanceFt(attacker.pos, target.pos) <= 30)) {
      fonte(mods, 'desvantagem', 'alvo invisível');
    }
    // Proteção contra o Bem e o Mal: certos tipos atacam o protegido com desvantagem.
    const protecao = (target.conditions ?? []).find((c) => CONDITIONS[c.id]?.contraTipos?.includes(attacker.tipo));
    if (protecao) fonte(mods, 'desvantagem', CONDITIONS[protecao.id].name.toLowerCase());
    // PUREZA DE ESPÍRITO (paladino da Devoção, 15º): sempre sob Proteção contra o Bem e o Mal, sem concentração nem duração.
    if (target.features?.includes('purityOfSpirit') && TIPOS_DA_PUREZA.includes(attacker.tipo)) fonte(mods, 'desvantagem', 'Pureza de Espírito');
    // O aviso de armadura sem treino prometia um preço que ninguém cobrava: o
    // mago podia vestir cota de malha e ir de CA 12 para 16 de graça. Enquanto
    // nada desequipava, a promessa nunca era testada — o inventário novo a
    // testa, então o preço passa a existir.
    if (attacker.armorUntrained) fonte(mods, 'desvantagem', 'armadura sem treino');
    if (tgtFx.attackedAdvantage) {
      // Quem apanha com vantagem só por ter atacado sem cuidado não está
      // "indefeso": o registro diz o porquê verdadeiro.
      const porQue = (target.conditions ?? []).filter((x) => CONDITIONS[x.id]?.attackedAdvantage);
      fonte(mods, 'vantagem', porQue.length && porQue.every((x) => x.id === 'descuidado') ? 'alvo descuidado' : 'alvo indefeso');
    }
    if (tgtFx.attackedDisadvantage) fonte(mods, 'desvantagem', 'alvo esquivando');
    // A SALA EMBAÇADA (Encruzilhada, G12): desvantagem contra quem está dentro, salvo percepção às cegas ou visão verdadeira
    // que alcancem o alvo
    // (Ver o Invisível não vale: a Nublar não esconde ninguém, ela desfoca.)
    if (this.field.embacado?.has(`${target.pos.x},${target.pos.y}`)
      && Math.max(alcanceDaVisaoVerdadeira(attacker), attacker.senses?.blindsightFt ?? 0) < distanceFt(attacker.pos, target.pos)) {
      fonte(mods, 'desvantagem', 'alvo na sala embaçada');
    }

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
    // BLACKRAZOR saciada: vantagem nos ataques com ela na mão
    if (hasCondition(attacker, 'almaDevorada') && (attacker.tempHp ?? 0) > 0 && WEAPONS[attacker.equippedWeapon]?.poder === 'devoraAlma') fonte(mods, 'vantagem', 'alma devorada');
    // a ESPADA DA VINGANÇA sintonizada: desvantagem com qualquer outra arma
    if ((attacker.sintonizados ?? []).some((id) => WEAPONS[id]?.poder === 'vinganca') && WEAPONS[attacker.armaDoGolpeAgora ?? attacker.equippedWeapon]?.poder !== 'vinganca' && !attacker.attacks) {
      fonte(mods, 'desvantagem', 'a espada da vingança não quer outra arma');
    }
    // TÁTICAS DE MATILHA da raça e o RASTEJAR do kobold (`racas-motor.js`)
    { const v = Raca.vantagemDaRaca(this, attacker, target); if (v) fonte(mods, 'vantagem', v); }
    // Ataque à distância com inimigo colado
    // ESPECIALISTA EM BESTA (talento): inimigo colado não atrapalha o tiro.
    if (ranged && !opportunity && !atiraColado(attacker) && this.enemiesOf(attacker).some(
      (e) => this.field.vizinhos(e.pos, attacker.pos) && !conditionEffects(e).incapacitated,
    )) {
      fonte(mods, 'desvantagem', 'inimigo adjacente');
    }
    // Escuridão: quem não vê o alvo erra mais; quem não é visto acerta mais.
    modificadoresDeLuz(this, attacker, target, mods, fonte);
    // ALERTA (talento de 2014): quem ele não vê não ganha vantagem por estar oculto.
    if (naoSePegaOculto(target) && mods.vantagens.some((m) => ['atacante invisível', 'atacante oculto no escuro'].includes(m))) {
      const ocultas = new Set(['atacante invisível', 'atacante oculto no escuro']);
      mods.reasons = mods.reasons.filter((m) => !ocultas.has(m));
      mods.vantagens = mods.vantagens.filter((m) => !ocultas.has(m));
      mods.advantage = mods.vantagens.length > 0;
      fecharModo(mods);
    }
    // ESQUIVO (ladino, 18º): nenhuma jogada de ataque tem vantagem contra quem o tem, a menos que esteja incapacitado.
    if (target.features?.includes('elusive') && mods.advantage && !tgtFx.incapacitated) {
      const caidas = new Set(mods.vantagens);
      mods.reasons = mods.reasons.filter((m) => !caidas.has(m));
      mods.vantagens = [];
      mods.advantage = false;
      fecharModo(mods);
    }
    return mods;
  }

  /** Ataque furtivo do ladino: precisa de vantagem, ou aliado colado sem desvantagem. */
  sneakApplies(attacker, target, weapon, mods) {
    if (!attacker.features?.includes('sneakAttack') || (attacker.sneakUsedThisTurn && !Sub.furtivoDeNovo(attacker, target))) return false;
    // o monstro (o espião) não tem arma do catálogo: o bloco diz "ataque com arma", e qualquer golpe dele serve
    const usable = weapon ? (weapon.ranged || weapon.finesse) : attacker.kind === 'npc';
    if (!usable) return false;
    // Vantagem e desvantagem que se anulam valem NENHUMA das duas: o aliado
    // colado no alvo ainda serve.
    const vant = Boolean(mods.advantage) && !mods.disadvantage;
    const desv = Boolean(mods.disadvantage) && !mods.advantage;
    if (vant) return true;
    if (desv) return false;
    // AUDÁCIA DESENFREADA (Espadachim) e COMBATE PERSPICAZ (Inquisitivo): o Furtivo sem vantagem nem aliado.
    if (Sub.audaciaNoFurtivo(this, attacker, target) || Sub.leuOAlvo(attacker, target)) return true;
    return this.alliesOf(attacker).some((a) => a !== attacker && !a.dead && this.field.vizinhos(a.pos, target.pos) && !conditionEffects(a).incapacitated);
  }

  // ---- ataques -------------------------------------------------------------

  weaponAttackProfile(actor, weaponId) {
    if (actor.attacks) {
      const atk = actor.attacks.find((a) => a.name === weaponId) ?? actor.attacks[0];
      return {
        name: atk.name, bonus: atk.bonus, damage: atk.damage, type: atk.type,
        ranged: !!atk.ranged, reachFt: atk.reachFt ?? 5,
        // O ALCANCE do golpe corpo a corpo é o `reachFt` (a mordida de 3 m do dragão, o tentáculo de 4,5 m): sem isto o
        // limite caía em 5 pés e nenhum monstro acertava de longe — a IA encostava antes, e ninguém via.
        rangeFt: atk.ranged ? (atk.rangeFt ?? 5) : (atk.reachFt ?? 5),
        longRangeFt: atk.ranged ? (atk.longRangeFt ?? atk.rangeFt ?? 5) : (atk.reachFt ?? 5),
        onHit: atk.onHit ?? null, weapon: null, art: atk.art ?? null,
        maxHpDrain: atk.maxHpDrain ?? null, forcaDrain: atk.forcaDrain ?? null,
        danoExtra: atk.danoExtra ?? atk.extraDamage ?? null,
        recarga: recargaMinima(atk.recharge),
        // Bloco de criatura do SRD traz o bônus já somado, sem dizer quanto é
        // atributo e quanto é proficiência. Dizer "bloco da criatura" é honesto;
        // repartir em FOR e proficiência seria invenção nossa.
        bonusPartes: [{ rotulo: 'bloco da criatura', valor: atk.bonus }],
        // Acao por TESTE de resistencia (o Olhar Apodrecedor do nothic): sem
        // jogada de ataque; o alvo testa e, falhando, leva o dano.
        teste: atk.teste ?? null,
        // Drenar Sangue (o stirge): o acerto gruda no alvo.
        gruda: !!atk.gruda,
        // INVESTIDA (a broca infernal, a carga rolante do galeb duhr). Sem esta linha ela morria no perfil do golpe:
        // `resolveAttack` lê `p.investida`, e só o teste a chamava direto. A broca nunca embalou no jogo.
        investida: atk.investida ?? null,
        // CONSOME (o aglomerado encefálico): o golpe que zera o alvo o mata na hora, sem teste de morte.
        consome: !!atk.consome,
        // PUXA (a água viva): o acerto arrasta o alvo 1,5 m na direção de quem o acertou.
        puxa: atk.puxa ?? 0,
        // o AUMENTAR do duergar: o dobro dos dados no golpe de perto
        ...(hasCondition(actor, 'aumentoDuergar') && !atk.ranged ? { damage: Livro.dobrarDados(atk.damage) } : {}),
        // ENGOLE (o verme púrpura, o kraken): o acerto da mordida põe o alvo para dentro
        engole: atk.engole ?? null,
        // o ENXAME (o livro): com metade dos PV ou menos, o golpe é o dado menor
        ...(atk.danoMetade && actor.traits?.includes('enxameDoLivro') && actor.hp <= actor.maxHp / 2 ? { damage: atk.danoMetade } : {}),
        // ARMAS MÁGICAS (o golem de argila): o golpe do bloco conta como mágico contra resistência a arma comum.
        magico: !!atk.magico,
        // o golpe que só vale contra quem está num estado (o Extrair Cérebro: humanoide atordoado e agarrado por quem extrai)
        exige: atk.exige ?? null,
        // o golpe que pesa mais contra quem está num estado (o Contato Terrível da ocular, no amedrontado)
        danoSeCondicao: atk.danoSeCondicao ?? null,
        // o golpe que cura quem bate (o Toque Gélido do alhoon)
        curaNoAcerto: atk.curaNoAcerto ?? 0,
        puxaSeAgarrado: !!atk.puxaSeAgarrado,
        // o golpe que derruba a concentração de quem acerta (a Garra Dissonante da Refração de Ilvaash)
        quebraConcentracao: !!atk.quebraConcentracao,
      };
    }
    // o CUTELO ELEMENTAL arremessado (Caminho do Gigante): a arma da mão, à distância
    const w0 = (weaponId === 'arremessoDoCutelo' ? Sub.armaDoCuteloArremessada(actor) : null) ?? WEAPONS[weaponId ?? actor.equippedWeapon];
    // Shillelagh: a clava ou o bordão usa o atributo de conjuração, rola 1d8
    // e conta como mágico.
    const shillelagh = hasCondition(actor, 'shillelagh') && ['clava', 'bordao'].includes(weaponId ?? actor.equippedWeapon);
    // ARTES MARCIAIS do monge: no punho e na ARMA DE MONGE (simples corpo a
    // corpo, menos as de duas mãos e as pesadas, mais a espada curta) ele
    // rola o dado da classe quando este é maior que o da arma, e usa
    // Destreza se ela for melhor que a Força. É o que faz o monge de 1º
    // nível bater de verdade com as mãos.
    const marcial = this.artesMarciais(actor, weaponId ?? actor.equippedWeapon, w0);
    // BÊNÇÃO DA FORJA na arma: +1 no ataque e no dano, e mágica.
    const w = Sub.punhoAstral(actor, Sub.armaAfiada(actor, Sub.armaAbencoada(actor, shillelagh ? { ...w0, damage: '1d8', raridade: w0.raridade ?? 'magia' }
      : marcial ? { ...w0, damage: marcial.dado, finesse: true } : w0)));
    const ability = shillelagh ? actor.spellcasting.ability : weaponAbility(actor, w);
    const mod = abilityMod(actor.abilities[ability]);
    // Proficiência só soma com arma treinada (a categoria ou a arma em si).
    // Sem lista de treino declarada (NPC antigo), vale o que vinha antes.
    const idDaArma = weaponId ?? actor.equippedWeapon;
    const treinada = !actor.weaponTraining || w.semTreino
      || actor.weaponTraining.includes(w.categoria) || actor.weaponTraining.includes(idDaArma);
    const prof = treinada ? actor.proficiency : 0;
    // Arma mágica (Talon, Lightbringer, Hew): +X no ataque e no dano, e o dano
    // extra no mesmo formato do dos monstros.
    // Arma Mágica e Arma Elemental: +1 no ataque e no dano, e conta como mágica.
    const porMagia = (actor.conditions ?? []).reduce((t, c) => t + (c.data?.bonusArma ?? CONDITIONS[c.id]?.bonusArma ?? 0), 0);
    // A ARMA QUE PEDE SINTONIA e não está sintonizada é só a arma de base: nem o bônus nem o dano extra (o livro). O
    // herói sintoniza ao equipar, se houver vaga (`view/ficha.js trocar`).
    const dormente = Boolean(w.sintonia && actor.side === 'party' && !(actor.sintonizados ?? []).includes(idDaArma));
    // A MUNIÇÃO +1, +2 E +3 (Livro do Mestre): a arma de munição atira a melhor que o herói leva na mochila, com o bônus
    // dela no ataque e no dano; a que acerta deixa de ser mágica (some da mochila, `municaoDoGolpe`)
    const municao = w.ranged && (w.props ?? []).includes('munição') ? melhorMunicao(actor) : null;
    const daMunicao = municao ? (itemDeId(municao)?.dados.bonusAtaque ?? 0) : 0;
    const magia = (dormente ? 0 : (w.bonusAtaque ?? 0)) + porMagia + daMunicao;
    // a CORROSÃO (o pudim negro, o monstro da ferrugem): −1 de dano por acerto neles, de vez
    const noDano = mod + (dormente ? 0 : (w.bonusDano ?? 0)) + porMagia + daMunicao - (actor.armaCorroida?.[idDaArma] ?? 0);
    // ESTILO: ARQUEARIA. +2 em toda jogada de ataque com arma à distância.
    const arquearia = w.ranged && actor.features?.includes('archery') ? 2 : 0;
    // DEVASTAÇÃO DO GIGANTE e COLOSSO DEMIÚRGICO: em Fúria, o golpe de perto alcança mais
    const alcanceMais = w.ranged ? 0 : Sub.alcanceDoGiganteAMais(actor) + Raca.alcanceDaRaca(this, actor);
    return {
      name: w.name,
      bonus: mod + prof + magia + arquearia,
      damage: `${w.damage}${noDano >= 0 ? '+' : ''}${noDano}`,
      danoExtra: dormente ? null : (w.danoExtra ?? null),
      municao,
      // a munição +N faz do tiro um golpe mágico (vence a resistência a arma comum)
      ...(municao ? { magico: true } : {}),
      type: w.type,
      ranged: !!w.ranged,
      reachFt: (w.reachFt ?? 5) + alcanceMais,
      rangeFt: w.ranged ? w.rangeFt : (w.reachFt ?? 5) + alcanceMais,
      longRangeFt: w.ranged ? w.longRangeFt : (w.reachFt ?? 5) + alcanceMais,
      onHit: null,
      weapon: w,
      art: w.art ?? null,
      // Arma de acuidade escolhe o melhor entre FOR e DES: nomear o atributo
      // que ENTROU é a única forma de o jogador ver a escolha acontecendo.
      bonusPartes: [
        { rotulo: ABILITY_NAME[ability], valor: mod },
        ...(prof ? [{ rotulo: 'proficiência', valor: prof }] : []),
        ...(magia ? [{ rotulo: 'arma mágica', valor: magia }] : []),
        ...(arquearia ? [{ rotulo: 'estilo: arquearia', valor: arquearia }] : []),
      ],
    };
  }

  /**
   * Quem está protegendo `target` deste golpe, ou null.
   *
   * O Estilo de Luta: Proteção pede escudo, reação livre, e estar a 1,5 m de
   * quem vai apanhar — e quem se protege não é o próprio protetor.
   */
  protecaoDeAliado(attacker, target) {
    if (!target || target.side === attacker.side) return null;
    return this.alliesOf(target).find(
      (a) => a !== target && a.features?.includes('protection') && a.shield
        && !a.reactionUsed && !a.dead && !conditionEffects(a).incapacitated
        && isAdjacent(a.pos, target.pos) && !hasCondition(a, 'inconsciente'),
    ) ?? null;
  }

  /**
   * O ESTILO DE LUTA que vale PARA ESTE GOLPE, ou null.
   *
   * Duelismo e Armas Grandes dependem do que está nas mãos agora, não só da
   * escolha feita na criação — por isso a conta fica aqui e não na ficha.
   */
  estiloNoGolpe(actor, w) {
    if (!w || w.ranged || !actor.features) return null;
    // As propriedades da arma vêm em `props`, como o livro as escreve.
    const prop = (nome) => (w.props ?? []).includes(nome);
    const duasMaos = prop('duas mãos');
    const outraMao = actor.offhandWeapon && WEAPONS[actor.offhandWeapon];
    // DUELISMO: arma de uma mão e a outra mão sem ARMA (escudo pode).
    if (actor.features.includes('dueling') && !duasMaos && !outraMao) return 'dueling';
    // ARMAS GRANDES: de duas mãos, ou versátil empunhada com as duas — que
    // aqui é a versátil sem nada na outra mão e sem escudo.
    const versatilNasDuas = w.versatil && !outraMao && !actor.shield;
    if (actor.features.includes('greatWeaponFighting') && (duasMaos || versatilNasDuas)) {
      return 'greatWeaponFighting';
    }
    return null;
  }

  canAttack(actor, target, weaponId) {
    if (actor.proibidoAtacar) return { ok: false, why: 'a fera só recebeu uma ordem de apoio' };
    if (actor.proibidoAtacar) return { ok: false, why: 'a fera só recebeu uma ordem de apoio' };
    // Forma Gasosa: a névoa não ataca. Antes da arma na mão, porque névoa não
    // tem mão — perguntar da arma primeiro daria o motivo errado.
    if (conditionEffects(actor).semAtaqueNemMagia) return { ok: false, why: 'em Forma Gasosa não se ataca' };
    // Fora de alcance (Plano Etéreo, dentro da pedra): não há o que acertar.
    if (conditionEffects(target).inalcancavel) {
      const fxT = conditionEffects(target);
      return { ok: false, why: `${target.name} ${fxT.motivoInalcancavel ?? 'está fora de alcance'}` };
    }
    if (!actor.attacks) {
      const id = weaponId ?? actor.equippedWeapon;
      if (!WEAPONS[id]) return { ok: false, why: 'sem arma na mão — saque uma' };
      // o RAIO DE SOL (Alma Solar) não é item: não se empunha
      if (!this.empunha(actor, id) && !WEAPONS[id]?.naoEItem) return { ok: false, why: `${WEAPONS[id].name} não está na mão — saque a arma primeiro` };
      // a arma natural da FORMA DA FERA só existe em Fúria
      if (WEAPONS[id]?.daFuria && !hasCondition(actor, 'furia')) return { ok: false, why: 'a arma natural só existe em Fúria' };
      if (WEAPONS[id]?.exigeArmadura && actor.armor !== WEAPONS[id].exigeArmadura) return { ok: false, why: 'só de armadura de espinhos' };
    }
    const dentroDe = Livro.engolidoPor(actor);
    if (dentroDe && dentroDe !== target.id) return { ok: false, why: 'de dentro de outra criatura, só se golpeia ela' };
    if (dentroDe && Livro.naMasmorra(actor)) return { ok: false, why: 'da masmorra semiplanar não se fere quem engoliu' };
    if (!dentroDe && conditionEffects(actor).inalcancavel) return { ok: false, why: `quem ${conditionEffects(actor).motivoInalcancavel ?? 'está fora de alcance'} não ataca` };
    // a CONCHA ANTIVIDA: quem não é morto-vivo nem constructo não alcança através dela
    if (!['morto-vivo', 'constructo'].includes(actor.tipo) && this.combatants.some((d) => !d.dead && d.side !== actor.side && hasCondition(d, 'conchaAntivida')
      && d.pos && target.pos && distanceFt(d.pos, target.pos) <= 10 && distanceFt(d.pos, actor.pos) > 10)
      && !this.weaponAttackProfile(actor, weaponId).ranged) return { ok: false, why: 'a concha antivida não deixa alcançar' };
    const presa = Livro.armaPresa(actor);
    if (presa && presa === (weaponId ?? actor.equippedWeapon)) return { ok: false, why: 'a arma está grudada no escudo do kuo-toa' };
    const p = this.weaponAttackProfile(actor, weaponId);
    // TROCAR DE ARMA (o goblin): sacar a outra é a interação gratuita do turno,
    // e só há uma. Com ela gasta, só se ataca com a arma que já está na mão.
    if (actor.trocaDeArma && actor.interacaoUsada && actor.armaNaMao && p.name !== actor.armaNaMao) {
      return { ok: false, why: `já trocou de arma neste turno (${actor.armaNaMao} na mão)` };
    }
    // Acao por teste (o Olhar Apodrecedor) mira 'uma criatura que ele possa ver'.
    if (p.teste && hasCondition(actor, 'cego')) return { ok: false, why: 'cego, não vê o alvo' };
    if (p.recarga && actor.recarregando?.[p.name]) return { ok: false, why: `${p.name} ainda está recarregando` };
    // EXTRAIR CÉREBRO (o livro): só contra um humanoide atordoado E agarrado por quem extrai
    // (o do devorador clarividente quer o alvo INCAPACITADO, que é o que o tentáculo dele deixa)
    if (p.exige === 'agarradoAtordoado' || p.exige === 'agarradoIncapacitado') {
      const humanoide = target.kind === 'pc' || /humanoide/.test(target.tipo ?? '');
      const estado = p.exige === 'agarradoAtordoado' ? hasCondition(target, 'atordoado') : conditionEffects(target).incapacitated;
      if (!humanoide || getCondition(target, 'agarrado')?.source !== actor.id || !estado) {
        return { ok: false, why: `${p.name} só vale contra um humanoide ${p.exige === 'agarradoAtordoado' ? 'atordoado' : 'incapacitado'} e agarrado por ${actor.name}` };
      }
    }
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

  /**
   * O DISFARCE de um metamorfo (o Vyerith, doppelganger, de drow): quem monta a
   * cena põe `disfarce: { look, de }` e o look falso no combatente; o primeiro
   * ataque dele, ou a queda, desfaz o disfarce e a figura volta ao look
   * verdadeiro (`disfarce.look`).
   */
  revelarDisfarce(c, quando = '') {
    if (!c?.disfarce) return;
    const { look, de } = c.disfarce;
    c.disfarce = null;
    c.look = look;
    c.lookBase = look;
    this.say('acao', `A pele de ${de ?? c.name} escorre ${quando ? `${quando} ` : ''}— ${c.name} era um doppelganger!`);
    this.onEvent({ type: 'revelou', target: c });
  }

  /**
   * Um ataque com tudo em volta dele: o ataque em si (`resolveAttackBase`) e as respostas das características do Caçador.
   *   QUEBRA-HORDAS (escolha do 3º)   uma vez por turno, ao atacar, faz outro ataque com a mesma arma contra OUTRA criatura a
   *                                   até 1,5 m do alvo (e ao alcance da arma);
   *   MATADOR DE GIGANTES (escolha do 3º)  reação: Grande ou maior, a 1,5 m, acertou ou errou o Caçador: ele ataca de volta.
   * `horda` e `reacao` impedem que as respostas respondam a si mesmas.
   */
  resolveAttack(attacker, target, opts = {}) {
    // DESORIENTAÇÃO (Mentor, 13º): a reação passa o ataque para quem está na frente dele.
    target = Sub.desorientacao(this, attacker, target) ?? target;
    // ENTRE OS MORTOS (Imortal): o morto-vivo que mira o bruxo pode trocar de alvo, ou perder o golpe
    target = Sub.entreOsMortos(this, attacker, target);
    if (!target) return null;
    const r = this.resolveAttackBase(attacker, target, opts);
    // SENTINELA (talento): quem ataca outro ao lado de quem a tem leva um golpe de reação.
    if (r && !attacker.dead) this.sentinelaReage(attacker, target);
    // A finta vale para UM ataque: errando, ela se desfaz (a ação bônus já foi paga).
    if (attacker.manobraPronta === 'feintingAttack') attacker.manobraPronta = null;
    if (opts.horda || opts.reacao || attacker.dead) return r;
    const f = attacker.features ?? [];
    if (f.includes('hordeBreaker') && !attacker.presaNoTurno && !opts.opportunity && !conditionEffects(attacker).incapacitated) {
      const outro = this.enemiesOf(attacker)
        .filter((e) => e !== target && !e.dead && distanceFt(e.pos, target.pos) <= 5 && this.canAttack(attacker, e, opts.weaponId ?? null).ok)
        .sort((a, b) => a.hp - b.hp)[0];
      if (outro) {
        attacker.presaNoTurno = true;
        this.say('recurso', `${attacker.name} aproveita a confusão da horda: outro ataque, agora em ${outro.name} (Quebra-Hordas).`);
        this.resolveAttackBase(attacker, outro, { ...opts, horda: true });
      }
    }
    if (target.features?.includes('giantKiller') && !target.dead && !target.reactionUsed && !conditionEffects(target).incapacitated
      && attacker.side !== target.side && (attacker.pos?.f ?? 1) >= 2 && distanceFt(attacker.pos, target.pos) <= 5) {
      target.reactionUsed = true;
      this.say('reacao', `${target.name} responde ao gigante (Matador de Gigantes).`);
      this.resolveAttackBase(target, attacker, { opportunity: true, weaponId: this.armaDeOportunidade(target), reacao: true });
    }
    return r;
  }

  /**
   * SENTINELA (talento): uma criatura a 1,5 m de quem a tem ataca OUTRO alvo (que não tenha o talento): a reação é um golpe
   * de perto nela. Automática, como as outras reações que só servem para isso.
   */
  sentinelaReage(atacante, alvo) {
    if (this.reagindo || temTalento(alvo, 'sentinela')) return;
    for (const s of this.combatants) {
      if (s.dead || s === alvo || s === atacante || s.side === atacante.side || !temTalento(s, 'sentinela') || s.reactionUsed
        || conditionEffects(s).incapacitated || distanceFt(s.pos, atacante.pos) > 5 || !this.field.contato(s.pos, atacante.pos)) continue;
      const arma = this.armaDeOportunidade(s);
      if (arma === undefined || !this.canAttack(s, atacante, arma).ok) continue;
      this.reagindo = true;
      try {
        s.reactionUsed = true;
        this.say('reacao', `${s.name} não deixa ${atacante.name} atacar ${alvo.name} em paz (Sentinela).`);
        this.resolveAttackBase(s, atacante, { opportunity: true, weaponId: arma, reacao: true });
      } finally {
        this.reagindo = false;
      }
      if (atacante.dead) return;
    }
  }

  /**
   * OPORTUNISTA (monge da Sombra, 17º): quando uma criatura a até 1,5 m dele é ACERTADA por um ataque de outra criatura (não dele), ele usa a
   * reação e faz um ataque corpo a corpo contra ela. Só contra quem é hostil a ele.
   */
  oportunista(atacante, alvo) {
    if (alvo.dead) return;
    for (const m of this.combatants) {
      if (m.dead || m === atacante || m === alvo || !m.features?.includes('opportunist') || m.reactionUsed || m.side === alvo.side
        || conditionEffects(m).incapacitated || distanceFt(m.pos, alvo.pos) > 5) continue;
      const arma = this.armaDeOportunidade(m);
      if (arma === undefined || !this.canAttack(m, alvo, arma).ok) continue;
      m.reactionUsed = true;
      this.say('reacao', `${m.name} aproveita a brecha e golpeia ${alvo.name} (Oportunista).`);
      this.resolveAttackBase(m, alvo, { opportunity: true, weaponId: arma, reacao: true });
    }
  }

  /**
   * RIPOSTA (Mestre de Batalha): quando uma criatura erra um ataque corpo a corpo contra ele, gasta um dado e a reação e a ataca; no acerto soma o dado
   * ao dano. Automática: perguntar a cada erro pararia a luta.
   */
  riposta(atacante, alvo) {
    if (this.reagindo || alvo.dead || atacante.dead || !alvo.features?.includes('riposte') || alvo.reactionUsed || (alvo.resources?.superiorityDice ?? 0) < 1
      || conditionEffects(alvo).incapacitated || atacante.side === alvo.side || distanceFt(alvo.pos, atacante.pos) > 5) return;
    const arma = this.armaDeOportunidade(alvo);
    if (arma === undefined || !this.canAttack(alvo, atacante, arma).ok) return;
    this.reagindo = true;
    try {
      alvo.reactionUsed = true;
      alvo.manobraPronta = 'riposteStrike';
      this.say('reacao', `${alvo.name} revida o golpe que errou (Riposta).`);
      this.resolveAttackBase(alvo, atacante, { opportunity: true, weaponId: arma, reacao: true });
    } finally {
      alvo.manobraPronta = null;
      this.reagindo = false;
    }
  }

  /** FUGA NEBULOSA: o bruxo da Arquifada que apanha reage: reaparece na casa livre mais longe dos inimigos a até 18 m, invisível. */
  fugaNebulosa(c) {
    if (!c.features?.includes('mistyEscapes') || !((c.resources?.mistyEscapes ?? 0) > 0) || c.reactionUsed || conditionEffects(c).incapacitated || c.dead) return;
    const inimigos = this.enemiesOf(c).filter((m) => !m.dead);
    let melhor = null;
    for (let x = c.pos.x - 12; x <= c.pos.x + 12; x += 1) {
      for (let y = c.pos.y - 12; y <= c.pos.y + 12; y += 1) {
        if (!this.field.inside(x, y) || this.field.blocksMove(x, y) || this.at(x, y)) continue;
        if (!this.field.hasLineOfSight(c.pos, { x, y })) continue;
        const dist = Math.min(...inimigos.map((m) => distanceFt({ x, y }, m.pos)), 999);
        if (!melhor || dist > melhor.dist || (dist === melhor.dist && distanceFt(c.pos, { x, y }) < distanceFt(c.pos, melhor))) melhor = { x, y, dist };
      }
    }
    if (!melhor) return;
    c.resources.mistyEscapes -= 1;
    c.reactionUsed = true;
    const de = { ...c.pos };
    c.pos = { x: melhor.x, y: melhor.y, f: c.pos.f ?? 1 };
    addCondition(c, 'invisivel', { rounds: 1, quando: 'inicio', lado: c.side, source: c.id });
    this.say('recurso', `${c.name} some numa névoa e reaparece a ${distanceFt(de, c.pos)} pés dali (Fuga Nebulosa).`);
    this.onEvent({ type: 'teleporte', actor: c, from: de, to: { ...c.pos } });
  }

  /** PROTEÇÃO ENTRÓPICA (bruxo do Grande Antigo, 6º): reação a um ataque contra ele; true se gastou (o ataque sai com desvantagem). */
  guardaEntropica(atacante, alvo) {
    if (!alvo.features?.includes('entropicWard') || !((alvo.resources?.entropicWard ?? 0) > 0) || alvo.reactionUsed || conditionEffects(alvo).incapacitated
      || atacante.side === alvo.side) return false;
    alvo.resources.entropicWard -= 1;
    alvo.reactionUsed = true;
    this.say('recurso', `${alvo.name} entorta o acaso contra ${atacante.name} (Proteção Entrópica).`);
    return true;
  }

  /** DOBRAR A SORTE (feiticeiro da Magia Selvagem, 6º): reação e 2 pontos; 1d4 a mais ou a menos num ataque que muda por pouco. */
  curvarSorte(atacante, alvo, atk, ca) {
    if (atk.fumble || atk.critical) return;
    const ajuda = atacante.side !== alvo.side && (atk.hit ? atk.total - ca <= 4 : ca - atk.total <= 4);
    if (!ajuda) return;
    const quem = this.combatants.find((s) => !s.dead && s.features?.includes('bendLuck') && !s.reactionUsed && (s.resources?.sorceryPoints ?? 0) >= 2
      && !conditionEffects(s).incapacitated && s !== atacante && s.side === (atk.hit ? alvo.side : atacante.side)
      && distanceFt(s.pos, atacante.pos) <= 30 && this.field.hasLineOfSight(s.pos, atacante.pos));
    if (!quem) return;
    const d = this.rng.die(4);
    const novo = atk.hit ? atk.total - d : atk.total + d;
    if (atk.hit ? novo >= ca : novo < ca) return;
    quem.resources.sorceryPoints -= 2;
    quem.reactionUsed = true;
    atk.total = novo;
    atk.hit = !atk.hit;
    this.say('recurso', `${quem.name} dobra a sorte: ${atk.hit ? '+' : '-'}${d} no ataque de ${atacante.name}, que ${atk.hit ? 'acerta' : 'erra'} (Dobrar a Sorte).`);
  }

  /** DOBRAR A SORTE numa resistência de OUTRA criatura: 1d4 a mais (aliado em apuros) ou a menos (inimigo que se safaria por pouco). */
  curvarSorteNaResistencia(quemResiste, r, dc) {
    const ajuda = (s) => (s.side === quemResiste.side ? !r.success && dc - r.total <= 4 : r.success && r.total - dc <= 4);
    const quem = this.combatants.find((s) => !s.dead && s !== quemResiste && s.features?.includes('bendLuck') && !s.reactionUsed
      && (s.resources?.sorceryPoints ?? 0) >= 2 && !conditionEffects(s).incapacitated && ajuda(s)
      && distanceFt(s.pos, quemResiste.pos) <= 30 && this.field.hasLineOfSight(s.pos, quemResiste.pos));
    if (!quem) return;
    const d = this.rng.die(4);
    const aliado = quem.side === quemResiste.side;
    const novo = aliado ? r.total + d : r.total - d;
    if (aliado ? novo < dc : novo >= dc) return;
    quem.resources.sorceryPoints -= 2;
    quem.reactionUsed = true;
    r.total = novo;
    r.success = aliado;
    this.say('recurso', `${quem.name} dobra a sorte: ${aliado ? '+' : '-'}${d} na resistência de ${quemResiste.name}, que ${r.success ? 'passa' : 'falha'} (Dobrar a Sorte).`);
  }

  /**
   * SURTO "tamanho": a categoria de tamanho sobe um degrau por um minuto. Só o campo `size` (as regras de agarrar, derrubar e empurrar,
   * que leem a categoria); a pegada no tabuleiro (`pos.f`) NÃO muda, porque uma criatura que cresce no meio da luta não tem onde caber.
   */
  aumentarTamanho(c) {
    const ordem = ['miúdo', 'pequeno', 'médio', 'grande', 'enorme', 'imenso'];
    const base = `${c.size ?? (/halfling|pequenin|gnom/i.test(`${c.ancestry ?? ''} ${c.raca ?? ''}`) ? 'pequeno' : 'médio')}`.toLowerCase();
    const i = ordem.indexOf(base);
    if (i < 0 || i >= ordem.length - 1 || c.tamanhoOriginal) return false;
    if (!c.tamanhoOriginal) c.tamanhoOriginal = { size: c.size };
    c.size = ordem[i + 1];
    return true;
  }

  /** Devolve o tamanho de antes quando o surto "tamanho" acaba (ou, com `forcar`, no fim do combate). */
  restaurarTamanho(c, forcar = false) {
    if (c.tamanhoDoAumento !== undefined && (forcar || !hasCondition(c, 'aumentoDuergar'))) {
      if (c.tamanhoDoAumento === null) delete c.size; else c.size = c.tamanhoDoAumento;
      delete c.tamanhoDoAumento;
    }
    if (!c.tamanhoOriginal || (!forcar && hasCondition(c, 'tamanhoCaos'))) return;
    if (c.tamanhoOriginal.size === undefined) delete c.size; else c.size = c.tamanhoOriginal.size;
    delete c.tamanhoOriginal;
    removeCondition(c, 'tamanhoCaos');
  }

  /** SURTO DE MAGIA SELVAGEM: depois de uma magia de 1º círculo ou mais; 1 no d20, ou sempre depois das Marés do Caos. */
  surtoDeMagia(actor, { forcar = false } = {}) {
    const mare = !forcar && actor.mareUsada;
    if (!forcar && !mare && this.rng.die(20) !== 1) return;
    if (mare) {
      actor.mareUsada = false;
      if (actor.resourcesMax?.tidesOfChaos) actor.resources.tidesOfChaos = actor.resourcesMax.tidesOfChaos;
    }
    // O surto que se repete não se repete de novo (o livro manda ignorar esse resultado nos turnos seguintes).
    const tabela = forcar ? SURTOS.filter((s) => s.id !== 'repete') : SURTOS;
    let efeito = tabela[this.rng.int(tabela.length)];
    if (actor.features?.includes('controlledChaos')) {
      const outro = tabela[this.rng.int(tabela.length)];
      if (outro.valor > efeito.valor) efeito = outro;
    }
    this.say('recurso', `A magia de ${actor.name} escapa do controle: ${efeito.nome} (Surto de Magia Selvagem).`);
    this.onEvent({ type: 'surtoFx', fx: 'surto-caos', pos: { x: actor.pos.x, y: actor.pos.y, f: actor.pos.f ?? 1 } });
    efeito.aplica(this, actor);
  }

  /** ABAFAR ELEMENTOS: reação de um clérigo da Natureza a até 9 m de quem sofre ácido, frio, fogo, elétrico ou trovejante; o dano cai à metade. */
  abafarElementos(alvo, amount, tipo) {
    if (!['ácido', 'frio', 'fogo', 'elétrico', 'trovejante'].includes(tipo)) return amount;
    const c = this.combatants.find((a) => !a.dead && a.side === alvo.side && a.features?.includes('dampenElements') && !a.reactionUsed
      && !conditionEffects(a).incapacitated && distanceFt(a.pos, alvo.pos) <= 30);
    if (!c) return amount;
    c.reactionUsed = true;
    const metade = Math.floor(amount / 2);
    this.say('recurso', `${c.name} abafa a energia: o dano de ${tipo} em ${alvo.name} cai de ${amount} a ${metade} (Abafar Elementos).`);
    return metade;
  }

  /** CLARÃO DE AVISO: quem o gasta (o alvo, ou um aliado a até 9 m dele com o Clarão Aprimorado), ou null. */
  clarao(atacante, alvo) {
    if (atacante.side === alvo.side) return null;
    const c = this.combatants.find((a) => !a.dead && a.side === alvo.side && a.features?.includes('wardingFlare') && (a.resources?.wardingFlare ?? 0) > 0
      && !a.reactionUsed && !conditionEffects(a).incapacitated && distanceFt(a.pos, atacante.pos) <= 30 && this.field.hasLineOfSight(a.pos, atacante.pos)
      && (a === alvo || a.features.includes('improvedFlare')));
    if (!c || this.imuneACondicao(atacante, 'cego', c)) return null;
    c.resources.wardingFlare -= 1;
    c.reactionUsed = true;
    this.say('recurso', `${c.name} faz brilhar um clarão diante de ${atacante.name} (Clarão de Aviso).`);
    return c;
  }

  /**
   * GOLPE GUIADO (clérigo da Guerra) e BÊNÇÃO DO DEUS DA GUERRA: Canalizar Divindade soma +10 a um ataque que erraria por 10 ou menos.
   * Automático e só quando muda o resultado (um 1 natural continua errando).
   */
  guiarAtaque(atacante, atk, ca) {
    if (atk.hit || atk.fumble || atk.total + 10 < ca) return;
    const tem = (c) => !c.dead && (c.resources?.channelDivinity ?? 0) > 0 && !conditionEffects(c).incapacitated;
    let quem = tem(atacante) && atacante.features?.includes('guidedStrike') ? atacante : null;
    let nome = 'Golpe Guiado';
    if (!quem) {
      quem = this.combatants.find((c) => c !== atacante && c.side === atacante.side && c.features?.includes('warGodsBlessing') && tem(c) && !c.reactionUsed
        && distanceFt(c.pos, atacante.pos) <= 30 && this.field.hasLineOfSight(c.pos, atacante.pos)) ?? null;
      nome = 'Bênção do Deus da Guerra';
      if (quem) quem.reactionUsed = true;
    }
    if (!quem) return;
    quem.resources.channelDivinity -= 1;
    atk.total += 10;
    atk.hit = true;
    this.say('recurso', `${quem.name} abençoa o golpe de ${atacante.name}: +10 no ataque (${nome}).`);
  }

  /** IRA DA TEMPESTADE (clérigo da Tempestade): reação a um golpe corpo a corpo que acerta; o agressor testa Destreza ou leva 2d8. */
  iraDaTempestade(alvo, agressor) {
    if (alvo.reactionUsed || !alvo.features?.includes('wrathOfTheStorm') || !((alvo.resources?.wrathOfTheStorm ?? 0) > 0) || conditionEffects(alvo).incapacitated
      || agressor.side === alvo.side || distanceFt(alvo.pos, agressor.pos) > 5) return;
    alvo.reactionUsed = true;
    alvo.resources.wrathOfTheStorm -= 1;
    const cd = spellSaveDc(alvo);
    const sv = this.resistencia(agressor, 'dex', cd, { contra: { magico: true } });
    this.explicarResistencia(agressor, 'dex', cd, sv, { contra: `Ira da Tempestade de ${alvo.name}`, seSucesso: 'leva só metade' });
    const dmg = this.dadosMaximos(alvo, '2d8', 'elétrico');
    const quanto = sv.success ? Math.floor(dmg / 2) : dmg;
    this.say('recurso', `${alvo.name} responde ao golpe com um trovão: ${quanto} de dano elétrico em ${agressor.name} (Ira da Tempestade).`);
    this.applyDamage(agressor, quanto, 'elétrico', alvo, { magico: true });
  }

  /** Rola `notacao`; se a Ira Destrutiva estiver armada e o tipo for elétrico ou trovejante, vira o máximo. Devolve o total. */
  dadosMaximos(actor, notacao, tipo) {
    const total = damageRoll(this.rng, notacao).total;
    if (!actor.furiaDestrutivaPronta || !['elétrico', 'trovejante'].includes(tipo)) return total;
    actor.furiaDestrutivaPronta = false;
    const m = /^(\d+)d(\d+)([+-]\d+)?$/.exec(notacao);
    const max = m ? Number(m[1]) * Number(m[2]) + Number(m[3] ?? 0) : total;
    if (max > total) this.say('recurso', `${actor.name} canaliza a fúria da tempestade: o dano é o máximo (${max}) (Ira Destrutiva).`);
    return Math.max(total, max);
  }

  /** O dano de uma magia ganha o que o domínio dá: Conjuração Potente (SAB nos truques) e Ira Destrutiva (máximo em elétrico/trovejante). */
  ajustarDanoDeDominio(actor, spell, dmg, notacao) {
    if (!dmg) return;
    // ALMA RADIANTE (Celestial, 6º): + CAR no dano de magia radiante ou de fogo.
    const radiante = Sub.almaRadiante(actor, spell) + Sub.lacoReforcado(this, actor, spell);
    if (radiante) dmg.total += radiante;
    // ADEPTO ELEMENTAL (talento): cada 1 nos dados da magia do elemento dele conta como 2.
    const uns = adeptoNosDados(actor, spell, dmg);
    if (uns) this.say('recurso', `${actor.name}: ${uns === 1 ? 'um 1' : `${uns} uns`} nos dados de ${spell.name} ${uns === 1 ? 'conta' : 'contam'} como 2 (Adepto Elemental).`);
    // SURTO "no máximo": por um minuto as magias de dano do feiticeiro saem com o máximo dos dados.
    if (actor.surtoMaximoAte >= this.round) {
      const mm = /(\d+)d(\d+)([+-]\d+)?/.exec(String(notacao ?? ''));
      if (mm && Number(mm[1]) * Number(mm[2]) + Number(mm[3] ?? 0) > dmg.total) {
        dmg.total = Number(mm[1]) * Number(mm[2]) + Number(mm[3] ?? 0);
        // Todos os dados saem no lado máximo: o Bombardeio de Magia (18º) enxerga isso.
        if (dmg.rolls?.length) dmg.rolls = dmg.rolls.map(() => Number(mm[2]));
      }
    }
    // BOMBARDEIO DE MAGIA (feiticeiro, 18º): uma vez por turno, um dado que sai no máximo é rolado de novo e somado.
    const turnoB = `${this.round}:${this.side}`;
    if (actor.features?.includes('spellBombardment') && actor.bombardeioNoTurno !== turnoB && dmg.rolls?.length) {
      const lados = Number(/\d+d(\d+)/.exec(String(notacao ?? ''))?.[1] ?? 0);
      if (lados && dmg.rolls.some((r) => r === lados)) {
        actor.bombardeioNoTurno = turnoB;
        const extra = this.rng.die(lados);
        dmg.total += extra;
        this.say('recurso', `${actor.name}: um dado de ${spell.name} sai no máximo e rola de novo, +${extra} (Bombardeio de Magia).`);
      }
    }
    if (spell.level === 0 && actor.classe === 'clerigo' && actor.features?.includes('potentSpellcasting')) dmg.total += Math.max(0, abilityMod(actor.abilities.wis));
    if (actor.furiaDestrutivaPronta && ['elétrico', 'trovejante'].includes(spell.damageType)) {
      const m = /(\d+)d(\d+)([+-]\d+)?/.exec(String(notacao ?? ''));
      actor.furiaDestrutivaPronta = false;
      if (m) {
        const max = Number(m[1]) * Number(m[2]) + Number(m[3] ?? 0);
        if (max > dmg.total) { dmg.total = max; this.say('recurso', `${actor.name} canaliza a fúria da tempestade: ${spell.name} causa o dano máximo (Ira Destrutiva).`); }
      }
    }
  }

  /** O ENCANTO INSTINTIVO: devolve o alvo de verdade do ataque (o mesmo, ou a criatura para onde o golpe foi desviado). */
  encantoInstintivo(atacante, alvo, weaponId) {
    // Sem limite de usos: só a reação o limita. Quem PASSA na resistência fica imune a este mago até o descanso longo.
    if (!alvo.features?.includes('instinctiveCharm') || alvo.reactionUsed || (alvo.charmeImunes ?? []).includes(atacante.id)
      || conditionEffects(alvo).incapacitated || atacante.side === alvo.side || distanceFt(atacante.pos, alvo.pos) > 30
      || !this.field.hasLineOfSight(alvo.pos, atacante.pos) || this.imuneACondicao(atacante, 'enfeiticado', alvo)) return alvo;
    // A criatura MAIS PRÓXIMA do atacante (aliada ou não), sem contar o mago nem o próprio atacante.
    const outros = this.combatants.filter((c) => !c.dead && c !== atacante && c !== alvo && this.canAttack(atacante, c, weaponId).ok)
      .sort((a, b) => distanceFt(atacante.pos, a.pos) - distanceFt(atacante.pos, b.pos));
    if (!outros.length) return alvo;
    alvo.reactionUsed = true;
    const cd = spellSaveDc(alvo);
    const sv = this.resistencia(atacante, 'wis', cd, { contra: { magico: true, condicao: 'enfeiticado' } });
    this.explicarResistencia(atacante, 'wis', cd, sv, { contra: `Encanto Instintivo de ${alvo.name}`, seSucesso: 'o golpe segue para o alvo' });
    if (sv.success) {
      (alvo.charmeImunes ??= []).push(atacante.id);
      return alvo;
    }
    this.say('recurso', `${alvo.name} enfeitiça o impulso de ${atacante.name}: o golpe vai contra ${outros[0].name} (Encanto Instintivo).`);
    return outros[0];
  }

  resolveAttackBase(attacker, target, { weaponId = null, opportunity = false, disadvantage = false, maoSecundaria = false, semAljava = false, investidaTalento = false, vantagem = false, curvo = false, forcarAcerto = false } = {}) {
    // Atacar desfaz o disfarce do metamorfo: o golpe já sai da forma verdadeira.
    if (attacker.disfarce) this.revelarDisfarce(attacker, 'no ataque');
    // O chefe pode jogar um capanga na frente antes de a rolagem acontecer.
    target = this.tryRedirect(target);
    // ENCANTO INSTINTIVO (mago de Encantamento, 6º): quem ataca testa Sabedoria ou volta o golpe contra outra criatura. Só se o ataque era possível.
    if (this.canAttack(attacker, target, weaponId).ok) target = this.encantoInstintivo(attacker, target, weaponId);
    const check = this.canAttack(attacker, target, weaponId);
    if (!check.ok) {
      this.say('aviso', `${attacker.name} não consegue atacar: ${check.why}.`);
      return null;
    }
    let p = check.profile;
    // a arma DESTE golpe, para a conta de vantagem (o Guardião da Natureza e a Lâmina Sombria olham a arma, não a da mão)
    attacker.armaDoGolpeAgora = p.weapon?.id ?? null;
    // EU ILUSÓRIO (mago de Ilusão, 10º): uma cópia ilusória toma o golpe, que erra. Reação; volta com descanso curto ou longo.
    if (target.features?.includes('illusorySelf') && (target.resources?.illusorySelf ?? 0) > 0 && !target.reactionUsed && attacker.side !== target.side
      && !conditionEffects(target).incapacitated) {
      target.resources.illusorySelf -= 1;
      target.reactionUsed = true;
      this.quebraInvisibilidade(attacker);
      this.consumirAoAtacar(attacker, target);
      if (!opportunity) attacker.atacouNoTurno = true;
      this.say('recurso', `${attacker.name} golpeia uma cópia ilusória de ${target.name}, que se desfaz: o ataque erra (Eu Ilusório).`);
      this.onEvent({
        type: 'attack', attacker, target, hit: false, ranged: p.ranged, damageType: p.type, weaponName: p.name, art: p.art,
        rolagem: null, faltou: null, errouPorPouco: false, modo: 'normal', anulado: false,
        vantagens: [], desvantagens: [], motivos: ['eu ilusório'],
      });
      return { hit: false, ilusorio: true };
    }
    // A fúria se alimenta de briga: atacar um hostil mantém o bárbaro nela
    // por mais um turno (ver `fimDaFuria`).
    if (hasCondition(attacker, 'furia') && target.side !== attacker.side) attacker.furiaAgiu = true;
    // O golpe de ação bônus do monge só vem DEPOIS de um ataque de monge.
    if (this.artesMarciais(attacker, weaponId ?? attacker.equippedWeapon,
      WEAPONS[weaponId ?? attacker.equippedWeapon])) attacker.atacouDeMonge = true;
    // A figura mostra a arma do golpe: o hobgoblin de espada e escudo pega o
    // arco para atirar e volta à espada no corpo a corpo (`aparencias` do
    // bloco). Aqui, e não na ação de Ataque, para valer também na reação.
    if (attacker.aparencias) {
      attacker.lookBase ??= attacker.look;
      attacker.look = attacker.aparencias[p.name] ?? attacker.lookBase;
    }
    // O goblin troca a arma da mão: a interação gratuita do turno (uma só).
    if (attacker.trocaDeArma && attacker.armaNaMao && attacker.armaNaMao !== p.name) {
      this.say('acao', `${attacker.name} troca ${attacker.armaNaMao} por ${p.name} (interação gratuita).`);
      attacker.interacaoUsada = true;
    }
    if (attacker.trocaDeArma) attacker.armaNaMao = p.name;
    if (getCondition(attacker, 'enfeiticado')?.source === target.id || getCondition(attacker, 'coroaPsionica')?.source === target.id) {
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
      const r = this.resistencia(target, t.save, t.dc, { contra: { magico: !!t.magico, condicao: t.condition ?? null } });
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
    this.aplicarDescuidado(attacker, { ranged: p.ranged, opportunity });
    // FLOREIO DE LÂMINA: a ação de Atacar dá +3 m de deslocamento neste turno.
    Sub.passoDoFloreio(this, attacker, { opportunity });
    // APARO ÁGIL (Kensei): o golpe desarmado com a arma kensei na mão dá +2 de CA.
    Sub.aparoAgil(this, attacker, weaponId ?? attacker.equippedWeapon, { opportunity });
    // o primeiro ataque do turno já foi (o golpe de oportunidade é de outro turno)
    if (!opportunity) attacker.atacouNoTurno = true;
    const mods = this.attackModifiers(attacker, target, { ranged: p.ranged, opportunity });
    // TETO BAIXO (o Obelisco, os túneis de mina da Onda Eco): criatura Média ou maior ataca corpo a corpo com
    // desvantagem ali, a não ser com arma leve. A cena diz as casas (`field.tetoBaixo`, chaves 'x,y').
    if (!p.ranged && attacker.pos && this.field.tetoBaixo?.has?.(`${attacker.pos.x},${attacker.pos.y}`) && categoriaDeTamanho(attacker) >= 2) {
      const props = WEAPONS[weaponId]?.props ?? p.props ?? [];
      if (!props.includes('leve')) fonte(mods, 'desvantagem', 'teto baixo');
    }
    // ESTILO: PROTEÇÃO. Um aliado de escudo ao lado de quem vai apanhar gasta
    // a REAÇÃO para atrapalhar o golpe. É automático de propósito: perguntar
    // a cada ataque inimigo travaria a luta, e ninguém diria não a uma reação
    // que só serve para isso.
    const protetor = this.protecaoDeAliado(attacker, target);
    if (protetor) {
      protetor.reactionUsed = true;
      fonte(mods, 'desvantagem', `proteção de ${protetor.name}`);
      this.say('recurso', `${protetor.name} ergue o escudo na frente de ${target.name}.`);
    }
    // CLARÃO DE AVISO (clérigo da Luz): reação; o atacante ataca com desvantagem. Só se ainda não havia desvantagem.
    if (!mods.desvantagens.length) {
      const lume = this.clarao(attacker, target);
      if (lume) fonte(mods, 'desvantagem', `Clarão de Aviso de ${lume.name}`);
    }
    // PROTEÇÃO ENTRÓPICA (bruxo do Grande Antigo): reação; o atacante ataca com desvantagem e, se errar, dá vantagem ao bruxo.
    const entropica = !mods.desvantagens.length && this.guardaEntropica(attacker, target);
    if (entropica) fonte(mods, 'desvantagem', `Proteção Entrópica de ${target.name}`);
    // ATIRADOR DE ELITE (talento): o alcance longo não dá desvantagem.
    if (check.longRange && !atiradorDeElite(attacker, p)) fonte(mods, 'desvantagem', 'alcance longo');
    if (disadvantage) fonte(mods, 'desvantagem', typeof disadvantage === 'string' ? disadvantage : 'segundo ataque');
    if (vantagem) fonte(mods, 'vantagem', typeof vantagem === 'string' ? vantagem : 'vantagem');
    // GOLPE RÁPIDO (Samurai, 15º): troca a vantagem deste ataque por um ataque a mais.
    if (Sub.golpeRapido(this, attacker, mods, { opportunity })) { mods.advantage = false; mods.vantagens = []; fecharModo(mods); }
    // PANACHE: um aliado do espadachim ataca o provocado e quebra a provocação.
    Sub.aliadoQuebraPanache(this, attacker, target);
    // TOTEM DO FALCÃO (Pastor): a reação do druida dá vantagem ao ataque contra quem está na aura.
    const falcao = Sub.olhoDoFalcao(this, attacker, target, mods);
    if (falcao) fonte(mods, 'vantagem', `Totem do Falcão de ${falcao.name}`);
    // RUNA DA TEMPESTADE (Cavaleiro Rúnico): a reação dá vantagem ao ataque de um aliado.
    const runaT = Sub.olhoDaTempestade(this, attacker, mods);
    if (runaT) fonte(mods, 'vantagem', `Runa da Tempestade de ${runaT.name}`);
    // ESQUIVA SOMBRIA (Perseguidor Sombrio, 15º): a reação dá desvantagem ao ataque sem vantagem.
    if (Sub.esquivaSombria(this, target, attacker, mods)) fonte(mods, 'desvantagem', `Esquiva Sombria de ${target.name}`);
    // SORTE DO BÊBADO (Mestre Bêbado, 11º): 2 de ki tiram a desvantagem.
    if (mods.mode === 'desvantagem' && Sub.sorteDoBebado(this, attacker)) { mods.disadvantage = false; mods.desvantagens = []; fecharModo(mods); }

    // ATIRADOR DE ELITE: meia cobertura e três quartos não contam (a total já tira a linha de visão).
    const cover = p.ranged && !atiradorDeElite(attacker, p) ? this.field.coverBetween(attacker.pos, target.pos) : 0;
    // MORTALHA DO CREPÚSCULO (Crepúsculo, 17º): meia cobertura no santuário (não soma com cobertura maior).
    let ac = caEfetiva(target) + Math.max(cover, Sub.coberturaDoCrepusculo(this, target));
    const caPartes = [{ rotulo: `CA de ${target.name}`, valor: caEfetiva(target) }];
    if (cover) caPartes.push({ rotulo: 'cobertura', valor: cover });
    // DEFESA CONTRA MULTIATAQUE (Caçador, 7º): depois de ser acertado por uma criatura, +4 de CA contra os ataques seguintes
    // DELA no mesmo turno.
    const turnoAgora = `${this.round}:${this.side}`;
    if (target.features?.includes('multiattackDefense') && target.multiataqueDe?.id === attacker.id && target.multiataqueDe.turno === turnoAgora) {
      ac += 4;
      caPartes.push({ rotulo: 'Defesa contra Multiataque', valor: 4 });
    }

    let { bonus, partes: bonusPartes } = this.dadosDeAtaque(attacker, p.bonus, p.bonusPartes);
    // GOLPE DE ZÉFIRO: uma vez, no próprio turno e com arma — vantagem, +1d8 de energético no acerto e +9 m de passo.
    const zefir = getCondition(attacker, 'golpeDeZefir');
    const comZefir = Boolean(zefir && !zefir.data?.usado && p.weapon && !opportunity && this.side === attacker.side);
    if (comZefir) {
      zefir.data = { ...(zefir.data ?? {}), usado: true };
      fonte(mods, 'vantagem', 'Golpe de Zéfiro');
      attacker.movementLeftFt = (attacker.movementLeftFt ?? 0) + 30;
    }
    // FLECHAS FLAMEJANTES: cada peça de munição gasta a magia ao ser atirada, acertando ou não.
    const flamejantes = p.ranged && p.weapon ? getCondition(attacker, 'flechasFlamejantes') : null;
    if (flamejantes) {
      flamejantes.data = { ...(flamejantes.data ?? {}), cargas: (flamejantes.data?.cargas ?? 12) - 1 };
      if (flamejantes.data.cargas < 0) { removeCondition(attacker, 'flechasFlamejantes'); }
    }
    // −5 NO ATAQUE, +10 NO DANO (Mestre em Armas Grandes, Atirador de Elite): o jogo aceita quando rende mais.
    const modoAgora = mods.advantage && !mods.disadvantage ? 'vantagem' : mods.disadvantage && !mods.advantage ? 'desvantagem' : 'normal';
    const poderoso = golpePoderoso(attacker, p, bonus, ac, modoAgora);
    if (poderoso) {
      bonus -= 5;
      bonusPartes = [...bonusPartes, { rotulo: p.ranged ? 'Atirador de Elite' : 'Mestre em Armas Grandes', valor: -5 }];
    }
    if (this.imagemDesvia(attacker, target, bonus, mods)) return { hit: false };
    if (Livro.fantasmaDesvia(this, attacker, target, bonus, mods, attackRoll, abilityMod)) return { hit: false };
    // FURTIVO (talento): escondido, o tiro com arma que ERRA não o revela. A decisão fica para depois do dado.
    const furtivoEspera = p.ranged && p.weapon && temTalento(attacker, 'furtivo') && getCondition(attacker, 'invisivel')?.data?.escondido;
    if (!furtivoEspera) this.quebraInvisibilidade(attacker);
    // MÓVEL (talento): quem ele ataca de perto não o pega de oportunidade até o fim do turno, acertando ou não.
    if (!p.ranged && !opportunity && (temTalento(attacker, 'movel') || Sub.temGingado(attacker))) {
      const k = this.turnoKey();
      if (attacker.movelAtacou?.turno !== k) attacker.movelAtacou = { turno: k, ids: [] };
      attacker.movelAtacou.ids.push(target.id);
    }

    // CRÍTICO APRIMORADO / SUPERIOR (Campeão): o d20 que é crítico desce para 19 ou 18, só em ataque com arma.
    mods.critMin = margemDeCritico(attacker);
    // MALDIÇÃO DO LÂMINA MALDITA: crítico com 19 contra o amaldiçoado.
    if (Sub.amaldicoadoPor(target, attacker)) mods.critMin = Math.min(mods.critMin, 19);
    // RESTAURAR O EQUILÍBRIO e TRANSE DA ORDEM (Alma Mecânica); a CANÇÃO DA LÂMINA para no golpe de duas mãos
    Sub.ajustarModsTce4(this, attacker, target, mods);
    Sub.modsDosLivros2(this, attacker, target, mods);
    Sub.golpeQueParaACancao(this, attacker, p.weapon);
    let atk = segundaChanceNoAtaque(this, attacker, target, attackRoll(this.rng, bonus, ac, mods), bonus, ac);
    // MESTRE DUELISTA (Espadachim, 17º): o erro se rola de novo, com vantagem.
    atk = Sub.mestreDuelista(this, attacker, atk, bonus, ac);
    // PRECISÃO INFALÍVEL (Kensei, 17º): o erro com arma de monge, de novo
    atk = Sub.precisaoInfalivel(this, attacker, atk, bonus, ac, !!this.artesMarciais(attacker, weaponId ?? attacker.equippedWeapon, WEAPONS[weaponId ?? attacker.equippedWeapon]));
    // GOLPES TELEGUIADOS (Lâmina da Alma, 9º) e LENDA VIVA (Glória, 20º): o erro que vira acerto
    atk = Sub.golpeTeleguiado(this, attacker, atk, ac, weaponId ?? attacker.equippedWeapon);
    atk = Sub.erroQueALendaAcerta(this, attacker, atk, weaponId);
    // TRANSE DA ORDEM (Alma Mecânica, 14º): 9 ou menos no d20 conta como 10.
    if (Sub.pisoDaOrdem(attacker) && atk.natural < 10) {
      const t = atk.total - atk.natural + 10;
      atk = { ...atk, natural: 10, total: t, fumble: false, hit: t >= ac };
    }
    // REDIRECIONAR ATAQUE: o golpe que vem redirecionado já acertou
    if (forcarAcerto) atk = { ...atk, hit: true, critical: false, fumble: false };
    Sub.gastarAjuda(this, attacker, target);
    if (!atk.hit && !atk.fumble) {
      const f = Sub.favorecidoPelosDeuses(this, attacker, atk.total, ac);
      if (f) atk = { ...atk, total: atk.total + f, hit: atk.total + f >= ac };
    }
    // SALVAR AS APARÊNCIAS (hobgoblin): os aliados à vista viram o erro em acerto
    if (!atk.hit && !atk.fumble) {
      const s = Raca.salvarAsAparencias(this, attacker, ac - atk.total);
      if (s) atk = { ...atk, total: atk.total + s, hit: true };
    }
    if (furtivoEspera && atk.hit) this.quebraInvisibilidade(attacker);
    this.guiarAtaque(attacker, atk, ac);
    this.curvarSorte(attacker, target, atk, ac);
    const inspNoGolpe = getCondition(attacker, 'inspirado');
    this.consumirAoAtacar(attacker, target);
    // a Inspiração que o golpe usou: a Partícula de Potencial, a Inspiração Infalível, a Infecciosa (bardos do Tasha)
    if (inspNoGolpe) Sub.depoisDaInspiracao(this, attacker, inspNoGolpe, { sucesso: atk.hit, alvo: target, noAtaque: true });
    // PASSO DAS SOMBRAS: a vantagem é do primeiro golpe corpo a corpo; um tiro não a gasta.
    if (!p.ranged) removeCondition(attacker, 'passoSombrio');
    // O Ataque Distrativo se gasta no primeiro golpe de um aliado.
    const distr = getCondition(target, 'distraido');
    if (distr && distr.source !== attacker.id) removeCondition(target, 'distraido');
    // INSPIRAÇÃO EM COMBATE (bardo do Valor, 3º): o alvo inspirado soma o dado à CA contra um golpe que o acertaria. Só quando muda algo.
    if (atk.hit && !atk.critical) {
      const insp = getCondition(target, 'inspirado');
      const bardoV = insp ? this.combatants.find((b) => b.id === insp.source) : null;
      if (bardoV?.features?.includes('combatInspiration') && !target.reactionUsed && !conditionEffects(target).incapacitated) {
        const dV = roll(this.rng, insp.data?.dado ?? '1d6');
        if (atk.total < ac + dV.total) {
          atk.hit = false;
          target.reactionUsed = true;
          removeCondition(target, 'inspirado');
          this.say('recurso', `${target.name} gasta a Inspiração e soma ${dV.total} à CA (${ac + dV.total}): o golpe de ${attacker.name} falha (Inspiração em Combate).`);
        }
      }
    }
    // Flecha Relampejante: o próximo ataque à distância vira raio, acertando ou não.
    const flecha = p.ranged ? getCondition(attacker, 'flechaRelampago') : null;
    if (flecha) removeCondition(attacker, 'flechaRelampago');
    // Escudo Arcano: a reação de quem ia ser acertado, se +5 faz errar.
    if (atk.hit && !atk.critical && this.escudoArcano(target, attacker, atk.total, ac)) {
      ac += 5;
      caPartes.push({ rotulo: 'Escudo Arcano', valor: 5 });
      atk.hit = false;
    }
    // APARAR de monstro (o capitão bandido, o cavaleiro, o drow de elite): reação, +2 de CA contra um golpe corpo a corpo
    // que ia acertar, vendo quem ataca.
    // O ESCUDO MÁGICO e a ARMADURA DE GELO dos outros bestiários são o mesmo gesto, com o bônus deles (`apararBonus`) e contra
    // qualquer ataque (`apararTudo`).
    const bonusAparar = target.apararBonus ?? 2;
    if (atk.hit && !atk.critical && (!p.ranged || target.apararTudo) && target.kind === 'npc' && target.traits?.includes('aparar') && !target.reactionUsed
      && !conditionEffects(target).incapacitated && atk.total < ac + bonusAparar && this.field.hasLineOfSight(target.pos, attacker.pos)) {
      target.reactionUsed = true;
      ac += bonusAparar;
      caPartes.push({ rotulo: 'Aparar', valor: bonusAparar });
      atk.hit = false;
      this.say('reacao', `${target.name} apara o golpe de ${attacker.name} (+${bonusAparar} de CA).`);
    }
    // DISTORCER A REALIDADE (o devorador clarividente do Obelisco): acertado por uma jogada de ataque, a reação soma +4 à
    // CA contra ela, e então ele some e reaparece a até 18 m, numa casa livre que vê. Some acertando ou não.
    if (atk.hit && target.traits?.includes('distorcerARealidade') && !target.reactionUsed && !conditionEffects(target).incapacitated) {
      target.reactionUsed = true;
      ac += 4;
      caPartes.push({ rotulo: 'Distorcer a Realidade', valor: 4 });
      if (!atk.critical && atk.total < ac) atk.hit = false;
      const casa = casaLongeDe(this, target, this.enemiesOf(target).filter((e) => !e.dead && e.hp > 0 && e.pos), 60);
      this.say('reacao', `${target.name} entorta a realidade em volta de si (+4 de CA)${atk.hit ? '' : ' e o golpe passa por ele'}${casa ? ', e reaparece longe dali' : ''}.`);
      if (casa) {
        target.pos = { ...target.pos, x: casa.x, y: casa.y };
        // longe, os tentáculos soltam quem seguravam
        this.soltarAgarroesDe(target);
        this.onEvent({ type: 'voltou', target, to: { ...target.pos } });
      }
    }
    // DUELISTA DEFENSIVO (talento): a reação soma a proficiência à CA, com arma de acuidade na mão.
    if (atk.hit) {
      const dd = duelistaDefensivo(this, target, atk, ac, p);
      if (dd) { ac += dd; caPartes.push({ rotulo: 'Duelista Defensivo', valor: dd }); atk.hit = false; }
    }
    if (atk.hit && !atk.critical && this.escudoDoGuardiao(target, attacker, atk.total, ac)) {
      ac += 2;
      caPartes.push({ rotulo: 'Escudo do guardião', valor: 2 });
      atk.hit = false;
    }
    // A CAUDA DA FERA: a reação soma 1d8 à CA contra o golpe de quem está a 3 m.
    if (atk.hit && attacker.side !== target.side) {
      const cauda = Sub.caudaQueDefende(this, target, attacker);
      if (cauda) {
        ac += cauda;
        caPartes.push({ rotulo: 'Cauda da Fera', valor: cauda });
        if (!atk.critical && atk.total < ac) atk.hit = false;
      }
    }
    // MANOBRA DE PROTEÇÃO (Cavaleiro, 7º): +1d8 na CA contra este golpe; se ainda acerta, o alvo resiste ao dano dele.
    if (atk.hit && attacker.side !== target.side) {
      const d8 = Sub.manobraDeProtecao(this, target, attacker);
      if (d8) {
        ac += d8;
        caPartes.push({ rotulo: 'Manobra de Proteção', valor: d8 });
        if (!atk.critical && atk.total < ac) atk.hit = false;
        else target.resisteAoGolpe = true;
      }
    }
    // ARMADURA DE MALDIÇÕES (Lâmina Maldita, 10º) e DEFLEXÃO ARCANA (Magia de Guerra, 2º)
    if (atk.hit && attacker.side !== target.side && Sub.armaduraDeMaldicoes(this, target, attacker)) atk.hit = false;
    // ESCUDO RÚNICO (Cavaleiro Rúnico, 7º): o golpe que acerta um aliado se rola de novo.
    if (atk.hit && attacker.side !== target.side && Sub.escudoRunico(this, target, attacker)) atk = attackRoll(this.rng, bonus, ac, mods);
    // PRESSÁGIO CÓSMICO (Estrelas, 6º): +1d6 no aliado que errou, −1d6 no inimigo que acertou, quando vira o resultado.
    if (!atk.fumble && !(atk.critical && atk.hit)) {
      const aj = Sub.pressagioCosmico(this, attacker, atk.hit ? atk.total - ac + 1 : ac - atk.total, atk.hit);
      if (aj) atk = { ...atk, total: atk.total + aj, hit: atk.total + aj >= ac };
    }
    if (atk.hit && !atk.critical && attacker.side !== target.side && Sub.deflexaoArcana(this, target, atk.total - ac + 1, 2)) {
      ac += 2;
      caPartes.push({ rotulo: 'Deflexão Arcana', valor: 2 });
      atk.hit = false;
    }
    // DEFESA GLORIOSA (Glória, 15º): o Carisma na CA; se o golpe erra, o paladino responde (no ramo do erro, abaixo).
    let gloriosa = null;
    if (atk.hit && !atk.critical && attacker.side !== target.side) {
      gloriosa = Sub.defesaGloriosa(this, target, attacker, atk.total, ac);
      if (gloriosa) {
        ac += gloriosa.bonus;
        caPartes.push({ rotulo: 'Defesa Gloriosa', valor: gloriosa.bonus });
        atk.hit = false;
      }
    }
    if (atk.hit && !atk.critical && this.escudoPsionico(target, attacker, atk.total, ac)) {
      ac += 3;
      caPartes.push({ rotulo: 'Escudo Psiônico', valor: 3 });
      atk.hit = false;
    }
    const tgtFx = conditionEffects(target);
    this.consumirMarcas(target);
    // ASSASSINAR: todo acerto contra um alvo SURPREENDIDO é crítico.
    const assassinando = atk.hit && attacker.features?.includes('assassinate') && this.round === 1 && this.surpreendidos?.has(target.id);
    const autoCrit = (tgtFx.critWithinReach && distanceFt(attacker.pos, target.pos) <= 5) || assassinando;
    let critical = atk.critical || (atk.hit && autoCrit);
    // SENTINELA NA PORTA DA MORTE (Sepultura, 6º): a reação do clérigo desfaz o crítico.
    if (critical && Sub.sentinelaNaPorta(this, target)) critical = false;
    // CORPO FÚNGICO (Esporos, 14º): o crítico vira acerto comum.
    if (critical && Sub.desfazCriticoFungico(target)) critical = false;
    // A ARMADURA ADAMANTINA: o crítico contra quem a veste vira acerto comum
    if (critical && target.doItem?.semCritico) critical = false;
    if (atk.hit && target.features?.includes('multiattackDefense')) target.multiataqueDe = { id: attacker.id, turno: turnoAgora };

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
      if (gloriosa) Sub.contraGlorioso(this, gloriosa.paladino, attacker);
      if (flecha) this.flechaRelampago(attacker, target, flecha, { acertou: false });
      this.onEvent({
        type: 'attack', attacker, target, hit: false,
        ranged: p.ranged, damageType: p.type, weaponName: p.name, art: p.art,
        rolagem, faltou, errouPorPouco: porPouco,
        modo: mods.mode, anulado: mods.anulado,
        vantagens: rolagem.vantagens, desvantagens: rolagem.desvantagens, motivos: rolagem.motivos,
      });
      if (entropica && !target.dead) addCondition(target, 'desordemEntropica', { rounds: 2, source: attacker.id });
      if (!p.ranged) { this.desviarParaOutro(attacker, target, { weaponId }); this.riposta(attacker, target); Livro.escudoPegajoso(this, attacker, target, p); }
      delete target.resisteAoGolpe;
      // REDIRECIONAR ATAQUE (Mestre Bêbado, 6º): o golpe de perto que erra o monge acerta outro colado nele.
      // O golpe ACERTA a outra criatura (o livro não pede nova jogada nem alcance): o dano da arma, nela.
      if (!p.ranged && !forcarAcerto && p.damage) {
        const outro = Sub.redirecionarAtaque(this, target, attacker);
        if (outro) {
          const d = damageRoll(this.rng, p.damage);
          this.say('ataque', `O golpe de ${attacker.name} acerta ${outro.name}: ${d.total} de dano ${p.type}.`, `${p.damage}[${d.rolls.join('+')}]`);
          this.applyDamage(outro, d.total, p.type, attacker, { deArma: true, corpoACorpo: true });
        }
      }
      // DISPARO CURVO (Arqueiro Arcano, 7º): a flecha mágica que erra vira para outro alvo.
      if (!curvo && !opportunity) Sub.disparoCurvo(this, attacker, target, weaponId, p.weapon);
      return { hit: false, faltou, errouPorPouco: porPouco, modo: mods.mode };
    }

    // A flecha vira raio: 4d8 elétrico no lugar do dano da arma.
    if (flecha) p = { ...p, damage: this.dadosDaFlecha(flecha).alvo, type: 'elétrico', danoExtra: null };
    // GUERREIRO PLANAR (Andarilho do Horizonte): o golpe todo vira energético, e soma os dados.
    const planar = Sub.golpePlanar(this, attacker, target);
    if (planar) { p = { ...p, type: 'energético' }; attacker.golpePlanarAgora = planar; }
    // CUTELO ELEMENTAL (Gigante) e DISCÍPULO DRACÔNICO (Dragão Ascendente): o golpe muda de tipo
    const tipoDosLivros2 = Sub.tipoDoCutelo(attacker, weaponId) ?? Sub.tipoDoPunhoDragao(attacker, weaponId);
    if (tipoDosLivros2) p = { ...p, type: tipoDosLivros2 };
    // SURTO SELVAGEM do bárbaro: a arma de perto vira energia.
    if (!p.ranged && Sub.efeitoDoSurto(attacker) === 'armaDeForca') p = { ...p, type: 'energético' };
    let damageNotation = p.damage;
    if (p.danoSeCondicao && hasCondition(target, p.danoSeCondicao.condicao)) damageNotation = p.danoSeCondicao.damage;
    let sneak = null;
    if (this.sneakApplies(attacker, target, p.weapon, mods)) {
      attacker.sneakUsedThisTurn = true;
      attacker.furtivoEm = target.id;
      // OLHO PARA FRAQUEZAS (Inquisitivo, 17º): +3d6 contra quem o Combate Perspicaz leu.
      sneak = damageRoll(this.rng, Sub.dadosDoFurtivo(attacker, target, attacker.sneakAttack), { critical });
    }
    let martial = null;
    if (this.martialApplies(attacker, target)) {
      attacker.martialUsedThisTurn = true;
      martial = damageRoll(this.rng, '2d6', { critical });
    }
    // Ataque Surpresa: na primeira rodada, quem acerta uma criatura que ele
    // surpreendeu soma dados (2d6 o bugbear, 3d6 o doppelganger).
    let surpresa = null;
    const dadosDaSurpresa = attacker.traits?.includes('ataqueSurpresaDoppelganger') ? '3d6'
      : attacker.traits?.includes('ataqueSurpresa') ? '2d6' : null;
    if (dadosDaSurpresa && this.round === 1 && this.surpreendidos?.has(target.id)) {
      surpresa = damageRoll(this.rng, dadosDaSurpresa, { critical });
    }

    // ESTILO DE LUTA no golpe: Armas Grandes rola de novo o 1 e o 2 dos dados
    // da arma; Duelismo soma 2 ao dano. Os dois dependem do que está nas
    // mãos agora, por isso a conta é aqui e não na ficha.
    const estilo = this.estiloNoGolpe(attacker, p.weapon);
    // A MÃO SECUNDÁRIA não soma o atributo no dano — a não ser com o Estilo
    // de Luta: Duas Armas, que existe exatamente para isso.
    if (maoSecundaria && !attacker.features?.includes('twoWeaponFighting')) {
      const mod = abilityMod(attacker.abilities[weaponAbility(attacker, p.weapon ?? {})] ?? 10);
      if (mod > 0) damageNotation = String(damageNotation).replace(/\+\d+$/, '');
    }
    // Ataque sem dano (a teia da aranha só prende): o acerto vale pelo efeito.
    const dmg = damageNotation
      ? ajustarDanoDeArma(this, attacker, p, damageRoll(this.rng, damageNotation, {
        critical, rerolarAte: estilo === 'greatWeaponFighting' ? 2 : 0,
      }))
      : null;
    // Arma que, contra um tipo de criatura, rola o dano no MÁXIMO (Hew, em planta): cada dado vai ao
    // lado maior, e o bônus fixo segue o mesmo.
    if (dmg && p.weapon?.danoMaximoContra && target.tipo === p.weapon.danoMaximoContra && dmg.rolls?.length) {
      const { sides } = parseDice(damageNotation);
      dmg.total += dmg.rolls.reduce((s, v) => s + (sides - v), 0);
      dmg.rolls = dmg.rolls.map(() => sides);
    }
    // Raio do Enfraquecimento: golpe de Força causa metade.
    const deForca = attacker.attacks ? !p.ranged : (p.weapon && weaponAbility(attacker, p.weapon) === 'str');
    // DISPARO DEBILITANTE (Arqueiro Arcano): os ataques com arma do alvo causam metade.
    if (dmg && hasCondition(attacker, 'debilitadoPeloDisparo')) {
      dmg.total = Math.floor(dmg.total / 2);
      this.say('condicao', `${attacker.name} está debilitado pela flecha: o golpe sai pela metade.`);
    }
    if (dmg && deForca && hasCondition(attacker, 'enfraquecido')) {
      dmg.total = Math.floor(dmg.total / 2);
      this.say('condicao', `${attacker.name} está enfraquecido: o golpe sai pela metade.`);
    }
    // FÚRIA: bônus FIXO no dano corpo a corpo com Força. Não é dado, então
    // não dobra no crítico — e é por isso que ele entra como parcela própria
    // em vez de somar no dado da arma.
    // DESTRUIÇÃO DIVINA: os dados de luz que o paladino carregou antes do
    // golpe, só em arma corpo a corpo, e um a mais contra morto-vivo.
    let smite = null;
    if (dmg && !p.ranged && attacker.smitePronto && p.weapon) {
      const circ = attacker.smitePronto;
      const extra = target.tipo === 'morto-vivo' ? 1 : 0;
      smite = damageRoll(this.rng, `${1 + circ + extra}d8`, { critical });
      attacker.smitePronto = null;
      // o GOLPE INSPIRADOR (Glória) vem logo depois da Destruição Divina
      attacker.destruiuEm = this.turnoKey();
    }
    const duelismo = dmg && estilo === 'dueling'
      ? { notation: '+2', rolls: [], mod: 2, total: 2, critical: false } : null;
    let furia = null;
    if (dmg && deForca && (!p.ranged || Sub.furiaNoArremesso(attacker, weaponId)) && hasCondition(attacker, 'furia') && attacker.danoDeFuria) {
      furia = { notation: `+${attacker.danoDeFuria}`, rolls: [], mod: attacker.danoDeFuria, total: attacker.danoDeFuria, critical: false };
    }
    // Aumentar/Reduzir: +1d4 ou −1d4 no dano de arma.
    const tamanho = dmg ? this.ajusteDeTamanho(attacker, dmg, critical) : null;
    // ATAQUES SELVAGENS (meio-orc) e CRÍTICO BRUTAL (bárbaro): num crítico corpo a corpo, dados da ARMA a mais — só o
    // dado da arma, sem o modificador, e não dobram (já são o "a mais").
    let critExtra = null;
    if (critical && dmg && !p.ranged) {
      const n = dadosExtraDeCritico(attacker);
      const { sides } = parseDice(damageNotation);
      if (n && sides) critExtra = damageRoll(this.rng, `${n}d${sides}`);
    }
    // O +10 do −5 aceito e o +5 da INVESTIDA (talentos): fixos, não dobram no crítico.
    const poder = dmg && poderoso ? { notation: '+10', rolls: [], mod: 10, total: 10, critical: false } : null;
    const zefirDano = dmg && comZefir ? damageRoll(this.rng, '1d8', { critical }) : null;
    const carga = dmg && investidaTalento && !p.ranged ? { notation: '+5', rolls: [], mod: 5, total: 5, critical: false } : null;
    const totalBase = (dmg?.total ?? 0) + (critExtra?.total ?? 0) + (tamanho?.total ?? 0) + (sneak?.total ?? 0) + (martial?.total ?? 0)
      + (surpresa?.total ?? 0) + (furia?.total ?? 0) + (duelismo?.total ?? 0) + (smite?.total ?? 0) + (poder?.total ?? 0) + (carga?.total ?? 0) + (zefirDano?.total ?? 0);
    // GOLPE MORTAL (ladino Assassino, 17º): acertar um alvo SURPREENDIDO na 1ª rodada dobra o dano se ele falhar em CON (CD 8 + DES + proficiência).
    let golpeMortal = null;
    if (atk.hit && totalBase > 0 && attacker.features?.includes('deathStrike') && this.round === 1 && this.surpreendidos?.has(target.id)) {
      const cdM = 8 + abilityMod(attacker.abilities?.dex ?? 10) + proficiencyBonus(attacker.level ?? 1);
      const svM = this.resistencia(target, 'con', cdM);
      this.explicarResistencia(target, 'con', cdM, svM, { contra: `Golpe Mortal de ${attacker.name}`, seSucesso: 'o dano não dobra' });
      if (!svM.success) golpeMortal = { notation: `+${totalBase}`, rolls: [], mod: totalBase, total: totalBase, critical: false };
    }
    const total = totalBase + (golpeMortal?.total ?? 0);

    // Cada origem do dano vira uma parcela própria. Um "19 de dano" não deixa
    // ver que 12 daquilo foi o ataque furtivo — e é justamente essa parcela que
    // o ladino está manobrando o turno inteiro para conseguir.
    const danoPartes = dmg ? [parcelaDeDano('dano', dmg)] : [];
    if (tamanho) danoPartes.push(tamanho);
    if (critExtra) danoPartes.push(parcelaDeDano('dado extra do crítico', critExtra));
    if (smite) danoPartes.push(parcelaDeDano('destruição divina', smite));
    if (duelismo) danoPartes.push(parcelaDeDano('estilo: duelismo', duelismo));
    if (poder) danoPartes.push(parcelaDeDano(p.ranged ? 'Atirador de Elite' : 'Mestre em Armas Grandes', poder));
    if (carga) danoPartes.push(parcelaDeDano('Investida', carga));
    if (zefirDano) danoPartes.push(parcelaDeDano('Golpe de Zéfiro (energético)', zefirDano));
    if (golpeMortal) danoPartes.push(parcelaDeDano('golpe mortal (dobro)', golpeMortal));
    if (furia) danoPartes.push(parcelaDeDano('fúria', furia));
    if (sneak) danoPartes.push(parcelaDeDano('ataque furtivo', sneak));
    if (martial) danoPartes.push(parcelaDeDano('vantagem marcial', martial));
    if (surpresa) danoPartes.push(parcelaDeDano('ataque surpresa', surpresa));
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
    // GOLPES REFORÇADOS PELO KI (monge, 6º): os golpes desarmados contam como mágicos para vencer resistência e imunidade.
    const reforcadoPeloKi = attacker.features?.includes('kiEmpoweredStrikes') && p.weapon?.id === 'punhos';
    // PACTO DA LÂMINA: a arma do pacto é mágica (vence resistência e imunidade a dano não mágico).
    const armaDoPacto = attacker.features?.includes('pactOfTheBlade') && p.weapon && p.weapon.id !== 'punhos';
    // GOLPE PRIMITIVO (Círculo da Lua, 6º): os ataques da forma de fera contam como mágicos.
    const golpePrimitivo = attacker.features?.includes('primalStrike') && !!attacker.formaSelvagem;
    const magico = !!(p.magico || reforcadoPeloKi || armaDoPacto || golpePrimitivo || Sub.flechaMagica(attacker, p.weapon) || Sub.kenseiMagica(attacker, p.weapon) || Sub.feraMagica(attacker, p.weapon) || Sub.efeitoDoSurto(attacker) === 'armaDeForca' || attacker.golpesMagicos || p.weapon?.raridade || p.weapon?.bonusAtaque || (attacker.conditions ?? []).some((c) => CONDITIONS[c.id]?.bonusArma));
    // Armadura de Agathys: vale se ele ainda tinha PV temporários ao ser acertado.
    const agathys = !p.ranged && getCondition(target, 'agathys');
    const geloDevolve = agathys && (target.tempHp ?? 0) > 0 ? agathys.data?.dano ?? 5 : 0;
    // O golpe e o que ele soma (Bruxaria, golpe divino, o veneno da aranha)
    // são UMA fonte de dano: um teste de concentração só, pela soma.
    const hpAntesDoGolpe = target.hp;
    // CAMINHO PARA A SEPULTURA: o primeiro golpe do grupo do clérigo abre a maldição (o dano todo deste ataque, em dobro).
    Sub.abrirASepultura(this, attacker, target);
    // DEFESA ESPECTRAL (Andarilho do Horizonte, 15º): a reação resiste a este golpe.
    Sub.defesaEspectral(this, target, attacker, total);
    // RUNA DA NUVEM (Cavaleiro Rúnico): o golpe que derrubaria o aliado passa para outro inimigo, com a mesma rolagem.
    const nuvem = attacker.side !== target.side ? Sub.runaDaNuvem(this, target, attacker, total) : null;
    if (nuvem) target = nuvem;
    // O GOLPE DE PERTO EM CURSO: o que vem com ele (o Golpe Divino, a Marca do Caçador, o veneno da lâmina) é o MESMO
    // ataque corpo a corpo, e é por ele que o golpe não letal derruba sem matar.
    const golpeDePertoAntes = this.golpeDePerto;
    this.golpeDePerto = p.ranged ? null : attacker;
    try {
    this.umaFonteDeDano(() => {
      this.applyDamage(target, total, p.type, attacker, { critical, magico, deArma: true, corpoACorpo: !p.ranged });
      this.extrasDoAcerto(attacker, target, { arma: true, ranged: p.ranged, tipo: p.type, critical, hpAntes: hpAntesDoGolpe, atkTotal: atk.total });
      // `contra`: dano extra que só vale num tipo de criatura (o de Hew, em planta).
      // `contra` é um tipo ou uma lista (a vingadora sagrada: corruptor e morto-vivo)
      if (p.danoExtra && !target.dead && (!p.danoExtra.contra || [].concat(p.danoExtra.contra).includes(target.tipo))) {
        this.danoExtraDoGolpe(attacker, target, p, critical);
      }
      // O PODER DA ARMA MÁGICA (a vorpal, a espada do gume, a ladra de vida...): o 20 natural e o golpe contra um tipo
      if (p.weapon?.poder && !target.dead) this.poderDaArma(attacker, target, p, atk);
      // BLACKRAZOR: quem ela derruba tem a alma devorada (o golpe já matou, e o poder de sempre não roda em morto)
      else if (p.weapon?.poder === 'devoraAlma' && target.dead) this.devorarAlma(attacker, target, p.weapon);
      // a ARMA UNTADA: o primeiro acerto de corte ou ponta leva o veneno
      if (!target.dead && ['cortante', 'perfurante'].includes(p.type) && p.weapon) {
        const untada = getCondition(attacker, 'armaUntada');
        if (untada) {
          removeCondition(attacker, 'armaUntada');
          this.aplicarVeneno(target, untada.data?.veneno, untada.data?.nome ?? 'o veneno', attacker);
        }
      }
      // a munição +N que acerta deixa de ser mágica: sai da mochila
      if (p.municao && attacker.bag) consumirDaMochila(attacker, p.municao);
      if (p.quebraConcentracao && target.concentrating && !target.dead) {
        this.dropConcentration(target);
        this.say('magia', `${target.name} perde a concentração (${p.name}).`);
      }
      if (p.curaNoAcerto && !attacker.dead && attacker.hp > 0) {
        const curou = this.heal(attacker, p.curaNoAcerto, attacker);
        if (curou) this.say('cura', `${attacker.name} bebe o calor do golpe: +${curou} PV.`);
      }
      // RAMPAGE (a hiena gigante, o gnoll): derrubou alguém de perto no próprio turno — ação bônus, anda metade e morde
      if (!p.ranged && target.hp <= 0 && attacker.traits?.includes('rampage') && !attacker.bonusUsed && this.side === attacker.side && !attacker.emRampage) {
        attacker.bonusUsed = true;
        attacker.emRampage = true;
        try { this.rampage(attacker); } finally { attacker.emRampage = false; }
      }
      if (attacker.furiaFerida && attacker.hp <= attacker.furiaFerida.limiar && !p.ranged && !target.dead) {
        this.danoExtraDoGolpe(attacker, target, { ...p, danoExtra: { damage: attacker.furiaFerida.dano, type: p.type } }, critical);
      }
      if (target.traits?.includes('deslocamento')) target.deslocamentoFalhou = true;
      // CORPO QUENTE (o azer, o balor): quem o acerta de perto se queima
      if (target.corpoQuente && !p.ranged && !attacker.dead && distanceFt(attacker.pos, target.pos) <= 5) {
        const q = damageRoll(this.rng, target.corpoQuente.damage);
        this.outraFonte(() => this.applyDamage(attacker, q.total, target.corpoQuente.type, target, { magico: true }));
        this.say('dano', `${attacker.name} se queima em ${target.name}: ${q.total} de ${target.corpoQuente.type}.`, `${target.corpoQuente.damage}[${q.rolls.join('+')}]`);
      }
      // EMINÊNCIA DIVINA (o sacerdote): neste turno, o golpe corpo a corpo soma o radiante
      if (attacker.eminencia?.rodada === this.round && this.side === attacker.side && !p.ranged && !target.dead) {
        this.danoExtraDoGolpe(attacker, target, { ...p, danoExtra: { damage: attacker.eminencia.dano, type: 'radiante' } }, critical);
      }
    });
    } finally { this.golpeDePerto = golpeDePertoAntes; }
    // TASHA (3º lote): os LAMENTOS DO TÚMULO (Fantasma) e o RASGAR A MENTE (Lâmina da Alma), depois do Ataque Furtivo
    if (sneak) {
      Sub.lamentosDoTumulo(this, attacker, target);
      Sub.rasgarMente(this, attacker, target, weaponId ?? attacker.equippedWeapon);
    }
    delete target.vulneravelAoGolpe;
    delete target.resisteAoGolpe;
    // PROTETORES ANCESTRAIS (o primeiro acerto do bárbaro em Fúria marca o alvo) e a TEMPESTADE FURIOSA (o deserto queima quem
    // acerta o bárbaro na aura; o mar derruba quem o bárbaro acerta nela).
    Sub.marcarComOsAncestrais(this, attacker, target);
    if (!target.dead) Sub.tempestadeFuriosaAoAcertar(this, attacker, target);
    // MARCA INABALÁVEL e INVESTIDA FEROZ (Cavaleiro), MESTRE DA EMBOSCADA (Batedor)
    Sub.marcaInabalavel(this, attacker, target, { ranged: p.ranged });
    if (!target.dead && !p.ranged) Sub.investidaFeroz(this, attacker, target);
    Sub.exporNaEmboscada(this, attacker, target);
    // ser acertado: a Tempestade Furiosa do deserto, o Escudo Solar, a Repreensão Desdenhosa
    Sub.depoisDeSerAcertado(this, target, attacker, { corpoACorpo: !p.ranged });
    // A explosão da Flecha Relampejante é outra fonte, com os seus testes.
    if (flecha) this.flechaRelampago(attacker, target, flecha, { acertou: true });
    // O gelo da Agathys é outra fonte, com o seu próprio teste.
    if (geloDevolve && !attacker.dead) {
      this.say('magia', `O gelo de ${target.name} morde ${attacker.name}: ${geloDevolve} de frio.`);
      this.applyDamage(attacker, geloDevolve, 'frio', target, { magico: true });
    }
    // ESCUDO DE FOGO: quem acerta de perto, a 1,5 m, se queima
    if (!p.ranged && !attacker.dead && hasCondition(target, 'escudoDeFogo') && distanceFt(attacker.pos, target.pos) <= 5) {
      const chama = damageRoll(this.rng, '2d8');
      this.say('magia', `O escudo de fogo de ${target.name} queima ${attacker.name}: ${chama.total} de fogo.`, `2d8[${chama.rolls.join('+')}]`);
      this.applyDamage(attacker, chama.total, 'fogo', target, { magico: true });
    }
    // SOMBRA DE MOIL: quem acerta a até 3 m, de perto ou de longe, sofre 2d8 necrótico.
    if (!attacker.dead && hasCondition(target, 'sombraDeMoil') && distanceFt(attacker.pos, target.pos) <= 10) {
      const nec = damageRoll(this.rng, '2d8');
      this.say('magia', `A sombra de ${target.name} morde ${attacker.name}: ${nec.total} necrótico.`, `2d8[${nec.rolls.join('+')}]`);
      this.applyDamage(attacker, nec.total, 'necrótico', target, { magico: true });
    }
    if (p.recarga) (attacker.recarregando ??= {})[p.name] = true;
    // BRIGÃO DE TAVERNA (talento de 2014): o soco que acerta no próprio turno deixa agarrar este alvo como ação bônus.
    if (p.weapon?.id === 'punhos' && this.side === attacker.side) attacker.socouEm = { turno: this.turnoKey(), alvo: target.id };
    // PELE VENENOSA (o grung): a mão nua ou a arma natural que acerta a pele dele
    if (target.peleVenenosa && !p.ranged && (p.weapon?.props?.includes('desarmado') || p.weapon?.natural)) Livro.peleVenenosa(this, attacker, target);
    // MESTRE EM ARMAS GRANDES: no próprio turno, crítico ou derrubada com arma de perto libera um golpe de ação bônus.
    if (!p.ranged && p.weapon && temTalento(attacker, 'mestreEmArmasGrandes') && this.side === attacker.side && (critical || target.hp <= 0)) {
      attacker.golpeExtraEm = this.turnoKey();
    }
    depoisDoAcerto(this, attacker, target, p);
    this.oportunista(attacker, target);

    // ATAQUE ATORDOANTE: o monge gastou 1 ki antes do golpe. No primeiro
    // acerto de arma CORPO A CORPO depois disso, o alvo faz Constituição
    // contra a CD de ki ou fica atordoado até o fim do próximo turno dele.
    // Carregar antes é o mesmo contrato da Destruição Divina: o livro deixa
    // decidir depois do acerto, e perguntar a cada golpe pararia a luta.
    if (attacker.atordoantePronto && !p.ranged && p.weapon && !target.dead) {
      attacker.atordoantePronto = false;
      this.ataqueAtordoante(attacker, target);
    }

    // Efeito extra do ataque (mordida do lobo derruba). Pode ser UMA LISTA: o tentáculo do grell paralisa (com
    // resistência) e agarra (sem), e são dois efeitos que o livro separa. Cada um resolve por conta própria.
    for (const efeito of [].concat(p.onHit ?? [])) this.efeitoDoGolpe(attacker, target, { ...p, onHit: efeito });
    // Drenar Sangue (o stirge): o acerto GRUDA no alvo, sem teste.
    if (p.gruda && !target.dead && !attacker.dead) this.grudar(attacker, target);
    // INVESTIDA (a broca infernal): quem andou 6 m antes de acertar soma dano e pode derrubar.
    if (p.investida && !attacker.dead) this.investida(attacker, target, p.investida);
    if (p.puxa && !target.dead && !attacker.dead && (!p.puxaSeAgarrado || getCondition(target, 'agarrado')?.source === attacker.id)) {
      this.puxar(attacker, target, p.puxa === true ? 5 : p.puxa);
    }
    // OS BESTIÁRIOS DOS LIVROS: a mordida que engole (o verme púrpura, o kraken), a arma que corrói no pudim e na
    // ferrugem, o tridente que espeta (o rei homem-lagarto)
    if (p.engole && !attacker.dead) Livro.mordidaQueEngole(this, attacker, target, p.engole);
    Livro.corroerArma(this, attacker, target, p);
    if (attacker.espetar) Livro.espetar(this, attacker, target, p);
    Livro.golpeBanidor(this, attacker, target);
    if (!semAljava) Livro.aljavaVeloz(this, attacker, target, p);
    // CONSOME (o aglomerado encefálico): quem o golpe zera morre na hora e vira comida.
    if (p.consome && target.kind === 'pc' && !target.dead && target.hp <= 0) {
      this.say('morte', `${attacker.name} engole ${target.name} inteiro.`);
      this.applyDamage(target, 9999, 'concussão', attacker);
    }
    // FOME AGRESSIVA (o aglomerado, reação): acertado, ele vai atrás de quem o feriu.
    if (!target.dead && target.hp > 0 && !this.reagindo) this.fomeAgressiva(target, attacker);
    // Dreno de vida (espectro, lívido, aparição) e de Força (sombra).
    if (p.maxHpDrain && !target.dead && total > 0) this.drenarVida(attacker, target, p, total);
    if (p.forcaDrain && !target.dead && p.type === 'necrótico') this.drenarForca(attacker, target, p);
    return { hit: true, critical, damage: total, modo: mods.mode, danoPartes };
  }

  /** Um efeito de `onHit`: a condição, a resistência que a evita, e o dano que só cai em quem falha. */
  efeitoDoGolpe(attacker, target, p) {
    const imune = p.onHit && (
      p.onHit.imunes?.ancestry?.some((a) => (target.ancestry ?? '').startsWith(a))
      || p.onHit.imunes?.tipo?.includes(target.tipo)
      || p.onHit.imunes?.tamanhos?.includes(target.size ?? 'médio')
      || (p.onHit.condition && this.imuneACondicao(target, p.onHit.condition))
    );
    if (imune && !target.dead) {
      this.say('condicao', `${target.name} não é afetado: ${p.onHit.imunes?.motivo ?? `imune a ${CONDITIONS[p.onHit.condition]?.name.toLowerCase() ?? p.onHit.condition}`}.`);
    } else if (p.onHit?.exigeAgarrado && getCondition(target, 'agarrado')?.source !== attacker.id) {
      // o efeito que só vale em quem o golpe AGARROU (o tentáculo do Qunbraxel só atordoa quem ele segura): sem agarrão, nada
    } else if (p.onHit?.maxAgarrados && !target.dead
      && this.combatants.filter((c) => c !== target && !c.dead && getCondition(c, p.onHit.condition)?.source === attacker.id).length >= p.onHit.maxAgarrados) {
      // o cérebro ancião segura até quatro: com as quatro mãos cheias, o tentáculo só bate
      this.say('condicao', `${attacker.name} já segura ${p.onHit.maxAgarrados}: não agarra ${target.name}.`);
    } else if (p.onHit && !target.dead && !hasCondition(target, 'inconsciente')) {
      // Alguns efeitos não têm resistência: o acerto já basta (a teia prende).
      this.forcandoTeste = attacker;
      let save;
      try {
        save = p.onHit.semResistencia
          ? { success: false, total: 0, rolls: [] }
          : this.resistencia(target, p.onHit.save, p.onHit.dc, { contra: { condicao: p.onHit.condition } });
      } finally { this.forcandoTeste = null; }
      const nomeCondicao = CONDITIONS[p.onHit.condition]?.name ?? p.onHit.condition;
      const r = p.onHit.semResistencia
        ? { conta: `sem resistência: o acerto basta · escapa com Atletismo ou Acrobacia CD ${p.onHit.escape ?? p.onHit.dc}` }
        : this.explicarResistencia(target, p.onHit.save, p.onHit.dc, save, {
          contra: `${p.name} de ${attacker.name}`,
          seSucesso: `não fica ${nomeCondicao}`,
        });
      // METADE A QUEM PASSA (o veneno da maioria dos blocos do Monster Manual: "ou metade se passar")
      if (save.success && p.onHit.danoSeFalhar && p.onHit.metadeSePassar && !target.dead) {
        const d = damageRoll(this.rng, p.onHit.danoSeFalhar.damage);
        const metade = Math.floor(d.total / 2);
        this.applyDamage(target, metade, p.onHit.danoSeFalhar.type, attacker);
        this.say('ataque', `${target.name} resiste e sofre só metade: ${metade} de ${p.onHit.danoSeFalhar.type}.`, `${p.onHit.danoSeFalhar.damage}[${d.rolls.join('+')}] / 2`);
      }
      if (!save.success) {
        // DANO SÓ DE QUEM FALHA (as garras do quasit: 2d4 de veneno E envenenado, ou nada). É a MESMA
        // resistência da condição: o livro rola uma vez, e duas rolagens deixariam o alvo envenenado sem o
        // dano, ou o contrário, numa conta que o bloco não tem.
        if (p.onHit.danoSeFalhar) {
          const d = damageRoll(this.rng, p.onHit.danoSeFalhar.damage);
          this.applyDamage(target, d.total, p.onHit.danoSeFalhar.type, attacker);
          this.say('ataque', `${target.name} sofre ${d.total} de ${p.onHit.danoSeFalhar.type}.`, `${p.onHit.danoSeFalhar.damage}[${d.rolls.join('+')}]`);
        }
        if (p.onHit.condition && !target.dead) {
          // `ateInicioDoTurnoDoDono`: até o começo do próximo turno de quem bate (o Rasgo Psíquico do zelote)
          const ateODono = p.onHit.ateInicioDoTurnoDoDono ? { rounds: 1, quando: 'inicio', lado: attacker.side } : {};
          this.aplicarCondicao(target, p.onHit.condition, {
            rounds: p.onHit.rounds ?? Infinity,
            source: attacker.id,
            ...ateODono,
            data: {
              save: p.onHit.save,
              dc: p.onHit.dc,
              repete: !!p.onHit.repete,
              escape: p.onHit.escape ?? null,
              ...(p.onHit.comOAgarrao ? { comOAgarrao: attacker.id } : {}),
              // o APERTO que fere no começo do turno de quem está preso (o tentáculo do cérebro ancião)
              ...(p.onHit.danoPorTurno ? { dano: p.onHit.danoPorTurno } : {}),
            },
          });
          // SEM CURA ENQUANTO DURAR (o Golpe de Cadáver do cloaker mutante: envenenado, e envenenado assim não se cura)
          if (p.onHit.semCuraJunto && hasCondition(target, p.onHit.condition)) {
            addCondition(target, 'semCura', { rounds: p.onHit.rounds ?? Infinity, source: attacker.id, data: { comCondicao: p.onHit.condition } });
          }
          this.say('condicao', `${target.name} ${p.onHit.note} — fica ${nomeCondicao}.`, r.conta, { rolagem: r });
        }
      } else {
        this.say('condicao', `${target.name} se segura e escapa de ${nomeCondicao}.`, r.conta, { rolagem: r });
      }
    }
  }

  /**
   * DRENAR VIDA (SRD: espectro, lívido, aparição): quem sofre o dano faz Constituição; se falhar, o PV MÁXIMO cai do mesmo tanto, até um
   * descanso longo (`descansoLongo` devolve). A zero de máximo, morre.
   */
  drenarVida(atacante, alvo, p, dano) {
    const d = p.maxHpDrain;
    const sv = this.resistencia(alvo, d.save ?? 'con', d.dc);
    const r = this.explicarResistencia(alvo, d.save ?? 'con', d.dc, sv, { contra: `${p.name} de ${atacante.name}`, seSucesso: 'o PV máximo não cai' });
    if (sv.success) { this.say('condicao', `${alvo.name} resiste ao dreno: o PV máximo fica como está.`, r.conta, { rolagem: r }); return; }
    const tira = Math.min(dano, alvo.maxHp);
    alvo.maxHp -= tira;
    alvo.maxHpPerdido = (alvo.maxHpPerdido ?? 0) + tira;
    if (alvo.hp > alvo.maxHp) alvo.hp = alvo.maxHp;
    this.say('condicao', `${alvo.name} perde ${tira} de PV máximo até o descanso longo (agora ${alvo.maxHp}).`, r.conta, { rolagem: r });
    if (alvo.maxHp <= 0) { alvo.hp = 0; this.applyDamage(alvo, 9999, 'necrótico', atacante); }
  }

  /**
   * DRENAR FORÇA (SRD: sombra): o acerto tira `dado` de Força do alvo até um descanso curto ou longo. Quem chega a Força 0 morre (e, no
   * livro, se levanta como sombra: aqui, só morre).
   */
  drenarForca(atacante, alvo, p) {
    const perde = this.rng.die(Number(String(p.forcaDrain.dado ?? '1d4').split('d')[1] ?? 4));
    const antes = alvo.abilities.str;
    alvo.abilities.str = Math.max(0, antes - perde);
    alvo.forcaPerdida = (alvo.forcaPerdida ?? 0) + (antes - alvo.abilities.str);
    this.say('condicao', `${alvo.name} perde ${antes - alvo.abilities.str} de Força até o descanso (agora ${alvo.abilities.str}).`);
    if (alvo.abilities.str <= 0) {
      alvo.hp = 0;
      this.applyDamage(alvo, 9999, 'necrótico', atacante);
      // O livro: quem morre assim se levanta como uma sombra nova, do lado de quem o matou, no mesmo lugar.
      const nova = atacante.defId === 'sombra' ? this.invocarSombraNova(atacante, alvo) : null;
      if (nova) this.say('recurso', `${alvo.name} cai, e uma sombra nova se levanta no lugar dele.`);
    }
  }

  /** A sombra que nasce de quem morreu por Força 0: do lado da que o matou, perto do corpo. */
  invocarSombraNova(origem, corpo) {
    const casa = this.casaLivreMaisProxima({ x: corpo.pos.x, y: corpo.pos.y, f: 0 });
    if (!casa) return null;
    const nova = makeMonster('sombra', { x: casa.x, y: casa.y }, { rng: this.rng, nameSuffix: 'nova' });
    nova.side = origem.side;
    nova.xp = 0;
    this.addCombatant(nova);
    return nova;
  }

  /**
   * ENGOLIR (arbusto errante): no começo do turno dele, quem ele tem preso (condição `contido` posta por ele) faz Constituição CD 14 ou
   * leva 2d8 de concussão: sem ar, o livro diz que a pessoa não respira.
   */
  engolidosNoTurno(c) {
    if (c.dead || !c.traits?.includes('engolir')) return;
    for (const alvo of this.combatants) {
      if (alvo.dead || alvo === c || alvo.hp <= 0) continue;
      if (getCondition(alvo, 'contido')?.source !== c.id) continue;
      const sv = this.resistencia(alvo, 'con', 14);
      const r = this.explicarResistencia(alvo, 'con', 14, sv, { contra: `ser engolido por ${c.name}`, seSucesso: 'respira e não leva dano' });
      if (sv.success) { this.say('condicao', `${alvo.name} prende o fôlego dentro de ${c.name} e não se machuca.`, r.conta, { rolagem: r }); continue; }
      const dano = this.rng.die(8) + this.rng.die(8);
      this.say('dano', `${alvo.name} se afoga nas ervas de ${c.name}: ${dano} de dano de concussão.`, r.conta, { rolagem: r });
      this.applyDamage(alvo, dano, 'concussão', c);
    }
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
        const amount = danoPorResistencia(c, 'dex', true, save.success, r.total, conditionEffects(c).incapacitated);
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
  /**
   * O PODER DA ARMA MÁGICA do Livro do Mestre, depois do acerto (`weapon.poder`). Só com a arma sintonizada, quando ela
   * pede sintonia (a mesma regra do bônus, `weaponAttackProfile`). O 20 é o do dado, não o crítico de quem está
   * paralisado:
   *   vorpal        no 20, decapita (morte na hora); quem tem ação lendária, ou não tem cabeça, leva 6d8 cortante a mais;
   *                 imune a cortante, nada
   *   gume          no 20, +4d6 cortante (o membro decepado não entra)
   *   roubarVida    no 20, contra quem não é constructo nem morto-vivo: +3d6 necrótico, e o dono ganha o mesmo em PV
   *                 temporários
   *   noveVidas     no 20, contra quem tem menos de 100 PV e não é constructo nem morto-vivo: Constituição CD 15 ou
   *                 morre; gasta uma carga (`recarregavel`, sem recarga)
   *   golpe         no 20, +2d6 concussão (4d6 contra constructo); o constructo que fica com 25 PV ou menos se desfaz
   *   derrubaGigante  contra gigante, Força CD 15 ou caído
   */
  poderDaArma(attacker, target, p, atk) {
    const w = p.weapon;
    if (w.sintonia && attacker.side === 'party' && !(attacker.sintonizados ?? []).includes(w.id)) return;
    const vinte = atk?.natural === 20;
    const vivo = !['constructo', 'morto-vivo'].includes(target.tipo);
    const extra = (dado, tipo, rotulo) => {
      rotulo = rotulo.charAt(0).toUpperCase() + rotulo.slice(1).toLowerCase();
      const r = roll(this.rng, dado);
      const dano = this.danoPorTipo(target, r.total, tipo, true, true);
      this.say('ataque', `${rotulo}: ${target.name} sofre ${dano} de ${tipo} a mais.`, `${dado}[${r.rolls.join('+')}] = ${r.total}`);
      this.applyDamage(target, r.total, tipo, attacker, { magico: true, deArma: true });
      return dano;
    };
    switch (w.poder) {
      case 'vorpal': {
        if (!vinte || this.danoPorTipo(target, 2, 'cortante', true, true) === 0) return;
        const semCabeca = ['gosma', 'elemental', 'planta'].includes(target.tipo);
        if (target.lendarias || semCabeca) { extra('6d8', 'cortante', `${w.name} no 20`); return; }
        this.say('ataque', `A ${w.name.toLowerCase()} acha o pescoço num 20: a cabeça de ${target.name} sai do corpo.`);
        this.applyDamage(target, target.hp + (target.tempHp ?? 0), 'cortante', attacker, { magico: true, deArma: true });
        return;
      }
      case 'gume': if (vinte) extra('4d6', 'cortante', `${w.name} no 20`); return;
      case 'roubarVida': {
        if (!vinte || !vivo) return;
        const dano = extra('3d6', 'necrótico', `${w.name} no 20`);
        if (dano > 0 && !attacker.dead) {
          attacker.tempHp = Math.max(attacker.tempHp ?? 0, dano);
          this.say('cura', `${attacker.name} fica com ${dano} PV temporários do que a lâmina bebeu.`);
        }
        return;
      }
      case 'noveVidas': {
        if (!vinte || !vivo || target.hp >= 100 || cargasDe(attacker, w.id) < 1) return;
        gastarCargaDoItem(attacker, w.id);
        const save = this.resistencia(target, 'con', 15, { contra: { magico: true } });
        const r = this.explicarResistencia(target, 'con', 15, save, { contra: w.name, seSucesso: 'nada' });
        if (save.success) { this.say('ataque', `${target.name} resiste à ${w.name.toLowerCase()} (restam ${cargasDe(attacker, w.id)} cargas).`, r.conta); return; }
        this.say('ataque', `A ${w.name.toLowerCase()} arranca a vida de ${target.name} de uma vez (restam ${cargasDe(attacker, w.id)} cargas).`, r.conta);
        this.applyDamage(target, target.hp + (target.tempHp ?? 0), null, attacker, { magico: true });
        return;
      }
      case 'golpe': {
        const constructo = target.tipo === 'constructo';
        if (vinte) extra(constructo ? '4d6' : '2d6', 'concussão', `${w.name} no 20`);
        if (constructo && vinte && !target.dead && target.hp <= 25) {
          this.say('ataque', `${target.name} se desfaz sob a ${w.name.toLowerCase()}.`);
          this.applyDamage(target, target.hp + (target.tempHp ?? 0), null, attacker, { magico: true });
        }
        return;
      }
      // A SEGUNDA LEVA DO LIVRO DO MESTRE (2026-11-12)
      // a ARMA CRUEL: no 20, +7 do tipo dela
      case 'cruel': if (vinte) { this.say('ataque', `${w.name}: o 20 abre a ferida, +7.`); this.applyDamage(target, 7, p.type, attacker, { magico: true, deArma: true }); } return;
      // ONDA: no crítico, necrótico igual à metade dos PV máximos do alvo
      case 'onda': {
        if (!atk?.critical) return;
        const n = Math.floor((target.maxHp ?? 0) / 2);
        if (n > 0) { this.say('ataque', `${w.name} arrasta ${target.name} para o fundo: +${n} de necrótico.`); this.applyDamage(target, n, 'necrótico', attacker, { magico: true }); }
        return;
      }
      // WHELM arremessado: +1d8 de concussão, 2d8 contra gigante
      case 'whelm': if (distanceFt(attacker.pos, target.pos) > 5) extra(target.tipo === 'gigante' ? '2d8' : '1d8', 'concussão', `${w.name} arremessado`); return;
      // BLACKRAZOR no morto-vivo: o dono sofre 1d10 necrótico e o morto-vivo se cura 1d10
      case 'devoraAlma': {
        if (target.tipo !== 'morto-vivo') return;
        const r1 = roll(this.rng, '1d10');
        const r2 = roll(this.rng, '1d10');
        this.say('ataque', `${w.name} recusa a carne morta: ${attacker.name} sofre ${r1.total} de necrótico e ${target.name} se refaz em ${r2.total}.`);
        this.applyDamage(attacker, r1.total, 'necrótico', target, { magico: true });
        this.heal(target, r2.total, target);
        return;
      }
      case 'derrubaGigante': {
        if (target.tipo !== 'gigante' || hasCondition(target, 'caido')) return;
        const save = this.resistencia(target, 'str', 15, { contra: { magico: true } });
        const r = this.explicarResistencia(target, 'str', 15, save, { contra: w.name, seSucesso: 'fica de pé' });
        if (!save.success) { addCondition(target, 'caido', { rounds: Infinity }); this.say('condicao', `${target.name} vai ao chão (${w.name.toLowerCase()}).`, r.conta); }
        return;
      }
      default:
    }
  }

  /**
   * BLACKRAZOR DEVORA A ALMA de quem ela derruba (fora constructo e morto-vivo): o dono ganha PV temporários iguais aos PV
   * máximos do morto e, enquanto eles durarem, vantagem nos ataques, testes e resistências (`almaDevorada`).
   */
  devorarAlma(attacker, target, w) {
    if (attacker.dead || ['constructo', 'morto-vivo'].includes(target.tipo)) return;
    if (w.sintonia && attacker.side === 'party' && !(attacker.sintonizados ?? []).includes(w.id)) return;
    const pv = target.maxHp ?? 0;
    attacker.tempHp = Math.max(attacker.tempHp ?? 0, pv);
    addCondition(attacker, 'almaDevorada', { rounds: Infinity, source: attacker.id });
    this.say('cura', `${w.name} devora a alma de ${target.name}: ${attacker.name} fica com ${attacker.tempHp} PV temporários e a fome dela.`);
  }

  /**
   * As ESPADAS DA RESPOSTA: quem fere o dono a até o alcance dela leva um golpe de reação, com vantagem, que passa por cima de
   * resistência e imunidade. A ESPADA DA VINGANÇA: quem o fere numa luta pede Sabedoria CD 15, ou o dono fica preso a ele.
   */
  armaQueResponde(target, source) {
    if (!source || source === target || source.dead || target.dead || target.hp <= 0 || source.side === target.side) return;
    const w = WEAPONS[target.equippedWeapon];
    if (!w?.poder || (w.sintonia && target.side === 'party' && !(target.sintonizados ?? []).includes(w.id))) return;
    if (w.poder === 'resposta' && !target.reactionUsed && !conditionEffects(target).incapacitated
      && distanceFt(target.pos, source.pos) <= (w.reachFt ?? 5) && !this.respondendo) {
      target.reactionUsed = true;
      this.respondendo = true;
      target.respostaAgora = true;
      try {
        this.say('recurso', `${w.name} responde ao golpe: ${target.name} revida em ${source.name}.`);
        this.resolveAttack(target, source, { weaponId: w.id, vantagem: true });
      } finally { target.respostaAgora = false; this.respondendo = false; }
    }
    if (w.poder === 'vinganca' && !this.explorando && !hasCondition(target, 'provocado')) {
      const s = this.resistencia(target, 'wis', 15, { contra: { magico: true } });
      if (!s.success) {
        addCondition(target, 'provocado', { rounds: 10, source: source.id });
        this.say('condicao', `O espírito da ${w.name.toLowerCase()} toma ${target.name}: só tem olhos para ${source.name}.`);
      }
    }
  }

  /**
   * O VENENO DO LIVRO em quem o leva: resistência de Constituição contra `cd`. Falhou: o dano inteiro e as condições
   * (`condicoes: [{ id, rodadas }]`); falhou por `desmaiaPor` ou mais, também desmaiado enquanto envenenado (o drow).
   * Passou: metade do dano se `metade`, senão nada. Quem é imune a envenenado não pega as condições; quem é imune a
   * veneno não sofre o dano.
   */
  aplicarVeneno(target, v, nome, fonte = null) {
    if (!v || target.dead) return;
    const save = this.resistencia(target, 'con', v.cd, { contra: { tipoDano: 'veneno', condicao: 'envenenado' } });
    const r = this.explicarResistencia(target, 'con', v.cd, save, { contra: nome, seSucesso: v.metade ? 'metade do dano' : 'nada' });
    if (v.dano) {
      const d = roll(this.rng, v.dano);
      const total = save.success ? (v.metade ? Math.floor(d.total / 2) : 0) : d.total;
      if (total > 0) {
        this.say('ataque', `${target.name} ${save.success ? 'resiste em parte, e sofre' : 'sofre'} ${this.danoPorTipo(target, total, 'veneno')} de veneno (${nome.toLowerCase()}).`, `${r.conta} · ${v.dano}[${d.rolls.join('+')}] = ${d.total}`);
        this.applyDamage(target, total, 'veneno', fonte);
      } else this.say('ataque', `${target.name} resiste (${nome.toLowerCase()}).`, r.conta);
    } else if (save.success) this.say('ataque', `${target.name} resiste (${nome.toLowerCase()}).`, r.conta);
    if (save.success || target.dead || !v.condicoes?.length) return;
    if (this.imuneACondicao(target, 'envenenado', fonte)) { this.say('aviso', `${target.name} não se envenena.`); return; }
    const pegou = [];
    for (const c of v.condicoes) {
      addCondition(target, c.id, { rounds: c.rodadas, source: fonte?.id });
      pegou.push(CONDITIONS[c.id]?.name?.toLowerCase() ?? c.id);
    }
    const falhouPor = v.cd - save.total;
    if (v.desmaiaPor && falhouPor >= v.desmaiaPor) {
      addCondition(target, 'desmaiadoDeVeneno', { rounds: v.condicoes[0].rodadas, source: fonte?.id });
      pegou.push('desmaiado');
    }
    this.say('condicao', `${target.name} fica ${pegou.join(' e ')} (${nome}).`, r.conta);
  }

  danoExtraDoGolpe(attacker, target, p, critical) {
    const ex = p.danoExtra;
    const dmg = damageRoll(this.rng, ex.damage, { critical });
    let amount = dmg.total;
    let conta = contaDeDano(parcelaDeDano(ex.type, dmg));
    if (ex.save) {
      const save = this.resistencia(target, ex.save, ex.dc, { contra: { tipoDano: ex.type } });
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
    // VÍNCULO ENCORAJADOR (Paz): 1d4, uma vez por turno.
    const vinculo = Sub.dadoDoVinculo(this, attacker);
    if (vinculo) { bonus += vinculo; partes.push({ rotulo: 'Vínculo Encorajador', valor: vinculo }); }
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
    // Modificador fixo, não dado: a conta de quem voltou dos mortos.
    if (fx.ataqueFixo) {
      bonus += fx.ataqueFixo;
      for (const c of attacker.conditions ?? []) {
        if (CONDITIONS[c.id]?.penalidadeDaData && c.data?.penalidade) {
          partes.push({ rotulo: CONDITIONS[c.id].name.toLowerCase(), valor: -c.data.penalidade });
        }
      }
    }
    return { bonus, partes };
  }

  /**
   * O DADO DAS ARTES MARCIAIS para esta arma, ou null.
   *
   * Vale no punho e na arma de monge; e só quando o dado da classe é MAIOR
   * que o da arma — o SRD diz "pode usar", e ninguém escolheria o menor.
   */
  artesMarciais(actor, idDaArma, w) {
    // as ARMAS KENSEI e o RAIO DE SOL (Xanathar) são de monge, à distância inclusive
    const doLivro = Sub.armaKensei(actor, idDaArma) || Sub.ehRaioSolar(idDaArma);
    if (!actor.dadoDeArtesMarciais || !w || (w.ranged && !doLivro)) return null;
    const deMonge = idDaArma === 'punhos' || idDaArma === 'espadaCurta' || doLivro
      || (w.categoria === 'simples' && !w.duasMaos && !w.pesada);
    if (!deMonge) return null;
    // A DESTREZA VALE SEMPRE na arma de monge — é metade da característica, e
    // é ela que faz o monge existir sem Força. O dado da classe só entra
    // quando é MAIOR que o da arma: o SRD diz "pode usar", e ninguém
    // escolheria o menor. No 1º nível os dois são d4, então o que muda é o
    // atributo; do 5º em diante muda também o dado.
    const faces = (d) => Number(String(d).match(/d(\d+)/)?.[1] ?? 0);
    const dado = actor.dadoDeArtesMarciais;
    return { dado: faces(dado) > faces(w.damage) ? `1${dado}` : w.damage };
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

  /** A zona com PV cujo trecho cobre esta casa, se houver (a Muralha de Pedra e a de Gelo). */
  muralhaEm(x, y) {
    return this.zonas.find((z) => z.pvDoTrecho && z.casas.has(key(x, y))) ?? null;
  }

  /**
   * GOLPEAR UM TRECHO DE MURALHA. O livro dá CA e PV à Muralha de Pedra e à de Gelo, e os dá POR
   * TRECHO: derrubar um trecho abre um VÃO e o resto da muralha fica de pé. É o que transforma a
   * muralha de "espere a concentração cair" em obstáculo que se resolve — e é por isso que o alvo
   * aqui é uma CASA, e não uma criatura.
   *
   * O que esta porta NÃO faz, de propósito: área de magia não quebra muralha. O livro só manda a
   * magia ferir OBJETOS quando ela diz isso com todas as letras (a Bola de Fogo incendeia o que não
   * está sendo carregado, e mais nada), e o resto fica a critério do mestre — critério que o jogo
   * não tem. Quem quiser o vão bate nele, e o fogo contra o GELO vale em dobro, que é a letra da
   * magia.
   */
  golpearMuralha(attacker, casa, weaponId = null) {
    const zona = this.muralhaEm(casa.x, casa.y);
    if (!zona) return { ok: false, why: 'não há muralha nessa casa' };
    const continuando = attacker.actionUsed && (attacker.ataquesRestantes ?? 0) > 0;
    if (attacker.actionUsed && !continuando) return { ok: false, why: 'a ação deste turno já foi usada' };
    if (conditionEffects(attacker).incapacitated) return { ok: false, why: 'incapacitado não age' };
    const p = this.weaponAttackProfile(attacker, weaponId);
    const d = distanceFt(attacker.pos, casa);
    const alcance = p.ranged ? p.longRangeFt : p.reachFt;
    if (d > alcance) return { ok: false, why: `fora de alcance — ${d} pés, ${p.name} chega a ${alcance}` };
    // A muralha de PEDRA e a de GELO tapam a vista, então de longe não se mira o trecho de trás. De
    // perto, encostado nela, a linha de visão até a própria casa dela não existe — e aí vale o
    // encosto, que é como se bate numa parede.
    if (d > 5 && !this.field.hasLineOfSight(attacker.pos, casa)) return { ok: false, why: 'sem linha de visão até a muralha' };

    attacker.actionUsed = true;
    if (!continuando) attacker.golpeCedido = false;
    const golpes = continuando ? attacker.ataquesRestantes : this.golpesDoAtaque(attacker, attacker.attacks ? (weaponId ?? p.name) : weaponId).length;
    attacker.ataquesRestantes = 0;
    const antes = zona.pvDoTrecho.get(key(casa.x, casa.y)) ?? 0;
    let total = 0;
    for (let i = 0; i < golpes; i += 1) {
      if (!zona.pvDoTrecho.has(key(casa.x, casa.y))) break;
      // Objeto parado não desvia: sem vantagem, sem desvantagem, sem cobertura. Só a CA do livro.
      const r = attackRoll(this.rng, p.bonus ?? 0, zona.objeto.ca);
      if (!r.hit) {
        this.say('ataque', `${attacker.name} erra o golpe ${zona.em === 'no' ? 'no' : 'na'} ${zona.nome} (${r.total} contra CA ${zona.objeto.ca}).`);
        continue;
      }
      const dmg = damageRoll(this.rng, p.damage);
      // Crítico num objeto parado dobra os dados, como em qualquer alvo.
      let dano = r.critical ? dmg.total + damageRoll(this.rng, p.damage).rolls.reduce((a, b) => a + b, 0) : dmg.total;
      const vuln = zona.objeto.vulneravel && zona.objeto.vulneravel === (p.type ?? '').toLowerCase();
      if (vuln) dano *= 2;
      // o objeto imune a um tipo (as pás do moinho do Vazio: veneno e psíquico)
      if (zona.objeto.imune?.includes((p.type ?? '').toLowerCase())) dano = 0;
      total += dano;
      const sobra = Math.max(0, (zona.pvDoTrecho.get(key(casa.x, casa.y)) ?? 0) - dano);
      zona.pvDoTrecho.set(key(casa.x, casa.y), sobra);
      this.say('ataque', `${attacker.name} acerta ${zona.em === 'no' ? 'o' : 'a'} ${zona.nome}: ${dano}${vuln ? ` (${p.type} em dobro)` : ''}${r.critical ? ' (crítico)' : ''}. Restam ${sobra} PV neste trecho.`);
      if (sobra <= 0) this.abrirVaoNaMuralha(zona, casa);
    }
    this.onEvent({ type: 'golpeNaMuralha', actor: attacker, casa: { ...casa }, zona, dano: total });
    return { ok: true, dano: total, antes, restante: zona.pvDoTrecho.get(key(casa.x, casa.y)) ?? 0 };
  }

  /** O trecho caiu: a casa sai da muralha, o chão volta e a zona pode acabar inteira. */
  abrirVaoNaMuralha(zona, casa) {
    const k = key(casa.x, casa.y);
    zona.casas.delete(k);
    zona.pvDoTrecho.delete(k);
    this.say('magia', `O trecho ${zona.em === 'no' ? 'do' : 'da'} ${zona.nome} em ${casa.x},${casa.y} se desfaz e abre um vão.`);
    if (!zona.casas.size) {
      this.zonas = this.zonas.filter((z) => z !== zona);
      this.say('magia', `${zona.em === 'no' ? 'O' : 'A'} ${zona.nome} não resta de pé.`);
    }
    this.atualizarTerrenoDasZonas();
    this.onEvent({ type: 'vaoNaMuralha', casa: { ...casa }, zona });
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
    let golpes = continuando ? Array(attacker.ataquesRestantes).fill(arma) : this.golpesDoAtaque(attacker, arma);
    // Um golpe do multiataque trocado por outra coisa (a Pancada de Quitina do otyugh mutante).
    if (!continuando && attacker.trocouUmGolpe) { golpes = golpes.slice(1); attacker.trocouUmGolpe = false; }
    // O golpe cedido ao Comandante vale para ESTA ação de Ataque; o Surto de Ação seguinte volta ao normal.
    if (!continuando) attacker.golpeCedido = false;
    attacker.ataquesRestantes = 0;
    const k = this.turnoKey();
    attacker.acaoDeAtaque = { turno: k, armas: [...(attacker.acaoDeAtaque?.turno === k ? attacker.acaoDeAtaque.armas : []), ...golpes] };
    let anterior = null;
    const acertaram = new Set();
    attacker.naAcaoDeAtaque = true;
    try {
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
      // `seAcertar` (o grick): o golpe seguinte só sai se o anterior acertou —
      // o bico só morde quem os tentáculos agarraram.
      if (i > 0 && attacker.multiattack?.seAcertar && !anterior?.hit) break;
      // O GOLPE CONDICIONAL (o grick alfa: o Bico só se os Tentáculos acertaram NESTA ação): `condicional` diz, por golpe,
      // qual tem de ter acertado antes. Não acertou, ele não sai — e os outros seguem.
      const exigeAcerto = attacker.multiattack?.condicional?.[golpe];
      if (exigeAcerto && !acertaram.has(exigeAcerto)) continue;
      anterior = this.resolveAttack(attacker, target, {
        weaponId: golpe,
        disadvantage: attacker.multiattack?.secondAtDisadvantage && i === 1,
      });
      if (anterior?.hit) acertaram.add(golpe);
      // GOLPE RÁPIDO: o ataque a mais que a vantagem comprou, no mesmo alvo.
      if (attacker.golpeRapidoGanho) { attacker.golpeRapidoGanho = false; golpes.push(golpe); }
      // AS GARRAS DA FERA: um golpe de garra a mais, uma vez por turno.
      if (Sub.garraAMais(this, attacker, golpe)) golpes.push(golpe);
      // RAJADA DO PERSEGUIDOR: o erro vira outro ataque, uma vez por turno.
      if (Sub.rajadaDoPerseguidor(this, attacker, anterior)) golpes.push(golpe);
    }
    } finally { attacker.naAcaoDeAtaque = false; }
    // EMBOSCADOR TEMÍVEL (Perseguidor Sombrio): na 1ª rodada, um ataque a mais.
    if (!target.dead) Sub.golpeDoEmboscador(this, attacker, target, arma);
    // A PRESSA DO GOLEM: uma pancada a mais, como ação bônus, no turno em que ela veio.
    if (attacker.pancadaDaPressa && !attacker.bonusUsed && !attacker.dead && !target.dead && this.canAttack(attacker, target, arma).ok) {
      attacker.pancadaDaPressa = false;
      attacker.bonusUsed = true;
      this.say('recurso', `${attacker.name} bate de novo, rápido demais para o tamanho (Pressa).`);
      this.resolveAttack(attacker, target, { weaponId: arma });
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
    // LÂMINA SEDENTA (invocação, Pacto da Lâmina, 5º): um ataque a mais com a arma do pacto.
    const sedenta = attacker.features?.includes('thirstingBlade') && attacker.features?.includes('pactOfTheBlade') ? 1 : 0;
    // Com um ataque cedido ao companheiro (Senhor das Feras), o patrulheiro faz um golpe a menos.
    // RECARGA (a besta): um disparo por ação, por mais ataques que o herói tenha — o Especialista em Besta ignora.
    if (!attacker.attacks && (WEAPONS[arma ?? attacker.equippedWeapon]?.props ?? []).includes('recarga') && !temTalento(attacker, 'especialistaEmBesta')) return [arma];
    // TRANSFORMAÇÃO DE TENSER: um ataque a mais (o Ataque Extra que a magia dá não soma ao da classe).
    const tenser = hasCondition(attacker, 'transformacaoDeTenser') || hasCondition(attacker, 'aparenciaInferior') || hasCondition(attacker, 'aparenciaSuperior') ? 1 : 0;
    // CONQUISTADOR INVENCÍVEL (Conquista, 20º): um ataque a mais, por cima do Ataque Extra.
    // e o EU ASTRAL DESPERTO (monge, 17º): três golpes com os braços astrais
    const invencivel = (hasCondition(attacker, 'conquistadorInvencivel') ? 1 : 0) + Sub.golpeAstralAMais(attacker, arma);
    if (!attacker.attacks) return Array(Math.max(1, 1 + invencivel + Math.max(attacker.ataquesExtras ?? 0, sedenta, tenser) - (attacker.comandouNoTurno ? 1 : 0) - (attacker.golpeCedido ? 1 : 0))).fill(arma);
    // MULTIATAQUE COM DADO (o fungo violeta: 1d4 Toques Apodrecidos). Rola-se a cada ação, e não uma vez no
    // bloco: um fungo que toca três vezes num turno pode tocar uma no seguinte, que é o que o dado quer dizer.
    if (ma?.countDados) {
      const n = Math.max(1, roll(this.rng, ma.countDados).total);
      return Array(n).fill(arma);
    }
    // A OUTRA FORMA DO MULTIATAQUE (a medusa e o wight: três golpes de perto OU dois tiros de arco). `porArma` diz
    // quantas vezes sai a arma que não está na sequência.
    if (ma?.porArma?.[arma]) return Array(ma.porArma[arma]).fill(arma);
    // AS CABEÇAS DA HIDRA: uma mordida por cabeça.
    if (attacker.cabecas) return Array(attacker.cabecas).fill(arma);
    if (!ma || ma.count <= 1) return [arma];
    // AS SEQUÊNCIAS ALTERNATIVAS (o livro: "uma mordida e duas garras, OU três espinhos da cauda"; "só um dos golpes pode
    // ser a mordida"): vale a primeira que tem a arma escolhida, inteira. Arma fora de todas: um golpe só.
    if (ma.sequencias) return [...(ma.sequencias.find((s) => s.includes(arma)) ?? [arma])];
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
  danoPorTipo(target, amount, type, magico = false, deArma = false, semResistencia = false) {
    if (!type) return amount;
    if (target.immune?.includes(type) || target.doItem?.imune?.includes(type)) return 0;
    if (!magico && target.immuneNaoMagico?.includes(type)) return 0;
    if ((target.conditions ?? []).some((c) => CONDITIONS[c.id]?.imuneADanos?.includes(type) || (CONDITIONS[c.id]?.imuneTipoDado && c.data?.tipo === type))) return 0;
    if (Sub.imuneComoSubclasse(target, type) || Sub.imuneDaTempestade(target, type)) return 0;
    // a AURA DE VIDA (necrótico) e a AURA DE PUREZA (veneno): resistência a quem está a 9 m de quem a mantém
    const naAuraResiste = Livro.resisteNaAura(this, target, type);
    // Silêncio: onde não passa som, não há trovão.
    if (type === 'trovejante' && this.zonasEm(target.pos).some((z) => z.silencio)) return 0;
    let out = amount;
    // Proteção contra Lâminas: resistência que só vale contra golpe de arma.
    const porCondicao = (target.conditions ?? []).some((c) => {
      const def = CONDITIONS[c.id];
      if (def?.resisteTudo && !def.resisteTudoExceto?.includes(type)) return true;
      // ESPÍRITO DO URSO (bárbaro Totêmico): em Fúria, resistência a todo dano, menos psíquico.
      if (c.id === 'furia' && target.features?.includes('bearSpirit') && type !== 'psíquico') return true;
      if (def?.resisteTipoDado && c.data?.tipo === type) return true;
      // Forma Gasosa: o livro dá resistência a TODO dano não mágico — fogo e
      // ácido de fonte comum inclusive, não só o aço.
      if (!magico && def?.resisteNaoMagicoTudo) return true;
      if (!magico && def?.resisteNaoMagico?.includes(type)) return true;
      return def?.resiste?.includes(type) && (!def.soDeArma || deArma);
    }) || naAuraResiste;
    // RESILIÊNCIA INFERNAL: a resistência escolhida não vale contra arma mágica ou de prata.
    const infernal = target.resistenciaInfernal === type && !(magico && deArma);
    // Resistências de subclasse: Acostumado à Morte (necrótico), Pedra do Transmutador (fogo, frio, elétrico) e Resistência a Magia
    // (todo dano de magia: mágico e que não vem de arma).
    const tf = target.features ?? [];
    const porCaracteristica = (type === 'necrótico' && tf.includes('inuredToUndeath')) || (type === 'fogo' && tf.includes('stoneResistFire'))
      || (type === 'frio' && tf.includes('stoneResistCold')) || (type === 'elétrico' && tf.includes('stoneResistLightning'))
      || (type === 'ácido' && tf.includes('stoneResistAcid')) || (type === 'trovejante' && tf.includes('stoneResistThunder'))
      || (type === 'ácido' && tf.includes('stoneResistAcid')) || (type === 'trovejante' && tf.includes('stoneResistThunder'))
      || (!magico && ['concussão', 'cortante', 'perfurante'].includes(type) && tf.includes('avatarOfBattle'))
      || (type === 'psíquico' && tf.includes('thoughtShield'))
      || (magico && !deArma && tf.includes('spellResistance'))
      || (magico && !deArma && this.paladinosDaAura(target, 'auraOfWarding').length > 0)
      // as subclasses dos livros: a Alma da Tempestade, a Tempestade Protetora, a Alma e o Santo da Forja
      || Sub.resisteComoSubclasse(this, target, type, magico) || Sub.resisteDaTempestade(target, type) || Sub.resisteRadiante(target, type)
      || Sub.resisteNasEstrelas(target, type) || Sub.resistePsiquico(target, type);
    if (!semResistencia && (porCondicao || infernal || porCaracteristica || target.resist?.includes(type) || target.doItem?.resiste?.includes(type) || (!magico && (target.resistNaoMagico?.includes(type) || target.doItem?.resisteNaoMagico?.includes(type))))) out = Math.floor(out / 2);
    if (target.vulnerable?.includes(type) || target.doItem?.vulneravel?.includes(type) || (target.conditions ?? []).some((c) => { const d = CONDITIONS[c.id]; return d?.vulnerabilidadeTotal || d?.vulnerabilidade?.includes?.(type); })) out *= 2;
    return out;
  }

  /**
   * ABSORVER ELEMENTOS (Xanathar): reação de quem sofre ácido, frio, fogo, elétrico ou trovejante — resistência a esse
   * tipo até o começo do próximo turno, valendo já para o dano que a disparou, e o próximo acerto corpo a corpo soma 1d6
   * dele. Automática e só quando vale o espaço: o golpe de 8 ou mais, ou o que derrubaria.
   */
  absorverElementos(c, type, amount) {
    if (!['ácido', 'frio', 'fogo', 'elétrico', 'trovejante'].includes(type) || c.dead || c.reactionUsed || conditionEffects(c).incapacitated) return;
    if (!magiasProntas(c).some((id) => SPELLS[id]?.absorveElementos)) return;
    if (this.danoPorTipo(c, 2, type) < 2) return;
    if (amount < 8 && amount < c.hp + (c.tempHp ?? 0)) return;
    const slots = c.spellcasting?.slots ?? [];
    const circulo = slots.findIndex((n, i) => i >= 1 && n > 0);
    if (circulo < 1) return;
    slots[circulo] -= 1;
    c.reactionUsed = true;
    addCondition(c, 'elementosAbsorvidos', { rounds: 1, quando: 'inicio', lado: c.side, source: c.id, data: { tipo: type } });
    addCondition(c, 'cargaElemental', { rounds: 2, quando: 'fim', lado: c.side, source: c.id, data: { tipo: type, dadosNoAcerto: `${circulo}d6` } });
    this.say('reacao', `${c.name} absorve o ${type} (Absorver Elementos, ${circulo}º círculo): resistência até o próximo turno, e o próximo golpe de perto leva ${circulo}d6 dele.`);
  }

  /**
   * O que as passivas fazem no COMEÇO do turno de quem as tem:
   *   SOBREVIVENTE (Campeão, 18º)  com metade dos PV ou menos (e ao menos 1), recupera 5 + CON.
   */
  comecoDoTurnoPassivo(c) {
    if (c.dead || !c.features?.includes('survivor')) return;
    if (c.hp > 0 && c.hp <= Math.floor(maxHpEfetivo(c) / 2)) {
      const curou = this.heal(c, 5 + Math.max(0, abilityMod(c.abilities.con)), c);
      if (curou) this.say('cura', `${c.name} se recompõe (Sobrevivente): +${curou} PV.`);
    }
  }

  /**
   * O FIM DA FÚRIA, conferido no começo do turno do bárbaro.
   *
   * O SRD diz que ela acaba se, no turno dele, o bárbaro não ATACAR ninguém
   * hostil e não tiver SOFRIDO dano desde o turno anterior. `furiaAgiu`
   * guarda as duas coisas: o ataque marca na hora de resolver, o dano marca
   * em `applyDamage`, e entrar em fúria já marca — senão ela morria antes do
   * primeiro golpe.
   *
   * Os dez turnos de duração são contados pela própria condição.
   */
  fimDaFuria(c) {
    if (!hasCondition(c, 'furia')) {
      // FRENESI (Berserker, 3º): quando a fúria em que ele atacou como ação bônus acaba, vem um nível de exaustão.
      if (c.frenesiNaFuria) {
        c.frenesiNaFuria = false;
        mudarExaustao(c, 1);
        this.say('condicao', `${c.name} sai do frenesi e fica exausto (1 nível).`);
      }
      c.furiaAgiu = false;
      return;
    }
    // FÚRIA PERSISTENTE (bárbaro, 15º): a fúria não acaba por falta de ataque ou de dano; só se ele cair ou a encerrar.
    if (!c.furiaAgiu && !c.features?.includes('persistentRage')) {
      removeCondition(c, 'furia');
      this.say('recurso', `A fúria de ${c.name} passa: um turno sem atacar nem apanhar.`);
    }
    c.furiaAgiu = false;
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
  testeDeAtributo(actor, hab, bonus, rotulo = '', { pericia = null } = {}) {
    const fx = conditionEffects(actor);
    let r = d20(this.rng, bonus, {
      // MANOBRA ELEGANTE (Espadachim, 13º): vantagem na próxima Acrobacia ou Atletismo
      advantage: fx.vantagemTeste.includes(hab) || fx.vantagemSoTeste.includes(hab) || Sub.usaManobraElegante(actor, pericia) || Sub.forcaDoUrso(this, actor, hab)
        || (['intuicao', 'intimidacao'].includes(pericia) && hasCondition(actor, 'semblanteAstral'))
        // ATLETA SEM IGUAL e LENDA VIVA (Glória)
        || Sub.vantagemDeAtleta(actor, pericia) || Sub.vantagemDaLenda(actor, hab)
        // CANÇÃO DA LÂMINA (Acrobacia) e UM COM A PALAVRA (Escribas, Arcanismo)
        || (pericia === 'acrobacia' && Sub.cantando(actor)) || (pericia === 'arcanismo' && !!actor.features?.includes('oneWithTheWord')),
      disadvantage: fx.desvantagemTeste.includes(hab) || fx.desvantagemSoTeste.includes(hab)
        || (!!actor.armorUntrained && (hab === 'str' || hab === 'dex')),
    });
    // o DRAGÃO da Forma Estrelada: 9 ou menos no d20 de INT e SAB conta como 10.
    // e o TRANSE DA ORDEM (Alma Mecânica), em todo teste
    if ((Sub.pisoDoDragao(actor, hab) || Sub.pisoDaOrdem(actor)) && r.natural < 10) r = { ...r, natural: 10, total: 10 + bonus };
    // LÍNGUA DE PRATA (Eloquência): na Persuasão e na Enganação, 9 ou menos no d20 conta como 10.
    if (Sub.linguaDePrata(actor, pericia) && r.natural < 10) r = { ...r, natural: 10, total: 10 + bonus };
    // As passivas do dado: Sorte (halfling), Talento Confiável (ladino, 11º), Poder Indomável (bárbaro, 18º).
    r = ajustarTeste(this.rng, actor, r, bonus, { ability: hab, treinada: pericia ? treinadoEm(actor, pericia) : false });
    if (r.passivas?.length) this.say('recurso', `${actor.name}: ${r.passivas.join(' e ')} no teste${rotulo ? ` de ${rotulo}` : ''}.`);
    let total = r.total;
    const extras = [];
    for (const cond of [...(actor.conditions ?? [])]) {
      const def = CONDITIONS[cond.id];
      const dados = def?.testeBonusDice ?? (def?.dadoNaData ? cond.data?.dado : null);
      if (!dados) continue;
      if (def.habsDoBonus && !def.habsDoBonus.includes(hab)) continue;
      const d = roll(this.rng, dados);
      total += d.total;
      extras.push(`${def.name.toLowerCase()} ${dados}[${d.rolls.join('+')}]`);
      if (def.consumidaNoTeste) {
        removeCondition(actor, cond.id);
        const dono = this.combatants.find((c) => c.id === cond.source);
        if (dono?.concentrating?.condition === cond.id) dono.concentrating = null;
      }
    }
    const modo = r.mode !== 'normal' ? ` (${r.mode})` : '';
    const conta = `${rotulo ? `${rotulo} ` : ''}d20[${r.rolls.join('/')}] ${formatModifier(bonus)}${extras.length ? ` + ${extras.join(' + ')}` : ''} = ${total}${modo}`;
    return { ...r, total, conta };
  }

  /**
   * A Brisa das Cinzas: toda criatura VIVA a 1,5 m de `zumbi` faz resistência de
   * CON CD 10 ou fica com desvantagem em ataques, resistências e testes por 1
   * minuto. Mortos-vivos e construtos não respiram a cinza. Parede de borda no
   * meio protege: a cinza não atravessa (`contato`).
   */
  brisaDasCinzas(zumbi) {
    for (const c of this.combatants) {
      if (c === zumbi || c.dead || !c.pos || !zumbi.pos) continue;
      if (c.tipo === 'morto-vivo' || c.tipo === 'constructo' || c.traits?.includes('undeadFortitude')) continue;
      if (distanceFt(c.pos, zumbi.pos) > 5 || !this.field.contato(c.pos, zumbi.pos)) continue;
      const save = this.resistencia(c, 'con', 10);
      this.explicarResistencia(c, 'con', 10, save, {
        contra: 'Brisa das Cinzas',
        seSucesso: 'respira fundo e não engole a cinza',
      });
      if (save.success) continue;
      addCondition(c, 'brisaDasCinzas', { rounds: 10, source: zumbi.id, data: { repete: 'sempre', save: 'con', dc: 10 } });
      this.say('condicao', `${c.name} engole a cinza e fica tonto: desvantagem em tudo por um minuto.`);
    }
  }

  /**
   * A PROTEÇÃO ARCANA (mago de Abjuração, 2º) absorve o dano antes dos PV; a PROJETADA (6º) faz o mesmo por um aliado a até 9 m, com a
   * reação. Devolve o dano que sobrou.
   */
  protecaoArcana(alvo, dano) {
    let dono = alvo.wardHp > 0 ? alvo : null;
    if (!dono) {
      dono = this.alliesOf(alvo).find((a) => a.features?.includes('projectedWard') && a.wardHp > 0 && !a.reactionUsed
        && !conditionEffects(a).incapacitated && distanceFt(a.pos, alvo.pos) <= 30 && this.field.hasLineOfSight(a.pos, alvo.pos));
      if (dono) dono.reactionUsed = true;
    }
    if (!dono) return dano;
    const absorve = Math.min(dono.wardHp, dano);
    dono.wardHp -= absorve;
    this.say('recurso', `${dono === alvo ? 'A proteção arcana de ' : `${dono.name} estende a proteção arcana sobre ${alvo.name}: `}${dono === alvo ? `${dono.name} ` : ''}absorve ${absorve} de dano (restam ${dono.wardHp} na proteção).`);
    return dano - absorve;
  }

  applyDamage(target, amount, type, source = null, { critical = false, magico = false, deArma = false, corpoACorpo = false, deDentro = false, transferido = false, deAtaque = false } = {}) {
    if (amount <= 0 || target.dead) return;
    // O GOLPE NÃO LETAL que já derrubou: o resto do mesmo golpe (o Golpe Divino que vem depois) não mata o desacordado
    if (target.capturado && target.hp <= 0 && source?.naoLetal && this.golpeDePerto === source) return;
    // Fora de alcance nada atinge: o Plano Etéreo e quem está dentro da pedra. O engolido é atingido por DENTRO: o ácido
    // de quem o engoliu, e o golpe de quem está dentro junto com ele.
    const dentro = Livro.engolidoPor(target);
    if (conditionEffects(target).inalcancavel && !deDentro && !(dentro && source && (source.id === dentro || Livro.engolidoPor(source) === dentro))) return;
    if (this.imuneAMagiaEmCurso(target)) {
      // a CARAPAÇA REFLETORA da tarrasca: num 6, o dano volta para quem lançou
      const quem = this.conjuradorEmCurso;
      if (quem && !quem.dead && Livro.refleteAMagia(this, quem, target, this.magiaEmCurso)) { this.applyDamage(quem, amount, type, target, { magico: true }); return; }
      this.say('dano', `${target.name} é imune a ${this.magiaEmCurso.name}: nada.`);
      return;
    }
    // ABSORÇÃO DE RAIOS (o monte errante): o raio não fere, cura.
    if (type === 'elétrico' && target.traits?.includes('absorcaoDeRaios')) {
      const curou = this.heal(target, amount, target);
      this.say('cura', `O raio corre pelas raízes de ${target.name} e o engorda: +${curou} PV (Absorção de Raios).`);
      return;
    }
    // ABSORÇÃO DE FOGO (o golem de ferro): o fogo cura.
    if (type === 'fogo' && target.traits?.includes('absorcaoDeFogo')) {
      const curou = this.heal(target, amount, target);
      this.say('cura', `O fogo entra no ferro de ${target.name} e o refaz: +${curou} PV (Absorção de Fogo).`);
      return;
    }
    // ABSORÇÃO DE ÁCIDO (o golem de argila): o ácido cura.
    if (type === 'ácido' && target.traits?.includes('absorcaoAcida')) {
      const curou = this.heal(target, amount, target);
      this.say('cura', `O ácido escorre pelo barro de ${target.name} e o refaz: +${curou} PV (Absorção de Ácido).`);
      return;
    }
    if (['fogo', 'radiante'].includes(type) && target.traits?.includes('regeneracaoVingativa')) target.regenBloqueada = true;
    if (target.regeneracao?.bloqueia?.includes(type)) target.regenDoLivroBloqueada = true;
    if (type === 'fogo' && target.cabecas != null) target.queimouAsCabecas = true;
    // o OLHAR VINGATIVO paralisa até o revenant ferir o alvo
    const parado = getCondition(target, 'paralisado');
    if (parado?.data?.olharDe && source?.id === parado.data.olharDe) removeCondition(target, 'paralisado');
    const bruto = amount;
    // Elo de Proteção: confere antes — um elo que acaba agora não resiste a este golpe.
    const doElo = this.donoDoElo(target);
    // ABSORVER ELEMENTOS: a reação que corta o dano elemental pela metade (antes da conta da resistência).
    this.absorverElementos(target, type, amount);
    // RUÍNA ELEMENTAL: a primeira vez em cada turno que sofre o tipo marcado, mais 2d6 dele.
    const ruina = getCondition(target, 'ruinaElemental');
    if (ruina && ruina.data?.tipo === type && ruina.data.turno !== this.turnoKey()) {
      ruina.data.turno = this.turnoKey();
      const r2 = damageRoll(this.rng, '2d6');
      amount += r2.total;
      this.say('magia', `A Ruína Elemental pesa em ${target.name}: +${r2.total} de ${type}.`, `2d6[${r2.rolls.join('+')}]`);
    }
    // MESTRE EM ARMADURAS PESADAS (talento): −3 antes da resistência, que o livro aplica depois de tudo.
    amount = reducaoDaArmaduraPesada(target, amount, type, { magico, deArma });
    // ADEPTO ELEMENTAL (talento): a magia em curso de quem o tem, do elemento dele, passa por cima da resistência.
    const semResistencia = (magico && !deArma && this.conjuradorEmCurso === source && adeptoIgnoraResistencia(source, type))
      || getCondition(target, 'ruinaElemental')?.data?.tipo === type
      // DESTRUIÇÃO INESCAPÁVEL (Domínio da Morte, 6º)
      || Sub.destruicaoInescapavel(source, type, magico);
    const antesDoTipo = amount;
    // o golpe da ESPADA DA RESPOSTA passa por cima de resistência e de imunidade
    if (!(source?.respostaAgora && deArma)) amount = this.danoPorTipo(target, amount, type, magico, deArma, semResistencia);
    // PROTETORES ANCESTRAIS: quem o marcado acerta com um ataque (fora o bárbaro) resiste ao dano. Resistência não soma com
    // resistência, e cancela a vulnerabilidade.
    const guardiao = amount > 0 ? Sub.resisteAosMarcados(this, target, source, deArma || deAtaque) : null;
    if (guardiao) {
      const novo = amount > antesDoTipo ? antesDoTipo : amount === antesDoTipo ? Math.floor(amount / 2) : amount;
      if (novo !== amount) this.say('recurso', `Os ancestrais de ${guardiao.name} amparam ${target.name}: ${amount} vira ${novo} (Protetores Ancestrais).`);
      amount = novo;
    }
    // MANOBRA DE PROTEÇÃO: o golpe que ainda acertou é resistido.
    if (target.resisteAoGolpe && amount > 0 && amount >= antesDoTipo) {
      const novo = amount > antesDoTipo ? antesDoTipo : Math.floor(amount / 2);
      this.say('recurso', `${target.name} amortece o golpe: ${amount} vira ${novo} (Manobra de Proteção).`);
      amount = novo;
    }
    // CAMINHO PARA A SEPULTURA: o golpe que abriu a maldição fere em dobro.
    amount = Sub.danoNaSepultura(target, amount, antesDoTipo);
    // MARCA INABALÁVEL: o marcado que fere outro dá ao cavaleiro o golpe de ação bônus.
    if (amount > 0) Sub.marcadoFeriu(this, source, target);
    // A AURA DO GUARDIÃO e o EMISSÁRIO DA REDENÇÃO (Juramento da Redenção)
    amount = Sub.danoNaRedencao(this, target, source, amount, antesDoTipo, { transferido });
    // VÍNCULO PROTETOR (Paz, 6º): outro vinculado toma o golpe que derrubaria.
    amount = Sub.vinculoProtetor(this, target, source, amount, { transferido });
    // LEALDADE DIVINA (Coroa, 7º): o paladino colado toma o golpe que derrubaria o aliado, sem nada que o reduza.
    if (!transferido && amount > 0) {
      const leal = Sub.lealdadeDivina(this, target, amount);
      if (leal) { this.applyDamage(leal, amount, null, source, { transferido: true }); amount = 0; }
    }
    // RESPOSTA INSTÁVEL (Magia Selvagem do bárbaro, 10º)
    if (amount > 0) Sub.respostaInstavel(this, target, amount);
    if (amount > 0) Sub.depoisDoDanoNaRedencao(this, target, source, amount, { deAtaque: deArma || deAtaque });
    this.ultimoDano = Math.max(0, amount);
    // AS CABEÇAS DA HIDRA: 25 de dano num turno arrancam uma; sem cabeça nenhuma, ela morre
    if (target.cabecas != null && amount > 0 && this.cabecasDaHidra(target, amount)) amount = Math.max(amount, target.hp + (target.tempHp ?? 0));
    // BRISA DAS CINZAS (zumbi das cinzas): a primeira vez que ele leva dano, a
    // cinza solta do corpo. Conta no dano que CHEGA (já descontada a resistência),
    // e dispara mesmo no golpe que o derruba.
    if (amount > 0 && target.traits?.includes('brisaDasCinzas') && !target.brisaDasCinzasUsada) {
      target.brisaDasCinzasUsada = true;
      this.brisaDasCinzas(target);
    }
    if (amount !== bruto) {
      // ZERO NÃO É IMUNIDADE: 1 de dano contra resistência cai para 0 (metade, para baixo), e o registro dizia
      // "imune" — o quasit, resistente a fogo, aparecia imune a fogo num golpe e resistente no seguinte. Imune é
      // quem zera o que a metade não zeraria:
      // quem zera 2 de dano é imune (a metade de 2 é 1).
      const como = amount > bruto ? 'vulnerável'
        : amount === 0 && this.danoPorTipo(target, 2, type, magico, deArma) === 0 ? 'imune'
          : 'resistente';
      this.say('dano', `${target.name} é ${como} a ${type}: ${bruto} vira ${amount}.`);
    }
    // O VÍNCULO DO GUARDIÃO-ESCUDO: metade do que ficou, depois da resistência (e da mensagem dela).
    amount = this.vinculoDoAmuleto(target, amount);
    // O OBELISCO DA ÂNIMA: não tem PV nem se destrói; o que ele levaria, depois das imunidades dele, vai para o fanático
    // mais perto (`contragolpeDoObelisco`).
    if (target.contragolpe) { if (amount > 0) this.contragolpeDoObelisco(target, amount, type, source); return; }
    // ESQUIVA SOBRENATURAL: o ladino usa a reação e o golpe que ele VÊ chegar
    // sai pela metade. Automática, como a Proteção: é reação que só serve
    // para isto, e perguntar a cada golpe pararia a luta.
    if (source && deArma && amount > 0 && !target.reactionUsed
      && target.features?.includes('uncannyDodge')
      && !conditionEffects(target).incapacitated && !hasCondition(target, 'cego')
      && this.field.hasLineOfSight(target.pos, source.pos)) {
      target.reactionUsed = true;
      amount = Math.floor(amount / 2);
      this.say('recurso', `${target.name} se desvia: o golpe sai pela metade (${amount}).`);
    }
    // RESISTÊNCIA DA PEDRA (golias): a reação que tira 1d12 + CON do golpe que dói
    if (amount > 0) amount = Raca.resistenciaDaPedra(this, target, amount);
    // a PROTEÇÃO ARCANA do abjurador leva o dano antes dele; a AVERSÃO AO FOGO do oblex
    if (amount > 0) amount = Livro.protecaoArcana(this, target, amount);
    Livro.aversaoAoFogo(this, target, type, amount);
    // ESCUDO ESPIRITUAL (Guardião Ancestral, 6º): a reação do bárbaro em Fúria corta o dano de um aliado a até 9 m.
    if (amount > 0) amount = Sub.escudoEspiritual(this, target, source, amount, { deAtaque: deArma || deAtaque });
    // CAMPO PROTETOR (Guerreiro Psiônico) e CORPO DO EU ASTRAL (monge, 11º): as reações que tiram dano
    if (amount > 0) amount = Sub.campoProtetor(this, target, source, amount);
    if (amount > 0) amount = Sub.desvioAstral(this, target, amount, type);
    // DISPERSÃO DO ENXAME (Guardião do Enxame, 15º): a reação resiste ao dano e leva o patrulheiro para longe.
    if (amount > 0) amount = Sub.dispersaoDoEnxame(this, target, source, amount);
    // BASTIÃO DA LEI (Alma Mecânica), ESPIRAL GUARDIÃ (Insondável) e CANÇÃO DA DEFESA (Lâmina Cantante)
    if (amount > 0) amount = Sub.danoTce4(this, target, source, amount);
    // ELO APERFEIÇOADO (Guardião Dracônico)
    if (amount > 0) amount = Sub.danoDosLivros2(this, target, source, amount);
    // APARAR (Mestre de Batalha): reação e um dado; um golpe corpo a corpo que acerta perde o dado + o modificador de Destreza do dano.
    if (source && deArma && corpoACorpo && amount > 0 && !target.reactionUsed && target.features?.includes('parry')
      && (target.resources?.superiorityDice ?? 0) > 0 && !conditionEffects(target).incapacitated) {
      target.resources.superiorityDice -= 1;
      target.reactionUsed = true;
      const reduz = roll(this.rng, this.dadoDeSuperioridade(target)).total + abilityMod(target.abilities?.dex ?? 10);
      const cheio = amount;
      amount = Math.max(0, amount - reduz);
      this.say('recurso', `${target.name} apara o golpe (Aparar): -${Math.max(0, reduz)}, o dano vai de ${cheio} a ${amount}.`);
    }
    // ESCUDO DE PENSAMENTOS (bruxo do Grande Antigo, 10º): quem lhe causa dano psíquico sofre o mesmo tanto.
    if (amount > 0 && type === 'psíquico' && source && source !== target && source.side !== target.side && target.features?.includes('thoughtShield') && !this.refletindo) {
      this.refletindo = true;
      try {
        this.say('recurso', `${target.name} devolve o dano psíquico a ${source.name} (Escudo de Pensamentos).`);
        this.applyDamage(source, amount, 'psíquico', target, { magico: true });
      } finally { this.refletindo = false; }
    }
    // ABAFAR ELEMENTOS (clérigo da Natureza): reação; o alvo (ou um aliado a até 9 m do clérigo) resiste a este dano elemental.
    if (amount > 0 && amount === bruto) amount = this.abafarElementos(target, amount, type);
    // IRA DA TEMPESTADE (clérigo da Tempestade): reação ao golpe corpo a corpo que o acerta.
    if (source && deArma && amount > 0) this.iraDaTempestade(target, source);
    // DEFLETIR PROJÉTEIS (monge, 3º): reação; um ataque À DISTÂNCIA com arma que acerta o monge perde 1d10 + DES + nível do dano. Se zerar
    // e ele tiver 1 de ki, devolve o projétil: um ataque à distância dele contra quem atirou, com o mesmo dano.
    if (source && deArma && !corpoACorpo && amount > 0 && !target.reactionUsed && target.features?.includes('deflectMissiles')
      && !conditionEffects(target).incapacitated && !hasCondition(target, 'cego')) {
      const reduz = this.rng.die(10) + abilityMod(target.abilities.dex) + (target.level ?? 1);
      target.reactionUsed = true;
      const cheio = amount;
      amount = Math.max(0, amount - reduz);
      this.say('recurso', `${target.name} defleta o projétil: -${reduz}, o dano vai de ${cheio} a ${amount}.`);
      if (amount === 0 && (target.resources?.ki ?? 0) > 0 && !source.dead && distanceFt(target.pos, source.pos) <= 60) {
        target.resources.ki -= 1;
        const d = this.rng.die(20);
        const acerta = d === 20 || (d !== 1 && d + abilityMod(target.abilities.dex) + proficiencyBonus(target.level ?? 1) >= caEfetiva(source));
        this.say('recurso', `${target.name} gasta 1 ki e devolve o projétil: ${acerta ? 'acerta' : 'erra'} ${source.name}.`);
        if (acerta) this.applyDamage(source, cheio, type, target, { deArma: true });
      }
    }
    // DIVISÃO (Gelatina Ocre): o livro diz "ao ser ATINGIDA por dano cortante
    // ou elétrico", não "ao sofrer". A gelatina é imune aos dois, então aqui
    // `amount` já é 0 — e é exatamente por isso que a chamada vem ANTES do
    // retorno por imunidade: cortar a gelatina não a fere, parte ela em duas.
    this.dividir(target, type);
    if (amount <= 0) return;
    // PROTEÇÃO ARCANA e PROTEÇÃO PROJETADA (mago de Abjuração): a proteção leva o golpe no lugar do PV.
    amount = this.protecaoArcana(target, amount);
    if (amount <= 0) return;
    // PARAR O TEMPO acaba quando quem parou o tempo fere outra criatura
    if (source && source !== target && hasCondition(source, 'tempoParado')) { removeCondition(source, 'tempoParado'); this.say('magia', `O tempo volta a correr: ${source.name} feriu ${target.name}.`); }
    // TRANSFERÊNCIA DE DANO (o espreitador, o tapete sufocante): metade cai em quem ele agarra
    amount = Livro.transferirDano(this, target, amount, type, source, { critical, magico, deArma, corpoACorpo, transferido });
    if (amount <= 0) return;
    Livro.depoisDoDano(this, target, amount, type, source);
    // Apanhar também mantém a fúria de pé.
    if (hasCondition(target, 'furia')) target.furiaAgiu = true;
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
        if (s >= maxHpEfetivo(target)) this.morrer(target, 'dano maciço');
        return;
      }
      this.onEvent({ type: 'damage', target, amount, source });
      if (amount >= maxHpEfetivo(target)) { this.morrer(target, 'dano maciço'); return; }
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
      // a FOME DA BLACKRAZOR dura enquanto duram os PV temporários da alma devorada
      if (target.tempHp <= 0) removeCondition(target, 'almaDevorada');
    }
    // RESILIÊNCIA INFERNAL (bruxo Corruptor, 10º): a escolha do descanso é o tipo que mais machucou até agora.
    if (target.features?.includes('fiendishResilience') && type) {
      target.danoPorTipo ??= {};
      target.danoPorTipo[type] = (target.danoPorTipo[type] ?? 0) + amount;
    }
    target.hp -= left;
    // o VÉU PSÍQUICO de quem feriu se rasga, o EXPULSO pelo Vigilante volta a si, e o BALUARTE MORTAL bane
    if (amount > 0) Sub.depoisDoDanoTce3(this, target, source, { deAtaque: deArma || deAtaque });
    if (amount > 0) Sub.depoisDoDanoLivros2(this, target, source);
    // FORMA SELVAGEM: zerar os PV da fera não derruba o druida; ele volta à forma normal e o dano que sobrou desconta dos PV dele.
    if (target.formaSelvagem && target.hp <= 0) {
      const sobra = -target.hp;
      const daMagia = target.formaSelvagem.daMagia;
      if (daMagia) {
        const dono = this.combatants.find((c) => c.id === target.formaSelvagem.donoDaMagia);
        if (dono?.concentrating?.formas) dono.concentrating.targets = dono.concentrating.targets.filter((t) => t !== target);
      }
      this.say('condicao', `${target.name} perde a forma de ${target.formaSelvagem.nome} e volta ao normal${sobra ? ` (leva mais ${sobra})` : ''}.`);
      despirFera(target, sobra);
      this.onEvent({ type: 'damage', target, amount, source });
      this.onEvent({ type: 'voltouAoNormal', target });
      if (target.hp > 0) return;
    } else {
      this.onEvent({ type: 'damage', target, amount, source });
    }

    // GOLPE DO RELÂMPAGO (clérigo da Tempestade, 6º): dano elétrico em criatura Grande ou menor também a empurra 3 m.
    if (target.hp > 0 && type === 'elétrico' && source?.features?.includes('thunderboltStrike') && source !== target
      && !['enorme', 'imenso', 'colossal'].includes(String(target.size ?? '').toLowerCase())) this.empurrar(target, source.pos, 10);
    // FUGA NEBULOSA (bruxo da Arquifada, 6º): reação ao sofrer dano; teleporta 18 m e some até o próximo turno.
    if (target.hp > 0 && (!source || source.side !== target.side)) this.fugaNebulosa(target);
    // a ESPADA DA RESPOSTA revida e a ESPADA DA VINGANÇA prende o dono a quem feriu
    if (target.hp > 0 && amount > 0) this.armaQueResponde(target, source);
    // PROTEÇÃO CONTRA A MORTE (SRD): a PRIMEIRA vez que o alvo cairia a 0 PV
    // por dano, ele fica de pé com 1 PV e a magia acaba.
    //
    // Põe o PV e NÃO retorna: quem fica de pé com 1 PV sofreu dano como
    // qualquer um, e tudo o que o dano cobra de quem continua de pé vale para
    // ele. A primeira versão disto retornava aqui, e com isso o alvo mantinha a
    // concentração nas 40 medições de 40 (sem a magia, 3 de 40) e não acordava
    // do Sono. Deixar o fluxo cair no ramo de baixo resolve os dois de uma vez.
    if (target.hp <= 0 && hasCondition(target, 'protegidoDaMorte')) {
      target.hp = 1;
      removeCondition(target, 'protegidoDaMorte');
      // UMA fonte de dano pode ter várias parcelas (a aranha: perfurante mais
      // veneno). Sem esta marca, a primeira parcela gastava a magia e a segunda
      // derrubava o alvo no mesmo golpe — a magia paga e o herói no chão.
      this.salvosDaFonte?.add(target);
      this.say('recurso', `${target.name} devia cair, e a Proteção contra a Morte o segura de pé com 1 PV. A magia acaba aqui.`);
    } else if (target.hp <= 0 && this.salvosDaFonte?.has(target)) {
      target.hp = 1;
    }

    if (target.hp > 0) {
      if (target.concentrating) {
        if (this.danoDaFonte) this.danoDaFonte.set(target, (this.danoDaFonte.get(target) ?? 0) + amount);
        else this.concentrationCheck(target, amount, source);
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
      this.retaliacao(target, source);
      // DEFESAS SEDUTORAS: o encanto devolvido acaba se o enfeitiçado (ou um aliado dele) fere o bruxo.
      for (const m of this.combatants) {
        const e = getCondition(m, 'enfeiticado');
        if (e?.data?.fimSeFerirFonte && e.source === target.id && source && source.side === m.side) removeCondition(m, 'enfeiticado');
      }
      // Enfeitiçar Pessoa: dano de quem enfeitiçou (ou dos aliados dele) quebra.
      const encanto = getCondition(target, 'enfeiticado');
      const quemEncantou = encanto && this.combatants.find((x) => x.id === encanto.source);
      if (encanto && source && quemEncantou && source.side === quemEncantou.side && !encanto.data?.permanente && !encanto.data?.fimSeFerirFonte) {
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
        if (!CONDITIONS[cond.id]?.acordaComDano && !cond.data?.fimAoDano) continue;
        removeCondition(target, cond.id);
        this.say('condicao', `${target.name} desperta do ${CONDITIONS[cond.id].name.toLowerCase()} com o golpe.`);
      }
      // A FEBRE DO RISO: quem apanha faz Constituição CD 13 ou cai de rir por um minuto (repete no fim do turno)
      const febre = getCondition(target, 'febreDoRiso');
      if (febre && !(febre.data?.incubando > 0) && !hasCondition(target, 'gargalhando')) {
        const save = this.resistencia(target, 'con', 13, { contra: { condicao: 'gargalhando' } });
        const r = this.explicarResistencia(target, 'con', 13, save, { contra: 'a Febre do Riso', seSucesso: 'segura o riso' });
        if (!save.success) {
          addCondition(target, 'gargalhando', { rounds: 10, data: { repete: true, save: 'con', dc: 13 } });
          this.say('condicao', `A febre sobe com a dor: ${target.name} cai numa gargalhada que não para.`, r.conta);
        }
      }
      return;
    }

    // O DESPERTAR (os grandes wyrms do Fizban, os aspectos de Tiamat e de Bahamut): a primeira vez que cairia a 0 PV, volta
    // com os PV do bloco, o sopro recarregado e as resistências lendárias de volta.
    if (target.kind === 'npc' && target.despertar && !target.despertou) {
      target.despertou = true;
      target.hp = Math.min(maxHpEfetivo(target), target.despertar.pv);
      target.recarregando = {};
      if (target.resourcesMax?.resistenciaLendaria != null) (target.resources ??= {}).resistenciaLendaria = target.resourcesMax.resistenciaLendaria;
      else if (target.resources?.resistenciaLendaria != null && target.resistenciaLendariaInicial != null) target.resources.resistenciaLendaria = target.resistenciaLendariaInicial;
      this.say('recurso', `${target.name} devia cair e desperta: volta com ${target.hp} PV, o sopro pronto de novo (Despertar).`);
      this.onEvent({ type: 'despertar', target });
      return;
    }
    // MORTE INSTANTÂNEA: o que sobra do dano depois de zerar os PV, se chegar
    // ao máximo de PV, mata na hora.
    const sobra = -target.hp;
    target.hp = 0;
    this.quedasDaFonte?.set(target, sobra);
    // FÚRIA IMPLACÁVEL (bárbaro) e RESISTÊNCIA IMPLACÁVEL (meio-orc): cair a 0 PV SEM morrer na hora (dano maciço mata e
    // nada disto vale) deixa o herói de pé com 1 PV. Antes da queda da concentração: quem fica de pé segue concentrado, e
    // o dano cobra o teste de sempre.
    // FORÇA DO TÚMULO (Magia das Sombras, 1º): CAR com CD 5 + dano, e fica com 1 PV.
    if (target.kind === 'pc' && sobra < maxHpEfetivo(target) && Sub.forcaDoTumulo(this, target, amount, type, critical)) { this.quedasDaFonte?.delete(target); return; }
    // MAESTRIA DA MORTE (Longa Morte, 11º): 1 ki e fica com 1 PV
    if (target.kind === 'pc' && sobra < maxHpEfetivo(target) && Sub.maestriaDaMorte(this, target)) { this.quedasDaFonte?.delete(target); return; }
    if (target.kind === 'pc' && sobra < maxHpEfetivo(target) && this.cairImplacavel(target)) {
      if (target.concentrating) {
        if (this.danoDaFonte) this.danoDaFonte.set(target, (this.danoDaFonte.get(target) ?? 0) + amount);
        else this.concentrationCheck(target, amount, source);
      }
      return;
    }
    // Concentração não sobrevive à queda: inconsciente é incapacitado.
    this.dropConcentration(target);

    // TENACIDADE MORTOVIVA (SRD): o zumbi que cai a 0 PV faz resistência de
    // Constituição CD 5 + o dano levado e, passando, fica de pé com 1 PV. Não
    // vale contra dano radiante nem contra crítico.
    //
    // O traço estava declarado no bloco e descrito no jogo, mas não existia
    // aqui: medido, um zumbi de 3 PV levando 4 de cortante, que deveria
    // sobreviver 75% das vezes, sobreviveu 0 vezes em 200. São 12 zumbis no
    // Poço da Coruja Velha.
    const limiteImplacavel = target.traits?.includes('relentlessGiant') ? 10 : target.traits?.includes('relentless') ? 7 : 0;
    if (limiteImplacavel && amount <= limiteImplacavel && !target.implacavelUsado && target.kind === 'npc') {
      target.implacavelUsado = true;
      target.hp = 1;
      this.quedasDaFonte?.delete(target);
      this.say('recurso', `${target.name} devia cair e não cai: bufa, firma as patas e fica de pé com 1 PV (Implacável).`);
      return;
    }
    if (target.traits?.includes('undeadFortitude') && type !== 'radiante' && !critical) {
      const cd = 5 + amount;
      const save = this.resistencia(target, 'con', cd);
      this.explicarResistencia(target, 'con', cd, save, {
        contra: `Tenacidade Mortoviva (CD 5 + ${amount} de dano)`,
        seSucesso: 'fica de pé com 1 PV',
      });
      if (save.success) {
        target.hp = 1;
        this.quedasDaFonte?.delete(target);
        this.say('recurso', `${target.name} devia cair, e não cai: a carne morta se fecha e ele fica de pé com 1 PV.`);
        return;
      }
    }

    // GOLPE NÃO LETAL (Livro do Jogador): quem zera a vida de alguém com um
    // ataque corpo a corpo pode deixá-lo desacordado em vez de morto. O herói
    // escolhe isso antes (`naoLetal`, no menu do botão direito).
    // o que vem com o golpe de perto (o Golpe Divino, o veneno da lâmina) é o mesmo ataque: derruba sem matar também
    if (target.kind === 'npc' && (corpoACorpo || (source && this.golpeDePerto === source)) && source?.naoLetal) {
      addCondition(target, 'inconsciente');
      addCondition(target, 'caido');
      target.stable = true;
      target.capturado = true;
      this.say('morte', `${target.name} cai desacordado — vivo.`);
      this.soltarAgarroesDe(target);
      this.onEvent({ type: 'downed', target });
      return;
    }

    // O REFÉM não morre a 0 PV. Todo NPC que cai a 0 morre de uma vez neste
    // motor, e isso valia também para quem está amarrado com 1 PV esperando
    // resgate: uma Mãos Flamejantes mirada no captor matava o refém junto,
    // sem teste de morte e sem volta. Refém cai desacordado e estável.
    if (target.kind === 'npc' && target.refem) {
      addCondition(target, 'inconsciente');
      addCondition(target, 'caido');
      target.stable = true;
      this.say('morte', `${target.name} desmaia — vivo, mas não aguenta mais nada.`);
      this.soltarAgarroesDe(target);
      this.onEvent({ type: 'downed', target });
      return;
    }

    // O TROLL (o livro): a 0 PV ele cai, mas só morre se começar o turno a 0 PV sem regenerar (`inicioDoTurnoDoBloco`).
    if (target.kind === 'npc' && target.regeneracao?.naoMorreA0) {
      target.hp = 0;
      if (target.caidoRegenerando) return;
      target.caidoRegenerando = true;
      addCondition(target, 'inconsciente');
      addCondition(target, 'caido');
      // os tipos que a cortam são os do bloco (o troll: fogo e ácido; o vegepigmeu: frio, fogo e necrótico)
      const corta = target.regeneracao.bloqueia ?? [];
      const ou = corta.length > 1 ? `${corta.slice(0, -1).join(', ')} ou ${corta.at(-1)}` : corta[0];
      this.say('morte', `${target.name} desaba, mas a carne já começa a se fechar${ou ? `: sem ${ou}, ele levanta` : ''}.`);
      this.soltarAgarroesDe(target);
      this.onEvent({ type: 'downed', target });
      return;
    }
    if (target.kind === 'npc') {
      // O metamorfo disfarçado volta à forma verdadeira ao morrer (o livro).
      this.revelarDisfarce(target, 'ao cair');
      target.dead = true;
      target.morreuNaRodada = this.round;
      // o BERÇO do Bigby que cai solta o rebento do gigante: antes de qualquer conta de fim de luta
      Livro.despertarORebento(this, target, { MONSTERS, makeMonster });
      removeCondition(target, 'esquivando');
      this.say('morte', `${target.name} cai.`);
      this.explosaoMental(target);
      this.explosaoDePoeira(target);
      if (target.pedregulhos?.length) this.pedregulhosVoltamAPedra(target, `${target.name} caiu`);
      this.guardiaoSemMestre(target);
      this.aoMatar(source, target);
      Sub.guardiaoDasAlmas(this, target, MONSTERS[target.defId]?.hpDice);
      // a MALDIÇÃO DO LÂMINA MALDITA que se fecha (ou passa), o ESPECTRO AMALDIÇOADO, e o CÃO DO MAU AGOURO sem alvo
      Sub.aoMorrerNaMaldicao(this, target, source);
      // a INFESTAÇÃO FÚNGICA (Esporos) e as CHAMAS CAUTERIZANTES (Fogo Selvagem)
      Sub.infestacaoFungica(this, target);
      Sub.lembrancasDosFalecidos(this, target);
      // o DRACO que cai some: o patrulheiro o chama de novo
      if (target.invocado?.spellId === 'dracoCompanheiro') {
        const donoD = this.combatants.find((x) => x.id === target.invocado.donoId);
        if (donoD) { donoD.dracoAtivo = false; donoD.pvDoDraco = null; }
      }
      Sub.deixarChama(this, target);
      Sub.caoSemAlvo(this, target);
      this.soltarAgarroesDe(target);
      // quem estava DENTRO sai do corpo; o humanoide que cai no cone do tirano levanta zumbi
      Livro.libertarEngolidos(this, target, { caido: true, motivo: 'pelo corpo morto' });
      Livro.zumbiDoCone(this, target);
      if (target.traits?.includes('chaoAberrante')) this.atualizarTerrenoDasZonas();
    this.onEvent({ type: 'died', target });
    } else if (sobra >= maxHpEfetivo(target)) {
      this.morrer(target, 'dano maciço');
      return;
    } else {
      // A FÚRIA ACABA AO CAIR, como o livro manda. Medido sem isto: o bárbaro
      // no chão seguia em Fúria, e então 1 de cortante dava 0 falha de morte
      // em vez de 1, e 40 de cortante contra 30 de máximo não o matavam por
      // dano maciço, porque viravam 20 antes da checagem.
      // FÚRIA ALÉM DA MORTE (Fanático, 14º): em Fúria, ele não cai — segue a 0 PV, rolando contra a morte.
      if (Sub.seguraDePe(this, target)) { this.onEvent({ type: 'damage', target, amount, source }); return; }
      // RENASCER EM CHAMAS (Fogo Selvagem, 14º): o espírito se apaga e o druida levanta.
      if (Sub.renascerEmChamas(this, target)) { this.onEvent({ type: 'damage', target, amount, source }); return; }
      // INVOCAÇÃO FIEL (Pastor, 14º): quatro feras vêm defender o druida que cai.
      Sub.invocacaoFiel(this, target);
      if (hasCondition(target, 'furia')) { removeCondition(target, 'furia'); target.furiaAgiu = false; }
      addCondition(target, 'inconsciente');
      addCondition(target, 'caido');
      target.stable = false;
      target.deathSaves = { successes: 0, failures: 0 };
      target.acted = true;
      // O GOLPE NÃO LETAL vale também contra herói: o monstro que quer o grupo VIVO (o refeitório do Repouso de
      // Zorzula, no Obelisco) derruba sem matar — desacordado e estável, sem teste contra a morte.
      if ((corpoACorpo || (source && this.golpeDePerto === source)) && source?.naoLetal) {
        target.stable = true;
        this.say('morte', `${target.name} cai desacordado — vivo: ${source.name} bateu para derrubar.`);
        this.soltarAgarroesDe(target);
        this.onEvent({ type: 'downed', target });
        this.checkEnd();
        return;
      }
      this.say('morte', `${target.name} cai inconsciente.`);
      this.soltarAgarroesDe(target);
      this.onEvent({ type: 'downed', target });
    }
    this.checkEnd();
  }

  /**
   * Quem devia cair a 0 PV e não cai: Fúria Implacável primeiro (CON CD 10, +5 a cada uso depois do primeiro, até um
   * descanso), depois Resistência Implacável (uma vez por descanso longo, sem teste). Devolve true se o herói ficou de pé.
   *
   * A ordem importa: a Fúria pode FALHAR e a Resistência não, então a Fúria tenta primeiro e a Resistência fica de reserva.
   */
  cairImplacavel(t) {
    if (t.features?.includes('relentlessRage') && hasCondition(t, 'furia')) {
      const cd = t.furiaImplacavelCD ?? 10;
      const save = this.resistencia(t, 'con', cd);
      this.explicarResistencia(t, 'con', cd, save, { contra: `Fúria Implacável (CD ${cd})`, seSucesso: 'fica de pé com 1 PV' });
      t.furiaImplacavelCD = cd + 5;
      if (save.success) {
        t.hp = 1;
        this.quedasDaFonte?.delete(t);
        this.say('recurso', `${t.name} devia cair, e a fúria o mantém de pé com 1 PV.`);
        return true;
      }
    }
    // SENTINELA IMORTAL (paladino dos Anciões, 15º): uma vez por descanso longo, cai a 1 PV em vez de 0.
    if (t.features?.includes('undyingSentinel') && (t.resources?.undyingSentinel ?? 0) > 0) {
      t.resources.undyingSentinel -= 1;
      t.hp = 1;
      this.quedasDaFonte?.delete(t);
      this.say('recurso', `${t.name} devia cair, e a Sentinela Imortal o mantém de pé com 1 PV.`);
      return true;
    }
    if (t.features?.includes('relentlessEndurance') && (t.resources?.relentlessEndurance ?? 0) > 0) {
      t.resources.relentlessEndurance -= 1;
      t.hp = 1;
      this.quedasDaFonte?.delete(t);
      this.say('recurso', `${t.name} devia cair, e a Resistência Implacável o mantém de pé com 1 PV.`);
      return true;
    }
    return false;
  }

  /**
   * O que acontece com quem reduz uma criatura hostil a 0 PV:
   *   BÊNÇÃO DO OBSCURO (bruxo Corruptor, 1º)  PV temporários = CAR + nível de bruxo (mínimo 1).
   */
  aoMatar(matador, vitima) {
    if (!matador || matador.dead || matador.side === vitima.side) return;
    // TOQUE DA MORTE (Longa Morte, 3º)
    Sub.toqueDaMorte(this, matador, vitima);
    if (matador.features?.includes('darkOnesBlessing')) {
      const pv = Math.max(1, abilityMod(matador.abilities.cha) + (matador.level ?? 1));
      if (pv > (matador.tempHp ?? 0)) {
        matador.tempHp = pv;
        this.say('recurso', `${matador.name} ganha ${pv} PV temporários (Bênção do Obscuro).`);
      }
    }
  }

  /**
   * O AGARRÃO ACABA QUANDO QUEM AGARRA FICA INCAPACITADO (o livro, "Agarrar"). Morto ou caído também, que são
   * incapacitados. Sem isto a Dara saía da luta da serpente do poço CONTIDA pelos anéis de uma serpente morta, e o
   * mesmo valia para o polvo e o grell. O agarrão é a condição de um golpe com CD de escape (`data.escape`), e é só
   * ele que cai: o veneno do grell que paralisa, ou o envenenado da cobra, ficam, que esses o livro não ata a quem
   * os causou.
   */
  soltarAgarroesDe(fonte) {
    if (!fonte) return;
    for (const c of this.combatants) {
      for (const cond of [...(c.conditions ?? [])]) {
        if (cond.source !== fonte.id || cond.data?.escape == null) continue;
        removeCondition(c, cond.id);
        this.say('condicao', `${c.name} está livre: ${fonte.name} não segura mais ninguém.`);
      }
    }
  }

  /** O AGARRÃO DO HERÓI (`agarrar`) acaba quando quem agarra e quem é agarrado deixam de estar a 1,5 m. */
  soltarAgarroesLonge(quemAndou) {
    for (const c of this.combatants) {
      const g = getCondition(c, 'agarrado');
      if (!g?.data?.disputa) continue;
      const dono = this.combatants.find((x) => x.id === g.source);
      if (dono !== quemAndou && c !== quemAndou) continue;
      if (dono && !dono.dead && distanceFt(dono.pos, c.pos) <= 5) continue;
      removeCondition(c, 'agarrado');
      if (hasCondition(c, 'contido') && getCondition(c, 'contido').source === g.source) removeCondition(c, 'contido');
      if (dono && hasCondition(dono, 'contido') && getCondition(dono, 'contido').data?.imobiliza === c.id) removeCondition(dono, 'contido');
      this.say('condicao', `${c.name} está livre: ${dono?.name ?? 'quem o segurava'} ficou longe demais para segurar.`);
    }
  }

  /** Os agarrões cujo dono já não segura (morto, caído, incapacitado, fora do tabuleiro): caem no começo de cada lado. */
  conferirAgarroes() {
    for (const c of this.combatants) {
      for (const cond of [...(c.conditions ?? [])]) {
        if (cond.data?.escape == null || typeof cond.source !== 'string' || cond.source.startsWith('zona:')) continue;
        const fonte = this.combatants.find((x) => x.id === cond.source);
        if (fonte && !fonte.dead && !conditionEffects(fonte).incapacitated) continue;
        removeCondition(c, cond.id);
        this.say('condicao', `${c.name} está livre: ${fonte?.name ?? 'quem o segurava'} não segura mais ninguém.`);
      }
    }
  }

  /** Morte de personagem: três falhas, ou dano maciço. */
  morrer(target, motivo = null) {
    // FÚRIA ALÉM DA MORTE: as três falhas só matam quando a Fúria acabar (o dano maciço mata na hora, com motivo).
    if (!motivo && Sub.adiaAMorte(this, target)) return;
    // SURTO "reencarnar": quem morre dentro do minuto volta à vida (com metade dos PV), sem rolar a raça nova.
    if (hasCondition(target, 'reencarnar')) {
      // Um corpo novo não leva nada do antigo: concentração, condições e PV temporários ficam para trás.
      this.dropConcentration(target);
      for (const cond of [...(target.conditions ?? [])]) removeCondition(target, cond.id);
      target.tempHp = 0;
      target.dead = false;
      target.hp = Math.max(1, Math.floor(maxHpEfetivo(target) / 2));
      if (target.deathSaves) target.deathSaves = { successes: 0, failures: 0 };
      target.stable = false;
      this.say('cura', `${target.name} volta à vida num corpo novo (Surto de Magia Selvagem).`);
      this.onEvent({ type: 'heal', target, amount: target.hp });
      return;
    }
    target.dead = true;
    // Revivificar só alcança quem morreu há até 1 minuto (10 rodadas).
    target.morreuNaRodada = this.round;
    target.hp = 0;
    this.dropConcentration(target);
    this.say('morte', `${target.name} morre${motivo ? ` (${motivo})` : ''}.`);
    this.explosaoMental(target);
    this.soltarAgarroesDe(target);
    Livro.libertarEngolidos(this, target, { caido: true, motivo: 'pelo corpo morto' });
    Livro.zumbiDoCone(this, target);
    if (target.traits?.includes('chaoAberrante')) this.atualizarTerrenoDasZonas();
    this.onEvent({ type: 'died', target });
    this.checkEnd();
  }

  /**
   * VISAGEM HORRIPILANTE (a banshee, SRD). Quem a vê a até 18 m, menos os mortos-vivos e quem já resistiu a ela, faz
   * Sabedoria CD 13; falhou, fica amedrontado por 1 minuto e repete no fim de cada turno. Quem passa fica imune (o
   * livro dá 24 horas; aqui, a luta). Devolve quantos ficaram com medo.
   */
  visagemHorripilante(m, { cd = 13 } = {}) {
    m.actionUsed = true;
    this.say('acao', `${m.name} mostra a Visagem Horripilante: o rosto vira o que a morte deixou dele.`);
    let comMedo = 0;
    for (const t of this.enemiesOf(m)) {
      if (t.dead || t.hp <= 0 || t.tipo === 'morto-vivo' || t.imuneAVisagem?.includes(m.id)) continue;
      if (distanceFt(m.pos, t.pos) > 60 || !this.field.hasLineOfSight(t.pos, m.pos)) continue;
      if (conditionEffects(t).conditionImmunities?.includes?.('amedrontado') || t.conditionImmunities?.includes('amedrontado')) continue;
      const save = this.resistencia(t, 'wis', cd, { contra: { condicao: 'amedrontado' } });
      const r = this.explicarResistencia(t, 'wis', cd, save, { contra: 'Visagem Horripilante', seSucesso: 'não fica amedrontado, e não teme mais a visagem' });
      if (save.success) {
        (t.imuneAVisagem ??= []).push(m.id);
        this.say('condicao', `${t.name} aguenta o olhar.`, r.conta, { rolagem: r });
      } else {
        // a da banshee se repete com desvantagem enquanto ela está à vista (o SRD); a do fantasma, não
        this.aplicarCondicao(t, 'amedrontado', { rounds: 10, source: m.id, data: { save: 'wis', dc: cd, repete: 'sempre', desvantagemSeVe: m.defId === 'banshee' } });
        this.say('condicao', `${t.name} fica amedrontado.`, r.conta, { rolagem: r });
        comMedo += 1;
        // falhar por 5 ou mais ENVELHECE 1d4 x 10 anos (o SRD): fica na ficha do herói
        if (save.total <= cd - 5 && t.kind === 'pc') {
          const anos = this.rng.die(4) * 10;
          t.anosEnvelhecidos = (t.anosEnvelhecidos ?? 0) + anos;
          this.say('condicao', `O rosto de ${t.name} murcha de uma vez: ${anos} anos mais velho, num piscar de olhos.`);
        }
      }
    }
    this.onEvent({ type: 'habilidade', actor: m, id: 'visagemHorripilante' });
    return comMedo;
  }

  /**
   * O LAMENTO DA BANSHEE (SRD), uma vez por dia (`resources.lamento`). Quem a ouve a até 9 m, menos mortos-vivos e
   * constructos, faz Constituição CD 13: quem falha CAI A 0 PV (não é dano: nada o reduz), quem passa leva 3d6
   * psíquicos. Não sai sob a luz do sol.
   */
  lamentoDaBanshee(m, { cd = 13 } = {}) {
    if (!((m.resources?.lamento ?? 0) > 0)) return false;
    m.resources.lamento -= 1;
    m.actionUsed = true;
    this.say('acao', `${m.name} solta o Lamento: um grito que não é de ninguém vivo.`);
    for (const t of [...this.combatants]) {
      if (t === m || t.dead || t.hp <= 0 || t.side === m.side || t.tipo === 'morto-vivo' || t.tipo === 'constructo') continue;
      if (distanceFt(m.pos, t.pos) > 30 || hasCondition(t, 'surdo')) continue;
      const save = this.resistencia(t, 'con', cd, { contra: { dano: 'psíquico' } });
      const r = this.explicarResistencia(t, 'con', cd, save, { contra: 'o Lamento', seSucesso: '3d6 psíquicos, em vez de cair a 0 PV' });
      if (save.success) {
        const d = damageRoll(this.rng, '3d6');
        this.say('dano', `${t.name} aguenta o Lamento: ${d.total} psíquicos.`, r.conta, { rolagem: r });
        this.applyDamage(t, d.total, 'psíquico', m, { magico: true });
      } else {
        this.say('dano', `${t.name} cai com o Lamento.`, r.conta, { rolagem: r });
        t.tempHp = 0;
        this.applyDamage(t, t.hp, null, m);
      }
    }
    this.onEvent({ type: 'habilidade', actor: m, id: 'lamento' });
    return true;
  }

  /**
   * O COMEÇO DO TURNO DO BLOCO: a Regeneração (o guardião-escudo: 10 PV, se tem pelo menos 1), o Hálito Virulento (o
   * otyugh mutante: quem está a 1,5 m faz Constituição CD 15 ou 1d6 de veneno) e o dano da Coroa Psiônica em quem a
   * carrega (2d8 psíquicos).
   */
  inicioDoTurnoDoBloco(c) {
    if (c.dead) return;
    c.posNoInicioDoTurno = c.pos ? { ...c.pos } : null;
    // A REGENERAÇÃO DO LIVRO (o troll, o vampiro, o slaad): +pv no começo do turno com 1 PV ou mais, menos depois de levar
    // o dano que a bloqueia. O troll caído (`naoMorreA0`) só morre se começar o turno a 0 PV sem regenerar.
    if (c.regeneracao) {
      const bloqueada = c.regenDoLivroBloqueada;
      c.regenDoLivroBloqueada = false;
      if (c.caidoRegenerando) {
        if (bloqueada) {
          c.caidoRegenerando = false;
          this.say('morte', `${c.name} não se levanta: o ${c.regeneracao.bloqueia.join(' e o ')} não deixaram a carne voltar.`);
          this.morrer(c, 'sem regenerar');
          return;
        }
        c.hp = Math.min(c.maxHp, c.regeneracao.pv);
        c.caidoRegenerando = false;
        removeCondition(c, 'inconsciente');
        this.say('cura', `${c.name} se levanta do chão: a carne se fecha, +${c.hp} PV (Regeneração).`);
      } else if (!bloqueada && c.hp >= 1 && c.hp < c.maxHp) {
        const antes = c.hp;
        c.hp = Math.min(c.maxHp, c.hp + c.regeneracao.pv);
        this.say('cura', `${c.name} se refaz: +${c.hp - antes} PV (Regeneração).`);
      } else if (bloqueada && c.hp < c.maxHp) this.say('recurso', `${c.name} não se refaz neste turno: ${c.regeneracao.bloqueia.join(' e ')} o impedem.`);
    }
    // A AURA DO DONO (a Aura de Fogo do balor): no começo do turno dele, quem está perto leva o dano.
    if (c.aura?.quando === 'inicioDoDono' && c.aura.damage && c.hp > 0) {
      const a = c.aura;
      for (const t of this.combatants.filter((x) => x !== c && !x.dead && x.hp > 0 && x.pos && distanceFt(c.pos, x.pos) <= a.raioFt
        && (!a.soInimigos || (x.side !== c.side && x.side !== 'neutro')))) {
        // COM TESTE (a Aura da Morte da fusão de carne: Constituição, ou o dano e envenenado até o próximo turno dela)
        if (a.save) {
          const sv = this.resistencia(t, a.save, a.dc, { contra: { tipoDano: a.damageType, condicao: a.condition ?? null, magico: true } });
          const r = this.explicarResistencia(t, a.save, a.dc, sv, { contra: `a aura de ${c.name}`, seSucesso: 'nada' });
          if (sv.success) { this.say('condicao', `${t.name} aguenta a aura de ${c.name}.`, r.conta, { rolagem: r }); continue; }
          const d = damageRoll(this.rng, a.damage);
          this.say('dano', `A aura de ${c.name} pega ${t.name}: ${d.total} de ${a.damageType}.`, `${r.conta} · ${a.damage}[${d.rolls.join('+')}]`, { rolagem: r });
          this.applyDamage(t, d.total, a.damageType, c, { magico: true });
          if (a.condition && !t.dead && t.hp > 0 && !this.imuneACondicao(t, a.condition)) {
            this.aplicarCondicao(t, a.condition, { rounds: 1, quando: 'inicio', lado: c.side, source: c.id });
          }
          continue;
        }
        const d = damageRoll(this.rng, a.damage);
        this.say('dano', `A aura de ${c.name} queima ${t.name}: ${d.total} de ${a.damageType}.`, `${a.damage}[${d.rolls.join('+')}]`);
        this.applyDamage(t, d.total, a.damageType, c, { magico: true });
      }
    }
    // O TESTE NO COMEÇO DO TURNO (`testeNoInicio`: o cloaker mutante que esquece quem é): falhou, perde o turno
    if (c.testeNoInicio && !c.dead && c.hp > 0) {
      const tt = c.testeNoInicio;
      const sv = this.resistencia(c, tt.save, tt.dc, { vantagem: !!tt.vantagem?.(this, c) });
      const r = this.explicarResistencia(c, tt.save, tt.dc, sv, { contra: tt.nome ?? 'o próprio pensamento', seSucesso: 'age normalmente' });
      if (!sv.success) {
        c.actionUsed = true;
        c.bonusUsed = true;
        c.movementLeftFt = 0;
        this.say('condicao', `${c.name} ${tt.falha ?? 'se perde dentro da própria cabeça e não age neste turno'}.`, r.conta, { rolagem: r });
        tt.aoFalhar?.(this, c);
      } else tt.aoPassar?.(this, c);
    }
    if (c.traits?.includes('regeneracaoVingativa')) {
      if (c.regenBloqueada) { c.regenBloqueada = false; this.say('recurso', `${c.name} não se refaz: o fogo e a luz ainda queimam.`); }
      else if (!c.semRegeneracao && c.hp >= 1 && c.hp < c.maxHp) {
        const antes = c.hp;
        c.hp = Math.min(c.maxHp, c.hp + 10);
        this.say('cura', `${c.name} se refaz: +${c.hp - antes} PV (Regeneração).`);
      }
    }
    // O FUROR DO GOLEM (o golem de argila, SRD): começando o turno com 60 PV ou menos, 1d6; no 6 ele enlouquece e bate no
    // mais perto, seja de que lado for, até ser destruído ou voltar a ter todos os PV.
    if (c.traits?.includes('furorDoGolem')) {
      if (c.furioso && c.hp >= c.maxHp) { c.furioso = false; this.say('recurso', `${c.name} se aquieta: o barro está inteiro de novo.`); }
      else if (!c.furioso && c.hp <= 60) {
        const d = this.rng.die(6);
        if (d === 6) { c.furioso = true; this.say('recurso', `${c.name} enlouquece (Furor, 1d6 = 6): agora bate no que estiver mais perto.`); }
      }
    }
    if (c.traits?.includes('pressaDoGolem') && !c.recarregando?.Pressa
      && this.enemiesOf(c).some((e) => !e.dead && e.hp > 0 && distanceFt(c.pos, e.pos) <= 30)) {
      (c.recarregando ??= {}).Pressa = true;
      addCondition(c, 'pressaDoGolem', { rounds: 1, quando: 'fim', lado: c.side });
      c.pancadaDaPressa = true;
      this.say('recurso', `${c.name} se move mais rápido do que barro devia (Pressa).`);
    }
    if (hasCondition(c, 'possuido')) this.corpoPossuido(c);
    this.olharPetrificante(c);
    this.cacofoniaDeMentes(c);
    if (c.pedregulhos?.length && this.round >= (c.pedregulhosAte ?? Infinity)) this.pedregulhosVoltamAPedra(c, 'o minuto acabou');
    if (c.traits?.includes('regeneracao') && c.hp >= 1 && c.hp < c.maxHp) {
      const antes = c.hp;
      c.hp = Math.min(c.maxHp, c.hp + 10);
      this.say('cura', `${c.name} se refaz: +${c.hp - antes} PV (Regeneração).`);
    }
    if (c.traits?.includes('halitoVirulento')) {
      for (const t of this.combatants.filter((x) => x !== c && !x.dead && x.hp > 0 && x.pos && distanceFt(c.pos, x.pos) <= 5)) {
        const save = this.resistencia(t, 'con', 15, { contra: { dano: 'veneno' } });
        const r = this.explicarResistencia(t, 'con', 15, save, { contra: 'Hálito Virulento', seSucesso: 'nenhum dano' });
        if (save.success) continue;
        const d = damageRoll(this.rng, '1d6');
        this.say('dano', `O hálito de ${c.name} pega ${t.name}: ${d.total} de veneno.`, r.conta, { rolagem: r });
        this.applyDamage(t, d.total, 'veneno', c);
      }
    }
    // A GÊMULA GRUDADA (o Obelisco): chupa no começo do turno de quem ela pegou
    const grudada = getCondition(c, 'sanguessuga');
    if (grudada) {
      const g = this.combatants.find((x) => x.id === grudada.source && !x.dead && x.hp > 0);
      if (!g) removeCondition(c, 'sanguessuga');
      else {
        const d = damageRoll(this.rng, '3d4');
        this.say('dano', `${g.name}, grudada em ${c.name}, chupa: ${d.total} perfurante.`);
        this.applyDamage(c, d.total, 'perfurante', g);
      }
    }
    // e a gêmula grudada vai junto de quem ela pegou: no começo do turno dela, está de novo colada nele
    if (c.gemulaEm) {
      const alvo = this.combatants.find((x) => x.id === c.gemulaEm);
      if (!alvo || alvo.dead || !hasCondition(alvo, 'sanguessuga')) c.gemulaEm = null;
      else if (distanceFt(c.pos, alvo.pos) > 5) {
        const casa = this.casaLivreMaisProxima(alvo.pos);
        if (casa && distanceFt(casa, alvo.pos) <= 5) c.pos = { ...c.pos, ...casa };
      }
    }
    const coroa = getCondition(c, 'coroaPsionica');
    if (coroa) {
      const d = damageRoll(this.rng, '2d8');
      const dono = this.combatants.find((x) => x.id === coroa.source);
      this.say('dano', `A coroa de cristal aperta a cabeça de ${c.name}: ${d.total} psíquicos.`);
      this.applyDamage(c, d.total, 'psíquico', dono ?? null, { magico: true });
    }
  }

  /**
   * O VÍNCULO DO GUARDIÃO-ESCUDO (SRD): se o guardião está a até 18 m de quem ele protege, METADE do dano que o mestre
   * leva (arredondada para cima) vai para o guardião. `amuletoCom` no guardião aponta quem usa o amuleto.
   */
  vinculoDoAmuleto(alvo, amount) {
    if (amount <= 0) return amount;
    const g = this.combatants.find((c) => c.amuletoCom === alvo.id && !c.dead && c.hp > 0 && c.pos && alvo.pos && distanceFt(c.pos, alvo.pos) <= 60);
    if (!g) return amount;
    const passa = Math.ceil(amount / 2);
    this.say('recurso', `${g.name} leva metade do golpe por ${alvo.name}: ${passa} (Vínculo).`);
    g.hp = Math.max(0, g.hp - passa);
    if (g.hp <= 0) this.applyDamage(g, 1, null, null);
    return amount - passa;
  }

  /** O ESCUDO DO GUARDIÃO (SRD, reação): +2 de CA no mestre, se o guardião está colado nele e isso faz errar. */
  escudoDoGuardiao(alvo, atacante, total, ca) {
    if (total >= ca + 2) return null;
    const g = this.combatants.find((c) => c.amuletoCom === alvo.id && !c.dead && c.hp > 0 && !c.reactionUsed
      && !conditionEffects(c).incapacitated && distanceFt(c.pos, alvo.pos) <= 5);
    if (!g) return null;
    g.reactionUsed = true;
    this.say('recurso', `${g.name} se põe na frente de ${alvo.name}: +2 de CA, e o golpe de ${atacante.name} não passa.`);
    return g;
  }

  /** Morto quem o comanda (`comandadoPor`: o Ruxithid, que o controla pelo cristal), o guardião fica inerte e não segura a luta. */
  guardiaoSemMestre(mestre) {
    for (const g of this.combatants.filter((c) => c.comandadoPor === mestre.id && !c.dead)) {
      this.aplicarCondicao(g, 'inerte', { source: mestre.id });
      g.naoSeguraALuta = true;
      this.say('condicao', `${g.name} para no meio do gesto: sem ${mestre.name}, não há quem o comande.`);
    }
    // quem só luta por ele se rende quando ele cai (`rendeSemMestre`)
    for (const g of this.combatants.filter((c) => c.rendeSemMestre === mestre.id && !c.dead && c.side !== 'party')) {
      g.side = 'neutro';
      g.capturado = true;
      g.rendido = true;
      this.say('condicao', `${g.name} larga a arma e ergue as mãos: sem ${mestre.name}, não há por que lutar.`);
    }
    this.checkEnd?.();
  }

  /** INVESTIDA (a broca infernal): andou pelo menos `pes` neste turno antes de acertar → dano a mais, e Força ou cai. */
  investida(m, alvo, { pes = 20, dano = null, tipo, save = 'str', dc, condition = 'caido', mordeSeCair = null }) {
    // 6 m EM LINHA RETA na direção do alvo (o livro): a última reta do caminho, e ela tem de apontar para ele
    const andou = (this.speedOf(m) ?? 0) - (m.movementLeftFt ?? 0);
    const reta = m.retaAndada;
    if (andou < pes || !reta || reta.pes < pes || alvo.dead) return;
    if (arguments[2]?.soVoando && !this.voaPelaFicha(m)) return;
    const paraOAlvo = Math.sign(alvo.pos.x - m.pos.x) === reta.dx || Math.sign(alvo.pos.y - m.pos.y) === reta.dy || isAdjacent(m.pos, alvo.pos);
    if (!paraOAlvo) return;
    if (dano) {
      const d = damageRoll(this.rng, dano);
      this.say('dano', `${m.name} vinha embalado: mais ${d.total} de ${tipo} em ${alvo.name}.`);
      this.applyDamage(alvo, d.total, tipo, m, { deArma: true, corpoACorpo: true });
    } else this.say('acao', `${m.name} salta sobre ${alvo.name}.`);
    if (!dc) return;   // a investida que só fere (o mergulho, a carga do centauro)
    if (alvo.dead || alvo.hp <= 0 || this.imuneACondicao(alvo, condition)) return;
    const r = this.resistencia(alvo, save, dc, { contra: { condicao: condition } });
    const ex = this.explicarResistencia(alvo, save, dc, r, { contra: 'a investida', seSucesso: 'fica de pé' });
    if (!r.success) {
      this.aplicarCondicao(alvo, condition, { source: m.id });
      this.say('condicao', `${alvo.name} vai ao chão com o tranco.`, ex.conta, { rolagem: ex });
      // o SALTO do tigre-dente-de-sabre: quem caiu leva a mordida, como ação bônus
      if (mordeSeCair && !m.bonusUsed && !m.dead) {
        m.bonusUsed = true;
        this.resolveAttack(m, alvo, { weaponId: mordeSeCair });
      }
    }
  }

  /**
   * GOLPE CONTRA QUEM ELE AGARRA: a Pancada de Tentáculos do otyugh (todos os agarrados, Constituição CD 14, 2d6+3 e
   * atordoado; passa, metade) e a Pancada de Quitina do mutante (um só, Constituição CD 15, 3d10 e atordoado; passa,
   * nada). Atordoado até o fim do próximo turno de quem bateu.
   */
  golpeNosAgarrados(m, { nome, dc, dano, metade = false, um = false }) {
    const presos = this.combatants.filter((c) => !c.dead && c.hp > 0 && c.conditions?.some((k) => k.id === 'contido' && k.source === m.id));
    if (!presos.length) return false;
    for (const t of um ? presos.slice(0, 1) : presos) {
      const save = this.resistencia(t, 'con', dc, { contra: { condicao: 'atordoado' } });
      const r = this.explicarResistencia(t, 'con', dc, save, { contra: nome, seSucesso: metade ? 'metade do dano, sem atordoar' : 'nenhum dano' });
      if (save.success && !metade) { this.say('condicao', `${t.name} aguenta a ${nome}.`, r.conta, { rolagem: r }); continue; }
      const d = damageRoll(this.rng, dano);
      const total = save.success ? Math.floor(d.total / 2) : d.total;
      this.say('dano', `${m.name} usa a ${nome} em ${t.name}: ${total} de concussão${save.success ? '' : ', e ele fica atordoado'}.`, r.conta, { rolagem: r });
      this.applyDamage(t, total, 'concussão', m);
      if (!save.success && !t.dead && t.hp > 0) this.aplicarCondicao(t, 'atordoado', { rounds: 1, source: m.id, lado: m.side, quando: 'fim' });
    }
    return true;
  }

  /** A COROA PSIÔNICA (o ashenwight psiônico, recarga 5–6, junto do multiataque): alvo que ele vê a até 18 m, Sabedoria CD 14. */
  coroaPsionica(m, alvo, { dc = 14 } = {}) {
    if (m.recarregando?.['Coroa Psiônica'] || !alvo || alvo.dead || distanceFt(m.pos, alvo.pos) > 60) return false;
    (m.recarregando ??= {})['Coroa Psiônica'] = true;
    if (this.imuneACondicao(alvo, 'coroaPsionica') || alvo.conditionImmunities?.includes('enfeitiçado')) {
      this.say('condicao', `${m.name} tenta coroar ${alvo.name}, mas a mente dele não se dobra.`);
      return true;
    }
    const save = this.resistencia(alvo, 'wis', dc, { contra: { condicao: 'coroaPsionica' } });
    const r = this.explicarResistencia(alvo, 'wis', dc, save, { contra: 'Coroa Psiônica', seSucesso: 'não é coroado' });
    if (save.success) { this.say('condicao', `Cristais espectrais rodeiam a cabeça de ${alvo.name} e se partem.`, r.conta, { rolagem: r }); return true; }
    this.aplicarCondicao(alvo, 'coroaPsionica', { rounds: 10, source: m.id, data: { save: 'wis', dc, repete: 'sempre' } });
    this.say('condicao', `Uma coroa de cristais espectrais fecha sobre a cabeça de ${alvo.name}: o pensamento fica lento.`, r.conta, { rolagem: r });
    return true;
  }

  /** TENTÁCULOS CEREBRAIS (o Ruxithid, ação bônus, recarga 5–6): alvo a até 9 m, Destreza CD 15 ou 2d8 psíquicos e atordoado. */
  tentaculosCerebrais(m, alvo, { dc = 15 } = {}) {
    if (m.bonusUsed || m.recarregando?.['Tentáculos Cerebrais'] || !alvo || alvo.dead || distanceFt(m.pos, alvo.pos) > 30) return false;
    m.bonusUsed = true;
    (m.recarregando ??= {})['Tentáculos Cerebrais'] = true;
    const save = this.resistencia(alvo, 'dex', dc, { contra: { dano: 'psíquico', condicao: 'atordoado' } });
    const r = this.explicarResistencia(alvo, 'dex', dc, save, { contra: 'Tentáculos Cerebrais', seSucesso: 'nada' });
    if (save.success) { this.say('condicao', `${alvo.name} se desvia dos tentáculos de cristal de ${m.name}.`, r.conta, { rolagem: r }); return true; }
    const d = damageRoll(this.rng, '2d8');
    this.say('dano', `Tentáculos de cristal saem da cabeça de ${m.name} e furam a mente de ${alvo.name}: ${d.total} psíquicos, e ele fica atordoado.`, r.conta, { rolagem: r });
    this.applyDamage(alvo, d.total, 'psíquico', m, { magico: true });
    if (!alvo.dead && alvo.hp > 0) this.aplicarCondicao(alvo, 'atordoado', { rounds: 1, source: m.id, lado: m.side, quando: 'inicio' });
    return true;
  }

  /**
   * COMANDO DE COMBATE (o Ruxithid, ação bônus): um aliado que ele vê a até 18 m usa a reação para um golpe corpo a corpo
   * contra quem estiver ao alcance dele.
   */
  comandoDeCombate(m, aliado, alvo) {
    if (m.bonusUsed || !aliado || aliado.dead || aliado.reactionUsed || !alvo || alvo.dead) return false;
    if (distanceFt(m.pos, aliado.pos) > 60 || conditionEffects(aliado).incapacitated) return false;
    m.bonusUsed = true;
    aliado.reactionUsed = true;
    this.say('reacao', `${m.name} manda ${aliado.name} bater, e ele bate (Comando de Combate).`);
    this.resolveAttack(aliado, alvo, {});
    return true;
  }

  /**
   * RAJADA DE CALOR (a broca infernal, ação bônus, recarga 5–6): esfera de 9 m em volta dela que CONTORNA QUINAS —
   * por isso a área é a inundação pelo chão a 9 m, e não a reta. Constituição CD 17, 3d8 de fogo, metade se passar.
   */
  rajadaDeCalor(m, { dc = 17 } = {}) {
    if (m.bonusUsed || m.recarregando?.['Rajada de Calor']) return false;
    m.bonusUsed = true;
    (m.recarregando ??= {})['Rajada de Calor'] = true;
    const alc = this.field.reachable(m.pos, 30, () => false);
    const pegos = this.combatants.filter((c) => c !== m && !c.dead && c.hp > 0 && c.pos && distanceFt(m.pos, c.pos) <= 30
      && (alc.has(`${c.pos.x},${c.pos.y}`) || this.field.hasLineOfSight(m.pos, c.pos)));
    this.say('acao', `${m.name} solta uma onda de calor que dobra as quinas.`);
    for (const t of pegos) {
      const save = this.resistencia(t, 'con', dc, { contra: { dano: 'fogo' } });
      const r = this.explicarResistencia(t, 'con', dc, save, { contra: 'Rajada de Calor', seSucesso: 'metade do dano' });
      const d = damageRoll(this.rng, '3d8');
      const total = save.success ? Math.floor(d.total / 2) : d.total;
      this.say('dano', `O calor pega ${t.name}: ${total} de fogo.`, r.conta, { rolagem: r });
      this.applyDamage(t, total, 'fogo', m);
    }
    return true;
  }

  /**
   * O OLHAR PETRIFICANTE da medusa (Honna, Talhundereth). No começo do turno de quem está a até 9 m dela e a vê (e é
   * visto), ela pode forçar Constituição CD 14: falhou por 5 ou mais, vira pedra na hora; falhou por menos, começa a
   * virar (contido) e testa de novo no fim do próximo turno. Quem DESVIA OS OLHOS (a escolha do jogador, ou da IA) não
   * testa, mas não a vê até o começo do próximo turno (`olhosDesviados`). O reflexo que a petrifica a si mesma não
   * entra: o templo é breu, e o livro pede luz forte.
   */
  olharPetrificante(c) {
    if (c.dead || c.hp <= 0 || !c.pos || hasCondition(c, 'petrificado') || hasCondition(c, 'petrificando')) return;
    const medusas = this.combatants.filter((m) => m !== c && !m.dead && m.hp > 0 && m.side !== c.side && m.side !== 'neutro'
      && m.traits?.includes('olharPetrificante') && !conditionEffects(m).incapacitated && m.pos
      && distanceFt(m.pos, c.pos) <= 30 && this.field.hasLineOfSight(m.pos, c.pos));
    if (!medusas.length) return;
    const m = medusas[0];
    if (hasCondition(c, 'cego')) return;
    if (c.desviaOlhar && !this.surpresos?.has?.(c.id)) {
      addCondition(c, 'olhosDesviados', { source: m.id });
      this.say('condicao', `${c.name} desvia os olhos de ${m.name}.`);
      return;
    }
    if (this.imuneACondicao(c, 'petrificado')) return;
    const cd = m.olharCd ?? 14;
    const sv = this.resistencia(c, 'con', cd, { contra: { condicao: 'petrificado' } });
    const r = this.explicarResistencia(c, 'con', cd, sv, { contra: `o olhar de ${m.name}`, seSucesso: 'nada' });
    if (sv.success) { this.say('condicao', `${c.name} cruza o olhar de ${m.name} e aguenta.`, r.conta, { rolagem: r }); return; }
    if (sv.total <= cd - 5) this.petrificar(c, m, r);
    else {
      addCondition(c, 'petrificando', { source: m.id, data: { cd } });
      this.say('condicao', `${c.name} cruza o olhar de ${m.name}: a pele endurece e as pernas não obedecem.`, r.conta, { rolagem: r });
    }
    this.onEvent({ type: 'habilidade', actor: m, id: 'olharPetrificante', target: c });
  }

  petrificar(c, m, r = null) {
    removeCondition(c, 'petrificando');
    addCondition(c, 'petrificado', { source: m?.id ?? null });
    if (c.concentrating) this.dropConcentration(c);
    this.say('condicao', `${c.name} vira pedra.`, r?.conta, r ? { rolagem: r } : undefined);
    this.soltarAgarroesDe(c);
  }

  /** O fim do turno de quem começou a virar pedra: Constituição de novo. */
  fimDaPetrificacao(c) {
    const p = getCondition(c, 'petrificando');
    if (!p || c.dead) return;
    const cd = p.data?.cd ?? 14;
    const hab = p.data?.save ?? 'con';
    const sv = this.resistencia(c, hab, cd, { contra: { condicao: 'petrificado' } });
    const r = this.explicarResistencia(c, hab, cd, sv, { contra: 'virar pedra', seSucesso: 'a carne amolece' });
    if (sv.success) { removeCondition(c, 'petrificando'); this.say('condicao', `${c.name} sacode o corpo: a pele volta a ser pele.`, r.conta, { rolagem: r }); return; }
    this.petrificar(c, this.combatants.find((x) => x.id === p.source), r);
  }

  /**
   * A CACOFONIA DE MENTES da armadilha de intelecto (Talhundereth, T11). Quem começa o turno a até 9 m dela faz
   * Sabedoria CD 17 ou fica incapacitado por 1 minuto, repetindo no começo de cada turno. Quem passa fica imune a ELA
   * por 24 horas (o resto da luta, aqui).
   */
  cacofoniaDeMentes(c) {
    if (c.dead || c.hp <= 0 || !c.pos) return;
    const presa = (c.conditions ?? []).find((k) => k.id === 'incapacitado' && k.data?.cacofonia);
    if (presa) {
      const sv = this.resistencia(c, 'wis', 17, { contra: { condicao: 'incapacitado' } });
      const r = this.explicarResistencia(c, 'wis', 17, sv, { contra: 'Cacofonia de Mentes', seSucesso: 'volta a si' });
      if (sv.success) {
        c.conditions = c.conditions.filter((k) => k !== presa);
        (c.imuneACacofonia ??= []).push(presa.source);
        this.say('condicao', `${c.name} arranca as vozes da cabeça e volta a si.`, r.conta, { rolagem: r });
      } else this.say('condicao', `${c.name} continua perdido nas vozes.`, r.conta, { rolagem: r });
      return;
    }
    for (const m of this.combatants) {
      if (m === c || m.dead || m.hp <= 0 || !m.traits?.includes('cacofoniaDeMentes') || !m.pos) continue;
      if (distanceFt(m.pos, c.pos) > 30 || (c.imuneACacofonia ?? []).includes(m.id) || m.side === c.side) continue;
      if (this.imuneACondicao(c, 'incapacitado')) continue;
      const sv = this.resistencia(c, 'wis', 17, { contra: { condicao: 'incapacitado' } });
      const r = this.explicarResistencia(c, 'wis', 17, sv, { contra: `a Cacofonia de Mentes de ${m.name}`, seSucesso: 'fica imune a ela' });
      if (sv.success) {
        (c.imuneACacofonia ??= []).push(m.id);
        this.say('condicao', `Mil vozes enchem a cabeça de ${c.name}, e ${c.name} as cala.`, r.conta, { rolagem: r });
      } else {
        addCondition(c, 'incapacitado', { rounds: 10, source: m.id, data: { cacofonia: true } });
        this.say('condicao', `Mil vozes enchem a cabeça de ${c.name}: fica parado, ouvindo.`, r.conta, { rolagem: r });
      }
      return;
    }
  }

  /** SUGAR PENSAMENTOS (a armadilha de intelecto, ação bônus): um agarrado faz Inteligência CD 17, 6d6, metade; ela cura o dano. */
  sugarPensamentos(m) {
    if (m.bonusUsed) return false;
    const alvo = this.combatants.find((c) => !c.dead && c.hp > 0 && c.conditions?.some((k) => k.id === 'agarrado' && k.source === m.id));
    if (!alvo) return false;
    m.bonusUsed = true;
    const sv = this.resistencia(alvo, 'int', 17, { contra: { dano: 'psíquico' } });
    const r = this.explicarResistencia(alvo, 'int', 17, sv, { contra: 'Sugar Pensamentos', seSucesso: 'metade do dano' });
    const d = damageRoll(this.rng, '6d6');
    const dano = sv.success ? Math.floor(d.total / 2) : d.total;
    const antes = alvo.hp;
    this.say('dano', `${m.name} suga os pensamentos de ${alvo.name}: ${dano} psíquicos.`, r.conta, { rolagem: r });
    this.applyDamage(alvo, dano, 'psíquico', m, { magico: true });
    const tirou = Math.max(0, antes - Math.max(0, alvo.hp));
    if (tirou > 0) this.say('cura', `${m.name} recupera ${this.heal(m, tirou, m)} PV.`);
    return true;
  }

  /**
   * VOO DEFENSIVO (o mutante humanoide, reação): logo depois de levar dano, voa até o deslocamento dele para longe de
   * quem o feriu, sem provocar ataque de oportunidade. Para onde dá para continuar mirando quem o feriu, se der.
   */
  vooDefensivo(alvo, fonte) {
    if (!fonte || fonte === alvo || alvo.dead || alvo.hp <= 0 || alvo.reactionUsed || !alvo.traits?.includes('vooDefensivo')) return;
    if (conditionEffects(alvo).incapacitated || !alvo.pos || !fonte.pos) return;
    const voo = alvo.flyFt ?? alvo.speedFt ?? 30;
    const casas = this.reachableFor({ ...alvo, movementLeftFt: voo, pos: { ...alvo.pos } });
    let melhor = null;
    for (const k of casas.keys ? casas.keys() : casas) {
      const [x, y] = String(k).split(',').map(Number);
      if (this.at(x, y)) continue;
      const d = distanceFt({ x, y }, fonte.pos);
      const ve = this.field.hasLineOfSight({ x, y }, fonte.pos) ? 1 : 0;
      const nota = ve * 1000 + Math.min(d, 60);
      if (!melhor || nota > melhor.nota) melhor = { x, y, nota };
    }
    if (!melhor || distanceFt(melhor, fonte.pos) <= distanceFt(alvo.pos, fonte.pos)) return;
    alvo.reactionUsed = true;
    const de = { ...alvo.pos };
    alvo.pos = { ...alvo.pos, x: melhor.x, y: melhor.y };
    this.say('acao', `${alvo.name} se ergue no ar e se afasta de ${fonte.name} (Voo Defensivo).`);
    this.onEvent({ type: 'moved', actor: alvo, from: de, to: { ...alvo.pos }, path: [de, { ...alvo.pos }], voo: true });
  }

  /**
   * FOME AGRESSIVA (o aglomerado encefálico, reação): logo depois de ser acertado por um ataque, anda até o
   * deslocamento dele em direção a quem o acertou, sem provocar ataque de oportunidade; se terminar colado, dá uma
   * Pancada nele.
   */
  fomeAgressiva(alvo, atacante) {
    if (!alvo.traits?.includes('fomeAgressiva') || alvo.reactionUsed || alvo.dead || !atacante || atacante.dead) return;
    if (conditionEffects(alvo).incapacitated || !alvo.pos || !atacante.pos) return;
    alvo.reactionUsed = true;
    this.reagindo = true;
    try {
      if (distanceFt(alvo.pos, atacante.pos) > 5) {
        const casas = this.reachableFor({ ...alvo, movementLeftFt: alvo.speedFt ?? 20, pos: { ...alvo.pos } });
        let melhor = null;
        for (const k of casas.keys ? casas.keys() : casas) {
          const [x, y] = String(k).split(',').map(Number);
          const d = distanceFt({ ...alvo.pos, x, y }, atacante.pos);
          if (!melhor || d < melhor.d) melhor = { x, y, d };
        }
        if (melhor && melhor.d < distanceFt(alvo.pos, atacante.pos)) {
          const de = { ...alvo.pos };
          alvo.pos = { ...alvo.pos, x: melhor.x, y: melhor.y };
          this.say('acao', `${alvo.name} se arrasta atrás de ${atacante.name}, faminto (Fome Agressiva).`);
          this.onEvent({ type: 'moved', actor: alvo, from: de, to: { ...alvo.pos }, path: [de, { ...alvo.pos }] });
        }
      }
      if (distanceFt(alvo.pos, atacante.pos) <= 5) {
        const golpe = alvo.attacks?.[0]?.name;
        if (golpe) this.resolveAttack(alvo, atacante, { weaponId: golpe, reacao: true });
      }
    } finally {
      this.reagindo = false;
    }
  }

  /**
   * GERAR CRIAS (o aglomerado, recarga num descanso): no lugar de uma Pancada, cospe 1d4 ovos que viram gêmulas
   * encefálicas em casas livres a até 9 m. Elas obedecem a ele e jogam logo depois dele (aqui, no mesmo lado).
   */
  gerarCrias(m, criar = makeMonster) {
    if (!(m.resources?.gerarCrias > 0)) return [];
    m.resources.gerarCrias -= 1;
    const n = this.rng.die(4);
    const novas = [];
    for (let i = 0; i < n; i++) {
      const casa = this.casaLivreMaisProxima(m.pos);
      if (!casa || distanceFt(casa, m.pos) > 30) break;
      const g = criar('gemulaEncefalica', { x: casa.x, y: casa.y }, { nameSuffix: `${m.name.split(' ')[0]}-${i + 1}` });
      g.side = m.side;
      g.xp = 0;
      g.acted = true;
      this.addCombatant(g);
      novas.push(g);
    }
    this.say('acao', `${m.name} incha e cospe ${novas.length} ${novas.length === 1 ? 'ovo, que se abre' : 'ovos, que se abrem'} em gêmulas (Gerar Crias).`);
    this.onEvent({ type: 'reinforcements', units: novas, aviso: null });
    return novas;
  }

  /**
   * ANIMAR PEDREGULHOS (o galeb duhr, 1/dia): até dois pedregulhos que ele vê a até 18 m ganham vida, com o bloco dele
   * (sem esta ação), enquanto ele se concentra, até 1 minuto. Os pedregulhos nascem de pedras soltas do chão.
   */
  animarPedregulhos(m, criar = makeMonster) {
    if (!(m.resources?.animarPedregulhos > 0) || m.actionUsed) return [];
    m.resources.animarPedregulhos -= 1;
    m.actionUsed = true;
    const novos = [];
    for (let i = 0; i < 2; i++) {
      const casa = this.casaLivreMaisProxima(m.pos);
      if (!casa || distanceFt(casa, m.pos) > 60) break;
      const p = criar('pedregulhoAnimado', { x: casa.x, y: casa.y }, { nameSuffix: String(i + 1) });
      p.side = m.side;
      p.xp = 0;
      p.donoPedregulho = m.id;
      this.addCombatant(p);
      novos.push(p);
    }
    m.pedregulhos = novos.map((p) => p.id);
    m.pedregulhosAte = this.round + 10;
    this.say('acao', `${m.name} bate no chão: ${novos.length === 1 ? 'uma pedra solta se levanta' : 'duas pedras soltas se levantam'} e rolam com ele (Animar Pedregulhos).`);
    this.onEvent({ type: 'reinforcements', units: novos, aviso: null });
    return novos;
  }

  pedregulhosVoltamAPedra(m, motivo) {
    const ids = m.pedregulhos ?? [];
    m.pedregulhos = [];
    const vivos = this.combatants.filter((c) => ids.includes(c.id) && !c.dead);
    if (!vivos.length) return;
    for (const p of vivos) { p.dead = true; p.hp = 0; p.inerte = true; this.onEvent({ type: 'died', target: p }); }
    this.say('acao', `Os pedregulhos param de rolar e voltam a ser pedra (${motivo}).`);
  }

  /** EXPLOSÃO DE POEIRA (o mefit de poeira): ao morrer, quem está a 1,5 m faz Constituição CD 10 ou fica cego por 1 minuto. */
  explosaoDePoeira(m) {
    const e = m.explosaoAoMorrer;
    if (!e || m.explodiuPoeira) return;
    m.explodiuPoeira = true;
    const pegos = this.combatants.filter((c) => c !== m && !c.dead && c.hp > 0 && c.pos && distanceFt(m.pos, c.pos) <= (e.pes ?? 5));
    this.say('acao', e.dano ? `${m.name} explode ao morrer.` : `${m.name} se desfaz numa nuvem de poeira.`);
    for (const t of pegos) {
      // a explosão que FERE (os mefites de gelo, de magma; o esporo de gás)
      if (e.dano) {
        const sv = this.resistencia(t, e.save, e.dc, { contra: { tipoDano: e.tipo } });
        const d = damageRoll(this.rng, e.dano);
        const total = sv.success ? (e.metade ? Math.floor(d.total / 2) : 0) : d.total;
        if (total) { this.applyDamage(t, total, e.tipo, m, { magico: true }); this.say('dano', `A explosão pega ${t.name}: ${total} de ${e.tipo}.`, `${e.dano}[${d.rolls.join('+')}]`); }
        if (!e.condicao || sv.success) continue;
      }
      if (!e.condicao || this.imuneACondicao(t, e.condicao)) continue;
      const sv = this.resistencia(t, e.save, e.dc, { contra: { condicao: e.condicao } });
      const r = this.explicarResistencia(t, e.save, e.dc, sv, { contra: 'a poeira', seSucesso: 'nada' });
      if (sv.success) { this.say('condicao', `${t.name} fecha os olhos a tempo.`, r.conta, { rolagem: r }); continue; }
      this.aplicarCondicao(t, e.condicao, { rounds: e.rounds ?? 10, source: m.id, data: { save: e.save, dc: e.dc, repete: true } });
      this.say('condicao', `A poeira entra nos olhos de ${t.name}: fica ${CONDITIONS[e.condicao]?.name.toLowerCase() ?? e.condicao}.`, r.conta, { rolagem: r });
    }
  }

  /**
   * AS CABEÇAS DA HIDRA (Grandlejaw, P5). 25 de dano ou mais num mesmo turno arrancam UMA cabeça (`danoNoTurno` zera a
   * cada lado). Sem cabeça nenhuma, morre: devolve true.
   */
  cabecasDaHidra(h, amount) {
    h.danoNoTurno = (h.danoNoTurno ?? 0) + amount;
    if (h.danoNoTurno < 25 || h.cabecaPerdidaNoTurno) return false;
    h.cabecaPerdidaNoTurno = true;
    h.cabecas -= 1;
    h.cabecasMortas = (h.cabecasMortas ?? 0) + 1;
    this.say('acao', h.cabecas > 0 ? `Uma das cabeças de ${h.name} cai, decepada: restam ${h.cabecas}.` : `A última cabeça de ${h.name} cai.`);
    return h.cabecas <= 0;
  }

  /** No fim do turno da hidra: duas cabeças por cabeça perdida, 10 PV cada — a não ser que tenha levado fogo. */
  cabecasCrescem(h) {
    const mortas = h.cabecasMortas ?? 0;
    if (mortas > 0 && h.cabecas > 0) {
      if (h.queimouAsCabecas) this.say('acao', `Os tocos queimados de ${h.name} não crescem de novo.`);
      else {
        const novas = 2 * mortas;
        h.cabecas += novas;
        const curou = this.heal(h, 10 * novas, h);
        this.say('acao', `De cada toco de ${h.name} nascem duas cabeças: agora são ${h.cabecas} (+${curou} PV).`);
      }
    }
    h.cabecasMortas = 0;
    h.queimouAsCabecas = false;
  }

  /**
   * PUXAR (a água viva, 1,5 m; a mordida da fusão de carne, 4,5 m): o acertado vem na direção de quem o acertou, casa a
   * casa, até encostar, bater em parede ou em alguém, ou acabar o puxão.
   */
  puxar(m, alvo, pes = 5) {
    const de = { ...alvo.pos };
    let andou = 0;
    for (let i = 0; i < Math.max(1, Math.round(pes / 5)); i++) {
      if (!alvo.pos || !m.pos || distanceFt(m.pos, alvo.pos) <= 5) break;
      const dx = Math.sign(m.pos.x - alvo.pos.x);
      const dy = Math.sign(m.pos.y - alvo.pos.y);
      const nx = alvo.pos.x + dx;
      const ny = alvo.pos.y + dy;
      if (!this.field.inside(nx, ny) || this.field.blocksMove(nx, ny) || this.at(nx, ny)) break;
      alvo.pos = { ...alvo.pos, x: nx, y: ny };
      andou += 5;
    }
    if (!andou) return;
    this.say('condicao', `${alvo.name} é arrastado ${String(andou * 0.3).replace('.', ',')} m na direção de ${m.name}.`);
    this.onEvent({ type: 'moved', actor: alvo, from: de, to: { ...alvo.pos }, path: [{ ...alvo.pos }] });
  }

  /**
   * O OLHAR VINGATIVO (o revenant): um alvo a 9 m que ele vê, Sabedoria CD 15; falhou, paralisado até o revenant feri-lo
   * ou até o fim do próximo turno dele, e amedrontado por 1 minuto.
   */
  olharVingativo(m, alvo) {
    if (m.actionUsed || !alvo || alvo.dead || distanceFt(m.pos, alvo.pos) > 30 || !this.field.hasLineOfSight(m.pos, alvo.pos)) return false;
    m.actionUsed = true;
    const sv = this.resistencia(alvo, 'wis', 15, { contra: { condicao: 'paralisado' } });
    const r = this.explicarResistencia(alvo, 'wis', 15, sv, { contra: `o olhar de ${m.name}`, seSucesso: 'nada' });
    if (sv.success || this.imuneACondicao(alvo, 'paralisado')) { this.say('condicao', `${alvo.name} sustenta o olhar de ${m.name}.`, r.conta, { rolagem: r }); return true; }
    this.aplicarCondicao(alvo, 'paralisado', { rounds: 1, source: m.id, quando: 'fim', lado: m.side, data: { olharDe: m.id } });
    if (!this.imuneACondicao(alvo, 'amedrontado')) this.aplicarCondicao(alvo, 'amedrontado', { rounds: 10, source: m.id, data: { save: 'wis', dc: 15, repete: true } });
    this.say('condicao', `${m.name} crava os olhos em ${alvo.name}: paralisado de pavor.`, r.conta, { rolagem: r });
    this.onEvent({ type: 'habilidade', actor: m, id: 'olharVingativo', target: alvo });
    return true;
  }

  /**
   * O OLHAR TERRÍVEL (a múmia, junto do golpe): um alvo a 18 m que a vê, Sabedoria CD 11; falhou, amedrontado até o fim
   * do próximo turno dela, e paralisado também se falhou por 5. Quem passa fica imune ao olhar das múmias.
   */
  olharTerrivel(m, alvo) {
    if (!alvo || alvo.dead || alvo.imuneAoOlharDaMumia || distanceFt(m.pos, alvo.pos) > 60 || !this.field.hasLineOfSight(m.pos, alvo.pos)) return false;
    const sv = this.resistencia(alvo, 'wis', 11, { contra: { condicao: 'amedrontado' } });
    const r = this.explicarResistencia(alvo, 'wis', 11, sv, { contra: `o olhar de ${m.name}`, seSucesso: 'fica imune a ele' });
    if (sv.success) { alvo.imuneAoOlharDaMumia = true; this.say('condicao', `${alvo.name} encara ${m.name} e não treme.`, r.conta, { rolagem: r }); return true; }
    if (!this.imuneACondicao(alvo, 'amedrontado')) this.aplicarCondicao(alvo, 'amedrontado', { rounds: 1, source: m.id, quando: 'fim', lado: m.side });
    const feio = sv.total <= 6;
    if (feio && !this.imuneACondicao(alvo, 'paralisado')) this.aplicarCondicao(alvo, 'paralisado', { rounds: 1, source: m.id, quando: 'fim', lado: m.side });
    this.say('condicao', `O olhar de ${m.name} gela ${alvo.name}${feio ? ' até os ossos: nem se mexe' : ''}.`, r.conta, { rolagem: r });
    return true;
  }

  /**
   * A POSSESSÃO (o fantasma, recarga 6): um humanoide a 1,5 m faz Carisma CD 13; falhou, o fantasma entra nele e some
   * (`possuidoDentro`), e o corpo é dele até cair a 0 PV. No começo de cada turno do possuído, o corpo ataca um aliado.
   */
  possuir(m, alvo) {
    if (m.actionUsed || m.recarregando?.['Possessão'] || !alvo || alvo.dead || alvo.hp <= 0 || distanceFt(m.pos, alvo.pos) > 5) return false;
    if ((alvo.tipo ?? 'humanoide') !== 'humanoide' || alvo.imuneAPossessao?.includes(m.id)) return false;
    m.actionUsed = true;
    (m.recarregando ??= {})['Possessão'] = true;
    const sv = this.resistencia(alvo, 'cha', 13, { contra: { condicao: 'enfeiticado' } });
    const r = this.explicarResistencia(alvo, 'cha', 13, sv, { contra: `a possessão de ${m.name}`, seSucesso: 'fica imune a ela' });
    if (sv.success) { (alvo.imuneAPossessao ??= []).push(m.id); this.say('condicao', `${m.name} tenta entrar em ${alvo.name}, que o expulsa.`, r.conta, { rolagem: r }); return true; }
    addCondition(alvo, 'possuido', { source: m.id });
    addCondition(m, 'etereo', { rounds: Infinity });
    m.possuindo = alvo.id;
    this.say('condicao', `${m.name} entra no corpo de ${alvo.name}. Os olhos de ${alvo.name} ficam brancos.`, r.conta, { rolagem: r });
    this.onEvent({ type: 'habilidade', actor: m, id: 'possessao', target: alvo });
    return true;
  }

  /** O corpo possuído, no começo do turno dele: ataca o aliado mais perto que alcança (ou acaba, se o corpo caiu). */
  corpoPossuido(h) {
    const p = getCondition(h, 'possuido');
    const fantasma = this.combatants.find((x) => x.id === p?.source);
    if (!fantasma || fantasma.dead || h.hp <= 0) { this.fimDaPosse(h); return; }
    const aliado = this.combatants.filter((x) => x !== h && !x.dead && x.hp > 0 && x.side === h.side && x.pos && distanceFt(x.pos, h.pos) <= 5)[0];
    if (!aliado) { this.say('condicao', `O corpo de ${h.name} fica parado, de olhos brancos.`); return; }
    this.say('acao', `O fantasma usa o corpo de ${h.name} contra ${aliado.name}.`);
    this.resolveAttack(h, aliado, { weaponId: h.equippedWeapon ?? null, reacao: true });
  }

  /** A posse acaba: o fantasma sai do corpo, numa casa livre ao lado, e o herói fica imune a ele. */
  fimDaPosse(h) {
    const p = getCondition(h, 'possuido');
    if (!p) return;
    removeCondition(h, 'possuido');
    const m = this.combatants.find((x) => x.id === p.source);
    if (m) {
      removeCondition(m, 'etereo');
      m.possuindo = null;
      const casa = this.casaLivreMaisProxima(h.pos);
      if (casa) m.pos = { ...m.pos, x: casa.x, y: casa.y };
      (h.imuneAPossessao ??= []).push(m.id);
    }
    this.say('condicao', `O fantasma sai do corpo de ${h.name}.`);
  }

  /**
   * EXPLOSÃO MENTAL (os goblins psíquicos do Obelisco): ao morrer, a energia presa estoura em 1,5 m — Inteligência CD
   * 13, psíquico (`explosaoMental: { dano, cd }` no bloco). Pega aliado e inimigo, e pode encadear: o goblin que a
   * explosão mata também explode.
   */
  explosaoMental(m) {
    const e = m.explosaoMental;
    if (!e || m.explodiu) return;
    m.explodiu = true;
    const pegos = this.combatants.filter((c) => c !== m && !c.dead && c.hp > 0 && c.pos && distanceFt(m.pos, c.pos) <= 5);
    this.say('acao', `${m.name} estoura: a força da mente presa explode em volta${pegos.length ? '' : ', sem ninguém perto'}.`);
    for (const t of pegos) {
      const save = this.resistencia(t, 'int', e.cd, { contra: { dano: 'psíquico' } });
      const r = this.explicarResistencia(t, 'int', e.cd, save, { contra: 'Explosão Mental', seSucesso: 'nenhum dano' });
      if (save.success) { this.say('condicao', `${t.name} aguenta a explosão.`, r.conta, { rolagem: r }); continue; }
      const d = damageRoll(this.rng, e.dano);
      this.say('dano', `A explosão mental atinge ${t.name}: ${d.total} psíquicos.`, r.conta, { rolagem: r });
      this.applyDamage(t, d.total, 'psíquico', m, { magico: true });
    }
  }

  /**
   * ESCUDO PSIÔNICO (o comandante goblin): de reação, quando ele ou um aliado a até 4,5 m é acertado por uma jogada de
   * ataque, +3 de CA contra aquele ataque. Só vale se +3 faz errar — reação gasta à toa não é decisão de ninguém.
   */
  escudoPsionico(alvo, atacante, total, ca) {
    if (total >= ca + 3) return null;
    const quem = this.combatants.find((c) => !c.dead && c.hp > 0 && c.side === alvo.side && !c.reactionUsed
      && c.traits?.includes('escudoPsionico') && !conditionEffects(c).incapacitated
      && (c === alvo || distanceFt(c.pos, alvo.pos) <= 15));
    if (!quem) return null;
    quem.reactionUsed = true;
    this.say('recurso', `${quem.name} ergue um escudo de força na frente de ${quem === alvo ? 'si' : alvo.name}: +3 de CA, e o golpe de ${atacante.name} não passa (Escudo Psiônico).`);
    return quem;
  }

  /**
   * RASGO SINÁPTICO (o comandante goblin, recarga 5–6): esfera de 9 m num ponto que ele vê a até 18 m. Quem estiver
   * dentro faz Inteligência CD 13: falha, 4d6 psíquicos e incapacitado até o fim do próximo turno do goblin; passa,
   * metade e nada mais. Pega TODO MUNDO na área, aliado também — a IA escolhe o ponto (`ai.js turnoDoComandantePsi`).
   */
  rasgoSinaptico(m, ponto, { cd = 13 } = {}) {
    if (m.recarregando?.['Rasgo Sináptico']) return false;
    (m.recarregando ??= {})['Rasgo Sináptico'] = true;
    m.actionUsed = true;
    const area = new Set(this.field.circulo(ponto, 30).map((q) => `${q.x},${q.y}`));
    this.say('acao', `${m.name} rasga o ar com a mente: uma onda psíquica de 9 m estoura em volta de (${ponto.x},${ponto.y}).`);
    for (const t of [...this.combatants]) {
      if (t.dead || t.hp <= 0 || !t.pos || !area.has(`${t.pos.x},${t.pos.y}`)) continue;
      const save = this.resistencia(t, 'int', cd, { contra: { dano: 'psíquico', condicao: 'incapacitado' } });
      const r = this.explicarResistencia(t, 'int', cd, save, { contra: 'Rasgo Sináptico', seSucesso: 'metade do dano, sem ficar incapacitado' });
      const d = damageRoll(this.rng, '4d6');
      const dano = save.success ? Math.floor(d.total / 2) : d.total;
      this.say('dano', `O Rasgo Sináptico atinge ${t.name}: ${dano} psíquicos${save.success ? '' : ', e ele fica incapacitado'}.`, r.conta, { rolagem: r });
      this.applyDamage(t, dano, 'psíquico', m, { magico: true });
      if (!save.success && !t.dead && t.hp > 0) this.aplicarCondicao(t, 'incapacitado', { rounds: 1, source: m.id, lado: m.side, quando: 'fim' });
    }
    this.onEvent({ type: 'habilidade', actor: m, id: 'rasgoSinaptico' });
    return true;
  }

  /**
   * A SANGUESSUGA da gêmula encefálica (o Obelisco, ação bônus): Destreza CD 14 de quem está a 1,5 m; falhou, ela gruda.
   * O livro a põe DENTRO do espaço do alvo; aqui ela fica colada nele e vai junto (`inicioDoTurnoDoBloco`), porque duas
   * fichas na mesma casa quebram tudo o que pergunta "quem está aqui".
   */
  sanguessuga(m, alvo, { cd = 14 } = {}) {
    if (m.bonusUsed || m.gemulaEm || !alvo || alvo.dead || distanceFt(m.pos, alvo.pos) > 5) return false;
    m.bonusUsed = true;
    const save = this.resistencia(alvo, 'dex', cd, { contra: { condicao: 'sanguessuga' } });
    const r = this.explicarResistencia(alvo, 'dex', cd, save, { contra: 'Sanguessuga', seSucesso: 'escapa da gêmula' });
    if (save.success) {
      this.say('condicao', `${m.name} pula em ${alvo.name}, que a tira de cima a tempo.`, r.conta, { rolagem: r });
      return true;
    }
    m.gemulaEm = alvo.id;
    this.aplicarCondicao(alvo, 'sanguessuga', { source: m.id, data: { escape: 15 } });
    this.say('condicao', `${m.name} gruda em ${alvo.name} e crava as perninhas.`, r.conta, { rolagem: r });
    return true;
  }

  /** O ESMAGAMENTO PSÍQUICO da gosma cinzenta psíquica (recarga 5–6): quem ela sente a até 18 m, Inteligência CD 10, 3d6. */
  esmagamentoPsiquico(m, alvo, { cd = 10 } = {}) {
    if (m.recarregando?.['Esmagamento Psíquico'] || m.actionUsed || !alvo || distanceFt(m.pos, alvo.pos) > 60) return false;
    (m.recarregando ??= {})['Esmagamento Psíquico'] = true;
    m.actionUsed = true;
    const save = this.resistencia(alvo, 'int', cd, { contra: { dano: 'psíquico' } });
    const r = this.explicarResistencia(alvo, 'int', cd, save, { contra: 'Esmagamento Psíquico', seSucesso: 'metade do dano' });
    const d = damageRoll(this.rng, '3d6');
    const dano = save.success ? Math.floor(d.total / 2) : d.total;
    this.say('dano', `${m.name} aperta a mente de ${alvo.name}: ${dano} psíquicos.`, r.conta, { rolagem: r });
    this.applyDamage(alvo, dano, 'psíquico', m, { magico: true });
    this.onEvent({ type: 'habilidade', actor: m, id: 'esmagamentoPsiquico' });
    return true;
  }

  /** EMPURRÃO TELECINÉTICO (o goblin psíquico lutador, ação bônus): alvo que ele vê a até 9 m, Força CD 13 ou cai. */
  empurraoTelecinetico(m, alvo, { cd = 13 } = {}) {
    if (m.bonusUsed || !alvo || alvo.dead || distanceFt(m.pos, alvo.pos) > 30) return false;
    m.bonusUsed = true;
    const save = this.resistencia(alvo, 'str', cd, { contra: { condicao: 'caido' } });
    const r = this.explicarResistencia(alvo, 'str', cd, save, { contra: 'Empurrão Telecinético', seSucesso: 'fica de pé' });
    if (save.success) {
      this.say('condicao', `${m.name} empurra ${alvo.name} com a mente, e ${alvo.name} se segura.`, r.conta, { rolagem: r });
    } else {
      this.aplicarCondicao(alvo, 'caido', { source: m.id });
      this.say('condicao', `${m.name} empurra ${alvo.name} com a mente: ${alvo.name} vai ao chão.`, r.conta, { rolagem: r });
    }
    return true;
  }

  /** LIDERANÇA (o cavaleiro, SRD): ação, uma vez por descanso; os aliados a até 9 m somam 1d4 em ataques e resistências por 1 minuto. */
  lideranca(m) {
    if (m.actionUsed || m.liderancaUsada || conditionEffects(m).incapacitated) return false;
    const aliados = this.combatants.filter((c) => c !== m && c.side === m.side && !c.dead && c.hp > 0 && distanceFt(c.pos, m.pos) <= 30);
    if (!aliados.length) return false;
    m.liderancaUsada = true;
    m.actionUsed = true;
    for (const a of aliados) if (!hasCondition(a, 'lideranca')) addCondition(a, 'lideranca', { rounds: 10, source: m.id });
    this.say('recurso', `${m.name} ergue a voz e dá as ordens: ${aliados.map((a) => a.name).join(', ')} somam 1d4 em ataques e resistências por um minuto (Liderança).`);
    return true;
  }

  /**
   * TELECINESE do comandante goblin psíquico (uma vez por dia, o livro). Ação: a Inteligência dele disputada com a Força
   * do alvo, a até 18 m; vencendo, o alvo é jogado até 9 m para longe dele e fica contido até o fim do próximo turno do
   * comandante.
   */
  telecinese(m, alvo) {
    if (m.actionUsed || m.telecineseUsada || !alvo || alvo.dead || distanceFt(m.pos, alvo.pos) > 60) return false;
    if (!this.field.hasLineOfSight(m.pos, alvo.pos)) return false;
    m.telecineseUsada = true;
    m.actionUsed = true;
    const dele = this.testeDeAtributo(m, 'int', abilityMod(m.abilities?.int ?? 10), 'Telecinese');
    const forca = abilityMod(alvo.abilities?.str ?? 10) + ((alvo.skills ?? []).includes('atletismo') ? (alvo.proficiency ?? 2) : 0);
    const doAlvo = this.testeDeAtributo(alvo, 'str', forca, 'contra a Telecinese', { pericia: 'atletismo' });
    if (doAlvo.total >= dele.total) {
      this.say('condicao', `${m.name} agarra ${alvo.name} com a mente, e ${alvo.name} se solta (${doAlvo.total} contra ${dele.total}).`);
      return true;
    }
    const de = { ...alvo.pos };
    this.empurrar(alvo, m.pos, 30);
    this.aplicarCondicao(alvo, 'contido', { rounds: 2, quando: 'fim', lado: m.side, source: m.id });
    this.say('condicao', `${m.name} ergue ${alvo.name} no ar com a mente e o arremessa ${distanceFt(de, alvo.pos)} pés para trás: preso no ar até o próximo turno dele (${dele.total} contra ${doAlvo.total}).`);
    return true;
  }

  heal(target, amount, source = null) {
    if (target.dead || amount <= 0) return 0;
    if (target.pos && Livro.noConeNegativo(this, target)) {
      this.say('aviso', `${target.name} não recupera PV: o cone de energia negativa não deixa.`);
      return 0;
    }
    if ((target.conditions ?? []).some((c) => CONDITIONS[c.id]?.semCura)) {
      this.say('aviso', `${target.name} não recupera PV: a necromancia ainda segura a ferida.`);
      return 0;
    }
    const was = target.hp;
    // Cura acorda quem caiu a 0 PV, não quem dorme por Sono (esse acorda por dano ou com um tapa).
    const revived = hasCondition(target, 'inconsciente') && target.hp <= 0;
    // `Math.max` porque `hp` pode estar acima do teto efetivo (exaustão nova):
    // curar jamais pode BAIXAR a vida de alguém.
    target.hp = Math.max(target.hp, Math.min(maxHpEfetivo(target), target.hp + amount));
    // FÚRIA ALÉM DA MORTE: curado acima de 0, as falhas somem e a morte adiada também.
    if (target.furiaAlemDaMorte && target.hp > 0) {
      target.furiaAlemDaMorte = false;
      target.morteAdiada = false;
      target.deathSaves = { successes: 0, failures: 0 };
      target.stable = false;
    }
    if (revived && target.hp > 0) {
      // Acorda, mas no chão: o `caido` fica até ele gastar o deslocamento
      // para se levantar.
      removeCondition(target, 'inconsciente');
      target.stable = false;
      target.deathSaves = { successes: 0, failures: 0 };
      this.say('cura', `${target.name} volta a si com ${target.hp} PV.`);
      // Fora da luta (acabou, ou explorando): de pé de graça. Na luta, o deslocamento zerado de quem estava
      // inconsciente volta (senão não sobra o meio deslocamento que levantar custa).
      if (this.over || this.explorando) this.levantarForaDoCombate(target);
      else if (!target.acted && this.side === target.side) target.movementLeftFt = this.speedOf(target);
    }
    this.onEvent({ type: 'heal', target, amount: target.hp - was, source });
    return target.hp - was;
  }

  deathSave(actor) {
    // Farol de Esperança: vantagem no teste de morte.
    // LEMBRANÇAS DOS FALECIDOS (Fantasma, 9º): com um berloque de alma, vantagem também.
    const r = d20(this.rng, 0, { advantage: conditionEffects(actor).vantagemMorte || Sub.comBerloque(actor) || Sub.vantagemNaMorteDoCampeao(this, actor) });
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
      // DESAFIAR A MORTE (Imortal, 6º)
      Sub.desafiarAMorte(this, actor);
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
    const foraSalvos = this.salvosDaFonte;
    const soma = new Map();
    const riso = new Set();
    this.danoDaFonte = soma;
    this.risoDaFonte = riso;
    // Quem cai neste golpe, com a sobra do dano (para o dano maciço).
    this.quedasDaFonte = fora ? foraQuedas : new Map();
    // Quem a Proteção contra a Morte segurou DENTRO deste golpe: as parcelas
    // seguintes da mesma fonte não o derrubam (a aranha dá perfurante e veneno).
    this.salvosDaFonte = fora ? foraSalvos : new Set();
    try { fn(); } finally {
      this.danoDaFonte = fora;
      this.risoDaFonte = foraRiso;
      this.quedasDaFonte = foraQuedas;
      this.salvosDaFonte = foraSalvos;
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
      const save = this.resistencia(t, cond.data.save, cond.data.dc, { vantagem: true, contra: { condicao: cond.id } });
      if (save.success) {
        removeCondition(t, cond.id);
        this.say('condicao', cond.id === 'dominado' ? `${t.name} sacode a dor e volta a ser dono de si.` : `${t.name} para de rir com o golpe.`);
      }
    }
  }

  concentrationCheck(actor, damage, fonte = null) {
    // TENTÁCULOS AGARRADORES (Insondável, 10º): o dano não quebra a concentração nos Tentáculos Negros de Evard.
    if (Sub.concentracaoFirme(actor)) {
      this.say('concentracao', `${actor.name} mantém os tentáculos (Tentáculos Agarradores).`);
      return;
    }
    // CONJURAÇÃO FOCADA (mago de Conjuração, 10º): o dano não quebra a concentração numa magia de conjuração.
    if (actor.features?.includes('focusedConjuration') && getSpell(actor.concentrating?.spellId)?.school === 'conjuração') {
      this.say('concentracao', `${actor.name} mantém a concentração (Conjuração Focada).`);
      return;
    }
    const dc = Math.max(10, Math.floor(damage / 2));
    // CONJURADOR DE GUERRA (vantagem) e MATADOR DE MAGOS (desvantagem a quem ele fere): talentos.
    const t = concentracaoDosTalentos(actor, fonte);
    const save = this.resistencia(actor, 'con', dc, { vantagem: t.vantagem, desvantagem: t.desvantagem, contra: { concentracao: true } });
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
    // A METAMORFOSE que acaba devolve a forma de cada um
    if (conc.formas) for (const t of conc.targets) if (t.formaSelvagem?.daMagia === conc.spellId) { despirFera(t, 0); this.say('magia', `${t.name} volta à forma de antes.`); }
    // Conjurar Animais: as feras somem com a concentração (e a Mão de Bigby, a Espada de Mordenkainen).
    // E a DANÇA MACABRA: os mortos que ela ergueu caem quando a concentração acaba.
    if (SPELLS[conc.spellId]?.kind === 'invocar' || SPELLS[conc.spellId]?.kind === 'livro'
      || (SPELLS[conc.spellId]?.kind === 'animarMortos' && SPELLS[conc.spellId]?.concentration)) {
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
    if (alvo.pos && Livro.noConeAntimagia(this, alvo.pos)) return `${alvo.name} está no cone antimágico`;
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
      // Repouso Tranquilo (`rules/utilidade.js`): o corpo guardado não se ergue.
      if (alvo.repousoTranquilo) return 'o corpo está sob Repouso Tranquilo: não se ergue';
      if ((alvo.tipo ?? 'humanoide') !== 'humanoide') return 'só cadáveres humanoides';
      if (!['pequeno', 'médio'].includes(alvo.size ?? 'médio')) return 'só cadáveres Pequenos ou Médios';
      if (distanceFt(actor.pos, alvo.pos) > spell.rangeFt) return 'é de toque: chegue perto do corpo';
      return null;
    }
    if (alvo.dead) return 'sem alvo';
    if (conditionEffects(alvo).inalcancavel) {
      return `${alvo.name} ${conditionEffects(alvo).motivoInalcancavel ?? 'está fora de alcance'}`;
    }
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
      return spell.todas ? `${alvo.name} não está amaldiçoado` : `${alvo.name} não está cego, envenenado, paralisado nem doente`;
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

  /**
   * A MURALHA COMO O LIVRO A DESCREVE. Três formas, e quem escolhe é quem conjura:
   *  - a RETA, de través para quem lança e centrada no ponto mirado — é o que sai do clique simples;
   *  - o CAMINHO LIVRE, dobrando em cada escala que o jogador marcou. É o que a Muralha de Vento
   *    permite (o livro deixa dar à muralha a forma que se quiser, desde que ela faça um caminho
   *    contínuo pelo chão), e SÓ ela: o livro não dá forma livre à Muralha de Fogo;
   *  - o ANEL, que o livro dá só à Muralha de Fogo (6 m de diâmetro).
   * O comprimento é o do livro, contado em CASAS, e cada ponta PARA na primeira parede em vez de
   * pular por cima dela: a muralha do livro é contínua, e muralha com buraco é outra magia. Antes a
   * diagonal saía com o dobro das casas, porque cada passo ganhava a casa de apoio e nenhuma delas
   * contava no comprimento — uma muralha de 15 m com 20 casas de frente.
   */
  muralhaDaMagia(actor, spell, alvo, areaFt, { escalas = null, opcao = null } = {}) {
    if (!alvo || !this.field.inside(alvo.x, alvo.y) || this.field.blocksSight(alvo.x, alvo.y)) return [];
    const n = Math.max(1, Math.round(areaFt / 5));
    const vistos = new Set();
    const muro = [];
    const livre = (x, y) => this.field.inside(x, y) && !this.field.blocksSight(x, y);
    const poe = (x, y) => {
      if (muro.length >= n || vistos.has(key(x, y)) || !livre(x, y)) return;
      vistos.add(key(x, y));
      muro.push({ x, y });
    };
    // O ANEL: a borda de um bloco de 4x4 casas em volta do cruzamento mirado, andada em ordem, pela
    // mesma convenção da esfera do livro (o ponto é o canto de cima e da esquerda da casa). São 12
    // casas de perímetro — 18 m, exatamente o comprimento que o livro dá à muralha — cercando quatro
    // casas de miolo, que é o que um anel de 6 m de diâmetro cerca.
    if (spell.muralhaAnel && (opcao ?? '').startsWith('anel')) {
      const x0 = alvo.x - 2;
      const y0 = alvo.y - 2;
      for (let i = 0; i < 4; i += 1) poe(x0 + i, y0);
      for (let i = 1; i < 4; i += 1) poe(x0 + 3, y0 + i);
      for (let i = 2; i >= 0; i -= 1) poe(x0 + i, y0 + 3);
      for (let i = 2; i >= 1; i -= 1) poe(x0, y0 + i);
      return muro;
    }
    // O CAMINHO LIVRE: as escalas que o jogador marcou, em ordem, e o ponto mirado no fim. Cada
    // trecho anda casa a casa por passo ORTOGONAL, então duas casas seguidas se tocam pela ARESTA;
    // em diagonal se tocariam só pela quina, e alguém passaria entre elas (foi o buraco da Lufada).
    if (spell.muralhaLivre && escalas?.length) {
      const pontos = [...escalas, alvo];
      poe(pontos[0].x, pontos[0].y);
      for (let i = 1; i < pontos.length && muro.length < n; i += 1) {
        let x = pontos[i - 1].x;
        let y = pontos[i - 1].y;
        while ((x !== pontos[i].x || y !== pontos[i].y) && muro.length < n) {
          const dx = pontos[i].x - x;
          const dy = pontos[i].y - y;
          if (Math.abs(dx) >= Math.abs(dy)) x += Math.sign(dx);
          else y += Math.sign(dy);
          if (!livre(x, y)) return muro;
          poe(x, y);
        }
      }
      return muro;
    }
    // A RETA: cresce do meio para os dois lados, e cada lado para na primeira parede.
    const dir = this.direcaoDe(actor.pos, alvo);
    const lado = { x: -dir.y, y: dir.x };
    if (!lado.x && !lado.y) return [];
    const apoio = !!(lado.x && lado.y);
    poe(alvo.x, alvo.y);
    if (apoio) poe(alvo.x + lado.x, alvo.y);
    const parou = new Map([[1, false], [-1, false]]);
    for (let d = 1; muro.length < n && [...parou.values()].includes(false); d += 1) {
      for (const s of [1, -1]) {
        if (parou.get(s) || muro.length >= n) continue;
        const x = alvo.x + lado.x * d * s;
        const y = alvo.y + lado.y * d * s;
        if (!livre(x, y)) { parou.set(s, true); continue; }
        poe(x, y);
        // Na diagonal cada passo ganha a casa de apoio ao lado, senão a reta deixa passar pela quina.
        if (apoio) poe(x + lado.x, y);
      }
    }
    // Em ORDEM ao longo da muralha: é a ordem que dá a tangente de cada casa, e a tangente é quem
    // diz de que LADO está cada vizinha (o lado quente da Muralha de Fogo).
    muro.sort((a, b) => (a.x * lado.x + a.y * lado.y) - (b.x * lado.x + b.y * lado.y));
    return muro;
  }

  /**
   * As casas de UM LADO da muralha, até `alcanceFt`. De que lado está uma casa sai do SINAL do
   * produto vetorial entre a tangente local da muralha (a direção dela naquela casa) e o vetor até
   * a casa. A mesma conta serve para a reta, para o caminho que dobra e para o anel, porque a
   * muralha vem em ORDEM e então toda casa dela tem tangente. Numa dobra as duas tangentes brigam:
   * a casa que QUALQUER trecho põe deste lado fica deste lado — é a leitura generosa, e é ela que
   * faz o canto interno de um L queimar como canto. A distância é a do quadriculado (a diagonal
   * custa 1), então "a até 3 m" é "a até duas casas", como o livro conta na grade.
   */
  casasDoLadoDaMuralha(casas, s, alcanceFt) {
    const n = Math.max(1, Math.round(alcanceFt / 5));
    const parede = new Set(casas.map((t) => key(t.x, t.y)));
    const vistos = new Set();
    const saida = [];
    for (let i = 0; i < casas.length; i += 1) {
      const t = casas[i];
      const a = casas[Math.max(0, i - 1)];
      const b = casas[Math.min(casas.length - 1, i + 1)];
      // Muralha de uma casa só: sem vizinha não há tangente, e o lado vira o eixo x.
      const tx = (b.x - a.x) || (casas.length === 1 ? 1 : 0);
      const ty = b.y - a.y;
      for (let dy = -n; dy <= n; dy += 1) {
        for (let dx = -n; dx <= n; dx += 1) {
          const x = t.x + dx;
          const y = t.y + dy;
          const k = key(x, y);
          if (parede.has(k) || vistos.has(k)) continue;
          if ((tx * dy - ty * dx) * s <= 0) continue;
          if (!this.field.inside(x, y) || this.field.blocksSight(x, y)) continue;
          vistos.add(k);
          saida.push({ x, y });
        }
      }
    }
    return saida;
  }

  /**
   * O LADO QUENTE DA MURALHA DE FOGO. O livro dá a um lado da muralha, escolhido por quem conjura,
   * o dano de fogo contra quem termina o turno a até 3 m dele ou dentro da muralha. No anel, quem
   * escolhe diz `dentro` ou `fora`; na reta e no caminho, `longe` ou `perto` — de quem conjura,
   * medido pela distância média de cada lado até ele, que é o que as palavras significam. Lado
   * contra o paredão sai vazio, e aí o outro é o longe.
   */
  muralhaQuente(actor, spell, casas, opcao = null) {
    if (!spell.ladoQuenteFt || !casas.length) return [];
    const qual = (opcao ?? '').split('-')[1] ?? 'longe';
    // O ANEL é FECHADO, e num anel os dois lados não são "esquerda e direita": são DENTRO e FORA.
    // A tangente não serve aqui — ela dizia que a casa logo depois da quina do anel estava dentro
    // dele, e o "quente por dentro" de um anel de 6 m saía com 14 casas em vez das 4 que ele cerca.
    // Quem decide é a MOLDURA da muralha: dentro é o que fica dentro dela, fora é o resto.
    if (qual === 'dentro' || qual === 'fora') {
      const xs = casas.map((t) => t.x);
      const ys = casas.map((t) => t.y);
      const x0 = Math.min(...xs); const x1 = Math.max(...xs);
      const y0 = Math.min(...ys); const y1 = Math.max(...ys);
      const parede = new Set(casas.map((t) => key(t.x, t.y)));
      const dentroDaMoldura = (x, y) => x > x0 && x < x1 && y > y0 && y < y1;
      if (qual === 'dentro') {
        const saida = [];
        for (let y = y0 + 1; y < y1; y += 1) {
          for (let x = x0 + 1; x < x1; x += 1) {
            if (parede.has(key(x, y)) || !this.field.inside(x, y) || this.field.blocksSight(x, y)) continue;
            saida.push({ x, y });
          }
        }
        return saida;
      }
      // Fora: a faixa de 3 m em volta do anel, de todos os lados, menos o miolo e a própria muralha.
      // Os dois lados contam cada um as suas casas, então a mesma casa vem nos dois: `vistas` tira
      // a repetida (sem isso o anel quente por fora saía com 58 casas onde há 48).
      const vistas = new Set();
      return this.casasDoLadoDaMuralha(casas, 1, spell.ladoQuenteFt)
        .concat(this.casasDoLadoDaMuralha(casas, -1, spell.ladoQuenteFt))
        .filter((t) => {
          if (dentroDaMoldura(t.x, t.y) || vistas.has(key(t.x, t.y))) return false;
          vistas.add(key(t.x, t.y));
          return true;
        });
    }
    const a = this.casasDoLadoDaMuralha(casas, 1, spell.ladoQuenteFt);
    const b = this.casasDoLadoDaMuralha(casas, -1, spell.ladoQuenteFt);
    const media = (lista) => (lista.length ? lista.reduce((t, c) => t + distanceFt(actor.pos, c), 0) / lista.length : 0);
    const longe = media(a) >= media(b) ? a : b;
    return qual === 'perto' ? (longe === a ? b : a) : longe;
  }

  /** Os quadrados que a magia pega, a partir do conjurador e do ponto mirado. */
  areaDaMagia(actor, spell, alvo, circulo = null, extra = {}) {
    if (!spell.shape) return null;
    // Névoa Obscurecente: +6 m de raio por círculo acima do 1º.
    const areaFt = spell.areaFt + (spell.upcast?.areaFt ?? 0) * Math.max(0, (circulo ?? spell.level) - spell.level);
    let casas;
    let origem;
    if (spell.centradoEmSi) alvo = actor.pos;
    if (spell.shape === 'muralha') return this.muralhaDaMagia(actor, spell, alvo, areaFt, extra);
    if (spell.shape === 'sphere' || spell.shape === 'square') {
      if (!alvo) return null;
      // Ponto dentro da parede não tem área: vazava para o outro lado.
      if (this.field.blocksSight(alvo.x, alvo.y)) return [];
      // Bola de Fogo: o fogo se espalha pelos cantos, contado pelo caminho.
      // A esfera do livro é redonda e nasce num cruzamento de linhas (`esferaDoCruzamento`). Quem conta "a até X pés" de uma casa continua com `within`.
      const redonda = esferaDoCruzamento(spell);
      if (spell.contornaEsquinas) return this.areaQueContorna(alvo, areaFt, redonda);
      if (redonda) casas = this.field.circulo(alvo, areaFt);
      else casas = spell.shape === 'sphere' ? this.field.within(alvo, areaFt) : this.field.square(alvo, areaFt);
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
        if (!this.field.passaVisao(antes.x, antes.y, casa.x, casa.y)) break;
        linha.push(casa);
      }
      // Lufada de Vento: 3 m de largura são duas casas, a segunda ao LADO — pela aresta, não pela quina. Arredondar o vetor de través
      // dava (-1,1) na diagonal, e aí as duas fileiras se tocavam só no canto: sobrava uma coluna de buraco dentro do vento.
      if (spell.larguraFt >= 10) {
        const norma = Math.hypot(dx, dy);
        const trav = { x: -dy / norma, y: dx / norma };
        const lado = Math.abs(trav.x) >= Math.abs(trav.y) ? { x: Math.sign(trav.x) || 1, y: 0 } : { x: 0, y: Math.sign(trav.y) };
        const vistas = new Set(linha.map((c) => key(c.x, c.y)));
        for (const c of [...linha]) {
          const v = { x: c.x + lado.x, y: c.y + lado.y };
          if (vistas.has(key(v.x, v.y)) || !this.field.inside(v.x, v.y) || this.field.blocksSight(v.x, v.y)) continue;
          if (!this.field.passaVisao(c.x, c.y, v.x, v.y)) continue;   // parede entre a reta e a casa de lado
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
  areaQueContorna(origem, ft, redonda = false) {
    const passos = ft / 5;
    // Redonda: nasce nas quatro casas em volta do cruzamento e não sai do círculo; a parede ainda corta o que está atrás dela.
    const permitidas = redonda ? new Set(this.field.circulo(origem, ft).map((t) => key(t.x, t.y))) : null;
    const sementes = redonda
      ? [[0, 0], [-1, 0], [0, -1], [-1, -1]].map(([dx, dy]) => ({ x: origem.x + dx, y: origem.y + dy })).filter((t) => this.field.inside(t.x, t.y) && !this.field.blocksSight(t.x, t.y) && this.field.passaVisao(origem.x, origem.y, t.x, t.y))
      : [{ x: origem.x, y: origem.y }];
    const vistos = new Map(sementes.map((t) => [key(t.x, t.y), 0]));
    const fila = sementes.map((t) => ({ ...t, d: 0 }));
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
          if (!this.field.passaVisao(cur.x, cur.y, x, y)) continue;
          const k = key(x, y);
          if (vistos.has(k) || (permitidas && !permitidas.has(k))) continue;
          vistos.set(k, cur.d + 1);
          fila.push({ x, y, d: cur.d + 1 });
        }
      }
    }
    return [...vistos.keys()].map((k) => { const [x, y] = k.split(',').map(Number); return { x, y }; });
  }

  /** Elfos e meio-elfos têm a ancestralidade feérica: magia não os põe para dormir. */
  imuneASonoMagico(c) {
    return c.tipo === 'morto-vivo' || /^(elf|meio-elf)/i.test(c.ancestry ?? '') || c.traits?.includes('ascendenciaFeerica')
      || this.imuneACondicao(c, 'inconsciente');
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
    // Zona inofensiva (Luz do Dia, Ilusão Menor, Crescimento de Plantas, Névoa, Escuridão): ninguém é "afetado".
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
      if (spell.soInimigos) return { c, papel: 'poupado' };
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
  canCast(actor, spellId, { target = null, point = null, circulo = null, escalas = null, opcao = null } = {}) {
    // ATIRADOR ARCANO (talento): a magia que pede jogada de ataque tem o dobro do alcance (o toque fica toque).
    const spell = this.comAlcanceDoTalento(actor, getSpell(spellId));
    // A AÇÃO QUE UMA MAGIA CONCEDE (`magias-concedidas.js`) não pede conjuração: o guerreiro tocado pelo Sopro do Dragão sopra.
    const concedida = concedidasDe(actor).includes(spellId);
    // ... e a magia de um ITEM que conjura (a varinha na mão do guerreiro)
    const doItem = magiasDosItens(actor).includes(spellId);
    if (!actor.spellcasting && !concedida && !doItem) return { ok: false, why: 'não conjura magias' };
    if (spell?.cargaDe && !(getCondition(actor, spell.cargaDe)?.data?.cargas > 0)) return { ok: false, why: 'não sobra nenhum' };
    // TRANSFORMAÇÃO DE TENSER: enquanto dura, não se conjura magia (as concedidas não são magia).
    if (hasCondition(actor, 'transformacaoDeTenser') && !concedida) return { ok: false, why: 'na Transformação de Tenser não se conjura' };
    if (conditionEffects(actor).incapacitated) return { ok: false, why: 'incapacitado não conjura' };
    if (spell?.semMotor) return { ok: false, why: `${spell.name} ainda não tem efeito no jogo` };
    // a magia que pega numa CHAMA do mapa (Controlar Chamas, Pirotecnia): só numa casa com chama acesa
    if (spell?.exigeChama && point && !chamaNaCasa(this.field, point)) return { ok: false, why: 'não há chama acesa nessa casa' };
    // a AÇÃO DA RAÇA que é um golpe (as Mandíbulas Famintas): sem alvo ao alcance da arma, não sai
    if (spell?.exigeGolpe) {
      const pode = target ? this.canAttack(actor, target, spell.exigeGolpe) : { ok: false, why: 'escolha quem morder' };
      if (!pode.ok) return pode;
    }
    if (hasCondition(actor, 'debilitado')) return { ok: false, why: 'com a mente debilitada, não conjura' };
    // O CONE ANTIMÁGICO do observador: dentro dele, magia não sai
    if (Livro.noConeAntimagia(this, actor.pos)) return { ok: false, why: 'dentro do cone antimágico, a magia não sai' };
    // Dentro da pedra e no Plano Etéreo não se conjura para fora.
    if (conditionEffects(actor).inalcancavel) {
      return { ok: false, why: `quem ${conditionEffects(actor).motivoInalcancavel ?? 'está fora de alcance'} não conjura` };
    }
    // Forma Gasosa: a névoa não conjura — nem para desfazer a própria magia,
    // que é concentração e se solta sozinha quando o conjurador quiser.
    if (conditionEffects(actor).semAtaqueNemMagia) return { ok: false, why: 'em Forma Gasosa não se conjura' };
    // FORMA SELVAGEM: na pele da fera não se conjura — só com Magias Bestiais (druida, 18º).
    if (actor.formaSelvagem && !actor.features?.includes('beastSpells')) return { ok: false, why: `na forma de ${actor.formaSelvagem.nome} não se conjura` };
    // Silêncio: sem som não há verbal. Quem repete uma magia já em pé (o golpe é
    // só um gesto) passa, e a magia sem componente verbal (Ataque Certeiro) também.
    if (!(spell.reuso && actor.magiasAtivas?.[spellId]) && !spell.semVerbal
      && this.zonasEm(actor.pos).some((z) => z.silencio)) return { ok: false, why: 'dentro do Silêncio ninguém conjura' };
    if (hasCondition(actor, 'submerso') && !spell.semVerbal) return { ok: false, why: "debaixo d'água não se fala" };
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
        elemento: 'você sofre ácido, frio, fogo, elétrico ou trovejante',
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
      if (spell.kind === 'teleporte') {
        if (!point) return { ok: false, why: 'escolha a casa de chegada' };
        if (!this.field.inside(point.x, point.y) || this.field.blocksMove(point.x, point.y)) return { ok: false, why: 'casa bloqueada' };
        if (this.at(point.x, point.y)) return { ok: false, why: 'casa ocupada' };
        if (distanceFt(actor.pos, point) > spell.rangeFt) return { ok: false, why: 'fora de alcance' };
        return { ok: true, spell, circulo: ativa.circulo, reuso: true };
      }
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
    // O SOPRO DO DRACONATO só sai com o recurso: uma vez por descanso curto ou longo.
    if (spell.recursoRacial && !((actor.resources?.[spell.recursoRacial] ?? 0) > 0)) {
      return { ok: false, why: spell.recursoRacial === 'benignTransposition' ? 'a Transposição Benigna já foi usada: volta com um descanso longo ou ao conjurar conjuração de 1º círculo ou mais' : 'o sopro já foi usado: ele volta num descanso curto ou longo' };
    }
    // USO LIVRE de característica (magia racial, Maestria, Assinatura): sai sem espaço, e vem ANTES de gastar um.
    const livre = actor.geminada ? { circulo: actor.geminada.circulo, rotulo: 'Magia Gêmea' } : usoLivreDe(actor, spell, circulo);
    let slot = livre ? livre.circulo : this.circuloDeConjuracao(actor, spell, circulo);
    // Iniciado em Magia: a magia do talento sai uma vez sem espaço (só quando não há espaço, como sempre foi).
    const iniciado = !livre && slot === null && temUsoGratis(actor, spellId);
    if (iniciado) slot = spell.level;
    const gratis = livre ?? iniciado;
    if (slot === null) {
      const kiDela = actor.magiasDeKi?.find((m) => m.magia === spell.id);
      if (kiDela) return { ok: false, why: `sem ki (precisa de ${kiDela.custo}${(actor.resources?.ki ?? 0) > 0 ? `, tem ${actor.resources.ki}` : ''})` };
      return { ok: false, why: circulo ? `sem espaço de ${circulo}º círculo` : `sem espaço de magia de ${spell.level}º círculo ou maior` };
    }
    if (spell.exigeCaracteristica && !actor.features?.includes(spell.exigeCaracteristica)) return { ok: false, why: 'falta a característica que dá esta ação' };
    // o teleporte do SURTO SELVAGEM do bárbaro só existe com o efeito sorteado
    if (spell.exigeSurto && Sub.efeitoDoSurto(actor) !== spell.exigeSurto) return { ok: false, why: 'o surto desta Fúria não foi o do teleporte' };
    // DEFLEXÃO ARCANA: só truques até o fim do próximo turno.
    if (Sub.soTruques(actor, spell)) return { ok: false, why: 'depois da Deflexão Arcana, só truques até o fim do próximo turno' };
    // as ações de subclasse que se pagam com um recurso (os Caminhos Ocultos do druida dos Sonhos)
    if (spell.recursoDe && !((actor.resources?.[spell.recursoDe] ?? 0) > 0)) return { ok: false, why: 'sem usos: voltam no descanso longo' };
    // o uso do descanso longo, ou os pontos de feitiçaria (a Implosão Distorcida: um uso, ou 5 pontos)
    if (spell.recursoOuPontos) {
      const { recurso, pontos, campo = 'sorceryPoints', extra = 0 } = spell.recursoOuPontos;
      const tem = actor.resources?.[campo] ?? 0;
      const nome = campo === 'ki' ? 'de ki' : 'de feitiçaria';
      if (((actor.resources?.[recurso] ?? 0) > 0 ? tem < extra : tem < pontos + extra)) return { ok: false, why: `sem uso e sem ${pontos + extra} pontos ${nome}` };
    }
    // MAGIA TEMPESTUOSA: logo depois de uma magia de 1º círculo ou mais neste turno
    if (spell.depoisDeMagia && !(actor.magiasNoTurno ?? []).some((m) => m.level >= 1)) return { ok: false, why: 'só logo depois de uma magia de 1º círculo ou mais' };
    // PASSO DAS SOMBRAS: de penumbra ou escuridão, para penumbra ou escuridão
    if (spell.exigeSombra && (nivelDeLuz(this.field, actor.pos.x, actor.pos.y, fontesDeLuz(this)) >= CLARO || (point && nivelDeLuz(this.field, point.x, point.y, fontesDeLuz(this)) >= CLARO))) {
      return { ok: false, why: 'só de uma sombra para outra (penumbra ou escuridão)' };
    }
    // GOLPE DO ARCO ABRASADOR (Alma Solar): logo depois da ação de Atacar.
    if (spell.depoisDaAcaoDeAtaque && actor.acaoDeAtaque?.turno !== this.turnoKey()) return { ok: false, why: 'só logo depois da ação de Atacar' };
    // EXPLOSÃO SOLAR ABRASADORA: o ki a mais que se põe nela
    if (spell.kiPorOpcao && Number(opcao ?? 0) > (actor.resources?.ki ?? 0)) return { ok: false, why: `sem ki para ${opcao}` };
    if (spell.castTime === 'action' && actor.actionUsed && !(spell.noLugarDeUmAtaque && (actor.ataquesRestantes ?? 0) > 0)) return { ok: false, why: 'a ação deste turno já foi usada' };
    if (spell.nivelMinimo && (actor.level ?? 1) < spell.nivelMinimo) return { ok: false, why: `só a partir do ${spell.nivelMinimo}º nível` };
    if (spell.castTime === 'bonus' && actor.bonusUsed) return { ok: false, why: 'a ação bônus deste turno já foi usada' };
    if (spell.castTime === 'action' && actor.acaoLimitada) return { ok: false, why: 'a ação da Velocidade não conjura magia' };
    // Magia de ação bônus no turno: além dela, só um truque de 1 ação.
    const ja = (actor.magiasNoTurno ?? []).filter((m) => !m.semRegraDeBonus);
    const truqueDeAcao = (spell.level === 0 && spell.castTime === 'action') || spell.semRegraDeBonus;
    if (ja.some((m) => m.castTime === 'bonus') && !truqueDeAcao) {
      return { ok: false, why: 'depois de uma magia de ação bônus, só um truque de 1 ação neste turno' };
    }
    if (spell.castTime === 'bonus' && !spell.semRegraDeBonus && ja.some((m) => !(m.level === 0 && m.castTime === 'action'))) {
      return { ok: false, why: 'magia de ação bônus não sai no turno em que já saiu outra magia (só junto de um truque de 1 ação)' };
    }

    const precisaAlvo = ['attack', 'auto', 'heal', 'armadura', 'estabilizar', 'raios', 'restaurar', 'reviver', 'arma', 'vampirico', 'marca', 'mira', 'calor', 'ampliar', 'levitar', 'animarMortos'].includes(spell.kind)
      || (spell.kind === 'save' && !spell.shape) || (spell.kind === 'livro' && spell.alvo === 'criatura');
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
    if (['cone', 'cube', 'linha', 'muralha'].includes(spell.shape) && !this.areaDaMagia(actor, spell, point ?? target?.pos, circulo, { escalas, opcao })?.length) {
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

  /**
   * Conjurar com o que o conjurador soma a UMA rolagem de dano da magia (`bonusDeDanoPorTraco`): Evocação Potencializada e
   * Afinidade Elemental. O bônus fica pendente durante a magia e a PRIMEIRA rolagem de dano o consome (Raios Ardentes rolam
   * três, e só uma ganha).
   */
  castSpell(actor, spellId, opcoes = {}) {
    this.bonusDeMagia = bonusDeDanoPorTraco(actor, SPELLS[spellId]);
    const original = SPELLS[spellId];
    // O CRISTAL MENTAL armado (o Obelisco) vale no lugar da metamagia: o livro não deixa os dois na mesma magia.
    const cristal = this.cristalDaConjuracao(actor, original);
    const metas = cristal ? [] : this.metamagiasDaConjuracao(actor, original, opcoes);
    const ids = new Set(cristal ? [cristal.id] : metas.map((m) => m.id));
    // RÁPIDA e À DISTÂNCIA mudam a própria magia por esta conjuração (o tempo e o alcance); `finally` devolve o original.
    // LANÇA MÍSTICA (invocação): a Rajada Mística alcança 90 m.
    if (original?.id === 'rajadaMistica' && actor.features?.includes('eldritchSpear') && !ids.has('distantSpell')) {
      SPELLS[spellId] = { ...original, rangeFt: 300 };
    }
    // ESPOROS QUE SE ESPALHAM: a nuvem fere com o dado do halo de quem a solta
    if (original?.id === 'esporosQueSeEspalham') SPELLS[spellId] = { ...original, zona: { ...original.zona, dano: { ...original.zona.dano, dados: Sub.dadosDosEsporos(actor) } } };
    // ENCARNAÇÃO DA LEI (Ordem, 6º): ligada, a magia de encantamento de 1 ação sai como ação bônus, gastando um uso.
    if (Sub.encarnacaoDaLei(actor, original)) {
      SPELLS[spellId] = { ...original, castTime: 'bonus' };
      if (this.canCast(actor, spellId, opcoes).ok) {
        actor.resources.embodimentOfTheLaw -= 1;
        actor.encarnacaoLigada = false;
        this.say('recurso', `${actor.name} fala com a voz da lei: ${original.name} como ação bônus (Encarnação da Lei).`);
      } else SPELLS[spellId] = original;
    }
    // EXPLOSÃO SOLAR ABRASADORA (Alma Solar, 11º): cada ki a mais soma 2d6.
    if (original?.kiPorOpcao && this.canCast(actor, spellId, opcoes).ok) {
      const n = Math.min(3, Number(opcoes.opcao ?? 0) || 0);
      if (n > 0) {
        actor.resources.ki -= n;
        SPELLS[spellId] = { ...original, damage: `${2 + 2 * n}d6` };
        this.say('recurso', `${actor.name} põe ${n} de ki no orbe: ${2 + 2 * n}d6.`);
      }
    }
    // A AÇÃO CONCEDIDA que tira tipo, dano e CD da condição de quem a tem (o Sopro do Dragão: o tipo e a CD de quem conjurou).
    if (original?.daCondicao) {
      const cond = getCondition(actor, original.daCondicao);
      if (cond?.data) SPELLS[spellId] = { ...original, ...(cond.data.tipo ? { damageType: cond.data.tipo } : {}), ...(cond.data.dano ? { damage: cond.data.dano } : {}), ...(cond.data.dc ? { cdFixa: cond.data.dc } : {}) };
    }
    // TASHA (4º lote): o TENTÁCULO DAS PROFUNDEZAS com o dado do nível, e o tipo do GRIMÓRIO DESPERTO (Escribas)
    if (original) {
      const troca = Sub.magiaDoTce4(actor, SPELLS[spellId], opcoes, SPELLS) ?? Sub.magiaDosLivros2(actor, SPELLS[spellId]);
      if (troca) SPELLS[spellId] = troca;
    }
    // ATIRADOR ARCANO (talento): o dobro do alcance, a mesma conta de `canCast`.
    if (original && this.comAlcanceDoTalento(actor, original) !== original) SPELLS[spellId] = this.comAlcanceDoTalento(actor, SPELLS[spellId]);
    // SURTO "rápida": por um minuto, as magias de uma ação saem como ação bônus.
    const rapidaDoSurto = actor.surtoRapidoAte >= this.round && original?.castTime === 'action';
    if (original && (ids.has('quickenedSpell') || ids.has('distantSpell') || rapidaDoSurto)) {
      SPELLS[spellId] = {
        ...original,
        ...(ids.has('quickenedSpell') || rapidaDoSurto ? { castTime: 'bonus' } : {}),
        // o cristal SOMA 30 m ao alcance, onde a metamagia o dobra; nos dois, o toque vira 9 m
        ...(ids.has('distantSpell') ? { rangeFt: original.rangeFt <= 5 ? 30 : cristal ? original.rangeFt + 100 : original.rangeFt * 2 } : {}),
      };
    }
    // a Cuidadosa e a Potencializada do cristal valem para TRÊS (criaturas, dados); as do feiticeiro, para o Carisma dele
    const cuidado = cristal ? 3 : Math.max(1, abilityMod(actor.abilities?.cha ?? 10));
    // SOBRECANALIZAR (mago, 14º), armado: o dano de uma magia de até 5º círculo sai no máximo.
    const sobre = Boolean(actor.sobrecanalizaPronta && original && original.level >= 1 && original.level <= 5 && (original.damage || original.damage2));
    this.metaAtiva = ids.size || sobre ? {
      maximizar: sobre,
      dono: actor, ids,
      // o cristal só faz passar no teste (a Bola de Fogo ainda tira metade); a do feiticeiro, aqui, também zera o dano
      careful: ids.has('carefulSpell') ? { restantes: cuidado, zera: !cristal } : null,
      heightened: ids.has('heightenedSpell'), subtle: ids.has('subtleSpell'),
      empowered: ids.has('empoweredSpell') ? cuidado : 0, empoderou: false,
    } : null;
    const antesDeAcao = { acao: actor.actionUsed, bonus: actor.bonusUsed };
    const slotsAntes = actor.spellcasting?.slots?.slice();
    const mortosAntes = new Set(this.combatants.filter((c) => c.dead).map((c) => c.id));
    // SURTO: a próxima magia com resistência dá desvantagem a todos os alvos.
    const desvDoSurto = actor.surtoDesvSaveAte >= this.round && !!original?.save;
    if (desvDoSurto) this.surtoDesvConjurador = actor;
    this.magiaEmCurso = original ?? null;
    this.conjuradorEmCurso = actor;
    this.circuloEmCurso = opcoes?.circulo ?? original?.level ?? null;
    try {
      const r = this.castSpellBase(actor, spellId, opcoes);
      this.surtoDesvConjurador = null;
      if (r?.ok && desvDoSurto) delete actor.surtoDesvSaveAte;
      if (r?.ok && actor.surtoMaximoAte >= this.round && (original?.damage || original?.damage2)) delete actor.surtoMaximoAte;
      if (r?.ok) {
        // O círculo do espaço que a magia gastou (0 se foi truque ou uso livre).
        const gasto = slotsAntes ? slotsAntes.findIndex((n, i) => i >= 1 && n > (actor.spellcasting.slots[i] ?? 0)) : -1;
        this.depoisDaMagia(actor, original, r, { slotGasto: gasto > 0 ? gasto : (original?.level ?? 0), mortosAntes, gastouEspaco: gasto > 0 });
        // CEIFADOR (Domínio da Morte): a magia de necromancia de um alvo pega um segundo, de graça
        if (!r.reuso && !r.anulada) {
          const segundo = Sub.segundoAlvoDoCeifador(this, actor, original, opcoes);
          if (segundo) this.lancarDeGraca(actor, spellId, { ...opcoes, target: segundo });
        }
      }
      if (r?.ok && metas.length) this.pagarMetamagia(actor, original, metas, opcoes, r, antesDeAcao);
      if (r?.ok && cristal) this.gastarCristal(actor, original, cristal);
      // MATADOR DE MAGOS (talento): quem conjura a 1,5 m dele leva um golpe de reação.
      if (r?.ok) this.matadorDeMagosReage(actor);
      // a CARGA da ação concedida (o meteoro, a estrela): acabou, a condição vai junto (e a concentração dela, se for dela)
      if (r?.ok && original?.cargaDe) {
        const cond = getCondition(actor, original.cargaDe);
        if (cond?.data) {
          cond.data.cargas -= 1;
          if (cond.data.cargas <= 0) {
            removeCondition(actor, original.cargaDe);
            if (actor.concentrating?.condition === original.cargaDe) actor.concentrating = null;
            this.say('magia', `${actor.name} usou o último.`);
          }
        }
      }
      if (r?.ok && sobre) this.cobrarSobrecanalizar(actor, original);
      // VOZ DA AUTORIDADE (Ordem, 1º): o aliado que a magia mirou ataca com a reação.
      if (r?.ok) Sub.vozDaAutoridade(this, actor, original, [opcoes.target, ...(opcoes.targets ?? [])]);
      return r;
    } finally {
      if (original) SPELLS[spellId] = original;
      this.surtoDesvConjurador = null;
      this.metaAtiva = null;
      this.bonusDeMagia = null;
      this.magiaEmCurso = null;
      this.conjuradorEmCurso = null;
      this.circuloEmCurso = null;
    }
  }

  /** A magia com o alcance do ATIRADOR ARCANO, quando ele vale (o dobro, para quem pede jogada de ataque e não é de toque). */
  comAlcanceDoTalento(actor, spell) {
    if (!spell || !atiradorArcano(actor, spell) || !(spell.rangeFt > 5)) return spell;
    return { ...spell, rangeFt: spell.rangeFt * 2 };
  }

  /** MATADOR DE MAGOS (talento): quem conjura a 1,5 m de quem o tem leva um golpe de perto, de reação. */
  matadorDeMagosReage(conjurador) {
    if (this.reagindo || conjurador.dead) return;
    for (const m of this.combatants) {
      if (m.dead || m.side === conjurador.side || !temTalento(m, 'matadorDeMagos') || m.reactionUsed || conditionEffects(m).incapacitated
        || distanceFt(m.pos, conjurador.pos) > 5 || !this.field.contato(m.pos, conjurador.pos)) continue;
      const arma = this.armaDeOportunidade(m);
      if (arma === undefined || !this.canAttack(m, conjurador, arma).ok) continue;
      this.reagindo = true;
      try {
        m.reactionUsed = true;
        this.say('reacao', `${m.name} golpeia ${conjurador.name} no meio das palavras (Matador de Magos).`);
        this.resolveAttackBase(m, conjurador, { opportunity: true, weaponId: arma, reacao: true });
      } finally {
        this.reagindo = false;
      }
      if (conjurador.dead) return;
    }
  }

  /** IMUNIDADE A MAGIAS ESCOLHIDAS (o horror de elmo): a magia em curso não o fere nem o afeta. */
  imuneAMagiaEmCurso(alvo) {
    const m = this.magiaEmCurso;
    return Boolean(m && (alvo?.imuneAMagias?.includes(m.id) || Livro.imuneAMagiaDoLivro(this, alvo, m)));
  }

  /**
   * O que acontece DEPOIS de uma conjuração que deu certo, por características de subclasse. Os ganchos de cada uma ficam aqui, num
   * só lugar, em vez de espalhados pelas magias.
   */
  depoisDaMagia(actor, magia, resultado, { slotGasto = magia?.level ?? 0, mortosAntes = new Set(), gastouEspaco = true } = {}) {
    const f = actor.features ?? [];
    const escola = magia?.school;
    const nivelEfetivo = Math.max(slotGasto, magia?.level ?? 0);
    // TENTÁCULOS AGARRADORES (Insondável) e o golpe que o truque deixa à LÂMINA CANTANTE
    Sub.depoisDeConjurarTce4(this, actor, magia);
    Sub.depoisDeConjurarLivros2(this, actor, magia);
    // SURTO DE MAGIA SELVAGEM (feiticeiro): depois de uma magia de 1º círculo ou mais.
    if (f.includes('wildMagicSurge') && nivelEfetivo >= 1 && !this.surtando) {
      this.surtando = true;
      // O surto é outro efeito: não herda a Metamagia da magia que o causou.
      const metaDaMagia = this.metaAtiva;
      this.metaAtiva = null;
      this.surtoDesvConjurador = null;
      try { this.surtoDeMagia(actor); } finally { this.surtando = false; this.metaAtiva = metaDaMagia; }
    }
    // PROTEÇÃO ARCANA (Abjuração): uma abjuração de 1º círculo ou mais cria a proteção (PV = 2 × nível + INT) ou a recarrega em 2 × o círculo.
    if (f.includes('arcaneWard') && escola === 'abjuração' && nivelEfetivo >= 1) {
      const max = 2 * (actor.level ?? 1) + abilityMod(actor.abilities.int);
      if (actor.wardHp === undefined) {
        actor.wardHp = max;
        this.say('recurso', `${actor.name} tece uma proteção arcana em si mesmo (${max} PV).`);
      } else {
        actor.wardHp = Math.min(max, actor.wardHp + 2 * nivelEfetivo);
        this.say('recurso', `${actor.name} recarrega a proteção arcana: ${actor.wardHp} PV.`);
      }
    }
    // ADIVINHAÇÃO ESPECIALISTA: uma adivinhação de 2º círculo ou mais devolve um espaço menor (até o 5º).
    if (f.includes('expertDivination') && gastouEspaco && ['adivinhação', 'divinação'].includes(escola) && slotGasto >= 2 && actor.spellcasting?.slots) {
      for (let i = Math.min(slotGasto - 1, 5); i >= 1; i -= 1) {
        if ((actor.spellcasting.slots[i] ?? 0) < (actor.spellcasting.slotsMax?.[i] ?? 0)) {
          actor.spellcasting.slots[i] += 1;
          this.say('recurso', `${actor.name} recupera um espaço de ${i}º círculo (Adivinhação Especialista).`);
          break;
        }
      }
    }
    // A recarga por escola: só a Transposição Benigna volta ao conjurar conjuração (o Encanto e o Eu Ilusório não têm essa regra no livro).
    for (const [feature, escolaDela] of [['benignTransposition', 'conjuração']]) {
      if (f.includes(feature) && escola === escolaDela && nivelEfetivo >= 1 && (actor.resources?.[feature] ?? 0) < (actor.resourcesMax?.[feature] ?? 0)) {
        actor.resources[feature] = actor.resourcesMax[feature];
        this.say('recurso', `${actor.name} recupera ${nomeDaCaracteristica(feature)} ao conjurar ${magia.name}.`);
      }
    }
    // COLHEITA SOMBRIA (Necromancia): matar com uma magia de 1º círculo ou mais devolve PV (2 × o círculo; 3 × se for necromancia).
    if (f.includes('grimHarvest') && nivelEfetivo >= 1) {
      const caiu = this.combatants.some((c) => c.dead && !mortosAntes.has(c.id) && c.side !== actor.side && !['constructo', 'morto-vivo'].includes(c.tipo));
      if (caiu) {
        const cura = (escola === 'necromancia' ? 3 : 2) * nivelEfetivo;
        const antes = actor.hp;
        actor.hp = Math.min(maxHpEfetivo(actor), actor.hp + cura);
        if (actor.hp > antes) this.say('cura', `${actor.name} colhe a vida do que matou: recupera ${actor.hp - antes} PV (Colheita Sombria).`);
      }
    }
    // PASSO DAS SOMBRAS: o teleporte dá vantagem no primeiro golpe corpo a corpo do turno.
    if (magia?.id === 'passoDasSombras') addCondition(actor, 'passoSombrio', { rounds: 1, source: actor.id });
    // MAGIA DE GUERRA (Cavaleiro Místico, 7º: com truque; 18º: com qualquer magia) e MAGIA DE BATALHA (bardo do Valor, 14º): depois de
    // conjurar com a AÇÃO, um ataque com arma como ação bônus.
    if (magia?.castTime === 'action' && (f.includes('improvedWarMagic') || f.includes('battleMagic') || (f.includes('warMagic') && magia.level === 0))) {
      actor.ataqueAposMagia = true;
    }
  }

  /**
   * A mesma magia de novo, num alvo novo, sem gastar ação, espaço nem recurso (o segundo alvo do CEIFADOR). Tudo o que a
   * conjuração gasta volta como estava.
   */
  lancarDeGraca(actor, spellId, opcoes) {
    const antes = { action: actor.actionUsed, bonus: actor.bonusUsed, slots: [...(actor.spellcasting?.slots ?? [])], magias: [...(actor.magiasNoTurno ?? [])], recursos: { ...(actor.resources ?? {}) } };
    actor.actionUsed = false;
    actor.bonusUsed = false;
    actor.magiasNoTurno = [];
    this.say('recurso', `${actor.name} estende a magia a ${opcoes.target.name} (Ceifador).`);
    try { this.castSpellBase(actor, spellId, opcoes); } finally {
      actor.actionUsed = antes.action;
      actor.bonusUsed = antes.bonus;
      if (actor.spellcasting) actor.spellcasting.slots = antes.slots;
      actor.magiasNoTurno = antes.magias;
      actor.resources = antes.recursos;
    }
  }

  /**
   * METAMAGIA armada (`actor.metaLigada`): as opções que servem a ESTA magia e cabem nos pontos de feitiçaria, na ordem em que foram
   * armadas. Cada uma custa o que o livro diz; a Magia Gêmea custa o círculo da magia (mínimo 1) e só serve a magia de um alvo,
   * sem concentração. Devolve `[{ id, custo }]`.
   */
  metamagiasDaConjuracao(actor, spell, opcoes = {}) {
    const armadas = (actor.metaLigada ?? []).filter((id) => actor.features?.includes(id));
    if (!spell || !armadas.length) return [];
    let pontos = actor.resources?.sorceryPoints ?? 0;
    const out = [];
    const serve = {
      carefulSpell: () => Boolean(spell.save),
      distantSpell: () => spell.rangeFt >= 5,
      empoweredSpell: () => Boolean(spell.damage),
      extendedSpell: () => Boolean(spell.concentration || spell.condition || spell.duracaoRodadas),
      heightenedSpell: () => Boolean(spell.save),
      quickenedSpell: () => spell.castTime === 'action' && !actor.bonusUsed,
      subtleSpell: () => spell.level > 0,
      twinnedSpell: () => !spell.concentration && !spell.shape && !spell.areaFt && (spell.targets ?? 1) <= 1
        && Boolean(opcoes.target) && Boolean(this.alvoGemeo(actor, spell, opcoes.target)),
    };
    const custo = { carefulSpell: 1, distantSpell: 1, empoweredSpell: 1, extendedSpell: 1, heightenedSpell: 3, quickenedSpell: 2, subtleSpell: 1,
      twinnedSpell: Math.max(1, spell.level) };
    for (const id of armadas) {
      if (!serve[id]?.() || custo[id] > pontos) continue;
      pontos -= custo[id];
      out.push({ id, custo: custo[id] });
    }
    return out;
  }

  /** O segundo alvo da Magia Gêmea: a criatura mais próxima do mesmo lado do primeiro, ao alcance da magia. */
  alvoGemeo(actor, spell, alvo) {
    return this.combatants
      .filter((o) => !o.dead && o !== alvo && o.side === alvo.side && distanceFt(actor.pos, o.pos) <= Math.max(spell.rangeFt, 5)
        && this.field.hasLineOfSight(actor.pos, o.pos))
      .sort((a, b) => (a === actor) - (b === actor) || distanceFt(actor.pos, a.pos) - distanceFt(actor.pos, b.pos))[0] ?? null;
  }

  /** Cobra os pontos de feitiçaria da metamagia que de fato saiu, e faz o que a opção faz DEPOIS da conjuração. */
  pagarMetamagia(actor, spell, metas, opcoes, resultado, antes) {
    const total = metas.reduce((s, m) => s + m.custo, 0);
    actor.resources.sorceryPoints -= total;
    const nomes = { carefulSpell: 'Cuidadosa', distantSpell: 'À Distância', empoweredSpell: 'Potencializada', extendedSpell: 'Prolongada',
      heightenedSpell: 'Elevada', quickenedSpell: 'Rápida', subtleSpell: 'Sutil', twinnedSpell: 'Gêmea' };
    this.say('recurso', `${actor.name} molda ${spell.name}: ${metas.map((m) => nomes[m.id]).join(' + ')} (${total} ponto${total > 1 ? 's' : ''} de feitiçaria, restam ${actor.resources.sorceryPoints}).`);
    const ids = new Set(metas.map((m) => m.id));
    this.prolongarMagia(actor, spell, ids);
    // GÊMEA: a mesma magia, sem custo, no segundo alvo.
    if (ids.has('twinnedSpell')) {
      const segundo = this.alvoGemeo(actor, spell, opcoes.target);
      if (segundo) {
        const depois = { acao: actor.actionUsed, bonus: actor.bonusUsed };
        actor.actionUsed = antes.acao; actor.bonusUsed = antes.bonus;
        actor.geminada = { circulo: opcoes.circulo ?? spell.level };
        this.metaAtiva = null;
        try { this.castSpellBase(actor, spell.id, { ...opcoes, target: segundo }); } finally { actor.geminada = null; }
        actor.actionUsed = depois.acao; actor.bonusUsed = depois.bonus;
      }
    }
  }

  /**
   * O CRISTAL MENTAL que vale nesta conjuração (o Obelisco, capítulo 7): o armado (`actor.cristalArmado`), se ainda está na
   * mochila, se a magia é de UMA AÇÃO e se o que ele faz serve a ela. Qualquer conjurador o usa — não é metamagia de
   * feiticeiro. O que não serve fica armado para a próxima. Devolve `{ itemId, id }` (o id da metamagia) ou null.
   */
  cristalDaConjuracao(actor, spell) {
    const itemId = actor.cristalArmado;
    if (!itemId || !spell || spell.castTime !== 'action' || !quantosNaMochila(actor, itemId)) return null;
    const id = itemDeId(itemId)?.dados?.metamagia;
    const serve = {
      carefulSpell: () => Boolean(spell.save),
      distantSpell: () => spell.rangeFt >= 5,
      empoweredSpell: () => Boolean(spell.damage || spell.damage2),
      extendedSpell: () => Boolean(spell.concentration || spell.condition || spell.duracaoRodadas),
      heightenedSpell: () => Boolean(spell.save),
      quickenedSpell: () => !actor.bonusUsed,
      subtleSpell: () => true,
    };
    return serve[id]?.() ? { itemId, id } : null;
  }

  /** O cristal usado vira uma pedra comum de 50 po, e desarma; a Prolongada faz o que faz depois da conjuração. */
  gastarCristal(actor, spell, { itemId, id }) {
    consumirDaMochila(actor, itemId);
    const bag = garantirInventario(actor).bag;
    const ja = bag.find((i) => i.id === 'cristalApagado');
    if (ja) ja.qtd += 1; else bag.push({ id: 'cristalApagado', tipo: 'item', qtd: 1 });
    actor.cristalArmado = null;
    this.say('recurso', `${actor.name} molda ${spell.name} com o ${nomeDeId(itemId)}, que se apaga e vira uma pedra comum.`);
    this.prolongarMagia(actor, spell, new Set([id]));
  }

  /** PROLONGADA: a duração dos efeitos de magia que esta conjuração pôs vale o dobro, até 24 horas. */
  prolongarMagia(actor, spell, ids) {
    if (ids.has('extendedSpell')) {
      for (const c of this.combatants) {
        for (const k of c.conditions ?? []) {
          if (k.magia?.id === spell.id && k.source === actor.id && Number.isFinite(k.rounds) && !k.prolongada) { k.rounds = Math.min(k.rounds * 2, 14400); k.prolongada = true; }
        }
      }
    }
    // PROLONGADA em magia de concentração: o limite de rodadas da concentração também dobra.
    if (ids.has('extendedSpell') && actor.concentrating?.spellId === spell.id && Number.isFinite(actor.concentrating.rounds)) {
      actor.concentrating.rounds = Math.min(actor.concentrating.rounds * 2, 14400);
    }
  }

  /**
   * O PREÇO do Sobrecanalizar: a primeira vez depois de um descanso longo não custa nada; a segunda, 2d12 de dano necrótico por círculo da
   * magia, e cada uso depois soma mais 1d12 por círculo. O dano ignora resistência e imunidade (aqui, entra direto nos PV).
   */
  cobrarSobrecanalizar(actor, spell) {
    actor.sobrecanalizaPronta = false;
    const usos = actor.sobrecanalUsos ?? 0;
    actor.sobrecanalUsos = usos + 1;
    this.say('recurso', `${actor.name} sobrecanaliza ${spell.name}: o dano sai no máximo.`);
    if (usos === 0) return;
    const dados = (usos + 1) * spell.level;
    const dano = damageRoll(this.rng, `${dados}d12`);
    this.say('dano', `A magia queima o próprio ${actor.name}: ${dano.total} necrótico (${dados}d12).`);
    actor.hp = Math.max(0, actor.hp - dano.total);
    if (actor.hp === 0 && actor.kind === 'pc') this.applyDamage(actor, 0, 'necrótico');
  }

  /** POTENCIALIZADA: rola de novo até CAR dados de dano que saíram abaixo da média (os piores), uma vez por magia. */
  empoderar(d) {
    const m = this.metaAtiva;
    // SOBRECANALIZAR: cada dado de dano vale o máximo (e o total sobe na diferença).
    if (m?.maximizar && d?.rolls?.length && !m.maximizou) {
      const lados = Number(/d(\d+)/.exec(d.notation ?? '')?.[1] ?? 0);
      if (lados) {
        m.maximizou = true;
        d.total += d.rolls.reduce((s, v) => s + (lados - v), 0);
        d.rolls = d.rolls.map(() => lados);
        return;
      }
    }
    if (!m?.empowered || m.empoderou || !d?.rolls?.length) return;
    const lados = Number(/d(\d+)/.exec(d.notation ?? '')?.[1] ?? 0);
    if (!lados) return;
    m.empoderou = true;
    const ordem = d.rolls.map((v, i) => [v, i]).filter(([v]) => v < (lados + 1) / 2).sort((a, b) => a[0] - b[0]).slice(0, m.empowered);
    for (const [v, i] of ordem) {
      const novo = this.rng.die(lados);
      if (novo > v) { d.total += novo - v; d.rolls[i] = novo; }
    }
  }

  /** O bônus de dano pendente de `actor` nesta magia, UMA vez; null se não há (ou já foi). */
  consumirBonusDeMagia(actor) {
    const b = this.bonusDeMagia;
    if (!b?.bonus || b.dono !== actor) return null;
    this.bonusDeMagia = { ...b, bonus: 0 };
    this.say('recurso', `${actor.name}: +${b.bonus} de dano (${b.motivos.join(' e ')}).`);
    return b;
  }

  castSpellBase(actor, spellId, { target = null, point = null, circulo = null, targets = null, opcao = null, escalas = null } = {}) {
    const check = this.canCast(actor, spellId, { target, point, circulo, escalas, opcao });
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
    // O SOPRO DO FIZBAN toma o lugar de UM golpe da ação de Atacar: os outros do Ataque Extra ficam guardados
    if (spell.castTime === 'action' && spell.noLugarDeUmAtaque) this.gastarGolpeDoAtaque(actor);
    else if (spell.castTime === 'action') actor.actionUsed = true;
    if (spell.castTime === 'bonus') actor.bonusUsed = true;
    if (check.gratis) gastarUsoGratis(this, actor, check.gratis);
    else if (spell.level > 0) actor.spellcasting.slots[slot] -= 1;
    if (spell.recursoRacial) actor.resources[spell.recursoRacial] -= 1;
    (actor.magiasNoTurno ??= []).push({ level: spell.level, castTime: spell.castTime, semRegraDeBonus: !!spell.semRegraDeBonus });
    // CORAÇÃO DA TEMPESTADE (Feitiçaria da Tempestade, 6º): ao começar a magia elétrica ou trovejante.
    Sub.coracaoDaTempestade(this, actor, spell);
    if (spell.recursoDe) actor.resources[spell.recursoDe] -= 1;
    if (spell.recursoOuPontos) {
      const { recurso, pontos, campo = 'sorceryPoints', extra = 0 } = spell.recursoOuPontos;
      if ((actor.resources?.[recurso] ?? 0) > 0) actor.resources[recurso] -= 1; else actor.resources[campo] -= pontos;
      if (extra) actor.resources[campo] -= extra;
    }
    // Contramágica: um inimigo atento pode interromper a magia antes de ela sair.
    if (this.tentarContramagia(actor, spell, slot, !!check.gratis)) {
      this.afterAction(actor);
      this.checkEnd();
      return { ok: true, anulada: true };
    }
    // Uma concentração por vez: a nova derruba a velha antes de tudo.
    if (spell.concentration) this.dropConcentration(actor);

    // A CD do Sopro do draconato é 8 + proficiência + CON, e não a de conjuração.
    // A CD de uma magia só (`spellcasting.cdPorMagia`, do bloco): a Teia do Cajado da Aranha do Nezznar tem CD 15, e as
    // outras magias dele, a 13 do conjurador.
    // O ITEM QUE CONJURA traz a CD e o ataque dele (a varinha: CD 15), quando o catálogo os dá
    const dc = check.gratis?.cd ?? spell.cdFixa ?? (spell.cdDeCon ? 8 + proficiencyBonus(actor.level ?? 1) + abilityMod(actor.abilities.con)
      : (actor.spellcasting?.cdPorMagia?.[spell.id] ?? spellSaveDc(actor)));
    const atkBonus = check.gratis?.ataque ?? spellAttackBonus(actor);
    // para a explicação da rolagem dizer de onde veio a CD (a da varinha, e não 8 + proficiência + atributo)
    this.cdDoItemEmCurso = check.gratis?.tipo === 'item' ? { quem: actor.id, cd: check.gratis.cd ?? null, ataque: check.gratis.ataque ?? null, nome: nomeDeId(check.gratis.item) } : null;
    const mod = spellMod(actor);
    // Truque cresce com o nível; magia de círculo, com o espaço gasto.
    const dano = dadosDaMagia(spell, { nivel: actor.level ?? 1, circulo: slot });
    this.say('magia', `${actor.name} conjura ${spell.name}${acima ? ` no ${slot}º círculo` : ''}.`);

    // Área afetada, para a camada de desenho marcar os quadrados.
    const areaTiles = this.areaDaMagia(actor, spell, point ?? target?.pos, slot, { escalas, opcao });

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
        ? (targets ?? perto(this.alliesOf(actor).concat([actor])).filter((a) => a.hp < maxHpEfetivo(a)))
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
      // AS MAGIAS DOS LIVROS que nenhum tipo do motor conjurava (`livro-motor.js conjurarDoLivro`, pelo `efeito`)
      case 'livro': {
        Livro.conjurarDoLivro(this, actor, spell, { target, targets, point, slot, dc, acima, opcao },
          { vestirFera, MONSTERS, spellAttackBonus, spellMod, skillBonus });
        break;
      }
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
          if (i === 0) { this.empoderar(d); const b = this.consumirBonusDeMagia(actor); if (b) d.total += b.bonus; }
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
        this.curadorAbencoado(actor, spell, slot, [target]);
        Sub.quebraFeiticos(this, actor, spell, slot, [target]);
        Sub.curaDoUnicornio(this, actor, spell, slot);
        Sub.curaDoCalice(this, actor, spell, slot);
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
          // O deslocamento do turno ANTES de a magia soltar o que prendia. A
          // ordem importa: medido depois do `removeAoReceber`, o alvo já
          // aparecia com o passo cheio, a conta do reembolso achava que ele
          // tinha gasto o turno inteiro, e a Liberdade de Movimento soltava a
          // heroína contida para deixá-la parada até o turno seguinte.
          const antesDoPasso = this.speedOf(a);
          for (const id of CONDITIONS[spell.condition]?.removeAoReceber ?? []) removeCondition(a, id);
          // Duração sem concentração, contada no turno de quem conjurou.
          const duracao = spell.rodadasProprias
            ? { rounds: spell.rodadasProprias, lado: actor.side, quando: 'fim' }
            : {};
          // Arma Mágica (+2 no 4º, +3 no 6º) e Arma Elemental (+2/2d4 no 5º, +3/3d4 no 7º).
          const bonusArma = Object.entries(spell.escalaBonus ?? {}).reduce((b, [c, v]) => (slot >= Number(c) ? v : b), spell.escalaBonus ? 1 : undefined);
          addCondition(a, spell.condition, {
            source: actor.id, ...duracao, magia: { id: spell.id, circulo: slot },
            data: { dc, pvTemp: mod, n: spell.imagens ?? 0, tipo, circulo: slot, bonusArma, dadosNoAcerto: bonusArma ? `${bonusArma}d4` : undefined, persistente: spell.persistente || undefined },
          });
          // Passos Largos e Voo valem já neste turno, não só no próximo. O que
          // sobra do turno é refeito a partir de `speedOf`, que é quem conhece
          // a metade do 2º degrau de exaustão e o 0 do 5º: somar o bônus cru
          // devolvia movimento a quem está com deslocamento 0.
          // A Liberdade de Movimento entra na mesma conta: ela solta o contido na
          // hora, e sem isto o herói ficava livre com o deslocamento do turno
          // ainda zerado — solto, e parado até o turno seguinte.
          if (a.side === this.side
            && (CONDITIONS[spell.condition]?.speedBonusFt || spell.condition === 'voando'
              || CONDITIONS[spell.condition]?.removeAoReceber?.length)) {
            const gasto = Math.max(0, antesDoPasso - (a.movementLeftFt ?? 0));
            a.movementLeftFt = Math.max(a.movementLeftFt ?? 0, this.speedOf(a) - gasto);
          }
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
          const save = this.resistencia(t, spell.save, dc, { vantagem: !!spell.vantagemEmCombate, contra: contraDaMagia(spell, actor) });
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
            data: spell.repete ? {
              save: spell.save, dc, repete: spell.repete,
              // ASSASSINO FANTASMAGÓRICO: quem falha a nova resistência leva o dano (mais um dado por círculo acima)
              ...(spell.danoAoFalhar ? { danoAoFalhar: {
                dano: spell.danoAoFalhar.dano.replace(/^(\d+)d/, (_, n) => `${Number(n) + Math.max(0, (slot ?? spell.level) - spell.level) * (spell.danoAoFalhar.porCirculo ?? 0)}d`),
                tipo: spell.danoAoFalhar.tipo,
              } } : {}),
            } : { dc, ...(CONDITIONS[spell.condition]?.repeteAoSofrerDano ? { save: spell.save } : {}) },
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
          // Adormecer é cair inconsciente, e a Fúria acaba aí também.
          if (hasCondition(c, 'furia')) { removeCondition(c, 'furia'); c.furiaAgiu = false; }
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

      case 'matar': {
        // PALAVRA DE PODER: MATAR — sem resistência: com PV até o limite, morre; com mais, a magia não faz nada.
        if (!target || target.dead) break;
        // A PALAVRA DE PODER ATORDOAR e a DANÇA IRRESISTÍVEL: sem teste na hora; a condição, que se repete depois
        if (spell.condicao) {
          if (target.hp > (spell.limitePv ?? Infinity)) { this.say('magia', `${target.name} tem mais de ${spell.limitePv} PV: ${spell.name} não o alcança.`); break; }
          const posta = this.aplicarCondicao(target, spell.condicao, { source: actor.id, magia: { id: spell.id, circulo: slot }, rounds: Infinity, data: spell.save ? { save: spell.save, dc, repete: true } : { dc } });
          if (posta && spell.concentration) {
            this.dropConcentration(actor);
            actor.concentrating = { spellId: spell.id, condition: spell.condicao, targets: [target], rounds: spell.duracaoRodadas ?? null };
          }
          this.say('condicao', posta ? `${target.name} fica ${CONDITIONS[spell.condicao]?.name.toLowerCase()} (${spell.name}).` : `${target.name} é imune a ${spell.name}.`);
          break;
        }
        if (target.hp <= (spell.limitePv ?? 100)) {
          this.say('dano', `${actor.name} pronuncia a palavra: ${target.name} morre.`);
          this.applyDamage(target, target.hp + (target.tempHp ?? 0), null, actor, { magico: true });
        } else {
          this.say('magia', `${target.name} tem mais de ${spell.limitePv ?? 100} PV: a palavra não o alcança.`);
        }
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
          const feriu = this.ataqueMagico(actor, alvo, spell, dano, dc, { bonusDano: agonizante });
          // EXPLOSÃO REPELENTE (invocação): quem a Rajada atinge é empurrado 3 m para longe do bruxo.
          if (feriu > 0 && spell.id === 'rajadaMistica' && actor.features?.includes('repellingBlast') && !alvo.dead) this.empurrar(alvo, actor.pos, 10);
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
        this.curadorAbencoado(actor, spell, slot, buffTargets ?? []);
        Sub.quebraFeiticos(this, actor, spell, slot, buffTargets ?? []);
        Sub.curaDoUnicornio(this, actor, spell, slot);
        Sub.curaDoCalice(this, actor, spell, slot);
        break;
      }

      case 'restaurar': {
        // Remover Maldição (`todas`): toda condição da lista; as outras tiram só a primeira.
        const ids = spell.todas ? spell.remove.filter((c) => hasCondition(target, c)) : [spell.remove.find((c) => hasCondition(target, c))];
        for (const id of ids) {
          removeCondition(target, id);
          // a podridão da múmia devolve o PV máximo que comeu
          if (id === 'podridaoDaMumia' && target.pvMaxDaPodridao) { target.maxHp += target.pvMaxDaPodridao; delete target.pvMaxDaPodridao; }
          // a doença curada leva junto o que ela pôs (a cegueira da podridão da vista, o PV máximo do otyugh)
          if (DOENCAS.includes(id)) curarDoencas(target);
          this.say('cura', spell.todas ? `${spell.name}: ${target.name} se livra de ${CONDITIONS[id].name.toLowerCase()}.` : `${target.name} não está mais ${CONDITIONS[id].name.toLowerCase()}.`);
          // Quem mantinha a maldição (concentração) a perde se não restar ninguém.
          if (spell.todas) this.soltouDaConcentracao(target, id);
        }
        break;
      }

      // Passo Nebuloso: some e aparece. Não passa pelas casas do meio, então
      // ninguém tem ataque de oportunidade.
      case 'teleporte': {
        const origemDoPasso = { ...actor.pos };
        this.teleportarPelaMagia(actor, spell, point, dc, dano);
        if (spell.depoisDoTeleporte) Raca.depoisDoTeleporte(this, actor, spell, origemDoPasso);
        // PASSO DISTANTE: a ação bônus de cada turno teleporta de novo, enquanto a concentração durar.
        if (spell.reuso) {
          (actor.magiasAtivas ??= {})[spell.id] = { circulo: slot, rodadas: spell.duracaoRodadas };
          if (spell.concentration) actor.concentrating = { spellId: spell.id, condition: null, targets: [], rounds: spell.duracaoRodadas };
        }
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
        if (spell.concentration) actor.concentrating = { spellId: spell.id, condition: null, targets: [], rounds: spell.duracaoRodadas };
        for (const t of this.alvosDaArma(actor, spell, target)) this.ataqueMagico(actor, t, spell, notacao, dc, { bonusDano: spell.addSpellMod ? mod : 0, slot });
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
          const save = this.resistencia(target, spell.save, dc, { contra: contraDaMagia(spell, actor) });
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
            const save = this.resistencia(t, spell.save, dc, { contra: contraDaMagia(spell, actor) });
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

      // Passos sem Pegadas: um véu que anda com o conjurador (a condição é dada a quem fica a 9 m).
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
        const n = spell.pacoteFixo ? pacote.n : pacote.n * (1 + Math.floor(acima / 2));
        actor.concentrating = { spellId: spell.id, condition: null, targets: [], rounds: spell.duracaoRodadas };
        const criadas = [];
        const antes = this.combatants.filter((c) => c.invocado && c.defId === pacote.defId).length;
        for (let i = 0; i < n; i++) {
          const c = this.invocar(actor, pacote.defId, actor.pos, { spellId: spell.id, sufixo: this.sufixoDeInvocado(pacote.defId, i, n, antes) });
          if (!c) break;
          // OS ESPÍRITOS DO TASHA: CA, PV, ataque, dano e golpes saem do círculo e de quem conjura
          if (spell.espirito) escalarEspirito(c, { circulo: slot, ataque: spellAttackBonus(actor), cd: dc });
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
        const defId = spell.criaturaDoCorpo ?? (opcao === 'zumbi' ? 'zumbi' : 'esqueleto');
        const extras = (spell.upcast?.criaturas ?? 0) * acima + (spell.corposBase ?? 1) - 1;
        const corpos = [target, ...this.combatants
          .filter((c) => c !== target && !this.porqueNaoAlvo(actor, spell, c))
          .sort((a, b) => distanceFt(actor.pos, a.pos) - distanceFt(actor.pos, b.pos))
          .slice(0, extras)];
        const erguidos = [];
        // A DANÇA MACABRA é de concentração: os mortos ficam enquanto ela dura (`dropConcentration` os derruba).
        if (spell.concentration) actor.concentrating = { spellId: spell.id, condition: null, targets: [], rounds: spell.duracaoRodadas ?? null };
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
          const save = this.resistencia(target, spell.save, dc, { contra: contraDaMagia(spell, actor) });
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
    // SUSCETIBILIDADE ANTIMÁGICA (a armadura animada, a vassoura animada): a magia que a move falha — Constituição contra a
    // CD de quem dissipa, ou cai inconsciente por 1 minuto.
    if (target.traits?.includes('suscetibilidadeAntimagica') && !target.dead) {
      const cd = spellSaveDc(actor);
      const sv = this.resistencia(target, 'con', cd, { contra: { magico: true } });
      const r = this.explicarResistencia(target, 'con', cd, sv, { contra: `${spell.name} de ${actor.name}`, seSucesso: 'continua de pé' });
      if (sv.success) this.say('magia', `${target.name} estremece, mas a magia que a move aguenta.`, r.conta, { rolagem: r });
      else {
        this.aplicarCondicao(target, 'inconsciente', { rounds: 10, source: actor.id });
        this.say('magia', `A magia que move ${target.name} se apaga: ela desaba, inerte, por um minuto (Suscetibilidade Antimágica).`, r.conta, { rolagem: r });
      }
    }
    // Uma fera de Conjurar Animais é a magia: dissipar nela encerra a magia toda.
    if (target.invocado && SPELLS[target.invocado.spellId]?.concentration) {
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
        // Passos sem Pegadas: quem foi dissipado não ganha o véu de volta ao renová-lo.
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
    // CORRENTE DE RELÂMPAGOS (`autoJuntos`): sem lista de alvos, o raio salta para os inimigos mais próximos do primeiro.
    if (spell.autoJuntos && target && !targets?.length) {
      const primeiro = target;
      targets = [primeiro, ...this.combatants
        .filter((o) => !o.dead && o !== primeiro && o.side === primeiro.side && distanceFt(o.pos, primeiro.pos) <= spell.juntosFt)
        .sort((a, b) => distanceFt(a.pos, primeiro.pos) - distanceFt(b.pos, primeiro.pos))];
    }
    const varios = spell.alvos && targets?.length
      ? targets.filter((t, i, l) => l.indexOf(t) === i && !this.porqueNaoAlvo(actor, spell, t)
        && distanceFt(t.pos, targets[0].pos) <= spell.juntosFt).slice(0, spell.alvos)
      : null;
    const pegos = spell.soZona ? []
      : areaTiles ? this.afetadosPelaArea(actor, spell, areaTiles, slot)
      : varios ? varios.map((c) => ({ c, papel: 'inimigo' }))
        : target ? [{ c: target, papel: 'inimigo' }] : [];
    // DOBRE FÚNEBRE: contra quem já não tem todos os PV, o dado maior.
    if (spell.danoSeFerido && pegos.length === 1 && pegos[0].c.hp < pegos[0].c.maxHp) dano = dadosDaMagia(spell, { nivel: actor.level ?? 1, circulo: slot, notacao: spell.danoSeFerido });
    // O dano de uma magia de área é rolado UMA vez para todos os alvos.
    const dmg = dano ? damageRoll(this.rng, dano) : null;
    let curaDoConjurador = 0;
    this.ajustarDanoDeDominio(actor, spell, dmg, dano);
    if (dmg) this.empoderar(dmg);
    if (dmg) { const b = this.consumirBonusDeMagia(actor); if (b) { dmg.total += b.bonus; dmg.mod = (dmg.mod ?? 0) + b.bonus; } }
    // GOLPE DE CHAMA: a segunda parcela, de OUTRO tipo. Rolada UMA vez para a
    // área, como a primeira — rolá-la dentro do laço de alvos dava um radiante
    // diferente para cada um, e o fogo igual para todos. E SEM o dado a mais do
    // círculo maior, que o livro soma uma vez ao total e não a cada tipo: com ele
    // nas duas, o 6º círculo dava 10d6 onde o livro dá 9d6.
    const dmg2 = spell.damage2 ? damageRoll(this.rng, spell.damage2) : null;
    // A teia nasce antes dos testes: quem fica contido fica preso A ELA.
    const zona = !reuso && spell.zona && areaTiles ? this.criarZona(actor, spell, areaTiles, dc, { opcao, centro: point ?? target?.pos, circulo: slot, tipo: spell.escolheTipoDoGlifo ? this.tipoDoGlifo(opcao, actor) : spell.escolheTipoDoCirculo ? this.tipoDoCirculo(opcao, actor) : null }) : null;
    // Raio Lunar e Esfera Flamejante: a zona anda com a ação (ou bônus).
    if (zona && spell.zona.movel) (actor.magiasAtivas ??= {})[spell.id] = { circulo: slot, rodadas: null, zona };
    const presos = [];
    // TRUQUE POTENTE (mago de Evocação, 6º): o truque de dano com resistência causa METADE do dano a quem passa (sem o efeito extra).
    const metade = !!spell.halfOnSave || (spell.level === 0 && !!actor.features?.includes('potentCantrip'));

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
        : this.resistencia(t, spell.save, dc, { contra: contraDaMagia(spell, actor) });
      const inc = conditionEffects(t).incapacitated;
      // MAGIA CUIDADOSA: quem foi poupado não sofre nem a metade do dano.
      // FERIR (o livro): o dano não deixa o alvo abaixo de 1 PV
      // PRISÃO MENTAL: o dano vem inteiro, passando ou não; o teste decide só a prisão.
      const cru = !dmg || save.cuidadosa ? 0 : spell.danoSempre ? dmg.total : danoPorResistencia(t, spell.save, metade, save.success, dmg.total, inc);
      const amount = save.success && metade && Livro.noCirculoDePoder(this, t) ? 0 : spell.naoMata ? Math.min(cru, Math.max(0, t.hp - 1)) : cru;
      const amount2 = !dmg2 || save.cuidadosa ? 0 : danoPorResistencia(t, spell.save, metade, save.success, dmg2.total, inc);
      // O que o sucesso compra é a decisão inteira: metade do dano ainda
      // vale conjurar numa multidão, nenhum dano não vale contra um alvo só.
      // Qual condição travou o teste: "falha automática" sem culpado deixa
      // o jogador sem saber que foi ELE quem criou essa abertura.
      const culpada = auto
        ? (t.conditions ?? []).find((c) => CONDITIONS[c.id]?.autoFailSaves?.includes(spell.save))
        : null;
      const efeito = spell.onFail ? `não fica ${CONDITIONS[spell.onFail.condition]?.name.toLowerCase()}` : null;
      const r = this.explicarResistencia(t, spell.save, dc, save, {
        contra: `${spell.name} (CD ${dc} = ${this.cdDoItemEmCurso?.quem === actor.id && this.cdDoItemEmCurso.cd === dc ? `a do item (${this.cdDoItemEmCurso.nome})` : actor.spellcasting?.cdPorMagia?.[spell.id] === dc ? 'a da própria magia, pelo bloco' : '8 + proficiência + atributo de conjuração'})`,
        seSucesso: efeito ?? (metade ? 'metade do dano' : 'nenhum dano'),
        automatica: auto,
        motivoAutomatico: culpada ? (CONDITIONS[culpada.id]?.name ?? culpada.id) : null,
      });
      const verbo = auto ? 'falha automaticamente' : save.success ? 'resiste' : 'falha';
      let danoPartes = [];
      if (dmg) {
        // Fora do `if`: a linha das duas parcelas é montada depois do dano, e
        // precisa delas lá embaixo.
        danoPartes = [parcelaDeDano(dmg2 ? spell.damageType : 'dano', dmg)];
        if (dmg2) danoPartes.push(parcelaDeDano(spell.damageType2, dmg2));
        r.danoPartes = danoPartes;
        r.danoAplicado = amount + amount2;
        // Com dois tipos, o parêntese diz o que o alvo LEVOU de cada um, e não
        // o que foi rolado: resistência a fogo muda a divisão, e afirmar a
        // divisão rolada era afirmar o que não aconteceu. Por isso a linha é
        // montada depois do dano, mais abaixo.
        if (!dmg2) {
          this.say(
            'magia',
            `${t.name} ${verbo} contra ${spell.name} e sofre ${amount}.`,
            `${r.conta} · ${contaDeDano(danoPartes[0])}${save.success && metade ? ` → metade = ${amount}` : ''}`,
            { rolagem: r },
          );
        }
      } else {
        this.say('magia', `${t.name} ${verbo} contra ${spell.name}.`, r.conta, { rolagem: r });
      }
      if (amount > 0 || amount2 > 0) {
        // As duas parcelas no MESMO golpe: um teste de concentração, não dois.
        // E o que foi APLICADO de cada uma (depois de resistência e imunidade)
        // volta para o registro: o texto dizia "19 (10 de fogo e 9 de
        // radiante)" onde o alvo resistente levou 14.
        this.umaFonteDeDano(() => {
          if (amount > 0) {
            const antesDoGolpe = t.hp;
            this.applyDamage(t, amount, spell.damageType, actor, { magico: true });
            if (amount > 0) Sub.surtoDePoder(this, actor, t);
            // e quem falha perde PV máximo igual ao dano que sofreu, até um descanso longo
            if (spell.reduzMaximo && !save.success && !t.dead && antesDoGolpe > t.hp) {
              const tira = Math.min(antesDoGolpe - t.hp, t.maxHp - 1);
              t.maxHp -= tira;
              t.maxHpPerdido = (t.maxHpPerdido ?? 0) + tira;
              this.say('condicao', `${t.name} perde ${tira} de PV máximo por uma hora.`);
            }
            r.aplicadoTipo1 = this.ultimoDano;
            // ENERVAÇÃO: quem conjura recupera parte do que causou (morto-vivo e constructo não dão nada).
            if (spell.curaOConjurador && !['morto-vivo', 'constructo'].includes(t.tipo)) curaDoConjurador += Math.floor((this.ultimoDano ?? 0) * spell.curaOConjurador);
          }
          if (amount2 > 0) {
            this.applyDamage(t, amount2, spell.damageType2, actor, { magico: true });
            r.aplicadoTipo2 = this.ultimoDano;
          }
        });
        if (amount > 0) this.maybeIgnite(t, spell.damageType);
        if (dmg2) {
          const a1 = r.aplicadoTipo1 ?? 0;
          const a2 = r.aplicadoTipo2 ?? 0;
          this.say(
            'magia',
            `${t.name} ${verbo} contra ${spell.name} e sofre ${a1 + a2} (${a1} de ${spell.damageType} e ${a2} de ${spell.damageType2}).`,
            `${r.conta} · ${danoPartes.map((q) => contaDeDano(q)).join(' · ')}${save.success && metade ? ' → metade de cada' : ''}`,
            { rolagem: r },
          );
        }
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
            data: { save: spell.save, dc, repete: spell.onFail.repete ?? false, escape: dc, foge: !!spell.onFail.foge, ...(spell.onFail.danoAoFalhar ? { danoAoFalhar: { ...spell.onFail.danoAoFalhar } } : {}),
              // o DANO QUE A CONDIÇÃO CARREGA (a Infusão Cáustica), com o círculo maior
              ...(spell.onFail.dadoDoDano ? { dano: dadosDaMagia(spell, { circulo: slot, notacao: spell.onFail.dadoDoDano }) } : {}) },
          });
          if (posta) {
            presos.push(t);
            if (conditionEffects(t).semReacao) t.reactionUsed = true;
            this.say('condicao', `${t.name} fica ${CONDITIONS[spell.onFail.condition]?.name.toLowerCase()}.`);
          }
        }
        // ESFERA VITRIÓLICA: mais ácido no fim do próximo turno de quem falhou.
        if (spell.onFail?.danoAtrasado && !t.dead) this.aplicarCondicao(t, 'acidoAtrasado', { rounds: 1, source: actor.id, data: { dano: spell.onFail.danoAtrasado } });
        if (spell.pushFt) {
          // Lufada de Vento: o vento empurra ao longo da linha, não "para longe de você".
          const de = spell.empurraAoLongo && dir ? { x: t.pos.x - dir.x, y: t.pos.y - dir.y } : actor.pos;
          this.empurrar(t, de, spell.pushFt);
        }
      }
    }
    if (curaDoConjurador > 0 && !actor.dead) {
      const pv = this.heal(actor, curaDoConjurador, actor);
      if (pv) this.say('cura', `${actor.name} bebe da vida que tirou: ${pv} PV.`);
    }
    return { presos, zona };
  }

  /**
   * O TELEPORTE de uma magia: quem conjura vai à casa escolhida. O PASSO TROVEJANTE leva junto um aliado colado (o mais
   * ferido; ele surge na casa livre mais perto) e explode na casa de onde saíram: quem estava a 3 m dela testa
   * Constituição, 3d10 trovejante, metade no sucesso.
   */
  teleportarPelaMagia(actor, spell, point, dc, dano) {
    const de = { ...actor.pos };
    // ANDARILHO NEBULOSO (Andarilho Feérico, 15º): o Passo Nebuloso leva um aliado colado
    const junto = spell.levaUmAliado || Sub.levaAliadoNoPasso(actor, spell)
      ? this.alliesOf(actor).filter((a) => a.hp > 0 && isAdjacent(a.pos, actor.pos)).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0] ?? null
      : null;
    // TELETRANSPORTE PSÍQUICO (Lâmina da Alma): o dado dá o alcance, e a lâmina que não chega cai no caminho
    if (spell.alcancePorDadoPsi) point = Sub.casaDoTeletransportePsiquico(this, actor, point);
    actor.pos = { x: point.x, y: point.y, f: actor.pos.f ?? 1 };
    this.say('magia', `${actor.name} reaparece a ${distanceFt(de, actor.pos)} pés dali.`);
    this.onEvent({ type: 'teleporte', actor, from: de, to: { ...actor.pos } });
    if (junto) {
      const deJunto = { ...junto.pos };
      const casa = this.casaLivreMaisProxima({ x: point.x, y: point.y, f: junto.pos.f ?? 1 });
      if (casa) {
        junto.pos = { ...junto.pos, x: casa.x, y: casa.y };
        this.say('magia', `${junto.name} vai junto.`);
        this.onEvent({ type: 'teleporte', actor: junto, from: deJunto, to: { ...junto.pos } });
      }
    }
    const boom = spell.explosaoNaSaida;
    if (boom && dano) {
      const r = damageRoll(this.rng, dano);
      this.say('magia', `Um estrondo na casa de onde ${actor.name} saiu.`, `${dano}[${r.rolls.join('+')}]`);
      for (const t of this.combatants.filter((c) => !c.dead && c.pos && c !== actor && c !== junto && distanceFt(c.pos, de) <= boom.raioFt)) {
        const sv = this.resistencia(t, boom.save, dc, { contra: contraDaMagia(spell, actor) });
        const rr = this.explicarResistencia(t, boom.save, dc, sv, { contra: spell.name, seSucesso: 'metade do dano' });
        const total = danoPorResistencia(t, boom.save, true, sv.success, r.total, conditionEffects(t).incapacitated);
        this.say('magia', `${t.name} ${sv.success ? 'resiste' : 'falha'} e sofre ${total} de ${boom.tipo}.`, rr.conta, { rolagem: rr });
        if (total > 0) this.applyDamage(t, total, boom.tipo, actor, { magico: true });
        // IMPLOSÃO DISTORCIDA (Mente Aberrante, 18º): quem falha é puxado para a casa de onde o feiticeiro saiu.
        if (boom.puxa && !sv.success) Sub.puxarParaASaida(this, t, de);
      }
    }
  }

  /**
   * Os alvos da ARMA de magia: o escolhido e, na que golpeia mais de uma vez (a Lâmina do Desastre, dois golpes), os
   * inimigos colados nele — sem outro, o mesmo alvo de novo.
   */
  alvosDaArma(actor, spell, target) {
    const n = spell.golpes ?? 1;
    const vizinhos = this.enemiesOf(actor).filter((c) => c !== target && !c.dead && c.hp > 0 && distanceFt(c.pos, target.pos) <= 5);
    return Array.from({ length: n }, (_, i) => (i === 0 ? target : vizinhos[i - 1] ?? target));
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
      this.atualizarTerrenoDasZonas();
      this.say('magia', `${actor.name} move ${spell.name}.`);
      this.onEvent({ type: 'spell', caster: actor, spell, point, areaTiles: casas, circulo: slot, reuso: true });
      this.afterAction(actor);
      return { ok: true };
    }
    if (spell.kind === 'teleporte') {
      this.teleportarPelaMagia(actor, spell, point, dc, null);
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
      for (const t of this.alvosDaArma(actor, spell, target)) this.ataqueMagico(actor, t, spell, ativa.dano, dc, { bonusDano: spell.addSpellMod ? spellMod(actor) : 0 });
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
    if (alvo && getCondition(c, 'desordemEntropica')?.source === alvo.id) removeCondition(c, 'desordemEntropica');
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
    // SANTUÁRIO DA NATUREZA (druida da Terra, 14º): uma besta ou planta que ataca o druida testa SAB contra a CD das magias dele.
    // Passou: está imune por 24 horas (aqui, para sempre nesta campanha de curta duração). Falhou: escolhe outro alvo, e o
    // ataque deste turno se perde.
    if (alvo.features?.includes('naturesSanctuary') && atacante.side !== alvo.side && ['fera', 'planta'].includes(atacante.tipo)) {
      alvo.passaramPeloSantuario ??= new Set();
      if (!alvo.passaramPeloSantuario.has(atacante.id)) {
        const dcN = spellSaveDc(alvo);
        const saveN = this.resistencia(atacante, 'wis', dcN);
        const rN = this.explicarResistencia(atacante, 'wis', dcN, saveN, { contra: `Santuário da Natureza de ${alvo.name}`, seSucesso: 'ataca, e fica imune por 24 horas' });
        if (saveN.success) alvo.passaramPeloSantuario.add(atacante.id);
        else {
          this.say('magia', `${atacante.name} recua diante da natureza que guarda ${alvo.name} e perde o ataque.`, rN.conta, { rolagem: rN });
          return false;
        }
      }
    }
    if (!Sub.passaPelaMajestade(this, atacante, alvo)) return false;
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
    const livre = usoLivreDe(c, spell);
    if (livre) return { spell, circulo: livre.circulo, livre };
    const circulo = this.circuloDeConjuracao(c, spell);
    return circulo === null ? null : { spell, circulo };
  }

  /** Paga o custo de uma magia de reação: cargas do cajado, uso livre (racial, Maestria, Assinatura) ou espaço. */
  pagarReacao(ator, pode) {
    if (pode.cajado) ator.spellcasting.cajado.cargas -= pode.cajado;
    else if (pode.livre) gastarUsoGratis(this, ator, pode.livre);
    else ator.spellcasting.slots[pode.circulo] -= 1;
    // A reação é uma magia conjurada: Proteção Arcana e as recargas por escola valem também para Escudo Arcano e Contramágica.
    if (pode.spell) {
      this.depoisDaMagia(ator, pode.spell, { ok: true }, {
        slotGasto: pode.cajado || pode.livre ? 0 : (pode.circulo ?? pode.spell.level), gastouEspaco: !pode.cajado && !pode.livre,
        mortosAntes: new Set(this.combatants.filter((c) => c.dead).map((c) => c.id)),
      });
    }
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
    this.pagarReacao(alvo, pode);
    this.aplicarCondicao(alvo, 'escudoArcano', { rounds: 1, source: alvo.id, lado: alvo.side, quando: 'inicio' });
    const doCajado = pode.cajado ? ` do cajado (${alvo.spellcasting.cajado.cargas} cargas)` : '';
    this.say('magia', `${alvo.name} ergue o Escudo Arcano${doCajado} (reação): CA ${ca + 5}, o ataque de ${atacante.name} erra.`);
    this.onEvent({ type: 'spell', caster: alvo, spell: pode.spell, target: alvo, point: alvo.pos, circulo: pode.circulo });
    return true;
  }

  /** Repreensão Infernal: quem fere o bruxo leva chamas, na reação dele. */
  /**
   * ESCONDER-SE em luta (Ação Ardilosa, Sumir): precisa de cobertura contra todo inimigo que o vê; Furtividade contra a maior
   * Percepção passiva deles. Escondido vira invisível até atacar (`quebraInvisibilidade`).
   */
  /** Vantagem em Furtividade pelo chão: a Camuflagem de Pedra na rocha, a Submersa (o polvo) na água. */
  furtividadeDoTerreno(c) {
    if (!c?.pos) return {};
    if (c.traits?.includes('camuflagemSubmersa') && this.field.aguas?.has(key(c.pos.x, c.pos.y))) return { advantage: true };
    if (c.traits?.includes('camuflagemDePedra') && TERRENO_DE_PEDRA.has(this.field.surfaceAt?.(c.pos.x, c.pos.y))) return { advantage: true };
    // CARAPAÇA E PELE DE CAMALEÃO (o thri-kreen, o troglodita): vantagem para se esconder em qualquer chão
    if (c.traits?.includes('camuflagemGeral')) return { advantage: true };
    return {};
  }

  esconder(actor) {
    const olhos = this.combatants.filter((o) => !o.dead && o.side !== actor.side && this.field.hasLineOfSight(o.pos, actor.pos));
    // FURTIVO (talento): na penumbra (levemente obscurecido), a cobertura não faz falta.
    const naPenumbra = temTalento(actor, 'furtivo') && actor.pos
      && nivelDeLuz(this.field, actor.pos.x, actor.pos.y, fontesDeLuz(this)) < CLARO;
    if (!naPenumbra && olhos.some((o) => this.field.coverBetween(o.pos, actor.pos) < 2)) {
      this.say('aviso', `${actor.name} tenta se esconder, mas não há onde (precisa de cobertura contra quem o vê).`);
      return false;
    }
    const cd = Math.max(0, ...olhos.map((o) => passivePerception(o)));
    const t = rolarPericia(this.rng, actor, 'furtividade', this.furtividadeDoTerreno(actor));
    if (olhos.length && t.total <= cd) {
      this.say('aviso', `${actor.name} tenta se esconder e é notado (Furtividade ${t.total} contra ${cd}).`);
      return false;
    }
    addCondition(actor, 'invisivel', { rounds: Infinity, source: actor.id, data: { escondido: true } });
    this.say('recurso', `${actor.name} se esconde (Furtividade ${t.total} contra ${cd}).`);
    return true;
  }

  /** DEFESA CONTRA A MARÉ (Caçador, 15º): reação; um ataque corpo a corpo que ERRA o patrulheiro é desviado para outra criatura ao alcance do atacante. */
  desviarParaOutro(atacante, alvo, opcoes) {
    if (this.reagindo || alvo.reactionUsed || !alvo.features?.includes('standAgainstTheTide') || conditionEffects(alvo).incapacitated) return;
    const outros = this.combatants.filter((o) => !o.dead && o !== atacante && o !== alvo && isAdjacent(atacante.pos, o.pos));
    // Prefere um aliado do atacante (o desvio dói em quem atacou); senão, qualquer um ao alcance.
    const novo = outros.find((o) => o.side === atacante.side) ?? outros[0];
    if (!novo) return;
    this.reagindo = true;
    try {
      alvo.reactionUsed = true;
      this.say('recurso', `${alvo.name} desvia o golpe de ${atacante.name} para ${novo.name} (Defesa Contra a Maré).`);
      this.resolveAttack(atacante, novo, opcoes);
    } finally {
      this.reagindo = false;
    }
  }

  /** NIMBO SAGRADO: quem começa o turno a 9 m de um paladino em nimbo sofre 10 de dano radiante. */
  nimboTick(c) {
    if (c.dead) return;
    for (const p of this.combatants) {
      if (p.dead || p.side === c.side || !hasCondition(p, 'nimboSagrado') || distanceFt(p.pos, c.pos) > 30) continue;
      this.say('dano', `A luz de ${p.name} queima ${c.name}.`);
      this.applyDamage(c, 10, 'radiante', p, { magico: true });
    }
  }

  /** RETALIAÇÃO (Berserker, 14º): reação. Quem sofre dano de uma criatura a 1,5 m a ataca corpo a corpo. Automática. */
  retaliacao(alvo, fonte) {
    if (!fonte || fonte === alvo || fonte.dead || alvo.dead || alvo.hp <= 0 || fonte.side === alvo.side || this.reagindo) return;
    if (!alvo.features?.includes('retaliation') || alvo.reactionUsed || conditionEffects(alvo).incapacitated || !isAdjacent(alvo.pos, fonte.pos)) return;
    this.reagindo = true;
    try {
      alvo.reactionUsed = true;
      this.say('recurso', `${alvo.name} revida (Retaliação, reação).`);
      this.resolveAttack(alvo, fonte, { opportunity: true });
    } finally {
      this.reagindo = false;
    }
  }

  reacaoAoDano(alvo, fonte) {
    // OS PEDREGULHOS do galeb duhr duram enquanto ele se concentra: dano no galeb, Constituição CD 10 ou metade do dano.
    if (alvo.pedregulhos?.length && this.ultimoDano > 0) {
      const cd = Math.max(10, Math.floor(this.ultimoDano / 2));
      const sv = this.resistencia(alvo, 'con', cd);
      if (!sv.success) this.pedregulhosVoltamAPedra(alvo, `${alvo.name} perdeu a concentração`);
    }
    this.vooDefensivo(alvo, fonte);
    this.repreensaoObsessiva(alvo, fonte);
    this.revideComGolpe(alvo, fonte);
    if (!fonte || fonte === alvo || fonte.dead || fonte.side === alvo.side || this.reagindo) return;
    const pode = this.podeReagirCom(alvo, 'repreensaoInfernal');
    if (!pode) return;
    if (distanceFt(alvo.pos, fonte.pos) > pode.spell.rangeFt || !this.field.hasLineOfSight(alvo.pos, fonte.pos)) return;
    this.reagindo = true;
    try {
      alvo.reactionUsed = true;
      this.pagarReacao(alvo, pode);
      const spell = pode.spell;
      const dc = spellSaveDc(alvo);
      this.say('magia', `${alvo.name} responde com Repreensão Infernal (reação).`);
      this.onEvent({ type: 'spell', caster: alvo, spell, target: fonte, point: fonte.pos, circulo: pode.circulo });
      const dmg = damageRoll(this.rng, dadosDaMagia(spell, { circulo: pode.circulo }));
      const save = this.resistencia(fonte, spell.save, dc, { contra: contraDaMagia(spell) });
      const amount = danoPorResistencia(fonte, spell.save, true, save.success, dmg.total, conditionEffects(fonte).incapacitated);
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
  extrasDoAcerto(atacante, alvo, { arma, ranged, tipo, critical, hpAntes = alvo.hp, atkTotal = null }) {
    const extra = (rotulo, dados, tipoDano, magico = true) => {
      if (alvo.dead) return;
      const r = damageRoll(this.rng, dados, { critical });
      this.say('magia', `${rotulo}: +${r.total} de ${tipoDano} em ${alvo.name}.`, `${dados}[${r.rolls.join('+')}]`);
      this.applyDamage(alvo, r.total, tipoDano, atacante, { magico });
      return r.total;
    };
    for (const cond of [...(alvo.conditions ?? [])]) {
      const m = CONDITIONS[cond.id]?.marcaDano;
      if (!m || cond.source !== atacante.id || (m.soArma && !arma)) continue;
      extra(CONDITIONS[cond.id].name, m.dados, m.tipo ?? tipo);
    }
    // LANÇAR PELO INFERNO armado: o acerto joga o alvo pelos planos inferiores (10d10 psíquico, menos em corruptor).
    if (atacante.hurlPronto && !alvo.dead) {
      atacante.hurlPronto = false;
      if (alvo.tipo !== 'corruptor') extra('Lançar pelo Inferno', '10d10', 'psíquico');
    }
    // PALMA VIBRANTE armada: o golpe que acerta deixa as vibrações no alvo (até o monge as encerrar).
    if (atacante.palmaPronta && !alvo.dead) {
      atacante.palmaPronta = false;
      alvo.vibracao = { donoId: atacante.id };
      this.say('recurso', `${alvo.name} começa a vibrar por dentro (Palma Vibrante).`);
    }
    // MALDIÇÃO DO LÂMINA MALDITA: + a proficiência no acerto de ataque (de arma ou de magia) contra o amaldiçoado.
    Sub.danoDaMaldicao(this, atacante, alvo, extra, tipo);
    // TASHA: o CHAMADO DA CAÇADA (1d6 uma vez por turno) e a IRA DA ORDEM (o aliado que acerta o amaldiçoado)
    Sub.dadoDaCaca(this, atacante, extra, tipo);
    Sub.iraDaOrdem(this, atacante, alvo, extra);
    // SURTO DE PODER (Magia de Guerra): o ataque de magia do mago.
    // ENXAME REUNIDO (Guardião do Enxame): qualquer ataque, de arma ou de magia
    Sub.enxameReunido(this, atacante, alvo, extra);
    // IRA DO GÊNIO (bruxo do Gênio): toda jogada de ataque, uma vez por turno
    Sub.iraDoGenio(this, atacante, alvo, extra);
    // OS OUTROS LIVROS: o Toque da Morte do clérigo, a Aura de Ódio, os Golpes Infundidos do draco, o Cutelo Elemental
    Sub.extrasDosLivros2(this, atacante, alvo, extra, { arma, ranged, tipo });
    // AS RAÇAS DOS LIVROS: as transformações do aasimar, a Fúria dos Pequenos e o Ataque Surpresa (`racas-motor.js`)
    Raca.extrasDaRaca(this, atacante, alvo, (rotulo, dados, t, magico) => extra(rotulo, dados, t ?? tipo, magico ?? true));
    if (!arma) { Sub.surtoDePoder(this, atacante, alvo); return; }
    const f = atacante.features ?? [];
    // MANOBRA armada (Mestre de Batalha): +dado de superioridade no dano e o efeito dela.
    // GOLPE DO COMANDANTE: o aliado que atacou a mando soma o dado do comandante (o dado já foi pago por ele).
    if (atacante.comandoDado) {
      const d = atacante.comandoDado;
      atacante.comandoDado = null;
      extra('Golpe do Comandante', d, tipo, false);
    }
    if (atacante.manobraPronta) this.aplicarManobra(atacante, alvo, extra, tipo, atkTotal, ranged);
    // GOLPE DIVINO (clérigo da Vida, 8º): +1d8 radiante UMA vez por turno no acerto de arma; 2d8 do 14º em diante.
    // os dados que somam ao golpe de arma (o resto deste bloco), e antes deles a MALDIÇÃO DO LÂMINA MALDITA
    // FÚRIA DIVINA (Fanático), os FLOREIOS (Espadas) e as LÂMINAS PSÍQUICAS (Sussurros): os dados que somam ao golpe de arma.
    Sub.furiaDivina(this, atacante, extra);
    // A FORMA DA FERA: a mordida que cura e a Fúria Infecciosa
    Sub.acertoDaFera(this, atacante, alvo);
    // TASHA (2º lote): a Entidade Simbiótica, o Golpe Psiônico, o Poder dos Gigantes, a Runa do Fogo, a Mão do Dano, o Corpo Astral
    Sub.dadoDaEntidade(this, atacante, extra, ranged);
    Sub.golpePsionico(this, atacante, alvo, extra);
    Sub.dadoDoGigante(this, atacante, extra, tipo);
    Sub.runaDoFogo(this, atacante, alvo, extra);
    Sub.maoDoDano(this, atacante, alvo, extra);
    Sub.golpeDoCorpoAstral(this, atacante, extra);
    // GOLPES TERRÍVEIS (Andarilho Feérico)
    Sub.golpesTerriveis(this, atacante, alvo, extra);
    // CANÇÃO DA VITÓRIA (Lâmina Cantante, 14º)
    Sub.cancaoDaVitoria(atacante, extra, tipo, ranged);
    // DISPARO ARCANO (Arqueiro Arcano) e o golpe da MARCA INABALÁVEL (Cavaleiro)
    Sub.disparoArcano(this, atacante, alvo, WEAPONS[atacante.armaDoGolpeAgora], { critical });
    if (atacante.danoDaMarca) extra('Marca Inabalável', `+${atacante.danoDaMarca}`, tipo, false);
    // o KENSEI (Tiro do Kensei, Golpe Hábil), o GUERREIRO PLANAR, o EMBOSCADOR TEMÍVEL e a PRESA DO MATADOR
    Sub.extrasDoKensei(this, atacante, extra, { ranged, tipo });
    if (atacante.golpePlanarAgora) { const d = atacante.golpePlanarAgora; atacante.golpePlanarAgora = null; extra('Guerreiro Planar', d, 'energético'); }
    if (atacante.golpeDoEmboscadorAgora) extra('Emboscador Temível', '1d8', tipo, false);
    Sub.extraDaPresa(this, atacante, alvo, extra, tipo);
    Sub.floreioDeLamina(this, atacante, alvo, { critical, tipo });
    Sub.laminasPsiquicas(this, atacante, extra);
    if (['divineStrike', 'divineStrikeThunder', 'divineStrikeWeapon', 'divineStrikeNature', 'divineStrikePoison', 'divineStrikeFire', 'divineStrikePsychic', 'divineStrikeNecrotic'].some((x) => f.includes(x)) && !atacante.golpeDivinoNoTurno) {
      atacante.golpeDivinoNoTurno = true;
      // Natureza: frio, fogo ou elétrico, o que o alvo não resiste. Os outros domínios têm tipo fixo.
      const naNatureza = ['fogo', 'frio', 'elétrico'].find((t) => !alvo.immune?.includes(t) && !alvo.resist?.includes(t)) ?? 'fogo';
      const tipoDivino = f.includes('divineStrikeThunder') ? 'trovejante' : f.includes('divineStrikeWeapon') ? tipo : f.includes('divineStrikeNature') ? naNatureza
        : f.includes('divineStrikePoison') ? 'veneno' : f.includes('divineStrikeFire') ? 'fogo' : f.includes('divineStrikePsychic') ? 'psíquico'
          : f.includes('divineStrikeNecrotic') ? 'necrótico' : 'radiante';
      // IRA DA ORDEM (Ordem, 17º): o golpe divino amaldiçoa o alvo para o próximo aliado
      Sub.marcarIraDaOrdem(this, atacante, alvo);
      const grandeG = (atacante.level ?? 1) >= 14;
      if (atacante.furiaDestrutivaPronta && ['elétrico', 'trovejante'].includes(tipoDivino)) {
        // IRA DESTRUTIVA: o dado do Golpe Divino sai no máximo.
        atacante.furiaDestrutivaPronta = false;
        extra('Golpe Divino (Ira Destrutiva)', `+${grandeG ? 16 : 8}`, tipoDivino, true);
      } else extra('Golpe Divino', grandeG ? '2d8' : '1d8', tipoDivino);
    }
    // DESTRUIÇÃO DIVINA APRIMORADA (paladino, 11º): +1d8 radiante em TODO acerto de arma corpo a corpo.
    if (f.includes('improvedDivineSmite') && !ranged) extra('Destruição Divina Aprimorada', '1d8', 'radiante');
    // MATADOR DE COLOSSOS (Caçador, escolha do 3º): +1d8 UMA vez por turno contra quem já estava ferido ANTES do golpe.
    if (f.includes('colossusSlayer') && !atacante.presaNoTurno && hpAntes < alvo.maxHp) {
      atacante.presaNoTurno = true;
      extra('Matador de Colossos', '1d8', tipo, false);
    }
    // SORVEDOR DE VIDA (invocação, Pacto da Lâmina, 12º): +CAR necrótico com a arma do pacto.
    if (f.includes('lifedrinker') && f.includes('pactOfTheBlade') && arma) {
      extra('Sorvedor de Vida', `+${Math.max(1, abilityMod(atacante.abilities.cha))}`, 'necrótico', true);
    }
    // MATADOR DE INIMIGOS (patrulheiro, 20º): uma vez por turno, soma o modificador de SAB ao dano contra um Inimigo Favorito.
    const vezDoTurno = `${this.round}:${this.side}`;
    if (f.includes('foeSlayer') && atacante.matadorNoTurno !== vezDoTurno && ehInimigoFavorito(atacante, alvo)) {
      atacante.matadorNoTurno = vezDoTurno;
      extra('Matador de Inimigos', `+${Math.max(1, abilityMod(atacante.abilities.wis))}`, tipo, false);
    }
    for (const a of this.auras ?? []) {
      if (a.tipo !== 'manto' || a.dono.dead || a.dono.side !== atacante.side) continue;
      if (distanceFt(a.dono.pos, atacante.pos) <= a.raioFt && this.field.hasLineOfSight(a.dono.pos, atacante.pos)) extra(a.nome, '1d4', 'radiante');
    }
    for (const cond of [...(atacante.conditions ?? [])]) {
      const def = CONDITIONS[cond.id];
      // Arma Elemental guarda o tipo escolhido na condição.
      const dna = def?.danoNoAcerto;
      if (dna?.alcanceFt && distanceFt(atacante.pos, alvo.pos) > dna.alcanceFt) continue;
      if (dna?.tiraCura && !alvo.dead) addCondition(alvo, 'semCura', { rounds: 1, quando: 'inicio', lado: atacante.side, source: atacante.id });
      if (dna && !(dna.soDistancia && !ranged) && !(dna.soPerto && ranged) && (arma || !dna.soPerto)) {
        extra(def.name, cond.data?.dadosNoAcerto ?? dna.dados, dna.tipo ?? cond.data?.tipo ?? tipo);
        // a CARGA ELEMENTAL do Absorver Elementos se gasta no primeiro acerto
        if (def.consumidaNoAcerto) { removeCondition(atacante, cond.id); continue; }
      }
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
          const amount = danoPorResistencia(c, 'dex', true, save.success, r.total, conditionEffects(c).incapacitated);
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
      } else if (g.efeito === 'bane') {
        // o banimento vem DEPOIS do dano: só quem fica com 50 PV ou menos (`livro-motor.js golpeBanidor`)
        alvo.banirDepois = true;
      } else if (g.efeito === 'cambaleia') {
        const save = this.resistencia(alvo, 'wis', dc, { contra: { magico: true } });
        if (!save.success && !alvo.dead) {
          this.aplicarCondicao(alvo, 'cambaleante', { rounds: this.side === alvo.side ? 2 : 1, quando: 'fim', lado: alvo.side, source: atacante.id });
          alvo.reactionUsed = true;
          this.say('condicao', `${alvo.name} cambaleia com o golpe.`);
        }
        this.dropConcentration(atacante);
      } else if (g.efeito === 'assusta') {
        const save = this.resistencia(alvo, 'wis', dc, { contra: { magico: true, condicao: 'amedrontado' } });
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
    // A invisibilidade do Corpo Vazio não é de magia: atacar não a desfaz.
    if (getCondition(c, 'invisivel')?.data?.persistente) return;
    removeCondition(c, 'invisivel');
    this.say('magia', `${c.name} reaparece.`);
  }

  /** Farol de Esperança: a cura sai no máximo dos dados. */
  /**
   * CURADOR ABENÇOADO (clérigo da Vida, 6º): ao conjurar uma magia que cura OUTRA criatura, o clérigo recupera 2 + o círculo
   * da magia. Uma vez por conjuração, mesmo que a magia cure vários.
   */
  curadorAbencoado(actor, spell, slot, curados) {
    if (!actor.features?.includes('blessedHealer') || spell.level < 1 || !curados.some((a) => a !== actor)) return;
    const pv = this.heal(actor, 2 + slot, actor);
    if (pv) this.say('cura', `${actor.name} recupera ${pv} PV por curar outro (Curador Abençoado).`);
  }

  rolarCuraPara(alvo, notacao, conjurador) {
    // CURA SUPREMA (clérigo da Vida, 17º): os dados de cura de magia saem no valor MÁXIMO, sem rolar.
    // CÍRCULO DA MORTALIDADE (Sepultura, 1º): no máximo também em quem está a 0 PV.
    // CURA FORTALECIDA (Alma Divina, 6º): os dados baixos, de novo, por 1 ponto de feitiçaria.
    if (!conditionEffects(alvo).curaMaxima && !conjurador?.features?.includes('supremeHealing') && !Sub.curaNoMaximo(conjurador, alvo)) {
      const cura = Sub.curaFortalecida(this, conjurador, rolarCura(this, notacao, conjurador));
      // LAÇO REFORÇADO (Fogo Selvagem, 6º): +1d8 na cura com o espírito de pé
      const laco = conjurador ? Sub.lacoReforcado(this, conjurador, { kind: 'heal' }) : 0;
      return laco ? { ...cura, total: cura.total + laco } : cura;
    }
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
      if (node.parar === false) continue;
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
    // a magia que sai de um ITEM com ataque próprio (o diadema da explosão: +5) usa o dele
    const doItem = this.cdDoItemEmCurso?.quem === actor.id && this.cdDoItemEmCurso.ataque != null ? this.cdDoItemEmCurso : null;
    const atkBonus = doItem ? doItem.ataque : (spellAttackBonus(actor) ?? 0);
    // Infligir Ferimentos é de toque: ataque corpo a corpo, sem a
    // desvantagem de "inimigo adjacente" e sem cobertura.
    const mods = this.attackModifiers(actor, target, { ranged: !spell.melee });
    Sub.ajustarModsTce4(this, actor, target, mods);
    Sub.modsDosLivros2(this, actor, target, mods);
    // Toque Chocante: vantagem contra armadura de metal.
    if (spell.vantagemContraMetal && this.vesteMetal(target)) fonte(mods, 'vantagem', 'armadura de metal');
    // ATIRADOR ARCANO (talento): meia cobertura e três quartos não contam.
    const cover = spell.melee || atiradorArcano(actor, spell) ? 0 : this.field.coverBetween(actor.pos, target.pos);
    const ca = caEfetiva(target) + cover;
    const caPartes = [{ rotulo: `CA de ${target.name}`, valor: caEfetiva(target) }];
    if (cover) caPartes.push({ rotulo: 'cobertura', valor: cover });
    // Ataque de magia é proficiência + o atributo de conjuração — nunca
    // Força. Nomear o atributo é o que torna visível por que o mago acerta
    // melhor que o clérigo com a mesma magia. Bênção e Perdição valem
    // aqui também: ataque de magia é jogada de ataque.
    const extra = this.dadosDeAtaque(actor, atkBonus, doItem || !actor.spellcasting ? [{ rotulo: doItem?.nome ?? 'sem conjuração', valor: atkBonus }] : [
      { rotulo: ABILITY_NAME[actor.spellcasting.ability], valor: abilityMod(actor.abilities[actor.spellcasting.ability]) },
      { rotulo: 'proficiência', valor: proficiencyBonus(actor.level) },
      ...(actor.doItem?.ataqueMagia ? [{ rotulo: 'itens', valor: actor.doItem.ataqueMagia }] : []),
    ]);
    if (this.imagemDesvia(actor, target, extra.bonus, mods)) return 0;
    // CLARÃO DE AVISO e GOLPE GUIADO valem para qualquer jogada de ataque, a de magia inclusive.
    if (!mods.desvantagens.length) {
      const lume = this.clarao(actor, target);
      if (lume) fonte(mods, 'desvantagem', `Clarão de Aviso de ${lume.name}`);
    }
    const entropica = !mods.desvantagens.length && this.guardaEntropica(actor, target);
    if (entropica) fonte(mods, 'desvantagem', `Proteção Entrópica de ${target.name}`);
    const atk = attackRoll(this.rng, extra.bonus, ca, mods);
    this.guiarAtaque(actor, atk, ca);
    Sub.gastarAjuda(this, actor, target);
    this.curvarSorte(actor, target, atk, ca);
    if (entropica && !atk.hit && !target.dead) addCondition(target, 'desordemEntropica', { rounds: 2, source: actor.id });
    this.consumirAoAtacar(actor, target);
    this.consumirMarcas(target);
    // Acerto a até 1,5 m em alvo inconsciente ou paralisado é crítico,
    // com magia ou com arma.
    const autoCrit = atk.hit && conditionEffects(target).critWithinReach && distanceFt(actor.pos, target.pos) <= 5;
    let critical = atk.critical || autoCrit;
    if (atk.hit && critical && Sub.sentinelaNaPorta(this, target)) critical = false;
    if (critical && target.doItem?.semCritico) critical = false;
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
    this.ajustarDanoDeDominio(actor, spell, dmg, dano);
    this.empoderar(dmg);
    { const b = this.consumirBonusDeMagia(actor); if (b) dmg.total += b.bonus; }
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
    Sub.abrirASepultura(this, actor, target);
    this.umaFonteDeDano(() => {
      this.applyDamage(target, dmg.total, spell.damageType, actor, { critical, magico: true, deAtaque: true });
      this.danoDoUltimoAtaque = this.ultimoDano;
      this.maybeIgnite(target, spell.damageType);
      this.extrasDoAcerto(actor, target, { arma: false, ranged: !spell.melee, tipo: spell.damageType, critical });
    });
    delete target.vulneravelAoGolpe;
    Sub.marcarComOsAncestrais(this, actor, target);
    Sub.depoisDeSerAcertado(this, target, actor, { corpoACorpo: !!spell.melee });
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
      const save = this.resistencia(target, ef.save, dc, { contra: contraDaMagia(spell) });
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
  resistencia(actor, hab, dc, { vantagem = false, desvantagem = false, contra = null } = {}) {
    const fx = conditionEffects(actor);
    // MAGIA CUIDADOSA: até CAR criaturas escolhidas passam sozinhas na resistência da magia (e não sofrem o efeito, nem o dano).
    const meta = this.metaAtiva;
    if (meta?.careful?.restantes > 0 && actor.side === meta.dono.side) {
      meta.careful.restantes -= 1;
      return { natural: 20, total: 99, rolls: [20], mode: 'normal', dc, success: true, partes: [], vantagemPor: [], cuidadosa: meta.careful.zera };
    }
    // TRAÇOS que dão vantagem CONTRA algo (Corajoso, Ancestral Feérico, Resiliência Anã, Esperteza Gnômica): só valem
    // quando quem chama diz do que vem o teste (`contra`). Sem contexto, nenhuma vale.
    const porTraco = vantagemPorTraco(actor, hab, contra);
    if (porTraco.length) vantagem = true;
    // REVIRAVOLTA SEDUTORA (Andarilho Feérico, 7º) e os BERLOQUES DE ALMA (Fantasma, 9º) na Constituição
    if (Sub.vantagemNaResistenciaTce3(actor, hab, contra)) vantagem = true;
    // DEFESAS PSÍQUICAS (Mente Aberrante, 6º): vantagem contra encanto e medo
    if (Sub.vantagemNaResistenciaTce4(actor, contra)) vantagem = true;
    // ESPÍRITO INDOMÁVEL e CAMPEÃO EXALTADO (Coroa)
    if (Sub.vantagemNaResistenciaDosLivros2(this, actor, hab, contra)) vantagem = true;
    // MATADOR DE MAGOS (talento): vantagem contra a magia de quem conjura a 1,5 m dele.
    if (contra?.magico && contra.conjurador && temTalento(actor, 'matadorDeMagos') && contra.conjurador.pos && distanceFt(contra.conjurador.pos, actor.pos) <= 5) vantagem = true;
    // EXPLORADOR DE MASMORRAS (talento): vantagem na resistência contra armadilha.
    if (contra?.armadilha && temTalento(actor, 'exploradorDeMasmorras')) vantagem = true;
    if (Livro.vantagemDeAura(this, actor, contra)) vantagem = true;
    // MARÉS DO CAOS: vantagem nesta resistência, e o uso se gasta.
    if (hasCondition(actor, 'maresDoCaos') && !this.surtando) { vantagem = true; removeCondition(actor, 'maresDoCaos'); }
    // SENTIDO DE PERIGO: o bárbaro esquiva do que consegue ver. Aqui, de
    // tudo que pede Destreza — o motor não guarda se a armadilha era visível.
    if (hab === 'dex' && actor.features?.includes('dangerSense')
      && !conditionEffects(actor).incapacitated && !hasCondition(actor, 'cego')) vantagem = true;
    // Esquivando dá vantagem em resistência de DES; armadura sem treino dá
    // desvantagem nas de FOR e DES.
    const opts = {
      advantage: vantagem || (hab === 'dex' && (hasCondition(actor, 'esquivando') || fx.vantagemDex))
        || (hab === 'wis' && fx.vantagemSab) || fx.vantagemTeste.includes(hab)
        || fx.saveAdvantage.includes(hab),
      disadvantage: (!!actor.armorUntrained && (hab === 'str' || hab === 'dex'))
        || fx.saveDisadvantage.includes(hab) || fx.desvantagemTeste.includes(hab),
    };
    if (desvantagem) opts.disadvantage = true;
    // COROA DE LUZ (clérigo da Luz, 17º): quem está a até 18 m do clérigo tem desvantagem contra as magias dele de fogo ou radiantes.
    if (contra?.magico && ['fogo', 'radiante'].includes(contra?.tipoDano) && this.combatants.some((c) => !c.dead && hasCondition(c, 'coroaDeLuz')
      && distanceFt(c.pos, actor.pos) <= 60)) opts.disadvantage = true;
    // TOTEM DO URSO (Pastor): vantagem em Força na aura. CÃO DO MAU AGOURO: desvantagem contra as magias do feiticeiro.
    if (Sub.forcaDoUrso(this, actor, hab)) opts.advantage = true;
    if (contra?.magico && Sub.agouroContra(this, actor, contra.conjurador)) opts.disadvantage = true;
    // MAJESTADE INQUEBRÁVEL: quem atacou o bardo e passou resiste com desvantagem às magias dele.
    if (contra?.magico && Sub.abaladoContra(actor, contra.conjurador)) opts.disadvantage = true;
    // SURTO de magia selvagem: a magia desta conjuração dá desvantagem a quem resiste.
    if (contra?.magico && this.surtoDesvConjurador && this.surtoDesvConjurador !== actor) opts.disadvantage = true;
    // MAGIA ELEVADA: o primeiro alvo inimigo a resistir tem desvantagem.
    if (meta?.heightened && actor.side !== meta.dono.side) { opts.disadvantage = true; meta.heightened = false; }
    // SORTE DO BÊBADO: 2 de ki tiram a desvantagem da resistência.
    if (opts.disadvantage && !opts.advantage && Sub.sorteDoBebado(this, actor)) opts.disadvantage = false;
    // RESTAURAR O EQUILÍBRIO (Alma Mecânica): a reação tira a vantagem do inimigo ou a desvantagem do aliado
    Sub.equilibrioNaResistencia(this, actor, opts);
    let bonus = saveBonus(actor, hab);
    const partes = [];
    const inspNaResistencia = getCondition(actor, 'inspirado');
    // BRAÇOS DO EU ASTRAL: a Sabedoria no lugar da Força
    if (hab === 'str' && (hasCondition(actor, 'bracosAstrais') || hasCondition(actor, 'euAstralDesperto')) && (actor.abilities?.wis ?? 10) > (actor.abilities?.str ?? 10)) {
      bonus += abilityMod(actor.abilities.wis) - abilityMod(actor.abilities.str);
    }
    // PALAVRAS PERTURBADORAS (Eloquência): o dado sai desta resistência. VÍNCULO ENCORAJADOR (Paz): 1d4. MORTALHA DO
    // CREPÚSCULO: +2 na Destreza.
    const perturba = Sub.tiraDasPalavras(actor);
    if (perturba) { bonus -= perturba; partes.push({ rotulo: 'Palavras Perturbadoras', valor: -perturba }); }
    const vinculoR = Sub.dadoDoVinculo(this, actor);
    if (vinculoR) { bonus += vinculoR; partes.push({ rotulo: 'Vínculo Encorajador', valor: vinculoR }); }
    const crepusculo = hab === 'dex' ? Sub.coberturaDoCrepusculo(this, actor) : 0;
    if (crepusculo) { bonus += crepusculo; partes.push({ rotulo: 'Mortalha do Crepúsculo', valor: crepusculo }); }
    // CANÇÃO DA LÂMINA: a INT na Constituição que segura a concentração
    const cancao = Sub.bonusDaCancaoNaConcentracao(actor, hab, contra);
    if (cancao) { bonus += cancao; partes.push({ rotulo: 'Canção da Lâmina', valor: cancao }); }
    // quem OBRIGA o teste: o conjurador, ou o monstro do golpe em curso (`forcandoTeste`)
    const forcador = contra?.conjurador ?? this.forcandoTeste ?? null;
    // CONTRA-ATAQUE DO MATADOR (15º): o golpe na presa antes do teste; acertando, passa sozinho.
    if (forcador && forcador !== actor && Sub.contraAtaqueDoMatador(this, actor, forcador)) {
      return { natural: 20, total: 99, rolls: [20], mode: 'normal', dc, success: true, partes: [{ rotulo: 'Contra-Ataque do Matador', valor: 0 }], vantagemPor: [] };
    }
    // DEFESA SOBRENATURAL (Matador de Monstros, 7º): +1d6 contra a presa.
    const sobrenatural = Sub.bonusContraAPresa(this, actor, forcador);
    if (sobrenatural) { bonus += sobrenatural; partes.push({ rotulo: 'Defesa Sobrenatural', valor: sobrenatural }); }
    // MESTRE EM ESCUDOS (talento): de escudo e acordado, soma a CA do escudo à Destreza contra o que mira só ele.
    if (hab === 'dex' && contra?.alvoUnico && actor.shield && temTalento(actor, 'mestreEmEscudos') && !fx.incapacitated) {
      bonus += SHIELD_AC;
      partes.push({ rotulo: 'Mestre em Escudos', valor: SHIELD_AC });
    }
    // AURA DE PROTEÇÃO (paladino, 6º): soma o modificador de Carisma (mínimo +1) a TODA resistência do paladino e dos aliados
    // dentro do raio dela. Só a maior aura vale: duas auras não se somam.
    const protecao = this.auraDeProtecao(actor);
    if (protecao) {
      bonus += protecao.valor;
      partes.push({ rotulo: `Aura de Proteção${protecao.paladino === actor ? '' : ` de ${protecao.paladino.name}`}`, valor: protecao.valor });
    }
    if (fx.saveFixo[hab]) {
      bonus += fx.saveFixo[hab];
      // Um rótulo por condição (Lentidão −2, Elo de Proteção +1), não "lentidão" para tudo.
      for (const c of actor.conditions ?? []) {
        const v = CONDITIONS[c.id]?.saveFixo?.[hab];
        if (v) partes.push({ rotulo: CONDITIONS[c.id].name ?? c.id, valor: v });
        // Reviver os Mortos: a penalidade vem da `data`, não da tabela, e sem
        // isto ela entrava no dado sem aparecer na conta — o registro dizia
        // "+7" e o dado somava +3.
        if (CONDITIONS[c.id]?.penalidadeDaData && c.data?.penalidade) {
          partes.push({ rotulo: CONDITIONS[c.id].name.toLowerCase(), valor: -c.data.penalidade });
        }
      }
      if (actor.doItem?.salvas) partes.push({ rotulo: 'itens', valor: actor.doItem.salvas });
    }
    // LASCA MENTAL: a próxima resistência perde 1d4, e a lasca sai com ela.
    if (hasCondition(actor, 'lascaMental')) {
      const lasca = this.rng.die(4);
      bonus -= lasca;
      partes.push({ rotulo: 'Lasca Mental', valor: -lasca });
      removeCondition(actor, 'lascaMental');
    }
    for (const dice of fx.saveBonusDice) {
      const r = roll(this.rng, dice);
      bonus += r.total;
      partes.push({ rotulo: `bênção ${dice}[${r.rolls.join('+')}]`, valor: r.total });
    }
    // o dado que só vale em algumas resistências (a Mente Solipsista: Inteligência e Sabedoria)
    for (const { dados, habs } of fx.saveBonusDiceHab ?? []) {
      if (!habs.includes(hab)) continue;
      const r = roll(this.rng, dados);
      bonus += r.total;
      partes.push({ rotulo: `mente solipsista ${dados}[${r.rolls.join('+')}]`, valor: r.total });
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
    // MANTO DE MAJESTADE: quem o bardo enfeitiçou falha sozinho contra o Comando dele.
    if (SPELLS[contra?.magiaId]?.falhaQuemOEnfeiticou && contra.conjurador
      && (actor.conditions ?? []).some((c) => c.id === 'enfeiticado' && c.source === contra.conjurador.id)) {
      return { natural: 1, total: 0, rolls: [1], mode: 'normal', dc, success: false, partes, vantagemPor: [], enfeiticado: true };
    }
    const indomavelAntes = actor.resources?.indomitable;
    let rolado = segundaChanceNaResistencia(this, actor, savingThrow(this.rng, bonus, dc, opts), bonus, dc);
    // BALUARTE (Cavaleiro do Dragão Púrpura, 15º): o Indomável numa resistência mental abre a chance ao aliado
    if (indomavelAntes != null && (actor.resources?.indomitable ?? 0) < indomavelAntes) Sub.marcarBaluarte(this, actor, hab, forcador);
    this.curvarSorteNaResistencia(actor, rolado, dc);
    // FOCO FANÁTICO (Fanático, 6º): uma vez por Fúria, a resistência que falhou se rola de novo.
    rolado = Sub.focoFanatico(this, actor, rolado, () => savingThrow(this.rng, bonus, dc, opts));
    // FAVORECIDO PELOS DEUSES (Alma Divina): +2d4 na resistência que falhou. DEFLEXÃO ARCANA (Magia de Guerra): +4.
    if (!rolado.success) {
      const f = Sub.favorecidoPelosDeuses(this, actor, rolado.total, dc);
      if (f) rolado = { ...rolado, total: rolado.total + f, success: rolado.total + f >= dc };
    }
    if (!rolado.success && Sub.deflexaoArcana(this, actor, dc - rolado.total, 4)) rolado = { ...rolado, total: rolado.total + 4, success: true };
    // INDOMÁVEL (o campeão do Volo): a resistência que falhou se rola de novo
    if (!rolado.success && Livro.indomavelMonstro(this, actor)) rolado = savingThrow(this.rng, bonus, dc, opts);
    // SALVAR AS APARÊNCIAS (hobgoblin), na resistência que falhou
    if (!rolado.success) { const s = Raca.salvarAsAparencias(this, actor, dc - rolado.total); if (s) rolado = { ...rolado, total: rolado.total + s, success: true }; }
    // PRESSÁGIO CÓSMICO (Estrelas) e o DRAGÃO da Forma Estrelada na concentração
    {
      const aj = Sub.pressagioCosmico(this, actor, rolado.success ? rolado.total - dc + 1 : dc - rolado.total, rolado.success);
      if (aj) rolado = { ...rolado, total: rolado.total + aj, success: rolado.total + aj >= dc };
    }
    if (hab === 'con' && Sub.pisoDoDragao(actor, 'con', contra?.concentracao) && rolado.natural < 10) {
      const t = rolado.total - rolado.natural + 10;
      rolado = { ...rolado, natural: 10, total: t, success: t >= dc };
    }
    // TRANSE DA ORDEM: 9 ou menos no d20 conta como 10
    if (Sub.pisoDaOrdem(actor) && rolado.natural < 10) {
      const t = rolado.total - rolado.natural + 10;
      rolado = { ...rolado, natural: 10, total: t, success: t >= dc };
    }
    // LENDA VIVA (rola de novo), REPREENSÃO VIGILANTE e REVIRAVOLTA SEDUTORA (respondem ao sucesso), e o VÉU de quem forçou
    rolado = Sub.depoisDaResistenciaTce3(this, actor, hab, rolado, { contra, forcador, rerolar: () => savingThrow(this.rng, bonus, dc, opts) });
    rolado = Sub.depoisDaResistenciaDosLivros2(this, actor, hab, rolado, { forcador, rerolar: () => savingThrow(this.rng, bonus, dc, opts) });
    if (inspNaResistencia) Sub.depoisDaInspiracao(this, actor, inspNaResistencia, { sucesso: rolado.success, naResistencia: true });
    // O ANEL DE EVASÃO: falhou em Destreza, a reação e uma carga do anel passam o teste
    if (!rolado.success && hab === 'dex' && actor.doItem?.evasao && !actor.reactionUsed && !fx.incapacitated) {
      const id = actor.doItem.evasao;
      if (gastarCargaDoItem(actor, id)) {
        actor.reactionUsed = true;
        rolado = { ...rolado, success: true, evasaoDoItem: true };
        this.say('reacao', `${actor.name} falharia, mas o ${nomeDeId(id).toLowerCase()} o tira do caminho (reação e uma carga; restam ${cargasDe(actor, id)}).`);
      }
    }
    // RESISTÊNCIA LENDÁRIA (o Ruxithid, 2/dia): o monstro que falha escolhe passar. Ele usa sempre — é para isso que ela
    // existe, e guardar para depois é o erro de mestre que o livro quer evitar.
    if (!rolado.success && actor.side !== 'party' && (actor.resources?.resistenciaLendaria ?? 0) > 0) {
      actor.resources.resistenciaLendaria -= 1;
      rolado = { ...rolado, success: true, lendaria: true };
      this.say('recurso', `${actor.name} falharia, e escolhe passar (Resistência Lendária, restam ${actor.resources.resistenciaLendaria}).`);
    }
    // Só conta como "por traço" se a vantagem sobreviveu (uma desvantagem na mesma rolagem a cancela).
    return { ...rolado, partes, vantagemPor: rolado.mode === 'vantagem' ? porTraco : [] };
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
  useItem(actor, itemId, { target = actor, jogando = false } = {}) {
    const dados = itemDeId(itemId)?.dados;
    if (!dados?.consumivel) return { ok: false, why: `${nomeDeId(itemId)} não é item de usar` };

    // Quem nao age, nao usa item. Vale para beber, dar e jogar: o livro diz
    // que incapacitado nao toma acao nenhuma, e usar poção é uma ação.
    if (actor.dead) return { ok: false, why: 'morto não usa item' };
    if (conditionEffects(actor).incapacitated) return { ok: false, why: 'incapacitado não age' };
    // MÃOS RÁPIDAS (ladino Ladrão, 3º): usar um objeto custa a ação bônus, se ela estiver livre.
    const porBonus = dados.acao === 'bonus' || (actor.features?.includes('fastHands') && !actor.bonusUsed);
    // Fora da luta (explorando, ou depois dela) não há turno: a exploração marca a ação como usada
    // para travar o combate, e isso não pode impedir de beber uma poção nem de dá-la a um aliado.
    const fora = Boolean(this.over || this.explorando);
    if (!fora && (porBonus ? actor.bonusUsed : actor.actionUsed)) {
      return { ok: false, why: porBonus ? 'a ação bônus deste turno já foi usada' : 'a ação deste turno já foi usada' };
    }
    if (!quantosNaMochila(actor, itemId)) return { ok: false, why: `${dados.name} não está na mochila` };
    // Forma Gasosa: o livro diz que a névoa não fala nem manipula objeto, e o
    // que ela carregava não pode ser soltado nem usado.
    if (conditionEffects(actor).semAtaqueNemMagia) return { ok: false, why: 'em Forma Gasosa não se usa objeto' };

    const veto = this.vetoDeItem(actor, dados, target, { jogando });
    if (veto) return { ok: false, why: veto };

    // Daqui para baixo nada mais recusa: pode cobrar.
    const gasto = consumirDaMochila(actor, itemId);
    if (!gasto) return { ok: false, why: `${dados.name} não está na mochila` };
    if (!fora) { if (porBonus) actor.bonusUsed = true; else this.gastarAcaoSimples(actor); }

    this.executarItem(actor, dados, target, { jogando });

    if (gasto.acabou) this.say('recurso', `${actor.name} não tem mais ${dados.name.toLowerCase()}.`);
    else if (dados.usos) this.say('recurso', `${dados.name}: restam ${gasto.restam} usos.`);

    this.onEvent({ type: 'item', actor, item: dados, target });
    // `afterAction` termina em `checkEnd`: explorando, com todos os inimigos mortos, ele reencerraria a cena.
    if (!fora) { this.afterAction(actor); this.checkEnd(); }
    return { ok: true };
  }

  /**
   * DAR UM ITEM a um aliado (SRD: interação com objeto, ao alcance do toque). Fora da luta é de graça; na luta
   * gasta a interação gratuita do turno (a segunda gasta a ação), como sacar a arma.
   */
  darItem(actor, target, itemId, qtd = 1) {
    if (actor.dead || target.dead) return { ok: false, why: 'morto não recebe item' };
    if (conditionEffects(actor).incapacitated) return { ok: false, why: 'incapacitado não age' };
    if (conditionEffects(actor).semAtaqueNemMagia) return { ok: false, why: 'em Forma Gasosa não se usa objeto' };
    if (target.side !== actor.side || target === actor) return { ok: false, why: 'escolha um aliado' };
    if (!this.field.vizinhos(actor.pos, target.pos)) return { ok: false, why: `${target.name} está longe: encoste nele (1,5 m)` };
    const custo = this.custoDeInteracao(actor);
    if (!custo) return { ok: false, why: 'a interação gratuita e a ação deste turno já foram usadas' };
    const antes = actor.bag?.find((e) => e.id === itemId)?.qtd ?? 1;
    const r = transferirItem(actor, target, itemId, qtd);
    if (!r.ok) return r;
    const dado = Math.min(Math.max(1, Math.floor(qtd) || 1), antes);
    this.cobrarInteracao(actor, custo);
    this.say('acao', `${actor.name} entrega ${dado > 1 ? `${dado} × ` : ''}${nomeDeId(itemId).toLowerCase()} a ${target.name}.`);
    this.onEvent({ type: 'item-dado', actor, target, itemId });
    return { ok: true };
  }

  /** O que impede ESTE item neste alvo. `null` = pode. */
  vetoDeItem(actor, dados, target, { jogando = false } = {}) {
    // O VENENO: untar é na própria arma; soprar o pó é na cara de quem está encostado
    if (dados.consumivel === 'untar') {
      if (target !== actor) return 'o veneno se passa na própria arma';
      const mao = WEAPONS[actor.equippedWeapon];
      if (!mao || !['cortante', 'perfurante'].includes(mao.type)) return 'o veneno pega em lâmina ou ponta: a arma da mão não corta nem fura';
    }
    if (dados.consumivel === 'soprar') {
      if (target === actor) return 'soprar o pó em si mesmo, não';
      if (!this.field.vizinhos(actor.pos, target.pos)) return `${target.name} está longe demais — o pó se sopra de perto`;
      if ((this.over || this.explorando) && target.side !== actor.side && target.side !== 'neutro') return 'soprar veneno em inimigo é ação de combate';
    }
    // JOGAR A POÇÃO (regra da casa). O livro não tem arremesso de poção de
    // cura: ele tem DAR a poção a outra criatura, que gasta uma ação e pede
    // alcance de toque. O arremesso é nosso, e cobra o preço de molhar em vez
    // de beber — metade da cura, em `executarItem`.
    if (jogando) {
      if (!dados.cura || !dados.jogavel) return `${dados.name} não é frasco que se jogue`;
      if (target === actor) return 'jogar em si mesmo é beber: use a poção normalmente';
      // O neutro — o prisioneiro dos Marcarrubra, o Droop, o rato do mago — não
      // é inimigo, e curá-lo é gesto legítimo que custa a ação e o frasco. O
      // inimigo de verdade, não: a poção o levantaria.
      if (target.side !== actor.side && target.side !== 'neutro') {
        return 'não se joga poção de cura em inimigo';
      }
      if (target.dead) return `${target.name} já morreu`;
      // Ao alcance do toque não se joga: dá-se, e aí a cura é inteira.
      if (this.field.vizinhos(actor.pos, target.pos)) return 'está ao alcance: dê a poção na mão';
      const dist = distanceFt(actor.pos, target.pos);
      if (dist > ARREMESSO_DE_POCAO_FT) return `longe demais para jogar — ${dist} pés, alcança ${ARREMESSO_DE_POCAO_FT}`;
      if (!this.field.hasLineOfSight(actor.pos, target.pos)) return 'sem linha de visão';
      // Quem está com a vida cheia não precisa, e o frasco quebraria à toa.
      if (target.hp >= maxHpEfetivo(target)) return `${target.name} está com a vida cheia`;
      if ((target.conditions ?? []).some((k) => CONDITIONS[k.id]?.semCura)) {
        return `${target.name} não recupera PV agora`;
      }
      return null;
    }
    if (['curar', 'estabilizar', 'condicao', 'limpar'].includes(dados.consumivel)) {
      if (target !== actor && !this.field.vizinhos(actor.pos, target.pos)) {
        return `${target.name} está longe demais — é preciso estar encostado`;
      }
    }
    if (dados.consumivel === 'curar') {
      // O ramo `jogando` já recusa inimigo; beber ou dar na mão também (a poção o levantaria).
      if (target.side !== actor.side && target.side !== 'neutro') return 'não se dá poção de cura a inimigo';
      if (target.dead) return `${target.name} já morreu`;
      // Toque Arrepiante: `heal` devolve 0 para quem está sob ele, e sem esta
      // guarda a ação e o frasco iam embora por nada.
      if ((target.conditions ?? []).some((k) => CONDITIONS[k.id]?.semCura)) {
        return `${target.name} não recupera PV agora`;
      }
      // Beber de vida cheia é LEGAL na regra e é sempre um erro de clique.
      // Recusar custa ao jogador um aviso; deixar passar custa a poção que
      // faria falta dois turnos depois.
      if (target.hp >= maxHpEfetivo(target)) return `${target.name} está com a vida cheia`;
    }
    // Curandeiro: o kit cura, não só estabiliza (`talentos.js`).
    const medico = dados.consumivel === 'estabilizar' ? vetoDoMedico(actor, target) : undefined;
    if (medico !== undefined) return medico;
    if (dados.consumivel === 'estabilizar') {
      if (!hasCondition(target, 'inconsciente')) return `${target.name} não está caindo`;
      if (target.stable) return `${target.name} já está estável`;
      if (target.dead) return `${target.name} já morreu`;
    }
    if (dados.consumivel === 'restaurar') {
      if (target !== actor && !this.field.vizinhos(actor.pos, target.pos)) {
        return `${target.name} está longe demais — é preciso estar encostado`;
      }
      if (target.dead) return `${target.name} já morreu`;
      if (!nivelDeExaustao(target) && !hasCondition(target, 'envenenado')) {
        return `${target.name} não está exausto nem envenenado`;
      }
    }
    if (dados.consumivel === 'arremesso') {
      if (target === actor) return 'não dá para arremessar em si mesmo';
      if ((this.over || this.explorando) && target.side !== actor.side) return 'jogar item em inimigo é ação de combate';
      const dist = distanceFt(actor.pos, target.pos);
      if (dist > (dados.rangeFt ?? 20)) return `fora de alcance — ${dist} pés, alcança ${dados.rangeFt ?? 20}`;
      if (!this.field.hasLineOfSight(actor.pos, target.pos)) return 'sem linha de visão';
    }
    return null;
  }

  executarItem(actor, dados, target, { jogando = false } = {}) {
    switch (dados.consumivel) {
      case 'curar': {
        const r = /^\d+$/.test(dados.cura) ? { total: Number(dados.cura), rolls: [dados.cura] } : roll(this.rng, dados.cura);
        // Jogada, a poção se quebra no aliado e só MOLHA: metade da cura,
        // arredondada para baixo, e nunca menos de 1. É o preço da distância,
        // e é regra da casa — o livro não joga poção.
        const total = jogando ? Math.max(1, Math.floor(r.total / 2)) : r.total;
        const curado = this.heal(target, total, dados.name);
        const quem = jogando
          ? `joga ${dados.name.toLowerCase()} em ${target.name}, e o frasco se quebra:`
          : target === actor ? 'bebe' : `dá ${dados.name.toLowerCase()} a ${target.name}:`;
        this.say('cura', `${actor.name} ${quem} ${curado} PV.`,
          jogando ? `${dados.cura} = ${r.total}, metade por ter molhado = ${total}` : `${dados.cura} = ${r.total}`);
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
      // O COPO DE CONHAQUE ANÃO (área 5 do Castelo). A regra é do livro: o primeiro copo devolve 1 PV a quem
      // o bebe, e um SEGUNDO copo dentro da mesma hora envenena por uma hora. A hora é o descanso curto, que
      // no SRD dura exatamente isso e limpa a marca.
      case 'gole': {
        const bebe = target === actor ? 'bebe' : `serve a ${target.name}`;
        if (target.bebeuConhaque) {
          addCondition(target, 'envenenado', { rounds: Infinity });
          target.ressacaDeConhaque = true;
          this.say('cura', `${actor.name} ${bebe} um segundo copo de conhaque anão — e o chão some por baixo: envenenado.`,
            'o livro: dois copos em menos de uma hora envenenam por uma hora');
          break;
        }
        target.bebeuConhaque = true;
        const curado = this.heal(target, 1, dados.name);
        this.say('cura', `${actor.name} ${bebe} um copo de conhaque anão: ${curado} PV, e um calor que desce até os pés.`);
        break;
      }
      case 'untar': {
        // O VENENO DE FERIDA na lâmina (o básico, o de serpente, o drow, o de serpe, o do verme púrpura): um minuto, e o
        // próximo acerto de corte ou ponta o leva (`aplicarVeneno`, depois do golpe)
        addCondition(actor, 'armaUntada', { rounds: 10, data: { veneno: dados.veneno, nome: dados.name } });
        this.say('recurso', `${actor.name} passa ${dados.name.toLowerCase()} na lâmina: o próximo acerto o leva (um minuto).`);
        break;
      }
      case 'soprar': {
        // O VENENO DE INALAR: o pó soprado na cara de quem está encostado (o cubo de 1,5 m do livro é a casa dele)
        this.say('ataque', `${actor.name} sopra ${dados.name.toLowerCase()} na cara de ${target.name}.`);
        this.aplicarVeneno(target, dados.veneno, dados.name, actor);
        break;
      }
      case 'limpar': {
        // A POÇÃO QUE TIRA CONDIÇÕES (o elixir da saúde: cego, surdo, paralisado e envenenado)
        const tiradas = (dados.remove ?? []).filter((id) => hasCondition(target, id));
        for (const id of tiradas) removeCondition(target, id);
        // o elixir da saúde cura também a doença
        if (dados.curaDoenca) tiradas.push(...curarDoencas(target));
        const quem = target === actor ? 'bebe' : `dá ${dados.name.toLowerCase()} a ${target.name}:`;
        this.say('cura', `${actor.name} ${quem} ${dados.name.toLowerCase()}${tiradas.length ? `: sai ${tiradas.map((id) => CONDITIONS[id]?.name.toLowerCase() ?? id).join(', ')}` : ', e nada muda'}.`);
        break;
      }
      case 'condicao': {
        // A POÇÃO QUE DÁ UMA CONDIÇÃO (a de invulnerabilidade: resistência a todo dano por 1 minuto).
        // `dadosDaCondicao` é o que a condição guarda (a poção de resistência: o tipo)
        addCondition(target, dados.condicao, { rounds: dados.rodadas ?? 10, ...(dados.dadosDaCondicao ? { data: { ...dados.dadosDaCondicao } } : {}) });
        const quem = target === actor ? 'bebe' : `dá ${dados.name.toLowerCase()} a ${target.name}:`;
        const efeito = dados.dadosDaCondicao?.tipo ? `resiste a ${dados.dadosDaCondicao.tipo}` : (CONDITIONS[dados.condicao]?.name.toLowerCase() ?? dados.condicao);
        this.say('cura', `${actor.name} ${quem} ${dados.name.toLowerCase()}: ${efeito}.`);
        break;
      }
      case 'restaurar': {
        // Poção de vitalidade: tira a exaustão inteira e o veneno, e os dados
        // de vida voltam todos no descanso seguinte.
        const degraus = nivelDeExaustao(target);
        mudarExaustao(target, -6);
        removeCondition(target, 'envenenado');
        // ... e a doença (o livro: cura qualquer doença)
        curarDoencas(target);
        target.maldaAgua = false;
        target.dadosDeVidaCheios = true;
        const quem = target === actor ? 'bebe' : `dá ${dados.name.toLowerCase()} a ${target.name}:`;
        this.say('cura', `${actor.name} ${quem} ${degraus ? `o cansaço de ${degraus} degrau(ões) vai embora` : 'o veneno vai embora'}.`);
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
        // o que o catálogo declara e o motor ainda não faz. Dizer
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

  /**
   * Agressivo (o orc): como ação bônus, anda até o seu deslocamento em direção
   * a um inimigo. Quem decide para onde é a IA (`rules/ai.js`, regra 2).
   */
  investidaAgressiva(actor) {
    if (actor.bonusUsed || !actor.traits?.includes('agressivo')) return false;
    actor.bonusUsed = true;
    actor.movementLeftFt += this.speedOf(actor);
    this.say('acao', `${actor.name} avança furioso (Agressivo).`);
    return true;
  }

  dash(actor) {
    if (!this.gastarAcaoSimples(actor)) return false;
    actor.movementLeftFt += this.speedOf(actor);
    // A Investida e o Móvel (talentos) olham se a Disparada foi neste turno.
    actor.disparouEm = this.turnoKey();
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
    // Fora da luta (explorando, ou depois dela) não há turno: a ação "usada" da exploração é só a trava do combate.
    const fora = Boolean(this.over || this.explorando);
    if (actor.dead || conditionEffects(actor).incapacitated || conditionEffects(actor).semAtaqueNemMagia) return false;
    if ((!fora && (actor.actionUsed || actor.acaoLimitada)) || !this.field.vizinhos(actor.pos, target.pos)) return false;
    if (!hasCondition(target, 'inconsciente') || target.stable || target.dead) return false;
    if (!fora) actor.actionUsed = true;

    const check = this.testeDeAtributo(actor, 'wis', skillBonus(actor, 'medicina'), 'Medicina', { pericia: 'medicina' });
    if (check.total >= 10) {
      target.stable = true;
      this.say('cura', `${actor.name} estabiliza ${target.name}.`, `Medicina ${check.total} vs CD 10`);
      this.onEvent({ type: 'stabilized', target, by: actor });
    } else {
      this.say('aviso', `${actor.name} não consegue estancar o sangramento de ${target.name}.`, `Medicina ${check.total} vs CD 10`);
    }
    if (!fora) this.afterAction(actor);
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

  // ---- AGARRAR e EMPURRAR (o livro, "Ações em combate") -------------------------------------------------------------------
  //
  // São ataques especiais: cada um toma o lugar de UM golpe da ação de Atacar (com Ataque Extra, os outros seguem
  // guardados), ou de uma ação bônus quando um talento a dá. A disputa é o Atletismo de quem faz contra o Atletismo ou a
  // Acrobacia do alvo, o melhor dos dois. O alvo pode ser no máximo um tamanho maior.

  /** O golpe da ação de Atacar que a manobra consome: devolve o motivo de não poder, ou null (e gasta). */
  gastarGolpeDoAtaque(actor, { bonus = false } = {}) {
    if (bonus) {
      if (actor.bonusUsed) return 'a ação bônus deste turno já foi usada';
      actor.bonusUsed = true;
      return null;
    }
    const continuando = actor.actionUsed && (actor.ataquesRestantes ?? 0) > 0;
    if (actor.actionUsed && !continuando) return 'a ação deste turno já foi usada';
    if (continuando) actor.ataquesRestantes -= 1;
    else {
      actor.actionUsed = true;
      actor.ataquesRestantes = Math.max(0, this.golpesDoAtaque(actor, actor.equippedWeapon).length - 1);
    }
    const k = this.turnoKey();
    actor.acaoDeAtaque = { turno: k, armas: [...(actor.acaoDeAtaque?.turno === k ? actor.acaoDeAtaque.armas : []), 'manobra'] };
    return null;
  }

  /** Por que não dá para agarrar ou empurrar este alvo, ou null. */
  porqueNaoManobra(actor, target) {
    if (!target || target === actor || target.dead) return 'sem alvo';
    if (conditionEffects(actor).incapacitated) return 'incapacitado';
    if (distanceFt(actor.pos, target.pos) > 5 || !this.field.contato(actor.pos, target.pos)) return 'precisa estar encostado';
    const ordem = ['miúdo', 'pequeno', 'médio', 'grande', 'enorme', 'imenso', 'colossal'];
    const t = (c) => Math.max(0, ordem.indexOf(String(c.size ?? 'médio').toLowerCase()));
    if (t(target) > t(actor) + 1) return `${target.name} é grande demais`;
    return null;
  }

  /** A disputa: Atletismo de quem faz contra o melhor de Atletismo e Acrobacia do alvo. Incapacitado não resiste. */
  disputaDeAtletismo(actor, target) {
    const a = this.testeDeAtributo(actor, 'str', skillBonus(actor, 'atletismo'), 'Atletismo', { pericia: 'atletismo' });
    if (conditionEffects(target).incapacitated) return { venceu: true, conta: `Atletismo ${a.total} · ${target.name} não resiste` };
    const atl = skillBonus(target, 'atletismo');
    const acr = skillBonus(target, 'acrobacia');
    const [nome, hab, bonus, pericia] = atl >= acr ? ['Atletismo', 'str', atl, 'atletismo'] : ['Acrobacia', 'dex', acr, 'acrobacia'];
    const d = this.testeDeAtributo(target, hab, bonus, nome, { pericia });
    return { venceu: a.total > d.total, conta: `Atletismo ${a.total} contra ${nome} ${d.total}` };
  }

  /** Por que não dá para AGARRAR: o da manobra, mais a mão livre (a segunda arma ou o escudo ao lado da arma ocupam as duas). */
  porqueNaoAgarrar(actor, target) {
    const porque = this.porqueNaoManobra(actor, target);
    if (porque) return porque;
    if (getCondition(target, 'agarrado')?.source === actor.id) return `já segura ${target.name}`;
    const armaNaMao = actor.equippedWeapon && actor.equippedWeapon !== 'punhos';
    if (actor.offhandWeapon || (actor.shield && armaNaMao)) return 'sem mão livre para agarrar';
    return null;
  }

  /** AGARRAR: com uma mão livre, o alvo fica agarrado (deslocamento 0) até se soltar ou quem segura se afastar. */
  agarrar(actor, target, { bonus = false } = {}) {
    const porque = this.porqueNaoAgarrar(actor, target);
    if (porque) return { ok: false, why: porque };
    const gasto = this.gastarGolpeDoAtaque(actor, { bonus });
    if (gasto) return { ok: false, why: gasto };
    const d = this.disputaDeAtletismo(actor, target);
    if (d.venceu) {
      addCondition(target, 'agarrado', { rounds: Infinity, source: actor.id, data: { escape: 10 + skillBonus(actor, 'atletismo'), disputa: true } });
      // PELE VENENOSA (o grung): agarrar é tocar a pele
      if (target.peleVenenosa) Livro.peleVenenosa(this, actor, target);
      this.say('condicao', `${actor.name} agarra ${target.name}.`, d.conta);
      // ARMADURA DO FURIOSO: os espinhos entram em quem foi agarrado
      Sub.espinhosNoAgarrao(this, actor, target);
    } else this.say('acao', `${actor.name} tenta agarrar ${target.name}, que escapa.`, d.conta);
    this.onEvent({ type: 'agarrar', actor, target, venceu: d.venceu });
    if (!bonus) this.afterAction(actor);
    return { ok: true, venceu: d.venceu };
  }

  /** EMPURRAR: derruba o alvo (`modo: 'derrubar'`) ou o afasta 1,5 m (`'afastar'`; 3 m na Investida). */
  empurrarAcao(actor, target, { modo = 'derrubar', bonus = false, pes = 5 } = {}) {
    const porque = this.porqueNaoManobra(actor, target);
    if (porque) return { ok: false, why: porque };
    const gasto = this.gastarGolpeDoAtaque(actor, { bonus });
    if (gasto) return { ok: false, why: gasto };
    const d = this.disputaDeAtletismo(actor, target);
    if (d.venceu && modo === 'derrubar') {
      addCondition(target, 'caido', { rounds: Infinity, source: actor.id });
      this.say('condicao', `${actor.name} derruba ${target.name}.`, d.conta);
    } else if (d.venceu) {
      this.empurrar(target, actor.pos, pes);
      this.say('condicao', `${actor.name} empurra ${target.name} para trás.`, d.conta);
    } else this.say('acao', `${actor.name} tenta empurrar ${target.name}, que fica firme.`, d.conta);
    this.onEvent({ type: 'empurrar', actor, target, venceu: d.venceu, modo });
    if (!bonus) this.afterAction(actor);
    return { ok: true, venceu: d.venceu };
  }

  /** Os golpes e manobras de AÇÃO BÔNUS que os talentos dão: o que o menu oferece agora, com o motivo de não poder. */
  golpesDeTalento(actor, target) {
    const k = this.turnoKey();
    const out = [];
    const perto = target && distanceFt(actor.pos, target.pos) <= 5;
    const atacou = actor.acaoDeAtaque?.turno === k ? actor.acaoDeAtaque.armas : [];
    const bonus = actor.bonusUsed ? 'a ação bônus deste turno já foi usada' : null;
    if (temTalento(actor, 'mestreEmArmasGrandes')) {
      out.push({ id: 'golpeExtraGWM', rotulo: 'Golpe extra (Mestre em Armas Grandes)',
        motivo: bonus ?? (actor.golpeExtraEm !== k ? 'só depois de um crítico ou de derrubar alguém com arma de perto' : null) });
    }
    if (temTalento(actor, 'mestreEmArmasDeHaste')) {
      const soHaste = atacou.length && atacou.every((a) => HASTES_DO_GOLPE.includes(a));
      out.push({ id: 'golpeDaHaste', rotulo: 'Outra ponta da haste (d4)',
        motivo: bonus ?? (!soHaste ? 'só depois de atacar com glaive, alabarda, bordão ou lança' : null) });
    }
    if (temTalento(actor, 'especialistaEmBesta')) {
      const umaMao = atacou.some((a) => WEAPONS[a] && !(WEAPONS[a].props ?? []).includes('duas mãos'));
      out.push({ id: 'bestaDeMaoBonus', rotulo: 'Besta de mão (Especialista em Besta)',
        motivo: bonus ?? (!this.armasNaMao(actor).includes('bestaDeMao') ? 'sem besta de mão na mão' : !umaMao ? 'só depois de atacar com uma arma de uma mão' : null) });
    }
    if (temTalento(actor, 'mestreEmEscudos')) {
      out.push({ id: 'empurraoDoEscudo', rotulo: 'Empurrar com o escudo',
        motivo: bonus ?? (!actor.shield ? 'sem escudo' : !atacou.length ? 'só depois de usar a ação de Atacar' : !perto ? 'precisa estar encostado' : null) });
    }
    if (temTalento(actor, 'investida')) {
      out.push({ id: 'investidaTalento', rotulo: `Investida${(actor.retaFinal?.turno === k && actor.retaFinal.casas >= 2) ? ' (+5 de dano)' : ''}`,
        motivo: bonus ?? (actor.disparouEm !== k ? 'só depois da Disparada' : null) });
    }
    // a CIMITARRA DA VELOCIDADE sintonizada e na mão: um golpe com ela como ação bônus em cada turno
    {
      const w = WEAPONS[actor.equippedWeapon];
      if (w?.poder === 'velocidade' && (!w.sintonia || (actor.sintonizados ?? []).includes(w.id))) {
        out.push({ id: 'golpeDaVelocidade', rotulo: `Golpe da ${w.name.toLowerCase()} (ação bônus)`, motivo: bonus ?? (!perto ? 'precisa estar encostado' : null) });
      }
    }
    if (temTalento(actor, 'brigaoPhb')) {
      out.push({ id: 'agarrarDoBrigao', rotulo: 'Agarrar (Brigão de Taverna)',
        motivo: bonus ?? (actor.socouEm?.turno !== k || actor.socouEm.alvo !== target?.id ? 'só depois de acertar este com um soco' : null) });
    }
    return out;
  }

  useFeature(actor, featureId, { target = null, modo = null, valor = null } = {}) {
    // Incapacitado não faz ação, ação bônus nem reação; o interruptor do Ataque
    // Descuidado é de graça (uma escolha, não uma ação).
    if (actor.dead || (featureId !== 'recklessAttack' && featureId !== 'desviarOlhar' && conditionEffects(actor).incapacitated)) return false;
    switch (featureId) {
      case 'desviarOlhar': {
        // DESVIAR OS OLHOS da medusa: interruptor de graça. Ligado, no começo de cada turno ele não olha para ela
        // (`olharPetrificante`); desligar no meio do turno tira os olhos desviados na hora (ele volta a olhar).
        const liga = modo === 'ligar' ? true : modo === 'desligar' ? false : !actor.desviaOlhar;
        actor.desviaOlhar = liga;
        if (!liga) removeCondition(actor, 'olhosDesviados');
        this.say('recurso', liga ? `${actor.name} decide não olhar nos olhos de quem tem o olhar.` : `${actor.name} volta a olhar de frente.`);
        return true;
      }
      case 'cristalMental': {
        // CRISTAL MENTAL (o Obelisco): interruptor de graça, um cristal por vez (o livro deixa um só por magia). `modo` é o id
        // do cristal a armar, ou 'desligar'. Armado, vale na próxima magia de uma ação a que ele sirva, e então se apaga.
        if (modo === 'desligar') {
          if (actor.cristalArmado) this.say('recurso', `${actor.name} guarda o ${nomeDeId(actor.cristalArmado)}.`);
          actor.cristalArmado = null;
          return true;
        }
        if (!itemDeId(modo)?.dados?.metamagia || !quantosNaMochila(actor, modo)) return false;
        actor.cristalArmado = modo;
        this.say('recurso', `${actor.name} segura o ${nomeDeId(modo)}: a próxima magia de uma ação que ele servir sai moldada.`);
        return true;
      }
      case 'visaoDeDumathoin': {
        // A BÊNÇÃO DE DUMATHOIN (Cripta dos Talhund): ação, visão verdadeira de 36 m por um minuto, uma vez por descanso longo.
        if (actor.actionUsed || !(actor.resources?.visaoDeDumathoin > 0)) return false;
        actor.actionUsed = true;
        actor.resources.visaoDeDumathoin -= 1;
        addCondition(actor, 'visaoVerdadeira', { rounds: 10 });
        this.say('recurso', `Os olhos de ${actor.name} ardem de leve: por um minuto, a até 36 m, vê as coisas como elas são.`);
        return true;
      }
      case 'secondWind': {
        if (actor.bonusUsed || !actor.resources.secondWind) return false;
        actor.bonusUsed = true;
        actor.resources.secondWind -= 1;
        const r = roll(this.rng, `1d10+${actor.level}`);
        const healed = this.heal(actor, r.total, actor);
        this.say('recurso', `${actor.name} usa Retomar o Fôlego: +${healed} PV.`, `1d10[${r.rolls.join('')}] + ${actor.level}`);
        // GRITO DE REUNIÃO (Cavaleiro do Dragão Púrpura)
        Sub.gritoDeReuniao(this, actor);
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
        // SURTO INSPIRADOR (Cavaleiro do Dragão Púrpura, 10º)
        Sub.surtoInspirador(this, actor);
        return true;
      }
      case 'bardicInspiration': {
        // INSPIRAÇÃO BÁRDICA: ação bônus, uma carga, um aliado a até 18 m que
        // consiga ouvir. O dado fica com ELE e sai no primeiro ataque, teste
        // ou resistência que ele quiser — a condição `inspirado` guarda o
        // dado e o motor a consome no primeiro dos três.
        const alvo = target;
        if (actor.bonusUsed || !actor.resources?.bardicInspiration) return false;
        if (!alvo || alvo === actor || alvo.side !== actor.side || alvo.dead) return false;
        if (distanceFt(actor.pos, alvo.pos) > 60) return false;
        if (hasCondition(alvo, 'inspirado')) return false;
        actor.bonusUsed = true;
        actor.resources.bardicInspiration -= 1;
        // A escala do bardo dá 'd6'; o rolador quer '1d6'.
        const escala = actor.dadoDeInspiracao ?? 'd6';
        const dado = String(escala).startsWith('d') ? `1${escala}` : String(escala);
        addCondition(alvo, 'inspirado', { rounds: 100, source: actor.id, data: { dado } });
        this.say('recurso', `${actor.name} inspira ${alvo.name}: ${dado} para somar num ataque, teste ou resistência.`);
        return true;
      }
      case 'layOnHands': {
        // CURA PELAS MÃOS (SRD): ação, toque, e tira da reserva o que o paladino mandar (`valor`; sem ele, o que faltar
        // ao ferido, até acabar a reserva). Com `modo: 'veneno'`, 5 PV da reserva tiram o veneno (sem curar). Não
        // vale em morto-vivo nem constructo, nem em quem a necromancia impede de curar (`semCura`): a recusa vem
        // ANTES de cobrar reserva ou ação. Fora do combate (explorando, ou a luta acabada) só gasta a reserva.
        const semTurno = this.over || this.explorando;
        const alvo = target ?? actor;
        // a ação extra da Velocidade só vale para atacar, correr, desengajar, esconder e usar objeto
        if (((actor.actionUsed || actor.acaoLimitada) && !semTurno) || !actor.resources?.layOnHands) return false;
        if (actor.dead || conditionEffects(actor).incapacitated) return false;
        if (!alvo || alvo.dead || alvo.side !== actor.side) return false;
        if (alvo !== actor && !this.field.vizinhos(actor.pos, alvo.pos)) return false;
        if (['morto-vivo', 'constructo'].includes(alvo.tipo)) return false;
        if ((alvo.conditions ?? []).some((k) => CONDITIONS[k.id]?.semCura)) return false;
        if (modo === 'veneno') {
          // 5 PV da reserva tiram um veneno ou uma doença (o livro: cada um custa 5)
          const doenca = DOENCAS.find((id) => hasCondition(alvo, id));
          if ((!hasCondition(alvo, 'envenenado') && !doenca) || actor.resources.layOnHands < 5) return false;
          if (!semTurno) actor.actionUsed = true;
          actor.resources.layOnHands -= 5;
          if (hasCondition(alvo, 'envenenado')) {
            removeCondition(alvo, 'envenenado');
            this.say('recurso', `${actor.name} impõe as mãos sobre ${alvo.name} e tira o veneno (5 PV da reserva; restam ${actor.resources.layOnHands}).`);
          } else {
            curarDoencas(alvo);
            this.say('recurso', `${actor.name} impõe as mãos sobre ${alvo.name} e tira a doença (5 PV da reserva; restam ${actor.resources.layOnHands}).`);
          }
          return true;
        }
        const falta = maxHpEfetivo(alvo) - alvo.hp;
        if (falta <= 0) return false;
        const quanto = Math.floor(Math.min(valor ?? Infinity, falta, actor.resources.layOnHands));
        if (!(quanto >= 1)) return false;
        if (!semTurno) actor.actionUsed = true;
        actor.resources.layOnHands -= quanto;
        this.heal(alvo, quanto, actor);
        this.say('recurso', `${actor.name} impõe as mãos sobre ${alvo.name}: ${quanto} PV (restam ${actor.resources.layOnHands} na reserva).`);
        return true;
      }
      case 'divineSense': {
        // SENTIDO DIVINO: ação, uma carga, e diz o que há de morto-vivo,
        // corruptor ou celestial a 18 m — inclusive o que o grupo ainda não
        // enxerga, que é para isso que ele serve.
        if (actor.actionUsed || !actor.resources?.divineSense) return false;
        actor.actionUsed = true;
        actor.resources.divineSense -= 1;
        // Os tipos como o bestiário os escreve. Corruptor e celestial ainda
        // não existem no jogo; ficam na lista para quando existirem.
        const TIPOS = new Set(['morto-vivo', 'corruptor', 'celestial']);
        // O livro diz que a Aura Mágica do Arcanista engana justamente este
        // sentido, e que o Indetectável esconde dele. Lê o tipo APARENTE
        // (`auraMagica`) e pula quem está sob o Indetectável
        // (`semDeteccao`) — as duas marcas vêm de
        // `rules/utilidade.js` (`tipoAparente`, `escondidoDaMagia`), copiadas
        // aqui em linha para o combate não depender do módulo de utilidade.
        const achados = this.combatants.filter(
          (c) => !c.dead && c !== actor && !c.semDeteccao
            && TIPOS.has(c.auraMagica ?? c.tipo) && distanceFt(actor.pos, c.pos) <= 60,
        );
        this.say('recurso', achados.length
          ? `${actor.name} sente o que não devia estar aqui: ${achados.map((c) => c.name).join(', ')}.`
          : `${actor.name} abre os sentidos e não encontra nada de impuro a 18 m.`);
        return true;
      }
      case 'arcaneRecovery': {
        // RECUPERAÇÃO ARCANA: fora da luta, uma vez por dia, espaços somando
        // metade do nível (arredondado para cima), nenhum acima do 5º.
        if (!actor.resources?.arcaneRecovery) return false;
        if (!this.over && this.combatants.some((c) => c.side !== actor.side && !c.dead)) return false;
        const sc = actor.spellcasting;
        if (!sc) return false;
        let pontos = Math.ceil(actor.level / 2);
        const voltaram = [];
        for (let circ = 5; circ >= 1 && pontos > 0; circ--) {
          while (pontos >= circ && (sc.slots?.[circ] ?? 0) < (sc.slotsMax?.[circ] ?? 0)) {
            sc.slots[circ] += 1;
            pontos -= circ;
            voltaram.push(circ);
          }
        }
        if (!voltaram.length) return false;
        actor.resources.arcaneRecovery -= 1;
        this.say('recurso', `${actor.name} recolhe o que sobrou da magia do dia: ${voltaram.map((c) => `${c}º`).join(', ')}.`);
        return true;
      }
      case 'frenzy': {
        // FRENESI: em fúria, um ataque corpo a corpo como ação bônus. A exaustão vem quando a fúria acaba.
        if (actor.bonusUsed || !hasCondition(actor, 'furia')) return false;
        if (!target || target.dead || !isAdjacent(actor.pos, target.pos)) return false;
        actor.bonusUsed = true;
        actor.frenesiNaFuria = true;
        this.say('recurso', `${actor.name} entra em frenesi: um ataque como ação bônus.`);
        this.resolveAttack(actor, target);
        return true;
      }
      case 'intimidatingPresence': {
        // PRESENÇA INTIMIDADORA (Berserker, 10º): ação; cada inimigo a até 9 m que o vê testa SAB (CD 8 + proficiência + CAR) ou
        // fica amedrontado até o fim do próximo turno do bárbaro. Uma vez por descanso longo.
        if (actor.actionUsed || !(actor.resources?.intimidatingPresence > 0)) return false;
        actor.actionUsed = true;
        actor.resources.intimidatingPresence -= 1;
        const cdP = 8 + proficiencyBonus(actor.level ?? 1) + abilityMod(actor.abilities.cha);
        this.say('recurso', `${actor.name} se agiganta, ameaçador (Presença Intimidadora, CD ${cdP}).`);
        for (const t of this.combatants) {
          if (t.dead || t.side === actor.side || Math.max(Math.abs(t.pos.x - actor.pos.x), Math.abs(t.pos.y - actor.pos.y)) * 5 > 30) continue;
          if (!this.field.hasLineOfSight(t.pos, actor.pos) || this.imuneACondicao(t, 'amedrontado', actor)) continue;
          const sv = this.resistencia(t, 'wis', cdP, { contra: { condicao: 'amedrontado' } });
          this.explicarResistencia(t, 'wis', cdP, sv, { contra: `Presença Intimidadora de ${actor.name}`, seSucesso: 'não se amedronta' });
          if (!sv.success) this.aplicarCondicao(t, 'amedrontado', { rounds: 1, quando: 'fim', lado: actor.side, source: actor.id });
        }
        return true;
      }
      case 'countercharm': {
        // CONTRACANTO (bardo, 6º): ação; até o fim do próximo turno dele, ele e os aliados a até 9 m têm vantagem contra medo e encantamento.
        if (actor.actionUsed) return false;
        actor.actionUsed = true;
        for (const a of this.combatants) {
          if (a.dead || a.side !== actor.side || Math.max(Math.abs(a.pos.x - actor.pos.x), Math.abs(a.pos.y - actor.pos.y)) * 5 > 30) continue;
          addCondition(a, 'contracanto', { rounds: 1, quando: 'fim', lado: actor.side, source: actor.id });
        }
        this.say('recurso', `${actor.name} canta um contracanto: o grupo resiste a medo e encantamento.`);
        return true;
      }
      case 'divineIntervention': {
        // INTERVENÇÃO DIVINA (clérigo, 10º): ação; rola d100 e, se tirar o nível dele ou menos, o deus atende (certo no 20º). Quem manda
        // no efeito é o mestre; o jogo atende com a cura total do grupo e o fim dos efeitos de magia. Atendido, o deus se cala por sete
        // dias; negado, só volta a ouvir no descanso longo.
        if (actor.actionUsed || !(actor.resources?.divineIntervention > 0) || (actor.intervencaoDias ?? 0) > 0) return false;
        actor.actionUsed = true;
        actor.resources.divineIntervention -= 1;
        const nivelI = actor.level ?? 1;
        const d = nivelI >= 20 ? 1 : this.rng.die(100);
        if (d > nivelI) {
          this.say('recurso', `${actor.name} pede a intervenção do seu deus (d100: ${d} contra ${nivelI}): silêncio.`);
          return true;
        }
        actor.intervencaoDias = 7;
        this.say('recurso', `${actor.name} pede a intervenção do seu deus (d100: ${d}): o deus responde.`);
        for (const a of this.combatants) {
          if (a.dead || a.side !== actor.side) continue;
          a.hp = maxHpEfetivo(a);
          for (const k of [...(a.conditions ?? [])]) if (k.magia) removeCondition(a, k.id);
          this.say('cura', `${a.name} é restaurado.`);
        }
        return true;
      }
      case 'sacredWeapon': {
        // ARMA SAGRADA (Devoção, 3º): ação e uma carga de Canalizar Divindade; por um minuto soma CAR (mínimo +1) aos ataques.
        if (actor.actionUsed || !(actor.resources?.channelDivinity > 0)) return false;
        actor.actionUsed = true;
        actor.resources.channelDivinity -= 1;
        const bonusS = Math.max(1, abilityMod(actor.abilities.cha));
        addCondition(actor, 'armaSagrada', { rounds: 10, source: actor.id, data: { bonus: bonusS } });
        this.say('recurso', `${actor.name} consagra a arma: +${bonusS} nos ataques por um minuto.`);
        return true;
      }
      case 'vowOfEnmity': {
        // VOTO DE INIMIZADE (Vingança, 3º): ação bônus e uma carga de Canalizar Divindade; por um minuto, vantagem nos ataques contra UMA
        // criatura a até 3 m (sem alvo dado, a mais próxima).
        if (actor.bonusUsed || !(actor.resources?.channelDivinity > 0)) return false;
        const alvoV = target ?? this.enemiesOf(actor).filter((m) => !m.dead && distanceFt(actor.pos, m.pos) <= 10)
          .sort((a, b) => distanceFt(actor.pos, a.pos) - distanceFt(actor.pos, b.pos))[0];
        if (!alvoV || alvoV.dead || alvoV.side === actor.side || distanceFt(actor.pos, alvoV.pos) > 10) return false;
        actor.bonusUsed = true;
        actor.resources.channelDivinity -= 1;
        addCondition(alvoV, 'votoDeInimizade', { rounds: 10, source: actor.id });
        this.say('recurso', `${actor.name} jura inimizade a ${alvoV.name}: vantagem nos ataques contra ele por um minuto.`);
        return true;
      }
      case 'abjureEnemy': {
        // REPELIR O INIMIGO (Vingança, 3º): ação e uma carga; a criatura a até 18 m (sem alvo dado, a mais próxima) testa Sabedoria ou fica
        // amedrontada e agarrada ao chão (deslocamento 0) por um minuto; um corruptor ou morto-vivo tem desvantagem na resistência.
        if (actor.actionUsed || !(actor.resources?.channelDivinity > 0)) return false;
        const alvoA = target ?? this.enemiesOf(actor).filter((m) => !m.dead && distanceFt(actor.pos, m.pos) <= 60)
          .sort((a, b) => distanceFt(actor.pos, a.pos) - distanceFt(actor.pos, b.pos))[0];
        if (!alvoA || alvoA.dead || alvoA.side === actor.side || distanceFt(actor.pos, alvoA.pos) > 60) return false;
        actor.actionUsed = true;
        actor.resources.channelDivinity -= 1;
        const cdA = spellSaveDc(actor);
        const svA = this.resistencia(alvoA, 'wis', cdA, { desvantagem: ['corruptor', 'morto-vivo'].includes(alvoA.tipo), contra: { magico: true, condicao: 'amedrontado' } });
        this.explicarResistencia(alvoA, 'wis', cdA, svA, { contra: `Repelir o Inimigo de ${actor.name}`, seSucesso: 'não fica amedrontado' });
        if (!svA.success) {
          // Amedrontado e SEM andar por um minuto, até sofrer dano (o `fimAoDano` o encerra no primeiro golpe).
          this.aplicarCondicao(alvoA, 'amedrontado', { rounds: 10, source: actor.id, data: { fimAoDano: true } });
          this.aplicarCondicao(alvoA, 'paralisadoDeMedo', { rounds: 10, source: actor.id, data: { fimAoDano: true } });
          this.say('condicao', `${alvoA.name} fica amedrontado e sem conseguir andar, até sofrer dano.`);
        }
        return true;
      }
      case 'turnTheUnholy': {
        // EXPULSAR OS PROFANOS (Devoção, 3º): como expulsar mortos-vivos, mas para corruptores e mortos-vivos, sem destruir.
        if (actor.actionUsed || !(actor.resources?.channelDivinity > 0)) return false;
        actor.actionUsed = true;
        actor.resources.channelDivinity -= 1;
        const cdU = spellSaveDc(actor);
        const alvosU = this.combatants.filter((m) => !m.dead && ['morto-vivo', 'corruptor'].includes(m.tipo) && !m.traits?.includes('imuneAExpulsar') && distanceFt(actor.pos, m.pos) <= 30);
        this.say('recurso', `${actor.name} ergue o símbolo sagrado contra os profanos (CD ${cdU}).`);
        for (const m of alvosU) {
          const r = this.resistencia(m, 'wis', cdU);
          if (r.success) { this.say('resistencia', `${m.name} resiste.`); continue; }
          addCondition(m, 'amedrontado', { rounds: 10, source: actor.id });
          m.fugindoDe = actor.id;
          this.say('condicao', `${m.name} recua, sem conseguir chegar perto.`);
        }
        if (!alvosU.length) this.say('recurso', 'Nenhum profano por perto.');
        return true;
      }
      case 'charmAnimalsAndPlants': {
        // ENCANTAR ANIMAIS E PLANTAS (Natureza, 2º): ação e uma carga; feras e plantas a até 9 m testam SAB ou ficam enfeitiçadas (o dano as liberta).
        if (actor.actionUsed || !(actor.resources?.channelDivinity > 0)) return false;
        actor.actionUsed = true;
        actor.resources.channelDivinity -= 1;
        const cdE = spellSaveDc(actor);
        const alvosE = this.combatants.filter((m) => !m.dead && m !== actor && ['fera', 'planta'].includes(m.tipo) && distanceFt(actor.pos, m.pos) <= 30 && this.field.hasLineOfSight(actor.pos, m.pos));
        this.say('recurso', `${actor.name} chama a natureza (CD ${cdE}).`);
        for (const m of alvosE) {
          const r = this.resistencia(m, 'wis', cdE, { contra: { magico: true, condicao: 'enfeiticado' } });
          this.explicarResistencia(m, 'wis', cdE, r, { contra: `Encantar Animais e Plantas de ${actor.name}`, seSucesso: 'não se deixa encantar' });
          if (!r.success && this.aplicarCondicao(m, 'enfeiticado', { rounds: 10, source: actor.id })) this.say('condicao', `${m.name} se acalma, encantado.`);
        }
        if (!alvosE.length) this.say('recurso', 'Nenhuma fera ou planta por perto.');
        return true;
      }
      case 'trickeryCloak': {
        // MANTO DE SOMBRAS (Enganação, 6º): ação e uma carga; invisível até o fim do próximo turno do clérigo.
        if (actor.actionUsed || !(actor.resources?.channelDivinity > 0) || hasCondition(actor, 'invisivel')) return false;
        actor.actionUsed = true;
        actor.resources.channelDivinity -= 1;
        addCondition(actor, 'invisivel', { rounds: 2, source: actor.id });
        this.say('recurso', `${actor.name} se esconde nas sombras do engano.`);
        return true;
      }
      case 'invokeDuplicity': {
        // INVOCAR DUPLICIDADE (Enganação, 2º): ação e uma carga; a cópia fica ao lado do inimigo mais próximo (a até 9 m) por um minuto.
        if (actor.actionUsed || !(actor.resources?.channelDivinity > 0) || hasCondition(actor, 'duplicidade')) return false;
        const perto = this.enemiesOf(actor).filter((m) => !m.dead && distanceFt(actor.pos, m.pos) <= 30)
          .sort((a, b) => distanceFt(actor.pos, a.pos) - distanceFt(actor.pos, b.pos))[0];
        actor.actionUsed = true;
        actor.resources.channelDivinity -= 1;
        addCondition(actor, 'duplicidade', { rounds: 10, source: actor.id, data: { pos: perto ? { ...perto.pos } : { ...actor.pos } } });
        this.say('recurso', `${actor.name} cria uma cópia ilusória${perto ? ` ao lado de ${perto.name}` : ''} (Invocar Duplicidade).`);
        return true;
      }
      case 'feyPresence': {
        // PRESENÇA FEÉRICA (Arquifada, 1º): ação; hostis a até 3 m testam SAB ou ficam enfeitiçados/amedrontados até o fim do próximo turno. Descanso curto.
        if (actor.actionUsed || !(actor.resources?.feyPresence > 0)) return false;
        const condP = modo === 'enfeiticado' ? 'enfeiticado' : 'amedrontado';
        const alvosP = this.enemiesOf(actor).filter((m) => !m.dead && distanceFt(actor.pos, m.pos) <= 10);
        actor.actionUsed = true;
        actor.resources.feyPresence -= 1;
        const cdP = spellSaveDc(actor);
        this.say('recurso', `${actor.name} irradia uma presença feérica (CD ${cdP}).`);
        for (const m of alvosP) {
          const r = this.resistencia(m, 'wis', cdP, { contra: { magico: true, condicao: condP } });
          this.explicarResistencia(m, 'wis', cdP, r, { contra: `Presença Feérica de ${actor.name}`, seSucesso: 'resiste' });
          if (!r.success) this.aplicarCondicao(m, condP, { rounds: 2, quando: 'fim', lado: actor.side, source: actor.id });
        }
        return true;
      }
      case 'darkDelirium': {
        // DELÍRIO SOMBRIO (Arquifada, 14º): ação; uma criatura a até 18 m testa SAB ou fica enfeitiçada/amedrontada por um minuto (o dano a liberta). Descanso curto.
        if (actor.actionUsed || !(actor.resources?.darkDelirium > 0)) return false;
        const alvoD = target ?? this.enemiesOf(actor).filter((m) => !m.dead && distanceFt(actor.pos, m.pos) <= 60 && this.field.hasLineOfSight(actor.pos, m.pos))
          .sort((a, b) => distanceFt(actor.pos, a.pos) - distanceFt(actor.pos, b.pos))[0];
        if (!alvoD || alvoD.dead || alvoD.side === actor.side || distanceFt(actor.pos, alvoD.pos) > 60) return false;
        const condD = modo === 'enfeiticado' ? 'enfeiticado' : 'amedrontado';
        actor.actionUsed = true;
        actor.resources.darkDelirium -= 1;
        const cdD2 = spellSaveDc(actor);
        const svDD = this.resistencia(alvoD, 'wis', cdD2, { contra: { magico: true, condicao: condD } });
        this.explicarResistencia(alvoD, 'wis', cdD2, svDD, { contra: `Delírio Sombrio de ${actor.name}`, seSucesso: 'resiste' });
        if (!svDD.success && this.aplicarCondicao(alvoD, condD, { rounds: 10, source: actor.id, data: { fimAoDano: true } })) this.say('condicao', `${alvoD.name} se perde num reino de névoa e ilusão.`);
        return true;
      }
      case 'createThrall': {
        // CRIAR SERVO (Grande Antigo, 14º): ação; um humanoide incapacitado a seu alcance fica enfeitiçado até a magia ser desfeita.
        const alvoT2 = target ?? this.enemiesOf(actor).find((m) => !m.dead && m.tipo === 'humanoide' && conditionEffects(m).incapacitated && isAdjacent(actor.pos, m.pos));
        if (actor.actionUsed || !alvoT2 || alvoT2.dead || alvoT2.tipo !== 'humanoide' || !conditionEffects(alvoT2).incapacitated || !isAdjacent(actor.pos, alvoT2.pos)) return false;
        actor.actionUsed = true;
        if (this.aplicarCondicao(alvoT2, 'enfeiticado', { rounds: 100000, source: actor.id, data: { permanente: true } })) this.say('condicao', `${alvoT2.name} passa a servir ${actor.name}: fica enfeitiçado até alguém desfazer a magia.`);
        return true;
      }
      case 'tidesOfChaos': {
        // MARÉS DO CAOS (Magia Selvagem, 1º): vantagem na próxima jogada de ataque ou resistência; a próxima magia de 1º círculo ou mais causa um surto.
        if (!(actor.resources?.tidesOfChaos > 0) || hasCondition(actor, 'maresDoCaos')) return false;
        actor.resources.tidesOfChaos -= 1;
        actor.mareUsada = true;
        addCondition(actor, 'maresDoCaos', { rounds: 100, source: actor.id });
        this.say('recurso', `${actor.name} chama as marés do caos: vantagem no próximo ataque ou resistência.`);
        return true;
      }
      // ---- as subclasses do Guia de Xanathar (`subclasses-livros.js`)
      case 'stormAura': {
        // AURA DA TEMPESTADE: de novo, como ação bônus, em cada turno de Fúria.
        if (actor.bonusUsed || !hasCondition(actor, 'furia')) return false;
        actor.bonusUsed = true;
        Sub.aurasDaTempestade(this, actor, target);
        return true;
      }
      case 'zealousPresence': return Sub.presencaZelosa(this, actor);
      case 'fightingSpirit': return Sub.espiritoDeLuta(this, actor);
      // ---- Tasha
      case 'symbioticEntity': return Sub.entidadeSimbiotica(this, actor);
      case 'starryForm': return Sub.formaEstrelada(this, actor, modo, target);
      case 'flechaEstelar': return Sub.flechaDeBonus(this, actor, target);
      case 'summonWildfireSpirit': return Sub.invocarEspiritoDoFogo(this, actor);
      case 'psionicPower': return Sub.recuperarDadoPsi(this, actor);
      case 'psionicStrike': {
        if (!actor.features?.includes('psionicStrike')) return false;
        actor.golpePsiLigado = modo === 'ligar' ? true : modo === 'desligar' ? false : !actor.golpePsiLigado;
        this.say('recurso', actor.golpePsiLigado ? `${actor.name} prepara o Golpe Psiônico.` : `${actor.name} guarda o Golpe Psiônico.`);
        return true;
      }
      case 'telekineticAdept': return Sub.saltoPsionico(this, actor);
      case 'bulwarkOfForce': return Sub.baluarteDeForca(this, actor);
      case 'telekineticMaster': return Sub.golpeDoMestreTelecinetico(this, actor, target);
      case 'giantsMight': return Sub.poderDosGigantes(this, actor);
      case 'runeCarver': {
        // a RUNA DO FOGO arma (interruptor); as outras de ação bônus se acendem
        if (modo === 'runaDoFogo') {
          if (!actor.features?.includes('runaDoFogo')) return false;
          actor.runaDoFogoArmada = !actor.runaDoFogoArmada;
          this.say('recurso', actor.runaDoFogoArmada ? `${actor.name} arma a Runa do Fogo.` : `${actor.name} guarda a Runa do Fogo.`);
          return true;
        }
        return Sub.invocarRuna(this, actor, modo);
      }
      case 'handOfHarm': {
        if (!actor.features?.includes('handOfHarm')) return false;
        actor.maoDoDanoLigada = modo === 'ligar' ? true : modo === 'desligar' ? false : !actor.maoDoDanoLigada;
        this.say('recurso', actor.maoDoDanoLigada ? `${actor.name} prepara a Mão do Dano.` : `${actor.name} guarda a Mão do Dano.`);
        return true;
      }
      case 'handOfHealing': return Sub.maoDaCura(this, actor, target ?? actor);
      case 'handOfUltimateMercy': return Sub.maoDaMisericordia(this, actor, target);
      case 'armsOfTheAstralSelf': return Sub.bracosAstrais(this, actor);
      case 'visageOfTheAstralSelf': return Sub.semblanteAstral(this, actor);
      case 'awakenedAstralSelf': return Sub.euAstralDesperto(this, actor);
      case 'barbarianWildSurge': return Sub.surtoDeNovo(this, actor);
      case 'bolsteringMagic': return Sub.magiaFortalecedora(this, actor, target ?? actor);
      case 'animatingPerformance': return Sub.apresentacaoAnimada(this, actor);
      case 'unsettlingWords': return Sub.palavrasPerturbadoras(this, actor, target);
      case 'ordersDemand': return Sub.exigenciaDaOrdem(this, actor);
      case 'embodimentOfTheLaw': {
        if (!actor.features?.includes('embodimentOfTheLaw')) return false;
        actor.encarnacaoLigada = modo === 'ligar' ? true : modo === 'desligar' ? false : !actor.encarnacaoLigada;
        this.say('recurso', actor.encarnacaoLigada ? `${actor.name} prepara a voz da lei.` : `${actor.name} guarda a voz da lei.`);
        return true;
      }
      case 'emboldeningBond': return Sub.vinculoEncorajador(this, actor);
      case 'balmOfPeace': return Sub.balsamoDaPaz(this, actor);
      case 'vigilantBlessing': return Sub.bencaoVigilante(this, actor, target);
      case 'twilightSanctuary': return Sub.santuarioDoCrepusculo(this, actor);
      // TASHA (3º lote)
      case 'inspiringSmite': return Sub.golpeInspirador(this, actor);
      case 'peerlessAthlete': return Sub.atletaSemIgual(this, actor);
      case 'livingLegend': return Sub.lendaViva(this, actor);
      case 'abjureTheExtraplanar': return Sub.abjurarOExtraplanar(this, actor);
      case 'watchersWill': return Sub.vontadeDoVigilante(this, actor);
      case 'mortalBulwark': return Sub.baluarteMortal(this, actor);
      case 'gatheredSwarm': {
        if (!actor.features?.includes('gatheredSwarm') || !['dano', 'empurrar'].includes(modo)) return false;
        actor.enxameModo = modo;
        this.say('recurso', modo === 'dano' ? `O enxame de ${actor.name} vai morder o próximo alvo.` : `O enxame de ${actor.name} vai empurrar o próximo alvo.`);
        return true;
      }
      case 'writhingTide': return Sub.mareOndulante(this, actor);
      case 'ghostWalk': return Sub.caminharFantasma(this, actor);
      case 'psionicPowerSoulknife': return Sub.recuperarDadoPsi(this, actor);
      case 'segundaLamina': return Sub.segundaLamina(this, actor, target);
      case 'psychicVeil': return Sub.veuPsiquico(this, actor);
      // TASHA (4º lote)
      // OS OUTROS LIVROS (Costa da Espada, Mestre, Fizban, Bigby)
      case 'battleragerArmor': return Sub.golpeDosEspinhos(this, actor, target);
      case 'battleragerCharge': return Sub.investidaDoFurioso(this, actor);
      case 'arcaneAbjuration': return Sub.abjuracaoArcana(this, actor, target);
      case 'hourOfReaping': return Sub.horaDaColheita(this, actor);
      case 'touchOfTheLongDeath': return Sub.toqueDaLongaMorte(this, actor, target, modo);
      case 'championChallenge': return Sub.desafioDoCampeao(this, actor);
      case 'turnTheTide': return Sub.virarAMare(this, actor);
      case 'exaltedChampion': return Sub.campeaoExaltado(this, actor);
      case 'indestructibleLife': return Sub.vidaIndestrutivel(this, actor);
      case 'touchOfDeathCleric': {
        if (!actor.features?.includes('touchOfDeathCleric')) return false;
        actor.toqueDaMorteLigado = modo === 'ligar' ? true : modo === 'desligar' ? false : !actor.toqueDaMorteLigado;
        this.say('recurso', actor.toqueDaMorteLigado ? `${actor.name} prepara o toque da morte.` : `${actor.name} guarda o toque da morte.`);
        return true;
      }
      case 'controlUndead': return Sub.controlarMortosVivos(this, actor, target);
      case 'dreadfulAspect': return Sub.aspectoTerrivel(this, actor);
      case 'dreadLord': return Sub.senhorDoTerror(this, actor);
      case 'sombrasDoSenhor': return Sub.sombrasDoSenhor(this, actor, target);
      case 'aspectOfTheWyrm': return Sub.aspectoDaSerpe(this, actor, modo ?? 'medo');
      case 'medoDaSerpe': return Sub.medoDaSerpe(this, actor, target);
      case 'draconicDisciple': {
        if (!actor.features?.includes('draconicDisciple') || !Sub.TIPOS_DO_DRAGAO.includes(modo)) return false;
        actor.tipoDoDragao = modo;
        this.say('recurso', `O dragão de ${actor.name} agora é de ${modo}.`);
        return true;
      }
      case 'drakeCompanion': return Boolean(Sub.invocarDraco(this, actor));
      case 'comandarDraco': return Sub.comandarDraco(this, actor);
      case 'essenciaDoDraco': {
        if (!actor.features?.includes('drakeCompanion') || !Sub.TIPOS_DO_DRAGAO.includes(modo)) return false;
        actor.tipoDoDraco = modo;
        this.say('recurso', `O draco de ${actor.name} será de ${modo} na próxima vez que for chamado (e o sopro já é).`);
        return true;
      }
      case 'elementalCleaver': {
        if (!actor.features?.includes('elementalCleaver') || !['fogo', 'frio', 'elétrico', 'ácido', 'trovejante'].includes(modo)) return false;
        actor.tipoDoCutelo = modo;
        if (actor.cutelo) actor.cutelo.tipo = modo;
        this.say('recurso', `O cutelo de ${actor.name} será de ${modo}.`);
        return true;
      }
      case 'mightyImpel': return Sub.impulsoPoderoso(this, actor, target);
      case 'revelationInFlesh': return Sub.revelacaoNaCarne(this, actor, modo ?? 'voo');
      case 'bastionOfLaw': return Sub.bastiaoDaLei(this, actor, target ?? actor);
      case 'tranceOfOrder': return Sub.transeDaOrdem(this, actor);
      case 'clockworkCavalcade': return Sub.cavalgadaMecanica(this, actor);
      case 'elementalGift': return Sub.vooDoGenio(this, actor);
      case 'bladesong': return Sub.cancaoDaLamina(this, actor);
      case 'golpeDoTruque': return Sub.golpeDoTruque(this, actor, target);
      case 'awakenedSpellbook': {
        if (!actor.features?.includes('awakenedSpellbook')) return false;
        if (modo === 'nenhum') actor.tipoDoGrimorio = null;
        else if (Sub.tiposDoGrimorio(actor, SPELLS).includes(modo)) actor.tipoDoGrimorio = modo;
        else return false;
        this.say('recurso', actor.tipoDoGrimorio ? `O grimório de ${actor.name} vai trocar o dano por ${actor.tipoDoGrimorio}.` : `O grimório de ${actor.name} deixa o dano como é.`);
        return true;
      }
      case 'stepsOfNight': return Sub.passosDaNoite(this, actor, temEscuridaoDoMapa(this) ? nivelDeLuz(this.field, actor.pos.x, actor.pos.y, fontesDeLuz(this)) : CLARO);
      case 'balmOfTheSummerCourt': return Sub.balsamoDaCorte(this, actor, target ?? actor, valor);
      case 'spiritTotem': return Sub.totemEspiritual(this, actor, modo);
      case 'otherworldlyWings': return Sub.asasDeOutroMundo(this, actor);
      case 'unearthlyRecovery': return Sub.recuperacaoSobrenatural(this, actor);
      case 'houndOfIllOmen': return Sub.caoDoMauAgouro(this, actor, target);
      case 'umbralForm': return Sub.formaUmbral(this, actor);
      case 'healingLight': return Sub.luzCurativa(this, actor, target ?? actor, valor);
      case 'hexbladesCurse': return Sub.maldicaoDoLamina(this, actor, target);
      case 'kenseisShot': return Sub.tiroDoKensei(this, actor);
      case 'sharpenTheBlade': return Sub.afiarALamina(this, actor, modo);
      case 'oneWithTheBlade': {
        // GOLPE HÁBIL: interruptor de graça.
        if (!actor.features?.includes('oneWithTheBlade')) return false;
        actor.golpeHabilLigado = modo === 'ligar' ? true : modo === 'desligar' ? false : !actor.golpeHabilLigado;
        this.say('recurso', actor.golpeHabilLigado ? `${actor.name} prepara o Golpe Hábil.` : `${actor.name} guarda o Golpe Hábil.`);
        return true;
      }
      case 'radiantSunBolt': return Sub.raiosDeBonus(this, actor, target);
      case 'conqueringPresence': return Sub.presencaConquistadora(this, actor);
      case 'invincibleConqueror': return Sub.conquistadorInvencivel(this, actor);
      case 'emissaryOfPeace': return Sub.emissarioDaPaz(this, actor);
      case 'planarWarrior': return Sub.guerreiroPlanar(this, actor, target);
      case 'etherealStep': return Sub.passoEtereo(this, actor);
      case 'distantStrike': return Sub.golpeDistante(this, actor, target);
      case 'huntersSense': return Sub.sentidoDoCacador(this, actor, target);
      case 'slayersPrey': return Sub.presaDoMatador(this, actor, target);
      case 'unwaveringMark': return Sub.golpeDaMarca(this, actor, target);
      case 'panache': return Sub.panache(this, actor, target);
      case 'elegantManeuver': return Sub.manobraElegante(this, actor);
      case 'suddenStrike': return Sub.golpeSubito(this, actor, target);
      case 'insightfulFighting': return Sub.combatePerspicaz(this, actor, target);
      case 'masterOfTactics': return Sub.ajudaDoMentor(this, actor, target);
      case 'ajudaDoLobo': return Sub.ajudaDoLobo(this, actor, target);
      case 'arcaneShot': {
        // DISPARO ARCANO: interruptor de graça, como as manobras — qual opção sai no próximo acerto de arco do turno.
        if (!actor.features?.includes(modo) || !Sub.NOMES_DO_DISPARO[modo]) return false;
        actor.disparoPronto = actor.disparoPronto === modo ? null : modo;
        this.say('recurso', actor.disparoPronto ? `${actor.name} prepara o ${Sub.NOMES_DO_DISPARO[modo]}.` : `${actor.name} guarda a flecha encantada.`);
        return true;
      }
      case 'mantleOfInspiration': return Sub.mantoDeInspiracao(this, actor);
      case 'mantleOfMajesty': return Sub.mantoDeMajestade(this, actor, target);
      case 'unbreakableMajesty': return Sub.majestadeInquebravel(this, actor);
      case 'pathToTheGrave': return Sub.caminhoParaASepultura(this, actor, target);
      case 'bladeFlourish': {
        // FLOREIO DE LÂMINA: interruptor de graça, como as manobras — qual floreio o próximo acerto do turno usa (ou nenhum).
        if (!actor.features?.includes('bladeFlourish')) return false;
        const qual = ['defensivo', 'cortante', 'movel'].includes(modo) ? modo : null;
        actor.floreioPronto = actor.floreioPronto === qual ? null : qual;
        this.say('recurso', actor.floreioPronto ? `${actor.name} prepara o ${{ defensivo: 'Floreio Defensivo', cortante: 'Floreio Cortante', movel: 'Floreio Móvel' }[qual]}.` : `${actor.name} guarda os floreios.`);
        return true;
      }
      case 'psychicBlades': {
        // LÂMINAS PSÍQUICAS: interruptor de graça; ligadas, o acerto de arma do turno gasta uma Inspiração.
        if (!actor.features?.includes('psychicBlades')) return false;
        actor.laminasPsiquicasLigadas = modo === 'ligar' ? true : modo === 'desligar' ? false : !actor.laminasPsiquicasLigadas;
        this.say('recurso', actor.laminasPsiquicasLigadas ? `${actor.name} afia as Lâminas Psíquicas.` : `${actor.name} guarda as Lâminas Psíquicas.`);
        return true;
      }
      case 'warPriest': {
        // SACERDOTE DA GUERRA (Guerra, 1º): depois da ação Atacar, um ataque com arma como ação bônus. SAB usos por descanso longo.
        if (actor.bonusUsed || !(actor.resources?.warPriest > 0) || !actor.atacouNoTurno) return false;
        const alvoW = target ?? this.enemiesOf(actor).filter((m) => !m.dead && this.armaDeOportunidade(actor) !== undefined && this.canAttack(actor, m, this.armaDeOportunidade(actor)).ok)
          .sort((a, b) => distanceFt(actor.pos, a.pos) - distanceFt(actor.pos, b.pos))[0];
        const armaW = this.armaDeOportunidade(actor);
        if (!alvoW || alvoW.dead || armaW === undefined || !this.canAttack(actor, alvoW, armaW).ok) return false;
        actor.bonusUsed = true;
        actor.resources.warPriest -= 1;
        this.say('recurso', `${actor.name} ataca de novo, como um sacerdote da guerra.`);
        this.resolveAttackBase(actor, alvoW, { weaponId: armaW, opportunity: true });
        return true;
      }
      case 'destructiveWrath': {
        // IRA DESTRUTIVA (Tempestade, 2º): arma o próximo dano elétrico ou trovejante para sair no máximo. Uma carga de Canalizar Divindade.
        if (actor.furiaDestrutivaPronta || !(actor.resources?.channelDivinity > 0)) return false;
        actor.resources.channelDivinity -= 1;
        actor.furiaDestrutivaPronta = true;
        this.say('recurso', `${actor.name} chama a tempestade: o próximo raio ou trovão sairá no máximo (Ira Destrutiva).`);
        return true;
      }
      case 'radianceOfTheDawn': {
        // ESPLENDOR DA AURORA (Luz, 2º): ação e uma carga; hostis a até 9 m fazem CD de CON ou sofrem 2d10 + nível radiante (metade se passa).
        if (actor.actionUsed || !(actor.resources?.channelDivinity > 0)) return false;
        actor.actionUsed = true;
        actor.resources.channelDivinity -= 1;
        const cdR = spellSaveDc(actor);
        const alvosR = this.enemiesOf(actor).filter((m) => !m.dead && distanceFt(actor.pos, m.pos) <= 30 && this.field.hasLineOfSight(actor.pos, m.pos));
        const danoR = damageRoll(this.rng, `2d10+${actor.level ?? 1}`).total;
        this.say('recurso', `${actor.name} liberta a luz da aurora (CD ${cdR}, ${danoR} radiante).`);
        for (const m of alvosR) {
          const r = this.resistencia(m, 'con', cdR, { contra: { magico: true, tipoDano: 'radiante' } });
          this.explicarResistencia(m, 'con', cdR, r, { contra: `Esplendor da Aurora de ${actor.name}`, seSucesso: 'leva só metade' });
          this.applyDamage(m, r.success ? Math.floor(danoR / 2) : danoR, 'radiante', actor, { magico: true });
        }
        if (!alvosR.length) this.say('recurso', 'Nenhum inimigo à vista.');
        return true;
      }
      case 'coronaOfLight': {
        // COROA DE LUZ (Luz, 17º): ação; por um minuto as criaturas a até 18 m resistem pior às magias de fogo e radiantes. Sem limite de usos.
        if (actor.actionUsed || hasCondition(actor, 'coroaDeLuz')) return false;
        actor.actionUsed = true;
        addCondition(actor, 'coroaDeLuz', { rounds: 10, source: actor.id });
        this.say('recurso', `${actor.name} se envolve numa coroa de luz do sol.`);
        return true;
      }
      case 'holyNimbus': {
        // NIMBO SAGRADO (Devoção, 20º): ação; por um minuto, luz que fere quem começa o turno a 9 m (`nimboTick`). Uma vez por descanso longo.
        if (actor.actionUsed || !(actor.resources?.holyNimbus > 0)) return false;
        actor.actionUsed = true;
        actor.resources.holyNimbus -= 1;
        addCondition(actor, 'nimboSagrado', { rounds: 10, source: actor.id });
        this.say('recurso', `${actor.name} irradia a luz do sol: o Nimbo Sagrado queima os inimigos por perto.`);
        return true;
      }
      case 'cleansingTouch': {
        // TOQUE PURIFICADOR (paladino, 14º): ação; encerra UMA magia em si ou num aliado tocado. Usos: CAR (mínimo 1) por descanso longo.
        const alvoT = target ?? actor;
        if (actor.actionUsed || !(actor.resources?.cleansingTouch > 0) || alvoT.side !== actor.side || alvoT.dead) return false;
        if (alvoT !== actor && !isAdjacent(actor.pos, alvoT.pos)) return false;
        const magica = (alvoT.conditions ?? []).find((k) => k.magia);
        if (!magica) return false;
        actor.actionUsed = true;
        actor.resources.cleansingTouch -= 1;
        removeCondition(alvoT, magica.id);
        this.say('recurso', `${actor.name} toca ${alvoT === actor ? 'a si mesmo' : alvoT.name}: ${CONDITIONS[magica.id]?.name ?? magica.id} se desfaz (Toque Purificador).`);
        return true;
      }
      case 'overchannel': {
        // SOBRECANALIZAR (mago de Evocação, 14º): arma o próximo dano de magia de até 5º círculo no máximo. Interruptor, de graça.
        if (!actor.features?.includes('overchannel')) return false;
        const liga = modo === 'ligar' ? true : modo === 'desligar' ? false : !actor.sobrecanalizaPronta;
        actor.sobrecanalizaPronta = liga;
        this.say('recurso', `${actor.name} ${liga ? 'prepara' : 'desfaz'} o Sobrecanalizar.`);
        return true;
      }
      case 'wildShape': {
        // FORMA SELVAGEM (druida, 2º): ação e um uso; `modo` é a fera (id do monstro) ou 'voltar'. Voltar custa a ação bônus.
        if (modo === 'voltar') {
          if (!actor.formaSelvagem || actor.bonusUsed) return false;
          actor.bonusUsed = true;
          this.say('condicao', `${actor.name} abandona a forma de ${actor.formaSelvagem.nome}.`);
          despirFera(actor);
          this.onEvent({ type: 'voltouAoNormal', target: actor });
          return true;
        }
        // FORMA SELVAGEM EM COMBATE (Círculo da Lua, 2º): assumir a forma custa a ação BÔNUS, não a ação.
        const lua = actor.features?.includes('combatWildShape');
        const ilimitada = actor.resourcesIlimitados?.includes('wildShape');
        if ((lua ? actor.bonusUsed : actor.actionUsed) || actor.formaSelvagem || !(ilimitada || actor.resources?.wildShape > 0) || conditionEffects(actor).incapacitated) return false;
        if (!formasDisponiveis(actor.level ?? 1, actor.features?.includes('circleForms')).includes(modo)) return false;
        if (!vestirFera(actor, modo)) return false;
        if (lua) actor.bonusUsed = true; else actor.actionUsed = true;
        if (!ilimitada) actor.resources.wildShape -= 1;
        this.say('condicao', `${actor.name} assume a forma de ${actor.formaSelvagem.nome} (${actor.hp} PV, CA ${actor.ac}).`);
        this.onEvent({ type: 'transformou', target: actor });
        return true;
      }
      case 'naturesWrath': {
        // IRA DA NATUREZA (Anciões, 3º): ação e uma carga; uma criatura a até 3 m testa Força ou Destreza (a de melhor bônus) ou fica contida.
        if (actor.actionUsed || !(actor.resources?.channelDivinity > 0)) return false;
        const alvoN = target ?? this.enemiesOf(actor).filter((m) => !m.dead && distanceFt(actor.pos, m.pos) <= 10)
          .sort((a, b) => distanceFt(actor.pos, a.pos) - distanceFt(actor.pos, b.pos))[0];
        if (!alvoN || alvoN.dead || alvoN.side === actor.side || distanceFt(actor.pos, alvoN.pos) > 10) return false;
        actor.actionUsed = true;
        actor.resources.channelDivinity -= 1;
        const cdN = spellSaveDc(actor);
        const hab = saveBonus(alvoN, 'str') >= saveBonus(alvoN, 'dex') ? 'str' : 'dex';
        const svN = this.resistencia(alvoN, hab, cdN);
        this.explicarResistencia(alvoN, hab, cdN, svN, { contra: `Ira da Natureza de ${actor.name}`, seSucesso: 'se solta das vinhas' });
        if (!svN.success && this.aplicarCondicao(alvoN, 'contido', { rounds: 10, source: actor.id, data: { save: hab, dc: cdN, repete: true } })) {
          this.say('condicao', `Vinhas espectrais prendem ${alvoN.name}.`);
        }
        return true;
      }
      case 'turnTheFaithless': {
        // EXPULSAR OS INFIÉIS (Anciões, 3º): como Expulsar os Profanos, mas para fadas e corruptores.
        if (actor.actionUsed || !(actor.resources?.channelDivinity > 0)) return false;
        actor.actionUsed = true;
        actor.resources.channelDivinity -= 1;
        const cdF = spellSaveDc(actor);
        const alvosF = this.combatants.filter((m) => !m.dead && ['feérico', 'corruptor'].includes(m.tipo) && distanceFt(actor.pos, m.pos) <= 30);
        this.say('recurso', `${actor.name} ergue a mão aos infiéis (CD ${cdF}).`);
        for (const m of alvosF) {
          const r = this.resistencia(m, 'wis', cdF);
          if (r.success) { this.say('resistencia', `${m.name} resiste.`); continue; }
          addCondition(m, 'amedrontado', { rounds: 10, source: actor.id });
          m.fugindoDe = actor.id;
          this.say('condicao', `${m.name} recua, sem conseguir chegar perto.`);
        }
        if (!alvosF.length) this.say('recurso', 'Nenhum infiel por perto.');
        return true;
      }
      case 'elderChampion': {
        // CAMPEÃO ANCESTRAL (Anciões, 20º): ação; por um minuto recupera 10 PV por turno. Uma vez por descanso longo.
        if (actor.actionUsed || !(actor.resources?.elderChampion > 0)) return false;
        actor.actionUsed = true;
        actor.resources.elderChampion -= 1;
        addCondition(actor, 'campeaoAnciao', { rounds: 10, source: actor.id });
        this.say('recurso', `${actor.name} se torna uma força da natureza: recupera 10 PV por turno (Campeão Ancestral).`);
        return true;
      }
      case 'rangersCompanion': {
        // COMANDAR O COMPANHEIRO (Senhor das Feras). `modo` 'atacar' (o padrão) ou 'apoio' (correr, desengajar, esquivar, ajudar: a fera não ataca).
        //   - Atacar custa a AÇÃO do patrulheiro; com Ataque Extra, custa só UM dos ataques dele (ele ainda faz os outros).
        //   - Apoio custa a ação, ou a AÇÃO BÔNUS com o Treinamento Excepcional (7º).
        const comp = this.invocadosDe(actor).find((x) => x.invocado.spellId === 'companheiroAnimal');
        if (!comp || comp.dead || conditionEffects(actor).incapacitated) return false;
        const apoio = modo === 'apoio';
        const bonus = apoio && actor.features?.includes('exceptionalTraining');
        if (bonus ? actor.bonusUsed : actor.actionUsed) return false;
        if (bonus) actor.bonusUsed = true;
        else if (!apoio && actor.features?.includes('extraAttack') && !actor.comandouNoTurno) actor.comandouNoTurno = true;
        else actor.actionUsed = true;
        comp.actionUsed = false;
        comp.proibidoAtacar = apoio;
        this.say('recurso', `${actor.name} dá a ordem a ${comp.name}${apoio ? ' (apoio)' : ' (atacar)'}.`);
        return true;
      }
      case 'cloakOfShadows': {
        // MANTO DE SOMBRAS (monge da Sombra, 11º): ação; fica invisível até atacar ou conjurar (o jogo não exige penumbra).
        if (actor.actionUsed || hasCondition(actor, 'invisivel') || conditionEffects(actor).incapacitated) return false;
        actor.actionUsed = true;
        addCondition(actor, 'invisivel', { rounds: 100, source: actor.id });
        this.say('recurso', `${actor.name} se envolve nas sombras e some da vista (Manto de Sombras).`);
        return true;
      }
      case 'hypnoticGaze': {
        // OLHAR HIPNÓTICO (mago de Encantamento, 2º): ação; uma criatura colada em você, que o veja ou ouça, testa Sabedoria (CD das magias) ou
        // fica enfeitiçada e incapacitada, sem andar, até o fim do seu próximo turno. A mesma criatura só uma vez por descanso longo.
        if (actor.actionUsed || conditionEffects(actor).incapacitated) return false;
        const alvoH = target ?? this.enemiesOf(actor).filter((m) => !m.dead && distanceFt(actor.pos, m.pos) <= 5)[0];
        if (!alvoH || alvoH.dead || alvoH.side === actor.side || distanceFt(actor.pos, alvoH.pos) > 5) return false;
        // MANTER: nos turnos seguintes a ação renova o olhar sobre quem já está hipnotizado e ainda colado nele (sem nova resistência).
        const mantendo = getCondition(alvoH, 'olharHipnotico')?.source === actor.id;
        if (mantendo) {
          actor.actionUsed = true;
          removeCondition(alvoH, 'olharHipnotico');
          removeCondition(alvoH, 'enfeiticado');
          this.aplicarCondicao(alvoH, 'olharHipnotico', { rounds: 1, quando: 'fim', lado: actor.side, source: actor.id });
          this.aplicarCondicao(alvoH, 'enfeiticado', { rounds: 1, quando: 'fim', lado: actor.side, source: actor.id });
          this.say('condicao', `${actor.name} mantém o olhar sobre ${alvoH.name}.`);
          return true;
        }
        if ((actor.olharHipnoticoJa ??= []).includes(alvoH.id)) return false;
        actor.actionUsed = true;
        actor.olharHipnoticoJa.push(alvoH.id);
        const cdH = spellSaveDc(actor);
        const svH = this.resistencia(alvoH, 'wis', cdH, { contra: { magico: true, condicao: 'enfeiticado' } });
        this.explicarResistencia(alvoH, 'wis', cdH, svH, { contra: `Olhar Hipnótico de ${actor.name}`, seSucesso: 'resiste ao olhar' });
        if (!svH.success && this.aplicarCondicao(alvoH, 'olharHipnotico', { rounds: 1, quando: 'fim', lado: actor.side, source: actor.id })) {
          this.aplicarCondicao(alvoH, 'enfeiticado', { rounds: 1, quando: 'fim', lado: actor.side, source: actor.id });
          this.say('condicao', `${alvoH.name} fica hipnotizado: enfeitiçado, incapacitado e parado até o fim do próximo turno de ${actor.name} (ou até sofrer dano).`);
        }
        return true;
      }
      case 'commandUndead': {
        // COMANDAR MORTOS-VIVOS (mago de Necromancia, 14º): ação; um morto-vivo a até 18 m testa Carisma (CD das magias; com vantagem se tiver INT 8+)
        // ou passa a obedecer ao mago (luta do lado dele, como uma criatura invocada).
        if (actor.actionUsed || conditionEffects(actor).incapacitated) return false;
        const alvoU = target ?? this.enemiesOf(actor).filter((m) => !m.dead && m.tipo === 'morto-vivo' && distanceFt(actor.pos, m.pos) <= 60)
          .sort((a, b) => distanceFt(actor.pos, a.pos) - distanceFt(actor.pos, b.pos))[0];
        if (!alvoU || alvoU.dead || alvoU.tipo !== 'morto-vivo' || alvoU.side === actor.side || distanceFt(actor.pos, alvoU.pos) > 60) return false;
        actor.actionUsed = true;
        const cdU = spellSaveDc(actor);
        const svU = this.resistencia(alvoU, 'cha', cdU, { vantagem: (alvoU.abilities?.int ?? 0) >= 8, contra: { magico: true, condicao: 'enfeiticado' } });
        this.explicarResistencia(alvoU, 'cha', cdU, svU, { contra: `Comandar Mortos-vivos de ${actor.name}`, seSucesso: 'resiste ao comando' });
        if (!svU.success) {
          alvoU.side = actor.side;
          alvoU.invocado = { donoId: actor.id, spellId: 'comandarMortosVivos', auto: Boolean(actor.invocadosAuto) };
          alvoU.xp = 0;
          this.say('condicao', `${alvoU.name} se curva à vontade de ${actor.name}: passa a lutar do lado dele.`);
          this.onEvent({ type: 'invocado', criatura: alvoU, dono: actor });
        }
        return true;
      }
      case 'warMagic': case 'improvedWarMagic': case 'battleMagic': {
        // MAGIA DE GUERRA / MAGIA DE BATALHA: depois de conjurar com a ação, um ataque com arma como ação bônus (`ataqueAposMagia`).
        if (!actor.ataqueAposMagia || actor.bonusUsed || conditionEffects(actor).incapacitated) return false;
        const arma = this.armaDeOportunidade(actor) ?? actor.equippedWeapon ?? null;
        const alvoG = target ?? this.enemiesOf(actor).filter((m) => !m.dead && this.canAttack(actor, m, arma).ok)
          .sort((a, b) => distanceFt(actor.pos, a.pos) - distanceFt(actor.pos, b.pos))[0];
        if (!alvoG || alvoG.dead || alvoG.side === actor.side || !this.canAttack(actor, alvoG, arma).ok) return false;
        actor.bonusUsed = true;
        actor.ataqueAposMagia = false;
        this.say('recurso', `${actor.name} ataca logo depois da magia (${nomeDaCaracteristica(featureId)}).`);
        this.resolveAttack(actor, alvoG, { weaponId: arma });
        return true;
      }
      case 'combatWildShape': {
        // FORMA SELVAGEM EM COMBATE, a cura: na forma de fera, ação bônus, gasta um espaço de magia e recupera 1d8 por círculo do espaço.
        // `modo` é o círculo (1 a 9); sem ele, o menor espaço que houver.
        const sc = actor.spellcasting;
        if (!actor.formaSelvagem || actor.bonusUsed || !sc?.slots) return false;
        const n = Number.isInteger(modo) && modo >= 1 ? modo : sc.slots.findIndex((q, i) => i >= 1 && q > 0);
        if (!(n >= 1) || !(sc.slots[n] > 0)) return false;
        sc.slots[n] -= 1;
        actor.bonusUsed = true;
        const cura = roll(this.rng, `${n}d8`);
        const antes = actor.hp;
        actor.hp = Math.min(actor.maxHp, actor.hp + cura.total);
        this.say('cura', `${actor.name} gasta um espaço de ${n}º círculo e recupera ${actor.hp - antes} PV na forma de ${actor.formaSelvagem.nome} (Forma Selvagem em Combate).`);
        return true;
      }
      case 'tripAttack': case 'menacingAttack': case 'pushingAttack': case 'lungingAttack': case 'precisionAttack': case 'goadingAttack': case 'distractingStrike':
      case 'disarmingAttack': case 'maneuveringAttack': case 'sweepingAttack': {
        // MANOBRA é um INTERRUPTOR, de graça: armada, vale no próximo ataque de arma do turno (uma por ataque). O dado se gasta no
        // acerto (ou, no Ataque Preciso, quando ele vira o erro em acerto): armar e não acertar não custa nada.
        if (!actor.features?.includes(featureId) || (actor.resources?.superiorityDice ?? 0) < 1) return false;
        const liga = modo === 'ligar' ? true : modo === 'desligar' ? false : actor.manobraPronta !== featureId;
        actor.manobraPronta = liga ? featureId : null;
        this.say('recurso', `${actor.name} ${liga ? 'arma' : 'desarma'} a manobra ${nomeDaCaracteristica(featureId)}.`);
        return true;
      }
      case 'blessingOfTheTrickster': {
        // BÊNÇÃO DO TRAPACEIRO: ação; toca outra criatura aliada (1,5 m); vantagem em Furtividade por uma hora, e só em uma criatura por vez.
        const alvoB = target;
        if (!actor.features?.includes(featureId) || actor.actionUsed || conditionEffects(actor).incapacitated) return false;
        if (!alvoB || alvoB === actor || alvoB.dead || alvoB.side !== actor.side || distanceFt(actor.pos, alvoB.pos) > 5) return false;
        for (const c of this.combatants) {
          const antiga = getCondition(c, 'bencaoTrapaceiro');
          if (antiga && antiga.source === actor.id) removeCondition(c, 'bencaoTrapaceiro');
        }
        actor.actionUsed = true;
        addCondition(alvoB, 'bencaoTrapaceiro', { rounds: 600, source: actor.id });
        this.say('recurso', `${actor.name} toca ${alvoB.name}: vantagem em Furtividade por uma hora (Bênção do Trapaceiro).`);
        return true;
      }
      case 'feintingAttack': {
        // ATAQUE FINTADO: ação bônus que arma a manobra; a vantagem e o dado vêm no próximo ataque de arma do turno.
        if (!actor.features?.includes(featureId) || actor.bonusUsed || (actor.resources?.superiorityDice ?? 0) < 1) return false;
        actor.bonusUsed = true;
        actor.manobraPronta = featureId;
        this.say('recurso', `${actor.name} finta (Ataque Fintado): vantagem no próximo ataque contra quem está ao lado.`);
        return true;
      }
      case 'evasiveFootwork': {
        // PASSO EVASIVO: livre; gasta o dado e soma a rolagem à CA até o fim do turno.
        if (!actor.features?.includes(featureId) || (actor.resources?.superiorityDice ?? 0) < 1 || hasCondition(actor, 'passoEvasivo')) return false;
        actor.resources.superiorityDice -= 1;
        const r = roll(this.rng, this.dadoDeSuperioridade(actor));
        addCondition(actor, 'passoEvasivo', { rounds: 1, quando: 'fim', lado: actor.side, source: actor.id, data: { acBonus: r.total } });
        this.say('recurso', `${actor.name} gasta um dado de superioridade: +${r.total} de CA até o fim do turno (Passo Evasivo).`);
        return true;
      }
      case 'rally': {
        // REAGRUPAR: ação bônus; um aliado que o ouça ganha PV temporários = dado + Carisma.
        const aliado = target;
        if (!actor.features?.includes(featureId) || actor.bonusUsed || (actor.resources?.superiorityDice ?? 0) < 1) return false;
        if (!aliado || aliado === actor || aliado.dead || aliado.side !== actor.side || distanceFt(actor.pos, aliado.pos) > 60) return false;
        if (aliado.hp <= 0 || hasCondition(aliado, 'inconsciente') || conditionEffects(aliado).incapacitated) return false;
        actor.bonusUsed = true;
        actor.resources.superiorityDice -= 1;
        const r = roll(this.rng, this.dadoDeSuperioridade(actor));
        const pv = Math.max(0, r.total + abilityMod(actor.abilities?.cha ?? 10));
        aliado.tempHp = Math.max(aliado.tempHp ?? 0, pv);
        this.say('recurso', `${actor.name} reagrupa ${aliado.name}: ${pv} PV temporários (Reagrupar).`);
        return true;
      }
      case 'commandersStrike': {
        // GOLPE DO COMANDANTE: ação bônus, antes do Ataque. Abre mão de um golpe (exige dois ou mais); o aliado usa a reação para atacar.
        const aliado = target;
        if (!actor.features?.includes(featureId) || actor.bonusUsed || actor.actionUsed || (actor.resources?.superiorityDice ?? 0) < 1) return false;
        if (!aliado || aliado === actor || aliado.dead || aliado.side !== actor.side || aliado.reactionUsed || conditionEffects(aliado).incapacitated) return false;
        if (distanceFt(actor.pos, aliado.pos) > 60 || this.golpesDoAtaque(actor, actor.equippedWeapon).length < 2) return false;
        const arma = this.armaDeOportunidade(aliado);
        const alvoDele = arma === undefined ? null : this.enemiesOf(aliado).filter((e) => !e.dead && this.canAttack(aliado, e, arma).ok)
          .sort((a, b) => distanceFt(a.pos, aliado.pos) - distanceFt(b.pos, aliado.pos))[0];
        if (!alvoDele) return false;
        actor.bonusUsed = true;
        actor.golpeCedido = true;
        actor.resources.superiorityDice -= 1;
        aliado.reactionUsed = true;
        aliado.comandoDado = this.dadoDeSuperioridade(actor);
        this.say('recurso', `${actor.name} abre mão de um golpe e manda ${aliado.name} atacar (Golpe do Comandante).`);
        try {
          this.resolveAttackBase(aliado, alvoDele, { opportunity: true, weaponId: arma, reacao: true });
        } finally {
          aliado.comandoDado = null;
        }
        return true;
      }
      case 'carefulSpell': case 'distantSpell': case 'empoweredSpell': case 'extendedSpell':
      case 'heightenedSpell': case 'quickenedSpell': case 'subtleSpell': case 'twinnedSpell': {
        // METAMAGIA é um INTERRUPTOR, de graça: armada, vale na próxima magia que servir (e que os pontos de feitiçaria pagarem).
        if (!actor.features?.includes(featureId)) return false;
        const lig = new Set(actor.metaLigada ?? []);
        const liga = modo === 'ligar' ? true : modo === 'desligar' ? false : !lig.has(featureId);
        if (liga) lig.add(featureId); else lig.delete(featureId);
        actor.metaLigada = [...lig];
        this.say('recurso', `${actor.name} ${liga ? 'arma' : 'desarma'} a metamagia ${nomeDaCaracteristica(featureId)}.`);
        return true;
      }
      case 'fontOfMagic': {
        // FONTE DE MAGIA (feiticeiro, 2º): ação bônus. 'pontos' gasta um espaço (o menor que houver) e rende pontos iguais ao círculo;
        // 'espaco' cria um espaço (o maior que os pontos pagam, até o 5º): 1º 2 pontos, 2º 3, 3º 5, 4º 6, 5º 7.
        if (actor.bonusUsed || !actor.spellcasting?.slots) return false;
        const sc = actor.spellcasting;
        const max = actor.resourcesMax?.sorceryPoints ?? 0;
        if (modo === 'pontos') {
          const nivelS = sc.slots.findIndex((n, i) => i >= 1 && n > 0);
          if (nivelS < 1 || (actor.resources.sorceryPoints ?? 0) >= max) return false;
          sc.slots[nivelS] -= 1;
          actor.resources.sorceryPoints = Math.min(max, (actor.resources.sorceryPoints ?? 0) + nivelS);
          actor.bonusUsed = true;
          this.say('recurso', `${actor.name} converte um espaço de ${nivelS}º círculo em ${nivelS} pontos de feitiçaria (${actor.resources.sorceryPoints}).`);
          return true;
        }
        const CUSTO = { 1: 2, 2: 3, 3: 5, 4: 6, 5: 7 };
        const pedido = Number(valor);
        const nivelC = pedido >= 1 && pedido <= 5 ? pedido : [5, 4, 3, 2, 1].find((n) => CUSTO[n] <= (actor.resources.sorceryPoints ?? 0) && n <= (sc.slotsMax?.length ?? 6) - 1);
        if (!nivelC || CUSTO[nivelC] > (actor.resources.sorceryPoints ?? 0)) return false;
        actor.resources.sorceryPoints -= CUSTO[nivelC];
        sc.slots[nivelC] = (sc.slots[nivelC] ?? 0) + 1;
        actor.bonusUsed = true;
        this.say('recurso', `${actor.name} cria um espaço de ${nivelC}º círculo por ${CUSTO[nivelC]} pontos de feitiçaria (${actor.resources.sorceryPoints}).`);
        return true;
      }
      case 'dragonWings': {
        // ASAS DRACÔNICAS (Linhagem Dracônica, 14º): ação bônus; voo com o deslocamento atual por uma hora. Não cabem sob armadura. Uma vez por descanso longo.
        if (actor.bonusUsed || !(actor.resources?.dragonWings > 0) || hasCondition(actor, 'voando')) return false;
        if (['leve', 'média', 'pesada'].includes(ARMORS[actor.armor ?? 'nenhuma']?.categoria)) return false;
        actor.bonusUsed = true;
        actor.resources.dragonWings -= 1;
        addCondition(actor, 'voando', { rounds: 600, source: actor.id });
        this.say('recurso', `${actor.name} abre asas de dragão: voa por uma hora.`);
        return true;
      }
      case 'draconicPresence': {
        // PRESENÇA DRACÔNICA (Linhagem Dracônica, 18º): ação e 5 pontos; os inimigos a até 18 m testam SAB contra a CD de magia ou ficam
        // enfeitiçados por um minuto (aqui, sem concentração e sem a escolha de amedrontar).
        if (actor.actionUsed || (actor.resources?.sorceryPoints ?? 0) < 5) return false;
        actor.actionUsed = true;
        actor.resources.sorceryPoints -= 5;
        const cdD = spellSaveDc(actor);
        this.say('recurso', `${actor.name} irradia a presença de um dragão (5 pontos, CD ${cdD}).`);
        for (const t of this.combatants) {
          if (t.dead || t.side === actor.side || distanceFt(actor.pos, t.pos) > 60 || !this.field.hasLineOfSight(actor.pos, t.pos)) continue;
          if (this.imuneACondicao(t, 'enfeiticado', actor)) continue;
          const sv = this.resistencia(t, 'wis', cdD, { contra: { magico: true, condicao: 'enfeiticado' } });
          this.explicarResistencia(t, 'wis', cdD, sv, { contra: `Presença Dracônica de ${actor.name}`, seSucesso: 'não se encanta' });
          if (!sv.success) this.aplicarCondicao(t, 'enfeiticado', { rounds: 10, source: actor.id });
        }
        return true;
      }
      case 'vanish': {
        // SUMIR (patrulheiro, 14º): esconder-se como ação bônus. (Não deixar rastro por meios não mágicos não tem onde valer: a luta não rastreia.)
        if (actor.bonusUsed) return false;
        actor.bonusUsed = true;
        this.esconder(actor);
        return true;
      }
      case 'volley': {
        // SARAIVADA (Caçador, 11º): ação; um ataque à distância contra cada criatura numa esfera de 3 m em torno do alvo.
        if (actor.actionUsed || !target || target.dead) return false;
        actor.actionUsed = true;
        this.say('recurso', `${actor.name} dispara uma saraivada em volta de ${target.name}.`);
        for (const t of this.combatants.filter((o) => !o.dead && o.side !== actor.side && distanceFt(o.pos, target.pos) <= 10)) {
          if (!actor.dead) this.resolveAttack(actor, t);
        }
        return true;
      }
      case 'whirlwindAttack': {
        // ATAQUE GIRATÓRIO (Caçador, 11º): ação; um ataque corpo a corpo contra cada criatura ao seu alcance.
        if (actor.actionUsed) return false;
        const vizinhos = this.combatants.filter((o) => !o.dead && o.side !== actor.side && isAdjacent(actor.pos, o.pos));
        if (!vizinhos.length) return false;
        actor.actionUsed = true;
        this.say('recurso', `${actor.name} gira, atacando todos ao redor.`);
        for (const t of vizinhos) if (!actor.dead && !t.dead) this.resolveAttack(actor, t);
        return true;
      }
      case 'hurlThroughHell': {
        // LANÇAR PELO INFERNO (bruxo do Corruptor, 14º): arma o próximo ataque; no acerto, o alvo é arremessado pelos planos
        // inferiores e volta com 10d10 de dano psíquico (corruptores não sofrem). Uma vez por descanso longo. O sumiço até o fim do
        // turno seguinte não é modelado: fica o dano.
        if (!(actor.resources?.hurlThroughHell > 0) || actor.hurlPronto) return false;
        actor.resources.hurlThroughHell -= 1;
        actor.hurlPronto = true;
        this.say('recurso', `${actor.name} abre o inferno no próximo golpe (Lançar pelo Inferno).`);
        return true;
      }
      case 'stillnessOfMind': {
        // QUIETUDE DA MENTE (monge, 7º): ação; encerra em si um efeito que o enfeitiça ou amedronta.
        if (actor.actionUsed) return false;
        const alvoQ = (actor.conditions ?? []).find((k) => k.id === 'amedrontado' || CONDICOES_DE_ENCANTO.includes(k.id));
        if (!alvoQ) return false;
        actor.actionUsed = true;
        removeCondition(actor, alvoQ.id);
        this.say('recurso', `${actor.name} acalma a mente: ${CONDITIONS[alvoQ.id]?.name ?? alvoQ.id} termina.`);
        return true;
      }
      case 'wholenessOfBody': {
        // INTEGRIDADE DO CORPO (Mão Aberta, 6º): ação; recupera 3 × nível de PV. Uma vez por descanso longo.
        if (actor.actionUsed || !(actor.resources?.wholenessOfBody > 0)) return false;
        actor.actionUsed = true;
        actor.resources.wholenessOfBody -= 1;
        const antesW = actor.hp;
        actor.hp = Math.min(maxHpEfetivo(actor), actor.hp + 3 * (actor.level ?? 1));
        this.say('cura', `${actor.name} recompõe o corpo: +${actor.hp - antesW} PV (Integridade do Corpo).`);
        return true;
      }
      case 'emptyBody': {
        // CORPO VAZIO (monge, 18º): ação e 4 de ki; um minuto invisível e resistente a todo dano, menos energético.
        if (actor.actionUsed || !((actor.resources?.ki ?? 0) >= 4) || hasCondition(actor, 'corpoVazio')) return false;
        actor.actionUsed = true;
        actor.resources.ki -= 4;
        addCondition(actor, 'corpoVazio', { rounds: 10, source: actor.id });
        addCondition(actor, 'invisivel', { rounds: 10, source: actor.id, data: { persistente: true } });
        this.say('recurso', `${actor.name} gasta 4 de ki: o corpo some do mundo material (Corpo Vazio).`);
        return true;
      }
      case 'quiveringPalm': {
        // PALMA VIBRANTE (monge, 17º). Armar: 3 de ki, e o próximo golpe desarmado que acerta deixa vibrações no alvo. Encerrar
        // (`modo: 'encerrar'`, ação, no alvo marcado): CON contra a CD de ki; falhou, cai a 0 PV; passou, 10d10 necrótico.
        if (modo === 'encerrar') {
          if (actor.actionUsed || !target || target.dead || target.vibracao?.donoId !== actor.id) return false;
          actor.actionUsed = true;
          const cdV = this.cdDeKi(actor);
          const svV = this.resistencia(target, 'con', cdV);
          this.explicarResistencia(target, 'con', cdV, svV, { contra: `Palma Vibrante de ${actor.name}`, seSucesso: '10d10 necrótico' });
          delete target.vibracao;
          if (svV.success) {
            const dV = damageRoll(this.rng, '10d10');
            this.say('dano', `As vibrações se desfazem em ${target.name}: ${dV.total} necrótico.`);
            this.applyDamage(target, dV.total, 'necrótico', actor, { magico: true });
          } else {
            this.say('dano', `${target.name} estremece por dentro e cai a 0 PV.`);
            this.applyDamage(target, target.hp, 'necrótico', actor, { magico: true });
          }
          return true;
        }
        if (actor.palmaPronta || !((actor.resources?.ki ?? 0) >= 3)) return false;
        actor.resources.ki -= 3;
        actor.palmaPronta = true;
        this.say('recurso', `${actor.name} gasta 3 de ki e arma a Palma Vibrante (${actor.resources.ki} de ki).`);
        return true;
      }
      case 'eldritchMaster': {
        // MESTRE MÍSTICO (bruxo, 20º): um minuto suplicando ao patrono devolve TODOS os espaços de Magia de Pacto. Uma vez por
        // descanso longo, e fora da luta (leva um minuto).
        if (!actor.resources?.eldritchMaster) return false;
        if (!this.over && this.combatants.some((c) => c.side !== actor.side && !c.dead)) return false;
        const sc = actor.spellcasting;
        if (sc?.tipo !== 'pacto' || !sc.slotsMax || sc.slots.every((n, i) => n >= sc.slotsMax[i])) return false;
        sc.slots = sc.slotsMax.slice();
        actor.resources.eldritchMaster -= 1;
        this.say('recurso', `${actor.name} suplica ao patrono por um minuto: todos os espaços de pacto voltam.`);
        return true;
      }
      case 'recklessAttack': {
        // ATAQUE DESCUIDADO é um INTERRUPTOR, de graça: ligado, o primeiro
        // golpe corpo a corpo com Força de cada turno é descuidado
        // (`aplicarDescuidado`), e continua assim nos turnos seguintes até
        // desligar. `modo` 'ligar' ou 'desligar' fixa o estado (a rede repete
        // pedidos); sem modo, inverte. Desligar no meio do turno não desfaz o
        // que já foi feito: a condição segue até o começo do próximo turno.
        if (!actor.features?.includes('recklessAttack')) return false;
        const liga = modo === 'ligar' ? true : modo === 'desligar' ? false : !actor.descuidadoLigado;
        if (liga === Boolean(actor.descuidadoLigado)) return true;
        actor.descuidadoLigado = liga;
        this.say('recurso', liga
          ? `${actor.name} decide atacar sem se proteger daqui em diante.`
          : `${actor.name} volta a se guardar nos ataques.`);
        return true;
      }
      case 'turnUndead': {
        // EXPULSAR MORTOS-VIVOS: ação e uma carga de Canalizar Divindade.
        // Cada morto-vivo a 9 m testa Sabedoria contra a CD de magia do
        // clérigo; quem falha foge por um minuto. Do 5º nível, o que é fraco
        // demais (ND 1/2 ou menos) vira pó na hora.
        if (actor.actionUsed || !actor.resources?.channelDivinity) return false;
        actor.actionUsed = true;
        actor.resources.channelDivinity -= 1;
        const cd = spellSaveDc(actor);
        const destroi = actor.features?.includes('destroyUndead');
        const perto = this.combatants.filter(
          (m) => !m.dead && m.tipo === 'morto-vivo' && !m.traits?.includes('imuneAExpulsar') && distanceFt(actor.pos, m.pos) <= 30,
        );
        this.say('recurso', `${actor.name} ergue o símbolo sagrado (CD ${cd}).`);
        for (const m of perto) {
          // RESISTÊNCIA A EXPULSAR (o vampiro, o lich): vantagem no teste
          const r = this.resistencia(m, 'wis', cd, { vantagem: !!m.traits?.includes('resisteExpulsar') || Livro.comandadoContraExpulsar(this, m) });
          if (r.success) { this.say('resistencia', `${m.name} resiste.`); continue; }
          // o ND mora no BLOCO ('1/2'): a instância não o guarda, e `m.cr ?? 9` nunca destruía ninguém
          if (destroi && crEmNumero(m.cr ?? MONSTERS[m.defId]?.cr ?? 9) <= 0.5) {
            this.say('dano', `${m.name} vira pó.`);
            this.applyDamage(m, m.hp + 10, 'radiante', actor);
            continue;
          }
          addCondition(m, 'amedrontado', { rounds: 10, source: actor.id });
          m.fugindoDe = actor.id;
          this.say('condicao', `${m.name} recua, sem conseguir chegar perto.`);
        }
        if (!perto.length) this.say('recurso', 'Nenhum morto-vivo por perto.');
        return true;
      }
      case 'divineSmite': {
        // DESTRUIÇÃO DIVINA: gasta um espaço e o PRÓXIMO golpe de arma corpo
        // a corpo deste turno leva 2d8 radiantes (+1d8 por círculo acima do
        // primeiro, +1d8 contra morto-vivo). Declarar antes é a única forma
        // honesta num jogo por turnos: o livro deixa decidir depois do
        // acerto, e perguntar a cada golpe pararia a luta.
        const circulo = modo ? Number(modo) : 1;
        const sc = actor.spellcasting;
        if (!sc || !(sc.slots?.[circulo] > 0)) return false;
        if (actor.smitePronto) return false;
        sc.slots[circulo] -= 1;
        actor.smitePronto = circulo;
        this.say('recurso', `${actor.name} carrega o golpe de luz (${circulo}º círculo).`);
        return true;
      }
      // ---- os golpes de ação bônus dos talentos do Livro do Jogador (`golpesDeTalento` diz quando valem) ----
      case 'golpeExtraGWM': case 'golpeDaHaste': case 'bestaDeMaoBonus': case 'empurraoDoEscudo': case 'investidaTalento': case 'agarrarDoBrigao': case 'golpeDaVelocidade': {
        const op = this.golpesDeTalento(actor, target).find((o) => o.id === featureId);
        if (!op || op.motivo || !target || target.dead) return false;
        if (featureId === 'empurraoDoEscudo') return this.empurrarAcao(actor, target, { modo: modo === 'afastar' ? 'afastar' : 'derrubar', bonus: true }).ok;
        if (featureId === 'agarrarDoBrigao') return this.agarrar(actor, target, { bonus: true }).ok;
        if (featureId === 'investidaTalento' && modo === 'empurrar') {
          // O empurrão da Investida: com a reta de 3 m antes, afasta 3 m.
          const reta = actor.retaFinal?.turno === this.turnoKey() && actor.retaFinal.casas >= 2;
          return this.empurrarAcao(actor, target, { modo: 'afastar', bonus: true, pes: reta ? 10 : 5 }).ok;
        }
        const arma = featureId === 'bestaDeMaoBonus' ? 'bestaDeMao'
          : featureId === 'golpeDaHaste' ? actor.acaoDeAtaque.armas[0] : actor.equippedWeapon;
        if (!this.canAttack(actor, target, arma).ok) return false;
        actor.bonusUsed = true;
        if (featureId === 'golpeExtraGWM') actor.golpeExtraEm = null;
        if (featureId === 'golpeDaHaste') {
          // A OUTRA PONTA: d4 de concussão, com o mesmo atributo do golpe principal.
          const w = WEAPONS[arma];
          const salvo = WEAPONS[arma];
          WEAPONS[arma] = { ...w, damage: '1d4', type: 'concussão', name: `${w.name} (outra ponta)` };
          try {
            this.say('recurso', `${actor.name} vira a haste e golpeia com a outra ponta (Mestre em Armas de Haste).`);
            this.resolveAttack(actor, target, { weaponId: arma });
          } finally {
            WEAPONS[arma] = salvo;
          }
          return true;
        }
        const reta = featureId === 'investidaTalento' && actor.retaFinal?.turno === this.turnoKey() && actor.retaFinal.casas >= 2;
        this.say('recurso', featureId === 'golpeExtraGWM' ? `${actor.name} emenda outro golpe (Mestre em Armas Grandes).`
          : featureId === 'bestaDeMaoBonus' ? `${actor.name} dispara a besta de mão (Especialista em Besta).`
            : featureId === 'golpeDaVelocidade' ? `${actor.name} golpeia de novo, rápido demais para o olho (${WEAPONS[arma]?.name ?? 'a lâmina'}).`
              : `${actor.name} chega correndo e golpeia (Investida${reta ? ', +5 de dano' : ''}).`);
        this.resolveAttack(actor, target, { weaponId: arma, investidaTalento: reta });
        return true;
      }
      case 'agarrar':
        return this.agarrar(actor, target).ok;
      case 'empurrar':
        return this.empurrarAcao(actor, target, { modo: modo === 'afastar' ? 'afastar' : 'derrubar' }).ok;
      case 'imobilizar': {
        // AGARRADOR (talento): com a ação, nova disputa contra quem ele já segura; vencendo, os dois ficam contidos.
        if (!temTalento(actor, 'agarrador') || actor.actionUsed || !target || getCondition(target, 'agarrado')?.source !== actor.id) return false;
        actor.actionUsed = true;
        const d = this.disputaDeAtletismo(actor, target);
        if (d.venceu) {
          addCondition(target, 'contido', { rounds: Infinity, source: actor.id, data: { escape: 10 + skillBonus(actor, 'atletismo'), disputa: true } });
          addCondition(actor, 'contido', { rounds: Infinity, source: actor.id, data: { imobiliza: target.id } });
          this.say('condicao', `${actor.name} imobiliza ${target.name}: os dois ficam contidos (Agarrador).`, d.conta);
        } else this.say('acao', `${actor.name} tenta imobilizar ${target.name}, que se debate e não cede.`, d.conta);
        this.afterAction(actor);
        return true;
      }
      case 'twoWeaponFighting': {
        // DUAS ARMAS. Não existia no motor: o estilo que o guerreiro escolhia
        // não tinha o que modificar. Aqui está a ação em si — golpe de ação
        // bônus com a arma da outra mão, as duas LEVES —, e o estilo entra no
        // dano, em `resolveAttack`.
        const outra = actor.offhandWeapon;
        const principal = WEAPONS[actor.equippedWeapon];
        const secundaria = WEAPONS[outra];
        if (actor.bonusUsed || !actor.actionUsed || !secundaria || !principal) return false;
        const leve = (w) => (w.props ?? []).includes('leve');
        // COMBATENTE COM DUAS ARMAS (talento): qualquer arma de uma mão de perto serve, leve ou não.
        const umaMao = (w) => !w.ranged && !(w.props ?? []).includes('duas mãos');
        const duasPeloTalento = temTalento(actor, 'combatenteComDuasArmas') && umaMao(principal) && umaMao(secundaria);
        if (!duasPeloTalento && (!leve(principal) || !leve(secundaria))) return false;
        if (!target || target.dead || !isAdjacent(actor.pos, target.pos)) return false;
        actor.bonusUsed = true;
        this.say('recurso', `${actor.name} golpeia com a ${secundaria.name.toLowerCase()} da outra mão.`);
        this.resolveAttack(actor, target, { weaponId: outra, maoSecundaria: true });
        return true;
      }
      case 'martialArts': {
        // ARTES MARCIAIS, a parte de ação bônus: depois de ATACAR com o punho
        // ou com arma de monge, um golpe desarmado a mais. É o que dobra o
        // dano do monge no turno, e é por isso que a ação de Atacar tem de
        // ter acontecido antes.
        if (actor.bonusUsed || !actor.actionUsed) return false;
        if (!actor.dadoDeArtesMarciais) return false;
        if (!actor.atacouDeMonge) return false;
        if (!target || target.dead || !isAdjacent(actor.pos, target.pos)) return false;
        actor.bonusUsed = true;
        this.say('recurso', `${actor.name} emenda um golpe desarmado.`);
        this.resolveAttack(actor, target, { weaponId: 'punhos' });
        return true;
      }
      case 'rage': {
        // FÚRIA: ação bônus, uma carga, um minuto (dez rodadas). O bárbaro
        // que não luta sai dela — a condição de fim está em `fimDaFuria`,
        // conferida no começo de cada turno dele.
        if (actor.bonusUsed || !actor.resources?.rage) return false;
        if (hasCondition(actor, 'furia')) return false;
        // O SRD não deixa entrar em fúria de armadura pesada.
        if (ARMORS[actor.armor]?.categoria === 'pesada') return false;
        actor.bonusUsed = true;
        actor.resources.rage -= 1;
        addCondition(actor, 'furia', { rounds: 10, quando: 'fim' });
        // Entrar em fúria já conta como "fez alguma coisa" na rodada: senão
        // ela acabaria no começo do turno seguinte, antes do primeiro golpe.
        actor.furiaAgiu = true;
        // A concentração não sobrevive à fúria.
        if (actor.concentrating) this.dropConcentration(actor);
        actor.focoFanaticoUsado = false;
        this.say('recurso', `${actor.name} entra em FÚRIA.`);
        // AURA DA TEMPESTADE (Arauto da Tempestade): dispara ao entrar em Fúria.
        Sub.aurasDaTempestade(this, actor, target);
        // TASHA: a FORMA DA FERA (a arma natural escolhida), o CHAMADO DA CAÇADA e o SURTO SELVAGEM
        Sub.formaDaFera(this, actor, modo);
        Sub.chamadoDaCaca(this, actor);
        Sub.surtoDoBarbaro(this, actor);
        // CUTELO ELEMENTAL (Caminho do Gigante)
        Sub.cuteloAoEntrarEmFuria(this, actor);
        return true;
      }
      case 'cunningAction': {
        // Ação Ardilosa: UMA de Disparada ou Desengajar como ação bônus (o SRD
        // dá também Esconder-se, que o motor ainda não tem).
        if (actor.bonusUsed) return false;
        if (modo !== 'disparada' && modo !== 'desengajar' && modo !== 'esconder') return false;
        if (modo === 'esconder') {
          actor.bonusUsed = true;
          this.esconder(actor);
          return true;
        }
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
          .filter((a) => !a.dead && a.hp < maxHpEfetivo(a) && distanceFt(actor.pos, a.pos) <= 30)
          .sort((a, b) => a.hp / maxHpEfetivo(a) - b.hp / maxHpEfetivo(b));
        this.say('recurso', `${actor.name} canaliza Preservar a Vida (${pool} PV para dividir).`);
        for (const a of wounded) {
          if (pool <= 0) break;
          const cap = Math.floor(maxHpEfetivo(a) / 2); // não pode passar da metade dos PV máximos
          const want = Math.min(pool, Math.max(0, cap - a.hp), maxHpEfetivo(a) - a.hp);
          if (want <= 0) continue;
          pool -= want;
          this.heal(a, want, actor);
        }
        this.afterAction(actor);
        return true;
      }
      case 'flurryOfBlows': {
        // RAJADA DE GOLPES: 1 ki na ação bônus, depois de ATACAR, por DOIS
        // golpes desarmados. É a Artes Marciais paga: um golpe a mais pelo
        // ponto de ki, e por isso as duas não podem sair no mesmo turno.
        if (actor.bonusUsed || !actor.actionUsed) return false;
        if (!actor.atacouDeMonge || !(actor.resources?.ki > 0)) return false;
        if (!target || target.dead || !isAdjacent(actor.pos, target.pos)) return false;
        actor.bonusUsed = true;
        actor.resources.ki -= 1;
        this.say('recurso', `${actor.name} gasta 1 ki: Rajada de Golpes (${actor.resources.ki} de ki).`);
        // TÉCNICA DA MÃO ABERTA (3º): cada golpe que ACERTA impõe uma de três coisas, à escolha do monge (`modo`):
        // 'derrubar' (DES, senão cai), 'empurrar' (FOR, senão 4,5 m para longe) ou 'semReacao' (sem reações até o fim do
        // próximo turno dele). A CD é a do ki. Sem escolha, derruba.
        const tecnica = actor.features?.includes('openHandTechnique') ? (['empurrar', 'semReacao'].includes(modo) ? modo : 'derrubar') : null;
        const golpe = (alvo = target) => {
          const r = this.resolveAttack(actor, alvo, { weaponId: 'punhos' });
          if (tecnica && r?.hit && !alvo.dead) this.tecnicaDaMaoAberta(actor, alvo, tecnica);
        };
        // FRENESI EMBRIAGADO (Mestre Bêbado, 17º): até cinco golpes, cada um numa criatura diferente.
        // RAJADA DE CURA (Misericórdia): um golpe (ou os dois, no 11º) vira cura, sem ki.
        const golpesDaRajada = Sub.rajadaDeCura(this, actor, modo) ?? 2;
        const frenesi = Sub.alvosDaRajada(this, actor, target);
        actor.naRajada = true;
        try {
          if (frenesi && golpesDaRajada === 2) for (const a of frenesi) { if (!a.dead) golpe(a); }
          else for (let i = 0; i < golpesDaRajada && !target.dead; i++) golpe();
        } finally { actor.naRajada = false; }
        // TÉCNICA DO BÊBADO (Mestre Bêbado, 3º): Desengajar e +3 m.
        Sub.tecnicaDoBebado(this, actor);
        return true;
      }
      case 'patientDefense': {
        // DEFESA PACIENTE: 1 ki na ação bônus para Esquivar.
        if (actor.bonusUsed || !(actor.resources?.ki > 0)) return false;
        if (hasCondition(actor, 'esquivando')) return false;
        actor.bonusUsed = true;
        actor.resources.ki -= 1;
        addCondition(actor, 'esquivando', { rounds: 1, quando: 'inicio', lado: actor.side });
        this.say('recurso', `${actor.name} gasta 1 ki: Defesa Paciente (${actor.resources.ki} de ki).`);
        return true;
      }
      case 'eagleSpirit': {
        // ESPÍRITO DA ÁGUIA: em Fúria, Disparada como ação bônus.
        if (actor.bonusUsed || !hasCondition(actor, 'furia')) return false;
        actor.bonusUsed = true;
        actor.movementLeftFt += this.speedOf(actor);
        this.say('recurso', `${actor.name} corre como a águia (Espírito da Águia).`);
        return true;
      }
      case 'stepOfTheWind': {
        // PASSO DO VENTO: 1 ki na ação bônus, Disparada OU Desengajar. (O
        // salto dobrado do livro não tem o que modificar: o motor não pula.)
        if (actor.bonusUsed || !(actor.resources?.ki > 0)) return false;
        if (modo !== 'disparada' && modo !== 'desengajar') return false;
        actor.bonusUsed = true;
        actor.resources.ki -= 1;
        // ASAS DESDOBRADAS (Dragão Ascendente, 6º)
        Sub.asasDesdobradas(this, actor);
        if (modo === 'disparada') {
          actor.movementLeftFt += this.speedOf(actor);
          this.say('recurso', `${actor.name} gasta 1 ki: Passo do Vento, e corre (${actor.resources.ki} de ki).`);
        } else {
          actor.disengaging = true;
          this.say('recurso', `${actor.name} gasta 1 ki: Passo do Vento, e desengaja (${actor.resources.ki} de ki).`);
        }
        return true;
      }
      case 'stunningStrike': {
        // ATAQUE ATORDOANTE: carrega o golpe por 1 ki. O efeito mora no
        // acerto, em `resolveAttack`; aqui só se paga e se arma.
        if (!(actor.resources?.ki > 0) || actor.atordoantePronto) return false;
        actor.resources.ki -= 1;
        actor.atordoantePronto = true;
        this.say('recurso', `${actor.name} gasta 1 ki e arma o Ataque Atordoante (${actor.resources.ki} de ki).`);
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
    const comProficiencia = saveBonus(actor, atributo);
    const base = abilityMod(actor.abilities[atributo]);
    // As parcelas que a própria rolagem somou (Aura de Proteção, bênção, Lentidão...) entram na conta: sem elas o total
    // na tela não bate com o bônus mostrado.
    const extras = save.partes ?? [];
    const bonus = comProficiencia + extras.reduce((s, p) => s + p.valor, 0);
    const bonusPartes = [{ rotulo: ABILITY_NAME[atributo], valor: base }];
    if (comProficiencia !== base) bonusPartes.push({ rotulo: 'proficiência', valor: comProficiencia - base });
    bonusPartes.push(...extras);

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
      vantagemPor: save.vantagemPor ?? [],
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
