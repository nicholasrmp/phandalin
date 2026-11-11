// RAÇAS DO LIVRO DO JOGADOR (2014): as nove raças, as sub-raças e os traços de cada uma.
//
// POR QUE ESTE ARQUIVO EXISTE
// A raça entrava na ficha por um bloco solto (`racial: { resistencias, truques, pvPorNivel }`) escrito à mão em
// cada herói, e só o que cabia ali funcionava. Sorte e Corajoso do halfling, Resistência Implacável e Ataques
// Selvagens do meio-orc, Ancestral Feérico, Resiliência Anã e Esperteza Gnômica não existiam; o PV a mais do anão
// só valia no 1º nível; o Sopro do draconato estava declarado e nada o executava; o Transe do elfo nem aparecia.
//
// Aqui a raça é DADO: cada raça diz o deslocamento, a visão no escuro e a lista de traços, e cada traço tem
// nome, tipo e texto. `aplicarRaca` põe isso na ficha uma vez; o motor lê os traços como lê as características de
// classe (`c.features.includes('lucky')`).
//
// `motor: true` num traço significa o mesmo que nas características de classe: o motor de combate (ou a criação)
// aplica de verdade. `semEfeito` marca o que o jogo não tem como modelar (idioma, ferramenta de ofício) e diz o
// porquê; a ficha mostra isso em vez de prometer.
//
// Textos em palavras nossas. Os números (deslocamento, dados, alcances) seguem o livro.

const T = (nome, tipo, desc, extra = {}) => ({ nome, tipo, desc, fonte: 'racial', ...extra });

