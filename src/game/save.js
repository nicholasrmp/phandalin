// Salvar e carregar a campanha no solo (MULTIJOGADOR.md, seção 4, S-01…S-12).
//
// Este arquivo NÃO toca a tela nem o `localStorage` direto: o armazenamento
// entra por parâmetro (`criarArmazenamento(storage)`), para os testes rodarem
// em Node com um armazém falso, inclusive um que estoura a cota.
//
// O QUE É UM SAVE. O combate não é salvável (S-04: o `Encounter` guarda
// funções); o ponto de save é a TRANSIÇÃO de cena. Carregar reentra na cena
// com o `config` guardado e os heróis guardados, e as cenas já são
// idempotentes por causa dos blocos `salvo` (`salvo.portas ??= []`). Por isso
// o save diz ONDE o grupo está:
//   { tipo: 'cena' }              no início de uma cena (o `config` manda)
//   { tipo: 'vila', chegando }    na tela de Phandalin
//   { tipo: 'regiao', onde }      no mapa da região, parado em `onde`
// A vila e a região são telas, sem `Encounter`; o `config` delas é só o da
// última cena, para o "Novo encontro" e para a viagem continuar do que era.

export const VERSAO_ATUAL = 1;
export const PREFIXO = 'phandalin:save:';
export const CHAVE_JOGADOR = 'phandalin:jogador';

/** S-06: três autosaves rotativos e três manuais. */
export const SLOTS_AUTO = ['auto-1', 'auto-2', 'auto-3'];
export const SLOTS_MANUAIS = ['manual-1', 'manual-2', 'manual-3'];
export const TODOS_OS_SLOTS = [...SLOTS_AUTO, ...SLOTS_MANUAIS];

/** Limites do que um save pode conter: um arquivo importado é entrada hostil (S-09). */
export const MAX_HEROIS = 12;
export const MAX_NOME = 80;
export const MAX_BYTES_DO_SAVE = 1_500_000;

// ---------------------------------------------------------------- JSON puro --

/**
 * Lista o que NÃO sobrevive a `JSON.parse(JSON.stringify(x))`: função, Map,
 * Set, classe, `undefined` num campo, NaN/Infinity e referência circular.
 * `JSON.stringify` perde isso em silêncio (Map vira `{}`), e foi por isso que
 * o S-12 pede a ida e volta: um save que "salva" e volta diferente é pior que
 * nenhum.
 */
export function problemasDeJson(valor, caminho = '$', vistos = new Set()) {
  const achados = [];
  const t = typeof valor;
  if (valor === null || t === 'string' || t === 'boolean') return achados;
  if (t === 'number') {
    if (!Number.isFinite(valor)) achados.push(`${caminho}: número não finito (${valor})`);
    return achados;
  }
  if (t === 'undefined') { achados.push(`${caminho}: undefined`); return achados; }
  if (t === 'function' || t === 'symbol' || t === 'bigint') { achados.push(`${caminho}: ${t}`); return achados; }
  if (vistos.has(valor)) { achados.push(`${caminho}: referência circular`); return achados; }
  vistos.add(valor);
  if (Array.isArray(valor)) {
    valor.forEach((v, i) => achados.push(...problemasDeJson(v, `${caminho}[${i}]`, vistos)));
  } else {
    const proto = Object.getPrototypeOf(valor);
    if (proto !== Object.prototype && proto !== null) {
      achados.push(`${caminho}: ${valor.constructor?.name ?? 'objeto'} não é objeto simples`);
    } else {
      for (const [k, v] of Object.entries(valor)) {
        // `undefined` num campo some no JSON: a ida e volta deixaria de ser igual.
        if (v === undefined) achados.push(`${caminho}.${k}: undefined`);
        else achados.push(...problemasDeJson(v, `${caminho}.${k}`, vistos));
      }
    }
  }
  vistos.delete(valor);
  return achados;
}

const copiar = (v) => JSON.parse(JSON.stringify(v));

/**
 * `JSON.parse` que joga fora a chave `__proto__`: num arquivo importado ela
 * viraria propriedade própria e, num `Object.assign` ou merge do jogo, trocaria
 * o protótipo do alvo.
 */
export const lerJson = (texto) => JSON.parse(texto, (k, v) => (k === '__proto__' ? undefined : v));

// ------------------------------------------------------------------ montar --

/**
 * Monta o registro de um save (S-05). Recusa o que não é JSON puro em vez de
 * salvar pela metade. Devolve `{ ok: true, save }` ou `{ ok: false, erro }`.
 */
