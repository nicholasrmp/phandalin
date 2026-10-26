// Bestiário: o registro de todas as criaturas, montado a partir das famílias.
//
// Está dividido por família para que o elenco cresça sem um arquivo gigante, e
// para que dê para mexer nos mortos-vivos sem encostar nos goblinoides.
// Cada família traz suas criaturas e, se precisar, seus traços novos.
//
// SRD 5.1 (CC-BY-4.0) — ver NOTICE.md e ELENCO.md.

import { proficiencyBonus } from './abilities.js';
import { footprintOf } from '../core/grid.js';
import { GOBLINOIDES, TRAITS as T_GOB } from './monsters/goblinoides.js';
import { HUMANOIDES, TRAITS as T_HUM } from './monsters/humanoides.js';
import { FERAS, TRAITS as T_FER } from './monsters/feras.js';
import { MORTOS_VIVOS, TRAITS as T_MOR } from './monsters/mortosvivos.js';
import { ABERRACOES, TRAITS as T_ABE } from './monsters/aberracoes.js';
import { DANOS_FISICOS } from './tipos-de-dano.js';

export const MONSTERS = {
  ...GOBLINOIDES,
  ...HUMANOIDES,
  ...FERAS,
  ...MORTOS_VIVOS,
  ...ABERRACOES,
};

// Os tres fisicos vem de `tipos-de-dano.js`: era uma copia local, e copia de
// vocabulario e como a divergencia que custou a Furia comecou.
const FISICOS = DANOS_FISICOS;

// Tipo de criatura pela família, quando o bloco não diz. Regra precisa dele:
// Sono não pega morto-vivo, cura não funciona em constructo.
const TIPO_DA_FAMILIA = new Map([
  ...Object.keys(GOBLINOIDES).map((id) => [id, 'humanoide']),
  ...Object.keys(HUMANOIDES).map((id) => [id, 'humanoide']),
  ...Object.keys(FERAS).map((id) => [id, 'fera']),
  ...Object.keys(MORTOS_VIVOS).map((id) => [id, 'morto-vivo']),
  // Aberrações: o tipo vem escrito em cada bloco (grick é monstruosidade, dragão é dragão...).
]);


const TRACOS_BASE = {
  nimbleEscape: { name: 'Escapada Ágil', desc: 'Desengajar ou Esconder-se como ação bônus.' },
  packTactics: { name: 'Táticas de Matilha', desc: 'Vantagem no ataque se um aliado estiver a até 1,5 m do alvo.' },
  redirectAttack: { name: 'Redirecionar Ataque', desc: 'Reação: troca de lugar com um goblin adjacente e o ataque passa a mirá-lo.' },
  martialAdvantage: { name: 'Vantagem Marcial', desc: 'Uma vez por turno, +2d6 de dano se um aliado não incapacitado estiver a até 1,5 m do alvo.' },
};

export const TRAIT_INFO = { ...TRACOS_BASE, ...T_GOB, ...T_HUM, ...T_FER, ...T_MOR, ...T_ABE };

let serial = 0;

