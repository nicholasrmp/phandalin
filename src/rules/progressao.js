// SRD 5.1 (CC-BY-4.0) — ver NOTICE.md
// Progressão de personagem do 1º ao 20º nível: experiência, pontos de vida,
// espaços de magia e o passo de subir de nível.
//
// A REGRA MORA NOS DADOS. Cada classe (src/rules/classes/) diz o que ganha em
// cada nível; este arquivo só sabe aplicar um nível por vez. Criar um
// personagem de 5º nível é criar o de 1º e subir quatro vezes — o mesmo
// caminho que o jogador percorre, para os dois nunca darem resultados
// diferentes.
//
// ESCOLHAS. Subir de nível às vezes pede uma decisão (subclasse, aumento de
// atributo, perícia para especializar, estilo de luta, metamagia, invocação).
// `subirNivel` aceita as escolhas prontas e, quando falta alguma, decide pelo
// padrão da classe e devolve a decisão em `pendentes` — a tela de subir de
// nível mostra o que foi decidido e deixa trocar; o simulador de equilíbrio
// aceita o padrão.

import { ABILITIES, SKILLS, abilityMod, proficiencyBonus } from './abilities.js';
import { armorClass } from './equipment.js';
import { CLASSES } from './classes/index.js';

export const NIVEL_MAXIMO = 20;

/** XP acumulado para chegar a cada nível (índice = nível). */
export const XP_POR_NIVEL = [
  0, 0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
  85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000,
];

/** O nível que um total de XP alcança. */
export function nivelPorXp(xp) {
  let n = 1;
  while (n < NIVEL_MAXIMO && xp >= XP_POR_NIVEL[n + 1]) n += 1;
  return n;
}

/** Quanto falta de XP para o próximo nível (0 no 20º). */
export const xpParaProximo = (c) => (c.level >= NIVEL_MAXIMO ? 0 : Math.max(0, XP_POR_NIVEL[c.level + 1] - (c.xp ?? 0)));

/**
 * Espaços de magia do conjurador pleno, por nível de conjurador (SRD).
 * Índice da linha = nível de conjurador; índice da coluna = círculo.
 */
const ESPACOS_PLENO = [
  null,
  [0, 2], [0, 3], [0, 4, 2], [0, 4, 3], [0, 4, 3, 2],
  [0, 4, 3, 3], [0, 4, 3, 3, 1], [0, 4, 3, 3, 2], [0, 4, 3, 3, 3, 1], [0, 4, 3, 3, 3, 2],
  [0, 4, 3, 3, 3, 2, 1], [0, 4, 3, 3, 3, 2, 1], [0, 4, 3, 3, 3, 2, 1, 1], [0, 4, 3, 3, 3, 2, 1, 1],
  [0, 4, 3, 3, 3, 2, 1, 1, 1], [0, 4, 3, 3, 3, 2, 1, 1, 1], [0, 4, 3, 3, 3, 2, 1, 1, 1, 1],
  [0, 4, 3, 3, 3, 3, 1, 1, 1, 1], [0, 4, 3, 3, 3, 3, 2, 1, 1, 1], [0, 4, 3, 3, 3, 3, 2, 2, 1, 1],
];

/**
 * Espaços de magia de uma classe num nível.
 *
 * - `plena` (bardo, clérigo, druida, feiticeiro, mago): a tabela inteira.
 * - `meia` (paladino, patrulheiro): nada no 1º nível; do 2º em diante, a
 *   linha do conjurador pleno de metade do nível, arredondado para cima — é
 *   exatamente a tabela do paladino no SRD.
 * - `pacto` (bruxo): poucos espaços, todos do mesmo círculo, que voltam no
 *   descanso curto (ver `espacosDePacto`).
 */
export function espacosDeMagia(tipo, nivel) {
  if (tipo === 'plena') return ESPACOS_PLENO[nivel].slice();
  if (tipo === 'meia') return nivel < 2 ? [0] : ESPACOS_PLENO[Math.ceil(nivel / 2)].slice();
  if (tipo === 'pacto') {
    const { espacos, circulo } = espacosDePacto(nivel);
    const linha = Array(circulo + 1).fill(0);
    linha[circulo] = espacos;
    return linha;
  }
  return [0];
}

