// PASSIVAS de classe e traços raciais: as regras puras que o motor de combate consulta.
//
// POR QUE ISTO NÃO MORA NO combat.js
// O `combat.js` já tem quase sete mil linhas. Cada passiva é uma pergunta pequena ("este alvo tem vantagem nesta
// resistência?", "quantos dados extras num crítico?"), e a resposta depende só da ficha e de um contexto simples. Aqui
// ficam as respostas; o motor só chama. Tudo aqui é função pura: roda em Node sem tabuleiro, e cada uma tem teste em
// `src/dev/testes-passivas.mjs`.
//
// O CONTEXTO DE UMA RESISTÊNCIA (`contra`)
// Muitas passivas dizem "vantagem contra X": Corajoso contra amedrontado, Ancestral Feérico contra enfeitiçado,
// Resiliência Anã contra veneno, Esperteza Gnômica contra magia. Para saber se vale, o teste precisa dizer DO QUE vem:
//   { condicao: 'amedrontado', tipoDano: 'veneno', magico: true }
// Quem chama preenche só o que sabe; o que falta é "não sei", e "não sei" nunca dá vantagem.

const ENFEITICADO = new Set(['enfeiticado', 'sugerido', 'hipnotizado', 'coroaDaLoucura', 'cativado']);

/** O que a magia diz do seu efeito, no formato de `contra`. */
// ------------------------------------------------------------------ queda ----

/**
 * QUEDA LENTA (monge, 4º): o dano de queda cai em 5 × o nível do monge. Vale também fora da luta, quando a cena sorteia o dano.
 */
export function danoDeQueda(c, dano) {
  if (!c?.features?.includes('slowFall')) return dano;
  return Math.max(0, dano - 5 * (c.level ?? 1));
}

// ------------------------------------------------------------------ inimigo favorito ----

const GOBLINOIDES = ['goblin', 'goblinChefe', 'hobgoblin', 'bugbear', 'klarg', 'reiGrol', 'yeemik', 'droop'];
const INIMIGO_PELO_TIPO = {
  fera: 'bestas', 'morto-vivo': 'mortosVivos', monstruosidade: 'monstruosidades', 'dragão': 'dragoes', gosma: 'gosmas', planta: 'plantas',
  'aberração': 'aberracoes', celestial: 'celestiais', constructo: 'constructos', elemental: 'elementais', fada: 'fadas',
  corruptor: 'corruptores', gigante: 'gigantes',
};

/** A que tipo de Inimigo Favorito a criatura pertence (o id da lista do patrulheiro), ou null. */
export function categoriaDoInimigo(m) {
  if (!m) return null;
  if (GOBLINOIDES.includes(m.defId)) return 'goblinoidesEOrcs';
  return INIMIGO_PELO_TIPO[m.tipo] ?? null;
}

/** O alvo é de um tipo que o patrulheiro escolheu como Inimigo Favorito? */
export const ehInimigoFavorito = (actor, alvo) => {
  const cat = categoriaDoInimigo(alvo);
  return Boolean(cat && actor?.features?.includes('favoredEnemy') && actor.inimigosFavoritos?.includes(cat));
};

/** As magias que prendem com PLANTAS (o Passo da Terra dá vantagem contra elas). */
export const PLANTAS_QUE_PRENDEM = ['emaranhar', 'crescimentoDePlantas', 'crescimentoDeEspinhos', 'golpeConstritor'];

export function contraDaMagia(spell, conjurador = null) {
  if (!spell) return null;
  return {
    magico: true,
    fonteTipo: conjurador?.tipo ?? null,
    planta: PLANTAS_QUE_PRENDEM.includes(spell.id),
    condicao: spell.onFail?.condition ?? spell.applies?.condition ?? spell.condition ?? null,
    tipoDano: spell.damageType ?? null,
  };
}

/**
 * Os motivos de vantagem numa resistência que vêm dos traços (raciais e de classe). Lista vazia = nenhum.
 * `hab` é o atributo do teste; `contra`, o contexto (ver acima).
 */
