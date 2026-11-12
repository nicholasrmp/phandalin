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
import { CASA_DA_MORTE, TRAITS as T_CDM } from './monsters/strahd.js';
import { TALHUNDERETH, TRAITS as T_TAL } from './monsters/talhundereth.js';
import { CRIPTA, TRAITS as T_CRI } from './monsters/cripta.js';
import { ENCRUZILHADA, TRAITS as T_ENC } from './monsters/encruzilhada.js';
import { OBELISCO7, TRAITS as T_OB7 } from './monsters/obelisco7.js';
import { OBELISCO8, TRAITS as T_OB8 } from './monsters/obelisco8.js';
import { INVOCACOES_DE_MAGIA } from './monsters/magias.js';
// Os bestiários IMPORTADOS dos livros (`src/dev/importar-bestiario.mjs`): vêm antes, para o bloco feito à mão vencer.
import { LIVRO_MM, TRACOS_MM } from './monsters/livro-mm.js';
// os outros bestiários (2026-11-12): Volo, Mordenkainen, Fizban, Bigby e Acquisitions Inc.; o id repetido entre livros
// ganha o sufixo do livro que entrou depois, no importador
import { LIVRO_VGM, TRACOS_VGM } from './monsters/livro-vgm.js';
import { LIVRO_MTF, TRACOS_MTF } from './monsters/livro-mtf.js';
import { LIVRO_FTD, TRACOS_FTD } from './monsters/livro-ftd.js';
import { LIVRO_BGG, TRACOS_BGG } from './monsters/livro-bgg.js';
import { LIVRO_AI, TRACOS_AI } from './monsters/livro-ai.js';
import { DANOS_FISICOS } from './tipos-de-dano.js';

