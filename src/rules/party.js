// SRD 5.1 (CC-BY-4.0) — ver NOTICE.md
// Os quatro personagens prontos do sandbox, no 2º nível.
//
// O 2º nível é o ponto doce para testar combate: cada classe já tem um verbo
// tático próprio (Ação Surpreendente, Ação Ardilosa, Canalizar Divindade,
// Esculpir Magias) sem a complexidade das subclasses completas.

import { abilityMod, proficiencyBonus } from './abilities.js';
import { armorClass } from './equipment.js';
import { slotsFor } from './spells.js';

function finish(sheet) {
  const c = {
    kind: 'pc',
    side: 'party',
    level: 2,
    conditions: [],
    tempHp: 0,
    deathSaves: { successes: 0, failures: 0 },
    stable: false,
    dead: false,
    ...sheet,
  };
  c.proficiency = proficiencyBonus(c.level);
  c.ac = armorClass(c);
  c.hp = c.maxHp;
  c.equippedWeapon = c.weapons[0];
  // O HUD precisa do MÁXIMO para desenhar o que já foi gasto: três losangos
  // dos quais um está vazio dizem muito mais que o número 2.
  if (c.spellcasting) {
    c.spellcasting.slots = slotsFor(c.level);
    c.spellcasting.slotsMax = slotsFor(c.level);
  }
  c.resourcesMax = { ...(c.resources ?? {}) };
  return c;
}

export function makeParty() {
  return [
    finish({
      id: 'pc-guerreiro',
      name: 'Dara',
      className: 'Guerreira',
      ancestry: 'Humana',
      look: 'fighter',
      abilities: { str: 16, dex: 14, con: 15, int: 10, wis: 12, cha: 10 },
      saves: ['str', 'con'],
      skills: ['atletismo', 'percepcao'],
      armor: 'cotaDeMalha',
      shield: true,
      acBonusArmadura: 1, // Estilo de Luta: Defesa — só vale de armadura
      maxHp: 20,
      speedFt: 30,
      weapons: ['espadaLonga', 'adaga'],
      features: ['defenseStyle', 'secondWind', 'actionSurge'],
      resources: { secondWind: 1, actionSurge: 1 },
      blurb: 'Segura a linha. Quanto mais inimigo encostado nela, melhor para o grupo.',
    }),

    finish({
      id: 'pc-ladino',
      name: 'Pip',
      className: 'Ladino',
      ancestry: 'Halfling',
      look: 'rogue',
      abilities: { str: 10, dex: 16, con: 14, int: 12, wis: 13, cha: 10 },
      saves: ['dex', 'int'],
      skills: ['furtividade', 'prestidigitacao', 'percepcao', 'acrobacia'],
      expertise: ['furtividade', 'prestidigitacao'],
      armor: 'couroBatido',
      shield: false,
      maxHp: 17,
      speedFt: 25,
      weapons: ['espadaCurta', 'arcoCurto', 'adaga'],
      features: ['sneakAttack', 'cunningAction'],
      sneakAttack: '1d6',
      resources: {},
      blurb: 'Ataque Furtivo quando tem vantagem ou um aliado colado no alvo. Ação Ardilosa para sumir.',
    }),

    finish({
      id: 'pc-clerigo',
      name: 'Brenn',
      className: 'Clérigo',
      ancestry: 'Anão',
      look: 'cleric',
      abilities: { str: 14, dex: 10, con: 14, int: 10, wis: 16, cha: 12 },
      saves: ['wis', 'cha'],
      skills: ['medicina', 'religiao', 'intuicao'],
      armor: 'brunea',
      shield: true,
      maxHp: 17,
      speedFt: 25,
      weapons: ['maca'],
      spellcasting: {
        ability: 'wis',
        cantrips: ['chamaSagrada'],
        prepared: ['curarFerimentos', 'palavraCurativa', 'bencao'],
        // O clérigo prepara da LISTA DA CLASSE inteira, não de um livro: é a
        // diferença entre ele e o mago, e é por isso que `lista` e `livro`
        // são campos diferentes em vez de um só com dois nomes.
        lista: ['curarFerimentos', 'palavraCurativa', 'bencao', 'raioGuiado', 'infligirFerimentos', 'perdicao'],
      },
      features: ['discipleOfLife', 'preserveLife'],
      resources: { channelDivinity: 1 },
      blurb: 'Domínio da Vida: toda cura dele rende mais. Preservar a Vida levanta o grupo de uma vez.',
    }),

    finish({
      id: 'pc-mago',
      name: 'Ilvan',
      className: 'Mago',
      ancestry: 'Elfo',
      look: 'wizard',
      abilities: { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 },
      saves: ['int', 'wis'],
      skills: ['arcanismo', 'historia', 'investigacao'],
      armor: 'nenhuma',
      shield: false,
      maxHp: 14,
      speedFt: 30,
      weapons: ['bordao', 'adaga'],
      spellcasting: {
        ability: 'int',
        cantrips: ['raioDeFogo', 'raioDeGelo', 'toqueArrepiante'],
        prepared: ['misselMagico', 'maosFlamejantes', 'sono', 'ondaTrovejante', 'raioDeDoenca'],
        // O livro tem SEIS de 1º círculo e ele prepara cinco. A diferença de
        // um é o que transforma a tela de preparação em escolha — com livro
        // do tamanho do limite, preparar é um formulário sem decisão.
        livro: ['misselMagico', 'maosFlamejantes', 'sono', 'ondaTrovejante', 'raioDeDoenca', 'infligirFerimentos'],
      },
      features: ['sculptSpells'],
      resources: {},
      blurb: 'Frágil e decisivo. Esculpir Magias deixa os aliados fora do cone.',
    }),
  ];
}

/** Modificador de conjuração do personagem. */
export function spellMod(actor) {
  return actor.spellcasting ? abilityMod(actor.abilities[actor.spellcasting.ability]) : 0;
}

/**
 * Quantas magias ele pode deixar preparadas: modificador de conjuração +
 * nível, mínimo uma. Vale para mago e para clérigo — muda o atributo, não a
 * fórmula.
 *
 * Truque NÃO conta: truque não se prepara, está sempre pronto. Misturar os
 * dois faria o mago "gastar" vaga de preparação com Raio de Fogo.
 */
export function limiteDePreparacao(actor) {
  if (!actor.spellcasting) return 0;
  return Math.max(1, spellMod(actor) + (actor.level ?? 1));
}

/**
 * De onde este personagem pode preparar.
 *
 * O mago lê o LIVRO, que é dele e cresce com o que ele copia; o clérigo lê a
 * LISTA da classe, que é fixa e inteira. Quem não tiver nem um nem outro cai
 * no que já está preparado — assim um conjurador sem catálogo declarado não
 * perde as magias que tinha.
 */
export function fontesDePreparacao(actor) {
  const sc = actor.spellcasting;
  if (!sc) return [];
  return sc.livro ?? sc.lista ?? sc.prepared ?? [];
}
