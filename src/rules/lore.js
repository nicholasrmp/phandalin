// A LORE DO MUNDO: o que os heróis sabem dos deuses, das facções, dos lugares e dos povos. Cada entrada traz FATOS em
// camadas de CD (10, o que qualquer um ouviu; 15, quem estudou ou é do lugar; 20, o estudioso ou o devoto; 25, o raro):
// quem rola o Lembrar sabe os fatos até o total que tirou. As entradas dos livros vêm de `lore-livros.js` (gerado por
// `src/dev/importar-lore.mjs`, o texto com as nossas palavras); as facções, de `lore-faccoes.js`, à mão.
//
// Quem lê:
//   `game/investigar.js saberDaCriatura`  o Lembrar sobre a criatura soma a lore do POVO dela (`loreDaCriatura`);
//   `game/regiao.js`                      o lugar distante no mapa da região mostra o que o grupo sabe dele;
//   `game/phandalin.js`                   a Garaele conta de Tymora no santuário, e o convite de uma facção diz o que ela é.
// A lore NÃO entra nas fichas de NPC (`npc-saber*.js`): mudar a ficha invalida as falas dela no banco do diálogo
// (`dialogo-ia.js versaoDaFicha`), e cinco NPCs perderiam 1.170 falas do jogo sem API. Ela vai pela árvore da conversa.
// Puro: roda em Node.
import { LORE_DOS_LIVROS } from './lore-livros.js';
import { FACCOES } from './lore-faccoes.js';

export const LORE = { ...LORE_DOS_LIVROS, ...FACCOES };

/**
 * QUE CRIATURA LÊ QUE POVO. A chave é a do `lore-livros.js` (`povo:<seção>`) ou um GRUPO inteiro (`grupo:<capítulo>`,
 * os pedaços de um capítulo grande); `id` casa com o id do bloco, `tipo` com o tipo dele. A primeira linha que casa vale.
 */
export const POVOS = [
  { lore: ['grupo:goblinoidsTheConqueringHost'], id: /goblin|hobgoblin|bugbear/i },
  { lore: ['grupo:orcsTheGodsworn'], id: /^orc$|^orc[A-Z]|^orog|Orc[A-Z]/ },
  { lore: ['grupo:mindFlayersScourgeOfWorlds'], id: /devoradorDeMentes|cerebroAnciao|ulitharid|alhoon|mindFlayer/i },
  { lore: ['grupo:beholdersBadDreamsComeTrue'], id: /observador|tiranoDaMorte|gauth|espectador/i },
  { lore: ['grupo:koboldsLittleDragons'], id: /kobold/i },
  { lore: ['grupo:gnollsTheInsatiableHunger'], id: /gnoll/i },
  { lore: ['grupo:hagsDarkSisterhood'], id: /^bruxa/i },
  { lore: ['grupo:yuanTiSnakePeople'], id: /yuanTi/i },
  { lore: ['povo:drow'], id: /drow/i },
  { lore: ['povo:duergar'], id: /duergar/i },
  { lore: ['grupo:githAndTheirEndlessWar'], id: /githyanki|githzerai/i },
  { lore: ['povo:gnomes'], id: /gnomoDasProfundezas|svirfneblin/i },
  { lore: ['povo:lordsOfTheNine', 'povo:theGreatDance'], id: /diabo|abishai|erinia|^imp$|cambion/i },
  { lore: ['povo:princesOfTheAbyss', 'povo:lordsAndTheirThralls', 'povo:theGreatDance'], id: /balor|dretch|glabrezu|goristro|hezrou|manes|marilith|nalfeshnee|vrock|quasit|demonio/i },
  ...[['Negro', 'black'], ['Azul', 'blue'], ['DeLatao', 'brass'], ['DeBronze', 'bronze'], ['DeCobre', 'copper'], ['Dourado|DeOuro', 'gold'],
    ['Verde', 'green'], ['Vermelho', 'red'], ['DePrata|Prateado', 'silver'], ['Branco', 'white']]
    // o meio-dragão (o veterano meio-dragão vermelho) não é dragão: fica de fora
    .map(([cor, en]) => ({ lore: [`povo:${en}Dragons`], id: new RegExp(`^(?!.*meio)(?:dragao(?:${cor})|.*DeDragao(?:${cor})|grandeWyrm(?:${cor}))`, 'i') })),
  { lore: ['grupo:giantsWorldShakers', 'grupo:chapter2GiantsInPlay'], tipo: 'gigante' },
];

