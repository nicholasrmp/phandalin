// SRD 5.1 (CC-BY-4.0) — ver NOTICE.md
// Armas, armaduras e o resto da mochila.

// A fórmula do modificador e do bônus de proficiência vêm de `abilities.js`
// para não existirem duas vezes: `armorClass` nasceu com a conta copiada, e
// uma segunda cópia na ficha é como o número da tela começa a divergir do
// número que o motor usa.
import { abilityMod, proficiencyBonus } from './abilities.js';

export const WEAPONS = {
  espadaLonga: {
    id: 'espadaLonga', name: 'Espada longa', damage: '1d8', type: 'cortante',
    ability: 'str', reachFt: 5, props: ['versátil'], art: 'sword',
  },
  espadaCurta: {
    id: 'espadaCurta', name: 'Espada curta', damage: '1d6', type: 'perfurante',
    ability: 'str', finesse: true, reachFt: 5, props: ['acuidade', 'leve'], art: 'sword',
  },
  adaga: {
    id: 'adaga', name: 'Adaga', damage: '1d4', type: 'perfurante',
    ability: 'str', finesse: true, reachFt: 5, rangeFt: 20, props: ['acuidade', 'leve', 'arremesso'], art: 'dagger',
  },
  maca: {
    id: 'maca', name: 'Maça', damage: '1d6', type: 'concussão',
    ability: 'str', reachFt: 5, props: [], art: 'mace',
  },
  bordao: {
    id: 'bordao', name: 'Bordão', damage: '1d6', type: 'concussão',
    ability: 'str', reachFt: 5, props: ['versátil'], art: 'staff',
  },
  arcoCurto: {
    id: 'arcoCurto', name: 'Arco curto', damage: '1d6', type: 'perfurante',
    ability: 'dex', ranged: true, rangeFt: 80, longRangeFt: 320, props: ['munição', 'duas mãos'], art: 'bow',
  },
  bestaLeve: {
    id: 'bestaLeve', name: 'Besta leve', damage: '1d8', type: 'perfurante',
    ability: 'dex', ranged: true, rangeFt: 80, longRangeFt: 320, props: ['munição', 'recarga'], art: 'bow',
  },
};

export const ARMORS = {
  nenhuma: { id: 'nenhuma', name: 'Sem armadura', base: 10, dexCap: Infinity, art: null },
  couro: { id: 'couro', name: 'Couro', base: 11, dexCap: Infinity, art: 'leather' },
  couroBatido: { id: 'couroBatido', name: 'Couro batido', base: 12, dexCap: Infinity, art: 'leather' },
  brunea: { id: 'brunea', name: 'Brunea', base: 14, dexCap: 2, art: 'scale' },
  cotaDeMalha: { id: 'cotaDeMalha', name: 'Cota de malha', base: 16, dexCap: 0, art: 'plate' },
};

export const SHIELD_AC = 2;

/** CA = base da armadura + DEX (limitado) + escudo + bônus diversos. */
export function armorClass(actor) {
  const armor = ARMORS[actor.armor ?? 'nenhuma'] ?? ARMORS.nenhuma;
  const dex = Math.floor((actor.abilities.dex - 10) / 2);
  let ac = armor.base + Math.min(dex, armor.dexCap);
  if (actor.shield) ac += SHIELD_AC;
  // `acBonusArmadura` é o Estilo de Luta: Defesa, que a própria ficha descreve
  // como "+1 enquanto estiver de armadura". Enquanto nada podia desequipar,
  // somar sempre dava no mesmo; com o inventário dá para tirar a cota da
  // guerreira e ela ficaria com CA 11 em vez de 10, errado em todo ataque
  // contra ela. `acBonus` continua sendo o bônus que vale sempre (anel, magia).
  const comArmadura = (actor.armor ?? 'nenhuma') !== 'nenhuma';
  ac += actor.acBonus ?? 0;
  if (comArmadura) ac += actor.acBonusArmadura ?? 0;
  return ac;
}

