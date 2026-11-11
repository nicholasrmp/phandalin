// O INVENTÁRIO DOS ÍCONES: tudo o que o jogo pode pôr na tela pedindo um ícone, com a chave que ele pede.
//
//   node --import ./src/dev/cena-node/register.mjs src/dev/inventario-icones.mjs            # quantos, e quantos sem traço
//   node --import ./src/dev/cena-node/register.mjs src/dev/inventario-icones.mjs --lotes    # escreve os que faltam, em lotes
//
// A régua antiga era "a chave que já tinha pixel" (`art/icons.js chavesDosIcones`), e por ela o Xanathar, o Tasha e os
// talentos ficaram de fora sem ninguém ver: nada deles tinha pixel. A régua aqui é o que EXISTE no jogo — todas as
// magias, características de classe e subclasse, talentos, itens, condições e traços de raça —, e é contra ela que o
// gerador dos ícones de traço (`importar-icones-traco.mjs`), a prova (`testes-regras.mjs`) e os importadores conferem.
//
// As chaves são as que o jogo já pede: `magia-<id>` (`iconeDeMagia`), `classe-<id>` e `raca-<id>` (`iconeDeRecurso`),
// `item-<id>` (ficha e barra), a condição pelo id puro (`hud.js condChips`) e, nova, `talento-<id>` (a ficha).

import { SPELLS } from '../rules/spells.js';
import { CARACTERISTICAS } from '../rules/classes/caracteristicas.js';
import { CONDITIONS } from '../rules/conditions.js';
import { WEAPONS, ARMORS, SHIELD, ITEMS } from '../rules/equipment.js';
import { TRACOS_RACIAIS } from '../rules/racas.js';
import { TALENTOS_PHB } from '../rules/talentos-phb.js';
import { TALENTOS_DE_ORIGEM } from '../game/criacao.js';
import { chavesDosIcones } from '../art/icons.js';
import { CLASSES } from '../rules/classes/index.js';

const curto = (t, n = 110) => String(t ?? '').replace(/\s+/g, ' ').slice(0, n);

// A FAMÍLIA DE COR de cada coisa (o tema Esmalte, `art/icons.js PALETA_DO_ESMALTE`): a magia pelo dano, pela cura ou
// pela escola; a característica pela classe; o item pela raridade (a arma e a armadura comuns têm a delas); a condição
// por ser boa ou ruim; o resto pelo tipo.
const DANO_COM_COR = new Set(['fogo', 'frio', 'elétrico', 'trovejante', 'ácido', 'veneno', 'necrótico', 'radiante', 'psíquico', 'energético']);
const ESCOLA = { abjuração: 'abjuracao', adivinhação: 'adivinhacao', conjuração: 'conjuracao', encantamento: 'encantamento', evocação: 'evocacao', ilusão: 'ilusao', necromancia: 'necromancia', transmutação: 'transmutacao' };
const RARIDADE = { comum: 'comum', incomum: 'incomum', raro: 'raro', 'muito raro': 'muitoRaro', 'lendário': 'lendario', artefato: 'artefato' };
const classeDe = {};
for (const [cid, c] of Object.entries(CLASSES)) {
  const anotar = (niveis) => { for (const fs of Object.values(niveis ?? {})) for (const f of fs) classeDe[f] ??= cid; };
  anotar(c.niveis);
  for (const sub of Object.values(c.subclasse?.opcoes ?? {})) anotar(sub.niveis);
}
// BOA ou RUIM pelos efeitos que a condição declara: o que ajuda quem a carrega conta a favor, o que atrapalha, contra
const AJUDA = ['resisteTudo', 'acBonus', 'vantagemDex', 'attackedDisadvantage', 'attackedDisadvantageRanged', 'attackBonusDice', 'saveBonusDice', 'vantagemTeste', 'resiste',
  'inalcancavel', 'resisteNaoMagico', 'caMinima', 'bonusArma', 'danoNoAcerto', 'golpe', 'imuneA', 'imuneADanos', 'saveAdvantage', 'vantagemNosAtaques', 'acNaData',
  'bloqueiaMissil', 'speedBonusFt', 'danoArmaDados', 'vooFt', 'furtividadeBonus', 'semTerrenoDificil', 'saltoMult', 'vantagemSab', 'vantagemMorte', 'testeBonusDice',
  'resisteNaoMagicoTudo', 'resisteTipoDado', 'bonusDeAtaqueNaData', 'vantagemSoTesteDados', 'sobreAgua', 'resisteTudoExceto', 'atravessaVao', 'semReducaoDeDeslocamento'];