export const TRACOS_RACIAIS = {
  // ---- visão -------------------------------------------------------------
  darkvision: T('Visão no Escuro', 'passiva',
    'Enxerga a 18 m no escuro como se fosse penumbra, e na penumbra como se fosse luz clara. No escuro total só vê em tons de cinza.',
    { motor: true }),
  superiorDarkvision: T('Visão no Escuro Superior', 'passiva',
    'A visão no escuro chega a 36 m: o dobro da comum.', { motor: true }),

  // ---- anão --------------------------------------------------------------
  dwarvenResilience: T('Resiliência Anã', 'passiva',
    'Vantagem nas resistências contra veneno e resistência a dano de veneno.', { motor: true }),
  dwarvenCombatTraining: T('Treinamento em Combate Anão', 'passiva',
    'Treinado com machado de batalha, machadinha, martelo leve e martelo de guerra.', { motor: true }),
  toolProficiency: T('Proficiência com Ferramentas', 'fora',
    'Treinado numa ferramenta de ofício à escolha: ferreiro, cervejeiro ou pedreiro.',
    { semEfeito: 'o jogo não tem ofício que peça ferramenta' }),
  stonecunning: T('Tino para Pedras', 'fora',
    'Em testes de História sobre trabalho em pedra, conta como treinado e soma o dobro da proficiência.',
    { motor: true }),
  dwarvenToughness: T('Robustez Anã', 'passiva',
    '+1 ponto de vida máximo em cada nível, a começar pelo 1º.', { motor: true }),
  dwarvenArmorTraining: T('Treinamento com Armaduras Anãs', 'passiva',
    'Treinado com armadura leve e média.', { motor: true }),

  // ---- elfo --------------------------------------------------------------
  keenSenses: T('Sentidos Aguçados', 'passiva', 'Treinado em Percepção.', { motor: true }),
  feyAncestry: T('Ancestral Feérico', 'passiva',
    'Vantagem nas resistências contra ser enfeitiçado, e magia não consegue pô-lo para dormir.', { motor: true }),
  trance: T('Transe', 'fora',
    'Não dorme: medita por 4 horas, o que vale um descanso longo. Na vigia, pode ficar acordado até 4 horas sem perder o descanso.',
    { motor: true }),
  elfWeaponTraining: T('Treino Élfico com Armas', 'passiva',
    'Treinado com espada longa, espada curta, arco curto e arco longo.', { motor: true }),
  highElfCantrip: T('Truque de Alto Elfo', 'passiva',
    'Conhece um truque da lista do mago, com Inteligência como atributo de conjuração.', { motor: true }),
  extraLanguage: T('Idioma Adicional', 'fora', 'Fala, lê e escreve um idioma a mais, à escolha.',
    { semEfeito: 'o jogo não modela idiomas' }),
  fleetOfFoot: T('Pés Ligeiros', 'passiva', 'O deslocamento base é de 10,5 m (35 pés).', { motor: true }),
  maskOfTheWild: T('Máscara da Natureza', 'fora',
    'Pode se esconder mesmo só levemente encoberto por chuva, neve, névoa ou folhagem.',
    { semEfeito: 'o jogo não tem a ação de se esconder em luta' }),
  sunlightSensitivity: T('Sensibilidade à Luz Solar', 'passiva',
    'Sob luz solar direta, tem desvantagem nos ataques e nos testes de Percepção que dependem da visão.',
    { motor: true, semMapa: 'nenhum mapa marca `field.sol` ainda' }),
  drowMagic: T('Magia Drow', 'passiva',
    'Conhece Luzes Dançantes. No 3º nível conjura Fogo das Fadas e no 5º, Escuridão, cada uma uma vez por descanso longo, com Carisma.',
    { motor: true }),
  drowWeaponTraining: T('Treino Drow com Armas', 'passiva',
    'Treinado com rapieira, espada curta e besta de mão.', { motor: true }),

  // ---- halfling ----------------------------------------------------------
  lucky: T('Sorte', 'passiva',
    'Num 1 natural em ataque, teste de atributo ou resistência, rola o dado de novo e fica com o novo resultado.', { motor: true }),
  brave: T('Corajoso', 'passiva', 'Vantagem nas resistências contra ficar amedrontado.', { motor: true }),
  halflingNimbleness: T('Agilidade Halfling', 'passiva',
    'Pode atravessar o espaço de qualquer criatura de tamanho maior que o seu.', { motor: true }),
  naturallyStealthy: T('Furtividade Natural', 'fora',
    'Pode tentar se esconder atrás de uma criatura pelo menos um tamanho maior que o seu.',
    { semEfeito: 'o jogo não tem a ação de se esconder em luta' }),
  stoutResilience: T('Resiliência Robusta', 'passiva',
    'Vantagem nas resistências contra veneno e resistência a dano de veneno.', { motor: true }),

  // ---- humano ------------------------------------------------------------
  variantSkilled: T('Perícia Adicional', 'passiva', 'Treinado numa perícia à escolha.', { motor: true }),
  variantFeat: T('Talento', 'passiva', 'Ganha um talento do Livro do Jogador à escolha no 1º nível, além do de origem.', { motor: true }),

  // ---- draconato ---------------------------------------------------------
  draconicAncestry: T('Ancestralidade Dracônica', 'passiva',
    'O dragão de que descende define o tipo de dano, a forma e a resistência do sopro e a resistência a dano.', { motor: true }),
  breathWeapon: T('Arma de Sopro', 'acao',
    'Ação: expele energia numa área. Quem estiver nela faz resistência (CD 8 + CON + proficiência) e sofre 2d6, ou metade se passar; o dano vai a 3d6 no 6º, 4d6 no 11º e 5d6 no 16º. Volta no descanso curto ou longo.',
    { motor: true }),
  draconicDamageResistance: T('Resistência Dracônica', 'passiva',
    'Resistência ao tipo de dano da sua ancestralidade.', { motor: true }),

  // ---- gnomo -------------------------------------------------------------
  gnomeCunning: T('Esperteza Gnômica', 'passiva',
    'Vantagem nas resistências de Inteligência, Sabedoria e Carisma contra magia.', { motor: true }),
  naturalIllusionist: T('Ilusionista Nato', 'passiva', 'Conhece o truque Ilusão Menor, com Inteligência.', { motor: true }),
  speakWithSmallBeasts: T('Falar com Bestas Pequenas', 'fora',
    'Transmite ideias simples a bestas Pequenas ou menores, e entende o que elas respondem.',
    { semEfeito: 'o jogo não tem conversa com animais' }),
  artificersLore: T('Saber do Artífice', 'fora',
    'Em testes de História sobre itens mágicos, alquímicos ou engenhocas, soma o dobro da proficiência.', { motor: true }),
  tinker: T('Engenhoqueiro', 'fora',
    'Com ferramentas de funileiro, monta pequenas engenhocas (caixa de música, isqueiro, brinquedo mecânico).',
    { semEfeito: 'o jogo não tem montagem de engenhocas' }),

  // ---- meio-elfo ---------------------------------------------------------
  skillVersatility: T('Versatilidade em Perícias', 'passiva', 'Treinado em duas perícias à escolha.', { motor: true }),

  // ---- meio-orc ----------------------------------------------------------
  menacing: T('Ameaçador', 'passiva', 'Treinado em Intimidação.', { motor: true }),
  relentlessEndurance: T('Resistência Implacável', 'passiva',
    'Uma vez por descanso longo: ao cair a 0 PV sem morrer na hora, fica com 1 PV.', { motor: true }),
  savageAttacks: T('Ataques Selvagens', 'passiva',
    'Num acerto crítico com arma corpo a corpo, rola um dado de dano da arma a mais.', { motor: true }),

  // ---- tiferino ----------------------------------------------------------
  hellishResistance: T('Resistência Infernal', 'passiva', 'Resistência a dano de fogo.', { motor: true }),
  infernalLegacy: T('Legado Infernal', 'passiva',
    'Conhece Taumaturgia. No 3º nível conjura Repreensão Infernal (como de 2º círculo) e no 5º, Escuridão, cada uma uma vez por descanso longo, com Carisma.',
    { motor: true }),
};