/** Modificador usado por uma arma: acuidade escolhe o melhor entre FOR e DES. */
export function weaponAbility(actor, weapon) {
  if (weapon.ranged) return 'dex';
  if (!weapon.finesse) return weapon.ability;
  const str = actor.abilities.str;
  const dex = actor.abilities.dex;
  return dex > str ? 'dex' : 'str';
}

// ---------------------------------------------------------------- itens ----
//
// POR QUE O CATÁLOGO CRESCEU
// WEAPONS e ARMORS cobrem só o que o motor de combate lê. A mochila precisa do
// resto: sem poção, corda e tocha, a aba de inventário é uma vitrine de dois
// objetos e o jogador não tem nada para decidir. Nada daqui para baixo é lido
// pelo motor — é catálogo e contabilidade de ficha, e por isso pode crescer
// sem risco para o combate.

export const ITEMS = {
  pocaoDeCura: {
    id: 'pocaoDeCura', name: 'Poção de cura', tipo: 'poção', art: 'cura',
    pilha: true, peso: 0.5, efeito: '2d4+2',
    desc: 'Uma ação para beber: recupera 2d4+2 pontos de vida.',
  },
  kitDeCura: {
    id: 'kitDeCura', name: 'Kit de cura', tipo: 'ferramenta', art: 'estabilizar',
    pilha: false, peso: 3, usos: 10,
    desc: 'Dez usos. Estabiliza quem está morrendo sem precisar do teste de Medicina.',
  },
  tocha: {
    id: 'tocha', name: 'Tocha', tipo: 'utilidade', art: 'fogo',
    pilha: true, peso: 1,
    desc: 'Luz plena em 6 m e penumbra em outros 6 m, por uma hora.',
  },
  corda: {
    id: 'corda', name: 'Corda de cânhamo', tipo: 'utilidade', art: 'corda',
    pilha: false, peso: 10,
    desc: 'Quinze metros. Serve para descer um poço e para amarrar prisioneiro.',
  },
  racoes: {
    id: 'racoes', name: 'Rações de viagem', tipo: 'utilidade', art: 'racoes',
    pilha: true, peso: 2,
    desc: 'Um dia de comida seca por unidade.',
  },
  moedaDeOuro: {
    id: 'moedaDeOuro', name: 'Peças de ouro', tipo: 'moeda', art: 'moeda',
    pilha: true, peso: 0.02,
    desc: 'O que sobrou depois de comprar o equipamento inicial.',
  },
};

/**
 * O escudo não entra em ARMORS porque não é armadura: ele ocupa UMA MÃO, e é
 * essa a regra que o inventário tem de poder recusar.
 */
export const SHIELD = {
  id: 'escudo', name: 'Escudo', tipo: 'escudo', art: 'escudo',
  ac: SHIELD_AC, peso: 6,
  desc: '+2 de CA. Ocupa uma das mãos, então não combina com arma de duas mãos.',
};

/** Os quatro encaixes do boneco de equipamento, na ordem em que aparecem. */
export const SLOTS = [
  { id: 'maoPrincipal', name: 'Mão principal', aceita: 'arma' },
  { id: 'maoSecundaria', name: 'Mão secundária', aceita: 'arma' },
  { id: 'armadura', name: 'Armadura', aceita: 'armadura' },
  { id: 'escudo', name: 'Escudo', aceita: 'escudo' },
];

/** Resolve um id contra os quatro catálogos. Devolve null se não existir. */
export function itemDeId(id) {
  if (!id) return null;
  if (WEAPONS[id]) return { tipo: 'arma', dados: WEAPONS[id] };
  if (ARMORS[id]) return { tipo: 'armadura', dados: ARMORS[id] };
  if (id === SHIELD.id) return { tipo: 'escudo', dados: SHIELD };
  if (ITEMS[id]) return { tipo: 'item', dados: ITEMS[id] };
  return null;
}