export const MONSTERS = {
  ...LIVRO_MM,
  ...LIVRO_VGM,
  ...LIVRO_MTF,
  ...LIVRO_FTD,
  ...LIVRO_BGG,
  ...LIVRO_AI,
  ...GOBLINOIDES,
  ...HUMANOIDES,
  ...FERAS,
  ...MORTOS_VIVOS,
  ...ABERRACOES,
  ...CASA_DA_MORTE,
  ...TALHUNDERETH,
  ...CRIPTA,
  ...ENCRUZILHADA,
  ...OBELISCO7,
  ...OBELISCO8,
  // as criaturas que as magias conjuram (o Animar Objetos, a Mão de Bigby, a Espada de Mordenkainen)
  ...INVOCACOES_DE_MAGIA,
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
  // os traços do Monster Manual que o motor lê (`livro-motor.js`); texto nosso, a regra resumida
  formaFluida: { name: 'Forma Fluida', desc: 'Entra no espaço de um inimigo e atravessa um vão de uma polegada sem se espremer.' },
  camuflagemGeral: { name: 'Camuflagem', desc: 'A cor da pele ou da carapaça imita o chão: vantagem para se esconder.' },
  reativo: { name: 'Reativo', desc: 'Tem uma reação em cada turno da luta, não uma por rodada.' },
  deficienciaCaido: { name: 'Cai de Costas', desc: 'Derrubado, rola um dado: ímpar, fica de costas e incapacitado, e só se vira com Destreza CD 10 no fim do turno.' },
  assassinar: { name: 'Assassinar', desc: 'No primeiro turno, vantagem contra quem ainda não agiu; todo acerto num surpreendido é crítico.' },
  transfereDano: { name: 'Transferir Dano', desc: 'Agarrando alguém, sofre só metade do dano; a outra metade cai em quem ele agarra.' },
  comandaMortos: { name: 'Comandar Mortos-Vivos', desc: 'Ele e os mortos-vivos aliados a 18 m têm vantagem contra Expulsar Mortos-Vivos.' },
  coneAntimagia: { name: 'Cone Antimagia', desc: 'O olho central abre um cone de 45 m em que magia não funciona — nem a dos raios dele. No começo do turno, ele escolhe para onde o cone olha.' },
  coneDeEnergiaNegativa: { name: 'Cone de Energia Negativa', desc: 'O olho central abre um cone de 45 m: ninguém recupera PV nele, e o humanoide que morre ali levanta como zumbi dele.' },
  despertar: { name: 'Despertar', desc: 'A primeira vez que cairia a 0 PV, volta com muitos PV, o sopro recarregado e as resistências lendárias de volta.' },
  esquivaSobrenatural: { name: 'Esquiva Sobrenatural', desc: 'Reação: o golpe que o acerta, de quem ele vê, sai pela metade.' },
  masmorraSemiplanar: { name: 'Masmorra Semiplanar', desc: 'Quem ele engole vai para um semiplano de pedra: de lá não o fere, e só sai com magia de viagem entre planos. Morto ele, quem está lá dentro volta para perto do corpo.' },
  corroiArma: { name: 'Corroer', desc: 'Arma comum de metal que o acerta perde 1 no dano, de vez e somando; a −5 se desfaz.' },
  corroeMadeira: { name: 'Corroer Madeira', desc: 'A corrosão come madeira também.' },
  liberdadeDeMovimento: { name: 'Liberdade de Movimento', desc: 'Ignora terreno difícil, a magia não lhe tira deslocamento, e sai de agarrão gastando 1,5 m.' },
  imunidadeMagicaLimitada: { name: 'Imunidade à Magia Limitada', desc: 'Magia de 6º círculo ou menos não o afeta; contra as outras, vantagem na resistência.' },
  carapacaRefletora: { name: 'Carapaça Refletora', desc: 'Mísseis Mágicos, magia em linha e magia de ataque à distância não a afetam; num 6 no d6, voltam para quem lançou.' },
  congela: { name: 'Congelar', desc: 'Dano de frio o endurece: 6 m a menos de deslocamento até o fim do próximo turno.' },
  consumirVida: { name: 'Consumir Vida', desc: 'Ação bônus: quem está a 0 PV a 1,5 m faz Constituição CD 10 ou morre, e ele cura 3d6.' },
  saltoEtereo: { name: 'Salto Etéreo', desc: 'Ação bônus: passa ao Plano Etéreo, ou volta dele.' },
  chaoAberrante: { name: 'Chão Aberrante', desc: 'A 3 m dele o chão vira massa: terreno difícil, e quem começa o turno ali faz Força CD 10 ou não anda.' },
  mascaraPerturbadora: { name: 'Máscara Perturbadora', desc: 'Reação: quem começa o turno a 9 m dele e o vê faz Sabedoria CD 14 ou fica amedrontado até o fim do turno.' },
  escudoPegajoso: { name: 'Escudo Pegajoso', desc: 'Reação: o golpe de arma de perto que erra gruda no escudo. Força CD 11 ou a arma fica presa, e quem a segura, agarrado.' },
  incitarRampage: { name: 'Incitar Rampage', desc: 'Ação (recarga 5–6): um aliado com Rampage a 9 m usa a reação para golpear de perto.' },
  fantasmas: { name: 'Fantasmas', desc: 'Ação, uma vez: três cópias ilusórias o rodeiam e tomam golpes; somem na luz plena.' },
  espinhos: { name: 'Couro Farpado', desc: 'No começo do turno dele, quem o agarra sofre 1d10 perfurante.' },
  raiosOculares: { name: 'Raios Oculares', desc: 'Ação: dispara raios sorteados dos olhos, cada um num alvo que vê — enfeitiçar, paralisar, assustar, lentificar, ferir, erguer, adormecer, petrificar, desintegrar, matar.' },
  espetar: { name: 'Espetar', desc: 'Uma vez por turno, o tridente que acerta fere mais 3d6, e o dano vira PV temporários.' },
  furiaFerida: { name: 'Fúria Ferida', desc: 'Muito ferido, ataca com vantagem e cada golpe de perto fere mais.' },
  deslocamento: { name: 'Deslocamento', desc: 'Parece estar um pouco ao lado de onde está: quem o ataca tem desvantagem, até ele ser atingido (aí a ilusão falha até o fim do próximo turno dele).' },
  absorcaoDeFogo: { name: 'Absorção de Fogo', desc: 'O fogo não o fere: cura o mesmo tanto.' },
  furtividadeNasSombras: { name: 'Furtividade nas Sombras', desc: 'Na penumbra ou no escuro, se esconde como ação bônus.' },
  regeneracaoDoLivro: { name: 'Regeneração', desc: 'Recupera PV no começo de cada turno enquanto tiver 1 PV ou mais. O dano certo (fogo, ácido, radiante, conforme a criatura) a suspende por um turno; o troll só morre se começar o turno a 0 PV sem regenerar.' },
  enxameDoLivro: { name: 'Enxame', desc: 'Muitos bichos pequenos agindo como um só. Com metade dos PV ou menos, o golpe dele fica mais fraco.' },
  frenesiDeSangue: { name: 'Frenesi de Sangue', desc: 'Vantagem nos golpes de perto contra quem já está ferido.' },
  voaSemProvocar: { name: 'Voo Rasante', desc: 'Voando para fora do alcance de alguém, não provoca ataque de oportunidade.' },
  imprudente: { name: 'Imprudente', desc: 'Golpeia de perto com vantagem — e quem o ataca também tem vantagem.' },
  rampage: { name: 'Rampage', desc: 'Quando derruba alguém de perto no próprio turno, anda metade do deslocamento e morde, como ação bônus.' },
  sensibilidadeALuz: { name: 'Sensibilidade à Luz', desc: 'Em luz plena, de qualquer fonte, ataca com desvantagem.' },
  resisteExpulsar: { name: 'Resistência a Expulsar', desc: 'Vantagem no teste contra o Expulsar Mortos-Vivos.' },
  evasaoTotal: { name: 'Evitar', desc: 'Num teste que daria metade do dano, não sofre nada se passar e só metade se falhar.' },
  corpoQuente: { name: 'Corpo Quente', desc: 'Quem o acerta de perto se queima.' },
  aura: { name: 'Aura', desc: 'Afeta quem fica perto dele: dano no começo do turno dele, ou um teste no começo do turno de quem está ao lado.' },
  explosaoAoMorrer: { name: 'Explosão ao Morrer', desc: 'Quando morre, explode: quem está perto faz um teste ou sofre o efeito.' },
  presencaAterradora: { name: 'Presença Aterradora', desc: 'Junto com os golpes: quem está perto e ainda não resistiu faz Sabedoria ou fica amedrontado por 1 minuto, repetindo o teste no fim de cada turno. Quem passa, ou se livra, não teme mais esta criatura.' },
  sempreInvisivel: { name: 'Invisível', desc: 'É invisível o tempo todo: atacar não o revela.' },
  acoesLendarias: { name: 'Ações Lendárias', desc: 'Depois do turno de outra criatura, faz uma ação a mais — um golpe, ou a área em volta dela. Voltam todas no começo do turno dela.' },
  nimbleEscape: { name: 'Escapada Ágil', desc: 'Desengajar ou Esconder-se como ação bônus.' },
  // a SEGUNDA FILA DOS BESTIÁRIOS (`livro-motor.js`)
  aversaoAoFogo: { name: 'Aversão ao Fogo', desc: 'Ferido por fogo, tem desvantagem nos ataques e nos testes até o fim do próximo turno dele.' },
  indomavelMonstro: { name: 'Indomável', desc: 'Rola de novo a resistência que falhou; poucas vezes por dia.' },
  protecaoArcana: { name: 'Proteção Arcana', desc: 'Um escudo mágico de pontos de vida leva o dano antes dele; o que sobra passa.' },
  peleVenenosa: { name: 'Pele Venenosa', desc: 'Quem o agarra ou o toca com a mão nua faz Constituição ou fica envenenado por 1 minuto.' },
  despertarDoRebento: { name: 'Despertar do Rebento', desc: 'Quando o berço cai a 0 PV, o rebento do gigante desperta no lugar dele, na mesma vez da iniciativa.' },
  packTactics: { name: 'Táticas de Matilha', desc: 'Vantagem no ataque se um aliado estiver a até 1,5 m do alvo.' },
  redirectAttack: { name: 'Redirecionar Ataque', desc: 'Reação: troca de lugar com um goblin adjacente e o ataque passa a mirá-lo.' },
  martialAdvantage: { name: 'Vantagem Marcial', desc: 'Uma vez por turno, +2d6 de dano se um aliado não incapacitado estiver a até 1,5 m do alvo.' },
  // O Obelisco, capítulo 5.
  explosaoMental: { name: 'Explosão Mental', desc: 'Ao morrer, explode: quem está a 1,5 m faz Inteligência CD 13 ou sofre dano psíquico.' },
  fortitudeMental: { name: 'Fortitude Mental', desc: 'Vantagem nas resistências contra ficar enfeitiçado ou amedrontado.' },
  empurraoTelecinetico: { name: 'Empurrão Telecinético', desc: 'Ação bônus: alvo que vê a até 9 m faz Força CD 13 ou cai.' },
  escudoPsionico: { name: 'Escudo Psiônico', desc: 'Reação: +3 de CA contra um ataque que acertaria ele ou um aliado a até 4,5 m.' },
  rasgoSinaptico: { name: 'Rasgo Sináptico (recarga 5–6)', desc: 'Esfera de 9 m num ponto a até 18 m: Inteligência CD 13 ou 4d6 psíquicos e incapacitado; metade se passar.' },
  coroaPsionica: { name: 'Coroa Psiônica (recarga 5–6)', desc: 'Junto do multiataque: alvo a até 18 m faz Sabedoria CD 14 ou fica enfeitiçado por 1 minuto, sem reações, a meia velocidade e com 2d8 psíquicos por turno.' },
  halitoVirulento: { name: 'Hálito Virulento', desc: 'No começo do turno dele, quem está a 1,5 m faz Constituição CD 15 ou sofre 1d6 de veneno.' },
  pancadaDeTentaculos: { name: 'Pancada de Tentáculos', desc: 'Ação: bate os agarrados uns nos outros. Constituição CD 14 ou 2d6+3 e atordoado; metade se passar.' },
  pancadaDeQuitina: { name: 'Pancada de Quitina', desc: 'No lugar de um golpe: um agarrado faz Constituição CD 15 ou sofre 3d10 e fica atordoado.' },
  rajadaDeCalor: { name: 'Rajada de Calor (recarga 5–6)', desc: 'Ação bônus: esfera de 9 m em volta dele, que contorna quinas. Constituição CD 17 ou 3d8 de fogo; metade se passar.' },
  monstroDeCerco: { name: 'Monstro de Cerco', desc: 'Dano em dobro em objetos e estruturas.' },
  escavador: { name: 'Escavador', desc: 'Fura a rocha natural e deixa um túnel do tamanho dele, que fica no mapa.' },
  resistenciaLendaria: { name: 'Resistência Lendária (2/dia)', desc: 'Quando falha num teste de resistência, pode escolher passar.' },
  tentaculosCerebrais: { name: 'Tentáculos Cerebrais (recarga 5–6)', desc: 'Ação bônus: alvo a até 9 m faz Destreza CD 15 ou sofre 2d8 psíquicos e fica atordoado.' },
  comandoDeCombate: { name: 'Comando de Combate', desc: 'Ação bônus: um aliado a até 18 m usa a reação para um golpe corpo a corpo.' },
  vinculo: { name: 'Vínculo', desc: 'A até 18 m do mestre, recebe metade do dano que ele levaria.' },
  regeneracao: { name: 'Regeneração', desc: 'Recupera 10 PV no começo do turno, se tiver pelo menos 1.' },
  escudoDoGuardiao: { name: 'Escudo', desc: 'Reação: +2 de CA no mestre, se está colado nele.' },
};