export function montarSave({
  id, nome, tipo = 'auto', criadoEm, agora, tempoDeJogo = 0,
  config, local = { tipo: 'cena' }, campanha, herois, xpPendente = null, jogadores = [],
}) {
  // `continuarCom` são os próprios heróis, guardados abaixo (S-05).
  const { continuarCom: _heroisDoConfig, ...configLimpo } = config ?? {};
  const aventura = typeof configLimpo.aventura === 'string' ? configLimpo.aventura
    : configLimpo.aventura?.id ?? 'mina-perdida';
  const bruto = {
    versao: VERSAO_ATUAL,
    id,
    nome: String(nome ?? 'Campanha').slice(0, MAX_NOME),
    tipo,
    criadoEm: criadoEm ?? agora,
    atualizadoEm: agora,
    tempoDeJogo: Math.round(tempoDeJogo),
    aventura,
    config: configLimpo,
    local,
    campanha: campanha ?? {},
    herois,
    xpPendente: xpPendente ?? null,
    jogadores,
  };
  const problemas = problemasDeJson(bruto);
  if (problemas.length) {
    return { ok: false, erro: `Não dá para salvar: ${problemas.slice(0, 3).join('; ')}${problemas.length > 3 ? '…' : ''}` };
  }
  return { ok: true, save: copiar(bruto) };
}

// ---------------------------------------------------------------- validar --

const ehObjeto = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const finito = (v) => typeof v === 'number' && Number.isFinite(v);
const texto = (v) => typeof v === 'string' && v.length > 0;

/** A versão, antes de qualquer outra coisa: é ela que diz se dá para migrar. */
function validarVersao(s) {
  if (!ehObjeto(s)) return { ok: false, erro: 'O arquivo não é um save do Phandalin.' };
  if (!Number.isInteger(s.versao) || s.versao < 1) return { ok: false, erro: 'O save não diz de que versão é.', versaoRuim: true };
  if (s.versao > VERSAO_ATUAL) {
    return { ok: false, nova: true, erro: `Este save é de uma versão mais nova do jogo (${s.versao}); esta é a ${VERSAO_ATUAL}. Atualize o jogo para abri-lo.` };
  }
  return { ok: true };
}

/**
 * S-10. Confere o formato, tipo por tipo, SEM mexer em nada. Quem carrega um
 * save acredita no que ele diz (`level`, `hp`, os heróis), então um número
 * fora de faixa ou uma chave faltando aqui vira travamento lá. Recusa com a
 * mensagem para o jogador.
 */
export function validarSave(s) {
  const v = validarVersao(s);
  if (!v.ok) return v;
  if (!texto(s.nome) || s.nome.length > MAX_NOME) return { ok: false, erro: 'O save está sem nome, ou com um nome grande demais.' };
  for (const k of ['criadoEm', 'atualizadoEm', 'tempoDeJogo']) {
    if (!finito(s[k]) || s[k] < 0) return { ok: false, erro: `O save tem ${k} inválido.` };
  }
  if (!Array.isArray(s.herois) || s.herois.length === 0) return { ok: false, erro: 'O save não tem nenhum herói.' };
  if (s.herois.length > MAX_HEROIS) return { ok: false, erro: `O save tem heróis demais (${s.herois.length}).` };
  for (const [i, h] of s.herois.entries()) {
    if (!ehObjeto(h)) return { ok: false, erro: `O herói ${i + 1} do save está quebrado.` };
    const quem = typeof h.name === 'string' ? h.name : i + 1;
    const ruim = [
      ['id', texto(h.id)], ['name', texto(h.name)], ['classe', texto(h.classe)],
      ['level', Number.isInteger(h.level) && h.level >= 1 && h.level <= 20],
      ['maxHp', finito(h.maxHp) && h.maxHp >= 1],
      ['hp', finito(h.hp) && h.hp <= h.maxHp * 2],
      ['abilities', ehObjeto(h.abilities)],
      ['weapons', Array.isArray(h.weapons)],
      ['conditions', Array.isArray(h.conditions)],
    ].filter(([, ok]) => !ok).map(([k]) => k);
    if (ruim.length) return { ok: false, erro: `O herói ${quem} está incompleto ou quebrado no save (${ruim.join(', ')}).` };
  }
  if (!ehObjeto(s.config)) return { ok: false, erro: 'O save não diz qual cena abrir.' };
  if (!ehObjeto(s.campanha)) return { ok: false, erro: 'O save não tem o estado da campanha.' };
  if (s.xpPendente != null && !ehObjeto(s.xpPendente)) return { ok: false, erro: 'O XP pendente do save está quebrado.' };
  if (s.jogadores != null && !Array.isArray(s.jogadores)) return { ok: false, erro: 'A lista de jogadores do save está quebrada.' };
  const loc = s.local ?? { tipo: 'cena' };
  if (!ehObjeto(loc) || !['cena', 'vila', 'regiao'].includes(loc.tipo)) return { ok: false, erro: `Lugar desconhecido no save: ${loc?.tipo}.` };
  if (loc.tipo === 'regiao' && typeof loc.onde !== 'string') return { ok: false, erro: 'O save diz que o grupo está na região, mas não onde.' };
  return { ok: true };
}