/** Magia de pacto do bruxo: quantos espaços e de que círculo (SRD). */
export function espacosDePacto(nivel) {
  const espacos = nivel >= 17 ? 4 : nivel >= 11 ? 3 : nivel >= 2 ? 2 : 1;
  const circulo = nivel >= 9 ? 5 : nivel >= 7 ? 4 : nivel >= 5 ? 3 : nivel >= 3 ? 2 : 1;
  return { espacos, circulo };
}

/** Média arredondada para cima de um dado de vida: d8 → 5, d10 → 6. */
export const mediaDoDado = (faces) => faces / 2 + 1;

/** O valor que cabe numa tabela por nível: a última entrada até o nível. */
export function porNivel(tabela, nivel) {
  let valor = null;
  for (const [n, v] of Object.entries(tabela)) if (nivel >= Number(n)) valor = v;
  return valor;
}

/**
 * Cria um personagem já no nível pedido.
 *
 * `base` traz o que não é de classe: id, nome, ancestralidade, aparência,
 * atributos (já com os bônus de ancestralidade), equipamento e as perícias
 * escolhidas. `escolhas` é um mapa por nível com as decisões de cada um
 * (`{ 3: { subclasse: 'campeao' }, 4: { asi: { str: 2 } } }`); o que faltar
 * sai do padrão da classe.
 */
export function criarPersonagem(base, { classe, nivel = 1, escolhas = {} } = {}) {
  const def = CLASSES[classe];
  if (!def) throw new Error(`Classe desconhecida: "${classe}"`);
  if (!Number.isInteger(nivel) || nivel < 1 || nivel > NIVEL_MAXIMO) {
    throw new RangeError(`Nível fora de 1–${NIVEL_MAXIMO}: ${nivel}`);
  }
  // Cópia funda: dois personagens criados da mesma base não podem dividir os
  // espaços de magia nem a lista de armas.
  base = structuredClone(base);
  const c = {
    kind: 'pc',
    side: 'party',
    level: 0,
    xp: 0,
    classe,
    subclasse: null,
    conditions: [],
    tempHp: 0,
    deathSaves: { successes: 0, failures: 0 },
    stable: false,
    dead: false,
    features: [],
    resources: {},
    resourcesMax: {},
    maxHp: 0,
    saves: def.resistencias.slice(),
    armorTraining: def.armaduras.slice(),
    weaponTraining: def.armas.slice(),
    skills: [],
    expertise: [],
    escolhasFeitas: [],
    ...base,
    abilities: { ...base.abilities },
  };
  c.skills = [...(base.skills ?? [])];
  c.expertise = [...(base.expertise ?? [])];
  for (let n = 1; n <= nivel; n++) subirNivel(c, escolhas[n] ?? {});
  c.xp = Math.max(c.xp ?? 0, XP_POR_NIVEL[c.level]);
  c.hp = c.maxHp;
  c.equippedWeapon ??= c.weapons?.[0];
  return c;
}

/**
 * Sobe UM nível. Aplica tudo que a classe dá nele — pontos de vida,
 * proficiência, características, escalas, recursos, espaços de magia — e
 * devolve as decisões que foram tomadas pelo padrão, para a tela mostrar.
 */