export const TRAIT_INFO = { ...TRACOS_MM, ...TRACOS_VGM, ...TRACOS_MTF, ...TRACOS_FTD, ...TRACOS_BGG, ...TRACOS_AI, ...TRACOS_BASE, ...T_GOB, ...T_HUM, ...T_FER, ...T_MOR, ...T_ABE, ...T_CDM, ...T_TAL, ...T_CRI, ...T_ENC, ...T_OB7, ...T_OB8 };

let serial = 0;

/** Instancia um monstro como combatente. */
export function makeMonster(id, pos, { rng = null, nameSuffix = '', tatica = null, arma = null } = {}) {
  const def = MONSTERS[id];
  if (!def) throw new Error(`Monstro desconhecido: "${id}"`);
  // `arma` (o nome de um ataque do bloco): a que ele já tem na mão ao nascer.
  // Só vale para quem tem `aparencias` — a figura nasce com aquela folha. O
  // `lookBase` precisa nascer junto com o look padrão: `resolveAttack` faz
  // `lookBase ??= look`, e sem isto o primeiro golpe de espada voltaria ao arco.
  const comArma = arma && def.aparencias?.[arma] ? arma : null;
  // PV podem ser fixos (médio do SRD) ou rolados, se vier um rng.
  const maxHp = def.maxHp;
  return {
    id: `${id}-${++serial}`,
    defId: id,
    kind: 'npc',
    side: 'foes',
    name: def.name + (nameSuffix ? ` ${nameSuffix}` : ''),
    look: comArma ? def.aparencias[comArma] : def.look,
    ...(comArma ? { lookBase: def.look } : {}),
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
    tatica: tatica ?? def.tatica ?? null,
    // A arma que o goblin tem na mão: troca-la e a interacao gratuita do turno.
    ...(def.trocaDeArma ? { trocaDeArma: true, armaNaMao: comArma ?? def.attacks[0].name } : {}),
    // SEMPRE INVISÍVEL (o perseguidor invisível, o poltergeist): nasce invisível, e atacar não o revela (`persistente`)
    conditions: def.traits?.includes('sempreInvisivel')
      ? [{ id: 'invisivel', rounds: Infinity, source: def.id, data: { persistente: true }, lado: null, quando: 'fim', magia: null }] : [],
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
      ...usosDoBloco(def.spellcasting),
    } : {}),
    // O ATAQUE FURTIVO do espião: `features` + `sneakAttack`, o formato que `combat.js sneakApplies` lê.
    // ASSASSINAR (o assassino do livro): o mesmo `assassinate` do ladino Assassino, que `combat.js` já lê
    ...(def.features || def.traits?.includes('assassinar') ? { features: [...(def.features ?? []), ...(def.traits?.includes('assassinar') ? ['assassinate'] : [])] } : {}),
    ...(def.sneakAttack ? { sneakAttack: def.sneakAttack } : {}),
    // A explosão mental dos goblins psíquicos (`combat.js explosaoMental`).
    ...(def.explosaoMental ? { explosaoMental: { ...def.explosaoMental } } : {}),
    // A explosão de poeira do mefit (`combat.js explosaoDePoeira`) e as magias que não pegam o horror de elmo.
    ...(def.explosaoAoMorrer ? { explosaoAoMorrer: { ...def.explosaoAoMorrer } } : {}),
    ...(def.imuneAMagias ? { imuneAMagias: [...def.imuneAMagias] } : {}),
    ...(def.olharCd ? { olharCd: def.olharCd } : {}),
    // o que os traços LIDOS do livro deram (`importar-bestiario.mjs tracoLido`): regeneração, corpo quente, aura, os sopros
    ...(def.regeneracao ? { regeneracao: { ...def.regeneracao } } : {}),
    ...(def.corpoQuente ? { corpoQuente: { ...def.corpoQuente } } : {}),
    // o Couro Farpado do diabo farpado e o Espetar do rei homem-lagarto (`livro-motor.js`)
    ...(def.espinhos ? { espinhos: { ...def.espinhos } } : {}),
    ...(def.espetar ? { espetar: { ...def.espetar } } : {}),
    // os RAIOS OCULARES do observador e do tirano da morte (`livro-motor.js raiosOculares`)
    ...(def.raiosOculares ? { raiosOculares: { ...def.raiosOculares, raios: def.raiosOculares.raios.map((r) => ({ ...r })) } } : {}),
    ...(def.aura ? { aura: { ...def.aura } } : {}),
    // o capítulo 7 do Obelisco: a Repreensão Obsessiva da ocular, o Negar Magia do Oshundo, o gnawble que não é a luta
    ...(def.repreensao ? { repreensao: { ...def.repreensao } } : {}),
    ...(def.negarMagia ? { negarMagia: { ...def.negarMagia } } : {}),
    ...(def.naoSeguraALuta ? { naoSeguraALuta: true } : {}),
    // as reações dos outros bestiários: a CA a mais com o bônus deles, e o revide com golpe
    ...(def.apararBonus ? { apararBonus: def.apararBonus } : {}),
    ...(def.apararTudo ? { apararTudo: true } : {}),
    ...(def.revide ? { revide: { ...def.revide } } : {}),
    ...(def.despertar ? { despertar: { ...def.despertar } } : {}),
    // a SEGUNDA FILA DOS BESTIÁRIOS (`livro-motor.js`): a Proteção Arcana, a Pele Venenosa, os usos do Indomável e o nome do
    // livro, que diz ao berço do Bigby qual rebento desperta
    ...(def.protecaoArcana ? { protecaoArcana: def.protecaoArcana } : {}),
    ...(def.peleVenenosa ? { peleVenenosa: { ...def.peleVenenosa } } : {}),
    ...(def.usosIndomavel ? { usosIndomavel: def.usosIndomavel } : {}),
    ...(def.nomeOriginal ? { nomeOriginal: def.nomeOriginal } : {}),
    // o obelisco da Ânima (o capítulo 8): o dano nele volta sobre os fanáticos, e a arte dele é a do mapa
    ...(def.contragolpe ? { contragolpe: { ...def.contragolpe } } : {}),
    ...(def.pintadoNoMapa ? { pintadoNoMapa: true } : {}),
    ...(def.sopros ? { sopros: def.sopros.map((b) => ({ ...b })) } : {}),
    ...(def.acoesEspeciais ? { acoesEspeciais: def.acoesEspeciais.map((a) => ({ ...a })), usosEspeciais: Object.fromEntries(def.acoesEspeciais.filter((a) => a.porDia).map((a) => [a.nome, a.porDia])) } : {}),
    ...(def.luzPropria ? { luzPropria: { ...def.luzPropria } } : {}),
    ...(def.furiaFerida ? { furiaFerida: { ...def.furiaFerida } } : {}),
    // AÇÕES LENDÁRIAS e PRESENÇA ATERRADORA (os bestiários importados; `combat.js lendariasDepoisDe`, `presencaAterradora`)
    ...(def.lendarias ? { lendarias: { acoes: def.lendarias.acoes, opcoes: def.lendarias.opcoes.map((o) => ({ ...o })) }, lendariasRestantes: def.lendarias.acoes } : {}),
    ...(def.presencaAterradora ? { presencaAterradora: { ...def.presencaAterradora } } : {}),
    // as cabeças da hidra (`combat.js cabecasDaHidra`)
    ...(def.cabecas ? { cabecas: def.cabecas, cabecasMortas: 0 } : {}),
    // Os recursos do bloco: o Lamento da banshee (1/dia), a Resistência Lendária (`recursos` no bloco).
    // SOMA aos usos por dia das magias do bloco (`usosDoBloco`), que vêm antes: sem isto o devorador clarividente, que tem
    // Resistência Lendária E Dissipar Magia três vezes por dia, ficava sem o Dissipar.
    ...((def.traits?.includes('lamento') || def.recursos) ? { resources: {
      ...(def.spellcasting?.noMotor ? usosDoBloco(def.spellcasting).resources ?? {} : {}),
      ...(def.traits?.includes('lamento') ? { lamento: 1 } : {}), ...(def.recursos ?? {}) } } : {}),
  };
}