export function vantagemPorTraco(actor, hab, contra = null) {
  const f = actor?.features;
  if (!f?.length || !contra) return [];
  const motivos = [];
  const cond = contra.condicao ?? null;
  if (f.includes('brave') && cond === 'amedrontado') motivos.push('Corajoso');
  // VONTADE DE AÇO (Caçador, 7º): vantagem contra amedrontado.
  if (f.includes('steelWill') && cond === 'amedrontado') motivos.push('Vontade de Aço');
  if (f.includes('feyAncestry') && ENFEITICADO.has(cond)) motivos.push('Ancestral Feérico');
  const veneno = contra.tipoDano === 'veneno' || cond === 'envenenado';
  if (veneno && f.includes('dwarvenResilience')) motivos.push('Resiliência Anã');
  if (veneno && f.includes('stoutResilience')) motivos.push('Resiliência Robusta');
  if (contra.magico && ['int', 'wis', 'cha'].includes(hab) && f.includes('gnomeCunning')) motivos.push('Esperteza Gnômica');
  // NIMBO SAGRADO (paladino, 20º): vantagem contra magias de corruptores e mortos-vivos.
  if (contra.magico && actor.conditions?.some((c) => c.id === 'nimboSagrado') && ['corruptor', 'morto-vivo'].includes(contra.fonteTipo)) motivos.push('Nimbo Sagrado');
  // CONTRACANTO: o bardo que canta dá vantagem a quem ouve, contra medo e encantamento.
  if (actor.conditions?.some((c) => c.id === 'contracanto') && (cond === 'amedrontado' || ENFEITICADO.has(cond))) motivos.push('Contracanto');
  // PASSO DA TERRA: vantagem contra as plantas mágicas que seguram ou atrasam.
  if (contra.planta && f.includes('landsStride')) motivos.push('Passo da Terra');
  return motivos;
}

// ------------------------------------------------------------------ crítico ----

// ------------------------------------------------------------------ bruxo: invocações e dádivas ----

/**
 * As invocações que dão uma MAGIA (à vontade, ou uma vez por descanso longo), sem espaço. Só entram as que o jogo tem como magia:
 * Palavras Sussurrantes, Palavra Terrível, Passo Ascendente de 4º+ e os servos do caos ficam de fora (não há a magia).
 */
export const MAGIAS_DE_INVOCACAO = {
  fiendishVigor: { magia: 'vidaFalsa', tipo: 'avontade', circulo: 1 },
  mistyVisions: { magia: 'imagemSilenciosa', tipo: 'avontade' },
  maskOfManyFaces: { magia: 'disfarcarSe', tipo: 'avontade' },
  eldritchSight: { magia: 'detectarMagia', tipo: 'avontade' },
  ascendantStep: { magia: 'levitacao', tipo: 'avontade' },
  thiefOfFiveFates: { magia: 'perdicao', tipo: 'longo', circulo: 1 },
  mireTheMind: { magia: 'lentidao', tipo: 'longo', circulo: 3 },
};

/** As três dádivas do pacto escolhem 3 truques do Livro das Sombras entre estes, na falta de escolha. */
const TRUQUES_DO_LIVRO = ['orientacao', 'chamaSagrada', 'luz', 'resistencia', 'maoMagica', 'consertar', 'toqueArrepiante', 'raioDeGelo'];

/**
 * Aplica no bruxo o que as invocações e a Dádiva do Pacto dão em dados: as magias das invocações (com o recurso das de uma vez por
 * descanso longo), a Visão das Bruxas (visão verdadeira de 9 m), o Livro das Sombras (três truques de qualquer lista) e o familiar
 * do Pacto da Corrente. Idempotente; `SPELLS` vem de fora para este módulo não importar `spells.js`.
 */
export function aplicarInvocacoes(c, SPELLS) {
  const f = c.features ?? [];
  c.resources ??= {};
  c.resourcesMax ??= {};
  c.magiasDeInvocacao ??= [];
  for (const [inv, m] of Object.entries(MAGIAS_DE_INVOCACAO)) {
    if (!f.includes(inv) || !SPELLS[m.magia] || c.magiasDeInvocacao.some((x) => x.magia === m.magia)) continue;
    const reg = { magia: m.magia, tipo: m.tipo, circulo: m.circulo ?? null, recurso: m.tipo === 'longo' ? `invocacao_${m.magia}` : null };
    c.magiasDeInvocacao.push(reg);
    if (reg.recurso) { c.resourcesMax[reg.recurso] = 1; c.resources[reg.recurso] = 1; }
  }
  if (f.includes('witchSight')) c.senses = { ...(c.senses ?? {}), truesightFt: Math.max(c.senses?.truesightFt ?? 0, 30) };
  if (f.includes('pactOfTheTome') && !c.livroDasSombras && c.spellcasting) {
    const sabe = new Set(c.spellcasting.cantrips ?? []);
    c.livroDasSombras = TRUQUES_DO_LIVRO.filter((id) => SPELLS[id]?.level === 0 && !sabe.has(id)).slice(0, 3);
    c.spellcasting.cantrips = [...(c.spellcasting.cantrips ?? []), ...c.livroDasSombras];
  }
  if (f.includes('pactOfTheChain') && SPELLS.encontrarFamiliar && c.spellcasting) {
    const fixas = c.spellcasting.sempreProntas ?? [];
    if (!fixas.includes('encontrarFamiliar')) c.spellcasting.sempreProntas = [...fixas, 'encontrarFamiliar'];
  }
}