// ---------------------------------------------------------------- migrar --

/**
 * S-07. Uma função por salto de versão (`MIGRACOES[n]` leva de n para n+1).
 * Hoje só existe a versão 1: a tabela fica vazia de propósito, e o teste
 * confere que ela cobre todos os saltos até `VERSAO_ATUAL`.
 */
export const MIGRACOES = {};

export function migrar(s) {
  let atual = copiar(s);
  while (atual.versao < VERSAO_ATUAL) {
    const passo = MIGRACOES[atual.versao];
    if (!passo) throw new Error(`Falta a migração da versão ${atual.versao} do save.`);
    atual = passo(atual);
    atual.versao += 1;
  }
  atual.local ??= { tipo: 'cena' };
  return atual;
}

/**
 * A porta única de entrada de um save lido de fora (armazém ou arquivo):
 * confere a versão, MIGRA e só então valida o formato — o formato que se
 * valida é o atual, e um save antigo só chega a ele depois de migrado.
 * Devolve `{ ok, save }` ou `{ ok: false, erro, nova? }`.
 */
export function prepararSave(obj) {
  const v = validarVersao(obj);
  if (!v.ok) return v;
  let migrado;
  try { migrado = migrar(obj); } catch (e) { return { ok: false, erro: e.message }; }
  const f = validarSave(migrado);
  return f.ok ? { ok: true, save: migrado } : f;
}

// ---------------------------------------------------------- armazenamento --

const guardar = (storage, chave, conteudo) => {
  try { storage.setItem(chave, conteudo); return null; } catch (e) { return e?.name === 'QuotaExceededError' ? 'cota' : (e?.message ?? 'erro'); }
};

/**
 * O armazém de saves sobre um `storage` com a interface do `localStorage`
 * (S-08). `agora()` entra por parâmetro para o teste ser exato.
 */
export function criarArmazenamento(storage, { agora = () => Date.now() } = {}) {
  const chave = (slot) => `${PREFIXO}${slot}`;

  /** `null` se o slot está vazio; `{ slot, save }` se válido; `{ slot, erro, nova? }` se não abre. */
  function ler(slot) {
    let conteudo;
    try { conteudo = storage.getItem(chave(slot)); } catch { return null; }
    if (conteudo == null) return null;
    let obj;
    try { obj = lerJson(conteudo); } catch { return { slot, erro: 'O save está corrompido.', corrompido: true }; }
    const p = prepararSave(obj);
    return p.ok ? { slot, save: p.save } : { slot, erro: p.erro, nova: Boolean(p.nova) };
  }

  /** Todos os slots que têm algo, do mais recente para o mais antigo. */
  function listar() {
    return TODOS_OS_SLOTS.map(ler).filter(Boolean)
      .sort((a, b) => (b.save?.atualizadoEm ?? 0) - (a.save?.atualizadoEm ?? 0));
  }

  const maisRecente = () => listar().find((r) => r.save) ?? null;

  /**
   * O slot do próximo autosave: o vazio; senão o corrompido (não há o que
   * perder); senão o MAIS ANTIGO dos válidos. Um save de versão mais nova NUNCA
   * é candidato: é de uma build que o jogador ainda vai querer. `null` se os
   * três são assim.
   */
  function proximoSlotAuto() {
    let corrompido = null;
    let antigo = null;
    for (const slot of SLOTS_AUTO) {
      const r = ler(slot);
      if (!r) return slot;
      if (r.corrompido) corrompido ??= slot;
      else if (r.save && (!antigo || r.save.atualizadoEm < antigo.t)) antigo = { slot, t: r.save.atualizadoEm };
    }
    return corrompido ?? antigo?.slot ?? null;
  }

  /**
   * Grava. `atualizadoEm` nunca fica abaixo do de um save que já existe: o
   * relógio do navegador pode voltar, e dois saves no mesmo milissegundo são
   * comuns (entrar na cena e ganhar XP). Sem isto o "mais antigo" erraria e o
   * autosave pisaria no save mais novo. Se a gravação falhar (cota cheia,
   * armazém bloqueado), o slot anterior continua como estava: `setItem` que
   * lança não troca o valor.
   */
  function gravar(slot, save) {
    if (!TODOS_OS_SLOTS.includes(slot)) return { ok: false, erro: `Slot desconhecido: ${slot}.` };
    const v = validarSave(save);
    if (!v.ok) return { ok: false, erro: v.erro };
    const problemas = problemasDeJson(save);
    if (problemas.length) return { ok: false, erro: `Não dá para salvar: ${problemas[0]}.` };
    const outros = TODOS_OS_SLOTS.filter((s) => s !== slot).map(ler).filter((r) => r?.save);
    const teto = Math.max(0, ...outros.map((r) => r.save.atualizadoEm));
    const registro = {
      ...save,
      id: slot,
      tipo: slot.startsWith('auto') ? 'auto' : 'manual',
      atualizadoEm: Math.max(save.atualizadoEm, teto + 1),
    };
    let conteudo;
    try { conteudo = JSON.stringify(registro); } catch (e) { return { ok: false, erro: `Não dá para salvar: ${e.message}.` }; }
    if (conteudo.length > MAX_BYTES_DO_SAVE) return { ok: false, erro: 'O save é grande demais para ser guardado.' };
    const erro = guardar(storage, chave(slot), conteudo);
    if (erro === 'cota') return { ok: false, erro: 'O navegador está sem espaço para guardar o jogo. O save anterior foi mantido.' };
    if (erro) return { ok: false, erro: `Não consegui guardar o jogo (${erro}). O save anterior foi mantido.` };
    return { ok: true, slot };
  }

  function autosalvar(save) {
    const slot = proximoSlotAuto();
    if (!slot) return { ok: false, erro: 'Os três espaços automáticos guardam jogos de uma versão mais nova do jogo; apague um para salvar.' };
    return gravar(slot, save);
  }

  function apagar(slot) {
    try { storage.removeItem(chave(slot)); return true; } catch { return false; }
  }

  /** Lê, valida e migra. Nunca devolve um save pela metade (S-10). */
  function carregar(slot) {
    const r = ler(slot);
    if (!r) return { ok: false, erro: 'Esse slot está vazio.' };
    if (r.erro) return { ok: false, erro: r.erro };
    return { ok: true, save: r.save, slot };
  }

  return { ler, listar, maisRecente, proximoSlotAuto, gravar, autosalvar, apagar, carregar, agora };
}