// Ancestralidade dracônica: tipo de dano e forma do sopro (Livro do Jogador, tabela do draconato).
export const ANCESTRALIDADES_DRACONICAS = {
  negro:    { dragao: 'negro',    dano: 'ácido',    forma: 'linha', save: 'dex' },
  azul:     { dragao: 'azul',     dano: 'elétrico', forma: 'linha', save: 'dex' },
  latao:    { dragao: 'latão',    dano: 'fogo',     forma: 'linha', save: 'dex' },
  bronze:   { dragao: 'bronze',   dano: 'elétrico', forma: 'linha', save: 'dex' },
  cobre:    { dragao: 'cobre',    dano: 'ácido',    forma: 'linha', save: 'dex' },
  ouro:     { dragao: 'ouro',     dano: 'fogo',     forma: 'cone',  save: 'dex' },
  verde:    { dragao: 'verde',    dano: 'veneno',   forma: 'cone',  save: 'con' },
  vermelho: { dragao: 'vermelho', dano: 'fogo',     forma: 'cone',  save: 'dex' },
  prata:    { dragao: 'prata',    dano: 'frio',     forma: 'cone',  save: 'con' },
  branco:   { dragao: 'branco',   dano: 'frio',     forma: 'cone',  save: 'con' },
};

/** O tamanho da área do sopro: cone de 4,5 m (15 pés) ou linha de 1,5 por 9 m (5 por 30 pés). */
export const AREA_DO_SOPRO = { cone: { areaFt: 15 }, linha: { areaFt: 30, larguraFt: 5 } };

/** Os dados do sopro: 2d6, 3d6 no 6º, 4d6 no 11º, 5d6 no 16º. */
export const dadosDoSopro = (nivel) => `${nivel >= 16 ? 5 : nivel >= 11 ? 4 : nivel >= 6 ? 3 : 2}d6`;

