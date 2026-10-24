// SRD 5.1 (CC-BY-4.0) — ver NOTICE.md
// Os quatro personagens prontos.
//
// Dois níveis de uso. A ARENA joga no 2º nível, o ponto doce para testar
// combate: cada classe já tem um verbo tático próprio (Ação Surpreendente,
// Ação Ardilosa, Canalizar Divindade, Esculpir Magias) sem a complexidade das
// subclasses completas. A CAMPANHA começa no 1º, como a aventura pede. A
// história de cada um mora em `game/herois.js`; aqui fica só a ficha.

import { abilityMod } from './abilities.js';
import { criarPersonagem } from './progressao.js';
import { CLASSES } from './classes/index.js';
import { SPELLS } from './spells.js';

// Cada ficha traz só o que não é de classe — atributos, perícias, equipamento,
// aparência, magias escolhidas. Pontos de vida, proficiência, características,
// recursos e espaços de magia saem do motor de progressão, o mesmo que sobe o
// personagem de nível no jogo: assim a ficha pronta e a ficha que o jogador
// faz subindo nunca contam histórias diferentes.
function pronto(nivel, base, classe, escolhas = {}) {
  const { blurbs, ...resto } = base;
  const c = criarPersonagem({ ...resto, blurb: blurbs[nivel] ?? blurbs[2] }, { classe, nivel, escolhas });
  c.equippedWeapon = c.weapons[0];
  const sc = c.spellcasting;
  if (!sc) return c;
  // Só entra o círculo que ele já conjura: magia de 3º círculo no grimório
  // de um mago de 2º nível é magia que ele não tem como ter copiado.
  const maior = (sc.slotsMax ?? []).reduce((m, n, i) => (n > 0 ? i : m), 0);
  const cabe = (id) => (SPELLS[id]?.level ?? 0) <= maior;
  // Grimório do mago: 6 magias no 1º nível, mais 2 a cada nível.
  if (sc.livro) sc.livro = sc.livro.filter(cabe).slice(0, 4 + 2 * nivel);
  if (sc.lista) sc.lista = sc.lista.filter(cabe);
  // Preparadas: modificador + nível. As listas são escritas em ordem de
  // importância, então fica de fora o fim delas.
  if (sc.prepared) {
    sc.prepared = sc.prepared
      .filter((id) => cabe(id) && (!sc.livro || sc.livro.includes(id)))
      .slice(0, limiteDePreparacao(c));
  }
  return c;
}

/**
 * O grupo pronto. `nivel` 2 é o da arena; a campanha pede 1. `ids` escolhe
 * quem entra, na ordem dada — sem ele, os quatro.
 */
export function makeParty({ nivel = 2, ids = null } = {}) {
  const todos = fichasProntas(nivel);
  if (!ids) return todos;
  return ids.map((id) => todos.find((c) => c.id === id)).filter(Boolean);
}