const ATRAPALHA = ['attackDisadvantage', 'attackedAdvantage', 'attackedAdvantageMelee', 'desvantagemTeste', 'incapacitated', 'autoFailSaves', 'critWithinReach', 'saveDisadvantage',
  'semCura', 'speedPenaltyFt', 'attackPenaltyDice', 'savePenaltyDice', 'semReacao', 'perdeAcao', 'vulnerabilidade', 'vulnerabilidadeTotal', 'umAtaque', 'acaoOuBonus',
  'speedHalfMagico', 'percepcaoPenalidade', 'danoNoInicio', 'desvantagemSoTeste', 'marcaDano', 'penalidadeDaData', 'semAtaqueNemMagia'];
function familiaDaCondicao(c) {
  let n = 0;
  for (const k of AJUDA) if (c[k]) n += 1;
  for (const k of ATRAPALHA) if (c[k]) n -= 1;
  if (c.speed === 0) n -= 1;
  return n > 0 ? 'boa' : n < 0 ? 'ruim' : 'efeito';
}
function familiaDaMagia(s) {
  if (s.kind === 'heal' || s.heal) return 'cura';
  if (DANO_COM_COR.has(s.damageType)) return s.damageType;
  return ESCOLA[s.school] ?? 'evocacao';
}

// a família das chaves antigas sem dado por trás: as armas da família, as ações da barra, os emblemas de classe, as
// famílias de dano do recuo de `iconeDeMagia`
const BASE = {
  espada: 'arma', adaga: 'arma', maca: 'arma', machado: 'arma', arco: 'arma', cajado: 'arma', espadaGrande: 'arma', espadaCurta: 'arma', rapieira: 'arma',
  cimitarra: 'arma', machadoGrande: 'arma', martelo: 'arma', mangual: 'arma', lanca: 'arma', foice: 'arma', besta: 'arma',
  armaduraLeve: 'armadura', armaduraMedia: 'armadura', armaduraPesada: 'armadura', escudo: 'armadura', elmo: 'armadura', manto: 'armadura', botas: 'armadura', manoplas: 'armadura',
  fogo: 'fogo', gelo: 'frio', raio: 'elétrico', cura: 'cura', luz: 'radiante', arcano: 'energético', sono: 'encantamento', bencao: 'cura',
  ficha: 'acao', mochila: 'equipamento',
};
function familiaDaBase(k) {
  if (BASE[k]) return BASE[k];
  if (k.startsWith('classe-') && CLASSES[k.slice(7)]) return k.slice(7);
  if (k.startsWith('classe-')) return classeDe[k.slice(7)] ?? 'classe';
  if (k.startsWith('raca-')) return 'raca';
  if (CONDITIONS[k]) return familiaDaCondicao(CONDITIONS[k]);
  return 'acao';
}