// As raças. `grupo` é a raça do livro; cada sub-raça repete o que é da raça (`tracos`), porque assim cada
// entrada se lê sozinha.
//   atributos     o aumento do livro (dado para um criador de personagem; os 12 heróis já trazem o valor somado)
//   deslocamento  em pés; `visao` em pés (0 = não tem)
//   pvPorNivel    PV a mais por nível
//   magiasRaciais [{ nivel, magia, circulo }]: conjuradas uma vez por descanso longo, com `atributoRacial`
export const RACAS = {
  draconato: {
    nome: 'Draconato', grupo: 'Draconato', porte: 'médio', deslocamento: 30, visao: 0,
    atributos: { str: 2, cha: 1 },
    tracos: ['draconicAncestry', 'breathWeapon', 'draconicDamageResistance'],
  },
  anaoColina: {
    nome: 'Anão da colina', grupo: 'Anão', porte: 'médio', deslocamento: 25, visao: 60,
    atributos: { con: 2, wis: 1 }, pvPorNivel: 1,
    tracos: ['darkvision', 'dwarvenResilience', 'dwarvenCombatTraining', 'toolProficiency', 'stonecunning', 'dwarvenToughness'],
    resistencias: ['veneno'], armas: ['machadoDeBatalha', 'machadinha', 'marteloLeve', 'marteloDeGuerra'],
  },
  anaoMontanha: {
    nome: 'Anão da montanha', grupo: 'Anão', porte: 'médio', deslocamento: 25, visao: 60,
    atributos: { con: 2, str: 2 },
    tracos: ['darkvision', 'dwarvenResilience', 'dwarvenCombatTraining', 'toolProficiency', 'stonecunning', 'dwarvenArmorTraining'],
    resistencias: ['veneno'], armas: ['machadoDeBatalha', 'machadinha', 'marteloLeve', 'marteloDeGuerra'], armaduras: ['leve', 'média'],
  },
  altoElfo: {
    nome: 'Alto elfo', grupo: 'Elfo', porte: 'médio', deslocamento: 30, visao: 60,
    atributos: { dex: 2, int: 1 },
    tracos: ['darkvision', 'keenSenses', 'feyAncestry', 'trance', 'elfWeaponTraining', 'highElfCantrip', 'extraLanguage'],
    pericias: ['percepcao'], armas: ['espadaLonga', 'espadaCurta', 'arcoCurto', 'arcoLongo'],
  },
  elfoFloresta: {
    nome: 'Elfo da floresta', grupo: 'Elfo', porte: 'médio', deslocamento: 35, visao: 60,
    atributos: { dex: 2, wis: 1 },
    tracos: ['darkvision', 'keenSenses', 'feyAncestry', 'trance', 'elfWeaponTraining', 'fleetOfFoot', 'maskOfTheWild'],
    pericias: ['percepcao'], armas: ['espadaLonga', 'espadaCurta', 'arcoCurto', 'arcoLongo'],
  },
  drow: {
    nome: 'Elfo negro (drow)', grupo: 'Elfo', porte: 'médio', deslocamento: 30, visao: 120,
    atributos: { dex: 2, cha: 1 },
    tracos: ['superiorDarkvision', 'keenSenses', 'feyAncestry', 'trance', 'sunlightSensitivity', 'drowMagic', 'drowWeaponTraining'],
    pericias: ['percepcao'], armas: ['rapieira', 'espadaCurta', 'bestaDeMao'], truques: ['luzesDancantes'], atributoRacial: 'cha',
    magiasRaciais: [{ nivel: 3, magia: 'fogoDasFadas' }, { nivel: 5, magia: 'escuridao' }],
  },
  halflingPesLeves: {
    nome: 'Halfling pés-leves', grupo: 'Halfling', porte: 'pequeno', deslocamento: 25, visao: 0,
    atributos: { dex: 2, cha: 1 },
    tracos: ['lucky', 'brave', 'halflingNimbleness', 'naturallyStealthy'],
  },
  halflingRobusto: {
    nome: 'Halfling robusto', grupo: 'Halfling', porte: 'pequeno', deslocamento: 25, visao: 0,
    atributos: { dex: 2, con: 1 },
    tracos: ['lucky', 'brave', 'halflingNimbleness', 'stoutResilience'], resistencias: ['veneno'],
  },
  humano: {
    nome: 'Humano', grupo: 'Humano', porte: 'médio', deslocamento: 30, visao: 0,
    atributos: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 }, tracos: ['extraLanguage'],
  },
  humanoVariante: {
    nome: 'Humano (variante)', grupo: 'Humano', porte: 'médio', deslocamento: 30, visao: 0,
    atributos: {}, tracos: ['variantSkilled', 'variantFeat', 'extraLanguage'],
  },
  gnomoFloresta: {
    nome: 'Gnomo da floresta', grupo: 'Gnomo', porte: 'pequeno', deslocamento: 25, visao: 60,
    atributos: { int: 2, dex: 1 },
    tracos: ['darkvision', 'gnomeCunning', 'naturalIllusionist', 'speakWithSmallBeasts'], truques: ['ilusaoMenor'], atributoRacial: 'int',
  },
  gnomoRochas: {
    nome: 'Gnomo das rochas', grupo: 'Gnomo', porte: 'pequeno', deslocamento: 25, visao: 60,
    atributos: { int: 2, con: 1 },
    tracos: ['darkvision', 'gnomeCunning', 'artificersLore', 'tinker'],
  },
  meioElfo: {
    nome: 'Meio-elfo', grupo: 'Meio-elfo', porte: 'médio', deslocamento: 30, visao: 60,
    atributos: { cha: 2 }, tracos: ['darkvision', 'feyAncestry', 'skillVersatility', 'extraLanguage'],
  },
  meioOrc: {
    nome: 'Meio-orc', grupo: 'Meio-orc', porte: 'médio', deslocamento: 30, visao: 60,
    atributos: { str: 2, con: 1 },
    tracos: ['darkvision', 'menacing', 'relentlessEndurance', 'savageAttacks'], pericias: ['intimidacao'],
  },
  tiferino: {
    nome: 'Tiferino', grupo: 'Tiferino', porte: 'médio', deslocamento: 30, visao: 60,
    atributos: { cha: 2, int: 1 },
    tracos: ['darkvision', 'hellishResistance', 'infernalLegacy'], resistencias: ['fogo'], truques: ['taumaturgia'], atributoRacial: 'cha',
    magiasRaciais: [{ nivel: 3, magia: 'repreensaoInfernal', circulo: 2 }, { nivel: 5, magia: 'escuridao' }],
  },
};