export const nomeDeId = (id) => itemDeId(id)?.dados.name ?? '—';

const duasMaos = (id) => Boolean(WEAPONS[id]?.props?.includes('duas mãos'));
const leve = (id) => Boolean(WEAPONS[id]?.props?.includes('leve'));

/** O que está em cada encaixe agora. `null` é encaixe vazio. */
export function noEncaixe(actor, slot) {
  if (slot === 'maoPrincipal') return actor.equippedWeapon ?? null;
  if (slot === 'maoSecundaria') return actor.offhandWeapon ?? null;
  if (slot === 'armadura') return actor.armor ?? 'nenhuma';
  if (slot === 'escudo') return actor.shield ? SHIELD.id : null;
  return null;
}

/**
 * A CA com a conta ABERTA.
 *
 * O total não é somado aqui de novo: sai de `armorClass()`. Duas contas da
 * mesma CA viram duas CAs diferentes no dia em que uma das duas mudar, e a
 * ficha mostrar um número enquanto o motor usa outro é o pior defeito possível
 * numa tela que existe para explicar o número.
 */
export function acBreakdown(actor) {
  const armor = ARMORS[actor.armor ?? 'nenhuma'] ?? ARMORS.nenhuma;
  const dex = abilityMod(actor.abilities.dex);
  const dexUsada = Math.min(dex, armor.dexCap);
  const escudo = actor.shield ? SHIELD_AC : 0;
  const comArmadura = (actor.armor ?? 'nenhuma') !== 'nenhuma';
  const bonusSempre = actor.acBonus ?? 0;
  const bonusArmadura = comArmadura ? (actor.acBonusArmadura ?? 0) : 0;
  const bonus = bonusSempre + bonusArmadura;

  const partes = [
    { rotulo: armor.name, valor: armor.base, nota: 'base da armadura' },
    {
      rotulo: 'Destreza',
      valor: dexUsada,
      nota: armor.dexCap === Infinity
        ? 'sem limite'
        : dex > armor.dexCap
          ? `limite ${armor.dexCap} — seu modificador é ${dex >= 0 ? '+' : ''}${dex}`
          : `limite ${armor.dexCap}`,
    },
  ];
  if (escudo) partes.push({ rotulo: 'Escudo', valor: escudo, nota: 'na mão secundária' });
  if (bonusSempre) partes.push({ rotulo: 'Bônus', valor: bonusSempre, nota: 'magia ou item' });
  // Separado do outro porque some quando a armadura sai, e o painel existe
  // justamente para mostrar a conta certa.
  if (bonusArmadura) partes.push({ rotulo: 'Estilo de luta', valor: bonusArmadura, nota: 'enquanto estiver de armadura' });
  if (!comArmadura && (actor.acBonusArmadura ?? 0)) {
    partes.push({ rotulo: 'Estilo de luta', valor: 0, nota: 'inativo: exige armadura' });
  }

  return { armadura: armor, dex, dexCap: armor.dexCap, dexUsada, escudo, bonus, partes, total: armorClass(actor) };
}

/**
 * O que uma arma DÁ, sem precisar de um encontro aberto.
 *
 * `combat.js` faz esta conta em `weaponAttackProfile`, mas só com o encontro
 * na mão. A ficha abre fora do combate: repetir a fórmula aqui é o preço de
 * não arrastar o motor para dentro da interface.
 */
export function weaponLine(actor, weaponId) {
  const w = WEAPONS[weaponId];
  if (!w) return null;
  const ability = weaponAbility(actor, w);
  const mod = abilityMod(actor.abilities[ability]);
  const prof = actor.proficiency ?? proficiencyBonus(actor.level ?? 1);
  return {
    arma: w,
    ability,
    mod,
    bonus: mod + prof,
    dano: `${w.damage}${mod >= 0 ? '+' : ''}${mod}`,
    alcanceFt: w.ranged ? w.rangeFt : (w.reachFt ?? 5),
    ranged: !!w.ranged,
    duasMaos: duasMaos(weaponId),
  };
}