function fichasProntas(nivel) {
  return [
    pronto(nivel, {
      id: 'pc-guerreiro',
      name: 'Dara',
      className: 'Guerreira',
      ancestry: 'Humana',
      look: 'fighter',
      abilities: { str: 16, dex: 14, con: 15, int: 10, wis: 12, cha: 10 },
      skills: ['atletismo', 'percepcao'],
      armor: 'cotaDeMalha',
      shield: true,
      speedFt: 30,
      weapons: ['espadaLonga', 'adaga'],
      blurbs: {
        1: 'Segura a linha. Retomar o Fôlego devolve vida uma vez por descanso curto.',
        2: 'Segura a linha. Quanto mais inimigo encostado nela, melhor para o grupo.',
      },
    }, 'guerreiro', { 1: { estiloDeLuta: 'defense' } }),

    pronto(nivel, {
      id: 'pc-ladino',
      name: 'Pip',
      className: 'Ladino',
      ancestry: 'Halfling',
      look: 'rogue',
      abilities: { str: 10, dex: 16, con: 14, int: 12, wis: 13, cha: 10 },
      skills: ['furtividade', 'prestidigitacao', 'percepcao', 'acrobacia'],
      armor: 'couroBatido',
      shield: false,
      speedFt: 25,
      weapons: ['espadaCurta', 'arcoCurto', 'adaga'],
      blurbs: {
        1: 'Ataque Furtivo quando tem vantagem ou um aliado colado no alvo. Ainda sem Ação Ardilosa: precisa escolher bem onde parar.',
        2: 'Ataque Furtivo quando tem vantagem ou um aliado colado no alvo. Ação Ardilosa para sumir.',
      },
    }, 'ladino', { 1: { expertise: ['furtividade', 'prestidigitacao'] } }),

    pronto(nivel, {
      id: 'pc-clerigo',
      name: 'Brenn',
      className: 'Clérigo',
      ancestry: 'Anão',
      look: 'cleric',
      abilities: { str: 14, dex: 10, con: 14, int: 10, wis: 16, cha: 12 },
      skills: ['medicina', 'religiao', 'intuicao'],
      armor: 'brunea',
      shield: true,
      speedFt: 25,
      weapons: ['maca'],
      spellcasting: {
        ability: 'wis',
        // Três truques, como o clérigo de 1º nível conhece.
        cantrips: ['chamaSagrada', 'pouparOsMoribundos', 'resistencia'],
        // Bênção e Curar Ferimentos não estão aqui: são magias do Domínio da
        // Vida, sempre preparadas (`sempreProntas`), e não ocupam vaga.
        // Detectar Magia vem por último: o clérigo só a tem preparada se sobrar vaga (como ritual,
        // sem grimório, ele precisa dela preparada).
        prepared: ['palavraCurativa', 'raioGuiado', 'perdicao', 'espiritosGuardioes', 'imobilizarPessoa',
          'palavraCurativaEmMassa', 'cegueiraSurdez', 'ajuda', 'detectarMagia'],
        // O clérigo prepara da LISTA DA CLASSE inteira, não de um livro: é a
        // diferença entre ele e o mago, e é por isso que `lista` e `livro`
        // são campos diferentes em vez de um só com dois nomes.
        // Arma Espiritual, Restauração Menor e Revivificar também são do
        // domínio (3º e 5º nível).
        lista: ['palavraCurativa', 'raioGuiado', 'infligirFerimentos', 'perdicao',
          'imobilizarPessoa', 'cegueiraSurdez', 'ajuda', 'espiritosGuardioes', 'palavraCurativaEmMassa', 'dissiparMagia',
          'silencio', 'eloDeProtecao', 'acalmarEmocoes', 'oracaoDeCura', 'detectarMagia'],
      },
      blurbs: {
        1: 'Domínio da Vida: toda cura dele rende mais. Duas magias de 1º círculo por descanso longo.',
        2: 'Domínio da Vida: toda cura dele rende mais. Preservar a Vida levanta o grupo de uma vez.',
      },
    }, 'clerigo', { 1: { subclasse: 'vida' } }),

    pronto(nivel, {
      id: 'pc-mago',
      name: 'Ilvan',
      className: 'Mago',
      ancestry: 'Elfo',
      look: 'wizard',
      abilities: { str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10 },
      skills: ['arcanismo', 'historia', 'investigacao'],
      armor: 'nenhuma',
      shield: false,
      speedFt: 30,
      weapons: ['bordao', 'adaga'],
      spellcasting: {
        ability: 'int',
        cantrips: ['raioDeFogo', 'raioDeGelo', 'toqueArrepiante'],
        // O livro de rituais do mago: conjura sem preparar e sem espaço, em 10 minutos a mais.
        rituais: ['detectarMagia', 'identificar', 'compreenderIdiomas'],
        prepared: ['misselMagico', 'bolaDeFogo', 'raioArdente', 'teia', 'maosFlamejantes', 'sono',
          'passoNebuloso', 'relampago', 'armaduraArcana', 'ondaTrovejante', 'despedacar'],
        // O grimório começa com seis magias de mago e ganha duas por nível:
        // `pronto` corta pelo nível, e a ordem é a de importância. Preparar
        // menos do que o livro tem é o que faz da preparação uma escolha.
        // Raio de Doença é conteúdo próprio (não está no SRD).
        livro: ['misselMagico', 'maosFlamejantes', 'sono', 'armaduraArcana', 'ondaTrovejante', 'graxa', 'raioDeDoenca', 'vidaFalsa',
          'raioArdente', 'passoNebuloso', 'teia', 'despedacar', 'bolaDeFogo', 'relampago',
          'padraoHipnotico', 'lentidao', 'borrao', 'imobilizarPessoa', 'medo', 'toqueVampirico', 'cegueiraSurdez',
          'nevoaObscurecente', 'escuridao', 'lufadaDeVento', 'dissiparMagia', 'aumentarReduzir', 'coroaDaLoucura'],
      },
      blurbs: {
        1: 'Frágil e decisivo. Duas magias de 1º círculo por descanso longo: cada uma conta.',
        2: 'Frágil e decisivo. Esculpir Magias deixa os aliados fora do cone.',
      },
    }, 'mago', { 2: { subclasse: 'evocacao' } }),
  ];
}

/** Modificador de conjuração do personagem. */
export function spellMod(actor) {
  return actor.spellcasting ? abilityMod(actor.abilities[actor.spellcasting.ability]) : 0;
}

/**
 * Quantas magias ele pode deixar preparadas: modificador de conjuração +
 * nível, mínimo uma. Vale para mago, clérigo e druida — muda o atributo, não
 * a fórmula. O paladino soma METADE do nível. Quem conhece magias em vez de
 * preparar (bardo, feiticeiro, bruxo, patrulheiro) tem o limite no que conhece.
 *
 * Truque NÃO conta: truque não se prepara, está sempre pronto. Misturar os
 * dois faria o mago "gastar" vaga de preparação com Raio de Fogo.
 */
export function limiteDePreparacao(actor) {
  if (!actor.spellcasting) return 0;
  const conj = CLASSES[actor.classe]?.conjuracao;
  const nivel = actor.level ?? 1;
  if (conj?.prepara === 'conhecidas') return actor.spellcasting.magiasConhecidas ?? 0;
  const parte = conj?.preparaMetadeDoNivel ? Math.floor(nivel / 2) : nivel;
  return Math.max(1, spellMod(actor) + parte);
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