export function subirNivel(c, escolhas = {}) {
  const def = CLASSES[c.classe];
  if (c.level >= NIVEL_MAXIMO) return { pendentes: [] };
  const nivel = c.level + 1;
  c.level = nivel;
  const pendentes = [];
  const decidir = (tipo, valor, opcoes = null) => {
    pendentes.push({ nivel, tipo, valor, opcoes });
    c.escolhasFeitas.push({ nivel, tipo, valor });
    return valor;
  };

  // SUBCLASSE: escolhida no nível que a classe manda; a partir daí os níveis
  // dela entram junto com os da classe.
  if (nivel === def.subclasse.nivel && !c.subclasse) {
    const opcoes = Object.keys(def.subclasse.opcoes);
    if (escolhas.subclasse !== undefined) validar('subclasse', escolhas.subclasse, opcoes);
    c.subclasse = escolhas.subclasse ?? decidir('subclasse', opcoes[0], opcoes);
  }
  const sub = c.subclasse ? def.subclasse.opcoes[c.subclasse] : null;
  const ganhos = [...(def.niveis[nivel] ?? []), ...(sub?.niveis?.[nivel] ?? [])];

  for (const g of ganhos) {
    if (g === 'asi') {
      // AUMENTO DE ATRIBUTO: +2 num ou +1 em dois, sem passar de 20. O padrão
      // é o atributo principal da classe, depois o segundo.
      if (escolhas.asi !== undefined) validarAsi(escolhas.asi, c);
      const asi = escolhas.asi ?? decidir('asi', asiPadrao(c, def));
      for (const [k, v] of Object.entries(asi)) c.abilities[k] = Math.min(20, c.abilities[k] + v);
      continue;
    }
    if (g === 'expertise') {
      // ESPECIALIZAÇÃO: dobra a proficiência em duas perícias já treinadas.
      const livres = c.skills.filter((s) => !c.expertise.includes(s));
      if (escolhas.expertise !== undefined) validarLista('expertise', escolhas.expertise, livres, 2);
      const escolha = escolhas.expertise ?? decidir('expertise', livres.slice(0, 2), livres);
      c.expertise.push(...escolha);
    }
    // ESCOLHA DENTRO DE UMA CARACTERÍSTICA: o pacto do bruxo, as táticas do
    // Caçador, a ancestralidade dracônica. A classe (ou subclasse) declara as
    // opções; com `campo`, a escolha vira um valor no personagem em vez de
    // característica.
    // Em lista (Inimigo Favorito, Explorador Natural), o que já foi escolhido
    // sai das opções: cada nível acrescenta um tipo NOVO. Com `quantas`, a
    // escolha é de várias de uma vez (as 3 perícias do Colégio do
    // Conhecimento). `opcoes` pode ser função do personagem.
    const escolha = sub?.escolhasDeGanho?.[g] ?? def.escolhasDeGanho?.[g];
    if (escolha) {
      const todas = typeof escolha.opcoes === 'function' ? escolha.opcoes(c) : escolha.opcoes;
      const ja = escolha.lista ? (c[escolha.campo] ?? []) : [];
      const livres = todas.filter((o) => !ja.includes(o));
      const quantas = escolha.quantas ?? 1;
      if (escolhas[g] !== undefined) {
        if (quantas > 1) validarLista(g, escolhas[g], livres, quantas);
        else validar(g, escolhas[g], livres);
      }
      const padrao = quantas > 1 ? livres.slice(0, quantas) : livres[0];
      const valor = escolhas[g] ?? decidir(g, padrao, livres);
      const valores = Array.isArray(valor) ? valor : [valor];
      if (escolha.campo) {
        if (escolha.lista) (c[escolha.campo] ??= []).push(...valores.filter((v) => !c[escolha.campo].includes(v)));
        else c[escolha.campo] = valor;
      } else valores.forEach((v) => addFeature(c, v));
    }
    if (g === 'primalChampion') {
      // Campeão Primitivo: +4 em FOR e CON, e o teto desses dois vai a 24.
      c.abilities.str = Math.min(24, c.abilities.str + 4);
      c.abilities.con = Math.min(24, c.abilities.con + 4);
    }
    if (g === 'fightingStyle' || g === 'additionalFightingStyle') {
      const opcoes = def.estilosDeLuta ?? [];
      const ja = c.features.filter((f) => opcoes.includes(f));
      const livres = opcoes.filter((o) => !ja.includes(o));
      if (escolhas.estiloDeLuta !== undefined) validar('estiloDeLuta', escolhas.estiloDeLuta, livres);
      const estilo = escolhas.estiloDeLuta ?? decidir('estiloDeLuta', livres[0], livres);
      addFeature(c, estilo);
      if (estilo === 'defense') c.acBonusArmadura = (c.acBonusArmadura ?? 0) + 1;
    }
    addFeature(c, g);
  }

  // Escolhas em lote que crescem com o nível: metamagia, invocações.
  for (const [tipo, tabela, opcoes] of [
    ['metamagia', def.metamagias, def.opcoesDeMetamagia],
    ['invocacoes', def.invocacoes, def.opcoesDeInvocacao],
  ]) {
    if (!tabela) continue;
    const quer = porNivel(tabela, nivel) ?? 0;
    const tem = c.features.filter((f) => opcoes.includes(f));
    if (quer > tem.length) {
      // Invocações têm pré-requisito de nível ou de pacto: a classe filtra.
      const livres = opcoes.filter((o) => !tem.includes(o) && (def.podeEscolher?.(o, c) ?? true));
      if (escolhas[tipo] !== undefined) validarLista(tipo, escolhas[tipo], livres, quer - tem.length);
      const novas = escolhas[tipo] ?? decidir(tipo, livres.slice(0, quer - tem.length), livres);
      for (const f of novas) addFeature(c, f);
    }
  }

  // Características que dão perícia fixa (Influência Sedutora: Enganação e
  // Persuasão).
  for (const [f, pericias] of Object.entries(def.periciasDeCaracteristica ?? {})) {
    if (!c.features.includes(f)) continue;
    for (const p of pericias) if (!c.skills.includes(p)) c.skills.push(p);
  }

  // PONTOS DE VIDA: no 1º nível o dado inteiro; depois, a média do dado
  // (a regra fixa do SRD, que o jogo usa em vez de rolar). Constituição
  // conta em todo nível — e o aumento de CON conta retroativamente, como na
  // regra: recalculado a cada nível em vez de somado só daqui para a frente.
  const con = abilityMod(c.abilities.con);
  const dado = def.dadoDeVida;
  // Piso de 1: salvaguarda contra CON absurda, não regra do SRD.
  c.maxHp = Math.max(1, dado + (nivel - 1) * mediaDoDado(dado) + nivel * con + bonusDeVida(c, nivel));
  c.proficiency = proficiencyBonus(nivel);

  // Treino da subclasse (Domínio da Vida dá armadura pesada, por exemplo).
  for (const t of sub?.armaduras ?? []) if (!c.armorTraining.includes(t)) c.armorTraining.push(t);

  // ESCALAS: o que cresce com o nível sem ser característica nova — dado do
  // Ataque Furtivo, dano da Fúria, dado de Artes Marciais.
  for (const [chave, fn] of Object.entries({ ...def.escalas, ...sub?.escalas })) c[chave] = fn(nivel, c);

  // RECURSOS com cargas: o máximo acompanha o nível, e subir SOMA o que o
  // nível novo acrescenta — não devolve o que já foi gasto. Encher tudo fazia
  // do nível-up um descanso longo de graça, e era isso que escondia a
  // dificuldade das masmorras: medido na mansão, a cadeia fechava em 88-95%
  // com o enchimento e em 75-86% sem ele.
  for (const [chave, fn] of Object.entries({ ...def.recursos, ...sub?.recursos })) {
    const max = fn(nivel, c);
    if (!max) continue;
    // Ilimitado (Fúria e Forma Selvagem no 20º): Infinity não sobrevive a um
    // JSON (vira null) nem cabe num selo de cargas. Fica na lista própria, e o
    // número sai de `resources`.
    if (max === Infinity) {
      c.resourcesIlimitados = [...new Set([...(c.resourcesIlimitados ?? []), chave])];
      delete c.resourcesMax[chave];
      delete c.resources[chave];
      continue;
    }
    const maxAntes = c.resourcesMax[chave];
    c.resourcesMax[chave] = max;
    // Na CRIAÇÃO (sem máximo anterior) o personagem nasce cheio.
    c.resources[chave] = maxAntes == null
      ? max
      : Math.min(max, (c.resources[chave] ?? 0) + Math.max(0, max - maxAntes));
  }

  // CONJURAÇÃO.
  // Paladino e patrulheiro só conjuram do 2º nível em diante: o objeto de
  // conjuração nasce com a característica, não com a classe.
  if (def.conjuracao && (c.features.includes('spellcasting') || c.features.includes('pactMagic'))) {
    const conj = def.conjuracao;
    c.spellcasting ??= { ability: conj.atributo, cantrips: [], prepared: [] };
    c.spellcasting.ability = conj.atributo;
    c.spellcasting.tipo = conj.tipo;
    const espacos = espacosDeMagia(conj.tipo, nivel);
    const maxAntes = c.spellcasting.slotsMax;
    c.spellcasting.slotsMax = espacos.slice();
    // Mesma regra dos recursos: subir de nível acrescenta os espaços NOVOS e
    // não ressuscita os gastos. O livro devolve espaço no descanso longo, não
    // ao subir.
    if (!maxAntes) {
      c.spellcasting.slots = espacos.slice();
    } else {
      const atuais = c.spellcasting.slots ?? [];
      c.spellcasting.slots = espacos.map((m, i) => Math.min(
        m, (atuais[i] ?? 0) + Math.max(0, m - (maxAntes[i] ?? 0)),
      ));
    }
    // A subclasse pode somar: o Círculo da Terra dá um truque a mais, o
    // Colégio do Conhecimento dá duas magias fora do limite no 6º nível.
    c.spellcasting.truquesConhecidos = (conj.truques ? porNivel(conj.truques, nivel) : 0)
      + (porNivel(sub?.truquesExtra ?? {}, nivel) ?? 0);
    c.spellcasting.magiasConhecidas = conj.conhecidas
      ? conj.conhecidas[nivel] + (porNivel(sub?.magiasExtra ?? {}, nivel) ?? 0)
      : null;
    if (conj.tipo === 'pacto') c.spellcasting.arcanoMistico = porNivel(def.arcanoMistico, nivel) ?? [];
    // Magias do domínio, do juramento e do círculo: sempre preparadas, sem
    // ocupar vaga no limite de preparação.
    const extras = sub?.magiasDoDominio ?? sub?.magiasDoCirculo?.[c.terrenoDoCirculo];
    if (extras) {
      c.spellcasting.sempreProntas = Object.entries(extras)
        .filter(([n]) => nivel >= Number(n))
        .flatMap(([, magias]) => magias);
    }
  }

  c.ac = armorClass(c);
  return { pendentes };
}