/**
 * Os três campos do look que o equipamento manda (ver `art/looks/party.js`).
 * É isto que faz trocar de armadura mudar o boneco: o pintor lê `armorStyle`,
 * `weapon` e `shield` e não sabe nada sobre inventário.
 */
export function aparenciaDe(actor) {
  const armor = ARMORS[actor.armor ?? 'nenhuma'] ?? ARMORS.nenhuma;
  const arma = WEAPONS[actor.equippedWeapon] ?? null;
  return { armorStyle: armor.art ?? 'robe', weapon: arma?.art ?? null, shield: !!actor.shield };
}

// ---- treino em armadura ---------------------------------------------------

const CATEGORIA_ARMADURA = {
  nenhuma: 'nenhuma', couro: 'leve', couroBatido: 'leve', brunea: 'média', cotaDeMalha: 'pesada',
};

// Treino por classe. Fica aqui, e não em `party.js`, porque quem precisa dele
// é o inventário: a ficha AVISA sem impedir, e é justamente vestir cota de
// malha no mago que demonstra a CA e o boneco mudando na mesma troca.
const TREINO_POR_CLASSE = {
  Guerreira: ['leve', 'média', 'pesada'], Guerreiro: ['leve', 'média', 'pesada'],
  Clérigo: ['leve', 'média'], Clériga: ['leve', 'média'],
  Ladino: ['leve'], Ladina: ['leve'],
  Mago: [], Maga: [],
};

export function treinoEmArmadura(actor) {
  return actor.armorTraining ?? TREINO_POR_CLASSE[actor.className] ?? ['leve', 'média', 'pesada'];
}

/** Aviso, não proibição: diz o preço de vestir uma armadura sem treino. */
/**
 * Marca no combatente se ele está de armadura sem treino.
 *
 * O aviso existia e prometia um preço que ninguém cobrava: o mago podia vestir
 * cota de malha e ir de CA 12 para 16 de graça. Enquanto nada desequipava, a
 * promessa nunca era testada; o inventário novo a testa.
 */
export function marcarTreinoDeArmadura(actor) {
  actor.armorUntrained = Boolean(avisoDeArmadura(actor, actor.armor ?? 'nenhuma'));
  return actor.armorUntrained;
}

export function avisoDeArmadura(actor, armorId) {
  const cat = CATEGORIA_ARMADURA[armorId] ?? 'nenhuma';
  if (cat === 'nenhuma') return null;
  if (treinoEmArmadura(actor).includes(cat)) return null;
  return `${actor.className} não tem treino em armadura ${cat}: desvantagem em ataques, testes e resistências de Força e Destreza, e nada de conjurar.`;
}

// ---- mochila --------------------------------------------------------------

// Uma armadura de reserva por personagem, escolhida para CONTRASTAR com a que
// ele já veste. Com duas armaduras parecidas o recurso não aparece: é saindo
// de pesada para leve, ou o contrário, que o jogador vê a CA e o boneco
// mudarem na mesma troca.
const RESERVA_DE_ARMADURA = {
  nenhuma: 'brunea', couro: 'brunea', couroBatido: 'brunea',
  brunea: 'cotaDeMalha', cotaDeMalha: 'couro',
};

function bagInicial(actor) {
  const bag = [];
  const reserva = RESERVA_DE_ARMADURA[actor.armor ?? 'nenhuma'];
  if (reserva && reserva !== actor.armor) bag.push({ id: reserva, tipo: 'armadura', qtd: 1 });
  bag.push({ id: 'pocaoDeCura', tipo: 'item', qtd: 2 });
  bag.push({ id: 'tocha', tipo: 'item', qtd: 2 });
  bag.push({ id: 'racoes', tipo: 'item', qtd: 3 });
  // Quem tem a perícia é quem carrega a ferramenta dela: o kit de cura na mão
  // de quem não sabe Medicina é peso morto.
  if (actor.skills?.includes('medicina')) bag.push({ id: 'kitDeCura', tipo: 'item', qtd: 1 });
  if (actor.skills?.includes('furtividade')) bag.push({ id: 'corda', tipo: 'item', qtd: 1 });
  bag.push({ id: 'moedaDeOuro', tipo: 'item', qtd: 12 + (actor.level ?? 1) * 3 });
  return bag;
}