/**
 * Desfaz o que `aplicarInvocacoes` derivou (magias das invocações, visão verdadeira, Livro das Sombras, familiar) para refazer depois
 * de o jogador trocar uma invocação ou o pacto na tela de nível.
 */
export function desfazerInvocacoes(c) {
  c.magiasDeInvocacao = [];
  if (!c.features?.includes('witchSight') && c.senses?.truesightFt === 30) c.senses = { ...c.senses, truesightFt: 0 };
  if (c.livroDasSombras && !c.features?.includes('pactOfTheTome') && c.spellcasting) {
    c.spellcasting.cantrips = (c.spellcasting.cantrips ?? []).filter((id) => !c.livroDasSombras.includes(id));
    c.livroDasSombras = null;
  }
  if (!c.features?.includes('pactOfTheChain') && c.spellcasting?.sempreProntas) {
    c.spellcasting.sempreProntas = c.spellcasting.sempreProntas.filter((id) => id !== 'encontrarFamiliar');
  }
}

/** Grava as Magias de Assinatura escolhidas (cada uma: uma vez por descanso curto, sem espaço). */
export function gravarAssinaturas(c, magias) {
  for (const a of c.magiasAssinatura ?? []) { delete c.resources[a.recurso]; delete c.resourcesMax[a.recurso]; }
  c.magiasAssinatura = magias.map((m) => ({ magia: m, recurso: `assinatura_${m}` }));
  for (const a of c.magiasAssinatura) {
    c.resourcesMax[a.recurso] = 1;
    c.resources[a.recurso] = 1;
    if (c.spellcasting && !c.spellcasting.prepared.includes(a.magia)) c.spellcasting.prepared.push(a.magia);
  }
}

/**
 * O menor d20 que é crítico num ataque com ARMA: 20 para todo mundo, 19 com Crítico Aprimorado (Campeão, 3º nível),
 * 18 com Crítico Superior (15º). Ataque de magia não passa por aqui: as duas características falam de ataques com arma.
 */
export function margemDeCritico(atacante) {
  const f = atacante?.features;
  if (f?.includes('superiorCritical')) return 18;
  if (f?.includes('improvedCritical')) return 19;
  return 20;
}

/**
 * Quantos dados de dano da ARMA se rolam a mais num crítico corpo a corpo: Crítico Brutal do bárbaro (1 no 9º nível,
 * 2 no 13º, 3 no 17º) e Ataques Selvagens do meio-orc (1). Somam-se: um meio-orc bárbaro de 9º rola dois.
 */
export function dadosExtraDeCritico(atacante) {
  const f = atacante?.features;
  if (!f?.length) return 0;
  let n = 0;
  if (f.includes('brutalCritical')) n += (atacante.level ?? 1) >= 17 ? 3 : (atacante.level ?? 1) >= 13 ? 2 : (atacante.level ?? 1) >= 9 ? 1 : 0;
  if (f.includes('savageAttacks')) n += 1;
  return n;
}

// -------------------------------------------------------------- probabilidades ----

/**
 * A distribuição do d20 de um teste DEPOIS das passivas do dado, na mesma ordem em que o motor as aplica
 * (`ajustarTeste`): primeiro vantagem/desvantagem escolhem o dado; depois a Sorte rola de novo um 1; depois o Talento
 * Confiável sobe 9 ou menos para 10. Devolve P[1..20] (P[0] sobra).
 *
 * Existe porque a tela mostra uma CHANCE (esconder-se, acertar) e o dado joga a regra: se as duas contas divergirem, a
 * tela mente. O teste "a chance da tela bate com o que o dado faz" mede as duas contra a outra.
 */