/** Instancia um monstro como combatente. */
export function makeMonster(id, pos, { rng = null, nameSuffix = '' } = {}) {
  const def = MONSTERS[id];
  if (!def) throw new Error(`Monstro desconhecido: "${id}"`);
  // PV podem ser fixos (médio do SRD) ou rolados, se vier um rng.
  const maxHp = def.maxHp;
  return {
    id: `${id}-${++serial}`,
    defId: id,
    kind: 'npc',
    side: 'foes',
    name: def.name + (nameSuffix ? ` ${nameSuffix}` : ''),
    look: def.look,
    level: def.level,
    abilities: { ...def.abilities },
    proficiency: proficiencyBonus(def.level),
    // Resistências e perícias com especialização do bloco: o goblin rola
    // Furtividade +6 (é a rolagem de surpresa da emboscada), não +4.
    saves: def.saves ?? [],
    skills: def.skills ?? [],
    expertise: def.expertise ?? [],
    ac: def.ac,
    maxHp,
    hp: maxHp,
    tempHp: 0,
    speedFt: def.speedFt,
    speeds: def.speeds ?? null,
    attacks: def.attacks,
    multiattack: def.multiattack ?? null,
    traits: def.traits ?? [],
    // Como a IA joga esta criatura, quando não é o padrão. Hoje só existe
    // 'atirador': atira de onde estiver e só usa a lâmina com inimigo colado.
    // Sem copiar o campo aqui, `ai.js` nunca o veria — o combatente não
    // carrega a ficha, só o que esta função passa adiante.
    tatica: def.tatica ?? null,
    conditions: [],
    // A pegada viaja DENTRO da posição: assim `distanceFt` e `isAdjacent`
    // medem contra a caixa da criatura sem que nenhum chamador saiba disso.
    pos: { ...pos, f: footprintOf(def.size) },
    deathSaves: { successes: 0, failures: 0 },
    stable: false,
    dead: false,
    xp: def.xp,
    blurb: def.blurb,
    // Estes quatro parecem decoração e não são: a view inteira depende deles.
    // `size` escolhe o andar pesado, `voice` é a voz da criatura, `morte` o
    // jeito de cair e `incorporeo` decide se ela se dissipa. Enquanto não eram
    // copiados, dez vozes, seis andares e quatro mortes já escritos e
    // comentados simplesmente não aconteciam — o esqueleto morria sangrando.
    size: def.size ?? 'médio',
    voice: def.voice ?? null,
    morte: def.morte ?? null,
    andar: def.andar ?? null,
    incorporeo: def.incorporeo ?? false,
    fonte: def.fonte ?? null,
    // Os sentidos do bloco (visao no escuro, visao verdadeira): sem copiar,
    // nenhum monstro levava o que declara para o combate.
    senses: { ...(def.senses ?? {}) },
    ...(def.pairaNoAr ? { pairaNoAr: true } : {}),
    // A folha de cada arma, para quem troca (o hobgoblin pega o arco).
    ...(def.aparencias ? { aparencias: { ...def.aparencias } } : {}),
    // ARMA DE SOPRO. Sem esta linha o bloco `breath` morria na definição: o
    // dragão verde carregava cone, CD, dados e recarga desde que foi escrito,
    // e nada disso chegava ao combate. Medido: o chefe do jogo nunca soprou.
    ...(def.breath ? { breath: { ...def.breath } } : {}),
    // DESLOCAMENTO DE VOO. Mesma história do sopro: `flyFt` estava escrito em
    // seis fichas e morria na definição. Agora `voaPelaFicha` no combate o lê.
    ...(def.flyFt ? { flyFt: def.flyFt } : {}),
    // PAIRAR (`hover`). Quem paira fica no ar o tempo todo e o tabuleiro o
    // desenha erguido; quem so VOA (o dragao) atravessa pelo ar e pousa.
    ...(def.hover ? { hover: true } : {}),
    tipo: def.tipo ?? TIPO_DA_FAMILIA.get(id) ?? null,
    // Tipos de dano. As famílias escreveram com dois vocabulários (`resist` e
    // `damageResistances`); aqui viram um só. Resistência física "só de armas
    // não mágicas" (espectro, aparição) fica separada: arma mágica e magia
    // passam por ela.
    ...tiposDeDano(def),
    conditionImmunities: [...(def.conditionImmunities ?? []), ...(def.immuneConditions ?? [])],
    // Conjuração no motor: só o bloco que opta (`noMotor`) entra no motor de magias — os
    // outros conjuradores têm o bloco escrito, mas a IA ainda não conjura por eles. Sem
    // este campo o Mago do SRD não reagiria com Contramágica contra o grupo.
    ...(def.spellcasting?.noMotor ? {
      spellcasting: {
        ...def.spellcasting,
        cantrips: [...(def.spellcasting.cantrips ?? [])],
        prepared: [...(def.spellcasting.prepared ?? [])],
        slots: [...(def.spellcasting.slots ?? [])],
        ...(def.spellcasting.cajado ? { cajado: { ...def.spellcasting.cajado, magias: { ...def.spellcasting.cajado.magias } } } : {}),
      },
    } : {}),
  };
}

function tiposDeDano(def) {
  const resist = [...(def.resist ?? []), ...(def.damageResistances ?? [])];
  const naoMagico = def.damageResistancesNote ? resist.filter((t) => FISICOS.includes(t)) : [];
  return {
    resist: resist.filter((t) => !naoMagico.includes(t)),
    resistNaoMagico: naoMagico,
    immune: [...(def.immune ?? []), ...(def.damageImmunities ?? [])],
    vulnerable: [...(def.vulnerable ?? []), ...(def.damageVulnerabilities ?? [])],
  };
}
