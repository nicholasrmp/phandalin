// AS REGIÕES: uma área do mapa que faz alguma coisa quando alguém entra, sai, ou começa ou termina o turno nela.
//
// É a Region do Foundry VTT (v12+), trazida como DADO do mapa. Antes, cada placa de pressão, cada fosso escondido,
// cada "o chão range" era uma função nova num `capituloN.js`; agora a área é desenhada no editor (ferramenta R) e o
// motor a executa sozinho, para herói e para monstro, na luta e explorando.
//
//   { id, nome?, casas: ['x,y', ...], quando: ['entrar' | 'sair' | 'comecaTurno' | 'terminaTurno'],
//     quem?: 'todos' | 'grupo' | 'inimigos', tamanhoMinimo?: 'pequeno' | 'medio' | 'grande'..., vezes?: n, desligada?, pegaQuemVoa?,
//     escondida?: { cd, achado }, efeitos: [...] }
//
// `vezes` conta os disparos da região inteira (1 = uma vez só; sem ele, sempre). `escondida` faz dela uma ARMADILHA:
// a Percepção passiva de quem vai pisar nota antes (`game/armadilhas.js`), o Procurar acha, e a descoberta não pega
// mais o grupo — que sabe dela e passa por fora. O monstro não sabe de nada.
//
// Os EFEITOS, na ordem em que estão:
//   texto          { texto }                              o registro diz, e a tela mostra em cima de quem pisou
//   dano           { dados, dano?, teste?: { atributo, cd, metade? }, seFalhar?: condição }   `seFalhar`: quem falha no
//                  teste do dano também fica com a condição (a laje que cede: no chão), sem um segundo teste
//   condicao       { condicao, rodadas?, teste?: { atributo, cd } }
//   parar          {}                                     o passo acaba ali
//   terrenoDificil {}                                     ENQUANTO LIGADA, as casas custam o dobro (não dispara)
//   sobreposicao   { id, ligada? }                        acende, apaga ou inverte uma peça de arte do mapa
//   alternar       { regiao, ligada? }                    liga, desliga ou inverte outra região (ou a própria)
//   teleporte      { x, y }                               leva quem pisou para a casa (x, y)
//
// `tamanhoMinimo` deixa de fora quem é menor (a laje rachada não cede sob o goblin, que é Pequeno).
//
// Quem quer mais que isso (ir para outra cena, uma conversa) ouve o evento `regiao` (`capitulo.naRegiao`), que traz o
// `resultado`: o dano que entrou e se o teste passou.
//
// Puro: roda em Node. O campo leva uma CÓPIA das regiões do mapa (`prepararRegioes`), porque `vezes`, `desligada` e
// `descoberta` mudam durante a partida e o mapa da cena é compartilhado entre partidas.

import { damageRoll } from '../core/dice.js';
import { key } from '../core/grid.js';
import { danoPorResistencia } from './passivas.js';
import { CONDITIONS, conditionEffects, hasCondition } from './conditions.js';
import { categoriaDeTamanho, categoriaDoNome } from './tamanho.js';

export const QUANDO = ['entrar', 'sair', 'comecaTurno', 'terminaTurno'];
export const QUEM = ['todos', 'grupo', 'inimigos'];
export const EFEITOS = ['texto', 'dano', 'condicao', 'parar', 'terrenoDificil', 'sobreposicao', 'alternar', 'teleporte'];

/** A cópia de trabalho das regiões de um mapa, pendurada no campo. Também refaz as casas de terreno difícil. */
export function prepararRegioes(field, regioes) {
  field.regioes = (regioes ?? []).map((r) => ({
    ...r,
    casas: new Set(r.casas ?? []),
    quando: r.quando?.length ? [...r.quando] : ['entrar'],
    efeitos: (r.efeitos ?? []).map((e) => ({ ...e })),
    disparos: 0,
    desligada: Boolean(r.desligada),
    descoberta: false,
  }));
  atualizarTerreno(field);
  return field.regioes;
}