export function distribuicaoDoD20(actor, { modo = 'normal', treinada = false } = {}) {
  const P = new Array(21).fill(0);
  for (let k = 1; k <= 20; k++) {
    P[k] = modo === 'vantagem' ? (2 * k - 1) / 400 : modo === 'desvantagem' ? (41 - 2 * k) / 400 : 1 / 20;
  }
  const f = actor?.features;
  if (f?.includes('lucky')) {
    const reroll = P[1] / 20;
    P[1] = 0;
    for (let k = 1; k <= 20; k++) P[k] += reroll;
  }
  if (treinada && f?.includes('reliableTalent')) {
    for (let k = 1; k <= 9; k++) { P[10] += P[k]; P[k] = 0; }
  }
  return P;
}

/** A chance de o d20 (já com as passivas) sair em `minimo` ou mais. */
export function chanceDeNaturalMinimo(actor, minimo, opcoes = {}) {
  const P = distribuicaoDoD20(actor, opcoes);
  let p = 0;
  for (let k = Math.max(1, Math.ceil(minimo)); k <= 20; k++) p += P[k];
  return Math.min(1, Math.max(0, p));
}

// ------------------------------------------------------- resistência e imunidade ----

/** Os tipos de criatura que a Proteção contra o Bem e o Mal afasta (e, para o paladino da Devoção, a Pureza de Espírito). */
export const TIPOS_DA_PUREZA = ['aberração', 'celestial', 'elemental', 'fada', 'corruptor', 'morto-vivo'];

/** As condições de ENCANTO, que os traços e as auras tratam como uma família. */
export const CONDICOES_DE_ENCANTO = ['enfeiticado', 'sugerido', 'hipnotizado', 'coroaDaLoucura', 'cativado'];

/**
 * O dano de uma resistência que "pela metade se passar", com a EVASÃO (ladino e monge, 7º): numa resistência de DESTREZA
 * passar não causa dano nenhum, e falhar causa só metade. Quem está incapacitado não tem Evasão.
 *
 * `metadeNoSucesso` é a regra da magia/efeito; sem ela (o efeito não tem "metade") a Evasão não muda nada.
 */
export function danoPorResistencia(alvo, hab, metadeNoSucesso, sucesso, total, incapacitado = false) {
  const metade = Math.floor(total / 2);
  if (hab === 'dex' && metadeNoSucesso && !incapacitado && alvo.features?.includes('evasion')) return sucesso ? 0 : metade;
  return sucesso ? (metadeNoSucesso ? metade : 0) : total;
}

// ---------------------------------------------------------------- magia ----

/** O tipo de dano de cada ancestralidade dracônica (o feiticeiro usa 'preto'; o draconato, 'negro'). */
export const DANO_DA_ANCESTRALIDADE = {
  negro: 'ácido', preto: 'ácido', azul: 'elétrico', latao: 'fogo', bronze: 'elétrico', cobre: 'ácido',
  ouro: 'fogo', verde: 'veneno', vermelho: 'fogo', prata: 'frio', branco: 'frio',
};

/**
 * O que se soma a UMA rolagem de dano de uma magia, por traço do conjurador:
 *   Evocação Potencializada (mago de Evocação, 10º)   +INT em magia de evocação;
 *   Afinidade Elemental (feiticeiro dracônico, 6º)    +CAR em magia do tipo de dano da sua ancestralidade.
 * "Uma rolagem" é por magia (Raios Ardentes rolam três e só uma ganha). Devolve { dono, bonus, motivos }.
 */
export function bonusDeDanoPorTraco(actor, spell) {
  const f = actor?.features;
  const vazio = { dono: actor, bonus: 0, motivos: [] };
  if (!f?.length || !spell || spell.racial || (!spell.damage && !spell.damageType)) return vazio;
  const mod = (a) => Math.max(0, Math.floor(((actor.abilities?.[a] ?? 10) - 10) / 2));
  let bonus = 0;
  const motivos = [];
  if (f.includes('empoweredEvocation') && spell.school === 'evocação') { bonus += mod('int'); motivos.push('Evocação Potencializada'); }
  if (f.includes('elementalAffinity') && DANO_DA_ANCESTRALIDADE[actor.ancestralDraconico] === spell.damageType) { bonus += mod('cha'); motivos.push('Afinidade Elemental'); }
  return bonus ? { dono: actor, bonus, motivos } : vazio;
}

// -------------------------------------------------------------- uso livre ----