/**
 * "UMA VEZ POR DIA" E "À VONTADE" DE MONSTRO (os blocos do Obelisco). O bloco declara `porDia: { magia: vezes }` e
 * `aVontade: [magia]`, e eles viram os mesmos usos livres que o motor já tinha para o herói (`passivas.js
 * usoLivreDe`): a de por dia gasta um recurso próprio (`porDia:<magia>`), a à vontade não gasta nada, e nenhuma das
 * duas sai de espaço de magia. O "dia" do monstro é a luta: ele nasce com os usos cheios e não descansa.
 */
function usosDoBloco(sc) {
  const porDia = Object.entries(sc.porDia ?? {});
  const aVontade = sc.aVontade ?? [];
  if (!porDia.length && !aVontade.length) return {};
  return {
    resources: Object.fromEntries(porDia.map(([id, n]) => [`porDia:${id}`, n])),
    ...(porDia.length ? { magiasRaciais: porDia.map(([id, n]) => ({ magia: id, recurso: `porDia:${id}`, rotulo: n > 1 ? `${n} vezes por dia` : 'uma vez por dia' })) } : {}),
    ...(aVontade.length ? { magiasDeInvocacao: aVontade.map((id) => ({ magia: id, tipo: 'avontade', rotulo: 'à vontade' })) } : {}),
  };
}

function tiposDeDano(def) {
  const resist = [...(def.resist ?? []), ...(def.damageResistances ?? [])];
  const naoMagico = def.damageResistancesNote ? resist.filter((t) => FISICOS.includes(t)) : [];
  return {
    resist: resist.filter((t) => !naoMagico.includes(t)),
    resistNaoMagico: naoMagico,
    // Imunidade física "só de ataques não mágicos" (o golem de argila): arma mágica e magia passam.
    immune: [...(def.immune ?? []), ...(def.damageImmunities ?? [])].filter((t) => !(def.damageImmunitiesNote && FISICOS.includes(t))),
    immuneNaoMagico: def.damageImmunitiesNote ? [...(def.immune ?? []), ...(def.damageImmunities ?? [])].filter((t) => FISICOS.includes(t)) : [],
    vulnerable: [...(def.vulnerable ?? []), ...(def.damageVulnerabilities ?? [])],
  };
}