/** O terreno difícil das regiões ligadas vai para o campo, onde `costOf` o lê. */
export function atualizarTerreno(field) {
  const casas = new Set();
  for (const r of field.regioes ?? []) {
    if (r.desligada || !r.efeitos.some((e) => e.tipo === 'terrenoDificil')) continue;
    for (const k of r.casas) casas.add(k);
  }
  field.dificeisDeRegiao = casas.size ? casas : null;
}

/** As casas que a pegada de `pos` cobre (a criatura Grande pisa quatro). */
function pegada(pos) {
  const f = pos.f ?? 1;
  const out = [];
  for (let dy = 0; dy < f; dy++) for (let dx = 0; dx < f; dx++) out.push(key(pos.x + dx, pos.y + dy));
  return out;
}

/** As regiões ligadas que cobrem alguma casa da pegada de `pos`. */
export function regioesEm(field, pos) {
  if (!field.regioes?.length || !pos) return [];
  const casas = pegada(pos);
  return field.regioes.filter((r) => !r.desligada && casas.some((k) => r.casas.has(k)));
}

/** A região vale para esta criatura agora? */
function pega(enc, r, c) {
  if (c.dead) return false;
  if (r.quem === 'grupo' && c.side !== 'party') return false;
  if (r.quem === 'inimigos' && c.side === 'party') return false;
  const minimo = categoriaDoNome(r.tamanhoMinimo);
  if (minimo != null && categoriaDeTamanho(c) < minimo) return false;
  if (!r.pegaQuemVoa && enc.voaAgora?.(c)) return false;
  // A armadilha descoberta: o grupo sabe dela e passa por fora.
  if (r.escondida && r.descoberta && c.side === 'party') return false;
  if (r.vezes && r.disparos >= r.vezes) return false;
  return r.efeitos.some((e) => e.tipo !== 'terrenoDificil');
}

/**
 * O passo de `de` até onde `c` está agora: dispara o `sair` das regiões que ficaram para trás e o `entrar` das
 * novas. Devolve `true` se o passo tem de acabar ali (parar, teleporte, condição que prende, ou caiu).
 */
export function regioesNoPasso(enc, c, de) {
  const field = enc.field;
  if (!field.regioes?.length) return false;
  const antes = regioesEm(field, de);
  const agora = regioesEm(field, c.pos);
  let para = false;
  for (const r of antes) if (!agora.includes(r) && r.quando.includes('sair')) para = disparar(enc, r, c, 'sair') || para;
  for (const r of agora) if (!antes.includes(r) && r.quando.includes('entrar')) para = disparar(enc, r, c, 'entrar') || para;
  return para || c.dead || hasCondition(c, 'inconsciente');
}

/** Começo ou fim do turno de um lado: quem está dentro de uma região com `comecaTurno` / `terminaTurno`. */
export function regioesNoTurno(enc, side, quando) {
  if (!enc.field.regioes?.length) return;
  for (const c of enc.allOf(side)) {
    if (c.dead || !c.pos) continue;
    for (const r of regioesEm(enc.field, c.pos)) if (r.quando.includes(quando)) disparar(enc, r, c, quando);
  }
}