function addFeature(c, id) {
  if (!c.features.includes(id)) c.features.push(id);
}

/**
 * Pontos de vida extras que não vêm do dado: Resiliência Dracônica (+1 por
 * nível de feiticeiro) e o que a ancestralidade dá por nível (`vidaPorNivel`,
 * o anão da colina).
 */
function bonusDeVida(c, nivel) {
  return (c.features.includes('draconicResilience') ? nivel : 0) + nivel * (c.vidaPorNivel ?? 0);
}

/**
 * O aumento de atributo padrão: os 2 pontos, um a um, no atributo principal,
 * depois no segundo, depois nos outros do maior para o menor — sem passar de
 * 20 e sem desperdiçar ponto.
 */
function asiPadrao(c, def) {
  const principais = def.atributosPrincipais;
  const resto = ABILITIES.filter((a) => !principais.includes(a)).sort((x, y) => c.abilities[y] - c.abilities[x]);
  const asi = {};
  let pontos = 2;
  for (const a of [...principais, ...resto]) {
    while (pontos > 0 && c.abilities[a] + (asi[a] ?? 0) < 20) {
      asi[a] = (asi[a] ?? 0) + 1;
      pontos -= 1;
    }
    if (!pontos) break;
  }
  return asi;
}

// ---- validação das escolhas ---------------------------------------------
//
// O caminho padrão só escolhe o que pode. Quem passa escolhas (a tela de
// subir de nível) pode passar qualquer coisa — e uma subclasse inventada ou
// um +8 de atributo entraria calado. Escolha inválida é erro, com o motivo.