const sa = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** A cor do dragão do draconato, pelo texto da raça ("Draconata vermelha" → 'vermelho'). */
export function corDoDraconato(texto) {
  const t = sa(texto);
  const mapa = [['negr', 'negro'], ['azul', 'azul'], ['lat', 'latao'], ['bronz', 'bronze'], ['cobre', 'cobre'], ['ouro|doura', 'ouro'],
    ['verde', 'verde'], ['vermelh', 'vermelho'], ['prata|prateado', 'prata'], ['branc', 'branco']];
  for (const [re, id] of mapa) if (new RegExp(re).test(t)) return id;
  return 'vermelho';
}

/** O id da raça de uma ficha, pelo texto que ela traz (`raca` primeiro, `ancestry` de reserva). Null se não reconhece. */
export function racaDe(c) {
  const t = sa(`${c.raca ?? ''} ${c.ancestry ?? ''}`);
  if (!t.trim()) return null;
  if (/drac|dragon/.test(t)) return 'draconato';
  if (/meio-?elf|half-?elf/.test(t)) return 'meioElfo';
  if (/meio-?orc|half-?orc/.test(t)) return 'meioOrc';
  if (/tifer|tiefling/.test(t)) return 'tiferino';
  if (/drow|elfo negro|elfa negra/.test(t)) return 'drow';
  if (/\belf/.test(t)) return /floresta|wood/.test(t) ? 'elfoFloresta' : 'altoElfo';
  if (/halfling|pequenin/.test(t)) return /robust|stout/.test(t) ? 'halflingRobusto' : 'halflingPesLeves';
  if (/\bana?o\b|anao|dwarf/.test(t)) return /montanha|mountain/.test(t) ? 'anaoMontanha' : 'anaoColina';
  if (/gnom/.test(t)) return /rocha|rock/.test(t) ? 'gnomoRochas' : 'gnomoFloresta';
  if (/human/.test(t)) return /variant/.test(t) ? 'humanoVariante' : 'humano';
  return null;
}

/** Os traços raciais de uma ficha (ids), ou [] se a raça não é conhecida. */
export const tracosDaRaca = (c) => RACAS[racaDe(c)]?.tracos ?? [];

/**
 * Põe a raça na ficha: traços, deslocamento, visão no escuro, treinos, resistências, recursos e a ancestralidade
 * dracônica. Idempotente (chamar de novo não duplica nada), porque um save antigo, criado antes deste arquivo, passa
 * por aqui ao carregar.
 *
 * O que NÃO faz: o PV a mais do anão (cobrado a cada nível em `progressao.js`) e as magias raciais por nível
 * (`magiasRaciaisDoNivel`), que dependem do nível em que o personagem está.
 */