/** Roda os efeitos de `r` em `c`. Devolve `true` se o passo tem de acabar. */
export function disparar(enc, r, c, quando) {
  if (!pega(enc, r, c)) return false;
  r.disparos += 1;
  const nome = r.nome || r.id;
  let para = false;
  const resultado = { dano: 0, passou: null };
  for (const e of r.efeitos) {
    if (c.dead) break;
    if (e.tipo === 'texto' && e.texto) {
      enc.say('acao', e.texto);
      enc.onEvent({ type: 'regiaoTexto', regiao: r, actor: c, texto: e.texto });
    } else if (e.tipo === 'dano' && e.dados) {
      const d = danoDaRegiao(enc, r, c, e, nome);
      resultado.dano += d.total;
      if (d.passou != null) resultado.passou = d.passou;
      // a condição de quem falhou no teste do dano, sem outro teste (a laje que cede deixa no chão)
      if (d.passou === false && e.seFalhar && !c.dead && !hasCondition(c, e.seFalhar) && !enc.imuneACondicao?.(c, e.seFalhar)) {
        if (enc.aplicarCondicao(c, e.seFalhar, { source: `regiao:${r.id}` })) {
          enc.say('condicao', `${nome}: ${c.name} fica ${CONDITIONS[e.seFalhar]?.name.toLowerCase() ?? e.seFalhar}.`);
        }
      }
    } else if (e.tipo === 'condicao' && e.condicao) {
      if (condicaoDaRegiao(enc, r, c, e, nome)) para = true;
    } else if (e.tipo === 'parar') {
      para = true;
    } else if (e.tipo === 'sobreposicao' && e.id) {
      enc.field.alternarSobreposicao?.(e.id, e.ligada);
    } else if (e.tipo === 'alternar' && e.regiao) {
      alternarRegiao(enc.field, e.regiao, e.ligada);
    } else if (e.tipo === 'teleporte' && Number.isInteger(e.x) && Number.isInteger(e.y)) {
      if (teleportar(enc, c, e)) para = true;
    }
  }
  if (r.vezes && r.disparos >= r.vezes && r.efeitos.every((e) => e.tipo !== 'terrenoDificil')) r.desligada = true;
  // A cena pode ouvir (ir para outra cena, uma conversa): é o "rodar macro" da Region do Foundry.
  enc.onEvent({ type: 'regiao', regiao: r, actor: c, quando, resultado });
  return para;
}

function danoDaRegiao(enc, r, c, e, nome) {
  const rolagem = damageRoll(enc.rng, e.dados);
  let total = rolagem.total;
  let conta = `${e.dados}[${rolagem.rolls.join('+')}]`;
  let r2 = null;
  let passou = null;
  if (e.teste?.atributo) {
    const save = enc.resistencia(c, e.teste.atributo, e.teste.cd ?? 10, { contra: { tipoDano: e.dano ?? null } });
    passou = save.success;
    r2 = enc.explicarResistencia(c, e.teste.atributo, e.teste.cd ?? 10, save, { contra: nome, seSucesso: e.teste.metade ? 'metade do dano' : 'nenhum dano' });
    total = danoPorResistencia(c, e.teste.atributo, Boolean(e.teste.metade), save.success, total, conditionEffects(c).incapacitated);
    conta = `${r2.conta} · ${conta}`;
  }
  enc.say('dano', `${nome}: ${c.name} sofre ${total}${e.dano ? ` de ${e.dano}` : ''}.`, conta, r2 ? { rolagem: r2 } : undefined);
  if (total > 0) enc.applyDamage(c, total, e.dano ?? null, null, {});
  return { total, passou };
}

/** Aplica a condição (com o teste, se houver). Devolve `true` se ela ficou. */
function condicaoDaRegiao(enc, r, c, e, nome) {
  if (hasCondition(c, e.condicao) || enc.imuneACondicao?.(c, e.condicao)) return false;
  const rotulo = CONDITIONS[e.condicao]?.name.toLowerCase() ?? e.condicao;
  let r2 = null;
  if (e.teste?.atributo) {
    const save = enc.resistencia(c, e.teste.atributo, e.teste.cd ?? 10, { contra: { condicao: e.condicao } });
    r2 = enc.explicarResistencia(c, e.teste.atributo, e.teste.cd ?? 10, save, { contra: nome, seSucesso: `não fica ${rotulo}` });
    if (save.success) {
      enc.say('condicao', `${nome}: ${c.name} resiste.`, r2.conta, { rolagem: r2 });
      return false;
    }
  }
  const ok = enc.aplicarCondicao(c, e.condicao, { source: `regiao:${r.id}`, ...(e.rodadas ? { rounds: e.rodadas } : {}), ...(e.teste?.cd ? { data: { escape: e.teste.cd } } : {}) });
  if (!ok) return false;
  enc.say('condicao', `${nome}: ${c.name} fica ${rotulo}.`, r2?.conta, r2 ? { rolagem: r2 } : undefined);
  return true;
}