/**
 * Garante `bag` e `offhandWeapon`. É preguiçoso de propósito: `party.js` não é
 * nosso e o motor nunca precisou destes dois campos — quem abre a ficha é quem
 * paga por eles.
 */
export function garantirInventario(actor) {
  if (!actor.bag) actor.bag = bagInicial(actor);
  if (actor.offhandWeapon === undefined) actor.offhandWeapon = null;
  return actor;
}

/**
 * O que a grade mostra.
 *
 * As armas NÃO saem de `actor.weapons` ao serem guardadas: a barra de ações e
 * a IA leem essa lista, e encolhê-la por causa de um encaixe apagaria da barra
 * uma arma que o personagem tem. Aqui, arma guardada é só arma que não está em
 * nenhuma das duas mãos.
 */
export function conteudoDaMochila(actor) {
  garantirInventario(actor);
  const nasMaos = [noEncaixe(actor, 'maoPrincipal'), noEncaixe(actor, 'maoSecundaria')];
  const armas = (actor.weapons ?? [])
    .filter((id) => !nasMaos.includes(id))
    .map((id) => ({ id, tipo: 'arma', qtd: 1 }));
  return [...armas, ...actor.bag];
}

/** Por que um item não pode entrar num encaixe. `null` = pode. */
export function motivoParaRecusar(actor, slot, id) {
  if (slot === 'maoPrincipal') {
    if (!id) return 'a mão principal não fica vazia: o motor usa essa arma como ataque padrão';
    if (!WEAPONS[id]) return `${nomeDeId(id)} não é arma`;
    if (duasMaos(id) && actor.shield) return `${nomeDeId(id)} é de duas mãos: guarde o escudo primeiro`;
    const sec = noEncaixe(actor, 'maoSecundaria');
    if (duasMaos(id) && sec && sec !== id) return `${nomeDeId(id)} é de duas mãos: a mão secundária tem de estar livre`;
    return null;
  }
  if (slot === 'maoSecundaria') {
    if (!id) return null;
    if (!WEAPONS[id]) return `${nomeDeId(id)} não é arma`;
    if (actor.shield) return 'a mão secundária está com o escudo';
    if (duasMaos(noEncaixe(actor, 'maoPrincipal'))) return 'a mão principal já usa as duas mãos';
    if (!leve(id)) return `${nomeDeId(id)} não é leve: só arma leve vai na mão secundária`;
    if (id === noEncaixe(actor, 'maoPrincipal')) return 'essa arma já está na mão principal';
    return null;
  }
  if (slot === 'armadura') {
    if (!id || id === 'nenhuma') return null;
    if (!ARMORS[id]) return `${nomeDeId(id)} não é armadura`;
    return null;
  }
  if (slot === 'escudo') {
    if (!id) return null;
    if (id !== SHIELD.id) return `${nomeDeId(id)} não é escudo`;
    const principal = noEncaixe(actor, 'maoPrincipal');
    if (duasMaos(principal)) return `${nomeDeId(principal)} usa as duas mãos`;
    if (noEncaixe(actor, 'maoSecundaria')) return 'a mão secundária está com uma arma';
    return null;
  }
  return `encaixe desconhecido: ${slot}`;
}