// --------------------------------------------------------- arquivo (S-09) --

export const EXTENSAO = '.phandalin.json';

const RESERVADOS = /^(con|prn|aux|nul|com\d|lpt\d)$/;

export const nomeDoArquivo = (save) => {
  let base = String(save.nome ?? 'campanha').normalize('NFD').replace(/[^\w\- ]+/g, '').trim()
    .replace(/\s+/g, '-').toLowerCase().slice(0, 60) || 'campanha';
  if (RESERVADOS.test(base)) base = `save-${base}`;
  return `${base}${EXTENSAO}`;
};

export const paraArquivo = (save) => JSON.stringify(save, null, 1);

/** Lê o texto de um arquivo importado. Valida e migra; nunca grava nada. */
export function deArquivo(conteudo) {
  let obj;
  try { obj = lerJson(conteudo); } catch { return { ok: false, erro: 'O arquivo não é um JSON válido.' }; }
  return prepararSave(obj);
}

// ------------------------------------------------------------ jogador local --

const emMemoria = new WeakMap();

/** Um id estável deste navegador, para o `jogadorId` dos heróis (S-05). */
export function jogadorLocal(storage, { novoId = () => globalThis.crypto?.randomUUID?.() ?? `j-${Math.random().toString(36).slice(2)}` } = {}) {
  // Guardar em memória também: onde o `setItem` falha (modo privado, cota),
  // sem isto cada chamada devolveria um id novo e o herói trocaria de dono.
  if (emMemoria.has(storage)) return emMemoria.get(storage);
  let id = null;
  try { id = storage.getItem(CHAVE_JOGADOR); } catch { /* sem armazém */ }
  if (!id) {
    id = novoId();
    try { storage.setItem(CHAVE_JOGADOR, id); } catch { /* fica só em memória */ }
  }
  emMemoria.set(storage, id);
  return id;
}

/** Resumo de uma linha para a lista de slots. */
export function resumoDoSave(save) {
  const h = save.herois ?? [];
  const nivel = Math.max(1, ...h.map((x) => x.level));
  const lugar = save.local?.tipo === 'vila' ? 'Phandalin'
    : save.local?.tipo === 'regiao' ? 'a estrada'
      : (save.config?.capitulo ? `capítulo ${save.config.capitulo}` : 'o começo da aventura');
  return `${h.length} herói${h.length === 1 ? '' : 's'}, nível ${nivel} · ${lugar}`;
}