/** Leva `c` para (x, y), ou para a casa livre mais perto dela. Devolve se levou. */
function teleportar(enc, c, e) {
  const f = enc.field;
  const livre = (x, y) => f.inside(x, y) && !f.blocksMove(x, y) && !enc.combatants.some((o) => o !== c && !o.dead && o.pos?.x === x && o.pos?.y === y);
  let alvo = null;
  for (let raio = 0; raio <= 3 && !alvo; raio++) {
    for (let dy = -raio; dy <= raio && !alvo; dy++) {
      for (let dx = -raio; dx <= raio && !alvo; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) === raio && livre(e.x + dx, e.y + dy)) alvo = { x: e.x + dx, y: e.y + dy };
      }
    }
  }
  if (!alvo) return false;
  const de = { ...c.pos };
  c.pos = { x: alvo.x, y: alvo.y, f: c.pos.f ?? 1 };
  enc.onEvent({ type: 'voltou', target: c, de, to: { ...c.pos } });
  return true;
}

/** Dá a região escondida de `id` por descoberta (a cena achou a armadilha por outro caminho, um Investigar dela). */
export function descobrirRegiao(field, id) {
  const r = field.regioes?.find((q) => q.id === id);
  if (!r || r.descoberta) return false;
  r.descoberta = true;
  return true;
}

/** Liga (`true`), desliga (`false`) ou inverte (sem argumento) a região de `id`. Devolve se mudou. */
export function alternarRegiao(field, id, ligada) {
  const r = field.regioes?.find((q) => q.id === id);
  if (!r) return false;
  const novo = ligada === undefined ? !r.desligada : !ligada;
  if (r.desligada === novo) return false;
  r.desligada = novo;
  if (!novo) r.disparos = 0;
  atualizarTerreno(field);
  return true;
}

/**
 * As regiões escondidas, no formato de armadilha que `game/armadilhas.js` e o Procurar (`game/investigar.js`) já
 * entendem. Disparar não faz nada aqui: quem dispara é o passo do motor (`regioesNoPasso`), para herói e monstro.
 */
export function armadilhasDasRegioes(enc) {
  return (enc?.field?.regioes ?? [])
    .filter((r) => r.escondida && !r.desligada)
    .map((r) => ({
      id: `regiao:${r.id}`,
      nome: r.nome || r.id,
      casas: [...r.casas].map((k) => { const [x, y] = k.split(',').map(Number); return { x, y }; }),
      cd: r.escondida.cd ?? 10,
      descoberta: r.descoberta,
      afeta: (c) => (r.quem !== 'inimigos' || c.side !== 'party') && (r.quem !== 'grupo' || c.side === 'party'),
      achado: r.escondida.achado || `${r.nome || 'Uma armadilha'}: dá para ver onde pisar.`,
      notar: (c, { mostrar = true } = {}) => {
        if (r.descoberta) return;
        r.descoberta = true;
        const texto = r.escondida.achado || `${r.nome || 'Uma armadilha'} no chão.`;
        enc.say('acao', `${c.name} nota: ${texto}`);
        // a tela mostra o que ele notou (o painel da cena, `main.js`); o Procurar já mostra o achado dele
        if (mostrar) enc.onEvent({ type: 'regiaoNotada', regiao: r, actor: c, texto });
      },
      descobrir: () => { r.descoberta = true; },
      disparar: () => {},
    }));
}