/** [{ chave, tipo, nome, contexto, dano, familia }] — uma linha por coisa que pede ícone. */
export function inventarioDeIcones() {
  const linhas = new Map();
  const por = (chave, tipo, nome, contexto = '', dano = null, familia = null) => {
    if (!linhas.has(chave)) linhas.set(chave, { chave, tipo, nome: nome ?? chave, contexto: curto(contexto), dano, familia });
  };
  for (const [id, s] of Object.entries(SPELLS)) {
    por(`magia-${id}`, 'magia', s.name, `${s.level === 0 ? 'truque' : `${s.level}º círculo`} · ${s.school ?? ''} · ${s.fonte ?? 'srd'} · ${s.desc ?? ''}`, s.damageType ?? null, familiaDaMagia(s));
  }
  for (const [id, c] of Object.entries(CARACTERISTICAS)) {
    const racial = Boolean(TRACOS_RACIAIS[id]);
    por(racial ? `raca-${id}` : `classe-${id}`, racial ? 'raca' : 'classe', c.nome, c.desc, null, racial ? 'raca' : (classeDe[id] ?? 'classe'));
  }
  for (const [id, t] of Object.entries(TRACOS_RACIAIS)) por(`raca-${id}`, 'raca', t.nome ?? t.name ?? id, t.desc ?? '', null, 'raca');
  for (const [id, t] of Object.entries(TALENTOS_PHB)) por(`talento-${id}`, 'talento', t.nome ?? id, t.noJogo ?? t.desc ?? '', null, 'talento');
  for (const t of TALENTOS_DE_ORIGEM) por(`talento-${t.id}`, 'talento', t.nome, t.resumo ?? '', null, 'talento');
  for (const [id, it] of Object.entries(WEAPONS)) por(`item-${id}`, 'item', it.name, it.desc ?? '', null, RARIDADE[it.raridade] ?? 'arma');
  for (const [id, it] of Object.entries(ARMORS)) por(`item-${id}`, 'item', it.name, it.desc ?? '', null, RARIDADE[it.raridade] ?? 'armadura');
  for (const [id, it] of Object.entries(ITEMS)) por(`item-${id}`, 'item', it.name, it.desc ?? it.descricao ?? '', null, RARIDADE[it.raridade] ?? 'equipamento');
  por(`item-${SHIELD.id}`, 'item', SHIELD.name, '', null, 'armadura');
  for (const [id, c] of Object.entries(CONDITIONS)) por(id, 'condicao', c.name, c.desc, null, familiaDaCondicao(c));
  // por último, o que já tinha pixel e não é nada acima: as armas da família, as ações da barra, os emblemas de classe
  // (por último porque `por` não sobrescreve, e a magia tem de entrar com o tipo de dano, que dá a cor)
  for (const k of chavesDosIcones()) por(k, k.includes('-') ? k.split('-')[0] : 'base', k, '', null, familiaDaBase(k));
  return [...linhas.values()];
}

// ---- linha de comando ------------------------------------------------------
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('inventario-icones.mjs')) {
  const fs = await import('node:fs');
  const inv = inventarioDeIcones();
  let mapa = {};
  try { mapa = JSON.parse(fs.readFileSync(new URL('../../public/icones-traco.json', import.meta.url), 'utf8')).mapa; } catch { /* sem arquivo */ }
  const faltam = inv.filter((x) => !mapa[x.chave]);
  const porTipo = {};
  for (const x of inv) {
    porTipo[x.tipo] ??= [0, 0];
    porTipo[x.tipo][0] += 1;
    if (!mapa[x.chave]) porTipo[x.tipo][1] += 1;
  }
  const iFalta = process.argv.indexOf('--faltando');
  if (iFalta > 0) {
    // o aviso dos importadores (`icones-faltando.mjs`): só o tipo pedido, e só se faltar
    const tipo = process.argv[iFalta + 1];
    const deste = faltam.filter((x) => x.tipo === tipo);
    if (deste.length) {
      console.log(`ÍCONE: ${deste.length} ${tipo === 'magia' ? 'magia(s)' : tipo === 'classe' ? 'característica(s)' : `${tipo}(s)`} sem ícone de traço (tema Obsidiana) — `
        + `ponha no de-para em src/dev/icones-traco/ e rode importar-icones-traco.mjs: ${deste.slice(0, 15).map((x) => x.chave).join(', ')}${deste.length > 15 ? '...' : ''}`);
    }
    process.exit(0);
  }
  console.log(`${inv.length} coisas pedem ícone; ${faltam.length} sem traço.`);
  for (const [t, [n, f]] of Object.entries(porTipo)) console.log(`  ${t.padEnd(9)} ${String(n).padStart(4)}  sem traço: ${f}`);
  if (process.argv.includes('--lotes')) {
    const dir = new URL('../../_referencias/game-icons/trabalho/', import.meta.url);
    fs.mkdirSync(dir, { recursive: true });
    const grupos = {};
    for (const x of faltam) (grupos[x.tipo] ??= []).push(`${x.chave}\t${x.nome} | ${x.contexto}`);
    for (const [t, ls] of Object.entries(grupos)) {
      fs.writeFileSync(new URL(`novo-${t}.tsv`, dir), ls.join('\n'));
      console.log(`  novo-${t}.tsv: ${ls.length}`);
    }
  }
}