function validar(tipo, valor, livres) {
  if (!livres.includes(valor)) {
    throw new Error(`Escolha inválida para ${tipo}: "${valor}". Pode: ${livres.join(', ') || 'nada'}.`);
  }
}

function validarLista(tipo, valores, livres, quantas) {
  if (!Array.isArray(valores)) throw new Error(`Escolha inválida para ${tipo}: esperava uma lista.`);
  if (valores.length > quantas) throw new Error(`Escolha inválida para ${tipo}: no máximo ${quantas}.`);
  if (new Set(valores).size !== valores.length) throw new Error(`Escolha inválida para ${tipo}: repetida.`);
  for (const v of valores) validar(tipo, v, livres);
}

function validarAsi(asi, c) {
  const chaves = Object.keys(asi ?? {});
  const soma = chaves.reduce((s, k) => s + asi[k], 0);
  const ok = chaves.length >= 1 && chaves.length <= 2 && soma === 2
    && chaves.every((k) => ABILITIES.includes(k) && Number.isInteger(asi[k]) && asi[k] > 0 && c.abilities[k] + asi[k] <= 20);
  if (!ok) throw new Error(`Aumento de atributo inválido: ${JSON.stringify(asi)} (+2 num atributo ou +1 em dois, sem passar de 20).`);
}

/** As perícias que um personagem ainda não tem (para escolhas de perícia). */
export const periciasLivres = (c) => Object.keys(SKILLS).filter((s) => !c.skills.includes(s));

/**
 * Dá XP ao personagem. Devolve quantos níveis o total novo alcança além do
 * atual — subir é uma decisão do jogador (há escolhas a fazer), então este
 * passo só avisa; quem sobe é `subirNivel`.
 */
export function ganharXp(c, xp) {
  c.xp = (c.xp ?? 0) + xp;
  return Math.max(0, nivelPorXp(c.xp) - c.level);
}

export { ABILITIES };