/** As entradas de uma chave (`povo:x`) ou de um grupo inteiro (`grupo:x`, todos os pedaços do capítulo). */
export function entradas(chave) {
  if (chave.startsWith('grupo:')) {
    const g = chave.slice(6);
    return Object.values(LORE).filter((e) => e.grupo === g);
  }
  return LORE[chave] ? [LORE[chave]] : [];
}

/** As entradas de lore do POVO de uma criatura (vazio se ela não tem). */
export function loreDaCriatura(m) {
  const id = m?.defId ?? m?.id ?? '';
  const linha = POVOS.find((p) => (p.id && p.id.test(id)) || (p.tipo && p.tipo === m?.tipo));
  return linha ? linha.lore.flatMap(entradas) : [];
}

/**
 * Os FATOS que quem tirou `total` sabe, de uma ou mais entradas: os de CD até o total, do mais sabido ao mais raro, no
 * máximo `ate` (o capítulo inteiro dos gigantes tem dezenas; ninguém lembra de tudo de uma vez).
 */
export function fatosAte(lista, total, { ate = 5 } = {}) {
  const todos = [].concat(lista).filter(Boolean).flatMap((e) => (e.fatos ?? []).map((f) => ({ ...f, de: e.nome })));
  const sabidos = todos.filter((f) => f.cd <= total).sort((a, b) => a.cd - b.cd);
  // um de cada CD primeiro, depois o resto: o herói que rolou 20 lembra também do que é raro, e não só do que é comum
  const porCd = new Map();
  for (const f of sabidos) { if (!porCd.has(f.cd)) porCd.set(f.cd, []); porCd.get(f.cd).push(f); }
  const escolhidos = [];
  for (let volta = 0; escolhidos.length < ate && volta < 10; volta += 1) {
    for (const lista2 of porCd.values()) if (lista2[volta] && escolhidos.length < ate) escolhidos.push(lista2[volta]);
  }
  return escolhidos.sort((a, b) => a.cd - b.cd);
}

/** O panteão de cada povo do criador (o `grupo` da raça): o anão segue os deuses anões, o drow os do Subterrâneo. */
// (as raças dos livros: o orc do Volo segue os deuses orcs, o yuan-ti os deuses-serpente)
const PANTEAO_DO_POVO = { 'Anão': ['dwarven'], Elfo: ['elven'], Halfling: ['halfling'], Gnomo: ['gnomish'], 'Meio-orc': ['orc'], 'Meio-elfo': ['elven'], Orc: ['orc'], 'Yuan-ti': ['yuanTi'] };

/**
 * Os DEUSES que um herói pode seguir: os de Faerûn, para todos, e os do povo dele (`racaGrupo`, o `grupo` de `racas.js`;
 * o drow ganha também o panteão do Subterrâneo). Em ordem alfabética dentro de cada panteão, Faerûn primeiro.
 */
export function deusesPara(racaGrupo, { drow = false } = {}) {
  const panteoes = ['faerunian', ...(PANTEAO_DO_POVO[racaGrupo] ?? []), ...(drow ? ['drow'] : [])];
  return panteoes.flatMap((p) => Object.values(LORE).filter((e) => e.tipo === 'deus' && e.grupo === p).sort((a, b) => a.nome.localeCompare(b.nome)));
}

/** O que o GRUPO sabe sem rolar: 10 + o melhor bônus da perícia (a "passiva" do conhecimento). */
export const saberDoGrupo = (herois, pericia, skillBonus) => 10 + Math.max(0, ...herois.map((h) => skillBonus(h, pericia)));