/** O que o mago prefere como Maestria (1º e 2º círculo) e Assinatura (3º) quando o jogo escolhe por ele. */
export const PREFERIDAS_DA_MAESTRIA = {
  1: ['escudoArcano', 'misselMagico', 'sono', 'maosFlamejantes', 'armaduraArcana'],
  2: ['passoNebuloso', 'imagemEspelhada', 'invisibilidade', 'raioArdente', 'teia'],
};
export const PREFERIDAS_DA_ASSINATURA = ['bolaDeFogo', 'relampago', 'voo', 'velocidade', 'piscar', 'contramagia'];

/**
 * Uma magia que `c` conjura SEM espaço de magia, e que o motor prefere ao espaço quando existe:
 *   racial        Legado Infernal e Magia Drow: uma vez por descanso longo, no círculo que o livro diz;
 *   maestria      Maestria em Magia (mago, 18º): a magia de 1º e a de 2º círculo escolhidas, à vontade, no círculo base;
 *   assinatura    Magias de Assinatura (mago, 20º): as duas de 3º círculo, uma vez cada por descanso curto.
 * `pedido` é o círculo que o jogador pediu (null = o padrão): conjurar mais alto gasta espaço de verdade.
 * Devolve { tipo, circulo, recurso?, rotulo } ou null.
 */
export function usoLivreDe(c, spell, pedido = null) {
  if (!spell || spell.level === 0) return null;
  const tem = (r) => (c.resources?.[r] ?? 0) > 0;
  const racial = c.magiasRaciais?.find((m) => m.magia === spell.id && tem(m.recurso));
  if (racial) {
    const circulo = racial.circulo ?? spell.level;
    if (pedido == null || pedido === circulo) return { tipo: 'racial', circulo, recurso: racial.recurso, rotulo: 'magia da raça, uma vez por descanso longo' };
  }
  if (c.features?.includes('spellMastery') && c.maestriaDeMagia?.includes(spell.id) && (pedido == null || pedido === spell.level)) {
    return { tipo: 'maestria', circulo: spell.level, rotulo: 'Maestria em Magia, à vontade' };
  }
  // INVOCAÇÕES do bruxo que dão uma magia: à vontade, ou uma vez por descanso longo.
  const inv = c.magiasDeInvocacao?.find((m) => m.magia === spell.id && (m.tipo === 'avontade' || tem(m.recurso)));
  if (inv && (pedido == null || pedido === (inv.circulo ?? spell.level))) {
    return { tipo: 'invocacao', circulo: inv.circulo ?? spell.level, recurso: inv.recurso, rotulo: inv.tipo === 'avontade' ? 'invocação, à vontade' : 'invocação, uma vez por descanso longo' };
  }
  const assinatura = c.magiasAssinatura?.find((m) => m.magia === spell.id && tem(m.recurso));
  if (assinatura && (pedido == null || pedido === spell.level)) {
    return { tipo: 'assinatura', circulo: spell.level, recurso: assinatura.recurso, rotulo: 'Magia de Assinatura, uma vez por descanso curto' };
  }
  return null;
}

/** As magias (de um círculo) que `c` já tem à mão: preparadas e do grimório. */
const conhecidasDe = (c, nivel, SPELLS) => [...new Set([...(c.spellcasting?.prepared ?? []), ...(c.spellcasting?.livro ?? [])])]
  .filter((id) => SPELLS[id]?.level === nivel);

/**
 * A escolha PADRÃO da Maestria em Magia: uma de 1º e uma de 2º círculo, pelas preferências, entre as que o mago já conhece
 * (ou, faltando, a preferida mesmo). O jogo ainda não tem tela para esta escolha; a tela, quando vier, grava `c.maestriaDeMagia`.
 */
export function escolherMaestria(c, SPELLS) {
  const out = [];
  for (const nivel of [1, 2]) {
    const sabe = conhecidasDe(c, nivel, SPELLS);
    const pref = PREFERIDAS_DA_MAESTRIA[nivel].find((id) => sabe.includes(id)) ?? sabe[0] ?? PREFERIDAS_DA_MAESTRIA[nivel].find((id) => SPELLS[id]);
    if (pref) out.push(pref);
  }
  return out;
}

/** As duas Magias de Assinatura (3º círculo), por padrão; cada uma com o seu recurso de uma vez por descanso curto. */
export function escolherAssinaturas(c, SPELLS) {
  const sabe = conhecidasDe(c, 3, SPELLS);
  const ordem = [...PREFERIDAS_DA_ASSINATURA.filter((id) => sabe.includes(id)), ...sabe, ...PREFERIDAS_DA_ASSINATURA.filter((id) => SPELLS[id])];
  return [...new Set(ordem)].slice(0, 2);
}