/** O que o jogador pode escolher para um encaixe, já filtrado pelas regras. */
export function candidatosPara(actor, slot) {
  garantirInventario(actor);
  const atual = noEncaixe(actor, slot);
  const lista = [];
  const permite = (id) => !motivoParaRecusar(actor, slot, id) && id !== atual;

  if (slot === 'maoPrincipal' || slot === 'maoSecundaria') {
    for (const id of actor.weapons ?? []) if (permite(id)) lista.push(id);
    if (slot === 'maoSecundaria' && atual) lista.unshift(null);
  } else if (slot === 'armadura') {
    if (atual !== 'nenhuma') lista.push('nenhuma');
    for (const e of actor.bag) if (e.tipo === 'armadura' && permite(e.id)) lista.push(e.id);
  } else if (slot === 'escudo') {
    if (atual) lista.push(null);
    else if (actor.bag.some((e) => e.id === SHIELD.id) && permite(SHIELD.id)) lista.push(SHIELD.id);
  }
  return lista;
}

function tirarDaBag(actor, id) {
  const i = actor.bag.findIndex((e) => e.id === id);
  if (i < 0) return false;
  if (actor.bag[i].qtd > 1) actor.bag[i].qtd -= 1;
  else actor.bag.splice(i, 1);
  return true;
}

function porNaBag(actor, id, tipo) {
  const e = actor.bag.find((x) => x.id === id);
  if (e && itemDeId(id)?.dados.pilha) e.qtd += 1;
  else actor.bag.push({ id, tipo, qtd: 1 });
}

/**
 * Troca o conteúdo de um encaixe. É a única porta de entrada, e recalcula a CA
 * aqui mesmo: `actor.ac` é o que o motor lê a cada ataque, e uma CA velha
 * depois de vestir cota de malha é defeito de regra, não de tela.
 *
 * @returns {{ok: boolean, why?: string, slot?: string, de?: string|null,
 *            para?: string|null, acAntes?: number, acDepois?: number}}
 */
export function equipar(actor, slot, id) {
  garantirInventario(actor);
  const motivo = motivoParaRecusar(actor, slot, id);
  if (motivo) return { ok: false, why: motivo };

  const de = noEncaixe(actor, slot);
  const acAntes = armorClass(actor);

  if (slot === 'maoPrincipal') {
    // Escolher a arma que já está na outra mão não guarda nada: troca as mãos.
    if (id === noEncaixe(actor, 'maoSecundaria')) actor.offhandWeapon = de;
    actor.equippedWeapon = id;
  } else if (slot === 'maoSecundaria') {
    actor.offhandWeapon = id ?? null;
  } else if (slot === 'armadura') {
    const nova = id ?? 'nenhuma';
    if (nova !== 'nenhuma' && !tirarDaBag(actor, nova)) return { ok: false, why: `${nomeDeId(nova)} não está na mochila` };
    if (de && de !== 'nenhuma') porNaBag(actor, de, 'armadura');
    actor.armor = nova;
  } else if (slot === 'escudo') {
    if (id) {
      if (!tirarDaBag(actor, SHIELD.id)) return { ok: false, why: 'o escudo não está na mochila' };
      actor.shield = true;
    } else {
      actor.shield = false;
      porNaBag(actor, SHIELD.id, 'escudo');
    }
  }

  actor.ac = armorClass(actor);
  marcarTreinoDeArmadura(actor);
  return { ok: true, slot, de, para: id ?? null, acAntes, acDepois: actor.ac, semTreino: actor.armorUntrained };
}

/** Peso carregado, em libras. Capacidade = 15 × Força, como no SRD. */
export function cargaDe(actor) {
  garantirInventario(actor);
  let peso = 0;
  for (const e of conteudoDaMochila(actor)) peso += (itemDeId(e.id)?.dados.peso ?? 0) * e.qtd;
  for (const s of SLOTS) {
    const id = noEncaixe(actor, s.id);
    if (id && id !== 'nenhuma') peso += itemDeId(id)?.dados.peso ?? 0;
  }
  return { peso: Math.round(peso * 10) / 10, capacidade: actor.abilities.str * 15 };
}
