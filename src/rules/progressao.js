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
import { aplicarRaca, magiasRaciaisDoNivel, completarConjuracaoRacial, RACAS } from './racas.js';
import { escolherMaestria, escolherAssinaturas, aplicarInvocacoes, darMagiasDeCaracteristica } from './passivas.js';
import { SPELLS } from './spells.js';
import { completarEscolhaDoTalento, validarTalento, aplicarTalentoPhb } from './talentos-phb.js';

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
  // `terco` (Cavaleiro Místico, Trapaceiro Arcano): nada antes do 3º; depois, a linha do conjurador pleno de um TERÇO do nível,
  // arredondado para cima (3º: 2 espaços de 1º; 7º: 4+2; 13º: 4+3+2; 19º: 4+3+3+1) — a tabela do livro.
  if (tipo === 'terco') return nivel < 3 ? [0] : ESPACOS_PLENO[Math.ceil(nivel / 3)].slice();
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
/** A conjuração que vale PARA ESTE personagem: a da subclasse, se ela traz uma, senão a da classe. */
export function conjuracaoDe(c) {
  const def = CLASSES[c.classe];
  const sub = c.subclasse ? def?.subclasse?.opcoes?.[c.subclasse] : null;
  return sub?.conjuracao ?? def?.conjuracao ?? null;
}

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
  // A RAÇA antes do 1º nível: os traços, o deslocamento, a visão e o PV por nível entram na ficha, e
  // `subirNivel` cobra o PV a mais (Robustez Anã) em todo nível, e não só no primeiro.
  const racaId = aplicarRaca(c);
  if (racaId && RACAS[racaId].pvPorNivel) c.vidaPorNivel = RACAS[racaId].pvPorNivel;
  for (let n = 1; n <= nivel; n++) subirNivel(c, escolhas[n] ?? {});
  completarConjuracaoRacial(c);
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

  let talentoUsado = false;
  for (const g of ganhos) {
    if (g === 'asi') {
      // AUMENTO DE ATRIBUTO: +2 num ou +1 em dois, sem passar de 20. O padrão
      // é o atributo principal da classe, depois o segundo.
      // OU UM TALENTO do Livro do Jogador, no lugar do aumento (`talentos-phb.js`): `escolhas.talento` é o id ou
      // { id, atributo?, elemento?, ... }; o que faltar sai do padrão do talento.
      if (escolhas.talento !== undefined && escolhas.talento !== null) {
        if (escolhas.asi !== undefined) throw new Error('Escolha inválida: aumento de atributo E talento no mesmo nível.');
        const e = completarEscolhaDoTalento(c, escolhas.talento);
        validarTalento(c, e);
        aplicarTalentoPhb(c, e);
        c.escolhasFeitas.push({ nivel, tipo: 'talento', valor: e });
        talentoUsado = true;
        continue;
      }
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
      // a escolha que não sobra (as duas perícias do Arqueiro Arcano já treinadas pela origem): nada a escolher
      if (!livres.length) { addFeature(c, g); continue; }
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
      const opcoes = sub?.estilosDeLuta ?? def.estilosDeLuta ?? [];
      const ja = c.features.filter((f) => opcoes.includes(f));
      const livres = opcoes.filter((o) => !ja.includes(o));
      if (escolhas.estiloDeLuta !== undefined) validar('estiloDeLuta', escolhas.estiloDeLuta, livres);
      const estilo = escolhas.estiloDeLuta ?? decidir('estiloDeLuta', livres[0], livres);
      addFeature(c, estilo);
      if (estilo === 'defense') c.acBonusArmadura = (c.acBonusArmadura ?? 0) + 1;
    }
    addFeature(c, g);
  }

  if (escolhas.talento != null && !talentoUsado) throw new Error(`Escolha inválida: o ${nivel}º nível não dá aumento de atributo, e o talento entra no lugar dele.`);

  // Escolhas em lote que crescem com o nível: metamagia, invocações.
  for (const [tipo, tabela, opcoes] of [
    ['metamagia', def.metamagias, def.opcoesDeMetamagia],
    ['invocacoes', def.invocacoes, def.opcoesDeInvocacao],
    ['manobras', sub?.manobras, sub?.opcoesDeManobra],
    ['disciplinas', sub?.disciplinas, sub?.opcoesDeDisciplina],
    ['disparos', sub?.disparos, sub?.opcoesDeDisparo],
    ['runas', sub?.runas, sub?.opcoesDeRuna],
  ]) {
    if (!tabela) continue;
    const quer = porNivel(tabela, nivel) ?? 0;
    // As manobras do ADEPTO MARCIAL (talento) não são da classe: não contam entre as do Mestre de Batalha, e não se
    // escolhem de novo.
    const tem = c.features.filter((f) => opcoes.includes(f) && !(c.manobrasDoTalento ?? []).includes(f));
    if (quer > tem.length) {
      // Invocações têm pré-requisito de nível ou de pacto: a classe filtra.
      const livres = opcoes.filter((o) => !c.features.includes(o) && ((sub?.podeEscolher ?? def.podeEscolher)?.(o, c) ?? true));
      if (escolhas[tipo] !== undefined) validarLista(tipo, escolhas[tipo], livres, quer - tem.length);
      const novas = escolhas[tipo] ?? decidir(tipo, livres.slice(0, quer - tem.length), livres);
      for (const f of novas) addFeature(c, f);
    }
  }

  // Características que dão perícia fixa (Influência Sedutora: Enganação e
  // Persuasão).
  for (const [f, pericias] of Object.entries({ ...def.periciasDeCaracteristica, ...sub?.periciasDeCaracteristica })) {
    if (!c.features.includes(f)) continue;
    for (const p of pericias) if (!c.skills.includes(p)) c.skills.push(p);
  }
  // ...e as que ela DOBRA (o Sobrevivente do Batedor), e a resistência que ela dá (o Cortesão Elegante do Samurai: a de
  // Sabedoria, ou a próxima da lista se já a tem).
  for (const [f, pericias] of Object.entries(sub?.especializacaoDeCaracteristica ?? {})) {
    if (!c.features.includes(f)) continue;
    for (const p of pericias) if (!c.expertise.includes(p)) c.expertise.push(p);
  }
  for (const [f, lista] of Object.entries(sub?.resistenciasDeCaracteristica ?? {})) {
    if (!c.features.includes(f) || c.resistenciaDeCaracteristica?.[f]) continue;
    const nova = lista.find((h) => !c.saves.includes(h));
    if (nova) { c.saves.push(nova); (c.resistenciaDeCaracteristica ??= {})[f] = nova; }
  }

  // BÊNÇÃOS DO CONHECIMENTO (clérigo): as duas perícias de saber entram treinadas e dobradas. ACÓLITO DA NATUREZA: a perícia escolhida.
  if (c.features.includes('blessingsOfKnowledge')) {
    for (const p of c.bencaoDoSaber ?? []) {
      if (!c.skills.includes(p)) c.skills.push(p);
      if (!c.expertise.includes(p)) c.expertise.push(p);
    }
  }
  if (c.features.includes('acolyteOfNature') && c.acolitoPericia && !c.skills.includes(c.acolitoPericia)) c.skills.push(c.acolitoPericia);

  // MAESTRIA EM MAGIA (mago, 18º) e MAGIAS DE ASSINATURA (20º): a escolha padrão sai aqui; a tela, quando existir, grava as suas.
  if (c.features.includes('spellMastery') && !c.maestriaDeMagia) c.maestriaDeMagia = escolherMaestria(c, SPELLS);
  if (c.features.includes('signatureSpells') && !c.magiasAssinatura) {
    c.magiasAssinatura = escolherAssinaturas(c, SPELLS).map((m) => ({ magia: m, recurso: `assinatura_${m}` }));
    for (const a of c.magiasAssinatura) {
      c.resourcesMax[a.recurso] = 1;
      c.resources[a.recurso] = 1;
      if (c.spellcasting && !c.spellcasting.prepared.includes(a.magia)) c.spellcasting.prepared.push(a.magia);
    }
  }

  // PONTOS DE VIDA: no 1º nível o dado inteiro; depois, a média do dado
  // (a regra fixa do SRD, que o jogo usa em vez de rolar). Constituição
  // conta em todo nível — e o aumento de CON conta retroativamente, como na
  // regra: recalculado a cada nível em vez de somado só daqui para a frente.
  recalcularVida(c);
  c.proficiency = proficiencyBonus(nivel);

  // As ARMAS que uma característica dá (o Raio de Sol da Alma Solar) e o TREINO das armas escolhidas (as armas kensei).
  // ASPECTO ASCENDENTE (Dragão Ascendente, 17º): percepção às cegas de 3 m. NATUREZA IMORTAL (Imortal, 10º): o fôlego sem fim.
  if (c.features.includes('ascendantAspect')) c.senses = { ...(c.senses ?? {}), blindsightFt: Math.max(c.senses?.blindsightFt ?? 0, 10) };
  if (c.features.includes('undyingNature')) c.respiraNaAgua = true;
  // DÁDIVA DO MAR (Insondável): nado de 12 m e respirar debaixo da água
  if (c.features.includes('giftOfTheSea')) {
    c.speeds = { ...(c.speeds ?? {}), swimFt: Math.max(c.speeds?.swimFt ?? 0, 40) };
    c.respiraNaAgua = true;
  }
  // (uma arma, ou a lista: a Lâmina Psíquica de perto e arremessada)
  for (const [f, armas] of Object.entries(sub?.armasDeCaracteristica ?? {})) {
    if (!c.features.includes(f)) continue;
    for (const arma of [].concat(armas)) {
      if (!c.weapons.includes(arma)) c.weapons.push(arma);
      if (!c.weaponTraining.includes(arma)) c.weaponTraining.push(arma);
    }
  }
  for (const a of sub?.treinoDoCampo ? c[sub.treinoDoCampo] ?? [] : []) if (!c.weaponTraining.includes(a)) c.weaponTraining.push(a);
  // Treino da subclasse (Domínio da Vida dá armadura pesada, por exemplo).
  for (const t of sub?.armaduras ?? []) if (!c.armorTraining.includes(t)) c.armorTraining.push(t);
  for (const t of sub?.armas ?? []) if (!c.weaponTraining.includes(t)) c.weaponTraining.push(t);

  // ESCALAS: o que cresce com o nível sem ser característica nova — dado do
  // Ataque Furtivo, dano da Fúria, dado de Artes Marciais.
  for (const [chave, fn] of Object.entries({ ...def.escalas, ...sub?.escalas })) c[chave] = fn(nivel, c);

  // RECURSOS com cargas: o máximo acompanha o nível, e subir SOMA o que o
  // nível novo acrescenta — não devolve o que já foi gasto. Encher tudo fazia
  // do nível-up um descanso longo de graça, e era isso que escondia a
  // dificuldade das masmorras: medido na mansão, a cadeia fechava em 88-95%
  // com o enchimento e em 75-86% sem ele.
  for (const [chave, fn] of Object.entries({ ...def.recursos, ...sub?.recursos })) {
    // O dado de superioridade do ADEPTO MARCIAL soma aos da classe (o livro), e o máximo da classe não o apaga.
    const max = fn(nivel, c) + (chave === 'superiorityDice' ? (c.dadosDeSuperioridadeDoTalento ?? 0) : 0);
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
  // A SUBCLASSE pode trazer a conjuração (Cavaleiro Místico e Trapaceiro Arcano conjuram com um terço do nível).
  const conjDaVez = sub?.conjuracao ?? def.conjuracao;
  if (conjDaVez && (c.features.includes('spellcasting') || c.features.includes('pactMagic'))) {
    const conj = conjDaVez;
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
    // (a Alma Divina dá uma por afinidade: a tabela é função do personagem)
    const doDominio = typeof sub?.magiasDoDominio === 'function' ? sub.magiasDoDominio(c) : sub?.magiasDoDominio;
    const extras = doDominio ?? sub?.magiasDoCirculo?.[c.terrenoDoCirculo];
    if (extras) {
      c.spellcasting.sempreProntas = Object.entries(extras)
        .filter(([n]) => nivel >= Number(n))
        .flatMap(([, magias]) => magias);
    }
  }

  // MAGIAS RACIAIS por nível (Legado Infernal, Magia Drow): cada uma uma vez por descanso longo.
  magiasRaciaisDoNivel(c, nivel);
  aplicarInvocacoes(c, SPELLS);
  darMagiasDeCaracteristica(c, SPELLS);

  c.ac = armorClass(c);
  return { pendentes };
}

/**
 * O PV MÁXIMO do nível em que o herói está, do zero: o dado inteiro no 1º, a média depois, a Constituição em todo nível
 * e o que vem por fora (`bonusDeVida`). É a conta de `subirNivel`, exposta para quem muda a ficha depois dele (o talento
 * do humano variante, que entra no 1º nível e pode mexer na Constituição ou ser o Vigoroso).
 */
export function recalcularVida(c) {
  const dado = CLASSES[c.classe].dadoDeVida;
  const nivel = c.level;
  // Piso de 1: salvaguarda contra CON absurda, não regra do SRD.
  c.maxHp = Math.max(1, dado + (nivel - 1) * mediaDoDado(dado) + nivel * abilityMod(c.abilities.con) + bonusDeVida(c, nivel));
  return c.maxHp;
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
  // VIGOROSO (o talento de origem e o Robusto do Livro do Jogador, o mesmo): +2 por nível, os de antes inclusive. Antes
  // o +2 entrava só na criação, e o recálculo do nível 2 o apagava.
  return (c.features.includes('draconicResilience') ? nivel : 0) + nivel * (c.vidaPorNivel ?? 0)
    + ((c.talentos ?? []).includes('vigoroso') ? 2 * nivel : 0);
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