export function aplicarRaca(c) {
  const id = racaDe(c);
  if (!id) return null;
  const r = RACAS[id];
  c.racaId = id;
  c.features ??= [];
  for (const t of r.tracos) if (!c.features.includes(t)) c.features.push(t);
  c.deslocamentoRacial = r.deslocamento;
  // O MÓVEL (talento) soma 3 m ao deslocamento: um save carregado passa por aqui de novo, e não pode perdê-los.
  c.speedFt = r.deslocamento + ((c.talentos ?? []).includes('movel') ? 10 : 0);
  c.visaoNoEscuro = r.visao;
  c.skills ??= [];
  for (const p of r.pericias ?? []) if (!c.skills.includes(p)) c.skills.push(p);
  c.weaponTraining ??= [];
  for (const a of r.armas ?? []) if (!c.weaponTraining.includes(a)) c.weaponTraining.push(a);
  c.armorTraining ??= [];
  for (const a of r.armaduras ?? []) if (!c.armorTraining.includes(a)) c.armorTraining.push(a);
  // `resist` é o campo que o motor LÊ (`danoPorTipo`). Este arquivo e a criação escreviam `resistances`, que nada lia: a
  // resistência racial dos heróis (veneno do anão, fogo do tiferino e do draconato) nunca valeu em luta alguma.
  c.resist = [...new Set([...(c.resist ?? []), ...(r.resistencias ?? [])])];
  c.truquesRaciais = [...new Set([...(c.truquesRaciais ?? []), ...(r.truques ?? [])])];
  if (r.atributoRacial) c.atributoRacial = r.atributoRacial;
  c.resources ??= {};
  c.resourcesMax ??= {};
  const recurso = (rid) => { if (c.resourcesMax[rid] == null) { c.resourcesMax[rid] = 1; c.resources[rid] = 1; } };
  if (r.tracos.includes('relentlessEndurance')) recurso('relentlessEndurance');
  if (r.tracos.includes('breathWeapon')) {
    recurso('breathWeapon');
    const cor = corDoDraconato(`${c.raca ?? ''} ${c.ancestry ?? ''}`);
    c.ancestralidadeDraconica = cor;
    c.atributoRacial = 'con';
    c.truquesRaciais = [...new Set([...(c.truquesRaciais ?? []), `sopro_${cor === 'preto' ? 'negro' : cor}`])];
    c.resist = [...new Set([...c.resist, ANCESTRALIDADES_DRACONICAS[cor].dano])];
  }
  return id;
}

/**
 * Quem não conjura por classe (um tiferino guerreiro, um gnomo ladino) e tem magia da raça precisa de ALGO para conjurá-la:
 * o atributo da raça, os truques, e nenhum espaço. Quem já conjura só recebe os truques raciais, sem repetir.
 * Chamada depois dos níveis, porque a classe decide se há conjuração.
 */
export function completarConjuracaoRacial(c) {
  const truques = c.truquesRaciais ?? [];
  const temMagiaRacial = (c.magiasRaciais ?? []).length > 0 || truques.length > 0;
  if (!temMagiaRacial || !c.atributoRacial) return;
  if (!c.spellcasting) {
    c.spellcasting = { ability: c.atributoRacial, tipo: 'racial', cantrips: [...truques], prepared: [], slots: [0], slotsMax: [0] };
    return;
  }
  c.spellcasting.cantrips = [...new Set([...(c.spellcasting.cantrips ?? []), ...truques])];
}

/**
 * As magias raciais que o personagem tem direito ao chegar a `nivel` (Legado Infernal, Magia Drow): cada uma uma
 * vez por descanso longo. Devolve as NOVAS (as que ainda não estão em `c.magiasRaciais`) e as põe lá.
 */
export function magiasRaciaisDoNivel(c, nivel) {
  const r = RACAS[c.racaId ?? racaDe(c)];
  if (!r?.magiasRaciais) return [];
  c.magiasRaciais ??= [];
  c.resources ??= {};
  c.resourcesMax ??= {};
  const novas = [];
  for (const m of r.magiasRaciais) {
    if (nivel < m.nivel || c.magiasRaciais.some((x) => x.magia === m.magia)) continue;
    const reg = { magia: m.magia, circulo: m.circulo ?? null, recurso: `racial_${m.magia}` };
    c.magiasRaciais.push(reg);
    c.resourcesMax[reg.recurso] = 1;
    c.resources[reg.recurso] = 1;
    novas.push(reg);
  }
  return novas;
}
